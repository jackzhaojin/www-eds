/**
 * Scene engine `clock-tower`: the Continuous Executive Agent as a clock tower's movement, an
 * engineering plate. Three involute spur gears mesh: the executive wheel (48 teeth) turns the
 * dial's hand through its loop's eight phases once per goal (12 s) and drives the management
 * wheel (24, a turn per step), which drives the worker pinion (12, a turn per contract). Each
 * worker turn flashes its index tooth and drops a stone down the plumb line: two piers (the first
 * step), then the two halves of a pointed arch (the second), which closes as the hand reaches
 * the top. The finished arch leaves, stone by stone, and the next one starts.
 *
 * Parts (rows): `executive` (the great wheel and dial), `management` (the middle wheel),
 * `worker` (the pinion). Each label sits right of the tower on a leader to its wheel.
 */
const S = 500;
const TAU = Math.PI * 2;
const PA = Math.PI / 9;
const MOD = 2.6;
const X = 188;
const T = 12;
const OMEGA = TAU / T;
const STILL = 10;
const DROP = 0.35;
const FOOT = 464;
const GROUND = FOOT + 16;
// the drawing (y 10 to the ground line) fills 82% of the plate's height, its tower left of centre
const SC = 410 / (GROUND - 10);
const OX = 165 - X * SC;
const OY = 45 - 10 * SC;

const fx = (v) => Math.round(v * 100) / 100;
const polar = (r, a, cx = 0, cy = 0) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const poly = (pts) => `M${pts.map(([x, y]) => `${fx(x)} ${fx(y)}`).join('L')}Z`;
const ring = (r, x = 0, y = 0) => `M${fx(x + r)} ${fx(y)}a${r} ${r} 0 1 1 ${-2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0Z`;
const clamp = (v) => Math.min(1, Math.max(0, v));
const mod = (v, m) => ((v % m) + m) % m;

// the grammar's curves in closed form: arrive (0.16, 1, 0.3, 1) is easeOutExpo, snap
// (0.34, 1.56, 0.64, 1) easeOutBack, leave (0.32, 0, 0.67, 0) easeInCubic
const arrive = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * clamp(x)));
const snap = (x) => 1 + 2.70158 * (clamp(x) - 1) ** 3 + 1.70158 * (clamp(x) - 1) ** 2;
const leave = (x) => clamp(x) ** 3;
/** A flash: snaps on over 200 ms, then fades over 400 ms. */
const flash = (s) => (s < 0.2 ? Math.min(1, snap(s / 0.2)) : 1 - leave((s - 0.2) / 0.4));

/** A gear's outline, tooth 0 on local angle 0: involute flanks, radial below the base circle. */
export function gearOutline(n, m = MOD) {
  const r = (m * n) / 2;
  const ra = r + 0.95 * m;
  const rf = r - 1.25 * m;
  const rb = r * Math.cos(PA);
  const inv = (a) => Math.tan(a) - a;
  const psi = (p) => (Math.PI / (2 * n)) * 0.93 + inv(PA) - (p > rb ? inv(Math.acos(rb / p)) : 0);
  const r0 = Math.max(rf, rb);
  const radii = rf < rb ? [rf] : [];
  for (let i = 0; i <= 4; i += 1) radii.push(r0 + ((ra - r0) * i) / 4);
  const pts = [];
  for (let k = 0; k < n; k += 1) {
    const c = (k * TAU) / n;
    radii.forEach((p) => pts.push(polar(p, c - psi(p))));
    pts.push(polar(ra, c));
    [...radii].reverse().forEach((p) => pts.push(polar(p, c + psi(p))));
    pts.push(polar(rf, c + Math.PI / n));
  }
  return {
    pts, r, ra, rf, per: 2 * radii.length + 2,
  };
}

// k: turns per executive turn; an index tooth fires (flashes) when it points at `ref`, about
// `fire` seconds into its turn
const TRAIN = [
  {
    key: 'executive', n: 48, spokes: 6, k: 1, tag: -0.62,
  },
  {
    key: 'management', n: 24, spokes: 5, at: 1.35, k: -2, ref: 2.15, fire: 6 - DROP, tag: -0.5,
  },
  {
    key: 'worker', n: 12, spokes: 0, at: 2.15, k: 4, ref: Math.PI / 2, fire: 3 - DROP, tag: 0.9,
  },
];

