#!/usr/bin/env node
// Imports the source portfolio (jackzhaojin.github.io/portfolio/index.html) into one Experience
// Workspace document for the portfolio template (metadata "template: portfolio").
//
// Page shape: the head section (default content the template styles), the jump links, the
// projects-over-time section (timeline (gantt) carries the project rows the chart and the year
// rail are drawn from), then per project chapter one section with section metadata id (ch-*),
// chapter dividers and the 2025 year band as their own sections, then the career notes and the
// smaller repos. A story becomes a showcase (story, flip or wide) followed by the blocks it
// holds (panel, tabs, timeline (ladder), frame (sub), stat-chips, proof-links); the showcase
// moves them back into place (EDS blocks do not nest).
//
// Text is carried verbatim (whitespace collapsed); links stay absolute to www.jackzhaojin.com
// so localize-links can rewrite the ones that resolve on the new site. Images point at DA
// media under media/portfolio/<folder>/<file> (upload portfolio/assets with da-media-upload.mjs
// --scope portfolio). Source <time> in a story meta line becomes <em> (styled as the date),
// .mono spans become <code>, <b> becomes <strong>. aria-label / title values that the source
// keeps in attributes become two-cell config rows (key | value) that the blocks apply.
//
// Usage: node stardust/scripts/import-portfolio.mjs <source portfolio/index.html> <out.html>
import fs from 'node:fs';
import * as cheerio from 'cheerio';

