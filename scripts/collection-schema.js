/**
 * The structured data of a listing page, generated from its records and never authored: the
 * site's Person and WebSite, the CollectionPage, its BreadcrumbList and the ItemList of the
 * visible rows. For the generated lists the edge Worker writes it into the served HTML
 * (edge/src/listings.mjs) and on preview hosts the browser adds it (syncCollectionSchema), from
 * the same records either way. The talks hub's rows are authored, so the browser writes its
 * graph from them on every host (scripts/talks-list.js).
 */
const SITE = 'https://www.jackzhaojin.com/';

export const PERSON = {
  '@type': 'Person',
  '@id': `${SITE}#person`,
  name: 'Jack Jin',
  url: SITE,
  jobTitle: 'Associate Director',
  worksFor: {
    '@type': 'Organization',
    name: 'Accenture',
    department: { '@type': 'Organization', name: 'Adobe Business Group' },
  },
  homeLocation: { '@type': 'Place', name: 'Columbus, Ohio' },
  sameAs: [
    'https://www.linkedin.com/in/jackjin',
    'https://github.com/jackzhaojin',
    'https://www.youtube.com/@jackjin8467',
    'https://www.credly.com/users/jack-jin',
  ],
  knowsAbout: [
    'Adobe Experience Manager',
    'Edge Delivery Services',
    'DA.live',
    'AI agents',
    'Model Context Protocol',
    'Cloud architecture',
  ],
  award: [
    'Adobe Experience Manager Champion, class of 2026-2027',
    'AEM Rockstar winner, Adobe Summit 2024',
  ],
};

export const WEBSITE = {
  '@type': 'WebSite',
  '@id': `${SITE}#website`,
  url: SITE,
  name: 'Jack Jin',
  publisher: { '@id': PERSON['@id'] },
};

/**
 * The page's whole graph. title is the page title ("Technical Writing | Jack Jin"); the
 * breadcrumb names the page without the site suffix.
 * @param {{canonical: string, title: string, description?: string, items: object[]}} page
 */
export function collectionGraph({
  canonical, title, description, items,
}) {
  const name = title.replace(/\s*\|\s*Jack Jin\s*$/, '');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      PERSON,
      WEBSITE,
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        ...(description ? { description } : {}),
        isPartOf: { '@id': WEBSITE['@id'] },
        about: { '@id': PERSON['@id'] },
        mainEntity: { '@id': `${canonical}#collection` },
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem', position: 1, name: 'Home', item: SITE,
          },
          {
            '@type': 'ListItem', position: 2, name, item: canonical,
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${canonical}#collection`,
        numberOfItems: items.length,
        itemListElement: items.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          // an Event names its performer instead
          item: item['@type'] === 'Event' ? item : { author: { '@id': PERSON['@id'] }, ...item },
        })),
      },
    ],
  };
}

/** The canonical URL of this page, or defaultPath on this host. */
export function collectionURL(defaultPath) {
  return document.querySelector('link[rel="canonical"]')?.href
    || new URL(defaultPath, window.location.href).href;
}

/**
 * Browser side: writes the graph into the page's JSON-LD, replacing any CollectionPage graph
 * already there. items is the item list, or a function of the canonical URL that returns it.
 */
export function syncCollectionSchema(items, defaultPath) {
  const canonical = collectionURL(defaultPath);
  const graph = collectionGraph({
    canonical,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    items: typeof items === 'function' ? items(canonical) : items,
  });
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
  let script = scripts.find((candidate) => candidate.textContent.includes('"CollectionPage"'));
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.append(script);
  }
  script.textContent = JSON.stringify(graph);
}
