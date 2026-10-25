#!/usr/bin/env node
// Imports the design system v3 docs page (jackzhaojin.github.io/design-systems/v3/index.html)
// into an Experience Workspace document for the design-docs template. Every story becomes a
// live block instance (or the default content and section bands it documents); markup
// samples stay static <pre><code> blocks. Text is carried verbatim; links stay absolute to
// www.jackzhaojin.com (in-page #anchors stay as they are).
//
// Section vocabulary (section metadata, read by templates/design-docs):
//   style outline              the "On this page" outline (the first section)
//   id <x>, style docs         a docs section starts (#overview, #color ...)
//   id <c-x>, style component  a component starts (#c-faq ...)
//   style story[, row]         a story frame; its first paragraph is the label
//   style <band words>, in-story  a band shown inside the story frame before it
//   theme dark|light           the story's forced theme (data-theme on the section)
//   demo <word>                a docs-only demo the template draws from the authored text:
//                              swatches, specimens, space, radius, shadow, motion, icons,
//                              grid-2, grid-3, grid-4, grid-auto, skip-link
//   check contrast             the contrast table the template re-verifies in the browser
//   waiting <stream: block>    a story whose block another stream is still building; its
//                              text is authored as default content until then
// Sections with none of these continue the flow of the docs section or component before them.
//
// Usage: node stardust/scripts/import-design-system.mjs <source index.html> <out.html>
import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const [src, out] = process.argv.slice(2);
if (!src || !out || src === '--help' || src === '-h') {
  console.error('usage: import-design-system.mjs <source design-systems/v3/index.html> <out.html>');
  console.error('Writes: <out.html> (DA HTML for /design-systems/v3/index); prints a summary.');
  process.exit(src === '--help' || src === '-h' ? 0 : 2);
}

const SITE = 'https://www.jackzhaojin.com';
const BASE = `${SITE}/design-systems/v3/`;
const MEDIA = 'https://content.da.live/jackzhaojin/www-eds/media/design-systems/v3';
const $ = cheerio.load(fs.readFileSync(src, 'utf8'));

// ------------------------------------------------------------------ helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const absHref = (h) => {
  if (!h || h.startsWith('#')) return h;
  return new URL(h, BASE).href;
};
const img = (el) => {
  const file = path.basename($(el).attr('src').split('?')[0]);
  return `<img src="${MEDIA}/${file}" alt="${attr($(el).attr('alt') || '')}">`;
};

/** Inline content: keeps a, code, strong/b, em/i, br and img; other tags keep only their text. */
function inline(node) {
  let html = '';
  $(node).contents().each((_, c) => {
    if (c.type === 'text') {
      html += esc(c.data);
      return;
    }
    if (c.type !== 'tag') return;
    const tag = c.name;
    if (tag === 'svg' || tag === 'script' || tag === 'style') return;
    const inner = inline(c);
    if (tag === 'a') {
      const href = $(c).attr('href');
      html += href ? `<a href="${attr(absHref(href))}">${inner}</a>` : inner;
    } else if (tag === 'code') html += `<code>${inner}</code>`;
    else if (tag === 'strong' || tag === 'b') html += `<strong>${inner}</strong>`;
    else if (tag === 'em' || tag === 'i') html += inner.trim() ? `<em>${inner}</em>` : '';
    else if (tag === 'br') html += '<br>';
    else if (tag === 'img') html += img(c);
    else html += inner;
  });
  return html;
}
const squash = (html) => html.replace(/\s+/g, ' ').trim();
const p = (html) => `<p>${squash(html)}</p>`;
const block = (name, rows) => `<div class="${name}">${rows.map((cells) => `<div>${cells.map((c) => `<div>${c}</div>`).join('')}</div>`).join('')}</div>`;
const sectionMeta = (pairs) => block('section-metadata', pairs.map(([k, v]) => [`<p>${k}</p>`, `<p>${esc(v)}</p>`]));

function list(el) {
  const tag = el.name === 'ol' ? 'ol' : 'ul';
  const items = $(el).children('li').map((_, li) => {
    const nested = $(li).children('ul, ol').toArray();
    const $copy = $(li).clone();
    $copy.children('ul, ol').remove();
    return `<li>${squash(inline($copy))}${nested.map(list).join('')}</li>`;
  }).get();
  return `<${tag}>${items.join('')}</${tag}>`;
}

