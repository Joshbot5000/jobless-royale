// Export the game's sculpted (SDF) heads and hair styles as JSON meshes for the Blender kit build.
// usage: node tools/blender_kit/dump_sdf.js <outdir>      (run after python3 build.py)
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const OUT=process.argv[2]||'.'; const FILE='file://'+path.resolve(__dirname,'..','..','dist','jobless-royale-offline.html');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); const p=await b.newPage({viewport:{width:300,height:500}});
  await p.goto(FILE,{waitUntil:'commit'}); await p.waitForFunction(()=>typeof buildModel==='function'&&typeof CARDS!=='undefined',null,{timeout:300000});
  const res=await p.evaluate(()=>{
    SDF_CELL=0.011; SDF_CACHE.clear(); const out={};
    const grab=(name,key)=>{ const g=SDF_CACHE.get(key); if(!g) return false; out[name]={pos:Array.from(g.attributes.position.array,v=>+v.toFixed(5)),nor:Array.from(g.attributes.normal.array,v=>+v.toFixed(4)),idx:Array.from(g.index.array)}; return true; };
    // heads: the four face shapes (FV 0..3), built from a plain model with each hash
    for(let fv=0;fv<4;fv++){ for(let i=0;i<200;i++){ const m={k:'h',skin:'#f7c9'+(160+i).toString(16).padStart(2,'0').slice(-2),outfit:['tshirt','#888','T'],hair:['bald','#000']}; buildModel(m,0); const k=[...SDF_CACHE.keys()].find(k=>k.startsWith('head|0.300|'+fv+'@')); if(k){ grab('head_'+['round','long','square','classic'][fv],k); break; } } }
    // hair: one model per style (no hat), plus the snug cap worn under hats
    for(const st of ['short','slick','messy','curl','long','bun','ponytail','spiky','afro']){ SDF_CACHE.clear(); buildModel({k:'h',skin:'#f7c9a0',outfit:['tshirt','#888','T'],hair:[st,'#3a2414']},0); const k=[...SDF_CACHE.keys()].find(k=>k.startsWith('hair|'+st+'|')); if(k) grab('hair_'+st,k); }
    SDF_CACHE.clear(); buildModel({k:'h',skin:'#f7c9a0',outfit:['tshirt','#888','T'],hair:['short','#3a2414'],hat:['cap','#333']},0); { const k=[...SDF_CACHE.keys()].find(k=>k.startsWith('hair|short|')); if(k) grab('hair_cap',k); }
    SDF_CELL=0.024; return out; });
  for(const k in res){ fs.writeFileSync(path.join(OUT,k+'.json'),JSON.stringify(res[k])); console.log(k, res[k].idx.length/3,'tris'); }
  await b.close(); })();