export default function engine(block, kit) {
  const {
    stage, svg, place, parts, loop, pointer, reduceMotion, onTheme,
  } = kit;
  const art = svg('svg', {
    viewBox: `0 0 ${S} ${S}`, class: 'clock-tower-art', 'aria-hidden': 'true', focusable: 'false',
  }, stage);
  onTheme(block, (p) => art.classList.toggle('is-night', p.dark));
  // stroke widths and dashes are set in screen pixels through --u (user units per pixel)
  new ResizeObserver(() => {
    if (stage.clientWidth) art.style.setProperty('--u', `${fx(S / (stage.clientWidth * SC))}px`);
  }).observe(stage);
  const id = `clock-tower-${Math.random().toString(36).slice(2, 8)}`;
  const grad = svg('radialGradient', { id }, svg('defs', {}, art));
  [[0, 0.14], [0.6, 0.05], [1, 0]].forEach(([o, a]) => svg('stop', { offset: o, 'stop-opacity': a }, grad));
  const root = svg('g', { transform: `translate(${fx(OX)} ${fx(OY)}) scale(${fx(SC * 1000) / 1000})` }, art);
  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const drawn = [];
  const faded = [];
  const line = (d, cls, parent = back, draws = true) => {
    const el = svg('path', { d, class: `clock-tower-${cls}` }, parent);
    if (draws) {
      el.setAttribute('pathLength', '1');
      el.setAttribute('stroke-dasharray', '1 1');
      drawn.push(el);
    } else faded.push(el);
    return el;
  };

  // ---------- the train: centres from the module and tooth counts ----------
  let prev = null;
  const gears = TRAIN.map((g) => {
    const gear = {
      ...g, ...gearOutline(g.n), x: X, y: 215,
    };
    if (prev) [gear.x, gear.y] = polar((MOD * (prev.n + g.n)) / 2, g.at, prev.x, prev.y);
    prev = gear;
    return gear;
  });
  const angles = (te) => {
    let th = te;
    return gears.map((g, i) => {
      if (i) th = g.at + Math.PI + Math.PI / g.n - (gears[i - 1].n / g.n) * (th - g.at);
      return th;
    });
  };
  const zero = angles(0);
  const [ge, , gw] = gears;
  // each index tooth: the one that reaches `ref` nearest the nominal time, and that exact time
  gears.forEach((g, i) => {
    if (g.ref == null) return;
    g.period = T / Math.abs(g.k);
    let best = Infinity;
    for (let j = 0; j < g.n; j += 1) {
      const t = mod((g.ref - zero[i] - (j * TAU) / g.n) / (g.k * OMEGA), g.period);
      const miss = Math.abs(mod(t - g.fire + g.period / 2, g.period) - g.period / 2);
      if (miss < best) [best, g.tooth, g.fired] = [miss, j, t];
    }
  });
  const lands = [0, 1, 2, 3].map((k) => gw.fired + DROP + 3 * k);

  // ---------- back plane: the tower, cut open ----------
  const glow = svg('g', {}, back);
  svg('circle', {
    cx: X, cy: ge.y, r: 108, style: `fill: url(#${id})`, class: 'clock-tower-wash',
  }, glow);
  const top = 140;
  const pp = top - 22;
  const ridge = 28;
  [[X - 79, X - 72], [X + 72, X + 79]].forEach(([x0, x1]) => {
    line(`M${x0} ${FOOT}V${top}M${x1} ${FOOT}V${top}`, 'ink');
    let d = '';
    for (let y = top + 8; y < FOOT; y += 6) d += `M${x0} ${y}L${x1} ${y - 7}`;
    line(d, 'faint', back, false);
  });
  line(`M${X - 86} ${top}h172v-8h-172ZM${X - 78} ${top - 8}V${pp}H${X + 78}V${top - 8}`, 'ink');
  let d = '';
  for (let x = X - 62; x < X + 66; x += 22) d += `M${x} ${top - 8}v-7q0-4 7-5q7 1 7 5v7`;
  line(d, 'faint', back, false);
  [-78, 78].forEach((dx) => line(`M${X + dx - 3.5} ${pp}v-9h7v9M${X + dx - 3.5} ${pp - 9}L${X + dx} ${pp - 32}L${X + dx + 3.5} ${pp - 9}`, 'ink'));
  line(`M${X - 40} ${pp}L${X} ${ridge}L${X + 40} ${pp}M${X} ${ridge}v-18`, 'ink');
  svg('circle', {
    cx: X, cy: ridge - 10, r: 2.2, class: 'clock-tower-dot',
  }, back);
  d = `M${X - 6} ${pp}v-12l6-8l6 8v12`;
  for (let x = X + 5; x < X + 38; x += 4.5) d += `M${fx(x)} ${fx(ridge + ((x - X) * (pp - ridge)) / 40)}V${pp}`;
  line(d, 'faint', back, false);
  line(`M${X - 86} ${FOOT}h172v8h-172ZM${X - 94} ${FOOT + 8}h188v8h-188Z`, 'ink');
  line(`M${fx((40 - OX) / SC)} ${GROUND}H${fx((460 - OX) / SC)}`, 'line');
  line(`M${X} ${GROUND + 6}v12`, 'chain', back, false);

  // ---------- mechanism: construction, the wheels, the dial ----------
  const spring = FOOT - 20;
  gears.forEach((g) => {
    const k = g.ra + 9;
    const down = g === gw ? spring - 2 - g.y : k;
    line(`M${fx(g.x - k)} ${fx(g.y)}h${fx(2 * k)}M${fx(g.x)} ${fx(g.y - k)}V${fx(g.y + down)}`, 'chain', mech, false);
  });
  line(`M${gears.map((g) => `${fx(g.x)} ${fx(g.y)}`).join('L')}`, 'line', mech);
  const groups = [];
  const group = (key, attrs = {}) => {
    const g = svg('g', { ...attrs, 'data-part': key }, mech);
    groups.push(g);
    return g;
  };
  gears.forEach((g) => {
    const spin = svg('g', {}, group(g.key, { transform: `translate(${fx(g.x)} ${fx(g.y)})` }));
    const rim = g.rf - 1.6 * MOD;
    const hub = g.spokes ? Math.max(6, g.r * 0.17) : g.r * 0.36;
    let body = poly(g.pts);
    if (g.spokes) {
      body += ring(rim);
      let sp = '';
      for (let i = 0; i < g.spokes; i += 1) {
        const a = -Math.PI / 2 + Math.PI / g.spokes + (i * TAU) / g.spokes;
        const [c, s] = [Math.cos(a), Math.sin(a)];
        const pt = (r, w) => [c * r - s * w, s * r + c * w];
        const [w0, w1] = [Math.max(2.4, g.r * 0.055), Math.max(1.6, g.r * 0.034)];
        sp += poly([pt(hub - 1, w0), pt(rim + 2, w1), pt(rim + 2, -w1), pt(hub - 1, -w0)]);
      }
      svg('path', { d: sp, class: 'clock-tower-metal' }, spin);
    }
    svg('path', { d: body, class: 'clock-tower-metal clock-tower-rim', 'fill-rule': 'evenodd' }, spin);
    if (!g.spokes) svg('circle', { r: fx(g.rf - 2.5), class: 'clock-tower-faint' }, spin);
    svg('circle', { r: fx(hub), class: 'clock-tower-metal' }, spin);
    svg('circle', { r: 1.8, class: 'clock-tower-dot' }, spin);
    if (g.tooth != null) {
      const at = g.tooth * g.per;
      g.flash = svg('path', { d: poly(g.pts.slice(at, at + g.per - 1)), class: 'clock-tower-tooth', opacity: 0 }, spin);
      const [ix, iy] = polar(g.spokes ? rim + 1.8 : (hub + g.rf) / 2, (g.tooth * TAU) / g.n);
      svg('circle', {
        cx: fx(ix), cy: fx(iy), r: 1.7, class: 'clock-tower-dot',
      }, spin);
    }
    g.spin = spin;
  });
  gears.forEach((g) => line(ring(g.r, g.x, g.y), 'chain', mech, false));

  const dial = group('executive', { transform: `translate(${X} ${ge.y})` });
  svg('circle', { r: 45, class: 'clock-tower-metal clock-tower-face' }, dial);
  svg('circle', { r: 31, class: 'clock-tower-faint' }, dial);
  const marks = [];
  for (let k = 0; k < 8; k += 1) {
    const g = svg('g', { transform: `rotate(${k * 45})` }, dial);
    d = `M0 ${k ? -34 : -32}V-41`;
    svg('path', { d, class: 'clock-tower-mark' }, g);
    marks.push({ el: svg('path', { d, class: 'clock-tower-lit', opacity: 0 }, g), v: -1 });
  }
  const trail = svg('g', { class: 'clock-tower-trail' }, dial);
  for (let i = 0; i < 7; i += 1) {
    const [x0, y0] = polar(37.5, -Math.PI / 2 - (i + 1) * 0.125);
    const [x1, y1] = polar(37.5, -Math.PI / 2 - i * 0.125);
    svg('path', { d: `M${fx(x0)} ${fx(y0)}A37.5 37.5 0 0 1 ${fx(x1)} ${fx(y1)}`, opacity: fx(0.75 * (1 - i / 7) ** 1.4) }, trail);
  }
  const hand = svg('g', { class: 'clock-tower-hand' }, dial);
  svg('path', { d: 'M0 10V-30', class: 'clock-tower-stem' }, hand);
  svg('path', { d: 'M0 -28L3.4 -35L0 -42L-3.4 -35Z', class: 'clock-tower-tip' }, hand);
  [[12, 2.6, 'tip'], [0, 3.6, 'tip'], [0, 1.2, 'pin']].forEach(([cy, r, c]) => svg('circle', { cy, r, class: `clock-tower-${c}` }, hand));

  // ---------- what the worker builds: a pointed arch, a stone per contract, a course per step ----
  const site = group('worker');
  const cx = gw.x;
  // piers 18 x 20 either side of a 40 opening; the ring 18 deep on intrados radius 40
  const [h1, h2] = [Math.sqrt(40 ** 2 - 400), Math.sqrt(58 ** 2 - 400)];
  const half = (sg) => `M${fx(cx - sg * 38)} ${spring}A58 58 0 0 ${sg > 0 ? 1 : 0} ${fx(cx)} ${fx(spring - h2)}V${fx(spring - h1)}A40 40 0 0 ${sg > 0 ? 0 : 1} ${fx(cx - sg * 20)} ${spring}Z`;
  const shapes = [
    `M${fx(cx - 38)} ${FOOT}h18v-20h-18Z`, `M${fx(cx + 20)} ${FOOT}h18v-20h-18Z`, half(1), half(-1),
  ];
  const stones = shapes.map((sd) => {
    const g = svg('g', { opacity: 0 }, site);
    svg('path', { d: sd, class: 'clock-tower-set' }, g);
    return {
      g, lit: svg('path', { d: sd, class: 'clock-tower-stone', opacity: 0 }, g), key: '',
    };
  });
  const drop = svg('path', { d: `M${fx(cx)} -8V0`, class: 'clock-tower-drop', opacity: 0 }, site);
  const dropFrom = gw.y + gw.ra + 2;
  const dropTo = [spring, spring, spring - h1, spring - h1];

  // ---------- leaders and labels ----------
  const LX = 312;
  gears.forEach((g) => {
    const [x0, y0] = polar(g.ra + 3, g.tag, g.x, g.y);
    const lead = group(g.key, { class: 'clock-tower-lead' });
    svg('path', { d: `M${fx(x0)} ${fx(y0)}H${fx((LX - OX) / SC)}`, class: 'clock-tower-leader' }, lead);
    svg('circle', {
      cx: fx(x0), cy: fx(y0), r: 2, class: 'clock-tower-dot',
    }, lead);
    const label = place(g.key, LX + 6, OY + y0 * SC, S, 'left');
    if (!label) return;
    label.style.pointerEvents = 'auto';
    label.addEventListener('pointerenter', () => {
      groups.forEach((el) => el.classList.toggle('is-dim', el.dataset.part !== g.key));
      parts.forEach((l) => l.classList.toggle('is-dim', l !== label));
    });
    label.addEventListener('pointerleave', () => {
      groups.forEach((el) => el.classList.remove('is-dim'));
      parts.forEach((l) => l.classList.remove('is-dim'));
    });
  });

  // ---------- motion ----------
  const ptr = pointer(stage);
  let tau = 0.45;
  let hover = 0;
  let intro = true;
  const deg = (a) => fx(((a * 180) / Math.PI) % 360);

  loop(stage, (t, dt) => {
    ptr.update(dt);
    const still = reduceMotion();
    if (still) tau = STILL;
    else {
      hover += ((ptr.over ? 1 : 0) - hover) * (1 - Math.exp(-dt * 3));
      tau += dt * arrive(clamp((t - 0.3) / 1.2)) * (1 + 0.4 * hover);
    }
    if (intro) {
      const at = still ? 9 : t;
      drawn.forEach((el, i) => el.setAttribute('stroke-dashoffset', fx(1 - arrive(clamp((at - i * 0.06) / 0.8)))));
      faded.forEach((el) => el.setAttribute('opacity', fx(arrive(clamp((at - 0.4) / 1)))));
      intro = at < 1.6;
    }
    back.setAttribute('transform', `translate(${fx((ptr.x * -4) / SC)} ${fx((ptr.y * -4) / SC)})`);
    glow.setAttribute('opacity', fx(0.98 + 0.02 * Math.cos((TAU * t) / 17)));

    const te = OMEGA * tau;
    angles(te).forEach((th, i) => gears[i].spin.setAttribute('transform', `rotate(${deg(th)})`));
    hand.setAttribute('transform', `rotate(${deg(te)})`);
    trail.setAttribute('transform', `rotate(${deg(te)})`);

    const u = mod(tau, T);
    const phase = Math.floor(u / (T / 8));
    const since = u - (phase * T) / 8;
    marks.forEach((mk, k) => {
      let o = 0;
      if (k === phase) o = snap(since / 0.24);
      else if (k === (phase + 7) % 8) o = 1 - leave(since / 0.3);
      const v = fx(Math.min(1, o));
      if (v === mk.v) return;
      mk.el.setAttribute('opacity', v);
      mk.el.setAttribute('transform', `translate(0 -41) scale(1 ${fx(0.4 + 0.6 * o)}) translate(0 41)`);
      mk.v = v;
    });
    gears.forEach((g) => {
      if (g.flash) g.flash.setAttribute('opacity', fx(flash(mod(u - g.fired, g.period))));
    });
    const s = mod(u - gw.fired, 3);
    const k = Math.floor(mod(u - gw.fired, T) / 3);
    const fall = s / DROP;
    drop.setAttribute('opacity', fall < 1 && tau > gw.fired ? 1 : 0);
    drop.setAttribute('transform', `translate(0 ${fx(dropFrom + (dropTo[k] - dropFrom) * Math.min(1, fall) ** 2)})`);

    stones.forEach((st, i) => {
      const a = mod(u - lands[i], T);
      // the finished arch holds about a second, then leaves top down over 600 ms
      const out = T - lands[i] + 1 + 0.1 * (3 - i);
      let [o, dx, dy, lit] = [0, 0, 0, 0];
      if (tau >= lands[0] && a < out + 0.3) {
        const p = clamp(a / 0.26);
        const g = clamp((a - out) / 0.3);
        [o, dx, dy] = [Math.min(clamp(p * 3), 1 - leave(g)), 10 * leave(g), -8 * (1 - snap(p))];
        const next = i < 3 ? 3 : out;
        lit = a < next ? Math.min(1, snap(p)) : 1 - leave(clamp((a - next) / 0.3));
      }
      const key = `${fx(o)} ${fx(dx)} ${fx(dy)} ${fx(lit)}`;
      if (key === st.key) return;
      st.key = key;
      st.g.setAttribute('opacity', fx(o));
      st.g.setAttribute('transform', `translate(${fx(dx)} ${fx(dy)})`);
      st.lit.setAttribute('opacity', fx(lit));
    });
  }, { still: STILL });
}
