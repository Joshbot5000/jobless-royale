// =====================================================================
//  ONLINE — play a friend on another phone.
//  The room creator's phone (host) runs the real battle as team 0. The friend's phone (guest)
//  runs no simulation: it sends its card plays / taps / emotes to the host and draws a mirrored
//  copy of the host's battle from snapshots (~12 per second), so the guest also sees its own
//  towers at the bottom. One-shot effects (bursts, rings, callouts, sounds, feed lines) are
//  recorded on the host and replayed on the guest.
//  Transport: Trystero (WebRTC data channel; signalling over public Nostr relays + WebTorrent trackers), or BroadcastChannel
//  between two tabs when the page is opened with ?net=local (used by the automated tests).
// =====================================================================
const NET={rooms:[],peers:new Map(),role:null,peer:null,conn:null,code:null,rec:false,ev:[],nid:0,sendT:0,friend:'Friend',friendDeck:null,ready:false,
  guestWantsRematch:false,last:null,towerMap:null,objs:new Map(),units:new Map(),projs:new Map(),orbs:new Map(),clouds:[],snapT:0,lastSnapAt:0,elixRate:1};
const NET_VER=Object.keys(CARDS).length+'/'+THEMES.length;
const NET_LOCAL=/[?&]net=local/.test(location.search);
const MX=x=>AW-x, MY=y=>AH-y, MT=t=>t===0?1:t===1?0:t;
const r2=v=>Math.round(v*100)/100;

// ---------------------------------------------------------------- transport
function netMakeCode(){ const C='BCDFGHJKLMNPRSTVZ', V='AEIOU'; let s=''; for(let i=0;i<4;i++) s+=(i%2?V:C)[Math.random()*(i%2?5:17)|0]; return s+(10+(Math.random()*90|0)); }
function netStatus(html){ $('#netStatus').innerHTML=html; }
function localConn(code,role){ // BroadcastChannel pair, same API subset as a PeerJS DataConnection
  const bc=new BroadcastChannel('jroyale-'+code), h={}; const c={open:true,on(ev,f){ (h[ev]=h[ev]||[]).push(f); return c; },send(d){ bc.postMessage({from:role,d}); },close(){ bc.postMessage({from:role,bye:1}); bc.close(); c.open=false; }};
  bc.onmessage=e=>{ const m=e.data; if(m.from===role) return; if(m.bye){ (h.close||[]).forEach(f=>f()); return; } (h.data||[]).forEach(f=>f(m.d)); };
  setTimeout(()=>(h.open||[]).forEach(f=>f()),30); return c;
}
function netSetupConn(c){
  NET.conn=c;
  c.on('data',d=>{ try{ netOnMessage(d); }catch(e){ console.error(e); } });
  // host still in the lobby: keep the room open for them to come back instead of closing it
  const lost=why=>{ if(NET.conn!==c) return; if(NET.role==='host'&&!(G&&G.online)&&!NET_LOCAL){ NET.conn=null; NET.ready=false; $('#netStart').hidden=true; netShowCode(); netStatus($('#netStatus').innerHTML.replace('Waiting for them…',NET.friend+' disconnected. Waiting for them to rejoin…')); netWatch(); return; }
    if(NET.role==='guest'&&!(G&&G.online)&&!NET_LOCAL&&((NET.rooms&&NET.rooms.length)||NET.mq)){ NET.conn=null; NET.ready=false; netStatus('Lost the room. Reconnecting…'); netWatch(); return; }  // guest in the lobby: rooms are still joined, the host will reappear
    netLost(why); };
  c.on('close',()=>lost('Your friend left.'));
  c.on('error',()=>lost('Connection lost.'));
}
function netSend(m){ if(NET.conn&&NET.conn.open!==false){ try{ NET.conn.send(m); }catch(e){} } }
// Finding each other: both phones join the same room on TWO independent families of free public signalling servers at
// once (Nostr relays and WebTorrent trackers, via Trystero). Each family is several servers, so one server or even a
// whole family being down doesn't matter: whichever answers first connects the phones. After that the battle runs over
// a direct WebRTC data channel and no server is involved.
const NET_APP='jobless-royale-v2';
const NET_TURN=[{urls:['turn:eu-0.turn.peerjs.com:3478','turn:us-0.turn.peerjs.com:3478'],username:'peerjs',credential:'peerjsp'}];
const NET_SID=Math.random().toString(36).slice(2,10);           // this page's session id: spots the same friend arriving over two networks
const netQ=k=>new URLSearchParams(location.search).get(k);
const netBlocked=()=>{ try{ return window.top!==window.self; }catch(e){ return true; } }; // inside the claude.ai page, where WebRTC is blocked
const APP_URL='https://joshbot5000.github.io/jobless-royale/';
// join room CODE on every network; onConn(conn) fires for each friend connection that opens (possibly one per network)
function netJoinRooms(code,onConn){
  const T=window.Trystero, test=netQ('nostrrelay')||netQ('torrentrelay')||netQ('mqtt'); NET.rooms=[]; NET.peers=new Map();
  for(const kind of ['nostr','torrent']){
    if(!T||!T[kind]) continue; const urls=netQ(kind+'relay'); if(test&&!urls) continue;   // tests: only the local servers given
    try{
      const cfg={appId:NET_APP,turnConfig:NET_TURN,relayConfig:urls?{urls:urls.split(',')}:{redundancy:kind==='nostr'?10:5,warnOnRelayFailure:false}};
      const room=T[kind].joinRoom(cfg,'room-'+code), act=room.makeAction('m'), entry={kind,room,act};
      act.onMessage=(d,meta)=>{ const c=NET.peers.get(kind+':'+(meta&&meta.peerId)); if(c&&c.open) c._fire('data',d); };
      room.onPeerJoin=id=>{ if(!NET.rooms.includes(entry)) return; const c=netPeerConn(entry,id); NET.peers.set(kind+':'+id,c); onConn(c); };
      room.onPeerLeave=id=>{ const k=kind+':'+id, c=NET.peers.get(k); NET.peers.delete(k); if(c&&c.open){ c.open=false; c._fire('close'); } };
      NET.rooms.push(entry);
    }catch(e){ console.warn('signalling '+kind+' failed',e); }
  }
  return NET.rooms.length;
}
function netPeerConn(entry,id){ const h={};
  const c={open:true,kind:entry.kind,peerId:id,on(ev,f){ (h[ev]=h[ev]||[]).push(f); return c; },
    send(d){ if(c.open){ try{ entry.act.send(d,{target:id}); }catch(e){} } },
    close(){ if(!c.open) return; c.send({t:'_bye'}); c.open=false; },                // local close: tell them, don't fire our own handlers
    _fire(ev,x){ if(ev==='data'&&x&&x.t==='_bye'){ if(c.open){ c.open=false; (h.close||[]).forEach(f=>f()); } return; } (h[ev]||[]).forEach(f=>{ try{ f(x); }catch(e){ console.error(e); } }); } };
  return c; }
