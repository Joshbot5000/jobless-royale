// =====================================================================
//  CHARACTER KIT — one kit.glb (tools/blender_kit) embedded by build.py as KIT_B64
//  Skinned bodies (3 builds), sculpted heads + face layers, every hair style, robe sleeves, one painted-shading atlas.
//  buildHuman() binds the bodies to its own rig groups (they act as bones), so every animation the sim drives keeps working.
// =====================================================================
let KIT=null;
const KIT_REG=['K_NECK','K_TORSO','K_UPARM','K_FOREARM','K_HANDS','K_LEGS','K_SHOES','K_SOLE'];
const KIT_BONE={Hips:'hips',Spine:'torso',Spine1:'torso',Neck:'torso',Head:'head',LeftUpLeg:'legL',LeftLeg:'legL',LeftFoot:'legL',RightUpLeg:'legR',RightLeg:'legR',RightFoot:'legR',
  LeftArm:'apL',LeftForeArm:'apL',LeftHand:'handL',RightArm:'apR',RightForeArm:'apR',RightHand:'handR'};   // kit "Left" = +x = the rig's armR side
const KIT_W=[1.0,1.3,1.5], KIT_LR=1.36, KIT_HK=0.8, KIT_HY=0.44*(KIT_LR-1)+0.44;
// minimal GLB reader: meshes, skins and the one image; no node hierarchy needed (every part is exported in rest pose, game space)
function kitParse(buf){
  const dv=new DataView(buf), jl=dv.getUint32(12,true), J=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))), bin=20+jl+8;
  const CT={5126:Float32Array,5123:Uint16Array,5121:Uint8Array,5125:Uint32Array}, NC={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
  const acc=(i)=>{ const a=J.accessors[i], bv=J.bufferViews[a.bufferView], T=CT[a.componentType], n=NC[a.type], off=bin+(bv.byteOffset||0)+(a.byteOffset||0);
    const stride=bv.byteStride||n*T.BYTES_PER_ELEMENT; let arr;
    if(stride===n*T.BYTES_PER_ELEMENT&&off%T.BYTES_PER_ELEMENT===0) arr=new T(buf,off,a.count*n).slice();
    else { arr=new T(a.count*n); const src=new DataView(buf); for(let k=0;k<a.count;k++) for(let c=0;c<n;c++){ const o=off+k*stride+c*T.BYTES_PER_ELEMENT;
      arr[k*n+c]=T===Float32Array?src.getFloat32(o,true):T===Uint16Array?src.getUint16(o,true):T===Uint32Array?src.getUint32(o,true):src.getUint8(o); } }
    if(a.normalized&&T!==Float32Array){ const s=T===Uint8Array?255:65535, f=new Float32Array(arr.length); for(let k=0;k<arr.length;k++) f[k]=arr[k]/s; return [f,n]; }
    return [arr,n]; };
  const joints=J.skins&&J.skins[0]?J.skins[0].joints.map(i=>J.nodes[i].name):[];
  const parts={};
  for(const nd of J.nodes){ if(nd.mesh===undefined) continue; const P={};
    for(const pr of J.meshes[nd.mesh].primitives){ const g=new THREE.BufferGeometry(), A=pr.attributes;
      const set=(k,name)=>{ if(A[k]===undefined) return; const [a,n]=acc(A[k]); g.setAttribute(name,new THREE.BufferAttribute(k==='JOINTS_0'?Uint16Array.from(a):a,n)); };
      set('POSITION','position'); set('NORMAL','normal'); set('TEXCOORD_0','uv'); set('JOINTS_0','skinIndex'); set('WEIGHTS_0','skinWeight');
      const [ix]=acc(pr.indices); g.setIndex(new THREE.BufferAttribute(ix.length&&Math.max(...ix.subarray(0,1))>=0&&g.attributes.position.count>65535?Uint32Array.from(ix):Uint16Array.from(ix),1));
      g.computeBoundingSphere(); P[J.materials[pr.material].name]=g; }
    parts[nd.name]=P; }
  let img=null; if(J.images&&J.images[0]){ const bv=J.bufferViews[J.images[0].bufferView]; img={bytes:new Uint8Array(buf,bin+(bv.byteOffset||0),bv.byteLength),mime:J.images[0].mimeType}; }
  return {parts,joints,img};
}
function kitBoot(){
  if(typeof KIT_B64==='undefined'||!KIT_B64||typeof document==='undefined') return;
  try{
    const t0=performance.now(), s=atob(KIT_B64), u8=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u8[i]=s.charCodeAt(i);
    const k=kitParse(u8.buffer);
    // the atlas: white until the JPEG decodes (a frame or two), then the painted shading
    const cv=document.createElement('canvas'); cv.width=cv.height=4; const cx=cv.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,4,4);
    const tex=new THREE.Texture(cv); tex.flipY=false; tex.anisotropy=4; tex.needsUpdate=true;
    if(k.img){ const im=new Image(), url=URL.createObjectURL(new Blob([k.img.bytes],{type:k.img.mime}));
      im.onload=()=>{ tex.image=im; tex.needsUpdate=true; URL.revokeObjectURL(url); KIT.imgMs=performance.now()-t0; kitRefresh(); }; im.src=url; }
    KIT={parts:k.parts,joints:k.joints,atlas:tex,shared:new Set(),cache:new Map(),ms:0};
    for(const n in k.parts) for(const r in k.parts[n]) KIT.shared.add(k.parts[n][r]);
    KIT.ms=performance.now()-t0;
  }catch(e){ KIT=null; console.warn('kit failed, using sculpted fallback',e); }
}
// portraits drawn before the atlas arrived are redrawn with it
function kitRefresh(){ try{ if(typeof portraitCache!=='undefined'){ for(const k in portraitCache) delete portraitCache[k]; portraitOrder.length=0; faceCache={}; } }catch(e){} }

