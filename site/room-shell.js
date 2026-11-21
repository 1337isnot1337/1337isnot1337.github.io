import * as T from './vendor/three/three.module.min.js';
import { buildWindowView } from './room-window-view.js?v=1';

// The hutch sits against the window wall.
export function buildRoomShell(world, {group,box,bead,cylinder,finish,photo,weave,wood,trim,floorMat}) {
  const width=9.55, backZ=-2.68, frontZ=10.65, floor=-3.07, ceiling=6.65;
  const length=frontZ-backZ, middle=(frontZ+backZ)/2;
  const molding=finish(0xc4ab97,.85);
  const texture=document.createElement('canvas');
  texture.width=texture.height=192;
  const ctx=texture.getContext('2d'), surface=ctx.createImageData(192,192);
  let grit=3029;
  for(let y=0;y<192;y++)for(let x=0;x<192;x++){
    grit=(Math.imul(grit,1664525)+1013904223)>>>0;
    const trowel=3*Math.sin(x*.063)+2*Math.sin(x*.037+y*.112);
    const tone=233+trowel+(grit>>>28);
    const i=(y*192+x)*4;
    surface.data[i]=surface.data[i+1]=surface.data[i+2]=tone;surface.data[i+3]=255;
  }
  ctx.putImageData(surface,0,0);
  const plasterGrain=new T.CanvasTexture(texture);
  plasterGrain.colorSpace=T.SRGBColorSpace;
  plasterGrain.wrapS=plasterGrain.wrapT=T.RepeatWrapping;
  plasterGrain.repeat.set(3,3);
  const walls={
    back:group(world,0,0,backZ),
    front:group(world,0,0,frontZ),
    music:group(world,-width,0,middle),
    science:group(world,width,0,middle),
  };
  walls.front.rotation.y=Math.PI;
  walls.music.rotation.y=Math.PI/2;
  walls.science.rotation.y=-Math.PI/2;
  const opening={left:-2.97,right:2.75,bottom:3.39,top:6.19};
  function wall(parent,span,paint,wainscot,window){
    const plaster=new T.MeshStandardMaterial({color:paint,map:plasterGrain,bumpMap:plasterGrain,bumpScale:.015,roughness:.97});
    const wallSection=(left,right,bottom,top)=>{
      box(parent,right-left,top-bottom,.26,plaster,(left+right)/2,(bottom+top)/2,-.13).castShadow=false;
    };
    if(window){
      const {left,right,bottom,top}=window;
      wallSection(-span/2,left,floor,ceiling);
      wallSection(right,span/2,floor,ceiling);
      wallSection(left,right,floor,bottom);
      wallSection(left,right,top,ceiling);
    }else wallSection(-span/2,span/2,floor,ceiling);
    box(parent,span,1.42,.036,finish(wainscot,.96),0,floor+.72,.021).castShadow=false;
    box(parent,span,.080,.071,molding,0,floor+1.44,.034,.014).castShadow=false;
    box(parent,span,.13,.072,trim,0,floor+.072,.034,.010).castShadow=false;
    box(parent,span,.115,.083,molding,0,ceiling-.064,.030,.013).castShadow=false;
    for(let x=-span*.5+.75;x<span*.5-.35;x+=1.54){
      box(parent,.025,1.32,.018,finish(wainscot,.84),x,floor+.74,.044,.003).castShadow=false;
    }
  }
  wall(walls.back,2*width,0xb0b8b3,0x748985,opening);
  wall(walls.front,2*width,0xb4a69d,0x897972);
  wall(walls.music,length,0xb6b8a0,0x818873);
  wall(walls.science,length,0xc2adaf,0x96858e);
  box(world,2*width,.16,length,floorMat,0,floor-.08,middle).castShadow=false;
  box(world,2*width,.115,length,finish(0xc8beb4,.97),0,ceiling+.0575,middle).castShadow=false;

  const rear=walls.back;
  const {left,right,bottom,top}=opening;
  const center=(left+right)/2, span=right-left, height=top-bottom, mid=(top+bottom)/2;
  for(const x of [left,center,right]){
    box(rear,.105,height+.15,.28,trim,x,mid,-.055,.009).castShadow=false;
    box(rear,.039,height+.075,.058,molding,x+.034,mid,.091,.006).castShadow=false;
  }
  for(const y of [bottom,mid,top]){
    box(rear,span+.14,.09,.28,trim,center,y,-.055,.009).castShadow=false;
    box(rear,span+.06,.031,.057,molding,center,y+.029,.088,.006).castShadow=false;
  }
  box(rear,span+.33,.127,.55,wood,center,bottom-.087,.077,.018);
  box(rear,span+.16,.075,.096,trim,center,bottom-.19,.125,.010);
  const glass=new T.MeshStandardMaterial({
    color:0xc6d9df,roughness:.16,metalness:.12,transparent:true,opacity:.055,depthWrite:false
  });
  for(const sign of [-1,1])for(const vertical of [-1,1]){
    const pane=box(rear,span/2-.094,height/2-.080,.008,glass,center+sign*span/4,mid+vertical*height/4,-.10);
    pane.castShadow=false;pane.receiveShadow=false;
  }
  const latch=finish(0xb69664,.39,.55);
  box(rear,.29,.106,.043,latch,center-.032,mid-.064,.115,.018);
  box(rear,.16,.031,.050,latch,center-.026,mid+.021,.133,.009);
  bead(rear,center+.04,mid+.039,.162,.029,.027,.020,latch);
  for(const dx of [-.100,.100])bead(rear,center-.03+dx,mid-.065,.139,.012,.012,.008,finish(0x6a5340,.45,.45));
  const curtain=new T.MeshStandardMaterial({
    color:0x8f7780,map:weave,bumpMap:weave,bumpScale:.012,roughness:.91,side:T.DoubleSide
  });
  const rings=finish(0xa48a69,.53,.21);
  const rod=cylinder(rear,.035,.035,span+1.10,finish(0x917454,.54,.24),center,top+.24,.317,19);
  rod.rotation.z=Math.PI/2;
  for(const sign of [-1,1]){
    const edge=center+sign*(span/2-.20);
    const positions=[],indices=[],uv=[];
    const columns=40,rows=16;
    for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
      const v=row/rows,u=col/columns;
      const x=edge+sign*(u*(.69+.13*v)-(1-u)*.061*v);
      const y=top+.16-v*(height+.23+.026*Math.sin(u*23));
      const z=.31+(.037+v*.027)*Math.sin(u*10*Math.PI+.33*v);
      positions.push(x,y,z);uv.push(u,v);
      if(row&&col){
        const a=row*(columns+1)+col,b=a-columns-1;
        indices.push(a,b,b-1,a,b-1,a-1);
      }
    }
    const drape=new T.BufferGeometry();
    drape.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    drape.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    drape.setIndex(indices);drape.computeVertexNormals();
    const panel=new T.Mesh(drape,curtain);panel.castShadow=true;panel.receiveShadow=true;rear.add(panel);
    for(let n=0;n<6;n++){
      const ring=new T.Mesh(new T.TorusGeometry(.049,.009,7,15),rings);
      ring.position.set(edge+sign*(.043+n*.128),top+.225,.317);
      ring.rotation.y=Math.PI/2;rear.add(ring);
    }
    bead(rear,center+sign*(span/2+.56),top+.24,.317,.074,.050,.047,molding);
  }
  buildWindowView(group(rear,0,0,-.30),{photo,cylinder,finish});

  const entry=walls.front, door=finish(0x5b756b,.78);
  box(entry,3.11,6.03,.145,trim,2.46,-.034,.079,.018);
  box(entry,2.82,5.79,.13,door,2.46,-.071,.162,.022);
  for(const y of [-1.46,.98]){
    box(entry,2.49,2.05,.041,finish(0x455c54,.89),2.46,y,.235,.022);
    box(entry,2.32,1.89,.038,door,2.46,y,.255,.022);
  }
  box(entry,.163,.35,.047,finish(0xaa8b5f,.49,.28),3.54,-.28,.269,.019);
  bead(entry,3.54,-.243,.349,.084,.072,.062,finish(0xbd9b66,.44,.36));
  box(entry,3.09,.069,.225,trim,2.46,-2.972,.172,.013);
  box(entry,5.85,2.12,.112,trim,-4.18,2.18,.055,.029);
  box(entry,5.62,1.88,.047,finish(0x99766b,.92),-4.18,2.18,.095,.010);

  // Runners sit on the floor, with the desk feet still grounded.
  const rug=new T.MeshStandardMaterial({color:0x64716b,map:weave,bumpMap:weave,bumpScale:.020,roughness:.98});
  box(world,11.75,.022,6.46,rug,0,floor+.011,.03,.010).castShadow=false;
  for(const x of [-5.64,5.64])box(world,.058,.008,6.20,molding,x,floor+.026,.03,.005).castShadow=false;
  for(const z of [-2.98,3.04])box(world,11.29,.008,.046,molding,0,floor+.028,z,.004).castShadow=false;
  const runnerFabric=rug.clone();runnerFabric.color.set(0x89717c);
  const runner=box(world,2.55,.025,4.85,runnerFabric,-6.65,floor+.012,4.04,.011);
  runner.rotation.y=.09;runner.castShadow=false;
  return walls;
}
