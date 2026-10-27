/**
 * Chapter head: the opening of a portfolio project chapter (source header.chapter-head): the
 * outlined chapter numeral, the title with its italic subtitle, the mono meta line, the build
 * method line, the thesis and an optional arc, and an optional repo callout.
 *
 * Content, classified by role:
 * - first row: the h2 (title, a line break, the italic subtitle), then the meta paragraph right
 *   after it, the method paragraph (it opens with the bold method label), the thesis (the next
 *   paragraph) and the arc (any paragraph after the thesis);
 * - an optional second row is the repo callout: a label paragraph, the repository link
 *   paragraph, a meta paragraph and a paragraph of links.
 * The numeral is the chapter's position among the page's chapter heads (01, 02, ...); on a
 * project page (one chapter head, its title the page's h1) it is the page's project-order.
 * The chapter's accent and the flagship or lofi look come from its section style.
 *
 * @ew-exempt the numeral is derived from the chapter order, not authored text
 */

function slot(className, nodes) {
  const div = document.createElement('div');
  div.className = className;
  div.append(...nodes);
  return div;
}

const isLinkPara = (el) => el.tagName === 'P' && el.querySelector('a') && el.textContent.trim() === [...el.querySelectorAll('a')].map((a) => a.textContent).join('').trim();

/** A paragraph that opens with a bold run (the method label). */
function opensBold(p) {
  const first = [...p.childNodes]
    .find((n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim());
  return first?.nodeType === Node.ELEMENT_NODE && first.tagName === 'STRONG';
}

function decorateTitle(cell) {
  const box = document.createElement('div');
  box.className = 'chapter-head-title';
  let meta = false;
  let thesis = false;
  [...cell.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) box.append(slot('chapter-head-heading', [el]));
    else if (el.tagName !== 'P') box.append(slot('chapter-head-arc', [el]));
    else if (!meta) {
      meta = true;
      box.append(slot('chapter-head-meta', [el]));
    } else if (opensBold(el)) box.append(slot('chapter-head-method', [el]));
    else if (!thesis) {
      thesis = true;
      box.append(slot('chapter-head-thesis', [el]));
    } else box.append(slot('chapter-head-arc', [el]));
  });
  return box;
}

function decorateCallout(cell) {
  const box = document.createElement('div');
  box.className = 'chapter-head-callout';
  let label = false;
  [...cell.children].forEach((el) => {
    const links = el.querySelectorAll('a').length;
    if (links > 1 || (links && box.querySelector('.chapter-head-repo'))) box.append(slot('chapter-head-links link-types', [el]));
    else if (links && isLinkPara(el)) {
      el.classList.remove('text-link-wrapper');
      el.querySelector('a').classList.remove('text-link');
      const a = el.querySelector('a');
      const last = a.lastChild;
      // the closing arrow is set smaller and kept on the line (presentation only)
      if (last?.nodeType === Node.TEXT_NODE && /\s↗$/.test(last.textContent)) {
        last.textContent = last.textContent.replace(/\s↗$/, '');
        const arrow = document.createElement('span');
        arrow.className = 'chapter-head-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = ' ↗';
        a.append(arrow);
      }
      box.append(slot('chapter-head-repo', [el]));
    } else if (!label) {
      label = true;
      box.append(slot('chapter-head-label', [el]));
    } else box.append(slot('chapter-head-note', [el]));
  });
  return box;
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const cells = rows.map((r) => [...r.children]).flat().filter((c) => c.children.length);
  const titleCell = cells.find((c) => c.querySelector('h1, h2, h3'));
  const all = [...document.querySelectorAll('.chapter-head.block')];
  const num = document.createElement('span');
  num.className = 'chapter-head-num';
  num.setAttribute('aria-hidden', 'true');
  const order = document.querySelector('meta[name="project-order"]')?.content.trim();
  num.textContent = (all.length === 1 && /^\d+$/.test(order || '') ? order : String(all.indexOf(block) + 1)).padStart(2, '0');
  const title = titleCell ? decorateTitle(titleCell) : document.createElement('div');
  cells.filter((c) => c !== titleCell).forEach((c) => title.append(decorateCallout(c)));
  block.replaceChildren(num, title);
}
