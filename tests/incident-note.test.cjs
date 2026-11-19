const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {JSDOM}=require('jsdom');

test('IncidentMesh case note preserves the recorded revisions, action boundary and prototype scope',()=>{
 const bytes=fs.readFileSync('tests/fixtures/incidentmesh/stale-plan-ablation.json');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'b117ee3b6e9504cbfe7e28820ec1a336cec7e2548deac6d5342c79ec7c270d4e');
 const evidence=JSON.parse(bytes), dom=new JSDOM(fs.readFileSync('site/index.html','utf8')), d=dom.window.document;
 const note=d.querySelector('details.incident-note');
 assert.ok(note);assert.equal(note.open,false);assert.equal(d.querySelectorAll('.catalogue-list > li').length,31);
 for(const name of ['concurrent','sequential']){
  const lane=note.querySelector(`[data-incident-arm="${name}"]`), arm=evidence[name];
  assert.equal(Number(lane.querySelector('[data-revision="plan"]').textContent.trim()),arm.firstPlanningRevision);
  assert.equal(Number(lane.querySelector('[data-revision="boundary"]').textContent.trim()),arm.boundaryRevision);
  assert.equal(lane.dataset.policyReason,arm.policyReason);assert.equal(lane.dataset.action,arm.executedAction);
  assert.equal(lane.querySelector("code").textContent.trim(),arm.executedAction);
  assert.equal(arm.rollbackAuthorizedByFinalStrictGate,false);
 }
 assert.deepEqual(evidence.concurrent.finalHypotheses,evidence.sequential.finalHypotheses);
 const replan=evidence.concurrent.freshReplan;
 assert.equal(replan.basedOnRevision,3);assert.equal(replan.boundaryRevision,3);
 assert.equal(replan.policyReason,'conflicting-evidence');
 assert.match(note.querySelector('[data-incident-replan]').textContent,/conflict/i);
 assert.match(note.textContent,/proposal.only/i);assert.match(note.textContent,/no production changes/i);
 assert.match(note.textContent,/deterministic/i);assert.match(note.textContent,/frozen/i);
 assert.ok([...note.querySelectorAll('a')].some(a=>a.href.includes('7bb27809e5a5278963a7186ebe3604246cbfbc9f/docs/evidence/stale-plan-ablation')));
 dom.window.close();
});
