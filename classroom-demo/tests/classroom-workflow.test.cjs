const test = require('node:test');
const assert = require('node:assert/strict');
const pantri = require('./load-app.cjs')();

const ingredient = 'ing-001';
const batch = 'batch-001';
const stock = state => pantri.getIngredientSummary(state, ingredient).onHand;
const take = result => {
  assert.equal(result.ok, true, result.message);
  return result.value;
};

function inventory(state, kind, id, properties) {
  return take(pantri.applyInventoryCommand(state, {
    kind, operationId: id, ingredientId: ingredient, unit: 'kg', ...properties,
  }));
}

test('Revised purchase, simulated supplier response and actual partial receipts are distinct', () => {
  let state = pantri.createSeed();
  state = take(pantri.editDraft(state, 'draft-001', 1, [{ ingredientId: ingredient, managerQty: 5 }]));
  state = take(pantri.approveDraft(state, 'draft-001', 2, 'approve'));
  const orderId = state.orders[0].id;
  state = take(pantri.sendApprovedOrder(state, orderId, 'send'));
  state = take(pantri.recordSupplierEvent(state, {
    id: 'reply', restaurantId: state.restaurantId, transactionId: orderId,
    kind: 'confirmed', occurredAt: '2026-10-21T10:00:00', note: '5 kg confirmed',
  }));
  assert.equal(stock(state), 8);
  assert.equal(state.orders[0].fulfillmentStatus, 'not_received');
  assert.equal(pantri.selectOverview(state).pendingReceipts, 1);

  const receiving = { expiresOn: '2026-10-30', unitCostCents: 1450, orderId, reason: 'Actual delivery' };
  state = inventory(state, 'receipt', 'first delivery', { ...receiving, quantity: 2 });
  assert.equal(state.orders[0].fulfillmentStatus, 'partially_received');
  assert.equal(stock(state), 10);
  const invalid = pantri.applyInventoryCommand(state, {
    ...receiving, operationId: 'excess', ingredientId: ingredient, unit: 'kg', kind: 'receipt', quantity: 4,
  });
  assert.equal(invalid.ok, false);
  state = inventory(state, 'receipt', 'second delivery', { ...receiving, quantity: 3 });
  state = inventory(state, 'receipt', 'second delivery', { ...receiving, quantity: 3 });
  assert.equal(stock(state), 13);
  assert.equal(state.orders[0].fulfillmentStatus, 'received');
  assert.equal(state.orders[0].receivedQuantities[ingredient], 5);
  assert.equal(state.orders[0].approvedLines[0].managerQty, 5);
  assert.equal(pantri.selectOverview(state).pendingReceipts, 0);
  assert.equal(pantri.validateSaved(state), true);
});

test('Recovery reserves and releases inventory, while collection deducts stock once', () => {
  let state = pantri.createSeed();
  const request = { batchId: batch, quantity: 1, partnerId: 'Demo partner', requestedWindow: '14:00–16:00' };
  state = take(pantri.requestRecovery(state, request, 'reserve-one'));
  assert.equal(stock(state), 8);
  assert.equal(pantri.getIngredientSummary(state, ingredient).reserved, 1);
  state = take(pantri.cancelRecovery(state, state.recoveries[0].id, 'cancel-one'));
  assert.equal(pantri.getIngredientSummary(state, ingredient).reserved, 0);
  state = take(pantri.requestRecovery(state, request, 'reserve-two'));
  const recoveryId = state.recoveries.at(-1).id;
  state = take(pantri.recordRecoveryEvent(state, {
    id: 'accept', restaurantId: state.restaurantId, transactionId: recoveryId,
    kind: 'accepted', occurredAt: '2026-10-21T10:00:00', note: 'Pickup accepted',
  }));
  assert.equal(stock(state), 8);
  const wasteBefore = pantri.selectWasteEvents(state).length;
  state = take(pantri.recordCollection(state, recoveryId, 'collect'));
  state = take(pantri.recordCollection(state, recoveryId, 'collect'));
  assert.equal(stock(state), 7);
  assert.equal(pantri.getIngredientSummary(state, ingredient).reserved, 0);
  assert.equal(pantri.selectWasteEvents(state).length, wasteBefore);
  assert.equal(state.inventoryEvents.filter(event => event.kind === 'collection').length, 1);
  assert.equal(pantri.validateSaved(state), true);
});

