/**
 * Jump links: the portfolio's in-page navigation to its parts (source nav.portfolio-jumps).
 * One cell with a list of links (or link paragraphs); an optional config row
 * `label | <text>` names the navigation for assistive tech.
 *
 * @ew-exempt the label row is the navigation's aria-label, not displayed text
 */

/** Config rows stay in the block, hidden through a wrapper, so they stay editable. */
function hiddenBox(className, nodes) {
  const box = document.createElement('div');
  box.className = className;
  box.hidden = true;
  box.append(...nodes);
  return box;
}

export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'jump-links-nav';
  const meta = [];
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 2 && cells[0].textContent.trim().toLowerCase() === 'label') {
      nav.setAttribute('aria-label', cells[1].textContent.trim());
      cells.forEach((c) => meta.push(...c.children));
      return;
    }
    cells.forEach((cell) => nav.append(...cell.children));
  });
  nav.querySelectorAll('p.text-link-wrapper').forEach((p) => p.classList.remove('text-link-wrapper'));
  nav.querySelectorAll('a.text-link').forEach((a) => a.classList.remove('text-link'));
  block.replaceChildren(nav, ...(meta.length ? [hiddenBox('jump-links-meta', meta)] : []));
}
