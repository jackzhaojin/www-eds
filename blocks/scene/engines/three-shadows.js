/**
 * Scene engine `three-shadows`: Shadow Pivot (/portfolio/shadow-pivot/), accent shadow (mint).
 *
 * What it shows: one blocky object, the app, in parallel light before a wall. It pivots a third
 * of a turn at a time about its long diagonal (the dash-dot centre line), and each stop casts a
 * different shadow: an arrow up from a baseline (release), a two-unit server (infrastructure), a
 * page of text (methodology). The trick is real: the object is the intersection of the three
 * silhouettes extruded through a 9 x 9 x 9 grid, so each shadow is its true projection.
 *
 * Parts (rows):
 * - `app`: the object; label at the upper right, its leader drops to the pivot's front pin.
 * - `release`, `infrastructure`, `methodology`: the key under the wall, a spine through a small
 *   copy of each shadow; the act on the wall is drawn in the accent and its label lit.
 *
 * Cycle 9.6 s: three acts, a 1.5 s hold and a 1.7 s turn each (the shadow fades to a third
 * through the turn and comes back on landing; the wash breathes and the centre line crawls with
 * the pivot through the holds). Reduced motion: methodology.
 */
const V = 500; // drawing units: a 500 square, scaled to the stage
const N = 9; // grid
const S = 17; // cell size
const D = 470; // the object's distance from the wall
const OX = 136; // the wall's centre on the stage
const OY = 176;
const HOLD = 1.5;
const TURN = 1.7;
const ACT = HOLD + TURN;
const CYCLE = 3 * ACT;
const STILL = 2 * ACT + HOLD * 0.6;
const ACTS = ['release', 'infrastructure', 'methodology'];
const ENDS = [[0, 1], [3, 2], [0, 3], [1, 2]]; // a face's corners at its +t1 -t1 +t2 -t2 edges

/* the silhouettes, rows top down: release (u a, v b), infrastructure (u c, v a), methodology
   (u b, v c). Full rows and columns at linked indices (a 4, b 0, c 0) make all three exact. */
const SHAPES = [
  ['....#....', '...###...', '..#####..', '.##.#.##.', '##..#..##', '....#....', '....#....',
    '....#....', '#########'],
  ['#########', '#.......#', '#.###.#.#', '#.......#', '#########', '#.......#', '#.###.#.#',
    '#.......#', '#########'],
  ['#####....', '#...##...', '#....##..', '#.....###', '#.###...#', '#.......#', '#.#####.#',
    '#.......#', '#########'],
];

const clamp = (v) => Math.min(1, Math.max(0, v));

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

