/**
 * Explainer engine "request-pipe": the numbered steps of one request through an app, three to a
 * row from 640px of column width (the STAR story generator article's request pipeline).
 *
 * Rows:
 * - one row per step, in order, three cells: the step title | what happens | where it runs
 *   (a function or file name, shown as a tag);
 * - a last single-cell row is the caption.
 *
 * Behaviour: none; the steps are numbered by CSS.
 *
 * @variants request-pipe
 */
const ROLES = ['pipe__title', 'pipe__text', 'pipe__fn'];

export default async function engine(block, { slot, rows }) {
  const figure = document.createElement('figure');
  figure.className = 'pipe';
  const list = slot('pipe__list');
  list.setAttribute('role', 'list');
  const caption = document.createElement('figcaption');

  rows(block).forEach((cells) => {
    if (cells.length === 1) {
      caption.append(...cells[0].children);
      return;
    }
    const body = slot('pipe__body', cells.map((c, i) => slot(ROLES[i] || 'pipe__text', [...c.children])));
    const step = slot('pipe__step', [body]);
    step.setAttribute('role', 'listitem');
    list.append(step);
  });

  figure.append(list);
  if (caption.children.length) figure.append(caption);
  block.replaceChildren(figure);
}
