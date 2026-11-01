/**
 * Scene engine `intent-match`: the webinar deck's stage 03 offer card "Does it still match the
 * brief?" (evaluating a page before it goes live).
 *
 * What it shows: the brief and the page side by side. The brief is five questions (a question
 * mark and a ruled line each, never words); the page is four sections in its own order (a hero,
 * a text block, two columns, a list). The AI (the accent disc) steps down the brief's edge and,
 * from each question, draws a curve to the section that answers it: an accent head runs the
 * curve, the line it leaves is ink, and the section firms up as the curve lands. The last
 * question finds nothing: its line goes out dashed, slows and stops halfway across, the row
 * turns accent, and a caret blinks where an answer should be.
 *
 * Story (played once from t = 0): construction draws on 0 to 0.8 s; four matches, one every
 * 1.25 s from 1 s; the miss from 6 s; settled by about 7.4 s. Then it holds: the caret blinks,
 * the wash and the disc's halo breathe. Reduced motion shows that end state.
 *
 * Parts (rows):
 * - `brief`: over the left column; a leader down to the brief's top edge.
 * - `page`: over the right column; a leader down to the page's top edge.
 * - `missing`: under the unanswered question's dashed line, between the columns; a leader up
 *   to the line. It arrives, in the accent, when the miss is found.
 */
const W = 500;
const TOP = 108; // both cards
const BOTTOM = 380;
const BX = 52; // the brief
const BW = 146;
const PX = 302; // the page
const PW = 146;
const RAIL = 212; // the disc's rail, just off the brief's edge
const QY = [162, 208, 254, 300, 346]; // the questions
const QLEN = [84, 62, 90, 70, 78];
const SECTIONS = [[132, 180], [192, 240], [252, 304], [316, 364]]; // top and bottom of each
const MATCH = [1, 3, 0, 2, -1]; // the section that answers each question (-1: none)
const MISS = 4;
const STUB = 50; // how far the unanswered line gets
const START = 1.05;
const STEP = 1.25;
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
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const f2 = (v) => v.toFixed(2);

/* the story's clock: question i is read from QT[i]; its curve draws from QT[i] + 0.12 */
const QT = QY.map((_, i) => START + STEP * i);
const DRAW = 0.72;
const LAND = (i) => QT[i] + 0.12 + DRAW;
const MISSED = QT[MISS] + 0.12 + 0.75 + 0.3; // the stub has stopped; the row turns
const midY = (s) => (SECTIONS[s][0] + SECTIONS[s][1]) / 2;

/* each section's content on the page, at its own top: [path, weight, opacity, kind] */
const CONTENT = [
  [['M0 0H126V48H0Z', 0.9, 0.4, 'tint'], ['M10 17H78', 2.2, 0.8], ['M10 26H96', 0.9, 0.42], ['M10 37H40', 1.6, 0.6]],
  [['M8 9H70', 1.5, 0.7], ['M8 21H118M8 29H112M8 37H92', 0.9, 0.4]],
  [['M8 8H58V30H8Z', 1, 0.5], ['M68 8H118V30H68Z', 1, 0.5], ['M8 40H50M68 40H112', 0.9, 0.4]],
  [['M12 12h0.1M12 25h0.1M12 38h0.1', 3, 0.6], ['M20 12H96M20 25H110M20 38H84', 0.9, 0.42]],
];

