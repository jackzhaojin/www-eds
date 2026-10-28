#!/usr/bin/env node
/**
 * Which block variations the example pages in content/ show, and which ones the site uses that
 * no example shows. content/ keeps example pages only since 2026-10-28 (DA is the source of
 * truth, content/README.md), chosen so that every block, variant, section style and template the
 * site uses is in at least one of them: an agent writing a page sees each one in real use.
 *
 *   node stardust/scripts/deploy/content-coverage.mjs                    what the examples show
 *   node stardust/scripts/deploy/content-coverage.mjs --site ../www-archive/site
 *        and what the site uses (every page in the www-archive snapshot) that no example shows
 *
 * A variation is a block (`block figure`), a variant (`variant figure.board`), a section style
 * (`style tint`) or a template (`template talk`). Explainer engines count as one (each article
 * writes its own), and so do the portfolio's per-project chapter accents (templates/portfolio).
 * Examples are DA documents (section styles in section-metadata blocks); the snapshot's pages
 * are served HTML (section styles as section classes). Run from the www-eds root. Exit 1 when
 * --site finds a variation no example shows.
 */
/* eslint-disable no-console, no-restricted-syntax, no-continue -- a dev script: it reports to the
   console and walks documents in loops */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const site = args.includes('--site') ? args[args.indexOf('--site') + 1] : null;
const ACCENTS = new Set([...fs.readFileSync('templates/portfolio/portfolio.css', 'utf8')
  .matchAll(/\.section\.chapter\.([a-z0-9-]+)\s*\{\s*--accent/g)].map(([, name]) => name));
const NOT_BLOCKS = new Set(['metadata', 'section-metadata']);
const className = (text) => text.trim().toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');

/** Every index page under a folder, as [path relative to it, html]. */
function pages(root, skip = () => false) {
  const out = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (skip(rel)) return;
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') out.push([rel, fs.readFileSync(full, 'utf8')]);
  });
  walk(root);
  return out;
}

/** The variations a page uses. `served` reads section styles from section classes. */
function variations(html, served) {
  const found = new Set();
  const style = (value) => {
    const name = className(value);
    if (name) found.add(`style ${ACCENTS.has(name) ? '(project accent)' : name}`);
  };
  const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
  let depth = 0;
  for (const [tag, attrs] of main.matchAll(/<div\b([^>]*)>|<\/div>/g)) {
    if (tag === '</div>') { depth -= 1; continue; }
    const classes = (attrs?.match(/class="([^"]+)"/)?.[1] || '').split(/\s+/).filter(Boolean);
    if (depth === 0 && served) classes.forEach(style);
    if (depth === 1 && classes.length && !NOT_BLOCKS.has(classes[0])) {
      const [block, ...variants] = classes;
      found.add(`block ${block}`);
      if (block === 'explainer') found.add('variant explainer.(engine)');
      else variants.forEach((variant) => found.add(`variant ${block}.${variant}`));
    }
    depth += 1;
  }
  if (!served) {
    for (const [, rows] of html.matchAll(/<div class="section-metadata">([\s\S]*?)<\/div><\/div><\/div>/g)) {
      for (const [, key, value] of rows.matchAll(/<div><div><p>([^<]+)<\/p><\/div><div><p>([^<]+)<\/p>/g)) {
        if (className(key) === 'style') value.split(',').forEach(style);
      }
    }
  }
  const template = served
    ? html.match(/<meta name="template" content="([^"]+)"/)?.[1]
    : html.slice(html.lastIndexOf('<div class="metadata">')).match(/<div><div><p>template<\/p><\/div><div><p>([^<]+)<\/p>/i)?.[1];
  if (template) found.add(`template ${className(template)}`);
  return found;
}

const examples = new Map();
pages('content', (rel) => rel.startsWith('docs')).forEach(([rel, html]) => {
  variations(html, false).forEach((v) => examples.set(v, [...(examples.get(v) || []), rel]));
});

if (!site) {
  [...examples.keys()].sort().forEach((v) => {
    const where = examples.get(v);
    console.log(`${v.padEnd(42)} ${where[0]}${where.length > 1 ? ` (+${where.length - 1})` : ''}`);
  });
  console.log(`content-coverage: ${examples.size} variations in ${pages('content', (rel) => rel.startsWith('docs')).length} example pages`);
  process.exit(0);
}

const used = new Map();
pages(site).forEach(([rel, html]) => {
  variations(html, true).forEach((v) => { if (!used.has(v)) used.set(v, rel); });
});
const missing = [...used.keys()].filter((v) => !examples.has(v)).sort();
missing.forEach((v) => console.log(`  no example: ${v.padEnd(40)} used on /${path.dirname(used.get(v))}/`));
console.log(`content-coverage: the site uses ${used.size} variations, the examples show ${[...used.keys()].length - missing.length}${missing.length ? `; ${missing.length} have none: pull a page that uses each (da-pull.mjs) and git add -f it` : ''}`);
process.exit(missing.length ? 1 : 0);
