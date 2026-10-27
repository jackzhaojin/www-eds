/*
 * Dynamic listings, rendered at the edge. An author writes a hub page with one listing block
 * and its Source row (Writing index, Row list (talks, dynamic) or Row list (projects,
 * dynamic)) and nothing else: no rows,
 * no JSON-LD. Here the Worker reads the index the Source row names and serves the page with the
 * rows inside that block and the page's JSON-LD in the head, so crawlers that don't run
 * JavaScript read the whole list. The rows and the graph come from the same code the browser
 * runs on preview hosts (scripts/listing-cells.js, writing-index.js, talks-index.js,
 * collection-schema.js). If the index can't be read, the page goes out as authored and the
 * browser fills it in.
 */
import { rowsToHTML } from '../../scripts/listing-cells.js';
import { within } from '../../scripts/query-index.js';
import { loadWritingIndex, writingRows, writingSchemaItems } from '../../scripts/writing-index.js';
import { loadTalksIndex, talkRows, talkSchemaItems } from '../../scripts/talks-index.js';
import { loadPortfolioIndex, projectRows, projectSchemaItems } from '../../scripts/portfolio-index.js';
import { collectionGraph } from '../../scripts/collection-schema.js';
import { pageGraph } from '../../scripts/page-schema.js';

/** How long the edge keeps an index between publishes at most (s). A publish purges it sooner. */
export const INDEX_TTL = 300;
/** How long a page waits for its index before it goes out as authored (ms). */
const INDEX_WAIT = 3000;

const LISTINGS = [
  {
    block: '<div class="writing-index">',
    load: loadWritingIndex,
    rows: writingRows,
    items: (records) => writingSchemaItems(records),
  },
  {
    block: '<div class="row-list talks dynamic">',
    load: loadTalksIndex,
    rows: talkRows,
    items: (records, canonical) => talkSchemaItems(records, canonical),
  },
  {
    block: '<div class="row-list projects dynamic">',
    load: loadPortfolioIndex,
    rows: projectRows,
    items: (records) => projectSchemaItems(records),
  },
];

const PAGE = /(\/|\/[^./]+)$/;
const LD_JSON = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

const unescape = (text) => text
  .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
  .replace(/&#(\d+);/g, (m, dec) => String.fromCodePoint(Number(dec)))
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

const headValue = (html, pattern) => {
  const match = html.match(pattern);
  return match ? unescape(match[1]).trim() : '';
};

/** The index of the </div> that closes the div opening at start. */
function closingDiv(html, start) {
  const tags = /<div\b|<\/div>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[0] === '</div>' ? -1 : 1;
    if (!depth) return match.index;
  }
  return -1;
}

/**
 * The page HTML with its dynamic listing filled in, or null when it has none (or none to fill).
 * fetchIndex(path) answers like fetch for an index path on the EDS origin.
 */
export async function renderListingHTML(html, fetchIndex) {
  const listing = LISTINGS.find(({ block }) => html.includes(block));
  if (!listing) return null;
  const start = html.indexOf(listing.block);
  const end = closingDiv(html, start);
  if (end < 0) return null;
  const href = html.slice(start, end).match(/href="([^"]+)"/)?.[1];
  if (!href) return null;
  const index = new URL(unescape(href), 'https://www.jackzhaojin.com/');
  if (!index.pathname.endsWith('.json')) return null;

  const records = await within(
    listing.load(index.href, (url) => {
      const { pathname, search } = new URL(url);
      return fetchIndex(`${pathname}${search}`);
    }),
    INDEX_WAIT,
  );
  if (!records.length) return null;
  const canonical = headValue(html, /<link rel="canonical" href="([^"]*)"/)
    || `https://www.jackzhaojin.com${index.pathname.replace(/-index\.json$/, '/')}`;
  const graph = collectionGraph({
    canonical,
    title: headValue(html, /<title>([^<]*)<\/title>/),
    description: headValue(html, /<meta name="description" content="([^"]*)"/),
    items: listing.items(records, canonical),
  });
  // One graph per page: an authored CollectionPage graph would contradict the generated one.
  const withoutAuthored = (text) => text.replace(LD_JSON, (tag, json) => (json.includes('"CollectionPage"') ? '' : tag));
  const ldJSON = `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`;
  const head = withoutAuthored(html.slice(0, start)).replace('</head>', `${ldJSON}\n</head>`);
  return `${head}${html.slice(start, end)}${rowsToHTML(listing.rows(records))}${html.slice(end)}`;
}

/**
 * A talk or project page with its generated JSON-LD graph in the head (scripts/page-schema.js,
 * from the page's own title, description, image and talk-* or project-* metadata), or null for
 * any other page and for a page that already has JSON-LD.
 */
export function renderPageSchemaHTML(html) {
  const head = html.slice(0, html.indexOf('</head>') + 1 || html.length);
  if (!/<meta name="(talk-id|project-order)"/.test(head) || head.includes('application/ld+json')) return null;
  const graph = pageGraph({
    canonical: headValue(head, /<link rel="canonical" href="([^"]*)"/),
    title: headValue(head, /<title>([^<]*)<\/title>/),
    description: headValue(head, /<meta name="description" content="([^"]*)"/),
    image: headValue(head, /<meta property="og:image" content="([^"]*)"/),
    tagline: headValue(html, /<h1[^>]*>[\s\S]*?<em>([^<]*)<\/em>[\s\S]*?<\/h1>/),
    meta: (name) => headValue(head, new RegExp(`<meta name="${name}" content="([^"]*)"`)),
    links: [...(html.match(/<main>[\s\S]*<\/main>/)?.[0] || '').matchAll(/<a href="([^"]+)"/g)]
      .map((match) => unescape(match[1])),
  });
  if (!graph) return null;
  const ldJSON = `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>`;
  return html.replace('</head>', `${ldJSON}\n</head>`);
}

/**
 * Fills the dynamic listing of an EDS page response (www and staging), reading the index
 * straight from the EDS origin: a fetch to the www hostname would reach the zone's origin,
 * GitHub Pages. A talk or project page gets its generated JSON-LD instead. Every other
 * response passes through untouched.
 * @param {Response} res The EDS response
 * @param {Request} request The incoming request
 * @param {{ORIGIN_HOSTNAME: string}} env Worker vars
 */
export async function renderListings(res, request, env) {
  const type = res.headers.get('content-type') || '';
  const { pathname } = new URL(request.url);
  if (request.method !== 'GET' || res.status !== 200 || !type.startsWith('text/html') || !PAGE.test(pathname)) return res;
  const html = await res.text();
  let filled = null;
  try {
    filled = await renderListingHTML(html, (path) => fetch(`https://${env.ORIGIN_HOSTNAME}${path}`, {
      cf: { cacheEverything: true, cacheTtl: INDEX_TTL },
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`listing on ${pathname} left to the browser: ${error.message}`);
  }
  filled = filled ?? renderPageSchemaHTML(html);
  const out = new Response(filled ?? html, res);
  out.headers.delete('content-length');
  if (filled) {
    // The body is no longer the origin's: its validators would let a browser keep an old list.
    out.headers.delete('etag');
    out.headers.delete('last-modified');
  }
  return out;
}
