"use strict";
// Python's requirement tests call the actual architecture, not a replacement model.
const {createArchitecture}=require('../src/architecture');
const manager={restaurant_id:'R1',role:'manager',user:'demo-manager'};
const staff={...manager,role:'staff'},supplier={...manager,role:'supplier'};
const x=createArchitecture({usage:[{ingredient:'beef',quantity:6}]});
x.ingest([{id:'B1',restaurant_id:'R1',ingredient:'beef',quantity:8,unit:'kg',expires:'2026-10-08'}],staff);
x.request({restaurant_id:'R1',ingredient_scope:['beef'],period:{days:2},task_id:'PMC2',requested_analysis:'purchase'},manager);
let checkpoints={initial:x.snapshot()};
let errors=[];
function reject(name,action){const before=x.snapshot();let caught=null;try{action();}catch(e){caught={code:e.code,message:e.message};}errors.push({name,error:caught,unchanged:JSON.stringify(before)===JSON.stringify(x.snapshot())});}
reject('unapproved',()=>x.transmit(manager));
reject('false-approval',()=>x.approve(false,manager));
reject('staff-approval',()=>x.approve(true,staff));
reject('wrong-restaurant',()=>x.revise({beef:5},{...manager,restaurant_id:'R2'}));
reject('invalid-quantity',()=>x.revise({beef:-1},manager));
x.approve(true,manager);checkpoints.oldApproval=x.snapshot();
x.revise({beef:5},manager);checkpoints.revised=x.snapshot();
reject('stale-approval',()=>x.transmit(manager));
x.approve(true,manager);checkpoints.approved=x.snapshot();
const sent=x.transmit(manager);x.transmit(manager);checkpoints.sent=x.snapshot();
reject('wrong-order-response',()=>x.supplierResponse({restaurant_id:'R1',order_id:'WRONG',state:'CONFIRMED',confirmation_reference:'C1'},supplier));
reject('overwrite-lines',()=>x.supplierResponse({restaurant_id:'R1',order_id:sent.id,state:'CONFIRMED',confirmation_reference:'C1',lines:[]},supplier));
reject('missing-confirmation',()=>x.supplierResponse({restaurant_id:'R1',order_id:sent.id,state:'CONFIRMED'},supplier));
x.supplierResponse({restaurant_id:'R1',order_id:sent.id,state:'CONFIRMED',confirmation_reference:'C1',delivery_information:{note:'simulated confirmation; no physical delivery'}},supplier);
checkpoints.confirmed=x.snapshot();
process.stdout.write(JSON.stringify({checkpoints,errors,events:x.bus.events,scope:'In-memory prototype. Not durable storage or physical fulfillment.'},null,2));
