const test = require('node:test');
const assert = require('node:assert/strict');

test('rigid batches preserve indexed and unindexed triangle corners, normals, UVs and surface finishes', async () => {
  const T = await import('../site/vendor/three/three.module.min.js');
  const { batchDeskMeshes } = await import('../site/desk-batch.js');
  const parent = new T.Group(), joint = new T.Group();
  parent.position.set(1,2,-4);
  parent.rotation.x=.28;
  joint.scale.set(.7,2,1.3);
  joint.rotation.z=.6;
  parent.add(joint);
  const paint = new T.MeshStandardMaterial({color:0x61303f,roughness:.8});
  const brass = new T.MeshStandardMaterial({color:0xc09050,roughness:.3,metalness:.7});
  const base = new T.BoxGeometry(1,.2,.8);
  const knob = new T.Mesh(base,brass), face = new T.Mesh(base.toNonIndexed(),paint);
  knob.position.set(.4,.7,0);
  joint.add(knob);
  parent.add(face);
  parent.updateMatrixWorld(true);
  const shared = new T.MeshStandardMaterial({vertexColors:true});
  shared.userData.deskFinish=true;
  const merged = batchDeskMeshes([knob,face],parent,shared).toNonIndexed();
  let corner=0;
  for(const mesh of [knob,face]){
    const ref=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    ref.applyMatrix4(parent.matrixWorld.clone().invert().multiply(mesh.matrixWorld));
    for(let i=0;i<ref.attributes.position.count;i++,corner++){
      for(const name of ['position','normal','uv']){
        const a=merged.attributes[name],b=ref.attributes[name];
        for(let j=0;j<b.itemSize;j++)
          assert.ok(Math.abs(a.getComponent(corner,j)-b.getComponent(i,j))<1e-5,name);
      }
      const {color,roughness,metalness}=mesh.material;
      assert.ok(Math.abs(merged.attributes.color.getX(corner)-color.r)<1e-6);
      assert.ok(Math.abs(merged.attributes.deskFinish.getX(corner)-roughness)<=1/255);
      assert.ok(Math.abs(merged.attributes.deskFinish.getY(corner)-metalness)<=1/255);
    }
  }
  assert.equal(corner,merged.attributes.position.count);
  assert.equal(base.getAttribute('color'),undefined);
});

test('wall sheets keep both print sets and release individual quads for inspection and hover', async () => {
  const T=await import('../site/vendor/three/three.module.min.js');
  const {batchWallPosters,posterPickLayer}=await import('../site/desk-poster-batch.js');
  const wall=new T.Group(),material=new T.MeshStandardMaterial(),targets=new Map();
  for(const [index,id] of ['first','second','alternate'].entries()){
    const root=new T.Group(),face=new T.Mesh(new T.PlaneGeometry(2,1),material);
    root.position.x=index*3;root.userData.roomPoster=true;root.visible=id!=='alternate';
    root.add(face);wall.add(root);targets.set(id,{root});
  }
  wall.updateMatrixWorld(true);
  const sync=batchWallPosters(targets),sheet=wall.children.find(node=>node.isMesh);
  const indices=sheet.geometry.index.array;
  const painted=i=>new Set(indices.slice(i*6,i*6+6)).size>1;
  const face=targets.get('first').root.children[0];
  assert.deepEqual([0,1,2].map(painted),[true,true,false]);
  assert.equal(face.layers.isEnabled(0),false);
  assert.equal(face.layers.isEnabled(posterPickLayer),true);
  face.parent.userData.liftedPoster=true;sync(face.parent);
  assert.equal(painted(0),false);
  assert.equal(face.layers.isEnabled(0),true);
  face.parent.userData.liftedPoster=false;sync(face.parent);
  assert.equal(painted(0),true);
  for(const [id,{root}] of targets)root.visible=id==='alternate';
  sync();
  assert.deepEqual([0,1,2].map(painted),[false,false,true]);
  const last=targets.get('alternate').root;
  last.visible=false;sync(last);assert.equal(sheet.visible,false);
  last.visible=true;sync(last);assert.equal(sheet.visible,true);
  assert.deepEqual([0,1,2].map(painted),[false,false,true]);
});
