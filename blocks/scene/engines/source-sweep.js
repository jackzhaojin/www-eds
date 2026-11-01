/**
 * Scene engine `source-sweep`: the Sites and AI webinar deck, stage 01 (research and briefs), the
 * offer card "It reads more than you can".
 *
 * What it shows: AI as a research assistant that reads the pile for you. A loose fan of eight
 * source pages (docs, release notes, posts, threads: ruled lines, never words) lies on the left.
 * The AI (the accent disc) sweeps down the stack's edge, its reading line crossing each page in
 * turn; where a page holds something your readers keep asking, that line lights in the accent,
 * lifts off and flies on a curve to one notes card on the right, where it lands as a new bullet.
 * Two pages give nothing. The disc ends beside the card, at its caret.
 *
 * Story (plays once from t = 0, then holds): to 1 s the pages and the card draw on; 1.1 to
 * 6.3 s the sweep, six lines lifting off (each 1.15 s in flight); 6.5 to 7.7 s the disc moves to
 * rest beside the card. From 8 s it holds: six notes, the caret blinking, the wash breathing.
 * Reduced motion shows that end state.
 *
 * Parts (rows):
 * - `sources`: above the stack, at its left; its leader drops to the top page.
 * - `notes`: above the notes card, at its left; its leader drops to the card.
 */
const W = 500;
const STILL = 9.4;
const DEG = Math.PI / 180;

// the pile: eight pages, cascading down the left, each a little offset and turned
const PW = 116;
const PH = 74;
const LEFT = 48;
const TOP = 80;
const STEP = 42;
const JX = [8, -2, 12, 2, 14, 0, 10, 4];
const ROT = [-2.4, 1.8, -1.2, 2.6, -2.1, 1.2, -2.8, 1.6];
const RULES = [20, 28, 36, 44, 52, 60]; // ruled lines (local y); the next page covers from 42
const YIELD = [0, 1, -1, 2, 0, 1, 1, -1]; // the rule each page gives up (-1: nothing worth taking)

// the notes card, its slots, and the disc's path
const CARD = {
  x: 294, y: 120, w: 152, h: 196,
};
const SLOT0 = 44;
const SLOT = 22;
const DX = 200;
const Y0 = 98;
const Y1 = 424;
const SWEEP0 = 1.1;
const SWEEP1 = 6.3;
const REST0 = 6.5;
const REST1 = 7.7;
const FLY = 1.15;
const REST = { x: CARD.x - 24, y: CARD.y + SLOT0 + 6 * SLOT };

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
const f2 = (v) => v.toFixed(2);

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

/** Constant speed with eased ends: position 0..1 at u, accelerating over the first and last a. */
function ramp(u, a = 0.1) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const v = 1 / (1 - a);
  if (u < a) return (v * u * u) / (2 * a);
  if (u > 1 - a) return 1 - (v * (1 - u) ** 2) / (2 * a);
  return v * (u - a / 2);
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
  const total = cum[n];
  const at = (u) => {
    const d = clamp(u) * total;
    let i = 1;
    while (i < n && cum[i] < d) i += 1;
    const f = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [0, 1].map((c) => pts[i - 1][c] + (pts[i][c] - pts[i - 1][c]) * f);
  };
  const d = `M${p0.map(f2)}C${p1.map(f2)} ${p2.map(f2)} ${p3.map(f2)}`;
  return { at, d };
}