function netLeaveRooms(){ for(const r of NET.rooms||[]){ try{ r.room.leave(); }catch(e){} } NET.rooms=[]; if(NET.peers) NET.peers.clear(); }
// how many signalling servers this phone currently reaches (shown while waiting, so a dead connection is obvious)
function netServers(){ const T=window.Trystero; let n=0; if(!T) return netRelayUp();
  for(const k of ['nostr','torrent']){ try{ const s=T[k].getRelaySockets?T[k].getRelaySockets():{}; for(const u in s) if(s[u]&&s[u].readyState===1) n++; }catch(e){} } return n+netRelayUp(); }
// ---------------------------------------------------------------- relay fallback (MQTT)
// When the phones can't open a direct link (typical when BOTH are on mobile data and the free TURN relay is down),
// the game messages go through public MQTT message brokers instead: ordinary secure websockets that work on any
// network. Three brokers at once; every message goes to all of them and duplicates are dropped.
const NET_MQTT=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081/mqtt'];
function mqttClient(url,topic,onMsg){ // minimal MQTT 3.1.1 over websocket: connect, subscribe, QoS-0 publish, keepalive
  const enc=new TextEncoder(), dec=new TextDecoder(), cl={url,up:false,alive:true,ws:null};
  const vlen=n=>{ const o=[]; do{ let d=n%128; n=Math.floor(n/128); if(n>0) d|=128; o.push(d); }while(n>0); return o; };
  const s16=s=>{ const b=enc.encode(s), o=new Uint8Array(b.length+2); o[0]=b.length>>8; o[1]=b.length&255; o.set(b,2); return o; };
  const cat=(...a)=>{ const n=a.reduce((t,x)=>t+x.length,0), o=new Uint8Array(n); let i=0; for(const x of a){ o.set(x,i); i+=x.length; } return o; };
  const pkt=(h,body)=>cat(Uint8Array.of(h,...vlen(body.length)),body);
  const send=b=>{ try{ if(cl.ws&&cl.ws.readyState===1) cl.ws.send(b); }catch(e){} };
  let buf=new Uint8Array(0), ping=null, retry=1000;
  cl.publish=(t,payload)=>{ if(cl.up) send(pkt(0x30,cat(s16(t),enc.encode(payload)))); };
  cl.close=()=>{ cl.alive=false; cl.up=false; clearInterval(ping); try{ cl.ws&&cl.ws.close(); }catch(e){} };
  const open=()=>{ if(!cl.alive) return; let ws; try{ ws=new WebSocket(url,['mqtt']); }catch(e){ return later(); } cl.ws=ws; ws.binaryType='arraybuffer'; buf=new Uint8Array(0);
    ws.onopen=()=>{ send(pkt(0x10,cat(Uint8Array.of(0,4,77,81,84,84,4,2,0,30),s16('jr'+Math.random().toString(36).slice(2,12))))); clearInterval(ping); ping=setInterval(()=>send(Uint8Array.of(0xC0,0)),20000); };
    ws.onmessage=e=>{ buf=cat(buf,new Uint8Array(e.data));
      for(;;){ if(buf.length<2) break; let m=1,n=0,i=1,b; do{ if(i>=buf.length) return; b=buf[i++]; n+=(b&127)*m; m*=128; }while(b&128); if(buf.length<i+n) break;
        const h=buf[0], body=buf.subarray(i,i+n); buf=buf.slice(i+n); const type=h>>4;
        if(type===2&&body[1]===0){ cl.up=true; retry=1000; send(pkt(0x82,cat(Uint8Array.of(0,1),s16(topic),Uint8Array.of(0)))); }
        else if(type===3){ const tl=(body[0]<<8)|body[1], q=(h>>1)&3, off=2+tl+(q?2:0); try{ onMsg(dec.decode(body.subarray(off))); }catch(e){ console.error(e); } } } };
    ws.onclose=ws.onerror=()=>{ if(cl.ws!==ws) return; cl.ws=null; cl.up=false; clearInterval(ping); later(); }; };
  const later=()=>{ if(!cl.alive) return; setTimeout(open,retry); retry=Math.min(retry*2,15000); };
  open(); return cl; }
// side 'h' (host) listens on .../h and talks on .../g; the guest the other way round
function netRelayStart(code,side,onConn){
  const test=netQ('nostrrelay')||netQ('torrentrelay')||netQ('mqtt'), urls=netQ('mqtt')?netQ('mqtt').split(','):test?[]:NET_MQTT;
  const base='jroyale2/'+code+'/', mine=base+side, theirs=base+(side==='h'?'g':'h');
  const R=NET.mq={clients:[],conns:new Map(),seen:new Set(),order:[],seq:0,theirs};
  const onMsg=raw=>{ if(NET.mq!==R) return; let m; try{ m=JSON.parse(raw); }catch(e){ return; } if(!m||!m.f||m.f===NET_SID||(m.to&&m.to!==NET_SID)) return;
    const key=m.f+':'+m.n; if(R.seen.has(key)) return; R.seen.add(key); R.order.push(key); if(R.order.length>800) R.seen.delete(R.order.shift());
    if(side==='g'&&NET.friendSid&&m.f!==NET.friendSid) return;
    const k=side==='g'?'host':m.f; let c=R.conns.get(k);            // a guest only ever talks to the one host
    if(!c){ if(side==='g') return; c=netRelayConn(m.f); R.conns.set(k,c); onConn(c); }   // host: a new friend; attach handlers before the first message
    c.rx(m); };
  for(const u of urls) R.clients.push(mqttClient(u,mine,onMsg));
  return R; }
