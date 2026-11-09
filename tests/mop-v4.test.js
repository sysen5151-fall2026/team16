
'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {createArchitecture}=require('../src/architecture');
const staff={restaurant_id:'R1',role:'staff',user:'prepared-staff'};
test('P-AFR.01 prepared receipt usage waste manifest preserves all 24 fields',()=>{
 const x=createArchitecture();
 const rows=['RECEIPT','USAGE','WASTE'].map((kind,i)=>({id:'EV'+i,restaurant_id:'R1',ingredient:'tofu',quantity:[2,0.5,0.25][i],unit:'kg',occurrence_time:'2026-10-25T04:00:00Z',event_type:kind,expires:null}));
 const before=JSON.parse(JSON.stringify(rows));x.ingest(rows,staff);rows[0].quantity=999;
 const retained=x.snapshot().records;let correct=0,total=0;
 for(let i=0;i<before.length;i++)for(const key of Object.keys(before[i])){total++;assert.deepEqual(retained[i][key],before[i][key],key);correct++;}
 assert.equal(total,24);assert.equal(correct/total,1);assert.equal(retained[0].expires,null);
});
test('P-AFR.07 fractional outputs have declared units and numerical tolerance',()=>{
 const p=createArchitecture().planning;const r=p.metrics(1,3,1,3);
 for(const v of [r.waste_per_100_covers,r.stockout_rate])assert(Math.abs(v-33.333333333333336)<=Math.max(1e-9,1e-9*33.333333333333336));
 assert.deepEqual(p.metrics(0.125,25,1,8),{waste_per_100_covers:0.5,stockout_rate:12.5});
});
test('P-AFR.07 missing and zero denominators remain not calculable',()=>{
 const p=createArchitecture().planning;
 for(const [a,b]of [[0,0],[undefined,undefined],[null,null]])assert.deepEqual(p.metrics(1,a,1,b),{waste_per_100_covers:null,stockout_rate:null});
});
