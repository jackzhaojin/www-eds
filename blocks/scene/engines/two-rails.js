/**
 * Scene engine: two-rails (Postal Portal, /portfolio/postal-portal/).
 *
 * One spec, two rails. A stack of spec sheets (PRD, tech spec, and on top the numbered task list)
 * feeds one line, and the points under it route the work to two rails, drawn as railway lines on
 * a plan. The lower rail runs into an Edge Delivery page; the upper rail is the Next.js flow, its
 * 89 sleepers the 89 commits of the sprint, a longer one wherever a new task number starts.
 * Each 12 s loop is the build, in the order it happened: four block cars ride the lower rail into
 * the page's slots (hero, cards, stats, form); the points throw; a parcel rides the upper rail
 * through quote, pickup and confirmation (the commits where tasks 5, 7 and 9 begin) while the task
 * list ticks off a line for each task it crosses (the one in progress in the accent), and a
 * postmark stamps it at confirmation. Reduced motion shows the parcel at pickup.
 *
 * Parts (authored rows, placed by the engine):
 * - `spec`: right of the spec sheets, top left
 * - `nextjs`: under the upper rail, hung from its start
 * - `eds`: under the lower rail, hung from its start
 */

const W = 500;
const CYCLE = 11;
const DEG = 180 / Math.PI;

// the motion grammar's curves, as the easings those cubic-beziers name
const ARRIVE = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // (0.16, 1, 0.3, 1)
const TRAVEL = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2); // (0.65, 0, 0.35, 1)
const SNAP = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2; // (0.34, 1.56, 0.64, 1)
const LEAVE = (x) => x ** 3; // (0.32, 0, 0.67, 0)
const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, t0, len) => clamp((t - t0) / len);
const smooth = (v) => v * v * (3 - 2 * v);
const f2 = (v) => v.toFixed(2);

/** A path's points, sampled once: its length, and the point and heading at a distance. */
function lut(el) {
  const total = el.getTotalLength();
  const n = Math.ceil(total / 2);
  const pts = Array.from({ length: n + 1 }, (_, i) => el.getPointAtLength((i / n) * total));
  const at = (dist) => {
    const u = clamp(dist / total) * n;
    const i = Math.min(n - 1, Math.floor(u));
    const [p, q] = [pts[i], pts[i + 1]];
    const f = u - i;
    const a = Math.atan2(q.y - p.y, q.x - p.x) * DEG;
    return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, a };
  };
  return { total, at };
}

// ---------- the plan (500 units square) ----------
const SX = 78; // the stem under the spec sheets
const JY = 156; // the points
const R = 44;
const UP_Y = JY + R; // the upper rail (Next.js)
const LO_TURN = 326;
const LO_Y = LO_TURN + R; // the lower rail (EDS)
const START = 110; // where a traveller starts, hidden under the front sheet
const TICK_X0 = 132;
const TICK_X1 = 424;
const RAIL_END = 430; // the buffer stop, just past the last commit
const COMMITS = 89;
const STEP = (TICK_X1 - TICK_X0) / (COMMITS - 1);
const TASKS = [5, 11, 19, 29, 51, 57, 63, 77, 79]; // the commit where each task number starts
const tickX = (n) => TICK_X0 + (n - 1) * STEP;
const STATIONS = [51, 63, 79].map(tickX); // quote (5.1), pickup (7.1), confirmation (9.1)
const PAGE = {
  x: 366, y: 306, w: 78, h: 130,
};
const HEAD = 40; // the points: the first stretch of each route below the junction
const LABEL_X = 140;
const LEAD_X = 130;
// the two routes (the lower one runs on under the page's edge), and the same routes as drawn:
// the stem, each route's points, the rest of each route
const ARC = `A${R} ${R} 0 0 0`;
const HEAD_AT = `${f2(SX + R - R * Math.cos(HEAD / R))} ${f2(JY + R * Math.sin(HEAD / R))}`;
const UP_D = `M${SX} ${START}V${JY}${ARC} ${SX + R} ${UP_Y}H${RAIL_END}`;
const LO_D = `M${SX} ${START}V${LO_TURN}${ARC} ${SX + R} ${LO_Y}H${PAGE.x + 10}`;
const PIECES = [`M${SX} 122V${JY}`, `M${SX} ${JY}${ARC} ${HEAD_AT}`, `M${SX} ${JY}V${JY + HEAD}`,
  `M${HEAD_AT}${ARC} ${SX + R} ${UP_Y}H${RAIL_END}`, `M${SX} ${JY + HEAD}V${LO_TURN}${ARC} ${SX + R} ${LO_Y}H${PAGE.x}`];
