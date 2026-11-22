import { addDays, qty } from './domain.js';

function reportRange(state, period) {
  const end = state.demoDate;
  return { start: period === 'today' ? end : addDays(end, -6), end };
}

function isAwaitingReceiving(order) {
  return !!order.sentAt && order.fulfillmentStatus !== 'received';
}

function selectWasteEvents(state, range, ingredientId = '') {
  return state.inventoryEvents.filter(event => {
    if (event.restaurantId !== state.restaurantId || event.kind !== 'waste') return false;
    if (ingredientId && event.ingredientId !== ingredientId) return false;
    if (!range) return true;
    const date = event.occurredAt.slice(0, 10);
    return date >= range.start && date <= range.end;
  }).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function summarizeWaste(state, events) {
  const ingredients = new Map(state.ingredients.map(item => [item.id, item]));
  const knownCostByDay = new Map();
  let knownMassKg = 0;
  let missingCost = 0;
  let missingMass = 0;

  for (const event of events) {
    const quantity = Math.abs(event.quantityDelta);
    if (Number.isFinite(event.unitCostCents)) {
      const day = event.occurredAt.slice(0, 10);
      knownCostByDay.set(day, (knownCostByDay.get(day) ?? 0) + quantity * event.unitCostCents);
    } else {
      missingCost++;
    }
    const unitWeight = event.unit === 'kg' ? 1 : ingredients.get(event.ingredientId)?.unitWeightKg;
    if (Number.isFinite(unitWeight)) knownMassKg += quantity * unitWeight;
    else missingMass++;
  }

  return {
    knownCostCents: [...knownCostByDay.values()].reduce((total, cents) => total + Math.round(cents), 0),
    knownMassKg: qty(knownMassKg),
    missingCost,
    missingMass,
  };
}

const wastePlanningGuidance = {
  'preparation loss': 'Review prep quantities and trimming with the kitchen before setting the next order.',
  overproduction: 'Compare prepared quantities with recorded usage before revising the next order.',
  spoilage: 'Review batch expiration, usable stock and the timing of the next delivery.',
  expired: 'Review expiration dates and prioritize the remaining usable batches in the next plan.',
};

function selectWastePlanning(state, range) {
  // OpsCon §7 / N.10: make recorded waste usable in the next planning cycle.
  // Quantities keep their ingredient units. Manager approval still controls ordering.
  const ingredients = new Map(state.ingredients.map(item => [item.id, item]));
  const groups = new Map();
  for (const event of selectWasteEvents(state, range)) {
    const ingredient = ingredients.get(event.ingredientId);
    if (!ingredient || event.unit !== ingredient.unit) continue;
    const quantity = Math.abs(event.quantityDelta);
    if (quantity === 0) continue;
    let group = groups.get(ingredient.id);
    if (!group) {
      group = {
        ingredientId: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: 0,
        count: 0,
        latest: event.occurredAt,
        reasons: new Map(),
      };
      groups.set(ingredient.id, group);
    }

    const recordedReason = typeof event.reason === 'string' ? event.reason : '';
    const reason = recordedReason.split(':', 1)[0].trim() || 'Unspecified';
    group.quantity = qty(group.quantity + quantity);
    group.count++;
    group.reasons.set(reason, (group.reasons.get(reason) ?? 0) + 1);
  }

  return [...groups.values()].map(({ reasons, ...group }) => {
    const rankedReasons = [...reasons.entries()].sort((a, b) => b[1] - a[1]);
    const mainReason = rankedReasons[0][0];
    const key = mainReason.toLowerCase();
    const guidance = Object.hasOwn(wastePlanningGuidance, key)
      ? wastePlanningGuidance[key]
      : 'Review the recorded cause and usable stock before approving the next order.';
    return { ...group, reasons: rankedReasons, mainReason, guidance };
  }).sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest) || a.name.localeCompare(b.name));
}

function paginate(items, page, size) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(pages, Math.max(1, Number.isInteger(page) ? page : 1));
  const offset = (current - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    page: current,
    pages,
    start: items.length ? offset + 1 : 0,
    end: Math.min(items.length, offset + size),
    total: items.length,
  };
}

export { isAwaitingReceiving, reportRange, selectWasteEvents, selectWastePlanning, summarizeWaste };