// ---------------------------------------------------------------- materials
const KIT_SKMAT=new Map();
function kitSkinned(m){ let v=KIT_SKMAT.get(m); if(!v){ v=m.clone(); v.skinning=true; v.onBeforeCompile=m.onBeforeCompile; v.customProgramCacheKey=m.customProgramCacheKey; v.userData={...m.userData}; KIT_SKMAT.set(m,v); } return v; }
// a kit-shaded version of any game material: same colour and finish, multiplied by the painted shading atlas
function kitMat(m){ const k='kit|'+m.uuid; let v=KIT.cache.get(k); if(!v){ v=m.clone(); v.map=KIT.atlas; v.bumpMap=null; v.onBeforeCompile=m.onBeforeCompile; v.customProgramCacheKey=m.customProgramCacheKey; v.userData={...m.userData};
  v.color=m.color.clone().multiplyScalar(1.06); KIT.cache.set(k,v); } return v; }
const KIT_OUTLINE={};
function kitOutlineMat(color){
  if(KIT_OUTLINE[color]) return KIT_OUTLINE[color];
  const base=outlineMat(color);
  return KIT_OUTLINE[color]=new THREE.ShaderMaterial({ uniforms:base.uniforms, skinning:true, side:THREE.BackSide,
    vertexShader:'#include <common>\n#include <skinning_pars_vertex>\nuniform float thick;\nvoid main(){\n#include <beginnormal_vertex>\n#include <skinbase_vertex>\n#include <skinnormal_vertex>\n#include <begin_vertex>\n#include <skinning_vertex>\n'+
      ' vec3 n=normalize(normalMatrix*objectNormal); vec4 mv=modelViewMatrix*vec4(transformed,1.0); mv.xyz+=n*clamp(thick*(-mv.z)/42.0,0.005,thick); gl_Position=projectionMatrix*mv; }',
    fragmentShader:base.fragmentShader }); }

