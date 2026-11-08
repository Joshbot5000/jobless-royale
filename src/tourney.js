// =====================================================================
//  CLASS TOURNAMENT — one code for a whole room of players, knockout until one champion is left.
//  The organiser's device (a teacher's laptop or the class screen) runs the bracket; it plays no matches.
//  Coordination is tiny JSON messages over the same public MQTT brokers the online relay uses (star shape:
//  players -> organiser on .../d, organiser -> everyone on .../a; the full state is re-sent every 2s so a lost
//  message never matters). Each pairing then plays an ordinary Play-a-Friend match in its own room
//  (CODE + R<round> M<match>), the first-named player hosting, using the existing connection code in net.js.
//  ?net=local swaps MQTT for a BroadcastChannel so the automated test can run a whole tournament in tabs.
// =====================================================================
const TOUR={role:null,code:null,bus:null,st:null,me:NET_SID,editor:null,key:null,reported:{},hbT:null,tickT:null,lock:null};
function tourBus(code,role,onMsg){
  const seen=new Set(), order=[]; let seq=0;
  const rx=raw=>{ let m; try{ m=typeof raw==='string'?JSON.parse(raw):raw; }catch(e){ return; } if(!m||!m.f||m.f===NET_SID) return;
    if(m.to&&m.to!==NET_SID) return; const k=m.f+':'+m.n; if(seen.has(k)) return; seen.add(k); order.push(k); if(order.length>2000) seen.delete(order.shift());
    try{ onMsg(m.d,m.f); }catch(e){ console.error(e); } };
  const mine=role==='org'?'d':'a', theirs=role==='org'?'a':'d';
  if(NET_LOCAL){ const bc=new BroadcastChannel('jrt-'+code); bc.onmessage=e=>{ if(e.data.side===mine) rx(e.data.m); };
    return {send(d,to){ bc.postMessage({side:theirs,m:{f:NET_SID,n:++seq,to,d}}); },close(){ bc.close(); },up:()=>1}; }
  const base='jroyale2/t/'+code+'/', urls=netQ('mqtt')?netQ('mqtt').split(','):NET_MQTT, cls=urls.map(u=>mqttClient(u,base+mine,rx));
  return {send(d,to){ const raw=JSON.stringify({f:NET_SID,n:++seq,to,d}); for(const c of cls) c.publish(base+theirs,raw); },
    close(){ cls.forEach(c=>c.close()); }, up:()=>cls.filter(c=>c.up).length}; }
const tourName=()=>(($('#tourName').value||'').trim().slice(0,14))||'Player';
function tourStatus(h){ $('#tourStatus').innerHTML=h; }
function tourHide(){ $('#tour').hidden=true; }
function openTour(){ $('#menu').hidden=true; $('#online').hidden=true; $('#end').hidden=true; $('#tour').hidden=false; if(!$('#tourName').value) $('#tourName').value=store.get('netName','');
  if(!TOUR.role){ $('#tourStart').hidden=false; $('#tourSetup').hidden=true; $('#tourBoard').hidden=true; $('#tourDeck').hidden=true; tourStatus(''); if(!G) netCheckUpdate(); }
  else tourRender(); }
$('#tourBtn').onclick=()=>{ initAudio(); openTour(); };
$('#tourBack').onclick=()=>{ if(TOUR.role==='org'&&TOUR.st&&TOUR.st.phase==='play'&&!confirm('Close the tournament? Everyone\'s bracket stops.')) return; tourStop(); $('#tour').hidden=true; showMenu(); };
function tourStop(){ if(TOUR.bus) TOUR.bus.close(); clearInterval(TOUR.hbT); clearInterval(TOUR.tickT); try{ TOUR.lock&&TOUR.lock.release(); }catch(e){}
  Object.assign(TOUR,{role:null,code:null,bus:null,st:null,editor:null,key:null,reported:{},lock:null,champPaid:0}); NET.tour=null; $('#tourDeck').hidden=true; $('#tourDeck').innerHTML=''; $('#tourPrize').hidden=true; $('#tourGo').hidden=true; $('#tourBoard').innerHTML=''; }
const tourLink=code=>{ const base=/^https?:/.test(location.protocol)&&!netBlocked()?location.origin+location.pathname:APP_URL; return base+'?tour='+code; };
const roomOf=(code,m)=>code+'R'+m.r+'M'+m.i+(m.k?'X'+m.k:'');

