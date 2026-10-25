/**
 * Explainer (work-patterns): "Walk the five layers" from the Patterns of Work article. A layer
 * map with the spine beside it: pick a layer to see its climb, where it gets hard and its four
 * spine cells; pick a spine pillar to follow it up all five layers.
 *
 * Rows, classified by content:
 * - map (one cell holding a list): the spine label paragraph, a list of the spine pillars (same
 *   order as every layer's pillar list), the foundation link paragraph (bold label, then text);
 * - pillar view (one cell, a paragraph with an italic word): the heading (the italic word names
 *   the picked pillar), the hint paragraph, the spine link paragraph;
 * - one row per layer, in layer order (two cells): the short label | the layer card: the name
 *   paragraph (starts with the layer number), the summary, a label, the climb (an ordered list
 *   is a sequence of steps, an unordered list is parts joined with +), a label, where it gets
 *   hard, the pillar list (bold pillar name, then its cell), the read-more link paragraph;
 * - caption (one cell, plain paragraphs).
 *
 * @ew-exempt layer numbers in the layer buttons, the pillar view's rows and the pillar name in
 *   its heading - derived from the layer rows and the map's pillar list
 */

const press = (list, active) => list.forEach((b) => b.setAttribute('aria-pressed', String(b === active)));

function asButton(el, onPick, label) {
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.setAttribute('aria-pressed', 'false');
  if (label) el.setAttribute('aria-label', label);
  el.addEventListener('click', onPick);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick();
    }
  });
  return el;
}

function span(cls, text) {
  const s = document.createElement('span');
  if (cls) s.className = cls;
  if (text != null) s.textContent = text;
  return s;
}

