// =====================================================================
//  MODELS (expansion) — extra props, outfits, hats, animals, flyers, blobs,
//  penguins, vehicles and buildings used by the expansion cards.
//  Hooked in from the default branches of the builders in models_chars.js.
// =====================================================================
function propMore(name,g,tc){
  const c=x=>mat(colr(x,tc),{s:40}), wood=mat('#8a5a2b',{s:20}), dark=mat('#25272c',{s:60}), steel=metal(), wh=mat('#ffffff',{s:40});
  switch(name){
    // pub
    case 'pint': { const gl=mat('#e8f6ff',{op:0.32,s:160}); P(g,'cyl',mat('#e8a21c',{s:120,e:0.12}),0.05,0.15,0.05,0,0.06,0.09); P(g,'cyl',mat('#fff8e6',{s:20}),0.055,0.035,0.055,0,0.15,0.09); P(g,'cyl',gl,0.06,0.19,0.06,0,0.07,0.09).userData.noOutline=true; break; }
    case 'darts': for(const s of [-1,0,1]){ P(g,'cyl',steel,0.006,0.1,0.006,s*0.03,0.13,0.08); P(g,'cyl',mat('#151515'),0.012,0.06,0.012,s*0.03,0.06,0.08); P(g,'cone4',mat(['#e5302a','#ffd21f','#2f80ed'][s+1]),0.03,0.05,0.004,s*0.03,0.01,0.08,PI); } break;
    case 'cue': P(g,'cyl',mat('#c89a5a',{s:70}),0.013,1.2,0.013,0,0.02,0.38,PI/2); P(g,'cyl',mat('#2a1a10',{s:70}),0.02,0.35,0.02,0,0.02,-0.05,PI/2); P(g,'cyl',mat('#3a7bd5'),0.014,0.03,0.014,0,0.02,0.98,PI/2); break;
    case 'stool': P(g,'cyl',wood,0.012,0.18,0.012,0,0.05,0.07); P(g,'cyl',mat('#7a1f2a',{s:30}),0.17,0.05,0.17,0,0.32,0.07); for(let i=0;i<3;i++){ const a=i/3*TAU; P(g,'cyl',wood,0.014,0.34,0.014,Math.cos(a)*0.1,0.16,0.07+Math.sin(a)*0.1); } break;
    case 'pinttray': P(g,'cyl',mat('#d8dee6',{s:150}),0.2,0.015,0.2,0,0.02,0.12); for(let i=0;i<3;i++){ const a=i/3*TAU; P(g,'cyl',mat('#e8f6ff',{op:0.4,s:160}),0.04,0.13,0.04,Math.cos(a)*0.09,0.09,0.12+Math.sin(a)*0.09).userData.noOutline=true; P(g,'cyl',mat('#fff8e6'),0.035,0.02,0.035,Math.cos(a)*0.09,0.03,0.12+Math.sin(a)*0.09); } break;
    case 'fiddle': { const fg=G0(); fg.position.set(0,0.12,0.1); fg.rotation.set(-0.5,0,0.4); g.add(fg); const vw=mat('#8a3a12',{s:140}); P(fg,'sph',vw,0.13,0.17,0.05,0,0,0); P(fg,'sph',vw,0.1,0.11,0.05,0,0.19,0); P(fg,'rbox2',mat('#151515'),0.035,0.3,0.03,0,0.38,0.03); for(const s2 of [-1,1]) P(fg,'rbox2',mat('#151515'),0.012,0.06,0.01,s2*0.04,0.08,0.05); P(fg,'cyl',mat('#e8d8b0'),0.005,0.6,0.005,0.08,0.12,0.08,0,0,1.1); break; }
    case 'quizcard': P(g,'rbox2',mat('#ffffff',{map:labelTex('Q?','#ffffff','#2f5fd0'),s:20}),0.2,0.14,0.01,0,0.12,0.08); break;
    case 'crisps': P(g,'rbox2',mat('#e5302a',{s:60}),0.13,0.17,0.04,0,0.1,0.08); P(g,'rbox2',mat('#ffd21f'),0.08,0.05,0.042,0,0.1,0.08); break;
    case 'bbbat': P(g,'caps',mat('#e8c890',{s:50}),0.04,0.42,0.04,0,0.06,0.32,PI/2); P(g,'cyl',mat('#e8c890',{s:50}),0.018,0.22,0.018,0,0.03,0.06,PI/2); P(g,'sph',dark,0.03,0.03,0.03,0,0.02,-0.04); break;
    case 'mitt': P(g,'sph',mat('#8a4a1f',{s:70}),0.17,0.17,0.07,0,0.04,0.12); for(const s of [-1,0,1]) P(g,'caps',mat('#8a4a1f',{s:70}),0.035,0.1,0.035,s*0.07,0.16,0.12); P(g,'sph',wh,0.06,0.06,0.03,0,0.06,0.2); break;
    case 'hotdog': P(g,'caps',mat('#e8b868',{s:30}),0.05,0.18,0.05,0,0.04,0.08,0,0,PI/2); P(g,'caps',mat('#c8432a',{s:40}),0.04,0.22,0.04,0,0.075,0.08,0,0,PI/2); P(g,'box',mat('#ffcf3d'),0.2,0.012,0.012,0,0.115,0.08); break;
    case 'foamfinger': P(g,'rbox2',mat('#e5302a',{s:10}),0.26,0.22,0.1,0,0.16,0.1); P(g,'caps',mat('#e5302a',{s:10}),0.05,0.34,0.05,0,0.5,0.1); P(g,'caps',mat('#e5302a',{s:10}),0.045,0.1,0.045,-0.12,0.28,0.1,0,0,0.5); P(g,'caps',mat('#e5302a',{s:10}),0.045,0.1,0.045,0.12,0.28,0.1,0,0,-0.5); P(g,'plane',mat('#ffffff',{map:labelTex('#1','#ffffff','#e5302a'),basic:1}),0.18,0.12,1,0,0.14,0.16); break;
    case 'radargun': P(g,'rbox2',mat('#3a3a44',{s:60}),0.1,0.12,0.26,0,0.0,0.14); P(g,'rbox2',mat('#3a3a44',{s:60}),0.07,0.14,0.07,0,-0.12,0.06); P(g,'cyl',mat('#7df9ff',{e:1}),0.07,0.015,0.07,0,0.01,0.29,PI/2); P(g,'rbox2',mat('#39ff6a',{e:1}),0.07,0.03,0.01,0,0.05,0.0); break;
    case 'tshirtcannon': P(g,'caps',mat('#c0c6cc',{s:100,m:0.6}),0.08,0.45,0.08,0,0.02,0.26,PI/2); P(g,'cyl',mat('#e5302a'),0.11,0.1,0.11,0,0.02,0.52,PI/2); P(g,'cyl',mat('#3a3a44'),0.04,0.18,0.04,0,-0.1,0.08); P(g,'rbox2',mat('#ffffff'),0.08,0.06,0.06,0,0.12,0.45,0,0,0.3); break;
    case 'organ': P(g,'rbox2',wood,0.36,0.08,0.18,0,-0.04,0.14); P(g,'rbox2',wh,0.32,0.03,0.12,0,0.02,0.16); for(let i=0;i<5;i++) P(g,'box',dark,0.02,0.02,0.07,-0.12+i*0.06,0.04,0.2); for(let i=0;i<4;i++) P(g,'cyl',steel,0.02,0.2,0.02,-0.1+i*0.07,0.12,0.06); break;
    case 'typewriter': P(g,'rbox2',mat('#3a3a44',{s:70}),0.3,0.1,0.22,0,-0.05,0.14); P(g,'rbox2',mat('#f5ecd0'),0.18,0.14,0.01,0,0.06,0.06,-0.3); for(let i=0;i<3;i++) P(g,'box',mat('#e8e8e8'),0.24,0.015,0.03,0,0.005,0.2-i*0.045); break;
    case 'stamp': P(g,'caps',wood,0.07,0.08,0.07,0,0.04,0.08); P(g,'cyl',mat('#b3202a',{s:50}),0.08,0.05,0.08,0,-0.06,0.08); break;
    case 'scepter': P(g,'cyl',gold(),0.025,0.7,0.025,0,0.1,0.06); P(g,'sph',gold(),0.06,0.06,0.06,0,0.47,0.06); P(g,'sph',mat('#e5443f',{s:150}),0.045,0.045,0.045,0,0.55,0.06); break;
    case 'magnifier': P(g,'caps',wood,0.04,0.08,0.04,0,0,0.08,PI/2); P(g,'torThin',gold(),0.1,0.1,0.1,0,0,0.24,0,PI/2); P(g,'cyl',mat('#bfe8ff',{op:0.5,s:150}),0.09,0.01,0.09,0,0,0.24,0,0,PI/2).userData.noOutline=true; break;
    case 'coffee': P(g,'cyl',wh,0.06,0.16,0.05,0,0.06,0.06); P(g,'cyl',mat('#8a5a2b'),0.062,0.06,0.052,0,0.05,0.06); P(g,'cyl',wh,0.065,0.02,0.055,0,0.15,0.06); break;
    case 'telescope': P(g,'cyl',mat('#3a3a5a',{s:90,m:0.4}),0.05,0.5,0.05,0,0.05,0.2,PI/2.3); P(g,'cyl',gold(),0.06,0.04,0.06,0,0.12,0.42,PI/2.3); break;
    case 'wrench': P(g,'rbox2',steel,0.04,0.02,0.3,0,0,0.15); P(g,'torHalf',steel,0.06,0.06,0.2,0,0,0.32,PI/2); break;
    case 'lamp': P(g,'cyl',dark,0.015,0.2,0.015,0,0.05,0.08); P(g,'cone',dark,0.09,0.1,0.09,0,0.16,0.12,-0.6); P(g,'sph',mat('#fff2a8',{e:1}),0.04,0.04,0.04,0,0.13,0.15); break;
    case 'megaphone': P(g,'rbox2',mat('#e5443f'),0.04,0.1,0.04,0,-0.04,0.05); P(g,'cone',mat('#f2f2f2',{s:60}),0.11,0.26,0.11,0,0.02,0.2,-PI/2); P(g,'cyl',mat('#e5443f'),0.112,0.02,0.112,0,0.02,0.33,PI/2); break;
    case 'pillbottle': P(g,'cyl',mat('#ff9a1f',{op:0.85,s:120}),0.06,0.14,0.06,0,0.04,0.08); P(g,'cyl',wh,0.065,0.04,0.065,0,0.13,0.08); break;
    case 'wine': P(g,'cyl',mat('#2a5a2a',{s:120}),0.05,0.2,0.05,0,0.06,0.08); P(g,'cyl',mat('#2a5a2a',{s:120}),0.02,0.1,0.02,0,0.2,0.08); P(g,'cyl',mat('#f5ecd0'),0.052,0.07,0.052,0,0.05,0.08); break;
    case 'spatula': P(g,'caps',wood,0.03,0.12,0.03,0,0,0.12,PI/2); P(g,'rbox2',steel,0.11,0.015,0.13,0,0,0.3); break;
    case 'saucebottle': P(g,'cyl',mat('#e5302a',{s:80}),0.06,0.18,0.06,0,0.06,0.08); P(g,'cone',wh,0.035,0.08,0.035,0,0.19,0.08); break;
    case 'spoon': P(g,'caps',wood,0.03,0.2,0.03,0,0,0.18,PI/2); P(g,'sph',wood,0.07,0.025,0.09,0,0.01,0.42); break;
    case 'sponge': P(g,'rbox',mat('#ffd34d',{s:10}),0.16,0.08,0.11,0,0,0.08); P(g,'rbox2',mat('#3a9a3a',{s:10}),0.16,0.03,0.11,0,0.05,0.08); break;
    case 'bucket': P(g,'cyl',mat('#c0c6cc',{s:90,m:0.5}),0.1,0.16,0.08,0,-0.12,0.06); P(g,'torHalf',steel,0.09,0.09,0.2,0,-0.04,0.06); P(g,'cyl',mat('#4fb8ff'),0.09,0.01,0.075,0,-0.04,0.06); break;
    case 'plunger': P(g,'cyl',wood,0.02,0.4,0.02,0,0,0.2,PI/2); P(g,'hemi',mat('#c0202a',{s:60}),0.1,0.1,0.1,0,0,0.42,-PI/2); break;
    case 'laserlevel': P(g,'rbox2',mat('#ffd21f',{s:60}),0.1,0.1,0.2,0,0,0.1); P(g,'sph',mat('#ff2020',{e:1}),0.025,0.025,0.025,0,0.02,0.21); break;
    case 'pliers': for(const s of [-1,1]) P(g,'rbox2',mat('#e5443f'),0.025,0.025,0.18,s*0.025,0,0.08,0,s*0.12); P(g,'rbox2',steel,0.05,0.03,0.1,0,0,0.22); break;
    case 'jackhammer': P(g,'caps',mat('#ffd21f',{s:60}),0.11,0.16,0.11,0,0.05,0.12); P(g,'cyl',steel,0.02,0.3,0.02,0,-0.2,0.12); P(g,'rbox2',dark,0.3,0.04,0.04,0,0.22,0.12); break;
    case 'flightcase': P(g,'rbox2',mat('#151515',{s:40}),0.36,0.26,0.16,0,-0.16,0.03); for(const s of [-1,1]) P(g,'box',steel,0.38,0.03,0.17,0,-0.16+s*0.11,0.03); break;
    case 'firework': P(g,'cyl',mat('#e5443f',{s:50}),0.05,0.28,0.05,0,0.1,0.08); P(g,'cone',mat('#ffd34d'),0.05,0.1,0.05,0,0.29,0.08); P(g,'cyl',wood,0.008,0.3,0.008,0,-0.12,0.08); break;
    case 'keytar': { const k=G0(); k.position.set(-0.05,0.05,0.12); k.rotation.set(0.2,0,-0.9); g.add(k); P(k,'rbox2',mat('#e8e8e8',{s:90}),0.16,0.5,0.05,0,0.05,0); P(k,'box',mat('#151515'),0.1,0.36,0.052,0.02,0.05,0); P(k,'rbox2',c('T'),0.06,0.2,0.04,0,0.4,0); break; }
    case 'racket': P(g,'caps',mat('#222'),0.035,0.1,0.035,0,0,0.1,PI/2); P(g,'tor',mat(colr('T',tc),{s:80}),0.13,0.17,0.25,0,0,0.38,0,PI/2); P(g,'cyl',mat('#f4f4f4',{op:0.6}),0.12,0.004,0.16,0,0,0.38,0,0,PI/2).userData.noOutline=true; break;
    case 'redcard': P(g,'rbox2',mat('#e5302a',{s:60,e:0.2}),0.11,0.16,0.01,0,0.12,0.06); break;
    case 'glove': P(g,'sph',mat(colr('T',tc),{s:90}),0.11,0.11,0.13,0,0,0.04); P(g,'cyl',wh,0.08,0.05,0.08,0,0,-0.07,PI/2); break;
    case 'pompom': P(g,'puff',mat(colr('T',tc),{s:20}),0.13,0.13,0.13,0,0.02,0.05); break;
    case 'basketball': P(g,'sph',mat('#e8742a',{s:30}),0.12,0.12,0.12,0,0.05,0.1); P(g,'torThin',dark,0.121,0.121,0.121,0,0.05,0.1); break;
    case 'golfclub': P(g,'cyl',steel,0.012,0.7,0.012,0,-0.28,0.08); P(g,'rbox2',mat('#3a3a44',{s:120,m:0.6}),0.05,0.06,0.12,0,-0.62,0.12); break;
    case 'hockeystick': P(g,'rbox2',mat('#151515'),0.03,0.65,0.03,0,-0.25,0.12,0.3); P(g,'rbox2',mat('#f2f2f2'),0.03,0.06,0.2,0,-0.56,0.25,0.3); break;
    case 'skateboard': P(g,'rboxS',mat(colr('T',tc),{s:50}),0.2,0.03,0.62,0,-0.08,0.08); for(const z of [-0.2,0.2]) for(const s of [-1,1]) P(g,'cyl',mat('#ffd34d',{s:60}),0.03,0.03,0.03,s*0.08,-0.12,0.08+z,0,0,PI/2); break;
    case 'brush': P(g,'cyl',wood,0.015,0.32,0.015,0,0,0.16,PI/2); P(g,'cone',mat(colr('T',tc),{s:30}),0.03,0.09,0.03,0,0,0.36,PI/2); break;
    case 'palette': P(g,'cyl',mat('#d8b07a',{s:20}),0.2,0.02,0.15,0,0,0.06); for(let i=0;i<5;i++){ const a=i/5*PI-0.2; P(g,'sphLo',mat(['#e5302a','#ffd34d','#3a7bd5','#39d353','#ff3dce'][i],{s:60}),0.03,0.02,0.03,Math.cos(a)*0.12,0.015,0.06+Math.sin(a)*0.09); } break;
    case 'pencil': P(g,'cyl',mat('#ffd34d',{s:40}),0.025,0.4,0.025,0,0,0.18,PI/2); P(g,'cone',mat('#f2d0a0'),0.025,0.07,0.025,0,0,0.41,PI/2); P(g,'cyl',mat('#ff8fb0'),0.026,0.04,0.026,0,0,-0.03,PI/2); break;
    case 'spraycan': P(g,'cyl',mat(colr('T',tc),{s:90}),0.05,0.17,0.05,0,0.05,0.07); P(g,'cyl',wh,0.025,0.03,0.025,0,0.16,0.07); break;
    case 'chisel': P(g,'cyl',wood,0.025,0.14,0.025,0,0,0.07,PI/2); P(g,'rbox2',steel,0.04,0.015,0.13,0,0,0.2); break;
    case 'blowpipe': P(g,'cyl',steel,0.015,0.55,0.015,0,0,0.25,PI/2); P(g,'sph',mat('#ff8a1f',{e:0.9}),0.07,0.07,0.07,0,0,0.55); break;
    case 'chainsaw': P(g,'rbox2',mat('#ff7a1a',{s:60}),0.12,0.12,0.18,0,0,0.06); P(g,'rbox2',steel,0.03,0.07,0.38,0,0,0.32); break;
    case 'crowbar': P(g,'cyl',mat('#b3202a',{s:80}),0.018,0.45,0.018,0,0,0.2,PI/2); P(g,'torHalf',mat('#b3202a',{s:80}),0.04,0.04,0.2,0,0.04,0.43,0,PI/2); break;
    case 'boommic': P(g,'cyl',steel,0.015,1.1,0.015,0,0.25,0.45,1.0); P(g,'caps',mat('#5a5a64',{s:10}),0.09,0.12,0.09,0,0.53,0.92,PI/2); break;
    case 'fan': for(let i=0;i<5;i++) P(g,'cone4',mat(i%2?'#ff3dce':'#151515',{s:40}),0.04,0.22,0.005,0,0.08,0.08,0,0,-0.8+i*0.4); break;
    case 'cutlass': P(g,'torHalf',gold(),0.05,0.05,0.2,0,0,0.02); P(g,'rbox2',steel,0.012,0.05,0.42,0,0,0.26,0.1); break;
    case 'lollipop': P(g,'cyl',wh,0.008,0.2,0.008,0,0.05,0.06); P(g,'cyl',mat('#ff3dce',{s:90}),0.08,0.02,0.08,0,0.18,0.06,PI/2); break;
    case 'selfiestick': P(g,'cyl',steel,0.012,0.6,0.012,0,0.22,0.15,0.6); P(g,'rbox2',dark,0.06,0.11,0.015,0,0.5,0.32,0.6); P(g,'box',mat('#ff9ae8',{e:0.8}),0.045,0.09,0.004,0,0.5,0.325,0.6); break;
    case 'dumbbell': P(g,'cyl',steel,0.02,0.28,0.02,0,0,0.04,0,0,PI/2); for(const s of [-1,1]) P(g,'cyl',dark,0.07,0.06,0.07,s*0.12,0,0.04,0,0,PI/2); break;
    case 'glitterjar': P(g,'cyl',mat('#ff9ae8',{op:0.75,e:0.4,s:150}),0.07,0.14,0.07,0,0.04,0.08); P(g,'cyl',gold(),0.072,0.03,0.072,0,0.12,0.08); break;
    case 'controller': P(g,'rboxS',dark,0.2,0.05,0.11,0,0,0.1); for(const s of [-1,1]) P(g,'sph',dark,0.05,0.045,0.06,s*0.09,-0.01,0.07); P(g,'sph',mat('#39ff6a',{e:0.8}),0.015,0.015,0.015,0.05,0.03,0.12); break;
    case 'suitcase': P(g,'rbox2',mat('#3dd6ff',{s:60}),0.3,0.38,0.14,0,-0.22,0.03); P(g,'torHalf',dark,0.06,0.05,0.3,0,-0.02,0.03); P(g,'sph',mat('#ffd34d'),0.05,0.05,0.01,0.06,-0.2,0.1); break;
    case 'chopsticks': for(const s of [-1,1]) P(g,'cyl',wood,0.01,0.3,0.01,s*0.015,0,0.15,PI/2); P(g,'sph',mat('#fff6dc'),0.05,0.04,0.05,0,0,0.3); break;
    case 'whip': P(g,'caps',mat('#3a2414'),0.03,0.08,0.03,0,0,0.06,PI/2); P(g,'tor',mat('#5a3418'),0.18,0.18,0.12,0,-0.1,0.25,0,PI/2); break;
    case 'banana': P(g,'torHalf',mat('#ffd84a',{s:40}),0.1,0.1,0.55,0,0,0.08,0,PI/2); break;
    case 'sign': P(g,'cyl',wood,0.015,0.6,0.015,0,0.15,0.06); P(g,'rbox2',mat('#ffffff',{map:labelTex('VOTE!','#ffffff','#2f5fd0'),s:40}),0.42,0.24,0.02,0,0.5,0.06); P(g,'rbox2',mat(colr('T',tc)),0.44,0.04,0.025,0,0.38,0.06); break;
    case 'bell': P(g,'cyl',wood,0.02,0.12,0.02,0,0.02,0.06); P(g,'cone',gold(),0.08,0.12,0.08,0,-0.08,0.06); P(g,'sph',gold(),0.025,0.025,0.025,0,-0.15,0.06); break;
    case 'mop': P(g,'cyl',wood,0.018,0.8,0.018,0,-0.15,0.12,0.5); for(let i=0;i<7;i++) P(g,'cyl',mat('#e8e0c8',{s:10}),0.02,0.16,0.02,Math.cos(i)*0.05,-0.55,0.32+Math.sin(i)*0.05,0.5); break;
    case 'cone': P(g,'cone',mat('#d8a868',{s:20}),0.06,0.18,0.06,0,-0.02,0.08,PI); P(g,'sph',mat('#ffb6d8',{s:30}),0.07,0.07,0.07,0,0.1,0.08); P(g,'sph',mat('#8a4a2a',{s:30}),0.06,0.06,0.06,0,0.18,0.08); break;
    case 'cushion': P(g,'sph',mat('#ff5ab0',{s:80}),0.13,0.05,0.12,0,0,0.12); P(g,'cyl',mat('#ff5ab0'),0.03,0.06,0.02,0,0,0.25,PI/2); break;
    case 'balloon': P(g,'cyl',wh,0.004,0.5,0.004,0,0.25,0.06); P(g,'sph',mat('#ff3dce',{s:150}),0.12,0.15,0.12,0,0.6,0.06); P(g,'caps',mat('#3dd6ff',{s:150}),0.06,0.12,0.06,0.15,0.5,0.06,0,0,0.8); break;
    case 'nailgun': P(g,'rbox2',mat('#ffd21f',{s:60}),0.07,0.12,0.24,0,0.02,0.12); P(g,'rbox2',dark,0.05,0.12,0.06,0,-0.06,0.04); P(g,'cyl',steel,0.015,0.06,0.015,0,0.02,0.26,PI/2); break;
    case 'sax': P(g,'cyl',gold(),0.035,0.4,0.035,0,0.05,0.1,0.3); P(g,'cone',gold(),0.08,0.14,0.08,0,-0.18,0.2,PI-0.6); P(g,'cyl',gold(),0.02,0.1,0.02,0,0.27,0.04,1.1); break;
    case 'javelin': P(g,'cyl',steel,0.012,1.3,0.012,0,0.1,0.3,1.2); P(g,'cone',steel,0.02,0.12,0.02,0,0.35,0.9,1.2); break;
    case 'bow': P(g,'torHalf',mat('#3a2414',{s:40}),0.3,0.3,0.2,0,0,0.12,0,PI/2,PI/2); P(g,'cyl',wh,0.003,0.6,0.003,0,0,0.12); break;
  }
}

