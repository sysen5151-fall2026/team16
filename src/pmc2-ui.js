'use strict';
// P-F.0.3: interactive product entry for UC.1 using the SAME module as Python tests.
const {createPreparedSession,manager,supplier}=require('./architecture/pmc2-session');
const el=id=>document.getElementById(id);
let session=createPreparedSession(),attempts=[];
function render(){
 const s=session.snapshot();
 el('summary').textContent=`Restaurant R1 | Draft v${s.draft.version} | ${s.approval?'Approved v'+s.approval.version:'Unapproved'} | ${s.order?.state||'Unsent'}`;
 for(const i of ['beef','tofu','mushrooms'])el(i).value=s.draft.quantities[i];
 el('state').textContent=JSON.stringify({draft:s.draft,approval:s.approval,order:s.order||null,transactions:s.transactions,internalMessages:session.bus.events,attempts},null,2);
}
function act(name,fn){
 try{fn();attempts.push({action:name,outcome:'accepted'});el('result').textContent=name+' accepted.';}
 catch(e){attempts.push({action:name,outcome:'rejected',code:e.code,message:e.message});el('result').textContent=name+' rejected: '+e.message;}
 render();
}
el('revise').addEventListener('click',()=>act('P-F.0.3.1 Revise',()=>{
 const q={};for(const i of ['beef','tofu','mushrooms']){if(el(i).value.trim()==='')throw Error('Quantity must be known');q[i]=Number(el(i).value);}session.revise(q,manager);el('explicit').checked=false;
}));
el('approve').addEventListener('click',()=>act('P-F.0.3.2 Approve',()=>session.approve(el('explicit').checked,manager)));
el('transmit').addEventListener('click',()=>act('P-F.0.3.3 Transmit',()=>session.transmit(manager)));
el('respond').addEventListener('click',()=>act('P-F.0.3.4 Record response',()=>{
 const s=session.snapshot();session.supplierResponse({restaurant_id:'R1',order_id:s.order?.id||'NONE',state:el('response').value,confirmation_reference:'SIM-C1',exceptions:el('response').value==='CONFIRMED'?[]:[el('response').value]},supplier);
}));
el('reset').addEventListener('click',()=>{session=createPreparedSession();attempts=[];el('explicit').checked=false;el('result').textContent='Prepared 4/6/1 kg draft restored.';render();});
el('export').addEventListener('click',()=>{const b=new Blob([JSON.stringify({state:session.snapshot(),events:session.bus.events,attempts,scope:'Prepared in-memory prototype; supplier is simulated; no physical delivery or production authentication.'},null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='PANTRI_PMC2_run.json';a.click();URL.revokeObjectURL(u);});
render();
