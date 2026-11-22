const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

function browserSource(...extra) {
  return ['domain.js', 'planning.js', 'views.js', 'pages.js', 'role-views.js', 'api-client.js', ...extra]
    .map(name => path.join(__dirname, '../src', name))
    .map(filename => readFileSync(filename, 'utf8').replace(/\r\n/g, '\n').trimEnd())
    .map(source => source.replace(/^import [^\n]+\n+/m, '').replace(/\nexport \{[\s\S]*?\};$/, ''))
    .join('\n');
}

function loadBrowserFunctions() {
  return vm.runInNewContext(
    browserSource() + '\n' +
      '({ createPantriApi, createSeed, approveDraft, sendApprovedOrder, getIngredientSummary, renderAccountCards, workspaceNavigation, renderStaffReceipts, supplierOrderOverlay, recoveryPartnerOverlay, renderSupportPage, explanationBlock, orderOverlay, recoveryOverlay, ingredientDetails, draftOverlay, renderReportsPage })',
    { AbortSignal, structuredClone, TextEncoder, crypto: require('node:crypto').webcrypto },
  );
}

function transportFixture(stored = new Map()) {
  const { createPantriApi } = loadBrowserFunctions();
  const calls = [];
  const replies = [];
  let count = 0;
  const api = createPantriApi({
    fetcher: async (url, options) => {
      calls.push({
        url, method: options.method, headers: options.headers,
        body: options.body ? JSON.parse(options.body) : undefined,
      });
      assert.ok(replies.length, 'unexpected request');
      return replies.shift()();
    },
    tokenStore: {
      getItem: key => stored.get(key),
      setItem: (key, token) => stored.set(key, token),
      removeItem: key => stored.delete(key),
    },
    operationId: () => 'test-operation-' + ++count,
  });
  const respond = (status, body) => replies.push(() => new Response(JSON.stringify(body), { status }));
  return { api, stored, calls, replies, respond };
}

const manager = { id: 'manager', role: 'manager', label: 'Restaurant Manager', name: 'MC' };
const supplier = { id: 'supplier', role: 'supplier', label: 'Ingredient Supplier', name: 'Prime Foods' };
const recovery = { id: 'recovery', role: 'recovery', label: 'Recovery Partner', name: 'Community Food Recovery' };
const ingredient = { id: 'ing-001', name: 'Sliced beef' };
const order = {
  id: 'PO-100', supplierId: 'Prime Foods', supplierStatus: 'awaiting_confirmation', fulfillmentStatus: 'partially_received',
  sentAt: '2026-10-21T09:00:00', receivedQuantities: { 'ing-001': 2 },
  approvedLines: [{ ingredientId: 'ing-001', managerQty: 5, unit: 'kg', unitCostCents: 1450 }], events: [],
};

test('browser transport uses the returned bearer token and keeps only that token in session storage', async () => {
  const { api, stored, calls, respond } = transportFixture();
  respond(200, { accounts: [manager, supplier] });
  assert.deepEqual((await api.accounts()).accounts, [manager, supplier]);
  assert.equal(calls[0].headers.Authorization, undefined);

  respond(201, { token: 'opaque-session', account: manager });
  assert.equal((await api.signIn('manager')).account.id, 'manager');
  assert.deepEqual([...stored.values()], ['opaque-session']);
  assert.equal(calls[1].url, '/api/sessions');
  assert.deepEqual(calls[1].body, { accountId: 'manager', operationId: 'test-operation-1' });

  respond(200, { account: manager, state: {}, storage: { revision: 1 } });
  await api.snapshot();
  assert.equal(calls[2].headers.Authorization, 'Bearer opaque-session');
  assert.equal(calls[2].url, '/api/snapshot');
});

