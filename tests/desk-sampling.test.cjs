const { test } = require('node:test');
const assert = require('node:assert/strict');

test('motion sampling responds to alternating missed refreshes and recovers after steady frames',async()=>{
  const {motionSampler}=await import('../site/furniture.js');
  for(const [software,refresh] of [[false,1000/60],[true,1000/30]]){
    const sampling=motionSampler(software);
    let time=100;
    const tick=gap=>sampling.frame(time+=gap);
    sampling.frame(time);
    for(const gap of [refresh,refresh,200,refresh,refresh,refresh])tick(gap);
    assert.equal(sampling.scale,1,'one isolated stall keeps the current resolution');
    for(let i=0;i<12;i++)tick(i%2===0?refresh:2*refresh);
    assert.ok(sampling.scale<1,'alternating missed refreshes lower the moving resolution');
    const reduced=sampling.scale;
    sampling.pause();
    tick(2000);
    assert.equal(sampling.scale,reduced,'a pause is excluded from motion timing');
    for(let i=0;i<90;i++)tick(1000/60);
    assert.equal(sampling.scale,1,'sustained headroom restores the moving resolution');
  }
});
