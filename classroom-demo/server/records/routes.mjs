import { applyInventoryCommand, getIngredientSummary, qty, selectInventory, validDate, validQuantity } from '../../src/domain.js';
import { check, fields, findRecord, identifier, oneOf, route, text } from '../validation.mjs';

const operators = ['manager', 'staff'];
const risks = ['attention', 'healthy', 'low', 'expiring', 'expired', 'unknown'];
const movementKinds = ['receipt', 'usage', 'count', 'waste'];

function recordMovement(context) {
  const { body, state, account, op, commit, present } = context;
  const kind = oneOf(body.kind, movementKinds, 'Record type');
  const common = ['kind', 'ingredientId', 'batchId', 'unit', 'operationId', 'reason'];
  const receipt = kind === 'receipt';
  const quantityField = kind === 'count' ? 'countedQuantity' : 'quantity';
  fields(body, [...common, quantityField, ...(receipt ? ['expiresOn', 'unitCostCents', 'orderId'] : [])]);
  const ingredientId = identifier(body.ingredientId, 'Ingredient');
  const ingredient = findRecord(state.ingredients, ingredientId, 'Ingredient');
  const unit = body.unit;
  check(unit === ingredient.unit, 'Use the ingredient’s stock unit.');
  const quantity = body[quantityField];
  check(validQuantity(quantity, unit, kind === 'count') && quantity === qty(quantity),
    'Provide a valid quantity in the ingredient’s stock unit.');
  const reason = text(body.reason, 'Reason', 600, { optional: receipt, allowEmpty: receipt });
  const batchId = receipt && body.batchId === undefined ? undefined : identifier(body.batchId, 'Batch');
  if (batchId) findRecord(state.batches, batchId, 'Batch');

  const input = { kind, ingredientId, unit, batchId, [quantityField]: quantity, reason: reason || undefined,
    operationId: op, recordedBy: account.label };
  if (receipt) {
    check(body.expiresOn === null || validDate(body.expiresOn), 'Provide an expiration date or null.');
    const cents = body.unitCostCents;
    check(cents === null || (Number.isSafeInteger(cents) && cents >= 0 && cents <= 1e9),
      'Provide an integer unit cost in cents or null.');
    const orderId = body.orderId === undefined ? undefined : identifier(body.orderId, 'Order');
    if (orderId) findRecord(state.orders, orderId, 'Order');
    Object.assign(input, { expiresOn: body.expiresOn, unitCostCents: cents, orderId });
  }
  const next = commit(current => applyInventoryCommand(current, input));
  return present(next, next.inventoryEvents.find(event => event.operationId === op)?.id);
}

export const recordRoutes = [
  route('GET', '/api/inventory', operators, ({ state, query }) => {
    const risk = query.get('risk');
    if (risk !== null) oneOf(risk, risks, 'Risk');
    const category = text(query.get('category') ?? '', 'Category', 80, { allowEmpty: true });
    const search = text(query.get('query') ?? '', 'Query', 120, { allowEmpty: true });
    return { items: selectInventory(state, { risk, category, query: search }) };
  }),

  route('GET', '/api/inventory/:id', operators, ({ state, id }) => {
    findRecord(state.ingredients, id, 'Ingredient');
    return {
      item: getIngredientSummary(state, id),
      events: state.inventoryEvents.filter(event => event.ingredientId === id)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    };
  }),

  route('POST', '/api/inventory/records', operators, recordMovement),
];
