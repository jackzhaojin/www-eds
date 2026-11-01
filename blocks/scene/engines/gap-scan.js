/**
 * Scene engine `gap-scan`: the Sites and AI webinar deck, stage 01 (research and briefs), the
 * offer card "It spots what's missing".
 *
 * What it shows: a gap analysis. Your page (in ink, on the left) stands next to three pages you
 * compete with (fainter), each drawn as a column of section bars, the columns row-aligned so a
 * row is one topic. The AI (the accent disc) leads a scan line down all four at once; the rows
 * it has read come up to full ink. At a row where the others all have a section and your page
 * has none, the scan stops: their three sections flash in the accent, a hairline runs across the
 * row to your column, and a dashed accent placeholder with a plus opens in the empty slot, its
 * marker set in the margin. Two gaps found, the scan line folds back into the disc at the foot.
 *
 * Story (plays once from t = 0, then holds): to 1 s the pages draw on; 1.15 to 2.35 s the scan
 * reaches the first gap (row 2) and dwells; 3.25 to 4.75 s on to the second (row 5) and dwells;
 * 5.65 to 6.7 s down to the foot, where the line folds away by 7.2 s. From 7.5 s it holds: two
 * gaps marked, the placeholders' dashes creeping, the wash and halo breathing. Reduced motion
 * shows that end state.
 *
 * Parts (rows):
 * - `yours`: over your page, at its left; its leader drops to the page.
 * - `theirs`: centered over the three other pages, a bracket under it spanning them.
 * - `gap`: in the margin left of the first gap, its leader running to the placeholder. It shows
 *   once the first gap is found.
 */
const W = 500;
const STILL = 9;

// the pages: yours, then three you compete with; six rows of sections
const YOURS = { x: 84, w: 108 };
const THEIRS = [212, 296, 380].map((x) => ({ x, w: 70 }));
const FRAME_Y = 70;
const FRAME_H = 324;
const ROW0 = 98;
const PITCH = 50;
const BAR_H = 32;
const HAVE = [ // which rows each page covers (yours first)
  [1, 0, 1, 1, 0, 1],
  [1, 1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 0],
];
const GAPS = [1, 4];
const LANE = 44; // the disc's lane, in the margin
const MARK_X = 74; // the gap markers, between the lane and your page
const RIGHT = 458; // where the scan line ends

// the scan: [t0, t1, y0, y1] legs, dwelling at each gap
const rowY = (r) => ROW0 + r * PITCH + BAR_H / 2;
const LEGS = [
  [1.15, 2.35, FRAME_Y + 14, rowY(GAPS[0])],
  [3.25, 4.75, rowY(GAPS[0]), rowY(GAPS[1])],
  [5.65, 6.7, rowY(GAPS[1]), FRAME_Y + FRAME_H + 10],
];
const FOUND = [2.35, 4.75]; // the scan stops at each gap
const FOLD = 6.75;

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
const leave = bezier(0.32, 0, 0.67, 0);
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);

/** Where the scan line is at t. */
function scanY(t) {
  let y = LEGS[0][2];
  LEGS.forEach(([t0, t1, y0, y1]) => {
    if (t >= t0) y = y0 + (y1 - y0) * travel(span(t, t0, t1 - t0));
  });
  return y;
}

