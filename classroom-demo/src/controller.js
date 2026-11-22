const root=document.getElementById('app');
const api = createPantriApi();
const explanationCache = new Map();
let sessionEpoch = 0;
let toastTimer;

function workspaceDefaults(role = 'manager') {
  return {
    page: workspaceNavigation(role)[0][0], lastPage: null, pageNumber: 1, pageSize: 12, filter: {},
    purchaseTab: 'drafts', orderFilter: 'all',
    wasteTab: 'waste', wastePeriod: 'all', wasteIngredient: '', wastePage: 1,
    reportPeriod: 'week', periodChanged: false, healthRisk: '', chartDate: '',
    overlay: null, lastOverlay: null, error: '', dirty: false, discard: false, notice: null,
    animateCharts: false, chartsPlayed: false, railOpen: false, navPillY: null,
    leaving: null, leaveTimer: null, railTimer: null,
  };
}

const ui = {
  ...workspaceDefaults(),
  account: null, state: null, storage: null, support: null, accounts: [],
  accountsLoading: false, accountError: '', sessionError: '', sessionBusy: null, workspaceError: '',
  committing: false, reloading: false,
};

function changeWorkspace(account) {
  sessionEpoch += 1;
  clearTimeout(ui.leaveTimer);
  clearTimeout(ui.railTimer);
  clearTimeout(toastTimer);
  explanationCache.clear();
  Object.assign(ui, workspaceDefaults(account?.role), {
    account, state: null, storage: null, support: null, workspaceError: '',
  });
}

function useSnapshot({ account, state, storage }) {
  if (ui.account?.id !== account.id) changeWorkspace(account);
  if (ui.storage?.revision !== storage.revision) explanationCache.clear();
  Object.assign(ui, { account, state, storage, workspaceError: '' });
}

function recoverExpiredSession(error) {
  if (error.status !== 401 || api.hasSession()) return false;
  changeWorkspace(null);
  ui.sessionError = 'Your demo session expired. Choose an account to sign in again.';
  return true;
}

async function loadAccounts() {
  if (ui.accountsLoading) return;
  ui.accountsLoading = true;
  ui.accountError = '';
  if (!ui.account || ui.overlay?.type === 'switch-role') render();
  try {
    ({ accounts: ui.accounts } = await api.accounts());
    if (!ui.accounts.length) ui.accountError = 'No demo accounts are available. Retry to load them.';
  } catch (error) {
    ui.accountError = error.message;
  } finally {
    ui.accountsLoading = false;
    if (!ui.account || ui.overlay?.type === 'switch-role') render();
  }
}

async function loadWorkspace() {
  useSnapshot(await api.snapshot());
  if (ui.account.role !== 'support') return;
  const [support, health] = await Promise.allSettled([api.read('/api/support'), api.health()]);
  if (support.status === 'rejected') throw support.reason;
  ui.support = { ...support.value, health: health.value };
  if (health.status === 'rejected') throw health.reason;
}

async function signIn(id) {
  if (ui.sessionBusy || !ui.accounts.some(account => account.id === id)) return;
  ui.sessionBusy = 'switching';
  ui.sessionError = '';
  ui.error = '';
  render();
  let changed = false;
  try {
    const { account } = await api.signIn(id);
    changeWorkspace(account);
    changed = true;
    await loadWorkspace();
  } catch (error) {
    if (!recoverExpiredSession(error)) {
      if (changed) ui.workspaceError = error.message;
      else if (ui.overlay) ui.error = error.message;
      else ui.sessionError = error.message;
    }
  } finally {
    ui.sessionBusy = null;
    render();
    if (ui.overlay) focusDialog();
    else if (changed && ui.account) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      root.querySelector('main')?.focus({ preventScroll: true });
    }
  }
}

