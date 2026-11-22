// When a custom <select> is open the focused element is one of its <option>s; treat the
// <select> itself as the focused control so focus can be restored after a re-render.
const focusedControl = () => {
  const element = document.activeElement;
  return element?.closest?.('select') ?? element;
};
const selectIsOpen = () => {
  try { return !!root.querySelector('select:open'); } catch { return false; }
};

function render({ capture = true } = {}) {
  if (ui.dirty && capture) snapshotForm();
  if (!assistantVisible(ui)) ui.assistant.open = false;
  const previousOverlay = ui.lastOverlay;
  const active = focusedControl();
  const hint = focusHint(active);
  const selection = [active?.selectionStart, active?.selectionEnd];
  const oldDialog = root.querySelector('.dialog-body');
  if (oldDialog && ui.lastOverlay) ui.lastOverlay.scrollTop = oldDialog.scrollTop;

  if (!ui.account) {
    root.innerHTML = renderSignIn(ui);
    document.body.classList.remove('dialog-open');
    matchFocusTarget(dialogControls(root), hint)?.focus({ preventScroll: true });
    return;
  }

  const state = ui.state;
  const manager = ui.account.role === 'manager';
  const navigation = workspaceNavigation(ui.account.role);
  const [homePage, , homeLabel] = navigation[0];
  const pageChanged = ui.page !== ui.lastPage;
  const detailsOpen = !pageChanged && root.querySelector('.chart-details')?.open;
  const chartPage = !!state && ['overview', 'reports'].includes(ui.page);
  ui.animateCharts = chartPage && !ui.chartsPlayed;
  const pages = {
    overview: renderOverviewPage,
    inventory: renderInventory,
    purchasing: renderPurchasingPage,
    waste: renderWastePage,
    reports: renderReportsPage,
    supplier: renderSupplierPage,
    'recovery-portal': renderRecoveryPortal,
    support: renderSupportPage,
  };
  const ready = !!state || ui.account.role === 'support';
  const drafts = state?.drafts?.filter(draft => draft.status === 'draft').length ?? 0;
  const name = manager || ui.account.role === 'staff' ? 'Restaurant workspace' : ui.account.name;
  const initials = /^[A-Z]{2}$/.test(ui.account.name) ? ui.account.name
    : ui.account.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const navInner = (page, symbol, label, index) =>
    `${icon(symbol)}<span class="nav-text" style="--n:${index}">${label}</span>${page === 'purchasing' && drafts ? `<span class="nav-count">${drafts}</span>` : ''}`;
  const content = ready ? pages[ui.page](state, ui)
    : ui.workspaceError ? empty('Workspace unavailable', 'Retry to load the latest shared data.')
    : '<p class="quiet-state" role="status">Loading workspace…</p>';
  root.innerHTML = `
    <div class="app-shell ${ui.railOpen ? 'rail-open' : ''}" ${ui.overlay ? 'inert' : ''}>
      <a class="skip-link" href="#main-content">Skip to content</a>
      <aside class="sidebar">
        <a class="brand" href="#${homePage}" data-action="${homePage}" aria-label="PANTRI ${homeLabel}">
          <span class="brand-leaf"></span><span class="brand-word">pantri<span class="brand-period">.</span></span>
        </a>
        <nav aria-label="Main navigation">
          <span class="nav-pill" aria-hidden="true"><span class="nav-pill-ink">${navigation.map(([page, symbol, label], index) =>
            `<span class="nav-item">${navInner(page, symbol, label, index)}</span>`).join('')}</span></span>
          ${navigation.map(([page, symbol, label], index) => `
            <button type="button" class="nav-item ${ui.page === page ? 'active' : ''}" data-action="${page}" ${ui.page === page ? 'aria-current="page"' : ''} title="${label}">
              ${navInner(page, symbol, label, index)}
            </button>`).join('')}
        </nav>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div class="restaurant-name">${icon('leaf')}<strong>${esc(name)}</strong></div>
          <div class="topbar-right">
            <span class="demo-tag"><i></i>SAMPLE DATA</span>
            ${manager && state ? button('Data tools', 'demo', '', 'toolbar-button', 'settings') : ''}
            <button class="role-switch-button" type="button" data-action="switch-role" aria-haspopup="dialog" title="${esc(ui.account.label + ' · ' + ui.account.name)}">
              <span class="avatar" aria-hidden="true">${esc(initials)}</span><span>Switch role</span>${icon('chevrondown')}
            </button>
          </div>
        </header>
        ${workspaceBanners(ui, manager)}
        <main id="main-content" tabindex="-1" class="page ${pageChanged ? 'page-enter' : ''}">${content}</main>
      </div>
    </div>
    ${renderOverlay(state, ui.overlay, ui.error, ui.discard, ui)}
    <div id="assistant-region">${renderAssistant(ui)}</div>
    <div id="toast-region" aria-live="polite" aria-atomic="true"></div>`;

  ui.lastPage = ui.page;
  ui.lastOverlay = ui.overlay;
  if (ui.animateCharts) ui.chartsPlayed = true;
  ui.periodChanged = false;
  document.body.classList.toggle('dialog-open', !!ui.overlay);
  renderToast();
  placeNavPill(pageChanged);
  if (pageChanged) {
    const main = root.querySelector('main');
    staggerCards(main);
    rollNumbers(main);
    animateHealthRing(main);
  }

  if (detailsOpen) root.querySelector('.chart-details')?.setAttribute('open', '');
  const dialog = root.querySelector('[role="dialog"]');
  if (dialog) {
    dialog.classList.toggle('dialog-refresh', ui.overlay === previousOverlay);
    dialog.querySelector('.dialog-body').scrollTop = ui.overlay.scrollTop ?? 0;
    updateFormPreview(dialog.querySelector('form'));
  }
  const target = dialog ? matchFocusTarget(dialogControls(dialog), hint)
    : matchFocusTarget(dialogControls(root.querySelector('.app-shell')), hint)
      ?? matchFocusTarget(dialogControls(root.querySelector('#assistant-region')), hint);
  if (target) {
    target.focus({ preventScroll: true });
    if (selection.every(Number.isInteger) && ['text', 'search'].includes(target.type)) {
      target.setSelectionRange(...selection);
    }
  }
  syncExplanation();
}

