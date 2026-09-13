import bpy, json, math, hashlib, base64, zipfile, io
from pathlib import Path
from mathutils import Matrix
ROOT=Path(r'C:\Users\Owner\Documents\GRIDRUNNER_Drone_Pack_02')
OUT=ROOT/'runtime_v76';OUT.mkdir(exist_ok=True)
source=ROOT/'GRIDRUNNER_Drone_Pack_02.blend'
before=hashlib.sha256(source.read_bytes()).hexdigest()
report=[]
for role in ['SCOUT','CARGO','UTILITY','RELAY']:
    col=bpy.data.collections['DRONE_'+role+'_01_REF02']
    studio=bpy.data.scenes.new('EXPORT_'+role)
    bpy.context.window.scene=studio
    studio.collection.children.link(col)
    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get()
    groups={}; pivots={}
    for obj in col.all_objects:
        if obj.type not in {'MESH','FONT','CURVE'}:continue
        p=obj.parent;part='Static'
        while p:
            if 'PIVOT_Rotor' in p.name:
                part=p.name;pivots[part]=p.matrix_world.copy();break
            p=p.parent
        ev=obj.evaluated_get(dg)
        mesh=bpy.data.meshes.new_from_object(ev,preserve_all_data_layers=True,depsgraph=dg)
        if not mesh or not len(mesh.vertices):continue
        mat=mesh.materials[0].name if mesh.materials else 'GR_01_painted_alum'
        groups.setdefault((part,mat),[]).append((mesh,obj.matrix_world.copy()))
    studio.collection.children.unlink(col)
    for (part,mat),parts in groups.items():
        obs=[];base=pivots.get(part,Matrix.Identity(4));inv=base.inverted()
        for mesh,world in parts:
            mesh.transform(inv@world)
            ob=bpy.data.objects.new('TMP',mesh);studio.collection.objects.link(ob);obs.append(ob)
        bpy.ops.object.select_all(action='DESELECT')
        for ob in obs:ob.select_set(True)
        bpy.context.view_layer.objects.active=obs[0]
        bpy.ops.object.join();ob=obs[0];ob.name=part+'__'+mat
        ob.matrix_world=base
        # Keep UVs, geometry and animation pivots; runtime assigns shared separate-map PBR.
        ob.data.materials.clear()
        m=bpy.data.materials.get('RUNTIME_'+mat) or bpy.data.materials.new('RUNTIME_'+mat)
        m.use_nodes=True
        old=bpy.data.materials.get(mat)
        if old:m.diffuse_color=old.diffuse_color
        m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=m.diffuse_color
        ob.data.materials.append(m)
        ob['sourceMaterial']=mat;ob['rotor']=part!='Static'
        if part!='Static':
            pivot=studio.objects.get(part)
            if not pivot:
                pivot=bpy.data.objects.new(part,None);studio.collection.objects.link(pivot);pivot.matrix_world=base;pivot['rotor']=True
            ob.parent=pivot;ob.matrix_parent_inverse=Matrix.Identity(4);ob.matrix_basis=Matrix.Identity(4)
    path=OUT/('GR_'+role+'_01.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_active_scene=True,export_extras=True,export_cameras=False,export_lights=False,export_animations=False,export_yup=True)
    report.append({'role':role,'bytes':path.stat().st_size,'meshes':sum(o.type=='MESH' for o in studio.objects),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in studio.objects if o.type=='MESH')})
    print('EXPORTED',report[-1],flush=True)
assert before==hashlib.sha256(source.read_bytes()).hexdigest()
(OUT/'manifest.json').write_text(json.dumps({'source_unchanged':True,'source_sha256':before,'models':report},indent=2))
buffer=io.BytesIO()
with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED,9) as z:
    for p in OUT.iterdir():
        if p.suffix in {'.glb','.json'}:z.write(p,p.name)
raw=buffer.getvalue();parts=[]
for i in range(0,len(raw),2500000):
    chunk=raw[i:i+2500000];enc=base64.b64encode(chunk).decode();path=OUT/('transfer_%02d.b64'%(i//2500000));path.write_text('\n'.join(enc[j:j+5000] for j in range(0,len(enc),5000)))
    parts.append({'path':str(path),'bytes':len(chunk),'sha256':hashlib.sha256(chunk).hexdigest()})
(OUT/'transfer_manifest.txt').write_text(json.dumps({'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'parts':parts}))
print('TRANSFER',len(raw),len(parts),flush=True)
