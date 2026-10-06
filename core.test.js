const test = require('node:test');
const assert = require('node:assert/strict');
const {Skeleton, ACTIONS, FIXTURE} = require('../src/core.js');
const quantities = {beef:5,tofu:6,mushrooms:1};
function inputFor(id) {
  if(id==='UC.1.10') return {quantities};
  if(id==='UC.1.12') return {approved:true};
  if(['UC.1.9','UC.1.22'].includes(id)) return {reviewed:true};
  return {};
}
function advance(engine, through) {
  while(engine.snapshot().step < through) {
    const a=engine.nextAction(); engine.execute(a.id,inputFor(a.id));
  }
  return engine.snapshot();
}
test('Baseline end-to-end path preserves revised quantities through approval, transmission, receipt and status review',()=>{
  const e=new Skeleton(),s=advance(e,22);
  assert.equal(s.events.length,22);
  assert.deepEqual(s.events.map(x=>x.id),ACTIONS.map(x=>x.id));
  for(const value of [s.draft,s.managerDecision.quantities,s.approval.quantities,s.officialOrder.quantities,s.sentOrder.quantities,s.supplierReceived.quantities,s.recordedConfirmation.quantities,s.presentedStatus.quantities]) assert.deepEqual(value,quantities);
  assert.equal(s.status,'CONFIRMED');
  assert.equal(s.presentedStatus.confirmationId,'DEMO-CONF-001');
  assert.equal(e.nextAction(),null);
});
test('An out-of-order send, skipped supplier, or duplicate action is blocked without changing the run',()=>{
  const e=new Skeleton();advance(e,8);
  const before=e.snapshot();assert.throws(()=>e.execute('UC.1.15'),/Out-of-order/);assert.deepEqual(e.snapshot(),before);
  advance(e,15);const sent=e.snapshot();assert.throws(()=>e.execute('UC.1.19'),/Out-of-order/);assert.deepEqual(e.snapshot(),sent);
  e.execute('UC.1.16');assert.throws(()=>e.execute('UC.1.16'),/Out-of-order/);
});
test('Unchecked or missing explicit approval cannot commit a purchase',()=>{
  const e=new Skeleton();advance(e,11);const before=e.snapshot();
  for(const input of [{},{approved:false},{approved:'true'}]) {
    assert.throws(()=>e.execute('UC.1.12',input),/Explicit manager approval/);assert.deepEqual(e.snapshot(),before);
  }
  assert.equal(e.snapshot().sentOrder,null);
});
test('Review acknowledgments are required before adjustment and completion',()=>{
  const e=new Skeleton();advance(e,8);assert.throws(()=>e.execute('UC.1.9'),/acknowledge/);
  advance(e,21);assert.throws(()=>e.execute('UC.1.22',{reviewed:false}),/acknowledge/);assert.equal(e.snapshot().step,21);
});
test('Invalid or empty order edits fail atomically, allowing a subsequent valid edit',()=>{
  const e=new Skeleton();advance(e,9);const before=e.snapshot();
  for(const q of [{beef:-1,tofu:6,mushrooms:1},{beef:NaN,tofu:6,mushrooms:1},{beef:Infinity,tofu:6,mushrooms:1},{beef:5.001,tofu:6,mushrooms:1},{beef:100001,tofu:6,mushrooms:1},{beef:0,tofu:0,mushrooms:0},{beef:5,tofu:6},{...quantities,extra:1}]) {
    assert.throws(()=>e.execute('UC.1.10',{quantities:q}));assert.deepEqual(e.snapshot(),before);
  }
  e.execute('UC.1.10',{quantities});assert.deepEqual(e.snapshot().revised,quantities);
});
test('Mutating returned snapshots cannot alter approval or transmitted quantities',()=>{
  const e=new Skeleton();advance(e,14);const external=e.snapshot();
  external.approval.quantities.beef=999;external.officialOrder.quantities.beef=888;
  e.execute('UC.1.15');assert.deepEqual(e.snapshot().sentOrder.quantities,quantities);
});
test('Recommendation exposes assumptions and distinguishes recorded stock from expired or unknown stock',()=>{
  const e=new Skeleton();const s=advance(e,8);
  const beef=s.recommendation.find(x=>x.id==='beef'),tofu=s.recommendation.find(x=>x.id==='tofu');
  assert.equal(beef.recordedKg,10);assert.equal(beef.usableKg,8);assert.equal(beef.expectedDemandKg,12);assert.equal(beef.recommendedKg,4);
  assert.equal(tofu.recordedKg,5.5);assert.equal(tofu.usableKg,4);assert.equal(tofu.recommendedKg,6);
  assert.ok(tofu.warnings.some(x=>x.includes('unknown')));
  assert.equal(tofu.horizonDays,2);
  assert.ok(s.events.find(x=>x.id==='UC.1.7').payload.limitations.some(x=>x.includes('synthetic')));
});
test('An expiration date equal to the scenario date is included by the explicitly defined demo rule',()=>{
  const f=JSON.parse(JSON.stringify(FIXTURE));f.ingredients[0].batches[0].expires=f.scenarioDate;
  const e=new Skeleton(f);advance(e,8);assert.equal(e.snapshot().recommendation[0].usableKg,8);
});
test('PANTRI remains awaiting confirmation until supplier receipt and confirmation are recorded',()=>{
  const e=new Skeleton();advance(e,15);assert.equal(e.snapshot().status,'SENT_AWAITING_CONFIRMATION');
  advance(e,18);assert.equal(e.snapshot().recordedConfirmation,null);assert.equal(e.snapshot().status,'SENT_AWAITING_CONFIRMATION');
  advance(e,19);assert.ok(e.snapshot().recordedConfirmation);assert.equal(e.snapshot().status,'SENT_AWAITING_CONFIRMATION');
  advance(e,20);assert.equal(e.snapshot().status,'CONFIRMED');assert.equal(e.snapshot().presentedStatus,null);
  advance(e,21);assert.equal(e.snapshot().presentedStatus.status,'CONFIRMED');
});
test('Independent sessions and exported evidence retain the scope and simulation disclosures',()=>{
  const a=new Skeleton(),b=new Skeleton();advance(a,22);
  assert.equal(b.snapshot().step,0);
  const ev=a.evidence();assert.equal(ev.useCase,'UC.1');assert.match(ev.dataMode,/Synthetic/);
  ev.state.sentOrder.quantities.beef=44;assert.equal(a.snapshot().sentOrder.quantities.beef,5);
  assert.ok(ev.limitations.some(x=>x.includes('authentication')));
});
