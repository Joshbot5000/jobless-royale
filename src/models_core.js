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
function faceGeo(){ const g=new THREE.SphereGeometry(1,segQ(30),segQ(24)), p=g.attributes.position;
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
function shoeGeo(){ const g=new THREE.SphereGeometry(1,segQ(16),segQ(10,4)), p=g.attributes.position;   // rounded toe with toe spring, flat sole, heel
  for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i); if(y<-0.35) y=-0.35-(y+0.35)*0.15; if(z>0){ y-=0.18*z*z*(y>0?1:0); x*=1-0.08*z; if(z>0.55) y+=0.22*(z-0.55)*(1-y)*0.5; } else x*=1-0.12*(-z); p.setXYZ(i,x,y,z); }
  return smoothNormals(g); }
// torso: hips, narrow waist, full chest, square rounded shoulders; flatter back, chest forward
function torsoGeo(){ const g=lathe([[0.0001,-1],[0.62,-0.985],[0.86,-0.88],[0.93,-0.7],[0.88,-0.48],[0.8,-0.26],[0.83,-0.02],[0.93,0.28],[1.0,0.52],[1.01,0.7],[0.92,0.84],[0.66,0.95],[0.36,1.0],[0.0001,1.0]],30), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    const chest=Math.exp(-Math.pow((y-0.38)/0.26,2)); if(z>0) z*=1+0.1*chest; else z*=0.9;
    if(y>0.5){ const k=Math.min(1,(y-0.5)/0.3); x*=1+0.08*k*Math.abs(x); }                          // squarer shoulders
    if(y<-0.6&&z<0) z*=1.06;                                                                          // seat
    p.setXYZ(i,x,y,z); }
  return smoothNormals(g); }
function skirtGeo(){ const g=lathe([[0.0001,0.5],[0.6,0.5],[0.68,0.32],[0.8,0.05],[0.93,-0.3],[1.04,-0.46],[1.0,-0.5],[0.0001,-0.5]].reverse(),64), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), r=Math.hypot(x,z); if(r<1e-3) continue; const a=Math.atan2(z,x), t=Math.min(1,Math.max(0,(0.45-y)/0.95));
    const f=1+t*t*(0.075*Math.sin(a*9)+0.035*Math.sin(a*17+1.3))+t*0.04; p.setXYZ(i,x*f,y-(t>0.95?0.02*Math.sin(a*9):0),z*f); }
  return smoothNormals(g); }
function noseGeo(){ const g=new THREE.SphereGeometry(1,segQ(14),segQ(12,4)), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ let x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    if(y>-0.25){ const k=(y+0.25)/1.25; x*=0.55-0.25*k; z=z*(0.7-0.3*k)-0.28*k; }               // narrow bridge running back between the eyes
    else { x*=1.0+0.15*(-y-0.25); }                                                                  // rounded tip with nostril wings
    p.setXYZ(i,x,y,z); }
  return smoothNormals(g); }
