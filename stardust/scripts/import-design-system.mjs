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

/**
 * A v3 table (.table) as data-table (mono-head), compact for .table--compact. The caption is
 * the last row (caption, or sr-caption when the source hides it). A row-header cell spanning
 * rows (th rowspan) leaves the rows under it one cell short (span-first, row-heads).
 */
function dataTable(el) {
  const $t = $(el).is('table') ? $(el) : $(el).find('table').first();
  const $cap = $t.children('caption');
  const caption = $cap.text().trim();
  const rows = [];
  let spanned = false;
  $t.find('tr').each((ri, tr) => {
    const cells = [];
    $(tr).children('th, td').each((_, c) => {
      if (Number($(c).attr('rowspan') || 1) > 1) spanned = true;
      cells.push(p(inline(c)));
    });
    rows.push(cells);
    return ri;
  });
  const variants = ['mono-head'];
  if ($t.hasClass('table--compact')) variants.push('compact');
  if (spanned) variants.push('span-first', 'row-heads');
  if (caption) {
    variants.push($cap.hasClass('sr-only') ? 'sr-caption' : 'caption');
    rows.push([p(esc(caption))]);
  }
  return block(`data-table ${variants.join(' ')}`, rows);
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
/**
 * The aria-labels a story's own elements carry (not those inside its bands, which become
 * sections of their own), as section metadata "labels": `tag: label | tag: label`. A div
 * with a role names the role instead (separator, group).
 */
const labelEntry = (el) => {
  const $el = $(el);
  const tag = el.name === 'div' && $el.attr('role') ? $el.attr('role') : el.name;
  return `${tag}: ${$el.attr('aria-label')}`;
};
// the live theme control (scripts/theme-control.js) names itself "Color theme" already
const storyLabels = (story) => $(story).find('[aria-label]')
  .filter((_, el) => !$(el).closest('section.band').length && el.name !== 'svg')
  .filter((_, el) => $(el).attr('aria-label') !== 'Color theme')
  .map((_, el) => labelEntry(el)).get();

const storyMeta = (story, extra = []) => {
  const style = ['story'];
  if ($(story).hasClass('story--row')) style.push('row');
  const meta = [['style', style.join(', ')]];
  if (themeOf(story)) meta.push(['theme', themeOf(story)]);
  const labels = storyLabels(story);
  if (labels.length && !extra.some(([k]) => k === 'labels')) meta.push(['labels', labels.join(' | ')]);
  return [...meta, ...extra];
};
const linkPara = (a, mark) => {
  const href = $(a).attr('href');
  const text = squash(inlineIcons(a));
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
function bandSection(band, story, inner, { words: more = [], meta: extra = [] } = {}) {
  const $b = $(band);
  const words = ['plain', 'alt', 'tint', 'inverse', 'milestone', 'dots']
    .filter((w) => $b.hasClass(`band--${w}`));
  const accent = ($b.attr('style') || '').match(/--color-(?:topic|project)-([a-z-]+)/);
  const style = [...words, ...(accent ? [accent[1]] : []), ...more, 'in-story'];
  const meta = [['style', style.join(', ')], ...extra];
  if ($b.attr('aria-label')) meta.push(['labels', labelEntry(band)]);
  if (themeOf(story)) meta.push(['theme', themeOf(story)]);
  const s = open(meta);
  s.html.push(inner);
  return s;
}

/** Inline content with v3 sprite icons written as EDS icon notation (:name:). */
function inlineIcons(node) {
  const $c = $(node).clone();
  $c.find('svg').each((_, svg) => {
    const ref = $(svg).find('use').attr('href') || '';
    const name = ref.replace(/^#icon-/, '');
    $(svg).replaceWith(name ? `:${name}:` : '');
  });
  return inline($c);
}

/** A story whose own section holds a band (and the band's blocks). */
function bandStory(story, band, inner, opts) {
  const s = open(storyMeta(story));
  s.html.push(label(story));
  bandSection(band, story, inner, opts);
}

const heading = (el) => `<${el.name}>${squash(inline(el))}</${el.name}>`;
const statItems = ($els) => `<ul>${$els.map((_, st) => {
  const $st = $(st).clone();
  const value = $st.children('b').text();
  $st.children('b').remove();
  const accent = $(st).hasClass('stat--accent');
  return `<li><strong>${accent ? `<em>${esc(value)}</em>` : esc(value)}</strong> ${squash(inline($st))}</li>`;
}).get().join('')}</ul>`;

/**
 * Inline content where v3's chips and times are their own elements: a chip becomes bold, a
 * time italic, so they stay separate runs (the template gives them the chip and time looks).
 */
function cardInline(node) {
  const $c = $(node).clone();
  $c.find('.chip').each((_, chip) => { $(chip).replaceWith(`<strong>${esc($(chip).text())}</strong>`); });
  $c.find('time').each((_, t) => { $(t).replaceWith(`<em>${esc($(t).text())}</em>`); });
  return inline($c);
}

/** v3 showcase text as a showcase (story) text cell, in source order; proof links follow. */
function showcaseParts($article) {
  const text = [];
  const after = [];
  $article.children('.showcase__text').children().each((_, c) => {
    const $c = $(c);
    if (/^h[1-6]$/.test(c.name)) text.push(heading(c));
    else if ($c.hasClass('showcase__meta')) text.push(p(cardInline(c)));
    else if ($c.hasClass('proof-links')) after.push(block('proof-links', [[p(inline(c))]]));
    else if ($c.hasClass('stat-chips')) after.push(block('stat-chips', [[statItems($c.children('.stat'))]]));
    else text.push(p(inline(c)));
  });
  const $fig = $article.find('.showcase__media figure');
  const media = `${p(inline($fig.children('a').length ? $fig.children('a') : $fig.children('img')))}${p(inline($fig.children('figcaption')))}`;
  return { text: text.join(''), media, after: after.join('') };
}

/** A v3 frame as a frame block: the (linked) image paragraph, then the caption. */
function frameBlock(fig, variant) {
  const $f = $(fig);
  const imgPara = p(inline($f.children('a').length ? $f.children('a') : $f.children('img')));
  return block(variant ? `frame ${variant}` : 'frame', [[`${imgPara}${p(inline($f.children('figcaption')))}`]]);
}

/** A v3 chapter head as a chapter-head block; its proof links follow as their own block. */
function chapterHead($head) {
  const $body = $head.find('.chapter-head__body');
  const parts = [];
  let after = '';
  $body.children().each((_, c) => {
    if (/^h[1-6]$/.test(c.name)) parts.push(heading(c));
    else if ($(c).hasClass('proof-links')) after = block('proof-links', [[p(inline(c))]]);
    else if ($(c).hasClass('chapter-head__meta')) parts.push(p(cardInline(c)));
    else parts.push(p(inline(c)));
  });
  return `${block('chapter-head', [[parts.join('')]])}${after}`;
}

/** A v3 timeline as a timeline (ladder): era rows, then version | heading, date, text rungs. */
function ladder($ol) {
  const rows = [];
  $ol.children('li').each((_, li) => {
    const $li = $(li);
    if ($li.hasClass('timeline__era')) {
      rows.push([p(inline(li))]);
      return;
    }
    const body = $li.find('.timeline__body').children().map((__, c) => (/^h[1-6]$/.test(c.name) ? heading(c) : p(inline(c)))).get().join('');
    rows.push([p(inline($li.children('.timeline__version'))), body]);
  });
  return block('timeline ladder', rows);
}

/** Stories of the blocks other streams built, using those blocks as they are. */
function convertBuiltStory(story, owner, n) {
  const $s = $(story);
  const first = $s.children().not('.story__label').first();
  const kids = $s.children().not('.story__label');
  const bandOf = ($el) => ($el.is('section.band') ? $el : null);

  if (owner === 'c-card') {
    const cards = first.children('.card').toArray();
    if (first.children('.card--tool').length) {
      const rows = cards.map((a) => {
        const $a = $(a);
        const link = `<a href="${attr(absHref($a.attr('href')))}">${esc($a.children('.card__title').text())}</a>`;
        return [p(`<strong>${link}</strong><br>${squash(inline($a.children('.card__excerpt')))}<br><em>${esc($a.children('.card__meta').text())}</em>`)];
      });
      open(storyMeta(story)).html.push(label(story), block('cards tool', rows));
      return true;
    }
    // v3's post, hub and project cards appear on no site page: the template presents them
    // from default content (kinds: one per card; cols: the v3 grid)
    const kinds = cards.map((card) => {
      const $c = $(card);
      if ($c.hasClass('card--hub')) return ['hub', $c.attr('data-topic'), $c.is('[data-flagship]') ? 'flagship' : ''].filter(Boolean).join(':');
      return $c.hasClass('card--project') ? 'project' : 'post';
    });
    const cols = `${first.hasClass('grid--3') ? 3 : 2}${first.hasClass('grid--rules') ? '-rules' : ''}`;
    const part = (c) => {
      if (/^h[1-6]$/.test(c.name)) return heading(c);
      return c.name === 'a' ? linkPara(c) : p(cardInline(c));
    };
    const html = cards.map((card) => $(card).children().map((_, c) => part(c)).get().join('')).join('');
    open(storyMeta(story, [['demo', 'cards'], ['kinds', kinds.join(', ')], ['cols', cols]])).html.push(label(story), html);
    return true;
  }
  if (owner === 'c-counts') {
    // the v3 counts strip (no site page uses it): label, then the value, per counter
    const items = first.children('div').map((_, d) => `<li>${esc($(d).children('dt').text())} <strong>${esc($(d).children('dd').text())}</strong></li>`).get().join('');
    const demoWord = first.hasClass('counts--inline') ? 'counts-inline' : 'counts';
    open(storyMeta(story, [['demo', demoWord]])).html.push(label(story), `<ul>${items}</ul>`);
    return true;
  }
  if (owner === 'c-showcase') {
    const band = bandOf(first);
    const $art = band ? band.find('article.showcase') : first;
    const { text, media, after } = showcaseParts($art);
    // v3 flip puts the media first (EDS story); v3 default puts it after the text (EDS flip)
    const variant = $art.hasClass('showcase--flip') ? 'showcase story' : 'showcase flip';
    const html = `${block(variant, [[text, media]])}${after}`;
    if (band) bandStory(story, band.get(0), html);
    else open(storyMeta(story)).html.push(label(story), html);
    return true;
  }
  if (owner === 'c-frame') {
    const figs = first.is('figure') ? first.toArray() : first.children('figure').toArray();
    const html = figs.map((f) => frameBlock(f, $(f).hasClass('frame--diagram') ? 'diagram' : 'sub')).join('');
    // v3 caps the single diagram story at 640px (inline style); two frames sit side by side
    const narrow = /max-width:\s*640px/.test($(figs[0]).attr('style') || '');
    const meta = figs.length > 1 ? [['style', 'story, cols-2']] : (narrow && [['style', 'story, narrow']]) || [];
    const s = open(meta.length ? [...meta, ...storyMeta(story).filter(([k]) => k !== 'style')] : storyMeta(story));
    s.html.push(label(story), html);
    return true;
  }
  if (owner === 'c-proof-links') {
    const band = bandOf(first);
    const $p = band ? band.find('.proof-links') : first;
    const html = block('proof-links', [[p(inline($p))]]);
    if (band) bandStory(story, band.get(0), html);
    else open(storyMeta(story)).html.push(label(story), html);
    return true;
  }
  if (owner === 'c-stat') {
    const s = open(storyMeta(story));
    s.html.push(label(story));
    // both v3 rows are stat chips (the counter row is stat--block); EDS stat-chips has the
    // inline chip look only
    kids.filter('.stat-chips').each((_, row) => {
      s.html.push(block('stat-chips', [[statItems($(row).children('.stat'))]]));
    });
    return true;
  }
  if (owner === 'c-chapter-head') {
    const band = bandOf(first);
    const $head = band.find('.chapter-head');
    bandStory(story, band.get(0), chapterHead($head), { words: $head.hasClass('chapter-head--flagship') ? ['flagship'] : [] });
    return true;
  }
  if (owner === 'c-timeline') {
    const band = bandOf(first);
    if (band) bandStory(story, band.get(0), ladder(band.find('ol.timeline')));
    else open(storyMeta(story)).html.push(label(story), ladder(first));
    return true;
  }
  if (owner === 'c-panel-inverse') {
    const $panel = first;
    const $stack = $panel.children('.stack');
    const text = $stack.children().map((_, c) => {
      if (/^h[1-6]$/.test(c.name)) return heading(c);
      if ($(c).hasClass('cluster')) return $(c).children('a').map((__, a) => buttonPara(a)).get().join('');
      return p(inline(c));
    }).get().join('');
    const $t = $panel.children('table.facts');
    const rows = [[p(esc($t.children('caption').text().trim()))]];
    $t.find('tr').each((_, tr) => rows.push([p(inline($(tr).children('th'))), p(inline($(tr).children('td')))]));
    const s = open(storyMeta(story));
    s.html.push(label(story));
    const sec = open([['style', 'inverse, feature, in-story'], ['items', 'period, lead'], ...(themeOf(story) ? [['theme', themeOf(story)]] : [])]);
    sec.html.push(text, block('facts caption', rows));
    return true;
  }
  if (owner === 'c-divider') {
    const s = open(storyMeta(story));
    s.html.push(label(story));
    kids.filter('.divider').each((_, d) => {
      s.html.push(block('divider rule', [[p(esc($(d).children('.divider__label').text()))]]));
    });
    return true;
  }
  return false;
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
    // v3's example header, verbatim (the site's live header is a different nav): the wordmark,
    // the Menu toggle, the links (the current one bold), Book a talk, the theme control's three
    // labels (the pressed one bold); the template lays them out as v3's header
    const $in = first.find('.site-header__inner');
    const $toggle = $in.children('.nav-toggle');
    const icons = $toggle.find('use').map((_, u) => `:${$(u).attr('href').replace(/^#icon-/, '')}:`).get().join(' ');
    const words = $toggle.find('span').map((_, sp) => esc($(sp).text())).get().join(' ');
    const links = $in.find('.site-nav ul li').map((_, li) => {
      const a = $(li).children('a');
      const link = `<a href="${attr(absHref(a.attr('href')))}">${esc(a.text())}</a>`;
      return `<li>${a.attr('aria-current') === 'page' ? `<strong>${link}</strong>` : link}</li>`;
    }).get().join('');
    const theme = $in.find('.theme-control__btn').map((_, b) => p($(b).attr('aria-pressed') === 'true' ? `<strong>${esc($(b).text())}</strong>` : esc($(b).text()))).get();
    const style = $toggle.attr('aria-expanded') === 'true' ? 'story, expanded' : 'story';
    const s = open([['style', style], ...storyMeta(story).filter(([k]) => k !== 'style'), ['demo', 'site-header']]);
    s.html.push(label(story), linkPara($in.children('.wordmark').get(0)), p(`${icons} ${words}`), `<ul>${links}</ul>`,
      buttonPara($in.find('.site-nav__tools .btn').get(0)), ...theme);
    return;
  }
  if (owner === 'c-footer') {
    // v3's full footer, verbatim (the site's live footer is the compact one)
    const $f = first;
    const parts = [];
    $f.find('.site-footer__col').each((_, col) => {
      const $h = $(col).children('h2, h3').first();
      parts.push(heading($h.get(0)), list($(col).children('ul').get(0)));
    });
    $f.find('.site-footer__meta p').each((_, m) => parts.push(p(inline(m))));
    open(storyMeta(story, [['demo', 'site-footer']])).html.push(label(story), ...parts);
    return;
  }
  if (owner === 'c-button') {
    // each button keeps its v3 kind, size and state as an items look; a disabled link (no
    // href) stays text and the template hosts it in an anchor with aria-disabled
    const looks = kids.map((_, k) => {
      const $k = $(k);
      let kind = 'ghost';
      if ($k.hasClass('btn--primary')) kind = 'primary';
      else if ($k.hasClass('btn--secondary')) kind = 'secondary';
      const el = k.name === 'button' ? '-element' : '';
      const sm = $k.hasClass('btn--sm') ? '-sm' : '';
      const dis = ($k.attr('aria-disabled') === 'true' || $k.attr('disabled') !== undefined) ? '-disabled' : '';
      return `btn-${kind}${el}${sm}${dis}`;
    }).get();
    const s = open(storyMeta(story, [['items', looks.join(', ')]]));
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
  if (owner === 'c-band') {
    const s = open(storyMeta(story));
    s.html.push(label(story));
    const bands = first.is('section.band') ? first.toArray() : first.children('section.band').toArray();
    bands.forEach((band) => {
      const $b = $(band);
      const $c = $b.children('.container');
      if ($b.hasClass('band--milestone')) {
        // the milestone band holds the year divider: the outlined numeral, the caption
        const year = block('divider year', [[p(esc($c.children('.band__numeral').text())), p(esc($c.children('.band__caption').text()))]]);
        bandSection(band, story, year);
        return;
      }
      const ctas = $c.children('.cta-band');
      if (ctas.length) {
        bandSection(band, story, ctaBand(ctas));
        return;
      }
      // a band note: the kicker (accent-colored in a tint), then the muted small line
      const kicker = $c.children('.kicker').first();
      const look = $b.hasClass('band--tint') || kicker.hasClass('kicker--accent') ? 'kicker-accent' : 'kicker';
      bandSection(band, story, flatten($c), { meta: [['items', `${look}, note`]] });
    });
    return;
  }
  if (owner === 'c-kicker') {
    const looks = kids.map((_, k) => {
      if ($(k).hasClass('kicker--accent')) return 'kicker-accent';
      if ($(k).hasClass('kicker--rule')) return 'kicker-rule';
      return 'kicker';
    }).get();
    open(storyMeta(story, [['items', looks.join(', ')]])).html.push(label(story), ...kids.map((_, k) => p(inline(k))).get());
    return;
  }
  if (owner === 'c-chip') {
    // each chip its own paragraph; a pressed chip is bold (the template reads the kind from
    // the site's topic, format and status words)
    const chips = kids.map((_, k) => {
      const text = squash(inline(k));
      return p($(k).attr('aria-pressed') === 'true' ? `<strong>${text}</strong>` : text);
    }).get();
    open(storyMeta(story, [['demo', 'chips']])).html.push(label(story), ...chips);
    return;
  }
  if (owner === 'c-icons') {
    const looks = kids.map((_, k) => {
      if ($(k).hasClass('btn')) return 'button';
      if ($(k).hasClass('chip')) return 'chip-plain';
      return $(k).find('.icon--lg').length ? 'mono-lg' : 'mono';
    }).get();
    open(storyMeta(story, [['items', looks.join(', ')]])).html.push(label(story), ...kids.map((_, k) => {
      const html = squash(inlineIcons(k));
      return k.name === 'a' ? buttonPara(k) : p(html);
    }).get());
    return;
  }
  if (owner === 'theming') {
    // the live control comes from scripts/theme-control.js: its labels are interface chrome
    open(storyMeta(story, [['demo', 'theme-control']])).html.push(label(story));
    return;
  }
  if (owner === 'c-proof') {
    const items = first.children('div').map((_, d) => {
      const $dd = $(d).children('dd').clone();
      const note = $dd.children('.proof__note').text();
      $dd.children('.proof__note').remove();
      return `<li><strong>${esc($(d).children('dt').text())}</strong> ${squash(inline($dd))}<br>${esc(note)}</li>`;
    }).get().join('');
    open(storyMeta(story, [['demo', 'proof']])).html.push(label(story), `<ul>${items}</ul>`);
    return;
  }
  if (owner === 'c-embed') {
    open(storyMeta(story, [['demo', 'embed']])).html.push(
      label(story),
      p(esc(first.find('.embed__frame').text().trim())),
      p(esc(first.find('figcaption').text().trim())),
    );
    return;
  }
  if (owner === 'c-page-head') {
    const looks = first.children('p').map((_, c) => {
      const $c = $(c);
      if ($c.hasClass('kicker')) return 'kicker';
      if ($c.hasClass('page-title--display')) return 'page-title-display';
      if ($c.hasClass('page-title')) return 'page-title';
      if ($c.hasClass('byline')) return 'byline';
      if ($c.hasClass('positioning')) return 'positioning';
      return 'summary';
    }).get();
    open(storyMeta(story, [['items', looks.join(', ')]])).html.push(label(story), ...first.children('p').map((_, c) => p(inline(c))).get());
    return;
  }
  if (owner === 'c-filter-bar') {
    // the v3 static filter bar: per row a label, then its chips (or the sort choice); the
    // site's live filter is the writing-filter widget, so the story keeps v3's own bar
    const paras = [];
    const looks = [];
    first.children('.filter-bar__row').each((_, row) => {
      $(row).children().each((__, c) => {
        const $c = $(c);
        if ($c.hasClass('filter-bar__label') || c.name === 'label') {
          paras.push(p(esc($c.text().trim())));
          looks.push('row-label');
        } else if (c.name === 'select') {
          const option = $c.find('option[selected]').text() || $c.find('option').first().text();
          paras.push(p(esc(option)));
          looks.push('chip-plain');
        } else {
          const pressed = $c.attr('aria-pressed') === 'true' || $c.attr('aria-current') === 'true';
          const textHtml = squash(inline(c));
          const chip = c.name === 'a' ? `<a href="${attr(absHref($c.attr('href')))}">${textHtml}</a>` : textHtml;
          // a bold link would become a button, so the pressed chip is an items look
          paras.push(p(chip));
          looks.push(pressed ? 'pressed' : 'chip'); // the pipeline drops empty list entries
        }
      });
    });
    const meta = [['style', 'story, row'], ...storyMeta(story).filter(([k]) => k !== 'style'), ['demo', 'chips'], ['items', looks.join(', ')]];
    open(meta).html.push(label(story), ...paras);
    return;
  }
  if (convertBuiltStory(story, owner, n)) return;

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
    // each tile: the icon (EDS icon notation, icons/<name>.svg), then its name
    demo('icons').html.push(`<ul>${$el.children('div').map((_, d) => `<li>${squash(inlineIcons(d))}</li>`).get().join('')}</ul>`);
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
