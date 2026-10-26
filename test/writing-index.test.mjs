import assert from 'node:assert/strict';
import test from 'node:test';
import { loadWritingIndex, readWriting } from '../scripts/writing-index.js';

const article = (slug, date = '2026-10-02') => ({
  path: `/writing/${slug}/`, title: slug, date, template: 'article',
});
const response = (result) => ({ ok: true, json: async () => result });

test('loads every page, excludes talks/hubs/noindex, and orders by publication date', async () => {
  const rows = [article('2026-09-20-newer'), article('2025-06-04-older', '2025-06-04'),
    { path: '/talks/records/example', title: 'Talk' }, { path: '/writing/' },
    { ...article('2026-10-03-private'), robots: 'noindex, follow' }];
  const offsets = [];
  const records = await loadWritingIndex('https://example.com/writing-index.json', async (url) => {
    const offset = Number(new URL(url).searchParams.get('offset'));
    offsets.push(offset);
    return response({ total: rows.length, offset, data: rows.slice(offset, offset + 2) });
  });
  assert.deepEqual(offsets, [0, 2, 4]);
  assert.deepEqual(records.map((row) => row.title), ['2026-09-20-newer', '2025-06-04-older']);
  assert.equal(records[0].dateLabel, 'October 2, 2026');
});

test('uses authored card fields and preserves safe optional fallbacks', () => {
  const full = readWriting({
    ...article('example'),
    summary: 'Card summary',
    description: 'SEO summary',
    topics: 'Adobe AEM & EDS|AI Engineering',
    readTime: '8 min read',
    videoTime: '12:31 video',
    talkUrl: '/talks/#example',
    image: '/writing/media_cover.jpg',
    keywords: 'edge functions',
  });
  assert.equal(full.summary, 'Card summary');
  assert.deepEqual(full.topics, ['Adobe AEM & EDS', 'AI Engineering']);
  assert.deepEqual(full.facts, ['8 min read', '12:31 video']);
  assert.equal(full.talkUrl, 'https://www.jackzhaojin.com/talks/#example');
  const minimal = readWriting({ ...article('minimal'), date: '', description: 'Fallback' });
  assert.equal(minimal.summary, 'Fallback');
  assert.equal(minimal.dateLabel, '');
  assert.equal(minimal.image, '');
  assert.deepEqual(minimal.facts, []);
});

test('rejects unsafe media/links and duplicate old article anchors', async () => {
  // eslint-disable-next-line no-script-url -- intentionally hostile API input
  assert.throws(() => readWriting({ ...article('example'), image: 'javascript:alert(1)' }), /protocol/);
  assert.throws(() => readWriting({ ...article('example'), path: 'https://evil.example/writing/example/' }), /identity/);
  await assert.rejects(loadWritingIndex('https://example.com/writing-index.json', async () => response({
    total: 2, offset: 0, data: [article('2026-10-01-same'), article('2026-10-02-same')],
  })), /Duplicate writing anchor/);
});

test('distinguishes empty data, malformed dates and network failures', async () => {
  assert.deepEqual(await loadWritingIndex('https://example.com/writing-index.json', async () => response({ total: 0, offset: 0, data: [] })), []);
  assert.throws(() => readWriting(article('example', 'tomorrow')), /date/);
  assert.throws(() => readWriting(article('example', '2026-02-30')), /date/);
  await assert.rejects(loadWritingIndex('https://example.com/writing-index.json', async () => ({ ok: false, status: 503 })), /503/);
});
