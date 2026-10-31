// =====================================================================
//  SIM — battle rules, abilities, AI, and 3D sync
// =====================================================================
const AW=18, AH=32, BRIDGES=[3.5,14.5];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const rnd=(a,b)=>a+Math.random()*(b-a);
const AUTOTEST=/autotest/.test(location.search);
const DIFF=[
  {name:'Rookie',  think:2.0, pushAt:9.5, elixirMul:0.85, smart:0},
  {name:'Knight',  think:1.1, pushAt:8,   elixirMul:1.0,  smart:1},
  {name:'Champion',think:0.55,pushAt:7,   elixirMul:1.12, smart:2},
];
const MODES={
  classic:{name:'Classic',icon:'⚔️',time:180,desc:'3 minutes. Elixir doubles in the last minute. Overtime if crowns are tied.'},
  rush:{name:'Rush Hour',icon:'⚡',time:150,elixir:3,desc:'Triple elixir from the first second. Pure chaos, constant pushes.'},
  sudden:{name:'Sudden Death',icon:'💀',time:120,elixir:2,sudden:true,desc:'Double elixir. The first tower to fall ends the match.'},
  chaos:{name:'Chaos',icon:'🌪️',time:180,chaos:true,desc:'Power orbs everywhere and a random arena event every 20 seconds.'},
  mix:{name:'Mix & Match',icon:'🃏',time:180,mix:true,desc:'Build a 6 + 2 deck from every card you have unlocked in any arena. The AI brings a random mix.'},
};
const CHAOS_EVENTS=[
  {name:'POWER STORM',icon:'🌩️',run(){ for(let i=0;i<4;i++) spawnOrb(rnd(2,16),i<2?rnd(18,27):rnd(5,14)); }},
  {name:'ELIXIR RAIN',icon:'💧',run(){ G.elixir[0]=Math.min(10,G.elixir[0]+4); G.elixir[1]=Math.min(10,G.elixir[1]+4); for(let i=0;i<60;i++) PSA.spawn(rnd(0,18),rnd(6,10),rnd(0,32),0,-6,0,1.2,0.35,'#f68cff',1,2); }},
  {name:'GIANT TIME',icon:'🍄',run(){ for(const u of G.units) if(!u.dead&&!u.building) makeGiant(u,8); }},
  {name:'METEOR SHOWER',icon:'☄️',run(){ for(let i=0;i<8;i++){ const x=rnd(1.5,16.5), y=rnd(3,29); if(y>14.5&&y<17.5) continue; const obj=buildFall('rock',TEAMC[0]); obj.scale.setScalar(0.5); dynRoot.add(obj); G.spells.push({id:'meteor',s:{k:'mini',r:1.4,dmg:160,fall:'rock'},team:-1,x,y,t:0.6+i*0.25,max:0.6+i*0.25,obj,mini:true}); } }},
  {name:'SUGAR RUSH',icon:'🍬',run(){ for(const u of G.units) if(!u.dead&&!u.building) u.rush=Math.max(u.rush,8); }},
];
function spawnOrb(x,y){ const keys=Object.keys(POWERS), k=keys[Math.random()*keys.length|0]; G.orbs.push({k,x,y,t:0,life:14}); fxRing(x,y,0.2,1.6,0.5,POWERS[k].col); }
const POWERS={
  fire:{label:'FIRE POWER!',icon:'🔥',col:'#ff7a1a'}, turbo:{label:'TURBO BOOTS!',icon:'⚡',col:'#ffe14d'},
  giant:{label:'GIANT MODE!',icon:'🍄',col:'#ff5ab0'}, shield:{label:'SHIELD UP!',icon:'🛡️',col:'#6ee7ff'}, heal:{label:'MEGA HEAL!',icon:'💖',col:'#7dff8a'},
};
(function normalize(){
  for(const k in CARDS){ const c=CARDS[k]; c.type=c.type||'troop';
    if(c.type==='spell') continue;
    c.count=c.count||1; c.targets=c.targets||'ground';
    c.radius=c.radius||(c.model.k==='v'?0.85:0.4); c.mass=c.mass||(c.type==='building'?1e6:4);
    c.speed=c.type==='building'?0:(c.speed??1.0); c.sight=c.sight||Math.max(5.5,(c.range||0)+1);
  }
})();
let G=null, UID=1;

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

// ---------------------------------------------------------------- setup
function mkTower(team,kind,x,y){
  const k=kind==='king';
  return {isTower:true,building:true,team,kind,x,y,hp:k?2600:1500,maxHp:k?2600:1500,dmg:k?100:85,hs:k?1.0:0.8,range:k?7:7.5,radius:k?1.5:1.1,
    cd:0.5,active:!k,target:null,dead:false,frozen:0,hackT:0,atk:0,mass:1e6,yaw:team?0:PI};
}
function newGame(themeIdx,diffIdx,modeKey='classic',deck0=null,deck1=null){
  const th=THEMES[themeIdx];
  dynRoot.children.slice().forEach(o=>dynRoot.remove(o)); clearFx3();
  buildArena(th);
  const mode=MODES[modeKey]||MODES.classic;
  const decks=[shuffle((deck0||th.cards).slice()),shuffle((deck1||th.cards).slice())];
  G={nums:[],debris:[],slowT:0,freezeT:0,fovKick:0,th,mode,modeKey,chaosT:12,t:0,time:mode.time,overtime:false,over:false,overT:0,winner:-1,units:[],towers:[],projs:[],dying:[],spells:[],clouds:[],pulls:[],rolls:[],barrage:[],revives:[],executions:[],orbs:[],
    callouts:[],beams:[],bolts:[],emotes:[],feed:[],booms:[],tapCd:[0,0],detected:new Set(),graveyard:[[],[]],orbTimer:18,elixir:[5,5],hands:[decks[0].slice(0,4),decks[1].slice(0,4)],queues:[decks[0].slice(4),decks[1].slice(4)],
    crowns:[0,0],diff:DIFF[diffIdx],aiTimer:2.5,ai0Timer:2,shake:0,banner:null,sel:-1,drag:null,paused:false,dbl:false,msg:null,
    foe:th.foes[Math.random()*th.foes.length|0],aiEmoteCd:6,stats:{kills:0}};
  G.towers.push(mkTower(1,'princess',3.5,6.5),mkTower(1,'princess',14.5,6.5),mkTower(1,'king',9,3));
  G.towers.push(mkTower(0,'princess',3.5,25.5),mkTower(0,'princess',14.5,25.5),mkTower(0,'king',9,29));
  for(const t of G.towers){ t.obj=buildTower(th,t.kind,t.team); mergeRigid(t.rig0=t.obj.userData.rig.main); t.obj.position.set(t.x,0,t.y); t.rig=t.obj.userData.rig; dynRoot.add(t.obj); t.shadow=shadowFor(t.radius*1.5); t.shadow.position.set(t.x+0.25,0.03,t.y+0.3); }
  showBanner('FIGHT!','',1.6);
}
function shadowFor(r){ const m=new THREE.Mesh(geo('plane'),shadowMat); m.rotation.x=-PI/2; m.scale.set(r*2,r*2,1); m.renderOrder=1; dynRoot.add(m); return m; }

function spawnUnit(id,team,x,y,deploy=1){
  const c=CARDS[id];
  const u={uid:UID++,card:id,c,team,x,y,hp:c.hp,maxHp:c.hp,dmg:c.dmg,hs:c.hs,range:c.range||0,speed:c.speed,sight:c.sight,targets:c.targets,flying:!!c.flying,
    radius:c.radius,baseR:c.radius,mass:c.mass,building:c.type==='building',life:c.life||0,armor:c.armor||0,taunt:c.taunt||0,
    cd:0.3,target:null,deploy,deployMax:Math.max(0.01,deploy),walk:Math.random()*6,atk:0,yaw:team?0:PI,yawVis:team?0:PI,kvx:0,kvy:0,
    frozen:0,stun:0,rush:0,shield:c.shield0||0,giant:0,fire:0,hits:0,retarget:0,dead:false,moving:false,scale:1,spT:(c.sp&&c.sp.k==='execute')?3:(c.sp&&c.sp.cd?c.sp.cd*0.5:0),
    lastAtkT:-99,stealthOn:!!(c.sp&&c.sp.k==='stealth'),hitT:0,landT:0,grow:0};
  G.units.push(u); return u;
}

// ---------------------------------------------------------------- targeting & movement
const hidden = e => (e.invis>0 || e.stealthOn) && !(G&&G.detected.has(e.uid));
function canHit(u,t){
  if(!t||t.dead) return false;
  if((t.flying||t.leap) && u.targets!=='all') return false;
  if(u.targets==='buildings' && !t.building) return false;
  if(!t.isTower && hidden(t)) return false;
  return true;
}
function findTaunter(u){ for(const d of G.units) if(d.taunt && d.team!==u.team && !d.dead && d.deploy<=0 && dist(u,d)<=d.taunt && canHit(u,d)) return d; return null; }
function findTarget(u){
  for(const d of G.units) if(d.taunt && d.team!==u.team && !d.dead && dist(u,d)<=d.taunt && canHit(u,d)) return d;
  let best=null,bd=1e9;
  for(const e of G.units){ if(e.team===u.team||e.dead||!canHit(u,e)) continue; const d=dist(u,e)-e.radius; if(d<u.sight&&d<bd){bd=d;best=e;} }
  if(best) return best;
  for(const t of G.towers){ if(t.team===u.team||t.dead) continue; const d=dist(u,t); if(d<bd){bd=d;best=t;} }
  return best;
}
const inRange=(u,t)=>dist(u,t)-t.radius-u.radius<=u.range+0.05;
function moveGoal(u,tx,ty){
  if(u.flying||u.c.swim) return [tx,ty];
  const us=u.y>16, ts=ty>16, inRiver=u.y>14.9&&u.y<17.1;
  if(us!==ts||inRiver){
    const bx=Math.abs(u.x-BRIDGES[0])<Math.abs(u.x-BRIDGES[1])?BRIDGES[0]:BRIDGES[1];
    if(Math.abs(u.x-bx)>0.45) return [bx,us?17.7:14.3];
    return [bx+(tx>bx?0.2:-0.2),ts?17.9:14.1];
  }
  return [tx,ty];
}
const baseMul = u => (u.giant>0?1.6:1)*(u.fire>0?1.5:1)*(1-(u.weak||0))*(u.blindT>0?1-u.blindF:1)*(1+0.22*u.grow)*(u.shrinkT>0?0.5:1);

// ---------------------------------------------------------------- damage & death
function damage(t,amt,src,o){
  if(!t||t.dead||amt<=0) return 0;
  if(t.markT>0) amt*=t.markM;
  if(o&&o.splash&&t.armor) amt*=1-t.armor;
  if(t.shield>0){ const a=Math.min(t.shield,amt); t.shield-=a; amt-=a; if(t.shield<=0) fxBurst(t.x,1,t.y,10,'#9ff0ff',2.5,0.15,0.5,6,true); }
  t.hp-=amt; t.hitT=0.14;
  if(src&&src.x!==undefined&&!t.isTower){ const dx=t.x-src.x, dy=t.y-src.y, L=Math.hypot(dx,dy)||1; t.hdx=dx/L; t.hdy=dy/L; }
  if(amt>=40&&G.units.length<60){ const hh=t.isTower?2:((t.rig&&t.rig.height)||1.2)*(t.scale||1)*0.75+(t.flying?1.5:0); PSA.spawn(t.x,hh,t.y,0,0,0,0.09,Math.min(1.6,0.5+amt/400),'#ffffff',0.9,0); }
  if(amt>=90&&src&&(src.c||src.isTower===undefined)){ G.nums.push({x:t.x+rnd(-0.25,0.25),y:t.y,h:t.isTower?3.2:((t.rig&&t.rig.height)||1.2)*(t.scale||1)*VS+(t.flying?1.5:0),v:Math.round(amt),t:0,big:amt>=300}); if(G.nums.length>24) G.nums.shift(); }
  if(amt>=300&&src&&src.c&&!(o&&o.splash)) G.freezeT=Math.max(G.freezeT||0,0.07);
  if(t.isTower&&t.kind==='king'&&!t.active) t.active=true;
  if(t.hp<=0){ t.hp=0; if(t.isTower) destroyTower(t); else killUnit(t, src&&src.c?src:null); }
  return amt;
}
function enemiesIn(team,x,y,r,o={}){
  const out=[];
  for(const u of G.units){ if(u.team===team||u.dead) continue; if((u.flying||u.leap)?o.air===false:o.ground===false) continue; if(Math.hypot(u.x-x,u.y-y)<=r+u.radius*0.5) out.push(u); }
  if(o.towers!==false) for(const t of G.towers){ if(t.team===team||t.dead) continue; if(Math.hypot(t.x-x,t.y-y)<=r+t.radius*0.7) out.push(t); }
  return out;
}
function knock(t,fx,fy,k){
  if(!t||t.dead||t.building||t.isTower) return;
  const d=Math.hypot(t.x-fx,t.y-fy)||1, m=Math.min(1,6/t.mass)*k*6;
  t.kvx+=(t.x-fx)/d*m; t.kvy+=(t.y-fy)/d*m;
}
function areaDamage(team,x,y,r,dmg,o={},src=null){
  for(const e of enemiesIn(team,x,y,r,o)){
    const isT=e.isTower;
    damage(e,dmg*(isT?(o.towerPct??1):1),src||team,{splash:true});
    if(!isT){ if(o.stun) e.stun=Math.max(e.stun,o.stun); if(o.frozen){ e.frozen=Math.max(e.frozen,o.frozen); e.stone=!!o.stone; } if(o.fear) e.fearT=Math.max(e.fearT||0,o.fear); if(o.push) knock(e,x,y,o.push); if(o.burn){ e.burnT=o.burn[1]; e.burnD=o.burn[0]; } if(o.slow){ e.slowT=o.slow[0]; e.slowF=o.slow[1]; } }
    if(isT && o.freezeTowers){ e.frozen=Math.max(e.frozen,o.freezeTowers); e.stone=!!o.stone; }
  }
}
function killUnit(u,killer){
  if(u.dead) return;
  const c=u.c;
  if(c.sp&&c.sp.k==='reviveSelf'&&!u.revived&&c.sp.inPlace){
    u.revived=true; u.hp=u.maxHp*(c.sp.hp||1); u.stun=0.6; u.landT=0.3; u.burnT=0; fxPuff(u.x,0.5,u.y,10,'#ffffff',0.5); fxRing(u.x,u.y,0.2,1.2,0.4,'#ffd34d');
    callout(u,c.sp.callout,'#ffd34d'); sfx('power'); return;
  }
  if(c.sp&&c.sp.k==='reviveSelf'&&!u.revived){
    u.revived=true; u.hp=u.maxHp; const k=G.towers.find(t=>t.team===u.team&&t.kind==='king');
    fxPuff(u.x,0.6,u.y,10,'#ffffff',0.5); u.x=k.x+rnd(-1,1); u.y=k.y+(u.team===0?-2.6:2.6); u.deploy=1.4; u.deployMax=1.4; u.target=null; u.parachute=true;
    callout(u,c.sp.callout,'#ffd34d'); return;
  }
  u.dead=true;
  G.dying.push({u,t:0});
  if(c.champ) G.tapCd[u.origTeam??u.team]=0;
  if(!u.building&&u.card!=='zombiemini'){ const z=G.units.find(z=>!z.dead&&z!==u&&z.c.infectAura&&z.team!==u.team&&dist(z,u)<=z.c.infectAura.r); if(z){ const zm=spawnUnit('zombiemini',z.team,u.x,u.y,0.6); fxPuff(u.x,0.3,u.y,8,'#7dff4a',0.45); callout(zm,'IT’S ALIVE! 🧟','#9cff7a'); } }
  fxBurst(u.x,0.6,u.y,14,'#ffffff',3,0.16,0.5,8); fxPuff(u.x,0.5,u.y,6,'#e8e8e8',0.45);
  sfx('pop');
  const owner = u.origTeam??u.team;
  if(!c.hidden && c.type!=='building') G.graveyard[owner].push(u.card);
  if(u.team===1) G.stats.kills++;
  const d=c.death;
  if(d){
    if(d.spawn) for(let i=0;i<d.spawn[1];i++){ const a=i/d.spawn[1]*TAU; spawnUnit(d.spawn[0],u.team,u.x+Math.cos(a)*0.6,u.y+Math.sin(a)*0.6,0.4); }
    if(d.blast){ areaDamage(u.team,u.x,u.y,d.blast[0],d.blast[1]); fxBurst(u.x,0.5,u.y,24,'#ffb02e',5,0.25,0.6,8,true); fxRing(u.x,u.y,0.3,d.blast[0],0.4,'#ffb02e'); sfx('boom'); G.shake=Math.max(G.shake,0.2); }
    if(d.cloud) spawnCloud(u.team,u.x,u.y,d.cloud[0],d.cloud[1],d.cloud[2],0.7,0.35,'#7dff4a');
    if(d.callout) callout({x:u.x,y:u.y,h:1.8},d.callout,'#ff6b6b',true);
    if(d.elixir){ G.elixir[owner]=Math.min(10,G.elixir[owner]+d.elixir); callout({x:u.x,y:u.y,h:1.8},`+${d.elixir} 💧`,'#f68cff',true); for(let i=0;i<14;i++) PSA.spawn(u.x+rnd(-0.4,0.4),1,u.y+rnd(-0.4,0.4),rnd(-2,2),rnd(2,5),rnd(-2,2),0.8,0.3,'#f68cff',1,6); sfx('power'); }
    if(d.random){ const th=THEMES.find(t=>t.id===c.theme)||G.th; const opts=th.pool.filter(k=>{ const q=CARDS[k]; return q.type==='troop'&&!q.champ&&k!==u.card&&q.cost<=5; });
      for(let i=0;i<d.random&&opts.length;i++){ const k=opts[Math.random()*opts.length|0], a=i/d.random*TAU, n=Math.min(3,CARDS[k].count||1); for(let j=0;j<n;j++) spawnUnit(k,u.team,u.x+Math.cos(a)*0.7+rnd(-0.2,0.2),u.y+Math.sin(a)*0.7+rnd(-0.2,0.2),0.5); }
      callout({x:u.x,y:u.y,h:2},'SURPRISE! 🎁','#ffd34d',true); fxBurst(u.x,0.8,u.y,30,'#ffd34d',5,0.25,0.7,6,true); }
  }
  if(killer && !killer.dead){
    const oh=killer.c.onHit||{};
    if(oh.infect && !u.building){ spawnUnit(oh.infect,killer.team,u.x,u.y,0.3); fxPuff(u.x,0.4,u.y,6,'#7dff4a',0.4); }
    if(oh.healOnKill){ killer.hp=Math.min(killer.maxHp,killer.hp+oh.healOnKill); fxBurst(killer.x,1,killer.y,8,'#7dff8a',2,0.18,0.6,0,true); }
    const ks=killer.c.sp;
    if(ks&&ks.k==='growOnKill'&&killer.grow<ks.max){ killer.grow++; killer.maxHp*=1+ks.f; killer.hp=Math.min(killer.maxHp,killer.hp+killer.maxHp*ks.f); callout(killer,ks.callout,'#7dff4a'); fxBurst(killer.x,1,killer.y,16,'#7dff4a',3,0.2,0.6,4,true); }
  }
  if(!c.hidden && c.type!=='building'){
    const medic=G.units.find(m=>!m.dead&&m.team===u.team&&m.c.sp&&m.c.sp.k==='reviveAllies'&&m.spT<=0&&dist(m,u)<=m.c.sp.r&&m!==u);
    if(medic){ medic.spT=medic.c.sp.cd; G.revives.push({card:u.card,team:u.team,x:u.x,y:u.y,t:0.7}); callout(medic,medic.c.sp.callout,'#7dff8a'); G.bolts.push({x1:medic.x,h1:1,y1:medic.y,x2:u.x,h2:0.5,y2:u.y,life:0.3,max:0.3,col:'#9ffcff'}); }
  }
}
function destroyTower(t){
  t.dead=true; const foe=1-t.team;
  G.slowT=t.kind==='king'?1.4:0.8; G.fovKick=1;
  for(let i=0;i<16;i++){ const s0=rnd(0.25,0.6); const m=new THREE.Mesh(geo('dodec'),mat(i%3?shade(G.th.stone,0.85):TEAMC[t.team].main,{s:20,flat:true})); m.scale.setScalar(s0); m.position.set(t.x+rnd(-1,1),rnd(1,3),t.y+rnd(-1,1)); m.castShadow=QUALITY.shadows; dynRoot.add(m);
    const a=Math.random()*TAU, f=rnd(3,8); G.debris.push({m,vx:Math.cos(a)*f,vy:rnd(5,11),vz:Math.sin(a)*f,rx:rnd(-8,8),rz:rnd(-8,8),t:0,s0}); }
  G.shake=0.7; sfx('boom'); setTimeout(()=>sfx('crown'),250); buzz(80);
  fxBurst(t.x,2,t.y,50,'#9aa3ad',6,0.35,1.2,14); fxBurst(t.x,2,t.y,20,TEAMC[t.team].main,5,0.3,1.0,12); fxPuff(t.x,1,t.y,16,'#d8d0c0',1.0,1.2);
  fxRing(t.x,t.y,0.5,4,0.6,'#ffe9a0');
  if(t.kind==='king'){ G.crowns[foe]=3; showBanner(foe===0?'KING DOWN!':'YOUR KING FELL','',2); endGame(foe); }
  else {
    G.crowns[foe]++; const king=G.towers.find(k=>k.team===t.team&&k.kind==='king'); king.active=true;
    showBanner(foe===0?'+1 CROWN!':'TOWER LOST!','',1.4); feedLog(foe===0?'👑 You destroyed a tower!':'💥 You lost a tower',foe);
    aiEmote(foe===1?'gloat':'sad');
    if(G.overtime||G.mode.sudden) endGame(foe);
  }
}

