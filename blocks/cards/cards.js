/**
 * Cards: one row per card. A card holding a link is a linked card: the whole card is that
 * link, and the link's text stays in place (Experience Workspace card-as-link, EW6).
 *
 * Content: one paragraph per card is the open list shape, a bold linked title, a line break,
 * then the note, as the source renders it (one link holding title and note). Several
 * paragraphs also work: each keeps its own line.
 *
 * @variants list | tool | project | repo (default list)
 *   list - an open row of linked items under a strong rule (the home's selected work links)
 *   tool - a grid of compact repo cards, each card one link (the portfolio's smaller repos):
 *     one paragraph, the bold linked repo name, a line break, the note, a line break, the
 *     italic date range
 *   project - a grid of project cards (the portfolio's games): a dates paragraph, the heading,
 *     the summary, a paragraph of typed links; a last row with no heading is the note under
 *     the grid
 *   repo - a grid of repository cards, each card one link as on the source: the linked dates
 *     paragraph, the heading, the summary. The dates link becomes the card's link; its text,
 *     the heading and the summary move inside it (the emptied paragraph stays, hidden)
 */

const VARIANTS = ['list', 'tool', 'project', 'repo'];

function slot(className, nodes) {
  const div = document.createElement('div');
  div.className = className;
  div.append(...nodes);
  return div;
}

function decorateCard(row) {
  const nodes = [...row.querySelectorAll(':scope > div > *')];
  if (!nodes.length) return null;
  const link = nodes.map((n) => (n.matches('a[href]') ? n : n.querySelector('a[href]'))).find(Boolean);
  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'cards-card';
  if (link) {
    card.href = link.getAttribute('href');
    link.closest('p')?.classList.remove('text-link-wrapper');
    link.replaceWith(...link.childNodes);
  }
  const body = document.createElement('div');
  body.className = 'cards-card-body';
  body.append(...nodes);
  card.append(body);
  return card;
}

/**
 * A repo card is one link (the source's a.repo-card): the authored dates link takes the card's
 * content, its own text in an inline span first, so the link's label is the dates and the
 * heading and summary stay what they are. Every authored node is moved, none rebuilt.
 */
function linkWholeCard(card) {
  const dates = card.querySelector('.cards-link');
  const link = dates && dates.querySelector('a[href]');
  if (!link) return;
  const label = document.createElement('span');
  label.className = 'cards-dates-label';
  label.append(...link.childNodes);
  link.append(label, ...[...card.children].filter((c) => c !== dates));
  dates.classList.add('cards-source');
  card.prepend(link);
}

/** project and repo cards: roles by content (dates, heading, summary, links). */
function decorateRoleCard(row, repo) {
  const nodes = [...row.querySelectorAll(':scope > div > *')];
  if (!nodes.length) return null;
  const heading = nodes.find((n) => /^H[1-6]$/.test(n.tagName));
  if (!heading) return slot('cards-note', nodes);
  const card = slot('cards-card', []);
  let seenHeading = false;
  nodes.forEach((n) => {
    n.classList.remove('text-link-wrapper');
    n.querySelectorAll('a.text-link').forEach((a) => a.classList.remove('text-link'));
    if (n === heading) {
      seenHeading = true;
      card.append(slot('cards-title', [n]));
    } else if (!seenHeading) card.append(slot(repo ? 'cards-dates cards-link' : 'cards-dates', [n]));
    else if (n.querySelectorAll('a').length && !repo) card.append(slot('cards-links link-types', [n]));
    else card.append(slot('cards-summary', [n]));
  });
  if (repo) linkWholeCard(card);
  return card;
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('list');
  const rows = [...block.querySelectorAll(':scope > div')];
  if (block.classList.contains('project') || block.classList.contains('repo')) {
    const repo = block.classList.contains('repo');
    const grid = slot('cards-grid', []);
    const after = [];
    rows.map((r) => decorateRoleCard(r, repo)).filter(Boolean).forEach((c) => {
      if (c.classList.contains('cards-note')) after.push(c);
      else grid.append(c);
    });
    block.replaceChildren(grid, ...after);
    return;
  }
  const cards = rows.map(decorateCard).filter(Boolean);
  block.replaceChildren(...cards);
}
