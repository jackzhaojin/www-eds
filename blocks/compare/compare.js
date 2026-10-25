/**
 * Compare: tabs over stacked screenshots (the explainer kit's compare). One row per pane:
 * the first cell is the tab label, the second the image paragraph and its caption.
 *
 * Without JavaScript every pane shows in turn. With it, one pane shows at a time and the
 * tabs switch them (arrow keys move between tabs). Tabs host their authored label paragraph,
 * so a tab is a focusable element with role="tab", not a <button> (EW7).
 *
 * @variants narrow | touch
 *   narrow - portrait screenshots, the compare kept at most 560px wide, each opens full size
 *   touch - tabs at least 44px tall on phones (the source's later quality pass on one article)
 */

/** Links a pane's picture to the delivered image at full size (derived, not authored). */
function openFull(pane) {
  const img = pane.querySelector('img');
  if (!img || img.closest('a')) return;
  const full = new URL(img.getAttribute('src'), window.location);
  full.searchParams.delete('width');
  const a = document.createElement('a');
  a.className = 'compare-open';
  a.href = full.href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', `Open full size: ${img.alt}`);
  const picture = img.closest('picture') || img;
  picture.before(a);
  a.append(picture);
}

export default function decorate(block) {
  const tabs = document.createElement('div');
  tabs.className = 'compare-tabs';
  tabs.setAttribute('role', 'tablist');
  const stage = document.createElement('div');
  stage.className = 'compare-stage';

  [...block.querySelectorAll(':scope > div')].forEach((row, i) => {
    const cells = [...row.children];
    const label = cells.length > 1 ? cells[0] : null;
    const content = cells[cells.length - 1];
    const tab = document.createElement('div');
    tab.className = 'compare-tab';
    tab.setAttribute('role', 'tab');
    tab.dataset.i = i;
    if (label) tab.append(...label.children);
    tabs.append(tab);
    const pane = document.createElement('figure');
    pane.className = 'compare-pane';
    pane.dataset.i = i;
    const caption = document.createElement('figcaption');
    [...content.children].forEach((el) => {
      if (el.querySelector('picture, img') || el.matches('picture, img')) pane.append(el);
      else caption.append(el);
    });
    if (caption.children.length) pane.append(caption);
    if (block.classList.contains('narrow')) openFull(pane);
    stage.append(pane);
  });

  const allTabs = [...tabs.children];
  const panes = [...stage.children];
  const show = (i) => {
    allTabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
    });
    panes.forEach((p, j) => p.classList.toggle('on', i === j));
  };
  allTabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      let d = 0;
      if (e.key === 'ArrowRight') d = 1;
      else if (e.key === 'ArrowLeft') d = -1;
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(i);
        return;
      }
      if (!d) return;
      const n = (i + d + allTabs.length) % allTabs.length;
      show(n);
      allTabs[n].focus();
    });
  });
  block.replaceChildren(tabs, stage);
  block.classList.add('is-live');
  show(0);
}
