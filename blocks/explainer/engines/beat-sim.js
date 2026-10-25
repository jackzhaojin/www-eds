/**
 * Explainer (beat-sim): the beat simulator of the Company of Zero article. Ports the due
 * decision and run order of src/harness/heartbeat-core.ts and the commit, delivery and failure
 * DM of workers/heartbeat/src/beat.ts (jackzhaojin/anima-mesh at 0874733) over the agents in
 * the block's table, on the cloud tier. Failures are simulated; nothing calls a model.
 *
 * Rows, by content:
 * - the bar: the first single-cell row, a label paragraph then the source link paragraph;
 * - the table header: a row of three or more cells with no code in the first (Agent, Rhythm,
 *   Runs on, then the fail column's heading);
 * - one row per agent: name | rhythm | runs on. The name is inline code; an emphasised word after
 *   it (hub) marks the hub, which runs last and carries the laptop reminders. Rhythm: daily,
 *   weekly, monthly or quarterly. Runs on: a cell naming "laptop" runs only on the laptop, one
 *   naming "commercial" or "gated" stays off, anything else runs in the cloud beat;
 * - key | value rows (the key cell is one paragraph, the value cell the content):
 *   controls (three paragraphs: run, next day, reset), start (the first beat, an ISO time),
 *   time zone, ledger (a list, one item per finished run: agent, then its ISO time), fails first
 *   (the agent set to fail on the first morning), example (the static example the source page
 *   shows without JavaScript, kept hidden), and the reader-facing strings, their {placeholders}
 *   filled in by the engine: toggle, not run, reason due, reason not due, reason laptop due,
 *   reason laptop, reason commercial, reason never, takeaway failed, takeaway idle,
 *   takeaway ok, takeaway blocked, hint, due label, skipped label, nobody due, failed, ran,
 *   hub note, term label, term commit, term deliver, term dm, term no dm, when;
 * - the caption: the last single-cell row.
 *
 * Behaviour: the table gains a fail switch per cloud agent; run plays one 08:00 beat (due
 * decision, spokes alphabetically then the hub, a failed agent never logs its run, the commit,
 * the brief and the failure DM), next day moves the clock a day and clears the failures, reset
 * goes back to the first morning. The output appears only when the reader runs the beat.
 *
 * @ew-exempt key cells, the data and string rows and the example - config, hidden through .bs__data
 * @ew-exempt the output, the clock line and the fail switches - derived, rebuilt by the engine
 */

// heartbeat-core.ts lines 24-29
const PERIOD_HOURS = {
  daily: 20, weekly: 6 * 24, monthly: 27 * 24, quarterly: 85 * 24,
};

const text = (el) => (el ? el.textContent.trim() : '');
const fill = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? String(vals[k]) : m));

function make(tag, cls, content) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (content !== undefined) el.textContent = content;
  return el;
}

function tierOf(cell) {
  const t = text(cell).toLowerCase();
  if (/commercial|gated/.test(t)) return 'gated';
  if (/laptop/.test(t)) return 'laptop';
  return 'cloud';
}

let count = 0;

