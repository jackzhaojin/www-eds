/**
 * Stats (lifetime): a centered wide panel of counters (source .cea-lifetime): a label row, a
 * list of counters (the bold value, then its label; a bold and italic value is the accented
 * one), a closing note row. The counters count up once from zero when the row scrolls into
 * view; the authored value is the end state. An optional config row `label | <text>` names
 * the panel for assistive tech.
 *
 * @variants lifetime (default lifetime)
 * @ew-exempt the label row is the panel's aria-label, not displayed text
 */

const VARIANTS = ['lifetime'];

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

function countUp(list) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('lifetime');
  const parts = [];
  const meta = [];
  let list = null;
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 2 && cells[0].textContent.trim().toLowerCase() === 'label') {
      block.setAttribute('aria-label', cells[1].textContent.trim());
      cells.forEach((c) => meta.push(...c.children));
      return;
    }
    cells.forEach((cell) => {
      if (!cell.children.length) return;
      if (cell.querySelector('ul, ol')) {
        list = slot('stats-counters', [...cell.children]);
        parts.push(list);
      } else parts.push(slot(list ? 'stats-note' : 'stats-label', [...cell.children]));
    });
  });
  if (meta.length) parts.push(hiddenBox('stats-meta', meta));
  block.replaceChildren(...parts);
  if (list) {
    new IntersectionObserver((entries, obs) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      obs.disconnect();
      countUp(list);
    }, { threshold: 0.5 }).observe(list);
  }
}
