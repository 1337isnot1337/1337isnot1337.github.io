import * as T from './vendor/three/three.module.min.js';
import { shelfGems } from './shelf-gems.js?v=1';

const actions={shutter:'release the shutter',slide:'move the caliper jaw',play:'start or stop the tape',
  'compass-face':'tap the compass'};

export function shelfInspection(copy){
  const parts=new Map();
  copy.traverse(node=>{if(node.userData.shelfPart)parts.set(node.userData.shelfPart,node);});
  const primary=Object.keys(actions).find(action=>parts.has(action));
  if(!primary)return shelfGems(copy,parts);
  const shutter=parts.get('shutter'),slide=parts.get('slide'),play=parts.get('play'),needle=parts.get('needle');
  const axis=new T.Vector3(),north=new T.Vector3(),inverse=new T.Quaternion();
  const home=shutter?.position.y;
  let release=-Infinity,shutterPending=false,opening=0,jaw=slide?.position.x,playing=false,needleAngle=0,jostle=0;

  function activate(control,quiet){
    if(control==='shutter'||control==='lens'){
      if(quiet)opening=opening===0?.62:0;
      else shutterPending=true;
    }else if(control==='slide')jaw=jaw>.13?.039:jaw+.06;
    else if(control==='play'){
      playing=!playing;
      if(playing&&quiet)for(const i of [0,1])parts.get('recorder-reel-'+i).rotation.z+=.8+i*.36;
    }else if(control==='compass-face'){
      if(!quiet)jostle+=.52;
    }else return false;
    return true;
  }
  function drag(control,x,y,pose){
    if(control!=='slide')return false;
    axis.set(1,0,0).applyQuaternion(pose);
    jaw=T.MathUtils.clamp(jaw+(x*axis.x-y*axis.y)*.23,-.123,.194);
    return true;
  }
  function paint(time,dt,pose,quiet){
    const easing=quiet?1:1-Math.exp(-dt*17);
    let animate=false;
    if(shutter){
      if(shutterPending){release=time;shutterPending=false;}
      const phase=(time-release)/305,press=phase>=0&&phase<1?Math.sin(Math.PI*Math.pow(phase,.53)):0;
      shutter.position.y=home-press*.012;
      for(let i=0;i<7;i++){
        const blade=parts.get('aperture-'+i);
        blade.rotation.z=i*Math.PI*2/7+press*.51+opening;
        blade.scale.setScalar(1-press*.31-opening*.31);
      }
      animate=phase<1;
    }
    if(slide){
      slide.position.x=Math.abs(slide.position.x-jaw)<.001?jaw:T.MathUtils.lerp(slide.position.x,jaw,easing);
      animate=slide.position.x!==jaw;
    }
    if(play){
      play.position.z=playing?.122:.133;
      parts.get('recorder-pilot').position.z=playing?.139:.125;
      if(playing&&!quiet){
        for(const [i,speed] of [3.9,5.5].entries())parts.get('recorder-reel-'+i).rotation.z+=dt*speed;
        animate=true;
      }
    }
    if(needle){
      // Project room north onto the compass face. A nearly vertical face
      // retains its last heading if north is perpendicular to it.
      north.set(0,0,-1).applyQuaternion(inverse.copy(pose).invert());
      const goal=(Math.hypot(north.x,north.y)>.08?Math.atan2(-north.x,north.y):needleAngle)+jostle;
      const turn=Math.atan2(Math.sin(goal-needleAngle),Math.cos(goal-needleAngle));
      needleAngle+=Math.abs(turn)<.004?turn:turn*easing*.56;
      jostle*=Math.exp(-dt*7);
      if(Math.abs(jostle)<.004)jostle=0;
      needle.rotation.z=needleAngle;
      animate=!quiet&&(Math.abs(turn)>.004||jostle!==0);
    }
    return animate;
  }
  return {primary,label:actions[primary],activate,drag,paint};
}
