/**
 * Row list: a ruled list of rows (design-system/v3 row list). One row per item: the kind
 * (a short mono label), the title (usually a link), the note. Cells may be left out.
 *
 * talks: the talk history (css/site.css .talk-row). One row per talk, three cells:
 * - when: the date paragraph, then the kind paragraph (Conference session, Lightning talk);
 * - body: the heading, the event paragraph (event, place, co-speakers), the description
 *   paragraph, then the link paragraphs and any status paragraph (Write-up in progress), which
 *   share one cluster;
 * - anchors: the row's id, then any older ids that should still land on it, space separated.
 * projects: the portfolio's project list, in the talks shape and look (when: dates and kind;
 * body: the linked heading, the tagline, the summary; anchors: the old chapter anchors).
 * related: on a talk or project page, the site's articles that link to the page, as plain
 * rows (date, linked title, summary).
 * dynamic (with talks, projects or related): the block is one Source row naming its index,
 * and the rows are generated from it (DYNAMIC below).
 *
 * @ew-exempt anchors: link targets for the talk rows, hidden through .row-list-anchors
 * @ew-exempt dynamic Source row: API configuration; the copy is edited on the source pages
 * @variants talks, projects, related, dynamic (default none)
 */

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
  talks: {
    module: '../../scripts/talks-index.js',
    load: 'loadTalksIndex',
    rows: 'talkRows',
    items: 'talkSchemaItems',
    path: '/talks/',
    empty: 'No talks are published yet.',
    error: 'Talks are temporarily unavailable. Please try again later.',
  },
  projects: {
    module: '../../scripts/portfolio-index.js',
    load: 'loadPortfolioIndex',
    rows: 'projectRows',
    items: 'projectSchemaItems',
    path: '/portfolio/',
    empty: 'No projects are published yet.',
    error: 'Projects are temporarily unavailable. Please try again later.',
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
 * talks or projects, dynamic: Source | /talks-index.json (or /portfolio-index.json), and
 * nothing else to author. The talk and project pages own the copy; the rows and the JSON-LD
 * are generated, by the edge Worker on www and by the browser on preview hosts
 * (scripts/query-index.js fillFromIndex), as the rows an author would write, decorated by
 * decorateTalks.
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

export default async function decorate(block) {
  const kind = ['talks', 'projects', 'related'].find((name) => block.classList.contains(name));
  if (kind && block.classList.contains('dynamic')) {
    await decorateDynamic(block, DYNAMIC[kind]);
    return;
  }
  if (kind === 'talks' || kind === 'projects') {
    decorateTalks(block);
    return;
  }
  decorateRows(block);
}
