/**
 * Plate: what the deck's logic plates share (the Sites and AI webinar's demo slides). A plate is
 * a 500 unit square drawn in strokes, its story a list of timed beats: each element draws on or
 * fades in at its time, may fade out later, and may move along waypoints. All of it is a function
 * of the scene's clock, so replay and reduced motion work without more code. A person is an ink
 * ring, AI an accent disc, automation a faint square, and text is ruled lines, never words.
 *
 *   const p = plate(kit);
 *   p.paper(52, 120, 128, 56, 0.4);        // a card, drawn on at 0.4 s
 *   const ring = p.ring(0.6);              // the ring, at the origin until p.move places it
 *   p.move(ring, 40, 130, [[1, 0.5, 40, 200]]);  // starts at (40, 130); at 1 s, 0.5 s to (40, 200)
 *   p.label('me', 40, 96, 'left', 0.5);    // the part's label, placed and shown at 0.5 s
 *   p.play(9);                             // runs; 9 is the still under reduced motion
 *
 * An engine's CSS imports plate.css.
 */
const W = 500;
const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, a, d) => clamp((t - a) / d);
const arrive = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));
const travel = (x) => x * x * (3 - 2 * x);
const breath = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p);

/** A rounded rectangle's attributes. */
export const rect = (x, y, w, h, r = 4) => ({
  x, y, width: w, height: h, rx: r,
});

export default function plate(kit) {
  const {
    stage, svg, place, loop,
  } = kit;
  const id = `plate-${Math.random().toString(36).slice(2, 8)}`;
  const root = svg('svg', {
    class: 'plate', viewBox: `0 0 ${W} ${W}`, 'aria-hidden': 'true', focusable: 'false',
  });
  const grad = svg('radialGradient', { id: `${id}-wash` }, svg('defs', {}, root));
  svg('stop', { offset: '0', class: 'plate-wash' }, grad);
  svg('stop', { offset: '1', class: 'plate-wash is-end' }, grad);
  const wash = svg('circle', {
    cx: 250, cy: 250, r: 230, fill: `url(#${id}-wash)`,
  }, root);

  const beats = new Map();
  const moves = [];
  const halos = [];
  const beat = (el, kind, t0, d) => {
    beats.set(el, { kind, t0, d });
    return el;
  };

  /** A stroke that draws on from its start. */
  const stroke = (name, attrs, cls, t0, d = 0.6, parent = root) => beat(svg(name, {
    ...attrs, class: cls, pathLength: 1,
  }, parent), 'draw', t0, d);
  /** Anything that fades in. */
  const show = (name, attrs, cls, t0, d = 0.5, parent = root) => beat(svg(name, {
    ...attrs, class: cls,
  }, parent), 'fade', t0, d);
  /** Fades out what stroke or show made. */
  const hide = (el, t0, d = 0.4) => {
    Object.assign(beats.get(el), { out: t0, outD: d });
    return el;
  };
  const line = (d, cls, t0, dur = 0.5, parent = root) => stroke('path', { d }, cls, t0, dur, parent);
  /** A card, drawn on. */
  const paper = (x, y, w, h, t0, parent = root) => stroke('rect', rect(x, y, w, h), 'plate-paper', t0, 0.6, parent);
  /** Ruled lines of the given lengths, one under another, written in turn. */
  const lines = (x, y, widths, gap, t0, each = 0.2, cls = 'plate-line', parent = root) => widths.map((w, i) => line(
    `M${x} ${y + i * gap}h${w}`,
    cls,
    t0 + i * each,
    each,
    parent,
  ));
  /** You: the ink ring, at the origin until moved. */
  const ring = (t0, parent = root) => {
    const g = beat(svg('g', {}, parent), 'fade', t0, 0.5);
    svg('circle', { r: 9, class: 'plate-ring' }, g);
    return g;
  };
  /** AI: the accent disc and its halo, at the origin until moved. */
  const disc = (t0, parent = root) => {
    const g = beat(svg('g', {}, parent), 'fade', t0, 0.5);
    halos.push(svg('circle', { r: 14, class: 'plate-halo' }, g));
    svg('circle', { r: 7, class: 'plate-disc' }, g);
    return g;
  };
  /** Automation: the faint square, centered at (x, y). */
  const square = (x, y, t0, parent = root) => show('rect', rect(x - 8, y - 8, 16, 16, 3.5), 'plate-auto', t0, 0.4, parent);
  const tick = (x, y, t0, cls = 'plate-tick', parent = root) => line(
    `M${x - 7} ${y}l4.5 5l9.5 -11`,
    cls,
    t0,
    0.25,
    parent,
  );
  const cross = (x, y, t0, parent = root) => line(`M${x - 5} ${y - 5}l10 10m0 -10l-10 10`, 'plate-hot', t0, 0.25, parent);
  /** Moves a group: from (x, y), then each [start, seconds, x, y] in turn. */
  const move = (el, x, y, keys = []) => {
    moves.push({
      el, x, y, keys, last: '',
    });
    return el;
  };
  /** Places a part's label, shown from t0; null when it isn't authored. */
  const label = (part, x, y, align = 'center', t0 = 0) => {
    const el = place(part, x, y, W, align);
    if (el) beat(el, 'fade', t0, 0.5);
    return el;
  };
  const leader = (d, t0) => line(d, 'plate-leader', t0, 0.4);

  const style = (el, prop, v) => {
    if (el[`_${prop}`] !== v) {
      el[`_${prop}`] = v;
      el.style.setProperty(prop, v);
    }
  };

  function draw(t) {
    beats.forEach(({
      kind, t0, d, out, outD,
    }, el) => {
      const p = arrive(span(t, t0, d));
      const o = p * (out == null ? 1 : 1 - span(t, out, outD));
      if (kind === 'draw') style(el, 'stroke-dasharray', `${p.toFixed(4)} 2`);
      style(el, 'opacity', (kind === 'draw' ? Number(p > 0.0005) * o : o).toFixed(3));
    });
    moves.forEach((m) => {
      let { x, y } = m;
      m.keys.some(([t0, d, nx, ny]) => {
        const u = travel(span(t, t0, d));
        x += (nx - x) * u;
        y += (ny - y) * u;
        return u < 1;
      });
      const at = `translate(${x.toFixed(2)} ${y.toFixed(2)})`;
      if (at !== m.last) {
        m.last = at;
        m.el.setAttribute('transform', at);
      }
    });
    halos.forEach((h) => h.setAttribute('r', (14 + 1.8 * breath(t, 3.4)).toFixed(2)));
    style(wash, 'opacity', (0.96 + 0.04 * breath(t, 17)).toFixed(3));
  }

  /** Adds the plate to the stage and runs it. */
  const play = (still) => {
    stage.append(root);
    new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w) root.style.setProperty('--k', (W / w).toFixed(3));
    }).observe(stage);
    loop(stage, draw, { still });
  };

  return {
    root,
    svg,
    stroke,
    show,
    hide,
    line,
    paper,
    lines,
    ring,
    disc,
    square,
    tick,
    cross,
    move,
    label,
    leader,
    play,
  };
}
