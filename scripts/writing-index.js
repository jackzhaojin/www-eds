import loadQueryIndex from './query-index.js';

const SITE = 'https://www.jackzhaojin.com';
const text = (value) => (typeof value === 'string' ? value.trim() : '');

function publicURL(value) {
  if (!text(value)) return '';
  const url = new URL(value, SITE);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid writing link protocol');
  return url.href;
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
  };
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

const p = (value) => {
  const el = document.createElement('p');
  el.textContent = value;
  return el;
};
const link = (href, label) => {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  return a;
};
const list = (values) => {
  const ul = document.createElement('ul');
  values.forEach((value) => {
    const li = document.createElement('li');
    li.textContent = value;
    ul.append(li);
  });
  return ul;
};

/** Build the same semantic cells consumed by the shared authored-row decorator. */
export function writingRows(articles, picture) {
  return articles.map((article) => {
    const row = document.createElement('div');
    const meta = document.createElement('div');
    if (article.dateLabel) meta.append(p(article.dateLabel));
    meta.append(list(article.topics), list(article.facts));
    const body = document.createElement('div');
    const heading = document.createElement('h2');
    heading.append(link(article.path, article.title));
    if (article.headingId) heading.id = article.headingId;
    body.append(heading);
    if (article.summary) body.append(p(article.summary));
    if (article.talkUrl) {
      const talk = p('');
      talk.append(link(article.talkUrl, article.talkLabel));
      body.append(talk);
    }
    if (article.talkNote) body.append(p(article.talkNote));
    if (article.watchUrl) {
      const watch = p('');
      watch.append(link(article.watchUrl, article.watchLabel));
      body.append(watch);
    }
    row.append(meta, body);
    if (article.image) {
      const cover = document.createElement('div');
      cover.append(picture(article.image, '', false));
      row.append(cover);
    }
    if (article.keywords || article.nowrap) {
      const extras = document.createElement('div');
      if (article.keywords) extras.append(p(article.keywords));
      if (article.nowrap) extras.append(p(article.nowrap));
      row.append(extras);
    }
    return row;
  });
}