// Battle models are seen from far away, so they use fewer segments (GEO_LO); card portraits switch it off for full detail.
let GEO_LO=true; const segQ=(n,min=6)=>GEO_LO?Math.max(min,Math.round(n*0.6)):n;
function geo(k){
  const ck=(GEO_LO?'~':'')+k; if(GEO[ck]) return GEO[ck];
  let g;
  switch(k){
    case 'sph': g=new THREE.SphereGeometry(1,segQ(22),segQ(16,4)); break;
    case 'head': g=new THREE.SphereGeometry(1,segQ(28),segQ(20,4)); break;
    case 'sphLo': g=new THREE.SphereGeometry(1,segQ(12),segQ(9,4)); break;
    case 'box': g=new THREE.BoxGeometry(1,1,1); break;
    case 'rbox': g=roundBoxGeo(0.2,4); break;
    case 'rbox2': g=roundBoxGeo(0.1,3); break;
    case 'rboxS': g=roundBoxGeo(0.32,5); break;
    case 'cyl': g=new THREE.CylinderGeometry(1,1,1,segQ(24)); break;
    case 'cylLo': g=new THREE.CylinderGeometry(1,1,1,segQ(10)); break;
    case 'cone': g=new THREE.ConeGeometry(1,1,segQ(24)); break;
    case 'cone4': g=new THREE.ConeGeometry(1,1,4); break;
    case 'tor': g=new THREE.TorusGeometry(1,0.22,segQ(12,4),segQ(32)); break;
    case 'torThin': g=new THREE.TorusGeometry(1,0.08,segQ(8,4),segQ(28)); break;
    case 'torHalf': g=new THREE.TorusGeometry(1,0.12,segQ(8,4),segQ(20),PI); break;
    case 'smile': g=new THREE.TorusGeometry(1,0.26,segQ(8,4),segQ(16),PI*0.8); break;
    case 'hemi': g=new THREE.SphereGeometry(1,segQ(24),segQ(12,4),0,TAU,0,PI/2); break;
    case 'dish': g=new THREE.SphereGeometry(1,segQ(24),segQ(8,4),0,TAU,0,PI/3.2); break;
    case 'ring': g=new THREE.RingGeometry(0.8,1,segQ(48)); break;
    case 'circle': g=new THREE.CircleGeometry(1,segQ(40)); break;
    case 'plane': g=new THREE.PlaneGeometry(1,1); break;
    case 'dodec': g=new THREE.DodecahedronGeometry(1,0); break;
    case 'oct': g=new THREE.OctahedronGeometry(1,0); break;
    case 'ico': g=new THREE.IcosahedronGeometry(1,1); break;
    case 'caps': g=lathe(capsulePts(8),segQ(18)); break;                       // height 2, radius 0.5
    case 'torso': g=torsoGeo(); break;
    case 'bell': g=lathe([[0.0001,0.5],[0.6,0.5],[0.68,0.32],[0.8,0.05],[0.93,-0.3],[1.02,-0.46],[0.97,-0.5],[0.0001,-0.5]].reverse(),28); break;
    case 'shoe': g=lathe([[0.0001,-0.5],[0.85,-0.5],[1.0,-0.3],[0.95,0.1],[0.7,0.4],[0.0001,0.5]],segQ(16)); break;
    case 'roof': g=lathe([[0.0001,1],[0.25,0.82],[0.55,0.45],[0.85,0.1],[1.08,-0.02],[1.0,-0.06],[0.0001,-0.06]].reverse(),24); break;
    case 'puff': g=new THREE.IcosahedronGeometry(1,2); break;
    // lower-detail variants, picked automatically by P() for small parts (keeps triangle counts phone-friendly)
    case 'sphMid': g=new THREE.SphereGeometry(1,segQ(16),segQ(11,4)); break;
    case 'capsLo': g=lathe(capsulePts(4),segQ(10)); break;
    case 'torLo': g=new THREE.TorusGeometry(1,0.22,segQ(8,4),segQ(18)); break;
    case 'torThinLo': g=new THREE.TorusGeometry(1,0.08,segQ(6,4),segQ(16)); break;
    case 'puffLo': g=new THREE.IcosahedronGeometry(1,1); break;
    case 'hemiLo': g=new THREE.SphereGeometry(1,segQ(12),segQ(6,4),0,TAU,0,PI/2); break;
    case 'face': g=faceGeo(); break;                                   // head with cheeks, jaw and chin in one smooth shell
    case 'lid': g=new THREE.SphereGeometry(1,segQ(14),segQ(6,4),0,TAU,0,PI*0.42); break;   // eyelid cap
    case 'limb': g=lathe([[0.0001,-1],[0.36,-0.97],[0.47,-0.85],[0.44,-0.5],[0.42,-0.05],[0.47,0.45],[0.5,0.8],[0.38,0.97],[0.0001,1]],segQ(14)); break; // tapered limb, fuller at top
    case 'shoeS': g=shoeGeo(); break;
    case 'skirt': g=skirtGeo(); break;                                 // flared, folded hem for robes, dresses and coats
    case 'noseG': g=noseGeo(); break;                                  // bridge + rounded tip
    case 'disc': g=new THREE.CircleGeometry(1,segQ(20)); break;
    case 'banner': g=new THREE.PlaneGeometry(1,1.45,6,8); break;
  }
  return GEO[ck]=g;
}


