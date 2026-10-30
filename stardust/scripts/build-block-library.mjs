#!/usr/bin/env node
/**
 * Builds the Experience Workspace (DA) library from the site's own content: one document per
 * block at /docs/library/blocks/<block>, the blocks sheet, the page templates at
 * /docs/library/templates/<name> and the templates sheet.
 *
 * Block documents: every variant is one section, an h2 naming it (the name the library shows),
 * the block table copied verbatim from a page in content/ (the raw source slice, so entities
 * and markup stay exactly as authored; long tables are shortened by dropping whole rows, never
 * by editing text), then a library-metadata block (description, searchtags). A group (a block
 * with the default content it needs, such as the writing filter link) is wrapped in
 * library-container-start and library-container-end, as the da-live library reads it
 * (adobe/da-live blocks/edit/da-library/helpers/index.js). Every example is pinned to a file,
 * so a run fails loudly when a page no longer holds it.
 *
 * Templates are whole pages with neutral placeholder text (never a real page's copy); only
 * shared components (the author box) are copied from the content.
 *
 * Usage: node stardust/scripts/build-block-library.mjs [--paths-out <file>] [--upload] [--preview]
 *   --paths-out  writes the documents' web paths (no .html) for deploy-batch.mjs --paths
 *   --upload     POSTs the two sheets to the DA source API (documents go through deploy-batch.mjs)
 *   --preview    previews the two sheets on aem.page (never publishes)
 * Token: DA_TOKEN, else the da-auth cache (~/.aem/da-token.json). Never printed.
 * Writes: content/docs/library/blocks/<block>.html, content/docs/library/blocks.json,
 *   content/docs/library/templates/<name>.html, content/docs/library/templates.json, and runs
 *   stardust/scripts/deploy/sanitise.js on every document (non-ASCII as entities).
 */
/* eslint-disable no-console, import/no-extraneous-dependencies -- a dev script: it reports to the
   console and uses the repo's devDependencies (cheerio) */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(root, 'package.json'));
const cheerio = require('cheerio');

const ORG = 'jackzhaojin';
const SITE = 'www-eds';
const REF = 'main';
const CONTENT = path.join(root, 'content');
const OUT = path.join(CONTENT, 'docs/library');
const DA_CONTENT = `https://content.da.live/${ORG}/${SITE}`;
const args = new Set(process.argv.slice(2));

const DS = 'design-systems/v3/index.html';
const PF = 'portfolio/index.html';
const HOME = 'index.html';
const W = (slug) => `writing/${slug}/index.html`;

/* ------------------------------------------------------------ verbatim examples */

const parsed = new Map();
function load(file) {
  if (!parsed.has(file)) {
    // content/ keeps example pages only since 2026-10-28 (DA is the source of truth)
    if (!fs.existsSync(path.join(CONTENT, file))) {
      throw new Error(`content/${file} isn't local: run node stardust/scripts/deploy/da-pull.mjs --library first`);
    }
    const src = fs.readFileSync(path.join(CONTENT, file), 'utf8');
    parsed.set(file, { src, $: cheerio.load(src, { sourceCodeLocationInfo: true }) });
  }
  return parsed.get(file);
}

const slice = (src, el) => {
  const { startOffset, endOffset } = el.sourceCodeLocation;
  return src.slice(startOffset, endOffset);
};

let pages;
function allPages(dir = CONTENT) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return p === OUT || e.name === 'media' ? [] : allPages(p);
    return e.name.endsWith('.html') ? [path.relative(CONTENT, p)] : [];
  }).sort();
}

/**
 * The block with exactly this class string, verbatim: in file from, or else in any page (the
 * portfolio moves between pages). text keeps the blocks whose text holds it; nth picks among
 * the matches (default 0), smallest picks the shortest; rows keeps only those rows (whole
 * rows, in order).
 */
function pick({
  from, cls, text, nth = 0, smallest = false, rows,
}) {
  pages ||= allPages();
  const where = from ? [from] : pages;
  const found = where.flatMap((file) => {
    const { src, $ } = load(file);
    return $('main > div > div[class]').toArray()
      .filter((el) => $(el).attr('class') === cls && (!text || $(el).text().includes(text)))
      .map((el) => ({
        file, src, $, el,
      }));
  });
  const label = `${from || 'content'}: block "${cls}"${text ? ` holding "${text}"` : ''}`;
  if (!found.length) throw new Error(`${label} not found`);
  const hit = smallest
    ? found.slice().sort((a, b) => slice(a.src, a.el).length - slice(b.src, b.el).length)[0]
    : found[nth];
  if (!hit) throw new Error(`${label} number ${nth} not found`);
  const { src, $, el } = hit;
  if (!rows) return slice(src, el);
  const all = $(el).children('div').toArray();
  rows.forEach((i) => { if (!all[i]) throw new Error(`${label} has no row ${i}`); });
  const { startOffset, startTag } = el.sourceCodeLocation;
  const open = src.slice(startOffset, startTag.endOffset);
  return `${open}${rows.map((i) => slice(src, all[i])).join('')}</div>`;
}

/** Default content verbatim: the first element matching selector in main's sections, in file
 * from or else in any page. */
function pickContent({ from, selector }) {
  pages ||= allPages();
  const hit = (from ? [from] : pages).map((file) => {
    const { src, $ } = load(file);
    const el = $(`main > div > ${selector}`).toArray()[0];
    return el && slice(src, el);
  }).find(Boolean);
  if (!hit) throw new Error(`${from || 'content'}: nothing matches "${selector}"`);
  return hit;
}

/* ------------------------------------------------------------ authored markup helpers */

const cell = (html) => `<div>${html}</div>`;
const row = (...cells) => `<div>${cells.map(cell).join('')}</div>`;
const block = (cls, rows) => `<div class="${cls}">${rows.join('')}</div>`;
const kv = (pairs) => pairs.map(([k, v]) => row(`<p>${k}</p>`, v.startsWith('<') ? v : `<p>${v}</p>`));
const libraryMetadata = (description, tags) => block('library-metadata', kv([
  ['description', description],
  ['searchtags', tags],
]));

