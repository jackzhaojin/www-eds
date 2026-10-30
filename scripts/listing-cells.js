/**
 * Listing rows as data, for the dynamic listings (Writing index, Row list (projects, dynamic)).
 * A row is a list of cells, a cell a list of nodes made with el(): the block rows an author
 * would write. The edge Worker serves them as HTML (rowsToHTML, edge/src/listings.mjs) and the
 * browser builds them on preview hosts (rowsToDOM); either way the block decorates them with the
 * same code as authored rows.
 */
const SITE = 'https://www.jackzhaojin.com';

/** A node: el('p', {}, 'text'), el('a', { href }, 'label'). Empty children are dropped. */
export const el = (tag, attrs = {}, ...children) => ({
  tag, attrs, children: children.flat().filter((c) => c !== '' && c !== null && c !== undefined && c !== false),
});

/** The id delivery gives an authored heading: lowercase, punctuation dropped, spaces hyphens. */
export const headingId = (text) => text.trim().toLowerCase()
  .replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');

/** A link or image on this site as a site path, so it stays on the host that serves the page. */
export function sitePath(href) {
  const url = new URL(href, SITE);
  return url.origin === SITE ? `${url.pathname}${url.search}${url.hash}` : url.href;
}

function toDOM(node, picture) {
  if (typeof node === 'string') return document.createTextNode(node);
  if (node.tag === 'img' && picture) return picture(node.attrs.src, node.attrs.alt || '', false);
  const element = document.createElement(node.tag);
  Object.entries(node.attrs).forEach(([name, value]) => element.setAttribute(name, value));
  element.append(...node.children.map((child) => toDOM(child, picture)));
  return element;
}

/** Block rows in the browser; picture(src, alt, eager) is aem.js createOptimizedPicture. */
export const rowsToDOM = (rows, picture) => rows.map((cells) => {
  const row = document.createElement('div');
  cells.forEach((cell) => {
    const div = document.createElement('div');
    div.append(...cell.map((node) => toDOM(node, picture)));
    row.append(div);
  });
  return row;
});

const escapeHTML = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** The markup createOptimizedPicture builds, for an image the edge serves. */
function pictureHTML(src, alt) {
  const path = escapeHTML(src.split('?')[0]);
  const ext = path.split('.').pop();
  const at = (width, format) => `${path}?width=${width}&amp;format=${format}&amp;optimize=medium`;
  return `<picture><source type="image/webp" srcset="${at(2000, 'webply')}" media="(min-width: 600px)">`
    + `<source type="image/webp" srcset="${at(750, 'webply')}">`
    + `<source srcset="${at(2000, ext)}" media="(min-width: 600px)">`
    + `<img loading="lazy" alt="${escapeHTML(alt)}" src="${at(750, ext)}"></picture>`;
}

function toHTML(node) {
  if (typeof node === 'string') return escapeHTML(node);
  if (node.tag === 'img') return pictureHTML(node.attrs.src, node.attrs.alt || '');
  const attrs = Object.entries(node.attrs).map(([name, value]) => ` ${name}="${escapeHTML(value)}"`).join('');
  return `<${node.tag}${attrs}>${node.children.map(toHTML).join('')}</${node.tag}>`;
}

/** Block rows as served HTML, for the edge. */
export const rowsToHTML = (rows) => rows
  .map((cells) => `<div>${cells.map((cell) => `<div>${cell.map(toHTML).join('')}</div>`).join('')}</div>`)
  .join('');
