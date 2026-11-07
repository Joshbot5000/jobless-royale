# Jobless Royale character kit: ONE kit.glb with skinned bodies (3 builds, region materials), sculpted heads (+ face
# layer for painted features), every hair style and robe bell sleeves, all sharing one grayscale painted-shading atlas.
# Pipeline (bpy: pip install bpy):
#   python3 build.py && node tools/blender_kit/dump_sdf.js <work>/sdf      # the game's sculpted heads, hair and body surfaces
#   python tools/blender_kit/build_kit.py <work>/out && cp <work>/out/kit.glb vendor/kit.glb && python3 build.py
# Coordinates: built in GAME space (x right, y up, z forward) and converted to Blender (x, -z, y); the exporter writes
# glTF Y-up so the GLB comes back in game space. Joint positions mirror buildHuman() in src/models_chars.js exactly.
import bpy, bmesh, math, sys, os, random
from mathutils import Vector, Matrix, Euler
OUT = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else 'out'
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; col = sc.collection; TAU = math.tau

def B(v): return Vector((v[0], -v[2], v[1]))                       # game -> blender
def link(o):
    if o.name not in col.objects: col.objects.link(o)
    return o
def activate(o, sel=()):
    for x in list(bpy.context.view_layer.objects):
        if x is not None: x.select_set(False)
    for x in (o,) + tuple(sel): x.select_set(True)
    bpy.context.view_layer.objects.active = o
def apply_mods(o):
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    o.modifiers.clear(); old = o.data; o.data = me
    if old.users == 0: bpy.data.meshes.remove(old)
    return o
def to_mesh(o, name=None):
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    m = link(bpy.data.objects.new(name or (o.name + '_m'), me)); m.matrix_world = o.matrix_world.copy(); bpy.data.objects.remove(o); return m
def smooth(o):
    for p in o.data.polygons: p.use_smooth = True
def decimate(o, tris):
    n = sum(len(p.vertices) - 2 for p in o.data.polygons)
    if n > tris:
        m = o.modifiers.new('d', 'DECIMATE'); m.ratio = tris / n; apply_mods(o)
    smooth(o); return o
def apply_xf(o):
    activate(o); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ------------------------------------------------------------------ joints (game space), mirroring buildHuman
def R3(rx, ry, rz):   # three.js Euler 'XYZ' = Rx * Ry * Rz
    return Matrix.Rotation(rx, 3, 'X') @ Matrix.Rotation(ry, 3, 'Y') @ Matrix.Rotation(rz, 3, 'Z')
LR, HK = 1.36, 0.8
def joints(w):
    tw, th = 0.27 * w, 0.29
    J = {}; hy = 0.44 * (LR - 1) + 0.44
    J['Hips'] = Vector((0, hy, 0)); J['Spine'] = Vector((0, hy, 0)); J['Spine1'] = Vector((0, hy + th, 0)); J['Neck'] = Vector((0, hy + th * 1.9, 0))
    J['Head'] = Vector((0, hy + th * 2 + 0.035 + 0.3 * 0.92 * HK, 0))
    for s, side in ((1, 'Left'), (-1, 'Right')):
        lx = s * 0.11 * w
        J[side + 'UpLeg'] = Vector((lx, hy, 0)); J[side + 'Leg'] = Vector((lx, hy - 0.205 * LR, 0.024)); J[side + 'Foot'] = Vector((lx, hy - 0.37 * LR, 0.0))
        A = Vector((s * (tw + 0.025), hy + th * 1.62, 0)); RA = R3(0.05, 0, s * 0.15)
        J[side + 'Arm'] = A; J[side + 'ForeArm'] = A + RA @ Vector((0, -0.242, -0.012)); J[side + 'Wrist'] = A + RA @ Vector((0, -0.412, 0.07))
        J[side + 'Hand'] = A + RA @ Vector((0, -0.448, 0.088)); J[side + 'HandRot'] = RA @ R3(0.25, -s * 0.4, s * 0.12)
    return J

