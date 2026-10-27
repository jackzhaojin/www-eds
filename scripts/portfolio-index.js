/** Native portfolio-index data: the Row list (projects, dynamic) rows and the ItemList. */
import loadQueryIndex from './query-index.js';
import { el, headingId } from './listing-cells.js';

const SITE = 'https://www.jackzhaojin.com';
const ANCHOR = /^[a-z][a-z0-9-]*$/;
const text = (value) => (typeof value === 'string' ? value.trim() : '');

function publicURL(value) {
  if (!text(value)) return '';
  const url = new URL(value, SITE);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid project link protocol');
  return url.href;
}

/**
 * One project page (/portfolio/<slug>/). The name is the page title without the site suffix,
 * the tagline the h1's italic subtitle; project-dates, project-kind, project-order and
 * project-anchors (the old /portfolio/#ch-* anchors, space separated) are page metadata.
 */
export function readProject(record) {
  const url = new URL(text(record.path), SITE);
  const name = text(record.title).replace(/\s*\|\s*Jack Jin\s*$/, '');
  const anchors = text(record.anchors).split(/\s+/).filter(Boolean);
  if (url.origin !== SITE || !/^\/portfolio\/[^/]+\/$/.test(url.pathname) || !name
    || anchors.some((anchor) => !ANCHOR.test(anchor))) {
    throw new Error('A project page is missing a valid path, title or anchor');
  }
  return {
    path: url.pathname,
    url: url.href,
    id: url.pathname.split('/').filter(Boolean).pop(),
    name,
    tagline: text(record.tagline),
    summary: text(record.description),
    dates: text(record.dates),
    kind: text(record.kind),
    order: text(record.order) && Number.isFinite(Number(record.order))
      ? Number(record.order) : Number.MAX_SAFE_INTEGER,
    image: publicURL(record.image),
    anchors,
  };
}

/** Every published project page, in portfolio order. */
export async function loadPortfolioIndex(source, fetchData = fetch) {
  const records = await loadQueryIndex(source, fetchData);
  const projects = records.filter((record) => text(record.path).startsWith('/portfolio/')
    && record.path !== '/portfolio/' && !/(?:^|[,\s])noindex\b/i.test(text(record.robots)))
    .map(readProject);
  const ids = new Set();
  projects.forEach((project) => {
    [project.id, ...project.anchors].forEach((id) => {
      if (ids.has(id)) throw new Error(`Duplicate project anchor: ${id}`);
      ids.add(id);
    });
  });
  return projects.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/**
 * The projects as row-list rows in the talks shape: when (dates, kind), body (the linked
 * heading, the tagline, the summary) and anchors. The row's id is its first old chapter
 * anchor, so /portfolio/#ch-* still lands on it.
 */
export function projectRows(projects) {
  return projects.map((project) => [
    [el('p', {}, project.dates), project.kind && el('p', {}, project.kind)],
    [
      el('h2', { id: headingId(project.name) }, el('a', { href: project.path }, project.name)),
      project.tagline && el('p', {}, project.tagline),
      project.summary && el('p', {}, project.summary),
    ],
    project.anchors.length && [el('p', {}, project.anchors.join(' '))],
  ].filter(Boolean).map((cell) => cell.filter(Boolean)));
}

/** The ItemList entries, one per visible row. */
export function projectSchemaItems(projects) {
  return projects.map((project) => ({
    '@type': 'CreativeWork',
    '@id': `${project.url}#project`,
    url: project.url,
    name: project.name,
    ...(project.tagline ? { alternativeHeadline: project.tagline } : {}),
    description: project.summary,
    ...(project.image ? { image: project.image.split('?')[0] } : {}),
  }));
}
