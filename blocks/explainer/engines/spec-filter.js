/**
 * Explainer engine "spec-filter": runs the validation loop of an API route before and after a
 * fix on three specs the reader sets (the AI-coded Next.js agent article, release 1.0). The
 * checks, their order, the status codes and the error messages are the route's, ported from
 * app/api/agent/evaluate-figma-specs/route.ts at 5919200 (before) and dc287d3 (after).
 *
 * Rows:
 * - the bar: a label paragraph | the source link paragraph;
 * - one row with two cells, by content:
 *   left: a paragraph naming the switch (for assistive tech, not shown), the list of the two
 *   modes (before the fix, after the fix: in that order, the first is the opening mode), the
 *   label paragraph, the specs list (one item per spec, "Spec 1: Valid spec" = its label, a
 *   colon, its starting choice), the choices list (in the engine's order: a valid spec, a spec
 *   missing its name, not a spec at all), the note paragraph;
 *   right: the label paragraph, the outcomes list (in the engine's order: all specs go on, some
 *   go on, the first bad spec ends the request, nothing valid is left; {evaluated} and {total}
 *   stand for the counts), then the static responses (a heading and a code block per mode),
 *   shown without JavaScript.
 *
 * Behaviour: the switch and one select per spec drive the port; the response (status, JSON body,
 * outcome) is derived. The box keeps its final height.
 *
 * @variants spec-filter
 * @ew-exempt the specs, choices and outcomes lists, the switch name - read by the engine, shown
 *   through derived controls and the derived response
 */
const KINDS = {
  valid: (n) => ({ name: `Spec ${n}`, designSystem: {}, layout: {} }),
  missing: () => ({ designSystem: {}, layout: {} }),
  notobject: () => null,
};
const CHOICES = ['valid', 'missing', 'notobject'];

// Lines 32-47 at 5919200: the first bad spec ends the request.
function before(figmaSpecs) {
  const checked = [];
  for (let i = 0; i < figmaSpecs.length; i += 1) {
    const spec = figmaSpecs[i];
    if (!spec || typeof spec !== 'object') {
      checked.push('fail');
      return { status: 400, checked, body: { success: false, error: `Invalid spec at index ${i}: must be an object` } };
    }
    if (!spec.name || typeof spec.name !== 'string') {
      checked.push('fail');
      return { status: 400, checked, body: { success: false, error: `Invalid spec at index ${i}: missing or invalid name field` } };
    }
    checked.push('pass');
  }
  return {
    status: 200, checked, evaluated: figmaSpecs.length, body: { success: true, evaluationResults: '__RESULTS__', message: 'Figma specs evaluated successfully' },
  };
}

// Lines 32-91 at dc287d3: bad specs are filtered out and the rest go on.
function after(figmaSpecs) {
  const validSpecs = [];
  const invalidSpecs = [];
  const checked = [];
  for (let i = 0; i < figmaSpecs.length; i += 1) {
    const spec = figmaSpecs[i];
    if (!spec || typeof spec !== 'object') {
      invalidSpecs.push({ index: i, reason: 'must be an object' });
      checked.push('fail');
    } else if (!spec.name || typeof spec.name !== 'string') {
      invalidSpecs.push({ index: i, reason: 'missing or invalid name field' });
      checked.push('fail');
    } else {
      validSpecs.push(spec);
      checked.push('pass');
    }
  }
  if (validSpecs.length === 0) {
    return { status: 400, checked, body: { success: false, error: 'No valid specs found', invalidSpecs } };
  }
  const body = { success: true, evaluationResults: '__RESULTS__', message: 'Figma specs evaluated successfully' };
  if (invalidSpecs.length > 0) {
    body.warning = `${invalidSpecs.length} invalid specs were filtered out`;
    body.invalidSpecs = invalidSpecs;
  }
  return {
    status: 200, checked, evaluated: validSpecs.length, body,
  };
}

const fill = (template, values) => template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] : m));

