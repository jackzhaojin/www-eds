import assert from 'node:assert/strict';
import test from 'node:test';
import { eventParts, talkSchemaItems } from '../scripts/talks-list.js';
import { collectionGraph } from '../scripts/collection-schema.js';

const HUB = 'https://www.jackzhaojin.com/talks/';
const talk = (values) => ({
  id: 'adaptto-2026', title: 'A talk', date: 'September 29, 2026', kind: '', event: 'adaptTo() 2026 · Berlin', description: '', links: [], ...values,
});

/** Every node of a graph whose type is Event, nested ones included. */
const events = (node) => {
  if (Array.isArray(node)) return node.flatMap(events);
  if (!node || typeof node !== 'object') return [];
  const own = [].concat(node['@type'] || []).includes('Event') ? [node] : [];
  return [...own, ...Object.values(node).flatMap(events)];
};

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
  assert.deepEqual(item.location, { '@type': 'Place', name: 'Columbus, Ohio' });
  assert.equal(item.subjectOf.url, 'https://www.jackzhaojin.com/writing/2026-04-05-continuous-executive-agent-v2-1/');
  assert.equal(item.about['@id'], 'https://www.jackzhaojin.com/portfolio/continuous-executive-agent/#project');
});

test('the event a talk was part of is no nested Event (Search Console flagged a name-only superEvent, #9)', () => {
  const [item] = talkSchemaItems([talk({ event: 'adaptTo() 2026 · Berlin · with Katie Phillips' })], HUB);
  assert.equal('superEvent' in item, false);
  assert.deepEqual(events(item), [item]);
});

test('partial dates stay partial, optional parts are left out', () => {
  const [item] = talkSchemaItems([talk({ date: 'September 2026' })], HUB);
  assert.equal(item.startDate, '2026-09');
  ['description', 'additionalType', 'superEvent', 'subjectOf', 'about'].forEach((key) => assert.equal(key in item, false));
});

test('a row without an id, a title, a date or a place is left out of the JSON-LD', () => {
  const items = talkSchemaItems([
    talk({ id: '' }),
    talk({ title: '' }),
    talk({ date: '' }),
    talk({ date: 'Spring 2026' }),
    talk({ event: '' }),
    talk({ event: 'Somewhere · with Someone' }),
    talk({ id: 'kept' }),
  ], HUB);
  assert.deepEqual(items.map((item) => item['@id']), [`${HUB}#kept`]);
});

test('in the hub graph every Event has the fields Google requires, keeps its performer and gets no author', () => {
  const graph = collectionGraph({
    canonical: HUB,
    title: 'Talks & Presentations | Jack Jin',
    items: talkSchemaItems([
      talk({}),
      talk({ id: 'lightning', date: 'September 2026', event: 'adaptTo() 2026 · Berlin' }),
      talk({ id: 'tinkerers', date: 'August 3, 2026', event: 'AI Tinkerers Columbus · Columbus, Ohio' }),
    ], HUB),
  });
  const found = events(graph);
  assert.equal(found.length, 3);
  found.forEach((event) => {
    assert.ok(event.name, 'name');
    assert.match(event.startDate, /^\d{4}-\d{2}(-\d{2})?$/);
    assert.equal(event.location['@type'], 'Place');
    assert.ok(event.location.name, 'location.name');
    assert.equal(event.performer['@id'], 'https://www.jackzhaojin.com/#person');
    assert.equal('author' in event, false);
  });
});
