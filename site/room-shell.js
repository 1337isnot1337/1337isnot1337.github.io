// Four joined walls, with the camera's full orbit inside the room.
export function buildRoomShell(world, {group,box,bead,cylinder,finish,drawn,wood,trim,floorMat}) {
  const width=9.55, backZ=-8.65, frontZ=10.65, floor=-3.07, ceiling=6.65;
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
  function wall(parent,span,paint,wainscot){
    box(parent,span,ceiling-floor,.14,finish(paint,.96),0,(ceiling+floor)/2,-.07).castShadow=false;
    box(parent,span,1.42,.036,finish(wainscot,.96),0,floor+.72,.021).castShadow=false;
    box(parent,span,.080,.071,molding,0,floor+1.44,.034,.014).castShadow=false;
    box(parent,span,.13,.072,trim,0,floor+.072,.034,.010).castShadow=false;
    box(parent,span,.115,.083,molding,0,ceiling-.064,.030,.013).castShadow=false;
    for(let x=-span*.5+.75;x<span*.5-.35;x+=1.54){
      box(parent,.025,1.32,.018,finish(wainscot,.84),x,floor+.74,.044,.003).castShadow=false;
    }
  }
  wall(walls.back,2*width,0xb0b8b3,0x748985);
  wall(walls.front,2*width,0xb4a69d,0x897972);
  wall(walls.music,length,0xb6b8a0,0x818873);
  wall(walls.science,length,0xc2adaf,0x96858e);
  box(world,2*width,.16,length,floorMat,0,floor-.08,middle).castShadow=false;
  box(world,2*width,.115,length,finish(0xc8beb4,.97),0,ceiling+.0575,middle).castShadow=false;

  const rear=walls.back;
  box(rear,5.84,3.35,.136,trim,-.18,2.73,.076,.021);
  drawn(rear,5.62,3.12,(c,w,h)=>{
    const wash=c.createLinearGradient(0,0,0,h);
    wash.addColorStop(0,'#93adba');wash.addColorStop(.58,'#e2beac');wash.addColorStop(1,'#f4c291');
    c.fillStyle=wash;c.fillRect(0,0,w,h);
    c.fillStyle='#ffdfb3';c.beginPath();c.arc(w*.72,h*.51,.25,0,Math.PI*2);c.fill();
    for(let row=0;row<3;row++){
      c.fillStyle=['#9ba9a3','#728884','#657b77'][row];c.beginPath();c.moveTo(0,h);
      for(let i=0;i<=26;i++){
        const x=w*i/26,y=h*(.66+row*.08)+Math.sin(i*.27+row)*.15+Math.cos(i*.77)*.066;
        c.lineTo(x,y);
      }
      c.lineTo(w,h);c.fill();
    }
  },-.18,2.73,.151);
  for(const x of [-2.98,-.18,2.62])box(rear,.092,3.20,.100,molding,x,2.73,.195,.010);
  for(const y of [1.13,2.65,4.33])box(rear,5.72,.090,.102,molding,-.18,y,.195,.010);
  box(rear,6.28,.123,.468,wood,-.18,1.08,.262,.018);
  const curtain=finish(0x8c777e,.91);
  const rod=cylinder(rear,.037,.037,6.69,finish(0x917454,.54,.24),-.18,4.52,.302,19);
  rod.rotation.z=Math.PI/2;
  for(const sign of [-1,1]){
    for(let n=0;n<9;n++){
      const x=-.18+sign*(2.54+n*.088);
      const depth=.082+(n%2)*.023,height=3.04+Math.sin(n*.71)*.12;
      box(rear,.098,height,depth,curtain,x,4.44-height/2,.299+(n%2)*.03,.021);
    }
    bead(rear,-.18+sign*3.37,4.52,.307,.075,.054,.045,molding);
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