// ---------------------------------------------------------------- outfits (torso decorations; ctx from buildHuman)
function shortsLegs(x,sockM,bootM){
  for(const L of x.R.legs){ P(L,'caps',x.skin,0.208,0.115,0.208,0,-0.27,0); if(sockM) P(L,'cyl',sockM,0.106,0.09,0.106,0,-0.33,0); if(bootM) P(L,'sph',bootM,0.11,0.08,0.155,0,-0.385,0.045); }
}
function outfitMore(ot,x){
  const {torso,hips,R,main,acc,skin,tw,th,td,fz,front,button,c,w}=x;
  const wh=mat('#ffffff',{s:40}), bk=mat('#151515',{s:40});
  switch(ot){
    case 'england': P(torso,'tor',acc,0.11,0.1,0.5,0,th*1.86,0,PI/2); for(const s of [-1,1]) P(torso,'rbox2',acc,0.026,0.14,0.035,s*0.04,th*1.66,fz,0,0,s*0.55);
      for(const s of [-1,1]) P(torso,'rbox2',mat('#14264a',{s:40}),0.025,th*1.5,td*1.2,s*tw*0.97,th*1.0,0);
      { const bx=tw*0.42, by=th*1.42, bz=fz*1.18+0.02; P(torso,'rbox2',mat('#ffffff',{s:30}),0.085,0.1,0.02,bx,by,bz); P(torso,'cone4',mat('#14264a'),0.045,0.035,0.022,bx,by-0.055,bz,PI); for(let i=0;i<3;i++) P(torso,'sphLo',mat('#2f5fd0'),0.014,0.01,0.012,bx,by+0.03-i*0.027,bz+0.012); }
      break;
    case 'kit': P(torso,'tor',acc,0.11,0.1,0.5,0,th*1.86,0,PI/2); for(const s of [-1,1]) P(torso,'rbox2',acc,0.028,0.15,0.035,s*0.04,th*1.66,fz,0,0,s*0.55); P(torso,'sph',acc,0.035,0.04,0.015,-0.1,th*1.38,fz+0.005);
      for(const s of [-1,1]) P(torso,'rbox2',acc,0.03,th*1.4,td*1.6,s*tw*0.96,th*1.05,0);
      P(hips,'cyl',x.pantsM,0.27*w,0.16,0.22,0,-0.04,0); shortsLegs(x,acc,x.p.boots?mat(x.p.boots,{s:60}):null);
      if(x.p.pads) for(const s of [-1,1]) P(torso,'sph',main,0.17,0.1,0.2,s*tw*0.8,th*1.78,0); break;
    case 'tracksuit': P(torso,'box',metal(),0.012,0.42,0.03,0,th*1.0,fz); P(torso,'tor',main,0.12,0.11,0.6,0,th*1.85,0,PI/2); for(const s of [-1,1]) P(torso,'rbox2',acc,0.03,th*1.6,td*1.7,s*tw*0.97,th*1.0,0); break;
    case 'referee': for(let i=0;i<5;i++) P(torso,'torThin',i%2?acc:main,tw*1.0,td*1.0,0.75,0,th*(0.35+i*0.32),0,PI/2); P(torso,'tor',bk,0.1,0.09,0.5,0,th*1.86,0,PI/2); P(hips,'cyl',x.pantsM,0.27*w,0.16,0.22,0,-0.04,0); shortsLegs(x,bk); break;
    case 'boxer': P(hips,'cyl',acc,0.28*w,0.2,0.23,0,-0.02,0); P(hips,'cyl',wh,0.285*w,0.05,0.235,0,0.08,0); shortsLegs(x,null,mat('#f2f2f2',{s:60}));
      for(const s of [-1,1]) P(torso,'sph',skin,0.11,0.07,0.04,s*0.08,th*1.45,fz-0.01); break;
    case 'sumo': P(torso,'sph',skin,tw*1.05,th*0.75,td*1.1,0,th*0.7,0.04); P(hips,'cyl',acc,0.28*w,0.12,0.24,0,0.04,0); P(hips,'rbox2',acc,0.12,0.24,0.03,0,-0.12,0.23); break;
    case 'swim': P(hips,'cyl',acc,0.26*w,0.1,0.21,0,0.0,0); shortsLegs(x,null,null); break;
    case 'smock': P(hips,'bell',main,0.38*w,0.36,0.32*Math.max(1,w*0.8),0,-0.12,0); P(torso,'sph',acc,0.06,0.04,0.03,-0.04,th*1.75,fz+0.01); P(torso,'sph',acc,0.06,0.04,0.03,0.04,th*1.75,fz+0.01);
      for(let i=0;i<6;i++) P(torso,'sphLo',mat(['#e5302a','#ffd34d','#3a7bd5','#39d353','#ff3dce','#ff8a1f'][i],{s:60}),0.03,0.03,0.012,Math.sin(i*2.1)*0.12,th*(0.5+i*0.18),fz+0.008); break;
    case 'toga': P(hips,'bell',main,0.42*w,0.56,0.38*Math.max(1,w*0.8),0,-0.22,0); P(torso,'tor',acc,tw*0.78,td*0.8,0.5,0,th*1.0,0,PI/2,0,0.6); P(torso,'sph',main,0.13,0.1,0.14,-tw*0.75,th*1.75,0); break;
    case 'tutu': for(let i=0;i<3;i++) P(hips,'cyl',i%2?acc:main,0.46-i*0.05,0.04,0.42-i*0.05,0,0.02+i*0.035,0); P(torso,'torThin',acc,tw*0.96,td*0.96,0.3,0,th*1.5,0,PI/2); break;
    case 'stripes': for(let i=0;i<5;i++) P(torso,'torThin',acc,tw*1.0,td*1.0,0.75,0,th*(0.4+i*0.3),0,PI/2); break;
    case 'superhero': P(torso,'oct',acc,0.1,0.1,0.03,0,th*1.25,fz); P(torso,'oct',main,0.06,0.06,0.035,0,th*1.25,fz+0.01); P(torso,'torThin',acc,tw*0.96,td*0.97,0.5,0,th*0.15,0,PI/2);
      for(const L of R.legs) P(L,'caps',acc,0.21,0.08,0.21,0,-0.35,0.01); break;
    case 'cowboy': P(torso,'torso',acc,tw*1.04,th*0.8,td*1.05,0,th*0.95,0); front(main,0.07,0.3,0,th*1.0); P(torso,'cone4',mat('#e5302a',{s:30}),0.09,0.1,0.03,0,th*1.72,fz,PI); for(const L of R.legs) P(L,'caps',mat('#6b4423',{s:20}),0.215,0.15,0.215,0,-0.15,0); break;
    case 'pirate': P(hips,'bell',main,0.38*w,0.42,0.32*Math.max(1,w*0.8),0,-0.14,0); front(wh,0.1,0.28,0,th*1.25); P(torso,'tor',acc,tw*0.98,td*1.0,0.35,0,th*0.3,0,PI/2); for(let i=0;i<3;i++) for(const s of [-1,1]) P(torso,'sphLo',gold(),0.02,0.02,0.012,s*0.08,th*(0.7+i*0.3),fz+0.01); break;
    case 'safari': for(const s of [-1,1]) P(torso,'rbox2',mat(shade(colr(x.oc,x.tc),0.85)),0.08,0.07,0.02,s*0.09,th*1.35,fz+0.003); front(acc,0.02,0.4,0,th*1.0); P(torso,'tor',main,0.1,0.09,0.55,0,th*1.85,0,PI/2); break;
    case 'fur': P(torso,'sph',acc,tw*0.7,th*0.75,0.06,0,th*0.95,fz-0.04); for(const s of [-1,1]) P(torso,'puff',main,0.13,0.12,0.13,s*tw*0.82,th*1.7,0); break;
    case 'ringmaster': front(wh,0.11,0.3,0,th*1.25); P(torso,'sphLo',bk,0.04,0.03,0.02,0,th*1.65,fz+0.02); for(let i=0;i<3;i++) for(const s of [-1,1]) P(torso,'sphLo',gold(),0.02,0.02,0.012,s*0.085,th*(0.65+i*0.28),fz+0.01);
      P(hips,'rbox2',main,0.3,0.4,0.04,0,-0.1,-0.2,-0.15); for(const s of [-1,1]) P(torso,'rbox2',acc,0.08,0.05,0.12,s*tw*0.95,th*1.88,0); break;
    case 'bones': { const dk=mat(shade(x.skinC,0.55),{s:20}); for(let i=0;i<4;i++) P(torso,'torThin',dk,tw*0.98,td*0.98,0.6,0,th*(0.8+i*0.25),0,PI/2); front(dk,0.03,0.4,0,th*1.05); break; }
    case 'tux': front(wh,0.11,0.28,0,th*1.25); for(const s of [-1,1]) P(torso,'cone4',bk,0.05,0.06,0.02,s*0.04,th*1.66,fz+0.02,0,0,s*PI/2); P(torso,'sphLo',bk,0.02,0.02,0.02,0,th*1.66,fz+0.025); for(const s of [-1,1]) P(torso,'rbox2',main,0.07,0.26,0.035,s*0.075,th*1.3,fz+0.004,0,0,s*0.32); break;
  }
}
const OUTFIT_FORE_SKIN=['england','kit','referee','boxer','sumo','swim','tutu','fur','bones','toga'];
const OUTFIT_NO_BELT=['england','kit','referee','boxer','sumo','swim','bones','toga','tutu','fur','superhero','ringmaster','tracksuit','pirate','cowboy','smock','stripes','tux','safari'];

