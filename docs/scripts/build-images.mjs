#!/usr/bin/env node
/*
 * The pictures in docs/: illustrations of the edge Worker, and captures of what it serves. It
 * reads the live site (aem.live without the Worker, www through it), so the numbers, titles and
 * HTML in the pictures are today's. Run it again after the Worker or a hub changes:
 *
 *   node docs/scripts/build-images.mjs
 *
 * Writes docs/images/*.png at twice their size: each illustration in a light and a dark version
 * (docs pick one with <picture> and prefers-color-scheme, as GitHub shows them). The colors and
 * the three faces are the site's own (styles/styles.css, fonts/). Needs Playwright (a
 * devDependency) and the network. Behind a proxy, Node's fetch needs NODE_USE_ENV_PROXY=1.
 */
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'docs', 'images');
const ORIGIN = 'https://main--www-eds--jackzhaojin.aem.live';
const WWW = 'https://www.jackzhaojin.com';
const HUB = '/writing/';
const BLOCK = '<div class="writing-index">';

/* The site's tokens (styles/styles.css), light and dark. Code panels stay on Night 850 in both,
 * as the site's code blocks do. */
const THEMES = {
  light: {
    bg: '#f6f4f0',
    surface: '#ffffff',
    raised: '#f1eee9',
    text: '#1a1917',
    muted: '#4a4744',
    faint: '#6f6b66',
    line: 'rgba(20, 18, 15, 0.10)',
    strong: 'rgba(20, 18, 15, 0.48)',
    accent: '#5b4bc4',
    soft: 'rgba(91, 75, 196, 0.08)',
    edge: '#1a1917',
    onEdge: '#f6f4f0',
    onEdgeMuted: '#b2afac',
    edgeAccent: '#c0b3ff',
  },
  dark: {
    bg: '#131313',
    surface: '#1a1a19',
    raised: '#201f1f',
    text: '#e8e5e3',
    muted: '#b2afac',
    faint: '#94908c',
    line: 'rgba(255, 255, 255, 0.08)',
    strong: 'rgba(255, 255, 255, 0.36)',
    accent: '#c0b3ff',
    soft: 'rgba(192, 179, 255, 0.10)',
    edge: '#e8e5e3',
    onEdge: '#131313',
    onEdgeMuted: '#4a4744',
    edgeAccent: '#5b4bc4',
  },
};
const CODE = {
  ground: '#1a1a19',
  text: '#e8e5e3',
  faint: '#94908c',
  tag: '#c0b3ff',
  attr: '#f0cf8e',
  add: '#9fe0c0',
  addGround: 'rgba(159, 224, 192, 0.10)',
  line: 'rgba(255, 255, 255, 0.08)',
};

const font = (file) => readFileSync(join(ROOT, 'fonts', file)).toString('base64');
const FONTS = `
@font-face { font-family: Inter; src: url(data:font/woff2;base64,${font('inter-latin.woff2')}) format('woff2'); font-weight: 100 900; }
@font-face { font-family: Playfair; src: url(data:font/woff2;base64,${font('playfair-display-latin.woff2')}) format('woff2'); font-weight: 400 900; }
@font-face { font-family: Playfair; font-style: italic; src: url(data:font/woff2;base64,${font('playfair-display-italic-latin.woff2')}) format('woff2'); font-weight: 400 900; }
@font-face { font-family: Mono; src: url(data:font/woff2;base64,${font('jetbrains-mono-latin.woff2')}) format('woff2'); font-weight: 100 800; }`;

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const unesc = (text) => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'");

/** The index of the </div> that closes the div opening at start (as edge/src/listings.mjs). */
function closingDiv(html, start) {
  const tags = /<div\b|<\/div>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[0] === '</div>' ? -1 : 1;
    if (!depth) return match.index;
  }
  return -1;
}