// ---------------------------------------------------------------- sculpted bodies: signed-distance fields + surface nets
// Each animated body segment (torso, head, an arm, a hand, a leg) is ONE smooth implicit surface: ellipsoids and round
// cones blended with a polynomial smooth-min, so shoulders flow into arms, hips into thighs, cheeks into the jaw.
// It is polygonised with surface nets; normals come from the field's gradient (no faceting, no seams). Geometry is cached
// by shape parameters (not by card), so most cards share the same arm/leg/hand meshes and only their colours differ.
const SDF={
  smin(a,b,k){ if(k<=0) return Math.min(a,b); const h=Math.max(k-Math.abs(a-b),0)/k; return Math.min(a,b)-h*h*k*0.25; },
  smax(a,b,k){ return -SDF.smin(-a,-b,k); },
  ell(cx,cy,cz,rx,ry,rz){ return (x,y,z)=>{ const px=(x-cx)/rx, py=(y-cy)/ry, pz=(z-cz)/rz, k0=Math.sqrt(px*px+py*py+pz*pz), qx=px/rx, qy=py/ry, qz=pz/rz, k1=Math.sqrt(qx*qx+qy*qy+qz*qz); return k1<1e-9?-Math.min(rx,ry,rz):k0*(k0-1)/k1; }; },
  // round cone between a (radius r1) and b (radius r2), after Inigo Quilez
  rcone(ax,ay,az,bx,by,bz,r1,r2){ const bax=bx-ax, bay=by-ay, baz=bz-az, l2=bax*bax+bay*bay+baz*baz, rr=r1-r2, a2=l2-rr*rr, il2=1/l2;
    return (x,y,z)=>{ const pax=x-ax, pay=y-ay, paz=z-az, yv=pax*bax+pay*bay+paz*baz, zv=yv-l2, qx=pax*l2-bax*yv, qy=pay*l2-bay*yv, qz=paz*l2-baz*yv;
      const x2=qx*qx+qy*qy+qz*qz, y2=yv*yv*l2, z2=zv*zv*l2, k=Math.sign(rr)*rr*rr*x2;
      if(Math.sign(zv)*a2*z2>k) return Math.sqrt(x2+z2)*il2-r2; if(Math.sign(yv)*a2*y2<k) return Math.sqrt(x2+y2)*il2-r1; return (Math.sqrt(x2*a2*il2)+yv*rr)*il2-r1; }; },
  // blend a list: [[fn,k],...] (k = smoothness with everything before it); negative k subtracts
  blend(list){ return (x,y,z)=>{ let d=list[0][0](x,y,z); for(let i=1;i<list.length;i++){ const [f,k]=list[i], v=f(x,y,z); d=k<0?SDF.smax(d,-v,-k):SDF.smin(d,v,k); } return d; }; },
  inflate(f,t){ return (x,y,z)=>f(x,y,z)-t; },
  cutBelow(f,yc,k=0.012){ return (x,y,z)=>SDF.smax(f(x,y,z),yc-y,k); },     // keep y >= yc
  cutAbove(f,yc,k=0.012){ return (x,y,z)=>SDF.smax(f(x,y,z),y-yc,k); },     // keep y <= yc
};
let SDF_CELL=0.032;                       // battle resolution; card portraits build with a finer cell
const SDF_CACHE=new Map();
function sdfGeo(key,fn,bmin,bmax,cellMul=1){
  const cell=SDF_CELL*cellMul, ck=key+'@'+cell; let g=SDF_CACHE.get(ck); if(g) return g;
  const pad=cell*1.5, ox=bmin[0]-pad, oy=bmin[1]-pad, oz=bmin[2]-pad;
  const nx=Math.ceil((bmax[0]-bmin[0]+2*pad)/cell)+1, ny=Math.ceil((bmax[1]-bmin[1]+2*pad)/cell)+1, nz=Math.ceil((bmax[2]-bmin[2]+2*pad)/cell)+1;
  const V=new Float32Array(nx*ny*nz), id=(i,j,k)=>i+nx*(j+ny*k);
  // two-level sampling: exact values on a stride-2 grid, then exact values only near the surface; points well away from it
  // are filled by interpolation (only their sign matters to the mesher). 3-5x fewer field evaluations.
  const ex=new Uint8Array(nx*ny*nz);
  for(let k=0;k<nz;k+=2) for(let j=0;j<ny;j+=2) for(let i=0;i<nx;i+=2){ const q=id(i,j,k); V[q]=fn(ox+i*cell,oy+j*cell,oz+k*cell); ex[q]=1; }
  const far=cell*2.6;
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const q=id(i,j,k); if(ex[q]) continue;
    const i0=i&~1, j0=j&~1, k0=k&~1, i1=Math.min(i0+2,nx-1-((nx-1)&1)), j1=Math.min(j0+2,ny-1-((ny-1)&1)), k1=Math.min(k0+2,nz-1-((nz-1)&1));
    let mn=1e9, mx=-1e9, sum=0, n=0; for(const kk of [k0,k1]) for(const jj of [j0,j1]) for(const ii of [i0,i1]){ const w=V[id(ii,jj,kk)]; if(w<mn) mn=w; if(w>mx) mx=w; sum+=w; n++; }
    if(i1<=i0&&i>i0||j1<=j0&&j>j0||k1<=k0&&k>k0||!(mn>far||mx<-far)) V[q]=fn(ox+i*cell,oy+j*cell,oz+k*cell); else V[q]=sum/n; }
  const cx=nx-1, cy=ny-1, cz=nz-1, CI=new Int32Array(cx*cy*cz).fill(-1), cid=(i,j,k)=>i+cx*(j+cy*k);
  const pos=[], E=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]], C=[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]], cv=new Float32Array(8);
  for(let k=0;k<cz;k++) for(let j=0;j<cy;j++) for(let i=0;i<cx;i++){
    let neg=0; for(let c=0;c<8;c++){ cv[c]=V[id(i+C[c][0],j+C[c][1],k+C[c][2])]; if(cv[c]<0) neg++; }
    if(neg===0||neg===8) continue;
    let sx=0,sy=0,sz=0,n=0;
    for(const [a,b] of E){ const va=cv[a], vb=cv[b]; if((va<0)===(vb<0)) continue; const t=va/(va-vb); sx+=C[a][0]+(C[b][0]-C[a][0])*t; sy+=C[a][1]+(C[b][1]-C[a][1])*t; sz+=C[a][2]+(C[b][2]-C[a][2])*t; n++; }
    CI[cid(i,j,k)]=pos.length/3; pos.push(ox+(i+sx/n)*cell, oy+(j+sy/n)*cell, oz+(k+sz/n)*cell);
  }
  const idx=[], quad=(a,b,c,d)=>{ if(a<0||b<0||c<0||d<0) return; idx.push(a,b,c,a,c,d); };
  for(let k=1;k<nz-1;k++) for(let j=1;j<ny-1;j++) for(let i=1;i<nx-1;i++){
    const v0=V[id(i,j,k)]<0;
    if(i<cx&&(V[id(i+1,j,k)]<0)!==v0){ const q=[CI[cid(i,j-1,k-1)],CI[cid(i,j,k-1)],CI[cid(i,j,k)],CI[cid(i,j-1,k)]]; v0?quad(q[0],q[1],q[2],q[3]):quad(q[3],q[2],q[1],q[0]); }
    if(j<cy&&(V[id(i,j+1,k)]<0)!==v0){ const q=[CI[cid(i-1,j,k-1)],CI[cid(i-1,j,k)],CI[cid(i,j,k)],CI[cid(i,j,k-1)]]; v0?quad(q[0],q[1],q[2],q[3]):quad(q[3],q[2],q[1],q[0]); }
    if(k<cz&&(V[id(i,j,k+1)]<0)!==v0){ const q=[CI[cid(i-1,j-1,k)],CI[cid(i,j-1,k)],CI[cid(i,j,k)],CI[cid(i-1,j,k)]]; v0?quad(q[0],q[1],q[2],q[3]):quad(q[3],q[2],q[1],q[0]); }
  }
  // smooth normals from the field gradient; fix any triangle wound against it; cylindrical UVs for fabric / fur detail maps
  const nv=pos.length/3, nor=new Float32Array(nv*3), uv=new Float32Array(nv*2), e=cell*0.5;
  const mx=(bmin[0]+bmax[0])/2, mz=(bmin[2]+bmax[2])/2, h=Math.max(1e-3,bmax[1]-bmin[1]);
  for(let v=0;v<nv;v++){ const x=pos[v*3], y=pos[v*3+1], z=pos[v*3+2];
    let gx=fn(x+e,y,z)-fn(x-e,y,z), gy=fn(x,y+e,z)-fn(x,y-e,z), gz=fn(x,y,z+e)-fn(x,y,z-e); const l=Math.hypot(gx,gy,gz)||1;
    nor[v*3]=gx/l; nor[v*3+1]=gy/l; nor[v*3+2]=gz/l; uv[v*2]=Math.atan2(x-mx,z-mz)/(2*Math.PI)+0.5; uv[v*2+1]=(y-bmin[1])/h; }
  for(let t=0;t<idx.length;t+=3){ const a=idx[t]*3, b=idx[t+1]*3, c=idx[t+2]*3;
    const ux=pos[b]-pos[a], uy=pos[b+1]-pos[a+1], uz=pos[b+2]-pos[a+2], wx=pos[c]-pos[a], wy=pos[c+1]-pos[a+1], wz=pos[c+2]-pos[a+2];
    const fx=uy*wz-uz*wy, fy=uz*wx-ux*wz, fz=ux*wy-uy*wx; if(fx*(nor[a]+nor[b]+nor[c])+fy*(nor[a+1]+nor[b+1]+nor[c+1])+fz*(nor[a+2]+nor[b+2]+nor[c+2])<0){ const s=idx[t+1]; idx[t+1]=idx[t+2]; idx[t+2]=s; } }
  g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.BufferAttribute(nor,3)); g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setIndex(nv>65535?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1)); g.computeBoundingSphere(); g.userData.sdf=true;
  SDF_CACHE.set(ck,g); return g; }
