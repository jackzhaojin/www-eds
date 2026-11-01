/**
 * Scene engine `check-pipeline`: the Sites and AI webinar deck, slide "03 - Go further: A
 * page-check dashboard, with Semrush when you have it" (a demo plate, left of the prompt).
 *
 * What it shows: one page check as a pipeline. Your previewed page (the strong card) and two
 * competing pages (the faint ones) each send a token along a row of the same four checks (faint
 * automation squares), which tick in turn; Semrush joins from the side as an optional dashed
 * stream; the rows converge on AI (the accent disc), which reviews it all and sends one result down
 * to a dashboard. The dashboard fills row by row (your bar against the two competitors' marks,
 * the Semrush row dashed), AI flags the gap that matters (an accent mark), and you (the ink ring)
 * decide: your ring closes around the flag.
 *
 * Story (plays once from t = 0, then holds): 0 to 0.8 s the construction draws on; 0.9 to 2.9 s the
 * three tokens run the checks, column by column, while Semrush's token joins; 2.9 to 4.1 s they
 * converge on AI, which reviews; 4.1 to 5.8 s the dashboard fills and AI flags the gap; 6 to 6.7 s
 * you decide. Then it holds: the wash breathes and the flag glows. Reduced motion shows that end.
 *
 * Parts (rows, placed by the engine):
 * - `preview`: above your page (top left).
 * - `checks`: above the four columns of checks (top, center).
 * - `semrush`: above the dashed source (top right).
 * - `dashboard`: hung under the dashboard's left edge (bottom).
 */
const P = 'check-pipeline-';
const MID = 162; // the middle row
const ROWS = [MID - 50, MID, MID + 50]; // your page, then the two competitors
const PG = { x0: 44, w: 60, h: 38 }; // the pages
const COLS = [172, 206, 240, 274]; // the four checks
const SQ = 18;
const AI = { x: 372, y: MID };
const SEM = { x: 436, y: 104 }; // Semrush, optional
const DB = {
  x0: 120, y0: 250, x1: 420, y1: 414,
}; // the dashboard
const TRACK = [DB.x0 + 66, DB.x1 - 18];
const YOU = { x: 80, y: DB.y0 + 70 };
// each dashboard row: your value and the two competitors' (0..1 of the track); row 1 is the gap
const VALUES = [
  [0.82, 0.7, 0.62], [0.42, 0.8, 0.7], [0.9, 0.84, 0.58], [0.66, 0.6, 0.76], [0.56, 0.78, 0.64],
];
const FLAG_ROW = 1;

