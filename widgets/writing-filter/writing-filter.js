/**
 * Writing filter: search plus topic and year filters over the writing-list block in the same
 * section, in place, always newest first (js/writing-filter.js on the source). The topic and
 * year chips come from the rows (their topics in order of first use, their years newest first),
 * so a new row or topic needs no change here. State lives in the URL fragment so a selection
 * can be shared (#topic=aem&year=2025&q=caching); nothing reloads or navigates.
 */

function normalize(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.+#/ ]+/g, ' ');
}

function chip(filter, value, label, dot) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `writing-filter-chip${dot === null ? ' plain' : ''}`;
  if (dot) button.dataset.topic = dot;
  button.dataset.filter = filter;
  button.dataset.value = value;
  button.setAttribute('aria-pressed', 'false');
  const n = document.createElement('span');
  n.className = 'writing-filter-n';
  button.append(`${label} `, n);
  return button;
}

function bind(widget, block) {
  const bar = widget.querySelector('.writing-filter-bar');
  const search = bar.querySelector('input[type="search"]');
  const count = bar.querySelector('[data-count]');
  const empty = widget.querySelector('[data-empty]');
  const rows = [...block.querySelectorAll('.writing-list-items > li')];
  const items = rows.map((li) => ({
    li,
    topics: (li.dataset.topics || '').split(' ').filter(Boolean),
    year: li.dataset.year || '',
    text: normalize(li.dataset.search || li.textContent),
  }));

  const topics = new Map();
  rows.forEach((li) => {
    const labels = [...li.querySelectorAll('.writing-list-tags li')];
    (li.dataset.topics || '').split(' ').filter(Boolean).forEach((key, i) => {
      if (!topics.has(key) && labels[i]) topics.set(key, { label: labels[i].textContent.trim(), dot: labels[i].dataset.topic || '' });
    });
  });
  const years = [...new Set(items.map((item) => item.year).filter(Boolean))].sort().reverse();
  const groups = {
    topic: [['all', 'All', null], ...[...topics].map(([key, t]) => [key, t.label, t.dot])],
    year: [['all', 'All', null], ...years.map((y) => [y, y, null])],
  };
  Object.entries(groups).forEach(([filter, values]) => {
    const host = bar.querySelector(`.writing-filter-chips[data-filter="${filter}"]`);
    const buttons = values.map(([value, label, dot]) => chip(filter, value, label, dot));
    if (host) host.replaceChildren(...buttons);
  });
  const chips = [...bar.querySelectorAll('button[data-filter]')];

  const defaults = { q: '', topic: 'all', year: 'all' };
  let state = { ...defaults };
  let timer;

  function matches(item, s) {
    if (s.topic !== 'all' && !item.topics.includes(s.topic)) return false;
    if (s.year !== 'all' && item.year !== s.year) return false;
    return normalize(s.q).split(' ').filter(Boolean).every((term) => item.text.includes(term));
  }

  function writeHash() {
    const parts = Object.keys(defaults)
      .filter((k) => state[k] !== defaults[k])
      .map((k) => `${k}=${encodeURIComponent(state[k])}`);
    const hash = parts.length ? `#${parts.join('&')}` : '';
    // Leave a plain #article-id anchor alone when no filter is active.
    if (!parts.length && !window.location.hash.includes('=')) return;
    if (hash !== window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
  }

  function render() {
    let shown = 0;
    let first = true;
    let lastYear = null;
    items.forEach((item) => {
      const ok = matches(item, state);
      item.li.hidden = !ok;
      item.li.removeAttribute('data-first');
      item.li.removeAttribute('data-year-mark');
      if (!ok) return;
      shown += 1;
      if (first) item.li.dataset.first = '';
      first = false;
      if (item.year !== lastYear) item.li.dataset.yearMark = item.year;
      lastYear = item.year;
    });

    chips.forEach((button) => {
      const key = button.dataset.filter;
      const { value } = button.dataset;
      button.setAttribute('aria-pressed', String(state[key] === value));
      const n = button.querySelector('.writing-filter-n');
      const c = items.filter((item) => matches(item, { ...state, [key]: value })).length;
      n.textContent = c;
      button.classList.toggle('is-zero', c === 0 && state[key] !== value);
    });

    count.textContent = shown === items.length ? `All ${items.length} pieces` : `${shown} of ${items.length} pieces`;
    if (empty) empty.hidden = shown !== 0;
    writeHash();
  }

  function readHash() {
    state = { ...defaults };
    window.location.hash.replace(/^#/, '').split('&').forEach((pair) => {
      const i = pair.indexOf('=');
      if (i < 1) return;
      const k = pair.slice(0, i);
      if (k in defaults) state[k] = decodeURIComponent(pair.slice(i + 1));
    });
    // Ignore values that no control offers, so a stale link still shows everything.
    ['topic', 'year'].forEach((k) => {
      if (!chips.some((b) => b.dataset.filter === k && b.dataset.value === state[k])) state[k] = 'all';
    });
    search.value = state.q;
  }

  chips.forEach((button) => button.addEventListener('click', () => {
    state[button.dataset.filter] = button.dataset.value;
    render();
  }));
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = search.value.trim(); render(); }, 120);
  });
  bar.addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = search.value.trim();
    render();
  });
  widget.querySelectorAll('[data-reset]').forEach((button) => button.addEventListener('click', () => {
    state = { ...defaults };
    search.value = '';
    render();
    search.focus();
  }));
  window.addEventListener('hashchange', () => { readHash(); render(); });
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey
      && !(t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) {
      e.preventDefault();
      search.focus();
    }
  });

  readHash();
  render();
}

export default function decorate(widget) {
  const scope = widget.closest('.section') || document;
  const selector = '.writing-list, .writing-index';
  const block = scope.querySelector(selector) || document.querySelector(selector);
  if (!block) return;
  const connect = () => {
    if (['error', 'empty'].includes(block.dataset.writingState)) {
      widget.querySelectorAll('input, button').forEach((control) => { control.disabled = true; });
      const count = widget.querySelector('[data-count]');
      if (count) count.textContent = block.dataset.writingState === 'error' ? 'Unavailable' : 'No published writing';
      const empty = widget.querySelector('[data-empty]');
      if (empty) empty.hidden = true;
      return;
    }
    bind(widget, block);
  };
  // The list block loads after this widget in the same section: bind once it is decorated.
  if (block.dataset.blockStatus === 'loaded') {
    connect();
    return;
  }
  const observer = new MutationObserver(() => {
    if (block.dataset.blockStatus !== 'loaded') return;
    observer.disconnect();
    connect();
  });
  observer.observe(block, { attributes: true, attributeFilter: ['data-block-status'] });
}
