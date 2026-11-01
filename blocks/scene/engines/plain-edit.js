/**
 * Scene engine `plain-edit`: the Sites and AI deck, slide 02 ("What AI offers"), the offer card
 * "You ask in plain words".
 *
 * What it shows: you (the ink ring) type a short ask into a chat bubble, a line that types in
 * behind a caret. AI (the accent disc) carries it down an accent path to the document your
 * authors edit, ruled lines under a heading. It lands beside the heading, marks the line in the
 * diff gutter, strikes the old heading through and lets it go, and writes a shorter one in its
 * place in the accent, which settles to ink with the document's caret blinking after it. Nothing
 * else on the page moves: one ask, one changed line.
 *
 * Story (plays once from t = 0, then holds): construction draws on (0 to 1 s); the ask types in
 * (1 to 2.4 s) and is sent; the disc rides the path down (2.9 to 3.9 s); the gutter mark, the
 * strike and the new heading (3.9 to 5.9 s); by 6.9 s it has settled and holds, the caret
 * blinking, the wash and the disc's halo breathing. Reduced motion shows the held end state.
 *
 * Parts (rows):
 * - `ask`: right of the bubble, its leader from the bubble's right edge.
 * - `change`: between the bubble and the document, right of the path, its leader down to the
 *   new heading's second word.
 */
const STILL = 9;
const T0 = 1; // the ask starts typing
const CHAR = 7; // a typed character's width
const TY = 204; // the heading's line in the document

/* the ask: you, the bubble (its tail toward you) and its words */
const RING = [62, 84, 12];
const BUBBLE = 'M104 56H336Q350 56 350 70V98Q350 112 336 112H104Q90 112 90 98V90L81 84L90 78V70'
  + 'Q90 56 104 56Z';
const ASK = [[108, 164], [172, 193], [200, 242]];
/* AI's path, from under the bubble to the document's margin by the heading */
const PATH = [[126, 113], [126, 160], [46, 158], [46, TY]];
/* the document: its frame, the heading (old and new, as words) and two paragraphs */
const DOC = 'M67 172H433Q436 172 436 175V405Q436 408 433 408H67Q64 408 64 405V175Q64 172 67 172Z';
const OLD = [[92, 156], [166, 222], [232, 300], [310, 356]];
const NEW = [[92, 150], [160, 252]];
const BODY = [
  [236, 316], [252, 324], [268, 290], [284, 188],
  [316, 320], [332, 304], [348, 324], [364, 276], [380, 140],
];

/* callouts: [part, pin x, pin y, leader end x, end y, label x, label y, align] */
const CALLOUTS = [
  ['ask', 350, 84, 358, 84, 364, 84, 'left'],
  ['change', 204, 195, 204, 158, 196, 144, 'left'],
];

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
const leave = bezier(0.32, 0, 0.67, 0);
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
/** A 0..1..0 pulse over [t0, t0 + d]. */
const pulse = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));

