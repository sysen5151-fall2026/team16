'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const load=require('./load-app.cjs');const c=load();
const plain=x=>JSON.parse(JSON.stringify(x));
function accepted(result){assert.equal(result.ok,true,result.message);return result.value;}
function revised(){return accepted(c.editDraft(c.createSeed(),'draft-001',1,[{ingredientId:'ing-001',managerQty:5}]));}
function approved(){return accepted(c.approveDraft(revised(),'draft-001',2,'approve-1'));}
function sent(){const s=approved();return accepted(c.sendApprovedOrder(s,s.orders[0].id,'send-1'));}
test('Original seed matches classroom inventory and purchasing data',()=>{const s=c.createSeed(),i=c.getIngredientSummary(s,'ing-001'),l=s.drafts[0].lines[0];assert.equal(i.onHand,8);assert.equal(i.usableStock,8);assert.equal(l.forecastQty,12);assert.equal(l.suggestedQty,4);assert.equal(s.ingredients.length,132);assert.equal(c.validateSaved(s),true);});
test('P-AFR.08 original revision is v2 and unapproved, no order created',()=>{const s=revised();assert.equal(s.drafts[0].version,2);assert.equal(s.drafts[0].status,'draft');assert.equal(s.drafts[0].lines[0].managerQty,5);assert.equal(s.orders.length,0);});
test('P-AFR.08 invalid negative quantity is rejected atomically',()=>{const s=c.createSeed(),before=plain(s);assert.equal(c.editDraft(s,'draft-001',1,[{ingredientId:'ing-001',managerQty:-1}]).ok,false);assert.deepEqual(plain(s),before);});
test('P-AFR.09 original stale approval is rejected',()=>assert.equal(c.approveDraft(revised(),'draft-001',1,'approve-stale').ok,false));
test('P-AFR.09 original approval retains v2, 5 kg and $72.50 estimate',()=>{const s=approved(),o=s.orders[0];assert.equal(o.approvedVersion,2);assert.equal(o.approvedLines[0].managerQty,5);assert.equal(o.approvedLines[0].unit,'kg');assert.equal(o.approvedLines[0].unitCostCents*o.approvedLines[0].managerQty,7250);assert.equal(o.sentAt,null);assert.equal(o.supplierStatus,'not_sent');});
test('P-AFR.10 no unapproved order can be sent',()=>assert.equal(c.sendApprovedOrder(c.createSeed(),'nonexistent','bad-send').ok,false));
test('P-AFR.10 original send preserves the approved snapshot and pending state',()=>{const a=approved(),s=accepted(c.sendApprovedOrder(a,a.orders[0].id,'send-1'));assert.deepEqual(plain(s.orders[0].approvedLines),plain(a.orders[0].approvedLines));assert.equal(s.orders[0].supplierStatus,'awaiting_confirmation');assert.equal(s.orders[0].fulfillmentStatus,'not_received');});
test('P-AFR.10 duplicate sends do not create a second order or sent event',()=>{const s=sent(),o=s.orders[0];const again=accepted(c.sendApprovedOrder(s,o.id,'different-retry'));assert.equal(again.orders.length,1);assert.equal(again.orders[0].events.filter(e=>e.kind==='sent').length,1);});
test('P-PCR.IO.01 approved/sent source draft cannot be edited',()=>{const s=sent();assert.equal(c.editDraft(s,'draft-001',2,[{ingredientId:'ing-001',managerQty:9}]).ok,false);assert.equal(s.orders[0].approvedLines[0].managerQty,5);});
test('P-AFR.11 original supplier events preserve quantities, receiving and stock',()=>{for(const kind of ['confirmed','partial','delayed','exception']){const s=sent(),o=s.orders[0];const after=accepted(c.recordSupplierEvent(s,{id:'response-'+kind,restaurantId:s.restaurantId,transactionId:o.id,kind,occurredAt:'2026-10-21T10:00:00',note:'Simulated supplier response'}));assert.equal(after.orders[0].supplierStatus,kind);assert.equal(after.orders[0].approvedLines[0].managerQty,5);assert.equal(after.orders[0].fulfillmentStatus,'not_received');assert.equal(c.getIngredientSummary(after,'ing-001').onHand,8);assert.equal(after.partnerEvents[0].simulated,true);}});
test('P-AFR.11 wrong restaurant/order and invalid time are rejected',()=>{for(const change of [{restaurantId:'WRONG'},{transactionId:'WRONG'},{occurredAt:'not-a-date'}]){const s=sent();const r=c.recordSupplierEvent(s,{id:'bad',restaurantId:s.restaurantId,transactionId:s.orders[0].id,kind:'confirmed',occurredAt:'2026-10-21T10:00:00',...change});assert.equal(r.ok,false);assert.equal(s.orders[0].supplierStatus,'awaiting_confirmation');}});
test('P-AFR.11 late older event does not overwrite latest supplier state',()=>{const s=sent(),o=s.orders[0];const newest=accepted(c.recordSupplierEvent(s,{id:'new',restaurantId:s.restaurantId,transactionId:o.id,kind:'delayed',occurredAt:'2026-10-21T12:00:00'}));const late=accepted(c.recordSupplierEvent(newest,{id:'old',restaurantId:s.restaurantId,transactionId:o.id,kind:'confirmed',occurredAt:'2026-10-21T11:00:00'}));assert.equal(late.orders[0].supplierStatus,'delayed');assert.equal(late.partnerEvents.length,2);});
test('Original service saves approvals and rehydrates actual local-storage state',()=>{let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};const service=c.createDemoService(storage);accepted(service.commit(s=>c.editDraft(s,'draft-001',1,[{ingredientId:'ing-001',managerQty:5}])));accepted(service.commit(s=>c.approveDraft(s,'draft-001',2,'approve-1')));const next=c.createDemoService(storage);assert.equal(next.getSnapshot().orders[0].approvedLines[0].managerQty,5);assert.equal(next.getSnapshot().orders[0].approvedVersion,2);});
test('Original storage failure does not publish an unpersisted approval',()=>{const storage={getItem:()=>null,setItem:()=>{throw Error('quota');}};const s=c.createDemoService(storage);assert.equal(s.commit(x=>c.approveDraft(x,'draft-001',1,'approve')).ok,false);assert.equal(s.getSnapshot().orders.length,0);});

