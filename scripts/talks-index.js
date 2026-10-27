/** Native talks-index data, as the row-list talks rows and the page's ItemList. */
import loadQueryIndex from './query-index.js';
import { el, headingId, sitePath } from './listing-cells.js';

const ID = /^[a-z][a-z0-9-]*$/;
const string = (value) => (typeof value === 'string' ? value.trim() : '');
const array = (value) => (Array.isArray(value) ? value : []);

export function readTalk(record) {
  const id = string(record.id);
  const title = string(record.title);
  const aliases = string(record.aliases).split(/\s+/).filter(Boolean);
  if (!ID.test(id) || !title || aliases.some((alias) => !ID.test(alias))) {
    throw new Error('A talk record is missing a valid identity or title');
  }
  const labels = array(record.linkLabels);
  const urls = array(record.linkUrls);
  if (labels.length !== urls.length) throw new Error(`Talk ${id} has incomplete links`);
  const links = urls.map((href, i) => {
    const url = new URL(href, 'https://www.jackzhaojin.com/');
    if (!['https:', 'http:'].includes(url.protocol) || !string(labels[i])) {
      throw new Error(`Talk ${id} has an invalid link`);
    }
    return { label: string(labels[i]), url: url.href };
  });
  const page = string(record.path);
  const path = /^\/talks\/[a-z0-9-]+\/$/.test(page) ? page : '';
  return {
    id,
    path,
    title,
    aliases,
    links,
    order: string(record.order) && Number.isFinite(Number(record.order))
      ? Number(record.order) : Number.MAX_SAFE_INTEGER,
    date: string(record.date),
    kind: string(record.kind),
    event: string(record.event),
    description: string(record.description),
    status: string(record.status),
  };
}

/** Read every index page; an unavailable or malformed feed never silently looks empty. */
export async function loadTalksIndex(source, fetchData = fetch) {
  const records = await loadQueryIndex(source, fetchData);
  const talks = records.map(readTalk);
  const ids = new Set();
  talks.forEach((talk) => {
    [talk.id, ...talk.aliases].forEach((id) => {
      if (ids.has(id)) throw new Error(`Duplicate talk anchor: ${id}`);
      ids.add(id);
    });
  });
  return talks.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/**
 * The talks as row-list talks rows (scripts/listing-cells.js), the three cells an author writes:
 * when (date, kind), body (heading, linked to the talk's page, event, description, links,
 * status) and anchors (the id, then the older ids that still land on the row).
 */
export function talkRows(talks) {
  return talks.map((talk) => {
    const id = headingId(talk.title);
    // An alias the heading's own id already answers would be a duplicate id.
    const aliases = talk.aliases.filter((alias) => alias !== id);
    return [
      [el('p', {}, talk.date), talk.kind && el('p', {}, talk.kind)],
      [
        el('h2', { id }, talk.path ? el('a', { href: talk.path }, talk.title) : talk.title),
        talk.event && el('p', {}, talk.event),
        ...talk.description.split(/\n\n/).filter(Boolean).map((text) => el('p', {}, text)),
        ...talk.links.map((link) => el('p', {}, el('a', { href: sitePath(link.url) }, link.label))),
        talk.status && el('p', {}, talk.status),
      ],
      [el('p', {}, [talk.id, ...aliases].join(' '))],
    ].map((cell) => cell.filter(Boolean));
  });
}

/** The ItemList entries, one per visible row. */
export function talkSchemaItems(talks, canonical) {
  return talks.map((talk) => ({
    '@type': 'CreativeWork',
    '@id': talk.path ? `https://www.jackzhaojin.com${talk.path}#talk` : `${canonical}#${talk.id}`,
    url: talk.path ? `https://www.jackzhaojin.com${talk.path}` : `${canonical}#${talk.id}`,
    name: talk.title,
    description: talk.description,
    ...(talk.kind ? { genre: talk.kind } : {}),
  }));
}
