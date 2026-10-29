/**
 * Scene (loom): the Azure STAR Generator as a tapestry loom. CSV feedback rows are the warp, their
 * commas knots, rising steadily from the lower beam. The Azure OpenAI shuttle runs its track and
 * lays a story in four bands shaped as the app's prompt asks (Situation one sentence, Task one to
 * two, Action a bulleted list, Result three), each band marked by a dot in the margin and beaten
 * in by the reed. A finished story gets an ink hem and rolls up in ink. 12 s a story.
 *
 * Parts (a column right of the loom, on leaders): `stories` the cloth (upper), `openai` the
 * shuttle's track (middle), `csv` the warp and knots below the reed (lower).
 */

const V = 500;
const F = 262; // the fell, the cloth's growing edge
const P = 6; // weft row pitch
const ROWS = 20; // grid rows a story
const H = ROWS * P;
const WX = 113; // first warp thread
const WG = 13;
const WN = 11;
const LEFT = WX - 4;
const RIGHT = WX + WG * (WN - 1) + 4;
const MID = (LEFT + RIGHT) / 2;
const REST = [82, 274]; // the shuttle boxes
const SY = F + 6;
const RACE = SY + 6; // the shuttle's track, which the boxes sit on
const REED = 294;
const BEAMS = [50, 440];
const FRAME = [50, 306];
const KNOT = [REED + 14, BEAMS[1] - 14];
const LABEL_X = 326;
const MARK_X = LEFT - 7;

const CYCLE = 12; // the cloth rises one story (H) in a cycle, steadily
const THROW = 1.3;
const STILL = 2 * CYCLE + 7.8 + THROW * 0.55;

/** Each band's slot (grid rows: gap rows, then its rows) and its rows' [min, max] widths. */
const BANDS = [
  { at: 0, slot: 3, rows: [[0.86, 1]] },
  { at: 3, slot: 4, rows: [[1, 1], [0.48, 0.72]] },
  {
    at: 7, slot: 6, bullets: true, rows: [[0.62, 0.96], [0.5, 0.86], [0.66, 1], [0.44, 0.78]],
  },
  { at: 13, slot: 5, rows: [[1, 1], [0.9, 1], [0.4, 0.66]] },
];
const HEM_Y = (ROWS - 0.5) * P;
// a band is thrown the moment its slot has risen clear of the fell
BANDS.forEach((b) => { b.go = ((b.at + b.slot) / ROWS) * CYCLE; });

/** CSS's cubic-bezier easing, solved by bisection. */
function bezier(x1, y1, x2, y2) {
  const at = (a, b, u) => 3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  return (x) => {
    if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 18; i += 1) {
      const m = (lo + hi) / 2;
      if (at(x1, x2, m) < x) lo = m;
      else hi = m;
    }
    return at(y1, y2, (lo + hi) / 2);
  };
}

const ARRIVE = bezier(0.16, 1, 0.3, 1);
const TRAVEL = bezier(0.65, 0, 0.35, 1);
const SNAP = bezier(0.34, 1.56, 0.64, 1);
const LEAVE = bezier(0.32, 0, 0.67, 0);
const clamp = (v) => Math.min(1, Math.max(0, v));
const mod = (a, n) => ((a % n) + n) % n;
const f2 = (n) => n.toFixed(2);

/** Warp thread i's x at height y: straight above the reed, fanning out 22% below it. */
const warpX = (i, y) => {
  const fan = 1 + 0.22 * clamp((y - REED) / (BEAMS[1] - 6 - REED));
  return MID + (WX + i * WG - MID) * fan;
};

/** The latest throw at scene time tau: its story k, band j, and the seconds since it began. */
function lastThrow(tau) {
  const k = Math.floor(tau / CYCLE);
  const u = tau - k * CYCLE;
  const j = BANDS.reduce((n, b, i) => (u >= b.go ? i : n), -1);
  if (j < 0) return { k: k - 1, j: 3, w: u + CYCLE - BANDS[3].go };
  return { k, j, w: u - BANDS[j].go };
}

