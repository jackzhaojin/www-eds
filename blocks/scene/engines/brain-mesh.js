/**
 * Scene (brain-mesh): AnimaMesh 2.x, the mesh of brains. Brains are point-sphere
 * constellations in ink: the org brain behind (upper left), a shared brain (right) inside it
 * by a containment link, with three people seated round it (multi-player), and one person's
 * brain in front (lower left), that person standing at its gate (two posts and a hinged bar).
 * The person and shared brains link in two halves, one from each, with a knot in the gap. The
 * accent carries the story; the brains stay ink.
 *
 * Loop, 10 s: the person brain's heartbeat wakes an agent past the gate. It runs its half to
 * the knot; the org's law flows down to the shared brain, the member nearest agrees, the shared
 * half lights and the halves join (and stay joined, in ink, until the loop ends). The agent
 * reads and comes back as a draft that stops at the bar; the person approves, the bar swings
 * open, and the draft lands as one new point.
 *
 * Parts (500 square): `org` (upper right of the org brain), `shared` (above the shared brain),
 * `person` (above the person brain), `gate` (under the person at the gate).
 */
const T = 10;
const STILL = 7.7;
const TILT = 0.38;
const GATE = 0.15;
const WAKE = 0.27;
const TAU = Math.PI * 2;

const BRAINS = {
  org: {
    x: 200, y: 128, r: 72, n: 260, dot: 0.95, plane: 0.62, spin: 140, px: 3, edge: 0.15,
  },
  shared: {
    x: 372, y: 300, r: 62, n: 220, dot: 1.05, plane: 0.8, spin: -100, px: 4.5, edge: 0.15,
  },
  person: {
    x: 108, y: 372, r: 50, n: 170, dot: 1.15, plane: 1, spin: 80, px: 6, edge: 0.3,
  },
};
/* the people seated round the shared brain (angles); the last, nearest the link, agrees */
const MEMBERS = [-0.42, 0.8, 2.25];
/* label: [x, y, align], the leader's start, and the brain rim (angle) it ends on */
const LABELS = {
  org: { at: [296, 60, 'left'], from: [290, 68], rim: ['org', -0.55] },
  shared: { at: [458, 196, 'right'], from: [442, 220], rim: ['shared', -0.95] },
  person: { at: [40, 270, 'left'], from: [58, 294], rim: ['person', -2.1] },
  gate: { at: [222, 438, 'left'], from: [224, 416] },
};

/* the motion grammar's curves in closed form, the shapes of its cubic-beziers: arrive
   (0.16, 1, 0.3, 1), travel (0.65, 0, 0.35, 1), snap (0.34, 1.56, 0.64, 1),
   leave (0.32, 0, 0.67, 0) */
const arrive = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));
const travel = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2);
const snap = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
const leave = (x) => x ** 3;
const span = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u;
const mix = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const add = (a, d, f) => [a[0] + d[0] * f, a[1] + d[1] * f];
const live = (v) => v > 0 && v < 1;

/* a Fibonacci point sphere, a size per point, its larger points linked to their two nearest */
function sphere(b, rand) {
  const { n } = b;
  const p = new Float32Array(n * 3);
  const w = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    p.set([r * Math.cos(i * 2.39996), y, r * Math.sin(i * 2.39996)], i * 3);
    w[i] = 0.8 + 0.9 * rand() ** 7;
  }
  const hubs = [...w.keys()].filter((i) => w[i] > 1.1);
  const d2 = (i, j) => (p[i * 3] - p[j * 3]) ** 2 + (p[i * 3 + 1] - p[j * 3 + 1]) ** 2
    + (p[i * 3 + 2] - p[j * 3 + 2]) ** 2;
  const edges = new Map();
  hubs.forEach((i) => hubs.filter((j) => j !== i).sort((a, c) => d2(i, a) - d2(i, c)).slice(0, 2)
    .forEach((j) => edges.set(`${Math.min(i, j)} ${Math.max(i, j)}`, [i, j])));
  const f32 = () => new Float32Array(n);
  const screen = {
    sx: f32(), sy: f32(), sz: f32(), ss: f32(), sl: new Uint8Array(n),
  };
  return {
    ...b, ...screen, p, w, edges: [...edges.values()], ox: 0, oy: 0,
  };
}

