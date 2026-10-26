// Compares two DA documents in two layers:
//   content: text, links, images (src + alt), block names and variants, in document order;
//   markup:  a canonical serialization after undoing the editor's known rewrites
//            (picture -> img, <p> around a lone image, <strong><a>…</a></strong> -> <a><strong>…</strong></a>,
//            entities vs characters). Whatever still differs is an unknown change to review.
// Usage (from the www-eds root, for cheerio): node stardust/scripts/roundtrip-compare.mjs <before.html> <after.html>
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const cheerio = createRequire(`${process.cwd()}/`)('cheerio');
const [beforeFile, afterFile] = process.argv.slice(2);

// A link whose text is partly bold comes back split: <strong><a href=h>X</a></strong><a href=h>Y</a>.
// Merging it back into <a href=h><strong>X</strong>Y</a> makes the two forms compare equal; the count is
// reported separately because the split form can render differently.
function mergeSplitLinks($) {
  let merged = 0;
  $('a').each((i, el) => {
    const $a = $(el);
    const prev = el.prev && el.prev.type === 'tag' ? $(el.prev) : null;
    if (!prev || !prev.is('strong, em') || prev.contents().length !== 1) return;
    const $inner = prev.children('a');
    if (!$inner.length || $inner.attr('href') !== $a.attr('href')) return;
    const mark = $(`<${prev[0].tagName}></${prev[0].tagName}>`).append($inner.contents());
    $a.prepend(mark);
    prev.remove();
    merged += 1;
  });
  return merged;
}

function content(html) {
  const $ = cheerio.load(html);
  mergeSplitLinks($);
  const out = [];
  $('main *').each((i, el) => {
    const $el = $(el);
    const tag = el.tagName;
    if (tag === 'div' && $el.attr('class')) out.push(`BLOCK ${$el.attr('class')}`);
    else if (tag === 'a') out.push(`LINK ${$el.attr('href')}`);
    else if (tag === 'img') out.push(`IMG ${$el.attr('src')} alt="${$el.attr('alt') || ''}"`);
    else if (tag === 'li') {
      // A list item's own text, without its nested lists; its paragraphs are read as the item.
      const $own = $el.clone();
      $own.find('ul, ol').remove();
      if (!$own.find('p').length) {
        const t = $own.text().replace(/\s+/g, ' ').trim();
        if (t) out.push(`LI ${t}`);
      }
    } else if (/^(h[1-6]|p|pre|blockquote)$/.test(tag) && !$el.find('p,li').length) {
      const t = $el.text().replace(/\s+/g, ' ').trim();
      const inItem = tag === 'p' && el.parent && el.parent.tagName === 'li';
      if (t) out.push(`${inItem ? 'LI' : tag.toUpperCase()} ${t}`);
    }
  });
  return out;
}

