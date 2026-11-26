import * as T from './vendor/three/three.module.min.js';

export function makeDeskShadow(shadow){
  const {x,y}=shadow.mapSize;
  const depth=new T.DepthTexture(x,y,T.UnsignedIntType);
  depth.compareFunction=T.LessEqualCompare;
  depth.minFilter=depth.magFilter=T.LinearFilter;
  shadow.map=new T.WebGLRenderTarget(x,y,{depthTexture:depth,minFilter:T.NearestFilter,magFilter:T.NearestFilter});
  shadow.camera.updateProjectionMatrix();
  return depth;
}

// Three's soft sun shadow is a separable four-by-four depth comparison.
// Hardware filters each adjacent pair together, giving the same weights in four reads.
const sunFilter=`
#if defined(USE_SHADOWMAP) && defined(SHADOWMAP_TYPE_PCF_SOFT)
uniform highp sampler2DShadow deskSunDepth;
float deskSunShadow(vec2 size, float intensity, float bias, float radius, vec4 coord){
  vec3 p=coord.xyz/coord.w;
  p.z+=bias;
  if(p.x<0.0 || p.y<0.0 || p.x>1.0 || p.y>1.0 || p.z>1.0)return 1.0;
  vec2 f=fract(p.xy*size+0.5);
  vec2 lowWeight=2.0-f, highWeight=1.0+f;
  vec2 base=p.xy-f/size;
  vec2 lo=base+(-1.0+1.0/lowWeight)/size;
  vec2 hi=base+(1.0+f/highWeight)/size;
  float shadow=lowWeight.y*(lowWeight.x*texture(deskSunDepth,vec3(lo,p.z))
                            +highWeight.x*texture(deskSunDepth,vec3(hi.x,lo.y,p.z)))
              +highWeight.y*(lowWeight.x*texture(deskSunDepth,vec3(lo.x,hi.y,p.z))
                             +highWeight.x*texture(deskSunDepth,vec3(hi,p.z)));
  return mix(1.0,shadow/9.0,intensity);
}
#endif`;

let lightInfo=T.ShaderChunk.lights_pars_begin;
for(const lamp of ['pointLight','spotLight']){
  const start='vec3 lVector = '+lamp+'.position';
  lightInfo=lightInfo.replace(start,`if (${lamp}.color == vec3(0.0)) {
    light.color = vec3(0.0); light.visible = false; return;
  }
  ${start}`);
}
// Reject back-facing direct light before sampling the sun shadow or evaluating a BRDF.
// Clearcoat can have a different normal and uses Three's original visibility test.
const direct=T.ShaderChunk.lights_fragment_begin
  .replaceAll('RE_Direct( directLight,','if (directLight.visible) RE_Direct( directLight,');
let hardwareSun=direct.replace('getShadow( directionalShadowMap[ i ],','deskSunShadow(');
for(const call of ['getPointLightInfo( pointLight, geometryPosition, directLight );',
                   'getSpotLightInfo( spotLight, geometryPosition, directLight );',
                   'getDirectionalLightInfo( directionalLight, directLight );']){
  hardwareSun=hardwareSun.replace(call,call+`
#ifndef USE_CLEARCOAT
  if(directLight.visible)directLight.visible=dot(geometryNormal,directLight.direction)>0.0;
#endif`);
}

export function prepareDeskLighting(shader,shadowDepth){
  if(shadowDepth)shader.uniforms.deskSunDepth={value:shadowDepth};
  shader.fragmentShader=shader.fragmentShader
    .replace('#include <lights_pars_begin>',lightInfo)
    .replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n'+(shadowDepth?sunFilter:''))
    .replace('#include <lights_fragment_begin>',shadowDepth?hardwareSun:direct);
}

// A white texel and a white vertex tint are neutral. Use them to share programs
// without adding texture branches to the lighting calculations for each pixel.
export function shareDeskSurfacePrograms(room,posters){
  const seen=new Set();
  for(const {root} of posters.values())if(root.userData.roomPoster)
    for(const face of root.children)seen.add(face.material);
  const neutral=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);
  neutral.needsUpdate=true;
  const colorVertex=T.ShaderChunk.color_vertex.replace('vColor *= color;', 'if(deskVertexColors)vColor *= color;');
  room.traverse(mesh=>{
    const mat=mesh.material;
    if(!mat?.isMeshStandardMaterial || mat.isMeshPhysicalMaterial || mat.userData.deskFinish || seen.has(mat))return;
    seen.add(mat);
    const colors=mat.vertexColors;
    mat.map??=neutral;mat.vertexColors=true;
    const original=mat.onBeforeCompile;
    const key=mat.customProgramCacheKey()+'/desk-surface';
    mat.customProgramCacheKey=()=>key;
    mat.onBeforeCompile=function(shader,renderer){
      original.call(this,shader,renderer);
      shader.uniforms.deskVertexColors={value:colors};
      shader.vertexShader='uniform bool deskVertexColors;\n'+shader.vertexShader
        .replace('#include <color_vertex>',colorVertex);
    };
  });
}
