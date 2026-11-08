// =====================================================================
//  CAREER LADDER — every card climbs a job ladder.
//  Win battles (and Career Academy shifts) to earn Pay Packets: copies of cards plus 💰 Wages.
//  Enough copies + wages promote a card one rung (Intern → … → Chief), each rung +8% health and damage
//  (LV_STEP in sim.js). The AI's cards level with you, a bit behind or ahead depending on difficulty.
// =====================================================================
const RANKS=['Intern','Trainee','Junior','Senior','Lead','Manager','Chief'];
const MAX_LV=RANKS.length;
const COPIES=[2,4,8,15,25,40];              // copies to climb from rung i+1 (commons; rarer cards need fewer)
const WAGE_COST=[10,25,60,120,250,450];
const RAR_COPY={common:1,rare:0.6,epic:0.4,legendary:0.25,champion:0.25};
const RAR_PACK={common:[3,5],rare:[2,3],epic:[1,2],legendary:[1,1],champion:[1,1]};
let COLL=null, WAGES=0;
function collLoad(){ if(COLL) return; COLL=store.get('coll',{})||{}; WAGES=+store.get('wages',0)||0; }
function collSave(){ store.set('coll',COLL); store.set('wages',WAGES); }
function cardLv(id){ collLoad(); return (COLL[id]&&COLL[id].l)||1; }
function cardCopies(id){ collLoad(); return (COLL[id]&&COLL[id].c)||0; }
function copiesNeed(id,l=cardLv(id)){ if(l>=MAX_LV) return 0; return Math.max(1,Math.round(COPIES[l-1]*(RAR_COPY[CARDS[id].rar]||1))); }
function wageNeed(id,l=cardLv(id)){ return l>=MAX_LV?0:WAGE_COST[l-1]; }
const rankName=l=>RANKS[clamp(l||1,1,MAX_LV)-1];
function promoReady(id){ return !CARDS[id].hidden&&unlocked(id)&&cardLv(id)<MAX_LV&&cardCopies(id)>=copiesNeed(id); }
function promote(id){
  if(!promoReady(id)) return 'copies'; const need=copiesNeed(id), w=wageNeed(id); if(WAGES<w) return 'wages';
  const e=COLL[id]||(COLL[id]={l:1,c:0}); e.c-=need; WAGES-=w; e.l=(e.l||1)+1; collSave(); return 'ok'; }
function deckLevels(deck){ const o={}; for(const k of deck) o[k]=cardLv(k); o._=Math.round(avgLevel(deck)); return o; }
function avgLevel(deck){ return deck.length?deck.reduce((t,k)=>t+cardLv(k),0)/deck.length:1; }
// the AI: half the trophy-road standard, half your own deck, then one rung down (Rookie) or up (Champion)
function aiLevels(deck,myDeck){ const std=clamp(1+Math.floor(trophies/300),1,MAX_LV);
  const l=clamp(Math.round((std+avgLevel(myDeck))/2)+(diffIdx-1),1,MAX_LV); const o={_:l}; for(const k of deck) o[k]=l; return o; }

// ---------------------------------------------------------------- pay packets
// size: 'win' | 'loss' | 'draw' | 'shift' (first clear of an Academy shift) | 'champ' (tournament winner)
function payPacket(size,pool,deck,extraWages=0){
  collLoad(); pool=pool.filter(k=>CARDS[k]&&!CARDS[k].hidden&&unlocked(k)); if(!pool.length) return {cards:[],wages:0};
  const stacks={win:3,loss:1,draw:1,shift:4,champ:6}[size]||1, mult={win:1,loss:0.6,draw:0.8,shift:1.6,champ:2}[size]||1;
  const wages=Math.round(({win:30,loss:10,draw:15,shift:60,champ:150}[size]||10)+extraWages);
  // weighted to the cards you actually use
  const weight=k=>(deck&&deck.includes(k)?3:1)*(cardLv(k)>=MAX_LV?0.15:1);
  const got={}, left=pool.slice();
  for(let i=0;i<stacks&&left.length;i++){ let tot=left.reduce((t,k)=>t+weight(k),0), r=Math.random()*tot, pick=left[0];
    for(const k of left){ r-=weight(k); if(r<=0){ pick=k; break; } }
    left.splice(left.indexOf(pick),1); const [a,b]=RAR_PACK[CARDS[pick].rar]||[1,2]; got[pick]=Math.max(1,Math.round((a+Math.random()*(b-a))*mult)); }
  const cards=[]; for(const k in got){ const e=COLL[k]||(COLL[k]={l:1,c:0}); e.c=(e.c||0)+got[k]; cards.push({id:k,n:got[k]}); }
  WAGES+=wages; collSave(); return {cards,wages}; }
