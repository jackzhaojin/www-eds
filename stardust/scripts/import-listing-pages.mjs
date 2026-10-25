#!/usr/bin/env node
// Imports the listing pages of the source site (jackzhaojin.github.io) into Experience
// Workspace documents: /writing/ (hero (writing), the writing-filter widget, writing-list),
// /talks/ (hero (talks), row-list (talks)), /certifications/ (hero (certifications),
// credentials) and /privacy/ (hero (page), prose). Text is carried verbatim; links stay
// absolute to www.jackzhaojin.com so localize-links can rewrite the ones that resolve on the
// new site. Images point at DA media (scopes writing and certifications); the media
// manifests for da-media-upload.mjs --manifest are written beside the work files.
//
// Usage: node stardust/scripts/import-listing-pages.mjs <source-root> <content-dir> <work-dir>
// Writes: <content-dir>/{writing,talks,certifications,privacy}/index.html and
//         <work-dir>/media-writing.json, <work-dir>/media-certifications.json
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const [srcRoot, contentDir, workDir] = process.argv.slice(2);
if (!srcRoot || !contentDir || !workDir) {
  console.error('usage: import-listing-pages.mjs <source-root> <content-dir> <work-dir>');
  process.exit(2);
}
const SITE = 'https://www.jackzhaojin.com';
const MEDIA = 'https://content.da.live/jackzhaojin/www-eds/media';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const load = (rel) => cheerio.load(fs.readFileSync(path.join(srcRoot, rel), 'utf8'), { decodeEntities: false });
const text = ($, el) => cheerio.load($(el).html() || '', null, false).text().replace(/\s+/g, ' ').trim();
const decode = (s) => cheerio.load(`<p>${s}</p>`, null, false).text();
const absHref = (h, base) => (!h || h.startsWith('#') ? h : new URL(h, base).href);

// Inline content: a, strong, em, code, br; presentational spans keep their text.
function inline($, node, base) {
  let html = '';
  $(node).contents().each((_, c) => {
    if (c.type === 'text') {
      html += esc(decode(c.data));
      return;
    }
    if (c.type !== 'tag') return;
    const inner = inline($, c, base);
    if (c.name === 'a') html += `<a href="${esc(absHref($(c).attr('href'), base))}">${inner}</a>`;
    else if (c.name === 'strong' || c.name === 'b') html += `<strong>${inner}</strong>`;
    else if (c.name === 'em' || c.name === 'i') html += `<em>${inner}</em>`;
    else if (c.name === 'code') html += `<code>${inner}</code>`;
    else if (c.name === 'br') html += '<br>';
    else if ($(c).hasClass('sr-only')) html += '';
    else html += inner;
  });
  return html.trim();
}

const block = (name, rows) => `<div class="${name}">${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}</div>`;
const sectionMeta = (pairs) => block('section-metadata', pairs.map(([k, v]) => [`<p>${esc(k)}</p>`, `<p>${esc(v)}</p>`]));
const metadata = (pairs) => block('metadata', pairs.filter(([, v]) => v).map(([k, v]) => [`<p>${esc(k)}</p>`, `<p>${esc(v)}</p>`]));
const page = (sections) => `<body>\n  <header></header>\n  <main>\n${sections.map((s) => `    <div>${s}</div>\n`).join('')}  </main>\n  <footer></footer>\n</body>\n`;

function headMeta($, template) {
  return metadata([
    ['title', decode($('head > title').text())],
    ['description', decode($('head > meta[name="description"]').attr('content') || '')],
    ['robots', $('head > meta[name="robots"]').attr('content') || ''],
    ['template', template],
  ]);
}

// The source hero: breadcrumb list, page title, summary and any further paragraphs.
function hero($, variant, base) {
  const $h = $('main > header').first();
  const crumbs = $h.find('.breadcrumb li').map((_, li) => {
    const a = $(li).children('a');
    return a.length ? `<li><a href="${esc(absHref(a.attr('href'), base))}">${inline($, a, base)}</a></li>` : `<li>${inline($, li, base)}</li>`;
  }).get().join('');
  const parts = [`<ol>${crumbs}</ol>`, `<h1>${inline($, $h.find('h1'), base)}</h1>`];
  $h.find('.page-head > p').each((_, p) => parts.push(`<p>${inline($, p, base)}</p>`));
  return block(`hero ${variant}`, [[parts.join('')]]);
}

const write = (rel, html) => {
  const out = path.join(contentDir, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`wrote ${out}`);
};

