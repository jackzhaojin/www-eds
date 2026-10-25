/**
 * Series: the parts of a multi-part series, at the end of the article head (the source's
 * nav.series). Rows:
 * - the head row: the label paragraph (Three-part series), then the series' accessible name
 *   paragraph (Series: ...), which screen readers announce for the nav and which is not shown;
 * - one row per part: a link paragraph whose link starts with the part's number in bold
 *   (<a><strong>Part 1</strong>The four practices behind release 1.0</a>).
 *
 * The part whose link is this page is marked current (derived from the URL).
 *
 * @ew-exempt name: the nav's accessible name, hidden through .series-name
 */

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

const path = (href) => new URL(href, window.location).pathname.replace(/\/?$/, '/');

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const head = rows[0] && !rows[0].querySelector('a') ? rows.shift() : null;
  const nav = document.createElement('nav');
  nav.className = 'series-nav';

  if (head) {
    const [labelCell, nameCell] = [...head.children];
    if (labelCell?.children.length) nav.append(slot('series-label', [...labelCell.children]));
    const name = nameCell?.textContent.trim();
    if (name) {
      nav.setAttribute('aria-label', name);
      nav.append(slot('series-name', [...nameCell.children]));
    }
  }

  const list = document.createElement('ol');
  list.className = 'series-parts';
  const here = path(window.location.href);
  rows.forEach((row) => {
    const nodes = [...row.children].flatMap((cell) => [...cell.children]);
    if (!nodes.length) return;
    const li = document.createElement('li');
    li.append(...nodes);
    li.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper', 'button-wrapper'));
    li.querySelectorAll('a').forEach((a) => {
      a.classList.remove('text-link', 'button', 'primary', 'secondary');
      if (path(a.href) === here) a.setAttribute('aria-current', 'page');
    });
    list.append(li);
  });
  nav.append(list);
  block.replaceChildren(nav);
}
