/**
 * Explainer engine `empty-cohort`: follows one cohort value from the .env file to the validator
 * (applyDefaults() in memory-harvester/references/defaults.ts before and after b4f4554, the
 * cohort rule in classify.ts). The ?? and || of the picked code version run live in the browser.
 *
 * Rows, by content:
 * - the bar: the first single-cell row, a label paragraph then the source link paragraph;
 * - the panel: two cells. Left: three label paragraphs (before the env chips, before the code
 *   chips, before the code). Right: the trace label, the trace list in the engine's order (the
 *   env line, process.env, cohortFromEnv, metadata.cohort, the validator; each item a bold name,
 *   then the value as inline code; after a line break, metadata.cohort holds the value shown when
 *   nothing is stamped and the validator holds the one shown when the write passes; the
 *   validator's first value is its error message), then the verdict when the write is rejected
 *   and the verdict when it passes;
 * - one row per env line, in chip order: the chip label | the line as inline code (a line that
 *   starts with # stands for no line at all);
 * - one row per code version, in chip order: the chip label | the code block | the log lines
 *   when the write is rejected | the log lines when it passes. A version whose code uses || is the
 *   fixed one; lines that differ between versions are highlighted;
 * - the chips' names: an optional single-cell row before the env rows and one before the code
 *   rows (each radio group's accessible name, hidden through its wrapper);
 * - the caption: the last single-cell row.
 *
 * @ew-exempt the first values of the env, process.env, cohortFromEnv and metadata.cohort trace
 *   items are derived (rewritten for each pick); the env lines are hidden data (they feed the
 *   trace, hidden through the .eb-lines wrapper); the chips' names are hidden (assistive tech)
 */

/** Radio behaviour for chip hosts: click, Enter or Space picks; arrows move and pick. */
function radios(hosts, onPick) {
  const pick = (host) => {
    hosts.forEach((h) => {
      h.setAttribute('aria-checked', String(h === host));
      h.tabIndex = h === host ? 0 : -1;
    });
    onPick(hosts.indexOf(host));
  };
  hosts.forEach((host, i) => {
    host.addEventListener('click', () => pick(host));
    host.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'Enter' || e.key === ' ') next = host;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = hosts[(i + 1) % hosts.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = hosts[(i - 1 + hosts.length) % hosts.length];
      if (!next) return;
      e.preventDefault();
      pick(next);
      next.focus();
    });
  });
  return pick;
}

function chipGroup(slot, rowsOf, name) {
  const hosts = rowsOf.map(([label]) => {
    const host = slot('eb-chip', [...label.children]);
    host.setAttribute('role', 'radio');
    return host;
  });
  const group = slot('chips', hosts);
  group.setAttribute('role', 'radiogroup');
  if (name) group.setAttribute('aria-label', name);
  return { group, hosts };
}

