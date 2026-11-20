const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const face=Math.PI/3;
const radius=.032;

export function deskPencils(){
  const states=new Map(['pencil','rose-pencil'].map(id=>[id,{x:0,y:0,vx:0,vy:0,roll:0,held:false,last:0}]));
  const origins=new WeakMap();

  function drag(id,dx,dy,time){
    const pencil=states.get(id);
    const distance=dx*5.9;
    const duration=Math.max(12,Math.min(70,time-pencil.last||16));
    pencil.last=time;
    pencil.held=true;
    pencil.vx=clamp(distance*1000/duration,-3.3,3.3);
    pencil.x+=distance;
    pencil.y=clamp(pencil.y-dy*4.2,0,.42);
    pencil.roll+=distance/radius;
  }

  function release(cancelled){
    for(const pencil of states.values()){
      if(!pencil.held)continue;
      pencil.vx=cancelled?0:pencil.vx*.66;
      pencil.vy=0;
      pencil.held=false;
    }
  }

  function update(dt,quiet,model,notify){
    let moving=false;
    for(const [id,pencil] of states){
      const mesh=model.targets.get(id).root;
      if(!origins.has(mesh))origins.set(mesh,mesh.position.clone());
      const origin=origins.get(mesh);
      const bookSide=model.pencilBounds.book;
      const sewnEdge=model.pencilBounds.mat;
      const min=bookSide-origin.x;
      const max=sewnEdge-origin.x;
      if(!pencil.held){
        if(quiet){
          pencil.y=0;pencil.vx=0;pencil.vy=0;
        }else{
          const dx=pencil.vx*dt;
          pencil.x+=dx;
          pencil.roll+=dx/radius;
          pencil.vx*=Math.exp(-dt*4);
          if(pencil.y>0||pencil.vy>0){
            pencil.vy-=4.4*dt;
            pencil.y+=pencil.vy*dt;
            if(pencil.y<=0){
              pencil.y=0;
              pencil.vy=Math.abs(pencil.vy)>.30?-pencil.vy*.34:0;
            }
          }
        }
      }
      const contact=pencil.x<min;
      pencil.x=clamp(pencil.x,min,max);
      if(contact||pencil.x>=max){
        if(contact&&(pencil.held||Math.abs(pencil.vx)>.09))notify(pencil.vx);
        pencil.vx=0;
      }
      if(Math.abs(pencil.vx)<.028&&!pencil.held){
        pencil.vx=0;
        const flat=Math.round(pencil.roll/face)*face;
        pencil.roll=quiet||Math.abs(pencil.roll-flat)<.002?flat:pencil.roll+(flat-pencil.roll)*Math.min(1,dt*13);
        moving ||= pencil.roll!==flat;
      }
      mesh.position.set(origin.x+pencil.x,origin.y+pencil.y,origin.z);
      mesh.rotation.z=pencil.roll;
      moving ||= !pencil.held&&(Math.abs(pencil.vx)>.028||pencil.vy!==0||pencil.y>0);
    }
    return moving;
  }

  return {drag,release,update};
}
