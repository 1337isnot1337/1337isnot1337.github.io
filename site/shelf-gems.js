import * as T from './vendor/three/three.module.min.js';
import { clockHands, setClock } from './shelf-clock.js?v=1';

let audio;
function tone(frequency,{duration=.28,volume=.085,pan=0,shape='sine',at=0}={}) {
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  audio??=new Audio();
  if(audio.state==='suspended')audio.resume().catch(()=>{});
  const note=audio.createOscillator(), gain=audio.createGain();
  const start=audio.currentTime+at;
  note.type=shape;
  note.frequency.value=frequency;
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(volume,start+.017);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  note.connect(gain);
  if(pan && audio.createStereoPanner){
    const balance=audio.createStereoPanner();
    balance.pan.value=pan;gain.connect(balance).connect(audio.destination);
  }else gain.connect(audio.destination);
  note.start(start);note.stop(start+duration+.02);
}

function piano(parts) {
  const playing=new Map();
  const keyboard={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72,o:73,l:74};
  function activate(id){
    if(!parts.has(id)||!id.startsWith('piano-'))return false;
    const frequency=440*2**((Number(id.slice(6))-69)/12);
    tone(frequency,{duration:.55,volume:.11,shape:'triangle'});
    tone(frequency*2,{duration:.12,volume:.025});
    playing.set(id,performance.now());
    return true;
  }
  return {primary:'piano-60',label:'play a note. The A through L keys play the white keys',
    activate,drag:()=>false,key(name){return keyboard[name]&&activate('piano-'+keyboard[name]);},
    paint(time){
      for(const [id,start] of playing){
        const release=Math.max(0,1-(time-start)/175);
        parts.get(id).rotation.x=release*.21;
        if(!release)playing.delete(id);
      }
      return playing.size>0;
    },
  };
}

function clock(hands) {
  return {primary:'dial-face',label:'hear a chime',drag:()=>false,
    activate(part){
      if(part!=='dial-face')return false;
      tone(523.25,{duration:.68,volume:.072});tone(1046.5,{duration:.26,volume:.024});
      return true;
    },
    paint(){setClock(hands,new Date());return false;},
  };
}

function movingControl(parts, primary, label, options) {
  const control=parts.get(primary);
  const {axis='z',property='rotation',distance=1,onToggle,pulse=false,drag=false}=options;
  const home=control[property][axis];
  let target=0,amount=0,tapped=-Infinity;
  return {primary,label,
    activate(part){
      if(part!==primary)return false;
      target=pulse?1:1-target;
      tapped=performance.now();
      onToggle?.(target);
      return true;
    },
    drag(part,x,y){
      if(!drag||part!==primary)return false;
      target=Math.min(1,Math.max(0,target+(x-y)*1.6));
      return true;
    },
    paint(time,dt,pose,quiet){
      const goal=pulse?Math.max(0,1-(time-tapped)/380):target;
      amount=quiet||Math.abs(amount-goal)<.005?goal:amount+(goal-amount)*(1-Math.exp(-dt*18));
      control[property][axis]=home+amount*distance;
      return amount!==goal||(pulse&&goal>0);
    },
  };
}

function rotation(parts, primary, label, axes, tune) {
  let turning=false;
  return {primary,label,drag:()=>false,
    activate(part,quiet){
      if(!axes.some(([id])=>id===part))return false;
      turning=!turning;
      if(turning){
        tune?.();
        if(quiet)for(const [id,axis,speed] of axes)parts.get(id).rotation[axis]+=.18*speed;
      }
      return true;
    },
    paint(time,dt,pose,quiet){
      if(!turning||quiet)return false;
      for(const [id,axis,speed] of axes)parts.get(id).rotation[axis]+=dt*speed;
      return true;
    },
  };
}

