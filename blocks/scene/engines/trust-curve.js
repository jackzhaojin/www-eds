/**
 * Scene engine `trust-curve`: the Sites and AI webinar deck, the slide before "Start small,
 * build trust, then go further" (beside its heading, `style | moment`). The idea is Lauren Tan's
 * (@poteto): trust on one axis, how much you hand to agents on the other, and the curve that
 * says you earn the second with the first. This plate is drawn for the deck, not copied.
 *
 * What it shows: trust (the vertical axis) against how much you hand to AI (the horizontal
 * one). The curve climbs steeply at first and then flattens. At three marks along it, Start
 * here, Build trust and Go further, a dotted line rises to the curve and AI's discs appear on
 * the ground: one, then three, then nine.
 *
 * Story (plays once from t = 0, then holds): the axes draw on; the curve draws from the origin
 * with an accent head; as the head passes each mark, its dotted line rises, its discs land and
 * its label lights; the curve settles to its end. Then it holds: the head breathes, the wash
 * breathes and drifts. Reduced motion shows the held end.
 *
 * Parts (rows):
 * - `trust`: above the vertical axis's arrow.
 * - `axis`: under the horizontal axis, centered.
 * - `start`, `build`, `further`: under the horizontal axis at their marks.
 */
const O = [84, 410]; // the origin
const TOP = 76;
const RIGHT = 452;
const X1 = 436; // where the curve ends
const MARKS = [
  { part: 'start', x: 134, n: 1 },
  { part: 'build', x: 268, n: 3 },
  { part: 'further', x: 402, n: 9 },
];
const DRAW = [1.0, 5.0]; // the curve's head travels
const STILL = 6.6;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
// the motion grammar's curves, as close polynomials of the cubic-beziers they name
const ARRIVE = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // (0.16, 1, 0.3, 1)
const TRAVEL = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2); // (0.65, 0, 0.35, 1)
const SNAP = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2; // (0.34, 1.56, 0.64, 1)
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const f2 = (v) => v.toFixed(2);

/** The curve's height at x: steep at first, then flattening. */
const curveY = (x) => O[1] - 296 * (1 - Math.exp((-3.1 * (x - O[0])) / (X1 - O[0])));
const SAMPLES = 64;
const CURVE = `M${O[0]} ${O[1]}${[...Array(SAMPLES).keys()].map((i) => {
  const x = O[0] + ((X1 - O[0]) * (i + 1)) / SAMPLES;
  return `L${f2(x)} ${f2(curveY(x))}`;
}).join('')}`;

/** The time the head reaches x, inverting TRAVEL by bisection (once, at load). */
function reach(x) {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 20; k += 1) {
    const mid = (lo + hi) / 2;
    if (O[0] + (X1 - O[0]) * TRAVEL(mid) < x) lo = mid; else hi = mid;
  }
  return DRAW[0] + (DRAW[1] - DRAW[0]) * lo;
}
const REACH = MARKS.map(({ x }) => reach(x));

