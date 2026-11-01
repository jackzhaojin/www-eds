/**
 * Scene engine `agent-check`: the Sites and AI webinar deck, slide "03 - Three kinds of checks",
 * the third offer card "Agentic checks" (beside `human-check` and `rule-check`).
 *
 * What it shows: AI (the accent disc) reviewing a page with judgment, not in a fixed order. The
 * page is a card of six sections (ruled lines, never words), faint until read. The disc lands
 * mid-page and reads the body, flicks up to the headline, drops to a thin section, drifts into
 * the empty space after its one short line and hesitates there: a question mark rises. It
 * glances across to two faint competing pages (their matching section is fuller and firms as it
 * reads), comes back to the thin section for a second look, and writes a short accent note
 * beside the page. It skims down the middle, reads the thin last section, raises a second
 * question, and writes two more notes. Each jump leaves an accent trail that fades; the glance
 * across and back stays as a faint dotted loop between the pages. It ends beside a tidy list of
 * three notes, the two questions hovering where the page is thin.
 *
 * Story (played once from t = 0): construction draws on 0 to 0.8 s; the reading from 0.85 s
 * (read, glance up, hesitate, compare, revisit, write, skim) to the last note at about 8.3 s;
 * the disc settles beside the notes by about 8.8 s. Then it holds: the questions bob, the halo
 * and the wash breathe. Reduced motion shows that end state.
 *
 * Parts (rows):
 * - `page`: over the page, top left; a leader down to its top edge.
 * - `notes`: over the notes list, right of the page; a leader down to the first note's bullet.
 * - `questions`: under the page, its leader up through the page's foot to the lower question.
 *   It arrives with that question.
 */
const W = 500;
const PX = 52; // the page
const PY = 96;
const PW = 184;
const PH = 304;
const RIVALS = [284, 372]; // the competing pages' left edges (top PY), drawn at RS
const RS = 0.42;
const NX = 290; // the notes: bullets, then a line and a shorter second line each
const NOTES = [[300, 100, 64], [328, 80, 86], [356, 112, 50]]; // [y, line, second line]
const REST = [262, 328];
const STILL = 11;

/* the page's sections on its own grid: [path, weight, opacity, kind]; `full` is what the
   competing pages have where this page is thin (sections 3 and 6) */
const SECTIONS = [
  [['M12 14H34M156 14h2M162 14h2M168 14h2', 1, 0.45]],
  [['M12 36H118', 2.4, 0.85], ['M12 48H150', 0.9, 0.45]],
  [['M12 70H170M12 80H164M12 90H168M12 100H118', 1.1, 0.55]],
  [['M12 122H92', 1.7, 0.75], ['M12 135H64', 1.1, 0.55]],
  [['M12 150H92V192H12Z', 0.9, 0.45, 'tint'], ['M16 188L36 171L48 180L58 173L88 189', 0.9, 0.5],
    ['M102 156H172M102 166H166M102 176H170M102 186H138', 1, 0.5]],
  [['M12 212H84', 1.7, 0.75], ['M16 226h0.1M16 238h0.1M16 250h0.1', 2.8, 0.65],
    ['M26 226H150M26 238H136M26 250H160', 1, 0.5]],
  [['M12 274H80', 1.7, 0.75], ['M12 287H52', 1.1, 0.55]],
];
const FULL = { 3: 'M12 135H160M12 144H128', 6: 'M12 287H158M12 296H120' };

/* where the disc goes: [kind, to, seconds, what it touches]. read, skim and write move straight
   and steady; drift slows to a stop (a hesitation); a jump arcs (bow: the curve's side) */