/* ------------------------------------------------------------ the blocks */

// name: the library's name for the block; variants: one section each.
// A variant is { name, description, tags } plus the example (pick options), or group: [...]
// (pick options or { content }) for a block that needs default content beside it.
const BLOCKS = {
  'author-box': {
    name: 'Author box',
    variants: [
      {
        name: 'Author box',
        from: W('2026-02-05-reusable-ai-development-modules'),
        cls: 'author-box',
        description: 'Who wrote the page: the initials, the name, a short bio and profile links, placed in the Related section that closes an article.',
        tags: 'author, byline, bio, profile, about, related',
      },
    ],
  },
  callout: {
    name: 'Callout',
    variants: [
      {
        name: 'Callout',
        from: DS,
        cls: 'callout',
        text: 'Hub pages are not built',
        description: 'A short labelled note inside body copy, such as Note, for a side remark the reader should not miss.',
        tags: 'note, aside, tip, remark, label',
      },
      {
        name: 'Callout (warn)',
        from: DS,
        cls: 'callout warn',
        text: 'Numbers in brackets',
        description: 'A caution inside body copy, on a raised surface with a red label, for a warning or a claim not yet verified.',
        tags: 'caution, warning, alert, note, red',
      },
    ],
  },
  cards: {
    name: 'Cards',
    variants: [
      {
        name: 'Cards (list)',
        from: HOME,
        cls: 'cards list',
        description: 'An open row of linked items under a strong rule, each a bold linked title, a line break and a short note, like the home page selected work links.',
        tags: 'cards, links, list, selected work, home',
      },
      {
        name: 'Cards (tool)',
        from: DS,
        cls: 'cards tool',
        text: 'jackzhaojin.github.io',
        description: 'A grid of compact repository cards, each one link: the bold repo name, a note and the date range in italics.',
        tags: 'cards, repo, repository, github, grid, tools',
      },
      {
        name: 'Cards (project)',
        cls: 'cards project',
        text: 'Lava Dash',
        rows: [0, 1, 3],
        description: 'A grid of project cards with a dates line, a heading, a summary and typed links; a last row without a heading is the note under the grid.',
        tags: 'cards, projects, games, grid, links',
      },
      {
        name: 'Cards (repo)',
        cls: 'cards repo',
        description: 'A grid of repository cards where each card is one link: the linked dates line, the repo heading and a summary.',
        tags: 'cards, repo, repository, github, grid',
      },
    ],
  },
  carousel: {
    name: 'Carousel',
    variants: [
      {
        name: 'Carousel',
        cls: 'carousel',
        rows: [0, 1, 2, 3, 4],
        description: 'A row of captioned slides that scrolls sideways with previous and next controls; a Proof links block right after it shows links under the controls.',
        tags: 'carousel, slides, slider, gallery, images, captions',
      },
    ],
  },
  'chapter-head': {
    name: 'Chapter head',
    variants: [
      {
        name: 'Chapter head',
        from: DS,
        cls: 'chapter-head',
        text: 'The company-of-0 experiment',
        description: 'The opening of a portfolio project chapter: the title with its italic subtitle, the meta line, the build method and the thesis; the section style sets its accent.',
        tags: 'chapter, project, portfolio, heading, numeral, intro',
      },
    ],
  },
  chapters: {
    name: 'Chapters',
    variants: [
      {
        name: 'Chapters',
        from: DS,
        cls: 'chapters',
        description: 'Timestamps and titles for a video, one row per chapter, shown as an ordered list with the times in mono.',
        tags: 'chapters, video, timestamps, youtube, contents',
      },
    ],
  },
  code: {
    name: 'Code',
    variants: [
      {
        name: 'Code',
        from: W('2026-08-15-anima-mesh-company-of-zero'),
        cls: 'code',
        smallest: true,
        description: 'A code excerpt on the night ground with a bar naming the file and lines and linking to the source, its lines numbered and colored.',
        tags: 'code, snippet, source, github, syntax, excerpt',
      },
      {
        name: 'Code (wrap)',
        from: W('2026-04-12-two-ai-skills-team-enablement'),
        cls: 'code wrap',
        smallest: true,
        description: 'A code excerpt whose bar label wraps while the source link stays on one line, for a long file path.',
        tags: 'code, snippet, long path, wrap, bar',
      },
      {
        name: 'Code (stack)',
        from: W('2025-07-07-ai-coded-nextjs-agent-cicd-infrastructure'),
        cls: 'code stack',
        smallest: true,
        description: 'A code excerpt whose bar stacks the file label over the source link on phones.',
        tags: 'code, snippet, phone, mobile, stack',
      },
      {
        name: 'Code (prose, stack)',
        from: W('2025-07-07-ai-coded-nextjs-agent-cicd-infrastructure'),
        cls: 'code prose stack',
        description: 'A code excerpt whose long lines wrap under their text with a hanging indent instead of scrolling, with the stacked bar on phones.',
        tags: 'code, wrap, log, notes, script, prose',
      },
      {
        name: 'Code (prose, plain, stack)',
        from: W('2025-07-11-scaling-ai-coding-delivery-methodology'),
        cls: 'code prose plain stack',
        smallest: true,
        description: 'Wrapping lines without syntax colors, for a prompt or other plain text kept in a source file, with the stacked bar on phones.',
        tags: 'code, prompt, plain, no colors, wrap, text',
      },
      {
        name: 'Code (wrap, prose)',
        from: W('2026-04-12-two-ai-skills-team-enablement'),
        cls: 'code wrap prose',
        description: 'Wrapping lines and a wrapping bar label, for a prompt log or notes file with a long path.',
        tags: 'code, prompt log, markdown, wrap, prose',
      },
    ],
  },
  columns: {
    name: 'Columns',
    variants: [
      {
        name: 'Columns',
        from: HOME,
        cls: 'columns',
        description: 'Two even columns in one row, each with a heading, text and a link, like the home page talks and writing pair.',
        tags: 'columns, two columns, side by side, grid, layout',
      },
    ],
  },
  compare: {
    name: 'Compare',
    variants: [
      {
        name: 'Compare',
        from: W('2026-10-25-eds-migration-two-goal-prompts'),
        cls: 'compare',
        smallest: true,
        description: 'Tabs over screenshots, one tab per image with its caption, to show the same screen in different states.',
        tags: 'compare, tabs, screenshots, before after, images',
      },
      {
        name: 'Compare (narrow)',
        from: W('2025-07-06-ai-coded-nextjs-agent-release-1'),
        cls: 'compare narrow',
        description: 'Tabs over portrait screenshots kept at most 560px wide, each opening full size.',
        tags: 'compare, tabs, portrait, screenshots, narrow',
      },
      {
        name: 'Compare (touch)',
        from: W('2026-05-24-theming-eds-with-google-stitch'),
        cls: 'compare touch',
        description: 'Tabs over screenshots with tabs at least 44px tall on phones, for comparing stages on a touch screen.',
        tags: 'compare, tabs, screenshots, touch, mobile',
      },
    ],
  },
  credentials: {
    name: 'Credentials',
    variants: [
      {
        name: 'Credentials',
        from: 'certifications/index.html',
        cls: 'credentials',
        rows: [0, 1],
        description: 'A two-column list of certifications, one row each: the issuer and badge, then the linked credential name, its dates and a verification link.',
        tags: 'certifications, credentials, badges, credly, verify',
      },
    ],
  },
  'cta-band': {
    name: 'CTA band',
    variants: [
      {
        name: 'CTA band',
        from: DS,
        cls: 'cta-band',
        text: 'Book a talk.',
        description: 'A closing panel with a short heading, one sentence and buttons (a bold link is primary, an italic link secondary), an optional contact line and profile links.',
        tags: 'cta, call to action, buttons, contact, closing, band',
      },
    ],
  },
  'data-table': {
    name: 'Data table',
    variants: [
      {
        name: 'Data table',
        from: W('2025-10-05-mcp-server-for-eds-da-live'),
        cls: 'data-table',
        smallest: true,
        description: 'A table of text, one block row per table row, the first row the header, scrolling sideways on narrow screens.',
        tags: 'table, data, grid, rows, columns',
      },
      {
        name: 'Data table (nowrap)',
        from: W('2026-01-29-playwright-stakeholder-demos'),
        cls: 'data-table nowrap',
        description: 'A table whose last column stays on one line, for a short value such as a time.',
        tags: 'table, nowrap, time, duration',
      },
      {
        name: 'Data table (cheat, stack)',
        from: W('2025-06-12-azure-rbac-cicd-for-ai-agents'),
        cls: 'data-table cheat stack',
        rows: [0, 1, 2, 3],
        description: 'A cheat sheet in smaller type with the first column in strong ink, each row stacking its cells on phones.',
        tags: 'table, cheat sheet, reference, stack, mobile',
      },
      {
        name: 'Data table (rank, stack)',
        from: W('2025-04-13-vibe-coding-star-story-generator'),
        cls: 'data-table rank stack',
        rows: [0, 1, 2, 3],
        description: 'A ranked list as a table, the first column a faint mono rank and bold words in strong ink, each row stacking on phones.',
        tags: 'table, rank, ranking, top list, stack',
      },
      {
        name: 'Data table (caption, row-heads)',
        from: W('2025-10-12-da-live-mcp-across-ai-platforms'),
        cls: 'data-table caption row-heads',
        rows: [0, 1, 2, 5],
        description: 'A table whose first cell in each row heads that row, with the last row shown as a caption under it.',
        tags: 'table, caption, row headers, matrix',
      },
      {
        name: 'Data table (sr-caption, row-heads)',
        from: W('2026-10-25-eds-migration-two-goal-prompts'),
        cls: 'data-table sr-caption row-heads',
        smallest: true,
        description: 'A table whose first cell in each row heads that row, with a last-row caption read by screen readers only.',
        tags: 'table, row headers, accessible, caption, screen reader',
      },
      {
        name: 'Data table (sr-caption, fill-in, span-first)',
        from: W('2025-09-01-aem-caching-production-architectures'),
        cls: 'data-table sr-caption fill-in span-first',
        description: 'A template table to fill in, with fixed column widths and empty rows that keep their height; a row one cell short continues the first cell above it.',
        tags: 'table, template, worksheet, fill in, merged cells',
      },
      {
        name: 'Data table (mono-head, caption)',
        from: DS,
        cls: 'data-table mono-head caption',
        text: 'text on bg',
        rows: [0, 1, 3, 5, 10],
        description: 'The design system table: mono uppercase headers, the first column in ink and a caption from the last row, at least 36rem wide so phones scroll it.',
        tags: 'table, design system, mono, caption, comparison',
      },
      {
        name: 'Data table (mono-head, compact, caption)',
        from: DS,
        cls: 'data-table mono-head compact caption',
        text: 'Counts by format',
        description: 'The design system table without a minimum width, for a short table of a few narrow columns, with a caption from the last row.',
        tags: 'table, design system, compact, mono, caption',
      },
      {
        name: 'Data table (mono-head, span-first, row-heads, sr-caption)',
        from: DS,
        cls: 'data-table mono-head span-first row-heads sr-caption',
        rows: [0, 1, 2, 3, 8, 9, 13],
        description: 'The design system table with row headers, where a short row continues the first cell above it, and a caption for screen readers.',
        tags: 'table, design system, merged cells, row headers, grouped rows',
      },
    ],
  },
  divider: {
    name: 'Divider',
    variants: [
      {
        name: 'Divider (rule)',
        from: DS,
        cls: 'divider rule',
        text: 'Credentials',
        description: 'A hairline rule with a mono label between parts of a page; rule is the default look, and a second cell adds a second label.',
        tags: 'divider, rule, separator, hairline, section break',
      },
      {
        name: 'Divider (year)',
        from: DS,
        cls: 'divider year',
        description: 'A large outlined year numeral with a mono note under it, to open a year in a long history.',
        tags: 'divider, year, numeral, timeline, history',
      },
    ],
  },
  facts: {
    name: 'Facts',
    variants: [
      {
        name: 'Facts',
        from: DS,
        cls: 'facts',
        text: 'Project facts',
        description: 'Key and value rows under a page head or a project, as a real table; a first one-cell row is a caption for screen readers.',
        tags: 'facts, key value, details, metadata, table',
      },
      {
        name: 'Facts (caption)',
        from: DS,
        cls: 'facts caption',
        smallest: true,
        description: 'Key facts with the caption shown above the rows, as in an inverse feature panel.',
        tags: 'facts, key facts, caption, panel, details',
      },
    ],
  },
  faq: {
    name: 'FAQ',
    variants: [
      {
        name: 'FAQ',
        from: DS,
        cls: 'faq',
        text: 'Questions about the blog',
        description: 'Questions and answers as native disclosures, after an optional heading row; a third cell reading open shows that answer open on load.',
        tags: 'faq, questions, answers, accordion, disclosure',
      },
    ],
  },
  figure: {
    name: 'Figure',
    variants: [
      {
        name: 'Figure (YouTube video)',
        from: W('2026-02-05-reusable-ai-development-modules'),
        cls: 'figure',
        description: 'A YouTube video that plays in place, from one link paragraph (its text is the player title) and a caption; no variant word is needed.',
        tags: 'video, youtube, embed, player, figure',
      },
      {
        name: 'Figure (board)',
        from: W('2025-06-04-seven-aem-capabilities-tradeoffs'),
        cls: 'figure board',
        smallest: true,
        description: 'A diagram on a white ground with a hairline, then its caption; board is the default look for an image.',
        tags: 'figure, image, diagram, board, caption',
      },
      {
        name: 'Figure (board, open)',
        from: W('2025-06-12-azure-rbac-cicd-for-ai-agents'),
        cls: 'figure board open',
        smallest: true,
        description: 'A diagram on a white ground that opens full size on click, for a board too detailed to read at column width.',
        tags: 'figure, diagram, zoom, full size, lightbox',
      },
      {
        name: 'Figure (board, compact, open)',
        from: W('2025-06-12-azure-rbac-cicd-for-ai-agents'),
        cls: 'figure board compact open',
        description: 'A diagram kept at most 560px wide and left-aligned, opening full size on click.',
        tags: 'figure, diagram, small, compact, full size',
      },
      {
        name: 'Figure (board, narrow)',
        from: W('2026-06-28-patterns-of-work'),
        cls: 'figure board narrow',
        description: 'A photo and its caption kept at most 520px wide and centered.',
        tags: 'figure, photo, narrow, centered, image',
      },
      {
        name: 'Figure (board, tall)',
        from: W('2025-10-12-da-live-mcp-across-ai-platforms'),
        cls: 'figure board tall',
        description: 'A tall image at its own size, at most 560px wide.',
        tags: 'figure, tall, portrait, image, diagram',
      },
      {
        name: 'Figure (board, native)',
        from: W('2026-03-23-eds-hlx-admin-agentic-config'),
        cls: 'figure board native',
        description: 'An image at its own size, never upscaled and left-aligned, for a small image that blurs when stretched.',
        tags: 'figure, image, native size, small, left',
      },
      {
        name: 'Figure (shot)',
        from: W('2025-07-11-scaling-ai-coding-delivery-methodology'),
        cls: 'figure shot',
        smallest: true,
        description: 'A product screenshot in a hairline frame that opens full size on click.',
        tags: 'figure, screenshot, ui, product, full size',
      },
      {
        name: 'Figure (shot, narrow)',
        from: W('2025-07-06-ai-coded-nextjs-agent-release-1'),
        cls: 'figure shot narrow',
        smallest: true,
        description: 'A portrait screenshot kept at most 560px wide that opens full size on click.',
        tags: 'figure, screenshot, portrait, phone, narrow',
      },
      {
        name: 'Figure (shot, slim)',
        from: W('2025-07-11-scaling-ai-coding-delivery-methodology'),
        cls: 'figure shot slim',
        description: 'A portrait screenshot kept at most 460px wide that opens full size on click.',
        tags: 'figure, screenshot, portrait, slim, narrow',
      },
      {
        name: 'Figure (page)',
        from: W('2026-07-21-four-frontier-models-one-prompt'),
        cls: 'figure page',
        smallest: true,
        description: 'A photographed notebook page at most 420px wide that opens full size on click.',
        tags: 'figure, notebook, handwritten, photo, page',
      },
    ],
  },
  'fine-print': {
    name: 'Fine print',
    variants: [
      {
        name: 'Fine print',
        from: W('2025-04-13-vibe-coding-star-story-generator'),
        cls: 'fine-print',
        description: 'Small faint text that records where a piece comes from: where it was first published, the code and its versions.',
        tags: 'fine print, source, first published, credits, provenance',
      },
    ],
  },
  frame: {
    name: 'Frame',
    variants: [
      {
        name: 'Frame (diagram)',
        from: DS,
        cls: 'frame diagram',
        text: 'Cloud tier',
        description: 'A full-width bordered diagram on the paper ground with a mono caption; link the image to its full-size file so it opens on click.',
        tags: 'frame, diagram, figure, architecture, caption',
      },
      {
        name: 'Frame (sub)',
        from: DS,
        cls: 'frame sub',
        description: 'A smaller bordered figure with a mono caption inside a portfolio story, which moves it into place.',
        tags: 'frame, image, small, story, caption',
      },
      {
        name: 'Frame (sub, portrait)',
        cls: 'frame sub portrait',
        description: 'A small portrait image capped at 340px with a mono caption, inside a portfolio story.',
        tags: 'frame, portrait, photo, story, small',
      },
    ],
  },
  hero: {
    name: 'Hero',
    variants: [
      {
        name: 'Hero (home)',
        from: HOME,
        cls: 'hero home',
        description: 'The home page introduction: the title, the positioning line, the summary and the actions, with a side note holding a label, a banner, an identity list and a closing link.',
        tags: 'hero, home, intro, banner, header',
      },
      {
        name: 'Hero (writing)',
        cls: 'hero writing',
        description: 'The writing hub head: a breadcrumb list, the title and a summary, with space for the hub art beside the title.',
        tags: 'hero, writing, hub, listing, breadcrumb',
      },
      {
        name: 'Hero (talks)',
        cls: 'hero talks',
        description: 'The talks hub head: a breadcrumb list, the title and a summary, with space for the hub art beside the title.',
        tags: 'hero, talks, hub, listing, breadcrumb',
      },
      {
        name: 'Hero (certifications)',
        from: 'certifications/index.html',
        cls: 'hero certifications',
        description: 'The certifications hub head: a breadcrumb list, the title, a summary and a small note under it, with space for the hub art.',
        tags: 'hero, certifications, hub, breadcrumb, note',
      },
      {
        name: 'Hero (page)',
        from: 'privacy/index.html',
        cls: 'hero page',
        description: 'A plain page head without art: a breadcrumb list, the title and a summary, for pages such as Privacy.',
        tags: 'hero, page, breadcrumb, title, static',
      },
    ],
  },
  'jump-links': {
    name: 'Jump links',
    variants: [
      {
        name: 'Jump links',
        from: PF,
        cls: 'jump-links',
        description: 'In-page navigation to the parts of a long page, one list of anchor links; the label row names it for screen readers.',
        tags: 'jump links, anchors, in-page nav, table of contents, navigation',
      },
    ],
  },
  pagination: {
    name: 'Pagination',
    variants: [
      {
        name: 'Pagination',
        from: DS,
        cls: 'pagination',
        text: 'Previous',
        description: 'Numbered page links in 44px boxes, Previous, the page numbers and Next, in one list; the bold item is the current page.',
        tags: 'pagination, pages, previous, next, navigation',
      },
    ],
  },
  panel: {
    name: 'Panel',
    variants: [
      {
        name: 'Panel (edge)',
        cls: 'panel edge',
        smallest: true,
        description: 'A chapter-closing panel: a label row, a row of columns with a heading and a paragraph each, and an optional closing line.',
        tags: 'panel, edge, context, evidence, columns, closing',
      },
      {
        name: 'Panel (pulse)',
        cls: 'panel pulse',
        description: 'A heartbeat panel whose counters (bold value, then label) count up and whose pulse line draws on scroll-in and on replay.',
        tags: 'panel, pulse, counters, heartbeat, animation, numbers',
      },
      {
        name: 'Panel (glossary)',
        cls: 'panel glossary',
        rows: [0, 1, 2, 3, 4, 8],
        description: 'Words that open their definitions on click, one row per word and definition, and a last row with the resting text.',
        tags: 'panel, glossary, terms, definitions, vocabulary',
      },
      {
        name: 'Panel (compare)',
        cls: 'panel compare',
        text: 'One eval engine, two deployments',
        description: 'Labelled before, middle and after rows (tag, then text); the stages between the first and the last are the accented middle.',
        tags: 'panel, compare, before after, stages, versions',
      },
      {
        name: 'Panel (wire)',
        cls: 'panel wire',
        description: 'Two named nodes on a wire with a request dot moving between them, and a note row under them.',
        tags: 'panel, wire, request, diagram, nodes',
      },
      {
        name: 'Panel (flow)',
        cls: 'panel flow',
        description: 'A chain of nodes with arrows between them, one cell per node with its name and a note.',
        tags: 'panel, flow, architecture, chain, nodes, arrows',
      },
      {
        name: 'Panel (bakeoff)',
        cls: 'panel bakeoff',
        description: 'Scored bars, one row per entry and its score, that grow to the score over the max on scroll-in and on replay.',
        tags: 'panel, bakeoff, scores, bar chart, ranking',
      },
    ],
  },
  'proof-links': {
    name: 'Proof links',
    variants: [
      {
        name: 'Proof links',
        from: DS,
        cls: 'proof-links',
        text: 'Stardust Explained, video',
        description: 'A row of typed links under a portfolio story, each with a line icon for a repository, a post, a video or a live page.',
        tags: 'links, proof, repo, video, live, evidence',
      },
      {
        name: 'Proof links, with a tag',
        cls: 'proof-links',
        text: 'private by design',
        description: 'Proof links with a non-link tag written as inline code, and a title row for the tag tooltip.',
        tags: 'links, proof, tag, private, tooltip',
      },
    ],
  },
  rail: {
    name: 'Rail',
    variants: [
      {
        name: 'Rail',
        from: W('2025-04-13-vibe-coding-star-story-generator'),
        cls: 'rail',
        rows: [0, 1, 2, 5],
        description: 'The article outline in the right rail: one row per part with an optional thumbnail, the bold part label and a link to the part, and a last row of closing links.',
        tags: 'rail, outline, on this page, toc, article, navigation',
      },
    ],
  },
  'row-list': {
    name: 'Row list',
    variants: [
      {
        name: 'Row list',
        from: DS,
        cls: 'row-list',
        text: 'AI agents, skills and MCP servers',
        description: 'A ruled list of rows, each a short mono kind, a title (usually a link) and a note, for related reading or a short history.',
        tags: 'list, related, rows, links, history',
      },
      {
        name: 'Row list (talks)',
        from: 'talks/index.html',
        cls: 'row-list talks',
        rows: [0, 1],
        description: 'The talks list, one row per talk (a talk has no page of its own), each shown as an animated card: the date and kind; the title linked straight to the recording, else the event page, then the event line, the description, the links out and any status; the row anchors. A talk linking its project page plays that project scene.',
        tags: 'talks, presentations, recordings, events, list, hub',
      },
      {
        name: 'Row list (projects, dynamic)',
        from: PF,
        cls: 'row-list projects dynamic',
        description: 'The portfolio project list, generated from the project pages: author only its Source row, never the rows.',
        tags: 'projects, portfolio, listing, index, generated, dynamic',
      },
      {
        name: 'Row list (related, dynamic)',
        from: 'portfolio/shadow-pivot/index.html',
        cls: 'row-list related dynamic',
        description: 'On a project page, under a Related heading: the articles that link to this page, generated from the writing index. Author only its Source row.',
        tags: 'related, articles, writing, backlinks, generated, dynamic',
      },
    ],
  },
  'section-metadata': {
    name: 'Section metadata',
    variants: [
      {
        name: 'Section metadata (wide)',
        from: 'privacy/index.html',
        cls: 'section-metadata',
        text: 'wide',
        description: 'The last block of a section: its style row sets how the section looks. On a static page, wide runs the section across the full content width, as the hero does, instead of the reading column.',
        tags: 'section, metadata, style, wide, full width, width, layout',
      },
      {
        name: 'Section metadata (alt)',
        from: 'certifications/index.html',
        cls: 'section-metadata',
        text: 'alt',
        smallest: true,
        description: 'The last block of a section: alt gives the section the alternate band background.',
        tags: 'section, metadata, style, alt, band, background',
      },
      {
        name: 'Section metadata (related)',
        from: W('2026-07-21-four-frontier-models-one-prompt'),
        cls: 'section-metadata',
        text: 'related',
        description: 'The last block of the section that closes an article (the author box and related reading): related styles it as the end of the article column.',
        tags: 'section, metadata, style, related, article, end',
      },
    ],
  },
  series: {
    name: 'Series',
    variants: [
      {
        name: 'Series',
        from: W('2025-07-06-ai-coded-nextjs-agent-release-1'),
        cls: 'series',
        description: 'The parts of a multi-part series at the end of an article head: the label, the series name for screen readers, then one linked part per row.',
        tags: 'series, parts, multi-part, navigation, article',
      },
    ],
  },
  showcase: {
    name: 'Showcase',
    variants: [
      {
        name: 'Showcase (feature)',
        from: HOME,
        cls: 'showcase feature',
        description: 'Text beside a framed figure, as in the home page selected work: a heading, a lead, body text and a link, with an image and its caption.',
        tags: 'showcase, feature, media, image, text, home',
      },
      {
        name: 'Showcase (story)',
        from: DS,
        cls: 'showcase story',
        description: 'A portfolio project story with the media left of the text: the meta line, the heading, the pattern line, the body and a framed image with its caption.',
        tags: 'showcase, story, portfolio, project, media',
      },
      {
        name: 'Showcase (flip)',
        from: DS,
        cls: 'showcase flip',
        description: 'A portfolio story with the media right of the text; a Panel, Tabs, Timeline (ladder), Frame (sub), Stat chips or Proof links block right after it in the section moves inside.',
        tags: 'showcase, story, flip, portfolio, media right',
      },
      {
        name: 'Showcase (story, wide)',
        cls: 'showcase story wide',
        text: 'Cloud first, one private brain per instance',
        description: 'A story with the centered text over a full-width diagram; the id row anchors the story and the label row names the diagram link.',
        tags: 'showcase, story, wide, diagram, full width',
      },
      {
        name: 'Showcase (story, wide, tall)',
        cls: 'showcase story wide tall',
        description: 'A wide story whose tall diagram is capped at 680px.',
        tags: 'showcase, story, wide, tall, diagram',
      },
      {
        name: 'Showcase (story, wide, flip)',
        cls: 'showcase story wide flip',
        description: 'A wide story with the media above the text; with an empty media cell, the first panel, tabs or timeline after it is the media.',
        tags: 'showcase, story, wide, flip, media above',
      },
      {
        name: 'Showcase (story) with a talk',
        from: 'portfolio/aem-rockstar-2024/index.html',
        cls: 'showcase story',
        text: 'the winning pitch',
        description: "A talk on its project's page (talks have no pages of their own): the date and kind of talk as the meta line, the talk title, its description, and the recording (a title paragraph and a YouTube link) as a click-to-load video. The id row is the talk's anchor; a Proof links block right after it holds the event page and slides.",
        tags: 'talk, recording, video, youtube, conference, portfolio, project',
      },
    ],
  },
  'stat-chips': {
    name: 'Stat chips',
    variants: [
      {
        name: 'Stat chips',
        from: DS,
        cls: 'stat-chips',
        text: 'gated write paths',
        description: 'A wrapping row of evidence chips under a portfolio story, one list item per chip: the bold value, then its label.',
        tags: 'stats, chips, numbers, evidence, metrics',
      },
    ],
  },
  stats: {
    name: 'Stats',
    variants: [
      {
        name: 'Stats (lifetime)',
        cls: 'stats lifetime',
        description: 'A centered panel of counters that count up once on scroll-in, a label row, the counters and a closing note; a bold and italic value is the accented one.',
        tags: 'stats, counters, numbers, metrics, lifetime',
      },
    ],
  },
  switch: {
    name: 'Switch',
    variants: [
      {
        name: 'Switch',
        from: W('2026-09-20-aem-edge-functions-google-sign-in'),
        cls: 'switch',
        description: 'Two or more modes of one explainer behind a radio switch, one row per mode with its label and columns of code, images and console lines.',
        tags: 'switch, toggle, modes, explainer, code, compare',
      },
    ],
  },
  tabs: {
    name: 'Tabs',
    variants: [
      {
        name: 'Tabs (diagram-deck)',
        cls: 'tabs diagram-deck',
        rows: [0, 1, 2, 3],
        description: 'A deck of diagrams behind numbered tabs, one pane at a time, each pane an eyebrow, a heading, a summary and the linked diagram.',
        tags: 'tabs, diagrams, deck, slides, panes',
      },
    ],
  },
  'talk-list': {
    name: 'Talk list',
    variants: [
      {
        name: 'Talk list',
        from: W('2026-10-10-adaptto-2026-25-talks'),
        cls: 'talk-list',
        rows: [0, 1],
        description: 'A talk-by-talk conference recap, one row per talk: the anchor, the numbered heading and meta line, the slide with its caption, and the labelled notes.',
        tags: 'talks, conference, recap, slides, notes',
      },
    ],
  },
  timeline: {
    name: 'Timeline',
    variants: [
      {
        name: 'Timeline (ladder)',
        from: DS,
        cls: 'timeline ladder',
        text: 'Era 1',
        description: 'A release history: one-cell era titles and two-cell rungs, each a version beside its heading, date and summary.',
        tags: 'timeline, releases, versions, history, ladder',
      },
      {
        name: 'Timeline (gantt)',
        from: PF,
        cls: 'timeline gantt',
        rows: [0, 1, 2, 3, 4, 5, 6, 14, 15, 16, 17],
        description: 'Projects over time drawn as bars from config rows (range, now, scale) and one row per project: label, chapter id, start, end and ongoing.',
        tags: 'timeline, gantt, projects, chart, dates',
      },
      {
        name: 'Timeline (milestones)',
        from: PF,
        cls: 'timeline milestones',
        rows: [0, 1, 2, 6],
        description: 'Career notes as date and note rows, with a last one-cell closing line.',
        tags: 'timeline, milestones, career, dates, history',
      },
    ],
  },
  transcript: {
    name: 'Transcript',
    variants: [
      {
        name: 'Transcript',
        from: DS,
        cls: 'transcript',
        description: 'The full transcript of a video in a closed details panel that stays in the page for search; timestamps at the start of a paragraph show in faint mono.',
        tags: 'transcript, video, captions, text, details',
      },
      {
        name: 'Transcript (open)',
        from: DS,
        cls: 'transcript open',
        description: 'The transcript panel, open on load.',
        tags: 'transcript, video, open, captions',
      },
    ],
  },
  'writing-index': {
    name: 'Writing index',
    variants: [
      {
        name: 'Writing index',
        cls: 'writing-index',
        description: 'The writing hub list, generated from the articles and their listing metadata: author only its Source row, never the rows.',
        tags: 'writing, articles, listing, index, generated, hub',
      },
      {
        name: 'Writing index (with filter)',
        group: [
          { content: { selector: 'p:has(a[href*="/widgets/writing-filter/"])' } },
          { cls: 'writing-index' },
        ],
        description: 'The writing hub list with the topic and search filter bar above it, which the writing-filter widget link builds.',
        tags: 'writing, filter, search, topics, listing, widget',
      },
    ],
  },
};

