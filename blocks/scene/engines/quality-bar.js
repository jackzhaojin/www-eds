/**
 * Scene engine `quality-bar`: the Sites and AI webinar deck, the opener slide "Never easier to
 * make. Never harder to make good." (the moment the talk opens on, beside its heading).
 *
 * What it shows: AI (the accent disc) making pages, faster and faster, that pile up in a heap
 * under a line, the bar, which keeps rising as they come. Three pages are different: each rises
 * to the bar, automation checks it (a faint square closes around it), you approve it (the ink
 * ring and a tick), and it passes through the bar, which gives a little, to a shelf above.
 *
 * Story (plays once from t = 0, then holds): the ground, the disc and the shelf draw on; the
 * pages start, slowly at first, then quicker, each arriving in the accent and settling to faint
 * ink in the heap; the bar rises from just over the heap to its height; the three checked pages
 * cross it in turn and land on the shelf, their titles in the accent. Then it holds: the wash
 * breathes and drifts, the disc's halo breathes. Reduced motion shows the held end.
 *
 * Parts (rows):
 * - `make`: under the ground line, centered, on a short leader (what AI makes easy).
 * - `bar`: above the bar's right end; it rides up with the bar.
 * - `good`: above the shelf, centered, on a short leader (the pages that clear the bar).
 */
const GROUND = 448;
const DISC = [74, 416];
const PAGE = { w: 26, h: 32 };
const COLS = 11;
const ROWS = [423, 391, 359, 327]; // the heap's rows, bottom up (page centers)
const ROW_FILL = [11, 10, 8, 5];
const BAR = { x0: 36, x1: 464 };
const BAR_FROM = 312;
const BAR_TO = 222;
const RISE = [1.3, 6.6]; // the bar's rise, start and end
const EMIT = [1.0, 5.6]; // the heap's pages leave the disc, accelerating
const FLY = 0.9;
const SHELF = {
  y: 122, line: 152, xs: [196, 250, 304], scale: 1.45,
};
const PICKS = [2.3, 3.7, 5.1]; // each checked page leaves the disc
const PICK_X = [210, 262, 314]; // where each meets the bar
const STILL = 9.2;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
// the motion grammar's curves, as close polynomials of the cubic-beziers they name
const ARRIVE = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // (0.16, 1, 0.3, 1)
const TRAVEL = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2); // (0.65, 0, 0.35, 1)
const SNAP = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2; // (0.34, 1.56, 0.64, 1)
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const pulse = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * ((t - t0) / d)));
const f2 = (v) => v.toFixed(2);
const lerp = (a, b, u) => a + (b - a) * u;
/** A point on a cubic Bezier [x0, y0, x1, y1, x2, y2, x3, y3] at u. */
function bez(c, u) {
  const v = 1 - u;
  const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
  return [0, 1].map((o) => w.reduce((sum, k, i) => sum + k * c[i * 2 + o], 0));
}
/** The bar's height at s: it rises over RISE. */
const barY = (s) => lerp(BAR_FROM, BAR_TO, TRAVEL(span(s, RISE[0], RISE[1] - RISE[0])));

/* a page on its own grid, centered on 0 0: the sheet, a title line and three text lines */
const SHEET = `M${-PAGE.w / 2 + 2} ${-PAGE.h / 2}H${PAGE.w / 2 - 6}L${PAGE.w / 2} ${-PAGE.h / 2 + 6}`
  + `V${PAGE.h / 2 - 2}Q${PAGE.w / 2} ${PAGE.h / 2} ${PAGE.w / 2 - 2} ${PAGE.h / 2}`
  + `H${-PAGE.w / 2 + 2}Q${-PAGE.w / 2} ${PAGE.h / 2} ${-PAGE.w / 2} ${PAGE.h / 2 - 2}`
  + `V${-PAGE.h / 2 + 2}Q${-PAGE.w / 2} ${-PAGE.h / 2} ${-PAGE.w / 2 + 2} ${-PAGE.h / 2}Z`;
