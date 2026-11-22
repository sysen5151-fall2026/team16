import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createSessions, scopedState } from './continuity/access.mjs';
import { continuityRoutes } from './continuity/routes.mjs';
import { openState, resolveDataFile, storageStatus } from './continuity/storage.mjs';
import { createModelAdapter } from './model-adapter/index.mjs';
import { presentationRoutes } from './presentation/routes.mjs';
import { purchaseRoutes } from './purchasing/routes.mjs';
import { recordRoutes } from './records/routes.mjs';
import { recoveryRoutes } from './recovery/routes.mjs';
import { commandResult, forbidden, HttpError, identifier, readJson } from './validation.mjs';

const htmlFile = new URL('../PANTRI_Final.html', import.meta.url);
const allRoutes = [...continuityRoutes, ...recordRoutes, ...purchaseRoutes, ...recoveryRoutes, ...presentationRoutes];
const auditLimit = 100;

function createAudit(logger) {
  const entries = [];
  return {
    record(event) {
      const entry = { at: new Date().toISOString(), ...event };
      if (entries.length >= auditLimit) entries.shift();
      entries.push(entry);
      logger(JSON.stringify(entry));
    },
    recent: () => [...entries].reverse(),
  };
}

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

function requestId(account, route, id, key) {
  const basis = JSON.stringify([account.id, route.method, route.path, id, key]);
  return 'api-' + createHash('sha256').update(basis).digest('hex');
}

function validateOrigin(request) {
  const origin = request.headers.origin;
  if (origin && origin !== 'http://' + request.headers.host) forbidden();
}

async function servePage(request, response, pathname) {
  if (request.method !== 'GET') return false;
  if (pathname === '/favicon.ico') {
    response.writeHead(204).end();
    return true;
  }
  if (pathname !== '/' && pathname !== '/PANTRI_Final.html') return false;

  try {
    const html = await readFile(htmlFile, 'utf8');
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    response.end(html);
  } catch {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('PANTRI HTML is unavailable. Run npm start from classroom-demo.');
  }
  return true;
}

export function createPantriServer({
  dataFile,
  modelEnabled = process.env.PANTRI_MODEL_ENABLED !== '0',
  modelBaseUrl = process.env.PANTRI_OLLAMA_URL,
  modelName = process.env.PANTRI_OLLAMA_MODEL,
  modelTimeoutMs = Number(process.env.PANTRI_MODEL_TIMEOUT_MS ?? 8000),
  logger = console.log,
} = {}) {
  const file = resolveDataFile(dataFile);
  const service = openState(file);
  const sessions = createSessions();
  const audit = createAudit(logger);
  const timeoutMs = Number.isInteger(modelTimeoutMs) && modelTimeoutMs >= 1 && modelTimeoutMs <= 60000
    ? modelTimeoutMs : 8000;
  const explain = createModelAdapter({
    enabled: modelEnabled, baseUrl: modelBaseUrl, model: modelName, timeoutMs,
    log: entry => audit.record({ ...entry, outcome: entry.fallback ? 'fallback' : 'ok' }),
  });

  const server = createServer({ requestTimeout: 15000 }, async (request, response) => {
    const started = performance.now();
    let chosen;
    let account;
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (await servePage(request, response, url.pathname)) return;
      validateOrigin(request);
      chosen = allRoutes.find(item => item.method === request.method && item.matcher.test(url.pathname));
      if (!chosen) throw new HttpError(404, 'NOT_FOUND', 'That PANTRI route was not found.');

      if (chosen.roles) {
        account = sessions.getAccount(request.headers.authorization);
        if (!chosen.roles.includes(account.role)) forbidden();
      }
      const resource = chosen.matcher.exec(url.pathname)[1];
      const id = resource === undefined ? undefined : identifier(resource, 'Record');
      const write = chosen.method === 'POST' || chosen.method === 'PATCH';
      const body = write ? await readJson(request) : undefined;
      if (write) identifier(body.operationId, 'Operation ID');

      if (write && account && chosen.path !== '/api/demo/reset' && service.getProblem()) {
        throw new HttpError(503, 'STORAGE_UNAVAILABLE', 'Saved data needs reconciliation before recording transactions.');
      }

      const state = service.getSnapshot();
      const payload = await chosen.handle({
        account, body, id, state, service, sessions, audit, explain, query: url.searchParams,
        op: write && account ? requestId(account, chosen, id, body.operationId) : undefined,
        present(next, recordId) {
          return { account, state: scopedState(next, account), storage: storageStatus(service), recordId };
        },
        commit(work) { return commandResult(service.commit(work)); },
      });
      if (write) audit.record({ type: 'operation', event: chosen.method + ' ' + chosen.path,
        role: account?.role ?? payload.account?.role, outcome: 'ok', elapsedMs: Math.round(performance.now() - started) });
      json(response, chosen.path === '/api/sessions' ? 201 : 200, payload);
    } catch (error) {
      const own = error instanceof HttpError;
      const status = own ? error.status : 500;
      const code = own ? error.code : 'INTERNAL';
      const message = own ? error.message : 'PANTRI could not complete the request.';
      audit.record({
        type: 'operation', event: chosen ? chosen.method + ' ' + chosen.path : 'Unknown route',
        role: account?.role, outcome: 'rejected', code, elapsedMs: Math.round(performance.now() - started),
      });
      if (!request.complete) request.resume();
      if (!response.headersSent) json(response, status, { code, message });
      else response.end();
    }
  });
  if (modelEnabled) server.once('listening', () => {
    void explain.warmup();
  });
  return server;
}
