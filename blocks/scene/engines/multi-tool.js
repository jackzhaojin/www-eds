/**
 * Scene (multi-tool): the AI Builder Kit as a two-ended folding multi-tool. The handle is the
 * plugin marketplace; its nine nail nicks are the nine published skills (in the README's order),
 * every blade folded away. A task (an accent pill) steps along the nicks reading each
 * description, snaps at the one that matches, a thread runs to that blade's pivot, and the blade
 * swings up out of the handle, works, and folds back. The draw.io blade carries a small diagram
 * that is rendered, viewed and fixed, lap by lap; the Playwright blade runs its spec through as
 * film. Dash-dot phantom outlines (the drafting convention for a moving part's other position)
 * mark where the two featured blades open. 6 s a task, 12 s a loop.
 *
 * Parts: `drawio` the draw.io blade's open position (upper left), `video` the Playwright
 * blade's open position (upper right), `kit` the handle (label under it).
 */

const V = 500;
const PIVOTS = [[118, 363], [346, 363]];
const HANDLE = {
  x: 86, y: 336, w: 292, h: 54,
};
const NICK_Y = 349;
const NICKS = [...Array(9)].map((_, i) => 154 + 19.5 * i);
const SCAN_X = 62;
const TASK = 6;
// the task's timeline, in seconds: scan, snap, thread, swing, two laps of work, fold
const T = {
  scan: 1.25, pop: 0.22, link: 1.35, open: 1.6, swing: 1.15, work: 2.8, lap: 0.8, fold: 5.1,
};
T.foldFor = 0.85;
const LAPS = [T.work + 0.05, T.work + 1.15]; // each lap ends with a fix
const STILL = 2 * 2 * TASK + 4.3;
const LABEL_Y = 72;

/** The featured blades: nick, pivot, folded and open angles (degrees), length and outline. */
const BLADES = [
  {
    key: 'drawio',
    nick: 5,
    pivot: 0,
    from: 0,
    to: -100,
    len: 240,
    d: 'M6-10L44-19H234Q240-19 240-13V13Q240 19 234 19H44L6 10Z',
  },
  {
    key: 'video',
    nick: 8,
    pivot: 1,
    from: 180,
    to: 280,
    len: 232,
    d: 'M6-9L18-10H228Q232-10 232-6V6Q232 10 228 10H18L6 9Z',
  },
];

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
const f2 = (n) => n.toFixed(2);
const RAD = Math.PI / 180;

/** Blade b's local point (x along the blade, y across it) at angle a, in drawing units. */
const local = (b, x, y, a = b.to) => {
  const [px, py] = PIVOTS[b.pivot];
  const c = Math.cos(a * RAD);
  const s = Math.sin(a * RAD);
  return [px + x * c - y * s, py + x * s + y * c];
};

let count = 0;