test('Task 6 legacy migration preserves v2 approval in the prior verified checkpoint', () => {
  const previous = plain(approved());
  let raw = JSON.stringify(previous);
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const service = c.createDemoService(storage);
  const id = previous.orders[0].id;
  accepted(service.commit(state => c.sendApprovedOrder(state, id, 'task6-send')));
  const reloaded = c.createDemoService(storage);
  assert.deepEqual(JSON.parse(reloaded.getCheckpoint()), previous);
  assert.equal(reloaded.getSnapshot().orders[0].supplierStatus, 'awaiting_confirmation');
  assert.equal(reloaded.getSnapshot().orders[0].approvedVersion, 2);
});

test('Task 6 inconsistent saved approval is quarantined without resending or changing stock', () => {
  const good = plain(sent());
  const bad = plain(good);
  bad.orders[0].approvedLines[0].managerQty = 4;
  const raw = JSON.stringify({ format: 'pantri-checkpoint-v1', current: bad, checkpoint: good });
  let writes = 0;
  const service = c.createDemoService({ getItem: () => raw, setItem: () => { writes++; } });
  assert.match(service.getProblem(), /inconsistent/);
  assert.equal(service.getRaw(), raw);
  assert.deepEqual(JSON.parse(service.getCheckpoint()), good);
  assert.equal(service.commit(state => c.sendApprovedOrder(state, good.orders[0].id, 'task6-retry')).ok, false);
  assert.equal(service.getSnapshot().orders.length, 0);
  assert.equal(service.getSnapshot().partnerEvents.length, 0);
  assert.equal(c.getIngredientSummary(service.getSnapshot(), 'ing-001').onHand, 8);
  assert.equal(writes, 0);
});
