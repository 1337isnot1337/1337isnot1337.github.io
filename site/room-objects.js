import * as T from './vendor/three/three.module.min.js';

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
    ['tape-deck','Tape recorder','radio',0x627d80], ['cream-sleeve','Ivory record sleeve','record',0xc1a36d],
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
    ['cedar-crate','Cedar crate','crate',0x967159], ['pocket-compass','Pocket compass','dial',0x5a7c80],
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

export function furnishRoomObjects({walls, world, half, narrow, group, box, bead, cylinder, wire, finish, drawn, tag, wood, trim}) {
  const line = finish(0x4e3b3e), page = finish(0xece0c7);
  const gilt = finish(0xb4965e,.43,.35), glaze = finish(0x829c9e,.25,.12);
  const shadow = finish(0x51474d,.76);
  const faceDisc = (root,r,d,mat,x,y,z) => {
    const mesh=cylinder(root,r,r,d,mat,x,y,z,24);
    mesh.rotation.x=Math.PI/2;
    return mesh;
  };
  function print(root, label, w, h, color, type, x, y, z) {
    drawn(root,w,h,(c,a,b)=>{
      const ink='#'+color.toString(16).padStart(6,'0');
      const phase=label.length*.55+label.charCodeAt(0)*.14;
      c.fillStyle='#e9dfc9';c.fillRect(0,0,a,b);
      c.strokeStyle=ink;c.lineWidth=.009;
      c.strokeRect(.037,.035,a-.074,b-.070);
      if(type==='botanical'){
        for(let i=0;i<5;i++){
          const py=b*(.23+i*.095), sign=i%2?1:-1;
          c.beginPath();c.moveTo(a*.50,py+.065);
          c.bezierCurveTo(a*(.5+sign*.2),py+.035,a*(.5+sign*.30),py-.029,a*(.5+sign*.35),py-.061);
          c.bezierCurveTo(a*(.5+sign*.12),py-.055,a*.49,py-.016,a*.50,py+.065);c.fillStyle=ink;c.fill();
        }
        c.beginPath();c.moveTo(a*.48,b*.78);c.quadraticCurveTo(a*.47,b*.60,a*.53,b*.19);c.stroke();
      } else if(type==='swatch'){
        ['#86728b','#bd8179','#8ea0a3','#8d976f','#dcad74'].forEach((swatch,i)=>{
          c.fillStyle=swatch;c.fillRect(a*(.12+i*.151),b*.20,a*.132,b*.49);
        });
      } else {
        for(let row=0;row<4;row++){
          c.beginPath();
          for(let j=0;j<=14;j++){
            const px=a*(.11+j*.055);
            const py=b*(.19+row*.13+Math.sin(j*.56+row*.95+phase)*.063);
            if(!j)c.moveTo(px,py);else c.lineTo(px,py);
          }
          c.stroke();
        }
        c.fillStyle=ink;
        for(let n=0;n<4;n++){c.beginPath();c.arc(a*(.21+n*.17),b*(.29+.09*Math.cos(n+y)),.012,0,Math.PI*2);c.fill();}
      }
      c.font='600 '+b*.10+'px Georgia';c.textAlign='center';c.fillStyle='#51434a';
      c.fillText(label,a*.5,b*.85,a*.83);
    },x,y,z,false,308);
  }
  const builders = {
    book(p,m,label,color){
      box(p,.37,.53,.32,page,0,.292,0,.010);
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
      print(p,label,.409,.24,color,'chart',0,.135,.014);
      bead(p,-.17,.248,.021,.022,.022,.010,gilt);
    },
    packet(p,m,label,color){
      box(p,.40,.375,.079,m,0,.188,0,.015);
      print(p,label,.364,.320,color,'botanical',0,.188,.044);
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
      box(p,.239,.037,.006,shadow,0,.141,.049);
      for(const x of [-.07,.07]){
        faceDisc(p,.033,.012,gilt,x,.142,.057);
        faceDisc(p,.013,.013,shadow,x,.142,.062);
      }
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
      box(p,.48,.298,.185,m,0,.158,0,.025);
      box(p,.43,.078,.178,gilt,0,.278,0,.010);
      box(p,.1,.059,.012,shadow,-.148,.245,.101);
      faceDisc(p,.113,.098,shadow,.048,.153,.113);
      faceDisc(p,.086,.021,gilt,.048,.153,.170);
      faceDisc(p,.066,.014,glaze,.048,.153,.184);
      cylinder(p,.049,.049,.043,m,.144,.331,0,16);
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
      box(p,.49,.045,.046,m,0,.114,0,.006);
      box(p,.046,.21,.046,m,-.216,.184,0,.004);
      box(p,.039,.159,.043,gilt,.108,.190,.017,.004);
      box(p,.122,.075,.042,shadow,.108,.136,.021,.007);
      for(let i=0;i<7;i++)box(p,.005,.022,.005,line,-.162+i*.049,.121,.025);
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
      for(let i=0;i<5;i++){
        const spike=box(p,.062,.143,.027,m,Math.sin(i*1.257)*.068,.178+Math.cos(i*1.257)*.068,0,.011);
        spike.rotation.z=-i*1.257;
      }
      faceDisc(p,.063,.05,gilt,0,.178,.011);
      cylinder(p,.025,.039,.101,shadow,0,.057,0,12);
    },
    glider(p,m){
      bead(p,0,.146,0,.247,.041,.044,gilt);
      box(p,.138,.024,.346,m,-.018,.143,0,.02);
      box(p,.070,.021,.150,m,-.174,.150,0,.012);
      box(p,.064,.081,.021,m,-.18,.188,0,.005);
      cylinder(p,.023,.044,.126,shadow,0,.070,0,12);
    },
    cat(p,m){
      bead(p,0,.14,0,.116,.128,.097,m);
      bead(p,.002,.280,.037,.118,.088,.085,m);
      for(const x of [-.064,.064]){
        const ear=box(p,.049,.075,.047,m,x,.355,.046,.010);
        ear.rotation.z=x<0?.27:-.27;
        bead(p,x*.80,.283,.116,.013,.012,.008,line);
        bead(p,x*.64,.042,.065,.041,.026,.052,m);
      }
      wire(p,[[-.084,.13,-.051],[-.189,.101,-.016],[-.161,.047,.059]],.025,m);
    },
    gramophone(p,m){
      box(p,.30,.116,.27,m,0,.059,0,.016);
      cylinder(p,.097,.098,.021,line,0,.131,0,20);
      wire(p,[[.08,.13,-.06],[.085,.258,-.057],[.053,.332,-.023]],.022,gilt);
      const horn=cylinder(p,.118,.027,.163,m,.050,.372,.047,24);
      horn.rotation.x=Math.PI/2;horn.rotation.z=-.33;
      faceDisc(p,.089,.012,shadow,.050,.389,.117);
    },
  };

  function piece(parent, row, x,y,z, scale=1, angle=0) {
    const [id,label,kind,color]=row;
    const prop=group(parent,x,y,z);
    prop.rotation.z=angle;
    prop.scale.setScalar(scale);
    builders[kind](prop,finish(color,.59),label,color);
    tag(prop,'prop-'+id,[0,0,0],.5,.5);
    prop.userData.roomProp=label;
  }
  function ledge(wall, x,y, length, rows, scale=.92) {
    box(wall,length,.073,.43,wood,x,y-.038,.185,.014);
    box(wall,length+.05,.038,.05,trim,x,y-.066,.413,.010);
    for(const sign of [-1,1])box(wall,.095,.21,.17,trim,x+sign*(length/2-.26),y-.15,.082,.012);
    const spacing=(length-.18)/rows.length;
    rows.forEach((row,i)=>piece(wall,row,x+spacing*(i-(rows.length-1)/2),y,.23,scale,(i%3-1)*.038));
  }
  function wallRow(wall, x,y,span,rows,scale) {
    rows.forEach((row,i)=>piece(wall,row,x+(i-(rows.length-1)/2)*span/rows.length,y+(i%2)*.12,.085,scale,(i%3-1)*.05));
  }
  const {back,front,music,science}=walls;
  const window=collections.window;
  ledge(back,-5.42,1.21,4.24,window.slice(0,5),1.12);
  ledge(back,5.7,1.21,4.35,window.slice(5,10),1.18);
  ledge(back,-5.51,3.78,4.32,window.slice(10,15),1.30);
  ledge(back,5.57,3.43,4.22,window.slice(15),1.16);

  const records=collections.records;
  ledge(music,-.18,-2.25,8.35,records.slice(0,10),1.20);
  ledge(music,-1.66,4.27,6.40,records.slice(10,16),1.16);
  ledge(music,6.1,1.32,2.94,records.slice(16),1.07);

  const instruments=collections.instruments;
  ledge(science,.13,-2.04,8.8,instruments.slice(0,10),1.16);
  ledge(science,.68,4.35,7.35,instruments.slice(10,16),1.16);
  ledge(science,-6.44,1.91,3.13,instruments.slice(16),1.10);

  const entry=collections.entry;
  ledge(front,-4.12,-1.31,6.33,entry.slice(0,7),1.28);
  ledge(front,-3.90,1.70,6.0,entry.slice(7,13),1.22);
  ledge(front,5.67,-.61,4.47,entry.slice(13),1.09);

  const desk=collections.desk;
  piece(world,desk[4],.18,1.52,-1.42,narrow?.49:.80,-.03);
  piece(world,desk[3],narrow?1.71:2.66,.020,-1.61,.86,.045);
  piece(world,desk[8],narrow?1.94:2.91,.041,.82,.79,.037);
  piece(world,desk[9],narrow?2.12:3.13,.023,-1.69,.87,-.038);
  for(const [side, items] of [[-1,desk.slice(0,3)],[1,desk.slice(5,8)]]){
    const x=side*(half+.85);
    box(world,1.19,.105,1.72,wood,x,-1.48,-.92,.026);
    for(const z of [-1.62,-.22])for(const off of [-.51,.51]){
      box(world,.104,1.54,.11,trim,x+off,-2.30,z,.021);
    }
    items.forEach((row,i)=>piece(world,row,x+((i%2)*2-1)*.25,-1.424,-1.48+Math.floor(i/2)*.56,.82,(i%3-1)*.08));
  }
  const reverse=group(world,0,0,-2.287);
  reverse.rotation.y=Math.PI;
  wallRow(reverse,narrow?-.07:-.24,2.44,narrow?4.52:6.81,desk.slice(10,17),narrow?.80:1.0);
  for(const [i,row] of desk.slice(17).entries()){
    piece(world,row,(i-1)*(narrow?.68:.81),-3.062,-2.66-i*.30,1.12);
  }
}
