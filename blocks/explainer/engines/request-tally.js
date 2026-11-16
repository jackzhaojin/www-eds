/**
 * Explainer engine "request-tally": what one step of an agent sends, and how a whole run adds
 * up, in two or more runs behind a switch (the failing requests of "SLICC on four personal
 * agents": before the fix two of every three requests failed, after it none did). Each request
 * of a step is a bar as long as the request took, ending in its status; the run's total is a
 * field of dots, one per request.
 *
 * Rows, read by content:
 * - name: an optional one-cell row, one italic paragraph naming the switch for assistive tech
 *   (not shown);
 * - one row per run, three or four cells: the label (a bold label is shown first, else the
 *   first run) | one step: an optional label paragraph, then a list with one item per request
 *   the step sends. The first three-digit number in an item is its status (2xx passes), and
 *   the first time in it ("130 ms", "2 s") is how long it took; an item with no time gets a
 *   status mark and no bar | the total, one paragraph
 *   holding "N of M": with the word "failed" N requests failed, otherwise N succeeded | an
 *   optional note;
 * - caption: the last one-cell row.
 *
 * Behaviour: without JavaScript the runs read as their rows. Picking a run plays it once: the
 * bars grow at the same speed, so a request rejected in 130 ms ends long before one that takes
 * 2 seconds, then the dots fill in. Under reduced motion the finished state shows at once.
 * Every authored element is moved into its role wrapper; bar lengths and dots come from the
 * numbers in the text.
 *
 * @variants request-tally
 * @ew-exempt the switch name - the radio group's accessible name, not shown; the replay
 *   control's name ("Replay the step"), an icon button's aria-label
 */

const isName = (cell) => cell.children.length === 1 && cell.firstElementChild.tagName === 'P'
  && cell.firstElementChild.children.length === 1 && cell.firstElementChild.firstElementChild.tagName === 'EM'
  && cell.textContent.trim() === cell.firstElementChild.firstElementChild.textContent.trim();
const num = (text) => parseInt(String(text).replace(/,/g, ''), 10) || 0;

/** How long a request took, in milliseconds, from the first time in its text. */
function took(text) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(ms|s)\b/);
  if (!m) return 0;
  return parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1);
}

export default async function engine(block, {
  slot, rows, onceVisible, reduceMotion, replayControl, radios,
}) {
  let name = null;
  let caption = null;
  const runRows = [];
  rows(block).forEach((cells) => {
    if (cells.length >= 3 && cells[1].querySelector('ul, ol')) runRows.push(cells);
    else if (cells.length === 1 && !name && isName(cells[0])) [name] = cells;
    else if (cells.length === 1) [caption] = cells;
  });
  if (!runRows.length) return;

  const figure = document.createElement('figure');
  figure.className = 'rt';
  const switcher = slot('rt-switch chips');
  const stage = slot('rt-stage');

  const parsed = runRows.map(([, stepCell]) => [...stepCell.querySelectorAll('li')].map((li) => took(li.textContent)));
  const longest = Math.max(...parsed.flat(), 1);

  const runs = runRows.map(([labelCell, stepCell, totalCell, noteCell], r) => {
    const host = slot('rt-option', [...labelCell.children]);
    switcher.append(host);
    const list = stepCell.querySelector('ul, ol');
    [...list.children].forEach((li, i) => {
      const status = num((li.textContent.match(/\b[1-5]\d\d\b/) || [])[0]);
      li.dataset.status = status >= 200 && status < 300 ? 'ok' : 'fail';
      if (parsed[r][i]) li.style.setProperty('--w', Math.max(parsed[r][i] / longest, 0.03).toFixed(3));
      else li.dataset.timed = 'no';
    });
    const labels = [...stepCell.children].filter((el) => el !== list);
    const step = slot('rt-step', [slot('rt-step-label', labels), slot('rt-lanes', [list])]);

    const text = totalCell.textContent;
    const m = text.match(/([\d,]+)\s+of\s+([\d,]+)/) || [0, 0, 0];
    const total = num(m[2]);
    const failed = /fail/i.test(text) ? num(m[1]) : total - num(m[1]);
    const dots = slot('rt-dots');
    dots.setAttribute('aria-hidden', 'true');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i += 1) {
      const dot = document.createElement('i');
      if (i < failed) dot.className = 'is-fail';
      dot.style.setProperty('--i', i);
      frag.append(dot);
    }
    dots.append(frag);
    dots.style.setProperty('--total', Math.max(total, 1));
    const tally = slot('rt-tally', [slot('rt-count', [...totalCell.children]), dots]);
    tally.dataset.result = failed ? 'fail' : 'ok';
    const run = slot('rt-run', [step, tally]);
    if (noteCell) run.append(slot('rt-note', [...noteCell.children]));
    stage.append(run);
    return { host, run, opening: !!host.querySelector('strong') };
  });

  function play({ run }) {
    runs.forEach((x) => x.run.classList.remove('is-playing'));
    if (reduceMotion()) return;
    // eslint-disable-next-line no-void
    void run.offsetWidth;
    run.classList.add('is-playing');
  }

  let current = 0;
  const pick = radios(switcher, runs.map((x) => x.host), (to, fromUser) => {
    current = to;
    runs.forEach((x, i) => { x.run.hidden = i !== to; });
    if (fromUser) play(runs[to]);
  }, name ? name.textContent.trim() : '');

  figure.append(slot('rt-head', [switcher, replayControl('Replay the step', () => play(runs[current]))]), stage);
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'rt-caption';
    figcaption.append(...caption.children);
    figure.append(figcaption);
  }
  if (name) figure.append(slot('rt-name-row', [...name.children]));
  block.replaceChildren(figure);
  const opening = runs.findIndex((x) => x.opening);
  pick(opening < 0 ? 0 : opening);
  onceVisible(figure, () => play(runs[current]), 0.35);
}
