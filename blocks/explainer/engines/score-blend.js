/**
 * Explainer engine "score-blend": a final score blended from a deterministic scan and an agent's
 * score, then graded (the score lab of "From Prompts to Harness"). Move both scores, or make the
 * agent step fail and fall back to the scan alone.
 *
 * Rows, in this order:
 * 1. one cell: the bar (a label paragraph, the source link paragraph);
 * 2. two cells:
 *    left: the note shown without JavaScript, the scan score's label (bold name, then a short
 *    note), the agent score's label (the same), the fallback switch label, the contribution
 *    label, then the key list (agent part first: "agent × 0.7", "scan × 0.3"; the weights
 *    drive the blend);
 *    right: the formula code block (its numbers are the starting scores: agent first, then
 *    scan), an italic paragraph naming the grades for assistive tech (not shown), then the
 *    grades list, best first (bold grade, then its range; the range's first number is the
 *    grade's lowest score, "below" means anything under the next grade);
 * 3. three cells: the verdict (paragraphs; {score}, {grade}, {agent}, {scan} and {pull}), the
 *    pull sentences (when the scores agree | the agent's is lower | the agent's is higher;
 *    {points} is the gap), the fallback verdict ({scan}).
 *
 * @variants (none)
 * @ew-exempt <pre> formula - derived, rewritten from the scores; <p> grades name - metadata
 */

const isName = (el) => el.tagName === 'P' && el.children.length === 1 && el.firstElementChild.tagName === 'EM'
  && el.textContent.trim() === el.firstElementChild.textContent.trim();
const fill = (html, vars) => html.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));

