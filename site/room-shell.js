import * as T from './vendor/three/three.module.min.js';

// The hutch sits against the window wall.
export function buildRoomShell(world, {group,box,bead,cylinder,finish,drawn,wood,trim,floorMat}) {
  const width=9.55, backZ=-2.68, frontZ=10.65, floor=-3.07, ceiling=6.65;
  const length=frontZ-backZ, middle=(frontZ+backZ)/2;
  const molding=finish(0xc4ab97,.85);
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
    const plaster=finish(paint,.96);
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
    color:0xaccad9,roughness:.23,transparent:true,opacity:.085,depthWrite:false
  });
  for(const sign of [-1,1])for(const vertical of [-1,1]){
    const pane=box(rear,span/2-.094,height/2-.080,.008,glass,center+sign*span/4,mid+vertical*height/4,-.10);
    pane.castShadow=false;pane.receiveShadow=false;
  }
  const curtain=new T.MeshStandardMaterial({color:0x8f7780,roughness:.9,side:T.DoubleSide});
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
  // Geometry behind the aperture has genuine depth and changes with the view.
  const outdoors=group(rear,0,0,-.30);
  drawn(outdoors,42,19,(c,w,h)=>{
    const sky=c.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#749bad');sky.addColorStop(.48,'#b7cad3');
    sky.addColorStop(.73,'#e5c2af');sky.addColorStop(1,'#f4c592');
    c.fillStyle=sky;c.fillRect(0,0,w,h);
  },0,8,-25);
  const glow=new T.MeshStandardMaterial({color:0xffd197,emissive:0xffc17b,emissiveIntensity:.57});
  const sun=bead(outdoors,-4.9,4.1,-22,.61,.61,.60,glow);
  sun.castShadow=false;sun.receiveShadow=false;
  box(outdoors,33,.24,26,finish(0x647f63,.98),0,-.12,-13).castShadow=false;
  function ridge(z,base,amplitude,color,phase){
    const coordinates=[],uv=[],indices=[];
    for(let i=0;i<=24;i++){
      const x=(i-12)*1.53;
      const y=base+amplitude*(.51+Math.sin(i*.51+phase)*.32+Math.sin(i*1.23+phase)*.12);
      coordinates.push(x,-.10,z-2,x,y,z+(i%4-1.5)*.28);
      uv.push(i/24,0,i/24,1);
      if(i){const point=i*2;indices.push(point-2,point,point-1,point,point+1,point-1);}
    }
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(coordinates,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    geo.setIndex(indices);geo.computeVertexNormals();
    outdoors.add(new T.Mesh(geo,finish(color,.98)));
  }
  ridge(-19,2.09,2.45,0x829397,1.8);
  ridge(-14,1.16,2.83,0x71877b,3.1);
  ridge(-10,.49,1.97,0x7c896b,.7);
  const bark=finish(0x635548,.92);
  for(const [x,z,h] of [[-5,-4.6,3.65],[-2.5,-6.2,2.8],[3.4,-5.1,4.1],[5.8,-7.3,3.04],[-6.0,-8.9,3.8],[2.0,-8.4,2.6]]){
    cylinder(outdoors,.086,.147,h*.69,bark,x,h*.345,z,10).castShadow=false;
    for(let i=0;i<5;i++){
      const r=h*(.27-i*.042);
      const profile=[[0,0],[r,.033],[r*.86,h*.106],[r*.55,h*.22],[r*.18,h*.342],[0,h*.46]];
      const crown=new T.Mesh(new T.LatheGeometry(profile.map(point=>new T.Vector2(...point)),11),finish(i%2?0x4f705f:0x567762,.96));
      crown.position.set(x+i*.019,h*(.32+i*.113),z);
      crown.rotation.set(.064*Math.sin(x+i),i*.41,-.033*Math.cos(x+i));outdoors.add(crown);
    }
  }
  for(const [x,z,tint] of [[-.9,-7.1,0xd6b389],[.62,-8.34,0xe5c2a7],[1.62,-8.76,0xbb9e8f]]){
    box(outdoors,.99,.73,.76,finish(tint,.92),x,.39,z).castShadow=false;
    const roof=finish(0x845d51,.93);
    for(const sign of [-1,1]){
      const tile=box(outdoors,.62,.079,.91,roof,x+sign*.255,.858,z,.011);
      tile.rotation.z=-sign*.48;tile.castShadow=false;
    }
    for(const offset of [-.24,.22])box(outdoors,.122,.168,.022,finish(0xffd29a,.84),x+offset,.48,z+.385).castShadow=false;
  }

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
  const rug=finish(0x64716b,.96);
  box(world,11.75,.022,6.46,rug,0,floor+.011,.03,.010).castShadow=false;
  for(const x of [-5.64,5.64])box(world,.058,.008,6.20,molding,x,floor+.026,.03,.005).castShadow=false;
  for(const z of [-2.98,3.04])box(world,11.29,.008,.046,molding,0,floor+.028,z,.004).castShadow=false;
  const runner=box(world,2.55,.025,4.85,finish(0x89717c,.96),-6.65,floor+.012,4.04,.011);
  runner.rotation.y=.09;runner.castShadow=false;
  return walls;
}
