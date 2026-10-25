/**
 * Explainer (hook-guard): the guard lab of "Agentic Admin API Configuration for Edge Delivery
 * Services". The same three checks, in the same order and with the same output, as
 * hooks/guard-admin-api.sh of the hlx-admin-api-executor-guarded plugin, run on a command the
 * reader picks or edits. The script greps the command line by line, so the port does too.
 * Nothing is sent anywhere.
 *
 * Rows, read by content:
 * - bar: the first row, one cell: the label paragraph, then the source link paragraph;
 * - presets: one row per preset command, three cells: the chip label | the command (a code
 *   block) | the note the verdict shows for it; the second preset is picked on load;
 * - command label: a one-cell row with one paragraph, the label of the editable command;
 * - checks: a one-cell row with the ordered list of the three checks, each a bold title, then
 *   the note (curl, write method, Admin API target, in the script's order);
 * - static: a one-cell row with the verdict shown without JavaScript;
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants hook-guard
 * @ew-exempt preset commands and notes - data, shown in the editor and the verdict; the static
 *   verdict - the no-JavaScript fallback; the check messages and the verdict - derived
 */

const RE_CURL = /curl\b/i; // guard-admin-api.sh line 20
const RE_METHOD = /(--request|-X)\s+(POST|PUT|DELETE|PATCH)/i; // line 21
const RE_TARGET = /(admin\.hlx\.page|\$\{?BASE_URL\}?)/i; // line 22
const RE_URL = /(admin\.hlx\.page|BASE_URL)[^ ]*/i; // line 30

function firstMatch(lines, re) {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (m) return m[0];
  }
  return '';
}

function guard(cmd) {
  if (!cmd) return { steps: ['skip', 'skip', 'skip'], ask: false, empty: true };
  const lines = cmd.split('\n');
  const any = (re) => lines.some((l) => re.test(l));
  const c1 = any(RE_CURL);
  const c2 = c1 && any(RE_METHOD);
  const c3 = c2 && any(RE_TARGET);
  const steps = [c1 ? 'pass' : 'miss', c1 ? (c2 ? 'pass' : 'miss') : 'skip', c2 ? (c3 ? 'pass' : 'miss') : 'skip'];
  if (!c3) return { steps, ask: false };
  const method = firstMatch(lines, RE_METHOD).split(/\s+/).pop().toUpperCase();
  const target = firstMatch(lines, RE_URL) || 'admin.hlx.page';
  return {
    steps,
    ask: true,
    out: {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `[HLX Admin API Guard] ${method} request to ${target}. This is a destructive admin API operation. Approve?`,
      },
    },
  };
}

const txt = (el) => (el ? el.textContent.trim() : '');

function classify(rows) {
  const parts = { presets: [] };
  const single = [];
  rows.forEach((cells, i) => {
    const [a] = cells;
    if (cells.length === 3 && cells[1].querySelector('pre')) parts.presets.push(cells);
    else if (a.querySelector('ol')) parts.checks = a;
    else if (i === 0) parts.bar = a;
    else single.push({ cell: a, afterChecks: !!parts.checks });
  });
  parts.label = single.find((s) => !s.afterChecks)?.cell;
  const after = single.filter((s) => s.afterChecks).map((s) => s.cell);
  parts.caption = after.pop();
  [parts.staticRow] = after;
  return parts;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const parts = classify(rows(block));
  const frame = slot('lab guard');
  if (parts.bar) {
    const bar = slot('lab__bar', [...parts.bar.children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const left = slot('lab__left');
  const right = slot('lab__right');
  frame.append(slot('lab__grid', [left, right]));
  const data = slot('guard-data');

  // presets: chip label | command | note
  const chips = slot('guard-chips');
  chips.setAttribute('role', 'radiogroup');
  chips.setAttribute('aria-label', 'Pick a command');
  const presets = parts.presets.map(([label, cmd, note]) => {
    const chip = slot('guard-chip', [...label.children]);
    chip.setAttribute('role', 'radio');
    chip.setAttribute('aria-checked', 'false');
    chips.append(chip);
    const command = cmd.querySelector('pre').textContent.replace(/\n$/, '');
    const noteText = txt(note);
    data.append(...cmd.children, ...note.children);
    return { chip, command, note: noteText };
  });
  if (presets.length) left.append(chips);

  const box = document.createElement('textarea');
  box.spellcheck = false;
  box.setAttribute('autocomplete', 'off');
  if (parts.label) {
    left.append(slot('lab__label', [...parts.label.children]));
    box.setAttribute('aria-label', txt(left.lastElementChild));
  }
  left.append(box);

  let gates = [];
  if (parts.checks) {
    const ol = parts.checks.querySelector('ol');
    right.append(slot('guard-checks', [...parts.checks.children]));
    gates = [...ol.children];
  }
  const verdict = slot('verdict');
  verdict.setAttribute('aria-live', 'polite');
  const out = slot('guard-out');
  verdict.append(out);
  if (parts.staticRow) verdict.append(slot('guard-static', [...parts.staticRow.children]));
  right.append(verdict);
  frame.append(data);
  if (parts.caption) frame.append(slot('x-caption guard-caption', [...parts.caption.children]));
  block.replaceChildren(frame);
  if (!presets.length || gates.length < 3) return;

  // the check messages live in each check's card
  const msgs = gates.map((li) => {
    const msg = document.createElement('code');
    msg.className = 'guard-msg';
    li.append(msg);
    return msg;
  });
  let current = null;
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  function render() {
    const r = guard(box.value);
    const hits = [RE_CURL, RE_METHOD, RE_TARGET];
    gates.forEach((g, i) => {
      const st = r.steps[i];
      g.dataset.state = st === 'pass' ? 'hit' : st === 'miss' ? 'exit' : 'skip';
      if (st === 'pass') msgs[i].textContent = `matched: ${firstMatch(box.value.split('\n'), hits[i])}`;
      else if (st === 'miss') msgs[i].textContent = 'no match, so the script exits 0 here';
      else msgs[i].textContent = '';
      msgs[i].style.display = st === 'skip' ? 'none' : 'block';
    });
    const note = current?.note ? el('span', 'verdict__note', current.note) : null;
    const p = el('p');
    if (r.ask) {
      p.append(el('span', 'ask', 'Stops for approval.'));
      if (note) p.append(' ', note);
      out.replaceChildren(p, el('p', 'verdict__sub', 'The hook prints this, and Claude Code shows the reason in its prompt:'), el('pre', '', JSON.stringify(r.out, null, 2)));
    } else {
      p.append(el('span', 'allow', 'Runs without a prompt.'));
      if (note) p.append(' ', note);
      else p.append(r.empty ? ' Empty command: the script fails open and exits 0.' : ' The script exits 0 with no output, so Claude Code runs the command.');
      out.replaceChildren(p);
    }
  }

  const pick = (preset) => {
    presets.forEach((x) => {
      x.chip.setAttribute('aria-checked', String(x === preset));
      x.chip.tabIndex = x === preset ? 0 : -1;
    });
    current = preset;
    box.value = preset.command;
    render();
  };
  presets.forEach((x, i) => {
    x.chip.addEventListener('click', () => pick(x));
    x.chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick(x);
        return;
      }
      const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = presets[(i + d + presets.length) % presets.length];
      pick(next);
      next.chip.focus();
    });
  });
  box.addEventListener('input', () => {
    current = null;
    presets.forEach((x) => {
      x.chip.setAttribute('aria-checked', 'false');
      x.chip.tabIndex = 0;
    });
    render();
  });
  block.classList.add('is-live');
  pick(presets[Math.min(1, presets.length - 1)]);
}