/** The block's top-level rows, as HTML strings. */
function blockRows(html) {
  const start = html.indexOf(BLOCK);
  if (start < 0) return [];
  const end = closingDiv(html, start);
  const rows = [];
  let at = start + BLOCK.length;
  for (;;) {
    const open = html.indexOf('<div', at);
    if (open < 0 || open >= end) break;
    const close = closingDiv(html, open);
    rows.push(html.slice(open, close + 6));
    at = close + 6;
  }
  return rows;
}

const ldGraphs = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));

async function readSite() {
  const get = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    return res.text();
  };
  const [authored, served, index] = await Promise.all([
    get(`${ORIGIN}${HUB}`), get(`${WWW}${HUB}`), get(`${WWW}/writing-index.json?limit=1`).then(JSON.parse),
  ]);
  const rows = blockRows(served).filter((row) => !/^<div>\s*<div>Source<\/div>/.test(row));
  const articles = rows.map((row) => ({
    date: unesc(row.match(/<p>([^<]*)<\/p>/)?.[1] || ''),
    title: unesc(row.match(/<h2[^>]*><a href="[^"]*">([^<]*)<\/a>/)?.[1] || ''),
    href: row.match(/<h2[^>]*><a href="([^"]*)"/)?.[1] || '',
  }));
  const graph = ldGraphs(served)[0]?.['@graph'] || [];
  const list = graph.find((node) => node['@type'] === 'ItemList');
  return {
    authored,
    served,
    title: unesc(served.match(/<title>([^<]*)<\/title>/)?.[1] || ''),
    articles,
    authoredRows: blockRows(authored).length - 1,
    authoredLD: ldGraphs(authored).length,
    types: graph.map((node) => node['@type']),
    listed: list?.numberOfItems ?? 0,
    firstItem: list?.itemListElement?.[0]?.item,
    indexTotal: index.total,
    firstPath: index.data[0]?.path || '',
    bytes: { authored: Buffer.byteLength(authored), served: Buffer.byteLength(served) },
  };
}

const page = (theme, body, css = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
${FONTS}
:root { --bg: ${theme.bg}; --surface: ${theme.surface}; --raised: ${theme.raised}; --text: ${theme.text};
  --muted: ${theme.muted}; --faint: ${theme.faint}; --line: ${theme.line}; --strong: ${theme.strong};
  --accent: ${theme.accent}; --soft: ${theme.soft}; --edge: ${theme.edge}; --on-edge: ${theme.onEdge};
  --on-edge-muted: ${theme.onEdgeMuted}; --edge-accent: ${theme.edgeAccent}; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: transparent; font: 400 15px/1.5 Inter, sans-serif; color: var(--text); }
#frame { width: 1200px; padding: 44px 48px 48px; background: var(--bg); border-radius: 20px; position: relative; }
.eyebrow { font: 500 12px/1 Mono, monospace; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }
h1 { font: 600 34px/1.15 Playfair, serif; margin: 12px 0 8px; letter-spacing: -0.01em; }
h1 em { font-style: italic; color: var(--accent); }
.lede { color: var(--muted); font-size: 16px; max-width: 860px; }
.mono { font-family: Mono, monospace; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; }
.label { font: 600 11px/1 Mono, monospace; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }
.tag { display: inline-block; font: 600 10.5px/1 Mono, monospace; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--accent); background: var(--soft); border: 1px solid var(--accent); border-radius: 999px; padding: 5px 9px; }
svg.wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
${css}
</style></head><body><div id="frame">${body}</div>
<script>
/* Curved wires between elements: [from, to, options] in data-wire="#a #b solid|dashed". */
window.drawWires = () => {
  const frame = document.getElementById('frame');
  const box = frame.getBoundingClientRect();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'wires');
  const color = getComputedStyle(frame).getPropertyValue('--strong');
  svg.innerHTML = '<defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="' + color + '"/></marker></defs>';
  document.querySelectorAll('[data-wire]').forEach((el) => {
    el.dataset.wire.split(';').forEach((spec) => {
      const [toSel, style = 'solid', fromSide = 'right', toSide = 'left'] = spec.trim().split(' ');
      const to = document.querySelector(toSel);
      const a = el.getBoundingClientRect(); const b = to.getBoundingClientRect();
      const point = (r, side) => ({
        right: [r.right - box.left, r.top + r.height / 2 - box.top],
        left: [r.left - box.left, r.top + r.height / 2 - box.top],
        bottom: [r.left + r.width / 2 - box.left, r.bottom - box.top],
        top: [r.left + r.width / 2 - box.left, r.top - box.top],
      }[side]);
      const [x1, y1] = point(a, fromSide); const [x2, y2] = point(b, toSide);
      const horizontal = fromSide === 'right' || fromSide === 'left';
      const d = horizontal
        ? 'M' + (x1 + 4) + ',' + y1 + ' C' + ((x1 + x2) / 2) + ',' + y1 + ' ' + ((x1 + x2) / 2) + ',' + y2 + ' ' + (x2 - 6) + ',' + y2
        : 'M' + x1 + ',' + (y1 + 4) + ' C' + x1 + ',' + ((y1 + y2) / 2) + ' ' + x2 + ',' + ((y1 + y2) / 2) + ' ' + x2 + ',' + (y2 - 6);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '1.6');
      if (style === 'dashed') path.setAttribute('stroke-dasharray', '5 5');
      path.setAttribute('marker-end', 'url(#head)');
      svg.append(path);
    });
  });
  frame.append(svg);
};
</script></body></html>`;

/* 1. The hero: one row in the editor plus the index, finished at the edge. */
function hero(site, theme) {
  const shown = site.articles.slice(0, 4);
  const css = `
