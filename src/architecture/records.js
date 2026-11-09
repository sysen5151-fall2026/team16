'use strict';
const {copy,ContractError}=require('./bus');
const F='P-F.0.1';
module.exports=ctx=>{
  const store=ctx.state;
  const handlers={
    'P-IF.01':p=>{ctx.scope(p);ctx.send('P-IF.08',F,'P-F.0.5',{restaurant_id:p.restaurant_id,inventory:copy(store.records),recorded_dates:{},limitations:[]});},
    'P-IF.02':p=>{ctx.scope(p);ctx.send('P-IF.03',F,'P-F.0.2',{restaurant_id:p.restaurant_id,inventory:copy(store.records),usage_history:copy(store.usage),expiration_dates:store.records.map(x=>({id:x.id,expires:x.expires??null})),missing_fields:[],query_id:p.query_id});},
    'P-IF.16':p=>{ctx.scope(p);store.policies[F]=p;},
    'P-IF.18':p=>{ctx.scope(p);if(p.reconciliation_result?.valid!==true)throw new ContractError('DOMAIN_STATE','Recovery reconciliation failed');store.records=copy(p.records);store.transactions=copy(p.relationships);},
    'P-IF.19':p=>{ctx.scope(p);if(!store.transactions.some(x=>x.event_id===p.event_id))store.transactions.push(copy(p));ctx.send('P-IF.21',F,'P-F.0.3',{restaurant_id:p.restaurant_id,order_id:p.order_id,event_id:p.event_id,retained:true,errors:[]});},
    'P-IF.20':p=>{ctx.scope(p);if(!store.transactions.some(x=>x.event_id===p.event_id))store.transactions.push(copy(p));ctx.send('P-IF.22',F,'P-F.0.4',{restaurant_id:p.restaurant_id,request_id:p.request_id,event_id:p.event_id,retained:true,errors:[]});}
  };
  return {id:F,handlers,ingest(records){
    if(!Array.isArray(records))throw new ContractError('INVALID_PACKET','Records must be an array');
    const next=copy(store.records);const ids=new Set(next.map(x=>x.id));
    for(const r of records){if(!r.id||ids.has(r.id)||r.restaurant_id!==store.restaurant_id||r.unit!=='kg'||!Number.isFinite(r.quantity)||r.quantity<0)throw new ContractError('INVALID_PACKET','Invalid, duplicate or unrelated ingredient record');next.push(copy(r));ids.add(r.id);}
    store.records=next;return copy(next);
  },reconcile(id,quantity,reason){const r=store.records.find(x=>x.id===id);if(!r||!Number.isFinite(quantity)||quantity<0||!reason)throw new ContractError('DOMAIN_STATE','Invalid correction');store.corrections.push({id,prior:r.quantity,quantity,reason});r.quantity=quantity;}};
};