// ---------------------------------------------------------------- statuses & conversion
function convertTemp(e,team,dur,kind){
  if(!e||e.dead||e.building||e.isTower||e.team===team) return;
  if(e.origTeam===undefined) e.origTeam=e.team;
  e.team=team; e.convT=dur; e.convKind=kind; e.target=null; e.retarget=0;
  fxBurst(e.x,1.2,e.y,8,kind==='charm'?'#ff6bb5':'#ffe14d',1.5,0.2,0.8,-1,true);
}
function convertPerm(e,team){
  if(!e||e.dead||e.building||e.team===team) return;
  e.team=team; e.origTeam=undefined; e.convT=0; e.target=null; e.retarget=0;
  if(e.obj){ dynRoot.remove(e.obj); dynRoot.remove(e.shadow); dynRoot.remove(e.ring); e.obj=null; }
  fxBurst(e.x,1,e.y,16,'#ffffff',3,0.2,0.6,4,true);
}
function yankTo(t,u,amt){
  if(!t||t.dead||t.building||t.isTower) return;
  const d=dist(t,u)||1, m=Math.max(0,Math.min(amt,d-t.radius-u.radius-0.2)); if(m<=0) return;
  t.x+=(u.x-t.x)/d*m; t.y+=(u.y-t.y)/d*m; t.stun=Math.max(t.stun,0.3);
  if(!t.flying&&!t.c.swim&&t.y>15&&t.y<17) t.y=t.y<16?14.9:17.1;
  fxPuff(t.x,0.4,t.y,6,'#d8cdb0',0.4,0.4);
}
function banish(t){
  const k=G.towers.find(tw=>tw.team===t.team&&tw.kind==='king')||{x:9,y:t.team===0?29:3};
  fxBurst(t.x,1,t.y,16,'#e5302a',3,0.22,0.6,4,true); fxPuff(t.x,0.6,t.y,8,'#ffffff',0.5);
  t.x=k.x+rnd(-1.2,1.2); t.y=k.y+(t.team===0?-2.6:2.6); t.deploy=1.2; t.deployMax=1.2; t.target=null; t.kvx=t.kvy=0; t.charging=false; t.chargeT=0; t.leap=null; t.leapH=0;
}
function cloneUnit(v,frac=0.5){
  const a=Math.random()*TAU, c=spawnUnit(v.card,v.team,v.x+Math.cos(a)*0.7,v.y+Math.sin(a)*0.7,0.25);
  c.hp=c.maxHp=v.maxHp*frac; c.clone=true; if(v.giant>0) makeGiant(c,v.giant);
  fxPuff(c.x,0.6,c.y,8,'#ffffff',0.45); return c;
}
const zapScore=e=>e.hp*Math.max(1,e.c.cost);
function zapPick(u,sp){
  let best=null;
  if(sp.ally){ for(const v of G.units){ if(v.team!==u.team||v===u||v.dead||v.building||v.deploy>0||v.invis>0) continue; if(dist(u,v)>sp.range) continue; if(!best||zapScore(v)>zapScore(best)) best=v; } return best; }
  for(const e of G.units){ if(e.team===u.team||e.dead||e.building||hidden(e)||e.deploy>0) continue; if(sp.maxCost&&e.c.cost>sp.maxCost) continue; if(sp.eff.banish&&e.c.champ) continue;
    if(e.stun>0.3&&sp.eff.stun) continue; if(dist(u,e)>sp.range) continue; if(!best||zapScore(e)>zapScore(best)) best=e; }
  return best;
}
function applyZap(u,t,sp){
  const ef=sp.eff, who=u.team===0?'Your':'Enemy';
  G.bolts.push({x1:u.x,h1:1.2,y1:u.y,x2:t.x,h2:1,y2:t.y,life:0.3,max:0.3,col:ef.banish?'#ff3b3b':ef.invis?'#c8c8ff':'#ffffff'});
  callout(t,sp.callout,ef.banish?'#ff6b6b':'#ffffff',!!ef.banish);
  if(ef.banish){ banish(t); feedLog(`🟥 ${who} ${u.c.short||u.c.name} sent off ${t.c.name}`,u.team); sfx('bad'); }
  if(ef.stun){ t.stun=Math.max(t.stun,ef.stun); if(ef.box) t.boxT=ef.stun; if(ef.sleep) t.sleepT=ef.stun; }
  if(ef.fear) t.fearT=Math.max(t.fearT||0,ef.fear);
  if(ef.frozen){ t.frozen=Math.max(t.frozen,ef.frozen); t.stone=!!ef.stone; }
  if(ef.invis){ t.invis=Math.max(t.invis||0,ef.invis); fxPuff(t.x,0.8,t.y,10,'#e8d8ff',0.5); }
  sfx('zap');
}
function rewindUnit(e,amt){
  if(e.building||e.isTower) return; const dir=e.team===0?1:-1; const x0=e.x,y0=e.y;
  let ny=clamp(e.y+dir*amt,0.6,31.4); if(!e.flying&&!e.c.swim&&ny>14.9&&ny<17.1) ny=dir>0?17.3:14.7; e.y=ny; e.target=null; e.charging=false; e.chargeT=0;
  for(let i=0;i<6;i++){ const k=i/6; PSA.spawn(x0,0.8,y0+(ny-y0)*k,0,0.3,0,0.5,0.35,'#ffd34d',0.8,0); }
}
function makeGiant(u,dur){ if(u.giant<=0){ u.maxHp*=1.6; u.hp*=1.6; u.mass*=3; } u.giant=Math.max(u.giant,dur); }

// ---------------------------------------------------------------- card play
function pocketOpen(team,x){ const foe=1-team; const t=G.towers.find(t=>t.team===foe&&t.kind==='princess'&&(x<9?t.x<9:t.x>9)); return t&&t.dead; }
function clampDeploy(team,id,x,y){
  const c=CARDS[id]; x=clamp(x,0.6,17.4); y=clamp(y,0.6,31.4);
  if(c.type==='spell') return [x,y];
  if(!c.deployAnywhere){
    if(team===0){ y=Math.max(y,pocketOpen(0,x)?10.5:17.4); } else { y=Math.min(y,pocketOpen(1,x)?21.5:14.6); }
  } else if(y>14.9&&y<17.1){ y = (team===0? 17.4 : 14.6); }
  for(const t of G.towers){ if(t.dead) continue; const dd=Math.hypot(x-t.x,y-t.y), m=t.radius+0.4; if(dd<m){ const a=Math.atan2(y-t.y,x-t.x)||0; x=t.x+Math.cos(a)*m; y=t.y+Math.sin(a)*m; } }
  return [x,y];
}
function playCard(team,idx,x,y){
  const id=G.hands[team][idx]; if(!id) return false; const c=CARDS[id];
  if(G.elixir[team]<c.cost) return false;
  if(c.champ&&champOf(team)) return 'champ';
  G.elixir[team]-=c.cost;
  [x,y]=clampDeploy(team,id,x,y);
  if(c.type==='spell') castSpell(id,team,x,y);
  else {
    const n=c.count||1;
    for(let i=0;i<n;i++){ const a=i/n*TAU+0.4, r=n>1?(n>4?0.75:0.55):0; const u=spawnUnit(id,team,x+Math.cos(a)*r,y+Math.sin(a)*r,1+i*0.05); if(i===0) u.lead=true; if(c.deployAnywhere) u.parachute=true; }
    fxRing(x,y,0.2,1.5,0.45,TEAMC[team].light); sfx('deploy');
    if(c.champ){ feedLog(`👑 ${team===0?'Your':'Enemy'} Champion ${c.name} enters!`,team); G.tapCd[team]=3; }
  }
  G.hands[team][idx]=G.queues[team].shift(); G.queues[team].push(id);
  if(team===1 && Math.random()<0.08) aiEmote('taunt');
  return true;
}
function spawnCloud(team,x,y,r,dps,t,slow,towerPct,col){ G.clouds.push({team,x,y,r,dps,t,max:t,slow,towerPct,col,tick:0}); fxDecal(x,y,r,col,t,0.28); }
function spawnPuddle(team,x,y,r,t,slip,dmg){ G.clouds.push({team,x,y,r,dps:0,t,max:t,slow:0,towerPct:0,col:'#f2b632',tick:0,slip,puddle:true}); if(dmg) G.clouds[G.clouds.length-1].dps=dmg; fxDecal(x,y,r,'#e8a620',t,0.6); fxBurst(x,0.2,y,12,'#ffd34d',3,0.15,0.4,8,true); PSN.spawn(x,0.3,y,0,1,0,0.5,0.6,'#fff8e0',0.8,0,1,2); }
// Spells marked launch:true are thrown or fired from the caster's King Tower (the king winds up and lobs them)
// instead of appearing out of the sky. Flight time grows with distance.
function kingLaunch(team,x,y,quiet){
  const kt=G.towers.find(t=>t.team===team&&t.kind==='king'&&!t.dead); if(!kt) return null;
  kt.yaw=Math.atan2(x-kt.x,y-kt.y); kt.throwT=0.45;
  const d=Math.hypot(x-kt.x,y-kt.y); if(!quiet){ fxPuff(kt.x,4.2,kt.y,6,'#ffffff',0.35,0.4); sfx('arrow'); }
  return {x:kt.x,y:kt.y,h:4.4,d,flight:0.5+d*0.05};
}
function castSpell(id,team,x,y){
  const c=CARDS[id], s=c.sp, tc=TEAMC[team];
  callout({x,y,h:2.5},c.name.toUpperCase()+(c.name.endsWith('!')?'':'!'),team===0?'#bfe0ff':'#ffc2c0',true);
  switch(s.k){
    case 'damage': case 'drain': case 'stun': case 'freeze':
      if((s.delay||0)>0||s.launch){ const obj=s.fall?buildFall(s.fall,tc):null; if(obj){ dynRoot.add(obj); } const from=s.launch?kingLaunch(team,x,y):null, dl=from?Math.max(s.delay||0,from.flight):s.delay;
        G.spells.push({id,s,team,x,y,t:dl,max:dl,obj,from}); fxDecal(x,y,s.r,team===0?'#8cc2ff':'#ff9f9a',dl,0.25); }
      else resolveSpell({id,s,team,x,y});
      break;
    case 'healCloud': { const cl={team,x,y,r:s.r,dps:0,heal:s.heal,t:s.t,max:s.t,slow:0,towerPct:0,col:'#7dff8a',tick:0}; G.clouds.push(cl); fxDecal(x,y,s.r,'#7dff8a',s.t,0.25); fxRing(x,y,0.3,s.r,0.6,'#7dff8a'); sfx('power'); break; }
    case 'summon': { const n=s.n; fxRing(x,y,0.3,1.8,0.5,TEAMC[team].light); sfx('deploy');
      for(let i=0;i<n;i++){ let sx,sy; if(s.line){ sx=x+(i-(n-1)/2)*1.6; sy=y; } else { const a=i/n*TAU+0.3, rr=n>1?0.8:0; sx=x+Math.cos(a)*rr; sy=y+Math.sin(a)*rr; }
        if(sy>14.8&&sy<17.2&&!CARDS[s.card].flying) sy=sy<16?14.6:17.4; const v=spawnUnit(s.card,team,clamp(sx,0.6,17.4),sy,0.6+i*0.05); v.parachute=true; } break; }
    case 'convert': { fxRing(x,y,0.3,s.r,0.6,'#ffe14d'); sfx('power'); let n=0;
      for(const e of G.units){ if(e.team===team||e.dead||e.building||e.c.champ||e.c.cost>s.maxCost) continue; if(Math.hypot(e.x-x,e.y-y)<=s.r+e.radius*0.5){ convertTemp(e,team,s.dur,'flip'); n++; } }
      callout({x,y,h:2},n?`${n} SWITCHED SIDES!`:'Nobody fell for it','#ffe14d',true); break; }
    case 'cancel': { fxRing(x,y,0.3,s.r,0.6,'#ff3b3b'); sfx('bad'); for(let i=0;i<20;i++){ const a=Math.random()*TAU, rr=Math.random()*s.r; PSA.spawn(x+Math.cos(a)*rr,rnd(0.5,2),y+Math.sin(a)*rr,0,1,0,0.8,0.3,'#ff3b3b',1,0); }
      for(const e of enemiesIn(team,x,y,s.r,{towers:false})){ e.shield=0; e.rush=e.enraged?e.rush:0; e.invis=0; e.stealthOn=false; if(e.giant>0) e.giant=0.01; e.fire=0; if(e.convT>0) e.convT=0.01; e.fearT=Math.max(e.fearT||0,s.fear); }
      areaDamage(team,x,y,s.r,s.dmg,{towerPct:0.3}); break; }
    case 'heal': case 'rush': case 'mega': case 'invis': {
      const col={heal:'#7dff8a',rush:'#ff5ab0',mega:'#ff3d5a',invis:'#c8c8ff'}[s.k];
      fxRing(x,y,0.3,s.r,0.6,col); for(let i=0;i<30;i++){ const a=Math.random()*TAU, rr=Math.random()*s.r; PSA.spawn(x+Math.cos(a)*rr,0.2,y+Math.sin(a)*rr,0,rnd(1,3),0,rnd(0.5,1),0.25,col,1,0); }
      if(s.k==='heal') for(let i=0;i<24;i++){ const a=Math.random()*TAU, rr=Math.random()*s.r; PSN.spawn(x+Math.cos(a)*rr,rnd(4,7),y+Math.sin(a)*rr,0,-6,0,0.9,0.3,'#7dd36b',1,4); }
      sfx('power');
      for(const u of G.units) if(u.team===team&&!u.dead&&!u.building&&Math.hypot(u.x-x,u.y-y)<=s.r+u.radius*0.5){
        if(s.k==='heal'){ u.hp=Math.min(u.maxHp,u.hp+s.amt); u.shield=Math.max(u.shield,s.shield||0); if(s.cleanse){ u.burnT=0; u.slowT=0; u.stun=0; u.frozen=0; u.fearT=0; u.shrinkT=0; } }
        else if(s.k==='rush'){ u.rush=Math.max(u.rush,s.t); if(s.heal) u.hp=Math.min(u.maxHp,u.hp+s.heal); } else if(s.k==='mega') makeGiant(u,s.t); else { u.invis=s.t; u.target=null; }
      }
      break; }
    case 'cloud': spawnCloud(team,x,y,s.r,s.dps,s.t,s.slow,s.towerPct,s.col||'#7dff4a'); fxRing(x,y,0.3,s.r,0.5,s.col||'#7dff4a'); sfx('freeze'); break;
    case 'slow': spawnCloud(team,x,y,s.r,0,s.t,s.f,0,'#9a9ca2'); areaDamage(team,x,y,s.r,s.dmg,{towers:false}); fxRing(x,y,0.3,s.r,0.5,'#cfd2d8'); fxPuff(x,0.3,y,16,'#b9bbc0',0.7,1); sfx('pop'); break;
    case 'barrage': G.barrage.push({team,s,x,y,left:s.n,t:0}); if(s.launch) kingLaunch(team,x,y); break;
    case 'roll': { const dir=team===0?-1:1; const obj=buildFall(s.model,tc); dynRoot.add(obj); G.rolls.push({team,x,y,dir,traveled:0,len:s.len,r:s.r,dmg:s.dmg,push:s.push,hit:new Set(),obj,spin:0}); sfx('kick'); break; }
    case 'float': fxRing(x,y,0.3,s.r,0.6,'#c8b6ff'); sfx('freeze');
      for(const u of G.units) if(u.team!==team&&!u.dead&&!u.building&&!u.flying&&Math.hypot(u.x-x,u.y-y)<=s.r+u.radius*0.5){ u.floatT=s.t; u.floatDmg=s.dmg; u.floatTeam=team; }
      for(let i=0;i<30;i++){ const a=Math.random()*TAU, rr=Math.random()*s.r; PSA.spawn(x+Math.cos(a)*rr,0.2,y+Math.sin(a)*rr,0,rnd(0.5,1.5),0,rnd(1,2),0.2,'#c8b6ff',1,0); }
      break;
    case 'pull': G.pulls.push({team,x,y,r:s.r,t:s.t,dps:s.dps,tick:0}); sfx('boom'); break;
    case 'decoy': { const d=spawnUnit(s.card,team,x,y,0.4); d.taunt=s.r; fxRing(x,y,0.3,s.r,0.6,'#ffb02e'); sfx('pop'); break; }
    case 'revive': { const list=G.graveyard[team].splice(-s.n); fxRing(x,y,0.3,2.5,0.6,'#ffd34d'); sfx('power');
      list.forEach((id,i)=>{ const a=i/Math.max(1,list.length)*TAU; spawnUnit(id,team,x+Math.cos(a)*0.8,y+Math.sin(a)*0.8,0.8); });
      if(!list.length) callout({x,y,h:1.5},'No one to bring back!','#fff'); break; }
  }
}
function resolveSpell(sp){
  const {s,team,x,y}=sp;
  if(sp.obj){ dynRoot.remove(sp.obj); }
  G.shake=Math.max(G.shake,0.35); buzz(30);
  if(s.fall==='rally'){ for(const e of enemiesIn(team,x,y,s.r,{towers:false})) callout(e,'👏','#ffffff'); for(let i=0;i<14;i++){ const a=Math.random()*TAU, rr=Math.random()*s.r; PSA.spawn(x+Math.cos(a)*rr,0.5,y+Math.sin(a)*rr,0,rnd(2,4),0,1,0.3,['#ffd34d','#e5302a','#ffffff'][i%3],1,3); } }
  if(s.fall==='quiz'){ for(const e of enemiesIn(team,x,y,s.r,{towers:false})) callout(e,['🤔','❓','Er…','Pass!'][(e.uid||0)%4],'#ffffff'); for(let i=0;i<16;i++){ const a=Math.random()*TAU, rr=Math.random()*s.r; PSA.spawn(x+Math.cos(a)*rr,0.4,y+Math.sin(a)*rr,0,rnd(1.5,3),0,1,0.35,'#ffd34d',1,0); } }
  const col = s.fall==='paintcan'?'#ff3dce' : s.fall==='footballBig'?'#c8a46a' : s.fall==='basketBig'?'#ff8a3a' : s.fall==='water'?'#7fd0ff' : s.fall==='bolt'?'#bff4ff' : s.fall==='gavel'?'#ffd34d' : s.fall==='arrowDown'?'#ff3b3b' : s.fall==='tomato'?'#ff4a3a' : '#ffb02e';
  if(s.k==='freeze'){
    areaDamage(team,x,y,s.r,s.dmg,{frozen:s.t,freezeTowers:s.t,stone:!!s.stone,towerPct:0.4});
    const fc=s.stone?'#c8c0b4':'#bfefff'; fxRing(x,y,0.3,s.r+0.3,0.6,fc); fxBurst(x,0.5,y,40,fc,5,0.25,0.8,8,true); fxPuff(x,0.4,y,12,s.stone?'#a8a29a':'#e8faff',0.8,1); sfx('freeze');
    return;
  }
  if(s.k==='stun'){
    areaDamage(team,x,y,s.r,s.dmg,{stun:s.t,freezeTowers:s.t,towerPct:0.4});
    fxRing(x,y,0.3,s.r+0.3,0.5,col); fxBurst(x,0.5,y,30,'#c9a46a',5,0.25,0.7,10); sfx('boom');
    return;
  }
  if(s.k==='drain'){
    const foe=1-team; const before=G.elixir[foe]; G.elixir[foe]=Math.max(0,G.elixir[foe]-s.drain);
    const lost=Math.round(before-G.elixir[foe]); callout({x,y,h:2},lost>0?`-${lost} ELIXIR`:'ALREADY BROKE!','#ff6bff',true);
  }
  areaDamage(team,x,y,s.r,s.dmg,{towerPct:s.towerDmg?s.towerDmg/s.dmg:(s.towerPct??0.35),push:s.push,stun:s.stun,burn:s.burn,slow:s.slow});
  fxRing(x,y,0.3,s.r+0.4,0.5,col);
  if(s.fall==='water'){ fxBurst(x,0.4,y,50,'#7fd0ff',6,0.25,0.8,10); fxPuff(x,0.3,y,10,'#e0f6ff',0.8,0.8); }
  else if(s.fall==='bolt'){ for(let i=0;i<6;i++){ const a=i/6*TAU; G.bolts.push({x1:x,h1:7,y1:y,x2:x+Math.cos(a)*s.r*0.7,h2:0,y2:y+Math.sin(a)*s.r*0.7,life:0.3,max:0.3,col:'#bff4ff'}); } fxBurst(x,0.4,y,30,'#bff4ff',5,0.2,0.5,4,true); }
  else { fxBurst(x,0.5,y,45,col,7,0.3,0.9,12,true); fxBurst(x,0.5,y,25,'#6b4a33',6,0.25,1,14); fxPuff(x,0.4,y,14,'#5a5a5a',0.9,1.2); fxDecal(x,y,s.r*0.8,'#2a1a10',3,0.4); }
  sfx('boom');
}

