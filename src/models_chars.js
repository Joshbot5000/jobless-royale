// =====================================================================
//  MODELS (characters) — humans, animals, flyers, vehicles, buildings
// =====================================================================
function faceEyes(parent,x,y,z,sp,r,o={}){
  const w=mat('#ffffff',{s:60}), iris=mat(o.iris||'#2a1a10',{s:90}), b=mat('#0c0c10',{s:120});
  for(const s of [-1,1]){
    const e=P(parent,'sph',w,r*0.86,r*1.08,r*0.55, x+s*sp,y,z); e.userData.noOutline=true;
    P(parent,'sph',iris,r*0.6,r*0.76,r*0.36, x+s*sp*0.97,y-r*0.06,z+r*0.3).userData.noOutline=true;
    P(parent,'sphLo',b,r*0.34,r*0.44,r*0.3, x+s*sp*0.97,y-r*0.06,z+r*0.44).userData.noOutline=true;
    P(parent,'sphLo',w,r*0.17,r*0.17,r*0.1, x+s*sp*0.97+r*0.17,y+r*0.22,z+r*0.62).userData.noOutline=true;
  }
}

// ---------------------------------------------------------------- props (held in right hand, extend toward +Z)
function buildProp(name,tc){
  const g=G0(); const c=x=>mat(colr(x,tc),{s:40});
  const wood=mat('#8a5a2b',{s:20}), dark=mat('#25272c',{s:60}), steel=metal();
  switch(name){
    case 'gavel': P(g,'caps',wood,0.06,0.22,0.06,0,0,0.2,PI/2); P(g,'cyl',mat('#6b3d1f',{s:60}),0.09,0.26,0.09,0,0,0.44,0,0,PI/2); P(g,'cyl',gold(),0.095,0.03,0.095,0.11,0,0.44,0,0,PI/2); P(g,'cyl',gold(),0.095,0.03,0.095,-0.11,0,0.44,0,0,PI/2); break;
    case 'briefcase': P(g,'rbox2',mat('#5a3418',{s:50}),0.34,0.25,0.1,0,-0.15,0.02); P(g,'torHalf',gold(),0.06,0.05,0.4,0,-0.01,0.02); P(g,'box',gold(),0.06,0.04,0.11,0,-0.08,0.02); break;
    case 'scroll': P(g,'cyl',mat('#f5ecd0'),0.055,0.3,0.055,0,0,0.08,0,0,PI/2); P(g,'cyl',mat('#b3202a'),0.06,0.04,0.06,0,0,0.08,0,0,PI/2); break;
    case 'book': P(g,'rbox2',mat('#7a1f1f',{s:40}),0.25,0.07,0.32,0,0,0.12); P(g,'box',mat('#f5ecd0'),0.23,0.055,0.3,0.012,0,0.12); P(g,'box',gold(),0.08,0.072,0.08,0,0,0.12); break;
    case 'clipboard': P(g,'rbox2',wood,0.25,0.33,0.02,0,0.05,0.1,-0.4); P(g,'box',mat('#fff'),0.2,0.24,0.01,0,0.04,0.115,-0.4); P(g,'box',steel,0.08,0.03,0.02,0,0.2,0.1,-0.4); break;
    case 'phone': P(g,'rbox2',dark,0.08,0.16,0.02,0,0.04,0.06); P(g,'box',mat('#5ad1ff',{e:0.7}),0.066,0.13,0.005,0,0.04,0.072); break;
    case 'calculator': P(g,'rbox2',mat('#3a3a3a'),0.16,0.22,0.04,0,0.04,0.08,-0.5); P(g,'box',mat('#7dff8a',{e:0.7}),0.12,0.05,0.01,0,0.11,0.09,-0.5); break;
    case 'goldbar': P(g,'rbox2',gold(),0.17,0.09,0.27,0,0,0.1); break;
    case 'flag': P(g,'cyl',steel,0.02,1.0,0.02,0,0.35,0.05); P(g,'box',c('T'),0.32,0.21,0.01,0.16,0.75,0.05); break;
    case 'rocketL': P(g,'caps',mat('#f2f2f2',{s:80}),0.14,0.22,0.14,0,0.12,0.1,0.25); P(g,'cone',c('#e5443f'),0.07,0.14,0.07,0,0.38,0.16,0.25); for(let i=0;i<3;i++){ const a=i/3*TAU; P(g,'box',c('#e5443f'),0.01,0.08,0.06,Math.cos(a)*0.07,-0.04,0.06+Math.sin(a)*0.07,0.25,a); } break;
    case 'camera': P(g,'rbox2',dark,0.2,0.13,0.1,0,0.05,0.08); P(g,'cyl',mat('#555',{s:90}),0.05,0.09,0.05,0,0.05,0.16,PI/2); P(g,'cyl',mat('#7fb8ff',{s:150,m:0.3}),0.035,0.02,0.035,0,0.05,0.21,PI/2); break;
    case 'raygun': P(g,'caps',mat('#c0c6cc',{s:100,m:0.5}),0.08,0.15,0.08,0,0,0.14,PI/2); P(g,'sph',mat('#7df9ff',{e:1}),0.06,0.06,0.06,0,0,0.3); P(g,'rbox2',dark,0.05,0.12,0.05,0,-0.07,0.04); break;
    case 'welder': P(g,'caps',mat('#555'),0.07,0.15,0.07,0,0,0.15,PI/2); P(g,'cone',mat('#9fe6ff',{e:1}),0.04,0.1,0.04,0,0,0.34,PI/2); break;
    case 'pistol': P(g,'rbox2',dark,0.05,0.07,0.2,0,0.02,0.1); P(g,'rbox2',dark,0.05,0.12,0.06,0,-0.05,0.02); break;
    case 'rifle': P(g,'rbox2',dark,0.06,0.09,0.55,0,0.03,0.18); P(g,'box',c('T'),0.065,0.03,0.12,0,0.03,0.0); P(g,'rbox2',dark,0.05,0.12,0.06,0,-0.05,0.0); break;
    case 'sniper': P(g,'rbox2',mat('#3a4a3a'),0.06,0.08,0.75,0,0.03,0.25); P(g,'cyl',dark,0.035,0.2,0.035,0,0.1,0.2,PI/2); P(g,'cyl',dark,0.015,0.3,0.015,0,0.03,0.7,PI/2); P(g,'sph',mat('#ff2020',{e:1}),0.02,0.02,0.02,0,0.1,0.31); break;
    case 'laptop': P(g,'rbox2',mat('#2a2a2a',{s:80}),0.3,0.02,0.22,0,0,0.12); P(g,'rbox2',mat('#2a2a2a',{s:80}),0.3,0.2,0.02,0,0.1,0.02,-0.2); P(g,'box',mat('#39ff6a',{e:0.9}),0.26,0.16,0.005,0,0.1,0.035,-0.2); break;
    case 'flask': P(g,'sph',mat('#7dff4a',{e:0.6,op:0.85,s:150}),0.11,0.11,0.11,0,0.05,0.1); P(g,'cyl',mat('#d8ffd0',{op:0.7,s:150}),0.035,0.12,0.035,0,0.18,0.1); P(g,'cyl',mat('#8a5a2b'),0.038,0.03,0.038,0,0.25,0.1); break;
    case 'syringe': case 'syringeBig': case 'dartgun': { const s=name==='syringeBig'?1.8:1;
      P(g,'cyl',mat('#e8f6ff',{op:0.8,s:150}),0.04*s,0.24*s,0.04*s,0,0,0.12*s,PI/2); P(g,'cyl',mat('#ff6b9a',{e:0.3}),0.033*s,0.16*s,0.033*s,0,0,0.12*s,PI/2);
      P(g,'cyl',steel,0.006*s,0.12*s,0.006*s,0,0,0.3*s,PI/2); P(g,'cyl',mat('#fff'),0.06*s,0.015*s,0.06*s,0,0,0,PI/2); break; }
    case 'flamethrower': P(g,'caps',mat('#555',{s:80}),0.1,0.25,0.1,0,0,0.2,PI/2); P(g,'cyl',mat('#ffb02e',{s:80}),0.06,0.06,0.06,0,0,0.44,PI/2); P(g,'sph',mat('#ff8a1f',{e:1}),0.03,0.03,0.03,0,0,0.48); break;
    case 'cane': P(g,'cyl',wood,0.02,0.75,0.02,0,-0.3,0.05); P(g,'sph',gold(),0.045,0.045,0.045,0,0.07,0.05); break;
    case 'scalpel': P(g,'rbox2',steel,0.025,0.025,0.2,0,0,0.1); P(g,'box',mat('#eaf6ff',{s:140,m:0.8}),0.005,0.04,0.08,0,0,0.24); break;
    case 'paddles': P(g,'caps',mat('#333'),0.06,0.07,0.06,0,0,0.06,PI/2); P(g,'cyl',mat('#ffd34d',{s:80}),0.09,0.03,0.09,0,0,0.14,PI/2); P(g,'cyl',steel,0.08,0.035,0.08,0,0,0.16,PI/2); break;
    case 'drill': P(g,'caps',steel,0.07,0.12,0.07,0,0,0.12,PI/2); P(g,'cone',steel,0.02,0.1,0.02,0,0,0.27,PI/2); P(g,'rbox2',mat('#ff6b9a'),0.05,0.1,0.05,0,-0.05,0.03); break;
    case 'pan': P(g,'caps',dark,0.05,0.13,0.05,0,0,0.12,PI/2); P(g,'cyl',mat('#2a2a2a',{s:80,m:0.4}),0.21,0.045,0.21,0,0,0.42,PI/2); P(g,'cyl',mat('#555',{s:120,m:0.6}),0.18,0.05,0.18,0,0,0.42,PI/2); break;
    case 'cake': P(g,'cyl',mat('#f5d0a0'),0.13,0.12,0.13,0,0.05,0.08); P(g,'cyl',mat('#ff8fc4',{s:60}),0.135,0.05,0.135,0,0.12,0.08); P(g,'sph',mat('#e5443f',{s:90}),0.035,0.035,0.035,0,0.17,0.08); for(let i=0;i<6;i++){ const a=i/6*TAU; P(g,'sphLo',mat('#ffffff'),0.03,0.025,0.03,Math.cos(a)*0.11,0.14,0.08+Math.sin(a)*0.11); } break;
    case 'knives': case 'knife': P(g,'rbox2',dark,0.03,0.035,0.1,0,0,0.04); P(g,'box',mat('#dfe6ee',{s:140,m:0.8}),0.012,0.05,0.28,0,0,0.22); break;
    case 'cleaver': P(g,'caps',wood,0.05,0.08,0.05,0,0,0.07,PI/2); P(g,'rbox2',steel,0.02,0.22,0.24,0,0.06,0.25); break;
    case 'notebook': P(g,'rbox2',mat('#2a2a2a'),0.14,0.2,0.03,0,0.05,0.07,-0.3); P(g,'box',mat('#fff'),0.12,0.18,0.031,0,0.05,0.071,-0.3); break;
    case 'tray': P(g,'cyl',steel,0.22,0.02,0.22,0,0.12,0.05); P(g,'hemi',steel,0.12,0.09,0.12,0,0.13,0.05); P(g,'sphLo',steel,0.02,0.02,0.02,0,0.22,0.05); break;
    case 'hose': P(g,'caps',gold(),0.08,0.14,0.08,0,0,0.14,PI/2); P(g,'tor',mat('#d8322a',{s:40}),0.12,0.12,0.4,0,-0.12,-0.02); break;
    case 'axe': P(g,'caps',wood,0.05,0.28,0.05,0,0,0.22,PI/2); P(g,'rbox2',mat('#d8322a',{s:60}),0.03,0.17,0.15,0,0.06,0.44); P(g,'box',steel,0.032,0.04,0.15,0,-0.02,0.44); break;
    case 'flaregun': P(g,'rbox2',mat('#ff7a1a',{s:60}),0.06,0.07,0.2,0,0.02,0.1); P(g,'rbox2',mat('#ff7a1a'),0.05,0.12,0.06,0,-0.05,0.02); break;
    case 'wreckBall': P(g,'cyl',dark,0.02,0.5,0.02,0,0,0.25,PI/2); P(g,'sph',mat('#2a2d35',{s:100,m:0.6}),0.26,0.26,0.26,0,0,0.62); P(g,'torThin',mat('#ffb02e',{s:60}),0.27,0.27,0.27,0,0,0.62); break;
    case 'tnt': for(let i=-1;i<=1;i++) P(g,'cyl',mat('#d8322a',{s:50}),0.04,0.24,0.04,i*0.08,0.02,0.08); P(g,'rbox2',mat('#222'),0.26,0.04,0.09,0,0.04,0.08); P(g,'cyl',mat('#ddd'),0.005,0.1,0.005,0,0.18,0.08); break;
    case 'blueprint': P(g,'cyl',mat('#3a7bd5',{s:40}),0.05,0.4,0.05,0,0,0.1,0,0,PI/2); P(g,'cyl',mat('#ffffff'),0.052,0.04,0.052,0.12,0,0.1,0,0,PI/2); break;
    case 'hammer': P(g,'caps',wood,0.05,0.18,0.05,0,0,0.16,PI/2); P(g,'rbox2',mat('#6a6f78',{s:90,m:0.6}),0.08,0.1,0.2,0,0,0.33,0,0,PI/2); break;
    case 'brick': P(g,'rbox2',mat('#b5533c'),0.18,0.09,0.09,0,0,0.06); break;
    case 'guitar': { const gg=G0(); gg.position.set(-0.05,0.05,0.13); gg.rotation.set(0.2,0,-0.9);
      P(gg,'sph',mat(colr('T',tc),{s:110}),0.16,0.2,0.06,0,-0.08,0); P(gg,'sph',mat(colr('T',tc),{s:110}),0.12,0.13,0.06,0,0.12,0); P(gg,'cyl',mat('#111'),0.045,0.01,0.045,0,0.02,0.06,PI/2);
      P(gg,'rbox2',mat('#3a2414'),0.05,0.5,0.03,0,0.42,0); P(gg,'rbox2',mat('#111'),0.08,0.1,0.03,0,0.7,0); P(gg,'box',mat('#ffffff'),0.06,0.02,0.065,0,-0.12,0); g.add(gg); break; }
    case 'mic': P(g,'caps',dark,0.05,0.1,0.05,0,0.05,0.06,0.4); P(g,'sph',mat('#9aa3ad',{s:100,m:0.5}),0.055,0.055,0.055,0,0.14,0.1); break;
    case 'sticks': P(g,'cyl',mat('#e8c48a'),0.016,0.4,0.016,0,0,0.18,PI/2); break;
    case 'vinyl': P(g,'cyl',mat('#111',{s:130}),0.18,0.01,0.18,0,0.05,0.12,PI/2); P(g,'cyl',c('T'),0.06,0.012,0.06,0,0.05,0.12,PI/2); break;
    case 'lightstick': P(g,'caps',mat('#ff6bff',{e:1}),0.05,0.16,0.05,0,0.12,0.06,0.3); break;
    case 'baton': P(g,'caps',dark,0.06,0.2,0.06,0,0,0.18,PI/2); break;
    default: propMore(name,g,tc); break;
    case 'pizzaP': P(g,'cyl',mat('#f2b24a',{s:30}),0.24,0.025,0.24,0,0.1,0.05); P(g,'cyl',mat('#e5443f',{s:60}),0.21,0.027,0.21,0,0.11,0.05); for(let i=0;i<6;i++){ const a=i/6*TAU; P(g,'cylLo',mat('#a8202a'),0.04,0.03,0.04,Math.cos(a)*0.12,0.12,0.05+Math.sin(a)*0.12); } break;
  }
  return g;
}