// ---------------------------------------------------------------- hats & faces
function hatMore(hat,x){
  const {head,hs,c,hatC,tc}=x; const hm=(o)=>mat(colr(hatC,tc),o||{s:60});
  switch(hat){
    case 'flatcap': P(head,'hemi',hm({s:15}),hs*1.1,hs*0.55,hs*1.1,0,hs*0.5,-0.01); P(head,'rbox2',hm({s:15}),hs*1.0,0.045,hs*0.55,0,hs*0.55,hs*0.72,0.18); break;
    case 'tiara': { const gm=gold(); P(head,'torThin',gm,hs*0.75,hs*0.75,0.8,0,hs*0.86,0,PI/2); for(let i=0;i<5;i++){ const a=PI*0.25+i/4*PI*0.5; P(head,'cone',gm,0.025,0.08+(i===2?0.04:0),0.025,Math.cos(a)*hs*0.75,hs*0.93,Math.sin(a)*hs*0.75); } P(head,'sph',mat('#ff3dce',{s:150}),0.03,0.03,0.02,0,hs*0.96,hs*0.76); break; }
    case 'visor': P(head,'tor',hm(),hs*1.03,hs*1.03,0.4,0,hs*0.45,0,PI/2); P(head,'cyl',hm(),hs*0.62,0.022,hs*0.7,0,hs*0.44,hs*0.92); break;
    case 'helmetF': P(head,'hemi',hm({s:130}),hs*1.24,hs*1.12,hs*1.24,0,0.02,-0.03); P(head,'sph',hm({s:130}),hs*1.12,hs*0.85,hs*0.85,0,-hs*0.12,-hs*0.38); for(const s2 of [-1,1]) P(head,'sph',hm({s:130}),hs*0.35,hs*0.7,hs*0.6,s2*hs*0.98,-hs*0.2,0.0); P(head,'rbox2',mat('#ffffff',{s:60}),0.05,0.03,hs*2.3,0,hs*1.12,0,0.15); for(let i=0;i<3;i++) P(head,'torHalf',mat('#4a4f58',{s:90}),hs*0.8,hs*0.62,0.35,0,-hs*0.1-i*0.075,hs*0.62,0,0,PI); for(const s of [-1,1]) P(head,'sph',mat('#151515'),0.05,0.06,0.03,s*hs*1.15,-0.02,0); break;
    case 'helmetH': P(head,'hemi',hm({s:120}),hs*1.15,hs*0.95,hs*1.15,0,0.06,0); P(head,'rbox2',mat('#bfe8ff',{op:0.45,s:150}),hs*1.3,0.09,0.03,0,hs*0.33,hs*1.0,-0.2).userData.noOutline=true; break;
    case 'helmetM': P(head,'sph',hm({s:140}),hs*1.32,hs*1.3,hs*1.32,0,0.02,-0.02); P(head,'sph',mat('#1a1a2a',{s:160,m:0.3}),hs*1.0,hs*0.55,hs*0.6,0,0.02,hs*0.85); P(head,'rbox2',mat('#e5302a'),0.06,0.03,hs*2.5,0,hs*1.2,0,0.1); break;
    case 'swimcap': P(head,'hemi',hm({s:150}),hs*1.08,hs*0.92,hs*1.07,0,0.04,-0.01); break;
    case 'mascotHead': { const m=hm({s:12}); P(head,'puff',m,hs*1.85,hs*1.75,hs*1.8,0,0.08,0); faceEyes(head,0,0.12,hs*1.6,0.18,0.12); P(head,'cone',mat('#ff8a1f',{s:60}),0.13,0.32,0.1,0,-0.06,hs*1.95,PI/2); for(const s of [-1,1]) P(head,'cone',m,0.12,0.3,0.06,s*hs*1.2,hs*1.5,0,0,0,-s*0.5); break; }
    case 'cowboy': P(head,'cyl',hm({s:25}),hs*1.5,0.03,hs*1.6,0,hs*0.72,0); P(head,'cyl',hm({s:25}),hs*0.72,0.25,hs*0.8,0,hs*0.95,0); P(head,'rbox2',hm({s:25}),hs*0.4,0.06,hs*1.1,0,hs*1.08,0); P(head,'cyl',mat('#3a2414'),hs*0.74,0.05,hs*0.82,0,hs*0.85,0); for(const s of [-1,1]) P(head,'rbox2',hm({s:25}),hs*0.4,0.03,hs*1.4,s*hs*1.15,hs*0.82,0,0,0,s*0.5); break;
    case 'pirate': P(head,'cyl',hm({s:25}),hs*0.95,0.18,hs*0.95,0,hs*0.86,0); for(let i=0;i<3;i++){ const a=i/3*TAU+PI/2; P(head,'rbox2',hm({s:25}),hs*1.3,0.18,0.04,Math.cos(a)*hs*0.85,hs*1.0,Math.sin(a)*hs*0.85,0.3,-a+PI/2,0); } P(head,'sph',mat('#ffffff'),0.05,0.05,0.02,0,hs*1.02,hs*1.12); break;
    case 'sailor': P(head,'cyl',hm({s:30}),hs*0.8,0.12,hs*0.8,0,hs*0.85,0); P(head,'cyl',hm({s:30}),hs*1.05,0.04,hs*1.05,0,hs*0.95,0); P(head,'cyl',mat('#3a6fb0'),hs*0.82,0.04,hs*0.82,0,hs*0.82,0); break;
    case 'safari': P(head,'hemi',hm({s:30}),hs*1.12,hs*0.95,hs*1.12,0,0.06,0); P(head,'cyl',hm({s:30}),hs*1.4,0.025,hs*1.45,0,0.08,0); P(head,'tor',mat('#6b4423'),hs*1.1,hs*1.1,0.25,0,0.14,0,PI/2); break;
  }
}
function faceMore(f,x){
  const {head,hs,fz2}=x;
  switch(f){
    case 'flushed': P(head,'sph',mat('#e8505a',{s:60}),0.06,0.055,0.055,0,-0.04,fz2+0.01); for(const s of [-1,1]) P(head,'sph',mat('#f06070',{s:20,op:0.75}),0.075,0.05,0.02,s*0.15,-0.06,fz2-0.02).userData.noOutline=true; break;
    case 'stubble': P(head,'sph',mat('#7a6a5a',{s:10,op:0.55}),hs*0.74,hs*0.5,hs*0.6,0,-hs*0.44,hs*0.22).userData.noOutline=true; break;
    case 'mimeFace': for(const s of [-1,1]) P(head,'cone4',mat('#151515'),0.02,0.06,0.01,s*0.1,0.12,fz2+0.02); P(head,'sph',mat('#e5302a',{s:90}),0.05,0.025,0.02,0,-0.11,fz2+0.02); break;
    case 'alienEyes': for(const s2 of [-1,1]) P(head,'sph',mat('#151515',{s:160}),0.1,0.13,0.05,s2*0.12,0.05,fz2+0.02,0,0,s2*0.5); break;
    case 'dots': for(let i=0;i<5;i++) P(head,'sphLo',mat('#ffffff',{e:0.6}),0.015,0.015,0.015,Math.sin(i*2)*0.18,Math.cos(i*3)*0.15,fz2+0.03); break;
    case 'eyepatch': P(head,'cyl',mat('#151515'),0.055,0.02,0.055,0.1,0.03,fz2+0.05,PI/2); P(head,'tor',mat('#151515'),hs*1.0,hs*1.0,0.12,0,0.05,0,PI/2+0.25,0,0.2); break;
  }
}
function humanExtras(p,x){
  const {head,hs,torso,th,td,skin,R,c,hips}=x;
  if(p.belly){ const sh=c(p.outfit?p.outfit[1]:'#ffffff'); const tw0=0.27*(p.w||1);
    P(torso,'sph',sh,tw0*1.12,th*0.95,td*1.2,0,th*0.72,td*0.42);
    if(p.outfit&&p.outfit[0]==='england'){ const red=mat('#e5302a',{s:40}), nv=mat('#14264a',{s:40}); const bz=td*0.42+td*1.2;
      { const bx=tw0*0.3, by=th*1.12, bzz=td*1.52; P(torso,'rbox2',mat('#ffffff',{s:30}),0.1,0.12,0.03,bx,by,bzz,0,0.35,0); P(torso,'rbox2',nv,0.11,0.015,0.032,bx,by+0.06,bzz,0,0.35,0); P(torso,'cone4',nv,0.055,0.04,0.03,bx,by-0.065,bzz,PI,0.35,0); for(let i=0;i<3;i++) P(torso,'sphLo',mat('#2f5fd0'),0.018,0.012,0.012,bx+0.004,by+0.035-i*0.03,bzz+0.018); }
      P(torso,'torThin',red,tw0*1.0,td*1.15,0.5,0,th*0.12,td*0.25,PI/2);
      for(const A of [R.armL,R.armR]) if(A){ P(A,'tor',red,0.085*Math.max(1,(p.w||1)*0.8),0.085*Math.max(1,(p.w||1)*0.8),0.4,0,-0.2,0,PI/2); } }
    P(torso,'sph',skin,tw0*0.82,th*0.32,td*0.7,0,th*0.08,td*0.72); P(torso,'sphLo',mat(shade(x.skin.color.getStyle(),0.75)),0.025,0.02,0.01,0,th*0.12,td*1.38); }
  if(p.sash){ P(torso,'rbox2',mat(p.sash,{s:60}),0.07,th*2.3,0.02,0,th*1.0,td*0.98,0,0,0.75); P(torso,'rbox2',mat('#ffffff',{map:labelTex('HEN','#ff6bb5','#ffffff'),basic:1}),0.1,0.05,0.025,0.02,th*1.05,td*1.0,0,0,0.75); }
  if(p.ape){ const fc=mat(shade(p.skin,1.6),{s:20}); P(head,'sph',fc,hs*0.82,hs*0.6,hs*0.5,0,-hs*0.3,hs*0.62); P(head,'sph',fc,hs*0.7,hs*0.42,hs*0.3,0,hs*0.1,hs*0.8); P(head,'rbox2',mat(shade(p.skin,0.7)),hs*1.3,0.06,0.08,0,hs*0.42,hs*0.78);
    for(const s of [-1,1]) P(head,'sph',fc,0.09,0.11,0.04,s*hs*1.05,0.02,0); }
  if(p.lizard){ const tl=G0(); tl.position.set(0,0.2,-0.2); hips.add(tl); for(let i=0;i<4;i++) P(tl,'sph',skin,0.2-i*0.04,0.18-i*0.035,0.24,0,-0.1-i*0.05,-0.08-i*0.2);
    const sp=mat(p.outfit&&p.outfit[2]||'#9adf6a',{s:40}); for(let i=0;i<5;i++) P(torso,'cone',sp,0.06,0.16,0.03,0,th*(0.6+i*0.3),-td-0.02,-0.4); for(let i=0;i<3;i++) P(head,'cone',sp,0.05,0.13,0.03,0,hs*0.9-i*0.06,-hs*0.4-i*0.18,-0.6); }
  if(p.flames){ for(const s2 of [-1,1]) for(let i=0;i<3;i++) P(torso,'cone',mat(i?'#ffd34d':'#ff4a1a',{e:1}),0.07-i*0.015,0.25-i*0.05,0.07-i*0.015,s2*0.2,th*2+0.05,-0.02); }
  if(p.plinth){ P(R.root,'rboxS',mat('#d8d2c4',{s:20}),0.9,0.3,0.9,0,-0.15,0); }
  if(p.back&&p.back[0]==='wings'){ R.wingsH=[]; for(const s of [-1,1]){ const wg=G0(); wg.position.set(s*0.12,th*1.3,-td-0.02); torso.add(wg); for(let i=0;i<3;i++) P(wg,'sph',mat(colr(p.back[1],x.tc),{s:20}),0.15-i*0.025,0.06,0.09,s*(0.12+i*0.13),0.04-i*0.04,-0.02); R.wingsH.push(wg); } }
}

