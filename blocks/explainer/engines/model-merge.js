/**
 * Explainer (model-merge): "What I said I kept, and what the lines say", from the Four Frontier
 * Models article. Pick a model: the left view lists what was kept from it, the right view shows
 * the final site's lines by where they came from, and the sentence comparing the two.
 *
 * Rows, by cell count (order carries meaning where noted):
 * - one cell: the first is the bar label, the last is the caption;
 * - three cells: the labels row (the model label | the kept heading, the picked model's name is
 *   added after it | the lines heading), then one row per model, in chip order: the model name |
 *   a list of what was kept | the sentence comparing what was said and what the lines say;
 * - four cells: the line-count table: a head row, then one row per source (label | HTML | CSS |
 *   JS). A row whose label ends with a model's name counts for that model; the other rows, in
 *   order, are the shared and the new lines; the last row is the total. Shown without
 *   JavaScript only.
 *
 * @ew-exempt the picked model's name after the kept heading, the bar and its legend - derived
 *   from the model rows and the line-count table
 */

const num = (el) => Number((el?.textContent || '').replace(/[^\d.]/g, '')) || 0;
const isNum = (el) => /^\s*[\d,]+\s*$/.test(el?.textContent || '');

function radio(el, onPick) {
  el.setAttribute('role', 'radio');
  el.tabIndex = -1;
  el.setAttribute('aria-checked', 'false');
  el.addEventListener('click', onPick);
  return el;
}

export default async function engine(block, { slot, rows }) {
  const all = rows(block);
  const singles = all.filter((r) => r.length === 1);
  const triples = all.filter((r) => r.length === 3);
  const quads = all.filter((r) => r.length === 4);
  const labels = triples.find((r) => !r[1].querySelector('ul, ol'));
  const models = triples.filter((r) => r !== labels).map(([name, kept, says]) => ({
    name, kept, says, label: name.textContent.trim(),
  }));
  if (!models.length) return;
  const bar = singles.length ? singles[0][0] : null;
  const caption = singles.length > 1 ? singles[singles.length - 1][0] : null;

  // line counts from the table rows
  const data = quads.filter((r) => isNum(r[1]));
  const total = data.length ? data[data.length - 1] : null;
  const sum = (r) => num(r[1]) + num(r[2]) + num(r[3]);
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const parts = [];
  models.forEach((m, i) => {
    const row = data.find((r) => r !== total && r[0].textContent.trim().endsWith(m.label));
    if (row) {
      parts.push({
        key: `m${i + 1}`, model: i, row, label: lower(row[0].textContent.trim()), n: sum(row),
      });
    }
  });
  const others = ['shared', 'fresh'];
  data.filter((r) => r !== total && !parts.some((p) => p.row === r))
    .forEach((r, i) => parts.push({ key: others[i] || `o${i + 1}`, label: lower(r[0].textContent.trim()), n: sum(r) }));
  const totalN = total ? sum(total) : parts.reduce((a, p) => a + p.n, 0);
  const pct = (n) => `${((n / totalN) * 100).toFixed(1)}%`;

  // the figure
  const kids = [];
  if (bar) kids.push(slot('lab__bar', [...bar.children]));
  const body = slot('mg__body');
  const picker = slot('mg__picker');
  const [modelLabel, keptHead, linesHead] = labels || [];
  const groupName = modelLabel ? modelLabel.textContent.trim() : '';
  if (modelLabel) picker.append(slot('mg__label', [...modelLabel.children]));
  const chips = slot('chips');
  chips.setAttribute('role', 'radiogroup');
  if (groupName) chips.setAttribute('aria-label', groupName);
  picker.append(chips);

  const keptH = slot('mg__h', keptHead ? [...keptHead.children] : []);
  const keptName = document.createElement('span');
  keptName.className = 'mg__name';
  keptH.append(' ', keptName);
  const keptBox = slot('mg__kept');
  const linesH = slot('mg__h', linesHead ? [...linesHead.children] : []);
  const barEl = slot('mg__bar');
  const legend = document.createElement('ul');
  legend.className = 'mg__legend';
  const lines = slot('mg__lines');
  lines.setAttribute('aria-live', 'polite');

  models.forEach((m) => {
    m.chip = slot('mg__chip', [...m.name.children]);
    chips.append(m.chip);
    m.keptEl = slot('mg__kept-item', [...m.kept.children]);
    m.saysEl = slot('mg__says', [...m.says.children]);
    keptBox.append(m.keptEl);
    lines.append(m.saysEl);
  });

  const views = slot('mg__views', [
    slot('mg__view', [keptH, keptBox]),
    slot('mg__view', [linesH, barEl, legend, lines]),
  ]);
  const staticTable = slot('mg__static', quads.map((r) => slot('mg__row', r)));
  body.append(picker, views, staticTable);
  kids.push(body);
  if (caption) kids.push(slot('x-caption', [...caption.children]));

  let picked = 0;
  function render() {
    const on = (p) => p.model === picked;
    barEl.replaceChildren(...parts.filter((p) => p.n > 0).map((p) => {
      const s = document.createElement('span');
      s.className = `mg__part mg__part--${p.key}${on(p) ? ' is-on' : ''}`;
      s.style.width = pct(p.n);
      s.title = `${p.n} lines ${p.label}`;
      return s;
    }));
    legend.replaceChildren(...parts.map((p) => {
      const li = document.createElement('li');
      li.className = `mg__key mg__key--${p.key}${on(p) ? ' is-on' : ''}`;
      const label = document.createElement('span');
      label.textContent = p.label;
      const b = document.createElement('b');
      b.textContent = String(p.n);
      li.append(label, b);
      return li;
    }));
    keptName.textContent = models[picked].label;
    models.forEach((m, i) => {
      m.chip.setAttribute('aria-checked', String(i === picked));
      m.chip.tabIndex = i === picked ? 0 : -1;
      m.keptEl.hidden = i !== picked;
      m.saysEl.hidden = i !== picked;
    });
  }

  models.forEach((m, i) => radio(m.chip, () => {
    picked = i;
    render();
  }));
  chips.addEventListener('keydown', (e) => {
    const step = {
      ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1,
    }[e.key];
    if (step) {
      e.preventDefault();
      picked = (picked + step + models.length) % models.length;
      render();
      models[picked].chip.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      const i = models.findIndex((m) => m.chip === document.activeElement);
      if (i >= 0) {
        e.preventDefault();
        picked = i;
        render();
      }
    }
  });

  block.replaceChildren(...kids);
  render();
}
