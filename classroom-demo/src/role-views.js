const roleNavigation = {
  manager: [
    ['overview', 'home', 'Overview'],
    ['inventory', 'box', 'Inventory'],
    ['purchasing', 'cart', 'Purchasing'],
    ['waste', 'leaf', 'Waste & recovery'],
    ['reports', 'chart', 'Reports'],
  ],
  staff: [['inventory', 'box', 'Inventory']],
  supplier: [['supplier', 'truck', 'Supplier portal']],
  recovery: [['recovery-portal', 'leaf', 'Recovery portal']],
  support: [['support', 'settings', 'Support console']],
};

function workspaceNavigation(role) {
  return roleNavigation[role] ?? [];
}

function renderAccountCards(accounts, busy = false) {
  return `<div class="account-grid">${accounts.map(account => `
    <button class="card account-card" type="button" data-action="sign-in" data-id="${esc(account.id)}" ${busy ? 'disabled' : ''}>
      <span class="item-icon">${icon(workspaceNavigation(account.role)[0]?.[1] ?? 'home')}</span>
      <span><strong>${esc(account.label)}</strong><small>${esc(account.name)}</small></span>
      ${icon('chevron')}
    </button>`).join('')}</div>`;
}

function accountChoices(ui) {
  return `
    ${ui.accountError ? `<div class="form-error" role="alert">${icon('alert')} ${esc(ui.accountError)}</div>` : ''}
    ${ui.accounts.length ? renderAccountCards(ui.accounts, ui.sessionBusy)
      : ui.accountsLoading ? '<p class="quiet-state" role="status">Loading demo accounts…</p>'
      : button('Retry', 'retry-accounts', '', 'secondary', 'refresh')}`;
}

function renderSignIn(ui) {
  return `<main class="sign-in-shell" id="main-content">
    <section class="card sign-in-card">
      <div class="sign-in-brand"><span class="brand-leaf" aria-hidden="true"></span>pantri.</div>
      <h1>Choose a demo account</h1>
      <p>Demo sign-in, no real authentication</p>
      ${ui.sessionError && ui.sessionError !== ui.accountError ? `<div class="form-error" role="alert">${icon('alert')} ${esc(ui.sessionError)}</div>` : ''}
      ${ui.sessionBusy === 'restoring' ? '<p class="quiet-state" role="status">Opening your workspace…</p>' : accountChoices(ui)}
      ${ui.sessionBusy === 'switching' ? '<p class="quiet-state" role="status">Signing in…</p>' : ''}
    </section>
  </main>`;
}

function roleSwitchOverlay(ui) {
  return {
    title: 'Switch role',
    sub: 'Demo sign-in, no real authentication',
    center: true,
    body: accountChoices(ui) + (ui.sessionBusy ? '<p class="quiet-state" role="status">Signing in…</p>' : ''),
  };
}

function renderStaffReceipts(state) {
  const rows = state.orders.filter(order => isAwaitingReceiving(order)).toReversed()
    .flatMap(order => order.approvedLines.flatMap(line => {
      const received = order.receivedQuantities[line.ingredientId] ?? 0;
      const remaining = qty(line.managerQty - received);
      if (remaining <= 0) return [];
      const item = state.ingredients.find(ingredient => ingredient.id === line.ingredientId);
      return `<tr><td><strong>${esc(order.id)}</strong><small class="block muted">${esc(order.supplierId)}</small></td>
        <td>${esc(item?.name ?? line.ingredientId)}</td>
        <td>${amount(remaining)} ${esc(line.unit)} remaining</td><td>${badge(order.fulfillmentStatus)}</td>
        <td>${button('Record receiving', 'receive-order', `data-order="${esc(order.id)}" data-ingredient="${esc(line.ingredientId)}"`, 'mini', 'truck')}</td></tr>`;
    }));
  return `<section class="card role-section">
    <div class="card-head"><div><h2>Orders awaiting receiving</h2><p>Record delivered quantities against the corresponding order.</p></div></div>
    <div class="card-body">${rows.length ? `<div class="table-scroll"><table>
      <thead><tr><th scope="col">Order / Supplier</th><th scope="col">Ingredient</th><th scope="col">Quantity</th><th scope="col">Receiving</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>` : '<p class="quiet-state">No orders awaiting receiving.</p>'}</div>
  </section>`;
}

function refreshWorkspaceButton() {
  return button('Refresh', 'reload', '', 'secondary', 'refresh');
}

