/**
 * Cards: one row per card. A card whose first link sits alone in its paragraph (the title)
 * is a linked card: the whole card is that link, and the title link's text stays in place
 * (Experience Workspace card-as-link, EW6). The first paragraph is the title, the rest is the
 * card text.
 *
 * @variants list (default list)
 *   list - an open row of linked items under a strong rule (the home's selected work links)
 */

const VARIANTS = ['list'];

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function decorateCard(row) {
  const nodes = [...row.querySelectorAll(':scope > div > *')];
  if (!nodes.length) return null;
  const [title, ...rest] = nodes;
  const link = title.matches('p, h2, h3, h4') && title.querySelector('a[href]');
  const card = document.createElement(link ? 'a' : 'div');
  card.className = 'cards-card';
  if (link) {
    card.href = link.getAttribute('href');
    link.classList.remove('text-link');
    title.classList.remove('text-link-wrapper');
    link.replaceWith(...link.childNodes);
  }
  card.append(slot('cards-card-title', [title]));
  if (rest.length) card.append(slot('cards-card-text', rest));
  return card;
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('list');
  const cards = [...block.querySelectorAll(':scope > div')].map(decorateCard).filter(Boolean);
  block.replaceChildren(...cards);
}