// ---------------------------------------------------------------- main update
function update(dt){
  updateFx3(dt);
  for(const c of G.callouts) c.t+=dt; G.callouts=G.callouts.filter(c=>c.t<c.max);
  for(const b of G.beams) b.life-=dt; G.beams=G.beams.filter(b=>b.life>0);
  for(const b of G.bolts) b.life-=dt; G.bolts=G.bolts.filter(b=>b.life>0);
  for(const e of G.emotes) e.t+=dt; G.emotes=G.emotes.filter(e=>e.t<2.6);
  if(G.banner){ G.banner.t+=dt; if(G.banner.t>G.banner.dur) G.banner=null; }
  if(G.msg){ G.msg.t-=dt; if(G.msg.t<=0) G.msg=null; }
  if(G.shake>0) G.shake=Math.max(0,G.shake-dt);
  if(G.over){ G.overT+=dt; if(G.overT>2.4 && $('#end').hidden) showEnd(); updateEntities(dt*0.25); return; }
  G.t+=dt; G.time-=dt;
  if(G.time<=0){
    if(!G.overtime&&!G.mode.sudden&&G.crowns[0]===G.crowns[1]){ G.overtime=true; G.time=60; showBanner('OVERTIME!','Next crown wins',1.8,'#ffb02e'); }
    else { G.time=0; endGame(decideWinner()); return; }
  }
  const base=G.mode.elixir||1, dbl=G.overtime||G.time<=60;
  const rate=Math.max(base,dbl?2:1)*(G.overtime&&base<3?1.5:1);
  if(dbl&&!G.dbl&&base<2){ G.dbl=true; if(!G.overtime) showBanner('2x ELIXIR!','',1.5,'#e05cff'); }
  G.rate=rate;
  for(let t=0;t<2;t++){ const mul=t===1?G.diff.elixirMul:(AUTOTEST?G.diff.elixirMul:1); G.elixir[t]=Math.min(10,G.elixir[t]+dt/2.8*rate*mul); }
  if(G.mode.chaos){ G.chaosT-=dt; if(G.chaosT<=0){ G.chaosT=20; const ev=CHAOS_EVENTS[Math.random()*CHAOS_EVENTS.length|0]; ev.run(); showBanner(ev.icon+' '+ev.name,'Chaos event!',1.6,'#ffd34d'); feedLog(`${ev.icon} Chaos: ${ev.name}`,-1); sfx('power'); } }
  G.aiTimer-=dt; if(G.aiTimer<=0){ G.aiTimer=G.diff.think*rnd(0.7,1.3); aiAct(1); }
  if(AUTOTEST){ G.ai0Timer-=dt; if(G.ai0Timer<=0){ G.ai0Timer=G.diff.think*rnd(0.7,1.3); aiAct(0); } }
  G.aiEmoteCd-=dt;
  for(let t=0;t<2;t++) if(G.tapCd[t]>0) G.tapCd[t]-=dt;
  for(const f of G.feed) f.t+=dt; G.feed=G.feed.filter(f=>f.t<5);
  // power orbs on the bridges
  G.orbTimer-=dt;
  if(G.orbTimer<=0){ G.orbTimer=G.mode.chaos?rnd(6,9):rnd(15,21); if(G.mode.chaos&&G.orbs.length<5){ spawnOrb(rnd(2,16),Math.random()<0.5?rnd(19,27):rnd(5,13)); } else if(G.orbs.length<2){ const keys=Object.keys(POWERS), k=keys[Math.random()*keys.length|0], bx=BRIDGES[Math.random()*2|0];
    if(!G.orbs.some(o=>o.x===bx)){ G.orbs.push({k,x:bx,y:16,t:0,life:18}); fxRing(bx,16,0.2,1.6,0.5,POWERS[k].col); } } }
  for(const o of G.orbs){ o.t+=dt; o.life-=dt;
    for(const u of G.units){ if(u.dead||u.building||u.deploy>0) continue; if(Math.hypot(u.x-o.x,u.y-o.y)<u.radius+0.6){ applyPower(u,o.k); o.life=0; break; } } }
  G.orbs=G.orbs.filter(o=>{ if(o.life<=0&&o.obj){ dynRoot.remove(o.obj); } return o.life>0; });
  updateEntities(dt);
}
function applyPower(u,k){
  const p=POWERS[k];
  if(k==='fire') u.fire=15; else if(k==='turbo') u.rush=Math.max(u.rush,12); else if(k==='giant') makeGiant(u,14);
  else if(k==='shield') u.shield=Math.max(u.shield,600);
  else if(k==='heal') for(const v of G.units) if(v.team===u.team&&!v.dead&&!v.building&&dist(u,v)<3.5){ v.hp=v.maxHp; fxBurst(v.x,1,v.y,6,'#7dff8a',2,0.2,0.6,0,true); }
  showBanner(p.label,(u.team===0?'Your ':'Enemy ')+u.c.name,1.3,p.col); feedLog(`${p.icon} ${u.team===0?'Your':'Enemy'} ${u.c.name} grabbed ${p.label.replace('!','')}`,u.team);
  fxRing(u.x,u.y,0.3,2.2,0.5,p.col); fxBurst(u.x,0.8,u.y,24,p.col,4,0.22,0.7,4,true); sfx('power');
}
function updateEntities(dt){
  G.detected.clear(); G.hasTaunt=G.units.some(u=>u.taunt&&!u.dead);
  for(const d of G.units){ if(d.dead||!d.c.detect||d.deploy>0) continue; for(const e of G.units) if(e.team!==d.team&&!e.dead&&(e.invis>0||e.stealthOn)&&dist(d,e)<=d.c.detect) G.detected.add(e.uid); }
  for(const u of G.units) if(!u.dead) updateUnit(u,dt);
  for(const t of G.towers) if(!t.dead) updateTower(t,dt);
  for(const p of G.projs) updateProj(p,dt);
  for(const r of G.rolls) updateRoll(r,dt);
  for(const b of G.booms) updateBoom(b,dt);
  for(const s of G.spells){ s.t-=dt; if(s.t<=0&&!s.done){ s.done=true; resolveSpell(s); } }
  for(const b of G.barrage){ b.t-=dt; if(b.t<=0&&b.left>0){ b.left--; b.t=0.13; const a=Math.random()*TAU, rr=Math.sqrt(Math.random())*b.s.r; const obj=buildFall(b.s.fall,TEAMC[b.team]); if(b.s.fall==='paper') obj.scale.setScalar(0.8); dynRoot.add(obj);
      const bx=b.x+Math.cos(a)*rr, by=b.y+Math.sin(a)*rr, from=b.s.launch?kingLaunch(b.team,bx,by,true):null, fl=from?from.flight:0.4;
      G.spells.push({id:'barrage',s:{k:'mini',r:b.s.mr||1.1,dmg:b.s.dmg,slow:b.s.slow,drunk:b.s.drunk,fall:b.s.fall},team:b.team,x:bx,y:by,t:fl,max:fl,obj,mini:true,from,col:obj.userData.col}); } }
  G.barrage=G.barrage.filter(b=>b.left>0);
  for(const r of G.revives){ r.t-=dt; if(r.t<=0&&!r.done){ r.done=true; const u=spawnUnit(r.card,r.team,r.x,r.y,0.3); u.hp=u.maxHp*0.6; fxBurst(r.x,0.8,r.y,20,'#9ffcff',3,0.2,0.6,2,true); fxRing(r.x,r.y,0.2,1.4,0.4,'#9ffcff'); } }
  G.revives=G.revives.filter(r=>!r.done);
  for(const e of G.executions){ e.time-=dt; if(e.time<=0&&!e.done){ e.done=true; doExecute(e); } }
  G.executions=G.executions.filter(e=>!e.done);
  for(const c of G.clouds){ c.t-=dt; c.tick-=dt;
    if(c.puddle){ if(Math.random()<dt*6){ const a=Math.random()*TAU, rr=Math.random()*c.r; PSA.spawn(c.x+Math.cos(a)*rr,0.08,c.y+Math.sin(a)*rr,0,0.3,0,0.4,0.18,'#fff4c0',0.8,0); } }
    else if(Math.random()<dt*14){ const a=Math.random()*TAU, rr=Math.random()*c.r; PSN.spawn(c.x+Math.cos(a)*rr,0.2,c.y+Math.sin(a)*rr,0,rnd(0.3,0.8),0,rnd(0.8,1.4),rnd(0.5,0.9),c.col,0.45,0,0.8,1); }
    if(c.tick<=0){ c.tick=0.5;
      if(c.heal){ for(const v of G.units) if(v.team===c.team&&!v.dead&&!v.building&&Math.hypot(v.x-c.x,v.y-c.y)<=c.r+v.radius*0.5&&v.hp<v.maxHp){ v.hp=Math.min(v.maxHp,v.hp+c.heal*0.5); PSA.spawn(v.x,1,v.y,0,1.4,0,0.6,0.3,'#7dff8a',1,0); } }
      else if(!c.slip) for(const e of enemiesIn(c.team,c.x,c.y,c.r,{towers:!!c.towerPct})){ if(c.dps) damage(e,c.dps*0.5*(e.isTower?c.towerPct:1),c.team); if(!e.isTower&&c.slow){ e.slowT=0.7; e.slowF=c.slow; } if(!e.isTower&&c.burn){ e.burnT=c.burn[1]; e.burnD=c.burn[0]; e.burnCol=null; } } } }
  for(const c of G.clouds){ if(!c.slip) continue;
    for(const e of G.units){ if(e.team===c.team||e.dead||e.flying||e.building||e.leap||e.slipCD>0||e.deploy>0) continue; if(Math.hypot(e.x-c.x,e.y-c.y)>c.r+e.radius*0.4) continue;
      e.slipT=c.slip; e.slipCD=c.slip+1.6; e.stun=Math.max(e.stun,c.slip); const k=Math.min(1,6/e.mass)*4; e.kvx+=Math.sin(e.yaw||0)*k; e.kvy+=Math.cos(e.yaw||0)*k;
      if(c.dps) damage(e,c.dps,c.team); callout(e,'SLIP!','#ffd34d'); fxPuff(e.x,0.15,e.y,6,'#fff4d0',0.35,0.4); PSN.spawn(e.x,0.3,e.y,0,1.5,0,0.5,0.4,'#ffd34d',0.8,6); } }
  G.clouds=G.clouds.filter(c=>c.t>0);
  for(const p of G.pulls){ p.t-=dt; p.tick-=dt;
    for(const e of G.units){ if(e.team===p.team||e.dead||e.building||e.flying) continue; const d=Math.hypot(e.x-p.x,e.y-p.y); if(d<=p.r&&d>0.2){ const k=Math.min(1,6/e.mass)*4*dt; e.x+=(p.x-e.x)/d*k*2+(-(e.y-p.y)/d)*k*1.5; e.y+=(p.y-e.y)/d*k*2+((e.x-p.x)/d)*k*1.5; } }
    if(p.tick<=0){ p.tick=0.5; for(const e of enemiesIn(p.team,p.x,p.y,p.r,{towers:false,air:false})) damage(e,p.dps*0.5,p.team); }
    for(let i=0;i<3;i++){ const a=G.t*6+i*2.1+Math.random(), rr=Math.random()*p.r; PSN.spawn(p.x+Math.cos(a)*rr,rnd(0.1,1.5),p.y+Math.sin(a)*rr,-Math.sin(a)*4,0.5,Math.cos(a)*4,0.5,0.3,i?'#d8c0ff':'#ff6bff',0.7,0,0,1); } }
  G.pulls=G.pulls.filter(p=>p.t>0);
  separate();
  G.units=G.units.filter(u=>!u.dead);
  G.projs=G.projs.filter(p=>{ if(p.done&&p.obj) dynRoot.remove(p.obj); return !p.done; });
  G.rolls=G.rolls.filter(r=>{ if(r.done) dynRoot.remove(r.obj); return !r.done; });
  G.booms=G.booms.filter(b=>{ if(b.done&&b.obj) dynRoot.remove(b.obj); return !b.done; });
  G.spells=G.spells.filter(s=>{ if(s.done&&s.mini) resolveMini(s); return !s.done; });
}
function resolveMini(s){
  if(s.obj) dynRoot.remove(s.obj);
  areaDamage(s.team,s.x,s.y,s.s.r,s.s.dmg,{towerPct:0.35,slow:s.s.slow});
  if(s.s.drunk){ for(const e of enemiesIn(s.team,s.x,s.y,s.s.r,{towers:false})){ if(!(e.drunkT>0)) callout(e,'🥴','#ffffff'); e.drunkT=Math.max(e.drunkT||0,s.s.drunk); } }
  if(s.col){ fxBurst(s.x,0.3,s.y,26,s.col,5,0.2,0.7,9,true); fxRing(s.x,s.y,0.1,s.s.r+0.3,0.35,s.col); fxDecal(s.x,s.y,s.s.r*0.9,s.col,3,0.55); PSA.spawn(s.x,0.5,s.y,0,0,0,0.12,2.2,s.col,1,0); sfx('pop'); return; }
  const col=s.s.fall==='tomato'?'#e5302a':'#ffffff';
  fxBurst(s.x,0.3,s.y,10,col,3,0.16,0.5,10); fxRing(s.x,s.y,0.1,1.1,0.3,col); if(s.s.fall==='tomato') fxDecal(s.x,s.y,0.6,'#c0201a',2,0.5);
  sfx('hit');
}
function doExecute(e){
  const u=e.u, t=e.t; u.execBusy=0;
  if(!t||t.dead) return;
  const max=(u.c.tap||u.c.sp).maxHp;
  G.shake=0.45; sfx('boom'); buzz(60);
  // giant gavel slam
  const gv=buildFall('gavel',TEAMC[u.team]); gv.position.set(t.x,0.3,t.y); gv.scale.setScalar(0.75); dynRoot.add(gv); setTimeout(()=>dynRoot.remove(gv),350);
  fxRing(t.x,t.y,0.3,2.2,0.5,'#151515'); fxBurst(t.x,0.6,t.y,30,'#222222',5,0.3,0.8,10); fxBurst(t.x,1.5,t.y,12,'#ffffff',2,0.25,1.2,-2,true);
  callout(t, t.hp<=max ? 'SENTENCED TO DEATH! ☠️' : 'FINED 1300!', '#ff5a5a', true);
  feedLog(`⚖️ ${u.team===0?'Your':'Enemy'} Judge sentenced ${t.c.name}`,u.team);
  if(t.hp<=max){ t.shield=0; damage(t,t.hp+1,u); } else damage(t,max,u);
}

