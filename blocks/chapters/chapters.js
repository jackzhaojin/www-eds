/**
 * Chapters: timestamps and titles for a video, an ordered list with hairline rows
 * (design-system/v3 chapters). One row per chapter: the timestamp cell (0:00, 12:34), then
 * the title cell (plain text, or a link into the video).
 *
 * The timestamp paragraph moves into a <time> wrapper (a presentation refinement: the text is
 * unchanged), so it reads in mono in the accent color.
 *
 * @variants (none)
 */

function plainLinks(cell) {
  cell.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper', 'button-wrapper'));
  cell.querySelectorAll('a').forEach((a) => a.classList.remove('text-link', 'button', 'primary', 'secondary', 'accent'));
}

export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'chapters-list';
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    const li = document.createElement('li');
    const [stamp, ...titles] = cells.length > 1 ? cells : [null, ...cells];
    if (stamp) {
      const time = document.createElement('time');
      time.className = 'chapters-time';
      time.append(...stamp.children);
      li.append(time);
    }
    const title = document.createElement('div');
    title.className = 'chapters-title';
    titles.forEach((cell) => {
      plainLinks(cell);
      title.append(...cell.children);
    });
    li.append(title);
    list.append(li);
  });
  block.replaceChildren(list);
}