export default function engine(block, kit) {
  const {
    stage, svg, place, parts, loop, pointer, reduceMotion, random,
  } = kit;
  const id = `gap-scan-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'gap-scan-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: 0, class: 'gap-scan-stop' }, grad);
  svg('stop', { offset: 1, class: 'gap-scan-stop' }, grad);
  const back = svg('g', {}, root);
  const under = svg('g', {}, root); // the row connectors, behind the bars
  const pagesG = svg('g', {}, root);
  const top = svg('g', {}, root);
  const marks = svg('g', {}, root);

  const washEl = svg('circle', {
    cx: YOURS.x + YOURS.w / 2, cy: rowY(2.5), r: 190, fill: `url(#${id}-wash)`,
  }, back);

  // the four pages: a frame, a masthead stroke, and a bar per section (a heading and a rule in
  // each); the rows come up to full ink as the scan reads them
  const rnd = random(5);
  const cols = [YOURS, ...THEIRS].map((col, c) => {
    const g = svg('g', { class: c ? 'gap-scan-col is-theirs' : 'gap-scan-col is-yours' }, pagesG);
    const frame = svg('rect', {
      x: col.x, y: FRAME_Y, width: col.w, height: FRAME_H, rx: 4, class: 'gap-scan-frame', pathLength: 1,
    }, g);
    const mast = svg('path', { d: `M${col.x + 9} ${FRAME_Y + 13}h${f2(col.w * 0.34)}`, class: 'gap-scan-mast' }, g);
    const bars = HAVE[c].map((has, r) => {
      if (!has) return null;
      const x = col.x + 8;
      const y = ROW0 + r * PITCH;
      const w = col.w - 16;
      const bar = svg('g', {}, g);
      svg('rect', {
        x, y, width: w, height: BAR_H, rx: 3, class: 'gap-scan-bar',
      }, bar);
      svg('path', {
        d: `M${x + 7} ${y + 12}h${f2(w * (0.3 + rnd() * 0.18))}M${x + 7} ${y + 21}h${f2(w * (0.5 + rnd() * 0.32))}`,
        class: 'gap-scan-text',
      }, bar);
      const flash = c && GAPS.includes(r) ? svg('rect', {
        x, y, width: w, height: BAR_H, rx: 3, class: 'gap-scan-flash',
      }, g) : null;
      return { bar, flash, r };
    }).filter(Boolean);
    return {
      g, frame, mast, bars,
    };
  });

  // each gap: a hairline across the row (theirs to yours), the placeholder and its plus, and a
  // marker in the margin with its leader
  const px = YOURS.x + 8;
  const pw = YOURS.w - 16;
  const gaps = GAPS.map((r, i) => {
    const y = ROW0 + r * PITCH;
    const cy = y + BAR_H / 2;
    const link = svg('path', {
      d: `M${THEIRS[2].x + THEIRS[2].w - 8} ${cy}H${px + pw}`, class: 'gap-scan-link', pathLength: 1,
    }, under);
    const hole = svg('g', {}, top);
    const box = svg('rect', {
      x: px, y, width: pw, height: BAR_H, rx: 3, class: 'gap-scan-hole',
    }, hole);
    const plus = svg('path', { d: 'M-5 0h10M0 -5v10', class: 'gap-scan-plus' }, hole);
    const lead = svg('path', { d: `M${px - 1} ${cy}H${MARK_X}`, class: 'gap-scan-lead', pathLength: 1 }, marks);
    const mark = svg('circle', {
      cx: MARK_X, cy, r: 0, class: 'gap-scan-mark',
    }, marks);
    return {
      r, cy, link, hole, box, plus, lead, mark, found: FOUND[i],
    };
  });

  // the scan line and the disc that leads it
  const beam = svg('line', { class: 'gap-scan-beam' }, top);
  const halo = svg('circle', { r: 18, cx: LANE, class: 'gap-scan-halo' }, top);
  const disc = svg('circle', { r: 8.5, cx: LANE, class: 'gap-scan-disc' }, top);

  // callouts: your page's leader, the bracket over theirs
  const theirsMid = (THEIRS[0].x + THEIRS[2].x + THEIRS[2].w) / 2;
  const callout = svg('g', {}, marks);
  const yoursLead = svg('path', { class: 'gap-scan-leader' }, callout);
  const yoursPin = svg('circle', {
    cx: YOURS.x + 10, cy: FRAME_Y, r: 2.2, class: 'gap-scan-pin',
  }, callout);
  const bracket = svg('path', { class: 'gap-scan-leader' }, callout);
  const pins = THEIRS.map((col) => svg('circle', {
    cx: col.x + col.w / 2, cy: FRAME_Y, r: 2.2, class: 'gap-scan-pin',
  }, callout));
  const gapLabel = parts.get('gap');

  stage.append(root);
  let kpx = 1;
  const layout = () => {
    const size = stage.clientWidth;
    if (size) kpx = W / size;
    root.style.setProperty('--k', kpx.toFixed(3));
    const ref = parts.get('yours') || parts.get('theirs');
    const h = (size && ref && ref.offsetHeight * kpx) || 24;
    const ly = FRAME_Y - 18 - h / 2;
    if (place('yours', YOURS.x + 5, ly, W, 'left')) {
      yoursLead.setAttribute('d', `M${YOURS.x + 10} ${f2(ly + h / 2 + 3)}V${FRAME_Y - 2}`);
    } else {
      yoursLead.remove();
      yoursPin.remove();
    }
    if (place('theirs', theirsMid, ly, W, 'center')) {
      const by = FRAME_Y - 10;
      const [a, , c] = THEIRS.map((col) => col.x + col.w / 2);
      const stem = `M${theirsMid} ${FRAME_Y - 2}V${f2(Math.min(by - 1, ly + h / 2 + 3))}`;
      bracket.setAttribute('d', `M${a} ${FRAME_Y - 2}V${by}H${c}V${FRAME_Y - 2}${stem}`);
    } else {
      bracket.remove();
      pins.forEach((p) => p.remove());
    }
    place('gap', MARK_X - 9, gaps[0].cy, W, 'right');
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
  /* the first p of a pathLength="1" stroke; hidden when empty (a round cap leaves a dot) */
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.0005 && o > 0.001 ? o : 0);
  };

  const ptr = pointer(stage);
  function draw(t, dt) {
    ptr.update(dt);
    const calm = reduceMotion();
    const y = scanY(t);

    // construction: the frames draw on, the sections settle in row by row; a row the scan has
    // read comes up from 55% to full ink
    cols.forEach((col, c) => {
      const e = arrive(span(t, 0.1 + c * 0.08, 0.8));
      dash(col.frame, e);
      set(col.frame, 'fill-opacity', e);
      set(col.mast, 'opacity', arrive(span(t, 0.35 + c * 0.08, 0.5)));
      col.bars.forEach((b) => {
        const read = 0.55 + 0.45 * arrive(span(y, rowY(b.r) - 30, 34));
        set(b.bar, 'opacity', arrive(span(t, 0.3 + b.r * 0.06 + c * 0.03, 0.6)) * read);
        if (b.flash) {
          const g = gaps.find((gp) => gp.r === b.r);
          const at = g.found + (c - 1) * 0.07;
          const on = Math.min(1, snap(span(t, at, 0.2))) * (1 - arrive(span(t, at + 0.5, 1.1)));
          set(b.flash, 'opacity', t >= at ? on : 0);
        }
      });
    });
    set(yoursLead.parentNode, 'opacity', arrive(span(t, 0.5, 0.6)));

    // the gaps: across the row, the placeholder opens with its plus, the marker drops in the margin
    gaps.forEach((g, i) => {
      const fade = 1 - 0.6 * span(t, g.found + 1.2, 0.8);
      dash(g.link, travel(span(t, g.found + 0.05, 0.45)), 0.5 * fade);
      const open = span(t, g.found + 0.35, 0.3);
      const s = 0.9 + 0.1 * snap(open);
      const cx = px + pw / 2;
      set(g.hole, 'opacity', arrive(open));
      set(g.hole, 'transform', `translate(${cx} ${g.cy}) scale(${s.toFixed(3)}) translate(${-cx} ${-g.cy})`);
      const p = Math.max(0, snap(span(t, g.found + 0.6, 0.24)));
      set(g.plus, 'transform', `translate(${cx} ${g.cy}) scale(${p.toFixed(3)})`);
      dash(g.lead, arrive(span(t, g.found + 0.55, 0.4)));
      set(g.mark, 'r', f2(2.8 * Math.max(0, snap(span(t, g.found + 0.8, 0.24)))));
      if (i === 0 && gapLabel) {
        // the label waits until the disc has moved on down the lane
        set(gapLabel, 'opacity', calm ? 1 : arrive(span(t, g.found + 1.55, 0.6)));
      }
    });

    // the disc leads the scan line down the margin; at the foot the line folds back into it
    const s = Math.max(0, snap(span(t, 0.8, 0.3)));
    disc.setAttribute('cy', f2(y));
    disc.setAttribute('r', f2(8.5 * s));
    halo.setAttribute('cy', f2(y));
    const dwell = FOUND.some((f) => t >= f && t < f + 0.9);
    halo.setAttribute('r', f2((17 + 1.6 * breath(t, 3.7) + (dwell ? 2 : 0)) * s));
    const reach = arrive(span(t, 1, 0.5)) * (1 - leave(span(t, FOLD, 0.45)));
    set(beam, 'opacity', reach > 0.002 ? 0.75 : 0);
    if (reach > 0.002) {
      set(beam, 'x1', LANE + 12);
      set(beam, 'x2', f2(LANE + 12 + (RIGHT - LANE - 12) * reach));
      set(beam, 'y1', f2(y));
      set(beam, 'y2', f2(y));
    }

    // the hold: the placeholders' dashes creep, the wash breathes
    gaps.forEach((g) => set(g.box, 'stroke-dashoffset', calm ? '0' : f2(-t * 2.2)));
    set(washEl, 'opacity', arrive(span(t, 0.3, 1.2)) * (0.86 + 0.14 * breath(t, 17)));
    const m = calm ? 0 : 4 * kpx;
    set(back, 'transform', `translate(${f2(ptr.x * m)} ${f2(ptr.y * m)})`);
  }

  layout();
  const redraw = loop(stage, draw, { still: STILL });
  new ResizeObserver(() => {
    layout();
    redraw();
  }).observe(stage);
}