test('lost mutation responses reuse their operation ID and a later intent receives a new ID', async () => {
  const { api, calls, respond, replies } = transportFixture();
  respond(201, { token: 'opaque-session', account: manager });
  await api.signIn('manager');
  const edits = { version: 1, edits: [{ ingredientId: 'ing-001', managerQty: 5 }] };
  replies.push(() => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(api.write('/api/drafts/draft-001', edits, { method: 'PATCH' }), {
    code: 'CONNECTION_LOST', retryable: true,
  });
  respond(200, { account: manager, state: {}, storage: { revision: 2 } });
  await api.write('/api/drafts/draft-001', edits, { method: 'PATCH' });
  assert.equal(calls[1].body.operationId, calls[2].body.operationId);
  assert.equal(calls[2].method, 'PATCH');

  respond(422, { code: 'INVALID_QUANTITY', message: 'Check the quantity.' });
  await assert.rejects(api.write('/api/drafts/draft-001', edits, { method: 'PATCH' }), {
    code: 'INVALID_QUANTITY', message: 'Check the quantity.', retryable: false,
  });
  assert.notEqual(calls[2].body.operationId, calls[3].body.operationId);
});

test('an expired session is cleared and anonymous health checks carry no token', async () => {
  const { api, stored, calls, respond } = transportFixture();
  respond(201, { token: 'expired-session', account: supplier });
  await api.signIn('supplier');
  respond(200, { status: 'ok' });
  await api.health();
  assert.equal(calls[1].headers.Authorization, undefined);
  respond(401, { code: 'UNAUTHORIZED', message: 'Sign in again.' });
  await assert.rejects(api.snapshot(), { status: 401 });
  assert.equal(api.hasSession(), false);
  assert.equal(stored.size, 0);
});

test('role navigation and staff receipts expose only scoped workflows', () => {
  const { renderAccountCards, workspaceNavigation, renderStaffReceipts } = loadBrowserFunctions();
  const cards = renderAccountCards([manager, supplier, recovery]);
  assert.match(cards, /Restaurant Manager/);
  assert.match(cards, /Prime Foods/);
  assert.match(cards, /Community Food Recovery/);
  const ids = role => Array.from(workspaceNavigation(role), ([page]) => page);
  assert.deepEqual(ids('manager'), ['overview', 'inventory', 'purchasing', 'waste', 'reports']);
  assert.deepEqual(ids('staff'), ['inventory']);
  assert.deepEqual(ids('supplier'), ['supplier']);
  assert.deepEqual(ids('recovery'), ['recovery-portal']);
  assert.deepEqual(ids('support'), ['support']);

  const html = renderStaffReceipts({ orders: [order, { ...order, id: 'PO-101', fulfillmentStatus: 'received' }], ingredients: [ingredient] });
  assert.match(html, /Orders awaiting receiving/);
  assert.match(html, /Sliced beef/);
  assert.match(html, /3 kg remaining/);
  assert.match(html, /data-order="PO-100"/);
  assert.doesNotMatch(html, /PO-101|approve-send|Reports/);
  assert.match(renderStaffReceipts({ orders: [], ingredients: [] }), /No orders awaiting receiving/);
});

test('external workspaces render their own actions and model explanations safely', () => {
  const { supplierOrderOverlay, recoveryPartnerOverlay, renderSupportPage, explanationBlock } = loadBrowserFunctions();
  const supplierBody = supplierOrderOverlay({ orders: [order], ingredients: [ingredient] }, { id: order.id }).body;
  assert.match(supplierBody, /Confirm order/);
  assert.match(supplierBody, /Partially confirm/);
  assert.match(supplierBody, /Report delay/);
  assert.match(supplierBody, /Report exception/);
  assert.doesNotMatch(supplierBody, /simulate|approve-send|receive-order/);

  const request = {
    id: 'REC-100', partnerId: recovery.name, requestedWindow: 'Today, 14:00–16:00', status: 'requested',
    lines: [{ ingredientId: ingredient.id, batchId: 'batch-001', quantity: 1, unit: 'kg' }], events: [],
  };
  const body = status => recoveryPartnerOverlay({ recoveries: [{ ...request, status }], ingredients: [ingredient] }, { id: request.id }).body;
  assert.match(body('requested'), /Accept request/);
  assert.match(body('requested'), /Decline request/);
  assert.doesNotMatch(body('requested'), /Record pickup|Cancel request/);
  assert.match(body('accepted'), /Record pickup/);
  assert.doesNotMatch(body('collected'), /Record pickup|Cancel request/);

  const support = renderSupportPage(null, {
    support: {
      health: { status: 'ok' },
      storage: { status: 'ready', hasCheckpoint: true, revision: 12, checkpointRevision: 11 },
      model: { status: 'ready', name: 'qwen2.5:3b' },
      logs: [{ type: 'http', event: '<invalid>', at: '2026-10-21T08:15:00', outcome: 'error', elapsedMs: 5 }],
    },
  });
  assert.match(support, /qwen2\.5:3b/);
  assert.match(support, /Checkpoint/);
  assert.match(support, /&lt;invalid&gt;/);
  assert.doesNotMatch(support, /<invalid>|Reset demo|Record receiving/);
  assert.match(explanationBlock({ source: 'calculated', text: '<review>' }), /Showing PANTRI's calculated summary/);
  assert.match(explanationBlock({ source: 'calculated', text: '<review>' }), /&lt;review&gt;/);
});

test('manager handoffs point to the real portals and explanations have independent update regions', () => {
  const { createSeed, orderOverlay, recoveryOverlay, ingredientDetails, draftOverlay, renderReportsPage } = loadBrowserFunctions();
  const state = createSeed();
  state.orders.push({ ...order, approvedVersion: 2, events: [], owner: 'Manager' });
  state.recoveries.push({
    id: 'REC-100', status: 'accepted', partnerId: recovery.name, events: [], owner: 'Manager',
    lines: [{ ingredientId: ingredient.id, batchId: 'batch-001', quantity: 1, unit: 'kg' }],
  });
  const purchase = orderOverlay(state, { id: order.id }).body;
  assert.match(purchase, /supplier portal/);
  assert.match(purchase, /data-action="switch-role"/);
  assert.doesNotMatch(purchase, /Apply simulated response/);
  const pickup = recoveryOverlay(state, { id: 'REC-100' }).body;
  assert.match(pickup, /recovery portal/);
  assert.match(pickup, /Cancel request/);
  assert.doesNotMatch(pickup, /Apply simulated response|data-action="collect"/);
  assert.match(draftOverlay(state, { id: 'draft-001' }).body, /data-explanation-scope="draft:draft-001"/);
  assert.match(renderReportsPage(state, { reportPeriod: 'today' }), /data-explanation-scope="reports:today"/);

  assert.match(ingredientDetails(state, { id: ingredient.id }).body, /No count adjustments recorded/);
  const count = {
    ...state.inventoryEvents[0], id: 'corr-1', kind: 'count', occurredAt: '2026-10-21T11:40:00',
    ingredientId: ingredient.id, recordedBy: 'Restaurant Staff',
  };
  state.inventoryEvents.push(count);
  const movements = ingredientDetails(state, { id: ingredient.id }).body;
  assert.match(movements, /Recorded by Restaurant Staff/);
  assert.match(movements, /11:40:00/);
  assert.match(movements, /Correction corr-1/);
  delete count.recordedBy;
  assert.match(ingredientDetails(state, { id: ingredient.id }).body, /Recorded by Unknown/);
});

function browserFixture(fetcher) {
  const handlers = new Map();
  const calls = [];
  let html = '';
  let renders = 0;
  let explanation;
  const root = {
    set innerHTML(value) {
      renders += 1;
      html = value;
      const scope = value.match(/data-explanation-scope="([^"]*)"/)?.[1];
      explanation = scope ? { dataset: { explanationScope: scope }, innerHTML: '' } : null;
    },
    querySelector: () => null,
    querySelectorAll: selector => selector === '[data-explanation-scope]' && explanation ? [explanation] : [],
    addEventListener: (name, listener) => handlers.set(name, listener),
  };
  const store = new Map();
  let random = 0;
  const context = vm.createContext({
    AbortSignal,
    structuredClone,
    crypto: { randomUUID: () => 'fixture-operation-' + ++random },
    FormData: class {
      constructor(form, submitter) {
        this.fields = Object.entries(submitter ? { ...form.values, [submitter.name]: submitter.value } : form.values);
      }
      [Symbol.iterator]() { return this.fields.values(); }
    },
    fetch: (url, options) => {
      const call = {
        url, method: options.method, authorization: options.headers.Authorization,
        body: options.body ? JSON.parse(options.body) : undefined,
      };
      calls.push(call);
      return fetcher(call);
    },
    sessionStorage: {
      getItem: key => store.get(key),
      setItem: (key, value) => store.set(key, value),
      removeItem: key => store.delete(key),
    },
    document: {
      getElementById: id => id === 'app' ? root : null,
      addEventListener() {},
      documentElement: { addEventListener() {} },
      body: { classList: { toggle() {}, remove() {} } },
      activeElement: null,
    },
    window: { scrollTo() {}, addEventListener() {} },
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame: callback => callback(),
    setTimeout: () => 0,
    clearTimeout() {},
  });
  Object.defineProperty(context, 'localStorage', { get() { throw Error('Browser must never use localStorage'); } });
  const ui = vm.runInContext(browserSource('shell.js', 'controller.js') + '\nui', context);
  return {
    ui, store, calls,
    get html() { return html; },
    get renders() { return renders; },
    get explanation() { return explanation?.innerHTML; },
    click(action, dataset = {}) {
      const target = { dataset: { action, ...dataset }, closest: () => target };
      handlers.get('click')({ target, preventDefault() {} });
    },
    submit(form, values, submitter) {
      handlers.get('submit')({ target: { dataset: { form }, values }, submitter, preventDefault() {} });
    },
  };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('browser boot displays an API connection failure and recovers the demo accounts', async () => {
  let online = false;
  const browser = browserFixture(async () => {
    if (!online) throw TypeError('Offline');
    return json({ accounts: [manager, supplier, recovery] });
  });
  await settle();
  assert.match(browser.html, /PANTRI could not reach the server/);
  assert.match(browser.html, /Retry/);
  assert.match(browser.html, /Demo sign-in, no real authentication/);
  online = true;
  browser.click('retry-accounts');
  await settle();
  assert.match(browser.html, /Restaurant Manager/);
  assert.doesNotMatch(browser.html, /PANTRI could not reach the server/);
  assert.equal(browser.store.size, 0);
});

test('the drawer keeps its inputs during an explanation and supports retrying an approved dispatch', async () => {
  const { createSeed, approveDraft, sendApprovedOrder } = loadBrowserFunctions();
  let state = createSeed();
  let finishExplanation;
  let dispatchFailed = false;
  let account = manager;
  const accept = result => {
    assert.equal(result.ok, true);
    state = { ...result.value, revision: state.revision + 1 };
  };
  const snapshot = (scoped, recordId) => json({ account, state: scoped, storage: { status: 'ready', revision: state.revision }, recordId });
  const browser = browserFixture(async ({ url, body }) => {
    switch (url) {
      case '/api/accounts': return json({ accounts: [manager, supplier] });
      case '/api/sessions':
        account = body.accountId === 'supplier' ? supplier : manager;
        return json({ token: 'fixture-session-' + account.id, account }, 201);
      case '/api/snapshot':
        return snapshot(account === manager ? state : { orders: state.orders.filter(order => order.sentAt), ingredients: [ingredient] });
      case '/api/drafts/draft-001/explanation':
        return new Promise(resolve => { finishExplanation = resolve; });
      case '/api/drafts/draft-001/approval':
        accept(approveDraft(state, 'draft-001', body.version, body.operationId));
        return snapshot(state, state.orders[0].id);
      default: {
        assert.equal(url, '/api/orders/' + state.orders[0].id + '/dispatch');
        if (!dispatchFailed) {
          dispatchFailed = true;
          return json({ code: 'TEMPORARY_FAILURE', message: 'Retry later.' }, 503);
        }
        accept(sendApprovedOrder(state, state.orders[0].id, body.operationId));
        return snapshot(state, state.orders[0].id);
      }
    }
  });
  await settle();
  browser.click('sign-in', { id: 'manager' });
  await settle();
  browser.click('purchasing');
  browser.click('draft', { id: 'draft-001' });
  assert.match(browser.html, /Manager quantity/);
  browser.ui.dirty = true;
  const beforeExplanation = browser.renders;
  finishExplanation(json({ revision: state.revision, explanation: { source: 'calculated', text: 'Review the recorded demand.' } }));
  await settle();
  assert.equal(browser.renders, beforeExplanation);
  assert.equal(browser.ui.dirty, true);
  assert.match(browser.explanation, /Showing PANTRI's calculated summary/);

  browser.ui.dirty = false;
  browser.click('review-approval', { id: 'draft-001' });
  browser.click('approve-send', { id: 'draft-001', version: '1' });
  await settle();
  assert.match(browser.html, /The order is approved\. Sending needs to be retried/);
  assert.match(browser.html, /Send approved order/);
  assert.equal(state.orders.length, 1);

  const id = state.orders[0].id;
  browser.click('send-order', { id });
  await settle();
  const dispatches = browser.calls.filter(call => call.url.endsWith('/dispatch'));
  assert.equal(dispatches.length, 2);
  assert.equal(dispatches[0].body.operationId, dispatches[1].body.operationId);
  assert.match(browser.html, /Awaiting confirmation/);

  browser.click('switch-role');
  browser.click('sign-in', { id: 'supplier' });
  await settle();
  assert.match(browser.html, /Supplier portal/);
  assert.match(browser.html, /Sliced beef/);
  assert.match(browser.html, /Awaiting confirmation/);
  assert.doesNotMatch(browser.html, /Recommendations &amp; drafts|Review draft|Demo tools/);
  assert.deepEqual([...browser.store.values()], ['fixture-session-supplier']);
});

async function waitFor(condition, description) {
  const end = Date.now() + 4000;
  while (Date.now() < end) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail('Timed out waiting for ' + description);
}

test('browser controls complete shared purchasing and recovery against the real API', async t => {
  const { createPantriServer } = await import('../server/http.mjs');
  const { getIngredientSummary } = loadBrowserFunctions();
  const directory = await mkdtemp(path.join(tmpdir(), 'pantri-browser-test-'));
  const server = createPantriServer({ dataFile: path.join(directory, 'state.json'), modelEnabled: false, logger() {} });
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = browserFixture(({ url, method, authorization, body }) => fetch(origin + url, {
    method,
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }));
  const onHand = () => getIngredientSummary(browser.ui.state, 'ing-001').onHand;
  const selectRole = async role => {
    if (browser.ui.account) browser.click('switch-role');
    browser.click('sign-in', { id: role });
    await waitFor(() => browser.ui.account?.role === role && !browser.ui.sessionBusy, role + ' workspace');
    assert.equal(browser.ui.workspaceError, '');
  };
  await waitFor(() => browser.ui.accounts.length === 5, 'all demo accounts');
  await selectRole('manager');
  assert.equal(onHand(), 8);
  browser.click('purchasing');
  browser.click('draft', { id: 'draft-001' });
  browser.submit('draft', { version: '1', 'qty_ing-001': '5' });
  await waitFor(() => browser.ui.state.drafts[0].version === 2, 'saved draft');
  browser.click('review-approval', { id: 'draft-001' });
  browser.click('approve-send', { id: 'draft-001', version: '2' });
  await waitFor(() => Boolean(browser.ui.state.orders[0]?.sentAt) && !browser.ui.committing, 'sent order');
  const orderId = browser.ui.state.orders[0].id;

  await selectRole('supplier');
  browser.click('supplier-order', { id: orderId });
  browser.submit('supplier-response', { kind: 'confirmed', note: 'Ready for delivery' });
  await waitFor(() => browser.ui.state.orders[0].supplierStatus === 'confirmed', 'supplier confirmation');
  browser.click('close-overlay');

  await selectRole('staff');
  assert.equal(onHand(), 8);
  assert.match(browser.html, /5 kg remaining/);
  browser.click('receive-order', { order: orderId, ingredient: 'ing-001' });
  browser.submit('inventory-record', { ingredientId: 'ing-001', quantity: '5', expiresOn: '2026-10-28', unitCost: '14.50', reason: 'Delivery recorded' });
  await waitFor(() => onHand() === 13, 'linked receipt');
  assert.equal(browser.ui.state.orders[0].fulfillmentStatus, 'received');
  browser.click('record', { ingredient: 'ing-001', kind: 'waste' });
  browser.submit('inventory-record', { ingredientId: 'ing-001', batchId: 'batch-001', quantity: '1', reason: 'Overproduction' });
  await waitFor(() => onHand() === 12, 'staff waste entry');

  await selectRole('manager');
  browser.click('waste');
  browser.click('waste-tab', { tab: 'recovery' });
  browser.click('new-recovery');
  browser.submit('recovery-request', { batchId: 'batch-001', quantity: '1', partnerId: recovery.name, requestedWindow: 'Today, 14:00–16:00', note: '' });
  await waitFor(() => browser.ui.state.recoveries.length === 1, 'recovery request');
  const requestId = browser.ui.state.recoveries[0].id;
  assert.equal(onHand(), 12);

  await selectRole('recovery');
  browser.click('partner-request', { id: requestId });
  browser.submit('partner-response', { note: 'Accepted for pickup' }, { name: 'kind', value: 'accepted' });
  await waitFor(() => browser.ui.state.recoveries[0].status === 'accepted', 'partner acceptance');
  browser.click('partner-pickup', { id: requestId });
  await waitFor(() => browser.ui.state.recoveries[0].status === 'collected', 'recorded pickup');
  browser.click('close-overlay');

  await selectRole('manager');
  assert.equal(onHand(), 11);
  assert.equal(browser.ui.state.recoveries[0].status, 'collected');
  browser.click('reports');
  browser.click('cost-period', { period: 'today' });
  await waitFor(() => browser.explanation?.includes("Showing PANTRI's calculated summary"), 'waste explanation');
  assert.match(browser.html, /Sliced beef/);

  await selectRole('support');
  assert.match(browser.html, /Support console/);
  assert.match(browser.html, /Healthy/);
  assert.match(browser.html, /Checkpoint revision/);
  assert.match(browser.html, /Operation log/);
  assert.doesNotMatch(browser.html, /Demo tools|Record receiving/);
});

test('an unresolved write keeps its operation ID after the tab reloads without saving its form text', async () => {
  const original = transportFixture();
  original.respond(201, { token: 'manager-session', account: manager });
  await original.api.signIn('manager');
  const path = '/api/inventory/records';
  const input = { kind: 'waste', quantity: 1, reason: 'Unsaved example reason' };
  original.replies.push(() => { throw new TypeError('Response lost'); });
  await assert.rejects(original.api.write(path, input), { code: 'CONNECTION_LOST' });
  const firstId = original.calls.at(-1).body.operationId;
  assert.doesNotMatch(JSON.stringify([...original.stored.values()]), /Unsaved example reason/);

  const reloaded = transportFixture(original.stored);
  reloaded.respond(200, { account: manager, state: {}, storage: { revision: 1 } });
  await reloaded.api.snapshot();
  reloaded.respond(200, { account: manager, state: {}, storage: { revision: 1 } });
  await reloaded.api.write(path, input);
  assert.equal(reloaded.calls.at(-1).body.operationId, firstId);
  assert.deepEqual([...reloaded.stored.values()], ['manager-session']);
});

test('returning to a draft retries a calculated explanation after startup', async () => {
  const state = loadBrowserFunctions().createSeed();
  let explanations = 0;
  const browser = browserFixture(async ({ url }) => {
    if (url === '/api/accounts') return json({ accounts: [manager] });
    if (url === '/api/sessions') return json({ token: 'manager-session', account: manager }, 201);
    if (url === '/api/snapshot') return json({ account: manager, state,
      storage: { status: 'ready', revision: state.revision } });
    assert.equal(url, '/api/drafts/draft-001/explanation');
    explanations++;
    const source = explanations === 1 ? 'calculated' : 'model';
    return json({ revision: state.revision, explanation: { source,
      text: source === 'model' ? 'Validated model explanation.' : 'Calculated while warming.' } });
  });
  await settle();
  browser.click('sign-in', { id: 'manager' });
  await settle();
  browser.click('purchasing');
  browser.click('draft', { id: 'draft-001' });
  await settle();
  assert.match(browser.explanation, /Calculated while warming/);
  browser.click('close-overlay');
  browser.click('draft', { id: 'draft-001' });
  await settle();
  assert.equal(explanations, 2);
  assert.match(browser.explanation, /Validated model explanation/);
});
