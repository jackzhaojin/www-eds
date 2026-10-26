/** Keep the collection's single ItemList aligned with its API-derived entities. */
export function collectionURL(defaultPath) {
  return document.querySelector('link[rel="canonical"]')?.href
    || new URL(defaultPath, window.location.href).href;
}

export default function syncCollectionItems(items, defaultPath) {
  const canonical = collectionURL(defaultPath);
  let script;
  let graph;
  let page;
  [...document.querySelectorAll('script[type="application/ld+json"]')].some((candidate) => {
    try {
      const parsed = JSON.parse(candidate.textContent);
      const nodes = parsed['@graph'] || [parsed];
      const collection = nodes.find((node) => [node['@type']].flat().includes('CollectionPage'));
      if (!collection) return false;
      script = candidate;
      graph = parsed['@graph'] ? parsed : { '@context': 'https://schema.org', '@graph': nodes };
      page = collection;
      return true;
    } catch {
      return false;
    }
  });
  if (!graph) {
    page = {
      '@type': 'CollectionPage', '@id': `${canonical}#webpage`, url: canonical, name: document.title,
    };
    graph = { '@context': 'https://schema.org', '@graph': [page] };
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.append(script);
  }
  const id = page.mainEntity?.['@id'] || `${canonical}#collection`;
  const person = graph['@graph'].find((node) => [node['@type']].flat().includes('Person'));
  const collection = {
    '@type': 'ItemList',
    '@id': id,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { ...(person ? { author: { '@id': person['@id'] } } : {}), ...item },
    })),
  };
  page.mainEntity = { '@id': id };
  const existing = graph['@graph'].findIndex((node) => node['@id'] === id);
  if (existing >= 0) graph['@graph'][existing] = collection;
  else graph['@graph'].push(collection);
  script.textContent = JSON.stringify(graph);
}
