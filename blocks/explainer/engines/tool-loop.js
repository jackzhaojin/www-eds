/**
 * Explainer engine "tool-loop": the same edit as a scripted flow and as a model-driven tool loop
 * (the decision lab of "Building an MCP Server for EDS da.live"). Pick a version, and for the tool
 * loop what the model does; the log plays line by line, then the counts and the verdict show.
 *
 * Rows, in this order:
 * 1. one cell: the bar (a label paragraph, the source link paragraph);
 * 2. two cells, what shows without JavaScript: left: the note paragraph, then two italic
 *    paragraphs naming the version picker and the choice picker for assistive tech (not shown);
 *    right: the log of both versions (a heading item, then its lines), then the verdict;
 * 3. one row per version, three cells: its label (bold = picked first), the note shown when it is
 *    picked, the verdict shown while its log plays; each version row is followed by its runs;
 * 4. one row per run, four cells: the choice (a bold title, then a short note; empty when the
 *    version has one run, so it has no choices; the first is picked first), the log (one item per
 *    line: the bold who, "step 1", "call 1" or "tool", then the line), the counts (one item per
 *    count: the label, a line break, the bold value), the verdict (and a paragraph of inline code, ok or warn, for its
 *    tone; not shown);
 * 5. one cell: the caption.
 * A line and the tool lines right after it appear together.
 *
 * @variants (none)
 * @ew-exempt <p> picker names - text-as-metadata, never displayed
 */

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();
const kindOf = (who) => (/^step/i.test(who) ? 'code' : /^tool/i.test(who) ? 'tool' : /^call/i.test(who) ? 'model' : 'err');

function radios(group, options, onPick) {
  group.setAttribute('role', 'radiogroup');
  options.forEach((o, i) => {
    o.setAttribute('role', 'radio');
    o.addEventListener('click', () => onPick(i));
    o.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const n = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
        options[n].focus();
        onPick(n);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPick(i);
      }
    });
  });
  return (i) => options.forEach((o, j) => {
    o.setAttribute('aria-checked', String(i === j));
    o.tabIndex = i === j ? 0 : -1;
  });
}