async function startBrowser() {
  if (api.hasSession()) {
    ui.sessionBusy = 'restoring';
    ui.sessionError = '';
  }
  const accounts = loadAccounts();
  if (!ui.sessionBusy) return accounts;
  try {
    await loadWorkspace();
  } catch (error) {
    if (!recoverExpiredSession(error)) {
      if (ui.account) ui.workspaceError = error.message;
      else ui.sessionError = error.message;
    }
  } finally {
    ui.sessionBusy = null;
    render();
  }
  await accounts;
}

function toast(message, error = false) {
  ui.notice = { message, error };
  renderToast();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { ui.notice = null; renderToast(); }, 3500);
}

function renderToast() {
  const element = document.getElementById('toast-region');
  if (element) element.innerHTML = ui.notice ? `<div class="toast ${ui.notice.error ? 'error' : ''}" role="${ui.notice.error ? 'alert' : 'status'}">${icon(ui.notice.error ? 'alert' : 'check')}<span>${esc(ui.notice.message)}</span></div>` : '';
}

function snapshotForm() {
  const form = root.querySelector('[role="dialog"] form');
  if (form && ui.overlay) ui.overlay.values = captureInputs(form.elements);
}

function focusDialog(hint) {
  const overlay = ui.overlay;
  requestAnimationFrame(() => {
    if (ui.overlay !== overlay) return;
    const dialog = root.querySelector('[role="dialog"]');
    const fields = dialog?.querySelector('input:not([type="hidden"]), select, textarea');
    (matchFocusTarget(dialogControls(dialog), hint) ?? fields ?? dialog?.querySelector('button:not(:disabled)') ?? dialog)
      ?.focus({ preventScroll: true });
  });
}

function openOverlay(overlay, back = null) {
  const returnFocus = focusHint(focusedControl());
  const pageFocus = ui.overlay?.pageFocus ?? returnFocus;
  Object.assign(ui, { overlay: { ...overlay, returnFocus, pageFocus, back }, error: '', dirty: false, discard: false });
  render();
  focusDialog();
}

