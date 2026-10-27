/** Native writing-index data, as the Writing index rows and the page's ItemList. */
import loadQueryIndex from './query-index.js';
import { el, headingId, sitePath } from './listing-cells.js';

const SITE = 'https://www.jackzhaojin.com';
const text = (value) => (typeof value === 'string' ? value.trim() : '');

function publicURL(value) {
  if (!text(value)) return '';
  const url = new URL(value, SITE);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid writing link protocol');
  return url.href;
}

/** The talk and project pages an article links to (the index's pages property), as site paths. */
const PAGE_PATH = /^\/(talks|portfolio)\/[a-z0-9-]+\/$/;
function linkedPages(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((href) => {
    try {
      const url = new URL(href, SITE);
      return url.origin === SITE ? url.pathname : '';
    } catch {
      return '';
    }
  }).filter((path) => PAGE_PATH.test(path)))];
}

export function readWriting(record) {
  const url = new URL(record.path, SITE);
  if (url.origin !== SITE || !/^\/writing\/[^/]+\/$/.test(url.pathname)
    || !text(record.title)) throw new Error('Invalid writing article identity');
  const date = text(record.date).slice(0, 10);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(Date.parse(`${date}T00:00:00Z`))
    || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)) throw new Error('Invalid writing date');
  const topics = [...new Set(text(record.topics).split('|').map((s) => s.trim()).filter(Boolean))];
  const facts = [text(record.readTime) || text(record.readTimeFallback), text(record.videoTime)]
    .filter(Boolean);
  return {
    path: url.pathname,
    url: url.href,
    id: url.pathname.split('/').filter(Boolean).pop().replace(/^\d{4}-\d{2}-\d{2}-/, ''),
    headingId: text(record.headingId),
    title: text(record.title),
    date,
    dateLabel: date ? new Intl.DateTimeFormat('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`)) : '',
    summary: text(record.summary) || text(record.description),
    image: publicURL(record.image || record.socialImage),
    topics,
    facts,
    talkUrl: publicURL(record.talkUrl),
    talkLabel: text(record.talkLabel) || 'View related talk',
    talkNote: text(record.talkNote),
    watchUrl: publicURL(record.watchUrl),
    watchLabel: text(record.watchLabel) || 'Watch on YouTube',
    keywords: text(record.keywords),
    nowrap: text(record.nowrap),
    pages: linkedPages(record.pages),
  };
}

/** The articles that link to a page (a site path), newest first as loadWritingIndex sorts. */
export const linkingTo = (articles, path) => articles
  .filter((article) => article.pages.includes(path));

/**
 * A Related list's rows (row-list's plain rows, scripts/listing-cells.js): the date, the linked
 * title and the card summary of each article that links to the page.
 */
export function relatedRows(articles) {
  return articles.map((article) => [
    [el('p', {}, article.date)],
    [el('p', {}, el('a', { href: article.path }, article.title))],
    article.summary && [el('p', {}, article.summary)],
  ].filter(Boolean));
}

export async function loadWritingIndex(source, fetchData = fetch) {
  const records = await loadQueryIndex(source, fetchData);
  const articles = records.filter((record) => text(record.path).startsWith('/writing/')
    && record.path !== '/writing/' && (!record.template || record.template === 'article')
    && !/(?:^|[,\s])noindex\b/i.test(text(record.robots))).map(readWriting);
  const ids = new Set();
  articles.forEach((article) => {
    if (ids.has(article.id)) throw new Error(`Duplicate writing anchor: ${article.id}`);
    ids.add(article.id);
  });
  return articles.sort((a, b) => b.date.localeCompare(a.date) || a.path.localeCompare(b.path));
}

/**
 * The articles as Writing index rows (scripts/listing-cells.js), the cells the writing-list
 * decorator reads: meta (date, topics, facts), body (linked heading, summary, talk link and
 * note, watch link), cover, and the hidden search keywords and keep-together title runs.
 */
export function writingRows(articles) {
  return articles.map((article) => [
    [
      article.dateLabel && el('p', {}, article.dateLabel),
      el('ul', {}, article.topics.map((topic) => el('li', {}, topic))),
      el('ul', {}, article.facts.map((fact) => el('li', {}, fact))),
    ],
    [
      el('h2', { id: article.headingId || headingId(article.title) }, el('a', { href: article.path }, article.title)),
      article.summary && el('p', {}, article.summary),
      article.talkUrl && el('p', {}, el('a', { href: sitePath(article.talkUrl) }, article.talkLabel)),
      article.talkNote && el('p', {}, article.talkNote),
      article.watchUrl && el('p', {}, el('a', { href: article.watchUrl }, article.watchLabel)),
    ],
    article.image && [el('img', { src: sitePath(article.image), alt: '' })],
    (article.keywords || article.nowrap) && [
      article.keywords && el('p', {}, article.keywords),
      article.nowrap && el('p', {}, article.nowrap),
    ],
  ].filter(Boolean).map((cell) => cell.filter(Boolean)));
}

/** The ItemList entries, one per visible row. */
export function writingSchemaItems(articles) {
  return articles.map((article) => ({
    '@type': 'BlogPosting',
    '@id': `${article.url}#article`,
    url: article.url,
    headline: article.title,
    name: article.title,
    description: article.summary,
    ...(article.date ? { datePublished: article.date } : {}),
    ...(article.image ? { image: article.image.split('?')[0] } : {}),
  }));
}