const ab = (lx, ly) => [PX + lx, PY + ly];
const rv = (k, lx, ly) => [RIVALS[k] + RS * lx, PY + RS * ly];
const PATH = [
  ['read', ab(94, 70), 0.5, { sec: 2 }],
  ['jump', ab(12, 36), 0.28, { bow: -1 }],
  ['read', ab(70, 36), 0.28, { sec: 1 }],
  ['jump', ab(12, 135), 0.36, { bow: -1 }],
  ['read', ab(62, 135), 0.3, { sec: 3 }],
  ['drift', ab(96, 135), 0.42, { q: 0 }],
  ['hold', null, 0.18],
  ['jump', rv(0, 12, 135), 0.42, { bow: 1, glance: true }],
  ['read', rv(0, 80, 135), 0.24, { rival: 0 }],
  ['jump', rv(1, 12, 135), 0.22, { bow: 1 }],
  ['read', rv(1, 80, 135), 0.24, { rival: 1 }],
  ['jump', ab(44, 135), 0.44, { bow: 0.6, glance: true }],
  ['hold', null, 0.16],
  ['jump', [NX + 10, NOTES[0][0]], 0.32, { bow: -1 }],
  ['write', [NX + 10 + NOTES[0][1], NOTES[0][0]], 0.36, { note: 0 }],
  ['jump', ab(10, 158), 0.34, { bow: 1 }],
  ['skim', ab(12, 287), 0.5, { secs: [4, 5] }],
  ['read', ab(40, 287), 0.2, { sec: 6 }],
  ['drift', ab(84, 287), 0.4, { q: 1 }],
  ['hold', null, 0.14],
  ['jump', [NX + 10, NOTES[1][0]], 0.36, { bow: 1 }],
  ['write', [NX + 10 + NOTES[1][1], NOTES[1][0]], 0.3, { note: 1 }],
  ['jump', [NX + 10, NOTES[2][0]], 0.18, { bow: 0.4, quiet: true }],
  ['write', [NX + 10 + NOTES[2][1], NOTES[2][0]], 0.34, { note: 2 }],
  ['rest', REST, 0.5, { bow: 2.5 }],
];
const START = ab(12, 70);
const T0 = 0.85;
const QUESTIONS = [[170, ab(0, 139)[1], 0], [162, ab(0, 291)[1], 1]]; // [x, origin y, its drift]

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
const steady = (x) => x * x * (3 - 2 * x);
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
const bump = (u) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));
const f2 = (v) => v.toFixed(2);
const EASE = {
  read: steady, skim: steady, write: steady, drift: arrive, jump: travel, rest: arrive,
};

