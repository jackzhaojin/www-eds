/**
 * Scene engine `brief-merge`: the Sites and AI webinar deck, slide "01 - Start here: Paste it all
 * in, get one brief back" (a demo plate, on the left of a split slide).
 *
 * What it shows: three things an author got, an email from a stakeholder (an envelope), notes
 * from the boss (a page with a folded corner) and search data (a search bar over a small bar
 * chart), pasted one by one into one chat, where the assistant (the accent disc) reads them and
 * writes back one brief: who it's for, the questions, the sources, an outline. You (the ink
 * ring) give the brief a tick.
 *
 * Story (plays once from t = 0, then holds): the sources, the chat and the brief's outline draw
 * on; each source sends an accent copy of itself down its path into the chat, where it lands
 * as a small chip and the caret steps past it; the assistant pulses twice; the answer runs down
 * to the brief, whose four sections draw in turn in the accent and settle to ink; the ring
 * ticks it. Then it holds: the caret blinks, the wash breathes and drifts. Reduced motion shows
 * the held end.
 *
 * Parts (rows):
 * - `stakeholder`: above the left source card (the email), on a short leader.
 * - `boss`: above the middle source card (the notes).
 * - `search`: above the right source card (the search data).
 * - `brief`: right of the brief's header, on a short leader.
 */
const CARD = { w: 112, h: 74, y: 88 };
const CX = [100, 250, 400]; // the source cards' centers
const CHAT = {
  x: 140, y: 206, w: 220, h: 46,
};
const CY = CHAT.y + CHAT.h / 2;
const CHIP = 0.3; // a chip is its card at this scale
const CHIPX = [210, 252, 294];
const DISC = [166, CY];
const BRIEF = {
  x: 168, y: 284, w: 164, h: 164,
};
const RING = [132, 372];
const PASTE = [1.05, 1.7, 2.35]; // each copy leaves its card
const FLY = 0.9;
const THINK = [3.5, 4.0]; // the assistant's two pulses
const STREAM = 4.45; // the answer runs down to the brief
const SECTIONS = [4.85, 5.35, 5.85, 6.35];
const BUILD = 0.6;
const TICK = 7.15;
const STILL = 9.5;

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

/* the source cards on a 112 x 74 grid: the frame, then [path, kind, key]; key paths travel
   with the copy and stay on the chip */
const ROUND = 'M4 0H108Q112 0 112 4V70Q112 74 108 74H4Q0 74 0 70V4Q0 0 4 0Z';
const FRAMES = [ROUND, 'M4 0H92L112 20V70Q112 74 108 74H4Q0 74 0 70V4Q0 0 4 0Z', ROUND];
const GLYPHS = [
  [ // the stakeholder's email: an envelope, its flap and two address lines
    ['M7 6L56 39L105 6', 's', true],
    ['M34 53H78', 'i'],
    ['M40 62H72', 'i'],
  ],
  [ // your boss's notes: a page with a folded corner, four bulleted lines
    ['M92 0V16Q92 20 96 20H112', 's', true],
    ['M15 22h0.1M25 22H78', 'i', true],
    ['M15 35h0.1M25 35H86', 'i', true],
    ['M15 48h0.1M25 48H80'],
    ['M15 61h0.1M25 61H60'],
  ],
  [ // search data: a search bar over a small bar chart, rising
    ['M20 9H92A8 8 0 0 1 92 25H20A8 8 0 0 1 20 9Z', 's'],
    ['M18.5 17A3.5 3.5 0 1 0 25.5 17A3.5 3.5 0 1 0 18.5 17M24.4 19.4L27 22', 'i'],
    ['M33 17H70', 'i'],
    ['M14 64H98', 'c'],
    ['M24 63V55M37 63V51M50 63V53M63 63V45M76 63V47M89 63V38', 'bar', true],
  ],
];

