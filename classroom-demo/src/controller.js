const root=document.getElementById('app');
const service=createDemoService({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)});
const ui = {
  page: 'overview', lastPage: null, pageNumber: 1, pageSize: 12, filter: {},
  purchaseTab: 'drafts', orderFilter: 'all',
  wasteTab: 'waste', wastePeriod: 'all', wasteIngredient: '', wastePage: 1,
  reportPeriod: 'week', periodChanged: false, healthRisk: '', chartDate: '', overlay: null, lastOverlay: null, error: '',
  dirty: false, discard: false, notice: null, animateCharts: false, chartsPlayed: false,
  committing: false,
};
let toastTimer;
const operation=()=>crypto.randomUUID?.()??`op-${Date.now()}-${Math.random()}`;
function toast(message,error=false){ui.notice={message,error};renderToast();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{ui.notice=null;renderToast()},3000);}
function renderToast(){const el=document.getElementById('toast-region');if(el)el.innerHTML=ui.notice?`<div class="toast ${ui.notice.error?'error':''}" role="${ui.notice.error?'alert':'status'}">${icon(ui.notice.error?'alert':'check')}<span>${esc(ui.notice.message)}</span></div>`:'';}
function snapshotForm(){const form=root.querySelector('[role="dialog"] form');if(form&&ui.overlay)ui.overlay.values=captureInputs(form.elements);}
function focusDialog(hint) {
  const overlay = ui.overlay;
  requestAnimationFrame(() => {
    if (ui.overlay !== overlay) return;
    const dialog = root.querySelector('[role="dialog"]');
    const fields = dialog?.querySelector('input:not([type="hidden"]), select, textarea');
    (matchFocusTarget(dialogControls(dialog), hint) ?? fields ?? dialog?.querySelector('button') ?? dialog)
      ?.focus({ preventScroll: true });
  });
}

function openOverlay(overlay, back = null) {
  const returnFocus = focusHint(focusedControl());
  const pageFocus = ui.overlay?.pageFocus ?? returnFocus;
  ui.overlay = { ...overlay, operationId: operation(), returnFocus, pageFocus, back };
  ui.error = '';
  ui.dirty = false;
  ui.discard = false;
  render();
  focusDialog();
}