const TITLE = 'M-8 -8H5';
const LINES = 'M-8 -1H8M-8 5H8M-8 11H3';

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion, random,
  } = kit;
  const id = `quality-bar-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'quality-bar-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'quality-bar-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'quality-bar-wash-stop is-end' }, grad);

  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const front = svg('g', {}, root);
  const intro = []; // [element, 'draw' | 'fade'], in drawing order
  const add = (name, attrs, parent, kind) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };
  const line = (parent, d, cls, kind, extra = {}) => add('path', {
    d, class: `quality-bar-${cls}`, ...extra,
  }, parent, kind);

  const wash = svg('circle', {
    cx: 250, cy: 200, r: 210, fill: `url(#${id}-wash)`,
  }, back);

  // construction: the ground and the shelf
  line(back, `M${BAR.x0} ${GROUND}H${BAR.x1}`, 's', 'draw', { pathLength: 1 });
  line(back, `M${SHELF.xs[0] - 40} ${SHELF.line}H${SHELF.xs[2] + 40}`, 's', 'draw', { pathLength: 1 });

  // AI: the accent disc with a soft halo, low on the left
  const halo = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 13, class: 'quality-bar-halo',
  }, mech, 'fade');
  const disc = add('circle', {
    cx: DISC[0], cy: DISC[1], r: 7.5, class: 'quality-bar-disc',
  }, mech, 'fade');

  /** A page group: the sheet, its title and its lines. */
  const page = (parent, cls = '') => {
    const g = svg('g', { class: `quality-bar-page ${cls}`, opacity: 0 }, parent);
    svg('path', { d: SHEET, class: 'quality-bar-sheet' }, g);
    svg('path', { d: TITLE, class: 'quality-bar-title' }, g);
    svg('path', { d: LINES, class: 'quality-bar-lines' }, g);
    return g;
  };

  // the heap: slots filled bottom up, each row in a shuffled order, and the order they arrive in
  const rnd = random(11);
  const slots = [];
  ROWS.forEach((y, r) => {
    const cols = [...Array(COLS).keys()].sort(() => rnd() - 0.5).slice(0, ROW_FILL[r]);
    cols.forEach((c) => slots.push({
      x: 128 + c * 31 + (r % 2) * 9 + (rnd() - 0.5) * 6,
      y: y + (rnd() - 0.5) * 4,
      a: (rnd() - 0.5) * 12,
    }));
  });
  const n = slots.length;
  const heap = slots.map((slot, i) => {
    // sqrt spacing: the gaps shrink, so AI makes them faster and faster
    const t0 = EMIT[0] + (EMIT[1] - EMIT[0]) * Math.sqrt(i / (n - 1));
    const route = [DISC[0], DISC[1], lerp(DISC[0], slot.x, 0.35), DISC[1] - 120,
      slot.x - 10, slot.y - 70, slot.x, slot.y];
    return {
      ...slot, t0, route, g: page(mech, 'quality-bar-fresh'),
    };
  });

  // the bar, drawn as one path so it can give where a page passes
  const bar = line(front, '', 'bar');
  const barEnds = line(front, '', 'bar-ends');

  // the three checked pages, the automation square around each and your ring and tick
  const picks = PICKS.map((t0, k) => {
    const x = PICK_X[k];
    const route = [DISC[0], DISC[1], lerp(DISC[0], x, 0.4), DISC[1] - 150, x, BAR_TO + 140, x, 0];
    const g = page(front, 'quality-bar-pick quality-bar-fresh');
    const square = svg('rect', {
      x: -PAGE.w / 2 - 6, y: -PAGE.h / 2 - 6, width: PAGE.w + 12, height: PAGE.h + 12, rx: 2, class: 'quality-bar-square', opacity: 0,
    }, front);
    const ring = svg('circle', { r: 7, class: 'quality-bar-ring', opacity: 0 }, front);
    const tick = svg('path', { d: 'M-4.5 0.5l3 3.5l6 -7', class: 'quality-bar-tick', pathLength: 1 }, front);
    return {
      t0, x, route, g, square, ring, tick, sx: SHELF.xs[k],
    };
  });

  // leaders and labels
  const labels = {};
  [['make', 250, GROUND + 4, 250, GROUND + 14, 250, GROUND + 27, 'center'],
    ['good', 250, SHELF.y - 34, 250, SHELF.y - 46, 250, SHELF.y - 62, 'center'],
  ].forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    const label = place(part, lx, ly, 500, align);
    if (!label) return;
    labels[part] = label;
    line(mech, `M${px} ${py}L${ex} ${ey}`, 'leader', 'draw', { pathLength: 1 });
    add('circle', {
      cx: px, cy: py, r: 1.8, class: 'quality-bar-pin',
    }, mech, 'fade');
  });
  labels.bar = place('bar', BAR.x1, BAR_FROM - 16, 500, 'right');

  stage.append(root);
  let kpx = 1; // viewBox units per CSS pixel
  new ResizeObserver(([entry]) => {
    if (!entry.contentRect.width) return;
    kpx = 500 / entry.contentRect.width;
    root.style.setProperty('--k', kpx.toFixed(4));
  }).observe(stage);
  const ptr = pointer(stage);

  const set = (el, prop, v) => {
    const s = typeof v === 'number' ? v.toFixed(3) : v;
    if (el[`_${prop}`] !== s) {
      el[`_${prop}`] = s;
      if (['transform', 'cx', 'cy', 'r', 'd'].includes(prop)) el.setAttribute(prop, s);
      else el.style.setProperty(prop, s);
    }
  };
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.001 && o > 0.001 ? o : 0);
  };
  const active = (part, on) => labels[part]?.classList.toggle('is-active', on);

  function render(t, dt) {
    ptr.update(dt);
    const still = reduceMotion();
    const s = still ? STILL : t;

    // construction draws on in about a second
    intro.forEach(([el, kind], i) => {
      const p = ARRIVE(span(s, (0.4 * i) / intro.length, 0.6));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p);
    });

    // the heap: each page flies from the disc to its slot, fresh in the accent, then settles
    let made = 0;
    heap.forEach((p) => {
      const u = span(s, p.t0, FLY);
      if (u <= 0) {
        set(p.g, 'opacity', 0);
        return;
      }
      made = Math.max(made, pulse(s, p.t0, 0.22));
      const e = TRAVEL(u);
      const [x, y] = bez(p.route, e);
      set(p.g, 'transform', `translate(${f2(x)} ${f2(y)}) rotate(${f2(p.a * e)}) scale(${f2(0.4 + 0.6 * e)})`);
      set(p.g, 'opacity', 0.35 + 0.65 * clamp(u * 3));
      set(p.g, '--s', 0.4 + 0.6 * e);
      set(p.g, '--f', 1 - span(s, p.t0 + FLY, 0.8));
    });
    set(disc, 'r', 7.5 + 1.4 * made);
    set(halo, 'r', 13 + 2.5 * breath(t, 4.3) * (still ? 0 : 1));

    // the bar rises; where a checked page passes, it gives a little
    const y = barY(s);
    let give = 0;
    let gx = 250;
    picks.forEach((p) => {
      const b = pulse(s, p.t0 + 2.05, 0.5);
      if (b > give) {
        give = b;
        gx = p.x;
      }
    });
    const lift = 7 * give;
    set(bar, 'd', `M${BAR.x0} ${f2(y)}H${gx - 30}C${gx - 14} ${f2(y)} ${gx - 14} ${f2(y - lift)} ${gx} ${f2(y - lift)}`
      + `C${gx + 14} ${f2(y - lift)} ${gx + 14} ${f2(y)} ${gx + 30} ${f2(y)}H${BAR.x1}`);
    set(bar, 'opacity', ARRIVE(span(s, 0.6, 0.8)));
    set(barEnds, 'd', `M${BAR.x0} ${f2(y - 5)}V${f2(y + 5)}M${BAR.x1} ${f2(y - 5)}V${f2(y + 5)}`);
    set(barEnds, 'opacity', ARRIVE(span(s, 0.6, 0.8)));
    labels.bar?.style.setProperty('--y', `${f2(((y - 16) / 500) * 100)}%`);
    active('bar', s > RISE[0] && s < RISE[1]);
    active('make', s > EMIT[0] && s < EMIT[1] + FLY);

    // the checked pages: up to the bar, checked, approved, through, onto the shelf
    let onShelf = false;
    picks.forEach((p) => {
      const {
        t0, x, g, square, ring, tick,
      } = p;
      const under = y + 30; // where it waits, under the bar
      const up = span(s, t0, 0.95);
      const through = span(s, t0 + 1.95, 0.9);
      let px;
      let py;
      let sc;
      if (through > 0) {
        const e = TRAVEL(through);
        px = lerp(x, p.sx, e);
        py = lerp(under, SHELF.y, e);
        sc = lerp(1, SHELF.scale, e);
      } else {
        const route = [...p.route.slice(0, 7), under];
        [px, py] = bez(route, TRAVEL(up));
        sc = 0.4 + 0.6 * TRAVEL(up);
      }
      set(g, 'transform', `translate(${f2(px)} ${f2(py)}) scale(${f2(sc)})`);
      set(g, '--s', sc);
      set(g, 'opacity', up > 0 ? 0.35 + 0.65 * clamp(up * 3) : 0);
      // fresh while it travels; once on the shelf only its title keeps the accent
      set(g, '--f', 1 - span(s, t0 + 0.95, 0.5));
      set(g, '--t', SNAP(span(s, t0 + 2.85, 0.25)));
      // automation closes a square around it, then you approve it with a tick
      const check = span(s, t0 + 1.0, 0.35);
      const near = through > 0 ? 0 : 1;
      set(square, 'transform', `translate(${f2(x)} ${f2(under)}) scale(${f2(1.25 - 0.25 * ARRIVE(check))})`);
      set(square, 'opacity', check > 0 ? 0.7 * clamp(check * 3) * near : 0);
      const ok = span(s, t0 + 1.4, 0.3);
      const press = pulse(s, t0 + 1.4, 0.26);
      const rx = through > 0 ? px + PAGE.w * sc * 0.5 + 6 : x + PAGE.w / 2 + 14;
      const ry = through > 0 ? py - PAGE.h * sc * 0.5 + 4 : under - 8;
      set(ring, 'cx', f2(rx));
      set(ring, 'cy', f2(ry));
      set(ring, 'r', 7 + 1.4 * press);
      set(ring, 'opacity', ok > 0 ? clamp(ok * 3) : 0);
      set(tick, 'transform', `translate(${f2(rx)} ${f2(ry)})`);
      dash(tick, ARRIVE(span(s, t0 + 1.5, 0.3)));
      onShelf = onShelf || (through > 0.6);
    });
    active('good', onShelf && s < PICKS[2] + 3.4);

    // ambient: the wash breathes about 2% and drifts; on hover the back plane leans 4px
    set(wash, 'opacity', (0.6 + 0.4 * ARRIVE(span(s, PICKS[0] + 2, 1.6))) * (0.98 + 0.02 * breath(t, 17)));
    set(wash, 'cx', 250 + 6 * Math.sin((2 * Math.PI * t) / 23));
    set(wash, 'cy', 200 + 5 * Math.sin((2 * Math.PI * t) / 31));
    set(back, 'transform', `translate(${f2(ptr.x * 4 * kpx)} ${f2(ptr.y * 4 * kpx)})`);
  }

  loop(stage, render, { still: STILL });
}
