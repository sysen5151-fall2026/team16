const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtemp, readFile, rmdir, unlink, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');

async function fixture(t) {
  const { createPantriServer } = await import('../server/http.mjs');
  const directory = await mkdtemp(join(tmpdir(), 'pantri-api-'));
  const dataFile = join(directory, 'state.json');
  const servers = [];
  async function stop(server) {
    if (server.listening) await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
  t.after(async () => {
    for (const server of servers) await stop(server);
    await unlink(dataFile).catch(error => {
      if (error.code !== 'ENOENT') throw error;
    });
    await rmdir(directory);
  });

  async function start() {
    const server = createPantriServer({ dataFile, modelEnabled: false, logger: () => {} });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    async function send(path, { token, body, raw, method = 'GET', type = 'application/json' } = {}) {
      const headers = {};
      if (token) headers.authorization = 'Bearer ' + token;
      if (body !== undefined || raw !== undefined) headers['content-type'] = type;
      const response = await fetch('http://127.0.0.1:' + server.address().port + path, {
        method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
      });
      return { status: response.status, json: await response.json() };
    }
    async function signIn(accountId) {
      const response = await send('/api/sessions', {
        method: 'POST', body: { accountId, operationId: randomUUID() },
      });
      assert.equal(response.status, 201, JSON.stringify(response.json));
      assert.equal(response.json.account.role, accountId);
      return response.json.token;
    }
    async function write(token, path, body, method = 'POST') {
      return await send(path, { token, method, body: { operationId: randomUUID(), ...body } });
    }
    return { send, signIn, write, close: () => stop(server) };
  }
  return { start, dataFile };
}

const stateOf = response => {
  assert.equal(response.status, 200, JSON.stringify(response.json));
  return response.json.state;
};

async function approve(api, manager, id, version) {
  const response = await api.write(manager, '/api/drafts/' + id + '/approval', { version });
  stateOf(response);
  return response.json.recordId;
}

test('health and sign-in are usable from a fresh seeded directory', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const health = await api.send('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.json.storage.status, 'ready');
  assert.equal(health.json.model.status, 'disabled');
  const accounts = await api.send('/api/accounts');
  assert.deepEqual(accounts.json.accounts.map(account => account.role), [
    'manager', 'staff', 'supplier', 'recovery', 'support',
  ]);
  const signIn = { method: 'POST', body: { accountId: 'manager', operationId: 'sign-in' } };
  const login = await api.send('/api/sessions', signIn);
  const retry = await api.send('/api/sessions', signIn);
  assert.equal(login.status, 201);
  assert.equal(retry.json.token, login.json.token);
  const view = stateOf(await api.send('/api/snapshot', { token: login.json.token }));
  assert.equal(view.ingredients.length, 132);
  assert.equal(view.drafts.length, 3);
  const saved = JSON.parse(await readFile(env.dataFile, 'utf8'));
  assert.equal(saved.format, 'pantri-checkpoint-v1');
  assert.equal(saved.current.revision, 0);
  assert.equal((await api.send('/api/snapshot')).status, 401);
});

test('purchase, receiving, waste and collection preserve the classroom quantities across roles', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const manager = await api.signIn('manager');
  const staff = await api.signIn('staff');
  const supplier = await api.signIn('supplier');
  const partner = await api.signIn('recovery');
  const ingredientPath = '/api/inventory/ing-001';

  const draftView = await api.send('/api/drafts/draft-001', { token: manager });
  const line = draftView.json.draft.lines[0];
  assert.deepEqual([line.forecastQty, line.usableStock, line.suggestedQty, line.unitCostCents], [12, 8, 4, 1450]);
  const patch = { version: 1, edits: [{ ingredientId: 'ing-001', managerQty: 5 }], operationId: 'demo-edit' };
  const edits = await Promise.all([
    api.write(manager, '/api/drafts/draft-001', patch, 'PATCH'),
    api.write(manager, '/api/drafts/draft-001', patch, 'PATCH'),
  ]);
  assert.equal(stateOf(edits[0]).drafts[0].version, 2);
  assert.equal(stateOf(edits[1]).drafts[0].version, 2);
  const order = await approve(api, manager, 'draft-001', 2);
  assert.ok(order);
  const atApproval = JSON.parse(await readFile(env.dataFile, 'utf8')).current;
  assert.equal(atApproval.orders[0].sentAt, null);
  assert.equal(atApproval.orders[0].approvedLines[0].managerQty, 5);

  const sent = stateOf(await api.write(manager, '/api/orders/' + order + '/dispatch', {}));
  assert.equal(sent.orders[0].supplierStatus, 'awaiting_confirmation');
  const supplierView = stateOf(await api.send('/api/snapshot', { token: supplier }));
  assert.deepEqual(supplierView.orders.map(item => item.id), [order]);
  assert.equal(supplierView.drafts, undefined);
  const confirmed = stateOf(await api.write(supplier, '/api/orders/' + order + '/supplier-events', { kind: 'confirmed' }));
  assert.equal(confirmed.orders[0].supplierStatus, 'confirmed');
  assert.equal(confirmed.orders[0].fulfillmentStatus, 'not_received');
  const managerView = stateOf(await api.send('/api/snapshot', { token: manager }));
  assert.equal(managerView.partnerEvents[0].simulated, false);
  assert.equal(managerView.partnerEvents[0].recordedBy, 'Ingredient Supplier');
  assert.equal((await api.send(ingredientPath, { token: staff })).json.item.onHand, 8);

  const receipt = { kind: 'receipt', ingredientId: 'ing-001', unit: 'kg', quantity: 5,
    expiresOn: '2026-10-25', unitCostCents: 1450, orderId: order, operationId: 'actual-receipt' };
  const received = stateOf(await api.write(staff, '/api/inventory/records', receipt));
  assert.equal(received.orders[0].fulfillmentStatus, 'received');
  stateOf(await api.write(staff, '/api/inventory/records', receipt));
  let detail = (await api.send(ingredientPath, { token: manager })).json;
  assert.equal(detail.item.onHand, 13);
  const batchId = detail.item.batches.find(batch => batch.quantity === 5 && batch.expiresOn === '2026-10-25').id;

  stateOf(await api.write(staff, '/api/inventory/records', {
    kind: 'waste', ingredientId: 'ing-001', batchId, unit: 'kg', quantity: 1, reason: 'Overproduction',
  }));
  detail = (await api.send(ingredientPath, { token: manager })).json;
  assert.equal(detail.item.onHand, 12);
  assert.equal(detail.events.find(event => event.kind === 'waste').recordedBy, 'Restaurant Staff');
  const request = await api.write(manager, '/api/recoveries', {
    batchId, quantity: 1, partnerId: 'Community Food Recovery', requestedWindow: 'Today 3:00 PM',
  });
  stateOf(request);
  const recovery = request.json.recordId;
  assert.ok(recovery);
  const partnerView = stateOf(await api.send('/api/snapshot', { token: partner }));
  assert.deepEqual(partnerView.recoveries.map(item => item.id), [recovery]);
  assert.equal((await api.send(ingredientPath, { token: manager })).json.item.reserved, 1);
  stateOf(await api.write(partner, '/api/recoveries/' + recovery + '/partner-events', { kind: 'accepted' }));
  assert.equal((await api.send(ingredientPath, { token: manager })).json.item.onHand, 12);
  stateOf(await api.write(partner, '/api/recoveries/' + recovery + '/collection', { operationId: 'pickup' }));
  stateOf(await api.write(partner, '/api/recoveries/' + recovery + '/collection', { operationId: 'pickup' }));
  assert.equal((await api.send(ingredientPath, { token: manager })).json.item.onHand, 11);
  const insights = await api.send('/api/reports/waste-insights?period=today', { token: manager });
  assert.equal(insights.json.insights[0].name, 'Sliced beef');
  assert.equal(insights.json.explanation.source, 'calculated');

  await api.close();
  const restarted = await env.start();
  const nextManager = await restarted.signIn('manager');
  assert.equal((await restarted.send(ingredientPath, { token: nextManager })).json.item.onHand, 11);
  assert.equal(stateOf(await restarted.send('/api/snapshot', { token: nextManager })).orders[0].fulfillmentStatus, 'received');
});