function netRelayConn(peer){ const R=NET.mq, h={}, key=peer||'host'; let lastRx=Date.now(), lastS=-1;
  const c={open:true,kind:'relay',peerId:peer,on(ev,f){ (h[ev]=h[ev]||[]).push(f); return c; },
    send(d){ if(!c.open||NET.mq!==R) return; const raw=JSON.stringify(peer?{f:NET_SID,to:peer,n:++R.seq,d}:{f:NET_SID,n:++R.seq,d}); for(const cl of R.clients) cl.publish(R.theirs,raw); },
    close(){ if(!c.open) return; c.send({t:'_bye'}); c.open=false; clearInterval(c.hb); R.conns.delete(key); },
    fire(ev,x){ (h[ev]||[]).forEach(f=>{ try{ f(x); }catch(e){ console.error(e); } }); },
    rx(m){ lastRx=Date.now(); c.got=true; const d=m.d; if(!d||!c.open) return; if(d.t==='_p') return;
      if(d.t==='_bye'){ c.open=false; clearInterval(c.hb); R.conns.delete(key); c.fire('close'); return; }
      if(d.t==='s'){ if(m.n<lastS) return; lastS=m.n; } c.fire('data',d); } };
  c.hb=setInterval(()=>{ if(!c.open) return clearInterval(c.hb); c.send({t:'_p'}); if(c.got&&Date.now()-lastRx>15000){ c.open=false; clearInterval(c.hb); R.conns.delete(key); c.fire('close'); } },2000);
  return c; }
function netRelayStop(){ const R=NET.mq; if(!R) return; for(const c of R.conns.values()) try{ c.close(); }catch(e){} setTimeout(()=>R.clients.forEach(cl=>cl.close()),150); NET.mq=null; }
const netRelayUp=()=>NET.mq?NET.mq.clients.filter(c=>c.up).length:0;
function netHost(fixed){ // fixed: re-open the same room code (after an automatic update)
  netReset(); NET.role='host'; NET.code=fixed||netMakeCode(); store.set('netName',myName());
  $('#netCreate').disabled=true; $('#netJoin').disabled=true;
  if(NET_LOCAL){ const bc=new BroadcastChannel('jroyale-'+NET.code+'-lobby'); bc.onmessage=()=>{ bc.close(); netSetupConn(localConn(NET.code,'host')); }; NET.lobbyBC=bc; netShowCode(); return; }
  const n=window.Trystero?netJoinRooms(NET.code,netHostConn):0; netRelayStart(NET.code,'h',netHostConn);
  if(!n&&!NET.mq.clients.length){ netStatus('⚠️ Online play could not load. Check your internet and reopen the app.'); netResetButtons(); return; }
  netShowCode(); netWatch();
}
// a friend's phone connected over one of the networks: introduce ourselves; adopt it when it says hello
function netHostConn(c){
  c.send({t:'iam',host:1,sid:NET_SID});
  c.on('data',d=>{ if(NET.conn===c||!d||d.t!=='hello'||NET.role!=='host') return;
    if(NET.conn&&NET.conn.open!==false){ if(d.sid===NET.friendSid) return; if(NET.ready||(G&&G.online)){ c.send({t:'full'}); return; } }  // same friend on a 2nd network: ignore
    if(NET.conn&&NET.conn!==c){ const o=NET.conn; NET.conn=null; try{ o.close(); }catch(e){} }
    NET.friendSid=d.sid; netSetupConn(c); netOnMessage(d); });
}
function netLink(){ const base=/^https?:/.test(location.protocol)&&!netBlocked()?location.origin+location.pathname:APP_URL; return base+'?room='+NET.code; }
function netShowCode(){ NET.shown=true; netStatus(`Your room code<span class="bigcode">${NET.code}</span>Tap 📤 SEND INVITE: your friend just taps the link. (Or they tap PLAY A FRIEND, type the code, then JOIN.)\nKeep this screen open. Waiting for them…<span class="netdiag" id="netDiag"></span>`); $('#netShare').hidden=false; }
// every second while waiting: show how many servers we reach, so "nothing happening" is never silent
function netWatch(){ clearInterval(NET.watchT); NET.t0=Date.now();
  NET.watchT=setInterval(()=>{ if(!NET.role||NET.ready||(G&&G.online)){ clearInterval(NET.watchT); return; }
    const n=netServers(), s=Math.round((Date.now()-NET.t0)/1000);
    if(NET.role==='guest'&&(!NET.conn||NET.conn.kind==='relay')){ netStatus(`Looking for room <b>${NET.code}</b>… ${s}s<br>`+(n?`Connected to ${n} online server${n>1?'s':''}. ${s>15?'Make sure your friend still has the room screen open (if they left the app, ask them to open it again).':''}`:(s>8?'⚠️ Can\'t reach any online servers yet. Check your internet (try switching between wifi and mobile data).':'Reaching online servers…'))); }
    else { const el=$('#netDiag'); if(el) el.textContent=n?`🟢 Room is live on ${n} online server${n>1?'s':''}`:(s>8?'🔴 Can\'t reach online servers. Check your internet.':'⏳ Opening room…'); } },1000); }
function netJoin(){
  const code=$('#netCode').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,''); if(code.length<4){ netStatus('Type the code your friend sees on their screen.'); return; }
  netReset(); NET.role='guest'; NET.code=code; store.set('netName',myName());
  $('#netCreate').disabled=true; $('#netJoin').disabled=true; netStatus('Looking for room <b>'+code+'</b>…');
  const hello=()=>netSend({t:'hello',name:myName(),ver:NET_VER,build:BUILD,sid:NET_SID});
  if(NET_LOCAL){ const c=localConn(code,'guest'); netSetupConn(c); const bc=new BroadcastChannel('jroyale-'+code+'-lobby'); bc.postMessage(1); bc.close(); setTimeout(hello,120); return; }
  // adopt the first connection that says it's the host; ignore the same host arriving over a second network
  netJoinRooms(code,c=>c.on('data',d=>{ if(!d||d.t!=='iam'||!d.host||NET.role!=='guest') return; if(NET.conn&&NET.conn.open!==false) return;
    NET.friendSid=d.sid; netSetupConn(c); netStatus('Connected! Joining…'); hello(); }));
  // no direct link after 7s? go through the relay brokers instead (and keep saying hello until the host answers)
  netRelayStart(code,'g',()=>{}); const t0=Date.now();
  NET.relayT=setInterval(()=>{ if(NET.role!=='guest'||NET.ready||!NET.mq){ clearInterval(NET.relayT); return; }
    if(NET.conn&&NET.conn.kind==='relay'&&NET.conn.open){ hello(); return; }
    if(!NET.conn&&Date.now()-t0>7000&&netRelayUp()){ const c=netRelayConn(null); NET.mq.conns.set('host',c); netSetupConn(c); hello(); } },2500);
  if(!NET.rooms.length&&!NET.mq.clients.length){ netStatus('⚠️ Online play could not load. Check your internet and reopen the app.'); netResetButtons(); return; }
  netWatch(); $('#netJoin').disabled=true;
}
function netErr(e){ return e.type==='network'||e.type==='server-error'?'Could not reach the online service. Check your internet and try again.':e.type==='browser-incompatible'?'This browser does not support online play.':'Online error ('+(e.type||'unknown')+'). Try again.'; }
function myName(){ const v=($('#netName').value||'').trim().slice(0,14); return v||'Player'; }
function netResetButtons(){ $('#netCreate').disabled=false; $('#netJoin').disabled=false; $('#netStart').hidden=true; $('#netShare').hidden=true; }
function netReset(){ clearInterval(NET.watchT); clearInterval(NET.relayT); try{ if(NET.conn) NET.conn.close(); }catch(e){} netLeaveRooms(); netRelayStop(); try{ if(NET.lobbyBC) NET.lobbyBC.close(); }catch(e){}
  Object.assign(NET,{pending:null,shown:false,role:null,peer:null,conn:null,code:null,rec:false,ev:[],ready:false,friendDeck:null,guestWantsRematch:false,last:null,towerMap:null,lobbyBC:null}); NET.objs.clear(); NET.units.clear(); NET.projs.clear(); NET.orbs.clear(); NET.clouds=[]; }
