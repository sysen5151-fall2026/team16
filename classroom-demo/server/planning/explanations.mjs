import { findRecord } from '../validation.mjs';

// Each explanation has three parts:
//   summary  - PANTRI's own sentence with every number (always shown first, never written by the model)
//   facts    - qualitative facts the local model may use for its advice (no quantities)
//   fallback - the full calculated text shown when the model is unavailable or its advice fails checks
// knownNames lets the adapter reject advice that mentions any other ingredient.

const recent = (insights, ingredientId) => insights.find(item => item.ingredientId === ingredientId);
const reasonsOf = signal => (signal?.reasons ?? []).map(entry => (Array.isArray(entry) ? entry[0] : entry));
const namesOf = state => state.ingredients.map(item => item.name);

export function purchaseExplanation(state, draft, insights, ingredientId) {
  const line = ingredientId === null ? draft.lines[0] : findRecord(
    draft.lines.map(item => ({ ...item, id: item.ingredientId })), ingredientId, 'Draft ingredient',
  );
  if (!line) return null;
  const ingredient = findRecord(state.ingredients, line.ingredientId, 'Ingredient');
  const signal = recent(insights, ingredient.id);
  const { unit, forecastQty, usableStock, suggestedQty } = line;
  const basis = ingredient.name + ' has ' + usableStock + ' ' + unit + ' of usable stock against ' +
    forecastQty + ' ' + unit + ' of forecast demand. The pack-rounded recommendation is ' + suggestedQty + ' ' + unit + '.';
  const waste = signal
    ? 'Recent records show ' + signal.quantity + ' ' + unit + ' of waste for this ingredient.'
    : 'No waste for this ingredient was recorded in the current seven-day period.';
  const guidance = signal
    ? signal.guidance
    : 'Check that the forecast still matches expected service before setting the final quantity.';
  return {
    kind: 'draft',
    summary: basis + ' ' + waste,
    facts: {
      ingredient: ingredient.name,
      purchaseBasis: suggestedQty > 0 ? 'forecast demand exceeds usable stock' : 'usable stock covers forecast demand',
      recentWaste: signal
        ? 'recorded in the last seven days, reasons: ' + reasonsOf(signal).join(', ')
        : 'none recorded in the last seven days',
      decision: 'the restaurant manager sets and approves the final quantity',
    },
    knownNames: namesOf(state),
    fallback: basis + ' ' + waste + ' ' + guidance,
  };
}

export function wasteExplanation(state, insight) {
  if (!insight) return null;
  const recorded = 'Recorded waste for ' + insight.name + ' was ' + insight.quantity + ' ' + insight.unit +
    ' across ' + insight.count + (insight.count === 1 ? ' record' : ' records') + ' in the selected period.';
  return {
    kind: 'waste',
    summary: recorded,
    facts: {
      ingredient: insight.name,
      wasteReasons: reasonsOf(insight),
      pattern: insight.count > 1 ? 'repeated in the period' : 'recorded once in the period',
    },
    knownNames: namesOf(state),
    fallback: recorded + ' ' + insight.guidance,
  };
}