test('sessions restrict both reads and writes to the authorized scope', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const manager = await api.signIn('manager');
  const staff = await api.signIn('staff');
  const supplier = await api.signIn('supplier');
  const recovery = await api.signIn('recovery');
  const support = await api.signIn('support');
  assert.equal((await api.send('/api/reports', { token: staff })).status, 403);
  assert.equal((await api.send('/api/inventory', { token: supplier })).status, 403);
  assert.equal((await api.send('/api/orders', { token: recovery })).status, 403);
  assert.equal((await api.write(staff, '/api/drafts/draft-001/approval', { version: 1 })).status, 403);
  assert.equal((await api.write(support, '/api/demo/reset', {})).status, 403);
  assert.equal((await api.write(recovery, '/api/inventory/records', {})).status, 403);
  assert.equal((await api.send('/api/support', { token: manager })).status, 403);
  assert.equal(stateOf(await api.send('/api/snapshot', { token: support })), null);

  const otherOrder = await approve(api, manager, 'draft-002', 1);
  stateOf(await api.write(manager, '/api/orders/' + otherOrder + '/dispatch', {}));
  assert.deepEqual((await api.send('/api/orders', { token: supplier })).json.orders, []);
  assert.equal((await api.write(supplier, '/api/orders/' + otherOrder + '/supplier-events', { kind: 'confirmed' })).status, 403);
  assert.equal((await api.write(manager, '/api/orders/' + otherOrder + '/supplier-events', { kind: 'confirmed' })).status, 403);
  stateOf(await api.write(manager, '/api/orders/' + otherOrder + '/supplier-events', { kind: 'confirmed', simulate: true }));

  const item = (await api.send('/api/inventory/ing-001', { token: manager })).json.item;
  const otherPartner = await api.write(manager, '/api/recoveries', {
    batchId: item.batches[0].id, quantity: 1, partnerId: 'Another Recovery Partner', requestedWindow: 'Today',
  });
  stateOf(otherPartner);
  assert.deepEqual((await api.send('/api/recoveries', { token: recovery })).json.recoveries, []);
  assert.equal((await api.write(recovery, '/api/recoveries/' + otherPartner.json.recordId + '/partner-events', { kind: 'accepted' })).status, 403);
  const diagnostics = await api.send('/api/support', { token: support });
  assert.equal(diagnostics.status, 200);
  assert.ok(diagnostics.json.logs.some(entry => entry.outcome === 'rejected'));
  assert.equal(JSON.stringify(diagnostics.json).includes(manager), false);
});