/* a bowed link (a quadratic) from rim to rim of brains a and b */
function makeLink(a, b, bow) {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / d;
  const uy = (b.y - a.y) / d;
  const A = [a.x + ux * a.r * 1.14, a.y + uy * a.r * 1.14];
  const Z = [b.x - ux * b.r * 1.14, b.y - uy * b.r * 1.14];
  const C = [(A[0] + Z[0]) / 2 - uy * bow, (A[1] + Z[1]) / 2 + ux * bow];
  return {
    a, b, A, C, Z, gap: 9 / Math.hypot(Z[0] - A[0], Z[1] - A[1]),
  };
}

export default function engine(block, kit) {
  const { stage } = kit;
  let redraw = () => {};
  const lead = kit.svg('svg', { class: 'brain-mesh-leads', viewBox: '0 0 500 500', 'aria-hidden': 'true' });
  const cv = kit.canvas(stage, (c) => {
    lead.style.setProperty('--u', 500 / c.size);
    redraw();
  });
  stage.append(lead);
  lead.style.setProperty('--u', 500 / (cv.size || 500));
  const { ctx } = cv;
  const ptr = kit.pointer(stage);
  const rand = kit.random(7);
  const B = Object.fromEntries(Object.entries(BRAINS).map(([key, b]) => [key, sphere(b, rand)]));
  const { org, shared, person } = B;
  const story = makeLink(person, shared, 18);
  const law = makeLink(shared, org, -20);

  /* where a link is at u (0 at its first brain), with its brains' parallax */
  const at = (L, u) => {
    const v = 1 - u;
    const q = (i) => v * v * L.A[i] + 2 * v * u * L.C[i] + u * u * L.Z[i];
    return [q(0) + lerp(L.a.ox, L.b.ox, u), q(1) + lerp(L.a.oy, L.b.oy, u)];
  };

  /* the gate on the story link just off the person brain: a post either side of the link and a
     bar between them, hinged on the upper post, that swings up to open; the person stands
     below it */
  const g0 = at(story, GATE);
  const g1 = at(story, GATE + 0.01);
  const tl = Math.hypot(g1[0] - g0[0], g1[1] - g0[1]);
  const tan = [(g1[0] - g0[0]) / tl, (g1[1] - g0[1]) / tl];
  const nrm = [-tan[1], tan[0]];
  const shut = Math.atan2(nrm[1], nrm[0]);
  const keeper = add(g0, nrm, 40);

  /* leaders, drawn once in SVG over the canvas (stroke widths scale with --u, set above) */
  Object.entries(LABELS).forEach(([key, l], i) => {
    if (!kit.place(key, l.at[0], l.at[1], 500, l.at[2])) return;
    const b = B[l.rim?.[0]];
    const to = b ? [b.x + Math.cos(l.rim[1]) * b.r * 1.06, b.y + Math.sin(l.rim[1]) * b.r * 1.06]
      : add(keeper, [0, 1], 10);
    kit.svg('path', { d: `M${l.from}L${to}`, pathLength: 1, style: `--i: ${i}` }, lead);
    kit.svg('circle', { cx: to[0], cy: to[1], r: 1.6 }, lead);
  });

  let C = {};
  kit.onTheme(block, (pal) => {
    const acc = kit.rgb(pal.accent);
    const radial = (c, x, y, r, a) => {
      const gr = c.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${acc}, ${a})`);
      gr.addColorStop(1, `rgba(${acc}, 0)`);
      return gr;
    };
    const sprite = document.createElement('canvas');
    sprite.width = 64;
    sprite.height = 64;
    const sc = sprite.getContext('2d');
    sc.fillStyle = radial(sc, 32, 32, 32, 0.55);
    sc.fillRect(0, 0, 64, 64);
    C = {
      ink: `rgb(${kit.rgb(pal.ink)})`,
      acc: `rgb(${acc})`,
      dark: pal.dark,
      sprite,
      wash: radial(ctx, 190, 350, 170, pal.dark ? 0.11 : 0.08),
    };
    redraw();
  });

  let k = 1;
  const lw = (px) => px / k;
  const sz = (px) => px / Math.sqrt(k);
  const pen = (color, width, a) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw(width);
    ctx.globalAlpha = a;
  };
  const ink = (color, a) => {
    ctx.fillStyle = color;
    ctx.globalAlpha = a;
  };
  const circle = (x, y, r, fill) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    if (fill) ctx.fill();
    else ctx.stroke();
  };
  const line = (a, b) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };

  /* rotate, tilt and project a brain; tone by depth and a soft light from the upper left */
  const project = (s, a) => {
    const [ca, sa, cb, sb] = [Math.cos(a), Math.sin(a), Math.cos(TILT), Math.sin(TILT)];
    for (let i = 0; i < s.n; i += 1) {
      const x = s.p[i * 3];
      const y = s.p[i * 3 + 1];
      const z = s.p[i * 3 + 2];
      const x1 = x * ca + z * sa;
      const z1 = z * ca - x * sa;
      const y2 = y * cb - z1 * sb;
      const z2 = y * sb + z1 * cb;
      const f = 4.2 / (4.2 - z2);
      s.sx[i] = s.x + s.ox + x1 * f * s.r;
      s.sy[i] = s.y + s.oy - y2 * f * s.r;
      s.sz[i] = z2;
      s.ss[i] = f;
      const lit = Math.max(0, -0.45 * x1 + 0.55 * y2 + 0.7 * z2);
      const tone = (0.12 + 0.88 * ((z2 + 1) / 2) ** 1.6) * (0.55 + 0.45 * lit);
      s.sl[i] = Math.min(7, Math.floor(tone * 8));
    }
  };

  /* a brain's points in eight tone bands (one fill each, never under 0.25), hub links, rim */
  const brain = (s, alpha) => {
    for (let q = 0; q < 8; q += 1) {
      ink(C.ink, alpha * (0.25 + (s.plane - 0.25) * ((q + 0.5) / 8)));
      ctx.beginPath();
      for (let i = 0; i < s.n; i += 1) {
        if (s.sl[i] === q) {
          const r = sz(s.dot * s.w[i]) * s.ss[i];
          ctx.moveTo(s.sx[i] + r, s.sy[i]);
          ctx.arc(s.sx[i], s.sy[i], r, 0, TAU);
        }
      }
      ctx.fill();
    }
    pen(C.ink, 0.75, alpha * s.edge * s.plane);
    ctx.beginPath();
    s.edges.forEach(([i, j]) => {
      if (Math.min(s.sz[i], s.sz[j]) < 0.1) return;
      ctx.moveTo(s.sx[i], s.sy[i]);
      ctx.lineTo(s.sx[j], s.sy[j]);
    });
    ctx.stroke();
    pen(C.ink, 1, alpha * 0.18);
    circle(s.x + s.ox, s.y + s.oy, s.r * 1.04);
  };

  /* a stretch of a link, u0 to u1 */
  const stretch = (L, u0, u1) => {
    if (u1 <= u0) return;
    const n = Math.ceil((u1 - u0) * 40);
    ctx.beginPath();
    for (let i = 0; i <= n; i += 1) ctx.lineTo(...at(L, lerp(u0, u1, i / n)));
    ctx.stroke();
  };

  /* an accent trail from u0 to u1, brightest at u1 (or at u0) */
  const trail = (L, u0, u1, a, toEnd = true) => {
    if (a <= 0) return;
    for (let i = 0; i < 8; i += 1) {
      const v = toEnd ? (i + 1) / 8 : 1 - i / 8;
      pen(C.acc, 1.75, a * (0.2 + 0.8 * v * v));
      stretch(L, lerp(u0, u1, i / 8), lerp(u0, u1, (i + 1) / 8));
    }
  };

  /* night: an additive sprite; paper: a plain tint (additive washes out on light) */
  const glow = (x, y, r) => {
    if (!C.dark) {
      ink(C.acc, 0.1);
      circle(x, y, r * 0.6, true);
      return;
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    ctx.drawImage(C.sprite, x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';
  };

  /* a person, about 14px: a head over a shoulder arc; yes (0..1) lights the head and rings it */
  const figure = ([x, y], a, yes = 0) => {
    const u = sz(1);
    const head = [x, y - 4 * u];
    pen(C.ink, 1.25, 0.85 * a);
    circle(...head, 3 * u);
    ctx.beginPath();
    ctx.arc(x, y + 7.5 * u, 6.5 * u, Math.PI, TAU);
    ctx.stroke();
    if (!live(yes)) return;
    ink(C.acc, Math.sin(Math.PI * yes) * a);
    circle(...head, 3 * u, true);
    pen(C.acc, 1.25, (1 - yes) * 0.8 * a);
    circle(x, y, 10 + 4 * arrive(yes));
  };
  /* a hairline from a person to the rim of their brain, lit (accent) from the person by run */
  const tether = (pt, s, a, gap, run = 0) => {
    const c = [s.x + s.ox, s.y + s.oy];
    const d = Math.hypot(pt[0] - c[0], pt[1] - c[1]);
    const dir = [(pt[0] - c[0]) / d, (pt[1] - c[1]) / d];
    const ends = [add(c, dir, s.r * 1.06), add(c, dir, d - sz(gap))];
    pen(C.ink, 0.75, 0.4 * a);
    line(...ends);
    if (!live(run)) return;
    pen(C.acc, 1.5, Math.sin(Math.PI * run) * a);
    line(mix(ends[1], ends[0], travel(run)), ends[1]);
  };

  /* the mover through the cycle: [from, to, where(u, p), square, alpha(u)] */
  const g = {};
  const wait = GATE + 0.06;
  const STEPS = [
    [0.5, 1, () => at(story, WAKE), 0],
    [1, 2.3, (u) => at(story, lerp(WAKE, 0.5, travel(u))), 0],
    [2.3, 3.7, () => at(story, 0.5), 0],
    [3.7, 4.7, (u) => at(story, 0.5 + 0.5 * travel(u)), 0],
    [4.7, 5.1, (u) => mix(g.rimS, g.deepS, leave(u)), 0, (u) => 1 - span(u, 0.2, 1)],
    [5.1, 5.5, (u) => mix(g.deepS, g.rimS, arrive(u)), 1, (u) => span(u, 0, 0.6)],
    [5.5, 8.2, (u, p) => at(story, lerp(1, wait, travel(span(p, 5.5, 7.1)))), 1],
    [8.2, 8.6, (u) => at(story, lerp(wait, 0, arrive(u))), 1],
    [8.6, 9, (u) => mix(g.rimP, g.land, arrive(u)), (u) => 1 - arrive(u)],
  ];

  let tau = 0;
  let ts = 1;
  let landing = -1;
  let landed = -1;

  const draw = (t, dt) => {
    if (!cv.size || !C.ink) return;
    const still = kit.reduceMotion();
    const it = still ? 9 : t;
    ptr.update(dt);
    if (still) tau = STILL;
    else {
      ts += ((ptr.over ? 1.4 : 1) - ts) * (1 - Math.exp(-dt * 3));
      tau += dt * ts * travel(span(t, 0, 1.2));
    }
    const p = tau % T;
    const breath = 0.5 - 0.5 * Math.cos(TAU * (tau / 2.4));

    k = cv.size / 500;
    ctx.setTransform(cv.dpr * k, 0, 0, cv.dpr * k, 0, 0);
    ctx.clearRect(0, 0, 500, 500);
    ctx.lineCap = 'round';
    Object.values(B).forEach((s, i) => {
      s.ox = (-ptr.x * s.px) / k;
      s.oy = (-ptr.y * s.px) / k;
      project(s, (TAU * tau) / s.spin + i);
    });
    g.inP = [person.x + person.ox, person.y + person.oy];
    g.cS = [shared.x + shared.ox, shared.y + shared.oy];
    g.rimP = at(story, 0);
    g.rimS = at(story, 1);
    g.deepS = mix(g.rimS, g.cS, 0.5);
    /* the intro: points fade in, construction draws on, 60 ms apart */
    const fade = (i) => arrive(span(it, i * 0.06, 0.8 + i * 0.06));
    const draws = (i) => arrive(span(it, 0.15 + i * 0.06, 0.95 + i * 0.06));

    ink(C.wash, 0.98 + 0.02 * breath);
    ctx.fillRect(0, 0, 500, 500);
    brain(org, fade(0));
    /* the org's containment link: one stroke, drawn down from the org; the story link: two
       halves, one from each brain, a knot in the gap, joined in ink once both agreed */
    pen(C.ink, 1.25, 0.5);
    stretch(law, 1 - draws(2), 1);
    const grow = 0.5 * draws(1);
    stretch(story, 0, Math.min(grow, 0.5 - story.gap));
    stretch(story, Math.max(1 - grow, 0.5 + story.gap), 1);
    let joined = 0;
    if (p >= 9.4) joined = 1 - span(p, 9.4, 9.9);
    else if (p >= 3.6) joined = snap(span(p, 3.6, 3.82));
    const knot = at(story, 0.5);
    if (joined > 0) {
      stretch(story, 0.5 - story.gap * joined, 0.5 + story.gap * joined);
      ink(C.ink, 0.7 * joined);
      circle(...knot, sz(2.8), true);
    }
    ctx.lineWidth = lw(1);
    ctx.globalAlpha = 0.7;
    circle(...knot, sz(2.8) * snap(span(it, 0.95, 1.2)));
    brain(shared, fade(1));
    const sd = draws(1);
    MEMBERS.forEach((a, m) => {
      const pt = add(g.cS, [Math.cos(a), Math.sin(a)], shared.r + 25);
      const agrees = m === MEMBERS.length - 1;
      tether(pt, shared, sd, 10, agrees ? span(p, 3, 3.3) : 0);
      figure(pt, sd, agrees ? span(p, 2.9, 3.5) : 0);
    });
    /* the org's law arriving lights the shared brain's rim */
    const ruled = span(p, 2.9, 3.5);
    if (live(ruled)) {
      pen(C.acc, 1.25, 0.5 * (1 - ruled));
      circle(...g.cS, shared.r * 1.04);
    }
    brain(person, fade(2));

    /* the story: a double heartbeat, the agent out, the org's law down, consent at the knot */
    [[0, 1], [0.22, 0.7]].forEach(([t0, a]) => {
      const beat = span(p, t0, t0 + 1.3);
      if (!live(beat)) return;
      pen(C.acc, 1.25, 0.6 * a * span(p, t0, t0 + 0.12) * (1 - beat));
      circle(g.inP[0], g.inP[1], person.r * (1.04 + 0.26 * arrive(beat)));
    });
    if (p >= 1 && p < 5.3) {
      const reach = Math.min(lerp(WAKE, 0.5, travel(span(p, 1, 2.3))), 0.5 - story.gap);
      trail(story, WAKE, reach, 1 - span(p, 3.9, 4.6));
      const down = travel(span(p, 2.3, 2.9));
      if (p > 2.3) trail(law, 1 - down, 1, 1 - span(p, 3.2, 4), false);
      const grant = (0.5 - story.gap) * arrive(span(p, 3.1, 3.6));
      if (grant > 0) trail(story, 1 - grant, 1, 1 - span(p, 4.2, 4.9), false);
      if (p > 3.6) {
        const lit = 1 - span(p, 4.6, 5.3);
        pen(C.acc, 1.75, lit);
        stretch(story, 0.5 - story.gap * joined, 0.5 + story.gap * joined);
        ink(C.acc, lit);
        circle(...knot, sz(3) * (1 + 0.6 * joined * (1 - span(p, 3.82, 4.4))), true);
      }
    }

    /* the draft lands on the front point of the person brain nearest its way in */
    if (p >= 8.6 && landed !== Math.floor(tau / T)) {
      const goal = mix(g.inP, g.rimP, 0.45);
      let bd = 1e9;
      for (let i = 0; i < person.n; i += 1) {
        const dd = (person.sx[i] - goal[0]) ** 2 + (person.sy[i] - goal[1]) ** 2;
        if (person.sz[i] > 0.4 && dd < bd) [bd, landing] = [dd, i];
      }
      landed = Math.floor(tau / T);
    }
    if (landing >= 0) g.land = [person.sx[landing], person.sy[landing]];
    const settle = ((p - 9 + T) % T) / 3.2;
    if (landing >= 0 && settle < 1) {
      ink(C.acc, 1 - settle);
      circle(...g.land, sz(2.4) * person.ss[landing], true);
    }

    /* the gate: shut, except to let the approved draft in (an accent snap as it opens) */
    const gd = draws(3);
    const o = [person.ox, person.oy];
    const gc = add(g0, o, 1);
    const lift = p >= 9.2 ? 1 - leave(span(p, 9.2, 9.5)) : snap(span(p, 8.05, 8.27));
    const swing = shut + Math.PI * lift;
    const hinge = add(gc, nrm, -12);
    const bar = [hinge, add(hinge, [Math.cos(swing), Math.sin(swing)], 24)];
    pen(C.ink, 2.25, 0.85 * gd);
    line(...bar);
    const flash = p >= 8.05 && p < 9.2 ? 1 - span(p, 8.27, 9) : 0;
    if (flash > 0) {
      pen(C.acc, 2.25, flash * gd);
      line(...bar);
    }
    ink(C.ink, 0.9 * gd);
    [-12, 12].forEach((f) => circle(...add(gc, nrm, f), sz(3.2), true));
    const kp = add(keeper, o, 1);
    tether(kp, person, gd, 10);
    figure(kp, gd, span(p, 7.3, 8.05));

    /* the mover: the agent (a dot) out to the shared brain, the draft (a square) back */
    const s = STEPS.findIndex(([a, b]) => p >= a && p < b);
    if (s >= 0 && (s < 8 || landing >= 0)) {
      const [a, b, where, square, fa] = STEPS[s];
      const u = span(p, a, b);
      const [mx, my] = where(u, p);
      const sq = typeof square === 'function' ? square(u) : square;
      const hold = (s === 2 || (s === 6 && p > 7.1) ? 1 + 0.02 * breath : 1)
        * (s === 0 ? snap(span(p, 0.5, 0.72)) : 1);
      glow(mx, my, (s === 8 ? sz(10) * (1 - u) : sz(20)) * hold);
      ink(C.acc, (fa ? fa(u) : 1) * Math.min(1, it));
      ctx.beginPath();
      const h = sz(4.6) * (0.45 + 0.55 * sq) * hold;
      if (sq > 0.02) ctx.rect(mx - h, my - h, h * 2, h * 2);
      else ctx.arc(mx, my, sz(4.2) * hold, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  redraw = kit.loop(stage, draw, { still: STILL });
}
