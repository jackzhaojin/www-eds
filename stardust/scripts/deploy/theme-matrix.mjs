#!/usr/bin/env node
/**
 * Renders pages in every theme the site has, brand by appearance, and checks each render (since
 * v1.4.0). Brands: jack (the default) and adobe. Appearances: light (the visitor chose Light, the
 * OS is dark), dark (the visitor chose Dark, the OS is light) and system (no choice, the OS is
 * dark), so each one also proves the choice beats the OS. Per render: console errors, horizontal
 * overflow, the brand the page actually took, with --contrast the text below WCAG AA, and on an
 * adobe render the leaks: any element whose computed colors (text, ground, border, outline, SVG
 * fill and stroke, gradients) are one of Jack's own (lavender, warm paper, warm night), or whose
 * face is Playfair, which means a block reads a primitive instead of a semantic token. With
 * --against, the same render from a second server (other code, the same content) and a pixel
 * diff: the regression check for a token or block change.
 *
 *   node stardust/scripts/deploy/theme-matrix.mjs --base http://localhost:3001 \
 *     --paths-file <pages.txt> [--paths /,/writing/] [--against http://localhost:3002] \
 *     [--brands jack,adobe] [--modes light,dark,system] [--widths 1440,360] [--contrast] \
 *     [--jobs 4] [--keep] [--out .playwright-cli/theme-matrix]
 *
 * The brand is applied the way an author applies it, through the page's theme metadata: the
 * served HTML's <meta name="theme"> gets "adobe" added (or taken out for jack), so nothing in
 * content/ or DA changes. Captures are stitched viewport by viewport (never fullPage, whose
 * beyond-viewport render misses lazy images), under reduced motion, the sticky header shown
 * in the first viewport only (transparent after it, so the layout doesn't move), so two servers
 * render the same frames. Diff and capture PNGs are written only for renders that differ, unless
 * --keep. Exit 1 when anything fails.
 */
/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax, no-continue,
   import/no-extraneous-dependencies -- a dev script: it reports to the console, captures one
   viewport at a time and runs on the devDependencies */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);
const list = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

const BASE = opt('base');
const AGAINST = opt('against');
const OUT = opt('out', '.playwright-cli/theme-matrix');
const BRANDS = list(opt('brands', 'jack,adobe'));
const MODES = list(opt('modes', 'light,dark,system'));
const WIDTHS = list(opt('widths', '1440,360')).map(Number);
const JOBS = Number(opt('jobs', '4'));
const CONTRAST = flag('contrast');
const KEEP = flag('keep');
// Jack's brand-only colors (v3 primitives): an adobe render that shows one has a leak
const JACK_ONLY = ['#4a3ba8', '#5b4bc4', '#c0b3ff', '#d6cdff', '#f6f4f0', '#f1eee9', '#efece6', '#e6e2db',
  '#1a1917', '#4a4744', '#6f6b66', '#e8e5e3', '#b2afac', '#94908c', '#131313', '#1a1a19', '#201f1f',
  '#0e0e0e'];
const VH = 900;
let pages = opt('paths') ? list(opt('paths')) : [];
if (opt('paths-file')) pages = pages.concat(list(fs.readFileSync(opt('paths-file'), 'utf8').replace(/\n/g, ',')));
if (!BASE || !pages.length) {
  console.error('theme-matrix: --base <url> and --paths or --paths-file are required');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

/** The page's theme metadata with the brand word added or taken out. */
function brandHtml(html, brand) {
  const re = /<meta name="theme" content="([^"]*)"\s*\/?>/i;
  const words = (html.match(re)?.[1] || '').split(',').map((w) => w.trim()).filter((w) => w && w !== 'adobe');
  if (brand === 'adobe') words.push('adobe');
  const tag = words.length ? `<meta name="theme" content="${words.join(', ')}">` : '';
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `${tag}\n</head>`);
}

