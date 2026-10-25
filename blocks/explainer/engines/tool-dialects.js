/**
 * Explainer engine "tool-dialects": one tool, the same four steps, as each model client writes
 * them (the format switcher of "One da.live MCP Server Across Claude, Gemini, Azure OpenAI and
 * n8n"). Tabs pick a client; one client's panel shows at a time.
 *
 * Rows:
 * - first row, one cell: the bar (a label paragraph, the source link paragraph) and an italic
 *   paragraph that names the tabs for assistive tech (not shown);
 * - one row per client, five cells: the heading cell (an h3: the client name, then the file in
 *   italics; paragraphs after the h3 are notes shown under the steps), then one cell per step:
 *   the step paragraph (title, then a line link or an italic aside), the code block, and an
 *   optional marks list right after it ("key: text", "val: text" or "note: text" colors that run
 *   of the code, in order, each at its first match after the previous one);
 * - last row, one cell: the caption.
 * The tab labels are the client names (the h3 text before the italic file name).
 *
 * @variants (none)
 * @ew-exempt <p> tabs name, <ul> code marks - text-as-metadata, never displayed
 */

const MARK = /^(key|val|note):\s?(.+)$/;

/** Wraps the listed runs of the code in spans; the code's text is unchanged. */
function applyMarks(pre, list) {
  const marks = [...list.children].map((li) => MARK.exec(li.textContent.replace(/\u00a0/g, ' ')));
  if (!marks.length || marks.some((m) => !m)) return false;
  const host = pre.querySelector('code') || pre;
  const text = host.textContent;
  const nodes = [];
  let from = 0;
  let last = 0;
  marks.forEach(([, kind, run]) => {
    const at = text.indexOf(run, from);
    if (at < 0) return;
    nodes.push(text.slice(last, at));
    const span = document.createElement('span');
    span.className = kind;
    span.textContent = run;
    nodes.push(span);
    from = at + run.length;
    last = from;
  });
  nodes.push(text.slice(last));
  host.replaceChildren(...nodes);
  return true;
}

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'lab dia';
  const barCell = all[0]?.length === 1 ? all[0][0] : null;
  const lastRow = all[all.length - 1];
  const capCell = all.length > 1 && lastRow.length === 1 ? lastRow[0] : null;

  let groupName = '';
  const hidden = slot('dia-meta');
  if (barCell) {
    const bar = slot('lab__bar');
    [...barCell.children].forEach((el) => {
      if (isName(el)) {
        groupName = el.textContent.trim();
        hidden.append(el);
      } else bar.append(el);
    });
    plainLinks(bar);
    frame.append(bar);
  }

  const tabs = slot('xp-tabs');
  tabs.setAttribute('role', 'tablist');
  if (groupName) tabs.setAttribute('aria-label', groupName);
  const panels = slot('dia__panels');
  const tabEls = [];
  const panelEls = [];

  all.filter((r) => r.length > 1).forEach((cells) => {
    const [headCell, ...steps] = cells;
    const panel = document.createElement('section');
    panel.className = 'dia__panel';
    const h3 = headCell.querySelector('h3, h2, h4');
    const notes = [...headCell.children].filter((el) => el !== h3);
    let label = '';
    if (h3) {
      label = [...h3.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      panel.append(slot('dia-head', [h3]));
    }
    panel.setAttribute('aria-label', label);
    const grid = slot('dia__grid');
    steps.forEach((cell) => {
      const step = slot('dia__block');
      const kids = [...cell.children];
      kids.forEach((el, i) => {
        const prev = kids[i - 1];
        if (el.matches('pre')) step.append(slot('dia-code', [el]));
        else if (el.matches('ul, ol') && prev && prev.matches('pre') && applyMarks(prev, el)) hidden.append(el);
        else if (el.tagName === 'P' && !step.children.length) step.append(slot('dia-step', [el]));
        else step.append(el);
      });
      plainLinks(step);
      grid.append(step);
    });
    panel.append(grid);
    if (notes.length) panel.append(slot('dia__note', notes));
    panels.append(panel);
    panelEls.push(panel);

    const tab = document.createElement('div');
    tab.setAttribute('role', 'tab');
    tab.textContent = label;
    tabs.append(tab);
    tabEls.push(tab);
  });

  const show = (i) => {
    tabEls.forEach((t, j) => {
      t.setAttribute('aria-selected', String(i === j));
      t.tabIndex = i === j ? 0 : -1;
    });
    panelEls.forEach((p, j) => { p.hidden = i !== j; });
  };
  tabEls.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (k) {
        e.preventDefault();
        const n = (i + k + tabEls.length) % tabEls.length;
        show(n);
        tabEls[n].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        show(i);
      }
    });
  });

  frame.append(slot('xp-row', [tabs]), panels);
  if (capCell) {
    const cap = document.createElement('figcaption');
    cap.append(...capCell.children);
    frame.append(cap);
  }
  frame.append(hidden);
  show(0);
  block.replaceChildren(frame);
}