/* ------------------------------------------------------------ the templates */

const SOCIAL = 'https://content.da.live/jackzhaojin/www-eds/media/site/site-social.png';
const SOCIAL_ALT = 'Jack Jin: Adobe Experience Manager Champion, AI agents and Edge Delivery Services';
const socialImage = `<picture><source srcset="${SOCIAL}"><source srcset="${SOCIAL}" media="(min-width: 600px)"><img src="${SOCIAL}" alt="${SOCIAL_ALT}" loading="lazy"></picture>`;
const section = (...parts) => `<div>${parts.join('')}</div>`;
const metadata = (pairs) => block('metadata', kv(pairs));
const sectionMetadata = (pairs) => block('section-metadata', kv(pairs));

// key: the name an author sees in the templates list; name: the document under templates/.
const TEMPLATES = [
  {
    key: 'Article',
    name: 'article',
    body: () => [
      section(
        '<ol><li><a href="/">Home</a></li><li><a href="/writing/">Technical Writing</a></li><li>Short title</li></ol>',
        '<h1>Article title</h1>',
        '<p>By <a href="/">Jack Jin</a> &middot; Month D, YYYY &middot; N min read</p>',
        '<p>One-sentence summary: what the article shows and why it matters.</p>',
      ),
      section(block('rail', [
        row('', '<p><strong>Part 1</strong><br><a href="#part-1">Short part title</a></p>'),
        row('', '<p><strong>Part 2</strong><br><a href="#part-2">Short part title</a></p>'),
        row('<p><a href="https://github.com/jackzhaojin">Code on GitHub</a></p>'),
      ])),
      section(
        '<p>Opening paragraph: the situation, and what the reader gets from the parts below.</p>',
        block('fine-print', [row('<p>First published on LinkedIn on Month D, YYYY. Code: repository at commit.</p>')]),
      ),
      section(
        '<h2>1. Part heading</h2>',
        '<p>Paragraph text.</p>',
        sectionMetadata([['id', 'part-1']]),
      ),
      section(
        '<h2>2. Part heading</h2>',
        '<p>Paragraph text.</p>',
        sectionMetadata([['id', 'part-2']]),
      ),
      section(
        '<h2>Related</h2>',
        block('row-list', [
          row('<p>Writing</p>', '<p><a href="/writing/">Related article title</a></p>', '<p>Why it is related.</p>'),
          row('<p>Portfolio</p>', '<p><a href="/portfolio/">Related project name</a></p>', '<p>Why it is related.</p>'),
        ]),
        pick({ from: W('2026-02-05-reusable-ai-development-modules'), cls: 'author-box' }),
        sectionMetadata([['style', 'related']]),
        metadata([
          ['title', 'Article title | Jack Jin'],
          ['description', 'One or two sentences for search results and social cards.'],
          ['template', 'article'],
          ['published-time', 'YYYY-MM-DD'],
          ['modified-time', 'YYYY-MM-DD'],
          ['listing-topics', 'Topic | Topic'],
          ['listing-reading-time', 'N min read'],
        ]),
      ),
    ],
  },
  {
    key: 'Static page',
    name: 'static',
    body: () => [
      section(block('hero page', [row(
        '<ol><li><a href="/">Home</a></li><li>Page title</li></ol><h1>Page title</h1><p>One-sentence summary of the page.</p>',
      )])),
      section(
        '<h2>Section heading</h2>',
        '<p>Paragraph text.</p>',
        '<h2>Section heading</h2>',
        '<p>Paragraph text.</p>',
      ),
      section(metadata([
        ['title', 'Page title | Jack Jin'],
        ['description', 'One or two sentences for search results and social cards.'],
        ['template', 'static'],
        ['image', socialImage],
        ['image:alt', SOCIAL_ALT],
        ['og:image:alt', SOCIAL_ALT],
      ])),
    ],
  },
  {
    key: 'Listing hub',
    name: 'listing',
    body: () => [
      section(block('hero writing', [row(
        '<ol><li><a href="/">Home</a></li><li>Listing title</li></ol><h1>Listing title</h1><p>One-sentence summary of what the list holds.</p>',
      )])),
      section(
        pickContent({ selector: 'p:has(a[href*="/widgets/writing-filter/"])' }),
        pick({ cls: 'writing-index' }),
        sectionMetadata([['label', 'List name for screen readers']]),
      ),
      section(
        '<h2>Closing note heading</h2>',
        '<p>Closing note text.</p>',
        sectionMetadata([['style', 'alt, note']]),
        metadata([
          ['title', 'Listing title | Jack Jin'],
          ['description', 'One or two sentences for search results and social cards.'],
          ['template', 'listing'],
          ['image', socialImage],
          ['image:alt', SOCIAL_ALT],
          ['og:image:alt', SOCIAL_ALT],
        ]),
      ),
    ],
  },
  {
    key: 'Project page',
    name: 'project',
    body: () => [
      section(
        block('chapter-head', [row(
          '<h1>Project name<br><em>Project subtitle</em></h1><p>Mon YYYY - Mon YYYY &middot; N commits</p><p><strong>Build method</strong> one line on how it was built.</p><p>Thesis: one or two sentences on what the project is and why it matters.</p>',
        )]),
        block('showcase story', [
          row(
            '<p><em>Mon YYYY</em> &middot; Story meta line</p><h3>Story heading</h3><p>Pattern line: the idea this story shows.</p><p>Body paragraph: what was built and what came of it.</p>',
            '',
          ),
          row('<p>id</p>', '<p>p-project-id</p>'),
        ]),
        block('proof-links', [row(
          '<p><a href="https://github.com/jackzhaojin">Repository &#8599;</a> <a href="/writing/">Read the write-up</a></p>',
        )]),
        sectionMetadata([['id', 'ch-project-id'], ['style', 'chapter, accent']]),
      ),
      section(
        '<p><a href="/portfolio/">All projects</a></p>',
        metadata([
          ['title', 'Project name | Jack Jin'],
          ['description', 'One or two sentences for search results and social cards.'],
          ['template', 'portfolio'],
          ['image', 'Social image: a www media URL of the project diagram'],
          ['project-order', 'N'],
          ['project-dates', 'YYYY'],
          ['project-kind', 'Build method'],
          ['project-anchors', 'ch-project-id p-project-id'],
        ]),
      ),
    ],
  },
];

