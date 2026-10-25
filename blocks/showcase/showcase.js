/**
 * Showcase: a text column beside a media column (design-system/v3 showcase; the home's
 * "Selected work" feature). One row: the cell with the heading is the text, the cell with the
 * image is the media. The media becomes a v3 frame: the image paragraph and, after it, the
 * caption paragraph in a figcaption. An SVG image is a diagram and keeps a paper ground in
 * both themes.
 *
 * Text, classified by content: heading, then the first plain paragraph is the lead, other
 * plain paragraphs are body text, link paragraphs are the actions.
 *
 * @variants feature (default feature)
 */

const VARIANTS = ['feature'];

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function isLinkParagraph(el) {
  return el.tagName === 'P' && (el.classList.contains('button-wrapper') || el.classList.contains('text-link-wrapper'));
}

function decorateText(cell) {
  const text = document.createElement('div');
  text.className = 'showcase-text';
  let lead = false;
  [...cell.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) text.append(slot('showcase-title', [el]));
    else if (isLinkParagraph(el)) text.append(slot('showcase-actions cta-slot', [el]));
    else if (el.tagName === 'P' && !lead) {
      lead = true;
      text.append(slot('showcase-lead', [el]));
    } else text.append(slot('showcase-body', [el]));
  });
  return text;
}

function decorateMedia(cell) {
  const media = document.createElement('div');
  media.className = 'showcase-media';
  const figure = document.createElement('figure');
  figure.className = 'frame';
  const img = cell.querySelector('img');
  if (img && /\.svg(\?|$)/i.test(img.getAttribute('src') || '')) figure.classList.add('diagram');
  let caption = null;
  [...cell.children].forEach((el) => {
    if (el.querySelector('picture, img') || el.matches('picture, img')) figure.append(slot('frame-media', [el]));
    else {
      if (!caption) {
        caption = document.createElement('figcaption');
        figure.append(caption);
      }
      caption.append(el);
    }
  });
  media.append(figure);
  return media;
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('feature');
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const mediaCell = cells.find((c) => c.querySelector('picture, img'));
  const parts = [];
  cells.forEach((cell) => {
    if (cell === mediaCell) parts.push(decorateMedia(cell));
    else if (cell.children.length) parts.push(decorateText(cell));
  });
  block.replaceChildren(...parts);
}
