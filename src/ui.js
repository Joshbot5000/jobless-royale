// =====================================================================
//  UI — HUD overlay, input, menus, portraits, audio, main loop
// =====================================================================
const $=s=>document.querySelector(s);
const glc=$('#gl'), hud=$('#hud'), hx=hud.getContext('2d'), wrap=$('#wrap');
const FONT="'Lilita One','Arial Rounded MT Bold','Trebuchet MS',system-ui,sans-serif";
const RAR={common:['#9fb4e0','#4a5f94'],rare:['#ffbf5e','#d0721a'],epic:['#d27cf5','#7a2fb4'],legendary:['#8ff3e4','#2c9ad8'],champion:['#ffe58a','#c98a0b']};
let W=0,H=0,DPR=1,TOPH=0,PANH=0,PANY=0,cardRects=[],nextRect,elixRect,pauseRect,emoteRect,tapRect,emoteOpen=false,emoteRects=[];

// ---------------------------------------------------------------- persistence
const store={ get(k,d){ try{ const v=localStorage.getItem('tr2_'+k); return v===null?d:JSON.parse(v); }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem('tr2_'+k,JSON.stringify(v)); }catch(e){} } };
let arenaIdx=clamp(store.get('arena',0),0,THEMES.length-1), diffIdx=clamp(store.get('diff',1),0,2), modeKey=MODES[store.get('mode','classic')]?store.get('mode','classic'):'classic';
let trophies=store.get('trophies',0), best=store.get('best',{}), streak=store.get('streak',0);
const PLAYABLE=Object.keys(CARDS).filter(k=>!CARDS[k].hidden);
// ---------------------------------------------------------------- decks & trophy road: 6 characters + 2 spells, max one Champion
const DECK_CHARS=6, DECK_SPELLS=2;
const isSpell=id=>CARDS[id].type==='spell';
const unlocked=id=>(CARDS[id].unlock||0)<=trophies;
const champCount=d=>d.filter(k=>CARDS[k].champ).length;
function deckValid(d){ return d.filter(k=>!isSpell(k)).length===DECK_CHARS&&d.filter(isSpell).length===DECK_SPELLS&&champCount(d)<=1&&d.every(k=>CARDS[k]&&unlocked(k)); }
function fillDeck(d,pool){ d=d.slice();
  for(const k of pool){ if(d.includes(k)||!unlocked(k)) continue; const ch=d.filter(x=>!isSpell(x)), sp=d.filter(isSpell);
    if(isSpell(k)){ if(sp.length<DECK_SPELLS) d.push(k); } else if(ch.length<DECK_CHARS&&!(CARDS[k].champ&&champCount(d))) d.push(k); }
  return d; }
function loadDeck(th){ let d=(store.get('deck_'+th.id,null)||[]).filter(k=>CARDS[k]&&th.pool.includes(k)&&unlocked(k)); if(!deckValid(d)) d=fillDeck(d,th.pool); return d; }
let mixDeck=(store.get('mix',null)||[]).filter(k=>CARDS[k]&&!CARDS[k].hidden&&unlocked(k));
if(!deckValid(mixDeck)) mixDeck=['judge','bull','jury','eagle','rottweiler','firefighter','asteroid','defib'];
let arenaDeck=loadDeck(THEMES[arenaIdx]), swapPick=null;
QUALITY.outlines=QUALITY.shadows=store.get('quality','high')==='high';

// ---------------------------------------------------------------- audio: two buses (sfx, music) through a gentle master compressor
let AC=null,lastSfx={},sfxBus=null,musBus=null,sfxLP=null,noiseBuf=null;
let SND={sfx:store.get('sfx',true),music:store.get('music',true)};
function initAudio(){ if(AC){ if(AC.state==='suspended') AC.resume(); Music.kick(); return; } try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ AC=null; return; }
  const comp=AC.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=4; comp.connect(AC.destination);
  sfxLP=AC.createBiquadFilter(); sfxLP.type='lowpass'; sfxLP.frequency.value=3800; sfxBus=AC.createGain(); sfxBus.gain.value=SND.sfx?0.9:0; sfxLP.connect(sfxBus); sfxBus.connect(comp);
  musBus=AC.createGain(); musBus.gain.value=SND.music?0.5:0; musBus.connect(comp);
  const n=AC.sampleRate|0; noiseBuf=AC.createBuffer(1,n,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  Music.kick(); }
function setSound(k,on){ SND[k]=on; store.set(k,on); if(AC){ const bus=k==='sfx'?sfxBus:musBus; bus.gain.setTargetAtTime(on?(k==='sfx'?0.9:0.5):0,AC.currentTime,0.05); } if(k==='music'){ if(on) Music.kick(); else Music.stop(); } syncSoundButtons(); }
function syncSoundButtons(){ document.querySelectorAll('[data-snd]').forEach(b=>{ const k=b.dataset.snd; b.setAttribute('aria-pressed',String(SND[k])); b.textContent=(k==='sfx'?(SND.sfx?'🔊':'🔇'):(SND.music?'🎵':'🔕'))+(k==='sfx'?' Sound':' Music'); }); }
function tone(f,dur,type='sine',vol=0.12,slide=0,delay=0){ if(!AC||!SND.sfx) return; const t0=AC.currentTime+delay, o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f,t0); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t0+dur); g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(g); g.connect(sfxLP); o.start(t0); o.stop(t0+dur+0.02); }
function noise(dur,vol=0.2,freq=800,type='lowpass',delay=0){ if(!AC||!noiseBuf) return; const t0=AC.currentTime+delay, s=AC.createBufferSource(); s.buffer=noiseBuf; const f=AC.createBiquadFilter(); f.type=type; f.frequency.value=freq; const g=AC.createGain(); g.gain.setValueAtTime(vol,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); s.connect(f); f.connect(g); g.connect(sfxLP); s.start(t0,Math.random()*0.5); s.stop(t0+dur+0.02); }
// Soft, rounded sound effects: thuds, whooshes and chimes instead of square-wave beeps.
function sfx(k){ if(!AC||AUTOTEST||!SND.sfx) return; const now=performance.now(); if(lastSfx[k]&&now-lastSfx[k]<(k==='hit'||k==='arrow'?110:70)) return; lastSfx[k]=now;
  switch(k){ case 'deploy': tone(220,0.14,'sine',0.12,1.6); noise(0.12,0.05,900); break; case 'hit': tone(120,0.08,'sine',0.07,0.5); noise(0.05,0.035,1400); break; case 'arrow': noise(0.08,0.025,2400,'bandpass'); break;
    case 'kick': tone(90,0.16,'sine',0.22,0.4); noise(0.12,0.07,900); break; case 'boom': noise(0.5,0.22,450); tone(65,0.45,'sine',0.25,0.4); break; case 'zap': tone(900,0.1,'triangle',0.035,0.5); break;
    case 'freeze': tone(1568,0.35,'sine',0.04,0.7); tone(2093,0.3,'sine',0.03,0.8,0.05); break; case 'power': [523,659,784,1046].forEach((f,i)=>tone(f,0.22,'sine',0.06,1,i*0.06)); break;
    case 'crown': [392,523,659,784,1046].forEach((f,i)=>tone(f,0.35,'triangle',0.05,1,i*0.09)); break; case 'pop': tone(520,0.07,'sine',0.06,1.6); break; case 'bad': tone(196,0.16,'triangle',0.05,0.8); break;
    case 'emote': tone(784,0.1,'sine',0.06,1.2); tone(1175,0.12,'sine',0.05,1,0.07); break;
    case 'champ': [262,330,392,523].forEach((f,i)=>tone(f,0.35,'triangle',0.05,1,i*0.07)); noise(0.4,0.05,600); break; } }

