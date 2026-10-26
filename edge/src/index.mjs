/*
 * The www.jackzhaojin.com Worker: project sites first, then Edge Delivery (Adobe's Cloudflare
 * worker, edge/src/aem.mjs). The project-site check runs before any of the EDS logic, so project
 * sites keep their paths and query strings untouched. On the gh host (MODE "github") every path
 * is GitHub Pages. Every host but www answers noindex, and 404s its robots.txt and sitemaps.
 * Browsers keep EDS pages for 10 minutes (pageCache), however long the edge keeps them.
 */
import { aemFetch } from './aem.mjs';
import {
  githubFetch, hiddenFromCrawlers, isProjectPath, pageCache, projectFetch, robots,
} from './routes.mjs';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    let res;
    if (hiddenFromCrawlers(pathname, env)) res = new Response('Not found', { status: 404 });
    else if (env.MODE === 'github') res = await githubFetch(request, env);
    else if (isProjectPath(pathname)) res = await projectFetch(request, env);
    else res = pageCache(await aemFetch(request, env, ctx), pathname);
    return robots(res, env);
  },
};
