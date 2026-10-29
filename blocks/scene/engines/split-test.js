/**
 * Scene engine `split-test`: Conversion Factory (/portfolio/conversion-factory/), accent conv.
 *
 * What it shows: one cycle as a git graph that carries live traffic. Visitors flow along main
 * through the baseline block. The coordinator (its instructions as a page, top left) cuts a
 * branch; four spokes commit to it in turn and the variant block is built at its end; the branch
 * joins main again (the pull request) and the split opens: each visitor takes the baseline or
 * the variant. Each conversion drops into a tally bar attached to its card, and the variant's
 * grows clearly longer. Then the promotion, one change at a time: the branch fades, the old
 * baseline steps back into a stack of earlier ones (hairline outlines behind the block), and
 * the variant card travels up into the empty slot. Last, the slow loop: a run up the long dashed
 * line on the right edge back to the coordinator, where the retrospective strikes one line of
 * the instructions and writes it anew; it stays lit while the next dispatch leaves.
 *
 * Parts (rows):
 * - `coordinator`: the instructions page, top left; label to its right.
 * - `spokes`: the branch's four commits; label under them.
 * - `test`: the fork in main where visitors split; label above main, right of the fork.
 * - `retrospective`: the dashed loop up the right edge; label under its shoulder.
 *
 * Cycle 12 s: build (0 to 2.9 s), the live test (to 7.2 s), promotion (to 9.7 s), the
 * retrospective (to 11.5 s). Reduced motion shows the test under way.
 */
