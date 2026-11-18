function render({ capture = true } = {}) {
  if (ui.dirty && capture) snapshotForm();
  const previousOverlay = ui.lastOverlay;
  const active = document.activeElement;
  const hint = focusHint(active);
  const selection = [active?.selectionStart, active?.selectionEnd];
  const oldDialog = root.querySelector('.dialog-body');
  if (oldDialog && ui.lastOverlay) ui.lastOverlay.scrollTop = oldDialog.scrollTop;

  const state = service.getSnapshot();
  const pageChanged = ui.page !== ui.lastPage;
  const detailsOpen = !pageChanged && root.querySelector('.chart-details')?.open;
  const chartPage = ['overview', 'reports'].includes(ui.page);
  ui.animateCharts = chartPage && !ui.chartsPlayed;
  const pages = {
    overview: renderOverviewPage,
    inventory: renderInventory,
    purchasing: renderPurchasingPage,
    waste: renderWastePage,
    reports: renderReportsPage,
  };
  const navigation = [
    ['overview', 'home', 'Overview'],
    ['inventory', 'box', 'Inventory'],
    ['purchasing', 'cart', 'Purchasing'],
    ['waste', 'leaf', 'Waste & recovery'],
    ['reports', 'chart', 'Reports'],
  ];
  const drafts = state.drafts.filter(draft => draft.status === 'draft').length;
  const problem = service.getProblem();
  root.innerHTML = `
    <div class="app-shell" ${ui.overlay ? 'inert' : ''}>
      <a class="skip-link" href="#main-content">Skip to content</a>
      <aside class="sidebar">
        <a class="brand" href="#overview" data-action="overview" aria-label="PANTRI overview">
          <span class="brand-leaf"></span>pantri<span class="brand-period">.</span>
        </a>
        <nav aria-label="Main navigation">
          ${navigation.map(([page, symbol, label]) => `
            <button type="button" class="nav-item ${ui.page === page ? 'active' : ''}" data-action="${page}" ${ui.page === page ? 'aria-current="page"' : ''}>
              ${icon(symbol)}<span>${label}</span>${page === 'purchasing' && drafts ? `<span class="nav-count">${drafts}</span>` : ''}
            </button>`).join('')}
        </nav>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="restaurant-name">${icon('leaf')}<strong>Demo Buffet Hot Pot</strong></div>
          <div class="topbar-right">
            <span class="demo-tag"><i></i>DEMO DATA</span>
            ${button('Demo tools', 'demo', '', 'toolbar-button', 'settings')}
            <span class="avatar" aria-label="Manager MC">MC</span>
          </div>
        </header>
        ${problem ? `<div class="storage-banner" role="alert">
          <div>${icon('alert')}<span>${esc(problem)}</span></div>
          <div>
            ${button('Download saved copy', 'export-raw', '', 'mini')}
            ${button('Reload saved data', 'reload', '', 'mini')}
            ${button('Reset', 'reset', '', 'mini')}
          </div>
        </div>` : ''}
        <main id="main-content" tabindex="-1" class="page ${pageChanged ? 'page-enter' : ''}">${pages[ui.page](state, ui)}</main>
      </div>
    </div>
    ${renderOverlay(state, ui.overlay, ui.error, ui.discard)}
    <div id="toast-region" aria-live="polite" aria-atomic="true"></div>`;

  ui.lastPage = ui.page;
  ui.lastOverlay = ui.overlay;
  if (ui.animateCharts) ui.chartsPlayed = true;
  ui.periodChanged = false;
  document.body.classList.toggle('dialog-open', !!ui.overlay);
  renderToast();

  if (detailsOpen) root.querySelector('.chart-details').open = true;
  const dialog = root.querySelector('[role="dialog"]');
  if (dialog) {
    dialog.classList.toggle('dialog-refresh', ui.overlay === previousOverlay);
    dialog.querySelector('.dialog-body').scrollTop = ui.overlay.scrollTop ?? 0;
    updateFormPreview(dialog.querySelector('form'));
  }
  const target = dialog ? matchFocusTarget(dialogControls(dialog), hint)
    : matchFocusTarget(dialogControls(root.querySelector('.app-shell')), hint);
  if (target) {
    target.focus({ preventScroll: true });
    if (selection.every(Number.isInteger) && ['text', 'search'].includes(target.type)) {
      target.setSelectionRange(...selection);
    }
  }
}

