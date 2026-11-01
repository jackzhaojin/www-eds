/**
 * Scene engine `workspace-prompt`: the Sites and AI webinar deck, slide "02 - Start here: Ask
 * the assistant in Experience Workspace" (a demo plate, on the left of a split slide).
 *
 * What it shows: an editor drawn in lines, no product UI: a narrow assistant panel on the left
 * and the page you are editing on the right. You (the ink ring) type a request into the panel;
 * the assistant (the accent disc) changes the page you are looking at: the long title shortens
 * and a comparison table slides in after the first section, the rest of the page making room.
 * The assistant answers in two lines and the preview pill lights.
 *
 * Story (plays once from t = 0, then holds): the window, the panel and the page draw on; your
 * request types in, three lines behind a caret, and you send it; the assistant pulses and
 * reaches across to the page; the title flashes in the accent as it shortens; the table slides
 * in and settles to ink; the reply draws; the preview pill lights. Then it holds: the caret in
 * the empty prompt box blinks, the wash breathes and drifts. Reduced motion shows the held end.
 *
 * Parts (rows):
 * - `assistant`: above the assistant panel, on a short leader.
 * - `page`: above the page, on a short leader.
 * - `preview`: above the preview pill, at the window's top right.
 */
const WIN = {
  x: 40, y: 84, w: 420, h: 332,
};
const SPLIT = 170; // the panel's right edge
const RING = [60, 134];
const BUBBLE = {
  x: 76, y: 120, w: 80, h: 54,
};
const TYPED = [[86, 135, 56], [86, 147, 60], [86, 159, 34]]; // x, y, width of each typed line
const DISC = [60, 208];
const BOX = {
  x: 52, y: 372, w: 104, h: 28,
};
const PAGE = {
  x: 194, y: 106, w: 244, h: 290,
};
const L = 212; // the page's text column
const TITLE = [132, 420, 326]; // y, long end, short end
const PILL = {
  x: 394, y: 75, w: 56, h: 18,
};
const PUSH = 80; // how far the rest of the page moves for the table
const TYPE = 1.1; // the request starts typing
const SEND = 2.85;
const THINK = 3.0;
const TITLE_AT = 3.55;
const TABLE = 4.2;
const REPLY = 5.2;
const PREVIEW = 5.75;
const STILL = 8;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
// the motion grammar's curves, as close polynomials of the cubic-beziers they name
const ARRIVE = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // (0.16, 1, 0.3, 1)
const TRAVEL = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2); // (0.65, 0, 0.35, 1)
const SNAP = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2; // (0.34, 1.56, 0.64, 1)
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const pulse = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));
const f2 = (v) => v.toFixed(2);

/** A rounded rectangle's outline, from its top left corner, clockwise. */
function box({
  x, y, w, h,
}, r) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}`
    + `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}`
    + `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

