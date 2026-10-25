/**
 * Explainer engine `stardust-versions`: the three-version block viewer of "Adobe Stardust
 * explained". One block and one version at a time.
 *
 * Rows, a matrix:
 * - the first row: the names of the two switches (a paragraph each, block then version, read
 *   by assistive tech) | one cell per version with its tab label paragraph;
 * - one row per block: the block's label paragraph | one cell per version, in the first row's
 *   order: the image paragraph, then the caption paragraph (a bold tag, then the verdict);
 * - a last single-cell row: the caption under the viewer.
 *
 * The first block and the first version show; the block options (radios) and the version tabs
 * switch them, arrow keys move within each set. Options and tabs host their authored label
 * paragraph (EW7).
 */

function group(role, label, hosts) {
  const g = document.createElement('div');
  g.setAttribute('role', role);
  if (label) g.setAttribute('aria-label', label);
  g.append(...hosts);
  return g;
}

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const head = all.find((cells) => cells.length > 1);
  const body = all.filter((cells) => cells.length > 1 && cells !== head);
  const tail = all.filter((cells) => cells.length === 1);
  if (!head || !body.length) return;

  const [namesCell, ...verCells] = head;
  const names = slot('vs__names', [...namesCell.children]);
  const [blockName, versionName] = [...names.children].map((p) => p.textContent.trim());

  const vers = verCells.map((cell) => {
    const host = slot('vs__opt', [...cell.children]);
    host.setAttribute('role', 'tab');
    return host;
  });
  const blocks = body.map(([label]) => {
    const host = slot('vs__opt', [...label.children]);
    host.setAttribute('role', 'radio');
    return host;
  });

  const grid = slot('vs__grid');
  const panes = [];
  body.forEach(([, ...cells], b) => {
    cells.forEach((cell, v) => {
      const pane = document.createElement('figure');
      pane.className = 'vs__pane';
      pane.dataset.b = b;
      pane.dataset.v = v;
      const cap = document.createElement('figcaption');
      [...cell.children].forEach((el) => {
        if (el.querySelector('picture, img')) pane.append(el);
        else cap.append(el);
      });
      if (cap.children.length) pane.append(cap);
      grid.append(pane);
      panes.push(pane);
    });
  });

  const controls = slot('vs__controls', [
    group('radiogroup', blockName, blocks),
    group('tablist', versionName, vers),
  ]);
  controls.firstElementChild.className = 'chips';
  controls.lastElementChild.className = 'cmp__tabs vs__tabs';

  const frame = document.createElement('figure');
  frame.className = 'vs';
  frame.append(controls, grid);
  tail.forEach(([cell]) => {
    const cap = document.createElement('figcaption');
    cap.className = 'vs__cap';
    cap.append(...cell.children);
    frame.append(cap);
  });
  frame.append(names);
  block.replaceChildren(frame);

  const state = { b: 0, v: 0 };
  const render = () => {
    panes.forEach((p) => p.classList.toggle('on', Number(p.dataset.b) === state.b && Number(p.dataset.v) === state.v));
    blocks.forEach((el, i) => {
      el.setAttribute('aria-checked', String(i === state.b));
      el.tabIndex = i === state.b ? 0 : -1;
    });
    vers.forEach((el, i) => {
      el.setAttribute('aria-selected', String(i === state.v));
      el.tabIndex = i === state.v ? 0 : -1;
    });
  };
  const keys = (list, key) => {
    list.forEach((el, i) => {
      el.addEventListener('click', () => {
        state[key] = i;
        render();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          state[key] = i;
          render();
          return;
        }
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const n = (i + d + list.length) % list.length;
        state[key] = n;
        render();
        list[n].focus();
      });
    });
  };
  keys(blocks, 'b');
  keys(vers, 'v');
  frame.classList.add('is-live');
  render();
}
