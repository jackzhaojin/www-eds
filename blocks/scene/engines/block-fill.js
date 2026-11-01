/**
 * Scene engine `block-fill`: the Sites and AI deck, slide 02 ("What AI offers"), the offer card
 * "It drafts into your blocks".
 *
 * What it shows: a brief on the left, a narrow document of ruled lines, and on the right a page
 * built from blocks: a wide hero, a cards block (two cards side by side) and a small table. AI,
 * the accent disc between them, writes the brief into the page one block at a time: a stream
 * draws from one of the brief's paragraphs through the disc into the block, short lines flow
 * along it, and the block's text writes in in the accent, then settles to ink while the stream
 * fades to a faint thread (the record of where the words went). The outlines never move: dashed
 * construction while a block waits, solid ink once it holds its words. The design stays put;
 * only the words arrive.
 *
 * Story (plays once from t = 0, then holds): construction draws on (0 to 1.3 s); the disc
 * arrives (1 s); three beats of 1.75 s, hero, cards, table, the disc gliding to each block's
 * stream and the paragraph it reads brightening; by 7.7 s the page is written, the disc rests
 * on the middle thread, and the plate holds, its wash and the disc's halo breathing. Reduced
 * motion shows the held end state.
 *
 * Parts (rows):
 * - `brief`: under the brief, left-aligned, its leader up to the brief's lower edge.
 * - `blocks`: over the page, left-aligned, its leader down to the page's top edge.
 */
const STILL = 9;
const S0 = 1.15; // the first beat
const BEAT = 1.75;
const DX = 176; // the disc's column, midway between the brief and the page
const REST = 6.8; // after the last beat the disc glides back to the middle

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

/** A rounded rectangle as a path. */
const box = (x, y, w, h, r = 3) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}`
  + `V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}`
  + `V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
/** A line of text: a rule from x, w long. */
const row = (x, y, w) => `M${x} ${y}h${w}`;

/* the brief: a sheet with a folded corner, a title, three paragraphs (one per block) and a tail */
const BRIEF = 'M43 112H118L132 126V337Q132 340 129 340H43Q40 340 40 337V115Q40 112 43 112Z';
const FOLD = 'M118 112V126H132';
const PARAS = [[156, [68, 60, 40]], [200, [68, 64, 68, 36]], [254, [68, 56, 66, 30]]];
const TAIL = [[308, 62], [318, 44]];

/* the page: a frame, a header (a mark, the nav, a rule) and its blocks */
const PAGE = box(206, 64, 254, 344);
const COL = [230, 305.3, 380.7];
const ROWS = [327.5, 347, 367, 386.5];
const CELLS = [[40, 34, 44], [52, 30, 38], [44, 40, 26], [56, 28, 42]];
/* each block: where its stream lands on its left edge, its outline, and its text as
   [path, delay after the writing starts, heading] */
const BLOCKS = [
  { // hero: a title, a line and a button
    entry: 127,
    outline: [box(220, 102, 226, 80), box(234, 157, 44, 14, 7)],
    text: [[row(234, 127, 138), 0, 1], [row(234, 144, 98), 0.16], [row(244, 164, 24), 0.32]],
  },
  { // cards: two cards, each an image, a title and two lines
    entry: 250,
    outline: [box(220, 196, 107, 108), box(339, 196, 107, 108)],
    media: [box(228, 204, 91, 40, 2), box(347, 204, 91, 40, 2)],
    text: [0, 119].flatMap((dx, c) => [
      [row(228 + dx, 259, 56), 0.36 * c, 1],
      [row(228 + dx, 275, 82), 0.36 * c + 0.1],
      [row(228 + dx, 288, 62), 0.36 * c + 0.2],
    ]),
  },
  { // table: a header row and three rows of three cells
    entry: 347,
    outline: [box(220, 318, 226, 78), 'M295.3 318V396M370.7 318V396M220 337H446M220 357H446M220 377H446'],
    text: CELLS.flatMap((ws, r) => ws.map((w, c) => [
      row(COL[c], ROWS[r], w), 0.17 * r + 0.06 * c, r === 0,
    ])),
  },
];

/* callouts: [part, pin x, pin y, leader end x, end y, label x, label y, align] */
const CALLOUTS = [
  ['brief', 48, 340, 48, 351, 40, 366, 'left'],
  ['blocks', 214, 64, 214, 54, 206, 40, 'left'],
];

