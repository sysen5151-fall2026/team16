import { commandResult, fields, HttpError, identifier, route } from '../validation.mjs';
import { storageStatus } from './storage.mjs';

export const continuityRoutes = [
  route('GET', '/api/health', null, ({ service, explain }) => {
    const storage = storageStatus(service);
    return { status: storage.problem ? 'degraded' : 'ok',
      storage: { status: storage.status }, model: explain.health() };
  }),
  route('GET', '/api/accounts', null, ({ sessions }) => ({ accounts: sessions.accounts })),
  route('POST', '/api/sessions', null, ({ sessions, body }) => {
    fields(body, ['accountId', 'operationId']);
    const accountId = identifier(body.accountId, 'Account');
    return sessions.signIn(accountId, body.operationId);
  }),
  route('POST', '/api/demo/reset', ['manager'], ({ body, service, op, present }) => {
    fields(body, ['operationId']);
    return present(commandResult(service.resetDemo(op)));
  }),
  route('GET', '/api/checkpoints/previous', ['manager'], ({ service }) => {
    const checkpoint = service.getCheckpoint();
    if (checkpoint === null) throw new HttpError(404, 'NOT_FOUND', 'No verified prior checkpoint is available.');
    return { checkpoint: JSON.parse(checkpoint) };
  }),
  route('GET', '/api/storage/raw', ['manager'], ({ service }) => {
    const raw = service.getRaw();
    if (raw === null) throw new HttpError(404, 'NOT_FOUND', 'No saved state record is available.');
    return { raw };
  }),
  route('GET', '/api/support', ['support'], ({ service, explain, audit }) => ({
    storage: storageStatus(service), model: explain.health(), logs: audit.recent(),
  })),
];