function pre(el) {
  return `<pre><code>${esc($(el).text())}</code></pre>`;
}

/** A v3 table as a data-table block; its caption (shown or sr-only) as the paragraph before. */
function dataTable(el) {
  const $t = $(el).is('table') ? $(el) : $(el).find('table').first();
  const caption = $t.children('caption').text().trim();
  const spans = [];
  const rows = [];
  $t.find('tr').each((ri, tr) => {
    const cells = [];
    let col = 0;
    const take = () => {
      while (spans[col] && spans[col].left > 0) {
        spans[col].left -= 1;
        cells.push('');
        col += 1;
      }
    };
    $(tr).children('th, td').each((_, c) => {
      take();
      const rs = Number($(c).attr('rowspan') || 1);
      if (rs > 1) spans[col] = { left: rs - 1 };
      cells.push(p(inline(c)));
      col += 1;
    });
    take();
    rows.push(cells);
    return ri;
  });
  return `${caption ? p(esc(caption)) : ''}${block('data-table', rows)}`;
}

/** Flattens any story markup to default content: lists stay lists, inline runs paragraphs. */
function flatten(el) {
  let html = '';
  let run = '';
  const flush = () => {
    if (squash(run)) html += p(run);
    run = '';
  };
  $(el).contents().each((_, c) => {
    if (c.type === 'text') {
      run += esc(c.data);
      return;
    }
    if (c.type !== 'tag') return;
    const tag = c.name;
    const $c = $(c);
    if ($c.hasClass('story__label') || tag === 'svg') return;
    if (/^h[1-6]$/.test(tag)) {
      flush();
      html += `<${tag}>${squash(inline(c))}</${tag}>`;
    } else if (tag === 'ul' || tag === 'ol') {
      flush();
      html += list(c);
    } else if (tag === 'pre') {
      flush();
      html += pre(c);
    } else if (tag === 'table') {
      flush();
      html += dataTable(c);
    } else if (tag === 'dl') {
      flush();
      $c.find('dt').each((__, dt) => {
        html += p(`${inline(dt)} ${inline($(dt).next('dd'))}`);
      });
    } else if (['p', 'figcaption', 'summary', 'caption', 'label', 'select'].includes(tag)) {
      flush();
      if (tag === 'select') html += p(esc($c.find('option[selected]').text() || $c.find('option').first().text()));
      else html += flatten(c);
    } else if (['div', 'section', 'article', 'aside', 'nav', 'figure', 'header', 'form', 'details', 'li'].includes(tag)) {
      flush();
      html += flatten(c);
    } else if (tag === 'img') {
      flush();
      html += p(img(c));
    } else {
      run += ` ${inline(c)} `;
    }
  });
  flush();
  return html;
}

// ------------------------------------------------------------------ sections
const sections = [];
let cur = null;
const open = (meta = []) => {
  cur = { meta, html: [] };
  sections.push(cur);
  return cur;
};
const metaOf = (s, key) => (s.meta.find(([k]) => k === key) || [])[1];
const isStory = (s) => /\b(story|in-story)\b/.test(metaOf(s, 'style') || '');
const flow = () => {
  if (!cur || isStory(cur) || metaOf(cur, 'demo') || metaOf(cur, 'check')) open([]);
  return cur;
};
// A demo opens its own section; a heading (and its note) right before it moves along, so the
// gap between them is the source's collapsed margin.
const demo = (word) => {
  if (!cur || metaOf(cur, 'demo') !== word || isStory(cur)) {
    let carry = [];
    if (cur && !isStory(cur) && !metaOf(cur, 'demo')) {
      const [prev, last] = cur.html.slice(-2);
      if (last && last.startsWith('<h4>')) carry = cur.html.splice(-1);
      else if (prev && last && prev.startsWith('<h4>') && last.startsWith('<p>')) carry = cur.html.splice(-2);
    }
    open([['demo', word]]).html.push(...carry);
  }
  return cur;
};
const storyCounts = {};
const waiting = [];

