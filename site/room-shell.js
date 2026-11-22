import * as T from './vendor/three/three.module.min.js';
import { buildWindowView } from './room-window-view.js?v=4';

// The hutch sits against the window wall.
export function buildRoomShell(world, {group,box,bead,cylinder,wire,finish,photo,drawn,weave,wood,trim,floorMat,night}) {
  const width=9.55, backZ=-2.68, frontZ=10.65, floor=-3.07, ceiling=6.65;
  const length=frontZ-backZ, middle=(frontZ+backZ)/2;
  const molding=finish(0xd1bca8,.83);
  const coves=[];
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
  function wall(parent,span,paint,wainscot,glow,window){
    const plaster=new T.MeshStandardMaterial({color:paint,map:plasterGrain,bumpMap:plasterGrain,bumpScale:.008,roughness:.97});
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
    const crown=finish(0xe2ceba,.84);
    box(parent,span,.120,.200,crown,0,ceiling-.058,.079,.027).castShadow=false;
    box(parent,span,.049,.123,molding,0,ceiling-.137,.057,.012).castShadow=false;
    // The channels butt into the crown at all four corners. The lens faces down
    // into the room, with its driver and wiring hidden behind the moulding.
    const channel=finish(0xb8a796,.68,.18);
    box(parent,span-.11,.049,.112,channel,0,ceiling-.112,.177,.008).castShadow=false;
    const color=new T.Color(glow);
    const lens=new T.MeshBasicMaterial({color:color.clone().multiplyScalar(.58),toneMapped:false});
    box(parent,span-.12,.023,.081,lens,0,ceiling-.140,.197,.005).castShadow=false;
    coves.push({lens,color});
    for(let x=-span*.5+.75;x<span*.5-.35;x+=1.54){
      box(parent,.025,1.32,.018,finish(wainscot,.84),x,floor+.74,.044,.003).castShadow=false;
    }
  }
  wall(walls.back,2*width,0xb3bcb0,0x637d78,0xffd6a6,opening);
  wall(walls.front,2*width,0xc2aca0,0x92796b,0xb6b3ff);
  wall(walls.music,length,0xb9b99e,0x788571,0xffb283);
  wall(walls.science,length,0xc0aab1,0x897589,0xd6b8fa);
  box(world,2*width,.16,length,floorMat,0,floor-.08,middle).castShadow=false;
  const ceilingPlaster=new T.MeshStandardMaterial({
    color:0xefe2d0,map:plasterGrain,bumpMap:plasterGrain,bumpScale:.005,
    roughness:.97,emissive:0xb59a82,emissiveIntensity:.17,
  });
  box(world,2*width,.115,length,ceilingPlaster,0,ceiling+.0575,middle).castShadow=false;
  // Low-profile painted rails frame recessed plaster panels above the room.
  const rail=finish(0xe7d6c2,.86);
  for(const x of [-width+.48,-width/3,width/3,width-.48]){
    box(world,.24,.089,length-.94,rail,x,ceiling-.040,middle,.019).castShadow=false;
    box(world,.16,.024,length-.94,molding,x,ceiling-.092,middle,.009).castShadow=false;
  }
  for(const z of [backZ+.47,backZ+length/3,frontZ-length/3,frontZ-.47]){
    for(const [start,end] of [[-width+.60,-width/3-.12],[-width/3+.12,width/3-.12],[width/3+.12,width-.60]]){
      box(world,end-start,.089,.24,rail,(start+end)/2,ceiling-.040,z,.019).castShadow=false;
      box(world,end-start,.024,.16,molding,(start+end)/2,ceiling-.092,z,.009).castShadow=false;
    }
  }

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
    color:0xa17c7e,map:weave,bumpMap:weave,bumpScale:.009,roughness:.91,side:T.DoubleSide
  });
  const rings=finish(0xa48a69,.53,.21);
  const braid=finish(0xbc936e,.79);
  const rod=cylinder(rear,.035,.035,span+1.10,finish(0x917454,.54,.24),center,top+.24,.317,19);
  rod.rotation.z=Math.PI/2;
  for(const sign of [-1,1]){
    const edge=center+sign*(span/2-.20);
    const positions=[],indices=[],uv=[];
    const columns=40,rows=16;
    function fold(u,v){
      const gather=Math.exp(-((v-.60)**2)/.020);
      return [
        edge+sign*(u*(.69+.15*v-.225*gather)+.135*gather-(1-u)*.066*v),
        top+.16-v*(height+.23+.033*Math.sin(u*21)),
        .31+(.038+v*.024+.025*gather)*Math.sin(u*10*Math.PI+.52*v)
      ];
    }
    for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
      const v=row/rows,u=col/columns;
      positions.push(...fold(u,v));uv.push(u,v);
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
    const tie=Array.from({length:7},(_,i)=>{
      const [x,y]=fold(i/6,.597+Math.sin(i*.5)*.014);
      return [x,y,.370+Math.sin(i*Math.PI/6)*.044];
    });
    for(const offset of [0,.019]){
      wire(rear,tie.map(([x,y,z])=>[x,y+offset,z]),.013,braid).castShadow=false;
    }
    const [x,y,z]=tie[1];
    bead(rear,x,y+.010,z+.009,.035,.027,.024,braid);
    wire(rear,[[x,y,z],[x+.03*sign,y-.11,z+.016],[x+.015*sign,y-.17,z+.013]],.011,braid).castShadow=false;
    bead(rear,x+.015*sign,y-.18,z+.015,.017,.034,.014,braid);
    for(let n=0;n<6;n++){
      const ring=new T.Mesh(new T.TorusGeometry(.049,.009,7,15),rings);
      ring.position.set(edge+sign*(.043+n*.128),top+.225,.317);
      ring.rotation.y=Math.PI/2;rear.add(ring);
    }
    bead(rear,center+sign*(span/2+.56),top+.24,.317,.074,.050,.047,molding);
  }
  buildWindowView(group(rear,0,0,-.30),{photo,cylinder,finish,night});

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
  drawn(entry,5.61,1.87,paintValleyCloth,-4.18,2.18,.117,false,180);

  // Runners sit on the floor, with the desk feet still grounded.
  const rug=new T.MeshStandardMaterial({color:0x64716b,map:weave,bumpMap:weave,bumpScale:.020,roughness:.98});
  box(world,11.75,.022,6.46,rug,0,floor+.011,.03,.010).castShadow=false;
  for(const x of [-5.64,5.64])box(world,.058,.008,6.20,molding,x,floor+.026,.03,.005).castShadow=false;
  for(const z of [-2.98,3.04])box(world,11.29,.008,.046,molding,0,floor+.028,z,.004).castShadow=false;
  const runnerFabric=rug.clone();runnerFabric.color.set(0x89717c);
  const runner=box(world,2.55,.025,4.85,runnerFabric,-6.65,floor+.012,4.04,.011);
  runner.rotation.y=.09;runner.castShadow=false;
  return {walls,coves};
}

