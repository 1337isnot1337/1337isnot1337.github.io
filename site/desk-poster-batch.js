import * as T from './vendor/three/three.module.min.js';
import { batchDeskMeshes } from './desk-batch.js?v=1';

// Each wall already has a print atlas. Submit its stationary quads together.
// The original quads remain available for precise picking and close inspection.
export const posterPickLayer=1;
export function batchWallPosters(targets){
  const groups=new Map();
  for(const {root} of targets.values()){
    if(!root.userData.roomPoster)continue;
    const wall=root.parent;
    for(const mesh of root.children){
      if(!mesh.isMesh)continue;
      const key=[wall.id,mesh.material.id,mesh.castShadow,mesh.receiveShadow].join('/');
      if(!groups.has(key))groups.set(key,{wall,meshes:[]});
      groups.get(key).meshes.push(mesh);
    }
  }
  const slotsByRoot=new Map();
  for(const {wall,meshes} of groups.values()){
    if(meshes.length<2)continue;
    const material=meshes[0].material,geometry=batchDeskMeshes(meshes,wall,material);
    geometry.computeBoundingSphere();
    const sheet=new T.Mesh(geometry,material);
    sheet.castShadow=meshes[0].castShadow;sheet.receiveShadow=meshes[0].receiveShadow;
    wall.add(sheet);
    sheet.matrixAutoUpdate=false;
    const index=geometry.index.setUsage(T.DynamicDrawUsage),original=index.array.slice();
    let start=0,visible=meshes.length;
    for(const mesh of meshes){
      mesh.layers.set(posterPickLayer);
      const root=mesh.parent,offset=start,count=mesh.geometry.index.count;
      start+=count;
      let included=true;
      function sync(){
        const inSheet=root.visible && !root.userData.liftedPoster;
        if(included===inSheet)return;
        if(inSheet){
          index.array.set(original.subarray(offset,offset+count),offset);
          mesh.layers.disable(0);visible++;
        }else{
          // Degenerate just this quad while its original is lifted or put away.
          index.array.fill(original[offset],offset,offset+count);
          mesh.layers.enable(0);visible--;
        }
        included=inSheet;sheet.visible=visible>0;
        index.addUpdateRange(offset,count);index.needsUpdate=true;
      }
      if(!slotsByRoot.has(root))slotsByRoot.set(root,[]);
      slotsByRoot.get(root).push(sync);
      sync();
    }
  }
  return root=>{
    if(root){for(const sync of slotsByRoot.get(root)||[])sync();}
    else for(const slots of slotsByRoot.values())for(const sync of slots)sync();
  };
}
