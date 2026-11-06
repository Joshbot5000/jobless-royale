// Second-stage tuner: gently corrects cards whose AI-vs-AI match win rate (tools/winrates.js) is far from 50%.
//   node tools/winrates.js 300 && node tools/wrtune.js [dist/winrates.json]
// Only cards seen in 100+ matches and outside 44-56% move, by at most ~8% per run, inside the same 0.5-1.5 bounds.
const fs=require('fs'), path=require('path');
const IN=process.argv[2]||path.resolve(__dirname,'..','dist','winrates.json'), OUT=path.resolve(__dirname,'..','src','data_tune.js');
const W=JSON.parse(fs.readFileSync(IN,'utf8'));
const src=fs.readFileSync(OUT,'utf8'); const T=JSON.parse(src.match(/const TUNE=(\{[\s\S]*?\});/)[1]);
const agg={}; for(const id in W) for(const k in W[id].st){ const r=W[id].st[k]; const a=agg[k]=agg[k]||{n:0,w:0}; a.n+=r.n; a.w+=r.w; }
let n=0; for(const k in agg){ const a=agg[k]; if(a.n<100) continue; const wr=a.w/a.n; if(Math.abs(wr-0.5)<0.06) continue;
  const f=Math.exp(-0.7*Math.max(-0.12,Math.min(0.12,wr-0.5))); const [h,d]=T[k]||[1,1];
  T[k]=[h*f,d*f].map(x=>Math.round(Math.min(1.5,Math.max(0.5,x))*1000)/1000); n++; }
fs.writeFileSync(OUT,src.replace(/const TUNE=\{[\s\S]*?\};/,'const TUNE='+JSON.stringify(T)+';')); console.log('win-rate corrected',n,'cards');