function renderSupplierPage(state, ui) {
  const orders = state.orders.toReversed();
  const title = heading('', 'Supplier portal', ui.account.name, refreshWorkspaceButton());
  if (!orders.length) return title + empty('No orders received', 'Sent purchase orders for your account will appear here.');
  return title + `<div class="table-card"><div class="table-scroll"><table>
    <thead><tr><th scope="col">Order</th><th scope="col">Approved quantities</th><th scope="col">Supplier response</th><th scope="col">Receiving</th><th scope="col">Sent</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
    <tbody>${orders.map(order => `<tr>
      <td><strong>${esc(order.id)}</strong></td>
      <td>${order.approvedLines.map(line => `<span class="block">${esc(ingredientName(state, line.ingredientId))} · ${amount(line.managerQty)} ${esc(line.unit)}</span>`).join('')}</td>
      <td>${badge(order.supplierStatus)}</td><td>${badge(order.fulfillmentStatus)}</td><td>${fullDate(order.sentAt)}</td>
      <td>${button('View order', 'supplier-order', `data-id="${esc(order.id)}"`, 'mini', 'chevron')}</td>
    </tr>`).join('')}</tbody>
  </table></div></div>`;
}

function ingredientName(state, id) {
  return state.ingredients.find(item => item.id === id)?.name ?? id;
}

const supplierResponses = [
  { value: 'confirmed', label: 'Confirm order' },
  { value: 'partial', label: 'Partially confirm' },
  { value: 'delayed', label: 'Report delay' },
  { value: 'exception', label: 'Report exception' },
];

function supplierOrderOverlay(state, overlay) {
  const order = state.orders.find(order => order.id === overlay.id);
  if (!order) return missingTransaction('Purchase order');
  return {
    title: order.id,
    sub: order.supplierId,
    body: `<div class="status-pair">
      <div><small>Supplier response</small>${badge(order.supplierStatus)}</div>
      <div><small>Receiving</small>${badge(order.fulfillmentStatus)}</div></div>
      <h3 class="section-heading">Approved quantities</h3>
      <div class="approved-lines">${order.approvedLines.map(line => `<div>
        <span>${esc(ingredientName(state, line.ingredientId))}</span><b>${amount(line.managerQty)} ${esc(line.unit)}</b>
      </div>`).join('')}</div>
      <form data-form="supplier-response">
        ${selectField(overlay, 'kind', 'Response', supplierResponses, 'confirmed')}
        ${noteField(overlay, 'note', 'Response note (optional)')}
        <div class="form-footer"><button class="btn primary" type="submit">${icon('send')}Send response</button></div>
      </form>
      <h3 class="section-heading">Order timeline</h3>${timeline(order.events ?? [])}`,
  };
}

function recoveryStatus(status) {
  return status === 'exception' ? '<span class="badge exception"><i></i>Declined</span>' : badge(status);
}

function renderRecoveryPortal(state, ui) {
  const title = heading('', 'Recovery portal', ui.account.name, refreshWorkspaceButton());
  if (!state.recoveries.length) return title + empty('No recovery requests', 'Pickup requests for your account will appear here.');
  return title + `<div class="recovery-grid">${state.recoveries.toReversed().map(request => {
    const [line] = request.lines;
    return `<article class="card recovery-card">
      <div class="card-head"><div><div class="eyebrow">${esc(request.id)}</div><h2>${esc(ingredientName(state, line.ingredientId))}</h2></div>${recoveryStatus(request.status)}</div>
      <div class="card-body"><div class="recovery-amount">${amount(line.quantity)} <span>${esc(line.unit)}</span></div>
        <p class="muted">${icon('clock')} ${esc(request.requestedWindow)}</p></div>
      <div class="card-footer">${button('View request', 'partner-request', `data-id="${esc(request.id)}"`, 'secondary', 'arrow')}</div>
    </article>`;
  }).join('')}</div>`;
}