// ---------------------------------------------------------------- humanoid
function buildHuman(p,tc){
  const g=G0(), R={type:'h'}; g.userData.rig=R;
  const c=x=>mat(colr(x,tc),{s:35});
  const skinC=p.skin||'#f7c9a0', skin=mat(skinC,{s:25});
  const [ot,oc='#888',oa='T'] = p.outfit||['tshirt','#888','T'];
  const main=c(oc), acc=c(oa);
  const w=p.w||1, h=p.h||1;
  const longWear=['robe','gown','dress','monk','toga'].includes(ot);
  const suitLegs=['spacesuit','hazmat','jumpsuit','scrubs','firecoat','uniform','armor','tactical','overalls','gi','chef','tracksuit','superhero','ringmaster'].includes(ot);
  const pantsC = p.pants || (suitLegs?oc : ot==='suit'?shade(colr(oc,tc),0.85) : ot==='leather'?'#222' : ['tshirt','tank','hawaii','hoodie'].includes(ot)?'#2f4a7a' : '#34394a');
  const pants=c(pantsC);
  const shoe=mat(ot==='hazmat'?'#2a2a2a':ot==='spacesuit'?'#e2e2e2':'#3a2a22',{s:60});
  const sleeve = ot==='tank' ? skin : main;
  const root=G0(); g.add(root); R.root=root;
  const hips=G0(); hips.position.y=0.44; root.add(hips); R.hips=hips;
  // legs
  R.legs=[];
  for(const s of [-1,1]){
    const L=G0(); L.position.set(s*0.11*w,0,0); hips.add(L);
    P(L,'caps',pants,0.2*Math.max(1,w*0.85),0.21,0.2,0,-0.2,0);
    P(L,'sph',shoe,0.105*Math.max(1,w*0.8),0.075,0.15,0,-0.385,0.045);
    P(L,'rbox2',mat('#1d1a18',{s:20}),0.2*Math.max(1,w*0.8),0.035,0.3,0,-0.43,0.045);
    R.legs.push(L);
  }
  // torso
  const torso=G0(); hips.add(torso); R.torso=torso;
  const tw=0.27*w, th=0.27*h, td=0.205*Math.max(1,w*0.85);
  P(torso,'torso',main,tw,th,td,0,th,0);
  const fz=td*0.94;
  const front=(m,sx,sy,x,y,z=0)=>P(torso,'rbox2',m,sx,sy,0.03,x,y,fz+z);
  const button=(y,m=gold())=>P(torso,'sphLo',m,0.022,0.022,0.012,0,y,fz+0.012);
  switch(ot){
    case 'suit': front(mat('#ffffff'),0.11,0.26,0,th*1.25); front(acc,0.055,0.22,0,th*1.18,0.012); P(torso,'sphLo',acc,0.035,0.03,0.02,0,th*1.62,fz+0.02);
      for(const s of [-1,1]) P(torso,'rbox2',main,0.07,0.26,0.035,s*0.075,th*1.3,fz+0.004,0,0,s*0.32); button(th*0.7,mat('#222')); break;
    case 'shirt': case 'shirtTie': front(acc,0.05,0.26,0,th*1.15); P(torso,'sphLo',acc,0.035,0.03,0.02,0,th*1.6,fz+0.02); P(torso,'tor',mat('#ffffff'),0.1,0.1,0.5,0,th*1.85,0,PI/2); break;
    case 'vest2': P(torso,'torso',acc,tw*1.03,th*0.8,td*1.04,0,th*0.85,0); front(mat('#ffffff'),0.09,0.16,0,th*1.5); for(let i=0;i<3;i++) button(th*(0.55+i*0.28),mat('#222')); break;
    case 'robe': case 'gown': case 'dress': case 'monk': {
      const len = ot==='dress'?0.4:0.56;
      P(hips,'bell',main,0.44*w,len,0.4*Math.max(1,w*0.8),0,0.06-len/2,0);
      if(ot==='robe'){ front(acc,0.06,0.13,-0.045,th*1.55); front(acc,0.06,0.13,0.045,th*1.55); P(torso,'tor',main,tw*0.62,td*0.7,0.6,0,th*1.85,0,PI/2); }
      if(ot==='monk'){ P(torso,'tor',mat('#e8c48a'),tw*0.98,td*1.0,0.35,0,th*0.15,0,PI/2); P(torso,'sph',main,0.3,0.18,0.24,0,th*1.95,-0.13); }
      if(ot==='gown'){ P(torso,'torThin',acc,tw*0.98,td*0.98,0.4,0,th*0.4,0,PI/2); P(torso,'sph',gold(),0.05,0.05,0.03,0,th*1.6,fz); }
      if(ot==='dress'){ front(mat('#e5443f'),0.1,0.035,0,th*1.35,0.01); front(mat('#e5443f'),0.035,0.1,0,th*1.35,0.01); P(hips,'bell',mat('#ffffff'),0.3*w,0.08,0.2,0,-0.05,0.25,0,0,0); }
      break; }
    case 'labcoat': case 'tornCoat': case 'trench': {
      P(hips,'bell',main,0.38*w,0.42,0.32*Math.max(1,w*0.8),0,-0.14,0);
      for(const s of [-1,1]) P(torso,'rbox2',main,0.08,0.3,0.04,s*0.075,th*1.3,fz+0.006,0,0,s*0.3);
      if(ot==='trench'){ P(torso,'tor',mat('#5a4a3a'),tw*0.98,td*1.05,0.45,0,th*0.3,0,PI/2); P(torso,'box',gold(),0.06,0.05,0.03,0,th*0.3,fz+0.04); P(torso,'sph',main,tw*1.12,0.08,td*1.12,0,th*1.85,0); for(let i=0;i<2;i++){ button(th*(0.9+i*0.3),mat('#3a2a1a')); } }
      else { front(acc,0.05,0.22,0,th*1.2); if(ot==='labcoat'){ P(torso,'rbox2',mat('#e8e8e8'),0.07,0.06,0.02,-0.12,th*1.1,fz); P(torso,'cyl',mat('#3a7bd5'),0.008,0.06,0.008,-0.1,th*1.18,fz+0.02); } }
      if(ot==='tornCoat'){ P(torso,'sph',skin,0.13,0.16,0.04,0,th*0.95,fz); for(let i=0;i<4;i++) P(hips,'cone4',main,0.05,0.12,0.03,-0.2+i*0.13,-0.38,0.22,PI); }
      break; }
    case 'apron': case 'chef': case 'waiter':
      if(ot==='waiter'){ front(mat('#ffffff'),0.12,0.28,0,th*1.2); P(torso,'sph',acc,0.04,0.025,0.02,-0.03,th*1.75,fz+0.02); P(torso,'sph',acc,0.04,0.025,0.02,0.03,th*1.75,fz+0.02); P(torso,'sphLo',acc,0.02,0.02,0.02,0,th*1.75,fz+0.03); for(let i=0;i<3;i++) button(th*(0.6+i*0.25),mat('#f2f2f2')); }
      else { P(torso,'rbox2',acc,tw*1.4,0.5,0.04,0,th*0.5,fz-0.01); P(hips,'rbox2',acc,tw*1.5,0.36,0.04,0,-0.17,0.2); P(torso,'tor',acc,tw*0.98,td*1.0,0.25,0,th*0.5,0,PI/2);
        if(ot==='chef'){ for(let i=0;i<3;i++){ P(torso,'sphLo',mat('#222'),0.022,0.022,0.012,-0.07,th*(1.0+i*0.24),fz+0.02); P(torso,'sphLo',mat('#222'),0.022,0.022,0.012,0.07,th*(1.0+i*0.24),fz+0.02);} P(torso,'tor',acc,0.11,0.1,0.6,0,th*1.85,0,PI/2); } }
      break;
    case 'vest': P(torso,'torso',acc,tw*1.04,th*0.86,td*1.05,0,th*0.95,0); for(const y of [0.65,1.15]) P(torso,'tor',mat('#f2f2f2',{s:130}),tw*1.0,td*1.02,0.22,0,th*y,0,PI/2); break;
    case 'firecoat': for(const y of [0.5,1.3]) P(torso,'tor',acc,tw*1.0,td*1.0,0.3,0,th*y,0,PI/2); for(const L of R.legs) P(L,'tor',acc,0.1,0.1,0.3,0,-0.26,0,PI/2); for(let i=0;i<3;i++) P(torso,'rbox2',mat('#222'),0.06,0.03,0.02,0.05,th*(0.8+i*0.25),fz+0.01); break;
    case 'spacesuit': case 'hazmat': P(torso,'rbox',acc,0.22,0.18,0.08,0,th*1.15,fz-0.03); P(torso,'sph',mat('#ff3b3b',{e:0.6}),0.02,0.02,0.02,-0.06,th*1.2,fz+0.02); P(torso,'sph',mat('#39ff6a',{e:0.6}),0.02,0.02,0.02,0.0,th*1.2,fz+0.02);
      if(ot==='spacesuit') P(torso,'tor',mat('#cccccc',{s:80}),tw*0.72,td*0.78,0.7,0,th*1.85,0,PI/2); break;
    case 'armor': case 'tactical': P(torso,'rbox',mat('#2a2d35',{s:40}),tw*1.55,th*1.15,0.14,0,th*1.05,td*0.55); P(torso,'rbox2',acc,0.13,0.05,0.04,0,th*1.45,td*0.65); for(let i=0;i<3;i++) P(torso,'rbox2',mat('#3a3d45'),0.06,0.08,0.04,-0.1+i*0.1,th*0.65,td*0.65); break;
    case 'hoodie': P(torso,'tor',main,0.19,0.15,0.9,0,th*1.95,-0.07,PI/2.6); P(torso,'rbox2',shade(colr(oc,tc),0.85)?mat(shade(colr(oc,tc),0.85)):main,0.18,0.09,0.03,0,th*0.55,fz); front(acc,0.18,0.05,0,th*1.35); for(const s of [-1,1]) P(torso,'cyl',mat('#ffffff'),0.008,0.12,0.008,s*0.05,th*1.55,fz+0.02); break;
    case 'leather': P(torso,'box',metal(),0.012,0.4,0.035,0.035,th*1.0,fz); for(const s of [-1,1]) P(torso,'rbox2',main,0.09,0.25,0.04,s*0.085,th*1.45,fz+0.006,0,0,s*0.42); P(torso,'sph',acc,0.05,0.05,0.02,-0.1,th*0.8,fz+0.02); for(let i=0;i<4;i++) P(torso,'sphLo',metal(),0.012,0.012,0.012,-0.15+i*0.1,th*1.8,fz-0.03); break;
    case 'hawaii': for(let i=0;i<7;i++) P(torso,'sph',i%2?acc:mat('#ffe14d'),0.035,0.035,0.012,Math.sin(i*2.3)*0.13,th*(0.4+i*0.2),fz+0.008); P(torso,'cone4',mat('#ffffff'),0.07,0.12,0.02,-0.05,th*1.75,fz,0,0,0.7); P(torso,'cone4',mat('#ffffff'),0.07,0.12,0.02,0.05,th*1.75,fz,0,0,-0.7); break;
    case 'cardigan': front(mat('#ffffff'),0.1,0.14,0,th*1.6); front(acc,0.02,0.42,0,th*0.95,0.012); for(let i=0;i<3;i++) button(th*(0.6+i*0.3),mat('#5a3418')); break;
    case 'scrubs': front(skin,0.09,0.09,0,th*1.75); P(torso,'cone4',main,0.07,0.1,0.02,0,th*1.6,fz,PI,0,0); P(torso,'rbox2',acc,0.08,0.06,0.02,0.1,th*1.25,fz+0.004); break;
    case 'jumpsuit': case 'uniform': case 'overalls':
      P(torso,'rbox2',ot==='uniform'?gold():acc,0.07,0.07,0.02,0.1,th*1.4,fz);
      if(ot==='uniform'){ for(let i=0;i<3;i++) button(th*(0.6+i*0.28)); P(torso,'tor',mat('#222'),tw*0.98,td*1.0,0.3,0,th*0.1,0,PI/2); }
      if(ot==='overalls'){ P(torso,'rbox2',main,tw*1.2,th*0.9,0.04,0,th*0.7,fz-0.01); for(const s of [-1,1]){ P(torso,'rbox2',main,0.04,0.3,0.22,s*0.1,th*1.55,0); P(torso,'sphLo',gold(),0.02,0.02,0.02,s*0.09,th*1.15,fz+0.02);} }
      if(ot==='jumpsuit') P(torso,'box',metal(),0.012,0.4,0.03,0,th*1.0,fz);
      break;
    case 'gi': P(torso,'tor',acc,tw*0.98,td*0.98,0.4,0,th*0.25,0,PI/2); P(torso,'rbox2',mat('#e8e8e8'),0.07,0.3,0.03,0.04,th*1.4,fz,0,0,-0.5); P(hips,'rbox2',acc,0.05,0.18,0.02,0.07,-0.06,0.22,0,0,0.2); break;
    case 'scarf': P(torso,'tor',acc,0.15,0.13,0.95,0,th*1.85,0,PI/2); P(torso,'rbox2',acc,0.07,0.25,0.04,0.06,th*1.3,fz+0.01,0,0,0.12); break;
    case 'tank': front(acc,0.12,0.12,0,th*1.0); break;
    case 'tshirt': front(acc,0.15,0.15,0,th*1.05); P(torso,'tor',main,0.11,0.1,0.5,0,th*1.85,0,PI/2); break;
    default: outfitMore(ot,{torso,hips,R,main,acc,skin,skinC,tw,th,td,fz,front,button,c,tc,w,oc,p,pantsM:pants});
  }
  if(!longWear && !['vest','firecoat','gi','trench','apron','chef','uniform','overalls'].includes(ot) && !OUTFIT_NO_BELT.includes(ot)){ P(torso,'torThin',acc,tw*0.95,td*0.97,0.38,0,th*0.14,0,PI/2); P(torso,'rbox2',gold(),0.055,0.045,0.025,0,th*0.14,fz+0.02); }
  // neck + head
  P(torso,'cyl',skin,0.07,0.1,0.07,0,th*1.95,0);
  const head=G0(); head.position.y=th*2+0.21; torso.add(head); R.head=head;
  const hs=(p.head||1)*0.3;
  P(head,'head',skin,hs,hs*0.95,hs*0.93);
  P(head,'sph',skin,hs*0.72,hs*0.5,hs*0.62,0,-hs*0.42,hs*0.18);
  for(const s of [-1,1]) P(head,'sph',skin,0.055,0.075,0.04,s*hs*0.97,0,0);
  const browC = p.hair&&p.hair[0]!=='bald' ? colr(p.hair[1],tc) : '#3a2414';
  if(p.statue) for(const s of [-1,1]) P(head,'sph',skin,0.06,0.07,0.04,s*0.1,0.03,hs*0.8); else faceEyes(head,0,0.03,hs*0.8,0.1,0.065,{iris:p.iris});
  const angry=(p.face||[]).includes('angry');
  for(const s of [-1,1]) P(head,'rbox2',mat(browC,{s:20}),0.1,0.026,0.03,s*0.1,0.13+(angry?-0.01:0),hs*0.86,0,0,s*(angry?0.42:-0.12)).userData.noOutline=true;
  P(head,'sph',mat(shade(skinC,0.9),{s:25}),0.05,0.045,0.045,0,-0.04,hs*0.95);
  const mouth=P(head,'smile',mat('#5a1f1f',{s:40}),0.055,0.045,0.05,0,-0.115,hs*0.88,0,0,PI*1.1); mouth.userData.noOutline=true;
  const blush=mat(new THREE.Color(skinC).lerp(new THREE.Color('#ff5a6a'),0.35).getStyle(),{s:20});
  for(const s of [-1,1]) P(head,'sph',blush,0.05,0.032,0.02,s*0.15,-0.06,hs*0.84).userData.noOutline=true;
  // hair
  const hat = p.hat ? p.hat[0] : null;
  const [hst,hc='#3a2414'] = p.hair || (hat?['none']:['short','#3a2414']);
  const hm=mat(colr(hc,tc),{s:40}), hmS=mat(colr(hc,tc),{s:110});
  const bangs=(m)=>{ if(hat) return; for(let i=0;i<4;i++){ const a=-0.55+i*0.37; P(head,'sph',m,hs*0.34,hs*0.24,hs*0.28,Math.sin(a)*hs*0.72,hs*0.62,Math.cos(a)*hs*0.62,0.5,0,-a*0.6); } };
  switch(hst){
    case 'short': P(head,'hemi',hm,hs*1.07,hs*0.78,hs*1.05,0,0.04,-0.02); bangs(hm); break;
    case 'slick': P(head,'hemi',hmS,hs*1.07,hs*0.72,hs*1.07,0,0.05,-0.03); P(head,'sph',hmS,hs*0.96,hs*0.62,hs*0.42,0,0.02,-hs*0.7); P(head,'sph',hmS,hs*0.5,hs*0.2,hs*0.5,0.06,hs*0.68,hs*0.38,0.4,0,-0.3); break;
    case 'long': P(head,'hemi',hm,hs*1.09,hs*0.82,hs*1.07,0,0.03,-0.02); bangs(hm); P(head,'sph',hm,hs*1.02,hs*1.4,hs*0.52,0,-hs*0.6,-hs*0.66); for(const s of [-1,1]) P(head,'sph',hm,hs*0.3,hs*0.9,hs*0.3,s*hs*0.9,-hs*0.5,-hs*0.15); break;
    case 'bun': P(head,'hemi',hm,hs*1.07,hs*0.78,hs*1.05,0,0.04,-0.02); bangs(hm); P(head,'sph',hm,hs*0.44,hs*0.44,hs*0.44,0,hs*0.78,-hs*0.6); break;
    case 'ponytail': P(head,'hemi',hm,hs*1.07,hs*0.78,hs*1.05,0,0.04,-0.02); bangs(hm); P(head,'sph',hm,hs*0.32,hs*0.75,hs*0.32,0,-hs*0.15,-hs*1.12,-0.5); P(head,'tor',c('T'),hs*0.15,hs*0.15,0.5,0,hs*0.3,-hs*0.95,0.6); break;
    case 'spiky': for(let i=0;i<9;i++){ const a=i/9*TAU; P(head,'cone',hm,0.075,0.24,0.075,Math.cos(a)*hs*0.55,hs*0.82,Math.sin(a)*hs*0.55-0.03,Math.sin(a)*0.7,0,-Math.cos(a)*0.7); } P(head,'cone',hm,0.08,0.26,0.08,0,hs*1.0,0); P(head,'hemi',hm,hs*1.05,hs*0.72,hs*1.03,0,0.06,-0.02); break;
    case 'mohawk': for(let i=0;i<6;i++) P(head,'cone',hm,0.05,0.28,0.08,0,hs*0.98,hs*0.7-i*hs*0.3,-0.35+i*0.15); P(head,'hemi',mat(shade(skinC,0.85)),hs*1.02,hs*0.7,hs*1.0,0,0.05,-0.02); break;
    case 'afro': P(head,'puff',hm,hs*1.32,hs*1.12,hs*1.27,0,hs*0.35,-hs*0.15); break;
    case 'messy': for(let i=0;i<8;i++){ const a=i/8*TAU; P(head,'sph',hm,0.1,0.08,0.1,Math.cos(a)*hs*0.62,hs*0.76,Math.sin(a)*hs*0.62-0.04); } break;
    case 'bald': P(head,'sphLo',mat('#ffffff',{op:0.25,s:150}),hs*0.3,hs*0.12,hs*0.2,-hs*0.3,hs*0.75,hs*0.2,0.6); break;
  }
  const hatC=p.hat?p.hat[1]:'#333';
  const hcM=(x)=>mat(colr(hatC,tc),x);
  switch(hat){
    case 'judgeWig': { const wm=mat('#f4f4f4',{s:10}); P(head,'hemi',wm,hs*1.13,hs*0.88,hs*1.12,0,0.05,-0.02);
      for(const s of [-1,1]) for(let i=0;i<5;i++) P(head,'puff',wm,0.095,0.085,0.1,s*hs*1.03,0.07-i*0.09,-0.04-i*0.012);
      for(let i=0;i<5;i++) P(head,'puff',wm,0.1,0.09,0.09,-0.2+i*0.1,hs*0.72,-hs*0.6);
      P(head,'sph',wm,hs*0.82,hs*0.95,hs*0.42,0,-hs*0.6,-hs*0.85); break; }
    case 'barristerWig': { const wm=mat('#e6e6e6',{s:10}); P(head,'hemi',wm,hs*1.11,hs*0.82,hs*1.09,0,0.05,-0.02);
      for(const s of [-1,1]) for(let i=0;i<3;i++) P(head,'tor',wm,0.06,0.06,0.55,s*hs*0.99,0.04-i*0.075,-0.03,0,PI/2);
      P(head,'caps',wm,0.06,0.09,0.06,0,-hs*0.55,-hs*0.95); break; }
    case 'police': P(head,'cyl',c(hatC),hs*0.95,0.16,hs*0.95,0,hs*0.76,0); P(head,'cyl',mat('#111',{s:120}),hs*1.05,0.03,hs*1.18,0,hs*0.63,0.06); P(head,'sph',gold(),0.055,0.06,0.02,0,hs*0.8,hs*0.96); P(head,'tor',mat('#111'),hs*0.95,hs*0.95,0.2,0,hs*0.7,0,PI/2); break;
    case 'topHat': P(head,'cyl',mat('#151515',{s:80}),hs*0.76,0.44,hs*0.76,0,hs*1.08,0); P(head,'cyl',mat('#151515',{s:80}),hs*1.28,0.035,hs*1.28,0,hs*0.86,0); P(head,'cyl',gold(),hs*0.78,0.07,hs*0.78,0,hs*0.94,0); break;
    case 'fedora': P(head,'cyl',c(hatC),hs*0.8,0.2,hs*0.8,0,hs*0.86,0); P(head,'cyl',c(hatC),hs*1.42,0.028,hs*1.42,0,hs*0.73,0); P(head,'cyl',mat('#222'),hs*0.82,0.05,hs*0.82,0,hs*0.8,0); P(head,'rbox2',c(hatC),hs*0.5,0.04,hs*1.2,0,hs*0.97,0); break;
    case 'cap': case 'capBack': P(head,'hemi',c(hatC),hs*1.08,hs*0.8,hs*1.06,0,0.05,0); P(head,'cyl',c(hatC),hs*0.62,0.025,hs*0.72,0,hs*0.42,(hat==='cap'?1:-1)*hs*0.92); P(head,'sphLo',mat('#ffffff'),0.03,0.02,0.03,0,hs*0.86,0); break;
    case 'beanie': P(head,'hemi',c(hatC),hs*1.09,hs*0.97,hs*1.07,0,0.02,0); P(head,'tor',c(hatC),hs*1.02,hs*1.02,0.65,0,0.05,0,PI/2); P(head,'puff',c(hatC),0.06,0.06,0.06,0,hs*1.02,0); break;
    case 'beret': P(head,'sph',c(hatC),hs*1.07,hs*0.3,hs*1.07,0.05,hs*0.76,0,0,0,0.25); P(head,'cyl',c(hatC),0.012,0.05,0.012,0.04,hs*1.0,0); break;
    case 'chef': P(head,'cyl',mat('#ffffff',{s:15}),hs*0.88,0.32,hs*0.88,0,hs*1.02,0); for(let i=0;i<6;i++){ const a=i/6*TAU; P(head,'puff',mat('#ffffff',{s:15}),hs*0.48,hs*0.42,hs*0.48,Math.cos(a)*hs*0.48,hs*1.42,Math.sin(a)*hs*0.48); } P(head,'puff',mat('#ffffff',{s:15}),hs*0.55,hs*0.45,hs*0.55,0,hs*1.55,0); break;
    case 'chefShort': P(head,'cyl',mat('#ffffff',{s:15}),hs*0.96,0.15,hs*0.96,0,hs*0.84,0); P(head,'puff',mat('#ffffff',{s:15}),hs*1.0,hs*0.38,hs*1.0,0,hs*0.98,0); break;
    case 'hardhat': P(head,'hemi',hcM({s:110}),hs*1.13,hs*0.92,hs*1.13,0,0.06,0); P(head,'cyl',hcM({s:110}),hs*1.32,0.025,hs*1.38,0,0.06,0.03); P(head,'rbox2',hcM({s:110}),0.045,0.07,hs*1.7,0,hs*0.92,0); break;
    case 'fireHelmet': P(head,'hemi',hcM({s:110}),hs*1.13,hs*0.97,hs*1.13,0,0.06,0); P(head,'cyl',hcM({s:110}),hs*1.38,0.03,hs*1.52,0,0.06,-0.08); P(head,'rbox2',gold(),0.13,0.15,0.03,0,hs*0.62,hs*1.03,-0.3); P(head,'rbox2',hcM({s:110}),0.04,0.06,hs*1.6,0,hs*0.97,0); break;
    case 'spaceHelmet': { const gl=P(head,'sph',mat('#cfeeff',{op:0.22,s:150}),hs*1.5,hs*1.5,hs*1.5,0,0,0.02); gl.userData.noOutline=true; P(head,'tor',mat('#dadada',{s:80}),hs*1.02,hs*1.02,0.95,0,-hs*1.08,0,PI/2); P(head,'hemi',mat(colr(hatC,tc),{op:0.5,s:150,m:0.5}),hs*1.52,hs*0.58,hs*1.52,0,hs*0.6,0.02).userData.noOutline=true; break; }
    case 'hazmat': P(head,'sph',c(hatC),hs*1.36,hs*1.32,hs*1.32,0,0.02,-0.04); P(head,'sph',mat('#bfe8ff',{op:0.45,s:150}),hs*0.95,hs*0.75,hs*0.5,0,0.02,hs*0.86).userData.noOutline=true; P(head,'cyl',mat('#333'),0.07,0.06,0.07,0,-hs*0.6,hs*1.0,PI/2); break;
    case 'surgCap': P(head,'hemi',c(hatC),hs*1.09,hs*0.88,hs*1.07,0,0.04,0); break;
    case 'nurseCap': P(head,'rbox2',mat('#ffffff'),hs*0.92,0.13,hs*0.52,0,hs*0.96,0.03,-0.3); P(head,'box',mat('#e5443f'),0.08,0.025,0.012,0,hs*0.98,hs*0.31,-0.3); P(head,'box',mat('#e5443f'),0.025,0.08,0.012,0,hs*0.98,hs*0.31,-0.3); break;
    case 'headband': P(head,'tor',c(hatC),hs*1.03,hs*1.03,0.5,0,hs*0.42,0,PI/2+0.15); P(head,'rbox2',c(hatC),0.05,0.12,0.02,-0.06,hs*0.25,-hs*1.0,0.3,0,0.3); break;
    case 'crown': { const gm=gold(); P(head,'cyl',gm,hs*0.74,0.13,hs*0.74,0,hs*0.97,0); for(let i=0;i<5;i++){ const a=i/5*TAU; P(head,'cone',gm,0.05,0.15,0.05,Math.cos(a)*hs*0.64,hs*1.14,Math.sin(a)*hs*0.64); P(head,'sphLo',gm,0.025,0.025,0.025,Math.cos(a)*hs*0.64,hs*1.23,Math.sin(a)*hs*0.64);} P(head,'sph',mat('#e5443f',{s:150}),0.04,0.04,0.02,0,hs*0.99,hs*0.74); break; }
    case 'viking': P(head,'hemi',mat(colr(hatC,tc),{s:110,m:0.6}),hs*1.11,hs*0.92,hs*1.11,0,0.06,0); P(head,'tor',gold(),hs*1.08,hs*1.08,0.3,0,0.06,0,PI/2); for(const s of [-1,1]) P(head,'cone',mat('#fff6dc',{s:60}),0.06,0.32,0.06,s*hs*1.05,hs*0.66,0,0,0,-s*0.7); break;
    case 'plagueHat': P(head,'cyl',c(hatC),hs*1.62,0.03,hs*1.62,0,hs*0.73,0); P(head,'cyl',c(hatC),hs*0.8,0.22,hs*0.86,0,hs*0.86,0); P(head,'tor',mat('#5a3a2a'),hs*0.84,hs*0.84,0.25,0,hs*0.8,0,PI/2); break;
    case 'weldMask': P(head,'rboxS',c(hatC),hs*1.65,hs*1.75,0.12,0,0,hs*0.95); P(head,'rbox2',mat('#1a6b8a',{s:150,e:0.25}),hs*1.05,0.075,0.02,0,0.04,hs*1.02); break;
    default: if(hat) hatMore(hat,{head,hs,c,hatC,tc}); break;
    case 'swatHelmet': P(head,'hemi',c(hatC),hs*1.13,hs*0.97,hs*1.13,0,0.06,0); P(head,'tor',c(hatC),hs*1.1,hs*1.1,0.3,0,0.06,0,PI/2); P(head,'rbox2',mat('#bfe8ff',{op:0.5,s:150}),hs*1.2,0.1,0.04,0,hs*0.36,hs*0.95,-0.4).userData.noOutline=true; break;
  }
  for(const f of (p.face||[])){
    const fz2=hs*0.88;
    switch(f){
      case 'glassesRound': case 'glassesHalf': for(const s of [-1,1]) P(head,'torThin',mat('#222',{s:80}),0.072,f==='glassesHalf'?0.04:0.072,0.072,s*0.1,f==='glassesHalf'?0.0:0.03,fz2+0.035); P(head,'box',mat('#222'),0.06,0.012,0.012,0,0.04,fz2+0.04); break;
      case 'shades': for(const s of [-1,1]) P(head,'rbox2',mat('#111',{s:150}),0.125,0.075,0.03,s*0.095,0.035,fz2+0.045); P(head,'box',mat('#111'),0.08,0.015,0.02,0,0.05,fz2+0.05); break;
      case 'goggles': for(const s of [-1,1]){ P(head,'cyl',mat('#ff9f1a',{s:60}),0.068,0.06,0.068,s*0.1,0.04,fz2+0.035,PI/2); P(head,'cyl',mat('#9fe6ff',{op:0.7,s:150}),0.052,0.062,0.052,s*0.1,0.04,fz2+0.04,PI/2).userData.noOutline=true;} P(head,'tor',mat('#333'),hs*1.0,hs*1.0,0.3,0,0.04,0,PI/2); break;
      case 'mustache': for(const s of [-1,1]) P(head,'sph',mat('#4a3220',{s:20}),0.07,0.03,0.035,s*0.05,-0.08,fz2+0.035,0,0,s*0.3); break;
      case 'beard': P(head,'puff',mat(colr(p.hair&&p.hair[1]&&p.hair[0]!=='bald'?p.hair[1]:'#4a3220',tc),{s:20}),hs*0.78,hs*0.58,hs*0.52,0,-hs*0.55,hs*0.45); break;
      case 'monocle': P(head,'torThin',gold(),0.078,0.078,0.078,0.1,0.03,fz2+0.05); P(head,'cyl',gold(),0.004,0.2,0.004,0.16,-0.08,fz2); break;
      case 'cigar': P(head,'cyl',mat('#6b3d1f'),0.02,0.16,0.02,0.07,-0.12,fz2+0.06,PI/2.3,0.3); P(head,'sph',mat('#ff6a1f',{e:1}),0.022,0.022,0.022,0.1,-0.11,fz2+0.13); break;
      case 'surgMask': P(head,'sph',mat('#a8d8ff',{s:15}),hs*0.76,hs*0.46,hs*0.42,0,-hs*0.36,hs*0.64); break;
      case 'beak': P(head,'cone',mat('#f0e6c8',{s:60}),0.075,0.4,0.075,0,-0.04,hs*1.12,PI/2+0.25); P(head,'sph',mat('#151515'),hs*0.92,hs*0.52,hs*0.46,0,0.03,hs*0.55); for(const s of [-1,1]) P(head,'cyl',mat('#ff3b3b',{e:0.6}),0.045,0.03,0.045,s*0.09,0.04,fz2+0.06,PI/2); break;
      case 'headset': P(head,'torHalf',mat('#222'),hs*1.03,hs*1.03,0.3,0,0.02,0); P(head,'cyl',mat('#222'),0.01,0.15,0.01,0.12,-0.1,fz2-0.02,PI/2.4,0,0.8); P(head,'sphLo',mat('#222'),0.025,0.025,0.025,0.07,-0.14,fz2+0.03); break;
      case 'headphones': P(head,'torHalf',mat('#222',{s:80}),hs*1.12,hs*1.12,0.45,0,0.03,0); for(const s of [-1,1]) P(head,'cyl',c('T'),0.095,0.075,0.095,s*hs*1.09,0,0,0,0,PI/2); break;
      default: faceMore(f,{head,hs,fz2}); break;
      case 'headMirror': P(head,'tor',mat('#333'),hs*1.03,hs*1.03,0.25,0,hs*0.42,0,PI/2+0.2); P(head,'cyl',mat('#e8f4ff',{s:150,m:0.9}),0.085,0.015,0.085,0,hs*0.58,fz2+0.03,PI/2-0.2); break;
    }
  }
  if(p.blackCap){ const bc=G0(); bc.position.y=hs*1.12; head.add(bc); P(bc,'rbox2',mat('#050505',{s:60}),hs*1.55,0.035,hs*1.55); P(bc,'sph',mat('#050505'),0.03,0.03,0.03,0,0.025,0); bc.visible=false; R.blackCap=bc; }
  // arms
  for(const s of [-1,1]){
    const A=G0(); A.position.set(s*(tw+0.025),th*1.62,0); torso.add(A);
    const aw=Math.max(1,w*0.8);
    P(A,'sph',sleeve,0.085*aw,0.085,0.085*aw,0,0,0);
    P(A,'caps',sleeve,0.15*aw,0.13,0.15*aw,0,-0.12,0);
    const fore = ['tank','shirtTie','gi'].includes(ot)||OUTFIT_FORE_SKIN.includes(ot) ? skin : sleeve;
    P(A,'caps',fore,0.13*aw,0.12,0.13*aw,0,-0.26,0);
    if(fore===sleeve&&ot!=='hazmat'&&ot!=='spacesuit') P(A,'tor',sleeve,0.065*aw,0.065*aw,0.35,0,-0.34,0,PI/2);
    const hand=G0(); hand.position.set(0,-0.38,0); A.add(hand);
    const gm=ot==='hazmat'?mat('#2a2a2a',{s:40}):ot==='spacesuit'?mat('#dddddd',{s:60}):skin;
    P(hand,'sph',gm,0.075,0.08,0.068); P(hand,'sph',gm,0.032,0.04,0.03,-s*0.05,0.02,0.04,0,0,s*0.5);
    if(s>0){ R.armR=A; R.hand=hand; } else { R.armL=A; R.handL=hand; }
  }
  if(p.prop && p.prop!=='none'){ const pr=buildProp(p.prop,tc); R.hand.add(pr); R.prop=pr;
    if(['knives','paddles','sticks','glove','pompom','dumbbell'].includes(p.prop)) R.handL.add(buildProp(p.prop,tc)); }
  if(p.back){ const [bt,bcol] = p.back; const bm=c(bcol);
    if(bt==='backpack'){ P(torso,'rboxS',bm,0.34,0.38,0.17,0,th*1.15,-td-0.05); P(torso,'rbox2',mat('#888'),0.2,0.08,0.04,0,th*1.35,-td-0.14); }
    if(bt==='jetpack'){ for(const s of [-1,1]){ P(torso,'caps',metal('#c0c6cc'),0.15,0.2,0.15,s*0.09,th*1.1,-td-0.07); P(torso,'cone',mat('#555',{s:80,m:0.5}),0.06,0.08,0.06,s*0.09,th*0.42,-td-0.07,PI);} R.jet=true; }
    if(bt==='tank'){ P(torso,'caps',bm,0.18,0.22,0.18,0,th*1.1,-td-0.06); P(torso,'cyl',gold(),0.03,0.06,0.03,0,th*1.6,-td-0.06); }
    if(bt==='parachute'){ P(torso,'rboxS',bm,0.32,0.34,0.15,0,th*1.15,-td-0.05); P(torso,'tor',mat('#333'),0.05,0.05,0.4,0,th*1.15,-td+0.02); }
  }
  humanExtras(p,{head,hs,torso,th,td,skin,R,c,hips,tc});
  if(p.cape){ const cp=P(torso,'rbox2',c(p.cape),0.5*w,0.7,0.03,0,th*0.7,-td-0.02); R.cape=cp; }
  R.height = 0.44 + th*2 + 0.21 + hs*1.9;
  if(p.sc){ g.scale.setScalar(p.sc); R.height*=p.sc; }
  return g;
}

