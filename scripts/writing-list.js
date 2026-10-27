/**
 * Writing list: the Technical Writing listing (css/site.css .writing-list and .writing-row).
 * One row per article, newest first. Cells are classified by content:
 * - meta (the cell with lists): the date paragraph (wrapped in a <time>), the topics list (one
 *   chip per item; a known topic gets its dot color and filter key) and the facts list (the
 *   reading time, then the video length, which carries the video icon);
 * - body (the cell with the heading): the heading with the article link (the link covers the
 *   whole row), the summary paragraph, a talk link paragraph followed by its note paragraph,
 *   and the Watch on YouTube link paragraph;
 * - cover (the cell with the image): decorative, the row link names the article;
 * - keywords (an optional cell of plain paragraphs): search terms beyond the visible text, and
 *   optionally the title runs to keep on one line (Sign-in, Members-Only): a paragraph of comma
 *   separated parts that all occur in the title. Each run gets a nowrap span (the source marks
 *   them title by title), a presentation refinement that keeps the text.
 * Year marks split the list by year. The writing-filter widget filters the rows in place and
 * reads each row's date, topics and search text from the data attributes set here. The section
 * metadata key label names the section for assistive tech (the source's aria-label).
 *
 * @ew-exempt keywords: search terms and keep-together runs, hidden (.writing-list-keywords)
 * @variants (none)
 */

import { toClassName } from './aem.js';

/* Topic label -> filter key (the source's #topic= values) and chip dot color. */
const TOPICS = {
  'adobe aem & eds': { key: 'aem', dot: 'aem' },
  'ai engineering': { key: 'ai-engineering', dot: 'agents' },
};

const YOUTUBE = /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/;

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function plainLinks(el) {
  el.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper', 'button-wrapper'));
  el.querySelectorAll('a').forEach((a) => a.classList.remove('text-link', 'button', 'primary', 'secondary', 'accent'));
}

function isoDate(text) {
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isYouTube(a) {
  try {
    return YOUTUBE.test(new URL(a.href).hostname);
  } catch {
    return false;
  }
}

function decorateMeta(cell, row) {
  const nodes = [...cell.children];
  const date = nodes.find((el) => el.tagName === 'P');
  const [topics, facts] = nodes.filter((el) => el.matches('ul, ol'));
  const meta = document.createElement('div');
  meta.className = 'writing-list-meta';
  if (date) {
    const text = date.textContent.trim();
    row.date = isoDate(text);
    const time = document.createElement('time');
    if (row.date) time.dateTime = row.date;
    time.append(...date.childNodes);
    date.append(time);
    meta.append(slot('writing-list-date', [date]));
  }
  if (topics) {
    [...topics.children].forEach((li) => {
      const label = li.textContent.trim();
      const topic = TOPICS[label.toLowerCase()] || { key: toClassName(label) };
      row.topics.push(topic.key);
      row.labels.push(label);
      if (topic.dot) li.dataset.topic = topic.dot;
    });
    meta.append(slot('writing-list-tags', [topics]));
  }
  if (facts) {
    row.video = facts.children.length > 1;
    meta.append(slot('writing-list-facts', [facts]));
  }
  const used = new Set([date, topics, facts]);
  nodes.filter((el) => !used.has(el)).forEach((el) => meta.append(el));
  return meta;
}

function decorateBody(cell, row) {
  const nodes = [...cell.children];
  const heading = nodes.find((el) => /^H[1-6]$/.test(el.tagName));
  const links = nodes.filter((el) => el.tagName === 'P' && el.querySelector('a') && el.textContent.trim() === el.querySelector('a').textContent.trim());
  const plain = nodes.filter((el) => el.tagName === 'P' && !links.includes(el));
  const [summary, ...notes] = plain;
  const watch = links.filter((p) => isYouTube(p.querySelector('a')));
  const talk = links.filter((p) => !watch.includes(p));

  const body = document.createElement('div');
  body.className = 'writing-list-body';
  if (heading) {
    const a = heading.querySelector('a');
    if (a) row.id = new URL(a.href).pathname.split('/').filter(Boolean).pop()?.replace(/^\d{4}-\d{2}-\d{2}-/, '') || '';
    row.title = heading.textContent.trim();
    body.append(slot('writing-list-title', [heading]));
  }
  if (summary) {
    row.summary = summary.textContent.trim();
    body.append(slot('writing-list-summary', [summary]));
  }
  if (talk.length || notes.length) {
    const group = slot('writing-list-talk', []);
    talk.forEach((p) => group.append(slot('writing-list-talk-link', [p])));
    notes.forEach((p) => group.append(slot('writing-list-talk-note', [p])));
    body.append(group);
  }
  if (watch.length) body.append(slot('writing-list-watch', watch));
  if (watch.length) row.video = true;
  const used = new Set([heading, ...links, ...plain]);
  nodes.filter((el) => !used.has(el)).forEach((el) => body.append(el));
  return body;
}

/** Wraps the first occurrence of each run in a nowrap span; the text is unchanged. */
function keepTogether(heading, runs) {
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
        break;
      }
    }
  });
}

