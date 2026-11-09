'use strict';
const {copy}=require('./bus');const F='P-F.0.5';
module.exports=ctx=>{const s=ctx.state;const handlers={};for(const flow of ['P-IF.06','P-IF.07','P-IF.08','P-IF.09','P-IF.11','P-IF.16'])handlers[flow]=p=>{ctx.scope(p);s.views[flow]=copy(p);};return {id:F,handlers,request(task){ctx.scope(task);return ctx.send('P-IF.04',F,'P-F.0.2',task);},view(flow){return copy(s.views[flow]??null);}};};
