import { cancelRecovery, eventTime, qty, recordCollection, recordRecoveryEvent, requestRecovery,
  validQuantity, validTimestamp } from '../../src/domain.js';
import { requirePartner, scopedState } from '../continuity/access.mjs';
import { check, fields, findRecord, identifier, oneOf, route, text } from '../validation.mjs';

function newRequest({ body, state, sessions, op, commit, present }) {
  fields(body, ['batchId', 'quantity', 'partnerId', 'requestedWindow', 'note', 'operationId']);
  const { partnerId } = body;
  check(sessions.accounts.some(account => account.role === 'recovery' && account.name === partnerId),
    'Choose a registered recovery partner.');
  const batchId = identifier(body.batchId, 'Batch');
  const batch = findRecord(state.batches, batchId, 'Batch');
  const ingredient = findRecord(state.ingredients, batch.ingredientId, 'Ingredient');
  check(validQuantity(body.quantity, ingredient.unit) && body.quantity === qty(body.quantity),
    'Provide a valid quantity in the ingredient’s stock unit.');
  const input = {
    batchId, quantity: body.quantity, partnerId,
    requestedWindow: text(body.requestedWindow, 'Pickup window', 120),
    note: text(body.note, 'Note', 500, { optional: true, allowEmpty: true }),
  };
  const next = commit(current => requestRecovery(current, input, op));
  return present(next, next.recoveries.find(item => item.createdByOperation === op)?.id);
}

function partnerScope({ body, id, state, account }) {
  check(body.simulate === undefined || body.simulate === true, 'Simulation must be explicitly enabled or omitted.');
  const request = findRecord(state.recoveries, id, 'Recovery request');
  requirePartner(account, request.partnerId, 'recovery', body.simulate);
}

function respond(context) {
  const { body, state, account, id, op, commit, present } = context;
  fields(body, ['kind', 'note', 'occurredAt', 'operationId', 'simulate']);
  partnerScope(context);
  const kind = oneOf(body.kind, ['accepted', 'exception'], 'Recovery response');
  const note = text(body.note, 'Note', 500, { optional: true, allowEmpty: true }) || (
    kind === 'exception' ? 'Partner declined or reported a collection exception.' : ''
  );
  const occurredAt = body.occurredAt === undefined ? eventTime(state) : body.occurredAt;
  check(validTimestamp(occurredAt), 'Use a local timestamp in YYYY-MM-DDTHH:mm:ss format.');
  const event = { id: op, restaurantId: state.restaurantId, transactionId: id, kind, note, occurredAt,
    recordedBy: account.label, simulated: body.simulate === true };
  return present(commit(current => recordRecoveryEvent(current, event)), id);
}

export const recoveryRoutes = [
  route('GET', '/api/recoveries', ['manager', 'recovery'], ({ state, account }) => ({
    recoveries: scopedState(state, account).recoveries,
  })),
  route('POST', '/api/recoveries', ['manager'], newRequest),
  route('POST', '/api/recoveries/:id/partner-events', ['manager', 'recovery'], respond),
  route('POST', '/api/recoveries/:id/collection', ['manager', 'recovery'], context => {
    const { body, account, id, op, commit, present } = context;
    fields(body, ['operationId', 'simulate']);
    partnerScope(context);
    return present(commit(current => recordCollection(current, id, op, account.label)), id);
  }),
  route('POST', '/api/recoveries/:id/cancellation', ['manager'], ({ body, state, id, op, commit, present }) => {
    fields(body, ['operationId']);
    findRecord(state.recoveries, id, 'Recovery request');
    return present(commit(current => cancelRecovery(current, id, op)), id);
  }),
];
