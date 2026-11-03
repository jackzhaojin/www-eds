/**
 * Scene engine `agenda`: the Sites and AI webinar deck, the agenda slide (a row of three plate
 * cards, `style | plates`). One engine draws all three stages; which one a card shows comes
 * from its place among the section's agenda scenes (first research, then authoring, then
 * evaluation), and a strip of three dots under each plate marks where it sits in the day.
 *
 * What each shows (the deck's actor marks: you an ink ring, AI the accent):
 * - research: three sources (docs, a post, a thread) sending what matters into one brief, whose
 *   sections fill in turn; you tick the brief.
 * - authoring: the brief's lines flowing into a page built from blocks (a hero, two columns, a
 *   table), each block filling in turn while its outline stays; you tick the page.
 * - evaluation: the page and the brief's questions side by side, joined where they match; one
 *   question has no match and is flagged, then a new section answers it, and every question
 *   gets its tick.
 *
 * Story (plays once from t = 0, then holds): the cards draw on; the stage's work happens in
 * the accent and settles to ink; the tick lands. Then it holds: the wash breathes and the
 * strip's dot for this stage breathes. Reduced motion shows the held end.
 *
 * Parts (rows), each above its object on a short leader:
 * - research: `sources` (left), `brief` (right).
 * - authoring: `brief` (left), `page` (right).
 * - evaluation: `page` (left), `brief` (right).
 */
const STILL = 7.2;
const STRIP = { y: 452, xs: [210, 250, 290] };

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
// the motion grammar's curves, as close polynomials of the cubic-beziers they name
const ARRIVE = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // (0.16, 1, 0.3, 1)
const TRAVEL = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2); // (0.65, 0, 0.35, 1)
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const pulse = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));
const f2 = (v) => v.toFixed(2);
/** A point on a cubic Bezier [x0, y0, x1, y1, x2, y2, x3, y3] at u. */
function bez(c, u) {
  const v = 1 - u;
  const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [0, 1].map((o) => w.reduce((sum, k, i) => sum + k * c[i * 2 + o], 0));
}
/** A rounded rectangle's outline, clockwise from its top left corner. */
function box(x, y, w, h, r = 4) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}`
    + `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}`
    + `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}
/** A flow from (x0, y0) to (x1, y1), leaving and arriving level. */
const flow = (x0, y0, x1, y1) => [x0, y0, x0 + (x1 - x0) * 0.5, y0, x1 - (x1 - x0) * 0.5, y1, x1,
  y1];
const tickAt = (x, y) => `M${x - 5} ${y}l3.5 4l7 -8.5`;

/*
 * Each stage: strokes [d, class, start, duration, fresh] (fresh: drawn in the accent, settling
 * to ink), dots [route, start, duration] (the accent carrying work across), the ring [x, y]
 * and its tick's time, labels [part, pin x, pin y, label y], and the wash's center.
 */
function research() {
  const strokes = [];
  const dots = [];
  const sources = [108, 192, 276];
  sources.forEach((y, i) => {
    strokes.push([box(64, y, 104, 62), 's', 0.1 + i * 0.08, 0.6]);
    strokes.push([`M78 ${y + 18}H140`, 'title', 0.3 + i * 0.08, 0.5]);
    strokes.push([`M78 ${y + 32}H154M78 ${y + 44}H130`, 'i', 0.35 + i * 0.08, 0.5]);
  });
  strokes.push([box(300, 128, 136, 208), 's', 0.4, 0.7]);
  strokes.push(['M316 152H404', 'title', 2.0, 0.5, true]);
  [182, 226, 270, 306].forEach((y, i) => {
    const t0 = 2.5 + i * 0.55;
    strokes.push([`M316 ${y}h0.1M326 ${y}H${410 - (i % 2) * 22}`, 'i', t0, 0.45, true]);
    strokes.push([`M326 ${y + 12}H${384 + (i % 2) * 16}`, 'i', t0 + 0.12, 0.45, true]);
  });
  [0, 1, 2, 0, 1, 2].forEach((s, j) => {
    const y0 = sources[s] + 31;
    dots.push([flow(170, y0, 298, 176 + j * 24), 1.0 + j * 0.42, 0.85]);
  });
  return {
    strokes,
    dots,
    ring: [452, 128],
    tick: 4.9,
    labels: [['sources', 116, 108, 76], ['brief', 368, 128, 96]],
    wash: [368, 232],
  };
}

