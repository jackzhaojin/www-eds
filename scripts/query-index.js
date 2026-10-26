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