// ------------------------------------------------------------------ story converters
const label = (story) => p(esc($(story).children('.story__label').text().trim()));
const themeOf = (story) => $(story).attr('data-theme');
const storyMeta = (story, extra = []) => {
  const style = ['story'];
  if ($(story).hasClass('story--row')) style.push('row');
  const meta = [['style', style.join(', ')]];
  if (themeOf(story)) meta.push(['theme', themeOf(story)]);
  return [...meta, ...extra];
};
const linkPara = (a, mark) => {
  const href = $(a).attr('href');
  const text = squash(inline(a));
  if (!href) return p(mark ? `<${mark}>${text}</${mark}>` : text);
  const link = `<a href="${attr(absHref(href))}">${text}</a>`;
  return p(mark ? `<${mark}>${link}</${mark}>` : link);
};
const buttonPara = (el) => {
  const $el = $(el);
  if (el.name === 'button' || $el.attr('aria-disabled') === 'true') return p(squash(inline(el)));
  if ($el.hasClass('btn--primary')) return linkPara(el, 'strong');
  if ($el.hasClass('btn--secondary')) return linkPara(el, 'em');
  return linkPara(el);
};
const rowListRows = ($ol) => $ol.children('li').map((_, li) => {
  const $li = $(li);
  const kind = $li.children('time, .row-list__kind').first();
  const title = $li.children('.row-list__title').first();
  const note = $li.children('.row-list__note').first();
  return [[p(inline(kind)), p(inline(title)), p(inline(note))]];
}).get();

/** Text of a v3 cta-band as a cta-band block cell, in order. */
function ctaBand($band) {
  const parts = [];
  $band.children().each((_, c) => {
    const $c = $(c);
    if (/^h[1-6]$/.test(c.name)) parts.push(`<${c.name}>${squash(inline(c))}</${c.name}>`);
    else if ($c.hasClass('cta-band__title')) parts.push(p(`<strong>${squash(inline(c))}</strong>`));
    else if ($c.hasClass('cluster')) {
      $c.children().each((__, k) => {
        if (k.name === 'a') parts.push($(k).hasClass('btn') ? buttonPara(k) : linkPara(k));
        else parts.push(p(inline(k)));
      });
    } else if ($c.hasClass('cta-band__profiles')) {
      parts.push(p($c.children('a').map((__, a) => `<a href="${attr(absHref($(a).attr('href')))}">${squash(inline(a))}</a>`).get().join(' ')));
    } else parts.push(p(inline(c)));
  });
  return block('cta-band', [[parts.join('')]]);
}

/** A v3 band inside a story becomes its own section, shown in the story frame. */
function bandSection(band, story, inner) {
  const $b = $(band);
  const words = ['plain', 'alt', 'tint', 'inverse', 'milestone', 'dots']
    .filter((w) => $b.hasClass(`band--${w}`));
  const accent = ($b.attr('style') || '').match(/--color-(?:topic|project)-([a-z-]+)/);
  const style = [...words, ...(accent ? [accent[1]] : []), 'in-story'];
  const meta = [['style', style.join(', ')]];
  if (themeOf(story)) meta.push(['theme', themeOf(story)]);
  const s = open(meta);
  s.html.push(inner);
  return s;
}

const WAITING = {
  'c-site-header': null,
  'c-breadcrumb': 'hero (page)',
  'c-page-head': 'no instance yet: the post head is the article template head, and hero needs a real heading (the story keeps one h1)',
  'c-kicker': 'main: global kicker style',
  'c-chip': 'no chips block on main (chips live inside writing-list and the writing filter)',
  'c-card': 'portfolio: cards variants (link, hub, project, tool, rules)',
  'c-counts': 'portfolio: stats',
  'c-filter-bar': 'no instance: the site filter is the writing-filter widget over a writing-list (search, topic, year)',
  'c-embed': 'main: figure placeholder state (register candidate)',
  'c-showcase': 'portfolio: showcase flip, stat-chips, frame (and main: band accent words)',
  'c-frame': 'portfolio: frame',
  'c-proof-links': 'portfolio: proof-links',
  'c-stat': 'portfolio: stat-chips and stats',
  'c-chapter-head': 'portfolio: chapter-head',
  'c-timeline': 'portfolio: timeline',
  'c-proof': 'no block: the home hero note list has no label column',
  'c-panel-inverse': 'portfolio: panel',
  'c-divider': 'portfolio: divider',
  'c-icons': 'main: v3 icon set in icons/',
  theming: 'main: theme control outside the header',
};

