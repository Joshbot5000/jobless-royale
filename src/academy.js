// =====================================================================
//  CAREER ACADEMY — short "shifts" in every arena with a twist on the normal battle, then a Pay Packet.
//  Four shifts per arena, each unlocking the next: First Day (take a tower), Hold the Line (survive a rush),
//  Tight Budget (take a tower on a fixed allowance of Broke Bucks), Boss Fight (beat a giant Champion).
//  Each first clear also opens one section of that arena's Job File (src/data_academy.js).
//  The battle engine calls missionTick() every step while G.mission is set (sim.js update()).
// =====================================================================
const SHIFTS=[
  {key:'first',name:'First Day',icon:'🌅',time:120,goal:'Take down 1 tower',
    brief:j=>`Your first day as a ${j}. Make an impression: knock down one enemy tower before the shift ends.`,
    ai:{think:2.0,pushAt:9.5,elixirMul:0.8,smart:0}},
  {key:'hold',name:'Hold the Line',icon:'🛡️',time:90,goal:'Don\'t lose a tower',
    brief:j=>`Rush hour! The rival ${j}s are coming in waves with extra Broke Bucks. Don't let a single tower fall for 1:30.`,
    ai:{think:0.9,pushAt:5.5,elixirMul:1.55,smart:1},hard:true},
  {key:'budget',name:'Tight Budget',icon:'💸',time:150,goal:'Take a tower on 18 Broke Bucks',budget:18,
    brief:j=>`Head office cut your budget. You get 18 Broke Bucks for the whole shift and they don't refill. Their towers are run down: take one out.`,
    ai:{think:2.0,pushAt:9.5,elixirMul:0.65,smart:0},foeTower:0.6},
  {key:'boss',name:'Boss Fight',icon:'👹',time:150,goal:'Defeat the Boss',
    brief:j=>`The big boss is not happy with your work and is coming to tell you in person. Beat the giant Boss before it flattens your King Tower.`,
    ai:{think:2.0,pushAt:9.5,elixirMul:0.7,smart:0},boss:true},
];
const JOBFILE_PARTS=[['what','💼 What they really do'],['skills','🧠 Skills they use'],['route','🪜 How people get the job'],['fact','🤯 Did you know?']];
let ACAD=null;
function acLoad(){ if(!ACAD) ACAD=store.get('acad',{})||{}; return ACAD; }
function acStars(thId){ const a=acLoad()[thId]; return SHIFTS.map((_,i)=>a&&a[i]||0); }
function acSave(){ store.set('acad',ACAD); }
const jobOf=th=>JOBFILES[th.id]||{title:(th.job||'Worker').replace(/s$/,''),emoji:th.emoji};

