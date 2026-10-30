/**
 * Scene engine `stage`: a talk, for the talks gallery's cards (blocks/row-list, talks) when the
 * talk has no project of its own to show. The gallery builds the block (no page authors it),
 * with `data-layout` from the talk's kind and `data-seed` from its place in the list, so two
 * talks of one kind still draw differently.
 *
 * What it shows: a voice reaching a room. Slides advance on the screen, the speaker's voice
 * goes out in arcs, and a seat lights as each arc reaches it (the idea landing).
 * - `stage` (a presentation): the speaker at a lectern, stage left, under a screen.
 * - `panel` (a fireside or panel): four chairs on the stage; the voice passes from chair to
 *   chair, the hand-off carried across by a dot.
 * - `lecture` (a lecture or class): the lectern and a board, then questions: hands go up and
 *   each gets its answer, drawn from the lectern to the seat.
 *
 * Parts: none. A card's media is decoration, so the scene places no labels; its `label` row
 * (the talk's title) names the stage.
 *
 * Cycle 10 s: three slides (two on a panel's screen), arcs in phrases between slide changes;
 * the panel's turns are 2.5 s each; the lecture's questions come from 6 s. Reduced motion and
 * the paused thumbnail show a designed moment mid-talk.
 */
const T = 10;
const LIFE = 2.4; // an arc's life (s)
const STILL = { stage: 4.6, panel: 3.5, lecture: 7.2 };

const clamp = (v) => Math.min(1, Math.max(0, v));
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
const span = (s, a, d, ease = arrive) => ease(clamp((s - a) / d));
/** Time since e on the loop, in 0..T. */
const since = (s, e) => (((s - e) % T) + T) % T;

/* the layouts, in a 500 square */
const LAYOUTS = {
  stage: {
    screen: [176, 60, 270, 152],
    slides: 3,
    lectern: 100,
    room: [270, [336, 368, 404, 446], [116, 146, 174, 198], [8, 9, 10, 11]],
    phrases: [0.25, 0.95, 1.65, 2.35, 3.6, 4.3, 5, 5.7, 6.95, 7.65, 8.35, 9.05],
  },
  panel: {
    screen: [172, 52, 176, 98],
    slides: 2,
    chairs: [118, 210, 302, 394],
    room: [256, [342, 374, 410, 450], [112, 142, 170, 194], [8, 9, 10, 11]],
  },
  lecture: {
    screen: [168, 56, 276, 146],
    slides: 3,
    lectern: 96,
    room: [282, [330, 366, 404, 446], [104, 134, 162, 188], [7, 8, 9, 10]],
    phrases: [0.25, 0.95, 1.65, 2.35, 3.6, 4.3, 5, 5.7],
    asks: [[1, 4, 6.1], [2, 1, 6.9], [3, 7, 7.7]], // row, seat, when the hand goes up
  },
};

