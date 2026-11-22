import { setTimeout as pause } from 'node:timers/promises';
import { createSeed } from '../src/domain.js';
import { reportRange, selectWastePlanning } from '../src/planning.js';
import { createModelAdapter } from '../server/model-adapter/index.mjs';
import { purchaseExplanation } from '../server/planning/explanations.mjs';

const model = 'qwen2.5:3b';
const endpoint = 'http://127.0.0.1:11434';
const state = createSeed();
const facts = purchaseExplanation(state, state.drafts[0], selectWastePlanning(state, reportRange(state, 'week')), null);
const explain = createModelAdapter({ baseUrl: endpoint, model });

async function runningModels() {
  const status = await fetch(endpoint + '/api/ps', { signal: AbortSignal.timeout(4000) });
  if (!status.ok) throw Error('Ollama could not report running models.');
  return (await status.json()).models.map(item => item.name);
}

async function unload() {
  const response = await fetch(endpoint + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [], stream: false, keep_alive: 0 }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error('Ollama could not unload ' + model + '.');
  await response.text();
  for (let attempt = 0; attempt < 30; attempt++) {
    if (!(await runningModels()).includes(model)) return;
    await pause(100);
  }
  throw Error(model + ' is still loaded.');
}

async function measure(label, beforeEach) {
  const outcomes = [];
  for (let trial = 0; trial < 5; trial++) {
    if (beforeEach) await beforeEach();
    const start = performance.now();
    const result = await explain(facts);
    outcomes.push({ trial: trial + 1, durationMs: Math.round(performance.now() - start),
      source: result.source, reason: explain.health().reason });
  }
  console.log(label + ' ' + JSON.stringify(outcomes));
}

console.log('Node ' + process.version + ', Ollama ' + model + ', Sliced beef draft facts.');
await measure('Cold', unload);
const warmup = await explain.warmup();
console.log('Warmup ' + JSON.stringify(warmup));
await measure('Warm');
