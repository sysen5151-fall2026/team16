import { findRecord } from '../validation.mjs';

const recent = (insights, ingredientId) => insights.find(item => item.ingredientId === ingredientId);

export function purchaseExplanation(state, draft, insights, ingredientId) {
  const line = ingredientId === null ? draft.lines[0] : findRecord(
    draft.lines.map(item => ({ ...item, id: item.ingredientId })), ingredientId, 'Draft ingredient',
  );
  if (!line) return null;
  const ingredient = findRecord(state.ingredients, line.ingredientId, 'Ingredient');
  const signal = recent(insights, ingredient.id);
  const { unit, forecastQty, usableStock, suggestedQty, managerQty, unitCostCents } = line;
  const basis = ingredient.name + ' has ' + usableStock + ' ' + unit + ' of usable stock against ' +
    forecastQty + ' ' + unit + ' of forecast demand. The pack-rounded recommendation is ' + suggestedQty + ' ' + unit + '.';
  const waste = signal
    ? 'Recent records show ' + signal.quantity + ' ' + unit + ' of waste for this ingredient.'
    : 'No waste for this ingredient was recorded in the current seven-day period.';
  const alternate = 'The purchase recommendation for ' + ingredient.name + ' is ' + suggestedQty + ' ' + unit +
    ' after comparing ' + forecastQty + ' ' + unit + ' of forecast demand with ' + usableStock + ' ' + unit + ' of usable stock.';
  return {
    kind: 'draft',
    facts: { ingredientId: ingredient.id, ingredient: ingredient.name, demoDate: state.demoDate,
      draftVersion: draft.version, unit, forecastQty, usableStock, suggestedQty, managerQty, unitCostCents,
      latestWasteOn: signal?.latest.slice(0, 10) ?? null, recentWasteQty: signal?.quantity ?? 0 },
    fallback: basis + ' ' + waste,
    candidates: [alternate + ' ' + waste, waste + ' ' + basis],
  };
}

export function wasteExplanation(insight, range) {
  if (!insight) return null;
  const recorded = 'Recorded waste for ' + insight.name + ' was ' + insight.quantity + ' ' + insight.unit +
    ' in the selected period.';
  const review = insight.guidance;
  const focus = 'Consider reviewing prep or order quantities for ' + insight.name + ' against the ' +
    insight.quantity + ' ' + insight.unit + ' of recorded waste.';
  return {
    kind: 'waste',
    facts: {
      ingredientId: insight.ingredientId, ingredient: insight.name, quantity: insight.quantity,
      unit: insight.unit, recordCount: insight.count, latestWasteOn: insight.latest.slice(0, 10),
      from: range.start, through: range.end,
    },
    fallback: recorded + ' ' + review,
    candidates: [recorded + ' ' + review, focus + ' ' + review],
  };
}
