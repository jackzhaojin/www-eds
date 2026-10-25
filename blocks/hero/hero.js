/**
 * Hero: the page introduction band. One row; the cell holding the h1 is the introduction,
 * the other (optional) cell is the side note.
 *
 * Introduction, classified by content: the heading opens the title row; with two or more
 * plain paragraphs the first is the positioning line and the next the summary (one plain
 * paragraph is the summary); link paragraphs are the actions (bold link = primary button,
 * plain link = text link). Side note: a short plain paragraph is its label, a paragraph with an
 * image is the banner, a list is the identity list, a link paragraph is the closing link.
 * Anything else is kept in place. The note's accessible name is the section metadata key
 * note-label (Experience Workspace content), or else its label paragraph.
 *
 * The hub variants (writing, talks, certifications) and page open a listing or a plain page:
 * one cell, classified by content: a list is the breadcrumb (its last item is this page), the
 * heading is the page title, the first plain paragraph is the summary and any further plain
 * paragraph is a small note under it; link paragraphs are actions. The hub variants keep a
 * space for the art beside the title (css/site.css .graphic-hero); page has none.
 *
 * The section gets a decorative canvas (blocks/hero/page-art.js) of the variant's kind,
 * started after the page loads and never painted under reduced motion (not for page).
 *
 * @variants home | writing | talks | certifications | page (default home)
 */

const VARIANTS = ['home', 'writing', 'talks', 'certifications', 'page'];
const ART = ['home', 'writing', 'talks', 'certifications'];

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function isLinkParagraph(el) {
  return el.tagName === 'P' && (el.classList.contains('button-wrapper') || el.classList.contains('text-link-wrapper'));
}

function decorateIntro(cell) {
  const nodes = [...cell.children];
  const heading = nodes.find((el) => /^H[1-3]$/.test(el.tagName));
  const plain = nodes.filter((el) => el.tagName === 'P' && !isLinkParagraph(el) && !el.querySelector('picture, img'));
  const actions = nodes.filter(isLinkParagraph);
  const [positioning, summary] = plain.length >= 2 ? plain : [null, plain[0]];

  const intro = document.createElement('div');
  intro.className = 'hero-intro';
  if (heading) {
    const art = document.createElement('div');
    art.className = 'hero-art-space';
    art.setAttribute('aria-hidden', 'true');
    intro.append(slot('hero-title', [heading, art]));
  }
  if (positioning) intro.append(slot('hero-positioning', [positioning]));
  if (summary) intro.append(slot('hero-summary', [summary]));
  if (actions.length) intro.append(slot('hero-actions cta-slot', actions));
  const used = new Set([heading, positioning, summary, ...actions]);
  nodes.filter((el) => !used.has(el)).forEach((el) => intro.append(el));
  return intro;
}

function decorateNote(cell, label) {
  const note = document.createElement('aside');
  note.className = 'hero-note';
  if (label) note.setAttribute('aria-label', label);
  [...cell.children].forEach((el) => {
    if (el.matches('ul, ol')) note.append(slot('hero-note-list', [el]));
    else if (el.querySelector('picture, img')) note.append(slot('hero-note-banner', [el]));
    else if (isLinkParagraph(el)) note.append(slot('hero-note-link cta-slot', [el]));
    else if (el.tagName === 'P' && !note.querySelector('.hero-note-label')) {
      if (!label) note.setAttribute('aria-label', el.textContent);
      note.append(slot('hero-note-label', [el]));
    } else note.append(el);
  });
  return note;
}

function startArt(block, kind) {
  const section = block.closest('.section');
  if (!section) return;
  const begin = () => {
    setTimeout(() => {
      import('./page-art.js').then(({ default: paintArt }) => paintArt(section, kind));
    }, 3000);
  };
  if (document.readyState === 'complete') begin();
  else window.addEventListener('load', begin, { once: true });
}

/** Hub and page variants: breadcrumb, then the head (title, summary, notes) beside the art. */
function decorateHead(block, variant) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;
  const nodes = [...cell.children];
  const list = nodes.find((el) => el.matches('ol, ul'));
  const heading = nodes.find((el) => /^H[1-3]$/.test(el.tagName));
  const plain = nodes.filter((el) => el.tagName === 'P' && !isLinkParagraph(el) && !el.querySelector('picture, img'));
  const actions = nodes.filter(isLinkParagraph);
  const [summary, ...notes] = plain;

  const parts = [];
  if (list) {
    const crumbs = document.createElement('nav');
    crumbs.className = 'hero-breadcrumb breadcrumb';
    crumbs.setAttribute('aria-label', 'Breadcrumb');
    crumbs.append(list);
    const items = list.querySelectorAll(':scope > li');
    if (items.length) items[items.length - 1].setAttribute('aria-current', 'page');
    parts.push(crumbs);
  }
  const head = document.createElement('div');
  head.className = 'hero-head';
  if (heading) head.append(slot('hero-title', [heading]));
  if (summary) head.append(slot('hero-summary', [summary]));
  if (notes.length) head.append(slot('hero-small', notes));
  if (actions.length) head.append(slot('hero-actions cta-slot', actions));
  const used = new Set([list, heading, ...plain, ...actions]);
  nodes.filter((el) => !used.has(el)).forEach((el) => head.append(el));

  const layout = document.createElement('div');
  layout.className = 'hero-layout';
  layout.append(head);
  if (ART.includes(variant)) {
    const art = document.createElement('div');
    art.className = 'hero-art-space';
    art.setAttribute('aria-hidden', 'true');
    layout.append(art);
  }
  parts.push(layout);
  block.replaceChildren(...parts);
  if (ART.includes(variant)) startArt(block, variant);
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('home');
  const variant = VARIANTS.find((v) => block.classList.contains(v));
  if (variant !== 'home') {
    decorateHead(block, variant);
    return;
  }
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const introCell = cells.find((c) => c.querySelector('h1')) || cells[0];
  if (!introCell) return;
  const parts = [decorateIntro(introCell)];
  cells.filter((c) => c !== introCell).forEach((c) => {
    if (c.children.length) parts.push(decorateNote(c, block.closest('.section')?.dataset.noteLabel));
  });
  block.replaceChildren(...parts);
  startArt(block, 'home');
}
