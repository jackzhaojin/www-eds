/**
 * Tabs (diagram-deck): a deck of diagrams behind numbered tabs (source div.diagram-deck): a
 * toolbar with the deck label and the position, a tab per pane, one pane shown at a time.
 *
 * Content: an optional config row `label | <text>` names the tab list; a one-cell row is the
 * toolbar label; then one row per pane: tab label | pane (eyebrow paragraph, heading, summary
 * paragraph, the diagram image paragraph, linked to the full-size file). The tab numbers and
 * the position (01 / 06) are the panes' order.
 * Tabs are focusable role="tab" hosts (never <button>); arrows, Home and End move between them.
 *
 * @variants diagram-deck (default diagram-deck)
 * @ew-exempt the label row is the tab list's aria-label; the numbers and the position are derived
 */

const VARIANTS = ['diagram-deck'];
let deckCount = 0;

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

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('diagram-deck');
  deckCount += 1;
  const uid = `deck${deckCount}`;
  let label = '';
  let toolbarLabel = [];
  const panes = [];
  const meta = [];
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children].filter((c) => c.children.length || c.textContent.trim());
    if (cells.length === 2 && cells[0].textContent.trim().toLowerCase() === 'label') {
      label = cells[1].textContent.trim();
      cells.forEach((c) => meta.push(...c.children));
    } else if (cells.length === 1) toolbarLabel = [...cells[0].children];
    else if (cells.length >= 2) panes.push(cells);
  });

  const total = String(panes.length).padStart(2, '0');
  const toolbar = slot('tabs-toolbar', []);
  toolbar.setAttribute('aria-hidden', 'true');
  const position = document.createElement('span');
  position.className = 'tabs-position';
  const current = document.createElement('b');
  current.textContent = '01';
  position.append(current, ` / ${total}`);
  toolbar.append(slot('tabs-label', toolbarLabel), position);

  const list = slot('tabs-list', []);
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-orientation', 'horizontal');
  if (label) list.setAttribute('aria-label', label);
  const stack = slot('tabs-panes', []);
  const tabs = [];
  panes.forEach(([tabCell, paneCell], i) => {
    const num = String(i + 1).padStart(2, '0');
    const tab = slot('tabs-tab', []);
    tab.id = `${uid}-tab-${i + 1}`;
    tab.setAttribute('role', 'tab');
    const n = document.createElement('span');
    n.className = 'tabs-num';
    n.textContent = num;
    tab.append(n, ...tabCell.children);
    const pane = document.createElement('figure');
    pane.className = 'tabs-pane';
    pane.id = `${uid}-pane-${i + 1}`;
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-labelledby', tab.id);
    tab.setAttribute('aria-controls', pane.id);
    const head = document.createElement('figcaption');
    head.className = 'tabs-pane-head';
    const text = slot('tabs-pane-text', []);
    let eyebrow = null;
    [...paneCell.children].forEach((el) => {
      if (el.querySelector('picture, img')) pane.append(slot('tabs-pane-media', [el]));
      else if (!eyebrow && el.tagName === 'P' && !text.children.length) {
        eyebrow = slot('tabs-eyebrow', [el]);
        head.append(eyebrow);
      } else if (/^H[1-6]$/.test(el.tagName)) text.append(slot('tabs-pane-title', [el]));
      else text.append(slot('tabs-pane-summary', [el]));
    });
    head.append(text);
    pane.prepend(head);
    tabs.push(tab);
    list.append(tab);
    stack.append(pane);
  });

  const activate = (tab, focus, animate) => {
    tabs.forEach((t, i) => {
      const on = t === tab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const pane = stack.children[i];
      pane.hidden = !on;
      pane.classList.toggle('active', on);
      pane.classList.toggle('enter', on && animate);
      if (on) current.textContent = t.querySelector('.tabs-num').textContent;
    });
    if (focus) {
      tab.focus();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      tab.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    }
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(tab, false, true));
    tab.addEventListener('keydown', (e) => {
      let next = i;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate(tab, false, true);
        return;
      } else return;
      e.preventDefault();
      activate(tabs[next], true, true);
    });
  });
  if (tabs.length) activate(tabs[0], false, false);
  block.replaceChildren(toolbar, list, stack, ...(meta.length ? [hiddenBox('tabs-meta', meta)] : []));
}