/* ------------------------------------------------------------ write */

const doc = (sections) => `<body>\n  <header></header>\n  <main>${sections.join('')}</main>\n  <footer></footer>\n</body>\n`;
const sanitise = path.join(root, 'stardust/scripts/deploy/sanitise.js');
const written = [];
function writeDoc(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  execFileSync(process.execPath, [sanitise, file], { stdio: ['ignore', 'ignore', 'pipe'] });
  written.push(path.relative(CONTENT, file).replace(/\.html$/, ''));
}

function variantSection(v) {
  if (!v.group) {
    return section(`<h2>${v.name}</h2>`, pick(v), libraryMetadata(v.description, v.tags));
  }
  const items = v.group.map((g) => (g.content ? pickContent(g.content) : pick(g)));
  return section(
    `<h2>${v.name}</h2>`,
    block('library-container-start', []),
    ...items,
    block('library-container-end', []),
    libraryMetadata(v.description, v.tags),
  );
}

const blockRows = [];
Object.entries(BLOCKS).forEach(([id, spec]) => {
  writeDoc(`blocks/${id}.html`, doc(spec.variants.map(variantSection)));
  blockRows.push({ name: spec.name, path: `${DA_CONTENT}/docs/library/blocks/${id}` });
});
blockRows.sort((a, b) => a.name.localeCompare(b.name));