function setHealthRisk(risk) {
  const panel = root.querySelector('[data-inventory-health]');
  const next = panel.dataset.healthRisk === risk ? '' : risk;
  const state = healthSummary(selectOverview(service.getSnapshot()), next);
  ui.healthRisk = state.risk;
  panel.dataset.healthRisk = state.risk;
  for (const segment of panel.querySelectorAll('.health-segment')) {
    segment.toggleAttribute('data-selected', segment.dataset.risk === state.risk);
  }
  for (const button of panel.querySelectorAll('.health-choice')) {
    button.setAttribute('aria-pressed', String(button.dataset.risk === state.risk));
  }
  panel.querySelector('[data-health-number]').textContent = state.number;
  panel.querySelector('[data-health-label]').textContent = state.label;
  panel.querySelector('[data-health-note]').textContent = state.note;
  panel.querySelector('[data-health-link]').textContent = state.link;
  panel.querySelector('[data-action="health-inventory"]').dataset.risk = state.risk;
}

function setChartDay(date) {
  ui.chartDate = ui.chartDate === date ? '' : date;
  const panel = root.querySelector('.paired-chart');
  let label = 'Day details dismissed.';
  for (const day of panel.querySelectorAll('.cost-day')) {
    const selected = day.dataset.date === ui.chartDate;
    day.setAttribute('aria-pressed', String(selected));
    if (selected) label = day.getAttribute('aria-label');
  }
  panel.querySelector('[data-chart-announcement]').textContent = label;
}

