export function bindRoomActions(links,redraw) {
  const hinges=[
    {id:'study-door',property:'rotation',axis:'y',travel:1.36},
    {id:'window-sash',property:'position',axis:'y',travel:1.18},
    {id:'cart-toolbox',part:'project-toolbox-lid',property:'rotation',axis:'x',travel:-.72},
    {id:'reading-book',part:'reading-book-cover',property:'rotation',axis:'z',travel:2.42},
    {id:'library-box',part:'library-box-tray',property:'position',axis:'z',travel:.405},
  ];
  for(const hinge of hinges){
    const button=links.get(hinge.id);
    button.addEventListener('click',()=>{
      hinge.open=!hinge.open;
      button.setAttribute('aria-pressed',String(hinge.open));
      redraw();
    });
  }

  const lamp=links.get('reading-lamp'), rover=links.get('cart-rover');
  let lampOverride=null, lampLevel=0, lampStarted=-Infinity;
  let roverStarted=-Infinity, plantStarted=-Infinity, roverTimer;
  let chain, shade, stems, wheels, diode;
  lamp.addEventListener('click',()=>{
    lampOverride=lamp.getAttribute('aria-pressed')!=='true';
    lamp.setAttribute('aria-pressed',String(lampOverride));
    lampStarted=performance.now();
    redraw();
  });
  rover.addEventListener('click',()=>{
    const now=performance.now();
    roverStarted=now-roverStarted<2400?-Infinity:now;
    clearTimeout(roverTimer);
    if(roverStarted===now)roverTimer=setTimeout(redraw,2410);
    redraw();
  });
  links.get('rubber-plant').addEventListener('click',()=>{
    plantStarted=performance.now();
    redraw();
  });

  const goalFor=hinge=>hinge.home+(hinge.open?hinge.travel:0);
  return {
    mount(model){
      for(const hinge of hinges){
        const part=hinge.part?model.details.get(hinge.part):model.targets.get(hinge.id).root;
        hinge.joint=part[hinge.property];
        hinge.home=hinge.joint[hinge.axis];
        hinge.joint[hinge.axis]=goalFor(hinge);
      }
      chain=model.details.get('reading-chain');
      shade=model.details.get('reading-shade').children[0].material;
      stems=model.details.get('rubber-plant-stems');
      wheels=[0,1,2,3].map(i=>model.details.get('rover-wheel-'+i));
      diode=model.details.get('rover-diode').children[0].material;
    },
    paint({time,dt,night,nightGoal,reduced,ease}){
      let moving=false, geometryMoved=false;
      for(const hinge of hinges){
        const {joint,axis}=hinge, before=joint[axis], goal=goalFor(hinge);
        joint[axis]=ease(before,goal);
        geometryMoved ||= joint[axis]!==before;
        moving ||= joint[axis]!==goal;
      }

      const lampOn=lampOverride??Boolean(nightGoal);
      if((lamp.getAttribute('aria-pressed')==='true')!==lampOn)lamp.setAttribute('aria-pressed',String(lampOn));
      const lampGoal=Number(lampOn);
      if(lampOverride===null)lampLevel=night;
      else if(reduced||Math.abs(lampLevel-lampGoal)<.004)lampLevel=lampGoal;
      else lampLevel+=(lampGoal-lampLevel)*(1-Math.exp(-dt*13));
      moving ||= lampOverride!==null&&lampLevel!==Number(lampOn);
      shade.emissiveIntensity=.64*lampLevel;
      const pull=(time-lampStarted)/380;
      const chainY=3.58-(pull>=0&&pull<1&&!reduced ? .075*Math.sin(Math.PI*pull) : 0);
      geometryMoved ||= chain.position.y!==chainY;
      moving ||= pull<1&&!reduced;
      chain.position.y=chainY;

      const elapsed=time-roverStarted, running=elapsed<2400;
      if((rover.getAttribute('aria-pressed')==='true')!==running){
        rover.setAttribute('aria-pressed',String(running));
      }
      diode.color.setHex(running?0xffbb4d:0x614634);
      if(running&&!reduced){
        const speed=Math.min(1,Math.max(0,elapsed)/310,(2400-elapsed)/500)*14;
        for(const wheel of wheels)wheel.rotateY(dt*speed);
        geometryMoved=true;
      }
      moving ||= running&&!reduced;

      const rustle=Math.max(0,time-plantStarted)/(reduced?300:1000);
      const sway=rustle<1 ? (reduced?.024:.16*(1-rustle)**2*Math.sin(rustle*18)) : 0;
      geometryMoved ||= stems.rotation.z!==sway;
      moving ||= rustle<1;
      stems.rotation.z=sway;
      stems.rotation.x=-sway*.52;
      return {moving,geometryMoved,readingLevel:lampLevel};
    }
  };
}
