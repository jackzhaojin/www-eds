/**
 * Scene engine `rule-check`: the Sites and AI webinar deck, slide "03 - Three kinds of checks:
 * Human, deterministic and agentic", its second card "Deterministic checks" (an offer plate,
 * one of three in a row with `human-check` and `agent-check`, which share its page).
 *
 * What it shows: one page run through the same five rules twice. The rules (title length, one
 * h1, structured data, links, alt text) are five automation squares (the faint rounded square)
 * in a fixed column beside the page, each on the row of the page it reads. A run fires them top
 * to bottom on a fixed beat: the row of the page lights, a wire runs to its square, the square
 * presses, and the result prints on a narrow strip, an ink tick for a pass and an ink cross for
 * a fail. The first strip slides out to the right, into its slot; a fresh strip prints the
 * second run, beat for beat. The two strips end side by side and are compared row against row:
 * line for line the same, so an accent "=" draws between them.
 *
 * Motion is mechanical on purpose (automation's plate): every beat is linear and the same length,
 * and both runs are drawn by one function of the time since their run began, so the second run
 * repeats the first exactly. The accent is only the "=" and the wash under the strips.
 *
 * Story (played once from t = 0): construction draws on 0 to 0.8 s; run 1 from 1 s, a beat every
 * 0.4 s; its strip slides out 3.3 to 4.1 s while a fresh one draws on; run 2 from 4.4 s; a
 * hairline joins each row of the two strips in turn from 6.5 s; the "=" draws at 6.95 s; settled
 * by about 7.4 s. Then it holds: the wash breathes and drifts. Reduced motion shows that end state.
 *
 * Parts (rows):
 * - `rules`: under the column of squares, centered; a leader up to the last square.
 * - `runs`: over the two strips, centered; a leader down to a bracket across both strips.
 */
const W = 500;
const PAGE = {
  x: 52, y: 96, w: 184, h: 304,
}; // the page, as the slide's other two cards draw it
const ROWS = [140, 196, 252, 308, 364]; // the five rules, and the rows of the page they read
const SX = 266; // the column of rules
const SQ = 16;
const STRIP = { w: 46, y: 116, h: 272 };
const AX = 292; // the strip being printed
const SLIDE = 104; // to the slot where the first run's strip rests (x 396)
const EQ = AX + STRIP.w + (SLIDE - STRIP.w) / 2; // the "=", centered in the gap
const MARK = 14; // a mark's center on its strip; its printed line follows
const PASS = [true, false, true, true, false]; // one h1 and alt text fail
const BEAT = 0.4;
const RUN = [1, 4.4]; // when each run fires its first rule
const EJECT = 3.3; // the first strip slides to its slot
const EJECT_D = 0.8;
const FRESH = 3.72; // the second strip draws on
const COMPARE = 6.5; // the strips compared row against row
const EQUALS = 6.95;
const STILL = 9;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
const arrive = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // (0.16, 1, 0.3, 1), for the intro
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
/** A motor's move: speed ramps up over the first fifth, holds, ramps down over the last. */
const trapezoid = (u) => {
  const a = 0.2;
  const v = 1 / (1 - a);
  if (u < a) return (v * u * u) / (2 * a);
  if (u > 1 - a) return 1 - (v * (1 - u) ** 2) / (2 * a);
  return v * (u - a / 2);
};
const f2 = (v) => v.toFixed(2);

/* the page's lines: [row (-1 for none), path, weight, opacity, kind] */
const ART = [
  [-1, 'M66 109H98', 1.25, 0.4],
  [-1, 'M206 109h0.1M214 109h0.1M222 109h0.1', 2.6, 0.4],
  [-1, `M${PAGE.x} 120H${PAGE.x + PAGE.w}`, 0.75, 0.3],
  // 0: the title, and its length measured under it
  [0, 'M70 140H168', 2.2, 0.8],
  [0, 'M70 149.5V154.5M168 149.5V154.5M70 152H168', 0.75, 0.42],
  // 1: the h1 and a paragraph
  [1, 'M70 186H150', 2.5, 0.75],
  [1, 'M70 199H214M70 207H186', 1.25, 0.38],
  // 2: structured data, an indented block in a tint
  [2, 'M70 234H218V270H70Z', 0.9, 0.4, 'tint'],
  [2, 'M80 244H122M90 252H170M90 260H144', 1.25, 0.45],
  // 3: text with a link in it
  [3, 'M70 296H212M70 320H174M70 308H110M158 308H198', 1.25, 0.38],
  [3, 'M116 308H152', 1.75, 0.75],
  [3, 'M116 313H152', 0.9, 0.5, 'dots'],
  // 4: an image beside its caption
  [4, 'M70 342H138V386H70Z', 1, 0.55],
  [4, 'M73.5 382L90 366L101 375L110 368L134.5 383', 0.9, 0.5],
  [4, 'M150 352H214M150 362H198M150 372H206', 1.25, 0.38],
];