// ---------------------------------------------------------------- theme music (procedural, built into the game)
// A 16-bar loop: 4 bars of groove, an 8-bar hook (call and answer), then a 4-bar breather with no lead,
// so the tune never nags. Each arena plays in its own key; the battle version speeds up in the last minute.
const Music=(()=>{
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  const CHORDS=[[57,60,64],[57,60,65],[55,60,64],[55,59,62]], ROOTS=[45,41,48,43];
  const HOOK_A=[[[0,76,2],[3,76,1],[4,79,2],[6,81,4],[12,79,2],[14,76,2]],[[0,77,2],[2,76,2],[4,72,4],[10,74,2],[12,76,4]],[[0,79,2],[3,79,1],[4,81,2],[6,84,4],[12,83,2],[14,79,2]],[[0,79,3],[4,77,2],[6,76,2],[8,74,6]]];
  const HOOK_B=[HOOK_A[0],HOOK_A[1],[[0,79,2],[2,81,2],[4,79,2],[6,76,2],[8,74,2],[10,72,2],[12,74,4]],[[0,76,2],[2,74,2],[4,72,2],[6,71,2],[8,69,8]]];
  let mode=null, timer=null, next=0, step=0, key=0, lead='triangle';
  const out=()=>musBus;
  function note(t,m,dur,type,vol,cut,att=0.01,det=0){ const o=AC.createOscillator(), g=AC.createGain(), f=AC.createBiquadFilter(); o.type=type; o.frequency.value=mtof(m+key); o.detune.value=det; f.type='lowpass'; f.frequency.value=cut;
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+att); g.gain.setTargetAtTime(0.0001,t+Math.max(att,dur*0.6),dur*0.35+0.03); o.connect(f); f.connect(g); g.connect(out()); o.start(t); o.stop(t+dur+0.4); }
  function drum(t,kind,vol){ if(kind==='kick'){ const o=AC.createOscillator(), g=AC.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+0.12); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.22); o.connect(g); g.connect(out()); o.start(t); o.stop(t+0.25); return; }
    const s=AC.createBufferSource(); s.buffer=noiseBuf; const f=AC.createBiquadFilter(), g=AC.createGain();
    if(kind==='hat'){ f.type='highpass'; f.frequency.value=7500; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.045); }
    else { f.type='bandpass'; f.frequency.value=1800; f.Q.value=0.8; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.16); }
    s.connect(f); f.connect(g); g.connect(out()); s.start(t,Math.random()*0.5); s.stop(t+0.2); }
  function bpm(){ if(mode==='menu') return 94; const hot=G&&(G.time<=60||G.overtime); return hot?(G.overtime?128:124):114; }
  function play(t,st){ const s16=st%16, bar=Math.floor(st/16)%16, ci=bar%4, sec=bar<4?'groove':bar<8?'hookA':bar<12?'hookB':'break', b16=60/bpm()/4;
    const battle=mode==='battle', hot=battle&&G&&(G.time<=60||G.overtime);
    if(s16===0) for(const m of CHORDS[ci]) for(const dt of [-6,6]) note(t,m,b16*16,'triangle',sec==='break'?0.035:0.028,sec==='break'?1400:900,0.25,dt);
    if(s16%8===0||(battle&&s16===10)) note(t,ROOTS[ci],b16*(s16===10?2:3),'triangle',0.11,600,0.01);
    if(s16%2===0&&(sec!=='groove'||battle)){ const ch=CHORDS[ci], m=ch[(s16/2)%3]+12; note(t,m,b16*1.5,'sine',sec==='break'?0.035:0.022,2600,0.005); }
    const hook=sec==='hookA'?HOOK_A:sec==='hookB'?HOOK_B:null;
    if(hook) for(const [ps,m,len] of hook[bar%4]) if(ps===s16) note(t,m,b16*len,mode==='menu'?'sine':lead,mode==='menu'?0.06:0.055,mode==='menu'?1800:2400,0.015);
    if(sec==='break'&&!battle) return;
    if(s16===0||s16===8||(battle&&s16===6&&sec!=='break')) drum(t,'kick',sec==='break'?0.18:0.32);
    if(battle&&(s16===4||s16===12)&&sec!=='break') drum(t,'snare',0.07);
    if((s16%4===2)||(hot&&s16%2===1)) drum(t,'hat',hot?0.03:0.022);
  }
  function tick(){ if(!AC||!mode) return; while(next<AC.currentTime+0.2){ play(next,step); next+=60/bpm()/4; step++; } }
  function want(){ if(AUTOTEST) return null; return G?(G.over?null:'battle'):'menu'; }
  return {
    kick(){ if(!AC||!SND.music){ return; } const m=want(); if(m===mode&&timer) return; mode=m; if(!mode){ clearInterval(timer); timer=null; return; }
      key=[0,2,-2,3,-3,5,-5,1][(G?THEMES.indexOf(G.th):arenaIdx)%8]||0; lead=['triangle','square','sawtooth','triangle'][(G?THEMES.indexOf(G.th):arenaIdx)%4]==='triangle'?'triangle':'square';
      next=AC.currentTime+0.08; step=0; clearInterval(timer); timer=setInterval(tick,30); },
    stop(){ mode=null; clearInterval(timer); timer=null; },
  };
})();
function buzz(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

// ---------------------------------------------------------------- layout
function layout(){
  DPR=Math.min(window.devicePixelRatio||1,2.5);
  W=Math.round(Math.min(innerWidth,innerHeight*0.62)); H=innerHeight;
  wrap.style.width=W+'px';
  for(const c of [glc,hud]){ c.style.width=W+'px'; c.style.height=H+'px'; }
  hud.width=Math.round(W*DPR); hud.height=Math.round(H*DPR);
  TOPH=Math.max(46,H*0.062); PANH=Math.max(140,Math.min(H*0.215,W*0.52)); PANY=H-PANH;
  const pad=W*0.022, nextW=W*0.13, gap=W*0.018, cardsX=pad+nextW+pad, cw=(W-cardsX-pad-gap*3)/4, elH=Math.max(18,PANH*0.13);
  const ch=Math.min(cw*1.22,PANH-elH-pad*3-6), used=ch+pad*0.9+elH, cy=PANY+Math.max(pad+6,(PANH-used)/2+2);
  cardRects=[0,1,2,3].map(i=>({x:cardsX+i*(cw+gap),y:cy,w:cw,h:ch}));
  nextRect={x:pad,y:cy+ch*0.38,w:nextW,h:nextW*1.22};
  emoteRect={x:pad+nextW*0.12,y:cy-2,w:nextW*0.76,h:nextW*0.62};
  elixRect={x:cardsX,y:cy+ch+pad*0.9,w:W-cardsX-pad,h:elH};
  pauseRect={x:6,y:6,w:TOPH-12,h:TOPH-12};
  const tr=Math.max(30,W*0.085); tapRect={x:W-tr*2-12,y:PANY-tr*2-14,w:tr*2,h:tr*2,r:tr};
  if(renderer){ renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,QUALITY.shadows?2:1.25)); if(G) fitCamera(W,H,TOPH,PANH); else { renderer.setSize(W,H,false); camera.aspect=W/H; camera.clearViewOffset(); camera.updateProjectionMatrix(); } }
}

// ---------------------------------------------------------------- portraits (second WebGL context, studio lighting)
let pr=null; const portraitCache={}, portraitQueue=[];
function portraitRenderer(){
  if(pr) return pr;
  const c=document.createElement('canvas'); c.width=256; c.height=320;
  const r=new THREE.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true}); r.setPixelRatio(1); r.setSize(256,320,false); r.setClearColor(0x000000,0);
  const sc=new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff,0x8a7a6a,0.7)); const dl=new THREE.DirectionalLight(0xfff1dc,1.1); dl.position.set(-3,5,6); sc.add(dl); const rl=new THREE.DirectionalLight(0xbfd8ff,0.6); rl.position.set(4,3,-4); sc.add(rl);
  sc.add(new THREE.AmbientLight(0xffffff,0.25));
  const cam=new THREE.PerspectiveCamera(30,256/320,0.1,100);
  pr={c,r,sc,cam}; return pr;
}
function requestPortrait(key){ if(CARDS[key]&&CARDS[key].type==='spell') return; if(portraitCache[key]||portraitQueue.includes(key)) return; portraitQueue.push(key); }
function makePortrait(key){
  const P0=portraitRenderer();
  const m = key.startsWith('king:') ? THEMES[+key.slice(5)].king : CARDS[key].model;
  const model=getModel(m,0);
  const R=model.userData.rig; if(R&&R.type==='h'){ R.armR.rotation.x=-0.9; R.armL.rotation.x=0.15; } if(R&&R.blackCap) R.blackCap.visible=false;
  model.rotation.y=m.k==='v'?0.7:0.5; P0.sc.add(model);
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model), size=box.getSize(new THREE.Vector3()), ctr=box.getCenter(new THREE.Vector3());
  const h=Math.max(size.y, size.x*1.05, size.z*0.85);
  const d=h/(2*Math.tan(15*PI/180))*1.05;
  P0.cam.position.set(ctr.x, ctr.y+h*0.14, ctr.z+d); P0.cam.lookAt(ctr.x,ctr.y,ctr.z);
  P0.r.render(P0.sc,P0.cam);
  const out=document.createElement('canvas'); out.width=256; out.height=320; out.getContext('2d').drawImage(P0.c,0,0);
  P0.sc.remove(model);
  portraitCache[key]=out; return out;
}
function pumpPortraits(n=2){ let did=false; while(n-->0&&portraitQueue.length){ makePortrait(portraitQueue.shift()); did=true; } if(did) faceCache={}; return did; }
let faceCache={};
function cardFace(id,w,h){
  const key=id+'_'+Math.round(w)+'_'+Math.round(h);
  if(faceCache[key]) return faceCache[key];
  const c=document.createElement('canvas'); c.width=Math.round(w*DPR); c.height=Math.round(h*DPR);
  const ready=drawCardFace(c.getContext('2d'),id,w,h,DPR);
  if(ready) faceCache[key]=c; return c;
}
function rrp(c,x,y,w,h,r){ r=Math.max(0,Math.min(r,w/2,h/2)); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function drawCardFace(c,id,w,h,dpr){
  const d=CARDS[id]; c.save(); c.scale(dpr,dpr);
  const [c1,c2]=RAR[d.rar||'common'];
  const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,c1); g.addColorStop(1,c2); c.fillStyle=g; rrp(c,0,0,w,h,w*0.1); c.fill();
  const g2=c.createRadialGradient(w/2,h*0.42,w*0.05,w/2,h*0.45,w*0.75); g2.addColorStop(0,'rgba(255,255,255,.6)'); g2.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g2; c.fillRect(0,0,w,h);
  let ready=true;
  c.save(); rrp(c,0,0,w,h,w*0.1); c.clip();
  if(d.type==='spell'){ c.font=`${w*0.58}px ${FONT}`; c.textAlign='center'; c.textBaseline='middle'; c.shadowColor='rgba(0,0,0,.35)'; c.shadowBlur=w*0.06; c.shadowOffsetY=w*0.03; c.fillText(d.icon||'✨',w/2,h*0.42); c.shadowColor='transparent'; }
  else { const pc=portraitCache[id]; if(pc){ const ph=h*0.92, pw=ph*0.8; c.drawImage(pc,(w-pw)/2,-h*0.01,pw,ph); } else { requestPortrait(id); ready=false; } }
  c.restore();
  c.strokeStyle=d.champ?'#fff3b0':'#14161c'; c.lineWidth=Math.max(2,w*(d.champ?0.06:0.045)); rrp(c,1,1,w-2,h-2,w*0.1); c.stroke();
  if(d.champ){ c.strokeStyle='#14161c'; c.lineWidth=1.5; rrp(c,0.5,0.5,w-1,h-1,w*0.1); c.stroke(); c.font=`${w*0.2}px ${FONT}`; c.textAlign='center'; c.textBaseline='middle'; c.fillText('👑',w*0.82,w*0.15); }
  c.fillStyle='rgba(10,14,30,.62)'; c.fillRect(2,h*0.8,w-4,h*0.2-2);
  let nm=d.short||d.name; const fsz=Math.max(8,w*(nm.length>13?0.105:0.13));
  c.font=`${fsz}px ${FONT}`; c.textAlign='center'; c.textBaseline='middle';
  if(c.measureText(nm).width>w*0.94) nm=nm.split(' ').slice(-1)[0];
  c.lineWidth=fsz*0.22; c.strokeStyle='#14161c'; c.strokeText(nm,w/2,h*0.9); c.fillStyle='#fff'; c.fillText(nm,w/2,h*0.9);
  const r=w*0.17, ex=r*1.0, ey=r*1.05;
  c.beginPath(); c.moveTo(ex,ey-r*1.35); c.quadraticCurveTo(ex+r*1.1,ey-r*0.2,ex+r*0.95,ey+r*0.15); c.arc(ex,ey+r*0.1,r*0.95,0.05,PI-0.05); c.quadraticCurveTo(ex-r*1.1,ey-r*0.2,ex,ey-r*1.35);
  const eg=c.createLinearGradient(0,ey-r,0,ey+r); eg.addColorStop(0,'#f68cff'); eg.addColorStop(1,'#a020d8'); c.fillStyle=eg; c.fill(); c.lineWidth=Math.max(1.5,w*0.03); c.strokeStyle='#14161c'; c.stroke();
  c.font=`${r*1.25}px ${FONT}`; c.lineWidth=r*0.3; c.strokeText(d.cost,ex,ey+r*0.12); c.fillStyle='#fff'; c.fillText(d.cost,ex,ey+r*0.12);
  c.restore(); return ready;
}

