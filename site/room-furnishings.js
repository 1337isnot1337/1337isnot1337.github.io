import * as T from './vendor/three/three.module.min.js';

export function addLowCabinet(wall,x,y,length,style,{box,bead,finish,wood,trim}) {
  const depth=.76,height=style==='records'?.82:1.03;
  const base=y-height, shelf=base+.18;
  const cavity=finish(0x5f483f,.93), handle=finish(0xb59a70,.44,.49);
  box(wall,length,.090,depth,wood,x,y-.045,.36,.015);
  box(wall,length-.13,.11,depth-.17,trim,x,base+.060,.306,.013);
  box(wall,length-.24,.065,depth-.06,wood,x,shelf,.33,.011);
  box(wall,length-.12,height-.11,.061,cavity,x,base+height*.5,.057);
  for(const side of [-1,1])
    box(wall,.092,height-.13,depth-.05,wood,x+side*(length/2-.059),base+height*.5+.017,.355,.010);
  const bay=(length-.224)/5;
  const opening=y-shelf-.128;
  for(let i=0;i<5;i++){
    const middle=x+(i-2)*bay;
    if(i<4)box(wall,.052,opening,.66,wood,middle+bay*.5,shelf+.033+opening*.5,.362,.006);
    if(style==='instruments'||i===0||i===4){
      const face=style==='instruments'?finish(0x53665d,.82):trim;
      box(wall,bay-.067,opening-.026,.048,face,middle,shelf+.033+opening*.5,.684,.011);
      box(wall,.226,.030,.044,handle,middle,shelf+.060+opening*.52,.720,.009);
      for(const sign of [-1,1])bead(wall,middle+sign*.084,shelf+.060+opening*.52,.718,.025,.025,.020,handle);
    }else{
      const colors=[0x827c67,0xb18d73,0x61716a,0x8b6d6d,0xc7b39c,0x707f8b];
      for(let n=0;n<8;n++){
        const tall=opening*(.74+(n%3)*.07);
        const spine=box(wall,.055,tall,.33,finish(colors[(i*3+n)%colors.length],.92),
          middle-.38+n*.067,shelf+.031+tall/2,.44+(n%3)*.015,.006);
        if(n===7)spine.rotation.z=-.12;
      }
    }
  }
}

export function addBookcase(wall,x,y,length,{box,finish,wood,trim}) {
  const floor=y-1.76, depth=.97, bay=(length-.24)/3;
  const back=finish(0x675244,.94), brass=finish(0xb89a70,.53,.41);
  box(wall,length,.10,depth,wood,x,y-.05,.465,.021);
  box(wall,length-.13,.125,.72,trim,x,floor+.062,.403,.012);
  box(wall,length-.16,1.60,.06,back,x,floor+.855,.065);
  for(const side of [-1,1])
    box(wall,.10,1.60,.91,wood,x+side*(length/2-.064),floor+.86,.467,.010);
  for(const offset of [-bay/2,bay/2])
    box(wall,.069,1.52,.87,wood,x+offset,floor+.872,.456,.008);
  const colors=[0x526760,0x876051,0x8d8064,0x72647b,0x4e6175,0xad9372,0x635f4d,0x9a756d];
  const paper=finish(0xd9caab,.95);
  for(const row of [0,1]){
    const base=floor+.174+row*.736;
    box(wall,length-.20,.067,.91,wood,x,base-.033,.456,.010);
    for(const col of [0,1,2]){
      const center=x+(col-1)*bay;
      const books=groupPosition(row,col);
      for(const [i,{offset,w,h}] of books.entries()){
        const book=finish(colors[(i+row*3+col*2)%colors.length],.89);
        const b=box(wall,w,h,.49,book,center+offset,base+h/2,.582+(i%3)*.016,.011);
        const tilted=i===books.length-1&&col===1;
        if(tilted)b.rotation.z=row===0?.08:-.08;
        if(!tilted&&i%3!==1)for(const spot of [.20,.77])
          box(wall,w*.69,.009,.005,brass,center+offset,base+h*spot,b.position.z+.246);
      }
      if((row+col)%2===0){
        for(const i of [0,1,2]){
          const cover=finish(colors[(col+i+3)%colors.length],.88);
          const width=.62-i*.055, pageY=base+.038+i*.092;
          const stackX=center+bay/2-.45+.024*i;
          box(wall,width,.088,.57,cover,stackX,pageY+.005,.552,.011);
          box(wall,width-.04,.054,.012,paper,stackX,pageY+.006,.840,.003);
        }
      }else{
        const crate=finish(col===1?0x9d846b:0x7e7c6d,.90);
        const stackX=center+bay/2-.45;
        box(wall,.68,.435,.53,crate,stackX,base+.22,.586,.018);
        box(wall,.706,.063,.56,crate,stackX,base+.46,.587,.012);
        box(wall,.165,.067,.012,brass,stackX,base+.303,.855,.008);
        box(wall,.103,.034,.006,back,stackX,base+.303,.861,.005);
      }
    }
  }

  function groupPosition(row,column){
    let start=-bay/2+.13;
    return Array.from({length:6+(row+column)%2},(_,i)=>{
      const w=.106+.021*((i*3+column+row*2)%4);
      const h=.365+.043*((i*5+row*2+column)%7);
      const offset=start+w/2;
      start+=w+.014;
      return {offset,w,h};
    });
  }
}