function updateUnit(u,dt){
  if(u.hitT>0) u.hitT-=dt; if(u.landT>0) u.landT-=dt;
  if(u.atk>0){ u.atk+=dt/0.38; if(u.atk>=1) u.atk=0; }
  if(u.tagT>0) u.tagT-=dt;
  if(u.deploy>0){ u.deploy-=dt; if(u.deploy<=0){ u.landT=0.3; if(u.lead||(u.c.count||1)===1){ fxRing(u.x,u.y,0.2,u.baseR*2.6,0.35,'#ffffff'); if(u.mass>=10) G.shake=Math.max(G.shake,0.12); }
      if(u.c.champ&&!u.revived){ fxRing(u.x,u.y,0.3,4,0.6,'#ffd34d'); fxRing(u.x,u.y,0.3,2.5,0.45,'#ffffff'); fxBurst(u.x,0.3,u.y,40,'#ffd34d',7,0.3,0.7,10,true); G.shake=Math.max(G.shake,0.35); G.slowT=Math.max(G.slowT,0.3); for(const e of G.units) if(e.team!==u.team&&!e.dead&&!e.building&&dist(e,u)<2.5) knock(e,u.x,u.y,0.8); } if(u.lead||(u.c.count||1)===1) u.tagT=1.5; fxPuff(u.x,0.1,u.y,8,'#efe6d0',0.35,0.45); if(u.parachute) u.parachute=false;
      if(u.lead&&u.c.sp&&u.c.sp.k==='deployStun'){ doAoe(u,u,{r:u.c.sp.r,stun:u.c.sp.t,callout:u.c.sp.callout}); fxBurst(u.x,1,u.y,30,'#ffffff',6,0.3,0.4,2,true); } } return; }
  for(const k of ['frozen','stun','rush','fire','invis','slowT','blindT','markT','burnT','convT','capT','execBusy','floatT','fearT','shrinkT','danceT','tauntT','sleepT','boxT','singT','drunkT','slipT','slipCD']) if(u[k]>0){ u[k]-=dt; if(u[k]<=0){ u[k]=0;
      if(k==='tauntT') u.taunt=u.c.taunt||0; if(k==='frozen') u.stone=false;
      if(k==='convT'&&u.origTeam!==undefined){ u.team=u.origTeam; u.origTeam=undefined; u.target=null; }
      if(k==='floatT'){ damage(u,u.floatDmg||0,u.floatTeam); fxPuff(u.x,0.1,u.y,8,'#d8d0c0',0.4,0.5); } } }
  if(u.giant>0){ u.giant-=dt; if(u.giant<=0){ u.giant=0; u.maxHp/=1.6; u.hp=Math.min(u.hp/1.6,u.maxHp); u.mass/=3; } }
  const tsc=(u.giant>0?1.45:1)*(1+0.12*u.grow)*(u.shrinkT>0?0.55:1);
  u.scale+=(tsc-u.scale)*Math.min(1,dt*6); u.radius=u.baseR*u.scale;
  if(u.burnT>0){ u.burnTick=(u.burnTick||0)-dt; if(u.burnTick<=0){ u.burnTick=0.5; damage(u,u.burnD*0.5,null); } }
  if(u.c.regen&&u.hp<u.maxHp&&!u.dead){ u.hp=Math.min(u.maxHp,u.hp+u.c.regen*dt); if(Math.random()<dt*3) PSA.spawn(u.x+rnd(-0.3,0.3),1,u.y+rnd(-0.3,0.3),0,1.2,0,0.6,0.25,'#7dff8a',1,0); }
  if(u.building&&u.life){ u.hp-=u.maxHp/u.life*dt; if(u.hp<=0){ killUnit(u); return; } }
  if(u.c.gen){ u.genT=(u.genT||0)+dt; if(u.genT>=u.c.gen.every){ u.genT=0; G.elixir[u.team]=Math.min(10,G.elixir[u.team]+u.c.gen.amt); u.atk=0.001;
      for(let i=0;i<10;i++) PSA.spawn(u.x+rnd(-0.4,0.4),1.4,u.y+rnd(-0.4,0.4),rnd(-1,1),rnd(2,4),rnd(-1,1),0.8,0.28,'#ffd34d',1,5); callout({x:u.x,y:u.y,h:2.4},'+1 💧','#f68cff'); sfx('pop'); } }
  if(u.c.spawner){ u.spawnT=(u.spawnT||0)+dt; if(u.spawnT>=u.c.spawner.every){ u.spawnT=0; const sc=u.c.spawner; for(let i=0;i<sc.n;i++){ const a=i/sc.n*TAU; let sx=u.x+Math.cos(a)*0.6, sy=u.y+Math.sin(a)*0.6; if(sy>14.8&&sy<17.2) sy=u.team===0?17.4:14.6; const m=spawnUnit(sc.card,u.team,sx,sy,0.5); m.parachute=true; } } }
  if(Math.abs(u.kvx)+Math.abs(u.kvy)>0.01){ u.x+=u.kvx*dt; u.y+=u.kvy*dt; const f=Math.exp(-6*dt); u.kvx*=f; u.kvy*=f; } else u.kvx=u.kvy=0;
  // auras
  const au=u.c.aura;
  if(au){ u.auraT=(u.auraT||0)-dt; if(u.auraT<=0){ u.auraT=1;
    for(const v of G.units){ if(v.dead||dist(u,v)>au.r) continue;
      if(v.team===u.team&&!v.building){ if(au.heal&&v.hp<v.maxHp){ v.hp=Math.min(v.maxHp,v.hp+au.heal); PSA.spawn(v.x,1.2,v.y,0,1.5,0,0.6,0.3,'#7dff8a',1,0); } if(au.rush) v.rush=Math.max(v.rush,1.2); }
      else if(v.team!==u.team&&au.poison){ damage(v,au.poison,u); PSN.spawn(v.x,0.8,v.y,0,1,0,0.6,0.25,'#9a4ad8',0.8,0); } }
    if(au.rush||au.heal) fxRing(u.x,u.y,0.3,au.r,0.5,au.rush?'#ff6bff':'#7dff8a',0.05); } }
  u.moving=false;
  if(u.floatT>0) return;
  if(u.leap){ const L=u.leap; L.t+=dt; const k=Math.min(1,L.t/L.dur); u.x=L.fx+(L.tx-L.fx)*k; u.y=L.fy+(L.ty-L.fy)*k; u.leapH=Math.sin(k*PI)*L.h;
    if(k>=1&&L.flung){ u.leap=null; u.leapH=0; u.landT=0.3; u.stun=Math.max(u.stun,L.flung.stun); damage(u,L.flung.dmg,L.flung.team,{splash:true}); fxRing(u.x,u.y,0.2,1.4,0.35,'#ffd34d'); fxPuff(u.x,0.1,u.y,12,'#e8dcc0',0.6,0.7); G.shake=Math.max(G.shake,0.2); sfx('kick'); callout(u,'💫','#ffffff'); return; }
    if(k>=1){ const s=L.tapLeap||u.c.sp; u.leap=null; u.leapH=0; u.landT=0.3; doAoe(u,u,{r:s.r,dmg:s.dmg,stun:s.stun}); fxPuff(u.x,0.1,u.y,10,'#e8dcc0',0.5,0.6); G.shake=Math.max(G.shake,0.18); sfx('kick'); }
    return; }
  if(u.frozen>0||u.stun>0){ u.charging=false; u.chargeT=0; return; }
  if(u.execBusy>0) return;
  const sp=u.c.sp;
  const swimming=u.c.swim&&u.y>15&&u.y<17&&!u.flying;
  const spd=(u.rush>0?1.4:1)*(u.slowT>0?u.slowF:1)*(u.charging?sp.spd:1)*(swimming?2:1), atkSpd=u.rush>0?1/0.65:1;
  if(u.fearT>0&&!u.building){ const k=G.towers.find(tw=>tw.team===u.team&&tw.kind==='king'); const hx=u.x, hy=k?k.y:(u.team===0?30:2);
    const [gx,gy]=moveGoal(u,hx,hy); const dx=gx-u.x, dy=gy-u.y, L=Math.hypot(dx,dy)||1, step=Math.min(L,u.speed*spd*dt);
    u.x+=dx/L*step; u.y+=dy/L*step; u.walk+=dt*12; u.moving=true; u.yaw=Math.atan2(dx,dy); u.target=null; u.charging=false; u.chargeT=0; return; }
  u.retarget-=dt;
  let t=u.target;
  if(!t||t.dead||(u.retarget<=0&&!inRange(u,t))||!canHit(u,t)||(t.team===u.team)){ t=u.target=findTarget(u); u.retarget=0.35; }
  else if(u.retarget<=0&&G.hasTaunt&&!t.taunt){ u.retarget=0.35; const tt=findTaunter(u); if(tt){ t=u.target=tt; } }
  // specials
  if(sp){ u.spT-=dt;
    switch(sp.k){
      case 'execute': if(u.spT<=0){ let best=null; for(const e of G.units){ if(e.team===u.team||e.dead||e.building||hidden(e)) continue; if(dist(u,e)<=sp.range&&(!best||e.hp>best.hp)) best=e; }
        if(best){ u.spT=sp.cd; u.execBusy=1.0; u.capT=2.2; best.stun=Math.max(best.stun,1.3); G.executions.push({u,t:best,time:0.95}); callout(u,'GUILTY!','#ffffff'); sfx('bad'); return; } u.spT=0.4; } break;
      case 'pulse': if(u.spT<=0){ const near=G.units.some(e=>e.team!==u.team&&!e.dead&&!e.building&&!hidden(e)&&dist(u,e)<=sp.r); if(near){ doAoe(u,u,sp); u.spT=sp.cd; } else u.spT=0.4; } break;
      case 'convert': if(u.spT<=0){ let best=null,bd=1e9; for(const e of G.units){ if(e.team===u.team||e.dead||e.building||hidden(e)||e.c.champ||e.c.cost>sp.maxCost||e.convT>0) continue; const d=dist(u,e); if(d<=sp.range&&d<bd){bd=d;best=e;} }
        if(best){ convertTemp(best,u.team,sp.dur,'flip'); callout(best,sp.callout+' ✍️','#ffe14d'); u.spT=sp.cd; u.atk=0.001; G.bolts.push({x1:u.x,h1:1,y1:u.y,x2:best.x,h2:1,y2:best.y,life:0.3,max:0.3,col:'#ffe14d'}); feedLog(`✍️ ${u.team===0?'Your':'Enemy'} Solicitor signed ${best.c.name}`,u.team); } else u.spT=0.5; } break;
      case 'stealth': if(!u.stealthOn&&G.t-u.lastAtkT>5){ u.stealthOn=true; fxPuff(u.x,0.6,u.y,8,'#888',0.4); } break;
      case 'charge': if(sp.enrage&&!u.enraged&&u.hp<u.maxHp*0.5){ u.enraged=true; u.rush=1e6; callout(u,'BERSERK!','#ff3b3b'); } break;
      case 'leap': if(u.spT<=0&&t){ const d=dist(u,t); if(d>=sp.min&&d<=sp.max+t.radius&&!t.flying){ const off=t.radius+u.radius; const nx=(u.x-t.x)/d, ny=(u.y-t.y)/d;
          u.leap={t:0,dur:0.75,fx:u.x,fy:u.y,tx:t.x+nx*off,ty:t.y+ny*off,h:2.4}; u.spT=sp.cd; callout(u,sp.callout,'#ffffff'); return; } } break;
      case 'dash': if(u.spT<=0&&t&&!t.isTower&&!t.building){ const d=dist(u,t); if(d>1.4&&d<5&&((u.y>16)===(t.y>16))){
          const nx=(t.x-u.x)/d, ny=(t.y-u.y)/d, ex=clamp(t.x+nx*1.2,0.5,17.5), ey=clamp(t.y+ny*1.2,0.5,31.5);
          for(const e of lineEnemies(u,u.x,u.y,ex,ey,0.75)) { damage(e,u.dmg*baseMul(u)*sp.mult,u); fxBurst(e.x,0.8,e.y,8,'#ffffff',3,0.15,0.3,4,true); }
          G.beams.push({x1:u.x,y1:u.y,x2:ex,y2:ey,h:0.8,col:'#ffffff',life:0.25,max:0.25,w:6});
          u.x=ex; u.y=ey; u.spT=sp.cd; callout(u,sp.callout,'#ffffff'); sfx('zap'); u.atk=0.001; } } break;
      case 'spawn': if(u.spT<=0&&t&&dist(u,t)<u.sight+1){ const d=dist(u,t)||1; const nx=(t.x-u.x)/d, ny=(t.y-u.y)/d;
          let wx2=u.x+nx*1.6, wy2=u.y+ny*1.6; if(wy2>14.8&&wy2<17.2) wy2=u.y; spawnUnit(sp.card,u.team,wx2,wy2,0.5); u.spT=sp.cd; u.atk=0.001; fxPuff(wx2,0.3,wy2,8,'#c9a46a',0.5); } break;
      case 'zap': if(u.spT<=0){ const best=zapPick(u,sp); if(best){ applyZap(u,best,sp); u.spT=sp.cd; u.atk=0.001; } else u.spT=0.5; } break;
      case 'buffAlly': if(u.spT<=0){ let best=null,bd=1e9; for(const v of G.units){ if(v.team!==u.team||v===u||v.dead||v.building||v.giant>0||v.deploy>0) continue; const d=dist(u,v); if(d<5&&d<bd){bd=d;best=v;} }
        if(best){ makeGiant(best,sp.giant); callout(best,sp.callout,'#7dff4a'); G.bolts.push({x1:u.x,h1:1,y1:u.y,x2:best.x,h2:1,y2:best.y,life:0.3,max:0.3,col:'#7dff4a'}); fxBurst(best.x,1,best.y,16,'#7dff4a',3,0.2,0.6,4,true); u.spT=sp.cd; u.atk=0.001; } else u.spT=0.6; } break;
      case 'cloneAlly': if(u.spT<=0){ let best=null,bd=1e9; for(const v of G.units){ if(v.team!==u.team||v===u||v.dead||v.building||v.c.champ||v.clone||v.deploy>0||v.origTeam!==undefined) continue; const d=dist(u,v); if(d<5&&d<bd){bd=d;best=v;} }
        if(best){ cloneUnit(best); callout(best,sp.callout,'#c8b6ff'); G.bolts.push({x1:u.x,h1:1,y1:u.y,x2:best.x,h2:1,y2:best.y,life:0.3,max:0.3,col:'#c8b6ff'}); u.spT=sp.cd; u.atk=0.001; } else u.spT=0.6; } break;
      case 'trail': if(u.moving){ u.trailT=(u.trailT||0)-dt; if(u.trailT<=0){ u.trailT=sp.every; spawnCloud(u.team,u.x-Math.sin(u.yaw)*0.8,u.y-Math.cos(u.yaw)*0.8,sp.r,0,sp.t,sp.slow,0,'#9a9ca2'); } } break;
      case 'growUp': if(u.grow<sp.max){ u.growT=(u.growT||0)+dt; if(u.growT>=sp.every){ u.growT=0; u.grow++; u.maxHp*=1.25; u.hp*=1.25; fxBurst(u.x,1,u.y,12,'#ffd34d',2.5,0.2,0.5,3,true); if(u.grow>=sp.max) callout(u,sp.callout,'#ffd34d'); } } break;
      case 'plow': if(u.moving||true){ for(const e of G.units){ if(e.team===u.team||e.dead||e.flying||e.building) continue; const d=dist(u,e); if(d<u.radius+e.radius+0.3){ const fx=Math.sin(u.yaw), fy=Math.cos(u.yaw); if((e.x-u.x)*fx+(e.y-u.y)*fy<0) continue;
          const side=Math.sign((e.x-u.x)*fy-(e.y-u.y)*fx)||1; const k=Math.min(1,6/e.mass)*6; e.kvx+=(fx*sp.push+fy*side*1.2)*k*dt*4; e.kvy+=(fy*sp.push-fx*side*1.2)*k*dt*4;
          e.plowT=(e.plowT||0)-dt; if(e.plowT<=0){ e.plowT=0.8; damage(e,40,u); e.stun=Math.max(e.stun,0.25); } } } } break;
    }
  }
  if(u.building&&!u.dmg) return;
  if(!t) return;
  u.aimYaw=Math.atan2(t.x-u.x,t.y-u.y);
  if(inRange(u,t)){
    u.inRange=true; u.yaw=u.aimYaw;
    u.cd-=dt*atkSpd;
    if(u.cd<=0){ u.cd=u.hs; attack(u,t); }
  } else if(u.speed>0){
    u.inRange=false;
    const [gx,gy]=moveGoal(u,t.x,t.y);
    const dx=gx-u.x, dy=gy-u.y, L=Math.hypot(dx,dy)||1;
    const step=Math.min(L,u.speed*spd*dt*(u.drunkT>0?0.75:1));
    u.x+=dx/L*step; u.y+=dy/L*step; u.walk+=dt*9*spd*Math.min(1.4,u.speed); u.moving=true;
    if((u.drunkT>0||u.c.tipsy)&&!u.flying){ const wb=Math.sin(G.t*3.2+u.uid*1.7)*u.speed*dt*(u.drunkT>0?1.1:0.6); u.x+=dy/L*wb; u.y-=dx/L*wb; }
    u.yaw=Math.atan2(dx,dy);
    u.cd=Math.max(u.cd,0.3);
    if(sp&&sp.k==='charge'){ u.chargeT=(u.chargeT||0)+dt; if(!u.charging&&u.chargeT>=sp.after){ u.charging=true; fxPuff(u.x,0.3,u.y,6,'#ffffff',0.3,0.4); } }
  }
  if(sp&&sp.k==='charge'&&!u.moving&&!u.charging) u.chargeT=0;
}
function lineEnemies(u,x1,y1,x2,y2,w){
  const out=[], dx=x2-x1, dy=y2-y1, L2=dx*dx+dy*dy||1;
  for(const e of G.units){ if(e.team===u.team||e.dead||hidden(e)) continue; if((e.flying)&&u.targets!=='all') continue;
    const k=clamp(((e.x-x1)*dx+(e.y-y1)*dy)/L2,0,1), px=x1+dx*k, py=y1+dy*k; if(Math.hypot(e.x-px,e.y-py)<=w+e.radius*0.6) out.push(e); }
  for(const t of G.towers){ if(t.team===u.team||t.dead) continue; const k=clamp(((t.x-x1)*dx+(t.y-y1)*dy)/L2,0,1), px=x1+dx*k, py=y1+dy*k; if(Math.hypot(t.x-px,t.y-py)<=w+t.radius*0.7) out.push(t); }
  return out;
}
function dmgOut(u,t){
  let d=u.dmg*baseMul(u);
  const oh=u.c.onHit;
  if(oh){
    if(oh.critChance&&Math.random()<oh.critChance[0]){ d*=oh.critChance[1]; callout(t,oh.critChance[2],'#ffcf4a'); }
    if(oh.lowBonus&&t.hp<t.maxHp*0.5) d*=oh.lowBonus;
    if(oh.bldMult&&t.building) d*=oh.bldMult;
    if(oh.random){ const r=oh.random[0]+Math.random()*(oh.random[1]-oh.random[0]); d*=r; if(r>4.3) callout(t,'TO THE MOON! 🚀','#ffcf4a'); else if(r<0.4) callout(t,'rugged 📉','#aaaaaa'); }
  }
  return d;
}
function applyOnHit(u,t,impX,impY){
  const oh=u.c.onHit; if(!oh) return;
  if(oh.puddle&&impX!==undefined&&!t){ spawnPuddle(u.team,impX,impY,oh.puddle[0],oh.puddle[1],oh.puddle[2]); }
  if(oh.cloud&&impX!==undefined&&!u._cloudDone){ u._cloudDone=true; spawnCloud(u.team,impX,impY,oh.cloud[0],oh.cloud[1],oh.cloud[2],oh.cloud[3]||0,0,oh.cloud[3]?'#d8d0c0':'#7dff4a'); }
  if(!t||t.dead) return;
  if(!t.isTower){
    if(oh.stun){ t.stun=Math.max(t.stun,oh.stun); if(oh.sleep) t.sleepT=oh.stun; }
    if(oh.slow){ t.slowT=oh.slow[0]; t.slowF=oh.slow[1]; }
    if(oh.blind){ t.blindT=oh.blind[0]; t.blindF=oh.blind[1]; }
    if(oh.weaken){ t.weak=Math.min(0.6,(t.weak||0)+oh.weaken); }
    if(oh.push) knock(t,u.x,u.y,oh.push);
    if(oh.yank) yankTo(t,u,oh.yank);
    if(oh.shrink){ if(!(t.shrinkT>0)) callout(t,'✏️ tiny!','#ffd34d'); t.shrinkT=oh.shrink; }
    if(oh.strip&&(t.shield>0||t.rush>0||t.giant>0||t.invis>0)){ t.shield=0; if(!t.enraged) t.rush=0; if(t.giant>0) t.giant=0.01; t.invis=0; callout(t,'FALSE! ❌','#ff5a5a'); }
    if(oh.laugh&&Math.random()<0.4) callout(t,'😂','#ffffff');
    if(oh.fear&&!t.c.champ){ if(!(t.fearT>0)) callout(t,'😱','#ffffff'); t.fearT=Math.max(t.fearT||0,oh.fear); }
    if(oh.drunk){ if(!(t.drunkT>0)) callout(t,'🥴','#ffffff'); t.drunkT=Math.max(t.drunkT||0,oh.drunk); }
    if(oh.gadget){ const g=Math.random()*3|0; if(g===0){ t.frozen=Math.max(t.frozen,1.2); callout(t,'❄️','#bfefff'); } else if(g===1){ t.slowT=3; t.slowF=0.4; callout(t,'🟢 GOO','#7dff4a'); } else { areaDamage(u.team,t.x,t.y,1.2,90,{towers:false}); fxBurst(t.x,0.6,t.y,14,'#ffb02e',4,0.2,0.4,6,true); callout(t,'💥','#ffb02e'); } }
  }
  if(oh.mark){ t.markT=oh.mark[0]; t.markM=oh.mark[1]; }
  if(oh.burn){ t.burnT=oh.burn[1]; t.burnD=oh.burn[0]; t.burnCol=null; if(t.isTower) damage(t,oh.burn[0],u); }
  if(oh.poison&&!t.isTower){ t.burnT=oh.poison[1]; t.burnD=oh.poison[0]; t.burnCol='#7dff4a'; }
  if(oh.hack&&t.building){ if(!(t.hackT>0)) callout(t,'HACKED! 💻','#39ff6a'); t.hackT=Math.max(t.hackT||0,oh.hack); }
  if(oh.repo&&t.building){ const foe=1-u.team; const take=Math.min(oh.repo,G.elixir[foe]); G.elixir[foe]-=take; G.elixir[u.team]=Math.min(10,G.elixir[u.team]+oh.repo); PSA.spawn(t.x,2,t.y,0,2,0,0.7,0.35,'#ff6bff',1,0); }
  if(oh.audit){ const extra=Math.min(oh.audit[1],t.hp*oh.audit[0]); damage(t,extra,u); }
}
function hitOne(u,t,d){ const dealt=damage(t,d,u); applyOnHit(u,t);
  const oh=u.c.onHit; if(oh&&oh.lifesteal&&dealt>0&&!u.dead){ u.hp=Math.min(u.maxHp,u.hp+dealt*oh.lifesteal); if(Math.random()<0.5) PSA.spawn(u.x,1,u.y,0,1.5,0,0.5,0.3,'#ff4f6a',1,0); } }