/** The discs at a mark: n of them on the ground, in rows of three. */
function discs(x, n) {
  return [...Array(n).keys()].map((i) => {
    const row = Math.floor(i / 3);
    const inRow = Math.min(3, n - row * 3);
    const col = i % 3;
    return [x + (col - (inRow - 1) / 2) * 16, O[1] - 14 - row * 16];
  });
}

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const id = `trust-curve-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'trust-curve-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'trust-curve-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'trust-curve-wash-stop is-end' }, grad);
  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const front = svg('g', {}, root);

  const wash = svg('circle', {
    cx: 300, cy: 200, r: 220, fill: `url(#${id}-wash)`,
  }, back);
  const path = (parent, d, cls) => svg('path', { d, class: `trust-curve-${cls}`, pathLength: 1 }, parent);

  // the axes, with their arrows
  const axes = [
    path(back, `M${O[0]} ${O[1]}V${TOP}`, 's'),
    path(back, `M${O[0]} ${O[1]}H${RIGHT}`, 's'),
    path(back, `M${O[0] - 5} ${TOP + 8}L${O[0]} ${TOP}L${O[0] + 5} ${TOP + 8}`, 's'),
    path(back, `M${RIGHT - 8} ${O[1] - 5}L${RIGHT} ${O[1]}L${RIGHT - 8} ${O[1] + 5}`, 's'),
  ];

  // the marks: a dotted line up to the curve, AI's discs on the ground, a tick on the axis
  const marks = MARKS.map(({ x, n }) => ({
    guide: svg('path', { d: `M${x} ${O[1]}V${f2(curveY(x))}`, class: 'trust-curve-guide' }, mech),
    notch: path(mech, `M${x} ${O[1]}V${O[1] + 7}`, 's'),
    dots: discs(x, n).map(([cx, cy]) => svg('circle', {
      cx, cy, r: 5, class: 'trust-curve-disc',
    }, mech)),
    point: svg('circle', {
      cx: x, cy: f2(curveY(x)), r: 3.5, class: 'trust-curve-point',
    }, front),
  }));

  // the curve and its head
  const curve = path(front, CURVE, 'curve');
  const head = svg('circle', { r: 5.5, class: 'trust-curve-head' }, front);
  const halo = svg('circle', { r: 12, class: 'trust-curve-halo' }, front);

  // labels
  const labels = {};
  labels.trust = place('trust', O[0], TOP - 22, 500, 'center');
  labels.axis = place('axis', O[0] + 120, O[1] + 56, 500, 'center');
  MARKS.forEach(({ part, x }) => { labels[part] = place(part, x, O[1] + 26, 500, 'center'); });

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
    const still = reduceMotion();
    const s = still ? STILL : t;

    axes.forEach((el, i) => dash(el, ARRIVE(span(s, 0.1 + i * 0.12, 0.7))));

    // the head travels the curve; the drawn part follows it
    const u = TRAVEL(span(s, DRAW[0], DRAW[1] - DRAW[0]));
    const hx = O[0] + (X1 - O[0]) * u;
    const hy = curveY(hx);
    // the curve's length is not linear in x; the samples are even in x, so x stands in for it
    dash(curve, u);
    const live = s > DRAW[0] && s < DRAW[1] + 1.2;
    set(head, 'cx', f2(hx));
    set(head, 'cy', f2(hy));
    set(head, 'opacity', ARRIVE(span(s, DRAW[0] - 0.2, 0.4)));
    set(head, 'r', 5.5 + 0.5 * breath(t, 3.1) * (still ? 0 : 1));
    set(halo, 'cx', f2(hx));
    set(halo, 'cy', f2(hy));
    set(halo, 'opacity', ARRIVE(span(s, DRAW[0] - 0.2, 0.4)) * (live ? 1 : 0.6));

    // each mark wakes as the head passes it
    MARKS.forEach(({ part }, i) => {
      const {
        guide, notch, dots, point,
      } = marks[i];
      const t0 = REACH[i];
      const passed = s >= t0;
      dash(notch, ARRIVE(span(s, 0.5 + i * 0.1, 0.4)));
      set(guide, 'opacity', passed ? ARRIVE(span(s, t0, 0.5)) : 0);
      set(point, 'opacity', passed ? 1 : 0);
      set(point, 'r', 3.5 + 2 * SNAP(span(s, t0, 0.25)) - 2 * span(s, t0 + 0.25, 0.4));
      dots.forEach((d, j) => {
        const p = SNAP(span(s, t0 + 0.15 + j * 0.05, 0.24));
        set(d, 'r', 5 * Math.max(0, p));
        set(d, 'opacity', p > 0 ? 1 : 0);
      });
      labels[part]?.classList.toggle('is-active', passed && s < t0 + 1.4 && !still);
    });

    // ambient: the wash breathes about 2% and drifts; on hover the back plane leans 4px
    set(wash, 'opacity', (0.5 + 0.5 * ARRIVE(span(s, 2, 2))) * (0.98 + 0.02 * breath(t, 17)));
    set(wash, 'cx', 300 + 6 * Math.sin((2 * Math.PI * t) / 23));
    set(back, 'transform', `translate(${f2(ptr.x * 4)} ${f2(ptr.y * 4)})`);
  }

  loop(stage, render, { still: STILL });
}
