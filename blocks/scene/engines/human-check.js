/**
 * Scene engine `human-check`: the Sites and AI webinar deck, slide "03 - Three kinds of checks:
 * Human, deterministic and agentic", the first of its three cards ("Human checks").
 *
 * What it shows: a person (the ink ring) reading the page against the brief, then making the
 * call. The page is the one all three cards share (left: a title, two passages, an image, ruled
 * lines, never words), here with a margin; the brief is a short card laid a little askew at the
 * right (a title and four points). The ring reads down beside the page at a person's pace: it
 * stops on lines, skims, goes back up once to re-read. At the end of each section it glances at
 * the brief (a dotted sight line) and ticks the point that section answers. One section doesn't
 * hold up: the ring leans in, a hand loop circles the phrase and a short note is written in the
 * margin, and that point on the brief stays unticked. Then the ring goes to the call box under
 * the brief and draws a firm tick through it, past the corner as a hand does: a press, a snap,
 * and it steps back beside it. There is no accent: ink carries the whole picture (the card's
 * neighbours, the deterministic and agentic checks, carry automation's and AI's marks).
 *
 * Story (played once from t = 0): construction draws on 0 to 0.8 s; the ring reads from 0.5 s,
 * glancing at the brief at about 1.3, 2.5, 4.2 (the miss) and 6.8 s; the loop and the margin
 * note from 5.1 s; the call from 7.75 s (the tick at 8.35 s); settled by about 9.4 s. Then it
 * holds: the wash breathes (2%) and the ring drifts a unit. Reduced motion shows that end state.
 *
 * Parts (rows):
 * - `page`: over the page, top left; a leader down to the page's top edge.
 * - `brief`: over the brief, top right; a leader down to the brief's top edge.
 * - `call`: under the call box, centred; a leader up to the box. It turns ink when the tick
 *   lands.
 */
const W = 500;
const TOP = 96;
const PAGE = { // the page every card on the slide shares
  x: 52, y: TOP, w: 184, h: 304,
};
const BRIEF = {
  x: 300, y: TOP, w: 144, h: 166,
};
const TILT = (2 * Math.PI) / 180; // the brief lies a little askew, as a sheet put down by hand
const BC = [BRIEF.x + BRIEF.w / 2, BRIEF.y + BRIEF.h / 2];
const RAIL = 264; // the ring reads down beside the page
const RING = 7.5;
const ITEMS = [156, 184, 212, 240]; // the brief's four points
const ILEN = [70, 54, 76, 60];
const TICK_X = 324; // where a point's tick goes (brief coordinates)
const OFF = 2; // the point the page doesn't meet
const BOX = { x: 318, y: 306, s: 38 }; // the call
const BOX_C = BOX.x + BOX.s / 2;
const TICK = [[327, 325], [336, 336], [345, 321], [365, 293]]; // down, then a long flick up
const REST = [290, 326];
const LIFT = [322, 276]; // the arc's control point, above the box
const PHRASE = [128, 262]; // the circled phrase, on the third passage's middle line
const STILL = 11;

/* the reading: [start, duration, x, y], one move at a time (a person's pace, not a metronome) */
const MOVES = [
  [0.95, 0.2, RAIL, 141],
  [1.8, 0.28, RAIL, 172],
  [2.2, 0.2, RAIL, 196],
  [3.05, 0.3, RAIL, 249],
  [3.45, 0.2, RAIL, 275],
  [3.78, 0.24, RAIL, 262], // back up to re-read
  [4.75, 0.34, 250, 262], // leans in to the phrase
  [6.2, 0.4, RAIL, 310],
  [7.35, 0.22, RAIL, 356], // skims the end
  [7.75, 0.55, TICK[0][0], TICK[0][1]], // to the call box
];
const APPEAR = 0.5;
const GLANCES = [1.25, 2.5, 4.2, 6.8]; // brief point i is looked up at GLANCES[i]
const LOOK = 0.2; // the sight line goes out
const HOLD = [0.3, 0.3, 0.5, 0.3];
const LOOP_T = 5.1;
const NOTE_T = 5.52;
const TRACE_T = 8.35;
const TRACE_D = 0.3;
const PRESS = TRACE_T + TRACE_D;
const SETTLE = PRESS + 0.7;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => (d <= 0 ? Number(t >= a) : clamp((t - a) / d));
const bump = (t, a, d) => Math.sin(Math.PI * span(t, a, d));

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
const write = bezier(0.4, 0, 0.6, 1); // a hand's steady stroke
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const f2 = (v) => v.toFixed(2);
const pts = (list) => `M${list.map(([x, y]) => `${f2(x)} ${f2(y)}`).join('L')}`;

