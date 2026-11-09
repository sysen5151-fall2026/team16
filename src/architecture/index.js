'use strict';
const {FlowBus,ContractError,copy}=require('./bus');const {registerServer}=require('../../contracts/generated/server');
const factories=['records','planning','orders','recovery','presentation','governance'].map(n=>require('./'+n));
function createArchitecture({restaurant_id='R1',today='2026-10-06',usage=[]}={}){
 const state={restaurant_id,today,records:[],usage:copy(usage),corrections:[],transactions:[],retention:{},policies:{},views:{},observations:[]};const bus=new FlowBus();const ctx={state,scope:p=>{if(p.restaurant_id!==restaurant_id)throw new ContractError('OUT_OF_SCOPE','Restaurant scope mismatch',null,p.restaurant_id);},send:(...args)=>bus.send(...args)};
 const [records,planning,orders,recovery,presentation,governance]=factories.map(f=>f(ctx));for(const service of [records,planning,orders,recovery,presentation,governance])registerServer(bus,service.id,service.handlers);
 const gate=(actor,role)=>{if(!actor||actor.restaurant_id!==restaurant_id||actor.role!==role||!actor.user)throw new ContractError('UNAUTHORIZED','Prepared actor role and scope do not authorize this task');};
 return {bus,records,planning,orders,recovery,presentation,governance,snapshot:()=>copy(state),request:(p,a)=>{gate(a,'manager');return presentation.request(p);},ingest:(p,a)=>{gate(a,'staff');return records.ingest(p);},revise:(p,a)=>{gate(a,'manager');return orders.revise(p);},approve:(p,a)=>{gate(a,'manager');return orders.approve(p,a);},transmit:a=>{gate(a,'manager');return orders.transmit();},supplierResponse:(p,a)=>{gate(a,'supplier');return orders.response(p);},recoveryRequest:(p,a)=>{gate(a,'support');return recovery.request(p);},restore:(p,a)=>{gate(a,'support');return governance.restore(p);},handover:a=>{gate(a,'support');return governance.handover();}};
}
module.exports={createArchitecture};
