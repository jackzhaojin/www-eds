/**
 * Explainer (content-contract): the teaser's content contract, for "Adobe's EDS skills,
 * hands-on". decorate() from blocks/teaser/teaser.js (eds-skill-assess-2026-05 at 4a15caf), run
 * in the browser on rows an author might write: the DA table, the markup decorate() makes, and
 * the decorated block drawn small.
 *
 * Rows, read by content:
 * - bar: the first row, one cell: the label paragraph, then the source link paragraph;
 * - labels: four cells: the choices label | the document label | the markup label | the
 *   preview label;
 * - scenarios: one row per authoring choice, three cells: the chip label | a list of settings
 *   (variant: the block's variant word or none, rows: N, links: N, eyebrow: italics or plain,
 *   extra: yes or no) | the verdict's bold lead; the first is picked on load;
 * - entries: one row per teaser entry, four cells: the eyebrow | the heading | the body | a
 *   list of the link labels;
 * - static: a one-cell row with the explanation paragraph, then the markup as a code block,
 *   shown without JavaScript;
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants content-contract
 * @ew-exempt scenarios and entries - data, drawn as the document, markup and preview; the
 *   static explanation and markup - the no-JavaScript fallback
 */

// blocks/teaser/teaser.js at 4a15caf, lines 3 to 30, unchanged.
const VARIANTS = ['banner', 'cards-2', 'cards-3', 'cards-4'];

function isCtaParagraph(p) {
  const links = p.querySelectorAll('a');
  if (!links.length) return false;
  return [...p.childNodes].every((node) => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim() === '';
    return ['A', 'EM', 'STRONG', 'BR'].indexOf(node.tagName) !== -1;
  });
}

function markEyebrow(textCell) {
  const first = textCell.firstElementChild;
  if (!first || first.tagName !== 'P') return;
  const em = first.querySelector('em');
  if (!em || first.children.length !== 1) return;
  first.classList.add('teaser-eyebrow');
  first.textContent = em.textContent;
}

function markCtas(textCell) {
  const cta = [...textCell.querySelectorAll('p')].reverse().find(isCtaParagraph);
  if (!cta) return;
  cta.classList.add('teaser-ctas');
  cta.querySelectorAll('a').forEach((a, i) => {
    a.classList.add('button', i === 0 ? 'primary' : 'secondary');
  });
}

// decorate(), lines 32 to 69. The picture optimization at lines 61 to 66 is left out because
// the demo has no real images.
function decorateTeaser(block) {
  const rows = [...block.children];
  let variant = VARIANTS.find((v) => block.classList.contains(v));
  if (!variant) {
    variant = rows.length === 1 ? 'banner' : 'cards-3';
    block.classList.add(variant);
  }
  const ul = document.createElement('ul');
  rows.forEach((row) => {
    const li = document.createElement('li');
    li.className = 'teaser-item';
    [...row.children].forEach((cell) => {
      const wrap = document.createElement('div');
      if (cell.querySelector('picture')) {
        wrap.className = 'teaser-visual';
      } else {
        wrap.className = 'teaser-text';
        markEyebrow(cell);
        markCtas(cell);
      }
      wrap.append(...cell.childNodes);
      li.append(wrap);
    });
    ul.append(li);
  });
  block.replaceChildren(ul);
  return variant;
}

