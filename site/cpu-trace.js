(() => {
  const trace=document.querySelector('#cpu-trace');
  if(!trace) return;
  // Stable falling-edge snapshots of the pinned RTL testbench. These are
  // simulation times, not a claim about hardware clock speed or performance.
  const frames=[
    {time:170,fetch:5,fetchInstruction:'D = D − A',execute:6,executeInstruction:'D;JGT',d:5,predicted:5,actual:5,state:'correct',explanation:'D is 5, so the jump is taken. The prediction points to address 5, which is already being fetched.'},
    {time:180,fetch:6,fetchInstruction:'D;JGT',execute:5,executeInstruction:'D = D − A',d:5,predicted:6,actual:6,state:'subtract',explanation:'The subtraction is in execute while the next jump is fetched. A is 5. D is still 5 in this snapshot; the next rising edge writes 0.'},
    {time:190,fetch:5,fetchInstruction:'D = D − A',execute:6,executeInstruction:'D;JGT',d:0,predicted:5,actual:7,state:'mispredict',explanation:'D is now 0, so the jump should not be taken. Fetch has followed the prediction to address 5, but the correct next address is 7. The fetched subtraction is on the wrong path.'},
    {time:200,fetch:7,fetchInstruction:'NOP',execute:null,executeInstruction:'Inserted NOP',d:0,predicted:null,actual:null,state:'bubble',explanation:'At the 195 ns rising edge, the processor discarded the wrong-path instruction and redirected fetch to 7. Execute now contains an inserted no-op bubble. D stays 0.'},
    {time:210,fetch:8,fetchInstruction:'@1',execute:7,executeInstruction:'NOP',d:0,predicted:8,actual:8,state:'recovered',explanation:'Execution resumes on the correct path. Address 7 contains the program’s own NOP, distinct from the inserted bubble in the previous snapshot. D remains 0.'}
  ];
  let index=0,discard=null;
  const set=(id,value)=>trace.querySelector(id).textContent=value;
  function render(){
    const f=frames[index];
    discard?.remove();
    if(index===3){
      discard=document.createElement('s');discard.className='trace-discard';
      discard.textContent='Address 5 · '+frames[2].fetchInstruction;
      trace.querySelector('#cpu-trace-fetch').append(discard);
      if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === false)
        discard.animate([{transform:'translateX(-12px)',opacity:.2},{transform:'translateX(0)',opacity:1}],{duration:200,easing:'ease-out'});
    }trace.dataset.time=f.time;trace.dataset.state=f.state;
    set('#trace-time',`${f.time} ns`);
    set('#trace-fetch-address',`Address ${f.fetch}`);set('#trace-fetch-instruction',f.fetchInstruction);
    set('#trace-execute-address',f.execute===null?'Bubble · no program address':`Address ${f.execute}`);
    set('#trace-execute-instruction',f.executeInstruction);set('#trace-register-d',String(f.d));
    set('#trace-prediction',f.predicted===null?'Wrong-path instruction discarded':`Predicted next: ${f.predicted} · Actual next: ${f.actual}`);
    set('#trace-summary',f.explanation);
    const notes=[['Predicted loop path','D is positive · jump to 5'],['Next branch','Subtract 5 · D becomes zero'],['Wrong path · will be discarded','D is zero · do not jump'],['Correct path','Inserted NOP · no register change'],['Read next instruction','Program NOP · no register change']];
    set('#trace-fetch-note',notes[index][0]);set('#trace-execute-note',notes[index][1]);
    trace.querySelector('#trace-prev').disabled=index===0;
    trace.querySelector('#trace-next').disabled=index===frames.length-1;
  }
  trace.querySelector('#trace-prev').addEventListener('click',()=>{index=Math.max(0,index-1);render();});
  trace.querySelector('#trace-next').addEventListener('click',()=>{index=Math.min(frames.length-1,index+1);render();});
  trace.querySelector('#trace-reset').addEventListener('click',()=>{index=0;render();});
  trace.querySelector('.trace-controls').hidden=false;
  render();
})();