function setCostPeriod(period) {
  if (!periodOptions.some(([key]) => key === period) || ui.reportPeriod === period) return;
  const previous = root.querySelector('[data-usage-total]');
  const from = Number(previous?.dataset.displayedCents ?? previous?.dataset.usageTotal);
  ui.reportPeriod = period;
  ui.chartDate = '';
  ui.periodChanged = true;
  render();
  const target = root.querySelector('[data-usage-total]');
  const to = Number(target.dataset.usageTotal);
  if (!Number.isFinite(from) || from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const value = target.querySelector('span');
  const start = performance.now();
  value.textContent = money(from);
  target.dataset.displayedCents = String(from);
  function step(now) {
    if (!target.isConnected) return;
    const progress = Math.min(1, (now - start) / 380);
    const cents = Math.round(from + (to - from) * (1 - (1 - progress) ** 3));
    value.textContent = money(cents);
    target.dataset.displayedCents = String(cents);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateFormPreview(form) {
  const estimate = form?.querySelector('[data-draft-estimate]');
  if (estimate) {
    const quantities = [...form.querySelectorAll('input[data-draft-price]')];
    estimate.textContent = quantities.some(input => !input.value || !input.validity.valid)
      ? 'Check quantities'
      : purchaseEstimate(quantities.map(input => ({
        managerQty: Number(input.value),
        unitCostCents: input.dataset.draftPrice === '' ? null : Number(input.dataset.draftPrice),
      })));
  }
  const preview = form?.querySelector('[data-quantity-preview]');
  if (!preview) return;
  const input = form.elements.quantity;
  const next = preview.querySelector('[data-stock-result]');
  next.textContent = input?.value && input.validity.valid
    ? `${amount(qty(Number(preview.dataset.current) + Number(preview.dataset.direction) * Number(input.value)))} ${preview.dataset.unit}`
    : 'Check quantity';
}

function handleClassroomAction(action, element) {
  switch (action) {
    case 'health-select':
      setHealthRisk(element.dataset.risk);
      return true;
    case 'health-inventory':
      navigate('inventory', element.dataset.risk ? { risk: element.dataset.risk, primaryRisk: true } : {});
      return true;
    case 'inventory-value':
    case 'health-info':
      openOverlay({ type: action });
      return true;
    case 'chart-day':
      setChartDay(element.dataset.date);
      return true;
    case 'cost-period':
      setCostPeriod(element.dataset.period);
      return true;
    case 'purchase-drafts':
      ui.purchaseTab = 'drafts';
      ui.orderFilter = 'all';
      navigate('purchasing');
      return true;
    case 'orders':
      ui.purchaseTab = 'orders';
      ui.orderFilter = element.dataset.filter === 'receiving' ? 'receiving' : 'all';
      navigate('purchasing');
      return true;
    case 'activity-history':
      openOverlay({ type: 'history', page: 1 });
      return true;
    case 'history-page':
    case 'movement-page':
      ui.overlay.page = Number(element.dataset.page);
      render();
      return true;
    case 'waste-page':
      ui.wastePage = Number(element.dataset.page);
      render();
      return true;
    case 'waste-records':
      ui.wasteTab = 'waste';
      ui.wastePeriod = element.dataset.period;
      ui.wasteIngredient = element.dataset.ingredient;
      ui.wastePage = 1;
      navigate('waste');
      return true;
    case 'clear-waste-filter':
      ui.wasteIngredient = '';
      ui.wastePage = 1;
      render();
      return true;
    default:
      return false;
  }
}

function eligibleRecoveryBatches(state, ingredientId) {
  return state.batches.filter(batch =>
    batch.restaurantId === state.restaurantId &&
    batch.ingredientId === ingredientId &&
    batch.expiresOn && batch.expiresOn >= state.demoDate &&
    batch.quantity > reservedForBatch(state, batch.id));
}

function recoveryForm(state, overlay) {
  const ingredientId = overlay.values?.ingredientId ?? overlay.ingredientId ?? state.ingredients[0].id;
  const item = state.ingredients.find(ingredient => ingredient.id === ingredientId);
  const batches = eligibleRecoveryBatches(state, item.id);
  const selected = batches.find(batch => batch.id === overlay.values?.batchId) ?? batches[0];
  const maximum = selected ? qty(selected.quantity - reservedForBatch(state, selected.id)) : 0;
  const step = item.unit === 'kg' ? 0.001 : 1;
  return {
    title: 'New recovery request',
    sub: 'Arrange pickup for a usable surplus batch',
    body: `<form data-form="recovery-request">
      ${selectField(overlay, 'ingredientId', 'Ingredient', state.ingredients.map(ingredient => ({ value: ingredient.id, label: ingredient.name })), item.id)}
      ${selected ? `${selectField(overlay, 'batchId', 'Batch', batches.map(batch => ({
        value: batch.id, label: `${batch.id} · ${amount(qty(batch.quantity - reservedForBatch(state, batch.id)))} ${item.unit} available`,
      })), selected.id)}
        ${field(overlay, 'quantity', `Quantity (${item.unit})`, Math.min(1, maximum), 'number', `required min="${step}" max="${maximum}" step="${step}"`)}`
        : '<p class="notice compact">This ingredient has no unreserved stock in a known, unexpired batch.</p>'}
      ${field(overlay, 'partnerId', 'Recovery partner', 'Community Food Recovery', 'text', 'required maxlength="120"')}
      ${field(overlay, 'requestedWindow', 'Pickup window', 'Today, 14:00–16:00', 'text', 'required maxlength="120"')}
      ${noteField(overlay, 'note', 'Coordination notes', '', false)}
      ${selected ? stockPreview('Available after reservation', maximum, item.unit, -1) : ''}
      <p class="field-help">The request reserves the entered quantity. Record collection after pickup.</p>
      <div class="form-footer">
        ${button('Cancel', 'close-overlay')}
        <button type="submit" class="btn primary" ${selected ? '' : 'disabled'}>Create request</button>
      </div>
    </form>`,
  };
}
