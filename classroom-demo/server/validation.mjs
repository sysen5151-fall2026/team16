const MAX_BODY_BYTES = 32768;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/;

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function check(condition, message) {
  if (!condition) throw new HttpError(400, 'INVALID_REQUEST', message);
}

export function forbidden() {
  throw new HttpError(403, 'FORBIDDEN', 'This demo role cannot access that operation or record.');
}

export function fields(body, keys) {
  check(body && typeof body === 'object' && !Array.isArray(body), 'Provide a JSON object.');
  const unexpected = Object.keys(body).find(key => !keys.includes(key));
  check(unexpected === undefined, 'The request contains an unsupported field.');
  return body;
}

export function text(value, label, maximum, { optional = false, allowEmpty = false } = {}) {
  if (optional && value === undefined) return undefined;
  check(typeof value === 'string' && value.length <= maximum && (allowEmpty || value.trim()),
    label + ' must be a text value of at most ' + maximum + ' characters.');
  return value.trim();
}

export function identifier(value, label) {
  check(typeof value === 'string' && ID.test(value), label + ' must be a valid identifier.');
  return value;
}

export function version(value) {
  check(Number.isSafeInteger(value) && value > 0, 'Version must be a positive integer.');
  return value;
}

export function oneOf(value, choices, label) {
  check(choices.includes(value), label + ' is unsupported.');
  return value;
}

export function findRecord(rows, id, label) {
  const record = rows.find(row => row.id === id);
  if (!record) throw new HttpError(404, 'NOT_FOUND', label + ' was not found.');
  return record;
}

export async function readJson(request) {
  const mediaType = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Use Content-Type: application/json.');
  }
  const tooLarge = () => new HttpError(413, 'REQUEST_TOO_LARGE', 'JSON request exceeds 32,768 bytes.');
  if (Number(request.headers['content-length']) > MAX_BODY_BYTES) throw tooLarge();

  let length = 0;
  const chunks = [];
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    length += chunk.length;
    if (length > MAX_BODY_BYTES) throw tooLarge();
    chunks.push(chunk);
  }

  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks, length).toString('utf8'));
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'The request body is not valid JSON.');
  }
  check(body && typeof body === 'object' && !Array.isArray(body), 'Provide a JSON object.');
  return body;
}

export function commandResult(result) {
  if (result.ok) return result.value;
  if (result.code === 'STORAGE') {
    throw new HttpError(503, 'STORAGE_UNAVAILABLE', 'Transaction storage is unavailable. Check service health.');
  }
  throw new HttpError(409, 'STATE_CONFLICT', result.message);
}

export function route(method, path, roles, handle) {
  const parts = path.split('/');
  const matcher = new RegExp('^' + parts.map(part => part === ':id' ? '([^/]+)' : part).join('/') + '$');
  return { method, path, roles, handle, matcher };
}
