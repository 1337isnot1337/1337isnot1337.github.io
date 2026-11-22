const paper='#eee4cf', text='#302a2d';

function stroke(c,points,color,width) {
  c.beginPath();c.moveTo(...points[0]);
  for(const point of points.slice(1))c.lineTo(...point);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}

function label(c,value,x,y,size,color,family='Georgia',align='left',limit) {
  c.font=`bold ${Math.round(size)}px ${family}`;
  c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;
  if(limit)c.fillText(value,x,y,limit);else c.fillText(value,x,y);
}

function trackPlate(c,w,h) {
  const top=h*.16,bottom=h*.81;
  const glass=c.createLinearGradient(0,top,w,bottom);
  glass.addColorStop(0,'#263e42');glass.addColorStop(.55,'#122327');glass.addColorStop(1,'#344641');
  c.fillStyle='#233b3d';c.fillRect(0,0,w,h);
  c.fillStyle=glass;c.fillRect(20,top,w-40,bottom-top);
  c.save();c.beginPath();c.rect(20,top,w-40,bottom-top);c.clip();
  c.translate(0,top);c.scale(w/480,(bottom-top)/226);
  const paths=[
    [[-5,171],[89,157],[153,158],[219,125]],
    [[219,125],[263,104],[338,69],[489,48]],
    [[219,125],[285,167],[358,192],[490,176]],
    [[219,125],[246,100],[270,101],[279,126]],
    [[279,126],[273,151],[246,150],[245,133]],
    [[67,-9],[166,29],[223,46],[291,40]],
    [[57,234],[121,207],[165,169],[178,150]],
    [[299,238],[302,193],[329,150],[384,124]],
  ];
  paths.forEach((points,index)=>{
    c.beginPath();c.moveTo(...points[0]);c.bezierCurveTo(...points[1],...points[2],...points[3]);
    c.strokeStyle=index<3?'#b2d1c682':'#9ebeb454';c.lineWidth=index<3?2.3:1.4;c.stroke();
    for(let i=0;i<=60;i++){
      const t=i/60,q=1-t;
      const at=axis=>points[0][axis]*q**3+3*points[1][axis]*q*q*t+3*points[2][axis]*q*t*t+points[3][axis]*t**3;
      c.fillStyle=i%4?'#d6e2cbba':'#f3e8b7';
      c.beginPath();c.arc(at(0)+Math.sin(i*7.1)*1.9,at(1)+Math.sin(i*4.3)*2.3,i%4?1.1:2.05,0,Math.PI*2);c.fill();
    }
  });
  for(let i=0;i<160;i++){
    c.fillStyle=i%5?'#9bb6a52c':'#d8dfad69';
    c.fillRect(21+(i*187.145)%435,(i*71.719)%226,1+i%2,1);
  }
  c.restore();
  c.strokeStyle='#b4b49a';c.lineWidth=1.4;c.strokeRect(20,top,w-40,bottom-top);
  label(c,'CLOUD CHAMBER',24,top*.69,19,'#e0d5b2','monospace');
  label(c,'Track plate',24,h*.94,28,'#f3e7cc');
  for(let i=0;i<5;i++)stroke(c,[[w-27-i*16,h*.876],[w-27-i*16,h*.916]],'#e0d5b2',1.5);
  stroke(c,[[w-91,h*.916],[w-27,h*.916]],'#e0d5b2',1.5);
}

function specimen(c,w,h,ink,fern) {
  const center=w*.50;
  c.strokeStyle=ink;c.lineWidth=3.5;
  c.beginPath();c.moveTo(center-24,h*.71);c.quadraticCurveTo(center+7,h*.45,center+18,h*.14);c.stroke();
  for(let i=0;i<(fern?12:6);i++){
    const count=fern?12:6,t=i/count,y=h*(.63-t*.45),x=center+(t-.5)*28;
    const width=(fern?106:118)*(1-t*.65),rise=h*(fern?.055:.14);
    for(const sign of fern?[-1,1]:[i%2?1:-1]){
      c.fillStyle=i%3?'#61764b':ink;
      c.beginPath();c.moveTo(x,y);
      c.quadraticCurveTo(x+width*.30*sign,y-rise,x+width*sign,y-rise*.84);
      c.quadraticCurveTo(x+width*.61*sign,y+rise*.22,x,y);c.fill();
      stroke(c,[[x,y],[x+width*.76*sign,y-rise*.65]],'#d6d8a1',1.2);
    }
  }
}

