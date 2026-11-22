import { addDays, getIngredientSummary, qty, selectInventory } from '../../src/domain.js';
import { isAwaitingReceiving, reportRange, selectWasteEvents, selectWastePlanning, summarizeWaste } from '../../src/planning.js';
import { assistantExamples, similarIngredients } from './interpretation.mjs';

const limit = 5;
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const dates = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' });
const dateText = value => value ? dates.format(new Date(value + 'T12:00:00Z')) : 'unknown';
const label = value => value.replaceAll('_', ' ');
const answer = (text, items = [], total = items.length) => ({ text, items, total });

function list(items, singular, plural, emptyText) {
  if (!items.length) return answer(emptyText);
  const subject = items.length === 1 ? singular : plural;
  const suffix = items.length > limit ? '. Showing the first ' + limit + '.' : '.';
  return answer(items.length + ' ' + subject + suffix, items.slice(0, limit), items.length);
}

function stock(state, ingredientId) {
  const { id, name, unit, onHand, usableStock, reserved, reorderPoint, status, nearest } = getIngredientSummary(state, ingredientId);
  const text = name + ': ' + onHand + ' ' + unit + ' on hand, ' + usableStock + ' ' + unit + ' usable, ' +
    reserved + ' ' + unit + ' reserved. Reorder point ' + reorderPoint + ' ' + unit +
    '. Status: ' + label(status) + '. Nearest expiration: ' + dateText(nearest) + '.';
  return answer(text, [{ id, name, unit, onHand, usableStock, reserved, reorderPoint, status, nearest }]);
}

function lowStock(state) {
  const items = selectInventory(state, { risk: 'low' }).map(({ id, name, unit, usableStock, reorderPoint }) => ({
    id, name, unit, usableStock, reorderPoint,
    text: name + ': ' + usableStock + ' ' + unit + ' usable (reorder point ' + reorderPoint + ' ' + unit + ').',
  }));
  return list(items, 'ingredient below its reorder point', 'ingredients below their reorder points',
    'No ingredients are below their reorder points.');
}

function expiring(state, ingredient) {
  const names = new Map(state.ingredients.map(item => [item.id, item]));
  const cutoff = addDays(state.demoDate, 3);
  const items = state.batches.filter(batch => batch.restaurantId === state.restaurantId &&
    names.has(batch.ingredientId) && (!ingredient || batch.ingredientId === ingredient.id) &&
    batch.quantity > 0 && batch.expiresOn && batch.expiresOn <= cutoff)
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn))
    .map(({ id, ingredientId, quantity, expiresOn }) => {
      const { name, unit } = names.get(ingredientId);
      const status = expiresOn < state.demoDate ? 'expired' : 'expiring';
      const verb = status === 'expired' ? 'expired' : 'expires';
      return { id, ingredientId, name, quantity, unit, expiresOn, status,
        text: name + ': ' + quantity + ' ' + unit + ' ' + verb + ' ' + dateText(expiresOn) + '.' };
    });
  const scope = ingredient ? ' for ' + ingredient.name : '';
  return list(items, 'expired or soon-to-expire batch' + scope, 'expired or soon-to-expire batches' + scope,
    'No expired or soon-to-expire batches' + scope + '.');
}

function drafts(state, ingredient) {
  const names = new Map(state.ingredients.map(item => [item.id, item.name]));
  const items = state.drafts.toReversed().flatMap(draft => draft.lines
    .filter(line => !ingredient || line.ingredientId === ingredient.id)
    .map(({ ingredientId, suggestedQty, managerQty, unit, unitCostCents }) => {
      const name = names.get(ingredientId);
      const estimateCents = Number.isFinite(unitCostCents) ? Math.round(managerQty * unitCostCents) : null;
      const estimate = estimateCents === null ? 'estimate unavailable' : 'estimated ' + dollars.format(estimateCents / 100);
      return { id: draft.id, ingredientId, name, suggestedQty, managerQty, unit, estimateCents, status: draft.status,
        text: name + ' · ' + draft.supplierId + ': ' + suggestedQty + ' ' + unit + ' suggested, ' +
          managerQty + ' ' + unit + ' manager quantity, ' + estimate + '. Status: ' + label(draft.status) + '.' };
    }));
  return list(items, 'purchase draft line', 'purchase draft lines', 'No purchase draft lines match that question.');
}

function orders(state, role, ingredient) {
  const manager = role === 'manager';
  const items = state.orders.toReversed().filter(order => manager ? order.sentAt : isAwaitingReceiving(order))
    .filter(order => !ingredient || order.approvedLines.some(line => line.ingredientId === ingredient.id &&
      (manager || (order.receivedQuantities[line.ingredientId] ?? 0) < line.managerQty)))
    .map(({ id, supplierId, supplierStatus, fulfillmentStatus }) => ({
      id, supplierId, fulfillmentStatus, ...(manager && { supplierStatus }),
      text: id + ' · ' + supplierId + ': ' + (manager ? 'supplier ' + label(supplierStatus) + ' · ' : '') +
        'receiving ' + label(fulfillmentStatus) + '.',
    }));
  return manager ? list(items, 'sent order', 'sent orders', 'No sent orders match that question.')
    : list(items, 'order awaiting receiving', 'orders awaiting receiving', 'No orders awaiting receiving match that question.');
}

