/**
 * Scene (arcade): Built with Bruce. A Lava Dash level (square-eyed cube, spikes, blocks, lava,
 * a volcano) slides right to left through a seam: right of it, Bruce's pencil sketch on graph
 * paper with dashed arrows for where to jump; at the seam, a pen that inks it; left of it, two
 * co-op cubes taking turns where his arrows said (one in the air at a time, 0.5 s rests). The
 * volcano stands across the seam, half built, half sketched. 12 s cycle.
 *
 * Parts: `playable` (top left, its leader rides player two), `design` (top right, on the pencil
 * volcano), `ai` (under the seam, its leader up to the pen).
 */
const S = 500;
const T = 12;
const L = 960; // the level's tile: one cycle of travel, in world units
const V = L / T;
const Z = 1.3; // world to plate: the level is drawn 1.3x, the seam at 340, the crust at 290
const OX = 340 - Z * 290;
const OY = 290 - Z * 284;
const G = 284; // the crust the cubes run on
const SEAM = 290;
const C = 30; // a cube's side
const D = 0.95; // a jump's time in the air
const RUN = [105 + V * (D + 0.5), 105]; // cube centres: player one, then player two a jump behind
const TOP = 144; // the seam's rail and the paper
const BOT = 410;
// [x, width, height, spikes (0: a block)], 240 apart
const OBS = [[100, 26, 32, 1], [348, 24, 24, 0], [582, 36, 24, 2], [820, 26, 32, 1]]
  .map(([x, w, h, n]) => ({
    x, w, h, n, c: x + w / 2,
  }));
// the volcano, centred on the seam: flanks, a lip at each rim, the crater between
const VW = 240;
const VH = 124;
const vh = (x) => {
  const d = Math.abs(x - SEAM) / VW;
  if (d >= 0.13) return VH * Math.max(0, (0.5 - d) / 0.37) ** 1.15;
  if (d >= 0.085) return VH + 3 * Math.sin((Math.PI * (0.13 - d)) / 0.045);
  return VH - 11 * (1 - (d / 0.085) ** 2);
};
const VOLCANO = Array.from({ length: 61 }, (_, i) => SEAM - VW / 2 + (VW * i) / 60)
  .map((x) => [x, G - vh(x)]);
const DOTS = 9;
const LIFT = 60; // a jump's height

const mod = (a, b) => ((a % b) + b) % b;
const f1 = (n) => Math.round(n * 10) / 10;
const sx = (x) => f1(OX + Z * x);
const sy = (y) => f1(OY + Z * y);

// the grammar's arrive and snap curves, as close polynomials
const arrive = (x) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 5;
const snap = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;

/** The level's height above the crust at a tile x (the outline the pen rides). */
const heightAt = (x) => Math.max(0, ...OBS.filter((o) => x >= o.x && x <= o.x + o.w)
  .map((o) => (o.n ? o.h * (1 - Math.abs(2 * mod((x - o.x) / (o.w / o.n), 1) - 1)) : o.h)));

/** A jump's arc (a cube's centre) at u in 0..1, from its takeoff point. */
const arc = (u) => [D * V * u, -LIFT * 4 * u * (1 - u)];

const join = (pts) => pts.map((p) => p.map(f1).join(' ')).join('L');