// add a cached SDF mesh to a rig segment
function S(parent,key,fn,bmin,bmax,m,cellMul){ const me=new THREE.Mesh(sdfGeo(key,fn,bmin,bmax,cellMul),m); parent.add(me); return me; }
// surface z of a field along a ray from the front (used to seat eyes, brows and mouths on the sculpted face)
function sdfFrontZ(fn,x,y,z0,z1){ let z=z0; for(let i=0;i<40&&z>z1;i++){ const d=fn(x,y,z); if(d<0.0008) return z; z-=Math.max(0.002,d*0.9); } return z; }

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
    uniforms:{col:{value:new THREE.Color(color).lerp(new THREE.Color('#3a3f55'),0.25)},thick:{value:0.019}},
    vertexShader:'uniform float thick; void main(){ vec3 n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); mv.xyz+=n*clamp(thick*(-mv.z)/42.0,0.005,thick); gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform vec3 col; void main(){ gl_FragColor=vec4(col,1.0); }',
    side:THREE.BackSide });
}
function addOutlines(root,color,minR=0.045){
  const om=outlineMat(color), list=[];
  root.traverse(o=>{ if(o.isMesh && !o.userData.noOutline && !o.material.transparent && o.material.type!=='ShaderMaterial'){ if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const s=Math.max(o.scale.x,o.scale.y,o.scale.z); if(o.geometry.boundingSphere.radius*s>minR) list.push(o); } });
  for(const o of list){ let ol; if(o.isSkinnedMesh){ ol=new THREE.SkinnedMesh(o.geometry,kitOutlineMat(color)); ol.bind(o.skeleton,o.bindMatrix); } else ol=new THREE.Mesh(o.geometry,om); ol.userData.isOutline=true; ol.userData.noOutline=true; ol.castShadow=false; o.add(ol); }
}
function setShadows(root,cast,receive){ root.traverse(o=>{ if(o.isMesh && !o.userData.isOutline && !o.material.transparent){ o.castShadow=cast; o.receiveShadow=receive; } }); }

// ---------------------------------------------------------------- procedural textures
function texCanvas(w,h,draw,rep){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; if(rep) t.repeat.set(rep[0],rep[1]); t.anisotropy=4; return t; }
const TEX={};
// fine fabric weave (bump), hair strands (colour + bump), wood grain, brushed metal, tyre tread: tiny tiling canvases shared by every model
function blushTex(){ return TEX.blush||(TEX.blush=(()=>{ const t=texCanvas(64,64,(x,w,h)=>{ const g=x.createRadialGradient(32,32,2,32,32,31); g.addColorStop(0,'rgba(255,255,255,0.9)'); g.addColorStop(0.5,'rgba(255,255,255,0.45)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,w,h); }); t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; return t; })()); }
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
