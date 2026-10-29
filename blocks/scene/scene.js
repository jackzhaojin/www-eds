/**
 * Scene: a project's animated hero art (the portfolio's project pages). The variant word names
 * its engine: blocks/scene/engines/<word>.js and <word>.css, loaded on demand without holding up
 * the section. The engine draws the art (SVG or canvas, decoration under one role="img" box);
 * the scene's text is authored in the rows and stays HTML, placed over the art by the engine, so
 * every word stays editable in Experience Workspace and readable without the drawing.
 *
 * Rows, two cells each, classified by the first cell (a key):
 * - `label | <text>`: the art's accessible name;
 * - `caption | <text>`: the caption under the art;
 * - `pause | <text>` and `play | <text>` (optional): the pause control's names;
 * - `<part> | <text>`: a label the engine places at that part of the scene. Each engine's JSDoc
 *   lists its parts; a label with a part the engine doesn't place joins the caption's list.
 * A label cell may hold more than one paragraph (a bold name, then a short line).
 *
 * Placement: authored right after a chapter head, the scene moves into the head: beside the title
 * from the top of the head on wide screens, under the heading on narrow ones.
 * Anywhere else it stands alone. The stage is square in every engine, so its size is known
 * before the engine arrives (nothing shifts as it draws).
 *
 * Motion: an engine draws through kit.loop, which runs only while the scene is on screen, the tab
 * is visible and the reader hasn't paused it (the control in the stage's corner), and draws one
 * still frame under prefers-reduced-motion.
 *
 * Thumbnail mode (`data-mode="thumb"` on the block, set by a listing that copies a project
 * page's scene, such as the portfolio hub's gallery): no pause control, the clock starts at the
 * engine's still, and while paused the engine's reduceMotion() is true, so it shows its designed
 * still; it plays on from there when the host removes `is-paused` and dispatches `scene-pause` on
 * the block (and pauses the same way).
 *
 * @variants one engine per word in blocks/scene/engines/ (each engine's JSDoc lists its word)
 * @ew-exempt the first cell of each row is a key (config), not displayed text; the label, pause
 *   and play rows are aria-labels
 */
import { loadCSS } from '../../scripts/aem.js';

const ENGINE = /^[a-z][a-z0-9-]*$/;
const SVG_NS = 'http://www.w3.org/2000/svg';
const DARK_OS = window.matchMedia('(prefers-color-scheme: dark)');
const MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

export const reduceMotion = () => MOTION.matches;

/** A wrapper div with a layout class around existing (moved) nodes. */
export function slot(name, nodes = []) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

/** An SVG element with attributes, appended to parent when given. */
export function svg(name, attrs = {}, parent = null) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => { if (v != null) el.setAttribute(k, v); });
  if (parent) parent.append(el);
  return el;
}

/** The theme's colors as the scene sees them (its section's accent included), for canvas. */
export function palette(el) {
  const cs = getComputedStyle(el);
  const read = (...names) => names.map((n) => cs.getPropertyValue(n).trim()).find(Boolean) || '';
  return {
    accent: read('--accent', '--color-accent'),
    ink: read('--color-text'),
    muted: read('--color-text-muted'),
    faint: read('--color-text-faint'),
    line: read('--color-line'),
    bg: read('--color-bg'),
    surface: read('--color-surface'),
    dark: document.documentElement.dataset.themeEffective === 'dark'
      || (!document.documentElement.dataset.theme && DARK_OS.matches),
  };
}

/** Calls fn(palette) now and whenever the theme changes. */
export function onTheme(el, fn) {
  let last = '';
  const run = () => {
    const p = palette(el);
    const key = JSON.stringify(p);
    if (key !== last) {
      last = key;
      fn(p);
    }
  };
  new MutationObserver(run).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-theme-effective'] });
  DARK_OS.addEventListener('change', run);
  run();
}

