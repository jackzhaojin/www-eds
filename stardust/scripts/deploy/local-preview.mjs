#!/usr/bin/env node
/**
 * Builds local previews of content/ pages for the AEM CLI, so a block and the page that uses it
 * can be tried together before either reaches DA: each page becomes
 * .local-preview/<path>/index.plain.html, which `aem up --html-folder .local-preview
 * --html-mount /` (the aem-up-local launch config) serves at the page's own path, with the local
 * code, the head and the metadata. Everything else (nav, footer, sheets, media) comes from preview
 * as usual.
 *
 *   node stardust/scripts/deploy/local-preview.mjs /portfolio/anima-mesh/ [more pages]
 *
 * Images: DA's image URLs are private, so each <picture> is swapped for the one www serves for the
 * same page (matched in order); a page www doesn't have yet keeps DA's and shows broken images.
 * Run from the www-eds root after pulling the page (da-pull.mjs) and after every edit to it.
 */
/* eslint-disable no-console, no-restricted-syntax, no-continue, no-await-in-loop -- a dev script:
   it reports to the console and walks pages in a loop, one at a time */
import fs from 'node:fs';
import path from 'node:path';

const OUT = '.local-preview';
const WWW = 'https://www.jackzhaojin.com';
const pages = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!pages.length) {
  console.error('local-preview: name the pages, e.g. /portfolio/anima-mesh/');
  process.exit(1);
}

/** The outer HTML of the element starting at `start` (a `<div`), by counting nested divs. */
function divAt(html, start) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0;
  let m = re.exec(html);
  while (m) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (!depth) return html.slice(start, m.index + 6);
    m = re.exec(html);
  }
  return html.slice(start);
}

const pictures = (html) => html.match(/<picture>[\s\S]*?<\/picture>/g) || [];

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The metadata block in the form the CLI reads (`<div><div>key</div><div>text</div></div>` rows):
 * each value as text, an image as its src, the paragraphs of a cell joined with a space.
 */
function cliMetadata(block) {
  const rows = [];
  const re = /<div><div>([\s\S]*?)<\/div><div>([\s\S]*?)<\/div><\/div>/g;
  let m = re.exec(block);
  while (m) {
    const img = m[2].match(/<img[^>]+src="([^"]+)"/);
    const value = img ? img[1] : text(m[2]);
    rows.push(`<div><div>${text(m[1])}</div><div>${value}</div></div>`);
    m = re.exec(block);
  }
  return `<div class="metadata">${rows.join('')}</div>`;
}

const attr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * Each section's section metadata as delivery serves it: the block is gone and the section div
 * carries it (`id`, `style` as classes, any other key as data-<key>).
 */
function sectionAttributes(main) {
  let out = '';
  let at = main.indexOf('<div');
  while (at >= 0) {
    const section = divAt(main, at);
    let body = section.slice(section.indexOf('>') + 1, -6);
    const meta = body.indexOf('<div class="section-metadata">');
    let attrs = '';
    if (meta >= 0) {
      const block = divAt(body, meta);
      body = body.replace(block, '');
      const re = /<div><div>([\s\S]*?)<\/div><div>([\s\S]*?)<\/div><\/div>/g;
      let m = re.exec(block);
      while (m) {
        const key = text(m[1]).toLowerCase().replace(/\s+/g, '-');
        const value = text(m[2]);
        if (key === 'id') attrs += ` id="${attr(value)}"`;
        else if (key === 'style') attrs += ` class="${attr(value.split(',').map((s) => s.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean).join(' '))}"`;
        else attrs += ` data-${key}="${attr(value)}"`;
        m = re.exec(block);
      }
    }
    out += `<div${attrs}>${body}</div>\n`;
    at = main.indexOf('<div', at + section.length);
  }
  return out;
}

let failed = 0;
for (const page of pages) {
  const web = page.endsWith('/') ? page : `${page}/`;
  const src = path.join('content', web, 'index.html');
  if (!fs.existsSync(src)) {
    console.log(`  FAIL ${web}: no ${src} (pull it first: da-pull.mjs ${web})`);
    failed += 1;
    continue;
  }
  const doc = fs.readFileSync(src, 'utf8');
  let main = doc.match(/<main>([\s\S]*)<\/main>/)?.[1] ?? doc;
  const at = main.indexOf('<div class="metadata">');
  let metadata = '';
  if (at >= 0) {
    metadata = divAt(main, at);
    main = main.replace(metadata, '');
  }

  let images = 'no images';
  const local = pictures(main);
  if (local.length) {
    const res = await fetch(`${WWW}${web}index.plain.html`);
    const served = res.ok ? pictures(await res.text()) : [];
    if (served.length === local.length) {
      let i = 0;
      main = main.replace(/<picture>[\s\S]*?<\/picture>/g, () => {
        const pic = served[i];
        i += 1;
        return pic.replace(/(src|srcset)="\.\/(media_[^"]+)"/g, `$1="${WWW}${web}$2"`);
      });
      images = `${local.length} images from www`;
    } else images = `${local.length} images left as DA's (www has ${served.length})`;
  }

  const out = path.join(OUT, web, 'index.plain.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${sectionAttributes(main.trim())}${metadata ? `<div>${cliMetadata(metadata)}</div>\n` : ''}`);
  console.log(`  ok   ${web} -> ${out} (${images})`);
}
process.exit(failed ? 1 : 0);