export default function engine(block, kit) {
  const { stage, svg, parts } = kit;
  const rnd = kit.random(9);
  const uid = `arcade-${Math.floor(Math.random() * 1e6)}`;
  const path = (cls, d, parent, attrs = {}) => svg('path', { class: cls, d, ...attrs }, parent);
  const tile = (g, content) => {
    g.append(content, content.cloneNode(true));
    g.lastChild.setAttribute('transform', `translate(${L} 0)`);
  };

  /** A pencil stroke through points: wobbly passes that overshoot the ends a little. */
  const pencil = (pts, { passes = 2, amp = 0.8, over = 2.2 } = {}) => {
    let d = '';
    const ext = ([ax, ay], [bx, by]) => {
      const o = (over * (0.4 + rnd())) / (Math.hypot(bx - ax, by - ay) || 1);
      return [bx + (bx - ax) * o, by + (by - ay) * o];
    };
    for (let p = 0; p < passes; p += 1) {
      const off = p ? (rnd() - 0.5) * 1.4 : 0;
      let drift = 0;
      d += `M${join([ext(pts[1], pts[0]), ...pts, ext(...pts.slice(-2))].map(([x, y]) => {
        drift = drift * 0.6 + (rnd() - 0.5) * amp;
        return [x + drift * 0.5, y + drift + off];
      }))}`;
    }
    return d;
  };
  /** Points along a straight line, every ~9 units. */
  const seg = (x1, y1, x2, y2) => {
    const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 9));
    return Array.from({ length: n + 1 }, (_, i) => [x1 + ((x2 - x1) * i) / n,
      y1 + ((y2 - y1) * i) / n]);
  };
  const fine = { passes: 1, amp: 0.4, over: 0.5 };
  const sk = (x1, y1, x2, y2, opts) => pencil(seg(x1, y1, x2, y2), opts);

  // one tile of the level, built (ink) and sketched (pencil)
  const ink = svg('g');
  path('arcade-ink', `M0 ${G}H${L}`, ink);
  // the lava under the crust, fading with depth: [depth, amplitude, wavelength, opacity]
  [[9, 1.6, 120, 0.5], [20, 1.8, 96, 0.38], [32, 1.6, 160, 0.28], [46, 1.4, 80, 0.2],
    [62, 1.3, 120, 0.14], [80, 1.2, 192, 0.1], [100, 1.1, 240, 0.07], [120, 1, 160, 0.05]]
    .forEach(([dy, amp, len, op], i) => {
      const pts = [];
      const k = (2 * Math.PI) / len;
      for (let x = 0; x <= L; x += 6) pts.push([x, G + dy + amp * Math.sin((x + i * 23) * k)]);
      path('arcade-lava', `M${join(pts)}`, ink, { opacity: op });
    });
  const sketch = svg('g');
  let grid = '';
  for (let x = 0; x < L; x += 24) grid += `M${x} ${TOP}V${BOT}`;
  path('arcade-vgrid', grid, sketch, { style: `stroke:url(#${uid}-fade)` });
  let pen = sk(0, G, L, G, { amp: 0.7 });
  let plans = '';
  let dashes = '';
  // the lava as a child draws it: one looping scribble under the crust
  const scribble = [];
  for (let i = 0; i <= 450; i += 1) {
    const t = (i / 9) * 2 * Math.PI;
    const r = 4 + rnd() * 1.2;
    scribble.push([(L / 100 / Math.PI) * t - r * Math.sin(t) + 2, G + 16 - r * Math.cos(t)]);
  }
  let hatch = pencil(scribble, { passes: 1, amp: 0.5, over: 0 });

  OBS.forEach((o) => {
    const {
      x, w, h, n,
    } = o;
    const s = w / (n || 1);
    // built: clean shapes with a tone of fill (the block keeps Lava Dash's inset)
    if (n) {
      let d = '';
      for (let k = 0; k < n; k += 1) d += `M${x + k * s} ${G}l${s / 2} ${-h}l${s / 2} ${h}Z`;
      path('arcade-ink arcade-solid', d, ink);
    } else {
      path('arcade-ink arcade-solid', `M${x} ${G}v${-h}h${w}v${h}`, ink);
      path('', `M${x + 4} ${G - h + 4}h${w - 8}v${h - 8}h${8 - w}Z`, ink);
    }
    // the jump as planned: a crisp dotted arc on the built side, his dashed arrow on the paper
    const pts = Array.from({ length: 21 }, (_, i) => {
      const [dx, dy] = arc(i / 20);
      return [o.c - (D * V) / 2 + dx, G - C / 2 + dy];
    });
    const [ex, ey] = pts[20];
    const ang = Math.atan2(ey - pts[18][1], ex - pts[18][0]);
    const head = (q) => [ex - 7 * Math.cos(ang + q), ey - 7 * Math.sin(ang + q)];
    const tip = [head(0.5), [ex, ey], head(-0.5)];
    plans += `M${join(pts)}M${join(tip)}`;
    dashes += pencil(pts.slice(1, 20), { passes: 1, amp: 1.1, over: 0 });
    hatch += pencil(tip, fine);
    // sketched: the same shapes in pencil, shaded
    if (!n) {
      const [r, t] = [x + w, G - h];
      pen += sk(x, G, x, t) + sk(x, t, r, t) + sk(r, t, r, G)
        + sk(x + 4, t + 4, r - 4, t + 4, fine) + sk(x + 4, t + 4, x + 4, G - 4, fine);
      for (let j = 1; j < 3; j += 1) hatch += sk(x + j * 8, G - 1, r - 1, t + j * 8 - 1, fine);
    }
    for (let k = 0; k < n; k += 1) {
      const m = x + k * s + s / 2;
      pen += sk(m - s / 2, G, m, G - h) + sk(m, G - h, m + s / 2, G);
      for (let j = -1; j < 2; j += 1) {
        const hx = m + j * (s / 6);
        hatch += sk(hx - 2, G - 1, hx + 1.5, G + 4 - h * (1 - Math.abs(j / 3)), fine);
      }
    }
  });
  path('arcade-plan', plans, ink);
  path('arcade-pencil', pen, sketch);
  path('arcade-hatch', hatch, sketch);
  path('arcade-pencil arcade-dash', dashes, sketch);

  // the plate: the art is in world units, drawn at Z
  const art = svg('svg', { class: 'arcade-art', viewBox: `0 0 ${S} ${S}`, 'aria-hidden': 'true' });
  const defs = svg('defs', {}, art);
  const gradient = (tag, id, attrs, stops) => {
    const el = svg(tag, { id: `${uid}-${id}`, ...attrs }, defs);
    stops.forEach(([offset, op]) => svg('stop', { offset, class: `arcade-${id}-stop`, 'stop-opacity': op }, el));
  };
  gradient('radialGradient', 'wash', {}, [[0, 1], [1, 0]]);
  gradient('linearGradient', 'fade', {
    gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0, y1: TOP, y2: BOT,
  }, [[0, 0], [0.25, 1], [0.8, 1], [1, 0]]);
  const clips = {};
  const clip = (name, d, rule) => {
    clips[name] = svg('path', { d, 'clip-rule': rule }, svg('clipPath', { id: `${uid}-${name}` }, defs));
    return `url(#${uid}-${name})`;
  };
  const rect = (x, y, w, h) => `M${f1(x)} ${f1(y)}h${f1(w)}v${f1(h)}h${f1(-w)}Z`;

  const world = svg('g', { transform: `matrix(${Z} 0 0 ${Z} ${f1(OX)} ${f1(OY)})` }, art);
  const back = svg('g', {}, world);
  svg('ellipse', {
    class: 'arcade-wash', cx: (RUN[0] + RUN[1]) / 2, cy: G - 36, rx: 118, ry: 78, fill: `url(#${uid}-wash)`,
  }, back);
  const front = svg('g', {}, world);
  // the lava and paper stop around the `ai` label (the window is sized in fit)
  const calm = svg('g', { 'clip-path': clip('calm', '', 'evenodd') }, front);

  // the paper: ruled lines, the sketched volcano, the sketched level
  const paper = svg('g', { 'clip-path': clip('paper', rect(SEAM, 0, S, S)), 'data-part': 'design' }, calm);
  const rules = [];
  for (let y = TOP + 12; y < BOT; y += 24) {
    const k = 1 - Math.abs((y - (TOP + BOT) / 2) / ((BOT - TOP) / 2)) ** 2;
    rules.push(path('arcade-grid', `M${SEAM} ${y}H${S}`, paper, { opacity: f1(k) }));
  }
  let far = pencil(VOLCANO.filter((_, i) => i % 2 === 0), { amp: 0.5, over: 1.5 });
  for (let k = 0; k < 6; k += 1) {
    const hx = SEAM + VW * (0.17 + k * 0.05);
    const hy = G - vh(hx);
    far += sk(hx - 2, hy + 6, hx - 9, hy + 18, fine);
  }
  // the crater's lava pool, scribbled (and a clean wave on the built side)
  const pool = G - VH + 6;
  const ripple = Array.from({ length: 9 }, (_, i) => [SEAM + i * 2.4, pool + Math.sin(i * 2)]);
  far += pencil(ripple, fine);
  const farPencil = path('arcade-faint', far, paper);
  const paperWorld = svg('g', {}, paper);
  tile(paperWorld, sketch);

  const built = svg('g', { 'clip-path': clip('ink', rect(-200, 0, SEAM + 200, S)), 'data-part': 'ai' }, calm);
  const farInk = path('arcade-far', `M${join(VOLCANO)}ZM${SEAM - 18} ${pool}q4.5 -3 9 0t9 0`, built);
  const builtWorld = svg('g', {}, built);
  tile(builtWorld, ink);

  // the seam: a rail with the pen that inks the outline as it passes
  const seam = svg('g', { 'data-part': 'ai' }, front);
  const rail = path('', `M${SEAM} ${TOP}V${G}M${SEAM - 4} ${TOP}h8`, seam);
  const nib = svg('g', {}, seam);
  svg('circle', { class: 'arcade-nib', r: 4.5 }, nib);
  svg('circle', { class: 'arcade-dot', r: 1.6 }, nib);

  // the players: Lava Dash's square-eyed cube and the dotted arc each jump leaves
  const players = svg('g', { 'data-part': 'playable' }, front);
  const box = (cls, x, y, w, parent) => svg('rect', {
    class: cls, x, y, width: w, height: w, rx: w > 20 ? 2.5 : 0.6,
  }, parent);
  const cubes = RUN.map((cx, i) => {
    const trail = svg('g', {}, players);
    const dots = Array.from({ length: DOTS }, (_, k) => {
      const [x, y] = arc((k + 0.5) / DOTS);
      return svg('circle', {
        class: 'arcade-trail', cx: f1(x), cy: f1(y), r: 1.6,
      }, trail);
    });
    const g = svg('g', {}, players);
    box('arcade-under', -C / 2, -C / 2, C, g);
    box(`arcade-cube${i ? ' is-two' : ''}`, -C / 2, -C / 2, C, g);
    box('arcade-eye', 3.3, -8.8, 10, g);
    box('arcade-pupil', 7.5, -6.5, 5, g);
    const starts = OBS.map((o) => mod((o.c - cx) / V - D / 2, T));
    const order = starts.map((_, k) => k).sort((p, q) => starts[p] - starts[q]);
    return {
      cx, g, trail, dots, starts, order,
    };
  });

  // leaders (unmasked, in plate units): a hairline from each label to a dot at its part
  const marks = svg('svg', { class: 'arcade-marks', viewBox: `0 0 ${S} ${S}`, 'aria-hidden': 'true' });
  const dx = SEAM + VW * 0.17;
  const LEADS = [['playable', sx(RUN[1]), 104, sy(G - C)], ['design', sx(dx), 104, sy(G - vh(dx)) - 3],
    ['ai', sx(SEAM), 330, sy(G) + 8]];
  const leads = LEADS.filter(([part]) => parts.has(part)).map(([part, x, y1, y2]) => {
    const g = svg('g', { 'data-part': part }, marks);
    const line = path('', `M${x} ${y1}V${y2}`, g);
    const dot = svg('circle', {
      class: 'arcade-dot', cx: x, cy: y2, r: 2, opacity: 0.7,
    }, g);
    kit.place(part, x, y1 + (y1 < y2 ? -6 : 4), S, y1 < y2 ? 'bottom' : 'top');
    return {
      part, line, dot, x, y1,
    };
  });
  const rider = leads.find((l) => l.part === 'playable');
  stage.append(art, marks);

  // strokes keep their pixel weight at any size; dashes scale with the drawing
  const fit = () => {
    const box0 = stage.getBoundingClientRect();
    const k = S / (box0.width || S);
    marks.style.setProperty('--k', k.toFixed(3));
    world.style.setProperty('--k', (k / Z).toFixed(3));
    // the label's box (plus 8px), from plate units into world units
    const r = parts.get('ai')?.getBoundingClientRect();
    const hole = r ? rect(
      ((r.left - box0.left - 8) * k - OX) / Z,
      ((r.top - box0.top - 6) * k - OY) / Z,
      ((r.width + 16) * k) / Z,
      ((r.height + 12) * k) / Z,
    ) : '';
    clips.calm.setAttribute('d', `${rect(-200, -200, 900, 900)}${hole}`);
  };
  const watch = new ResizeObserver(fit);
  watch.observe(stage);
  if (parts.get('ai')) watch.observe(parts.get('ai'));
  fit();

  // motion
  // t = 0 starts the longest rest; the still: player two over the block, the next obstacle pencil
  const air = (w) => cubes.some((c) => c.starts.some((s) => mod(w - s, T) < D));
  let PH = 0;
  let wait = -1;
  for (let w = 0; w < T; w += 0.05) {
    const next = Math.min(...cubes.flatMap((c) => c.starts.map((s) => mod(s - w, T))));
    if (!air(w) && next > wait) [PH, wait] = [w, next];
  }
  const STILL = mod(cubes[1].starts[1] + 0.5 * D - PH, T);
  const ptr = kit.pointer(stage);
  let tau = 0;
  let hover = 0;
  let penY = G;
  let drawn = false;

  const scaleAt = (el, x, y, kx, ky) => el.setAttribute('transform', `translate(${x} ${y}) scale(${kx} ${ky}) translate(${-x} ${-y})`);
  const reveal = (t) => {
    if (drawn) return;
    const k = (i) => f1(arrive((t - 0.06 * i) / 0.8) * 100) / 100;
    rules.forEach((r, i) => scaleAt(r, SEAM, 0, k(i), 1));
    scaleAt(rail, 0, TOP, 1, k(0));
    leads.forEach(({ line, y1 }, i) => scaleAt(line, 0, y1, 1, k(5 + i * 2)));
    [farInk, farPencil].forEach((el) => el.setAttribute('opacity', k(3)));
    drawn = t > 1.5;
  };

  const draw = (t, dt) => {
    const still = !dt && kit.reduceMotion();
    ptr.update(dt);
    if (still) tau = t;
    else if (dt) {
      hover += ((ptr.over ? 1 : 0) - hover) * (1 - Math.exp(-dt * 3));
      tau += dt * arrive(Math.min(1, t / 1.2)) * (1 + 0.4 * hover);
    }
    reveal(still ? 99 : t);
    const w = mod(tau + PH, T);
    const shift = `translate(${f1(-w * V)} 0)`;
    builtWorld.setAttribute('transform', shift);
    paperWorld.setAttribute('transform', shift);
    back.setAttribute('transform', `translate(${f1(ptr.x * 2)} ${f1(ptr.y * 2)})`);
    front.setAttribute('transform', `translate(${f1(ptr.x * 4)} ${f1(ptr.y * 3)})`);

    const target = G - heightAt(mod(SEAM + w * V, L));
    penY = dt ? penY + (target - penY) * (1 - Math.exp(-dt * 28)) : target;
    nib.setAttribute('transform', `translate(${SEAM} ${f1(penY)})`);

    cubes.forEach((cube) => {
      // the latest jump, and how far through it (u, in jumps)
      const since = cube.starts.map((s) => mod(w - s, T));
      const best = since.indexOf(Math.min(...since));
      const u = since[best] / D;
      const land = (u - 1) * D;
      const k = u >= 1 && land < 0.24 ? 1 - snap(land / 0.24) : 0;
      const lift = u < 1 ? -arc(u)[1] : 0;
      const turns = cube.order.indexOf(best) + Math.min(1, u);
      const squash = `scale(${f1(10 + 0.8 * k) / 10} ${f1(10 - 1.2 * k) / 10})`;
      cube.g.setAttribute('transform', `translate(${cube.cx} ${f1(G - lift)}) ${squash} translate(0 ${-C / 2}) rotate(${f1(turns * 90)})`);
      // its highest point, where the `playable` leader ends
      const a = ((turns % 1) * Math.PI) / 2;
      cube.top = G - lift - C / 2 - (C / 2) * (Math.cos(a) + Math.sin(a)) * (1 - 0.12 * k);

      cube.trail.setAttribute('transform', `translate(${f1(cube.cx - D * V * u)} ${G - C / 2})`);
      cube.dots.forEach((dot, i) => {
        const age = u - (i + 0.5) / DOTS;
        dot.setAttribute('opacity', age < 0 ? 0 : f1(Math.max(0, 7.5 * (1 - age / 1.2))) / 10);
      });
    });
    if (rider) {
      const y = f1(Math.max(rider.y1 + 12, sy(cubes[1].top) - 3 + ptr.y * 3 * Z));
      rider.line.setAttribute('d', `M${rider.x} ${rider.y1}V${y}`);
      rider.dot.setAttribute('cy', y);
    }
  };

  kit.loop(stage, draw, { still: STILL });
}