// ---------------------------------------------------------------- painted faces (one small canvas per look, cached)
// head-local units -> canvas: u = 0.5 + x/0.64, v = 0.5 + y/0.64 (the kit's face-layer UVs)
const KIT_FACES=new Map();
function kitFaceMat(o){
  const key=[o.expr,o.iris,o.brow,o.skin].join('|'); let m=KIT_FACES.get(key); if(m) return m;
  const S=256, c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d');
  const X=v=>(0.5+v/0.64)*S, Y=v=>(0.5-v/0.64)*S, E=o.expr;
  const skin=new THREE.Color(o.skin), lip=skin.clone().lerp(new THREE.Color('#a8384c'),0.55).getStyle(), dark=skin.clone().multiplyScalar(0.42).getStyle();
  // blush
  for(const s of [-1,1]){ const g=x.createRadialGradient(X(s*0.15),Y(-0.075),2,X(s*0.15),Y(-0.075),26); g.addColorStop(0,'rgba(255,90,110,0.38)'); g.addColorStop(1,'rgba(255,90,110,0)'); x.fillStyle=g; x.fillRect(0,0,S,S); }
  // eyes: white, iris with a dark rim and a lighter lower crescent, pupil, two catch-lights, bold upper lash line
  const ER=E==='surprised'?1.12:1, open=E==='sleepy'?0.45:E==='happy'?0.9:1;
  const TILT={angry:[0.02,0.72],stern:[0.38,0.62],determined:[0.42,0.72],smirk:[0.32,0.4]}[E];   // lid line height (fraction above centre) at the inner / outer corner
  for(const s of [-1,1]){ const cx=X(s*0.105), cy=Y(0.028), rx=21*ER, ry=26*ER, top=cy-ry*(open*2-1);
    const lid=TILT&&[[cx-s*rx,cy-ry*(E==='smirk'&&s<0?TILT[0]-0.15:TILT[0])],[cx+s*rx,cy-ry*(E==='smirk'&&s<0?TILT[1]-0.15:TILT[1])]];
    x.save(); x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,TAU); x.clip();
    if(lid){ x.beginPath(); x.moveTo(lid[0][0]-s*2,lid[0][1]); x.lineTo(lid[1][0]+s*2,lid[1][1]); x.lineTo(lid[1][0]+s*2,cy+ry+2); x.lineTo(lid[0][0]-s*2,cy+ry+2); x.closePath(); x.clip(); }
    else { x.beginPath(); x.rect(cx-rx-2,top,rx*2+4,ry*3); x.clip(); }
    x.fillStyle='#fbf7f2'; x.fillRect(cx-rx,cy-ry,rx*2,ry*2);
    const ix=cx-s*2, iy=cy+(lid?5:2), ir=E==='surprised'?13:16.5;
    const ig=x.createRadialGradient(ix,iy+ir*0.35,1,ix,iy,ir); ig.addColorStop(0,new THREE.Color(o.iris).lerp(new THREE.Color('#ffffff'),0.35).getStyle()); ig.addColorStop(0.75,o.iris); ig.addColorStop(1,new THREE.Color(o.iris).multiplyScalar(0.45).getStyle());
    x.fillStyle=ig; x.beginPath(); x.arc(ix,iy,ir,0,TAU); x.fill();
    x.fillStyle='#0b0b10'; x.beginPath(); x.arc(ix,iy,ir*0.5,0,TAU); x.fill();
    x.fillStyle='rgba(255,255,255,0.95)'; x.beginPath(); x.arc(ix+ir*0.38,iy-ir*0.42,ir*0.3,0,TAU); x.fill(); x.beginPath(); x.arc(ix-ir*0.35,iy+ir*0.4,ir*0.13,0,TAU); x.fill();
    x.fillStyle='rgba(60,30,30,0.18)'; x.fillRect(cx-rx,cy-ry,rx*2,ry*0.55);   // lid shadow on the white
    x.restore();
    // lash line along the lid edge
    x.strokeStyle='#1a1214'; x.lineCap='round'; x.lineWidth=5;
    x.beginPath();
    if(lid){ x.moveTo(lid[0][0],lid[0][1]); x.lineTo(lid[1][0],lid[1][1]); }
    else if(open<1){ x.moveTo(cx-rx*0.98,top+ry*0.1); x.quadraticCurveTo(cx,top-ry*0.12,cx+rx*0.98,top+ry*0.1); }
    else x.ellipse(cx,cy,rx,ry,0,PI*1.08,PI*1.92);
    x.stroke();
    const fy=lid?lid[1][1]:open<1?top:cy-ry*0.55;
    x.lineWidth=3; x.beginPath(); x.moveTo(cx+s*rx*0.82,fy); x.lineTo(cx+s*rx*1.18,fy-6); x.stroke();   // outer lash flick
    x.strokeStyle='rgba(90,40,40,0.35)'; x.lineWidth=2; x.beginPath(); x.ellipse(cx,cy,rx*0.92,ry*0.95,0,PI*0.2,PI*0.8); x.stroke(); }
  // brows
  x.strokeStyle=o.brow; x.lineCap='round'; x.lineWidth=10;
  for(const s of [-1,1]){ const by=Y(E==='surprised'?0.15:0.13);
    x.beginPath();
    if(E==='angry'){ x.moveTo(X(s*0.045),by+11); x.lineTo(X(s*0.16),by-6); }
    else if(E==='stern'||(E==='smirk'&&s<0)){ x.lineWidth=11; x.moveTo(X(s*0.045),by+8); x.lineTo(X(s*0.16),by-1); }
    else if(E==='determined'){ x.lineWidth=11; x.moveTo(X(s*0.045),by+9); x.quadraticCurveTo(X(s*0.1),by-2,X(s*0.162),by-3); }
    else if(E==='smirk'){ x.moveTo(X(s*0.05),by); x.quadraticCurveTo(X(s*0.1),by-12,X(s*0.162),by-3); }
    else if(E==='sleepy'){ x.moveTo(X(s*0.05),by+2); x.quadraticCurveTo(X(s*0.1),by-3,X(s*0.16),by+5); }
    else { x.moveTo(X(s*0.048),by+3); x.quadraticCurveTo(X(s*0.1),by-7,X(s*0.162),by+1); }
    x.stroke(); x.lineWidth=10; }
  // mouth
  const my=Y(-0.12), mx=X(0);
  x.lineCap='round'; x.lineJoin='round';
  const lipLow=(w=8)=>{ x.strokeStyle=lip; x.lineWidth=4; x.beginPath(); x.moveTo(mx-w,my+11); x.quadraticCurveTo(mx,my+15,mx+w,my+11); x.stroke(); };
  if(E==='happy'){ x.fillStyle='#5a1a22'; x.beginPath(); x.moveTo(mx-22,my-4); x.quadraticCurveTo(mx,my-1,mx+22,my-4); x.quadraticCurveTo(mx+15,my+20,mx,my+21); x.quadraticCurveTo(mx-15,my+20,mx-22,my-4); x.fill();
    x.fillStyle='#ffffff'; x.beginPath(); x.moveTo(mx-17,my-3); x.quadraticCurveTo(mx,my,mx+17,my-3); x.lineTo(mx+14,my+3); x.quadraticCurveTo(mx,my+5,mx-14,my+3); x.closePath(); x.fill();
    x.fillStyle='#e0607a'; x.beginPath(); x.ellipse(mx,my+15,9,4.5,0,0,TAU); x.fill();
    x.strokeStyle=lip; x.lineWidth=3; x.beginPath(); x.moveTo(mx-22,my-4); x.quadraticCurveTo(mx+0,my-1,mx+22,my-4); x.stroke(); }
  else if(E==='surprised'){ x.fillStyle='#5a1a22'; x.beginPath(); x.ellipse(mx,my+4,9,12,0,0,TAU); x.fill(); x.strokeStyle=lip; x.lineWidth=4; x.stroke(); }
  else if(E==='angry'){ x.strokeStyle=dark; x.lineWidth=5; x.beginPath(); x.moveTo(mx-17,my+7); x.quadraticCurveTo(mx,my-5,mx+17,my+7); x.stroke(); }
  else if(E==='stern'){ x.strokeStyle=dark; x.lineWidth=5; x.beginPath(); x.moveTo(mx-15,my+5); x.quadraticCurveTo(mx,my+1,mx+15,my+5); x.stroke(); lipLow(7); }
  else if(E==='determined'){ x.strokeStyle=dark; x.lineWidth=4.5; x.beginPath(); x.moveTo(mx-14,my+1); x.quadraticCurveTo(mx,my+6,mx+14,my-1); x.stroke(); lipLow(7); }
  else if(E==='smirk'){ x.strokeStyle=dark; x.lineWidth=4.5; x.beginPath(); x.moveTo(mx-13,my+5); x.quadraticCurveTo(mx+3,my+8,mx+19,my-5); x.stroke(); lipLow(6); }
  else { x.strokeStyle=dark; x.lineWidth=4.5; x.beginPath(); x.moveTo(mx-17,my-1); x.quadraticCurveTo(mx,my+(E==='sleepy'?5:9),mx+17,my-1); x.stroke(); lipLow(); }
  const t=new THREE.CanvasTexture(c); t.flipY=false; t.anisotropy=4;   // glTF UVs: v runs down the canvas
  m=new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:0.6,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  m.envMap=envCube(); m.envMapIntensity=0.3; m.userData.jrSkin=true; m.userData.jrRim='#ffc9a8'; m.onBeforeCompile=jrPatch; m.customProgramCacheKey=jrKey;
  KIT_FACES.set(key,m); return m;
}