function recoveryPartnerOverlay(state, overlay) {
  const request = state.recoveries.find(request => request.id === overlay.id);
  if (!request) return missingTransaction('Recovery request');
  const active = !['collected', 'cancelled'].includes(request.status);
  return {
    title: request.id,
    sub: request.partnerId,
    body: `<div class="status-pair"><div><small>Request status</small>${recoveryStatus(request.status)}</div></div>
      <div class="batch-card"><p>Pickup window <span>${esc(request.requestedWindow)}</span></p>
        ${request.followUp ? `<p>Latest note <span>${esc(request.followUp)}</span></p>` : ''}</div>
      <h3 class="section-heading">${active ? 'Reserved for pickup' : 'Pickup quantities'}</h3>
      <div class="approved-lines">${request.lines.map(line => `<div><span>${esc(ingredientName(state, line.ingredientId))}<small class="block muted">${esc(line.batchId)}</small></span><b>${amount(line.quantity)} ${esc(line.unit)}</b></div>`).join('')}</div>
      ${active ? `<form data-form="partner-response">
        ${noteField(overlay, 'note', 'Response note (optional)')}
        <div class="drawer-actions">
          ${request.status !== 'accepted' ? '<button class="btn primary" type="submit" name="kind" value="accepted">Accept request</button>' : ''}
          ${request.status !== 'exception' ? '<button class="btn secondary" type="submit" name="kind" value="exception">Decline request</button>' : ''}
          ${request.status === 'accepted' ? button('Record pickup', 'partner-pickup', `data-id="${esc(request.id)}"`, 'primary', 'check') : ''}
        </div>
      </form>` : ''}
      <h3 class="section-heading">Request timeline</h3>
      ${timeline((request.events ?? []).map(event => event.kind === 'exception' ? { ...event, kind: 'Declined' } : event))}`,
  };
}

function missingTransaction(label) {
  return { title: label, sub: 'Refresh the workspace to check for updates.', body: '<p class="quiet-state">This item is no longer available.</p>' };
}

function demoToolsOverlay(state) {
  const supplier = state.orders.some(order => order.sentAt);
  const recovery = state.recoveries.some(request => !['collected', 'cancelled'].includes(request.status));
  const pickup = state.recoveries.some(request => request.status === 'accepted');
  return {
    title: 'Demo tools',
    sub: 'A repeatable presentation workspace',
    center: true,
    body: `<div class="notice compact">${icon('info')}<span>All records are synthetic. The demo date is fixed at ${fullDate(state.demoDate)}.</span></div>
      <div class="tool-row"><div><strong>Export your demonstration</strong><p>Download records, approved snapshots and event history.</p></div>${button('Download JSON', 'export', '', 'secondary', 'download')}</div>
      <div class="tool-row"><div><strong>Reload workspace</strong><p>Read the latest shared dataset from the server.</p></div>${refreshWorkspaceButton()}</div>
      <div class="tool-row"><div><strong>Restart the presentation</strong><p>Restore the same starting data for the next run.</p></div>${button('Reset demo', 'reset', '', 'secondary', 'refresh')}</div>
      <h3 class="section-heading">Simulate external activity</h3>
      <div class="drawer-actions">
        ${button('Supplier response', 'simulate-supplier', supplier ? '' : 'disabled', 'secondary', 'truck')}
        ${button('Recovery response', 'simulate-recovery', recovery ? '' : 'disabled', 'secondary', 'leaf')}
        ${button('Record pickup', 'simulate-pickup', pickup ? '' : 'disabled', 'secondary', 'check')}
      </div>
      ${!supplier && !recovery ? '<p class="quiet-state">Send an order or create a recovery request to simulate a response.</p>' : ''}`,
  };
}

function simulationOverlay(state, overlay) {
  const supplier = overlay.type === 'simulate-supplier';
  const pickup = overlay.type === 'simulate-pickup';
  const choices = supplier ? state.orders.filter(order => order.sentAt)
    .map(order => ({ value: order.id, label: order.id + ' · ' + order.supplierId }))
    : state.recoveries.filter(request => pickup ? request.status === 'accepted' : !['collected', 'cancelled'].includes(request.status))
      .map(request => ({ value: request.id, label: request.id + ' · ' + ingredientName(state, request.lines[0].ingredientId) }));
  const title = supplier ? 'Simulate supplier response' : pickup ? 'Record simulated pickup' : 'Simulate recovery response';
  const responses = supplier ? supplierResponses : [
    { value: 'accepted', label: 'Accept request' },
    { value: 'exception', label: 'Report exception / delay' },
  ];
  const form = supplier ? 'supplier-response' : pickup ? 'pickup-simulation' : 'partner-response';
  return {
    title,
    sub: 'Demo tools',
    body: choices.length ? `<form data-form="${form}">
      ${selectField(overlay, 'transactionId', supplier ? 'Sent order' : 'Recovery request', choices, choices[0].value)}
      ${pickup ? '<p class="field-help">Recording pickup deducts the reserved quantity from on-hand inventory.</p>'
        : selectField(overlay, 'kind', 'Response', responses, responses[0].value) + noteField(overlay, 'note', 'Response note (optional)')}
      <div class="form-footer">${button('Back to Demo tools', 'close-overlay')}<button class="btn primary" type="submit">${pickup ? 'Record simulated pickup' : 'Apply simulated response'}</button></div>
    </form>` : '<p class="quiet-state">There are no eligible transactions.</p>',
  };
}

