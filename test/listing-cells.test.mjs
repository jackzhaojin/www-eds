import assert from 'node:assert/strict';
import test from 'node:test';
import {
  el, headingId, rowsToHTML, sitePath,
} from '../scripts/listing-cells.js';
import { collectionGraph } from '../scripts/collection-schema.js';
import { talkRows } from '../scripts/talks-index.js';
import { writingRows, readWriting } from '../scripts/writing-index.js';

test('heading ids match the ids delivery gives authored headings', () => {
  assert.equal(headingId('Talks & presentations'), 'talks--presentations');
  assert.equal(headingId('OpenClaw: 24/7 development agent'), 'openclaw-247-development-agent');
  assert.equal(headingId("Company of Zero: How AnimaMesh Runs a Company's Back Office"), 'company-of-zero-how-animamesh-runs-a-companys-back-office');
});

test('served rows escape every value and keep site links on the host', () => {
  const html = rowsToHTML([[[el('p', {}, '<b>&'), el('a', { href: sitePath('https://www.jackzhaojin.com/x/?a=1#b') }, '"q"')]]]);
  assert.equal(html, '<div><div><p>&lt;b&gt;&amp;</p><a href="/x/?a=1#b">&quot;q&quot;</a></div></div>');
  assert.equal(sitePath('https://youtu.be/abc'), 'https://youtu.be/abc');
  const cover = rowsToHTML([[[el('img', { src: '/writing/media_1.jpg?width=750', alt: '' })]]]);
  assert.match(cover, /<img loading="lazy" alt="" src="\/writing\/media_1\.jpg\?width=750&amp;format=jpg&amp;optimize=medium"><\/picture>/);
});

test('talk rows are the three authored cells, with older anchors', () => {
  const [row] = talkRows([{
    id: 'a',
    aliases: ['old-a'],
    title: 'A talk',
    date: 'September 2026',
    kind: '',
    event: 'Event',
    description: 'One.\n\nTwo.',
    links: [{ label: 'Source', url: 'https://example.com/' }],
    status: 'Write-up in progress',
  }]);
  assert.deepEqual(row.map((cell) => cell.map((node) => node.tag)), [['p'], ['h2', 'p', 'p', 'p', 'p', 'p'], ['p']]);
  assert.deepEqual(row[2][0].children, ['a old-a']);
});

test('writing rows drop empty cells and fall back to the title for the heading id', () => {
  const article = readWriting({
    path: '/writing/2026-10-02-x/', title: 'X & Y', date: '2026-10-02', topics: 'AI Engineering',
  });
  const [row] = writingRows([article]);
  assert.equal(row.length, 2, 'no cover and no keywords cell');
  assert.equal(row[1][0].attrs.id, 'x--y');
});

test('the listing graph is generated whole: one CollectionPage, its breadcrumb and ItemList', () => {
  const graph = collectionGraph({
    canonical: 'https://www.jackzhaojin.com/writing/', title: 'Technical Writing | Jack Jin', description: 'D', items: [{ '@type': 'BlogPosting', url: 'u' }],
  })['@graph'];
  assert.deepEqual(graph.map((node) => node['@type']), ['Person', 'WebSite', 'CollectionPage', 'BreadcrumbList', 'ItemList']);
  assert.equal(graph[2].mainEntity['@id'], 'https://www.jackzhaojin.com/writing/#collection');
  assert.equal(graph[3].itemListElement[1].name, 'Technical Writing');
  assert.deepEqual(graph[4].itemListElement[0], {
    '@type': 'ListItem', position: 1, item: { author: { '@id': 'https://www.jackzhaojin.com/#person' }, '@type': 'BlogPosting', url: 'u' },
  });
});