// ---------------------------------------------------------------- geometry helpers
// a rigid kit part moved into a rig group's frame (cached: shared by every model)
function kitRigid(name,reg,inv){ const k='r|'+name+'|'+reg; let g=KIT.cache.get(k); if(g) return g; const src=KIT.parts[name]&&KIT.parts[name][reg]; if(!src) return null;
  g=new THREE.BufferGeometry(); for(const a of ['position','normal','uv']) if(src.attributes[a]) g.setAttribute(a,src.attributes[a].clone()); g.setIndex(src.index);
  g.applyMatrix4(inv); g.computeBoundingSphere(); KIT.cache.set(k,g); KIT.shared.add(g); return g; }
const kitHeadInv=()=>new THREE.Matrix4().makeScale(1/KIT_HK,1/KIT_HK,1/KIT_HK).multiply(new THREE.Matrix4().makeTranslation(0,-(KIT_HY+0.29*2+0.035+0.3*0.92*KIT_HK),0));
function kitAPInv(s){ return new THREE.Matrix4().makeTranslation(s*(0.27+0.025),KIT_HY+0.29*1.62,0).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.05,0,s*0.15))).invert(); }
// the body regions that share a material are merged into one skinned geometry (cached per build + grouping)
function kitBodyGeo(vi,groups){ const k='b|'+vi+'|'+groups.map(g=>g.join(',')).join('/'); let out=KIT.cache.get(k); if(out) return out; out=[];
  const P=KIT.parts['body_v'+vi];
  for(const regs of groups){ const list=regs.map(r=>P[KIT_REG[r]]).filter(Boolean); if(!list.length){ out.push(null); continue; }
    if(list.length===1){ out.push(list[0]); continue; }
    const g=new THREE.BufferGeometry(); let nv=0, ni=0; for(const s of list){ nv+=s.attributes.position.count; ni+=s.index.count; }
    for(const a of ['position','normal','uv','skinIndex','skinWeight']){ const n=list[0].attributes[a].itemSize, T=list[0].attributes[a].array.constructor, arr=new T(nv*n); let o=0; for(const s of list){ arr.set(s.attributes[a].array,o); o+=s.attributes[a].array.length; } g.setAttribute(a,new THREE.BufferAttribute(arr,n)); }
    const ix=new (nv>65535?Uint32Array:Uint16Array)(ni); let o=0, base=0; for(const s of list){ const a=s.index.array; for(let i=0;i<a.length;i++) ix[o+i]=a[i]+base; o+=a.length; base+=s.attributes.position.count; }
    g.setIndex(new THREE.BufferAttribute(ix,1)); g.computeBoundingSphere(); KIT.shared.add(g); out.push(g); }
  KIT.cache.set(k,out); return out; }
