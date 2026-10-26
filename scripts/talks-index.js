/** Native talks-index data, rendered with the existing row-list markup. */
import loadQueryIndex from './query-index.js';
import syncCollectionItems, { collectionURL } from './collection-schema.js';

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
  return {
    id,
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

const paragraph = (text) => {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
};
const slot = (className, ...nodes) => {
  const div = document.createElement('div');
  div.className = className;
  div.append(...nodes);
  return div;
};

/** API copy is authored in the record documents; all inserted values remain text. */
export function renderTalks(talks) {
  const list = document.createElement('ol');
  list.className = 'row-list-items';
  talks.forEach((talk) => {
    const li = document.createElement('li');
    li.id = talk.id;
    const when = slot('row-list-when');
    if (talk.date) when.append(slot('row-list-date', paragraph(talk.date)));
    if (talk.kind) when.append(slot('row-list-type', paragraph(talk.kind)));
    if (when.children.length) li.append(when);
    const heading = document.createElement('h2');
    heading.textContent = talk.title;
    heading.id = talk.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const body = slot('row-list-body', slot('row-list-title', heading));
    if (talk.event) body.append(slot('row-list-event', paragraph(talk.event)));
    if (talk.description) {
      body.append(slot('row-list-description', ...talk.description.split(/\n\n/).map(paragraph)));
    }
    const links = slot('row-list-links cta-slot');
    talk.links.forEach((link) => {
      const p = paragraph('');
      p.className = 'text-link-wrapper';
      const a = document.createElement('a');
      a.className = 'text-link';
      a.href = link.url;
      a.textContent = link.label;
      p.append(a);
      links.append(p);
    });
    const cluster = slot('row-list-cluster');
    if (links.children.length) cluster.append(links);
    if (talk.status) cluster.append(slot('row-list-status', paragraph(talk.status)));
    body.append(cluster);
    li.append(body);
    talk.aliases.forEach((id) => {
      const target = document.createElement('span');
      target.id = id;
      li.firstElementChild.prepend(target);
    });
    list.append(li);
  });
  return list;
}

/** Update the page graph from the same records as the visible list. */
export function syncTalkSchema(talks) {
  const canonical = collectionURL('/talks/');
  syncCollectionItems(talks.map((talk) => ({
    '@type': 'CreativeWork',
    '@id': `${canonical}#${talk.id}`,
    url: `${canonical}#${talk.id}`,
    name: talk.title,
    description: talk.description,
    ...(talk.kind ? { genre: talk.kind } : {}),
  })), '/talks/');
}
