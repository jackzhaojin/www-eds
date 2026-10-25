/**
 * Explainer engine `hook-switchboard`: which memory hooks run in one pass of the continuous
 * agent's loop (the per-hook flag check in run-hook.ts, the call sites in executive-loop.ts).
 * Pick a situation and the steps on the right show what runs, in order; untick a hook and the
 * loop carries on without it.
 *
 * Rows, by content:
 * - the bar: the first single-cell row, a label paragraph then the source link paragraph;
 * - the panel: two cells. Left: the situations label, the flags label, the flags list (one item
 *   per hook: bold "<letter>, <name> (reads)" or "(writes)", then the flag as inline code; an
 *   item ending in the word "off" starts unticked). Right: the steps label, then the summary
 *   paragraph (plain text, its "one hook reads" and "one hook writes" counts follow each pass);
 * - one row per situation, in chip order: the chip label | an ordered list of steps. A step is a
 *   bold title, then its note. A hook step's title starts "Hook <letter>" and its tag is the
 *   italic text before the note; after a line break comes what it shows when its flag is off
 *   (italic tag, note). A hook step without that second line is not called in that situation
 *   (muted, not counted). Any other step with a second line shows it when the hook step before
 *   it did not run;
 * - the chips' name: an optional single-cell row before the situation rows (the radio group's
 *   accessible name, hidden through its wrapper);
 * - the caption: the last single-cell row.
 *
 * @ew-exempt the summary's counts are derived (rewritten for each pass); the word "off" in a flag
 *   item is hidden config (the flag's starting state); the chips' name is hidden (assistive tech)
 */

const HOOK = /^Hook ([A-Z])\b/;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];
const COUNT = /\b(?:no|one|two|three|four|five|\d+) hooks? (read|write)s?\b/g;

const counted = (n, verb) => {
  if (n === 1) return `one hook ${verb}s`;
  if (n === 0) return `no hook ${verb}s`;
  return `${WORDS[n] || n} hooks ${verb}`;
};

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

/** Splits a step's content after its title into two lines (at the first <br>), each wrapped. */
function decorateStep(li, slot) {
  const title = li.querySelector(':scope > strong');
  const nodes = [...li.childNodes].filter((n) => n !== title);
  const brAt = nodes.findIndex((n) => n.nodeName === 'BR');
  const parts = brAt < 0 ? [nodes] : [nodes.slice(0, brAt), nodes.slice(brAt + 1)];
  const lines = parts.map((part) => {
    const em = part.find((n) => n.nodeName === 'EM');
    const rest = part.filter((n) => n !== em);
    const line = slot('sb-line', em ? [slot('sb-tag', [em])] : []);
    line.append(slot('sb-note', rest));
    return line;
  });
  if (brAt >= 0) lines[1].prepend(nodes[brAt]);
  li.append(...lines);
  const m = HOOK.exec(title ? title.textContent.trim() : '');
  return {
    li, lines, letter: m ? m[1] : null,
  };
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const singles = all.filter((r) => r.length === 1);
  const pairs = all.filter((r) => r.length > 1);
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
  const panel = pairs.find((r) => !r[1].querySelector('ol'));
  const situations = pairs.filter((r) => r !== panel && r[1].querySelector('ol'));

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

  // Chips: each situation's label paragraph, hosted in a radio.
  const hosts = situations.map(([label]) => {
    const host = slot('sb-chip', [...label.children]);
    host.setAttribute('role', 'radio');
    return host;
  });
  const chips = slot('chips', hosts);
  chips.setAttribute('role', 'radiogroup');
  const groupName = situations.length && nameOf.get(situations[0]);
  if (groupName) chips.setAttribute('aria-label', groupName.textContent.trim());

  // Flags: a checkbox per hook, the item's content in its label.
  const flags = {};
  let summary = null;
  if (panel) {
    const [l, r] = panel;
    let labels = 0;
    [...l.children].forEach((el) => {
      if (el.matches('ul, ol')) {
        [...el.children].forEach((li) => {
          const nodes = [...li.childNodes];
          const last = nodes[nodes.length - 1];
          const off = last && last.nodeType === Node.TEXT_NODE && /^\s*off\s*$/i.test(last.nodeValue);
          const label = document.createElement('label');
          const box = document.createElement('input');
          box.type = 'checkbox';
          box.checked = !off;
          label.append(box, slot('sb-flag', off ? nodes.slice(0, -1) : nodes));
          li.append(label);
          if (off) li.append(slot('sb-flag-state', [last]));
          const name = li.querySelector('strong');
          const m = /^([A-Z])\b/.exec(name ? name.textContent.trim() : '');
          if (m) flags[m[1]] = { box, io: /\(writes?\)/i.test(name.textContent) ? 'write' : 'read' };
        });
        left.append(slot('sb-flags', [el]));
      } else {
        left.append(slot('lab__label', [el]));
        labels += 1;
        if (labels === 1) left.append(chips);
      }
    });
    const paras = [...r.children];
    summary = paras.length > 1 ? paras.pop() : null;
    paras.forEach((el) => right.append(slot('lab__label', [el])));
  } else left.append(chips);

  const lists = situations.map(([, cell]) => {
    const ol = cell.querySelector('ol');
    const wrap = slot('sb-steps', [ol]);
    return { wrap, steps: [...ol.children].map((li) => decorateStep(li, slot)) };
  });
  const run = slot('sb-run', lists.map((x) => x.wrap));
  run.setAttribute('aria-live', 'polite');
  right.append(run);
  let sum = null;
  if (summary) {
    sum = slot('verdict sb-sum', [summary]);
    sum.setAttribute('aria-live', 'polite');
    right.append(sum);
  }
  if (capRow) frame.append(slot('x-caption', [...capRow[0].children]));
  if (names.length) frame.append(slot('x-names', names));
  block.replaceChildren(frame);

  let current = 0;
  const show = (step, i) => step.lines.forEach((line, n) => { line.hidden = n !== i; });
  const render = () => {
    const counts = { read: 0, write: 0 };
    lists.forEach((list, i) => {
      let lastRan = true;
      list.wrap.hidden = i !== current;
      list.steps.forEach((step) => {
        const { li, lines, letter } = step;
        if (letter) {
          const flag = flags[letter];
          if (lines.length < 2) {
            li.dataset.s = 'skip';
            show(step, 0);
            lastRan = false;
          } else if (!flag || flag.box.checked) {
            const io = flag ? flag.io : 'read';
            li.dataset.s = io;
            if (i === current) counts[io] += 1;
            show(step, 0);
            lastRan = true;
          } else {
            li.dataset.s = 'skip';
            show(step, 1);
            lastRan = false;
          }
        } else show(step, lines.length > 1 && !lastRan ? 1 : 0);
      });
    });
    if (summary) {
      const text = summary.textContent.replace(COUNT, (_, verb) => counted(counts[verb], verb));
      const out = text.charAt(0).toUpperCase() + text.slice(1);
      if (out !== summary.textContent) summary.textContent = out;
    }
  };

  const pick = radios(hosts, (i) => {
    current = i;
    render();
  });
  Object.values(flags).forEach(({ box }) => box.addEventListener('change', render));
  if (hosts.length) pick(hosts[0]);
  else render();
}
