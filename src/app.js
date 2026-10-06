/* Presentation adapter for the requirement-constrained state machine. */
(function () {
  'use strict';
  const {ACTIONS, REQUIREMENTS, FIXTURE, Skeleton} = PANTRI;
  let engine = new Skeleton(), selectedRequirement = 'SR.03';
  const el = id => document.getElementById(id);
  const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const json = value => esc(JSON.stringify(value,null,2));
  const descriptions = {
    1:'The manager starts the modeled purchasing session.',
    2:'Request advice for the prepared two-day planning scenario.',
    3:'Retrieve current inventory from the prepared restaurant-data stub.',
    4:'Retrieve three days of synthetic ingredient usage.',
    5:'Retrieve recorded expiration dates, including an explicitly unknown date.',
    6:'Run a deterministic forecasting stand-in: average daily usage × two-day horizon.',
    7:'Calculate proposed quantities from expected demand and demo usable stock.',
    8:'Present the recommendation and its assumptions to the manager.',
    9:'Read the recommendation basis and acknowledge your review.',
    10:'Edit quantities in the table below. Use kilograms with at most two decimal places.',
    11:'PANTRI applies the manager’s submitted quantities to the draft.',
    12:'Review the final draft quantities below. Explicit approval locks these quantities for transmission.',
    13:'Record who approved the final quantities and when.',
    14:'Create the official purchase order from the recorded approval.',
    15:'Send the approved order unchanged to the in-process supplier adapter.',
    16:'The supplier stub receives an exact copy of the transmitted order.',
    17:'The supplier stub confirms the received quantities. PANTRI has not recorded this response yet.',
    18:'The supplier stub returns confirmation and a simulated delivery window.',
    19:'Record the returned supplier confirmation in PANTRI.',
    20:'Update PANTRI’s order state using the recorded confirmation.',
    21:'Provide the recorded order status and delivery information to the manager.',
    22:'Review the final status. This completes the modeled use case.'
  };
  const labels = {1:'Begin purchasing session',2:'Request purchasing recommendation',9:'Confirm recommendation review',10:'Submit adjusted quantities',12:'Approve final purchase quantities',22:'Confirm final status review'};
  function showView(model) {
    el('run-view').hidden = model; el('model-view').hidden = !model;
    el('run-tab').setAttribute('aria-selected',String(!model)); el('model-tab').setAttribute('aria-selected',String(model));
  }
  function renderRecommendation(s) {
    const node = el('recommendation');
    if (s.step < 8) { node.innerHTML = '<div class="placeholder">The recommendation appears after UC.1.8. Execute the retrieval and planning actions above.</div>'; return; }
    const editable = s.step === 9;
    node.innerHTML = '<div class="table-scroll"><table><thead><tr><th>Ingredient</th><th>Recorded stock</th><th>Demo usable stock</th><th>Expected demand</th><th>Suggested purchase</th><th>Manager quantity</th></tr></thead><tbody>' + s.recommendation.map(i => `<tr><td><b>${esc(i.name)}</b></td><td>${i.recordedKg} kg</td><td>${i.usableKg} kg</td><td>${i.expectedDemandKg} kg</td><td>${i.recommendedKg} kg</td><td><input class="qty" id="qty-${esc(i.id)}" aria-label="${esc(i.name)} purchase quantity in kg" type="number" min="0" max="100000" step="0.01" value="${s.draft[i.id]}" ${editable ? '' : 'disabled'}> kg</td></tr>`).join('') + '</tbody></table></div>';
    node.innerHTML += '<div class="note" style="margin-top:14px"><b>Basis &amp; limitations:</b> synthetic records; two-day horizon; forecast = average of three daily usage values × 2. Suggested purchase = max(0, expected demand − demo usable stock). Recorded expired batches and unknown expiration dates are excluded by this demo policy, which requires stakeholder confirmation.</div>';
    node.innerHTML += '<details><summary>Recorded batch dates and data limitations (SR.02)</summary><table><thead><tr><th>Ingredient / batch</th><th>Quantity</th><th>Expiration</th></tr></thead><tbody>' + s.recommendation.flatMap(i => i.batches.map(b => `<tr><td>${esc(i.name)} / ${esc(b.id)}</td><td>${b.quantity} kg</td><td>${esc(b.expires || 'Unknown — excluded from demo usable stock')}</td></tr>`)).join('') + '</tbody></table><p class="small muted">These date checks are planning assumptions, not physical food-suitability assessments or validated forecast performance.</p></details>';
    if(editable) node.innerHTML += '<p class="small" style="color:var(--green)">Quantity editing is active for UC.1.10. For the live trace, change Sliced beef from 4 to 5 kg.</p>';
  }
  function renderOrder(s) {
    el('order-status').textContent = s.status.replace(/_/g,' ');
    if(!s.draft){el('order').innerHTML='<div class="placeholder">No draft order yet.</div>';return;}
    const current = s.officialOrder?.quantities || s.draft;
    let html = '<dl class="kv"><dt>Restaurant</dt><dd>'+esc(FIXTURE.restaurant)+'</dd><dt>Order ID</dt><dd>'+esc(s.officialOrder?.id || 'Draft — not issued')+'</dd><dt>Final quantities</dt><dd>'+FIXTURE.ingredients.map(i => `${esc(i.name)}: ${current[i.id]} kg`).join('<br>')+'</dd><dt>Approval recorded</dt><dd>'+esc(s.approval ? s.approval.manager + ' · '+s.approval.approvedAt : 'Not yet recorded')+'</dd><dt>Supplier received</dt><dd>'+(s.supplierReceived ? FIXTURE.ingredients.map(i => `${esc(i.name)}: ${s.supplierReceived.quantities[i.id]} kg`).join('<br>') : 'Not yet received')+'</dd><dt>Confirmation recorded</dt><dd>'+esc(s.recordedConfirmation?.confirmationId || 'Not yet recorded')+'</dd></dl>';
    if(s.presentedStatus) html += '<div class="success"><b>Manager-facing order status: '+esc(s.presentedStatus.status)+'</b><br>Delivery: '+esc(s.presentedStatus.deliveryWindow)+'</div>';
    else if(s.sentOrder) html += '<p class="small muted">The transmitted order is distinct from a recorded supplier confirmation. Final status is presented at UC.1.21.</p>';
    el('order').innerHTML=html;
  }
  function renderTrace() {
    el('requirement-buttons').innerHTML = Object.keys(REQUIREMENTS).map(id => `<button class="trace-link" data-requirement="${id}" aria-pressed="${id===selectedRequirement}">${id}</button>`).join('');
    const r = REQUIREMENTS[selectedRequirement];
    const actions = ACTIONS.filter(a => a.requirements.includes(selectedRequirement)).map(a => a.id);
    el('trace-detail').innerHTML = `<div class="trace-text"><b>${r.need} · ${esc(r.needName)}</b><p>${esc(r.needText)}</p><b>${selectedRequirement}</b><p>${esc(r.text)}</p><p class="muted">Model: ${actions.join(', ')}<br>Implementation: src/core.js → Skeleton.execute(actionId); matching UC.1.x cases.<br>UI: src/app.js → renderRecommendation / renderOrder.</p></div>`;
    el('requirement-buttons').querySelectorAll('button').forEach(b => b.addEventListener('click',() => {selectedRequirement=b.dataset.requirement;renderTrace();}));
  }
  function renderFlow(s) {
    el('flow').innerHTML = ['Restaurant Manager','PANTRI','Ingredient Supplier'].map(actor => `<div class="flow-column"><h3>${esc(actor)}</h3>${ACTIONS.map((a,i) => ({a,i})).filter(x => x.a.actor===actor).map(({a,i}) => `<button class="flow-step ${i<s.step?'done':i===s.step?'next':''}" data-action="${a.id}"><b>${a.id} ${i<s.step?'✓':i===s.step?'→':''}</b>${esc(a.name)}<div class="tag">${a.requirements.join(' · ') || 'UC.1 session context'}</div></button>`).join('')}</div>`).join('');
    el('flow').querySelectorAll('button').forEach(b => b.addEventListener('click',() => {
      const a=ACTIONS.find(a => a.id===b.dataset.action);selectedRequirement=a.requirements[0] || 'SR.02';showView(false);renderTrace();
      el('trace-detail').insertAdjacentHTML('afterbegin',`<p class="small"><b>Selected action:</b> ${a.id} · ${esc(a.name)}</p>`);
    }));
  }
  function render() {
    const s=engine.snapshot(), next=engine.nextAction();
    el('progress-label').textContent=`${s.step} / 22 actions executed`;
    el('progress-fill').style.width=`${s.step/22*100}%`;document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',String(s.step));
    el('action-id').textContent=next?.id || 'UC.1 complete';
    el('action-actor').textContent=next?.actor || 'Baseline completed';
    el('action-actor').className='pill'+(next?.actor==='Ingredient Supplier'?' stub':'');
    el('action-heading').textContent=next?.name || 'Order confirmed and reviewed';
    el('action-description').textContent=next ? descriptions[s.step+1] : 'Inspect the approval, sent order and supplier receipt in the run evidence.';
    const ackText = {9:'I have reviewed the recommendation, planning horizon and data limitations.',12:'I explicitly approve the final draft quantities shown below.',22:'I have reviewed the recorded order confirmation and simulated delivery information.'}[s.step+1];
    el('ack-label').hidden=!ackText;el('ack-text').textContent=ackText || '';el('ack').checked=false;
    el('next').hidden=!next;el('next').disabled=Boolean(ackText);
    el('next').textContent=next ? labels[s.step+1] || (next.actor==='Ingredient Supplier'?'Run supplier stub: ':'Execute: ')+next.name : '';
    el('complete').hidden=Boolean(next);
    el('scenario').textContent=`${FIXTURE.restaurant} · scenario ${FIXTURE.scenarioDate} · planning horizon ${FIXTURE.horizonDays} days`;
    renderRecommendation(s);renderOrder(s);renderTrace();renderFlow(s);
    el('event-count').textContent=`${s.events.length} events`;
    el('log').innerHTML=s.events.length ? s.events.map(e => `<details data-event="${e.id}"><summary><b>${e.id}</b> · ${esc(e.name)}</summary><p class="small muted">${esc(e.actor)} · ${esc(e.timestamp)}<br>${e.requirements.join(', ') || 'Use-case context'}</p><pre>${json(e.payload)}</pre></details>`).join('') : '<p class="small muted">Begin the session to record the first event.</p>';
    el('log').scrollTop=el('log').scrollHeight;
  }
  el('ack').addEventListener('change',()=>{el('next').disabled=!el('ack').checked;});
  el('next').addEventListener('click',()=>{
    const action=engine.nextAction();if(!action)return;
    const input={};
    if(['UC.1.9','UC.1.22'].includes(action.id))input.reviewed=el('ack').checked;
    if(action.id==='UC.1.12')input.approved=el('ack').checked;
    if(action.id==='UC.1.10')input.quantities=Object.fromEntries(FIXTURE.ingredients.map(i=>[i.id,el('qty-'+i.id).valueAsNumber]));
    try{engine.execute(action.id,input);el('error').hidden=true;if(action.requirements.length)selectedRequirement=action.requirements[0];render();}
    catch(error){el('error').textContent=error.message;el('error').hidden=false;}
  });
  el('reset').addEventListener('click',()=>{engine=new Skeleton();el('error').hidden=true;render();});
  el('export').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(engine.evidence(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='PANTRI_UC1_run_evidence.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  el('run-tab').addEventListener('click',()=>showView(false));el('model-tab').addEventListener('click',()=>showView(true));el('back-to-run').addEventListener('click',()=>showView(false));
  render();
})();
