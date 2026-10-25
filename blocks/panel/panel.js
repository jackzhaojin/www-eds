/**
 * Panel: a bordered portfolio panel (source .panel and .panel-wide), one variant per kind.
 * Config rows (two cells, the key first): `label | <text>` is the panel's accessible name,
 * `replay | <text>` the replay control's, `max | <number>` the bakeoff scale.
 *
 * edge: a chapter-closing panel. A label row, a row of columns (heading, paragraph each), an
 *   optional closing line row.
 * pulse: the daily heartbeat. A label row, a list of counters (bold value, then its label), a
 *   replay row; the pulse line is drawn on scroll-in and on replay, the counters count up.
 * glossary: words that open their definitions. A label row, one row per word (word |
 *   definition), a last row with the readout's resting text.
 * compare: labelled before / middle / after rows. A label row, one row per stage (tag | text);
 *   the stages between the first and the last are the accented middle.
 * wire: two nodes on a wire with a request dot. A row with the two node names, a note row.
 * flow: a chain of nodes with arrows between (one row, one cell per node: name, then note).
 * bakeoff: scored bars. A label row, one row per entry (name | score), a note row, a replay
 *   row; bars grow to score / max on scroll-in and on replay.
 * Inside a story the showcase moves a pulse, glossary, compare, wire or bakeoff panel into
 * its media column.
 *
 * @variants edge | pulse | glossary | compare | wire | flow | bakeoff (default edge)
 * @ew-exempt config rows (label, replay, max) are aria-labels and a scale, not displayed text
 */

const VARIANTS = ['edge', 'pulse', 'glossary', 'compare', 'wire', 'flow', 'bakeoff'];
const CONFIG = ['label', 'replay', 'max'];
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Config rows stay in the block, hidden through a wrapper, so they stay editable. */
function hiddenBox(className, nodes) {
  const box = document.createElement('div');
  box.className = className;
  box.hidden = true;
  box.append(...nodes);
  return box;
}

function slot(className, nodes, tag = 'div') {
  const el = document.createElement(tag);
  el.className = className;
  el.append(...nodes);
  return el;
}

function readRows(block) {
  const config = {};
  const rows = [];
  const meta = [];
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    const key = cells.length === 2 ? cells[0].textContent.trim().toLowerCase() : '';
    if (CONFIG.includes(key)) {
      config[key] = cells[1].textContent.trim();
      cells.forEach((c) => meta.push(...c.children));
    } else if (row.textContent.trim() || row.querySelector('img')) {
      rows.push(cells.filter((c) => c.children.length || c.textContent.trim()));
    }
  });
  return { config, rows, meta };
}

function onceVisible(el, threshold, fn) {
  new IntersectionObserver((entries, obs) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    obs.disconnect();
    fn();
  }, { threshold }).observe(el);
}

/** A focusable host for an authored paragraph that acts as a button (never <button>). */
function controlHost(className, nodes, label, onAct) {
  const host = slot(className, nodes);
  host.setAttribute('role', 'button');
  host.tabIndex = 0;
  if (label) host.setAttribute('aria-label', label);
  host.addEventListener('click', onAct);
  host.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAct();
    }
  });
  return host;
}

