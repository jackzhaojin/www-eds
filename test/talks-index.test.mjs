import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTalksIndex, readTalk } from '../scripts/talks-index.js';

const talk = (id, order) => ({ id, title: `Talk ${id}`, order: String(order) });
const response = (result) => ({ ok: true, json: async () => result });

test('loads all native index pages and sorts by editorial order', async () => {
  const offsets = [];
  const fetchData = async (url) => {
    const offset = Number(new URL(url).searchParams.get('offset'));
    offsets.push(offset);
    return response({ total: 2, offset, data: [talk(offset ? 'earlier' : 'later', offset ? 1 : 2)] });
  };
  const records = await loadTalksIndex('https://example.com/talks-index.json', fetchData);
  assert.deepEqual(offsets, [0, 1]);
  assert.deepEqual(records.map((r) => r.id), ['earlier', 'later']);
});

test('preserves partial dates and safely accepts omitted optional fields', () => {
  const record = readTalk({ ...talk('example', 1), date: 'September 2026', aliases: 'older-id' });
  assert.equal(record.date, 'September 2026');
  assert.deepEqual(record.aliases, ['older-id']);
  assert.deepEqual(record.links, []);
  assert.equal(record.description, '');
  assert.equal(record.status, '');
});

test('rejects unsafe or mismatched links and ambiguous identities', async () => {
  // eslint-disable-next-line no-script-url -- intentionally hostile API input
  assert.throws(() => readTalk({ ...talk('example', 1), linkLabels: ['Watch'], linkUrls: ['javascript:alert(1)'] }), /invalid link/);
  assert.throws(() => readTalk({ ...talk('example', 1), linkLabels: ['Watch'] }), /incomplete links/);
  await assert.rejects(loadTalksIndex('https://example.com/talks-index.json', async () => response({
    total: 2, offset: 0, data: [talk('same', 1), talk('same', 2)],
  })), /Duplicate talk anchor/);
});

test('distinguishes an empty collection from HTTP and pagination failures', async () => {
  assert.deepEqual(await loadTalksIndex('https://example.com/talks-index.json', async () => response({ total: 0, offset: 0, data: [] })), []);
  await assert.rejects(loadTalksIndex('https://example.com/talks-index.json', async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(loadTalksIndex('https://example.com/talks-index.json', async () => response({ total: 1, offset: 0, data: [] })), /no progress/);
});