// Hinges and sliders each drive a part of the model around its own pivot.
const mechanisms={
  book:['book-cover','open the cover',{axis:'y',distance:-1.92,drag:true}],
  frame:['frame-print','slide the print out',{axis:'y',property:'position',distance:.22,drag:true}],
  chart:['chart-cursor','slide the reading cursor',{axis:'x',property:'position',distance:.35,drag:true}],
  botanical:['plant-glass','lift the glass',{axis:'y',distance:-1.72,drag:true}],
  swatch:['swatch-card','fan the samples',{distance:-.68,drag:true}],
  ticket:['ticket-stub','pull the ticket stub',{axis:'x',property:'position',distance:.17,drag:true}],
  packet:['packet-fold','open the folded flap',{axis:'x',distance:-2.26,drag:true}],
  envelope:['envelope-slip','pull the letter out',{axis:'y',property:'position',distance:.25,drag:true}],
  sprig:['sprig-stems','brush the stems',{distance:.16,pulse:true}],
  flask:['flask-cork','lift the cork',{axis:'y',property:'position',distance:.092,drag:true}],
  crystal:['crystal-sample','tilt the crystal faces',{axis:'y',distance:.81,drag:true}],
  key:['key-shaft','turn the key',{axis:'x',distance:Math.PI*.62,drag:true}],
  fabric:['fabric-fold','unfold the top layer',{axis:'x',distance:-2.76,drag:true}],
  tote:['tote-pocket','open the front pocket',{axis:'x',distance:.80,drag:true}],
  crate:['crate-lid','open the lid',{axis:'x',distance:-1.78,drag:true}],
  tube:['tube-cap','draw out the rolled print',{axis:'x',property:'position',distance:-.18,drag:true}],
  brush:['brush-bristles','flex the bristles',{axis:'x',distance:.55,pulse:true,drag:true}],
  cat:['cat-tail','pet the tiny cat',{axis:'y',distance:.44,pulse:true,
    onToggle:()=>{tone(466,{duration:.13,volume:.032,shape:'triangle'});tone(370,{at:.09,duration:.23,volume:.03});}}],
  bird:['bird-beak','hear a chirp',{distance:-.36,pulse:true,
    onToggle:()=>{tone(1450,{duration:.10,volume:.032});tone(1760,{at:.09,duration:.16,volume:.025});}}],
};

function toggle(parts, id, label, view) {
  let enabled=false;
  return {primary:id,label,drag:()=>false,paint:()=>false,
    activate(part){
      if(part!==id)return false;
      enabled=!enabled;
      parts.get(view).visible=enabled;
      return true;
    }};
}

function waveform(parts) {
  let selected=0;
  return {primary:'radio-knob',label:'change the test waveform',drag:()=>false,paint:()=>false,
    activate(part){
      if(part!=='radio-knob')return false;
      parts.get('radio-trace-'+selected).visible=false;
      selected=(selected+1)%3;
      parts.get('radio-trace-'+selected).visible=true;
      parts.get(part).rotation.z=-.74*selected;
      return true;
    }};
}

function meter(parts) {
  let measuring=false,started=0;
  return {primary:'meter-switch',label:'measure the test signal',drag:()=>false,
    activate(part){
      if(part!=='meter-switch')return false;
      measuring=!measuring;started=performance.now();
      parts.get(part).rotation.z=measuring?-Math.PI/2:0;
      return true;
    },
    paint(time,dt,pose,quiet){
      const seconds=Math.max(0,(time-started)/1000);
      const level=measuring?(quiet?.63:.54+.29*Math.sin(seconds*3.2)):0;
      parts.get('meter-needle').rotation.z=.76-level*1.55;
      return measuring&&!quiet;
    }};
}

function sampleRack(parts) {
  const tubes=[0,1,2,3].map(i=>parts.get('sample-tube-'+i));
  const layer=tubes.map(tube=>tube.position.y);
  let selected=null;
  function lift(id){
    if(!id?.startsWith('sample-tube-'))return false;
    const tube=parts.get(id);
    selected=selected===tube?null:tube;
    return true;
  }
  return {primary:'sample-tube-0',label:'lift a sample tube',activate:lift,drag:()=>false,
    paint(time,dt,pose,quiet){
      let moving=false;
      for(const [i,tube] of tubes.entries()){
        const target=layer[i]+(tube===selected?.20:0);
        const distance=target-tube.position.y;
        tube.position.y=quiet||Math.abs(distance)<.003?target:tube.position.y+distance*(1-Math.exp(-dt*17));
        moving ||= tube.position.y!==target;
      }
      return moving;
    }};
}

function water(parts) {
  let started=-Infinity;
  const drops=parts.get('water-drops'),spout=parts.get('can-spout');
  const home=drops.position.y;
  return {primary:'can-spout',label:'pour a little water',drag:()=>false,
    activate(part){
      if(part!=='can-spout')return false;
      started=performance.now();
      return true;
    },
    paint(time,dt,pose,quiet){
      const seconds=Math.max(0,(time-started)/1000);
      const pouring=seconds<.72;
      spout.rotation.z=pouring?.29:0;
      drops.visible=pouring;
      drops.position.y=home-(quiet?0:seconds%.18)*.35;
      return pouring;
    }};
}

