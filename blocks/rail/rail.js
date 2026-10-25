/**
 * Rail: the article outline ("On this page"), the right rail of the article template.
 * One row per entry: a thumbnail cell (optional), then one paragraph: the part label in bold,
 * a line break, then the link (its text is the short title, its href the part, like #part-1).
 * A row with a single cell holds the rail's closing links. Each entry is one link around its
 * thumbnail and that paragraph (card-as-link, EW6), so it reads as one link, as on the source.
 *
 * The rail marks the current part, shows the reading progress of the column, and starts
 * closed on narrow screens, where it sits above the article.
 *
 * @variants (none)
 * @ew-exempt summary "On this page" - interface chrome, not authored
 */

const NARROW = window.matchMedia('(width <= 1080px)');

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function plainLink(p) {
  p.classList.remove('text-link-wrapper', 'button-wrapper');
  p.querySelectorAll('a').forEach((a) => a.classList.remove('text-link', 'button', 'primary', 'secondary'));
  return p;
}

function entry(row) {
  const cells = [...row.children];
  const textCell = cells[cells.length - 1];
  const media = row.querySelector('picture, img');
  const mediaNode = media ? (media.closest('p') || media) : null;
  const paras = [...textCell.children].filter((el) => el !== mediaNode);
  const linkP = paras.find((p) => p.querySelector('a[href]'));
  if (!linkP) return null;
  const link = linkP.querySelector('a[href]');
  const a = document.createElement('a');
  a.href = link.getAttribute('href');
  plainLink(linkP);
  link.replaceWith(...link.childNodes);
  // Thumbnails load even while the rail starts closed on phones, as on the source.
  if (media) (media.matches('img') ? media : media.querySelector('img')).loading = 'eager';
  if (mediaNode) a.append(slot('rail-thumb', [mediaNode]));
  else a.classList.add('rail-plain');
  a.append(slot('rail-text', paras.map((p) => slot(p === linkP ? 'rail-title' : 'rail-num', [p]))));
  const li = document.createElement('li');
  li.append(a);
  return li;
}

function track(details, list, bar) {
  const body = document.querySelector('.article-body') || document.querySelector('main');
  const links = [...list.querySelectorAll('a[href^="#"]')];
  // Targets are looked up each time: a block may set its anchor ids after the rail decorates.
  const target = (a) => document.getElementById(decodeURIComponent(a.hash.slice(1)));
  const layout = () => {
    details.open = !NARROW.matches;
  };
  let shown = -1;
  // A tall rail that scrolls keeps the current entry in view (the source's adaptTo page).
  const reveal = (a) => {
    const rail = details.closest('.article-rail');
    if (!rail || rail.scrollHeight <= rail.clientHeight) return;
    const b = a.getBoundingClientRect();
    const r = rail.getBoundingClientRect();
    const near = b.top < r.top + 48 || b.bottom > r.bottom - 48;
    if (near) rail.scrollTop += b.top - r.top - r.height / 3;
  };
  const current = () => {
    const line = window.innerHeight / 3;
    let active = 0;
    links.forEach((a, i) => {
      const t = target(a);
      if (t && t.getBoundingClientRect().top <= line) active = i;
    });
    links.forEach((a, i) => {
      if (i === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (active !== shown && links[active]) {
      shown = active;
      if (!NARROW.matches) reveal(links[active]);
    }
    const r = body.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const done = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1;
    bar.style.transform = `scaleX(${done.toFixed(3)})`;
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      current();
    });
  };
  links.forEach((a) => a.addEventListener('click', () => {
    if (NARROW.matches) details.open = false;
  }));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  NARROW.addEventListener('change', layout);
  layout();
  current();
}

export default function decorate(block) {
  const details = document.createElement('details');
  details.className = 'rail-outline';
  details.open = true;
  const summary = document.createElement('summary');
  summary.textContent = 'On this page';
  const progress = document.createElement('div');
  progress.className = 'rail-progress';
  progress.setAttribute('aria-hidden', 'true');
  const bar = document.createElement('span');
  progress.append(bar);
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Article sections');
  const list = document.createElement('ol');
  list.className = 'rail-list';
  nav.append(list);
  const extra = document.createElement('div');
  extra.className = 'rail-links';

  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    if (row.children.length === 1 && !row.querySelector('picture, img')) {
      [...row.firstElementChild.children].forEach((el) => extra.append(plainLink(el)));
      return;
    }
    const li = entry(row);
    if (li) list.append(li);
  });

  details.append(summary, progress, nav);
  if (extra.children.length) details.append(extra);
  block.replaceChildren(details);
  track(details, list, bar);
}
