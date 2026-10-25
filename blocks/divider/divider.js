/**
 * Divider: the labelled rule between portfolio chapters (source .tdiv): a mono label, a
 * hairline, a second mono label. One row, one cell per label.
 *
 * year: the large outlined year numeral with a mono note under it (source .year-band). One
 * row: the year | the note.
 *
 * Decoration only for assistive tech (aria-hidden), as on the source; the labels stay text.
 *
 * @variants rule | year (default rule)
 */

const VARIANTS = ['rule', 'year'];

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('rule');
  const cells = [...block.querySelectorAll(':scope > div > div')].filter((c) => c.textContent.trim());
  const parts = [];
  if (block.classList.contains('year')) {
    cells.forEach((cell, i) => {
      const box = document.createElement('div');
      box.className = i === 0 ? 'divider-year' : 'divider-note';
      box.append(...cell.childNodes);
      if (i === 0) box.setAttribute('aria-hidden', 'true');
      parts.push(box);
    });
  } else {
    block.setAttribute('aria-hidden', 'true');
    cells.forEach((cell, i) => {
      if (i > 0) {
        const line = document.createElement('i');
        line.className = 'divider-line';
        parts.push(line);
      }
      const box = document.createElement('div');
      box.className = 'divider-label';
      box.append(...cell.childNodes);
      parts.push(box);
    });
  }
  block.replaceChildren(...parts);
}
