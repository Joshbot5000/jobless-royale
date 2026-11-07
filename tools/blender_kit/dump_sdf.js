// Export the game's sculpted (SDF) heads, hair styles and whole bodies as JSON meshes for the Blender kit build.
// usage: node tools/blender_kit/dump_sdf.js <outdir>      (run after python3 build.py)
// Bodies are ONE continuous surface: the game's own torso, neck, leg, arm and hand fields (buildHuman, w = 1.0 / 1.3 / 1.5)
// moved to their rest pose and smooth-unioned, so outfit details placed by buildHuman sit exactly on the kit body.
// Each body vertex carries a region id (0 neck, 1 torso, 2 upper arm, 3 forearm, 4 hands, 5 legs) from its nearest part.
const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
const OUT=process.argv[2]||'.'; const FILE='file://'+path.resolve(__dirname,'..','..','dist','jobless-royale-offline.html');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); const p=await b.newPage({viewport:{width:300,height:500}});
  await p.goto(FILE,{waitUntil:'commit'}); await p.waitForFunction(()=>typeof buildModel==='function'&&typeof CARDS!=='undefined',null,{timeout:300000});
  const res=await p.evaluate(()=>{
    SDF_CELL=0.011; SDF_CACHE.clear(); if(typeof KIT!=='undefined') KIT=null; const out={};
    const pack=g=>({pos:Array.from(g.attributes.position.array,v=>+v.toFixed(5)),nor:Array.from(g.attributes.normal.array,v=>+v.toFixed(4)),idx:Array.from(g.index.array)});
    const grab=(name,key)=>{ const g=SDF_CACHE.get(key); if(!g) return false; out[name]=pack(g); return true; };
    // heads: the four face shapes (FV 0..3), built from a plain model with each hash
    for(let fv=0;fv<4;fv++){ for(let i=0;i<200;i++){ const m={k:'h',skin:'#f7c9'+(160+i).toString(16).padStart(2,'0').slice(-2),outfit:['tshirt','#888','T'],hair:['bald','#000']}; buildModel(m,0); const k=[...SDF_CACHE.keys()].find(k=>k.startsWith('head|0.300|'+fv+'@')); if(k){ grab('head_'+['round','long','square','classic'][fv],k); break; } } }
    // hair: one model per style (no hat), plus the snug cap worn under hats
    for(const st of ['short','slick','messy','curl','long','bun','ponytail','spiky','afro']){ SDF_CACHE.clear(); buildModel({k:'h',skin:'#f7c9a0',outfit:['tshirt','#888','T'],hair:[st,'#3a2414']},0); const k=[...SDF_CACHE.keys()].find(k=>k.startsWith('hair|'+st+'|')); if(k) grab('hair_'+st,k); }
    SDF_CACHE.clear(); buildModel({k:'h',skin:'#f7c9a0',outfit:['tshirt','#888','T'],hair:['short','#3a2414'],hat:['cap','#333']},0); { const k=[...SDF_CACHE.keys()].find(k=>k.startsWith('hair|short|')); if(k) grab('hair_cap',k); }
    // bodies (fields copied from buildHuman; keep in step with it)
    const LR=1.36, HY=0.44*(LR-1)+0.44, HS=1.45;
    const M=(rx,ry,rz)=>new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx,ry,rz));
    for(const [tag,w] of [['v0',1.0],['v1',1.3],['v2',1.5]]){
      const tw=0.27*w, th=0.29, td=0.205*Math.max(1,w*0.85), aw0=Math.max(1,w*0.8), lw=Math.max(1,w*0.85), aw=Math.max(1,w*0.8);
      const torF=SDF.blend([[SDF.ell(0,th*0.28,-td*0.05,tw*0.9,th*0.36,td*1.0),0],[SDF.ell(0,th*0.82,0,tw*0.74,th*0.42,td*0.88),0.1],[SDF.ell(0,th*1.32,td*0.02,tw*0.96,th*0.47,td*0.98),0.11],
        [SDF.ell(0,th*1.74,-td*0.06,tw*0.72,th*0.22,td*0.72),0.08],[SDF.ell(-(tw*0.84),th*1.6,0,0.086*aw0,0.084,0.086*aw0),0.07],[SDF.ell(tw*0.84,th*1.6,0,0.086*aw0,0.084,0.086*aw0),0.07]]);
      const neckF=SDF.blend([[SDF.rcone(0,th*1.7,-0.012,0,th*2.06+0.02,0.004,0.068,0.056),0],[SDF.ell(0,th*1.76,-0.02,tw*0.52,0.05,td*0.52),0.06]]);
      const legF=SDF.cutBelow(SDF.blend([[SDF.ell(0,-0.01,0,0.104*lw,0.07,0.1*lw),0],[SDF.rcone(0,-0.03,0.002,0,-0.2,0.014,0.1*lw,0.068*lw),0.05],[SDF.ell(0,-0.205,0.024,0.058*lw,0.048,0.05*lw),0.03],
        [SDF.rcone(0,-0.215,0.008,0,-0.37,0,0.066*lw,0.047*lw),0.04],[SDF.ell(0,-0.262,-0.016,0.068*lw,0.062,0.066*lw),0.05]]),-0.378);
      const armF=SDF.blend([[SDF.ell(0,-0.005,0,0.086*aw,0.09,0.086*aw),0],[SDF.rcone(0,-0.03,0,0,-0.232,-0.014,0.075*aw,0.056*aw),0.05],[SDF.rcone(0,-0.242,-0.012,0,-0.412,0.07,0.056*aw,0.04*aw),0.035],[SDF.ell(0,-0.29,0.012,0.062*aw,0.07,0.06*aw),0.05]]);
      const hands=[], arms=[];
      for(const s of [-1,1]){
        const AP=new THREE.Matrix4().makeTranslation(s*(tw+0.025),HY+th*1.62,0).multiply(M(0.05,0,s*0.15)), H=AP.clone().multiply(new THREE.Matrix4().makeTranslation(0,-0.448,0.088)).multiply(M(0.25,-s*0.4,s*0.12));
        const hF=SDF.blend([[SDF.ell(0,0,0,0.056*HS,0.066*HS,0.05*HS),0],[SDF.rcone(s*0.008*HS,-0.03*HS,0.004*HS,s*0.012*HS,-0.078*HS,0.03*HS,0.042*HS,0.035*HS),0.035*HS],
          [SDF.rcone(-s*0.03*HS,0,0.03*HS,-s*0.034*HS,-0.028*HS,0.058*HS,0.022*HS,0.017*HS),0.02*HS]]);
        arms.push({inv:AP.clone().invert(),f:armF}); hands.push({inv:H.clone().invert(),f:hF}); }
      const v=new THREE.Vector3();
      const parts=(X,Y,Z)=>{ const t=torF(X,Y-HY,Z), n=neckF(X,Y-HY,Z), l=Math.min(legF(X-0.11*w,(Y-HY)/LR,Z),legF(X+0.11*w,(Y-HY)/LR,Z))*Math.min(1,LR*0.85);
        let a=1e9, ay=0, h=1e9; for(let i=0;i<2;i++){ v.set(X,Y,Z).applyMatrix4(arms[i].inv); const d=arms[i].f(v.x,v.y,v.z); if(d<a){ a=d; ay=v.y; } v.set(X,Y,Z).applyMatrix4(hands[i].inv); h=Math.min(h,hands[i].f(v.x,v.y,v.z)); }
        return {t,n,l,a,ay,h}; };
      const F=(X,Y,Z)=>{ const q=parts(X,Y,Z); let d=SDF.smin(q.t,q.n,0.02); d=SDF.smin(d,q.l,0.045); return SDF.smin(d,SDF.smin(q.a,q.h,0.025),0.03); };
      const g=sdfGeo('kitbody|'+tag,F,[-0.62*w-0.1,0.06,-0.32],[0.62*w+0.1,HY+th*2.2,0.34]);
      const P=g.attributes.position, reg=[];
      for(let i=0;i<P.count;i++){ const q=parts(P.getX(i),P.getY(i),P.getZ(i)), m=Math.min(q.t,q.n,q.l,q.a,q.h);
        reg.push(m===q.h?4 : m===q.a?(q.ay>-0.2?2:3) : m===q.l?5 : m===q.n&&P.getY(i)>HY+th*1.72?0 : 1); }
      out['body_'+tag]=Object.assign(pack(g),{reg}); }
    SDF_CELL=0.024; return out; });
  for(const k in res){ fs.writeFileSync(path.join(OUT,k+'.json'),JSON.stringify(res[k])); console.log(k, res[k].idx.length/3,'tris'); }
  await b.close(); })();