function workspaceBanners(ui, manager) {
  const connection = ui.workspaceError ? `<div class="storage-banner" role="alert">
    <div>${icon('alert')}<span>${esc(ui.workspaceError)}</span></div>
    <div>${button('Retry', 'reload', '', 'mini', 'refresh')}</div>
  </div>` : '';
  const storage = ui.storage?.status === 'quarantined' ? `<div class="storage-banner" role="alert">
    <div>${icon('alert')}<span>${esc(ui.storage.problem ?? 'The saved dataset needs recovery.')}</span></div>
    <div>
      ${manager && ui.storage.hasRaw ? button('Download saved copy', 'export-raw', '', 'mini') : ''}
      ${manager && ui.storage.hasCheckpoint ? button('Download prior checkpoint', 'export-checkpoint', '', 'mini') : ''}
      ${button('Reload saved data', 'reload', '', 'mini')}
      ${manager ? button('Reset', 'reset', '', 'mini') : ''}
    </div>
  </div>` : '';
  return connection + storage;
}

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Page choreography ----------
// Leave: the visible blocks of the current page dissolve one after another (bottom first,
// 35 ms apart) before the next page is rendered.
// Enter: the new blocks condense out of a blur left → right / top → bottom (55 ms apart);
// the page heading arrives just after the first cards; large panels come last, from lower down;
// numbers roll and the health ring draws only once their own card has landed.
const ENTER_TARGETS = '.page-heading, .page-segments, .inventory-toolbar, .list-tools, .table-meta, .report-range, .notice, .metric, .card, .table-card, .overview-categories';
const RISE_TARGETS = '.trend-card, .table-card, .planning-panel, .activity-card, .overview-categories';
const ENTER_MS = 440;
const RISE_MS = 520;

function topLevelBlocks(scope) {
  return [...scope.querySelectorAll(ENTER_TARGETS)].filter(element => !element.parentElement.closest(ENTER_TARGETS));
}

