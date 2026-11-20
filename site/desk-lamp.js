import { leafPoint } from './desk-botany.js?v=1';

function hull(points){
  const sorted=points.sort(([ax,ay],[bx,by])=>ax-bx||ay-by);
  const bend=([ax,ay],[bx,by],[cx,cy])=>(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
  function chain(list){
    const result=[];
    for(const point of list){
      while(result.length>=2&&bend(result.at(-2),result.at(-1),point)<=0)result.pop();
      result.push(point);
    }
    return result.slice(0,-1);
  }
  return [...chain(sorted),...chain(sorted.reverse())];
}

export function lampProjection(texture,airframe,leafRotation){
  const ctx=texture.image.getContext('2d');
  const tail=[];
  for(let i=0;i<airframe.count;i++){
    const z=airframe.getZ(i);
    if(z<-.66)tail.push([airframe.getX(i),airframe.getY(i)+.12*(z+1)]);
  }
  const outline=hull(tail);
  const leaves=[1,-1].map(side=>Array.from({length:33},(_,i)=>{
    const t=i<=16?i/16:(32-i)/16;
    const [x,,z]=leafPoint(t,i<=16?side:-side);
    return [x,z];
  }));
  function silhouette(points,x,y,angle,sx,sy){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(sx,sy);
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fill();ctx.restore();
  }
  let previousKey='';
  return function render(yaw,pitch,plantAngle,airframeAngle){
    const key=[yaw,pitch,plantAngle,airframeAngle].map(value=>Math.round(value*80)).join('/');
    if(key===previousKey)return;
    previousKey=key;
    const {width,height}=texture.image;
    ctx.resetTransform();
    ctx.clearRect(0,0,width,height);
    // Work in a unit image. The lamp shifts the projected profiles relative
    // to one another. Small changes in direction break apart the silhouette.
    ctx.scale(width,height);
    const shift=(yaw+.83)*1.65;
    const rise=(pitch-.13)*.70;
    const strength=Math.max(0,1-Math.abs(shift)*2.1-Math.abs(rise)*1.25);
    ctx.fillStyle='rgba(39,31,29,'+(.44*strength)+')';
    ctx.filter='blur(1.4px)';
    silhouette(outline,.51-shift,.76+rise,airframeAngle*.23,.47,-.66);
    for(const [i,side] of [-1,1].entries()){
      const leafYaw=side*.29+plantAngle*.20+leafRotation();
      silhouette(leaves[i],.51+side*.10+shift,.64-rise,leafYaw,.80,-1.31);
    }
    ctx.filter='none';
    texture.needsUpdate=true;
  };
}