/** Parses a CSS color (#hex or rgb()) to [r, g, b]; anything else is mid grey. */
export function rgb(value) {
  const hex = String(value).match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length < 6) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const m = String(value).match(/(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [128, 128, 128];
}

/** rgba() of a CSS color at an alpha. */
export const alpha = (value, a) => `rgba(${rgb(value).join(', ')}, ${a})`;

/**
 * A canvas filling the stage at the device pixel ratio, kept sized as the stage resizes. The
 * context is scaled so the engine draws in `size` units (the stage's square, CSS pixels).
 */
export function canvas(stage, onResize = () => {}) {
  const el = document.createElement('canvas');
  el.className = 'scene-canvas';
  stage.append(el);
  const ctx = el.getContext('2d');
  const state = {
    el, ctx, size: 0, dpr: 1,
  };
  const fit = () => {
    const size = stage.clientWidth;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!size || (size === state.size && dpr === state.dpr)) return;
    Object.assign(state, { size, dpr });
    el.width = Math.round(size * dpr);
    el.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize(state);
  };
  new ResizeObserver(fit).observe(stage);
  fit();
  return state;
}

/**
 * Runs draw(t, dt) every frame while the stage is on screen and the tab is visible; t is the
 * scene's own clock in seconds (paused time left out), starting at 0 when it first shows.
 * Under prefers-reduced-motion it draws one frame at `still` and stops. Returns a redraw
 * function (for a theme or size change while paused).
 */
export function loop(stage, draw, { still = 0 } = {}) {
  const scene = stage.closest('.scene');
  let t = scene?.dataset.mode === 'thumb' ? still : 0;
  let last = 0;
  let raf = 0;
  let onScreen = false;
  const frame = (now) => {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    t += dt;
    draw(t, dt);
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    const run = onScreen && !document.hidden && !reduceMotion() && !scene?.classList.contains('is-paused');
    scene?.classList.toggle('is-playing', run);
    if (run && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const redraw = () => { if (!raf) draw(reduceMotion() ? still : t, 0); };
  new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    sync();
  }, { rootMargin: '80px' }).observe(stage);
  document.addEventListener('visibilitychange', sync);
  scene?.addEventListener('scene-pause', sync);
  MOTION.addEventListener('change', () => {
    sync();
    redraw();
  });
  redraw();
  return redraw;
}

/**
 * The pointer over the stage, eased: { x, y } in -1..1 from the center, 0 when away. Call
 * update(dt) once a frame; for parallax and hover, never for anything a reader needs.
 */
export function pointer(stage) {
  const p = {
    x: 0, y: 0, tx: 0, ty: 0, over: false,
  };
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    p.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    p.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    p.over = true;
  });
  stage.addEventListener('pointerleave', () => {
    p.tx = 0;
    p.ty = 0;
    p.over = false;
  });
  p.update = (dt) => {
    const k = 1 - Math.exp(-dt * 4);
    p.x += (p.tx - p.x) * k;
    p.y += (p.ty - p.y) * k;
  };
  return p;
}

/** A seeded random in 0..1 (Park-Miller), so a scene draws the same on every visit. */
export function random(seed = 1) {
  let a = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  return () => {
    a = (a * 16807) % 2147483647;
    return (a - 1) / 2147483646;
  };
}

/**
 * The pause control (WCAG 2.2.2: motion that runs past five seconds can be stopped). Its names
 * come from the optional `pause` and `play` rows; a paused scene keeps its frame.
 */
function pauseControl(block, names) {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'scene-toggle';
  const sync = () => {
    const paused = block.classList.contains('is-paused');
    toggle.setAttribute('aria-label', paused ? names.play : names.pause);
    toggle.setAttribute('aria-pressed', String(paused));
  };
  toggle.addEventListener('click', () => {
    block.classList.toggle('is-paused');
    sync();
    block.dispatchEvent(new CustomEvent('scene-pause'));
  });
  sync();
  return toggle;
}