export function addRug(parent,x,y,z,w,d,colors,{box,drawn,finish}) {
  const [base,band,line,field]=colors;
  const rug=box(parent,w,.028,d,finish(base,.99),x,y+.014,z,.014);
  rug.castShadow=false;
  drawn(parent,w,d,(c,a,b)=>{
    const swatch=n=>'#'+n.toString(16).padStart(6,'0');
    c.fillStyle=swatch(base);c.fillRect(0,0,a,b);
    c.strokeStyle=swatch(band);c.lineWidth=field?.27:.16;c.strokeRect(.18,.18,a-.36,b-.36);
    c.strokeStyle=swatch(line);c.lineWidth=.019;
    for(const edge of [.065,.265,.325])c.strokeRect(edge,edge,a-2*edge,b-2*edge);
    if(field){
      const diamond=(x,y,rx,ry)=>{
        c.beginPath();
        for(const [dx,dy] of [[0,-ry],[rx,0],[0,ry],[-rx,0]])c.lineTo(x+dx,y+dy);
        c.closePath();
      };
      const columns=Math.floor(a/.83), rows=Math.floor(b/.93);
      c.strokeStyle=swatch(field);c.lineWidth=.025;
      for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
        const x=a/2+(col-(columns-1)/2)*.78, y=b/2+(row-(rows-1)/2)*.85;
        diamond(x,y,.31,.365);c.stroke();
        diamond(x,y,.215,.255);c.stroke();
        c.fillStyle=swatch(band);diamond(x,y,.097,.124);c.fill();
      }
      c.strokeStyle=swatch(line);c.lineWidth=.018;
    }
    for(const side of [-1,1]){
      const border=side<0?.39:a-.39;
      for(let at=.49;at<b-.44;at+=.106){
        c.beginPath();c.moveTo(border,at);c.lineTo(border+side*.034,at+.035);
        c.lineTo(border,at+.070);c.stroke();
      }
    }
    // Broken warp threads keep the surface variation tied to the weave.
    c.strokeStyle='#ffffe719';c.lineWidth=.007;
    for(let row=0;row<b/.033;row++){
      c.beginPath();
      for(let col=0;col<a/.25;col++){
        const start=col*.25+(row%3)*.031, at=row*.033+.015;
        c.moveTo(start,at);c.lineTo(start+.135+(row*19+col*11)%7*.009,at);
      }
      c.stroke();
    }
  },x,y+.029,z,true,124);
}

function floorContact(world,floor,x,z,width,depth,drawn){
  const contact=drawn(world,width,depth,(c,w,h)=>{
    c.scale(w,h);
    const shadow=c.createRadialGradient(.5,.5,.11,.5,.5,.5);
    shadow.addColorStop(0,'#2b211e5c');shadow.addColorStop(.63,'#2b211e36');shadow.addColorStop(1,'#2b211e00');
    c.fillStyle=shadow;c.fillRect(0,0,1,1);
  },x,floor+.035,z,true,102);
  contact.material.alphaTest=0;
  contact.receiveShadow=false;
}