// A contour print on the cloth backing of the rear display.
function paintValleyCloth(c,w,h){
  const ground=c.createLinearGradient(0,0,w,h);
  ground.addColorStop(0,'#304a49');ground.addColorStop(.52,'#49645c');ground.addColorStop(1,'#2d4242');
  c.fillStyle=ground;c.fillRect(0,0,w,h);
  c.save();
  c.beginPath();c.rect(.09,.09,w-.18,h-.18);c.clip();
  c.strokeStyle='#c1c29d27';c.lineWidth=.006;
  for(let x=.10;x<w;x+=.215){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
  for(let y=.12;y<h;y+=.215){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  const river=x=>h*.53+.52*Math.cos(x*.69+.25)+.073*Math.sin(x*3.3);
  const peaks=[[.76,.17,1.34,.65,.89],[1.78,1.52,.89,.56,1.12],
    [3.90,1.73,1.39,.76,1.05],[5.03,.39,.86,.55,.94]];
  const columns=100,rows=36,dx=w/columns,dy=h/rows;
  const samples=Array.from({length:rows+1},(_,row)=>Array.from({length:columns+1},(_,col)=>{
    const x=col*dx,y=row*dy;
    const valley=.33*Math.exp(-(((y-river(x))/.18)**2));
    return peaks.reduce((z,[cx,cy,rx,ry,rise])=>
      z+rise*Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2)),.12+.071*Math.sin(x*2.6+y*5))-valley;
  }));
  // Draw isolines by interpolating at the edges of each terrain cell.
  const corners=[[0,0],[1,0],[1,1],[0,1]];
  c.lineCap='round';
  for(let i=1;i<=16;i++){
    const level=i*.068,major=i%4===0;
    c.beginPath();
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      const heights=corners.map(([ix,iy])=>samples[y+iy][x+ix]);
      const cuts=[];
      for(let edge=0;edge<4;edge++){
        const next=(edge+1)%4;
        if((heights[edge]<level)===(heights[next]<level))continue;
        const t=(level-heights[edge])/(heights[next]-heights[edge]);
        cuts.push(corners[edge].map((offset,axis)=>offset+(corners[next][axis]-offset)*t));
      }
      if(cuts.length===0)continue;
      if(cuts.length===4 && (heights[0]<level)!==(heights.reduce((a,b)=>a+b)/4<level))cuts.push(cuts.shift());
      for(let j=0;j<cuts.length;j+=2){
        c.moveTo((x+cuts[j][0])*dx,(y+cuts[j][1])*dy);
        c.lineTo((x+cuts[j+1][0])*dx,(y+cuts[j+1][1])*dy);
      }
    }
    c.strokeStyle=major?'#ded3a69c':'#d0c7986e';c.lineWidth=major?.012:.007;c.stroke();
  }
  c.beginPath();c.moveTo(0,river(0));
  for(let x=dx;x<=w;x+=dx)c.lineTo(x,river(x));
  c.strokeStyle='#b7e0d7cd';c.lineWidth=.020;c.stroke();
  c.restore();
  c.strokeStyle='#cfb885';c.lineWidth=.012;c.strokeRect(.075,.075,w-.15,h-.15);
  c.strokeStyle='#cbba917a';c.lineWidth=.006;c.strokeRect(.123,.123,w-.246,h-.246);
}