function doAoe(u,at,o){
  const x=at.x, y=at.y;
  if(o.callout) callout(u,o.callout,'#ffffff');
  if(o.convert){ if(at!==u&&!at.isTower) convertTemp(at,u.team,o.convert,'flip'); }
  else if(o.yank&&at!==u){ yankTo(at,u,o.yank); G.beams.push({x1:u.x,y1:u.y,x2:at.x,y2:at.y,h:1,h2:0.8,col:'#c8a46a',life:0.3,max:0.3,w:2}); }
  else {
    const fwdX=Math.sin(u.yaw||0)*1.4, fwdY=Math.cos(u.yaw||0)*1.4;
    for(const e of enemiesIn(u.team,x,y,o.r,{towers:!!o.dmg})){
      if(o.dmg) damage(e,o.dmg*baseMul(u),u,{splash:true});
      if(e.isTower||e.dead) continue;
      if(o.stun) e.stun=Math.max(e.stun,o.stun);
      if(o.push) knock(e,x,y,o.push);
      if(o.charm) convertTemp(e,u.team,o.charm,'charm');
      if(o.sleep&&o.stun) e.sleepT=o.stun; if(o.dance&&o.stun) e.danceT=o.stun;
      if(o.sing){ e.stun=Math.max(e.stun,o.sing); e.singT=o.sing; }
      if(o.fear) e.fearT=Math.max(e.fearT||0,o.fear);
      if(o.frozen){ e.frozen=Math.max(e.frozen,o.frozen); e.stone=!!o.stone; }
      if(o.pull){ const cx=u.x+fwdX, cy=u.y+fwdY, d=Math.hypot(cx-e.x,cy-e.y)||1; const k=Math.min(1,6/e.mass)*Math.min(d,3)*5; e.kvx+=(cx-e.x)/d*k; e.kvy+=(cy-e.y)/d*k; }
    }
  }
  if(o.shieldAllies||o.rally){ for(const v of G.units) if(v.team===u.team&&!v.dead&&!v.building&&dist(v,u)<=o.r){ if(o.shieldAllies) v.shield=Math.max(v.shield,o.shieldAllies); if(o.rally) v.rush=Math.max(v.rush,o.rally); } }
  if(o.tauntSelf){ u.taunt=o.r; u.tauntT=o.tauntSelf; for(const e of G.units) if(e.team!==u.team&&!e.dead&&!e.building&&dist(e,u)<=o.r&&canHit(e,u)) e.target=u; }
  if(o.cloud) spawnCloud(u.team,x,y,o.cloud[0],o.cloud[1],o.cloud[2],0,0,'#9adf3a');
  if(o.yank) return;
  const col=o.sing?'#ff3dce':o.charm?'#ff6bb5':o.fear?'#b07aff':o.frozen?'#bfefff':o.shieldAllies?'#8ff0ff':o.rally?'#ff6bff':o.cloud?'#9adf3a':o.pull?'#ffffff':o.dmg?'#ffb02e':'#ffe14d';
  fxRing(x,y,0.3,o.r,0.45,col);
  if(o.charm){ for(let i=0;i<18;i++){ const a=Math.random()*TAU; PSA.spawn(x+Math.cos(a)*o.r*0.6,0.8,y+Math.sin(a)*o.r*0.6,Math.cos(a)*0.5,1.5,Math.sin(a)*0.5,1.2,0.3,'#ff4f9a',1,0); } sfx('power'); }
  else { fxBurst(x,0.4,y,16,col,4,0.2,0.5,8,true); sfx('kick'); }
  G.shake=Math.max(G.shake,0.15);
}
function attack(u,t){
  const a=u.c.atk, sp=u.c.sp;
  if(a.k==='none') return;
  u.atk=0.001; u.lastAtkT=G.t;
  if(u.drunkT>0&&Math.random()<0.35){ callout(u,Math.random()<0.5?'*hic*':'missed!','#ffd34d'); PSN.spawn(u.x,1.2*u.scale,u.y,0,0.8,0,0.6,0.3,'#fff4c0',0.7,0,1,1); return; }
  if(a.k==='boomerang'){ const d=dist(u,t)||1; G.booms.push({team:u.team,src:u,x:u.x,y:u.y,dx:(t.x-u.x)/d,dy:(t.y-u.y)/d,max:u.range+1.2,d:0,out:true,hit:new Set(),spin:0,proj:a.proj}); sfx('arrow'); return; }
  let mult=1;
  if(u.stealthOn){ u.stealthOn=false; mult*=sp.mult; callout(u,sp.callout,'#ffffff'); fxPuff(u.x,0.6,u.y,8,'#888',0.4); if(u.c.onHit&&u.c.onHit.flipFirst&&!t.isTower&&!t.building&&!t.c.champ){ convertTemp(t,u.team,u.c.onHit.flipFirst,'flip'); callout(t,'TURNED! 🕶️','#ffe14d'); } }
  if(a.ramp&&a.k==='melee'){ const r0=u.rampTarget===t?Math.min(a.ramp,(u.ramp||1)+0.4):1; u.ramp=r0; u.rampTarget=t; mult*=r0; }
  if(u.charging){ u.charging=false; u.chargeT=0; mult*=sp.mult; callout(u,sp.callout,'#ff6b3b'); if(sp.push) knock(t,u.x,u.y,sp.push); G.shake=Math.max(G.shake,0.15); fxBurst(t.x,0.6,t.y,14,'#ffffff',4,0.2,0.4,6); }
  if(a.k==='melee'){
    if(a.pierce){ const d=dist(u,t)||1, L=Math.min(u.range+u.radius+0.4, d+t.radius); const ex=u.x+(t.x-u.x)/d*L, ey=u.y+(t.y-u.y)/d*L; u.stretch=L;
      for(const e of lineEnemies(u,u.x,u.y,ex,ey,0.45)) hitOne(u,e,dmgOut(u,e)*mult); }
    else if(a.splash){ for(const e of enemiesIn(u.team,t.x,t.y,a.splash,{air:u.targets==='all'})){ damage(e,dmgOut(u,e)*mult,u,{splash:true}); applyOnHit(u,e); if(a.push) knock(e,u.x,u.y,a.push); } fxRing(t.x,t.y,0.2,a.splash,0.3,'#ffffff'); G.shake=Math.max(G.shake,0.1); }
    else hitOne(u,t,dmgOut(u,t)*mult);
    const crit=u.c.onHit&&u.c.onHit.crit; if(crit){ u.critN=(u.critN||0)+1; if(u.critN%crit[0]===0){ damage(t,dmgOut(u,t)*(crit[1]-1),u); callout(t,crit[2],'#ffe14d'); } }
    const hx=t.x-(t.x-u.x)*0.35, hy=t.y-(t.y-u.y)*0.35;
    fxBurst(hx,t.isTower?1.5:0.7,hy,u.mass>=8?12:6,u.fire>0?'#ff7a1a':'#ffffff',u.mass>=8?4:2.8,0.15,0.28,4,true);
    if(u.mass>=8&&!t.flying){ fxRing(hx,hy,0.15,1.0,0.25,'#ffffff'); fxPuff(hx,0.15,hy,4,'#d8cdb0',0.35,0.35); G.shake=Math.max(G.shake,0.08); }
    sfx('hit');
    if(u.fire>0) areaDamage(u.team,t.x,t.y,0.9,u.dmg*0.3,{towers:false});
  } else if(a.k==='proj'){
    let big=false; if(a.big){ u.shotN=(u.shotN||0)+1; big=u.shotN%a.big.n===0; if(big) callout(u,'SATURN V! 🚀','#ffb02e'); }
    const h0=(u.flying?1.6:0)+(u.c.model.k==='h'?1.0:0.7)*u.scale*VS;
    G.projs.push({key:a.proj,x:u.x,y:u.y,z:h0,sx:u.x,sy:u.y,target:t,tx:t.x,ty:t.y,speed:a.speed||(a.lob?7.5:12),lob:!!a.lob,total:dist(u,t),prog:0,
      splash:big?a.big.splash:a.splash,mult:(big?a.big.mult:1)*mult,src:u,team:u.team,big,sight:a.sight,bounce:a.bounce||0,heal:a.healSplash||0});
    { const d=dist(u,t)||1, mx=u.x+(t.x-u.x)/d*0.5, my=u.y+(t.y-u.y)/d*0.5; PSA.spawn(mx,h0,my,0,0,0,0.08,0.55,(PROJ[a.proj]||[])[3]||'#fff2c0',1,0); }
    if(a.sight) G.beams.push({x1:u.x,y1:u.y,x2:t.x,y2:t.y,h:1.1,col:'#ff2020',life:0.35,max:0.35,w:1.2});
    sfx('arrow');
  } else if(a.k==='beam'){
    let ramp=1; if(a.ramp){ ramp = u.rampTarget===t ? Math.min(a.ramp,(u.ramp||1)+0.35) : 1; u.ramp=ramp; u.rampTarget=t; }
    const d=dist(u,t)||1, h=(u.flying?1.6:0)+0.95*u.scale*VS;
    let ex=t.x, ey=t.y;
    if(a.cone||a.pierce){ const L=a.pierce?Math.max(d+t.radius,u.range+1.5):Math.min(d+t.radius,u.range+u.radius+0.6); ex=u.x+(t.x-u.x)/d*L; ey=u.y+(t.y-u.y)/d*L;
      for(const e of lineEnemies(u,u.x,u.y,ex,ey,a.cone?0.85:0.4)){ hitOne(u,e,dmgOut(u,e)*ramp*mult); if(a.push) knock(e,u.x,u.y,a.push); } }
    else { hitOne(u,t,dmgOut(u,t)*ramp*mult); if(a.push) knock(t,u.x,u.y,a.push); }
    G.beams.push({x1:u.x,y1:u.y,x2:ex,y2:ey,h,h2:t.isTower?1.8:(t.flying?1.6:0.6),col:a.col,life:Math.min(0.3,u.hs*1.1),max:Math.min(0.3,u.hs*1.1),w:(a.cone?9:4)+ramp*1.2,cone:a.cone});
    if(a.cone) for(let i=0;i<2;i++){ const k=Math.random(); (a.col==='#7fd0ff'?PSN:PSA).spawn(u.x+(ex-u.x)*k,h*(1-k)+0.4*k,u.y+(ey-u.y)*k,rnd(-1,1),rnd(0,1.5),rnd(-1,1),0.35,0.28,a.col,0.8,a.col==='#7fd0ff'?6:0); }
    if(Math.random()<0.4) sfx('zap');
  }
  if(sp&&sp.k==='everyN'){ u.hits++; if(u.hits%sp.n===0) doAoe(u,sp.self?u:t,sp); }
}

// ---------------------------------------------------------------- towers, projectiles, rolls
function updateTower(t,dt){
  if(t.hitT>0) t.hitT-=dt; if(t.atk>0) t.atk-=dt;
  if(t.frozen>0){ t.frozen-=dt; return; }
  if(t.hackT>0){ t.hackT-=dt; if(Math.random()<dt*8) PSA.spawn(t.x+rnd(-1,1),rnd(2,3.5),t.y+rnd(-1,1),0,1,0,0.4,0.2,'#39ff6a',1,0); return; }
  if(!t.active) return;
  t.cd-=dt;
  const ok=e=>e&&!e.dead&&!hidden(e)&&e.team!==t.team&&dist(t,e)-e.radius<=t.range;
  if(!ok(t.target)){ t.target=null; let bd=1e9; for(const u of G.units){ if(!ok(u)) continue; const d=dist(t,u); if(d<bd){bd=d;t.target=u;} } }
  if(t.target){
    t.yaw=Math.atan2(t.target.x-t.x,t.target.y-t.y);
    if(t.cd<=0){ t.cd=t.hs; t.atk=0.3;
      const king=t.kind==='king';
      G.projs.push({key:king?'cannon':G.th.towerProj,x:t.x,y:t.y,z:king?3.4:3.4,target:t.target,tx:t.target.x,ty:t.target.y,speed:king?11:15,dmg:t.dmg,team:t.team,tower:true});
      if(G.units.length<40) sfx('arrow'); }
  }
}
function updateProj(p,dt){
  if(p.target&&!p.target.dead){ p.tx=p.target.x; p.ty=p.target.y; }
  const dx=p.tx-p.x, dy=p.ty-p.y, L=Math.hypot(dx,dy), step=p.speed*dt;
  const tz=p.target?(p.target.isTower?1.6:(p.target.flying?1.6:0.5)):0.3;
  if(p.lob){ p.prog+=step; const f=Math.min(1,p.prog/Math.max(0.5,p.total)); p.z=1.0*(1-f)+tz*f+Math.sin(f*PI)*Math.max(1.6,p.total*0.45); }
  else p.z+=(tz-p.z)*Math.min(1,dt*6);
  p.dir=Math.atan2(dx,dy);
  const tr=(PROJ[p.key]||[])[3]; if(tr&&Math.random()<0.7) ((PROJ[p.key][4])?PSA:PSN).spawn(p.x,p.z,p.y,0,0,0,0.25,p.big?0.4:0.18,tr,0.8,0);
  if(L<=step+0.05){
    p.done=true;
    if(p.tower){ if(p.target&&!p.target.dead) damage(p.target,p.dmg,p.team); return; }
    const u=p.src;
    if(p.splash){
      u._cloudDone=false;
      for(const e of enemiesIn(p.team,p.tx,p.ty,p.splash,{air:u.targets==='all'})){ damage(e,dmgOut(u,e)*p.mult,u,{splash:true}); applyOnHit(u,e,p.tx,p.ty); }
      applyOnHit(u,null,p.tx,p.ty);
      if(p.heal){ for(const v of G.units) if(v.team===p.team&&!v.dead&&!v.building&&Math.hypot(v.x-p.tx,v.y-p.ty)<=p.splash+v.radius*0.5){ v.hp=Math.min(v.maxHp,v.hp+p.heal); PSA.spawn(v.x,1,v.y,0,1.5,0,0.6,0.3,'#7dff8a',1,0); } }
      const col=(PROJ[p.key]||[])[3]||(PROJ[p.key]||[])[1]||'#ffffff';
      fxRing(p.tx,p.ty,0.2,p.splash,0.35,col); fxBurst(p.tx,0.5,p.ty,p.big?40:14,col,p.big?6:3,p.big?0.3:0.18,0.5,8,true);
      if(p.big){ G.shake=Math.max(G.shake,0.3); sfx('boom'); fxPuff(p.tx,0.4,p.ty,10,'#777',0.8,1); } else sfx('pop');
    } else if(p.target&&!p.target.dead){ const tg=p.target; hitOne(u,tg,dmgOut(u,tg)*p.mult); fxBurst(p.tx,tg.isTower?1.6:0.7,p.ty,5,'#ffffff',2,0.13,0.25,4,true);
      if(p.bounce>0){ const hit=p.hitSet||new Set(); hit.add(tg.uid||('t'+tg.x+tg.y)); let nb=null,bd=4;
        for(const e of G.units){ if(e.team===p.team||e.dead||hit.has(e.uid)||!canHit(u,e)) continue; const d=Math.hypot(e.x-p.tx,e.y-p.ty); if(d<bd){bd=d;nb=e;} }
        if(nb) G.projs.push({key:p.key,x:p.tx,y:p.ty,z:tg.isTower?1.6:0.7,target:nb,tx:nb.x,ty:nb.y,speed:p.speed,lob:false,total:bd,prog:0,mult:p.mult*0.85,src:u,team:p.team,bounce:p.bounce-1,hitSet:hit}); } }
  } else { p.x+=dx/L*step; p.y+=dy/L*step; }
}
function updateRoll(r,dt){
  const step=6*dt; r.y+=r.dir*step; r.traveled+=step; r.spin+=dt*10;
  if(Math.random()<dt*30) PSN.spawn(r.x+rnd(-0.6,0.6),0.1,r.y-r.dir*0.6,0,0.6,0,0.5,0.4,'#d8cdb0',0.6,0,1,2);
  if(r.fire&&Math.random()<dt*40) PSA.spawn(r.x+rnd(-0.4,0.4),0.9+rnd(-0.3,0.3),r.y-r.dir*0.3,rnd(-0.5,0.5),rnd(1,2.5),-r.dir*1.5,0.4,0.45,Math.random()<0.5?'#ff7a1a':'#ffd34d',1,0);
  for(const e of G.units){ if(e.team===r.team||e.dead||e.flying||e.building||r.hit.has(e.uid)) continue;
    if(Math.abs(e.x-r.x)<r.r*1.8+e.radius && Math.abs(e.y-r.y)<r.r+e.radius){ r.hit.add(e.uid); damage(e,r.dmg,r.team,{splash:true}); if(r.burn&&!e.dead){ e.burnT=r.burn[1]; e.burnD=r.burn[0]; e.burnCol=null; } const k=Math.min(1,6/e.mass)*6; e.kvy+=r.dir*r.push*k; e.kvx+=Math.sign(e.x-r.x||1)*0.6*k; e.stun=Math.max(e.stun,0.4); fxBurst(e.x,0.6,e.y,6,'#ffffff',3,0.15,0.3,6); sfx('hit'); } }
  for(const t of G.towers){ if(t.team===r.team||t.dead||r.hit.has('t'+t.x+t.y)) continue; if(Math.abs(t.x-r.x)<t.radius+r.r&&Math.abs(t.y-r.y)<t.radius+r.r){ r.hit.add('t'+t.x+t.y); damage(t,r.dmg*(r.towerPct||0.3),r.team); if(r.towerPct){ G.shake=Math.max(G.shake,0.35); fxBurst(r.x,1,r.y,30,'#ffb02e',5,0.3,0.6,8,true); sfx('boom'); r.done=true; } } }
  if(r.traveled>=r.len||r.y<0.5||r.y>31.5){ r.done=true; fxPuff(r.x,0.3,r.y,10,'#d8cdb0',0.6,0.6); }
}
function separate(){
  const us=G.units;
  for(let i=0;i<us.length;i++){
    const a=us[i]; if(a.dead) continue; const af=a.flying||!!a.leap;
    for(let j=i+1;j<us.length;j++){
      const b=us[j]; if(b.dead||af!==(b.flying||!!b.leap)) continue;
      const dx=b.x-a.x, dy=b.y-a.y, min=(a.radius+b.radius)*0.9;
      if(Math.abs(dx)>min||Math.abs(dy)>min) continue;
      let d=Math.hypot(dx,dy); if(d>=min) continue;
      let nx,ny; if(d<0.001){ const r=Math.random()*TAU; nx=Math.cos(r); ny=Math.sin(r); d=0; } else { nx=dx/d; ny=dy/d; }
      const ov=(min-d)*0.5, tm=a.mass+b.mass, wa=b.mass/tm, wb=a.mass/tm;
      a.x-=nx*ov*wa; a.y-=ny*ov*wa; b.x+=nx*ov*wb; b.y+=ny*ov*wb;
    }
    if(!af) for(const t of G.towers){ if(t.dead) continue; const dx=a.x-t.x, dy=a.y-t.y, m=t.radius+a.radius*0.8, d=Math.hypot(dx,dy); if(d<m&&d>0.001){ a.x=t.x+dx/d*m; a.y=t.y+dy/d*m; } }
    if(!af&&!a.c.swim&&a.y>15&&a.y<17){ const bx=Math.abs(a.x-BRIDGES[0])<Math.abs(a.x-BRIDGES[1])?BRIDGES[0]:BRIDGES[1];
      if(Math.abs(a.x-bx)>0.9){ if(a.deploy>0||Math.abs(a.x-bx)>1.3) a.y=a.y<16?15:17; else a.x=bx+Math.sign(a.x-bx)*0.9; } }
    a.x=clamp(a.x,0.35,AW-0.35); a.y=clamp(a.y,0.35,AH-0.35);
  }
}
function decideWinner(){
  if(G.crowns[0]!==G.crowns[1]) return G.crowns[0]>G.crowns[1]?0:1;
  const low=tm=>Math.min(...G.towers.filter(t=>t.team===tm&&!t.dead).map(t=>t.hp));
  const a=low(0), b=low(1); if(Math.abs(a-b)<1) return -1; return a>b?0:1;
}
function endGame(w){
  if(G.over) return; G.over=true; G.winner=w; G.sel=-1; G.drag=null; hideGhost();
  if(w===-1) showBanner('DRAW','',2.2,'#ffe14d'); else if(G.time<=0) showBanner(w===0?'YOU WIN!':'YOU LOSE','',2.2,w===0?'#ffe14d':'#ff8080');
  aiEmote(w===1?'gloat':'sad',true);
}
function callout(at,text,col,big){ G.callouts.push({x:at.x,y:at.y,h:(at.h!=null?at.h:((at.flying?1.6:0)+2.0*(at.scale||1))),text,col,t:0,max:big?1.5:1.15,big:!!big,follow:at.uid?at:null}); }
function showBanner(s,sub,dur,col='#fff'){ if(G) G.banner={s,sub,t:0,dur,col}; }
function aiEmote(kind,force){
  if(!G||(!force&&G.aiEmoteCd>0)) return; G.aiEmoteCd=8;
  const em=G.th.emotes; const txt = kind==='gloat'?em[2]: kind==='sad'?em[3]: Math.random()<0.5?em[0]:em[1];
  G.emotes.push({team:1,text:txt,t:0});
}

// ---------------------------------------------------------------- AI (plays from the top; mirrored in autotest)
const unitValue=u=>u.c.cost/(u.c.count||1);
function aiAct(team){
  if(G.over) return;
  const D=G.diff, el=G.elixir[team], hand=G.hands[team], foe=1-team;
  const my=y=>team===1?y:AH-y;
  if(aiTap(team)) return;
  const hasChamp=!!champOf(team);
  const afford=[]; hand.forEach((id,i)=>{ if(CARDS[id].cost<=el&&!(hasChamp&&CARDS[id].champ)) afford.push(i); });
  if(!afford.length) return;
  const play=(i,x,y)=>playCard(team,i,x,my(y));
  const pick=f=>afford.filter(i=>f(hand[i],CARDS[hand[i]]));
  const enemies=G.units.filter(u=>u.team===foe&&!u.dead&&!u.building&&!hidden(u));
  const threats=enemies.filter(u=>my(u.y)<19);
  const mine=G.units.filter(u=>u.team===team&&!u.dead&&!u.building);
  if(threats.length){
    threats.sort((a,b)=>my(a.y)-my(b.y));
    const th=threats[0];
    let val=0,air=false,cnt=0,cx=0,cy=0;
    for(const t of threats) if(dist(t,th)<3.5){ val+=unitValue(t); cnt++; cx+=t.x; cy+=t.y; if(t.flying) air=true; }
    cx/=cnt; cy/=cnt;
    let defVal=0; for(const u of mine) if(dist(u,th)<5) defVal+=unitValue(u);
    if(defVal>=val*1.3&&D.smart>0) return;
    const sp=pick((id,c)=>['sdmg','sutil','sroll','sdrain'].includes(c.role))[0];
    if(sp!==undefined){ const c=CARDS[hand[sp]]; let inR=0,v=0; for(const t of enemies) if(Math.hypot(t.x-cx,t.y-cy)<2.8){ inR++; v+=unitValue(t); }
      const need = c.role==='sdmg'?4:c.role==='sutil'?5:c.role==='sroll'?2.5:3.5;
      if(v>=need&&inR>=2||(D.smart>1&&v>=need-0.5)){ playCard(team,sp,cx,cy+(team===1?-0.8:0.8)); return; } }
    if(th.targets==='buildings'){ const b=pick((id,c)=>c.type==='building')[0]; if(b!==undefined){ play(b,9,my(th.y)<12?my(th.y)-3.5:10.5); return; } }
    let cands=pick((id,c)=>c.type==='troop'&&c.role!=='tank'&&c.role!=='support'&&(!air||c.targets==='all'));
    if(!cands.length) cands=pick((id,c)=>c.type!=='spell'&&(!air||c.targets==='all'));
    if(!cands.length) return;
    const swarm=cnt>=3;
    const score=i=>{ const c=CARDS[hand[i]]; return (swarm&&(c.role==='splash'||(c.atk&&(c.atk.cone||c.atk.splash)))?5:0)+(D.smart?-Math.abs(c.cost-val):c.cost); };
    cands.sort((a,b)=>score(b)-score(a));
    const ci=cands[0], cd=CARDS[hand[ci]];
    const ty=my(th.y);
    let px=clamp(th.x+rnd(-0.8,0.8),1,17), py;
    if(ty>16) py=cd.range>2?11:13.8; else py=cd.range>2?Math.max(1.5,ty-4.5):Math.max(1.5,ty-1.6);
    if(cd.range>2&&D.smart>0) px=th.x<9?clamp(th.x+2,1,8):clamp(th.x-2,10,17);
    play(ci,px,py); return;
  }
  const pushers=mine.filter(u=>my(u.y)>12);
  if(pushers.length>=2){ const b=pick((id,c)=>c.role==='sbuff')[0]; let v=0; pushers.forEach(u=>v+=unitValue(u));
    if(b!==undefined&&v>=4){ const cx=pushers.reduce((s,u)=>s+u.x,0)/pushers.length, cy=pushers.reduce((s,u)=>s+u.y,0)/pushers.length; playCard(team,b,cx,cy); return; } }
  const ft=G.towers.find(t=>t.team===foe&&!t.dead&&t.hp<=200); const mi=pick((id,c)=>c.role==='sdmg')[0];
  if(ft&&mi!==undefined&&D.smart>0){ playCard(team,mi,ft.x,ft.y); return; }
  if(el<D.pushAt&&el<10) return;
  const foeT=G.towers.filter(t=>t.team===foe&&!t.dead&&t.kind==='princess').sort((a,b)=>a.hp-b.hp);
  const laneX=foeT.length?foeT[0].x:(Math.random()<0.5?3.5:14.5);
  const myPush=mine.filter(u=>Math.abs(u.x-laneX)<5);
  let cands=pick((id,c)=>c.type==='troop');
  if(!cands.length){ if(el>=10){ const any=afford[0], c=CARDS[hand[any]];
      if(c.type==='spell'){ if(c.role==='sbuff'){ if(mine.length) playCard(team,any,mine[0].x,mine[0].y); else { const tw=G.towers.find(t=>t.team===team&&!t.dead); playCard(team,any,tw.x,tw.y+(team?2:-2)); } } else { const tw=G.towers.find(t=>t.team===foe&&!t.dead); playCard(team,any,tw.x,tw.y); } }
      else play(any,9,10); } return; }
  const tankIdx=cands.find(i=>CARDS[hand[i]].role==='tank'||hand[i]==='bull'||hand[i]==='bear');
  let ci,py,px=laneX+rnd(-0.6,0.6);
  if(!myPush.length&&tankIdx!==undefined){ ci=tankIdx; py=CARDS[hand[ci]].role==='tank'?11:14; }
  else if(myPush.length){ ci=cands.find(i=>CARDS[hand[i]].role!=='tank')??cands[0]; const lead=myPush.sort((a,b)=>my(b.y)-my(a.y))[0]; py=clamp(my(lead.y)-1.8,2,14.5); px=lead.x; }
  else { ci=cands[Math.random()*cands.length|0]; py=14; }
  const c=CARDS[hand[ci]]; if(c.deployAnywhere&&D.smart>0){ const tw=foeT[0]; if(tw){ playCard(team,ci,tw.x+(tw.x<9?1.6:-1.6),tw.y+(team===1?-1.5:1.5)); return; } }
  play(ci,px,py);
}