// the end-screen reveal: card tiles pop in one by one with "+N"
function showPacket(el,pk,title){ el.innerHTML=''; if(!pk||(!pk.cards.length&&!pk.wages)){ el.hidden=true; return; }
  const h=document.createElement('div'); h.className='unlockHead'; h.textContent=title||'💼 PAY PACKET'; el.appendChild(h);
  const g=document.createElement('div'); g.className='grid unlockGrid packet';
  pk.cards.forEach((c,i)=>{ requestPortrait(c.id); const t=cardTile(c.id,null,'pk'); t.style.animationDelay=(0.15+i*0.18)+'s';
    const n=document.createElement('div'); n.className='pkn'; n.textContent='+'+c.n; t.appendChild(n); if(promoReady(c.id)) t.classList.add('canpromo'); g.appendChild(t); });
  el.appendChild(g);
  const w=document.createElement('div'); w.className='pkw'; w.textContent=`💰 +${pk.wages} Wages`; el.appendChild(w);
  const ready=pk.cards.filter(c=>promoReady(c.id)); if(ready.length){ const r=document.createElement('div'); r.className='tag small pkready'; r.textContent=`⬆️ ${ready.map(c=>CARDS[c.id].short||CARDS[c.id].name).join(', ')} ready for promotion! Tap ${ready.length>1?'them':'it'} in your deck.`; el.appendChild(r); }
  el.hidden=false; }

// ---------------------------------------------------------------- tile badges and the promotion screen
function lvBadges(b,id){ if(CARDS[id].hidden||!unlocked(id)) return; const l=cardLv(id), need=copiesNeed(id), have=cardCopies(id);
  const bar=document.createElement('div'); bar.className='cpb'+(have>=need&&l<MAX_LV?' full':'')+(l>=MAX_LV?' max':''); bar.innerHTML=l>=MAX_LV?`<span><b>Lv${l}</b> MAX</span>`:`<i style="width:${Math.min(100,have/need*100)}%"></i><span><b>Lv${l}</b> ${have}/${need}</span>`; b.appendChild(bar);
  if(promoReady(id)) b.classList.add('canpromo'); }
function promoLine(id){ if(CARDS[id].hidden||!unlocked(id)) return ''; const l=cardLv(id);
  if(l>=MAX_LV) return `<br><span class="lvline">⭐ ${rankName(l)} (Lv${l}): top of the ladder!</span>`;
  const need=copiesNeed(id), have=cardCopies(id), w=wageNeed(id);
  const btn=have>=need?`<br><button class="btn sm promoBtn" data-promo="${id}">⬆️ PROMOTE TO ${rankName(l+1).toUpperCase()} · 💰${w}</button>`:'';
  return `<br><span class="lvline">💼 ${rankName(l)} (Lv${l}) · ${have}/${need} copies to become ${rankName(l+1)}</span>`+btn; }
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-promo]'); if(!b) return; const id=b.dataset.promo, r=promote(id);
  if(r==='wages'){ sfx('bad'); b.textContent=`Need 💰${wageNeed(id)} (you have ${WAGES})`; return; }
  if(r!=='ok') return; showPromo(id); });
function showPromo(id){ const l=cardLv(id), c=CARDS[id], el=$('#promo'); sfx('crown'); buzz(30);
  const pct=Math.round(LV_STEP*100);
  el.innerHTML=`<div class="col"><div class="promoHead">PROMOTED!</div><div class="promoCard"></div><div class="promoName">${c.name}</div>
    <div class="promoRank"><s>${rankName(l-1)}</s> → <b>${rankName(l)}</b></div><div class="tag">Level ${l} · +${pct}% health and damage${c.hp?` · ❤️ ${Math.round(c.hp*lvMul(l))}`:''}${c.dmg?` · ⚔️ ${Math.round(c.dmg*lvMul(l))}`:''}</div>
    <button class="btn" id="promoOk">NICE!</button></div>`;
  const slot=el.querySelector('.promoCard'); requestPortrait(id); slot.appendChild(cardTile(id,null,'promo'));
  for(let i=0;i<40;i++){ const s=document.createElement('i'); s.className='confetti'; s.style.left=Math.random()*100+'%'; s.style.background=['#ffc83d','#6fb6ff','#ff6b8b','#7dff8a','#fff'][i%5]; s.style.animationDelay=Math.random()*0.6+'s'; s.style.animationDuration=1.6+Math.random()*1.4+'s'; el.appendChild(s); }
  el.hidden=false; $('#promoOk').onclick=()=>{ el.hidden=true; el.innerHTML=''; if(!$('#menu').hidden) renderMenu(); else if(onPromoDone) onPromoDone(); };
}
