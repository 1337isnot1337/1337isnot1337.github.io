import * as T from './vendor/three/three.module.min.js';
import { paintRoomPrint } from './room-print.js?v=2';
import { addBookcase, addLowCabinet } from './room-furnishings.js?v=2';

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
    ['cellar-torch','Pocket lantern','lantern',0x597864], ['inch-gauge','Folding rule','caliper',0xbba77a],
    ['ink-colors','Ink swatches','swatch',0x79586f], ['deskside-flask','Ink bottle','flask',0x526476],
    ['clay-cat','Tiny clay cat','cat',0xc99571], ['green-matchbox','Matchbox','packet',0x72816a],
    ['desk-film','35 mm film roll','spool',0x738190], ['thread-card','Thread sample','packet',0x9a705b],
    ['deskside-tray','Loose change tray','bowl',0x9c6c77], ['starship-model','Starship stack model','starship',0xaab2b6],
    ['index-left','Margin graph','chart',0x765e84], ['scribbled-run','Notebook margin','ticket',0x728077],
    ['bench-fern','Fern bookmark','botanical',0x6b864e], ['after-hours','After-hours slip','envelope',0xb68179],
    ['proof-rosette','Folded paper star','star',0xb1816a], ['astronomy-frame','Orion sketch','frame',0x796582],
    ['starlink-sketch','Starlink orbit sketch','frame',0x49616d], ['workshop-tag','Shelf inspection ticket','ticket',0xb8a078],
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
    caliper:[.40,.57], key:[.38,.64], starship:[.35,.63], prism:[.24,.10],
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
      print(p,label,.29,.42,color,'chart',0,.302,.163);
      const cover=moving(p,'book-cover',-.204,.303,.177,true);
      box(cover,.42,.60,.046,m,.204,0,0,.010);
      box(cover,.19,.017,.007,gilt,.204,-.175,.026);
      box(cover,.19,.017,.007,gilt,.204,.160,.026);
      print(cover,label,.32,.23,color,'chart',.204,-.003,.027);
    },
    frame(p,m,label,color){
      box(p,.49,.48,.058,m,0,.245,0,.012);
      box(p,.420,.414,.005,shadow,0,.245,.032,.004);
      const mount=moving(p,'frame-print',0,.245,.037,true);
      box(mount,.419,.411,.005,page,0,0,-.002,.004);
      print(mount,label,.414,.407,color,'chart',0,0,.001);
    },
    chart(p,m,label,color){
      box(p,.53,.42,.029,m,0,.22,0,.010);
      print(p,label,.493,.376,color,'chart',0,.22,.018);
      const cursor=moving(p,'chart-cursor',-.174,.21,.022,true);
      box(cursor,.007,.243,.004,gilt,0,-.008,0,.001);
      for(const y of [-.127,.119])box(cursor,.024,.025,.005,m,0,y,0,.002);
    },
    botanical(p,m,label,color){
      box(p,.43,.51,.044,m,0,.256,0,.008);
      print(p,label,.386,.46,color,'botanical',0,.256,.025);
      const glass=moving(p,'plant-glass',-.205,.256,.034,true);
      const clear=new T.MeshPhysicalMaterial({color:0xe7ebe0,transparent:true,opacity:.18,roughness:.14,depthWrite:false});
      box(glass,.398,.472,.005,clear,.205,0,0,.006);
      box(glass,.018,.042,.009,gilt,.394,.023,.005,.002);
    },
    swatch(p,m,label,color){
      box(p,.48,.29,.030,m,0,.145,0,.007);
      for(const [index,tint] of [0x657d84,0xa0867d,color].entries()){
        const chip=index===2?moving(p,'swatch-card',-.19,.095,.023,true):group(p,-.19,.095,.018+index*.002);
        print(chip,label,.438,.25,tint,'swatch',.19,.05,.002);
      }
    },
    ticket(p,m,label,color){
      box(p,.44,.27,.021,m,0,.135,0,.008);
      print(p,label,.409,.24,color,'ticket',0,.135,.014);
      bead(p,-.17,.248,.021,.022,.022,.010,gilt);
      const stub=moving(p,'ticket-stub',.159,.135,.019,true);
      box(stub,.100,.225,.004,stock,0,0,0,.002);
      for(let i=0;i<7;i++)box(stub,.019,.004,.002,line,.001,.075-i*.024,.003);
    },
    packet(p,m,label,color){
      box(p,.40,.375,.079,m,0,.188,0,.015);
      print(p,label,.364,.320,color,label==='Beamline foldout'?'chart':'botanical',0,.188,.044);
      const flap=moving(p,'packet-fold',0,.342,.052,true);
      box(flap,.391,.063,.011,stock,0,-.024,.001,.006);
      box(flap,.081,.017,.006,gilt,0,-.043,.008,.004);
    },
    envelope(p,m){
      box(p,.46,.305,.037,page,0,.153,0,.009);
      wire(p,[[-.225,.297,.022],[0,.14,.025],[.225,.297,.022]],.004,line);
      faceDisc(p,.037,.013,m,0,.14,.027);
      box(p,.07,.067,.006,gilt,.164,.246,.024);
      const slip=moving(p,'envelope-slip',0,.169,.006,true);
      box(slip,.333,.233,.006,stock,0,0,0,.007);
      for(let i=0;i<4;i++)box(slip,.208-i*.026,.005,.002,line,-.037,.056-i*.027,.006);
      box(slip,.067,.018,.012,gilt,0,.11,.018,.002);
    },
    bowl(p,m){
      const points=[[0,.016],[.11,.016],[.15,.044],[.21,.115],[.225,.155],[.211,.156],[.195,.114],[.13,.059],[0,.053]];
      const shell=new T.Mesh(new T.LatheGeometry(points.map(v=>new T.Vector2(...v)),24),m);
      shell.castShadow=true;shell.receiveShadow=true;p.add(shell);
      const coins=moving(p,'bowl-coins',0,.058,0,true);
      for(const [x,z] of [[-.075,.04],[.065,-.065]])cylinder(coins,.038,.038,.014,gilt,x,0,z,12);
      faceDisc(coins,.023,.006,line,-.075,.007,.04);
    },
    can(p,m,label){
      cylinder(p,.123,.105,.33,m,0,.169,0,20);
      cylinder(p,.125,.125,.019,gilt,0,.335,0,20);
      cylinder(p,.103,.103,.015,shadow,0,.335,0,20);
      wire(p,[[.11,.12,0],[.21,.16,0],[.21,.27,0],[.111,.292,0]],.018,m);
      if(label==='Watering can'){
        const spout=moving(p,'can-spout',-.09,.10,0,true);
        wire(spout,[[0,0,0],[-.10,.05,0],[-.17,.20,0]],.019,m);
        const drops=moving(spout,'water-drops',-.17,.173,.003);
        for(let i=0;i<4;i++)bead(drops,-i*.015,-i*.035,0,.009,.017,.009,finish(0xaac9d1,.35));
        drops.visible=false;
      }else{
        const tool=moving(p,'can-tool',-.046,.198,0,true);
        cylinder(tool,.014,.012,.203,gilt,0,0,0,12);
        bead(tool,0,.116,0,.015,.021,.015,finish(0x973745));
        bead(tool,0,.135,0,.021,.013,.019,page);
      }
    },
    sprig(p,m){
      cylinder(p,.124,.102,.265,m,0,.134,0,20);
      cylinder(p,.118,.118,.019,gilt,0,.269,0,20);
      const stems=moving(p,'sprig-stems',0,0,0,true);
      for(let j=-1;j<=1;j++){
        const x=j*.12, y=.51+(.16-Math.abs(j)*.07);
        wire(stems,[[.016*j,.25,0],[x*.5,.42,.014],[x,y,.035]],.009,finish(0x647a57));
        bead(stems,x-.02,y-.093,.046,.054,.019,.018,finish(0x78925d)).rotation.z=.4*j;
        for(let k=0;k<3;k++){
          bead(stems,x+Math.cos(k*2.1)*.03,y+Math.sin(k*2.1)*.038,.042,.032,.033,.019,m);
        }
        bead(stems,x,y,.067,.017,.017,.012,gilt);
      }
    },
    flask(p,m){
      cylinder(p,.075,.17,.265,m,0,.145,0,24);
      cylinder(p,.065,.073,.142,glaze,0,.342,0,20);
      const cork=moving(p,'flask-cork',0,.417,0,true);
      cylinder(cork,.076,.067,.039,gilt,0,0,0,18);
      box(p,.13,.073,.009,page,0,.16,.131,.012);
      box(p,.081,.009,.003,line,0,.156,.137);
    },
    reel(p,m){
      const reel=moving(p,'reel-core',0,.217,0,true);
      faceDisc(reel,.202,.065,m,0,0,0);
      for(let ring=0;ring<3;ring++)faceDisc(reel,.179-ring*.036,.007,ring%2?m:shadow,0,0,.037+ring*.006);
      for(let n=0;n<3;n++)faceDisc(reel,.025,.014,page,Math.cos(n*2.094)*.11,Math.sin(n*2.094)*.11,.051);
      faceDisc(reel,.04,.022,gilt,0,0,.061);
    },
    record(p,m,label,color){
      box(p,.42,.45,.047,m,-.045,.228,0,.009);
      const disc=moving(p,'record-disc',.09,.232,.021,true);
      faceDisc(disc,.143,.022,shadow,0,0,0);
      faceDisc(disc,.126,.006,m,0,0,.013);
      faceDisc(disc,.102,.007,line,0,0,.018);
      faceDisc(disc,.032,.01,gilt,0,0,.025);
      box(disc,.010,.027,.003,page,.078,.091,.021).rotation.z=-.65;
      box(p,.26,.34,.026,m,-.102,.205,.037);
      print(p,label,.23,.29,color,'chart',-.102,.205,.053);
    },
    cassette(p,m){
      box(p,.44,.235,.080,m,0,.121,0,.015);
      box(p,.32,.089,.007,page,0,.155,.043);
      box(p,.301,.009,.003,gilt,0,.183,.048);
      box(p,.239,.037,.006,shadow,0,.141,.049);
      for(const [n,x] of [-.07,.07].entries()){
        const spool=moving(p,'cassette-'+n,x,.142,.057,true);
        faceDisc(spool,.033,.012,gilt,0,0,0);
        faceDisc(spool,.013,.013,shadow,0,0,.005);
        for(let i=0;i<6;i++){
          const angle=i*Math.PI/3;
          const spoke=box(spool,.005,.009,.005,page,Math.sin(angle)*.018,Math.cos(angle)*.018,.007);
          spoke.rotation.z=-angle;
        }
      }
      for(const x of [-.183,.183])for(const y of [.043,.199])faceDisc(p,.009,.006,gilt,x,y,.043);
    },
    dial(p,m,label){
      faceDisc(p,.202,.063,m,0,.213,0);
      faceDisc(p,.17,.008,page,0,.213,.036);
      for(let j=0;j<12;j++){
        const angle=j*Math.PI/6;
        const marker=box(p,j%3===0?.014:.010,j%3===0?.031:.024,.008,line,
          Math.sin(angle)*.144,.213+Math.cos(angle)*.144,.044);
        marker.rotation.z=-angle;
      }
      const dial=moving(p,'dial-face',0,.213,.049,true);
      faceDisc(dial,.17,.003,page,0,0,-.012);
      if(label.toLowerCase().endsWith('clock')){
        for(const [unit,length,width,tint,z] of [
          ['hour',.085,.016,line,.002],['minute',.121,.011,gilt,.007],
          ['second',.139,.005,finish(0xaa4b41,.56),.012],
        ]){
          const hand=moving(p,'clock-hand-'+unit,0,.213,.049+z);
          box(hand,width,length,.004,tint,0,length/2-.007,0,.001);
        }
      }else{
        const needle=moving(dial,'dial-needle',0,0,.006,true);
        box(needle,.013,.134,.006,gilt,0,.045,0,.002);
      }
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
      const formula=[
        t=>Math.sin(4*Math.PI*t),t=>1-4*Math.abs((t*2+.25)%1-.5),
        t=>Math.sin(4*Math.PI*t)>0?.92:-.92,
      ];
      for(const [i,signal] of formula.entries()){
        const track=moving(p,'radio-trace-'+i,-.056,.208,.145);
        wire(track,Array.from({length:36},(_,j)=>[(j/35-.5)*.231,signal(j/35)*.051,0]),.0038,gilt);
        track.visible=i===0;
      }
      const knob=moving(p,'radio-knob',.156,.208,.136,true);
      faceDisc(knob,.039,.026,line,0,0,0);
      box(knob,.004,.023,.002,gilt,0,.007,.015);
      faceDisc(p,.023,.022,m,.155,.118,.137);
      wire(p,[[-.13,.346,0],[-.11,.398,0],[.12,.398,0],[.13,.346,0]],.015,line);
    },
    meter(p,m){
      box(p,.45,.321,.162,m,0,.161,0,.022);
      box(p,.37,.185,.014,page,0,.201,.087,.018);
      for(let i=-3;i<=3;i++)box(p,.008,.024,.006,line,i*.042,.241-Math.abs(i)*.009,.097).rotation.z=i*.15;
      const needle=moving(p,'meter-needle',0,.148,.104);
      box(needle,.009,.103,.006,gilt,0,.049,0,.002);
      needle.rotation.z=.76;
      faceDisc(needle,.011,.012,m,0,0,.007);
      const switcher=moving(p,'meter-switch',-.09,.085,.102,true);
      faceDisc(switcher,.027,.015,shadow,0,0,0);
      box(switcher,.027,.005,.003,gilt,0,0,.011);
      faceDisc(p,.027,.015,shadow,.09,.085,.102);
    },
    keys(p,m){
      box(p,.63,.118,.30,m,0,.061,0,.019);
      box(p,.555,.018,.048,gilt,0,.117,-.093,.007);
      for(const x of [-.275,.275]){
        faceDisc(p,.006,.008,shadow,x,.059,.153);
        box(p,.013,.042,.228,m,x,.124,.029,.005);
      }
      for(const [i,note] of [60,62,64,65,67,69,71,72,74].entries()){
        const key=moving(p,'piano-'+note,-.254+i*.064,.133,-.065,true);
        box(key,.054,.042,.205,page,0,0,.093,.006);
      }
      for(const [i,note] of [[0,61],[1,63],[3,66],[4,68],[5,70],[7,73]]){
        const key=moving(p,'piano-'+note,-.223+i*.064,.157,-.074,true);
        box(key,.033,.045,.109,shadow,0,0,.052,.006);
      }
    },
    headphones(p,m){
      wire(p,[[-.18,.159,0],[-.205,.375,0],[-.09,.475,0],[.09,.475,0],[.207,.375,0],[.18,.159,0]],.032,m);
      for(const x of [-.17,.17]){
        const cup=x<0?moving(p,'headphone-cup',x,.145,.019,true):group(p,x,.145,.019);
        bead(cup,0,0,0,.082,.122,.083,shadow);
        bead(cup,-x*.14,.001,.006,.070,.105,.071,m);
      }
    },
    spool(p,m){
      const spindle=moving(p,'spool-core',0,.18,0,true);
      faceDisc(spindle,.163,.028,gilt,0,0,.069);
      faceDisc(spindle,.163,.028,gilt,0,0,-.069);
      for(let j=-4;j<=4;j++)faceDisc(spindle,.131,.016,m,0,0,j*.014);
      faceDisc(spindle,.047,.031,shadow,0,0,.084);
      box(spindle,.009,.019,.004,m,.081,.097,.084).rotation.z=-.74;
    },
    loupe(p,m){
      faceDisc(p,.139,.043,m,0,.335,0);
      const lens=moving(p,'loupe-lens',0,.335,.026,true);
      faceDisc(lens,.104,.018,glaze,0,0,0);
      drawn(lens,.155,.070,(c,w,h)=>{
        c.fillStyle='#688481';c.fillRect(0,0,w,h);
        c.strokeStyle='#dfdabe';c.lineWidth=.003;
        for(let i=0;i<=10;i++){
          const x=.006+(w-.012)*i/10;
          c.beginPath();c.moveTo(x,h*.83);c.lineTo(x,h*(i%5===0?.18:.49));c.stroke();
        }
      },0,0,.010,false,620);
      const sample=moving(lens,'loupe-magnification',0,0,.012);
      drawn(sample,.164,.083,(c,w,h)=>{
        c.fillStyle='#b5c9ad';c.fillRect(0,0,w,h);
        c.strokeStyle='#3c514c';c.lineWidth=.006;
        for(let i=0;i<=6;i++){
          const x=.007+(w-.014)*i/6;
          c.beginPath();c.moveTo(x,h*.87);c.lineTo(x,h*(i===3?.13:.43));c.stroke();
        }
      },0,0,0,false,620);
      sample.visible=false;
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
      const power=moving(p,'chip-power',.143,.257,.045,true);
      faceDisc(power,.022,.009,gilt,0,0,0);
      const lights=moving(p,'chip-diode',0,.169,.068);
      for(let i=-1;i<=1;i++)bead(lights,i*.037,0,.001,.012,.012,.004,new T.MeshBasicMaterial({color:0x93fb9c}));
      lights.visible=false;
    },
    rack(p,m){
      box(p,.54,.068,.245,m,0,.047,0,.012);
      box(p,.54,.049,.257,m,0,.274,0,.010);
      for(const x of [-.25,.25])box(p,.035,.26,.235,gilt,x,.149,0,.003);
      for(let j=0;j<4;j++){
        const x=-.177+j*.119;
        const tube=moving(p,'sample-tube-'+j,x,.195,0,true);
        cylinder(tube,.035,.035,.295,glaze,0,0,0,12);
        cylinder(tube,.04,.04,.055,j%2?m:gilt,0,.139,0,12);
      }
    },
    prism(p,m){
      const shape=new T.ConeGeometry(.217,.43,3);
      const optic=moving(p,'prism-optic',0,.227,0,true);
      const piece=new T.Mesh(shape,m);
      piece.rotation.y=.42;piece.castShadow=true;optic.add(piece);
      box(p,.37,.028,.30,gilt,0,.015,0,.015);
      const rays=moving(p,'prism-spectrum',0,.18,.11);
      const light=color=>new T.MeshBasicMaterial({color});
      box(rays,.164,.004,.003,light(0xffedcf),-.13,.028,0);
      for(const [i,color] of [0xd77b78,0xf0b36e,0xe7da92,0x8aba8c,0x79b4ca,0x9d8fc5].entries()){
        const ray=box(rays,.173,.004,.003,light(color),.089,.023-i*.014,.002);
        ray.rotation.z=.11-i*.11;
      }
      rays.visible=false;
    },
    crystal(p,m){
      box(p,.39,.027,.29,shadow,0,.016,0,.024);
      const sample=moving(p,'crystal-sample',0,.025,0,true);
      for(const [x,y,w,angle] of [[-.098,.122,.096,.42],[.035,.171,.122,-.16],[.121,.090,.063,-.43]]){
        const stone=new T.Mesh(new T.OctahedronGeometry(w),m);
        stone.position.set(x,y-.025,0);stone.scale.y=1.45;stone.rotation.z=angle;stone.castShadow=true;sample.add(stone);
      }
    },
    key(p,m){
      const key=moving(p,'key-shaft',0,.14,0,true);
      faceDisc(key,.087,.024,m,-.114,0,0);
      faceDisc(key,.035,.027,shadow,-.114,0,.012);
      box(key,.26,.033,.025,gilt,.065,0,0,.006);
      box(key,.039,.053,.029,m,.144,-.034,0,.003);
      box(key,.032,.038,.027,m,.188,-.029,0,.003);
    },
    fabric(p,m){
      for(let i=0;i<2;i++)box(p,.46-i*.023,.035,.28-i*.009,m,0,.028+i*.033,0,.017);
      const fold=moving(p,'fabric-fold',0,.094,-.126,true);
      box(fold,.414,.034,.262,m,0,0,.125,.016);
      for(const x of [-.142,.136])box(fold,.015,.007,.237,gilt,x,.018,.12);
    },
    tote(p,m){
      box(p,.41,.37,.17,m,0,.186,0,.033);
      wire(p,[[-.101,.33,0],[-.097,.497,0],[.088,.497,0],[.10,.33,0]],.019,gilt);
      const pocket=moving(p,'tote-pocket',0,.145,.088,true);
      box(pocket,.274,.124,.019,page,0,.050,0,.018);
      box(pocket,.187,.012,.004,m,0,.064,.012);
      box(p,.08,.081,.005,stock,.056,.216,.091,.003);
    },
    crate(p,m){
      box(p,.47,.057,.34,m,0,.031,0,.011);
      for(const x of [-.218,.218])box(p,.034,.211,.34,m,x,.145,0,.008);
      for(const z of [-.151,.151])box(p,.44,.21,.036,m,0,.144,z,.008);
      for(let i=0;i<3;i++)box(p,.090,.039,.104,stock,-.11+i*.10,.076,i*.03-.05,.005);
      const lid=moving(p,'crate-lid',0,.253,-.151,true);
      box(lid,.475,.039,.342,m,0,.010,.151,.012);
      for(const y of [.071,.164,.222])box(p,.43,.021,.016,trim,0,y,.177,.004);
      box(p,.11,.049,.009,gilt,0,.163,.189,.005);
      box(p,.081,.018,.011,shadow,0,.165,.196,.003);
    },
    tube(p,m){
      const cylinderTube=cylinder(p,.072,.072,.536,m,0,.112,0,24);
      cylinderTube.rotation.z=1.31;
      for(const x of [-.247,.247]){
        const base=x<0?moving(p,'tube-cap',x,.112-x*.265,0,true):group(p,x,.112-x*.265,0);
        const band=cylinder(base,.079,.079,.039,gilt,0,0,0,24);
        band.rotation.z=1.31;
        if(x<0){
          const roll=cylinder(base,.049,.049,.135,stock,.048,-.013,0,20);
          roll.rotation.z=1.31;
        }
      }
    },
    brush(p,m){
      box(p,.48,.087,.17,m,0,.079,0,.028);
      box(p,.381,.042,.145,gilt,0,.03,0,.012);
      const bristles=moving(p,'brush-bristles',0,.045,0,true);
      for(let i=0;i<9;i++)box(bristles,.013,.036,.129,line,-.159+i*.039,-.024,0,.004);
    },
    lantern(p,m){
      cylinder(p,.109,.116,.052,m,0,.033,0,20);
      const lamp=moving(p,'lantern-glow',0,.163,0,true);
      const glass=finish(0x9b9f74,.29);
      cylinder(lamp,.087,.102,.22,glass,0,0,0,20);
      const filament=moving(lamp,'lantern-lit',0,0,0);
      cylinder(filament,.089,.104,.2205,new T.MeshBasicMaterial({color:0xffbc67}),0,0,0,20);
      filament.visible=false;
      cylinder(p,.084,.115,.054,m,0,.303,0,20);
      wire(p,[[-.07,.315,0],[-.049,.409,0],[.049,.409,0],[.07,.315,0]],.014,gilt);
    },
    bird(p,m){
      bead(p,0,.139,0,.136,.099,.101,m);
      bead(p,.101,.201,.018,.062,.057,.054,m);
      bead(p,-.117,.164,-.014,.094,.031,.041,m).rotation.z=-.39;
      const beak=moving(p,'bird-beak',.123,.191,.036,true);
      bead(beak,.030,-.002,0,.038,.021,.020,gilt);
      bead(p,.114,.211,.066,.012,.012,.009,line);
      for(const x of [-.029,.037])bead(p,x,.040,0,.027,.017,.024,gilt);
    },
    star(p,m){
      const shape=new T.Shape();
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5,r=i%2?.080:.155;
        if(i===0)shape.moveTo(0,r);else shape.lineTo(Math.sin(a)*r,Math.cos(a)*r);
      }
      const rotor=moving(p,'star-rotor',0,.203,0,true);
      shape.closePath();relief(rotor,shape,.016,.008,m,0,0,-.010);
      faceDisc(rotor,.030,.022,gilt,0,0,.020);
      for(let i=0;i<5;i++){
        const a=i*2*Math.PI/5;
        wire(rotor,[[0,0,.027],[Math.sin(a)*.109,Math.cos(a)*.109,.015]],.0028,gilt);
      }
      cylinder(p,.023,.039,.080,shadow,0,.044,0,12);
    },
    starship(p,m){
      p.userData.inspectionHeadroom=.16;
      const steel=finish(0x7f898e,.42,.48), tiles=finish(0x414750,.77,.11);
      box(p,.247,.04,.207,trim,0,.024,0,.014);
      cylinder(p,.037,.047,.024,shadow,0,.055,0,20);
      cylinder(p,.038,.038,.258,m,0,.192,0,24);
      for(const y of [.078,.115,.157,.199,.239,.292])cylinder(p,.0386,.0386,.002,steel,0,y,0,24);
      cylinder(p,.037,.038,.028,steel,0,.333,0,24);
      cylinder(p,.022,.037,.014,tiles,0,.348,0,20);
      for(let i=0;i<4;i++){
        const fin=group(p,0,.307,0);
        fin.rotation.y=i*Math.PI/2+Math.PI/4;
        box(fin,.034,.006,.025,steel,0,0,.047,.002);
        for(const x of [-.010,0,.010])box(fin,.002,.007,.023,tiles,x,.001,.047);
      }
      const ship=moving(p,'starship-upper',0,.353,0,true);
      const profile=[[.038,0],[.038,.120],[.037,.139],[.033,.159],[.023,.182],[.011,.199],[.001,.209]];
      const section=pairs=>pairs.map(([r,y])=>new T.Vector2(r,y));
      const hull=new T.Mesh(new T.LatheGeometry(section(profile),32),m);
      const heatShield=new T.Mesh(new T.LatheGeometry(section(profile.map(([r,y])=>[r+.0008,y])),16,-Math.PI/2,Math.PI),tiles);
      heatShield.rotation.y=-Math.PI*.31;
      hull.castShadow=true;hull.receiveShadow=true;ship.add(hull,heatShield);
      for(const side of [-1,1]){
        const aft=box(ship,.033,.069,.009,tiles,side*.048,.040,.008,.003);
        aft.rotation.z=side*.28;
        const forward=box(ship,.018,.031,.007,steel,side*.035,.143,.006,.002);
        forward.rotation.z=side*.54;
      }
      for(const x of [-.010,.010])cylinder(ship,.007,.008,.016,tiles,x,-.004,0,12);
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
      const tail=moving(p,'cat-tail',-.064,.092,-.053,true);
      wire(tail,[[0,0,0],[-.060,-.019,-.005],[-.097,-.041,.04],[-.078,-.053,.115],[-.033,-.050,.155]],.020,m);
      bead(tail,-.033,-.050,.155,.020,.020,.020,m);
    },
    gramophone(p,m){
      box(p,.30,.116,.27,m,0,.059,0,.016);
      box(p,.327,.023,.288,trim,0,.029,0,.006);
      const disc=moving(p,'gramophone-disc',0,.131,0,true);
      cylinder(disc,.097,.098,.021,line,0,0,0,20);
      cylinder(disc,.025,.025,.003,gilt,0,.012,0,16);
      bead(disc,.052,.012,.051,.008,.002,.008,m);
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
    prop.userData.shelfKind=kind;
    if(kind==='cat')prop.userData.shelfControl='cat-tail';
    if(kind==='bird')prop.userData.shelfControl='bird-beak';
    if(kind==='dial')prop.userData.dialLabel=label;
    return prop;
  }
  function ledge(wall, x,y, length, rows, scale=.92, cabinet) {
    if(cabinet==='library')addBookcase(wall,x,y,length,{box,finish,wood,trim});
    else if(cabinet)addLowCabinet(wall,x,y,length,cabinet,{box,bead,finish,wood,trim});
    else{
      box(wall,length,.073,.54,wood,x,y-.038,.24,.014);
      box(wall,length+.05,.038,.05,trim,x,y-.066,.512,.010);
      for(const sign of [-1,1])box(wall,.095,.21,.17,trim,x+sign*(length/2-.26),y-.15,.082,.012);
    }
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
  ledge(music,-.18,-2.25,8.35,records.slice(0,10),1.20,'records');
  ledge(music,-1.66,4.27,6.40,records.slice(10,16),1.16);
  ledge(music,5.18,1.32,1.78,records.slice(16),1.07);

  const instruments=collections.instruments;
  ledge(science,.13,-2.04,8.8,instruments.slice(0,10),1.16,'instruments');
  ledge(science,.68,4.35,7.35,instruments.slice(10,16),1.16);
  ledge(science,-4.97,1.91,2.15,instruments.slice(16),1.10);

  const entry=collections.entry;
  ledge(front,-4.12,-1.31,6.33,entry.slice(0,7),1.28,'library');
  ledge(front,-3.90,1.70,6.0,entry.slice(7,13),1.22);
  ledge(front,6.72,-.61,4.40,entry.slice(13),1.09);

  const desk=collections.desk;
  piece(world,desk[4],.18+(random()-.5)*.13,1.52,-1.42,narrow?.49:.80,(random()-.5)*.14,true);
  piece(world,desk[3],narrow?1.71:2.66,.020,-1.61,.86,.045);
  piece(world,desk[8],narrow?1.94:2.91,.041,.82,.79,.037);
  piece(world,desk[9],narrow?2.12:3.13,.023,-1.69,.87,-.27,true);
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
