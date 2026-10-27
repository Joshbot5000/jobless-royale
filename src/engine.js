// =====================================================================
//  ENGINE — renderer, camera framing, arena construction, particles, rings, decals
// =====================================================================
let renderer, scene, camera, hemiLight, dirLight, ambLight;
let arenaRoot=null, dynRoot, riverTex=null, riverMat=null, themeAnim=[];
let PSN, PSA;                     // particle systems: normal + additive
const ringPool=[], decalPool=[];
let shadowMat;
const raycaster = new THREE.Raycaster(), groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
const _v3 = new THREE.Vector3();

function init3D(canvas){
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
  renderer.shadowMap.enabled = QUALITY.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(36, 1, 0.5, 500);
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.62); scene.add(hemiLight);
  dirLight = new THREE.DirectionalLight(0xfff1dc, 1.05); dirLight.position.set(-6,30,30); scene.add(dirLight);
  dirLight.target.position.set(9,0,16); scene.add(dirLight.target);
  dirLight.castShadow = QUALITY.shadows;
  const sc0=dirLight.shadow.camera; sc0.left=-20; sc0.right=20; sc0.top=24; sc0.bottom=-24; sc0.near=5; sc0.far=90;
  dirLight.shadow.mapSize.set(2048,2048); dirLight.shadow.bias=-0.0006; dirLight.shadow.normalBias=0.035;
  const rim = new THREE.DirectionalLight(0xc8dcff, 0.45); rim.position.set(14,12,-22); scene.add(rim);
  ambLight = new THREE.AmbientLight(0xffffff, 0.16); scene.add(ambLight);
  dynRoot = new THREE.Group(); scene.add(dynRoot);
  // blob contact-shadow texture
  const sc=document.createElement('canvas'); sc.width=sc.height=64; const x=sc.getContext('2d');
  const gr=x.createRadialGradient(32,32,2,32,32,31); gr.addColorStop(0,'rgba(0,0,0,0.5)'); gr.addColorStop(0.55,'rgba(0,0,0,0.25)'); gr.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=gr; x.fillRect(0,0,64,64);
  shadowMat = new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc), transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, opacity:0.75});
  PSN = new Particles(1500,false); PSA = new Particles(1500,true);
  scene.add(PSN.points); scene.add(PSA.points);
  for(let i=0;i<48;i++){ const m=new THREE.Mesh(geo('ring'), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,side:THREE.DoubleSide})); m.rotation.x=-PI/2; m.visible=false; m.renderOrder=2; scene.add(m); ringPool.push({m,life:0}); }
  for(let i=0;i<60;i++){ const m=new THREE.Mesh(geo('circle'), new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})); m.rotation.x=-PI/2; m.visible=false; m.renderOrder=1; scene.add(m); decalPool.push({m,life:0}); }
}
function applyQuality(){
  renderer.shadowMap.enabled=QUALITY.shadows; dirLight.castShadow=QUALITY.shadows;
  scene.traverse(o=>{ if(o.material&&o.material.needsUpdate!==undefined) o.material.needsUpdate=true; });
  clearModelCache();
}