// bind the build's body to the rig groups: they ARE the bones (call with the rig at rest)
function kitBindBody(root,vi,regionMats,bones){
  const byMat=new Map(); regionMats.forEach((m,r)=>{ if(!byMat.has(m)) byMat.set(m,[]); byMat.get(m).push(r); });
  const mats=[...byMat.keys()], geos=kitBodyGeo(vi,[...byMat.values()]);
  root.updateMatrixWorld(true);
  const skel=new THREE.Skeleton(KIT.joints.map(n=>bones[KIT_BONE[n]]));
  geos.forEach((g,i)=>{ if(!g) return; const me=new THREE.SkinnedMesh(g,kitSkinned(kitMat(mats[i]))); me.userData.kit=true; root.add(me); me.updateMatrixWorld(true); me.bind(skel,me.matrixWorld); });
}
// clones made by getModel(): point each skinned part at the clone's own rig groups (same traversal order as the template)
function kitSkinMap(tpl){ const idx=new Map(); let i=0; tpl.traverse(o=>idx.set(o,i++)); const L=[]; tpl.traverse(o=>{ if(o.isSkinnedMesh) L.push([idx.get(o),o.skeleton.bones.map(b=>idx.get(b))]); }); return L; }
function kitRebind(c,L){ if(!L||!L.length) return; const nodes=[]; c.traverse(o=>nodes.push(o)); const made=new Map();
  for(const [mi,bi] of L){ const o=nodes[mi], src=o.skeleton; let sk=made.get(src); if(!sk){ sk=new THREE.Skeleton(bi.map(j=>nodes[j]),src.boneInverses); made.set(src,sk); } o.bind(sk,o.bindMatrix); }
  c.addEventListener('removed',()=>{ for(const sk of made.values()) sk.dispose(); });
  KIT_LIVE.set(c,[...made.values()]); }