# ------------------------------------------------------------------ bake shader: grayscale painted shading (AO x soft gradient x cavity highlight)
def shade_mat(name, image=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links
    for n in list(N): N.remove(n)
    out = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission'); L.new(em.outputs[0], out.inputs[0])
    geo = N.new('ShaderNodeNewGeometry')
    ao = N.new('ShaderNodeAmbientOcclusion'); ao.samples = 24; ao.inputs['Distance'].default_value = 0.07
    aom = N.new('ShaderNodeMapRange'); aom.inputs[3].default_value = 0.5; aom.inputs[4].default_value = 1.0; L.new(ao.outputs['AO'], aom.inputs[0])
    xyz = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], xyz.inputs[0])
    gm = N.new('ShaderNodeMapRange'); gm.inputs[1].default_value = -1; gm.inputs[2].default_value = 1; gm.inputs[3].default_value = 0.86; gm.inputs[4].default_value = 1.0; L.new(xyz.outputs['Z'], gm.inputs[0])   # top-lit softness
    cv = N.new('ShaderNodeMapRange'); cv.inputs[1].default_value = 0.5; cv.inputs[2].default_value = 0.56; cv.inputs[3].default_value = 1.0; cv.inputs[4].default_value = 1.05; L.new(geo.outputs['Pointiness'], cv.inputs[0])
    m1 = N.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; L.new(aom.outputs[0], m1.inputs[0]); L.new(gm.outputs[0], m1.inputs[1])
    m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; m2.use_clamp = True; L.new(m1.outputs[0], m2.inputs[0]); L.new(cv.outputs[0], m2.inputs[1])
    L.new(m2.outputs[0], em.inputs[0])
    if image is not None:
        t = N.new('ShaderNodeTexImage'); t.image = image; N.active = t
    return m
REGIONS = ['K_NECK', 'K_TORSO', 'K_UPARM', 'K_FOREARM', 'K_HANDS', 'K_LEGS', 'K_SHOES', 'K_SOLE']
MATS = {}
def mat(name):
    if name not in MATS: MATS[name] = shade_mat(name)
    return MATS[name]

# ------------------------------------------------------------------ armature per build (names match the runtime bones)
PARENT = {'Spine': 'Hips', 'Spine1': 'Spine', 'Neck': 'Spine1', 'Head': 'Neck'}
for side in ('Left', 'Right'):
    PARENT.update({side + 'UpLeg': 'Hips', side + 'Leg': side + 'UpLeg', side + 'Foot': side + 'Leg', side + 'Arm': 'Spine1', side + 'ForeArm': side + 'Arm', side + 'Hand': side + 'ForeArm'})
def armature(tag, J):
    arm = bpy.data.armatures.new('rig_' + tag); rig = link(bpy.data.objects.new('rig_' + tag, arm)); activate(rig); bpy.ops.object.mode_set(mode='EDIT')
    tails = {'Hips': J['Spine1'], 'Spine': J['Spine1'], 'Spine1': J['Neck'], 'Neck': J['Head'], 'Head': J['Head'] + Vector((0, 0.2, 0))}
    for side in ('Left', 'Right'):
        tails.update({side + 'UpLeg': J[side + 'Leg'], side + 'Leg': J[side + 'Foot'], side + 'Foot': J[side + 'Foot'] + Vector((0, -0.08, 0.15)),
                      side + 'Arm': J[side + 'ForeArm'], side + 'ForeArm': J[side + 'Wrist'], side + 'Hand': J[side + 'Hand'] + J[side + 'HandRot'] @ Vector((0, -0.12, 0))})
    for n in ['Hips', 'Spine', 'Spine1', 'Neck', 'Head'] + [s + p for s in ('Left', 'Right') for p in ('UpLeg', 'Leg', 'Foot', 'Arm', 'ForeArm', 'Hand')]:
        b = arm.edit_bones.new(n); b.head = B(J[n]); b.tail = B(tails[n])
        if (b.tail - b.head).length < 1e-3: b.tail = b.head + Vector((0, 0, 0.05))
    for n, pn in PARENT.items(): arm.edit_bones[n].parent = arm.edit_bones[pn]
    bpy.ops.object.mode_set(mode='OBJECT'); return rig
def skin_to(o, rig, auto=True, group=None):
    if auto:
        activate(rig); o.select_set(True); bpy.context.view_layer.objects.active = rig; bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    else:
        vg = o.vertex_groups.new(name=group); vg.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
        md = o.modifiers.new('arm', 'ARMATURE'); md.object = rig; o.parent = rig

