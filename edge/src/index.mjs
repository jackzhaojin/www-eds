/*
 * The www.jackzhaojin.com Worker: project sites first, then Edge Delivery (Adobe's Cloudflare
 * worker, edge/src/aem.mjs). The project-site check runs before any of the EDS logic, so project
 * sites keep their paths and query strings untouched.
 */
import { aemFetch } from './aem.mjs';
import { isProjectPath, projectFetch } from './routes.mjs';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (isProjectPath(pathname)) return projectFetch(request, env);
    return aemFetch(request, env, ctx);
  },
};