.grid { display: grid; grid-template-columns: 330px 1fr 330px; gap: 64px; margin-top: 30px; align-items: center; }
.stack { display: flex; flex-direction: column; gap: 14px; }
.plus { text-align: center; font: 600 22px/1 Inter, sans-serif; color: var(--faint); }
.card { padding: 18px; }
.card .label { margin-bottom: 12px; }
table.block { width: 100%; border-collapse: collapse; font-size: 14px; }
table.block td { border: 1px solid var(--strong); padding: 9px 11px; }
table.block tr:first-child td { background: var(--raised); font-weight: 600; }
table.block a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.note { margin-top: 10px; font-size: 12.5px; color: var(--muted); }
pre { font: 400 12px/1.55 Mono, monospace; color: var(--muted); white-space: pre; }
pre b { color: var(--accent); font-weight: 600; }
.worker { background: var(--edge); color: var(--on-edge); border-radius: 18px; padding: 24px 24px 22px; }
.worker .label { color: var(--edge-accent); }
.worker h2 { font: 600 24px/1.2 Playfair, serif; margin: 10px 0 4px; }
.worker .sub { color: var(--on-edge-muted); font-size: 13px; margin-bottom: 16px; }
.worker ol { list-style: none; display: flex; flex-direction: column; gap: 10px; counter-reset: s; }
.worker li { display: grid; grid-template-columns: 26px 1fr; gap: 10px; font-size: 14px; align-items: start; }
.worker li::before { counter-increment: s; content: counter(s); width: 24px; height: 24px; border-radius: 50%;
  border: 1px solid var(--edge-accent); color: var(--edge-accent); font: 600 12px/22px Mono, monospace; text-align: center; }