/* the brief on a 164 x 164 grid, section by section: [path, kind] */
const BRIEF_SECTIONS = [
  [ // who it's for: the title and its audience line
    ['M16 22H116', 'title brief-merge-fresh'],
    ['M16 35H74', 'i'],
  ],
  [ // the questions: a list with ticks
    ['M16 56l3 3.5l6 -7', 's'], ['M33 56H140', 'i'],
    ['M16 70l3 3.5l6 -7', 's'], ['M33 70H126', 'i'],
    ['M16 84l3 3.5l6 -7', 's'], ['M33 84H146', 'i'],
  ],
  [ // the sources: three links, dots on a line
    ['M23.5 106H38.5M49.5 106H64.5M75.5 106H90', 'c'],
    ['M15 106A4.5 4.5 0 1 0 24 106A4.5 4.5 0 1 0 15 106', 's'],
    ['M41 106A4.5 4.5 0 1 0 50 106A4.5 4.5 0 1 0 41 106', 's'],
    ['M67 106A4.5 4.5 0 1 0 76 106A4.5 4.5 0 1 0 67 106', 's'],
  ],
  [ // the outline: two levels under a guide
    ['M16 126H96', 's'],
    ['M21 133V151', 'c'],
    ['M31 139H128', 'i'],
    ['M31 151H112', 'i'],
  ],
];

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const id = `brief-merge-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'brief-merge-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'brief-merge-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'brief-merge-wash-stop is-end' }, grad);

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
    d, class: `brief-merge-${kind || 'i'}`, ...extra,
  }, parent, introKind);

  const wash = svg('circle', {
    cx: 250, cy: 300, r: 230, fill: `url(#${id}-wash)`,
  }, back);

  // the paste paths, from each card down into the chat, and the answer's path to the brief
  const routes = CX.map((x, i) => [
    x, CARD.y + CARD.h / 2, x, CARD.y + 112, CHIPX[i], CHAT.y - 34, CHIPX[i], CY,
  ]);
  CX.forEach((x, i) => path(back, `M${x} ${CARD.y + CARD.h + 4}C${x} ${CARD.y + 112} ${CHIPX[i]} ${CHAT.y - 34} ${CHIPX[i]} ${CHAT.y - 4}`, 'c brief-merge-dash', 'fade'));
  path(back, `M250 ${CHAT.y + CHAT.h + 4}V${BRIEF.y - 4}`, 'c brief-merge-dash', 'fade');

  // the source cards
  const draw = (parent, k, keyOnly, introKind) => {
    path(parent, FRAMES[k], 's', introKind === 'fade' ? 'draw' : null, introKind ? { pathLength: 1 } : {});
    GLYPHS[k].forEach(([d, kind, key]) => {
      if (!keyOnly || key) path(parent, d, kind, introKind);
    });
  };
  const cards = CX.map((x, k) => {
    const g = svg('g', { class: 'brief-merge-card', transform: `translate(${x - CARD.w / 2} ${CARD.y})` }, mech);
    draw(g, k, false, 'fade');
    return g;
  });

  // the chat: its box, the assistant at its left, a chip for each paste, the caret
  path(mech, box(CHAT, 12), 's', 'draw', { pathLength: 1 });
  path(mech, `M${DISC[0] + 16} ${CHAT.y + 9}V${CHAT.y + CHAT.h - 9}`, 'c', 'fade');
  const halo = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 12, class: 'brief-merge-halo',
  }, mech, 'fade');
  const ripples = THINK.map(() => svg('circle', {
    cx: DISC[0], cy: DISC[1], r: 12, class: 'brief-merge-ripple',
  }, mech));
  const disc = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 7.5, class: 'brief-merge-disc',
  }, mech, 'fade');
  const chips = CHIPX.map((x, k) => {
    const g = svg('g', {
      class: 'brief-merge-chip brief-merge-fresh',
      transform: `translate(${f2(x - (CARD.w * CHIP) / 2)} ${f2(CY - (CARD.h * CHIP) / 2)}) scale(${CHIP})`,
      style: `--s: ${CHIP}`,
    }, mech);
    draw(g, k, true);
    return g;
  });
  const caret = svg('path', { d: `M0 ${CY - 8}V${CY + 8}`, class: 'brief-merge-caret' }, mech);

  // the brief: a dashed outline until the answer arrives, then its frame and sections
  const bx = BRIEF.x;
  const by = BRIEF.y;
  const outline = box(BRIEF, 4);
  const ghost = path(mech, outline, 'c brief-merge-dash', 'fade');
  const frame = svg('path', { d: outline, class: 'brief-merge-s', pathLength: 1 }, mech);
  const sections = BRIEF_SECTIONS.map((items) => {
    const g = svg('g', { class: 'brief-merge-fresh', transform: `translate(${bx} ${by})` }, mech);
    return { g, els: items.map(([d, kind]) => path(g, d, kind, null, { pathLength: 1 })) };
  });
  const answer = svg('path', { d: `M250 ${CHAT.y + CHAT.h + 4}V${BRIEF.y - 4}`, class: 'brief-merge-answer', pathLength: 1 }, front);

  // you: the ink ring, and the tick you give the brief
  const ringEl = add('circle', {
    cx: RING[0], cy: RING[1], r: 8, class: 'brief-merge-ring',
  }, mech, 'fade');
  const tick = svg('path', { d: `M${RING[0] + 15} ${RING[1]}l4.5 5l9.5 -11`, class: 'brief-merge-tick', pathLength: 1 }, mech);

  // the copies in flight: each card's key marks, in the accent
  const copies = CX.map((x, k) => {
    const g = svg('g', { class: 'brief-merge-copy' }, front);
    draw(g, k, true);
    return g;
  });

  // leaders and labels: [part, pin x, pin y, end x, end y, label x, label y, align]
  const callouts = [
    ['stakeholder', CX[0], CARD.y, CX[0], CARD.y - 14, CX[0], CARD.y - 33, 'center'],
    ['boss', CX[1], CARD.y, CX[1], CARD.y - 14, CX[1], CARD.y - 33, 'center'],
    ['search', CX[2], CARD.y, CX[2], CARD.y - 14, CX[2], CARD.y - 33, 'center'],
    ['brief', bx + BRIEF.w, by + 22, bx + BRIEF.w + 12, by + 22, bx + BRIEF.w + 18, by + 22, 'left'],
  ];
  const labels = {};
  callouts.forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    const label = place(part, lx, ly, 500, align);
    if (!label) return;
    labels[part] = label;
    path(mech, `M${px} ${py}L${ex} ${ey}`, 'leader', 'draw', { pathLength: 1 });
    add('circle', {
      cx: px, cy: py, r: 1.8, class: 'brief-merge-pin',
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
      if (prop === 'transform' || prop === 'cx' || prop === 'cy' || prop === 'r' || prop === 'd') el.setAttribute(prop, s);
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

    // the pastes: a copy lifts off its card, travels its path and shrinks into its chip
    let caretX = CHAT.x + 48;
    CX.forEach((x, k) => {
      const t0 = PASTE[k];
      const u = span(s, t0, FLY);
      const land = t0 + FLY;
      const e = TRAVEL(u);
      const [px, py] = bez(routes[k], e);
      const sc = 1 + (CHIP - 1) * e;
      const g = copies[k];
      set(g, 'transform', `translate(${f2(px - (CARD.w * sc) / 2)} ${f2(py - (CARD.h * sc) / 2)}) scale(${sc.toFixed(4)})`);
      set(g, '--s', sc);
      set(g, 'opacity', s < t0 || s > land + 0.12 ? 0 : clamp(Math.min(u / 0.12, 1 - (s - land) / 0.12)));
      set(cards[k], 'transform', `translate(${x - CARD.w / 2} ${f2(CARD.y - 3 * pulse(s, t0 - 0.05, 0.3))})`);
      const chip = chips[k];
      const shown = SNAP(span(s, land - 0.04, 0.24));
      set(chip, 'opacity', clamp(shown * 4));
      set(chip, '--f', 1 - span(s, land + 0.2, 0.9));
      if (s >= land) caretX = CHIPX[k] + 23;
      active(['stakeholder', 'boss', 'search'][k], s >= t0 && s < land + 0.5);
    });
    set(caret, 'transform', `translate(${caretX} 0)`);
    // the caret blinks once the chat is idle (before the pastes and after the answer)
    const busy = still || (s > PASTE[0] - 0.1 && s < STREAM);
    const blink = busy ? 1 : clamp(0.5 + 2 * Math.cos((2 * Math.PI * t) / 1.1));
    set(caret, 'opacity', (0.2 + 0.6 * blink) * clamp(s / 0.9));

    // the assistant reads: two pulses out from the disc
    let think = 0;
    ripples.forEach((el, i) => {
      const u = span(s, THINK[i], 0.75);
      set(el, 'r', 9 + 22 * ARRIVE(u));
      set(el, 'opacity', u > 0 && u < 1 ? 0.55 * (1 - u) : 0);
      think = Math.max(think, pulse(s, THINK[i], 0.3));
    });
    set(disc, 'r', 7.5 + 1.6 * think);
    set(halo, 'r', 12 + 2.5 * breath(t, 4.7) * (still ? 0 : 1));

    // the answer runs down; the brief's frame goes solid, then its sections draw in turn
    dash(answer, ARRIVE(span(s, STREAM, 0.45)), 1 - 0.55 * span(s, STREAM + 0.6, 0.8));
    dash(frame, ARRIVE(span(s, STREAM + 0.3, 0.7)));
    set(ghost, 'opacity', 1 - span(s, STREAM + 0.3, 0.7));
    sections.forEach(({ g, els }, i) => {
      const t0 = SECTIONS[i];
      els.forEach((el, j) => dash(el, ARRIVE(span(s, t0 + (j * BUILD * 0.5) / els.length, BUILD))));
      // fresh work in the accent, settling to ink; the title keeps the accent
      set(g, '--f', 1 - span(s, t0 + BUILD + 0.2, 0.9));
      if (i === 0) set(els[0], '--f', 1);
    });
    active('brief', s >= SECTIONS[0] && s < TICK + 0.6);

    // you tick it
    const press = pulse(s, TICK, 0.26);
    set(ringEl, 'r', 8 + 1.6 * press);
    dash(tick, ARRIVE(span(s, TICK + 0.08, 0.32)));

    // ambient: the wash breathes about 2% and drifts; on hover the back plane leans 4px
    set(wash, 'opacity', (0.55 + 0.45 * ARRIVE(span(s, SECTIONS[0], 1.6))) * (0.98 + 0.02 * breath(t, 17)));
    set(wash, 'cx', 250 + 6 * Math.sin((2 * Math.PI * t) / 23));
    set(wash, 'cy', 300 + 5 * Math.sin((2 * Math.PI * t) / 31));
    set(back, 'transform', `translate(${f2(ptr.x * 4 * kpx)} ${f2(ptr.y * 4 * kpx)})`);
  }

  loop(stage, render, { still: STILL });
}
