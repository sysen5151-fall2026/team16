const assistantMethods = {
  model: 'Understood by the local model',
  keywords: 'Matched by keywords',
  none: 'Not understood',
};

function assistantDefaults() {
  return { open: false, busy: false, draft: '', messages: [], suggestions: null };
}

function assistantVisible(ui) {
  return !!ui.state && !ui.overlay && ui.storage?.status !== 'quarantined' &&
    ['manager', 'staff'].includes(ui.account?.role);
}

function assistantPromptButtons(assistant, role) {
  const prompts = assistant.suggestions ?? [
    'How much sliced beef do we have?',
    'Which ingredients are low on stock?',
    'What is expiring soon?',
    role === 'manager' ? 'How much did we waste today?' : 'Which orders are awaiting receiving?',
  ];
  return prompts.map(question => `<button type="button" class="btn mini" data-action="ask-example"
    data-question="${esc(question)}" ${assistant.busy ? 'disabled' : ''}>${esc(question)}</button>`).join('');
}

function assistantHistory(assistant) {
  return assistant.messages.map(({ question, answer, understoodBy, error }) => `
    <p class="assistant-question">${esc(question)}</p>
    ${answer ? `<div class="assistant-answer"><p>${esc(answer.text)}</p>
      ${answer.items?.some(item => item.text) ? `<ul>${answer.items.filter(item => item.text)
        .map(item => `<li>${esc(item.text)}</li>`).join('')}</ul>` : ''}
      <small>${assistantMethods[understoodBy] ?? assistantMethods.none}</small>
    </div>` : ''}
    ${error ? `<p class="assistant-error">${esc(error)}</p>` : ''}`).join('');
}

function renderAssistant(ui) {
  if (!assistantVisible(ui)) return '';
  const { assistant } = ui;
  return `<div class="assistant-shell">
    <section id="assistant-panel" class="assistant-panel" aria-labelledby="assistant-title" ${assistant.open ? '' : 'hidden'}>
      <header><h2 id="assistant-title">Ask PANTRI</h2>
        ${button(icon('close'), 'toggle-assistant', 'aria-label="Close Ask PANTRI"', 'icon-button')}
      </header>
      <div class="assistant-history" aria-label="Conversation" tabindex="0">${assistantHistory(assistant)}</div>
      <p class="assistant-waiting" aria-hidden="true" ${assistant.busy ? '' : 'hidden'}>Thinking…</p>
      <p class="assistant-status sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
      <div class="assistant-examples" role="group" aria-label="Suggested questions">
        ${assistantPromptButtons(assistant, ui.account.role)}
      </div>
      <form class="assistant-compose" data-form="ask-assistant">
        <label class="sr-only" for="assistant-question">Ask a question in English</label>
        <input id="assistant-question" name="question" data-focus="assistant-question" type="text" maxlength="300"
          placeholder="Ask a question in English" required value="${esc(assistant.draft)}">
        <button class="btn primary" type="submit" ${assistant.busy ? 'disabled' : ''}>Send</button>
      </form>
    </section>
    <button type="button" class="btn primary assistant-launch" data-action="toggle-assistant"
      data-focus="assistant-launch" aria-expanded="${assistant.open}" aria-controls="assistant-panel">${icon('leaf')} Ask PANTRI</button>
  </div>`;
}

function toggleAssistant() {
  if (!assistantVisible(ui)) return;
  const { assistant } = ui;
  assistant.open = !assistant.open;
  const panel = root.querySelector('#assistant-panel');
  const launch = root.querySelector('.assistant-launch');
  panel.hidden = !assistant.open;
  launch.setAttribute('aria-expanded', String(assistant.open));
  if (assistant.open) {
    const history = panel.querySelector('.assistant-history');
    history.scrollTop = history.scrollHeight;
    panel.querySelector('input').focus();
  } else launch.focus();
}

function updateAssistantPanel(announcement) {
  const panel = root.querySelector('#assistant-panel');
  if (!panel) return;
  const { assistant } = ui;
  const history = panel.querySelector('.assistant-history');
  history.innerHTML = assistantHistory(assistant);
  history.scrollTop = history.scrollHeight;
  panel.querySelector('.assistant-status').textContent = announcement;
  panel.querySelector('.assistant-waiting').hidden = !assistant.busy;
  panel.querySelector('.assistant-examples').innerHTML = assistantPromptButtons(assistant, ui.account.role);
  panel.querySelector('[type="submit"]').disabled = assistant.busy;
}

async function submitAssistant(value) {
  const { assistant } = ui;
  const question = value.trim();
  if (!assistantVisible(ui) || !assistant.open || assistant.busy || !question || question.length > 300) return;
  const message = { question };
  assistant.messages = [...assistant.messages.slice(-11), message];
  assistant.draft = '';
  assistant.busy = true;
  const input = root.querySelector('#assistant-question');
  input.value = '';
  input.focus();
  updateAssistantPanel('Thinking…');
  try {
    const { revision, answer, understoodBy, suggestions } = await api.askAssistant(question);
    if (ui.assistant !== assistant) return;
    if (revision < ui.storage?.revision) {
      message.error = 'Records changed while this question was being answered. Ask again for the latest records.';
    } else {
      Object.assign(message, { answer, understoodBy });
      assistant.suggestions = suggestions;
    }
  } catch (error) {
    if (ui.assistant !== assistant) return;
    if (recoverExpiredSession(error)) {
      render();
      return;
    }
    message.error = error.message;
  } finally {
    assistant.busy = false;
    if (ui.assistant === assistant) {
      const answer = message.answer;
      const announcement = answer ? [answer.text, ...answer.items.map(item => item.text).filter(Boolean),
        assistantMethods[message.understoodBy]].join(' ') : message.error;
      updateAssistantPanel(announcement ?? '');
    }
  }
}
