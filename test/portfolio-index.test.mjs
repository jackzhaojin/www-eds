import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadPortfolioIndex, projectRows, projectSchemaItems, readProject,
} from '../scripts/portfolio-index.js';

const project = (slug, order, extra = {}) => ({
  path: `/portfolio/${slug}/`, title: `${slug} | Jack Jin`, order: String(order), ...extra,
});
const response = (result) => ({ ok: true, json: async () => result });

test('reads the name from the page title and keeps the old chapter anchors', () => {
  const p = readProject(project('anima-mesh', 1, {
    tagline: 'The company-of-0 experiment', description: 'D', dates: '2026', kind: 'Flagship', anchors: 'ch-anima',
  }));
  assert.equal(p.name, 'anima-mesh');
  assert.equal(p.id, 'anima-mesh');
  assert.deepEqual(p.anchors, ['ch-anima']);
  assert.throws(() => readProject(project('x', 1, { anchors: 'Not An Id' })), /anchor/);
  assert.throws(() => readProject({ path: '/portfolio/', title: 'Portfolio | Jack Jin' }), /path/);
});

test('loads every page, skips the hub and noindex pages, and sorts by project order', async () => {
  const rows = [project('b', 2), project('a', 1), { path: '/portfolio/', title: 'Hub' },
    project('hidden', 3, { robots: 'noindex, follow' })];
  const projects = await loadPortfolioIndex('https://example.com/portfolio-index.json', async () => response({ total: rows.length, offset: 0, data: rows }));
  assert.deepEqual(projects.map((p) => p.id), ['a', 'b']);
});

test('rows link the heading to the page and carry the anchors; the ItemList points at pages', () => {
  const [p] = [readProject(project('ciam-demo', 7, {
    tagline: 'T', description: 'S', dates: '2026', anchors: 'ch-ciam',
  }))];
  const [row] = projectRows([p]);
  assert.equal(row[1][0].children[0].attrs.href, '/portfolio/ciam-demo/');
  assert.deepEqual(row[2][0].children, ['ch-ciam']);
  assert.equal(projectSchemaItems([p])[0].url, 'https://www.jackzhaojin.com/portfolio/ciam-demo/');
});