.worker li small { display: block; color: var(--on-edge-muted); font-size: 12px; }
.browser { overflow: hidden; }
.chrome { display: flex; align-items: center; gap: 6px; padding: 9px 12px; border-bottom: 1px solid var(--line); background: var(--raised); }
.chrome i { width: 9px; height: 9px; border-radius: 50%; background: var(--strong); opacity: 0.5; }
.chrome span { margin-left: 8px; font: 500 11.5px/1 Mono, monospace; color: var(--muted); }
.served { padding: 14px 16px 16px; }
.added { border-left: 3px solid var(--accent); background: var(--soft); border-radius: 0 8px 8px 0; padding: 8px 10px; position: relative; }
.added .tag { position: absolute; right: 8px; top: -10px; background: var(--surface); }
.ld { font: 500 11.5px/1.45 Mono, monospace; color: var(--muted); margin-bottom: 12px; }
.ld b { color: var(--accent); }
.src { font-size: 12px; color: var(--faint); padding: 6px 0 10px; }
.rows { display: flex; flex-direction: column; gap: 7px; }
.row { display: flex; flex-direction: column; gap: 1px; font-size: 12.5px; line-height: 1.3; }
.row span { color: var(--faint); font: 500 10.5px/1.5 Mono, monospace; }
.row b { font-weight: 600; }
.more { font: 500 11.5px/1 Mono, monospace; color: var(--accent); margin-top: 4px; }
.equation { margin-top: 34px; padding-top: 22px; border-top: 1px solid var(--line); display: flex; align-items: center; gap: 14px; flex-wrap: nowrap; }
.chip { border: 1px solid var(--strong); border-radius: 10px; padding: 10px 14px; font-size: 14px; background: var(--surface); }
.chip small { display: block; font: 500 10.5px/1.4 Mono, monospace; color: var(--faint); letter-spacing: 0.04em; }
.chip.new { border-color: var(--accent); background: var(--soft); }
.chip.new small { color: var(--accent); }
.chip.out { background: var(--edge); color: var(--on-edge); border-color: var(--edge); }
.chip.out small { color: var(--edge-accent); }
.op { font: 600 22px/1 Inter, sans-serif; color: var(--faint); }`;
  const body = `
<div class="eyebrow">Edge-side rendering · www.jackzhaojin.com</div>
<h1>One row in the editor. <em>The whole list</em> at the edge.</h1>
<p class="lede">A Cloudflare Worker reads the index and writes the rows and the structured data into the page before it leaves the edge, so readers, search engines and AI crawlers all get the finished HTML.</p>
<div class="grid">
  <div class="stack">
    <div class="card" id="authored" data-wire="#worker">
      <div class="label">1 · Written in Experience Workspace</div>
      <table class="block"><tr><td colspan="2">Writing index</td></tr><tr><td>Source</td><td><a>/writing-index.json</a></td></tr></table>
      <p class="note">The author's whole job: one block, one row naming the index.</p>
    </div>
    <div class="plus">+</div>
    <div class="card" id="index" data-wire="#worker">
      <div class="label">2 · Kept current by Edge Delivery</div>
      <pre>/writing-index.json
{ "total": <b>${site.indexTotal}</b>,
  "data": [
    { "path": "${esc(site.firstPath.slice(0, 16))}...",
      "title": ..., ... },
    ... ] }</pre>
      <p class="note">Publishing an article updates its record.</p>
    </div>
  </div>
  <div class="worker" id="worker" data-wire="#browser">
    <div class="label">3 · At Cloudflare's edge</div>
    <h2>The Worker finishes the page</h2>
    <p class="sub">On every request to www, in front of the cache</p>
    <ol>
      <li><span>Reads <span class="mono">/writing-index.json</span><small>from aem.live, cached 5 minutes, 3 second budget</small></span></li>
      <li><span>Writes ${site.articles.length} rows of HTML into the block<small>with the same code the browser runs</small></span></li>
      <li><span>Adds one JSON-LD graph to the head<small>${esc(site.types.join(', '))}</small></span></li>
    </ol>
  </div>
  <div class="card browser" id="browser">
    <div class="chrome"><i></i><i></i><i></i><span>www.jackzhaojin.com${HUB}</span></div>
    <div class="served">
      <div class="label" style="margin-bottom:20px">4 · What everyone gets</div>
      <div class="added ld"><span class="tag">added at the edge</span>&lt;script type="application/ld+json"&gt;<br>ItemList of <b>${site.listed}</b> articles</div>
      <div class="src">Source | /writing-index.json</div>
      <div class="added rows">
        ${shown.map((a) => `<div class="row"><span>${esc(a.date)}</span><b>${esc(a.title)}</b></div>`).join('')}
        <div class="more">+ ${site.articles.length - shown.length} more rows</div>
      </div>
    </div>
  </div>
