/**
 * Scene engine `mcp-relay`: the Sites and AI webinar deck, slide "02 - Go further: Same change
 * through MCP, with a record" (a demo plate, left of the prompt).
 *
 * What it shows: one change relayed down a chain of stations, folded into two rows. In the AI
 * client (a chat window) you (an ink ring) ask and AI (the accent disc) answers; its token travels
 * through the MCP server (the automation square, a connector hub with two ports) into the page's
 * document, where the title is struck out and rewritten in the accent; down to the preview (a
 * browser frame), which renders the new title; out to you at the gate, where the ink ring approves
 * with a tick; and on to the archive, a commit line of snapshots, where a new commit appears.
 *
 * Story (plays once from t = 0, then holds): 0 to 0.8 s the construction draws on; 0.9 to 2.1 s you
 * ask and AI answers; 2.2 to 3.7 s the token goes through the MCP server to the document; 3.8 to
 * 4.8 s the title is struck and rewritten; 4.9 to 6 s the preview renders it; 6 to 6.8 s you
 * approve; 6.9 to 7.9 s the token reaches the archive and the new commit snaps in. Then it holds:
 * the wash breathes and the chat's caret blinks. Reduced motion shows that end.
 *
 * Parts (rows, placed by the engine):
 * - `client`: hung under the chat window (upper left).
 * - `mcp`: above the connector square (top, center).
 * - `preview`: under the browser frame (lower right, clear of the controls' corner).
 * - `archive`: under the commit line (lower left).
 */
const P = 'mcp-relay-';
const ROW = 135; // the first row's route
const CL = {
  x0: 44, y0: 66, x1: 182, y1: 204,
}; // the AI client's window
const SQ = { x: 240, y: ROW, s: 30 }; // the MCP server
const DOC = {
  x0: 304, y0: 66, x1: 432, y1: 204,
}; // the page's document
const PV = {
  x0: 290, y0: 256, x1: 440, y1: 376,
}; // the preview
const YOU = { x: 250, y: 316 };
const AR = { y: 400, nodes: [70, 106, 142, 178], next: 214 }; // the archive's commit line
const THUMB = { w: 23, h: 30 }; // a snapshot over each commit
const DROP = 368; // the route from the document down to the preview

// the story, in seconds from t = 0
const ASK = 0.9;
const REPLY = 1.45;
const LEGS = [[2.2, 2.75], [3.05, 3.6], [4.85, 5.3], [6.0, 6.3], [6.95, 7.6]];
const STRIKE = 3.75;
const WRITE = 4.1;
const RENDER = 5.3;
const APPROVE = 6.35;
const COMMIT = 7.6;
const SETTLE = 8.1;
const STILL = 12;

const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, b) => clamp((t - a) / (b - a));

/** A cubic-bezier easing as a function of t (bisection on x, exact enough at 20 steps). */
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
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);
/** A 0..1..0 pulse over [t0, t0 + d], on the snap curve. */
const pulse = (t, t0, d) => {
  if (t < t0 || t > t0 + d) return 0;
  return Math.sin(Math.PI * clamp(snap((t - t0) / d)));
};
const smooth = (v) => v * v * (3 - 2 * v);
const f2 = (v) => v.toFixed(2);

