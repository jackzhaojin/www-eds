/**
 * Row list: a ruled list of rows (design-system/v3 row list). One row per item: the kind
 * (a short mono label), the title (usually a link), the note. Cells may be left out.
 *
 * talks: the talk history on /talks/, authored on the page (since v1.3.0 a talk has no page of
 * its own). One row per talk, three cells:
 * - when: the date paragraph, then the kind paragraph (Conference session, Lightning talk);
 * - body: the heading (linked straight to the recording, else the event), the event paragraph
 *   (event, place, co-speakers), the description paragraph, then the link paragraphs and any
 *   status paragraph (Write-up in progress), which share one cluster;
 * - anchors: the row's id, then any older ids that should still land on it, space separated.
 * Each row becomes a card, as in the portfolio's gallery (since v1.3.1, decorateGallery below):
 * a talk whose links include its project page plays that project's scene in its accent; any
 * other talk takes the site's topic colors in turn and a Scene (stage), laid out by its kind.
 * The page's JSON-LD (an Event per talk) is written from the rows (scripts/talks-list.js).
 * projects: the portfolio hub's project gallery (since v1.2.1). The rows have the talks shape
 * (when: dates and kind; body: the linked heading, the tagline, the summary; anchors: the old
 * chapter anchors) and each becomes a card whose whole surface is its title link (decorateGallery
 * below): the project's number (its position), its accent as the card's ground, and the project
 * page's scene as a thumbnail.
 * related: on a project page, the site's articles that link to the page, as plain rows (date,
 * linked title, summary).
 * dynamic (with projects or related): the block is one Source row naming its index, and the
 * rows are generated from it (DYNAMIC below).
 *
 * @ew-exempt anchors: link targets for the talk rows, hidden through .row-list-anchors
 * @ew-exempt dynamic Source row: API configuration; the copy is edited on the source pages
 * @variants talks, projects, related, dynamic (default none)
 */

import { loadCSS } from '../../scripts/aem.js';
import { within } from '../../scripts/query-index.js';

const ROLES = ['row-list-kind', 'row-list-title', 'row-list-note'];

function plainLinks(cell) {
  cell.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper', 'button-wrapper'));
  cell.querySelectorAll('a').forEach((a) => a.classList.remove('text-link', 'button', 'primary', 'secondary'));
}

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function isLinkParagraph(el) {
  const a = el.tagName === 'P' && el.querySelector('a');
  return !!a && el.textContent.trim() === a.textContent.trim();
}

function decorateTalkBody(cell) {
  const nodes = [...cell.children];
  const heading = nodes.find((el) => /^H[1-6]$/.test(el.tagName));
  const firstLink = nodes.findIndex(isLinkParagraph);
  const before = nodes.filter((el, i) => el.tagName === 'P' && (firstLink < 0 || i < firstLink));
  const links = nodes.filter(isLinkParagraph);
  const status = nodes.filter((el, i) => el.tagName === 'P' && firstLink >= 0 && i > firstLink && !isLinkParagraph(el));
  const event = before.length > 1 ? before[0] : null;
  const description = before.length > 1 ? before.slice(1) : before;

  const body = slot('row-list-body', []);
  if (heading) body.append(slot('row-list-title', [heading]));
  if (event) body.append(slot('row-list-event', [event]));
  if (description.length) body.append(slot('row-list-description', description));
  const cluster = slot('row-list-cluster', []);
  if (links.length) cluster.append(slot('row-list-links cta-slot', links));
  if (status.length) cluster.append(slot('row-list-status', status));
  body.append(cluster);
  const used = new Set([heading, ...before, ...links, ...status]);
  nodes.filter((el) => !used.has(el)).forEach((el) => body.append(el));
  return body;
}