const [src, out] = process.argv.slice(2);
if (!src || !out || src === '--help' || src === '-h') {
  console.error('usage: import-portfolio.mjs <source portfolio/index.html> <out.html>\nWrites: <out.html>');
  process.exit(src === '--help' || src === '-h' ? 0 : 2);
}
const SITE = 'https://www.jackzhaojin.com';
const BASE = `${SITE}/portfolio/`;
const MEDIA = 'https://content.da.live/jackzhaojin/www-eds/media/portfolio';
const $ = cheerio.load(fs.readFileSync(src, 'utf8'));
const unsupported = [];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const absHref = (h) => {
  if (!h) return h;
  if (h.startsWith('#')) return h;
  return new URL(h, BASE).href;
};
const img = (el) => {
  const $el = $(el);
  const rel = $el.attr('src').split('?')[0].replace(/^assets\//, '');
  return `<img src="${MEDIA}/${rel}" alt="${attr($el.attr('alt') || '')}">`;
};

// Inline content: keep a (href, title), code (from .mono spans), strong/b, em/i (and <time>),
// br; other spans unwrap (their text stays). Whitespace collapses as the browser renders it.
function inlineRaw(node) {
  let html = '';
  $(node).contents().each((_, c) => {
    if (c.type === 'text') {
      html += esc(c.data.replace(/\s+/g, ' '));
      return;
    }
    if (c.type !== 'tag') return;
    const tag = c.name;
    const $c = $(c);
    const inner = inlineRaw(c);
    if (tag === 'a') {
      const title = $c.attr('title');
      html += `<a href="${attr(absHref($c.attr('href')))}"${title ? ` title="${attr(title)}"` : ''}>${inner}</a>`;
    } else if (tag === 'code' || (tag === 'span' && $c.hasClass('mono'))) html += `<code>${inner}</code>`;
    else if (tag === 'span' && $c.hasClass('link-caveat')) html += `<em>${inner}</em>`;
    else if (tag === 'strong' || tag === 'b') html += `<strong>${inner}</strong>`;
    else if (tag === 'em' || tag === 'i' || tag === 'time') html += `<em>${inner}</em>`;
    else if (tag === 'br') html += '<br>';
    else if (tag === 'img') html += img(c);
    else html += inner;
  });
  return html;
}
// trims the outer whitespace of an inline run (and around <br>)
const inline = (node) => inlineRaw(node).replace(/^ +| +$/g, '').replace(/ ?<br> ?/g, '<br>');
const p = (node) => `<p>${inline(node)}</p>`;
const ptext = (text) => `<p>${esc(text)}</p>`;
const cell = (html) => `<div>${html}</div>`;
const row = (...cells) => `<div>${cells.map(cell).join('')}</div>`;
const block = (name, rows) => `<div class="${name}">${rows.join('')}</div>`;
const config = (key, value) => (value ? row(ptext(key), ptext(value)) : '');
const sectionMeta = (pairs) => {
  const rows = Object.entries(pairs).filter(([, v]) => v).map(([k, v]) => row(ptext(k), ptext(v)));
  return rows.length ? block('section-metadata', rows) : '';
};
const section = (html, meta = {}) => `<div>${html}${sectionMeta(meta)}</div>`;

// a figure.frame: image paragraph (linked when the source links it) and caption paragraph
function frameParts(fig) {
  const $f = $(fig);
  const $img = $f.find('img').first();
  const $a = $img.closest('a');
  const image = $a.length ? `<p><a href="${attr(absHref($a.attr('href')))}">${img($img[0])}</a></p>` : `<p>${img($img[0])}</p>`;
  const cap = $f.children('figcaption');
  return { image, caption: cap.length ? p(cap[0]) : '', label: $a.attr('aria-label') };
}

function proofLinks(el) {
  const $el = $(el);
  const titled = $el.find('span[title]').first();
  return block('proof-links', [row($el.text().trim() ? p(el) : ''), config('title', titled.attr('title'))]);
}

function statChips(el) {
  const items = $(el).children('.stat').map((_, s) => `<li>${inline(s)}</li>`).get().join('');
  return block('stat-chips', [row(`<ul>${items}</ul>`)]);
}

function counterList(rowEl) {
  return `<ul>${$(rowEl).children('.counter').map((_, c) => {
    const $c = $(c);
    const html = inline(c);
    // the accent counter's value is bold and italic
    return `<li>${$c.hasClass('accent-counter') ? html.replace(/^<strong>(.*?)<\/strong>/, '<strong><em>$1</em></strong>') : html}</li>`;
  }).get().join('')}</ul>`;
}

// ---------------------------------------------------------------- panels and other media
function panel(el) {
  const $el = $(el);
  const label = $el.attr('aria-label');
  const rows = [config('label', label)];
  if ($el.hasClass('pulse-panel')) {
    rows.push(config('replay', $el.find('.replay').attr('aria-label')));
    rows.push(row(p($el.children('.panel-label')[0])));
    rows.push(row(counterList($el.find('.counter-row')[0])));
    rows.push(row(p($el.find('.replay')[0])));
    return block('panel pulse', rows);
  }
  if ($el.hasClass('glossary')) {
    rows.push(row(p($el.children('.panel-label')[0])));
    $el.find('.gloss-chip').each((_, c) => rows.push(row(p(c), ptext($(c).attr('data-def')))));
    rows.push(row(p($el.find('.gloss-readout')[0])));
    return block('panel glossary', rows);
  }
  if ($el.hasClass('beforeafter')) {
    rows.push(row(p($el.children('.panel-label')[0])));
    $el.find('.ba-row').each((_, r) => rows.push(row(p($(r).children('.ba-tag')[0]), p($(r).children('p')[0]))));
    return block('panel compare', rows);
  }
  if ($el.hasClass('request-flow')) {
    rows.push(row(...$el.children('.rf-node').map((_, n) => p(n)).get()));
    rows.push(row(p($el.children('.panel-note')[0])));
    return block('panel wire', rows);
  }
  if ($el.hasClass('bakeoff')) {
    rows.push(config('replay', $el.find('.replay').attr('aria-label')));
    rows.push(config('max', '130'));
    rows.push(row(p($el.children('.panel-label')[0])));
    $el.find('.bake-row').each((_, r) => rows.push(row(p($(r).children('.bake-name')[0]), p($(r).children('.bake-score')[0]))));
    rows.push(row(p($el.children('.panel-note')[0])));
    rows.push(row(p($el.find('.replay')[0])));
    return block('panel bakeoff', rows);
  }
  if ($el.hasClass('ciam-flow')) {
    rows.push(row(...$el.children('.ciam-node').map((_, n) => `${p($(n).children('.mono')[0])}${p($(n).children('p')[0])}`).get()));
    return block('panel flow', rows);
  }
  if ($el.hasClass('edge')) {
    rows.push(row(p($el.children('.kicker-sm')[0])));
    rows.push(row(...$el.find('.edge-col').map((_, c) => `<h4>${inline($(c).children('h4')[0])}</h4>${$(c).children('p').map((__, q) => p(q)).get().join('')}`).get()));
    const close = $el.children('.edge-close');
    if (close.length) rows.push(row(p(close[0])));
    return block('panel edge', rows);
  }
  unsupported.push(`panel ${$el.attr('class')}`);
  return '';
}

function deck(el) {
  const $el = $(el);
  const rows = [
    config('label', $el.find('[role=tablist]').attr('aria-label')),
    row(p($el.find('.deck-label')[0])),
  ];
  $el.find('.deck-tab').each((_, t) => {
    const $t = $(t);
    const pane = $el.find(`#${$t.attr('data-deck')}`);
    const label = $t.clone();
    label.children('span').remove();
    const $img = pane.find('img').first();
    const $a = $img.closest('a');
    rows.push(row(
      ptext(label.text().trim()),
      [
        p(pane.find('.deck-eyebrow')[0]),
        `<h4>${inline(pane.find('h4')[0])}</h4>`,
        p(pane.find('.deck-pane-head p')[0]),
        `<p><a href="${attr(absHref($a.attr('href')))}">${img($img[0])}</a></p>`,
      ].join(''),
    ));
  });
  return block('tabs diagram-deck', rows);
}

function ladder(el) {
  const rows = [];
  $(el).children('.era').each((_, era) => {
    rows.push(row(p($(era).children('.era-title')[0])));
    $(era).children('.rung').each((__, r) => {
      const $r = $(r);
      const body = $r.children('.rung-body');
      rows.push(row(
        p($r.children('.rung-v')[0]),
        `${p(body.children('.rung-date')[0])}<h4>${inline(body.children('h4')[0])}</h4>${body.children('p').map((___, q) => p(q)).get().join('')}`,
      ));
    });
  });
  return block('timeline ladder', rows);
}

function carousel(el, controls) {
  const $el = $(el);
  const $c = $(controls);
  const rows = [
    config('label', $el.attr('aria-label')),
    config('previous', $c.find('[data-dir="-1"]').attr('aria-label')),
    config('next', $c.find('[data-dir="1"]').attr('aria-label')),
  ];
  $el.children('.slide').each((_, s) => rows.push(row(`<p>${img($(s).find('img')[0])}</p>`, p($(s).children('figcaption')[0]))));
  return block('carousel', rows);
}

function frameBlock(fig, variants) {
  const f = frameParts(fig);
  return block(`frame${variants ? ` ${variants}` : ''}`, [config('label', f.label), row(`${f.image}${f.caption}`)]);
}

function cardsProject(grid, note) {
  const rows = $(grid).children('.bruce-card').map((_, c) => {
    const $c = $(c);
    return row(`${p($c.children('.bruce-dates')[0])}<h3>${inline($c.children('h3')[0])}</h3>${p($c.children('p:not(.proof-links)')[0])}${p($c.children('.proof-links')[0])}`);
  }).get();
  if (note) rows.push(row(p(note)));
  return block('cards project', rows);
}

function cardsRepo(grid) {
  return block('cards repo', $(grid).children('.repo-card').map((_, c) => {
    const $c = $(c);
    return row(`<p><a href="${attr(absHref($c.attr('href')))}">${inline($c.children('.rc-dates')[0])}</a></p><h3>${inline($c.children('h3')[0])}</h3>${p($c.children('p')[0])}`);
  }).get());
}

function cardsTool(grid) {
  return block('cards tool', $(grid).children('.tool-card').map((_, c) => {
    const $c = $(c);
    return row(`<p><a href="${attr(absHref($c.attr('href')))}"><strong>${inline($c.children('.tool-name')[0])}</strong></a><br>${inline($c.children('p')[0])}<br><em>${inline($c.children('.tool-meta')[0])}</em></p>`);
  }).get());
}

// ---------------------------------------------------------------- stories
// story text: meta, heading, pattern line, body, pull quote; nested blocks come back as a list
function storyText(textEl) {
  let html = '';
  const nested = [];
  $(textEl).children().each((_, c) => {
    const $c = $(c);
    if ($c.is('p.story-meta')) html += p(c);
    else if ($c.is('h3')) html += `<h3>${inline(c)}</h3>`;
    else if ($c.is('p.proof-links')) nested.push(proofLinks(c));
    else if ($c.is('div.stat-chips')) nested.push(statChips(c));
    else if ($c.is('figure.frame')) nested.push(frameBlock(c, ['sub', $c.hasClass('portrait') ? 'portrait' : ''].filter(Boolean).join(' ')));
    else if ($c.is('blockquote')) html += `<blockquote><p>${inline(c)}</p></blockquote>`;
    else if ($c.is('p')) html += p(c);
    else unsupported.push(`story-text child ${c.name}.${$c.attr('class')}`);
  });
  return { html, nested };
}

function story(el) {
  const $s = $(el);
  const id = $s.attr('id');
  const wide = $s.hasClass('wide');
  const words = ['story', $s.hasClass('flip') ? 'flip' : '', wide ? 'wide' : '', $s.find('.tall-diagram').length ? 'tall' : ''].filter(Boolean).join(' ');
  const out = [];
  const textEl = $s.children('.story-text')[0];
  if (!wide) {
    const media = $s.children('.story-media');
    let mediaHtml = '';
    let label = '';
    const after = [];
    media.children().each((_, c) => {
      const $c = $(c);
      if ($c.is('figure.frame')) {
        const f = frameParts(c);
        mediaHtml += `${f.image}${f.caption}`;
        label = f.label;
      } else if ($c.is('.video-embed')) {
        mediaHtml += ptext($c.attr('data-title'));
      } else if ($c.is('p') && $c.find('a[href*="youtube"]').length) {
        mediaHtml += p(c);
      } else if ($c.is('.panel')) after.push(panel(c));
      else unsupported.push(`story-media child ${c.name}.${$c.attr('class')}`);
    });
    const t = storyText(textEl);
    out.push(block(`showcase ${words}`, [row(t.html, mediaHtml), config('id', id), config('label', label)]));
    out.push(...after, ...t.nested);
    return out;
  }
  // wide: optional centered text, then media and nested blocks in source order
  const kids = $s.children().toArray();
  const textIdx = kids.findIndex((k) => $(k).hasClass('story-text'));
  const before = textIdx > 0 ? kids.slice(0, textIdx) : [];
  const rest = textIdx >= 0 ? kids.slice(textIdx + 1) : kids;
  const blocks = (list) => {
    const res = [];
    let mediaHtml = '';
    let label = '';
    list.forEach((k, i) => {
      const $k = $(k);
      if ($k.is('figure.frame')) {
        if (textIdx >= 0 && !mediaHtml && !res.length) {
          const f = frameParts(k);
          mediaHtml = `${f.image}${f.caption}`;
          label = f.label;
        } else res.push(frameBlock(k, 'diagram'));
      } else if ($k.is('.diagram-deck')) res.push(deck(k));
      else if ($k.is('.ladder')) res.push(ladder(k));
      else if ($k.is('.stat-chips')) res.push(statChips(k));
      else if ($k.is('p.proof-links')) res.push(proofLinks(k));
      else if ($k.is('.bruce-grid')) res.push(cardsProject(k, list[i + 1] && $(list[i + 1]).is('.bruce-note') ? list[i + 1] : null));
      else if ($k.is('.bruce-note')) { /* carried by the cards (project) note row */ } else if ($k.is('.repo-grid')) res.push(cardsRepo(k));
      else if ($k.is('.carousel')) res.push(carousel(k, list[i + 1]));
      else if ($k.is('.carousel-controls')) { /* carried by the carousel config rows */ } else if ($k.is('.panel-wide, .panel')) res.push(panel(k));
      else unsupported.push(`wide child ${k.name}.${$k.attr('class')}`);
    });
    return { res, mediaHtml, label };
  };
  if (textIdx >= 0) {
    // media above the text: flip, and the blocks follow the showcase that moves them in
    const pre = blocks(before);
    const t = storyText(kids[textIdx]);
    const r = blocks(rest);
    out.push(block(`showcase ${pre.res.length ? `${words} flip` : words}`, [row(t.html, r.mediaHtml), config('id', id), config('label', r.label)]));
    out.push(...pre.res, ...r.res, ...t.nested);
  } else out.push(...blocks(rest).res);
  return out;
}

// ---------------------------------------------------------------- chapter head
function chapterHead(head) {
  const $h = $(head);
  const tb = $h.find('.chapter-title-block');
  let html = '';
  tb.children().each((_, c) => {
    const $c = $(c);
    if ($c.is('h2')) html += `<h2>${inline(c)}</h2>`;
    else if ($c.is('p')) html += p(c);
    else if (!$c.is('.repo-callout')) unsupported.push(`chapter-head child ${c.name}.${$c.attr('class')}`);
  });
  const rows = [row(html)];
  const callout = tb.children('.repo-callout');
  if (callout.length) {
    rows.push(row(callout.children().map((_, c) => ($(c).is('a')
      ? `<p><a href="${attr(absHref($(c).attr('href')))}">${inline(c)}</a></p>`
      : p(c))).get().join('')));
  }
  return block('chapter-head', rows);
}

// ---------------------------------------------------------------- sections
const sections = [];
const main = $('main');

// head
const hero = main.children('section.hero');
const copy = hero.find('.hero-copy');
const heroLinks = copy.children('.hero-links');
sections.push(section([
  `<h1>${inline(copy.children('h1')[0])}</h1>`,
  p(copy.children('.hero-kicker')[0]),
  p(copy.children('.hero-deck')[0]),
  ...copy.find('.hero-actions a').map((_, a) => ($(a).hasClass('button-primary')
    ? `<p><strong><a href="${attr(absHref($(a).attr('href')))}">${inline(a)}</a></strong></p>`
    : `<p><a href="${attr(absHref($(a).attr('href')))}">${inline(a)}</a></p>`)).get(),
  p(heroLinks[0]),
].join(''), { id: hero.attr('id'), style: 'intro', label: hero.attr('aria-label') }));

// jump links
const jumps = main.children('nav.portfolio-jumps');
sections.push(section(block('jump-links', [
  config('label', jumps.attr('aria-label')),
  row(`<ul>${jumps.children('a').map((_, a) => `<li><a href="${attr(absHref($(a).attr('href')))}">${inline(a)}</a></li>`).get().join('')}</ul>`),
]), { style: 'jumps' }));

// projects over time: the chart data lives in the source script (PROJECTS, START, END, CURRENT)
const script = fs.readFileSync(src.replace(/index\.html$/, 'script.js'), 'utf8');
const projects = [...script.matchAll(/\{ id: "(ch-[a-z]+)",\s+label: "([^"]+)",\s+start: "([\d-]+)", end: "([\d-]+)"[^}]*?(ongoing: true)?\s*\}/g)];
const tl = main.children('section.timeline-section');
const legend = tl.find('.method-legend');
const scaleLabels = [...script.matchAll(/\[("[A-Z][a-z]{2} \d{4}"(?:, )?)+\]/g)][0][0].match(/"([^"]+)"/g).map((s) => s.slice(1, -1));
const gantt = block('timeline gantt', [
  config('range', `${/START = Date\.parse\("([\d-]+)"\)/.exec(script)[1]} to ${/END = Date\.parse\("([\d-]+)"\)/.exec(script)[1]}`),
  config('now', /CURRENT = "([\d-]+)"/.exec(script)[1]),
  config('rail', $('#year-rail').attr('aria-label')),
  row(ptext('scale'), ...scaleLabels.map(ptext)),
  ...projects.map((m) => row(ptext(m[2]), ptext(m[1]), ptext(m[3]), ptext(m[4]), m[5] ? ptext('ongoing') : '')),
  config('fallback', tl.find('noscript').text().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()),
  row(p(tl.find('p.small')[0])),
  config('legend', legend.attr('aria-label')),
  row(`${p(legend.children('.kicker-sm')[0])}<ul>${legend.find('li').map((_, li) => `<li>${inline(li)}</li>`).get().join('')}</ul>`),
]);
const th = tl.find('.timeline-head');
sections.push(section([
  `<h2>${inline(th.children('h2')[0])}</h2>`,
  ...th.children('p').map((_, q) => p(q)).get(),
  gantt,
].join(''), { id: tl.attr('id'), style: 'timeline', label: tl.attr('aria-label') }));

// chapters, dividers, year band
const ACCENT = { anima: 'anima', bruce: 'bruce', factory: 'factory', kit: 'kit', conv: 'conv', cea: 'cea', ciam: 'ciam', postal: 'postal', shadow: 'shadow', star: 'star' };
main.children().each((_, el) => {
  const $el = $(el);
  if ($el.is('div.tdiv')) {
    sections.push(section(block('divider', [row(...$el.children('span').map((__, s) => p(s)).get())])));
  } else if ($el.is('div.year-band')) {
    sections.push(section(block('divider year', [row(p($el.children('.year-big')[0]), p($el.children('.year-note')[0]))]), { id: $el.attr('id'), label: $el.attr('aria-label') }));
  } else if ($el.is('section.chapter')) {
    const proj = $el.attr('data-proj');
    const style = ['chapter', ACCENT[proj], $el.hasClass('flagship') ? 'flagship' : '', $el.hasClass('lofi') ? 'lofi' : ''].filter(Boolean).join(', ');
    const parts = [];
    $el.children().each((__, c) => {
      const $c = $(c);
      if ($c.is('header.chapter-head')) parts.push(chapterHead(c));
      else if ($c.is('article.story')) parts.push(...story(c));
      else if ($c.is('aside.edge')) parts.push(panel(c));
      else if ($c.is('.cea-lifetime')) {
        parts.push(block('stats lifetime', [
          config('label', $c.attr('aria-label')),
          row(p($c.children('.kicker-sm')[0])),
          row(counterList($c.children('.counter-row')[0])),
          row(p($c.children('.edge-close')[0])),
        ]));
      } else unsupported.push(`chapter child ${c.name}.${$c.attr('class')}`);
    });
    sections.push(section(parts.join(''), { id: $el.attr('id'), style }));
  }
});

// career notes
const career = main.children('section.career');
const ci = career.find('.career-inner');
sections.push(section([
  `<h2>${inline(ci.children('h2')[0])}</h2>`,
  p(ci.children('p.project-meta')[0]),
  block('timeline milestones', [
    ...ci.find('.milestone-list li').map((_, li) => {
      const $li = $(li);
      const date = $li.children('.mono');
      const rest = $li.clone();
      rest.children('.mono').remove();
      return row(p(date[0]), p(rest[0]));
    }).get(),
    row(p(ci.children('.cred-strip')[0])),
  ]),
].join(''), { id: career.attr('id'), style: 'career', label: career.attr('aria-label') }));

// smaller repos
const wb = main.children('section.workbench-section');
const wi = wb.find('.workbench-inner');
sections.push(section([
  `<h2>${inline(wi.children('h2')[0])}</h2>`,
  ...wi.children('p').map((_, q) => p(q)).get(),
  cardsTool(wi.children('.workbench-grid')[0]),
].join(''), { id: wb.attr('id'), style: 'workbench' }));

// page metadata
const metaHtml = block('metadata', [
  row(ptext('title'), ptext($('head title').text())),
  row(ptext('description'), ptext($('head meta[name=description]').attr('content'))),
  row(ptext('template'), ptext('portfolio')),
]);
sections[sections.length - 1] = sections[sections.length - 1].replace(/<\/div>$/, `${metaHtml}</div>`);

const html = `<body>\n  <header></header>\n  <main>\n${sections.map((s) => `    ${s}`).join('\n')}\n  </main>\n  <footer></footer>\n</body>\n`;
fs.writeFileSync(out, html);
console.log(`wrote ${out}: ${sections.length} sections, ${projects.length} timeline projects`);
if (unsupported.length) {
  console.error(`UNSUPPORTED (${unsupported.length}):\n  ${unsupported.join('\n  ')}`);
  process.exitCode = 1;
}
