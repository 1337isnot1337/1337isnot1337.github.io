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
