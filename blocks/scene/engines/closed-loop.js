/**
 * Scene engine `closed-loop`: The Content Factory (/portfolio/content-factory/), accent factory.
 *
 * What it shows: the v2 mesh's closed loop drawn as one continuous path, a trefoil whose three
 * petals all pass through the coordinator. The run (the accent dot) leaves the coordinator for
 * one agent at a time, out along one side of a petal and back along the other, so no agent ever
 * calls another. Each agent's card waits dashed until its work starts: content-gen fabricates a
 * messy legacy page (skewed, its text running into the image); migration takes that page (its
 * ghost) and rebuilds it as clean blocks; eval fills four score bars and pins the overall score.
 * Each return lights a third of the coordinator's ring; when the ring closes it rings once, the
 * cards clear one after another and the next run starts.
 *
 * Parts (rows):
 * - `coordinator`: the hub at the center; label to its right, in a break of the orbit.
 * - `content-gen`: the left station and its page; label above the page.
 * - `migration`: the upper right station; label to the left of its page.
 * - `eval`: the lower station and its score card; label to the left of the card.
 *
 * Cycle 12 s: three 3.4 s stages (route at the hub, travel out, work, travel back), then the ring
 * closes and the cards leave, staggered. Reduced motion shows eval mid-score.
 */
const HX = 248;
const HY = 238;
const R = 134;
const T = 12;
const STAGE = 3.4;
const FW = 72;
const FH = 90;
const PAGE = FW / 64; // the pages are drawn on a 64 x 80 grid
const STILL = 8.8;
const DEG = Math.PI / 180;
const AXES = [-162, -42, 78].map((a) => a * DEG); // the petals: left, upper right, down
const PARTS = ['content-gen', 'migration', 'eval'];
const CLOSE = 2 * STAGE + 3.1 + 0.6; // the ring's last third is in
const LEAVE = 11.15; // the cards leave from here, 80 ms apart

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
const leave = bezier(0.32, 0, 0.67, 0);
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
/** A 0..1..0 pulse over [t0, t0 + d], on the snap curve. */
const pulse = (t, t0, d) => {
  if (t < t0 || t > t0 + d) return 0;
  return Math.sin(Math.PI * clamp(snap((t - t0) / d)));
};

