/**
 * P-F.0.3 Coordinate Approved Ingredient Orders (PA.3).
 * P-F.0.3.1 / PA.3.1: revise(quantities) consumes draft state and kg revisions;
 *   version increments, approval resets, P-IF.06 publishes reviewable output.
 * P-F.0.3.2 / PA.3.2: approve(explicit, actor) binds current draft/version;
 *   emits P-IF.19; P-IF.21 acknowledges in-memory retention.
 * P-F.0.3.3 / PA.3.3: transmit() requires current retained approval;
 *   returns unchanged approved lines and records transmission.
 * P-F.0.3.4 / PA.3.4: response(packet) associates supplier evidence with order;
 *   emits P-IF.07 status, preserving approved lines.
 * ICOM signature: factory(ctx) injects mechanism dependencies: state, scope,
 *   send. Public actor controls are enforced by index.js before these methods.
 * P-IF.05/14/16/21/23 handlers receive advice, disposition, constraints,
 *   retention and query inputs. This prototype stores state in memory.
 * PC-IF.01-03 are design-level internal contracts; durable retention and a
 *   dispatch gateway are not claimed implemented by this module.
 */
'use strict';
const {copy,ContractError}=require('./bus');const F='P-F.0.3';
module.exports=ctx=>{
 const s=ctx.state;const lines=()=>Object.entries(s.draft.quantities).map(([ingredient_id,quantity])=>({ingredient_id,quantity,unit:'kg'}));
 const present=()=>ctx.send('P-IF.06',F,'P-F.0.5',{restaurant_id:s.restaurant_id,draft_id:s.draft.id,version:s.draft.version,lines:lines(),limitations:s.advice?.limitations||[],approval_state:s.approval?'APPROVED':'UNAPPROVED'});
 const retain=(type,payload)=>ctx.send('P-IF.19',F,'P-F.0.1',{restaurant_id:s.restaurant_id,order_id:s.draft.id,version:s.draft.version,event_id:s.draft.id+':'+s.draft.version+':'+type,event_type:type,payload,approval_reference:s.approval?.id||'UNAPPROVED'});
 const status=()=>ctx.send('P-IF.07',F,'P-F.0.5',{restaurant_id:s.restaurant_id,order_id:s.draft.id,state:s.order?.state||'UNSENT',confirmation_reference:s.order?.confirmation_reference||'NONE',delivery_information:s.order?.delivery_information||null,exceptions:s.order?.exceptions||[]});
 return {id:F,handlers:{
  'P-IF.05':p=>{ctx.scope(p);s.advice=copy(p);s.draft={id:'PO-DEMO-1',version:1,quantities:copy(p.proposed_quantities)};s.approval=null;present();},
  'P-IF.14':p=>{ctx.scope(p);s.supplyDisposition=copy(p);},
  'P-IF.16':p=>{ctx.scope(p);s.policies[F]=p;},
  'P-IF.21':p=>{ctx.scope(p);if(!p.retained)throw new ContractError('NOT_RETAINED','Order record not retained');s.retention[p.event_id]=true;},
  'P-IF.23':p=>{ctx.scope(p);if(p.order_id!==s.draft?.id)throw new ContractError('DOMAIN_STATE','Unknown order');status();}
 },revise(quantities){if(s.order)throw new ContractError('DOMAIN_STATE','Sent order version is immutable');if(!s.draft||!quantities||Object.keys(quantities).sort().join()!==Object.keys(s.draft.quantities).sort().join()||Object.values(quantities).some(q=>!Number.isFinite(q)||q<0))throw new ContractError('INVALID_PACKET','Invalid revised quantities');s.draft.quantities=copy(quantities);s.draft.version++;s.approval=null;present();},
 approve(explicit,actor){if(explicit!==true||!s.draft)throw new ContractError('UNAUTHORIZED','Explicit approval required');s.approval={id:'APP-'+s.draft.version,restaurant_id:s.restaurant_id,version:s.draft.version,actor:actor.user,quantities:copy(s.draft.quantities)};retain('APPROVAL',copy(s.approval));},
 transmit(){if(!s.approval||s.approval.version!==s.draft.version||JSON.stringify(s.approval.quantities)!==JSON.stringify(s.draft.quantities)||s.approval.restaurant_id!==s.restaurant_id||!s.retention[s.draft.id+':'+s.draft.version+':APPROVAL'])throw new ContractError('UNAUTHORIZED','Current retained approval required');if(s.order){if(s.order.version!==s.draft.version)throw new ContractError('DOMAIN_STATE','Sent order version is immutable');return copy(s.order);}s.order={id:s.draft.id,restaurant_id:s.restaurant_id,version:s.draft.version,lines:lines(),approval_reference:s.approval.id,state:'SENT_AWAITING_CONFIRMATION'};retain('TRANSMISSION',copy(s.order));return copy(s.order);},
 response(p){if(!s.order||p.restaurant_id!==s.restaurant_id||p.order_id!==s.order.id||!['CONFIRMED','PARTIAL','DELAYED','EXCEPTION'].includes(p.state))throw new ContractError('DOMAIN_STATE','Invalid supplier association or state');if(p.state==='CONFIRMED'&&!p.confirmation_reference)throw new ContractError('DOMAIN_STATE','Confirmation reference required');const allowed=['restaurant_id','order_id','state','confirmation_reference','delivery_information','exceptions'];if(Object.keys(p).some(k=>!allowed.includes(k)))throw new ContractError('INVALID_PACKET','Supplier response cannot alter approved order fields');Object.assign(s.order,copy(p));retain('SUPPLIER_'+p.state,copy(p));status();return copy(s.order);}
 };
};