test('Planning uses scoped waste records, preserves units and leaves the purchase quantity alone', () => {
  let state = pantri.createSeed();
  state = inventory(state, 'waste', 'record beef waste', { batchId: batch, quantity: 0.5, reason: 'Overproduction: trim test' });
  state = inventory(state, 'waste', 'record beef waste', { batchId: batch, quantity: 0.5, reason: 'Overproduction: trim test' });
  state = inventory(state, 'usage', 'record use', { batchId: batch, quantity: 0.5, reason: 'Service' });
  const range = pantri.reportRange(state, 'today');
  const signal = pantri.selectWastePlanning(state, range).find(item => item.ingredientId === ingredient);
  assert.equal(signal.quantity, 0.5);
  assert.equal(signal.unit, 'kg');
  assert.equal(signal.count, 1);
  assert.equal(signal.mainReason, 'Overproduction');
  assert.match(signal.guidance, /recorded usage/);
  assert.equal(state.drafts[0].lines[0].managerQty, 4);
  assert.match(pantri.draftOverlay(state, { id: 'draft-001' }).body, /Recent recorded waste/);
  assert.match(pantri.renderReportsPage(state, { reportPeriod: 'today' }), /Waste insights for planning/);
  assert.equal(pantri.selectWastePlanning(state, { start: '2026-10-12', end: '2026-10-13' }).length, 0);
});

test('Unknown receiving cost remains distinct from true zero in history and totals', () => {
  let state = pantri.createSeed();
  state = inventory(state, 'receipt', 'unknown cost', { quantity: 1, expiresOn: null, unitCostCents: null });
  const newBatch = state.batches.at(-1).id;
  assert.equal(state.batches.at(-1).unitCostCents, null);
  assert.equal(state.inventoryEvents.at(-1).unitCostCents, null);
  assert.equal(pantri.eligibleRecoveryBatches(state, ingredient).some(item => item.id === newBatch), false);
  state = inventory(state, 'waste', 'unknown cost waste', { batchId: newBatch, quantity: 1, reason: 'Spoilage' });
  state = inventory(state, 'receipt', 'zero cost', { quantity: 1, expiresOn: '2026-10-30', unitCostCents: 0 });
  assert.equal(state.batches.at(-1).unitCostCents, 0);
  const range = pantri.reportRange(state, 'today');
  const series = pantri.calculateReport(state, range).series[0];
  assert.equal(series.usageCostComplete, true);
  assert.equal(series.wasteCostComplete, false);
  const charges = pantri.summarizeWaste(state, pantri.selectWasteEvents(state, range, ingredient));
  assert.equal(charges.missingCost, 1);
  assert.equal(charges.knownMassKg, 1);
  assert.equal(pantri.validateSaved(state), true);
});

test('Full waste and movement histories remain reachable beyond the old limits', () => {
  let state = pantri.createSeed();
  for (let index = 1; index <= 45; index++) {
    state = inventory(state, 'waste', 'waste-' + index, {
      batchId: batch, quantity: 0.01, reason: 'History record ' + index,
    });
  }
  const html = pantri.renderWastePage(state, {
    wasteTab: 'waste', wasteIngredient: ingredient, wastePeriod: 'all', wastePage: 3,
  });
  assert.match(html, /31–45 of 45/);
  assert.match(html, /History record 1/);
  assert.match(pantri.ingredientDetails(state, { id: ingredient, page: 4 }).body, /Opening inventory/);
  assert.equal(pantri.paginate([1, 2, 3], 99, 2).page, 2);
});

test('Five entry pages render and use synthetic, matching report dates', () => {
  const state = pantri.createSeed();
  const ui = {
    reportPeriod: 'today', filter: {}, pageNumber: 1, pageSize: 12, purchaseTab: 'drafts',
    orderFilter: 'all', wasteTab: 'waste', wastePeriod: 'all', wastePage: 1,
  };
  assert.match(pantri.renderOverviewPage(state, ui), /Your kitchen\. <span>In balance/);
  assert.match(pantri.renderInventory(state, ui), /Record receiving/);
  assert.match(pantri.renderPurchasingPage(state, ui), /Review draft/);
  assert.match(pantri.renderWastePage(state, ui), /Waste log/);
  const report = pantri.renderReportsPage(state, ui);
  assert.match(report, /Oct 21, 2026/);
  assert.match(report, /Stockout rate/);
  assert.match(report, /Waste per 100 covers/);
  const week = pantri.reportRange(state, 'week');
  const weeklyWaste = pantri.summarizeWaste(state, pantri.selectWasteEvents(state, week));
  assert.equal(weeklyWaste.knownCostCents, 4313);
  assert.equal(weeklyWaste.knownCostCents,
    pantri.calculateReport(state, week).series.reduce((sum, day) => sum + day.wasteCents, 0));
});

test('Reset and conflict handling preserve the original demo storage', () => {
  const legacy = '{"legacy":"keep this"}';
  const data = new Map([['pantri.demo.v1', legacy]]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const first = pantri.createDemoService(storage);
  const second = pantri.createDemoService(storage);
  take(first.resetDemo());
  assert.equal(data.get('pantri.demo.v1'), legacy);
  const conflict = second.commit(state => pantri.editDraft(state, 'draft-001', 1, [
    { ingredientId: ingredient, managerQty: 5 },
  ]));
  assert.equal(conflict.code, 'CONFLICT');
  assert.equal(second.reload(), true);
  assert.equal(second.getSnapshot().revision, first.getSnapshot().revision);
  data.set(pantri.STORAGE_KEY, '{"broken":');
  assert.equal(second.reload(), false);
  assert.equal(second.getRaw(), '{"broken":');
});