// ---------------------------------------------------------------- quadruped extras
function quadMore(p,R,x){
  const {body,head,front,back,coat,coat2,c,hr,sn,L,ch,tail}=x;
  const bk=mat('#151515',{s:14});
  if(p.pig){ P(head,'cyl',mat(p.nose||'#ff7aa0',{s:40}),0.07,0.05,0.07,0,-0.03,hr*0.82+sn,PI/2); for(const s of [-1,1]) P(head,'sphLo',mat('#a03a5a'),0.014,0.02,0.01,s*0.025,-0.03,hr*0.82+sn+0.03); P(body,'rbox2',bk,0.12,0.02,0.04,0,0.2*ch,0); }
  if(p.bubble){ P(head,'sph',mat('#cfeeff',{op:0.22,s:150}),hr*1.7,hr*1.7,hr*1.7,0,0.02,0.04).userData.noOutline=true; P(front,'tor',mat('#dadada',{s:80}),0.15,0.15,0.6,0,0.08,0.06,PI/2-0.5); }
  if(p.poodle){ P(head,'puff',coat,hr*0.85,hr*0.7,hr*0.8,0,hr*0.75,-0.02); for(const lg of R.legs) P(lg,'puff',coat,0.08,0.07,0.08,0,-(p.legLen??0.22)-0.05,0.02); P(body,'puff',coat,0.24,0.22,0.2,0,0.02,0.18*L); }
  if(p.bow){ for(const s of [-1,1]) P(head,'cone4',mat(p.bow,{s:60}),0.05,0.07,0.02,s*0.04,hr*1.0,0.02,0,0,s*PI/2); P(head,'sph',mat(p.bow,{s:60}),0.025,0.025,0.025,0,hr*1.0,0.02); }
  if(p.barrel){ P(front,'cyl',mat('#8a5a2b',{s:20}),0.07,0.12,0.07,0,-0.08,0.2,0,0,PI/2); P(front,'cyl',gold(),0.072,0.02,0.072,0.04,-0.08,0.2,0,0,PI/2); }
  if(p.puff){ for(let i=0;i<6;i++){ const a=i/6*TAU; P(body,'puff',coat2,0.14,0.13,0.14,Math.cos(a)*0.17,Math.sin(a)*0.13,0.02); } P(head,'puff',coat2,hr*1.25,hr*1.1,hr*0.9,0,-0.02,-0.04); }
  if(p.elephant){ const tr=G0(); tr.position.set(0,-0.02,hr*0.85); head.add(tr); R.trunk=tr; for(let i=0;i<8;i++){ const a=i/7; P(tr,'sph',coat,0.085-i*0.007,0.075,0.085-i*0.007,0,-Math.sin(a*1.3)*0.34,0.05+a*0.14-Math.max(0,a-0.7)*0.4); }
    for(const s of [-1,1]){ const ear=G0(); ear.position.set(s*hr*0.95,0.02,-0.04); ear.rotation.y=s*0.5; head.add(ear); P(ear,'sph',coat,0.035,0.24,0.22,s*0.06,-0.04,0); P(ear,'sph',mat('#e8b0b8',{s:20}),0.02,0.18,0.16,s*0.08,-0.04,0.01).userData.noOutline=true;
      P(head,'cone',mat('#fff6e0',{s:60}),0.03,0.2,0.03,s*0.08,-0.1,hr*0.75,PI/2+0.5); } }
  if(p.giraffe){ head.position.y+=0.42; head.position.z+=0.04; P(front,'caps',coat,0.12,0.26,0.12,0,0.36,0.11,0.25); const r=seeded(11); for(let i=0;i<18;i++){ const a=r()*TAU, zz=(r()-0.5)*0.5*L; const m=P(body,'sphLo',mat('#a0602a',{s:14}),0.05,0.05,0.016,Math.cos(a)*0.2,Math.sin(a)*0.18,zz); m.lookAt(Math.cos(a)*2,Math.sin(a)*2,zz); m.userData.noOutline=true; } for(const s of [-1,1]) P(head,'cyl',coat2,0.015,0.08,0.015,s*0.05,hr*1.0,-0.02); P(front,'rbox2',mat('#a0602a'),0.03,0.4,0.05,0,0.4,0.0,0.25); }
  if(p.croc){ head.scale.set(1,0.6,1.1); for(let i=0;i<7;i++) P(body,'cone4',mat(shade(p.coat,0.7),{s:30}),0.04,0.06,0.04,0,0.17,-0.3*L+i*0.1*L); for(const s of [-1,1]) for(let i=0;i<4;i++) P(head,'cone',mat('#ffffff'),0.012,0.04,0.012,s*0.06,-0.08,hr*0.6+i*0.08+sn*0.3,PI); }
  if(p.hippo){ head.scale.set(1.35,1.0,1.25); P(head,'rboxS',coat,0.36,0.24,0.3,0,-0.07,hr*0.72+sn*0.35); for(const s of [-1,1]) P(head,'sph',mat('#3a2a3a'),0.025,0.015,0.02,s*0.07,0.05,hr*0.72+sn*0.35+0.12).userData.noOutline=true; P(head,'sph',coat2,0.16,0.12,0.16,0,-0.05,hr*0.6+sn*0.4); for(const s of [-1,1]) P(head,'cone',mat('#ffffff'),0.02,0.06,0.02,s*0.07,-0.02,hr*0.85+sn*0.5,PI); }
  if(p.panda){ for(const s of [-1,1]) P(head,'sph',bk,0.06,0.05,0.03,s*0.07,0.05,hr*0.82,0,0,s*0.5).userData.noOutline=true; for(const lg of R.legs) P(lg,'caps',bk,0.125*ch,(p.legLen??0.22)*0.6,0.135*ch,0,-(p.legLen??0.22)*0.55,0); P(body,'tor',bk,0.2*ch,0.18*ch,0.4,0,0.02,0.12*L,0,0,0); }
  if(p.skunk){ const wh=mat('#ffffff',{s:14}); for(const s of [-1,1]) P(body,'sph',wh,0.06,0.04,0.26*L,s*0.07,0.16*ch,0); P(head,'rbox2',wh,0.04,0.02,0.22,0,hr*0.9,0.05); for(let i=0;i<4;i++) P(tail,'puff',wh,0.07,0.07,0.07,0,0.1+i*0.12,-0.04+Math.sin(i*0.9)*0.05); }
  if(p.mane){ const mm=mat(p.mane,{s:10}); for(let i=0;i<10;i++){ const a=i/10*TAU; P(head,'puff',mm,0.09,0.09,0.08,Math.cos(a)*hr*0.95,Math.sin(a)*hr*0.95,-0.06); } P(front,'puff',mm,0.16,0.18,0.12,0,0.1,0.06); }
  if(p.cheetah||p.tiger){ const r=seeded(p.tiger?5:9); for(let i=0;i<(p.tiger?12:30);i++){ const a=r()*TAU, zz=(r()-0.5)*0.6*L; const m=P(body,p.tiger?'rbox2':'sphLo',bk,p.tiger?0.05:0.05,p.tiger?0.24:0.05,0.015,Math.cos(a)*0.232*ch,Math.sin(a)*0.212*ch,zz); m.lookAt(Math.cos(a)*2,Math.sin(a)*2,zz); m.userData.noOutline=true; } if(p.cheetah) for(const s of [-1,1]) P(head,'rbox2',bk,0.012,0.08,0.01,s*0.05,0.0,hr*0.9,0,0,s*0.2).userData.noOutline=true; if(p.tiger) for(let i=0;i<3;i++) P(head,'rbox2',bk,0.025,0.012,0.1,0,hr*0.9,-0.04+i*0.05).userData.noOutline=true; }
  if(p.kangaroo){ body.rotation.x=-0.7; body.position.y+=0.18; for(let i=0;i<2;i++){ const lg=R.legs[i]; lg.scale.set(0.6,0.6,0.6); lg.rotation.x=-1.2; } for(let i=2;i<4;i++) R.legs[i].scale.set(1.5,1.25,1.6); for(const i of [0,1]) P(R.legs[i],'sph',mat(colr('T',x.tc),{s:90}),0.08,0.08,0.09,0,-0.25,0.03); head.rotation.x=0.6; }
  if(p.spider){ R.legs.forEach(l=>l.visible=false); const lm=mat(p.coat,{s:40}); for(const s2 of [-1,1]) for(let i=0;i<4;i++){ const lg=G0(); lg.position.set(s2*0.15,0,-0.15+i*0.1); body.add(lg); P(lg,'cyl',lm,0.02,0.3,0.02,s2*0.12,0.06,0,0,0,s2*1.0); P(lg,'cyl',lm,0.018,0.3,0.018,s2*0.25,-0.12,0,0,0,-s2*0.3); R.legs.push(lg); }
    P(body,'rbox2',mat('#7dff4a',{e:0.6}),0.08,0.03,0.12,0,0.18,-0.1); for(let i=0;i<4;i++) P(head,'sph',mat('#e5302a',{e:0.5}),0.02,0.02,0.02,-0.045+i*0.03,0.08,hr*0.8); }
  if(p.goat){ for(const s2 of [-1,1]) P(head,'torHalf',mat('#c8b48a',{s:40}),0.09,0.11,0.25,s2*0.07,hr*0.75,-0.04,0,PI/2,0); P(head,'cone',mat('#e8e0d0'),0.04,0.14,0.04,0,-0.17,hr*0.6+sn*0.6,PI); }
  if(p.cat){ for(const s2 of [-1,1]) for(let i=0;i<3;i++) P(head,'cyl',mat('#ffffff'),0.004,0.14,0.004,s2*0.1,-0.04+i*0.02,hr*0.8+sn,0,0,PI/2+s2*(i-1)*0.15).userData.noOutline=true; }
  if(p.rhino){ P(head,'cone',mat('#d8d0c0',{s:40}),0.06,0.22,0.06,0,0.02,hr*0.75+sn*0.9,0.5); P(head,'cone',mat('#d8d0c0',{s:40}),0.035,0.1,0.035,0,0.07,hr*0.55+sn*0.5,0.3); }
  if(p.balloon){ body.traverse(o=>{ if(o.isMesh) o.material=mat(p.coat,{s:160}); }); head.traverse(o=>{ if(o.isMesh&&o.material.color&&o.material.color.getHexString()!=='ffffff'&&o.material.color.getHexString()!=='0c0c10') o.material=mat(p.coat,{s:160}); }); }
  // tails not covered by the base builder
  switch(p.tail){
    case 'croc': for(let i=0;i<5;i++) P(tail,'sph',coat,0.13-i*0.022,0.08-i*0.01,0.14,0,-0.02-i*0.01,-0.08-i*0.18); break;
    case 'tuft': P(tail,'cyl',coat,0.018,0.4,0.018,0,0.0,-0.18,0.9); P(tail,'puff',mat(p.mane||'#8a4a1a'),0.05,0.06,0.05,0,-0.12,-0.36); break;
    case 'kanga': for(let i=0;i<4;i++) P(tail,'sph',coat,0.09-i*0.014,0.09-i*0.014,0.14,0,-0.1-i*0.09,-0.12-i*0.1); break;
  }
}

