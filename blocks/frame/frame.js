/**
 * Frame: a bordered figure for a diagram or screenshot with a mono caption (source
 * figure.frame). Content: the image paragraph (linked to the full-size file when the image
 * opens one), then the caption paragraph. An optional config row `label | <text>` names the
 * image link for assistive tech.
 *
 * diagram: a full-width diagram on the paper ground, capped at 1040px (a story of its own).
 * sub: a smaller frame inside a story's text column; with portrait it is capped at 340px.
 * Inside a story the showcase moves a sub frame into place.
 *
 * @variants diagram | sub | portrait (default diagram)
 * @ew-exempt the label row is the image link's aria-label, not displayed text
 */

const VARIANTS = ['diagram', 'sub'];

/** Config rows stay in the block, hidden through a wrapper, so they stay editable. */
function hiddenBox(className, nodes) {
  const box = document.createElement('div');
  box.className = className;
  box.hidden = true;
  box.append(...nodes);
  return box;
}

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('diagram');
  const figure = document.createElement('figure');
  figure.className = 'frame-figure portfolio-frame';
  if (block.classList.contains('diagram')) figure.classList.add('diagram');
  let label = '';
  let caption = null;
  const meta = [];
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 2 && cells[0].textContent.trim().toLowerCase() === 'label') {
      label = cells[1].textContent.trim();
      cells.forEach((c) => meta.push(...c.children));
      return;
    }
    cells.forEach((cell) => [...cell.children].forEach((el) => {
      if (el.querySelector('picture, img') || el.matches('picture, img')) figure.append(slot('frame-media', [el]));
      else {
        if (!caption) {
          caption = document.createElement('figcaption');
          figure.append(caption);
        }
        caption.append(el);
      }
    }));
  });
  if (label) figure.querySelector('.frame-media a')?.setAttribute('aria-label', label);
  block.replaceChildren(figure, ...(meta.length ? [hiddenBox('frame-meta', meta)] : []));
}
