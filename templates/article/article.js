import { getMetadata } from '../../scripts/aem.js';

/*
 * Technical Writing article template (metadata "template: article").
 *
 * Content shape, all authored in Experience Workspace:
 * - the first section is the article head: an ordered list (the breadcrumb, its last item is
 *   this page), the h1, the byline paragraph (starts with "By "), the summary paragraph;
 * - every other section is part of the reading column. A section with metadata "id" is a
 *   link target (#part-1, #video), the way the source anchors its parts;
 * - a section styled "related" closes the column (related reading, author box);
 * - the rail block anywhere in the page becomes the right rail (the outline).
 *
 * Content rules the template applies:
 * - a paragraph that starts with "Watch this part" and holds video links is a watch row;
 * - dates in the byline read as <time>;
 * - every h2 in the column gets a self link (#), as on the source.
 * Every authored element is moved, never rebuilt; wrappers carry the layout classes.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];
const DATE = new RegExp(`\\b(${MONTHS.join('|')}) (\\d{1,2}), (\\d{4})\\b`, 'g');

function wrap(el, className, tag = 'div') {
  const box = document.createElement(tag);
  box.className = className;
  el.before(box);
  box.append(el);
  return box;
}

/** Byline dates become <time datetime>: a presentation refinement, the text is unchanged. */
function decorateByline(p) {
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const text = node.textContent;
    DATE.lastIndex = 0;
    if (!DATE.test(text)) return;
    DATE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0;
    text.replace(DATE, (match, month, day, year, offset) => {
      frag.append(text.slice(last, offset));
      const time = document.createElement('time');
      const mm = String(MONTHS.indexOf(month) + 1).padStart(2, '0');
      time.dateTime = `${year}-${mm}-${day.padStart(2, '0')}`;
      time.textContent = match;
      frag.append(time);
      last = offset + match.length;
      return match;
    });
    frag.append(text.slice(last));
    node.replaceWith(frag);
  });
}

/**
 * Words kept on one line: the page metadata "title-keep-together" lists them for the h1 and
 * "heading-keep-together" for the h2s, comma separated (Sign-in, Members-Only), as the source
 * marks them heading by heading. Each first match in a heading gets a nowrap span: a
 * presentation refinement, the text is unchanged.
 */
function keepTogether(heading, key) {
  const runs = (getMetadata(key) || '').split(',').map((r) => r.trim()).filter(Boolean);
  runs.forEach((run) => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const at = node.textContent.indexOf(run);
      if (at >= 0 && !node.parentElement.classList.contains('nowrap')) {
        const tail = node.splitText(at);
        tail.splitText(run.length);
        const span = document.createElement('span');
        span.className = 'nowrap';
        tail.replaceWith(span);
        span.append(tail);
        return;
      }
    }
  });
}

function decorateHead(section) {
  const head = document.createElement('header');
  head.className = 'article-head';
  section.before(head);
  head.append(section);
  const content = section.querySelector('.default-content-wrapper');
  if (!content) return head;
  const list = content.querySelector('ol, ul');
  if (list) {
    const nav = wrap(list, 'breadcrumb', 'nav');
    nav.setAttribute('aria-label', 'Breadcrumb');
    const items = list.querySelectorAll('li');
    if (items.length) items[items.length - 1].setAttribute('aria-current', 'page');
  }
  const h1 = content.querySelector('h1');
  if (h1) {
    keepTogether(h1, 'title-keep-together');
    wrap(h1, 'article-title');
  }
  [...content.querySelectorAll('p')].forEach((p) => {
    if (p.closest('.breadcrumb')) return;
    if (/^By\s/.test(p.textContent)) {
      decorateByline(p);
      wrap(p, 'byline');
    } else if (!p.closest('.summary')) wrap(p, 'summary');
  });
  return head;
}

/** "Watch this part" rows: the label and each link's time get their v3 spans. */
function decorateWatch(body) {
  body.querySelectorAll('.default-content-wrapper p').forEach((p) => {
    const first = p.firstChild;
    if (!first || first.nodeType !== Node.TEXT_NODE || !/^\s*Watch this part/.test(first.textContent)) return;
    if (!p.querySelector('a[href*="youtu"]')) return;
    const label = document.createElement('span');
    label.className = 'watch-label';
    p.insertBefore(label, first);
    label.append(first);
    p.querySelectorAll('a').forEach((a) => {
      const text = a.firstChild;
      if (!text || text.nodeType !== Node.TEXT_NODE) return;
      const m = /^(\d{1,2}:\d{2})(\s)/.exec(text.textContent);
      if (!m) return;
      const [, stamp] = m;
      const time = document.createElement('span');
      time.className = 'watch-time';
      time.textContent = stamp;
      text.textContent = text.textContent.slice(stamp.length);
      a.prepend(time);
    });
    wrap(p, 'watch');
  });
}

/** Every column h2 links to itself; a click also copies the full link where allowed. */
function decorateHeadingLinks(body) {
  body.querySelectorAll('.default-content-wrapper h2').forEach((h) => {
    const section = h.closest('.section');
    if (section && section.classList.contains('related')) return;
    const firstHeading = section && section.querySelector('h2') === h;
    const target = firstHeading && section.id ? section.id : h.id;
    if (!target) return;
    const a = document.createElement('a');
    a.className = 'heading-link';
    a.href = `#${target}`;
    a.setAttribute('aria-label', `Link to this section: ${h.textContent.trim()}`);
    a.textContent = '#';
    a.addEventListener('click', () => {
      const url = `${window.location.origin}${window.location.pathname}#${target}`;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
          a.dataset.copied = '';
          setTimeout(() => delete a.dataset.copied, 1600);
        }, () => {});
      }
    });
    h.append(a);
  });
}

/** An h3 that asks a question gets the Q&A voice (the source's h3.qa). */
function decorateQuestions(body) {
  body.querySelectorAll('.default-content-wrapper h3').forEach((h) => {
    if (/\?\s*$/.test(h.textContent)) wrap(h, 'question');
  });
}

/** Section style prompt: the first line of each plain code box is the prompt's byline. */
function decoratePrompts(body) {
  body.querySelectorAll('.section.prompt .default-content-wrapper pre > code').forEach((code) => {
    const first = code.firstChild;
    if (!first || first.nodeType !== Node.TEXT_NODE) return;
    const at = first.data.indexOf('\n');
    if (at < 1) return;
    first.splitText(at + 1);
    const by = document.createElement('span');
    by.className = 'prompt-by';
    first.replaceWith(by);
    by.append(first);
  });
}

export default function decorate(main) {
  const sections = [...main.querySelectorAll(':scope > .section')];
  if (!sections.length) return;
  const head = decorateHead(sections[0]);

  const layout = document.createElement('div');
  layout.className = 'article-layout';
  const body = document.createElement('div');
  body.className = 'article-body';
  const rail = document.createElement('aside');
  rail.className = 'article-rail';
  // The rail's section moves whole into the aside, so loadSections still finds and loads it.
  sections.slice(1).forEach((section) => {
    if (section.querySelector('.rail-wrapper')) rail.append(section);
    else body.append(section);
  });
  layout.append(body, rail);
  head.after(layout);

  decorateWatch(body);
  body.querySelectorAll('h2').forEach((h2) => keepTogether(h2, 'heading-keep-together'));
  decorateQuestions(body);
  decoratePrompts(body);
  decorateHeadingLinks(body);
}
