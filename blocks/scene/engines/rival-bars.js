/**
 * Scene engine `rival-bars`: the webinar deck's stage 03 offer card "How do you stack up?"
 * (evaluating a page before it goes live, against the pages it competes with).
 *
 * What it shows: the same five checks run on your page and on three competing pages, as a
 * grouped bar chart on a ruled ground. The AI (the accent disc) steps along the top rule, its
 * reading line down through one group at a time: your bar (the accent) comes up first and the
 * three competitors' bars (faint ink) follow. Wherever the best competitor is ahead of you, an
 * accent bracket measures the difference at the top: a dimension line from your bar's top up
 * to theirs, a dotted guide across from their bar, the missing part of your bar tinted. You lead
 * on two checks and trail on three; the three brackets are the to-do list.
 *
 * Story (played once from t = 0): construction draws on 0 to 0.8 s (ground, rules, legend); the
 * groups grow in turn from 0.9 s, 0.85 s apart, each bracket drawing as its group settles; the
 * disc steps off the end of the rule and its line fades; settled by about 6.2 s. Then it holds:
 * the wash and the disc's halo breathe, the brackets' guides drift slowly. Reduced motion shows
 * that end state.
 *
 * Parts (rows), a legend over the chart's top left, each label after its swatch (no box):
 * - `yours`: after an accent bar swatch.
 * - `theirs`: after a swatch of three faint bars.
 */
const W = 500;
const BASE = 400; // the baseline
const H = 282; // a full bar
const X0 = 58; // the chart's left and right
const X1 = 444;
const BAR = 12;
const GAP = 3;
const GROUP = 4 * BAR + 3 * GAP;
const PITCH = GROUP + (X1 - X0 - 5 * GROUP) / 4;
const LEGEND_Y = 64;
/* each check: your score, then the three competitors' (0..1 of a full bar) */
const DATA = [
  [0.7, 0.52, 0.61, 0.45],
  [0.44, 0.66, 0.5, 0.82],
  [0.86, 0.64, 0.73, 0.57],
  [0.4, 0.55, 0.71, 0.47],
  [0.6, 0.56, 0.48, 0.76],
];
const START = 0.9;
const STEP = 0.85;
const GROW = 0.62;
const STAGGER = 0.12;
const STILL = 11;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);

/** A cubic-bezier easing as a function of t (bisection on x). */
function bezier(x1, y1, x2, y2) {
  const at = (s, a, b) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 18; i += 1) {
      const mid = (lo + hi) / 2;
      if (at(mid, x1, x2) < t) lo = mid;
      else hi = mid;
    }
    return at((lo + hi) / 2, y1, y2);
  };
}
const arrive = bezier(0.16, 1, 0.3, 1);
const travel = bezier(0.65, 0, 0.35, 1);
const snap = bezier(0.34, 1.56, 0.64, 1);
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const f2 = (v) => v.toFixed(2);

