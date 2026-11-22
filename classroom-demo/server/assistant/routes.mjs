import { scopedState } from '../continuity/access.mjs';
import { fields, HttpError, route, text } from '../validation.mjs';
import { buildAnswer } from './answers.mjs';
import { interpretQuestion } from './interpretation.mjs';

function requireUsableRecords(service) {
  if (service.getProblem()) {
    throw new HttpError(503, 'STORAGE_UNAVAILABLE', 'Saved data needs reconciliation before answering questions.');
  }
}

async function askQuestion({ account, body, state, service, explain, audit }) {
  const start = performance.now();
  fields(body, ['question']);
  const question = text(body.question, 'Question', 300);
  requireUsableRecords(service);
  const scoped = scopedState(state, account);
  const ingredients = scoped.ingredients.filter(item => item.restaurantId === scoped.restaurantId);
  const result = await interpretQuestion(question, ingredients, account.role, explain.interpretQuestion);
  requireUsableRecords(service);
  const response = buildAnswer(question, scoped, account.role, result);
  audit.record({
    type: 'assistant', event: 'Assistant question', role: account.role,
    intent: result.interpretation.intent, understoodBy: result.understoodBy,
    model: explain.health().name, outcome: result.understoodBy, reason: result.reason,
    elapsedMs: Math.round(performance.now() - start),
  });
  return { revision: scoped.revision, understoodBy: result.understoodBy,
    interpretation: result.interpretation, ...response };
}

export const assistantRoutes = [
  route('POST', '/api/assistant/questions', ['manager', 'staff'], askQuestion, { readOnly: true }),
];
