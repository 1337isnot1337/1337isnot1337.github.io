import * as T from './vendor/three/three.module.min.js';
import { paintRoomPrint } from './room-print.js?v=1';

// Independent props grouped by where they live. Dimensions are relative to the desk.
const collections = {
  window: [
    ['rain-glass','Rainwater flask','flask',0x92aab4], ['pressed-fern','Pressed fern','botanical',0x657841],
    ['weather-book','Cloud atlas','book',0x4b7488], ['small-swallow','Porcelain swallow','bird',0x779baf],
    ['sowing-dish','Seed dish','bowl',0xb88666], ['blue-watering-can','Watering can','can',0x6b96a0],
    ['cutting-bottle','Pothos cutting','sprig',0x9a665e], ['garden-twine','Garden twine','spool',0xb8a078],
    ['seed-mix','Seed packet','packet',0xc3a869], ['window-lens','Brass loupe','loupe',0xb28b58],
    ['night-almanac','Night almanac','book',0x585467], ['cardinal-dial','Cardinal dial','dial',0x4d6b74],
    ['moon-study','Moon phase study','chart',0x4e758c], ['weather-slip','Pressure record','ticket',0x738795],
    ['brass-star','Brass star','star',0xb59259], ['sea-pot','Sea-glass pot','bowl',0x81a19b],
    ['fern-guide','Fern guide','book',0x637850], ['paint-swab','Wall paint swatch','swatch',0x938692],
    ['dry-branches','Dried stems','sprig',0x9d715e], ['small-sun','Sun catcher','prism',0xe2a459],
  ],
  records: [
    ['amber-reel','Amber tape reel','reel',0xba7a52], ['red-sleeve','Red record sleeve','record',0x8a524d],
    ['tour-stub','Tour ticket','ticket',0xb98183], ['headset','Studio headphones','headphones',0x424c58],
    ['tape-deck','Tape recorder','recorder',0x627d80], ['cream-sleeve','Ivory record sleeve','record',0xc1a36d],
    ['slate-cassette','Slate cassette','cassette',0x576878], ['copper-cassette','Copper cassette','cassette',0xa96955],
    ['late-show','Set list','chart',0x765a7c], ['film-camera','Film camera','camera',0x4d6664],
    ['thread-ribbon','Ribbon spool','spool',0x9b6782], ['tempo-dial','Tempo dial','dial',0x87616b],
    ['green-sleeve','Sage record sleeve','record',0x66825e], ['small-keys','Pocket keyboard','keys',0x766e82],
    ['petal-vase','Dried lavender','sprig',0xaa747c], ['hollow-bird','Hollow ceramic bird','bird',0xc08b6c],
    ['violet-jar','Violet brush jar','can',0x806d8d], ['taped-polaroid','Sound-check trace','frame',0x826979],
    ['brass-phonograph','Gramophone miniature','gramophone',0xb58958], ['chorus-book','Liner notes','book',0x694b62],
  ],
  instruments: [
    ['sample-rack','Specimen stand','rack',0x5d8580], ['green-flask','Green flask','flask',0x79998c],
    ['brass-caliper','Brass calipers','caliper',0xb49b65], ['optics-book','Optics notebook','book',0x6c6a82],
    ['chip-cartridge','Chip carrier','chip',0x605e73], ['red-prism','Ruby prism','prism',0xaf6571],
    ['pocket-scope','Pocket oscilloscope','radio',0x6a9191], ['galena','Mineral specimen','crystal',0x8a7997],
    ['copper-spool','Copper winding','spool',0xb77958], ['blue-lens','Blue filter','loupe',0x6c92ad],
    ['cosmic-rays','Track plate','chart',0x527f85], ['beige-foldout','Beamline foldout','packet',0xb98064],
    ['violet-specimen','Violet sample bottle','flask',0x9c7c99], ['meter-box','Analog meter','meter',0x775e59],
    ['ground-key','Workshop key','key',0xb99859], ['plug-board','Connector board','chip',0x625482],
    ['wave-card','Wave notebook','frame',0x758c8b], ['ceramic-saucer','Parts saucer','bowl',0xbc8d60],
    ['preserved-leaf','Mounted leaf sample','botanical',0x739362], ['calibration-clock','Calibration clock','dial',0x53657a],
  ],
  entry: [
    ['hall-clock','Hall clock','dial',0x887564], ['checked-scarf','Folded checked scarf','fabric',0x9a6675],
    ['house-keys','Spare key','key',0xb99a5b], ['market-bag','Canvas tote','tote',0x96817f],
    ['cedar-crate','Cedar crate','crate',0x967159], ['pocket-compass','Pocket compass','compass',0x5a7c80],
    ['red-poster-tube','Poster tube','tube',0xa56754], ['train-timetable','Train timetable','ticket',0x785952],
    ['map-book','Rail atlas','book',0x776383], ['airmail-spare','Airmail envelope','envelope',0xb8838c],
    ['hall-sprig','Dried yarrow','sprig',0xaa7d72], ['shoe-brush','Boot brush','brush',0x806350],
    ['entry-cup','Key bowl','bowl',0x82907c], ['spare-bulb','Spare lamp bulb','lantern',0xb49470],
    ['last-entry','Doorway print','frame',0xa57e64], ['plaid-throw','Wool throw','fabric',0x687c7b],
    ['match-striker','Match striker','can',0x937378], ['weekend-camera','Pocket camera','camera',0x55516a],
    ['coat-pin','Enamel leaf pin','botanical',0x8a8e61], ['entry-bird','Little clay crow','bird',0x5a6373],
  ],
  desk: [
    ['brass-airplane','Brass glider ornament','glider',0xba9258], ['inch-gauge','Folding rule','caliper',0xbba77a],
    ['ink-colors','Ink swatches','swatch',0x79586f], ['deskside-flask','Ink bottle','flask',0x526476],
    ['clay-cat','Tiny clay cat','cat',0xc99571], ['green-matchbox','Matchbox','packet',0x72816a],
    ['desk-film','35 mm film roll','spool',0x738190], ['thread-card','Thread sample','packet',0x9a705b],
    ['deskside-tray','Loose change tray','bowl',0x9c6c77], ['cellar-torch','Pocket lantern','lantern',0x597864],
    ['index-left','Margin graph','chart',0x765e84], ['scribbled-run','Notebook margin','ticket',0x728077],
    ['bench-fern','Fern bookmark','botanical',0x6b864e], ['after-hours','After-hours slip','envelope',0xb68179],
    ['proof-rosette','Folded paper star','star',0xb1816a], ['astronomy-frame','Orion sketch','frame',0x796582],
    ['paper-flight','Flight log clipping','frame',0x779491], ['workshop-tag','Shelf inspection ticket','ticket',0xb8a078],
    ['pin-wheel','Miniature pinwheel','star',0x879ba3], ['tool-box','Parts case','crate',0x795e6c],
  ],
};

