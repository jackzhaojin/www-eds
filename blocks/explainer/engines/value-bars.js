/**
 * Explainer engine "value-bars": a few values compared as horizontal bars on one scale (the
 * cost meter of "SLICC on four personal agents": the same task at about $31 an hour on one
 * model and under $4 on another).
 *
 * Rows, read by content:
 * - title: an optional first one-cell row, the chart's label;
 * - one row per bar, two cells: what was measured (a paragraph, with an optional second one in
 *   smaller type) | the value, as it should read ("$31.49 an hour"). The first number in the
 *   value sets the bar's length against the largest value; a value in italics is the one to
 *   call out, drawn in the danger tone;
 * - caption: the last one-cell row.
 *
 * Behaviour: without JavaScript the values read as their rows. The bars grow once when the
 * figure scrolls into view, and again on replay (under reduced motion they show full length at
 * once). Every authored element is moved into its role wrapper; the bars are drawn from the
 * numbers.
 *
 * @variants value-bars
 * @ew-exempt the replay control's name ("Replay the bars"), an icon button's aria-label
 */

export default async function engine(block, {
  slot, rows, onceVisible, reduceMotion, replayControl,
}) {
  const all = rows(block);
  const bars = all.filter((cells) => cells.length === 2);
  if (!bars.length) return;
  const singles = all.filter((cells) => cells.length === 1);
  const title = all[0].length === 1 ? all[0][0] : null;
  const caption = singles.length && singles[singles.length - 1][0] !== title ? singles[singles.length - 1][0] : null;

  const values = bars.map(([, valueCell]) => parseFloat((valueCell.textContent.replace(/,/g, '').match(/\d+(?:\.\d+)?/) || [0])[0]));
  const max = Math.max(...values, 1);

  const figure = document.createElement('figure');
  figure.className = 'vb';
  const list = slot('vb-list');
  list.setAttribute('role', 'list');
  bars.forEach(([labelCell, valueCell], i) => {
    const bar = document.createElement('span');
    bar.className = 'vb-bar';
    bar.setAttribute('aria-hidden', 'true');
    const item = slot('vb-item', [slot('vb-label', [...labelCell.children]), slot('vb-value', [...valueCell.children]), bar]);
    item.setAttribute('role', 'listitem');
    if (item.querySelector('.vb-value em')) item.dataset.tone = 'warn';
    item.style.setProperty('--v', (values[i] / max).toFixed(4));
    list.append(item);
  });

  function grow() {
    figure.classList.remove('is-playing');
    if (reduceMotion()) return;
    // eslint-disable-next-line no-void
    void figure.offsetWidth;
    figure.classList.add('is-playing');
  }

  const head = slot('vb-head', [slot('vb-title', title ? [...title.children] : []), replayControl('Replay the bars', grow)]);
  figure.append(head, list);
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'vb-caption';
    figcaption.append(...caption.children);
    figure.append(figcaption);
  }
  block.replaceChildren(figure);
  onceVisible(figure, grow, 0.4);
}
