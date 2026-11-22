import { randomBytes } from 'node:crypto';
import { HttpError, forbidden } from '../validation.mjs';

const accounts = Object.freeze([
  Object.freeze({ id: 'manager', role: 'manager', label: 'Restaurant Manager', name: 'Ordering and approvals' }),
  Object.freeze({ id: 'staff', role: 'staff', label: 'Restaurant Staff', name: 'Kitchen and receiving' }),
  Object.freeze({ id: 'supplier', role: 'supplier', label: 'Ingredient Supplier', name: 'Prime Foods' }),
  Object.freeze({ id: 'supplier-fresh-fields', role: 'supplier', label: 'Ingredient Supplier', name: 'Fresh Fields Produce' }),
  Object.freeze({ id: 'supplier-pantry-supply', role: 'supplier', label: 'Ingredient Supplier', name: 'Pantry Supply Co.' }),
  Object.freeze({ id: 'recovery', role: 'recovery', label: 'Recovery Partner', name: 'Community Food Recovery' }),
  Object.freeze({ id: 'support', role: 'support', label: 'PANTRI Staff', name: 'PANTRI Support' }),
]);

const SESSION_LIFETIME = 8 * 60 * 60 * 1000;
const MAX_SESSIONS = 128;

export function createSessions() {
  const active = new Map();
  return {
    accounts,
    signIn(accountId, operationId) {
      const account = accounts.find(entry => entry.id === accountId);
      if (!account) throw new HttpError(404, 'NOT_FOUND', 'That account is unavailable.');
      const now = Date.now();
      for (const [token, session] of active) {
        if (session.expiresAt <= now) active.delete(token);
        else if (session.account === account && session.operationId === operationId) {
          return { token, account };
        }
      }
      if (active.size >= MAX_SESSIONS) active.delete(active.keys().next().value);
      const token = randomBytes(32).toString('base64url');
      active.set(token, { account, expiresAt: now + SESSION_LIFETIME, operationId });
      return { token, account };
    },
    getAccount(header) {
      const token = /^Bearer ([A-Za-z0-9_-]+)$/i.exec(header ?? '')?.[1];
      const session = active.get(token);
      if (!session || session.expiresAt <= Date.now()) {
        active.delete(token);
        throw new HttpError(401, 'SESSION_REQUIRED', 'Choose an account to continue.');
      }
      return session.account;
    },
  };
}

export function requirePartner(account, claim, expected, simulated) {
  if (account.role === 'manager' && simulated === true) return;
  if (simulated === true || account.role !== expected || account.name !== claim) forbidden();
}

const receivingLine = ({ ingredientId, unit, managerQty, unitCostCents }) => ({
  ingredientId, unit, managerQty, unitCostCents,
});

function receivingOrder(order) {
  const { id, supplierId, sentAt, supplierStatus, fulfillmentStatus, receivedQuantities } = order;
  return { id, supplierId, sentAt, supplierStatus, fulfillmentStatus, receivedQuantities,
    approvedLines: order.approvedLines.map(receivingLine) };
}

function supplierOrder(order) {
  const { approvedAt, approvedVersion, events, followUp } = order;
  return { ...receivingOrder(order), approvedAt, approvedVersion, followUp,
    events: events.map(({ kind, occurredAt, note }) => ({ kind, occurredAt, note })) };
}

function partnerRequest(request) {
  const { id, partnerId, lines, requestedWindow, status, createdAt, events, followUp } = request;
  return { id, partnerId, lines, requestedWindow, status, createdAt, followUp,
    events: events.map(({ kind, occurredAt, note }) => ({ kind, occurredAt, note })) };
}

function ingredientNames(state, lines) {
  const ids = new Set(lines.map(line => line.ingredientId));
  return state.ingredients.filter(ingredient => ids.has(ingredient.id)).map(({ id, name, unit }) => ({ id, name, unit }));
}

export function scopedState(state, account) {
  if (account.role === 'manager') return state;
  if (account.role === 'support') return null;
  const { schemaVersion, revision, restaurantId, demoDate } = state;
  const scope = { schemaVersion, revision, restaurantId, demoDate };

  if (account.role === 'staff') {
    const { ingredients, batches, inventoryEvents } = state;
    return { ...scope, ingredients, batches, inventoryEvents,
      orders: state.orders.filter(order => order.sentAt).map(receivingOrder),
      recoveries: state.recoveries.map(({ status, lines }) => ({ status, lines })),
      drafts: [], observations: [], partnerEvents: [],
    };
  }
  if (account.role === 'supplier') {
    const orders = state.orders.filter(order => order.sentAt && order.supplierId === account.name).map(supplierOrder);
    return { ...scope, orders, ingredients: ingredientNames(state, orders.flatMap(order => order.approvedLines)) };
  }

  const recoveries = state.recoveries.filter(request => request.partnerId === account.name).map(partnerRequest);
  return { ...scope, recoveries, ingredients: ingredientNames(state, recoveries.flatMap(request => request.lines)) };
}
