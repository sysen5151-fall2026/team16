import { calculateReport } from '../../src/domain.js';
import { reportRange, selectWastePlanning } from '../../src/planning.js';
import { purchaseExplanation, wasteExplanation } from '../planning/explanations.mjs';
import { check, findRecord, forbidden, identifier, oneOf, route } from '../validation.mjs';

function scopedReport(state, query) {
  const period = oneOf(query.get('period') ?? 'week', ['today', 'week'], 'Report period');
  const range = reportRange(state, period);
  return { range, insights: selectWastePlanning(state, range) };
}

export const presentationRoutes = [
  route('GET', '/api/snapshot', ['manager', 'staff', 'supplier', 'recovery', 'support'],
    ({ present, state, account, query, service }) => {
      const reload = query.get('reloadSaved');
      if (reload === null) return present(state);
      if (account.role !== 'manager') forbidden();
      check(reload === '1', 'Reload saved data expects a value of 1.');
      service.reload();
      return present(service.getSnapshot());
    }),
  route('GET', '/api/reports', ['manager'], ({ state, query }) => {
    const { range, insights } = scopedReport(state, query);
    return { report: calculateReport(state, range), wasteInsights: insights };
  }),
  route('GET', '/api/reports/waste-insights', ['manager'], async ({ state, query, explain }) => {
    const { range, insights } = scopedReport(state, query);
    const context = wasteExplanation(state, insights[0]);
    return { revision: state.revision, insights, explanation: context ? await explain(context) : null };
  }),
  route('GET', '/api/drafts/:id/explanation', ['manager'], async ({ state, id, query, explain }) => {
    const draft = findRecord(state.drafts, id, 'Draft');
    const ingredientId = query.get('ingredientId');
    if (ingredientId !== null) identifier(ingredientId, 'Ingredient');
    const insights = selectWastePlanning(state, reportRange(state, 'week'));
    const context = purchaseExplanation(state, draft, insights, ingredientId);
    return { revision: state.revision, explanation: context ? await explain(context) : null };
  }),
];