const UP_STRAIGHT = (JY - START) + (Math.PI / 2) * R; // where the upper route runs straight
const upDist = (x) => UP_STRAIGHT + (x - (SX + R));

// ---------- the story (seconds of an 11 s cycle) ----------
const CAR_DEP = [0.3, 0.75, 1.2, 1.65];
const CAR_TRAVEL = 1.6;
const CAR_ARR = CAR_DEP.map((d) => d + CAR_TRAVEL);
const THROW = 3.7;
const LEGS = [
  [3.95, 5.65, 0, upDist(STATIONS[0])],
  [6.2, 7.1, upDist(STATIONS[0]), upDist(STATIONS[1])],
  [7.65, 8.55, upDist(STATIONS[1]), upDist(STATIONS[2])],
];
const STAMP = 8.65;
const RESET = 9.7; // after a 0.8 s hold on the postmark; things leave one by one
const THROW_BACK = 10.55;
const STILL = 7.4; // reduced motion: the page built, the parcel at pickup, tasks 1 to 7 ticked
const LEADS = {
  spec: { from: [107, null] },
  nextjs: { from: [LEAD_X, UP_Y], top: UP_Y + 26 },
  eds: { from: [LEAD_X, LO_Y], top: LO_Y + 18 },
};

/** The plate's static drawing; data-k names what the frame moves. */
function drawing(id) {
  // a stroke's width (as --w, scaled to the stage in CSS) and opacity; a class can recolor it
  const ink = (w, o, cls = '') => `style="--w: ${w}" stroke-opacity="${o}"${cls ? ` class="two-rails-${cls}"` : ''}`;
  let ticks = '';
  let taskTicks = '';
  for (let n = 1; n <= COMMITS; n += 1) {
    const x = f2(tickX(n));
    if (TASKS.includes(n)) taskTicks += `M${x} ${UP_Y - 6.5}V${UP_Y + 6.5}`;
    else ticks += `M${x} ${UP_Y - 3.2}V${UP_Y + 3.2}`;
  }
  let loTicks = '';
  for (let x = TICK_X0; x < PAGE.x - 6; x += STEP * 3) loTicks += `M${f2(x)} ${LO_Y - 3.2}V${LO_Y + 3.2}`;
  const px = PAGE.x + 7;
  const pw = PAGE.w - 14;
  const third = (pw + 3) / 3;
  const quarter = (pw + 3) / 4;
  const cells = [
    [[px, 16, pw, 24]],
    [0, 1, 2].map((k) => [px + k * third, 46, third - 3, 20]),
    [0, 1, 2, 3].map((k) => [px + k * quarter, 72, quarter - 3, 11]),
    [[px, 89, pw, 6], [px, 100, pw, 6], [px, 112, 22, 7]],
  ];
  const rects = (list, attrs) => list.map(([x, y, w, h]) => `<rect x="${f2(x)}" y="${PAGE.y + y}" width="${f2(w)}" height="${h}" rx="1.2" ${attrs}/>`).join('');
  const slots = cells.map((list) => `${rects(list, ink(0.75, 0.22, 'slot'))}<g data-k="slot" opacity="0">${rects(list, ink(1, 0.62, 'block'))}<g data-k="flash" opacity="0">${rects(list, ink(1.25, 1, 'flash'))}</g></g>`).join('');
  const sheets = [[9, -8, 2.6], [4.5, -4, 1.2], [0, 0, -0.6]].map(([dx, dy, rot], i) => `<g data-k="sheet" opacity="0" transform="translate(${dx} ${dy}) rotate(${rot} 49 122)"><rect x="49" y="46" width="58" height="76" rx="2" ${i < 2 ? ink(1, 0.38, 'paper') : ink(1.25, 0.75, 'paper')}/>${i < 2 ? '' : `<path d="M57 56h24" ${ink(1.6, 0.72)}/>${[34, 28, 36, 30, 38, 25, 33, 37, 29].map((len, k) => `<path d="M57 ${66 + k * 6}h2M63 ${66 + k * 6}h${len}" data-k="task" ${ink(1, 0.36, 'task')}/>`).join('')}`}</g>`).join('');
  const parts = Object.keys(LEADS).map((key) => `<g data-k="lead-${key}"><path ${ink(0.75, 0.45)}/><circle r="2" class="two-rails-dot"/></g>`).join('');
  return `<svg class="two-rails-art" viewBox="0 0 ${W} ${W}" aria-hidden="true" focusable="false">
<defs><radialGradient id="${id}-w"><stop offset="0" class="two-rails-stop"/><stop offset="1" class="two-rails-stop" stop-opacity="0"/></radialGradient>
<clipPath id="${id}-b"><rect data-k="clip-base" x="${TICK_X0 - 6}" y="${UP_Y - 10}" width="0" height="20"/></clipPath>
<clipPath id="${id}-d"><rect data-k="clip-done" x="${TICK_X0 - 6}" y="${UP_Y - 10}" width="0" height="20"/></clipPath></defs>
<circle data-k="wash" cx="${PAGE.x + PAGE.w / 2}" cy="${LO_Y}" r="88" class="two-rails-wash" style="fill: url(#${id}-w)" opacity="0"/>
<circle data-k="wash" cx="350" cy="${UP_Y}" r="104" class="two-rails-wash" style="fill: url(#${id}-w)" opacity="0"/>
<g data-k="plane"><g clip-path="url(#${id}-b)"><path d="${ticks}" ${ink(0.75, 0.3)}/><path d="${taskTicks}" ${ink(0.9, 0.62)}/></g>
<path data-k="lo-ticks" d="${loTicks}" ${ink(0.75, 0.3)} opacity="0"/></g>
<g data-k="plane">${PIECES.map((d, i) => `<path data-k="rail" d="${d}" ${i === 1 || i === 2 ? ink(1, 0.22) : ink(1.25, 0.72)}/>`).join('')}
${[1, 2].map((i) => `<path data-k="points" d="${PIECES[i]}" ${ink(1.75, 0.9)} opacity="0"/>`).join('')}
<g data-k="done" clip-path="url(#${id}-d)"><path d="${taskTicks}" ${ink(1.25, 1, 'accent')}/></g>
<path data-k="trail" d="${LO_D}" ${ink(1.75, 1, 'accent')}/><path data-k="trail" d="${UP_D}" ${ink(1.75, 1, 'accent')}/>
${STATIONS.map((x) => `<g data-k="station" opacity="0"><circle cx="${f2(x)}" cy="${UP_Y}" r="4.6" ${ink(1.25, 0.8, 'paper')}/><circle data-k="stop" cx="${f2(x)}" cy="${UP_Y}" r="2.4" class="two-rails-fill" opacity="0"/></g>`).join('')}
<circle data-k="node" cx="${SX}" cy="${JY}" r="2.2" class="two-rails-dot" opacity="0"/>
<path data-k="buffer" d="M${RAIL_END - 5} ${UP_Y - 9}H${RAIL_END}V${UP_Y + 9}H${RAIL_END - 5}" ${ink(2, 0.85)} opacity="0"/></g>
<g data-k="plane">${CAR_DEP.map(() => `<g data-k="car" opacity="0"><rect x="-7.5" y="-5" width="15" height="10" rx="2" ${ink(1.5, 1, 'tint')}/></g>`).join('')}
<g data-k="parcel" opacity="0"><rect x="-9" y="-9" width="18" height="18" rx="1.75" ${ink(1.75, 1, 'tint')}/><rect x="-2.4" y="-9" width="4.8" height="18" class="two-rails-fill" fill-opacity="0.4"/></g>
<g data-k="postmark" opacity="0"><circle r="18" ${ink(1.5, 1, 'accent')}/><circle r="14.5" ${ink(1, 1, 'accent')}/><path d="M13 -28l5 5.5l10 -12.5" ${ink(2, 1, 'accent')}/></g></g>
<g data-k="plane"><g data-k="page" opacity="0"><rect x="${PAGE.x}" y="${PAGE.y}" width="${PAGE.w}" height="${PAGE.h}" rx="3" ${ink(1.25, 0.75, 'paper')}/>
<path d="M${px} ${PAGE.y + 9}h20M${px + pw - 14} ${PAGE.y + 9}h2m4 0h2m4 0h2" ${ink(1, 0.4)}/>${slots}</g>${sheets}</g>
<g data-k="leaders" opacity="0">${parts}</g></svg>`;
}