function netLost(why){
  if(!NET.role) return; const inMatch=!!(G&&G.online); netReset();
  if(inMatch){ if(!G.over){ G.over=true; G.winner=-1; showBanner('DISCONNECTED',why,2.5,'#ff8080'); } setTimeout(()=>{ if(G&&G.online){ G=null; $('#end').hidden=true; $('#pause').hidden=true; openOnline(); netStatus('⚠️ '+why); } },2600); }
  else { netStatus('⚠️ '+why); netResetButtons(); }
}
function netLeave(){ netSend({t:'bye'}); netReset(); $('#end').hidden=true; $('#pause').hidden=true; G=null; showMenu(); }

// ---------------------------------------------------------------- lobby screen
function openOnline(){
  $('#menu').hidden=true; $('#online').hidden=false; $('#netName').value=store.get('netName','');
  const th=THEMES[arenaIdx]; $('#netArena').textContent=`If you create the room: ${th.emoji} ${th.name} · ${MODES[modeKey].icon} ${MODES[modeKey].name}`;
  if(!NET.role){ netResetButtons(); netStatus(''); netCheckUpdate(); }
  if(netBlocked()&&!NET_LOCAL) netStatus(`⚠️ Online play doesn't work inside this page. Open the game app instead:<br><a href="${APP_URL}" target="_blank" rel="noopener" style="color:#ffd34d">${APP_URL.replace('https://','')}</a>`);
}
$('#friendBtn').onclick=()=>{ initAudio(); openOnline(); };
$('#netBack').onclick=()=>{ netReset(); $('#online').hidden=true; showMenu(); };
$('#netCreate').onclick=()=>{ initAudio(); netHost(); };
$('#netJoin').onclick=()=>{ initAudio(); netJoin(); };
$('#netCode').addEventListener('keydown',e=>{ if(e.key==='Enter') netJoin(); });
$('#netShare').onclick=async()=>{ const link=netLink(), text=`Battle me in Jobless Royale! Tap to join my room (code ${NET.code}):`;
  if(navigator.share){ try{ await navigator.share({title:'Jobless Royale',text,url:link}); }catch(e){} return; }
  try{ await navigator.clipboard.writeText(text+' '+link); netStatus(`Invite link copied! Paste it to your friend.<span class="bigcode">${NET.code}</span>Keep this screen open. Waiting for them…`); }catch(e){ prompt('Send your friend this link:',link); } };
// ---------------------------------------------------------------- updates: both phones must run the same build
// true if a newer version exists (the page reloads, rejoining the room automatically when a code is given)
// Returns true if a newer version was found (the page reloads into the same room: q={room:CODE} rejoins, q={host:CODE} re-opens),
// 'stuck' if we're out of date but a reload didn't help, false if we're already up to date.
function netCheckUpdate(q){ if(q) NET.rejoin=q; return NET.updP||(NET.updP=netCheckUpdate0().finally(()=>{ NET.updP=null; })); } // one check at a time
async function netCheckUpdate0(){ let q;
  if(!/^https?:/.test(location.protocol)||netBlocked()) return false;
  try{ const r=await fetch('version.txt?'+Date.now(),{cache:'no-store'}); if(!r.ok) return false; const v=(await r.text()).trim();
    if(/^[0-9a-f]{10}$/.test(v)&&v!==BUILD){ let tried=null; try{ tried=sessionStorage.getItem('jrUpd'); sessionStorage.setItem('jrUpd',v); }catch(e){} if(tried===v) return 'stuck'; // never loop
      try{ await fetch(location.pathname,{cache:'reload'}); }catch(e){}   // refresh the browser's copy so the reload really gets the new version
      if($('#netStatus')) netStatus('Updating to the latest version…');
      setTimeout(()=>{ const u=new URL(location.href); u.searchParams.delete('room'); u.searchParams.delete('host');
        q=NET.rejoin||(NET.code&&NET.role?(NET.role==='host'?{host:NET.code}:{room:NET.code}):null); // a room was opened while we checked: carry it over
        for(const k in q||{}) u.searchParams.set(k,q[k]); location.replace(u.toString()); },300); return true; } }catch(e){}
  return false; }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&!G&&!NET.role) netCheckUpdate(); });
// invite links: ...?room=CODE opens straight into the room and joins
(function(){ const q=new URLSearchParams(location.search), clean=k=>(q.get(k)||'').toUpperCase().replace(/[^A-Z0-9]/g,''), room=clean('room'), hostc=clean('host'); if(!(room||hostc)||AUTOTEST) return;
  if(hostc){ q.delete('host'); const rest=q.toString(); history.replaceState(null,'',location.pathname+(rest?'?'+rest:'')); setTimeout(()=>{ openOnline(); netHost(hostc); },400); return; }
  q.delete('room'); const rest=q.toString(); history.replaceState(null,'',location.pathname+(rest?'?'+rest:''));
  setTimeout(()=>{ openOnline(); $('#netCode').value=room; netJoin(); },400); })();
$('#netStart').onclick=()=>netStartMatch();