/** Points along a cubic, resampled at equal arc length, as x and y arrays. */
function sample([p0, p1, p2, p3], n = 160) {
  const raw = [];
  for (let i = 0; i <= 400; i += 1) {
    const s = i / 400;
    const u = 1 - s;
    const k = [u ** 3, 3 * u * u * s, 3 * u * s * s, s ** 3];
    raw.push([0, 1].map((j) => k[0] * p0[j] + k[1] * p1[j] + k[2] * p2[j] + k[3] * p3[j]));
  }
  const cum = [0];
  for (let i = 1; i < raw.length; i += 1) {
    cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  }
  const xs = new Float32Array(n + 1);
  const ys = new Float32Array(n + 1);
  for (let j = 0, i = 0; j <= n; j += 1) {
    const at = (j / n) * cum[cum.length - 1];
    while (i < raw.length - 2 && cum[i + 1] < at) i += 1;
    const f = clamp((at - cum[i]) / (cum[i + 1] - cum[i] || 1));
    xs[j] = raw[i][0] + (raw[i + 1][0] - raw[i][0]) * f;
    ys[j] = raw[i][1] + (raw[i + 1][1] - raw[i][1]) * f;
  }
  return { xs, ys, n };
}

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, reduceMotion,
  } = kit;
  const id = `plain-edit-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'plain-edit-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'plain-edit-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'plain-edit-wash-stop is-end' }, grad);
  const wash = svg('circle', {
    cx: 190, cy: 200, r: 230, fill: `url(#${id}-wash)`,
  }, root);

  const intro = []; // [element, 'draw' | 'fade'], in order
  const add = (d, cls, parent, kind = 'draw') => {
    const el = svg('path', { d, class: cls, pathLength: kind === 'draw' ? 1 : null }, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };
  const word = ([x0, x1], y) => `M${x0} ${y}H${x1}`;

  // the document: frame, the old heading, the paragraphs
  const doc = svg('g', {}, root);
  add(DOC, 'plain-edit-s', doc);
  const old = svg('g', { class: 'plain-edit-old' }, doc);
  OLD.forEach((w) => add(word(w, TY), 'plain-edit-head', old));
  BODY.forEach(([y, w]) => add(`M92 ${y}h${w}`, 'plain-edit-rule', doc));
  const strike = svg('path', {
    d: `M86 ${TY}H362`, class: 'plain-edit-strike', pathLength: 1,
  }, old);
  const fresh = svg('g', { class: 'plain-edit-new' }, doc);
  const news = NEW.map((w) => svg('path', { d: word(w, TY), class: 'plain-edit-head', pathLength: 1 }, fresh));
  const mark = svg('path', { d: `M76 ${TY - 10}V${TY + 10}`, class: 'plain-edit-mark', pathLength: 1 }, doc);
  const docCaret = svg('path', { d: 'M0 -9V9', class: 'plain-edit-caret' }, doc);

  // the ask: you, the bubble, its words and its caret
  const ask = svg('g', {}, root);
  const [rx, ry, rr] = RING;
  const you = svg('circle', {
    cx: 0, cy: 0, r: rr, class: 'plain-edit-you', transform: `translate(${rx} ${ry})`,
  }, ask);
  intro.unshift([you, 'fade']);
  add(BUBBLE, 'plain-edit-s', ask);
  const typed = ASK.map((w) => svg('path', { d: word(w, 84), class: 'plain-edit-ask', pathLength: 1 }, ask));
  const caret = svg('path', { d: 'M0 -9V9', class: 'plain-edit-caret' }, ask);

  // when each character lands: about 75 ms apart, a little uneven, a beat longer at a space
  const rnd = kit.random(11);
  const keys = []; // [time, word, characters typed in that word]
  let at = T0;
  ASK.forEach(([x0, x1], w) => {
    const n = Math.round((x1 - x0) / CHAR);
    for (let c = 1; c <= n; c += 1) {
      at += 0.05 + 0.05 * rnd();
      keys.push([at, w, c / n]);
    }
    at += 0.06;
  });
  const SEND = at + 0.2;
  const LAND = SEND + 1.25; // the disc reaches the document
  const WRITE = LAND + 1.2; // the new heading starts
  const SETTLE = WRITE + 1;

  // AI: the path, its trail and the disc
  const lut = sample(PATH);
  const [[ax, ay], [bx, by], [cx, cy], [dx, dy]] = PATH;
  const trail = svg('path', {
    d: `M${ax} ${ay}C${bx} ${by} ${cx} ${cy} ${dx} ${dy}`, class: 'plain-edit-trail', pathLength: 1,
  }, root);
  const actor = svg('g', {}, root);
  const halo = svg('circle', { r: 13, class: 'plain-edit-halo' }, actor);
  svg('circle', { r: 6.5, class: 'plain-edit-disc' }, actor);

  // callouts
  const marks = svg('g', {}, root);
  CALLOUTS.forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    if (!place(part, lx, ly, 500, align)) return;
    add(`M${px} ${py}L${ex} ${ey}`, 'plain-edit-leader', marks);
    add(`M${px} ${py}h0`, 'plain-edit-pin', marks, 'fade');
  });

  stage.append(root);
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (w) root.style.setProperty('--k', (500 / w).toFixed(3));
  }).observe(stage);

  const set = (el, prop, v) => {
    if (el[`_${prop}`] !== v) {
      el[`_${prop}`] = v;
      el.style.setProperty(prop, v);
    }
  };
  /* a partial stroke, 0..1 of a pathLength="1" path; hidden at 0, where round caps leave a dot */
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };
  const stagger = Math.min(0.05, 0.45 / intro.length);
  const newEnd = NEW[NEW.length - 1][1];

  function frame(t) {
    intro.forEach(([el, kind], i) => {
      const p = arrive(span(t, i * stagger, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });

    // the ask types in, a character at a time, behind a caret that blinks while it waits
    const fill = ASK.map(() => 0);
    let key = -1;
    keys.forEach(([k, w, f], i) => {
      if (t >= k) {
        fill[w] = f;
        key = i;
      }
    });
    typed.forEach((el, w) => dash(el, fill[w]));
    const w = key < 0 ? 0 : keys[key][1];
    const x = key < 0 ? ASK[0][0] : ASK[w][0] + fill[w] * (ASK[w][1] - ASK[w][0]);
    const typing = key >= 0 && key < keys.length - 1;
    const blink = typing || (t % 1.06) < 0.62 ? 1 : 0;
    set(caret, 'transform', `translate(${(x + 4).toFixed(1)}px, 84px)`);
    set(caret, 'opacity', String(t > 0.7 && t < SEND ? blink : 0));
    // sent: you press once
    you.setAttribute('r', (rr + 1.6 * pulse(t, SEND - 0.05, 0.26)).toFixed(2));

    // AI rides the path down; its trail stays, fainter once the change has settled
    const p = travel(span(t, SEND + 0.25, 1));
    const j = Math.round(p * lut.n);
    const show = snap(span(t, SEND + 0.05, 0.26));
    const land = 1 + 0.25 * pulse(t, LAND, 0.26);
    set(actor, 'transform', `translate(${lut.xs[j].toFixed(2)}px, ${lut.ys[j].toFixed(2)}px) scale(${(show * land).toFixed(3)})`);
    halo.setAttribute('r', (13 + 1.4 * breath(t, 4.3)).toFixed(2));
    dash(trail, p, 0.7 - 0.38 * arrive(span(t, SETTLE, 0.8)));

    // the change: a mark in the gutter, the strike, the old heading leaves, the new one writes in
    dash(mark, clamp(snap(span(t, LAND + 0.05, 0.24))));
    dash(strike, arrive(span(t, LAND + 0.25, 0.45)));
    set(old, 'opacity', (1 - leave(span(t, LAND + 0.8, 0.4))).toFixed(3));
    const pen = NEW[0][0] + (newEnd - NEW[0][0]) * arrive(span(t, WRITE, 0.9));
    news.forEach((el, i) => dash(el, clamp((pen - NEW[i][0]) / (NEW[i][1] - NEW[i][0]))));
    set(fresh, '--pe-mix', `${(100 * (1 - arrive(span(t, SETTLE, 0.8)))).toFixed(1)}%`);

    // the document's caret follows the pen, then blinks after the new heading
    const done = t > WRITE + 0.9;
    const on = !done || reduceMotion() || ((t - WRITE) % 1.06) < 0.62;
    set(docCaret, 'transform', `translate(${(pen + 7).toFixed(1)}px, ${TY}px)`);
    set(docCaret, 'opacity', String(t > WRITE && on ? 1 : 0));

    // ambient: the wash comes up with the construction and breathes 2% over 7.3 s
    set(wash, 'opacity', (arrive(span(t, 0, 1.2)) * (0.98 + 0.02 * breath(t, 7.3))).toFixed(3));
  }

  loop(stage, frame, { still: STILL });
}