test('malformed inputs and version conflicts leave the saved transaction intact', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const manager = await api.signIn('manager');
  const path = '/api/inventory/records';
  assert.equal((await api.send(path, { token: manager, method: 'POST', raw: '{' })).status, 400);
  assert.equal((await api.send(path, { token: manager, method: 'POST', raw: '{}', type: 'text/plain' })).status, 415);
  assert.equal((await api.send(path, { token: manager, method: 'POST', raw: JSON.stringify('x'.repeat(33000)) })).status, 413);
  assert.equal((await api.write(manager, path, { kind: 'usage', ingredientId: 'ing-001', quantity: '1' })).status, 400);
  assert.equal((await api.write(manager, path, {
    kind: 'receipt', ingredientId: 'ing-001', unit: 'kg', quantity: 1,
    batchId: '', expiresOn: null, unitCostCents: null,
  })).status, 400);
  assert.equal((await api.write(manager, '/api/drafts/draft-001/approval', { version: 2 })).status, 409);
  assert.equal((await api.send('/api/reports?period=unknown', { token: manager })).status, 400);
  assert.equal((await api.send('/api/inventory/missing', { token: manager })).status, 404);
  assert.equal(JSON.parse(await readFile(env.dataFile, 'utf8')).current.revision, 0);
});

