import * as T from './vendor/three/three.module.min.js';

export function corkMaterial() {
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=256;
  const c=canvas.getContext('2d');
  let seed=24703;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  c.fillStyle='#b68d62';c.fillRect(0,0,512,256);
  const chips=['#725241','#8b674c','#a67853','#cfaa7c','#d8b98c','#e5c093'];
  for(let i=0;i<4200;i++){
    const x=random()*512,y=random()*256,r=.22+random()**2*3.5;
    const shade=Math.floor(random()*chips.length);
    c.save();c.translate(x,y);c.rotate(random()*Math.PI);
    c.fillStyle=chips[shade];c.globalAlpha=.28+random()*.38;
    c.beginPath();c.moveTo(-r,0);
    c.quadraticCurveTo(-r*.84,-r*.73,0,-r*.58);
    c.lineTo(r*.84,-r*.28);c.quadraticCurveTo(r*.75,r*.52,r*.21,r*.59);
    c.lineTo(-r*.68,r*.37);c.fill();c.restore();
  }
  const grain=new T.CanvasTexture(canvas);
  grain.colorSpace=T.SRGBColorSpace;
  grain.anisotropy=4;
  return new T.MeshStandardMaterial({map:grain,bumpMap:grain,bumpScale:.011,roughness:.96});
}

// Sample the same curve for stock and ink so the image follows the curled paper.
export function curledPrint(w,h,cardW,cardH,y=0,offset=0){
  const g=new T.PlaneGeometry(w,h,8,10);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const u=p.getX(i)/cardW+.5;
    const v=(p.getY(i)+y)/cardH+.5;
    const lift=(1-v)**2*(.009+.042*u**4+.014*(1-u)**4);
    p.setZ(i,offset+lift+.007*Math.sin(u*Math.PI)*Math.sin(v*Math.PI));
  }
  g.computeVertexNormals();
  return g;
}

export function scopeScale(c,w,h){
  const centerY=.242;
  c.strokeStyle='#545a49';c.lineWidth=.003;
  for(let i=0;i<=12;i++){
    const angle=(i-6)*.235, inside=i%3===0?.140:.153, outside=.166;
    c.beginPath();
    c.moveTo(w*.52+Math.sin(angle)*inside,centerY-Math.cos(angle)*inside);
    c.lineTo(w*.52+Math.sin(angle)*outside,centerY-Math.cos(angle)*outside);c.stroke();
  }
  c.fillStyle='#414838';c.textAlign='center';c.textBaseline='middle';
  c.font='600 .030px sans-serif';
  c.fillText('TIME / DIV',w*.52,.046);
  c.font='600 .024px sans-serif';
  c.fillText('GAIN',w*.34,h-.047);
  c.fillText('LEVEL',w*.73,h-.047);
}