export default async function engine(block, { slot, rows, plainLinks }) {
  const [barRow, bodyRow] = rows(block);
  if (!barRow || !bodyRow || bodyRow.length < 2) return;
  plainLinks(block);
  const [leftCell, rightCell] = bodyRow;

  const lab = document.createElement('figure');
  lab.className = 'sf';
  // the bar's source link keeps the bar's own look (no text-link slot), as on the source
  const bar = slot('lab__bar', barRow.flatMap((c) => [...c.children]));

  // left column, by content
  const left = slot('lab__left');
  const leftNodes = [...leftCell.children];
  const lists = leftNodes.filter((n) => n.matches('ul, ol'));
  const modesList = lists[0];
  const specsList = leftNodes.find((n) => n.tagName === 'OL') || lists[1];
  const choicesList = lists.filter((n) => n !== modesList && n !== specsList)[0];
  const paras = leftNodes.filter((n) => n.tagName === 'P');
  const precedes = (a, b) => b && leftNodes.indexOf(a) < leftNodes.indexOf(b);
  const nameP = paras.find((p) => precedes(p, modesList));
  const labelP = paras.find((p) => p !== nameP && precedes(p, specsList));
  const noteP = paras.filter((p) => p !== nameP && p !== labelP).pop();

  const sw = slot('pvl__switch');
  sw.setAttribute('role', 'radiogroup');
  if (nameP) sw.setAttribute('aria-label', nameP.textContent.trim());
  const modes = ['before', 'after'];
  const modeHosts = modesList ? [...modesList.children].slice(0, 2) : [];
  modeHosts.forEach((li, i) => {
    li.setAttribute('role', 'radio');
    li.dataset.mode = modes[i];
  });
  if (modesList) {
    modesList.setAttribute('role', 'none');
    sw.append(modesList);
  }

  const choiceLabels = choicesList ? [...choicesList.children].map((li) => li.textContent.trim()) : [];
  const specsBox = slot('sf__specs');
  const selects = [];
  const cards = [];
  (specsList ? [...specsList.children] : []).forEach((li, i) => {
    const text = li.textContent.trim();
    const at = text.indexOf(':');
    const label = at >= 0 ? text.slice(0, at).trim() : text;
    const start = at >= 0 ? text.slice(at + 1).trim() : '';
    const card = slot('sf__spec');
    const lab2 = document.createElement('label');
    lab2.htmlFor = `sf-${i + 1}`;
    lab2.textContent = label;
    const select = document.createElement('select');
    select.id = `sf-${i + 1}`;
    CHOICES.forEach((k, ci) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = choiceLabels[ci] || k;
      if (choiceLabels[ci] === start) o.defaultSelected = true;
      select.append(o);
    });
    card.append(lab2, select);
    specsBox.append(card);
    selects.push(select);
    cards.push(card);
  });

  left.append(sw);
  if (labelP) left.append(slot('lab__label', [labelP]));
  left.append(specsBox);
  if (noteP) left.append(slot('sf__note', [noteP]));
  left.append(slot('sf__source', [nameP, specsList, choicesList].filter(Boolean)));

  // right column
  const right = slot('lab__right');
  const rightNodes = [...rightCell.children];
  const rightLabel = rightNodes.find((n) => n.tagName === 'P');
  const outcomesList = rightNodes.find((n) => n.matches('ul, ol'));
  const outcomes = outcomesList ? [...outcomesList.children].map((li) => li.textContent.trim()) : [];
  const statics = rightNodes.filter((n) => n !== rightLabel && n !== outcomesList);
  if (rightLabel) right.append(slot('lab__label', [rightLabel]));
  const out = slot('sf__out');
  out.setAttribute('aria-live', 'polite');
  const verdict = slot('verdict', [out, slot('sf__static', statics)]);
  right.append(verdict);
  if (outcomesList) right.append(slot('sf__source', [outcomesList]));

  const grid = slot('lab__grid', [left, right]);
  lab.append(bar, grid);
  block.replaceChildren(lab);

  let mode = 'before';
  function render() {
    const specs = selects.map((s, i) => KINDS[s.value](i + 1));
    const r = (mode === 'before' ? before : after)(specs);
    cards.forEach((c, i) => c.setAttribute('data-state', r.checked[i] || 'skip'));
    const json = JSON.stringify(r.body, null, 2).replace(
      '"__RESULTS__"',
      `[ /* ${r.evaluated} result${r.evaluated === 1 ? '' : 's'} from evaluateFigmaSpecs(), the model call, not run here */ ]`,
    );
    let story;
    if (r.status === 200 && r.evaluated === specs.length) [story] = outcomes;
    else if (r.status === 200) [, story] = outcomes;
    else if (mode === 'before') [, , story] = outcomes;
    else [, , , story] = outcomes;
    const status = document.createElement('span');
    status.className = `sf__status ${r.status === 200 ? 'ok' : 'no'}`;
    status.textContent = `HTTP ${r.status}`;
    const pre = document.createElement('pre');
    pre.className = 'sf__body';
    pre.textContent = json;
    const p = document.createElement('p');
    p.className = 'sf__story';
    p.textContent = fill(story || '', { evaluated: r.evaluated, total: specs.length });
    out.replaceChildren(status, pre, p);
  }

  const setMode = (m) => {
    mode = m;
    modeHosts.forEach((h) => {
      const on = h.dataset.mode === m;
      h.setAttribute('aria-checked', String(on));
      h.tabIndex = on ? 0 : -1;
    });
    render();
  };
  modeHosts.forEach((h, i) => {
    h.addEventListener('click', () => setMode(h.dataset.mode));
    h.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = modeHosts[(i + 1) % modeHosts.length];
        setMode(n.dataset.mode);
        n.focus();
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setMode(h.dataset.mode);
      }
    });
  });
  selects.forEach((s) => s.addEventListener('change', render));
  lab.classList.add('is-live');
  setMode('before');
}
