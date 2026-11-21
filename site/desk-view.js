// The front and side views move gently. Further travel continues around the
// back without switching to a separate camera angle.
const orbitTravel=2.48;
const frontGain=.87;
const sideGain=.56;
const frontLimit=.33;
const frontTravel=frontLimit/frontGain;
const rearAngle=Math.PI-.17;
const rearGain=rearAngle-frontLimit-(orbitTravel-frontTravel)*sideGain;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function deskView(){
  let travel=0,depth=0,yaw=0,pitch=0;
  let zoom=0, zoomTarget=0;

  function drag(x,y){
    travel=clamp(travel-x,-orbitTravel,orbitTravel);
    depth=clamp(depth+y*.98,-.68,1);
  }

  function wheel(delta){
    zoomTarget=clamp(zoomTarget-delta*.00115,Math.log(.72),Math.log(1.72));
  }

  function step(dt,reduced){
    const distance=Math.abs(travel);
    const side=frontLimit+Math.max(0,distance-frontTravel)*sideGain;
    const angle=Math.sign(travel)*(Math.min(distance*frontGain,side)+rearGain*(distance/orbitTravel)**4);
    const blend=reduced?1:1-Math.exp(-dt*36);
    yaw=Math.abs(angle-yaw)<.004?angle:yaw+(angle-yaw)*blend;
    pitch=Math.abs(depth-pitch)<.005?depth:pitch+(depth-pitch)*blend;
    zoom=Math.abs(zoomTarget-zoom)<.002?zoomTarget:zoom+(zoomTarget-zoom)*blend;

    return {
      yaw, below:pitch, zoom:Math.exp(zoom), rear:Math.abs(yaw)>2.24?Math.sign(yaw):0,
      move:yaw!==angle||pitch!==depth||zoom!==zoomTarget
    };
  }

  function faceFront(){
    travel=0;depth=0;yaw=0;pitch=0;
  }
  return {drag,step,faceFront,wheel};
}
