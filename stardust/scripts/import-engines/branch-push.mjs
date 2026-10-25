// Import engine for figure.br (writing/2025-07-07-ai-coded-nextjs-agent-cicd-infrastructure): the branch
// lab -> explainer (branch-push). Row shape: blocks/explainer/engines/branch-push.js.
// The per-branch outcomes come from the source's explainer.js (run() and render(), at the same
// commit): its strings are reproduced here for each branch chip, so they become the block's rows.
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-br], .br');

const IMAGE = 'ghcr.io/jackzhaojin/shadow-pivot-ai-agentv2';
const DEFAULT = 'release/1.0.0'; // explainer.js: var current = 'release/1.0.0'

function globToRegExp(pattern) {
  let re = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') { re += '.*'; i += 1; } else if (c === '*') re += '[^/]*';
    else re += c.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
const matches = (pattern, branch) => globToRegExp(pattern).test(branch);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// explainer.js run(): the steps each workflow takes for a push to `branch`
function run(branch) {
  const result = { main: null, release: null };
  if (matches('main', branch)) {
    result.main = [
      `Build the Docker image and push <code>${IMAGE}:latest</code>`,
      'Log in to Azure with OpenID Connect (<code>azure/login@v2</code>), no secret stored',
      '<code>az webapp restart --name shadow-pivot-ai-agentv2 --resource-group ShadowPivot</code>',
    ];
  }
  if (matches('release/*', branch)) {
    const version = branch.replace(/^release\//, '');
    const valid = /^[0-9]+\.[0-9]+(\.[0-9]+)?$/.test(version);
    result.release = [`Extract the version from the branch name: <code>${esc(version)}</code>`];
    if (!valid) {
      result.release.push(`Validate version format <em>Invalid version format: ${esc(version)}<br>Expected format: #.# or #.#.# (e.g., 3.4 or 3.4.1)</em>`);
      result.release.push('Build and push the release images');
      result.release.push('Create the GitHub release');
      result.releaseFailed = true;
    } else {
      result.release.push('Validate version format');
      result.release.push(`Build and push <code>${IMAGE}:${esc(version)}</code> and <code>:release-latest</code>`);
      result.release.push(`Create GitHub release <code>v${esc(version)}</code>. No Azure services are restarted.`);
    }
  }
  return result;
}

// explainer.js render(): the trigger lines and where the push lands
function outcome(branch) {
  const r = run(branch);
  const lane = (steps, failed, idle) => (steps
    ? `<p>${failed ? 'Runs, and stops at the version check.' : 'Runs on this push.'}</p><ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol>`
    : `<p>${esc(idle)}</p>`);
  const main = lane(r.main, false, 'Does not run: the filter is exactly "main".');
  const release = lane(r.release, r.releaseFailed, branch.indexOf('release/') === 0
    ? 'Does not run: in "release/*" the * does not match "/", so only one level under release/ counts.'
    : 'Does not run: the branch does not match "release/*".');
  let where;
  if (r.main) where = '<strong>Lands on the Azure Web App.</strong> The restart makes it pull the new <code>:latest</code> image, a couple of minutes after the push.';
  else if (r.release && !r.releaseFailed) where = '<strong>Lands in the registry and on GitHub Releases.</strong> Nothing restarts. The EC2 copy picks it up when I run <code>./deploy-with-azure.sh</code>, which pulls <code>:release-latest</code>.';
  else if (r.release) where = '<strong>Lands nowhere.</strong> The run fails, so no image and no release.';
  else where = '<strong>Lands nowhere.</strong> No workflow runs on this push. Both workflows can still be started by hand from the Actions tab.';
  return [main, release, `<p>${where}</p>`];
}

export function convert($, el, h) {
  const $f = $(el);
  const bar = $f.find('.lab__bar').first();
  const link = bar.find('a').first();
  const rows = [[`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]];

  const labels = $f.find('.lab__left > .lab__label');
  const name = $f.find('.chips').attr('aria-label');
  const left = `<p>${h.inline(labels.eq(0))}</p>${name ? `<p><em>${h.esc(name)}</em></p>` : ''}<p>${h.inline(labels.eq(1))}</p>${$f.find('[data-land] p').map((_, p) => `<p>${h.inline(p)}</p>`).get().join('')}`;
  const right = $f.find('.br__lane').map((_, ln) => {
    const $ln = $(ln);
    const $h = $ln.children('h3');
    const title = $h.contents().filter((__, n) => n.type === 'text').text().trim();
    const file = $h.find('.br__file').text().trim();
    const trig = $ln.find('.br__trigger[data-nojs]');
    const steps = $ln.find('.br__steps li').map((__, li) => `<li>${h.inline(li)}</li>`).get().join('');
    return `<h3>${h.esc(title)} <em>${h.esc(file)}</em></h3><p>${h.inline(trig)}</p><ol>${steps}</ol>`;
  }).get().join('');
  rows.push([left, right]);

  $f.find('[data-branch]').each((_, b) => {
    const branch = $(b).attr('data-branch');
    const label = h.inline(b);
    rows.push([`<p>${branch === DEFAULT ? `<strong>${label}</strong>` : label}</p>`, ...outcome(branch)]);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer branch-push', rows);
}
