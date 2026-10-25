/**
 * Callout: a note inside body copy (design-system/v3 callout). One row. With two cells, the
 * first is the label (Note, Caution) and the second the text; with one cell, the text alone.
 * The text cell holds one or more paragraphs or a list.
 *
 * The block is a note landmark (role="note"), as on the source.
 *
 * @variants warn
 *   warn - a raised surface with a red label, for a caution
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const [first, ...rest] = cells;
  const parts = [];
  if (first && rest.length) {
    const label = document.createElement('div');
    label.className = 'callout-label';
    label.append(...first.children);
    parts.push(label);
  }
  const body = document.createElement('div');
  body.className = 'callout-body';
  (rest.length ? rest : cells).forEach((cell) => body.append(...cell.children));
  parts.push(body);
  block.setAttribute('role', 'note');
  block.replaceChildren(...parts);
}
