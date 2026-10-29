// =====================================================================
//  MODELS (world) — towers, spell objects, projectiles, scenery
// =====================================================================
function buildTower(theme,kind,team){
  const tc=TEAMC[team], g=G0(), R={banners:[],flags:[]};
  const king=kind==='king';
  const stone=mat('#ffffff',{s:18,map:stoneTex(theme.stone)}), stoneDk=mat(shade(theme.stone,0.72),{s:12});
  const tm=mat(tc.main,{s:55}), tmD=mat(tc.dark,{s:40}), trim=mat(theme.trim,{s:110,m:0.6});
  const wood=mat('#6b4423',{s:25}), iron=mat('#3a3a40',{s:70,m:0.5});
  const main=G0(); g.add(main); R.main=main;
  const W = king?3.1:2.25, Hh = king?2.5:2.65;
  P(main,'rboxS',stoneDk,W+0.3,0.4,W+0.3,0,0.2,0);
  P(main,'rboxS',stone,W,Hh,W,0,Hh/2+0.12,0);
  P(main,'rbox2',trim,W+0.1,0.12,W+0.1,0,Hh+0.06,0);
  P(main,'rboxS',tm,W+0.28,0.34,W+0.28,0,Hh+0.3,0);
  P(main,'rbox2',tmD,W+0.3,0.06,W+0.3,0,Hh+0.15,0);
  const mer=king?5:4;
  for(let i=0;i<mer;i++) for(const s of [-1,1]){
    const t=-W/2+0.12+i*(W-0.24)/(mer-1);
    P(main,'rboxS',tm,0.36,0.38,0.36,t,Hh+0.64,s*(W/2+0.04));
    if(i>0&&i<mer-1) P(main,'rboxS',tm,0.36,0.38,0.36,s*(W/2+0.04),Hh+0.64,t);
  }
  // arched door with iron bands, windows
  const dw=king?0.9:0.72;
  P(main,'rboxS',wood,dw,1.0*(king?1.2:1),0.12,0,0.62,W/2+0.01); P(main,'cyl',wood,dw/2,0.12,dw/2,0,1.12*(king?1.1:1),W/2+0.01,PI/2);
  for(const y of [0.4,0.85]) P(main,'rbox2',iron,dw+0.02,0.05,0.14,0,y,W/2+0.02);
  P(main,'sph',trim,0.05,0.05,0.04,dw*0.3,0.7,W/2+0.08);
  for(const s of [-1,1]){ P(main,'rboxS',mat('#2a1a10'),0.26,0.38,0.06,s*W*0.32,Hh*0.62,W/2+0.01); P(main,'cyl',mat('#ffcf6a',{e:0.9}),0.11,0.04,0.11,s*W*0.32,Hh*0.62+0.12,W/2+0.03,PI/2); }
  // emblem banners
  for(const s of (king?[-1,1]:[0])){
    const bn=new THREE.Mesh(geo('banner').clone(), mat('#ffffff',{map:bannerTex(team,theme.emoji,theme.trim),side:THREE.DoubleSide,s:30}));
    bn.scale.set(king?0.62:0.7,king?0.62:0.7,1); bn.position.set(s*W*0.3,Hh-0.42,W/2+0.06); bn.userData.noOutline=true; bn.name='rig:banner'+R.banners.length; main.add(bn); R.banners.push(bn);
    P(main,'cyl',trim,0.03,king?0.72:0.8,0.03,s*W*0.3,Hh-0.0,W/2+0.08,0,0,PI/2);
  }
  if(king){
    for(const sx of [-1,1]) for(const sz of [-1,1]){
      P(main,'cyl',stone,0.42,Hh+0.75,0.42,sx*W/2,(Hh+0.75)/2,sz*W/2); P(main,'tor',trim,0.43,0.43,0.25,sx*W/2,Hh+0.72,sz*W/2,PI/2);
      P(main,'roof',mat('#ffffff',{map:shingleTex(tc.main),s:40}),0.55,0.9,0.55,sx*W/2,Hh+0.78,sz*W/2);
      P(main,'cyl',trim,0.025,0.5,0.025,sx*W/2,Hh+1.9,sz*W/2);
      const fl=new THREE.Mesh(geo('banner').clone(), mat(tc.main,{side:THREE.DoubleSide,s:30})); fl.scale.set(0.4,0.22,1); fl.rotation.z=-PI/2; fl.position.set(sx*W/2+0.17,Hh+2.05,sz*W/2); fl.userData.noOutline=true; fl.name='rig:flag'+R.flags.length; main.add(fl); R.flags.push(fl);
    }
  }
  const top=Hh+0.5; R.topY=top;
  const def=getModel(king?theme.king:theme.archer,team);
  const ds = king ? 1.55 : 1.3;
  def.scale.multiplyScalar(ds); def.position.y=top+(king?0.05:0.15); g.add(def); R.defender=def;
  if(king){
    const can=G0(); can.position.set(0,top+0.35,0.9); g.add(can); R.cannon=can;
    P(can,'caps',mat('#2d2f36',{s:90,m:0.5}),0.4,0.48,0.4,0,0,0.35,PI/2); P(can,'cyl',mat('#2d2f36',{s:90,m:0.5}),0.26,0.14,0.26,0,0,0.78,PI/2); P(can,'sph',mat('#3b3f4a',{s:60}),0.3,0.3,0.3,0,0,0);
    P(can,'tor',trim,0.21,0.21,0.4,0,0,0.6); P(can,'tor',trim,0.21,0.21,0.4,0,0,0.15);
  }
  const rub=G0(); rub.visible=false; g.add(rub); R.rubble=rub;
  const rs=seeded(king?3:5);
  for(let i=0;i<11;i++){ const s=0.28+rs()*0.45; P(rub,'dodec',i%3?stoneDk:mat(shade(theme.stone,0.9),{s:12}),s,s*0.7,s,(rs()-0.5)*W*0.85,s*0.35,(rs()-0.5)*W*0.85,rs(),rs(),rs()); }
  { const f=G0(); f.position.set(0.3,0.2,0.2); rub.add(f); P(f,'cyl',metal('#888'),0.03,1.1,0.03,0,0.55,0,0,0,0.3); P(f,'rbox2',tm,0.42,0.28,0.02,0.33,0.9,0,0,0,0.3); }
  mergeRigid(main); mergeRigid(rub);
  if(QUALITY.outlines){ addOutlines(main,'#1c120c',0.12); }
  setShadows(main,QUALITY.shadows,QUALITY.shadows); setShadows(rub,QUALITY.shadows,QUALITY.shadows);
  g.userData.rig=R;
  return g;
}
function waveBanner(mesh,t,ph,amp=0.08){
  const p=mesh.geometry.attributes.position; if(!mesh.userData.base) mesh.userData.base=Float32Array.from(p.array);
  const b=mesh.userData.base;
  for(let i=0;i<p.count;i++){ const x=b[i*3], y=b[i*3+1]; const k=(0.72-y)/1.45; p.setZ(i,Math.sin(t*3+x*4+y*3+ph)*amp*k*2); }
  p.needsUpdate=true;
}