/**
 * Moves the scene into the chapter head it follows: before the head's heading on wide screens,
 * where it floats right from the top of the head (beside the title), and after it on narrow
 * ones, where it sits under the title. The breakpoint is chapter-head.css's.
 */
function joinChapterHead(block) {
  const wrapper = block.parentElement;
  const head = wrapper?.previousElementSibling?.querySelector(':scope > .chapter-head');
  const heading = head?.querySelector('.chapter-head-heading');
  if (!heading) return;
  const wide = window.matchMedia('(width >= 1180px)');
  const put = () => (wide.matches ? heading.before(wrapper) : heading.after(wrapper));
  wide.addEventListener('change', put);
  put();
  head.classList.add('has-scene');
}

export default async function decorate(block) {
  const engine = [...block.classList].find((c) => c !== 'scene' && c !== 'block' && ENGINE.test(c));
  const figure = document.createElement('figure');
  figure.className = 'scene-figure';
  const stage = slot('scene-stage');
  stage.setAttribute('role', 'img');
  const labels = slot('scene-labels');
  const config = slot('scene-config');
  config.hidden = true;
  const caption = document.createElement('figcaption');
  caption.className = 'scene-caption';
  const parts = new Map();
  const names = { pause: 'Pause the animation', play: 'Play the animation' };

  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const [keyCell, valueCell] = [...row.children];
    const key = keyCell?.textContent.trim().toLowerCase().replace(/\s+/g, '-') || '';
    if (!valueCell) {
      if (keyCell) caption.append(...keyCell.children);
      return;
    }
    config.append(...keyCell.children);
    if (key === 'label' || key === 'pause' || key === 'play') {
      if (key === 'label') stage.setAttribute('aria-label', valueCell.textContent.trim());
      else names[key] = valueCell.textContent.trim();
      config.append(...valueCell.children);
    } else if (key === 'caption') caption.append(slot('scene-caption-text', [...valueCell.children]));
    else {
      const label = slot(`scene-label scene-label-${key}`, [...valueCell.children]);
      label.dataset.part = key;
      parts.set(key, label);
      labels.append(label);
    }
  });

  figure.append(stage, labels);
  const thumb = block.dataset.mode === 'thumb';
  if (thumb) block.classList.add('is-paused');
  else if (engine) figure.append(pauseControl(block, names));
  if (caption.children.length) figure.append(caption);
  block.replaceChildren(figure, config);
  joinChapterHead(block);
  if (!engine) return;

  /** Places a part's label at (x, y) of a size-unit square, anchored by align. */
  const place = (part, x, y, size = 100, align = 'center') => {
    const label = parts.get(part);
    if (!label) return null;
    label.style.setProperty('--x', `${(x / size) * 100}%`);
    label.style.setProperty('--y', `${(y / size) * 100}%`);
    label.dataset.align = align;
    label.classList.add('is-placed');
    return label;
  };

  const base = `${window.hlx.codeBasePath}/blocks/scene/engines/${engine}`;
  // the engine arrives after the section shows, so the head (the page's LCP) never waits on it;
  // an engine may come without CSS
  Promise.all([import(`${base}.js`), loadCSS(`${base}.css`).catch(() => {})])
    .then(([mod]) => mod.default(block, {
      stage,
      labels,
      parts,
      caption,
      place,
      slot,
      svg,
      canvas,
      loop,
      pointer,
      palette,
      onTheme,
      rgb,
      alpha,
      random,
      // a paused thumbnail is drawn as the engine's designed still, and plays on from there
      reduceMotion: () => reduceMotion() || (thumb && block.classList.contains('is-paused')),
    }))
    .then(() => {
      parts.forEach((label) => {
        if (!label.classList.contains('is-placed')) caption.append(label);
      });
      if (caption.children.length && !caption.parentElement) figure.append(caption);
      block.classList.add('is-ready');
    })
    .catch(() => block.classList.add('is-fallback'));
}
