// =====================================================================
//  MODELS (core) — geometry, materials, ink outlines, procedural textures.
//  Toy-style 3D: smooth lathe/capsule shapes, PBR materials. Forward = +Z, feet at y=0.
// =====================================================================
const TEAMC = [
  { main:'#2f80ed', dark:'#174a96', light:'#8cc2ff', bar:'#3c95ff', ink:'#0b2350' },
  { main:'#e5443f', dark:'#93201d', light:'#ff9f9a', bar:'#ff4b4b', ink:'#4a0b10' },
];
const PI = Math.PI, TAU = Math.PI*2;
const colr = (c,tc) => c==='T'?tc.main : c==='D'?tc.dark : c==='L'?tc.light : c;
function seeded(n){ let s=n*9301+49297; return ()=>{ s=(s*9301+49297)%233280; return s/233280; }; }

// ---------------------------------------------------------------- geometry
const GEO = {};
function roundBoxGeo(r,seg){
  const g = new THREE.BoxGeometry(1,1,1,seg,seg,seg), p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3(), inr = new THREE.Vector3();
  const h = 0.5 - r;
  for(let i=0;i<p.count;i++){
    v.fromBufferAttribute(p,i);
    inr.set(Math.max(-h,Math.min(h,v.x)),Math.max(-h,Math.min(h,v.y)),Math.max(-h,Math.min(h,v.z)));
    const d = v.clone().sub(inr).normalize();
    p.setXYZ(i, inr.x+d.x*r, inr.y+d.y*r, inr.z+d.z*r); n.setXYZ(i,d.x,d.y,d.z);
  }
  return g;
}
const lathe = (pts,seg=24) => new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);
function capsulePts(n=8){ const pts=[]; for(let i=0;i<=n;i++){ const a=-PI/2+i/n*PI/2; pts.push([Math.cos(a)*0.5,-0.5+Math.sin(a)*0.5]); } for(let i=0;i<=n;i++){ const a=i/n*PI/2; pts.push([Math.cos(a)*0.5,0.5+Math.sin(a)*0.5]); } pts[0][0]=0.0001; pts[pts.length-1][0]=0.0001; return pts; }
// average normals of vertices that share a position (removes UV-seam creases after deforming a sphere)
function smoothNormals(g){ g.computeVertexNormals(); const p=g.attributes.position, n=g.attributes.normal, map=new Map();
  for(let i=0;i<p.count;i++){ const k=Math.round(p.getX(i)*1e4)+','+Math.round(p.getY(i)*1e4)+','+Math.round(p.getZ(i)*1e4); let a=map.get(k); if(!a){ a=[0,0,0,[]]; map.set(k,a); } a[0]+=n.getX(i); a[1]+=n.getY(i); a[2]+=n.getZ(i); a[3].push(i); }
  for(const a of map.values()){ const l=Math.hypot(a[0],a[1],a[2])||1; for(const i of a[3]) n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l); } n.needsUpdate=true; return g; }
function faceGeo(){ const g=new THREE.SphereGeometry(1,30,24), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const low=Math.max(0,-y), front=Math.max(0,z);
    x*=1-0.2*Math.pow(low,1.6);                                          // narrower toward the chin
    z+=0.1*low*front*front;                                              // chin and jaw come forward
    y-=0.1*Math.pow(low,2)*(0.5+0.5*front);                              // a little longer jaw
    const ch=Math.exp(-Math.pow((y+0.22)/0.22,2))*Math.pow(front,2);     // round cheeks
    x*=1+0.06*ch; z+=0.04*ch;
    if(y>0.15) z*=1-0.04*front*(y-0.15);                                 // slightly flatter brow
    p.setXYZ(i,x,y,z); }
  return smoothNormals(g); }
function shoeGeo(){ const g=new THREE.SphereGeometry(1,16,10), p=g.attributes.position;   // rounded toe, flat sole, heel
  for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i); if(y<-0.35) y=-0.35-(y+0.35)*0.15; if(z>0){ y-=0.18*z*z*(y>0?1:0); x*=1-0.08*z; } else x*=1-0.12*(-z); p.setXYZ(i,x,y,z); }
  return smoothNormals(g); }