// ---------------------------------------------------------------- spell falling objects & projectiles
function buildFall(key,tc){
  const g=G0(); const c=x=>mat(colr(x,tc),{s:60});
  switch(key){
    case 'rally': P(g,'rbox2',mat('#c89820',{s:120,m:0.6}),2.2,2.6,0.16); P(g,'rbox2',mat('#b3202a',{s:30}),1.9,2.3,0.18); { const f=buildHuman({skin:'#f2c9a0',hair:['short','#151515'],hat:['peakcap','#3a4a2a'],outfit:['uniform','#3a4a2a','#c89820'],face:['shades'],medals:8},tc); f.scale.setScalar(1.6); f.position.set(0,-1.15,0.12); g.add(f); } break;
    case 'fireworkB': { const cols=['#ff2bd6','#ffd34d','#39ff14','#00e5ff','#ff6a00','#ffffff'], col=cols[(Math.random()*cols.length)|0]; P(g,'cyl',mat(col,{s:60,e:0.3}),0.15,0.6,0.15); P(g,'cone',mat('#ffd34d',{s:60}),0.16,0.25,0.16,0,0.42,0); P(g,'cyl',mat('#8a5a2b'),0.02,0.6,0.02,0,-0.55,0); g.userData.col=col; break; }
    case 'keg': { const kw=mat('#9a6a3a',{s:40}), hoop=mat('#6a6e75',{s:140,m:0.6}); P(g,'cyl',kw,0.72,1.5,0.72,0,0,0,0,0,PI/2); P(g,'sph',kw,0.78,0.78,0.78,0,0,0); for(const x of [-0.55,-0.2,0.2,0.55]) P(g,'torThin',hoop,0.78-Math.abs(x)*0.15,0.78-Math.abs(x)*0.15,0.6,x,0,0,0,PI/2);
      for(const s of [-1,1]) P(g,'cyl',mat('#7a4a22',{s:30}),0.6,0.04,0.6,s*0.75,0,0,0,0,PI/2); P(g,'cyl',mat('#c8a64a',{s:150,m:0.7}),0.08,0.12,0.08,0.78,0,0,0,0,PI/2); break; }
    case 'quiz': P(g,'rbox2',mat('#ffffff',{map:labelTex('?','#2f5fd0','#ffd34d'),s:30}),1.7,1.7,0.18); P(g,'rbox2',mat('#ffd34d',{s:60}),1.8,0.1,0.2,0,0.9,0); P(g,'rbox2',mat('#ffd34d',{s:60}),1.8,0.1,0.2,0,-0.9,0); break;
    case 'buzzball': { const cols=['#ff2bd6','#39ff14','#00e5ff','#ffea00','#ff6a00','#b04dff'], col=cols[(Math.random()*cols.length)|0];
      P(g,'sph',mat(col,{e:0.75,s:160}),0.42,0.42,0.42); P(g,'torThin',metal('#d8dde4'),0.2,0.2,0.4,0,0.38,0,PI/2); P(g,'cyl',metal('#d8dde4'),0.18,0.03,0.18,0,0.4,0); P(g,'rbox2',mat('#ffffff',{s:60}),0.6,0.12,0.02,0,0,0.42); g.userData.col=col; break; }
    case 'baseballBig': P(g,'sph',mat('#ffffff',{s:60}),0.75,0.75,0.75); for(const s of [-1,1]) P(g,'torThin',mat('#e5302a'),0.6,0.6,0.35,s*0.4,0,0,0,PI/2); break;
    case 'tarp': P(g,'rbox2',mat('#6b86a8',{s:30}),3.4,0.08,3.4,0,0,0,0.12,0.2,0); for(let i=0;i<4;i++) P(g,'box',mat('#e8e8e8',{s:20}),0.12,0.1,3.4,-1.3+i*0.87,0.02,0,0.12,0.2,0); break;
    case 'wavefans': for(let i=0;i<5;i++){ const x=-1.4+i*0.7; P(g,'cyl',mat(['#e5302a','#ffffff','#14264a'][i%3],{s:20}),0.22,0.7,0.22,x,0.35,0); P(g,'sph',mat('#e8b48a',{s:20}),0.2,0.2,0.2,x,0.85,0); for(const s of [-1,1]) P(g,'caps',mat('#e8b48a',{s:20}),0.05,0.35,0.05,x+s*0.2,1.05,0,0,0,-s*0.3); } break;
    case 'gavel': P(g,'cyl',c('#6b3d1f'),0.5,1.6,0.5,0,0.4,0,0,0,PI/2); P(g,'cyl',mat('#c8a64a',{s:120}),0.53,0.15,0.53,0.6,0.4,0,0,0,PI/2); P(g,'cyl',mat('#c8a64a',{s:120}),0.53,0.15,0.53,-0.6,0.4,0,0,0,PI/2); P(g,'cyl',c('#8a5a2b'),0.15,2.2,0.15,0,1.5,0); break;
    case 'paper': P(g,'box',mat('#ffffff'),0.6,0.04,0.8,0,0,0,0.3,0.4,0.2); P(g,'box',mat('#b3202a'),0.15,0.05,0.15,0.15,0.01,0.2); break;
    case 'arrowDown': P(g,'box',mat('#e5443f',{e:0.3}),0.6,2.2,0.3,0,1.5,0); P(g,'cone4',mat('#e5443f',{e:0.3}),1.0,1.0,0.3,0,0,0,PI,PI/4); break;
    case 'rock': P(g,'dodec',mat('#6b4a33',{flat:true,s:5}),1.0,0.9,1.0); P(g,'dodec',mat('#ff6a1f',{e:1,flat:true}),0.6,0.55,0.6,0.5,0.3,0.2); break;
    case 'drone': P(g,'rbox',mat('#333'),0.8,0.3,0.8); for(const sx of [-1,1]) for(const sz of [-1,1]){ P(g,'box',mat('#222'),0.6,0.05,0.06,sx*0.4,0.1,sz*0.4,0,sx*sz*PI/4); P(g,'cyl',mat('#aaa',{op:0.6}),0.3,0.02,0.3,sx*0.6,0.2,sz*0.6);} P(g,'sph',mat('#ff2b2b',{e:1}),0.1,0.1,0.1,0,-0.15,0.35); break;
    case 'pan': P(g,'cyl',mat('#2a2a2a'),1.0,0.15,1.0); P(g,'cyl',mat('#ff9a1f',{e:0.8}),0.85,0.16,0.85); P(g,'cyl',mat('#222'),0.1,1.2,0.1,0,0,1.5,PI/2); break;
    case 'tomato': P(g,'sph',mat('#e5302a',{s:90}),0.3,0.27,0.3); P(g,'cone4',mat('#2e8b2e'),0.15,0.1,0.15,0,0.27,0); break;
    case 'water': P(g,'sph',mat('#4fb8ff',{op:0.8,s:150}),1.0,0.9,1.0); P(g,'cone',mat('#4fb8ff',{op:0.8}),0.2,0.4,0.2,0,1.0,0); break;
    case 'fireball': P(g,'sph',mat('#ff6a1f',{e:1}),0.9,0.9,0.9); P(g,'sph',mat('#ffd24a',{e:1}),0.6,0.6,0.6,0,0,0.35); break;
    case 'wreck': P(g,'sph',mat('#2a2d35',{s:90}),0.9,0.9,0.9); P(g,'torThin',mat('#666'),0.95,0.95,0.95); P(g,'cyl',mat('#888'),0.08,0.4,0.08,0,1.05,0); break;
    case 'rocketBig': P(g,'caps',mat('#f2f2f2',{s:90}),0.9,1.6,0.9,0,1.2,0); P(g,'cone',mat('#e5443f',{s:60}),0.45,0.9,0.45,0,-0.1,0,PI); for(let i=0;i<4;i++){ const a=i/4*TAU; P(g,'rbox2',mat('#e5443f',{s:60}),0.05,0.6,0.45,Math.cos(a)*0.45,2.0,Math.sin(a)*0.45,0,-a); } P(g,'cyl',mat('#222'),0.46,0.08,0.46,0,0.9,0); P(g,'sph',mat('#ffb02e',{e:1}),0.4,0.7,0.4,0,2.6,0); break;
    case 'tv': P(g,'rboxS',mat('#2a2a2a',{s:60}),1.8,1.2,0.4); P(g,'box',mat('#ffffff',{map:labelTex('BREAKING','#e5302a','#ffffff'),basic:1}),1.5,0.9,0.42); P(g,'cyl',mat('#555'),0.03,0.6,0.03,-0.3,0.8,0,0,0,0.5); P(g,'cyl',mat('#555'),0.03,0.6,0.03,0.3,0.8,0,0,0,-0.5); break;
    case 'kickball': P(g,'sph',mat('#ffffff',{s:60}),0.7,0.7,0.7); for(let i=0;i<8;i++){ const a=i/8*TAU, b=(i%2)*0.6-0.3; P(g,'sphLo',mat('#151515'),0.22,0.22,0.22,Math.cos(a)*0.55,b,Math.sin(a)*0.55); } P(g,'sph',mat('#ff7a1a',{e:1,op:0.45}),0.95,0.95,0.95).userData.noOutline=true; break;
    case 'cage': { const cm=metal('#8a8f99'); P(g,'rbox2',cm,2.6,0.12,2.6,0,2.2,0); P(g,'rbox2',cm,2.6,0.12,2.6,0,0,0); for(let i=0;i<8;i++){ const a=i/8*TAU; P(g,'cyl',cm,0.05,2.2,0.05,Math.cos(a)*1.2,1.1,Math.sin(a)*1.2); } P(g,'sph',cm,0.15,0.15,0.15,0,2.35,0); break; }
    case 'beam': P(g,'rbox2',mat('#ff8a1f',{s:60}),0.3,0.3,1.6,0,0,0,0.3,0.6,0.2); break;
    case 'pin': P(g,'cyl',mat('#d8a868',{s:30}),0.7,2.4,0.7,0,0,0,0,0,PI/2); for(const s2 of [-1,1]) P(g,'cyl',mat('#b5803a',{s:30}),0.18,0.7,0.18,s2*1.5,0,0,0,0,PI/2); break;
    case 'zebra': { for(let i=0;i<3;i++){ const z=buildQuad({coat:'#f4f4f4',coat2:'#ffffff',tiger:true,ears:'pointy',tail:'whip',snout:0.22,size:1.4,len:1.05,legLen:0.3,mane:'#151515'},tc); z.position.set((i-1)*0.9,-0.9,(i%2)*0.4); z.rotation.y=PI; g.add(z); } break; }
    case 'footballBig': P(g,'sph',mat('#8a4a1f',{s:40}),0.6,0.6,1.0); for(let i=0;i<4;i++) P(g,'box',mat('#ffffff'),0.04,0.12,0.25,0,0.58,-0.3+i*0.2); P(g,'box',mat('#ffffff'),0.03,0.04,0.7,0,0.6,0); break;
    case 'bucket': P(g,'cyl',metal('#c0c6cc'),1.2,1.2,1.0,0,0.6,0,PI); P(g,'cyl',mat('#9fe6ff',{op:0.7}),0.95,0.1,0.95,0,0.05,0); for(let i=0;i<5;i++) P(g,'rbox2',mat('#dff8ff',{op:0.8,s:150}),0.3,0.3,0.3,Math.sin(i*2)*0.5,-0.3,Math.cos(i*2)*0.5,i,i,0); break;
    case 'basketBig': P(g,'sph',mat('#e8742a',{s:30}),1.0,1.0,1.0); P(g,'torThin',mat('#151515'),1.01,1.01,1.01); P(g,'torThin',mat('#151515'),1.01,1.01,1.01,PI/2); break;
    case 'paintcan': P(g,'cyl',metal('#c0c6cc'),0.8,1.1,0.8,0,0,0,PI); P(g,'cyl',mat(colr('T',tc),{s:80}),0.82,0.5,0.82,0,0,0,PI); P(g,'sph',mat('#ff3dce',{s:120}),0.7,0.3,0.7,0,-0.6,0); break;
    case 'paintblob': P(g,'sph',mat(['#ff3dce','#3dd6ff','#ffd34d','#39d353'][Math.random()*4|0],{s:120}),0.3,0.3,0.3); break;
    case 'frame': { const gm=gold(); for(const [x,z,w,d] of [[0,-1.3,2.8,0.25],[0,1.3,2.8,0.25],[-1.3,0,0.25,2.8],[1.3,0,0.25,2.8]]) P(g,'rbox2',gm,w,0.3,d,x,0,z); break; }
    case 'banana': for(let i=0;i<5;i++) P(g,'torHalf',mat('#ffd84a',{s:40}),0.3,0.3,0.6,Math.sin(i*1.3)*0.6,i*0.1,Math.cos(i*1.3)*0.6,PI/2,i,0); break;
    case 'heart': P(g,'sph',mat('#ff3d7f',{s:90}),0.22,0.22,0.16,-0.12,0.05,0); P(g,'sph',mat('#ff3d7f',{s:90}),0.22,0.22,0.16,0.12,0.05,0); P(g,'cone',mat('#ff3d7f',{s:90}),0.3,0.32,0.15,0,-0.18,0,PI); break;
    case 'pug': { const d=buildQuad({coat:'#d9b38a',coat2:'#e8c8a0',ears:'folded',earColor:'#3a2a1e',tail:'curl',snout:0.06,size:1.6,len:0.85,bigEyes:true,nose:'#222'},tc); d.position.y=-0.2; g.add(d); P(g,'sph',mat('#d9b38a',{s:14}),0.55,0.55,0.55,0,0.5,0); break; }
  }
  return g;
}
function buildProj(key,tc){
  const [shape,col,sz] = PROJ[key]||PROJ.cannon; const g=G0(); const glow=(PROJ[key]||[])[4]; const m=mat(colr(col,tc),{e:glow?0.9:0,s:80});
  switch(shape){
    case 'leaflet': P(g,'box',mat('#ffffff',{map:labelTex('LEADER!','#ffffff','#b3202a'),basic:1}),sz*1.6,sz*0.04,sz*1.1,0,0,0,0.3,0.4,0.2); break;
    case 'medal': P(g,'cyl',gold(),sz*0.7,sz*0.15,sz*0.7,0,0,0,PI/2); P(g,'rbox2',mat('#e5302a'),sz*0.5,sz*0.7,sz*0.05,0,sz*0.8,0); break;
    case 'pint': P(g,'cyl',mat('#e8a21c',{e:0.15,s:120}),sz*0.42,sz*1.1,sz*0.42); P(g,'cyl',mat('#fff8e6'),sz*0.46,sz*0.3,sz*0.46,0,sz*0.65,0); P(g,'cyl',mat('#e8f6ff',{op:0.35,s:160}),sz*0.5,sz*1.4,sz*0.5,0,sz*0.1,0).userData.noOutline=true; break;
    case 'poolball': { const pc=['#e5302a','#ffd21f','#2f5fd0','#6a1f8a','#ff7a1a','#2e9a3a','#7a1f2a','#151515'][(Math.random()*8)|0]; P(g,'sph',mat(pc,{s:200}),sz,sz,sz); P(g,'sph',mat('#ffffff',{s:60}),sz*0.45,sz*0.45,sz*0.2,0,0,sz*0.85); break; }
    case 'tray': P(g,'cyl',mat('#d8dee6',{s:150}),sz*0.9,sz*0.08,sz*0.9); for(let i=0;i<3;i++){ const a=i/3*TAU; P(g,'cyl',mat('#e8f6ff',{op:0.45,s:160}),sz*0.2,sz*0.6,sz*0.2,Math.cos(a)*sz*0.45,sz*0.3,Math.sin(a)*sz*0.45).userData.noOutline=true; } break;
    case 'stool': P(g,'cyl',mat('#7a1f2a',{s:30}),sz*0.75,sz*0.2,sz*0.75,0,sz*0.6,0); for(let i=0;i<3;i++){ const a=i/3*TAU; P(g,'cyl',mat('#8a5a2b'),sz*0.07,sz*1.2,sz*0.07,Math.cos(a)*sz*0.4,0,Math.sin(a)*sz*0.4); } break;
    case 'yorkshire': P(g,'tor',mat('#d89a48',{s:30}),sz*0.75,sz*0.75,sz*0.9,0,0,0,PI/2); P(g,'cyl',mat('#b8762a',{s:20}),sz*0.6,sz*0.2,sz*0.6,0,-sz*0.15,0); P(g,'cyl',mat('#6a3a14',{s:80}),sz*0.45,sz*0.1,sz*0.45,0,0,0); break;
    case 'sphere': P(g,'sph',m,sz,sz,sz); break;
    case 'box': P(g,'rbox2',m,sz*1.2,sz*0.8,sz*1.4); break;
    case 'cyl': P(g,'cyl',m,sz*0.4,sz*2,sz*0.4,0,0,0,0,0,PI/2); break;
    case 'gavel': P(g,'cyl',m,sz*0.35,sz*1.0,sz*0.35,0,0,0,0,0,PI/2); P(g,'cyl',mat('#8a5a2b'),sz*0.1,sz*1.2,sz*0.1,0,-sz*0.6,0); break;
    case 'coin': P(g,'cyl',m,sz,sz*0.25,sz,0,0,0,PI/2); break;
    case 'goldbar': P(g,'rbox2',m,sz*0.8,sz*0.4,sz*1.3); break;
    case 'bolt': P(g,'sph',m,sz*0.5,sz*0.5,sz*2.2); break;
    case 'rocket': P(g,'cyl',mat('#f2f2f2'),sz*0.35,sz*1.6,sz*0.35,0,0,0,PI/2); P(g,'cone',m,sz*0.35,sz*0.6,sz*0.35,0,0,sz*1.1,PI/2); break;
    case 'flask': P(g,'sph',m,sz*0.7,sz*0.7,sz*0.7); P(g,'cyl',mat('#e8ffe0',{op:0.8}),sz*0.2,sz*0.6,sz*0.2,0,sz*0.6,0); break;
    case 'dart': P(g,'cyl',m,sz*0.12,sz*1.6,sz*0.12,0,0,0,PI/2); P(g,'cone',mat('#ff6b9a'),sz*0.25,sz*0.5,sz*0.25,0,0,-sz*0.8,-PI/2); break;
    case 'pill': P(g,'sph',m,sz*0.5,sz*0.5,sz); P(g,'sph',mat('#ffffff'),sz*0.51,sz*0.51,sz*0.5,0,0,-sz*0.5); break;
    case 'cake': P(g,'cyl',mat('#f5d0a0'),sz,sz*0.6,sz); P(g,'cyl',m,sz*1.02,sz*0.25,sz*1.02,0,sz*0.35,0); break;
    case 'star': P(g,'oct',m,sz,sz,sz*0.4); break;
    case 'knife': P(g,'box',mat('#c9d1db',{s:120}),sz*0.15,sz*0.4,sz*1.6); break;
    case 'egg': P(g,'sph',m,sz*0.8,sz,sz*0.8); break;
    case 'tnt': P(g,'cyl',m,sz*0.4,sz*1.4,sz*0.4); P(g,'sph',mat('#ffd24a',{e:1}),sz*0.15,sz*0.15,sz*0.15,0,sz*0.8,0); break;
    case 'note': P(g,'sph',m,sz*0.5,sz*0.4,sz*0.4); P(g,'box',m,sz*0.1,sz*1.2,sz*0.1,sz*0.4,sz*0.6,0); break;
    case 'pick': P(g,'cone',m,sz*0.8,sz*1.2,sz*0.2,0,0,0,PI/2); break;
    case 'ring': P(g,'tor',m,sz*0.8,sz*0.8,sz*0.8,0,0,0,0,0,0); break;
    case 'ball': P(g,'sph',m,sz,sz,sz); for(let i=0;i<5;i++){ const a=i/5*TAU; P(g,'sphLo',mat('#151515'),sz*0.3,sz*0.3,sz*0.3,Math.cos(a)*sz*0.75,Math.sin(a)*sz*0.75,sz*0.3); } break;
    case 'heart': P(g,'sph',m,sz*0.55,sz*0.55,sz*0.4,-sz*0.3,sz*0.1,0); P(g,'sph',m,sz*0.55,sz*0.55,sz*0.4,sz*0.3,sz*0.1,0); P(g,'cone',m,sz*0.78,sz*0.8,sz*0.38,0,-sz*0.42,0,PI); break;
    case 'banana': P(g,'torHalf',m,sz*0.8,sz*0.8,sz*1.6,0,0,0,0,0,0); break;
    case 'puff': P(g,'puff',m,sz,sz*0.9,sz); break;
    case 'hotdog': P(g,'caps',mat('#e8b868',{s:30}),sz*0.35,sz*1.3,sz*0.35,0,0,0,PI/2); P(g,'caps',mat('#c8432a',{s:40}),sz*0.28,sz*1.5,sz*0.28,0,sz*0.25,0,PI/2); break;
    case 'baseball': P(g,'sph',m,sz,sz,sz); for(const s of [-1,1]) P(g,'torThin',mat('#e5302a'),sz*0.7,sz*0.7,sz*0.5,s*sz*0.45,0,0,0,PI/2); break;
    case 'pizza': P(g,'cyl',mat('#f2b24a',{s:30}),sz,sz*0.12,sz); P(g,'cyl',mat('#e5443f',{s:60}),sz*0.88,sz*0.13,sz*0.88,0,0.005,0); for(let i=0;i<6;i++){ const a=i/6*TAU; P(g,'cylLo',mat('#a8202a'),sz*0.16,sz*0.14,sz*0.16,Math.cos(a)*sz*0.5,0.01,Math.sin(a)*sz*0.5); } break;
  }
  return g;
}

