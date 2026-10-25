// Import engine for figure.blend (writing/2026-01-05-from-prompts-to-harness): the score lab ->
// explainer (score-blend). Row shape: blocks/explainer/engines/score-blend.js.
// The verdict sentences are the source explainer.js's render() strings, written as the engine's
// templates ({score}, {grade}, {agent}, {scan}, {pull}, {points}).
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-blend], .blend');

const BLEND = [
  'Final score <strong>{score}</strong>, {grade}',
  "70% of the agent's {agent} plus 30% of the scan's {scan}. {pull}",
];
const PULL = [
  'The two scores agree, so the blend matches the scan.',
  "The agent's lower score pulls the result {points} under the scan.",
  "The agent's higher score lifts the result {points} over the scan.",
];
const FALLBACK = [
  'Score <strong>{scan}</strong>, from the scan alone',
  "The agent step failed, so the report keeps the scan's {scan} on its own: one finding per axe-core violation, no summary and no grade.",
];

export function convert($, el, h) {
  const $f = $(el);
  const bar = $f.find('.lab__bar').first();
  const link = bar.find('a').first();
  const rows = [[`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]];
  const label = (row) => {
    const $s = $f.find(`${row} label > span`).first();
    const name = $s.contents().filter((_, n) => n.type === 'text').text().trim();
    return `<p><strong>${h.esc(name)}</strong> ${h.inline($s.find('small'))}</p>`;
  };
  const legend = $f.find('.blend__legend > span').map((_, s) => `<li>${h.inline(s)}</li>`).get().join('');
  const left = `<p>${h.inline($f.find('.blend__static'))}</p>${label('.blend__row--det')}${label('.blend__row--agent')}`
    + `<p>${h.inline($f.find('.blend__fail > span'))}</p><p>${h.inline($f.find('.lab__left > .lab__label'))}</p><ul>${legend}</ul>`;
  const name = $f.find('.blend__grades').attr('aria-label');
  const grades = $f.find('.blend__grades li').map((_, li) => {
    const [g, range] = $(li).children('span').toArray();
    return `<li><strong>${h.inline(g)}</strong> ${h.inline(range)}</li>`;
  }).get().join('');
  const right = `<pre><code>${h.esc($f.find('[data-formula]').text())}</code></pre>${name ? `<p><em>${h.esc(name)}</em></p>` : ''}<ol>${grades}</ol>`;
  rows.push([left, right]);
  const ps = (list) => list.map((t) => `<p>${t}</p>`).join('');
  rows.push([ps(BLEND), ps(PULL), ps(FALLBACK)]);
  return h.block('explainer score-blend', rows);
}