function staggerCards(scope) {
  if (!scope || prefersReducedMotion()) return;
  let index = 0;
  for (const element of topLevelBlocks(scope)) {
    const heading = element.matches('.page-heading');
    const rise = element.matches(RISE_TARGETS);
    let delay = heading ? 60 + 1.6 * 55 : 60 + Math.min(index++, 10) * 55;
    if (rise) delay += 70;
    element.dataset.enterDelay = String(Math.round(delay));
    element.style.setProperty('--d', Math.round(delay) + 'ms');
    element.classList.add('card-enter');
    if (rise) element.classList.add('enter-rise');
  }
}

function enterEnd(card) {
  if (!card) return 300;
  return Number(card.dataset.enterDelay) + (card.classList.contains('enter-rise') ? RISE_MS : ENTER_MS);
}

function leavePage(done) {
  const main = root.querySelector('main');
  if (!main || prefersReducedMotion()) { done(); return; }
  const visible = topLevelBlocks(main)
    .map(element => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.bottom > 0 && rect.top < innerHeight)
    .sort((a, b) => b.rect.top - a.rect.top || b.rect.left - a.rect.left);
  visible.forEach(({ element }, order) => {
    element.classList.remove('card-enter', 'enter-rise');
    element.style.setProperty('--o', Math.min(order, 4) * 30 + 'ms');
    element.classList.add('card-leave');
  });
  const total = visible.length ? 190 + Math.min(visible.length - 1, 4) * 30 + 20 : 0;
  ui.leaveTimer = setTimeout(done, total);
}