// ---------------------------------------------------------------- organiser
$('#tourOrg').onclick=()=>{ $('#tourStart').hidden=true; $('#tourSetup').hidden=false;
  const sel=$('#tourArena'); sel.innerHTML=THEMES.map((t,i)=>`<option value="${i}"${i===arenaIdx?' selected':''}>${t.emoji} ${t.name}</option>`).join('');
  const ms=$('#tourMode'); ms.innerHTML=['classic','rush','sudden','rage'].map(k=>`<option value="${k}">${MODES[k].icon} ${MODES[k].name}</option>`).join(''); };
$('#tourCreate').onclick=()=>{
  tourStop(); TOUR.role='org'; TOUR.code=netMakeCode();
  TOUR.st={code:TOUR.code,arena:THEMES[+$('#tourArena').value].id,mode:$('#tourMode').value,eq:$('#tourEqual').checked?1:0,phase:'lobby',round:0,players:{},matches:[],champ:null,next:0};
  TOUR.bus=tourBus(TOUR.code,'org',tourOrgMsg);
  TOUR.hbT=setInterval(()=>tourOrgTick(),2000); tourBroadcast();
  try{ navigator.wakeLock&&navigator.wakeLock.request('screen').then(l=>TOUR.lock=l).catch(()=>{}); }catch(e){}
  $('#tourSetup').hidden=true; $('#tourBoard').hidden=false; tourRender(); };
function tourOrgMsg(d,from){ const S=TOUR.st; if(!S||!d) return; const p=S.players[from];
  if(d.t==='join'){ if(d.build!==BUILD){ TOUR.bus.send({t:'old'},from); return; }
    if(!p){ if(S.phase!=='lobby'){ TOUR.bus.send({t:'late'},from); return; } S.players[from]={name:String(d.name||'Player').slice(0,14),seen:Date.now(),out:0,bye:0}; tourBroadcast(); tourRender(); }
    else { p.seen=Date.now(); if(d.name&&p.name!==d.name){ p.name=String(d.name).slice(0,14); tourBroadcast(); } } return; }
  if(!p) return; p.seen=Date.now();
  if(d.t==='res'){ const m=S.matches.find(x=>x.id===d.m); if(!m||m.w||(from!==m.a&&from!==m.b)) return;
    if(d.w!==m.a&&d.w!==m.b) return;
    if(d.left){ const other=from===m.a?m.b:m.a; if(Date.now()-((S.players[other]||{}).seen||0)<12000){ m.k=(m.k||0)+1; tourBroadcast(); tourRender(); return; } } // they're still here: replay
    tourDecide(m,d.w); } }
function tourDecide(m,w){ const S=TOUR.st; m.w=w; const l=w===m.a?m.b:m.a; if(l&&S.players[l]) S.players[l].out=S.round;
  tourBroadcast(); tourRender(); tourMaybeNext(); }
function tourOnline(sid){ const p=TOUR.st.players[sid]; return p&&Date.now()-p.seen<15000; }
function tourOrgTick(){ const S=TOUR.st; if(!S) return;
  // walkovers: a player who has vanished for 45s loses their unfinished match
  if(S.phase==='play') for(const m of S.matches.filter(m=>m.r===S.round&&!m.w&&m.b)){
    const ga=Date.now()-S.players[m.a].seen, gb=Date.now()-S.players[m.b].seen;
    if(ga>45000&&gb<15000) tourDecide(m,m.b); else if(gb>45000&&ga<15000) tourDecide(m,m.a); }
  if(S.next&&Date.now()>=S.next){ S.next=0; tourRound(); }
  tourBroadcast(); tourRender(); }
function tourBroadcast(){ const S=TOUR.st; if(!S||!TOUR.bus) return;
  TOUR.bus.send({t:'st',s:{code:S.code,arena:S.arena,mode:S.mode,eq:S.eq,phase:S.phase,round:S.round,champ:S.champ,next:S.next?Math.max(0,Math.round((S.next-Date.now())/1000)):0,
    p:Object.entries(S.players).map(([sid,p])=>[sid,p.name,p.out,tourOnline(sid)?1:0]),m:S.matches.map(m=>[m.id,m.r,m.i,m.a,m.b||'',m.w||'',m.k||0])}}); }
