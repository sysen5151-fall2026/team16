const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createServer } = require('node:http');
const { test } = require('node:test');

const adapterModule = import('../server/model-adapter/index.mjs');

const draft = {
  kind: 'draft',
  facts: {
    ingredient: 'Sliced beef',
    orderQuantity: 4,
    unit: 'kg',
    costCents: 5800,
    waste: [{ date: '2026-10-21', quantity: 1, reason: 'Overproduction' }],
  },
  candidates: [
    'The calculated purchase is 4 kg of Sliced beef. Review the recent overproduction before approving.',
    'PANTRI recommends 4 kg of Sliced beef at $58.00. Check the 1 kg wasted on October 21 before approving.',
  ],
  fallback: 'PANTRI calculated 4 kg of Sliced beef at $58.00.',
};

function sendChat(response, content) {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({
    model: 'qwen2.5:3b',
    created_at: '2026-10-21T16:00:00Z',
    message: { role: 'assistant', content },
    done: true,
    done_reason: 'stop',
    total_duration: 12000000,
    load_duration: 1000000,
    prompt_eval_count: 38,
    prompt_eval_duration: 5000000,
    eval_count: 67,
    eval_duration: 6000000,
  }));
}

async function startModel(t, respond) {
  const requests = [];
  const server = createServer(async (request, response) => {
    request.setEncoding('utf8');
    let body = '';
    for await (const chunk of request) body += chunk;
    requests.push({ method: request.method, path: request.url, body });
    respond(response, requests.length);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const stop = () => new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections();
  });
  t.after(stop);
  return { baseUrl, requests, stop };
}

function verifyLog(entry, { event = 'explanation', fallback = false, reason = null, model = 'qwen2.5:3b' } = {}) {
  assert.ok(Number.isFinite(entry.elapsedMs) && entry.elapsedMs >= 0);
  assert.deepEqual(entry, { type: 'model', event, elapsedMs: entry.elapsedMs, fallback, reason, model });
}

test('accepts a supplied paragraph with the exact facts', async t => {
  const { createModelAdapter } = await adapterModule;
  const content = JSON.stringify({
    facts: {
      waste: [{ reason: 'Overproduction', quantity: 1, date: '2026-10-21' }],
      costCents: 5800,
      unit: 'kg',
      orderQuantity: 4,
      ingredient: 'Sliced beef',
    },
    text: draft.candidates[1],
  });
  const model = await startModel(t, response => sendChat(response, content));
  const events = [];
  const explain = createModelAdapter({ baseUrl: model.baseUrl, log: entry => events.push(entry) });

  assert.deepEqual(explain.health(), { name: 'qwen2.5:3b', status: 'warming', reason: null });
  assert.deepEqual(await explain(draft), { source: 'model', text: draft.candidates[1] });
  assert.deepEqual(explain.health(), { name: 'qwen2.5:3b', status: 'ready', reason: null });
  assert.equal(model.requests.length, 1);
  const [{ method, path, body }] = model.requests;
  assert.equal(method, 'POST');
  assert.equal(path, '/api/chat');
  const request = JSON.parse(body);
  assert.equal(request.model, 'qwen2.5:3b');
  assert.equal(request.stream, false);
  assert.equal(request.keep_alive, '10m');
  if (request.format !== 'json') {
    assert.equal(request.format.type, 'object');
    assert.deepEqual(request.format.required, ['facts', 'text']);
    assert.equal(request.format.additionalProperties, false);
  }
  const userMessage = request.messages.find(message => message.role === 'user');
  assert.deepEqual(JSON.parse(userMessage.content), { kind: 'draft', facts: draft.facts, candidates: draft.candidates });
  assert.equal(events.length, 1);
  verifyLog(events[0]);
});

test('falls back when an Ollama reply fails validation', async t => {
  const { createModelAdapter } = await adapterModule;
  const correct = { facts: draft.facts, text: draft.candidates[0] };
  const invalidReplies = [
    ['non-JSON HTTP body', 'invalid-json', response => response.end('Plain text from Ollama')],
    ['non-JSON assistant content', 'invalid-json', response => sendChat(response, 'Buy a little more.')],
    ['missing field', 'invalid-response', response => sendChat(response, JSON.stringify({ facts: draft.facts }))],
    ['extra field', 'invalid-response', { ...correct, extra: 'unexpected' }],
    ['wrong cents', 'facts-mismatch', { ...correct, facts: { ...draft.facts, costCents: 5801 } }],
    ['quantity as a string', 'facts-mismatch', { ...correct, facts: { ...draft.facts, orderQuantity: '4' } }],
    ['wrong nested date', 'facts-mismatch', {
      ...correct,
      facts: { ...draft.facts, waste: [{ date: '2026-10-22', quantity: 1, reason: 'Overproduction' }] },
    }],
    ['invented ingredient in facts', 'facts-mismatch', { ...correct, facts: { ...draft.facts, ingredient: 'Lobster' } }],
    ['invented ingredient in prose', 'untrusted-text', { ...correct, text: 'Order 4 kg of Lobster.' }],
    ['unapproved prose', 'untrusted-text', { ...correct, text: `${correct.text} Approve before noon.` }],
  ];

  for (const [name, reason, reply] of invalidReplies) {
    await t.test(name, async t => {
      const model = await startModel(t, typeof reply === 'function'
        ? reply
        : response => sendChat(response, JSON.stringify(reply)));
      const events = [];
      const explain = createModelAdapter({ baseUrl: model.baseUrl, log: entry => events.push(entry) });

      assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
      assert.deepEqual(explain.health(), { name: 'qwen2.5:3b', status: 'unavailable', reason });
      assert.equal(events.length, 1);
      verifyLog(events[0], { fallback: true, reason });
    });
  }
});