function decorateTalks(block) {
  const list = document.createElement('ol');
  list.className = 'row-list-items';
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const li = document.createElement('li');
    const cells = [...row.children].filter((c) => c.children.length);
    const bodyCell = cells.find((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));
    const whenCell = cells.find((c) => c !== bodyCell);
    const anchorCell = cells.find((c) => c !== bodyCell && c !== whenCell);
    if (whenCell) {
      const [date, ...kind] = [...whenCell.children];
      const when = slot('row-list-when', []);
      if (date) when.append(slot('row-list-date', [date]));
      if (kind.length) when.append(slot('row-list-type', kind));
      li.append(when);
    }
    if (bodyCell) {
      plainLinks(bodyCell);
      const linkParagraphs = [...bodyCell.querySelectorAll(':scope > p')].filter(isLinkParagraph);
      linkParagraphs.forEach((p) => {
        p.classList.add('text-link-wrapper');
        p.querySelector('a').classList.add('text-link');
      });
      li.append(decorateTalkBody(bodyCell));
    }
    if (anchorCell) {
      const [id, ...aliases] = anchorCell.textContent.trim().split(/\s+/).filter(Boolean);
      if (id) li.id = id;
      // Older ids land on the row: an empty inline target at the top of its first column.
      aliases.forEach((alias) => {
        const span = document.createElement('span');
        span.id = alias;
        (li.firstElementChild || li).prepend(span);
      });
      li.append(slot('row-list-anchors', [...anchorCell.children]));
    }
    list.append(li);
  });
  block.replaceChildren(list);
}

const MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');
const TOUCH = window.matchMedia('(hover: none)');

/** A project page's body, as delivery serves it for the page's path. */
function plainURL(href) {
  const { pathname } = new URL(href, window.location.href);
  return pathname.endsWith('/') ? `${pathname}index.plain.html` : `${pathname}.plain.html`;
}

/**
 * Puts a Scene block into the card's plate as a thumbnail (scene.js thumbnail mode: no pause
 * control, held on the engine's still until the gallery plays it). If its engine fails, the card
 * keeps its numeral plate. A ready scene waits for the gallery to reveal it (playScenes).
 */
async function mountScene(card, plate, scene) {
  try {
    const base = window.hlx?.codeBasePath || '';
    const [{ default: decorateScene }] = await Promise.all([
      import(`${base}/blocks/scene/scene.js`),
      loadCSS(`${base}/blocks/scene/scene.css`),
    ]);
    scene.dataset.mode = 'thumb';
    const watch = new MutationObserver(() => {
      if (scene.classList.contains('is-fallback')) {
        watch.disconnect();
        scene.remove();
      } else if (scene.classList.contains('is-ready')) {
        watch.disconnect();
        card.dispatchEvent(new CustomEvent('row-list-scene'));
      }
    });
    watch.observe(scene, { attributes: true, attributeFilter: ['class'] });
    plate.append(scene);
    await decorateScene(scene);
  } catch {
    // the numeral plate stays
  }
}

/** A project page's Scene block, copied into the card (none: the numeral plate stays). */
async function loadScene(card, plate, href) {
  try {
    const response = await fetch(plainURL(href));
    if (!response.ok) return;
    const page = document.createElement('template');
    page.innerHTML = await response.text();
    const source = page.content.querySelector('div.scene');
    if (source) await mountScene(card, plate, document.importNode(source, true));
  } catch {
    // the numeral plate stays
  }
}

/** The stage's layout for a talk's kind (blocks/scene/engines/stage.js). */
function stageLayout(kind) {
  if (/panel|fireside/i.test(kind)) return 'panel';
  return /lecture|class/i.test(kind) ? 'lecture' : 'stage';
}

/**
 * A talk with no project: a Scene (stage) built here, its layout from the talk's kind and its
 * seed from the card's place, named by the talk's title (the card's media is decoration).
 */
