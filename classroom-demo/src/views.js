function captureInputs(elements){const values={};for(const el of elements){if(!el.name||el.disabled||['submit','button','reset'].includes(el.type))continue;if(['checkbox','radio'].includes(el.type)&&!el.checked)continue;values[el.name]=String(el.value??'');}return values;}
function focusHint(element) {
  return {
    id: element?.id,
    name: element?.name,
    type: element?.type,
    form: element?.form?.dataset.form,
    action: element?.dataset?.action ? { ...element.dataset } : null,
    label: element?.getAttribute('aria-label'),
  };
}

function dialogControls(dialog) {
  return dialog ? [...dialog.querySelectorAll('button, input, select, textarea, summary, a[href], [tabindex="0"]')]
    .filter(el => !el.disabled && el.type !== 'hidden' && el.tabIndex >= 0 && el.getClientRects().length) : [];
}

function matchFocusTarget(controls, hint = {}) {
  return controls.find(el => hint.id && el.id === hint.id)
    ?? controls.find(el => hint.name && el.name === hint.name && (!hint.form || el.form?.dataset.form === hint.form))
    ?? controls.find(el => hint.action && Object.entries(hint.action).every(([key, value]) => el.dataset[key] === value)
      && (!hint.label || el.getAttribute('aria-label') === hint.label))
    ?? controls.find(el => hint.type === 'submit' && hint.form && el.type === 'submit' && el.form?.dataset.form === hint.form);
}
function tabBoundaryTarget(controls,active,shift){if(!controls.length)return null;if(!controls.includes(active))return shift?controls.at(-1):controls[0];if(shift&&active===controls[0])return controls.at(-1);if(!shift&&active===controls.at(-1))return controls[0];return null;}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(c/100);
const purchaseEstimate=lines=>lines.filter(l=>l.managerQty>0).every(l=>Number.isFinite(l.unitCostCents))?money(lines.reduce((n,l)=>n+(l.managerQty>0?l.managerQty*l.unitCostCents:0),0)):'Estimate incomplete';
const amount=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(n);
const prettyDate=d=>d?new Date(d.slice(0,10)+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}):'Unknown';
const riskLabels={healthy:'Healthy',low:'Low stock',expiring:'Expiring soon',expired:'Expired',unknown:'Date unknown',attention:'Needs attention'};
const stateLabels={draft:'Draft',approved:'Approved',not_sent:'Not sent',awaiting_confirmation:'Awaiting confirmation',confirmed:'Confirmed',partial:'Partially confirmed',delayed:'Delayed',exception:'Exception',not_received:'Not received',partially_received:'Partially received',received:'Received',requested:'Requested',accepted:'Accepted',collected:'Collected',cancelled:'Cancelled',sent:'Sent',receipt:'Received',usage:'Usage',count:'Count adjustment',waste:'Waste',collection:'Collection'};
const iconPaths={home:'M3 10 12 3l9 7v11h-6v-7H9v7H3z',box:'m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',cart:'M3 4h3l2 12h11l2-8H7M10 21h.01M18 21h.01',leaf:'M19 4c-9-1-16 5-13 12 6 5 15-2 13-12ZM6 17l8-8',chart:'M4 3v18h17M8 16v-5M13 16V7M18 16v-6',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',chevron:'m9 5 7 7-7 7',arrow:'M4 12h16m-6-6 6 6-6 6',plus:'M12 5v14M5 12h14',close:'m6 6 12 12M6 18 18 6',check:'m5 12 4 4L19 6',alert:'m12 3 10 18H2zM12 9v4M12 17h.01',clock:'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',dollar:'M12 2v20M18 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H6',file:'M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',refresh:'M20 7V3l-4 4a8 8 0 1 0 4 7M20 7h-5',settings:'M4 7h16M4 17h16M8 4v6M16 14v6',calendar:'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16',send:'m3 3 19 9-19 9 4-9zM7 12h15',truck:'M2 6h12v12H2zM14 10h4l4 5v3h-8M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6',undo:'M3 9h11a6 6 0 0 1 0 12M3 9l6-6M3 9l6 6',info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',chevrondown:'m6 9 6 6 6-6'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" data-icon="${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[name]??iconPaths.file}"/></svg>`;
const badge=status=>`<span class="badge ${esc(status)}"><i></i>${esc(riskLabels[status]??stateLabels[status]??status)}</span>`;
const empty=(title,text,action='')=>`<div class="empty-state">${icon('box')}<h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;
const button=(label,action,attrs='',kind='secondary',ico='')=>`<button type="button" class="btn ${kind}" data-action="${action}" ${attrs}>${ico?icon(ico):''}${label}</button>`;
const heading = (kicker, title, sub, actions = '') =>
  `<div class="page-heading">
    <div>
      ${kicker ? '<div class="eyebrow">' + esc(kicker) + '</div>' : ''}
      <h1>${esc(title)}</h1><p>${esc(sub)}</p>
    </div>
    ${actions ? '<div class="heading-actions">' + actions + '</div>' : ''}
  </div>`;
const categoryIcon=c=>c==='Produce'?'leaf':c==='Other'?'dollar':'box';

function costChart(series, activeDate, animate = false) {
  const max = Math.max(1000, ...series.map(day => Math.max(day.usageCents, day.wasteCents)));
  const interval = max > 10000 ? 5000 : 1000;
  const top = Math.ceil(max / interval) * interval;
  return `<div class="cost-chart paired-chart ${animate ? 'chart-entry' : ''}">
    <div class="chart-axis" aria-hidden="true">
      <span>${money(top).replace('.00', '')}</span><span>${money(top / 2).replace('.00', '')}</span><span>$0</span>
    </div>
    <div class="plot">
      <div class="plot-lines" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="plot-columns" role="group" aria-label="Select a day to keep its costs visible">
        ${series.map(day => {
          const date = prettyDate(day.date);
          const label = `${date}: usage ${money(day.usageCents)}, waste ${money(day.wasteCents)}${day.costComplete ? '' : ', partial costs'}`;
          const usageHeight = 100 * day.usageCents / top;
          return `<button class="cost-day" type="button" data-action="chart-day" data-date="${day.date}"
            aria-pressed="${day.date === activeDate}" aria-label="${esc(label)}" style="--usage:${usageHeight}%">
            <span class="cost-bars" aria-hidden="true">
              <i class="usage-bar" style="--height:${usageHeight}%"></i>
              <i class="waste-bar" style="--height:${100 * day.wasteCents / top}%"></i>
            </span>
            <span class="cost-date">${date}</span>
            <span class="cost-value" aria-hidden="true"><b>${money(day.usageCents)}</b>
              <small>Waste ${money(day.wasteCents)}${day.costComplete ? '' : ' · partial'}</small></span>
          </button>`;
        }).join('')}
      </div>
    </div>
    <span class="sr-only" data-chart-announcement aria-live="polite"></span>
  </div>`;
}

function renderInventory(s,ui){const f=ui.filter,all=selectInventory(s,f),size=ui.pageSize;ui.pageNumber=Math.max(1,Math.min(ui.pageNumber,Math.ceil(all.length/size)||1));const start=(ui.pageNumber-1)*size,rows=all.slice(start,start+size),categories=[...new Set(s.ingredients.map(i=>i.category))];const active=!!(f.query||f.category||f.risk);return heading('','Inventory','Search ingredients, check batches and record stock movements.',button('Record receiving','record','data-kind="receipt"','primary','plus'))+(ui.account?.role==='staff'?renderStaffReceipts(s):'')+`<div class="inventory-toolbar"><label class="search-field">${icon('search')}<input id="inventory-search" data-focus="inventory-search" type="search" placeholder="Search ingredients or categories…" value="${esc(f.query??'')}" aria-label="Search ingredients"></label><select id="category-filter" aria-label="Category"><option value="">All categories</option>${categories.map(c=>`<option ${f.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select><select id="risk-filter" aria-label="Status"><option value="">All statuses</option>${Object.entries(riskLabels).map(([v,l])=>`<option value="${v}" ${f.risk===v?'selected':''}>${l}</option>`).join('')}</select>${active?button('Clear filters','clear-filters','','ghost','close'):''}</div><div class="table-meta"><span><b>${all.length}</b> of ${s.ingredients.length} ingredients ${f.risk?`<span class="filter-pill">${f.primaryRisk ? 'Primary status · ' : ''}${riskLabels[f.risk]}</span>`:''}</span><span>Recorded stock · ${prettyDate(s.demoDate)}</span></div><div class="table-card"><div class="table-scroll"><table><thead><tr><th>Ingredient</th><th>Category</th><th class="num">On hand</th><th>Unit</th><th>Nearest expiration</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>${rows.map(i=>`<tr><td><button type="button" class="ingredient-button" data-action="ingredient" data-id="${i.id}"><span class="item-icon">${icon(categoryIcon(i.category))}</span><span><strong>${esc(i.name)}</strong><small>${i.batches.length} batch${i.batches.length===1?'':'es'} · ${esc(i.id.toUpperCase())}</small></span></button></td><td>${esc(i.category)}</td><td class="num stock-quantity">${amount(i.onHand)}</td><td>${esc(i.unit)}</td><td>${i.risks.includes('unknown')?'<span class="muted">Unknown date present</span>':fullDate(i.nearest)}</td><td>${badge(i.status)}${i.risks.length>1?`<small class="more-risks" title="${esc(i.risks.map(r=>riskLabels[r]).join(', '))}">+${i.risks.length-1}</small>`:''}</td><td>${fullDate(i.updatedAt)}</td><td>${button(icon('chevron'),'ingredient',`data-id="${i.id}" aria-label="Open ${esc(i.name)}"`,'icon-button')}</td></tr>`).join('')}</tbody></table></div>${rows.length?'':empty('No matching ingredients','Try a different search, category or status.',button('Clear filters','clear-filters','','secondary'))}<div class="pagination"><span>${all.length?start+1:0}–${Math.min(start+size,all.length)} of ${all.length}</span><div><label>Rows <select id="page-size" aria-label="Rows per page">${[12,24,48].map(n=>`<option ${size===n?'selected':''}>${n}</option>`).join('')}</select></label>${button('Previous','prev',ui.pageNumber===1?'disabled':'','mini') }<span class="page-index">${ui.pageNumber} / ${Math.ceil(all.length/size)||1}</span>${button('Next','next',start+size>=all.length?'disabled':'','mini')}</div></div></div>`;}

const field=(o,name,label,value='',type='text',attrs='')=>`<label class="field"><span>${label}</span><input name="${name}" id="field-${name}" type="${type}" value="${esc(o.values?.[name]??value)}" ${attrs}></label>`;
function selectField(overlay, name, label, options, defaultValue = '', { required = false } = {}) {
  const selected = overlay.values?.[name] ?? defaultValue;
  return `<label class="field"><span>${label}</span><select name="${name}" id="field-${name}"${required ? ' required' : ''}>${
    options.map(option => {
      const { value, label } = typeof option === 'object' ? option : { value: option, label: option };
      return `<option value="${esc(value)}" ${String(selected) === String(value) ? 'selected' : ''}>${esc(label)}</option>`;
    }).join('')}</select></label>`;
}
const noteField=(o,name,label,value='',required=false)=>`<label class="field"><span>${label}</span><textarea name="${name}" id="field-${name}" rows="3" ${required?'required':''}>${esc(o.values?.[name]??value)}</textarea></label>`;
const timeline=events=>`<div class="timeline">${[...events].sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)).map(e=>`<div class="timeline-event"><span>${icon('check')}</span><div><strong>${esc(stateLabels[e.kind]??e.kind)}${e.simulated?' <small class="sim-label">Simulated</small>':''}</strong><p>${esc(e.note??e.reason??'')}</p><time>${fullDate(e.occurredAt)} · ${e.occurredAt.slice(11,19)}</time></div></div>`).join('')}</div>`;
function recordOverlay(state, overlay) {
  const order = overlay.orderId ? state.orders.find(order => order.id === overlay.orderId) : null;
  if (overlay.orderId && !order) return missingTransaction('Purchase order');
  const remainingFor = id => {
    const line = order.approvedLines.find(line => line.ingredientId === id);
    return line ? qty(line.managerQty - (order.receivedQuantities[id] ?? 0)) : 0;
  };
  const ingredients = order ? state.ingredients.filter(item => remainingFor(item.id) > 0) : state.ingredients;
  const requestedIngredient = overlay.values?.ingredientId ?? overlay.ingredientId;
  const item = ingredients.find(item => item.id === requestedIngredient) ?? ingredients[0];
  if (!item) return { title: 'Record receiving', sub: order?.id ?? '', body: '<p class="quiet-state">There are no remaining quantities to receive.</p>' };

  const batches = state.batches.filter(batch => batch.ingredientId === item.id);
  const batch = batches.find(batch => batch.id === (overlay.values?.batchId ?? overlay.batchId)) ?? batches[0];
  const receipt = overlay.kind === 'receipt';
  const count = overlay.kind === 'count';
  const waste = overlay.kind === 'waste';
  const remaining = order ? remainingFor(item.id) : null;
  const step = item.unit === 'kg' ? 0.001 : 1;
  const title = receipt ? 'Record receiving' : count ? 'Count adjustment' : waste ? 'Record waste' : 'Record ingredient usage';
  const symbol = receipt ? 'truck' : count ? 'box' : waste ? 'leaf' : 'file';
  const instructions = receipt ? 'Saving receiving adds the delivered quantity to a new batch.'
    : count ? 'Enter the quantity you counted. PANTRI records the difference as a correction.'
    : 'This creates a movement against the selected batch and updates inventory.';
  return {
    title,
    sub: order ? order.id + ' · Record actual quantities received' : item.name,
    actions: button('Cancel', 'close-overlay') +
      `<button class="btn primary" type="submit" form="dialog-form" ${receipt || batch ? '' : 'disabled'}>${icon('check')}Save ${receipt ? 'receiving' : count ? 'count' : overlay.kind}</button>`,
    body: `<form id="dialog-form" data-form="inventory-record">
      <div class="form-intro">${icon(symbol)}<p>${instructions}</p></div>
      ${selectField(overlay, 'ingredientId', 'Ingredient', ingredients.map(ingredient => ({ value: ingredient.id, label: ingredient.name })), item.id)}
      ${!receipt && !batch ? '<p class="notice compact">This ingredient has no recorded batches.</p>' : ''}
      ${!receipt && batch ? selectField(overlay, 'batchId', 'Batch', batches.map(batch => ({
        value: batch.id, label: batch.id + ' · ' + amount(qty(batch.quantity - reservedForBatch(state, batch.id))) + ' ' + item.unit + ' available',
      })), batch.id) : ''}
      ${receipt || batch ? field(overlay, count ? 'countedQuantity' : 'quantity', (count ? 'Counted quantity' : 'Quantity') + ' (' + esc(item.unit) + ')',
        count ? batch.quantity : remaining ?? 1, 'number',
        `required min="${count ? 0 : step}" step="${step}" ${remaining === null ? '' : 'max="' + remaining + '"'}`) : ''}
      ${remaining === null ? '' : `<p class="field-help">${amount(remaining)} ${esc(item.unit)} remaining on the approved order.</p>`}
      ${receipt ? `<div class="field-grid">
        ${field(overlay, 'expiresOn', 'Expiration date', addDays(state.demoDate, 7), 'date')}
        ${field(overlay, 'unitCost', 'Cost per ' + esc(item.unit) + ' ($)', Number.isFinite(batch?.unitCostCents) ? batch.unitCostCents / 100 : '', 'number', 'min="0" max="10000000" step="0.01"')}
      </div><p class="field-help">A blank expiration or unit cost is recorded as unknown. Enter 0 for a zero-cost delivery.</p>
        ${stockPreview('On hand after receiving', getIngredientSummary(state, item.id).onHand, item.unit, 1)}` : ''}
      ${waste ? selectField(overlay, 'reason', 'Reason', ['Preparation loss', 'Spoilage', 'Overproduction', 'Expired', 'Other'], 'Preparation loss')
        : noteField(overlay, 'reason', count ? 'Reason for correction' : 'Reason / receiving note',
          receipt ? 'Delivery recorded' : count ? 'Physical count' : 'Service usage', !receipt)}
      ${waste ? noteField(overlay, 'note', 'Additional note (optional)') : ''}
    </form>`,
  };
}
function draftOverlay(s,o){const d=s.drafts.find(x=>x.id===o.id);
const recentWaste=new Map(selectWastePlanning(s,reportRange(s,'week')).map(signal=>[signal.ingredientId,signal]));return{title:'Review purchase draft',sub:`${d.supplierId} · ${d.id.toUpperCase()} · Version ${d.version}`,actions:`<button type="submit" form="dialog-form" class="btn secondary">Save changes</button>${button('Refresh recommendation','refresh-draft',`data-id="${d.id}"`,'ghost','refresh')}${button('Review & approve','review-approval',`data-id="${d.id}"`,'primary','arrow')}`,body:`<div class="notice compact">${icon('info')}<span>Demo forecast: recorded daily demand × the planning window. The recommendation stays a draft until you approve it.</span></div><form id="dialog-form" data-form="draft"><input type="hidden" name="version" value="${d.version}">${d.lines.map(l=>{const i=s.ingredients.find(i=>i.id===l.ingredientId);return`<h3 class="section-heading">${esc(i.name)}</h3><div class="math-list"><div><span>Expected demand · ${l.horizonDays} days</span><b>${amount(l.forecastQty)} ${l.unit}</b></div><div><span>Usable recorded stock</span><b>${amount(l.usableStock)} ${l.unit}</b></div><div><span>Excluded from planning</span><b>${amount(l.excludedStock)} ${l.unit}</b></div><div class="math-total"><span>Suggested purchase</span><b>${amount(l.suggestedQty)} ${l.unit}</b></div></div>${l.exclusionNotes.length?`<p class="field-help">${esc(l.exclusionNotes.join('; '))}</p>`:''}${field(o,'qty_'+i.id,`Manager quantity (${l.unit})`,l.managerQty,'number',`data-draft-price="${Number.isFinite(l.unitCostCents) ? l.unitCostCents : ''}" required min="0" step="${l.unit==='kg'?.001:1}"`)}<p class="field-help">Pack size ${i.packSize} ${i.unit}. You can revise the suggested amount before approving.</p>${draftWasteContext(recentWaste.get(i.id),s.demoDate)}`}).join('')}${explanationBlock(null, 'draft:' + d.id)}<div class="live-preview"><div><strong>Estimated order total</strong><small>At recorded unit costs</small></div><output data-draft-estimate aria-live="polite">${purchaseEstimate(d.lines)}</output></div></form>`};}
function approvalOverlay(s,o){const d=s.drafts.find(x=>x.id===o.id);return{title:'Approve final purchase',sub:`${d.supplierId} · Version ${d.version}`,center:true,actions:`${button('Back to draft','back-draft',`data-id="${d.id}"`,'secondary')}${button('Approve & send (demo)','approve-send',`data-id="${d.id}" data-version="${d.version}"`,'primary','send')}`,body:`<div class="confirmation-icon">${icon('file')}</div><p class="confirmation-intro">You are approving the exact quantities below. Sending will use this approved snapshot.</p><div class="approved-lines">${d.lines.filter(l=>l.managerQty>0).map(l=>`<div><span>${esc(s.ingredients.find(i=>i.id===l.ingredientId).name)}<small class="block muted">${l.unitCostCents===null?'Unit cost unknown':money(l.unitCostCents)+' / '+l.unit}</small></span><b>${amount(l.managerQty)} ${l.unit}</b></div>`).join('')}</div><div class="math-list"><div><span>Estimated total</span><b>${purchaseEstimate(d.lines)}</b></div></div><p class="field-help">The approved order will appear in the supplier portal.</p>`};}
function orderOverlay(state, overlay) {
  const order = state.orders.find(order => order.id === overlay.id);
  if (!order) return missingTransaction('Purchase order');
  const allEvents = [...order.events, ...state.inventoryEvents.filter(event => event.relatedOrderId === order.id).map(event => ({
    ...event, note: `${amount(event.quantityDelta)} ${event.unit} receiving recorded in ${event.batchId}`,
  }))];
  const actions = !order.sentAt ? button('Send approved order (demo)', 'send-order', `data-id="${esc(order.id)}"`, 'primary', 'send')
    : order.fulfillmentStatus !== 'received' ? button('Record receiving', 'receive-order', `data-order="${esc(order.id)}"`, 'primary', 'truck') : '';
  return {
    title: order.id,
    sub: order.supplierId,
    actions: button('Create follow-up draft', 'new-draft-from-order', `data-id="${esc(order.id)}"`, 'secondary', 'plus') + actions,
    body: `<div class="status-pair"><div><small>Supplier</small>${badge(order.supplierStatus)}</div>
      <div><small>Receiving</small>${badge(order.fulfillmentStatus)}</div></div>
      <h3 class="section-heading">Approved snapshot <span>v${order.approvedVersion}</span></h3>
      <div class="approved-lines">${order.approvedLines.map(line => `<div><span>${esc(ingredientName(state, line.ingredientId))}
        <small class="block muted">Received ${amount(order.receivedQuantities[line.ingredientId] ?? 0)} ${esc(line.unit)}</small></span>
        <b>${amount(line.managerQty)} ${esc(line.unit)}</b></div>`).join('')}</div>
      ${order.sentAt ? `<div class="tool-row"><div><strong>Supplier handoff</strong><p>Use the supplier portal to respond to this order.</p></div>
        ${button('Switch role', 'switch-role', '', 'secondary', 'arrow')}</div>` : ''}
      <h3 class="section-heading">Order timeline</h3>${timeline(allEvents)}`,
  };
}
function recoveryOverlay(state, overlay) {
  const request = state.recoveries.find(request => request.id === overlay.id);
  if (!request) return missingTransaction('Recovery request');
  const [line] = request.lines;
  const active = !['cancelled', 'collected'].includes(request.status);
  return {
    title: request.id,
    sub: request.partnerId,
    actions: active ? button('Cancel request', 'cancel-recovery', `data-id="${esc(request.id)}"`, 'secondary') : '',
    body: `<div class="drawer-summary">
      <div><small>${esc(ingredientName(state, line.ingredientId))}</small><b>${amount(line.quantity)} <em>${esc(line.unit)}</em></b></div>
      ${badge(request.status)}</div>
      <div class="batch-card">
        <p>Batch <span>${esc(line.batchId)}</span></p>
        <p>Pickup window <span>${esc(request.requestedWindow)}</span></p>
        <p>Responsible owner <span>${esc(request.owner)}</span></p>
        <p>Follow-up <span>${esc(request.followUp || 'No open follow-up')}</span></p>
      </div>
      ${active ? `${request.status === 'exception' ? '<p class="field-help">Cancel the request to release its reservation.</p>' : ''}
        <div class="tool-row"><div><strong>Partner handoff</strong><p>Use the recovery portal to respond and record pickup.</p></div>
          ${button('Switch role', 'switch-role', '', 'secondary', 'arrow')}</div>` : ''}
      <h3 class="section-heading">Request timeline</h3>${timeline(request.events)}`,
  };
}
function healthInfoOverlay(state) {
  const summary = selectOverview(state);
  return {
    title: 'Inventory health',
    sub: fullDate(state.demoDate) + ' · ' + summary.total + ' tracked ingredients',
    body: `<p class="guide-copy">Each ingredient appears once in the ring. Its primary status is the first applicable flag in this order.</p>
      <dl class="health-guide">
        <div><dt>Expired</dt><dd>A batch on hand is past its expiration date.</dd></div>
        <div><dt>Date unknown</dt><dd>A batch on hand has no recorded expiration.</dd></div>
        <div><dt>Low stock</dt><dd>Usable stock is below the reorder point.</dd></div>
        <div><dt>Expiring soon</dt><dd>A batch on hand expires within the next 3 days.</dd></div>
        <div><dt>Healthy</dt><dd>None of those flags applies.</dd></div>
      </dl>`,
  };
}

function stockPreview(label, current, unit, direction) {
  return `<div class="live-preview" data-quantity-preview data-current="${current}" data-unit="${esc(unit)}" data-direction="${direction}">
    <div><strong>${label}</strong><small>Currently ${amount(current)} ${esc(unit)}</small></div>
    <output data-stock-result for="field-quantity" aria-live="polite">—</output>
  </div>`;
}
function resetOverlay() {
  return {
    title: 'Reset the demo?',
    sub: 'Return to the original restaurant dataset',
    center: true,
    body: `<div class="confirmation-icon">${icon('refresh')}</div>
      <p class="confirmation-intro">Reset restores the original 132 ingredients, three drafts and demonstration date for every demo account.</p>
      <p class="field-help">Download your data first if you want to keep this run.</p>
      <div class="form-footer">${button('Keep my data', 'close-overlay')}${button('Reset demo', 'confirm-reset', '', 'primary', 'refresh')}</div>`,
  };
}

function renderOverlay(state, overlay, error = '', discard = false, ui) {
  if (!overlay) return '';
  const renderers = {
    ingredient: ingredientDetails,
    history: activityOverlay,
    'inventory-value': inventoryValueOverlay,
    'health-info': healthInfoOverlay,
    record: recordOverlay,
    draft: draftOverlay,
    approval: approvalOverlay,
    order: orderOverlay,
    'new-recovery': recoveryForm,
    recovery: recoveryOverlay,
    'supplier-order': supplierOrderOverlay,
    'partner-request': recoveryPartnerOverlay,
    demo: demoToolsOverlay,
    'simulate-supplier': simulationOverlay,
    'simulate-recovery': simulationOverlay,
    'simulate-pickup': simulationOverlay,
  };
  const content = overlay.type === 'switch-role' ? roleSwitchOverlay(ui)
    : overlay.type === 'reset' ? resetOverlay()
    : state && renderers[overlay.type] ? renderers[overlay.type](state, overlay, ui) : missingTransaction('Workspace');
  return `<div class="overlay-backdrop" data-action="backdrop">
    <section class="${content.center ? 'modal' : 'drawer'}${content.modalClass ? ' ' + content.modalClass : ''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">
      <header class="dialog-header"><div><h2 id="dialog-title">${esc(content.title)}</h2><p>${esc(content.sub)}</p></div>
        ${button(icon('close'), 'close-overlay', 'aria-label="Close dialog"', 'icon-button')}</header>
      <div class="dialog-body">
        ${error ? `<div class="form-error" role="alert">${icon('alert')} ${esc(error)}</div>` : ''}
        ${discard ? `<div class="discard-warning" role="alert"><strong>Discard your unsaved changes?</strong><div>
          ${button('Keep editing', 'keep-editing')}${button('Discard changes', 'discard', '', 'danger')}</div></div>` : ''}
        ${content.body}
      </div>
      ${content.actions ? `<footer class="dialog-actions">${content.actions}</footer>` : ''}
    </section>
  </div>`;
}
