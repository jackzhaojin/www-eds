/**
 * Explainer engine "bridge-path": one request followed hop by hop along two or more routes
 * behind a switch, where a route either comes back with an answer or stops at a hop (the
 * request path of "SLICC on four personal agents": a model call from a plain sliccy.ai tab
 * stops at a 404, the same call from `npx sliccy` goes through the local server).
 *
 * Rows, read by content:
 * - name: an optional one-cell row, one italic paragraph naming the switch for assistive tech
 *   (not shown);
 * - one row per route, four cells: the label (a bold label is shown first, else the first
 *   route) | the hops, an ordered list, each item a bold name and then what happens there |
 *   the verdict, one short paragraph: a route that stops names the hop's number in it
 *   ("Stops at hop 3"), a route with no number in its verdict comes back | the outcome:
 *   paragraphs, and a code block for the exact message when there is one;
 * - caption: the last one-cell row.
 *
 * Behaviour: without JavaScript the routes read as their lists. Picking a route plays it once:
 * the request reaches each hop in turn, then either stops (the hops after it are never
 * reached) or comes back. The replay control plays the shown route again. Under reduced motion
 * the finished state shows at once. Every authored element is moved into its role wrapper.
 *
 * @variants bridge-path
 * @ew-exempt the switch name - the radio group's accessible name, not shown; the replay
 *   control's name ("Replay the request"), an icon button's aria-label
 */

const BEAT = 640;
const isName = (cell) => cell.children.length === 1 && cell.firstElementChild.tagName === 'P'
  && cell.firstElementChild.children.length === 1 && cell.firstElementChild.firstElementChild.tagName === 'EM'
  && cell.textContent.trim() === cell.firstElementChild.firstElementChild.textContent.trim();

export default async function engine(block, {
  slot, rows, onceVisible, reduceMotion, replayControl, radios,
}) {
  let name = null;
  let caption = null;
  const routes = [];
  rows(block).forEach((cells) => {
    if (cells.length >= 3 && cells[1].querySelector('ol')) routes.push(cells);
    else if (cells.length === 1 && !name && isName(cells[0])) [name] = cells;
    else if (cells.length === 1) [caption] = cells;
  });
  if (!routes.length) return;

  const figure = document.createElement('figure');
  figure.className = 'bp';
  const switcher = slot('bp-switch chips');
  const stage = slot('bp-stage');

  const lanes = routes.map(([labelCell, hopsCell, verdictCell, outcomeCell]) => {
    const host = slot('bp-option', [...labelCell.children]);
    switcher.append(host);
    const list = hopsCell.querySelector('ol');
    const hops = [...list.children].filter((li) => li.tagName === 'LI');
    const at = parseInt((verdictCell.textContent.match(/\d+/) || [])[0], 10);
    const stop = Number.isNaN(at) ? 0 : Math.min(Math.max(at, 1), hops.length);
    const track = slot('bp-track', [list]);
    track.style.setProperty('--n', Math.max(hops.length, 1));
    const result = slot('bp-result', [slot('bp-verdict', [...verdictCell.children])]);
    result.dataset.kind = stop ? 'fail' : 'ok';
    if (outcomeCell) result.append(slot('bp-outcome', [...outcomeCell.children]));
    const lane = slot('bp-lane', [track, result]);
    lane.dataset.kind = stop ? 'fail' : 'ok';
    stage.append(lane);
    return {
      host, lane, track, hops, stop, opening: !!host.querySelector('strong'),
    };
  });

  /** The finished state of a route: every hop it reached, where it stopped, what it missed. */
  function settle({ lane, hops, stop }) {
    const reached = stop || hops.length;
    hops.forEach((hop, i) => {
      hop.toggleAttribute('data-on', i < reached);
      hop.toggleAttribute('data-stop', !!stop && i === stop - 1);
      hop.toggleAttribute('data-skip', i >= reached);
      hop.removeAttribute('data-now');
    });
    lane.setAttribute('data-done', '');
  }

  let timers = [];
  function play(lane) {
    timers.forEach(clearTimeout);
    timers = [];
    lanes.forEach((l) => l.lane.classList.remove('is-playing'));
    if (reduceMotion()) {
      settle(lane);
      return;
    }
    const { hops, stop } = lane;
    const reached = stop || hops.length;
    lane.lane.removeAttribute('data-done');
    lane.lane.classList.add('is-playing');
    hops.forEach((hop) => ['data-on', 'data-now', 'data-stop', 'data-skip'].forEach((a) => hop.removeAttribute(a)));
    for (let i = 0; i < reached; i += 1) {
      timers.push(setTimeout(() => {
        hops.forEach((hop, j) => {
          hop.toggleAttribute('data-on', j <= i);
          hop.toggleAttribute('data-now', j === i);
        });
      }, 260 + i * BEAT));
    }
    timers.push(setTimeout(() => {
      settle(lane);
      lane.lane.classList.remove('is-playing');
    }, 260 + reached * BEAT));
  }

  let current = 0;
  const pick = radios(switcher, lanes.map((l) => l.host), (to, fromUser) => {
    current = to;
    lanes.forEach((l, i) => { l.lane.hidden = i !== to; });
    if (fromUser) play(lanes[to]);
    else settle(lanes[to]);
  }, name ? name.textContent.trim() : '');

  figure.append(slot('bp-head', [switcher, replayControl('Replay the request', () => play(lanes[current]))]), stage);
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'bp-caption';
    figcaption.append(...caption.children);
    figure.append(figcaption);
  }
  if (name) figure.append(slot('bp-name-row', [...name.children]));
  block.replaceChildren(figure);
  const opening = lanes.findIndex((l) => l.opening);
  pick(opening < 0 ? 0 : opening);
  onceVisible(figure, () => play(lanes[current]), 0.4);
}