export default function engine(block, kit) {
  const {
    stage, place, parts, loop, pointer, reduceMotion,
  } = kit;
  stage.insertAdjacentHTML('beforeend', drawing(`two-rails-${Math.random().toString(36).slice(2, 7)}`));
  const art = stage.lastElementChild;
  const all = (key) => [...art.querySelectorAll(`[data-k="${key}"]`)];
  const one = (key) => art.querySelector(`[data-k="${key}"]`);
  const [washLo, washUp] = all('wash');
  const [trailLo, trailUp] = all('trail');
  const [planes, rails, points, stations, stops, cars, slots, flashes, sheets, lines] = ['plane', 'rail',
    'points', 'station', 'stop', 'car', 'slot', 'flash', 'sheet', 'task'].map(all);
  const [done, parcel, postmark, page, node, leaders, clipBase, clipDone, loTicks, buffer] = ['done',
    'parcel', 'postmark', 'page', 'node', 'leaders', 'clip-base', 'clip-done', 'lo-ticks', 'buffer'].map(one);
  const leads = Object.keys(LEADS).map((key) => [key, one(`lead-${key}`)]);
  const [LO, UP] = [trailLo, trailUp].map(lut);
  const railLen = rails.map((el) => el.getTotalLength());

  // the labels and their leaders; placed even before the stage has a size, since the kit moves
  // unplaced labels to the caption. Strokes keep their pixel weight at every size through
  // --two-rails-u (units per pixel), so dashes stay in user units.
  let k = 1;
  const layout = () => {
    const size = stage.clientWidth;
    if (size) k = size / W;
    art.style.setProperty('--two-rails-u', f2(1 / k));
    const unit = size ? W / size : 0;
    leads.forEach(([key, g]) => {
      const label = parts.get(key);
      if (!label) {
        g.remove();
        return;
      }
      const h = (unit && label.offsetHeight * unit) || 44;
      const first = (unit && (label.firstElementChild?.offsetHeight || 0) * unit) || 22;
      const { from: [fx, fy], top = 76 - h / 2 } = LEADS[key];
      place(key, LABEL_X, top + h / 2, W, 'left');
      const y1 = f2(top + first / 2);
      const d = `M${fx} ${fy == null ? y1 : `${fy + 5}V${y1}`}H${LABEL_X - 6}`;
      g.firstElementChild.setAttribute('d', d);
      g.lastElementChild.setAttribute('cx', fx);
      g.lastElementChild.setAttribute('cy', fy ?? y1);
    });
  };

  const cache = new WeakMap();
  const set = (el, name, value) => {
    const c = cache.get(el) || {};
    const v = typeof value === 'number' ? value.toFixed(3) : value;
    if (c[name] !== v) {
      c[name] = v;
      cache.set(el, c);
      el.setAttribute(name, v);
    }
  };
  const dash = (el, len, shown) => {
    set(el, 'stroke-dasharray', `${f2(len)} ${f2(len + 4)}`);
    set(el, 'stroke-dashoffset', f2((1 - shown) * len));
  };
  const put = (el, p, extra = '') => set(el, 'transform', `translate(${f2(p.x)} ${f2(p.y)}) rotate(${f2(p.a)})${extra}`);
  const mid = { x: PAGE.x + PAGE.w / 2, y: LO_Y, a: 0 };

  const lit = { n: -1 };
  let introPoints = 0;
  const story = (tau) => {
    // the reset is soft: the parcel and its trail leave, then the stations, then the page's
    // blocks one by one, while the task list winds back
    const gone = (t0) => 1 - LEAVE(span(tau, t0, 0.32));
    const fade = gone(RESET);
    // the cars ride the lower rail into the page; each fills its slot on arrival
    let lead = tau >= CAR_ARR[0] ? LO.total : 0;
    cars.forEach((g, i) => {
      const u = span(tau, CAR_DEP[i], CAR_TRAVEL);
      set(g, 'opacity', +(u > 0 && u < 1));
      if (u > 0 && u < 1) {
        put(g, LO.at(TRAVEL(u) * LO.total));
        lead = Math.max(lead, TRAVEL(u) * LO.total);
      }
      const since = tau - CAR_ARR[i];
      const f = since >= 0 ? SNAP(span(since, 0, 0.24)) * gone(RESET + 0.2 + i * 0.13) : 0;
      set(slots[i], 'opacity', Math.min(1, f));
      put(slots[i], mid, ` scale(${(0.94 + 0.06 * f).toFixed(3)}) translate(${-mid.x} ${-mid.y})`);
      set(flashes[i], 'opacity', since >= 0 ? 1 - span(since, 0.1, 0.9) : 0);
    });
    const loShown = tau > CAR_DEP[0] ? lead / LO.total : 0;
    dash(trailLo, LO.total, loShown);
    set(trailLo, 'opacity', loShown > 0.002 ? 1 - span(tau, CAR_ARR[3], 0.6) : 0);

    // the points throw to the upper rail and back: the route that is set is drawn bold
    const back = tau >= THROW_BACK;
    const thr = clamp(back ? 1 - SNAP(span(tau, THROW_BACK, 0.24)) : SNAP(span(tau, THROW, 0.24)));
    set(points[0], 'opacity', thr * introPoints);
    set(points[1], 'opacity', (1 - thr) * introPoints);

    // the parcel rides the upper rail, stopping at each station
    let dist = 0;
    LEGS.forEach(([t0, t1, d0, d1]) => {
      if (tau >= t0) dist = d0 + (d1 - d0) * TRAVEL(span(tau, t0, t1 - t0));
    });
    const out = tau >= LEGS[0][0];
    const pp = UP.at(dist);
    set(parcel, 'opacity', out ? fade : 0);
    if (out) put(parcel, pp);
    dash(trailUp, UP.total, out ? dist / UP.total : 0);
    set(trailUp, 'opacity', out && dist > 0.5 ? fade : 0);
    const straight = out && dist >= UP_STRAIGHT;
    set(clipDone, 'width', straight ? Math.max(0, pp.x - (TICK_X0 - 6)) : 0);
    set(done, 'opacity', fade);
    stops.forEach((el, i) => {
      const since = tau - LEGS[i][1];
      set(el, 'opacity', since >= 0 ? Math.min(1, SNAP(span(since, 0, 0.22))) * gone(RESET + 0.1 * i) : 0);
    });
    // the task list ticks off as the parcel crosses each task's first commit
    const at = straight ? (pp.x - TICK_X0) / STEP + 1 : 0;
    const wound = Math.max(0, Math.ceil((tau - RESET) / 0.07));
    const n = Math.max(0, TASKS.filter((c) => c <= at + 0.5).length - wound);
    if (n !== lit.n) {
      lit.n = n;
      lines.forEach((ln, i) => {
        ln.classList.toggle('is-done', i < n - 1);
        ln.classList.toggle('is-lit', i === n - 1);
      });
    }

    // the postmark at confirmation
    const sc = 1.25 - 0.25 * SNAP(span(tau, STAMP, 0.26));
    put(postmark, { x: STATIONS[2], y: UP_Y, a: -12 }, ` scale(${sc.toFixed(3)})`);
    set(postmark, 'opacity', clamp((tau - STAMP) / 0.08) * fade);

    // the soft wash under whichever rail is working, breathing through the hold
    const breath = 0.98 + 0.02 * Math.sin((2 * Math.PI * tau) / 1.7);
    set(washLo, 'opacity', smooth(span(tau, 0.2, 0.7) * (1 - span(tau, CAR_ARR[3] + 0.1, 0.9))));
    set(washUp, 'opacity', smooth(span(tau, THROW + 0.05, 0.9) * fade) * breath);
  };

  // the intro: construction draws on, then the mechanism spins up
  let introDone = false;
  const RAIL_AT = [0.1, 0.2, 0.2, 0.28, 0.34];
  const intro = (t) => {
    if (introDone) return;
    const on = (el, t0) => set(el, 'opacity', ARRIVE(span(t, t0, 0.8)));
    sheets.forEach((g, i) => on(g, i * 0.06));
    rails.forEach((el, i) => dash(el, railLen[i], ARRIVE(span(t, RAIL_AT[i], 0.8))));
    introPoints = ARRIVE(span(t, 0.4, 0.6));
    set(clipBase, 'width', ARRIVE(span(t, 0.3, 0.9)) * (TICK_X1 - TICK_X0 + 12));
    [[node, 0.36], [loTicks, 0.42], [page, 0.48], [leaders, 0.7]].forEach(([el, t0]) => on(el, t0));
    [...stations, buffer].forEach((g, i) => on(g, 0.6 + i * 0.06));
    if (t >= 2) {
      introDone = true;
      rails.forEach((el) => ['stroke-dasharray', 'stroke-dashoffset'].forEach((a) => el.removeAttribute(a)));
    }
  };

  const DEPTH = [1, 2, 3.5, 2]; // parallax in px: construction, mechanism, subject, occluders
  const ptr = pointer(stage);
  let tau = 0;
  let speed = 1;
  const draw = (t, dt) => {
    const still = reduceMotion();
    if (still) tau = STILL;
    else {
      ptr.update(dt);
      speed += ((ptr.over ? 1.4 : 1) - speed) * (1 - Math.exp(-dt * 3));
      tau = (tau + dt * smooth(clamp(t / 1.2)) * speed) % CYCLE;
    }
    intro(still ? 99 : t);
    story(tau);
    planes.forEach((g, i) => {
      const m = still ? 0 : DEPTH[i] / k;
      set(g, 'transform', `translate(${f2(ptr.x * m)} ${f2(ptr.y * m)})`);
    });
  };

  layout();
  const redraw = loop(stage, draw, { still: STILL });
  const ro = new ResizeObserver(() => {
    layout();
    redraw();
  });
  ro.observe(stage);
  parts.forEach((label) => ro.observe(label));
}