/** Wraps each line of a code block in a span (comments .c, lines that differ .hl). */
function markLines(code, others) {
  const text = code.textContent;
  const lines = text.split('\n');
  const spans = lines.map((line, i) => {
    const span = document.createElement('span');
    span.textContent = i < lines.length - 1 ? `${line}\n` : line;
    if (/^\s*\/\//.test(line)) span.className = 'c';
    else if (others.some((o) => !o.includes(line))) span.className = 'hl';
    return span;
  });
  code.replaceChildren(...spans);
}

const show = (v) => (v === undefined ? 'undefined' : JSON.stringify(v));

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const singles = all.filter((r) => r.length === 1);
  const multi = all.filter((r) => r.length > 1);
  const barRow = singles[0];
  const capRow = singles.length > 1 ? singles[singles.length - 1] : null;
  // A single-cell row between the bar and the caption names the chips of the rows after it.
  const names = [];
  const nameOf = new Map();
  let groupCell = null;
  all.forEach((r) => {
    if (r.length === 1 && r !== barRow && r !== capRow) {
      [groupCell] = r;
      names.push(...groupCell.children);
    } else if (r.length > 1) nameOf.set(r, groupCell);
  });
  const groupName = (list) => {
    const cell = list.length && nameOf.get(list[0]);
    return cell ? cell.textContent.trim() : '';
  };
  const panel = multi.find((r) => r[1].querySelector('ol'));
  const versions = multi.filter((r) => r !== panel && r[1].querySelector('pre'));
  const envs = multi.filter((r) => r !== panel && !versions.includes(r));

  const frame = document.createElement('figure');
  frame.className = 'lab';
  if (barRow) {
    const bar = slot('lab__bar', [...barRow[0].children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const left = slot('lab__left');
  const right = slot('lab__right');
  frame.append(slot('lab__grid', [left, right]));

  const leftLabels = panel ? [...panel[0].children] : [];
  const envChips = chipGroup(slot, envs, groupName(envs));
  const codeChips = chipGroup(slot, versions, groupName(versions));

  // Code versions: the code blocks stack, one shown.
  const codeTexts = versions.map(([, cell]) => cell.querySelector('pre').textContent.split('\n'));
  const versionParts = versions.map(([, cell, bad, ok], i) => {
    const pre = cell.querySelector('pre');
    const code = pre.querySelector('code') || pre;
    markLines(code, codeTexts.filter((_, j) => j !== i));
    const say = (c, kind) => {
      const box = slot(`eb-say eb-say-${kind}`, c ? [...c.children].map((p) => slot('log', [p])) : []);
      return box;
    };
    return {
      wrap: slot('eb-code', [pre]),
      fixed: /\|\|/.test(code.textContent),
      bad: say(bad, 'bad'),
      ok: say(ok, 'ok'),
    };
  });

  const placed = [envChips.group, codeChips.group, slot('eb-codes', versionParts.map((v) => v.wrap))];
  leftLabels.forEach((el, i) => {
    left.append(slot('lab__label', [el]));
    if (placed[i]) left.append(placed[i]);
  });
  placed.slice(leftLabels.length).forEach((el) => left.append(el));

  // Trace and verdict.
  const trace = [];
  const verdict = slot('verdict');
  verdict.setAttribute('aria-live', 'polite');
  const heads = [];
  if (panel) {
    [...panel[1].children].forEach((el) => {
      if (el.matches('ol, ul')) {
        [...el.children].forEach((li) => {
          const nodes = [...li.childNodes];
          const brAt = nodes.findIndex((n) => n.nodeName === 'BR');
          const first = brAt < 0 ? nodes : nodes.slice(0, brAt);
          const value = first.find((n) => n.nodeName === 'CODE');
          const item = { li, value };
          if (brAt >= 0) {
            const alt = slot('eb-alt', nodes.slice(brAt));
            item.main = slot('eb-main', first.filter((n) => n.nodeName !== 'STRONG'));
            li.append(item.main, alt);
            item.alt = alt;
          }
          trace.push(item);
        });
        right.append(slot('eb-trace', [el]));
      } else if (!trace.length) right.append(slot('lab__label', [el]));
      else heads.push(el);
    });
  }
  const headBad = slot('eb-head no', heads[0] ? [heads[0]] : []);
  const headOk = slot('eb-head ok', heads[1] ? [heads[1]] : []);
  verdict.append(headBad, headOk, ...versionParts.flatMap((v) => [v.bad, v.ok]));
  right.append(verdict);
  if (capRow) frame.append(slot('x-caption', [...capRow[0].children]));
  if (names.length) frame.append(slot('x-names', names));
  const lines = envs.map(([, cell]) => cell.textContent.trim());
  // The env lines feed the trace; they stay in the block, hidden through their wrapper.
  frame.append(slot('eb-lines', envs.flatMap(([, cell]) => [...cell.children])));
  block.replaceChildren(frame);

  let env = 0;
  let version = 0;
  const run = () => {
    const line = lines[env] || '';
    const raw = line.startsWith('#') ? undefined : line.slice(line.indexOf('=') + 1);
    const v = versionParts[version] || { fixed: false };
    const fromEnv = v.fixed ? (raw || undefined) : raw;
    const cohort = fromEnv; // m.cohort ?? cohortFromEnv ?? undefined, and the harvester sets no m.cohort
    const stamped = cohort !== undefined;
    const bad = stamped && (typeof cohort !== 'string' || cohort.trim().length === 0);

    versionParts.forEach((p, i) => {
      p.wrap.hidden = i !== version;
      p.bad.hidden = i !== version || !bad;
      p.ok.hidden = i !== version || bad;
    });
    headBad.hidden = !bad;
    headOk.hidden = bad;

    const values = [line, show(raw), show(fromEnv), stamped ? show(cohort) : null];
    trace.forEach((item, i) => {
      const { li, value } = item;
      if (i < 4 && value && values[i] !== null && value.textContent !== values[i]) value.textContent = values[i];
      let useAlt = false;
      if (i === 3) {
        useAlt = !stamped;
        if (bad) li.dataset.s = 'bad';
        else delete li.dataset.s;
      } else if (i === 4) {
        useAlt = !bad;
        li.dataset.s = bad ? 'bad' : 'good';
      }
      if (item.alt) {
        item.alt.hidden = !useAlt;
        item.main.hidden = useAlt;
      }
    });
  };

  const pickEnv = radios(envChips.hosts, (i) => {
    env = i;
    run();
  });
  const pickVersion = radios(codeChips.hosts, (i) => {
    version = i;
    run();
  });
  if (envChips.hosts.length) pickEnv(envChips.hosts[0]);
  if (codeChips.hosts.length) pickVersion(codeChips.hosts[0]);
  else run();
}