function authoring() {
  const strokes = [];
  const dots = [];
  strokes.push([box(58, 156, 112, 160), 's', 0.1, 0.6]);
  strokes.push(['M72 178H138', 'title', 0.3, 0.5]);
  [204, 224, 244, 264, 284].forEach((y, i) => strokes.push([`M72 ${y}H${150 - (i % 3) * 14}`, 'i', 0.35 + i * 0.05, 0.5]));
  strokes.push([box(262, 104, 184, 252), 's', 0.4, 0.7]);
  // the blocks: dashed outlines that stay, filling in turn
  const blocks = [[276, 118, 156, 56], [276, 186, 74, 64], [358, 186, 74, 64], [276, 262, 156, 80]];
  blocks.forEach(([x, y, w, h], i) => strokes.push([box(x, y, w, h, 3), 'c dash', 0.5 + i * 0.08, 0.6]));
  strokes.push(['M290 138H392', 'title', 1.75, 0.5, true]);
  strokes.push(['M290 156H364', 'i', 1.85, 0.45, true]);
  [[290, 2.45], [372, 2.95]].forEach(([x, t0]) => strokes.push([`M${x} 204H${x + 46}M${x} 218H${x + 40}M${x} 232H${x + 30}`, 'i', t0, 0.5, true]));
  strokes.push(['M276 288H432M276 314H432M354 262V342', 'i', 3.55, 0.6, true]);
  dots.push([flow(170, 178, 274, 146), 1.05, 0.75]);
  dots.push([flow(170, 224, 274, 210), 1.75, 0.75]);
  dots.push([flow(170, 244, 356, 218), 2.25, 0.75]);
  dots.push([flow(170, 284, 274, 300), 2.85, 0.75]);
  return {
    strokes,
    dots,
    ring: [462, 104],
    tick: 4.6,
    labels: [['brief', 114, 156, 124], ['page', 354, 104, 72]],
    wash: [354, 230],
  };
}

function evaluation() {
  const strokes = [];
  const dots = [];
  const sections = [146, 196, 246, 296]; // the page's sections; the last is the fix
  strokes.push([box(56, 116, 156, 232), 's', 0.1, 0.7]);
  sections.forEach((y, i) => {
    const fix = i === 3;
    strokes.push([`M70 ${y}H${168 - (i % 2) * 20}`, 'title', fix ? 4.1 : 0.3 + i * 0.06, 0.5, fix]);
    strokes.push([`M70 ${y + 14}H${190 - (i % 2) * 24}M70 ${y + 26}H${150 + (i % 2) * 10}`, 'i', fix ? 4.2 : 0.35 + i * 0.06, 0.5, fix]);
  });
  strokes.push([box(300, 136, 144, 188), 's', 0.4, 0.7]);
  const questions = [168, 208, 248, 288];
  questions.forEach((y, i) => {
    strokes.push([`M321 ${y}A5 5 0 1 0 311 ${y}A5 5 0 1 0 321 ${y}`, 's', 0.5 + i * 0.06, 0.5]);
    strokes.push([`M330 ${y}H${414 - (i % 2) * 20}`, 'i', 0.55 + i * 0.06, 0.5]);
  });
  // the matches: question to section, in turn; question 3 waits for the fix
  const pairs = [[0, 0, 1.3], [1, 1, 1.85], [3, 2, 2.4], [2, 3, 4.6]];
  pairs.forEach(([q, s, t0]) => {
    strokes.push([`M298 ${questions[q]}C256 ${questions[q]} 252 ${sections[s] + 10} 214 ${sections[s] + 10}`, 'link', t0, 0.5, true]);
    strokes.push([tickAt(432, questions[q]), 'tick', t0 + 0.45, 0.3]);
  });
  dots.push([flow(298, questions[2], 214, sections[3] + 10), 3.55, 0.6]);
  return {
    strokes,
    dots,
    flag: [316, questions[2], 2.95],
    ring: [470, 136],
    tick: 5.2,
    labels: [['page', 134, 116, 84], ['brief', 372, 136, 104]],
    wash: [250, 232],
  };
}

