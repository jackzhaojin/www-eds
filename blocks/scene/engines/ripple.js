/**
 * Scene engine `ripple`: AEM Rockstar 2024 (/portfolio/aem-rockstar-2024/), section style lofi
 * (no project accent: the accent is the muted ink, so the plate stays a quiet pencil sketch and
 * the hierarchy is carried by tone: construction faint, the subject near full strength).
 *
 * What it shows: the review table, as the experience fragment beside its variation. A prompt
 * is typed and sent; a ripple spreads through the fragment, lighting each text row as it
 * crosses it, and each lit row's rewrite is written, dashed, in the column beside it (the image
 * is not text). Rules make the rows a table, each row is ticked in review, and one click on the
 * button draws the page out from it around the rewrites: AEM copies the fragment, writes the
 * rows, and the editor's corner marks come out of the button to open the variation. Nothing
 * is written before the click.
 *
 * Parts (rows):
 * - `prompt`: the prompt field over the fragment; label above it, at the upper left.
 * - `fragment`: the experience fragment; label under it, at the lower left.
 * - `review`: the ticks between the columns; label under them.
 * - `variation`: the new variation; label above it, at the upper right.
 *
 * Cycle 8.6 s: type, send (1.4 s), ripple, review (3.3 s), click (4.7 s), variation, a short
 * hold (the caret blinks, the wash breathes), then a staggered clear from 7.2 s. Reduced motion
 * shows the finished variation beside the ticked table.
 */
const T = 8.6;
const SEND = 1.4;
const SPEED = 170; // the ripple, units a second
const TICKS = 3.3;
const CLICK = 4.7;
const MADE = 4.8;
const CLEAR = 7.2;
const STILL = 6.4;
const PARTS = ['prompt', 'fragment', 'review', 'variation'];

/* the plate, in a 500 square: the fragment (A), the gutter, the variation (B) */
const AX = 47;
const W = 166;
const BX = 267;
const TOP = 148;
const BOT = 356;
const GX = (AX + W + BX) / 2;
const PY = 117; // the prompt field's centre line
const SRC = [AX + 128, PY]; // the caret, where the ripple starts
const BTN = [BX + W / 2, BOT + 24]; // the button
const ROWS = [234, 256, 276, 296, 316, 336]; // text rows: a title, then body lines
const LEN = [[0.72, 0.58], [0.94, 0.86], [0.8, 0.97], [0.9, 0.7], [0.62, 0.84], [0.4, 0.52]];

