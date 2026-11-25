// All desk bevels have one segment. Their normals and corner angles are identical
// at every size, so compute the rounded-box template once.
import * as T from './vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';

// RoundedBoxGeometry expands a box to triangles. Reuse the original face grid
// so adjacent triangles share their positions, normals and UVs.
const rounded=new RoundedBoxGeometry(1,1,1,1,.125);
const template=new T.BoxGeometry(1,1,1,3,3,3);
for(const [name,attribute] of Object.entries(template.attributes)){
  const source=rounded.getAttribute(name);
  for(let i=0;i<template.index.count;i++){
    const vertex=template.index.getX(i);
    for(let axis=0;axis<attribute.itemSize;axis++)
      attribute.setComponent(vertex,axis,source.getComponent(i,axis));
  }
}
const templateArc=arcFraction(1,.125);
function arcFraction(length,radius){
  const arc=Math.PI*radius/4;
  return arc/(2*arc+Math.max(0,length-2*radius));
}
function rescaleUV(uv,arc){
  return uv<.5 ? uv*arc/templateArc : 1-(1-uv)*arc/templateArc;
}

export function deskBox(w,h,d,radius){
  const geometry=new T.BufferGeometry().copy(template);
  const {position,normal,uv}=geometry.attributes;
  const half=[w/2-radius,h/2-radius,d/2-radius];
  const arcs=[arcFraction(w,radius),arcFraction(h,radius),arcFraction(d,radius)];
  const verticesPerFace=position.count/6;
  for(let i=0;i<position.count;i++){
    for(let axis=0;axis<3;axis++){
      const j=i*3+axis;
      position.array[j]=Math.sign(position.array[j])*half[axis]+normal.array[j]*radius;
    }
    // The pairs of faces normal to X, Y and Z use Z/Y, X/Z and X/Y UVs.
    const axis=Math.floor(i/(2*verticesPerFace));
    uv.setXY(i,rescaleUV(uv.getX(i),arcs[axis===0?2:0]),rescaleUV(uv.getY(i),arcs[axis===1?2:1]));
  }
  return geometry;
}
