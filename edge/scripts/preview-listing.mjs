#!/usr/bin/env node
/*
 * What www serves for a listing page, before the Worker is deployed or a hub is switched. A
 * local server that fetches each path from an EDS preview host and runs the Worker's own
 * renderListingHTML and renderPageSchemaHTML (src/listings.mjs) over every HTML page, reading
 * the index from www. The
 * drafts are 404s on the Worker hosts, so this is how to see them as crawlers will:
 *
 *   node edge/scripts/preview-listing.mjs [--origin https://main--www-eds--jackzhaojin.aem.page]
 *       [--index https://www.jackzhaojin.com] [--port 8788]
 *
 * Then open http://localhost:8788/drafts/writing-index/ (or /portfolio/) and view its
 * source: the rows are inside the block and the generated JSON-LD is in the head. The
 * x-listing header says whether a page was filled.
 */
import http from 'node:http';
import { renderListingHTML, renderPageSchemaHTML } from '../src/listings.mjs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const ORIGIN = arg('--origin', 'https://main--www-eds--jackzhaojin.aem.page');
const INDEX = arg('--index', 'https://www.jackzhaojin.com');
const PORT = Number(arg('--port', 8788));

http.createServer(async (req, res) => {
  try {
    const upstream = await fetch(new URL(req.url, ORIGIN));
    const type = upstream.headers.get('content-type') || 'application/octet-stream';
    let body = Buffer.from(await upstream.arrayBuffer());
    let filled = null;
    if (type.startsWith('text/html')) {
      const html = body.toString('utf8');
      const listed = await renderListingHTML(html, (path) => fetch(new URL(path, INDEX)));
      filled = renderPageSchemaHTML(listed ?? html) ?? listed;
      if (filled) body = Buffer.from(filled);
    }
    res.writeHead(upstream.status, { 'content-type': type, 'x-listing': filled ? 'filled' : 'untouched' });
    res.end(body);
    // eslint-disable-next-line no-console
    if (filled) console.log(`${req.url}: filled at the edge (${body.length} bytes)`);
  } catch (error) {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end(`preview-listing: ${error.message}`);
  }
}).listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`http://localhost:${PORT}/drafts/writing-index/ and /portfolio/, from ${ORIGIN}`);
});