// ---------------------------------------------------------------- HUD helpers
function txt(s,x,y,size,col='#fff',align='center',stroke=true){ hx.font=`${size}px ${FONT}`; hx.textAlign=align; hx.textBaseline='middle'; if(stroke){ hx.lineWidth=Math.max(2,size*0.2); hx.strokeStyle='#14161c'; hx.lineJoin='round'; hx.strokeText(s,x,y); } hx.fillStyle=col; hx.fillText(s,x,y); }
function hpBar(x,y,w,h,frac,col,label,alpha=1){
  hx.globalAlpha=alpha;
  hx.fillStyle='#14161c'; rrp(hx,x-w/2-1.5,y-1.5,w+3,h+3,h/2+1.5); hx.fill();
  hx.fillStyle='#3a2a2a'; rrp(hx,x-w/2,y,w,h,h/2); hx.fill();
  if(frac>0){ hx.fillStyle=col; rrp(hx,x-w/2,y,Math.max(h,w*frac),h,h/2); hx.fill(); hx.fillStyle='rgba(255,255,255,.32)'; hx.fillRect(x-w/2+h/2,y+1,Math.max(0,w*frac-h),h*0.3); }
  if(label) txt(label,x,y+h/2+0.5,h*1.05,'#fff');
  hx.globalAlpha=1;
}
function statusIcons(u){
  const s=[];
  if(u.frozen>0) s.push(u.stone?'🗿':'❄️'); else if(u.boxT>0&&u.stun>0) s.push('📦'); else if(u.danceT>0&&u.stun>0) s.push('🕺'); else if(u.sleepT>0&&u.stun>0) s.push('💤'); else if(u.stun>0) s.push('💫');
  if(u.singT>0) s.push('🎤'); if(u.drunkT>0) s.push('🥴');
  if(u.fearT>0) s.push('😱'); if(u.shrinkT>0) s.push('✏️'); if(u.markT>0) s.push('★'); if(u.taunt&&!u.building) s.push('📣');
  if(u.floatT>0) s.push('🪐');
  if(u.slowT>0) s.push('🐌');
  if(u.burnT>0) s.push(u.burnCol?'☠️':'🔥');
  if(u.convT>0) s.push(u.convKind==='charm'?'💗':'🔄');
  if(u.shield>0) s.push('🛡️');
  if(u.rush>0&&u.rush<1e5) s.push('⚡'); if(u.enraged) s.push('😡');
  if(u.giant>0) s.push('🍄'); if(u.fire>0) s.push('🔥');
  return s.slice(0,3);
}
const SP={};
function drawWorldOverlay(){
  const unitPx = (()=>{ const a=toScreen(9,0,16,{}), b=toScreen(10,0,16,{}); return Math.abs(b.x-a.x); })();
  for(const b of G.beams){
    const a=toScreen(b.x1,b.h||0.9,b.y1,{}), e=toScreen(b.x2,b.h2??(b.h||0.6),b.y2,{}); const k=b.life/b.max;
    hx.save(); hx.globalCompositeOperation='lighter'; hx.globalAlpha=Math.min(1,k*1.6);
    if(b.cone){ const ang=Math.atan2(e.y-a.y,e.x-a.x), wd=unitPx*(b.w>10?1.6:0.9);
      const gr=hx.createLinearGradient(a.x,a.y,e.x,e.y); gr.addColorStop(0,b.col); gr.addColorStop(1,'rgba(255,255,255,0)');
      hx.fillStyle=gr; hx.beginPath(); hx.moveTo(a.x,a.y); hx.lineTo(e.x+Math.cos(ang+PI/2)*wd,e.y+Math.sin(ang+PI/2)*wd); hx.lineTo(e.x-Math.cos(ang+PI/2)*wd,e.y-Math.sin(ang+PI/2)*wd); hx.closePath(); hx.globalAlpha*=0.7; hx.fill(); }
    else { hx.strokeStyle=b.col; hx.lineCap='round'; hx.lineWidth=b.w*unitPx/18*2.2; hx.shadowColor=b.col; hx.shadowBlur=12; hx.beginPath(); hx.moveTo(a.x,a.y); hx.lineTo(e.x,e.y); hx.stroke(); hx.lineWidth*=0.35; hx.strokeStyle='#fff'; hx.stroke(); }
    hx.restore();
  }
  for(const b of G.bolts){ const a=toScreen(b.x1,b.h1,b.y1,{}), e=toScreen(b.x2,b.h2,b.y2,{}); hx.save(); hx.globalAlpha=b.life/b.max; hx.strokeStyle=b.col; hx.shadowColor=b.col; hx.shadowBlur=14; hx.lineWidth=3;
    hx.beginPath(); hx.moveTo(a.x,a.y); for(let i=1;i<7;i++){ const k=i/7; hx.lineTo(a.x+(e.x-a.x)*k+rnd(-8,8),a.y+(e.y-a.y)*k+rnd(-8,8)); } hx.lineTo(e.x,e.y); hx.stroke(); hx.lineWidth=1.2; hx.strokeStyle='#fff'; hx.stroke(); hx.restore(); }
  for(const t of G.towers){ if(t.dead) continue; const k=t.kind==='king'; const top=t.rig.topY+(k?2.4:1.9);
    const s=toScreen(t.x,top,t.y,SP); const bw=unitPx*(k?3.0:2.2);
    hpBar(s.x,s.y,bw,Math.max(9,unitPx*0.42),t.hp/t.maxHp,TEAMC[t.team].bar,String(Math.ceil(t.hp)),t.hp<t.maxHp||k?1:0.75);
    if(k&&!t.active) txt('z',s.x+bw*0.4,s.y-10-((G.t*0.8)%1)*14,unitPx*0.6,'#fff');
    if(t.hackT>0) txt('💻 OFFLINE',s.x,s.y-unitPx*0.55,unitPx*0.42,'#39ff6a'); else if(t.frozen>0) txt('❄️',s.x,s.y-unitPx*0.55,unitPx*0.55,'#fff','center',false); }
  for(const u of G.units){
    if(hidden(u)&&u.team===1) continue;
    const R=u.rig; if(!R) continue; const hh=(R.height||1.3)*u.scale*VS + (u.flying?1.5:0) + (u.leapH||0) + (u.floatT>0?1.2:0);
    if(u.deploy>0){ if(u.lead||(u.c.count||1)===1){ const s=toScreen(u.x,0.2,u.y,SP), r=unitPx*0.42; hx.fillStyle='rgba(0,0,0,.45)'; hx.beginPath(); hx.arc(s.x,s.y,r,0,TAU); hx.fill(); hx.fillStyle=TEAMC[u.team].light; hx.beginPath(); hx.moveTo(s.x,s.y); hx.arc(s.x,s.y,r*0.85,-PI/2,-PI/2+TAU*(1-u.deploy/u.deployMax)); hx.closePath(); hx.fill(); } continue; }
    const swarm=(u.c.count||1)>=5;
    const damaged=u.hp<u.maxHp-0.5||u.shield>0;
    const s=toScreen(u.x,hh+0.32,u.y,SP);
    const bw=Math.max(unitPx*(swarm?0.6:0.85),u.baseR*u.scale*unitPx*1.9), bh=Math.max(4,unitPx*(swarm?0.15:0.19));
    if(damaged||!swarm||u.building){ hpBar(s.x,s.y,bw,bh,u.hp/u.maxHp,TEAMC[u.team].bar,null,damaged||u.building?1:0.7); if(u.shield>0){ hx.fillStyle='#8ff0ff'; hx.fillRect(s.x-bw/2,s.y-bh*0.75-2,bw*Math.min(1,u.shield/450),bh*0.65); } }
    if(u.c.champ){ txt('👑',s.x-bw/2-unitPx*0.18,s.y+bh/2,unitPx*0.42,'#fff','center',false); }
    const ic=statusIcons(u); if(ic.length){ hx.font=`${Math.max(10,unitPx*0.36)}px ${FONT}`; hx.textAlign='center'; hx.textBaseline='middle'; ic.forEach((e,i)=>hx.fillText(e,s.x+(i-(ic.length-1)/2)*unitPx*0.42,s.y-unitPx*0.32)); }
    if(u.tagT>0){ const a=Math.min(1,u.tagT*2); hx.globalAlpha=a; txt(u.c.short||u.c.name,s.x,s.y-unitPx*(ic.length?0.75:0.45),Math.max(11,unitPx*0.42),u.team===0?'#bfe0ff':'#ffc2c0'); hx.globalAlpha=1; }
    if(hidden(u)&&u.team===0){ txt('👻',s.x,s.y-unitPx*0.35,unitPx*0.5,'#fff','center',false); }
  }
  for(const o of G.orbs){ if(!o.obj||!o.obj.visible) continue; const s=toScreen(o.x,1.05+Math.sin(o.t*4)*0.15,o.y,SP); txt(POWERS[o.k].icon,s.x,s.y+1,unitPx*0.55,'#fff','center',false); }
  for(const n of G.nums){ const k=n.t/0.9; const s=toScreen(n.x,n.h+0.4+k*1.1,n.y,SP); const pop=k<0.12?0.6+k/0.12*0.6:k<0.22?1.2-(k-0.12)*2:1;
    hx.save(); hx.globalAlpha=k>0.6?1-(k-0.6)/0.4:1; hx.translate(s.x,s.y); hx.scale(pop,pop); txt(String(n.v),0,0,(n.big?0.6:0.42)*unitPx,n.big?'#ffd34d':'#ffffff'); hx.restore(); }
  for(const c of G.callouts){
    const f=c.follow&&!c.follow.dead?c.follow:null; const x=f?f.x:c.x, y=f?f.y:c.y;
    const p=c.t/c.max; const s=toScreen(x,c.h+p*0.8,y,SP);
    const pop=p<0.15?0.5+p/0.15*0.7:p<0.25?1.2-(p-0.15)/0.1*0.2:1;
    hx.save(); hx.globalAlpha=p>0.75?1-(p-0.75)/0.25:1; hx.translate(s.x,s.y); hx.scale(pop,pop); hx.rotate(-0.05);
    txt(c.text,0,0,Math.min((c.big?0.9:0.62)*unitPx*1.1,W*0.07),c.col); hx.restore();
  }
  for(const e of G.emotes){ const k=G.towers.find(t=>t.team===e.team&&t.kind==='king'); const s=toScreen(k.x+2.6,k.rig.topY+2.4,k.y,SP);
    const a=e.t<0.2?e.t/0.2:e.t>2.2?(2.6-e.t)/0.4:1; hx.save(); hx.globalAlpha=Math.max(0,a); hx.font=`${Math.max(13,unitPx*0.6)}px ${FONT}`; const tw=hx.measureText(e.text).width+18, th=Math.max(26,unitPx*1.1);
    const bx=Math.min(W-tw-6,Math.max(6,s.x-tw/2)), by=s.y-th; hx.fillStyle='#fff'; rrp(hx,bx,by,tw,th,10); hx.fill(); hx.strokeStyle='#14161c'; hx.lineWidth=2.5; hx.stroke();
    hx.beginPath(); hx.moveTo(bx+tw*0.3,by+th); hx.lineTo(bx+tw*0.3-6,by+th+9); hx.lineTo(bx+tw*0.3+8,by+th); hx.closePath(); hx.fill();
    hx.fillStyle='#14161c'; hx.textAlign='center'; hx.textBaseline='middle'; hx.fillText(e.text,bx+tw/2,by+th/2+1); hx.restore(); }
}
function drawFeed(){
  let y=TOPH+8; const fs=Math.max(11,Math.min(14,W*0.034));
  for(const f of G.feed){
    const a=f.t<0.25?f.t/0.25:f.t>4.2?(5-f.t)/0.8:1; if(a<=0) continue;
    hx.font=`${fs}px ${FONT}`; const tw=hx.measureText(f.text).width+16, th=fs*1.7;
    hx.globalAlpha=Math.max(0,a)*0.92; hx.fillStyle=f.team===0?'rgba(23,74,150,.85)':f.team===1?'rgba(147,32,29,.85)':'rgba(70,40,110,.88)'; rrp(hx,8,y,tw,th,th/2); hx.fill();
    hx.globalAlpha=Math.max(0,a); txt(f.text,16,y+th/2+1,fs,'#fff','left',false); hx.globalAlpha=1;
    y+=th+4;
  }
}
function drawTapButton(){
  const st=tapState(0); if(!st) return;
  const r=tapRect, cx=r.x+r.r, cy=r.y+r.r, tp=st.tp;
  const cdFrac=st.cd>0?st.cd/tp.cd:0, canPay=G.elixir[0]>=tp.cost, ready=st.ready;
  hx.save();
  if(ready){ const pulse=1+Math.sin(G.t*6)*0.06; hx.shadowColor='#ffe14d'; hx.shadowBlur=18*pulse; }
  const g=hx.createRadialGradient(cx-r.r*0.3,cy-r.r*0.3,r.r*0.1,cx,cy,r.r); g.addColorStop(0,ready?'#fff3b0':'#9aa3b8'); g.addColorStop(1,ready?'#e09a10':'#4a5470');
  hx.fillStyle=g; hx.beginPath(); hx.arc(cx,cy,r.r,0,TAU); hx.fill(); hx.shadowBlur=0;
  hx.lineWidth=3; hx.strokeStyle='#14161c'; hx.stroke();
  if(cdFrac>0){ hx.fillStyle='rgba(10,14,30,.62)'; hx.beginPath(); hx.moveTo(cx,cy); hx.arc(cx,cy,r.r-2,-PI/2,-PI/2+TAU*cdFrac); hx.closePath(); hx.fill(); }
  hx.font=`${r.r*1.0}px ${FONT}`; hx.textAlign='center'; hx.textBaseline='middle'; hx.globalAlpha=ready?1:0.7; hx.fillText(tp.icon,cx,cy+2); hx.globalAlpha=1;
  if(cdFrac>0) txt(Math.ceil(st.cd)+'s',cx,cy+r.r*0.05,r.r*0.55,'#fff');
  const dr=r.r*0.42, dx=cx+r.r*0.72, dy=cy-r.r*0.72;
  hx.beginPath(); hx.arc(dx,dy,dr,0,TAU); hx.fillStyle=canPay?'#c43ae8':'#5a4a6a'; hx.fill(); hx.lineWidth=2; hx.strokeStyle='#14161c'; hx.stroke(); txt(String(tp.cost),dx,dy+1,dr*1.3,'#fff');
  txt(tp.name,cx,cy+r.r+11,Math.max(10,r.r*0.36),ready?'#ffe14d':'#cfd8ff');
  hx.restore();
}
function drawInfo(){
  if(!infoCard) return;
  const d=CARDS[infoCard]; const pw=W-24, x=12; const fs=Math.max(12,W*0.034);
  hx.font=`${fs}px system-ui,sans-serif`; const words=d.desc.split(' '); const lines=[]; let line='';
  for(const wd of words){ const t=line?line+' '+wd:wd; if(hx.measureText(t).width>pw-24){ lines.push(line); line=wd; } else line=t; } if(line) lines.push(line);
  const ph=fs*1.9+lines.length*fs*1.3+16, y=PANY-ph-10;
  hx.fillStyle='rgba(12,18,40,.94)'; rrp(hx,x,y,pw,ph,14); hx.fill(); hx.strokeStyle=RAR[d.rar||'common'][0]; hx.lineWidth=2.5; hx.stroke();
  txt(`${d.name}  ·  ${d.cost} 💧`,x+12,y+fs*1.05,fs*1.15,'#ffe14d','left');
  hx.fillStyle='#e8ecf8'; hx.font=`${fs}px system-ui,sans-serif`; hx.textAlign='left'; hx.textBaseline='middle';
  lines.forEach((l,i)=>hx.fillText(l,x+12,y+fs*2.3+i*fs*1.3));
}
function drawHUD(){
  const g=hx.createLinearGradient(0,0,0,TOPH); g.addColorStop(0,'rgba(38,56,110,.95)'); g.addColorStop(1,'rgba(20,33,61,.95)'); hx.fillStyle=g; hx.fillRect(0,0,W,TOPH);
  hx.fillStyle='#e5443f'; hx.fillRect(0,TOPH-3,W,3);
  const p=pauseRect; hx.fillStyle='rgba(255,255,255,.12)'; rrp(hx,p.x,p.y,p.w,p.h,8); hx.fill();
  hx.fillStyle='#fff'; hx.fillRect(p.x+p.w*0.32,p.y+p.h*0.28,p.w*0.12,p.h*0.44); hx.fillRect(p.x+p.w*0.56,p.y+p.h*0.28,p.w*0.12,p.h*0.44);
  const ns=Math.min(18,TOPH*0.36);
  txt(G.foe,p.x+p.w+10,TOPH*0.36,ns,'#ffb3b0','left');
  txt(`${G.mode.icon} ${G.mode.name} · ${G.th.emoji} ${G.th.name}`,p.x+p.w+10,TOPH*0.72,ns*0.64,'rgba(255,255,255,.78)','left',false);
  const tw=Math.min(110,W*0.27), tx=W-tw-6; hx.fillStyle='rgba(0,0,0,.35)'; rrp(hx,tx,5,tw,TOPH-10,8); hx.fill();
  const tm=Math.max(0,Math.ceil(G.time)), ts=`${Math.floor(tm/60)}:${String(tm%60).padStart(2,'0')}`;
  txt(G.overtime?'Overtime':G.mode.sudden?'Sudden death':'Time left',tx+tw/2,TOPH*0.3,TOPH*0.22,G.overtime||G.mode.sudden?'#ffb02e':'#cfd8ff','center',false);
  txt(ts,tx+tw/2,TOPH*0.66,TOPH*0.4,(G.time<=10&&!G.over)?'#ff6b6b':'#fff');
  if(G.rate>1) txt('x'+Math.round(G.rate*10)/10,tx-18,TOPH*0.5,TOPH*0.34,'#f07cff');
  const crownBox=(cy,n,col)=>{ const bw=Math.max(30,W*0.085), bh=bw*1.2, bx=W-bw-4; hx.fillStyle='rgba(10,14,30,.6)'; rrp(hx,bx,cy-bh/2,bw,bh,8); hx.fill(); hx.strokeStyle=col; hx.lineWidth=2; hx.stroke(); txt('👑',bx+bw/2,cy-bh*0.18,bw*0.42,'#fff','center',false); txt(String(n),bx+bw/2,cy+bh*0.25,bw*0.42,col); };
  const mid=toScreen(18,0,16,{}); crownBox(mid.y-H*0.05,G.crowns[1],'#ff8a85'); crownBox(mid.y+H*0.05,G.crowns[0],'#8cc2ff');
  drawFeed();
  const pg=hx.createLinearGradient(0,PANY,0,H); pg.addColorStop(0,'#2b4182'); pg.addColorStop(1,'#16224a'); hx.fillStyle=pg; hx.fillRect(0,PANY,W,PANH);
  hx.fillStyle='#8a5a2b'; hx.fillRect(0,PANY,W,5); hx.fillStyle='#c48a4e'; hx.fillRect(0,PANY,W,2);
  const er=emoteRect; hx.fillStyle=emoteOpen?'#ffd34d':'rgba(255,255,255,.14)'; rrp(hx,er.x,er.y,er.w,er.h,er.h/2); hx.fill(); txt('💬',er.x+er.w/2,er.y+er.h/2+1,er.h*0.62,'#fff','center',false);
  const nr=nextRect, nid=G.queues[0][0]; txt('Next',nr.x+nr.w/2,nr.y-9,Math.max(10,nr.w*0.2),'#fff');
  if(nid) hx.drawImage(cardFace(nid,nr.w,nr.h),nr.x,nr.y,nr.w,nr.h);
  const el=G.elixir[0], champUp=!!champOf(0);
  cardRects.forEach((r,i)=>{ const id=G.hands[0][i]; if(!id) return; const d=CARDS[id], sel=G.sel===i, lift=sel?-r.h*0.1:0, dragging=sel&&G.drag&&G.drag.inArena;
    hx.globalAlpha=dragging?0.4:1; hx.drawImage(cardFace(id,r.w,r.h),r.x,r.y+lift,r.w,r.h);
    const blocked=d.champ&&champUp;
    if(el<d.cost||blocked){ hx.fillStyle='rgba(15,20,40,.6)'; rrp(hx,r.x,r.y+lift,r.w,r.h,r.w*0.1); hx.fill(); if(!blocked){ const f=el/d.cost; hx.fillStyle='rgba(200,80,255,.35)'; hx.fillRect(r.x+2,r.y+lift+r.h*(1-f),r.w-4,r.h*f-2); } else txt('IN BATTLE',r.x+r.w/2,r.y+r.h*0.45,r.w*0.15,'#ffe14d'); }
    if(sel){ hx.strokeStyle='#ffe14d'; hx.lineWidth=3.5; rrp(hx,r.x-1,r.y+lift-1,r.w+2,r.h+2,r.w*0.1); hx.stroke(); }
    hx.globalAlpha=1; });
  const e=elixRect, dr=e.h*0.85;
  hx.fillStyle='#14161c'; rrp(hx,e.x+dr*0.6,e.y,e.w-dr*0.6,e.h,e.h/2); hx.fill();
  const inn={x:e.x+dr*1.4,y:e.y+3,w:e.w-dr*1.4-4,h:e.h-6}; hx.fillStyle='#3d2a55'; rrp(hx,inn.x,inn.y,inn.w,inn.h,inn.h/2); hx.fill();
  const fw=inn.w*el/10; if(fw>1){ const eg=hx.createLinearGradient(0,inn.y,0,inn.y+inn.h); eg.addColorStop(0,'#ff8cff'); eg.addColorStop(0.5,'#d63af0'); eg.addColorStop(1,'#9b2ee0'); hx.fillStyle=eg; rrp(hx,inn.x,inn.y,fw,inn.h,inn.h/2); hx.fill(); hx.fillStyle='rgba(255,255,255,.35)'; hx.fillRect(inn.x+inn.h/2,inn.y+2,Math.max(0,fw-inn.h),inn.h*0.25); }
  hx.strokeStyle='rgba(0,0,0,.45)'; hx.lineWidth=2; for(let i=1;i<10;i++){ const x=inn.x+inn.w*i/10; hx.beginPath(); hx.moveTo(x,inn.y); hx.lineTo(x,inn.y+inn.h); hx.stroke(); }
  const dx=e.x+dr*0.75, dy=e.y+e.h/2; hx.beginPath(); hx.moveTo(dx,dy-dr*1.05); hx.quadraticCurveTo(dx+dr*0.85,dy-dr*0.1,dx+dr*0.72,dy+dr*0.2); hx.arc(dx,dy+dr*0.15,dr*0.74,0.05,PI-0.05); hx.quadraticCurveTo(dx-dr*0.85,dy-dr*0.1,dx,dy-dr*1.05);
  const dg=hx.createLinearGradient(0,dy-dr,0,dy+dr); dg.addColorStop(0,'#f68cff'); dg.addColorStop(1,'#a020d8'); hx.fillStyle=dg; hx.fill(); hx.strokeStyle='#14161c'; hx.lineWidth=2.5; hx.stroke();
  txt(String(Math.floor(el)),dx,dy+dr*0.12,dr*1.05,'#fff');
  drawTapButton();
  if(emoteOpen){ const em=G.th.emotes; const bh=Math.max(34,PANH*0.24), by=PANY-bh-8; emoteRects=[];
    hx.font=`${Math.max(13,bh*0.4)}px ${FONT}`; let x=8; em.forEach((s,i)=>{ const w=hx.measureText(s).width+20; emoteRects.push({x,y:by,w,h:bh,i}); x+=w+6; });
    const tot=x-6, off=Math.max(0,(W-tot)/2-8); emoteRects.forEach(r=>{ r.x+=off; hx.fillStyle='#fff'; rrp(hx,r.x,r.y,r.w,r.h,12); hx.fill(); hx.strokeStyle='#14161c'; hx.lineWidth=2.5; hx.stroke(); hx.fillStyle='#14161c'; hx.textAlign='center'; hx.textBaseline='middle'; hx.fillText(em[r.i],r.x+r.w/2,r.y+r.h/2+1); }); }
  drawInfo();
  if(G.msg) txt(G.msg.s,W/2,PANY-26,Math.max(15,W*0.045),'#ff8080');
  const b=G.banner; if(b){ const p=b.t/b.dur, s=p<0.15?0.4+p/0.15*0.75:p<0.25?1.15-(p-0.15)/0.1*0.15:1, a=p>0.8?1-(p-0.8)/0.2:1;
    const cy=toScreen(9,0,16,{}).y; hx.save(); hx.globalAlpha=a; hx.translate(W/2,cy); hx.scale(s,s); hx.fillStyle='rgba(10,14,30,.55)'; hx.fillRect(-W/2,-H*0.045,W,H*(b.sub?0.1:0.09));
    txt(b.s,0,-H*0.005,Math.min(W*0.11,H*0.055),b.col); if(b.sub) txt(b.sub,0,H*0.035,Math.min(W*0.045,22),'#fff'); hx.restore(); }
}

