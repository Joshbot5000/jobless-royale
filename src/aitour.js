// =====================================================================
//  AI TOURNAMENT — you and 7 AI opponents, knockout: quarter-final, semi-final, final.
//  Uses the arena and mode picked on the main menu. The AI gets tougher each round (Knight, Knight+, Champion);
//  the other AI-vs-AI matches are decided when you finish yours. No trophies change; Pay Packets as usual,
//  plus the Champion's bonus for winning the final. Progress survives going back to the menu.
// =====================================================================
let AITOUR=null;
const AIT_ROUNDS=['QUARTER-FINAL','SEMI-FINAL','FINAL'];
function aitNew(){ const th=THEMES[arenaIdx]; const mode=modeKey;
  const names=shuffle(THEMES.flatMap(t=>t.foes||[]).filter((v,i,a)=>a.indexOf(v)===i)).slice(0,7);
  while(names.length<7) names.push('Rival '+(names.length+1));
  const players=shuffle([{name:myTourName(),me:1}].concat(names.map(n=>({name:n}))));
  AITOUR={th:th.id,mode,players,round:0,matches:[],out:null,champ:null}; aitPair(); }
function myTourName(){ const n=(store.get('netName','')||'').trim(); return n||'You'; }
function aitPair(){ const T=AITOUR, alive=T.round===0?T.players.map((_,i)=>i):T.matches.filter(m=>m.r===T.round-1).map(m=>m.w);
  for(let i=0;i<alive.length;i+=2) T.matches.push({r:T.round,a:alive[i],b:alive[i+1],w:null}); }
function aitMine(){ const T=AITOUR; return T&&T.matches.find(m=>m.r===T.round&&m.w===null&&(T.players[m.a].me||T.players[m.b].me)); }
// finish the round: your result, then the AI-vs-AI matches
function aitResult(won){ const T=AITOUR, m=aitMine(); if(!m) return; const me=T.players[m.a].me?m.a:m.b, foe=me===m.a?m.b:m.a;
  m.w=won?me:foe; if(!won) T.out=T.round;
  for(const x of T.matches) if(x.r===T.round&&x.w===null) x.w=Math.random()<0.5?x.a:x.b;
  // knocked out: play the rest of the bracket out so you can see who wins
  while(true){ const cur=T.matches.filter(x=>x.r===T.round); if(cur.length===1){ T.champ=cur[0].w; break; } T.round++; aitPair(); if(T.out===null) break;
    for(const x of T.matches) if(x.r===T.round&&x.w===null) x.w=Math.random()<0.5?x.a:x.b; } }
function aitPlay(){ const T=AITOUR, m=aitMine(); if(!m) return;
  const ti=THEMES.findIndex(t=>t.id===T.th); if(ti<0){ AITOUR=null; return; }
  const foe=T.players[T.players[m.a].me?m.b:m.a].name, d0=diffIdx, a0=arenaIdx, m0=modeKey;
  arenaIdx=ti; modeKey=T.mode; diffIdx=[1,1,2][T.round]??2; $('#tour').hidden=true;
  startBattle(); arenaIdx=a0; modeKey=m0; diffIdx=d0;
  if(!G||$('#menu').hidden===false) return;   // deck was not ready: the menu is showing to fix it
  G.aitour=true; G.foe=foe; if(T.round===1) G.diff=Object.assign({},G.diff,{elixirMul:G.diff.elixirMul*1.08});
  G.banner=null; showBanner(AIT_ROUNDS[T.round],'vs '+foe,2.2,'#ffd34d'); }
// end of one of your tournament matches (called from showEnd)
function aitEnd(){ const T=AITOUR, w=G.winner, won=w===0, th=G.th; aitResult(won);
  const champ=won&&T.champ!=null&&T.players[T.champ].me;
  $('#endTitle').textContent=champ?'CHAMPION!':won?'VICTORY!':'KNOCKED OUT'; $('#endTitle').style.color=won?'#ffc83d':'#ff8a85';
  $('#cBlue').textContent='👑'.repeat(G.crowns[0])||'–'; $('#cRed').textContent='👑'.repeat(G.crowns[1])||'–'; $('#endFoe').textContent=G.foe;
  $('#endTro').textContent=champ?'🏆 You won the AI tournament!':won?`Through to the ${AIT_ROUNDS[T.round]}!`:`Out in the ${AIT_ROUNDS[T.out]}`;
  $('#endSub').textContent=champ?'Nobody could stop you.':won?'Next opponent is waiting.':`${T.players[T.champ].name} went on to win the tournament.`;
  const pk=payPacket(champ?'champ':won?'win':'loss',th.pool,G.myDeck||[]); showPacket($('#endPacket'),pk,champ?'🏆 CHAMPION\'S BONUS':won?'💼 PAY PACKET':'💼 CONSOLATION PAY');
  if(champ){ sfx('crown'); }
  $('#againBtn').hidden=!(won&&!champ); $('#againBtn').textContent='NEXT MATCH ▶'; $('#nextBtn').hidden=true; $('#menuBtn').textContent='BRACKET';
  if(champ||!won) T.done=true;
  $('#end').hidden=false; }
// the bracket, drawn on the tournament screen
function aitShow(){ $('#menu').hidden=true; $('#end').hidden=true; $('#tour').hidden=false; $('#tourStart').hidden=true; $('#tourSetup').hidden=true; $('#tourDeck').hidden=true; $('#tourPrize').hidden=true;
  const T=AITOUR, th=THEMES.find(t=>t.id===T.th)||THEMES[0], el=$('#tourBoard'); el.hidden=false;
  const nm=i=>{ const p=T.players[i]; return (p.me?'⭐ ':'')+String(p.name).replace(/[&<>"]/g,''); };
  let h=`<div class="tag">🤖 AI TOURNAMENT · ${th.emoji} ${th.name} · ${MODES[T.mode].icon} ${MODES[T.mode].name}</div>`;
  if(T.champ!=null) h+=`<div class="tourChamp">🏆<b>${nm(T.champ)}</b><span>TOURNAMENT CHAMPION</span></div>`;
  for(let r=Math.max(...T.matches.map(m=>m.r));r>=0;r--){ h+=`<h2>${AIT_ROUNDS[r]}</h2><div class="tourRound">`;
    for(const m of T.matches.filter(x=>x.r===r)){ const side=i=>`<span class="${m.w===i?'win':m.w!=null?'lose':''}${T.players[i].me?' me':''}">${nm(i)}</span>`;
      h+=`<div class="tm${m.w==null?' live':''}">${side(m.a)}<i>vs</i>${side(m.b)}<em>${m.w==null?'next':'✓'}</em></div>`; }
    h+='</div>'; }
  el.innerHTML=h; const mine=aitMine();
  tourStatus(mine?`Your ${AIT_ROUNDS[AITOUR.round].toLowerCase()}: tap PLAY when ready. Your ${th.name} deck is used (edit it on the menu).`:T.champ!=null&&T.players[T.champ].me?'🏆 You are the champion!':'Tournament over. Start a new one any time.');
  const go=$('#tourGo'); go.hidden=false; go.textContent=mine?`PLAY ${AIT_ROUNDS[AITOUR.round]}`:'NEW AI TOURNAMENT'; }