/** Waits until the page has decorated: body shown, every section and block loaded, fonts in. */
async function settle(page) {
  await page.waitForFunction(() => document.body.classList.contains('appear'), null, { timeout: 20000 });
  await page.waitForFunction(() => {
    const pending = document.querySelectorAll('main .section:not([data-section-status="loaded"]), '
      + '[data-block-status]:not([data-block-status="loaded"])');
    const chrome = ['header', 'footer'].every((t) => !document.querySelector(`body > ${t}`)
      || document.querySelector(`body > ${t} [data-block-status="loaded"]`));
    return !pending.length && chrome;
  }, null, { timeout: 30000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
}

/** Images in the viewport have loaded or failed. */
const imagesIn = (page) => page.waitForFunction(() => [...document.images].every((img) => {
  const r = img.getBoundingClientRect();
  return r.bottom < 0 || r.top > window.innerHeight || img.complete;
}), null, { timeout: 4000 }).catch(() => {});

/** A stitched full-page PNG: one viewport at a time, the sticky header only in the first. */
async function stitched(page) {
  const chunks = [];
  let y = 0;
  let height = await page.evaluate(() => document.documentElement.scrollHeight);
  while (y < height) {
    const at = await page.evaluate((top) => {
      window.scrollTo({ top, behavior: 'instant' });
      return window.scrollY;
    }, y);
    await imagesIn(page);
    await page.waitForTimeout(160);
    chunks.push({ at, png: PNG.sync.read(await page.screenshot()) });
    if (chunks.length === 1) await page.addStyleTag({ content: 'body > header { opacity: 0 !important; }' });
    height = await page.evaluate(() => document.documentElement.scrollHeight);
    if (at + VH >= height) break;
    y = at + VH;
  }
  const { width } = chunks[0].png;
  const out = new PNG({ width, height });
  chunks.forEach(({ at, png }) => {
    const rows = Math.min(png.height, height - at);
    PNG.bitblt(png, out, 0, 0, width, rows, 0, at);
  });
  return out;
}

/** Text below WCAG AA against its effective (solid) background; gradients and images skipped. */
function contrastProbe() {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const lum = ([r, g, b]) => [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
  const over = (top, under) => {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1);
  };
  const fails = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (!walker.currentNode.textContent.trim() || seen.has(el)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.closest('[aria-hidden="true"], .sr-only, [hidden]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible' || cs.clip === 'rect(0px, 0px, 0px, 0px)') continue;
    let faded = false;
    const layers = [];
    let complex = false;
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (Number(s.opacity) < 1) faded = true;
      if (s.backgroundImage !== 'none') {
        complex = true;
        break;
      }
      const bg = parse(s.backgroundColor);
      if (bg && bg[3] > 0) {
        layers.push(bg);
        if (bg[3] >= 1) break;
      }
    }
    if (complex || faded) continue;
    let ground = [255, 255, 255, 1];
    layers.reverse().forEach((l) => { ground = over(l, ground); });
    const fg = parse(cs.color);
    if (!fg) continue;
    const text = over(fg, ground);
    const [a, b] = [lum(text), lum(ground)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [];
      const label = [el.tagName.toLowerCase(), ...cls].join('.');
      fails.push({
        el: label,
        ratio: Math.round(ratio * 100) / 100,
        text: walker.currentNode.textContent.trim().slice(0, 40),
        color: cs.color,
      });
    }
  }
  return fails;
}

/** Elements that still show a brand-only color or face (see JACK_ONLY), with where they show it. */
function leakProbe(colors) {
  const want = colors.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const hit = (rgb) => want.find((w) => w.every((v, i) => Math.abs(v - rgb[i]) <= 1));
  const rgbs = (value) => [...String(value).matchAll(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/g)]
    .filter((m) => m[4] === undefined || Number(m[4]) > 0)
    .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const props = {
      color: el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ? cs.color : '',
      background: `${cs.backgroundColor} ${cs.backgroundImage}`,
      border: ['Top', 'Right', 'Bottom', 'Left'].filter((side) => parseFloat(cs[`border${side}Width`]) > 0)
        .map((side) => cs[`border${side}Color`]).join(' '),
      outline: parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none' ? cs.outlineColor : '',
      fill: el instanceof SVGElement ? cs.fill : '',
      stroke: el instanceof SVGElement && cs.stroke !== 'none' ? cs.stroke : '',
      shadow: cs.boxShadow !== 'none' ? cs.boxShadow : '',
    };
    const where = Object.entries(props).filter(([, v]) => v && rgbs(v).some(hit)).map(([k]) => k);
    const face = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    if (/playfair/i.test(face) && el.childNodes.length && el.textContent.trim()) where.push('font');
    if (where.length) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : [];
      out.push({ el: [el.tagName.toLowerCase(), ...cls].join('.'), where: where.join(' ') });
    }
  });
  return out;
}

