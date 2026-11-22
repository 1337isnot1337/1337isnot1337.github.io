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

export function addRug(parent,x,y,z,w,d,colors,{box,drawn,finish}) {
  const [base,band,line]=colors;
  const rug=box(parent,w,.028,d,finish(base,.99),x,y+.014,z,.014);
  rug.castShadow=false;
  drawn(parent,w,d,(c,a,b)=>{
    const swatch=n=>'#'+n.toString(16).padStart(6,'0');
    c.fillStyle=swatch(base);c.fillRect(0,0,a,b);
    c.strokeStyle=swatch(band);c.lineWidth=.16;c.strokeRect(.18,.18,a-.36,b-.36);
    c.strokeStyle=swatch(line);c.lineWidth=.019;
    for(const edge of [.065,.265,.325])c.strokeRect(edge,edge,a-2*edge,b-2*edge);
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
  for(const [x,z,a,b] of [[-7.13,7.81,2.84,2.54],[-7.55,5.69,1.45,1.34],[-8.76,9.26,.92,.84]]){
    const contact=drawn(world,a,b,(c,w,h)=>{
      c.save();c.scale(w,h);
      const shadow=c.createRadialGradient(.5,.5,.11,.5,.5,.5);
      shadow.addColorStop(0,'#2b211e5c');shadow.addColorStop(.63,'#2b211e36');shadow.addColorStop(1,'#2b211e00');
      c.fillStyle=shadow;c.fillRect(0,0,1,1);c.restore();
    },x,floor+.035,z,true,102);
    contact.material.alphaTest=0;
    contact.receiveShadow=false;
  }
  return lamp.position.clone().add(new T.Vector3(0,3.59,0));
}