// ---------------------------------------------------------------- champions (tap abilities), boomerangs, event feed
function champOf(team){ return G.units.find(u=>u.team===team&&!u.dead&&u.c.champ&&u.origTeam===undefined)||G.units.find(u=>!u.dead&&u.c.champ&&u.origTeam===team); }
function feedLog(text,team){ if(!G) return; G.feed.push({text,team,t:0}); if(G.feed.length>4) G.feed.shift(); }
function strongestEnemy(u,range,filter){ let best=null; for(const e of G.units){ if(e.team===u.team||e.dead||e.building||hidden(e)||e.deploy>0) continue; if(filter&&!filter(e)) continue; if(dist(u,e)<=range&&(!best||e.hp*e.c.cost>best.hp*best.c.cost)) best=e; } return best; }
function tapState(team){
  const u=champOf(team); if(!u||u.deploy>0) return null;
  const tp=u.c.tap; return {u,tp,cd:Math.max(0,G.tapCd[team]),ready:G.tapCd[team]<=0&&G.elixir[team]>=tp.cost&&!(u.frozen>0||u.stun>0||u.floatT>0)};
}
function useTap(team){
  const st=tapState(team); if(!st) return 'none';
  const {u,tp}=st;
  if(G.tapCd[team]>0) return 'cd';
  if(G.elixir[team]<tp.cost) return 'elixir';
  if(u.frozen>0||u.stun>0||u.floatT>0) return 'stunned';
  const who=team===0?'Your':'Enemy';
  let ok=true;
  switch(tp.k){
    case 'execute': { const t=strongestEnemy(u,tp.range); if(!t){ ok=false; break; }
      u.execBusy=1.0; u.capT=2.4; t.stun=Math.max(t.stun,1.4); G.executions.push({u,t,time:0.95}); callout(u,'GUILTY!','#ffffff'); sfx('bad'); break; }
    case 'takeover': { const t=strongestEnemy(u,tp.range,e=>!e.c.champ); if(!t){ ok=false; break; }
      convertTemp(t,u.team,tp.dur,'flip'); for(let i=0;i<24;i++) PSA.spawn(t.x+rnd(-0.5,0.5),rnd(0.5,2),t.y+rnd(-0.5,0.5),rnd(-2,2),rnd(1,4),rnd(-2,2),0.9,0.3,'#ffd34d',1,6);
      G.bolts.push({x1:u.x,h1:1.2,y1:u.y,x2:t.x,h2:1,y2:t.y,life:0.35,max:0.35,col:'#ffd34d'}); callout(t,'ACQUIRED! 💼','#ffd34d',true); feedLog(`💼 ${who} Hedge Fund bought out ${t.c.name}`,team); break; }
    case 'saturn': { const foe=1-team; let best=null,bd=1e9; for(const tw of G.towers){ if(tw.team!==foe||tw.dead) continue; const d=dist(u,tw); if(d<bd){bd=d;best=tw;} } if(!best){ ok=false; break; }
      const obj=buildFall('rocketBig',TEAMC[team]); dynRoot.add(obj);
      G.spells.push({id:'saturn',s:{k:'damage',r:tp.r,dmg:tp.dmg,towerDmg:tp.towerDmg,push:0.8,fall:'rocketBig'},team,x:best.x,y:best.y,t:1.6,max:1.6,obj});
      fxDecal(best.x,best.y,tp.r,'#ff3b3b',1.6,0.3); feedLog(`🚀 ${who} Saturn V launched!`,team); break; }
    case 'override': { const foe=1-team; for(const tw of G.towers) if(tw.team===foe&&!tw.dead){ tw.hackT=Math.max(tw.hackT||0,tp.dur); G.bolts.push({x1:u.x,h1:1,y1:u.y,x2:tw.x,h2:3,y2:tw.y,life:0.4,max:0.4,col:'#39ff6a'}); }
      for(const b of G.units) if(b.team===foe&&b.building&&!b.dead) b.hackT=tp.dur;
      showBanner('SYSTEM OVERRIDE','Enemy defenses offline',1.4,'#39ff6a'); feedLog(`💻 ${who} Hacker shut down the towers`,team); break; }
    case 'rampage': makeGiant(u,tp.dur); u.hp=Math.min(u.maxHp,u.hp+u.maxHp*0.35); u.rush=Math.max(u.rush,tp.dur); fxBurst(u.x,1,u.y,30,'#7dff4a',4,0.25,0.7,4,true); fxRing(u.x,u.y,0.3,2.5,0.5,'#7dff4a'); break;
    case 'clear': { const list=G.graveyard[team].filter(id=>!CARDS[id].champ).slice(-tp.n); for(const id of list){ const i=G.graveyard[team].lastIndexOf(id); G.graveyard[team].splice(i,1); }
      doAoe(u,u,{r:tp.r,stun:1.0,dmg:80}); G.bolts.push({x1:u.x,h1:3,y1:u.y,x2:u.x,h2:0,y2:u.y,life:0.3,max:0.3,col:'#9ffcff'});
      list.forEach((id,i)=>{ const a=i/Math.max(1,list.length)*TAU; G.revives.push({card:id,team,x:u.x+Math.cos(a)*1,y:u.y+Math.sin(a)*1,t:0.5}); });
      if(list.length) feedLog(`🫀 ${who} Paramedic revived ${list.length} troop${list.length>1?'s':''}`,team); break; }
    case 'raw': case 'spin': case 'smash': doAoe(u,u,{r:tp.r,dmg:tp.dmg,stun:tp.stun,push:tp.push}); G.shake=Math.max(G.shake,0.3); break;
    case 'charm': { const n=G.units.filter(e=>e.team!==u.team&&!e.dead&&!e.building&&dist(e,u)<=tp.r).length; if(!n){ ok=false; break; } doAoe(u,u,{r:tp.r,charm:tp.dur}); feedLog(`${tp.icon} ${who} ${u.c.short||u.c.name} won over ${n} troop${n>1?'s':''}`,team); break; }
    case 'cannon': { const fx=Math.sin(u.yaw), fy=Math.cos(u.yaw); let n=0;
      for(const e of G.units){ if(e.team===u.team||e.dead||e.building) continue; const dx=e.x-u.x, dy=e.y-u.y, d=Math.hypot(dx,dy); if(d>tp.range||d<0.01) continue; if((dx*fx+dy*fy)/d<0.45) continue;
        damage(e,tp.dmg,u,{splash:true}); const k=Math.min(1,6/e.mass)*tp.push*6; e.kvx+=fx*k; e.kvy+=fy*k; e.stun=Math.max(e.stun,0.5); if(tp.burn){ e.burnT=tp.burn[1]; e.burnD=tp.burn[0]; e.burnCol=null; } else e.burnT=0; n++; }
      const cc=tp.col||'#7fd0ff';
      G.beams.push({x1:u.x,y1:u.y,x2:u.x+fx*tp.range,y2:u.y+fy*tp.range,h:1,h2:0.6,col:cc,life:0.6,max:0.6,w:14,cone:true});
      for(let i=0;i<40;i++){ const k=Math.random(), sp=rnd(-0.5,0.5); (tp.col?PSA:PSN).spawn(u.x+fx*k*tp.range+fy*sp*k*2,0.8,u.y+fy*k*tp.range-fx*sp*k*2,fx*4,rnd(0,2),fy*4,0.6,0.35,tp.col?'#ffb02e':'#9fe0ff',0.8,tp.col?0:6); } sfx('boom'); break; }
    case 'aoe': { const en=G.units.filter(e=>e.team!==u.team&&!e.dead&&!e.building&&!hidden(e)&&dist(e,u)<=tp.r), al=G.units.filter(v=>v.team===u.team&&!v.dead&&!v.building&&dist(v,u)<=tp.r);
      if(tp.needEnemies&&!en.length){ ok=false; break; } if(tp.needAllies&&!al.some(v=>v!==u)&&!(tp.ally&&tp.ally.healPct&&u.hp<u.maxHp)){ ok=false; break; }
      for(const e of en){ if(tp.dmg) damage(e,tp.dmg,u,{splash:true}); if(e.dead) continue; if(tp.stun) e.stun=Math.max(e.stun,tp.stun); if(tp.frozen){ e.frozen=Math.max(e.frozen,tp.frozen); e.stone=!!tp.stone; } if(tp.push) knock(e,u.x,u.y,tp.push); if(tp.rewind) rewindUnit(e,tp.rewind); if(tp.fear) e.fearT=Math.max(e.fearT||0,tp.fear); }
      if(tp.ally) for(const v of al){ const a=tp.ally; if(a.healPct) v.hp=Math.min(v.maxHp,v.hp+v.maxHp*a.healPct); if(a.shield) v.shield=Math.max(v.shield,a.shield); if(a.giant) makeGiant(v,a.giant); if(a.rush) v.rush=Math.max(v.rush,a.rush); PSA.spawn(v.x,1.2,v.y,0,1.5,0,0.7,0.35,'#7dff8a',1,0); }
      const col=tp.frozen?(tp.stone?'#c8c0b4':'#bfefff'):tp.ally&&!tp.stun?'#7dff8a':tp.rewind?'#ffd34d':'#ffffff';
      fxRing(u.x,u.y,0.3,tp.r,0.6,col); fxBurst(u.x,1,u.y,30,col,5,0.25,0.7,4,true); G.shake=Math.max(G.shake,0.25); sfx(tp.frozen?'freeze':'power');
      if(tp.rewind) showBanner('🎬 CUT!','Rewind!',1.0,'#ffd34d'); break; }
    case 'clone': { const al=G.units.filter(v=>v.team===u.team&&!v.dead&&!v.building&&!v.c.champ&&!v.clone&&v.origTeam===undefined&&v.deploy<=0&&dist(v,u)<=tp.r); if(!al.length){ ok=false; break; }
      for(const v of al.slice(0,8)) cloneUnit(v); fxRing(u.x,u.y,0.3,tp.r,0.6,'#ffd34d'); sfx('power'); feedLog(`${tp.icon} ${who} ${u.c.short||u.c.name} copied ${Math.min(8,al.length)} troops`,team); break; }
    case 'leap': { const t=strongestEnemy(u,tp.range); if(!t){ ok=false; break; } if(tp.giant) makeGiant(u,tp.giant); const d=dist(u,t)||1, off=t.radius+u.radius; u.leap={t:0,dur:0.75,fx:u.x,fy:u.y,tx:t.x+(u.x-t.x)/d*off,ty:t.y+(u.y-t.y)/d*off,h:3,tapLeap:{r:2,dmg:200,stun:1}}; break; }
    case 'firebreak': { const fx=Math.sin(u.yaw), fy=Math.cos(u.yaw), cx=u.x+fx*2.2, cy=u.y+fy*2.2;
      for(let i=-2;i<=2;i++){ const bx=clamp(cx+fy*i*1.1,0.8,17.2), by=clamp(cy-fx*i*1.1,0.8,31.2); const cl={team,x:bx,y:by,r:0.9,dps:70,t:6,max:6,slow:0.5,towerPct:0,col:'#ff7a1a',tick:0,burn:[40,2]}; G.clouds.push(cl); fxDecal(bx,by,0.9,'#3a1a0a',6,0.45); fxBurst(bx,0.4,by,10,'#ff7a1a',3,0.3,0.6,2,true); }
      themeFlames(cx,cy,fx,fy); sfx('boom'); break; }
    case 'taunt': { const en=G.units.filter(e=>e.team!==u.team&&!e.dead&&!e.building&&dist(e,u)<=tp.r); u.taunt=tp.r; u.tauntT=tp.dur; u.shield=Math.max(u.shield,tp.shield||0);
      for(const e of en) if(canHit(e,u)) e.target=u; for(const v of G.units) if(v.team===u.team&&!v.dead&&!v.building&&dist(v,u)<=tp.r+1) v.rush=Math.max(v.rush,tp.dur);
      fxRing(u.x,u.y,0.3,tp.r,0.6,'#ff6bff'); for(let i=0;i<20;i++){ const a=Math.random()*TAU; PSA.spawn(u.x+Math.cos(a)*1.2,1.5,u.y+Math.sin(a)*1.2,Math.cos(a),1.5,Math.sin(a),1,0.3,'#ffd34d',1,0); } sfx('power'); break; }
    case 'decoy': { const foeK=G.towers.find(tw=>tw.team!==team&&!tw.dead); const dir=team===0?-1:1; const dx=clamp(u.x,1,17), dy=clamp(u.y+dir*(tp.dist||3),1,31); const ny=(dy>14.8&&dy<17.2)?(dir<0?14.6:17.4):dy;
      const d=spawnUnit(tp.card,team,dx,ny,0.3); d.taunt=tp.taunt||5; for(const e of G.units) if(e.team!==team&&!e.dead&&!e.building&&dist(e,d)<=d.taunt&&canHit(e,d)) e.target=d;
      if(tp.ally&&tp.ally.rush) for(const v of G.units) if(v.team===team&&!v.dead&&!v.building&&dist(v,u)<=5) v.rush=Math.max(v.rush,tp.ally.rush);
      fxRing(dx,ny,0.3,d.taunt,0.6,'#ffd34d'); sfx('pop'); break; }
    case 'spawn': { const n=tp.n; for(let i=0;i<n;i++){ const a=i/n*TAU; let sx=clamp(u.x+Math.cos(a)*1.1,0.6,17.4), sy=u.y+Math.sin(a)*1.1; if(sy>14.8&&sy<17.2&&!CARDS[tp.card].flying) sy=sy<16?14.6:17.4; spawnUnit(tp.card,team,sx,sy,0.35+i*0.05); }
      fxRing(u.x,u.y,0.3,2,0.5,TEAMC[team].light); fxBurst(u.x,1,u.y,24,'#ffd34d',4,0.25,0.6,4,true); sfx('deploy'); feedLog(`${tp.icon} ${who} ${u.c.short||u.c.name}: ${tp.name}`,team); break; }
    case 'kick': { const dir=team===0?-1:1; const obj=buildFall('kickball',TEAMC[team]); dynRoot.add(obj);
      G.rolls.push({team,x:clamp(u.x,1,17),y:u.y+dir*0.8,dir,traveled:0,len:tp.len,r:tp.r,dmg:tp.dmg,push:tp.push,hit:new Set(),obj,spin:0,burn:tp.burn,towerPct:tp.towerPct,fire:true});
      u.kickT=0.4; sfx('kick'); G.shake=Math.max(G.shake,0.15); fxBurst(u.x,0.5,u.y+dir*0.8,20,'#ff7a1a',4,0.25,0.5,4,true); break; }
    case 'bounce': { const t=strongestEnemy(u,tp.range); if(!t){ ok=false; break; }
      const tx=clamp(t.x+rnd(-1.5,1.5),1.2,16.8), ty=t.team===1?rnd(1.2,3.4):rnd(28.6,30.8);
      t.leap={t:0,dur:1.15,fx:t.x,fy:t.y,tx,ty,h:7,flung:{dmg:tp.dmg,stun:tp.stun||1.2,team}}; t.target=null; t.charging=false; t.kvx=t.kvy=0;
      damage(t,tp.dmg*0.5,u); u.atk=0.001; u.yaw=Math.atan2(t.x-u.x,t.y-u.y); u.landT=0.3;
      fxRing(t.x,t.y,0.3,1.8,0.4,'#ffd34d'); fxBurst(t.x,0.8,t.y,24,'#ffffff',6,0.25,0.5,6,true); G.shake=Math.max(G.shake,0.35); G.slowT=Math.max(G.slowT,0.25); sfx('boom');
      callout(t,'BOING!','#ffd34d',true); feedLog(`${tp.icon} ${who} ${u.c.short||u.c.name} bounced ${t.c.short||t.c.name} to the back row`,team); break; }
    case 'zapN': { const list=G.units.filter(e=>e.team!==u.team&&!e.dead&&!e.building&&!hidden(e)&&e.deploy<=0&&dist(e,u)<=tp.range).sort((a,b)=>zapScore(b)-zapScore(a)).slice(0,tp.n); if(!list.length){ ok=false; break; }
      for(const e of list){ e.stun=Math.max(e.stun,tp.stun); if(tp.sleep) e.sleepT=tp.stun; G.beams.push({x1:u.x,y1:u.y,x2:e.x,y2:e.y,h:1,h2:0.8,col:'#9fe6ff',life:0.3,max:0.3,w:2}); callout(e,'💤','#ffffff'); } sfx('zap'); break; }
  }
  if(!ok){ return 'notarget'; }
  G.elixir[team]-=tp.cost; G.tapCd[team]=tp.cd; u.atk=0.001;
  callout(u,tp.icon+' '+tp.name.toUpperCase(),team===0?'#bfe0ff':'#ffc2c0',true);
  if(!['takeover','saturn','override','clear','charm','spawn','clone'].includes(tp.k)) feedLog(`${tp.icon} ${who} ${u.c.short||u.c.name}: ${tp.name}`,team);
  return 'ok';
}
function aiTap(team){
  const st=tapState(team); if(!st||!st.ready) return false;
  const {u,tp}=st; const foe=1-team;
  const near=r=>G.units.filter(e=>e.team===foe&&!e.dead&&!e.building&&!hidden(e)&&dist(e,u)<=r);
  let want=false;
  switch(tp.k){
    case 'execute': { const t=strongestEnemy(u,tp.range); want=!!t&&t.c.cost>=3; break; }
    case 'takeover': { const t=strongestEnemy(u,tp.range,e=>!e.c.champ); want=!!t&&t.c.cost>=4; break; }
    case 'saturn': want=G.elixir[team]>=4; break;
    case 'override': want=G.units.filter(m=>m.team===team&&!m.dead&&!m.building&&G.towers.some(tw=>tw.team===foe&&!tw.dead&&dist(tw,m)<7)).length>=2; break;
    case 'rampage': want=!!(u.target&&!u.target.isTower&&u.inRange)||u.hp<u.maxHp*0.5; break;
    case 'clear': want=G.graveyard[team].length>=2&&near(4).length>0; break;
    case 'aoe': { const en=near(tp.r), al=G.units.filter(v=>v.team===team&&!v.dead&&!v.building&&v!==u&&dist(v,u)<=tp.r); let v=0; en.forEach(e=>v+=unitValue(e));
      if(tp.needAllies) want=al.length>=2&&(en.length>0||al.some(a=>a.hp<a.maxHp*0.6)); else want=(en.length>=2&&v>=3)||v>=4||(en.length>=1&&u.hp<u.maxHp*0.45); break; }
    case 'clone': want=G.units.filter(v=>v.team===team&&!v.dead&&!v.building&&!v.c.champ&&!v.clone&&dist(v,u)<=tp.r).length>=2; break;
    case 'leap': { const t=strongestEnemy(u,tp.range); want=!!t&&t.c.cost>=3; break; }
    case 'firebreak': case 'decoy': want=near(4.5).length>=2; break;
    case 'taunt': want=near(tp.r).length>=2&&G.units.some(v=>v.team===team&&!v.dead&&!v.building&&v!==u&&dist(v,u)<5); break;
    case 'spawn': want=near(5).length>=1||(G.units.filter(v=>v.team===team&&!v.dead).length>=2&&(team===1?u.y>14:u.y<18)); break;
    case 'kick': { const dir=team===0?-1:1; const lane=G.units.filter(e=>e.team===foe&&!e.dead&&!e.flying&&!e.building&&Math.abs(e.x-u.x)<1.6&&(e.y-u.y)*dir>0&&Math.abs(e.y-u.y)<tp.len).length; const tw=G.towers.some(t=>t.team===foe&&!t.dead&&Math.abs(t.x-u.x)<t.radius+0.8&&(t.y-u.y)*dir>0&&Math.abs(t.y-u.y)<tp.len);
      want=lane>=2||(tw&&G.elixir[team]>=3); break; }
    case 'zapN': { const n=near(tp.range); let v=0; n.forEach(e=>v+=e.c.cost); want=v>=5; break; }
    case 'bounce': { const t=strongestEnemy(u,tp.range); want=!!t&&(t.c.cost>=3||(t.target&&t.target.isTower)); break; }
    case 'cannon': { const fx=Math.sin(u.yaw), fy=Math.cos(u.yaw); want=near(tp.range).filter(e=>((e.x-u.x)*fx+(e.y-u.y)*fy)/Math.max(0.01,dist(e,u))>0.45).length>=2; break; }
    default: { const n=near(tp.r+0.5); let v=0; n.forEach(e=>v+=unitValue(e)); want=(n.length>=2&&v>=3)||v>=4||(n.length>=1&&u.hp<u.maxHp*0.4); }
  }
  if(want) return useTap(team)==='ok';
  return false;
}
function themeFlames(cx,cy,fx,fy){ for(let i=0;i<40;i++){ const k=rnd(-2.6,2.6); PSA.spawn(cx+fy*k,0.2,cy-fx*k,0,rnd(2,4),0,rnd(0.5,0.9),rnd(0.4,0.7),Math.random()<0.5?'#ff7a1a':'#ffd34d',1,-1); } }
function updateBoom(b,dt){
  const step=9*dt;
  if(b.out){ b.x+=b.dx*step; b.y+=b.dy*step; b.d+=step; if(b.d>=b.max){ b.out=false; b.hit=new Set(); } }
  else { const tx=b.src.dead?b.x-b.dx:b.src.x, ty=b.src.dead?b.y-b.dy:b.src.y; const dx=tx-b.x, dy=ty-b.y, L=Math.hypot(dx,dy); if(L<0.4||b.src.dead&&b.d<=0){ b.done=true; return; } b.x+=dx/L*step; b.y+=dy/L*step; b.d-=step; if(b.d<-3) b.done=true; }
  b.spin+=dt*16;
  const u=b.src;
  for(const e of G.units){ if(e.team===b.team||e.dead||hidden(e)||b.hit.has(e.uid)) continue; if(Math.hypot(e.x-b.x,e.y-b.y)<0.6+e.radius){ b.hit.add(e.uid); damage(e,u.dmg*baseMul(u),u); fxBurst(e.x,0.8,e.y,6,'#f2b24a',2.5,0.15,0.3,6); sfx('hit'); } }
  for(const t of G.towers){ if(t.team===b.team||t.dead||b.hit.has('t'+t.kind+t.x)) continue; if(Math.hypot(t.x-b.x,t.y-b.y)<t.radius+0.4){ b.hit.add('t'+t.kind+t.x); damage(t,u.dmg*baseMul(u),u); } }
}