function tourRound(){ const S=TOUR.st; const alive=Object.keys(S.players).filter(k=>!S.players[k].out&&(S.round>0||tourOnline(k)));
  if(S.round===0) for(const k of Object.keys(S.players)) if(!alive.includes(k)) delete S.players[k];   // never turned up
  if(alive.length<=1){ S.phase='done'; S.champ=alive[0]||null; tourBroadcast(); tourRender(); return; }
  S.round++; S.phase='play'; const pool=shuffle(alive.slice());
  if(pool.length%2){ pool.sort((a,b)=>S.players[a].bye-S.players[b].bye); const lucky=pool.shift(); S.players[lucky].bye++; S.matches.push({id:S.round+'-0',r:S.round,i:0,a:lucky,b:null,w:lucky}); shuffle(pool); }
  for(let i=0;i<pool.length;i+=2) S.matches.push({id:S.round+'-'+(i/2+1),r:S.round,i:i/2+1,a:pool[i],b:pool[i+1],w:null,k:0});
  sfx('crown'); tourBroadcast(); tourRender(); tourMaybeNext(); }
function tourMaybeNext(){ const S=TOUR.st; if(S.phase!=='play') return; const cur=S.matches.filter(m=>m.r===S.round);
  if(cur.every(m=>m.w)&&!S.next){ const left=Object.keys(S.players).filter(k=>!S.players[k].out); if(left.length<=1){ S.phase='done'; S.champ=left[0]; sfx('crown'); tourBroadcast(); tourRender(); return; } S.next=Date.now()+12000; tourBroadcast(); tourRender(); } }
$('#tourGo').onclick=()=>{ const S=TOUR.st; if(!S) return; if(S.phase==='lobby'){ const n=Object.keys(S.players).filter(tourOnline).length; if(n<2){ tourStatus('⚠️ Need at least 2 players.'); return; } tourRound(); } else if(S.next){ S.next=0; tourRound(); } };
// organiser overrides: kick a player in the lobby, or award a match (someone's phone died, a match got stuck)
$('#tourBoard').addEventListener('click',e=>{ const S=TOUR.st; if(TOUR.role!=='org'||!S) return; const k=e.target.closest('[data-kick]'), a=e.target.closest('[data-award]');
  if(k&&S.phase==='lobby'){ delete S.players[k.dataset.kick]; tourBroadcast(); tourRender(); }
  if(a){ const [mid,sid]=a.dataset.award.split('|'), m=S.matches.find(x=>x.id===mid); if(m&&!m.w&&confirm(`Award this match to ${S.players[sid].name}?`)) tourDecide(m,sid); } });

// ---------------------------------------------------------------- player
$('#tourJoin').onclick=()=>tourJoin();
$('#tourCode').addEventListener('keydown',e=>{ if(e.key==='Enter') tourJoin(); });
function tourJoin(code){
  code=(code||$('#tourCode').value).trim().toUpperCase().replace(/[^A-Z0-9]/g,''); if(code.length<4){ tourStatus('Type the tournament code from the board.'); return; }
  tourStop(); TOUR.role='player'; TOUR.code=code; store.set('netName',tourName()); $('#netName').value=tourName();
  TOUR.bus=tourBus(code,'player',tourPlayerMsg);
  const hello=()=>TOUR.bus.send({t:'join',name:tourName(),build:BUILD});
  hello(); TOUR.hbT=setInterval(hello,3000); TOUR.tickT=setInterval(tourPlayerTick,1000);
  $('#tourStart').hidden=true; $('#tourBoard').hidden=false; tourStatus(`Looking for tournament <b>${code}</b>…`); tourRender(); }
function tourPlayerMsg(d){
  if(d.t==='old'){ tourStatus('Updating your game to match the tournament…'); const c=TOUR.code; netCheckUpdate({tour:c}).then(up=>{ if(up!==true) tourStatus('⚠️ Your game is a different version from the organiser\'s. Close the app fully, reopen it and join again.'); }); return; }
  if(d.t==='late'){ tourStatus('⚠️ That tournament has already started.'); return; }
  if(d.t!=='st') return; const first=!TOUR.st; TOUR.st=d.s;
  if(first||!TOUR.editor){ const th=THEMES.find(t=>t.id===d.s.arena); if(th&&!G){ $('#tourDeck').hidden=false; TOUR.editor=deckEditor($('#tourDeck'),th,false); } }
  if(!$('#tour').hidden) tourRender(); }
