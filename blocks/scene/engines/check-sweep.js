/**
 * Scene engine `check-sweep`: the webinar deck's stage 03 offer card "Same checks, every page"
 * (evaluating a page before it goes live).
 *
 * What it shows: one checklist of six checks (title, headings, a direct answer up top,
 * structured data, links, alt text) run on a stack of five pages, one page at a time. The AI
 * (the accent disc) steps down between the page and the list, its reading line across the
 * page; each row ticks in ink as it passes, and one row on every page (a different one each
 * time) flags in the accent: the box fills, a flag pins the page at that line and the fix label
 * marks the row. A checked page shrinks into the row of checked pages below, its flag with it,
 * and the next page comes up, a little faster than the last. The fifth page stays under the
 * list, and the disc settles by its flagged row.
 *
 * Story (played once from t = 0): construction draws on 0 to 0.8 s; pages one to five from
 * 1 s; settled by about 8.4 s (four checked pages below, each flagged at a different line, the
 * fifth under the list). Then it holds: the wash and the disc's halo breathe. Reduced motion
 * shows that end state.
 *
 * Parts (rows):
 * - `pages`: over the stack, top left; a leader down to the page's top edge.
 * - `checks`: over the checklist, top right; a leader down to the card.
 * - `fix`: at the end of the flagged row, in the accent; it moves to each page's flagged row
 *   as that page is checked.
 */
const W = 500;
const PX = 60; // the page under review (and the stack under it)
const PY = 108;
const PW = 130;
const PH = 180;
const ROW0 = 24; // the six checks, on the page and on the list (local y)
const ROW = 27;
const rowY = (i) => PY + ROW0 + ROW * i;
const CX = 244; // the checklist card, beside the page, same top and height
const CW = 208;
const BOX = 268; // a row's box center, and where its line starts
const LINE = 288;
const LENS = [92, 64, 104, 80, 96, 60];
const DX = 218; // the disc's rail, between the page and the list
const SLOT_X = 60; // the row of checked pages
const SLOT_STEP = 70;
const SLOT_Y = 352;
const SLOT_S = 0.46;
const DEPTH = 4.5; // the stack: each page under the top one shows this much of its edge
const PAGES = 5;
const FLAGS = [4, 1, 5, 0, 2]; // each page's flagged row
const PACE = [0.2, 0.14, 0.12, 0.11, 0.11]; // seconds a row
const PAUSE = 0.18; // the disc dwells on a flag
const HOLD = 0.12;
const MOVE = 0.55; // a checked page's trip to its slot
const GAP = 0.42; // from a page leaving to the next one starting
const CLIMB = GAP - 0.05; // the disc back to the top
const STILL = 11;

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
const f2 = (v) => v.toFixed(2);

/* the story's clock: when the disc reaches each row of each page, and when each page leaves */
const PLAN = [];
{
  let t0 = 1;
  for (let k = 0; k < PAGES; k += 1) {
    const d = PACE[k];
    const at = [];
    for (let i = 0; i < 6; i += 1) at.push(t0 + d * i + (i > FLAGS[k] ? PAUSE : 0));
    const done = at[5] + d * 0.5;
    const out = done + HOLD;
    PLAN.push({
      t0, at, done, out, flag: at[FLAGS[k]] + 0.02, clear: out,
    });
    t0 = out + GAP;
  }
}
const LAST = PLAN[PAGES - 1];
const REST = LAST.done + 0.15; // the disc goes back to the last page's flag

