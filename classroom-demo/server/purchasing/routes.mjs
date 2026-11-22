import { approveDraft, createDraftFromOrder, editDraft, eventTime, qty, recordSupplierEvent,
  refreshDraft, sendApprovedOrder, validQuantity, validTimestamp } from '../../src/domain.js';
import { requirePartner, scopedState } from '../continuity/access.mjs';
import { check, fields, findRecord, identifier, oneOf, route, text, version } from '../validation.mjs';

const managers = ['manager'];

function updateDraft({ body, state, id, op, commit, present }) {
  fields(body, ['version', 'edits', 'operationId']);
  const draft = findRecord(state.drafts, id, 'Draft');
  const currentVersion = version(body.version);
  check(Array.isArray(body.edits) && body.edits.length >= 1 && body.edits.length <= draft.lines.length,
    'Provide at least one valid draft line and no more than the number on the draft.');
  const ingredients = new Set();
  for (const edit of body.edits) {
    fields(edit, ['ingredientId', 'managerQty']);
    const ingredientId = identifier(edit.ingredientId, 'Ingredient');
    check(!ingredients.has(ingredientId), 'Each ingredient can appear once in the edits.');
    ingredients.add(ingredientId);
    const line = draft.lines.find(item => item.ingredientId === ingredientId);
    check(line && validQuantity(edit.managerQty, line.unit, true) && edit.managerQty === qty(edit.managerQty),
      'Enter a valid quantity for a line in this draft.');
  }
  return present(commit(current => editDraft(current, id, currentVersion, body.edits, op)), id);
}

function supplierResponse({ account, body, state, id, op, commit, present }) {
  fields(body, ['kind', 'note', 'occurredAt', 'operationId', 'simulate']);
  const order = findRecord(state.orders, id, 'Order');
  check(body.simulate === undefined || body.simulate === true, 'Simulation must be explicitly enabled or omitted.');
  requirePartner(account, order.supplierId, 'supplier', body.simulate);
  const kind = oneOf(body.kind, ['confirmed', 'partial', 'delayed', 'exception'], 'Supplier response');
  const note = text(body.note, 'Note', 500, { optional: true, allowEmpty: true }) || (
    body.simulate ? 'Simulated supplier response' : 'Supplier response recorded in the supplier portal'
  );
  const occurredAt = body.occurredAt === undefined ? eventTime(state) : body.occurredAt;
  check(validTimestamp(occurredAt), 'Use a local timestamp in YYYY-MM-DDTHH:mm:ss format.');
  const event = { id: op, restaurantId: state.restaurantId, transactionId: id, kind, note, occurredAt,
    recordedBy: account.label, simulated: body.simulate === true };
  return present(commit(current => recordSupplierEvent(current, event)), id);
}

export const purchaseRoutes = [
  route('GET', '/api/drafts', managers, ({ state }) => ({ drafts: state.drafts })),
  route('GET', '/api/drafts/:id', managers, ({ state, id }) => ({ draft: findRecord(state.drafts, id, 'Draft') })),
  route('GET', '/api/orders', ['manager', 'staff', 'supplier'], ({ state, account }) => ({
    orders: scopedState(state, account).orders,
  })),

  route('PATCH', '/api/drafts/:id', managers, updateDraft),
  route('POST', '/api/drafts/:id/refresh', managers, ({ body, state, id, op, commit, present }) => {
    fields(body, ['version', 'operationId']);
    findRecord(state.drafts, id, 'Draft');
    const currentVersion = version(body.version);
    return present(commit(current => refreshDraft(current, id, currentVersion, undefined, op)), id);
  }),
  route('POST', '/api/drafts/:id/approval', managers, ({ body, state, id, op, commit, present }) => {
    fields(body, ['version', 'operationId']);
    findRecord(state.drafts, id, 'Draft');
    const currentVersion = version(body.version);
    const next = commit(current => approveDraft(current, id, currentVersion, op));
    return present(next, next.orders.find(order => order.sourceDraftId === id)?.id);
  }),
  route('POST', '/api/orders/:id/dispatch', managers, ({ body, state, id, op, commit, present }) => {
    fields(body, ['operationId']);
    findRecord(state.orders, id, 'Order');
    return present(commit(current => sendApprovedOrder(current, id, op, 'Approved snapshot sent to the supplier workspace.')), id);
  }),
  route('POST', '/api/orders/:id/follow-up-drafts', managers, ({ body, state, id, op, commit, present }) => {
    fields(body, ['operationId']);
    findRecord(state.orders, id, 'Order');
    const next = commit(current => createDraftFromOrder(current, id, op));
    return present(next, next.drafts.find(draft => draft.createdByOperation === op)?.id);
  }),
  route('POST', '/api/orders/:id/supplier-events', ['manager', 'supplier'], supplierResponse),
];
