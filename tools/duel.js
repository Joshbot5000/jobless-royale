// Duel simulator for balancing. Runs the real game engine headless (no rendering) and plays every
// attacker-vs-defender pairing inside each arena, CR style: the attacker is deployed at the enemy bridge and walks
// at your left Princess Tower; when it crosses the river your defender drops in (troop in front of the tower,
// building in the middle, spell straight on top of the attackers). Results are written as JSON.
//   python3 build.py && node tools/duel.js [arenaIds,comma] [out.json]
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
const FILE='file://'+path.resolve(__dirname,'..','dist','jobless-royale-offline.html');
const only=(process.argv[2]||'').split(',').filter(Boolean), OUT=process.argv[3]||path.resolve(__dirname,'..','dist','duels.json');
const WORKERS=Math.max(1,Math.min(4,require('os').cpus().length));
async function runArenas(b,ids){
  const p=await b.newPage({viewport:{width:120,height:200}});
  await p.addInitScript(()=>{ window.requestAnimationFrame=()=>0; });           // no render loop: pure simulation
  await p.goto(FILE,{waitUntil:'commit'}); await p.waitForFunction(()=>typeof THEMES!=='undefined'&&typeof newGame==='function',null,{timeout:600000,polling:500});
  const res={};
  for(const id of ids){
    res[id]=await p.evaluate((id)=>{
      const ti=THEMES.findIndex(t=>t.id===id), th=THEMES[ti]; Math.random=(s=>()=>{ s=(s*16807)%2147483647; return s/2147483647; })(12345);
      newGame(ti,1,'classic',th.cards,th.cards);
      const reset=()=>{ for(const k of ['units','projs','dying','spells','clouds','pulls','rolls','barrage','revives','executions','orbs','callouts','beams','bolts','emotes','feed','booms','nums','debris']) G[k]=[];
        Object.assign(G,{t:0,time:999,over:false,winner:-1,aiTimer:1e9,ai0Timer:1e9,elixir:[99,99],orbTimer:1e9,chaosT:1e9,shake:0,freezeT:0,slowT:0,hasTaunt:false}); G.detected=new Set(); G.graveyard=[[],[]];
        for(const t of G.towers){ t.hp=t.maxHp=1e6; t.dead=false; t.active=t.kind!=='king'; t.target=null; t.cd=0; t.frozen=0; t.hackT=0; } };
      const pool=th.pool, att=pool.filter(k=>CARDS[k].type!=='spell'&&CARDS[k].type!=='building');
      const cost=k=>CARDS[k].cost;
      const teamHp=team=>G.units.filter(u=>u.team===team&&!u.dead&&u.origTeam===undefined).reduce((s,u)=>s+u.hp,0);
      function one(A,B){
        reset(); G.hands=[[B||A,A,A,A],[A,A,A,A]]; G.queues=[[A],[A]];
        const ok=playCard(1,0,3.5,11.5); if(!ok) return null;
        const a0=Math.max(1,teamHp(1)); let b0=0, placed=!B, t=0, dt=0.05, towerStart=G.towers[3].hp;
        while(t<38){ t+=dt;
          if(!placed){ const lead=G.units.filter(u=>u.team===1&&!u.dead).sort((x,y)=>y.y-x.y)[0];
            if(!lead){ placed=true; }
            else if(lead.y>(CARDS[B].type==='spell'?19.5:15.2)||t>14){ placed=true; const c=CARDS[B];
              // like a real player: troops dropped right in the attacker's path as it reaches the bridge, buildings in the middle to pull it
              let x=3.8,y=21.5; if(c.type==='building'){ x=6.2; y=21.2; } if(c.type==='spell'){ const us=G.units.filter(u=>u.team===1&&!u.dead); x=us.reduce((s,u)=>s+u.x,0)/us.length; y=us.reduce((s,u)=>s+u.y,0)/us.length; }
              G.elixir[0]=99; playCard(0,0,x,y); b0=Math.max(1,teamHp(0)); } }
          update(dt); G.over=false; G.time=999;
          if(placed&&t>3&&!G.units.some(u=>u.team===1&&!u.dead&&u.origTeam===undefined)&&!G.spells.length&&!G.barrage.length) break; }
        const aRem=Math.min(1,teamHp(1)/a0), bRem=B&&CARDS[B].type!=='spell'?Math.min(1,teamHp(0)/Math.max(1,b0)):0;
        const tdmg=Math.round(towerStart-G.towers[3].hp + (1e6-G.towers[5].hp)*0.5);
        return {aRem:Math.round(aRem*100)/100,bRem:Math.round(bRem*100)/100,tdmg,t:Math.round(t)};
      }
      const out={id,att,def:pool,cost:Object.fromEntries(pool.map(k=>[k,cost(k)])),type:Object.fromEntries(pool.map(k=>[k,CARDS[k].type||'troop'])),solo:{},pairs:{}};
      for(const A of att){ out.solo[A]=one(A,null); out.pairs[A]={}; for(const B of pool){ if(B===A&&false) continue; out.pairs[A][B]=one(A,B); } }
      return out;
    },id);
    process.stdout.write(id+' ');
  }
  await p.close(); return res;
}
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage(); await p.goto(FILE,{waitUntil:'commit'}); await p.waitForFunction(()=>typeof THEMES!=='undefined',null,{timeout:600000});
  let ids=await p.evaluate(()=>THEMES.map(t=>t.id)); await p.close(); if(only.length) ids=ids.filter(i=>only.includes(i));
  const chunks=Array.from({length:WORKERS},()=>[]); ids.forEach((id,i)=>chunks[i%WORKERS].push(id));
  const t0=Date.now(); const parts=await Promise.all(chunks.filter(c=>c.length).map(c=>runArenas(b,c)));
  const all=Object.assign({},...parts); fs.writeFileSync(OUT,JSON.stringify(all));
  console.log(`\n${ids.length} arenas in ${Math.round((Date.now()-t0)/1000)}s -> ${OUT}`); await b.close();
})();