export default function engine(block, kit) {
  count += 1;
  const id = `mt-${count}`;
  const { svg, parts } = kit;
  const root = svg('svg', { class: 'multi-tool-svg', viewBox: `0 0 ${V} ${V}`, 'aria-hidden': 'true' });
  const at = (b, a) => `translate(${PIVOTS[b.pivot].join(' ')}) rotate(${a})`;
  const arc = (b) => {
    const [x1, y1] = local(b, b.len, 0, b.from);
    const [x2, y2] = local(b, b.len, 0, b.to);
    return `M${f2(x1)} ${f2(y1)}A${b.len} ${b.len} 0 0 ${b.to > b.from ? 1 : 0} ${f2(x2)} ${f2(y2)}`;
  };
  const nick = (x) => `M${x - 4.5} ${NICK_Y - 1.5}Q${x} ${NICK_Y + 3.5} ${x + 4.5} ${NICK_Y - 1.5}`;
  const {
    x: hx, y: hy, w: hw, h: hh,
  } = HANDLE;
  // the static drawing; data-d is the draw-on delay of the intro
  root.innerHTML = `<defs><radialGradient id="${id}-w"><stop offset="0" class="multi-tool-wash"/>
<stop offset="1" class="multi-tool-wash" stop-opacity="0"/></radialGradient>
<clipPath id="${id}-c" clipPathUnits="userSpaceOnUse"><rect x="18" y="-10" width="210" height="20"/></clipPath></defs>
<g class="multi-tool-back"><ellipse cx="232" cy="230" rx="210" ry="190" fill="url(#${id}-w)"/>
${BLADES.map((b) => `<g class="multi-tool-layer" data-part="${b.key}"><path class="multi-tool-arc" d="${arc(b)}"/>
<path class="multi-tool-phantom" d="${b.d}" transform="${at(b, b.to)}"/></g>`).join('')}</g>
<g class="multi-tool-front"><g class="multi-tool-layer" data-part="drawio"><g class="multi-tool-blade">
<path class="multi-tool-steel" d="${BLADES[0].d}"/><circle class="multi-tool-steel" r="13"/>
<path class="multi-tool-loop" d="M171-16H229Q234-16 234-11V11Q234 16 229 16H171Q166 16 166 11V-11Q166-16 171-16Z"/>
<rect class="multi-tool-box" x="170" y="-12" width="18" height="9" rx="1.5"/>
<rect class="multi-tool-box" x="212" y="-12" width="18" height="9" rx="1.5"/>
<rect class="multi-tool-box" x="191" y="3" width="18" height="9" rx="1.5"/>
<path class="multi-tool-edge"/><path class="multi-tool-edge"/><circle class="multi-tool-ring" r="3"/></g></g>
<g class="multi-tool-layer" data-part="video"><g class="multi-tool-blade">
<path class="multi-tool-steel" d="${BLADES[1].d}"/><circle class="multi-tool-steel" r="12"/>
<g clip-path="url(#${id}-c)"><path class="multi-tool-frames" d="M18 0H250"/>
<path class="multi-tool-sprockets" d="M18-6.6H250M18 6.6H250"/></g></g></g>
<rect class="multi-tool-body" x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="${hh / 2}"/>
<g class="multi-tool-layer" data-part="kit"><rect class="multi-tool-handle" data-d="0" x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="${hh / 2}"/>
<rect class="multi-tool-inset" data-d=".1" x="${hx + 6}" y="${hy + 6}" width="${hw - 12}" height="${hh - 12}" rx="${hh / 2 - 6}"/>
${PIVOTS.map(([x, y]) => `<circle class="multi-tool-rivet" cx="${x}" cy="${y}" r="5"/><circle class="multi-tool-pin" cx="${x}" cy="${y}" r="1.4"/>`).join('')}
${NICKS.map((x) => `<path class="multi-tool-nick" d="${nick(x)}"/>`).join('')}
<path class="multi-tool-link" pathLength="1" stroke-dashoffset="1"/>
<rect class="multi-tool-task" x="-6.5" y="-3.25" width="13" height="6.5" rx="3.25"/></g></g>`;
  kit.stage.append(root);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const [back, front] = $$('.multi-tool-back, .multi-tool-front');
  const blades = $$('.multi-tool-blade');
  const nicks = $$('.multi-tool-nick');
  const task = root.querySelector('.multi-tool-task');
  const link = root.querySelector('.multi-tool-link');
  const notes = svg('g', {}, root);
  const boxes = $$('.multi-tool-box');
  const edges = $$('.multi-tool-edge');
  const ring = root.querySelector('.multi-tool-ring');
  const film = $$('.multi-tool-frames, .multi-tool-sprockets');

  // the ring's way round the diagram, sampled once
  const loop = root.querySelector('.multi-tool-loop');
  const loopLen = loop.getTotalLength();
  const lap = [...Array(65)].map((_, i) => loop.getPointAtLength((loopLen * i) / 64));

  // leaders: hairlines from each label back to its part
  const leader = (part, x, y1, y2, place) => {
    const g = svg('g', { class: 'multi-tool-layer', 'data-part': part }, notes);
    svg('path', { class: 'multi-tool-leader', 'data-d': 0.5, d: `M${f2(x)} ${f2(y1)}V${f2(y2)}` }, g);
    svg('circle', {
      class: 'multi-tool-dot', cx: f2(x), cy: f2(y1), r: 2,
    }, g);
    kit.place(part, place[0], place[1], V, place[2]);
  };
  const tipTop = (b, y) => local(b, b.len + 7, y)[1];
  leader('drawio', 80, tipTop(BLADES[0], 4), LABEL_Y + 26, [40, LABEL_Y, 'left']);
  leader('video', 386, tipTop(BLADES[1], 0), LABEL_Y + 26, [460, LABEL_Y, 'right']);
  const mid = hx + hw / 2;
  svg('path', {
    class: 'multi-tool-leader', 'data-d': 0.5, d: `M${mid} ${hy + hh + 4}V${hy + hh + 16}`,
  }, svg('g', { class: 'multi-tool-layer', 'data-part': 'kit' }, notes));
  svg('circle', {
    class: 'multi-tool-dot', cx: mid, cy: hy + hh + 4, r: 2,
  }, notes.lastChild);
  kit.place('kit', mid, hy + hh + 20, V, 'top');

  let unit = 1;
  new ResizeObserver(() => {
    if (!kit.stage.clientWidth) return;
    unit = V / kit.stage.clientWidth;
    root.style.setProperty('--mt-u', unit.toFixed(3));
  }).observe(kit.stage);
  const drawn = $$('[data-d]').map((el) => {
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = len;
    return { el, len, delay: Number(el.dataset.d) };
  });

  // hovering a label lights its part and dims the rest
  const layers = $$('.multi-tool-layer');
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
  const fadeIn = [...blades, ...nicks, ...$$('.multi-tool-arc, .multi-tool-phantom, .multi-tool-pin, .multi-tool-rivet')];
  const last = {};
  const set = (el, key, name, value) => {
    if (last[key] === value) return;
    last[key] = value;
    el.setAttribute(name, value);
  };
  let tau = 2 * 2 * TASK;
  let speed = 1;
  let intro = false;

  const drawIntro = (t) => {
    intro = t > 1.4;
    drawn.forEach((d) => {
      const p = intro ? 1 : ARRIVE(clamp((t - d.delay) / 0.8));
      d.el.style.strokeDashoffset = f2(d.len * (1 - p));
      if (intro) ['stroke-dasharray', 'stroke-dashoffset'].forEach((k) => d.el.style.removeProperty(k));
    });
    const show = (intro ? 1 : ARRIVE(clamp((t - 0.3) / 0.9))).toFixed(3);
    fadeIn.forEach((g) => g.style.setProperty('--mt-in', show));
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
    const u = tau % (2 * TASK);
    const which = u < TASK ? 0 : 1;
    const w = u - which * TASK;
    const b = BLADES[which];

    // the task steps along the nicks, reading each description, and snaps at the match
    const step = clamp(w / T.scan) * (b.nick + 1);
    const hop = Math.min(b.nick, Math.floor(step));
    const from = hop ? NICKS[hop - 1] : SCAN_X;
    const sx = from + (NICKS[hop] - from) * ARRIVE(clamp((step - hop) / 0.65));
    const pw = w - T.scan;
    let pop = 1;
    if (pw > 0 && pw < T.pop) pop = 1 + 0.4 * SNAP(pw / T.pop);
    else if (pw >= T.pop) pop = 1.4 - 0.4 * ARRIVE((pw - T.pop) / 0.3);
    const show = clamp(w / 0.15) * (1 - LEAVE((w - T.fold) / 0.3));
    set(task, 'tt', 'transform', `translate(${f2(sx)} ${NICK_Y - 1}) scale(${f2(pop)})`);
    set(task, 'to', 'opacity', f2(show));
    nicks.forEach((n, i) => {
      const on = i === b.nick && w >= T.scan && w < T.fold + T.foldFor;
      if (last[`n${i}`] !== on) n.classList.toggle('is-on', on);
      last[`n${i}`] = on;
      const near = w < T.scan ? Math.exp(-(((sx - NICKS[i]) / 7) ** 2)) : 0;
      set(n, `o${i}`, 'stroke-opacity', on ? '1' : f2(0.42 + 0.5 * near));
    });
    // then a thread runs from the matched nick to its blade's pivot, and back as it folds
    const px = PIVOTS[b.pivot][0] + (b.pivot ? -6 : 6);
    set(link, 'ld', 'd', `M${NICKS[b.nick]} ${NICK_Y + 3}V${NICK_Y + 11}H${px}`);
    const reach = w < T.fold ? TRAVEL((w - T.link) / 0.3) : 1 - TRAVEL((w - T.fold) / 0.5);
    set(link, 'lo', 'stroke-dashoffset', f2(1 - reach));

    // the matching blade swings up out of the handle, works, and folds back
    let open = 0;
    if (w >= T.open && w < T.fold) open = TRAVEL((w - T.open) / T.swing);
    else if (w >= T.fold) open = 1 - TRAVEL((w - T.fold) / T.foldFor);
    BLADES.forEach((bl, i) => {
      const o = i === which ? open : 0;
      set(blades[i], `b${i}`, 'transform', at(bl, f2(bl.from + (bl.to - bl.from) * o)));
      set(blades[i], `v${i}`, 'visibility', o > 0.004 ? 'visible' : 'hidden');
    });

    // draw.io: two laps of render, view, fix; each lap snaps one box into line
    const off1 = 1 - SNAP(clamp((w - LAPS[0] - T.lap) / 0.24));
    const cx = 14 * off1;
    const by = 8 * (1 - SNAP(clamp((w - LAPS[1] - T.lap) / 0.24)));
    set(boxes[2], 'cx', 'transform', `translate(${f2(cx)} 0) rotate(${f2(7 * off1)} 200 7.5)`);
    set(boxes[1], 'by', 'transform', `translate(0 ${f2(by)})`);
    set(edges[0], 'e0', 'd', `M188-7.5H200V${f2(by - 7.5)}H212`);
    set(edges[1], 'e1', 'd', `M179-3V7.5H${f2(191 + cx)}`);
    const lapAt = (w < LAPS[1] - 0.05 ? w - LAPS[0] : w - LAPS[1]) / T.lap;
    const lit = which === 0 && lapAt >= 0 && lapAt <= 1;
    if (lit) {
      const q = clamp(lapAt) * 64;
      const [p0, p1] = [lap[Math.floor(q)], lap[Math.min(64, Math.floor(q) + 1)]];
      set(ring, 'rx', 'cx', f2(p0.x + (p1.x - p0.x) * (q % 1)));
      set(ring, 'ry', 'cy', f2(p0.y + (p1.y - p0.y) * (q % 1)));
    }
    set(ring, 'ro', 'opacity', lit ? '1' : '0');

    // Playwright: the spec runs through as film, easing in and out
    const x = clamp((w - T.work) / (T.fold - T.work - 0.1));
    const run = which === 1 ? 42 * (x - Math.sin(2 * Math.PI * x) / (2 * Math.PI)) : 0;
    film.forEach((f, i) => set(f, `f${i}`, 'stroke-dashoffset', f2(-run)));

    // the wash breathes, about 2%, on a period of its own
    set(back.firstChild, 'w', 'opacity', f2(0.98 + 0.02 * Math.cos((2 * Math.PI * tau) / 17)));
    const shift = (n) => `translate(${f2(pointer.x * n * unit)} ${f2(pointer.y * n * unit)})`;
    set(back, 'pb', 'transform', shift(-2));
    set(front, 'pf', 'transform', shift(3));
  };

  kit.loop(kit.stage, draw, { still: STILL });
}