// ---------------------------------------------------------------- quadruped (dogs, bull, bear, rats, squirrel)
function buildQuad(p,tc){
  const g=G0(), R={type:'q'}; g.userData.rig=R;
  const c=x=>mat(colr(x,tc),{s:14});
  const coat=c(p.coat), coat2=c(p.coat2||p.coat);
  const L=p.len||1, LL=p.legLen??0.22, ch=p.chunky?1.2:1;
  const root=G0(); g.add(root); R.root=root;
  const body=G0(); body.position.y=LL+0.2; root.add(body); R.body=body;
  R.bodyMesh=P(body,'sph',coat,0.2*ch,0.18*ch,0.24*L);
  P(body,'sph',coat,0.22*ch,0.2*ch,0.17,0,0.02,0.15*L);            // chest
  P(body,'sph',coat,0.2*ch,0.185*ch,0.16,0,0.0,-0.15*L);           // hips
  P(body,'sph',coat2,0.16*ch,0.12,0.24*L,0,-0.08,0.03);
  if(p.patches){ P(body,'sph',coat2,0.17,0.12,0.17,0.04,0.12,-0.08*L); P(body,'sph',coat2,0.13,0.1,0.13,-0.06,0.11,0.14*L); }
  if(p.spots){ const r=seeded(7); for(let i=0;i<16;i++){ const a=r()*TAU, zz=(r()-0.5)*0.55*L; const m=P(body,'sphLo',mat('#111',{s:14}),0.036,0.036,0.018,Math.cos(a)*0.205,Math.sin(a)*0.19,zz); m.lookAt(Math.cos(a)*2,Math.sin(a)*2,zz); m.userData.noOutline=true; } }
  if(p.collie) P(body,'puff',mat('#ffffff',{s:12}),0.2,0.2,0.16,0,0.03,0.25*L);
  if(p.fluffy) for(let i=0;i<5;i++){ const a=i/5*PI-PI/2; P(body,'puff',coat2,0.09,0.09,0.08,Math.sin(a)*0.12,-0.02+Math.cos(a)*0.06,0.3*L); }
  const front=G0(); front.position.z=0.24*L; body.add(front); R.front=front;
  const back=G0(); back.position.z=-0.24*L; body.add(back); R.back=back;
  // neck + head
  P(front,'sph',coat,0.12*ch,0.15,0.12,0,0.11,0.07,-0.5);
  const head=G0(); head.position.set(0,0.19,0.14); front.add(head); R.head=head;
  const hr = p.breed==='bulldog'?0.22:0.17;
  P(head,'head',coat,hr,hr*0.95,hr*0.95);
  const sn=p.snout??0.18;
  const muzzle=p.tan||p.collie||p.patches?coat2:coat;
  P(head,'sph',muzzle,0.1,0.08,0.06+sn*0.5,0,-0.045,hr*0.68+sn*0.45);
  for(const s of [-1,1]) P(head,'sph',muzzle,0.055,0.05,0.05,s*0.045,-0.07,hr*0.75+sn*0.6);
  P(head,'sph',mat(p.nose||'#151515',{s:140}),0.045,0.035,0.032,0,-0.015,hr*0.7+sn*0.95+0.04);
  const jaw=G0(); jaw.position.set(0,-0.09,hr*0.5); head.add(jaw); R.jaw=jaw;
  P(jaw,'sph',coat2,0.075,0.035,0.05+sn*0.35,0,0,sn*0.4);
  P(jaw,'sph',mat('#ff7a8a',{s:60}),0.045,0.02,0.045,0,0.005,sn*0.4+0.02).userData.noOutline=true;
  const er = p.bigEyes?0.06:0.048;
  faceEyes(head,0,0.055,hr*0.8,0.078,er,{iris:p.iris||'#3a2210'});
  for(const s of [-1,1]) P(head,'sph',p.tan?coat2:mat(shade(colr(p.coat,tc),0.7),{s:14}),0.04,0.016,0.02,s*0.08,0.12,hr*0.86,0,0,s*-0.2).userData.noOutline=true;
  const ec=c(p.earColor||p.coat);
  switch(p.ears){
    case 'floppy': for(const s of [-1,1]) P(head,'sph',ec,0.05,0.13,0.08,s*hr*0.95,-0.03,-0.02,0,0,s*0.25); break;
    case 'long': for(const s of [-1,1]){ for(let i=0;i<4;i++) P(head,'puff',ec,0.07-i*0.004,0.08,0.075,s*(hr*1.0+i*0.008),-0.03-i*0.075,-0.02+Math.sin(i)*0.015); } break;
    case 'pointy': for(const s of [-1,1]) P(head,'cone',ec,0.065,0.17,0.04,s*hr*0.6,hr*0.96,-0.02,0,0,-s*0.2); break;
    case 'pointyTip': for(const s of [-1,1]){ P(head,'cone',ec,0.065,0.15,0.04,s*hr*0.6,hr*0.92,-0.02,0,0,-s*0.2); P(head,'cone',mat('#ffffff',{s:14}),0.03,0.06,0.03,s*hr*0.68,hr*1.02,0.02,0.9,0,-s*0.2);} break;
    case 'bat': for(const s of [-1,1]){ P(head,'cone',ec,0.11,0.26,0.04,s*hr*0.92,hr*0.86,-0.02,0,0,-s*0.6); P(head,'cone',mat('#ffb6c8',{s:20}),0.07,0.18,0.02,s*hr*0.9,hr*0.84,0.0,0,0,-s*0.6).userData.noOutline=true; } break;
    case 'folded': for(const s of [-1,1]) P(head,'cone4',ec,0.075,0.11,0.03,s*hr*0.72,hr*0.76,0.04,0.6,0,-s*0.4); break;
    case 'round': for(const s of [-1,1]){ P(head,'sph',ec,0.075,0.075,0.025,s*hr*0.75,hr*0.86,-0.02); } break;
    case 'bear': for(const s of [-1,1]) P(head,'sph',ec,0.065,0.065,0.045,s*hr*0.7,hr*0.86,-0.02); break;
    case 'horns': for(const s of [-1,1]){ const hn=G0(); hn.position.set(s*hr*0.8,hr*0.6,0.0); head.add(hn); P(hn,'caps',mat('#f6efe0',{s:60}),0.07,0.16,0.07,s*0.12,0.03,0,0,0,-s*1.3); P(hn,'cone',mat('#f6efe0',{s:60}),0.035,0.12,0.035,s*0.26,0.12,0,0,0,-s*0.2); P(head,'sph',ec,0.04,0.06,0.03,s*hr*0.98,hr*0.3,-0.04,0,0,s*0.9);} break;
  }
  if(p.ring) P(head,'torThin',gold(),0.04,0.04,0.04,0,-0.07,hr*0.7+sn*0.95+0.05,PI/2);
  if(p.crown){ const gm=gold(); P(head,'cyl',gm,hr*0.56,0.085,hr*0.56,0,hr*0.98,-0.01); for(let i=0;i<5;i++){ const a=i/5*TAU; P(head,'cone',gm,0.03,0.1,0.03,Math.cos(a)*hr*0.49,hr*1.1,Math.sin(a)*hr*0.49-0.01); P(head,'sphLo',gm,0.016,0.016,0.016,Math.cos(a)*hr*0.49,hr*1.16,Math.sin(a)*hr*0.49-0.01);} P(head,'sph',mat('#e5443f',{s:150}),0.03,0.03,0.015,0,hr*1.0,hr*0.56); }
  // collar
  P(front,'tor',c('T'),0.14,0.12,0.55,0,0.07,0.06,PI/2-0.5);
  P(front,'sph',gold(),0.032,0.032,0.016,0,-0.05,0.18);
  // legs
  R.legs=[];
  const legm = p.tan ? coat2 : p.collie ? mat('#ffffff',{s:14}) : coat;
  for(const [grp,zs] of [[front,1],[back,-1]]) for(const s of [-1,1]){
    const lg=G0(); lg.position.set(s*0.12*ch,-0.06,zs*0.02); grp.add(lg);
    const ll=LL+0.1;
    P(lg,'caps',coat,0.12*ch,ll*0.5,0.13*ch,0,-ll*0.48,0);
    P(lg,'sph',legm,0.065*ch,0.045,0.08*ch,0,-ll+0.01,0.025);
    R.legs.push(lg);
  }
  // tail
  const tail=G0(); tail.position.set(0,0.1,-0.08); back.add(tail); R.tail=tail;
  switch(p.tail){
    case 'curl': P(tail,'tor',coat,0.07,0.07,0.65,0,0.08,-0.04,0,PI/2); break;
    case 'long': P(tail,'cone',coat,0.04,0.34,0.04,0,0.08,-0.13,-0.9); break;
    case 'stub': P(tail,'sph',coat,0.045,0.045,0.055,0,0.02,-0.02); break;
    case 'whip': P(tail,'cyl',coat,0.016,0.36,0.016,0,-0.05,-0.12,0.5); P(tail,'puff',mat('#222'),0.045,0.065,0.045,0,-0.2,-0.2); break;
    case 'thin': P(tail,'cone',coat,0.028,0.28,0.028,0,0.06,-0.1,-0.7); break;
    case 'plume': for(let i=0;i<3;i++) P(tail,'puff',coat2,0.06-i*0.005,0.08,0.06,0,0.06+i*0.07,-0.06-i*0.04); break;
    case 'rat': P(tail,'cyl',mat('#ffb6c8'),0.013,0.52,0.013,0,-0.08,-0.22,1.2); break;
    case 'bushy': for(let i=0;i<4;i++) P(tail,'puff',coat,0.13-i*0.01,0.12,0.12,0,0.08+i*0.12,-0.1+Math.sin(i*0.9)*0.05); break;
  }
  if(p.cape) P(body,'rbox2',c(p.cape),0.42,0.03,0.52*L,0,0.2*ch,-0.02);
  quadMore(p,R,{body,head,front,back,coat,coat2,c,hr,sn,L,ch,tail,tc});
  R.height=(LL+0.5+(p.giraffe?0.5:0))*(p.size||1);
  root.scale.setScalar(p.size||1);
  return g;
}

