/**
 * Writing index: Source | /writing-index.json, and nothing else to author. The articles own all
 * card content (their listing-* metadata) and the rows and the JSON-LD are generated: on www
 * the edge Worker serves them in the HTML, on preview hosts the browser builds them from the
 * same index (scripts/query-index.js fillFromIndex). Then they decorate as writing-list rows.
 * @ew-exempt Source URL: API configuration; article copy is edited in the source articles
 * @variants (none)
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateWritingList from '../../scripts/writing-list.js';
import { fillFromIndex } from '../../scripts/query-index.js';
import { loadWritingIndex, writingRows, writingSchemaItems } from '../../scripts/writing-index.js';
import { rowsToDOM } from '../../scripts/listing-cells.js';
import { syncCollectionSchema } from '../../scripts/collection-schema.js';

const MESSAGES = {
  empty: 'No writing is published yet.',
  error: 'Writing is temporarily unavailable. Please try again later.',
};

export default async function decorate(block) {
  block.setAttribute('aria-busy', 'true');
  const render = (articles) => {
    block.replaceChildren(...rowsToDOM(writingRows(articles), createOptimizedPicture));
    syncCollectionSchema(writingSchemaItems(articles), '/writing/');
  };
  const { state, rendered, sourceRow } = await fillFromIndex(block, loadWritingIndex, render);
  decorateWritingList(block);
  if (sourceRow) {
    sourceRow.hidden = true;
    block.append(sourceRow);
  }
  if (MESSAGES[state]) {
    const message = document.createElement('p');
    if (state === 'error') message.setAttribute('role', 'alert');
    message.textContent = MESSAGES[state];
    block.prepend(message);
  }
  block.dataset.writingState = state;
  block.dataset.rendered = rendered;
  block.removeAttribute('aria-busy');
  const target = document.getElementById(window.location.hash.slice(1));
  if (target && block.contains(target)) target.scrollIntoView();
}