// Match compact and wide layouts within one visit. A fresh load gets a new order.
const placementSeed=Math.floor(Math.random()*2**32);
export function furnishRoomObjects({walls, world, half, narrow, group, box, bead, cylinder, wire, finish, drawn, tag, weave, wood, trim}) {
  const line = finish(0x4e3b3e), page = finish(0xece0c7,.92);
  const gilt = finish(0xb4965e,.43,.35), glaze = finish(0x829c9e,.25,.12);
  const shadow = finish(0x51474d,.76);
  const stock = new T.MeshStandardMaterial({color:0xd8c6a4,map:weave,roughness:.94});
  const covers = new Map();
  const finishes = {
    bowl:[.27,.02], flask:[.26,.05], bird:[.31,.01], loupe:[.33,.62],
    caliper:[.40,.57], key:[.38,.64], glider:[.36,.52], prism:[.24,.10],
    reel:[.37,.35], camera:[.49,.22], cat:[.77,0],
    packet:[.89,0], ticket:[.91,0], frame:[.68,.04]
  };
  const contactBrush=document.createElement('canvas');
  contactBrush.width=contactBrush.height=64;
  const brush=contactBrush.getContext('2d');
  const softEdge=brush.createRadialGradient(32,32,5,32,32,32);
  softEdge.addColorStop(0,'rgba(43,28,24,.53)');
  softEdge.addColorStop(.62,'rgba(43,28,24,.25)');
  softEdge.addColorStop(1,'rgba(43,28,24,0)');
  brush.fillStyle=softEdge;brush.fillRect(0,0,64,64);
  const contactTexture=new T.CanvasTexture(contactBrush);
  contactTexture.colorSpace=T.SRGBColorSpace;
  const shelfContact=new T.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,toneMapped:false});
  const faceDisc = (root,r,d,mat,x,y,z) => {
    const mesh=cylinder(root,r,r,d,mat,x,y,z,24);
    mesh.rotation.x=Math.PI/2;
    return mesh;
  };
  function relief(root,shape,depth,radius,mat,x,y,z){
    const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{
      depth,bevelThickness:radius,bevelSize:radius,bevelSegments:2,curveSegments:10
    }),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  }
  function print(root, label, w, h, color, type, x, y, z) {
    drawn(root,w,h,(c,a,b)=>paintRoomPrint(c,a,b,label,color,type),x,y,z,false,label==='Track plate'?1800:940);
  }
  function moving(root,name,x,y,z,control=false){
    const part=group(root,x,y,z);
    part.userData.shelfPart=name;
    if(control)part.userData.shelfControl=name;
    return part;
  }
  function collar(root,profile,material,x,y,z){
    const rim=new T.Mesh(new T.LatheGeometry(profile.map(([r,d])=>new T.Vector2(r,d)),32),material);
    rim.rotation.x=Math.PI/2;rim.position.set(x,y,z);
    rim.castShadow=true;rim.receiveShadow=true;root.add(rim);return rim;
  }
  const builders = {
    book(p,m,label,color){
      box(p,.37,.53,.32,page,0,.292,0,.010);
      for(let i=0;i<9;i++)box(p,.346,.0014,.004,stock,0,.5576,-.134+i*.033);
      for(const x of [-.197,.197])box(p,.035,.60,.35,m,x,.303,0,.005);
      box(p,.42,.60,.046,m,0,.303,.173,.010);
      box(p,.19,.017,.007,gilt,0,.128,.199);
      box(p,.19,.017,.007,gilt,0,.463,.199);
      print(p,label,.32,.23,color,'chart',0,.30,.200);
    },
    frame(p,m,label,color){
      box(p,.49,.48,.058,m,0,.245,0,.012);
      print(p,label,.414,.407,color,'chart',0,.245,.035);
    },
    chart(p,m,label,color){
      box(p,.53,.42,.029,m,0,.22,0,.010);
      print(p,label,.493,.376,color,'chart',0,.22,.018);
    },
    botanical(p,m,label,color){
      box(p,.43,.51,.044,m,0,.256,0,.008);
      print(p,label,.386,.46,color,'botanical',0,.256,.025);
    },
    swatch(p,m,label,color){
      box(p,.48,.29,.030,m,0,.145,0,.007);
      print(p,label,.438,.25,color,'swatch',0,.145,.018);
    },
    ticket(p,m,label,color){
      box(p,.44,.27,.021,m,0,.135,0,.008);
      print(p,label,.409,.24,color,'ticket',0,.135,.014);
      bead(p,-.17,.248,.021,.022,.022,.010,gilt);
    },
    packet(p,m,label,color){
      box(p,.40,.375,.079,m,0,.188,0,.015);
      print(p,label,.364,.320,color,label==='Beamline foldout'?'chart':'botanical',0,.188,.044);
    },
    envelope(p,m){
      box(p,.46,.305,.037,page,0,.153,0,.009);
      wire(p,[[-.225,.297,.022],[0,.14,.025],[.225,.297,.022]],.004,line);
      faceDisc(p,.037,.013,m,0,.14,.027);
      box(p,.07,.067,.006,gilt,.164,.246,.024);
    },
    bowl(p,m){
      const points=[[0,.016],[.11,.016],[.15,.044],[.21,.115],[.225,.155],[.211,.156],[.195,.114],[.13,.059],[0,.053]];
      const shell=new T.Mesh(new T.LatheGeometry(points.map(v=>new T.Vector2(...v)),24),m);
      shell.castShadow=true;shell.receiveShadow=true;p.add(shell);
      for(const [x,z] of [[-.075,.04],[.065,-.065]])cylinder(p,.038,.038,.014,gilt,x,.058,z,12);
    },
    can(p,m){
      cylinder(p,.123,.105,.33,m,0,.169,0,20);
      cylinder(p,.125,.125,.019,gilt,0,.335,0,20);
      cylinder(p,.103,.103,.015,shadow,0,.335,0,20);
      wire(p,[[.11,.12,0],[.21,.16,0],[.21,.27,0],[.111,.292,0]],.018,m);
      wire(p,[[-.09,.10,0],[-.19,.15,0],[-.26,.30,0]],.019,m);
    },
    sprig(p,m){
      cylinder(p,.124,.102,.265,m,0,.134,0,20);
      cylinder(p,.118,.118,.019,gilt,0,.269,0,20);
      for(let j=-1;j<=1;j++){
        const x=j*.12, y=.51+(.16-Math.abs(j)*.07);
        wire(p,[[.016*j,.25,0],[x*.5,.42,.014],[x,y,.035]],.009,finish(0x647a57));
        bead(p,x-.02,y-.093,.046,.054,.019,.018,finish(0x78925d)).rotation.z=.4*j;
        for(let k=0;k<3;k++){
          bead(p,x+Math.cos(k*2.1)*.03,y+Math.sin(k*2.1)*.038,.042,.032,.033,.019,m);
        }
        bead(p,x,y,.067,.017,.017,.012,gilt);
      }
    },
    flask(p,m){
      cylinder(p,.075,.17,.265,m,0,.145,0,24);
      cylinder(p,.065,.073,.142,glaze,0,.342,0,20);
      cylinder(p,.076,.067,.039,gilt,0,.417,0,18);
      box(p,.13,.073,.009,page,0,.16,.131,.012);
      box(p,.081,.009,.003,line,0,.156,.137);
    },
    reel(p,m){
      faceDisc(p,.202,.065,m,0,.217,0);
      for(let ring=0;ring<3;ring++)faceDisc(p,.179-ring*.036,.007,ring%2?m:shadow,0,.217,.037+ring*.006);
      for(let n=0;n<3;n++)faceDisc(p,.025,.014,page,Math.cos(n*2.094)*.11,.217+Math.sin(n*2.094)*.11,.051);
      faceDisc(p,.04,.022,gilt,0,.217,.061);
    },
    record(p,m,label,color){
      box(p,.42,.45,.047,m,-.045,.228,0,.009);
      faceDisc(p,.143,.022,shadow,.09,.232,.021);
      faceDisc(p,.126,.006,m,.09,.232,.034);
      faceDisc(p,.102,.007,line,.09,.232,.039);
      faceDisc(p,.032,.01,gilt,.09,.232,.046);
      box(p,.26,.34,.026,m,-.102,.205,.037);
      print(p,label,.23,.29,color,'chart',-.102,.205,.053);
    },
    cassette(p,m){
      box(p,.44,.235,.080,m,0,.121,0,.015);
      box(p,.32,.089,.007,page,0,.155,.043);
      box(p,.301,.009,.003,gilt,0,.183,.048);
      box(p,.239,.037,.006,shadow,0,.141,.049);
      for(const x of [-.07,.07]){
        faceDisc(p,.033,.012,gilt,x,.142,.057);
        faceDisc(p,.013,.013,shadow,x,.142,.062);
        for(let i=0;i<6;i++){
          const angle=i*Math.PI/3;
          const spoke=box(p,.005,.009,.005,page,x+Math.sin(angle)*.018,.142+Math.cos(angle)*.018,.064);
          spoke.rotation.z=-angle;
        }
      }
      for(const x of [-.183,.183])for(const y of [.043,.199])faceDisc(p,.009,.006,gilt,x,y,.043);
    },
    dial(p,m){
      faceDisc(p,.202,.063,m,0,.213,0);
      faceDisc(p,.17,.008,page,0,.213,.036);
      for(let j=0;j<12;j++){
        const angle=j*Math.PI/6;
        const marker=box(p,.012,.025,.008,line,Math.sin(angle)*.144,.213+Math.cos(angle)*.144,.044);
        marker.rotation.z=-angle;
      }
      box(p,.016,.106,.01,line,-.022,.249,.051).rotation.z=.52;
      box(p,.014,.134,.012,gilt,.039,.252,.054).rotation.z=-.76;
      faceDisc(p,.020,.016,m,0,.213,.063);
    },
    camera(p,m){
      const alloy=finish(0xae9f87,.36,.43), black=finish(0x343b39,.69,.12);
      const leather=new T.MeshStandardMaterial({color:0x4c4541,map:weave,bumpMap:weave,bumpScale:.005,roughness:.86});
      box(p,.49,.286,.178,m,0,.153,0,.022);
      box(p,.491,.051,.179,alloy,0,.273,0,.012);
      box(p,.465,.023,.176,alloy,0,.026,0,.007);
      box(p,.443,.17,.015,leather,0,.146,.088,.010);
      box(p,.431,.173,.009,leather,0,.146,-.092,.012);
      box(p,.088,.046,.014,black,-.132,.263,.094,.007);
      box(p,.061,.026,.006,glaze,-.132,.263,.103,.003);
      box(p,.060,.034,.010,black,-.132,.263,-.091,.004);
      cylinder(p,.036,.036,.019,black,-.151,.306,0,18);
      wire(p,[[-.17,.314,0],[-.174,.316,-.045],[-.119,.316,-.043]],.007,alloy);
      const release=moving(p,'shutter',.147,.308,0,true);
      cylinder(release,.035,.038,.018,black,0,0,0,18);
      cylinder(release,.021,.026,.015,gilt,0,.014,0,18);
      const lens=moving(p,'lens',.048,.148,.108,true);
      collar(lens,[[.095,0],[.111,.006],[.111,.048],[.092,.059],[.092,.077],[.067,.077],[.066,.041],[.091,0]],black,0,0,0);
      collar(lens,[[.109,.016],[.114,.020],[.114,.038],[.107,.043],[.103,.038],[.103,.016]],alloy,0,0,0);
      for(let grip=0;grip<24;grip++){
        const angle=grip*Math.PI/12;
        const ridge=box(lens,.005,.004,.018,black,-Math.sin(angle)*.114,Math.cos(angle)*.114,.029);
        ridge.rotation.z=angle;
      }
      faceDisc(lens,.067,.003,finish(0x274753,.28,.36),0,0,.053);
      bead(lens,-.024,.021,.057,.019,.005,.0018,finish(0x487a84,.35)).rotation.z=.49;
      for(let n=0;n<7;n++){
        const blade=moving(lens,'aperture-'+n,0,0,.057+n*.00012);
        blade.rotation.z=n*2*Math.PI/7;
        const shape=new T.Shape();
        shape.moveTo(.066,-.018);shape.lineTo(.049,.035);shape.lineTo(.020,.035);
        shape.lineTo(.026,.005);shape.closePath();
        relief(blade,shape,.0008,0,black,0,0,0);
      }
      for(const x of [-.224,.224])faceDisc(p,.011,.005,gilt,x,.274,.093);
    },
    recorder(p,m){
      const alloy=finish(0xc3ad83,.49,.26), tape=finish(0x6f4a39,.77);
      box(p,.64,.46,.211,m,0,.235,0,.023);
      box(p,.577,.354,.011,alloy,0,.251,.11,.014);
      box(p,.551,.082,.024,shadow,0,.085,.114,.007);
      for(const x of [-.235,.235])for(const y of [.105,.41])faceDisc(p,.009,.006,gilt,x,y,.120);
      for(const [i,x] of [-.144,.144].entries()){
        const spool=moving(p,'recorder-reel-'+i,x,.298,.124);
        faceDisc(spool,.108,.008,shadow,0,0,0);
        faceDisc(spool,.081-i*.019,.026,tape,0,0,.017);
        faceDisc(spool,.035,.010,alloy,0,0,.031);
        for(let blade=0;blade<3;blade++){
          const a=blade*Math.PI*2/3;
          box(spool,.021,.065,.006,alloy,-Math.sin(a)*.067,Math.cos(a)*.067,.031,.003).rotation.z=a;
        }
        collar(spool,[[.100,.027],[.109,.027],[.109,.036],[.099,.036]],alloy,0,0,0);
        faceDisc(spool,.012,.008,shadow,0,0,.038);
      }
      wire(p,[[-.161,.22,.147],[-.117,.169,.147],[-.063,.163,.147],[.079,.163,.147],[.151,.23,.147]],.0045,tape);
      box(p,.078,.043,.021,shadow,0,.172,.133,.006);
      const play=moving(p,'play',.124,.087,.133,true);
      box(play,.075,.040,.024,gilt,0,0,0,.007);
      const arrow=new T.Shape();
      arrow.moveTo(-.009,-.009);arrow.lineTo(.010,0);arrow.lineTo(-.009,.009);arrow.closePath();
      relief(play,arrow,.001,0,shadow,0,0,.013);
      faceDisc(p,.021,.022,shadow,.218,.086,.137);
      const meter=moving(p,'recorder-pilot',-.18,.084,.128);
      faceDisc(meter,.011,.006,finish(0xc87b53,.35),0,0,0);
      faceDisc(p,.013,.005,shadow,-.18,.084,.127);
    },
    compass(p,m){
      const brass=finish(0x998259,.34,.48), coral=finish(0xa44938,.59), ivory=finish(0xe4d2a9,.86);
      faceDisc(p,.167,.064,m,0,.171,0);
      faceDisc(p,.149,.004,ivory,0,.171,.033);
      collar(p,[[.157,.028],[.169,.029],[.169,.047],[.152,.050],[.144,.047]],brass,0,.171,0);
      const face=moving(p,'compass-face',0,.171,.039,true);
      faceDisc(face,.145,.004,ivory,0,0,0);
      drawn(face,.281,.281,(c,w,h)=>{
        c.strokeStyle='#645844';c.fillStyle='#554b3d';c.textAlign='center';c.textBaseline='middle';
        c.font=w*.082+'px Georgia';
        for(let i=0;i<48;i++){
          const angle=i*Math.PI/24,x=Math.sin(angle),y=-Math.cos(angle);
          const inner=i%12===0?.363:i%4===0?.391:.420;
          c.lineWidth=i%12===0?.003:.0017;
          c.beginPath();c.moveTo(w*(.5+x*inner),h*(.5+y*inner));c.lineTo(w*(.5+x*.465),h*(.5+y*.465));c.stroke();
          if(i%12===0)c.fillText('NESW'[i/12],w*(.5+x*.312),h*(.5+y*.312));
        }
      },0,0,.004,false,770);
      const needle=moving(face,'needle',0,0,.011);
      for(const [direction,tint] of [[1,coral],[-1,shadow]]){
        const blade=new T.Shape();
        blade.moveTo(-.014,0);blade.lineTo(0,direction*.092);blade.lineTo(.014,0);blade.closePath();
        relief(needle,blade,.002,0,tint,0,0,0);
      }
      faceDisc(needle,.012,.012,brass,0,0,.004);
      wire(p,[[-.027,.336,0],[-.036,.369,0],[0,.394,0],[.036,.369,0],[.027,.336,0]],.008,brass);
    },
    radio(p,m){
      box(p,.53,.348,.22,m,0,.18,0,.027);
      box(p,.466,.27,.022,page,0,.176,.116,.017);
      box(p,.267,.149,.016,shadow,-.056,.208,.132,.009);
      wire(p,[[-.175,.20,.143],[-.133,.236,.143],[-.084,.171,.143],[-.023,.227,.143],[.068,.204,.143]],.008,gilt);
      faceDisc(p,.039,.026,line,.156,.208,.136);
      faceDisc(p,.023,.022,m,.155,.118,.137);
      wire(p,[[-.13,.346,0],[-.11,.398,0],[.12,.398,0],[.13,.346,0]],.015,line);
    },
    meter(p,m){
      box(p,.45,.321,.162,m,0,.161,0,.022);
      box(p,.37,.185,.014,page,0,.201,.087,.018);
      for(let i=-3;i<=3;i++)box(p,.008,.024,.006,line,i*.042,.241-Math.abs(i)*.009,.097).rotation.z=i*.15;
      box(p,.009,.109,.008,gilt,-.027,.202,.104).rotation.z=.45;
      for(const x of [-.09,.09])faceDisc(p,.027,.015,shadow,x,.085,.102);
    },
    keys(p,m){
      box(p,.63,.118,.30,m,0,.061,0,.019);
      for(let i=0;i<9;i++)box(p,.054,.049,.205,page,-.254+i*.064,.133,.028,.006);
      for(const j of [0,1,3,4,6,7])box(p,.033,.050,.109,shadow,-.223+j*.064,.157,-.022,.006);
    },
    headphones(p,m){
      wire(p,[[-.18,.159,0],[-.205,.375,0],[-.09,.475,0],[.09,.475,0],[.207,.375,0],[.18,.159,0]],.032,m);
      for(const x of [-.17,.17]){
        bead(p,x,.145,.019,.082,.122,.083,shadow);
        bead(p,x*.86,.146,.025,.070,.105,.071,m);
      }
    },
    spool(p,m){
      faceDisc(p,.163,.028,gilt,0,.18,.069);
      faceDisc(p,.163,.028,gilt,0,.18,-.069);
      for(let j=-4;j<=4;j++)faceDisc(p,.131,.016,m,0,.18,j*.014);
      faceDisc(p,.047,.031,shadow,0,.18,.084);
    },
    loupe(p,m){
      faceDisc(p,.139,.043,m,0,.335,0);
      faceDisc(p,.104,.018,glaze,0,.335,.026);
      wire(p,[[0,.04,0],[-.032,.138,0],[-.013,.208,0]],.029,gilt);
    },
    caliper(p,m){
      box(p,.54,.061,.042,m,0,.130,0,.003);
      function jaw(root,x,dir){
        const shape=new T.Shape();
        const points=[[0,-.053],[.042,-.055],[.046,.101],[.022,.145],[-.008,.149],[-.004,.051]];
        shape.moveTo(dir*points[0][0],points[0][1]);
        for(const [a,b] of points.slice(1))shape.lineTo(dir*a,b);
        shape.closePath();relief(root,shape,.027,.004,m,x,.13,-.015);
      }
      jaw(p,-.245,-1);
      const slide=moving(p,'slide',.064,0,0,true);
      jaw(slide,0,1);
      box(slide,.103,.084,.057,shadow,0,.130,0,.004);
      box(slide,.080,.028,.006,gilt,0,.122,.031,.004);
      drawn(slide,.072,.022,(c,w,h)=>{
        c.fillStyle='#4d3b2b';
        for(let i=0;i<=5;i++)c.fillRect(.006+i*.01174,0,.0015,h*(i%5===0?.86:.52));
      },0,.122,.035,false,990);
      cylinder(slide,.018,.018,.019,gilt,.030,.178,0,12);
      drawn(p,.455,.047,(c,w,h)=>{
        c.fillStyle='#55402e';
        for(let i=0;i<31;i++){
          const x=w*i/31,long=i%5===0;
          c.fillRect(x,h*.54,long?.0025:.0016,h*(long?.44:.24));
          if(long){c.font=h*.36+'px Georgia';c.fillText(i/5,x,h*.45);}
        }
      },-.010,.131,.023,false,950);
    },
    chip(p,m){
      box(p,.43,.308,.067,m,0,.157,0,.013);
      box(p,.229,.151,.019,shadow,0,.167,.045,.009);
      box(p,.14,.074,.018,glaze,0,.169,.057,.011);
      for(const y of [.092,.239])for(let i=0;i<7;i++)box(p,.009,.038,.005,gilt,-.125+i*.042,y,.041);
    },
    rack(p,m){
      box(p,.54,.068,.245,m,0,.047,0,.012);
      box(p,.54,.049,.257,m,0,.274,0,.010);
      for(const x of [-.25,.25])box(p,.035,.26,.235,gilt,x,.149,0,.003);
      for(let j=0;j<4;j++){
        const x=-.177+j*.119;
        cylinder(p,.035,.035,.295,glaze,x,.195,0,12);
        cylinder(p,.04,.04,.055,j%2?m:gilt,x,.334,0,12);
      }
    },
    prism(p,m){
      const shape=new T.ConeGeometry(.217,.43,3);
      const piece=new T.Mesh(shape,m);
      piece.position.y=.227;piece.rotation.y=.42;piece.castShadow=true;p.add(piece);
      box(p,.37,.028,.30,gilt,0,.015,0,.015);
    },
    crystal(p,m){
      box(p,.39,.027,.29,shadow,0,.016,0,.024);
      for(const [x,y,w,angle] of [[-.098,.122,.096,.42],[.035,.171,.122,-.16],[.121,.090,.063,-.43]]){
        const stone=new T.Mesh(new T.OctahedronGeometry(w),m);
        stone.position.set(x,y,0);stone.scale.y=1.45;stone.rotation.z=angle;stone.castShadow=true;p.add(stone);
      }
    },
    key(p,m){
      faceDisc(p,.087,.024,m,-.114,.14,0);
      faceDisc(p,.035,.027,shadow,-.114,.14,.012);
      box(p,.26,.033,.025,gilt,.065,.14,0,.006);
      box(p,.039,.053,.029,m,.144,.106,0,.003);
      box(p,.032,.038,.027,m,.188,.111,0,.003);
    },
    fabric(p,m){
      for(let i=0;i<3;i++){
        box(p,.46-i*.023,.035,.28-i*.009,m,0,.028+i*.033,0,.017);
        for(const x of [-.142,.136])box(p,.015,.007,.237,gilt,x,.047+i*.033,0);
      }
    },
    tote(p,m){
      box(p,.41,.37,.17,m,0,.186,0,.033);
      wire(p,[[-.101,.33,0],[-.097,.497,0],[.088,.497,0],[.10,.33,0]],.019,gilt);
      box(p,.274,.124,.019,page,0,.195,.088,.018);
      box(p,.187,.012,.004,m,0,.209,.100);
    },
    crate(p,m){
      box(p,.47,.27,.34,m,0,.135,0,.014);
      for(const y of [.071,.164,.222])box(p,.43,.021,.016,trim,0,y,.177,.004);
      box(p,.11,.049,.009,gilt,0,.163,.189,.005);
      box(p,.081,.018,.011,shadow,0,.165,.196,.003);
    },
    tube(p,m){
      const cylinderTube=cylinder(p,.072,.072,.536,m,0,.112,0,24);
      cylinderTube.rotation.z=1.31;
      for(const x of [-.194,.194]){
        const band=cylinder(p,.079,.079,.024,gilt,x,.112-x*.265,0,24);
        band.rotation.z=1.31;
      }
    },
    brush(p,m){
      box(p,.48,.087,.17,m,0,.079,0,.028);
      box(p,.381,.042,.145,gilt,0,.03,0,.012);
      for(let i=0;i<9;i++)box(p,.013,.036,.129,line,-.159+i*.039,.021,0,.004);
    },
    lantern(p,m){
      cylinder(p,.109,.116,.052,m,0,.033,0,20);
      cylinder(p,.087,.102,.22,glaze,0,.163,0,20);
      cylinder(p,.084,.115,.054,m,0,.303,0,20);
      wire(p,[[-.07,.315,0],[-.049,.409,0],[.049,.409,0],[.07,.315,0]],.014,gilt);
    },
    bird(p,m){
      bead(p,0,.139,0,.136,.099,.101,m);
      bead(p,.101,.201,.018,.062,.057,.054,m);
      bead(p,-.117,.164,-.014,.094,.031,.041,m).rotation.z=-.39;
      bead(p,.153,.189,.036,.038,.021,.020,gilt);
      bead(p,.114,.211,.066,.012,.012,.009,line);
      for(const x of [-.029,.037])bead(p,x,.040,0,.027,.017,.024,gilt);
    },
    star(p,m){
      const shape=new T.Shape();
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5,r=i%2?.080:.155;
        if(i===0)shape.moveTo(0,r);else shape.lineTo(Math.sin(a)*r,Math.cos(a)*r);
      }
      shape.closePath();relief(p,shape,.016,.008,m,0,.203,-.010);
      faceDisc(p,.030,.022,gilt,0,.203,.020);
      for(let i=0;i<5;i++){
        const a=i*2*Math.PI/5;
        wire(p,[[0,.203,.027],[Math.sin(a)*.109,.203+Math.cos(a)*.109,.015]],.0028,gilt);
      }
      cylinder(p,.023,.039,.080,shadow,0,.044,0,12);
    },
    glider(p,m){
      bead(p,0,.146,0,.247,.041,.044,gilt);
      box(p,.138,.024,.346,m,-.018,.143,0,.02);
      box(p,.070,.021,.150,m,-.174,.150,0,.012);
      box(p,.064,.081,.021,m,-.18,.188,0,.005);
      cylinder(p,.023,.044,.126,shadow,0,.070,0,12);
    },
    cat(p,m){
      const muzzle=finish(0xe1bb91,.62), nose=finish(0x9d645f,.49);
      bead(p,0,.126,-.016,.112,.118,.090,m);
      bead(p,0,.135,.055,.062,.074,.030,muzzle);
      bead(p,0,.251,.037,.113,.078,.084,m);
      for(const x of [-.064,.064]){
        const sign=Math.sign(x);
        const ear=new T.Shape();
        ear.moveTo(-.037,0);ear.quadraticCurveTo(-.022,.061,sign*.018,.076);
        ear.quadraticCurveTo(.030,.059,.037,0);ear.closePath();
        relief(p,ear,.022,.008,m,x,.292,.038);
        bead(p,x+sign*.004,.319,.066,.016,.023,.005,muzzle).rotation.z=-sign*.28;
        bead(p,x*.76,.259,.112,.011,.014,.006,line);
        bead(p,x*.70,.040,.077,.037,.023,.043,m);
        for(const y of [.218,.228])wire(p,[[x*.57,y,.115],[x*1.30,y+.007,.105],[x*1.80,y+.009,.094]],.0017,line);
      }
      bead(p,0,.234,.121,.016,.010,.007,nose);
      wire(p,[[-.064,.092,-.053],[-.124,.073,-.058],[-.161,.051,-.013],[-.142,.039,.062],[-.097,.042,.102]],.020,m);
      bead(p,-.097,.042,.102,.020,.020,.020,m);
    },
    gramophone(p,m){
      box(p,.30,.116,.27,m,0,.059,0,.016);
      box(p,.327,.023,.288,trim,0,.029,0,.006);
      cylinder(p,.097,.098,.021,line,0,.131,0,20);
      cylinder(p,.025,.025,.003,gilt,0,.143,0,16);
      wire(p,[[-.106,.13,.081],[-.099,.166,.072],[-.045,.160,.012]],.007,gilt);
      wire(p,[[.08,.13,-.06],[.085,.258,-.057],[.053,.332,-.023]],.022,gilt);
      const profile=[[.025,-.083],[.031,-.046],[.050,.001],[.080,.042],[.115,.068],[.126,.080],
        [.114,.082],[.103,.067],[.075,.040],[.044,.003],[.025,-.044],[.021,-.083]];
      const horn=new T.Mesh(new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),28),finish(0xb28a54,.44,.43));
      horn.position.set(.050,.372,.047);horn.castShadow=true;p.add(horn);
      horn.rotation.x=Math.PI/2;horn.rotation.z=-.33;
    },
  };

  let seed=placementSeed;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  function shuffled(rows){
    const order=[...rows];
    for(let i=order.length-1;i>0;i--){
      const j=Math.floor(random()*(i+1));
      [order[i],order[j]]=[order[j],order[i]];
    }
    return order;
  }
  function piece(parent, row, x,y,z, scale=1, angle=0, grounded=false) {
    const [id,label,kind,color]=row;
    const prop=group(parent,x,y,z);
    if(grounded)prop.rotation.y=angle;else prop.rotation.z=angle;
    prop.scale.setScalar(scale);
    if(kind==='book' || kind==='fabric'){
      if(!covers.has(color))covers.set(color,new T.MeshStandardMaterial({
        color,map:weave,bumpMap:weave,bumpScale:.008,roughness:.88
      }));
    }
    const surface=kind==='book'||kind==='fabric' ? covers.get(color) : finish(color,...(finishes[kind]||[.59,0]));
    builders[kind](prop,surface,label,color);
    if(grounded)prop.position.y+=y-new T.Box3().setFromObject(prop).min.y;
    tag(prop,'prop-'+id,[0,0,0],.5,.5);
    prop.userData.roomProp=label;
    return prop;
  }
  function ledge(wall, x,y, length, rows, scale=.92) {
    box(wall,length,.073,.54,wood,x,y-.038,.24,.014);
    box(wall,length+.05,.038,.05,trim,x,y-.066,.512,.010);
    for(const sign of [-1,1])box(wall,.095,.21,.17,trim,x+sign*(length/2-.26),y-.15,.082,.012);
    wall.updateWorldMatrix(true,false);
    const local=wall.matrixWorld.clone().invert();
    const clearance=.12,shelfFront=.49;
    const props=shuffled(rows).map(row=>{
      const root=piece(wall,row,0,0,0,scale);
      root.rotation.y=(random()-.5)*.14;
      const bounds=new T.Box3().setFromObject(root).applyMatrix4(local);
      const size=bounds.getSize(new T.Vector3());
      const support=Math.min(1,(shelfFront-clearance)/size.z);
      return {root,bounds,width:size.x*support,support};
    });
    const contentWidth=props.reduce((width,item)=>width+item.width,0);
    const fit=Math.min(1,(length-.085*(props.length+1))/contentWidth);
    const gap=(length-contentWidth*fit)/(props.length+1);
    let cursor=x-length/2+gap;
    for(const {root,bounds,width,support} of props){
      const ratio=support*fit;
      root.scale.multiplyScalar(ratio);
      root.position.set(cursor-bounds.min.x*ratio,
        y-bounds.min.y*ratio,(clearance+shelfFront-(bounds.min.z+bounds.max.z)*ratio)/2);
      const depth=(bounds.max.z-bounds.min.z)*ratio;
      const contact=new T.Mesh(new T.PlaneGeometry(width*fit*1.21,Math.min(.39,depth*1.28+.08)),shelfContact);
      contact.rotation.x=-Math.PI/2;
      contact.position.set(cursor+width*fit/2,y+.0016,(clearance+shelfFront)/2);
      wall.add(contact);
      cursor+=width*fit+gap;
    }
  }
  const {back,front,music,science}=walls;
  const window=collections.window;
  ledge(back,-7.15,1.21,4.24,window.slice(0,5),1.12);
  ledge(back,7.19,1.21,4.35,window.slice(5,10),1.18);
  ledge(back,-6.07,3.78,4.32,window.slice(10,15),1.30);
  ledge(back,6.11,3.43,4.22,window.slice(15),1.16);

  const records=collections.records;
  ledge(music,-.18,-2.25,8.35,records.slice(0,10),1.20);
  ledge(music,-1.66,4.27,6.40,records.slice(10,16),1.16);
  ledge(music,5.18,1.32,1.78,records.slice(16),1.07);

  const instruments=collections.instruments;
  ledge(science,.13,-2.04,8.8,instruments.slice(0,10),1.16);
  ledge(science,.68,4.35,7.35,instruments.slice(10,16),1.16);
  ledge(science,-4.97,1.91,2.15,instruments.slice(16),1.10);

  const entry=collections.entry;
  ledge(front,-4.12,-1.31,6.33,entry.slice(0,7),1.28);
  ledge(front,-3.90,1.70,6.0,entry.slice(7,13),1.22);
  ledge(front,6.72,-.61,4.40,entry.slice(13),1.09);

  const desk=collections.desk;
  piece(world,desk[4],.18+(random()-.5)*.13,1.52,-1.42,narrow?.49:.80,(random()-.5)*.14,true);
  piece(world,desk[3],narrow?1.71:2.66,.020,-1.61,.86,.045);
  piece(world,desk[8],narrow?1.94:2.91,.041,.82,.79,.037);
  piece(world,desk[9],narrow?2.12:3.13,.023,-1.69,.87,-.038);
  for(const [side, items] of [[-1,desk.slice(0,3)],[1,desk.slice(5,8)]]){
    const x=side*(half+.85);
    box(world,1.19,.105,1.72,wood,x,-1.48,-.92,.026);
    for(const z of [-1.62,-.22])for(const off of [-.51,.51]){
      box(world,.104,1.54,.11,trim,x+off,-2.30,z,.021);
    }
    shuffled(items).forEach((row,i)=>piece(world,row,x+((i%2)*2-1)*.25,-1.424,-1.48+Math.floor(i/2)*.56,.82,(random()-.5)*.12,true));
  }
  ledge(front,-4.05,3.46,6.42,desk.slice(10,17),1.10);
  for(const [i,row] of desk.slice(17).entries()){
    piece(world,row,-half-1.06-i*.62,-3.062,-1.74+i*.12,1.12,0,true);
  }
}
