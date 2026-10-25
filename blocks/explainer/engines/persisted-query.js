/**
 * Explainer engine "persisted-query": a cache lab that sends a regular GraphQL query (POST) or a
 * persisted query (GET) through one cache to the origin and logs what the cache did (the AEM
 * headless article). The rule it runs: a POST is never served from the cache; a GET is cached
 * under its full URL, so each variable value is its own entry. No request leaves the page.
 *
 * Rows, in this order:
 * 1. the bar: a label paragraph | a note paragraph;
 * 2. the query switch: its label | the regular query (POST) | the persisted query (GET); the lab
 *    opens on the persisted query;
 * 3. the variable: its label | one cell per value (the first is selected);
 * 4. the actions: send | start over;
 * 5. the request formats: the GET request line | the POST request line ({locale} is the value);
 * 6. the path: the browser | the cache | the origin;
 * 7. the log's column labels: number | request | cache | reached the origin;
 * 8. one four-cell row per example request, in the order they were sent (the log shows the
 *    newest first, and the cache is seeded from them);
 * 9. three three-cell rows, the outcomes in the engine's order (POST, cache hit, cache miss):
 *    the verdict ({locale} is the value) | the log's cache cell | the log's reached cell;
 * 10. single-cell rows, in order: the verdict shown without JavaScript, the opening verdict
 *    (after the example requests), the start-over verdict, the counter ({sent}, {reached} and
 *    {cached} are the counts), the caption.
 *
 * Behaviour: the request line, the path lights, the verdict and the counter are derived from
 * the rows above; sent requests are added to the top of the log (six rows at most).
 *
 * @variants persisted-query
 * @ew-exempt the request formats, outcomes, verdicts and counter - templates the engine fills
 */
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));

/** A derived copy of an authored paragraph's inline content, with placeholders filled. */
function render(src, values) {
  const frag = document.createDocumentFragment();
  src.childNodes.forEach((n) => frag.append(n.cloneNode(true)));
  const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) t.data = fill(t.data, values);
  frag.querySelectorAll('[data-prose-index]').forEach((el) => el.removeAttribute('data-prose-index'));
  return frag;
}

function radio(host, on) {
  host.setAttribute('role', 'radio');
  host.setAttribute('aria-checked', String(on));
  host.tabIndex = on ? 0 : -1;
  return host;
}