/* the page below the first section, which moves down for the table: [path, kind] */
const REST = [
  [`M${L} 206H300`, 'sub'],
  [`M${L} 223H420M${L} 235H404M${L} 247H338`, 'i'],
  [`M${L} 272H286`, 'sub'],
  [`M${L} 289H412M${L} 301H364`, 'i'],
];
/* the comparison table: a header row and three rows of three cells */
const T = {
  x: L, y: 196, w: 208, h: 66,
};
const ROW = T.h / 4;
const COL = T.w / 3;

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const id = `workspace-prompt-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'workspace-prompt-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'workspace-prompt-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'workspace-prompt-wash-stop is-end' }, grad);

  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const intro = []; // [element, 'draw' | 'fade'], in drawing order
  const add = (name, attrs, parent, kind) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };
  const path = (parent, d, kind, introKind, extra = {}) => add('path', {
    d, class: `workspace-prompt-${kind || 'i'}`, ...extra,
  }, parent, introKind);

  const wash = svg('circle', {
    cx: 300, cy: 240, r: 240, fill: `url(#${id}-wash)`,
  }, back);

  // the window: its frame, the panel's edge, the page
  path(mech, box(WIN, 10), 's', 'draw', { pathLength: 1 });
  path(mech, `M${SPLIT} ${WIN.y + 1}V${WIN.y + WIN.h - 1}`, 'c', 'draw', { pathLength: 1 });
  path(mech, box(PAGE, 3), 'c', 'draw', { pathLength: 1 });

  // the panel: its title, your request in a bubble, the assistant and its reply, the prompt box
  path(mech, 'M54 104H112', 'c', 'fade');
  const ring = add('circle', {
    cx: RING[0], cy: RING[1], r: 8, class: 'workspace-prompt-ring',
  }, mech, 'fade');
  const bubble = path(mech, box(BUBBLE, 8), 's', 'draw', { pathLength: 1 });
  const typed = TYPED.map(([x, y, w]) => svg('path', { d: `M${x} ${y}H${x + w}`, class: 'workspace-prompt-i', pathLength: 1 }, mech));
  const caret = svg('path', { d: 'M0 -6V6', class: 'workspace-prompt-caret' }, mech);
  const halo = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 12, class: 'workspace-prompt-halo',
  }, mech, 'fade');
  const ripple = svg('circle', {
    cx: DISC[0], cy: DISC[1], r: 12, class: 'workspace-prompt-ripple',
  }, mech);
  const disc = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 7.5, class: 'workspace-prompt-disc',
  }, mech, 'fade');
  const reply = [[76, 203, 66], [76, 215, 46]].map(([x, y, w]) => svg('path', { d: `M${x} ${y}H${x + w}`, class: 'workspace-prompt-i', pathLength: 1 }, mech));
  path(mech, box(BOX, 14), 'c', 'draw', { pathLength: 1 });
  const idle = svg('path', { d: `M${BOX.x + 14} ${BOX.y + 8}V${BOX.y + BOX.h - 8}`, class: 'workspace-prompt-caret' }, mech);

  // the assistant reaches across to the page
  const reach = svg('path', {
    d: `M${DISC[0] + 7} ${DISC[1] - 8}C${DISC[0] + 30} ${DISC[1] - 24} ${SPLIT - 20} 184 ${PAGE.x + 10} 188`,
    class: 'workspace-prompt-reach',
    pathLength: 1,
  }, mech);

  // the page: the title, the first section, the table, and the rest
  const title = path(mech, `M${L} ${TITLE[0]}H${TITLE[1]}`, 'title workspace-prompt-fresh', null, { pathLength: 1 });
  path(mech, `M${L} 154H424M${L} 166H412M${L} 178H350`, 'i', 'fade');
  const rest = svg('g', {}, mech);
  REST.forEach(([d, kind]) => path(rest, d, kind, 'fade'));
  const table = svg('g', { class: 'workspace-prompt-fresh' }, mech);
  svg('path', { d: `M${T.x} ${T.y}H${T.x + T.w}V${T.y + ROW}H${T.x}Z`, class: 'workspace-prompt-head' }, table);
  svg('path', { d: box(T, 2), class: 'workspace-prompt-s' }, table);
  let grid = '';
  for (let r = 1; r < 4; r += 1) grid += `M${T.x} ${T.y + r * ROW}H${T.x + T.w}`;
  for (let c = 1; c < 3; c += 1) grid += `M${T.x + c * COL} ${T.y}V${T.y + T.h}`;
  svg('path', { d: grid, class: 'workspace-prompt-grid' }, table);
  let cells = '';
  [[44, 30, 36], [30, 40, 22], [38, 26, 42]].forEach((ws, r) => ws.forEach((w, c) => {
    cells += `M${T.x + c * COL + 9} ${T.y + (r + 1.5) * ROW}h${w}`;
  }));
  svg('path', { d: cells, class: 'workspace-prompt-cell' }, table);

  // the preview pill, astride the window's top edge
  const pill = svg('g', { class: 'workspace-prompt-pill workspace-prompt-fresh' }, mech);
  path(pill, box(PILL, PILL.h / 2), 'pill-box', 'fade');
  path(pill, `M${PILL.x + 12} ${PILL.y + PILL.h / 2}h0.1`, 'pill-dot', 'fade');
  path(pill, `M${PILL.x + 21} ${PILL.y + PILL.h / 2}H${PILL.x + PILL.w - 11}`, 'pill-line', 'fade');

  // leaders and labels: [part, pin x, pin y, label x, label y]
  const callouts = [
    ['assistant', (WIN.x + SPLIT) / 2, WIN.y, (WIN.x + SPLIT) / 2, 52],
    ['page', PAGE.x + PAGE.w / 2 - 8, WIN.y, PAGE.x + PAGE.w / 2 - 8, 52],
    ['preview', PILL.x + PILL.w / 2, PILL.y, PILL.x + PILL.w / 2, 52],
  ];
  const labels = {};
  callouts.forEach(([part, px, py, lx, ly]) => {
    const label = place(part, lx, ly, 500, 'center');
    if (!label) return;
    labels[part] = label;
    path(mech, `M${px} ${py}V${ly + 18}`, 'leader', 'draw', { pathLength: 1 });
    add('circle', {
      cx: px, cy: py, r: 1.8, class: 'workspace-prompt-pin',
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
      if (prop === 'transform' || prop === 'cx' || prop === 'cy' || prop === 'r') el.setAttribute(prop, s);
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

    // your request types in behind a caret; you send it
    let tip = null;
    TYPED.forEach(([x, y, w], i) => {
      const p = span(s, TYPE + 0.55 * i, 0.5);
      dash(typed[i], p);
      if (p > 0) tip = [x + w * p + 4, y];
    });
    if (tip && s < SEND) set(caret, 'transform', `translate(${f2(tip[0])} ${tip[1]})`);
    set(caret, 'opacity', tip && s < SEND ? 0.8 : 0);
    const press = pulse(s, SEND, 0.26);
    set(ring, 'r', 8 + 1.6 * press);
    set(bubble, '--f', pulse(s, SEND, 0.7));

    // the assistant pulses and reaches across to the page
    const u = span(s, THINK, 0.8);
    set(ripple, 'r', 9 + 22 * ARRIVE(u));
    set(ripple, 'opacity', u > 0 && u < 1 ? 0.55 * (1 - u) : 0);
    set(disc, 'r', 7.5 + 1.6 * pulse(s, THINK, 0.3));
    set(halo, 'r', 12 + 2.5 * breath(t, 4.7) * (still ? 0 : 1));
    dash(reach, ARRIVE(span(s, THINK + 0.15, 0.45)), 1 - span(s, REPLY, 0.6));

    // the change lands: the title shortens in a flash of the accent, then the table slides in
    const cut = ARRIVE(span(s, TITLE_AT, 0.55));
    dash(title, 1 - (cut * (TITLE[1] - TITLE[2])) / (TITLE[1] - L), ARRIVE(span(s, 0.35, 0.6)));
    set(title, '--f', pulse(s, TITLE_AT - 0.05, 1.3));
    const room = TRAVEL(span(s, TABLE, 0.7));
    set(rest, 'transform', `translate(0 ${f2(PUSH * room)})`);
    const inn = ARRIVE(span(s, TABLE + 0.5, 0.7));
    set(table, 'opacity', inn);
    set(table, 'transform', `translate(${f2(14 * (1 - inn))} 0)`);
    set(table, '--f', 1 - span(s, TABLE + 1.1, 1));
    active('page', s >= TITLE_AT && s < TABLE + 1.4);
    active('assistant', s >= THINK && s < TITLE_AT);

    // the reply, then the preview lights
    reply.forEach((el, i) => dash(el, ARRIVE(span(s, REPLY + 0.12 * i, 0.5))));
    const lit = SNAP(span(s, PREVIEW, 0.26));
    set(pill, '--f', clamp(lit));
    set(pill, 'transform', `translate(${PILL.x + PILL.w / 2} ${PILL.y + PILL.h / 2}) scale(${(1 + 0.12 * pulse(s, PREVIEW, 0.3)).toFixed(3)}) translate(${-(PILL.x + PILL.w / 2)} ${-(PILL.y + PILL.h / 2)})`);
    active('preview', s >= PREVIEW && s < PREVIEW + 1.2);

    // ambient: the empty prompt box's caret blinks, the wash breathes about 2% and drifts;
    // on hover the back plane leans 4px
    const blink = still ? 1 : clamp(0.5 + 2 * Math.cos((2 * Math.PI * t) / 1.1));
    set(idle, 'opacity', s < REPLY + 0.6 ? 0 : (0.2 + 0.6 * blink) * span(s, REPLY + 0.6, 0.3));
    set(wash, 'opacity', (0.6 + 0.4 * ARRIVE(span(s, TITLE_AT, 1.6))) * (0.98 + 0.02 * breath(t, 17)));
    set(wash, 'cx', 300 + 6 * Math.sin((2 * Math.PI * t) / 23));
    set(wash, 'cy', 240 + 5 * Math.sin((2 * Math.PI * t) / 31));
    set(back, 'transform', `translate(${f2(ptr.x * 4 * kpx)} ${f2(ptr.y * 4 * kpx)})`);
  }

  loop(stage, render, { still: STILL });
}
