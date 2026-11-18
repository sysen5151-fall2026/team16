const periodOptions = [
  ['week', 'Last 7 demo days'],
  ['today', 'Today'],
];

function fullDate(value) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(value.slice(0, 10) + 'T12:00:00Z'));
}

function periodSelect(id, label, value, options = periodOptions) {
  return `<label class="period-control"><span>${esc(label)}</span><select id="${id}" aria-label="${esc(label)}">
    ${options.map(([key, title]) => `<option value="${key}" ${value === key ? 'selected' : ''}>${esc(title)}</option>`).join('')}
  </select></label>`;
}

function periodLabel(range) {
  return range.start === range.end ? fullDate(range.end) : `${fullDate(range.start)} – ${fullDate(range.end)}`;
}

function paginationControls(result, action, label) {
  if (result.pages < 2) return '';
  return `<div class="pagination workflow-pagination" aria-label="${esc(label)} pagination">
    <span>${result.start}–${result.end} of ${result.total} · Page ${result.page} of ${result.pages}</span>
    <div>
      ${button('Previous', action, `data-page="${result.page - 1}" aria-label="Previous ${esc(label)} page" ${result.page === 1 ? 'disabled' : ''}`, 'mini')}
      ${button('Next', action, `data-page="${result.page + 1}" aria-label="Next ${esc(label)} page" ${result.page === result.pages ? 'disabled' : ''}`, 'mini')}
    </div>
  </div>`;
}