/** Wraps the leading layer number of the name paragraph in a badge (text unchanged). */
function badge(p) {
  const first = [...p.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  const m = first && /^(\s*)(\d+)/.exec(first.textContent);
  if (!m) return null;
  first.textContent = first.textContent.slice(m[0].length);
  const n = span('pow__n', m[2]);
  first.before(n);
  return m[2];
}

function card(cell, slot) {
  const kids = [...cell.children];
  const lists = kids.filter((el) => el.matches('ol, ul'));
  const parts = { pillars: lists[1] || null };
  const out = [];
  const isGo = (el) => {
    const a = el.querySelector('a');
    return a && el.textContent.trim() === a.textContent.trim();
  };
  const pre = [];
  const mid = [];
  kids.forEach((el) => {
    if (el === lists[0]) return;
    if (el === lists[1]) return;
    if (el.tagName !== 'P') return;
    if (isGo(el)) parts.go = el;
    else if (!lists[0] || kids.indexOf(el) < kids.indexOf(lists[0])) pre.push(el);
    else mid.push(el);
  });
  const [name, ...rest] = pre;
  if (name) {
    parts.number = badge(name);
    out.push(slot('pow__name', [name]));
  }
  const k1 = rest.length > 1 ? rest.pop() : null;
  rest.forEach((p) => out.push(slot('pow__what', [p])));
  if (k1) out.push(slot('pow__k', [k1]));
  if (lists[0]) {
    const climb = slot(`pow__climb${lists[0].tagName === 'UL' ? ' pow__climb--branch' : ''}`, [lists[0]]);
    out.push(climb);
  }
  const k2 = mid.length > 1 ? mid.shift() : null;
  if (k2) out.push(slot('pow__k', [k2]));
  mid.forEach((p) => out.push(slot('pow__hard', [p])));
  if (lists[1]) out.push(slot('pow__pillars', [lists[1]]));
  if (parts.go) out.push(slot('pow__go', [parts.go]));
  return { nodes: out, parts };
}

export default async function engine(block, { slot, rows, plainLinks }) {
  let map;
  let view;
  let caption;
  const layerRows = [];
  rows(block).forEach((cells) => {
    const [cell] = cells;
    if (cells.length > 1) layerRows.push(cells);
    else if (cell.querySelector('ul, ol')) map = cell;
    else if (cell.querySelector('em')) view = cell;
    else caption = cell;
  });
  if (!map || !layerRows.length) return;
  plainLinks(block);

  // the map: layer buttons, the spine, the foundation
  const ui = slot('pow__ui');
  const mapEl = slot('pow__map');
  const layersEl = slot('pow__layers');
  layersEl.setAttribute('role', 'group');
  layersEl.setAttribute('aria-label', 'Pick a layer');
  const spine = slot('pow__spine');
  spine.setAttribute('role', 'group');
  spine.setAttribute('aria-label', 'Follow one spine pillar');
  const pillarList = map.querySelector('ul, ol');
  const pillarNames = [...pillarList.children].map((li) => li.textContent.trim());
  [...map.children].forEach((el) => {
    if (el === pillarList) return;
    if (el.querySelector('a')) return;
    const label = slot('pow__spine-label', [el]);
    label.setAttribute('aria-hidden', 'true');
    spine.append(label);
  });
  // The pillars are buttons (role on the authored li, EW7), so the list itself is presentational.
  pillarList.setAttribute('role', 'none');
  spine.append(slot('pow__pillar-list', [pillarList]));
  const foundation = [...map.children].find((el) => el.tagName === 'P' && el.querySelector('a'));
  mapEl.append(layersEl, spine);
  if (foundation) mapEl.append(slot('pow__foundation', [foundation]));

  // the panel: the layer cards, and the pillar view
  const panel = slot('pow__panel');
  panel.setAttribute('aria-live', 'polite');
  const data = slot('pow__data');
  const layers = layerRows.map(([short, body], i) => {
    const { nodes, parts } = card(body, slot);
    const n = parts.number || String(i + 1);
    const el = slot('pow__layer', nodes);
    el.dataset.layer = n;
    el.id = `pow-${n}`;
    data.append(el);
    // eslint-disable-next-line no-use-before-define
    const btn = asButton(slot('pow__lbtn', [span('pow__n', n), ...short.children]), () => showLayer(i));
    btn.setAttribute('aria-controls', el.id);
    layersEl.append(btn);
    const cells = parts.pillars ? [...parts.pillars.children].map((li) => {
      const strong = li.querySelector('strong');
      return li.textContent.slice(strong ? strong.textContent.length : 0).trim();
    }) : [];
    return {
      el, btn, n, short: btn.textContent.slice(n.length).trim(), cells,
    };
  });
  const col = slot('pow__col');
  col.hidden = true;
  const viewKids = view ? [...view.children] : [];
  const heading = viewKids.find((el) => el.querySelector('em'));
  const viewGo = viewKids.find((el) => el !== heading && el.querySelector('a'));
  const hints = viewKids.filter((el) => el !== heading && el !== viewGo);
  const rowsEl = document.createElement('ol');
  rowsEl.className = 'pow__rows';
  if (heading) col.append(slot('pow__name', [heading]));
  col.append(rowsEl);
  hints.forEach((p) => col.append(slot('pow__hint', [p])));
  if (viewGo) col.append(slot('pow__go', [viewGo]));
  panel.append(data, col);
  ui.append(mapEl, panel);

  const layerBtns = layers.map((l) => l.btn);
  const pillarBtns = [...pillarList.children];

  function showLayer(i) {
    layers.forEach((l, j) => { l.el.hidden = j !== i; });
    data.hidden = false;
    col.hidden = true;
    layersEl.classList.remove('is-pillar');
    press(layerBtns, layerBtns[i]);
    press(pillarBtns, null);
  }

  function showPillar(p) {
    const em = heading && heading.querySelector('em');
    if (em) em.textContent = pillarNames[p];
    const items = layers.map((l, i) => {
      const cell = l.cells[p] || '';
      const row = asButton(document.createElement('div'), () => {
        showLayer(i);
        layerBtns[i].focus();
      }, `Layer ${l.n}, ${l.short}: ${cell}. Open this layer.`);
      row.removeAttribute('aria-pressed');
      row.className = 'pow__row';
      const b = document.createElement('b');
      b.textContent = cell;
      row.append(span('pow__n', l.n), span(null, l.short), b);
      const li = document.createElement('li');
      li.append(row);
      return li;
    });
    rowsEl.replaceChildren(...items);
    data.hidden = true;
    col.hidden = false;
    layersEl.classList.add('is-pillar');
    press(layerBtns, null);
    press(pillarBtns, pillarBtns[p]);
  }

  pillarBtns.forEach((li, p) => asButton(li, () => showPillar(p), `Follow ${pillarNames[p]} up all five layers`));

  const kids = [ui];
  if (caption) kids.push(slot('x-caption', [...caption.children]));
  block.replaceChildren(...kids);
  showLayer(0);
}