export function furnishReadingCorner(world,floor,{group,box,bead,cylinder,wire,finish,drawn,weave,wood,trim}) {
  const upholstery=new T.MeshStandardMaterial({color:0x536b65,map:weave,bumpMap:weave,bumpScale:.012,roughness:.95});
  const welt=finish(0x41554d,.84), brass=finish(0xa58458,.49,.52);
  const cushion=new T.MeshStandardMaterial({color:0x9c6050,map:weave,bumpMap:weave,bumpScale:.009,roughness:.94});
  const chair=group(world,-7.13,floor,7.81);
  chair.rotation.y=1.98;
  chair.scale.setScalar(1.07);
  box(chair,2.31,.16,1.88,trim,0,.40,-.04,.040);
  for(const x of [-.93,.93])for(const z of [-.78,.74]){
    const leg=cylinder(chair,.10,.068,.39,trim,x,.217,z,12);
    leg.rotation.z=x*-.15;
    leg.rotation.x=z*.16;
  }
  box(chair,2.30,.36,1.96,upholstery,0,.61,-.045,.145);
  const back=group(chair,0,.76,-.78);
  back.rotation.x=-.17;
  box(back,2.16,1.48,.41,upholstery,0,.67,-.01,.183);
  box(back,1.81,1.19,.254,upholstery,0,.68,.20,.124);
  box(chair,1.55,.316,1.58,upholstery,0,.91,.122,.143);
  wire(chair,[[-.71,.885,.70],[-.58,.875,.884],[0,.875,.905],[.58,.875,.884],[.71,.885,.70]],.010,welt);
  for(const side of [-1,1]){
    box(chair,.34,.61,1.78,upholstery,side*1.005,.976,-.004,.13);
    box(chair,.43,.173,1.88,upholstery,side*1.002,1.27,.008,.083);
    wire(chair,[[side*.845,1.244,.77],[side*.886,1.233,.892],[side*1.016,1.229,.941],[side*1.140,1.228,.878]],.012,welt);
  }
  const pillow=group(chair,-.38,1.43,-.414);
  pillow.rotation.set(-.25,.09,.19);
  box(pillow,.76,.68,.326,cushion,0,0,0,.146);
  wire(pillow,[[-.31,.229,.085],[-.22,.316,.093],[.14,.325,.09],[.28,.262,.08]],.009,finish(0xc19378,.92));
  const throwCloth=finish(0xb6a487,.93);
  box(chair,.48,.074,.57,throwCloth,.88,1.361,.39,.031);
  box(chair,.069,.33,.54,throwCloth,1.16,1.189,.39,.028).rotation.z=-.12;
  for(const z of [.173,.214,.549,.591]){
    box(chair,.455,.005,.018,welt,.884,1.401,z,.003);
    box(chair,.005,.26,.018,welt,1.203,1.211,z,.003).rotation.z=-.12;
  }

  const table=group(world,-7.55,floor,5.69);
  cylinder(table,.51,.57,.086,trim,0,.046,0,24);
  cylinder(table,.084,.121,1.22,trim,0,.657,0,18);
  cylinder(table,.707,.693,.10,wood,0,1.315,0,36);
  cylinder(table,.700,.713,.047,trim,0,1.260,0,36);
  const book=group(table,-.15,1.380,.13);
  book.rotation.y=-.30;
  box(book,.55,.038,.39,finish(0x685254,.83),0,0,0,.009);
  box(book,.52,.053,.365,finish(0xe1d5b9,.93),0,.033,0,.006);
  box(book,.55,.019,.39,finish(0x685254,.83),0,.064,0,.006);
  box(book,.472,.001,.028,brass,0,.075,-.098,.005);
  box(book,.093,.009,.090,finish(0xb79963,.83),-.058,.015,.20,.005).rotation.y=.24;
  const tea=group(table,.30,1.362,-.23);
  const ceramic=finish(0xbaaa88,.30);
  cylinder(tea,.183,.164,.038,ceramic,0,.02,0,22);
  const bowl=[[0,.044],[.096,.044],[.119,.082],[.132,.244],[.122,.249],[.112,.234],[.106,.095],[0,.077]];
  const cup=new T.Mesh(new T.LatheGeometry(bowl.map(p=>new T.Vector2(...p)),24),ceramic);
  cup.castShadow=true;cup.receiveShadow=true;tea.add(cup);
  cylinder(tea,.115,.115,.002,finish(0x674430,.46),0,.207,0,22);
  wire(tea,[[.106,.197,0],[.169,.196,0],[.182,.139,0],[.119,.109,0]],.015,ceramic);

  const lamp=group(world,-8.76,floor,9.26);
  cylinder(lamp,.31,.36,.093,brass,0,.049,0,24);
  cylinder(lamp,.036,.047,3.69,brass,0,1.90,0,14);
  const shade=new T.MeshStandardMaterial({color:0xcdbb94,map:weave,roughness:.90,side:T.DoubleSide});
  const fabric=new T.Mesh(new T.CylinderGeometry(.327,.63,.67,36,1,true),shade);
  fabric.position.y=3.75;fabric.castShadow=true;fabric.receiveShadow=true;lamp.add(fabric);
  for(const [r,y] of [[.329,4.084],[.629,3.416]]){
    const hem=new T.Mesh(new T.TorusGeometry(r,.016,6,36),finish(0xa69270,.84));
    hem.position.y=y;hem.rotation.x=-Math.PI/2;lamp.add(hem);
  }
  bead(lamp,0,3.641,0,.10,.15,.10,finish(0xe6d7b5,.42));
  wire(lamp,[[0,.045,.26],[-.14,.029,.44],[-.38,.029,.46],[-.70,.033,.48]],.014,finish(0x4f463b,.88)).castShadow=false;
  for(const [x,z,a,b] of [[-7.13,7.81,2.84,2.54],[-7.55,5.69,1.45,1.34],[-8.76,9.26,.92,.84]])
    floorContact(world,floor,x,z,a,b,drawn);
  return lamp.position.clone().add(new T.Vector3(0,3.59,0));
}

