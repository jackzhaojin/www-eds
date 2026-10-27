/**
 * Timeline: time-based portfolio structures.
 *
 * gantt (projects over time): the chart is drawn from the rows.
 *   Config rows (two cells): `range | <start> to <end>` (the scale, ISO dates), `now | <date>`
 *   (the now line), `rail | <text>` (the year rail's accessible name), `fallback | <text>`
 *   (shown only if the chart cannot be drawn), `legend | <text>` (the legend's accessible
 *   name). A row starting `scale` holds the scale labels, one cell each. A project row is
 *   label | chapter id | start | end | `ongoing` (optional: the bar runs to the now line).
 *   A one-cell paragraph row is the note under the chart; a one-cell row with a paragraph and
 *   a list is the method legend (each item opens with the bold method label).
 *   A bar opens its project: the label's link (the project page) when the label is a link,
 *   otherwise the chapter on this page. The chapter id also picks the bar color (--c-<id>).
 *   The same rows draw the year rail, a fixed dot per chapter with the current chapter lit,
 *   but only on a page that holds the chapters.
 * ladder (release history): a one-cell row is an era title; a two-cell row is a rung:
 *   version | date paragraph, heading, summary.
 * milestones (career notes): date | note per row; a last one-cell row is the closing line.
 *
 * @variants gantt | ladder | milestones (default ladder)
 * @ew-exempt gantt config cells (range, now, ids, dates, ongoing, rail, legend) are chart data
 */

const VARIANTS = ['gantt', 'ladder', 'milestones'];
const GANTT_CONFIG = ['range', 'now', 'rail', 'fallback', 'legend'];

/** Config rows stay in the block, hidden through a wrapper, so they stay editable. */
function hiddenBox(className, nodes) {
  const box = document.createElement('div');
  box.className = className;
  box.hidden = true;
  box.append(...nodes);
  return box;
}

function slot(className, nodes) {
  const div = document.createElement('div');
  div.className = className;
  div.append(...nodes);
  return div;
}

const cellText = (cell) => (cell ? cell.textContent.trim() : '');

/* ------------------------------------------------------------------ gantt */

function yearRail(projects, label) {
  if (document.querySelector('.year-rail')) return;
  if (!projects.some((p) => document.querySelector(`main .section[id="${p.id}"]`))) return;
  const rail = document.createElement('nav');
  rail.className = 'year-rail';
  if (label) rail.setAttribute('aria-label', label);
  const links = {};
  projects.forEach((p) => {
    const a = document.createElement('a');
    a.href = `#${p.id}`;
    a.style.setProperty('--dot', p.color);
    const span = document.createElement('span');
    span.textContent = p.name;
    a.append(span, document.createElement('i'));
    links[p.id] = a;
    rail.append(a);
  });
  document.querySelector('main')?.before(rail);
  const spy = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    Object.entries(links).forEach(([id, a]) => a.classList.toggle('active', id === entry.target.id));
  }), { rootMargin: '-35% 0px -55% 0px' });
  const watch = () => projects.forEach((p) => {
    const target = document.getElementById(p.id);
    if (target) spy.observe(target);
  });
  watch();
}