// the story, in seconds from t = 0
const ENTER = 0.9;
const COL0 = 1.25;
const COL_GAP = 0.42;
const ROW_LAG = 0.08;
const SEM_RUN = [1.9, 2.85];
const MERGE = COL0 + 3 * COL_GAP + 0.38;
const REVIEW = MERGE + 0.75;
const DOWN = [REVIEW + 0.55, REVIEW + 1.0];
const FILL = DOWN[1];
const FLAG = FILL + 1.05;
const DECIDE = FLAG + 0.45;
const SETTLE = DECIDE + 0.8;
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
  const line = (d, names, parent = mech, kind = 'fade') => add('path', { d, class: cls(names) }, parent, kind);
  /* a stroke that draws on later in the story (pathLength 1) */
  const later = (d, names, parent = mech) => svg('path', { d, class: cls(names), pathLength: 1 }, parent);

  /** A route: dotted (or dashed) construction, an accent trail over it, its points sampled once. */
  const route = (d, names = 'route') => {
    const el = add('path', { d, class: cls(names) }, back, 'fade');
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
    return {
      el, trail, at, total,
    };
  };

  // construction: the wash behind the run
  const wash = svg('circle', {
    cx: 250, cy: 250, r: 230, fill: `url(#${id}-wash)`,
  }, back);

  // the routes: each page along its row of checks and on to AI; Semrush; AI down to the dashboard
  const lanes = ROWS.map((y) => route(`M${PG.x0 + PG.w + 3} ${y}H${COLS[3] + 16}C${COLS[3] + 52} ${y} ${AI.x - 50} ${AI.y} ${AI.x - 20} ${AI.y}`));
  const sem = route(`M${SEM.x} ${SEM.y + SQ / 2 + 3}V${AI.y - 20}Q${SEM.x} ${AI.y} ${SEM.x - 20} ${AI.y}H${AI.x + 20}`, 'route is-optional');
  const down = route(`M${AI.x} ${AI.y + 21}V${DB.y0 - 3}`);
  // where each lane meets a check, as a share of the lane (its straight run is the start)
  const atCol = (x) => (x - (PG.x0 + PG.w + 3)) / lanes[0].total;

  const under = svg('g', {}, mech); // the lane tokens pass under the checks, which light

  // the pages: yours strong, the two competitors faint
  const pages = ROWS.map((y, i) => {
    const g = svg('g', { transform: `translate(${PG.x0} ${y - PG.h / 2})` }, mech);
    intro.push([g, 'fade']);
    const names = i ? 'c is-page' : 's';
    svg('rect', {
      width: PG.w, height: PG.h, rx: 4, class: cls(`${names} paper`),
    }, g);
    svg('path', { d: `M0 9H${PG.w}`, class: cls(i ? 'c' : 'c') }, g);
    svg('path', { d: `M8 17H${PG.w - 22}M8 24H${PG.w - 10}M8 30H${PG.w - 18}`, class: cls(i ? 'ink is-faint' : 'ink') }, g);
    return g;
  });

  // the checks: one faint automation square per page and check, each ticks when the run reaches it
  const checks = ROWS.map((y) => COLS.map((x) => {
    const box = add('rect', {
      x: x - SQ / 2, y: y - SQ / 2, width: SQ, height: SQ, rx: 4, class: cls('auto'),
    }, mech, 'fade');
    const tick = later(`M${x - 4.5} ${y + 0.5}L${x - 1.2} ${y + 3.8}L${x + 4.8} ${y - 3.2}`, 'tick');
    return { box, tick };
  }));

  // Semrush: a dashed source, drawn as optional
  add('rect', {
    x: SEM.x - SQ / 2, y: SEM.y - SQ / 2, width: SQ, height: SQ, rx: 4, class: cls('auto is-optional'),
  }, mech, 'fade');

  // AI
  const halo = add('circle', {
    cx: AI.x, cy: AI.y, r: 19, class: cls('ai-halo'),
  }, mech, 'fade');
  const disc = add('circle', {
    cx: AI.x, cy: AI.y, r: 11, class: cls('ai'),
  }, mech, 'fade');

  // the dashboard: a header, then a row per check (and Semrush's, dashed): your bar, their marks
  const { x0: bx0, y0: by0, x1: bx1 } = DB;
  const panel = add('rect', {
    x: bx0, y: by0, width: bx1 - bx0, height: DB.y1 - by0, rx: 8, class: cls('s paper'),
  }, mech, 'fade');
  line(`M${bx0} ${by0 + 26}H${bx1}`, 'c');
  const header = later(`M${bx0 + 16} ${by0 + 14}H${bx0 + 70}`, 'ink is-bold');
  const len = TRACK[1] - TRACK[0];
  const rows = VALUES.map(([you, c1, c2], i) => {
    const y = by0 + 46 + i * 26;
    const optional = i === VALUES.length - 1 ? ' is-optional' : '';
    line(`M${bx0 + 16} ${y}H${bx0 + 50 - (i % 2) * 8}`, `ink is-faint${optional}`);
    line(`M${TRACK[0]} ${y}H${TRACK[1]}`, `track${optional}`);
    const g = svg('g', {}, mech);
    svg('path', { d: `M${bx0 + 16} ${y}H${bx0 + 50 - (i % 2) * 8}`, class: cls(`ink${optional}`) }, g);
    const bar = later(`M${TRACK[0]} ${y}H${f2(TRACK[0] + you * len)}`, `bar${optional}`, g);
    const marks = svg('path', { d: [c1, c2].map((c) => `M${f2(TRACK[0] + c * len)} ${y - 5}V${y + 5}`).join(''), class: cls('mark') }, g);
    return {
      g, bar, marks, y, you, best: Math.max(c1, c2),
    };
  });
  const flagRow = rows[FLAG_ROW];
  const fx = TRACK[0] + flagRow.you * len;
  const gap = later(`M${f2(fx + 6)} ${flagRow.y}H${f2(TRACK[0] + flagRow.best * len - 3)}`, 'gap');
  const flag = svg('circle', {
    cx: f2(fx), cy: flagRow.y, r: 0, class: cls('dot'),
  }, mech);

  // you: the ink ring, the line to the row you pick, your ring around AI's flag
  const you = add('circle', {
    cx: YOU.x, cy: YOU.y, r: 12, class: cls('you'),
  }, mech, 'fade');
  const reach = later(`M${YOU.x + 16} ${YOU.y}H${bx0 + 10}`, 's');
  const ring = later(`M${f2(fx)} ${flagRow.y - 8}A8 8 0 1 1 ${f2(fx - 0.01)} ${flagRow.y - 8}`, 'you is-small');

  // the tokens: yours accent, the competitors' ink, Semrush's faint; one down to the dashboard
  const tokens = ROWS.map((_, i) => ({
    halo: i ? null : svg('circle', { r: 10, class: cls('halo') }, under),
    dot: svg('circle', { r: i ? 3.4 : 4.5, class: cls(i ? 'dot-ink' : 'dot') }, under),
  }));
  const semDot = svg('circle', { r: 3.4, class: cls('dot is-optional') }, front);
  const mainHalo = svg('circle', { r: 10, class: cls('halo') }, front);
  const mainDot = svg('circle', { r: 4.5, class: cls('dot') }, front);

  // leaders and labels: [part, pin x, pin y, end x, end y, label x, label y, align]
  const top = ROWS[0] - SQ / 2;
  const callouts = [
    ['preview', PG.x0 + PG.w / 2, ROWS[0] - PG.h / 2 - 1, PG.x0 + PG.w / 2, 82, PG.x0 + PG.w / 2, 79, 'bottom'],
    ['checks', (COLS[1] + COLS[2]) / 2, top - 2, (COLS[1] + COLS[2]) / 2, 82, (COLS[1] + COLS[2]) / 2, 79, 'bottom'],
    ['semrush', SEM.x, SEM.y - SQ / 2 - 1, SEM.x, 82, SEM.x, 79, 'bottom'],
    ['dashboard', bx0 + 12, DB.y1 + 1, bx0 + 12, DB.y1 + 10, bx0 - 1, DB.y1 + 23, 'left'],
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
  const flagOn = (el, name, on) => {
    if (el[`_c${name}`] !== on) {
      el[`_c${name}`] = on;
      el.classList.toggle(name, on);
    }
  };
  /* a partial stroke, 0..to of a pathLength="1" path; hidden when empty */
  const dash = (el, to, o = 1) => {
    set(el, 'stroke-dasharray', `${to.toFixed(4)} 2`);
    set(el, 'opacity', to > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };
  const move = (el, [x, y], o) => {
    attr(el, 'transform', `translate(${f2(x)} ${f2(y)})`);
    set(el, 'opacity', o.toFixed(3));
  };

  let introAt = -1;
  function drawIntro(t) {
    if (t === introAt) return;
    introAt = t;
    const gapT = Math.min(0.04, 0.6 / intro.length);
    intro.forEach(([el, kind], i) => {
      const p = arrive(clamp((t - gapT * i) / 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });
  }

  /* where a lane's token is at t: into the first check, check to check, then on to AI */
  const laneAt = (t, r) => {
    const lag = r * ROW_LAG;
    if (t < COL0 + lag) return atCol(COLS[0]) * travel(span(t, ENTER + lag, COL0 + lag));
    for (let c = 1; c < 4; c += 1) {
      const t0 = COL0 + lag + (c - 1) * COL_GAP + 0.2;
      if (t < t0 + COL_GAP - 0.2) {
        const v = travel(span(t, t0, t0 + COL_GAP - 0.2));
        return atCol(COLS[c - 1]) + (atCol(COLS[c]) - atCol(COLS[c - 1])) * v;
      }
    }
    const t0 = MERGE + r * 0.06;
    return atCol(COLS[3]) + (1 - atCol(COLS[3])) * travel(span(t, t0, t0 + 0.6));
  };

  function draw(t, dt) {
    ptr.update(dt);
    drawIntro(Math.min(t, 2));

    // the three runs through the checks; each square ticks as its token reaches it
    let absorbed = 0;
    lanes.forEach((lane, r) => {
      const u = laneAt(t, r);
      const end = MERGE + r * 0.06 + 0.6;
      dash(lane.trail, u, (r ? 0.45 : 1) * (1 - 0.62 * span(t, end, end + 0.7)));
      const t0 = ENTER + r * ROW_LAG;
      const o = Math.min(span(t, t0, t0 + 0.1), 1 - span(t, end - 0.08, end));
      const p = lane.at(u);
      move(tokens[r].dot, p, o * (r ? 0.6 : 1));
      if (tokens[r].halo) move(tokens[r].halo, p, o);
      if (t >= end) absorbed += 1;
      COLS.forEach((x, c) => {
        const at = COL0 + r * ROW_LAG + c * COL_GAP;
        dash(checks[r][c].tick, arrive(span(t, at + 0.04, at + 0.2)), r ? 0.55 : 1);
        flagOn(checks[r][c].box, 'is-lit', !r && t >= at - 0.04 && t < at + 0.3);
      });
    });
    pages.forEach((g, r) => {
      const t0 = ENTER + r * ROW_LAG;
      attr(g, 'transform', `translate(${PG.x0} ${f2(ROWS[r] - PG.h / 2 - 2 * pulse(t, t0 - 0.05, 0.3))})`);
    });

    // Semrush joins, faint and dashed
    const su = travel(span(t, SEM_RUN[0], SEM_RUN[1]));
    const semOn = Math.min(span(t, SEM_RUN[0], SEM_RUN[0] + 0.1), 1 - span(su, 0.92, 1));
    move(semDot, sem.at(su), semOn);
    dash(sem.trail, su, 0.35 * (1 - 0.6 * span(t, SEM_RUN[1], SEM_RUN[1] + 0.7)));

    // AI swells as the runs arrive, reviews with two beats, then sends one result down
    const review = pulse(t, REVIEW, 0.3) + pulse(t, REVIEW + 0.3, 0.3);
    const swell = (absorbed + (t >= SEM_RUN[1] ? 1 : 0)) * (1 - span(t, DOWN[0], DOWN[0] + 0.4));
    attr(halo, 'r', f2(19 + 1 * swell + 4 * review));
    attr(disc, 'r', f2(11 + 1.2 * review));
    const du = travel(span(t, DOWN[0], DOWN[1]));
    const dOn = t >= DOWN[0] && t < DOWN[1] + 0.1 ? 1 - span(t, DOWN[1], DOWN[1] + 0.1) : 0;
    move(mainDot, down.at(du), dOn);
    move(mainHalo, down.at(du), dOn);
    dash(down.trail, du, 1 - 0.62 * span(t, DOWN[1], DOWN[1] + 0.7));

    // the dashboard fills; AI flags the gap
    flagOn(panel, 'is-lit', t >= DOWN[1] && t < FLAG + 0.3);
    dash(header, arrive(span(t, FILL, FILL + 0.3)));
    rows.forEach((row, i) => {
      const t0 = FILL + 0.12 + i * 0.13;
      set(row.g, 'opacity', arrive(span(t, t0, t0 + 0.25)).toFixed(3));
      dash(row.bar, arrive(span(t, t0 + 0.05, t0 + 0.55)));
      set(row.marks, 'opacity', arrive(span(t, t0 + 0.3, t0 + 0.55)).toFixed(3));
    });
    const glow = t > SETTLE ? 0.35 * breath(t - SETTLE, 3.1) : 0;
    attr(flag, 'r', f2(4 * snap(span(t, FLAG, FLAG + 0.26)) + glow));
    dash(gap, arrive(span(t, FLAG + 0.1, FLAG + 0.45)));

    // you decide: the ring answers, reaches the row, and closes around the flag
    attr(you, 'r', f2(12 + 2.4 * pulse(t, DECIDE, 0.3)));
    dash(reach, arrive(span(t, DECIDE + 0.1, DECIDE + 0.45)));
    dash(ring, arrive(span(t, DECIDE + 0.35, DECIDE + 0.7)));

    // labels follow the run
    const active = {
      preview: t >= ENTER - 0.1 && t < COL0 + 0.1,
      checks: t >= COL0 && t < MERGE,
      semrush: t >= SEM_RUN[0] && t < SEM_RUN[1] + 0.1,
      dashboard: t >= FILL,
    };
    Object.entries(labels).forEach(([part, label]) => flagOn(label, 'is-active', active[part]));

    // ambient: the wash breathes and drifts slowly; on hover it leans 4px toward the pointer
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
    const wx = ptr.x * 4 * kpx + 6 * Math.sin((2 * Math.PI * t) / 23);
    const wy = ptr.y * 4 * kpx + 5 * Math.sin((2 * Math.PI * t) / 31);
    attr(wash, 'transform', `translate(${f2(wx)} ${f2(wy)})`);
  }

  loop(stage, draw, { still: STILL });
}