export default async function engine(block, {
  slot, rows, wait, reduceMotion, plainLinks,
}) {
  const all = rows(block);
  const [barRow, staticRow, ...rest] = all;
  const capRow = rest.length && rest[rest.length - 1].length === 1 ? rest.pop() : null;
  const frame = document.createElement('figure');
  frame.className = 'lab loopx';
  const meta = slot('loopx-meta');

  if (barRow) {
    const bar = slot('lab__bar', [...barRow[0].children]);
    plainLinks(bar);
    frame.append(bar);
  }

  const modesBox = slot('loopx__modes');
  const scenBox = slot('loopx__scen');
  const say = slot('lab__label loopx-say');
  const stats = slot('loopx__stats');
  const log = slot('loopx__log');
  log.setAttribute('aria-live', 'polite');
  const verdict = slot('loopx__verdict');

  // what shows without JavaScript
  const names = [];
  if (staticRow) {
    const [l, r] = staticRow;
    const sayStatic = [];
    [...(l ? l.children : [])].forEach((el) => {
      if (isName(el)) {
        names.push(el.textContent.trim());
        meta.append(el);
      } else sayStatic.push(el);
    });
    say.append(slot('loopx-alt loopx-static', sayStatic));
    const rEls = [...(r ? r.children : [])];
    log.append(slot('loopx-alt loopx-static', rEls.filter((el) => el.matches('ol, ul'))));
    verdict.append(slot('loopx-alt loopx-static', rEls.filter((el) => !el.matches('ol, ul'))));
  }
  if (names[0]) modesBox.setAttribute('aria-label', names[0]);
  if (names[1]) scenBox.setAttribute('aria-label', names[1]);

  // versions and their runs
  const modes = [];
  rest.forEach((cells) => {
    if (cells.length < 4) {
      const [label, sayCell, runningCell] = cells;
      const option = slot('loopx-option', [...label.children]);
      modesBox.append(option);
      const m = {
        option,
        say: slot('loopx-alt', sayCell ? [...sayCell.children] : []),
        running: slot('loopx-alt', runningCell ? [...runningCell.children] : []),
        runs: [],
        isDefault: Boolean(option.querySelector('strong')),
      };
      say.append(m.say);
      verdict.append(m.running);
      modes.push(m);
      return;
    }
    const m = modes[modes.length - 1];
    if (!m) return;
    const [choice, logCell, countCell, verdictCell] = cells;
    const lines = logCell.querySelector('ol, ul');
    const logSlot = slot('loopx-alt', [...logCell.children]);
    log.append(logSlot);
    const items = lines ? [...lines.children] : [];
    items.forEach((li) => {
      const who = li.querySelector('strong');
      if (who && li.firstChild === who) who.classList.add('who', `who--${kindOf(who.textContent.trim())}`);
    });
    const statSlot = slot('loopx-alt', [...countCell.children]);
    stats.append(statSlot);
    const toneEl = [...verdictCell.children].find((el) => el.tagName === 'P' && /^(ok|warn)$/.test(el.textContent.trim()) && el.querySelector('code'));
    const tone = toneEl ? toneEl.textContent.trim() : 'ok';
    if (toneEl) meta.append(toneEl);
    const verdictSlot = slot('loopx-alt', [...verdictCell.children]);
    verdict.append(verdictSlot);
    const hasChoice = choice.textContent.trim().length > 0;
    let option = null;
    if (hasChoice) {
      option = slot('loopx-option', [...choice.children]);
      scenBox.append(option);
    }
    m.runs.push({
      option, logSlot, items, statSlot, verdictSlot, tone,
    });
  });

  let mode = Math.max(0, modes.findIndex((m) => m.isDefault));
  let run = 0;
  let token = 0;
  const alts = () => frame.querySelectorAll('.loopx-alt');

  const play = async () => {
    token += 1;
    const id = token;
    const m = modes[mode];
    const r = m && m.runs[run];
    if (!r) return;
    alts().forEach((a) => a.classList.remove('is-on', 'is-ghost'));
    m.say.classList.add('is-on');
    r.logSlot.classList.add('is-on');
    r.statSlot.classList.add('is-on');
    scenBox.hidden = m.runs.length < 2;
    verdict.dataset.tone = '';
    const instant = reduceMotion();
    if (!instant) {
      // the verdict box keeps its final height while the log plays: the run's verdict holds the
      // space, hidden, under the running note
      r.items.forEach((li) => li.classList.add('is-pending'));
      m.running.classList.add('is-on');
      r.verdictSlot.classList.add('is-on', 'is-ghost');
    }
    let i = 0;
    while (i < r.items.length && !instant) {
      if (id !== token) return;
      const step = [r.items[i]];
      i += 1;
      while (i < r.items.length && r.items[i].querySelector('.who--tool')) {
        step.push(r.items[i]);
        i += 1;
      }
      step.forEach((li) => {
        li.classList.remove('is-pending');
        li.classList.add('is-new');
      });
      log.scrollTop = log.scrollHeight;
      if (i < r.items.length) await wait(380);
    }
    if (id !== token) return;
    r.items.forEach((li) => li.classList.remove('is-pending'));
    m.running.classList.remove('is-on');
    r.verdictSlot.classList.remove('is-ghost');
    r.verdictSlot.classList.add('is-on');
    verdict.dataset.tone = r.tone;
  };

  let checkMode = () => {};
  let checkRun = () => {};
  checkMode = radios(modesBox, modes.map((m) => m.option), (i) => {
    mode = i;
    run = 0;
    checkMode(i);
    checkRun(0);
    play();
  });
  const scenOptions = modes.flatMap((m) => m.runs.map((r) => r.option)).filter(Boolean);
  checkRun = radios(scenBox, scenOptions, (i) => {
    run = i;
    checkRun(i);
    play();
  });

  const left = slot('loopx__left', [say, scenBox, stats]);
  const right = slot('loopx__right', [log, verdict]);
  frame.append(modesBox, slot('loopx__grid', [left, right]));
  if (capRow) {
    const cap = document.createElement('figcaption');
    cap.append(...capRow[0].children);
    frame.append(cap);
  }
  frame.append(meta);
  plainLinks(frame);
  frame.classList.add('is-live');
  block.replaceChildren(frame);
  if (!modes.length) return;
  checkMode(mode);
  checkRun(0);
  play();
}