// ---------------------------------------------------------------- flyers
function buildFlyer(p,tc){
  const g=G0(), R={type:'f',wings:[],rotors:[]}; g.userData.rig=R;
  const root=G0(); g.add(root); R.root=root;
  const T=mat(tc.main,{s:50});
  const wing=(s,col,len,tip)=>{ const wg=G0(); wg.position.set(s*0.18,0.1,0); root.add(wg); for(let i=0;i<3;i++){ P(wg,'sph',i===2&&tip?tip:col,0.16-i*0.02,0.035,0.14-i*0.02,s*(0.12+i*len),0,-i*0.03); } R.wings.push(wg); return wg; };
  switch(p.type){
    case 'eagle': {
      const br=mat('#6b4423',{s:20}), wh=mat('#f6f2ea',{s:20}), yl=mat('#ffc21f',{s:60});
      P(root,'sph',br,0.22,0.2,0.34); P(root,'sph',br,0.16,0.12,0.2,0,-0.05,-0.32);
      for(let i=-1;i<=1;i++) P(root,'sph',wh,0.08,0.025,0.18,i*0.08,0,-0.48,0,i*0.3);
      const hd=G0(); hd.position.set(0,0.16,0.3); root.add(hd); R.head=hd;
      P(hd,'head',wh,0.15,0.14,0.15); P(hd,'cone',yl,0.05,0.16,0.06,0,-0.02,0.18,PI/2+0.4); P(hd,'sph',yl,0.04,0.04,0.04,0,-0.06,0.22);
      faceEyes(hd,0,0.04,0.11,0.065,0.04,{iris:'#ffb000'}); for(const s of [-1,1]) P(hd,'rbox2',mat('#3a2414'),0.07,0.02,0.02,s*0.065,0.09,0.13,0,0,s*0.4).userData.noOutline=true;
      wing(-1,br,0.15,mat('#3a2414')); wing(1,br,0.15,mat('#3a2414'));
      for(const s of [-1,1]) P(root,'caps',yl,0.05,0.06,0.05,s*0.07,-0.2,0.05);
      P(root,'tor',T,0.13,0.12,0.4,0,0.1,0.22,PI/2-0.6);
      R.height=0.6; break; }
    case 'goose': {
      const gd=mat('#fff1c2',{s:50,m:0.15}), gw=mat('#fff8e6',{s:30}), or=mat('#ff8a1f',{s:60});
      P(root,'sph',gd,0.26,0.22,0.36); P(root,'sph',gd,0.18,0.14,0.18,0,0.06,-0.32);
      const nk=G0(); nk.position.set(0,0.12,0.28); root.add(nk);
      P(nk,'caps',gw,0.13,0.14,0.13,0,0.14,0.02,0.25);
      const hd=G0(); hd.position.set(0,0.34,0.1); nk.add(hd); R.head=hd;
      P(hd,'head',gw,0.12,0.11,0.13); P(hd,'cone',or,0.05,0.16,0.04,0,-0.02,0.17,PI/2); faceEyes(hd,0,0.03,0.09,0.06,0.032);
      P(hd,'cyl',gold(),0.08,0.05,0.08,0,0.1,0); for(let i=0;i<4;i++){ const a=i/4*TAU; P(hd,'cone',gold(),0.02,0.06,0.02,Math.cos(a)*0.065,0.15,Math.sin(a)*0.065); }
      wing(-1,gw,0.16,gd); wing(1,gw,0.16,gd);
      for(const s of [-1,1]) P(root,'sph',or,0.06,0.02,0.08,s*0.08,-0.21,0.04);
      P(root,'tor',T,0.12,0.11,0.45,0,0.2,0.27,PI/2-0.3);
      R.height=0.75; break; }
    case 'mosquito': {
      const dk=mat('#2a2a30',{s:60}), st=mat('#e8e0c8',{s:30});
      P(root,'sph',dk,0.09,0.09,0.11,0,0.02,0.03);
      for(let i=0;i<3;i++) P(root,'sph',i%2?st:dk,0.075-i*0.012,0.07-i*0.01,0.08,0,-0.01-i*0.02,-0.1-i*0.1,0.25);
      const hd=G0(); hd.position.set(0,0.04,0.15); root.add(hd); R.head=hd;
      P(hd,'sph',dk,0.065,0.06,0.06); for(const s of [-1,1]) P(hd,'sph',mat('#ff2a2a',{s:150,e:0.4}),0.04,0.045,0.04,s*0.045,0.015,0.03);
      P(hd,'cyl',dk,0.008,0.2,0.008,0,-0.04,0.12,PI/2+0.4);
      for(const s of [-1,1]) for(let i=0;i<3;i++) P(root,'cyl',dk,0.007,0.28,0.007,s*0.1,-0.1,0.06-i*0.06,0,0,s*0.7);
      for(const s of [-1,1]){ const wg=G0(); wg.position.set(s*0.05,0.08,0.0); root.add(wg); P(wg,'sph',mat('#e8f4ff',{op:0.45,s:150}),0.16,0.01,0.06,s*0.15,0,-0.03).userData.noOutline=true; R.wings.push(wg); }
      P(root,'sph',T,0.03,0.03,0.03,0,0.1,0.02);
      R.height=0.35; R.fast=true; break; }
    case 'drone': {
      const bd=mat('#2c2f36',{s:80}), arm=mat('#3a3d45',{s:60});
      P(root,'rboxS',p.tint?mat(p.tint,{s:80}):bd,0.42,0.16,0.42); P(root,'rbox2',T,0.43,0.04,0.43,0,0.02,0); if(p.ring) P(root,'torThin',mat('#ffffff',{e:1}),0.16,0.16,0.4,0,-0.02,0.24);
      for(const sx of [-1,1]) for(const sz of [-1,1]){ P(root,'rbox2',arm,0.36,0.04,0.05,sx*0.2,0.02,sz*0.2,0,sx*sz*PI/4); P(root,'cyl',bd,0.05,0.07,0.05,sx*0.32,0.05,sz*0.32);
        const rt=G0(); rt.position.set(sx*0.32,0.1,sz*0.32); root.add(rt); P(rt,'rbox2',mat('#888',{s:60}),0.32,0.008,0.04); P(rt,'cyl',mat('#cfd6de',{op:0.2,s:120}),0.17,0.004,0.17).userData.noOutline=true; R.rotors.push(rt); }
      const cam=G0(); cam.position.set(0,-0.1,0.12); root.add(cam); R.head=cam; P(cam,'sph',bd,0.08,0.08,0.08); P(cam,'sph',mat('#ff2a2a',{e:1,s:150}),0.04,0.04,0.02,0,0,0.07);
      R.height=0.4; break; }
    case 'chopper': {
      const wh=mat(p.tint||'#f4f4f4',{s:70}), rd=mat(p.tint?'#ffd34d':'#e5443f',{s:60}), gl=mat('#8fd0ff',{op:0.6,s:150});
      P(root,'sph',wh,0.34,0.3,0.55); P(root,'sph',gl,0.28,0.22,0.24,0,0.06,0.38).userData.noOutline=true;
      for(const s of [-1,1]){ P(root,'rbox2',rd,0.02,0.16,0.05,s*0.34,0.02,0.0); P(root,'rbox2',rd,0.02,0.05,0.16,s*0.34,0.02,0.0); }
      P(root,'torThin',T,0.345,0.56,0.7,0,-0.02,0,PI/2);
      P(root,'caps',wh,0.12,0.45,0.12,0,0.06,-0.75,PI/2); P(root,'rbox2',rd,0.03,0.22,0.16,0,0.18,-1.05);
      for(const s of [-1,1]){ P(root,'cyl',mat('#555'),0.02,0.24,0.02,s*0.2,-0.38,0.0); P(root,'caps',mat('#555'),0.04,0.4,0.04,s*0.2,-0.48,0.0,PI/2); }
      P(root,'cyl',mat('#333'),0.04,0.12,0.04,0,0.34,0.0);
      const mr=G0(); mr.position.set(0,0.42,0); root.add(mr); P(mr,'rbox2',mat('#333',{s:60}),1.9,0.015,0.1); P(mr,'rbox2',mat('#333',{s:60}),0.1,0.015,1.9); R.rotors.push(mr);
      const tr=G0(); tr.position.set(0.05,0.2,-1.05); root.add(tr); P(tr,'rbox2',mat('#333'),0.01,0.4,0.05); R.rotors.push(tr); tr.userData.axis='x';
      R.height=0.8; break; }
    case 'plane': {
      const yl=mat(p.tint||'#ffc21f',{s:70}), rd=mat('#e5443f',{s:60}), gl=mat('#8fd0ff',{op:0.6,s:150});
      P(root,'caps',yl,0.36,0.6,0.36,0,0,0,PI/2); P(root,'sph',gl,0.16,0.12,0.18,0,0.13,0.3).userData.noOutline=true;
      P(root,'rboxS',yl,2.0,0.05,0.38,0,0.05,0.05); for(const s of [-1,1]) P(root,'rbox2',T,0.3,0.055,0.39,s*0.8,0.05,0.05);
      P(root,'rbox2',yl,0.7,0.04,0.22,0,0.08,-0.62); P(root,'rbox2',rd,0.04,0.3,0.24,0,0.22,-0.65);
      P(root,'caps',mat('#d8d8d8',{s:80}),0.2,0.25,0.2,0,-0.2,0,PI/2); P(root,'rbox2',rd,0.37,0.06,0.37,0,0,0.42).scale.set(0.37,0.37,0.06);
      for(const s of [-1,1]){ P(root,'caps',yl,0.12,0.12,0.12,s*0.45,0.02,0.28,PI/2); const pr=G0(); pr.position.set(s*0.45,0.02,0.4); root.add(pr); P(pr,'rbox2',mat('#333'),0.5,0.04,0.012); P(pr,'sph',rd,0.04,0.04,0.04); R.rotors.push(pr); pr.userData.axis='z'; }
      R.height=0.6; break; }
    default: flyerMore(p,R,root,T,wing,tc);
  }
  return g;
}