function canonical(html) {
  const $ = cheerio.load(html);
  mergeSplitLinks($);
  $('picture').each((i, el) => { $(el).replaceWith($(el).find('img').first()); });
  $('img[loading]').removeAttr('loading');
  // A <br> inside bold or italic text moves outside it: <em>A<br>B</em> -> <em>A</em><br><em>B</em>.
  $('em, strong').each((i, el) => {
    const $m = $(el);
    if (!$m.children('br').length) return;
    const tag = el.tagName;
    const parts = [];
    let cur = $(`<${tag}></${tag}>`);
    $m.contents().each((j, c) => {
      if (c.type === 'tag' && c.name === 'br') {
        if (cur.contents().length) parts.push(cur);
        parts.push($('<br>'));
        cur = $(`<${tag}></${tag}>`);
      } else cur.append($(c).clone());
    });
    if (cur.contents().length) parts.push(cur);
    $m.replaceWith(parts);
  });
  // Empty inline elements (an import's leftover <em></em>) are dropped.
  $('em, strong, u, code').filter((i, el) => !$(el).contents().length).remove();
  // Empty paragraphs (an empty block cell's <p></p>) are dropped.
  $('p').filter((i, el) => !$(el).children().length && !$(el).text().trim()).remove();
  // Bold and italic on the same text: the editor nests italic outside bold.
  $('strong').each((i, el) => {
    const $s = $(el);
    const $em = $s.children('em');
    if ($s.contents().length === 1 && $em.length) {
      const $strong = $('<strong></strong>').append($em.contents());
      $em.empty().append($strong);
      $s.replaceWith($em);
    }
  });
  // A list item holding a nested list gets its own text wrapped in <p>.
  $('li > p').each((i, el) => {
    const $li = $(el).parent();
    if ($li.children('ul, ol').length && $li.children('p').length === 1) $(el).replaceWith($(el).contents());
  });
  $('p').each((i, el) => {
    const $p = $(el);
    const $only = $p.children();
    const lone = $only.length === 1 && !$p.text().trim();
    const linkedImg = $only.is('a') && $only.children().length === 1 && $only.children('img').length;
    if (lone && ($only.is('img') || linkedImg)) $p.replaceWith($only);
  });
  $('strong, em').each((i, el) => {
    const $m = $(el);
    const $a = $m.children('a');
    if ($m.children().length === 1 && $a.length && $m.text() === $a.text()) {
      const wrapped = $(`<${el.tagName}></${el.tagName}>`).append($a.contents());
      $a.empty().append(wrapped);
      $m.replaceWith($a);
    }
  });
  const lines = [];
  (function walk(node, depth) {
    node.children.forEach((c) => {
      if (c.type === 'text') {
        const t = c.data.replace(/\s+/g, ' ');
        if (t.trim()) lines.push(`${'  '.repeat(depth)}"${t.trim()}"`);
      } else if (c.type === 'tag') {
        const attrs = Object.entries(c.attribs).sort().map(([k, v]) => ` ${k}="${v}"`).join('');
        lines.push(`${'  '.repeat(depth)}<${c.name}${attrs}>`);
        walk(c, depth + 1);
      }
    });
  }($('body')[0], 0));
  return lines;
}

function diff(a, b) {
  // Line diff through the system diff (LCS), so a long page keeps its alignment.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-'));
  fs.writeFileSync(path.join(dir, 'a'), `${a.join('\n')}\n`);
  fs.writeFileSync(path.join(dir, 'b'), `${b.join('\n')}\n`);
  const r = spawnSync('diff', [path.join(dir, 'a'), path.join(dir, 'b')], { encoding: 'utf8' });
  if (process.env.RT_CONTEXT) console.log(spawnSync('diff', ['-U4', path.join(dir, 'a'), path.join(dir, 'b')], { encoding: 'utf8' }).stdout);
  fs.rmSync(dir, { recursive: true });
  return r.stdout.split('\n').filter((l) => /^[<>] /.test(l)).map((l) => (l[0] === '<' ? `- ${l.slice(2)}` : `+ ${l.slice(2)}`));
}

const before = fs.readFileSync(beforeFile, 'utf8');
const after = fs.readFileSync(afterFile, 'utf8');
const norm = (s) => s.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
console.log(`raw: ${norm(before) === norm(after) ? 'identical' : 'differs'} (${before.length} -> ${after.length} chars)`);
const cd = diff(content(before), content(after));
console.log(`content: ${cd.length ? `${cd.length} differences` : 'identical'}`);
cd.slice(0, 20).forEach((l) => console.log(`  ${l}`));
const md = diff(canonical(before), canonical(after));
console.log(`markup after undoing known rewrites: ${md.length ? `${md.length} differences` : 'identical'}`);
md.slice(0, 30).forEach((l) => console.log(`  ${l}`));
const count = (re, s) => (s.match(re) || []).length;
console.log(`split links (check the render): ${mergeSplitLinks(cheerio.load(after)) - mergeSplitLinks(cheerio.load(before))}`);
console.log(`known rewrites seen: picture ${count(/<picture>/g, before)} -> ${count(/<picture>/g, after)}; `
  + `<strong><a> ${count(/<strong><a /g, norm(before))} -> ${count(/<strong><a /g, norm(after))}; `
  + `named entities ${count(/&[a-z]+;/g, before)} -> ${count(/&[a-z]+;/g, after)}`);