export default async function engine(block, { slot, rows, plainLinks }) {
  count += 1;
  const rowEls = [...block.querySelectorAll(':scope > div')];
  const all = rows(block);
  const single = all.filter((r) => r.length === 1);
  const barRow = single.find((r) => r[0].querySelector('a')) || single[0];
  const capRow = single.length > 1 ? single[single.length - 1] : null;
  const tableRows = all.filter((r) => r.length >= 3);
  const headRow = tableRows.find((r) => !r[0].querySelector('code'));
  const agentRows = tableRows.filter((r) => r !== headRow);
  const keyed = {};
  all.filter((r) => r.length === 2).forEach((r) => { keyed[text(r[0]).toLowerCase()] = r; });
  const S = (key) => (keyed[key] ? text(keyed[key][1]) : '');

  // ---- the agents, from the table
  const agents = agentRows.map((r) => ({
    name: text(r[0].querySelector('code')),
    hub: Boolean(r[0].querySelector('em')),
    heartbeat: text(r[1]).toLowerCase(),
    tier: tierOf(r[2]),
  }));
  const hub = (agents.find((a) => a.hub) || {}).name;
  const tz = S('time zone') || 'America/New_York';
  const dateStamp = (d) => new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  const localDay = (ms) => Number(dateStamp(new Date(ms)).replace(/-/g, ''));
  const prettyDate = (iso) => new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
  }).format(new Date(iso));

  const ledger0 = keyed.ledger ? [...keyed.ledger[1].querySelectorAll('li')].map((item) => {
    const [agent, ts] = text(item).split(/\s+/);
    return { agent, ts };
  }).filter((e) => e.agent && e.ts) : [];
  const failsFirst = S('fails first').split(/[\s,]+/).filter(Boolean);

  function fresh() {
    const hubRuns = ledger0.filter((e) => e.agent === hub).map((e) => Date.parse(e.ts));
    return {
      now: S('start') || '2026-07-27T12:00:00.000Z',
      ledger: ledger0.map((e) => ({ ...e })),
      hubReport: hubRuns.length ? dateStamp(new Date(Math.max(...hubRuns))) : null,
      failing: [...failsFirst],
    };
  }

  // heartbeat-core.ts dueVerdict, lines 98-134, with the reasons in plain words
  function dueVerdict(agent, ledger, now) {
    const cadence = agent.heartbeat;
    const hours = PERIOD_HOURS[cadence];
    if (!hours) return { due: false, why: 'no heartbeat declared (manual runs only)' };
    const last = ledger.filter((e) => e.agent === agent.name)
      .map((e) => Date.parse(e.ts)).reduce((max, t) => Math.max(max, t), 0);
    if (last === 0) return { due: true, why: S('reason never') };
    if (cadence === 'daily') {
      return localDay(last) < localDay(now.getTime())
        ? { due: true, why: 'daily: not yet run today' }
        : { due: false, why: 'daily: already ran today' };
    }
    const elapsed = (now.getTime() - last) / 3600000;
    const h = Math.floor(elapsed);
    return elapsed >= hours
      ? { due: true, why: fill(S('reason due'), { cadence, days: Math.round(h / 24) }) }
      : { due: false, why: fill(S('reason not due'), { cadence, days: Math.floor(h / 24) }) };
  }

  // One cloud beat: heartbeatCore (cloudTier: true) and runCloudBeat's flush, delivery, failure DM.
  function runBeat(state) {
    const now = new Date(state.now);
    const due = [];
    const skipped = [];
    const tierBlocked = [];
    agents.forEach((a) => {
      if (a.tier === 'gated') {
        skipped.push({ agent: a.name, why: S('reason commercial') });
        return;
      }
      const v = dueVerdict(a, state.ledger, now);
      if (a.tier === 'laptop') {
        if (v.due) tierBlocked.push(a.name);
        skipped.push({ agent: a.name, why: S(v.due ? 'reason laptop due' : 'reason laptop') });
        return;
      }
      (v.due ? due : skipped).push({ agent: a.name, why: v.why });
    });
    // Spokes alphabetically, the hub last.
    due.sort((x, y) => ((x.agent === hub) - (y.agent === hub)) || x.agent.localeCompare(y.agent));
    const runs = [];
    const failures = [];
    let minute = 0;
    due.forEach((d) => {
      minute += 4;
      if (state.failing.includes(d.agent)) {
        failures.push(d.agent);
        return;
      }
      state.ledger.push({ agent: d.agent, ts: new Date(now.getTime() + minute * 60000).toISOString() });
      if (d.agent === hub) state.hubReport = dateStamp(now);
      runs.push({ agent: d.agent, notes: d.agent === hub && tierBlocked.length ? tierBlocked : null });
    });
    const date = dateStamp(now);
    let delivery;
    if (runs.length) {
      if (!state.hubReport) delivery = `brief DM: no ${hub} report on file yet`;
      else if (state.hubReport === date) delivery = `brief DM: today's ${hub} report`;
      else delivery = `brief DM: the newest ${hub} report on file, from ${state.hubReport}`;
    } else delivery = 'nothing ran (all skipped or already done today) - no delivery';
    const dm = failures.length
      ? [`cloud beat ${date}: ${failures.length}/${due.length} due agent(s) failed`, ...failures.map((f) => `${f}: provider call failed (demo error)`)]
      : null;
    const commit = `beat(cloud): ${date} - ${runs.length} run(s), ${failures.length} failure(s)`;
    return {
      due, skipped, tierBlocked, runs, failures, delivery, dm, commit,
    };
  }

  // ---- layout: authored elements move into the source's structure
  const frame = make('figure', 'fig lab bs');
  if (barRow) {
    const bar = slot('lab__bar', [...barRow[0].children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const body = slot('bs__body');
  const table = make('table', 'bs__table');
  const thead = make('thead');
  const tbody = make('tbody');
  if (headRow) {
    const tr = make('tr');
    headRow.forEach((cell) => {
      const th = make('th');
      th.scope = 'col';
      th.append(...cell.children);
      tr.append(th);
    });
    thead.append(tr);
  }
  const boxes = {};
  agentRows.forEach((r, i) => {
    const a = agents[i];
    const tr = make('tr');
    const th = make('th');
    th.scope = 'row';
    th.append(...r[0].children);
    const rhythm = make('td');
    rhythm.append(...r[1].children);
    const runsOn = make('td');
    runsOn.append(slot(`bs__tier bs__tier--${a.tier}`, [...r[2].children]));
    const tg = make('td', 'bs__tgs');
    if (a.tier === 'cloud') {
      const label = make('label', 'bs__tg');
      const input = make('input');
      input.type = 'checkbox';
      input.dataset.a = a.name;
      boxes[a.name] = input;
      label.append(input, make('span', '', S('toggle')));
      tg.append(label);
    } else tg.append(make('span', 'bs__na', S('not run')));
    tr.append(th, rhythm, runsOn, tg);
    tbody.append(tr);
  });
  table.append(thead, tbody);
  body.append(slot('bs__table-wrap', [table]));

  const controls = slot('bs__controls');
  const when = make('span', 'bs__when');
  controls.append(when);
  const ctl = keyed.controls ? [...keyed.controls[1].children] : [];
  const btns = ctl.map((p, i) => {
    const b = slot(i === 0 ? 'bs__btn bs__btn--primary' : 'bs__btn', [p]);
    b.setAttribute('role', 'button');
    controls.append(b);
    return b;
  });
  const [runBtn, nextBtn, resetBtn] = btns;
  body.append(controls);

  const out = make('div', 'bs__out');
  out.tabIndex = -1;
  out.setAttribute('aria-live', 'polite');
  body.append(out);
  frame.append(body);

  // Key rows, and anything left in the authored rows, stay in the DOM, hidden.
  const data = slot('bs__data', rowEls);
  const parts = [frame];
  if (capRow) {
    const cap = slot('x-caption', [...capRow[0].children]);
    cap.id = `bs-cap-${count}`;
    frame.setAttribute('aria-labelledby', cap.id);
    parts.push(cap);
  }
  block.replaceChildren(...parts, data);

  // ---- behaviour
  let state = fresh();
  let last = null;

  function li(cls, ...nodes) {
    const el = make('li', cls);
    el.append(...nodes);
    return el;
  }
  function takeaway(r) {
    const names = (list) => list.join(' and ');
    if (r.failures.length) {
      return fill(S('takeaway failed'), { failed: names(r.failures), runs: r.runs.length, s: r.runs.length === 1 ? '' : 's' });
    }
    if (!r.runs.length) return S('takeaway idle');
    return S('takeaway ok') + (r.tierBlocked.length ? ` ${fill(S('takeaway blocked'), { names: names(r.tierBlocked) })}` : '');
  }
  function renderResult(r) {
    if (!r) {
      out.replaceChildren(make('p', 'bs__hint', S('hint')));
      return;
    }
    const order = make('ol', 'bs__list');
    r.due.forEach((d) => {
      const fail = r.failures.includes(d.agent);
      const run = r.runs.find((x) => x.agent === d.agent);
      const item = li(fail ? 'is-fail' : 'is-ok', make('b', 'mono', d.agent), ' ', make('span', 'bs__why', d.why), make('span', 'bs__res', S(fail ? 'failed' : 'ran')));
      if (run && run.notes) item.append(make('span', 'bs__sub', fill(S('hub note'), { names: run.notes.join(' and ') })));
      order.append(item);
    });
    if (!r.due.length) order.append(li('is-skip', S('nobody due')));
    const skipped = make('ul', 'bs__list');
    r.skipped.forEach((s) => skipped.append(li('is-skip', make('b', 'mono', s.agent), ' ', make('span', 'bs__why', s.why))));
    const term = make('div', 'bs__term');
    term.setAttribute('role', 'group');
    term.setAttribute('aria-label', S('term label'));
    const line = (cls, label, value) => {
      const span = make('span', cls);
      span.append(make('i', '', label), ` ${value}`);
      return span;
    };
    term.append(line('', S('term commit'), r.commit), line('', S('term deliver'), r.delivery));
    if (r.dm) r.dm.forEach((l, i) => term.append(line('no', i ? '' : S('term dm'), l)));
    else term.append(line('ok', S('term dm'), S('term no dm')));
    out.replaceChildren(
      make('p', 'bs__takeaway', takeaway(r)),
      make('p', 'bs__label', S('due label')),
      order,
      make('p', 'bs__label', S('skipped label')),
      skipped,
      term,
    );
  }
  function renderRows() {
    Object.entries(boxes).forEach(([name, input]) => { input.checked = state.failing.includes(name); });
  }
  function setDisabled(b, off) {
    if (!b) return;
    b.setAttribute('aria-disabled', String(off));
    b.tabIndex = off ? -1 : 0;
  }
  function sync() {
    when.textContent = fill(S('when'), { date: prettyDate(state.now) });
    setDisabled(runBtn, Boolean(last));
    setDisabled(nextBtn, !last);
    setDisabled(resetBtn, false);
  }
  function press(b, fn) {
    if (!b) return;
    const go = () => { if (b.getAttribute('aria-disabled') !== 'true') fn(); };
    b.addEventListener('click', go);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    });
  }

  tbody.addEventListener('change', (e) => {
    const t = e.target;
    if (!t.matches('input[data-a]')) return;
    const i = state.failing.indexOf(t.dataset.a);
    if (t.checked && i < 0) state.failing.push(t.dataset.a);
    if (!t.checked && i >= 0) state.failing.splice(i, 1);
  });
  press(runBtn, () => {
    last = runBeat(state);
    renderResult(last);
    renderRows();
    sync();
    out.focus({ preventScroll: true });
  });
  press(nextBtn, () => {
    state.now = new Date(Date.parse(state.now) + 86400000).toISOString();
    state.failing = [];
    last = null;
    renderRows();
    renderResult(null);
    sync();
  });
  press(resetBtn, () => {
    state = fresh();
    last = null;
    renderRows();
    renderResult(null);
    sync();
  });
  renderRows();
  renderResult(null);
  sync();
}
