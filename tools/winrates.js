// Independent balance check: full AI-vs-AI matches with random legal decks in every arena, then each card's win rate
// (wins / matches it was in a deck). Balanced cards sit near 50%; anything far outside 38-62% deserves a look.
//   python3 build.py && node tools/winrates.js [matchesPerArena=40] [out.json]
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
const FILE='file://'+path.resolve(__dirname,'..','dist','jobless-royale-offline.html');
const N=+(process.argv[2]||40), OUT=process.argv[3]||path.resolve(__dirname,'..','dist','winrates.json');
const WORKERS=Math.max(1,Math.min(4,require('os').cpus().length));
async function run(b,ids){
  const p=await b.newPage({viewport:{width:120,height:200}});
  await p.addInitScript(()=>{ window.requestAnimationFrame=()=>0; });
  await p.goto(FILE,{waitUntil:'commit'}); await p.waitForFunction(()=>typeof newGame==='function'&&typeof randomDeck==='function',null,{timeout:600000,polling:500});
  const res={};
  for(const id of ids){ res[id]=await p.evaluate(([id,N])=>{
      const ti=THEMES.findIndex(t=>t.id===id), th=THEMES[ti]; const st={}; let draws=0;
      for(let m=0;m<N;m++){ const d0=randomDeck(th.pool), d1=randomDeck(th.pool);
        newGame(ti,2,'classic',d0,d1); G.diff=DIFF[2]; let s=0;
        while(!G.over&&s<4400){ G.ai0Timer=(G.ai0Timer||1)-0.05; if(G.ai0Timer<=0){ G.ai0Timer=0.6; aiAct(0); } update(0.05); s++; }
        const w=G.over?G.winner:-1; if(w<0) draws++;
        [d0,d1].forEach((d,team)=>{ for(const k of d){ const r=st[k]=st[k]||{n:0,w:0}; r.n++; if(w===team) r.w++; else if(w<0) r.w+=0.5; } }); }
      return {st,draws,n:N}; },[id,N]); process.stdout.write(id+' '); }
  await p.close(); return res; }
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage(); await p.addInitScript(()=>{ window.requestAnimationFrame=()=>0; }); await p.goto(FILE,{waitUntil:'commit'}); await p.waitForFunction(()=>typeof THEMES!=='undefined',null,{polling:500});
  const ids=await p.evaluate(()=>THEMES.map(t=>t.id)); await p.close();
  const chunks=Array.from({length:WORKERS},()=>[]); ids.forEach((id,i)=>chunks[i%WORKERS].push(id));
  const t0=Date.now(); const all=Object.assign({},...await Promise.all(chunks.map(c=>run(b,c))));
  fs.writeFileSync(OUT,JSON.stringify(all)); await b.close();
  const rows=[]; for(const id in all) for(const k in all[id].st){ const r=all[id].st[k]; rows.push({id,k,n:r.n,wr:r.w/r.n}); }
  rows.sort((a,b)=>b.wr-a.wr); const sd=Math.sqrt(rows.reduce((s,r)=>s+(r.wr-0.5)**2,0)/rows.length);
  console.log(`\n${ids.length} arenas x ${N} matches in ${Math.round((Date.now()-t0)/1000)}s. Win-rate spread (sd) ${(sd*100).toFixed(1)}%`);
  console.log('highest:',rows.slice(0,15).map(r=>`${r.k} ${Math.round(r.wr*100)}%`).join(', '));
  console.log('lowest: ',rows.slice(-15).map(r=>`${r.k} ${Math.round(r.wr*100)}%`).join(', '));
  console.log('outside 35-65%:',rows.filter(r=>r.n>=8&&(r.wr>0.65||r.wr<0.35)).length,'of',rows.length);
})();
