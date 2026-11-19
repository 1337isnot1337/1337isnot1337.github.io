// Units are relative to the desk, with its writing surface at y = 0.
import * as T from './vendor/three/three.module.min.js';
import { mergeGeometries } from './vendor/three/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';

export function furnish(scene, narrow, repaint) {
  const width = narrow ? 5.6 : 9.6;
  const half = width / 2;
  const world = new T.Group();
  scene.add(world);
  const targets = new Map();
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
    const key = [w,h,d,r].join(',');
    if (!geometry.has(key)) geometry.set(key,r ? new RoundedBoxGeometry(w,h,d,1,Math.min(r,h/2,w/2,d/2)) : new T.BoxGeometry(w,h,d));
    return mesh(parent,geometry.get(key),mat,x,y,z);
  }
  function cylinder(p,top,bottom,h,mat,x,y,z,n=22) {
    return mesh(p,new T.CylinderGeometry(top,bottom,h,n),mat,x,y,z);
  }
  function bead(p,x,y,z,rx,ry,rz,mat) {
    const key='sphere';
    if (!geometry.has(key)) geometry.set(key,new T.SphereGeometry(1,14,10));
    const m=mesh(p,geometry.get(key),mat,x,y,z);m.scale.set(rx,ry,rz);return m;
  }
  function wire(p,points,r,mat) {
    const path=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));
    return mesh(p,new T.TubeGeometry(path,Math.max(10,points.length*3),r,6,false),mat);
  }
  const loader = new T.TextureLoader();
  function photo(uri) {
    const t=loader.load(uri,repaint);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
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
  function drawn(parent,w,h,paint,x,y,z,flat=false) {
    const c=document.createElement('canvas');c.width=768;c.height=Math.max(48,Math.round(768*h/w));
    const ctx=c.getContext('2d');ctx.scale(c.width/w,c.height/h);paint(ctx,w,h);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    const m=mesh(parent,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.05,roughness:.9,side:T.DoubleSide}),x,y,z);
    m.castShadow=false;if(flat)m.rotation.x=-Math.PI/2;return m;
  }
  function letter(p,label,w,h,x,y,z,options={}) {
    return drawn(p,w,h,(c,a,b)=>{
      if(options.paper){c.fillStyle=options.paper;c.fillRect(0,0,a,b);}
      c.fillStyle=options.ink||'#3c3326';c.textAlign='center';c.textBaseline='middle';
      c.font=(options.italic?'italic ':'')+(options.bold?'bold ':'')+(b*.70)+'px '+(options.font||'Georgia');
      c.fillText(label,a/2,b*.51,a*.94);
    },x,y,z,options.flat);
  }
  function illustration(p,uri,w,h,x,y,z,flat=false) {
    const m=mesh(p,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:photo(uri),roughness:.84}),x,y,z);
    if(flat)m.rotation.x=-Math.PI/2;m.castShadow=false;return m;
  }
  function tag(root,id,point,w,h) {
    root.userData.pick=id;targets.set(id,{root,point:new T.Vector3(...point),w,h});return root;
  }
  const woodMap=photo('assets/furniture/grain.webp');
  woodMap.wrapS=woodMap.wrapT=T.RepeatWrapping;
  const wood = new T.MeshStandardMaterial({map:woodMap,roughness:.48,color:0xffe9c9});
  const trim=wood.clone();trim.color.set(0xc19b77);
  const darkWood=wood.clone();darkWood.color.set(0x987358);
  const floorMap=woodMap.clone();floorMap.repeat.set(5,6);floorMap.needsUpdate=true;
  const floorMat=new T.MeshStandardMaterial({map:floorMap,color:0x967f72,roughness:.68});
  const brass=finish(0xbd8d4d,.35,.55), brassDark=finish(0x78563a,.53,.40);
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
  wire(drawer,[[-.31,.15,.18],[-.29,.11,.29],[-.18,.066,.33],[.18,.066,.33],[.29,.11,.29],[.31,.15,.18]],.034,brass);
  const keepsake=tag(group(drawer,0,.087,-.65),'keepsake',[0,.03,0],1.02,.58);
  box(keepsake,1.12,.022,.70,cream);illustration(keepsake,'assets/studio/night-mail.webp',1.04,.62,0,.013,0,true);
  keepsake.rotation.y=-.10;
  // Rear hutch, upright shelves, and a pinboard live in the same coordinate system as the desk.
  box(world,width-.16,3.21,.11,darkWood,0,1.59,-2.22);
  box(world,width-.36,2.95,.025,finish(0x6c6855),0,1.57,-2.15);
  for(const x of [-side+.04,side-.04]) box(world,.14,3.24,.95,wood,x,1.6,-1.79,.025);
  for(const y of [1.45,3.18]){
    box(world,width-.13,.14,1.03,wood,0,y,-1.76,.025);
    box(world,width-.08,.052,.12,trim,0,y-.063,-1.25,.015);
  }
  box(world,.11,1.61,.90,wood,narrow?.35:.65,2.31,-1.76,.016);
  box(world,width-.35,.075,.89,wood,0,.044,-1.77,.01);
  // The files on the shelf have actual covers, page blocks, foil bands and printed spines.
  const bookColors=[0x754151,0x50695f,0xb99a6b,0x4d616b,0xb67769,0x695268,0x82774c];
  function shelvedBook(parent,x,y,height,thickness,color,title,tilt=0){
    const g=group(parent,x,y,-1.63);g.rotation.z=tilt;
    const binding=cloth(color);
    box(g,thickness-.035,height-.053,.55,cream,0,height/2,-.025);
    box(g,thickness,height,.075,binding,0,height/2,.241,.018);
    for(const q of [-1,1])box(g,.018,height,.61,binding,q*(thickness-.018)/2,height/2,-.030);
    for(const f of [.12,.16,.88])box(g,thickness*.80,.011,.006,brass,0,height*f,.282);
    if(title){const t=letter(g,title,height*.62,Math.min(.15,thickness*.68),0,height*.53,.284,{ink:'#fff0cd',bold:true});t.rotation.z=Math.PI/2;}
    return g;
  }
  const shelfBooks=group(world,0,0,0);const titles=['War','Graph theory','Proofs','Sequences','Combinatorics','Analysis','Fractions'];
  const total=narrow?6:9;
  for(let i=0;i<total;i++){
    const w=.21+(i%3)*.048;
    shelvedBook(shelfBooks,-half+.43+i*.32,1.52,1.00+(i*7%6)*.075,w,bookColors[i%7],titles[i%7],i===total-1?-.12:0);
  }
  tag(shelfBooks,'proof',[-half+.44+(total-1)*.16,2.11,-1.35],narrow?1.4:2.2,.90);
  const archive=group(world,0,0,0);
  for(let i=0;i<(narrow?3:6);i++)shelvedBook(archive,half-.51-i*.35,1.52,.99+(i%4)*.11,.29,bookColors[(i+3)%7],['Field notes','Mechanics','Collected papers'][i%3],i===2?.09:0);
  tag(archive,'archive',[half-(narrow?.85:1.35),2.05,-1.36],narrow?.96:1.95,.90);
  // Pinned prints tuck behind the work surface.
  const pinX=narrow?.59:.23;const pinboard=group(world,pinX,.69,-2.04);
  box(pinboard,narrow?1.27:2.17,1.10,.09,trim,0,0,0,.025);
  box(pinboard,narrow?1.17:2.06,1.01,.04,finish(0xb88959),0,0,.061);
  for(const [i,uri] of ['flyover','conway'].entries()){
    const g=group(pinboard,(i-.5)*(narrow?.46:.78),i?.06:-.04,.096);g.rotation.z=i?-.11:.080;
    box(g,.46,.71,.018,paper);illustration(g,'assets/prints/'+uri+'.webp',.40,.51,0,.041,.014);
    bead(g,0,.30,.024,.032,.032,.025,brass);
  }
  // Stitched green leather blotter with a fine inset line.
  const matWidth=width*.75;
  box(world,matWidth,.034,2.84,finish(0x726347),-.04,.015,.46,.016);
  box(world,matWidth-.038,.015,2.80,cloth(0x6c7967),-.04,.036,.46,.007);
  for(const z of [-.87,1.79])box(world,matWidth-.18,.003,.014,finish(0xb1a17b),-.04,.045,z);
  for(const x of [-matWidth/2+.055,matWidth/2-.135])box(world,.014,.003,2.66,finish(0xb1a17b),x,.045,.46);
  // Metal oscilloscope with a glass graticule, waveform, knobs and coiled probe.
  const scope=tag(group(world,narrow?-1.56:-2.84,.054,-.71),'scope',[0,.53,.32],1.26,.85);
  scope.rotation.y=.13;const scale=narrow?.78:1;scope.scale.setScalar(scale);
  box(scope,1.69,.98,.89,finish(0x738e83,.5),0,.55,0,.095);
  for(const x of [-.62,.62])box(scope,.19,.095,.54,finish(0x393934),x,.075,.01,.025);
  box(scope,1.57,.86,.075,finish(0xcfcab2,.64),0,.54,.45,.034);
  box(scope,.92,.58,.04,finish(0x4a534b),-.234,.57,.503,.028);
  drawn(scope,.80,.47,(c,w,h)=>{
    c.fillStyle='#112e2b';c.fillRect(0,0,w,h);c.strokeStyle='#345248';c.lineWidth=.003;
    for(let i=1;i<10;i++){c.beginPath();c.moveTo(w*i/10,0);c.lineTo(w*i/10,h);c.stroke();}
    for(let i=1;i<6;i++){c.beginPath();c.moveTo(0,h*i/6);c.lineTo(w,h*i/6);c.stroke();}
    c.strokeStyle='#e1ebb1';c.lineWidth=.008;c.beginPath();
    for(let i=0;i<=190;i++){const x=i/190*w,y=h*(.50+.26*Math.sin(i/190*Math.PI*4.5));if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();
  },-.232,.57,.53);
  for(const [x,y,r] of [[.49,.66,.109],[.41,.40,.067],[.62,.40,.067]]){
    const k=cylinder(scope,r,r,.10,finish(0x474d46),x,y,.53);k.rotation.x=Math.PI/2;
    box(scope,.013,r*.59,.008,cream,x,y+r*.29,.587);
  }
  letter(scope,'EXPERIMENTS',1.03,.09,-.17,.172,.498,{bold:true});
  wire(scope,[[.57,.23,.52],[.76,.065,.75],[.62,.03,1.03],[.34,.026,.98],[.12,.029,1.13]],.021,finish(0x9b493c));
  // A real three-sided manila folder. Its front cover pivots around the paper fold.
  const file=tag(group(world,narrow?-.91:-1.42,.061,.62),'file',[0,.09,0],1.91,1.30);
  file.rotation.y=-.18;file.scale.setScalar(narrow?.87:1.08);
  const stock=finish(0xd7a862,.88), front=finish(0xe5b878,.84);
  box(file,1.96,.021,1.36,stock,0,.015,0,.009);
  box(file,.71,.02,.16,stock,-.52,.017,-.70,.009);
  for(let i=0;i<4;i++){const page=box(file,1.79,.012,1.29,paper,(i%2)*.028,.038+i*.015,-.035-i*.017,.005);page.rotation.y=.02*i;}
  letter(file,'PROJECT INDEX',1,.15,0,.10,-.50,{flat:true,bold:true});
  const flap=group(file,0,.105,-.58);
  box(flap,1.96,.022,1.24,front,0,0,.62,.01);
  letter(flap,'Project files',1.39,.25,.03,.014,.56,{flat:true,ink:'#523e29',italic:true});
  drawn(flap,1.22,.08,(c,w)=>{c.fillStyle='#ad855b';c.fillRect(0,.03,w,.008);},.03,.014,.74,true);
  // Cloth binding, visible fore-edge and hinged front board.
  const book=tag(group(world,narrow?.99:1.28,.056,.20),'book',[0,.20,0],1.22,1.62);
  book.rotation.y=.22;book.scale.setScalar(narrow?.83:1.01);
  box(book,1.27,.039,1.66,plum,0,.029,0,.017);box(book,1.20,.14,1.57,cream,0,.112,.005,.023);
  box(book,.065,.21,1.65,plum,-.605,.115,0,.022);
  const cover=group(book,-.607,.196,0);box(cover,1.27,.042,1.66,plum,.61,0,0,.018);
  box(cover,.88,.008,.49,finish(0xe9dbc2),.63,.026,-.20,.003);
  letter(cover,'Cinna’s',.72,.135,.63,.032,-.29,{flat:true,italic:true});
  letter(cover,'notebook',.77,.15,.63,.032,-.12,{flat:true,italic:true});
  box(book,.085,.012,.36,finish(0xb46167),.39,.07,.88);
  // Sealed envelopes, with individual folds, twine and postage.
  const letters=tag(group(world,narrow?1.22:2.55,.056,1.41),'letters',[0,.09,0],1.25,.74);
  letters.rotation.y=-.25;letters.scale.setScalar(narrow?.82:1.06);
  for(let i=0;i<3;i++){const env=box(letters,1.34,.026,.80,finish([0xc5d3c3,0xe4baad,0xf4dfbe][i]),0,.017+i*.029,-.035*i,.012);env.rotation.y=(2-i)*.1;}
  drawn(letters,1.31,.76,(c,w,h)=>{c.strokeStyle='#a99479';c.lineWidth=.007;c.beginPath();c.moveTo(0,0);c.lineTo(w*.48,h*.57);c.lineTo(w,0);c.stroke();c.fillStyle='#947a50';c.fillRect(w*.84,h*.10,w*.105,h*.22);},0,.09,-.065,true);
  const wax=cylinder(letters,.125,.13,.031,finish(0x9e5353,.5),0,.11,-.026,12);
  letter(letters,'Letters',.63,.14,.26,.100,.19,{flat:true,italic:true});
  // Two actual cassette reels sit behind the transparent window.
  const tape=tag(group(world,narrow?-.76:-.49,.063,1.62),'tape',[0,.09,0],1.01,.60);
  tape.rotation.y=.19;tape.scale.setScalar(narrow?.80:1);
  box(tape,1.04,.083,.64,finish(0x65617b),0,.05,0,.032);
  box(tape,.92,.012,.39,finish(0xd4b5bb),0,.098,-.049,.005);
  box(tape,.58,.012,.14,finish(0x525056),0,.106,-.015,.005);
  for(const x of [-.22,.22]){cylinder(tape,.068,.068,.017,cream,x,.125,-.017);cylinder(tape,.029,.029,.019,finish(0x3d3437),x,.137,-.017);}
  letter(tape,'off the clock',.69,.078,0,.107,-.177,{flat:true,italic:true});
  for(const x of [-.43,.43])for(const z of [-.23,.23])cylinder(tape,.017,.017,.009,brass,x,.099,z,8);
  // Wheel-thrown pot with live trailing leaves at the end of the hutch.
  const leafShape=new T.BufferGeometry();
  leafShape.setAttribute('position',new T.Float32BufferAttribute([0,0,0, -.085,.020,.05,-.102,.014,.15, 0,-.046,.30, .103,.014,.15,.085,.020,.05, 0,.040,.122],3));
  leafShape.setIndex([0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6]);leafShape.computeVertexNormals();
  const pot=group(world,narrow?-half+.47:-half+.80,1.53,-1.47);
  if(narrow)pot.position.set(-half+.37,.057,-1.59);
  else pot.position.x=.03;
  cylinder(pot,.28,.20,.41,finish(0xaf7559),0,.205,0);cylinder(pot,.294,.29,.063,finish(0xc28a6d),0,.40,0);
  cylinder(pot,.245,.24,.019,finish(0x493e30),0,.433,0);
  for(let j=0;j<5;j++){
    const a=j*2.4,px=Math.cos(a),pz=Math.sin(a);
    wire(pot,[[0,.43,0],[px*.12,.70,pz*.17],[px*.27,.74,pz*.31],[px*.46,.51,pz*.43]],.012,finish(0x697447));
    for(let k=0;k<5;k++){
      const t=(k+1)/5;
      const leaf=finish([0x5b7748,0x869550,0x526b43,0x7a8c4c][(j+k)%4]);leaf.side=T.DoubleSide;
      const l=mesh(pot,leafShape,leaf,px*(.05+t*.37),.56+.15*Math.sin(t*3)-.18*t*t,pz*t*.4);
      l.rotation.set(.25+t*(j%2?.94:.55),a+(k%2?.66:-.62),(k%2?1:-1)*.30);
    }
  }
  // A jointed task lamp, thumb screws and a domed enamel shade.
  const lamp=tag(group(world,half-(narrow?.52:.89),.018,-1.38),"lamp",[0,.90,.12],.78,1.13);lamp.scale.setScalar(narrow?.71:.94);
  cylinder(lamp,.41,.46,.08,sage,0,.04,0);
  wire(lamp,[[0,.08,0],[.04,.75,0],[.22,1.27,0],[-.23,1.58,.16]],.038,brass);
  for(const [x,y,z] of [[.04,.75,0],[.22,1.27,0],[-.23,1.58,.16]])bead(lamp,x,y,z,.08,.08,.065,brassDark);
  const shade=group(lamp,-.24,1.51,.18);shade.rotation.z=-.32;
  cylinder(shade,.113,.35,.28,finish(0x576e60,.42),0,-.12,0);
  cylinder(shade,.344,.344,.018,finish(0xe5d5af),0,-.266,0);
  // Pencils lie against the blotter, and a personal photograph sits on the shelf.
  for(let i=0;i<2;i++){
    const p=group(world,narrow?1.95:3.68,.028,.30+i*.20);p.rotation.y=.14+i*.12;
    const stick=cylinder(p,.032,.032,1.07,finish(i?0xc18e55:0x925b65),0,0,0,6);stick.rotation.x=Math.PI/2;
    const tip=cylinder(p,.031,0,.13,cream,0,0,-.60,6);tip.rotation.x=Math.PI/2;
  }
  const frame=group(world,narrow?.04:1.22,1.55,-1.60);frame.rotation.x=-.12;frame.rotation.y=-.10;
  box(frame,.69,.80,.08,trim,0,.40,0,.024);box(frame,.61,.71,.025,cream,0,.40,.05);
  illustration(frame,'assets/studio/roller.webp',.52,.53,0,.421,.068);
  // Make a real material sample for the folder's contents.
  drawn(file,1.69,1.18,(c,w,h)=>{
    c.fillStyle='#eee4ce';c.fillRect(0,0,w,h);c.strokeStyle='#b9c4b9';c.lineWidth=.0025;
    for(let i=1;i<18;i++){c.beginPath();c.moveTo(0,i*.075);c.lineTo(w,i*.075);c.stroke();}
    c.fillStyle='#4d5053';c.font='italic .081px Georgia';c.fillText('Notes on a three-player game',.10,.18);
    c.font='.052px monospace';c.fillText('A     B     C',.13,.37);c.fillText('15    10     4',.13,.51);c.fillText('turn 0  →  turn 90',.13,.68);
  },.015,.102,-.105,true);
  // Linen cover tooling and ribbon, brass binding clip, individual postage and wax.
  drawn(cover,1.09,1.45,(c,w,h)=>{
    c.strokeStyle='#caa986';c.lineWidth=.008;c.strokeRect(.035,.035,w-.07,h-.07);
    c.lineWidth=.003;c.strokeRect(.062,.062,w-.124,h-.124);
    c.beginPath();c.moveTo(w*.43,h*.76);c.quadraticCurveTo(w*.54,h*.68,w*.65,h*.75);c.quadraticCurveTo(w*.54,h*.84,w*.43,h*.76);c.stroke();
  },.611,.025,0,true);
  box(file,.30,.075,.14,finish(0x463f3c,.46,.25),-.47,.095,-.60,.018);
  wire(file,[[-.56,.13,-.62],[-.56,.16,-.77],[-.39,.16,-.77],[-.39,.13,-.62]],.012,brass);
  const stamp=group(letters,.44,.107,-.285);
  box(stamp,.205,.009,.215,cream);illustration(stamp,'assets/prints/flyover.webp',.167,.182,0,.006,0,true);
  const seal=cylinder(letters,.079,.082,.009,finish(0xbb7971,.53),0,.130,-.026,18);
  letter(letters,'✿',.108,.10,0,.139,-.026,{flat:true,ink:'#7d3f40'});
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
  const mug=group(world,half-(narrow?.37:.56),.06,-.57);
  cylinder(mug,.168,.130,.36,cloth(0xa6b7a6),0,.185,0);
  cylinder(mug,.143,.14,.012,finish(0x494b3d),0,.37,0);
  for(let i=0;i<4;i++){
    const g=group(mug,(i-1.5)*.047,.32,(i%2)*.055);g.rotation.z=(i-1.4)*.15;
    cylinder(g,.018,.018,.44,finish([0xb57558,0xc09a63,0x8f797d,0x687d79][i]),0,.17,0,6);
    cylinder(g,0,.018,.067,cream,0,.424,0,6);
  }
  // Faded wallpaper and wainscoting give the room scale on a tall screen.
  const wallMat=finish(0xb9b1a4);
  for(let i=-7;i<8;i++){
    box(world,.027,6,.025,finish(0xa6a193),i*.88,1.67,-2.473);
  }
  box(world,29,.11,.16,cream,0,3.82,-2.47,.018);
  // The room extends beyond the camera; the shelf and desk never float on a blank page.
  box(world,32,11,.18,wallMat,0,1,-2.59);
  box(world,32,.16,24,floorMat,0,-3.15,3);
  // Daylight through the window falls in world space across every surface.
  const materials=new Set();
  world.traverse(node=>{if(node.isMesh)materials.add(node.material);});
  for(const mat of materials) {
    mat.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec3 vFurniturePosition;\n'+shader.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n vFurniturePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
      shader.fragmentShader='varying vec3 vFurniturePosition;\n'+shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
        float u=dot(vFurniturePosition,vec3(.92,-.32,.40));
        float v=dot(vFurniturePosition,vec3(-.21,.61,1.0));
        float glazing=(1.0-smoothstep(2.4,2.7,abs(u+1.46)))*(1.0-smoothstep(1.92,2.2,abs(v-.47)));
        float panes=smoothstep(.036,.12,abs(u+.91))*smoothstep(.035,.13,abs(v-.27));
        float daylight=.31+.69*glazing*panes;
        reflectedLight.directDiffuse*=daylight;
        reflectedLight.directSpecular*=daylight;`);
    };
  }
  // Combine rigid geometry between joints; hinges, drawer travel and picking remain independent.
  const rigid=new Set([world,flap,cover,...[...targets.values()].map(item=>item.root)]);
  const batches=new Map(),source=new Set();
  world.updateMatrixWorld(true);
  world.traverse(m=>{
    if(!m.isMesh)return;
    let parent=m.parent;while(!rigid.has(parent))parent=parent.parent;
    const key=parent.id+'/'+m.material.id+'/'+m.castShadow;
    if(!batches.has(key))batches.set(key,{parent,mat:m.material,cast:m.castShadow,meshes:[]});
    batches.get(key).meshes.push(m);source.add(m.geometry);
  });
  for(const {parent,mat,cast,meshes} of batches.values()){
    const inverse=parent.matrixWorld.clone().invert();
    const parts=meshes.map(m=>{
      const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
      return g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));
    });
    const combined=mergeGeometries(parts);parts.forEach(g=>g.dispose());
    meshes.forEach(m=>m.removeFromParent());
    const done=mesh(parent,combined,mat);done.castShadow=cast;
  }
  source.forEach(g=>g.dispose());
  return {world,targets,drawer,flap,cover,lamp};
}
