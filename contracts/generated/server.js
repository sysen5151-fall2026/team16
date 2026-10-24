'use strict';
// GENERATED from contracts/api-v1.json; signature registration only.
const contract=require('../api-v1.json');
function registerServer(bus, recipient, handlers){for(const op of contract.operations.filter(x=>x.destinations.includes(recipient))){if(typeof handlers[op.flow]!== 'function')throw new Error('Missing handler '+op.flow+' for '+recipient);bus.register(recipient,op.flow,handlers[op.flow]);}}
module.exports={registerServer};
