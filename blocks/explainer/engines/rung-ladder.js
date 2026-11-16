/**
 * Explainer engine "rung-ladder": several climbers on one ladder, each stopping at the rung it
 * reached, with the reason beside it (the ladder of "SLICC on four personal agents": four
 * personal agents, four rungs, one makes it to the top). Pick a climber to read where it
 * stopped and what is inside its computer.
 *
 * Rows, read by content:
 * - rungs: a one-cell row with an ordered list, the rungs from the bottom up, each item a bold
 *   name and then a few words;
 * - name: an optional one-cell row, one italic paragraph naming the picker for assistive tech
 *   (not shown);
 * - one row per climber, four cells: the name (a bold name is picked first, else the first
 *   climber) | the rung it reached, a number (chart data) | where it stopped: a first
 *   paragraph that is its result line, then why | its facts, a list, each item a bold key and
 *   then the value;
 * - caption: the last one-cell row.
 *
 * Behaviour: without JavaScript the rungs and the climbers read as their rows. The climbers go
 * up together, a rung at a time, when the figure scrolls into view and on replay; one that
 * stops short gets a wall over its marker, one that reaches the top is marked done. Under
 * reduced motion every marker rests at its rung at once. Every authored element is moved into
 * its role wrapper; the rails, markers and walls are drawn from the numbers.
 *
 * @variants rung-ladder
 * @ew-exempt the picker name - the radio group's accessible name, not shown; the reached cell -
 *   chart data, read by the engine and kept in a hidden wrapper; the replay control's name
 *   ("Replay the climb"), an icon button's aria-label
 */

const BEAT = 520;
const isName = (cell) => cell.children.length === 1 && cell.firstElementChild.tagName === 'P'
  && cell.firstElementChild.children.length === 1 && cell.firstElementChild.firstElementChild.tagName === 'EM'
  && cell.textContent.trim() === cell.firstElementChild.firstElementChild.textContent.trim();

export default async function engine(block, {
  slot, rows, onceVisible, reduceMotion, replayControl, radios,
}) {
  let rungsCell = null;
  let name = null;
  let caption = null;
  const climbers = [];
  rows(block).forEach((cells) => {
    if (cells.length >= 3) climbers.push(cells);
    else if (cells.length === 1 && !rungsCell && cells[0].querySelector('ol')) [rungsCell] = cells;
    else if (cells.length === 1 && !name && isName(cells[0])) [name] = cells;
    else if (cells.length === 1) [caption] = cells;
  });
  if (!rungsCell || !climbers.length) return;

  const rungList = rungsCell.querySelector('ol');
  const top = [...rungList.children].filter((li) => li.tagName === 'LI').length;

  const figure = document.createElement('figure');
  figure.className = 'rl';
  const cols = slot('rl-cols');
  const cards = slot('rl-cards');
  const data = slot('rl-data');
  data.hidden = true;

  const lanes = climbers.map(([nameCell, reachedCell, wallCell, factsCell]) => {
    const reached = Math.min(Math.max(parseInt(reachedCell.textContent, 10) || 0, 0), top);
    data.append(...reachedCell.children);
    const rail = document.createElement('span');
    rail.className = 'rl-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<i class="rl-wall"></i><i class="rl-marker"></i>';
    const col = slot('rl-col', [rail, slot('rl-who', [...nameCell.children])]);
    col.dataset.result = reached === top ? 'top' : 'short';
    col.style.setProperty('--reach', reached);
    col.style.setProperty('--at', reached);
    cols.append(col);
    const card = slot('rl-card', [slot('rl-stop', [...wallCell.children])]);
    card.dataset.result = col.dataset.result;
    if (factsCell) card.append(slot('rl-facts', [...factsCell.children]));
    cards.append(card);
    return {
      col, card, reached, opening: !!col.querySelector('.rl-who strong'),
    };
  });

  const ladder = slot('rl-ladder', [slot('rl-rungs', [...rungsCell.children]), cols]);
  ladder.style.setProperty('--rungs', top);
  ladder.style.setProperty('--n', lanes.length);

  let timers = [];
  function climb() {
    timers.forEach(clearTimeout);
    timers = [];
    if (reduceMotion()) return;
    lanes.forEach(({ col }) => {
      col.removeAttribute('data-done');
      col.classList.add('is-reset');
      col.style.setProperty('--at', 0);
    });
    // eslint-disable-next-line no-void
    void ladder.offsetWidth;
    lanes.forEach(({ col, reached }, c) => {
      col.classList.remove('is-reset');
      for (let rung = 1; rung <= reached; rung += 1) {
        timers.push(setTimeout(() => col.style.setProperty('--at', rung), 180 + c * 90 + (rung - 1) * BEAT));
      }
      timers.push(setTimeout(() => col.setAttribute('data-done', ''), 180 + c * 90 + Math.max(reached, 1) * BEAT));
    });
  }

  const pick = radios(cols, lanes.map((l) => l.col), (to) => {
    lanes.forEach((l, i) => { l.card.hidden = i !== to; });
  }, name ? name.textContent.trim() : '');

  figure.append(
    slot('rl-head', [replayControl('Replay the climb', climb)]),
    slot('rl-body', [ladder, cards]),
  );
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'rl-caption';
    figcaption.append(...caption.children);
    figure.append(figcaption);
  }
  if (name) data.append(...name.children);
  figure.append(data);
  block.replaceChildren(figure);
  lanes.forEach(({ col }) => col.setAttribute('data-done', ''));
  const opening = lanes.findIndex((l) => l.opening);
  pick(opening < 0 ? 0 : opening);
  onceVisible(figure, climb, 0.4);
}