function geo(k){
  if(GEO[k]) return GEO[k];
  let g;
  switch(k){
    case 'sph': g=new THREE.SphereGeometry(1,22,16); break;
    case 'head': g=new THREE.SphereGeometry(1,28,20); break;
    case 'sphLo': g=new THREE.SphereGeometry(1,12,9); break;
    case 'box': g=new THREE.BoxGeometry(1,1,1); break;
    case 'rbox': g=roundBoxGeo(0.2,4); break;
    case 'rbox2': g=roundBoxGeo(0.1,3); break;
    case 'rboxS': g=roundBoxGeo(0.32,5); break;
    case 'cyl': g=new THREE.CylinderGeometry(1,1,1,24); break;
    case 'cylLo': g=new THREE.CylinderGeometry(1,1,1,10); break;
    case 'cone': g=new THREE.ConeGeometry(1,1,24); break;
    case 'cone4': g=new THREE.ConeGeometry(1,1,4); break;
    case 'tor': g=new THREE.TorusGeometry(1,0.22,12,32); break;
    case 'torThin': g=new THREE.TorusGeometry(1,0.08,8,28); break;
    case 'torHalf': g=new THREE.TorusGeometry(1,0.12,8,20,PI); break;
    case 'smile': g=new THREE.TorusGeometry(1,0.26,8,16,PI*0.8); break;
    case 'hemi': g=new THREE.SphereGeometry(1,24,12,0,TAU,0,PI/2); break;
    case 'dish': g=new THREE.SphereGeometry(1,24,8,0,TAU,0,PI/3.2); break;
    case 'ring': g=new THREE.RingGeometry(0.8,1,48); break;
    case 'circle': g=new THREE.CircleGeometry(1,40); break;
    case 'plane': g=new THREE.PlaneGeometry(1,1); break;
    case 'dodec': g=new THREE.DodecahedronGeometry(1,0); break;
    case 'oct': g=new THREE.OctahedronGeometry(1,0); break;
    case 'ico': g=new THREE.IcosahedronGeometry(1,1); break;
    case 'caps': g=lathe(capsulePts(8),18); break;                       // height 2, radius 0.5
    case 'torso': g=lathe([[0.0001,-1],[0.7,-0.97],[0.93,-0.72],[1.0,-0.32],[0.97,0.08],[1.0,0.42],[0.93,0.74],[0.62,0.95],[0.0001,1.0]],26); break;
    case 'bell': g=lathe([[0.0001,0.5],[0.6,0.5],[0.68,0.32],[0.8,0.05],[0.93,-0.3],[1.02,-0.46],[0.97,-0.5],[0.0001,-0.5]].reverse(),28); break;
    case 'shoe': g=lathe([[0.0001,-0.5],[0.85,-0.5],[1.0,-0.3],[0.95,0.1],[0.7,0.4],[0.0001,0.5]],16); break;
    case 'roof': g=lathe([[0.0001,1],[0.25,0.82],[0.55,0.45],[0.85,0.1],[1.08,-0.02],[1.0,-0.06],[0.0001,-0.06]].reverse(),24); break;
    case 'puff': g=new THREE.IcosahedronGeometry(1,2); break;
    // lower-detail variants, picked automatically by P() for small parts (keeps triangle counts phone-friendly)
    case 'sphMid': g=new THREE.SphereGeometry(1,16,11); break;
    case 'capsLo': g=lathe(capsulePts(4),10); break;
    case 'torLo': g=new THREE.TorusGeometry(1,0.22,8,18); break;
    case 'torThinLo': g=new THREE.TorusGeometry(1,0.08,6,16); break;
    case 'puffLo': g=new THREE.IcosahedronGeometry(1,1); break;
    case 'hemiLo': g=new THREE.SphereGeometry(1,12,6,0,TAU,0,PI/2); break;
    case 'face': g=faceGeo(); break;                                   // head with cheeks, jaw and chin in one smooth shell
    case 'lid': g=new THREE.SphereGeometry(1,14,6,0,TAU,0,PI*0.42); break;   // eyelid cap
    case 'limb': g=lathe([[0.0001,-1],[0.36,-0.97],[0.47,-0.85],[0.44,-0.5],[0.42,-0.05],[0.47,0.45],[0.5,0.8],[0.38,0.97],[0.0001,1]],14); break; // tapered limb, fuller at top
    case 'shoeS': g=shoeGeo(); break;
    case 'banner': g=new THREE.PlaneGeometry(1,1.45,6,8); break;
  }
  return GEO[k]=g;
}