// ---------------------------------------------------------------- vehicles
function buildVehicle(p,tc){
  const g=G0(), R={type:'v'}; g.userData.rig=R;
  const root=G0(); g.add(root); R.root=root;
  const body=mat(p.color,{s:80}), glass=mat('#25384f',{s:150,m:0.3}), tire=mat('#1e1e22',{s:10}), stripe=mat(tc.main,{s:70}), chrome=metal();
  const light=mat('#fff6c8',{e:1}), tail=mat('#ff3030',{e:0.6});
  R.wheels=[];
  const wheel=(x,z,r=0.23)=>{ const w=P(root,'cyl',tire,r,0.17,r,x,r,z,0,0,PI/2); P(w,'cyl',chrome,0.55,1.06,0.55); P(w,'cyl',mat('#555',{s:60}),0.25,1.1,0.25); R.wheels.push(w); };
  const lights=(zf,zb,y,xs)=>{ for(const s of [-1,1]){ P(root,'cyl',light,0.08,0.03,0.08,s*xs,y,zf,PI/2); P(root,'rbox2',tail,0.12,0.06,0.03,s*xs,y,zb); } };
  switch(p.type){
    case 'dozer':
      for(const s of [-1,1]){ P(root,'rboxS',tire,0.28,0.38,1.55,s*0.56,0.21,0); for(let i=0;i<4;i++) R.wheels.push(P(root,'cyl',mat('#555',{s:60}),0.13,0.3,0.13,s*0.56,0.21,-0.55+i*0.37,0,0,PI/2)); }
      P(root,'rboxS',body,1.0,0.5,1.3,0,0.62,0); P(root,'rboxS',body,0.82,0.64,0.72,0,1.12,-0.25); P(root,'rbox2',glass,0.72,0.36,0.74,0,1.17,-0.25);
      P(root,'rbox2',stripe,1.02,0.1,1.32,0,0.64,0); P(root,'rbox2',mat('#222'),1.04,0.05,1.34,0,0.42,0);
      R.blade=P(root,'rboxS',mat('#c79a18',{s:60}),1.65,0.52,0.14,0,0.38,0.97); for(const s of [-1,1]) P(root,'caps',chrome,0.07,0.3,0.07,s*0.35,0.5,0.75,PI/2);
      P(root,'cyl',mat('#333',{s:60}),0.05,0.55,0.05,0.32,1.42,0.2); P(root,'cyl',light,0.06,0.03,0.06,-0.3,1.47,0.12,PI/2); R.height=1.4; break;
    case 'firetruck':
      P(root,'rboxS',body,1.12,0.72,2.3,0,0.67,0); P(root,'rboxS',body,1.12,0.58,0.72,0,1.22,0.75); P(root,'rbox2',glass,1.02,0.32,0.05,0,1.26,1.11);
      P(root,'rbox2',stripe,1.14,0.12,2.32,0,0.6,0); P(root,'rbox2',chrome,1.14,0.06,2.32,0,0.82,0); P(root,'rbox2',chrome,1.2,0.16,0.08,0,0.42,1.17);
      for(let i=0;i<3;i++) for(const s of [-1,1]) P(root,'rbox2',mat('#b02020',{s:60}),0.02,0.38,0.42,s*0.57,0.72,-0.8+i*0.5);
      { const lad=G0(); lad.position.set(0,1.07,-0.2); root.add(lad); R.ladder=lad; for(const s of [-1,1]) P(lad,'rbox2',chrome,0.06,0.06,1.85,s*0.25,0,0); for(let i=0;i<8;i++) P(lad,'rbox2',chrome,0.5,0.04,0.04,0,0,-0.82+i*0.235); }
      R.siren=[P(root,'rbox2',mat('#ff3030',{e:0.9}),0.3,0.1,0.16,-0.2,1.55,0.75),P(root,'rbox2',mat('#3a7bff',{e:0.9}),0.3,0.1,0.16,0.2,1.55,0.75)];
      lights(1.17,-1.16,0.6,0.42); wheel(-0.56,0.75); wheel(0.56,0.75); wheel(-0.56,-0.55); wheel(0.56,-0.55); wheel(-0.56,-0.92); wheel(0.56,-0.92); R.height=1.6; break;
    case 'van':
      P(root,'rboxS',body,1.16,0.96,1.96,0,0.8,0); P(root,'rbox2',glass,1.02,0.36,0.05,0,1.02,0.99); for(const s of [-1,1]) P(root,'rbox2',glass,0.05,0.3,0.9,s*0.585,1.04,0.1);
      P(root,'rbox2',stripe,1.18,0.14,1.98,0,0.6,0); P(root,'rbox2',mat('#555',{s:80,m:0.5}),1.22,0.26,0.1,0,0.42,1.01); for(let i=0;i<4;i++) P(root,'rbox2',chrome,0.06,0.2,0.04,-0.27+i*0.18,0.42,1.07);
      R.siren=[P(root,'rbox2',mat('#ff3030',{e:0.9}),0.26,0.08,0.13,-0.15,1.32,0.6),P(root,'rbox2',mat('#3a7bff',{e:0.9}),0.26,0.08,0.13,0.15,1.32,0.6)];
      lights(0.99,-0.99,0.65,0.42); wheel(-0.56,0.62); wheel(0.56,0.62); wheel(-0.56,-0.62); wheel(0.56,-0.62); R.height=1.4; break;
    case 'ambulance':
      P(root,'rboxS',body,1.16,1.02,2.02,0,0.82,0); P(root,'rbox2',glass,1.02,0.34,0.05,0,1.07,1.02);
      P(root,'rbox2',mat('#e5443f',{s:60}),1.18,0.16,2.04,0,0.63,0); for(const s of [-1,1]){ P(root,'rbox2',mat('#e5443f'),0.02,0.38,0.12,s*0.59,1.0,-0.2); P(root,'rbox2',mat('#e5443f'),0.02,0.12,0.38,s*0.59,1.0,-0.2);} P(root,'rbox2',stripe,1.18,0.07,2.04,0,0.46,0);
      R.siren=[P(root,'rbox2',mat('#ff3030',{e:0.9}),0.3,0.1,0.16,-0.2,1.38,0.72),P(root,'rbox2',mat('#3a7bff',{e:0.9}),0.3,0.1,0.16,0.2,1.38,0.72)];
      lights(1.02,-1.02,0.62,0.42); wheel(-0.56,0.62); wheel(0.56,0.62); wheel(-0.56,-0.62); wheel(0.56,-0.62); R.height=1.45; break;
    case 'rover':
      P(root,'rboxS',body,1.12,0.26,1.72,0,0.56,0); P(root,'rbox2',stripe,1.14,0.08,1.74,0,0.5,0);
      P(root,'rboxS',mat('#555'),0.52,0.36,0.16,0,0.86,-0.12); P(root,'cyl',mat('#999'),0.02,0.6,0.02,0.36,1.0,-0.6);
      { const d=G0(); d.position.set(0.36,1.36,-0.6); root.add(d); P(d,'dish',mat('#f0f0f0',{s:90}),0.26,0.26,0.26,0,0,0,-PI/2.5); R.dish=d; }
      P(root,'rbox2',mat('#ffd34d',{s:120,m:0.5}),0.92,0.06,0.52,0,0.73,0.56); P(root,'rbox2',mat('#2a3a55',{s:150}),0.88,0.04,0.48,0,0.76,0.56);
      for(const s of [-1,1]) P(root,'cyl',light,0.06,0.03,0.06,s*0.35,0.62,0.87,PI/2);
      for(const z of [0.62,0,-0.62]){ wheel(-0.63,z,0.27); wheel(0.63,z,0.27); } R.height=1.4; break;
    case 'foodtruck':
      P(root,'rboxS',body,1.16,1.04,2.1,0,0.84,-0.05); P(root,'rboxS',body,1.12,0.62,0.6,0,0.62,1.0); P(root,'rbox2',glass,1.0,0.3,0.05,0,0.82,1.31);
      P(root,'rbox2',mat('#3a2414'),0.02,0.42,1.1,0.585,0.95,-0.1); P(root,'rbox2',mat('#fff6dc',{e:0.2}),0.03,0.36,1.0,0.59,0.95,-0.1);
      for(let i=0;i<6;i++) P(root,'rbox2',mat(i%2?'#ffffff':'#e5443f',{s:40}),0.32,0.03,0.2,0.75,1.22,-0.6+i*0.2,0,0,-0.35);
      P(root,'rbox2',stripe,1.18,0.12,2.12,0,0.42,-0.05);
      { const bg=G0(); bg.position.set(0,1.5,-0.2); root.add(bg); R.burger=bg; P(bg,'sph',mat('#e0a040',{s:40}),0.42,0.18,0.42,0,0.12,0); P(bg,'cyl',mat('#5a2a12',{s:20}),0.44,0.1,0.44,0,0,0); P(bg,'cyl',mat('#4caf3a',{s:20}),0.47,0.03,0.47,0,0.06,0); P(bg,'cyl',mat('#ffcf3d'),0.45,0.03,0.45,0,-0.06,0); P(bg,'cyl',mat('#e0a040',{s:40}),0.42,0.08,0.42,0,-0.12,0);
        for(let i=0;i<7;i++){ const a=i/7*TAU; P(bg,'sphLo',mat('#fff6dc'),0.025,0.012,0.04,Math.cos(a)*0.25,0.28,Math.sin(a)*0.25); } }
      lights(1.31,-1.1,0.62,0.42); wheel(-0.56,0.75); wheel(0.56,0.75); wheel(-0.56,-0.65); wheel(0.56,-0.65); R.height=1.9; break;
    case 'tourbus':
      P(root,'rboxS',body,1.16,1.1,2.5,0,0.86,0); for(const s of [-1,1]) for(let i=0;i<4;i++) P(root,'rbox2',glass,0.04,0.3,0.42,s*0.585,1.1,-0.85+i*0.55);
      P(root,'rbox2',glass,1.02,0.42,0.05,0,1.05,1.25); P(root,'rbox2',mat('#ff3dce',{e:0.8}),1.18,0.06,2.52,0,0.75,0); P(root,'rbox2',mat('#7a1cff',{e:0.6}),1.18,0.06,2.52,0,0.62,0);
      for(const s of [-1,1]) P(root,'rbox2',mat('#ffffff',{map:labelTex(p.label||'ROCK TOUR','#111','#ff3dce'),basic:1}),0.01,0.22,1.4,s*0.59,1.43,0);
      for(const s of [-1,1]){ P(root,'rboxS',mat('#151515'),0.32,0.3,0.3,s*0.3,1.58,-0.7); P(root,'cyl',mat('#555'),0.1,0.02,0.1,s*0.3,1.58,-0.54,PI/2); }
      P(root,'rbox2',stripe,1.18,0.1,2.52,0,0.4,0);
      lights(1.25,-1.25,0.6,0.42); wheel(-0.56,0.85); wheel(0.56,0.85); wheel(-0.56,-0.85); wheel(0.56,-0.85); R.height=1.8; break;
    default: vehicleMore(p,R,root,{body,glass,tire,stripe,chrome,light,wheel,lights,tc});
  }
  return g;
}