// ---------------------------------------------------------------- scenery (around the arena)
function buildDeco(key,theme,rnd){
  const g=G0(); const c=x=>mat(x,{s:30});
  switch(key){
    case 'redBanner': P(g,'cyl',c('#c89820'),0.06,4.2,0.06,0,2.1,0); P(g,'rbox2',c('#c89820'),1.4,0.08,0.08,0,4.0,0); P(g,'rbox2',c('#b3202a'),1.2,2.6,0.04,0,2.65,0.06); P(g,'cyl',mat('#ffd34d',{s:120,m:0.5}),0.35,0.04,0.35,0,3.1,0.1,PI/2); P(g,'oct',mat('#ffd34d',{s:120,m:0.5}),0.2,0.2,0.05,0,3.1,0.13); break;
    case 'statueGold': { const st=buildHuman({skin:'#e8b830',hair:['short','#e8b830'],hat:['peakcap','#e8b830'],outfit:['uniform','#e8b830','#c89820'],pants:'#e8b830',statue:true},TEAMC[0]); st.traverse(o=>{ if(o.isMesh) o.material=mat('#f2c23a',{s:150,m:0.75,e:0.08}); }); st.userData.rig.armR.rotation.x=-2.6; st.scale.setScalar(2.2); st.position.y=0.8; g.add(st); P(g,'rboxS',c('#e8e0d0'),1.3,0.8,1.3,0,0.4,0); break; }
    case 'fountain': P(g,'cyl',c('#e8e0d0'),1.3,0.4,1.3,0,0.2,0); P(g,'cyl',mat('#4fb8ff',{op:0.8,s:150}),1.15,0.05,1.15,0,0.38,0); P(g,'cyl',c('#e8e0d0'),0.15,1.2,0.15,0,0.9,0); P(g,'cyl',c('#e8e0d0'),0.55,0.12,0.55,0,1.5,0); P(g,'sph',mat('#9fe6ff',{op:0.6}),0.2,0.35,0.2,0,1.75,0); break;
    case 'pubsign': P(g,'cyl',c('#2a1a10'),0.08,3.2,0.08,0,1.6,0); P(g,'rbox2',c('#2a1a10'),1.5,0.08,0.08,0.7,3.0,0); P(g,'rbox2',c('#c8a64a'),1.5,1.1,0.12,0.75,2.25,0); P(g,'box',mat('#ffffff',{map:labelTex('JOBLESS ARMS','#14264a','#ffd34d'),basic:1}),1.35,0.95,0.14,0.75,2.25,0); break;
    case 'kegs': { const kw=c('#9a6a3a'), hoop=mat('#55585e',{s:120,m:0.5}); for(let i=0;i<3;i++){ const x=(i-1)*0.85; P(g,'cyl',kw,0.4,0.9,0.4,x,0.45,0); for(const y of [0.15,0.75]) P(g,'torThin',hoop,0.41,0.41,0.4,x,y,0,PI/2); } P(g,'cyl',kw,0.4,0.9,0.4,-0.42,0.42,0.75,PI/2); P(g,'cyl',kw,0.4,0.9,0.4,0.42,0.42,0.75,PI/2); break; }
    case 'bench': { const wd=c('#8a5a2b'); P(g,'rbox2',wd,1.8,0.08,0.8,0,0.75,0); for(const s of [-1,1]){ P(g,'rbox2',wd,1.8,0.06,0.3,0,0.42,s*0.65); P(g,'rbox2',wd,0.08,0.8,1.6,s*0.7,0.38,0,0.4); } P(g,'cyl',c('#ddd'),0.03,1.6,0.03,0,1.5,0); P(g,'cone',mat(rnd()<0.5?'#e5302a':'#2e6a3a',{s:20}),1.3,0.45,1.3,0,2.3,0); P(g,'cyl',mat('#e8a21c',{e:0.15}),0.06,0.15,0.06,0.4,0.86,0.1); P(g,'cyl',mat('#fff8e6'),0.065,0.03,0.065,0.4,0.95,0.1); break; }
    case 'dartboard': P(g,'cyl',c('#2a1a10'),0.06,1.8,0.06,0,0.9,-0.1); for(let i=0;i<4;i++) P(g,'cyl',mat(i%2?'#e8e0c8':'#151515',{s:20}),0.55-i*0.13,0.06+i*0.005,0.55-i*0.13,0,1.7,0,PI/2); P(g,'cyl',mat('#e5302a'),0.06,0.09,0.06,0,1.7,0,PI/2); for(let i=0;i<3;i++) P(g,'cyl',metal(),0.012,0.25,0.012,-0.1+i*0.1,1.75+i*0.04,0.12,PI/2.4); break;
    case 'scoreboard': P(g,'rbox2',c('#14264a'),3.0,1.5,0.25,0,2.2,0); P(g,'box',c('#0a0f1e'),2.7,1.2,0.05,0,2.2,0.14); for(let i=0;i<6;i++) P(g,'box',mat(i%2?'#ffd34d':'#39ff6a',{e:0.9}),0.3,0.4,0.04,-1.1+i*0.44,2.35,0.18); for(let i=0;i<3;i++) P(g,'sph',mat('#e5302a',{e:1}),0.07,0.07,0.04,-0.4+i*0.4,1.85,0.18); for(const s of [-1,1]) P(g,'cyl',c('#555'),0.08,1.6,0.08,s*1.1,0.8,0); break;
    case 'bases': P(g,'rbox2',c('#e8e4d4'),0.9,0.06,0.9,0,0.04,0,0,PI/4); P(g,'cyl',c('#c98a4a'),1.2,0.03,1.2,0,0.02,0); break;
    case 'dugout': P(g,'rbox2',c('#14264a'),2.4,0.12,1.1,0,1.4,0); for(const s of [-1,1]) P(g,'cyl',c('#555'),0.05,1.4,0.05,s*1.1,0.7,0.45); P(g,'rbox2',c('#8a5a2b'),2.0,0.1,0.35,0,0.45,-0.1); P(g,'rbox2',c('#8a5a2b'),2.0,0.45,0.08,0,0.8,-0.35); for(let i=0;i<4;i++) P(g,'rbox2',c('#e8c890'),0.05,0.8,0.05,-0.7+i*0.45,0.45,0.35,0.5,0,0.2); break;
    case 'column': P(g,'cyl',c('#f2efe8'),0.45,3.2,0.45,0,1.6,0); P(g,'rbox2',c('#e2ddd0'),1.2,0.3,1.2,0,0.15,0); P(g,'rbox2',c('#e2ddd0'),1.2,0.3,1.2,0,3.3,0); for(let i=0;i<8;i++){ const a=i/8*TAU; P(g,'box',c('#d8d2c4'),0.06,3.0,0.06,Math.cos(a)*0.44,1.6,Math.sin(a)*0.44); } break;
    case 'scales': P(g,'cyl',mat('#c8a64a',{s:120}),0.08,2.2,0.08,0,1.1,0); P(g,'box',mat('#c8a64a',{s:120}),2,0.08,0.08,0,2.2,0); for(const s of [-1,1]){ P(g,'cyl',mat('#c8a64a',{s:120}),0.4,0.06,0.4,s*0.9,1.6,0); P(g,'cylLo',mat('#888'),0.01,0.6,0.01,s*0.9,1.9,0);} P(g,'rbox2',c('#3b2a1e'),0.8,0.3,0.8,0,0.15,0); break;
    case 'books': for(let i=0;i<5;i++) P(g,'rbox2',c(['#7a1f1f','#1f3a7a','#2e5a2e','#5a3a1e','#7a5a1f'][i]),1.2-i*0.05,0.25,0.9,0,0.12+i*0.26,0,0,i*0.2); break;
    case 'gavelBlock': P(g,'cyl',c('#6b3d1f'),0.7,0.3,0.7,0,0.15,0); P(g,'cyl',c('#6b3d1f'),0.25,1.4,0.25,0.2,0.65,0,0,0,PI/2); break;
    case 'coins': for(let i=0;i<3;i++){ const h=0.6+rnd()*1.6; P(g,'cyl',mat('#ffc93d',{s:120,e:0.1}),0.45,h,0.45,(i-1)*0.9,h/2,rnd()*0.4); } break;
    case 'ticker': P(g,'rbox2',c('#151515'),2.6,1.6,0.2,0,1.6,0); P(g,'cyl',c('#333'),0.08,0.8,0.08,0,0.4,0); for(let i=0;i<6;i++){ const h=0.2+rnd()*0.9, up=rnd()<0.6; P(g,'box',mat(up?'#39ff6a':'#ff3b3b',{e:0.9}),0.25,h,0.05,-1.0+i*0.4,1.0+h/2,0.12);} break;
    case 'goldbars': for(let i=0;i<6;i++) P(g,'rbox2',mat('#ffc93d',{s:120,e:0.1}),0.7,0.3,0.35,(i%3-1)*0.75+(i>2?0.37:0),0.15+(i>2?0.3:0),0); break;
    case 'bullStatue': { const b=buildQuad({coat:'#c99a1e',coat2:'#b8860b',ears:'horns',tail:'whip',snout:0.2,size:2.5,len:1.2,legLen:0.3},TEAMC[0]); b.traverse(o=>{ if(o.isMesh) o.material=mat('#d8a62a',{s:140,e:0.08}); }); g.add(b); P(g,'rbox2',c('#333'),2,0.3,3,0,0.15,0); break; }
    case 'rocket': P(g,'cyl',c('#f2f2f2'),0.5,3.0,0.5,0,1.8,0); P(g,'cone',c('#e5443f'),0.5,1.1,0.5,0,3.85,0); for(let i=0;i<3;i++){ const a=i/3*TAU; P(g,'box',c('#e5443f'),0.08,0.8,0.6,Math.cos(a)*0.55,0.6,Math.sin(a)*0.55,0,-a); } P(g,'cyl',c('#2a3a55'),0.2,0.06,0.2,0,2.6,0.48,PI/2); break;
    case 'crater': P(g,'tor',c('#8a8f99'),0.9,0.9,0.6,0,0.05,0,PI/2); P(g,'circle',c('#6d727c'),0.9,0.9,1,0,0.03,0,-PI/2); break;
    case 'dish': P(g,'cyl',c('#ccc'),0.1,1.2,0.1,0,0.6,0); P(g,'dish',c('#f0f0f0'),1.0,1.0,1.0,0,1.4,0,-PI/3); break;
    case 'flagpole': P(g,'cyl',c('#ccc'),0.04,2.4,0.04,0,1.2,0); P(g,'box',c('#2f80ed'),0.9,0.55,0.03,0.45,2.1,0); break;
    case 'suv': { const v=buildVehicle({type:'van',color:'#151515'},TEAMC[rnd()<0.5?0:1]); v.rotation.y=rnd()*TAU; g.add(v); break; }
    case 'sandbags': for(let i=0;i<7;i++) P(g,'sph',c('#b8a37a'),0.4,0.2,0.25,(i%4-1.5)*0.6+(i>3?0.3:0),0.18+(i>3?0.35:0),0); break;
    case 'tape': for(const s of [-1,1]) P(g,'cyl',c('#ff8a1f'),0.08,1.1,0.08,s*1.2,0.55,0); P(g,'box',mat('#ffd21f',{e:0.2}),2.4,0.15,0.02,0,0.9,0); break;
    case 'lamp': P(g,'cyl',c('#333'),0.06,3,0.06,0,1.5,0); P(g,'cone',c('#333'),0.35,0.3,0.35,0,3.0,0); P(g,'sph',mat('#fff2a8',{e:1}),0.18,0.12,0.18,0,2.85,0); break;
    case 'barrel': P(g,'cyl',c('#ffd21f'),0.5,1.1,0.5,0,0.55,0); P(g,'cyl',c('#222'),0.51,0.15,0.51,0,0.6,0); P(g,'cyl',mat('#7dff4a',{e:0.9}),0.42,0.04,0.42,0,1.11,0); break;
    case 'tank': P(g,'cyl',mat('#7dff4a',{op:0.55,e:0.5}),0.7,2.4,0.7,0,1.4,0); P(g,'cyl',c('#5d6b64'),0.8,0.3,0.8,0,0.15,0); P(g,'cyl',c('#5d6b64'),0.8,0.2,0.8,0,2.65,0); P(g,'sph',mat('#3a8a2a',{e:0.3}),0.3,0.3,0.3,0,1.4,0); break;
    case 'tubes': P(g,'rbox2',c('#5d6b64'),1.6,0.2,0.5,0,0.6,0); for(let i=0;i<5;i++) P(g,'cyl',mat(['#7dff4a','#ff3dce','#5ad1ff','#ffd21f','#7dff4a'][i],{op:0.8,e:0.6}),0.1,0.7,0.1,-0.6+i*0.3,0.95,0); P(g,'box',c('#5d6b64'),0.1,0.6,0.1,-0.75,0.3,0); P(g,'box',c('#5d6b64'),0.1,0.6,0.1,0.75,0.3,0); break;
    case 'bed': P(g,'rbox2',c('#e8eef2'),1.1,0.3,2.0,0,0.6,0); P(g,'rbox2',c('#ffffff'),0.8,0.15,0.45,0,0.82,-0.7); P(g,'rbox2',c('#7ab8e6'),1.12,0.12,1.2,0,0.78,0.35); for(const sx of [-1,1]) for(const sz of [-1,1]) P(g,'cyl',c('#aaa'),0.04,0.5,0.04,sx*0.5,0.25,sz*0.9); break;
    case 'cross': P(g,'box',mat('#e5443f',{e:0.2}),0.4,1.3,0.25,0,1.5,0); P(g,'box',mat('#e5443f',{e:0.2}),1.3,0.4,0.25,0,1.5,0); P(g,'cyl',c('#ccc'),0.05,0.9,0.05,0,0.45,0); break;
    case 'iv': P(g,'cyl',c('#ccc'),0.03,2,0.03,0,1,0); P(g,'rbox2',mat('#bfe8ff',{op:0.7}),0.25,0.35,0.08,0.15,1.8,0); P(g,'cyl',c('#ccc'),0.35,0.04,0.35,0,0.02,0); break;
    case 'pot': P(g,'cyl',c('#9aa3ad'),0.9,1.0,0.9,0,0.5,0); P(g,'cyl',mat('#ff9a1f',{e:0.6}),0.82,0.05,0.82,0,1.0,0); for(const s of [-1,1]) P(g,'box',c('#555'),0.3,0.1,0.15,s*1.0,0.85,0); break;
    case 'tomato': P(g,'sph',mat('#e5302a',{s:90}),0.8,0.7,0.8,0,0.7,0); P(g,'cone4',c('#2e8b2e'),0.35,0.2,0.35,0,1.4,0); break;
    case 'cheese': P(g,'cone4',c('#ffcf3d'),1.0,0.9,1.0,0,0.45,0); for(let i=0;i<3;i++) P(g,'sph',c('#e0a82a'),0.12,0.12,0.06,(i-1)*0.3,0.4,0.55); break;
    case 'knife': P(g,'box',mat('#c9d1db',{s:150}),0.08,0.4,2.2,0,0.25,0,0,0.3); P(g,'rbox2',c('#3a2414'),0.18,0.3,0.8,0.45,0.2,-1.4,0,0.3); break;
    case 'hydrantD': P(g,'cyl',c('#d8322a'),0.32,0.9,0.32,0,0.45,0); P(g,'hemi',c('#d8322a'),0.33,0.25,0.33,0,0.9,0); for(const s of [-1,1]) P(g,'cyl',c('#c8a64a'),0.08,0.15,0.08,s*0.36,0.6,0,0,0,PI/2); break;
    case 'flames': for(let i=0;i<3;i++) P(g,'cone',mat(i?'#ffb02e':'#ff4a1a',{e:1}),0.4-i*0.1,1.4-i*0.3,0.4-i*0.1,(i-1)*0.25,0.7-i*0.15,0); g.userData.flicker=true; break;
    case 'hose': P(g,'tor',c('#d8322a'),0.6,0.6,1.5,0,0.4,0,PI/2); P(g,'cyl',c('#555'),0.15,0.3,0.15,0,0.4,0); break;
    case 'cone': P(g,'cone',c('#ff7a1a'),0.3,0.8,0.3,0,0.45,0); P(g,'cyl',mat('#ffffff'),0.21,0.12,0.21,0,0.5,0); P(g,'rbox2',c('#ff7a1a'),0.7,0.06,0.7,0,0.03,0); break;
    case 'crate': P(g,'rbox2',c('#b07a45'),1,1,1,0,0.5,0); P(g,'box',c('#8a5a2b'),1.02,0.12,1.02,0,0.5,0); P(g,'box',c('#8a5a2b'),0.12,1.02,1.02,0,0.5,0); break;
    case 'bricks': for(let i=0;i<9;i++) P(g,'rbox2',c('#b5533c'),0.5,0.24,0.25,(i%3-1)*0.52,0.12+Math.floor(i/3)*0.25,0); break;
    case 'crane': P(g,'box',c('#ffb02e'),0.3,6,0.3,0,3,0); P(g,'box',c('#ffb02e'),4,0.25,0.25,1.2,6,0); P(g,'cyl',c('#333'),0.02,2,0.02,2.8,5,0); P(g,'box',c('#555'),0.6,0.4,0.6,-0.6,5.7,0); break;
    case 'speaker': P(g,'rbox2',c('#151515'),1.2,2.0,0.9,0,1.0,0); for(const y of [0.55,1.45]){ P(g,'cyl',c('#333'),0.4,0.05,0.4,0,y,0.46,PI/2); P(g,'cyl',mat('#ff3dce',{e:0.6}),0.12,0.06,0.12,0,y,0.48,PI/2);} break;
    case 'spot': P(g,'cyl',c('#222'),0.06,3,0.06,0,1.5,0); P(g,'cyl',c('#333'),0.3,0.4,0.3,0,3.1,0,0.6); break;
    case 'amp': P(g,'rbox2',c('#222'),1.4,1.0,0.7,0,0.5,0); P(g,'box',c('#bfa07a'),1.2,0.6,0.02,0,0.45,0.36); P(g,'box',c('#ffd34d'),1.2,0.1,0.02,0,0.88,0.36); break;
    case 'tree': P(g,'cyl',c('#7a5128'),0.18,1.2,0.18,0,0.6,0); P(g,'sph',c('#3f8f35'),0.9,0.8,0.9,0,1.6,0); P(g,'sph',c('#4fa83f'),0.6,0.55,0.6,0.35,2.1,0.2); P(g,'sph',c('#3a8030'),0.55,0.5,0.55,-0.4,1.9,-0.2); break;
    case 'bone': P(g,'cyl',c('#f6efe0'),0.12,1.0,0.12,0,0.15,0,0,0,PI/2); for(const s of [-1,1]) for(const z of [-1,1]) P(g,'sph',c('#f6efe0'),0.15,0.15,0.15,s*0.5,0.15,z*0.1); break;
    case 'floodlight': P(g,'cyl',c('#c0c6cc'),0.1,5,0.1,0,2.5,0); P(g,'rbox2',c('#2a2a2a'),1.6,0.8,0.2,0,5.2,0.1,0.3); for(let i=0;i<6;i++) P(g,'cyl',mat('#ffffe8',{e:1}),0.15,0.04,0.15,-0.6+(i%3)*0.6,5.0+Math.floor(i/3)*0.35,0.22,PI/2-0.3); break;
    case 'goalpost': for(const s of [-1,1]) P(g,'cyl',c('#ffffff'),0.07,1.6,0.07,s*1.4,0.8,0); P(g,'cyl',c('#ffffff'),0.07,2.9,0.07,0,1.6,0,0,0,PI/2); P(g,'box',mat('#ffffff',{op:0.35}),2.8,1.5,0.02,0,0.8,-0.6); break;
    case 'bleachers': for(let i=0;i<4;i++){ P(g,'rbox2',c('#9aa3ad'),3,0.15,0.5,0,0.3+i*0.4,-i*0.5); for(let k=0;k<5;k++) if(rnd()<0.7){ const col=['#e5443f','#2f80ed','#ffd34d','#39d353'][(i+k)%4]; P(g,'sph',c(col),0.14,0.18,0.14,-1.2+k*0.6,0.55+i*0.4,-i*0.5); P(g,'sph',c('#f2c9a0'),0.1,0.1,0.1,-1.2+k*0.6,0.8+i*0.4,-i*0.5); } } break;
    case 'trophyD': P(g,'rbox2',c('#3a2a1e'),0.8,0.4,0.8,0,0.2,0); P(g,'cyl',gold(),0.12,0.5,0.12,0,0.65,0); P(g,'cone',gold(),0.45,0.6,0.45,0,1.2,0,PI); for(const s of [-1,1]) P(g,'torHalf',gold(),0.2,0.2,0.4,s*0.42,1.2,0,0,0,s*PI/2); break;
    case 'easel': for(const [x,z] of [[-0.4,0.2],[0.4,0.2],[0,-0.3]]) P(g,'cyl',c('#8a5a2b'),0.04,2,0.04,x,1,z,z<0?-0.2:0.1); P(g,'rbox2',c('#ffffff'),1.1,0.8,0.05,0,1.4,0.25,-0.1); for(let i=0;i<4;i++) P(g,'sph',mat(['#ff3dce','#3dd6ff','#ffd34d','#39d353'][i],{s:40}),0.15,0.12,0.03,-0.3+i*0.2,1.4+Math.sin(i)*0.15,0.29); break;
    case 'statueD': { const st=buildHuman({skin:MARBLE,hair:['messy',MARBLE],outfit:['toga',MARBLE,'#d8d2c4'],pants:MARBLE,statue:true},TEAMC[0]); st.scale.setScalar(1.7); st.position.y=0.6; g.add(st); P(g,'rboxS',c('#d8d2c4'),1,0.6,1,0,0.3,0); break; }
    case 'frameD': P(g,'rbox2',gold(),1.8,1.4,0.15,0,1.6,0); P(g,'rbox2',c(['#3a7bd5','#e5443f','#39d353'][Math.floor(rnd()*3)]),1.5,1.1,0.17,0,1.6,0); P(g,'cyl',c('#555'),0.03,1,0.03,0,0.5,0); break;
    case 'paintpots': for(let i=0;i<4;i++){ P(g,'cyl',metal('#c0c6cc'),0.25,0.4,0.25,(i%2-0.5)*0.6,0.2,(i>1?0.5:-0.1)); P(g,'cyl',mat(['#ff3dce','#3dd6ff','#ffd34d','#39d353'][i],{s:100}),0.26,0.05,0.26,(i%2-0.5)*0.6,0.4,(i>1?0.5:-0.1)); } break;
    case 'movieCam': for(const [x,z] of [[-0.4,0.3],[0.4,0.3],[0,-0.4]]) P(g,'cyl',c('#333'),0.04,1.4,0.04,x*0.5,0.7,z*0.5); P(g,'rbox2',c('#2a2a2a'),0.6,0.5,1.0,0,1.6,0); P(g,'cyl',c('#111'),0.2,0.4,0.2,0,1.6,0.65,PI/2); for(const z of [-0.2,0.25]) P(g,'cyl',c('#2a2a2a'),0.3,0.08,0.3,0,2.05,z,0,0,PI/2); break;
    case 'clapper': P(g,'rbox2',c('#151515'),1.2,0.9,0.1,0,0.6,0); for(let i=0;i<5;i++) P(g,'box',c(i%2?'#151515':'#ffffff'),0.24,0.2,0.11,-0.48+i*0.24,1.2,0,0,0,0.2); break;
    case 'dirChair': P(g,'rbox2',c('#151515'),0.9,0.08,0.8,0,0.8,0); P(g,'rbox2',c('#151515'),0.9,0.6,0.06,0,1.2,-0.4); P(g,'box',mat('#ffffff',{map:labelTex('DIRECTOR','#151515','#ffffff'),basic:1}),0.8,0.2,0.07,0,1.25,-0.4); for(const s of [-1,1]) P(g,'box',c('#8a5a2b'),0.06,0.9,0.9,s*0.42,0.45,0,0,0,0); break;
    case 'ringlight': P(g,'cyl',c('#333'),0.05,2.2,0.05,0,1.1,0); P(g,'tor',mat('#ffffff',{e:1}),0.6,0.6,0.4,0,2.5,0); P(g,'rbox2',c('#111'),0.25,0.45,0.03,0,2.5,0); break;
    case 'phoneD': P(g,'rboxS',c('#151515'),1.2,2.2,0.2,0,1.2,0,0,0,0.1); P(g,'box',mat('#ff8fd0',{e:0.6}),1.0,1.9,0.02,0,1.2,0.11,0,0,0.1); P(g,'sph',mat('#ffffff',{e:0.8}),0.2,0.18,0.03,0.05,1.3,0.13); break;
    case 'heartBalloon': P(g,'cyl',c('#ffffff'),0.01,2,0.01,0,1,0); P(g,'sph',mat('#ff3d7f',{s:120}),0.4,0.4,0.3,-0.22,2.4,0); P(g,'sph',mat('#ff3d7f',{s:120}),0.4,0.4,0.3,0.22,2.4,0); P(g,'cone',mat('#ff3d7f',{s:120}),0.58,0.6,0.29,0,1.95,0,PI); break;
    case 'neonSign': P(g,'rbox2',c('#2a1a3a'),2.2,1.0,0.15,0,1.8,0); P(g,'box',mat('#ffffff',{map:labelTex('LIVE ●','#2a1a3a','#ff6bd5'),basic:1}),2.0,0.8,0.17,0,1.8,0); for(const s of [-1,1]) P(g,'cyl',c('#333'),0.04,1.3,0.04,s*0.9,0.65,0); break;
    case 'palm': P(g,'cyl',c('#8a5a2b'),0.15,3,0.18,0,1.5,0,0,0,0.1); for(let i=0;i<7;i++){ const a=i/7*TAU; P(g,'sph',c('#3a9a3a'),0.9,0.08,0.28,Math.cos(a)*0.7+0.15,3.0-0.15,Math.sin(a)*0.7,0,-a,-0.4); } break;
    case 'rockD': P(g,'dodec',mat('#8a8070',{s:10,flat:true}),1.0,0.7,0.9,0,0.4,0); P(g,'dodec',mat('#9a9080',{s:10,flat:true}),0.6,0.45,0.6,0.7,0.25,0.3); break;
    case 'zooSign': for(const s of [-1,1]) P(g,'cyl',c('#6b4423'),0.08,2,0.08,s*1.0,1,0); P(g,'rbox2',c('#3a8a2a'),2.4,0.7,0.12,0,1.9,0); P(g,'box',mat('#ffffff',{map:labelTex('ZOO 🦁','#3a8a2a','#ffffff'),basic:1}),2.2,0.55,0.13,0,1.9,0); break;
    case 'bamboo': for(let i=0;i<5;i++){ const x=(i-2)*0.3, h=2+((i*37)%10)*0.15; P(g,'cyl',c('#7ab84a'),0.08,h,0.08,x,h/2,(i%2)*0.2); for(let k=1;k<4;k++) P(g,'cyl',c('#5a9a3a'),0.09,0.04,0.09,x,k*h/4,(i%2)*0.2); P(g,'sph',c('#5aa83a'),0.3,0.06,0.12,x+0.2,h-0.2,(i%2)*0.2,0,0,0.4); } break;
    case 'podium': P(g,'rbox2',c('#6b4423'),1.1,1.3,0.7,0,0.65,0); P(g,'rbox2',c('#2f5fd0'),0.9,0.35,0.02,0,0.9,0.36); for(let i=0;i<5;i++) P(g,'sph',c('#ffffff'),0.04,0.04,0.02,-0.3+i*0.15,0.9,0.38); P(g,'cyl',c('#333'),0.02,0.5,0.02,0,1.45,0.1,0.4); P(g,'sph',c('#555'),0.06,0.06,0.06,0,1.68,0.2); break;
    case 'voteSign': P(g,'cyl',c('#8a5a2b'),0.05,1.4,0.05,0,0.7,0); P(g,'rbox2',mat('#ffffff',{map:labelTex('VOTE!','#e5302a','#ffffff'),basic:1}),1.4,0.5,0.06,0,1.5,0); break;
    case 'kennel': P(g,'rbox2',c('#c0392b'),1.4,1.0,1.4,0,0.5,0); P(g,'cone4',c('#7a5128'),1.2,0.7,1.2,0,1.35,0,0,PI/4); P(g,'rbox2',c('#222'),0.5,0.6,0.05,0,0.35,0.71); break;
  }
  return g;
}

