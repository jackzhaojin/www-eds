#!/usr/bin/env node
// v3's contrast gate (design-system/v3/eval/browser-check.js, SPEC section 10) run on EDS pages:
// the same nine semantic pairs and the same WCAG formula, per theme (stored Light, stored Dark,
// System on a dark OS), plus document overflow per width. Usage: v3-eval.mjs <url> [<url>...]
import { chromium } from 'playwright';

const PAIRS = [['--color-text', '--color-bg', 4.5], ['--color-text', '--color-surface', 4.5], ['--color-text-muted', '--color-bg', 4.5],
  ['--color-text-muted', '--color-surface', 4.5], ['--color-text-faint', '--color-bg', 4.5], ['--color-accent', '--color-bg', 4.5],
  ['--color-on-accent', '--color-accent', 4.5], ['--color-inverse-text', '--color-inverse-bg', 4.5], ['--color-line-strong', '--color-bg', 3]];
const THEMES = [['light', 'light'], ['dark', 'light'], ['system', 'dark']];
const WIDTHS = [390, 768, 1024, 1440, 1920];
const urls = process.argv.slice(2);
const b = await chromium.launch();
let failures = 0;
for (const url of urls) {
  for (const [choice, os] of THEMES) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: os });
    await ctx.addInitScript((c) => { try { localStorage.setItem('jj-theme', c); } catch (e) { /* none */ } }, choice);
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(url, { waitUntil: 'networkidle' });
    const res = await p.evaluate((pairs) => {
      const parse = (c) => { const r = c.match(/rgba?\(([^)]+)\)/); if (r) { const v = r[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; } const k = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/); return k ? [k[1] * 255, k[2] * 255, k[3] * 255, k[4] !== undefined ? +k[4] : 1] : null; };
      const blend = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
      const lum = (c) => { const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const pageBg = parse(getComputedStyle(document.body).backgroundColor);
      return { theme: document.documentElement.getAttribute('data-theme') || 'none', pairs: pairs.map(([fgVar, bgVar, min]) => {
        const el = document.createElement('div'); document.body.append(el);
        el.style.color = `var(${fgVar})`; el.style.backgroundColor = `var(${bgVar})`;
        const st = getComputedStyle(el); let fg = parse(st.color); let bg = parse(st.backgroundColor); el.remove();
        if (bg[3] < 1) bg = blend(bg, pageBg); if (fg[3] < 1) fg = blend(fg, bg);
        const l1 = lum(fg); const l2 = lum(bg); const ratio = Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
        return { pair: `${fgVar} on ${bgVar}`, ratio, min, pass: ratio >= min };
      }) };
    }, PAIRS);
    const over = [];
    for (const w of WIDTHS) {
      await p.setViewportSize({ width: w, height: 900 });
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w + 4) over.push(`${w}:+${sw - w}`);
    }
    const bad = res.pairs.filter((x) => !x.pass);
    failures += bad.length + over.length + errors.length;
    console.log(`${url} [${choice}${os === 'dark' ? ', OS dark' : ''}] data-theme=${res.theme} contrast ${res.pairs.length - bad.length}/${res.pairs.length} AA${bad.length ? ` FAIL ${bad.map((x) => `${x.pair} ${x.ratio}`).join('; ')}` : ''} | overflow ${over.length ? over.join(' ') : 'none'} | console errors ${errors.length}`);
    await ctx.close();
  }
}
await b.close();
console.log(failures ? `v3-eval: FAIL (${failures})` : 'v3-eval: PASS');
process.exit(failures ? 1 : 0);