# ------------------------------------------------------------------ bodies: ONE continuous surface built from the game's own body fields (dump_sdf.js), so every outfit
# detail buildHuman places sits on it; regions come per vertex from the nearest body part; chunky rounded shoes with toe spring
def body(tag, w, belly=0.0):
    import json
    J = joints(w); hy = J['Hips'].y
    d = json.load(open(os.path.join(SDF_DIR, 'body_' + tag + '.json'))); P = d['pos']; I = d['idx']; RG = d['reg']
    me = bpy.data.meshes.new('b'); me.from_pydata([B((P[i], P[i + 1], P[i + 2])) for i in range(0, len(P), 3)], [], [tuple(I[i:i + 3]) for i in range(0, len(I), 3)])
    o = link(bpy.data.objects.new('body_' + tag, me)); smooth(o)
    for r in REGIONS: o.data.materials.append(mat(r))
    for f in o.data.polygons:
        vs = [RG[v] for v in f.vertices]; f.material_index = max(set(vs), key=vs.count)
    # shoes: chunky rounded, toe spring, separate sole; joined into the body
    parts = [o]
    for side, s in (('Left', 1), ('Right', -1)):
        a = J[side + 'Foot']
        bpy.ops.mesh.primitive_cube_add(size=1); sh = bpy.context.object; sh.scale = (0.18, 0.31, 0.15); sh.location = B(Vector((a.x, 0.085, 0.05)))
        m = sh.modifiers.new('s', 'SUBSURF'); m.levels = 3; apply_mods(sh); apply_xf(sh)
        for v in sh.data.vertices:
            g = Vector((v.co.x, v.co.z, -v.co.y)); fwd = g.z - 0.045
            if fwd > 0.06: v.co.z += 0.12 * (fwd - 0.06) ** 1.5 if v.co.z < 0.05 else 0    # toe spring
            if fwd > 0.0 and v.co.z > 0.09: v.co.z -= (v.co.z - 0.09) * min(1, fwd * 5) * 0.6   # low toe box
            if v.co.z < 0.03: v.co.z = 0.012 + (v.co.z - 0.012) * 0.25                         # flat, slightly rounded sole
        sh.data.materials.append(mat('K_SHOES')); sh.data.materials.append(mat('K_SOLE'))
        for f in sh.data.polygons: f.material_index = 1 if f.center.z < 0.032 else 0             # the sole is the shoe's own underside
        parts.append(sh)
    activate(o, parts[1:]); bpy.ops.object.join(); o = bpy.context.object; o.name = 'body_' + tag
    decimate(o, {'v0': 3600, 'v1': 3700, 'v2': 3800}[tag]); return o, J

# ------------------------------------------------------------------ heads: metaball sculpts in head-local units (radius 0.3), scaled by HK at the head joint
def meta(name, elems, res=0.014, thr=0.6):
    mb = bpy.data.metaballs.new(name); mb.resolution = mb.render_resolution = res; mb.threshold = thr
    for typ, co, r, sz, neg in elems:
        e = mb.elements.new(); e.type = typ; e.co = B(co); e.radius = r; e.use_negative = neg
        if typ in ('ELLIPSOID', 'CAPSULE'): e.size_x, e.size_y, e.size_z = sz[0], sz[2], sz[1]
    return link(bpy.data.objects.new(name, mb))
hs = 0.3
FACES = {   # cranium sy, jaw width, jaw height, chin width, chin depth
    'classic': (0.97, 0.66, 0.5, 0.26, 0.72), 'round': (0.95, 0.74, 0.5, 0.22, 0.68), 'long': (1.05, 0.6, 0.58, 0.24, 0.8), 'square': (0.97, 0.78, 0.46, 0.34, 0.7)}
SDF_DIR = os.environ.get('KIT_SDF', os.path.join(os.path.dirname(OUT), 'sdf'))
def import_json(name, tris):   # sculpted SDF meshes exported from the game (tools/blender_kit/dump_sdf.js), head-local game units
    import json
    d = json.load(open(os.path.join(SDF_DIR, name + '.json'))); P = d['pos']; I = d['idx']
    me = bpy.data.meshes.new(name); me.from_pydata([B((P[i], P[i + 1], P[i + 2])) for i in range(0, len(P), 3)], [], [tuple(I[i:i + 3]) for i in range(0, len(I), 3)])
    o = link(bpy.data.objects.new(name, me)); smooth(o)
    m = o.modifiers.new('w', 'WELD'); m.merge_threshold = 0.0005; apply_mods(o); decimate(o, tris); return o
def head(tag, HJ):
    o = import_json('head_' + tag, 1500); o.data.materials.append(mat('K_SKIN'))
    # face layer: the front of the head, lifted a hair, planar UVs in head-local units (u = 0.5 + x/0.64, v = 0.5 + y/0.64)
    bm = bmesh.new(); bm.from_mesh(o.data); bm.normal_update()
    keep = set(f for f in bm.faces if f.normal.dot(Vector((0, -1, 0))) > 0.25 and abs(f.calc_center_median().x) < hs * 0.75 and -hs * 0.8 < f.calc_center_median().z < hs * 0.6)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f not in keep], context='FACES')
    for v in bm.verts: v.co += v.normal * 0.005
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops: l[uv].uv = (0.5 + l.vert.co.x / 0.64, 0.5 + l.vert.co.z / 0.64)
    dme = bpy.data.meshes.new('decal_' + tag); bm.to_mesh(dme); bm.free()
    d = link(bpy.data.objects.new('face_' + tag, dme)); smooth(d); d.data.materials.append(mat('K_FACE'))
    for x in (o, d): x.scale = (HK, HK, HK); x.location = B(HJ); apply_xf(x)
    return o, d