export default async function engine(block, { slot, rows, plainLinks }) {
  const [barRow, gridRow, verdictRow] = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'lab blend';
  const meta = slot('blend-meta');
  if (barRow) {
    const bar = slot('lab__bar', [...barRow[0].children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const [l, r] = gridRow || [];
  const leftEls = [...(l ? l.children : [])];
  const legendList = leftEls.find((el) => el.matches('ul, ol'));
  const [staticP, scanP, agentP, failP, labelP] = leftEls.filter((el) => el.tagName === 'P');
  const rightEls = [...(r ? r.children : [])];
  const formula = rightEls.find((el) => el.matches('pre'));
  const grades = rightEls.find((el) => el.matches('ol, ul'));
  const gradesName = rightEls.find(isName);

  // the model, from the authored formula, key and grades
  const fText = formula ? formula.textContent : '';
  const fm = /Math\.round\((\d+)\s*\*\s*([\d.]+)\s*\+\s*(\d+)\s*\*\s*([\d.]+)\)/.exec(fText);
  const weights = (legendList ? [...legendList.children] : []).map((li) => Number((/×\s*([\d.]+)/.exec(li.textContent) || [])[1]));
  const WA = weights[0] || (fm ? Number(fm[2]) : 0.7);
  const WD = weights[1] || (fm ? Number(fm[4]) : 0.3);
  const gradeItems = grades ? [...grades.children] : [];
  const bands = gradeItems.map((li) => {
    const name = (li.querySelector('strong, b') || li).textContent.trim();
    const range = li.textContent.replace(name, '');
    const low = /below/i.test(range) ? 0 : Number((/(\d+)/.exec(range) || [])[1] || 0);
    return { name, low };
  });
  const calculateFinalScore = (d, a) => Math.max(0, Math.min(100, Math.round(a * WA + d * WD)));
  const calculateGrade = (score) => bands.findIndex((b) => score >= b.low);

  // controls
  const control = (p, kind, value) => {
    const id = `blend-${kind}-${Math.random().toString(36).slice(2, 8)}`;
    const label = document.createElement('label');
    label.htmlFor = id;
    const out = document.createElement('output');
    out.htmlFor = id;
    out.textContent = String(value);
    label.append(slot('blend-name', p ? [p] : []), out);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.value = String(value);
    input.id = id;
    return { row: slot(`blend__row blend__row--${kind}`, [label, input]), input, out };
  };
  const det = control(scanP, 'det', fm ? Number(fm[3]) : 65);
  const agt = control(agentP, 'agent', fm ? Number(fm[1]) : 45);
  const fail = document.createElement('input');
  fail.type = 'checkbox';
  const failLabel = document.createElement('label');
  failLabel.className = 'blend__fail';
  failLabel.append(fail, ...(failP ? [failP] : []));
  const ctl = slot('blend__ctl', [det.row, agt.row, failLabel]);

  const barA = document.createElement('span');
  barA.className = 'a';
  const barD = document.createElement('span');
  barD.className = 'd';
  const bar = slot('blend__bar', [barA, barD]);
  bar.setAttribute('aria-hidden', 'true');
  const left = slot('lab__left', [slot('blend__static', staticP ? [staticP] : []), ctl,
    slot('lab__label', labelP ? [labelP] : []), bar, slot('blend__legend', legendList ? [legendList] : [])]);

  // verdicts
  const [vBlend, vPull, vFail] = verdictRow || [];
  const blendEls = vBlend ? [...vBlend.children] : [];
  const pullEls = vPull ? [...vPull.children] : [];
  const failEls = vFail ? [...vFail.children] : [];
  const tBlend = blendEls.map((e) => e.innerHTML);
  const tPull = pullEls.map((e) => e.innerHTML);
  const tFail = failEls.map((e) => e.innerHTML);
  pullEls.forEach((e) => meta.append(e));
  const lead = (els) => els.map((e, k) => (k > 0 ? slot('blend-log', [e]) : e));
  const sBlend = slot('blend-v', lead(blendEls));
  const sFail = slot('blend-v', lead(failEls));
  const verdict = slot('verdict', [sBlend, sFail]);
  verdict.setAttribute('aria-live', 'polite');
  if (gradesName) {
    grades?.setAttribute('aria-label', gradesName.textContent.trim());
    meta.append(gradesName);
  }
  const gradeBox = slot('blend__grades', grades ? [grades] : []);
  const right = slot('lab__right', [slot('json blend__formula', formula ? [formula] : []), verdict, gradeBox]);
  frame.append(slot('lab__grid', [left, right]), meta);

  const code = formula ? (formula.querySelector('code') || formula) : null;
  const render = () => {
    const d = Number(det.input.value);
    const a = Number(agt.input.value);
    det.out.value = d;
    det.out.textContent = d;
    agt.out.value = a;
    agt.out.textContent = a;
    const failed = fail.checked;
    frame.classList.toggle('is-fallback', failed);
    agt.input.disabled = failed;
    sBlend.classList.toggle('is-on', !failed);
    sFail.classList.toggle('is-on', failed);
    if (failed) {
      barD.style.width = `${d}%`;
      if (code) code.textContent = `catch {\n  // Fallback to deterministic-only\n  score: deterministic.score  // ${d}\n}`;
      failEls.forEach((e, i) => { e.innerHTML = fill(tFail[i], { scan: d }); });
      gradeBox.dataset.grade = '';
      return;
    }
    const score = calculateFinalScore(d, a);
    const g = calculateGrade(score);
    barA.style.width = `${a * WA}%`;
    barD.style.width = `${d * WD}%`;
    const exact = Math.round((a * WA + d * WD) * 10) / 10;
    if (code) code.textContent = `Math.round(${a} * ${WA} + ${d} * ${WD})\n= Math.round(${exact})\n= ${score}`;
    const gap = score - d;
    const points = `${Math.abs(gap)}${Math.abs(gap) === 1 ? ' point' : ' points'}`;
    const pull = fill(tPull[gap === 0 ? 0 : gap < 0 ? 1 : 2] || '', { points });
    blendEls.forEach((e, i) => {
      e.innerHTML = fill(tBlend[i], {
        score, grade: bands[g] ? bands[g].name : '', agent: a, scan: d, pull,
      });
    });
    gradeBox.dataset.grade = String(g + 1);
  };
  [det.input, agt.input, fail].forEach((el) => el.addEventListener('input', render));
  fail.addEventListener('change', render);
  frame.classList.add('is-live');
  render();
  block.replaceChildren(frame);
}