// ---------------------------------------------------------------- buildings
function buildBuilding(p,tc){
  const g=G0(), R={type:'b'}; g.userData.rig=R;
  const root=G0(); g.add(root); R.root=root;
  const T=mat(tc.main,{s:60});
  switch(p.type){
    case 'dish': P(root,'rboxS',mat('#8a93a0',{s:40}),1.2,0.5,1.2,0,0.25,0); P(root,'rbox2',T,1.22,0.12,1.22,0,0.42,0); P(root,'cyl',metal('#bbbbbb'),0.08,0.9,0.08,0,0.9,0);
      { const hd=G0(); hd.position.y=1.45; root.add(hd); R.head=hd; P(hd,'dish',mat(p.color,{s:80}),0.62,0.62,0.62,0,0,0,PI/2.4); P(hd,'cyl',metal('#888'),0.02,0.5,0.02,0,0.1,0.3,PI/2.4); P(hd,'sph',mat('#7df9ff',{e:1}),0.07,0.07,0.07,0,0.2,0.5); }
      for(const s of [-1,1]) P(root,'sph',mat(s>0?'#39ff6a':'#ff3b3b',{e:0.8}),0.04,0.04,0.04,s*0.4,0.25,0.61);
      R.height=2.1; break;
    case 'hydrant': { const rd=mat(p.color,{s:80}); P(root,'caps',rd,0.62,0.6,0.62,0,0.5,0); P(root,'cyl',rd,0.42,0.12,0.42,0,0.06,0); P(root,'rbox2',T,0.66,0.1,0.66,0,0.65,0);
      { const hd=G0(); hd.position.y=0.9; root.add(hd); R.head=hd; P(hd,'hemi',rd,0.34,0.26,0.34); P(hd,'cyl',gold(),0.06,0.12,0.06,0,0.28,0); P(hd,'caps',gold(),0.18,0.18,0.18,0,-0.15,0.3,PI/2); }
      for(const s of [-1,1]) P(root,'cyl',gold(),0.08,0.15,0.08,s*0.36,0.6,0,0,0,PI/2);
      R.height=1.4; break; }
    case 'wall': { const bm=mat(p.color,{s:15,map:stoneTex(p.color)});
      P(root,'rbox2',bm,1.5,0.9,0.5,0,0.45,0); P(root,'rbox2',mat('#9a9a9a',{s:20}),1.56,0.08,0.56,0,0.92,0);
      P(root,'cyl',metal('#888'),0.02,0.5,0.02,0.6,1.15,0); P(root,'rbox2',T,0.25,0.16,0.01,0.73,1.3,0);
      R.height=1.1; break; }
    case 'desk': { const wd=mat('#6b4423',{s:40});
      P(root,'rboxS',wd,1.4,0.12,0.8,0,0.62,0); for(const sx of [-1,1]) P(root,'rbox2',wd,0.12,0.6,0.7,sx*0.62,0.3,0);
      for(let i=-1;i<=1;i++){ const mo=G0(); mo.position.set(i*0.44,0.95,-0.12); mo.rotation.y=-i*0.35; root.add(mo); P(mo,'rbox2',mat('#1a1a1e',{s:80}),0.42,0.3,0.04); P(mo,'plane',mat('#ffffff',{map:screenTex(i===0?'down':'up'+i),basic:1}),0.38,0.26,1,0,0,0.025); P(mo,'cyl',mat('#333'),0.02,0.22,0.02,0,-0.24,0); }
      for(let i=0;i<3;i++) P(root,'rbox2',mat('#4caf3a',{s:20}),0.2,0.05,0.1,-0.4+i*0.08,0.71+i*0.05,0.25);
      P(root,'rbox2',T,1.42,0.05,0.82,0,0.69,0); R.head=null;
      { const tk=G0(); tk.position.set(0,1.42,-0.2); root.add(tk); R.ticker=tk; P(tk,'rbox2',mat('#111'),1.2,0.16,0.05); P(tk,'plane',mat('#ffffff',{map:labelTex('$$$ +1 ▲','#111','#39ff6a'),basic:1}),1.1,0.13,1,0,0,0.03); }
      R.height=1.6; break; }
    default: buildingMore(p,R,root,T,tc);
  }
  return g;
}