// ---------------------------------------------------------------- materials
const MATS = {};
// Soft studio environment as a plain canvas cube map: works in every WebGL context (battle and card portraits) without PMREM.
let ENV_CUBE=null;
function envCube(){
  if(ENV_CUBE) return ENV_CUBE;
  const S=64, face=(top,bot,key)=>{ const c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,S); g.addColorStop(0,top); g.addColorStop(0.55,'#c9d3df'); g.addColorStop(0.62,'#8c8070'); g.addColorStop(1,bot); x.fillStyle=g; x.fillRect(0,0,S,S);
    if(key){ const r=x.createRadialGradient(S*0.35,S*0.28,1,S*0.35,S*0.28,S*0.45); r.addColorStop(0,'rgba(255,248,235,1)'); r.addColorStop(1,'rgba(255,248,235,0)'); x.fillStyle=r; x.fillRect(0,0,S,S); }
    return c; };
  const flat=(col)=>{ const c=document.createElement('canvas'); c.width=c.height=S; const x=c.getContext('2d'); x.fillStyle=col; x.fillRect(0,0,S,S); return c; };
  ENV_CUBE=new THREE.CubeTexture([face('#dfe8f5','#5a4f44'),face('#dfe8f5','#5a4f44'),flat('#f2f6ff'),flat('#4d4238'),face('#e6edf7','#5a4f44',true),face('#dfe8f5','#5a4f44')]);
  ENV_CUBE.needsUpdate=true; return ENV_CUBE; }
// Shader upgrade for every character/arena material: fresnel rim light, a soft highlight shoulder (bright whites keep their
// shading instead of clipping), and for skin a wrapped, warm "subsurface" falloff so faces look soft instead of plastic.
const JR_FRAG_HEAD='uniform vec3 jrRim;\nvec3 jrShoulder(vec3 c){ c*=0.86; vec3 t=max(c-0.72,0.0); return min(c,vec3(0.72))+0.28*(vec3(1.0)-exp(-t/0.28)); }\n';
function jrPatch(sh){
  sh.uniforms.jrRim={value:new THREE.Color(this.userData.jrRim||'#d6e4ff')};
  let f=sh.fragmentShader;
  f=f.replace('void main() {',JR_FRAG_HEAD+'void main() {');
  if(this.userData.jrSkin) f=f.replace('#include <lights_physical_pars_fragment>',THREE.ShaderChunk.lights_physical_pars_fragment.replace('float dotNL = saturate( dot( geometry.normal, directLight.direction ) );',
    'float jrNL = dot( geometry.normal, directLight.direction ); float dotNL = saturate( ( jrNL + 0.4 ) / 1.4 );\n\treflectedLight.directDiffuse += directLight.color * material.diffuseColor * vec3( 0.22, 0.05, 0.03 ) * smoothstep( -0.5, 0.15, jrNL ) * ( 1.0 - smoothstep( 0.15, 0.75, jrNL ) );'));
  f=f.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',
    'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\tfloat jrF = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 3.0 );\n\toutgoingLight += jrRim * jrF * ( 0.1 + 0.35 * diffuseColor.rgb );\n\toutgoingLight = jrShoulder( outgoingLight );');
  sh.fragmentShader=f; }
