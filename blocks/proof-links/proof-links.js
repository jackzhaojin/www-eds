/**
 * Proof links: a row of typed links under a portfolio story (source p.proof-links). Each link
 * gets a line icon by destination: a repository (github.com), a post (linkedin.com), a video
 * (YouTube) or a live page (anything else).
 *
 * Content: one paragraph of links. Inline code in it is a tag (a non-link label, dashed box);
 * italic text right after a link is that link's caveat. An optional config row
 * `title | <text>` is the tag's tooltip. Inside a story the showcase moves this block into
 * place; under a wide story the row is centered.
 *
 * @ew-exempt the title row is the tag's tooltip (a title attribute), not displayed text
 */

/** Config rows stay in the block, hidden through a wrapper, so they stay editable. */
function hiddenBox(className, nodes) {
  const box = document.createElement('div');
  box.className = className;
  box.hidden = true;
  box.append(...nodes);
  return box;
}

export default function decorate(block) {
  const box = document.createElement('div');
  box.className = 'proof-links-row link-types';
  let title = '';
  const meta = [];
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 2 && cells[0].textContent.trim().toLowerCase() === 'title') {
      title = cells[1].textContent.trim();
      cells.forEach((c) => meta.push(...c.children));
      return;
    }
    cells.forEach((cell) => box.append(...cell.children));
  });
  box.querySelectorAll('p.text-link-wrapper').forEach((p) => p.classList.remove('text-link-wrapper'));
  box.querySelectorAll('a.text-link').forEach((a) => a.classList.remove('text-link'));
  if (title) box.querySelector('code')?.setAttribute('title', title);
  block.replaceChildren(box, ...(meta.length ? [hiddenBox('proof-links-meta', meta)] : []));
}
