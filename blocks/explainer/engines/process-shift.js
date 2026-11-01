/**
 * Explainer engine "process-shift": one process drawn as a flow of steps, in two or more
 * versions behind a switch (the way it runs today, then the ways AI changes it), each step
 * marked by who does it (the Sites and AI presentation, 2026-11-11). Picking a version plays its
 * flow once, step by step, and the split bar shows how the work divides between the actors.
 *
 * Rows, read by content:
 * - key: a one-cell row with a list, the actors in this order: the person, AI, automation
 *   (each a bold name);
 * - name: an optional one-cell row, one italic paragraph naming the switch for assistive tech
 *   (not shown);
 * - one row per version, two or three cells: the label (a bold label is shown first, else the
 *   first version) | the steps, an ordered list, each item opening with its actor's bold name
 *   from the key | an optional note on what changes;
 * - caption: the last one-cell row.
 *
 * Behaviour: without JavaScript the versions read as their lists; printed, every version shows,
 * each under its label (the lane's data-label, the switch's text). Each authored list stays
 * whole (moved into the track, never rebuilt): its items get their actor as data-kind and are
 * drawn by CSS; the split bar and its counts are derived from the actors. A replay control at
 * the end of the switch row plays the shown version again (hidden under reduced motion).
 *
 * @variants process-shift
 * @ew-exempt the switch name - the radio group's accessible name, not shown; the replay
 *   control's name ("Replay the steps"), an icon button's aria-label
 */

const BEAT = 560;
const KINDS = ['you', 'ai', 'auto'];
const word = (el) => (el ? el.textContent.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() : '');
const isName = (cell) => cell.children.length === 1 && cell.firstElementChild.tagName === 'P'
  && cell.firstElementChild.children.length === 1 && cell.firstElementChild.firstElementChild.tagName === 'EM'
  && cell.textContent.trim() === cell.firstElementChild.firstElementChild.textContent.trim();

function radio(host) {
  host.setAttribute('role', 'radio');
  host.setAttribute('aria-checked', 'false');
  host.tabIndex = -1;
  return host;
}

export default async function engine(block, {
  slot, rows, onceVisible, reduceMotion,
}) {
  let key = null;
  let name = null;
  let caption = null;
  const versions = [];
  rows(block).forEach((cells) => {
    if (cells.length > 1 && cells[1].querySelector('ol')) versions.push(cells);
    else if (cells.length === 1 && !key && cells[0].querySelector('ul')) [key] = cells;
    else if (cells.length === 1 && !name && isName(cells[0])) [name] = cells;
    else if (cells.length === 1) [caption] = cells;
  });
  if (!versions.length) return;

  const actors = key ? [...key.querySelectorAll('li')].map((li) => word(li.querySelector('strong') || li)) : [];
  const kindOf = (li) => {
    const k = actors.indexOf(word(li.querySelector('strong')));
    return k < 0 ? 0 : Math.min(k, 2);
  };

  const figure = document.createElement('figure');
  figure.className = 'ps';
  const switcher = slot('ps-switch chips');
  switcher.setAttribute('role', 'radiogroup');
  if (name) switcher.setAttribute('aria-label', name.textContent.trim());
  const stage = slot('ps-stage');

  const lanes = versions.map(([labelCell, stepsCell, noteCell]) => {
    const label = labelCell.textContent.trim();
    const host = radio(slot('ps-option', [...labelCell.children]));
    switcher.append(host);
    const list = stepsCell.querySelector('ol');
    const counts = [0, 0, 0];
    const steps = [...list.children].filter((li) => li.tagName === 'LI');
    steps.forEach((li) => {
      const k = kindOf(li);
      counts[k] += 1;
      li.dataset.kind = KINDS[k];
    });
    const track = slot('ps-track', [list]);
    track.style.setProperty('--n', Math.max(steps.length, 1));
    const lane = slot('ps-lane', [track]);
    lane.dataset.label = label;
    const notes = [...stepsCell.children, ...(noteCell ? [...noteCell.children] : [])];
    if (notes.length) lane.append(slot('ps-note', notes));
    stage.append(lane);
    return {
      host, lane, track, steps, counts, opening: !!labelCell.querySelector('strong'),
    };
  });

  // the split: a bar per actor, sized by its steps in the shown version, the key as its legend
  const bar = slot('ps-bar');
  bar.setAttribute('aria-hidden', 'true');
  const segments = [0, 1, 2].map((k) => {
    const seg = document.createElement('span');
    seg.className = `ps-seg is-k${k}`;
    bar.append(seg);
    return seg;
  });
  const split = slot('ps-split', [bar]);
  if (key) split.prepend(slot('ps-key', [...key.children]));

  let timers = [];
  const stop = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  /** Plays a version's flow once: the line draws from step to step, each step lights in turn. */
  function play(lane) {
    stop();
    const { track, steps } = lane;
    if (reduceMotion() || steps.length < 2) return;
    track.classList.add('is-playing');
    track.style.setProperty('--p', 0);
    steps.forEach((s) => {
      s.removeAttribute('data-on');
      s.removeAttribute('data-now');
    });
    steps.forEach((step, i) => {
      timers.push(setTimeout(() => {
        steps.forEach((s, j) => {
          s.toggleAttribute('data-on', j <= i);
          s.toggleAttribute('data-now', j === i);
        });
        track.style.setProperty('--p', i / (steps.length - 1));
      }, 240 + i * BEAT));
    });
    timers.push(setTimeout(() => {
      steps.forEach((s) => s.removeAttribute('data-now'));
      track.classList.remove('is-playing');
    }, 240 + steps.length * BEAT + 400));
  }

  let current = 0;
  function show(v, animate) {
    current = v;
    lanes.forEach((l, i) => {
      const on = i === v;
      l.host.setAttribute('aria-checked', String(on));
      l.host.tabIndex = on ? 0 : -1;
      l.lane.hidden = !on;
    });
    const { counts } = lanes[v];
    counts.forEach((c, k) => {
      segments[k].style.flexGrow = c;
      figure.style.setProperty(`--c${k}`, c);
    });
    if (animate) play(lanes[v]);
  }

  lanes.forEach(({ host }, i) => {
    host.addEventListener('click', () => show(i, true));
    host.addEventListener('keydown', (e) => {
      const last = lanes.length - 1;
      const to = {
        ArrowRight: i === last ? 0 : i + 1,
        ArrowDown: i === last ? 0 : i + 1,
        ArrowLeft: i === 0 ? last : i - 1,
        ArrowUp: i === 0 ? last : i - 1,
        Home: 0,
        End: last,
      }[e.key];
      if (to !== undefined) {
        e.preventDefault();
        lanes[to].host.focus();
        show(to, true);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(i, true);
      }
    });
  });

  // replay: the shown version's flow again, from its first step
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'ps-replay';
  replay.setAttribute('aria-label', 'Replay the steps');
  replay.title = 'Replay the steps';
  replay.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 9.2A5.3 5.3 0 1 1 11.6 4.3"/><path d="M12.4 1.6v3.2H9.2"/></svg>';
  replay.addEventListener('click', () => play(lanes[current]));

  figure.append(slot('ps-head', [switcher, replay]), stage, split);
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.className = 'ps-caption';
    figcaption.append(...caption.children);
    figure.append(figcaption);
  }
  if (name) figure.append(slot('ps-name-row', [...name.children]));
  block.replaceChildren(figure);
  const opening = lanes.findIndex((l) => l.opening);
  show(opening < 0 ? 0 : opening, false);
  onceVisible(figure, () => play(lanes[current]), 0.4);
}