async function render(browser, base, pagePath, brand, mode, width) {
  const context = await browser.newContext({
    viewport: { width, height: VH },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: mode === 'dark' ? 'light' : 'dark',
  });
  await context.addInitScript((m) => {
    try {
      if (m === 'system') localStorage.removeItem('jj-theme');
      else localStorage.setItem('jj-theme', m);
    } catch { /* storage blocked */ }
  }, mode);
  const page = await context.newPage();
  const errors = [];
  // known and not the theme's: the block library's editor-only blocks (library-metadata,
  // library-container-*) have no code; a local preview keeps DA's private image URLs where www has
  // no copy (401); YouTube is blocked below
  const known = (text) => /library-(metadata|container)|content\.da\.live|youtube|ytimg|googlevideo/.test(text);
  page.on('console', (msg) => {
    const text = `${msg.text()} ${msg.location()?.url || ''}`;
    if (msg.type() === 'error' && !known(text)) errors.push(text.slice(0, 200));
  });
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  const url = new URL(pagePath, base).href;
  // YouTube players load their posters over the network at their own pace: blocked on both
  // sides, they render as the same empty frame, so a diff is never a video still arriving
  await page.route(/youtube(-nocookie)?\.com|ytimg\.com|googlevideo\.com/, (route) => route.abort());
  await page.route((u) => u.href === url, async (route) => {
    const res = await route.fetch();
    await route.fulfill({ response: res, body: brandHtml(await res.text(), brand) });
  });
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await settle(page);
  const facts = await page.evaluate(() => ({
    brand: document.documentElement.dataset.brand || 'jack',
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
  }));
  const contrast = CONTRAST ? await page.evaluate(contrastProbe) : [];
  const leaks = brand === 'adobe' ? await page.evaluate(leakProbe, JACK_ONLY) : [];
  const png = await stitched(page);
  await context.close();
  return {
    png, errors, contrast, leaks, ...facts,
  };
}

function compare(a, b) {
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const crop = (png) => {
    const c = new PNG({ width, height });
    PNG.bitblt(png, c, 0, 0, width, height, 0, 0);
    return c;
  };
  const diff = new PNG({ width, height });
  const n = pixelmatch(crop(a).data, crop(b).data, diff.data, width, height, { threshold: 0.1 });
  return {
    mismatched: n, pct: (100 * n) / (width * height), dh: b.height - a.height, diff,
  };
}

const jobs = [];
pages.forEach((p) => BRANDS.forEach((brand) => MODES.forEach((mode) => WIDTHS.forEach((width) => {
  jobs.push({
    path: p, brand, mode, width,
  });
}))));

const browser = await chromium.launch();
const results = [];
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next];
    next += 1;
    const name = `${job.path.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home'}.${job.brand}.${job.mode}.${job.width}`;
    const result = {
      ...job, name, problems: [],
    };
    try {
      const now = await render(browser, BASE, job.path, job.brand, job.mode, job.width);
      Object.assign(result, {
        brandTaken: now.brand,
        overflow: now.overflow,
        errors: now.errors,
        contrast: now.contrast,
        leaks: now.leaks,
        accent: now.accent,
      });
      if (now.brand !== job.brand) result.problems.push(`brand ${now.brand}`);
      if (now.overflow > 1) result.problems.push(`overflow ${now.overflow}px`);
      if (now.errors.length) result.problems.push(`${now.errors.length} console errors`);
      if (now.contrast.length) result.problems.push(`${now.contrast.length} low contrast`);
      if (now.leaks.length) result.problems.push(`${now.leaks.length} brand leaks`);
      if (AGAINST) {
        const then = await render(browser, AGAINST, job.path, job.brand, job.mode, job.width);
        const c = compare(then.png, now.png);
        Object.assign(result, { pct: c.pct, dh: c.dh });
        if (c.mismatched || c.dh) {
          result.problems.push(`diff ${c.pct.toFixed(3)}% dh ${c.dh}`);
          fs.writeFileSync(path.join(OUT, `${name}.diff.png`), PNG.sync.write(c.diff));
          fs.writeFileSync(path.join(OUT, `${name}.against.png`), PNG.sync.write(then.png));
          fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(now.png));
        } else if (KEEP) fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(now.png));
      } else if (KEEP || result.problems.length) fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(now.png));
    } catch (e) {
      result.problems.push(`failed: ${String(e.message || e).split('\n')[0].slice(0, 120)}`);
    }
    results.push(result);
    const verdict = result.problems.length ? 'FAIL' : 'ok  ';
    console.log(`${verdict} ${name}${result.problems.length ? `  ${result.problems.join(', ')}` : ''}`);
  }
}
await Promise.all(Array.from({ length: Math.min(JOBS, jobs.length) }, worker));
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.problems.length);
console.log(`theme-matrix: ${results.length} renders, ${failed.length} with problems; report ${path.join(OUT, 'report.json')}`);
process.exit(failed.length ? 1 : 0);