function closeOverlay(force = false) {
  const closing = ui.overlay;
  if (!closing) return;
  if (ui.dirty && !force) {
    snapshotForm();
    closing.editFocus = focusHint(focusedControl());
    ui.discard = true;
    render();
    requestAnimationFrame(() => {
      if (ui.discard && ui.overlay === closing) root.querySelector('[data-action="keep-editing"]')?.focus();
    });
    return;
  }
  ui.overlay = closing.back;
  ui.error = '';
  ui.dirty = false;
  ui.discard = false;
  render();
  if (closing.back) {
    focusDialog(closing.returnFocus);
  } else {
    requestAnimationFrame(() => {
      if (ui.overlay) return;
      (matchFocusTarget(dialogControls(root.querySelector('.app-shell')), closing.pageFocus)
        ?? root.querySelector('.nav-item.active'))?.focus({ preventScroll: true });
    });
  }
}
function navigate(page, filter) {
  const go = () => {
    ui.page = page; ui.overlay = null; ui.error = ''; ui.dirty = false; ui.discard = false;
    if (page === 'inventory') { ui.filter = filter ?? {}; ui.pageNumber = 1; }
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  // While the old page is still dissolving, a new choice simply replaces the destination.
  if (ui.leaving) { ui.leaving = go; movePillTo(page); return; }
  if (page === ui.page || ui.overlay || prefersReducedMotion()) { go(); return; }
  ui.leaving = go;
  movePillTo(page);
  leavePage(() => { const next = ui.leaving; ui.leaving = null; next?.(); });
}
function commit(work, message) {
  ui.committing = true;
  let result;
  try {
    result = service.commit(work);
  } finally {
    ui.committing = false;
  }
  if (!result.ok) {
    snapshotForm();
    ui.error = result.message;
    if (ui.overlay) render();
    else toast(result.message, true);
    return null;
  }

  ui.dirty = false;
  ui.error = '';
  if (ui.overlay) ui.overlay.values = undefined;
  render();
  if (message) toast(message);
  return result.value;
}
function download(text,name,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
root.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;const action=el.dataset.action,id=el.dataset.id;if(action==='backdrop'){if(e.target===el)closeOverlay();return;}e.preventDefault();const s=service.getSnapshot();
if(handleClassroomAction(action,el))return;
if(['overview','inventory','purchasing','waste','reports'].includes(action)){navigate(action);return;}if(action==='filter'){navigate('inventory',{risk:el.dataset.risk});return;}if(action==='category'){navigate('inventory',{category:el.dataset.category});return;}if(action==='clear-filters'){ui.filter={};ui.pageNumber=1;render();return;}if(action==='prev'||action==='next'){ui.pageNumber+=action==='next'?1:-1;render();return;}if(action==='purchase-tab'){ui.purchaseTab=el.dataset.tab;render();return;}if(action==='waste-tab'){ui.wasteTab=el.dataset.tab;render();return;}if(action==='ingredient'){openOverlay({type:'ingredient',id,page:1},ui.overlay?.type==='history'?ui.overlay:null);return;}if(action==='record'){openOverlay({type:'record',kind:el.dataset.kind,ingredientId:el.dataset.ingredient??'ing-001'},ui.overlay?.type==='ingredient'?ui.overlay:null);return;}if(action==='draft'){openOverlay({type:'draft',id});return;}if(action==='order'){openOverlay({type:'order',id},ui.overlay?.type==='history'?ui.overlay:null);return;}if(action==='recovery'){openOverlay({type:'recovery',id},ui.overlay?.type==='history'?ui.overlay:null);return;}if(action==='new-recovery'){openOverlay({type:'new-recovery'});return;}if(action==='close-overlay'){closeOverlay();return;}if(action==='keep-editing'){ui.discard=false;render();focusDialog(ui.overlay.editFocus);return;}if(action==='discard'){closeOverlay(true);return;}if(action==='review-approval'){if(ui.dirty){ui.error='Save your quantity changes before reviewing approval.';snapshotForm();render();return;}openOverlay({type:'approval',id},ui.overlay);return;}if(action==='back-draft'){closeOverlay(true);return;}if(action==='approve-send'){const approved=commit(x=>approveDraft(x,id,Number(el.dataset.version),ui.overlay.operationId));if(approved){const order=approved.orders.find(o=>o.sourceDraftId===id);const sent=commit(x=>sendApprovedOrder(x,order.id,`send-${order.id}`));ui.purchaseTab='orders';ui.page='purchasing';openOverlay({type:'order',id:order.id});toast(sent?'Purchase approved and sent to simulated supplier.':'Order approved. Sending needs to be retried.',!sent);}return;}if(action==='send-order'){if(commit(x=>sendApprovedOrder(x,id,`send-${id}`),'Approved order sent to simulated supplier.'))render();return;}if(action==='receive-order'){const x=s.orders.find(o=>o.id===id),line=x.approvedLines.find(l=>l.managerQty>(x.receivedQuantities[l.ingredientId]??0));if(line)openOverlay({type:'record',kind:'receipt',ingredientId:line.ingredientId,orderId:id},ui.overlay);return;}if(action==='new-draft-from-order'){const next=commit(x=>createDraftFromOrder(x,id,ui.overlay.operationId+'-followup'));if(next){ui.page='purchasing';ui.purchaseTab='drafts';openOverlay({type:'draft',id:next.drafts.at(-1).id});toast('New draft created from current inventory. The approved order is unchanged.');}return;}if(action==='refresh-draft'){if(ui.dirty){ui.error='Save or discard quantity changes before recalculating.';snapshotForm();render();return;}const d=s.drafts.find(d=>d.id===id);commit(x=>refreshDraft(x,id,d.version),'Recommendation refreshed from current inventory.');return;}if(action==='refresh-drafts'){let latest=s;for(const d of s.drafts.filter(d=>d.status==='draft')){const next=commit(x=>refreshDraft(x,d.id,d.version));if(!next)return;latest=next;}toast('Draft recommendations refreshed from current inventory.');return;}if(action==='collect'){if(commit(x=>recordCollection(x,id,`collect-${id}`),'Collection recorded. Inventory updated once.'))render();return;}if(action==='cancel-recovery'){if(commit(x=>cancelRecovery(x,id,`cancel-${id}`),'Request cancelled and reservation released.'))render();return;}if(action==='confirm-cancel'){if(commit(x=>cancelRecovery(x,id,`cancel-${id}`),'Request cancelled and reservation released.')){openOverlay({type:'recovery',id});}return;}if(action==='demo'){openOverlay({type:'demo'});return;}if(action==='reset'){openOverlay({type:'reset'});return;}if(action==='confirm-reset'){const result=service.resetDemo();if(result.ok){ui.page='overview';ui.overlay=null;ui.filter={};ui.purchaseTab='drafts';ui.wasteTab='waste';ui.wastePeriod='all';ui.wasteIngredient='';ui.wastePage=1;ui.reportPeriod='week';ui.chartDate='';ui.healthRisk='';ui.orderFilter='all';ui.chartsPlayed=false;ui.error='';ui.dirty=false;render();toast('Demo reset to the original restaurant dataset.');}else{ui.error=result.message;render();}return;}if(action==='export'){download(exportDemoState(s),`PANTRI_demo_${s.demoDate}.json`);toast('Demo data exported with records and approval snapshots.');return;}if(action==='export-raw'){download(service.getRaw()??'No saved data','PANTRI_saved_recovery.txt','text/plain');return;}if(action==='reload'){if(ui.dirty&&!window.confirm('Reload the latest saved data and discard your unsaved form changes?'))return;ui.overlay=null;ui.dirty=false;ui.error='';ui.discard=false;if(service.reload())toast('Latest saved data loaded.');return;}});
root.addEventListener('input', event => {
  const input = event.target;
  if (input.id === 'inventory-search') {
    ui.filter.query = input.value;
    ui.pageNumber = 1;
    render();
    return;
  }
  const form = input.closest('[role="dialog"] form');
  if (form) {
    ui.dirty = true;
    updateFormPreview(form);
  }
});
root.addEventListener('change',e=>{const id=e.target.id;if(id==='category-filter'){ui.filter.category=e.target.value;ui.pageNumber=1;render();}else if(id==='risk-filter'){ui.filter.risk=e.target.value;delete ui.filter.primaryRisk;ui.pageNumber=1;render();}else if(id==='page-size'){ui.pageSize=Number(e.target.value);ui.pageNumber=1;render();}else if (id === 'order-filter') {
  ui.orderFilter = e.target.value;
  render();
} else if (id === 'waste-period') {
  ui.wastePeriod = e.target.value;
  ui.wastePage = 1;
  render();
}else if(e.target.name==='ingredientId'&&ui.overlay){snapshotForm();const values=ui.overlay.values;ui.overlay.ingredientId=values.ingredientId;delete values.batchId;delete values.quantity;delete values.countedQuantity;delete values.unitCost;delete values.expiresOn;ui.dirty=true;render({ capture: false });}else if (e.target.name === 'batchId' && ui.overlay?.type === 'record' && ui.overlay.kind === 'count') {
  snapshotForm();
  delete ui.overlay.values.countedQuantity;
  render({ capture: false });
} else if (e.target.name === 'batchId' && ui.overlay?.type === 'new-recovery') {
  snapshotForm();
  render();
}});
root.addEventListener('submit',e=>{e.preventDefault();const form=e.target,kind=form.dataset.form;if(!kind)return;const values=Object.fromEntries(new FormData(form)),s=service.getSnapshot(),o=ui.overlay;try{if(kind==='inventory-record'){const i=s.ingredients.find(i=>i.id===values.ingredientId);const command={kind:o.kind,operationId:o.operationId,ingredientId:i.id,batchId:values.batchId,unit:i.unit,quantity:Number(values.quantity),countedQuantity:Number(values.countedQuantity),expiresOn:values.expiresOn||null,unitCostCents:values.unitCost?.trim()?Math.round(Number(values.unitCost)*100):null,orderId:o.orderId,reason:(values.reason??'')+(values.note?`: ${values.note}`:'')};if(commit(x=>applyInventoryCommand(x,command),'Inventory record saved.'))closeOverlay(true);}else if(kind==='draft'){const d=s.drafts.find(d=>d.id===o.id);commit(x=>editDraft(x,o.id,Number(values.version),d.lines.map(l=>({ingredientId:l.ingredientId,managerQty:Number(values['qty_'+l.ingredientId])}))),'Draft saved. Approval is still required.');}else if(kind==='supplier'){commit(x=>recordSupplierEvent(x,{id:o.operationId+'-'+operation(),restaurantId:s.restaurantId,transactionId:o.id,kind:values.kind,occurredAt:eventTime(s),note:values.note}),'Simulated supplier response recorded. Stock is unchanged.');}else if(kind==='recovery-request'){if(commit(x=>requestRecovery(x,{...values,quantity:Number(values.quantity)},o.operationId),'Recovery requested. Quantity is reserved.')){const id=service.getSnapshot().recoveries.at(-1).id;ui.wasteTab='recovery';ui.page='waste';openOverlay({type:'recovery',id});}}else if(kind==='recovery-response'){commit(x=>recordRecoveryEvent(x,{id:o.operationId+'-'+operation(),restaurantId:s.restaurantId,transactionId:o.id,kind:values.kind,occurredAt:eventTime(s),note:values.note}),'Simulated partner response recorded. Collection remains separate.');}}catch(error){snapshotForm();ui.error=error.message;render();}});
document.addEventListener('keydown', e => {
  // An open custom dropdown handles its own Escape/Tab; do not let them close the drawer.
  if ((e.key === 'Escape' || e.key === 'Tab') && selectIsOpen()) return;
  if (!ui.overlay) {
    if (e.key === 'Escape' && ui.chartDate && root.querySelector('.paired-chart')) setChartDay(ui.chartDate);
    return;
  }
  if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); return; }
  if (e.key === 'Tab') {
    const target = tabBoundaryTarget(dialogControls(root.querySelector('[role="dialog"]')), focusedControl(), e.shiftKey);
    if (target) { e.preventDefault(); target.focus(); }
  }
});
window.addEventListener('resize', () => placeNavPill(false));
// Any pointer movement decides the rail: inside the sidebar keeps it open, anywhere else closes it.
root.addEventListener('mouseover', e => setRail(!!e.target.closest?.('.sidebar')));
document.documentElement.addEventListener('mouseleave', () => setRail(false));
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)service.markExternalChange();});
service.subscribe(() => { if (!ui.committing) render(); });
render();
