// Cross-sections of a lacquered single-engine display model. Its nose points along +Z.
import * as T from './vendor/three/three.module.min.js';

const mainWing=[[0,.41,-.24,.080,-.042],[.22,.40,-.24,.076,-.040],[.65,.32,-.24,.060,-.018],
  [.80,.291,-.25,.054,-.007],[.86,.279,-.25,.051,0],[.91,.267,-.252,.049,.007],
  [1.13,.22,-.26,.043,.028],[1.29,.18,-.255,.037,.046],
  [1.44,.09,-.235,.029,.065],[1.51,-.015,-.18,.019,.070],[1.535,-.095,-.103,.004,.072]];

export function wingUnderside(x,z){
  const span=Math.abs(x);
  const i=mainWing.findIndex(([station])=>station>span);
  const left=mainWing[i-1],right=mainWing[i];
  function skin([,front,back,thick,rise]){
    const chord=(z-back)/(front-back);
    const section=Math.sqrt(Math.max(0,1-(2*chord-1)**2));
    return rise-thick*section*(.28+.72*chord);
  }
  return T.MathUtils.lerp(skin(left),skin(right),(span-left[0])/(right[0]-left[0]));
}

export function airframeGeometry() {
  const positions=[], normals=[], colors=[];
  const ivory=new T.Color(0xf3dfb4), coral=new T.Color(0xb94c40);
  const trim=new T.Color(0x783e38), glass=new T.Color(0x426571);
  function skin(stations,section,paint) {
    const vertices=[], indices=[], panels=[];
    const segments=32;
    stations.forEach((station,i)=>{
      for(let j=0;j<segments;j++){
        vertices.push(...section(station,j*2*Math.PI/segments));
        if(i===stations.length-1)continue;
        const a=i*segments+j,b=i*segments+(j+1)%segments;
        indices.push(a,b,a+segments,b,b+segments,a+segments);
        panels.push(paint(station,stations[i+1],(j+.5)*2*Math.PI/segments));
      }
    });
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const pos=geometry.attributes.position, normal=geometry.attributes.normal;
    indices.forEach((index,i)=>{
      positions.push(pos.getX(index),pos.getY(index),pos.getZ(index));
      normals.push(normal.getX(index),normal.getY(index),normal.getZ(index));
      const c=panels[Math.floor(i/6)];
      colors.push(c.r,c.g,c.b);
    });
    geometry.dispose();
  }
  // Tailpost, turtledeck, cabin and engine cowling have different elliptical stations.
  const round=([z,rx,ry,y],t)=>[rx*Math.cos(t),y+ry*Math.sin(t),z];
  skin([[-1.08,.008,.012,.05],[-.98,.047,.069,.057],[-.76,.086,.113,.047],
    [-.47,.135,.145,.026],[-.20,.17,.167,.01],[.10,.195,.19,0],
    [.37,.204,.193,-.006],[.58,.188,.178,-.008],[.64,.177,.171,-.005],
    [.70,.175,.167,0],[.87,.158,.148,0],[.94,.118,.115,0],[.944,.003,.003,0]],
    round,([z],next,t)=>{
      if(z>=.64)return z<.70?trim:coral;
      const stripe=Math.sin(t);
      return stripe>=0 && stripe<.38 ? coral : ivory;
    });
  skin([[-.48,.003,.004,.151],[-.33,.098,.115,.145],[-.17,.141,.180,.14],
    [.04,.151,.191,.135],[.18,.135,.162,.137],[.31,.105,.092,.14],[.40,.008,.014,.15]],
    round,()=>glass);

  // The wing section has a rounded leading edge, a fine trailing edge and visible dihedral.
  function foil([span,front,back,thick,rise],t) {
    const chord=(1+Math.cos(t))/2;
    return [span,rise+thick*Math.sin(t)*(.28+.72*chord),back+(front-back)*chord];
  }
  function wing(half,paint){
    const spans=[...half].reverse().concat(half.slice(1).map(([x,...shape])=>[-x,...shape]));
    skin(spans,foil,([a],[b])=>paint(Math.abs((a+b)/2)));
  }
  wing(mainWing,x=>x>1.13 || (x>.80 && x<.86) ? ivory : coral);
  wing([[0,-.68,-1.03,.042,.063],[.22,-.70,-1.01,.032,.071],
    [.39,-.78,-1.0,.024,.079],[.52,-.87,-.968,.015,.085],[.54,-.931,-.939,.003,.086]],
    x=>x>.39?coral:ivory);
  // Turn an airfoil upright for a tapered fin with a contrasting painted cap.
  skin([[0,-.63,-1.055,.042,0],[.11,-.71,-1.052,.036,0],[.26,-.81,-1.04,.029,0],
    [.38,-.86,-1.018,.020,0],[.44,-.91,-.99,.013,0],[.454,-.954,-.968,.003,0]],
    (station,t)=>{const [h,x,z]=foil(station,t);return [x,h+.065,z];},
    ([h])=>h>=.26?coral:ivory);

  const shape=new T.BufferGeometry();
  shape.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  shape.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  shape.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  return shape;
}