export default function engine(block, kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `rival-bars-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'rival-bars-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'rival-bars-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'rival-bars-wash-stop' }, grad);

  const intro = []; // [element, kind, delay]: 'draw' by dash, 'fade' by opacity
  const add = (name, attrs, parent, kind, delay) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind, delay]);
    return el;
  };
  const wash = svg('circle', {
    cx: 250, cy: BASE - H * 0.55, r: 220, fill: `url(#${id}-wash)`,
  }, root);

  // construction: quarter rules across the chart, the baseline, a tick under each group
  [0.25, 0.5, 0.75, 1].forEach((f, i) => {
    add('path', { d: `M${X0 - 8} ${BASE - H * f}H${X1 + 8}`, class: 'rival-bars-rule', pathLength: 1 }, root, 'draw', 0.05 + i * 0.06);
  });
  const groupX = (g) => X0 + PITCH * g;
  const barX = (g, j) => groupX(g) + j * (BAR + GAP);
  add('path', { d: `M${X0 - 8} ${BASE}H${X1 + 8}`, class: 'rival-bars-base', pathLength: 1 }, root, 'draw', 0);
  DATA.forEach((_, g) => {
    const cx = groupX(g) + GROUP / 2;
    add('path', { d: `M${cx} ${BASE + 5}V${BASE + 11}`, class: 'rival-bars-base' }, root, 'fade', 0.3 + g * 0.06);
  });

  // the bars: yours first in each group, then the three competitors
  const bars = svg('g', {}, root);
  const groups = DATA.map((scores, g) => {
    const rects = scores.map((s, j) => svg('rect', {
      x: barX(g, j), y: BASE, width: BAR, height: 0, rx: 2, class: j ? 'rival-bars-theirs' : 'rival-bars-yours',
    }, bars));
    const best = Math.max(...scores.slice(1));
    const ahead = best - scores[0];
    let bracket = null;
    if (ahead > 0) {
      const lead = 1 + scores.slice(1).indexOf(best);
      const yy = BASE - H * scores[0];
      const yb = BASE - H * best;
      const bx = barX(g, 0) - 6;
      bracket = {
        dim: svg('path', { d: `M${bx + 3.5} ${yy}H${bx}V${yb}H${bx + 3.5}`, class: 'rival-bars-dim', pathLength: 1 }, root),
        guide: svg('path', { d: `M${barX(g, lead) - 2} ${yb}H${bx + 6}`, class: 'rival-bars-guide' }, root),
        gap: svg('rect', {
          x: barX(g, 0), y: yb, width: BAR, height: yy - yb, rx: 2, class: 'rival-bars-gap',
        }, root),
      };
    }
    return { rects, bracket };
  });

  // the AI: its reading line down through a group, the disc and its halo on the top rule
  const top = BASE - H;
  const scan = svg('path', { d: `M0 ${top + 12}V${BASE - 2}`, class: 'rival-bars-scan' }, root);
  const halo = svg('circle', { cy: top, r: 12.5, class: 'rival-bars-halo' }, root);
  const disc = svg('circle', { cy: top, r: 6.2, class: 'rival-bars-disc' }, root);
  const center = (g) => groupX(g) + GROUP / 2;
  const END = START + STEP * 4 + 0.95; // the last group has settled
  /** The disc's x: at each group as it grows, stepping to the next, then off the rule's end. */
  const discX = (t) => {
    if (t < START) return center(0) - 24 * (1 - arrive(span(t, 0.45, START - 0.45)));
    if (t >= END) return center(4) + (X1 + 4 - center(4)) * travel(span(t, END, 0.6));
    const g = Math.min(4, Math.floor((t - START) / STEP));
    const from = START + STEP * g + 0.4;
    if (g === 4 || t < from) return center(g);
    return center(g) + PITCH * travel(span(t, from, START + STEP * (g + 1) - from));
  };

  // the legend: a swatch before each label, over the chart's top left
  const legend = svg('g', {}, root);
  const yours = place('yours', X0 + 16, LEGEND_Y, W, 'left');
  if (yours) {
    add('rect', {
      x: X0, y: LEGEND_Y - 8, width: 8, height: 16, rx: 1.5, class: 'rival-bars-yours',
    }, legend, 'fade', 0.4);
  }
  const theirsX = X0 + 108;
  if (place('theirs', theirsX + 30, LEGEND_Y, W, 'left')) {
    [11, 16, 13].forEach((h, j) => {
      add('rect', {
        x: theirsX + j * 7.5, y: LEGEND_Y + 8 - h, width: 5.5, height: h, rx: 1.2, class: 'rival-bars-theirs',
      }, legend, 'fade', 0.45 + j * 0.05);
    });
  }

  stage.append(root);
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (w) root.style.setProperty('--k', (W / w).toFixed(3));
  }).observe(stage);

  const set = (el, prop, v) => {
    if (el[`_${prop}`] !== v) {
      el[`_${prop}`] = v;
      el.style.setProperty(prop, v);
    }
  };
  const attr = (el, name, v) => {
    if (el[`_${name}`] !== v) {
      el[`_${name}`] = v;
      el.setAttribute(name, v);
    }
  };
  /* a partial stroke of a pathLength="1" path; hidden at 0, where round caps leave a dot */
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };

  function draw(t) {
    intro.forEach(([el, kind, delay]) => {
      const p = arrive(span(t, delay, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });

    groups.forEach(({ rects, bracket }, g) => {
      const t0 = START + STEP * g;
      rects.forEach((rect, j) => {
        const h = H * DATA[g][j] * arrive(span(t, t0 + (j ? 0.18 + STAGGER * j : 0), GROW));
        attr(rect, 'y', f2(BASE - h));
        attr(rect, 'height', f2(h));
      });
      if (!bracket) return;
      // the measure: the guide comes across from their bar, the bracket snaps up to it
      const at = t0 + 0.18 + STAGGER * 3 + GROW * 0.8;
      const across = arrive(span(t, at, 0.4));
      set(bracket.guide, 'opacity', (across * 0.9).toFixed(3));
      set(bracket.guide, 'stroke-dashoffset', f2(-t * 1.2));
      dash(bracket.dim, snap(span(t, at + 0.2, 0.3)));
      set(bracket.gap, 'opacity', arrive(span(t, at + 0.3, 0.5)).toFixed(3));
    });

    const x = discX(t);
    attr(disc, 'cx', f2(x));
    attr(halo, 'cx', f2(x));
    const on = arrive(span(t, 0.45, 0.5));
    set(disc, 'opacity', on.toFixed(3));
    set(halo, 'opacity', on.toFixed(3));
    attr(halo, 'r', f2(12.5 + 1.5 * breath(t, 3.1) * span(t, END + 0.6, 1)));
    attr(scan, 'transform', `translate(${f2(x)} 0)`);
    set(scan, 'opacity', (on * (1 - span(t, END, 0.5))).toFixed(3));

    // ambient: the wash breathes (2%) over 17 s
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
  }

  loop(stage, draw, { still: STILL });
}