const txt = (node) => (node ? node.textContent.trim() : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function el(tag, attrs, kids) {
  const n = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
  (kids || []).forEach((k) => n.append(k));
  return n;
}

function settingsOf(cell) {
  const out = {};
  cell.querySelectorAll('li').forEach((li) => {
    const m = /^\s*([a-z ]+?)\s*:\s*(.*)$/i.exec(li.textContent);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  });
  return {
    variant: /^none$/i.test(out.variant || '') ? '' : (out.variant || ''),
    rows: +out.rows || 1,
    ctas: +(out.links ?? 1),
    eyebrow: !/^plain$/i.test(out.eyebrow || ''),
    extra: /^yes$/i.test(out.extra || ''),
  };
}

function classify(rows) {
  const parts = { scenarios: [], entries: [] };
  const single = [];
  rows.forEach((cells, i) => {
    const [a] = cells;
    if (cells.length === 4 && cells[3].querySelector('ul, ol')) parts.entries.push(cells);
    else if (cells.length === 4) parts.labels = cells;
    else if (cells.length === 3 && cells[1].querySelector('ul')) parts.scenarios.push(cells);
    else if (i === 0) parts.bar = a;
    else if (a.querySelector('pre')) parts.staticRow = a;
    else single.push(a);
  });
  parts.caption = single.pop();
  return parts;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const parts = classify(rows(block));
  const frame = slot('lab ccl');
  if (parts.bar) {
    const bar = slot('lab__bar', [...parts.bar.children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const data = slot('ccl-data');
  const [choiceLabel, docLabel, treeLabel, previewLabel] = parts.labels || [];

  const picks = slot('ccl-picks');
  picks.setAttribute('role', 'radiogroup');
  picks.setAttribute('aria-label', txt(choiceLabel) || 'What the author writes');
  const scenarios = parts.scenarios.map(([label, settings, lead]) => {
    const chip = slot('ccl-chip', [...label.children]);
    chip.setAttribute('role', 'radio');
    picks.append(chip);
    const s = { chip, ...settingsOf(settings), lead: txt(lead) };
    data.append(...settings.children, ...lead.children);
    return s;
  });
  const entries = parts.entries.map(([eyebrow, heading, body, links]) => {
    const e = {
      eyebrow: txt(eyebrow), heading: txt(heading), body: txt(body), links: [...links.querySelectorAll('li')].map(txt),
    };
    data.append(...eyebrow.children, ...heading.children, ...body.children, ...links.children);
    return e;
  });
  frame.append(slot('ccl-controls', [slot('ccl-choice', [slot('lab__label', choiceLabel ? [...choiceLabel.children] : []), picks])]));

  const left = slot('lab__left');
  const right = slot('lab__right');
  frame.append(slot('lab__grid', [left, right]));
  const docEl = slot('ccl-doc');
  const whyEl = document.createElement('p');
  whyEl.className = 'ccl-why';
  whyEl.setAttribute('aria-live', 'polite');
  left.append(slot('lab__label', docLabel ? [...docLabel.children] : []), docEl, whyEl);
  const treeEl = document.createElement('pre');
  treeEl.className = 'ccl-tree';
  right.append(slot('lab__label', treeLabel ? [...treeLabel.children] : []), treeEl);
  if (parts.staticRow) frame.append(slot('ccl-static', [...parts.staticRow.children]));
  const prevEl = slot('ccl-preview');
  prevEl.setAttribute('aria-hidden', 'true');
  frame.append(slot('ccl-prevwrap', [slot('lab__label', previewLabel ? [...previewLabel.children] : []), prevEl]));
  frame.append(data);
  if (parts.caption) frame.append(slot('x-caption ccl-caption', [...parts.caption.children]));
  block.replaceChildren(frame);
  if (!scenarios.length || !entries.length) return;

  // The block as EDS delivers it before decoration: a div per row, a div per cell.
  function authoredBlock(st) {
    const teaser = el('div', { class: `teaser${st.variant ? ` ${st.variant}` : ''}` });
    for (let i = 0; i < st.rows; i += 1) {
      const e = entries[i % entries.length];
      const text = el('div');
      text.append(st.eyebrow ? el('p', null, [el('em', null, [e.eyebrow])]) : el('p', null, [e.eyebrow]));
      text.append(el('h3', null, [e.heading]));
      text.append(el('p', null, [e.body]));
      if (st.ctas > 0) {
        const p = el('p');
        if (st.extra) p.append('Or ');
        e.links.slice(0, st.ctas).forEach((t, j) => {
          if (j) p.append(' ');
          p.append(el('a', { href: '#' }, [t]));
        });
        text.append(p);
      }
      teaser.append(el('div', null, [el('div', null, [el('picture')]), text]));
    }
    return teaser;
  }

  function docTable(st) {
    const name = `Teaser${st.variant ? ` (${st.variant})` : ''}`;
    let rowsHtml = '';
    for (let i = 0; i < st.rows; i += 1) {
      const e = entries[i % entries.length];
      const links = st.ctas ? `<p>${st.extra ? 'Or ' : ''}${e.links.slice(0, st.ctas).map((t) => `<u>${esc(t)}</u>`).join(' ')}</p>` : '';
      rowsHtml += `<tr><td class="ccl-img">image</td><td>${st.eyebrow ? `<p><em>${esc(e.eyebrow)}</em></p>` : `<p>${esc(e.eyebrow)}</p>`}<p class="h">${esc(e.heading)}</p><p>${esc(e.body)}</p>${links}</td></tr>`;
    }
    return `<table class="ccl-table"><thead><tr><th colspan="2">${esc(name)}</th></tr></thead><tbody>${rowsHtml}</tbody></table>`;
  }

  const HOT = ['teaser-eyebrow', 'teaser-ctas', 'button', 'primary', 'secondary', 'teaser-item', 'teaser-visual', 'teaser-text', ...VARIANTS];
  function tree(node, depth, out) {
    const pad = '  '.repeat(depth);
    const tag = node.tagName.toLowerCase();
    const cls = node.className ? ` class="${node.className.split(' ').map((c) => (HOT.includes(c) ? `<span class="hot">${esc(c)}</span>` : esc(c))).join(' ')}"` : '';
    const t = node.textContent.trim();
    const short = esc(t.length > 26 ? `${t.slice(0, 25)}…` : t);
    const line = `${pad}&lt;${tag}${cls}&gt;`;
    if (tag === 'picture') {
      out.push(line);
      return;
    }
    if (['p', 'h3', 'a', 'em'].includes(tag) && !node.children.length) {
      out.push(`${line} ${short}`);
      return;
    }
    out.push(tag === 'p' && !node.classList.contains('teaser-ctas') ? `${line} ${short}` : line);
    [...node.children].forEach((c, i) => {
      if (tag === 'ul' && i > 0) {
        if (i === 1) out.push(`${pad}  <span class="dim">&lt;li class="teaser-item"&gt; …${node.children.length - 1} more</span>`);
        return;
      }
      tree(c, depth + 1, out);
    });
  }

  function render(st) {
    scenarios.forEach((x) => {
      x.chip.setAttribute('aria-checked', String(x === st));
      x.chip.tabIndex = x === st ? 0 : -1;
    });
    docEl.innerHTML = docTable(st);
    const teaser = authoredBlock(st);
    const variant = decorateTeaser(teaser);
    const lines = [];
    tree(teaser, 0, lines);
    treeEl.innerHTML = lines.join('\n');
    prevEl.replaceChildren(teaser.cloneNode(true));
    prevEl.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));

    const why = [`<strong>${esc(st.lead)}</strong>`];
    if (st.variant) why.push(`The variant comes from the block name: <code>${variant}</code>.`);
    else why.push(`No variant in the block name, so decorate() picks one: ${st.rows}${st.rows === 1 ? ' row means' : ' rows mean'} <code>${variant}</code>.`);
    why.push(st.eyebrow ? 'A first paragraph holding only italics becomes the eyebrow.' : 'Without italics, the first paragraph stays a plain paragraph, so there is no eyebrow.');
    if (!st.ctas) why.push('No links, so no buttons.');
    else if (st.extra) why.push('The extra words make the link paragraph fail <code>isCtaParagraph()</code>, so the links stay plain links.');
    else why.push(st.ctas === 1 ? 'The last paragraph of links becomes a primary button.' : 'The last paragraph of links becomes a primary and a secondary button.');
    whyEl.innerHTML = why.join(' ');
  }

  scenarios.forEach((s, i) => {
    s.chip.addEventListener('click', () => render(s));
    s.chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        render(s);
        return;
      }
      const d = ['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const next = scenarios[(i + d + scenarios.length) % scenarios.length];
      render(next);
      next.chip.focus();
    });
  });
  block.classList.add('is-live');
  render(scenarios[0]);
}