function gantt(block) {
  const config = {};
  const projects = [];
  const notes = [];
  const meta = [];
  let scale = null;
  let legend = null;
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    const key = cellText(cells[0]).toLowerCase();
    if (cells.length === 2 && GANTT_CONFIG.includes(key)) {
      config[key] = key === 'fallback' ? cells[1] : cellText(cells[1]);
      meta.push(...cells[0].children);
      if (key !== 'fallback') meta.push(...cells[1].children);
    } else if (key === 'scale') {
      meta.push(...cells[0].children);
      scale = slot('gantt-scale', cells.slice(1).flatMap((c) => [...c.children]));
    } else if (cells.length >= 4) {
      const [name, id, start, end, flag] = cells;
      projects.push({
        label: name,
        name: cellText(name),
        href: name.querySelector('a[href]')?.getAttribute('href') || '',
        id: cellText(id).replace(/^#/, ''),
        start: cellText(start),
        end: cellText(end),
        ongoing: /ongoing/i.test(cellText(flag)),
      });
      [id, start, end, flag].forEach((c) => { if (c) meta.push(...c.children); });
    } else if (cells.length === 1 && cells[0].querySelector('ul, ol')) [legend] = cells;
    else if (cells.length === 1 && cells[0].children.length) notes.push(cells[0]);
  });

  const [from, to] = (config.range || '').split(/\s+to\s+/);
  const START = Date.parse(from);
  const END = Date.parse(to);
  const NOW = config.now || to;
  const pct = (d) => ((Date.parse(d) - START) / (END - START)) * 100;
  projects.forEach((p) => { p.color = `var(--c-${p.id.replace(/^ch-/, '')})`; });

  const chart = document.createElement('div');
  chart.className = 'gantt-chart';
  if (scale) chart.append(scale);
  projects.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'gantt-row';
    const label = slot('gantt-label', [...p.label.children]);
    const track = document.createElement('div');
    track.className = 'gantt-track';
    const now = document.createElement('i');
    now.className = 'gantt-now';
    now.style.left = `${pct(NOW)}%`;
    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'gantt-bar';
    const left = pct(p.start);
    const width = Math.max(pct(p.ongoing ? NOW : p.end) - left, 1);
    bar.style.left = `${left.toFixed(2)}%`;
    bar.style.width = `${width.toFixed(2)}%`;
    bar.style.setProperty('--bar', p.color);
    const range = `${p.start.slice(0, 7)} to ${p.end.slice(0, 7)}`;
    bar.dataset.title = `${p.name} · ${range}`;
    bar.setAttribute('aria-label', `${p.name}, ${range}. ${p.href ? 'Open' : 'Jump to'} project.`);
    bar.addEventListener('click', () => {
      if (p.href) {
        window.location.assign(p.href);
        return;
      }
      const target = document.getElementById(p.id);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    track.append(now, bar);
    row.append(label, track);
    chart.append(row);
  });

  const parts = [chart];
  if (config.fallback) {
    const fallback = slot('gantt-fallback', [...config.fallback.children]);
    fallback.hidden = true;
    parts.push(fallback);
  }
  notes.forEach((cell) => parts.push(slot('gantt-note', [...cell.children])));
  if (legend) {
    const box = slot('gantt-legend', [...legend.children]);
    if (config.legend) box.setAttribute('aria-label', config.legend);
    parts.push(box);
  }
  if (meta.length) parts.push(hiddenBox('gantt-meta', meta));
  block.replaceChildren(...parts);
  // on narrow screens the recent end of the chart sits off to the right
  requestAnimationFrame(() => {
    if (chart.scrollWidth - chart.clientWidth > 120) chart.scrollLeft = chart.scrollWidth;
  });
  yearRail(projects, config.rail);
}

/* ------------------------------------------------------------------ ladder, milestones */

function ladder(block) {
  const parts = [];
  let era = null;
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children].filter((c) => c.children.length);
    if (cells.length === 1) {
      era = slot('ladder-era', [slot('ladder-era-title', [...cells[0].children])]);
      parts.push(era);
    } else if (cells.length >= 2) {
      const rung = slot('ladder-rung', [slot('ladder-version', [...cells[0].children])]);
      const body = slot('ladder-body', []);
      [...cells[1].children].forEach((el, i) => {
        if (i === 0 && el.tagName === 'P') body.append(slot('ladder-date', [el]));
        else if (/^H[1-6]$/.test(el.tagName)) body.append(slot('ladder-title', [el]));
        else body.append(slot('ladder-text', [el]));
      });
      rung.append(body);
      if (!era) {
        era = slot('ladder-era', []);
        parts.push(era);
      }
      era.append(rung);
    }
  });
  block.replaceChildren(...parts);
}

function milestones(block) {
  const list = slot('milestones-list', []);
  const parts = [list];
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children].filter((c) => c.children.length);
    if (cells.length >= 2) {
      list.append(slot('milestone', [slot('milestone-date', [...cells[0].children]), slot('milestone-text', [...cells[1].children])]));
    } else if (cells.length === 1) parts.push(slot('milestones-close', [...cells[0].children]));
  });
  block.replaceChildren(...parts);
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('ladder');
  if (block.classList.contains('gantt')) gantt(block);
  else if (block.classList.contains('milestones')) milestones(block);
  else ladder(block);
}
