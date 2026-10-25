/**
 * Explainer engine "credential-chain": which credential in DefaultAzureCredential answers, for a
 * few places the code runs (the Azure RBAC article). A simplified model of @azure/identity
 * 4.10.0: the chain order and the AZURE_TOKEN_CREDENTIALS dev/prod split from
 * defaultAzureCredential.ts, the EnvironmentCredential checks from environmentCredential.ts, and
 * the rule in chainedTokenCredential.ts that only an "unavailable" result moves on to the next
 * credential. No tokens are requested: each signal is a switch on the page.
 *
 * Rows:
 * 1. the bar: a label paragraph | the source link paragraph;
 * 2. left | right, by content:
 *    left, in order: the label paragraph (also names the scenarios for assistive tech), the
 *    scenarios list (in the engine's order: laptop with az login, the web app's managed identity,
 *    a Codex task, Codex with an expired secret, the laptop with Codex's variables, the same
 *    laptop in dev mode; the first is the opening one), the paragraph that opens the switches,
 *    the switches' name for assistive tech, the switches list (in the engine's order: the
 *    environment variables are set, the secret is still valid, App Service with a managed
 *    identity, the CLI is signed in), the mode label paragraph, the mode options list (in the
 *    engine's order: not set, dev, prod);
 *    right: the label paragraph, the chain list (the six credentials, in the SDK's order);
 * 3. three-cell rows: the table shown without JavaScript (the first row is its header);
 * 4. a last single-cell row is the caption.
 *
 * Behaviour: a scenario sets the switches; every change re-runs the chain. Each credential's
 * state, message and the result line are derived (the SDK's messages and the model's notes).
 *
 * @variants credential-chain
 * @ew-exempt the mode options list, the switches name - read by the engine into the select and the legend
 */
const CHAIN = [
  { id: 'env', group: 'prod' },
  { id: 'wi', group: 'prod' },
  { id: 'mi', group: 'prod' },
  { id: 'cli', group: 'dev' },
  { id: 'ps', group: 'dev' },
  { id: 'azd', group: 'dev' },
];
const PRESETS = [
  {
    envVars: false, secretValid: true, appService: false, azLogin: true, mode: '',
  },
  {
    envVars: false, secretValid: true, appService: true, azLogin: false, mode: '',
  },
  {
    envVars: true, secretValid: true, appService: false, azLogin: false, mode: '',
  },
  {
    envVars: true, secretValid: false, appService: false, azLogin: false, mode: '',
  },
  {
    envVars: true, secretValid: true, appService: false, azLogin: true, mode: '',
  },
  {
    envVars: true, secretValid: true, appService: false, azLogin: true, mode: 'dev',
  },
];
const SWITCHES = ['envVars', 'secretValid', 'appService', 'azLogin'];
const MODES = ['', 'dev', 'prod'];
const LABEL = {
  token: 'token', error: 'stops here', unavailable: 'unavailable', unreached: 'not tried', excluded: 'left out',
};
const WHO = {
  EnvironmentCredential: 'the service principal in the environment variables',
  WorkloadIdentityCredential: 'the workload identity',
  ManagedIdentityCredential: 'the web app\'s own managed identity',
  AzureCliCredential: 'whoever ran az login (me)',
};

function attempt(id, s) {
  switch (id) {
    case 'env':
      if (s.envVars) {
        return s.secretValid
          ? { state: 'token', msg: 'AZURE_TENANT_ID, AZURE_CLIENT_ID and AZURE_CLIENT_SECRET are set, so it signs in as that service principal.' }
          : { state: 'error', err: 'EnvironmentCredential authentication failed.', msg: 'The secret is set but rejected (expired or wrong). This is an authentication error, not "unavailable", so the chain ends here.' };
      }
      return { state: 'unavailable', msg: 'EnvironmentCredential is unavailable. No underlying credential could be used.' };
    case 'wi':
      return s.fedFile
        ? { state: 'token', msg: 'AZURE_FEDERATED_TOKEN_FILE is set, so it trades that file for a token.' }
        : { state: 'unavailable', msg: 'Unavailable: no AZURE_FEDERATED_TOKEN_FILE.' };
    case 'mi':
      return s.appService
        ? { state: 'token', msg: 'App Service set IDENTITY_ENDPOINT and IDENTITY_HEADER, so it asks the local token endpoint for the app\'s own identity.' }
        : { state: 'unavailable', msg: 'Unavailable: no managed identity endpoint here.' };
    case 'cli':
      return s.azLogin
        ? { state: 'token', msg: 'Runs az account get-access-token as whoever ran az login.' }
        : { state: 'unavailable', msg: 'Please run \'az login\' from a command prompt to authenticate before using this credential.' };
    default:
      return { state: 'unavailable', msg: 'Unavailable: not signed in on this page.' };
  }
}