/* the plan in time: each step's start, end, from and to; a jump's curve and its length table */
const STEPS = [];
{
  let t = T0;
  let at = START;
  PATH.forEach(([kind, to, d, what = {}]) => {
    const end = to || at;
    const step = {
      kind, from: at, to: end, t0: t, t1: t + d, ...what,
    };
    if (what.bow) {
      const [x0, y0] = at;
      const [x1, y1] = end;
      const b = 0.2 * what.bow;
      const c = [(x0 + x1) / 2 + (y1 - y0) * b, (y0 + y1) / 2 - (x1 - x0) * b];
      const from = at;
      const pt = (u) => [0, 1].map((i) => (1 - u) ** 2 * from[i]
        + 2 * (1 - u) * u * c[i] + u * u * end[i]);
      const lut = [0];
      let prev = at;
      for (let i = 1; i <= 24; i += 1) {
        const p = pt(i / 24);
        lut.push(lut[i - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
        prev = p;
      }
      Object.assign(step, { c, pt, lut });
    }
    STEPS.push(step);
    t += d;
    at = end;
  });
}
const DONE = STEPS[STEPS.length - 1].t1;
const stepOf = (key, v) => STEPS.find((s) => s[key] === v);

/** A point on a jump's curve at p, a fraction of its length. */
function along(s, p) {
  const total = s.lut[24];
  let i = 1;
  while (i < 24 && s.lut[i] < p * total) i += 1;
  const a = s.lut[i - 1];
  const u = (i - 1 + (p * total - a) / Math.max(1e-6, s.lut[i] - a)) / 24;
  return s.pt(clamp(u));
}

/** Where the disc is at t, and how far through its step. */
function discAt(t) {
  if (t < T0) return { p: START, s: null, e: 0 };
  const s = STEPS.find((x) => t < x.t1) || STEPS[STEPS.length - 1];
  const u = span(t, s.t0, s.t1 - s.t0);
  const e = s.kind === 'hold' ? 0 : EASE[s.kind](u);
  if (s.lut) return { p: along(s, e), s, e };
  return { p: [0, 1].map((i) => s.from[i] + (s.to[i] - s.from[i]) * e), s, e };
}

export default function engine(block, kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `agent-check-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'agent-check-svg', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'agent-check-wash-stop' }, grad);
  svg('stop', { offset: '1', class: 'agent-check-wash-stop' }, grad);

  const intro = []; // [element, kind, delay]: 'draw' by dash, 'fade' by opacity
  const add = (name, attrs, parent, kind, delay) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind, delay]);
    return el;
  };
  const wash = svg('circle', {
    cx: 250, cy: 250, r: 230, fill: `url(#${id}-wash)`,
  }, root);

  /** A page's sections in a group at (x, y) and scale s; the rivals have more where it's thin. */
  const drawPage = (x, y, s, full, delay) => {
    const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})`, style: `--s: ${s}` }, root);
    add('rect', {
      x: 0, y: 0, width: PW, height: PH, rx: 4 / s, class: 'agent-check-paper', pathLength: 1,
    }, g, 'draw', delay);
    const secs = SECTIONS.map((paths, k) => {
      const sg = svg('g', { class: 'agent-check-sec' }, g);
      paths.forEach(([d, w, o, kind], i) => {
        const line = full && FULL[k] && i === paths.length - 1 ? FULL[k] : d;
        svg('path', {
          d: line, style: `--w: ${w}`, 'stroke-opacity': o, class: kind ? `is-${kind}` : null,
        }, sg);
      });
      return sg;
    });
    return { g, secs, delay };
  };
  const page = drawPage(PX, PY, 1, false, 0);
  const rivals = RIVALS.map((x, k) => drawPage(x, PY, RS, true, 0.12 + 0.08 * k));
  rivals.forEach((r) => r.g.classList.add('agent-check-rival'));

  // the notes: a pending bullet each, the accent line the disc writes, an ink second line
  const notes = NOTES.map(([y, len, sub], i) => {
    add('circle', {
      cx: NX, cy: y, r: 3, class: 'agent-check-pending',
    }, root, 'fade', 0.4 + 0.06 * i);
    const dot = svg('circle', {
      cx: NX, cy: y, r: 3, class: 'agent-check-bullet',
    }, root);
    const line = svg('path', { d: `M${NX + 10} ${y}H${NX + 10 + len}`, class: 'agent-check-note', pathLength: 1 }, root);
    const second = svg('path', { d: `M${NX + 10} ${y + 10}H${NX + 10 + sub}`, class: 'agent-check-note2', pathLength: 1 }, root);
    return {
      dot, line, second, step: stepOf('note', i),
    };
  });

  // the trail: each jump draws behind the disc, then fades; the glance across to the competing
  // pages and back stays as a dotted residue, off the page
  const clip = svg('clipPath', { id: `${id}-off` }, defs);
  svg('rect', {
    x: PX + PW + 6, y: 0, width: W, height: W,
  }, clip);
  const trails = STEPS.filter((s) => s.kind === 'jump' && !s.quiet).map((s) => {
    const d = `M${f2(s.from[0])} ${f2(s.from[1])}Q${f2(s.c[0])} ${f2(s.c[1])} ${f2(s.to[0])} ${f2(s.to[1])}`;
    return {
      s,
      el: svg('path', { d, class: 'agent-check-trail', pathLength: 1 }, root),
      keep: s.glance ? svg('path', { d, class: 'agent-check-glance', 'clip-path': `url(#${id}-off)` }, root) : null,
    };
  });

  // the questions: a drawn question mark each, rising out of the thin spot
  const questions = QUESTIONS.map(([x, y0, q]) => {
    const g = svg('g', { class: 'agent-check-q' }, root);
    svg('path', { d: 'M-4.5 -3.6A4.8 4.8 0 1 1 2.2 0.6C0.6 1.4 0 2.2 0 3.9' }, g);
    svg('path', { d: 'M0 9h0.1', class: 'is-dot' }, g);
    const s = stepOf('q', q);
    return {
      g, x, y0, t0: s.t0 + (s.t1 - s.t0) * 0.45, phase: q * 1.7,
    };
  });

  // the AI: the disc and its halo
  const halo = svg('circle', { r: 14, class: 'agent-check-halo' }, root);
  const disc = svg('circle', { r: 7, class: 'agent-check-disc' }, root);

  // callouts
  const lead = (x, y0, y1, kind, delay) => {
    const line = add('path', { d: `M${x} ${y0}V${y1}`, class: 'agent-check-leader', pathLength: 1 }, root, kind && 'draw', delay);
    const pin = add('circle', {
      cx: x, cy: y1 + (y1 > y0 ? 2 : -2), r: 1.8, class: 'agent-check-pin',
    }, root, kind && 'fade', delay + 0.1);
    return [line, pin];
  };
  if (place('page', PX, PY - 40, W, 'left')) lead(PX + 10, PY - 25, PY - 3, true, 0.45);
  if (place('notes', NX - 10, NOTES[0][0] - 48, W, 'left')) {
    add('path', { d: `M${NX} ${NOTES[0][0] - 34}V${NOTES[0][0] - 7}`, class: 'agent-check-leader', pathLength: 1 }, root, 'draw', 0.5);
  }
  const [qx, qy] = [QUESTIONS[1][0], QUESTIONS[1][1]];
  const qLabel = place('questions', qx - 10, PY + PH + 40, W, 'left');
  const qLead = qLabel ? lead(qx, PY + PH + 26, qy + 4, false, 0) : null;
  const qArrive = questions[1].t0 + 0.3;

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

  /* when each section is read: by a read or drift step, or as the skim passes it */
  const readAt = SECTIONS.map(() => 99);
  const rivalAt = RIVALS.map(() => 99);
  STEPS.forEach((s) => {
    if (s.sec != null) readAt[s.sec] = Math.min(readAt[s.sec], s.t0);
    if (s.sec === 1) readAt[0] = s.t0; // the nav bar with the headline
    if (s.rival != null) rivalAt[s.rival] = s.t0;
    (s.secs || []).forEach((k) => {
      const mid = PY + (SECTIONS[k][0][0].match(/\d+/g).map(Number)[1] + 18);
      readAt[k] = s.t0 + (s.t1 - s.t0) * span(mid, s.from[1], s.to[1] - s.from[1]);
    });
  });

  function draw(t) {
    intro.forEach(([el, kind, delay]) => {
      const p = arrive(span(t, delay, 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });

    // the page: each section faint until read, firming as the disc reads it
    const shown = arrive(span(t, 0.15, 0.7));
    page.secs.forEach((sg, k) => {
      const r = arrive(span(t, readAt[k], 0.5));
      set(sg, 'opacity', (shown * (0.32 + 0.68 * r)).toFixed(3));
    });
    rivals.forEach((rival, k) => {
      const seen = arrive(span(t, rivalAt[k], 0.4));
      rival.secs.forEach((sg, j) => {
        const lift = j === 3 ? seen : 0;
        set(sg, 'opacity', (arrive(span(t, rival.delay + 0.2, 0.7)) * (0.3 + 0.7 * lift)).toFixed(3));
      });
    });

    // the disc
    const { p: [dx, dy], s } = discAt(t);
    const on = arrive(span(t, 0.55, 0.45));
    attr(disc, 'cx', f2(dx));
    attr(disc, 'cy', f2(dy));
    attr(halo, 'cx', f2(dx));
    attr(halo, 'cy', f2(dy));
    set(disc, 'opacity', on.toFixed(3));
    set(halo, 'opacity', on.toFixed(3));
    // it weighs a thing up where it hesitates: the halo swells; at rest it breathes
    let think = 0;
    STEPS.forEach((x) => { if (x.kind === 'hold') think += bump(span(t, x.t0 - 0.1, x.t1 - x.t0 + 0.3)); });
    attr(disc, 'r', f2(7 * (0.7 + 0.3 * on)));
    attr(halo, 'r', f2(14 + 4 * think + 1.8 * breath(t - DONE, 3.4) * span(t, DONE, 1)));

    // the trail: a jump draws behind the disc and fades over a second
    trails.forEach(({ s: j, el, keep }) => {
      const p = t < j.t0 ? 0 : EASE.jump(span(t, j.t0, j.t1 - j.t0));
      dash(el, p, 0.55 * (1 - span(t, j.t1, 1.1)));
      if (keep) set(keep, 'opacity', arrive(span(t, j.t1 + 0.2, 1)).toFixed(3));
    });

    // the questions: rise out of the thin spot, pop, then hover
    questions.forEach((q) => {
      const u = span(t, q.t0, 0.7);
      const bob = 1.6 * Math.sin((2 * Math.PI * t) / 3.9 + q.phase) * span(t, q.t0 + 0.7, 1);
      const y = q.y0 - 15 * arrive(u) + bob;
      const sc = 0.45 + 0.55 * snap(span(t, q.t0, 0.32));
      attr(q.g, 'transform', `translate(${q.x} ${f2(y)}) scale(${f2(sc)})`);
      set(q.g, 'opacity', clamp(u * 3).toFixed(3));
    });
    if (qLabel) {
      const a = arrive(span(t, qArrive, 0.6));
      set(qLabel, 'opacity', a.toFixed(3));
      dash(qLead[0], a);
      set(qLead[1], 'opacity', a.toFixed(3));
    }

    // the notes: the bullet fills as the disc starts the line, the line follows the disc
    notes.forEach((n) => {
      const { step } = n;
      const pop = snap(span(t, step.t0 - 0.06, 0.24));
      attr(n.dot, 'r', f2(3 * Math.max(0, pop)));
      set(n.dot, 'opacity', pop > 0.001 ? '1' : '0');
      let p = 0;
      if (t >= step.t1) p = 1;
      else if (s === step) p = clamp((dx - step.from[0]) / (step.to[0] - step.from[0]));
      dash(n.line, p);
      dash(n.second, arrive(span(t, step.t1 - 0.05, 0.4)));
    });

    // ambient: the wash breathes (2%) over 17 s
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
  }

  loop(stage, draw, { still: STILL });
}