// ---------------------------------------------------------------- particles
class Particles{
  constructor(n,additive){
    this.n=n; this.i=0;
    this.pos=new Float32Array(n*3); this.col=new Float32Array(n*4); this.size=new Float32Array(n);
    this.vel=new Float32Array(n*3); this.life=new Float32Array(n); this.max=new Float32Array(n).fill(1); this.grav=new Float32Array(n); this.sz0=new Float32Array(n); this.a0=new Float32Array(n); this.grow=new Float32Array(n); this.drag=new Float32Array(n);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(this.pos,3));
    g.setAttribute('pcol',new THREE.BufferAttribute(this.col,4));
    g.setAttribute('size',new THREE.BufferAttribute(this.size,1));
    this.geo=g;
    this.mat=new THREE.ShaderMaterial({
      uniforms:{scale:{value:600}},
      vertexShader:'attribute float size;attribute vec4 pcol;varying vec4 vC;uniform float scale;void main(){vC=pcol;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*scale/max(0.1,-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader: additive
        ? 'varying vec4 vC;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d);if(r>0.5)discard;float a=pow(1.0-r*2.0,1.6);gl_FragColor=vec4(vC.rgb*a*vC.a,1.0);}'
        : 'varying vec4 vC;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d);if(r>0.5)discard;float a=smoothstep(0.5,0.36,r);float sh=0.82+0.35*(0.5-d.y-d.x*0.4);gl_FragColor=vec4(vC.rgb*sh,vC.a*a);}',
      transparent:true, depthWrite:false, blending: additive?THREE.AdditiveBlending:THREE.NormalBlending });
    this.points=new THREE.Points(g,this.mat); this.points.frustumCulled=false; this.points.renderOrder=5;
  }
  spawn(x,y,z,vx,vy,vz,life,size,color,a=1,grav=0,grow=0,drag=0){
    const i=this.i; this.i=(this.i+1)%this.n;
    this.pos[i*3]=x; this.pos[i*3+1]=y; this.pos[i*3+2]=z;
    this.vel[i*3]=vx; this.vel[i*3+1]=vy; this.vel[i*3+2]=vz;
    const c=_col.set(color); this.col[i*4]=c.r; this.col[i*4+1]=c.g; this.col[i*4+2]=c.b; this.col[i*4+3]=a;
    this.life[i]=life; this.max[i]=life; this.sz0[i]=size; this.size[i]=size; this.a0[i]=a; this.grav[i]=grav; this.grow[i]=grow; this.drag[i]=drag;
  }
  update(dt){
    const p=this.pos,v=this.vel;
    for(let i=0;i<this.n;i++){
      if(this.life[i]<=0){ if(this.size[i]!==0){ this.size[i]=0; this.col[i*4+3]=0; } continue; }
      this.life[i]-=dt;
      const k=Math.max(0,this.life[i]/this.max[i]);
      v[i*3+1]-=this.grav[i]*dt;
      if(this.drag[i]){ const f=Math.exp(-this.drag[i]*dt); v[i*3]*=f; v[i*3+1]*=f; v[i*3+2]*=f; }
      p[i*3]+=v[i*3]*dt; p[i*3+1]+=v[i*3+1]*dt; p[i*3+2]+=v[i*3+2]*dt;
      if(p[i*3+1]<0.02 && this.grav[i]>0){ p[i*3+1]=0.02; v[i*3+1]*=-0.35; v[i*3]*=0.6; v[i*3+2]*=0.6; }
      this.size[i]=this.sz0[i]*(1+this.grow[i]*(1-k));
      this.col[i*4+3]=this.a0[i]*Math.min(1,k*2.2);
    }
    this.geo.attributes.position.needsUpdate=true; this.geo.attributes.pcol.needsUpdate=true; this.geo.attributes.size.needsUpdate=true;
  }
  clear(){ this.life.fill(0); }
}
const _col = new THREE.Color();

// effect helpers (world coords: x, height y, z)
function fxBurst(x,y,z,n,color,speed=3,size=0.18,life=0.6,grav=9,add=false){
  const ps=add?PSA:PSN;
  for(let i=0;i<n;i++){ const a=Math.random()*TAU, s=speed*(0.4+Math.random()*0.8); ps.spawn(x,y,z,Math.cos(a)*s,speed*(0.5+Math.random()),Math.sin(a)*s,life*(0.6+Math.random()*0.6),size*(0.6+Math.random()*0.8),color,1,grav,0,1); }
}
function fxPuff(x,y,z,n,color,size=0.5,life=0.6,add=false){
  const ps=add?PSA:PSN;
  for(let i=0;i<n;i++){ const a=Math.random()*TAU, s=0.6+Math.random()*1.4; ps.spawn(x+Math.cos(a)*0.2,y,z+Math.sin(a)*0.2,Math.cos(a)*s,0.4+Math.random()*0.8,Math.sin(a)*s,life*(0.7+Math.random()*0.6),size*(0.6+Math.random()*0.6),color,0.8,0,1.2,2.5); }
}
function fxRing(x,z,r0,r1,life,color,y=0.07){
  const r=ringPool.find(q=>q.life<=0)||ringPool[0];
  r.life=life; r.max=life; r.r0=r0; r.r1=r1; r.m.material.color.set(color); r.m.position.set(x,y,z); r.m.visible=true;
}
function fxDecal(x,z,r,color,life,op=0.5,y=0.03){
  const d=decalPool.find(q=>q.life<=0)||decalPool[0];
  d.life=life; d.max=life; d.op=op; d.m.material.color.set(color); d.m.material.opacity=op; d.m.scale.set(r,r,1); d.m.position.set(x,y,z); d.m.visible=true;
  return d;
}
function updateFx3(dt){
  PSN.update(dt); PSA.update(dt);
  for(const r of ringPool){ if(r.life<=0){ r.m.visible=false; continue; } r.life-=dt; const k=1-Math.max(0,r.life/r.max); const s=r.r0+(r.r1-r.r0)*(1-Math.pow(1-k,2)); r.m.scale.set(s,s,1); r.m.material.opacity=Math.max(0,1-k)*0.95; }
  for(const d of decalPool){ if(d.life<=0){ d.m.visible=false; continue; } d.life-=dt; d.m.material.opacity=d.op*Math.min(1,d.life/Math.min(0.5,d.max)); }
}
function clearFx3(){ PSN.clear(); PSA.clear(); for(const r of ringPool){ r.life=0; r.m.visible=false; } for(const d of decalPool){ d.life=0; d.m.visible=false; } }

