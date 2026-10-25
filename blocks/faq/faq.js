/**
 * FAQ: question and answer pairs as native disclosures (design-system/v3 FAQ). A first row
 * with a single cell holding a heading is the FAQ's heading. Then one row per question: the
 * question cell, the answer cell (one or more paragraphs or a list), and an optional third
 * cell reading "open" that shows the answer open on load.
 *
 * The answer is in the DOM open or closed; opening is the browser's own details behavior, so
 * no script is needed to read it. The question paragraph moves into the summary, so it stays
 * editable, and the chevron is decorative generated content.
 *
 * @variants (none)
 * @ew-exempt <p> "open" - the third cell's state word, text-as-metadata, never displayed
 */
export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const items = document.createElement('div');
  items.className = 'faq-items';
  const kept = [];

  rows.forEach((row, i) => {
    const cells = [...row.children];
    if (i === 0 && cells.length === 1 && cells[0].querySelector('h1, h2, h3, h4, h5, h6')) {
      const head = document.createElement('div');
      head.className = 'faq-head';
      head.append(...cells[0].children);
      kept.push(head);
      return;
    }
    const [question, answer, state] = cells;
    if (!question) return;
    const details = document.createElement('details');
    details.className = 'faq-item';
    const summary = document.createElement('summary');
    summary.className = 'faq-question';
    summary.append(...question.children);
    details.append(summary);
    if (answer) {
      const body = document.createElement('div');
      body.className = 'faq-answer';
      body.append(...answer.children);
      details.append(body);
    }
    if (state) {
      const meta = document.createElement('div');
      meta.className = 'faq-state';
      meta.append(...state.children);
      details.open = /^\s*open\s*$/i.test(meta.textContent);
      details.append(meta);
    }
    items.append(details);
  });

  block.replaceChildren(...kept, items);
}
