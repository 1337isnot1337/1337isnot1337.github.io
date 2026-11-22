// The front and side views move gently. Further travel continues around the
// back without switching to a separate camera angle.
const orbitTravel=2.48;
const frontGain=.87;
const sideGain=.56;
const frontLimit=.33;
const frontTravel=frontLimit/frontGain;
const rearAngle=Math.PI;
const rearGain=rearAngle-frontLimit-(orbitTravel-frontTravel)*sideGain;
const horizontalSteeringStart=.60;
const verticalSteeringStart=.40;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const wrap=(value,limit)=>value>limit?value-2*limit:value< -limit?value+2*limit:value;
const edgeSpeed=(value,threshold)=>{
  const edge=clamp((Math.abs(value)-threshold)/(1-threshold),0,1);
  return Math.sign(value)*edge*(.25+.75*edge);
};

export function deskView(){
  let travel=0,depth=0,yaw=0,pitch=0;
  let zoom=0, zoomTarget=0, lookX=0, lookY=0, lookDelay=0;

  function drag(x,y){
    travel=wrap(travel-x,orbitTravel);
    depth=clamp(depth+y*.98,-.68,1);
  }

  function look(x,y,overObject=false){
    const wasLooking=Boolean(lookX||lookY);
    lookX=edgeSpeed(x,horizontalSteeringStart);
    lookY=edgeSpeed(y,verticalSteeringStart);
    const looking=Boolean(lookX||lookY);
    if(!looking)lookDelay=0;
    else if(!wasLooking)lookDelay=overObject?.38:.16;
    return looking;
  }

  function wheel(delta){
    zoomTarget=clamp(zoomTarget-delta*.00115,Math.log(.72),Math.log(1.72));
  }

  function step(dt,reduced){
    const lastTravel=travel,lastDepth=depth;
    // Give a passing pointer time to click an object near the edge.
    const waiting=lookDelay>0;
    const time=waiting?Math.min(dt,.04):dt;
    const steerTime=Math.max(0,time-lookDelay);
    lookDelay=Math.max(0,lookDelay-time);
    const position=Math.abs(travel)/orbitTravel;
    // Match the angular speed near the front and the back despite the drag curve.
    const slope=(Math.abs(travel)<frontTravel?frontGain:sideGain)+4*rearGain/orbitTravel*position**3;
    drag(lookX*steerTime*1.60/slope,lookY*steerTime*.94);
    const distance=Math.abs(travel);
    const side=frontLimit+Math.max(0,distance-frontTravel)*sideGain;
    const angle=Math.sign(travel)*(Math.min(distance*frontGain,side)+rearGain*(distance/orbitTravel)**4);
    const blend=reduced?1:1-Math.exp(-dt*36);
    const turn=wrap(angle-yaw,Math.PI);
    yaw=Math.abs(turn)<.004?angle:wrap(yaw+turn*blend,Math.PI);
    pitch=Math.abs(depth-pitch)<.005?depth:pitch+(depth-pitch)*blend;
    zoom=Math.abs(zoomTarget-zoom)<.002?zoomTarget:zoom+(zoomTarget-zoom)*blend;

    return {
      yaw, below:pitch, zoom:Math.exp(zoom), rear:Math.abs(yaw)>2.24?Math.sign(yaw):0,
      move:waiting||travel!==lastTravel||depth!==lastDepth||Math.abs(wrap(yaw-angle,Math.PI))>.000001||pitch!==depth||zoom!==zoomTarget
    };
  }

  function faceFront(){
    travel=0;depth=0;yaw=0;pitch=0;
    look(0,0);
  }
  return {drag,look,step,faceFront,wheel};
}
