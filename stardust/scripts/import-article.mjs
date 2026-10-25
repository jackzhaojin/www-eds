#!/usr/bin/env node
// Imports one source article (jackzhaojin.github.io/writing/<slug>/index.html) into an
// Experience Workspace document for the article template: head section, rail, one section
// per part (section metadata id), explainer family blocks, related section, metadata.
// Text is carried verbatim; links stay absolute to www.jackzhaojin.com so localize-links can
// rewrite the ones that resolve on the new site. Images point at DA media under
// media/writing/<slug>/ (upload them with da-media-upload.mjs --scope writing/<slug>).
//
// Engines: every stardust/scripts/import-engines/<name>.mjs exports match($, el) and
// convert($, el, h) -> HTML for one explainer one-off (h = the helpers below). The first
// engine that matches an element converts it; anything nothing converts is UNSUPPORTED.
//
// Usage: node stardust/scripts/import-article.mjs <source-index.html> <slug> <out.html>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';

const [src, slug, out] = process.argv.slice(2);
if (!src || !slug || !out) {
  console.error('usage: import-article.mjs <source-index.html> <slug> <out.html>');
  process.exit(2);
}
const SITE = 'https://www.jackzhaojin.com';
const MEDIA = `https://content.da.live/jackzhaojin/www-eds/media/writing/${slug}`;
const $ = cheerio.load(fs.readFileSync(src, 'utf8'), { decodeEntities: false });
const base = `${SITE}/writing/${slug}/`;
const unsupported = [];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const absHref = (h) => {
  if (!h) return h;
  if (h.startsWith('#')) return h;
  return new URL(h, base).href;
};
const img = (el) => {
  const $el = $(el);
  const file = path.basename($el.attr('src').split('?')[0]);
  return `<img src="${MEDIA}/${file}" alt="${esc($el.attr('alt') || '')}">`;
};

// Inline content: keep a, code, strong/b, em/i, br; drop presentational spans (their text stays).
function inline(node) {
  let html = '';
  $(node).contents().each((_, c) => {
    if (c.type === 'text') {
      html += esc(c.data);
      return;
    }
    if (c.type !== 'tag') return;
    const tag = c.name;
    const inner = inline(c);
    if (tag === 'a') html += `<a href="${esc(absHref($(c).attr('href')))}">${inner}</a>`;
    else if (tag === 'code') html += `<code>${inner}</code>`;
    else if (tag === 'strong' || tag === 'b') html += `<strong>${inner}</strong>`;
    else if (tag === 'em' || tag === 'i') html += `<em>${inner}</em>`;
    else if (tag === 'br') html += '<br>';
    else if (tag === 'img') html += img(c);
    else html += inner;
  });
  return html;
}
const text = (node) => $(node).text();
const block = (name, rows) => `<div class="${name}">${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}</div>`;
const sectionMeta = (pairs) => block('section-metadata', pairs.map(([k, v]) => [`<p>${k}</p>`, `<p>${v}</p>`]));