// ---------------------------------------------------------------- screens
let acSel=null, acEditor=null;
function openAcademy(thIdx){ $('#menu').hidden=true; $('#end').hidden=true; $('#academy').hidden=false; acSel=thIdx==null?null:thIdx; acRender(); $('#academy').scrollTop=0; }
$('#acBtn').onclick=()=>{ initAudio(); openAcademy(); };
$('#acBack').onclick=()=>{ if(acSel!=null){ acSel=null; acRender(); $('#academy').scrollTop=0; return; } $('#academy').hidden=true; showMenu(); };
function acRender(){ const list=$('#acList'), dept=$('#acDept'); acLoad();
  let tot=0, files=0; for(const th of THEMES){ const s=acStars(th.id); tot+=s.reduce((a,b)=>a+b,0); if(JOBFILES[th.id]) files+=s.filter(x=>x>0).length; }
  $('#acTotals').innerHTML=`<span>⭐ ${tot}/${THEMES.length*12}</span><span>📁 ${files}/${Object.keys(JOBFILES).filter(k=>THEMES.some(t=>t.id===k)).length*4}</span><span>💰 ${(collLoad(),WAGES)}</span>`;
  if(acSel==null){ list.hidden=false; dept.hidden=true; dept.innerHTML=''; list.innerHTML=''; acEditor=null;
    THEMES.forEach((th,i)=>{ const s=acStars(th.id), j=jobOf(th), b=document.createElement('button'); b.type='button'; b.className='arena acdept';
      b.style.background=`linear-gradient(160deg, ${th.sky[1]} 0%, ${th.ground[1]} 55%, ${th.outer} 100%)`;
      const next=s.findIndex(x=>!x);
      b.innerHTML=`<span class="aemoji">${th.emoji}</span><span class="aname">${th.name}</span><span class="ajob">${j.emoji||''} ${j.title}</span><span class="astars">${s.map(x=>x?'★':'☆').join('')} <small>${s.reduce((a,b)=>a+b,0)}/12</small></span>${next<0?'<span class="acdone">✓ CLEARED</span>':''}`;
      b.onclick=()=>{ acSel=i; acRender(); $('#academy').scrollTop=0; }; list.appendChild(b); });
    return; }
  const th=THEMES[acSel], s=acStars(th.id), j=jobOf(th); list.hidden=true; dept.hidden=false;
  dept.innerHTML=`<div class="acHead" style="background:linear-gradient(160deg, ${th.sky[1]} 0%, ${th.ground[1]} 60%, ${th.outer} 100%)"><span>${th.emoji}</span><div><b>${th.name}</b><small>${j.emoji||''} ${j.title}</small></div></div>
    <div class="acShifts">${SHIFTS.map((sh,i)=>{ const open=i===0||s[i-1]>0;
      return `<div class="acShift${open?'':' locked'}"><div class="acIcon">${open?sh.icon:'🔒'}</div><div class="acText"><b>Shift ${i+1}: ${sh.name}</b><small>${open?sh.goal:'Clear shift '+i+' first'}</small><span class="acSt">${[0,1,2].map(k=>k<s[i]?'★':'☆').join('')}</span></div>${open?`<button class="btn sm${s[i]?' blue':''}" data-shift="${i}">${s[i]?'REPLAY':'PLAY'}</button>`:''}</div>`; }).join('')}</div>
    ${JOBFILES[th.id]?`<button class="btn blue" id="acFile">📁 JOB FILE · ${s.filter(x=>x).length}/4</button>`:''}
    <div id="acDeck" class="deckEd"></div>`;
  dept.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>acStart(acSel,+b.dataset.shift));
  if($('#acFile')) $('#acFile').onclick=()=>showJobFile(th);
  acEditor=deckEditor($('#acDeck'),th,false); }
// the Job File: a staff dossier with a section per cleared shift
function showJobFile(th,fresh){ const j=JOBFILES[th.id]; if(!j) return; const s=acStars(th.id), el=$('#jobfile');
  const body=JOBFILE_PARTS.map(([k,label],i)=>{ const open=s[i]>0; const v=k==='skills'?(j.skills||[]).map(x=>`<i>${x}</i>`).join(''):j[k];
    return `<div class="jfSec${open?'':' locked'}${fresh===i?' fresh':''}"><h3>${label}</h3>${open?`<p${k==='skills'?' class="traits"':''}>${v}</p>`:`<p class="dim">🔒 Clear Shift ${i+1}: ${SHIFTS[i].name} to unlock</p>`}</div>`; }).join('');
  el.innerHTML=`<div class="col"><div class="jfCard"><div class="jfTop"><span class="jfEmoji">${j.emoji}</span><div><small>STAFF FILE · ${th.name.toUpperCase()}</small><b>${j.title}</b></div></div>${s.every(x=>x)?'<div class="jfStamp">COMPLETE</div>':''}${body}</div><button class="btn" id="jfOk">CLOSE</button></div>`;
  el.hidden=false; $('#jfOk').onclick=()=>{ el.hidden=true; el.innerHTML=''; }; }

