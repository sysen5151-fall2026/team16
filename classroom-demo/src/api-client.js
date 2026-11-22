const SESSION_TOKEN_KEY = 'pantri-demo-session';
const PENDING_OPERATION_KEY = 'pantri-pending-operations';
const persistedIntent = /^[a-f0-9]{64}$/;
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
  let pendingIds = new Map();
  try {
    const saved = JSON.parse(tokenStore?.getItem(PENDING_OPERATION_KEY) ?? '[]');
    pendingIds = new Map(saved.filter(([key, id]) => persistedIntent.test(key) && typeof id === 'string'));
  } catch {
    // A corrupt or blocked session store does not prevent the workspace from loading.
  }

  function savePendingIds() {
    try {
      const saved = [...pendingIds].filter(([key]) => persistedIntent.test(key));
      if (saved.length) tokenStore?.setItem(PENDING_OPERATION_KEY, JSON.stringify(saved));
      else tokenStore?.removeItem(PENDING_OPERATION_KEY);
    } catch {
      // Retry tracking still works in the open tab.
    }
  }

  async function intentKey(principal, method, path, payload) {
    const intent = JSON.stringify([principal, method, path, payload]);
    if (!globalThis.crypto?.subtle) return intent;
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(intent));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

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
    const key = await intentKey(principal, method, path, payload);
    const id = pendingIds.get(key) ?? operationId();
    pendingIds.set(key, id);
    savePendingIds();
    try {
      const result = await request(path, { method, body: { ...payload, operationId: id }, anonymous });
      pendingIds.delete(key);
      return result;
    } catch (error) {
      if (!error.retryable && error.status !== 401) pendingIds.delete(key);
      throw error;
    } finally {
      savePendingIds();
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
    async snapshot({ reloadSaved = false } = {}) {
      const requestToken = token;
      const path = reloadSaved ? '/api/snapshot?reloadSaved=1' : '/api/snapshot';
      const result = await request(path);
      if (requestToken === token) accountId = result.account.id;
      return result;
    },
    read: path => request(path),
    askAssistant: question => request('/api/assistant/questions', { method: 'POST', body: { question } }),
    write: (path, payload = {}, options) => mutate(path, payload, options),
  };
}
