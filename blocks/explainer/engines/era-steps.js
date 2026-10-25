/**
 * Explainer engine "era-steps": numbered steps side by side, the last one marked as the current
 * step (the edge CMS article's CQ5 to EDS figure).
 *
 * Rows, by content:
 * - one row per step, in order: a "when" paragraph (the era's name), a "what" paragraph (its
 *   one-line summary), then a list of points. The last step is shown as the current one.
 * - a last row with paragraphs only (no list) is the caption.
 *
 * Behaviour: none; the steps are numbered by CSS ("1 · ", "2 · ", ...), one column each from
 * 560px of column width, stacked below it.
 *
 * @variants era-steps
 */
export default async function engine(block, { slot, rows }) {
  const figure = document.createElement('figure');
  figure.className = 'eras';
  const list = slot('eras__list');
  list.setAttribute('role', 'list');
  const caption = document.createElement('figcaption');

  rows(block).forEach((cells) => {
    const nodes = cells.flatMap((c) => [...c.children]);
    if (!nodes.some((n) => n.matches('ul, ol'))) {
      caption.append(...nodes);
      return;
    }
    const step = slot('eras__step');
    step.setAttribute('role', 'listitem');
    const paras = nodes.filter((n) => n.tagName === 'P');
    nodes.forEach((n) => {
      if (n.matches('ul, ol')) step.append(slot('eras__points', [n]));
      else if (n === paras[0]) step.append(slot('eras__when', [n]));
      else if (n === paras[1]) step.append(slot('eras__what', [n]));
      else step.append(n);
    });
    list.append(step);
  });

  const steps = [...list.children];
  if (steps.length) steps[steps.length - 1].classList.add('eras__step--now');
  figure.append(list);
  if (caption.children.length) figure.append(caption);
  block.replaceChildren(figure);
}