// ---------------------------------------------------------------- flyers
function flyerMore(p,R,root,T,wing,tc){
  switch(p.type){
    case 'housefly': { const dk=mat('#1c1f24',{s:110}), hair=mat('#3a3f48',{s:20});
      P(root,'sph',dk,0.17,0.15,0.2,0,0,0.02); P(root,'sph',mat('#2a3a2a',{s:160,m:0.4}),0.15,0.13,0.24,0,-0.02,-0.22); for(let i=0;i<3;i++) P(root,'torThin',hair,0.13-i*0.02,0.13-i*0.02,0.25,0,-0.02,-0.12-i*0.1);
      const hd=G0(); hd.position.set(0,0.03,0.2); root.add(hd); R.head=hd; P(hd,'sph',dk,0.11,0.1,0.1); for(const s of [-1,1]){ P(hd,'sph',mat('#b3201a',{s:170,e:0.15}),0.085,0.1,0.08,s*0.09,0.03,0.03); P(hd,'sph',mat('#ffffff',{e:0.6}),0.02,0.02,0.02,s*0.11,0.08,0.09); }
      P(hd,'cyl',dk,0.018,0.1,0.018,0,-0.1,0.07,0.4);
      for(const s of [-1,1]){ const wg=G0(); wg.position.set(s*0.1,0.12,-0.02); root.add(wg); R.wings.push(wg); P(wg,'sph',mat('#dfefff',{op:0.4,s:160}),0.24,0.01,0.11,s*0.22,0,-0.06,0,s*0.35).userData.noOutline=true; }
      for(const s of [-1,1]) for(let i=0;i<3;i++) P(root,'cyl',dk,0.012,0.22,0.012,s*0.12,-0.14,0.1-i*0.1,0,0,s*0.6);
      { const pt=G0(); pt.position.set(0,-0.2,0.2); root.add(pt); P(pt,'cyl',mat('#e8a21c',{e:0.12}),0.06,0.15,0.06); P(pt,'cyl',mat('#fff8e6'),0.065,0.03,0.065,0,0.085,0); }
      R.fast=true; R.height=0.55; break; }
    case 'ghost': { const sh=mat('#eef4ff',{op:0.82,s:40,e:0.18});
      P(root,'sph',sh,0.32,0.36,0.3,0,0.25,0); P(root,'bell',sh,0.38,0.55,0.34,0,-0.18,0);
      for(let i=0;i<6;i++){ const a=i/6*TAU; P(root,'sph',sh,0.1,0.13,0.1,Math.cos(a)*0.3,-0.48,Math.sin(a)*0.28); }
      const hd=G0(); hd.position.set(0,0.3,0.2); root.add(hd); R.head=hd;
      for(const s of [-1,1]) P(hd,'sph',mat('#151520'),0.06,0.085,0.03,s*0.1,0.06,0.08); P(hd,'sph',mat('#151520'),0.05,0.07,0.03,0,-0.1,0.09);
      P(root,'tor',mat('#ffffff',{s:20}),0.24,0.24,0.6,0,0.02,0,PI/2); for(let i=0;i<10;i++){ const a=i/10*TAU; P(root,'sph',mat('#f6f2ea',{s:20}),0.07,0.05,0.05,Math.cos(a)*0.26,0.02,Math.sin(a)*0.24); }
      { const mg=G0(); mg.position.set(0.32,0.0,0.18); root.add(mg); P(mg,'cyl',mat('#8a939c',{s:150,m:0.6}),0.08,0.16,0.08); P(mg,'cyl',mat('#fff8e6'),0.075,0.03,0.075,0,0.085,0); P(mg,'tor',mat('#8a939c',{s:150,m:0.6}),0.05,0.05,0.4,0.09,0,0,0,PI/2); }
      R.height=0.9; break; }
    case 'shark': { const gr=mat('#7d8ea0',{s:60}), wh=mat('#eef2f6',{s:40});
      P(root,'sph',gr,0.26,0.24,0.6); P(root,'sph',wh,0.2,0.16,0.5,0,-0.08,0.04);
      P(root,'cone4',gr,0.14,0.3,0.05,0,0.3,-0.05,-0.3); for(const s of [-1,1]) P(root,'cone4',gr,0.06,0.28,0.14,s*0.3,-0.06,0.05,0,0,s*1.9);
      const tl=G0(); tl.position.set(0,0,-0.55); root.add(tl); R.wings.push(tl); P(tl,'cone4',gr,0.05,0.35,0.16,0,0.1,-0.1,-0.5); P(tl,'cone4',gr,0.05,0.22,0.12,0,-0.08,-0.08,0.6+PI);
      const hd=G0(); hd.position.set(0,0.02,0.45); root.add(hd); R.head=hd; faceEyes(hd,0,0.07,0.06,0.17,0.045,{iris:'#151515'});
      for(let i=0;i<7;i++) P(hd,'cone',mat('#ffffff'),0.018,0.05,0.018,-0.12+i*0.04,-0.08,0.1,PI);
      P(root,'cone4',mat(colr('T',tc),{s:60}),0.06,0.22,0.02,0,0.0,0.32,0.15); P(root,'rbox2',mat('#ffffff'),0.12,0.08,0.02,0,0.05,0.32);
      R.height=0.6; break; }
    case 'whale': { const bl=mat('#3a6fb0',{s:40}), wh=mat('#e8eef2',{s:30});
      P(root,'sph',bl,0.55,0.48,0.95); P(root,'sph',wh,0.42,0.3,0.8,0,-0.22,0.1); for(let i=0;i<5;i++) P(root,'rbox2',mat('#c8d4dc'),0.04,0.02,0.6,-0.16+i*0.08,-0.4,0.2);
      for(const s of [-1,1]){ const f=G0(); f.position.set(s*0.5,-0.15,0.2); root.add(f); P(f,'sph',bl,0.3,0.05,0.14,s*0.2,0,0,0,0,s*-0.4); R.wings.push(f); }
      const tl=G0(); tl.position.set(0,0.1,-0.9); root.add(tl); P(tl,'sph',bl,0.5,0.06,0.2,0,0,-0.15); R.tailW=tl;
      faceEyes(root,0,0.0,0.82,0.42,0.06,{iris:'#151515'}); P(root,'cyl',mat('#151515'),0.04,0.02,0.04,0,0.47,0.3);
      P(root,'cyl',gold(),0.28,0.36,0.28,0,0.62,0.15); P(root,'cyl',gold(),0.42,0.03,0.42,0,0.45,0.15); P(root,'cyl',mat(colr('T',tc)),0.285,0.08,0.285,0,0.52,0.15);
      R.height=1.1; break; }
    case 'satellite': { const bd=mat('#d8d8d8',{s:120,m:0.5}), pnl=mat('#1f3a7a',{s:150,m:0.3});
      P(root,'rboxS',bd,0.4,0.4,0.5); P(root,'rbox2',mat('#ffcf3a',{s:150,m:0.8}),0.42,0.3,0.4); for(const s of [-1,1]){ P(root,'cyl',bd,0.02,0.3,0.02,s*0.35,0,0,0,0,PI/2); P(root,'rbox2',pnl,0.7,0.02,0.36,s*0.85,0,0); for(let i=0;i<3;i++) P(root,'box',mat('#8fa3c8'),0.005,0.025,0.36,s*(0.6+i*0.24),0,0); }
      const hd=G0(); hd.position.set(0,-0.25,0.15); root.add(hd); R.head=hd; P(hd,'dish',mat('#f2f2f2',{s:80}),0.22,0.22,0.22,0,0,0,PI); P(hd,'sph',mat('#7df9ff',{e:1}),0.04,0.04,0.04,0,-0.1,0);
      P(root,'rbox2',mat(colr('T',tc)),0.43,0.06,0.52,0,0.18,0); R.height=0.6; break; }
    case 'origami': { const pm=mat('#ffffff',{s:20,flat:true}), tm=mat(colr('T',tc),{s:20,flat:true});
      P(root,'cone4',pm,0.1,0.42,0.12,0,0,0,PI/2); P(root,'cone4',tm,0.04,0.25,0.06,0,0.12,0.25,PI/2-0.9);
      for(const s of [-1,1]){ const wg=G0(); wg.position.set(s*0.04,0.03,0); root.add(wg); P(wg,'cone4',pm,0.26,0.03,0.18,s*0.2,0,-0.02,0,PI/4,0); R.wings.push(wg); }
      P(root,'cone4',pm,0.04,0.22,0.05,0,0.08,-0.24,-PI/2+0.7); R.height=0.35; break; }
    case 'gargoyle': { const st=mat('#8a8f99',{s:10,map:stoneTex('#8a8f99')}), dk=mat('#6a6f78',{s:10});
      P(root,'sph',st,0.3,0.32,0.3); const hd=G0(); hd.position.set(0,0.32,0.15); root.add(hd); R.head=hd;
      P(hd,'head',st,0.2,0.18,0.2); P(hd,'sph',st,0.12,0.08,0.12,0,-0.08,0.14); for(const s of [-1,1]) P(hd,'cone',dk,0.04,0.18,0.04,s*0.11,0.16,-0.02,-0.4,0,-s*0.4); for(const s of [-1,1]) P(hd,'sph',mat('#ff4a1a',{e:1}),0.035,0.03,0.02,s*0.07,0.03,0.17);
      for(let i=0;i<4;i++) P(hd,'cone',mat('#e8e8e8'),0.012,0.04,0.012,-0.045+i*0.03,-0.12,0.22,PI);
      wing(-1,dk,0.2,dk); wing(1,dk,0.2,dk); for(const s of [-1,1]) P(root,'caps',st,0.12,0.14,0.12,s*0.17,-0.28,0.08);
      P(root,'tor',mat(colr('T',tc)),0.18,0.18,0.3,0,0.18,0.08,PI/2-0.5); R.height=0.8; break; }
    case 'parrot': { const rd=mat('#e5302a',{s:50}), yl=mat('#ffd34d',{s:50}), bl=mat('#2f6fd8',{s:50});
      P(root,'sph',rd,0.17,0.2,0.26); const hd=G0(); hd.position.set(0,0.2,0.18); root.add(hd); R.head=hd; P(hd,'head',rd,0.13,0.13,0.13); P(hd,'sph',mat('#ffffff'),0.08,0.06,0.04,0,0.0,0.1);
      P(hd,'cone',mat('#2a2a2a',{s:80}),0.05,0.1,0.06,0,-0.04,0.15,PI/2+0.8); faceEyes(hd,0,0.03,0.1,0.06,0.03);
      for(const s of [-1,1]){ const wg=G0(); wg.position.set(s*0.15,0.06,0); root.add(wg); P(wg,'sph',yl,0.12,0.035,0.12,s*0.1,0,0); P(wg,'sph',bl,0.12,0.03,0.1,s*0.24,0,-0.04); R.wings.push(wg); }
      for(let i=-1;i<=1;i++) P(root,'sph',bl,0.04,0.02,0.22,i*0.04,-0.05,-0.38,0.3); P(root,'tor',T,0.1,0.1,0.35,0,0.12,0.15,PI/2-0.6); R.height=0.5; break; }
    case 'flamingo': { const pk=mat('#ff8fb8',{s:40}), bk=mat('#2a2a2a');
      P(root,'sph',pk,0.18,0.15,0.26); const nk=G0(); nk.position.set(0,0.12,0.2); root.add(nk); P(nk,'caps',pk,0.06,0.14,0.06,0,0.12,0.04,0.4);
      const hd=G0(); hd.position.set(0,0.28,0.1); nk.add(hd); R.head=hd; P(hd,'head',pk,0.08,0.08,0.09); P(hd,'cone',mat('#fff6dc'),0.035,0.12,0.035,0,-0.03,0.1,PI/2+0.6); P(hd,'cone',bk,0.03,0.05,0.03,0,-0.08,0.15,PI/2+0.6); faceEyes(hd,0,0.02,0.06,0.04,0.022);
      wing(-1,pk,0.14,bk); wing(1,pk,0.14,bk); for(const s of [-1,1]) P(root,'cyl',pk,0.012,0.4,0.012,s*0.05,-0.3,-0.1,0.5); P(root,'tor',T,0.07,0.07,0.3,0,0.18,0.24,PI/2-0.4); R.height=0.5; break; }
    case 'bat': { const br=mat('#3a2a2a',{s:20}), mb=mat('#6a4a5a',{s:20});
      P(root,'sph',br,0.1,0.11,0.12); const hd=G0(); hd.position.set(0,0.08,0.08); root.add(hd); R.head=hd; P(hd,'head',br,0.08,0.075,0.08); for(const s of [-1,1]) P(hd,'cone',br,0.03,0.08,0.02,s*0.05,0.09,0,0,0,-s*0.3); faceEyes(hd,0,0.01,0.06,0.035,0.022,{iris:'#e5302a'});
      for(const s of [-1,1]){ const wg=G0(); wg.position.set(s*0.08,0.03,0); root.add(wg); P(wg,'cone4',mb,0.22,0.02,0.14,s*0.18,0,-0.02,0,PI/4,0); R.wings.push(wg); }
      P(root,'tor',T,0.06,0.06,0.3,0,0.06,0.06,PI/2-0.5); R.height=0.3; R.fast=true; break; }
    case 'ballblimp': { const gm=mat('#f6f6f6',{s:80}); P(root,'sph',gm,0.55,0.5,1.25); for(const s of [-1,1]) P(root,'torThin',mat('#e5302a',{s:30}),0.5,0.5,0.9,s*0.12,0.04,0.2,0,PI/2,0.0); for(const a of [0,PI/2,PI,PI*1.5]) P(root,'rbox2',mat(colr('T',tc)),0.04,0.35,0.4,Math.sin(a)*0.4,Math.cos(a)*0.4,-1.1,0,0,a);
      P(root,'rbox2',mat('#3a2414',{s:40}),0.35,0.22,0.6,0,-0.6,0.1); for(let i=0;i<3;i++) P(root,'rbox2',mat('#2a3a55',{s:150}),0.36,0.08,0.1,0,-0.58,-0.1+i*0.2); P(root,'plane',mat('#ffffff',{map:labelTex('PLAY BALL','#ffffff','#14264a'),basic:1}),0.9,0.35,1,0.56,0.1,0,0,PI/2,0);
      const pr=G0(); pr.position.set(0,-0.6,-0.32); root.add(pr); P(pr,'rbox2',mat('#333'),0.5,0.03,0.04); pr.userData.axis='z'; R.rotors.push(pr); R.height=1.1; break; }
    case 'blimp': { const gm=mat('#ffcf3a',{s:130,m:0.6}); P(root,'sph',gm,0.55,0.5,1.25); for(const a of [0,PI/2,PI,PI*1.5]) P(root,'rbox2',mat(colr('T',tc)),0.04,0.35,0.4,Math.sin(a)*0.4,Math.cos(a)*0.4,-1.1,0,0,a);
      P(root,'rbox2',mat('#3a2414',{s:40}),0.35,0.22,0.6,0,-0.6,0.1); for(let i=0;i<3;i++) P(root,'rbox2',mat('#2a3a55',{s:150}),0.36,0.08,0.1,0,-0.58,-0.1+i*0.2); P(root,'plane',mat('#ffffff',{map:labelTex('$$$','#ffcf3a','#151515'),basic:1}),0.9,0.35,1,0.56,0.1,0,0,PI/2,0);
      const pr=G0(); pr.position.set(0,-0.6,-0.32); root.add(pr); P(pr,'rbox2',mat('#333'),0.5,0.03,0.04); pr.userData.axis='z'; R.rotors.push(pr); R.height=1.1; break; }
    case 'ufo': { P(root,'sph',mat('#c0c6cc',{s:140,m:0.7}),0.6,0.14,0.6); P(root,'sph',mat('#7dff4a',{op:0.55,e:0.4,s:150}),0.28,0.22,0.28,0,0.1,0).userData.noOutline=true; P(root,'torThin',mat(colr('T',tc),{e:0.6}),0.6,0.6,0.6,0,0,0,PI/2);
      const ring=G0(); root.add(ring); R.rotors.push(ring); for(let i=0;i<8;i++){ const a=i/8*TAU; P(ring,'sph',mat(i%2?'#ffd34d':'#ff3dce',{e:1}),0.05,0.05,0.05,Math.cos(a)*0.5,-0.04,Math.sin(a)*0.5); }
      const al=G0(); al.position.y=0.14; root.add(al); R.head=al; P(al,'sph',mat('#7ad35a',{s:40}),0.1,0.12,0.1); for(const s2 of [-1,1]) P(al,'sph',mat('#151515',{s:160}),0.035,0.05,0.02,s2*0.04,0.02,0.08); R.height=0.5; break; }
    case 'eye': { P(root,'sph',mat('#ffffff',{s:120}),0.45,0.45,0.45); P(root,'sph',mat('#ff3dce',{s:120,e:0.3}),0.24,0.24,0.1,0,0,0.38); P(root,'sph',mat('#151515',{s:160}),0.12,0.12,0.06,0,0,0.45); P(root,'sph',mat('#ffffff',{e:1}),0.04,0.04,0.02,0.06,0.06,0.48);
      const ring=G0(); root.add(ring); R.rotors.push(ring); P(ring,'tor',mat(colr('T',tc),{e:0.5}),0.62,0.62,0.4,0,0,0,PI/2); for(let i=0;i<6;i++){ const a=i/6*TAU; P(ring,'oct',mat('#ffd34d',{e:0.6}),0.06,0.06,0.06,Math.cos(a)*0.62,0,Math.sin(a)*0.62); } R.height=0.9; break; }
    case 'ornithopter': { const wd=mat('#a0703a',{s:30}), cl=mat('#f2e6c8',{s:20}); P(root,'rbox2',wd,0.2,0.18,0.9); P(root,'cone',wd,0.1,0.25,0.1,0,0,0.55,PI/2);
      for(const s2 of [-1,1]){ const wg=G0(); wg.position.set(s2*0.1,0.12,0); root.add(wg); P(wg,'rbox2',wd,0.7,0.03,0.04,s2*0.35,0,0); P(wg,'cone4',cl,0.5,0.02,0.3,s2*0.4,0,-0.15,0,PI/4,0); R.wings.push(wg); }
      const pl=buildHuman({skin:'#f7c9a0',hair:['long','#888'],outfit:['robe','#7a1f1f','#ffd34d'],face:['beard']},tc); pl.scale.setScalar(0.6); pl.position.set(0,-0.15,0.05); root.add(pl); R.height=0.7; break; }
    default: P(root,'sph',mat('#999'),0.3,0.3,0.3); R.height=0.5;
  }
  if(p.size){ root.scale.setScalar(p.size); R.height*=p.size; }
}