export default function engine(block, kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `intent-match-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'intent-match-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'intent-match-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'intent-match-wash-stop' }, grad);

  const intro = []; // [element, kind, delay]: 'draw' by dash, 'fade' by opacity
  const add = (name, attrs, parent, kind, delay) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind, delay]);
    return el;
  };
  const wash = svg('circle', {
    cx: (RAIL + PX) / 2, cy: 256, r: 200, fill: `url(#${id}-wash)`,
  }, root);

  // the brief: a card, its title, and five questions
  const brief = svg('g', {}, root);
  add('rect', {
    x: BX, y: TOP, width: BW, height: BOTTOM - TOP, rx: 4, class: 'intent-match-s', pathLength: 1,
  }, brief, 'draw', 0);
  add('path', { d: `M${BX + 16} 130H${BX + 84}`, class: 'intent-match-ink is-title', pathLength: 1 }, brief, 'draw', 0.1);
  add('path', { d: `M${BX + 16} 140.5H${BX + 120}`, class: 'intent-match-ink is-thin', pathLength: 1 }, brief, 'draw', 0.15);
  const questions = QY.map((y, i) => {
    const wrap = add('g', { transform: `translate(${BX + 20} ${y})` }, brief, 'fade', 0.2 + i * 0.07);
    const mark = svg('g', { class: 'intent-match-q' }, wrap);
    svg('path', { d: 'M-3.2 -2.6A3.4 3.4 0 1 1 1.6 0.4C0.4 1 0 1.6 0 2.8' }, mark);
    svg('path', { d: 'M0 6.4h0.1', class: 'is-dot' }, mark);
    const line = add('path', { d: `M${BX + 34} ${y}H${BX + 34 + QLEN[i]}`, class: 'intent-match-ink', pathLength: 1 }, brief, 'draw', 0.24 + i * 0.07);
    return { mark, line };
  });

  // the page: a card, its bar, and four sections, each drawn on its own grid
  const page = svg('g', {}, root);
  add('rect', {
    x: PX, y: TOP, width: PW, height: BOTTOM - TOP, rx: 4, class: 'intent-match-s', pathLength: 1,
  }, page, 'draw', 0.05);
  add('path', { d: `M${PX + 10} 120H${PX + 30}M${PX + 118} 120h2M${PX + 124} 120h2M${PX + 130} 120h2`, class: 'intent-match-ink is-thin' }, page, 'fade', 0.2);
  const sections = SECTIONS.map(([y0, y1], s) => {
    const g = add('g', { transform: `translate(${PX + 10} ${y0})` }, page, 'fade', 0.25 + s * 0.08);
    const frame = svg('rect', {
      x: -4, y: -4, width: 134, height: y1 - y0 + 8, rx: 3, class: 'intent-match-frame',
    }, g);
    CONTENT[s].forEach(([d, w, o, kind]) => {
      svg('path', {
        d, style: `--w: ${w}`, 'stroke-opacity': o, class: kind ? `is-${kind}` : null,
      }, g);
    });
    return { frame };
  });

  // the curves: from each question at the rail to its section's edge; a head runs each one
  const links = svg('g', {}, root);
  const curves = QY.map((y, i) => {
    if (MATCH[i] < 0) return null;
    const ys = midY(MATCH[i]);
    const d = `M${BX + BW} ${y}C${RAIL + 40} ${y} ${PX - 52} ${ys} ${PX - 4} ${ys}`;
    return {
      line: svg('path', { d, class: 'intent-match-curve', pathLength: 1 }, links),
      head: svg('path', { d, class: 'intent-match-head', pathLength: 1 }, links),
      end: svg('circle', {
        cx: PX - 4, cy: ys, r: 2.4, class: 'intent-match-end',
      }, links),
    };
  });
  const my = QY[MISS];
  const stub = svg('path', { d: `M${BX + BW} ${my}H${RAIL + STUB}`, class: 'intent-match-stub' }, links);
  const stubClip = svg('clipPath', { id: `${id}-stub` }, defs);
  const stubRect = svg('rect', {
    x: BX + BW - 2, y: my - 4, width: 0, height: 8,
  }, stubClip);
  stub.setAttribute('clip-path', `url(#${id}-stub)`);
  const caret = svg('path', { d: `M${RAIL + STUB + 6} ${my - 7}V${my + 7}`, class: 'intent-match-caret' }, links);

  // the AI: a disc and its halo on the rail
  const halo = svg('circle', { cx: RAIL, r: 12.5, class: 'intent-match-halo' }, root);
  const disc = svg('circle', { cx: RAIL, r: 6.2, class: 'intent-match-disc' }, root);

  // callouts
  const lead = (x0, y0, x1, y1, delay) => {
    add('path', { d: `M${x0} ${y0}L${x1} ${y1}`, class: 'intent-match-leader', pathLength: 1 }, root, 'draw', delay);
    add('circle', {
      cx: x1, cy: y1, r: 1.8, class: 'intent-match-pin',
    }, root, 'fade', delay + 0.1);
  };
  if (place('brief', BX, TOP - 44, W, 'left')) lead(BX + 10, TOP - 26, BX + 10, TOP - 3, 0.5);
  if (place('page', PX, TOP - 44, W, 'left')) lead(PX + 10, TOP - 26, PX + 10, TOP - 3, 0.55);
  const sx = RAIL + STUB / 2;
  const missing = place('missing', sx, BOTTOM + 40, W, 'center');
  const missLead = missing ? svg('path', { d: `M${sx} ${my + 8}V${BOTTOM + 25}`, class: 'intent-match-leader', pathLength: 1 }, root) : null;
  const missPin = missing ? svg('circle', {
    cx: sx, cy: my + 8, r: 1.8, class: 'intent-match-pin',
  }, root) : null;

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
  const toggle = (el, cls, on) => {
    if (el && el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
  };
  /* a partial stroke of a pathLength="1" path; hidden at 0, where round caps leave a dot */
  const dash = (el, p, o = 1) => {
    set(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
    set(el, 'opacity', p > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };

  /** The disc's height: it reads each question, then steps to the next as the curve lands. */
  function discY(t) {
    let i = 0;
    while (i < MISS && t >= LAND(i) + 0.05) i += 1;
    if (i === 0 || t >= QT[i]) return QY[i];
    const from = LAND(i - 1) + 0.05;
    return QY[i - 1] + (QY[i] - QY[i - 1]) * travel(span(t, from, QT[i] - from));
  }

  function draw(t) {
    intro.forEach(([el, kind, delay]) => {
      const p = arrive(span(t, delay, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });
    if (missing) { // the miss's callout arrives with the miss
      const shown = arrive(span(t, MISSED, 0.6));
      dash(missLead, shown);
      set(missPin, 'opacity', shown.toFixed(3));
      set(missing, 'opacity', shown.toFixed(3));
    }

    // each match: the head runs the curve, ink behind it; the section firms as it lands
    curves.forEach((c, i) => {
      if (!c) return;
      const p = travel(span(t, QT[i] + 0.12, DRAW));
      dash(c.line, p);
      const hl = Math.min(p, 0.12);
      dash(c.head, hl, 1 - span(t, LAND(i), 0.35));
      set(c.head, 'stroke-dashoffset', (hl - p).toFixed(4));
      const land = span(t, LAND(i) - 0.02, 0.26);
      attr(c.end, 'r', f2(2.4 * snap(land)));
      const s = sections[MATCH[i]];
      set(s.frame, 'stroke-opacity', (0.22 + 0.4 * arrive(land)).toFixed(3));
      toggle(questions[i].line, 'is-answered', t >= QT[i] + 0.1);
      toggle(questions[i].mark, 'is-answered', t >= QT[i] + 0.1);
    });

    // the miss: the line goes out dashed, slows, stops; then the row turns and the caret waits
    const out = arrive(span(t, QT[MISS] + 0.12, 0.75));
    attr(stubRect, 'width', f2((RAIL + STUB - BX - BW + 4) * out));
    const missed = t >= MISSED;
    toggle(questions[MISS].mark, 'is-missed', missed);
    toggle(questions[MISS].line, 'is-missed', missed);
    toggle(missing, 'is-active', missed);
    const pop = snap(span(t, MISSED, 0.26));
    attr(questions[MISS].mark, 'transform', `scale(${f2(1 + 0.25 * Math.sin(Math.PI * clamp(pop)))})`);
    const blink = t < MISSED + 0.2 ? 0 : 1 - 0.65 * breath(t - MISSED - 0.2, 1.1);
    set(caret, 'opacity', blink.toFixed(3));

    // the AI
    const dy = discY(t);
    attr(disc, 'cy', f2(dy));
    attr(halo, 'cy', f2(dy));
    const shown = arrive(span(t, 0.5, 0.5));
    set(disc, 'opacity', shown.toFixed(3));
    set(halo, 'opacity', shown.toFixed(3));
    attr(halo, 'r', f2(12.5 + 1.5 * breath(t, 3.1) * span(t, MISSED, 1)));

    // ambient: the wash breathes (2%) over 17 s
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
  }

  loop(stage, draw, { still: STILL });
}