/** Counters count up from zero once, then on replay; the authored value is the end state. */
function countUp(list) {
  if (reduceMotion()) return;
  list.querySelectorAll('li').forEach((li) => {
    const strong = li.querySelector('strong');
    const host = strong?.querySelector('em') || strong;
    const target = parseInt(host?.textContent || '', 10);
    if (!host || Number.isNaN(target) || target === 0) return;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const t = Math.min((ts - start) / 1200, 1);
      host.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

const counters = (cell) => slot('panel-counters', [...cell.children]);

/* ------------------------------------------------------------------ variants */

function edge(rows) {
  const parts = [];
  let grid = false;
  rows.forEach((cells) => {
    if (cells.length > 1 || (cells[0] && cells[0].querySelector('h1, h2, h3, h4, h5, h6'))) {
      grid = true;
      parts.push(slot('panel-grid', cells.map((c) => slot('panel-col', [...c.children]))));
    } else if (!grid) parts.push(slot('panel-label', [...cells[0].children]));
    else parts.push(slot('panel-close', [...cells[0].children]));
  });
  return parts;
}

const PULSE_POINTS = '0,60 120,60 150,60 165,18 185,102 200,60 320,60 350,60 365,26 383,96 398,60 560,60';

function pulse(block, rows, config) {
  const parts = [];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'panel-pulse');
  svg.setAttribute('viewBox', '0 0 560 120');
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('fill', 'none');
  line.setAttribute('points', PULSE_POINTS);
  svg.append(line);
  let list = null;
  rows.forEach((cells) => {
    const cell = cells[0];
    if (!cell) return;
    if (cell.querySelector('ul, ol')) {
      list = counters(cell);
      parts.push(svg, list);
    } else if (!list) parts.push(slot('panel-label', [...cell.children]));
    else parts.push(controlHost('panel-replay', [...cell.children], config.replay, () => { block.run(); }));
  });
  if (!list) parts.push(svg);
  const draw = () => {
    if (reduceMotion()) return;
    line.animate([{ strokeDasharray: '1400', strokeDashoffset: '1400' }, { strokeDasharray: '1400', strokeDashoffset: '0' }], {
      duration: 2800, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'backwards',
    });
  };
  block.run = () => {
    draw();
    if (list) countUp(list);
  };
  onceVisible(block, 0.4, draw);
  if (list) onceVisible(list, 0.5, () => countUp(list));
  return parts;
}

function glossary(rows) {
  const parts = [];
  const chips = slot('panel-chips', []);
  const readout = slot('panel-readout', []);
  readout.setAttribute('aria-live', 'polite');
  const defs = [];
  let resting = null;
  rows.forEach((cells) => {
    if (cells.length === 2) {
      const def = slot('panel-def', [...cells[1].children]);
      def.hidden = true;
      defs.push(def);
      readout.append(def);
      const chip = controlHost('panel-chip', [...cells[0].children], '', () => {
        chips.querySelectorAll('.panel-chip').forEach((c) => {
          c.classList.toggle('lit', c === chip);
          c.setAttribute('aria-pressed', String(c === chip));
        });
        defs.forEach((d) => { d.hidden = d !== def; });
        if (resting) resting.hidden = true;
      });
      chip.setAttribute('aria-pressed', 'false');
      chips.append(chip);
    } else if (!chips.children.length) parts.push(slot('panel-label', [...cells[0].children]));
    else {
      resting = slot('panel-resting', [...cells[0].children]);
      readout.prepend(resting);
    }
  });
  parts.push(chips, readout);
  return parts;
}

function compare(rows) {
  const parts = [];
  const stages = rows.filter((cells) => cells.length === 2);
  const list = slot('panel-stages', []);
  rows.forEach((cells) => {
    if (cells.length === 2) {
      const i = stages.indexOf(cells);
      const stage = slot('panel-stage', [slot('panel-tag', [...cells[0].children]), slot('panel-text', [...cells[1].children])]);
      if (i > 0 && i < stages.length - 1) stage.classList.add('mid');
      list.append(stage);
    } else parts.push(slot('panel-label', [...cells[0].children]));
  });
  parts.push(list);
  return parts;
}

function wire(block, rows) {
  const parts = [];
  rows.forEach((cells) => {
    if (cells.length > 1) {
      cells.forEach((cell, i) => {
        if (i > 0) {
          const w = document.createElement('div');
          w.className = 'panel-wire';
          const go = document.createElement('i');
          go.className = 'panel-dot';
          const back = document.createElement('i');
          back.className = 'panel-dot back';
          w.append(go, back);
          parts.push(w);
        }
        parts.push(slot('panel-node', [...cell.children]));
      });
    } else parts.push(slot('panel-note', [...cells[0].children]));
  });
  if (!reduceMotion()) onceVisible(block, 0.4, () => block.classList.add('run'));
  return parts;
}

function flow(rows) {
  const parts = [];
  rows.forEach((cells) => cells.forEach((cell) => {
    if (parts.length) {
      const arrow = document.createElement('span');
      arrow.className = 'panel-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      parts.push(arrow);
    }
    const [name, ...rest] = [...cell.children];
    parts.push(slot('panel-node', [slot('panel-name', name ? [name] : []), ...rest.map((el) => slot('panel-sub', [el]))]));
  }));
  return parts;
}

function bakeoff(block, rows, config) {
  const parts = [];
  const max = parseFloat(config.max) || 100;
  const bars = slot('panel-bars', []);
  const entries = [];
  let note = false;
  rows.forEach((cells) => {
    if (cells.length === 2) {
      const bar = document.createElement('i');
      bar.className = 'panel-bar';
      const score = parseFloat(cells[1].textContent) || 0;
      entries.push([bar, score]);
      bars.append(slot('panel-entry', [slot('panel-name', [...cells[0].children]), bar, slot('panel-score', [...cells[1].children])]));
    } else if (!bars.children.length) parts.push(slot('panel-label', [...cells[0].children]));
    else if (!note) {
      note = true;
      parts.push(bars, slot('panel-note', [...cells[0].children]));
    } else parts.push(controlHost('panel-replay', [...cells[0].children], config.replay, () => block.run()));
  });
  if (!parts.includes(bars)) parts.splice(1, 0, bars);
  const grow = () => entries.forEach(([bar, score]) => { bar.style.width = `${((score / max) * 100).toFixed(1)}%`; });
  block.run = () => {
    block.classList.remove('run');
    entries.forEach(([bar]) => { bar.style.width = '0'; });
    // eslint-disable-next-line no-void
    void block.offsetWidth;
    block.classList.add('run');
    grow();
  };
  if (reduceMotion()) grow();
  else onceVisible(block, 0.4, () => block.run());
  return parts;
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('edge');
  const variant = VARIANTS.find((v) => block.classList.contains(v));
  const { config, rows, meta } = readRows(block);
  if (config.label) block.setAttribute('aria-label', config.label);
  let parts;
  if (variant === 'pulse') parts = pulse(block, rows, config);
  else if (variant === 'glossary') parts = glossary(rows);
  else if (variant === 'compare') parts = compare(rows);
  else if (variant === 'wire') parts = wire(block, rows);
  else if (variant === 'flow') parts = flow(rows);
  else if (variant === 'bakeoff') parts = bakeoff(block, rows, config);
  else parts = edge(rows);
  if (meta.length) parts.push(hiddenBox('panel-meta', meta));
  block.replaceChildren(...parts);
}