/** A point of the brief as it lies on the desk (turned by TILT about its centre). */
function rot([x, y]) {
  const [cx, cy] = BC;
  const c = Math.cos(TILT);
  const s = Math.sin(TILT);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

/** A hand-drawn loop around a phrase: it starts top right, goes round once and overshoots. */
function loopPath([cx, cy], rx, ry) {
  const out = [];
  const n = 60;
  const start = -Math.PI / 2 + 0.75;
  const sweep = -(2 * Math.PI + 0.6);
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    const th = start + sweep * u;
    const k = 1 + 0.05 * Math.sin(3 * th + 0.6) + 0.07 * u; // the hand drifts out as it closes
    out.push([cx + rx * k * Math.cos(th) + 2 * u, cy + ry * k * Math.sin(th) + 1.4 * u]);
  }
  return pts(out);
}

/** A line of handwriting in the margin: small joined, slanted loops (a prolate cycloid), never
 * letters. */
function scribble(x0, y0, len, phase) {
  const out = [];
  const a = 1.3;
  const b = 2.3;
  for (let s = 0; s <= len / a; s += 0.22) {
    const c = 2.4 + 0.75 * Math.sin(s * 0.45 + phase);
    const dy = -c * Math.cos(s) - 0.04 * s;
    out.push([x0 + a * s - b * Math.sin(s) - 0.4 * dy, y0 + dy]);
  }
  return pts(out);
}

/** The call's tick as a lookup by arc length, for the ring that draws it. */
function tickTrack() {
  const [a, b, q, c] = TICK;
  const list = [];
  for (let i = 0; i <= 6; i += 1) {
    const u = i / 6;
    list.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  for (let i = 1; i <= 20; i += 1) {
    const u = i / 20;
    const v = 1 - u;
    const at = (o) => v * v * b[o] + 2 * v * u * q[o] + u * u * c[o];
    list.push([at(0), at(1)]);
  }
  const lens = [0];
  for (let i = 1; i < list.length; i += 1) {
    lens.push(lens[i - 1] + Math.hypot(list[i][0] - list[i - 1][0], list[i][1] - list[i - 1][1]));
  }
  const total = lens[lens.length - 1];
  return (u) => {
    const d = clamp(u) * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < d) i += 1;
    const k = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
    const [p, n] = [list[i - 1], list[i]];
    return [p[0] + (n[0] - p[0]) * k, p[1] + (n[1] - p[1]) * k];
  };
}
const tickAt = tickTrack();

/* the page's content: [path, weight, opacity, kind]; a single ruled line lights as it is read */
const RULED = (x0, ys, ends) => ys.map((y, i) => [`M${x0} ${y}H${ends[i]}`, 1.25, 0.42]);
const PAGE_ART = [
  ['M66 110H82M206 110h1.5M211.5 110h1.5M217 110h1.5', 1, 0.35],
  ['M66 128H150', 2.2, 0.82],
  ...RULED(66, [141], [168]),
  ['M66 172H118', 1.6, 0.7],
  ...RULED(66, [185, 196, 207], [174, 168, 146]),
  ['M66 236H112', 1.6, 0.7],
  ...RULED(66, [249, 262, 275], [172, 176, 134]),
  ['M66 298H126V340H66Z', 1, 0.5, 'tint'],
  ['M70 336L86 320L96 329L105 322L122 337', 1, 0.5],
  ...RULED(136, [304, 315, 326], [174, 164, 170]),
  ...RULED(66, [358, 369], [174, 140]),
];
const LINE_Y = /^M[\d.]+ ([\d.]+)H[\d.]+$/;

/** Where the ring is at t, before the call's trace takes over. */
function ringAt(t) {
  let x = RAIL;
  let y = 128;
  for (let i = 0; i < MOVES.length; i += 1) {
    const [at, d, mx, my] = MOVES[i];
    if (t <= at) break;
    const p = travel(span(t, at, d));
    x += (mx - x) * p;
    y += (my - y) * p;
  }
  return [x, y];
}