function convertStory(story, owner) {
  const n = storyCounts[owner] || 0;
  storyCounts[owner] = n + 1;
  const $s = $(story);
  const kids = $s.children().not('.story__label');
  const first = kids.first();

  // grids (layout foundation)
  if (owner === 'layout') {
    const cls = first.attr('class') || '';
    const word = (cls.match(/grid--(\d)/) || [])[1];
    const s = open(storyMeta(story, [['demo', word ? `grid-${word}` : 'grid-auto']]));
    s.html.push(label(story), `<ul>${first.children('div').map((_, d) => `<li>${esc($(d).text())}</li>`).get().join('')}</ul>`);
    return;
  }
  if (owner === 'c-skip-link') {
    const s = open(storyMeta(story, [['demo', 'skip-link']]));
    s.html.push(label(story), linkPara(first.get(0)));
    return;
  }
  if (owner === 'c-site-header') {
    const s = open(storyMeta(story));
    s.html.push(label(story), block('header', [['']]));
    return;
  }
  if (owner === 'c-footer') {
    const s = open(storyMeta(story));
    s.html.push(label(story), block('footer', [['']]));
    return;
  }
  if (owner === 'c-button') {
    const s = open(storyMeta(story));
    s.html.push(label(story), ...kids.map((_, k) => buttonPara(k)).get());
    return;
  }
  if (owner === 'c-facts-table') {
    const $t = first;
    const rows = [[p(esc($t.children('caption').text().trim()))]];
    $t.find('tr').each((_, tr) => rows.push([p(inline($(tr).children('th'))), p(inline($(tr).children('td')))]));
    const s = open(storyMeta(story));
    s.html.push(label(story), block('facts', rows));
    return;
  }
  if (owner === 'c-data-table') {
    const s = open(storyMeta(story));
    s.html.push(label(story), dataTable(first));
    return;
  }
  if (owner === 'c-row-list') {
    const s = open(storyMeta(story));
    s.html.push(label(story), block('row-list', rowListRows(first)));
    return;
  }
  if (owner === 'c-faq') {
    const $f = first;
    const rows = [];
    const h = $f.children('h2, h3').first();
    if (h.length) rows.push([`<${h.get(0).name}>${squash(inline(h))}</${h.get(0).name}>`]);
    $f.children('details').each((_, d) => {
      const $d = $(d);
      const row = [p(inline($d.children('summary'))), $d.children('p, ul, ol').map((__, a) => (a.name === 'p' ? p(inline(a)) : list(a))).get().join('')];
      if ($d.attr('open') !== undefined) row.push(p('open'));
      rows.push(row);
    });
    const s = open(storyMeta(story));
    s.html.push(label(story), block('faq', rows));
    return;
  }
  if (owner === 'c-pagination') {
    const items = first.find('li').map((_, li) => {
      const a = $(li).find('a').first();
      const link = `<a href="${attr(absHref(a.attr('href')))}">${esc(a.text())}</a>`;
      return `<li>${a.attr('aria-current') === 'page' ? `<strong>${link}</strong>` : link}</li>`;
    }).get().join('');
    const s = open(storyMeta(story));
    s.html.push(label(story), block('pagination', [[`<ol>${items}</ol>`]]));
    return;
  }
  if (owner === 'c-chapters') {
    const rows = first.children('li').map((_, li) => {
      const $li = $(li).clone();
      const time = $li.children('time').text();
      $li.children('time').remove();
      return [[p(esc(time)), p(inline($li))]];
    }).get();
    const s = open(storyMeta(story));
    s.html.push(label(story), block('chapters', rows));
    return;
  }
  if (owner === 'c-transcript') {
    const $d = first;
    const $sum = $d.children('summary').clone();
    const note = $sum.children('span').text();
    $sum.children('span').remove();
    const body = $d.find('.transcript__body p').map((_, para) => p(esc($(para).text().replace(/^(\d+:\d{2})/, '$1 ')))).get().join('');
    const name = $d.attr('open') !== undefined ? 'transcript open' : 'transcript';
    const s = open(storyMeta(story));
    s.html.push(label(story), block(name, [[p(esc($sum.text().trim())), p(esc(note.trim()))], [body]]));
    return;
  }
  if (owner === 'c-author-box') {
    const $a = first;
    const body = $a.children('div').children('p').map((_, para) => {
      if ($(para).hasClass('author-box__links')) {
        return p($(para).children('a').map((__, a) => `<a href="${attr(absHref($(a).attr('href')))}">${squash(inline(a))}</a>`).get().join(' '));
      }
      return p(inline(para));
    }).get().join('');
    const s = open(storyMeta(story));
    s.html.push(label(story), block('author-box', [[p(esc($a.children('.avatar').text())), body]]));
    return;
  }
  if (owner === 'c-callout') {
    const s = open(storyMeta(story));
    s.html.push(label(story));
    first.children('aside').each((_, a) => {
      const $a = $(a);
      const name = $a.hasClass('callout--warn') ? 'callout warn' : 'callout';
      const lab = $a.children('.callout__label');
      const text = $a.children('p').not('.callout__label').map((__, para) => p(inline(para))).get().join('');
      s.html.push(block(name, [lab.length ? [p(esc(lab.text())), text] : [text]]));
    });
    return;
  }
  if (owner === 'c-breadcrumb') {
    // the hero's page variant: a list alone is the breadcrumb, its last item this page
    const items = first.find('li').map((_, li) => `<li>${squash(inline(li))}</li>`).get().join('');
    const s = open(storyMeta(story));
    s.html.push(label(story), block('hero page', [[`<ol>${items}</ol>`]]));
    return;
  }
  if (owner === 'c-cta-band') {
    const s = open(storyMeta(story));
    s.html.push(label(story), ctaBand(first));
    return;
  }
  if (owner === 'c-showcase' && n === 0) {
    const $t = first.children('.showcase__text');
    const text = [];
    $t.children().each((_, c) => {
      if (/^h[1-6]$/.test(c.name)) text.push(`<${c.name}>${squash(inline(c))}</${c.name}>`);
      else if ($(c).hasClass('proof-links')) $(c).children('a').each((__, a) => text.push(linkPara(a)));
      else text.push(p(inline(c)));
    });
    const $fig = first.find('.showcase__media figure');
    const media = `${p(inline($fig.children('a').length ? $fig.children('a') : $fig.children('img')))}${p(inline($fig.children('figcaption')))}`;
    const s = open(storyMeta(story));
    s.html.push(label(story), block('showcase', [[text.join(''), media]]));
    return;
  }
  if (owner === 'c-band') {
    const s = open(storyMeta(story));
    s.html.push(label(story));
    const bands = first.is('section.band') ? first.toArray() : first.children('section.band').toArray();
    bands.forEach((band) => {
      const $b = $(band);
      if ($b.hasClass('band--milestone')) waiting.push(`${owner} #${n + 1}: milestone band (listings: divider year, or main: band word milestone)`);
      if ($b.hasClass('band--dots')) waiting.push(`${owner} #${n + 1}: dots band (main: band word dots)`);
      if (/--color-(topic|project)-/.test($b.attr('style') || '')) waiting.push(`${owner} #${n + 1}: band accent word (main: section accent words)`);
      const $c = $b.children('.container');
      const ctas = $c.children('.cta-band');
      const inner = ctas.length ? ctaBand(ctas) : flatten($c);
      bandSection(band, story, inner);
    });
    return;
  }

  // waiting: the text as default content until the block lands
  const why = WAITING[owner] || 'unmapped';
  waiting.push(`${owner} #${n + 1}: ${why}`);
  const bands = first.is('section.band') ? first.toArray() : [];
  if (bands.length) {
    const s = open(storyMeta(story, [['waiting', why]]));
    s.html.push(label(story));
    bandSection(bands[0], story, flatten($(bands[0]).children('.container')));
    return;
  }
  const s = open(storyMeta(story, [['waiting', why]]));
  s.html.push(label(story), flatten(story));
}

