/**
 * Scene engine `change-trail`: the Sites and AI deck, slide 02 ("What AI offers"), the offer card
 * "Every publish leaves a record".
 *
 * What it shows: the live site as a small page glyph over a horizontal timeline. Each publish
 * sends a pulse down from the page (the edited line flashes as it goes) through the snapshot job
 * (automation, the faint square) to the timeline, where it lands as a new commit with its tiny
 * diff: accent bars for the lines added, faint bars for the lines removed. The newest commit
 * always lands under the page; the older ones step left to make room, so four commits build up
 * left to right. Then a person (the ink ring) decides to roll back: an arc draws from the newest
 * commit, through the ring, back to the second, which takes the accent ring of the live state
 * while the two commits after it quiet down. Nothing is lost: every commit stays readable.
 *
 * Story (plays once from t = 0, then holds): construction draws on (0 to 1 s); four publishes,
 * 1.3 s apart from 1 s (each lands 0.8 s after it leaves the page); the ring appears at 6.3 s,
 * the arc draws back (6.55 to 7.55 s), and by 8 s it holds, its wash breathing. Reduced motion
 * shows the held end state.
 *
 * Parts (rows):
 * - `publish`: left of the page glyph, its leader to the glyph's left edge.
 * - `commit`: right of the newest commit (always under the page), its leader from the node.
 * - `rollback`: left of the arc, its leader to the arc's left shoulder; quiet until the rollback.
 */
const STILL = 10;
const NX = 344; // the column under the page, where each new commit lands
const SP = 94; // the step between commits
const TY = 312; // the timeline
const P = [1, 2.3, 3.6, 4.9]; // the publishes
const LAND = 0.8; // a publish lands this long after it leaves the page
const RB = 6.3; // the person decides to roll back
const BACK = RB + 1.25; // the arc reaches the earlier commit
const AX = 250; // the arc's apex, where the ring sits
const AY = 178;
const DY = 16; // the drawing sits this much lower than its coordinates, centred in the stage

/* the page glyph: a sheet with a folded corner, a heading and four lines (one flashes for each
   publish: the edit going live) */
const GLYPH = 'M321 52H358L370 64V117Q370 120 367 120H321Q318 120 318 117V55Q318 52 321 52Z';
const LINES = [[82, 34], [92, 28], [102, 34], [111, 20]];
const FLASH = [0, 2, 1, 3];
/* each commit's diff: [bar width, added] */
const DIFFS = [
  [[38, 1], [30, 1], [24, 1]],
  [[34, 0], [38, 1], [26, 1]],
  [[30, 1], [36, 0], [38, 1], [18, 1]],
  [[36, 0], [22, 0], [38, 1], [30, 1]],
];
const ARC = `M${NX} ${TY - 6}A94 128 0 0 0 ${NX - 2 * SP} ${TY - 6}`;

/* callouts: [part, pin x, pin y, leader end x, end y, label x, label y, align] */
const CALLOUTS = [
  ['publish', 318, 86, 309, 86, 304, 86, 'right'],
  ['commit', 352, TY, 359, TY, 364, TY, 'left'],
  ['rollback', 210.3, 190, 191, 188, 186, 186, 'right'],
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
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
/** A 0..1..0 pulse over [t0, t0 + d]. */
const pulse = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));
/** A scale about (x, y), as an SVG transform. */
const about = (x, y, s) => `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})`;

