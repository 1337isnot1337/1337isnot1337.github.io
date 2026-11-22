// Units are relative to the desk, with its writing surface at y = 0.
import * as T from './vendor/three/three.module.min.js';
import { leafPoint, caterpillarRadii } from './desk-botany.js?v=1';
import { lampProjection } from './desk-lamp.js?v=1';
import { paintScope, followProbe } from './desk-scope.js?v=1';
import { airframeGeometry, wingUnderside } from './model-plane.js?v=2';
import { mergeGeometries } from './vendor/three/BufferGeometryUtils.js';
import { decorateRoom } from './desk-room.js?v=24';
import { clockHands, setClock } from './shelf-clock.js?v=1';
import { corkMaterial, curledPrint, scopeScale } from './desk-finishes.js?v=1';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';

export function furnish(scene, narrow, repaint, software=false, posterMode='professional') {
  const width = narrow ? 5.6 : 9.6;
  const half = width / 2;
  const room = new T.Group();
  const world = new T.Group();
  const deskScale=.70;
  // Keep the desk built in its original local units. Seat its feet on the
  // room floor and give the hutch a small clearance against the back wall.
  world.scale.setScalar(deskScale);
  world.position.set(0,-3.07*(1-deskScale),-1.02);
  const night={value:0};
  room.add(world);scene.add(room);
  const targets = new Map();
  const details = new Map();
  function detail(name,parent,x=0,y=0,z=0) {
    const part=group(parent,x,y,z);
    part.userData.detail=name;
    details.set(name,part);
    return part;
  }
  const cache = new Map();
  const geometry = new Map();
  const group = (parent, x, y, z) => {
    const g = new T.Group(); g.position.set(x,y,z); parent.add(g); return g;
  };
  function finish(color, roughness = .77, metalness = 0) {
    const key = [color,roughness,metalness].join('/');
    if (!cache.has(key)) cache.set(key,new T.MeshStandardMaterial({color,roughness,metalness}));
    return cache.get(key);
  }
  function mesh(parent, geo, material, x=0, y=0, z=0) {
    const m = new T.Mesh(geo,material); m.position.set(x,y,z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(parent,w,h,d,mat,x=0,y=0,z=0,r=0) {
    // Tiny bevels are subpixel in the software view. Keep rounded silhouettes
    // on larger pieces such as the drawers, worktop and instrument cases.
    if(software&&Math.min(w,h,d)<.13)r=0;
    const key = [w,h,d,r].join(',');
    if (!geometry.has(key)) geometry.set(key,r ? new RoundedBoxGeometry(w,h,d,1,Math.min(r,h/2,w/2,d/2)) : new T.BoxGeometry(w,h,d));
    return mesh(parent,geometry.get(key),mat,x,y,z);
  }
  function cylinder(p,top,bottom,h,mat,x,y,z,n=22) {
    if(software)n=Math.min(n,16);
    return mesh(p,new T.CylinderGeometry(top,bottom,h,n),mat,x,y,z);
  }
  function bead(p,x,y,z,rx,ry,rz,mat) {
    const key='sphere';
    if (!geometry.has(key)) geometry.set(key,new T.SphereGeometry(1,software?10:14,software?8:10));
    const m=mesh(p,geometry.get(key),mat,x,y,z);m.scale.set(rx,ry,rz);return m;
  }
  function wire(p,points,r,mat) {
    const path=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));
    return mesh(p,new T.TubeGeometry(path,Math.max(10,points.length*(software?2:3)),r,software?5:6,false),mat);
  }
  const loader = new T.TextureLoader().setCrossOrigin(undefined);
  function photo(uri,onLoad) {
    const t=loader.load(uri,()=>{onLoad?.();repaint();});t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
  }
  // Detail maps add paper fibres and the crossing threads of book cloth.
  let seed=96114;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const fiber=canvas.getContext('2d'),pixels=fiber.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    const n=211+random()*19+(x%3===0?7:0)+(y%4===0?8:0);
    const k=(y*256+x)*4;pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=n;pixels.data[k+3]=255;
  }
  fiber.putImageData(pixels,0,0);
  const weave=new T.CanvasTexture(canvas);weave.colorSpace=T.SRGBColorSpace;
  weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(2,2);weave.anisotropy=4;
  function cloth(color) {const mat=finish(color);mat.map=weave;mat.bumpMap=weave;mat.bumpScale=.012;return mat;}
  function drawn(parent,w,h,paint,x,y,z,flat=false,pixelsPerUnit=220) {
    const c=document.createElement('canvas');c.width=T.MathUtils.clamp(T.MathUtils.ceilPowerOfTwo(pixelsPerUnit*w),96,1024);
    c.height=Math.max(32,Math.round(c.width*h/w));
    const ctx=c.getContext('2d');ctx.scale(c.width/w,c.height/h);paint(ctx,w,h);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    const material=new T.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.12,roughness:.94,
      depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const m=mesh(parent,new T.PlaneGeometry(w,h),material,x,y,z);
    m.castShadow=false;if(flat)m.rotation.x=-Math.PI/2;return m;
  }
  function letter(p,label,w,h,x,y,z,options={}) {
    return drawn(p,w,h,(c,a,b)=>{
      if(options.paper){c.fillStyle=options.paper;c.fillRect(0,0,a,b);}
      c.fillStyle=options.ink||'#3c3326';c.textAlign='center';c.textBaseline='middle';
      c.resetTransform();
      const {width,height}=c.canvas;
      c.font=(options.italic?'italic ':'')+(options.bold?'bold ':'')+Math.round(height*.83)+'px '+(options.font||'Georgia');
      c.fillText(label,width/2,height*.53,width*.96);
    },x,y,z,options.flat,430);
  }
  function illustration(p,uri,w,h,x,y,z,flat=false) {
    const m=mesh(p,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:photo(uri),roughness:.84}),x,y,z);
    if(flat)m.rotation.x=-Math.PI/2;m.castShadow=false;return m;
  }
  function tag(root,id,point,w,h) {
    root.userData.pick=id;targets.set(id,{root,point:new T.Vector3(...point),w,h});return root;
  }
  const woodMap=photo('assets/furniture/grain.webp',()=>{floorMap.needsUpdate=true;});
  woodMap.wrapS=woodMap.wrapT=T.RepeatWrapping;
  const relief=software?null:loader.load('assets/furniture/grain-relief.webp',repaint);
  if(relief){relief.wrapS=relief.wrapT=T.RepeatWrapping;relief.anisotropy=4;}
  const wood=new T.MeshStandardMaterial({
    map:woodMap,roughnessMap:relief,bumpMap:relief,bumpScale:.011,roughness:.84,color:0xd9beaa
  });
  const trim=wood.clone();trim.color.set(0xb39174);
  const darkWood=wood.clone();darkWood.color.set(0x987358);
  const floorMap=woodMap.clone();floorMap.repeat.set(5,6);
  const floorMat=new T.MeshStandardMaterial({map:floorMap,color:0x967f72,roughness:.68});
  const brass=finish(0xb68b53,.31,.76), brassDark=finish(0x7d6349,.47,.56);
  const cream=finish(0xf2e3c7), paper=finish(0xf9efdc), plum=cloth(0x79485e), sage=finish(0x64745b);
  const side=half-.12;
  // The desk is hollow: the drawer can travel out from beneath the slab.
  box(world,width,.21,4.55,wood,0,-.115,0,.055);
  box(world,width+.07,.065,4.6,trim,0,-.21,0,.025);
  box(world,width-.25,.08,3.68,darkWood,0,-.83,.29);
  box(world,.13,.61,3.9,wood,-side,-.51,.26);box(world,.13,.61,3.9,wood,side,-.51,.26);
  for(const x of [-side+.16,side-.16]) for(const z of [-1.89,1.94]){
    box(world,.28,2.25,.28,trim,x,-1.93,z,.025);
    box(world,.32,.11,.32,wood,x,-1.01,z,.02);
  }
  const dw=narrow ? 2.45 : 3.35, drawerX=narrow ? .23 : .65;
  const frontZ=2.17;
  for(const [left,right] of [[-half,drawerX-dw/2-.04],[drawerX+dw/2+.04,half]]){
    const w=right-left-.06,cx=(right+left)/2;
    box(world,w,.56,.14,wood,cx,-.51,frontZ,.02);
    box(world,Math.max(.05,w-.15),.41,.025,trim,cx,-.51,frontZ+.079,.012);
  }
  box(world,dw+.04,.56,.10,finish(0x2c211c),drawerX,-.51,.75);
  const drawer=tag(group(world,drawerX,-.62,frontZ),'drawer',[0,.12,.14],dw*.55,.52);
  box(drawer,dw,.10,1.56,wood,0,0,-.69);
  box(drawer,dw-.11,.015,1.40,finish(0x9aaf9c),0,.065,-.69);
  for(const x of [-dw/2+.035,dw/2-.035])box(drawer,.07,.28,1.5,trim,x,.12,-.70);
  box(drawer,dw-.09,.28,.07,trim,0,.12,-1.4);
  box(drawer,dw,.54,.13,wood,0,.11,.06,.028);
  box(drawer,dw-.14,.40,.026,trim,0,.11,.136,.016);
  for(const x of [-.31,.31])bead(drawer,x,.15,.18,.09,.083,.035,brassDark);
  const screwSocket=detail('screw-socket',world,drawerX+.26,-.91,2.06);
  const socketRim=cylinder(screwSocket,.037,.037,.007,brassDark,0,0,0,18);
  socketRim.rotation.x=Math.PI/2;
  bead(screwSocket,0,0,.005,.023,.023,.005,finish(0x302118));
  const fitted=detail('fitted-screw',world,drawerX+.26,-.91,2.072);
  const fittedHead=cylinder(fitted,.030,.032,.012,brassDark,0,0,0,18);
  fittedHead.rotation.x=Math.PI/2;
  box(fitted,.039,.003,.005,finish(0x523827),0,0,.008).rotation.z=.34;
  fitted.visible=false;
  const handle=detail('handle',drawer,0,.15,.18);
  wire(handle,[[-.31,0,0],[-.29,-.04,.11],[-.18,-.084,.15],[.18,-.084,.15],[.29,-.04,.11],[.31,0,0]],.034,brass);
  const posterSwitch=tag(group(drawer,dw/2-.074,.203,-.30),'poster-switch',[0,.060,0],.28,.25);
  posterSwitch.rotation.z=1.02;
  cylinder(posterSwitch,.115,.123,.041,brassDark,0,.008,0,24);
  cylinder(posterSwitch,.092,.097,.023,finish(0x342420,.53),0,.038,0,24);
  const posterCap=detail('poster-switch-cap',posterSwitch,0,.053,0);
  cylinder(posterCap,.072,.080,.033,finish(0xc82e35,.37),0,.012,0,24);
  bead(posterCap,0,.028,0,.072,.020,.072,finish(0xcf393c,.29));
  const drawerNote=detail('drawer-note',drawer,.11,.389,.181);
  box(drawerNote,.57,.015,.25,cream,0,0,.012,.005);
  box(drawerNote,.55,.008,.11,paper,.008,.010,-.043).rotation.z=.035;
  const complaint=letter(drawerNote,'i live here too',.52,.108,0,.011,.063,{flat:true,italic:true});
  complaint.rotation.z=.025;
  const marble=detail('marble',drawer,-.77,.106,-.43);
  bead(marble,0,0,0,.047,.047,.047,finish(0x8bbeb3,.17,.15));
  bead(marble,0,.020,0,.041,.010,.041,finish(0xf7ce78,.24));
  const marblesLeft=-1.04;
  box(drawer,.10,.106,.81,wood,marblesLeft-.035,.119,-.70,.005);
  box(drawer,.19,.091,.068,wood,marblesLeft+.094,.11,-1.075,.004);
  const liner=detail('liner',drawer,dw*.385,.073,-1.32);
  box(liner,.24,.012,.27,finish(0xaebca5),0,0,.126);
  const curled=box(liner,.093,.012,.063,finish(0xbbc7b0),.069,.012,.241);
  curled.rotation.x=-.25;
  const crumbPlan=detail('crumb-plan',drawer,dw*.385,.079,-1.20);
  box(crumbPlan,.245,.009,.22,cream);
  drawn(crumbPlan,.239,.216,(c,w,h)=>{
    c.fillStyle='#e4ead6';c.fillRect(0,0,w,h);
    c.strokeStyle='#688478';c.lineWidth=.002;
    c.strokeRect(.014,.029,w-.028,h-.05);
    c.beginPath();
    c.moveTo(.014,.11);c.lineTo(w-.014,.11);
    c.moveTo(.137,.029);c.lineTo(.137,.11);c.stroke();
    c.font='0.016px monospace';c.fillStyle='#405b57';
    c.fillText('research',.023,.076);
    c.fillText('misc',.164,.076);
    c.fillText('structural crumbs',.029,.157);
    c.font='0.011px monospace';c.fillText('SECTION A',.015,.020);
  },0,.006,0,true);
  crumbPlan.visible=false;
  liner.rotation.x=-.06;
  const screw=detail('screw',drawer,dw*.38,.078,-.52);
  cylinder(screw,.034,.028,.018,brassDark,0,.038,0,16);
  cylinder(screw,.013,.010,.045,brass,0,.009,0,14);
  for(let i=0;i<4;i++){
    const threads=mesh(screw,new T.TorusGeometry(.013-i*.0007,.0022,5,13),brassDark,0,.025-i*.010,0);
    threads.rotation.x=Math.PI*.48;
  }
  letter(screw,'?',.034,.040,0,.048,0,{flat:true,ink:'#fff3ba',italic:true}).rotation.z=-.11;
  screw.position.y+=.01;screw.rotation.z=.98;
  const rubberStamp=detail('drawer-stamp',drawer,dw*.31,.081,-.88);
  cylinder(rubberStamp,.063,.071,.026,finish(0x7f3c48,.8),0,.014,0,18);
  cylinder(rubberStamp,.049,.061,.023,wood,0,.038,0,20);
  bead(rubberStamp,0,.100,0,.036,.052,.036,wood);
  rubberStamp.rotation.y=-.35;
  box(drawer,1.10,.003,.68,finish(0xafbaa3),0,.074,-.65);
  drawerNote.visible=false;
  const keepsake=tag(group(drawer,0,.087,-.65),'keepsake',[0,.03,0],1.02,.58);
  box(keepsake,1.12,.022,.70,cream);illustration(keepsake,'assets/furniture/prints/night-mail.webp',1.04,.62,0,.013,0,true);
  keepsake.rotation.y=-.10;
  // Rear hutch, upright shelves, and a pinboard live in the same coordinate system as the desk.
  box(world,width-.16,3.21,.11,darkWood,0,1.59,-2.22);
  box(world,width-.36,2.95,.025,finish(0x6c6855),0,1.57,-2.15);
  const backing=drawn(world,width-.36,2.95,(c,w,h)=>{
    const light=c.createLinearGradient(0,0,w,h);
    light.addColorStop(0,'#4b4e42');
    light.addColorStop(.51,'#656a55');
    light.addColorStop(1,'#545846');
    c.fillStyle=light;c.fillRect(0,0,w,h);
    c.lineWidth=.008;
    for(let y=.008;y<h;y+=.022){
      c.strokeStyle=y%.066<.024?'#e3debf13':'#211e1916';
      c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();
    }
    c.strokeStyle='#d5cdb518';
    for(let x=.008;x<w;x+=.031){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
    for(const y of [0,h*.548]){
      const shelfShadow=c.createLinearGradient(0,y,0,y+.29);
      shelfShadow.addColorStop(0,'#2f24194f');
      shelfShadow.addColorStop(1,'#2f241900');
      c.fillStyle=shelfShadow;c.fillRect(0,y,w,.29);
    }
  },0,1.57,-2.136);
  backing.material.transparent=false;
  backing.material.depthWrite=true;
  for(const direction of [-1,1]){
    const x=direction*(side-.04);
    box(world,.14,3.24,.95,wood,x,1.6,-1.79,.025);
    box(world,.15,3.21,.045,trim,x,1.60,-1.35,.012);
    for(const y of [.18,1.46,3.04]){
      for(const z of [-1.53,-2.01]){
        const plug=cylinder(world,.025,.028,.016,trim,x+direction*.070,y,z,12);
        plug.rotation.z=Math.PI/2;
      }
    }
  }
  // Keep the shelf ends clear of the rear panel plane to avoid z-fighting.
  for(const y of [1.45,3.18]){
    box(world,width-.13,.14,1.012,wood,0,y,-1.751,.025);
    box(world,width-.08,.052,.12,trim,0,y-.063,-1.25,.015);
  }
  box(world,.11,1.61,.90,wood,narrow?.35:.65,2.31,-1.76,.016);
  box(world,width-.35,.075,.89,wood,0,.044,-1.77,.01);
  // The files on the shelf have actual covers, page blocks, foil bands and printed spines.
  const bookColors=[0x754151,0x50695f,0x695268,0x4d616b];
  function shelvedBook(parent,x,y,height,thickness,color,title,tilt=0){
    const g=group(parent,x,y,-1.63);g.rotation.z=tilt;
    const binding=cloth(color);
    box(g,thickness-.035,height-.053,.55,cream,0,height/2,-.025);
    box(g,thickness,height,.075,binding,0,height/2,.241,.018);
    for(const q of [-1,1])box(g,.018,height,.61,binding,q*(thickness-.018)/2,height/2,-.030);
    for(const f of [.12,.16,.88])box(g,thickness*.80,.011,.006,brass,0,height*f,.282);
    drawn(g,thickness*.62,.075,(c,w,h)=>{
      const motif=(title?.length??0)%4;
      c.strokeStyle='#c3a478';c.fillStyle='#d5bb85';c.lineWidth=.004;
      c.beginPath();c.moveTo(w*.21,h*.65);
      c.lineTo(w*.48,h*(.18+.15*motif));c.lineTo(w*.79,h*.65);c.stroke();
      c.beginPath();c.arc(w*.5,h*.63,.010+.002*motif,0,Math.PI*2);c.fill();
    },0,height*.935,.285);
    if(title){const t=letter(g,title,height*.62,Math.min(.15,thickness*.68),0,height*.53,.284,{ink:'#fff0cd',bold:true});t.rotation.z=Math.PI/2;}
    return g;
  }
  // The two working collections face the visitor. Their companion volumes sit spine-out.
  function collection(id,x,w,h,color,coverArt){
    const shelf=tag(group(world,0,0,0),id,[x,1.52+h*.53,-1.38],w,h);
    const volume=detail(id+'-volume',shelf,x,1.52,-1.56);
    volume.rotation.y=id==='proof'?.14:-.12;
    volume.rotation.x=-.09;
    const binding=cloth(color);
    box(volume,w-.05,h-.04,.22,cream,0,h/2,0,.012);
    for(const z of [-.134,.134])box(volume,w,h,.035,binding,0,h/2,z,.012);
    box(volume,.055,h,.27,binding,-w/2+.025,h/2,0,.012);
    const rear=detail(id+'-rear',volume,0,h*.57,-.155);
    rear.rotation.y=Math.PI;
    const notes=id==='proof'?
      ['REFERENCE ONLY','639.4 · arguments still in transit','Please return all counterexamples.']:
      ['ERDŐS 607','Finite Euler product','The square-root factor stays.'];
    box(rear,w*.75,h*.52,.008,cream);
    notes.forEach((line,i)=>letter(rear,line,w*.68,h*.081,0,h*(.11-i*.12),.006,{italic:i===2}));
    illustration(volume,coverArt,w-.024,h-.024,0,h/2,.154);
    if(id==='proof'){
      // The center card rises about as far as the foil on the adjacent cards.
      const tuck=detail('proof-card',volume,w*.029,h*.258,.158);
      const enamel=finish(color,.90);
      box(tuck,w*.137,h*.185,.009,enamel,0,0,0,.005);
      drawn(tuck,w*.137,h*.185,(c,sw,sh)=>{
        c.strokeStyle='#ceae78';c.lineWidth=.005;c.strokeRect(.007,.007,sw-.014,sh-.014);
        c.beginPath();c.moveTo(sw/2,.29*sh);c.lineTo(.63*sw,.51*sh);c.lineTo(sw/2,.69*sh);c.lineTo(.37*sw,.51*sh);c.closePath();c.stroke();
      },0,0,.006);
      letter(tuck,'15',w*.098,h*.10,0,0,-.006,{ink:'#f2deab',paper:'#865149'}).rotation.y=Math.PI;
      tuck.rotation.z=.19;
    }else{
      const tuck=detail('research-question',rear,w*.27,-h*.15,.017);
      box(tuck,w*.29,h*.27,.011,finish(0xd6d8bc),0,0,0,.008);
      drawn(tuck,w*.26,h*.229,(c,sw,sh)=>{
        c.strokeStyle='#93a49a';c.lineWidth=.002;
        for(const i of [.24,.48,.72]){c.beginPath();c.moveTo(.01,sh*i);c.lineTo(sw-.01,sh*i);c.stroke();}
        for(const i of [.20,.43,.66,.89]){c.beginPath();c.moveTo(sw*i,.01);c.lineTo(sw*i,sh-.01);c.stroke();}
        c.fillStyle='#4d624d';c.font='italic 0.06px Georgia';c.fillText('√ ?',.028,sh*.59);
      },0,0,.007);
      tuck.rotation.z=-.12;
      const erratum=detail('research-erratum',rear,-w*.278,-h*.227,.016);
      box(erratum,w*.162,h*.22,.006,paper,0,0,0,.005);
      letter(erratum,'VII',w*.11,h*.080,0,0,.005,{ink:'#874c4e',italic:true});
      erratum.rotation.z=.13;
      const tab=detail('errata',volume,w*.32,h-.025,.059);
      box(tab,w*.18,.126,.018,finish(0xbd916e),0,.03,0,.014);
      letter(tab,'↳',w*.10,.055,0,.044,.011,{ink:'#5b413c'});
      tab.rotation.x=.25;tab.visible=false;
    }
    return shelf;
  }
  const proofX=narrow?-.60:-1.12, researchX=narrow?.80:1.58;
  const proof=collection('proof',proofX,narrow?1.32:1.68,narrow?1.38:1.43,0x694357,'assets/furniture/conjectures-binding.webp?v=3');
  const archive=collection('archive',researchX,narrow?.93:1.25,narrow?1.10:1.25,0x536760,'assets/furniture/research-binding.webp?v=3');
  const titles=['War','Graph theory','Proofs','Sequences'];
  const companions=narrow?2:4;
  for(let i=0;i<companions;i++){
    shelvedBook(proof,proofX-(narrow?.84:1.08)-i*.27,1.52,.94+i*.064,.23,bookColors[i],titles[i],i===0?-.075:0);
  }
  if(!narrow){
    shelvedBook(archive,2.37,1.52,1.03,.26,bookColors[1],'Field notes');
    shelvedBook(archive,2.68,1.52,.96,.25,bookColors[3],'Mechanics',.045);
  }
  // The club booklet and team photograph share the far end of the shelf.
  const zine=tag(group(world,narrow?1.54:3.15,1.52,-1.49),'epoch',[0,.25,.05],.51,.53);
  zine.rotation.set(-.13,-.12,-.035);
  box(zine,.50,.53,.048,paper,0,.268,0,.008);
  box(zine,.512,.54,.012,cloth(0x738082),0,.27,.029,.006);
  letter(zine,'Epoch',.445,.14,0,.30,.039,{ink:'#f2e4ce',bold:true});
  // One row across the wide hutch, two rows in the narrow one.
  const boardWidth=narrow?1.93:4.02,boardHeight=narrow?1.27:1.10;
  const pinboard=tag(group(world,narrow?.24:.08,.75,-1.58),'pinboard',[0,0,.08],boardWidth,boardHeight);
  box(pinboard,boardWidth,boardHeight,.075,trim,0,0,0,.021);
  box(pinboard,boardWidth-.095,boardHeight-.095,.030,corkMaterial(),0,0,.038);
  for(const y of [-1,1]){
    box(pinboard,boardWidth-.035,.045,.040,wood,0,y*(boardHeight-.052)/2,.045,.006);
  }
  for(const x of [-1,1]){
    box(pinboard,.045,boardHeight-.096,.040,wood,x*(boardWidth-.052)/2,0,.045,.006);
  }
  const printW=narrow?.351:.52,printH=narrow?.535:.79;
  const printStock=new T.MeshStandardMaterial({color:0xf9efd9,roughness:.94,side:T.DoubleSide});
  const buttons=document.querySelectorAll('[data-board-print]');
  buttons.forEach((button,i)=>{
    const x=narrow?(i%3-1)*.595:(i-2.5)*.646;
    const y=narrow?(i<3?.297:-.297):[.027,-.019,.042,-.023,.015,-.01][i];
    const g=tag(group(pinboard,x,y,.084),button.dataset.object,[0,0,.016],printW,printH);
    g.rotation.z=[.040,-.065,.032,-.022,.053,-.042][i];
    mesh(g,curledPrint(printW,printH,printW,printH),printStock);
    const artW=printW*.93;
    const printInk=new T.MeshStandardMaterial({
      map:photo('assets/furniture/prints/'+button.dataset.boardPrint+'.webp'),roughness:.82,
    });
    mesh(g,curledPrint(artW,artW*1.25,printW,printH,.019,.002),printInk,0,.019).castShadow=false;
    const clip=detail('pin-clip-'+button.dataset.object,g,-printW*.32,printH*.39,.025);
    const metal=mesh(clip,new T.TorusGeometry(.023,.004,7,13),brassDark);
    metal.scale.y=1.6;metal.rotation.z=.26;clip.visible=false;
    const pin=narrow?.012:.019;
    const head=detail('pin-head-'+button.dataset.object,g,0,printH/2-.028,.025);
    bead(head,0,0,0,pin,pin,pin,brass);
    cylinder(head,pin*.28,pin*.18,pin*1.8,brass,0,0,-pin*.51,8).rotation.x=Math.PI/2;
    const hole=detail('pin-hole-'+button.dataset.object,pinboard,x,y+printH/2-.028,.054);
    bead(hole,0,0,0,pin*.32,pin*.32,.001,finish(0x57402f));
    hole.visible=false;
  });
  // Stitched green leather blotter with a fine inset line.
  const matWidth=width*(narrow ? .75 : .69);
  const pad=tag(group(world,0,0,0),'blotter',[.12,.043,1.65],.75,.38);
  const matLeft=-matWidth/2-.04,matRight=matWidth/2-.04;
  const matFar=-.96,matNear=1.88,cornerCut=.28;
  function matStock(parent,corners,height,material,x=0,y=0,z=0){
    const shape=new T.Shape(corners.map(([x,z])=>new T.Vector2(x,-z)));
    const geometry=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});
    geometry.rotateX(-Math.PI/2);
    const position=geometry.attributes.position,uv=geometry.attributes.uv;
    for(let i=0;i<position.count;i++)uv.setXY(i,(x+position.getX(i)-matLeft)/matWidth,(z+position.getZ(i)-matFar)/2.84);
    return mesh(parent,geometry,material,x,y,z);
  }
  const mainMat=[[matLeft,matFar],[matRight,matFar],[matRight,matNear-cornerCut],[matRight-cornerCut,matNear],[matLeft,matNear]];
  const leatherUnder=finish(0x726347);
  matStock(pad,mainMat,.030,leatherUnder);
  const hide=loader.load('assets/furniture/blotter.webp',repaint);
  hide.wrapS=hide.wrapT=T.RepeatWrapping;hide.repeat.set(matWidth/1.5,2.8/1.5);hide.anisotropy=4;
  const blotter=new T.MeshStandardMaterial({color:0x697a67,map:hide,bumpMap:hide,bumpScale:.012,roughness:.83,roughnessMap:hide});
  matStock(pad,mainMat,.013,blotter,0,.030,0);
  const hinge=detail('pad-hinge',pad,matRight-cornerCut/2,.034,matNear-cornerCut/2);
  hinge.rotation.y=Math.PI/4;
  const patch=detail('pad-corner',hinge);
  const diagonal=cornerCut/Math.SQRT2;
  matStock(patch,[[-diagonal,0],[diagonal,0],[0,diagonal]],.009,blotter);
  matStock(patch,[[-diagonal,0],[diagonal,0],[0,diagonal]],.030,leatherUnder,0,-.030,0);
  drawn(patch,diagonal*2,diagonal,(c,w,h)=>{
    c.strokeStyle='#b6a482';c.lineWidth=.010;c.setLineDash([.029,.019]);
    c.beginPath();c.moveTo(.034,.012);c.lineTo(w/2,h-.033);c.lineTo(w-.034,.012);c.stroke();
  },0,.011,diagonal/2,true);
  drawn(pad,matWidth-.12,2.70,(c,w,h)=>{
    c.strokeStyle='#b6a482';c.lineWidth=.010;c.setLineDash([.029,.019]);
    c.beginPath();
    c.moveTo(.03,h-.033);c.lineTo(.03,.077);c.quadraticCurveTo(.032,.030,.086,.030);
    c.lineTo(w-.08,.030);c.quadraticCurveTo(w-.033,.033,w-.033,.080);
    c.lineTo(w-.033,h-.253);
    c.moveTo(w-.255,h-.033);c.lineTo(.03,h-.033);c.stroke();
  },-.04,.046,.46,true);
  // Metal oscilloscope with a glass graticule, waveform, knobs and coiled probe.
  const scope=tag(group(world,narrow?-1.65:-2.84,.054,-1.16),'scope',[0,.53,.32],1.26,.85);
  scope.rotation.y=.13;scope.scale.setScalar(narrow?.70:.83);
  box(scope,1.69,.98,.89,finish(0x677d74,.54),0,.55,0,.095);
  for(const x of [-.62,.62])box(scope,.19,.095,.54,finish(0x393934),x,.075,.01,.025);
  box(scope,1.57,.86,.075,finish(0xb9baa6,.68),0,.54,.45,.034);
  box(scope,.92,.58,.04,finish(0x4a534b),-.234,.57,.503,.028);
  box(scope,.836,.500,.022,finish(0x263a34,.58),-.234,.57,.516,.014);
  drawn(scope,.50,.662,scopeScale,.48,.571,.492,false,780);
  function drawGraticule(c,w,h,gain=.26,cycles=4.5){
    const glass=c.createRadialGradient(w*.42,h*.47,0,w*.48,h*.47,w*.62);
    glass.addColorStop(0,'#20453b');glass.addColorStop(.72,'#102e2d');glass.addColorStop(1,'#061c20');
    c.fillStyle=glass;c.fillRect(0,0,w,h);c.strokeStyle='#345248';c.lineWidth=.003;
    for(let i=1;i<10;i++){c.beginPath();c.moveTo(w*i/10,0);c.lineTo(w*i/10,h);c.stroke();}
    for(let i=1;i<6;i++){c.beginPath();c.moveTo(0,h*i/6);c.lineTo(w,h*i/6);c.stroke();}
    c.strokeStyle='#73907a80';
    for(let i=1;i<40;i++){
      const x=w*i/40, tick=i%4===0?.015:.006;
      c.beginPath();c.moveTo(x,h*.5-tick);c.lineTo(x,h*.5+tick);c.stroke();
    }
    for(let i=1;i<25;i++){
      const y=h*i/25;
      c.beginPath();c.moveTo(w/2-.006,y);c.lineTo(w/2+.006,y);c.stroke();
    }
    c.shadowColor='#b8f796';c.shadowBlur=5;c.strokeStyle='#d4f3a9';c.lineWidth=.007;c.beginPath();
    for(let i=0;i<=190;i++){const x=i/190*w,y=h*(.50+gain*Math.sin(i/190*Math.PI*cycles));if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();c.shadowBlur=0;
  }
  const scopeScreen=drawn(scope,.80,.47,drawGraticule,-.232,.57,.53).material;
  function tuneScope(gain,sweep){
    drawGraticule(scopeScreen.map.image.getContext('2d'),.80,.47,gain,sweep);
    scopeScreen.map.needsUpdate=true;
  }
  scopeScreen.emissive.set(0xd4ead2);
  scopeScreen.emissiveMap=scopeScreen.map;
  scopeScreen.emissiveIntensity=.035;
  drawn(detail('glass-glare',scope,-.234,.57,.536),.79,.47,(c,w,h)=>{
    const light=c.createLinearGradient(w*.15,0,w*.82,h*.85);
    light.addColorStop(0,'#e5eee900');
    light.addColorStop(.27,'#e5eee900');
    light.addColorStop(.41,'#e5eee93a');light.addColorStop(.46,'#dce8e52b');
    light.addColorStop(.50,'#dce8e509');light.addColorStop(.55,'#e5eee900');
    light.addColorStop(1,'#e5eee900');
    c.fillStyle=light;c.fillRect(w*.08,0,w*.84,h);
  },0,0,0);
  for(const [name,x,y,r] of [['tuner',.49,.66,.109],['gain',.41,.40,.067],['sweep',.62,.40,.067]]){
    const knob=detail(name,scope,x,y,.53);
    const collar=cylinder(knob,r*1.17,r*1.17,.012,finish(0x787c68,.49),0,0,-.027,22);
    collar.rotation.x=Math.PI/2;
    const k=cylinder(knob,r,r*.98,.094,finish(0x444c42,.69),0,0,.003,18);k.rotation.x=Math.PI/2;
    const face=cylinder(knob,r*.82,r*.87,.012,finish(0x54584b,.59),0,0,.049,30);face.rotation.x=Math.PI/2;
    box(knob,.013,r*.59,.008,cream,0,r*.29,.057);
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6;
      const grip=box(knob,.012,r*.13,.062,finish(0x3c443c,.74),Math.sin(angle)*r,Math.cos(angle)*r,.009);
      grip.rotation.z=-angle;
    }
  }
  letter(scope,'GAIN',.105,.027,.410,.288,.493,{bold:true,font:'monospace'});
  letter(scope,'TIME',.105,.027,.620,.288,.493,{bold:true,font:'monospace'});
  for(let i=0;i<4;i++)box(scope,.119,.023,.006,finish(0x45534c),.843,.61+i*.056,-.196,.003).rotation.y=Math.PI/2;
  bead(scope,.625,.779,.500,.018,.018,.010,finish(0x73352e,.40));
  bead(scope,.627,.781,.507,.010,.010,.006,finish(0xcf8b6b,.33));
  const screenGlow=detail('scope-glow',scope,-.232,.57,.534);
  const matchedStrip=detail('scope-strip',scope,-.232,.545,.545);
  box(matchedStrip,.747,.29,.012,finish(0xdecaa6),0,0,0,.004);
  illustration(matchedStrip,'assets/studio/flyover-wave.svg',.729,.244,0,-.007,.007);
  const scopeCursor=detail('scope-cursor',matchedStrip,-.357,0,.012);
  box(scopeCursor,.007,.245,.004,finish(0xb95f49));
  matchedStrip.visible=false;
  for(let mode=0;mode<5;mode++){
    const readout=group(screenGlow,0,0,.001*mode);
    drawn(readout,.795,.462,(c,w,h)=>paintScope(c,w,h,mode),0,0,0);
    readout.visible=false;
  }
  const jack=detail('probe-jack',scope,.689,.252,.507);
  const rim=cylinder(jack,.048,.046,.024,brassDark,0,0,.008,14);rim.rotation.x=Math.PI/2;
  bead(jack,0,0,.020,.028,.028,.007,finish(0x1f2828));
  const probeRest=[.12,.032,1.13];
  const cableTip=detail('cable',scope,...probeRest);
  const boot=cylinder(cableTip,.031,.025,.058,finish(0x695044),0,0,.006,14);boot.rotation.x=Math.PI/2;
  const axle=cylinder(cableTip,.015,.015,.038,brass,0,0,-.038,12);axle.rotation.x=Math.PI/2;
  const warranty=detail('service-label',scope,.05,.53,-.455);
  warranty.rotation.y=Math.PI;
  letter(warranty,'five minute fix department',1.15,.14,0,0,0,{paper:'#ead9a5'});
  const stickerFlap=detail('service-flap',warranty,.42,-.039,.005);
  box(stickerFlap,.18,.12,.006,finish(0xe9d3a0),-.076,-.025,.002).rotation.z=-.09;
  const circuit=drawn(detail('service-diagram',warranty,.29,-.061,.011),.57,.24,(c,w,h)=>{
    c.fillStyle='#e9d6a8';c.fillRect(0,0,w,h);c.strokeStyle='#72564c';c.lineWidth=.008;
    c.beginPath();c.moveTo(.06,.06);c.lineTo(.50,.06);c.lineTo(.50,.17);c.lineTo(.06,.17);c.closePath();c.stroke();
    c.font='0.043px monospace';c.fillStyle='#644654';c.fillText('wait → blame cable',.075,.133);
    c.beginPath();c.moveTo(.24,.061);c.lineTo(.26,.034);c.lineTo(.29,.083);c.lineTo(.32,.058);c.stroke();
  },-.03,-.11,.003);
  circuit.parent.visible=false;
  letter(scope,'EXPERIMENTS',1.16,.16,-.17,.178,.499,{bold:true,ink:'#252c24',font:'sans-serif'});
  const cableWire=detail('cable-wire',scope);
  wire(cableWire,[[.57,.23,.52],[.76,.065,.75],[.62,.03,1.03],[.34,.026,.98],probeRest],.019,finish(0x9b493c));
  // A banked propeller plane above a hardwood base. The complete display is one pick target.
  const stand=tag(group(world,narrow?-.39:-.79,.052,narrow?.64:.61),'plane',[0,.55,-.10],2.48,1.30);
  stand.rotation.y=.075;
  stand.scale.setScalar(narrow ? .41 : .545);
  box(stand,2.10,.095,1.15,darkWood,0,.052,.34,.044);
  box(stand,2.02,.049,1.09,wood,0,.119,.34,.023);
  cylinder(stand,.12,.15,.048,brassDark,.12,.16,-.04);
  wire(stand,[[.12,.173,-.04],[.115,.29,-.07],[.052,.41,-.14],[-.025,.49,-.14]],.029,brass);
  bead(stand,-.025,.502,-.14,.031,.029,.028,brass);
  const markerTrack=detail('flight-marker-track',stand,0,.137,.74);
  box(markerTrack,1.46,.006,.023,brassDark,0,0,0,.003);
  markerTrack.visible=false;
  const plaque=group(stand,0,.165,.81);
  plaque.rotation.x=-.88;
  box(plaque,1.98,.32,.043,brassDark,0,0,0,.018);
  letter(plaque,'DOPPLERGEIST',1.85,.267,0,0,.025,{paper:'#f4e4c1',ink:'#3c2130',bold:true,font:'sans-serif'});
  for(const x of [-.95,.95])bead(plaque,x,0,.024,.018,.018,.009,brass);

  const plane=detail('airframe',stand,-.04,.58,-.15);
  plane.rotation.set(-.065,-.59,-.045,'YXZ');
  const planeGeometry=airframeGeometry();
  const shadowAirframe=planeGeometry.attributes.position.clone();
  mesh(plane,planeGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.37,metalness:.12}));
  const ivoryEnamel=finish(0xf2dbac,.47), propMetal=finish(0xafaead,.31,.46);
  for(const [z,radius,height,y] of [[-.17,.142,.18,.14],[.18,.136,.162,.137]]){
    const arch=Array.from({length:15},(_,i)=>{
      const t=i*Math.PI/14;
      return [radius*Math.cos(t),y+height*Math.sin(t),z];
    });
    wire(plane,arch,.009,ivoryEnamel);
  }
  // Inset aileron hinge lines follow the changing camber and dihedral out to each tip.
  const seam=finish(0x92574a,.67);
  for(let i=0;i<9;i++){
    const angle=i*Math.PI/8;
    bead(plane,.178*Math.cos(angle),.173*Math.sin(angle)-.006,.654,
      .005,.005,.006,propMetal);
  }
  for(const side of [-1,1]){
    wire(plane,[[.65*side,.007,-.113],[.86*side,.024,-.119],[1.13*side,.047,-.137],[1.32*side,.068,-.148]],.0038,seam);
    bead(plane,.105*side,-.051,.898,.036,.026,.031,finish(0x473d39,.62));
  }
  const prop=detail('propeller',plane,0,0,.957);
  // Printed markings follow the skin so the wing cannot hide their edges.
  for(const [x,z,w,h,title] of [[.78,-.012,.52,.093,'flight tested on desk'],[-1.09,-.036,.245,.064,'DG-02'],[-.38,.079,.245,.064,'INSPECTED']]){
    const stamp=letter(plane,title,w,h,x,0,z,{ink:'#443633',bold:true,font:'monospace'});
    stamp.geometry.dispose();
    stamp.geometry=new T.PlaneGeometry(w,h,12,4).rotateX(Math.PI/2);
    const v=stamp.geometry.attributes.position;
    for(let i=0;i<v.count;i++)v.setY(i,wingUnderside(x+v.getX(i),z+v.getZ(i))-.004);
    stamp.geometry.computeVertexNormals();
  }
  const socket=mesh(plane,new T.TorusGeometry(.034,.012,7,18),brassDark,-.026,-.102,-.005);
  socket.rotation.x=Math.PI/2;
  const listen=detail('listen',plaque,0,-.096,.028);
  letter(listen,'listen first',.64,.045,0,0,.001,{ink:'#8d623c',italic:true});
  listen.visible=false;
  const flyover=detail('flyover',stand,0,.153,.74);
  bead(flyover,0,0,0,.023,.018,.022,finish(0xda854e,.24));
  flyover.visible=false;
  prop.rotation.z=.62;
  for(const sign of [-1,1]){
    const blade=bead(prop,.020*sign,.23*sign,0,.043,.228,.018,finish(0x51403c,.45));
    blade.rotation.z=-.095;
    const tip=bead(prop,.039*sign,.418*sign,0,.026,.040,.015,ivoryEnamel);
    tip.rotation.z=-.095;
  }
  bead(prop,0,0,.022,.099,.099,.135,propMetal);
  // A real three-sided manila folder. Its front cover pivots around the paper fold.
  const file=tag(group(world,narrow?-1.49:-2.38,.061,narrow?.42:.47),'file',[0,.09,0],1.91,1.30);
  file.rotation.y=-.14;file.scale.setScalar(narrow?.52:.70);
  const stock=finish(0xad9472,.88), front=finish(0xc0a889,.84);
  box(file,1.96,.021,1.36,stock,0,.015,0,.009);
  box(file,.71,.02,.16,stock,-.52,.017,-.70,.009);
  const stockPages=detail('folder-pages',file);
  for(let i=0;i<4;i++){
    const page=box(detail('folder-page-'+i,stockPages),1.79,.012,1.29,paper,(i%2)*.028,.038+i*.015,-.035-i*.017,.005);
    page.rotation.y=.02*i;
  }
  letter(file,'PROJECT INDEX',1,.15,0,.10,-.50,{flat:true,bold:true});
  const flap=detail('file-cover',file,0,.142,-.58);
  box(flap,1.96,.022,1.24,front,0,0,.62,.01);
  letter(flap,'Project files',1.69,.37,.01,.014,.54,{flat:true,ink:'#392b24',italic:true,bold:true});
  letter(file,'INDEX',.50,.11,-.52,.030,-.71,{flat:true,bold:true});
  // Two blind score lines at the fold let the folder expand as it fills.
  for(const z of [.055,.094])box(flap,1.85,.002,.009,stock,0,.013,z);
  drawn(flap,1.22,.08,(c,w)=>{c.fillStyle='#ad855b';c.fillRect(0,.03,w,.008);},.03,.014,.74,true);
  // Cloth binding, visible fore-edge and hinged front board.
  const book=tag(group(world,narrow?.72:1.06,.056,narrow?-.34:-.09),'book',[0,.20,0],1.22,1.62);
  book.rotation.y=.22;book.scale.setScalar(narrow?.54:.72);
  box(book,1.27,.039,1.66,plum,0,.029,0,.017);box(book,1.20,.14,1.57,cream,0,.112,.005,.023);
  box(book,.065,.21,1.65,plum,-.605,.115,0,.022);
  const cover=group(book,-.607,.196,0);box(cover,1.27,.042,1.66,plum,.61,0,0,.018);
  letter(cover,'Cinna’s',.98,.226,.64,.031,-.34,{flat:true,italic:true,ink:'#fff0c9'});
  letter(cover,'notebook',1.09,.248,.64,.031,-.105,{flat:true,bold:true,ink:'#fff0c9'});
  drawn(book,1.15,.125,(c,w,h)=>{
    c.fillStyle='#e6d7bc';c.fillRect(0,0,w,h);
    for(let i=0;i<17;i++){c.fillStyle=i%3?'#aa977b':'#d1bda2';c.fillRect(random()*.09,i*h/17,w-random()*.12,.002);}
  },0,.113,.792);
  const ribbon=detail('ribbon',book,.39,.07,.88);
  box(ribbon,.085,.012,.36,finish(0xb46167));
  for(const edge of [-.030,.030])box(ribbon,.005,.002,.342,finish(0xc48180),edge,.007,0);
  // Sealed envelopes, with individual folds, twine and postage.
  const letters=tag(group(world,narrow?.87:.98,.056,narrow?1.21:1.49),'letters',[0,.09,0],1.25,.74);
  letters.rotation.y=-.25;letters.scale.setScalar(narrow?.60:.73);
  for(let i=0;i<3;i++){const env=box(letters,1.34,.026,.80,finish([0xc5d3c3,0xe4baad,0xf4dfbe][i]),0,.017+i*.029,-.035*i,.012);env.rotation.y=(2-i)*.1;}
  drawn(letters,1.31,.76,(c,w,h)=>{c.strokeStyle='#a99479';c.lineWidth=.007;c.beginPath();c.moveTo(0,0);c.lineTo(w*.48,h*.57);c.lineTo(w,0);c.stroke();c.fillStyle='#947a50';c.fillRect(w*.84,h*.10,w*.105,h*.22);},0,.09,-.065,true);
  const envelopeFlap=detail('envelope-flap',letters,0,.105,-.398);
  const flapPaper=new T.Shape([new T.Vector2(-.655,0),new T.Vector2(.655,0),new T.Vector2(.02,-.428)]);
  const flapStock=new T.ExtrudeGeometry(flapPaper,{depth:.006,bevelEnabled:false});
  flapStock.rotateX(-Math.PI/2);
  mesh(envelopeFlap,flapStock,finish(0xe4d0ac));
  const contactCard=detail('contact-card',letters,.12,.126,-.112);
  box(contactCard,.651,.012,.322,cream,0,0,0,.005);
  letter(contactCard,'Cinna Davis',.51,.093,0,.007,.02,{flat:true,italic:true});
  contactCard.rotation.y=-.10;contactCard.visible=false;
  const envelope=detail('wax',letters,0,0,0);
  const wax=cylinder(envelope,.125,.13,.031,finish(0x9e5353,.5),0,.11,-.026,12);
  letter(letters,'Letters',.84,.225,.21,.100,.20,{flat:true,italic:true,bold:true});
  drawn(letters,.46,.22,(c,w,h)=>{
    c.strokeStyle='#796c6f';c.lineWidth=.009;c.beginPath();c.arc(.085,h*.50,.077,0,2*Math.PI);c.stroke();
    for(let i=0;i<3;i++){c.beginPath();c.moveTo(.13,.063+i*.04);c.bezierCurveTo(.23,i*.04,.29,.14+i*.04,w,.05+i*.04);c.stroke();}
  },.34,.118,-.252,true);
  // One curved blade and a painted vein texture are shared by every leaf on the cutting.
  const leafShape=new T.PlaneGeometry(1,1,12,20);
  const vertices=leafShape.attributes.position,leafUV=leafShape.attributes.uv;
  for(let i=0;i<vertices.count;i++){
    vertices.setXYZ(i,...leafPoint(leafUV.getY(i),leafUV.getX(i)*2-1));
  }
  leafShape.computeVertexNormals();
  const blade=document.createElement('canvas');blade.width=192;blade.height=320;
  const ink=blade.getContext('2d'),wash=ink.createLinearGradient(0,0,192,285);
  wash.addColorStop(0,'#8f9c54');wash.addColorStop(.42,'#b6c079');wash.addColorStop(1,'#738348');
  ink.fillStyle=wash;ink.fillRect(0,0,192,320);
  for(let i=0;i<260;i++){
    const x=random()*192,y=random()*320;
    ink.fillStyle=random()>.67?'rgba(235,216,133,.17)':'rgba(58,84,46,.10)';
    ink.beginPath();ink.ellipse(x,y,1+random()*4,3+random()*12,(x<96?1:-1)*.45,0,Math.PI*2);ink.fill();
  }
  for(const side of [-1,1])for(let row=0;row<11;row++){
    const y=300-row*24;
    ink.strokeStyle='rgba(224,224,155,.52)';ink.lineWidth=.9;
    ink.beginPath();ink.moveTo(96,y);ink.bezierCurveTo(96+side*22,y-10,96+side*53,y-16,96+side*97,y-49);ink.stroke();
  }
  ink.strokeStyle='#d3d398';ink.lineWidth=2;ink.beginPath();ink.moveTo(96,319);ink.quadraticCurveTo(94,168,96,4);ink.stroke();
  const leafMap=new T.CanvasTexture(blade);leafMap.colorSpace=T.SRGBColorSpace;
  const glazedLeaves=[0x8ba862,0xa1b064,0x779954,0x9ba761].map(tint=>
    new T.MeshStandardMaterial({color:tint,map:leafMap,roughness:.5,side:T.DoubleSide}));
  const pot=tag(group(world,0,1.53,-1.47),'plant',[0,.35,0],.58,.65);
  pot.position.x=narrow?-2.17:-3.78;pot.scale.setScalar(narrow?.58:.80);
  const clayCanvas=document.createElement('canvas');clayCanvas.width=256;clayCanvas.height=128;
  const clay=clayCanvas.getContext('2d');clay.fillStyle='#ebc5a7';clay.fillRect(0,0,256,128);
  for(let i=0;i<3600;i++){
    clay.fillStyle=random()>.5?'rgba(105,68,55,.22)':'rgba(255,239,209,.38)';
    clay.fillRect(random()*256,random()*128,random()*1.9+.3,random()+.3);
  }
  const clayMap=new T.CanvasTexture(clayCanvas);clayMap.colorSpace=T.SRGBColorSpace;
  const terracotta=new T.MeshStandardMaterial({color:0xd08e74,map:clayMap,roughness:.89});
  const profile=[[0,.006],[.17,.006],[.19,.023],[.20,.06],[.268,.355],[.292,.361],[.293,.411],[.281,.422],[.251,.419],[.245,.394],[.23,.354],[.204,.20]];
  mesh(pot,new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),54),terracotta);
  cylinder(pot,.039,.039,.004,finish(0x684737),0,.004,0);
  cylinder(pot,.247,.239,.016,finish(0x493e30),0,.384,0,38);
  for(let i=0;i<27;i++){
    const a=random()*Math.PI*2,r=.226*Math.sqrt(random()),size=.006+random()*.009;
    bead(pot,r*Math.cos(a),.393,r*Math.sin(a),size,size*.45,size*.7,finish(i%4===0?0xb9a68c:0x685343));
  }
  for(const [y,r] of [[.065,.201],[.091,.207],[.348,.267]]){
    const ring=mesh(pot,new T.TorusGeometry(r,.0018,5,48),terracotta,0,y,0);ring.rotation.x=Math.PI/2;
  }
  const stem=finish(0x758149,.72);
  letter(pot,'rotate occasionally',.285,.09,0,.003,0,{flat:true,ink:'#8a5e42'}).rotation.x=Math.PI/2;
  cylinder(pot,.218,.206,.015,finish(0x986444),0,-.014,0,28);
  const fallen=detail('fallen-leaf',world,pot.position.x+.42,1.529,-1.46);
  mesh(fallen,leafShape,glazedLeaves[2],0,0,0).scale.setScalar(.33);
  fallen.visible=false;
  let caterpillarLeaf;
  for(let j=0;j<5;j++){
    const a=j*2.40+.3,dx=Math.sin(a),dz=Math.cos(a),height=.66+.055*(j%3);
    const path=new T.CatmullRomCurve3([[.044*dx,.39,.044*dz],[.105*dx,height-.06,.105*dz],[.23*dx,height,.23*dz],[.36*dx,height-.13,.37*dz]].map(v=>new T.Vector3(...v)));
    mesh(pot,new T.TubeGeometry(path,16,.0075,6,false),stem);
    for(let k=0;k<4;k++){
      const t=.30+k*.23,base=path.getPoint(t),turn=a+(k%2?-.86:.82);
      const tip=base.clone().add(new T.Vector3(.064*Math.sin(turn),.025,.064*Math.cos(turn)));
      wire(pot,[base.toArray(),base.clone().lerp(tip,.5).add(new T.Vector3(0,.013,0)).toArray(),tip.toArray()],.0045,stem);
      const selected=j===1&&k===3;
      const branch=detail(selected?'nibbled-leaf':'leaf-'+j+'-'+k,pot,tip.x,tip.y,tip.z);
      const leaf=mesh(branch,leafShape,glazedLeaves[(k+j)%4]);
      leaf.rotation.set(.10+t*(.55+.17*(j%3)),turn,(k%2?1:-1)*.21,'YXZ');
      leaf.scale.setScalar(.68+.14*(k%2)+.15*Math.sin(t*Math.PI));
      if(selected)caterpillarLeaf=leaf;
    }
  }
  const leaf=details.get('nibbled-leaf');
  const whole=caterpillarLeaf;
  const bitten=detail('bitten-leaf',leaf);
  const bittenMaterial=whole.material.clone();
  const eaten=document.createElement('canvas');eaten.width=blade.width;eaten.height=blade.height;
  const bite=eaten.getContext('2d');bite.drawImage(blade,0,0);
  bite.globalCompositeOperation='destination-out';
  for(const [x,y,r] of [[187,132,23],[175,111,18],[189,89,21],[191,66,20]]){
    bite.beginPath();bite.arc(x,y,r,0,Math.PI*2);bite.fill();
  }
  bittenMaterial.map=new T.CanvasTexture(eaten);bittenMaterial.map.colorSpace=T.SRGBColorSpace;bittenMaterial.alphaTest=.5;
  const bittenMesh=mesh(bitten,leafShape,bittenMaterial);
  bittenMesh.rotation.copy(whole.rotation);bittenMesh.scale.copy(whole.scale);
  const complete=detail('whole-leaf',leaf);complete.add(whole);
  bitten.visible=false;
  const crawler=detail('caterpillar',leaf);
  crawler.quaternion.copy(whole.quaternion);
  crawler.scale.copy(whole.scale);
  for(const [i,r] of caterpillarRadii.entries()){
    const segment=detail('caterpillar-segment-'+i,crawler);
    bead(segment,0,0,0,r,r*.85,r,finish(i%2?0xa0ac57:0xb5bc6d,.61));
    if(i===0){
      for(const x of [-.008,.008])bead(segment,x,-.002,.010,.0023,.0025,.002,finish(0x323020));
    }else{
      for(const x of [-.56,.56])bead(segment,x*r,r*.62,-r*.09,r*.25,r*.30,r*.29,finish(0xa3a95c,.69));
    }
  }
  crawler.visible=false;
  const dewTrack=detail('dew-track',leaf);
  dewTrack.quaternion.copy(whole.quaternion);dewTrack.scale.copy(whole.scale);
  const water=finish(0xcfe9c8,.096,.47);
  const dew=detail('dew',dewTrack);
  bead(dew,0,0,0,.009,.013,.009,water);
  const fallingDew=detail('falling-dew',pot);
  bead(fallingDew,0,0,0,.008,.015,.008,water);
  fallingDew.visible=false;
  const ripple=detail('ripple',pot,.181,.002,.091);
  const rip=mesh(ripple,new T.RingGeometry(.021,.025,18),new T.MeshStandardMaterial({color:0xded3a2,transparent:true,side:T.DoubleSide,depthWrite:false}));
  rip.rotation.x=-Math.PI/2;ripple.visible=false;
  const sprout=detail('sprout',pot,.03,.39,-.038);
  wire(sprout,[[0,0,0],[.03,.093,0],[.055,.145,.02]],.0042,stem);
  mesh(sprout,leafShape,glazedLeaves[2],.055,.145,.02).scale.setScalar(.20);
  const springtail=detail('springtail',pot,.19,.011,.069);
  bead(springtail,0,0,0,.005,.004,.009,finish(0x533a43));
  // A jointed task lamp, thumb screws and a domed enamel shade.
  // Leave room behind the shade at the full range of its hinge.
  const lamp=tag(group(world,half-(narrow?.52:.89),.018,-.85),"lamp",[0,.90,.12],.78,1.13);lamp.scale.setScalar(narrow?.71:.94);
  // Spun enamel and a folded rim, with a hollow shade and its own milk-glass bulb.
  function turned(parent,profile,material,x,y,z){
    return mesh(parent,new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),36),material,x,y,z);
  }
  const enamel=finish(0x496353,.29,.22);
  turned(lamp,[[0,0],[.40,0],[.445,.02],[.446,.052],[.42,.077],[.33,.100],[.15,.109],[.13,.15],[0,.15]],enamel,0,.008,0);
  wire(lamp,[[0,.10,0],[.04,.75,0],[.22,1.27,0],[-.23,1.58,.16]],.038,brass);
  wire(lamp,[[.125,.13,-.027],[.118,.72,-.027],[.299,1.27,-.027],[-.20,1.64,.13]],.019,brassDark);
  wire(lamp,[[.08,.13,-.02],[.13,.65,-.01],[.20,.86,-.01],[.29,1.28,-.06],[.05,1.34,-.07],[-.24,1.56,.16]],.013,finish(0x483c37));
  for(const [x,y,z] of [[.04,.75,0],[.22,1.27,0],[-.23,1.58,.16]]){
    const joint=cylinder(lamp,.071,.071,.13,brassDark,x,y,z,22);joint.rotation.x=Math.PI/2;
    const dial=cylinder(lamp,.046,.046,.033,brass,x,y,z+.08,12);dial.rotation.x=Math.PI/2;
  }
  const shadeHinge=detail('shade-hinge',lamp,-.23,1.58,.16);
  const shade=detail('shade',shadeHinge,-.01,-.04,.02);
  shade.rotation.set(-.16,0,-.36);
  turned(shade,[[.393,-.28],[.4,-.262],[.37,-.235],[.31,-.20],[.24,-.096],[.183,.042],[.10,.115],[.063,.13],[0,.13]],enamel,0,0,0);
  const lining=finish(0xf1dcc0,.50,.12);lining.side=T.DoubleSide;
  turned(shade,[[.039,.108],[.15,.017],[.22,-.12],[.31,-.224],[.394,-.278]],lining,0,0,0);
  cylinder(shade,.079,.075,.115,brassDark,0,-.007,0);
  const bulbGlass=new T.MeshStandardMaterial({color:0xfbf1ce,emissive:0xffcb7a,emissiveIntensity:.08,roughness:.25});
  bead(shade,0,-.15,0,.099,.148,.099,bulbGlass);
  cylinder(lamp,.067,.071,.018,brass,.23,.111,.092,20);
  const toggle=detail('lamp-switch',lamp,.23,.122,.092);
  const post=cylinder(toggle,.028,.036,.054,brassDark,0,.029,0,14);post.rotation.z=-.22;
  bead(toggle,-.010,.065,0,.026,.021,.025,brass);
  const cable=finish(0x51433b,.85);
  wire(lamp,[[.26,.049,-.27],[.36,.030,-.34],[.42,.011,-.57],[.34,.010,-.82],[.33,.007,-1.13]],.015,cable);
  // Pencils lie against the blotter, and a personal photograph sits on the shelf.
  for(let i=0;i<2;i++){
    const p=tag(group(world,(narrow?1.53:1.97)+i*.14,.053,.16+i*.11),i?'pencil':'rose-pencil',[0,0,0],.09,.50);p.rotation.y=.14+i*.075;
    const stick=cylinder(p,.032,.032,1.07,finish(i?0xc18e55:0x925b65),0,0,0,6);stick.rotation.x=Math.PI/2;
    const tip=cylinder(p,.031,0,.13,cream,0,0,-.60,6);tip.rotation.x=Math.PI/2;
  }
  const frame=tag(group(world,narrow?2.07:3.84,1.55,-1.49),'robot-photo',[0,.40,.06],.64,.76);frame.rotation.x=-.12;frame.rotation.y=-.10;frame.scale.setScalar(narrow?.65:.86);
  box(frame,.69,.80,.08,trim,0,.40,0,.024);box(frame,.61,.71,.025,cream,0,.40,.05);
  illustration(frame,'assets/furniture/prints/reefscape.webp',.54,.54,0,.421,.068);
  // Make a real material sample for the folder's contents.
  drawn(file,1.69,1.18,(c,w,h)=>{
    c.fillStyle='#eee4ce';c.fillRect(0,0,w,h);c.strokeStyle='#b9c4b9';c.lineWidth=.0025;
    for(let i=1;i<18;i++){c.beginPath();c.moveTo(0,i*.075);c.lineTo(w,i*.075);c.stroke();}
    c.fillStyle='#4d5053';c.resetTransform();
    const sx=c.canvas.width/w,sy=c.canvas.height/h;
    c.font='italic '+Math.round(.081*sy)+'px Georgia';c.fillText('Notes on a three-player game',.10*sx,.18*sy);
    c.font=Math.round(.052*sy)+'px monospace';c.fillText('A     B     C',.13*sx,.37*sy);c.fillText('15    10     4',.13*sx,.51*sy);c.fillText('turn 0  →  turn 90',.13*sx,.68*sy);
  },.015,.102,-.105,true);
  // Linen cover tooling and ribbon, brass binding clip, individual postage and wax.
  drawn(cover,1.09,1.45,(c,w,h)=>{
    c.strokeStyle='#caa986';c.lineWidth=.008;c.strokeRect(.035,.035,w-.07,h-.07);
    c.lineWidth=.003;c.strokeRect(.062,.062,w-.124,h-.124);
    for(const x of [.12,w-.12])for(const y of [.12,h-.12]){
      c.beginPath();c.moveTo(x,y-.017);c.lineTo(x+.014,y);c.lineTo(x,y+.017);c.lineTo(x-.014,y);c.closePath();c.stroke();
    }
    c.lineWidth=.005;
    c.beginPath();c.moveTo(w*.39,h*.80);c.quadraticCurveTo(w*.53,h*.80,w*.65,h*.67);c.stroke();
    for(const [t,sign] of [[.28,-1],[.42,1],[.55,-1],[.69,1],[.82,-1]]){
      const x=w*(.39+.26*t),y=h*(.80-.13*t*t);
      c.beginPath();c.moveTo(x,y);
      c.quadraticCurveTo(x+.009,y+.060*sign,x+.073,y+.074*sign);
      c.quadraticCurveTo(x+.065,y+.021*sign,x,y);c.stroke();
    }
  },.611,.025,0,true);
  const binder=detail('binder',file,-.47,.13,-.62);
  box(binder,.30,.075,.14,finish(0x463f3c,.46,.25),0,-.035,.02,.018);
  for(const side of [-1,1]){
    const handle=detail('binder-arm-'+side,binder,0,0,.019*side);
    wire(handle,[[-.091,0,0],[-.091,.023,-.145],[-.063,.028,-.154],[.064,.028,-.154],[.083,.023,-.145],[.083,0,0]],.010,brass);
    handle.rotation.x=side*.28;
  }
  const split=detail('split-wax',letters,-.04,.101,-.026);
  for(const [x,z,r] of [[-.075,-.015,.045],[.065,.009,.060],[.036,-.05,.034]]){
    const chip=cylinder(split,r,r,.012,finish(0x9e5353,.63),x,0,z,5);
    chip.rotation.y=.49+x*6;
  }
  split.visible=false;
  const stamp=group(letters,.44,.107,-.285);
  box(stamp,.205,.009,.215,cream);illustration(stamp,'assets/furniture/prints/flyover.webp',.167,.182,0,.006,0,true);
  const seal=cylinder(envelope,.079,.082,.009,finish(0xbb7971,.53),0,.130,-.026,18);
  letter(envelope,'✿',.108,.10,0,.139,-.026,{flat:true,ink:'#7d3f40'});
  // Engraved instrument markings and the recessed carry handle.
  for(let i=0;i<8;i++)box(scope,.024,.006,.23,finish(0x46574c),.04+i*.057,1.045,-.06,.002);
  for(const x of [-.716,.716])for(const y of [.218,.867]){
    bead(scope,x,y,.496,.024,.024,.010,brassDark);box(scope,.022,.004,.003,cream,x,y,.508);
  }
  wire(scope,[[-.62,1.044,-.19],[-.62,1.12,-.20],[-.48,1.14,-.20],[-.08,1.14,-.20],[.01,1.10,-.20],[.01,1.045,-.20]],.023,finish(0x54524a));
  for(let i=0;i<9;i++){
    const a=i*Math.PI/6+.45;
    const tick=box(scope,.008,.022,.004,finish(0x6d6857),.49+.136*Math.cos(a),.66+.136*Math.sin(a),.499);
    tick.rotation.z=a-Math.PI/2;
  }
  // A small ceramic pencil cup lives beside the lamp.
  const mug=tag(group(world,half-(narrow?.71:.56),.06,-.30),'cup',[0,.26,0],.34,.52);
  const glaze=finish(0x76a29b,.28,.035);
  // Continue the profile around the lip, down the inside wall, and across the floor.
  const cupProfile=[[0,.010],[.080,.010],[.089,.003],[.101,.003],[.108,.012],[.113,.020],
    [.131,.051],[.146,.14],[.158,.26],[.164,.349],[.168,.363],[.167,.371],[.163,.376],
    [.157,.377],[.152,.373],[.151,.363],[.149,.349],[.143,.264],[.131,.146],[.118,.074],
    [.110,.054],[.090,.045],[0,.045]];
  const shell=turned(mug,cupProfile,glaze,0,0,0);
  // A darker glaze in the well gives depth even on renderers without ambient occlusion.
  const tint=[],uv=shell.geometry.getAttribute('uv');
  for(let i=0;i<uv.count;i++){
    const step=Math.round(uv.getY(i)*(cupProfile.length-1)),depth=step<15?0:1-cupProfile[step][1]/.377;
    tint.push(1-depth*.66,1-depth*.60,1-depth*.54);
    uv.setY(i,cupProfile[step][1]/.377);
    if(step>=15)uv.setX(i,.02);
  }
  shell.rotation.y=Math.PI;
  shell.material=glaze.clone();shell.material.vertexColors=true;
  shell.material.color.set(0xffffff);shell.material.map=photo('assets/furniture/stoneware.webp');
  shell.geometry.setAttribute('color',new T.Float32BufferAttribute(tint,3));
  const cupHandle=new T.CatmullRomCurve3([[.150,.290,0],[.196,.304,0],[.240,.286,0],
    [.258,.243,0],[.255,.191,0],[.231,.146,0],[.191,.120,0],[.138,.125,0]].map(v=>new T.Vector3(...v)));
  mesh(mug,new T.TubeGeometry(cupHandle,40,.022,12,false),glaze);
  const foot=finish(0xba886d,.86);
  turned(mug,[[.101,.003],[.109,.011],[.112,.018]],foot,0,0,0);
  const slip=finish(0x476d6c,.36);
  turned(mug,[[.1380,.092],[.1387,.096]],slip,0,0,0);
  turned(mug,[[.1396,.103],[.1400,.105]],slip,0,0,0);
  const cedar=finish(0xd5aa78,.77),lead=finish(0x35313b,.43);
  // Each pencil rests inside the cup and leans towards its own point on the rim.
  const pencils=[[.32,.21,.675,0xb46a52],[1.85,.16,.727,0xb6984c],
    [3.36,.23,.644,0xa07687],[5.03,.18,.707,0x48645b]];
  for(const [index,[angle,lean,length,paint]] of pencils.entries()){
    const holder=detail('cup-pencil-'+index,mug,.052*Math.cos(angle),.048,.052*Math.sin(angle));
    holder.rotation.y=-angle;
    const pencil=group(holder,0,0,0);pencil.rotation.z=-lean;
    const r=.0145;
    cylinder(pencil,r,r,length,finish(paint,.46),0,length/2,0,6);
    cylinder(pencil,.0045,r,.043,cedar,0,length+.0215,0,6);
    cylinder(pencil,.0005,.0045,.017,lead,0,length+.0515,0,6);
  }
  const paperStar=detail('paper-star',mug,0,.045,0);
  const starShape=new T.Shape();
  for(let i=0;i<10;i++){
    const a=Math.PI*i/5,r=i%2===0?.063:.031;
    starShape[i?'lineTo':'moveTo'](r*Math.cos(a),r*Math.sin(a));
  }
  starShape.closePath();
  mesh(paperStar,new T.ExtrudeGeometry(starShape,{depth:.010,bevelEnabled:false}),finish(0xe7b47f)).rotation.x=-Math.PI/2;
  drawn(mug,.103,.103,(c,w,h)=>{
    c.strokeStyle='#8c584a';c.lineWidth=.005;c.lineCap='round';
    c.beginPath();c.moveTo(.053,.086);c.quadraticCurveTo(.064,.052,.053,.025);
    c.quadraticCurveTo(.039,.012,.022,.022);c.quadraticCurveTo(.031,.047,.056,.047);
    c.quadraticCurveTo(.061,.026,.082,.023);c.quadraticCurveTo(.077,.045,.057,.056);c.stroke();
    c.beginPath();c.moveTo(.038,.085);c.lineTo(.066,.085);c.stroke();
  },0,.002,0).rotation.x=Math.PI/2;
  const padGuide=detail('pad-guide',pad,matRight-.072,.002,matNear-.083);
  drawn(padGuide,.15,.14,(c,w,h)=>{
    c.strokeStyle='#795c43';c.lineWidth=.006;
    c.beginPath();c.moveTo(.031,.025);c.lineTo(.117,.039);c.lineTo(.119,.113);c.stroke();
    c.font='0.021px Georgia';c.fillStyle='#644d3e';c.fillText('close enough',.007,.08);
  },0,0,0,true);
  padGuide.visible=false;
  const filed=detail('loose-sheet',world,narrow?.06:.43,.059,.92);
  filed.rotation.y=.27;
  box(filed,.57,.009,.44,finish(0xe7d1a1),0,0,0,.011);
  box(filed,.543,.005,.418,paper,.007,.006,.003,.009);
  const fileFace=drawn(filed,.523,.402,()=>{},.006,.010,.005,true);
  function titleLooseFile(title){
    const canvas=fileFace.material.map.image;
    const ctx=canvas.getContext('2d');
    const {width,height}=canvas;
    ctx.resetTransform();ctx.clearRect(0,0,width,height);
    ctx.fillStyle='#917154';ctx.font='9px monospace';ctx.fillText('PROJECT FILE',9,16);
    ctx.fillStyle='#4b3737';ctx.font='italic bold 14px Georgia';
    const parts=title.split(' ');
    let line='',baseline=36;
    for(const word of parts){
      const next=[line,word].filter(Boolean).join(' ');
      if(line&&ctx.measureText(next).width>width-19){
        ctx.fillText(line,9,baseline,width-19);
        baseline+=16;line='';
      }
      line=[line,word].filter(Boolean).join(' ');
    }
    if(line)ctx.fillText(line,9,baseline,width-19);
    ctx.strokeStyle='#946d574a';ctx.lineWidth=1;
    for(let y=baseline+9;y<height-6;y+=7){
      ctx.beginPath();ctx.moveTo(9,y);ctx.lineTo(width-11,y);ctx.stroke();
    }
    fileFace.material.map.needsUpdate=true;
  }
  filed.visible=false;
  const deskPaper=detail('scratch',world,narrow?-.10:.18,.054,1.65);
  box(deskPaper,.58,.012,.39,cream);
  const sketchFace=drawn(deskPaper,.56,.37,()=>{},0,.007,0,true);
  deskPaper.rotation.y=.14;deskPaper.visible=false;
  const folded=detail('folded-sketch',deskPaper,0,.04,0);
  const foldedGeometry=new T.BufferGeometry();
  // Inverse UVs follow the original sheet through the center crease and wings.
  const folds=[
    [-.26,.049,.16,.04,.06],[.29,.034,0,1,.50],[-.11,.008,0,.26,.50],
    [.29,.034,0,1,.50],[-.26,.049,-.16,.04,.94],[-.11,.008,0,.26,.50],
    [.29,.034,0,1,.50],[-.24,.037,.075,.09,.28],[-.11,.008,0,.26,.50],
    [.29,.034,0,1,.50],[-.11,.008,0,.26,.50],[-.24,.037,-.075,.09,.72]
  ];
  foldedGeometry.setAttribute('position',new T.Float32BufferAttribute(folds.flatMap(row=>row.slice(0,3)),3));
  foldedGeometry.setAttribute('uv',new T.Float32BufferAttribute(folds.flatMap(row=>row.slice(3)),2));
  foldedGeometry.computeVertexNormals();
  mesh(folded,foldedGeometry,new T.MeshStandardMaterial({side:T.DoubleSide,color:0xfae8be,roughness:.86}));
  const drawingFace=new T.MeshStandardMaterial({side:T.DoubleSide,map:sketchFace.material.map,transparent:true,alphaTest:.14,polygonOffset:true,polygonOffsetFactor:-2});
  mesh(folded,foldedGeometry,drawingFace,0,.003,0);
  folded.visible=false;
  const flatSketch=detail('flat-sketch',deskPaper);
  for(const child of [...deskPaper.children])if(child!==folded&&child!==flatSketch)flatSketch.add(child);
  const scratched=detail('lamplit-scratches',pad,-.95,.046,1.01);
  drawn(scratched,.52,.19,(c,w,h)=>{
    c.strokeStyle='#b4a58780';c.lineWidth=.005;
    c.beginPath();c.moveTo(.03,.13);c.bezierCurveTo(.22,.04,.31,.17,.45,.060);
    c.lineTo(.39,.059);c.moveTo(.45,.060);c.lineTo(.43,.11);c.stroke();
  },0,0,0,true).parent.visible=false;
  const shadow=drawn(detail('rabbit-shadow',pad),.48,.48,()=>{},1.39,.048,.80,true);
  const projectLampShadow=lampProjection(shadow.material.map,shadowAirframe,()=>leaf.rotation.x*.30);
  shadow.parent.visible=false;
  const pressedLeaf=detail('pressed-leaf',book,.53,.12,.73);
  const pressed=mesh(pressedLeaf,leafShape,glazedLeaves[2]);
  pressed.scale.set(.31,.04,.45);
  pressed.rotation.y=-.19;
  pressedLeaf.visible=false;
  const clip=detail('bookmark',book,.37,.084,.95);
  bead(clip,0,0,0,.039,.018,.11,finish(0x738e56));
  clip.visible=false;
  const crossbeam=box(world,width-.63,.145,.17,darkWood,0,-1.18,1.90,.014);
  crossbeam.castShadow=true;
  const drawerEye=detail('under-eye',world,-.48,-1.18,2.00);
  bead(drawerEye,0,0,0,.092,.074,.026,cream);
  const pupil=detail('pupil',drawerEye,0,0,.027);
  bead(pupil,0,0,0,.034,.036,.015,finish(0x2e2825));
  drawerEye.visible=false;
  const hutchBack=detail('hutch-back',world,0,1.72,-2.286);
  const writing=detail('rear-pencil',hutchBack,-.46,.03,0);
  letter(writing,'this side faces the wall',1.66,.19,0,0,0,{ink:'#e8c997',italic:true}).rotation.y=Math.PI;
  const smilingScrew=detail('rear-screw',hutchBack,.59,.00,-.019);
  const screwHead=cylinder(smilingScrew,.043,.051,.025,brassDark,0,0,0,16);
  screwHead.rotation.x=Math.PI/2;
  for(const x of [-.014,.014])bead(smilingScrew,x,.012,-.014,.005,.005,.002,cream);
  wire(smilingScrew,[[-.017,-.007,-.014],[0,-.019,-.014],[.017,-.007,-.014]],.0035,cream);
  const reversePlaque=detail('reverse-plaque',hutchBack,.41,-.32,0);
  box(reversePlaque,1.29,.17,.028,brassDark,0,0,-.014,.008);
  letter(reversePlaque,'pretty ambitious for a drawer',1.24,.15,0,0,-.030,{ink:'#443239',paper:'#c3a76d'}).rotation.y=Math.PI;
  hutchBack.visible=false;
  const floorShim=detail('shim',world,-half+.38,-3.048,2.036);
  floorShim.rotation.y=.08;
  box(floorShim,.43,.029,.31,cream);
  box(floorShim,.405,.006,.294,paper,0,.012,.008);
  const equation=letter(floorShim,'2 + 2 ≈ 5',.29,.096,.018,.016,.057,{flat:true,ink:'#625344',italic:true});
  equation.rotation.z=-.06;
  const warning=drawn(floorShim,.421,.303,c=>{
    const W=96,H=69;
    c.setTransform(c.canvas.width/W,0,0,c.canvas.height/H,0,0);
    const rim=7;
    c.fillStyle='#ffd35b';c.fillRect(0,0,W,H);
    c.fillStyle='#321d24';
    for(const y of [0,H-rim]){
      c.save();c.beginPath();c.rect(0,y,W,rim);c.clip();
      for(let x=-rim;x<W;x+=12){
        c.beginPath();c.moveTo(x,y);c.lineTo(x+6,y);c.lineTo(x+13,y+rim);c.lineTo(x+7,y+rim);c.closePath();c.fill();
      }
      c.restore();
    }
    for(const x of [11,W/2,W-11])for(const y of [H*.26,H*.78]){
      c.beginPath();c.moveTo(x,y-6);c.lineTo(x-6,y+5);c.lineTo(x+6,y+5);c.closePath();c.strokeStyle='#47212c';c.lineWidth=1.1;c.stroke();
      c.textAlign='center';c.textBaseline='middle';c.font='bold 7px sans-serif';c.fillText('!',x,y+1.5);
    }
    c.textAlign='center';c.textBaseline='middle';c.font='bold 12px sans-serif';
    c.fillText('WARNING!!!',W/2,H*.43,W-10);
    c.font='bold 6.5px sans-serif';
    c.fillText('THIS PAPER IS LOAD-BEARING',W/2,H*.58,W-8);
  },0,-.016,0,false,1800);
  warning.rotation.x=Math.PI/2;
  const moth=detail('moth',world,0,0,0);
  for(const sign of [-1,1]){
    const wing=detail('moth-wing-'+sign,moth,0,0,0);
    bead(wing,sign*.045,0,0,.041,.009,.045,finish(0x9e7957,.77));
  }
  bead(moth,0,0,0,.011,.011,.051,finish(0x685341));
  moth.visible=false;
  const {coves,walls,showPosters,readingBulb}=decorateRoom(room,{desk:world,narrow,half,group,box,bead,cylinder,wire,finish,photo,tag,detail,drawn,weave,wood,trim,floorMat,night});
  showPosters(posterMode);
  // Small displayed pieces come forward at their existing mounting points.
  const displayPoses=new Map();
  const lifts={
    'robot-photo':[0,.061,-.083],epoch:[.015,.055,-.076],
    cup:[.028,0,-.095],pinboard:[0,.024,0],
  };
  for(const [id,{root}] of targets){
    const lift=lifts[id]||(root.userData.roomPoster?[0,.038,-.028]:null);
    if(lift)displayPoses.set(id,{root,y:root.position.y,z:root.position.z,tilt:root.rotation.x,lift});
  }
  function poseHover(id,amount){
    const pose=displayPoses.get(id);
    if(!pose)return;
    pose.root.position.y=pose.y+pose.lift[0]*amount;
    pose.root.position.z=pose.z+pose.lift[1]*amount;
    pose.root.rotation.x=pose.tilt+pose.lift[2]*amount;
  }
  // Bake short-range occlusion onto the work surface once. No full-screen AO pass.
  const contact=document.createElement('canvas');contact.width=512;contact.height=256;
  const ctx=contact.getContext('2d');
  ctx.fillStyle='white';ctx.fillRect(0,0,512,256);
  ctx.scale(512/width,256/4.55);ctx.translate(half,2.275);
  function contactShadow(g,w,d,roundness) {
    ctx.save();ctx.translate(g.position.x,g.position.z);ctx.rotate(-g.rotation.y);ctx.scale(g.scale.x,g.scale.z);
    for(const [spread,opacity] of [[.14,.045],[.085,.08],[.045,.15],[.016,.22]]) {
      ctx.fillStyle='rgba(45,33,30,'+opacity+')';ctx.beginPath();
      ctx.roundRect(-w/2-spread,-d/2-spread,w+2*spread,d+2*spread,roundness+spread);ctx.fill();
    }
    ctx.restore();
  }
  contactShadow(stand,1.99,.87,.05);
  contactShadow(file,1.85,1.26,.05); contactShadow(book,1.19,1.58,.05);
  contactShadow(letters,1.28,.74,.025);
  contactShadow(scope,1.57,.78,.12); contactShadow(lamp,.78,.78,.38); contactShadow(mug,.25,.25,.12);
  const contactMap=new T.CanvasTexture(contact);contactMap.flipY=false;
  // Daylight through the window falls in world space across every surface.
  const daylight={value:0};
  const materials=new Set();
  room.traverse(node=>{if(node.isMesh)materials.add(node.material);});
  for(const mat of materials) {
    if(mat.isMeshBasicMaterial)continue;
    const workSurface=mat===wood || mat===blotter;
    mat.customProgramCacheKey=()=>workSurface?'desk-contact':'desk-room';
    mat.onBeforeCompile=shader=>{
      if(workSurface)shader.uniforms.deskContact={value:contactMap};
      shader.uniforms.deskDaylight=daylight;
      shader.uniforms.deskNight=night;
      shader.vertexShader='varying vec3 vFurniturePosition;\n'+shader.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n vFurniturePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
      shader.fragmentShader=(workSurface?'uniform sampler2D deskContact;\n':'')+'uniform float deskDaylight, deskNight;\nvarying vec3 vFurniturePosition;\n'+shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
        vec3 onDesk=(vFurniturePosition-vec3(0.0,${world.position.y.toFixed(3)},${world.position.z.toFixed(3)}))/${deskScale.toFixed(2)};
        float u=dot(onDesk,vec3(.92,-.32,.40))-deskDaylight;
        float v=dot(onDesk,vec3(-.21,.61,1.0))-.37*deskDaylight;
        float glazing=(1.0-smoothstep(2.4,2.7,abs(u+1.46)))*(1.0-smoothstep(1.92,2.2,abs(v-.47)));
        float panes=smoothstep(.036,.12,abs(u+.91))*smoothstep(.035,.13,abs(v-.27));
        float daylight=mix(.31+.69*glazing*panes,1.0,deskNight);
        reflectedLight.directDiffuse*=daylight;
        reflectedLight.directSpecular*=daylight;
        // The rear of each shelf receives less skylight than its open lip.
        float recess=(1.0-smoothstep(-2.16,-1.15,onDesk.z));
        float rim=min(abs(onDesk.y-1.51),abs(onDesk.y-.06));
        float bounce=1.0-.27*recess-.15*recess*exp(-rim*3.0);
        reflectedLight.indirectDiffuse*=bounce;
        // A line source falls off across its wall and down into the room.
        float drop=6.51-vFurniturePosition.y;
        float roomHeight=1.0+.41*drop*drop;
        vec4 across=vec4(vFurniturePosition.x+9.38,9.38-vFurniturePosition.x,
          vFurniturePosition.z+2.51,10.48-vFurniturePosition.z);
        vec4 coveWash=1.0/(roomHeight+.65*across*across);
        vec3 cove=coveWash.x*vec3(1.0,.45,.23)+coveWash.y*vec3(.65,.48,1.0)
          +coveWash.z*vec3(1.0,.67,.40)+coveWash.w*vec3(.47,.45,1.0);
        reflectedLight.indirectDiffuse+=diffuseColor.rgb*cove*mix(.13,1.28,deskNight)*bounce;
        ${workSurface?`if(onDesk.y>-.02 && onDesk.y<.046){
          vec2 deskUV=vec2(onDesk.x/${width.toFixed(1)}+.5,onDesk.z/4.55+.5);
          float contact=texture2D(deskContact,deskUV).r;
          reflectedLight.indirectDiffuse*=contact;reflectedLight.directDiffuse*=mix(.48,1.,contact);
        }`:''}`);
    };
  }
  // Combine rigid geometry between joints; hinges, drawer travel and picking remain independent.
  const roomProps=new Map(), roomClocks=new Map(), previewGeometry=new Set();
  // Keep wall batches separate so the camera can cull the geometry behind it.
  const staticRoots=new Set([room,world,...Object.values(walls)]);
  const rigid=new Set([...staticRoots,flap,cover,...details.values()]);
  room.updateMatrixWorld(true);
  for(const [id,item] of targets){
    const {root}=item;
    if(!root.userData.roomProp){rigid.add(root);continue;}
    item.bounds=new T.Box3().setFromObject(root);
    item.point.copy(root.worldToLocal(item.bounds.getCenter(new T.Vector3())));
    const size=item.bounds.getSize(new T.Vector3());
    item.w=Math.max(size.x,size.z)/root.scale.x;
    item.h=size.y/root.scale.y;
    const hands=clockHands(root);
    if(hands){
      roomClocks.set(id,hands);
      Object.values(hands).forEach(hand=>rigid.add(hand));
      setClock(hands,new Date());
    }
    item.preview=root.clone(true);
    item.preview.traverse(mesh=>{if(mesh.isMesh)previewGeometry.add(mesh.geometry);});
    const tucked=[];
    root.traverse(part=>{if(!part.visible)tucked.push(part);});
    tucked.forEach(part=>part.removeFromParent());
    roomProps.set(id,item);
  }
  const batches=new Map(),source=new Set(),solidVariants=new Map(),fastMaterials=new Map();
  const occluders=Array.from(roomProps.values(),item=>item.bounds);
  // One draw can paint several solid colors on the same rigid part.
  function batchMaterial(mat) {
    if(mat.isMeshBasicMaterial || mat.map || mat.vertexColors || mat===bulbGlass || mat.transparent)return mat;
    const key=[mat.roughness,mat.metalness,mat.side].join('/');
    if(!solidVariants.has(key)){
      const tint=mat.clone();tint.color.set(0xffffff);tint.vertexColors=true;
      tint.onBeforeCompile=mat.onBeforeCompile;tint.customProgramCacheKey=mat.customProgramCacheKey;
      solidVariants.set(key,tint);
    }
    return solidVariants.get(key);
  }
  room.traverse(m=>{
    if(!m.isMesh||m.morphTargetInfluences)return;
    let parent=m.parent;while(!rigid.has(parent))parent=parent.parent;
    if(staticRoots.has(parent) && !m.parent.userData.roomProp){
      if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
      if(!m.material.isMeshBasicMaterial)occluders.push(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));
    }
    const mat=batchMaterial(m.material);
    const key=parent.id+'/'+mat.id+'/'+m.castShadow;
    if(!batches.has(key))batches.set(key,{parent,mat,cast:m.castShadow,meshes:[]});
    batches.get(key).meshes.push(m);source.add(m.geometry);
  });
  for(const {parent,mat,cast,meshes} of batches.values()){
    let surface=mat;
    if(software && parent!==mug && !mat.isMeshBasicMaterial){
      if(!fastMaterials.has(mat))fastMaterials.set(mat,new T.MeshLambertMaterial({
        color:mat.color,map:mat.map,side:mat.side,vertexColors:mat.vertexColors,transparent:mat.transparent,
        depthWrite:mat.depthWrite,alphaTest:mat.alphaTest,opacity:mat.opacity,polygonOffset:mat.polygonOffset,
        polygonOffsetFactor:mat.polygonOffsetFactor,polygonOffsetUnits:mat.polygonOffsetUnits,
        emissive:mat.emissive,emissiveMap:mat.emissiveMap,emissiveIntensity:mat.emissiveIntensity
      }));
      surface=fastMaterials.get(mat);
    }
    const [first]=meshes;
    if(meshes.length===1 && first.parent===parent && first.material===mat){
      // A single, already-local mesh needs no transform bake or index expansion.
      first.material=surface;
      source.delete(first.geometry);
      if(!first.geometry.boundingBox)first.geometry.computeBoundingBox();
      if(!first.geometry.boundingSphere)first.geometry.computeBoundingSphere();
      continue;
    }
    const inverse=parent.matrixWorld.clone().invert();
    const indexed=meshes.some(m=>m.geometry.index);
    const transform=new T.Matrix4();
    const parts=meshes.map(m=>{
      const g=m.geometry.clone();
      if(indexed&&!g.index){
        const size=g.attributes.position.count;
        const indices=size>65535?new Uint32Array(size):new Uint16Array(size);
        for(let i=0;i<size;i++)indices[i]=i;
        g.setIndex(new T.BufferAttribute(indices,1));
      }
      if(mat!==m.material){
        const color=new T.BufferAttribute(new Float32Array(3*g.attributes.position.count),3);
        const {r,g:green,b}=m.material.color;
        for(let i=0;i<color.count;i++)color.setXYZ(i,r,green,b);
        g.setAttribute('color',color);
      }
      return g.applyMatrix4(transform.multiplyMatrices(inverse,m.matrixWorld));
    });
    const combined=mergeGeometries(parts);parts.forEach(g=>g.dispose());
    meshes.forEach(m=>m.removeFromParent());
    const done=mesh(parent,combined,surface);done.castShadow=cast;
    combined.computeBoundingBox();combined.computeBoundingSphere();
  }
  source.forEach(g=>{if(!previewGeometry.has(g))g.dispose();});
  const flexCable=followProbe(cableWire.children[0],cableTip,probeRest);
  return {world:room,desk:world,deskScale,targets,roomProps,roomClocks,details,occluders,drawer,flap,cover,lamp,bulbGlass:fastMaterials.get(bulbGlass)||bulbGlass,scopeScreen:fastMaterials.get(scopeScreen)||scopeScreen,tuneScope,contactMap,daylight,night,coves,showPosters,posterCap,poseHover,projectLampShadow,flexCable,titleLooseFile,pencilBounds:{book:book.position.x+(narrow?.24:.43),mat:matRight-.10},sketchTexture:sketchFace.material.map,readingBulb};
}