function tourMine(){ const S=TOUR.st; if(!S) return null; const a=S.m.find(m=>m[1]===S.round&&(m[3]===TOUR.me||m[4]===TOUR.me)); if(!a) return null;
  return {id:a[0],r:a[1],i:a[2],a:a[3],b:a[4]||null,w:a[5]||null,k:a[6]}; }
const tourNameOf=sid=>{ const p=TOUR.st&&TOUR.st.p.find(x=>x[0]===sid); return p?p[1]:'?'; };
function tourPlayerTick(){ const S=TOUR.st; if(!S||S.phase!=='play') return; const m=tourMine();
  if(NET.tour&&NET.role&&!(G&&G.online)&&(!m||m.w||NET.tour.match!==m.id)){ netReset(); NET.tour=null; tourRender(); }   // walkover / round moved on while still connecting
  if(!m||m.w||!m.b) return;
  const key=m.id+':'+m.k; if(TOUR.key===key) return;               // already connecting to / playing this one
  if(G&&G.online){ if(G.over) return; netReset(); G=null; }         // replay ordered while a stale match lingers
  TOUR.key=key; const th=THEMES.findIndex(t=>t.id===S.arena), host=m.a===TOUR.me, foe=host?m.b:m.a;
  NET.tour={code:S.code,arena:th,mode:S.mode,eq:!!S.eq,match:m.id,foe:tourNameOf(foe),foeSid:foe};
  const room=roomOf(S.code,m); $('#netName').value=tourName();
  tourStatus(`⚔️ Round ${m.r}: you vs <b>${tourNameOf(foe)}</b>. Connecting…`); sfx('crown'); buzz(40);
  if(host) netHost(room); else setTimeout(()=>{ if(TOUR.key===key&&!(G&&G.online)){ $('#netCode').value=room; netJoin(); } },1500); }
// called from showEnd for a tournament match (both phones report; the organiser takes the first)
function tourReport(w){ const t=NET.tour; if(!t||TOUR.reported[t.match+':'+TOUR.key]) return; TOUR.reported[t.match+':'+TOUR.key]=1;
  const win=w===0?TOUR.me:t.foeSid; const send=()=>TOUR.bus&&TOUR.bus.send({t:'res',m:t.match,w:win}); send(); setTimeout(send,1500); setTimeout(send,4000); }
function tourLeft(){ const t=NET.tour; if(!t||!TOUR.bus) return; TOUR.bus.send({t:'res',m:t.match,w:TOUR.me,left:1}); TOUR.key=null; }
function tourBackFromMatch(){ netReset(); NET.tour=null; G=null; $('#end').hidden=true; $('#pause').hidden=true; openTour(); Music.stop(); }