// ---------------------------------------------------------------- blobs (slime, meatball, mystery box, clay golem)
function buildBlob(p,tc){
  const g=G0(), R={type:'B'}; g.userData.rig=R; const root=G0(); g.add(root); R.root=root; const s=p.size||1;
  const body=G0(); root.add(body); R.body=body; const T=mat(tc.main,{s:60});
  switch(p.type){
    case 'burger': { const bun=mat('#e0a040',{s:40}); P(body,'sph',bun,0.46,0.22,0.46,0,0.95,0); P(body,'cyl',mat('#5a2a12',{s:20}),0.46,0.14,0.46,0,0.68,0); P(body,'cyl',mat('#4caf3a',{s:20}),0.5,0.04,0.5,0,0.6,0); P(body,'cyl',mat('#ffcf3d'),0.48,0.04,0.48,0,0.78,0); P(body,'cyl',mat('#5a2a12',{s:20}),0.46,0.14,0.46,0,0.45,0); P(body,'cyl',mat('#e5302a'),0.47,0.05,0.47,0,0.55,0); P(body,'cyl',bun,0.44,0.22,0.44,0,0.22,0);
      for(let i=0;i<7;i++){ const a=i/7*TAU; P(body,'sphLo',mat('#fff6dc'),0.03,0.015,0.05,Math.cos(a)*0.3,1.12,Math.sin(a)*0.3); } faceEyes(body,0,0.95,0.4,0.14,0.08); P(body,'tor',T,0.45,0.45,0.15,0,0.3,0,PI/2); break; }
    case 'octopus': { const om=mat('#d8504a',{s:60}); P(body,'sph',om,0.4,0.5,0.4,0,0.75,-0.05); faceEyes(body,0,0.7,0.34,0.14,0.09); R.arms=[]; for(let i=0;i<8;i++){ const a=i/8*TAU; const arm=G0(); arm.position.set(Math.cos(a)*0.25,0.35,Math.sin(a)*0.25); arm.rotation.y=-a; body.add(arm); for(let k=0;k<3;k++) P(arm,'sph',om,0.09-k*0.02,0.08-k*0.015,0.12,0.12+k*0.16,-0.15-k*0.05,0); R.arms.push(arm); } P(body,'tor',T,0.33,0.33,0.15,0,0.45,0,PI/2); break; }
    case 'slime': P(body,'sph',mat(p.tint||'#7dff4a',{op:0.82,s:150,e:0.15}),0.42,0.36,0.42,0,0.34,0); P(body,'sph',mat('#3a8a1a',{s:60}),0.12,0.1,0.1,0.06,0.3,0); faceEyes(body,0,0.45,0.32,0.13,0.08); P(body,'cyl',T,0.3,0.02,0.3,0,0.71,0); P(body,'sph',mat('#ffffff',{op:0.5}),0.1,0.06,0.06,-0.18,0.58,0.18).userData.noOutline=true; break;
    case 'meatball': { const m=mat('#7a3a1e',{s:20}); P(body,'puff',m,0.45,0.42,0.45,0,0.42,0); for(let i=0;i<8;i++){ const a=i/8*TAU; P(body,'sphLo',mat('#5a2a12'),0.08,0.06,0.08,Math.cos(a)*0.35,0.5+Math.sin(i)*0.15,Math.sin(a)*0.35); } P(body,'sph',mat('#d8321a',{s:80}),0.36,0.12,0.36,0,0.78,0); P(body,'puff',mat('#2e8b2e',{s:20}),0.07,0.05,0.07,0.05,0.9,0.05); faceEyes(body,0,0.5,0.38,0.14,0.08); for(const s2 of [-1,1]) P(body,'rbox2',mat('#151515'),0.12,0.03,0.03,s2*0.14,0.64,0.4,0,0,s2*0.4); P(body,'tor',T,0.44,0.44,0.15,0,0.2,0,PI/2); break; }
    case 'box': { const cb=mat('#c89a5a',{s:15}); P(body,'rbox2',cb,0.86,0.76,0.86,0,0.42,0); P(body,'box',mat(tc.main,{s:50}),0.88,0.78,0.14,0,0.42,0); P(body,'box',mat(tc.main,{s:50}),0.14,0.78,0.88,0,0.42,0);
      const lid=G0(); lid.position.y=0.8; body.add(lid); R.lid=lid; P(lid,'rbox2',cb,0.92,0.1,0.92); for(const s2 of [-1,1]) P(lid,'sph',mat(tc.main,{s:50}),0.16,0.1,0.07,s2*0.1,0.1,0,0,0,s2*0.6);
      P(body,'plane',mat('#ffffff',{map:labelTex('?','#ffd34d','#151515'),basic:1}),0.34,0.34,1,0.2,0.5,0.44); break; }
    case 'clay': { const cm=mat('#c8743a',{s:20}); P(body,'sph',cm,0.36,0.42,0.34,0,0.42,0); P(body,'sph',cm,0.26,0.24,0.24,0,0.88,0.02); for(const s2 of [-1,1]){ P(body,'caps',cm,0.16,0.2,0.16,s2*0.38,0.48,0.05,0.3,0,s2*0.3); P(body,'caps',cm,0.17,0.12,0.17,s2*0.15,0.1,0); } faceEyes(body,0,0.9,0.22,0.08,0.05); for(let i=0;i<4;i++) P(body,'sph',mat('#a85a2a'),0.05,0.03,0.02,Math.sin(i*2)*0.18,0.3+i*0.12,0.33).userData.noOutline=true; P(body,'tor',T,0.3,0.3,0.2,0,0.72,0,PI/2); break; }
  }
  R.height=0.95; g.scale.setScalar(s); R.height*=s; return g;
}
function buildPenguin(p,tc){
  const g=G0(), R={type:'P'}; g.userData.rig=R; const root=G0(); g.add(root); R.root=root;
  const bk=mat('#1c1c24',{s:60}), wh=mat('#f6f6f6',{s:30}), or=mat('#ff9a1f',{s:60});
  const body=G0(); root.add(body); R.body=body;
  P(body,'sph',bk,0.26,0.36,0.24,0,0.4,0); P(body,'sph',wh,0.2,0.3,0.12,0,0.36,0.14);
  const hd=G0(); hd.position.set(0,0.78,0.02); body.add(hd); R.head=hd; P(hd,'head',bk,0.19,0.18,0.18); for(const s of [-1,1]) P(hd,'sph',wh,0.07,0.08,0.05,s*0.07,0.0,0.13);
  faceEyes(hd,0,0.02,0.16,0.07,0.04); P(hd,'cone',or,0.04,0.12,0.03,0,-0.05,0.2,PI/2);
  R.flips=[]; for(const s of [-1,1]){ const f=G0(); f.position.set(s*0.25,0.55,0); body.add(f); P(f,'sph',bk,0.05,0.2,0.1,s*0.02,-0.15,0,0,0,s*0.2); R.flips.push(f); }
  R.feet=[]; for(const s of [-1,1]){ const ft=P(root,'sph',or,0.08,0.03,0.12,s*0.1,0.03,0.08); R.feet.push(ft); }
  P(body,'tor',mat(tc.main,{s:60}),0.12,0.12,0.4,0,0.68,0.03,PI/2);
  R.height=1.0; return g;
}