/** Each page's own line lengths (seeded), so the five pages differ. */
function pageArt(rand) {
  const r = (a, b) => f2(a + (b - a) * rand());
  return [
    ['M10 10H26M104 10h2M110 10h2M116 10h2', 1, 0.35],
    [`M10 24H${r(78, 100)}`, 2.4, 0.85],
    [`M10 51H${r(52, 72)}`, 1.6, 0.72],
    [`M10 58.5H${r(96, 116)}`, 0.9, 0.36],
    ['M8 70H122V86H8Z', 0.9, 0.4, 'tint'],
    [`M14 78H${r(88, 110)}`, 1.1, 0.62],
    [`M10 105H${r(58, 82)}`, 1.6, 0.55, 'dots'],
    [`M10 112H${r(92, 114)}`, 0.9, 0.36],
    ['M10 132H118', 0.9, 0.36],
    [`M${r(24, 50)} 135.5h26`, 1.4, 0.72],
    ['M10 147H54V171H10Z', 1, 0.55],
    ['M13 167.5L24 158L31.5 164L37.5 159.5L51 168.5', 0.9, 0.5],
    [`M62 154H${r(98, 114)}M62 161H${r(80, 96)}`, 0.9, 0.36],
  ];
}

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, random,
  } = kit;
  const id = `check-sweep-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'check-sweep-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'check-sweep-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'check-sweep-wash-stop' }, grad);

  const intro = []; // [element, kind, delay]: 'draw' by dash, 'fade' by opacity
  const add = (name, attrs, parent, kind, delay = intro.length * 0.04) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind, delay]);
    return el;
  };

  // construction: the wash, the shelf the checked pages land on
  const wash = svg('circle', {
    cx: DX + 40, cy: rowY(2.5), r: 210, fill: `url(#${id}-wash)`,
  }, root);
  add('path', { d: `M${SLOT_X - 10} ${SLOT_Y + 92}H${SLOT_X + SLOT_STEP * 3 + 66}`, class: 'check-sweep-c', pathLength: 1 }, root, 'draw', 0.3);

  // the checklist: its card, and six rows of a box and a line
  const list = svg('g', {}, root);
  add('rect', {
    x: CX, y: PY, width: CW, height: PH, rx: 4, class: 'check-sweep-s check-sweep-card', pathLength: 1,
  }, list, 'draw', 0);
  const rows = LENS.map((len, i) => {
    const y = rowY(i);
    const box = add('rect', {
      x: BOX - 6, y: y - 6, width: 12, height: 12, rx: 2.5, class: 'check-sweep-s check-sweep-box',
    }, list, 'fade', 0.12 + i * 0.06);
    add('path', { d: `M${LINE} ${y}H${LINE + len}`, class: 'check-sweep-line', pathLength: 1 }, list, 'draw', 0.16 + i * 0.06);
    const lit = svg('path', { d: `M${LINE} ${y}H${LINE + len}`, class: 'check-sweep-lit', pathLength: 1 }, list);
    const fill = svg('rect', {
      x: BOX - 6, y: y - 6, width: 12, height: 12, rx: 2.5, class: 'check-sweep-fill',
    }, list);
    const tick = svg('path', { d: `M${BOX - 4.5} ${y}L${BOX - 1} ${y + 3.5}L${BOX + 5} ${y - 3.5}`, class: 'check-sweep-tick', pathLength: 1 }, list);
    return {
      y, box, lit, fill, tick,
    };
  });

  // the pages: each a group drawn on its own 130 x 180 sheet, moved and scaled as a whole
  const sheets = svg('g', {}, root);
  const pages = Array.from({ length: PAGES }, (_, k) => {
    const g = svg('g', { class: 'check-sweep-page' }, sheets);
    svg('rect', {
      x: 0, y: 0, width: PW, height: PH, rx: 3, class: 'check-sweep-paper',
    }, g);
    pageArt(random(7 + k * 13)).forEach(([d, w, o, kind]) => {
      svg('path', {
        d, style: `--w: ${w}`, 'stroke-opacity': o, class: kind ? `check-sweep-${kind}` : null,
      }, g);
    });
    return { g, last: '' };
  });
  const flags = pages.map(() => svg('path', { d: 'M0 -3.6H9.5L12 0L9.5 3.6H0Z', class: 'check-sweep-flag' }, root));

  // the AI: its reading line across the page, the disc and its halo
  const scan = svg('path', { d: `M${PX + 4} 0H${BOX - 9}`, class: 'check-sweep-scan' }, root);
  const halo = svg('circle', {
    cx: DX, r: 13, class: 'check-sweep-halo',
  }, root);
  const disc = svg('circle', {
    cx: DX, r: 6.5, class: 'check-sweep-disc',
  }, root);

  // callouts: [part, label x, label y, leader from, leader to]
  [['pages', PX, PY - 44, PY - 26, PY], ['checks', CX, PY - 44, PY - 26, PY]].forEach(([part, x, y, y0, y1]) => {
    if (!place(part, x, y, W, 'left')) return;
    add('path', { d: `M${x + 10} ${y0}V${y1 - 3}`, class: 'check-sweep-leader', pathLength: 1 }, root, 'draw', 0.5);
    add('circle', {
      cx: x + 10, cy: y1, r: 1.8, class: 'check-sweep-pin',
    }, root, 'fade', 0.6);
  });
  const fixLabel = kit.parts.get('fix');
  let fixRow = FLAGS[0];
  place('fix', LINE + LENS[fixRow] + 12, rowY(fixRow), W, 'left');

  stage.append(root);
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (w) root.style.setProperty('--k', (W / w).toFixed(3));
  }).observe(stage);

  const set = (el, prop, v) => {
    if (el[`_${prop}`] !== v) {
      el[`_${prop}`] = v;
      el.style.setProperty(prop, v);
    }
  };
  const attr = (el, name, v) => {
    if (el[`_${name}`] !== v) {
      el[`_${name}`] = v;
      el.setAttribute(name, v);
    }
  };
  /* a partial stroke of a pathLength="1" path; hidden at 0, where round caps leave a dot */
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };

  /** Where page k is at t: in the stack (its depth), on its way down, or in its slot. */
  function pose(k, t) {
    if (k < PAGES - 1 && t > PLAN[k].out) {
      const p = travel(span(t, PLAN[k].out, MOVE));
      const s = 1 + (SLOT_S - 1) * p;
      return {
        x: PX + (SLOT_X + SLOT_STEP * k - PX) * p,
        y: PY + (SLOT_Y - PY) * p - 16 * Math.sin(Math.PI * p),
        s,
        gone: true,
      };
    }
    let d = k;
    for (let j = 0; j < k; j += 1) d -= travel(span(t, PLAN[j].out, 0.45));
    return {
      x: PX, y: PY + DEPTH * d, s: 1, gone: false,
    };
  }

  /** The page whose results the list shows at t (the rows clear before the next page starts). */
  const listPage = (t) => {
    let c = 0;
    while (c < PAGES - 1 && t >= PLAN[c + 1].t0) c += 1;
    return c;
  };

  /** The disc's height at t: it steps down the rows, and climbs back while a page leaves. */
  function discY(t) {
    if (t < PLAN[0].t0) return rowY(0) - 30 * (1 - arrive(span(t, 0.5, 0.5)));
    let k = 0;
    while (k < PAGES - 1 && t >= PLAN[k + 1].t0) k += 1;
    const P = PLAN[k];
    if (k === PAGES - 1 && t > P.done) {
      return rowY(5) + (rowY(FLAGS[k]) - rowY(5)) * travel(span(t, REST, 0.6));
    }
    if (t > P.out) return rowY(5) + (rowY(0) - rowY(5)) * travel(span(t, P.out, CLIMB));
    let i = 0;
    while (i < 5 && t >= P.at[i + 1]) i += 1;
    if (i === 5) return rowY(5);
    const a = P.at[i];
    const b = P.at[i + 1];
    const from = a + (b - a) * (i === FLAGS[k] ? 0.7 : 0.35);
    return rowY(i) + ROW * travel(span(t, from, b - from));
  }

  let order = '';
  function draw(t) {
    // construction
    intro.forEach(([el, kind, delay]) => {
      const p = arrive(span(t, delay, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });

    // the list: the current page's ticks, its flag, and the rows clearing for the next page
    const c = listPage(t);
    const P = PLAN[c];
    rows.forEach((row, i) => {
      const on = span(t, P.at[i] + 0.02, 0.22);
      const fade = c < PAGES - 1 ? 1 - leave(span(t, P.clear + 0.02 * i, 0.25)) : 1;
      const flagged = i === FLAGS[c];
      dash(row.tick, flagged ? 0 : arrive(on), fade);
      dash(row.lit, flagged ? arrive(on) : 0, fade);
      const pop = flagged ? snap(on) : 0;
      set(row.fill, 'opacity', (clamp(on * 3) * fade * (flagged ? 1 : 0)).toFixed(3));
      attr(row.fill, 'transform', `translate(${BOX} ${row.y}) scale(${f2(0.4 + 0.6 * pop)}) translate(${-BOX} ${-row.y})`);
      set(row.box, 'stroke-opacity', (0.5 + 0.35 * on * fade).toFixed(3));
    });
    if (fixLabel) {
      const r = FLAGS[c];
      if (r !== fixRow) {
        fixRow = r;
        place('fix', LINE + LENS[r] + 12, rowY(r), W, 'left');
      }
      const fade = c < PAGES - 1 ? 1 - leave(span(t, P.clear, 0.25)) : 1;
      set(fixLabel, 'opacity', (arrive(span(t, P.flag, 0.35)) * fade).toFixed(3));
    }

    // the pages: the stack under review, then the checked ones on their way or in their slots
    const poses = pages.map((_, k) => pose(k, t));
    const key = poses.map((p, k) => (p.gone ? 20 + k : 10 - k));
    const next = key.join();
    if (next !== order) {
      order = next;
      [...pages.keys()].sort((a, b) => key[a] - key[b]).forEach((k) => sheets.append(pages[k].g));
    }
    const shown = arrive(span(t, 0.1, 0.6)); // the stack fades in as one, so no page shows through
    set(sheets, 'opacity', shown.toFixed(3));
    attr(sheets, 'transform', `translate(0 ${f2(10 * (1 - shown))})`);
    pages.forEach((page, k) => {
      const { x, y, s } = poses[k];
      const tf = `translate(${f2(x)} ${f2(y)}) scale(${s.toFixed(3)})`;
      if (tf !== page.last) {
        page.last = tf;
        page.g.setAttribute('transform', tf);
        page.g.style.setProperty('--pf', (0.72 + 0.28 * s).toFixed(3));
      }
      const pop = snap(span(t, PLAN[k].flag, 0.24));
      const fs = (0.62 + 0.38 * s) * pop;
      const fy = y + s * (ROW0 + ROW * FLAGS[k]);
      attr(flags[k], 'transform', `translate(${f2(x + s * PW - 1)} ${f2(fy)}) scale(${fs.toFixed(3)})`);
      set(flags[k], 'opacity', pop > 0.001 ? '1' : '0');
    });

    // the AI: the disc, its halo and its reading line (resting by the last flag at the end)
    const dy = discY(t);
    attr(disc, 'cy', f2(dy));
    attr(halo, 'cy', f2(dy));
    const on = arrive(span(t, 0.5, 0.5));
    set(disc, 'opacity', on.toFixed(3));
    attr(halo, 'r', f2(13 + 1.6 * breath(t, 3.1) * span(t, REST, 1)));
    set(halo, 'opacity', on.toFixed(3));
    let reading = 0;
    PLAN.forEach((p, k) => {
      const end = k === PAGES - 1 ? 99 : p.done + 0.12;
      reading = Math.max(reading, span(t, p.t0 - 0.12, 0.12) * (1 - span(t, end, 0.2)));
    });
    attr(scan, 'transform', `translate(0 ${f2(dy)})`);
    set(scan, 'opacity', (reading * (1 - 0.45 * span(t, LAST.done, 0.6))).toFixed(3));

    // ambient: the wash breathes (2%) over 17 s
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
  }

  loop(stage, draw, { still: STILL });
}
