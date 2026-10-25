/**
 * Stat chips: a wrapping row of evidence chips (source div.stat-chips), the value bold in the
 * chapter accent. Content: one list, one item per chip: the bold value, then its label.
 * Inside a story the showcase moves this block into place; under a wide story the row is
 * centered.
 */

export default function decorate(block) {
  const box = document.createElement('div');
  box.className = 'stat-chips-row';
  block.querySelectorAll(':scope > div > div').forEach((cell) => box.append(...cell.children));
  block.replaceChildren(box);
}