function decorateRow(div) {
  const row = {
    date: '', topics: [], labels: [], video: false, id: '', title: '', summary: '', keywords: '',
  };
  const article = document.createElement('article');
  article.className = 'writing-list-row';
  const cells = [...div.children];
  const parts = {
    meta: null, body: null, media: null, keywords: null,
  };
  cells.forEach((cell) => {
    if (!cell.children.length) return;
    plainLinks(cell);
    if (!parts.body && cell.querySelector('h1, h2, h3, h4, h5, h6')) parts.body = decorateBody(cell, row);
    else if (!parts.media && cell.querySelector('picture, img')) {
      parts.media = slot('writing-list-media', [...cell.children]);
      parts.media.setAttribute('aria-hidden', 'true');
    } else if (!parts.meta && cell.querySelector('ul, ol')) parts.meta = decorateMeta(cell, row);
    else parts.keywords = slot('writing-list-keywords', [...cell.children]);
  });
  if (parts.keywords) {
    const heading = parts.body && parts.body.querySelector('.writing-list-title > *');
    [...parts.keywords.children].forEach((p) => {
      const text = p.textContent.trim();
      const runs = text.split(',').map((r) => r.trim()).filter(Boolean);
      const isRuns = runs.length && runs.every((r) => row.title.includes(r));
      if (heading && isRuns) keepTogether(heading, runs);
      else row.keywords = `${row.keywords} ${text}`.trim();
    });
  }
  article.append(...Object.values(parts).filter(Boolean));
  if (row.id) article.id = row.id;

  const li = document.createElement('li');
  li.dataset.date = row.date;
  li.dataset.year = row.date.slice(0, 4);
  li.dataset.topics = row.topics.join(' ');
  li.dataset.search = [row.title, row.summary, ...row.labels, row.video ? 'video youtube' : '', li.dataset.year, row.keywords]
    .filter(Boolean).join(' ').toLowerCase();
  li.append(article);
  return li;
}

/** Year marks: the first row of each year carries the year (drawn by CSS). */
function markYears(items) {
  let last = null;
  let first = true;
  items.forEach((li) => {
    li.removeAttribute('data-year-mark');
    li.removeAttribute('data-first');
    if (li.hidden) return;
    if (first) li.dataset.first = '';
    first = false;
    if (li.dataset.year !== last) li.dataset.yearMark = li.dataset.year;
    last = li.dataset.year;
  });
}

export default function decorate(block) {
  const list = document.createElement('ol');
  list.className = 'writing-list-items';
  [...block.querySelectorAll(':scope > div')].forEach((div) => list.append(decorateRow(div)));
  markYears([...list.children]);
  block.replaceChildren(list);

  const section = block.closest('.section');
  if (section && section.dataset.label) {
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', section.dataset.label);
  }
}