function stageScene(card, plate, seed) {
  const scene = document.createElement('div');
  scene.className = 'scene stage';
  scene.dataset.layout = stageLayout(card.querySelector('.row-list-type')?.textContent || '');
  scene.dataset.seed = seed;
  const row = document.createElement('div');
  const [key, value] = [document.createElement('div'), document.createElement('div')];
  key.textContent = 'label';
  value.textContent = card.querySelector('.row-list-title')?.textContent.trim() || 'A talk';
  row.append(key, value);
  scene.append(row);
  return mountScene(card, plate, scene);
}

/**
 * Reveals each card's scene (the numeral sets back, the plate eases in) the first time the card's
 * media is half on screen with its scene ready, so the reader sees it at any scroll speed; scenes
 * load 400px ahead, so on a slow scroll they are ready before their card arrives.
 * Plays one revealed scene at a time: the card under the pointer, else the one with focus in it,
 * else (on touch screens) the card most in view. Under reduced motion every scene stays still.
 */
function playScenes(cards, loadFor) {
  let hovered = null;
  let focused = null;
  let viewed = null;
  let playing = null;
  const set = (card, play) => {
    const scene = card.classList.contains('has-scene') && card.querySelector('.scene.is-ready');
    if (!scene || scene.classList.contains('is-paused') !== play) return;
    scene.classList.toggle('is-paused', !play);
    scene.dispatchEvent(new CustomEvent('scene-pause'));
  };
  const sync = () => {
    const next = MOTION.matches ? null : hovered || focused || (TOUCH.matches ? viewed : null);
    if (playing && playing !== next) set(playing, false);
    playing = next;
    if (playing) set(playing, true);
  };

  const shown = new Set();
  const reveal = (card) => {
    if (card.classList.contains('has-scene') || !shown.has(card)
      || !card.querySelector('.scene.is-ready')) return;
    card.classList.add('has-scene');
    sync();
  };
  const onScreen = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const card = entry.target.closest('li');
      if (entry.intersectionRatio >= 0.5) shown.add(card);
      else shown.delete(card);
      reveal(card);
    });
  }, { threshold: [0, 0.5] });

  const ratios = new Map();
  const view = new IntersectionObserver((entries) => {
    entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
    viewed = cards.reduce((best, card) => ((ratios.get(card) || 0) > (ratios.get(best) || 0.5)
      ? card : best), null);
    if (TOUCH.matches) sync();
  }, { threshold: [0, 0.25, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });

  const lazy = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach(({ target }) => {
      lazy.unobserve(target);
      const plate = target.querySelector('.row-list-plate');
      if (plate) loadFor(target, plate);
    });
  }, { rootMargin: '400px 0px' });

  cards.forEach((card) => {
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      hovered = card;
      sync();
    });
    card.addEventListener('pointerleave', () => {
      if (hovered !== card) return;
      hovered = null;
      sync();
    });
    card.addEventListener('focusin', () => {
      focused = card;
      sync();
    });
    card.addEventListener('focusout', (event) => {
      if (card.contains(event.relatedTarget) || focused !== card) return;
      focused = null;
      sync();
    });
    card.addEventListener('row-list-scene', () => reveal(card));
    view.observe(card);
    lazy.observe(card);
    const media = card.querySelector('.row-list-media');
    if (media) onScreen.observe(media);
  });
  MOTION.addEventListener('change', sync);
  TOUCH.addEventListener('change', sync);
}

/** A project's accent, from its chapter anchor (ch-<word>): --c-<word> (styles.css), if any. */
function projectAccent(li, anchor) {
  const word = anchor?.match(/^ch-([a-z0-9-]+)$/)?.[1];
  return word && getComputedStyle(li).getPropertyValue(`--c-${word}`).trim() ? `var(--c-${word})` : '';
}

/** projects: the card's accent is its own; its scene is its page's. */
const PROJECTS = {
  accentOf: (li) => projectAccent(li, li.id),
  loadFor: (card, plate) => {
    const link = card.querySelector('.row-list-title a[href]');
    if (link) loadScene(card, plate, link.href);
  },
};