</div>
<div class="equation">
  <div class="chip">The Source row<small>authored, a JSON include</small></div><div class="op">+</div>
  <div class="chip new">${site.articles.length} rows of HTML<small>added at the edge</small></div><div class="op">+</div>
  <div class="chip new">1 JSON-LD graph<small>added at the edge</small></div><div class="op">=</div>
  <div class="chip out">${HUB} on www<small>${Math.round(site.bytes.authored / 1024)} KB as authored, ${Math.round(site.bytes.served / 1024)} KB as served</small></div>
</div>`;
  return page(theme, body, css);
}

/* 2. The served HTML: what the Worker adds, as a diff of the real markup. */
function htmlDiff(site, theme) {
  const [first, second] = site.articles;
  const lines = (rows) => rows.map(([kind, text]) => `<div class="ln ${kind}"><i>${kind === 'add' ? '+' : ''}</i><code>${text}</code></div>`).join('');
  const t = (name, attrs = '') => `<b class="t">&lt;${name}</b>${attrs}<b class="t">&gt;</b>`;
  const c = (name) => `<b class="t">&lt;/${name}&gt;</b>`;
  const a = (name, value) => ` <span class="a">${name}</span>=<span class="v">"${esc(value)}"</span>`;
  const head = [
    ['', t('head')],
    ['', `  ${t('title')}${esc(site.title)}${c('title')}`],
    ['', '  <span class="f">... meta, canonical, Open Graph ...</span>'],
  ];
  const block = [
    ['', t('div', a('class', 'writing-index'))],
    ['', `  ${t('div')}${t('div')}Source${c('div')}${t('div')}${t('a', a('href', '/writing-index.json'))}/writing-index.json${c('a')}${c('div')}${c('div')}`],
  ];
  const left = lines([...head, ['', c('head')], ['', '<span class="f">... the hero ...</span>'], ...block, ['', c('div')]]);
  const right = lines([
    ...head,
    ['add', `  ${t('script', a('type', 'application/ld+json'))}`],
    ['add', `  {"@graph": [${site.types.map((type) => `<span class="v">${type}</span>`).join(', ')}],`],
    ['add', `   "numberOfItems": <span class="v">${site.listed}</span>, "itemListElement": [ ... ]}`],
    ['add', `  ${c('script')}`],
    ['', c('head')],
    ['', '<span class="f">... the hero ...</span>'],
    ...block,
    ['add', `  ${t('div')}${t('div')}${t('p')}${esc(first.date)}${c('p')} ...${c('div')}`],
    ['add', `    ${t('div')}${t('h2')}${t('a', a('href', first.href))}${esc(first.title.slice(0, 34))}...${c('a')}${c('h2')} ...`],
    ['add', `  ${t('div')}${t('div')}${t('p')}${esc(second.date)}${c('p')} ...${c('div')}`],
    ['add', `    ${t('div')}${t('h2')}${t('a', a('href', second.href))}${esc(second.title.slice(0, 34))}...${c('a')}${c('h2')} ...`],
    ['add', `  <span class="f">... ${site.articles.length - 2} more rows ...</span>`],
    ['', c('div')],
  ]);
  const css = `
