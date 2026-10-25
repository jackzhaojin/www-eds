/**
 * Cards: one row per card. A card holding a link is a linked card: the whole card is that
 * link, and the link's text stays in place (Experience Workspace card-as-link, EW6).
 *
 * Content: one paragraph per card is the open list shape, a bold linked title, a line break,
 * then the note, as the source renders it (one link holding title and note). Several
 * paragraphs also work: each keeps its own line.
 *
 * @variants list (default list)
 *   list - an open row of linked items under a strong rule (the home's selected work links)
 */

const VARIANTS = ['list'];

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

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('list');
  const cards = [...block.querySelectorAll(':scope > div')].map(decorateCard).filter(Boolean);
  block.replaceChildren(...cards);
}