// bone textures of clones that left the scene without a direct remove (tower defenders go with their tower / the arena)
const KIT_LIVE=new Map();
function kitSweep(scene){ for(const [c,sks] of KIT_LIVE){ let o=c; while(o.parent) o=o.parent; if(o!==scene){ for(const sk of sks) sk.dispose(); KIT_LIVE.delete(c); } } }
kitBoot();
// expression from the look and the card: face options first, then who the character is (stern officials and the military,
// scheming villains, determined champions and tanks), then a stable hash among friendly faces
let KIT_CARD=null;
const KIT_STERN=/judge|barrister|bailiff|justice|chancellor|prosecutor|counsel|usher|clerk|notary|chef|supreme|leader|general|sergeant|colonel|commander|captain|admiral|cadet|soldier|military|marshal|police|swat|guard|security|warden|officer|inspector|detective|agent|fbi|referee|umpire|boss|ceo|banker|tax|auditor|dictator|emperor|king|queen|minister|president|senator|whip|speaker|incumbent|parliament|headmaster|drill|bouncer|landlord/i;
const KIT_VILLAIN=/villain|vampire|witch|zombie|evil|crook|thief|robber|burglar|mob|gang|pirate|scam|fraud|hacker|plague|reaper|devil|demon|tyrant|shark|loan|lobbyist|spy|ninja|assassin|mummy|ghoul|skeleton|dracula|troll|bandit|outlaw|insider|ponzi|cartel/i;
function kitExpr(p,fh){
  const F=p.face||[]; if(F.includes('angry')) return 'angry'; if(F.includes('sleepy')) return 'sleepy';
  if(!KIT_CARD&&typeof CARDS!=='undefined'){ KIT_CARD=new Map(); for(const k in CARDS){ const c=CARDS[k]; if(c&&c.model) KIT_CARD.set(c.model,Object.assign({id:k},c)); }
    if(typeof THEMES!=='undefined') for(const t of THEMES){ if(t.king) KIT_CARD.set(t.king,{id:'king',name:'king',rar:'champion',role:'tank'}); if(t.archer) KIT_CARD.set(t.archer,{id:'guard',name:'tower guard',role:'tank'}); } }
  const c=KIT_CARD&&KIT_CARD.get(p);
  if(c){ const who=c.id+' '+(c.name||''), d=c.desc||'';
    if(KIT_VILLAIN.test(who)) return fh%3?'smirk':'angry';
    if(KIT_STERN.test(who)) return fh%4?'stern':'angry';
    if(c.rar==='champion'||c.role==='tank'||c.role==='wincon'||c.role==='hero') return fh%3?'determined':'stern';
    if(/villain|evil|steal|scam|curse/i.test(d)) return 'smirk'; }
  return ['happy','neutral','happy','surprised','neutral','determined'][fh%6]; }
