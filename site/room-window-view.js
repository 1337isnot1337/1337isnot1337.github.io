import * as T from './vendor/three/three.module.min.js';

export function buildWindowView(outdoors, {photo,cylinder,finish,night}) {
  // Every ray through the window meets this rear arc, even from the side of the desk.
  const landscape=new T.MeshBasicMaterial({color:0xb8c4c5,side:T.BackSide,toneMapped:false});
  const valley=photo('/assets/furniture/window-valley.webp?v=2',()=>{
    // The panorama gets its own GPU storage when the full image is ready.
    landscape.map=valley;
    landscape.color.set(0xffffff);
    landscape.needsUpdate=true;
  });
  valley.magFilter=T.NearestFilter;
  valley.minFilter=T.NearestMipmapLinearFilter;
  valley.anisotropy=1;
  landscape.onBeforeCompile=shader=>{
    shader.uniforms.windowNight=night;
    shader.fragmentShader='uniform float windowNight;\n'+shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      #ifdef USE_MAP
        vec2 sky=vMapUv;
        // The photo ends before the cylindrical backdrop does. Blend to
        // open sky before the top row can smear across steep sightlines.
        vec3 highSky=mix(vec3(.178,.344,.637),vec3(.330,.325,.490),smoothstep(.56,.96,sky.x));
        float abovePhoto=clamp(sky.y-1.0,0.0,1.0);
        highSky=mix(highSky,vec3(.072,.196,.409),abovePhoto*.7);
        diffuseColor.rgb=mix(diffuseColor.rgb,highSky,smoothstep(.87,1.0,sky.y));
        float luminance=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        vec3 moonlit=vec3(.009,.017,.036)+vec3(.026,.047,.093)*luminance
          +diffuseColor.rgb*vec3(.049,.076,.132);
        float upperSky=smoothstep(.63,.76,sky.y);
        vec2 starGrid=sky*vec2(123.0,85.0);
        vec2 cell=floor(starGrid);
        float grain=fract(sin(dot(cell,vec2(21.19,56.43)))*4373.63);
        float star=(1.0-smoothstep(.020,.19,length(fract(starGrid)-vec2(.5))))*step(.967,grain);
        vec2 moon=(sky-vec2(.535,.814))*vec2(1.5,1.0);
        float moonDistance=length(moon);
        float disk=1.0-smoothstep(.013,.015,moonDistance);
        float halo=(1.0-smoothstep(.008,.078,moonDistance))*.055;
        moonlit+=upperSky*(vec3(.54,.68,.87)*star*.73+vec3(.67,.74,.80)*(disk+halo));
        diffuseColor.rgb=mix(diffuseColor.rgb,moonlit,windowNight);
      #endif
    `);
  };
  const curve=new T.CylinderGeometry(28,28,68,80,1,true,Math.PI/2,Math.PI);
  const uv=curve.attributes.uv, points=curve.attributes.position;
  // The extra height keeps steep sightlines covered. The edges clamp to sky and forest.
  const panoramaSpread=2.45;
  for(let i=0;i<uv.count;i++){
    const angle=1-2*uv.getX(i);
    const u=.5+.5*Math.tanh(angle*panoramaSpread)/Math.tanh(panoramaSpread);
    uv.setXY(i,u,.5+points.getY(i)/19);
  }
  const vista=new T.Mesh(curve,landscape);
  vista.position.y=5.8;
  outdoors.add(vista);

  // The nearest trees have real silhouettes and move against the distant valley.
  const positions=[],colors=[];
  const shade=new T.Color(), deep=new T.Color(0x27483d), light=new T.Color(0x90914b);
  let seed=19027;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const bark=finish(0x574934,.94);
  function triangle(a,b,c,brightness) {
    positions.push(...a,...b,...c);
    shade.copy(deep).lerp(light,brightness);
    for(const factor of [.70,.91,1.16])colors.push(shade.r*factor,shade.g*factor,shade.b*factor);
  }

  for(const [x,z,height,width] of [
    [-4.8,-4.7,4.1,.88],[-3.5,-6.9,3.0,.68],[-6.1,-8.4,4.6,1.12],
    [4.6,-5.7,3.7,.83],[6.2,-7.8,4.2,1.08],[3.2,-9.6,2.8,.64],
    [-7.2,-11.7,3.9,1.02],[7.8,-11.2,4.3,1.00],
  ]){
    cylinder(outdoors,.019,.083,height,bark,x,height*.5,z,9).castShadow=false;
    for(let layer=0;layer<15;layer++){
      const age=layer/14, radius=width*(1-age*.94);
      const y=height*(.25+age*.73);
      const count=layer<11?7:5;
      for(let branch=0;branch<count;branch++){
        const angle=(branch/count+layer*.231+random()*.09)*2*Math.PI;
        const dx=Math.cos(angle),dz=Math.sin(angle);
        const reach=radius*(.69+random()*.33), sweep=height*(.012+random()*.026);
        const tip=[x+dx*reach,y+sweep,z+dz*reach];
        const base=[x,y-height*.033,z];
        const shoulder=[x+dx*reach*.29,y+height*.036,z+dz*reach*.29];
        triangle(base,shoulder,tip,.28+dx*.14+random()*.13);
        for(let node=0;node<5;node++){
          const along=(node+1)/6;
          const sx=x+dx*reach*along,sz=z+dz*reach*along;
          const sy=y+sweep*along, span=radius*(.23-.15*along);
          for(const side of [-1,1]){
            const needle=[sx+dx*span*.61-dz*span*side,sy+span*(.13+random()*.64),sz+dz*span*.61+dx*span*side];
            const root=[sx-dx*span*.47,sy-span*.28,sz-dz*span*.47];
            triangle(root,[sx+dx*span*.51,sy+span*.41,sz+dz*span*.51],needle,.38+dx*.16+random()*.28);
            triangle(root,[sx+dx*span*.49,sy-span*.25,sz+dz*span*.49],needle,.19+dx*.12+random()*.20);
          }
        }
      }
    }
    triangle([x-width*.16,height*.94,z],[x+width*.16,height*.94,z],[x,height*1.015,z],.54);
    triangle([x,height*.94,z-width*.16],[x,height*.94,z+width*.16],[x,height*1.015,z],.44);
  }
  const needles=new T.BufferGeometry();
  needles.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  needles.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  needles.computeVertexNormals();
  outdoors.add(new T.Mesh(needles,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.93})));
}
