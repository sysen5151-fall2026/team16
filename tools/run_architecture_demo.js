'use strict';
const {createArchitecture}=require('../src/architecture');
const actor=role=>({restaurant_id:'R1',role,user:'prepared-'+role});
const usage=[5,6,7].map(quantity=>({ingredient:'beef',quantity})).concat([4,5,6].map(quantity=>({ingredient:'tofu',quantity})),[3,3,3].map(quantity=>({ingredient:'mushrooms',quantity})));
const x=createArchitecture({usage});x.ingest([{id:'B1',restaurant_id:'R1',ingredient:'beef',quantity:8,unit:'kg',expires:'2026-10-08'},{id:'T1',restaurant_id:'R1',ingredient:'tofu',quantity:4,unit:'kg',expires:'2026-10-07'},{id:'M1',restaurant_id:'R1',ingredient:'mushrooms',quantity:5,unit:'kg',expires:'2026-10-10'}],actor('staff'));
x.request({restaurant_id:'R1',ingredient_scope:['beef','tofu','mushrooms'],period:{days:2},task_id:'DEMO-TASK',requested_analysis:'purchase'},actor('manager'));
x.revise({beef:5,tofu:6,mushrooms:1},actor('manager'));x.approve(true,actor('manager'));const sent=x.transmit(actor('manager'));x.supplierResponse({restaurant_id:'R1',order_id:sent.id,state:'CONFIRMED',confirmation_reference:'PREPARED-SUPPLIER-CONFIRMATION'},actor('supplier'));
process.stdout.write(JSON.stringify({scope:'Prepared in-process architecture demonstration; synthetic records and supplier response; no production authentication or external API',approved:x.snapshot().approval,sent,presented:x.presentation.view('P-IF.07'),internal_events:x.bus.events},null,2)+'\n');
