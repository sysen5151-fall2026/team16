'use strict';
/** P-F.0.3 original product test adapter.
 * Loads the exact business layer embedded in PANTRI_App.html; does not rewrite it.
 * P-F.0.3.1: editDraft(state, id, version, edits) -> unapproved version.
 * P-F.0.3.2: approveDraft(state, id, version, operationId) -> retained snapshot.
 * P-F.0.3.3: sendApprovedOrder(state, id, operationId) -> awaiting confirmation.
 * P-F.0.3.4: recordSupplierEvent(state, event) -> associated supplier state.
 * Inputs include restaurant-scoped state and typed commands. Controls are draft
 * status/current version, approved snapshot, order scope, event kind and time.
 * Mechanism is PA.3 logical software responsibility in this embedded core.
 * The UI supplies the explicit manager approval action; no production IAM claim.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function loadOriginal(){
 const html=fs.readFileSync(path.join(__dirname,'../PANTRI_App.html'),'utf8');
 const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
 if(!script)throw Error('Original module script not found');
 const marker='function captureInputs(';const boundary=script[1].indexOf(marker);
 if(boundary<0)throw Error('Business/UI boundary changed; audit extraction before testing');
 const context=vm.createContext({structuredClone});
 new vm.Script(script[1].slice(0,boundary)+'\nglobalThis.core={createSeed,editDraft,approveDraft,sendApprovedOrder,recordSupplierEvent,getIngredientSummary,createDemoService,validateSaved,applyInventoryCommand};').runInContext(context);
 return context.core;
};
