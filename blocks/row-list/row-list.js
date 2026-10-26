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
 *
 * @ew-exempt anchors: link targets for the talk rows, hidden through .row-list-anchors
 * @ew-exempt dynamic Source row: API configuration; talk copy is edited in source records
 * @variants talks, dynamic (default none)
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

export default async function decorate(block) {
  if (block.classList.contains('talks')) {
    if (block.classList.contains('dynamic')) {
      const source = block.querySelector('a[href]');
      const config = slot('row-list-source', [...block.childNodes]);
      config.hidden = true;
      block.replaceChildren(config);
      block.setAttribute('aria-busy', 'true');
      try {
        if (!source) throw new Error('The dynamic talks list needs an index URL');
        const { loadTalksIndex, renderTalks, syncTalkSchema } = await import('../../scripts/talks-index.js');
        const talks = await loadTalksIndex(source.href);
        const list = renderTalks(talks);
        syncTalkSchema(talks);
        block.prepend(list);
        const target = document.getElementById(window.location.hash.slice(1));
        if (target && block.contains(target)) target.scrollIntoView();
        if (!talks.length) {
          const empty = document.createElement('p');
          empty.textContent = 'No talks are published yet.';
          block.prepend(empty);
        }
        block.dataset.talksState = 'ready';
      } catch (error) {
        const message = document.createElement('p');
        message.setAttribute('role', 'alert');
        message.textContent = 'Talks are temporarily unavailable. Please try again later.';
        block.prepend(message);
        block.dataset.talksState = 'error';
        // eslint-disable-next-line no-console
        console.warn('Unable to load talks:', error.message);
      } finally {
        block.removeAttribute('aria-busy');
      }
      return;
    }
    decorateTalks(block);
    return;
  }
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
