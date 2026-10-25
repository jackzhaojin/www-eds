/**
 * Explainer (step-checklist): a numbered checklist of a skill's steps, read without JavaScript
 * (the explainer kit's static step list, as for create-site's checklist in "Adobe's EDS
 * skills, hands-on"). The steps a person has to do are highlighted.
 *
 * Rows, read by content:
 * - steps: a cell with the ordered list, each item a bold title, then the text, then the source
 *   lines in italics (shown under the text in small mono);
 * - settings: a one-cell row with a list holding "human: N[, M]", the steps that need a person;
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants step-checklist
 * @ew-exempt the settings - data, never displayed
 */

const txt = (el) => (el ? el.textContent.trim() : '');

export default async function engine(block, { slot, rows }) {
  const frame = slot('steps-frame');
  const data = slot('steps-data');
  let list = null;
  let caption = null;
  rows(block).forEach(([a]) => {
    if (!a) return;
    if (a.querySelector('ol') && !list) {
      list = a.querySelector('ol');
      frame.append(slot('steps-list', [...a.children]));
    } else if (/^human\s*:/i.test(txt(a.querySelector('li')))) data.append(...a.children);
    else caption = a;
  });
  frame.append(data);
  if (caption) frame.append(slot('x-caption steps-caption', [...caption.children]));
  block.replaceChildren(frame);
  if (!list) return;
  const human = new Set(((/human\s*:\s*([\d,\s]+)/i.exec(txt(data)) || [])[1] || '').split(/[\s,]+/).filter(Boolean).map(Number));
  [...list.children].forEach((li, i) => li.toggleAttribute('data-human', human.has(i + 1)));
}
