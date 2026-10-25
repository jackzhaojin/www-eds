/**
 * Pagination: numbered links in 44px boxes, the current page filled with ink
 * (design-system/v3 pagination). One cell holding a list of links in order (Previous, the
 * page numbers, Next). The current page is the bold item; it is marked aria-current="page".
 *
 * The list moves into a navigation landmark named Pagination.
 *
 * @variants (none)
 */
export default function decorate(block) {
  const list = block.querySelector('ul, ol');
  const nav = document.createElement('nav');
  nav.className = 'pagination-nav';
  nav.setAttribute('aria-label', 'Pagination');
  if (list) {
    list.querySelectorAll('li').forEach((li) => {
      const link = li.querySelector('a[href]');
      if (link && link.closest('strong, b')) link.setAttribute('aria-current', 'page');
    });
    nav.append(list);
  }
  block.replaceChildren(nav);
}
