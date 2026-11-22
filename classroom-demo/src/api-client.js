const SESSION_TOKEN_KEY = 'pantri-demo-session';
const apiUnavailableMessage = 'PANTRI could not reach the server. Check that it is running, then retry.';

class PantriApiError extends Error {
  constructor(message, { status = 0, code = 'CONNECTION_LOST', retryable = true } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

function newOperationId() {
  return globalThis.crypto?.randomUUID?.() ?? 'op-' + Date.now() + '-' + Math.random();
}

function createPantriApi({
  fetcher = globalThis.fetch.bind(globalThis),
  tokenStore,
  operationId = newOperationId,
} = {}) {
  // Session storage can be blocked by browser settings. The open page can still sign in.
  let token = null;
  let accountId = null;
  try {
    tokenStore ??= globalThis.sessionStorage;
    token = tokenStore?.getItem(SESSION_TOKEN_KEY) || null;
  } catch {
    // The token stays in memory.
  }
  const pendingIds = new Map();

  function setSession(nextToken, nextAccountId = null) {
    token = nextToken;
    accountId = nextAccountId;
    try {
      if (token) tokenStore?.setItem(SESSION_TOKEN_KEY, token);
      else tokenStore?.removeItem(SESSION_TOKEN_KEY);
    } catch {
      // The token stays in memory.
    }
  }

  async function request(path, { method = 'GET', body, anonymous = false } = {}) {
    const requestToken = anonymous ? null : token;
    const headers = { Accept: 'application/json' };
    if (requestToken) headers.Authorization = 'Bearer ' + requestToken;
    if (body) headers['Content-Type'] = 'application/json';

    let response;
    try {
      response = await fetcher(path, {
        method, headers, body: body && JSON.stringify(body),
        cache: 'no-store', signal: AbortSignal.timeout?.(15_000),
      });
    } catch (error) {
      const message = error.name === 'TimeoutError'
        ? 'PANTRI did not hear back from the server. Retry the request.'
        : apiUnavailableMessage;
      throw new PantriApiError(message);
    }

    if (response.status === 401 && requestToken && requestToken === token) setSession(null);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new PantriApiError(
        typeof data?.message === 'string' ? data.message : 'PANTRI could not complete the request.',
        {
          status: response.status,
          code: data?.code ?? 'REQUEST_FAILED',
          retryable: response.status >= 500 || response.status === 408 || response.status === 429,
        },
      );
    }
    if (!data || typeof data !== 'object') {
      throw new PantriApiError('PANTRI received an unexpected response. Check the server, then retry.', {
        code: 'INVALID_RESPONSE',
      });
    }
    return data;
  }

  async function mutate(path, payload, { method = 'POST', anonymous = false, principal = accountId } = {}) {
    // An unacknowledged write may already be saved. Retrying the same intent uses its original ID.
    const key = JSON.stringify([principal, method, path, payload]);
    const id = pendingIds.get(key) ?? operationId();
    pendingIds.set(key, id);
    try {
      const result = await request(path, { method, body: { ...payload, operationId: id }, anonymous });
      pendingIds.delete(key);
      return result;
    } catch (error) {
      if (!error.retryable && error.status !== 401) pendingIds.delete(key);
      throw error;
    }
  }

  return {
    hasSession: () => Boolean(token),
    accounts: () => request('/api/accounts', { anonymous: true }),
    health: () => request('/api/health', { anonymous: true }),
    async signIn(id) {
      const result = await mutate('/api/sessions', { accountId: id }, { anonymous: true, principal: id });
      setSession(result.token, result.account.id);
      return result;
    },
    async snapshot() {
      const requestToken = token;
      const result = await request('/api/snapshot');
      if (requestToken === token) accountId = result.account.id;
      return result;
    },
    read: path => request(path),
    write: (path, payload = {}, options) => mutate(path, payload, options),
  };
}