// ------------------------------------------------------------------ docs flow
function convertDemo(el) {
  const $el = $(el);
  if ($el.hasClass('swatches')) {
    const items = $el.children('.swatch').map((_, sw) => `<li>${esc($(sw).find('.swatch__name').text())}<br>${esc($(sw).find('.swatch__value').text())}</li>`).get();
    demo('swatches').html.push(`<ul>${items.join('')}</ul>`);
  } else if ($el.hasClass('specimen')) {
    demo('specimens').html.push(p(inline($el.children('.specimen__meta'))), p(inline($el.children('.specimen__sample'))));
  } else if ($el.hasClass('space-scale')) {
    demo('space').html.push(`<ul>${$el.children('div').map((_, d) => `<li>${esc($(d).text().trim())}</li>`).get().join('')}</ul>`);
  } else if ($el.hasClass('radius-demo') || $el.hasClass('shadow-demo')) {
    const word = $el.hasClass('radius-demo') ? 'radius' : 'shadow';
    demo(word).html.push(`<ul>${$el.children('div').map((_, d) => `<li>${esc($(d).text().trim())}</li>`).get().join('')}</ul>`);
  } else if ($el.hasClass('motion-demo')) {
    demo('motion').html.push(p(esc($el.text().trim())));
  } else if ($el.hasClass('icon-grid')) {
    waiting.push('iconography grid: main: v3 icon set in icons/');
    demo('icons').html.push(`<ul>${$el.children('div').map((_, d) => `<li>${esc($(d).text().trim())}</li>`).get().join('')}</ul>`);
  } else return false;
  return true;
}

