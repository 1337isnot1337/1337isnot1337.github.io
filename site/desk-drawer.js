const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));

export function drawerTravel(initiallyOpen){
  let amount=initiallyOpen?1:0;
  let target=amount,grip=null,previousVelocity=0;

  function toggle(open){
    target=open?1:0;
  }

  function drag(dy,time){
    grip??={position:amount,furthest:amount,closing:0,last:time-16};
    const resistance=dy>0 ? 1-.72*clamp((grip.position-.74)/.26,0,1) : 1;
    const delta=dy*3.45*resistance;
    grip.position=clamp(grip.position+delta,0,1);
    const speed=clamp(delta*1000/Math.max(time-grip.last,12),-7,7);
    grip.furthest=Math.max(grip.position,grip.furthest);
    grip.closing=Math.min(speed,grip.closing);
    grip.last=time;
  }

  function release(time,cancelled){
    if(!grip)return null;
    const {position,furthest,closing,last}=grip;
    grip=null;
    if(cancelled)return null;
    const velocity=time-last<140?closing:0;
    target=position<.105 || (velocity<-2.9&&position<.24)?0:position>.94?1:position;
    return {target,velocity,hadTravel:furthest>.21};
  }

  function step(dt,immediate){
    const before=amount;
    const goal=grip?.position??target;
    const blend=grip||immediate?1:1-Math.exp(-dt*(goal===0?10:12));
    amount=Math.abs(amount-goal)<.003?goal:amount+(goal-amount)*blend;
    const velocity=(amount-before)/dt;
    const impulse=clamp((previousVelocity-velocity)*.56,-2.4,2.4);
    previousVelocity=velocity;
    return {amount,target,impulse,moving:Math.abs(amount-goal)>.003};
  }

  return {toggle,drag,release,step};
}