function meterDial(copy,parts) {
  const needle=parts.get('dial-needle');
  if(copy.userData.dialLabel==='Cardinal dial'){
    const north=new T.Vector3(),inverse=new T.Quaternion();
    let offset=0;
    return {primary:'dial-needle',label:'check the compass bearing',drag:()=>false,
      activate(part){if(part!=='dial-needle')return false;offset=.48;return true;},
      paint(time,dt,pose,quiet){
        north.set(0,0,-1).applyQuaternion(inverse.copy(pose).invert());
        if(Math.hypot(north.x,north.y)>.07)needle.rotation.z=Math.atan2(-north.x,north.y)+offset;
        if(quiet||offset<.006)offset=0;
        else offset*=Math.exp(-dt*9);
        return offset>0;
      }};
  }
  let counting=false,beatAt=0,beat=0;
  return {primary:'dial-needle',label:'start or stop the metronome',drag:()=>false,
    activate(part){
      if(part!=='dial-needle')return false;
      counting=!counting;beatAt=performance.now();beat=0;
      if(counting)tone(880,{volume:.044,duration:.055});
      return true;
    },
    paint(time,dt,pose,quiet){
      if(!counting){needle.rotation.z=0;return false;}
      const phase=Math.max(0,time-beatAt)/625;
      if(Math.floor(phase)!==beat){
        beat=Math.floor(phase);
        tone(beat%4===0?880:549,{volume:.040,duration:.055});
      }
      needle.rotation.z=quiet?0:Math.sin(phase*Math.PI)*.59;
      return true;
    }};
}

export function shelfGems(copy,parts) {
  const hands=clockHands(copy);
  if(hands)return clock(hands);
  const kind=copy.userData.shelfKind;
  if(kind==='starship')return movingControl(parts,'starship-upper','separate Starship from Super Heavy',
    {axis:'y',property:'position',distance:copy.userData.inspectionHeadroom,drag:true});
  if(kind==='keys')return piano(parts);
  if(kind==='record')return rotation(parts,'record-disc','spin the record',[['record-disc','z',-3.49]],()=>{
    for(const [i,note] of [392,440,523.25,493.88,392].entries())tone(note,{at:i*.22,duration:.32,volume:.058});
  });
  if(kind==='reel')return rotation(parts,'reel-core','start or stop the reel',[['reel-core','z',-6]]);
  if(kind==='cassette')return rotation(parts,'cassette-0','wind the cassette',[['cassette-0','z',5],['cassette-1','z',3.8]]);
  if(kind==='gramophone')return rotation(parts,'gramophone-disc','spin the turntable',[['gramophone-disc','y',-8.17]],()=>{
    for(const [i,note] of [293.66,349.23,392,523.25,440,392].entries())tone(note,{at:i*.22,shape:'triangle',volume:.058});
  });
  if(kind==='headphones')return movingControl(parts,'headphone-cup','test the left and right headphones',
    {axis:'y',distance:.24,pulse:true,onToggle:()=>{tone(349.23,{pan:-1});tone(440,{pan:1,at:.34});}});
  if(kind==='dial')return meterDial(copy,parts);
  if(kind==='spool')return rotation(parts,'spool-core','wind the spool',[['spool-core','z',-5]]);
  if(kind==='bowl')return movingControl(parts,'bowl-coins','rattle the loose pieces',
    {axis:'y',distance:2.55,pulse:true,onToggle:()=>tone(980,{duration:.11,volume:.025})});
  if(kind==='can')return parts.has('can-spout')?water(parts):
    movingControl(parts,'can-tool','lift what is inside',{axis:'y',property:'position',distance:.17,drag:true});
  if(kind==='radio')return waveform(parts);
  if(kind==='meter')return meter(parts);
  if(kind==='loupe')return toggle(parts,'loupe-lens','check the engraving under magnification','loupe-magnification');
  if(kind==='chip')return toggle(parts,'chip-power','power the chip carrier','chip-diode');
  if(kind==='rack')return sampleRack(parts);
  if(kind==='prism')return toggle(parts,'prism-optic','split a light beam','prism-spectrum');
  if(kind==='lantern')return toggle(parts,'lantern-glow','switch the lantern on or off','lantern-lit');
  if(kind==='star')return rotation(parts,'star-rotor','spin the ornament',[['star-rotor','z',4.9]]);
  if(mechanisms[kind])return movingControl(parts,...mechanisms[kind]);
  return null;
}
