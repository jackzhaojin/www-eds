/** Read the complete native EDS collection, including every index page. */
export default async function loadQueryIndex(source, fetchData = fetch) {
  const endpoint = new URL(source);
  const records = [];
  const page = async (offset) => {
    const url = new URL(endpoint);
    url.searchParams.set('offset', offset);
    url.searchParams.set('limit', 200);
    const response = await fetchData(url.href);
    if (!response.ok) throw new Error(`Index returned ${response.status}`);
    const result = await response.json();
    if (!Array.isArray(result.data) || !Number.isInteger(result.total)
      || result.total < 0 || result.offset !== offset
      || result.data.length > result.total - offset) {
      throw new Error('The index has an invalid collection envelope');
    }
    records.push(...result.data);
    const next = offset + result.data.length;
    if (next < result.total) {
      if (next === offset) throw new Error('The index pagination made no progress');
      await page(next);
    }
  };
  await page(0);
  return records;
}

/** How long a listing waits for its index before it gives up (ms). */
export const INDEX_WAIT = 5000;

/** Settles with the promise, or rejects once ms have passed. */
export function within(promise, ms) {
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`The index took longer than ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Fills a dynamic listing block from the index its Source row names, and removes that row. On
 * www the edge Worker has already served the rows and the JSON-LD in the HTML
 * (edge/src/listings.mjs), so crawlers that don't run JavaScript read them: rows after the
 * Source row are kept as they are. Otherwise (preview hosts) load(href) reads the index and
 * render(records) builds the rows here. Returns the state (ready, empty or error), where the
 * rows were rendered (server or browser) and the Source row, for the block to keep hidden
 * after it decorates (Experience Workspace edits it there).
 */
export async function fillFromIndex(block, load, render, wait = INDEX_WAIT) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const sourceRow = rows.find((row) => row.firstElementChild?.textContent.trim().toLowerCase() === 'source');
  const source = sourceRow?.querySelector('a[href]');
  sourceRow?.remove();
  if (rows.length > (sourceRow ? 1 : 0)) return { state: 'ready', rendered: 'server', sourceRow };
  try {
    if (!source) throw new Error('The listing has no Source row');
    const records = await within(load(source.href), wait);
    render(records);
    return { state: records.length ? 'ready' : 'empty', rendered: 'browser', sourceRow };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`${block.classList[0]}: unable to load the listing (${error.message})`);
    return { state: 'error', rendered: 'browser', sourceRow };
  }
}
