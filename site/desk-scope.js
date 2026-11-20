export function paintScope(ctx,width,height,mode){
  const phosphor='#d4f3a9';
  ctx.fillStyle='#122d29';ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#335146';ctx.lineWidth=.004;
  for(let i=1;i<10;i++){
    ctx.beginPath();ctx.moveTo(i*width/10,0);ctx.lineTo(i*width/10,height);ctx.stroke();
  }
  for(let i=1;i<6;i++){
    ctx.beginPath();ctx.moveTo(0,i*height/6);ctx.lineTo(width,i*height/6);ctx.stroke();
  }
  ctx.strokeStyle=ctx.fillStyle=phosphor;ctx.lineWidth=.008;
  ctx.shadowColor='#a8ee80';ctx.shadowBlur=4;
  const path=points=>{
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*width,y*height):ctx.moveTo(x*width,y*height));ctx.stroke();
  };
  if(mode===0){
    path(Array.from({length:151},(_,i)=>{
      const t=i/150;
      return [t,.50+.25*Math.sin(19*t-6*t*t)*(1-.40*t)];
    }));
  }else if(mode===1){
    ctx.font='bold 0.13px monospace';ctx.textAlign='center';
    for(const [index,rank] of [15,10,4].entries()){
      const x=.105+index*.275;
      ctx.strokeRect(x*width,.21*height,.225*width,.56*height);
      ctx.fillText(rank,(x+.112)*width,height*.60);
    }
  }else if(mode===2){
    const bits=(42).toString(2).padStart(9,'0');
    const points=[];
    for(const [i,bit] of [...bits].entries()){
      const level=bit==='1'?.28:.71;
      points.push([.08+i*.092,level],[.08+(i+1)*.092,level]);
    }
    path(points);
    ctx.textAlign='right';ctx.font='0.062px monospace';
    ctx.fillText('@42',.93*width,.93*height);
  }else if(mode===3){
    path([[.06,.57],[.94,.57]]);
    for(let i=0;i<7;i++){
      const x=.085+i*.136;
      path([[x,.49],[x,.65]]);
      if(![0,1,4].includes(i))continue;
      ctx.beginPath();ctx.arc(x*width,.36*height,.025,0,Math.PI*2);ctx.fill();
    }
  }else{
    // The probe first picks up the pinboard frame; the six prints resolve in order.
    path([[.09,.25],[.90,.25],[.90,.79],[.09,.79],[.09,.25]]);
    for(let i=0;i<6;i++){
      const x=.14+i*.122;
      ctx.strokeRect(x*width,.34*height,.087*width,.34*height);
    }
    path([[.04,.12],[.19,.12],[.22,.06],[.25,.12],[.72,.12],[.76,.15],[.94,.15]]);
  }
  ctx.shadowBlur=0;
}

export function followProbe(wire,tip,rest){
  const geometry=wire.geometry;
  const position=geometry.attributes.position;
  const distance=geometry.attributes.uv;
  const base=position.array.slice();
  let previous='';
  return ()=>{
    const p=tip.position;
    const key=[p.x,p.y,p.z].map(v=>Math.round(v*1000)).join('/');
    if(previous===key)return;
    previous=key;
    for(let i=0;i<position.count;i++){
      const t=distance.getX(i), influence=t*t*(3-2*t);
      position.setXYZ(i,
        base[i*3]+(p.x-rest[0])*influence,
        base[i*3+1]+(p.y-rest[1])*influence,
        base[i*3+2]+(p.z-rest[2])*influence);
    }
    position.needsUpdate=true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  };
}
