/**
 * The structured data of a project page (/portfolio/<slug>/, metadata project-*), generated from
 * the page's own head and never authored: the site's Person and WebSite, the WebPage with its
 * BreadcrumbList, and the project. A project is SoftwareSourceCode when it links a GitHub
 * repository, else a CreativeWork. The edge Worker writes it into the served HTML
 * (edge/src/listings.mjs); on preview hosts the browser adds it (syncPageSchema), from the same
 * values either way. Talks have no pages since v1.3.0 (scripts/talks-list.js).
 */
import { PERSON, WEBSITE } from './collection-schema.js';

const SITE = 'https://www.jackzhaojin.com';
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december'];
const HUB = { name: 'Portfolio', url: `${SITE}/portfolio/` };

/** An authored date as ISO 8601, as precise as it was written: "September 2026" is 2026-09. */
export function isoDate(text) {
  const value = (text || '').trim();
  const pad = (n) => String(n).padStart(2, '0');
  let match = value.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (match && MONTHS.includes(match[1].toLowerCase())) {
    return `${match[3]}-${pad(MONTHS.indexOf(match[1].toLowerCase()) + 1)}-${pad(match[2])}`;
  }
  match = value.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (match && MONTHS.includes(match[1].toLowerCase())) {
    return `${match[2]}-${pad(MONTHS.indexOf(match[1].toLowerCase()) + 1)}`;
  }
  return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(value) ? value : '';
}

/** "2025 to 2026" as an ISO interval (2025/2026); a single year stays as it is. */
const coverage = (text) => (text || '').trim().replace(/\s+to\s+/i, '/');

/** The GitHub repositories the page links, one URL per owner/name. */
function repositories(links) {
  return [...new Set(links.map((href) => new URL(href, `${SITE}/`))
    .filter((url) => url.hostname === 'github.com')
    .map((url) => url.pathname.split('/').slice(1, 3).join('/'))
    .filter((repo) => repo.includes('/')))].map((repo) => `https://github.com/${repo}`);
}

/**
 * The page's whole graph, or null for a page that isn't a project.
 * meta(name) returns a metadata value; tagline is the h1's italic subtitle.
 */
export function pageGraph({
  canonical, title, description, image, tagline, meta, links = [],
}) {
  if (!meta('project-order') || !canonical) return null;
  const name = (title || '').replace(/\s*\|\s*Jack Jin\s*$/, '');
  const repos = repositories(links);
  const subject = {
    '@type': repos.length ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': `${canonical}#project`,
    name,
    ...(tagline ? { alternativeHeadline: tagline } : {}),
    ...(description ? { description } : {}),
    url: canonical,
    ...(image ? { image } : {}),
    author: { '@id': PERSON['@id'] },
    ...(meta('project-dates') ? { temporalCoverage: coverage(meta('project-dates')) } : {}),
    ...(repos.length ? { codeRepository: repos.length > 1 ? repos : repos[0] } : {}),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      PERSON,
      WEBSITE,
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        ...(description ? { description } : {}),
        isPartOf: { '@id': WEBSITE['@id'] },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        mainEntity: { '@id': subject['@id'] },
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/`,
          },
          {
            '@type': 'ListItem', position: 2, name: HUB.name, item: HUB.url,
          },
          {
            '@type': 'ListItem', position: 3, name, item: canonical,
          },
        ],
      },
      subject,
    ],
  };
}

/** Browser side: adds the graph unless the page already has one (the edge put it there). */
export function syncPageSchema() {
  if (document.querySelector('script[type="application/ld+json"]')) return;
  const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content.trim() || '';
  const graph = pageGraph({
    canonical: document.querySelector('link[rel="canonical"]')?.href || window.location.href,
    title: document.title,
    description: meta('description'),
    image: document.querySelector('meta[property="og:image"]')?.content || '',
    tagline: document.querySelector('main h1 em')?.textContent.trim() || '',
    meta,
    links: [...document.querySelectorAll('main a[href]')].map((a) => a.getAttribute('href')),
  });
  if (!graph) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(graph);
  document.head.append(script);
}