test('bounds a stalled response body by the timeout', { timeout: 3000 }, async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, response => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write('{"message":');
  });
  const events = [];
  const explain = createModelAdapter({ baseUrl: model.baseUrl, timeoutMs: 250, log: entry => events.push(entry) });

  assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
  assert.equal(model.requests.length, 1);
  assert.equal(events.length, 1);
  verifyLog(events[0], { fallback: true, reason: 'timeout' });
});

test('uses calculated text when the configured model is missing', async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, response => {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: "model 'missing:3b' not found" }));
  });
  const events = [];
  const modelName = 'missing:3b';
  const explain = createModelAdapter({ baseUrl: model.baseUrl, model: modelName, log: entry => events.push(entry) });

  assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
  assert.equal(JSON.parse(model.requests[0].body).model, modelName);
  assert.deepEqual(explain.health(), { name: modelName, status: 'unavailable', reason: 'model-missing' });
  verifyLog(events[0], { fallback: true, reason: 'model-missing', model: modelName });
});

test('uses calculated text when the loopback service stops', async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, response => sendChat(response, JSON.stringify({
    facts: draft.facts,
    text: draft.candidates[0],
  })));
  const events = [];
  const explain = createModelAdapter({ baseUrl: model.baseUrl, log: entry => events.push(entry) });

  assert.equal((await explain(draft)).source, 'model');
  await model.stop();
  assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
  assert.equal(events.length, 2);
  verifyLog(events[1], { fallback: true, reason: 'service-unavailable' });
});

test('rejects a non-loopback or non-HTTP base URL', async () => {
  const { createModelAdapter } = await adapterModule;
  for (const baseUrl of ['http://127.example.invalid:11434', 'https://127.0.0.1:11434']) {
    const explain = createModelAdapter({ baseUrl });
    assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
    assert.equal(explain.health().reason, 'invalid-base-url');
  }
});

test('rejects Ollama cloud model tags before connecting', async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, response => sendChat(response, JSON.stringify({
    facts: draft.facts,
    text: draft.candidates[0],
  })));
  for (const name of ['gemma4:cloud', 'qwen3-coder:480b-cloud']) {
    const explain = createModelAdapter({ baseUrl: model.baseUrl, model: name });
    assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
    assert.equal(explain.health().reason, 'cloud-model');
  }
  assert.equal(model.requests.length, 0);
});

test('ignores redirects from the loopback service', async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, (response, call) => {
    if (call === 1) {
      response.writeHead(307, { Location: '/forwarded' }).end();
    } else {
      sendChat(response, JSON.stringify({ facts: draft.facts, text: draft.candidates[0] }));
    }
  });
  const explain = createModelAdapter({ baseUrl: model.baseUrl });

  assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
  assert.equal(model.requests.length, 1);
});

test('warmup checks a fixed reply and can recover after failure', async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, (response, call) => sendChat(response, JSON.stringify({
    facts: { status: 'ready' },
    text: call === 1 ? 'Incorrect warmup reply.' : 'PANTRI model ready.',
  })));
  const events = [];
  const explain = createModelAdapter({ baseUrl: model.baseUrl, log: entry => events.push(entry) });

  const first = await explain.warmup();
  assert.deepEqual(first, { name: 'qwen2.5:3b', status: 'unavailable', reason: 'untrusted-text' });
  assert.deepEqual(explain.health(), first);
  const second = await explain.warmup();
  assert.deepEqual(second, { name: 'qwen2.5:3b', status: 'ready', reason: null });
  assert.deepEqual(explain.health(), second);
  assert.deepEqual(model.requests.map(request => request.path), ['/api/chat', '/api/chat']);
  assert.equal(events.length, 2);
  verifyLog(events[0], { event: 'warmup', fallback: true, reason: 'untrusted-text' });
  verifyLog(events[1], { event: 'warmup' });
});

test('startup warmup can outlast the explanation deadline', { timeout: 3000 }, async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, (response, call) => {
    const content = call === 1
      ? { facts: { status: 'ready' }, text: 'PANTRI model ready.' }
      : { facts: draft.facts, text: draft.candidates[0] };
    const timer = setTimeout(() => sendChat(response, JSON.stringify(content)), 300);
    response.once('close', () => clearTimeout(timer));
  });
  const events = [];
  const explain = createModelAdapter({ baseUrl: model.baseUrl, timeoutMs: 100, log: entry => events.push(entry) });

  assert.equal((await explain.warmup()).status, 'ready');
  assert.equal(JSON.parse(model.requests[0].body).keep_alive, '10m');
  assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
  verifyLog(events[0], { event: 'warmup' });
  verifyLog(events[1], { fallback: true, reason: 'timeout' });
});

test('disabled adapters return calculated text without connecting', async t => {
  const { createModelAdapter } = await adapterModule;
  const model = await startModel(t, response => sendChat(response, JSON.stringify({
    facts: draft.facts,
    text: draft.candidates[0],
  })));
  const events = [];
  const explain = createModelAdapter({ baseUrl: model.baseUrl, enabled: false, log: entry => events.push(entry) });

  assert.deepEqual(await explain(draft), { source: 'calculated', text: draft.fallback });
  assert.equal((await explain.warmup()).status, 'disabled');
  assert.deepEqual(explain.health(), { name: 'qwen2.5:3b', status: 'disabled', reason: 'disabled' });
  assert.equal(model.requests.length, 0);
  assert.equal(events.length, 2);
  verifyLog(events[0], { fallback: true, reason: 'disabled' });
  verifyLog(events[1], { event: 'warmup', fallback: true, reason: 'disabled' });
});