function linkedActivity(state) {
  // Preserve the original event history with an explicit destination per row.
  return [
    ...state.inventoryEvents.filter(event => event.restaurantId === state.restaurantId).map(event => ({
      ...event, action: 'ingredient', target: event.ingredientId,
      detail: `${state.ingredients.find(item => item.id === event.ingredientId)?.name ?? 'Ingredient'} · ${amount(Math.abs(event.quantityDelta))} ${event.unit}`,
    })),
    ...state.orders.filter(order => order.restaurantId === state.restaurantId).flatMap(order =>
      order.events.map(event => ({ ...event, action: 'order', target: order.id, detail: `${order.id} · ${order.supplierId}` }))),
    ...state.recoveries.filter(request => request.restaurantId === state.restaurantId).flatMap(request =>
      request.events.map(event => ({ ...event, action: 'recovery', target: request.id, detail: `${request.id} · ${request.partnerId}` }))),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function renderActivityRows(events) {
  if (!events.length) return '<p class="quiet-state">No recorded activity.</p>';
  return events.map(event => `
    <button class="activity-row activity-link" type="button" data-action="${event.action}" data-id="${esc(event.target)}">
      <span class="activity-dot ${event.kind === 'waste' ? 'orange' : ''}"></span>
      <div><strong>${esc(stateLabels[event.kind] ?? event.kind)}</strong><p>${esc(event.detail)}</p></div>
      <time datetime="${esc(event.occurredAt)}">${fullDate(event.occurredAt)}<small>${event.occurredAt.slice(11, 16)}</small></time>
      ${icon('chevron')}
    </button>`).join('');
}

function activityOverlay(state, overlay) {
  const history = paginate(linkedActivity(state), overlay.page, 12);
  return {
    title: 'Activity history',
    sub: 'Inventory, purchase orders and recovery',
    body: renderActivityRows(history.items) + paginationControls(history, 'history-page', 'activity'),
  };
}

function overviewMetric(label, value, caption, symbol, action, attributes = '') {
  const body = `<span class="metric-label">${esc(label)} <span class="metric-icon">${icon(symbol)}</span></span>
    <strong class="metric-value">${value}</strong><span class="metric-foot">${esc(caption)}</span>
    ${action ? icon('arrow', 'metric-arrow') : ''}`;
  return action
    ? `<button class="metric interactive" type="button" data-action="${action}" ${attributes}>${body}</button>`
    : `<div class="metric">${body}</div>`;
}

const healthStatuses = ['healthy', 'expiring', 'low', 'expired', 'unknown'];

function healthSummary(summary, risk) {
  const count = summary.statuses.healthy;
  if (healthStatuses.includes(risk) && summary.statuses[risk] > 0) {
    const label = riskLabels[risk];
    const total = summary.statuses[risk];
    return { risk, number: String(total), label, note: `${total} with primary status ${label}`, link: `View ${label.toLowerCase()}` };
  }
  const percent = summary.total ? (100 * count / summary.total).toFixed(1) + '%' : '—';
  return { risk: '', number: percent, label: summary.total ? 'in good standing' : 'No ingredients',
    note: `${count} ingredients in good standing`, link: 'Explore inventory' };
}

function inventoryHealth(summary, risk) {
  const view = healthSummary(summary, risk);
  const statuses = healthStatuses.filter(key => summary.statuses[key] > 0);
  let start = 0;
  const segments = statuses.map(key => {
    const share = 100 * summary.statuses[key] / summary.total;
    const length = statuses.length > 1 ? share - Math.min(0.7, share * 0.32) : share;
    const path = `<circle class="health-segment" cx="86" cy="86" r="73" pathLength="100"
      stroke-dasharray="${length.toFixed(4)} ${(100 - length).toFixed(4)}" stroke-dashoffset="${(-start).toFixed(4)}"
      data-action="health-select" data-risk="${key}" ${view.risk === key ? 'data-selected=""' : ''}/>`;
    start += share;
    return path;
  }).join('');

  return `<section class="card health-card" data-inventory-health data-health-risk="${view.risk}">
    <div class="card-head">
      <div><h2>A healthy pantry.</h2><p>${summary.total} tracked ingredients · primary stock status</p></div>
      ${button(icon('info'), 'health-info', 'aria-label="How inventory health is calculated" title="How inventory health is calculated"', 'icon-button health-info')}
    </div>
    <div class="card-body health-layout">
      <div class="health-ring">
        <svg viewBox="0 0 172 172" aria-hidden="true">
          <circle class="health-track" cx="86" cy="86" r="73"/>
          <g transform="rotate(-90 86 86)">${segments}</g>
        </svg>
        <div class="health-center"><strong data-health-number>${view.number}</strong><span data-health-label>${view.label}</span></div>
      </div>
      <div class="health-legend" role="group" aria-label="Highlight a primary stock status">
        ${statuses.map(key => `<button class="health-choice" type="button" data-action="health-select" data-risk="${key}" aria-pressed="${key === view.risk}">
          <i class="dot ${key}"></i><span>${riskLabels[key]}</span><strong>${summary.statuses[key]}</strong>
        </button>`).join('')}
      </div>
    </div>
    <div class="card-footer health-footer">
      <span data-health-note aria-live="polite">${view.note}</span>
      <button class="btn link inline-arrow" type="button" data-action="health-inventory" data-risk="${view.risk}">
        <span data-health-link>${view.link}</span>${icon('arrow')}
      </button>
    </div>
  </section>`;
}

function renderActionCenter(summary) {
  const countRisk = risk => summary.items.filter(item => item.risks.includes(risk)).length;
  const tasks = [
    [summary.drafts, 'Review purchase drafts', 'Check quantities before approving.', 'purchase-drafts', ''],
    [summary.pendingReceipts, 'Orders awaiting receiving', 'Record the quantities that arrived.', 'orders', 'data-filter="receiving"'],
    [countRisk('expiring'), 'Use it while it’s fresh', 'Expiring in the next 3 days.', 'filter', 'data-risk="expiring"'],
    [countRisk('low'), 'Stay ahead of shortages', 'Check ingredients below their reorder point.', 'filter', 'data-risk="low"'],
    [countRisk('expired'), 'Review expired stock', 'Check batches past their expiration date.', 'filter', 'data-risk="expired"'],
    [countRisk('unknown'), 'Check missing dates', 'Find batches with unrecorded expiration dates.', 'filter', 'data-risk="unknown"'],
  ].filter(([count]) => count > 0);

  return tasks.length ? tasks.map(([count, label, detail, action, attributes]) => `
    <button class="task-row" type="button" data-action="${action}" ${attributes}>
      <strong>${String(count).padStart(2, '0')}</strong>
      <span class="task-copy"><b>${label}</b><small>${detail}</small></span>
      <span class="task-arrow" aria-hidden="true">${icon('arrow')}</span>
    </button>`).join('') : '<p class="quiet-state">No open actions for this workspace.</p>';
}

function costBreakdown(series) {
  return `<details class="chart-details">
    <summary>View daily cost values</summary>
    <div class="table-scroll"><table class="chart-data-table">
      <thead><tr><th scope="col">Date</th><th scope="col" class="num">Usage</th><th scope="col" class="num">Waste</th></tr></thead>
      <tbody>${series.map(day => `<tr><td>${fullDate(day.date)}</td><td class="num">${money(day.usageCents)}${day.usageCostComplete === false ? ' known' : ''}</td><td class="num">${money(day.wasteCents)}${day.wasteCostComplete === false ? ' known' : ''}</td></tr>`).join('')}</tbody>
    </table></div>
  </details>`;
}

function costPeriodSwitch(period) {
  return `<div class="segment-control" role="group" aria-label="Cost period">
    ${[['week', '7 days'], ['today', 'Today']].map(([key, label]) => `<button id="cost-period-${key}" type="button"
      data-action="cost-period" data-period="${key}" aria-pressed="${period === key}">${label}</button>`).join('')}
  </div>`;
}

function renderCostTrend(series, range, ui, overview = false) {
  const usage = series.reduce((total, point) => total + point.usageCents, 0);
  const waste = series.reduce((total, point) => total + point.wasteCents, 0);
  const incompleteUsage = series.some(point => !point.usageCostComplete);
  const incompleteWaste = series.some(point => !point.wasteCostComplete);
  return `<section class="card trend-card ${overview ? 'overview-trend' : 'report-trend'}">
    <div class="card-head chart-heading">
      <div><h2>${overview ? 'Where your ingredients go.' : 'Usage & waste cost'}</h2>
        <div class="trend-total"><strong data-usage-total="${usage}" aria-label="${money(usage)}${incompleteUsage ? ' known' : ''} usage cost"><span aria-hidden="true">${money(usage)}</span></strong>
          <span>${incompleteUsage ? 'Known usage cost' : 'Usage cost'} · ${periodLabel(range)}</span>
        </div>
      </div>
      ${overview ? costPeriodSwitch(ui.reportPeriod) : ''}
    </div>
    <div class="card-body">${costChart(series, ui.chartDate, ui.animateCharts || ui.periodChanged)}</div>
    <div class="card-footer trend-footer">
      <span class="cost-key"><span><i></i>Usage cost</span><span><i></i>Waste cost</span></span>
      <span>${money(waste)} ${incompleteWaste ? 'known waste cost' : 'waste recorded'}</span>
      ${overview ? button('Full report ' + icon('arrow'), 'reports', '', 'link inline-arrow') : ''}
    </div>
    <div class="trend-details">${costBreakdown(series)}</div>
  </section>`;
}

function inventoryValueOverlay(state) {
  const summary = selectOverview(state);
  return {
    title: 'Inventory value',
    sub: fullDate(state.demoDate) + ' · Recorded batch costs',
    body: `<div class="drawer-summary"><div><small>Known on-hand value</small><b>${money(summary.valueCents)}</b></div></div>
      <div class="summary-strip"><span>Cost coverage <b>${summary.costCovered} / ${summary.total} ingredients</b></span><span>Currency <b>USD</b></span></div>
      <h3 class="section-heading">Value by category</h3>
      <div class="value-breakdown">${summary.categories.map(category => {
        const items = summary.items.filter(item => item.category === category.category);
        const cents = items.reduce((total, item) => total + item.valueCents, 0);
        return `<button type="button" class="value-row" data-action="category" data-category="${esc(category.category)}">
          <span>${esc(category.category)}<small>${items.filter(item => item.costCovered).length} of ${items.length} with recorded costs</small></span>
          <b>${money(cents)}</b>${icon('arrow')}
        </button>`;
      }).join('')}</div>
      <div class="form-footer">${button('Explore inventory', 'inventory', '', 'primary', 'arrow')}</div>`,
  };
}

function renderOverviewPage(state, ui) {
  const summary = selectOverview(state);
  const range = reportRange(state, ui.reportPeriod);
  const series = selectCostSeries(state, range);
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(state.demoDate + 'T12:00:00Z'));
  const largestCategory = Math.max(1, ...summary.categories.map(category => category.count));
  const low = summary.items.filter(item => item.risks.includes('low')).length;
  const expiring = summary.items.filter(item => item.risks.includes('expiring')).length;
  return `
    <div class="page-heading overview-hero">
      <div><div class="eyebrow">${date}</div><h1>Your kitchen. <span>In balance.</span></h1>
        <p>Review stock, purchasing and waste before service.</p></div>
      <div class="heading-actions">${button('Record receiving', 'record', 'data-kind="receipt"', 'primary', 'plus')}</div>
    </div>
    <div class="metrics overview-metrics">
      ${overviewMetric('Tracked ingredients', summary.total, `Across ${summary.categories.length} categories`, 'box', 'inventory')}
      ${overviewMetric('Inventory value', money(summary.valueCents), summary.costCovered === summary.total ? 'At recorded demo prices' : `Known costs for ${summary.costCovered} of ${summary.total} ingredients`, 'dollar', 'inventory-value')}
      ${overviewMetric('Needs attention', summary.attention, `${low} low · ${expiring} expiring soon`, 'alert', 'filter', 'data-risk="attention"')}
      ${overviewMetric('Purchase drafts', String(summary.drafts).padStart(2, '0'), 'Ready for your review', 'file', 'purchase-drafts')}
    </div>
    <div class="dashboard-grid overview-grid">
      ${inventoryHealth(summary, ui.healthRisk)}
      <section class="card actions-card">
        <div class="card-head"><div><h2>Your next moves.</h2><p>Stock and orders that need your attention</p></div></div>
        <div class="card-body task-list">${renderActionCenter(summary)}</div>
      </section>
      ${renderCostTrend(series, range, ui, true)}
      <section class="overview-categories">
        <div class="category-heading"><h2>Ingredient categories</h2><span>${summary.categories.length} categories · ${summary.total} ingredients</span></div>
        <div class="category-tiles">
          ${summary.categories.map(category => `<button type="button" data-action="category" data-category="${esc(category.category)}">
            <span class="category-caption"><span>${esc(category.category)}</span><strong>${category.count}</strong></span>
            <span class="category-track" aria-hidden="true"><i style="--fill:${100 * category.count / largestCategory}%"></i></span>
          </button>`).join('') || '<p class="quiet-state">No ingredient categories recorded.</p>'}
        </div>
      </section>
      <section class="card activity-card">
        <div class="card-head"><div><h2>Recent activity</h2><p>Latest inventory, order and recovery events</p></div>${button('Full history ' + icon('arrow'), 'activity-history', '', 'link inline-arrow')}</div>
        <div class="activity-list">${renderActivityRows(linkedActivity(state).slice(0, 4))}</div>
      </section>
    </div>`;
}

function ingredientDetails(state, overlay) {
  const item = getIngredientSummary(state, overlay.id);
  const movements = state.inventoryEvents.filter(event =>
    event.restaurantId === state.restaurantId && event.ingredientId === item.id);
  movements.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const history = paginate(movements, overlay.page, 12);

  return {
    title: item.name,
    sub: `${item.category} · ${item.id.toUpperCase()}`,
    body: `
      <div class="drawer-summary">
        <div><small>Recorded on hand</small><b id="detail-onhand">${amount(item.onHand)} <em>${esc(item.unit)}</em></b></div>
        ${badge(item.status)}
      </div>
      <div class="summary-strip">
        <span>Usable now <b>${amount(item.usableStock)} ${esc(item.unit)}</b></span>
        <span>Reserved <b>${amount(item.reserved)} ${esc(item.unit)}</b></span>
        <span>Reorder point <b>${amount(item.reorderPoint)} ${esc(item.unit)}</b></span>
      </div>
      <div class="drawer-actions">
        ${button('Receive', 'record', `data-kind="receipt" data-ingredient="${esc(item.id)}"`, 'primary', 'plus')}
        ${button('Record usage', 'record', `data-kind="usage" data-ingredient="${esc(item.id)}"`)}
        ${button('Stock count', 'record', `data-kind="count" data-ingredient="${esc(item.id)}"`)}
        ${button('Record waste', 'record', `data-kind="waste" data-ingredient="${esc(item.id)}"`)}
      </div>
      <h3 class="section-heading">Stock by batch <span>${item.batches.length}</span></h3>
      ${item.batches.map(batch => `<div class="batch-card">
        <div><strong>${esc(batch.id)}</strong><b>${amount(batch.quantity)} ${esc(item.unit)}</b></div>
        <p>Expiration <span>${fullDate(batch.expiresOn)}</span></p>
        <p>Received <span>${fullDate(batch.receivedAt)}</span></p>
        <p>Unit cost <span>${Number.isFinite(batch.unitCostCents) ? money(batch.unitCostCents) : 'Unknown'}</span></p>
        <p>Reserved <span>${amount(reservedForBatch(state, batch.id))} ${esc(item.unit)}</span></p>
      </div>`).join('') || '<p class="quiet-state">No recorded batches.</p>'}
      <h3 class="section-heading">Movement history <span>${history.total} records</span></h3>
      <div class="movement-list">${history.items.map(event => `<div class="movement">
        <span class="movement-symbol ${event.quantityDelta < 0 ? 'out' : ''}">${icon(event.quantityDelta < 0 ? 'arrow' : 'plus')}</span>
        <div><strong>${esc(stateLabels[event.kind] ?? event.kind)}</strong><p>${esc(event.reason)} · ${fullDate(event.occurredAt)}</p>
        <small>${esc(event.batchId)} · ${amount(event.before)} → ${amount(event.after)} ${esc(event.unit)}</small></div>
        <b>${event.quantityDelta >= 0 ? '+' : ''}${amount(event.quantityDelta)} <small>${esc(event.unit)}</small></b>
      </div>`).join('') || '<p class="quiet-state">No movements recorded.</p>'}</div>
      ${paginationControls(history, 'movement-page', 'movement')}`,
  };
}

function draftWasteContext(signal, end) {
  if (!signal) return '';
  return `<aside class="planning-context">
    <strong>Recent recorded waste</strong>
    <p>${amount(signal.quantity)} ${esc(signal.unit)} · ${signal.count} events · ${esc(signal.mainReason)} · 7 days ending ${fullDate(end)}</p>
    <p>${esc(signal.guidance)}</p>
  </aside>`;
}

function purchaseDraftCard(state, draft) {
  const line = draft.lines[0];
  const item = state.ingredients.find(ingredient => ingredient.id === line.ingredientId);
  return `<article class="card draft-card">
    <div class="draft-supplier">${icon('truck')}<span>${esc(draft.supplierId)}</span>${badge('draft')}</div>
    <div class="draft-body">
      <div class="eyebrow">${esc(draft.id.toUpperCase())} · VERSION ${draft.version}</div>
      <h2>${esc(item.name)}</h2>
      <p>${draft.lines.length} ingredient${draft.lines.length === 1 ? '' : 's'} · ${line.horizonDays}-day planning window</p>
      <div class="draft-calculation">
        <div><small>Forecast demand</small><b>${amount(line.forecastQty)} <em>${esc(line.unit)}</em></b></div>
        <span aria-hidden="true">−</span>
        <div><small>Usable stock</small><b>${amount(line.usableStock)} <em>${esc(line.unit)}</em></b></div>
        <span aria-hidden="true">→</span>
        <div class="suggested"><small>Suggested</small><b>${amount(line.suggestedQty)} <em>${esc(line.unit)}</em></b></div>
      </div>
    </div>
    <div class="draft-bottom">
      <div><small>Draft estimate</small><b>${purchaseEstimate(draft.lines)}</b></div>
      ${button('Review draft', 'draft', `data-id="${esc(draft.id)}"`, 'primary', 'arrow')}
    </div>
  </article>`;
}

function renderOrders(state, ui) {
  const pendingOnly = ui.orderFilter === 'receiving';
  const orders = [...state.orders].reverse().filter(order => !pendingOnly || isAwaitingReceiving(order));
  const filter = periodSelect('order-filter', 'Order status', ui.orderFilter, [
    ['all', 'All orders'], ['receiving', 'Awaiting receiving'],
  ]);
  const controls = `<div class="list-tools"><span>${orders.length} orders</span>${filter}</div>`;
  if (!orders.length) {
    return controls + (pendingOnly
      ? empty('No orders awaiting receiving', 'Sent orders with outstanding quantities appear here.')
      : empty('No orders yet', 'Review a draft and approve the final quantities.', button('Review drafts', 'purchase-tab', 'data-tab="drafts"', 'primary')));
  }
  return controls + `<div class="table-card"><div class="table-scroll"><table>
    <thead><tr><th scope="col">Order / Supplier</th><th scope="col">Approved estimate</th><th scope="col">Supplier</th><th scope="col">Receiving</th><th scope="col">Approved date</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
    <tbody>${orders.map(order => `<tr>
      <td><strong>${esc(order.id)}</strong><small class="block muted">${esc(order.supplierId)}</small></td>
      <td>${purchaseEstimate(order.approvedLines)}<small class="block muted">${order.approvedLines.map(line => `${amount(line.managerQty)} ${esc(line.unit)}`).join(' · ')}</small></td>
      <td>${badge(order.supplierStatus)}</td>
      <td>${badge(order.fulfillmentStatus)}<small class="block muted">${order.approvedLines.map(line => `${amount(order.receivedQuantities[line.ingredientId] ?? 0)} / ${amount(line.managerQty)} ${esc(line.unit)}`).join(' · ')}</small></td>
      <td>${fullDate(order.approvedAt)}</td>
      <td>${button('View order', 'order', `data-id="${esc(order.id)}"`, 'mini', 'chevron')}</td>
    </tr>`).join('')}</tbody>
  </table></div></div>`;
}

function renderPurchasingPage(state, ui) {
  const drafts = state.drafts.filter(draft => draft.status === 'draft');
  const showingDrafts = ui.purchaseTab === 'drafts';
  const actions = showingDrafts && drafts.length
    ? button('Recalculate drafts', 'refresh-drafts', '', 'secondary', 'refresh') : '';
  return heading('', 'Purchasing', 'Review suggested quantities, approve orders and record what arrives.', actions) + `
    <div class="segment-control page-segments" role="group" aria-label="Purchasing views">
      <button type="button" data-action="purchase-tab" data-tab="drafts" class="${showingDrafts ? 'selected' : ''}" aria-pressed="${showingDrafts}">Recommendations & drafts <span>${drafts.length}</span></button>
      <button type="button" data-action="purchase-tab" data-tab="orders" class="${!showingDrafts ? 'selected' : ''}" aria-pressed="${!showingDrafts}">Orders <span>${state.orders.length}</span></button>
    </div>` + (showingDrafts
      ? drafts.length
        ? `<div class="notice">${icon('info')}<span>Suggestions use estimated demand and usable stock. The manager reviews the final quantities before sending.</span></div>
          <div class="draft-grid">${drafts.map(draft => purchaseDraftCard(state, draft)).join('')}</div>`
        : empty('All drafts reviewed', 'Review approved orders and receiving status in Orders.', button('View orders', 'orders', '', 'primary'))
      : renderOrders(state, ui));
}

function renderRecoveryRequests(state) {
  const requests = [...state.recoveries].reverse();
  if (!requests.length) return empty('No recovery requests', 'Create a pickup request for usable surplus.', button('New recovery request', 'new-recovery', '', 'primary', 'plus'));
  return `<div class="notice">${icon('leaf')}<span>Requests reserve stock. Record collection once the partner actually picks up the food.</span></div>
    <div class="recovery-grid">${requests.map(request => {
      const line = request.lines[0];
      const item = state.ingredients.find(ingredient => ingredient.id === line.ingredientId);
      const active = !['collected', 'cancelled'].includes(request.status);
      return `<article class="card recovery-card">
        <div class="card-head"><div><div class="eyebrow">${esc(request.id)}</div><h2>${esc(item.name)}</h2></div>${badge(request.status)}</div>
        <div class="card-body">
          <div class="recovery-amount">${amount(line.quantity)} <span>${esc(line.unit)}</span></div>
          <p>${esc(request.partnerId)}</p><p class="muted">${icon('clock')} ${esc(request.requestedWindow)}</p>
          <p class="muted">${active ? 'Reserved from ' + esc(line.batchId) : 'Reservation closed'}</p>
          ${request.followUp ? `<p class="followup-note"><strong>${esc(request.owner)}</strong> · ${esc(request.followUp)}</p>` : ''}
        </div>
        <div class="card-footer">${button('View request', 'recovery', `data-id="${esc(request.id)}"`, 'secondary', 'arrow')}</div>
      </article>`;
    }).join('')}</div>`;
}

function renderWasteLog(state, ui) {
  const range = ui.wastePeriod === 'all' ? null : reportRange(state, ui.wastePeriod);
  const events = selectWasteEvents(state, range, ui.wasteIngredient);
  const page = paginate(events, ui.wastePage, 15);
  const items = new Map(state.ingredients.map(item => [item.id, item]));
  const summary = summarizeWaste(state, events);
  const activeRecoveries = state.recoveries.filter(request => !['collected', 'cancelled'].includes(request.status)).length;
  const label = range ? periodLabel(range) : 'All recorded dates';
  const massCaption = summary.missingMass ? `${summary.missingMass} records lack a mass conversion` : 'Recorded quantities with known mass';
  const costCaption = summary.missingCost ? `${summary.missingCost} records lack a unit cost` : 'Sum of daily totals at recorded unit costs';
  return `<div class="list-tools">
    <div><span>${label}</span>${ui.wasteIngredient ? `<span class="filter-pill">${esc(items.get(ui.wasteIngredient)?.name ?? '')}</span>${button('Clear ingredient', 'clear-waste-filter', '', 'ghost', 'close')}` : ''}</div>
    ${periodSelect('waste-period', 'Waste period', ui.wastePeriod, [['all', 'All history'], ...periodOptions])}
  </div>
  <div class="metrics three summary-metrics">
    ${overviewMetric('Recorded waste mass', events.length ? amount(summary.knownMassKg) + ' <small>kg</small>' : '—', massCaption, 'leaf')}
    ${overviewMetric('Recorded waste cost', events.length ? money(summary.knownCostCents) : '—', costCaption, 'dollar')}
    ${overviewMetric('Active recoveries', activeRecoveries, 'Current stock reservations', 'truck', 'waste-tab', 'data-tab="recovery"')}
  </div>
  ${events.length ? `<div class="table-meta"><span><b>${events.length}</b> waste records</span><span>Most recent first</span></div>
    <div class="table-card"><div class="table-scroll"><table>
      <thead><tr><th scope="col">Ingredient</th><th scope="col">Batch</th><th scope="col">Quantity</th><th scope="col">Reason</th><th scope="col" class="num">Cost</th><th scope="col">Recorded</th></tr></thead>
      <tbody>${page.items.map(event => `<tr>
        <td>${button(esc(items.get(event.ingredientId)?.name ?? 'Ingredient'), 'ingredient', `data-id="${esc(event.ingredientId)}"`, 'link')}</td>
        <td>${esc(event.batchId)}</td><td>${amount(Math.abs(event.quantityDelta))} ${esc(event.unit)}</td><td>${esc(event.reason)}</td>
        <td class="num">${Number.isFinite(event.unitCostCents) ? money(Math.abs(event.quantityDelta) * event.unitCostCents) : 'Unknown'}</td>
        <td>${fullDate(event.occurredAt)} · ${event.occurredAt.slice(11, 16)}</td>
      </tr>`).join('')}</tbody>
    </table></div>${paginationControls(page, 'waste-page', 'waste log')}</div>`
    : empty('No waste records in this view', 'Choose another period or record a waste movement.')}`;
}

function renderWastePage(state, ui) {
  const recovery = ui.wasteTab === 'recovery';
  const actions = recovery ? button('New recovery request', 'new-recovery', '', 'primary', 'plus')
    : button('Record waste', 'record', `data-kind="waste" data-ingredient="${esc(ui.wasteIngredient || 'ing-001')}"`, 'primary', 'plus');
  return heading('', 'Waste & recovery', 'Record waste and coordinate pickup of usable surplus.', actions) + `
    <div class="segment-control page-segments" role="group" aria-label="Waste and recovery views">
      <button type="button" data-action="waste-tab" data-tab="waste" class="${!recovery ? 'selected' : ''}" aria-pressed="${!recovery}">Waste log</button>
      <button type="button" data-action="waste-tab" data-tab="recovery" class="${recovery ? 'selected' : ''}" aria-pressed="${recovery}">Recovery requests <span>${state.recoveries.length}</span></button>
    </div>${recovery ? renderRecoveryRequests(state) : renderWasteLog(state, ui)}`;
}

function renderPlanningSignals(state, range, period) {
  const signals = selectWastePlanning(state, range);
  const card = signal => `<article class="planning-signal">
    <div><h3>${esc(signal.name)}</h3><span>${amount(signal.quantity)} ${esc(signal.unit)} · ${signal.count} recorded ${signal.count === 1 ? 'event' : 'events'}</span></div>
    <p class="planning-reasons">${signal.reasons.map(([reason, count]) => `${esc(reason)} (${count})`).join(' · ')}</p>
    <p>${esc(signal.guidance)}</p>
    ${button('View waste records', 'waste-records', `data-ingredient="${esc(signal.ingredientId)}" data-period="${period}"`, 'link', 'arrow')}
  </article>`;

  return `<section class="card planning-panel">
    <div class="card-head"><div><h2>Waste insights for planning</h2><p>Recorded waste to review alongside stock availability before the next order.</p></div></div>
    <div class="card-body">
      ${signals.length ? `<div class="planning-grid">${signals.slice(0, 3).map(card).join('')}</div>` : '<p class="quiet-state">No recorded waste in this period to support a planning suggestion.</p>'}
      ${signals.length > 3 ? `<details class="chart-details"><summary>View ${signals.length - 3} more ingredients</summary>
        <div class="planning-grid">${signals.slice(3).map(card).join('')}</div></details>` : ''}
    </div>
  </section>`;
}

function renderReportsPage(state, ui) {
  const range = reportRange(state, ui.reportPeriod);
  const report = calculateReport(state, range);
  const usage = report.series.reduce((total, point) => total + point.usageCents, 0);
  const waste = report.series.reduce((total, point) => total + point.wasteCents, 0);
  const usageComplete = report.series.every(point => point.usageCostComplete);
  const wasteComplete = report.series.every(point => point.wasteCostComplete);
  const actions = costPeriodSwitch(ui.reportPeriod) + button('Export data', 'export', '', 'secondary', 'download');

  return heading('', 'Reports', 'Review waste, ingredient availability and recorded costs together.', actions) + `
    <div class="report-range">${icon('calendar')} <strong>${periodLabel(range)}</strong><span>${report.coverage} of ${report.days} days observed</span><span>${report.coverage ? amount(report.covers) + ' recorded diner covers' : 'Diner covers unavailable'}</span></div>
    <div class="metrics report-metrics summary-metrics">
      ${overviewMetric('Waste per 100 covers', report.wastePer100.value === null ? 'Not calculable' : report.wastePer100.value.toFixed(2) + ' <small>kg</small>', report.wastePer100.reason ?? `${amount(report.wasteKg)} kg waste ÷ ${amount(report.covers)} covers × 100`, 'leaf')}
      ${overviewMetric('Stockout rate', report.stockoutRate.value === null ? 'Not calculable' : report.stockoutRate.value.toFixed(2) + '<small>%</small>', report.stockoutRate.reason ?? `${report.unavailable} of ${report.opportunities} observed opportunities`, 'alert')}
      ${overviewMetric('Usage cost', money(usage), usageComplete ? 'Recorded unit costs' : 'Known portion · some unit costs missing', 'dollar')}
      ${overviewMetric('Waste cost', money(waste), wasteComplete ? 'Recorded unit costs' : 'Known portion · some unit costs missing', 'dollar')}
    </div>
    ${renderCostTrend(report.series, range, ui)}
    ${renderPlanningSignals(state, range, ui.reportPeriod)}`;
}