// ---------------------------------------------------------------- a shift
function acStart(thIdx,i){
  const th=THEMES[thIdx], sh=SHIFTS[i]; let deck=loadDeck(th);
  if(!deckValid(deck)){ $('#info').textContent=''; return; }
  initAudio(); $('#academy').hidden=true; $('#menu').hidden=true; $('#end').hidden=true; menuPreview=null; infoCard=null;
  const pool=th.pool.filter(k=>!CARDS[k].hidden&&CARDS[k].unlock<=Math.max(400,trophies+300));
  const aiDeck=sh.hard?(randomDeck(pool)||th.cards.slice()):th.cards.slice();
  const bossId=sh.boss?(th.cards.find(k=>CARDS[k].champ)||th.pool.find(k=>CARDS[k].champ)):null;
  newGame(thIdx,sh.hard?1:0,'classic',deck,aiDeck);
  const myL=deckLevels(deck), aiL=Math.max(1,Math.round(avgLevel(deck))); G.lvl=[myL,{_:aiL}]; G.myDeck=deck.slice();
  G.diff=Object.assign({},G.diff,sh.ai); G.time=sh.time; G.foe=`${sh.icon} ${sh.name}`;
  G.mission={th:thIdx,i,sh,bank:sh.budget?sh.budget-5:null,bossId,boss:null,bossT:2.5,job:jobOf(th).title};
  if(sh.foeTower) for(const t of G.towers) if(t.team===1&&t.kind==='princess'){ t.hp=t.maxHp=Math.round(t.maxHp*sh.foeTower); }
  G.banner=null; showBanner(`${sh.icon} ${sh.name.toUpperCase()}`,sh.goal,2.6,'#ffd34d');
  ensureZone(); hideGhost(); emoteOpen=false; fitCamera(W,H,TOPH,PANH);
  G.hands[0].concat(G.queues[0]).forEach(requestPortrait); G.hands[1].concat(G.queues[1]).forEach(requestPortrait);
  last=performance.now(); Music.stop(); Music.kick();
}
function missionTick(dt){ const M=G.mission, sh=M.sh, lost=G.towers.filter(t=>t.team===0&&t.dead).length;
  const win=sub=>{ showBanner('SHIFT COMPLETE!',sub||'',2.4,'#7dff8a'); sfx('crown'); endGame(0); }, fail=sub=>{ showBanner('SHIFT FAILED',sub||'',2.4,'#ff8080'); endGame(1); };
  if(M.bossId&&!M.boss){ M.bossT-=dt; if(M.bossT<=0){ const b=spawnUnit(M.bossId,1,9,6.2,1.2); b.hp=b.maxHp=Math.round(6000*lvMul(teamLv(1,M.bossId))/1.6); makeGiant(b,1e9); b.isBoss=true; M.boss=b; M.bossMax=Math.round(b.maxHp);
      feedLog(`👹 THE BOSS (${b.c.short||b.c.name}) IS COMING!`,1); showBanner('👹 THE BOSS!',b.c.name,2,'#ff8080'); G.shake=0.6; sfx('boom'); G.tapCd[1]=6; } }
  if(sh.key==='hold'){ if(lost) return fail('A tower fell'); if(G.time<=0) return win('The line held!'); return; }
  if(sh.key==='boss'){ if(M.boss&&M.boss.dead) return win('The Boss is beaten!'); if(G.time<=0) return fail('Out of time'); return; }
  if(G.crowns[0]>=1) return win(sh.key==='budget'?'Under budget!':'Tower down!');
  if(G.time<=0) return fail('Out of time');
  if(sh.key==='budget'&&M.bank<=0.01){ const min=Math.min(...G.hands[0].map(k=>CARDS[k].cost));
    if(G.elixir[0]<min&&!G.units.some(u=>u.team===0&&!u.dead&&!u.building)&&!G.spells.some(s=>s.team===0)) return fail('Out of budget!'); }
}
function missionHud(){ const M=G.mission, sh=M.sh;
  if(sh.key==='budget') return `💸 Budget left: ${Math.max(0,Math.floor(M.bank+1e-6))} 💵 · 🎯 ${sh.goal.replace(' on 18 Broke Bucks','')}`;
  if(sh.key==='boss'&&M.boss) return `👹 BOSS ${Math.max(0,Math.ceil(M.boss.hp))} / ${M.bossMax}`;
  return `🎯 ${sh.goal}`; }