const templateRows = TEMPLATES.map((t) => {
  writeDoc(`templates/${t.name}.html`, doc(t.body()));
  return { key: t.key, value: `${DA_CONTENT}/docs/library/templates/${t.name}` };
});

const sheet = (data) => ({
  total: data.length, limit: data.length, offset: 0, data, ':type': 'sheet',
});
const sheets = { blocks: sheet(blockRows), templates: sheet(templateRows) };
Object.entries(sheets).forEach(([name, body]) => {
  fs.writeFileSync(path.join(OUT, `${name}.json`), `${JSON.stringify(body, null, 2)}\n`);
});

const variants = Object.values(BLOCKS).reduce((n, b) => n + b.variants.length, 0);
console.log(`library: ${blockRows.length} block documents, ${variants} variants, ${templateRows.length} templates`);
const pathsOut = process.argv[process.argv.indexOf('--paths-out') + 1];
if (process.argv.includes('--paths-out') && pathsOut) {
  fs.writeFileSync(pathsOut, `${written.map((p) => `/${p}`).join('\n')}\n`);
  console.log(`library: the documents' web paths, for deploy-batch.mjs --paths, in ${pathsOut}`);
}

if (args.has('--upload') || args.has('--preview')) {
  let token = process.env.DA_TOKEN;
  if (!token) {
    const cache = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.aem/da-token.json'), 'utf8'));
    if (cache.expires_at < Date.now() + 60000) throw new Error('the da-auth token has expired: sign in again');
    token = cache.access_token;
  }
  const auth = { Authorization: `Bearer ${token}` };
  const send = async ([name, body]) => {
    const web = `docs/library/${name}.json`;
    if (args.has('--upload')) {
      const fd = new FormData();
      fd.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }), `${name}.json`);
      const r = await fetch(`https://admin.da.live/source/${ORG}/${SITE}/${web}`, { method: 'POST', headers: auth, body: fd });
      console.log(`upload /${web}: ${r.status}`);
      if (!r.ok) process.exitCode = 1;
    }
    if (args.has('--preview')) {
      const r = await fetch(`https://admin.hlx.page/preview/${ORG}/${SITE}/${REF}/${web}`, { method: 'POST', headers: auth });
      console.log(`preview /${web}: ${r.status}`);
      if (!r.ok) process.exitCode = 1;
    }
  };
  // one sheet after the other, so the log reads in order
  await Object.entries(sheets)
    .reduce((prev, entry) => prev.then(() => send(entry)), Promise.resolve());
}
