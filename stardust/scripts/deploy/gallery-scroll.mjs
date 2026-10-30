#!/usr/bin/env node
/**
 * Scrolls a gallery (blocks/row-list: projects on /portfolio/, talks on /talks/) top to bottom
 * with the mouse wheel at a few steady speeds, the way a reader does, and reports for each card
 * whether its reveal (the numeral setting back and the scene's plate easing in) ran while the
 * card was on screen. One line per width and speed, then the cards that missed it.
 *
 *   node stardust/scripts/deploy/gallery-scroll.mjs https://www.jackzhaojin.com/portfolio/   (or /talks/)
 *     [--widths 1440,360] [--speeds 120,500,3000]
 *
 * --speeds: pixels per second (120 is a slow read, 3000 a flick). The pointer rests in the page's
 * left margin, so no card is hovered. Exits 1 when any card misses its reveal.
 */
/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop,
   import/no-extraneous-dependencies -- a dev script: it reports to the console, scrolls one run at
   a time, and uses the playwright devDependency */
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:/.test(a));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
if (!url) {
  console.error('gallery-scroll: give the hub URL');
  process.exit(1);
}
const widths = opt('widths', '1440,360').split(',').map(Number);
const speeds = opt('speeds', '120,500,3000').split(',').map(Number);
const STEP_MS = 16;

/* in the page: each card's reveal, and whether its media was on screen when it ran */
function record() {
  window.revealLog = [];
  document.addEventListener('transitionrun', (event) => {
    const el = event.target;
    if (!el.classList?.contains('row-list-num') || event.propertyName !== 'transform') return;
    const card = el.closest('.row-list-items > li');
    const media = card.querySelector('.row-list-media').getBoundingClientRect();
    const shown = Math.min(media.bottom, window.innerHeight) - Math.max(media.top, 0);
    window.revealLog.push({
      i: [...card.parentElement.children].indexOf(card),
      shown: Math.max(0, shown) / media.height,
    });
  }, true);
}

const browser = await chromium.launch();
let missed = 0;
for (const width of widths) {
  for (const speed of speeds) {
    const page = await browser.newPage({
      viewport: { width, height: width < 768 ? 760 : 900 },
      isMobile: false,
      hasTouch: false,
    });
    await page.addInitScript(record);
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.row-list:is(.projects, .talks) .row-list-items > li .row-list-num');
    await page.mouse.move(2, 300);
    // each wheel step covers the time since the last, so the speed holds however long a step takes
    const start = Date.now();
    let tick = start;
    let last = -1;
    let still = start;
    for (;;) {
      await page.waitForTimeout(STEP_MS);
      const now = Date.now();
      await page.mouse.wheel(0, Math.max(1, Math.round((speed * (now - tick)) / 1000)));
      tick = now;
      const { y, end } = await page.evaluate(() => {
        const list = document.querySelector('.row-list:is(.projects, .talks) .row-list-items');
        const past = list.getBoundingClientRect().bottom < window.innerHeight * 0.5;
        return { y: window.scrollY, end: past };
      });
      if (y !== last) still = now;
      if (end || now - still > 1500) break;
      last = y;
    }
    await page.waitForTimeout(1500);
    const result = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.row-list:is(.projects, .talks) .row-list-items > li')];
      return cards.map((card, i) => {
        const runs = window.revealLog.filter((r) => r.i === i);
        return {
          title: card.querySelector('.row-list-title')?.textContent.trim(),
          scene: card.classList.contains('has-scene'),
          seen: runs.some((r) => r.shown >= 0.25),
          offscreen: runs.length > 0 && runs.every((r) => r.shown < 0.25),
        };
      });
    });
    const seen = result.filter((r) => r.scene && r.seen);
    const miss = result.filter((r) => r.scene && !r.seen);
    missed += miss.length;
    const secs = ((Date.now() - start) / 1000).toFixed(0);
    console.log(`${width}px at ${speed}px/s (${secs}s): ${seen.length} of ${result.filter((r) => r.scene).length} scenes revealed on screen${miss.length ? `, missed: ${miss.map((r) => `${r.title}${r.offscreen ? ' (ran off screen)' : ' (no motion)'}`).join(', ')}` : ''}`);
    await page.close();
  }
}
await browser.close();
process.exit(missed ? 1 : 0);