let count = 0;

export default function engine(block, kit) {
  count += 1;
  const id = `loom-${count}`;
  const { svg, parts } = kit;
  const root = svg('svg', { class: 'loom-svg', viewBox: `0 0 ${V} ${V}`, 'aria-hidden': 'true' });
  const line = (x1, y1, x2, y2) => `M${x1} ${y1}L${x2} ${y2}`;
  const warpD = [...Array(WN)].map((_, i) => `M${WX + i * WG} ${BEAMS[0] + 6}V${REED}L${f2(warpX(i, BEAMS[1] - 6))} ${BEAMS[1] - 6}`);
  const dents = [...Array(WN + 1)].map((_, i) => `M${WX - WG / 2 + i * WG} ${REED - 4}v8`).join('');
  const boxes = REST.map((x, s) => {
    const o = s ? 22 : -22;
    return `M${x - o} ${SY - 6}H${x + o}V${SY + 6}H${x - o}`;
  });
  // the static loom; data-d is the draw-on delay of the intro
  root.innerHTML = `<defs><radialGradient id="${id}-w"><stop offset="0" class="loom-wash-stop"/>
<stop offset="1" class="loom-wash-stop" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}-f" gradientUnits="userSpaceOnUse" x1="0" y1="${BEAMS[0] + 8}" x2="0" y2="${BEAMS[0] + 70}">
<stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="${id}-k" gradientUnits="userSpaceOnUse" x1="0" y1="${KNOT[0]}" x2="0" y2="${KNOT[1]}">
<stop offset="0" stop-color="#000"/><stop offset=".18" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/>
<stop offset="1" stop-color="#000"/></linearGradient>
${['f', 'k'].map((g) => `<mask id="${id}-${g}m" maskUnits="userSpaceOnUse" x="0" y="0" width="${V}" height="${V}">
<rect width="${V}" height="${V}" fill="url(#${id}-${g})"/></mask>`).join('')}
<clipPath id="${id}-c" clipPathUnits="userSpaceOnUse"><rect y="-${V}" height="${3 * V}"/></clipPath></defs>
<g class="loom-back"><ellipse cx="${MID}" cy="170" rx="160" ry="150" fill="url(#${id}-w)"/></g>
<g class="loom-front"><g class="loom-layer" data-part="">
${FRAME.map((x) => `<path class="loom-con" data-d="0" d="${line(x, BEAMS[0], x, BEAMS[1])}"/>`).join('')}
${boxes.map((d) => `<path class="loom-box" data-d=".06" d="${d}"/>`).join('')}</g>
<g class="loom-layer" data-part="csv">${warpD.map((d, i) => `<path class="loom-warp" data-d="${0.12 + i * 0.02}" d="${d}"/>`).join('')}</g>
<g class="loom-layer loom-knots" data-part="csv" mask="url(#${id}-km)"></g>
<g class="loom-layer" data-part="openai"><path class="loom-race" data-d=".3" d="${line(REST[0] - 22, RACE, REST[1] + 22, RACE)}"/></g>
<g class="loom-layer loom-reed" data-part=""><path class="loom-con" data-d=".36"
d="M${LEFT - 2} ${REED - 4}H${RIGHT + 2}M${LEFT - 2} ${REED + 4}H${RIGHT + 2}"/><path class="loom-dents" d="${dents}"/></g>
<g class="loom-layer loom-cloth" data-part="stories"><g mask="url(#${id}-fm)"></g></g>
<g class="loom-layer loom-thrown" data-part="openai"><line class="loom-yarn"/><g class="loom-shuttle">
<path class="loom-boat" d="M-21 0C-17-3.4-13-4.5-9-4.5H9C13-4.5 17-3.4 21 0C17 3.4 13 4.5 9 4.5H-9C-13 4.5-17 3.4-21 0Z"/>
<rect class="loom-pirn" x="-8" y="-1.7" width="16" height="3.4" rx="1.7"/></g></g>
<g class="loom-layer loom-beams" data-part="">${BEAMS.map((y) => `<rect class="loom-beam" data-d=".06" x="${FRAME[0] - 6}"
y="${y - 6}" width="${FRAME[1] - FRAME[0] + 12}" height="12" rx="6"/>${FRAME.map((x) => `<circle class="loom-axle" cx="${x}" cy="${y}" r="2"/>`).join('')}`).join('')}</g>
</g>`;
  kit.stage.append(root);
  const $ = (s) => root.querySelector(s);
  const [back, front, knotLayer, reed, cloth, thrown, beams] = ['.loom-back', '.loom-front', '.loom-knots',
    '.loom-reed', '.loom-cloth', '.loom-thrown', '.loom-beams'].map($);
  const reveal = $('clipPath rect');
  const yarn = $('.loom-yarn');
  const shuttle = $('.loom-shuttle');

  // each warp thread a CSV row, each knot a comma: one path of dots a thread
  const rand = kit.random(2025);
  const threads = [...Array(WN)].map((_, i) => {
    const b = [];
    for (let y = rand() * 36; y < 2 * H - 14; y += 24 + rand() * 34) b.push(y);
    return { i, b, el: svg('path', { class: 'loom-knot' }, knotLayer) };
  });

  const turns = [0, 1, 2, 3, 4, 5].map((n) => ({
    y: BEAMS[n % 2],
    phase: (n * Math.PI) / 3,
    el: svg('line', { class: 'loom-turn', x1: FRAME[0] + 8, x2: FRAME[1] - 8 }, beams),
  }));

  // the cloth: three stories in a ring
  const stories = [0, 1, 2].map(() => {
    const el = svg('g', { class: 'loom-story' }, cloth.firstChild);
    const bands = BANDS.map((band) => {
      const g = svg('g', {}, el);
      const first = band.at + band.slot - band.rows.length;
      svg('circle', {
        class: 'loom-mark', cx: MARK_X, cy: (first + band.rows.length / 2) * P, r: 1.8,
      }, g);
      const rows = band.rows.map((len, i) => {
        const row = first + i;
        const y = (row + 0.5) * P;
        if (band.bullets) {
          svg('circle', {
            class: 'loom-bullet', cx: WX + WG / 2, cy: y, r: 1.5,
          }, g);
        }
        return {
          row, y, len, line: svg('line', { class: 'loom-weft', y1: y, y2: y }, g), over: svg('path', { class: 'loom-over' }, g),
        };
      });
      return { el: g, rows, state: '' };
    });
    const hem = svg('line', {
      class: 'loom-hem', x1: LEFT, x2: RIGHT, y1: HEM_Y, y2: HEM_Y, 'stroke-dasharray': `${RIGHT - LEFT} ${RIGHT - LEFT}`,
    }, el);
    return {
      el, bands, hem, k: null, done: null, hemAt: null, y: 0,
    };
  });

  /** Lays story k's rows (lengths seeded by k); the warp passes over every other crossing. */
  const weave = (story, k) => {
    const rnd = kit.random(k * 7919 + 17);
    story.bands.forEach((band, j) => band.rows.forEach((row) => {
      const [lo, hi] = row.len;
      const x1 = BANDS[j].bullets ? WX + WG : LEFT;
      const x2 = x1 + (RIGHT - x1) * (lo + (hi - lo) * rnd());
      row.line.setAttribute('x1', x1);
      row.line.setAttribute('x2', x2.toFixed(1));
      let d = 'M0 0';
      for (let i = mod(k * ROWS + row.row + 1, 2); i < WN; i += 2) {
        const x = WX + i * WG;
        if (x > x1 + 1 && x < x2 - 1) d += `M${x} ${row.y - 2.2}v4.4`;
      }
      row.over.setAttribute('d', d);
    }));
    story.k = k;
  };

  const setBand = (band, state) => {
    if (band.state === state) return;
    band.el.setAttribute('visibility', state === 'off' ? 'hidden' : 'visible');
    if (state === 'clip') band.el.setAttribute('clip-path', `url(#${id}-c)`);
    else band.el.removeAttribute('clip-path');
    band.state = state;
  };

  const notes = svg('g', {}, root);
  const leader = (part, x, y) => {
    const g = svg('g', { class: 'loom-layer', 'data-part': part }, notes);
    svg('path', { class: 'loom-leader', 'data-d': 0.42, d: line(x + 4, y, LABEL_X - 6, y) }, g);
    svg('circle', {
      class: 'loom-dot', cx: x, cy: y, r: 2,
    }, g);
    kit.place(part, LABEL_X, y, V, 'left');
  };
  leader('stories', RIGHT + 6, 150);
  leader('openai', REST[1] + 26, RACE);
  leader('csv', warpX(WN - 1, 374) + 8, 374);

  let unit = 1;
  new ResizeObserver(() => {
    if (!kit.stage.clientWidth) return;
    unit = V / kit.stage.clientWidth;
    root.style.setProperty('--loom-u', unit.toFixed(3));
  }).observe(kit.stage);
  const drawn = [...root.querySelectorAll('[data-d]')].map((el) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = len;
    return { el, len, delay: Number(el.dataset.d) };
  });

  // hovering a label lights its part and dims the rest
  const layers = [...root.querySelectorAll('.loom-layer')];
  const focus = (part) => {
    layers.forEach((l) => l.classList.toggle('is-dim', !!part && l.dataset.part !== part));
    parts.forEach((label, key) => label.classList.toggle('is-dim', !!part && key !== part));
  };
  parts.forEach((label, key) => {
    label.style.pointerEvents = 'auto';
    label.addEventListener('pointerenter', () => focus(key));
    label.addEventListener('pointerleave', () => focus(null));
  });

  const pointer = kit.pointer(kit.stage);
  const fadeIn = [knotLayer, cloth, thrown, $('.loom-dents')];
  const last = {};
  const set = (el, key, name, value) => {
    if (last[key] === value) return;
    last[key] = value;
    el.setAttribute(name, value);
  };
  let tau = 2 * CYCLE + BANDS[1].go - 0.4;
  let speed = 1;
  let intro = false;

  const drawIntro = (t) => {
    intro = t > 1.4;
    drawn.forEach((d) => {
      const p = intro ? 1 : ARRIVE(clamp((t - d.delay) / 0.8));
      d.el.style.strokeDashoffset = f2(d.len * (1 - p));
      if (intro) ['stroke-dasharray', 'stroke-dashoffset'].forEach((k) => d.el.style.removeProperty(k));
    });
    const show = (intro ? 1 : ARRIVE(clamp((t - 0.25) / 0.9))).toFixed(3);
    fadeIn.forEach((g) => g.setAttribute('opacity', show));
  };

  const draw = (t, dt) => {
    if (kit.reduceMotion()) {
      tau = STILL;
      if (!intro) drawIntro(99);
    } else {
      if (!intro) drawIntro(t);
      pointer.update(dt);
      speed += ((pointer.over ? 1.4 : 1) - speed) * (1 - Math.exp(-dt * 3));
      tau += dt * speed * (0.5 - 0.5 * Math.cos(Math.PI * clamp(t / 1.2)));
    }
    const now = tau;
    const k = Math.floor(now / CYCLE);
    const D = (now / CYCLE) * H; // take-up: steady, like a conveyor
    const thrown1 = lastThrow(tau);

    // the story on the loom (accent) and the two above it (ink); each band shows once thrown
    for (let s = 0; s < 3; s += 1) {
      const kk = k - s;
      const story = stories[mod(kk, 3)];
      if (story.k !== kk) weave(story, kk);
      // a finished story keeps its accent until the next one's first band is thrown
      const done = s > 1 || (s === 1 && now - k * CYCLE >= BANDS[0].go);
      if (story.done !== done) story.el.classList.toggle('is-done', done);
      story.done = done;
      story.y = F + kk * H - D;
      set(story.el, `y${mod(kk, 3)}`, 'transform', `translate(0 ${f2(story.y)})`);
      story.bands.forEach((b, bj) => {
        const since = now - (kk * CYCLE + BANDS[bj].go);
        let state = 'on';
        if (since < 0) state = 'off';
        else if (since < THROW) state = 'clip';
        setBand(b, state);
      });
      const hem = Math.min(1, SNAP(clamp((tau - (kk + 1) * CYCLE) / 0.26)));
      if (story.hemAt !== hem) story.hem.style.strokeDashoffset = f2((RIGHT - LEFT) * (1 - hem));
      story.hemAt = hem;
    }

    // the throw: S and A go left to right, T and R right to left
    const { j, w } = thrown1;
    const dir = j % 2 ? -1 : 1;
    const from = REST[j % 2];
    const xs = from + (REST[1 - (j % 2)] - from) * TRAVEL(w / THROW);
    set(shuttle, 'sh', 'transform', `translate(${f2(xs)} ${SY})`);
    const edge = xs - dir * 22;
    set(reveal, 'rx', 'x', dir > 0 ? '-10' : f2(edge));
    set(reveal, 'rw', 'width', f2(dir > 0 ? edge + 10 : V - edge + 10));

    // the yarn, from the newest row (its selvedge once thrown) to the pirn
    const rowY = (kk, b) => stories[mod(kk, 3)].y + stories[mod(kk, 3)].bands[b].rows.at(-1).y;
    const prev = j ? [thrown1.k, j - 1] : [thrown1.k - 1, 3];
    const ay = rowY(...prev) + (rowY(thrown1.k, j) - rowY(...prev)) * ARRIVE(w / 0.3);
    const ax = w < THROW ? Math.min(RIGHT, Math.max(LEFT, edge)) : [RIGHT, LEFT][j % 2];
    set(yarn, 'y1', 'x1', f2(ax));
    set(yarn, 'y2', 'y1', f2(ay));
    set(yarn, 'y3', 'x2', f2(xs));
    set(yarn, 'y4', 'y2', SY);

    // the reed beats the band in
    const bw = w - THROW;
    let lift = 0;
    if (bw > 0 && bw < 0.22) lift = SNAP(bw / 0.22);
    else if (bw >= 0.22 && bw < 1) lift = 1 - LEAVE((bw - 0.22) / 0.3);
    set(reed, 're', 'transform', `translate(0 ${f2((F + 6 - REED) * lift)})`);

    // the warp moves with the cloth: knots rise, beams turn
    threads.forEach((th) => {
      let d = '';
      th.b.forEach((b) => {
        const y = KNOT[1] - mod(b + D, 2 * H);
        if (y > KNOT[0] - 2) d += `M${f2(warpX(th.i, y))} ${f2(y)}h0`;
      });
      set(th.el, `k${th.i}`, 'd', d || 'M0 0');
    });
    turns.forEach((tn, n) => {
      const ang = D / 9 + tn.phase;
      const y = f2(tn.y - 4.6 * Math.sin(ang));
      set(tn.el, `t${n}`, 'y1', y);
      tn.el.setAttribute('y2', y);
      tn.el.setAttribute('opacity', Math.max(0, Math.cos(ang)).toFixed(3));
    });
    // the wash breathes, about 2%, on a period of its own
    set(back.firstChild, 'w', 'opacity', f2(0.98 + 0.02 * Math.cos((2 * Math.PI * tau) / 17)));

    const shift = (n) => `translate(${f2(pointer.x * n * unit)} ${f2(pointer.y * n * unit)})`;
    set(back, 'b', 'transform', shift(-3));
    set(front, 'f', 'transform', shift(2));
  };

  kit.loop(kit.stage, draw, { still: STILL });
}