function jrKey(){ return 'jr'+(this.userData.jrSkin?1:0); }
function mat(c,o){
  const key = c + (o ? '|'+(o.e||0)+'|'+(o.op??1)+'|'+(o.s??'')+'|'+(o.flat?1:0)+'|'+(o.basic?1:0)+'|'+(o.m||0)+'|'+(o.map?o.map.uuid:'')+'|'+(o.side||0)+'|'+(o.skin?1:0)+'|'+(o.bump?o.bump.uuid:'') : '');
  if(MATS[key]) return MATS[key];
  let m;
  const op=o&&o.op!=null?o.op:1;
  if(o && o.basic) m = new THREE.MeshBasicMaterial({color:c, transparent:op<1, opacity:op, depthWrite:op>=1, map:o.map||null, side:o.side||THREE.FrontSide});
  else {
    const s=o&&o.s!=null?o.s:30;
    const rough = s>=120?0.24 : s>=80?0.36 : s>=45?0.5 : s<=12?0.92 : 0.68;
    m = new THREE.MeshStandardMaterial({color:c, roughness:rough, metalness:o&&o.m?o.m:0, map:o&&o.map||null,
      emissive: o&&o.e ? new THREE.Color(c) : new THREE.Color(0), emissiveIntensity: o&&o.e||0,
      transparent: op<1, opacity: op, flatShading: !!(o&&o.flat), depthWrite: op>=1, side:o&&o.side||THREE.FrontSide});
    m.envMap=envCube(); m.envMapIntensity=o&&o.m?1.1:o&&o.skin?0.3:0.38;
    if(o&&o.bump){ m.bumpMap=o.bump; m.bumpScale=o.bs||0.012; }
    if(o&&o.skin){ m.userData.jrSkin=true; m.userData.jrRim='#ffc9a8'; m.roughness=0.62; }
    m.onBeforeCompile=jrPatch; m.customProgramCacheKey=jrKey;
  }
  return MATS[key]=m;
}
const metal = (c='#c9d1db') => mat(c,{s:120,m:0.7});
const gold = () => mat('#ffcf3a',{s:120,m:0.8,e:0.05});
const LOD_SWAP={sph:[[0.055,'sphLo'],[0.13,'sphMid']],head:[[0.1,'sphMid']],caps:[[0.09,'capsLo']],tor:[[0.11,'torLo']],torThin:[[0.11,'torThinLo']],puff:[[0.085,'puffLo']],hemi:[[0.07,'hemiLo']],cyl:[[0.035,'cylLo']]};
function P(parent,g,m,sx,sy,sz,x=0,y=0,z=0,rx=0,ry=0,rz=0){
  const sw=LOD_SWAP[g]; if(sw){ const sc=Math.max(Math.abs(sx),g==='cyl'?0:Math.abs(sy),Math.abs(sz)); for(const [lim,alt] of sw) if(sc<lim){ g=alt; break; } }
  const me = new THREE.Mesh(geo(g), m); me.scale.set(sx,sy,sz); me.position.set(x,y,z); me.rotation.set(rx,ry,rz); parent.add(me); return me;
}
const G0 = () => new THREE.Group();

// ---------------------------------------------------------------- ink outlines (inverted hull, view-space push so thickness stays even)
const OUTLINE_MATS = {};
const QUALITY = { outlines:true, shadows:true };
function outlineMat(color){
  if(OUTLINE_MATS[color]) return OUTLINE_MATS[color];
  return OUTLINE_MATS[color]=new THREE.ShaderMaterial({
    uniforms:{col:{value:new THREE.Color(color)},thick:{value:0.024}},
    vertexShader:'uniform float thick; void main(){ vec3 n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); mv.xyz+=n*clamp(thick*(-mv.z)/42.0,0.005,thick); gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform vec3 col; void main(){ gl_FragColor=vec4(col,1.0); }',
    side:THREE.BackSide });
}
function addOutlines(root,color,minR=0.045){
  const om=outlineMat(color), list=[];
  root.traverse(o=>{ if(o.isMesh && !o.userData.noOutline && !o.material.transparent && o.material.type!=='ShaderMaterial'){ if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const s=Math.max(o.scale.x,o.scale.y,o.scale.z); if(o.geometry.boundingSphere.radius*s>minR) list.push(o); } });
  for(const o of list){ const ol=new THREE.Mesh(o.geometry,om); ol.userData.isOutline=true; ol.userData.noOutline=true; ol.castShadow=false; o.add(ol); }
}
function setShadows(root,cast,receive){ root.traverse(o=>{ if(o.isMesh && !o.userData.isOutline && !o.material.transparent){ o.castShadow=cast; o.receiveShadow=receive; } }); }

