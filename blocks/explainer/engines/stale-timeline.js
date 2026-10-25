/**
 * Explainer engine "stale-timeline": stale-while-revalidate on one cached response (RFC 5861),
 * from "AEM caching in production architectures". Move the age of the cached copy, switch the
 * directive off, and see which case applies, who waits and for how long.
 *
 * Rows, in this order:
 * 1. one cell: the header paragraph (the Cache-Control value: its max-age and
 *    stale-while-revalidate numbers drive the model) and the demo note paragraph;
 * 2. two cells: the slider label (its bold run is the age, e.g. "8 minutes", the starting
 *    value) | the directive switch label;
 * 3. three cells: the zone labels (fresh | stale | too old);
 * 4. four cells: the tick labels (0 | max-age | max-age plus stale-while-revalidate | the end of
 *    the track; the last one, in minutes, sets the track's length);
 * 5. one cell: the cases list (fresh, stale, too old);
 * 6. two cells: the lane labels (the browser's wait | the CDN's fetch);
 * 7. four cells: the verdicts (fresh | stale | too old | too old without the directive);
 *    "{age}" in a verdict reads the age;
 * 8. one cell: the caption.
 * The dispatcher answers in one second (the demo value in the caption).
 *
 * @variants (none)
 * @ew-exempt the lane times ("none", "1 s") and the age are derived from the model
 */

const ORIGIN = 1;
const STEP = 30;

const fmt = (s) => (s < 60 ? `${s} seconds` : `${Math.floor(s / 60)} minute${Math.floor(s / 60) === 1 ? '' : 's'}${s % 60 ? ` ${s % 60} seconds` : ''}`);
const seconds = (text, fallback) => {
  const m = /(\d+)\s*min/.exec(text);
  const s = /(\d+)\s*sec/.exec(text);
  if (!m && !s) return fallback;
  return (m ? Number(m[1]) * 60 : 0) + (s ? Number(s[1]) : 0);
};
const first = (cells) => (cells || []).map((c) => c.firstElementChild).filter(Boolean);

