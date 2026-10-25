/**
 * Columns: one row, one cell per column (at most four). Each authored element is moved into a
 * role wrapper so its spacing holds while it is edited: headings, text paragraphs, link
 * paragraphs (bold link = button, plain link = text link) and images.
 *
 * @variants (none) - two even columns, the home's talks and writing pair
 */

function role(el) {
  if (/^H[1-6]$/.test(el.tagName)) return 'columns-heading';
  if (el.classList.contains('button-wrapper') || el.classList.contains('text-link-wrapper')) return 'columns-link cta-slot';
  if (el.querySelector('picture, img') || el.matches('picture, img')) return 'columns-media';
  return 'columns-text';
}

export default function decorate(block) {
  const cols = [...block.querySelectorAll(':scope > div > div')];
  block.classList.add(`columns-${Math.min(cols.length, 4)}-cols`);
  cols.forEach((col) => {
    col.classList.add('columns-col');
    [...col.children].forEach((el) => {
      const wrap = document.createElement('div');
      wrap.className = role(el);
      el.before(wrap);
      wrap.append(el);
    });
  });
}
