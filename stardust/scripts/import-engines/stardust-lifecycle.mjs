// Importer engine for the page lifecycle lab of "Adobe Stardust explained"
// (figure.fig.lab.sdl [data-lifecycle]) -> explainer (stardust-lifecycle).
// The markup gives the bar, the pages, the states, the controls, the static verdict and the
// state.json view; the seed pages and the messages lived in the source's explainer.js and are
// carried here verbatim (blocks/explainer/engines/stardust-lifecycle.js lists the row shape).

const JACK = {
  event: 'approved', by: 'Jack', at: '2026-08-09', note: 'committed+pushed; proceed with workflow',
};
const SEED = [
  ['ai-content-blocks', '/ai-content/blocks/', 'approved'],
  ['ai-content-blocks-hero', '/ai-content/blocks/hero', 'approved'],
  ['ai-content-blocks-cards', '/ai-content/blocks/cards', 'approved'],
  ['ai-content-blocks-stats', '/ai-content/blocks/stats', 'extracted'],
];

// The messages of explainer.js, in the engine's order; {status} and {path} are filled in.
const MESSAGES = [
  '<strong>Refused.</strong> <code>direct</code> runs on an extracted page. This one is already <code>{status}</code>, and a page never moves backward.',
  '<strong>Directed.</strong> The page is in scope of the direction in <code>stardust/direction.md</code>. Next comes a prototype.',
  '<strong>Refused.</strong> <code>prototype</code> needs a direction first. This page is still <code>extracted</code>.',
  '<strong>Not here.</strong> This page is already <code>{status}</code>. A page never moves backward; a new prototype would need a new approval.',
  'This page already has a prototype waiting for approval.',
  '<strong>Prototyped, then approved by the agent.</strong> Hands-off mode grants approval itself, only after its quality gates pass (assumed here), and marks it <code>approvedBy: "hands-off"</code>.',
  '<strong>Prototyped.</strong> The proposed HTML is written. Now the run stops and waits for a person.',
  '<strong>Nothing to approve.</strong> There is no prototype for this page yet.',
  'This page is already <code>{status}</code>.',
  '<strong>Approved by you.</strong> This is the human gate: the only state a person sets. Migrate can run now.',
  '<strong>Refused.</strong> <code>migrate</code> needs an approved page, and this one is <code>{status}</code>. A page moves one state at a time, and a person has to approve its prototype first.',
  '<strong>Migrated.</strong> Final static HTML is written. Turning it into EDS blocks and DA content is the job of <code>deploy</code> and <code>rollout</code>.',
  'Selected <code>{path}</code>, which is <code>{status}</code>.',
  'I approved it during my run.',
  'Hands-off mode is on. Prototypes now get approved by the agent once its quality gates pass. My run had <code>"handsOff": false</code>.',
  'Hands-off mode is off. Approval waits for a person again.',
  'Back to my run: the index, hero and cards pages approved by me, stats still <code>extracted</code>.',
  '// state.json top level: "handsOff": true',
];

function seedPages() {
  return SEED.map(([slug, path, status]) => {
    const p = {
      slug, path, status, prototypePath: null, migratedPath: null,
    };
    if (status === 'approved') {
      p.prototypePath = `stardust/prototypes/${slug}-proposed.html`;
      p.history = [{ ...JACK }];
    }
    return p;
  });
}

export function match($, el) {
  const $el = $(el);
  return $el.is('[data-lifecycle]') || ($el.is('div.wide') && $el.children('[data-lifecycle]').length === 1 && $el.children().length === 1);
}

export function convert($, el, h) {
  const $f = $(el).is('[data-lifecycle]') ? $(el) : $(el).children('[data-lifecycle]');
  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const left = $f.find('.lab__left');
  const right = $f.find('.lab__right');

  const pages = left.find('[data-pages] li').map((_, li) => {
    const $b = $(li).find('button');
    return `<li>${h.inline($b.find('span').first())} <em>${h.esc($b.find('em').text())}</em></li>`;
  }).get().join('');
  const leftHtml = `<p>${h.inline(left.children('.lab__label').first())}</p><ol>${pages}</ol><p>${h.inline(left.find('.sdl__more'))}</p>`;

  const $flow = right.find('[data-states]');
  const flow = $flow.children('li').map((_, li) => `<li><strong>${h.esc($(li).find('b').text())}</strong> ${h.inline($(li).find('span'))}</li>`).get().join('');
  const $acts = right.find('[data-actions]');
  const ctls = $acts.find('button').map((_, b) => `<li>${h.inline(b)}</li>`).get().join('');
  const rightHtml = `<p>${h.esc($flow.attr('aria-label') || '')}</p><ol>${flow}</ol>`
    + `<p>${h.inline($acts.find('.lab__label'))}</p><ul>${ctls}</ul>`
    + `<p>${h.inline(right.find('[data-msg] p').first())}</p>`
    + `<pre><code>${h.esc(right.find('[data-json]').text())}</code></pre>`;

  return h.block('explainer stardust-lifecycle', [
    [`<p>${h.inline(bar.find('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`],
    [leftHtml, rightHtml],
    [`<pre><code>${h.esc(JSON.stringify(seedPages(), null, 2))}</code></pre>`],
    [`<ol>${MESSAGES.map((m) => `<li>${m}</li>`).join('')}</ol>`],
  ]);
}