// ---------------------------------------------------------------- procedural textures
function texCanvas(w,h,draw,rep){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(rep) t.repeat.set(rep[0],rep[1]); t.anisotropy=4; return t; }
const TEX={};
// fine fabric weave (bump), hair strands (colour + bump), wood grain, brushed metal, tyre tread: tiny tiling canvases shared by every model
function fabricTex(){ return TEX.fabric||(TEX.fabric=texCanvas(64,64,(x,w,h)=>{ const r=seeded(11); x.fillStyle='#808080'; x.fillRect(0,0,w,h);
  for(let j=0;j<h;j+=2) for(let i=0;i<w;i+=2){ const v=((i+j)>>1)%2?150:105; const n=v+(r()*24-12)|0; x.fillStyle=`rgb(${n},${n},${n})`; x.fillRect(i,j,2,2); } },[10,10])); }
function hairTex(){ return TEX.hair||(TEX.hair=texCanvas(128,64,(x,w,h)=>{ const r=seeded(23); x.fillStyle='#d8d8d8'; x.fillRect(0,0,w,h);
  for(let i=0;i<260;i++){ const X=r()*w, c=170+r()*85|0; x.strokeStyle=`rgba(${c},${c},${c},0.9)`; x.lineWidth=0.6+r()*1.4; x.beginPath(); x.moveTo(X,0); x.bezierCurveTo(X+r()*6-3,h*0.35,X+r()*6-3,h*0.7,X+r()*8-4,h); x.stroke(); } },[3,1])); }
function grainTex(){ return TEX.grain||(TEX.grain=texCanvas(128,128,(x,w,h)=>{ const r=seeded(5); x.fillStyle='#b8b8b8'; x.fillRect(0,0,w,h);
  for(let i=0;i<70;i++){ const y=r()*h, c=140+r()*90|0; x.strokeStyle=`rgba(${c},${c},${c},0.8)`; x.lineWidth=0.8+r()*2.2; x.beginPath(); x.moveTo(0,y); for(let X=0;X<=w;X+=16) x.lineTo(X,y+Math.sin(X*0.07+i)*3); x.stroke(); } },[2,2])); }