// ---------------------------------------------------------------- ghost preview & deploy zone (3D)
let ghost=null, ghostId=null, ghostRing=null, ghostFill=null, zoneL=null, zoneR=null;
function ensureZone(){
  if(zoneL&&zoneL.parent) return;
  const m=new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:0.22,depthWrite:false});
  zoneL=new THREE.Mesh(geo('plane'),m); zoneR=new THREE.Mesh(geo('plane'),m);
  for(const z of [zoneL,zoneR]){ z.rotation.x=-PI/2; z.renderOrder=3; z.visible=false; dynRoot.add(z); }
  ghostRing=new THREE.Mesh(geo('ring'),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,depthWrite:false})); ghostRing.rotation.x=-PI/2; ghostRing.renderOrder=3; ghostRing.visible=false; dynRoot.add(ghostRing);
  ghostFill=new THREE.Mesh(geo('circle'),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.18,depthWrite:false})); ghostFill.rotation.x=-PI/2; ghostFill.renderOrder=3; ghostFill.visible=false; dynRoot.add(ghostFill);
}
function hideGhost(){ if(ghost){ dynRoot.remove(ghost); ghost=null; ghostId=null; } if(zoneL){ zoneL.visible=zoneR.visible=ghostRing.visible=ghostFill.visible=false; } }
function updateGhost(){
  ensureZone();
  if(!G||!G.drag||G.sel<0||!G.drag.inArena||G.over){ hideGhost(); return; }
  const id=G.hands[0][G.sel], c=CARDS[id]; const wp=screenToGround(G.drag.x,G.drag.y); if(!wp){ hideGhost(); return; }
  const [x,y]=clampDeploy(0,id,wp.x,wp.y);
  if(c.type==='spell'){
    if(ghost){ dynRoot.remove(ghost); ghost=null; ghostId=null; }
    const r=c.sp.r||1.2; ghostRing.visible=ghostFill.visible=true; ghostRing.position.set(x,0.08,y); ghostRing.scale.set(r,r,1); ghostFill.position.set(x,0.07,y); ghostFill.scale.set(r,r,1);
    ghostFill.material.color.set(c.role==='sbuff'?'#7dff8a':'#ff7a5a'); zoneL.visible=zoneR.visible=false; return;
  }
  if(ghostId!==id){ if(ghost) dynRoot.remove(ghost); ghost=new THREE.Group(); const n=Math.min(6,c.count||1);
    for(let i=0;i<n;i++){ const m=buildModel(c.model,0); m.traverse(o=>{ if(o.isMesh){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=0.55; o.material.depthWrite=false; } }); const a=i/n*TAU+0.4, rr=n>1?(n>4?0.75:0.55):0; m.position.set(Math.cos(a)*rr,c.flying?1.5:0,Math.sin(a)*rr); m.rotation.y=PI; m.scale.multiplyScalar(VS); ghost.add(m); }
    dynRoot.add(ghost); ghostId=id; }
  ghost.position.set(x,0,y);
  if(c.range>2){ ghostRing.visible=true; ghostRing.position.set(x,0.08,y); ghostRing.scale.set(c.range,c.range,1); ghostFill.visible=false; } else { ghostRing.visible=false; ghostFill.visible=false; }
  if(c.deployAnywhere){ zoneL.visible=zoneR.visible=false; return; }
  const lz=pocketOpen(0,4)?10.5:17.4, rz=pocketOpen(0,14)?10.5:17.4;
  zoneL.visible=zoneR.visible=true; zoneL.scale.set(9,lz,1); zoneL.position.set(4.5,0.06,lz/2); zoneR.scale.set(9,rz,1); zoneR.position.set(13.5,0.06,rz/2);
}

