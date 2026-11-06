// Reads tools/duel.js output and reports, per arena, how every card does on attack and defence.
//   node tools/duelreport.js [duels.json] [arenaId]       (prints a table)
//   node tools/duelreport.js [duels.json] --json          (machine-readable scores, used for tuning)
// A defender's value against an attacker is measured against doing nothing (the tower alone):
//   value = tower damage it prevented/150 + extra attacker elixir it destroyed - its own elixir lost
// (a Princess Tower has 1500 HP, so 150 damage is worth about one elixir; tower damage is capped at 1500).
const fs=require('fs'), path=require('path');
const IN=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:path.resolve(__dirname,'..','dist','duels.json');
const only=process.argv.find((a,i)=>i>2&&!a.startsWith('--')), asJson=process.argv.includes('--json');
const D=JSON.parse(fs.readFileSync(IN,'utf8'));
const cap=t=>Math.min(t,1500);
const net=(cA,cB,r,solo)=>(cap(solo.tdmg)-cap(r.tdmg))/150+cA*(solo.aRem-r.aRem)-cB*(1-r.bRem);
const out={};
for(const id in D){ if(only&&id!==only) continue; const a=D[id], C=a.cost;
  const S={}; // per card scores
  for(const k of a.def) S[k]={k,cost:C[k],counters:[],countersOf:[],defNet:[],attNet:[],solo:null};
  for(const A of a.att){ const s=a.solo[A]; S[A].solo=s?s.tdmg:0;
    for(const B of a.def){ const r=a.pairs[A][B]; if(!r||!s) continue;
      const n=net(C[A],C[B],r,s); S[B].defNet.push(n); S[A].attNet.push(-n);
      // a real counter: stops the push (little tower damage) and wins the trade by at least 1 elixir
      // an answer: stops the push (tower damage cut to a third or under) without losing the elixir trade
      if(n>=0&&r.tdmg<=Math.max(200,cap(s.tdmg)*0.35)){ S[A].countersOf.push(B); S[B].counters.push(A); } } }
  const rows=Object.values(S).map(s=>({...s,def:s.defNet.length?s.defNet.reduce((x,y)=>x+y,0)/s.defNet.length:0,att:s.attNet.length?s.attNet.reduce((x,y)=>x+y,0)/s.attNet.length:null}));
  out[id]=rows;
  if(asJson) continue;
  const nA=a.att.length;
  console.log(`\n=== ${id}  (${nA} attackers, ${a.def.length} defenders)`);
  console.log('card'.padEnd(15),'el','solo','attNet','#answers','| defNet','#beats','  answered by');
  for(const r of rows.sort((x,y)=>(y.att??-99)-(x.att??-99))){
    const flag=r.att!==null&&r.countersOf.length<3&&(r.solo||0)>=400?' ⚠NO ANSWER':r.counters.length>nA*0.8?' ⚠BEATS ALL':(r.att!==null&&r.att<-2.5&&r.counters.length<2)?' ⚠WEAK':'';
    console.log(r.k.padEnd(15),String(r.cost).padEnd(2),String(r.solo??'-').padEnd(4),(r.att===null?'  -  ':r.att.toFixed(1).padStart(5)),String(r.att===null?'-':r.countersOf.length).padStart(5),'   |',r.def.toFixed(1).padStart(5),String(r.counters.length).padStart(5),'  ',r.countersOf.slice(0,8).join(' ')+flag);
  }
}
if(asJson) console.log(JSON.stringify(out));