export function furnishSharedStudy(world,floor,tools) {
  const {group,box,bead,cylinder,wire,finish,drawn,weave,wood,trim,tag}=tools;
  const table=group(world,-4.44,floor,6.28);
  table.rotation.y=-.13;
  const edge=cylinder(table,1.49,1.46,.129,trim,0,1.015,0,48);
  edge.scale.z=.70;
  cylinder(table,1.48,1.49,.046,wood,0,1.101,0,48).scale.z=.70;
  box(table,2.13,.134,.98,trim,0,.925,0,.092);
  for(const x of [-1.05,1.05])for(const z of [-.45,.45]){
    const leg=cylinder(table,.082,.048,.866,trim,x,.459,z,12);
    leg.rotation.set(z*.12,0,x*.085);
  }
  const chess=tag(group(table,-.382,1.124,0),'study-chess',[0,.14,0],1.48,1.28);
  chess.rotation.y=.072;
  chess.scale.setScalar(.90);
  box(chess,1.49,.071,1.49,trim,0,.044,0,.023);
  const lightSquare=finish(0xd7c49f,.66), darkSquare=finish(0x744c3d,.61);
  for(let r=0;r<8;r++)for(let c=0;c<8;c++)
    box(chess,.162,.008,.162,(r+c)%2===0?lightSquare:darkSquare,(c-3.5)*.162,.082,(r-3.5)*.162);
  const maple=finish(0xe4d1a6,.53), ebony=finish(0x433a38,.48);
  const silhouettes={
    king:[[.041,0],[.044,.015],[.037,.028],[.022,.038],[.019,.116],[.029,.128],[.025,.151],[.034,.166],[.018,.181],[0,.183]],
    bishop:[[.040,0],[.040,.018],[.031,.025],[.018,.037],[.014,.074],[.027,.093],[.022,.121],[.008,.149],[0,.158]],
    rook:[[.040,0],[.041,.018],[.031,.027],[.022,.043],[.023,.100],[.036,.110],[.036,.132],[.026,.132],[.026,.119],[0,.118]],
    pawn:[[.035,0],[.037,.016],[.027,.027],[.017,.039],[.016,.064],[.024,.074],[.022,.091],[.013,.103],[0,.107]],
  };
  const shapes=Object.fromEntries(Object.entries(silhouettes).map(([name,points])=>
    [name,new T.LatheGeometry(points.map(([x,y])=>new T.Vector2(x,y)),16)]));
  for(const [color,position] of [[maple,[
    ['king','g',1],['rook','d',1],['bishop','f',4],['pawn','a',3],['pawn','f',2],['pawn','g',3]
  ]],[ebony,[
    ['king','g',8],['rook','c',8],['bishop','e',5],['pawn','a',6],['pawn','f',7],['pawn','g',6]
  ]]]){
    for(const [name,file,rank] of position){
      const piece=new T.Mesh(shapes[name],color);
      piece.position.set((file.charCodeAt(0)-100.5)*.162,.086,(4.5-rank)*.162);
      piece.castShadow=true;piece.receiveShadow=true;chess.add(piece);
      if(name==='king'){
        const {x,y,z}=piece.position;
        box(chess,.022,.043,.023,color,x,y+.196,z,.004);
        box(chess,.051,.013,.022,color,x,y+.202,z,.004);
      }
      if(name==='rook')for(const [x,z] of [[.028,0],[-.028,0],[0,.028],[0,-.028]])
        box(chess,.017,.02,.017,color,piece.position.x+x,.221,piece.position.z+z,.002);
    }
  }
  const notes=group(table,.64,1.138,.163);
  notes.rotation.y=-.32;
  box(notes,.68,.024,.50,finish(0xb39c78,.91),0,0,0,.008);
  box(notes,.655,.031,.46,finish(0xe7d7b7,.94),0,.019,0,.005);
  drawn(notes,.642,.444,(c,w,h)=>{
    c.fillStyle='#e7dbbf';c.fillRect(0,0,w,h);
    c.strokeStyle='#8c9e8d80';c.lineWidth=.002;
    for(let y=.040;y<h-.020;y+=.021){c.beginPath();c.moveTo(.018,y);c.lineTo(w-.019,y);c.stroke();}
    c.strokeStyle='#8c8772';c.lineWidth=.005;
    for(let i=0;i<4;i++){
      c.beginPath();c.moveTo(.336,.077+i*.078);c.lineTo(.569,.077+i*.078);c.stroke();
      c.beginPath();c.moveTo(.336+i*.078,.077);c.lineTo(.336+i*.078,.31);c.stroke();
    }
    c.strokeStyle='#a3574d';c.lineWidth=.008;
    c.beginPath();c.moveTo(.375,.27);c.lineTo(.375,.113);c.lineTo(.53,.113);c.stroke();
  },0,.035,0,true);
  const pencil=group(table,.965,1.151,-.286);
  pencil.rotation.set(Math.PI/2,0,-1.37);
  cylinder(pencil,.020,.020,.47,finish(0xb47f48,.74),0,0,0,6);
  cylinder(pencil,.020,.001,.064,finish(0xdcc299,.90),0,-.265,0,12);
  cylinder(pencil,.021,.021,.042,finish(0x8f9b94,.49,.50),0,.239,0,16);
  cylinder(pencil,.020,.020,.029,finish(0xa6726f,.94),0,.269,0,16);
  const cloth=new T.MeshStandardMaterial({color:0x97716e,map:weave,bumpMap:weave,bumpScale:.011,roughness:.93});
  const ottoman=group(world,-3.70,floor,8.23);
  ottoman.rotation.y=-.14;
  box(ottoman,1.32,.45,1.32,cloth,0,.36,0,.190);
  box(ottoman,1.352,.195,1.352,cloth,0,.657,0,.094);
  const seam=finish(0x765659,.89);
  wire(ottoman,[[-.524,.607,.66],[0,.608,.677],[.524,.607,.66]],.011,seam);
  wire(ottoman,[[.663,.607,.516],[.675,.608,0],[.663,.607,-.516]],.011,seam);
  for(const x of [-.48,.48])for(const z of [-.48,.48])
    cylinder(ottoman,.074,.051,.135,trim,x,.064,z,12);
  floorContact(world,floor,-4.44,6.28,2.93,2.09,drawn);
  floorContact(world,floor,-3.70,8.23,1.63,1.57,drawn);

  const stool=group(world,-.09,floor,9.68);
  box(stool,1.58,.136,.85,trim,0,.731,0,.042);
  box(stool,1.52,.136,.805,
    new T.MeshStandardMaterial({color:0x6b7865,map:weave,roughness:.94}),0,.864,0,.060);
  box(stool,1.43,.078,.70,wood,0,.226,0,.012);
  for(const x of [-.663,.663])for(const z of [-.331,.331])
    box(stool,.096,.70,.092,trim,x,.353,z,.012);
  const shoes=finish(0x66534c,.69), sole=finish(0x403a34,.83), inset=finish(0x493e37,.97);
  for(const x of [-.188,.160]){
    const shoe=group(stool,x,.271,.032+Math.sign(x)*.038);
    shoe.rotation.y=Math.sign(x)*.12;
    bead(shoe,0,.024,0,.113,.027,.238,sole);
    bead(shoe,0,.071,.044,.104,.062,.185,shoes);
    bead(shoe,0,.102,-.102,.076,.054,.106,shoes);
    bead(shoe,0,.150,-.101,.054,.012,.081,inset);
  }
  floorContact(world,floor,-.09,9.68,1.74,1.06,drawn);
  addRubberPlant(world,floor,tools);
  addProjectCart(world,floor,tools);
}

