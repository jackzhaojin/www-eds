/**
 * Scene engine `news-radar`: the Sites and AI webinar deck, stage 01 (research and briefs), the
 * offer card "It keeps watching".
 *
 * What it shows: research that runs itself every week. A dial is the week, seven day ticks round
 * its rim with Monday at the top; five sources (small pages) sit inside it. The AI (the accent
 * disc) is at the hub, and its arm sweeps the dial once, clockwise, a fading wake behind it and
 * the elapsed week drawn on the rim. Each source it passes is checked; where one has something
 * new it pings, and an accent dot leaves it for a tray on the right, where it lands as the bullet
 * of a new card. Three of the five have news, so three cards stack up. The arm comes back to
 * Monday, which ticks once in the accent.
 *
 * Story (plays once from t = 0, then holds): to 1.2 s the dial, the sources and the tray draw on
 * and the arm grows out of the hub; 1.2 to 6.8 s one turn (pings at about 2.2, 3.6 and 4.8 s, each
 * dot 1.1 s in flight, the last card in by 6.1 s); 6.8 s back at Monday. From 7.6 s it holds:
 * three new cards, the arm at Monday, the halo and wash breathing, the dotted ring drifting.
 * Reduced motion shows that end state.
 *
 * Parts (rows):
 * - `week`: above the dial, centered on Monday's tick; its leader drops to the tick.
 * - `new`: under the tray, centered; its leader rises to the tray's floor.
 */
const W = 500;
const STILL = 9.4;
const DEG = Math.PI / 180;

const CX = 194;
const CY = 270;
const R = 158;
const MONDAY = -90;
// the sources: [angle (degrees, clockwise from east), radius (of R), has news]
const SOURCES = [[-46, 0.7, 1], [-12, 0.5, 0], [62, 0.78, 1], [148, 0.64, 1], [218, 0.8, 0]];
const TRAY = {
  x: 372, y: 204, w: 88, h: 116,
};
const CARD_W = 76;
const CARD_H = 28;
const TURN0 = 1.2;
const TURN1 = 6.8;
const FLY = 1.1;
const WAKE = 8; // sectors in the arm's wake, 6 degrees each

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
const f2 = (v) => v.toFixed(2);
const polar = (a, r) => [CX + r * Math.cos(a * DEG), CY + r * Math.sin(a * DEG)];

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
/** A 0..1..0 pulse over [t0, t0 + d]: a snap up, a slow fall. */
const pulse = (t, t0, d) => {
  if (t < t0) return 0;
  return Math.min(1, snap(span(t, t0, 0.2))) * (1 - span(t, t0 + 0.2, d));
};

/** The turn: constant speed with eased ends (spins up, settles). Position and speed at u. */
const A = 0.14;
const V = 1 / (1 - A);
function turn(u) {
  if (u <= 0) return [0, 0];
  if (u >= 1) return [1, 0];
  if (u < A) return [(V * u * u) / (2 * A), u / A];
  if (u > 1 - A) return [1 - (V * (1 - u) ** 2) / (2 * A), (1 - u) / A];
  return [V * (u - A / 2), 1];
}
/** When the arm passes an angle. */
function passes(angle) {
  const p = ((((angle - MONDAY) % 360) + 360) % 360) / 360;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    if (turn(mid)[0] < p) lo = mid;
    else hi = mid;
  }
  return TURN0 + lo * (TURN1 - TURN0);
}

/** A cubic curve sampled once at equal arc length: at(u) is the point a fraction u along it. */
function curve(p0, p1, p2, p3) {
  const n = 64;
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const s = i / n;
    const m = 1 - s;
    const b = [m ** 3, 3 * m * m * s, 3 * m * s * s, s ** 3];
    pts.push([0, 1].map((c) => b[0] * p0[c] + b[1] * p1[c] + b[2] * p2[c] + b[3] * p3[c]));
  }
  const cum = [0];
  for (let i = 1; i <= n; i += 1) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const at = (u) => {
    const d = clamp(u) * cum[n];
    let i = 1;
    while (i < n && cum[i] < d) i += 1;
    const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [0, 1].map((c) => pts[i - 1][c] + (pts[i][c] - pts[i - 1][c]) * f);
  };
  return { at, d: `M${p0.map(f2)}C${p1.map(f2)} ${p2.map(f2)} ${p3.map(f2)}` };
}