// ---------------------------------------------------------------- 3D sync & animation
const VS=1.5; // visual scale of troops relative to their collision size
const lerpAng=(a,b,k)=>{ let d=((b-a+PI)%TAU+TAU)%TAU-PI; return a+d*k; };
let iceMesh=null;
// Animation curves: every attack has a wind-up (driven by the attack cooldown, so it
// happens BEFORE the hit lands), a fast strike, and an eased recovery.
const eo=k=>1-Math.pow(1-clamp(k,0,1),3), lerp=(a,b,k)=>a+(b-a)*k;
function atkPhase(u){
  const p=u.atk, W=(p<=0&&u.inRange&&!u.moving&&u.hs>=0.5&&u.cd>0&&u.cd<0.32)?1-u.cd/0.32:0;
  return {p,W,active:p>0,S:p>0?Math.min(1,p/0.2):0,Rc:p>=0.2?(p-0.2)/0.8:0};
}
function syncUnits(dt){
  const t=G.t;
  for(const u of G.units){
    if(!u.obj){ u.obj=getModel(u.c.model,u.team); u.rig=u.obj.userData.rig; dynRoot.add(u.obj); u.shadow=shadowFor(u.baseR*1.25); u.ring=new THREE.Mesh(geo('ring'),mat(TEAMC[u.team].main,{basic:1,op:0.55})); u.ring.rotation.x=-PI/2; u.ring.renderOrder=1; dynRoot.add(u.ring); u.ringTeam=u.team; u.baseYaw=null; u.bank=0; u.prevYawF=u.yaw; }
    const R=u.rig, o=u.obj;
    const enemyHidden = hidden(u) && u.team===1;
    o.visible=!enemyHidden; u.shadow.visible=!enemyHidden; u.ring.visible=!enemyHidden && !u.building;
    if(u.ringTeam!==u.team){ u.ring.material=mat(TEAMC[u.team].main,{basic:1,op:0.55}); u.ringTeam=u.team; }
    if(hidden(u)&&u.team===0&&Math.random()<dt*10) PSN.spawn(u.x+rnd(-0.3,0.3),rnd(0.2,1.2),u.y+rnd(-0.3,0.3),0,0.6,0,0.6,0.35,'#b8b8d8',0.45,0,1,1);
    let y=0;
    if(u.deploy>0){ const k=u.deploy/u.deployMax; y+=Math.pow(k,2)*(u.parachute?9:7); }
    if(u.flying) y+=1.5+Math.sin(t*3+u.uid)*0.12;
    if(u.leapH) y+=u.leapH;
    if(u.floatT>0) y+=Math.min(1.4,(3-u.floatT)*2+0.3)+Math.sin(t*4+u.uid)*0.1;
    const swimming=u.c.swim&&!u.flying&&u.y>15.1&&u.y<16.9&&u.deploy<=0;
    if(swimming){ y-=0.42; if(u.moving&&Math.random()<dt*14) PSN.spawn(u.x+rnd(-0.3,0.3),-0.05,u.y+rnd(-0.3,0.3),rnd(-0.6,0.6),rnd(0.8,1.6),rnd(-0.6,0.6),0.5,0.22,'#dff6ff',0.8,5); }
    // hit recoil: knocked back along the direction of the blow
    let ox=0, oz=0; const hk=u.hitT>0?u.hitT/0.14:0;
    if(hk>0&&u.hdx!==undefined&&!u.building){ ox=u.hdx*0.12*hk; oz=u.hdy*0.12*hk; }
    o.position.set(u.x+ox,y,u.y+oz);
    // turning: smooth yaw and remember the turn rate for banking
    const prev=u.yawVis; u.yawVis=lerpAng(u.yawVis,u.yaw,Math.min(1,dt*9));
    const turn=dt>0?(((u.yawVis-prev+PI)%TAU+TAU)%TAU-PI)/dt:0; u.bank+=(clamp(-turn*0.12,-0.55,0.55)-u.bank)*Math.min(1,dt*6);
    o.rotation.y=u.building?0:u.yawVis;
    if(u.floatT>0){ o.rotation.z=Math.sin(t*2+u.uid)*0.6; o.rotation.x=Math.cos(t*1.7+u.uid)*0.4; } else { o.rotation.z=0; o.rotation.x=0; }
    let sx=u.scale, sy=u.scale;
    if(u.danceT>0){ o.rotation.y+=Math.sin(t*14+u.uid)*0.6; sy*=1+Math.sin(t*20)*0.06; }
    if(u.singT>0){ o.rotation.z=Math.sin(t*6+u.uid)*0.12; sy*=1+Math.sin(t*12)*0.05; if(Math.random()<dt*5) PSA.spawn(u.x+rnd(-0.2,0.2),y+1.6*u.scale,u.y,rnd(-0.5,0.5),1.6,0,0.9,0.3,['#ff3dce','#ffd34d','#3dd6ff'][(Math.random()*3)|0],1,0); }
    if((u.drunkT>0||u.c.tipsy)&&!u.flying&&!(u.slipT>0)){ o.rotation.z+=Math.sin(t*2.6+u.uid)*(u.drunkT>0?0.2:0.12); if(u.drunkT>0&&Math.random()<dt*3) PSN.spawn(u.x+rnd(-0.2,0.2),y+1.5*u.scale,u.y,0,0.7,0,0.8,0.22,'#fff4c0',0.7,0,1,1); }
    if(u.slipT>0&&!u.flying){ o.rotation.x=-1.3; o.position.y=y+0.18; }
    if(u.leap&&u.leap.flung){ const k=Math.min(1,u.leap.t/u.leap.dur); o.rotation.x=k*TAU*1.5; o.rotation.z=Math.sin(k*PI)*0.6; }
    if(u.deploy>0){ const k=u.deploy/u.deployMax; if(k<0.25){ sy*=1+0.12*(k/0.25); sx*=1-0.06*(k/0.25); } }
    if(u.landT>0){ const k=u.landT/0.3; const b=Math.sin(k*PI); sy*=1-0.32*k+0.12*b*(1-k); sx*=1+0.22*k; }
    if(hk>0){ sy*=1-0.12*hk; sx*=1+0.09*hk; }
    if(u.c.model.shake){ o.position.x+=Math.sin(t*60)*0.015; }
    o.scale.set(sx*VS,sy*VS,sx*VS);
    u.shadow.position.set(u.x,0.03,u.y); const ss=u.baseR*1.25*VS*u.scale*(u.flying||u.leapH||u.deploy>0?0.75:1); u.shadow.scale.set(ss*2,ss*2,1);
    u.ring.position.set(u.x,0.04,u.y); const rs=u.baseR*u.scale*0.95; u.ring.scale.set(rs,rs,1);
    const frozen=u.frozen>0||u.floatT>0;
    const mv=u.moving&&!frozen?1:0, ph=u.walk, A=atkPhase(u), p=A.p;
    const heavy=u.mass>=8&&!u.flying;
    // footsteps: dust (and a thud for the heaviest troops) on every stride
    const stepSign=Math.sign(Math.sin(ph));
    if(mv&&!u.flying&&!swimming&&R.type!=='v'&&R.type!=='b'){ if(u.lastStep!==undefined&&stepSign!==u.lastStep){ const fx=u.x+Math.cos(u.yawVis)*0.12*stepSign, fz=u.y-Math.sin(u.yawVis)*0.12*stepSign;
        PSN.spawn(fx,0.05,fz,rnd(-0.3,0.3),rnd(0.3,0.7),rnd(-0.3,0.3),0.45,heavy?0.4:0.22,'#d8cdb0',0.55,0,1.4,2); if(u.mass>=14){ G.shake=Math.max(G.shake,0.06); fxRing(u.x,u.y,0.2,0.9,0.3,'#e8dcc0'); } } }
    u.lastStep=stepSign;
    if(R.type==='h'){
      if(!frozen){
        const st=Math.sin(ph), stA=Math.abs(st), stride=Math.min(1.2,0.55+u.speed*0.4)*(u.charging?1.25:1);
        R.legs[0].rotation.x=st*0.85*stride*mv; R.legs[1].rotation.x=-st*0.85*stride*mv;
        R.hips.position.y=0.42+stA*0.07*mv;
        R.hips.rotation.y=st*0.12*mv;
        let aL=-st*0.75*mv, aR=st*0.75*mv, zL=0.12, zR=-0.12, twist=-st*0.16*mv, lean=(0.12+((u.rush>0&&u.rush<1e5)||u.charging||u.fearT>0?0.14:0))*mv, lunge=0, rise=0;
        const anim=u.c.anim||'swing';
        const hold=u.inRange&&!u.moving;
        switch(anim){
          case 'swing': if(A.active){ aR=p<0.2?lerp(-2.9,-0.5,eo(A.S)):lerp(-0.5,0,eo(A.Rc)); twist=p<0.2?lerp(0.5,-0.5,eo(A.S)):lerp(-0.5,0,eo(A.Rc)); lean+=p<0.2?lerp(-0.1,0.3,A.S):lerp(0.3,0,A.Rc); lunge=p<0.2?0.22*A.S:0.22*(1-eo(A.Rc)); }
            else if(A.W>0){ aR=lerp(aR,-2.9,eo(A.W)); twist=0.5*eo(A.W); lean-=0.1*A.W; } break;
          case 'slam': if(A.active){ aR=aL=p<0.2?lerp(-3.0,-0.4,eo(A.S)):lerp(-0.4,0,eo(A.Rc)); lean+=p<0.2?lerp(-0.2,0.4,A.S):lerp(0.4,0,A.Rc); rise=p<0.2?lerp(0.06,-0.06,A.S):-0.06*(1-A.Rc); }
            else if(A.W>0){ aR=aL=lerp(aR,-3.0,eo(A.W)); lean-=0.2*A.W; rise=0.06*A.W; } break;
          case 'thrust': if(A.active){ aR=p<0.2?lerp(0.5,-1.65,eo(A.S)):lerp(-1.65,-0.2,eo(A.Rc)); lunge=p<0.2?lerp(-0.1,0.32,eo(A.S)):0.32*(1-eo(A.Rc)); lean+=p<0.2?0.25*A.S:0.25*(1-A.Rc); twist=-0.3*(p<0.2?A.S:1-A.Rc); }
            else if(A.W>0){ aR=lerp(aR,0.5,eo(A.W)); lunge=-0.1*A.W; twist=0.35*A.W; } break;
          case 'throw': if(A.active){ aR=p<0.2?lerp(1.3,-2.3,eo(A.S)):lerp(-2.3,0.1,eo(A.Rc)); twist=p<0.2?lerp(0.55,-0.4,eo(A.S)):lerp(-0.4,0,A.Rc); lean+=p<0.2?0.2*A.S:0.2*(1-A.Rc); }
            else if(A.W>0){ aR=lerp(aR,1.3,eo(A.W)); twist=0.55*eo(A.W); lean-=0.08*A.W; } else if(hold) aR=0.3; break;
          case 'shoot': if(hold||A.active){ const r=A.active?(p<0.15?p/0.15:1-eo((p-0.15)/0.85)):0; aR=-1.5-r*0.45; aL=-1.3; zL=-0.4; lean-=r*0.14; lunge=-r*0.07; } break;
          case 'point': if(hold||A.active){ const r=A.active?Math.sin(Math.min(1,p*2)*PI):0; aR=-1.5-r*0.3; lunge=r*0.06; lean+=r*0.08; if(A.W>0) aR=-1.5+0.4*A.W; } break;
          case 'type': if(hold||A.active){ aR=aL=-1.0+Math.sin(t*20)*0.08; } break;
          case 'cast': if(hold||A.active){ const r=A.active?Math.sin(Math.min(1,p*2.2)*PI):0; aR=aL=-2.6+Math.sin(t*6)*0.1+r*1.1; zR=-0.3-r*0.3; zL=0.3+r*0.3; lean+=r*0.15; rise=r*0.05; } break;
          case 'strum': if(hold||A.active){ aL=-1.2; aR=-0.6+Math.sin(t*22)*0.35; lean-=0.08; twist=Math.sin(t*4)*0.12; } break;
          case 'drum': if(hold||A.active){ aR=-1.2+Math.sin(t*18)*0.6; aL=-1.2-Math.sin(t*18)*0.6; } break;
          case 'zombie': aR=aL=-1.45+Math.sin(t*3)*0.08; twist=Math.sin(t*1.5+u.uid)*0.15; if(A.active){ aR=aL=-1.45-Math.sin(p*PI)*0.8; lunge=Math.sin(p*PI)*0.15; } break;
          case 'kick': if(A.active||u.kickT>0){ const kp=A.active?p:1-u.kickT/0.4; R.legs[1].rotation.x=kp<0.2?lerp(0.9,-1.7,eo(kp/0.2)):lerp(-1.7,0,eo((kp-0.2)/0.8)); aL=-0.9; aR=0.7; lean-=0.15; twist=-0.25; }
            else if(A.W>0){ R.legs[1].rotation.x=0.9*eo(A.W); aL=-0.5*A.W; } break;
          case 'belly': if(A.active){ const k=p<0.2?eo(A.S):1-eo(A.Rc); lean-=0.35*k; lunge=0.38*k; aR=aL=0.35*k; zR=-0.9*k-0.12; zL=0.9*k+0.12; rise=0.05*k; }
            else if(A.W>0){ lean+=0.15*eo(A.W); lunge=-0.1*A.W; aR=aL=-0.3*A.W; } break;
          case 'spin': if(A.active){ R.root.rotation.y=eo(p)*TAU; aR=aL=-1.4; zR=-1.3; zL=1.3; rise=Math.sin(p*PI)*0.08; } else R.root.rotation.y=0; break;
        }
        if(u.kickT>0) u.kickT-=dt;
        if(R.wingsH) R.wingsH.forEach((w,i)=>{ w.rotation.y=(i?1:-1)*(0.3+Math.sin(t*(u.flying?16:10)+u.uid)*0.55); });
        if(R.handInCoat&&!A.active&&!(u.fearT>0)){ aL=-1.35; zL=-0.75; }
        if(u.fearT>0){ aR=aL=-2.9+Math.sin(t*20)*0.15; zR=-0.4; zL=0.4; }
        if(u.execBusy>0){ aR=-2.8+Math.sin(t*8)*0.1; }
        const look=(!mv&&u.target&&!u.target.dead)?clamp(((Math.atan2(u.target.x-u.x,u.target.y-u.y)-u.yawVis+PI)%TAU+TAU)%TAU-PI,-0.7,0.7):0;
        R.armL.rotation.x=aL; R.armR.rotation.x=aR; R.armL.rotation.z=zL; R.armR.rotation.z=zR;
        R.torso.rotation.set(lean-0.3*hk,twist,u.stun>0?Math.sin(t*7+u.uid)*0.14:0);
        R.torso.scale.y=1+Math.sin(t*2.6+u.uid)*0.025*(1-mv);
        R.head.rotation.set(-0.08*mv+Math.sin(t*2+u.uid)*0.03+(u.stun>0?Math.sin(t*5)*0.2:0),look*0.6,0);
        R.root.position.set(0,rise,lunge); if(anim!=='spin') R.root.rotation.set(0,0,Math.sin(t*1.3+u.uid)*0.025*(1-mv));
        if(R.blackCap) R.blackCap.visible=u.capT>0;
        if(R.cape) R.cape.rotation.x=0.15+mv*0.45+Math.sin(t*(mv?12:5)+u.uid)*0.08;
        if(R.jet&&(u.flying||u.moving)&&Math.random()<0.6){ const bx=u.x-Math.sin(u.yawVis)*0.3, bz=u.y-Math.cos(u.yawVis)*0.3; PSA.spawn(bx,y+0.45*u.scale,bz,0,-2,0,0.25,0.25,'#ffb02e',1,0); }
        if(u.c.model.flames&&Math.random()<dt*30) PSA.spawn(u.x+rnd(-0.3,0.3),y+rnd(0.5,1.6)*u.scale,u.y+rnd(-0.3,0.3),0,rnd(1.5,3),0,0.4,0.35,Math.random()<0.5?'#ff7a1a':'#ffd34d',1,-1);
        if(u.flying){ o.rotation.z=u.bank*0.6; o.rotation.x=mv*0.35; }
      }
    } else if(R.type==='q'){
      if(!frozen){
        const gal=u.charging?1.7:1, s=Math.sin(ph*gal)*0.85*mv, s2=Math.sin(ph*gal*2);
        R.legs[0].rotation.x=s; R.legs[3].rotation.x=s; R.legs[1].rotation.x=-s; R.legs[2].rotation.x=-s;
        if(R.legs.length>4) for(let i=4;i<R.legs.length;i++) R.legs[i].rotation.x=Math.sin(ph*2+i)*0.4*mv;
        let pitch=s2*0.07*mv+(u.charging?0.14:0), lunge=0, hz=0, jaw=0.05;
        if(A.active){ const k=p<0.2?eo(A.S):1-eo(A.Rc); hz=0.15*k; jaw=0.05+0.8*k; pitch+=0.18*k; lunge=0.18*k; }
        else if(A.W>0){ hz=-0.07*A.W; pitch-=0.12*A.W; jaw=0.05+0.3*A.W; }
        R.body.position.y=(u.c.model.legLen??0.22)+0.2+Math.abs(Math.sin(ph*gal))*0.05*mv;
        if(!u.c.model.kangaroo) R.body.rotation.x=pitch-0.25*hk;
        R.root.position.z=lunge; R.root.rotation.z=u.bank*0.4;
        R.tail.rotation.y=Math.sin(t*(u.charging?22:mv?12:6)+u.uid)*0.55;
        R.head.rotation.x=-s2*0.08*mv+(u.stun>0?Math.sin(t*5)*0.25:0);
        if(u.c.anim==='stretch'){
          if(R.baseFront==null){ R.baseFront=R.front.position.z; R.baseBodyZ=R.bodyMesh.scale.z; }
          const st = p>0 ? Math.sin(p*PI)*Math.max(0,(u.stretch||1.5)-0.8)/(u.c.model.size||1) : 0;
          R.front.position.z=R.baseFront+st; R.bodyMesh.scale.z=R.baseBodyZ+st*0.5; R.bodyMesh.position.z=st*0.5;
        }
        R.head.position.z=0.12+hz; R.jaw.rotation.x=jaw;
        if(R.trunk) R.trunk.rotation.x=Math.sin(t*2+u.uid)*0.15-(A.active?0.8*Math.sin(p*PI):0);
        if(u.charging&&Math.random()<0.6) PSN.spawn(u.x,0.1,u.y,rnd(-0.5,0.5),0.5,rnd(-0.5,0.5),0.4,0.3,'#e0d4b8',0.6,0,1,2);
        if(u.enraged&&Math.random()<0.3) PSN.spawn(u.x,0.9*u.scale,u.y,0,1,0,0.5,0.25,'#ffffff',0.6,0,1.5,1);
      }
    } else if(R.type==='f'){
      if(!frozen){
        const fl=(R.fast?42:(u.c.model.type==='goose'?7:10))*(u.moving?1.15:0.85);
        R.wings.forEach((w,i)=>{ w.rotation.z=(i===0?1:-1)*Math.sin(t*fl+u.uid)*(u.moving?0.75:0.5); });
        R.rotors.forEach(r=>{ const ax=r.userData.axis; if(ax==='x') r.rotation.x+=dt*45; else if(ax==='z') r.rotation.z+=dt*45; else r.rotation.y+=dt*32; });
        let ry=Math.sin(t*3+u.uid)*0.06, rx=u.moving?0.18:0, rz=0;
        if(A.active){ const k=p<0.2?eo(A.S):1-eo(A.Rc); rz=0.3*k; rx+=0.45*k; ry-=0.12*k; if(R.head) R.head.rotation.x=0.5*k; }
        else if(A.W>0){ ry+=0.15*A.W; rx-=0.2*A.W; if(R.head) R.head.rotation.x=-0.2*A.W; }
        R.root.position.set(0,ry,rz); R.root.rotation.set(rx,0,u.bank);
        if(R.tailW) R.tailW.rotation.x=Math.sin(t*2+u.uid)*0.3;
      }
    } else if(R.type==='B'){
      if(!frozen){ const b=u.moving?Math.abs(Math.sin(ph*0.8)):0; let syb=1-0.14*(1-b)*mv, sxb=1+(1-b)*0.1*mv, zb=0;
        if(A.active){ const k=p<0.2?eo(A.S):1-eo(A.Rc); syb*=1+0.25*k; sxb*=1-0.1*k; zb=0.25*k; } else if(A.W>0){ syb*=1-0.25*A.W; sxb*=1+0.15*A.W; }
        R.body.scale.set(sxb,syb,sxb); R.body.position.set(0,b*0.14*mv,zb); if(R.lid) R.lid.rotation.x=A.active?-Math.sin(p*PI)*0.6:Math.sin(t*3)*0.05;
        if(R.arms) R.arms.forEach((a,i)=>{ a.rotation.z=Math.sin(t*4+i*0.8)*0.3+(A.active?-Math.sin(p*PI)*0.6:0); }); }
    } else if(R.type==='P'){
      if(!frozen){ R.root.rotation.z=Math.sin(ph*0.9)*0.2*mv; R.root.position.y=Math.abs(Math.sin(ph*0.9))*0.06*mv; R.flips.forEach((f,i)=>{ f.rotation.z=(i?-1:1)*(0.2+(A.active?Math.sin(p*PI)*1.3:A.W*0.8+Math.abs(Math.sin(ph))*0.4*mv)); }); R.feet.forEach((f,i)=>{ f.position.z=0.08+Math.sin(ph*0.9+i*PI)*0.07*mv; }); R.head.rotation.x=A.active?Math.sin(p*PI)*0.7:-0.2*A.W; R.body.rotation.x=A.active?0.3*Math.sin(p*PI):0; }
    } else if(R.type==='v'){
      for(const w of R.wheels) w.rotation.x+=(u.moving?dt*u.speed*8*(u.charging?1.8:1):0);
      let z=0; if(A.active){ z=p<0.2?lerp(-0.3,0.5,eo(A.S)):0.5*(1-eo(A.Rc)); } else if(A.W>0) z=-0.3*eo(A.W);
      R.root.position.set(0,u.moving?Math.abs(Math.sin(t*14))*0.03:0,z);
      R.root.rotation.set(u.charging?-0.06:(A.active&&p<0.2?0.06:0),0,u.bank*0.25);
      if(R.siren){ const on=Math.floor(t*6)%2; R.siren[0].visible=!!on; R.siren[1].visible=!on; }
      if(R.ladder) R.ladder.rotation.x = A.active ? -Math.sin(p*PI)*0.6 : -A.W*0.25;
      if(R.dish) R.dish.rotation.y+=dt*2;
      if(R.drum) R.drum.rotation.z+=dt*3;
      if(R.drill) R.drill.rotation.z+=dt*(A.active||u.inRange?30:8);
      if(R.turret&&u.target&&!u.target.dead){ R.tYaw=lerpAng(R.tYaw||0,Math.atan2(u.target.x-u.x,u.target.y-u.y)-u.yawVis,Math.min(1,dt*6)); R.turret.rotation.y=R.tYaw; }
      if(u.moving&&Math.random()<(u.charging?0.7:0.3)) PSN.spawn(u.x-Math.sin(u.yawVis)*0.9,0.4,u.y-Math.cos(u.yawVis)*0.9,0,0.8,0,0.6,0.35,'#8a8a8a',0.5,0,1.5,1);
      if(u.charging&&Math.random()<0.5) PSA.spawn(u.x-Math.sin(u.yawVis)*1.1,0.35,u.y-Math.cos(u.yawVis)*1.1,0,0.3,0,0.2,0.3,'#ffb02e',1,0);
    } else if(R.type==='b'){
      if(R.head&&u.target&&!u.target.dead){ R.headYaw=lerpAng(R.headYaw||0,Math.atan2(u.target.x-u.x,u.target.y-u.y),Math.min(1,dt*8)); R.head.rotation.y=R.headYaw; }
      if(R.jaw) R.jaw.rotation.x=A.active?-Math.sin(p*PI)*0.6:-0.15-Math.sin(t*3)*0.05;
      if(R.root) R.root.position.y = A.active ? -Math.sin(p*PI)*0.06 : 0;
      if(R.cap){ const pu=u.spT>(u.c.sp?u.c.sp.cd-0.4:0)&&u.c.sp?1.15:1; R.cap.scale.set(pu,2-pu,pu); }
      if(R.bell&&u.spT>(u.c.sp?u.c.sp.cd-0.6:9)) R.root.position.x=Math.sin(t*60)*0.04; else if(R.bell) R.root.position.x=0;
      if(R.pulse){ const pu=u.spT>(u.c.sp?u.c.sp.cd-0.3:9)?1.1:1+Math.sin(t*8)*0.015; R.root.scale.set(pu,pu,pu); }
      if(R.jets&&u.spT>(u.c.sp?u.c.sp.cd-0.5:9)) for(const s2 of [-1,1]) for(let i=0;i<3;i++) PSA.spawn(u.x+s2*0.45*VS,1.2,u.y,rnd(-0.3,0.3),rnd(6,10),rnd(-0.3,0.3),0.35,0.6,Math.random()<0.5?'#ff7a1a':'#ffd34d',1,0);
      if(R.drip&&Math.random()<dt*20) PSN.spawn(u.x+rnd(-0.5,0.5),2.4,u.y+rnd(-0.5,0.5),0,-4,0,0.5,0.15,'#9fe6ff',0.8,6);
      if(R.smoke&&Math.random()<dt*4) PSN.spawn(u.x,2.6,u.y-0.3,rnd(-0.2,0.2),1,rnd(-0.2,0.2),1.6,0.6,'#9a9a9a',0.5,0,1.6,0.5);
    }
    // status visuals
    const boxed=u.boxT>0&&u.stun>0;
    if((frozen&&u.frozen>0)||boxed){ if(!u.ice){ u.ice=new THREE.Mesh(geo('rbox'),mat('#bfefff',{op:0.5,s:150})); dynRoot.add(u.ice); } u.ice.material=boxed?mat('#ffffff',{op:0.22,s:150}):u.stone?mat('#a8a29a',{op:0.88,s:10}):mat('#bfefff',{op:0.5,s:150}); const hh=(R.height||1.4)*u.scale*VS; u.ice.visible=true; u.ice.position.set(u.x,y+hh*0.5,u.y); u.ice.scale.set(u.baseR*2.4*u.scale*VS,hh*1.1,u.baseR*2.4*u.scale*VS); }
    else if(u.ice) u.ice.visible=false;
    if(u.shield>0){ if(!u.bub){ u.bub=new THREE.Mesh(geo('sph'),mat('#8ff0ff',{op:0.28,s:150})); dynRoot.add(u.bub); } const hh=(R.height||1.4)*u.scale*VS; u.bub.visible=true; u.bub.position.set(u.x,y+hh*0.5,u.y); const bs=Math.max(hh*0.65,u.baseR*1.4*u.scale)*(1+Math.sin(t*6)*0.03); u.bub.scale.set(bs,bs,bs); }
    else if(u.bub) u.bub.visible=false;
    const hh=(R.height||1.4)*u.scale*VS;
    if(u.stun>0&&!frozen&&Math.random()<dt*8) PSA.spawn(u.x+Math.cos(t*8)*0.35,y+hh+0.15,u.y+Math.sin(t*8)*0.35,0,0.2,0,0.4,0.22,'#ffe14d',1,0);
    if(u.convT>0&&Math.random()<dt*5) PSA.spawn(u.x,y+hh+0.1,u.y,rnd(-0.3,0.3),1,0,0.8,0.3,u.convKind==='charm'?'#ff4f9a':'#ffe14d',1,0);
    if(u.rush>0&&u.rush<1e5&&Math.random()<dt*6) PSA.spawn(u.x+rnd(-0.4,0.4),y+rnd(0.2,hh),u.y+rnd(-0.4,0.4),0,1,0,0.4,0.2,'#ff6bff',1,0);
    if((u.fire>0||u.burnT>0)&&Math.random()<dt*18) PSA.spawn(u.x+rnd(-0.3,0.3),y+rnd(0.1,hh*0.8),u.y+rnd(-0.3,0.3),0,rnd(1,2),0,0.4,0.25,u.burnT>0&&u.burnCol?u.burnCol:(Math.random()<0.5?'#ff7a1a':'#ffd34d'),1,0);
    if(u.slowT>0&&Math.random()<dt*4) PSN.spawn(u.x,0.15,u.y,0,0.2,0,0.6,0.3,'#c9b8a0',0.5,0);
    if(u.fearT>0&&Math.random()<dt*6) PSA.spawn(u.x,y+hh+0.2,u.y,rnd(-0.3,0.3),0.8,0,0.5,0.22,'#b07aff',1,0);
    if(u.shrinkT>0&&Math.random()<dt*3) PSA.spawn(u.x,y+hh,u.y,0,0.6,0,0.6,0.2,'#ffd34d',1,0);
    if(u.markT>0&&Math.random()<dt*4) PSA.spawn(u.x,y+hh+0.3,u.y,0,0.3,0,0.5,0.3,'#ffd34d',1,0);
    if(u.charging&&!u.flying&&Math.random()<dt*20){ const bx=u.x-Math.sin(u.yawVis)*0.4, bz=u.y-Math.cos(u.yawVis)*0.4; PSA.spawn(bx+rnd(-0.2,0.2),hh*0.5,bz+rnd(-0.2,0.2),-Math.sin(u.yawVis)*3,0,-Math.cos(u.yawVis)*3,0.2,0.25,'#ffffff',0.6,0); }
  }
  // dying units: flung away from the blow, tumble, bounce, then poof
  for(const d of G.dying){ const u=d.u; if(!u.obj){ d.done=true; continue; }
    if(d.t===0){ const a=Math.atan2(u.hdx||rnd(-1,1),u.hdy||rnd(-1,1)), f=u.building?0:clamp(3.5*Math.min(1,6/u.mass),0.6,4);
      d.vx=Math.sin(a)*f; d.vz=Math.cos(a)*f; d.vy=u.building?0:(u.flying?1:3+f*0.6); d.y=u.obj.position.y; d.spin=(Math.random()<0.5?-1:1)*rnd(6,12); d.dur=u.building?0.6:(u.flying?0.75:0.65); }
    d.t+=dt; const k=Math.min(1,d.t/d.dur);
    if(u.building){ u.obj.scale.set(VS*u.scale*(1+k*0.15),VS*u.scale*(1-k),VS*u.scale*(1+k*0.15)); if(Math.random()<0.6) PSN.spawn(u.x+rnd(-0.7,0.7),rnd(0,1),u.y+rnd(-0.7,0.7),rnd(-1,1),rnd(1,3),rnd(-1,1),0.8,0.5,'#b8b0a0',0.7,6,1,1); }
    else { d.vy-=(u.flying?9:20)*dt; d.y+=d.vy*dt; if(d.y<0){ d.y=0; d.vy*=-0.35; d.vx*=0.55; d.vz*=0.55; if(Math.abs(d.vy)>0.8) fxPuff(u.obj.position.x,0.1,u.obj.position.z,3,'#d8cdb0',0.3,0.3); }
      u.obj.position.x+=d.vx*dt; u.obj.position.z+=d.vz*dt; u.obj.position.y=d.y;
      u.obj.rotation.x+=d.spin*dt*0.6; u.obj.rotation.z+=d.spin*dt*0.35; const sh=k>0.7?1-(k-0.7)/0.3:1; u.obj.scale.setScalar(VS*u.scale*Math.max(0.05,sh)); }
    u.shadow.position.set(u.obj.position.x,0.03,u.obj.position.z);
    if(k>=1){ d.done=true; dynRoot.remove(u.obj); dynRoot.remove(u.shadow); dynRoot.remove(u.ring); if(u.ice) dynRoot.remove(u.ice); if(u.bub) dynRoot.remove(u.bub);
      const px=u.obj.position.x, pz=u.obj.position.z, py=Math.max(0.4,u.obj.position.y);
      fxPuff(px,py,pz,8,'#f2f2f2',0.55,0.5); fxBurst(px,py,pz,10,TEAMC[u.team].light,3,0.15,0.5,6,true);
      PSN.spawn(px,py+0.4,pz,0,1.6,0,1.1,0.7,'#ffffff',0.6,0,0.5,0.5); } }
  G.dying=G.dying.filter(d=>!d.done);
}
function syncWorld(dt){
  const t=G.t;
  for(const n of G.nums) n.t+=dt; G.nums=G.nums.filter(n=>n.t<0.9);
  for(const d of G.debris){ d.t+=dt; d.vy-=22*dt; d.m.position.x+=d.vx*dt; d.m.position.y+=d.vy*dt; d.m.position.z+=d.vz*dt; d.m.rotation.x+=d.rx*dt; d.m.rotation.z+=d.rz*dt;
    if(d.m.position.y<d.s0*0.5){ d.m.position.y=d.s0*0.5; d.vy*=-0.3; d.vx*=0.6; d.vz*=0.6; d.rx*=0.6; d.rz*=0.6; if(Math.abs(d.vy)>2) fxPuff(d.m.position.x,0.1,d.m.position.z,2,'#c8c0b0',0.4,0.4); }
    if(d.t>2.6) d.m.scale.setScalar(d.s0*Math.max(0,1-(d.t-2.6)/0.6)); if(d.t>3.2){ dynRoot.remove(d.m); d.done=true; } }
  G.debris=G.debris.filter(d=>!d.done);
  for(const tw of G.towers){
    const R=tw.rig;
    if(tw.dead){ R.main.visible=false; R.defender.visible=false; if(R.cannon) R.cannon.visible=false; R.rubble.visible=true; tw.shadow.visible=false; continue; }
    const d=R.defender, dr=d.userData.rig;
    tw.yawVis=lerpAng(tw.yawVis??tw.yaw,tw.yaw,Math.min(1,dt*6));
    if(tw.kind==='king'){
      d.rotation.y = tw.active ? tw.yawVis : (tw.team?0:PI);
      if(dr.type==='h'){ dr.head.rotation.x = tw.active?0:0.45; dr.torso.rotation.x = tw.active?0:0.15; dr.armR.rotation.x = tw.active ? -1.0 : 0.1;
        if(tw.throwT>0){ const p=1-tw.throwT/0.45; dr.armR.rotation.x=p<0.35?lerp(-0.3,-3.0,eo(p/0.35)):lerp(-3.0,-0.6,eo((p-0.35)/0.65)); dr.torso.rotation.x=p<0.35?-0.15*p/0.35:0.25*(1-p); } }
      if(tw.throwT>0){ tw.throwT-=dt; d.rotation.y=tw.yawVis; }
      if(dr.type==='q'){ dr.head.rotation.x = tw.active?0:0.4; dr.tail.rotation.y=Math.sin(t*8)*0.5; }
      R.cannon.rotation.y=tw.yawVis; R.cannon.position.z=0.9*Math.cos(tw.yawVis); R.cannon.position.x=0.9*Math.sin(tw.yawVis);
      R.cannon.children[0].position.z = 0.35-(tw.atk>0?tw.atk*0.6:0);
    } else {
      d.rotation.y=tw.yawVis;
      if(dr.type==='h'){ const p=tw.atk>0?1-tw.atk/0.3:0; dr.armR.rotation.x = tw.atk>0 ? (p<0.4?0.8:-2.4+p*1.5) : -0.2+Math.sin(t*2+tw.x)*0.05; dr.torso.scale.y=1+Math.sin(t*2.5+tw.x)*0.02; }
      if(dr.type==='q'){ dr.head.position.z = 0.12+(tw.atk>0?0.08:0); dr.tail.rotation.y=Math.sin(t*9+tw.x)*0.5; }
    }
    const sq = tw.hitT>0 ? 1+tw.hitT*0.25 : 1; R.main.scale.set(sq,2-sq,sq);
    R.banners.forEach((b,i)=>waveBanner(b,t,tw.x+i*1.7,0.06)); R.flags.forEach((f,i)=>waveBanner(f,t*1.6,tw.x+i,0.1));
    if(tw.frozen>0||tw.hackT>0){ if(!tw.ice){ tw.ice=new THREE.Mesh(geo('rbox'),mat(tw.hackT>0?'#39ff6a':'#bfefff',{op:0.35,s:150})); dynRoot.add(tw.ice); } tw.ice.material=mat(tw.hackT>0?'#39ff6a':tw.stone?'#a8a29a':'#bfefff',{op:tw.stone&&!(tw.hackT>0)?0.7:0.35,s:150}); tw.ice.visible=true; const W=tw.kind==='king'?3.4:2.5; tw.ice.position.set(tw.x,2,tw.y); tw.ice.scale.set(W,4.2,W); }
    else if(tw.ice) tw.ice.visible=false;
  }
  for(const p of G.projs){
    if(!p.obj){ p.obj=buildProj(p.key,TEAMC[p.team]); if(p.big) p.obj.scale.setScalar(2.4); dynRoot.add(p.obj); }
    p.obj.position.set(p.x,p.z,p.y); p.obj.rotation.y=p.dir||0;
    const pj=PROJ[p.key]; if(pj&&pj[4]) PSA.spawn(p.x,p.z,p.y,0,0,0,0.06,(p.big?1.4:0.7)*pj[2]*4,pj[3]||pj[1],0.7,0);
    const shp=(PROJ[p.key]||[])[0]; if(['gavel','star','cake','pick','coin','knife','tnt','goldbar','egg'].includes(shp)) p.obj.rotation.x+=dt*14;
    if(p.lob && shp!=='cake') {}
  }
  for(const r of G.rolls){ r.obj.position.set(r.x,0.9,r.y); r.obj.rotation.x=r.dir*-r.spin; }
  for(const b of G.booms){ if(!b.obj){ b.obj=buildProj(b.proj,TEAMC[b.team]); b.obj.scale.setScalar(1.6); dynRoot.add(b.obj); } b.obj.position.set(b.x,0.9,b.y); b.obj.rotation.y=b.spin; }
  for(const s of G.spells){ if(!s.obj) continue; const k=1-s.t/s.max;
    if(s.from){ const f=s.from, kk=clamp(k,0,1); s.obj.position.set(f.x+(s.x-f.x)*kk, Math.max(0.2,f.h*(1-kk)+0.3*kk+Math.sin(kk*PI)*(2.5+f.d*0.22)), f.y+(s.y-f.y)*kk);
      s.obj.rotation.x+=dt*(s.s.fall==='drone'?0:7); s.obj.rotation.z+=dt*2; if(s.s.fall==='fireball'||s.s.fall==='pan') PSA.spawn(s.obj.position.x,s.obj.position.y,s.obj.position.z,rnd(-1,1),rnd(0.5,1.5),rnd(-1,1),0.35,0.7,'#ff8a1f',1,0);
      else if(s.col&&Math.random()<0.8) PSA.spawn(s.obj.position.x,s.obj.position.y,s.obj.position.z,0,0,0,0.25,0.35,s.col,0.9,0); continue; }
    const h=(s.mini?7:12)*(1-k*k);
    s.obj.position.set(s.x+(s.mini?0:3)*(1-k), Math.max(0.2,h), s.y-(s.mini?0:3)*(1-k)); s.obj.rotation.y+=dt*(s.s.fall==='drone'?1:3); if(s.s.fall==='rock'||s.s.fall==='fireball') { PSA.spawn(s.obj.position.x,s.obj.position.y,s.obj.position.z,rnd(-1,1),rnd(1,2),rnd(-1,1),0.4,0.8,'#ff8a1f',1,0); }
    if(s.s.fall==='gavel'){ s.obj.rotation.y=0; s.obj.rotation.x=-(1-k)*1.2; }
    if(s.s.fall==='rocketBig'){ s.obj.rotation.set(0,0,0); s.obj.position.set(s.x,0.4+16*(1-k),s.y); PSA.spawn(s.x+rnd(-0.3,0.3),s.obj.position.y+2.8,s.y+rnd(-0.3,0.3),rnd(-1,1),rnd(2,4),rnd(-1,1),0.5,1.0,'#ffb02e',1,0); PSN.spawn(s.x,s.obj.position.y+3.2,s.y,rnd(-0.5,0.5),1,rnd(-0.5,0.5),1.2,1.2,'#bbbbbb',0.5,0,1.5,1); } }
  for(const o of G.orbs){
    if(!o.obj){ o.obj=new THREE.Group(); P(o.obj,'sph',mat(POWERS[o.k].col,{e:0.7,s:150}),0.42,0.42,0.42); P(o.obj,'sph',mat('#ffffff',{op:0.3,s:150}),0.55,0.55,0.55); dynRoot.add(o.obj); }
    o.obj.position.set(o.x,1.0+Math.sin(o.t*4)*0.15,o.y); o.obj.rotation.y+=dt*2; PSA.spawn(o.x,o.obj.position.y,o.y,0,0,0,0.06,2.0,POWERS[o.k].col,0.5,0); o.obj.visible=!(o.life<4&&Math.floor(o.life*6)%2===0);
    if(Math.random()<dt*10) PSA.spawn(o.x+rnd(-0.4,0.4),1,o.y+rnd(-0.4,0.4),0,1.2,0,0.5,0.2,POWERS[o.k].col,1,0);
  }
  for(const c of G.clouds){}
}