function addProjectCart(world,floor,{group,box,bead,cylinder,wire,finish,drawn,wood}){
  const frame=finish(0x576866,.59,.27), rubber=finish(0x3d3b38,.94);
  const cart=group(world,6.27,floor,5.85);
  cart.rotation.y=-.46;
  for(const x of [-.865,.865])for(const z of [-.405,.405]){
    box(cart,.067,1.58,.067,frame,x,.921,z,.007);
    const wheel=cylinder(cart,.105,.105,.064,rubber,x,.114,z,18);
    wheel.rotation.z=Math.PI/2;
    bead(cart,x+.040,.114,z,.020,.049,.048,frame);
  }
  for(const y of [.269,.825,1.68])
    box(cart,1.89,.070,.978,wood,0,y,0,.018);
  for(const y of [.323,.879])for(const z of [-.481,.481])
    box(cart,1.906,.079,.038,frame,0,y,z,.005);
  wire(cart,[[.862,1.64,-.397],[.943,1.926,-.39],[1.11,2.006,-.28],
    [1.12,2.006,.28],[.943,1.926,.39],[.862,1.64,.397]],.032,frame);
  const steel=finish(0x889695,.51,.43), caseBlue=finish(0x6d7e8b,.76);
  const toolbox=group(cart,-.405,.863,.06);
  box(toolbox,.80,.271,.642,caseBlue,0,.147,0,.025);
  box(toolbox,.803,.072,.652,caseBlue,0,.312,0,.017);
  for(const x of [-.234,.234])box(toolbox,.072,.089,.019,steel,x,.290,.332,.006);
  wire(toolbox,[[-.144,.352,0],[-.120,.409,0],[.120,.409,0],[.144,.352,0]],.019,frame);
  const rolled=finish(0xd4c9a9,.91);
  for(const [x,y] of [[.34,.326],[.58,.328],[.47,.468]]){
    const planning=cylinder(cart,.105,.102,.64,rolled,x,y,0,20);
    planning.rotation.x=Math.PI/2;
    bead(cart,x,y,.322,.053,.053,.010,finish(0x8c806a,.87));
  }
  box(cart,.65,.369,.65,finish(0xb69978,.92),-.451,.489,.016,.026);
  box(cart,.695,.057,.698,finish(0xc4ab8a,.92),-.451,.688,.016,.016);
  box(cart,.162,.045,.011,finish(0x7f725d,.88),-.451,.568,.349,.007);

  const mat=finish(0x455a56,.94);
  box(cart,1.47,.024,.70,mat,-.073,1.730,.015,.011);
  const rover=group(cart,-.33,1.745,.027);
  rover.rotation.y=-.26;
  box(rover,.58,.054,.492,steel,0,.129,0,.012);
  box(rover,.39,.049,.31,finish(0x627d64,.72),0,.185,-.037,.008);
  box(rover,.130,.027,.111,finish(0x393935,.71),-.059,.223,-.069,.004);
  for(const z of [.15,-.146])for(const x of [-.291,.291]){
    const tire=cylinder(rover,.128,.128,.072,rubber,x,.126,z,20);
    tire.rotation.z=Math.PI/2;
    bead(rover,x*1.16,.126,z,.012,.052,.052,steel);
  }
  wire(rover,[[.115,.225,-.028],[.184,.265,.056],[.148,.168,.208]],.008,finish(0xab6654,.73));
  wire(rover,[[-.162,.225,-.101],[-.241,.258,-.033],[-.226,.166,.114]],.008,frame);
  box(cart,.372,.089,.246,caseBlue,.462,1.789,.046,.012).rotation.y=.12;
  for(const z of [.022,.075,.128])box(cart,.233,.013,.024,steel,.461,1.841,z,.005).rotation.y=.12;
  floorContact(world,floor,6.27,5.85,2.24,1.22,drawn);
}

