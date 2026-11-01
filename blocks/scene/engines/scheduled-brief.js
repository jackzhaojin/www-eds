/**
 * Scene engine `scheduled-brief`: the Sites and AI webinar deck, slide "01 - Go further: A research
 * run that shows up every Monday" (a demo plate, left of the prompt).
 *
 * What it shows: a weekly scheduled task, as a pipeline. A clock ticks round to 7:00 and the week
 * strip under it moves from Sunday to Monday; the automation square (a faint rounded square) starts
 * the run, and its token travels to AI (the accent disc), which reaches out to four sources and
 * gathers what is new; the gathered items fall through the brand guidelines (an open rule book,
 * scanned line by line) and come out as three briefs in one form, which land in a tray beside you
 * (the ink ring). Nothing is published: the run ends in your tray.
 *
 * Story (plays once from t = 0, then holds): 0 to 0.8 s the construction draws on; 0.9 to 2 s the
 * minute hand ticks round and Monday lights; 2 to 3 s the square starts the run and the token
 * travels to AI; 3.1 to 4.6 s the research, out to the sources and back; 4.6 to 6.2 s the items
 * fall into the rule book, which scans them; 6 to 8 s three briefs land in the tray and you take
 * them. Then it holds: the wash breathes and the clock creeps on. Reduced motion shows that end.
 *
 * Parts (rows, placed by the engine):
 * - `schedule`: hung under the week strip, below the clock (upper left).
 * - `research`: above the AI disc (top).
 * - `brand`: left of the rule book (middle).
 * - `briefs`: right of the tray (lower middle, clear of the controls' corner).
 */
const DEG = Math.PI / 180;
const P = 'scheduled-brief-';
const C = { x: 104, y: 130, r: 40 }; // the clock
const WK = { y: 186, s: 10, gap: 3.6 }; // the week strip, Monday first
const WK_X = C.x - (7 * WK.s + 6 * WK.gap) / 2;
const SQ = { x: 196, y: 130, s: 28 }; // the automation square
const AI = { x: 300, y: 130 };
const SRC = [-28, -9.5, 9.5, 28].map((a) => [Math.cos(a * DEG), Math.sin(a * DEG)]);
const SRC_R = 140;
const BK = {
  x: 300, y0: 258, y1: 338, w: 124,
}; // the rule book, open, its spine at x
const RY = 374; // the run from the book to the tray
const SLOTS = [148, 180, 212]; // the tray's slots
const TRAY = { x0: 126, x1: 234, y: 428 };
const YOU = { x: 84, y: 408 };
const BRIEF = { w: 28, h: 36 };
const LAND_Y = TRAY.y - 2 - BRIEF.h / 2;

// the story, in seconds from t = 0
const TICK0 = 0.92;
const TICK = 0.09;
const T7 = TICK0 + 12 * TICK;
const SPARK = [T7, T7 + 0.28];
const RUN = [T7 + 0.42, T7 + 1.1];
const RAY0 = RUN[1] + 0.1;
const FALL0 = RAY0 + 1.42;
const SCAN = [FALL0 + 0.75, FALL0 + 1.6];
const OUT0 = SCAN[0] + 0.55;
const OUT_GAP = 0.36;
const OUT_LEN = 0.85;
const LIST = [OUT0 + 2 * OUT_GAP + OUT_LEN + 0.3, OUT0 + 2 * OUT_GAP + OUT_LEN + 0.75];
const DONE = LIST[1];
const SETTLE = DONE + 0.5;
const STILL = 12;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, b) => clamp((t - a) / (b - a));