// Flyers: overlapping round primitives of one material in one rig group become ONE smooth sculpted surface
// (body + tail, head + cheeks, wing segments), so birds and bats read as single soft shapes like the kit humans.
let SMOOTH_FLY=true;
const BLOB_GEO=()=>({sph:'e',sphLo:'e',sphMid:'e',head:'e',puff:'e',puffLo:'e',caps:'c',capsLo:'c'});
function smoothBlobs(node,keep){
  for(const ch of node.children) if(!ch.isMesh&&ch.children.length) smoothBlobs(ch,keep);
  const kinds=BLOB_GEO(), types=new Map(); for(const k in kinds) types.set(geo(k),kinds[k]);
  const byMat=new Map();
  for(const ch of node.children){ if(!ch.isMesh||keep.has(ch)||ch.userData.noOutline||ch.material.transparent||!types.has(ch.geometry)) continue; if(!byMat.has(ch.material)) byMat.set(ch.material,[]); byMat.get(ch.material).push(ch); }
  for(const [m,list] of byMat){
    if(list.length<2) continue;
    const items=list.map(o=>{ o.updateMatrix(); const inv=o.matrix.clone().invert(), sc=Math.min(Math.abs(o.scale.x),Math.abs(o.scale.y),Math.abs(o.scale.z)), t=types.get(o.geometry);
      const b=new THREE.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(o.matrix); return {inv,sc,t,b,o}; });
    // keep only parts that touch another part (a lone eye-sphere stays as it is)
    const touch=items.filter(a=>items.some(b=>b!==a&&a.b.clone().expandByScalar(0.02).intersectsBox(b.b))); if(touch.length<2) continue;
    const v=new THREE.Vector3(), fs=touch.map(it=>{ const e=it.inv.elements; return (x,y,z)=>{ v.set(x,y,z).applyMatrix4(it.inv); let d;
      if(it.t==='c'){ const yy=Math.max(-0.5,Math.min(0.5,v.y)); d=Math.hypot(v.x,v.y-yy,v.z)-0.5; } else d=v.length()-1; return d*it.sc; }; });
    const f=(x,y,z)=>{ let d=fs[0](x,y,z); for(let i=1;i<fs.length;i++) d=SDF.smin(d,fs[i](x,y,z),0.05); return d; };
    const bb=touch.reduce((a,it)=>a.union(it.b),new THREE.Box3()); bb.expandByScalar(0.03);
    const key='blob|'+touch.map(it=>it.t+it.o.position.toArray().concat(it.o.scale.toArray(),it.o.rotation.toArray().slice(0,3)).map(n=>(+n).toFixed(3)).join(',')).join(';');
    const me=S(node,key,f,bb.min.toArray(),bb.max.toArray(),m,0.8); me.renderOrder=touch[0].o.renderOrder;
    for(const it of touch) node.remove(it.o);
  }
}