function closeOverlay(force = false) {
  const closing = ui.overlay;
  if (!closing || interactionBusy()) return;
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
  Object.assign(ui, { overlay: closing.back, error: '', dirty: false, discard: false });
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
  if (!workspaceNavigation(ui.account?.role).some(([name]) => name === page)) return;
  const go = () => {
    Object.assign(ui, { page, overlay: null, error: '', dirty: false, discard: false });
    if (page === 'inventory') { ui.filter = filter ?? {}; ui.pageNumber = 1; }
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  // Replace a pending destination while the current page is leaving.
  if (ui.leaving) { ui.leaving = go; movePillTo(page); return; }
  if (page === ui.page || ui.overlay || prefersReducedMotion()) { go(); return; }
  ui.leaving = go;
  movePillTo(page);
  leavePage(() => { const next = ui.leaving; ui.leaving = null; next?.(); });
}

function currentExplanation() {
  if (ui.account?.role !== 'manager' || !ui.state || ui.storage?.status !== 'ready') return null;
  let scope;
  let path;
  if (ui.overlay?.type === 'draft') {
    scope = 'draft:' + ui.overlay.id;
    path = draftPath(ui.overlay.id) + '/explanation';
  } else if (ui.page === 'reports') {
    scope = 'reports:' + ui.reportPeriod;
    path = '/api/reports/waste-insights?period=' + encodeURIComponent(ui.reportPeriod);
  } else {
    return null;
  }
  const revision = ui.storage.revision;
  return { scope, path, revision, key: revision + '/' + scope };
}

function paintExplanation(scope, explanation) {
  for (const element of root.querySelectorAll('[data-explanation-scope]')) {
    if (element.dataset.explanationScope === scope) element.innerHTML = explanationCopy(explanation);
  }
}

function syncExplanation() {
  const context = currentExplanation();
  if (!context) return;
  const { scope, key, revision, path } = context;
  if (explanationCache.has(key)) {
    paintExplanation(scope, explanationCache.get(key));
    return;
  }

  // The placeholder can update without re-rendering the drawer, inputs or active page.
  explanationCache.set(key, null);
  const epoch = sessionEpoch;
  api.read(path).then(result => {
    if (epoch !== sessionEpoch || revision !== ui.storage?.revision) return;
    const explanation = result.revision === revision ? result.explanation : null;
    explanationCache.set(key, explanation);
    if (currentExplanation()?.key === key) paintExplanation(scope, explanation);
  }).catch(error => {
    if (epoch !== sessionEpoch) return;
    if (recoverExpiredSession(error)) {
      render();
    } else if (error.retryable && currentExplanation()?.key === key) {
      toast(error.message, true);
    }
  });
}

function interactionBusy() {
  return ui.committing || ui.reloading || Boolean(ui.sessionBusy);
}

function markRequestBusy(busy) {
  const region = root.querySelector('[role="dialog"]') ?? root.querySelector('main');
  if (busy) region?.setAttribute('aria-busy', 'true');
  else region?.removeAttribute('aria-busy');
  region?.querySelector('form')?.toggleAttribute('inert', busy);
}

function requestFailure(error, focus) {
  if (!recoverExpiredSession(error)) {
    if (error.retryable) ui.workspaceError = error.message;
    if (ui.overlay) ui.error = error.message;
    else if (!error.retryable) toast(error.message, true);
  }
  render();
  if (ui.overlay) focusDialog(focus);
}

async function commit(write, message, onSuccess = render) {
  if (interactionBusy()) return;
  const focus = focusHint(focusedControl());
  const startingOverlay = ui.overlay;
  snapshotForm();
  ui.committing = true;
  markRequestBusy(true);
  let result;
  let failure;
  try {
    result = await write();
    useSnapshot(result);
  } catch (error) {
    failure = error;
  } finally {
    ui.committing = false;
    markRequestBusy(false);
  }
  if (failure) { requestFailure(failure, focus); return; }

  Object.assign(ui, { dirty: false, error: '', discard: false });
  if (ui.overlay) ui.overlay.values = undefined;
  onSuccess(result);
  if (ui.overlay && ui.overlay === startingOverlay) focusDialog(focus);
  if (message) toast(message);
}

function mutate(path, body, message, onSuccess, options) {
  return commit(() => api.write(path, body, options), message, onSuccess);
}

async function reloadWorkspace() {
  if (!ui.account || interactionBusy()) return;
  if (ui.dirty && !window.confirm('Reload the latest saved data and discard your unsaved form changes?')) return;
  ui.reloading = true;
  markRequestBusy(true);
  explanationCache.clear();
  let failure;
  try {
    await loadWorkspace();
  } catch (error) {
    failure = error;
  } finally {
    ui.reloading = false;
    markRequestBusy(false);
  }
  if (failure) {
    ui.workspaceError = failure.message;
    requestFailure(failure);
    return;
  }
  if (ui.overlay) closeOverlay(true);
  else render();
  toast('Latest server data loaded.');
}

const draftPath = id => '/api/drafts/' + encodeURIComponent(id);
const orderPath = id => '/api/orders/' + encodeURIComponent(id);
const recoveryPath = id => '/api/recoveries/' + encodeURIComponent(id);

function approveAndSend(id, version) {
  return commit(async () => {
    const approved = await api.write(draftPath(id) + '/approval', { version });
    useSnapshot(approved);
    const orderId = approved.recordId ?? approved.state.orders.find(order => order.sourceDraftId === id)?.id;
    if (!orderId) throw new PantriApiError('The approval was saved. Refresh Purchasing to find its order.');
    ui.page = 'purchasing';
    ui.purchaseTab = 'orders';
    ui.overlay = { ...ui.overlay, type: 'order', id: orderId, back: null };
    try {
      return await api.write(orderPath(orderId) + '/dispatch');
    } catch (error) {
      error.message = 'The order is approved. Sending needs to be retried. ' + error.message;
      throw error;
    }
  }, 'Purchase approved and sent to supplier.', () => { render(); focusDialog(); });
}

function refreshDrafts(drafts) {
  return commit(async () => {
    let result;
    for (const draft of drafts) {
      result = await api.write(draftPath(draft.id) + '/refresh', { version: draft.version });
      useSnapshot(result);
    }
    return result;
  }, drafts.length === 1 ? 'Recommendation refreshed from current inventory.' : 'Draft recommendations refreshed from current inventory.');
}

function openReceiving(orderId, preferredIngredient) {
  const order = ui.state.orders.find(order => order.id === orderId);
  const line = order?.approvedLines.find(line =>
    (!preferredIngredient || line.ingredientId === preferredIngredient) &&
    line.managerQty > (order.receivedQuantities[line.ingredientId] ?? 0));
  if (line && order.sentAt) openOverlay({
    type: 'record', kind: 'receipt', ingredientId: line.ingredientId, orderId,
  }, ui.overlay);
}

function download(value, name, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadRecoveryCopy(checkpoint) {
  try {
    if (checkpoint) {
      const result = await api.read('/api/checkpoints/previous');
      download(JSON.stringify(result.checkpoint, null, 2), 'PANTRI_prior_checkpoint.json');
    } else {
      const result = await api.read('/api/storage/raw');
      download(result.raw, 'PANTRI_saved_recovery.txt', 'text/plain');
    }
  } catch (error) {
    requestFailure(error);
  }
}

root.addEventListener('click', event => {
  const element = event.target.closest('[data-action]');
  if (!element || element.disabled) return;
  const { action, id } = element.dataset;
  if (action === 'backdrop' && event.target !== element) return;
  event.preventDefault();
  if (interactionBusy()) return;

  if (action === 'sign-in') return void signIn(id);
  if (action === 'retry-accounts') return void (!ui.account && api.hasSession() ? startBrowser() : loadAccounts());
  if (!ui.account) return;

  switch (action) {
    case 'backdrop':
    case 'close-overlay':
      return closeOverlay();
    case 'discard':
    case 'back-draft':
      return closeOverlay(true);
    case 'keep-editing':
      ui.discard = false;
      render();
      return focusDialog(ui.overlay.editFocus);
    case 'switch-role':
      openOverlay({ type: 'switch-role' }, ui.overlay);
      if (!ui.accounts.length) void loadAccounts();
      return;
    case 'reload':
      return void reloadWorkspace();
    case 'reset':
      return openOverlay({ type: 'reset' }, ui.overlay);
    case 'confirm-reset':
      return void mutate('/api/demo/reset', {}, 'Demo reset to the original restaurant dataset.', () => {
        Object.assign(ui, workspaceDefaults(ui.account.role));
        explanationCache.clear();
        render();
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
    case 'export-checkpoint':
    case 'export-raw':
      return void downloadRecoveryCopy(action === 'export-checkpoint');
  }

  if (workspaceNavigation(ui.account.role).some(([page]) => page === action)) return navigate(action);
  const state = ui.state;
  if (!state) return;
  if ((ui.account.role === 'manager' || action === 'movement-page') && handleClassroomAction(action, element)) return;
  switch (action) {
    case 'filter':
      return navigate('inventory', { risk: element.dataset.risk });
    case 'category':
      return navigate('inventory', { category: element.dataset.category });
    case 'clear-filters':
      Object.assign(ui, { filter: {}, pageNumber: 1 });
      return render();
    case 'prev':
    case 'next':
      ui.pageNumber += action === 'next' ? 1 : -1;
      return render();
    case 'purchase-tab':
      ui.purchaseTab = element.dataset.tab;
      return render();
    case 'waste-tab':
      ui.wasteTab = element.dataset.tab;
      return render();
    case 'ingredient':
    case 'order':
    case 'recovery':
      return openOverlay({ type: action, id, page: 1 }, ui.overlay?.type === 'history' ? ui.overlay : null);
    case 'draft':
    case 'supplier-order':
    case 'partner-request':
      return openOverlay({ type: action, id });
    case 'record':
      return openOverlay({ type: 'record', kind: element.dataset.kind, ingredientId: element.dataset.ingredient ?? 'ing-001' },
        ui.overlay?.type === 'ingredient' ? ui.overlay : null);
    case 'new-recovery':
      return openOverlay({ type: action });
    case 'review-approval':
      if (ui.dirty) {
        ui.error = 'Save your quantity changes before reviewing approval.';
        return render();
      }
      return openOverlay({ type: 'approval', id }, ui.overlay);
    case 'approve-send':
      return void approveAndSend(id, Number(element.dataset.version));
    case 'send-order':
      return void mutate(orderPath(id) + '/dispatch', {}, 'Approved order sent to supplier.');
    case 'receive-order':
      return openReceiving(element.dataset.order ?? id, element.dataset.ingredient);
    case 'new-draft-from-order':
      return void mutate(orderPath(id) + '/follow-up-drafts', {}, 'New draft created from current inventory.', result => {
        ui.purchaseTab = 'drafts';
        openOverlay({ type: 'draft', id: result.recordId ?? result.state.drafts.at(-1)?.id });
      });
    case 'refresh-draft': {
      if (ui.dirty) {
        ui.error = 'Save or discard quantity changes before recalculating.';
        return render();
      }
      const draft = state.drafts.find(draft => draft.id === id && draft.status === 'draft');
      if (draft) void refreshDrafts([draft]);
      return;
    }
    case 'refresh-drafts': {
      const drafts = state.drafts.filter(draft => draft.status === 'draft');
      if (drafts.length) void refreshDrafts(drafts);
      return;
    }
    case 'partner-pickup':
      return void mutate(recoveryPath(id) + '/collection', {}, 'Pickup recorded. Inventory updated.');
    case 'cancel-recovery':
      return void mutate(recoveryPath(id) + '/cancellation', {}, 'Request cancelled and reservation released.');
    case 'demo':
      return openOverlay({ type: 'demo' });
    case 'simulate-supplier':
    case 'simulate-recovery':
    case 'simulate-pickup':
      return openOverlay({ type: action }, ui.overlay);
    case 'export':
      download(JSON.stringify(state, null, 2), `PANTRI_demo_${state.demoDate}.json`);
      return toast('Demo data exported with records and approval snapshots.');
  }
});

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

root.addEventListener('change', event => {
  const field = event.target;
  switch (field.id) {
    case 'category-filter':
      ui.filter.category = field.value;
      ui.pageNumber = 1;
      return render();
    case 'risk-filter':
      ui.filter.risk = field.value;
      delete ui.filter.primaryRisk;
      ui.pageNumber = 1;
      return render();
    case 'page-size':
      ui.pageSize = Number(field.value);
      ui.pageNumber = 1;
      return render();
    case 'order-filter':
      ui.orderFilter = field.value;
      return render();
    case 'waste-period':
      ui.wastePeriod = field.value;
      ui.wastePage = 1;
      return render();
  }
  const overlay = ui.overlay;
  if (!overlay) return;
  if (field.name === 'ingredientId') {
    snapshotForm();
    overlay.ingredientId = field.value;
    for (const name of ['batchId', 'quantity', 'countedQuantity', 'unitCost', 'expiresOn']) delete overlay.values[name];
    ui.dirty = true;
    render({ capture: false });
  } else if (field.name === 'batchId' && overlay.type === 'record' && overlay.kind === 'count') {
    snapshotForm();
    delete overlay.values.countedQuantity;
    render({ capture: false });
  } else if (field.name === 'batchId' && overlay.type === 'new-recovery') {
    snapshotForm();
    render();
  }
});

function movementInput(state, overlay, values) {
  const item = state.ingredients.find(item => item.id === values.ingredientId);
  const reason = values.note ? (values.reason ?? '') + ': ' + values.note : values.reason;
  const common = { kind: overlay.kind, ingredientId: item.id, unit: item.unit, reason };
  if (overlay.kind === 'receipt') return {
    ...common,
    quantity: Number(values.quantity), expiresOn: values.expiresOn || null,
    unitCostCents: values.unitCost?.trim() ? Math.round(Number(values.unitCost) * 100) : null,
    orderId: overlay.orderId,
  };
  if (overlay.kind === 'count') return { ...common, batchId: values.batchId, countedQuantity: Number(values.countedQuantity) };
  return { ...common, batchId: values.batchId, quantity: Number(values.quantity) };
}

root.addEventListener('submit', event => {
  const form = event.target;
  const kind = form.dataset.form;
  if (!kind) return;
  event.preventDefault();
  const { state, overlay } = ui;
  if (interactionBusy() || !state || !overlay) return;
  const values = Object.fromEntries(new FormData(form, event.submitter));
  switch (kind) {
    case 'inventory-record':
      return void mutate('/api/inventory/records', movementInput(state, overlay, values), 'Inventory record saved.', () => closeOverlay(true));
    case 'draft': {
      const draft = state.drafts.find(draft => draft.id === overlay.id);
      const edits = draft.lines.map(line => ({ ingredientId: line.ingredientId, managerQty: Number(values['qty_' + line.ingredientId]) }));
      return void mutate(draftPath(overlay.id), { version: Number(values.version), edits }, 'Draft saved. Approval is required.', undefined, { method: 'PATCH' });
    }
    case 'supplier-response': {
      const simulate = overlay.type === 'simulate-supplier';
      const body = { kind: values.kind, note: values.note, ...(simulate ? { simulate } : {}) };
      const path = orderPath(simulate ? values.transactionId : overlay.id) + '/supplier-events';
      return void mutate(path, body, simulate ? 'Simulated supplier response recorded.' : 'Supplier response recorded.');
    }
    case 'recovery-request': {
      const body = {
        batchId: values.batchId, quantity: Number(values.quantity), partnerId: values.partnerId,
        requestedWindow: values.requestedWindow, note: values.note,
      };
      return void mutate('/api/recoveries', body, 'Recovery requested. Quantity reserved.', result => {
        ui.wasteTab = 'recovery';
        openOverlay({ type: 'recovery', id: result.recordId ?? result.state.recoveries.at(-1)?.id });
      });
    }
    case 'partner-response': {
      const simulate = overlay.type === 'simulate-recovery';
      const body = { kind: values.kind, note: values.note, ...(simulate ? { simulate } : {}) };
      const path = recoveryPath(simulate ? values.transactionId : overlay.id) + '/partner-events';
      return void mutate(path, body, simulate ? 'Simulated partner response recorded.' : 'Recovery response recorded.');
    }
    case 'pickup-simulation':
      return void mutate(recoveryPath(values.transactionId) + '/collection', { simulate: true }, 'Simulated pickup recorded. Inventory updated.', () => closeOverlay(true));
  }
});

document.addEventListener('keydown', event => {
  if (interactionBusy()) return;
  // An open custom dropdown handles its own Escape and Tab keys.
  if ((event.key === 'Escape' || event.key === 'Tab') && selectIsOpen()) return;
  if (!ui.overlay) {
    if (event.key === 'Escape' && ui.chartDate && root.querySelector('.paired-chart')) setChartDay(ui.chartDate);
    return;
  }
  if (event.key === 'Escape') { event.preventDefault(); closeOverlay(); return; }
  if (event.key === 'Tab') {
    const target = tabBoundaryTarget(dialogControls(root.querySelector('[role="dialog"]')), focusedControl(), event.shiftKey);
    if (target) { event.preventDefault(); target.focus(); }
  }
});

window.addEventListener('resize', () => placeNavPill(false));
root.addEventListener('mouseover', event => setRail(!!event.target.closest?.('.sidebar')));
document.documentElement.addEventListener('mouseleave', () => setRail(false));
void startBrowser();