export default function engine(block, kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `block-fill-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'block-fill-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'block-fill-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'block-fill-wash-stop is-end' }, grad);
  const wash = svg('circle', {
    cx: 300, cy: 236, r: 230, fill: `url(#${id}-wash)`,
  }, root);

  const frames = []; // drawn on first, then the lines: [element, 'draw' | 'fade']
  const lines = [];
  const add = (list, d, cls, parent, kind = 'draw') => {
    const el = svg('path', { d, class: cls, pathLength: kind === 'draw' ? 1 : null }, parent);
    list.push([el, kind]);
    return el;
  };

  // the brief
  const brief = svg('g', {}, root);
  add(frames, BRIEF, 'block-fill-s', brief);
  add(frames, FOLD, 'block-fill-c', brief);
  add(lines, row(52, 134, 44), 'block-fill-rule is-head', brief);
  const paras = PARAS.map(([y0, ws]) => {
    const g = svg('g', { class: 'block-fill-para' }, brief);
    ws.forEach((w, i) => add(lines, row(52, y0 + 10 * i, w), 'block-fill-rule', g));
    return { g, y: y0 + 5 * (ws.length - 1) };
  });
  TAIL.forEach(([y, w]) => add(lines, row(52, y, w), 'block-fill-rule', brief));

  // the page and its blocks; the outlines fade in as construction, dashed
  const page = svg('g', {}, root);
  add(frames, PAGE, 'block-fill-s', page);
  add(frames, 'M206 92H460', 'block-fill-c', page);
  add(lines, row(220, 78, 20), 'block-fill-rule is-head', page);
  add(lines, 'M398 78h12M418 78h12M438 78h8', 'block-fill-rule', page);
  const streams = svg('g', {}, root);
  const blocks = BLOCKS.map((b, i) => {
    const g = svg('g', { class: 'block-fill-block' }, page);
    const outline = svg('g', { class: 'block-fill-outline' }, g);
    frames.push([outline, 'fade']);
    (b.media || []).forEach((d) => svg('path', { d, class: 'block-fill-media' }, outline));
    b.outline.forEach((d) => svg('path', { d }, outline));
    const words = svg('g', { class: 'block-fill-words' }, g);
    const text = b.text.map(([d, delay, head]) => ({
      el: svg('path', { d, pathLength: 1, class: head ? 'is-head' : null }, words),
      delay,
    }));
    // the stream: from the paragraph's middle on the brief's edge, an S through the disc's
    // column (its midpoint), to the block's left edge
    const yb = paras[i].y;
    const ye = b.entry;
    const d = `M132 ${yb}C172 ${yb} 180 ${ye} 220 ${ye}`;
    return {
      g,
      outline,
      words,
      text,
      para: paras[i].g,
      route: svg('path', { d, pathLength: 1, class: 'block-fill-route' }, streams),
      flow: svg('path', { d, pathLength: 1, class: 'block-fill-flow' }, streams),
      y: (yb + ye) / 2,
      start: S0 + i * BEAT,
    };
  });
  const intro = [...frames, ...lines];

  // AI: the accent disc and its halo
  const actor = svg('g', {}, root);
  const halo = svg('circle', { r: 13, class: 'block-fill-halo' }, actor);
  svg('circle', { r: 6.5, class: 'block-fill-disc' }, actor);

  // callouts
  const marks = svg('g', {}, root);
  CALLOUTS.forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    if (!place(part, lx, ly, 500, align)) return;
    add(intro, `M${px} ${py}L${ex} ${ey}`, 'block-fill-leader', marks);
    add(intro, `M${px} ${py}h0`, 'block-fill-pin', marks, 'fade');
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
  const stagger = Math.min(0.04, 0.5 / intro.length);
  const { y: restY } = blocks[1];

  function frame(t) {
    intro.forEach(([el, kind], i) => {
      const p = arrive(span(t, i * stagger, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });

    // the disc arrives at the first stream, glides to each next one, then rests mid-way
    let { y } = blocks[0];
    blocks.forEach((b, i) => {
      if (i) y += (b.y - blocks[i - 1].y) * travel(span(t, b.start - 0.5, 0.5));
    });
    y += (restY - blocks[2].y) * travel(span(t, REST, 0.9));
    const show = snap(span(t, 0.95, 0.26));
    set(actor, 'transform', `translate(${DX}px, ${y.toFixed(2)}px) scale(${show.toFixed(3)})`);
    halo.setAttribute('r', (13 + 1.4 * breath(t, 4.3)).toFixed(2));

    // each beat: the stream draws on, lines flow along it, the outline turns solid, the text
    // writes in in the accent and settles to ink, and the stream leaves
    blocks.forEach((b) => {
      const s = b.start;
      // the stream stays as a faint thread: the record of where the words went
      dash(b.route, travel(span(t, s, 0.45)), 0.5 - 0.34 * leave(span(t, s + 1.35, 0.5)));
      const flow = span(t, s + 0.3, 0.2) * (1 - span(t, s + 1.2, 0.3));
      set(b.flow, 'opacity', flow.toFixed(3));
      if (flow > 0) set(b.flow, 'stroke-dashoffset', (-((t * 0.9) % 0.1)).toFixed(4));
      const solid = arrive(span(t, s + 0.35, 0.4));
      set(b.g, '--bf-solid', solid.toFixed(3));
      set(b.outline, 'stroke-dasharray', `5 ${(4 * (1 - solid)).toFixed(2)}`);
      b.text.forEach(({ el, delay }) => dash(el, arrive(span(t, s + 0.4 + delay, 0.34))));
      set(b.words, '--bf-mix', `${(100 * (1 - arrive(span(t, s + 1.4, 0.7)))).toFixed(1)}%`);
      const read = arrive(span(t, s, 0.3)) * (1 - 0.6 * arrive(span(t, s + 1.3, 0.5)));
      set(b.para, '--bf-read', read.toFixed(3));
    });

    // ambient: the wash comes up with the construction and breathes 2% over 7.3 s
    set(wash, 'opacity', (arrive(span(t, 0, 1.2)) * (0.98 + 0.02 * breath(t, 7.3))).toFixed(3));
  }

  loop(stage, frame, { still: STILL });
}
