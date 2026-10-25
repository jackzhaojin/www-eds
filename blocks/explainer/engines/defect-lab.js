/**
 * Explainer (defect-lab): the defect gate lab of the Company of Zero article. Ports
 * parseDefectReports, identityLeakGuard and the issue-first branches of
 * src/defects/report-core.ts, src/harness/defects.ts and the gate in src/gates/gatekeeper.ts
 * (jackzhaojin/anima-mesh at 0874733), run in the browser; nothing is sent anywhere.
 *
 * Rows, by content:
 * - the bar: the first single-cell row, a label paragraph then the source link paragraph;
 * - one row per sample report: chip label | a code block with the end of the agent's report
 *   (the first is shown first);
 * - key | value rows (the key cell is one paragraph): reports label and agents label (the names
 *   of the two radio groups for assistive tech), report (the label of the report box),
 *   agent (a label paragraph, then a list of the agents to pick, the name first), gates (a
 *   list, one item per agent: name, a colon, its level L1 to L4, then the reversible actions on
 *   its whitelist, comma separated), identity (a label paragraph, then one paragraph with a line
 *   per person: name, a middle dot, email), issues (a label paragraph, then a list of the open
 *   defect issues: #number, then the title), and the reader-facing strings, their
 *   {placeholders} filled in by the engine: no report, not allowed, leak, duplicate, capped,
 *   refused, passes, count, no block, would file, already open;
 * - the caption: the last single-cell row.
 *
 * Behaviour: pick a sample report or an agent, or edit the report text; the four checks (the
 * whitelist gate, the identity-leak guard, title dedup against the open issues, the cap of two
 * per run) run on it and the verdict shows the outcome, then the ledger lines the engine writes.
 *
 * @ew-exempt key cells, the gates and string rows, the report code blocks - config, hidden through .dl__data
 * @ew-exempt the report box and the verdict - derived, rebuilt by the engine
 */

const MAX_DEFECTS_PER_RUN = 2;
const MAX_DEFECT_BYTES = 16 * 1024;
const BLOCK_RE = /```defect-report\s*\r?\ntitle:[ \t]*(.+?)[ \t]*\r?\n---\r?\n([\s\S]*?)```/g;
// gatekeeper.ts: what each level of the ladder allows.
const ALLOWS = {
  L1: ['report'],
  L2: ['report', 'draft'],
  L3: ['report', 'draft', 'reversible'],
  L4: ['report', 'draft', 'reversible', 'external'],
};

const text = (el) => (el ? el.textContent.trim() : '');
const fill = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? String(vals[k]) : m));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function make(tag, cls, content) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (content !== undefined) el.textContent = content;
  return el;
}

function parseDefectReports(src) {
  const out = [];
  [...src.matchAll(BLOCK_RE)].forEach((m) => {
    const title = (m[1] || '').trim();
    const body = (m[2] || '').trim();
    if (title && body.length > 0) out.push({ title, body });
  });
  return out;
}

function defectDraftSlug(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '');
  return slug || 'defect';
}

/** Lines of a paragraph, split at its line breaks. */
function lines(p) {
  const out = [''];
  p.childNodes.forEach((n) => {
    if (n.nodeName === 'BR') out.push('');
    else out[out.length - 1] += n.textContent;
  });
  return out.map((l) => l.trim()).filter(Boolean);
}

function radio(host, checked) {
  host.setAttribute('role', 'radio');
  host.setAttribute('aria-checked', String(checked));
  host.tabIndex = checked ? 0 : -1;
}

/** Arrow keys move between the options of a radio group, Enter and Space pick. */
function radioGroup(group, options, onPick) {
  options.forEach((o, i) => {
    o.addEventListener('click', () => onPick(o));
    o.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = options[(i + 1) % options.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = options[(i - 1 + options.length) % options.length];
      if (next) {
        e.preventDefault();
        next.focus();
        onPick(next);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPick(o);
      }
    });
  });
  group.setAttribute('role', 'radiogroup');
}

let count = 0;