// ---------------------------------------------------------------- arena
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); return t; }
function groundTex(th,z0,z1){
  const S=40, w=18*S, h=(z1-z0)*S;
  return canvasTex(w,h,(x)=>{
    const r=seeded(z0*13+th.id.length);
    const [ga,gb]=th.ground;
    const tile=(fn)=>{ for(let ty=0;ty<z1-z0;ty++) for(let tx=0;tx<18;tx++) fn(tx,ty,(tx+ty+z0)%2); };
    switch(th.id){
      case 'law': tile((tx,ty,o)=>{ x.fillStyle=o?ga:gb; x.fillRect(tx*S,ty*S,S,S); });
        x.strokeStyle='rgba(120,100,80,0.18)'; x.lineWidth=1.2; for(let i=0;i<40;i++){ x.beginPath(); let px=r()*w, py=r()*h; x.moveTo(px,py); for(let k=0;k<5;k++){ px+=r()*30-15; py+=r()*30-15; x.lineTo(px,py);} x.stroke(); } break;
      case 'finance': tile((tx,ty,o)=>{ x.fillStyle=o?ga:gb; x.fillRect(tx*S,ty*S,S,S); }); x.strokeStyle='rgba(224,180,64,0.35)'; x.lineWidth=2; for(let i=0;i<=18;i+=3){ x.beginPath(); x.moveTo(i*S,0); x.lineTo(i*S,h); x.stroke(); } break;
      case 'space': x.fillStyle=ga; x.fillRect(0,0,w,h); for(let i=0;i<2500;i++){ x.fillStyle=r()<0.5?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.08)'; x.fillRect(r()*w,r()*h,2+r()*3,2+r()*3); }
        for(let i=0;i<9;i++){ const cx=r()*w, cy=r()*h, rr=8+r()*22; x.strokeStyle='rgba(0,0,0,0.18)'; x.lineWidth=4; x.beginPath(); x.arc(cx,cy,rr,0,TAU); x.stroke(); x.fillStyle='rgba(0,0,0,0.08)'; x.fill(); x.strokeStyle='rgba(255,255,255,0.18)'; x.lineWidth=2; x.beginPath(); x.arc(cx,cy-2,rr,PI*1.1,PI*1.9); x.stroke(); } break;
      case 'fbi': x.fillStyle=ga; x.fillRect(0,0,w,h); for(let i=0;i<4000;i++){ x.fillStyle=r()<0.5?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.06)'; x.fillRect(r()*w,r()*h,2,2); }
        x.strokeStyle='rgba(255,255,255,0.45)'; x.lineWidth=3; x.setLineDash([18,14]); x.beginPath(); x.moveTo(9*S,0); x.lineTo(9*S,h); x.stroke(); x.setLineDash([]); break;
      case 'build': x.fillStyle=ga; x.fillRect(0,0,w,h); for(let i=0;i<3500;i++){ x.fillStyle=['rgba(90,60,30,0.15)','rgba(255,240,200,0.12)','rgba(120,110,100,0.25)'][i%3]; const s=2+r()*4; x.beginPath(); x.arc(r()*w,r()*h,s/2,0,TAU); x.fill(); }
        x.strokeStyle='rgba(80,55,30,0.18)'; x.lineWidth=10; for(const tx of [6.2,11.8]){ x.beginPath(); x.moveTo(tx*S,0); x.bezierCurveTo((tx+1)*S,h*0.3,(tx-1)*S,h*0.7,tx*S,h); x.stroke(); } break;
      case 'rock': for(let ty=0;ty<(z1-z0)*2;ty++){ x.fillStyle=ty%2?ga:gb; x.fillRect(0,ty*S/2,w,S/2); x.fillStyle='rgba(0,0,0,0.3)'; x.fillRect(0,ty*S/2,w,1.5); for(let i=0;i<4;i++){ x.fillRect(((ty*37+i*190)%w),ty*S/2,1.5,S/2); } }
        x.strokeStyle='rgba(255,61,206,0.18)'; x.lineWidth=2; for(let i=0;i<=18;i+=2){ x.beginPath(); x.moveTo(i*S,0); x.lineTo(i*S,h); x.stroke(); } break;
      case 'fire': for(let ty=0;ty<(z1-z0)*2;ty++) for(let tx=-1;tx<18;tx++){ const off=(ty%2)*S/2; x.fillStyle=((tx+ty)%3)?ga:gb; x.fillRect(tx*S+off+1,ty*S/2+1,S-2,S/2-2); } x.fillStyle='rgba(0,0,0,0.25)'; break;
      case 'dog': tile((tx,ty,o)=>{ x.fillStyle=o?ga:gb; x.fillRect(tx*S,ty*S,S,S); });
        for(let i=0;i<5000;i++){ const px=r()*w, py=r()*h; x.strokeStyle=r()<0.5?'rgba(40,110,30,0.35)':'rgba(180,240,120,0.3)'; x.lineWidth=1.2; x.beginPath(); x.moveTo(px,py); x.lineTo(px+r()*3-1.5,py-3-r()*4); x.stroke(); }
        for(let i=0;i<70;i++){ const px=r()*w, py=r()*h, col=['#ffffff','#ffe14d','#ff8fc4'][i%3]; for(let k=0;k<5;k++){ x.fillStyle=col; x.beginPath(); x.arc(px+Math.cos(k*1.26)*3,py+Math.sin(k*1.26)*3,2.2,0,TAU); x.fill(); } x.fillStyle='#ffcf3d'; x.beginPath(); x.arc(px,py,1.8,0,TAU); x.fill(); } break;
      case 'sports': for(let ty=0;ty<(z1-z0);ty++){ x.fillStyle=(ty+z0)%2?ga:gb; x.fillRect(0,ty*S,w,S); }
        x.strokeStyle='rgba(255,255,255,0.75)'; x.lineWidth=4; x.strokeRect(1.4*S,(z0===0?1.4:0)*S-(z0===0?0:4),15.2*S,(z1-z0)*S-(z0===0?1.4*S:1.4*S)+(z0===0?4:4));
        x.beginPath(); x.arc(9*S,(16-z0)*S,2.6*S,0,TAU); x.stroke(); x.strokeRect(6*S,(z0===0?1.4:28.6-z0)*S,6*S,(z0===0?2.6:2.0)*S); break;
      case 'art': x.fillStyle=gb; x.fillRect(0,0,w,h);
        for(let ty=-1;ty<=(z1-z0)*2;ty++) for(let tx=-1;tx<=18;tx++){ const k=(tx+ty)%2===0; x.fillStyle=shade(((tx*7+ty*3)%3)?ga:gb,0.94+((tx*5+ty*11)%7)*0.02); x.save(); x.translate(tx*S+S/2,ty*S/2+S/4); x.rotate(k?PI/4:-PI/4); x.fillRect(-S*0.5,-S*0.17,S,S*0.34); x.strokeStyle='rgba(60,30,10,0.25)'; x.lineWidth=1.5; x.strokeRect(-S*0.5,-S*0.17,S,S*0.34); x.restore(); }
        for(let i=0;i<16;i++){ const px=r()*w, py=r()*h; x.fillStyle=['rgba(255,61,206,.4)','rgba(61,214,255,.4)','rgba(255,211,77,.45)','rgba(57,211,83,.38)'][i%4]; for(let k=0;k<5;k++){ x.beginPath(); x.arc(px+(r()-0.5)*22,py+(r()-0.5)*22,3+r()*7,0,TAU); x.fill(); } } break;
      case 'film': x.fillStyle=ga; x.fillRect(0,0,w,h); for(let i=0;i<3000;i++){ x.fillStyle=r()<0.5?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.05)'; x.fillRect(r()*w,r()*h,2,2); }
        x.strokeStyle='rgba(255,211,77,0.7)'; x.lineWidth=5; for(let i=0;i<14;i++){ const px=r()*w, py=r()*h; x.beginPath(); x.moveTo(px-10,py); x.lineTo(px+10,py); x.moveTo(px,py-10); x.lineTo(px,py+10); x.stroke(); }
        x.fillStyle='rgba(255,255,255,0.05)'; for(let i=0;i<4;i++){ x.beginPath(); x.arc(r()*w,r()*h,70+r()*50,0,TAU); x.fill(); } break;
      case 'influencer': tile((tx,ty,o)=>{ x.fillStyle=o?ga:gb; x.fillRect(tx*S,ty*S,S,S); });
        x.font=`${S*0.42}px sans-serif`; x.textAlign='center'; x.textBaseline='middle'; x.globalAlpha=0.35; for(let ty=0;ty<z1-z0;ty++) for(let tx=0;tx<18;tx++) if((tx+ty)%3===0) x.fillText(['♥','★','✦'][(tx+ty)%3===0?(tx%3):0],tx*S+S/2,ty*S+S/2); x.globalAlpha=1; break;
      case 'zoo': tile((tx,ty,o)=>{ x.fillStyle=o?ga:gb; x.fillRect(tx*S,ty*S,S,S); });
        for(let i=0;i<4000;i++){ const px=r()*w, py=r()*h; x.strokeStyle=r()<0.5?'rgba(60,120,30,0.35)':'rgba(200,240,140,0.3)'; x.lineWidth=1.2; x.beginPath(); x.moveTo(px,py); x.lineTo(px+r()*3-1.5,py-3-r()*4); x.stroke(); }
        for(let i=0;i<10;i++){ const px=r()*w, py=r()*h; x.fillStyle='rgba(150,110,60,0.35)'; x.beginPath(); x.ellipse(px,py,20+r()*30,10+r()*16,r()*3,0,TAU); x.fill(); }
        x.fillStyle='rgba(90,60,30,0.3)'; for(let i=0;i<30;i++){ const px=r()*w, py=r()*h; for(const [dx,dy] of [[0,0],[-5,-7],[0,-9],[5,-7]]){ x.beginPath(); x.arc(px+dx,py+dy,dx||dy?2:4,0,TAU); x.fill(); } } break;
      default: tile((tx,ty,o)=>{ x.fillStyle=o?ga:gb; x.fillRect(tx*S,ty*S,S,S); x.fillStyle='rgba(255,255,255,0.12)'; x.fillRect(tx*S+2,ty*S+2,S-4,3); });
        x.strokeStyle='rgba(0,0,0,0.14)'; x.lineWidth=2; for(let i=0;i<=18;i++){ x.beginPath(); x.moveTo(i*S,0); x.lineTo(i*S,h); x.stroke(); } for(let j=0;j<=z1-z0;j++){ x.beginPath(); x.moveTo(0,j*S); x.lineTo(w,j*S); x.stroke(); }
    }
    x.globalAlpha=0.05; for(let i=0;i<800;i++){ x.fillStyle=r()<0.5?'#000':'#fff'; x.fillRect(r()*w,r()*h,2+r()*3,2+r()*3); } x.globalAlpha=1;
    const rr=(X,Y,W,H,R)=>rrect(x,X,Y,W,H,R);
    // lane paths with cobbles
    x.save(); x.globalAlpha=th.id==='law'?0.95:0.85; x.fillStyle=th.path;
    for(const bx of [3.5,14.5]){ rr((bx-0.85)*S,(4.5-z0)*S,1.7*S,23*S,0.8*S); x.fill(); }
    rr(3.5*S,(2.6-z0)*S,11*S,1*S,0.5*S); x.fill(); rr(3.5*S,(28.4-z0)*S,11*S,1*S,0.5*S); x.fill();
    x.restore();
    if(!['law','fbi','rock','sports','art','film','influencer'].includes(th.id)){ x.save(); for(const bx of [3.5,14.5]){ rr((bx-0.85)*S,(4.5-z0)*S,1.7*S,23*S,0.8*S); x.clip(); }
      for(let i=0;i<900;i++){ const px=(r()<0.5?3.5:14.5)*S+(r()-0.5)*1.6*S, py=r()*h; x.fillStyle=r()<0.5?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.14)'; x.beginPath(); x.ellipse(px,py,3+r()*4,2+r()*3,r()*3,0,TAU); x.fill(); } x.restore(); }
    x.strokeStyle='rgba(0,0,0,0.18)'; x.lineWidth=3; for(const bx of [3.5,14.5]){ rr((bx-0.85)*S,(4.5-z0)*S,1.7*S,23*S,0.8*S); x.stroke(); }
    if(th.id==='law'){ x.strokeStyle='#d9b44a'; x.lineWidth=4; for(const bx of [3.5,14.5]){ rr((bx-0.78)*S,(4.6-z0)*S,1.56*S,22.8*S,0.7*S); x.stroke(); } }
    // tower pads (stone slabs)
    const pad=(cx,cz,s)=>{ x.fillStyle=th.pad; rr((cx-s)*S,(cz-s-z0)*S,s*2*S,s*2*S,0.5*S); x.fill(); x.strokeStyle='rgba(0,0,0,0.22)'; x.lineWidth=4; x.stroke();
      x.strokeStyle='rgba(0,0,0,0.1)'; x.lineWidth=2; for(let i=1;i<4;i++){ x.beginPath(); x.moveTo((cx-s)*S+i*s*S/2,(cz-s-z0)*S); x.lineTo((cx-s)*S+i*s*S/2,(cz+s-z0)*S); x.stroke(); x.beginPath(); x.moveTo((cx-s)*S,(cz-s-z0)*S+i*s*S/2); x.lineTo((cx+s)*S,(cz-s-z0)*S+i*s*S/2); x.stroke(); } };
    pad(3.5,6.5,1.7); pad(14.5,6.5,1.7); pad(9,3,2.2); pad(3.5,25.5,1.7); pad(14.5,25.5,1.7); pad(9,29,2.2);
    // ambient occlusion along walls and river banks
    const ao=(x0,y0,x1,y1)=>{ const g=x.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,'rgba(0,0,0,0.32)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; };
    ao(0,0,S*0.8,0); x.fillRect(0,0,S*0.8,h); ao(w,0,w-S*0.8,0); x.fillRect(w-S*0.8,0,S*0.8,h);
    if(z0===0){ ao(0,0,0,S*0.8); x.fillRect(0,0,w,S*0.8); ao(0,h,0,h-S*0.7); x.fillRect(0,h-S*0.7,w,S*0.7); }
    else { ao(0,0,0,S*0.7); x.fillRect(0,0,w,S*0.7); ao(0,h,0,h-S*0.8); x.fillRect(0,h-S*0.8,w,S*0.8); }
  });
}
const RIVER_KIND={water:0,pond:0,lava:1,void:2,neon:3,gold:4,acid:5,soup:5,laser:6,cement:7,ink:8,pool:9,paint:10,film:11};
function riverMaterial(rv){
  return new THREE.ShaderMaterial({
    uniforms:{time:{value:0},colA:{value:new THREE.Color(rv.a)},colB:{value:new THREE.Color(rv.b)},kind:{value:RIVER_KIND[rv.kind]||0}},
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader:`
      uniform float time; uniform vec3 colA; uniform vec3 colB; uniform int kind; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }
      void main(){
        vec2 p=vec2(vUv.x*34.0, vUv.y*4.0);
        float edge=smoothstep(0.16,0.0,vUv.y)+smoothstep(0.84,1.0,vUv.y);
        vec3 c;
        if(kind==1){ float n=fbm(p*0.8+vec2(time*0.25,0.0)); float cr=smoothstep(0.55,0.75,n); c=mix(colA*0.55,colB,cr)+colB*0.35*pow(fbm(p*2.0-time*0.4),3.0)*2.0; c=mix(c,colA*0.4,edge*0.6); }
        else if(kind==2){ c=mix(colA,colB,fbm(p*0.4+time*0.05)*0.8); float st=step(0.985,hash(floor(p*6.0))); c+=vec3(st)*(0.6+0.4*sin(time*4.0+hash(floor(p*6.0))*30.0)); c+=colB*edge*0.8; }
        else if(kind==3){ float b=0.5+0.5*sin(p.x*0.8-time*3.0); c=mix(colA,colB,b); c*=0.75+0.5*smoothstep(0.4,0.6,fract(p.y*1.5+time)); c+=vec3(1.0)*edge*0.3; }
        else if(kind==6){ c=colA; for(int i=0;i<4;i++){ float y=0.2+float(i)*0.2+sin(p.x*0.3+time*2.0+float(i))*0.04; c+=colB*smoothstep(0.02,0.0,abs(vUv.y-y))*1.4; } }
        else if(kind==9){ float n=fbm(p*0.5+vec2(time*0.3,0.0)); c=mix(colA,colB,n*0.7); c+=vec3(0.25)*smoothstep(0.82,1.0,sin(p.x*2.0+n*6.0+time*2.0));
          for(int i=1;i<4;i++){ float y=float(i)*0.25; float rope=smoothstep(0.035,0.0,abs(vUv.y-y)); float seg=step(0.5,fract(p.x*0.6)); c=mix(c,mix(vec3(1.0,0.25,0.25),vec3(1.0),seg),rope); } }
        else if(kind==10){ float n=fbm(p*0.35+vec2(time*0.12,time*0.05)); float h=fract(n*2.2+p.x*0.03+time*0.05); c=0.6+0.4*cos(6.2831*(h+vec3(0.0,0.33,0.67))); c=mix(c,vec3(1.0),edge*0.4); }
        else if(kind==11){ c=colA; float hole=step(0.5,fract(p.x*0.9-time*1.5)); float band=step(vUv.y,0.2)+step(0.8,vUv.y); c=mix(c,vec3(0.9,0.85,0.7)*hole,band*0.85); float fr=step(0.94,fract(p.x*0.25-time*0.42)); c=mix(c,colB*0.9,(1.0-band)*(0.25+0.15*sin(p.x+time*3.0))); c=mix(c,vec3(0.0),(1.0-band)*fr); }
        else if(kind==7){ float n=fbm(p*0.6+vec2(time*0.05,0.0)); c=mix(colA,colB,n); c+=vec3(0.08)*sin(p.x*0.6+n*6.0+time*0.5); }
        else { float n=fbm(p*0.5+vec2(time*0.35,time*0.1)); c=mix(colA,colB,n);
          float w=smoothstep(0.78,1.0,sin(p.x*1.6+fbm(p+time*0.6)*5.0+time*1.6)); c+=vec3(0.22)*w;
          if(kind==4){ c+=vec3(1.0,0.95,0.6)*step(0.992,hash(floor(p*5.0+vec2(time*2.0,0.0))))*1.5; }
          if(kind==5){ float bub=smoothstep(0.08,0.0,abs(length(fract(p*1.3+vec2(0.0,time*0.4))-0.5)-0.18)); c+=vec3(0.35)*bub*step(0.6,hash(floor(p*1.3+vec2(0.0,time*0.4)))); }
          if(kind==8){ c*=0.85; }
          c=mix(c,vec3(1.0),edge*0.55*(0.6+0.4*sin(p.x*3.0+time*3.0))); }
        gl_FragColor=vec4(c,1.0);
      }`});
}
function skyTex(th){ return canvasTex(8,256,(x,w,h)=>{ const g=x.createLinearGradient(0,0,0,h); g.addColorStop(0,th.sky[0]); g.addColorStop(1,th.sky[1]); x.fillStyle=g; x.fillRect(0,0,w,h); }); }

function buildArena(th){
  if(arenaRoot){ scene.remove(arenaRoot); arenaRoot.traverse(o=>{ if(o.isMesh && o.userData.own){ o.geometry.dispose(); if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
  themeAnim=[];
  arenaRoot=new THREE.Group(); scene.add(arenaRoot);
  scene.background=skyTex(th);
  hemiLight.color.set(th.hemi[0]); hemiLight.groundColor.set(th.hemi[1]);
  const own=(m)=>{ m.userData.own=true; return m; };
  for(const [z0,z1] of [[0,15],[17,32]]){
    const m=own(new THREE.Mesh(new THREE.PlaneGeometry(18,z1-z0), new THREE.MeshStandardMaterial({map:groundTex(th,z0,z1),roughness:th.id==='kitchen'?0.6:0.85,metalness:0,color:0xe2e2e2})));
    m.rotation.x=-PI/2; m.position.set(9,0,(z0+z1)/2); m.receiveShadow=true; arenaRoot.add(m);
  }
  const ogm=new THREE.MeshStandardMaterial({color:th.outer,roughness:0.95});
  for(const [cx,cz,w,d] of [[-40.7,16,80,200],[58.7,16,80,200],[9,-40.7,18,80],[9,72.7,18,80]]){ const og=own(new THREE.Mesh(new THREE.PlaneGeometry(w,d),ogm)); og.rotation.x=-PI/2; og.position.set(cx,-0.05,cz); og.receiveShadow=true; arenaRoot.add(og); }
  // river trench with animated shader
  riverMat=riverMaterial(th.river); riverMat.userData.own=true;
  const rm=new THREE.Mesh(new THREE.PlaneGeometry(18.6,2.2),riverMat); rm.rotation.x=-PI/2; rm.position.set(9,-0.4,16); arenaRoot.add(rm);
  const bankM=mat('#ffffff',{s:15,map:stoneTex(shade(th.border,1.25))});
  for(const z of [15,17]){ const b=P(arenaRoot,'box',bankM,18,0.45,0.1,9,-0.2,z+(z===15?0.05:-0.05)); b.receiveShadow=true; }
  if(th.river.glow){ const gl=new THREE.PointLight(new THREE.Color(th.river.b),0.7,12); gl.position.set(4,1,16); arenaRoot.add(gl); const gl2=gl.clone(); gl2.position.set(14,1,16); arenaRoot.add(gl2); }
  // bridges: planks, rails, posts, lanterns
  const bm=mat(th.bridge,{s:22}), bdk=mat(shade(th.bridge,0.7),{s:15}), trim=mat(th.trim,{s:110,m:0.6});
  for(const bx of [3.5,14.5]){
    for(let i=0;i<8;i++){ const pl=P(arenaRoot,'rbox2',i%2?bm:mat(shade(th.bridge,0.9),{s:22}),2.3,0.2,0.38,bx,-0.04,14.6+i*0.4); pl.receiveShadow=true; pl.castShadow=QUALITY.shadows; }
    for(const s of [-1,1]){ const rl=P(arenaRoot,'rbox2',bdk,0.16,0.14,3.3,bx+s*1.2,0.36,16); rl.castShadow=QUALITY.shadows;
      for(const z of [14.4,16,17.6]){ const po=P(arenaRoot,'rboxS',bdk,0.26,0.62,0.26,bx+s*1.2,0.22,z); po.castShadow=QUALITY.shadows; P(arenaRoot,'sph',trim,0.1,0.1,0.1,bx+s*1.2,0.6,z); } }
  }
  // border wall: textured stone with capped posts
  const wm=mat('#ffffff',{s:15,map:stoneTex(th.border)}), wt=mat(th.borderTop,{s:45});
  const wall=(x,z,w,d)=>{ const a=P(arenaRoot,'rbox2',wm,w,0.6,d,x,0.22,z); a.receiveShadow=true; a.castShadow=QUALITY.shadows; P(arenaRoot,'rbox2',wt,w+0.08,0.12,d+0.08,x,0.55,z); };
  wall(-0.35,16,0.7,33.4); wall(18.35,16,0.7,33.4); wall(9,-0.35,19.4,0.7); wall(9,32.35,19.4,0.7);
  for(let i=0;i<=8;i++) for(const x of [-0.35,18.35]){ const z=i*4; const po=P(arenaRoot,'rboxS',wm,0.85,0.95,0.85,x,0.4,z); po.castShadow=QUALITY.shadows; P(arenaRoot,'rboxS',wt,0.95,0.14,0.95,x,0.92,z); P(arenaRoot,'sph',trim,0.14,0.14,0.14,x,1.08,z); }
  // scenery around the arena
  const r=seeded(th.id.length*17+3), dk=th.deco;
  const spots=[];
  for(let i=0;i<9;i++) spots.push([-2.4-r()*3, 1+i*3.6]);
  for(let i=0;i<9;i++) spots.push([20.4+r()*3, 1+i*3.6]);
  for(let i=0;i<7;i++) spots.push([-1+i*3.3, -2.8-r()*4]);
  for(let i=0;i<4;i++) spots.push([-6+i*10, -9-r()*4]);
  spots.forEach(([x,z],i)=>{ const d=buildDeco(dk[i%dk.length],th,r); d.position.set(x,0,z); d.rotation.y=r()*TAU; const s=0.9+r()*0.5; d.scale.setScalar(s); arenaRoot.add(d); setShadows(d,QUALITY.shadows,true); if(d.userData.flicker) themeAnim.push({k:'flicker',o:d,ph:r()*6}); });
  if(th.stars){ const n=500, pos=new Float32Array(n*3); for(let i=0;i<n;i++){ pos[i*3]=9+(r()-0.5)*160; pos[i*3+1]=5+r()*60; pos[i*3+2]=-30-r()*60; }
    const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.BufferAttribute(pos,3)); const sp=own(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:0.35}))); arenaRoot.add(sp); }
  if(th.planet){ const pl=P(arenaRoot,'sph',mat('#5a8fd6',{e:0.35}),12,12,12,-14,20,-60); P(arenaRoot,'tor',mat('#d9c38a',{e:0.3}),18,18,2,-14,20,-60,1.2,0.3); themeAnim.push({k:'spin',o:pl}); }
  if(th.spotlights){ for(let i=0;i<4;i++){ const cone=own(new THREE.Mesh(new THREE.ConeGeometry(2.2,14,24,1,true), new THREE.MeshBasicMaterial({color:['#ff3dce','#7a1cff','#3dd6ff','#ffd34d'][i],transparent:true,opacity:0.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})));
      const piv=new THREE.Group(); piv.position.set(i<2?-3:21,10,4+i*7); cone.position.y=-7; piv.add(cone); arenaRoot.add(piv); themeAnim.push({k:'sweep',o:piv,ph:i*1.7}); } }
  themeAnim.push({k:'river'});
  for(const ch of arenaRoot.children) if(ch.isGroup&&!ch.userData.flicker) mergeRigid(ch);
  mergeRigid(arenaRoot);
  arenaRoot.traverse(o=>{ if(o.isMesh&&!o.material.transparent&&o.material.type==='MeshStandardMaterial'){ o.receiveShadow=true; } });
}
function animateArena(dt,t){
  for(const a of themeAnim){
    if(a.k==='river' && riverMat){ riverMat.uniforms.time.value=t; }
    else if(a.k==='flicker'){ const s=1+Math.sin(t*14+a.ph)*0.12; a.o.scale.y=s*a.o.scale.x; }
    else if(a.k==='spin') a.o.rotation.y+=dt*0.1;
    else if(a.k==='sweep'){ a.o.rotation.z=Math.sin(t*0.7+a.ph)*0.5; a.o.rotation.x=0.5+Math.cos(t*0.5+a.ph)*0.3; }
  }
}

// ---------------------------------------------------------------- camera framing
let VIEW = {W:1,H:1,top:0,bot:0};
function fitCamera(W,H,top,bot){
  VIEW={W,H,top,bot};
  renderer.setSize(W,H,false);
  camera.aspect=W/H; camera.clearViewOffset(); camera.updateProjectionMatrix();
  const pitch=54*PI/180;
  const pts=[[-0.7,0,-0.7],[18.7,0,-0.7],[-0.7,0,32.7],[18.7,0,32.7],[9,6.5,2.5],[3.5,4.5,6],[14.5,4.5,6]];
  const availW=W-8, availH=H-top-bot-4;
  let d=48, zc=16;
  let bb=null;
  for(let it=0;it<8;it++){
    camera.position.set(9, zc*0+Math.sin(pitch)*d, zc+Math.cos(pitch)*d);
    camera.lookAt(9,0,zc); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
    for(const p of pts){ _v3.set(p[0],p[1],p[2]).project(camera); const sx=(_v3.x+1)/2*W, sy=(1-_v3.y)/2*H; x0=Math.min(x0,sx); x1=Math.max(x1,sx); y0=Math.min(y0,sy); y1=Math.max(y1,sy); }
    bb={x0,x1,y0,y1};
    const s=Math.max((x1-x0)/availW,(y1-y0)/availH);
    d*=s;
  }
  const cx=(bb.x0+bb.x1)/2, cy=(bb.y0+bb.y1)/2;
  const tx=W/2, ty=top+2+availH/2;
  camera.setViewOffset(W,H,cx-tx,cy-ty,W,H);
  camera.updateProjectionMatrix();
  const scale = renderer.getDrawingBufferSize(new THREE.Vector2()).y/(2*Math.tan(camera.fov*PI/360));
  PSN.mat.uniforms.scale.value=scale; PSA.mat.uniforms.scale.value=scale;
}
function toScreen(x,y,z,out){ _v3.set(x,y,z).project(camera); out=out||{}; out.x=(_v3.x+1)/2*VIEW.W; out.y=(1-_v3.y)/2*VIEW.H; out.z=_v3.z; return out; }
function screenToGround(px,py){
  const ndc=new THREE.Vector2(px/VIEW.W*2-1, -(py/VIEW.H*2-1));
  raycaster.setFromCamera(ndc,camera);
  const hit=new THREE.Vector3(); if(!raycaster.ray.intersectPlane(groundPlane,hit)) return null;
  return {x:hit.x, y:hit.z};
}