function brushedTex(){ return TEX.brushed||(TEX.brushed=texCanvas(64,64,(x,w,h)=>{ const r=seeded(9); x.fillStyle='#c0c0c0'; x.fillRect(0,0,w,h); for(let i=0;i<200;i++){ const c=150+r()*100|0; x.fillStyle=`rgb(${c},${c},${c})`; x.fillRect(0,r()*h,w,0.6+r()); } },[3,3])); }
function treadTex(){ return TEX.tread||(TEX.tread=texCanvas(64,64,(x,w,h)=>{ x.fillStyle='#2a2a2e'; x.fillRect(0,0,w,h); x.fillStyle='#0e0e10'; for(let i=0;i<8;i++){ x.save(); x.translate(i*8,0); x.beginPath(); x.moveTo(0,0); x.lineTo(5,0); x.lineTo(2,h/2); x.lineTo(5,h); x.lineTo(0,h); x.lineTo(-3,h/2); x.closePath(); x.fill(); x.restore(); } },[6,1])); }
function shade(hex,k){ const c=new THREE.Color(hex); c.r=Math.min(1,c.r*k); c.g=Math.min(1,c.g*k); c.b=Math.min(1,c.b*k); return '#'+c.getHexString(); }
function rrect(x,X,Y,W,H,R){ x.beginPath(); x.moveTo(X+R,Y); x.arcTo(X+W,Y,X+W,Y+H,R); x.arcTo(X+W,Y+H,X,Y+H,R); x.arcTo(X,Y+H,X,Y,R); x.arcTo(X,Y,X+W,Y,R); x.closePath(); }
function stoneTex(col){
  const key='stone'+col; if(TEX[key]) return TEX[key];
  return TEX[key]=texCanvas(256,256,(x,w,h)=>{
    const r=seeded(col.charCodeAt(1)*7+col.charCodeAt(3));
    x.fillStyle=shade(col,0.66); x.fillRect(0,0,w,h);
    const rows=6, bh=h/rows;
    for(let j=0;j<rows;j++){ const off=(j%2)*0.5, n=3; for(let i=-1;i<=n;i++){ const bw=w/n, bx=(i+off)*bw;
      const k=0.86+r()*0.24; const pad=3;
      const g=x.createLinearGradient(0,j*bh,0,j*bh+bh); g.addColorStop(0,shade(col,k*1.08)); g.addColorStop(1,shade(col,k*0.9));
      x.fillStyle=g; rrect(x,bx+pad,j*bh+pad,bw-pad*2,bh-pad*2,8); x.fill();
      x.fillStyle='rgba(255,255,255,0.22)'; x.fillRect(bx+pad+5,j*bh+pad+2,bw-pad*2-10,2.5);
    } }
    x.globalAlpha=0.08; for(let i=0;i<1400;i++){ x.fillStyle=r()<0.5?'#000':'#fff'; x.fillRect(r()*w,r()*h,2,2); } x.globalAlpha=1;
  });
}
function shingleTex(col){
  const key='sh'+col; if(TEX[key]) return TEX[key];
  return TEX[key]=texCanvas(128,128,(x,w,h)=>{
    x.fillStyle=shade(col,0.62); x.fillRect(0,0,w,h);
    for(let j=0;j<9;j++) for(let i=-1;i<10;i++){ const cx=(i+(j%2)*0.5)*14, cy=j*14-4; x.fillStyle=shade(col,0.82+((i*7+j*3)%5)*0.06); x.beginPath(); x.arc(cx+7,cy+6,8,0,PI); x.fill(); x.strokeStyle='rgba(0,0,0,.22)'; x.lineWidth=1.4; x.stroke(); }
  },[4,1]);
}
function bannerTex(team,emoji,trim){
  const key='bn'+team+emoji+trim; if(TEX[key]) return TEX[key];
  const tc=TEAMC[team];
  const t=texCanvas(128,186,(x,w,h)=>{
    const g=x.createLinearGradient(0,0,w,0); g.addColorStop(0,tc.dark); g.addColorStop(0.5,tc.main); g.addColorStop(1,tc.dark);
    x.fillStyle=g; x.beginPath(); x.moveTo(0,0); x.lineTo(w,0); x.lineTo(w,h*0.8); x.lineTo(w/2,h); x.lineTo(0,h*0.8); x.closePath(); x.fill();
    x.strokeStyle=trim; x.lineWidth=8; x.stroke();
    x.fillStyle='rgba(255,255,255,0.16)'; x.beginPath(); x.arc(w/2,h*0.43,34,0,TAU); x.fill();
    x.font='58px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(emoji,w/2,h*0.44);
  });
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; return TEX[key]=t;
}
function screenTex(kind){
  const key='scr'+kind; if(TEX[key]) return TEX[key];
  return TEX[key]=texCanvas(128,80,(x,w,h)=>{
    x.fillStyle='#061410'; x.fillRect(0,0,w,h);
    x.strokeStyle='rgba(57,255,106,.22)'; x.lineWidth=1; for(let i=0;i<w;i+=16){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,h); x.stroke(); }
    const r=seeded(kind.length+5); x.strokeStyle=kind==='down'?'#ff4040':'#39ff6a'; x.lineWidth=4; x.beginPath(); let y=kind==='down'?16:64; x.moveTo(4,y);
    for(let i=1;i<12;i++){ y+=(kind==='down'?1:-1)*(r()*10-3); y=Math.max(8,Math.min(h-8,y)); x.lineTo(4+i*11,y); } x.stroke();
  });
}
function labelTex(text,bg,fg){
  const key='lb'+text+bg; if(TEX[key]) return TEX[key];
  const t=texCanvas(256,64,(x,w,h)=>{ x.fillStyle=bg; rrect(x,2,2,w-4,h-4,14); x.fill(); x.fillStyle=fg; x.font='bold 34px "Trebuchet MS",sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText(text,w/2,h/2+2); });
  t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; return TEX[key]=t;
}
