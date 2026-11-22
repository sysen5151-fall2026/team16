const resultView = document.getElementById('results');
const key = 'pantri.task6.storage-study';
const local = {
  write(current, checkpoint) {
    localStorage.setItem(key, JSON.stringify({ current, checkpoint }));
  },
  read() {
    return JSON.parse(localStorage.getItem(key));
  },
};
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(key, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('snapshots');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
function indexed(db) {
  return {
    write(current, checkpoint) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('snapshots', 'readwrite');
        const store = transaction.objectStore('snapshots');
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        store.put(current, 'current');
        store.put(checkpoint, 'checkpoint');
      });
    },
    read() {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('snapshots');
        const store = transaction.objectStore('snapshots');
        const current = store.get('current');
        const checkpoint = store.get('checkpoint');
        transaction.oncomplete = () => resolve({ current: current.result, checkpoint: checkpoint.result });
        transaction.onabort = () => reject(transaction.error);
      });
    },
  };
}
function accepted(result) {
  if (!result.ok) throw Error(result.message);
  return result.value;
}
function stateSignature(state) {
  const order = state.orders[0];
  return JSON.stringify([order.id, order.approvedVersion, order.approvedLines[0].managerQty,
    order.supplierStatus, order.fulfillmentStatus, order.events, state.partnerEvents,
    getIngredientSummary(state, 'ing-001').onHand]);
}
async function runBatch(adapters) {
  const rows = [];
  for (let i = -5; i < 30; i++) {
    for (const name of i % 2 ? ['B', 'A'] : ['A', 'B']) {
      const adapter = adapters[name];
      const draft = accepted(editDraft(createSeed(), 'draft-001', 1, [{ ingredientId: 'ing-001', managerQty: 5 }]));
      const start = performance.now();
      const approved = accepted(approveDraft(draft, 'draft-001', 2, 'approval'));
      await adapter.write(approved, draft);
      const sent = accepted(sendApprovedOrder(approved, approved.orders[0].id, 'dispatch'));
      await adapter.write(sent, approved);
      const elapsedMs = performance.now() - start;
      const retained = await adapter.read();
      const intact = stateSignature(retained.current) === stateSignature(sent) &&
        stateSignature(retained.checkpoint) === stateSignature(approved);
      if (i >= 0) rows.push({ run: i + 1, name, elapsedMs, intact });
    }
  }
  return rows;
}
document.getElementById('run').onclick = async event => {
  event.currentTarget.disabled = true;
  resultView.textContent = 'Running';
  let db;
  try {
    db = await database();
    const rows = await runBatch({ A: local, B: indexed(db) });
    const result = { endpoint: 'approval start to completion of simulated dispatch save',
      warmupsPerAlternative: 5, browser: navigator.userAgent, rows };
    resultView.textContent = JSON.stringify(result);
  } catch (error) {
    resultView.textContent = error.stack;
  } finally {
    db?.close();
    document.getElementById('run').disabled = false;
  }
};