function missionStars(){ const M=G.mission, sh=M.sh, mine=G.towers.filter(t=>t.team===0);
  if(sh.key==='first') return G.time>=60?3:G.time>=30?2:1;
  if(sh.key==='hold'){ const f=mine.reduce((a,t)=>a+Math.max(0,t.hp),0)/mine.reduce((a,t)=>a+t.maxHp,0); return f>=0.85?3:f>=0.55?2:1; }
  if(sh.key==='budget'){ const left=M.bank+G.elixir[0]; return left>=5?3:left>=2?2:1; }
  const lost=mine.filter(t=>t.dead).length; return lost===0?3:lost===1?2:1; }
function academyEnd(){ Music.stop(); const M=G.mission, th=THEMES[M.th], won=G.winner===0, stars=won?missionStars():0;
  acLoad(); const rec=ACAD[th.id]||(ACAD[th.id]=[0,0,0,0]); const before=rec[M.i]||0; if(stars>before){ rec[M.i]=stars; acSave(); }
  $('#endTitle').textContent=won?'SHIFT COMPLETE!':'SHIFT FAILED'; $('#endTitle').style.color=won?'#7dff8a':'#ff8a85';
  $('#cBlue').textContent='👑'.repeat(G.crowns[0])||'–'; $('#cRed').textContent='👑'.repeat(G.crowns[1])||'–'; $('#endFoe').textContent=M.sh.name;
  $('#endTro').innerHTML=won?`<span class="endStars">${[0,1,2].map(k=>`<i class="${k<stars?'on':''}" style="animation-delay:${0.2+k*0.25}s">★</i>`).join('')}</span>`:'☆☆☆';
  const tips={first:'Tip: a tank in front with damage behind it is a classic push.',hold:'Tip: defend near your towers so they shoot too, then counter-attack.',budget:'Tip: every Broke Buck counts. Cheap troops behind a tough one go further.',boss:'Tip: swarm the Boss with lots of small troops, or stun it to stop its attacks.'};
  $('#endSub').textContent=won?(stars>before&&before?`New best: ${stars} stars!`:stars<3?'Replay for 3 stars.':'Perfect shift!'):tips[M.sh.key];
  let pk=null; if(won) pk=payPacket(before?'loss':'shift',th.pool,G.myDeck||loadDeck(th),before?0:M.i*20);
  showPacket($('#endPacket'),pk,before?'💼 OVERTIME PAY':'💼 SHIFT PAY PACKET');
  const ul=$('#endUnlock'); ul.innerHTML=''; ul.hidden=true;
  if(won&&!before&&JOBFILES[th.id]){ const part=JOBFILE_PARTS[M.i]; ul.innerHTML=`<div class="unlockHead">📁 JOB FILE UPDATED</div><div class="tag small">${jobOf(th).emoji} ${jobOf(th).title}: “${part[1].replace(/^\S+\s/,'')}” unlocked</div><button class="btn blue sm" id="endFile">READ IT</button>`; ul.hidden=false;
    $('#endFile').onclick=()=>showJobFile(th,M.i); }
  const nxt=M.i+1<SHIFTS.length&&(rec[M.i]>0);
  $('#againBtn').hidden=false; $('#againBtn').textContent=won?'REPLAY':'TRY AGAIN';
  $('#nextBtn').hidden=!nxt; $('#nextBtn').textContent='NEXT SHIFT ▶'; $('#menuBtn').textContent='ACADEMY';
  $('#end').hidden=false; }