.cols { display: grid; grid-template-columns: 1fr 1.32fr; gap: 22px; margin-top: 28px; align-items: start; }
.head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; gap: 12px; }
.host { font: 600 13px/1.3 Mono, monospace; }
.host small { display: block; font: 400 12px/1.4 Inter, sans-serif; color: var(--muted); }
.count { font: 600 11px/1 Mono, monospace; color: var(--faint); white-space: nowrap; }
.count.on { color: var(--accent); }
.code { background: ${CODE.ground}; border-radius: 14px; padding: 16px 0; border: 1px solid ${CODE.line}; }
.ln { display: grid; grid-template-columns: 26px 1fr; font: 400 11.5px/1.75 Mono, monospace; color: ${CODE.text}; }
.ln i { font-style: normal; text-align: center; color: ${CODE.add}; }
.ln code { font: inherit; white-space: pre; overflow: hidden; text-overflow: ellipsis; padding-right: 14px; }
.ln.add { background: ${CODE.addGround}; }
.ln.add code { color: ${CODE.add}; }
.t { color: ${CODE.tag}; font-weight: 400; }
.a { color: ${CODE.attr}; }
.v { color: ${CODE.text}; }
.ln.add .v { color: #ffffff; }
.f { color: ${CODE.faint}; }
.key { margin-top: 16px; font-size: 13px; color: var(--muted); }
.key b { color: var(--accent); }`;
  const body = `
<div class="eyebrow">The HTML, before and after the edge</div>
<h1>Same page, same block. <em>The Worker adds the rest.</em></h1>
<p class="lede">Excerpts of the real ${HUB} HTML. On the left, Edge Delivery as authored: the block is just the Source row, the JSON include. On the right, www: the same markup, plus every row and the page's structured data.</p>
<div class="cols">
  <div><div class="head"><div class="host">aem.live, no Worker<small>main--www-eds--jackzhaojin.aem.live${HUB}</small></div><div class="count">${site.authoredRows} rows · ${site.authoredLD} JSON-LD</div></div>
    <div class="code">${left}</div></div>
  <div><div class="head"><div class="host">www, through the Worker<small>www.jackzhaojin.com${HUB}</small></div><div class="count on">${site.articles.length} rows · 1 JSON-LD</div></div>
    <div class="code">${right}</div></div>
</div>
<p class="key"><b>+</b> lines are written by the Worker on every request. None of them was typed by an author: the rest of the right side is the authored page, unchanged.</p>`;
  return page(theme, body, css);
}

/* 3. What a reader without JavaScript gets (most AI crawlers), and what a browser shows. Each
 * capture comes with the box of the listing block in it, to mark on the picture. */
const VIEW = { width: 1100, height: 1400 };
async function captures(browser, site) {
  const context = await browser.newContext({ viewport: VIEW, colorScheme: 'light' });
  const tab = await context.newPage();
  const capture = async () => {
    const box = await tab.evaluate(() => {
      const r = document.querySelector('.writing-index')?.getBoundingClientRect();
      return r && {
        x: r.left, y: r.top, width: r.width, height: r.height,
      };
    });
    const png = await tab.screenshot({ clip: { x: 0, y: 0, ...VIEW } });
    return { src: `data:image/png;base64,${png.toString('base64')}`, box };
  };
  // The HTML as served, with its scripts taken out: what a reader that doesn't run JavaScript
  // gets. Images are capped in width, so more of the text fits in the picture.
  const asServed = async (html, base) => {
    const bare = html
      .replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g, '')
      .replace('<head>', `<head><base href="${base}/">`)
      .replace('</head>', '<style>body { display: block !important; padding: 0 24px; } img { max-width: 420px; height: auto; }</style></head>')
      .replace(/loading="lazy"/g, 'loading="eager"');
    await tab.setContent(bare, { waitUntil: 'load', timeout: 60000 });
    await tab.waitForTimeout(500);
    return capture();
  };
  const shots = [await asServed(site.authored, ORIGIN), await asServed(site.served, WWW)];
  await tab.goto(`${WWW}${HUB}`, { waitUntil: 'networkidle', timeout: 60000 });
  await tab.evaluate(() => window.scrollTo(0, 0));
  await tab.waitForTimeout(1500);
  shots.push(await capture());
  await context.close();
  return shots;
}

function crawlerView(site, shots, theme) {
  const panes = [
    ['aem.live, no Worker', 'The HTML as served, without JavaScript', `${site.authoredRows} articles`, false, 'the block: only the Source row'],
    ['www, through the Worker', 'The HTML as served, without JavaScript', `${site.articles.length} articles`, true, `${site.articles.length} rows, already in the HTML`],
    ['www, in a browser', 'The same rows, after the blocks decorate them', `${site.articles.length} articles`, true, 'the same rows, decorated'],
  ];
  // The block's box on the picture, in percent, cut to the capture.
  const mark = ({ box }, note, on, below) => {
    if (!box) return '';
    const top = Math.max(box.y, 0);
    const bottom = Math.min(box.y + Math.max(box.height, 28), VIEW.height);
    const pct = (value, of) => `${((value / of) * 100).toFixed(2)}%`;
    return `<div class="mark${on ? ' on' : ''}" style="left:${pct(box.x - 6, VIEW.width)};width:${pct(box.width + 12, VIEW.width)};`
      + `top:${pct(top - 6, VIEW.height)};height:${pct(bottom - top + 12, VIEW.height)}"><span class="${below ? 'below' : ''}">${below ? '&uarr; ' : ''}${note}</span></div>`;
  };
  const css = `
.panes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 28px; }
.pane .shot { border-radius: 12px; overflow: hidden; border: 1px solid var(--line); background: #fff; position: relative; }
.pane img { width: 100%; display: block; }
.mark { position: absolute; border: 2.5px solid var(--faint); border-radius: 8px; background: rgba(111, 107, 102, 0.06); }
.mark.on { border-color: #5b4bc4; background: rgba(91, 75, 196, 0.07); }
.mark span { position: absolute; left: 8px; bottom: 8px; white-space: nowrap; font: 600 11px/1 Mono, monospace; color: #fff;
  background: #6f6b66; border-radius: 6px; padding: 6px 8px; }
.mark.on span { background: #5b4bc4; }
.mark span.below { bottom: auto; top: calc(100% + 64px); left: 0; }
.pane h3 { font: 600 14px/1.3 Mono, monospace; margin-top: 14px; display: flex; justify-content: space-between; gap: 8px; }
.pane h3 span { color: var(--faint); }
.pane.on h3 span { color: var(--accent); }
.pane p { font-size: 13px; color: var(--muted); }`;
  const body = `
<div class="eyebrow">What a crawler reads</div>
<h1>Without the Worker, the list is <em>empty</em> until JavaScript runs.</h1>
<p class="lede">GPTBot, ClaudeBot and PerplexityBot read the HTML as it arrives. These are real captures of ${HUB}: the first two with the page's scripts taken out, which is all those crawlers get.</p>
<div class="panes">${panes.map(([name, note, count, on, markNote], i) => `
  <div class="pane${on ? ' on' : ''}"><div class="shot"><img src="${shots[i].src}">${mark(shots[i], markNote, on, i === 0)}</div>
    <h3>${name}<span>${count}</span></h3><p>${note}</p></div>`).join('')}
</div>`;
  return page(theme, body, css);
}

