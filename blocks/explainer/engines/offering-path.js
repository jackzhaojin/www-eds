/**
 * Explainer engine "offering-path": pick an offering, see its path on a diagram image (the three
 * EDS offerings map). The picked offering's boxes are outlined on the image, the steps it takes
 * are lit with its own wording, and a note sums it up.
 *
 * Rows:
 * - the diagram row, one cell: the image paragraph, and an italic paragraph that names the
 *   offering picker for assistive tech (not shown);
 * - the regions row, one cell: a list, one item per box on the image, "name: x y w h" (the box's
 *   left, top, width and height as percentages of the image; not shown);
 * - the steps row, one cell: the ordered steps; a step that differs per offering has a nested
 *   list with one item per offering, in the offerings' order, each starting with the offering's
 *   label in italics; a step without one is shared by every offering;
 * - one row per offering, three cells: the label (bold = picked first), a paragraph of inline
 *   code naming the boxes on its path (not shown), then its note;
 * - last row, one cell: the caption.
 *
 * @variants (none)
 * @ew-exempt <p> picker name, <ul> regions, <p> path boxes - text-as-metadata, never displayed
 */

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();
const REGION = /^([\w-]+):\s*([\d.]+%)\s+([\d.]+%)\s+([\d.]+%)\s+([\d.]+%)$/;

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'eds-map';
  const meta = slot('eds-map-meta');
  const last = all[all.length - 1];
  const capCell = all.length > 1 && last.length === 1 ? last[0] : null;
  const singles = all.filter((r) => r.length === 1 && r[0] !== capCell).map((r) => r[0]);
  const offers = all.filter((r) => r.length > 1);

  const chips = slot('chips eds-map__chips');
  chips.setAttribute('role', 'radiogroup');
  const art = slot('eds-map__img');
  const boxes = {};
  let stepsList = null;
  singles.forEach((cell) => {
    [...cell.children].forEach((el) => {
      if (isName(el)) {
        chips.setAttribute('aria-label', el.textContent.trim());
        meta.append(el);
      } else if (el.querySelector('img, picture')) art.append(el);
      else if (el.matches('ul, ol') && [...el.children].every((li) => REGION.test(li.textContent.trim()))) {
        [...el.children].forEach((li) => {
          const [, name, x, y, w, h] = REGION.exec(li.textContent.trim());
          const hl = document.createElement('span');
          hl.className = 'eds-map__hl';
          hl.style.cssText = `--x:${x};--y:${y};--w:${w};--h:${h}`;
          boxes[name] = hl;
          art.append(hl);
        });
        meta.append(el);
      } else if (el.matches('ol, ul')) stepsList = el;
      else meta.append(el);
    });
  });

  const steps = slot('eds-map__steps');
  if (stepsList) steps.append(stepsList);
  const stepItems = stepsList ? [...stepsList.children] : [];
  const say = slot('eds-map__say');
  say.setAttribute('aria-live', 'polite');

  const items = [];
  let first = 0;
  offers.forEach(([label, pathCell, note], i) => {
    const chip = slot('eds-map-option', [...label.children]);
    if (chip.querySelector('strong')) first = i;
    chips.append(chip);
    const pathIds = pathCell.textContent.trim().split(/\s+/).filter(Boolean);
    meta.append(...pathCell.children);
    const noteSlot = slot('eds-map-note', note ? [...note.children] : []);
    say.append(noteSlot);
    items.push({ chip, pathIds, noteSlot });
  });

  const show = (o) => {
    items.forEach((it, j) => {
      it.chip.setAttribute('aria-checked', String(j === o));
      it.chip.tabIndex = j === o ? 0 : -1;
      it.noteSlot.classList.toggle('is-on', j === o);
    });
    Object.entries(boxes).forEach(([name, hl]) => hl.classList.toggle('on', items[o].pathIds.includes(name)));
    steps.dataset.pick = String(o + 1);
    steps.dataset.on = stepItems.map((li, k) => {
      const variants = li.querySelector(':scope > ul, :scope > ol');
      return !variants || variants.children[o] ? String(k + 1) : '';
    }).filter(Boolean).join(' ');
  };
  items.forEach((it, i) => {
    it.chip.setAttribute('role', 'radio');
    it.chip.addEventListener('click', () => show(i));
    it.chip.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const n = (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
        items[n].chip.focus();
        show(n);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(i);
      }
    });
  });

  frame.append(chips, art, steps, say);
  if (capCell) {
    const cap = document.createElement('figcaption');
    cap.append(...capCell.children);
    frame.append(cap);
  }
  frame.append(meta);
  if (items.length) {
    frame.classList.add('is-live');
    show(first);
  }
  block.replaceChildren(frame);
}
