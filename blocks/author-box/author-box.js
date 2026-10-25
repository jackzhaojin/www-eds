/**
 * Author box: who wrote this (design-system/v3 author box). One row: the avatar cell (the
 * initials, or an image), then the body cell: the name paragraph, the role paragraph and a
 * paragraph of profile links.
 *
 * @variants (none)
 */

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const body = cells.length > 1 ? cells[cells.length - 1] : cells[0];
  const avatarCell = cells.length > 1 ? cells[0] : null;
  const box = document.createElement('aside');
  box.className = 'author-box-frame';
  if (avatarCell) {
    const avatar = slot('author-box-avatar', [...avatarCell.children]);
    avatar.setAttribute('aria-hidden', 'true');
    box.append(avatar);
  }
  const inner = document.createElement('div');
  inner.className = 'author-box-body';
  const paras = [...body.children];
  const links = paras.find((p) => p.querySelectorAll('a').length > 1)
    || paras.find((p, i) => i > 1 && p.querySelector('a'));
  paras.forEach((p, i) => {
    p.classList.remove('text-link-wrapper');
    p.querySelectorAll('a').forEach((a) => a.classList.remove('text-link'));
    let role = 'author-box-role';
    if (p === links) role = 'author-box-links';
    else if (i === 0) role = 'author-box-name';
    inner.append(slot(role, [p]));
  });
  box.append(inner);
  // On the source the author box sits in a sectioning element, so it is not a landmark; here it
  // is one beside the rail, so it takes its name from the author's name (no new text).
  const name = inner.querySelector('.author-box-name p');
  if (name) {
    name.id = name.id || `author-box-name-${document.querySelectorAll('.author-box-frame').length}`;
    box.setAttribute('aria-labelledby', name.id);
  }
  block.replaceChildren(box);
}