export default function engine(block, kit) {
  const {
    stage, svg, place, parts, loop, pointer, reduceMotion, random,
  } = kit;
  const id = `source-sweep-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'source-sweep-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: 0, class: 'source-sweep-stop' }, grad);
  svg('stop', { offset: 1, class: 'source-sweep-stop' }, grad);
  const back = svg('g', {}, root);
  const pile = svg('g', {}, root);
  const desk = svg('g', {}, root);
  const air = svg('g', {}, root);
  const marks = svg('g', {}, root);

  const washEl = svg('circle', {
    cx: CARD.x + CARD.w / 2, cy: CARD.y + CARD.h / 2, r: 176, fill: `url(#${id}-wash)`,
  }, back);

  // the pages: a frame, a heading stroke and six rules; the rule a page gives up is its own line,
  // with an accent copy over it that draws on as the disc reads it
  const rnd = random(11);
  const yields = [];
  const pages = JX.map((jx, i) => {
    const p = { x: LEFT + jx, y: TOP + i * STEP, rot: ROT[i] };
    const a = p.rot * DEG;
    p.world = (lx, ly) => {
      const dx = lx - PW / 2;
      const dy = ly - PH / 2;
      return [p.x + PW / 2 + dx * Math.cos(a) - dy * Math.sin(a),
        p.y + PH / 2 + dx * Math.sin(a) + dy * Math.cos(a)];
    };
    p.g = svg('g', {}, pile);
    const inner = svg('g', { transform: `translate(${p.x} ${p.y}) rotate(${p.rot} ${PW / 2} ${PH / 2})` }, p.g);
    svg('rect', {
      width: PW, height: PH, rx: 3, class: 'source-sweep-page',
    }, inner);
    svg('path', { d: `M10 10.5h${f2(24 + rnd() * 22)}`, class: 'source-sweep-head' }, inner);
    let rest = '';
    RULES.forEach((ry, r) => {
      const len = r === YIELD[i] ? 70 + rnd() * 26 : 40 + rnd() * 58;
      if (r !== YIELD[i]) {
        rest += `M10 ${ry}h${f2(len)}`;
        return;
      }
      const d = `M10 ${ry}h${f2(len)}`;
      const base = svg('path', { d, class: 'source-sweep-rule' }, inner);
      const lit = svg('path', { d, class: 'source-sweep-lit', pathLength: 1 }, inner);
      yields.push({
        page: i, base, lit, len, from: [p.world(10, ry), p.world(10 + len, ry)], rot: p.rot,
      });
    });
    svg('path', { d: rest, class: 'source-sweep-rule' }, inner);
    return p;
  });

  // the notes card: a frame, a heading, faint rules for the notes to land on
  const cardG = svg('g', {}, desk);
  const frame = svg('rect', {
    x: CARD.x, y: CARD.y, width: CARD.w, height: CARD.h, rx: 4, class: 'source-sweep-card', pathLength: 1,
  }, cardG);
  const cardHead = svg('path', { d: `M${CARD.x + 14} ${CARD.y + 21}h44`, class: 'source-sweep-head is-card' }, cardG);
  let guide = '';
  for (let j = 0; j <= 6; j += 1) guide += `M${CARD.x + 24} ${CARD.y + SLOT0 + j * SLOT}H${CARD.x + CARD.w - 14}`;
  const guides = svg('path', { d: guide, class: 'source-sweep-guide' }, cardG);

  // the disc's sweep runs at constant speed with eased ends; when it passes each line
  const sweepAt = (y) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i += 1) {
      const mid = (lo + hi) / 2;
      if (Y0 + (Y1 - Y0) * ramp(mid) < y) lo = mid;
      else hi = mid;
    }
    return SWEEP0 + lo * (SWEEP1 - SWEEP0);
  };
  yields.forEach((y, k) => {
    const [a, b] = y.from;
    const sy = CARD.y + SLOT0 + k * SLOT;
    const s = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const e = [CARD.x + 24 + y.len / 2, sy];
    Object.assign(y, {
      pass: sweepAt(b[1]),
      path: curve(s, [s[0] + 58, s[1] - 30], [e[0] - 84, e[1] + 6], e),
      trail: svg('path', { class: 'source-sweep-trail', pathLength: 1 }, air),
      fly: svg('line', { class: 'source-sweep-fly' }, air),
      bullet: svg('circle', {
        cx: CARD.x + 15, cy: sy, r: 0, class: 'source-sweep-bullet',
      }, cardG),
      note: svg('path', { d: `M${CARD.x + 24} ${sy}h${f2(y.len)}`, class: 'source-sweep-note' }, cardG),
      flash: svg('path', { d: `M${CARD.x + 24} ${sy}h${f2(y.len)}`, class: 'source-sweep-flash' }, cardG),
    });
    y.lift = y.pass + 0.12;
    y.land = y.lift + FLY;
    y.trail.setAttribute('d', y.path.d);
  });
  const caretY = CARD.y + SLOT0 + 6 * SLOT;
  const caret = svg('path', { d: `M${CARD.x + 25} ${caretY - 6}v12`, class: 'source-sweep-caret' }, cardG);

  // the disc: its reading line across the pile, its halo and the disc itself
  const beam = svg('line', { class: 'source-sweep-beam' }, air);
  const halo = svg('circle', { r: 18, class: 'source-sweep-halo' }, air);
  const disc = svg('circle', { r: 8.5, class: 'source-sweep-disc' }, air);
  const restPath = curve(
    [DX, Y1],
    [DX + 18, Y1 - 52],
    [REST.x - 40, REST.y + 48],
    [REST.x, REST.y],
  );

  // callouts: [part, x of the leader, y it ends at (the part's edge), label x]
  const top = pages[0].world(9, 0);
  const callouts = [
    ['sources', top[0], top[1], top[0] - 4],
    ['notes', CARD.x + 8, CARD.y, CARD.x + 4],
  ].filter(([part]) => parts.get(part)).map(([part, x, y, lx]) => {
    const g = svg('g', { class: 'source-sweep-callout' }, marks);
    return {
      part,
      x,
      y,
      lx,
      g,
      label: parts.get(part),
      path: svg('path', { class: 'source-sweep-leader' }, g),
      dot: svg('circle', { r: 2.2, class: 'source-sweep-pin' }, g),
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
      const cy = c.y - 14 - h / 2;
      place(c.part, c.lx, cy, W, 'left');
      c.path.setAttribute('d', `M${f2(c.x)} ${f2(cy + h / 2 + 3)}V${f2(c.y - 2)}`);
      c.dot.setAttribute('cx', f2(c.x));
      c.dot.setAttribute('cy', f2(c.y));
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

    // construction: the pages settle in from the top, the card draws on
    pages.forEach((p, i) => {
      const e = arrive(span(t, 0.04 + i * 0.06, 0.7));
      set(p.g, 'opacity', e);
      set(p.g, 'transform', `translate(0 ${f2(8 * (1 - e))})`);
    });
    const c = arrive(span(t, 0.2, 0.8));
    dash(frame, 0, c);
    set(frame, 'fill-opacity', c);
    set(cardHead, 'opacity', arrive(span(t, 0.5, 0.5)));
    set(guides, 'opacity', arrive(span(t, 0.6, 0.6)));
    callouts.forEach((co, i) => set(co.g, 'opacity', arrive(span(t, 0.5 + i * 0.1, 0.6))));

    // the disc: in at the top of the pile, down its edge, then over to rest beside the card
    let x = DX;
    let y = Y0;
    if (t < REST0) y = Y0 + (Y1 - Y0) * ramp(span(t, SWEEP0, SWEEP1 - SWEEP0));
    else [x, y] = restPath.at(travel(span(t, REST0, REST1 - REST0)));
    const s = Math.max(0, snap(span(t, 0.75, 0.3)));
    disc.setAttribute('cx', f2(x));
    disc.setAttribute('cy', f2(y));
    disc.setAttribute('r', f2(8.5 * s));
    halo.setAttribute('cx', f2(x));
    halo.setAttribute('cy', f2(y));
    halo.setAttribute('r', f2((17 + 1.6 * breath(t, 3.7)) * s));
    const beamOn = arrive(span(t, 1, 0.4)) * (1 - span(t, SWEEP1, 0.3));
    set(beam, 'opacity', beamOn * 0.55);
    if (beamOn > 0) {
      set(beam, 'x1', LEFT - 6);
      set(beam, 'x2', f2(x - 13));
      set(beam, 'y1', f2(y));
      set(beam, 'y2', f2(y));
    }

    // each line worth keeping: read (lit from the left as the disc comes level), lifted, flown,
    // landed as a note that flashes once and settles to ink
    yields.forEach((yl) => {
      const lifted = t >= yl.lift;
      dash(yl.lit, 0, travel(span(t, yl.pass - 0.45, 0.45)), lifted ? 0 : 1);
      set(yl.base, 'opacity', 1 - 0.8 * span(t, yl.lift, 0.2));
      const u = span(t, yl.lift, FLY);
      const flying = lifted && t < yl.land;
      set(yl.fly, 'opacity', flying ? 1 : 0);
      if (flying) {
        const [cx, cy] = yl.path.at(travel(u));
        const a = yl.rot * (1 - arrive(u)) * DEG;
        const hx = (yl.len / 2) * Math.cos(a);
        const hy = (yl.len / 2) * Math.sin(a);
        const lift = 2.5 * Math.sin(Math.PI * u);
        set(yl.fly, 'x1', f2(cx - hx));
        set(yl.fly, 'y1', f2(cy - hy - lift));
        set(yl.fly, 'x2', f2(cx + hx));
        set(yl.fly, 'y2', f2(cy + hy - lift));
      }
      const head = travel(u);
      const tail = travel(span(t, yl.lift + 0.32, FLY));
      dash(yl.trail, tail, head, 0.5);
      const landed = t >= yl.land;
      set(yl.note, 'opacity', landed ? 1 : 0);
      set(yl.flash, 'opacity', landed ? 1 - arrive(span(t, yl.land + 0.15, 0.9)) : 0);
      set(yl.bullet, 'r', f2(2.3 * Math.max(0, snap(span(t, yl.land, 0.24)))));
    });

    // the hold: the caret blinks on the next line, the wash breathes, the pile drifts a hair
    const blink = 0.5 + 0.5 * Math.cos((2 * Math.PI * Math.max(0, t - REST1)) / 1.15);
    set(caret, 'opacity', arrive(span(t, REST1, 0.4)) * (calm ? 0.8 : 0.2 + 0.65 * blink));
    set(washEl, 'opacity', arrive(span(t, 0.3, 1.2)) * (0.86 + 0.14 * breath(t, 17)));
    const m = calm ? 0 : 4 * kpx;
    set(back, 'transform', `translate(${f2(ptr.x * m)} ${f2(ptr.y * m)})`);
    set(pile, 'transform', `translate(${f2(0.9 * Math.sin((2 * Math.PI * t) / 23) + ptr.x * m * 0.5)} ${f2(0.7 * Math.sin((2 * Math.PI * t) / 31))})`);
  }

  layout();
  const redraw = loop(stage, draw, { still: STILL });
  new ResizeObserver(() => {
    layout();
    redraw();
  }).observe(stage);
}