const M = 256; // main
const D = 124; // the branch runs this far below main
const FX = 92; // the fork
const JX = 428; // where the branch joins main again
const T = 12;
const V = 170; // visitor speed, units per second
const GAP = 0.3; // a visitor every 0.3 s: 40 a cycle
const X0 = 42; // visitors enter here
const X1 = 458; // and leave here
const TEST = [2.9, 5.6]; // visitors reaching the fork in this window are split
const STILL = 6.6;
const BLOCK = [256, 68, 44]; // x, width, height (centered on its lane)
const COMMITS = [194, 210, 226, 242]; // analyst, architect, builder, validator
const CARD = [68, 104, 48, 58];
const CX = CARD[0] + CARD[2] / 2; // over the fork: the coordinator cuts the branch there
const BAR = [M + 30, M + D - 30]; // the tally bars, under the baseline and over the variant
const STEP = BLOCK[1] / 5; // one conversion's length of bar

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (s) => s * s * (3 - 2 * s);
function bezier(x1, y1, x2, y2) {
  const at = (s, a, b) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i += 1) {
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

/** The branch's offset below main at x (0..1 of D): eased out of the fork and into the join. */
const bend = (x) => {
  if (x <= FX || x >= JX) return 0;
  if (x < FX + 84) return smooth((x - FX) / 84);
  if (x > JX - 84) return smooth((JX - x) / 84);
  return 1;
};

/* the visitors split in the test, in order (1 = variant), and the ones that convert */
const LANES = [0, 1, 1, 0, 1, 0, 1, 1, 0];
const CONVERTS = [0, 1, 0, 1, 1, 0, 1, 1, 1];

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer, reduceMotion,
  } = kit;
  const id = `split-test-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'split-test-svg', viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  const defs = svg('defs', {}, root);
  const wash = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: 'split-test-wash' }, wash);
  svg('stop', { offset: '1', class: 'split-test-wash' }, wash);
  // the lines are cut away inside the blocks (a visitor goes into the page and comes out; the
  // variant hides main as it moves up) and inside the commits, which read as open rings
  const masks = ['cut', 'fixed'].map((name) => {
    const m = svg('mask', {
      id: `${id}-${name}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 500, height: 500,
    }, defs);
    svg('rect', { width: 500, height: 500, fill: '#fff' }, m);
    return m;
  });
  const hole = (y, m) => svg('rect', {
    x: BLOCK[0] - 1, y: y - BLOCK[2] / 2 - 1, width: BLOCK[1] + 2, height: BLOCK[2] + 2, fill: '#000',
  }, m);
  hole(M, masks[0]);
  const holeB = hole(M + D, masks[0]);
  hole(M + D, masks[1]);
  const holes = COMMITS.map((x) => svg('circle', {
    cx: x, cy: M + D, r: 0, fill: '#000',
  }, masks[0]));

  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const cut = svg('g', { mask: `url(#${id}-cut)` }, mech);
  const intro = [];
  const add = (name, attrs, parent, kind) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };

  // the branch as a polyline of samples, and how far along it each x is (0..1)
  const XS = [];
  for (let x = FX; x <= JX; x += 4) XS.push(x);
  const YS = XS.map((x) => M + D * bend(x));
  const along = [0];
  for (let i = 1; i < XS.length; i += 1) {
    along.push(along[i - 1] + Math.hypot(XS[i] - XS[i - 1], YS[i] - YS[i - 1]));
  }
  const fracAt = (x) => along[Math.round((x - FX) / 4)] / along[along.length - 1];
  const laneD = `M${XS.map((x, i) => `${x} ${YS[i].toFixed(2)}`).join('L')}`;

  // construction: the wash, where branches go, the dispatch line, the slow loop up the right edge
  svg('circle', {
    cx: 290, cy: 300, r: 190, fill: `url(#${id}-wash)`,
  }, back);
  const RETRO = `M444 ${M}C462 ${M} 464 242 464 226V170C464 100 388 50 270 50C176 50 ${CX} 62 ${CX} ${CARD[1]}`;
  add('path', { d: RETRO, class: 'split-test-c split-test-dash split-test-slow' }, back, 'fade');
  add('path', { d: `M${CX} ${CARD[1] + CARD[3]}V${M - 4}`, class: 'split-test-c split-test-dash' }, back, 'fade');
  add('path', {
    d: laneD, class: 'split-test-c split-test-dash', mask: `url(#${id}-fixed)`,
  }, mech, 'fade');
  COMMITS.forEach((x) => add('circle', {
    cx: x, cy: M + D, r: 5, class: 'split-test-c',
  }, mech, 'fade'));
  // the tally tracks, attached to each card, and the bars that fill them
  const tracks = BAR.map((y) => svg('path', { d: `M${BLOCK[0]} ${y}H${BLOCK[0] + BLOCK[1]}`, class: 'split-test-track' }, mech));
  const bars = BAR.map((y, b) => svg('path', {
    d: `M${BLOCK[0]} ${y}H${BLOCK[0] + BLOCK[1]}`, class: `split-test-bar${b ? ' is-variant' : ''}`, pathLength: 1,
  }, mech));
  // earlier baselines, stacked behind the block; one steps back on each promotion
  const ghosts = [4, 8, 0].map((o) => svg('rect', {
    x: BLOCK[0], y: M - BLOCK[2] / 2, width: BLOCK[1], height: BLOCK[2], class: 'split-test-c', transform: `translate(${-o} ${-o})`,
  }, mech));

  // main and the fork's node
  add('path', { d: `M${X0} ${M}H${X1}`, class: 'split-test-s', pathLength: 1 }, cut, 'draw');
  add('circle', {
    cx: FX, cy: M, r: 4, class: 'split-test-s',
  }, mech, 'fade');

  // the branch: drawn on as it is built; commits as open rings
  const branch = svg('path', { d: laneD, class: 'split-test-s split-test-branch', pathLength: 1 }, cut);
  const commits = COMMITS.map((x) => svg('circle', {
    cx: x, cy: M + D, r: 0, class: 'split-test-s split-test-commit',
  }, mech));

  // the blocks: the same hero block twice; the variant's change (its call to action) in accent
  const blockAt = (cls) => {
    const g = svg('g', { class: cls }, mech);
    const [x, w, h] = BLOCK;
    const y = M - h / 2;
    const parts = [
      `M${x} ${y}H${x + w}V${y + h}H${x}Z`,
      `M${x + 8} ${y + 11}H${x + 38}`,
      `M${x + 8} ${y + 19}H${x + 54}M${x + 8} ${y + 25}H${x + 46}`,
    ].map((d, i) => svg('path', {
      d, class: `split-test-ink${i === 1 ? ' is-bold' : ''}`, pathLength: 1,
    }, g));
    const cta = svg('rect', {
      x: x + 8, y: y + 31, width: 22, height: 7, rx: 2, class: 'split-test-cta', pathLength: 1,
    }, g);
    return { g, parts: [...parts, cta], cta };
  };
  const baseline = blockAt('split-test-block');
  intro.push(...baseline.parts.map((el) => [el, 'draw']));
  const variant = blockAt('split-test-block is-variant');

  // the coordinator's instructions: a page whose third line the retrospective rewrites
  const [cx0, cy0, cw, ch] = CARD;
  add('rect', {
    x: cx0, y: cy0, width: cw, height: ch, rx: 3, class: 'split-test-s split-test-card', pathLength: 1,
  }, mech, 'draw');
  const LINES = [[10, 28, 'is-bold'], [19, 40], [26, 36], [33, 40], [40, 30], [47, 38]];
  const lines = LINES.map(([y, x1, cls], i) => (i === 2 ? svg : add)('path', {
    d: `M${cx0 + 8} ${cy0 + y}H${cx0 + x1}`, class: `split-test-ink split-test-line${cls ? ` ${cls}` : ''}`, pathLength: 1,
  }, mech, 'draw'));
  const struck = svg('path', { d: `M${cx0 + 5} ${cy0 + 26}H${cx0 + 39}`, class: 'split-test-strike', pathLength: 1 }, mech);
  const fresh = svg('path', { d: `M${cx0 + 8} ${cy0 + 26}H${cx0 + 36}`, class: 'split-test-fresh', pathLength: 1 }, mech);

  // the moving parts: the dispatch pulse, the retrospective's run, the visitors
  const retro = svg('path', { d: RETRO, class: 'split-test-run', pathLength: 1 }, mech);
  const pulse = svg('circle', { r: 4.4, cx: CX, class: 'split-test-dot' }, mech);
  const runner = svg('circle', { r: 4.4, class: 'split-test-dot' }, mech);
  const exitAt = (BLOCK[0] + BLOCK[1] - X0) / V; // seconds from entering to leaving a block
  const tallies = [[], []]; // when each conversion lands in its bar, this cycle
  const roster = Array.from({ length: Math.round(T / GAP) }, (_, k) => {
    const atFork = (k * GAP + (FX - X0) / V) % T;
    const n = Math.floor((atFork - TEST[0]) / GAP + 1e-6);
    const tested = n >= 0 && n < LANES.length;
    const v = {
      el: svg('circle', { r: 4.4, class: 'split-test-visitor' }, mech),
      k,
      last: '',
      b: tested && LANES[n] === 1,
      converts: tested && CONVERTS[n] === 1,
    };
    if (v.converts) {
      const lane = tallies[v.b ? 1 : 0];
      v.slot = lane.length;
      lane.push(k * GAP + exitAt + 0.35);
    }
    return v;
  });

  // leaders and labels: [part, pin x, pin y, end x, end y, label x, label y, align]
  [
    ['coordinator', cx0 + cw, cy0 + 29, cx0 + cw + 6, cy0 + 29, 126, cy0 + 29, 'left'],
    ['spokes', 218, M + D + 8, 218, M + D + 28, 218, M + D + 33, 'top'],
    ['test', FX + 6, M - 7, 120, M - 30, 126, M - 50, 'left'],
    ['retrospective', 461.8, 149.6, 440, 150, 434, 150, 'right'],
  ].forEach(([part, px, py, ex, ey, x, y, align]) => {
    if (!place(part, x, y, 500, align)) return;
    add('path', { d: `M${px} ${py}L${ex} ${ey}`, class: 'split-test-leader', pathLength: 1 }, mech, 'draw');
    add('circle', {
      cx: px, cy: py, r: 1.6, class: 'split-test-pin',
    }, mech, 'fade');
  });

  stage.append(root);
  const runLen = retro.getTotalLength();
  const RUN = Array.from({ length: 121 }, (_, i) => retro.getPointAtLength((runLen * i) / 120));
  let kpx = 1;
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (!w) return;
    kpx = 500 / w;
    root.style.setProperty('--k', kpx.toFixed(3));
  }).observe(stage);

  // the build: the branch reaches the first commit, runs on through the four to the variant,
  // waits while the variant is built, then joins main (the pull request)
  const [p1, p2] = [fracAt(COMMITS[0]), fracAt(BLOCK[0])];
  const grownAt = (t) => {
    if (t < 1.35) return p1 * travel(span(t, 0.9, 1.35));
    if (t < 2.1) return p1 + (p2 - p1) * span(t, 1.35, 2.1);
    return p2 + (1 - p2) * travel(span(t, 2.6, 2.9));
  };
  const commitAt = COMMITS.map((x) => 1.35 + ((fracAt(x) - p1) / (p2 - p1)) * 0.75 - 0.04);

  const ptr = pointer(stage);
  let tau = 0;
  let rate = 0;
  let introDone = false;
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
  const show = (el, o) => set(el, 'opacity', o.toFixed(3));

  function draw(t, dt) {
    const still = reduceMotion();
    ptr.update(dt);
    if (still) tau = t;
    else {
      rate += ((ptr.over ? 1.4 : 1) - rate) * (1 - Math.exp(-dt * 3));
      tau = (tau + dt * rate * arrive(clamp(t / 1.2))) % T;
    }
    if (!introDone) {
      introDone = true;
      intro.forEach(([el, kind], i) => {
        const p = still ? 1 : arrive(clamp((t - Math.min(0.06, 1.15 / intro.length) * i) / 0.8));
        if (p < 1) introDone = false;
        if (kind === 'draw') dash(el, p);
        else show(el, p);
      });
    }

    // build: the coordinator dispatches; the branch grows through its commits to the variant
    const drop = travel(span(tau, 0, 0.9));
    pulse.setAttribute('cy', (CARD[1] + CARD[3] + (M - CARD[1] - CARD[3]) * drop).toFixed(2));
    show(pulse, tau < 0.95 ? 1 - span(tau, 0.86, 0.95) : 0);
    const gone = 1 - leave(span(tau, 7.7, 8)); // the branch fades first
    dash(branch, grownAt(tau), gone);
    branch.classList.toggle('is-building', tau > 0.9 && tau < 2.9);
    commitAt.forEach((at, i) => {
      const r = 5 * snap(span(tau, at, at + 0.26)) * gone;
      commits[i].setAttribute('r', r.toFixed(2));
      holes[i].setAttribute('r', (r * 0.9).toFixed(2));
    });
    const built = arrive(span(tau, 2.1, 2.6));
    variant.parts.forEach((el, i) => dash(el, clamp(built * 1.3 - i * 0.08)));
    variant.g.classList.toggle('is-building', tau > 2.1 && tau < 2.7);

    // the promotion: the old baseline steps back into the stack (the oldest dissolves), then
    // the variant travels up into the empty slot, main masked behind it, and becomes the baseline
    const up = travel(span(tau, 8.45, 9.35));
    const lift = D * (1 - up);
    variant.g.setAttribute('transform', `translate(0 ${lift.toFixed(2)})`);
    holeB.setAttribute('y', (M + lift - BLOCK[2] / 2 - 1).toFixed(2));
    const step = tau < 9.35 ? arrive(span(tau, 8.1, 8.45)) : 0;
    ghosts[0].setAttribute('transform', `translate(${-4 - 4 * step} ${-4 - 4 * step})`);
    show(ghosts[1], 1 - step);
    ghosts[2].setAttribute('transform', `translate(${-4 * step} ${-4 * step})`);
    show(ghosts[2], step);
    show(baseline.g, tau < 9.35 ? 1 - step : span(tau, 9.35, 9.65));
    show(variant.g, 1 - span(tau, 9.35, 9.65));
    set(variant.cta, 'fill-opacity', (built * (1 - span(tau, 9.35, 9.85))).toFixed(3));

    // the test: each visitor rides main, or the branch if it was split there; each conversion
    // drops into its card's tally bar, which grows a step (snap) as it lands
    const won = snap(span(tau, 7.2, 7.46)) * (1 - span(tau, 7.9, 8.2));
    set(root, '--split-test-won', won.toFixed(3));
    tallies.forEach((lands, b) => {
      let len = 0;
      lands.forEach((land) => { len += STEP * snap(span(tau, land, land + 0.22)); });
      const out = 1 - leave(span(tau, 7.9 + 0.1 * b, 8.2 + 0.1 * b));
      dash(bars[b], len / BLOCK[1], out);
      // a track goes and comes with its card: the variant's while it is built, the baseline's
      // back once the promoted card has landed
      show(tracks[b], b ? built * out : Math.max(out, span(tau, 9.65, 10)));
    });
    const [bx, bw] = BLOCK;
    roster.forEach((v) => {
      const age = (tau - v.k * GAP + T) % T;
      let x = X0 + V * age;
      let y = v.b ? M + D * bend(x) : M;
      let o = clamp((x - X0) / 26) * clamp((X1 - x) / 28);
      o *= clamp(Math.abs(x - bx - bw / 2) - bw / 2 + 1); // inside its page, out of sight
      let cls = 'split-test-visitor';
      if (v.converts && x > bx + bw) {
        // it converts on leaving its block and drops into the end of its tally bar
        const s = arrive(clamp((x - bx - bw) / (V * 0.35)));
        const ly = v.b ? M + D : M;
        x = bx + bw + (bx + STEP * (v.slot + 1) - bx - bw) * s;
        y = ly + (BAR[v.b ? 1 : 0] - ly) * s;
        o = tau >= v.k * GAP && s < 1 ? 1 : 0;
        if (v.b) cls = 'split-test-visitor is-variant';
      }
      if (cls !== v.last) {
        v.last = cls;
        v.el.setAttribute('class', cls);
      }
      v.el.setAttribute('cx', x.toFixed(2));
      v.el.setAttribute('cy', y.toFixed(2));
      show(v.el, o);
    });

    // the slow loop: up the right edge to the coordinator, which rewrites one line
    const run = travel(span(tau, 9.9, 10.9));
    dash(retro, run, 1 - leave(span(tau, 10.95, 11.35)));
    const head = RUN[Math.round(run * 120)];
    runner.setAttribute('cx', head.x.toFixed(2));
    runner.setAttribute('cy', head.y.toFixed(2));
    show(runner, tau > 9.9 && tau < 10.95 ? 1 : 0);
    // struck, erased, written again in accent; it stays lit while the next dispatch leaves
    dash(struck, snap(span(tau, 10.9, 11.1)), 1 - span(tau, 11.1, 11.3));
    let ink = 1;
    if (tau > 11.1) ink = tau < 11.2 ? 1 - span(tau, 11.1, 11.2) : arrive(span(tau, 11.2, 11.5));
    ink = Math.min(ink, still ? 1 : arrive(clamp((t - 0.5) / 0.8)));
    dash(lines[2], ink);
    dash(fresh, ink, tau > 11.2 ? 1 : 1 - span(tau, 2, 2.6));

    back.setAttribute('transform', `translate(${(ptr.x * 5 * kpx).toFixed(2)} ${(ptr.y * 5 * kpx).toFixed(2)})`);
  }

  loop(stage, draw, { still: STILL });
}