// ---------------------------------------------------------------- input
const pt=e=>{ const r=hud.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; };
const hit=(r,p)=>r&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
const inArena=p=>p.y>TOPH&&p.y<PANY-2&&!(tapState(0)&&Math.hypot(p.x-(tapRect.x+tapRect.r),p.y-(tapRect.y+tapRect.r))<tapRect.r+4);
let infoCard=null, holdTimer=null;
function tryDeploy(i,p){
  const id=G.hands[0][i]; if(!id) return;
  if(G.elixir[0]<CARDS[id].cost){ G.msg={s:'Not enough elixir!',t:1.1}; sfx('bad'); return; }
  const wp=screenToGround(p.x,p.y); if(!wp) return;
  const r=playCard(0,i,wp.x,wp.y);
  if(r==='champ'){ G.msg={s:'Your Champion is already in battle!',t:1.4}; sfx('bad'); return; }
  if(r){ G.sel=-1; buzz(15); if(CARDS[id].champ) sfx('champ'); }
}
hud.addEventListener('pointerdown',e=>{
  e.preventDefault(); initAudio(); if(!G||G.over||G.paused) return; const p=pt(e);
  if(hit(pauseRect,p)){ pauseGame(); return; }
  if(emoteOpen){ const r=emoteRects.find(r=>hit(r,p)); emoteOpen=false; if(r){ G.emotes=G.emotes.filter(x=>x.team!==0); G.emotes.push({team:0,text:G.th.emotes[r.i],t:0}); sfx('emote'); if(Math.random()<0.6) setTimeout(()=>{ if(G&&!G.over) aiEmote(Math.random()<0.5?'taunt':'gloat',true); },900+Math.random()*800); return; } }
  if(hit(emoteRect,p)){ emoteOpen=true; sfx('pop'); return; }
  if(tapState(0)&&Math.hypot(p.x-(tapRect.x+tapRect.r),p.y-(tapRect.y+tapRect.r))<tapRect.r+4){
    const r=useTap(0); const msg={elixir:'Not enough elixir!',cd:'Ability recharging…',notarget:'No target in range!',stunned:'Your Champion is stunned!'}[r];
    if(msg){ G.msg={s:msg,t:1.1}; sfx('bad'); } else if(r==='ok'){ buzz(25); sfx('champ'); } return; }
  const ci=cardRects.findIndex(r=>hit(r,p));
  if(ci>=0){ const was=G.sel===ci; G.sel=ci; G.drag={x:p.x,y:p.y,sx:p.x,sy:p.y,inArena:false,toggle:was}; try{ hud.setPointerCapture(e.pointerId); }catch(_){} sfx('pop');
    clearTimeout(holdTimer); holdTimer=setTimeout(()=>{ if(G&&G.drag&&!G.drag.inArena&&Math.hypot(G.drag.x-G.drag.sx,G.drag.y-G.drag.sy)<10) infoCard=G.hands[0][ci]; },420); return; }
  if(G.sel>=0&&inArena(p)) tryDeploy(G.sel,p);
});
hud.addEventListener('pointermove',e=>{ if(!G||!G.drag) return; const p=pt(e); G.drag.x=p.x; G.drag.y=p.y; G.drag.inArena=inArena(p); if(G.drag.inArena) infoCard=null; });
hud.addEventListener('pointerup',e=>{ clearTimeout(holdTimer); if(!G||!G.drag){ infoCard=null; return; } const p=pt(e), d=G.drag; G.drag=null; const wasInfo=!!infoCard; infoCard=null;
  if(inArena(p)&&G.sel>=0) tryDeploy(G.sel,p); else if(!wasInfo&&d.toggle&&Math.hypot(p.x-d.sx,p.y-d.sy)<8) G.sel=-1; });