function convertDoDont(el) {
  const s = flow();
  $(el).children('div').each((_, d) => {
    $(d).children('p').each((__, para) => s.html.push(p(inline(para))));
  });
}

function walk(container, owner) {
  $(container).children().each((_, el) => {
    const $el = $(el);
    const tag = el.name;
    if ($el.hasClass('story')) {
      convertStory(el, owner);
    } else if ($el.hasClass('component')) {
      open([['id', $el.attr('id')], ['style', 'component']]);
      walk(el, $el.attr('id'));
    } else if ($el.hasClass('component__head')) {
      flow().html.push(`<h3>${squash(inline($el.children('h3')))}</h3>`, p(esc($el.children('.chip').text().trim())));
    } else if ($el.hasClass('do-dont')) {
      convertDoDont(el);
    } else if (convertDemo(el)) {
      // drawn by the template
    } else if (cur && metaOf(cur, 'demo') && (tag === 'h4' || tag === 'p')
      && /^(swatches|specimens)$/.test(metaOf(cur, 'demo'))) {
      cur.html.push(tag === 'p' ? p(inline(el)) : `<h4>${squash(inline(el))}</h4>`);
    } else if ($el.find('table#contrast').length || $el.is('table#contrast')) {
      open([['check', 'contrast']]).html.push(dataTable(el));
    } else if (tag === 'p' && $el.attr('id') === 'contrastNote') {
      cur.html.push(p(inline(el)));
    } else if ($el.hasClass('table-wrap') || tag === 'table') {
      flow().html.push(dataTable(el));
    } else if ($el.hasClass('row-list')) {
      flow().html.push(block('row-list', rowListRows($el)));
    } else if (/^h[1-6]$/.test(tag)) {
      flow().html.push(`<${tag}>${squash(inline(el))}</${tag}>`);
    } else if (tag === 'p') {
      flow().html.push(p(inline(el)));
    } else if (tag === 'ul' || tag === 'ol') {
      flow().html.push(list(el));
    } else if (tag === 'pre') {
      flow().html.push(pre(el));
    } else {
      console.error(`UNSUPPORTED in ${owner}: <${tag} class="${$el.attr('class') || ''}">`);
    }
  });
}

// outline
const nav = $('.docs-nav');
open([['style', 'outline']]).html.push(p(esc(nav.children('.kicker').text().trim())), list(nav.children('ul').get(0)));

$('.docs-content > .docs-section').each((_, sec) => {
  open([['id', $(sec).attr('id')], ['style', 'docs']]);
  walk(sec, $(sec).attr('id'));
});

// page metadata
const meta = (n) => $(`meta[name="${n}"]`).attr('content') || '';
const pageMeta = block('metadata', [
  [p('title'), p(esc($('title').text().trim()))],
  [p('description'), p(esc(meta('description')))],
  [p('template'), p('design-docs')],
  [p('robots'), p(esc(meta('robots') || 'noindex'))],
]);

const html = sections.map((s, i) => {
  const last = i === sections.length - 1 ? pageMeta : '';
  const sm = s.meta.length ? sectionMeta(s.meta) : '';
  return `    <div>${s.html.join('')}${sm}${last}</div>`;
}).join('\n');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `<body>\n  <header></header>\n  <main>\n${html}\n  </main>\n  <footer></footer>\n</body>\n`);

const storiesTotal = Object.values(storyCounts).reduce((a, b) => a + b, 0);
console.log(`wrote ${out}: ${sections.length} sections, ${storiesTotal} stories, ${waiting.length} waiting`);
waiting.forEach((w) => console.log(`  waiting ${w}`));