function waste(state, ingredient, period) {
  const range = period === 'all' ? null : reportRange(state, period);
  const events = selectWasteEvents(state, range, ingredient?.id);
  const coverage = summarizeWaste(state, events);
  const groups = selectWastePlanning(state, range).filter(group => !ingredient || group.ingredientId === ingredient.id);
  const reasons = new Map();
  const items = groups.map(({ ingredientId, name, quantity, unit, count, mainReason, reasons: groupReasons }) => {
    for (const [reason, occurrences] of groupReasons) reasons.set(reason, (reasons.get(reason) ?? 0) + occurrences);
    return { ingredientId, name, quantity, unit, count, mainReason,
      text: name + ': ' + quantity + ' ' + unit + ' across ' + count + ' ' + (count === 1 ? 'record' : 'records') +
        '. Main reason: ' + mainReason + '.' };
  });
  const when = { today: 'Today (' + dateText(state.demoDate) + ')', week: 'Last seven demo days', all: 'All recorded dates' }[period];
  if (!events.length) return answer(when + ': no waste records' + (ingredient ? ' for ' + ingredient.name : '') + '.');
  const mainReason = [...reasons].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unspecified';
  const cost = coverage.missingCost === events.length ? 'cost unknown'
    : 'known cost ' + dollars.format(coverage.knownCostCents / 100) +
      (coverage.missingCost ? ' (' + coverage.missingCost + ' without costs)' : '');
  let quantity;
  if (ingredient && items.length) quantity = items[0].quantity + ' ' + items[0].unit;
  else if (coverage.missingMass === events.length) quantity = 'weight unknown';
  else quantity = qty(coverage.knownMassKg) + ' kg known weight' +
    (coverage.missingMass ? ' (' + coverage.missingMass + ' without weight)' : '');
  const text = when + ': ' + quantity + ' across ' + events.length +
    (events.length === 1 ? ' waste record. ' : ' waste records. ') + 'Main reason: ' + mainReason + '. ' +
    cost[0].toUpperCase() + cost.slice(1) + '.';
  return answer(text, items.slice(0, limit), items.length);
}

function recovery(state) {
  const items = state.recoveries.toReversed().map(({ id, partnerId, status }) => ({
    id, partnerId, status, text: id + ' · ' + partnerId + ': ' + label(status) + '.',
  }));
  return list(items, 'recovery request', 'recovery requests', 'No recovery requests are recorded.');
}

function missingIngredient(question, state, role, { mentions, interpretation }, closeNames) {
  const names = mentions.length ? state.ingredients.filter(item => mentions.includes(item.id)).slice(0, 3).map(item => item.name)
    : closeNames ?? similarIngredients(question, state.ingredients);
  const wastePeriod = { today: ' today', week: ' this week', all: ' over all time' }[interpretation.period] ?? '';
  const rephrase = {
    stock_level: name => 'How much ' + name + ' do we have?',
    expiring: name => 'When does ' + name + ' expire?',
    purchase_suggestion: name => 'What is the purchase suggestion for ' + name + '?',
    order_status: name => 'What is the order status for ' + name + '?',
    waste_summary: name => 'How much ' + name + ' did we waste' + wastePeriod + '?',
  }[interpretation.intent];
  return {
    answer: answer(mentions.length ? 'I found more than one ingredient. Choose one to check.'
      : names.length ? 'I could not identify the ingredient. Did you mean one of these?'
      : 'I could not identify an ingredient. Ask with its name as shown in Inventory.'),
    suggestions: names.length ? names.map(rephrase) : assistantExamples(role),
  };
}

function hasIngredientTarget(question) {
  const parts = question.split(/\b(?:for|of|with)\s+/i);
  const afterPreposition = parts.length > 1 ? parts.at(-1) : null;
  const beforeVerb = /\b(?:when (?:does|will)|how much)\s+(.+?)\s+(?:expire|did we (?:waste|discard))\b/i.exec(question)?.[1];
  const target = beforeVerb ?? afterPreposition;
  if (!target) return false;
  return !/\b(?:ingredients?|orders?|drafts?|records?|stock|time|waste|batches|today|week|days|suppliers?|deliveries)\b/i.test(target);
}

export function buildAnswer(question, state, role, result) {
  const { interpretation: { intent, ingredientId, period }, denied, mentions } = result;
  const ingredient = state.ingredients.find(item => item.id === ingredientId);
  const suggestions = assistantExamples(role);
  if (denied) return { answer: answer(denied + ' are available to the restaurant manager.'), suggestions };
  if (intent === 'stock_level' && !ingredient) return missingIngredient(question, state, role, result);
  if (['expiring', 'purchase_suggestion', 'order_status', 'waste_summary'].includes(intent) && !ingredient) {
    const closeNames = similarIngredients(question, state.ingredients, { includePartial: false });
    if (mentions.length > 1 || closeNames.length || hasIngredientTarget(question)) {
      return missingIngredient(question, state, role, result, closeNames.length ? closeNames : undefined);
    }
  }
  const build = {
    stock_level: () => stock(state, ingredientId),
    low_stock: () => lowStock(state),
    expiring: () => expiring(state, ingredient),
    purchase_suggestion: () => drafts(state, ingredient),
    order_status: () => orders(state, role, ingredient),
    waste_summary: () => waste(state, ingredient, period ?? 'week'),
    recovery_status: () => recovery(state),
    help: () => answer(role === 'manager'
      ? 'Ask about ingredient stock, expiration, purchase drafts, sent orders, waste or recovery.'
      : 'Ask about ingredient stock, expiration or orders awaiting receiving.'),
    out_of_scope: () => answer(role === 'manager'
      ? 'I can only answer questions about inventory, orders, waste and recovery records.'
      : 'I can only answer questions about inventory and orders awaiting receiving.'),
  };
  return { answer: build[intent](), suggestions };
}