/** Wraps the first match of `run` in a paragraph's text in a span (the text is unchanged). */
function wrapRun(p, run, cls) {
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const at = n.data.indexOf(run);
    if (at > -1) {
      const span = document.createElement('span');
      span.className = cls;
      const tail = n.splitText(at);
      tail.splitText(run.length);
      tail.replaceWith(span);
      span.append(tail);
      return span;
    }
  }
  return null;
}

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const [head, controls, zones, ticks, cases, lanes, outs, cap] = all;
  const frame = document.createElement('figure');
  frame.className = 'swr is-live';

  // header
  const headEls = head ? [...head[0].children] : [];
  const hdr = headEls[0];
  const hdrText = hdr ? hdr.textContent : '';
  const MAX_AGE = Number((/max-age=(\d+)/.exec(hdrText) || [])[1] || 300);
  const SWR = Number((/stale-while-revalidate=(\d+)/.exec(hdrText) || [])[1] || 1800);
  const run = /stale-while-revalidate=\d+/.exec(hdrText)?.[0];
  const directive = hdr && run ? wrapRun(hdr, run, 'swr-directive') : null;
  frame.append(slot('swr__head', [slot('swr__hdr', hdr ? [hdr] : []), slot('swr__demo', headEls.slice(1))]));

  // controls
  const [sliderP, toggleP] = first(controls);
  const ageEl = sliderP?.querySelector('strong, b');
  const tickEls = first(ticks);
  const END = seconds(tickEls[tickEls.length - 1]?.textContent || '', MAX_AGE + SWR + 600);
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = String(END);
  range.step = String(STEP);
  range.value = String(seconds(ageEl?.textContent || '', 480));
  const slider = document.createElement('label');
  slider.className = 'swr__slider';
  slider.append(...(sliderP ? [sliderP] : []), range);
  const on = document.createElement('input');
  on.type = 'checkbox';
  on.checked = true;
  const toggle = document.createElement('label');
  toggle.className = 'swr__toggle';
  toggle.append(on, ...(toggleP ? [toggleP] : []));
  frame.append(slot('swr__controls', [slider, toggle]));

  // track and ticks
  const track = slot('swr__track');
  track.setAttribute('aria-hidden', 'true');
  track.style.gridTemplateColumns = `${MAX_AGE}fr ${SWR}fr ${Math.max(END - MAX_AGE - SWR, 1)}fr`;
  const zoneEls = first(zones);
  ['fresh', 'stale', 'old'].forEach((k, i) => {
    const p = zoneEls[i];
    track.append(slot(`swr__zone swr__zone--${k}`, p ? [p] : []));
  });
  const marker = document.createElement('span');
  marker.className = 'swr__marker';
  track.append(marker);
  const tickBox = slot('swr__ticks');
  tickBox.setAttribute('aria-hidden', 'true');
  [0, MAX_AGE, MAX_AGE + SWR, END].forEach((t, i) => {
    if (!tickEls[i]) return;
    const tick = slot('swr-tick', [tickEls[i]]);
    tick.style.left = `${(t / END) * 100}%`;
    tickBox.append(tick);
  });
  frame.append(track, tickBox);

  // cases
  const caseBox = slot('swr__cases', cases ? [...cases[0].children] : []);
  frame.append(caseBox);

  // lanes
  const [waitP, fetchP] = first(lanes);
  const lane = (p, kind) => {
    const fill = document.createElement('span');
    fill.className = `swr__fill swr__fill--${kind}`;
    const bar = document.createElement('span');
    bar.className = 'swr__bar';
    bar.append(fill);
    const ms = document.createElement('span');
    ms.className = 'swr__ms';
    return {
      el: slot('swr__lane', [slot('swr__who', p ? [p] : []), bar, ms]), fill, ms,
    };
  };
  const waitLane = lane(waitP, 'wait');
  const fetchLane = lane(fetchP, 'fetch');
  frame.append(slot('swr__lanes', [waitLane.el, fetchLane.el]));

  // verdicts
  const out = slot('swr__out');
  out.setAttribute('aria-live', 'polite');
  const verdicts = {};
  const outEls = first(outs);
  ['fresh', 'stale', 'old', 'off'].forEach((k, i) => {
    const p = outEls[i];
    if (!p) return;
    const age = wrapRun(p, '{age}', 'swr-age');
    verdicts[k] = { el: slot('swr-verdict', [p]), age };
    out.append(verdicts[k].el);
  });
  frame.append(out);

  if (cap) {
    const figcaption = document.createElement('figcaption');
    figcaption.append(...cap[0].children);
    frame.append(figcaption);
  }

  const classify = (age, swrOn) => {
    if (age <= MAX_AGE) return 'fresh';
    if (swrOn && age <= MAX_AGE + SWR) return 'stale';
    return 'old';
  };
  const render = () => {
    const age = Number(range.value);
    const kind = classify(age, on.checked);
    frame.classList.toggle('is-off', !on.checked);
    directive?.classList.toggle('off', !on.checked);
    marker.style.left = `${(age / END) * 100}%`;
    if (ageEl) ageEl.textContent = fmt(age);
    caseBox.dataset.case = String(['fresh', 'stale', 'old'].indexOf(kind) + 1);
    const w = { fresh: 0, stale: 0, old: ORIGIN }[kind];
    const f = { fresh: 0, stale: ORIGIN, old: ORIGIN }[kind];
    waitLane.fill.style.width = `${(w / 1.25) * 100}%`;
    fetchLane.fill.style.width = `${(f / 1.25) * 100}%`;
    waitLane.ms.textContent = w ? `${w} s` : 'none';
    fetchLane.ms.textContent = f ? `${f} s` : 'none';
    const v = kind === 'old' && !on.checked ? 'off' : kind;
    Object.entries(verdicts).forEach(([k, d]) => d.el.classList.toggle('is-on', k === v));
    if (verdicts[v]?.age) verdicts[v].age.textContent = fmt(age);
  };
  range.addEventListener('input', render);
  on.addEventListener('change', render);
  render();
  block.replaceChildren(frame);
}
