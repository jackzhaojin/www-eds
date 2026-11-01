/**
 * Scene engine `checklist-run`: the Sites and AI webinar deck, slide "03 - Start here: A
 * pre-publish checklist anyone can run" (a demo plate, on the left of a split slide).
 *
 * What it shows: your draft and its brief (the brief from slide 01) pasted into a chat with a
 * seven-line checklist; the assistant (the accent disc) answers each line, an ink tick for a
 * pass, an accent flag for a fix, then a verdict. It is the real run on Jack's article: lines
 * 1, 2 and 7 were fixes, 3 to 6 passed, and the verdict was "fix first", which comes back to
 * you (the ink ring) with its three fixes marked.
 *
 * Story (plays once from t = 0, then holds): the draft, the brief and the checklist draw on;
 * an accent copy of the draft, then of the brief, flies into the checklist's header and docks
 * there; the assistant pulses; a highlight runs down the seven lines and each gets its answer
 * as it passes; the verdict bar lights in the accent and its three fix flags pop in; your ring
 * answers. Then it holds: the caret after the verdict blinks, the wash breathes and drifts.
 * Reduced motion shows the held end.
 *
 * Parts (rows):
 * - `draft`: above the draft and brief, on a short leader to the draft.
 * - `checklist`: above the checklist, on a short leader.
 * - `verdict`: left of the verdict bar, on a short leader; it takes the accent once lit.
 */
const DRAFT = {
  x: 40, y: 84, w: 110, h: 152,
};
const BRIEF = {
  x: 40, y: 252, w: 110, h: 80,
};
const PANEL = {
  x: 196, y: 84, w: 264, h: 272,
};
const HEAD = 128; // the header's rule
const DISC = [222, 106];
const DOCK = 0.2; // a docked copy is its source at this scale
const DOCKS = [[410, 106], [438, 106]]; // the docked copies' centers
const ROWS = [150, 181, 212, 243, 274, 305, 336];
const FIX = [true, true, false, false, false, false, true]; // lines 1, 2 and 7
const ENDS = [410, 384, 420, 396, 376, 414, 392];
const MX = 222; // the answers' column
const VERDICT = {
  x: 214, y: 372, w: 228, h: 34,
};
const VY = VERDICT.y + VERDICT.h / 2;
const RING = [70, VY];
const PASTE = [1.05, 1.45];
const FLY = 0.9;
const THINK = 2.5;
const RUN = 2.9;
const STEP = 0.42;
const LIT = RUN + 7 * STEP + 0.25;
const STILL = 9;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
// the motion grammar's curves, as close polynomials of the cubic-beziers they name
const ARRIVE = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // (0.16, 1, 0.3, 1)
const TRAVEL = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2); // (0.65, 0, 0.35, 1)
const SNAP = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2; // (0.34, 1.56, 0.64, 1)
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const pulse = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));
const f2 = (v) => v.toFixed(2);
/** A point on a cubic Bezier [x0, y0, x1, y1, x2, y2, x3, y3] at u. */
function bez(c, u) {
  const v = 1 - u;
  const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [0, 1].map((o) => w.reduce((sum, k, i) => sum + k * c[i * 2 + o], 0));
}

/** A rounded rectangle's outline, from its top left corner, clockwise. */
function box({
  x, y, w, h,
}, r) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}`
    + `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}`
    + `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