const STAGES = [research, authoring, evaluation];

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const siblings = [...(block.closest('.section')?.querySelectorAll('.scene.agenda') || [block])];
  const index = Math.min(2, Math.max(0, siblings.indexOf(block)));
  const plan = STAGES[index]();

  const id = `agenda-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'agenda-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'agenda-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'agenda-wash-stop is-end' }, grad);
  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const front = svg('g', {}, root);

  const wash = svg('circle', {
    cx: plan.wash[0], cy: plan.wash[1], r: 200, fill: `url(#${id}-wash)`,
  }, back);

  const strokes = plan.strokes.map(([d, cls, t0, dur, fresh]) => ({
    el: svg('path', {
      d, class: `agenda-${cls.split(' ').join(' agenda-')}${fresh ? ' agenda-fresh' : ''}`, pathLength: 1,
    }, mech),
    t0,
    dur,
    fresh,
  }));
  const dots = plan.dots.map(([route, t0, dur]) => ({
    el: svg('circle', { r: 4.5, class: 'agenda-dot' }, front), route, t0, dur,
  }));
  const flag = plan.flag && svg('circle', {
    cx: plan.flag[0], cy: plan.flag[1], r: 9, class: 'agenda-flag',
  }, front);
  const ring = svg('circle', {
    cx: plan.ring[0], cy: plan.ring[1], r: 8, class: 'agenda-ring',
  }, front);
  const tick = svg('path', { d: tickAt(plan.ring[0], plan.ring[1]), class: 'agenda-tick-mark', pathLength: 1 }, front);

  // where this stage sits in the day: three dots on a line, this one in the accent
  const strip = svg('g', { class: 'agenda-strip' }, back);
  svg('path', { d: `M${STRIP.xs[0]} ${STRIP.y}H${STRIP.xs[2]}`, class: 'agenda-c' }, strip);
  const marks = STRIP.xs.map((x, i) => svg('circle', {
    cx: x, cy: STRIP.y, r: i === index ? 5.5 : 3.5, class: i === index ? 'agenda-here' : 'agenda-stop',
  }, strip));

  const leaders = [];
  plan.labels.forEach(([part, px, py, ly]) => {
    if (!place(part, px, ly, 500, 'center')) return;
    leaders.push(svg('path', { d: `M${px} ${py}V${py - 14}`, class: 'agenda-leader', pathLength: 1 }, mech));
    leaders.push(svg('circle', {
      cx: px, cy: py, r: 1.8, class: 'agenda-pin',
    }, mech));
  });

  stage.append(root);
  new ResizeObserver(([entry]) => {
    if (entry.contentRect.width) root.style.setProperty('--k', (500 / entry.contentRect.width).toFixed(4));
  }).observe(stage);
  const ptr = pointer(stage);

  const set = (el, prop, v) => {
    const s = typeof v === 'number' ? v.toFixed(3) : v;
    if (el[`_${prop}`] !== s) {
      el[`_${prop}`] = s;
      if (['transform', 'cx', 'cy', 'r'].includes(prop)) el.setAttribute(prop, s);
      else el.style.setProperty(prop, s);
    }
  };
  const dash = (el, p) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.001 ? 1 : 0);
  };

  function render(t, dt) {
    ptr.update(dt);
    const s = reduceMotion() ? STILL : t;

    strokes.forEach(({
      el, t0, dur, fresh,
    }) => {
      const p = ARRIVE(span(s, t0, dur));
      if (el.classList.contains('agenda-dash')) set(el, 'opacity', p);
      else dash(el, p);
      if (fresh) set(el, '--f', 1 - span(s, t0 + dur + 0.3, 0.9));
    });
    dots.forEach(({
      el, route, t0, dur,
    }) => {
      const u = span(s, t0, dur);
      const [x, y] = bez(route, TRAVEL(u));
      set(el, 'cx', f2(x));
      set(el, 'cy', f2(y));
      set(el, 'opacity', u > 0 && u < 1 ? Math.min(1, u * 6, (1 - u) * 6) : 0);
    });
    if (flag) {
      const [, , t0] = plan.flag;
      set(flag, 'r', 9 + 3 * pulse(s, t0, 0.5));
      set(flag, 'opacity', clamp(span(s, t0, 0.25)) * (1 - span(s, 4.9, 0.6)));
    }
    set(ring, 'opacity', ARRIVE(span(s, plan.tick - 0.5, 0.4)));
    set(ring, 'r', 8 + 1.5 * pulse(s, plan.tick, 0.26));
    dash(tick, ARRIVE(span(s, plan.tick + 0.08, 0.3)));
    leaders.forEach((el) => set(el, 'opacity', ARRIVE(span(s, 0.5, 0.6))));
    set(strip, 'opacity', ARRIVE(span(s, 0.2, 0.8)));
    set(marks[index], 'r', 5.5 + 0.4 * breath(t, 3.7));

    // ambient: the wash breathes about 2% and drifts; on hover the back plane leans 4px
    set(wash, 'opacity', (0.5 + 0.5 * ARRIVE(span(s, 1, 2))) * (0.98 + 0.02 * breath(t, 17)));
    set(wash, 'cx', plan.wash[0] + 6 * Math.sin((2 * Math.PI * t) / 23));
    set(back, 'transform', `translate(${f2(ptr.x * 4)} ${f2(ptr.y * 4)})`);
  }

  loop(stage, render, { still: STILL });
}
