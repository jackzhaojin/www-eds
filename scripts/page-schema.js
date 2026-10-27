/**
 * The structured data of a talk page (/talks/<id>/, metadata talk-*) and a project page
 * (/portfolio/<slug>/, metadata project-*), generated from the page's own head and never
 * authored: the site's Person and WebSite, the WebPage with its BreadcrumbList, and the page's
 * subject. A talk is an Event, with its recording as a VideoObject when the page links one and
 * carries video-uploaded (Google's one rich result for a past talk), its write-up and its
 * project. A project is SoftwareSourceCode when it links a GitHub repository, else a
 * CreativeWork. The edge Worker writes it into
 * the served HTML (edge/src/listings.mjs); on preview hosts the browser adds it
 * (syncPageSchema), from the same values either way.
 */
import { PERSON, WEBSITE } from './collection-schema.js';

const SITE = 'https://www.jackzhaojin.com';
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december'];
const HUBS = {
  talk: { name: 'Talks & Presentations', url: `${SITE}/talks/` },
  project: { name: 'Portfolio', url: `${SITE}/portfolio/` },
};

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

const youtubeId = (href) => {
  const match = href.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match ? match[1] : '';
};

/** The page's links by kind: the first video, write-up and project page, and its repositories. */
function linkKinds(links) {
  const urls = links.map((href) => new URL(href, `${SITE}/`));
  const site = urls.filter((url) => url.origin === SITE);
  const repos = [...new Set(urls.filter((url) => url.hostname === 'github.com')
    .map((url) => url.pathname.split('/').slice(1, 3).join('/'))
    .filter((repo) => repo.includes('/')))].map((repo) => `https://github.com/${repo}`);
  return {
    video: urls.map((url) => youtubeId(url.href)).find(Boolean) || '',
    writeup: site.find((url) => /^\/writing\/[^/]+\/$/.test(url.pathname))?.href || '',
    project: site.find((url) => /^\/portfolio\/[^/]+\/$/.test(url.pathname))?.href.replace(/#.*$/, '') || '',
    repos,
  };
}

/** The talk-event line, "Event · Place · with co-speakers": the event and the place. */
function eventParts(text) {
  const [event, place] = (text || '').split(/\s+·\s+/).map((part) => part.trim());
  return { event, place: place && !/^with\b/i.test(place) ? place : '' };
}

/**
 * The page's whole graph, or null for a page that is neither a talk nor a project.
 * meta(name) returns a metadata value; tagline is the h1's italic subtitle (projects).
 */
export function pageGraph({
  canonical, title, description, image, tagline, meta, links = [],
}) {
  let kind = '';
  if (meta('talk-id')) kind = 'talk';
  else if (meta('project-order')) kind = 'project';
  if (!kind || !canonical) return null;
  const name = (title || '').replace(/\s*\|\s*Jack Jin\s*$/, '');
  const hub = HUBS[kind];
  let subject;
  const found = linkKinds(links);
  if (kind === 'talk') {
    const { event, place } = eventParts(meta('talk-event'));
    const startDate = isoDate(meta('talk-date'));
    const recording = found.video && meta('video-uploaded') ? {
      '@type': 'VideoObject',
      name,
      ...(description ? { description } : {}),
      thumbnailUrl: `https://i.ytimg.com/vi/${found.video}/maxresdefault.jpg`,
      uploadDate: meta('video-uploaded'),
      ...(meta('video-duration') ? { duration: meta('video-duration') } : {}),
      embedUrl: `https://www.youtube.com/embed/${found.video}`,
      url: `https://www.youtube.com/watch?v=${found.video}`,
    } : null;
    subject = {
      '@type': 'Event',
      '@id': `${canonical}#talk`,
      name,
      ...(description ? { description } : {}),
      url: canonical,
      ...(startDate ? { startDate } : {}),
      ...(image ? { image } : {}),
      ...(meta('talk-kind') ? { additionalType: meta('talk-kind') } : {}),
      performer: { '@id': PERSON['@id'] },
      ...(event ? { superEvent: { '@type': 'Event', name: event } } : {}),
      ...(place ? { location: { '@type': 'Place', name: place } } : {}),
      ...(recording ? { recordedIn: recording } : {}),
      ...(found.writeup ? { subjectOf: { '@type': 'BlogPosting', url: found.writeup } } : {}),
      ...(found.project ? { about: { '@id': `${found.project}#project` } } : {}),
    };
  } else {
    subject = {
      '@type': found.repos.length ? 'SoftwareSourceCode' : 'CreativeWork',
      '@id': `${canonical}#project`,
      name,
      ...(tagline ? { alternativeHeadline: tagline } : {}),
      ...(description ? { description } : {}),
      url: canonical,
      ...(image ? { image } : {}),
      author: { '@id': PERSON['@id'] },
      ...(meta('project-dates') ? { temporalCoverage: coverage(meta('project-dates')) } : {}),
      ...(found.repos.length
        ? { codeRepository: found.repos.length > 1 ? found.repos : found.repos[0] } : {}),
    };
  }
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
            '@type': 'ListItem', position: 2, name: hub.name, item: hub.url,
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