/** The project page a talk's row links to (Explore the project), as a site path. */
const talkProject = (li) => [...li.querySelectorAll('.row-list-links a[href]')]
  .map((a) => new URL(a.href, window.location.href).pathname)
  .find((path) => /^\/portfolio\/[^/]+\/$/.test(path));

/**
 * talks: a talk about a project takes the project's accent (its chapter anchor, from the
 * portfolio index) and plays its scene; any other talk takes the site's topic colors in turn
 * (work, agents, aem) and a Scene (stage). If the index is slow, the cards go out quiet.
 */
async function talkGallery() {
  const anchors = new Map();
  try {
    const { loadPortfolioIndex } = await import('../../scripts/portfolio-index.js');
    const index = new URL('/portfolio-index.json', window.location.href).href;
    (await within(loadPortfolioIndex(index), 2500))
      .forEach((project) => anchors.set(project.path, project.anchors[0]));
  } catch {
    // no project accents: those cards stay quiet
  }
  const topics = ['work', 'agents', 'aem'];
  let turn = 0;
  return {
    accentOf: (li) => {
      const project = talkProject(li);
      if (project) return projectAccent(li, anchors.get(project));
      turn += 1;
      return `var(--color-topic-${topics[(turn - 1) % topics.length]})`;
    },
    loadFor: (card, plate) => {
      const project = talkProject(card);
      if (project) loadScene(card, plate, project);
      else stageScene(card, plate, [...card.parentElement.children].indexOf(card) + 1);
    },
  };
}

/**
 * projects and talks: each decorated row (decorateTalks) becomes a card. The number is the row's
 * position (01 is the first, the newest); accentOf(li) names the card's accent (a card without
 * one draws in muted ink) and loadFor(card, plate) puts its scene in the plate. The media (the
 * numeral and the scene's plate) is decoration, hidden from screen readers; the title link
 * stretches over the card, so the card is one link (a talk's own links stay above it). Older
 * anchor ids move to the card's top.
 */
function decorateGallery(block, { accentOf, loadFor }) {
  const list = block.querySelector('.row-list-items');
  if (!list) return;
  const cards = [...list.children];
  cards.forEach((li, i) => {
    const when = li.querySelector(':scope > .row-list-when');
    const body = li.querySelector(':scope > .row-list-body');
    const anchors = li.querySelector(':scope > .row-list-anchors');
    const aliases = [...li.querySelectorAll(':scope > div > span[id]')];
    const accent = accentOf(li);
    li.style.setProperty('--accent', accent || 'var(--color-text-muted)');
    li.classList.add('row-list-project');
    li.classList.toggle('is-quiet', !accent);
    const link = li.querySelector('.row-list-title a[href]');
    if (link) li.dataset.goes = /youtu\.?be/.test(link.href) ? 'recording' : 'out';

    const num = document.createElement('span');
    num.className = 'row-list-num';
    num.textContent = String(i + 1).padStart(2, '0');
    const media = slot('row-list-media', [num, slot('row-list-plate', [])]);
    media.setAttribute('aria-hidden', 'true');
    body?.querySelectorAll('.row-list-cluster').forEach((cluster) => {
      if (!cluster.children.length) cluster.remove();
    });
    const card = slot('row-list-card', [media, body, when].filter(Boolean));
    li.replaceChildren(...aliases, card, ...(anchors ? [anchors] : []));
  });
  if (cards.length) playScenes(cards, loadFor);
}

/** The plain rows: kind | title | note, any cell may be left out. */
function decorateRows(block) {
  const list = document.createElement('ol');
  list.className = 'row-list-items';
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children];
    const li = document.createElement('li');
    const roles = cells.length >= 3 ? ROLES : ROLES.slice(1);
    cells.forEach((cell, i) => {
      if (!cell.children.length) return;
      plainLinks(cell);
      const div = document.createElement('div');
      div.className = roles[i] || 'row-list-note';
      div.append(...cell.children);
      li.append(div);
    });
    list.append(li);
  });
  block.replaceChildren(list);
}