/* each station's page on a 64 x 80 grid: [path, reveal from, reveal to, class] */
const LEGACY = [ // content-gen: a hand-coded legacy page, ragged, skewed, text over the image
  ['M3.5 3.5H60.5V76.5H3.5Z', 0, 0.16, 'thin'],
  ['M15 11.5L45 9', 0.06, 0.22, 'bold'],
  ['M7 17H17L18.5 64H8.5Z', 0.14, 0.36],
  ['M21 18.5H53', 0.26, 0.4],
  ['M23 23.5L48 25.8', 0.31, 0.45],
  ['M20 30.5H58.5', 0.36, 0.5],
  ['M24 35H42', 0.41, 0.55],
  ['M21.6 43.9L45.5 41.8L46.7 55.7L22.8 57.8Z', 0.5, 0.68],
  ['M21.6 43.9L46.7 55.7M45.5 41.8L22.8 57.8', 0.58, 0.76, 'thin'],
  ['M19 48.5H51', 0.68, 0.84],
  ['M9 70.5H20M24 70.5H34', 0.82, 0.98],
];
const PAGES = [
  LEGACY,
  [ // migration: the same page as clean blocks
    ['M7 8H57V25H7Z', 0.18, 0.44, 'fill'],
    ['M7 30H30V44H7Z', 0.38, 0.58],
    ['M34 30H57V44H34Z', 0.44, 0.64],
    ['M7 51H57', 0.6, 0.74],
    ['M7 57H57', 0.66, 0.8],
    ['M7 63H44', 0.72, 0.86],
    ['M7 71H57', 0.84, 1, 'thin'],
  ],
  [ // eval: four dimensions as bars filling from the left, then the overall score
    ['M9 15H47.2', 0, 0.2, 'bar'],
    ['M9 27H55', 0.16, 0.38, 'bar'],
    ['M9 39H45.3', 0.32, 0.54, 'bar'],
    ['M9 51H55', 0.48, 0.7, 'bar'],
    ['M9 67H51', 0.68, 0.9],
  ],
];
/* the score card's form, drawn before any scoring: four tracks and the overall rule */
const TRACKS = 'M9 15H55M9 27H55M9 39H55M9 51H55';

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const id = `closed-loop-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'closed-loop-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const wash = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'closed-loop-wash-stop' }, wash);
  svg('stop', { offset: '1', class: 'closed-loop-wash-stop' }, wash);
  // the path is cut away inside the hub and the nodes, so they read as open rings on any ground
  const mask = svg('mask', {
    id: `${id}-cut`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 500, height: 500,
  }, defs);
  svg('rect', { width: 500, height: 500, fill: '#fff' }, mask);
  svg('circle', {
    cx: HX, cy: HY, r: 12.5, fill: '#000',
  }, mask);

  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const intro = []; // [element, kind] in order: 'draw' by dash, 'fade' by opacity
  const add = (name, attrs, parent, kind) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };
  const at = (r, a) => `${(HX + r * Math.cos(a)).toFixed(2)} ${(HY + r * Math.sin(a)).toFixed(2)}`;

  // construction: the wash, and the orbit through the stations, broken for the coordinator label
  const washEl = svg('circle', {
    cx: HX, cy: HY, r: 200, fill: `url(#${id}-wash)`,
  }, back);
  add('path', { d: `M${at(R, 26 * DEG)}A${R} ${R} 0 1 1 ${at(R, -10 * DEG)}`, class: 'closed-loop-c closed-loop-dash' }, back, 'fade');

  // the trefoil: three slim rose petals (20 degrees either side of the axis), each run
  // counterclockwise and joined inside the hub, where the coordinator turns the run
  const pts = [];
  AXES.forEach((a) => {
    for (let i = 0; i < 120; i += 1) {
      const psi = 20 * DEG - (40 * DEG * i) / 120;
      const r = R * Math.cos(4.5 * psi);
      pts.push([HX + r * Math.cos(a + psi), HY + r * Math.sin(a + psi)]);
    }
  });
  const cum = [0];
  for (let i = 1; i <= pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i % pts.length];
    cum.push(cum[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const L = 900; // the path resampled at equal arc length, for the dot
  const lx = new Float32Array(L + 1);
  const ly = new Float32Array(L + 1);
  for (let j = 0, i = 0; j <= L; j += 1) {
    const s = (j / L) * cum[pts.length];
    while (i < pts.length - 1 && cum[i + 1] < s) i += 1;
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    const f = clamp((s - cum[i]) / (cum[i + 1] - cum[i] || 1));
    lx[j] = x0 + (x1 - x0) * f;
    ly[j] = y0 + (y1 - y0) * f;
  }
  const d = `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z`;
  const cut = svg('g', { mask: `url(#${id}-cut)` }, mech);
  add('path', { d, class: 'closed-loop-path', pathLength: 1 }, cut, 'draw');

  // stations: a node at each petal tip, a stem, the agent's card and the work on it
  const stations = AXES.map((a, k) => {
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const tx = HX + R * ux;
    const ty = HY + R * uy;
    svg('circle', {
      cx: tx, cy: ty, r: 6.5, fill: '#000',
    }, mask);
    // the card sits on the axis, its near edge 14 units past the node
    const ext = Math.min(FW / 2 / (Math.abs(ux) || 1e-6), FH / 2 / (Math.abs(uy) || 1e-6));
    const cx = tx + (14 + ext) * ux;
    const cy = ty + (14 + ext) * uy;
    const x0 = cx - FW / 2;
    const y0 = cy - FH / 2;
    add('path', { d: `M${tx + 6.5 * ux} ${ty + 6.5 * uy}L${tx + 14 * ux} ${ty + 14 * uy}`, class: 'closed-loop-s' }, mech, 'fade');
    const frame = add('rect', {
      x: x0, y: y0, width: FW, height: FH, rx: 3, class: 'closed-loop-s closed-loop-frame', pathLength: 1,
    }, mech, 'fade');
    const onCard = { transform: `translate(${x0} ${y0}) scale(${PAGE})`, class: 'closed-loop-work' };
    if (k === 2) { // the score card's form stays when the scores leave
      const form = svg('g', onCard, mech);
      svg('path', { d: TRACKS, class: 'closed-loop-track' }, form);
      svg('path', { d: 'M9 67H55', class: 'closed-loop-c' }, form);
    }
    const g = svg('g', onCard, mech);
    // migration starts from content-gen's page: its ghost, fading as the blocks draw over it
    const ghost = k === 1 ? svg('path', { d: LEGACY.map(([pd]) => pd).join(''), class: 'closed-loop-ink is-thin' }, g) : null;
    const items = PAGES[k].map(([pd, from, to, kind]) => ({
      el: svg('path', { d: pd, class: `closed-loop-ink${kind ? ` is-${kind}` : ''}`, pathLength: 1 }, g),
      from,
      to,
      last: -1,
    }));
    const pin = k === 2 ? svg('circle', {
      cx: 51, cy: 67, r: 0, class: 'closed-loop-pin-score',
    }, g) : null;
    const node = add('circle', {
      cx: tx, cy: ty, r: 6.5, class: 'closed-loop-s',
    }, mech, 'fade');
    return {
      cx, cy, x0, y0, g, frame, ghost, items, pin, node, active: null,
    };
  });

  // the coordinator: the ring's track, its three thirds, the hub and its core
  add('circle', {
    cx: HX, cy: HY, r: 19, class: 'closed-loop-c',
  }, mech, 'fade');
  const ring = svg('g', {}, mech);
  const arcs = AXES.map((a) => svg('path', {
    d: `M${at(19, a - 56 * DEG)}A19 19 0 0 1 ${at(19, a + 56 * DEG)}`,
    class: 'closed-loop-arc',
    pathLength: 1,
  }, ring));
  add('circle', {
    cx: HX, cy: HY, r: 12, class: 'closed-loop-s closed-loop-hub', pathLength: 1,
  }, mech, 'draw');
  const core = svg('circle', {
    cx: HX, cy: HY, r: 3.4, class: 'closed-loop-core',
  }, mech);

  // the run: a trail per petal (out and back, then it fades: the ring keeps the record),
  // a bright head and the dot
  const trails = AXES.map(() => svg('path', { d, class: 'closed-loop-trail', pathLength: 1 }, cut));
  const head = svg('path', { d, class: 'closed-loop-head', pathLength: 1 }, cut);
  const halo = svg('circle', { r: 9, class: 'closed-loop-halo' }, mech);
  const dot = svg('circle', { r: 4.4, class: 'closed-loop-dot' }, mech);

  // leaders and labels: [part, pin x, pin y, end x, end y, label x, label y, align]
  const [g0, g1, g2] = stations;
  const callouts = [
    ['coordinator', HX + 22 * Math.cos(24 * DEG), HY + 22 * Math.sin(24 * DEG), HX + 41, HY + 18, HX + 46, HY + 18, 'left'],
    ['content-gen', g0.x0 + 14, g0.y0, g0.x0 + 14, g0.y0 - 10, g0.x0, g0.y0 - 37, 'left'],
    ['migration', g1.x0, g1.cy, g1.x0 - 13, g1.cy, g1.x0 - 18, g1.cy, 'right'],
    ['eval', g2.x0, g2.cy, g2.x0 - 13, g2.cy, g2.x0 - 18, g2.cy, 'right'],
  ];
  const labels = {};
  callouts.forEach(([part, px, py, ex, ey, lx0, ly0, align]) => {
    const label = place(part, lx0, ly0, 500, align);
    if (!label) return;
    labels[part] = label;
    add('path', { d: `M${px} ${py}L${ex} ${ey}`, class: 'closed-loop-leader', pathLength: 1 }, mech, 'draw');
    add('circle', {
      cx: px, cy: py, r: 1.6, class: 'closed-loop-pin',
    }, mech, 'fade');
  });

  stage.append(root);
  let kpx = 1; // viewBox units per CSS pixel
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (!w) return;
    kpx = 500 / w;
    root.style.setProperty('--k', kpx.toFixed(3));
  }).observe(stage);

  const ptr = pointer(stage);
  let tau = 0;
  let rate = 0;
  let introDone = false;
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

  function drawIntro(t) {
    let done = true;
    intro.forEach(([el, kind], i) => {
      const p = arrive(clamp((t - Math.min(0.06, 1.15 / intro.length) * i) / 0.8));
      if (p < 1) done = false;
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });
    introDone = done;
  }

  function draw(t, dt) {
    ptr.update(dt);
    if (reduceMotion()) {
      tau = t;
      if (!introDone) drawIntro(99);
    } else {
      rate += ((ptr.over ? 1.4 : 1) - rate) * (1 - Math.exp(-dt * 3));
      tau = (tau + dt * rate * arrive(clamp(t / 1.2))) % T;
      if (!introDone) drawIntro(t);
    }

    // where the run is: g along the trefoil (0..1), a third per stage
    const k = Math.min(3, Math.floor(tau / STAGE));
    const u = tau - k * STAGE;
    let local = 1;
    let work = -1;
    if (k < 3) {
      if (u < 0.3) local = 0;
      else if (u < 1.2) local = 0.5 * travel((u - 0.3) / 0.9);
      else if (u < 2.4) {
        local = 0.5;
        work = (u - 1.2) / 1.2;
      } else if (u < 3.3) local = 0.5 + 0.5 * travel((u - 2.4) / 0.9);
    }
    const g = k < 3 ? (k + local) / 3 : 1;
    const j = Math.round(g * L) % L;
    const x = lx[j];
    const y = ly[j];
    const inHub = 1 - clamp((Math.hypot(x - HX, y - HY) - 7) / 9);

    trails.forEach((trail, i) => {
      set(trail, 'stroke-dashoffset', (-i / 3).toFixed(4));
      const back3 = i * STAGE + 3.3; // back at the hub: the trail fades, the ring keeps it
      dash(trail, clamp((g - i / 3) * 3) / 3, 1 - leave(span(tau, back3, back3 + 0.8)));
    });
    const hl = Math.min(g, 0.04);
    dash(head, hl, 1 - inHub);
    set(head, 'stroke-dashoffset', (hl - g).toFixed(4));
    dot.setAttribute('cx', x.toFixed(2));
    dot.setAttribute('cy', y.toFixed(2));
    halo.setAttribute('cx', x.toFixed(2));
    halo.setAttribute('cy', y.toFixed(2));
    set(dot, 'opacity', (1 - inHub).toFixed(3));
    set(halo, 'opacity', ((1 - inHub) * (work >= 0 ? 1 : 0.6)).toFixed(3));

    // the coordinator's ring: a third lights as each stage's result comes back; closed, it rings
    arcs.forEach((arc, i) => {
      const out = LEAVE + 0.3 + 0.08 * i;
      const lit = arrive(span(tau, i * STAGE + 3.1, i * STAGE + 3.7));
      dash(arc, lit, 1 - leave(span(tau, out, out + 0.3)));
    });
    const rung = pulse(tau, CLOSE - 0.05, 0.26);
    ring.setAttribute('transform', `translate(${HX} ${HY}) scale(${(1 + 0.13 * rung).toFixed(3)}) translate(${-HX} ${-HY})`);
    core.setAttribute('r', (3.4 + 1.2 * rung).toFixed(2));
    set(core, 'opacity', inHub.toFixed(3));

    // each station's work: drawn on while the run is there, ink once it has gone back; its card
    // is dashed until the work starts, and the cards leave one after another
    stations.forEach((s, i) => {
      let w = i < k || (i === k && u >= 2.4) ? 1 : 0;
      if (i === k && work >= 0) w = work;
      s.items.forEach((item) => {
        const p = arrive(clamp((w - item.from) / (item.to - item.from)));
        if (p !== item.last) {
          item.last = p;
          dash(item.el, p);
          item.el.style.fillOpacity = p.toFixed(3);
        }
      });
      if (s.ghost) set(s.ghost, 'opacity', (0.4 * clamp(w / 0.12) * (1 - clamp((w - 0.2) / 0.45))).toFixed(3));
      if (s.pin) s.pin.setAttribute('r', (2.6 * snap(span(w, 0.88, 1))).toFixed(2));
      const out = LEAVE + 0.08 * i;
      set(s.g, 'opacity', (1 - leave(span(tau, out, out + 0.3))).toFixed(3));
      const starts = i * STAGE + 1.2;
      const solid = arrive(span(tau, starts, starts + 0.3)) * (1 - span(tau, out, out + 0.3));
      set(s.frame, 'stroke-dasharray', `0.012 ${(0.012 * (1 - solid)).toFixed(4)}`);
      const active = i === k && u >= 1.2 && u < 3.3;
      if (active !== s.active) {
        s.active = active;
        s.g.classList.toggle('is-active', active);
        labels[PARTS[i]]?.classList.toggle('is-active', active);
      }
      // the landing: the node rings out once as the run docks
      s.node.setAttribute('r', (6.5 + 1.6 * (i === k ? pulse(u, 1.2, 0.26) : 0)).toFixed(2));
    });

    // ambient: the wash breathes over 17 s; on hover the construction plane drifts 5px
    set(washEl, 'opacity', (0.9 + 0.1 * breath(t, 17)).toFixed(3));
    back.setAttribute('transform', `translate(${(ptr.x * 5 * kpx).toFixed(2)} ${(ptr.y * 5 * kpx).toFixed(2)})`);
  }

  loop(stage, draw, { still: STILL });
}
