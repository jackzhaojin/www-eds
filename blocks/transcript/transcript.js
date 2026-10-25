/**
 * Transcript: the full transcript of a video in a details panel, in the DOM even when closed,
 * for parsers and for find in page (design-system/v3 transcript). Rows: the summary row (the
 * title cell, then an optional note cell such as "auto generated, corrected by hand"), then a
 * row holding the transcript paragraphs.
 *
 * A paragraph that starts with a timestamp (0:00, 1:02:03) shows it in faint mono: the stamp
 * is wrapped in a span, the text is unchanged.
 *
 * @variants open
 *   open - the panel starts open (the post template keeps it closed)
 */
const STAMP = /^(\d{1,2}:)?\d{1,2}:\d{2}\s*/;

function markStamp(p) {
  const first = p.firstChild;
  if (!first || first.nodeType !== Node.TEXT_NODE) return;
  const [stamp] = first.textContent.match(STAMP) || [];
  if (!stamp) return;
  const span = document.createElement('span');
  span.className = 'transcript-ts';
  span.textContent = stamp;
  first.textContent = first.textContent.slice(stamp.length);
  p.prepend(span);
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const [head, ...bodies] = rows;
  const details = document.createElement('details');
  details.className = 'transcript-panel';
  details.open = block.classList.contains('open');

  const summary = document.createElement('summary');
  summary.className = 'transcript-summary';
  if (head) {
    const [title, ...notes] = [...head.children];
    if (title) {
      const box = document.createElement('div');
      box.className = 'transcript-title';
      box.append(...title.children);
      summary.append(box);
    }
    notes.forEach((cell) => {
      const box = document.createElement('div');
      box.className = 'transcript-note';
      box.append(...cell.children);
      summary.append(box);
    });
  }
  details.append(summary);

  const body = document.createElement('div');
  body.className = 'transcript-body';
  bodies.forEach((row) => [...row.children].forEach((cell) => body.append(...cell.children)));
  body.querySelectorAll(':scope > p').forEach(markStamp);
  details.append(body);

  block.replaceChildren(details);
}