export default function engine(block, kit) {
  const {
    stage, svg, place, parts, loop, pointer, reduceMotion,
  } = kit;
  const id = `news-radar-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'news-radar-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: 0, class: 'news-radar-stop' }, grad);
  svg('stop', { offset: 1, class: 'news-radar-stop' }, grad);
  const back = svg('g', {}, root);
  const dial = svg('g', {}, root);
  const fore = svg('g', {}, root);
  const marks = svg('g', {}, root);

  const washEl = svg('circle', {
    cx: CX, cy: CY, r: 210, fill: `url(#${id}-wash)`,
  }, back);

  // construction: two inner rings (the outer one dotted, drifting), the rim, the elapsed week
  const inner = svg('circle', {
    cx: CX, cy: CY, r: R * 0.36, class: 'news-radar-c',
  }, dial);
  const drift = svg('circle', {
    cx: CX, cy: CY, r: R * 0.7, class: 'news-radar-c is-dotted',
  }, dial);
  const rimD = `M${CX} ${CY - R}A${R} ${R} 0 1 1 ${CX} ${CY + R}A${R} ${R} 0 1 1 ${CX} ${CY - R}`;
  const rim = svg('path', { d: rimD, class: 'news-radar-rim', pathLength: 1 }, dial);
  const elapsed = svg('path', { d: rimD, class: 'news-radar-elapsed', pathLength: 1 }, dial);

  // the days: seven ticks across the rim, Monday's long and bold
  const days = Array.from({ length: 7 }, (_, k) => {
    const a = MONDAY + (k * 360) / 7;
    const e = k ? 7 : 11;
    const [x0, y0] = polar(a, R - e);
    const [x1, y1] = polar(a, R + e);
    return {
      el: svg('path', { d: `M${f2(x0)} ${f2(y0)}L${f2(x1)} ${f2(y1)}`, class: k ? 'news-radar-day' : 'news-radar-day is-monday' }, dial),
      at: k ? passes(a) : TURN1,
    };
  });
  const mondayLit = svg('path', { d: days[0].el.getAttribute('d'), class: 'news-radar-monday' }, dial);

  // the arm's wake (sectors fading behind it), the arm, the sources over them
  const wakeG = svg('g', {}, dial);
  for (let i = 0; i < WAKE; i += 1) {
    const [x0, y0] = polar(-6 * (i + 1), R - 3);
    const [x1, y1] = polar(-6 * i, R - 3);
    svg('path', {
      d: `M${CX} ${CY}L${f2(x0)} ${f2(y0)}A${R - 3} ${R - 3} 0 0 1 ${f2(x1)} ${f2(y1)}Z`,
      class: 'news-radar-wake',
      style: `opacity: ${f2(0.16 * (1 - i / WAKE) ** 1.6)}`,
    }, wakeG);
  }
  const arm = svg('path', { class: 'news-radar-arm' }, dial);

  // the tray, and a card for each item of news (the dot that flew in is its bullet)
  const tray = svg('path', {
    d: `M${TRAY.x} ${TRAY.y}V${TRAY.y + TRAY.h}H${TRAY.x + TRAY.w}V${TRAY.y}`, class: 'news-radar-tray', pathLength: 1,
  }, dial);
  const cardX = TRAY.x + (TRAY.w - CARD_W) / 2;
  let n = 0;
  const sources = SOURCES.map(([a, rf, news]) => {
    const [x, y] = polar(a, R * rf);
    const g = svg('g', { transform: `translate(${f2(x)} ${f2(y)})` }, fore);
    const page = svg('g', { class: 'news-radar-source' }, g);
    svg('rect', {
      x: -8, y: -10, width: 16, height: 20, rx: 2, class: 'news-radar-page',
    }, page);
    svg('path', { d: 'M-4 -4h8M-4 1h6M-4 6h4', class: 'news-radar-lines' }, page);
    const s = {
      x, y, g, page, at: passes(a), news,
    };
    if (!news) return s;
    const cy = TRAY.y + TRAY.h - 5 - (n + 1) * CARD_H - n * 6;
    const bx = cardX + 11;
    const by = cy + CARD_H / 2;
    const card = svg('g', {}, dial);
    const frame = svg('rect', {
      x: cardX, y: cy, width: CARD_W, height: CARD_H, rx: 3, class: 'news-radar-card', pathLength: 1,
    }, card);
    const rules = svg('path', {
      d: `M${bx + 9} ${cy + 10}h${38 - n * 4}M${bx + 9} ${cy + 18}h${26 + n * 5}`, class: 'news-radar-rules', pathLength: 1,
    }, card);
    const routes = [
      [[x + 52, y], [bx - 64, by]],
      [[x + 70, y], [bx - 58, by]],
      [[x + 92, y + 46], [bx - 96, by]],
    ];
    const path = curve([x, y], ...routes[n], [bx, by]);
    Object.assign(s, {
      path,
      frame,
      rules,
      ping: svg('circle', { cx: x, cy: y, class: 'news-radar-ping' }, fore),
      lit: svg('rect', {
        x: x - 8, y: y - 10, width: 16, height: 20, rx: 2, class: 'news-radar-lit',
      }, fore),
      trail: svg('path', { d: path.d, class: 'news-radar-trail', pathLength: 1 }, fore),
      dot: svg('circle', { r: 0, class: 'news-radar-dot' }, fore),
      lift: s.at + 0.15,
    });
    s.land = s.lift + FLY;
    n += 1;
    return s;
  });

  // the AI at the hub
  const halo = svg('circle', {
    cx: CX, cy: CY, r: 20, class: 'news-radar-halo',
  }, fore);
  const disc = svg('circle', {
    cx: CX, cy: CY, r: 10, class: 'news-radar-disc',
  }, fore);

  // callouts: [part, pin x, pin y, the direction the label lies (-1 above, 1 below)]
  const callouts = [
    ['week', CX, CY - R - 13, -1],
    ['new', TRAY.x + TRAY.w / 2, TRAY.y + TRAY.h + 2, 1],
  ].filter(([part]) => parts.get(part)).map(([part, x, y, dir]) => {
    const g = svg('g', {}, marks);
    return {
      part,
      x,
      y,
      dir,
      g,
      label: parts.get(part),
      path: svg('path', { class: 'news-radar-leader' }, g),
      pin: svg('circle', {
        cx: x, cy: y, r: 2.2, class: 'news-radar-pin',
      }, g),
    };
  });

  stage.append(root);
  let kpx = 1;
  const layout = () => {
    const size = stage.clientWidth;
    if (size) kpx = W / size;
    root.style.setProperty('--k', kpx.toFixed(3));
    callouts.forEach((c) => {
      const h = (size && c.label.offsetHeight * kpx) || 24;
      const ly = c.y + c.dir * (12 + h / 2);
      place(c.part, c.x, ly, W, 'center');
      c.path.setAttribute('d', `M${f2(c.x)} ${f2(c.y + c.dir * 2)}V${f2(ly - c.dir * (h / 2 + 3))}`);
    });
  };

  const cache = new WeakMap();
  const set = (el, name, value) => {
    const c = cache.get(el) || {};
    const v = typeof value === 'number' ? value.toFixed(3) : value;
    if (c[name] !== v) {
      c[name] = v;
      cache.set(el, c);
      if (name === 'opacity') el.style.opacity = v;
      else el.setAttribute(name, v);
    }
  };
  /* part of a pathLength="1" stroke, from a to b; hidden when empty (a round cap leaves a dot) */
  const dash = (el, a, b, o = 1) => {
    const len = Math.max(0, b - a);
    set(el, 'stroke-dasharray', `${len.toFixed(4)} 2`);
    set(el, 'stroke-dashoffset', (-a).toFixed(4));
    set(el, 'opacity', len > 0.0005 && o > 0.001 ? o : 0);
  };

  const ptr = pointer(stage);
  function draw(t, dt) {
    ptr.update(dt);
    const calm = reduceMotion();

    // construction: the rim draws on from Monday, the days and the sources come in, the tray
    dash(rim, 0, arrive(span(t, 0, 0.9)));
    set(inner, 'opacity', arrive(span(t, 0.2, 0.6)));
    set(drift, 'opacity', arrive(span(t, 0.3, 0.6)));
    set(drift, 'transform', `rotate(${f2(t * 1.5)} ${CX} ${CY})`);
    dash(tray, 0, arrive(span(t, 0.4, 0.7)));
    callouts.forEach((c, i) => set(c.g, 'opacity', arrive(span(t, 0.5 + i * 0.1, 0.6))));

    // the arm: out of the hub, once round the week, back at Monday
    const [p, speed] = turn(span(t, TURN0, TURN1 - TURN0));
    const a = MONDAY + 360 * p;
    const reach = arrive(span(t, 0.85, 0.4));
    const [ax, ay] = polar(a, 14 + (R - 20) * reach);
    const [bx, by] = polar(a, 12);
    set(arm, 'd', `M${f2(bx)} ${f2(by)}L${f2(ax)} ${f2(ay)}`);
    set(arm, 'opacity', reach > 0.01 ? 1 : 0);
    set(wakeG, 'transform', `rotate(${f2(a)} ${CX} ${CY})`);
    set(wakeG, 'opacity', Math.min(1, speed * 1.4));
    const done = span(t, TURN1, 0.8);
    dash(elapsed, 0, p, 0.38 * (1 - arrive(done)));

    // the days tick as the arm crosses them; Monday rings once in the accent at the turn's end
    days.forEach((d, k) => {
      const on = arrive(span(t, 0.15 + k * 0.06, 0.5));
      set(d.el, 'opacity', on * (k ? 0.55 + 0.45 * pulse(t, d.at, 0.5) : 1));
    });
    set(mondayLit, 'opacity', pulse(t, TURN1 - 0.05, 1.1));

    // the sources: checked as the arm passes; one with news pings and sends its dot to the tray
    sources.forEach((s, i) => {
      const on = arrive(span(t, 0.35 + i * 0.07, 0.6));
      set(s.g, 'opacity', on);
      set(s.page, 'opacity', 0.62 + 0.38 * pulse(t, s.at, 0.6));
      if (!s.news) return;
      const ping = span(t, s.at, 0.8);
      set(s.ping, 'r', f2(10 + 18 * arrive(ping)));
      set(s.ping, 'opacity', t >= s.at ? 0.8 * (1 - ping) : 0);
      set(s.lit, 'opacity', pulse(t, s.at, 0.9));
      const u = span(t, s.lift, FLY);
      const head = travel(u);
      dash(s.trail, travel(span(t, s.lift + 0.3, FLY)), head, 0.45);
      const flying = t >= s.at && t < s.land;
      const [dx, dy] = s.path.at(head);
      set(s.dot, 'cx', f2(dx));
      set(s.dot, 'cy', f2(dy));
      set(s.dot, 'r', f2(flying ? 3.6 * Math.min(1, snap(span(t, s.at, 0.2))) : 0));
      // the landing: the dot stays as the bullet, the card draws on round it
      const landed = span(t, s.land, 0.24);
      set(s.dot, 'class', t >= s.land ? 'news-radar-dot is-landed' : 'news-radar-dot');
      if (t >= s.land) set(s.dot, 'r', f2(3.2 + 1.2 * (1 - snap(landed))));
      dash(s.frame, 0, arrive(span(t, s.land, 0.45)));
      set(s.frame, 'fill-opacity', arrive(span(t, s.land, 0.3)));
      dash(s.rules, 0, arrive(span(t, s.land + 0.15, 0.45)));
    });

    // the AI at the hub; the hold breathes
    const sc = Math.max(0, snap(span(t, 0.55, 0.3)));
    disc.setAttribute('r', f2(10 * sc));
    halo.setAttribute('r', f2((19 + 2 * breath(t, 3.7)) * sc));
    set(washEl, 'opacity', arrive(span(t, 0.3, 1.2)) * (0.86 + 0.14 * breath(t, 17)));
    const m = calm ? 0 : 4 * kpx;
    set(back, 'transform', `translate(${f2(ptr.x * m)} ${f2(ptr.y * m)})`);
  }

  layout();
  const redraw = loop(stage, draw, { still: STILL });
  new ResizeObserver(() => {
    layout();
    redraw();
  }).observe(stage);
}