test('a schema-valid approval mismatch quarantines writes and keeps the last verified checkpoint', async t => {
  const env = await fixture(t);
  const initial = await env.start();
  const manager = await initial.signIn('manager');
  const id = await approve(initial, manager, 'draft-001', 1);
  stateOf(await initial.write(manager, '/api/orders/' + id + '/dispatch', {}));
  await initial.close();

  const damaged = JSON.parse(await readFile(env.dataFile, 'utf8'));
  damaged.current.orders[0].approvedLines[0].managerQty = 9;
  const saved = JSON.stringify(damaged);
  await writeFile(env.dataFile, saved, 'utf8');

  const restarted = await env.start();
  const newManager = await restarted.signIn('manager');
  const snapshot = await restarted.send('/api/snapshot', { token: newManager });
  assert.equal(snapshot.json.storage.status, 'quarantined');
  assert.equal(snapshot.json.storage.hasCheckpoint, true);
  const response = await restarted.write(newManager, '/api/orders/' + id + '/dispatch', {});
  assert.equal(response.status, 503);
  const prior = await restarted.send('/api/checkpoints/previous', { token: newManager });
  assert.equal(prior.json.checkpoint.orders[0].approvedLines[0].managerQty, 4);
  assert.equal((await restarted.send('/api/storage/raw', { token: newManager })).json.raw, saved);
  assert.equal(await readFile(env.dataFile, 'utf8'), saved);
});

test('reset seeds the demo once and leaves other sessions connected to the new data', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const manager = await api.signIn('manager');
  const staff = await api.signIn('staff');
  await approve(api, manager, 'draft-001', 1);
  const first = stateOf(await api.write(manager, '/api/demo/reset', { operationId: 'reset' }));
  const retry = stateOf(await api.write(manager, '/api/demo/reset', { operationId: 'reset' }));
  assert.equal(first.revision, retry.revision);
  assert.equal(first.orders.length, 0);
  assert.equal((await api.send('/api/inventory/ing-001', { token: staff })).json.item.onHand, 8);
});

test('an unavailable language model leaves the draft available with a calculated explanation', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const manager = await api.signIn('manager');
  const before = stateOf(await api.send('/api/snapshot', { token: manager }));
  const draft = await api.send('/api/drafts/draft-001/explanation', { token: manager });
  assert.equal(draft.status, 200);
  assert.equal(draft.json.explanation.source, 'calculated');
  assert.match(draft.json.explanation.text, /Sliced beef/);
  assert.equal(draft.json.revision, before.revision);
  assert.deepEqual(stateOf(await api.send('/api/snapshot', { token: manager })), before);
});

test('a delayed replay of an older reset preserves a newer run', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const manager = await api.signIn('manager');
  stateOf(await api.write(manager, '/api/demo/reset', { operationId: 'reset-a' }));
  stateOf(await api.write(manager, '/api/demo/reset', { operationId: 'reset-b' }));
  const saved = stateOf(await api.write(manager, '/api/inventory/records', {
    kind: 'waste', ingredientId: 'ing-001', batchId: 'batch-001', unit: 'kg',
    quantity: 1, reason: 'Overproduction',
  }));
  const replay = stateOf(await api.write(manager, '/api/demo/reset', { operationId: 'reset-a' }));
  assert.equal(replay.revision, saved.revision);
  assert.equal((await api.send('/api/inventory/ing-001', { token: manager })).json.item.onHand, 7);
});

test('external file change exposes the actual saved record and manager reload revalidates it', async t => {
  const env = await fixture(t);
  const api = await env.start();
  const manager = await api.signIn('manager');
  const staff = await api.signIn('staff');
  const orderId = await approve(api, manager, 'draft-001', 1);
  const correct = await readFile(env.dataFile, 'utf8');
  const changed = JSON.parse(correct);
  changed.current.orders[0].approvedLines[0].managerQty = 9;
  const damaged = JSON.stringify(changed);
  await writeFile(env.dataFile, damaged, 'utf8');

  assert.equal((await api.write(manager, '/api/orders/' + orderId + '/dispatch', {})).status, 409);
  assert.equal((await api.send('/api/storage/raw', { token: manager })).json.raw, damaged);
  assert.equal((await api.send('/api/snapshot?reloadSaved=1', { token: staff })).status, 403);
  assert.equal((await api.send('/api/snapshot?reloadSaved=1', { token: manager })).json.storage.status, 'quarantined');
  await writeFile(env.dataFile, correct, 'utf8');
  assert.equal((await api.send('/api/snapshot?reloadSaved=1', { token: manager })).json.storage.status, 'ready');
  assert.equal(stateOf(await api.write(manager, '/api/orders/' + orderId + '/dispatch', {})).orders[0].supplierStatus,
    'awaiting_confirmation');
});