// ---------------------------------------------------------------- messages
function netOnMessage(m){
  if(NET.role==='host'){
    if(m.t==='hello'){ NET.friend=(m.name||'Friend').slice(0,14);
      if(m.build!==BUILD){ netSend({t:'oldver',build:BUILD}); netStatus(`${NET.friend} has a different version of the game. Updating…\nKeep this screen open: they'll rejoin automatically.`); netCheckUpdate({host:NET.code}); return; }
      netSend({t:'lobby',arena:THEMES[arenaIdx].id,mode:modeKey,name:myName()}); netStatus(`${NET.friend} joined! Picking their deck…`); }
    else if(m.t==='deck'){ NET.friendDeck=(m.deck||[]).filter(k=>CARDS[k]); NET.ready=true; netStatus(`✅ ${NET.friend} is ready.\n${THEMES[arenaIdx].emoji} ${THEMES[arenaIdx].name} · ${MODES[modeKey].name}`); $('#netStart').hidden=false; $('#netShare').hidden=true; }
    else if(m.t==='play'&&G&&G.online&&!G.over){ if(G.hands[1][m.i]!==m.id) return; const r=playCard(1,m.i,MX(m.x),MY(m.y)); if(r==='champ') netSend({t:'msg',s:'Your Champion is already in battle!'}); else if(!r) netSend({t:'msg',s:'Not enough elixir!'}); }
    else if(m.t==='tap'&&G&&G.online&&!G.over){ const r=useTap(1); const msg={elixir:'Not enough elixir!',cd:'Ability recharging…',notarget:'No target in range!',stunned:'Your Champion is stunned!'}[r]; if(msg) netSend({t:'msg',s:msg}); }
    else if(m.t==='emote'&&G&&G.online){ G.emotes=G.emotes.filter(x=>x.team!==1); G.emotes.push({team:1,text:G.th.emotes[m.i]||'👋',t:0}); sfx('emote'); }
    else if(m.t==='rematch'){ NET.guestWantsRematch=true; if(G&&G.over) $('#endSub').textContent=`${NET.friend} wants a rematch! Tap REMATCH.`; }
    else if(m.t==='bye') netLost(`${NET.friend} left the match.`);
  } else if(NET.role==='guest'){
    if(m.t==='lobby'){ NET.ready=true; NET.friend=(m.name||'Friend').slice(0,14); const th=THEMES.find(t=>t.id===m.arena);
      if(!th){ netStatus('⚠️ Your friend has a newer version of the game. Fully close and reopen the app, then try again.'); return; }
      const deck=m.mode==='mix'?mixDeck:loadDeck(th);
      netSend({t:'deck',deck}); netStatus(`✅ Joined ${NET.friend}’s room.\n${th.emoji} ${th.name} · ${MODES[m.mode].name}\nUsing your ${m.mode==='mix'?'Mix & Match':th.name} deck. Waiting for ${NET.friend} to start…`); }
    else if(m.t==='oldver') { const code=NET.code; netStatus('Your friend has a different version. Updating…'); NET.role=null;
      netCheckUpdate({room:code}).then(up=>{ if(up===true) return; netReset(); netResetButtons(); $('#netCode').value=code;
        if(up==='stuck') netStatus('⚠️ Your game needs updating. Close the app fully (swipe it away), open it again, then tap JOIN.');
        else { netStatus('Your friend is updating their game. Reconnecting…'); setTimeout(()=>{ if(!NET.role&&!$('#online').hidden) netJoin(); },5000); } }); }
    else if(m.t==='full') { netStatus('⚠️ That room already has two players.'); netResetButtons(); }
    else if(m.t==='start') netGuestStart(m);
    else if(m.t==='s'&&G&&G.puppet) netApplySnap(m);
    else if(m.t==='msg'&&G){ G.msg={s:m.s,t:1.2}; sfx('bad'); }
    else if(m.t==='bye') netLost(`${NET.friend} left the match.`);
  }
}