/* 4. The Worker's jobs, for cloudflare-worker.md. */
function workerJobs(theme) {
  const jobs = [
    ['Put Edge Delivery on www', "Adobe's worker, vendored"],
    ['Share the domain with GitHub Pages', '7 project sites pass through'],
    ['Finish pages at the edge', 'listing rows and JSON-LD'],
    ['Set the browser cache', '10 minutes for pages'],
    ['Keep other hosts out of search', 'noindex everywhere but www'],
    ['Stand by', 'serve the archive if Adobe is down'],
  ];
  const css = `
.map { display: grid; grid-template-columns: 170px 1fr 270px; gap: 70px; margin-top: 30px; align-items: center; }
.who { display: flex; flex-direction: column; gap: 14px; }
.pill { border: 1px solid var(--strong); border-radius: 999px; padding: 10px 16px; font-size: 14px; text-align: center; background: var(--surface); }
.edge { border: 1.5px dashed var(--strong); border-radius: 22px; padding: 18px; position: relative; }
.edge > .label { position: absolute; top: -8px; left: 22px; background: var(--bg); padding: 0 8px; }
.worker { background: var(--edge); color: var(--on-edge); border-radius: 16px; padding: 20px 22px; }
.worker .label { color: var(--edge-accent); }
.worker h2 { font: 600 22px/1.2 Playfair, serif; margin: 8px 0 14px; }
.jobs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; counter-reset: j; }
.job { display: grid; grid-template-columns: 26px 1fr; gap: 10px; font-size: 13.5px; line-height: 1.3; }
.job::before { counter-increment: j; content: counter(j); width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--edge-accent);
  color: var(--edge-accent); font: 600 12px/22px Mono, monospace; text-align: center; }
.job small { display: block; color: var(--on-edge-muted); font-size: 12px; margin-top: 2px; }
.job.hot { color: var(--on-edge); }
.job.hot b { color: var(--edge-accent); }
.cache { margin-top: 14px; border: 1px solid var(--line); background: var(--surface); border-radius: 12px; padding: 12px 14px; font-size: 13px; color: var(--muted); }
.cache b { color: var(--text); }
.origins { display: flex; flex-direction: column; gap: 14px; }
.origin { padding: 14px 16px; }
.origin b { display: block; font-size: 14.5px; }
.origin span { font-size: 12.5px; color: var(--muted); }
.origin.standby { border-style: dashed; background: transparent; }`;
  const body = `
<div class="eyebrow">The Cloudflare Worker in front of www</div>
<h1>One small program at the edge, <em>six jobs</em>.</h1>
<p class="lede">Every request to www.jackzhaojin.com runs through the Worker in Cloudflare's data center nearest the reader, before the cache, then goes to the right origin.</p>
<div class="map">
  <div class="who"><div class="pill" id="reader" data-wire="#worker">Reader</div><div class="pill" id="crawler" data-wire="#worker">Search or AI crawler</div></div>
  <div class="edge"><div class="label">Cloudflare edge, near the reader</div>
    <div class="worker" id="worker" data-wire="#eds;#ghp;#arc dashed">
      <div class="label">Worker www-eds-edge · edge/src</div>
      <h2>What it does to each request</h2>
      <div class="jobs">${jobs.map(([job, note], i) => `<div class="job${i === 2 ? ' hot' : ''}"><span><b>${job}</b><small>${note}</small></span></div>`).join('')}</div>
    </div>
    <div class="cache"><b>Cloudflare cache</b> behind it: pages as authored up to 2 days, the indexes 5 minutes, all purged on every publish.</div>
  </div>
  <div class="origins">
    <div class="card origin" id="eds"><b>Edge Delivery</b><span>aem.live: pages, code, media, indexes</span></div>
    <div class="card origin" id="ghp"><b>GitHub Pages</b><span>the 7 project sites, untouched</span></div>
    <div class="card origin standby" id="arc"><b>www-archive</b><span>standby, only if Adobe can't serve</span></div>
  </div>
</div>`;
  return page(theme, body, css);
}

async function render(browser, name, html) {
  const context = await browser.newContext({
    deviceScaleFactor: 2, viewport: { width: 1300, height: 900 },
  });
  const tab = await context.newPage();
  await tab.setContent(html, { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.evaluate(() => window.drawWires());
  await (await tab.$('#frame')).screenshot({ path: join(OUT, `${name}.png`), omitBackground: true });
  await context.close();
  // eslint-disable-next-line no-console
  console.log(`docs/images/${name}.png`);
}

const site = await readSite();
if (!site.articles.length || !site.listed) {
  throw new Error('www served no rows or no ItemList: is the Worker live?');
}
mkdirSync(OUT, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ proxy });
const shots = await captures(browser, site);
// One picture at a time, light then dark: each render has its own browser context.
await Object.entries(THEMES).reduce((done, [mode, theme]) => done
  .then(() => render(browser, `edge-hero-${mode}`, hero(site, theme)))
  .then(() => render(browser, `edge-html-${mode}`, htmlDiff(site, theme)))
  .then(() => render(browser, `edge-crawler-view-${mode}`, crawlerView(site, shots, theme)))
  .then(() => render(browser, `worker-jobs-${mode}`, workerJobs(theme))), Promise.resolve());
await browser.close();