function diagram(c,w,h,name,ink) {
  const y=h*.42, x=w*.5, height=h*.30;
  c.strokeStyle=ink;c.fillStyle=ink;c.lineWidth=3;
  if(name==='Moon phase study'){
    c.fillStyle='#2e3546';c.fillRect(36,h*.15,w-72,h*.52);
    for(let i=0;i<5;i++){
      const cx=w*(.18+.16*i),r=Math.min(24,height*.46);
      c.beginPath();c.arc(cx,y,r,0,Math.PI*2);
      c.fillStyle='#596473';c.fill();
      c.save();c.clip();
      c.fillStyle='#eece93';c.beginPath();
      c.arc(cx,y,r,-Math.PI/2,Math.PI/2);
      c.bezierCurveTo(cx+(2-i)*r*.75,y+r,cx+(2-i)*r*.75,y-r,cx,y-r);
      c.fill();c.restore();
    }
    return;
  }
  if(name==='Cloud atlas'){
    const sky=c.createLinearGradient(0,h*.16,0,h*.68);
    sky.addColorStop(0,'#537992');sky.addColorStop(1,'#a1b5b4');
    c.fillStyle=sky;c.fillRect(36,h*.15,w-72,h*.53);
    for(const [px,py,scale] of [[.31,.42,1],[.54,.33,.75],[.71,.52,.57]]){
      c.fillStyle='#e7e2d1';c.beginPath();
      for(const [offset,rise,radius] of [[-34,2,17],[-14,-10,21],[8,-13,26],[32,3,18]]){
        const cx=w*px+offset*scale,cy=h*py+rise*scale;
        c.moveTo(cx+radius*scale,cy);c.arc(cx,cy,radius*scale,0,Math.PI*2);
      }
      c.fill();
    }
    return;
  }
  if(/Orion|Night/.test(name)){
    c.fillStyle='#2e3546';c.fillRect(36,h*.15,w-72,h*.52);
    const stars=[[.27,-.67],[.67,-.71],[.39,-.04],[.47,.04],[.55,.12],[.36,.62],[.65,.65]];
    const point=([px,py])=>[w*px,y+height*py];
    for(const indices of [[0,2,3,4,1],[2,5],[4,6]])stroke(c,indices.map(i=>point(stars[i])),'#b6ae91a8',1.8);
    stars.forEach((star,i)=>{c.beginPath();c.arc(...point(star),i%3===0?5:3.4,0,Math.PI*2);c.fillStyle='#f4e2b1';c.fill();});
    return;
  }
  if(name==='Starlink orbit sketch'){
    c.fillStyle='#263949';c.fillRect(36,h*.15,w-72,h*.52);
    const radius=height*.50;
    c.fillStyle='#628f9c';c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
    for(const turn of [-.91,-.22,.66]){
      c.beginPath();c.ellipse(x,y,radius*1.75,radius*.55,turn,0,Math.PI*2);
      c.strokeStyle='#dfc18b';c.lineWidth=2;c.stroke();
    }
    c.save();c.translate(x+radius*1.09,y-radius*.86);c.rotate(-.46);
    c.fillStyle='#f7e4a9';c.fillRect(-5,-5,10,10);
    for(const span of [-29,8])for(let i=0;i<3;i++)c.fillRect(span+i*7,-3,6,6);
    c.restore();
    return;
  }
  if(/atlas|Rail|timetable|Beamline/.test(name)){
    const routes=[
      [[.13,.6],[.25,.6],[.31,.27],[.49,.27],[.64,.49],[.85,.49]],
      [[.16,-.45],[.32,-.45],[.49,.27],[.69,-.46],[.84,-.46]],
    ];
    for(const [i,route] of routes.entries()){
      const points=route.map(([px,py])=>[w*px,y+height*py]);
      const rail=i?'#a25548':ink;
      stroke(c,points,rail,5);
      for(const [cx,cy] of points){
        c.beginPath();c.arc(cx,cy,6,0,Math.PI*2);c.strokeStyle=rail;c.lineWidth=3;
        c.fillStyle=paper;c.fill();c.stroke();
      }
    }
    return;
  }
  if(/Optics/.test(name)){
    stroke(c,[[w*.12,y],[w*.88,y]],'#a2967e',2);
    c.beginPath();c.moveTo(x,y-height*.77);c.quadraticCurveTo(x+49,y,x,y+height*.77);
    c.quadraticCurveTo(x-49,y,x,y-height*.77);c.stroke();
    for(const sign of [-1,1])stroke(c,[[w*.14,y+sign*height*.58],[x,y+sign*height*.58],[w*.74,y],[w*.86,y-sign*height*.29]],'#ad5d46',2.6);
    return;
  }
  if(/sleeve|Liner|Set list/.test(name)){
    c.beginPath();c.arc(x,y,height*.74,0,Math.PI*2);c.fill();
    for(const r of [.62,.48,.33]){
      c.beginPath();c.arc(x,y,height*r,0,Math.PI*2);c.strokeStyle='#f2ddacbd';c.lineWidth=1.8;c.stroke();
    }
    c.beginPath();c.arc(x,y,height*.22,0,Math.PI*2);c.fillStyle='#f2ddac';c.fill();
    return;
  }
  const left=w*.15,right=w*.85;
  c.save();
  for(let i=0;i<5;i++)stroke(c,[[left,y+(i-2)*height*.28],[right,y+(i-2)*height*.28]],ink+'40',1.1);
  for(let i=0;i<=8;i++){
    const px=left+(right-left)*i/8;
    stroke(c,[[px,y-height*.56],[px,y+height*.56]],ink+'40',1.1);
  }
  const trace=Array.from({length:65},(_,i)=>{
    const t=i/64;
    return [left+(right-left)*t,y+Math.sin(t*14)*Math.sin(t*2.6+.28)*height*.55];
  });
  stroke(c,trace,ink,3.5);
  if(name==='Margin graph')for(const i of [9,21,35,51]){
    c.beginPath();c.arc(...trace[i],4,0,Math.PI*2);c.fillStyle=ink;c.fill();
  }
  c.restore();
}