export default async function engine(block, {
  slot, rows, reduceMotion,
}) {
  const all = rows(block);
  const take = (n) => all.splice(0, n);
  const [barRow, queryRow, varRow, actionRow, formatRow, pathRow, headRow] = take(7);
  if (!headRow) return;
  const logRows = [];
  while (all.length && all[0].length === 4) logRows.push(all.shift());
  const outcomeRows = [];
  while (all.length && all[0].length === 3) outcomeRows.push(all.shift());
  const [staticRow, seededRow, resetRow, countRow, captionRow] = all.map((r) => r[0]);
  const text = (cell) => (cell ? cell.textContent.trim() : '');
  const para = (cell) => (cell ? cell.querySelector('p') || cell : null);

  // read the templates before the authored elements move
  const formatsText = { GET: text(formatRow[0]), POST: text(formatRow[1]) };
  const outcomes = outcomeRows.map((cells) => ({ verdict: para(cells[0]), cache: text(cells[1]), reached: text(cells[2]) }));
  const [, hitOutcome] = outcomes;
  const seededP = para(seededRow);
  const resetP = para(resetRow);
  const countP = para(countRow);
  const fig = document.createElement('figure');
  fig.className = 'pq';
  const bar = slot('pq__bar', [slot('pq__title', [...barRow[0].children]), slot('pq__demo', [...(barRow[1]?.children || [])])]);

  // controls
  const state = { method: 'GET', locale: text(varRow[1]) };
  const methodLabel = slot('pq__label', [...queryRow[0].children]);
  methodLabel.id = 'pq-method';
  const methodGroup = slot('pvl__switch');
  methodGroup.setAttribute('role', 'radiogroup');
  methodGroup.setAttribute('aria-labelledby', 'pq-method');
  const methodHosts = [['POST', queryRow[1]], ['GET', queryRow[2]]].map(([m, cell]) => {
    const host = radio(slot('pq__opt', [...cell.children]), m === state.method);
    host.dataset.method = m;
    return host;
  });
  methodGroup.append(...methodHosts);

  const localeLabel = slot('pq__label', [...varRow[0].children]);
  localeLabel.id = 'pq-locale';
  const localeGroup = slot('chips');
  localeGroup.setAttribute('role', 'radiogroup');
  localeGroup.setAttribute('aria-labelledby', 'pq-locale');
  const localeHosts = varRow.slice(1).map((cell, i) => {
    const value = text(cell);
    const host = radio(slot('pq__chip', [...cell.children]), i === 0);
    host.dataset.locale = value;
    return host;
  });
  localeGroup.append(...localeHosts);

  const send = slot('pq__send', [...actionRow[0].children]);
  const reset = slot('ctl', [...(actionRow[1]?.children || [])]);
  [send, reset].forEach((b) => {
    b.setAttribute('role', 'button');
    b.tabIndex = 0;
  });
  const controls = slot('pq__controls', [
    slot('pq__group', [methodLabel, methodGroup]),
    slot('pq__group', [localeLabel, localeGroup]),
    slot('pq__actions', [send, reset]),
  ]);

  // request line, path, verdict, log, counter
  const formats = slot('pq__formats', formatRow.flatMap((c) => [...c.children]));
  const req = document.createElement('p');
  req.className = 'pq__req';
  const url = () => fill(formatsText[state.method], { locale: state.locale });
  function showReq() {
    const m = document.createElement('span');
    m.className = 'pq__m';
    m.textContent = state.method;
    req.replaceChildren(m, ` ${url()}`);
  }

  const path = slot('pq__path');
  path.setAttribute('aria-hidden', 'true');
  const nodes = {};
  ['browser', 'cache', 'aem'].forEach((k, i) => {
    const node = slot('pq__node', [...(pathRow[i]?.children || [])]);
    nodes[k] = node;
    path.append(node);
  });

  const verdict = document.createElement('p');
  verdict.className = 'pq__verdict';
  verdict.setAttribute('aria-live', 'polite');
  const sources = slot('pq__source', [
    ...outcomeRows.flatMap((r) => r.flatMap((c) => [...c.children])),
    ...[seededRow, resetRow, countRow].filter(Boolean).flatMap((c) => [...c.children]),
  ]);
  const fallback = staticRow ? slot('pq__static', [...staticRow.children]) : null;

  const table = document.createElement('table');
  table.className = 'pq__log';
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  headRow.forEach((c) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.append(...c.childNodes);
    htr.append(th);
  });
  thead.append(htr);
  const log = document.createElement('tbody');
  const seeded = logRows.map((cells) => [text(cells[1]), text(cells[3])]);
  logRows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((c, i) => {
      const td = document.createElement('td');
      if (i === 2 && hitOutcome && text(c) === hitOutcome.cache) td.className = 'hit';
      td.append(...c.childNodes);
      tr.append(td);
    });
    log.prepend(tr);
  });
  table.append(thead, log);

  const count = document.createElement('p');
  count.className = 'pq__count';

  // the cache, seeded from the example requests
  const cache = new Set();
  let sent = logRows.length;
  let reached = 0;
  seeded.forEach(([request, reachedText]) => {
    if (!hitOutcome || reachedText !== hitOutcome.reached) reached += 1;
    const m = /^GET\s*;?\s*locale=(\S+)/.exec(request);
    if (m) cache.add(`GET ${fill(formatsText.GET, { locale: m[1] })}`);
  });
  let run = 0;
  let timers = [];

  function updateCount() {
    if (countP) count.replaceChildren(render(countP, { sent, reached, cached: sent - reached }));
  }
  function clearPath() {
    timers.forEach(clearTimeout);
    timers = [];
    Object.values(nodes).forEach((n) => { n.className = 'pq__node'; });
  }
  function light(steps) {
    clearPath();
    const my = run;
    steps.forEach(([k, cls], i) => {
      const apply = () => { if (my === run) nodes[k].classList.add(cls); };
      if (reduceMotion()) apply();
      else timers.push(setTimeout(apply, i * 260));
    });
  }
  function addRow(outcome, hit) {
    const tr = document.createElement('tr');
    tr.className = 'is-new';
    const n = document.createElement('td');
    n.textContent = String(sent);
    const r = document.createElement('td');
    const code = document.createElement('code');
    code.textContent = state.method;
    r.append(code, state.method === 'GET' ? ` ;locale=${state.locale}` : ` locale=${state.locale}`);
    const c = document.createElement('td');
    c.textContent = outcome.cache;
    if (hit) c.className = 'hit';
    const a = document.createElement('td');
    a.textContent = outcome.reached;
    tr.append(n, r, c, a);
    log.querySelectorAll('tr.is-new').forEach((row) => row.classList.remove('is-new'));
    log.prepend(tr);
    while (log.children.length > 6) log.lastElementChild.remove();
  }
  function doSend() {
    run += 1;
    sent += 1;
    const key = `${state.method} ${url()}`;
    let outcome;
    if (state.method === 'POST') {
      reached += 1;
      [outcome] = outcomes;
      light([['browser', 'is-on'], ['cache', 'is-off'], ['aem', 'is-on']]);
    } else if (cache.has(key)) {
      [, outcome] = outcomes;
      light([['browser', 'is-on'], ['cache', 'is-hit'], ['aem', 'is-off']]);
    } else {
      reached += 1;
      cache.add(key);
      [, , outcome] = outcomes;
      light([['browser', 'is-on'], ['cache', 'is-on'], ['aem', 'is-on']]);
    }
    if (!outcome) return;
    verdict.replaceChildren(render(outcome.verdict, { locale: state.locale }));
    addRow(outcome, outcome === hitOutcome);
    fig.dataset.last = ['post', 'hit', 'miss'][outcomes.indexOf(outcome)];
    updateCount();
  }
  function doReset() {
    run += 1;
    cache.clear();
    sent = 0;
    reached = 0;
    log.replaceChildren();
    clearPath();
    if (resetP) verdict.replaceChildren(render(resetP, {}));
    updateCount();
  }

  const pick = (hosts, host, key) => {
    hosts.forEach((h) => radio(h, h === host));
    state[key] = host.dataset[key];
    showReq();
  };
  [[methodHosts, 'method'], [localeHosts, 'locale']].forEach(([hosts, key]) => {
    hosts.forEach((h, i) => {
      h.addEventListener('click', () => pick(hosts, h, key));
      h.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = hosts[(i + (e.key === 'ArrowRight' ? 1 : hosts.length - 1)) % hosts.length];
          pick(hosts, n, key);
          n.focus();
          e.preventDefault();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick(hosts, h, key);
        }
      });
    });
  });
  [[send, doSend], [reset, doReset]].forEach(([b, fn]) => {
    b.addEventListener('click', fn);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fn();
      }
    });
  });

  const body = slot('pq__body', [controls, req, path, verdict, table, count]);
  fig.append(bar, body);
  if (captionRow) {
    const cap = document.createElement('figcaption');
    cap.append(...captionRow.children);
    fig.append(cap);
  }
  fig.append(slot('pq__source', [formats, sources, ...(fallback ? [fallback] : [])]));
  block.replaceChildren(fig);

  if (seededP) verdict.replaceChildren(render(seededP, {}));
  showReq();
  updateCount();
}