export default function engine(block, kit) {
  const {
    stage, svg, loop, pointer, reduceMotion,
  } = kit;
  const kind = LAYOUTS[block.dataset.layout] ? block.dataset.layout : 'stage';
  const L = LAYOUTS[kind];
  const seed = Number(block.dataset.seed) || 1;
  const rnd = kit.random(seed * 7919 + 17);
  const id = `stage-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'stage-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const wash = svg('radialGradient', { id: `${id}-w` }, defs);
  svg('stop', { offset: '0', class: 'stage-wash-stop' }, wash);
  svg('stop', { offset: '1', class: 'stage-wash-stop stage-wash-end' }, wash);
  const layer = (cls, parent = root) => svg('g', { class: cls }, parent);
  const intro = [];
  const draw = (parent, d, cls) => {
    const el = svg('path', { d, class: cls, pathLength: 1 }, parent);
    intro.push(el);
    return el;
  };
  const set = (el, name, v) => el.setAttribute(name, typeof v === 'number' ? v.toFixed(2) : v);

  // the room: the stage's edge, two aisles, and the seats, a head and shoulders each
  const back = layer('stage-back');
  const [sx, sy, sw, sh] = L.screen;
  const washEl = svg('circle', {
    cx: kind === 'panel' ? 256 : 210, cy: 230, r: 190, fill: `url(#${id}-w)`,
  }, back);
  const [cx, rowsY, halves, counts] = L.room;
  draw(back, `M36 ${rowsY[0] - 30}H464`, 'stage-c');
  draw(back, `M${cx - 22} ${rowsY[0] - 30}L${cx - 60} 480M${cx + 22} ${rowsY[0] - 30}L${cx + 60} 480`, 'stage-c');
  const room = layer('stage-room');
  const seats = [];
  rowsY.forEach((y, row) => {
    const n = counts[row];
    const r = 2 + row * 0.38;
    const xs = Array.from({ length: n }, (_, i) => cx - halves[row]
      + (2 * halves[row] * i) / (n - 1) + (rnd() - 0.5) * 3);
    xs.filter((x) => Math.abs(x - cx) >= 18 + row * 6).forEach((x, i) => { // clear of the aisle
      const g = svg('g', { transform: `translate(${x.toFixed(1)} ${y})` }, room);
      const shoulders = `M${-r * 2.4} ${r * 3.2}Q0 ${r * 0.6} ${r * 2.4} ${r * 3.2}`;
      svg('path', { d: shoulders, class: 'stage-shoulder' }, g);
      svg('circle', { r, class: 'stage-head' }, g);
      // a listener the voice reaches: head and shoulders in the accent
      const lit = svg('g', { class: 'stage-lit', opacity: 0 }, g);
      svg('path', { d: shoulders, class: 'stage-lit-s' }, lit);
      svg('circle', { r: r + 0.5 }, lit);
      seats.push({
        g, lit, x, y, row, i, resp: 0.35 + 0.65 * rnd(), k: 0,
      });
    });
  });

  // the screen and its slides: bullets, a chart, a diagram, in an order the seed turns
  const screen = layer('stage-screen');
  draw(screen, `M${sx - 8} ${sy - 9}H${sx + sw + 8}`, 'stage-c');
  draw(screen, `M${sx} ${sy}H${sx + sw}V${sy + sh}H${sx}Z`, 'stage-s');
  const u = sh / 152; // a slide's unit
  const slideEls = [];
  const kinds = ['bullets', 'chart', 'flow'];
  for (let j = 0; j < L.slides; j += 1) {
    const g = svg('g', {}, screen);
    const parts = [svg('path', { d: `M${sx + 16} ${sy + 22 * u}h${sw * (0.34 + 0.12 * rnd())}`, class: 'stage-title' }, g)];
    let point;
    const type = kinds[(j + seed) % 3];
    if (type === 'bullets') {
      [0.62, 0.8, 0.52].forEach((w, i) => {
        const y = sy + (54 + i * 28) * u;
        parts.push(svg('path', { d: `M${sx + 20} ${y}h0.1M${sx + 32} ${y}h${(sw - 52) * w}`, class: 'stage-ink' }, g));
      });
      point = svg('path', { d: `M${sx + 32} ${sy + 82 * u}h${(sw - 52) * 0.8}`, class: 'stage-point' }, g);
    } else if (type === 'chart') {
      const base = sy + sh - 18 * u;
      const bw = (sw - 64) / 4;
      [0.32, 0.52, 0.86, 0.6].forEach((h, i) => {
        const x = sx + 24 + i * (bw + 6);
        const d = `M${x} ${base}V${base - h * 90 * u}H${x + bw}V${base}`;
        parts.push(svg('path', { d, class: i === 2 ? 'stage-ink stage-quiet' : 'stage-ink' }, g));
        if (i === 2) point = svg('path', { d, class: 'stage-point stage-bar' }, g);
      });
      parts.push(svg('path', { d: `M${sx + 18} ${base}H${sx + sw - 18}`, class: 'stage-c' }, g));
    } else {
      const y = sy + sh * 0.6;
      const bw = sw * 0.2;
      const xs = [sx + 22, sx + sw / 2 - bw / 2, sx + sw - 22 - bw];
      xs.forEach((x, i) => {
        const d = `M${x} ${y - 14 * u}h${bw}v${28 * u}h${-bw}Z`;
        parts.push(svg('path', { d, class: i === 1 ? 'stage-ink stage-quiet' : 'stage-ink' }, g));
        if (i === 1) point = svg('path', { d, class: 'stage-point' }, g);
      });
      parts.push(svg('path', { d: `M${xs[0] + bw} ${y}H${xs[1]}M${xs[1] + bw} ${y}H${xs[2]}`, class: 'stage-ink' }, g));
    }
    slideEls.push({ g, parts, point });
  }
  const dots = Array.from({ length: L.slides }, (_, j) => svg('circle', {
    cx: sx + sw / 2 + (j - (L.slides - 1) / 2) * 10, cy: sy + sh + 12, r: 1.8, class: 'stage-dot',
  }, screen));

  // the speakers: one at the lectern, or four chairs for a panel; the voice comes from a mouth
  const people = layer('stage-people');
  const speakers = [];
  const figure = (x, y, g) => {
    draw(g, `M${x - 17} ${y + 34}Q${x} ${y + 10} ${x + 17} ${y + 34}`, 'stage-s');
    const head = svg('circle', {
      cx: x, cy: y, r: 10.5, class: 'stage-speaker',
    }, g);
    return head;
  };
  if (kind === 'panel') {
    L.chairs.forEach((x, k) => {
      const y = 214 + (k === 0 || k === 3 ? 8 : 0);
      const g = svg('g', {}, people);
      draw(g, `M${x - 17} ${y + 24}Q${x} ${y + 14} ${x + 17} ${y + 24}`, 'stage-c');
      const head = figure(x, y, g);
      draw(g, `M${x - 18} ${y + 48}H${x + 18}M${x - 14} ${y + 48}L${x - 16} ${y + 74}M${x + 14} ${y + 48}L${x + 16} ${y + 74}`, 'stage-s');
      speakers.push({
        head, x, y, mouth: [x, y + 6],
      });
    });
    draw(people, 'M238 278H274M242 278V292M270 278V292', 'stage-c');
  } else {
    const x = L.lectern;
    const head = figure(x, 214, people);
    draw(people, `M${x - 28} 250H${x + 28}L${x + 20} ${rowsY[0] - 30}H${x - 20}Z`, 'stage-s');
    draw(people, `M${x + 18} 250L${x + 13} 236`, 'stage-c');
    speakers.push({
      head, x, y: 214, mouth: [x + 11, 216],
    });
  }

  // the voice: arcs from the speaking mouth toward the room
  const voice = layer('stage-voice');
  const arcs = Array.from({ length: 6 }, () => svg('path', { class: 'stage-arc', opacity: 0 }, voice));
  const handoff = svg('circle', { r: 3, class: 'stage-handoff', opacity: 0 }, voice);
  const arcPath = ([ox, oy], r, a0, a1) => {
    const p = (a) => `${(ox + r * Math.cos(a)).toFixed(1)} ${(oy + r * Math.sin(a)).toFixed(1)}`;
    return `M${p(a0)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${p(a1)}`;
  };

  // the lecture's questions: a hand at the seat, the answer drawn from the lectern
  const asks = (L.asks || []).map(([row, i, at]) => {
    const seat = seats.filter((st) => st.row === row)[i] || seats[seats.length - 1];
    const r = 2 + row * 0.38;
    const hand = svg('path', { d: `M${r * 2} ${r * 1.5}L${r * 2.8} ${-r * 5.2}`, class: 'stage-hand', opacity: 0 }, seat.g);
    const [mx, my] = speakers[0].mouth;
    const answer = svg('path', {
      d: `M${mx} ${my}Q${(mx + seat.x) / 2} ${Math.min(my, seat.y) - 70} ${seat.x} ${seat.y - r * 2}`,
      class: 'stage-answer',
      pathLength: 1,
      opacity: 0,
    }, voice);
    return {
      seat, hand, answer, at,
    };
  });

  stage.append(root);
  new ResizeObserver(() => {
    if (stage.clientWidth) root.style.setProperty('--k', (500 / stage.clientWidth).toFixed(4));
  }).observe(stage);
  const ptr = pointer(stage);
  const planes = [[back, -3], [screen, -1.5], [people, 1], [voice, 1], [room, 2.5]];
  const slideLen = T / L.slides;
  const turn = T / (speakers.length > 1 ? speakers.length : 1);

  function frame(t, dt) {
    const still = reduceMotion();
    ptr.update(dt);
    const s = still ? STILL[kind] : t % T;
    const on = still ? 1 : clamp(t / 1.1);
    intro.forEach((el, i) => set(el, 'stroke-dashoffset', 1 - arrive(clamp((on * 1.1 - i * 0.05) / 0.8))));
    planes.forEach(([g, k]) => set(g, 'transform', `translate(${(ptr.x * k).toFixed(2)} ${(ptr.y * k).toFixed(2)})`));
    set(washEl, 'opacity', 0.75 + 0.25 * breath(t, 5.3));

    // slides: each arrives part by part, its point lands in the accent, then it leaves
    const current = Math.floor(s / slideLen) % L.slides;
    slideEls.forEach(({ parts, point }, j) => {
      const age = since(s, j * slideLen);
      const shown = age < slideLen;
      parts.forEach((el, i) => {
        const out = span(age, slideLen - 0.35 + i * 0.03, 0.3, leave);
        const a = shown ? span(age, 0.1 + i * 0.07, 0.7) * (1 - out) : 0;
        set(el, 'opacity', a);
        set(el, 'transform', `translate(${((1 - a) * 8).toFixed(2)} 0)`);
      });
      const out = span(age, slideLen - 0.35, 0.3, leave);
      const p = shown ? snap(clamp((age - 0.75) / 0.24)) * (1 - out) : 0;
      set(point, 'opacity', clamp(p));
    });
    dots.forEach((el, j) => el.classList.toggle('is-on', j === current));

    // who speaks: the lectern, or the panel's chair whose turn it is
    const who = Math.floor(s / turn) % speakers.length;
    speakers.forEach((sp, k) => sp.head.classList.toggle('is-on', k === who));
    let emits;
    if (speakers.length > 1) {
      emits = [];
      for (let k = 0; k < speakers.length; k += 1) {
        for (let e = 0.35; e < turn - 0.4; e += 0.7) emits.push([k * turn + e, k]);
      }
    } else emits = L.phrases.map((e) => [e, 0]);
    const live = [];
    emits.forEach(([e, k]) => {
      const age = since(s, e);
      if (age < LIFE) live.push([age, speakers[k]]);
    });
    live.sort((a, b) => a[0] - b[0]);
    arcs.forEach((el, n) => {
      const [age, sp] = live[n] || [];
      if (age === undefined) {
        set(el, 'opacity', 0);
        return;
      }
      const r = 16 + 104 * age;
      // a panelist speaks straight to the room, clear of the chairs beside them
      const dir = speakers.length > 1 ? Math.PI / 2
        : Math.atan2(rowsY[2] - sp.mouth[1], cx - sp.mouth[0]);
      const w = speakers.length > 1 ? 0.6 : 0.8;
      set(el, 'd', arcPath(sp.mouth, r, dir - w, dir + w));
      set(el, 'opacity', 0.85 * clamp(age / 0.15) * (1 - age / LIFE) ** 1.5);
    });

    // a seat lights as an arc reaches it, a little more for some listeners than others
    seats.forEach((st) => {
      let k = 0;
      live.forEach(([age, sp]) => {
        const d = Math.hypot(st.x - sp.mouth[0], st.y - sp.mouth[1]);
        const r = 16 + 104 * age;
        k += Math.exp(-(((d - r) / 16) ** 2)) * (1 - age / LIFE) * st.resp;
      });
      st.k = clamp(k);
    });

    // the panel's hand-off: a dot carried from the last speaker to the next
    if (speakers.length > 1) {
      const at = since(s, who * turn);
      const from = speakers[(who + speakers.length - 1) % speakers.length];
      const to = speakers[who];
      const p = travel(clamp(at / 0.6));
      const lift = Math.sin(p * Math.PI) * 26;
      set(handoff, 'cx', from.x + (to.x - from.x) * p);
      set(handoff, 'cy', from.y - 18 - lift);
      set(handoff, 'opacity', at < 0.75 ? Math.sin(p * Math.PI) : 0);
    } else set(handoff, 'opacity', 0);

    // the lecture's questions: up goes a hand, across comes the answer, the seat lights
    asks.forEach(({
      seat, hand, answer, at,
    }) => {
      const up = snap(clamp((s - at) / 0.24)) * (1 - span(s, 9.2 + at / 20, 0.3, leave));
      const reply = span(s, at + 0.45, 0.8, travel);
      set(hand, 'opacity', clamp(up));
      set(hand, 'transform', `translate(0 ${((1 - clamp(up)) * 4).toFixed(2)})`);
      set(answer, 'stroke-dashoffset', 1 - reply);
      set(answer, 'opacity', reply * (1 - span(s, 9.1, 0.4, leave)));
      seat.k = Math.max(seat.k, reply * (1 - span(s, 9.1, 0.4, leave)));
    });

    seats.forEach((st) => {
      set(st.lit, 'opacity', st.k);
      set(st.g, 'transform', `translate(${st.x.toFixed(1)} ${(st.y - 1.6 * st.k).toFixed(2)})`);
    });
  }

  loop(stage, frame, { still: STILL[kind] });
}