export default function engine(block, kit) {
  const {
    stage, svg, place, loop, pointer,
  } = kit;
  const id = `${P}${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: `${P}svg`, viewBox: '0 0 500 500', 'aria-hidden': 'true', focusable: 'false',
  });
  stage.append(root);
  const defs = svg('defs', {}, root);
  const grad = svg('radialGradient', { id: `${id}-wash` }, defs);
  svg('stop', { offset: '0', class: `${P}wash-stop` }, grad);
  svg('stop', { offset: '1', class: `${P}wash-stop` }, grad);
  const back = svg('g', {}, root);
  const mech = svg('g', {}, root);
  const front = svg('g', {}, root);
  const intro = []; // [element, kind]: 'draw' by dash (pathLength 1), 'fade' by opacity
  const add = (name, attrs, parent, kind) => {
    const el = svg(name, attrs, parent);
    if (kind) intro.push([el, kind]);
    return el;
  };
  const cls = (names) => names.split(' ').map((n) => (n.startsWith('is-') ? n : P + n)).join(' ');
  const line = (d, names, parent = mech, kind = 'fade') => add('path', { d, class: cls(names) }, parent, kind);
  /* a stroke that draws on later in the story (pathLength 1) */
  const later = (d, names, parent = mech) => svg('path', { d, class: cls(names), pathLength: 1 }, parent);

  /** A route: dotted construction, an accent trail over it, and its points sampled once. */
  const route = (d) => {
    const el = add('path', { d, class: cls('route') }, back, 'fade');
    const trail = svg('path', { d, class: cls('trail'), pathLength: 1 }, mech);
    const total = el.getTotalLength();
    const n = Math.max(8, Math.ceil(total / 3));
    const pts = Array.from({ length: n + 1 }, (_, i) => el.getPointAtLength((i / n) * total));
    const at = (u) => {
      const f = clamp(u) * n;
      const i = Math.min(n - 1, Math.floor(f));
      const r = f - i;
      return [pts[i].x + (pts[i + 1].x - pts[i].x) * r, pts[i].y + (pts[i + 1].y - pts[i].y) * r];
    };
    return { el, trail, at };
  };

  // construction: the wash behind the chain
  const wash = svg('circle', {
    cx: 250, cy: 250, r: 230, fill: `url(#${id}-wash)`,
  }, back);

  // the chain's routes: client, MCP, document, preview, you, archive
  const routes = [
    `M${CL.x1 + 3} ${ROW}H${SQ.x - SQ.s / 2 - 6}`,
    `M${SQ.x + SQ.s / 2 + 6} ${ROW}H${DOC.x0 - 3}`,
    `M${DROP} ${DOC.y1 + 3}V${PV.y0 - 3}`,
    `M${PV.x0 - 3} ${YOU.y}H${YOU.x + 16}`,
    `M${YOU.x} ${YOU.y + 16}V${AR.y - 12}Q${YOU.x} ${AR.y} ${YOU.x - 12} ${AR.y}H${AR.next + 9}`,
  ].map(route);

  // the AI client: a chat window; you ask (an ink ring), AI answers (the accent disc)
  const { x0: cx0, y0: cy0, x1: cx1 } = CL;
  add('rect', {
    x: cx0, y: cy0, width: cx1 - cx0, height: CL.y1 - cy0, rx: 8, class: cls('s frame'),
  }, mech, 'fade');
  line(`M${cx0} ${cy0 + 16}H${cx1}`, 'c');
  const ask = svg('g', {}, mech);
  svg('rect', {
    x: cx0 + 48, y: cy0 + 26, width: 66, height: 20, rx: 7, class: cls('s bubble'),
  }, ask);
  svg('path', { d: `M${cx0 + 56} ${cy0 + 33}H${cx0 + 106}M${cx0 + 56} ${cy0 + 39}H${cx0 + 88}`, class: cls('ink') }, ask);
  const asker = svg('circle', {
    cx: cx1 - 15, cy: cy0 + 36, r: 6, class: cls('you is-small'),
  }, ask);
  const aiHalo = add('circle', {
    cx: cx0 + 15, cy: cy0 + 68, r: 9.5, class: cls('ai-halo'),
  }, mech, 'fade');
  add('circle', {
    cx: cx0 + 15, cy: cy0 + 68, r: 5.5, class: cls('ai'),
  }, mech, 'fade');
  const reply = svg('g', {}, mech);
  svg('rect', {
    x: cx0 + 27, y: cy0 + 54, width: 92, height: 34, rx: 7, class: cls('s bubble'),
  }, reply);
  const typed = [[100, 63], [92, 71], [62, 79]].map(([w, y]) => later(`M${cx0 + 35} ${cy0 + y}H${cx0 + 35 + w - 30}`, 'ink', reply));
  add('rect', {
    x: cx0 + 10, y: CL.y1 - 26, width: cx1 - cx0 - 20, height: 16, rx: 8, class: cls('c'),
  }, mech, 'fade');
  const caret = svg('path', { d: `M${cx0 + 22} ${CL.y1 - 22}V${CL.y1 - 14}`, class: cls('caret') }, mech);

  // the MCP server: the automation square, a port on each side
  const hub = add('rect', {
    x: SQ.x - SQ.s / 2, y: SQ.y - SQ.s / 2, width: SQ.s, height: SQ.s, rx: 6, class: cls('auto'),
  }, mech, 'fade');
  line(`M${SQ.x - 7} ${SQ.y - 5}H${SQ.x + 7}M${SQ.x - 7} ${SQ.y + 5}H${SQ.x + 7}`, 'ink');
  const ports = [-1, 1].map((s) => add('circle', {
    cx: SQ.x + s * (SQ.s / 2 + 3), cy: SQ.y, r: 3, class: cls('port'),
  }, mech, 'fade'));

  // the page's document: the title (struck out, rewritten in the accent) and the body
  const { x0: dx0, y0: dy0, x1: dx1 } = DOC;
  const doc = add('path', {
    d: `M${dx0} ${dy0}H${dx1 - 14}L${dx1} ${dy0 + 14}V${DOC.y1}H${dx0}Z`, class: cls('s paper'),
  }, mech, 'fade');
  line(`M${dx1 - 14} ${dy0}V${dy0 + 14}H${dx1}`, 'c');
  const oldTitle = line(`M${dx0 + 14} ${dy0 + 22}H${dx0 + 46}M${dx0 + 52} ${dy0 + 22}H${dx0 + 80}M${dx0 + 86} ${dy0 + 22}H${dx0 + 100}`, 'ink is-bold');
  const strike = later(`M${dx0 + 9} ${dy0 + 26}L${dx0 + 105} ${dy0 + 18}`, 'strike');
  const newTitle = later(`M${dx0 + 14} ${dy0 + 38}H${dx0 + 42}M${dx0 + 48} ${dy0 + 38}H${dx0 + 74}`, 'accent is-bold');
  [114, 106, 92, 114, 98, 70].forEach((w, i) => line(`M${dx0 + 14} ${dy0 + 58 + i * 14}H${dx0 + w}`, 'ink'));

  // the preview: a browser frame that renders the new title
  const { x0: px0, y0: py0, x1: px1 } = PV;
  const frame = add('rect', {
    x: px0, y: py0, width: px1 - px0, height: PV.y1 - py0, rx: 7, class: cls('s paper'),
  }, mech, 'fade');
  line(`M${px0} ${py0 + 16}H${px1}`, 'c');
  add('rect', {
    x: px0 + 14, y: py0 + 5, width: 70, height: 6, rx: 3, class: cls('c'),
  }, mech, 'fade');
  const rendered = [
    later(`M${px0 + 14} ${py0 + 32}H${px0 + 42}M${px0 + 48} ${py0 + 32}H${px0 + 74}`, 'accent is-bold'),
    later(`M${px0 + 14} ${py0 + 44}H${px1 - 14}V${py0 + 76}H${px0 + 14}Z`, 'ink is-block'),
    later(`M${px0 + 14} ${py0 + 88}H${px1 - 20}`, 'ink'),
    later(`M${px0 + 14} ${py0 + 98}H${px1 - 48}`, 'ink'),
  ];

  // you, at the gate: the ink ring, and the tick
  const you = add('circle', {
    cx: YOU.x, cy: YOU.y, r: 12, class: cls('you'),
  }, mech, 'fade');
  const tick = later(`M${YOU.x - 5.5} ${YOU.y + 0.5}L${YOU.x - 1.5} ${YOU.y + 4.5}L${YOU.x + 6} ${YOU.y - 4}`, 'tick');

  // the archive: a commit line, a snapshot over each commit; the new one waits
  line(`M${AR.nodes[0] - 14} ${AR.y}H${AR.nodes[3]}`, 's');
  const ext = later(`M${AR.nodes[3]} ${AR.y}H${AR.next}`, 's');
  const thumb = (x, names, parent) => {
    const y = AR.y - 12 - THUMB.h;
    const g = svg('g', {}, parent);
    svg('rect', {
      x: x - THUMB.w / 2, y, width: THUMB.w, height: THUMB.h, rx: 2, class: cls(names),
    }, g);
    svg('path', { d: `M${x - 7} ${y + 8}H${x + 3}M${x - 7} ${y + 15}H${x + 7}M${x - 7} ${y + 21}H${x + 4}`, class: cls(`${names} is-lines`) }, g);
    svg('path', { d: `M${x} ${y + THUMB.h}V${AR.y - 5}`, class: cls(names) }, g);
    return g;
  };
  AR.nodes.forEach((x, i) => {
    intro.push([thumb(x, i < 2 ? 'old' : 'c', mech), 'fade']);
    add('circle', {
      cx: x, cy: AR.y, r: 4.5, class: cls('node'),
    }, mech, 'fade');
  });
  const snapshot = thumb(AR.next, 's', mech);
  const fresh = svg('circle', {
    cx: AR.next, cy: AR.y, r: 0, class: cls('dot'),
  }, mech);

  // the token
  const halo = svg('circle', { r: 10, class: cls('halo') }, front);
  const dot = svg('circle', { r: 4.5, class: cls('dot') }, front);

  // leaders and labels: [part, pin x, pin y, end x, end y, label x, label y, align]
  const callouts = [
    ['client', cx0 + 10, CL.y1 + 1, cx0 + 10, CL.y1 + 11, cx0 - 1, CL.y1 + 26, 'left'],
    ['mcp', SQ.x, SQ.y - SQ.s / 2 - 1, SQ.x, SQ.y - SQ.s / 2 - 12, SQ.x, SQ.y - SQ.s / 2 - 15, 'bottom'],
    ['preview', (px0 + px1) / 2, PV.y1 + 1, (px0 + px1) / 2, PV.y1 + 9, (px0 + px1) / 2, PV.y1 + 12, 'top'],
    ['archive', AR.nodes[1] + 18, AR.y + 1, AR.nodes[1] + 18, AR.y + 11, AR.nodes[1] + 18, AR.y + 14, 'top'],
  ];
  const labels = {};
  callouts.forEach(([part, px, py, ex, ey, lx, ly, align]) => {
    const label = place(part, lx, ly, 500, align);
    if (!label) return;
    labels[part] = label;
    add('path', { d: `M${f2(px)} ${f2(py)}L${f2(ex)} ${f2(ey)}`, class: cls('leader'), pathLength: 1 }, mech, 'draw');
    add('circle', {
      cx: f2(px), cy: f2(py), r: 1.6, class: cls('pin'),
    }, mech, 'fade');
  });

  let kpx = 1; // viewBox units per CSS pixel
  new ResizeObserver(([entry]) => {
    const w = entry.contentRect.width;
    if (!w) return;
    kpx = 500 / w;
    root.style.setProperty('--k', kpx.toFixed(3));
  }).observe(stage);

  const ptr = pointer(stage);
  const set = (el, prop, v) => {
    if (el[`_${prop}`] !== v) {
      el[`_${prop}`] = v;
      el.style.setProperty(prop, v);
    }
  };
  const attr = (el, name, v) => {
    if (el[`_a${name}`] !== v) {
      el[`_a${name}`] = v;
      el.setAttribute(name, v);
    }
  };
  const flag = (el, name, on) => {
    if (el[`_c${name}`] !== on) {
      el[`_c${name}`] = on;
      el.classList.toggle(name, on);
    }
  };
  /* a partial stroke, from..to of a pathLength="1" path; hidden when empty */
  const dash = (el, to, o = 1, from = 0) => {
    const len = Math.max(0, to - from);
    set(el, 'stroke-dasharray', `${len.toFixed(4)} 2`);
    set(el, 'stroke-dashoffset', (-from).toFixed(4));
    set(el, 'opacity', len > 0.0005 && o > 0.001 ? o.toFixed(3) : '0');
  };
  const pop = (el, x, y, s) => attr(el, 'transform', `translate(${x} ${y}) scale(${s.toFixed(3)}) translate(${-x} ${-y})`);

  let introAt = -1;
  function drawIntro(t) {
    if (t === introAt) return;
    introAt = t;
    const gap = Math.min(0.05, 0.6 / intro.length);
    intro.forEach(([el, kind], i) => {
      const p = arrive(clamp((t - gap * i) / 0.8));
      if (kind === 'draw') dash(el, p);
      else set(el, 'opacity', p.toFixed(3));
    });
  }

  function draw(t, dt) {
    ptr.update(dt);
    drawIntro(Math.min(t, 2));

    // the chat: you ask, AI answers, line by line
    const a = arrive(span(t, ASK, ASK + 0.45));
    set(ask, 'opacity', a.toFixed(3));
    attr(ask, 'transform', `translate(${f2(8 * (1 - a))} 0)`);
    pop(asker, CL.x1 - 15, CL.y0 + 36, 1 + 0.35 * pulse(t, ASK + 0.1, 0.3));
    const r = arrive(span(t, REPLY, REPLY + 0.3));
    set(reply, 'opacity', r.toFixed(3));
    typed.forEach((el, i) => {
      const t0 = REPLY + 0.15 + i * 0.18;
      dash(el, arrive(span(t, t0, t0 + 0.25)));
    });
    attr(aiHalo, 'r', f2(9.5 + 3 * pulse(t, REPLY, 0.5) + 2.5 * pulse(t, LEGS[0][0] - 0.1, 0.35)));
    set(caret, 'opacity', t > SETTLE ? (breath(t - SETTLE, 1.1) > 0.5 ? 0.8 : 0).toFixed(3) : '0');

    // the token, leg by leg; each trail stays as a faint record
    let leg = -1;
    LEGS.forEach(([t0, t1], i) => {
      const u = travel(span(t, t0, t1));
      dash(routes[i].trail, u, 1 - 0.62 * span(t, t1, t1 + 0.7));
      if (t >= t0 && t <= t1 + 0.12) leg = i;
    });
    if (leg >= 0) {
      const [t0, t1] = LEGS[leg];
      const u = travel(span(t, t0, t1));
      const [x, y] = routes[leg].at(u);
      const o = Math.min(span(t, t0, t0 + 0.08), 1 - span(t, t1, t1 + 0.12));
      [dot, halo].forEach((el) => {
        attr(el, 'transform', `translate(${f2(x)} ${f2(y)})`);
        set(el, 'opacity', o.toFixed(3));
      });
    } else [dot, halo].forEach((el) => set(el, 'opacity', '0'));

    // the MCP server lights as the token passes through it
    const through = t >= LEGS[0][1] && t < LEGS[1][0] + 0.15;
    flag(hub, 'is-lit', through);
    ports.forEach((el) => flag(el, 'is-lit', through));
    pop(hub, SQ.x, SQ.y, 1 + 0.12 * pulse(t, LEGS[0][1], 0.26));

    // the document: the title struck out, then rewritten in the accent
    flag(doc, 'is-lit', t >= LEGS[1][1] && t < LEGS[2][0] + 0.2);
    dash(strike, arrive(span(t, STRIKE, STRIKE + 0.3)));
    set(oldTitle, 'opacity', (1 - 0.6 * span(t, STRIKE + 0.2, STRIKE + 0.5)).toFixed(3));
    dash(newTitle, smooth(span(t, WRITE, WRITE + 0.6)));

    // the preview renders the change; you approve it with a tick
    flag(frame, 'is-lit', t >= LEGS[2][1] && t < LEGS[3][0] + 0.2);
    rendered.forEach((el, i) => {
      const t0 = RENDER + i * 0.12;
      dash(el, arrive(span(t, t0, t0 + 0.4)));
    });
    pop(you, YOU.x, YOU.y, 1 + 0.2 * pulse(t, APPROVE, 0.3));
    dash(tick, arrive(span(t, APPROVE + 0.08, APPROVE + 0.4)));

    // the archive: the line runs on and the new commit snaps in with its snapshot
    dash(ext, arrive(span(t, COMMIT - 0.1, COMMIT + 0.2)));
    attr(fresh, 'r', f2(5.5 * snap(span(t, COMMIT, COMMIT + 0.26))));
    const s = snap(span(t, COMMIT + 0.08, COMMIT + 0.36));
    set(snapshot, 'opacity', clamp(s).toFixed(3));
    attr(snapshot, 'transform', `translate(0 ${f2(6 * (1 - s))})`);

    // labels follow the token
    const active = {
      client: t >= ASK && t < LEGS[0][1],
      mcp: through,
      preview: t >= LEGS[2][1] && t < LEGS[4][0],
      archive: t >= COMMIT - 0.1,
    };
    Object.entries(labels).forEach(([part, label]) => flag(label, 'is-active', active[part]));

    // ambient: the wash breathes and drifts slowly; on hover it leans 4px toward the pointer
    set(wash, 'opacity', (0.98 + 0.02 * breath(t, 17)).toFixed(3));
    const wx = ptr.x * 4 * kpx + 6 * Math.sin((2 * Math.PI * t) / 23);
    const wy = ptr.y * 4 * kpx + 5 * Math.sin((2 * Math.PI * t) / 31);
    attr(wash, 'transform', `translate(${f2(wx)} ${f2(wy)})`);
  }

  loop(stage, draw, { still: STILL });
}