/** The dynamic listings: the module that reads each index and builds its rows. */
const DYNAMIC = {
  projects: {
    module: '../../scripts/portfolio-index.js',
    load: 'loadPortfolioIndex',
    rows: 'projectRows',
    items: 'projectSchemaItems',
    path: '/portfolio/',
    empty: 'No projects are published yet.',
    error: 'Projects are temporarily unavailable. Please try again later.',
    gallery: true,
  },
  // No ItemList: the page's own JSON-LD describes it. With no article linking, the section hides.
  related: {
    module: '../../scripts/writing-index.js',
    load: 'loadWritingIndex',
    rows: 'relatedRows',
    select: 'linkingTo',
    plain: true,
  },
};

/** This page's path, as its canonical URL names it (the www path on every host). */
const pagePath = () => new URL(document.querySelector('link[rel="canonical"]')?.href
  || window.location.href).pathname;

/**
 * projects, dynamic: Source | /portfolio-index.json, and nothing else to author. The project
 * pages own the copy; the rows and the JSON-LD are generated, by the edge Worker on www and by
 * the browser on preview hosts (scripts/query-index.js fillFromIndex), as the rows an author
 * would write, decorated by decorateTalks.
 */
async function decorateDynamic(block, listing) {
  block.setAttribute('aria-busy', 'true');
  const [{ fillFromIndex }, index, { rowsToDOM }, { syncCollectionSchema }] = await Promise.all([
    import('../../scripts/query-index.js'),
    import(listing.module),
    import('../../scripts/listing-cells.js'),
    import('../../scripts/collection-schema.js'),
  ]);
  const render = (records) => {
    const shown = listing.select ? index[listing.select](records, pagePath()) : records;
    block.replaceChildren(...rowsToDOM(index[listing.rows](shown)));
    if (listing.items) {
      syncCollectionSchema((canonical) => index[listing.items](shown, canonical), listing.path);
    }
  };
  const { state, rendered, sourceRow } = await fillFromIndex(block, index[listing.load], render);
  if (listing.plain) decorateRows(block);
  else decorateTalks(block);
  if (listing.gallery) decorateGallery(block, PROJECTS);
  if (listing.plain && !block.querySelector('.row-list-items > li')) {
    const section = block.closest('.section');
    if (section) section.hidden = true;
  }
  if (sourceRow) {
    sourceRow.hidden = true;
    block.append(sourceRow);
  }
  if (listing[state]) {
    const message = document.createElement('p');
    if (state === 'error') message.setAttribute('role', 'alert');
    message.textContent = listing[state];
    block.prepend(message);
  }
  block.dataset.listingState = state;
  block.dataset.rendered = rendered;
  block.removeAttribute('aria-busy');
  const target = document.getElementById(window.location.hash.slice(1));
  if (target && block.contains(target)) target.scrollIntoView();
}

/** talks: the hub's JSON-LD, an Event per authored row. */
async function syncTalksSchema(block) {
  const [{ readTalkRow, talkSchemaItems }, { syncCollectionSchema }] = await Promise.all([
    import('../../scripts/talks-list.js'),
    import('../../scripts/collection-schema.js'),
  ]);
  const talks = [...block.querySelectorAll('.row-list-items > li')].map(readTalkRow);
  syncCollectionSchema((canonical) => talkSchemaItems(talks, canonical), '/talks/');
}

export default async function decorate(block) {
  const kind = ['talks', 'projects', 'related'].find((name) => block.classList.contains(name));
  if (kind && kind !== 'talks' && block.classList.contains('dynamic')) {
    await decorateDynamic(block, DYNAMIC[kind]);
    return;
  }
  if (kind === 'talks' || kind === 'projects') {
    decorateTalks(block);
    if (kind === 'projects') {
      decorateGallery(block, PROJECTS);
    } else {
      decorateGallery(block, await talkGallery());
      syncTalksSchema(block); // the JSON-LD never holds up the list
    }
    return;
  }
  decorateRows(block);
}
