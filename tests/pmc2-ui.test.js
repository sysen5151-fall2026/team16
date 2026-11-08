'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function ui(){
 const html=fs.readFileSync(require('node:path').join(__dirname,'../PANTRI_PMC2.html'),'utf8'),nodes=new Map();
 for(const m of html.split('<script>')[0].matchAll(/id="([^"]+)"/g))nodes.set(m[1],{_value:'',get value(){return this._value;},set value(v){this._value=String(v);},checked:false,textContent:'',handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},click(){this.handlers.click();}});
 nodes.get('response').value='CONFIRMED';const downloads=[];
 const document={getElementById(id){assert(nodes.has(id),id);return nodes.get(id);},createElement(){return {click(){downloads.push(this.href);}};}};
 const blobs=[];const context=vm.createContext({document,Blob,URL:{createObjectURL(b){blobs.push(b);return 'blob:'+blobs.length;},revokeObjectURL(){}}});
 for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]).runInContext(context);
 return {get:id=>nodes.get(id),state:()=>JSON.parse(nodes.get('state').textContent),blobs,downloads};
}
test('PMC2 delivered UI calls actual purchase module from revision to confirmation and exports evidence',async()=>{
 const u=ui();assert.deepEqual(u.state().draft.quantities,{beef:4,tofu:6,mushrooms:1});
 u.get('transmit').click();assert.equal(u.state().order,null);assert.match(u.get('result').textContent,/rejected/);
 u.get('beef').value='5';u.get('revise').click();assert.equal(u.state().draft.version,2);assert.equal(u.state().approval,null);
 u.get('approve').click();assert.equal(u.state().approval,null);
 u.get('explicit').checked=true;u.get('approve').click();u.get('transmit').click();
 assert.deepEqual(u.state().order.lines.map(i=>i.quantity),[5,6,1]);
 assert.equal(u.state().order.state,'SENT_AWAITING_CONFIRMATION');u.get('respond').click();assert.equal(u.state().order.state,'CONFIRMED');
 assert(u.state().internalMessages.some(m=>m.flow==='P-IF.19'));assert(u.state().transactions.some(t=>t.event_type==='SUPPLIER_CONFIRMED'));
 u.get('export').click();const e=JSON.parse(await u.blobs[0].text());assert.equal(e.state.order.state,'CONFIRMED');assert.equal(e.attempts[0].outcome,'rejected');assert.equal(u.downloads.length,1);
});
test('PMC2 delivered UI rejects blank revisions and stale approval, then resets the isolated session',()=>{
 const u=ui();u.get('beef').value='';u.get('revise').click();assert.equal(u.state().draft.version,1);
 u.get('explicit').checked=true;u.get('approve').click();u.get('beef').value='7';u.get('revise').click();u.get('transmit').click();assert.equal(u.state().order,null);assert.equal(u.state().approval,null);
 u.get('reset').click();assert.equal(u.state().draft.version,1);assert.deepEqual(u.state().draft.quantities,{beef:4,tofu:6,mushrooms:1});assert.equal(u.get('explicit').checked,false);
});