export default function engine(block, kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `human-check-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'human-check-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'human-check-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'human-check-wash-stop' }, grad);

  const intro = []; // [element, kind, delay]: 'draw' by dash, 'fade' by opacity
  const add = (name, attrs, parent, kind, delay) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind, delay]);
    return el;
  };
  const wash = svg('circle', {
    cx: 250, cy: 248, r: 230, fill: `url(#${id}-wash)`,
  }, root);

  // the page: its sheet, the margin rule, its content
  const page = svg('g', {}, root);
  add('rect', {
    x: PAGE.x, y: PAGE.y, width: PAGE.w, height: PAGE.h, rx: 4, class: 'human-check-s', pathLength: 1,
  }, page, 'draw', 0.05);
  add('path', { d: `M184 ${TOP + 26}V${TOP + PAGE.h - 22}`, class: 'human-check-c', pathLength: 1 }, page, 'draw', 0.3);
  const lines = [];
  PAGE_ART.forEach(([d, w, o, kind], i) => {
    const el = add('path', {
      d, style: `--w: ${w}`, 'stroke-opacity': o, class: kind ? `human-check-${kind}` : null,
    }, page, 'fade', 0.15 + i * 0.025);
    const m = d.match(LINE_Y);
    if (m) lines.push({ el, y: Number(m[1]), o });
  });

  // the brief: a short card, askew, a title and four points, each with a tick waiting for it
  const brief = svg('g', { transform: `rotate(${f2((TILT * 180) / Math.PI)} ${BC[0]} ${BC[1]})` }, root);
  add('rect', {
    x: BRIEF.x, y: BRIEF.y, width: BRIEF.w, height: BRIEF.h, rx: 4, class: 'human-check-s', pathLength: 1,
  }, brief, 'draw', 0);
  add('path', { d: `M${BRIEF.x + 16} 118H${BRIEF.x + 76}`, style: '--w: 2.2', 'stroke-opacity': 0.82 }, brief, 'fade', 0.12);
  add('path', { d: `M${BRIEF.x + 16} 130H${BRIEF.x + 120}`, style: '--w: 0.9', 'stroke-opacity': 0.36 }, brief, 'fade', 0.16);
  const points = ITEMS.map((y, i) => {
    add('path', { d: `M${BRIEF.x + 38} ${y}h4`, style: '--w: 1.6', 'stroke-opacity': 0.6 }, brief, 'fade', 0.2 + i * 0.06);
    const line = add('path', {
      d: `M${BRIEF.x + 48} ${y}H${BRIEF.x + 48 + ILEN[i]}`, style: '--w: 1.25', 'stroke-opacity': 0.5,
    }, brief, 'fade', 0.22 + i * 0.06);
    const tick = i === OFF ? null : svg('path', {
      d: `M${TICK_X - 4.5} ${y + 0.5}L${TICK_X - 1.2} ${y + 4}L${TICK_X + 5} ${y - 4.5}`, class: 'human-check-mark', pathLength: 1,
    }, brief);
    return { line, tick, eye: rot([TICK_X - 11, y]) };
  });

  // the person's marks on the page: a loop round the phrase, a leader, a two-line margin note
  const marks = svg('g', {}, root);
  const circled = svg('path', { d: loopPath(PHRASE, 33, 9), class: 'human-check-mark is-loop', pathLength: 1 }, marks);
  const lead = svg('path', { d: 'M166 257Q176 246 189 249', class: 'human-check-mark is-thin', pathLength: 1 }, marks);
  const note = [
    svg('path', { d: scribble(193, 251, 34, 0.4), class: 'human-check-mark is-hand', pathLength: 1 }, marks),
    svg('path', { d: scribble(193, 265, 22, 2.1), class: 'human-check-mark is-hand', pathLength: 1 }, marks),
  ];

  // the call: a box under the brief, and the tick the ring draws through it
  const box = add('rect', {
    x: BOX.x, y: BOX.y, width: BOX.s, height: BOX.s, rx: 4, class: 'human-check-box', pathLength: 1,
  }, root, 'draw', 0.35);
  const [ta, tb, tq, tc] = TICK;
  const tick = svg('path', {
    d: `M${ta[0]} ${ta[1]}L${tb[0]} ${tb[1]}Q${tq[0]} ${tq[1]} ${tc[0]} ${tc[1]}`, class: 'human-check-tick', pathLength: 1,
  }, root);

  // the glance: a dotted sight line from the ring to the brief's point
  const sight = svg('path', { d: 'M0 0', class: 'human-check-sight' }, root);

  // the person: the ink ring
  const ring = svg('circle', { r: RING, class: 'human-check-ring' }, root);

  // callouts
  const leader = (x0, y0, x1, y1, delay) => {
    add('path', { d: `M${f2(x0)} ${f2(y0)}L${f2(x1)} ${f2(y1)}`, class: 'human-check-leader', pathLength: 1 }, root, 'draw', delay);
    add('circle', {
      cx: f2(x1), cy: f2(y1), r: 1.8, class: 'human-check-pin',
    }, root, 'fade', delay + 0.1);
  };
  const [bpx, bpy] = rot([BRIEF.x + 12, TOP]);
  if (place('brief', bpx - 10, TOP - 44, W, 'left')) leader(bpx, TOP - 26, bpx, bpy - 3, 0.5);
  if (place('page', PAGE.x, TOP - 44, W, 'left')) leader(PAGE.x + 10, TOP - 26, PAGE.x + 10, TOP - 3, 0.55);
  const call = place('call', BOX_C, 388, W, 'center');
  if (call) leader(BOX_C, 370, BOX_C, BOX.y + BOX.s + 3, 0.6);

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
    // construction
    intro.forEach(([el, kind, delay]) => {
      const p = arrive(span(t, delay, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });

    // where the ring is: reading, leaning toward the brief on a glance, then drawing the tick
    let [x, y] = ringAt(t);
    GLANCES.forEach((g, i) => { x += 3 * bump(t, g, LOOK + HOLD[i] + 0.25); });
    if (t > TRACE_T) [x, y] = tickAt((span(t, TRACE_T, TRACE_D)) ** 1.5);
    if (t > PRESS + 0.1) { // it steps back over the box (an arc, so it never covers the tick)
      const p = travel(span(t, PRESS + 0.1, 0.6));
      const v = 1 - p;
      const [[ex, ey], [cx, cy]] = [TICK[3], LIFT];
      x = v * v * ex + 2 * v * p * cx + p * p * REST[0];
      y = v * v * ey + 2 * v * p * cy + p * p * REST[1];
    }
    const drift = span(t, SETTLE, 1.5); // at rest: a unit of drift over 23 s
    x += 0.8 * Math.sin((2 * Math.PI * (t - SETTLE)) / 23) * drift;
    y += 0.6 * Math.sin((2 * Math.PI * (t - SETTLE)) / 31) * drift;
    attr(ring, 'cx', f2(x));
    attr(ring, 'cy', f2(y));
    const shown = arrive(span(t, APPEAR, 0.4));
    set(ring, 'opacity', shown.toFixed(3));
    const press = bump(t, PRESS - 0.04, 0.24);
    attr(ring, 'r', f2(RING * (0.6 + 0.4 * shown) * (1 - 0.16 * press)));
    set(ring, '--rw', f2(1.75 + 0.5 * press));

    // the line being read lights a little, while the ring reads beside the page
    const reading = span(t, APPEAR, 0.3) * (1 - span(t, MOVES[MOVES.length - 1][0], 0.3));
    lines.forEach((ln) => {
      const near = reading * clamp(1 - Math.abs(ln.y - y) / 12);
      set(ln.el, 'stroke-opacity', (ln.o + (0.9 - ln.o) * near).toFixed(3));
    });

    // the glances: the sight line goes out to the brief, the point is ticked, the line fades
    let seen = -1;
    GLANCES.forEach((g, i) => { if (t >= g) seen = i; });
    if (seen < 0) set(sight, 'opacity', '0');
    else {
      const g = GLANCES[seen];
      const out = arrive(span(t, g, LOOK));
      const fade = 1 - span(t, g + LOOK + HOLD[seen], 0.25);
      const [ex, ey] = points[seen].eye;
      const sx = x + RING + 3;
      attr(sight, 'd', `M${f2(sx)} ${f2(y)}L${f2(sx + (ex - sx) * out)} ${f2(y + (ey - y) * out)}`);
      set(sight, 'opacity', (out > 0.01 ? fade : 0).toFixed(3));
    }
    points.forEach((pt, i) => {
      const on = span(t, GLANCES[i] + LOOK * 0.8, 0.28);
      if (pt.tick) dash(pt.tick, write(on));
      if (i !== OFF) set(pt.line, 'stroke-opacity', (0.5 + 0.3 * arrive(on)).toFixed(3));
    });

    // the miss: a loop round the phrase, then the margin note, written at a hand's speed
    dash(circled, write(span(t, LOOP_T, 0.42)));
    dash(lead, arrive(span(t, NOTE_T, 0.16)));
    dash(note[0], write(span(t, NOTE_T + 0.12, 0.28)));
    dash(note[1], write(span(t, NOTE_T + 0.44, 0.2)));

    // the call: the tick is drawn through the box, pressed, and the box firms with it
    dash(tick, span(t, TRACE_T, TRACE_D) ** 1.5);
    set(tick, '--tw', f2(2 + 0.4 * snap(span(t, PRESS - 0.02, 0.24))));
    const firm = arrive(span(t, PRESS, 0.4));
    set(box, 'stroke-opacity', (0.45 + 0.4 * firm).toFixed(3));
    set(box, '--bw', f2(1.25 + 0.35 * firm));
    if (call) call.classList.toggle('is-active', t >= PRESS);

    // ambient: the wash breathes (2%) over 17 s
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
  }

  loop(stage, draw, { still: STILL });
}
