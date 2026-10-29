#!/usr/bin/env node
/**
 * Screenshots and checks a page's scene (blocks/scene) the way a reader meets it: at 1440 and 360
 * wide, in the light and dark themes, two moments apart, and under reduced motion. Prints one
 * line per capture (the scene's box, its frame rate, long tasks, console errors, horizontal
 * overflow) and writes the images to .playwright-cli/scene-<name>-*.png: the scene alone, and the
 * page's first screen at each width.
 *
 *   node stardust/scripts/deploy/scene-shots.mjs http://localhost:3001/portfolio/<slug>/
 *     [--name clock-tower]
 *   [--widths 1440,360] [--themes light,dark] [--at 1.5,7] [--full]
 *
 * --at: the seconds after the scene shows to capture (default 1.5 and 7). --full adds full-page
 * shots. Run from the www-eds root; the page is usually served by the aem-up-local launch
 * config (stardust/scripts/deploy/local-preview.mjs).
 */
/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop,
   import/no-extraneous-dependencies -- a dev script: it reports to the console, captures one view
   at a time, and uses the playwright devDependency */
import fs from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:/.test(a));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
if (!url) {
  console.error('scene-shots: give the page URL');
  process.exit(1);
}
const name = opt('name', new URL(url).pathname.split('/').filter(Boolean).pop() || 'page');
const widths = opt('widths', '1440,360').split(',').map(Number);
const themes = opt('themes', 'light,dark').split(',');
const moments = opt('at', '1.5,7').split(',').map(Number);
const OUT = '.playwright-cli';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let problems = 0;

async function view(width, theme, reduced) {
  const height = width >= 1000 ? 900 : 800;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    colorScheme: theme,
  });
  await context.addInitScript((t) => {
    try { localStorage.setItem('jj-theme', t); } catch { /* storage off */ }
  }, theme);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  const scene = page.locator('.scene.block').first();
  if (!(await scene.count())) {
    console.log(`  FAIL ${width} ${theme}: no scene on the page`);
    problems += 1;
    await context.close();
    return;
  }
  await page.waitForFunction(() => document.querySelector('.scene.block')?.matches('.is-ready, .is-fallback'), null, { timeout: 15000 }).catch(() => {});
  await scene.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, Math.max(0, window.scrollY - 40)));
  const start = Date.now();
  const tag = `${width}-${theme}${reduced ? '-still' : ''}`;
  for (const at of (reduced ? [moments[0]] : moments)) {
    const wait = at * 1000 - (Date.now() - start);
    if (wait > 0) await page.waitForTimeout(wait);
    await scene.screenshot({ path: `${OUT}/scene-${name}-${tag}-${at}s.png` });
  }
  const stats = await page.evaluate(() => new Promise((resolve) => {
    const block = document.querySelector('.scene.block');
    const box = block.querySelector('.scene-stage').getBoundingClientRect();
    const deltas = [];
    let long = 0;
    let last = 0;
    let obs;
    try {
      obs = new PerformanceObserver((l) => { long += l.getEntries().length; });
      obs.observe({ type: 'longtask', buffered: false });
    } catch { /* no longtask support */ }
    const step = (now) => {
      if (last) deltas.push(now - last);
      last = now;
      if (deltas.length < 90) requestAnimationFrame(step);
      else {
        obs?.disconnect();
        deltas.sort((a, b) => a - b);
        resolve({
          w: Math.round(box.width),
          h: Math.round(box.height),
          state: [...block.classList].filter((c) => c.startsWith('is-')).join(' '),
          p95: Math.round(deltas[Math.floor(deltas.length * 0.95)]),
          long,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          placed: block.querySelectorAll('.scene-label.is-placed').length,
          unplaced: block.querySelectorAll('.scene-caption .scene-label').length,
        });
      }
    };
    requestAnimationFrame(step);
  }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT}/scene-${name}-${tag}-screen.png` });
  if (args.includes('--full')) await page.screenshot({ path: `${OUT}/scene-${name}-${tag}-page.png`, fullPage: true });
  const bad = errors.length || stats.overflow > 4 || !/is-ready/.test(stats.state);
  if (bad) problems += 1;
  console.log(`  ${bad ? 'FAIL' : 'ok  '} ${tag}: stage ${stats.w}x${stats.h}, ${stats.state}, labels ${stats.placed} placed ${stats.unplaced} in caption, frame p95 ${stats.p95}ms, long tasks ${stats.long}, overflow ${stats.overflow}px${errors.length ? `, errors: ${errors.slice(0, 3).join(' | ')}` : ''}`);
  await context.close();
}

for (const width of widths) {
  for (const theme of themes) await view(width, theme, false);
}
await view(widths[widths.length - 1], themes[0], true);
await browser.close();
console.log(`scene-shots: images in ${OUT}/scene-${name}-*.png`);
process.exit(problems ? 1 : 0);
