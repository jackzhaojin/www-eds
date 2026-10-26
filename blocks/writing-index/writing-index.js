/**
 * Writing index: Source | /writing-index.json. The article documents own all card content.
 * @ew-exempt Source URL: API configuration; article copy is edited in the source articles
 * @variants (none)
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import decorateWritingList from '../../scripts/writing-list.js';
import { loadWritingIndex, writingRows } from '../../scripts/writing-index.js';
import syncCollectionItems from '../../scripts/collection-schema.js';

export default async function decorate(block) {
  const source = block.querySelector('a[href]');
  const config = document.createElement('div');
  config.hidden = true;
  config.append(...block.childNodes);
  block.replaceChildren(config);
  block.setAttribute('aria-busy', 'true');
  try {
    if (!source) throw new Error('The writing index needs a Source URL');
    const articles = await loadWritingIndex(source.href);
    block.replaceChildren(...writingRows(articles, createOptimizedPicture));
    decorateWritingList(block);
    block.append(config);
    syncCollectionItems(articles.map((article) => ({
      '@type': 'BlogPosting',
      '@id': `${article.url}#article`,
      url: article.url,
      headline: article.title,
      name: article.title,
      description: article.summary,
      ...(article.date ? { datePublished: article.date } : {}),
      ...(article.image ? { image: article.image } : {}),
    })), '/writing/');
    if (!articles.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No writing is published yet.';
      block.prepend(empty);
    }
    block.dataset.writingState = articles.length ? 'ready' : 'empty';
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && block.contains(target)) target.scrollIntoView();
  } catch (error) {
    block.replaceChildren(config);
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = 'Writing is temporarily unavailable. Please try again later.';
    block.prepend(message);
    block.dataset.writingState = 'error';
    // eslint-disable-next-line no-console
    console.warn('Unable to load writing:', error.message);
  } finally {
    block.removeAttribute('aria-busy');
  }
}