function resolve(s, names) {
  const order = CHAIN.filter((c) => !s.mode || c.group === s.mode);
  const steps = [];
  let outcome = null;
  for (let i = 0; i < order.length; i += 1) {
    const c = order[i];
    const r = attempt(c.id, s);
    steps.push({ id: c.id, state: r.state, msg: r.msg });
    if (r.state === 'token') {
      outcome = { ok: true, by: names[c.id] };
      break;
    }
    if (r.state === 'error') {
      outcome = { ok: false, msg: r.err, by: names[c.id] };
      break;
    }
  }
  if (!outcome) outcome = { ok: false, msg: 'ChainedTokenCredential authentication failed.', by: null };
  const tried = steps.map((x) => x.id);
  CHAIN.forEach((c) => {
    if (!tried.includes(c.id)) {
      const excluded = s.mode && c.group !== s.mode;
      steps.push({ id: c.id, state: excluded ? 'excluded' : 'unreached', msg: excluded ? `Left out: AZURE_TOKEN_CREDENTIALS=${s.mode}.` : '' });
    }
  });
  return { steps, outcome };
}

function span(cls) {
  const el = document.createElement('span');
  el.className = cls;
  return el;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const [barRow, bodyRow] = all;
  if (!barRow || !bodyRow || bodyRow.length < 2) return;
  plainLinks(block);
  const tableRows = all.slice(2).filter((r) => r.length > 1);
  const captionRow = all.slice(2).find((r) => r.length === 1);

  const fig = document.createElement('figure');
  fig.className = 'cc';
  const bar = slot('cc__bar', barRow.flatMap((c) => [...c.children]));

  // left
  const leftNodes = [...bodyRow[0].children];
  const lists = leftNodes.filter((n) => n.matches('ul, ol'));
  const paras = leftNodes.filter((n) => n.tagName === 'P');
  const [scenarios, switchList, modeList] = lists;
  const [labelP, moreP, legendP, modeP] = paras;

  const left = document.createElement('div');
  if (labelP) left.append(slot('cc__label', [labelP]));
  const chips = slot('chips cc__chips', scenarios ? [scenarios] : []);
  chips.setAttribute('role', 'radiogroup');
  if (labelP) chips.setAttribute('aria-label', labelP.textContent.trim());
  if (scenarios) scenarios.setAttribute('role', 'none');
  const presetHosts = scenarios ? [...scenarios.children] : [];
  presetHosts.forEach((li, i) => {
    li.setAttribute('role', 'radio');
    li.setAttribute('aria-checked', 'false');
    li.dataset.preset = String(i);
  });
  left.append(chips);

  const more = document.createElement('details');
  more.className = 'cc__more';
  const summary = document.createElement('summary');
  if (moreP) summary.append(moreP);
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'cc__controls';
  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  // the legend is assistive text only: its words are read from the authored paragraph, kept hidden
  if (legendP) legend.textContent = legendP.textContent.trim();
  fieldset.append(legend);
  const inputs = {};
  if (switchList) {
    switchList.setAttribute('role', 'none');
    [...switchList.children].forEach((li, i) => {
      const key = SWITCHES[i];
      if (!key) return;
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.k = key;
      if (key === 'secretValid') {
        input.checked = true;
        label.classList.add('is-sub');
      }
      inputs[key] = input;
      const text = span('cc__switch-text');
      text.append(...li.childNodes);
      label.append(input, text);
      li.append(label);
    });
    fieldset.append(slot('cc__switches', [switchList]));
  }
  const modeBox = slot('cc__mode', modeP ? [modeP] : []);
  const select = document.createElement('select');
  select.dataset.k = 'mode';
  (modeList ? [...modeList.children] : []).forEach((li, i) => {
    const o = document.createElement('option');
    o.value = MODES[i] ?? '';
    o.textContent = li.textContent.trim();
    select.append(o);
  });
  inputs.mode = select;
  const modeLabel = document.createElement('label');
  modeLabel.className = 'cc__mode-pick';
  modeLabel.append(select);
  if (modeP) select.setAttribute('aria-label', modeP.textContent.trim());
  modeBox.append(modeLabel);
  fieldset.append(modeBox);
  fieldset.append(slot('cc__source', [legendP, modeList].filter(Boolean)));
  more.append(summary, fieldset);
  left.append(more);

  // right
  const rightNodes = [...bodyRow[1].children];
  const right = document.createElement('div');
  const rightLabel = rightNodes.find((n) => n.tagName === 'P');
  const chain = rightNodes.find((n) => n.matches('ol, ul'));
  if (rightLabel) right.append(slot('cc__label', [rightLabel]));
  const names = {};
  const lines = {};
  if (chain) {
    chain.setAttribute('aria-live', 'polite');
    [...chain.children].forEach((li, i) => {
      const c = CHAIN[i];
      if (!c) return;
      const name = span('cc__name');
      name.append(...li.childNodes);
      names[c.id] = name.textContent.trim();
      const state = span('cc__state');
      const msg = span('cc__msg');
      li.append(name, state, msg);
      li.dataset.c = c.id;
      li.dataset.state = 'unreached';
      lines[c.id] = { li, state, msg };
    });
    right.append(slot('cc__chain', [chain]));
  }
  const result = document.createElement('p');
  result.className = 'cc__result';
  result.setAttribute('aria-live', 'polite');
  right.append(result);

  const grid = slot('cc__grid', [left, right]);

  // the no-JavaScript table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  tableRows.forEach((cells, r) => {
    const tr = document.createElement('tr');
    cells.forEach((c) => {
      const cell = document.createElement(r ? 'td' : 'th');
      cell.append(...c.childNodes);
      tr.append(cell);
    });
    (r ? tbody : thead).append(tr);
  });
  table.append(thead, tbody);

  fig.append(bar, grid, slot('cc__static', [table]));
  if (captionRow) {
    const cap = document.createElement('figcaption');
    cap.append(...captionRow[0].children);
    fig.append(cap);
  }
  block.replaceChildren(fig);

  const read = () => ({
    envVars: !!inputs.envVars?.checked,
    secretValid: !!inputs.secretValid?.checked,
    fedFile: false,
    appService: !!inputs.appService?.checked,
    azLogin: !!inputs.azLogin?.checked,
    mode: select.value,
  });
  const write = (s) => {
    Object.keys(s).forEach((k) => {
      if (k === 'mode') select.value = s.mode;
      else if (inputs[k]) inputs[k].checked = s[k];
    });
  };
  function render() {
    const s = read();
    if (inputs.secretValid) inputs.secretValid.disabled = !s.envVars;
    const r = resolve(s, names);
    r.steps.forEach((st) => {
      const line = lines[st.id];
      if (!line) return;
      line.li.dataset.state = st.state;
      line.state.textContent = LABEL[st.state];
      line.msg.textContent = st.msg;
    });
    result.dataset.ok = r.outcome.ok ? 'yes' : 'no';
    if (r.outcome.ok) result.textContent = `Result: the app signs in as ${WHO[r.outcome.by]}, through ${r.outcome.by}.`;
    else if (r.outcome.by) result.textContent = `Result: no sign-in. ${r.outcome.by} rejected the secret, and the chain stops there instead of trying az login.`;
    else result.textContent = 'Result: no sign-in. Every credential in the chain was unavailable.';
  }
  function pick(i) {
    presetHosts.forEach((h, j) => {
      h.setAttribute('aria-checked', String(i === j));
      h.tabIndex = i === j ? 0 : -1;
    });
    if (PRESETS[i]) write(PRESETS[i]);
    render();
  }
  presetHosts.forEach((h, i) => {
    h.addEventListener('click', () => pick(i));
    h.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = (i + (e.key === 'ArrowRight' ? 1 : presetHosts.length - 1)) % presetHosts.length;
        pick(n);
        presetHosts[n].focus();
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick(i);
      }
    });
  });
  fieldset.addEventListener('change', () => {
    presetHosts.forEach((h) => h.setAttribute('aria-checked', 'false'));
    render();
  });
  fig.classList.add('is-live');
  pick(0);
}