// ---------------------------------------------------------------- vehicles
function vehicleMore(p,R,root,x){
  const {body,glass,tire,stripe,chrome,light,wheel,lights}=x;
  switch(p.type){
    case 'kebabvan': P(root,'rboxS',body,1.2,1.15,2.2,0,0.95,-0.1); P(root,'rboxS',body,1.16,0.75,0.55,0,0.72,1.18); P(root,'rbox2',glass,1.02,0.36,0.05,0,0.92,1.46);
      for(const s of [-1,1]) P(root,'rbox2',mat('#ffffff',{map:labelTex('KEBABS','#e5302a','#ffd21f'),basic:1}),0.01,0.3,1.5,s*0.61,1.3,-0.15);
      P(root,'rbox2',mat('#3a2414'),0.02,0.4,1.0,0.6,0.88,-0.2); P(root,'rbox2',mat('#fff2c8',{e:0.35}),0.03,0.32,0.9,0.605,0.88,-0.2);
      for(let i=0;i<6;i++) P(root,'rbox2',mat(i%2?'#ffffff':'#2e9a3a',{s:40}),0.3,0.03,0.18,0.76,1.12,-0.66+i*0.18,0,0,-0.4);
      { const dn=G0(); dn.position.set(0,1.75,-0.4); root.add(dn); P(dn,'cyl',chrome,0.03,0.5,0.03,0,0.1,0); P(dn,'cone',mat('#a0602a',{s:30}),0.22,0.45,0.22,0,0.25,0,PI); for(let i=0;i<4;i++) P(dn,'torThin',mat('#7a3a14'),0.2-i*0.03,0.2-i*0.03,0.4,0,0.1+i*0.08,0,PI/2); R.prop=dn; }
      P(root,'rbox2',stripe,1.22,0.1,2.22,0,0.5,-0.1); lights(1.46,-1.21,0.62,0.4); for(const z of [0.85,-0.8]){ wheel(-0.6,z,0.26); wheel(0.6,z,0.26); } R.height=1.9; break;
    case 'dray': P(root,'rboxS',body,1.15,0.9,0.85,0,0.85,0.95); P(root,'rbox2',glass,1.0,0.36,0.05,0,1.0,1.38); P(root,'rbox2',mat('#3a2414',{s:20}),1.2,0.12,2.0,0,0.5,-0.45);
      for(const s of [-1,1]) P(root,'rbox2',mat('#ffffff',{map:labelTex('ALE','#3a2414','#ffd34d'),basic:1}),0.01,0.28,0.6,s*0.58,1.0,0.95);
      { const kw=mat('#9a6a3a',{s:40}), hoop=mat('#55585e',{s:120,m:0.5}); for(let i=0;i<5;i++){ const kx=(i%3-1)*0.36+(i>2?0.18:0), ky=0.78+(i>2?0.44:0), kz=-0.45+((i*7)%3-1)*0.5; P(root,'cyl',kw,0.2,0.42,0.2,kx,ky,kz,PI/2); for(const d of [-0.14,0.14]) P(root,'torThin',hoop,0.205,0.205,0.3,kx,ky,kz+d); } }
      P(root,'rbox2',stripe,1.17,0.1,0.87,0,0.5,0.95); lights(1.38,-1.45,0.6,0.42); for(const z of [0.9,-0.95]){ wheel(-0.6,z,0.28); wheel(0.6,z,0.28); } R.height=1.6; break;
    case 'mower': P(root,'rboxS',body,0.9,0.4,1.3,0,0.5,0.1); P(root,'rbox2',mat('#151515'),0.5,0.08,0.4,0,0.9,-0.35); P(root,'rbox2',chrome,0.95,0.08,0.4,0,0.35,0.85); for(let i=0;i<4;i++) P(root,'rbox2',mat('#e8e8e8'),0.2,0.03,0.06,-0.35+i*0.23,0.3,1.08);
      P(root,'cyl',chrome,0.03,0.4,0.03,0,1.0,0.1,-0.3); P(root,'tor',mat('#151515'),0.14,0.14,0.14,0,1.22,0.05,PI/2.4); wheel(-0.5,-0.5,0.3); wheel(0.5,-0.5,0.3); wheel(-0.5,0.7,0.2); wheel(0.5,0.7,0.2);
      { const rd=buildHuman({skin:'#c68b5e',hair:['short','#111'],hat:['cap','#2e9a3a'],outfit:['tshirt','#2e9a3a','#ffffff']},x.tc); rd.scale.setScalar(0.8); rd.position.set(0,0.62,-0.35); root.add(rd); } R.height=1.4; break;
    case 'stuntcar': P(root,'rboxS',body,1.1,0.42,2.1,0,0.48,0); P(root,'rboxS',body,0.86,0.36,0.95,0,0.82,-0.15); P(root,'rbox2',glass,0.8,0.3,0.9,0,0.84,-0.15);
      for(let i=0;i<3;i++) for(const s of [-1,1]) P(root,'cone4',mat(['#ffd34d','#ff8a1f','#e5302a'][i],{e:0.3}),0.1,0.5-i*0.1,0.02,s*0.56,0.48,0.5-i*0.12,0,0,-PI/2);
      P(root,'rbox2',mat('#151515'),1.1,0.06,0.3,0,1.05,-0.95); for(const s of [-1,1]) P(root,'rbox2',mat('#151515'),0.06,0.25,0.06,s*0.45,0.9,-0.95);
      P(root,'rbox2',stripe,0.3,0.44,2.12,0,0.49,0); P(root,'plane',mat('#ffffff',{map:labelTex('77','#ffffff','#151515'),basic:1}),0.4,0.3,1,0,0.7,1.06);
      lights(1.06,-1.06,0.5,0.4); wheel(-0.56,0.68,0.25); wheel(0.56,0.68,0.25); wheel(-0.56,-0.68,0.27); wheel(0.56,-0.68,0.27); R.height=1.2; break;
    case 'mixer': P(root,'rboxS',body,1.1,0.3,2.4,0,0.5,0); P(root,'rboxS',mat('#3a6fb0',{s:70}),1.1,0.8,0.7,0,0.95,0.8); P(root,'rbox2',glass,1.0,0.3,0.05,0,1.1,1.16);
      { const d=G0(); d.position.set(0,1.15,-0.35); d.rotation.x=0.25; root.add(d); R.drum=d; P(d,'caps',mat('#f2f2f2',{s:60}),0.95,0.7,0.95,0,0,0,PI/2); for(let i=0;i<4;i++){ const a=i/4*TAU; P(d,'rbox2',mat('#ff8a1f',{s:60}),0.06,0.07,1.1,Math.cos(a)*0.46,Math.sin(a)*0.46,0,0,0,a); } P(d,'tor',stripe,0.42,0.42,0.3,0,0,-0.1); }
      P(root,'rbox2',stripe,1.12,0.1,2.42,0,0.4,0); lights(1.16,-1.2,0.55,0.42); wheel(-0.56,0.8); wheel(0.56,0.8); wheel(-0.56,-0.5); wheel(0.56,-0.5); wheel(-0.56,-0.95); wheel(0.56,-0.95); R.height=1.8; break;
    case 'gurney': { const fr=mat('#c0c6cc',{s:110,m:0.6}); P(root,'rbox2',fr,0.8,0.06,1.8,0,0.5,0); P(root,'rbox2',mat('#ffffff',{s:20}),0.76,0.1,1.7,0,0.58,0); P(root,'rbox2',mat('#7ab8e6',{s:20}),0.78,0.12,1.0,0,0.62,0.3);
      for(const sx of [-1,1]) for(const sz of [-1,1]) P(root,'cyl',fr,0.025,0.4,0.025,sx*0.35,0.3,sz*0.8); P(root,'rbox2',mat('#ffffff'),0.4,0.12,0.3,0,0.7,-0.6);
      const pt=buildHuman({k:'h',skin:'#ffd9b8',hair:['messy','#a0522d'],outfit:['gown','#a8d4ee','T'],face:['angry']},x.tc); pt.rotation.x=-1.2; pt.position.set(0,0.62,0.55); pt.scale.setScalar(0.8); root.add(pt);
      for(const sx of [-1,1]) for(const sz of [-1,1]){ const w=P(root,'sph',tire,0.1,0.1,0.1,sx*0.35,0.1,sz*0.8); R.wheels.push(w); } P(root,'tor',stripe,0.35,0.35,0.3,0,0.58,-0.85,PI/2); R.height=1.2; break; }
    case 'roller': P(root,'rboxS',body,1.0,0.6,1.2,0,0.75,-0.3); P(root,'rboxS',body,0.8,0.55,0.6,0,1.32,-0.45); P(root,'rbox2',glass,0.75,0.35,0.62,0,1.35,-0.45); P(root,'rbox2',mat('#151515'),0.9,0.06,0.75,0,1.64,-0.45);
      { const rl=P(root,'cyl',mat('#5a5f66',{s:110,m:0.6}),0.5,1.3,0.5,0,0.5,0.75,0,0,PI/2); R.wheels.push(rl); P(root,'rbox2',body,1.4,0.12,0.25,0,1.02,0.75); for(const s of [-1,1]) P(root,'rbox2',body,0.08,0.55,0.25,s*0.68,0.75,0.75); }
      P(root,'rbox2',stripe,1.02,0.1,1.22,0,0.6,-0.3); wheel(-0.52,-0.6,0.34); wheel(0.52,-0.6,0.34); R.height=1.7; break;
    case 'lasertank': for(const s2 of [-1,1]){ P(root,'rboxS',tire,0.3,0.36,1.6,s2*0.6,0.2,0); for(let i=0;i<4;i++) R.wheels.push(P(root,'cyl',mat('#555',{s:60}),0.13,0.32,0.13,s2*0.6,0.2,-0.55+i*0.37,0,0,PI/2)); }
      P(root,'rboxS',body,1.05,0.4,1.5,0,0.55,0); P(root,'rbox2',stripe,1.07,0.08,1.52,0,0.5,0);
      { const tu=G0(); tu.position.set(0,0.9,0); root.add(tu); R.turret=tu; P(tu,'sph',body,0.45,0.28,0.45); P(tu,'cyl',chrome,0.08,0.9,0.08,0,0.05,0.55,PI/2); P(tu,'sph',mat('#ff3dce',{e:1}),0.1,0.1,0.1,0,0.05,1.0); P(tu,'rbox2',mat('#2a3a55',{s:150}),0.3,0.1,0.05,0,0.12,0.4); } R.height=1.3; break;
    case 'scooter': P(root,'rboxS',body,0.4,0.35,1.0,0,0.45,0); P(root,'rbox2',mat('#151515'),0.36,0.08,0.4,0,0.7,-0.15); P(root,'cyl',chrome,0.03,0.5,0.03,0,0.85,0.4,-0.3); P(root,'rbox2',chrome,0.5,0.03,0.03,0,1.08,0.48);
      P(root,'rboxS',mat('#ffffff',{s:30}),0.45,0.35,0.45,0,0.85,-0.45); P(root,'box',mat('#ffffff',{map:labelTex('PIZZA','#e5302a','#ffffff'),basic:1}),0.46,0.2,0.46,0,0.85,-0.45);
      { const rd=buildHuman({skin:'#e8b48a',hair:['short','#3a2414'],hat:['cap','#e5302a'],outfit:['tshirt','#e5302a','#ffffff']},x.tc); rd.scale.setScalar(0.85); rd.position.set(0,0.35,0.0); root.add(rd); }
      wheel(0,0.45,0.2); wheel(0,-0.4,0.2); R.wheels.forEach(w=>w.scale.x=0.6); R.height=1.4; break;
    case 'digger': for(const s2 of [-1,1]){ P(root,'rboxS',tire,0.3,0.36,1.5,s2*0.55,0.2,0); }
      { const up=G0(); up.position.y=0.45; root.add(up); P(up,'rboxS',body,1.0,0.5,1.0,0,0.25,-0.1); P(up,'rbox2',glass,0.5,0.4,0.5,-0.2,0.7,0.1); P(up,'rbox2',body,0.55,0.12,0.55,-0.2,0.95,0.1);
        const arm=G0(); arm.position.set(0.25,0.45,0.35); up.add(arm); R.ladder=arm; P(arm,'rbox2',body,0.15,0.15,1.1,0,0.3,0.45,-0.5); P(arm,'rbox2',body,0.14,0.14,0.8,0,0.5,1.05,0.7); P(arm,'rboxS',mat('#555',{s:60}),0.5,0.35,0.35,0,0.1,1.35); } R.height=1.6; break;
    case 'dumptruck': P(root,'rboxS',body,1.1,0.85,0.8,0,0.85,0.75); P(root,'rbox2',glass,1.0,0.3,0.05,0,1.05,1.16); P(root,'rbox2',mat('#555',{s:60}),1.1,0.3,2.3,0,0.5,0);
      { const bed=G0(); bed.position.set(0,0.7,-0.95); root.add(bed); R.ladder=bed; P(bed,'rboxS',body,1.2,0.75,1.6,0,0.4,0.75); for(let i=0;i<6;i++) P(bed,'dodec',mat('#8a7a6a',{flat:true,s:5}),0.25,0.2,0.25,(i%3-1)*0.35,0.85,0.4+Math.floor(i/3)*0.6); }
      lights(1.16,-1.2,0.6,0.42); wheel(-0.6,0.75,0.3); wheel(0.6,0.75,0.3); wheel(-0.6,-0.5,0.3); wheel(0.6,-0.5,0.3); wheel(-0.6,-0.95,0.3); wheel(0.6,-0.95,0.3); R.height=1.7; break;
    case 'borer': P(root,'caps',body,0.95,0.9,0.95,0,0.5,-0.1,PI/2); P(root,'rbox2',stripe,1.0,0.12,1.0,0,0.5,-0.1,PI/2);
      { const dr=G0(); dr.position.set(0,0.5,0.75); root.add(dr); R.drill=dr; P(dr,'cone',mat('#c0c6cc',{s:140,m:0.8}),0.5,0.7,0.5,0,0,0.3,PI/2); for(let i=0;i<4;i++){ const a=i/4*TAU; P(dr,'rbox2',mat('#ffcf3a',{s:110,m:0.6}),0.06,0.06,0.6,Math.cos(a)*0.28,Math.sin(a)*0.28,0.25,0,0,a); } }
      for(const s2 of [-1,1]) P(root,'rboxS',tire,0.25,0.3,1.6,s2*0.5,0.15,-0.1); for(let i=0;i<6;i++) P(root,'dodec',mat('#8a7a5a',{flat:true,s:5}),0.2,0.15,0.2,Math.sin(i*2)*0.6,0.1,-0.9-Math.cos(i)*0.2); R.height=1.2; break;
    case 'f1': P(root,'caps',body,0.4,0.9,0.4,0,0.3,0,PI/2); P(root,'rbox2',body,1.2,0.05,0.25,0,0.25,1.1); P(root,'rbox2',body,1.0,0.25,0.06,0,0.6,-1.0); for(const s2 of [-1,1]) P(root,'rbox2',body,0.05,0.35,0.3,s2*0.48,0.45,-1.0);
      P(root,'rbox2',stripe,0.42,0.06,1.6,0,0.48,0); P(root,'sph',mat('#151515',{s:150}),0.15,0.12,0.18,0,0.52,-0.1); P(root,'rbox2',body,0.5,0.25,0.6,0,0.35,-0.5);
      wheel(-0.5,0.7,0.24); wheel(0.5,0.7,0.24); wheel(-0.52,-0.65,0.28); wheel(0.52,-0.65,0.28); R.height=0.9; break;
    case 'limo': P(root,'rboxS',body,1.05,0.5,2.8,0,0.48,0); P(root,'rboxS',body,0.95,0.4,1.7,0,0.85,-0.15); for(const s2 of [-1,1]) for(let i=0;i<3;i++) P(root,'rbox2',glass,0.02,0.24,0.42,s2*0.48,0.88,-0.75+i*0.55);
      P(root,'rbox2',glass,0.9,0.28,0.05,0,0.88,0.72); P(root,'rbox2',chrome,1.08,0.12,0.08,0,0.38,1.4); for(const s2 of [-1,1]){ P(root,'cyl',chrome,0.012,0.25,0.012,s2*0.42,0.85,1.3); P(root,'rbox2',mat('#2f5fd0'),0.14,0.09,0.01,s2*0.42+s2*0.07,0.95,1.3); }
      P(root,'rbox2',stripe,1.07,0.06,2.82,0,0.4,0); lights(1.4,-1.4,0.5,0.4); wheel(-0.52,0.95); wheel(0.52,0.95); wheel(-0.52,-0.95); wheel(0.52,-0.95); R.height=1.2; break;
    case 'trailer': break;
    default: P(root,'rboxS',body,1.1,0.8,2.0,0,0.7,0); wheel(-0.56,0.6); wheel(0.56,0.6); wheel(-0.56,-0.6); wheel(0.56,-0.6); R.height=1.3;
  }
}