// ---------------------------------------------------------------- host: start, record, stream
function netStartMatch(){
  if(NET.role!=='host'||!NET.ready) return;
  const th=THEMES[arenaIdx], mix=modeKey==='mix';
  const myDeck=mix?mixDeck:loadDeck(th); if(!deckValid(myDeck)){ netStatus('⚠️ Your deck is not complete. Go back and fix it first.'); return; }
  NET.myDeck=myDeck; NET.mode=modeKey; NET.arena=arenaIdx; netBegin();
}
function netBegin(){
  $('#online').hidden=true; $('#menu').hidden=true; $('#end').hidden=true; menuPreview=null; infoCard=null; NET.guestWantsRematch=false;
  newGame(NET.arena,1,NET.mode,NET.myDeck,NET.friendDeck); G.online=true; G.foe=NET.friend; G.aiTimer=1e9;
  ensureZone(); hideGhost(); emoteOpen=false; fitCamera(W,H,TOPH,PANH);
  G.hands[0].concat(G.queues[0]).forEach(requestPortrait);
  last=performance.now(); Music.stop(); Music.kick();
  netSend({t:'start',arena:THEMES[NET.arena].id,mode:NET.mode,name:myName()}); NET.ev=[]; NET.sendT=0; NET.rec=true;
}
function netRematch(){
  if(NET.role==='host'){ if(!NET.conn){ netLeave(); return; } netBegin(); }
  else { netSend({t:'rematch'}); $('#endSub').textContent=`Asked ${NET.friend} for a rematch…`; $('#againBtn').hidden=true; }
}
// Record one-shot visual/audio calls made by the battle simulation on the host.
(function hookRecorders(){
  const wrap=(name,enc)=>{ const f=window[name]; window[name]=function(...a){ if(NET.rec&&NET.ev.length<400){ const e=enc(a); if(e) NET.ev.push(e); } return f.apply(this,a); }; };
  wrap('fxBurst',a=>['fb',...a.map(v=>typeof v==='number'?r2(v):v)]);
  wrap('fxPuff',a=>['fp',...a.map(v=>typeof v==='number'?r2(v):v)]);
  wrap('fxRing',a=>['fr',...a.map(v=>typeof v==='number'?r2(v):v)]);
  wrap('fxDecal',a=>['fd',...a.map(v=>typeof v==='number'?r2(v):v)]);
  wrap('sfx',a=>['sf',a[0]]);
  wrap('buzz',a=>['bz',a[0]]);
  wrap('feedLog',a=>['fe',a[0],a[1]]);
  wrap('showBanner',a=>['bn',a[0],a[1],a[2],a[3]]);
  wrap('callout',a=>{ const at=a[0]; const h=at.h!=null?at.h:((at.flying?1.6:0)+2.0*(at.scale||1)); return ['co',r2(at.x),r2(at.y),r2(h),a[1],a[2],a[3]?1:0,at.uid||0]; });
  for(const ps of [PSA,PSN]){ const tag=ps===PSA?'pa':'pn', f=ps.spawn.bind(ps); let n=0; ps.spawn=function(...a){ if(NET.rec&&n++%2===0&&NET.ev.length<400) NET.ev.push([tag,...a.map(v=>typeof v==='number'?r2(v):v)]); return f(...a); }; }
})();
const NET_ST=['frozen','stun','rush','fire','slowT','markT','burnT','convT','capT','execBusy','floatT','fearT','shrinkT','danceT','sleepT','boxT','singT','drunkT','slipT','giant','tagT','landT','hitT','kickT','leapH','grow','taunt'];
function netAfterFrame(dt){
  if(NET.role!=='host'||!G) { NET.rec=false; return; }
  NET.rec=true; NET.sendT-=dt; if(NET.sendT>0) return; NET.sendT=1/12;
  const ev=NET.ev; NET.ev=[];
  for(const n of G.nums) if(!n.sent){ n.sent=1; ev.push(['nm',r2(n.x),r2(n.y),r2(n.h),n.v,n.big?1:0]); }
  for(const b of G.beams) if(!b.sent){ b.sent=1; ev.push(['bm',r2(b.x1),r2(b.y1),r2(b.x2),r2(b.y2),r2(b.h||0.9),b.h2==null?null:r2(b.h2),b.col,r2(b.life),r2(b.max),b.w||4,b.cone?1:0]); }
  for(const b of G.bolts) if(!b.sent){ b.sent=1; ev.push(['bo',r2(b.x1),r2(b.h1),r2(b.y1),r2(b.x2),r2(b.h2),r2(b.y2),r2(b.life),r2(b.max),b.col]); }
  const u=G.units.map(v=>{ const o={i:v.uid,c:v.card,t:v.team,x:r2(v.x),y:r2(v.y),h:Math.round(v.hp),m:Math.round(v.maxHp),w:r2(v.yaw),a:r2(v.atk)};
    if(v.shield>0) o.s=Math.round(v.shield); if(v.moving) o.v=1; if(v.deploy>0){ o.d=r2(v.deploy); o.D=r2(v.deployMax); if(v.parachute) o.P=1; }
    if(v.scale!==1) o.k=r2(v.scale); if(hidden(v)) o.H=1; if(v.stone) o.S=1; if(v.charging) o.C=1; if(v.enraged) o.E=1; if(v.lead) o.L=1; if(v.inRange) o.R=1;
    if(v.convT>0) o.ck=v.convKind; if(v.burnCol) o.bc=v.burnCol; if(v.hdx!==undefined){ o.hx=r2(v.hdx); o.hy=r2(v.hdy); }
    if(v.leap&&v.leap.flung) o.lf=r2(Math.min(1,v.leap.t/v.leap.dur));
    const st={}; let any=false; for(const k of NET_ST){ const val=v[k]; if(val>0){ st[k]=r2(Math.min(val,999)); any=true; } } if(any) o.z=st; return o; });
  const tw=G.towers.map(t=>[Math.round(t.hp),t.dead?1:0,t.active?1:0,r2(t.yaw),r2(t.atk),r2(t.frozen||0),r2(t.hackT||0),r2(t.hitT||0),t.stone?1:0]);
  const p=G.projs.filter(q=>!q.done).map(q=>{ q.nid=q.nid||++NET.nid; return [q.nid,q.key,q.team,r2(q.x),r2(q.y),r2(q.z),r2(q.dir||0),q.big?1:0]; });
  const objs=[]; const pushObj=(o,key,team,kind)=>{ if(!o||!o.obj) return; o.nid=o.nid||++NET.nid; const P=o.obj.position, Rr=o.obj.rotation; objs.push([o.nid,kind,key,team,r2(P.x),r2(P.y),r2(P.z),r2(Rr.x),r2(Rr.y),r2(Rr.z),r2(o.obj.scale.x)]); };
  for(const s of G.spells) if(!s.done) pushObj(s,s.s.fall,s.team,'f'); for(const r of G.rolls) if(!r.done) pushObj(r,r.key,r.team,'f'); for(const b of G.booms) if(!b.done) pushObj(b,b.proj,b.team,'p');
  const cl=G.clouds.map(c=>[r2(c.x),r2(c.y),r2(c.r),c.col,c.puddle?1:0]);
  const ob=G.orbs.map(o=>{ o.nid=o.nid||++NET.nid; return [o.nid,o.k,r2(o.x),r2(o.y),r2(o.t),r2(o.life)]; });
  const em=G.emotes.map(e=>[e.team,e.text,r2(e.t)]);
  netSend({t:'s',T:r2(G.time),ov:G.overtime?1:0,sd:G.mode.sudden?1:0,r:G.rate||1,e:[r2(G.elixir[0]),r2(G.elixir[1])],h:G.hands[1],q:G.queues[1][0],tc:r2(G.tapCd[1]),cr:G.crowns,o:G.over?1:0,W:G.winner,sh:r2(G.shake),fk:r2(G.fovKick||0),u,tw,p,n:objs,cl,ob,em,ev});
}