const clamp = (v) => Math.min(1, Math.max(0, v));
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
const leave = bezier(0.32, 0, 0.67, 0);
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
/** 0 to 1 over [a, a + d] by an easing. */
const span = (s, a, d, ease = arrive) => ease(clamp((s - a) / d));

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const rnd = kit.random(2024);
  const id = `ripple-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'ripple-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const clip = svg('clipPath', { id: `${id}-a` }, defs); // the fragment's column
  svg('rect', {
    x: AX, y: PY + 12, width: W, height: BOT - PY - 12,
  }, clip);
  const wash = svg('radialGradient', { id: `${id}-w` }, defs);
  svg('stop', { offset: '0', class: 'ripple-wash-stop' }, wash);
  svg('stop', { offset: '1', class: 'ripple-wash-stop ripple-wash-end' }, wash);

  /* pencil: each line wanders a little and runs past its corners, as a sketch does */
  const jit = (v, a) => (v + (rnd() - 0.5) * 2 * a).toFixed(1);
  const stroke = (x1, y1, x2, y2, over = 0, a = 0.5, o2 = over) => {
    const n = Math.hypot(x2 - x1, y2 - y1) || 1;
    const [ux, uy] = [(x2 - x1) / n, (y2 - y1) / n];
    return `M${jit(x1 - ux * over, a / 2)} ${jit(y1 - uy * over, a / 2)}Q${jit((x1 + x2) / 2, a)} ${jit((y1 + y2) / 2, a)} ${jit(x2 + ux * o2, a / 2)} ${jit(y2 + uy * o2, a / 2)}`;
  };
  /** A sketched polyline, one stroke a side, overshooting at corners (and at its ends if open). */
  const sides = (pts, open = true) => pts.slice(1).map((b, i) => {
    const o1 = open || i ? 2.5 : 0;
    const o2 = open || i < pts.length - 2 ? 2.5 : 0;
    return stroke(...pts[i], ...b, o1, 0.8, o2);
  }).join('');
  const box = (x, y, w, h) => sides([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]);
  /** A pill (the prompt field, the button) centred at (x, y). */
  const pill = (x, y, w, h) => {
    const r = h / 2;
    return `M${x - w / 2 + r} ${y - r}H${x + w / 2 - r}A${r} ${r} 0 0 1 ${x + w / 2 - r} ${y + r}`
      + `H${x - w / 2 + r}A${r} ${r} 0 0 1 ${x - w / 2 + r} ${y - r}Z`;
  };

  const layer = (cls, parent = root) => svg('g', { class: cls }, parent);
  const back = layer('ripple-back');
  const washEl = svg('circle', {
    cx: BX + W / 2, cy: (TOP + BOT) / 2, r: 150, fill: `url(#${id}-w)`,
  }, back);
  const intro = []; // drawn on in order
  const draw = (parent, d, cls) => {
    const el = svg('path', { d, class: cls, pathLength: 1 }, parent);
    intro.push(el);
    return el;
  };
  /** A leader from a label (a) to its part (b), a dot at the part, moving with the part. */
  const leader = (parent, a, b) => {
    draw(parent, `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, 'ripple-c');
    svg('circle', {
      cx: b[0], cy: b[1], r: 2, class: 'ripple-dot',
    }, parent);
  };

  // the table's rules, drawn for the review and gone once the variation is a page
  const rules = layer('ripple-rules');
  const ruleEls = ROWS.slice(0, -1).map((y, i) => svg('path', {
    d: stroke(AX, (y + ROWS[i + 1]) / 2, BX + W, (y + ROWS[i + 1]) / 2, 0, 0.4),
    class: 'ripple-c',
    pathLength: 1,
  }, rules));

  // the fragment: frame, image block, text rows (a lit copy of each for the ripple's pass)
  const image = (x, parent) => {
    const g = svg('g', {}, parent);
    svg('path', { d: box(x + 12, TOP + 12, W - 24, 52), class: 'ripple-s ripple-thin' }, g);
    let hatch = '';
    for (let i = 1; i < 8; i += 1) {
      const x0 = x + 12 + i * 20;
      const x1 = Math.min(x0, x + W - 12);
      hatch += `M${x1} ${TOP + 12 + (x0 - x1)}L${Math.max(x + 12, x0 - 52)} ${TOP + 64 - Math.max(0, x + 12 - (x0 - 52))}`;
    }
    svg('path', { d: hatch, class: 'ripple-c' }, g);
    return g;
  };
  const rowLine = (x, r, len, parent, cls) => svg('path', {
    d: stroke(x + 12, ROWS[r], x + 12 + len * (W - 24), ROWS[r], 0, 0.4),
    class: cls,
    pathLength: 1,
    style: `--w: ${r ? 1.25 : 2}`,
  }, parent);
  const cardA = layer('ripple-card');
  draw(cardA, box(AX, TOP, W, BOT - TOP), 'ripple-s');
  intro.push(image(AX, cardA));
  ROWS.forEach((_, r) => intro.push(rowLine(AX, r, LEN[r][0], cardA, 'ripple-text')));
  const hits = ROWS.map((_, r) => rowLine(AX, r, LEN[r][0], cardA, 'ripple-hit'));
  leader(cardA, [AX + 20, 426], [AX + 20, BOT]);

  // the ripple: four rings from the caret, inside the fragment's column
  const rings = svg('g', { 'clip-path': `url(#${id}-a)` }, root);
  const ringEls = [0, 1, 2, 3].map((i) => svg('circle', {
    cx: SRC[0], cy: SRC[1], r: 1, class: i ? 'ripple-ring ripple-echo' : 'ripple-ring',
  }, rings));

  // the prompt field: the typed line, word by word, and its caret
  const prompt = layer('ripple-prompt');
  draw(prompt, pill(AX + W / 2, PY, W, 22), 'ripple-s');
  const typed = svg('path', { d: `M${AX + 12} ${PY}H${SRC[0] - 4}`, class: 'ripple-type', pathLength: 1 }, prompt);
  const caret = svg('path', { d: 'M0 -6.5V6.5', class: 'ripple-caret' }, prompt);
  const words = [0.22, 0.36, 0.52, 0.68, 0.84, 1]; // "rewrite this for ages 13 to 17"
  leader(prompt, [AX + 6, 92], [AX + 6, PY - 11]);

  // the review: a tick per row in the gutter
  const gutter = layer('ripple-gutter');
  const ticks = ROWS.map((y) => svg('path', {
    d: 'M-4.5 0.5L-1.3 3.8L5 -3.6', class: 'ripple-tick', transform: `translate(${GX} ${y})`,
  }, gutter));
  leader(gutter, [GX, 426], [GX, BOT - 8]);

  // the variation: a dashed place for it, the proposals, then the page drawn out from the click
  const cardB = layer('ripple-card');
  const spot = svg('g', {}, cardB);
  const spotLine = svg('path', { d: box(BX, TOP, W, BOT - TOP), class: 'ripple-c ripple-slot' }, spot);
  intro.push(spot);
  const mid = BX + W / 2; // the page draws out both ways from above the button
  const halves = [[[mid, BOT], [BX, BOT], [BX, TOP], [mid, TOP]],
    [[mid, BOT], [BX + W, BOT], [BX + W, TOP], [mid, TOP]]]
    .map((pts) => svg('path', { d: sides(pts, false), class: 'ripple-s', pathLength: 1 }, cardB));
  const imageB = image(BX, cardB);
  const reveal = svg('clipPath', { id: `${id}-p` }, defs);
  const wipes = ROWS.map((y) => svg('rect', {
    x: BX, y: y - 5, width: 0, height: 10,
  }, reveal));
  const proposals = svg('g', { 'clip-path': `url(#${id}-p)` }, cardB);
  const proposed = ROWS.map((y, r) => {
    const x1 = BX + 12 + LEN[r][1] * (W - 24);
    let d = '';
    for (let x = BX + 12; x < x1 - 0.5; x += 7) d += `M${x.toFixed(1)} ${y}H${Math.min(x1, x + 4).toFixed(1)}`;
    return svg('path', { d, class: 'ripple-new', style: `--w: ${r ? 1.25 : 2}` }, proposals);
  });
  const written = ROWS.map((_, r) => rowLine(BX, r, LEN[r][1], cardB, 'ripple-written'));
  // the editor's corner marks, each flying out of the button to its corner
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const g = svg('g', {}, cardB);
    svg('path', { d: `M0 ${-sy * 14}V0H${-sx * 14}`, class: 'ripple-open' }, g);
    return [g, sx < 0 ? BX - 8 : BX + W + 8, sy < 0 ? TOP - 8 : BOT + 8];
  });
  leader(cardB, [BX + W - 24, 92], [BX + W - 24, TOP]);

  // the button: one click, under the variation; it presses and snaps back
  const button = svg('g', { transform: `translate(${BTN[0]} ${BTN[1]})` }, cardB);
  const pressFill = svg('path', { d: pill(0, 0, 76, 24), class: 'ripple-press-fill' }, button);
  draw(button, pill(0, 0, 76, 24), 'ripple-s');
  svg('path', { d: 'M-14 0H14', class: 'ripple-s' }, button);
  const press = svg('circle', { r: 12, class: 'ripple-press' }, button);

  place('prompt', AX, 68, 500, 'left');
  place('variation', BX + W, 68, 500, 'right');
  place('fragment', AX + 28, 432, 500, 'left');
  place('review', GX + 8, 432, 500, 'left');

  stage.append(root);
  // --k: drawing units per CSS pixel, so stroke weights are true pixels at every size
  new ResizeObserver(() => {
    if (stage.clientWidth) root.style.setProperty('--k', (500 / stage.clientWidth).toFixed(4));
  }).observe(stage);
  const ptr = pointer(stage);
  const planes = [[back, -4], [rules, -1], [cardA, -1], [rings, -1], [prompt, -1], [gutter, 1],
    [cardB, 3]];
  let tau = 0;
  let speed = 0;
  let activeBefore = '';
  const set = (el, name, v) => el.setAttribute(name, typeof v === 'number' ? v.toFixed(3) : v);

  function frame(t, dt) {
    const still = reduceMotion();
    ptr.update(dt);
    const target = (ptr.over ? 1.4 : 1) * clamp(t / 1.2);
    speed += (target - speed) * (still ? 1 : 1 - Math.exp(-dt * 3));
    tau = (tau + dt * speed) % T;
    const s = still ? STILL : tau;
    const on = still ? 1 : clamp(t / 1.1);
    intro.forEach((el, i) => {
      const f = arrive(clamp((on * 1.1 - i * 0.04) / 0.8));
      if (el.tagName === 'path') set(el, 'stroke-dashoffset', 1 - f);
      else set(el, 'opacity', f);
    });
    planes.forEach(([g, k]) => set(g, 'transform', `translate(${(ptr.x * k).toFixed(2)} ${(ptr.y * k).toFixed(2)})`));
    set(washEl, 'opacity', 0.7 + 0.3 * breath(t, 4.1)); // the wash breathes through the hold
    // the clear is staggered: marks, ticks, the page, then the prompt, backspaced
    const gone = (d) => 1 - span(s, CLEAR + d, 0.4, leave);

    let typedTo = 0;
    words.forEach((w, i) => {
      if (s > 0.3 + i * 0.15 && s < CLEAR + 0.5 + (words.length - i) * 0.08) typedTo = w;
    });
    set(typed, 'stroke-dashoffset', 1 - typedTo);
    set(caret, 'transform', `translate(${(AX + 14.5 + (SRC[0] - AX - 16) * typedTo).toFixed(1)} ${PY})`);
    set(caret, 'opacity', (s > 0.3 && s < SEND) || Math.sin(s * 6.5) > 0 ? 1 : 0.25);

    // the ripple: a row of the fragment lights as the first ring crosses it, and its rewrite
    // is written beside it
    const front = (s - SEND) * SPEED;
    ringEls.forEach((el, i) => {
      const r = front - i * 0.24 * SPEED;
      set(el, 'r', Math.max(1, r));
      set(el, 'opacity', still || r <= 0 ? 0 : clamp(r / 24) * clamp(1.25 - r / 260) * (1 - i * 0.22));
    });
    ROWS.forEach((y, r) => {
      const at = SEND + (y - SRC[1]) / SPEED;
      set(hits[r], 'opacity', still ? 0 : clamp((s - at) / 0.1) * (1 - clamp((s - at - 0.12) / 0.8)));
      set(wipes[r], 'width', W * (still ? 1 : span(s, at + 0.05, 0.55, travel)));
      const becomes = span(s, MADE + 0.35 + r * 0.06, 0.5);
      const page = gone(0.18 + r * 0.03);
      set(proposed[r], 'opacity', (1 - becomes) * page);
      set(written[r], 'opacity', becomes * page);
      const tick = s - TICKS - 0.3 - r * 0.15;
      const k = snap(clamp(tick / 0.24));
      set(ticks[r], 'transform', `translate(${GX} ${y}) scale(${Math.max(0.001, k).toFixed(3)})`);
      set(ticks[r], 'opacity', clamp(tick / 0.08) * gone(0.08 + r * 0.04));
    });
    ruleEls.forEach((el, i) => {
      set(el, 'stroke-dashoffset', 1 - span(s, TICKS + i * 0.05, 0.6));
      set(el, 'opacity', 1 - span(s, MADE + 0.5, 0.6));
    });

    // one click: the button presses and snaps back, the page draws out from it, the image
    // comes across, and the corner marks fly out of the button to the variation's corners
    const after = s - CLICK;
    const rebound = after >= 0 ? 1 - 0.12 * (1 - snap(clamp(after / 0.24))) : 1;
    const scale = after > -0.14 && after < 0 ? 0.88 : rebound;
    set(button, 'transform', `translate(${BTN[0]} ${BTN[1]}) scale(${scale.toFixed(3)})`);
    const flash = after > -0.14 && after < 0.7 ? 1 - clamp(after / 0.7) : 0;
    set(pressFill, 'opacity', flash);
    set(press, 'opacity', after > 0 ? flash : 0);
    set(press, 'r', 12 + 20 * arrive(clamp(after / 0.6)));
    halves.forEach((el) => {
      set(el, 'stroke-dashoffset', 1 - span(s, MADE, 0.8));
      set(el, 'opacity', gone(0.3));
    });
    set(spotLine, 'opacity', 1 - span(s, MADE + 0.3, 0.6) * gone(0.3));
    set(imageB, 'opacity', span(s, MADE + 0.3, 0.6) * gone(0.25));
    corners.forEach(([g, x, y], i) => {
      const p = span(s, MADE + 0.15 + i * 0.05, 0.8, travel) * (1 - span(s, CLEAR, 0.35, leave));
      const gx = BTN[0] + (x - BTN[0]) * p;
      const gy = BTN[1] + (y - BTN[1]) * p;
      set(g, 'transform', `translate(${gx.toFixed(1)} ${gy.toFixed(1)}) scale(${(0.3 + 0.7 * p).toFixed(3)})`);
      set(g, 'opacity', clamp(p * 4));
    });

    let active = 'prompt';
    if (s >= SEND && s < TICKS) active = 'fragment';
    else if (s >= TICKS && s < CLICK) active = 'review';
    else if (s >= CLICK && s < CLEAR) active = 'variation';
    if (active !== activeBefore) {
      activeBefore = active;
      PARTS.forEach((p) => kit.parts.get(p)?.classList.toggle('is-active', p === active));
    }
  }

  loop(stage, frame, { still: STILL });
}
