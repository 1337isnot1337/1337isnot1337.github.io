// Bake rigid desk parts into their final buffers without copying a geometry for each mesh.
import * as T from './vendor/three/three.module.min.js';

export function batchDeskMeshes(meshes,parent,material){
  const first=meshes[0], combined=new T.BufferGeometry();
  let vertexCount=0,indexCount=0,indexed=false;
  for(const {geometry} of meshes){
    const count=geometry.attributes.position.count;
    vertexCount+=count;indexCount+=geometry.index?.count??count;
    indexed ||= Boolean(geometry.index);
  }
  for(const [name,attribute] of Object.entries(first.geometry.attributes)){
    const {array,itemSize,normalized}=attribute;
    combined.setAttribute(name,new T.BufferAttribute(new array.constructor(vertexCount*itemSize),itemSize,normalized));
  }
  if(material!==first.material)
    combined.setAttribute('color',new T.Float32BufferAttribute(vertexCount*3,3));
  if(material.userData.deskFinish)
    combined.setAttribute('deskFinish',new T.BufferAttribute(new Uint8Array(vertexCount*2),2,true));
  if(indexed){
    const Index=vertexCount>65535?Uint32Array:Uint16Array;
    combined.setIndex(new T.BufferAttribute(new Index(indexCount),1));
  }

  const inverse=parent.matrixWorld.clone().invert(),matrix=new T.Matrix4(),normalMatrix=new T.Matrix3();
  const identity=new T.Matrix4();
  let vertex=0,index=0;
  for(const mesh of meshes){
    const {geometry}=mesh,count=geometry.attributes.position.count;
    if(mesh.parent===parent)matrix.copy(mesh.matrix);
    else matrix.multiplyMatrices(inverse,mesh.matrixWorld);
    const local=matrix.equals(identity);
    if(!local)normalMatrix.getNormalMatrix(matrix);
    for(const [name,attribute] of Object.entries(geometry.attributes)){
      const out=combined.getAttribute(name), start=vertex*out.itemSize;
      out.array.set(attribute.array,start);
      if(local || (name!=='position' && name!=='normal' && name!=='tangent'))continue;
      const slice=new T.BufferAttribute(out.array.subarray(start,start+attribute.array.length),out.itemSize,out.normalized);
      if(name==='position')slice.applyMatrix4(matrix);
      else if(name==='normal')slice.applyNormalMatrix(normalMatrix);
      else slice.transformDirection(matrix);
    }
    if(material!==mesh.material){
      const color=combined.attributes.color,{r,g,b}=mesh.material.color;
      for(let n=vertex;n<vertex+count;n++)color.setXYZ(n,r,g,b);
      const finish=combined.attributes.deskFinish;
      if(finish){
        const rough=Math.round(255*mesh.material.roughness),metal=Math.round(255*mesh.material.metalness);
        for(let n=2*vertex;n<2*(vertex+count);n+=2){finish.array[n]=rough;finish.array[n+1]=metal;}
      }
    }
    if(indexed){
      const original=geometry.index, length=original?.count??count;
      for(let i=0;i<length;i++)combined.index.array[index++]=vertex+(original?original.getX(i):i);
    }
    vertex+=count;
  }
  return combined;
}
