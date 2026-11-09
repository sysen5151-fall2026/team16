'use strict';
const contract=require('../../contracts/api-v1.json');
const copy=x=>JSON.parse(JSON.stringify(x));
class ContractError extends Error {constructor(code,message,flow=null,restaurant_id=null){super(message);Object.assign(this,{code,flow,restaurant_id});}}
function validate(schema,value,path='packet'){
  const kinds=Array.isArray(schema.type)?schema.type:[schema.type];
  const kind=value===null?'null':Array.isArray(value)?'array':typeof value;
  if(!kinds.includes(kind))throw new ContractError('INVALID_PACKET',path+' must be '+kinds.join('/'));
  if(kind==='number'&&(!Number.isFinite(value)||(schema.minimum!==undefined&&value<schema.minimum)))throw new ContractError('INVALID_PACKET',path+' is out of range');
  if(kind==='string'&&schema.minLength&&value.length<schema.minLength)throw new ContractError('INVALID_PACKET',path+' is empty');
  if(kind==='object'){
    for(const k of schema.required||[])if(!Object.hasOwn(value,k))throw new ContractError('INVALID_PACKET',path+'.'+k+' is required');
    for(const k of Object.keys(value)){if(!schema.properties?.[k]){if(schema.additionalProperties===false)throw new ContractError('INVALID_PACKET','Unexpected '+path+'.'+k);}else validate(schema.properties[k],value[k],path+'.'+k);}
  }
}
class FlowBus {
  constructor(){this.handlers=new Map();this.events=[];}
  register(recipient,flow,handler){const k=recipient+'|'+flow;if(this.handlers.has(k))throw new Error('Duplicate handler '+k);this.handlers.set(k,handler);}
  send(flow,source,recipient,packet){
    const op=contract.operations.find(x=>x.flow===flow);
    if(!op||!op.sources.includes(source)||!op.destinations.includes(recipient))throw new ContractError('WRONG_ENDPOINT','Flow endpoint is outside the model',flow,packet?.restaurant_id??null);
    try{validate(op.request,packet);}catch(e){e.flow=flow;e.restaurant_id=packet?.restaurant_id??null;throw e;}
    const fn=this.handlers.get(recipient+'|'+flow);if(!fn)throw new ContractError('DOMAIN_STATE','No registered handler',flow,packet.restaurant_id);
    this.events.push({sequence:this.events.length+1,flow,source,recipient,packet:copy(packet)});
    fn(copy(packet));
    const ack={accepted:true,flow,recipient};validate(op.response,ack);return ack;
  }
}
module.exports={FlowBus,ContractError,copy,validate};
