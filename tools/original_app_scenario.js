'use strict';
const c=require('./load_original_app')();
let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;}},service=c.createDemoService(storage);
const checkpoints={},rejections=[];
const snap=()=>{const s=service.getSnapshot();return {draft:s.drafts[0],orders:s.orders,stock:c.getIngredientSummary(s,'ing-001').onHand,partnerEvents:s.partnerEvents};};
function commit(fn){const r=service.commit(fn);if(!r.ok)throw Error(r.message);return r;}
function reject(name,fn){const before=JSON.stringify(service.getSnapshot());const r=service.commit(fn);rejections.push({name,ok:r.ok,unchanged:before===JSON.stringify(service.getSnapshot())});}
checkpoints.initial=snap();
reject('unapproved-send',s=>c.sendApprovedOrder(s,'no-order','bad'));
reject('negative-quantity',s=>c.editDraft(s,'draft-001',1,[{ingredientId:'ing-001',managerQty:-1}]));
commit(s=>c.editDraft(s,'draft-001',1,[{ingredientId:'ing-001',managerQty:5}]));checkpoints.revised=snap();
reject('stale-approval',s=>c.approveDraft(s,'draft-001',1,'stale'));
commit(s=>c.approveDraft(s,'draft-001',2,'approve'));checkpoints.approved=snap();const id=service.getSnapshot().orders[0].id;
commit(s=>c.sendApprovedOrder(s,id,'send'));commit(s=>c.sendApprovedOrder(s,id,'retry'));checkpoints.sent=snap();
reject('sent-edit',s=>c.editDraft(s,'draft-001',2,[{ingredientId:'ing-001',managerQty:9}]));
reject('wrong-restaurant',s=>c.recordSupplierEvent(s,{id:'wrong',restaurantId:'WRONG',transactionId:id,kind:'confirmed',occurredAt:'2026-10-21T10:00:00'}));
for(const [n,kind] of ['confirmed','partial','delayed','exception'].entries()){commit(s=>c.recordSupplierEvent(s,{id:'event-'+kind,restaurantId:s.restaurantId,transactionId:id,kind,occurredAt:'2026-10-21T1'+n+':00:00',note:'Simulated supplier response'}));checkpoints[kind]=snap();}
process.stdout.write(JSON.stringify({checkpoints,rejections,rehydrated:c.createDemoService(storage).getSnapshot().orders[0],scope:'Actual PANTRI_App.html core; prepared single-manager localStorage demo, not production IAM or physical receiving.'},null,2));