/* the two sources on their own grids: [path, kind, key]; key marks fly with the copy */
const SOURCES = [
  [ // the draft: a title, a paragraph, an image, two more paragraphs
    ['M12 20H76', 'title', true],
    ['M12 34H96M12 44H90M12 54H60', 'i', true],
    ['M15 66H95Q98 66 98 69V95Q98 98 95 98H15Q12 98 12 95V69Q12 66 15 66Z', 'img', true],
    ['M12 112H94M12 122H84', 'i'],
    ['M12 136H96M12 146H58', 'i'],
  ],
  [ // the brief (from slide 01): a title over a list with ticks
    ['M12 17H74', 'title', true],
    ['M12 34l2.5 3l5 -6M12 49l2.5 3l5 -6M12 64l2.5 3l5 -6', 's'],
    ['M27 34H94M27 49H84M27 64H96', 'i', true],
  ],
];

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const id = `checklist-run-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'checklist-run-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'checklist-run-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'checklist-run-wash-stop is-end' }, grad);

  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const front = svg('g', {}, root);
  const intro = []; // [element, 'draw' | 'fade'], in drawing order
  const add = (name, attrs, parent, kind) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };
  const path = (parent, d, kind, introKind, extra = {}) => add('path', {
    d, class: `checklist-run-${kind || 'i'}`, ...extra,
  }, parent, introKind);

  const wash = svg('circle', {
    cx: 320, cy: 250, r: 230, fill: `url(#${id}-wash)`,
  }, back);

  // the sources, a copy of each for its flight, and its docked chip in the header
  const boxes = [DRAFT, BRIEF];
  const drawSource = (parent, k, keyOnly, introKind) => {
    const { w, h } = boxes[k];
    path(parent, box({
      x: 0, y: 0, w, h,
    }, 3), 's', introKind && 'draw', introKind ? { pathLength: 1 } : {});
    SOURCES[k].forEach(([d, kind, key]) => {
      if (!keyOnly || key) path(parent, d, kind, introKind && 'fade');
    });
  };
  const sources = boxes.map((b, k) => {
    const g = svg('g', { transform: `translate(${b.x} ${b.y})` }, mech);
    drawSource(g, k, false, true);
    return g;
  });
  const routes = boxes.map((b, k) => {
    const [x0, y0] = [b.x + b.w / 2, b.y + b.h / 2];
    const [x1, y1] = DOCKS[k];
    return [x0, y0, x0 + 110, y0 - 10, x1 - 90, y1 - 40, x1, y1];
  });

  // the checklist: its frame, the header (the assistant, the docks), seven lines, their answers
  path(mech, box(PANEL, 10), 's', 'draw', { pathLength: 1 });
  path(mech, `M${PANEL.x + 1} ${HEAD}H${PANEL.x + PANEL.w - 1}`, 'c', 'draw', { pathLength: 1 });
  path(mech, `M${DISC[0] + 16} ${DISC[1]}H${DISC[0] + 66}`, 'c', 'fade');
  DOCKS.forEach(([x, y], k) => {
    const [w, h] = [boxes[k].w * DOCK + 6, boxes[k].h * DOCK + 6];
    path(mech, box({
      x: x - w / 2, y: y - h / 2, w, h,
    }, 3), 'c checklist-run-dash', 'fade');
  });
  const halo = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 12, class: 'checklist-run-halo',
  }, mech, 'fade');
  const ripple = svg('circle', {
    cx: DISC[0], cy: DISC[1], r: 12, class: 'checklist-run-ripple',
  }, mech);
  const disc = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 7.5, class: 'checklist-run-disc',
  }, mech, 'fade');
  const docked = DOCKS.map(([x, y], k) => {
    const g = svg('g', {
      class: 'checklist-run-dock',
      transform: `translate(${f2(x - (boxes[k].w * DOCK) / 2)} ${f2(y - (boxes[k].h * DOCK) / 2)}) scale(${DOCK})`,
      style: `--s: ${DOCK}`,
    }, mech);
    drawSource(g, k, true);
    return g;
  });
  const scan = svg('rect', {
    x: PANEL.x + 10, y: -12, width: PANEL.w - 20, height: 24, rx: 5, class: 'checklist-run-scan',
  }, mech);
  const rows = ROWS.map((y, i) => {
    path(mech, `M${MX + 18} ${y}H${ENDS[i]}`, 'i', 'fade');
    const pend = path(mech, `M${MX - 5} ${y}A5 5 0 1 0 ${MX + 5} ${y}A5 5 0 1 0 ${MX - 5} ${y}`, 'c');
    const mark = svg('g', { class: FIX[i] ? 'checklist-run-flag' : 'checklist-run-pass' }, mech);
    if (FIX[i]) {
      svg('path', { d: 'M-4 -7.5H5L2.5 -4L5 -0.5H-4Z', class: 'checklist-run-pennant' }, mark);
      svg('path', { d: 'M-4 -7.5V8' }, mark);
    } else svg('path', { d: 'M-5 0.5L-1.5 4L5.5 -4.5' }, mark);
    return { y, pend, mark };
  });

  // the verdict: a bar under the checklist, its line, three fix flags, the caret after it
  const vbar = svg('g', { class: 'checklist-run-verdict' }, mech);
  path(vbar, box(VERDICT, VERDICT.h / 2), 'vbox', 'fade');
  const vline = path(vbar, `M${VERDICT.x + 20} ${VY}H${VERDICT.x + 92}`, 'vline', null, { pathLength: 1 });
  const vflags = [0, 1, 2].map((i) => {
    const g = svg('g', { class: 'checklist-run-flag' }, vbar);
    svg('path', { d: 'M-3 -5.5H4L2 -3L4 -0.5H-3Z', class: 'checklist-run-pennant' }, g);
    svg('path', { d: 'M-3 -5.5V6' }, g);
    return { g, x: VERDICT.x + VERDICT.w - 70 + 20 * i };
  });
  const caret = svg('path', { d: `M${VERDICT.x + 102} ${VY - 7}V${VY + 7}`, class: 'checklist-run-caret' }, vbar);

  // you: the ink ring, beside the verdict that comes back to you
  const ring = add('circle', {
    cx: RING[0], cy: RING[1], r: 8, class: 'checklist-run-ring',
  }, mech, 'fade');

  // the copies in flight: each source's key marks, in the accent
  const copies = boxes.map((b, k) => {
    const g = svg('g', { class: 'checklist-run-copy' }, front);
    drawSource(g, k, true);
    return g;
  });

  // leaders and labels: [part, pin x, pin y, end x, end y, label x, label y, align]
  const callouts = [
    ['draft', DRAFT.x + 20, DRAFT.y, DRAFT.x + 20, 70, DRAFT.x, 52, 'left'],
    ['checklist', 328, PANEL.y, 328, 70, 328, 52, 'center'],
    ['verdict', VERDICT.x, VY, VERDICT.x - 8, VY, VERDICT.x - 14, VY, 'right'],
  ];
  const labels = {};
  callouts.forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    const label = place(part, lx, ly, 500, align);
    if (!label) return;
    labels[part] = label;
    path(mech, `M${px} ${py}L${ex} ${ey}`, 'leader', 'draw', { pathLength: 1 });
    add('circle', {
      cx: px, cy: py, r: 1.8, class: 'checklist-run-pin',
    }, mech, 'fade');
  });

  stage.append(root);
  let kpx = 1; // viewBox units per CSS pixel
  new ResizeObserver(([entry]) => {
    if (!entry.contentRect.width) return;
    kpx = 500 / entry.contentRect.width;
    root.style.setProperty('--k', kpx.toFixed(4));
  }).observe(stage);
  const ptr = pointer(stage);

  const set = (el, prop, v) => {
    const s = typeof v === 'number' ? v.toFixed(3) : v;
    if (el[`_${prop}`] !== s) {
      el[`_${prop}`] = s;
      if (prop === 'transform' || prop === 'cx' || prop === 'cy' || prop === 'r' || prop === 'y') el.setAttribute(prop, s);
      else el.style.setProperty(prop, s);
    }
  };
  /* a partial stroke, 0..1 of a pathLength="1" path; hidden at 0, where round caps leave a dot */
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.001 && o > 0.001 ? o : 0);
  };
  const active = (part, on) => labels[part]?.classList.toggle('is-active', on);

  function render(t, dt) {
    ptr.update(dt);
    const still = reduceMotion();
    const s = still ? STILL : t;

    // construction draws on in about a second
    const n = intro.length;
    intro.forEach(([el, kind], i) => {
      const p = ARRIVE(span(s, (0.45 * i) / n, 0.6));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p);
    });

    // the pastes: a copy of the draft, then of the brief, flies into the header and docks
    boxes.forEach((b, k) => {
      const t0 = PASTE[k];
      const u = span(s, t0, FLY);
      const land = t0 + FLY;
      const [px, py] = bez(routes[k], TRAVEL(u));
      const sc = 1 + (DOCK - 1) * TRAVEL(u);
      const g = copies[k];
      set(g, 'transform', `translate(${f2(px - (b.w * sc) / 2)} ${f2(py - (b.h * sc) / 2)}) scale(${sc.toFixed(4)})`);
      set(g, '--s', sc);
      set(g, 'opacity', s < t0 || s > land + 0.12 ? 0 : clamp(Math.min(u / 0.12, 1 - (s - land) / 0.12)));
      set(sources[k], 'transform', `translate(${b.x} ${f2(b.y - 3 * pulse(s, t0 - 0.05, 0.3))})`);
      set(docked[k], 'opacity', clamp(4 * SNAP(span(s, land - 0.04, 0.24))));
      set(docked[k], '--f', 1 - span(s, land + 0.2, 0.9));
    });
    active('draft', s >= PASTE[0] && s < PASTE[1] + FLY + 0.4);

    // the assistant pulses, then a highlight runs down the lines, answering each as it passes
    const u = span(s, THINK, 0.8);
    set(ripple, 'r', 9 + 22 * ARRIVE(u));
    set(ripple, 'opacity', u > 0 && u < 1 ? 0.55 * (1 - u) : 0);
    set(disc, 'r', 7.5 + 1.6 * (pulse(s, THINK, 0.3) + pulse(s, LIT - 0.1, 0.3)));
    set(halo, 'r', 12 + 2.5 * breath(t, 4.7) * (still ? 0 : 1));
    const at = (s - RUN) / STEP; // the run's place, in lines
    const i0 = Math.max(0, Math.min(6, Math.floor(at)));
    // the highlight rests on a line, then glides to the next over the last 45% of its step
    const glide = i0 < 6 ? TRAVEL(clamp((at - i0 - 0.55) / 0.45)) : 0;
    set(scan, 'y', f2(ROWS[i0] + (i0 < 6 ? (ROWS[i0 + 1] - ROWS[i0]) * glide : 0) - 12));
    set(scan, 'opacity', s < RUN ? 0 : ARRIVE(span(s, RUN, 0.25)) * (1 - span(s, RUN + 7 * STEP, 0.4)));
    rows.forEach(({ y, pend, mark }, i) => {
      const a = SNAP(span(s, RUN + i * STEP + 0.22, 0.24));
      set(mark, 'transform', `translate(${MX} ${y}) scale(${f2(Math.max(0, a))})`);
      set(mark, 'opacity', clamp(a * 3));
      set(pend, 'opacity', ARRIVE(span(s, 0.3 + 0.04 * i, 0.6)) * (1 - clamp(a * 3)));
    });
    active('checklist', s >= RUN && s < RUN + 7 * STEP + 0.2);

    // the verdict lights, its three flags pop in, and it comes back to you
    const lit = span(s, LIT, 0.3);
    set(vbar, '--f', clamp(SNAP(lit)));
    dash(vline, ARRIVE(span(s, LIT + 0.1, 0.5)));
    vflags.forEach(({ g, x }, i) => {
      const a = SNAP(span(s, LIT + 0.25 + 0.12 * i, 0.24));
      set(g, 'transform', `translate(${x} ${VY}) scale(${f2(Math.max(0, a))})`);
      set(g, 'opacity', clamp(a * 3));
    });
    active('verdict', s >= LIT);
    set(ring, 'r', 8 + 1.6 * pulse(s, LIT + 0.7, 0.26));

    // ambient: the caret after the verdict blinks, the wash breathes about 2% and drifts;
    // on hover the back plane leans 4px
    const blink = still ? 1 : clamp(0.5 + 2 * Math.cos((2 * Math.PI * t) / 1.1));
    set(caret, 'opacity', (0.2 + 0.6 * blink) * span(s, LIT + 0.6, 0.3));
    set(wash, 'opacity', (0.6 + 0.4 * ARRIVE(span(s, RUN, 2))) * (0.98 + 0.02 * breath(t, 17)));
    set(wash, 'cx', 320 + 6 * Math.sin((2 * Math.PI * t) / 23));
    set(wash, 'cy', 250 + 5 * Math.sin((2 * Math.PI * t) / 31));
    set(back, 'transform', `translate(${f2(ptr.x * 4 * kpx)} ${f2(ptr.y * 4 * kpx)})`);
  }

  loop(stage, render, { still: STILL });
}
