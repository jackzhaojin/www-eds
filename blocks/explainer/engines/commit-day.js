/**
 * Explainer engine "commit-day": the day in commits of "Migrating my site to AEM Edge Delivery
 * Services in two prompts". Every commit on www-eds main on one day, drawn as a running total
 * and one row of dots per commit type; play the day, jump to a moment or scrub the time.
 *
 * Rows: key | values (the key cell is one paragraph naming the row):
 * - bar | the label | the link paragraph;
 * - image | the static chart (shown without JavaScript);
 * - chart | the chart's accessible name | its title;
 * - controls | the group's accessible name | the play label;
 * - jump | the time shown (e.g. 11:15) | the label | the moment it jumps to (HH:MM), one row
 *   per jump button;
 * - axis | the first time | the last time | the most commits the line can reach;
 * - band | the label | from (HH:MM) | to (HH:MM), one row per shaded stretch;
 * - slider | its accessible name | the start, where play ends (HH:MM);
 * - lane | key | label, one row per type of commit, top to bottom;
 * - commit | time (HH:MM:SS) | short SHA | message | lane key, one row per commit, oldest first;
 * - caption | the caption.
 *
 * @variants (none)
 * @ew-exempt key cells, the chart, controls, axis, slider, moment, lane key and commit rows -
 *   config and data, hidden through .day__data
 * @ew-exempt the readout, the latest commit line and the lane counts - derived from the commits
 */

const NS = 'http://www.w3.org/2000/svg';
const W = 800;
const H = 316;
const X0 = 8;
const X1 = 792;
const YB = 150;
const YT = 18;
const COMMIT_URL = 'https://github.com/jackzhaojin/www-eds/commit/';

