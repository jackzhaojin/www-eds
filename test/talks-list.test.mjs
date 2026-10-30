import assert from 'node:assert/strict';
import test from 'node:test';
import { eventParts, talkSchemaItems } from '../scripts/talks-list.js';
import { collectionGraph } from '../scripts/collection-schema.js';

const HUB = 'https://www.jackzhaojin.com/talks/';
const talk = (values) => ({
  id: 'adaptto-2026', title: 'A talk', date: '', kind: '', event: '', description: '', links: [], ...values,
});

test('the event line gives the event and the place, never a co-speaker', () => {
  assert.deepEqual(eventParts('adaptTo() 2026 · Berlin · with Katie Phillips'), { event: 'adaptTo() 2026', place: 'Berlin' });
  assert.deepEqual(eventParts('AI Tinkerers Columbus · Columbus, Ohio'), { event: 'AI Tinkerers Columbus', place: 'Columbus, Ohio' });
  assert.deepEqual(eventParts('Somewhere · with Someone'), { event: 'Somewhere', place: '' });
  assert.deepEqual(eventParts(''), { event: '', place: '' });
});

test('a talk row is an Event on the hub, its write-up and project linked', () => {
  const [item] = talkSchemaItems([talk({
    date: 'April 6, 2026',
    kind: 'Community demo',
    event: 'AI Tinkerers Columbus · Columbus, Ohio',
    description: 'A demo.',
    links: [
      { label: 'Read the write-up', href: '/writing/2026-04-05-continuous-executive-agent-v2-1/' },
      { label: 'Watch the live talk', href: 'https://youtu.be/l3wIHurjERk' },
      { label: 'Explore the project', href: '/portfolio/continuous-executive-agent/' },
    ],
  })], HUB);
  assert.equal(item['@type'], 'Event');
  assert.equal(item['@id'], `${HUB}#adaptto-2026`);
  assert.equal(item.url, `${HUB}#adaptto-2026`);
  assert.equal(item.startDate, '2026-04-06');
  assert.equal(item.additionalType, 'Community demo');
  assert.deepEqual(item.superEvent, { '@type': 'Event', name: 'AI Tinkerers Columbus' });
  assert.deepEqual(item.location, { '@type': 'Place', name: 'Columbus, Ohio' });
  assert.equal(item.subjectOf.url, 'https://www.jackzhaojin.com/writing/2026-04-05-continuous-executive-agent-v2-1/');
  assert.equal(item.about['@id'], 'https://www.jackzhaojin.com/portfolio/continuous-executive-agent/#project');
});

test('partial dates stay partial, missing parts are left out, rows without an id or title are skipped', () => {
  const items = talkSchemaItems([talk({ date: 'September 2026' }), talk({ id: '' }), talk({ title: '' })], HUB);
  assert.equal(items.length, 1);
  assert.equal(items[0].startDate, '2026-09');
  ['description', 'additionalType', 'superEvent', 'location', 'subjectOf', 'about'].forEach((key) => assert.equal(key in items[0], false));
});

test('in the hub graph an Event keeps its performer and gets no author', () => {
  const graph = collectionGraph({
    canonical: HUB, title: 'Talks & Presentations | Jack Jin', items: talkSchemaItems([talk({})], HUB),
  })['@graph'];
  const { item } = graph[4].itemListElement[0];
  assert.equal(item.performer['@id'], 'https://www.jackzhaojin.com/#person');
  assert.equal('author' in item, false);
});
