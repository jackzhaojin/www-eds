/* eslint-env node */
/* eslint-disable no-await-in-loop, no-restricted-syntax, max-len */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const base = process.argv[2] || 'https://codex-list-seo-research--www-eds--jackzhaojin.aem.page';
const out = 'ai-docs/2026-10-26-writing-index/validation';
fs.mkdirSync(out, { recursive: true });
const expected = JSON.parse(fs.readFileSync('ai-docs/2026-10-26-writing-index/admin/execution-files/expected-cards.json', 'utf8'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
const errors = [];
const consoleErrors = [];
let expectedFailure = false;
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error' && !expectedFailure) consoleErrors.push(message.text()); });
const draft = `${base}/drafts/writing-index/`;
const ready = async () => {
  await page.waitForSelector('.writing-index[data-writing-state="ready"]');
  await page.getByText(`All ${expected.length} pieces`, { exact: true }).waitFor();
};
const schema = () => page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts
  .flatMap((script) => { const data = JSON.parse(script.textContent); return data['@graph'] || [data]; })
  .filter((node) => node['@type'] === 'ItemList'));

try {
  const response = await page.request.get(`${base}/writing-index.json?limit=200`);
  assert.equal(response.status(), 200);
  const feed = await response.json();
  assert.equal(feed.total, expected.length);
  assert(!feed.data.some((record) => record.path.startsWith('/talks/')));
  const raw = await page.request.get(`${draft}index.plain.html`);
  assert(!(await raw.text()).includes(expected[0].title), 'Draft must not contain static article rows');
  await page.goto(draft);
  await ready();
  const actual = await page.locator('.writing-list-row').evaluateAll((rows) => rows.map((row) => ({
    title: row.querySelector('h2').textContent.trim(),
    path: row.querySelector('h2 a').getAttribute('href'),
    summary: row.querySelector('.writing-list-summary')?.textContent.trim() || '',
    dateLabel: row.querySelector('time')?.textContent.trim() || '',
    topics: [...row.querySelectorAll('.writing-list-tags li')].map((li) => li.textContent.trim()),
    facts: [...row.querySelectorAll('.writing-list-facts li')].map((li) => li.textContent.trim()),
    imagePath: new URL(row.querySelector('img').src).pathname,
  })));
  assert.deepEqual(actual, expected.map((record) => ({
    title: record.title,
    path: record.path,
    summary: record.summary,
    dateLabel: record.dateLabel,
    topics: record.topics,
    facts: record.facts,
    imagePath: new URL(record.image).pathname,
  })));
  assert.equal((await schema()).length, 1);
  assert.equal((await schema())[0].numberOfItems, expected.length);
  const overflow = [];
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForSelector('footer nav');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${out}/draft-${width}.png`, fullPage: true });
    const baseline = await browser.newPage({ viewport: { width, height: 900 } });
    await baseline.goto(`${base}/writing/`);
    await baseline.waitForSelector('.writing-list-items > li');
    await baseline.waitForSelector('footer nav');
    const original = await baseline.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    const current = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
    assert(current <= original, 'Writing draft must not add document overflow');
    overflow.push({ width, original, draft: current });
    await baseline.close();
  }

  await page.locator('button[data-filter="topic"][data-value="aem"]').click();
  await page.locator('button[data-filter="year"][data-value="2025"]').click();
  const filtered = expected.filter((record) => record.topics.includes('Adobe AEM & EDS') && record.date.startsWith('2025'));
  assert.equal(await page.locator('.writing-list-items > li:not([hidden])').count(), filtered.length);
  assert(page.url().includes('topic=aem') && page.url().includes('year=2025'));
  const search = page.getByRole('searchbox', { name: 'Search articles' });
  await search.fill('no-result-for-this-check');
  await page.getByText(`0 of ${expected.length} pieces`, { exact: true }).waitFor();
  await page.locator('[data-reset]').click();
  await ready();
  assert.equal(await search.inputValue(), '');
  await page.locator('h1').click();
  await page.keyboard.press('/');
  assert(await search.evaluate((input) => input === document.activeElement));
  await page.goto(`${draft}#year=2025`);
  await page.waitForSelector('.writing-index[data-writing-state="ready"]');
  await page.waitForFunction(() => document.querySelector('button[data-filter="year"][data-value="2025"]')?.getAttribute('aria-pressed') === 'true');
  assert.equal(await page.locator('.writing-list-items > li:not([hidden])').count(), expected.filter((record) => record.date.startsWith('2025')).length);

  const changed = structuredClone(feed);
  changed.data.find((record) => record.path === expected[0].path).title = '<img src=x onerror=alert(1)> API writing change';
  await page.route('**/writing-index.json*', (route) => route.fulfill({ json: changed }));
  await page.goto(draft);
  await ready();
  assert.equal(await page.locator('.writing-list-title h2').first().textContent(), '<img src=x onerror=alert(1)> API writing change');
  assert.equal(await page.locator('.writing-list-title img').count(), 0);
  assert.equal((await schema())[0].itemListElement[0].item.headline, '<img src=x onerror=alert(1)> API writing change');

  await page.unroute('**/writing-index.json*');
  await page.route('**/writing-index.json*', (route) => route.fulfill({
    json: {
      total: 0, offset: 0, limit: 0, data: [],
    },
  }));
  await page.goto(draft);
  await page.waitForSelector('[data-writing-state="empty"]');
  assert(await page.getByText('No writing is published yet.').isVisible());
  assert(await search.isDisabled());
  assert.equal((await schema())[0].numberOfItems, 0);

  await page.unroute('**/writing-index.json*');
  expectedFailure = true;
  await page.route('**/writing-index.json*', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(draft);
  await page.waitForSelector('[data-writing-state="error"]');
  assert(await page.getByRole('alert').isVisible());
  assert(await search.isDisabled());
  assert.equal(await page.locator('.writing-list-items > li').count(), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(consoleErrors, []);
  const summary = {
    base,
    articles: expected.length,
    cardFidelity: 'all fields match',
    filters: 'pass',
    hashState: 'pass',
    reset: 'pass',
    keyboardShortcut: 'pass',
    dynamicSchema: 'pass',
    textEscaping: 'pass',
    emptyState: 'pass',
    errorState: 'pass',
    overflow,
    pageErrors: errors,
    consoleErrors,
  };
  fs.writeFileSync(`${out}/browser.json`, `${JSON.stringify(summary, null, 2)}\n`);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary));
} finally {
  await browser.close();
}
