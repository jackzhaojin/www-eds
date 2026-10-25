// Import engine for figure.tl (writing/2025-07-11-scaling-ai-coding-delivery-methodology): the task lab
// -> explainer (task-protocol). Row shape: blocks/explainer/engines/task-protocol.js.
// TASKS, REQUESTS, decide() and render() are the source explainer.js's, so each request's rule
// states and outcome text become the block's rows.
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-tl], .tl');

const GH = 'https://github.com/jackzhaojin/shadow-pivot-ai-agentv2/commit/';
const TASKS = {
  '3.2.3': {
    title: 'Step 2: Design Evaluation (LLM)',
    file: 'release-1.0.mdc',
    release: '1.0',
    commits: [['a4918e9', 'Jun 13', '3.2.3 add design evaluation step'], ['17e0b11', 'Jun 13', '3.2.3 log baseline testing'], ['ed5a048', 'Jun 13', '3.2.3 add detailed error logging']],
  },
  '3.2.4': {
    title: 'Step 3: Spec Selection UI and Logic', file: 'release-1.0.mdc', release: '1.0', commits: [['66d145c', 'Jun 13', '3.2.4 spec selection ui']],
  },
  '3.3.1': {
    title: 'Agent Flow Component Refactoring (Architecture)', file: 'release-1.0.mdc', release: '1.0', commits: [],
  },
  '3.5': {
    title: 'Step 4: Parallel Figma Spec Generation Infrastructure',
    file: 'release-1.0.mdc',
    release: '1.0',
    commits: [['fecc985', 'Jun 15', '3.5 refactor design evaluation to use prompt template'], ['97e1a6f', 'Jun 15', '3.5 fix evaluation parsing'], ['17f1584', 'Jun 16', '3.5 fix step progression'], ['8c0334c', 'Jun 16', '3.5 doc update']],
  },
  '1.1.1.1': {
    title: 'Cypress UI Testing Infrastructure', file: 'release-1.1.mdc', release: '1.1', commits: [['fc91aba', 'Jun 21', '1.1.1.1: feat(cypress): implement comprehensive modular testing plan for AI agent flow']],
  },
};
const REQUESTS = {
  one: ['3.2.3'], chain: ['3.2.4', '3.3.1'], parallel: ['3.5'], next: ['1.1.1.1'],
};
const RULES = ['size', 'only', 'mdc', 'release'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function decide(ids, releaseDone) {
  const rules = {
    size: 'pass', only: 'pass', mdc: 'pass', release: 'pass',
  };
  const notes = [];
  const assigned = ids[0];
  const task = TASKS[assigned];
  if (ids.length > 1) {
    rules.only = 'fail';
    notes.push(`Narrowed to ${assigned}. ${ids.slice(1).join(', ')} waits for its own assignment.`);
  }
  if (task.release !== '1.0' && !releaseDone) {
    rules.release = 'fail';
    rules.mdc = 'skip';
    return {
      go: false, task, id: assigned, rules, notes: [`On hold. ${assigned} is a release ${task.release} task, and release 1.0 is not complete.`],
    };
  }
  return {
    go: true, task, id: assigned, rules, notes,
  };
}

const commits = (list) => `<ul>${list.map((c) => `<li><a href="${GH}${c[0]}">${c[0]}</a> ${c[1]} · ${esc(c[2])}</li>`).join('')}</ul>`;

function outcome(req) {
  const r = decide(REQUESTS[req], false);
  let html = '';
  if (r.go) {
    const note = esc(r.notes.join(' '));
    html += `<p><strong>Assigned: ${esc(r.id)}, ${esc(r.task.title)}.</strong>${note ? ` ${note}` : ''}</p>`;
    html += `<p>Read in order: prd-1.0.md, release-1.0.mdc, AGENTS.md. The task lives in ${esc(r.task.file)}.<br>When done: tick it off in ${esc(r.task.file)}, start the commit and the pull request with ${esc(r.id)}</p>`;
    if (r.task.commits.length) html += `<p>What the repo shows for ${esc(r.id)}:</p>${commits(r.task.commits)}`;
  } else {
    html += `<p><strong>${esc(r.notes[0])}</strong></p><p>Nothing is built yet. It waited for the v1.0.0 tag on June 17, and the repo shows it done on June 21:</p>${commits(r.task.commits)}`;
  }
  return [`<ul>${RULES.map((k) => `<li>${r.rules[k]}</li>`).join('')}</ul>`, html];
}

export function convert($, el, h) {
  const $f = $(el);
  const bar = $f.find('.lab__bar').first();
  const link = bar.find('a').first();
  const rows = [[`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]];
  const name = $f.find('.chips').attr('aria-label');
  const rules = $f.find('.tl__rules li').map((_, li) => {
    const [ref, text] = $(li).children('span').toArray();
    return `<li><strong>${h.inline(ref)}</strong> ${h.inline(text)}</li>`;
  }).get().join('');
  const left = `<p>${h.inline($f.find('.lab__left > .lab__label').first())}</p>${name ? `<p><em>${h.esc(name)}</em></p>` : ''}<ol>${rules}</ol>`;
  const right = `<p>${h.inline($f.find('.lab__right > .lab__label').first())}</p>${$f.find('[data-out] p').map((_, p) => `<p>${h.inline(p)}</p>`).get().join('')}`;
  rows.push([left, right]);
  const def = $f.find('[data-req][aria-checked="true"]').attr('data-req');
  $f.find('[data-req]').each((_, b) => {
    const req = $(b).attr('data-req');
    const label = h.inline(b);
    rows.push([`<p>${req === def ? `<strong>${label}</strong>` : label}</p>`, ...outcome(req)]);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer task-protocol', rows);
}