hud.addEventListener('pointercancel',()=>{ clearTimeout(holdTimer); infoCard=null; if(G) G.drag=null; });
hud.addEventListener('contextmenu',e=>e.preventDefault());

// ---------------------------------------------------------------- screens
function pauseGame(){ G.paused=true; $('#pause').hidden=false; }
$('#resumeBtn').onclick=()=>{ G.paused=false; $('#pause').hidden=true; last=performance.now(); };
$('#quitBtn').onclick=()=>{ $('#pause').hidden=true; G=null; showMenu(); };
function randomDeck(pool){
  const chars=pool.filter(k=>!isSpell(k)), spells=pool.filter(isSpell);
  for(let tries=0;tries<300;tries++){
    const ch=shuffle(chars.slice()), champ=ch.find(k=>CARDS[k].champ);
    const d=(champ?[champ]:[]).concat(ch.filter(k=>!CARDS[k].champ).slice(0,DECK_CHARS-(champ?1:0))).concat(shuffle(spells.slice()).slice(0,DECK_SPELLS));
    const cs=d.map(k=>CARDS[k]);
    if(d.length!==DECK_CHARS+DECK_SPELLS) continue;
    if(!cs.some(c=>c.type!=='spell'&&c.targets==='buildings')) continue;
    if(!cs.some(c=>c.type!=='spell'&&c.targets==='all')) continue;
    return d;
  }
  return null;
}
// AI decks: Rookie plays the starter deck, Knight plays cards a little ahead of your trophies, Champion plays the whole pool.
function aiDeckFor(th){
  if(diffIdx===0) return th.cards.slice();
  const cap=diffIdx===1?Math.max(400,trophies+300):1e9;
  return randomDeck(th.pool.filter(k=>CARDS[k].unlock<=cap))||th.cards.slice();
}
function aiMixDeck(){ const cap=diffIdx===2?1e9:Math.max(400,trophies+300); return randomDeck(PLAYABLE.filter(k=>CARDS[k].unlock<=cap))||THEMES[0].cards.slice(); }
function startBattle(){
  initAudio(); $('#menu').hidden=true; $('#end').hidden=true; menuPreview=null; infoCard=null;
  const mix=modeKey==='mix', th=THEMES[arenaIdx];
  if(!mix) arenaDeck=loadDeck(th);
  const deck=mix?mixDeck:arenaDeck;
  if(!deckValid(deck)&&!AUTOTEST){ $('#menu').hidden=false; renderMenu(); return; }
  newGame(arenaIdx,diffIdx,modeKey,AUTOTEST?aiDeckFor(th):deck,mix?aiMixDeck():aiDeckFor(th));
  ensureZone(); hideGhost(); emoteOpen=false; fitCamera(W,H,TOPH,PANH);
  G.hands[0].concat(G.queues[0]).forEach(requestPortrait); G.hands[1].concat(G.queues[1]).forEach(requestPortrait);
  last=performance.now(); fpsAcc=0; fpsN=0; Music.stop(); Music.kick();
}
$('#playBtn').onclick=startBattle; $('#againBtn').onclick=startBattle;
$('#nextBtn').onclick=()=>{ arenaIdx=(arenaIdx+1)%THEMES.length; store.set('arena',arenaIdx); arenaDeck=loadDeck(THEMES[arenaIdx]); startBattle(); };
$('#menuBtn').onclick=()=>{ G=null; showMenu(); };
function showEnd(){ Music.stop();
  const w=G.winner, th=G.th;
  const delta = w===0 ? 25+G.crowns[0]*5 : w===1 ? -15 : 0;
  const before=trophies;
  trophies=Math.max(0,trophies+delta); store.set('trophies',trophies);
  const fresh=Object.keys(CARDS).filter(k=>!CARDS[k].hidden&&CARDS[k].unlock>before&&CARDS[k].unlock<=trophies);
  const ul=$('#endUnlock'); ul.innerHTML='';
  if(fresh.length){ const here=fresh.filter(k=>th.pool.includes(k)); const show=(here.length?here:fresh).slice(0,4);
    const h=document.createElement('div'); h.className='unlockHead'; h.textContent=`🔓 ${fresh.length} NEW CARD${fresh.length>1?'S':''} UNLOCKED!`; ul.appendChild(h);
    const g=document.createElement('div'); g.className='grid unlockGrid'; show.forEach(id=>{ requestPortrait(id); g.appendChild(cardTile(id,null,'new')); }); ul.appendChild(g);
    if(fresh.length>show.length){ const m=document.createElement('div'); m.className='tag small'; m.textContent=`+${fresh.length-show.length} more across the other arenas`; ul.appendChild(m); }
    sfx('crown'); }
  ul.hidden=!fresh.length;
  streak = w===0 ? streak+1 : 0; store.set('streak',streak);
  if(w===0){ best[th.id]=Math.max(best[th.id]||0,G.crowns[0]); store.set('best',best); }
  $('#endTitle').textContent=w===0?'VICTORY!':w===1?'DEFEAT':'DRAW';
  $('#endTitle').style.color=w===0?'#ffc83d':w===1?'#ff8a85':'#e8e8e8';
  $('#cBlue').textContent='👑'.repeat(G.crowns[0])||'–'; $('#cRed').textContent='👑'.repeat(G.crowns[1])||'–';
  $('#endFoe').textContent=G.foe;
  $('#endTro').textContent=`🏆 ${trophies}  (${delta>=0?'+':''}${delta})`+(streak>1?`   🔥 ${streak} win streak`:'');
  $('#endSub').textContent=w===0?`You beat ${G.foe} in ${th.name}!`:w===1?`${G.foe} won ${G.crowns[1]}–${G.crowns[0]}. Rematch?`:'Even crowns and even towers.';
  $('#end').hidden=false;
}
let menuPreview=null;
function showMenu(){ Music.stop(); setTimeout(()=>Music.kick(),0); $('#menu').hidden=false; $('#end').hidden=true; hideGhost(); renderMenu(); startPreview(); }
function startPreview(){
  const th=THEMES[arenaIdx];
  dynRoot.children.slice().forEach(o=>dynRoot.remove(o)); clearFx3(); zoneL=null;
  buildArena(th);
  for(const [team,kind,x,y] of [[1,'king',9,3],[1,'princess',3.5,6.5],[1,'princess',14.5,6.5],[0,'king',9,29],[0,'princess',3.5,25.5],[0,'princess',14.5,25.5]]){ const t=buildTower(th,kind,team); t.position.set(x,0,y); t.userData.rig.defender.rotation.y=team?0:PI; dynRoot.add(t); }
  const troops=loadDeck(th).filter(id=>CARDS[id].type!=='spell').slice(0,6); const models=[];
  troops.forEach((id,i)=>{ const team=i%2; const m=getModel(CARDS[id].model,team); const a=i/troops.length*TAU; m.position.set(9+Math.cos(a)*2.8,CARDS[id].flying?1.4:0,16+Math.sin(a)*2.8); m.rotation.y=-a-PI/2; m.scale.multiplyScalar(VS); dynRoot.add(m); models.push(m); });
  renderer.setSize(W,H,false); camera.aspect=W/H; camera.clearViewOffset(); camera.updateProjectionMatrix();
  menuPreview={t:0,models};
}
function arenaTile(i){
  const th=THEMES[i]; const b=document.createElement('button'); b.type='button'; b.className='arena'+(i===arenaIdx?' on':''); b.id='arena-'+th.id;
  b.style.background=`linear-gradient(160deg, ${th.sky[1]} 0%, ${th.ground[1]} 55%, ${th.outer} 100%)`;
  const stars=best[th.id]||0;
  const fresh=th.added&&(Date.now()-Date.parse(th.added))<4*864e5;
  b.innerHTML=(fresh?`<span class="anew">NEW · ${th.news||'In the news'}</span>`:'')+`<span class="aemoji">${th.emoji}</span><span class="aname">${th.name}</span><span class="ajob">${th.job}</span><span class="astars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span>`;
  const kc=portraitCache['king:'+i]; if(kc){ const c=document.createElement('canvas'); c.width=128; c.height=160; c.className='aking'; c.getContext('2d').drawImage(kc,0,0,128,160); b.appendChild(c); } else requestPortrait('king:'+i);
  b.onclick=()=>{ arenaIdx=i; store.set('arena',i); arenaDeck=loadDeck(th); swapPick=null; renderMenu(); startPreview(); };
  return b;
}
function cardInfo(id){ const d=CARDS[id]; const kind=d.type==='spell'?'Spell':d.type==='building'?'Building':d.champ?'Champion':'Troop';
  const lock=!unlocked(id)?`<br><span class="lockline">🔒 Unlocks at 🏆 ${d.unlock}</span>`:'';
  $('#info').innerHTML=`<b>${d.name}</b> · ${d.cost} elixir · ${kind}<br>${d.desc}`+(d.hp?`<br><span class="dim">HP ${d.hp}${d.count>1?' ×'+d.count:''} · ${d.targets==='buildings'?'Targets buildings':d.targets==='all'?'Hits air & ground':'Hits ground'}${d.flying?' · Flying':''}${d.range>1.5?' · Range '+d.range:''}</span>`:'')+lock; }
