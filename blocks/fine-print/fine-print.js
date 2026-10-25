/**
 * Fine print: small faint text that records where a piece comes from (the source's
 * article-facts line: first publication, code and versions). One row, one cell of paragraphs.
 *
 * @variants (none)
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;
  const box = document.createElement('div');
  box.className = 'fine-print-text';
  box.append(...cell.children);
  block.replaceChildren(box);
}
