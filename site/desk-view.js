// Drag distances are fractions of the viewport, so the rare turn takes the
// same deliberate travel on a phone and at a wide desk.
const frontLimit=.33;
const frontGain=.87;
const sideGain=.56;
const frontTravel=frontLimit/frontGain;
const rearThreshold=2.48;
const rearRelease=2.08;
const rearAngle=Math.PI-.17;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function deskView(){
  let travel=0,depth=0,rear=0,yaw=0,pitch=0,overshoot=0;
  let speed=0,lastMove=-Infinity;

  function drag(x,y,time){
    travel=clamp(travel-x,-rearThreshold,rearThreshold);
    if(rear && Math.abs(travel)<rearRelease)rear=0;
    if(!rear && Math.abs(travel)>=rearThreshold-.0001)rear=Math.sign(travel);
    depth=clamp(depth+y*1.85,0,1);
    const elapsed=time-lastMove;
    speed=elapsed>90?0:clamp((-x/Math.max(elapsed,8))*28,-.043,.043);
    lastMove=time;
    overshoot=0;
  }

  function release(time,cancelled){
    if(!cancelled && time-lastMove<90 && !rear)overshoot=speed;
    speed=0;lastMove=-Infinity;
  }

  function step(dt,reduced){
    const distance=Math.abs(travel);
    const side=frontLimit+Math.max(0,distance-frontTravel)*sideGain;
    const angle=rear?rear*rearAngle:Math.sign(travel)*Math.min(distance*frontGain,side);
    const target=angle+overshoot;
    const blend=reduced?1:1-Math.exp(-dt*(rear?7:14));
    yaw=Math.abs(target-yaw)<.004?target:yaw+(target-yaw)*blend;
    pitch=Math.abs(depth-pitch)<.005||reduced?depth:pitch+(depth-pitch)*blend;
    overshoot=reduced||Math.abs(overshoot)<.002?0:overshoot*Math.exp(-dt*12);

    return {
      yaw, below:pitch, rear:Math.abs(yaw)>2.24?Math.sign(yaw):0,
      move:Math.abs(angle-yaw)>.004||Math.abs(depth-pitch)>.005||Boolean(overshoot),
      behindWall:Math.abs(yaw)>1.89
    };
  }

  function faceFront(){
    travel=0;depth=0;rear=0;yaw=0;pitch=0;overshoot=0;
    speed=0;lastMove=-Infinity;
  }
  return {drag,release,step,faceFront};
}