def hair(style, HJ, seed=0):
    o = import_json('hair_' + style, 1300 if style in ('afro', 'long', 'ponytail') else 1000); o.data.materials.append(mat('K_HAIR'))
    o.scale = (HK, HK, HK); o.location = B(HJ); apply_xf(o); return o

# ------------------------------------------------------------------ robe bell sleeves (average build)
def bell(J, side, s):
    a, b = J[side + 'ForeArm'], J[side + 'Wrist'] + (J[side + 'Wrist'] - J[side + 'ForeArm']) * 0.12
    d = (b - a).normalized(); x = d.cross(Vector((0, 0, 1))).normalized(); y = d.cross(x).normalized(); segs, rings = 26, 7; V = []; F = []
    for j in range(rings):
        t = j / (rings - 1); c = a.lerp(b, t); r = 0.075 + 0.075 * t * t
        for i in range(segs):
            ang = i / segs * TAU; fold = 0.008 * t * math.sin(ang * 6); V.append(B(c + (x * math.cos(ang) + y * math.sin(ang)) * (r + fold)))
    for j in range(rings - 1):
        for i in range(segs): F.append((j * segs + i, j * segs + (i + 1) % segs, (j + 1) * segs + (i + 1) % segs, (j + 1) * segs + i))
    me = bpy.data.meshes.new('bell'); me.from_pydata(V, [], F); o = link(bpy.data.objects.new('sleeve_bell_' + side, me))
    so = o.modifiers.new('so', 'SOLIDIFY'); so.thickness = 0.01; sb = o.modifiers.new('sb', 'SUBSURF'); sb.levels = 1; apply_mods(o); smooth(o)
    decimate(o, 420); o.data.materials.append(mat('K_TORSO')); return o

# ------------------------------------------------------------------ build everything
objs = []; rigs = {}
for tag, w, belly in (('v0', 1.0, 0.0), ('v1', 1.3, 0.0), ('v2', 1.5, 0.6)):
    b_, J = body(tag, w, belly); rig = armature(tag, J); skin_to(b_, rig); rigs[tag] = (rig, J); objs.append(b_)
rig0, J0 = rigs['v0']
for tag in FACES:
    h_, d_ = head(tag, J0['Head']); skin_to(h_, rig0, False, 'Head'); skin_to(d_, rig0, False, 'Head'); objs += [h_, d_]
for i, st in enumerate(['short', 'slick', 'messy', 'curl', 'long', 'bun', 'ponytail', 'spiky', 'afro', 'cap']):
    h_ = hair(st, J0['Head']); skin_to(h_, rig0, False, 'Head'); objs.append(h_)
for side, s in (('Left', 1), ('Right', -1)):
    o = bell(J0, side, s); skin_to(o, rig0, False, side + 'ForeArm'); objs.append(o)

# ------------------------------------------------------------------ one grayscale atlas for everything except the face layers (they use runtime-painted canvases)
SIZE = 2048; ATL = bpy.data.images.new('kit_shading', SIZE, SIZE, alpha=False)
bake = [o for o in objs if not o.name.startswith('face_')]
for o in bake:
    activate(o); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=0.003); bpy.ops.object.mode_set(mode='OBJECT')
activate(bake[0], bake[1:]); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.pack_islands(margin=0.003); bpy.ops.object.mode_set(mode='OBJECT')
for m in bpy.data.materials:
    t = m.node_tree.nodes.new('ShaderNodeTexImage'); t.image = ATL; m.node_tree.nodes.active = t
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.render.bake.margin = 6
for i, o in enumerate(bake): o.location.x += (i + 1) * 4.0          # bake each part alone: overlapping heads / hair / bodies must not occlude each other
activate(bake[0], bake[1:]); bpy.ops.object.bake(type='EMIT')
for i, o in enumerate(bake): o.location.x -= (i + 1) * 4.0
ATL.filepath_raw = os.path.join(OUT, 'kit_shading.png'); ATL.file_format = 'PNG'; ATL.save(); ATL.pack()
# export materials: region names kept; every textured slot points at the one atlas (stored once in the GLB)
for m in bpy.data.materials:
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); bs = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(bs.outputs[0], out.inputs[0])
    if m.name != 'K_FACE':
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = ATL; nt.links.new(t.outputs[0], bs.inputs['Base Color'])
tris = 0
for o in objs: tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
print('KIT parts', len(objs), 'tris total', tris)
for o in objs: print('  ', o.name, sum(len(p.vertices) - 2 for p in o.data.polygons))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'kit.glb'), export_format='GLB', export_yup=True, export_animations=False, export_image_format='JPEG', export_jpeg_quality=86,
                          export_skins=True, export_morph=False, export_apply=False)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'kit.blend'))
print('DONE', os.path.getsize(os.path.join(OUT, 'kit.glb')))
