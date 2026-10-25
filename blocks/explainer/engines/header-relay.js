/**
 * Explainer engine "header-relay": cache headers travelling up a stack of layers (the header
 * relay of "AEM caching in production architectures"). Every layer respects the header from the
 * layer below and can change it for the layer above; a CDN that reads Surrogate-Control uses it
 * first. Switch each layer between passing the header on and changing it.
 *
 * Rows, in this order:
 * 1. one cell: the bar (two label paragraphs);
 * 2. two cells: the column labels (what a layer does | what it returns);
 * 3. one row per layer, top to bottom: the name cell (the bold name, the subtitle, and an
 *    italic paragraph with the layer's name inside a sentence, not shown), then its options.
 *    A layer with one option cell has no switch; with two or more, each option cell starts with
 *    its switch label (bold = picked first). After the label: the does paragraph, then the
 *    returns paragraph (inline code "Header: max-age=N" sets that header; N as {cc} or {sc}
 *    passes on the value that came in from below; a layer passes on only what it returns;
 *    anything without code is shown as is). In the does paragraph {cc} is the Cache-Control
 *    value from below, {ttl} the Surrogate-Control value from below when there is one, else
 *    {cc}, and {src} the name of the header {ttl} came from. An option that sets its own
 *    numbers changes the headers;
 * 4. three cells: the verdicts (shown without JavaScript | nothing changed | some layer changed):
 *    {cc} and {ttl} as above, for the browser's and the Surrogate-reading CDN's lifetimes, {by}
 *    the layer that set the browser's value, {changed} the layers that changed the headers,
 *    {count} how many ("One layer", "2 layers");
 * 5. one cell: the caption.
 *
 * @variants (none)
 * @ew-exempt the does and returns lines and the verdict are rendered from the authored
 *   templates; the column labels repeat on every layer
 */

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();
const HEADER = /^([A-Za-z-]+):\s*max-age=(\d+|\{cc\}|\{sc\})$/;
const KEY = { 'cache-control': 'cc', 'surrogate-control': 'sc' };