export default async function engine(block, { slot, rows, plainLinks }) {
  count += 1;
  const rowEls = [...block.querySelectorAll(':scope > div')];
  const all = rows(block);
  const single = all.filter((r) => r.length === 1);
  const barRow = single.find((r) => r[0].querySelector('a')) || single[0];
  const capRow = single.length > 1 ? single[single.length - 1] : null;
  const scenarioRows = all.filter((r) => r.length === 2 && r[1].querySelector('pre'));
  const keyed = {};
  all.filter((r) => r.length === 2 && !scenarioRows.includes(r)).forEach((r) => { keyed[text(r[0]).toLowerCase()] = r; });
  const S = (key) => (keyed[key] ? text(keyed[key][1]) : '');
  const cell = (key) => (keyed[key] ? keyed[key][1] : document.createElement('div'));

  // ---- data from the rows
  const gates = {};
  cell('gates').querySelectorAll('li').forEach((li) => {
    const [name, rest = ''] = text(li).split(':');
    const [level, ...whitelist] = rest.split(',').map((s) => s.trim()).filter(Boolean);
    gates[name.trim()] = { level, whitelist };
  });
  const identityCell = cell('identity');
  const [identityLabel, whoP] = [...identityCell.querySelectorAll(':scope > p')];
  const people = whoP ? lines(whoP).map((l) => l.split('·').map((s) => s.trim())) : [];
  const issuesCell = cell('issues');
  const issuesLabel = issuesCell.querySelector(':scope > p');
  const issuesList = issuesCell.querySelector(':scope > ul, :scope > ol');
  const openDefects = issuesList ? [...issuesList.children].map((li) => {
    const m = /^#(\d+)\s+(.*)$/.exec(text(li));
    return m ? { number: Number(m[1]), title: m[2] } : null;
  }).filter(Boolean) : [];

  function identityLeakGuard(src) {
    const words = new Set();
    people.forEach(([name]) => (name || '').split(/\s+/).forEach((w) => { if (w.trim().length >= 3) words.add(w.trim()); }));
    const emails = people.map((p) => p[1]).filter(Boolean);
    const leaked = [];
    words.forEach((w) => { if (new RegExp(`\\b${escapeRe(w)}\\b`, 'i').test(src)) leaked.push(w); });
    const lower = src.toLowerCase();
    emails.forEach((e) => { if (lower.includes(e.toLowerCase())) leaked.push(e); });
    return leaked;
  }
  function gateCheck(agentName) {
    const g = gates[agentName] || { level: 'L1', whitelist: [] };
    if (!(ALLOWS[g.level] || []).includes('reversible')) return `${agentName} (${g.level}) may not perform reversible actions - the ladder is the law`;
    if (!g.whitelist.includes('defect-report')) return `${agentName} (${g.level}) reversible action 'defect-report' is not on its whitelist [${g.whitelist.join(', ')}]`;
    return null;
  }
  // applyDefectReports, with the GitHub calls replaced by the open-issue list.
  function applyDefects(src, agentName) {
    const reports = parseDefectReports(src);
    const steps = [];
    if (reports.length === 0) return { reports, steps: [{ kind: 'none', text: S('no block') }] };
    const denied = gateCheck(agentName);
    if (denied) {
      steps.push({
        kind: 'deny', title: reports.map((r) => r.title).join(', '), ledger: 'defect-report-denied', text: denied,
      });
      return { reports, steps, denied: true };
    }
    reports.slice(0, MAX_DEFECTS_PER_RUN).forEach((r) => {
      if (r.body.length > MAX_DEFECT_BYTES) {
        steps.push({
          kind: 'deny', title: r.title, ledger: 'defect-report-denied', text: `body exceeds ${MAX_DEFECT_BYTES} bytes`,
        });
        return;
      }
      const leaked = identityLeakGuard(`${r.title}\n${r.body}`);
      const path = `drafts/defects/${defectDraftSlug(r.title)}.md`;
      if (leaked.length === 0) {
        const hit = openDefects.find((i) => i.title.trim().toLowerCase() === r.title.trim().toLowerCase());
        steps.push(hit
          ? {
            kind: 'dup', title: r.title, ledger: 'defect-filed (duplicate: true)', text: fill(S('already open'), { number: hit.number }),
          }
          : {
            kind: 'file', title: r.title, ledger: 'defect-filed', text: S('would file'),
          });
        return;
      }
      steps.push({
        kind: 'draft',
        title: r.title,
        sub: [
          { ledger: 'defect-file-skipped', text: `identity leak - the engine repo is public and the report contains: ${leaked.join(', ')}` },
          { ledger: 'defect-drafted', text: `private draft at ${path}, leak-check: FAILED - de-identify before filing: ${leaked.join(', ')}` },
        ],
      });
    });
    const overflow = reports.slice(MAX_DEFECTS_PER_RUN);
    if (overflow.length) {
      steps.push({
        kind: 'deny', title: overflow.map((r) => r.title).join(', '), ledger: 'defect-report-denied', text: `over the ${MAX_DEFECTS_PER_RUN}-defects-per-run cap`,
      });
    }
    return { reports, steps };
  }

  // ---- layout: authored elements move into the source's structure
  const frame = make('figure', 'fig lab dl');
  if (barRow) {
    const bar = slot('lab__bar', [...barRow[0].children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const grid = slot('dl__grid');
  const left = make('div');
  const right = make('div');

  const chips = slot('chips');
  chips.setAttribute('aria-label', S('reports label'));
  const scenarios = scenarioRows.map((r) => {
    const host = slot('dl__chip', [...r[0].children]);
    chips.append(host);
    return { host, report: r[1].querySelector('pre').textContent.replace(/\n$/, '') };
  });
  left.append(chips);

  const taId = `dl-text-${count}`;
  const reportLabel = slot('lab__label', keyed.report ? [...keyed.report[1].children] : []);
  reportLabel.id = `${taId}-label`;
  const ta = make('textarea');
  ta.id = taId;
  ta.spellcheck = false;
  ta.setAttribute('aria-labelledby', reportLabel.id);
  left.append(reportLabel, ta);

  const agentCell = cell('agent');
  const agentList = agentCell.querySelector(':scope > ul, :scope > ol');
  const opts = slot('dl__opts');
  const agentLabel = agentCell.querySelector(':scope > p');
  if (agentLabel) opts.append(slot('dl__opts-label', [agentLabel]));
  const agentGroup = slot('dl__agents', agentList ? [agentList] : []);
  agentGroup.setAttribute('aria-label', S('agents label'));
  opts.append(agentGroup);
  left.append(opts);
  const agentOpts = agentList ? [...agentList.children] : [];
  if (agentList) agentList.setAttribute('role', 'none');

  if (identityLabel) right.append(slot('lab__label dl__first', [identityLabel]));
  if (whoP) right.append(slot('dl__who', [whoP]));
  if (issuesLabel) right.append(slot('lab__label', [issuesLabel]));
  if (issuesList) right.append(slot('dl__issues', [issuesList]));
  const out = make('div', 'verdict');
  out.setAttribute('aria-live', 'polite');
  right.append(out);

  grid.append(left, right);
  frame.append(grid);
  // Key rows, the report code blocks and anything left in the authored rows stay, hidden.
  const data = slot('dl__data', rowEls);
  const parts = [frame];
  if (capRow) parts.push(slot('x-caption', [...capRow[0].children]));
  block.replaceChildren(...parts, data);

  // ---- behaviour
  const agentName = (li) => text(li).split(/\s+/)[0];
  let agent = agentOpts.length ? agentName(agentOpts[0]) : 'chief-of-staff';
  let timer = 0;

  // One plain sentence for the outcome, above the engine's own ledger lines.
  function verdict(r) {
    const k = r.steps.map((x) => x.kind);
    if (k[0] === 'none') return S('no report');
    if (r.denied) return S('not allowed');
    const filed = k.filter((x) => x === 'file').length;
    const capped = k.filter((x) => x === 'deny').length;
    if (k.includes('draft')) return S('leak');
    if (k.includes('dup')) return S('duplicate');
    if (capped && filed) return fill(S('capped'), { filed });
    if (capped) return S('refused');
    return S('passes');
  }
  function render() {
    const r = applyDefects(ta.value, agent);
    const n = r.reports.length;
    const steps = make('ol', 'dl__steps');
    r.steps.forEach((s) => {
      if (s.kind === 'none') {
        steps.append(make('li', 'is-skip', s.text));
        return;
      }
      const cls = {
        file: 'is-file', dup: 'is-dup', draft: 'is-draft', deny: 'is-deny',
      }[s.kind];
      const li = make('li', cls);
      li.append(make('b', '', s.title));
      (s.sub || [s]).forEach((x) => li.append(make('span', 'dl__ledger', x.ledger), make('span', '', x.text)));
      steps.append(li);
    });
    out.replaceChildren(
      make('p', 'dl__verdict', verdict(r)),
      make('p', 'dl__count', fill(S('count'), { n, s: n === 1 ? '' : 's' })),
      steps,
    );
  }
  function pick(s) {
    scenarios.forEach((x) => radio(x.host, x === s));
    ta.value = s.report;
    render();
  }
  radioGroup(chips, scenarios.map((s) => s.host), (host) => pick(scenarios.find((s) => s.host === host)));
  agentOpts.forEach((li, i) => radio(li, i === 0));
  radioGroup(agentGroup, agentOpts, (li) => {
    agent = agentName(li);
    agentOpts.forEach((x) => radio(x, x === li));
    render();
  });
  ta.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 150);
    scenarios.forEach((x) => x.host.setAttribute('aria-checked', 'false'));
  });
  if (scenarios.length) pick(scenarios[0]);
  else render();
}
