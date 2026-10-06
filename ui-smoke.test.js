/* Event-handler smoke checks with a minimal DOM adapter. Not a real browser or layout test. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
function loadUI(){
  const html=fs.readFileSync(path.join(__dirname,'../PANTRI_Milestone1.html'),'utf8');
  const nodes=new Map(),downloads=[],blobs=new Map();
  function attributes(text){
    const attrs={};for(const m of text.matchAll(/([\w-]+)="([^"]*)"/g))attrs[m[1]]=m[2];return attrs;
  }
  class Element{
    constructor(tag,attrs={}){this.tag=tag;this.attrs=attrs;this.listeners={};this.children=[];this.hidden=Object.hasOwn(attrs,'hidden');this.disabled=Object.hasOwn(attrs,'disabled');this.checked=false;this.dataset={};this.style={};this._html='';this.textContent='';this.value=attrs.value || '';for(const [key,value] of Object.entries(attrs))if(key.startsWith('data-'))this.dataset[key.slice(5)]=value;}
    get valueAsNumber(){return this.value.trim()===''?NaN:Number(this.value);}
    set innerHTML(text){this._html=text;this.children=[];for(const m of text.matchAll(/<(input|button)\b([^>]*)>/g)){const a=attributes(m[2]);if(/\bdisabled\b/.test(m[2]))a.disabled='';const child=new Element(m[1],a);this.children.push(child);if(a.id)nodes.set(a.id,child);}}
    get innerHTML(){return this._html;}
    addEventListener(type,handler){(this.listeners[type]??=[]).push(handler);}
    trigger(type){for(const handler of this.listeners[type]||[])handler({target:this});}
    click(){if(this.disabled)return;if(this.tag==='a'){downloads.push({name:this.download,blob:blobs.get(this.href)});return;}this.trigger('click');}
    setAttribute(name,value){this.attrs[name]=value;}
    querySelectorAll(tag){return this.children.filter(c=>c.tag===tag);}
    insertAdjacentHTML(position,text){this._html=text+this._html;}
    appendChild(){}
    remove(){}
  }
  const markup=html.split('<script>')[0];
  for(const m of markup.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/g)){const attrs=attributes(m[2]);if(attrs.id){if(/\bhidden\b/.test(m[2]))attrs.hidden='';nodes.set(attrs.id,new Element(m[1],attrs));}}
  const progress=new Element('div'),body=new Element('body');
  const document={getElementById(id){assert.ok(nodes.has(id),`UI referenced missing element ${id}`);return nodes.get(id);},querySelector(selector){assert.equal(selector,'[role=progressbar]');return progress;},createElement(tag){return new Element(tag);},body};
  let counter=0;
  const URL={createObjectURL(blob){const key='mock-blob-'+counter++;blobs.set(key,blob);return key;},revokeObjectURL(){}};
  const context=vm.createContext({document,Blob,URL,console,setTimeout:handler=>handler()});
  for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]).runInContext(context);
  const el=id=>nodes.get(id);
  return {el,downloads,ack(){el('ack').checked=true;el('ack').trigger('change');},next(){el('next').click();}};
}
test('Delivered HTML executes its actual UI handlers through all 22 actions and exports the edited order',async()=>{
  const ui=loadUI();
  assert.equal(ui.el('action-id').textContent,'UC.1.1');
  for(let i=1;i<=22;i++){
    assert.equal(ui.el('action-id').textContent,`UC.1.${i}`);
    if([9,12,22].includes(i)){assert.equal(ui.el('next').disabled,true);ui.next();assert.equal(ui.el('action-id').textContent,`UC.1.${i}`);ui.ack();}
    if(i===10){assert.equal(ui.el('qty-beef').disabled,false);ui.el('qty-beef').value='5';}
    ui.next();assert.equal(ui.el('error').hidden,true);
  }
  assert.equal(ui.el('complete').hidden,false);assert.equal(ui.el('progress-label').textContent,'22 / 22 actions executed');
  ui.el('export').click();assert.equal(ui.downloads[0].name,'PANTRI_UC1_run_evidence.json');
  const evidence=JSON.parse(await ui.downloads[0].blob.text());
  assert.equal(evidence.state.events.length,22);assert.equal(evidence.state.sentOrder.quantities.beef,5);assert.equal(evidence.state.supplierReceived.quantities.beef,5);assert.equal(evidence.state.presentedStatus.status,'CONFIRMED');
  ui.el('model-tab').click();assert.equal(ui.el('model-view').hidden,false);
  ui.el('back-to-run').click();assert.equal(ui.el('run-view').hidden,false);
  ui.el('reset').click();assert.equal(ui.el('action-id').textContent,'UC.1.1');assert.equal(ui.el('event-count').textContent,'0 events');
});
test('UI rejects blank quantity input and allows correction without advancing prematurely',()=>{
  const ui=loadUI();for(let i=1;i<=9;i++){if(i===9)ui.ack();ui.next();}
  ui.el('qty-beef').value='';ui.next();assert.equal(ui.el('error').hidden,false);assert.equal(ui.el('action-id').textContent,'UC.1.10');
  ui.el('qty-beef').value='5';ui.next();assert.equal(ui.el('error').hidden,true);assert.equal(ui.el('action-id').textContent,'UC.1.11');
});
