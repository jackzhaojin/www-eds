/**
 * Explainer engine "trail": a dated trail of events on a hairline rule, a dot per entry (the
 * commit trail of "Scaling AI coding delivery").
 *
 * Rows: one per entry, two cells: the date (a short paragraph, e.g. "June 7") | what happened
 * (a paragraph, links and inline code kept).
 *
 * @variants (none)
 */

export default async function engine(block, { slot, rows }) {
  const list = document.createElement('ol');
  list.className = 'trail';
  rows(block).forEach(([when, what]) => {
    const li = document.createElement('li');
    if (when) li.append(slot('trail-time', [...when.children]));
    if (what) li.append(slot('trail-text', [...what.children]));
    list.append(li);
  });
  block.replaceChildren(list);
}