const fill = (html, vars) => html.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'relay';
  const meta = slot('relay-meta');
  const [barRow, labelRow, ...rest] = all;
  const capRow = rest.length && rest[rest.length - 1].length === 1 ? rest.pop() : null;
  const verdictRow = rest.pop();
  const layerRows = rest;

  if (barRow) frame.append(slot('relay__bar', [...barRow[0].children]));
  const [doesLabel, returnsLabel] = (labelRow || []).map((c) => c.textContent.trim());
  (labelRow || []).forEach((c) => meta.append(...c.children));

  const stack = document.createElement('ol');
  stack.className = 'relay__stack';
  const layers = layerRows.map((cells) => {
    const [nameCell, ...opts] = cells;
    const li = document.createElement('li');
    li.className = 'relay__layer';
    const nameEls = [...nameCell.children];
    const short = nameEls.find(isName);
    if (short) meta.append(short);
    const shown = nameEls.filter((el) => el !== short);
    const name = slot('relay__name', shown.map((el, k) => slot(k === 0 ? 'relay-title' : 'relay-sub', [el])));
    const title = shown[0] ? shown[0].textContent.trim() : '';
    li.append(name);

    const hasSwitch = opts.length > 1;
    const ctl = slot('relay__ctl');
    const doesBox = slot('relay-text relay-does');
    const retBox = slot('relay-text relay-returns');
    let pick = 0;
    const options = opts.map((cell, k) => {
      const kids = [...cell.children];
      const label = hasSwitch ? kids.shift() : null;
      const [does, ret] = kids;
      if (label) {
        const radio = slot('relay-option', [label]);
        if (label.querySelector('strong')) pick = k;
        ctl.append(radio);
      }
      const d = slot('relay-alt', does ? [does] : []);
      const r = slot('relay-alt', ret ? [ret] : []);
      doesBox.append(d);
      retBox.append(r);
      const headers = [...(ret ? ret.querySelectorAll('code') : [])].map((c) => HEADER.exec(c.textContent.trim())).filter(Boolean)
        .map(([, h, v]) => ({ key: KEY[h.toLowerCase()], v }));
      return {
        radio: ctl.lastElementChild && label ? ctl.lastElementChild : null,
        d,
        r,
        does,
        ret,
        doesHtml: does ? does.innerHTML : '',
        retHtml: ret ? ret.innerHTML : '',
        headers,
        sets: headers.some((x) => /^\d+$/.test(x.v)),
      };
    });
    if (hasSwitch) {
      ctl.setAttribute('role', 'radiogroup');
      ctl.setAttribute('aria-label', title);
      li.append(ctl);
    } else li.classList.add('no-ctl');
    const k1 = document.createElement('span');
    k1.className = 'relay__k';
    k1.textContent = doesLabel || '';
    const k2 = document.createElement('span');
    k2.className = 'relay__k';
    k2.textContent = returnsLabel || '';
    li.append(slot('relay__cols', [slot('relay-col', [k1, doesBox]), slot('relay-col', [k2, retBox])]));
    stack.append(li);
    return {
      li, options, pick, short: short ? short.textContent.trim() : title,
    };
  });
  frame.append(stack);

  const [vStatic, vSimple, vChanged] = verdictRow || [];
  const verdict = slot('relay__verdict');
  verdict.setAttribute('aria-live', 'polite');
  const vS = slot('relay-alt', vStatic ? [...vStatic.children] : []);
  const simpleEls = vSimple ? [...vSimple.children] : [];
  const changedEls = vChanged ? [...vChanged.children] : [];
  const v1 = slot('relay-alt', simpleEls);
  const v2 = slot('relay-alt', changedEls);
  const tSimple = simpleEls.map((e) => e.innerHTML);
  const tChanged = changedEls.map((e) => e.innerHTML);
  verdict.append(vS, v1, v2);
  frame.append(verdict);
  if (capRow) {
    const cap = document.createElement('figcaption');
    cap.append(...capRow[0].children);
    frame.append(cap);
  }
  frame.append(meta);

  const render = () => {
    // bottom up: each layer takes the headers from the layer below
    let below = { cc: null, sc: null, by: null };
    let ttlSeen = null;
    const changed = [];
    [...layers].reverse().forEach((ly) => {
      const opt = ly.options[ly.pick];
      if (!opt) return;
      const ttl = below.sc != null ? below.sc : below.cc;
      const src = below.sc != null ? 'Surrogate-Control' : 'Cache-Control';
      const vars = {
        cc: below.cc, sc: below.sc, ttl, src,
      };
      if (opt.doesHtml.includes('{ttl}')) ttlSeen = ttl;
      if (opt.does) opt.does.innerHTML = fill(opt.doesHtml, vars);
      let out = below;
      if (opt.headers.length) {
        out = { cc: null, sc: null, by: below.by };
        opt.headers.forEach(({ key, v }) => {
          if (/^\d+$/.test(v)) {
            out[key] = Number(v);
            if (key === 'cc') out.by = ly.short;
          } else out[key] = below[v.slice(1, -1)];
        });
        if (opt.ret) opt.ret.innerHTML = fill(opt.retHtml, vars);
      }
      const isChanged = opt.sets && ly.options.length > 1;
      if (isChanged) changed.push(ly.short);
      ly.li.classList.toggle('is-changed', isChanged);
      ly.options.forEach((o, k) => {
        o.d.classList.toggle('is-on', k === ly.pick);
        o.r.classList.toggle('is-on', k === ly.pick);
        if (o.radio) {
          o.radio.setAttribute('aria-checked', String(k === ly.pick));
          o.radio.tabIndex = k === ly.pick ? 0 : -1;
        }
      });
      below = out;
    });
    const vars = {
      cc: below.cc,
      ttl: ttlSeen,
      by: below.by,
      changed: changed.join(', '),
      count: changed.length === 1 ? 'One layer' : `${changed.length} layers`,
    };
    const live = changed.length ? { box: v2, t: tChanged, els: changedEls } : { box: v1, t: tSimple, els: simpleEls };
    live.els.forEach((e, i) => { e.innerHTML = fill(live.t[i], vars); });
    [vS, v1, v2].forEach((b) => b.classList.toggle('is-on', b === live.box));
  };

  layers.forEach((ly) => {
    ly.options.forEach((o, k) => {
      if (!o.radio) return;
      o.radio.setAttribute('role', 'radio');
      const choose = () => {
        ly.pick = k;
        render();
      };
      o.radio.addEventListener('click', choose);
      o.radio.addEventListener('keydown', (e) => {
        const radios = ly.options.map((x) => x.radio);
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          const n = (k + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + radios.length) % radios.length;
          radios[n].focus();
          radios[n].click();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          choose();
        }
      });
    });
  });
  frame.classList.add('is-live');
  render();
  block.replaceChildren(frame);
}