/* the camera: orthographic, from the left of the wall's normal and a little above */
const YAW = (-25 * Math.PI) / 180;
const PITCH = (11 * Math.PI) / 180;
const R = [Math.cos(YAW), 0, -Math.sin(YAW)];
const U = [-Math.sin(YAW) * Math.sin(PITCH), Math.cos(PITCH), -Math.cos(YAW) * Math.sin(PITCH)];
const W = [Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** A world point to the stage, in drawing units. */
const toStage = (p) => [OX + dot(p, R), OY - dot(p, U)];

/** The rotation by angle a about the (1, 1, 1) diagonal, as a row-major 3 x 3 matrix. */
function pivot(a) {
  const c = Math.cos(a);
  const s = Math.sin(a) / Math.sqrt(3);
  const k = (1 - c) / 3;
  return [c + k, k - s, k + s, k + s, c + k, k - s, k - s, k + s, c + k];
}
const apply = (m, v) => [0, 3, 6].map((i) => m[i] * v[0] + m[i + 1] * v[1] + m[i + 2] * v[2]);

/** The voxels and their exposed faces; a face's edges are 0 (flat), -1 (concave) or 1 + the
    index of the face across a convex crease. */
function build() {
  const on = SHAPES.map((rows) => (u, v) => rows[N - 1 - v][u] === '#');
  const has = (a, b, c) => a >= 0 && b >= 0 && c >= 0 && a < N && b < N && c < N
    && on[0](a, b) && on[1](c, a) && on[2](b, c);
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const voxels = [];
  const h = (N - 1) / 2;
  for (let a = 0; a < N; a += 1) {
    for (let b = 0; b < N; b += 1) {
      for (let c = 0; c < N; c += 1) {
        if (has(a, b, c)) {
          const faces = [];
          dirs.forEach((n, f) => {
            if (has(a + n[0], b + n[1], c + n[2])) return;
            const g = Math.floor(f / 2) * 2;
            const edges = [g + 2, g + 3, g + 4, g + 5].map((e) => { // +t1 -t1 +t2 -t2
              const [x, y, z] = dirs[e % 6].map((d, i) => [a, b, c][i] + d);
              if (has(x + n[0], y + n[1], z + n[2])) return -1;
              return has(x, y, z) ? 0 : (e % 6) + 1;
            });
            faces.push({ f, edges });
          });
          voxels.push({ p: [(a - h) * S, (b - h) * S, (c - h) * S], faces });
        }
      }
    }
  }
  return { voxels, dirs };
}

/** The convex hull of 2D points (monotone chain), counterclockwise. */
function hull(pts) {
  const p = pts.slice().sort((m, n) => m[0] - n[0] || m[1] - n[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list) => {
    const out = [];
    list.forEach((q) => {
      while (out.length > 1 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    });
    return out.slice(0, -1);
  };
  return half(p).concat(half(p.slice().reverse()));
}

export default function engine(block, kit) {
  const { stage, place } = kit;
  const { voxels, dirs } = build();
  let redraw = () => {};
  let pal = null;
  const view = kit.canvas(stage, () => redraw());
  view.el.classList.add('three-shadows-canvas');
  const ptr = kit.pointer(stage);
  // an outline of a union of shapes: stroke them all twice as wide, then cut every shape out
  const ring = document.createElement('canvas');
  const rctx = ring.getContext('2d');
  const outlineOf = (ctx, path, k, shift, color, width, a) => {
    if (ring.width !== view.el.width || ring.height !== view.el.height) {
      ring.width = view.el.width;
      ring.height = view.el.height;
    }
    rctx.setTransform(view.dpr * k, 0, 0, view.dpr * k, 0, 0);
    rctx.clearRect(0, 0, V, V);
    rctx.translate(shift[0], shift[1]);
    rctx.lineJoin = 'round';
    rctx.lineWidth = width * 2;
    rctx.strokeStyle = color;
    rctx.stroke(path);
    rctx.globalCompositeOperation = 'destination-out';
    rctx.fill(path);
    rctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    ctx.drawImage(ring, 0, 0);
    ctx.restore();
  };

  const half = ((N * S) / 2) + 26; // the wall panel's half size
  const wall = [[-half, half], [half, half], [half, -half], [-half, -half]]
    .map(([x, y]) => toStage([x, y, 0]));
  const box = (N * S) / 2;
  // the light's tube, wall to object: the three edges that clear the shadow
  const tube = [[box, box], [box, -box], [-box, -box]].map(([x, y]) => [
    toStage([x, y, 0]), toStage([x, y, D - box * 0.4])]);
  const axis = [1, 1, 1].map((v) => v / Math.sqrt(3));
  const reach = box * Math.sqrt(3);
  const pin = (t) => toStage([axis[0] * t, axis[1] * t, D + axis[2] * t]);
  const axle = [pin(-reach), pin(reach + 20)];

  // the key: a spine from the wall's lower edge through a copy of each shadow
  const spineX = wall[3][0] + 14;
  const spineTop = wall[3][1] + ((wall[2][1] - wall[3][1]) * 14) / (wall[2][0] - wall[3][0]);
  const keyY = [350, 400, 450];
  const mini = 2.7; // the key's cell size
  const labelX = spineX + (N * mini) / 2 + 12;
  ACTS.forEach((part, i) => place(part, labelX, keyY[i], V, 'left'));
  const icons = SHAPES.map((rows) => {
    const cells = [];
    rows.forEach((row, r) => [...row].forEach((ch, u) => {
      if (ch === '#') cells.push([(u - N / 2) * mini, (r - N / 2) * mini]);
    }));
    return cells;
  });
  const appX = axle[1][0];
  const appY = 74;
  place('app', appX + 6, appY, V, 'right');

  const ink = (a) => kit.alpha(pal.ink, a);
  const accent = (a) => kit.alpha(pal.accent, a);
  let tones = [];
  kit.onTheme(block, (p) => {
    pal = p;
    const [r1, g1, b1] = kit.rgb(p.bg);
    const [r2, g2, b2] = kit.rgb(p.ink);
    const at = (a) => `rgb(${Math.round(r1 + (r2 - r1) * a)}, ${Math.round(g1 + (g2 - g1) * a)}, ${Math.round(b1 + (b2 - b1) * a)})`;
    tones = Array.from({ length: 33 }, (_, i) => at(i / 100));
    redraw();
  });

  let tau = 0; // the mechanism's clock: the first shadow holds while the timescale spins up
  let speed = 0;
  let shownBefore = -1;
  const order = voxels.map((_, i) => i);
  const depth = new Float32Array(voxels.length);

  const line = (ctx, a, b, f = 1) => {
    if (f <= 0) return;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
    ctx.stroke();
  };

  function draw(t, dt) {
    if (!pal || !view.size) return;
    const still = kit.reduceMotion();
    ptr.update(dt);
    const target = (ptr.over ? 1.4 : 1) * clamp(t / 1.2);
    speed += (target - speed) * (still ? 1 : 1 - Math.exp(-dt * 3));
    if (still) tau = STILL;
    else tau = (tau + dt * speed) % CYCLE;
    const intro = still ? 1 : clamp(t / 1.1);
    const reveal = (i) => arrive(clamp((intro * 1.1 - i * 0.06) / 0.8));

    // where the mechanism is: the act on the wall, the turn's progress
    const act = Math.floor(tau / ACT) % 3;
    const local = tau - act * ACT;
    const turn = local < HOLD ? 0 : travel((local - HOLD) / TURN);
    const angle = ((act + turn) * 2 * Math.PI) / 3;
    const switchAt = HOLD + TURN * 0.7;
    const shown = local > switchAt ? (act + 1) % 3 : act;
    if (shown !== shownBefore) {
      shownBefore = shown;
      ACTS.forEach((part, i) => kit.parts.get(part)?.classList.toggle('is-active', i === shown));
    }
    const since = local > switchAt ? local - switchAt : local + ACT - switchAt;
    // through a turn the shadow is a passing blur: down to a third, back on landing
    const tp = (local - HOLD) / TURN;
    const vis = local < HOLD ? 1
      : 1 - 0.65 * leave(clamp(tp / 0.25)) * (1 - arrive(clamp((tp - 0.62) / 0.38)));

    const { ctx, size } = view;
    const k = size / V;
    ctx.setTransform(view.dpr * k, 0, 0, view.dpr * k, 0, 0);
    ctx.clearRect(0, 0, V, V);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const px = 1 / k; // one CSS pixel in drawing units

    // plane 1: the wall, its wash, the shadow and the light's tube
    ctx.save();
    const back = [ptr.x * -3 * px, ptr.y * -3 * px];
    ctx.translate(back[0], back[1]);
    const o = toStage([0, 0, 0]);
    const glow = ctx.createRadialGradient(o[0], o[1], 0, o[0], o[1], 150);
    const wash = (pal.dark ? 0.08 : 0.05) + 0.02 * breath(t, 5.3);
    glow.addColorStop(0, accent(wash * reveal(1)));
    glow.addColorStop(1, accent(0));
    ctx.fillStyle = glow;
    ctx.fillRect(o[0] - 160, o[1] - 160, 320, 320);
    ctx.strokeStyle = ink(0.42);
    ctx.lineWidth = 1.25 * px;
    wall.forEach((a, i) => line(ctx, a, wall[(i + 1) % 4], reveal(i)));

    // the shadow: every voxel's outline along the light at once, caught by the wall
    ctx.save();
    ctx.beginPath();
    wall.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.clip();
    const m = pivot(angle);
    const corners = [];
    [-1, 1].forEach((x) => [-1, 1].forEach((y) => [-1, 1].forEach((z) => {
      const q = apply(m, [(x * S) / 2, (y * S) / 2, (z * S) / 2]);
      corners.push([q[0], q[1]]);
    })));
    const shape = hull(corners).map(([x, y]) => toStage([x, y, 0]));
    const shadow = new Path2D();
    voxels.forEach((vx) => {
      const q = apply(m, vx.p);
      const c = toStage([q[0], q[1], 0]);
      const dx = c[0] - o[0];
      const dy = c[1] - o[1];
      shadow.moveTo(shape[0][0] + dx, shape[0][1] + dy);
      for (let i = 1; i < shape.length; i += 1) shadow.lineTo(shape[i][0] + dx, shape[i][1] + dy);
      shadow.closePath();
    });
    // a line plate: a tint of about a fifth, and the accent outline of the whole shadow
    ctx.fillStyle = accent((pal.dark ? 0.22 : 0.2) * vis * reveal(2));
    ctx.fill(shadow);
    outlineOf(ctx, shadow, k, back, accent(1), 1.25 * px, 0.9 * vis * reveal(2));
    ctx.restore();

    ctx.lineWidth = 0.75 * px;
    tube.forEach(([a, b], i) => {
      const fadeOut = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      fadeOut.addColorStop(0, ink(0.26));
      fadeOut.addColorStop(0.6, ink(0.2));
      fadeOut.addColorStop(1, ink(0));
      ctx.strokeStyle = fadeOut;
      line(ctx, a, b, reveal(3 + i));
    });
    ctx.restore();

    // plane 2: the key, a spine through a small copy of each shadow
    ctx.strokeStyle = ink(0.3);
    ctx.lineWidth = 0.75 * px;
    const iconHalf = (N * mini) / 2;
    let from = spineTop;
    keyY.forEach((y, i) => {
      line(ctx, [spineX, from], [spineX, y - iconHalf - 5], reveal(5 + i));
      from = y + iconHalf + 5;
      const on = i === shown;
      const grow = on && !still ? 0.82 + 0.18 * snap(clamp(since / 0.26)) : 1;
      ctx.fillStyle = on ? accent(0.9) : ink(0.3);
      ctx.beginPath();
      const cell = mini * grow;
      icons[i].forEach(([x, yy]) => {
        ctx.rect(spineX + x * grow, y + yy * grow, cell + 0.02, cell + 0.02);
      });
      ctx.globalAlpha = reveal(6 + i);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // plane 3: the object, its pivot and the app's leader
    ctx.save();
    const front = [ptr.x * 5 * px, ptr.y * 5 * px];
    ctx.translate(front[0], front[1]);
    const axes = dirs.map((n) => apply(m, n));
    const half3 = axes.map((n) => [(dot(n, R) * S) / 2, (-dot(n, U) * S) / 2]);
    const facing = axes.map((n) => dot(n, W));
    voxels.forEach((vx, i) => { depth[i] = dot(apply(m, vx.p), W); });
    order.sort((a, b) => depth[a] - depth[b]);

    // the object develops in place: opaque from the first frame, its tones and edges rising
    const fade = arrive(clamp((intro - 0.15) / 0.7));
    // inner creases at construction weight; the silhouette alone is drawn at 1.25, after
    ctx.strokeStyle = ink(0.32 * fade);
    const body = new Path2D();
    const turned = half3.map((n, f) => { // which way round a face's corners go on screen
      const g = Math.floor(f / 2) * 2;
      const [a, b] = [half3[(g + 2) % 6], half3[(g + 4) % 6]];
      return a[0] * b[1] - a[1] * b[0] > 0;
    });
    for (let j = 0; j < order.length; j += 1) {
      const vx = voxels[order[j]];
      const q = apply(m, vx.p);
      const c = toStage([q[0], q[1], q[2] + D]);
      for (let fi = 0; fi < vx.faces.length; fi += 1) {
        const { f, edges } = vx.faces[fi];
        if (facing[f] > 0.001) {
          const g = Math.floor(f / 2) * 2;
          const n = half3[f];
          const a = half3[(g + 2) % 6];
          const b = half3[(g + 4) % 6];
          const fx = c[0] + n[0];
          const fy = c[1] + n[1];
          const p = [ // +a+b, +a-b, -a-b, -a+b
            [fx + a[0] + b[0], fy + a[1] + b[1]], [fx + a[0] - b[0], fy + a[1] - b[1]],
            [fx - a[0] - b[0], fy - a[1] - b[1]], [fx - a[0] + b[0], fy - a[1] + b[1]],
          ];
          const shade = 14 - axes[f][2] * 12 - axes[f][1] * 7;
          ctx.fillStyle = tones[Math.round(Math.max(0, Math.min(32, shade)) * fade)];
          ctx.beginPath();
          p.forEach(([x, y]) => ctx.lineTo(x, y));
          ctx.closePath();
          ctx.fill();
          const crease = ctx.strokeStyle;
          ctx.strokeStyle = ctx.fillStyle; // closes the hairline seams between faces
          ctx.lineWidth = 0.8 * px;
          ctx.stroke();
          ctx.strokeStyle = crease;
          ctx.lineWidth = 0.75 * px;
          for (let e = 0; e < 4; e += 1) {
            if (edges[e]) line(ctx, p[ENDS[e][0]], p[ENDS[e][1]]);
          }
          const q4 = turned[f] ? p : p.slice().reverse();
          q4.forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y)));
          body.closePath();
        }
      }
    }

    outlineOf(ctx, body, k, front, ink(1), 1.25 * px, 0.74 * fade);

    // the pivot: a dash-dot centre line through the object that crawls as it turns, a front pin
    ctx.strokeStyle = ink(0.34);
    ctx.lineWidth = 0.75 * px;
    ctx.setLineDash([9 * px, 3 * px, 1.5 * px, 3 * px]);
    ctx.lineDashOffset = -(tau * 3 + angle * 14) * px;
    line(ctx, axle[0], axle[1], reveal(4));
    ctx.setLineDash([]);
    ctx.fillStyle = ink(0.6);
    ctx.beginPath();
    ctx.arc(axle[1][0], axle[1][1], 2 * reveal(4), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ink(0.4);
    const type = Math.min(11.5, Math.max(10, size * 0.023)) * px; // the labels' font size
    line(ctx, axle[1], [appX, appY + type * 1.45 + 7 * px], reveal(7));
    ctx.restore();
  }

  redraw = kit.loop(stage, draw, { still: STILL });
}