// ---------------------------------------------------------------- guest: mirror the host
function netGuestStart(m){
  const ai=THEMES.findIndex(t=>t.id===m.arena); if(ai<0) return;
  NET.friend=(m.name||NET.friend).slice(0,14);
  $('#online').hidden=true; $('#menu').hidden=true; $('#end').hidden=true; $('#pause').hidden=true; menuPreview=null; infoCard=null;
  const deck=m.mode==='mix'?mixDeck:loadDeck(THEMES[ai]);
  newGame(ai,1,m.mode,deck,deck); G.online=true; G.puppet=true; G.foe=NET.friend; G.aiTimer=1e9; G.banner=null;
  NET.units.clear(); NET.projs.clear(); NET.objs.forEach(o=>dynRoot.remove(o.obj)); NET.objs.clear(); NET.orbs.clear(); NET.clouds=[]; NET.last=null;
  // host tower i  ->  local tower with the mirrored position
  NET.towerMap=G.towers.map(()=>0); const hostOrder=[[1,3.5,6.5],[1,14.5,6.5],[1,9,3],[0,3.5,25.5],[0,14.5,25.5],[0,9,29]];
  hostOrder.forEach(([tm,x,y],i)=>{ NET.towerMap[i]=G.towers.findIndex(t=>t.team===MT(tm)&&Math.abs(t.x-MX(x))<0.1&&Math.abs(t.y-MY(y))<0.1); });
  ensureZone(); hideGhost(); emoteOpen=false; fitCamera(W,H,TOPH,PANH);
  last=performance.now(); Music.stop(); Music.kick();
}
const SWAP_TXT={'+1 CROWN!':'TOWER LOST!','TOWER LOST!':'+1 CROWN!','KING DOWN!':'YOUR KING FELL','YOUR KING FELL':'KING DOWN!','YOU WIN!':'YOU LOSE','YOU LOSE':'YOU WIN!'};
const swapWho=s=>typeof s!=='string'?s:(SWAP_TXT[s]||s.replace(/\b(Your|Enemy|You destroyed a tower!|You lost a tower)\b/g,w=>({Your:'Enemy',Enemy:'Your','You destroyed a tower!':'You lost a tower','You lost a tower':'You destroyed a tower!'}[w]||w)));
const swapCol=c=>c==='#bfe0ff'?'#ffc2c0':c==='#ffc2c0'?'#bfe0ff':c;
function netApplySnap(m){
  const now=performance.now(), gap=NET.lastSnapAt?Math.min(0.3,(now-NET.lastSnapAt)/1000):1/12; NET.lastSnapAt=now;
  G.time=m.T; G.overtime=!!m.ov; G.rate=m.r; NET.elixRate=m.r;
  G.elixir[0]=m.e[1]; G.elixir[1]=m.e[0]; G.hands[0]=m.h.slice(); G.queues[0][0]=m.q; G.tapCd[0]=m.tc; G.crowns=[m.cr[1],m.cr[0]];
  G.shake=Math.max(G.shake,m.sh); if(m.fk>0.9) G.fovKick=Math.max(G.fovKick||0,m.fk);
  if(m.o&&!G.over){ G.over=true; G.overT=0; G.winner=MT(m.W); G.sel=-1; G.drag=null; hideGhost(); }
  // units
  const seen=new Set();
  for(const o of m.u){ seen.add(o.i); let v=NET.units.get(o.i); const c=CARDS[o.c]; if(!c) continue;
    if(!v){ v={uid:o.i,card:o.c,c,flying:!!c.flying,radius:c.radius,baseR:c.radius,mass:c.mass,building:c.type==='building',speed:c.speed,targets:c.targets,walk:Math.random()*6,yawVis:MYAW(o.w),bank:0,scale:1,
        x:MX(o.x),y:MY(o.y),hp:o.h,maxHp:o.m,atk:0,cd:0,dead:false,grow:0,lead:false}; NET.units.set(o.i,v); G.units.push(v); }
    v.team=MT(o.t); v.tx=MX(o.x); v.ty=MY(o.y); v.hp=o.h; v.maxHp=o.m; v.shield=o.s||0; v.yaw=MYAW(o.w); if(o.a>0&&!(v.atk>0)) v.atk=o.a; if(!(o.a>0)) v.atk=0;
    v.moving=!!o.v; v.deploy=o.d||0; v.deployMax=o.D||v.deployMax||1; v.parachute=!!o.P; v.scale=o.k||1; v.radius=v.baseR*v.scale;
    v.invis=o.H?1:0; v.stealthOn=false; v.stone=!!o.S; v.charging=!!o.C; v.enraged=!!o.E; v.lead=!!o.L; v.inRange=!!o.R; v.convKind=o.ck; v.burnCol=o.bc||null;
    if(o.hx!==undefined){ v.hdx=-o.hx; v.hdy=-o.hy; }
    v.leap=o.lf!=null?{flung:{},t:o.lf,dur:1}:null;
    for(const k of NET_ST) v[k]=o.z&&o.z[k]?o.z[k]:0; v.taunt=o.z&&o.z.taunt||0; }
  for(const [id,v] of NET.units) if(!seen.has(id)){ NET.units.delete(id); v.dead=true; G.dying.push({u:v,t:0}); }
  G.units=G.units.filter(v=>!v.dead);
  // towers
  m.tw.forEach((a,i)=>{ const t=G.towers[NET.towerMap[i]]; if(!t) return; const wasDead=t.dead;
    t.hp=a[0]; t.dead=!!a[1]; t.active=!!a[2]; t.yaw=MYAW(a[3]); t.atk=a[4]; t.frozen=a[5]; t.hackT=a[6]; t.hitT=a[7]; t.stone=!!a[8];
    if(t.dead&&!wasDead) netTowerDebris(t); });
  // projectiles: keep objects, estimate velocity for smooth motion between snapshots
  const pseen=new Set();
  for(const a of m.p){ const [id,key,team,x,y,z,dir,big]=a; pseen.add(id); let q=NET.projs.get(id); const nx=MX(x), ny=MY(y);
    if(!q){ q={key,team:MT(team),x:nx,y:ny,z,dir:dir+PI,big:!!big,vx:0,vy:0,vz:0}; NET.projs.set(id,q); G.projs.push(q); }
    else { q.vx=(nx-q.x)/gap; q.vy=(ny-q.y)/gap; q.vz=(z-q.z)/gap; q.x=nx; q.y=ny; q.z=z; q.dir=dir+PI; } }
  for(const [id,q] of NET.projs) if(!pseen.has(id)){ NET.projs.delete(id); if(q.obj) dynRoot.remove(q.obj); q.done=true; }
  G.projs=G.projs.filter(q=>!q.done);
  // spell objects, rolling logs, boomerangs
  const oseen=new Set();
  for(const a of m.n){ const [id,kind,key,team,x,y,z,rx,ry,rz,sc]=a; oseen.add(id); let o=NET.objs.get(id);
    if(!o){ const tc=TEAMC[MT(team)]||TEAMC[0]; const obj=kind==='p'?buildProj(key,tc):buildFall(key,tc); obj.scale.setScalar(sc||1); dynRoot.add(obj); o={obj,vx:0,vy:0,vz:0}; NET.objs.set(id,o); o.obj.position.set(MX(x),y,MY(z)); }
    else { const P=o.obj.position; o.vx=(MX(x)-P.x)/gap; o.vy=(y-P.y)/gap; o.vz=(MY(z)-P.z)/gap; P.set(MX(x),y,MY(z)); }
    o.obj.rotation.set(rx,ry+PI,rz); }
  for(const [id,o] of NET.objs) if(!oseen.has(id)){ dynRoot.remove(o.obj); NET.objs.delete(id); }
  NET.clouds=m.cl.map(a=>({x:MX(a[0]),y:MY(a[1]),r:a[2],col:a[3],puddle:!!a[4]}));
  // power orbs
  const bseen=new Set();
  for(const a of m.ob){ const [id,k,x,y,t,life]=a; bseen.add(id); let o=NET.orbs.get(id); if(!o){ o={k}; NET.orbs.set(id,o); G.orbs.push(o); } o.x=MX(x); o.y=MY(y); o.t=t; o.life=life; }
  for(const [id,o] of NET.orbs) if(!bseen.has(id)){ NET.orbs.delete(id); if(o.obj) dynRoot.remove(o.obj); o.gone=true; }
  G.orbs=G.orbs.filter(o=>!o.gone);
  G.emotes=m.em.map(a=>({team:MT(a[0]),text:a[1],t:a[2]}));
  // one-shot effects
  for(const e of m.ev) netReplay(e);
}
function MYAW(w){ return w+PI; }
function netReplay(e){
  const k=e[0], a=e.slice(1);
  switch(k){
    case 'fb': fxBurst(MX(a[0]),a[1],MY(a[2]),...a.slice(3)); break;
    case 'fp': fxPuff(MX(a[0]),a[1],MY(a[2]),...a.slice(3)); break;
    case 'fr': fxRing(MX(a[0]),MY(a[1]),...a.slice(2)); break;
    case 'fd': fxDecal(MX(a[0]),MY(a[1]),...a.slice(2)); break;
    case 'pa': case 'pn': (k==='pa'?PSA:PSN).spawn(MX(a[0]),a[1],MY(a[2]),-a[3],a[4],-a[5],...a.slice(6)); break;
    case 'sf': sfx(a[0]); break;
    case 'bz': buzz(a[0]); break;
    case 'fe': feedLog(swapWho(a[0]),MT(a[1])); break;
    case 'bn': if(a[0]!=='FIGHT!') showBanner(swapWho(a[0]),swapWho(a[1]),a[2],a[3]); break;
    case 'co': { const f=a[6]&&NET.units.get(a[6]); G.callouts.push({x:MX(a[0]),y:MY(a[1]),h:a[2],text:swapWho(a[3]),col:swapCol(a[4]),t:0,max:a[5]?1.5:1.15,big:!!a[5],follow:f||null}); break; }
    case 'nm': G.nums.push({x:MX(a[0]),y:MY(a[1]),h:a[2],v:a[3],t:0,big:!!a[4]}); if(G.nums.length>24) G.nums.shift(); break;
    case 'bm': G.beams.push({x1:MX(a[0]),y1:MY(a[1]),x2:MX(a[2]),y2:MY(a[3]),h:a[4],h2:a[5]==null?undefined:a[5],col:a[6],life:a[7],max:a[8],w:a[9],cone:!!a[10]}); break;
    case 'bo': G.bolts.push({x1:MX(a[0]),h1:a[1],y1:MY(a[2]),x2:MX(a[3]),h2:a[4],y2:MY(a[5]),life:a[6],max:a[7],col:a[8]}); break;
  }
}
function netTowerDebris(t){
  G.slowT=t.kind==='king'?1.4:0.8; G.fovKick=1;
  for(let i=0;i<16;i++){ const s0=rnd(0.25,0.6); const m=new THREE.Mesh(geo('dodec'),mat(i%3?shade(G.th.stone,0.85):TEAMC[t.team].main,{s:20,flat:true})); m.scale.setScalar(s0); m.position.set(t.x+rnd(-1,1),rnd(1,3),t.y+rnd(-1,1)); m.castShadow=QUALITY.shadows; dynRoot.add(m);
    const a=Math.random()*TAU, f=rnd(3,8); G.debris.push({m,vx:Math.cos(a)*f,vy:rnd(5,11),vz:Math.sin(a)*f,rx:rnd(-8,8),rz:rnd(-8,8),t:0,s0}); }
}
// Runs every frame on the guest instead of update(): cosmetic timers, smoothing, local particles.
function netGuestTick(dt){
  updateFx3(dt);
  for(const c of G.callouts) c.t+=dt; G.callouts=G.callouts.filter(c=>c.t<c.max);
  for(const b of G.beams) b.life-=dt; G.beams=G.beams.filter(b=>b.life>0);
  for(const b of G.bolts) b.life-=dt; G.bolts=G.bolts.filter(b=>b.life>0);
  for(const e of G.emotes) e.t+=dt;
  if(G.banner){ G.banner.t+=dt; if(G.banner.t>G.banner.dur) G.banner=null; }
  if(G.msg){ G.msg.t-=dt; if(G.msg.t<=0) G.msg=null; }
  if(G.shake>0) G.shake=Math.max(0,G.shake-dt);
  for(const f of G.feed) f.t+=dt; G.feed=G.feed.filter(f=>f.t<5);
  G.t+=dt;
  if(G.over){ G.overT+=dt; if(G.overT>2.4&&$('#end').hidden) showEnd(); }
  else { G.time=Math.max(0,G.time-dt); G.elixir[0]=Math.min(10,G.elixir[0]+dt/2.8*NET.elixRate); if(G.tapCd[0]>0) G.tapCd[0]-=dt; }
  const k=Math.min(1,dt*14);
  for(const v of G.units){ if(v.tx!==undefined){ const dx=v.tx-v.x, dy=v.ty-v.y; if(dx*dx+dy*dy>9){ v.x=v.tx; v.y=v.ty; } else { v.x+=dx*k; v.y+=dy*k; } }
    if(v.moving) v.walk+=dt*9*Math.min(1.4,v.speed||1); if(v.atk>0){ v.atk+=dt/0.38; if(v.atk>=1) v.atk=0; } if(v.hitT>0) v.hitT-=dt; if(v.landT>0) v.landT-=dt; if(v.deploy>0) v.deploy=Math.max(0,v.deploy-dt);
    if(v.leap&&v.leap.flung) v.leap.t=Math.min(1,v.leap.t+dt/1.15); }
  for(const q of G.projs){ q.x+=q.vx*dt; q.y+=q.vy*dt; q.z+=q.vz*dt; }
  for(const o of NET.objs.values()){ const P=o.obj.position; P.x+=o.vx*dt; P.y=Math.max(0.1,P.y+o.vy*dt); P.z+=o.vz*dt; }
  for(const c of NET.clouds){ if(c.puddle){ if(Math.random()<dt*6){ const a=Math.random()*TAU, rr=Math.random()*c.r; PSA.spawn(c.x+Math.cos(a)*rr,0.08,c.y+Math.sin(a)*rr,0,0.3,0,0.4,0.18,'#fff4c0',0.8,0); } }
    else if(Math.random()<dt*14){ const a=Math.random()*TAU, rr=Math.random()*c.r; PSN.spawn(c.x+Math.cos(a)*rr,0.2,c.y+Math.sin(a)*rr,0,rnd(0.3,0.8),0,rnd(0.8,1.4),rnd(0.5,0.9),c.col,0.45,0,0.8,1); } }
}
