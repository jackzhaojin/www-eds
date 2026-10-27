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

test('a recorded talk gets its VideoObject, write-up and project; a project with a repo is code', () => {
  const talk = pageGraph({
    canonical: 'https://www.jackzhaojin.com/talks/ai-tinkerers-2026/',
    title: 'OpenClaw 24/7 Development Agent | Jack Jin',
    meta: metaOf({ 'talk-id': 'ai-tinkerers-2026', 'video-uploaded': '2026-04-07', 'video-duration': 'PT12M' }),
    links: ['https://youtu.be/l3wIHurjERk', '/writing/2026-04-05-continuous-executive-agent-v2-1/', '/portfolio/continuous-executive-agent/'],
  })['@graph'][4];
  assert.equal(talk.recordedIn.thumbnailUrl, 'https://i.ytimg.com/vi/l3wIHurjERk/maxresdefault.jpg');
  assert.equal(talk.recordedIn.uploadDate, '2026-04-07');
  assert.equal(talk.subjectOf.url, 'https://www.jackzhaojin.com/writing/2026-04-05-continuous-executive-agent-v2-1/');
  assert.equal(talk.about['@id'], 'https://www.jackzhaojin.com/portfolio/continuous-executive-agent/#project');
  const project = pageGraph({
    canonical: 'https://www.jackzhaojin.com/portfolio/anima-mesh/',
    title: 'Anima Mesh | Jack Jin',
    meta: metaOf({ 'project-order': '1' }),
    links: ['https://github.com/jackzhaojin/anima-mesh/tree/main/docs', 'https://github.com/jackzhaojin/anima-mesh'],
  })['@graph'][4];
  assert.equal(project['@type'], 'SoftwareSourceCode');
  assert.equal(project.codeRepository, 'https://github.com/jackzhaojin/anima-mesh');
});
