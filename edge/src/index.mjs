/*
 * The www.jackzhaojin.com Worker: project sites first, then Edge Delivery (Adobe's Cloudflare
 * worker, edge/src/aem.mjs). The project-site check runs before any of the EDS logic, so project
 * sites keep their paths and query strings untouched. On the gh host (MODE "github") every path
 * is GitHub Pages. Every host but www answers noindex.
 */
import { aemFetch } from './aem.mjs';
import {
  githubFetch, isProjectPath, projectFetch, robots,
} from './routes.mjs';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    let res;
    if (env.MODE === 'github') res = await githubFetch(request, env);
    else if (isProjectPath(pathname)) res = await projectFetch(request, env);
    else res = await aemFetch(request, env, ctx);
    return robots(res, env);
  },
};