/** A cubic-bezier easing as a function of t (bisection on x, exact enough at 20 steps). */
function bezier(x1, y1, x2, y2) {
  const at = (s, a, b) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i += 1) {
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
/** A 0..1..0 pulse over [t0, t0 + d], on the snap curve. */
const pulse = (t, t0, d) => {
  if (t < t0 || t > t0 + d) return 0;
  return Math.sin(Math.PI * clamp(snap((t - t0) / d)));
};
const f2 = (v) => v.toFixed(2);

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer,
  } = kit;
  const id = `${P}${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: `${P}svg`, viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  stage.append(root);
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: `${P}wash-stop` }, grad);
  svg('stop', { offset: '1', class: `${P}wash-stop` }, grad);
  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const front = svg('g', {}, root);
  const intro = []; // [element, kind]: 'draw' by dash (pathLength 1), 'fade' by opacity
  const add = (name, attrs, parent, kind) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };
  const cls = (names) => names.split(' ').map((n) => (n.startsWith('is-') ? n : P + n)).join(' ');

  /** A route: dotted construction, an accent trail over it, and its points sampled once. */
  const route = (d) => {
    const el = add('path', { d, class: cls('route') }, back, 'fade');
    const trail = svg('path', { d, class: cls('trail'), pathLength: 1 }, mech);
    const total = el.getTotalLength();
    const n = Math.max(8, Math.ceil(total / 3));
    const pts = Array.from({ length: n + 1 }, (_, i) => el.getPointAtLength((i / n) * total));
    const at = (u) => {
      const f = clamp(u) * n;
      const i = Math.min(n - 1, Math.floor(f));
      const r = f - i;
      return [pts[i].x + (pts[i + 1].x - pts[i].x) * r, pts[i].y + (pts[i + 1].y - pts[i].y) * r];
    };
    return { el, trail, at };
  };

  // construction: the wash behind the run
  const wash = svg('circle', {
    cx: 270, cy: 250, r: 230, fill: `url(#${id}-wash)`,
  }, back);

  // the clock: face, hour ticks, hands; the week strip under it
  const clock = add('circle', {
    cx: C.x, cy: C.y, r: C.r, class: cls('s clock'),
  }, mech, 'fade');
  let ticks = '';
  for (let i = 0; i < 12; i += 1) {
    const a = i * 30 * DEG;
    const r0 = C.r - (i % 3 ? 5 : 8);
    ticks += `M${f2(C.x + r0 * Math.sin(a))} ${f2(C.y - r0 * Math.cos(a))}L${f2(C.x + (C.r - 2) * Math.sin(a))} ${f2(C.y - (C.r - 2) * Math.cos(a))}`;
  }
  add('path', { d: ticks, class: cls('c') }, mech, 'fade');
  const hourHand = add('path', { d: `M${C.x} ${C.y + 4}V${C.y - 20}`, class: cls('hand is-hour') }, mech, 'fade');
  const minHand = add('path', { d: `M${C.x} ${C.y + 6}V${C.y - 31}`, class: cls('hand') }, mech, 'fade');
  add('circle', {
    cx: C.x, cy: C.y, r: 2.6, class: cls('pin-ink'),
  }, mech, 'fade');
  const days = Array.from({ length: 7 }, (_, i) => add('rect', {
    x: f2(WK_X + i * (WK.s + WK.gap)), y: WK.y, width: WK.s, height: WK.s, rx: 2, class: cls(i ? 'c day' : 's day'),
  }, mech, 'fade'));
  const monday = svg('rect', {
    x: f2(WK_X), y: WK.y, width: WK.s, height: WK.s, rx: 2, class: cls('day-lit'),
  }, mech);
  const sunday = svg('rect', {
    x: f2(WK_X + 6 * (WK.s + WK.gap) + 2), y: WK.y + 2, width: WK.s - 4, height: WK.s - 4, rx: 1, class: cls('day-ink'),
  }, mech);

  // the routes: clock to square, square to AI, AI down to the book, the book down to the tray
  const r0 = route(`M${C.x + C.r + 2} ${C.y}H${SQ.x - SQ.s / 2 - 2}`);
  const r1 = route(`M${SQ.x + SQ.s / 2 + 2} ${C.y}H${AI.x - 20}`);
  const r2 = route(`M${AI.x} ${AI.y + 21}V${BK.y0 + 5}`);
  const r3 = route(`M${BK.x} ${BK.y1 + 12}V${RY - 12}Q${BK.x} ${RY} ${BK.x - 12} ${RY}H${SLOTS[1] + 12}Q${SLOTS[1]} ${RY} ${SLOTS[1]} ${RY + 12}V${LAND_Y - 14}`);
  const rays = SRC.map(([ux, uy]) => route(`M${f2(AI.x + 24 * ux)} ${f2(AI.y + 24 * uy)}L${f2(AI.x + (SRC_R - 16) * ux)} ${f2(AI.y + (SRC_R - 16) * uy)}`));

  // the automation square, and AI
  const square = add('rect', {
    x: SQ.x - SQ.s / 2, y: SQ.y - SQ.s / 2, width: SQ.s, height: SQ.s, rx: 6, class: cls('auto'),
  }, mech, 'fade');
  const halo = add('circle', {
    cx: AI.x, cy: AI.y, r: 19, class: cls('ai-halo'),
  }, mech, 'fade');
  const disc = add('circle', {
    cx: AI.x, cy: AI.y, r: 11, class: cls('ai'),
  }, mech, 'fade');

  // the sources: four small pages on an arc right of AI
  const sources = SRC.map(([ux, uy]) => {
    const x = AI.x + SRC_R * ux - 9;
    const y = AI.y + SRC_R * uy - 11.5;
    const g = svg('g', { transform: `translate(${f2(x)} ${f2(y)})` }, mech);
    const page = add('rect', {
      width: 18, height: 23, rx: 2, class: cls('s page'),
    }, g, 'fade');
    add('path', { d: 'M4.5 7H13.5M4.5 12H13.5M4.5 17H10', class: cls('ink') }, g, 'fade');
    return page;
  });

  // the rule book, open: a swatch row and a specimen on the left page, rules on the right
  const { x: bx, y0, y1 } = BK;
  const bl = bx - BK.w / 2;
  const br = bx + BK.w / 2;
  const book = add('path', {
    d: `M${bl} ${y0}Q${bx - 31} ${y0 - 5} ${bx} ${y0 + 5}Q${bx + 31} ${y0 - 5} ${br} ${y0}V${y1}Q${bx + 31} ${y1 - 5} ${bx} ${y1 + 5}Q${bx - 31} ${y1 - 5} ${bl} ${y1}Z`,
    class: cls('s book'),
  }, mech, 'fade');
  add('path', { d: `M${bx} ${y0 + 5}V${y1 + 5}`, class: cls('c') }, mech, 'fade');
  [0, 1, 2].forEach((i) => add('rect', {
    x: bl + 10 + i * 15, y: y0 + 12, width: 11, height: 11, rx: 1.5, class: cls(`swatch is-${i}`),
  }, mech, 'fade'));
  add('path', { d: `M${bl + 10} ${y0 + 38}H${bl + 42}`, class: cls('ink is-bold') }, mech, 'fade');
  add('path', { d: `M${bl + 10} ${y0 + 50}H${bx - 10}M${bl + 10} ${y0 + 60}H${bx - 16}`, class: cls('ink') }, mech, 'fade');
  const rules = [0, 1, 2, 3, 4].map((i) => {
    const y = y0 + 16 + i * 12;
    add('path', { d: `M${bx + 18} ${y}H${br - 10 - (i % 2) * 8}`, class: cls('ink') }, mech, 'fade');
    return add('path', { d: `M${bx + 9} ${y}H${bx + 11}`, class: cls('rule') }, mech, 'fade');
  });
  const scan = svg('path', { d: `M${bl + 4} 0H${br - 4}`, class: cls('scan') }, mech);

  // the tray and you
  add('path', { d: `M${TRAY.x0} ${TRAY.y - 30}V${TRAY.y - 5}Q${TRAY.x0} ${TRAY.y} ${TRAY.x0 + 5} ${TRAY.y}H${TRAY.x1 - 5}Q${TRAY.x1} ${TRAY.y} ${TRAY.x1} ${TRAY.y - 5}V${TRAY.y - 30}`, class: cls('s') }, mech, 'fade');
  const r4 = route(`M${TRAY.x0 - 6} ${YOU.y}H${YOU.x + 17}`);
  const you = add('circle', {
    cx: YOU.x, cy: YOU.y, r: 12, class: cls('you'),
  }, mech, 'fade');
  const badge = svg('circle', {
    cx: YOU.x + 9.5, cy: YOU.y - 9.5, r: 0, class: cls('badge'),
  }, mech);

  // the travellers: the token, the gathered items, three briefs in one form
  const halo2 = svg('circle', { r: 10, class: cls('halo') }, front);
  const dot = svg('circle', { r: 4.5, class: cls('dot') }, front);
  const items = [3.4, 2.4, 3, 2].map((r) => svg('circle', { r, class: cls('dot') }, front));
  const briefs = SLOTS.map(() => {
    const g = svg('g', { class: cls('brief') }, front);
    svg('rect', {
      x: -BRIEF.w / 2, y: -BRIEF.h / 2, width: BRIEF.w, height: BRIEF.h, rx: 2.5, class: cls('paper'),
    }, g);
    svg('path', { d: 'M-8.5 -10H4', class: cls('ink is-bold') }, g);
    svg('path', { d: 'M-8.5 -1H8.5M-8.5 5H8.5M-8.5 11H3', class: cls('ink') }, g);
    return g;
  });

  // leaders and labels: [part, pin x, pin y, end x, end y, label x, label y, align]
  const callouts = [
    ['schedule', WK_X + WK.s / 2, WK.y + WK.s + 2, WK_X + WK.s / 2, WK.y + WK.s + 13, WK_X - 1, WK.y + WK.s + 30, 'left'],
    ['research', AI.x, AI.y - 21, AI.x, AI.y - 35, AI.x, AI.y - 38, 'bottom'],
    ['brand', bl, (y0 + y1) / 2, bl - 10, (y0 + y1) / 2, bl - 14, (y0 + y1) / 2, 'right'],
    ['briefs', TRAY.x1 + 2, LAND_Y, TRAY.x1 + 12, LAND_Y, TRAY.x1 + 16, LAND_Y, 'left'],
  ];
  const labels = {};
  callouts.forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    const label = place(part, lx, ly, 500, align);
    if (!label) return;
    labels[part] = label;
    add('path', { d: `M${f2(px)} ${f2(py)}L${f2(ex)} ${f2(ey)}`, class: cls('leader'), pathLength: 1 }, mech, 'draw');
    add('circle', {
      cx: f2(px), cy: f2(py), r: 1.6, class: cls('pin'),
    }, mech, 'fade');
  });

  let kpx = 1; // viewBox units per CSS pixel
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (!w) return;
    kpx = 500 / w;
    root.style.setProperty('--k', kpx.toFixed(3));
  }).observe(stage);

  const ptr = pointer(stage);
  const set = (el, prop, v) => {
    if (el[`_${prop}`] !== v) {
      el[`_${prop}`] = v;
      el.style.setProperty(prop, v);
    }
  };
  const attr = (el, name, v) => {
    if (el[`_a${name}`] !== v) {
      el[`_a${name}`] = v;
      el.setAttribute(name, v);
    }
  };
  const flag = (el, name, on) => {
    if (el[`_c${name}`] !== on) {
      el[`_c${name}`] = on;
      el.classList.toggle(name, on);
    }
  };
  /* a partial stroke, from..to of a pathLength="1" path; hidden when empty */
  const dash = (el, to, o = 1, from = 0) => {
    const len = Math.max(0, to - from);
    set(el, 'stroke-dasharray', `${len.toFixed(4)} 2`);
    set(el, 'stroke-dashoffset', (-from).toFixed(4));
    set(el, 'opacity', len > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };
  const move = (el, x, y, o, s = 1) => {
    attr(el, 'transform', `translate(${f2(x)} ${f2(y)})${s === 1 ? '' : ` scale(${s.toFixed(3)})`}`);
    set(el, 'opacity', o.toFixed(3));
  };
  /* a trail: drawn behind its traveller, then kept as a faint record */
  const trail = (r, u, tEnd, t) => dash(r.trail, u, 1 - 0.62 * span(t, tEnd, tEnd + 0.7));

  let introAt = -1;
  function drawIntro(t) {
    if (t === introAt) return;
    introAt = t;
    const gap = Math.min(0.05, 0.6 / intro.length);
    intro.forEach(([el, kind], i) => {
      const p = arrive(clamp((t - gap * i) / 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });
  }

  function draw(t, dt) {
    ptr.update(dt);
    drawIntro(Math.min(t, 2));

    // the clock: twelve ticks of the minute hand, 6:00 to 7:00; then it creeps on
    const step = Math.min(12, Math.max(0, Math.floor((t - TICK0) / TICK)));
    const within = step < 12 ? snap(span(t - TICK0 - step * TICK, 0, 0.08)) : 0;
    const creep = Math.max(0, t - SETTLE) * 0.5;
    const minutes = 30 * (step + within) + creep;
    attr(minHand, 'transform', `rotate(${f2(minutes)} ${C.x} ${C.y})`);
    attr(hourHand, 'transform', `rotate(${f2(180 + minutes / 12)} ${C.x} ${C.y})`);
    const seven = snap(span(t, T7, T7 + 0.24));
    set(monday, 'opacity', (seven * (1 - 0.35 * span(t, DONE, DONE + 1))).toFixed(3));
    set(sunday, 'opacity', (0.5 * (1 - span(t, T7, T7 + 0.3)) * span(t, 0.4, 0.9)).toFixed(3));
    const ring = pulse(t, T7, 0.3);
    attr(clock, 'r', f2(C.r + 2.5 * ring));
    flag(clock, 'is-lit', t >= T7 && t < SPARK[1] + 0.4);
    flag(days[0], 'is-lit', t >= T7);

    // the spark to the square, the square starts the run, the token travels to AI
    const s0 = span(t, SPARK[0], SPARK[1]);
    trail(r0, s0, SPARK[1], t);
    const go = pulse(t, SPARK[1], 0.26);
    attr(square, 'transform', `translate(${SQ.x} ${SQ.y}) scale(${(1 + 0.14 * go).toFixed(3)}) translate(${-SQ.x} ${-SQ.y})`);
    flag(square, 'is-lit', t >= SPARK[1] && t < RUN[1] + 0.3);
    const u1 = travel(span(t, RUN[0], RUN[1]));
    trail(r1, u1, RUN[1], t);
    let [tx, ty] = r1.at(u1);
    let tokenOn = t >= SPARK[1] && t < RUN[1] ? 1 : 0;
    if (t < SPARK[1]) {
      [tx, ty] = r0.at(s0);
      tokenOn = t >= SPARK[0] ? 0.8 : 0;
    } else if (t >= LIST[0]) { // the run sends you the list
      const u4 = travel(span(t, LIST[0], LIST[1]));
      [tx, ty] = r4.at(u4);
      tokenOn = 1 - span(u4, 0.85, 1);
    }
    trail(r4, travel(span(t, LIST[0], LIST[1])), LIST[1], t);
    move(dot, tx, ty, tokenOn, t < SPARK[1] ? 0.6 : 1);
    move(halo2, tx, ty, tokenOn * 0.9, t < SPARK[1] ? 0.6 : 1);

    // research: out to each source and back with what is new; AI swells as it gathers
    let gathered = 0;
    rays.forEach((r, k) => {
      const out = RAY0 + k * 0.14;
      const back0 = out + 0.55;
      const p = travel(span(t, out, out + 0.4));
      const q = travel(span(t, back0, back0 + 0.5));
      if (t < back0) dash(r.trail, p, 0.9, Math.max(0, p - 0.25));
      else dash(r.trail, 1, 0.9 - 0.56 * span(t, back0 + 0.5, back0 + 1.2), 1 - q);
      flag(sources[k], 'is-lit', t >= out + 0.4 && t < back0 + 0.5);
      const [ix, iy] = r.at(1 - q);
      const fall = FALL0 + k * 0.1;
      if (t < fall) {
        move(items[k], ix, iy, t >= back0 ? 1 - span(t, back0 + 0.4, back0 + 0.5) : 0);
      } else {
        const v = travel(span(t, fall, fall + 0.7));
        const [fx, fy] = r2.at(v);
        move(items[k], fx, fy, span(v, 0, 0.08) * (1 - span(v, 0.9, 1)));
      }
      if (t >= back0 + 0.5) gathered += 1;
    });
    const swell = gathered * 0.25 * (1 - span(t, FALL0, FALL0 + 0.6));
    attr(halo, 'r', f2(19 + 3 * swell + 2 * pulse(t, RUN[1], 0.3)));
    attr(disc, 'r', f2(11 + 1.5 * pulse(t, RUN[1], 0.3)));
    trail(r2, travel(span(t, FALL0, FALL0 + 0.7)), FALL0 + 0.8, t);

    // the rule book: lit while the items pass through it, a scan down its pages
    flag(book, 'is-lit', t >= FALL0 + 0.6 && t < SCAN[1] + 0.3);
    const sc = span(t, SCAN[0], SCAN[1]);
    const sy = y0 + 8 + (y1 - y0 - 12) * travel(sc);
    attr(scan, 'transform', `translate(0 ${f2(sy)})`);
    set(scan, 'opacity', (sc > 0 && sc < 1 ? Math.sin(Math.PI * sc) : 0).toFixed(3));
    rules.forEach((rule, i) => flag(rule, 'is-lit', sc > 0 && Math.abs(sy - (y0 + 16 + i * 12)) < 9));

    // three briefs, one form: out of the book, along the route, into the tray
    briefs.forEach((g, j) => {
      const t0 = OUT0 + j * OUT_GAP;
      const v = travel(span(t, t0, t0 + OUT_LEN));
      const land = span(t, t0 + OUT_LEN - 0.05, t0 + OUT_LEN + 0.25);
      let [x, y] = r3.at(v);
      if (land > 0) {
        const s = snap(land);
        x += (SLOTS[j] - x) * s;
        y += (LAND_Y - y) * s;
      }
      const grow = 0.55 + 0.45 * arrive(span(t, t0, t0 + 0.35));
      move(g, x, y, t < t0 ? 0 : arrive(span(t, t0, t0 + 0.2)), grow);
      flag(g, 'is-moving', t >= t0 && land < 1);
    });
    trail(r3, travel(span(t, OUT0, OUT0 + OUT_LEN)), OUT0 + 2 * OUT_GAP + OUT_LEN, t);
    attr(you, 'r', f2(12 + 2.4 * pulse(t, DONE - 0.05, 0.3)));
    const held = t > DONE + 0.2 ? 0.3 * breath(t - DONE - 0.2, 3.1) : 0;
    attr(badge, 'r', f2(3.6 * snap(span(t, DONE - 0.05, DONE + 0.2)) + held));

    // labels follow the run
    const active = {
      schedule: t >= T7 - 0.2 && t < RUN[0],
      research: t >= RUN[1] && t < FALL0 + 0.3,
      brand: t >= FALL0 + 0.6 && t < OUT0 + 0.2,
      briefs: t >= OUT0 + 0.6,
    };
    Object.entries(labels).forEach(([part, label]) => flag(label, 'is-active', active[part]));

    // ambient: the wash breathes and drifts slowly; on hover it leans 4px toward the pointer
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
    const wx = ptr.x * 4 * kpx + 6 * Math.sin((2 * Math.PI * t) / 23);
    const wy = ptr.y * 4 * kpx + 5 * Math.sin((2 * Math.PI * t) / 31);
    attr(wash, 'transform', `translate(${f2(wx)} ${f2(wy)})`);
  }

  loop(stage, draw, { still: STILL });
}