function cardTile(id,onTap,extra=''){
  const b=document.createElement('button'); b.type='button'; b.className='cardtile '+extra; b.id='card-'+id+(extra?'-'+extra.split(' ')[0]:''); const lk=!unlocked(id);
  b.setAttribute('aria-label',CARDS[id].name+', '+CARDS[id].cost+' elixir'+(lk?', locked until '+CARDS[id].unlock+' trophies':''));
  const c=document.createElement('canvas'); const w=88,h=110; c.width=w*2; c.height=h*2; const x=c.getContext('2d'); drawCardFace(x,id,w,h,2);
  if(lk){ x.save(); x.scale(2,2); x.fillStyle='rgba(12,16,34,.72)'; rrp(x,0,0,w,h,w*0.1); x.fill(); x.font=`${w*0.34}px ${FONT}`; x.textAlign='center'; x.textBaseline='middle'; x.fillText('🔒',w/2,h*0.36);
    x.font=`${w*0.17}px ${FONT}`; x.lineWidth=3; x.strokeStyle='#14161c'; x.strokeText('🏆'+CARDS[id].unlock,w/2,h*0.62); x.fillStyle='#ffd34d'; x.fillText('🏆'+CARDS[id].unlock,w/2,h*0.62); x.restore(); }
  b.appendChild(c);
  if(swapPick===id) b.classList.add('pick');
  b.onclick=()=>{ cardInfo(id); if(onTap) onTap(id); };
  return b;
}
function emptySlot(label){ const e=document.createElement('div'); e.className='cardtile empty'; e.innerHTML=`<span>${label}</span>`; return e; }
// One tap: a fresh legal deck (6 characters incl. a Champion + 2 spells) from every unlocked card in this arena, or the whole game in Mix & Match.
function randomizeDeck(){
  const th=THEMES[arenaIdx], pool=(modeKey==='mix'?PLAYABLE:th.pool).filter(k=>unlocked(k)&&!CARDS[k].hidden), cur=curDeck().slice().sort().join();
  let d=null; for(let i=0;i<20;i++){ d=randomDeck(pool); if(d&&d.slice().sort().join()!==cur) break; }
  if(!d) return; swapPick=null; setDeck(d); d.forEach(requestPortrait); sfx('pop'); renderMenu();
  $('#info').innerHTML=`<b>🎲 New deck!</b><br>${d.map(k=>CARDS[k].short||CARDS[k].name).join(' · ')}`;
}
function saveDeck(){ if(modeKey==='mix') store.set('mix',mixDeck); else store.set('deck_'+THEMES[arenaIdx].id,arenaDeck); }
function curDeck(){ return modeKey==='mix'?mixDeck:arenaDeck; }
function setDeck(d){ if(modeKey==='mix') mixDeck=d; else arenaDeck=d; saveDeck(); }
function deckTap(id){
  const d=curDeck();
  if(swapPick){ const np=swapPick; if(isSpell(np)!==isSpell(id)){ $('#info').innerHTML=`<b>Wrong slot</b><br>${isSpell(np)?'Spells':'Characters'} can only swap with ${isSpell(np)?'spells':'characters'}.`; return; }
    if(CARDS[np].champ&&!CARDS[id].champ&&champCount(d)){ $('#info').innerHTML='<b>One Champion per deck</b><br>Swap it with your current Champion instead.'; return; }
    swapPick=null; setDeck(d.map(k=>k===id?np:k)); $('#info').innerHTML=`<b>${CARDS[np].name}</b> is in your deck.<br>${CARDS[np].desc}`; sfx('pop'); renderMenu(); return; }
  setDeck(d.filter(k=>k!==id)); renderMenu();
}
function collTap(id){
  if(!unlocked(id)){ swapPick=null; renderMenu(); cardInfo(id); return; }
  const d=curDeck(), sp=isSpell(id), n=d.filter(k=>isSpell(k)===sp).length, cap=sp?DECK_SPELLS:DECK_CHARS;
  if(swapPick===id){ swapPick=null; renderMenu(); cardInfo(id); return; }
  if(n<cap&&!(CARDS[id].champ&&champCount(d))){ swapPick=null; setDeck(d.concat([id])); renderMenu(); cardInfo(id); return; }
  swapPick=id; renderMenu(); cardInfo(id);
  $('#info').innerHTML+=`<br><span class="lockline">👆 Now tap a ${CARDS[id].champ&&champCount(d)?'Champion':sp?'spell':'character'} in your deck to swap it out.</span>`;
}
function renderRoad(){
  const th=THEMES[arenaIdx], list=$('#roadList'); list.innerHTML='';
  $('#roadTro').textContent=`🏆 ${trophies}`; $('#roadArena').textContent=`${th.emoji} Showing ${th.name} unlocks`;
  for(const step of UNLOCK_STEPS){ if(!step) continue;
    const here=th.pool.filter(k=>CARDS[k].unlock===step), all=Object.keys(CARDS).filter(k=>!CARDS[k].hidden&&CARDS[k].unlock===step);
    const row=document.createElement('div'); row.className='roadRow'+(trophies>=step?' done':'');
    row.innerHTML=`<div class="roadStep"><span>🏆</span>${step}</div><div class="roadInfo">${trophies>=step?'✅ Unlocked':'🔒 '+(step-trophies)+' to go'}<br><span class="dim">${all.length} cards across all arenas</span></div>`;
    const g=document.createElement('div'); g.className='roadCards'; here.forEach(id=>{ requestPortrait(id); g.appendChild(cardTile(id,null,'road')); }); row.appendChild(g); list.appendChild(row); }
}
$('#randBtn').onclick=$('#randBtn2').onclick=()=>{ initAudio(); randomizeDeck(); };
$('#roadBtn').onclick=()=>{ $('#menu').hidden=true; $('#road').hidden=false; renderRoad(); };
$('#roadBack').onclick=()=>{ $('#road').hidden=true; $('#menu').hidden=false; renderMenu(); };
function renderMenu(){
  const ag=$('#arenas'); ag.innerHTML=''; THEMES.forEach((_,i)=>ag.appendChild(arenaTile(i)));
  const mg=$('#modes'); mg.innerHTML='';
  for(const k in MODES){ const m=MODES[k]; const b=document.createElement('button'); b.type='button'; b.className='mode'+(k===modeKey?' on':''); b.id='mode-'+k; b.innerHTML=`<span>${m.icon}</span>${m.name}`; b.onclick=()=>{ modeKey=k; store.set('mode',k); swapPick=null; renderMenu(); }; mg.appendChild(b); }
  $('#modeDesc').textContent=MODES[modeKey].desc;
  const th=THEMES[arenaIdx], mix=modeKey==='mix', deck=curDeck();
  const chars=deck.filter(k=>!isSpell(k)), spells=deck.filter(isSpell), ok=deckValid(deck);
  $('#deckHead').textContent = mix ? `🃏 MIX DECK · ${chars.length}/6 + ${spells.length}/2` : `${th.emoji} YOUR ${th.name.toUpperCase()} DECK · ${chars.length}/6 + ${spells.length}/2`;
  const dk=$('#deck'); dk.innerHTML='';
  for(let i=0;i<DECK_CHARS;i++){ const id=chars[i]; if(id){ requestPortrait(id); dk.appendChild(cardTile(id,deckTap,'in')); } else dk.appendChild(emptySlot('Character')); }
  for(let i=0;i<DECK_SPELLS;i++){ const id=spells[i]; if(id) dk.appendChild(cardTile(id,deckTap,'in spell')); else dk.appendChild(emptySlot('Spell')); }
  const pool=mix?null:th.pool; const col=$('#collection'); col.innerHTML='';
  if(mix){ for(const t of THEMES){ const ids=t.pool.filter(k=>!deck.includes(k)&&unlocked(k)); if(!ids.length) continue; const hd=document.createElement('div'); hd.className='collgroup'; hd.textContent=`${t.emoji} ${t.name}`; col.appendChild(hd);
      ids.forEach(id=>{ requestPortrait(id); col.appendChild(cardTile(id,collTap,'coll')); }); }
    $('#collHead').textContent='ALL UNLOCKED CARDS · tap to add'; }
  else { const ids=pool.filter(k=>!deck.includes(k)); const open=pool.filter(unlocked).length;
    ids.forEach(id=>{ requestPortrait(id); col.appendChild(cardTile(id,collTap,'coll')); });
    $('#collHead').textContent=`${th.emoji} ${th.name.toUpperCase()} CARDS · ${open}/${pool.length} unlocked`; }
  $('#deckPeek').textContent='Deck: '+chars.concat(spells).map(k=>CARDS[k].short||CARDS[k].name).join(' · ');
  const nx=UNLOCK_STEPS.find(v=>v>trophies); $('#nextUnlock').textContent=nx?`Next unlock at 🏆 ${nx} (${nx-trophies} to go)`:'Every card unlocked!';
  $('#trophies').textContent=`🏆 ${trophies}`+(streak>1?`  🔥${streak}`:'');
  const need=(DECK_CHARS-chars.length)+(DECK_SPELLS-spells.length);
  $('#playBtn').disabled = !ok;
  $('#playBtn').textContent = ok ? 'BATTLE' : need>0 ? `PICK ${need} MORE` : 'FIX DECK';
  document.querySelectorAll('#diffSeg button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.d===diffIdx)));
  document.querySelectorAll('#qualSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.q===(QUALITY.shadows?'high':'smooth'))));
}
document.querySelectorAll('#diffSeg button').forEach(b=>b.onclick=()=>{ diffIdx=+b.dataset.d; store.set('diff',diffIdx); renderMenu(); });
function setQuality(q){ store.set('quality',q); QUALITY.outlines=QUALITY.shadows=q==='high'; applyQuality(); for(const k in portraitCache) delete portraitCache[k]; faceCache={}; layout(); }
document.querySelectorAll('#qualSeg button').forEach(b=>b.onclick=()=>{ setQuality(b.dataset.q); renderMenu(); startPreview(); });

// ---------------------------------------------------------------- loop
let last=performance.now(), menuDirty=0, fpsAcc=0, fpsN=0;
function frame(now){
  let rawDt=(now-last)/1000, dt=Math.min(0.05,rawDt); last=now;
  try{
    if(pumpPortraits(G?2:3) && !G && !$('#menu').hidden){ menuDirty=0.25; }
    if(menuDirty>0){ menuDirty-=dt; if(menuDirty<=0) renderMenu(); }
    if(G){
      if(!G.paused){ const steps=AUTOTEST?3:1;
        // drama: brief hit-stop on huge blows, slow motion when towers fall or Champions land
        let ts=1; if(G.freezeT>0){ G.freezeT-=rawDt; ts=0.06; } else if(G.slowT>0){ G.slowT-=rawDt; ts=G.slowT>0.25?0.32:0.32+(1-G.slowT/0.25)*0.68; }
        const sdt=dt*ts; for(let i=0;i<steps;i++) update(sdt); syncUnits(sdt*steps); syncWorld(sdt*steps); updateGhost();
        if(G.fovKick>0){ G.fovKick=Math.max(0,G.fovKick-rawDt*1.6); camera.fov=36-Math.sin(G.fovKick*PI)*2.6; camera.updateProjectionMatrix(); } else if(camera.fov!==36){ camera.fov=36; camera.updateProjectionMatrix(); }
        if(!AUTOTEST&&QUALITY.shadows&&!G.over){ fpsAcc+=rawDt; fpsN++; if(fpsN>=150){ if(fpsAcc/fpsN>1/30){ setQuality('smooth'); G.msg={s:'Switched to Smooth graphics for speed',t:2.5}; } fpsAcc=0; fpsN=0; } } }
      animateArena(dt,G.t);
      const sh=G.shake; const ox=sh>0?(Math.random()-0.5)*sh*0.5:0, oy=sh>0?(Math.random()-0.5)*sh*0.5:0;
      camera.position.x+=ox; camera.position.y+=oy; renderer.render(scene,camera); camera.position.x-=ox; camera.position.y-=oy;
      hx.setTransform(DPR,0,0,DPR,0,0); hx.clearRect(0,0,W,H); drawWorldOverlay(); drawHUD();
    } else if(menuPreview){
      menuPreview.t+=dt; const a=menuPreview.t*0.12; camera.position.set(9+Math.sin(a)*24,18,16+Math.cos(a)*24); camera.lookAt(9,0,16);
      menuPreview.models.forEach((m,i)=>{ m.position.y=(m.userData.baseY??(m.userData.baseY=m.position.y))+Math.abs(Math.sin(menuPreview.t*4+i))*0.25; m.rotation.y+=dt*0.8; });
      animateArena(dt,menuPreview.t); updateFx3(dt); renderer.render(scene,camera);
      hx.setTransform(DPR,0,0,DPR,0,0); hx.clearRect(0,0,W,H);
    }
  }catch(err){ console.error(err); }
  requestAnimationFrame(frame);
}
window.addEventListener('resize',layout);
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&G&&!G.over&&!G.paused) pauseGame(); if(AC){ if(document.hidden) AC.suspend(); else AC.resume(); } });
document.querySelectorAll('[data-snd]').forEach(b=>b.onclick=()=>{ initAudio(); setSound(b.dataset.snd,!SND[b.dataset.snd]); });
document.addEventListener('pointerdown',()=>initAudio(),{passive:true});
syncSoundButtons();
init3D(glc); layout();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ faceCache={}; if(!$('#menu').hidden) renderMenu(); });
if(AUTOTEST){ $('#menu').hidden=true; const q=new URLSearchParams(location.search); arenaIdx=+(q.get('arena')||0); modeKey=q.get('mode')||'classic'; startBattle(); }
else showMenu();
window.__game=()=>G;
requestAnimationFrame(frame);