// ------------------------------------------------------------ /writing/
function writing() {
  const base = `${SITE}/writing/`;
  const $ = load('writing/index.html');
  const media = [];
  const rows = $('ol.writing-list > li').map((_, li) => {
    const $li = $(li);
    const $r = $li.find('article.writing-row');
    const href = $r.find('.writing-row__link').attr('href');
    const slug = href.split('/').filter(Boolean).pop();
    const date = text($, $r.find('.writing-row__date'));
    const tags = $r.find('.writing-tags .chip').map((__, c) => `<li>${esc(text($, c))}</li>`).get().join('');
    const facts = $r.find('.writing-row__facts > span').map((__, s) => `<li>${esc(text($, s))}</li>`).get().join('');
    const meta = `<p>${esc(date)}</p><ul>${tags}</ul><ul>${facts}</ul>`;

    const body = [`<h2><a href="${esc(absHref(href, base))}">${inline($, $r.find('.writing-row__link'), base)}</a></h2>`];
    body.push(`<p>${inline($, $r.find('.writing-row__summary'), base)}</p>`);
    const $talk = $r.find('.writing-row__talk');
    if ($talk.length) {
      const a = $talk.children('a');
      body.push(`<p><a href="${esc(absHref(a.attr('href'), base))}">${inline($, a, base)}</a></p>`);
      $talk.children('span').each((__, sp) => body.push(`<p>${inline($, sp, base)}</p>`));
    }
    $r.find('.writing-row__actions a').each((__, a) => body.push(`<p><a href="${esc(absHref($(a).attr('href'), base))}">${inline($, a, base)}</a></p>`));

    const src = $r.find('.writing-row__media img').attr('src');
    const name = `${slug}${path.extname(src)}`;
    media.push({ file: path.join(srcRoot, src.replace(/^\//, '')), name });
    const cover = `<p><img src="${MEDIA}/writing/${name}" alt=""></p>`;

    // Search terms beyond the visible text: the source's data-search after the title, summary,
    // topic labels, "video youtube" and the year (the filter adds those from the row).
    const search = decode($li.attr('data-search') || '');
    const pre = [text($, $r.find('h2')), text($, $r.find('.writing-row__summary')),
      ...$r.find('.writing-tags .chip').map((__, c) => text($, c)).get(),
      ...($r.find('.writing-row__has-video').length ? ['video youtube'] : [])].join(' ').toLowerCase();
    const year = ($li.attr('data-date') || '').slice(0, 4);
    let rest = search.startsWith(pre) ? search.slice(pre.length) : search;
    rest = ` ${rest} `.replace(` ${year} `, ' ').trim();
    if (!search.startsWith(pre)) console.warn(`writing: ${slug} search text does not start with the visible text`);
    const cells = [meta, body.join(''), cover];
    // Title runs the source keeps on one line (span.nowrap), title by title.
    const keep = $r.find('h2 .nowrap').map((__, n) => text($, n)).get();
    const hidden = [rest, keep.join(', ')].filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('');
    if (hidden) cells.push(hidden);
    return [cells];
  }).get();

  const $next = $('.writing-next');
  const sections = [
    hero($, 'writing', base),
    `<p><a href="${SITE}/widgets/writing-filter/writing-filter.html">${SITE}/widgets/writing-filter/writing-filter.html</a></p>${block('writing-list', rows)}${sectionMeta([['label', $('.writing-list-band').attr('aria-label')]])}`,
    `<h2>${inline($, $next.find('h2'), base)}</h2>${$next.find('p').map((_, p) => `<p>${inline($, p, base)}</p>`).get().join('')}${sectionMeta([['style', 'alt, note']])}${headMeta($, 'listing')}`,
  ];
  write('writing/index.html', page(sections));
  fs.writeFileSync(path.join(workDir, 'media-writing.json'), `${JSON.stringify(media, null, 2)}\n`);
}

// ------------------------------------------------------------ /talks/
function talks() {
  const base = `${SITE}/talks/`;
  const $ = load('talks/index.html');
  const rows = [];
  let aliases = [];
  $('.talk-list').children().each((_, el) => {
    const $el = $(el);
    if (el.name === 'span' && $el.attr('id')) {
      aliases.push($el.attr('id'));
      return;
    }
    if (!$el.hasClass('talk-row')) return;
    const date = `<p>${inline($, $el.find('.talk-date p'), base)}</p><p>${inline($, $el.find('.talk-date span'), base)}</p>`;
    const $b = $el.children('div').eq(1);
    const body = [`<h2>${inline($, $b.children('h2'), base)}</h2>`];
    $b.children('p').each((__, p) => body.push(`<p>${inline($, p, base)}</p>`));
    $b.find('.cluster').children().each((__, c) => {
      if (c.name === 'a') body.push(`<p><a href="${esc(absHref($(c).attr('href'), base))}">${inline($, c, base)}</a></p>`);
      else body.push(`<p>${inline($, c, base)}</p>`);
    });
    rows.push([date, body.join(''), `<p>${[$el.attr('id'), ...aliases].join(' ')}</p>`]);
    aliases = [];
  });
  const sections = [hero($, 'talks', base), `${block('row-list talks', rows)}${headMeta($, 'listing')}`];
  write('talks/index.html', page(sections));
}

// ------------------------------------------------------------ /certifications/
const rasterize = [];
function certifications() {
  const base = `${SITE}/certifications/`;
  const $ = load('certifications/index.html');
  const media = [];
  const groups = [];
  $('main > section.band--plain').each((_, band) => {
    groups.push('');
    $(band).find('.container').children().each((__, el) => {
      const $el = $(el);
      if (el.name === 'h2') groups[groups.length - 1] += `<h2>${inline($, el, base)}</h2>`;
      if ($el.hasClass('credential-list')) groups[groups.length - 1] += credentialList($el);
    });
  });
  function credentialList($el) {
    const rows = $el.children('.credential-row').map((__, r) => {
      const $r = $(r);
      const id = $r.attr('id');
      const src = $r.find('.credential-mark img').attr('src');
      let ext = (src.match(/\.(png|svg|jpe?g|webp)$/i) || [null, 'png'])[1].toLowerCase();
      const local = src.startsWith('/') ? path.join(srcRoot, src.replace(/^\//, '')) : null;
      // SVGs over the ~40 KB pipeline limit ship as a 340px PNG (the size Credly serves).
      if (local && ext === 'svg' && fs.statSync(local).size > 40000) {
        ext = 'png';
        rasterize.push([local, path.join(workDir, 'certifications', `${id}.png`)]);
      }
      const name = `${id}.${ext}`;
      if (local && !rasterize.some(([s]) => s === local)) media.push({ file: local, name });
      else if (local) media.push({ file: path.join(workDir, 'certifications', name), name });
      else media.push({ file: path.join(workDir, 'certifications', name), source: src, name });
      const mark = `<p>${esc(text($, $r.find('.credential-mark span')))}</p><p><img src="${MEDIA}/certifications/${name}" alt=""></p>`;
      const $body = $r.children('div').eq(1);
      const cells = [`<h3>${inline($, $body.children('h3'), base)}</h3>`];
      $body.children('p').each((___, p) => cells.push(`<p>${inline($, p, base)}</p>`));
      $body.children('a').each((___, a) => cells.push(`<p><a href="${esc(absHref($(a).attr('href'), base))}">${inline($, a, base)}</a></p>`));
      return [[mark, cells.join('')]];
    }).get();
    return block('credentials', rows);
  }
  const $alt = $('main > section.band--alt .container');
  const closing = [];
  $alt.children().each((_, el) => {
    if (el.name === 'a') closing.push(`<p><a href="${esc(absHref($(el).attr('href'), base))}">${inline($, el, base)}</a></p>`);
    else closing.push(`<${el.name}>${inline($, el, base)}</${el.name}>`);
  });
  const sections = [
    hero($, 'certifications', base),
    ...groups,
    `${closing.join('')}${sectionMeta([['style', 'alt']])}${headMeta($, 'listing')}`,
  ];
  write('certifications/index.html', page(sections));
  fs.writeFileSync(path.join(workDir, 'media-certifications.json'), `${JSON.stringify(media, null, 2)}\n`);
}

// ------------------------------------------------------------ /privacy/
function privacy() {
  const base = `${SITE}/privacy/`;
  const $ = load('privacy/index.html');
  const prose = $('main .prose').children().map((_, el) => {
    if (el.name === 'ul' || el.name === 'ol') {
      return `<${el.name}>${$(el).children('li').map((__, li) => `<li>${inline($, li, base)}</li>`).get().join('')}</${el.name}>`;
    }
    return `<${el.name}>${inline($, el, base)}</${el.name}>`;
  }).get().join('');
  write('privacy/index.html', page([hero($, 'page', base), `${prose}${headMeta($, 'static')}`]));
}

async function rasterizeAll() {
  if (!rasterize.length) return;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: 340, height: 340 } });
  for (const [src, out] of rasterize) {
    const data = fs.readFileSync(src).toString('base64');
    // eslint-disable-next-line no-await-in-loop
    await tab.setContent(`<body style="margin:0"><img style="display:block;width:340px;height:340px;object-fit:contain" src="data:image/svg+xml;base64,${data}"></body>`);
    // eslint-disable-next-line no-await-in-loop
    await tab.screenshot({ path: out, omitBackground: true });
    console.log(`rasterized ${out}`);
  }
  await browser.close();
}

fs.mkdirSync(path.join(workDir, 'certifications'), { recursive: true });
writing();
talks();
certifications();
privacy();
await rasterizeAll();