// The source's per-article CSS that changes a shared component (read once per article).
const srcCss = (() => {
  const f = path.join(path.dirname(src), 'explainer.css');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
})();
const codeWraps = /\.code \.bar > a\s*\{[^}]*white-space:\s*nowrap/.test(srcCss);
const tableNowrap = /td:last-child[^{]*\{[^}]*white-space:\s*nowrap/.test(srcCss);
const codePlainWraps = /\.code-plain\s*\{[^}]*white-space:\s*pre-wrap/.test(srcCss);
const compareTouch = /\.cmp__tabs button\s*\{[^}]*min-height:\s*44px/.test(srcCss);
const shotSlim = /\.shot--narrow\s*\{\s*max-width:\s*460px/.test(srcCss);
const codeBarsStack = /\.code \.bar,[^{]*\.lab__bar\s*\{[^}]*flex-direction:\s*column/.test(srcCss);
const codePlainWrapsWide = /min-width:\s*641px\)\s*\{[^{}]*\.code-plain[^{]*\{[^}]*pre-wrap/.test(srcCss);
const roomyH3 = /\.article-body > h3\s*\{[^}]*margin-top:\s*var\(--space-7\)/.test(srcCss);
const boardCompact = /\.board--narrow\s*\{\s*max-width:\s*560px/.test(srcCss);
const tableStacks = (cls) => new RegExp(`max-width:\\s*560px\\)\\s*\\{\\s*\\.${cls} thead\\s*\\{\\s*display:\\s*none`).test(srcCss);

function codeText($pre) {
  const lines = $pre.find('.ln');
  if (!lines.length) return $pre.text();
  // Some sources end each line span with its own newline; the join adds the only one.
  const text = lines.map((_, l) => $(l).text().replace(/\n$/, '')).get();
  // The delivery pipeline trims a code block's trailing empty line; a no-break space keeps it.
  if (text.length && text[text.length - 1] === '') text[text.length - 1] = '\u00a0';
  return text.join('\n');
}

function dataTable(el) {
  const $t = $(el).is('table') ? $(el) : $(el).find('table').first();
  const cellHtml = (c) => (inline(c).trim() ? `<p>${inline(c)}</p>` : '');
  const rows = $t.find('tr').map((_, tr) => [$(tr).children('th, td').map((__, c) => cellHtml(c)).get()]).get();
  const look = ['cheat', 'rank'].find((cls) => $t.hasClass(cls));
  // The caption is the block's last row; a merged last cell is a short row (the block spans it).
  const caption = $t.children('caption').first();
  let captionWord = '';
  if (caption.length) {
    captionWord = caption.hasClass('sr-only') ? 'sr-caption' : 'caption';
    rows.push([`<p>${inline(caption)}</p>`]);
  }
  const rowHeads = $t.find('tbody th[scope="row"]').length > 0;
  const fillIn = $t.hasClass('relay-matrix');
  // A first-column cell that spans rows: the covered rows come out one cell short.
  const spanFirst = $t.find('tbody tr > :first-child[rowspan]').length > 0;
  const words = ['data-table', tableNowrap && 'nowrap', look, look && tableStacks(look) && 'stack', captionWord, rowHeads && 'row-heads', fillIn && 'fill-in', spanFirst && 'span-first'];
  return block(words.filter(Boolean).join(' '), rows);
}

function figure(el) {
  const $el = $(el);
  if ($el.hasClass('shot') || $el.hasClass('page')) {
    let narrow = '';
    if ($el.hasClass('shot--narrow')) narrow = shotSlim ? ' slim' : ' narrow';
    const kind = $el.hasClass('page') ? 'page' : `shot${narrow}`;
    const cap = $el.find('figcaption');
    return block(`figure ${kind}`, [[`<p>${img($el.find('img'))}</p>${cap.length ? `<p>${inline(cap)}</p>` : ''}`]]);
  }
  if ($el.hasClass('video')) {
    const frame = $el.find('iframe');
    const id = /embed\/([\w-]{11})/.exec(frame.attr('src'))[1];
    const title = (frame.attr('title') || '').replace(/ \(YouTube video\)$/, '');
    const cap = $el.find('figcaption');
    return block('figure', [[`<p><a href="https://youtu.be/${id}">${esc(title)}</a></p>${cap.length ? `<p>${inline(cap)}</p>` : ''}`]]);
  }
  if ($el.hasClass('code')) {
    const bar = $el.find('.bar');
    const label = bar.find('span').first();
    const link = bar.find('a').first();
    const prose = $el.find('.ln').length && $el.find('.ln').length === $el.find('.ln.md').length;
    const words = ['code', codeWraps && 'wrap', (prose || $el.hasClass('code--wrap')) && 'prose', $el.hasClass('code--prose') && 'plain', codeBarsStack && 'stack'];
    return block(words.filter(Boolean).join(' '), [
      [`<p>${inline(label)}</p><p><a href="${esc(absHref(link.attr('href')))}">${inline(link)}</a></p>`],
      [`<pre><code>${esc(codeText($el.find('pre')))}</code></pre>`],
    ]);
  }
  if ($el.hasClass('board')) {
    const cap = $el.find('figcaption');
    const link = $el.find('img').first().parent('a');
    const compact = boardCompact && $el.hasClass('board--narrow');
    const tall = $el.hasClass('fig--tall') && /\.fig--tall img\s*\{[^}]*560px/.test(srcCss);
    const words = ['figure board', compact && 'compact', tall && 'tall', $el.hasClass('fig--native') && 'native', link.length && 'open'].filter(Boolean).join(' ');
    const title = link.attr('title') ? ` title="${esc(link.attr('title'))}"` : '';
    const image = img($el.find('img').not('.board__next').first());
    const media = link.length ? `<a href="${/src="([^"]+)"/.exec(image)[1]}"${title}>${image}</a>` : image;
    // A board split in two: the second half is its own image paragraph, before the caption.
    const next = $el.find('img.board__next').map((_, i) => `<p>${img($(i))}</p>`).get().join('');
    return block(words, [[`<p>${media}</p>${next}${cap.length ? `<p>${inline(cap)}</p>` : ''}`]]);
  }
  if ($el.hasClass('bp')) return switchBlock($el);
  unsupported.push(`figure.${($el.attr('class') || '').replace(/ /g, '.')}`);
  return '';
}

function compare(el) {
  const $el = $(el);
  const tabs = $el.find('[role="tab"]');
  const rows = $el.find('.cmp__pane').map((i, pane) => {
    const $p = $(pane);
    const cap = $p.find('figcaption');
    return [[`<p>${inline(tabs.eq(i))}</p>`, `<p>${img($p.find('img'))}</p>${cap.length ? `<p>${inline(cap)}</p>` : ''}`]];
  }).get();
  const words = ['compare', $el.hasClass('cmp--narrow') && 'narrow', compareTouch && 'touch'].filter(Boolean);
  return block(words.join(' '), rows);
}

// Code marks from the source's highlight spans, in document order.
function marks($pre) {
  const items = [];
  $pre.find('span').each((_, s) => {
    const cls = $(s).attr('class') || '';
    let kind = null;
    if (cls.includes('t-bar')) kind = 'mark';
    else if (cls.includes('t-add')) kind = 'add';
    else if (cls.includes('t-note')) kind = 'note';
    if (kind) items.push(`<li>${kind}: ${esc($(s).text())}</li>`);
  });
  return items.length ? `<ul>${items.join('')}</ul>` : '';
}

function switchBlock($el) {
  const options = $el.find('[role="radio"]');
  const groupName = $el.find('[role="radiogroup"]').attr('aria-label');
  const named = groupName ? [[`<p>${esc(groupName)}</p>`]] : [];
  const rows = $el.find('.bp__mode').map((i, mode) => {
    const cols = $(mode).find('.bp__grid > div').map((_, col) => {
      let html = '';
      $(col).children().each((__, c) => {
        const $c = $(c);
        if ($c.is('p.bp__label')) html += `<p>${inline(c)}</p>`;
        else if ($c.is('pre')) html += `<pre><code>${esc($c.text())}</code></pre>${marks($c)}`;
        else if ($c.is('.bp__shot')) html += `<p>${img($c.find('img'))}</p>`;
        else if ($c.is('.bp__console')) html += `<p>${$c.find('span').map((___, s) => esc($(s).text())).get().join('<br>')}</p>`;
        else if ($c.is('p')) html += `<p>${inline(c)}</p>`;
        else unsupported.push(`bp child ${c.name}.${$c.attr('class')}`);
      });
      return html;
    }).get();
    return [[`<p>${inline(options.eq(i))}</p>`, ...cols]];
  }).get();
  const cap = $el.children('figcaption');
  if (cap.length) rows.push([`<p>${inline(cap)}</p>`]);
  return block('switch', [...named, ...rows]);
}

function lab(el) {
  const $l = $(el).find('[data-lab]').length ? $(el).find('[data-lab]') : $(el);
  const bar = $l.find('.lab__bar');
  const left = $l.find('.lab__left');
  const right = $l.find('.lab__right');
  const chips = left.find('.chips button').map((_, b) => `<li>${inline(b)}</li>`).get().join('');
  const labels = left.children('.lab__label');
  const leftHtml = `<ul>${chips}</ul><p>${inline(labels.eq(0))}</p><p>${esc(left.find('[data-token]').text().trim())}</p><p>${inline(labels.eq(1))}</p><pre><code>${esc(left.find('[data-decoded]').text())}</code></pre>`;
  const keys = right.find('.keys');
  const row = keys.find('.keys__row');
  const parts = row.children().map((_, c) => ($(c).is('b') ? `<strong><code>${esc($(c).text())}</code></strong>` : `<code>${esc($(c).text())}</code>`)).get();
  const gates = right.find('.gates li').map((_, li) => `<li><strong>${esc($(li).find('b').text())}</strong> ${esc($(li).find('div > span').first().text())}</li>`).get().join('');
  const rightHtml = `<p>${inline(keys.find('.lab__label'))}</p><p>${parts.join(' ')}</p><p>${inline(keys.find('.keys__note'))}</p><ol>${gates}</ol><p>${inline(right.find('.lab__static'))}</p>`;
  return block('lab token', [
    [`<p>${inline(bar.find('span').first())}</p><p><a href="${esc(absHref(bar.find('a').attr('href')))}">${inline(bar.find('a'))}</a></p>`],
    [leftHtml, rightHtml],
  ]);
}

function related(el) {
  const $r = $(el);
  const rows = $r.find('.row-list li').map((_, li) => {
    const $li = $(li);
    return [[`<p>${inline($li.find('.row-list__kind'))}</p>`, `<p>${inline($li.find('.row-list__title'))}</p>`, `<p>${inline($li.find('.row-list__note'))}</p>`]];
  }).get();
  const box = $r.find('.author-box');
  const author = block('author-box', [[`<p>${esc(box.find('.avatar').text())}</p>`,
    `<p>${inline(box.find('.author-box__name'))}</p><p>${inline(box.find('.author-box__role'))}</p><p>${box.find('.author-box__links a').map((__, a) => `<a href="${esc(absHref($(a).attr('href')))}">${inline(a)}</a>`).get().join(' ')}</p>`]]);
  return `<h2>${inline($r.children('h2'))}</h2>${block('row-list', rows)}${author}${sectionMeta([['style', 'related']])}`;
}

// ---- engines
const here = path.dirname(fileURLToPath(import.meta.url));
const engineDir = path.join(here, 'import-engines');
const engines = [];
if (fs.existsSync(engineDir)) {
  for (const f of fs.readdirSync(engineDir).filter((x) => x.endsWith('.mjs')).sort()) {
    // Only modules with the engine contract load: a standalone script here would run on import.
    const code = fs.readFileSync(path.join(engineDir, f), 'utf8');
    if (!/export\s+(?:async\s+)?(?:function|const|let)\s+match\b/.test(code)) continue;
    // eslint-disable-next-line no-await-in-loop
    const mod = await import(pathToFileURL(path.join(engineDir, f)).href);
    engines.push({ name: f.replace(/\.mjs$/, ''), ...mod });
  }
}
const helpers = {
  esc, absHref, img, inline, text, block, sectionMeta, codeText, MEDIA, SITE, slug,
};
function viaEngine(el) {
  const hit = engines.find((e) => e.match && e.match($, el));
  return hit ? hit.convert($, el, helpers) : null;
}

// ---- head
const head = $('.article-head');
const crumbs = head.find('.breadcrumb li').map((_, li) => `<li>${inline(li)}</li>`).get().join('');
const sections = [];
// A series nav ends the head: its label and accessible name, then one link per part.
const series = head.find('nav.series');
const seriesRows = series.find('li a').map((_, a) => {
  const $a = $(a);
  const part = $a.children('b').first().text();
  const title = $a.clone().children('b').remove().end().text();
  return [[`<p><a href="${esc(absHref($a.attr('href')))}"><strong>${esc(part)}</strong>${esc(title)}</a></p>`]];
}).get();
const seriesBlock = series.length
  ? block('series', [[`<p>${esc(series.find('.series__label').text())}</p>`, `<p>${esc(series.attr('aria-label') || '')}</p>`], ...seriesRows])
  : '';
sections.push(`<ol>${crumbs}</ol><h1>${esc(text(head.find('h1')))}</h1><p>${inline(head.find('.byline'))}</p><p>${inline(head.find('.summary'))}</p>${seriesBlock}`);

// ---- rail
const railRows = $('.rail__list li').map((_, li) => {
  const $li = $(li);
  const a = $li.find('a');
  const thumb = $li.find('img');
  return [[thumb.length ? `<p>${img(thumb)}</p>` : '', `<p><strong>${esc($li.find('.rail__num').text())}</strong><br><a href="${esc(a.attr('href'))}">${esc($li.find('.rail__title').text())}</a></p>`]];
}).get();
const railLinks = $('.rail__links a').map((_, a) => `<p><a href="${esc(absHref($(a).attr('href')))}">${inline(a)}</a></p>`).get().join('');
if (railLinks) railRows.push([railLinks]);
sections.push(block('rail', railRows));

// ---- body: a new section at each h2 with an id, at the video, and before related
let current = [];
let currentMeta = [];
const addStyle = (word) => {
  const style = currentMeta.find(([k]) => k === 'style');
  if (!style) currentMeta.push(['style', word]);
  else if (!style[1].split(', ').includes(word)) style[1] += `, ${word}`;
};
const flush = () => {
  if (current.length) sections.push(current.join('') + (currentMeta.length ? sectionMeta(currentMeta) : ''));
  current = [];
  currentMeta = [];
};
function convert(el) {
  const $el = $(el);
  const tag = el.name;
  const engined = viaEngine(el);
  if (engined !== null) return engined;
  if (tag === 'p') return `<p>${inline(el)}</p>`;
  if (tag === 'h3' || tag === 'h4') return `<${tag}>${inline(el)}</${tag}>`;
  if (tag === 'ul' || tag === 'ol') return `<${tag}>${$el.children('li').map((__, li) => `<li>${inline(li)}</li>`).get().join('')}</${tag}>`;
  if (tag === 'pre') return `<pre><code>${esc($el.text())}</code></pre>`;
  if (tag === 'blockquote') return `<blockquote>${$el.children('p').map((__, p) => `<p>${inline(p)}</p>`).get().join('') || `<p>${inline(el)}</p>`}</blockquote>`;
  if (tag === 'table' || (tag === 'div' && $el.is('.table-wrap, .table-scroll') && $el.find('table').length && !$el.is('.mx-wrap'))) return dataTable(el);
  if (tag === 'figure') return figure(el);
  if (tag === 'div' && $el.is('[data-compare]')) return compare(el);
  if (tag === 'div' && $el.find('[data-lab]').length) return lab(el);
  if (tag === 'div' && $el.hasClass('wide') && $el.children().length === 1) return convert($el.children()[0]);
  unsupported.push(`${tag}.${($el.attr('class') || '').replace(/ /g, '.')}`);
  return '';
}

// A figure's id, also when a div.wide wraps the figure.
function targetId(el) {
  const $el = $(el);
  if ($el.attr('id')) return $el.attr('id');
  const only = $el.is('div.wide') && $el.children().length === 1 ? $el.children().first() : null;
  return only ? only.attr('id') : undefined;
}

$('.article-body').children().each((_, el) => {
  const $el = $(el);
  const tag = el.name;
  if (tag === 'h2') {
    flush();
    if ($el.attr('id')) currentMeta.push(['id', $el.attr('id')]);
    current.push(`<h2>${inline(el)}</h2>`);
  } else if (tag === 'figure' && $el.hasClass('video')) {
    flush();
    if ($el.attr('id')) currentMeta.push(['id', $el.attr('id')]);
    current.push(figure(el));
  } else if ((tag === 'figure' || tag === 'div') && targetId(el)) {
    // A link target in the column (#video, #explore) starts its own section, which keeps the id.
    flush();
    currentMeta.push(['id', targetId(el)]);
    current.push(tag === 'figure' && $el.hasClass('video') ? figure(el) : convert(el));
  } else if (tag === 'p' && $el.hasClass('article-facts')) {
    current.push(block('fine-print', [[`<p>${inline(el)}</p>`]]));
  } else if (tag === 'p' && $el.hasClass('watch')) {
    const links = $el.find('a').map((__, a) => `<a href="${esc(absHref($(a).attr('href')))}">${esc($(a).text())}</a>`).get().join(' ');
    current.push(`<p>${esc($el.find('.watch__label').text())} ${links}</p>`);
  } else if (tag === 'section' && $el.hasClass('article-related')) {
    flush();
    current.push(related(el));
  } else {
    if (tag === 'pre' && codePlainWraps) addStyle('code-wrap');
    if (tag === 'pre' && codePlainWrapsWide) addStyle('code-wrap-wide');
    if (tag === 'h3' && roomyH3) addStyle('roomy-h3');
    current.push(convert(el));
  }
});
flush();

// ---- metadata
const meta = (n) => $(`meta[name="${n}"], meta[property="${n}"]`).attr('content') || '';
const ogImage = meta('og:image');
const metaRows = [
  ['title', esc($('title').text())],
  ['description', esc(meta('description'))],
  ['template', 'article'],
];
const keep = $('.article-head h1 .nowrap').map((_, e) => $(e).text()).get();
if (keep.length) metaRows.push(['title-keep-together', esc(keep.join(', '))]);
const keepHeads = [...new Set($('.article-body > h2 .nowrap').map((_, e) => $(e).text()).get())];
if (keepHeads.length) metaRows.push(['heading-keep-together', esc(keepHeads.join(', '))]);
// Page look words (body classes through the theme metadata).
const themeWords = [/\.article-body > p code[^{]*\{[^}]*white-space:\s*nowrap/.test(srcCss) && 'code-nowrap'].filter(Boolean);
if (themeWords.length) metaRows.push(['theme', themeWords.join(', ')]);
if (ogImage) metaRows.push(['image', `${img($(`<img src="${ogImage}" alt="${esc(meta('og:image:alt'))}">`)[0])}`]);
if (meta('og:image:alt')) metaRows.push(['image:alt', esc(meta('og:image:alt'))]);
if (meta('article:published_time')) metaRows.push(['published-time', meta('article:published_time')]);
if (meta('article:modified_time')) metaRows.push(['modified-time', meta('article:modified_time')]);
sections[sections.length - 1] += block('metadata', metaRows.map(([k, v]) => [`<p>${k}</p>`, `<p>${v}</p>`]));

const html = `<body>\n  <header></header>\n  <main>\n${sections.map((s) => `    <div>${s}</div>`).join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`import-article: ${sections.length} sections -> ${out}`);
if (unsupported.length) console.log(`UNSUPPORTED: ${unsupported.join(', ')}`);