const text = (cell) => (cell ? cell.textContent.trim() : '');
const minutes = (t) => {
  const [h = 0, m = 0, s = 0] = String(t).split(':').map(Number);
  return h * 60 + m + s / 60;
};
const pad = (n) => (n < 10 ? '0' : '') + n;
const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.floor(m % 60))}`;

function svgEl(parent, tag, attrs) {
  const e = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  parent.append(e);
  return e;
}

function span(cls, nodes = []) {
  const s = document.createElement('span');
  s.className = cls;
  s.append(...nodes);
  return s;
}

/** A role host for authored text: Enter and Space click it, as on a button. */
function asButton(el) {
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });
  return el;
}

export default async function engine(block, { slot, rows, reduceMotion }) {
  const all = rows(block);
  const rowEls = [...block.children];
  const by = (key) => all.filter(([k]) => text(k) === key);
  const one = (key) => by(key)[0] || [];

  const frame = document.createElement('figure');
  frame.className = 'fig day';

  const [, barLabel, barLink] = one('bar');
  const bar = slot('day__bar', [...(barLabel?.children || []), ...(barLink?.children || [])]);
  frame.append(bar);

  const [, image] = one('image');
  const still = slot('day__static', [...(image?.children || [])]);
  frame.append(still);

  const [, chartName, chartTitle] = one('chart');
  const [, groupName, playLabel] = one('controls');
  const [, firstT, lastT, maxN] = one('axis');
  const [, rangeName, startT] = one('slider');
  const T0 = minutes(text(firstT) || '09:00');
  const T1 = minutes(text(lastT) || '16:30');
  const MAXN = Number(text(maxN)) || 135;
  const END = startT ? minutes(text(startT)) : T1;

  const lanes = by('lane').map(([, key, label]) => ({ key: text(key), label }));
  const C = by('commit').map(([, t, sha, msg, lane]) => ({
    m: minutes(text(t)), sha: text(sha), msg: text(msg), lane: text(lane),
  })).filter((c) => !Number.isNaN(c.m)).sort((a, b) => a.m - b.m);

  const live = document.createElement('div');
  live.className = 'day__live';
  live.hidden = true;

  const controls = slot('day__controls');
  controls.setAttribute('role', 'group');
  if (text(groupName)) controls.setAttribute('aria-label', text(groupName));
  const play = asButton(slot('day__play', [...(playLabel?.children || [])]));
  controls.append(play);
  const jumps = by('jump').map(([, t, label, at]) => {
    const b = asButton(slot('day__jump', [
      span('day__t', [...(t?.children || [])]),
      ...(label?.children || []),
    ]));
    b.dataset.at = String(minutes(text(at)));
    controls.append(b);
    return b;
  });
  live.append(controls);

  const x = (m) => X0 + ((m - T0) / (T1 - T0)) * (X1 - X0);
  const y = (n) => YB - (n / MAXN) * (YB - YT);
  const pct = (m) => `${((x(m) / W) * 100).toFixed(3)}%`;
  const laneY = (i) => 178 + i * 25;
  const idx = Object.fromEntries(lanes.map((l, i) => [l.key, i]));

  const plot = slot('day__plot');
  const svg = svgEl(plot, 'svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
  if (text(chartName)) svg.setAttribute('aria-label', text(chartName));
  if (text(chartTitle)) svgEl(svg, 'title', {}).textContent = text(chartTitle);
  const labels = slot('day__labels');
  labels.setAttribute('aria-hidden', 'true');
  plot.append(labels);

  by('band').forEach(([, label, from, to]) => {
    const a = minutes(text(from));
    const b = minutes(text(to));
    svgEl(svg, 'rect', {
      x: x(a).toFixed(1), y: 0, width: (x(b) - x(a)).toFixed(1), height: H, rx: 6, class: 'day__band',
    });
    const s = span('day__bandlbl', [...(label?.children || [])]);
    s.style.left = `calc(${pct(a)} + 6px)`;
    labels.append(s);
  });
  lanes.forEach((l, i) => svgEl(svg, 'line', {
    x1: X0, x2: X1, y1: laneY(i), y2: laneY(i), class: 'day__guide',
  }));
  svgEl(svg, 'line', {
    x1: X0, x2: X1, y1: YB, y2: YB, class: 'day__guide',
  });
  let pts = `M${x(T0).toFixed(1)},${y(0)}`;
  C.forEach((c, i) => { pts += ` L${x(c.m).toFixed(1)},${y(i + 1).toFixed(1)}`; });
  const lastX = C.length ? x(C[C.length - 1].m).toFixed(1) : x(T0).toFixed(1);
  const clipId = `day-clip-${Math.random().toString(36).slice(2, 8)}`;
  const defs = svgEl(svg, 'defs', {});
  const clip = svgEl(defs, 'clipPath', { id: clipId });
  const clipRect = svgEl(clip, 'rect', {
    x: 0, y: 0, width: W, height: H,
  });
  svgEl(svg, 'path', { d: pts, class: 'day__curve day__curve--dim' });
  const shown = svgEl(svg, 'g', { 'clip-path': `url(#${clipId})` });
  svgEl(shown, 'path', { d: `${pts} L${lastX},${YB} L${X0},${YB} Z`, class: 'day__area' });
  svgEl(shown, 'path', { d: pts, class: 'day__curve' });
  const dots = C.map((c) => svgEl(svg, 'circle', {
    cx: x(c.m).toFixed(1), cy: laneY(idx[c.lane] ?? 0), r: 4.5, class: `day__dot ln-${c.lane}`,
  }));
  const cur = svgEl(svg, 'line', {
    x1: 0, x2: 0, y1: 0, y2: H, class: 'day__cursor',
  });
  const head = svgEl(svg, 'circle', { r: 6, class: 'day__head' });
  live.append(plot);

  const ticks = slot('day__ticks');
  ticks.setAttribute('aria-hidden', 'true');
  for (let h = Math.ceil(T0 / 60); h * 60 <= T1; h += 1) {
    const t = document.createElement('span');
    t.textContent = `${pad(h)}:00`;
    t.style.left = pct(h * 60);
    ticks.append(t);
  }
  live.append(ticks);

  const range = document.createElement('input');
  range.className = 'day__range';
  range.type = 'range';
  range.min = String(T0);
  range.max = String(T1);
  range.step = '1';
  range.value = String(Math.round(END));
  if (text(rangeName)) range.setAttribute('aria-label', text(rangeName));
  const readout = document.createElement('p');
  readout.className = 'day__readout';
  readout.setAttribute('aria-live', 'polite');
  const commitEl = document.createElement('p');
  commitEl.className = 'day__commit';
  const laneList = document.createElement('ul');
  laneList.className = 'day__lanes';
  const laneItems = lanes.map((l) => {
    const li = document.createElement('li');
    li.className = `ln-${l.key}`;
    const n = C.filter((c) => c.lane === l.key).length;
    li.append(span('day__lane', [...(l.label?.children || []), span('day__count', [document.createTextNode(` ${n}`)])]));
    laneList.append(li);
    return li;
  });
  live.append(range, readout, commitEl, laneList);
  frame.append(live);

  const [, caption] = one('caption');
  if (caption) {
    const figcaption = document.createElement('figcaption');
    figcaption.append(...caption.children);
    frame.append(figcaption);
  }

  const update = (at) => {
    const m = Math.max(T0, Math.min(T1, at));
    let n = 0;
    let hour = 0;
    let last = null;
    const on = {};
    C.forEach((c, i) => {
      const before = c.m <= m;
      dots[i].classList.toggle('is-later', !before);
      if (!before) return;
      n += 1;
      last = c;
      if (c.m > m - 60) hour += 1;
      if (c.m > m - 30) on[c.lane] = 1;
    });
    const cx = x(m).toFixed(1);
    cur.setAttribute('x1', cx);
    cur.setAttribute('x2', cx);
    head.setAttribute('cx', cx);
    head.setAttribute('cy', y(n).toFixed(1));
    clipRect.setAttribute('width', cx);
    laneItems.forEach((li, i) => li.classList.toggle('is-on', !!on[lanes[i].key]));
    range.value = String(Math.round(m));
    range.setAttribute('aria-valuetext', `${hhmm(m)} Eastern, ${n} commits so far`);
    readout.textContent = `${hhmm(m)} ET · ${n} commits so far · ${hour} in the last 60 minutes`;
    commitEl.textContent = '';
    if (last) {
      const a = document.createElement('a');
      a.href = COMMIT_URL + last.sha;
      a.textContent = last.sha;
      commitEl.append('Latest: ', a, ` at ${hhmm(last.m)}, ${last.msg}`);
    } else if (C.length) {
      commitEl.textContent = `No commits yet. The first one lands at ${hhmm(C[0].m)}.`;
    }
  };

  let playing = 0;
  const stop = () => { playing += 1; };
  const fromPointer = (e) => {
    const r = svg.getBoundingClientRect();
    return T0 + ((((e.clientX - r.left) / r.width) * W - X0) / (X1 - X0)) * (T1 - T0);
  };
  let dragging = false;
  plot.addEventListener('pointerdown', (e) => {
    stop();
    dragging = true;
    plot.setPointerCapture(e.pointerId);
    update(fromPointer(e));
  });
  plot.addEventListener('pointermove', (e) => { if (dragging) update(fromPointer(e)); });
  plot.addEventListener('pointerup', () => { dragging = false; });
  plot.addEventListener('pointercancel', () => { dragging = false; });
  range.addEventListener('input', () => {
    stop();
    update(Number(range.value));
  });
  jumps.forEach((b) => b.addEventListener('click', () => {
    stop();
    update(Number(b.dataset.at));
  }));
  play.addEventListener('click', () => {
    playing += 1;
    const run = playing;
    if (reduceMotion()) {
      update(END);
      return;
    }
    let t0 = null;
    const dur = 9000;
    const step = (ts) => {
      if (run !== playing) return;
      if (t0 === null) t0 = ts;
      const k = Math.min(1, (ts - t0) / dur);
      update(T0 + (END - T0) * k);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  // Key cells and the config and data rows stay in the DOM, hidden, so they stay editable.
  const data = slot('day__data', rowEls);
  data.hidden = true;
  frame.append(data);

  block.replaceChildren(frame);
  live.hidden = false;
  frame.classList.add('is-live');
  update(END);
}