const TICK = (y) => `M${MARK - 6} ${y + 0.5}L${MARK - 2} ${y + 4.5}L${MARK + 6} ${y - 4.5}`;
const CROSS = (y) => `M${MARK - 4.5} ${y - 4.5}L${MARK + 4.5} ${y + 4.5}M${MARK + 4.5} ${y - 4.5}L${MARK - 4.5} ${y + 4.5}`;

export default function engine(block, kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `rule-check-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'rule-check-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'rule-check-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'rule-check-wash-stop is-end' }, grad);

  const intro = []; // [element, 'draw' | 'fade', delay]
  const add = (name, attrs, parent, kind, delay) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind, delay]);
    return el;
  };
  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const front = svg('g', {}, root);
  const wash = svg('circle', {
    cx: EQ - 30, cy: 252, r: 156, fill: `url(#${id}-wash)`,
  }, back);

  // construction: the rail through the rules, the wires along each row, the second strip's slot
  add('path', { d: `M${SX} ${ROWS[0] - 14}V${ROWS[4] + 14}`, class: 'rule-check-c', pathLength: 1 }, back, 'draw', 0.2);
  const slot = svg('rect', {
    x: AX + SLIDE, y: STRIP.y, width: STRIP.w, height: STRIP.h, rx: 4, class: 'rule-check-c rule-check-slot',
  }, back);
  ROWS.forEach((y, i) => {
    add('path', { d: `M${PAGE.x + PAGE.w} ${y}H${SX - SQ / 2 - 2}M${SX + SQ / 2 + 2} ${y}H${AX}`, class: 'rule-check-c', pathLength: 1 }, back, 'draw', 0.25 + i * 0.04);
  });

  // the page: paper, a band per row (lit while its rule reads it), then its lines
  const page = svg('g', {}, mech);
  add('rect', {
    x: PAGE.x, y: PAGE.y, width: PAGE.w, height: PAGE.h, rx: 4, class: 'rule-check-paper', pathLength: 1,
  }, page, 'draw', 0);
  const bands = ROWS.map((y) => svg('rect', {
    x: PAGE.x + 6, y: y - 23, width: PAGE.w - 12, height: 46, rx: 3, class: 'rule-check-band',
  }, page));
  const lines = svg('g', { class: 'rule-check-lines' }, page);
  ART.forEach(([row, d, w, o, kind], k) => {
    add('path', {
      d, style: `--w: ${w}`, 'stroke-opacity': o, class: kind ? `rule-check-${kind}` : null,
    }, lines, 'fade', 0.12 + (row < 0 ? 0 : row) * 0.05 + k * 0.004);
  });

  // the rules: five automation squares, and the lit wires in and out of each
  const rules = ROWS.map((y, i) => {
    const wire = svg('path', { d: `M${PAGE.x + PAGE.w} ${y}H${SX - SQ / 2 - 2}`, class: 'rule-check-wire', pathLength: 1 }, mech);
    const out = svg('path', { d: `M${SX + SQ / 2 + 2} ${y}H${AX}`, class: 'rule-check-wire', pathLength: 1 }, mech);
    const sq = add('rect', {
      x: SX - SQ / 2, y: y - SQ / 2, width: SQ, height: SQ, rx: 3.5, class: 'rule-check-auto',
    }, mech, 'fade', 0.3 + i * 0.06);
    return {
      y, wire, out, sq,
    };
  });

  // the strips: a frame, a pending dot per row, and the mark and line it prints there
  const strip = (parent, introDelay) => {
    const g = svg('g', { class: 'rule-check-strip' }, parent);
    const frame = svg('rect', {
      x: 0, y: STRIP.y, width: STRIP.w, height: STRIP.h, rx: 4, class: 'rule-check-frame', pathLength: 1,
    }, g);
    if (introDelay != null) intro.push([frame, 'draw', introDelay]);
    const cells = ROWS.map((y, i) => ({
      dot: svg('circle', {
        cx: MARK, cy: y, r: 1.7, class: 'rule-check-dot',
      }, g),
      mark: svg('path', { d: PASS[i] ? TICK(y) : CROSS(y), class: `rule-check-mark${PASS[i] ? '' : ' is-fail'}`, pathLength: 1 }, g),
      line: svg('path', { d: `M${MARK + 12} ${y}H${STRIP.w - 8}`, class: 'rule-check-printed', pathLength: 1 }, g),
    }));
    return { g, frame, cells };
  };
  const strips = [strip(mech, 0.35), strip(mech)];
  strips[1].g.setAttribute('transform', `translate(${AX} 0)`);

  // the result: a hairline across the gap for each row compared, then an accent "=" between
  const compares = ROWS.map((y) => svg('path', { d: `M${AX + STRIP.w + 4} ${y}H${AX + SLIDE - 4}`, class: 'rule-check-compare', pathLength: 1 }, front));
  const equals = [-6.5, 6.5].map((dy) => svg('path', { d: `M${EQ - 10} ${252 + dy}H${EQ + 10}`, class: 'rule-check-equals', pathLength: 1 }, front));

  // callouts: [part, label x, label y, align, leader, pin y, extra path]
  const BR = 100; // the bracket over both strips
  [
    ['runs', EQ, 62, 'center', `M${EQ} 80V${BR - 3}`, BR, `M${AX + STRIP.w / 2} ${BR + 7}V${BR}H${AX + SLIDE + STRIP.w / 2}V${BR + 7}`],
    ['rules', SX, 424, 'center', `M${SX} ${ROWS[4] + 17}V407`, ROWS[4] + 13],
  ].forEach(([part, x, y, align, leader, pinY, extra]) => {
    if (!place(part, x, y, W, align)) return;
    if (extra) add('path', { d: extra, class: 'rule-check-leader', pathLength: 1 }, front, 'draw', 0.4);
    add('path', { d: leader, class: 'rule-check-leader', pathLength: 1 }, front, 'draw', 0.5);
    add('circle', {
      cx: x, cy: pinY, r: 1.8, class: 'rule-check-pin',
    }, front, 'fade', 0.6);
  });

  stage.append(root);
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (w) root.style.setProperty('--k', (W / w).toFixed(3));
  }).observe(stage);

  const set = (el, prop, v) => {
    const s = typeof v === 'number' ? v.toFixed(3) : v;
    if (el[`_${prop}`] !== s) {
      el[`_${prop}`] = s;
      el.style.setProperty(prop, s);
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
    set(el, 'opacity', p > 0.0005 && o > 0.001 ? o : 0);
  };

  function draw(t) {
    // construction
    intro.forEach(([el, kind, delay]) => {
      const p = arrive(span(t, delay, 0.5));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p);
    });

    // the two runs: one beat per rule, the same linear beat both times
    rules.forEach(({
      y, wire, out, sq,
    }, i) => {
      const us = RUN.map((r) => t - r - i * BEAT);
      const u = us[1] >= 0 ? us[1] : us[0]; // the run under way (they never overlap)
      const lit = 1 - span(u, 0.3, 0.12);
      set(bands[i], 'opacity', span(u, 0, 0.06) * (1 - span(u, 0.3, 0.14)));
      dash(wire, span(u, 0, 0.1), lit);
      dash(out, span(u, 0.12, 0.08), lit);
      const fire = span(u, 0.08, 0.06) * (1 - span(u, 0.3, 0.16));
      set(sq, '--f', fire);
      const s = 1 - 0.1 * fire;
      attr(sq, 'transform', `translate(${SX} ${y}) scale(${s.toFixed(3)}) translate(${-SX} ${-y})`);
      strips.forEach(({ cells }, r) => {
        const { dot, mark, line } = cells[i];
        const p = span(us[r], 0.2, 0.12);
        dash(mark, p);
        dash(line, span(us[r], 0.28, 0.1));
        const shown = r
          ? span(t, FRESH + 0.2 + 0.04 * i, 0.2)
          : arrive(span(t, 0.45 + 0.04 * i, 0.5));
        set(dot, 'opacity', shown * (1 - clamp(p * 4)));
      });
    });

    // the first strip slides to its slot; a fresh one draws on where it was printed
    attr(strips[0].g, 'transform', `translate(${f2(AX + SLIDE * trapezoid(span(t, EJECT, EJECT_D)))} 0)`);
    set(slot, 'opacity', arrive(span(t, 0.3, 0.5)) * (1 - span(t, EJECT + EJECT_D - 0.1, 0.15)));
    dash(strips[1].frame, span(t, FRESH, 0.4));

    // the same result: each row compared across the gap, then the "=", and the wash comes up
    compares.forEach((line, i) => {
      const u = t - COMPARE - 0.1 * i;
      dash(line, span(u, 0, 0.1), 1 - span(u, 0.25, 0.2));
    });
    equals.forEach((bar, k) => dash(bar, span(t, EQUALS + 0.09 * k, 0.18)));
    set(wash, 'opacity', (0.55 + 0.45 * span(t, EQUALS, 0.8)) * (0.98 + 0.02 * breath(t, 17)));
    attr(wash, 'cx', f2(EQ - 30 + 6 * Math.sin((2 * Math.PI * t) / 23)));
    attr(wash, 'cy', f2(252 + 5 * Math.sin((2 * Math.PI * t) / 31)));
  }

  loop(stage, draw, { still: STILL });
}