export default function engine(block, kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `change-trail-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'change-trail-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'change-trail-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'change-trail-wash-stop is-end' }, grad);
  // the arc is cut away inside the ring, so the ring reads open on any ground
  const mask = svg('mask', {
    id: `${id}-cut`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 500, height: 500,
  }, defs);
  svg('rect', { width: 500, height: 500, fill: '#fff' }, mask);
  svg('circle', {
    cx: AX, cy: AY, r: 11.5, fill: '#000',
  }, mask);
  const wash = svg('circle', {
    cx: 250, cy: 250, r: 240, fill: `url(#${id}-wash)`,
  }, root);
  const art = svg('g', { transform: `translate(0 ${DY})` }, root);

  const intro = []; // [element, 'draw' | 'fade'], in order
  const add = (d, cls, parent, kind = 'draw') => {
    const el = svg('path', { d, class: cls, pathLength: kind === 'draw' ? 1 : null }, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };

  // the timeline: construction across, and the history (ink) from the oldest commit to now
  const line = svg('g', {}, art);
  add(`M28 ${TY}H${NX}`, 'change-trail-c', line);
  const history = svg('path', { class: 'change-trail-s' }, line);

  // the live site and the snapshot job under it
  const glyph = svg('g', {}, art);
  add(GLYPH, 'change-trail-s', glyph);
  add('M358 52V64H370', 'change-trail-c', glyph);
  add('M327 70h20', 'change-trail-rule is-head', glyph);
  const flashes = LINES.map(([y, w]) => {
    add(`M327 ${y}h${w}`, 'change-trail-rule', glyph);
    return svg('path', { d: `M327 ${y}h${w}`, class: 'change-trail-flash', opacity: 0 }, glyph);
  });
  add(`M${NX} 124V183`, 'change-trail-guide', art, 'fade');
  const job = svg('rect', {
    x: NX - 11, y: 185, width: 22, height: 22, rx: 5, class: 'change-trail-auto',
  }, art);
  intro.push([job, 'fade']);
  const comets = [[`M${NX} 121V184`, 0.45], [`M${NX} 208V305`, 0.3]].map(([d, a]) => ({
    el: svg('path', { d, class: 'change-trail-comet', pathLength: 1 }, art), a,
  }));

  // the commits: a node (ink, an accent overlay as it lands) and its diff card below
  const commits = DIFFS.map((bars, j) => {
    const g = svg('g', { class: 'change-trail-commit', opacity: 0 }, art);
    const diff = svg('g', { class: 'change-trail-diff' }, g);
    const card = svg('g', { class: 'change-trail-card' }, diff);
    svg('path', { d: `M0 ${TY + 6}V${TY + 17}`, class: 'change-trail-c' }, card);
    svg('rect', {
      x: -28, y: TY + 18, width: 56, height: 52, rx: 3, class: 'change-trail-c',
    }, card);
    const els = bars.map(([w, added], i) => svg('path', {
      d: `M-19 ${TY + 29 + 11 * i}h${w}`,
      class: `change-trail-bar ${added ? 'is-added' : 'is-removed'}`,
      pathLength: 1,
    }, diff));
    const node = svg('circle', { cy: TY, r: 5, class: 'change-trail-node' }, g);
    const lit = svg('circle', { cy: TY, r: 5, class: 'change-trail-lit' }, g);
    const live = j === 1 ? svg('circle', {
      cy: TY, r: 9.5, class: 'change-trail-live', opacity: 0,
    }, g) : null;
    return {
      g, diff, card, els, node, lit, live, land: P[j] + LAND,
    };
  });

  // the rollback: a person (the ink ring) and the arc back
  const arc = svg('path', {
    d: ARC, class: 'change-trail-arc', pathLength: 1, mask: `url(#${id}-cut)`,
  }, art);
  const you = svg('circle', {
    r: 11, class: 'change-trail-you', transform: `translate(${AX} ${AY}) scale(0)`,
  }, art);

  // callouts; the rollback's leader waits for its arc
  const marks = svg('g', {}, art);
  const labels = {};
  let late = [];
  CALLOUTS.forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    labels[part] = place(part, lx, ly + DY, 500, align);
    if (!labels[part]) return;
    const kind = part === 'rollback' ? null : 'draw';
    const leader = add(`M${px} ${py}L${ex} ${ey}`, 'change-trail-leader', marks, kind);
    const pin = add(`M${px} ${py}h0`, 'change-trail-pin', marks, kind && 'fade');
    if (!kind) late = [leader, pin];
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
  const attr = (el, name, v) => {
    if (el[`__${name}`] !== v) {
      el[`__${name}`] = v;
      el.setAttribute(name, v);
    }
  };
  /* a partial stroke, 0..1 of a pathLength="1" path; hidden at 0, where round caps leave a dot */
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };
  const stagger = Math.min(0.05, 0.45 / intro.length);

  function frame(t) {
    intro.forEach(([el, kind], i) => {
      const p = arrive(span(t, i * stagger, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });

    // each publish: the edited line flashes, the page presses, the pulse runs down through the
    // snapshot job, which fires, and lands as a commit
    let press = 0;
    let fire = 0;
    const heads = [-1, -1];
    P.forEach((p, j) => {
      const on = arrive(span(t, p - 0.3, 0.2)) * (1 - arrive(span(t, p + 0.6, 0.6)));
      set(flashes[FLASH[j]], 'opacity', on.toFixed(3));
      press = Math.max(press, pulse(t, p - 0.08, 0.26));
      fire = Math.max(fire, pulse(t, p + 0.26, 0.3));
      if (t >= p && t < p + 0.4) heads[0] = travel(span(t, p, 0.32));
      if (t >= p + 0.42 && t < p + LAND + 0.05) heads[1] = travel(span(t, p + 0.42, 0.38));
    });
    attr(glyph, 'transform', about(NX, 86, 1 - 0.035 * press));
    attr(job, 'transform', about(NX, 196, 1 + 0.14 * fire));
    set(job, '--ct-fire', fire.toFixed(3));
    comets.forEach(({ el, a }, i) => {
      // a dash a long, its head at h (0 to 1 + a): visible from h - a to h
      const h = heads[i] * (1 + a);
      set(el, 'stroke-dasharray', `${a} 2`);
      set(el, 'stroke-dashoffset', (a - h).toFixed(4));
      set(el, 'opacity', heads[i] < 0 ? '0' : '1');
    });

    // the commits: each lands under the page, then steps left as each later one comes
    let oldest = null;
    const quiet = arrive(span(t, BACK + 0.05, 0.5)); // after the rollback, the two after it
    commits.forEach((c, j) => {
      let slots = 0;
      for (let m = j + 1; m < P.length; m += 1) slots += travel(span(t, P[m] - 0.1, 0.55));
      const x = NX - SP * slots;
      const landed = t >= c.land;
      if (landed && oldest === null) oldest = x;
      attr(c.g, 'transform', `translate(${x.toFixed(2)} 0)`);
      set(c.g, 'opacity', (landed ? 1 - (j > 1 ? 0.6 * quiet : 0) : 0).toFixed(3));
      set(c.lit, 'opacity', (landed ? 1 - arrive(span(t, c.land + 0.25, 0.8)) : 0).toFixed(3));
      const r = (5 + 2.2 * pulse(t, c.land, 0.26)).toFixed(2);
      attr(c.node, 'r', r);
      attr(c.lit, 'r', r);
      set(c.card, 'opacity', arrive(span(t, c.land + 0.02, 0.3)).toFixed(3));
      c.els.forEach((el, i) => dash(el, arrive(span(t, c.land + 0.06 + 0.05 * i, 0.24))));
      // a diff quiets once the next commit lands; the one rolled back to comes back up
      const next = j + 1 < P.length ? arrive(span(t, P[j + 1] + LAND, 0.6)) : 0;
      const back = j === 1 ? arrive(span(t, BACK, 0.5)) : 0;
      set(c.diff, '--ct-age', (next * (1 - back)).toFixed(3));
      if (c.live) {
        set(c.live, 'opacity', back.toFixed(3));
        attr(c.live, 'r', (9.5 * clamp(snap(span(t, BACK, 0.26)))).toFixed(2));
      }
    });
    if (oldest === null) set(history, 'opacity', '0');
    else {
      set(history, 'opacity', '1');
      attr(history, 'd', `M${oldest.toFixed(2)} ${TY}H${NX}`);
    }

    // the rollback: the ring appears, the arc draws back through it, the label comes up
    const show = snap(span(t, RB, 0.26));
    attr(you, 'transform', `translate(${AX} ${AY}) scale(${show.toFixed(3)})`);
    dash(arc, travel(span(t, RB + 0.25, 1)), 1 - 0.25 * arrive(span(t, BACK + 0.2, 0.6)));
    const cue = arrive(span(t, RB + 0.7, 0.3));
    late.forEach((el) => set(el, 'opacity', cue.toFixed(3)));
    labels.rollback?.classList.toggle('is-waiting', t < RB);

    // ambient: the wash comes up with the construction and breathes 2% over 7.3 s
    set(wash, 'opacity', (arrive(span(t, 0, 1.2)) * (0.98 + 0.02 * breath(t, 7.3))).toFixed(3));
  }

  loop(stage, frame, { still: STILL });
}