// ---------- Health ring entrance ----------
// Segments grow one after another from 12 o'clock (green, then orange, then red), each ending
// with a small stroke "breath"; each legend row appears as its segment starts.
function animateHealthRing(scope) {
  const panel = scope?.querySelector('[data-inventory-health]');
  if (!panel || prefersReducedMotion() || typeof panel.animate !== 'function') return;
  let at = enterEnd(panel.closest('[data-enter-delay]')) - 60;
  const legend = [...panel.querySelectorAll('.health-choice')];
  [...panel.querySelectorAll('.health-segment')].forEach((segment, index) => {
    const [length, gap] = (segment.getAttribute('stroke-dasharray') ?? '0 100').trim().split(/\s+/).map(Number);
    const duration = Math.round(Math.max(280, Math.min(900, length * 10)));
    segment.animate(
      [{ strokeDasharray: `0 100` }, { strokeDasharray: `${length} ${gap}` }],
      { duration, delay: at, easing: 'cubic-bezier(.3, .7, .2, 1)', fill: 'backwards' },
    );
    segment.animate(
      [{ strokeWidth: '13px' }, { strokeWidth: '17px' }, { strokeWidth: '13px' }],
      { duration: 320, delay: at + duration - 80, easing: 'ease-out' },
    );
    legend[index]?.animate(
      [{ opacity: 0, transform: 'translateX(-8px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 340, delay: at, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'backwards' },
    );
    at += duration - 40;
  });
}

// ---------- Odometer roll ----------
// Every digit is a clipped vertical strip of 0–9 (three cycles, drawn with ::before so no text is
// added to the page). It starts on 0, so "$35,438.36" first reads "$00,000.00", then each strip
// slides one full turn and lands on its digit. Symbols ($ , . % kg) never move. Digits start
// left → right 35 ms apart, once their card has landed. Afterwards the original text node is
// simply left visible again.
const ROLL_TARGETS = '.metric-value, .health-center strong, .task-row > strong, .recovery-amount';
const ROLL_MS = 1100;

function rollNumbers(scope) {
  if (!scope || prefersReducedMotion()) return;
  const reels = [];
  for (const element of scope.querySelectorAll(ROLL_TARGETS)) {
    const card = element.closest('[data-enter-delay]');
    const startAt = enterEnd(card) + 80;
    let digitIndex = 0;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) if (/\d/.test(node.nodeValue)) nodes.push(node);
    for (const node of nodes) {
      // The original text node stays exactly where it is (only made transparent inside an inline
      // span), so spacing, letter-spacing and the units after it never move. The reel is laid
      // over it like a sticker.
      const textColor = getComputedStyle(node.parentElement).color;
      const wrapper = document.createElement('span');
      wrapper.className = 'odo';
      const reel = document.createElement('span');
      reel.className = 'odo-reel';
      reel.setAttribute('aria-hidden', 'true');
      const strips = [];
      for (const char of node.nodeValue) {
        if (/\d/.test(char)) {
          const column = document.createElement('span');
          column.className = 'odo-col';
          const strip = document.createElement('span');
          strip.className = 'odo-strip';
          strip.innerHTML = Array.from({ length: 30 }, (_, n) => `<span data-d="${n % 10}"></span>`).join('');
          column.append(strip);
          reel.append(column);
          strips.push({ strip, digit: Number(char), delay: startAt + digitIndex++ * 35 });
        } else {
          const symbol = document.createElement('span');
          symbol.className = 'odo-sym';
          symbol.dataset.s = char;
          reel.append(symbol);
        }
      }
      node.replaceWith(wrapper);
      wrapper.append(node, reel);
      const box = wrapper.getClientRects()[0];
      if (!box) { wrapper.replaceWith(node); continue; }   // not rendered (hidden or collapsed)
      reel.style.color = textColor;
      // Each digit window is the line height plus headroom (so bold glyphs are never clipped).
      // A glyph is centred in its window, so shifting the reel up by half the difference between
      // the window and the text's content area puts every digit exactly on the original glyph.
      // The card may still be scaled by its entry animation, so divide that scale back out.
      const style = getComputedStyle(wrapper);
      const cardTransform = card ? getComputedStyle(card).transform : 'none';
      const scale = cardTransform && cardTransform !== 'none' ? new DOMMatrix(cardTransform).a : 1;
      const contentHeight = box.height / scale;
      const lineHeight = style.lineHeight.endsWith('px') ? parseFloat(style.lineHeight) : contentHeight;
      const step = lineHeight + 2 * Math.ceil(parseFloat(style.fontSize) * 0.2);
      reel.style.setProperty('--h', step + 'px');
      reel.style.top = -(step - contentHeight) / 2 + 'px';
      reels.push({ wrapper, original: node, strips });
    }
  }
  if (!reels.length) return;
  void scope.offsetHeight;   // commit the "all zeros" start state so the transition has a starting point
  for (const { strips } of reels) {
    for (const { strip, digit, delay } of strips) {
      strip.style.transition = `transform ${ROLL_MS}ms cubic-bezier(.16, 1, .3, 1) ${delay}ms`;
      strip.style.transform = `translateY(calc(var(--h) * -${10 + digit}))`;
    }
  }
  const longest = Math.max(...reels.flatMap(reel => reel.strips.map(strip => strip.delay)));
  setTimeout(() => {
    for (const { wrapper, original } of reels) if (wrapper.isConnected) wrapper.replaceWith(original);
  }, longest + ROLL_MS + 80);
}

// ---------- Sidebar rail ----------
// Open after the pointer rests in the rail for 90 ms, close 220 ms after it leaves. The state
// lives in ui.railOpen, so re-rendering after a click keeps the rail open under the pointer.
function setRail(open) {
  clearTimeout(ui.railTimer);
  if (ui.railOpen === open) return;
  ui.railTimer = setTimeout(() => {
    ui.railOpen = open;
    root.querySelector('.app-shell')?.classList.toggle('rail-open', open);
  }, open ? 90 : 220);
}

// ---------- Sidebar pill ----------
// The pill only moves vertically; its width follows the rail through CSS (left/right), so it
// stays correct while the rail expands or the window is resized. Inside it, an ink copy of the
// menu moves the opposite way, keeping dark text exactly under the pill.
function setPill(pill, y, height) {
  pill.style.height = height + 'px';
  pill.style.transform = `translateY(${y}px)`;
  pill.firstElementChild.style.transform = `translateY(${-y}px)`;
}

function placeNavPill(animate) {
  const nav = root.querySelector('.sidebar nav');
  const pill = nav?.querySelector('.nav-pill');
  if (!pill) return;
  const active = nav.querySelector('.nav-item.active[data-action]');
  if (!active) { pill.style.opacity = '0'; return; }
  pill.style.opacity = '';
  const ink = pill.firstElementChild;
  const y = active.offsetTop;
  if (animate && ui.navPillY != null && ui.navPillY !== y && !prefersReducedMotion()) {
    pill.style.transition = ink.style.transition = 'none';
    setPill(pill, ui.navPillY, active.offsetHeight);
    void pill.offsetWidth;
    pill.style.transition = ink.style.transition = '';
  } else {
    pill.style.transition = ink.style.transition = 'none';
    setPill(pill, y, active.offsetHeight);
    void pill.offsetWidth;
    pill.style.transition = ink.style.transition = '';
  }
  setPill(pill, y, active.offsetHeight);
  ui.navPillY = y;
}

// Start the pill on its way the moment a page is chosen, before the old page has left.
function movePillTo(page) {
  const nav = root.querySelector('.sidebar nav');
  const pill = nav?.querySelector('.nav-pill');
  const item = nav?.querySelector(`.nav-item[data-action="${page}"]`);
  if (!pill || !item) return;
  setPill(pill, item.offsetTop, item.offsetHeight);
  ui.navPillY = item.offsetTop;
}

function setHealthRisk(risk) {
  const panel = root.querySelector('[data-inventory-health]');
  const next = panel.dataset.healthRisk === risk ? '' : risk;
  const state = healthSummary(selectOverview(ui.state), next);
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
  if (!target) return;
  const to = Number(target.dataset.usageTotal);
  if (!Number.isFinite(from) || from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const value = target.querySelector('span');
  const start = performance.now();
  value.textContent = money(from);
  target.dataset.displayedCents = String(from);
  function step(now) {
    if (!target.isConnected) return;
    const progress = Math.min(1, Math.max(0, (now - start) / 380));
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

function recoveryForm(state, overlay, ui) {
  const ingredientId = overlay.values?.ingredientId ?? overlay.ingredientId ?? state.ingredients[0].id;
  const item = state.ingredients.find(ingredient => ingredient.id === ingredientId);
  const batches = eligibleRecoveryBatches(state, item.id);
  const selected = batches.find(batch => batch.id === overlay.values?.batchId) ?? batches[0];
  const maximum = selected ? qty(selected.quantity - reservedForBatch(state, selected.id)) : 0;
  const step = item.unit === 'kg' ? 0.001 : 1;
  const partners = ui.accounts.filter(account => account.role === 'recovery').map(account => account.name);
  return {
    title: 'New recovery request',
    sub: 'Arrange pickup for a usable surplus batch',
    actions: button('Cancel', 'close-overlay') +
      `<button type="submit" form="dialog-form" class="btn primary" ${selected && partners.length ? '' : 'disabled'}>Create request</button>`,
    body: `<form id="dialog-form" data-form="recovery-request">
      ${selectField(overlay, 'ingredientId', 'Ingredient', state.ingredients.map(ingredient => ({ value: ingredient.id, label: ingredient.name })), item.id)}
      ${selected ? `${selectField(overlay, 'batchId', 'Batch', batches.map(batch => ({
        value: batch.id, label: `${batch.id} · ${amount(qty(batch.quantity - reservedForBatch(state, batch.id)))} ${item.unit} available`,
      })), selected.id)}
        ${field(overlay, 'quantity', `Quantity (${item.unit})`, Math.min(1, maximum), 'number', `required min="${step}" max="${maximum}" step="${step}"`)}`
        : '<p class="notice compact">This ingredient has no unreserved stock in a known, unexpired batch.</p>'}
      ${partners.length ? selectField(overlay, 'partnerId', 'Recovery partner', partners, partners[0])
        : '<p class="notice compact">No recovery partners are available. Reopen this request after accounts load.</p>'}
      ${field(overlay, 'requestedWindow', 'Pickup window', 'Today, 14:00–16:00', 'text', 'required maxlength="120"')}
      ${noteField(overlay, 'note', 'Coordination notes', '', false)}
      ${selected ? stockPreview('Available after reservation', maximum, item.unit, -1) : ''}
      <p class="field-help">The request reserves the entered quantity. Record collection after pickup.</p>
    </form>`,
  };
}
