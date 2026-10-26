/* eslint-env node */
/* eslint-disable no-await-in-loop, no-restricted-syntax */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:3005';
const out = 'ai-docs/2026-10-26-talks-json/validation';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 }, colorScheme: 'light', reducedMotion: 'reduce',
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const draft = `${base}/drafts/talks-index/`;
const schema = () => page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts
  .flatMap((script) => { const parsed = JSON.parse(script.textContent); return parsed['@graph'] || [parsed]; })
  .filter((node) => node['@type'] === 'ItemList'));
try {
  const feed = await page.request.get(`${base}/talks-index.json?limit=1`);
  assert.equal(feed.status(), 200);
  const data = await feed.json();
  assert(data.total > 0);
  const raw = await page.request.get(`${draft}index.plain.html`);
  assert(!(await raw.text()).includes(data.data[0].title), 'The draft must not contain static talk rows');
  await page.goto(draft);
  await page.waitForSelector('.row-list[data-talks-state="ready"]');
  assert.equal(await page.locator('.row-list-items > li').count(), data.total);
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
  const lists = await schema();
  assert.equal(lists.length, 1);
  assert.equal(lists[0].numberOfItems, data.total);
  const overflow = [];
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForSelector('footer nav');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `draft-${width}.png`), fullPage: true });
    const baseline = await browser.newPage({ viewport: { width, height: 900 } });
    await baseline.goto(`${base}/talks/`);
    await baseline.waitForSelector('footer nav');
    await baseline.evaluate(() => document.fonts.ready);
    const measure = () => Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const original = await baseline.evaluate(measure);
    const draftOverflow = await page.evaluate(measure);
    assert(draftOverflow <= original, 'The draft must not add overflow to the existing page');
    assert(await page.locator('.row-list-items').evaluate((list) => [...list.querySelectorAll('*')]
      .every((el) => el.getBoundingClientRect().right <= window.innerWidth + 1)));
    overflow.push({
      width, productionBaseline: original, draft: draftOverflow, listing: 0,
    });
    await baseline.close();
  }
  await page.goto(`${draft}#columbus-ai-2026`);
  await page.waitForSelector('.row-list[data-talks-state="ready"]');
  await page.waitForFunction(() => {
    const target = document.getElementById('columbus-ai-2026');
    return target && target.getBoundingClientRect().top >= -1
      && target.getBoundingClientRect().top < 150;
  });
  const anchor = await page.locator('#columbus-ai-2026').boundingBox();
  assert(anchor && anchor.y >= -1 && anchor.y < 150, 'Legacy anchor should scroll after the API loads');
  const changed = structuredClone(data);
  changed.total = 1;
  changed.limit = 1;
  changed.data[0].title = '<img src=x onerror=alert(1)> API change';
  await page.route('**/talks-index.json*', (route) => route.fulfill({ json: changed }));
  await page.goto(draft);
  await page.waitForSelector('.row-list[data-talks-state="ready"]');
  assert.equal(await page.locator('.row-list-title h2').first().textContent(), changed.data[0].title);
  assert.equal(await page.locator('.row-list-title img').count(), 0);
  assert.equal((await schema())[0].itemListElement[0].item.name, changed.data[0].title);

  await page.unroute('**/talks-index.json*');
  await page.route('**/talks-index.json*', (route) => route.fulfill({
    json: {
      total: 0, offset: 0, limit: 0, data: [],
    },
  }));
  await page.goto(draft);
  await page.waitForSelector('.row-list[data-talks-state="ready"]');
  assert.equal(await page.locator('.row-list-items > li').count(), 0);
  assert.equal((await schema())[0].numberOfItems, 0);
  assert(await page.getByText('No talks are published yet.').isVisible());

  await page.unroute('**/talks-index.json*');
  await page.route('**/talks-index.json*', (route) => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto(draft);
  await page.waitForSelector('.row-list[data-talks-state="error"]');
  assert(await page.getByRole('alert').isVisible());
  assert.equal(await page.locator('.row-list-items > li').count(), 0);
  assert.deepEqual(errors, []);
  const summary = {
    base,
    records: data.total,
    overflow,
    widths: [1440, 360],
    schema: 'one matching ItemList',
    legacyAnchor: 'pass',
    changedAPI: 'pass',
    textEscaping: 'pass',
    emptyState: 'pass',
    unavailableState: 'pass',
    pageErrors: errors,
  };
  fs.writeFileSync(path.join(out, 'browser.json'), `${JSON.stringify(summary, null, 2)}\n`);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(summary));
} finally {
  await browser.close();
}