// ---------------------------------------------------------------- the board (both sides)
function tourRender(){ const S=TOUR.role==='org'?null:TOUR.st, O=TOUR.role==='org'?TOUR.st:null; const el=$('#tourBoard'); if(!TOUR.role) return;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let players, matches, phase, round, champ, next, arena, mode, eq;
  if(O){ players=Object.entries(O.players).map(([sid,p])=>[sid,p.name,p.out,tourOnline(sid)?1:0]); matches=O.matches.map(m=>[m.id,m.r,m.i,m.a,m.b||'',m.w||'',m.k||0]); ({phase,round,champ,arena,mode,eq}=O); next=O.next?Math.max(0,Math.round((O.next-Date.now())/1000)):0; }
  else if(S){ players=S.p; matches=S.m; ({phase,round,champ,next,arena,mode,eq}=S); }
  else { el.innerHTML=''; return; }
  const nm=sid=>{ const p=players.find(x=>x[0]===sid); return p?esc(p[1]):'?'; }, th=THEMES.find(t=>t.id===arena)||THEMES[0];
  let h='';
  if(O) h+=`<div class="tourCode"><span>JOIN CODE</span><b>${O.code}</b><small>Open Jobless Royale → 🏆 TOURNAMENT → type the code<br>${esc(tourLink(O.code).replace(/^https?:\/\//,''))}</small></div>`;
  h+=`<div class="tag">${th.emoji} ${th.name} · ${MODES[mode].icon} ${MODES[mode].name}${eq?' · ⚖️ Equal levels':''}</div>`;
  if(phase==='lobby'){ h+=`<h2>PLAYERS · ${players.filter(p=>p[3]).length}</h2><div class="tourPlayers">${players.map(p=>`<span class="tp${p[0]===TOUR.me?' me':''}${p[3]?'':' off'}">${nm(p[0])}${O?` <i data-kick="${p[0]}" title="Remove">✕</i>`:''}</span>`).join('')||'<span class="dim">Nobody yet…</span>'}</div>`; }
  if(phase==='done'){ h+=`<div class="tourChamp">🏆<b>${champ?nm(champ):'Nobody'}</b><span>TOURNAMENT CHAMPION</span></div>`; }
  for(let r=round;r>=1;r--){ const ms=matches.filter(m=>m[1]===r); if(!ms.length) continue; const left=players.filter(p=>!p[2]||p[2]>=r).length;
    h+=`<h2>${ms.length===1&&ms[0][4]&&!ms.some(m=>!m[4])?'FINAL':ms.length===2&&ms.every(m=>m[4])?'SEMI-FINALS':'ROUND '+r}</h2><div class="tourRound">`;
    for(const m of ms){ const [id,,,a,b,w,k]=m;
      if(!b){ h+=`<div class="tm bye"><span class="win">${nm(a)}</span><em>bye: straight through</em></div>`; continue; }
      const side=sid=>`<span class="${w===sid?'win':w?'lose':''}${sid===TOUR.me?' me':''}"${O&&!w?` data-award="${id}|${sid}"`:''}>${nm(sid)}</span>`;
      h+=`<div class="tm${w?'':' live'}">${side(a)}<i>vs</i>${side(b)}<em>${w?'✓':k?'replaying…':'⚔️ playing'}</em></div>`; }
    h+='</div>'; }
  el.innerHTML=h;
  // status line
  if(O){ $('#tourGo').hidden=!(phase==='lobby'||next); $('#tourGo').textContent=phase==='lobby'?'START TOURNAMENT':`NEXT ROUND NOW (${next}s)`;
    tourStatus(phase==='lobby'?`Players join with the code above. Keep this screen open.${TOUR.bus&&!TOUR.bus.up()?'<br>🔴 Can\'t reach the online servers. Check the internet.':''}`:phase==='done'?'🎉 That\'s a wrap! Tap BACK to close the tournament.':next?`Round ${round} complete! Next round in ${next}s…`:`Round ${round} in progress. Tap a name to award a stuck match.`); return; }
  $('#tourGo').hidden=true; if(!S) return; const me=players.find(p=>p[0]===TOUR.me), m=tourMine();
  if(!me){ tourStatus(`Joining tournament <b>${TOUR.code}</b>…`); return; }
  if(phase==='lobby') tourStatus(`✅ You're in, <b>${esc(me[1])}</b>! Waiting for the organiser to start…<br><span class="dim">Get your deck ready below.</span>`);
  else if(phase==='done') tourStatus(champ===TOUR.me?'🏆 YOU ARE THE CHAMPION!':'Tournament over. Well played!');
  else if(me[2]) tourStatus(`Knocked out in round ${me[2]}. Stay to see who wins!`);
  else if(m&&m.w) tourStatus(m.b?`✅ You won round ${m.r}! ${next?'Next round in '+next+'s…':'Waiting for the other matches…'}`:`🎟️ Bye: you go straight through round ${m.r}! ${next?'Next round in '+next+'s…':'Waiting for the other matches…'}`);
  else if(m&&TOUR.key!==m.id+':'+m.k) tourStatus(`⚔️ Round ${m.r}: you vs <b>${nm(m.a===TOUR.me?m.b:m.a)}</b>. Get ready!`);
  if(phase==='done'&&champ===TOUR.me&&!TOUR.champPaid){ TOUR.champPaid=1; const th2=THEMES.find(t=>t.id===arena); const pk=payPacket('champ',th2.pool,loadDeck(th2)); tourStatus('🏆 YOU ARE THE CHAMPION! Here\'s your prize:'); showPacket($('#tourPrize'),pk,'🏆 CHAMPION\'S BONUS'); sfx('crown'); }
}
// invite links: ...?tour=CODE opens the tournament screen and joins
(function(){ const q=new URLSearchParams(location.search), c=(q.get('tour')||'').toUpperCase().replace(/[^A-Z0-9]/g,''); if(!c||AUTOTEST) return;
  q.delete('tour'); const rest=q.toString(); history.replaceState(null,'',location.pathname+(rest?'?'+rest:''));
  setTimeout(()=>{ openTour(); $('#tourCode').value=c; if(store.get('netName','')) tourJoin(c); else tourStatus('Type your name, then tap JOIN.'); },400); })();