// ---------------------------------------------------------------- buildings
function buildingMore(p,R,root,T,tc){
  const wd=mat('#6b4423',{s:30}), dk=mat('#2a2d35',{s:60}), steel=metal();
  switch(p.type){
    case 'karaoke': P(root,'rboxS',mat('#2a1440',{s:60}),1.3,1.0,0.8,0,0.5,0); P(root,'rbox2',T,1.32,0.08,0.82,0,1.02,0);
      P(root,'rbox2',mat('#ffffff',{map:labelTex('♪ SING! ♪','#140a24','#ff3dce'),basic:1}),0.9,0.42,0.04,0,0.65,0.41);
      for(const s of [-1,1]){ P(root,'cyl',mat('#151515'),0.17,0.05,0.17,s*0.48,0.32,0.41,PI/2); P(root,'cyl',mat('#ff3dce',{e:0.8}),0.07,0.06,0.07,s*0.48,0.32,0.43,PI/2); P(root,'cyl',mat('#3dd6ff',{e:0.8}),0.1,0.02,0.1,s*0.48,0.32,0.42,PI/2); }
      P(root,'cyl',steel,0.02,1.0,0.02,0.45,0.5,0.75); P(root,'cyl',steel,0.15,0.02,0.15,0.45,0.01,0.75); P(root,'caps',mat('#151515',{s:80}),0.05,0.1,0.05,0.45,1.05,0.75,0.4); P(root,'sph',mat('#9aa3ad',{s:120,m:0.6}),0.065,0.065,0.065,0.45,1.13,0.79);
      { const db=G0(); db.position.set(0,1.45,0); root.add(db); R.head=db; P(db,'cyl',steel,0.01,0.3,0.01,0,0.15,0); P(db,'sph',mat('#eef3fa',{s:200,m:0.15,e:0.25,flat:true}),0.22,0.22,0.22,0,-0.05,0); for(let i=0;i<6;i++){ const a=i/6*TAU; P(db,'sphLo',mat(['#ff3dce','#3dd6ff','#ffd34d'][i%3],{e:1}),0.04,0.04,0.04,Math.cos(a)*0.2,-0.05,Math.sin(a)*0.2); } }
      R.height=1.6; R.pulse=true; break;
    case 'fruitmachine': P(root,'rboxS',mat('#b3201a',{s:70}),0.95,1.5,0.75,0,0.75,0); P(root,'rbox2',gold(),0.97,0.1,0.77,0,1.5,0); P(root,'rbox2',T,0.97,0.08,0.77,0,0.06,0);
      P(root,'rbox2',mat('#ffffff',{map:labelTex('🍒 7 🍋','#ffffff','#151515'),basic:1}),0.75,0.3,0.04,0,1.0,0.38); P(root,'rbox2',mat('#ffffff',{map:labelTex('JACKPOT','#151515','#ffd34d'),basic:1}),0.8,0.18,0.04,0,1.36,0.38);
      for(let i=0;i<3;i++) P(root,'cyl',mat(['#39ff6a','#ffd34d','#ff3b3b'][i],{e:0.7}),0.05,0.03,0.05,-0.2+i*0.2,0.66,0.38,PI/2);
      { const lv=G0(); lv.position.set(0.5,0.9,0); root.add(lv); R.head=lv; P(lv,'cyl',steel,0.025,0.5,0.025,0,0.25,0); P(lv,'sph',mat('#e5302a',{s:150}),0.08,0.08,0.08,0,0.52,0); }
      P(root,'sph',mat('#ffd34d',{e:0.9}),0.12,0.08,0.12,0,1.6,0); R.height=1.8; break;
    case 'pitchmachine': P(root,'rboxS',mat('#2e4a8a',{s:50}),0.9,0.5,0.9,0,0.25,0); P(root,'rbox2',T,0.92,0.08,0.92,0,0.5,0); P(root,'cone',mat('#f2f2f2',{s:60}),0.35,0.5,0.35,0,1.05,-0.2,PI); { const hd=G0(); hd.position.y=0.8; root.add(hd); R.head=hd; P(hd,'rbox2',mat(p.color,{s:80}),0.4,0.32,0.5,0,0,0); P(hd,'cyl',dk,0.12,0.5,0.12,0,0,0.36,PI/2); P(hd,'sph',mat('#ffffff'),0.08,0.08,0.08,0,0.02,0.62); } R.height=1.3; break;
    case 'booth': P(root,'rboxS',wd,1.3,0.9,1.0,0,0.45,0); P(root,'rbox2',mat('#8a5a2b',{s:40}),1.36,0.1,1.06,0,0.92,0); for(let i=0;i<5;i++) P(root,'cyl',mat('#8a5a2b'),0.04,0.4,0.04,-0.5+i*0.25,1.15,0.45); P(root,'rbox2',mat('#8a5a2b'),1.3,0.06,0.08,0,1.36,0.45); P(root,'rbox2',T,1.32,0.12,1.02,0,0.7,0); P(root,'cyl',dk,0.02,0.4,0.02,0.4,1.1,-0.2); P(root,'sph',dk,0.05,0.05,0.05,0.4,1.32,-0.15); R.height=1.5; break;
    case 'vault': P(root,'rboxS',mat('#7d8794',{s:110,m:0.6}),1.5,1.4,1.0,0,0.7,0); P(root,'cyl',mat('#9aa3ad',{s:130,m:0.7}),0.5,0.1,0.5,0,0.75,0.5,PI/2); for(let i=0;i<6;i++){ const a=i/6*TAU; P(root,'rbox2',gold(),0.05,0.25,0.04,Math.cos(a)*0.22,0.75+Math.sin(a)*0.22,0.58,0,0,a); } P(root,'sph',gold(),0.08,0.08,0.06,0,0.75,0.58); P(root,'rbox2',T,1.52,0.12,1.02,0,1.3,0); P(root,'plane',mat('#ffffff',{map:labelTex('$ BANK $','#151515','#ffd34d'),basic:1}),1.1,0.25,1,0,1.6,0); R.height=1.8; break;
    case 'turret': P(root,'cyl',mat('#8a93a0',{s:60}),0.42,0.4,0.42,0,0.2,0); P(root,'cyl',T,0.44,0.08,0.44,0,0.38,0); { const hd=G0(); hd.position.y=0.62; root.add(hd); R.head=hd; P(hd,'sph',mat(p.color,{s:100,m:0.4}),0.3,0.24,0.3); P(hd,'cyl',dk,0.06,0.5,0.06,0,0.02,0.32,PI/2); P(hd,'sph',mat('#7df9ff',{e:1}),0.05,0.05,0.05,0,0.02,0.58); } R.height=1.0; break;
    case 'camera': P(root,'cyl',dk,0.06,1.2,0.06,0,0.6,0); P(root,'cyl',mat('#555'),0.3,0.08,0.3,0,0.04,0); { const hd=G0(); hd.position.y=1.25; root.add(hd); R.head=hd; P(hd,'rbox2',mat(p.color,{s:80}),0.3,0.24,0.55,0,0,0.1); P(hd,'cyl',mat('#151515',{s:150}),0.1,0.06,0.1,0,0,0.4,PI/2); P(hd,'sph',mat('#ff2a2a',{e:1}),0.03,0.03,0.03,0.1,0.1,0.38); P(hd,'rbox2',T,0.32,0.05,0.57,0,0.14,0.1); } R.height=1.6; break;
    case 'shower': P(root,'rbox2',mat('#e8f4e8',{s:40}),1.2,0.1,1.2,0,0.05,0); for(const sx of [-1,1]) for(const sz of [-1,1]) P(root,'cyl',steel,0.035,1.7,0.035,sx*0.5,0.85,sz*0.5); P(root,'rbox2',T,1.15,0.08,1.15,0,1.72,0); P(root,'cyl',steel,0.2,0.05,0.2,0,1.6,0); P(root,'cyl',mat('#9fe6ff',{op:0.35}),0.45,1.5,0.45,0,0.8,0).userData.noOutline=true; R.height=1.9; R.drip=true; break;
    case 'shroom': P(root,'caps',mat('#f6efe0',{s:20}),0.4,0.45,0.4,0,0.45,0); { const hd=G0(); hd.position.y=1.0; root.add(hd); R.cap=hd; P(hd,'hemi',mat(p.color,{s:40}),0.85,0.55,0.85); P(hd,'cyl',mat('#e8d0c0'),0.84,0.04,0.84,0,0,0); for(let i=0;i<7;i++){ const a=i/7*TAU; P(hd,'sph',mat('#ffffff'),0.1,0.06,0.1,Math.cos(a)*0.5,0.35,Math.sin(a)*0.5); } } faceEyes(root,0,0.55,0.2,0.1,0.06); P(root,'tor',T,0.22,0.22,0.3,0,0.2,0,PI/2); R.height=1.6; break;
    case 'alarm': P(root,'cyl',dk,0.06,1.0,0.06,0,0.5,0); P(root,'rbox2',mat(p.color,{s:80}),0.5,0.5,0.2,0,1.1,0); P(root,'hemi',mat('#c0c6cc',{s:130,m:0.7}),0.2,0.2,0.08,0,1.12,0.1,PI/2); P(root,'rbox2',T,0.52,0.08,0.22,0,1.4,0); P(root,'cyl',mat('#555'),0.25,0.06,0.25,0,0.03,0); R.height=1.5; R.bell=true; break;
    case 'cannon': P(root,'rboxS',mat('#555',{s:60}),0.9,0.4,0.9,0,0.2,0); P(root,'rbox2',T,0.92,0.08,0.92,0,0.38,0); { const hd=G0(); hd.position.y=0.6; root.add(hd); R.head=hd; P(hd,'sph',mat(p.color,{s:80}),0.3,0.25,0.3); P(hd,'caps',mat('#f2f2f2',{s:80}),0.16,0.35,0.16,0,0.05,0.35,PI/2); P(hd,'cone',mat('#f2f2f2'),0.12,0.15,0.12,0,0.05,0.72,-PI/2); } R.height=1.0; break;
    case 'crane': P(root,'rboxS',mat('#555',{s:40}),1.0,0.3,1.0,0,0.15,0); for(let i=0;i<5;i++) P(root,'rbox2',mat(p.color,{s:60}),0.3,0.45,0.3,0,0.5+i*0.45,0); { const hd=G0(); hd.position.y=2.75; root.add(hd); R.head=hd; P(hd,'rbox2',mat(p.color,{s:60}),0.25,0.22,2.4,0,0,0.7); P(hd,'rbox2',dk,0.4,0.4,0.4,0,-0.05,-0.4); P(hd,'rbox2',mat('#2a3a55',{s:150}),0.3,0.25,0.3,0,-0.25,0.1); P(hd,'cyl',dk,0.012,0.9,0.012,0,-0.5,1.7); P(hd,'rbox2',mat('#ff8a1f'),0.5,0.08,0.08,0,-0.95,1.7); } P(root,'rbox2',T,1.02,0.08,1.02,0,0.33,0); R.height=3.0; break;
    case 'speakers': for(let i=0;i<2;i++){ P(root,'rbox2',mat('#151515',{s:40}),1.2,0.7,0.7,0,0.35+i*0.72,0); for(const s of [-1,1]){ P(root,'cyl',mat('#333'),0.22,0.05,0.22,s*0.3,0.35+i*0.72,0.36,PI/2); P(root,'cyl',mat('#ff3dce',{e:0.6}),0.08,0.06,0.08,s*0.3,0.35+i*0.72,0.38,PI/2); } } P(root,'rbox2',T,1.22,0.08,0.72,0,1.45,0); R.height=1.6; R.pulse=true; break;
    case 'ball': P(root,'sph',mat(p.color,{s:20}),0.35,0.35,0.35,0,0.35,0); P(root,'torThin',mat('#ffffff'),0.351,0.351,0.351,0,0.35,0,0.5,0,0.3); R.height=0.7; break;
    case 'kiln': P(root,'cyl',mat(p.color,{s:20,map:stoneTex(p.color)}),0.7,1.0,0.7,0,0.5,0); P(root,'hemi',mat(p.color,{s:20}),0.7,0.5,0.7,0,1.0,0); P(root,'cyl',mat('#555'),0.15,0.6,0.15,0,1.5,-0.2); P(root,'rbox2',mat('#ff8a1f',{e:1}),0.35,0.3,0.05,0,0.4,0.68); P(root,'tor',T,0.71,0.71,0.2,0,0.95,0,PI/2); R.height=1.8; R.smoke=true; break;
    case 'trailer': P(root,'rbox2',mat(p.color,{s:60}),1.4,1.0,2.0,0,0.75,0); P(root,'rbox2',mat('#c0c6cc',{s:110,m:0.5}),1.42,0.12,2.02,0,1.27,0); for(const z of [-0.7,0.1]) P(root,'rbox2',mat('#2a3a55',{s:150}),1.42,0.25,0.35,0,0.95,z); P(root,'rbox2',mat('#ffd34d',{e:0.6}),1.44,0.05,1.6,0,0.5,0); P(root,'rbox2',mat('#2a3a55',{s:150}),0.04,0.3,0.6,0.71,0.95,-0.3); P(root,'rbox2',mat('#c0c6cc',{s:110,m:0.5}),0.04,0.75,0.4,0.71,0.65,0.45); P(root,'oct',gold(),0.18,0.18,0.03,0.72,1.05,0.45,0,PI/2,0); for(const s of [-1,1]) P(root,'cyl',mat('#1e1e22'),0.22,0.15,0.22,s*0.62,0.22,0,0,0,PI/2); P(root,'rbox2',T,1.42,0.1,2.02,0,0.35,0); R.height=1.4; break;
    case 'ballot': P(root,'rboxS',mat(p.color,{s:40}),1.1,1.0,1.0,0,0.5,0); P(root,'rbox2',mat('#151515'),0.5,0.05,0.08,0,1.0,0); P(root,'plane',mat('#ffffff',{map:labelTex('VOTE','#2f5fd0','#ffffff'),basic:1}),0.8,0.22,1,0,0.6,0.51); P(root,'rbox2',T,1.12,0.1,1.02,0,0.1,0);
      { const pp=G0(); pp.position.y=1.1; root.add(pp); R.cap=pp; P(pp,'rbox2',mat('#fff6dc',{s:20}),0.3,0.4,0.02,0,0.1,0,0,0,0.1); } R.height=1.5; break;
    case 'flytrap': P(root,'cyl',mat('#8a5a2b',{s:20}),0.6,0.4,0.6,0,0.2,0); P(root,'cyl',mat('#5a3a1a'),0.55,0.05,0.55,0,0.4,0); P(root,'cyl',mat('#2e7d2e',{s:30}),0.1,1.0,0.1,0,0.8,0,0.15);
      { const hd=G0(); hd.position.set(0,1.35,0.12); root.add(hd); R.head=hd; const gm=mat(p.color,{s:40}), pk=mat('#e5446a',{s:60}); const top=G0(); hd.add(top); R.jaw=top; P(top,'sph',gm,0.4,0.16,0.42,0,0.06,0.25); P(top,'sph',pk,0.36,0.1,0.38,0,0.0,0.25);
        P(hd,'sph',gm,0.4,0.16,0.42,0,-0.1,0.25); P(hd,'sph',pk,0.36,0.1,0.38,0,-0.04,0.25); for(let i=0;i<9;i++){ const a=-PI/2+i/8*PI; P(top,'cone',mat('#ffffff'),0.025,0.12,0.025,Math.sin(a)*0.36,-0.06,0.25+Math.cos(a)*0.38,PI); P(hd,'cone',mat('#ffffff'),0.025,0.12,0.025,Math.sin(a)*0.36,-0.0,0.25+Math.cos(a)*0.38); } }
      for(const s2 of [-1,1]) P(root,'sph',mat('#3aa83a'),0.3,0.04,0.12,s2*0.35,0.55,0,0,0,s2*0.4); R.height=1.8; break;
    case 'bloodbank': P(root,'rboxS',mat('#f4f4f4',{s:40}),1.2,1.1,0.9,0,0.55,0); for(let i=0;i<3;i++) P(root,'rbox2',mat('#c0202a',{op:0.85,s:150}),0.22,0.35,0.06,-0.35+i*0.35,0.7,0.46); P(root,'rbox2',mat('#e5302a',{e:0.3}),0.4,0.12,0.04,0,1.25,0.46); P(root,'rbox2',mat('#e5302a',{e:0.3}),0.12,0.4,0.04,0,1.25,0.46); P(root,'rbox2',T,1.22,0.1,0.92,0,0.12,0); R.height=1.6; R.drip=true; break;
    case 'mri': { const m=mat(p.color,{s:90}); P(root,'rboxS',m,1.7,1.6,0.9,0,0.85,0); P(root,'cyl',mat('#2a2d35'),0.5,0.95,0.5,0,0.8,0,PI/2); P(root,'tor',mat('#7df9ff',{e:0.8}),0.55,0.55,0.35,0,0.8,0.46); P(root,'rbox2',mat('#c0c6cc',{s:110,m:0.5}),0.5,0.15,1.6,0,0.4,0.9); P(root,'rbox2',T,1.72,0.12,0.92,0,1.6,0); R.height=1.8; R.pulse=true; break; }
    case 'portaloo': P(root,'rboxS',mat(p.color,{s:60}),0.8,1.6,0.8,0,0.8,0); P(root,'hemi',mat('#ffffff',{s:40}),0.45,0.18,0.45,0,1.6,0); P(root,'rbox2',mat(shade(p.color,0.8)),0.6,1.3,0.04,0,0.75,0.41); P(root,'plane',mat('#ffffff',{map:labelTex('OCCUPIED','#e5302a','#ffffff'),basic:1}),0.45,0.12,1,0,1.2,0.44); P(root,'rbox2',T,0.82,0.08,0.82,0,0.05,0); R.height=1.8; R.bell=true; break;
    case 'flamejets': for(const s2 of [-1,1]){ P(root,'cyl',mat('#2a2a2a',{s:60}),0.25,0.8,0.25,s2*0.45,0.4,0); P(root,'cyl',mat('#555',{s:90,m:0.5}),0.18,0.1,0.18,s2*0.45,0.82,0); } P(root,'rbox2',mat(p.color),1.3,0.3,0.6,0,0.15,0); P(root,'rbox2',T,1.32,0.08,0.62,0,0.32,0); R.height=1.0; R.jets=true; break;
    case 'portrait': { const gm=gold(); P(root,'rbox2',gm,1.4,1.8,0.18,0,1.3,0); P(root,'rbox2',mat('#3a4a2a',{s:20}),1.15,1.5,0.2,0,1.3,0); const f=buildHuman({skin:'#e8c8a0',hair:['long','#3a2414'],outfit:['robe','#3a2a1a','#5a4a2a']},tc); f.scale.setScalar(1.05); f.position.set(0,0.35,0.0); root.add(f); R.head=null;
      for(const s2 of [-1,1]) P(root,'cyl',mat('#5a3a1a'),0.04,1.1,0.04,s2*0.5,0.45,-0.35,-0.3); P(root,'rbox2',T,1.42,0.1,0.2,0,0.38,0); R.height=2.3; break; }
    case 'hypehouse': P(root,'rboxS',mat(p.color,{s:40}),1.6,1.2,1.3,0,0.6,0); P(root,'cone4',mat('#ffffff',{s:30}),1.3,0.6,1.1,0,1.5,0,0,PI/4); P(root,'rbox2',mat('#2a2a44'),0.4,0.65,0.05,0,0.33,0.66); for(const s2 of [-1,1]) P(root,'rbox2',mat('#bff4ff',{e:0.4}),0.35,0.3,0.05,s2*0.5,0.85,0.66);
      P(root,'tor',mat('#ffffff',{e:1}),0.35,0.35,0.3,0.55,1.5,0.4); P(root,'plane',mat('#ffffff',{map:labelTex('● LIVE','#e5302a','#ffffff'),basic:1}),0.6,0.16,1,-0.3,1.12,0.67); P(root,'rbox2',T,1.62,0.1,1.32,0,0.08,0); R.height=1.9; break;
    default: P(root,'rboxS',mat(p.color||'#888',{s:40}),1,1,1,0,0.5,0); R.height=1.1;
  }
}