function addRubberPlant(world,floor,{group,cylinder,wire,finish,drawn}) {
  const root=group(world,7.87,floor,8.58);
  const pot=finish(0x926051,.50), rim=finish(0xbb8267,.38);
  const profile=[[.34,0],[.39,.04],[.403,.135],[.461,.53],[.495,.707],[.495,.755],[.447,.768],[.442,.706],[.380,.141],[0,.131]];
  const bowl=new T.Mesh(new T.LatheGeometry(profile.map(([x,y])=>new T.Vector2(x,y)),32),pot);
  bowl.castShadow=true;bowl.receiveShadow=true;root.add(bowl);
  cylinder(root,.473,.496,.054,rim,0,.681,0,32);
  cylinder(root,.43,.43,.035,finish(0x584639,.99),0,.692,0,32);
  const center=finish(0x889461,.79), stem=finish(0x657350,.87);
  const shape=new T.BufferGeometry(), positions=[],uv=[],indices=[];
  const ridge=t=>.23*Math.sin(t*Math.PI*.92)-.13*t*t;
  for(let row=0;row<=16;row++){
    const t=row/16, width=.265*Math.sin(Math.PI*t)**.84*(1.1-.28*t);
    for(let col=0;col<=4;col++){
      const across=(col-2)/2;
      positions.push(width*across,ridge(t)-.17*across*across*Math.sin(Math.PI*t),t);
      uv.push(col/4,t);
      if(row&&col){
        const i=row*5+col;indices.push(i,i-1,i-6,i,i-6,i-5);
      }
    }
  }
  shape.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  shape.setAttribute('uv',new T.Float32BufferAttribute(uv,2));shape.setIndex(indices);shape.computeVertexNormals();
  const greens=[0x4b6651,0x69815a,0x677850,0x7d8c5c].map(color=>
    new T.MeshStandardMaterial({color,roughness:.41,side:T.DoubleSide}));
  const branches=[
    [[-.05,.70,0],[-.17,1.29,-.07],[-.30,1.80,-.11],[-.38,2.18,-.13]],
    [[.07,.70,-.03],[.19,1.38,.02],[.24,2.17,.04],[.36,2.83,.14]],
    [[0,.70,.10],[-.08,1.48,.20],[-.02,2.30,.28],[.07,3.09,.30]],
  ];
  for(const [b,path] of branches.entries()){
    wire(root,path,.028-b*.004,stem);
    for(let i=1;i<path.length;i++){
      const leaf=group(root,...path[i]);
      leaf.rotation.set(-.17+i*.05,(b*2.12+i*1.81),-.15*Math.sin(i*3+b));
      leaf.scale.setScalar(.86+i*.08);
      const surface=new T.Mesh(shape,greens[(b+i)%greens.length]);
      leaf.add(surface);surface.castShadow=true;surface.receiveShadow=true;
      wire(leaf,[0,.21,.45,.69,.91].map(t=>[0,ridge(t)+.006,t]),.0065,center).castShadow=false;
    }
  }
  floorContact(world,floor,7.87,8.58,1.29,1.12,drawn);
}