function buildModel(m,team){
  const tc=TEAMC[team];
  if(m.k==='h') return buildHuman(m,tc);
  if(m.k==='q') return buildQuad(m,tc);
  if(m.k==='f') return buildFlyer(m,tc);
  if(m.k==='v') return buildVehicle(m,tc);
  if(m.k==='blob') return buildBlob(m,tc);
  if(m.k==='pen') return buildPenguin(m,tc);
  return buildBuilding(m,tc);
}

// ---------------------------------------------------------------- model cache: build once per (model, team), merge rigid parts, add outlines, clone per spawn
const MODEL_CACHE={}, TPL_RIG=new Map();
function mergeRigid(node){
  for(const ch of node.children.slice()) if(ch.children.length) mergeRigid(ch);
  const groups=new Map();
  for(const ch of node.children){ if(!ch.isMesh||ch.children.length||ch.name.startsWith('rig:')) continue; const k=ch.material.uuid+(ch.userData.noOutline?'n':''); if(!groups.has(k)) groups.set(k,[]); groups.get(k).push(ch); }
  for(const list of groups.values()){
    if(list.length<2) continue;
    const hasUV=list.every(m=>m.geometry.attributes.uv);
    const pos=[], nor=[], uvs=[];
    for(const m of list){ m.updateMatrix(); let gg=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone(); gg.applyMatrix4(m.matrix); pos.push(gg.attributes.position.array); nor.push(gg.attributes.normal.array); if(hasUV) uvs.push(gg.attributes.uv.array); gg.dispose(); }
    const cat=(arrs)=>{ const n=arrs.reduce((s,a)=>s+a.length,0), out=new Float32Array(n); let o=0; for(const a of arrs){ out.set(a,o); o+=a.length; } return out; };
    const mg=new THREE.BufferGeometry(); mg.setAttribute('position',new THREE.BufferAttribute(cat(pos),3)); mg.setAttribute('normal',new THREE.BufferAttribute(cat(nor),3)); if(hasUV) mg.setAttribute('uv',new THREE.BufferAttribute(cat(uvs),2)); mg.computeBoundingSphere();
    const mesh=new THREE.Mesh(mg,list[0].material); mesh.renderOrder=list[0].renderOrder; mesh.userData.noOutline=!!list[0].userData.noOutline; mesh.castShadow=list.some(m=>m.castShadow); mesh.receiveShadow=list.some(m=>m.receiveShadow); node.add(mesh);
    for(const m of list) node.remove(m);
  }
}
function tagRig(g){ const R=g.userData.rig; for(const k in R){ const v=R[k]; if(v&&v.isObject3D) v.name='rig:'+k; else if(Array.isArray(v)&&v[0]&&v[0].isObject3D) v.forEach((x,i)=>x.name='rig:'+k+':'+i); } }
function getModel(m,team,opts={}){
  const ink = opts.ink || TEAMC[team].ink;
  const key=JSON.stringify(m)+'|'+team+'|'+(QUALITY.outlines?ink:'')+'|'+QUALITY.shadows;
  let tpl=MODEL_CACHE[key];
  if(!tpl){ tpl=buildModel(m,team); tagRig(tpl); TPL_RIG.set(tpl,tpl.userData.rig); tpl.userData={}; mergeRigid(tpl); if(QUALITY.outlines) addOutlines(tpl,ink); setShadows(tpl,QUALITY.shadows,false); MODEL_CACHE[key]=tpl; }
  const c=tpl.clone(), R0=TPL_RIG.get(tpl), R={};
  for(const k in R0){ const v=R0[k]; if(!(v&&v.isObject3D)&&!(Array.isArray(v)&&v[0]&&v[0].isObject3D)) R[k]=v; }
  c.traverse(o=>{ if(o.name&&o.name.startsWith('rig:')){ const [,k,i]=o.name.split(':'); if(i!==undefined) (R[k]=R[k]||[])[+i]=o; else R[k]=o; } });
  c.userData={rig:R}; return c;
}
function clearModelCache(){ for(const k in MODEL_CACHE) delete MODEL_CACHE[k]; TPL_RIG.clear(); }
