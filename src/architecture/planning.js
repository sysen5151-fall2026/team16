'use strict';
const {copy,ContractError}=require('./bus');const F='P-F.0.2';
module.exports=ctx=>{
 const s=ctx.state;
 return {id:F,handlers:{
  'P-IF.04':p=>{ctx.scope(p);s.task=copy(p);ctx.send('P-IF.02',F,'P-F.0.1',{restaurant_id:p.restaurant_id,ingredient_scope:p.ingredient_scope,period:p.period,query_id:p.task_id});},
  'P-IF.03':p=>{ctx.scope(p);if(!s.task)throw new ContractError('DOMAIN_STATE','Planning request required');const days=s.task.period.days;if(!Number.isFinite(days)||days<=0)throw new ContractError('INVALID_PACKET','Positive planning period required');
   const demand={},stock={},quantities={};for(const ingredient of s.task.ingredient_scope){const usage=s.usage.filter(x=>x.ingredient===ingredient).map(x=>x.quantity);if(!usage.length)throw new ContractError('DOMAIN_STATE','Missing demand basis');demand[ingredient]=usage.reduce((a,b)=>a+b,0)/usage.length*days;stock[ingredient]=p.inventory.filter(x=>x.ingredient===ingredient&&x.expires&&x.expires>=s.today).reduce((a,b)=>a+b.quantity,0);quantities[ingredient]=Math.round(Math.max(0,demand[ingredient]-stock[ingredient])*100)/100;}
   s.advice={restaurant_id:p.restaurant_id,demand,usable_stock:stock,horizon:days,limitations:['Synthetic prepared records; deterministic mean usage forecast; unknown dates excluded from usable stock.'],proposed_quantities:quantities};ctx.send('P-IF.05',F,'P-F.0.3',s.advice);},
  'P-IF.16':p=>{ctx.scope(p);s.policies[F]=p;}
 },expiration(date,horizonDate){return date===null?'UNKNOWN':date<s.today?'EXPIRED':date<=horizonDate?'IN_HORIZON':'OUTSIDE_HORIZON';},
 metrics(wasteKg,covers,unavailable,opportunities){return {waste_per_100_covers:covers>0?wasteKg/covers*100:null,stockout_rate:opportunities>0?unavailable/opportunities*100:null};}};
};