function renderLogRows(logs) {
  if (!logs.length) return '<p class="quiet-state">No log entries.</p>';
  return `<div class="table-scroll"><table class="support-logs">
    <thead><tr><th scope="col">Time (UTC)</th><th scope="col">Operation</th><th scope="col">Outcome</th><th scope="col" class="num">Time elapsed</th></tr></thead>
    <tbody>${logs.map(log => `<tr><td>${esc(String(log.at ?? '').replace('T', ' ').slice(0, 19))}</td>
      <td><strong>${esc(log.event)}</strong>${log.type ? `<small class="block muted">${esc(log.type)}</small>` : ''}
        ${log.type === 'assistant' ? `<small class="block muted">${esc(log.intent?.replaceAll('_', ' '))} · ${esc(log.model)}</small>` : ''}</td>
      <td>${esc(log.outcome || 'Recorded')}${log.reason || log.code ? `<small class="block muted">${esc(log.reason || log.code)}</small>` : ''}</td>
      <td class="num">${Number.isFinite(log.elapsedMs) ? amount(log.elapsedMs) + ' ms' : '—'}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

function renderSupportPage(state, ui) {
  const title = heading('', 'Support console', 'Service health, saved data and operational activity.', refreshWorkspaceButton());
  if (!ui.support) return title + `<p class="quiet-state" role="status">${ui.workspaceError ? 'Support details are unavailable.' : 'Loading support details…'}</p>`;
  const { health, storage, model, logs } = ui.support;
  const status = value => ({ ok: 'Healthy', degraded: 'Degraded', ready: 'Ready', quarantined: 'Quarantined', unavailable: 'Unavailable', warming: 'Warming up' })[value] ?? value ?? 'Unknown';
  const recent = [...(logs ?? [])].sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')));
  const errors = recent.filter(log => ['error', 'failed', 'rejected'].includes(log.outcome) || log.fallback).slice(0, 10);
  return title + `
    <div class="support-metrics">
      <section class="card"><div class="card-head"><h2>Service</h2></div><div class="card-body"><strong>${esc(status(health?.status))}</strong></div></section>
      <section class="card"><div class="card-head"><h2>Local model</h2></div><div class="card-body">
        <strong>${esc(model?.name ?? 'Ollama')} · ${esc(status(model?.status))}</strong>${model?.reason ? `<p class="quiet-state">${esc(model.reason)}</p>` : ''}
      </div></section>
      <section class="card"><div class="card-head"><h2>Data and recovery</h2></div><div class="card-body">
        <strong>${esc(status(storage?.status))}</strong>
        <p class="quiet-state">Current revision ${esc(storage?.revision ?? '—')} · Checkpoint ${storage?.hasCheckpoint ? 'revision ' + esc(storage.checkpointRevision ?? '—') : 'unavailable'}</p>
        ${storage?.problem ? `<p class="quiet-state">${esc(storage.problem)}</p>` : ''}
      </div></section>
    </div>
    <section class="card role-section"><div class="card-head"><h2>Recent errors</h2></div><div class="card-body">${renderLogRows(errors)}</div></section>
    <section class="card role-section"><div class="card-head"><h2>Operation log</h2></div><div class="card-body">${renderLogRows(recent)}</div></section>`;
}

function explanationCopy(explanation) {
  if (!explanation?.text) return '';
  if (explanation.source === 'model' && explanation.advice) {
    return `<strong>PANTRI calculation</strong><p>${esc(explanation.text)}</p>` +
      `<strong>Suggestion from the local model</strong><p>${esc(explanation.advice)}</p>`;
  }
  return `<strong>Showing PANTRI's calculated summary</strong><p>${esc(explanation.text)}</p>`;
}

function explanationBlock(explanation, scope = '') {
  return `<div class="planning-context model-explanation" role="status" data-explanation-scope="${esc(scope)}">${explanationCopy(explanation)}</div>`;
}