export function paintRoomPrint(c,w,h,name,color,kind) {
  const width=480,height=width*h/w;
  c.setTransform(c.canvas.width/width,0,0,c.canvas.height/height,0,0);
  if(name==='Track plate')return trackPlate(c,width,height);
  const ink='#'+color.toString(16).padStart(6,'0');
  const wash=c.createLinearGradient(0,0,width,height);
  wash.addColorStop(0,'#f3ead9');wash.addColorStop(.68,paper);wash.addColorStop(1,'#d5c5a7');
  c.fillStyle=wash;c.fillRect(0,0,width,height);
  c.strokeStyle=ink;c.lineWidth=3;c.strokeRect(17,15,width-34,height-30);
  if(kind==='botanical'){
    specimen(c,width,height,ink,/fern/i.test(name));
  }else if(kind==='swatch'){
    ['#726077','#b97575','#6b9297','#788459','#c08e55'].forEach((color,i)=>{
      c.fillStyle=color;c.fillRect(42+i*81,height*.19,69,height*.44);
      stroke(c,[[42+i*81,height*.68],[111+i*81,height*.68]],color,2.5);
    });
  }else if(kind==='ticket'){
    c.setLineDash([4,6]);stroke(c,[[width*.79,22],[width*.79,height-22]],ink,2);c.setLineDash([]);
    label(c,/train/i.test(name)?'MORNING SERVICE':/tour/i.test(name)?'ADMIT ONE':'FILE COPY',
      38,height*.36,height*.10,ink,'monospace');
    for(let i=0;i<11;i++){
      c.fillStyle=ink;c.fillRect(width*.81+i*5,height*.20,i%3===0?3:1.5,height*.60);
    }
    label(c,name,38,height*.69,height*.155,text,'Georgia','left',width*.68);
    return;
  }else{
    diagram(c,width,height,name,ink);
  }
  stroke(c,[[43,height*.75],[width-43,height*.75]],ink,1.8);
  label(c,name,width*.5,height*.89,Math.min(height*.13,36),text,'Georgia','center',width*.82);
}
