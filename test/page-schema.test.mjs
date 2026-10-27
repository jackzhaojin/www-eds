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

test('a talk page is an Event in a WebPage with its breadcrumb', () => {
  const graph = pageGraph({
    canonical: 'https://www.jackzhaojin.com/talks/adaptto-2026/',
    title: 'AI Agent-Driven Content Migration | Jack Jin',
    description: 'D',
    meta: metaOf({
      'talk-id': 'adaptto-2026', 'talk-date': 'September 29, 2026', 'talk-kind': 'Conference session', 'talk-event': 'adaptTo() 2026 · Berlin · with Katie Phillips',
    }),
  })['@graph'];
  assert.deepEqual(graph.map((n) => n['@type']), ['Person', 'WebSite', 'WebPage', 'BreadcrumbList', 'Event']);
  const event = graph[4];
  assert.equal(event.name, 'AI Agent-Driven Content Migration');
  assert.equal(event.startDate, '2026-09-29');
  assert.deepEqual(event.superEvent, { '@type': 'Event', name: 'adaptTo() 2026' });
  assert.deepEqual(event.location, { '@type': 'Place', name: 'Berlin' });
  assert.equal(graph[2].mainEntity['@id'], event['@id']);
  assert.equal(graph[3].itemListElement[1].item, 'https://www.jackzhaojin.com/talks/');
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
