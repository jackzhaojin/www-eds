import assert from 'node:assert/strict';
import test from 'node:test';
import { isoDate, pageGraph } from '../scripts/page-schema.js';

const metaOf = (values) => (name) => values[name] || '';

test('dates stay as precise as they were written', () => {
  assert.equal(isoDate('September 29, 2026'), '2026-09-29');
  assert.equal(isoDate('April 2026'), '2026-04');
  assert.equal(isoDate('2024'), '2024');
  assert.equal(isoDate('sometime'), '');
});

test('a project page is a CreativeWork; other pages get nothing', () => {
  const graph = pageGraph({
    canonical: 'https://www.jackzhaojin.com/portfolio/ciam-demo/',
    title: 'CIAM Demo | Jack Jin',
    tagline: 'Customer identity, end to end',
    meta: metaOf({ 'project-order': '7', 'project-dates': '2026 to 2026' }),
  })['@graph'];
  assert.equal(graph[4]['@type'], 'CreativeWork');
  assert.equal(graph[4].alternativeHeadline, 'Customer identity, end to end');
  assert.equal(graph[4].temporalCoverage, '2026/2026');
  assert.equal(pageGraph({ canonical: 'https://www.jackzhaojin.com/privacy/', title: 'Privacy', meta: metaOf({}) }), null);
});

test('a project with a repo is code; a talk id makes no page graph (v1.3.0)', () => {
  assert.equal(pageGraph({
    canonical: 'https://www.jackzhaojin.com/talks/ai-tinkerers-2026/', title: 'T', meta: metaOf({ 'talk-id': 'ai-tinkerers-2026' }),
  }), null);
  const project = pageGraph({
    canonical: 'https://www.jackzhaojin.com/portfolio/anima-mesh/',
    title: 'Anima Mesh | Jack Jin',
    meta: metaOf({ 'project-order': '1' }),
    links: ['https://github.com/jackzhaojin/anima-mesh/tree/main/docs', 'https://github.com/jackzhaojin/anima-mesh'],
  })['@graph'][4];
  assert.equal(project['@type'], 'SoftwareSourceCode');
  assert.equal(project.codeRepository, 'https://github.com/jackzhaojin/anima-mesh');
});
