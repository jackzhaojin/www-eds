/**
 * Explainer (harvest-sorter): where the AI Knowledge Harvester files a document, for "Two AI
 * Skills for Team Enablement". The harvester is a skill, instructions a model follows; this
 * applies the same written rules literally, from ai-builder-kit at 93cfafd: SKILL.md (document
 * types, the two-tier taxonomy, the filename pattern) and references/repo-scan.md (exclusions,
 * sub-project detection, CLAUDE.md duplicates).
 *
 * Rows, read by content:
 * - bar: the first row, one cell: the label paragraph, then the source link paragraph;
 * - samples: one row per example file, four cells: the chip label | the GitHub repo name |
 *   the path in that repo | the file's text (a code block); the first is picked on load;
 * - labels: three cells: the examples label | the source path label | the destination label;
 * - static: a one-cell row with the destination paragraph and the list of reasons, shown
 *   without JavaScript;
 * - settings: a one-cell row with a list holding "date: YYYY-MM-DD", the date in the names;
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants harvest-sorter
 * @ew-exempt samples and settings - data, drawn as the paths, reasons and frontmatter; the
 *   static destination and reasons - the no-JavaScript fallback; the reasons - derived from
 *   the skill's rules, kept with them in this engine
 */

const txt = (el) => (el ? el.textContent.trim() : '');
const slugify = (s) => s.toLowerCase().replace(/\.md$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';

function exclusion(path) {
  const file = path.split('/').pop();
  if (/(^|\/)(node_modules|\.git|dist|build|output)\//.test(path)) return 'build output and dependencies are never harvested';
  if (/(^|\/)docs\//.test(path)) return 'docs/ folders are integral project documentation, even if AI wrote them';
  if (/(^|\/)src\/prompts\//.test(path)) return 'harness prompts in src/prompts/ are executable, so they stay with the code';
  if (/^readme\.md$/i.test(file)) return 'README.md files are public documentation, not AI docs';
  if (/^\.env/.test(file) || /lock/i.test(file)) return '.env files, lock files and generated files are never harvested';
  if (!/\.md$/i.test(file)) return 'the harvester collects markdown documents';
  return null;
}

function subProject(repo, path) {
  let m = path.match(/^local\/([^/]+)\//) || path.match(/^server\/([^/]+)\//) || path.match(/^packages\/([^/]+)\//);
  if (m) return [m[1], `the path starts with ${path.split('/')[0]}/${m[1]}/, so this is a monorepo sub-project`];
  m = path.match(/^([^/]+)\/(CLAUDE|AGENTS)\.md$/);
  if (m) return [m[1], `${m[1]}/ has its own ${m[2]}.md, so it is a sub-project`];
  return [repo, 'a root-level file in a simple repo repeats the repo name as the second tier'];
}

function classifyFile(path, text) {
  const file = path.split('/').pop();
  if (/^(CLAUDE|AGENTS)\.md$/.test(file)) return ['working-doc', `${file} counts as a working doc`];
  if (/prompt-log/i.test(file) || /→ Response|→ Action/.test(text)) return ['prompt-log', 'it reads like a session log, prompts followed by → Response and → Action lines'];
  if (/(^|\/)prompts\//.test(path)) return ['harness-prompt', 'it is a prompt template in a prompts/ folder'];
  if (/spec|prd/i.test(file) || /\b(specification|requirements|architecture|decisions)\b/i.test(text)) return ['spec', 'it has spec signals: specification, requirements, architecture or decisions'];
  if (/kickoff|gap/i.test(file)) return ['working-doc', 'kickoff prompts and gap analyses are working docs'];
  return ['working-doc', 'nothing stronger matched, and working-doc is the default when uncertain'];
}

function classify(rows) {
  const parts = { samples: [] };
  const single = [];
  rows.forEach((cells, i) => {
    const [a] = cells;
    if (cells.length === 4 && cells[3].querySelector('pre')) parts.samples.push(cells);
    else if (cells.length === 3) parts.labels = cells;
    else if (i === 0) parts.bar = a;
    else if (a.querySelector('ul') && /^date:/i.test(txt(a.querySelector('li')))) parts.settings = a;
    else if (a.querySelector('ul')) parts.staticRow = a;
    else single.push(a);
  });
  parts.caption = single.pop();
  return parts;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const parts = classify(rows(block));
  const frame = slot('lab hv');
  if (parts.bar) {
    const bar = slot('lab__bar', [...parts.bar.children]);
    plainLinks(bar);
    frame.append(bar);
  }
  const body = slot('hv-body');
  frame.append(body);
  const data = slot('hv-data');
  const [pickLabel, srcLabel, destLabel] = parts.labels || [];

  const picks = slot('hv-picks');
  picks.setAttribute('role', 'radiogroup');
  picks.setAttribute('aria-label', 'Pick an example file');
  const samples = parts.samples.map(([label, repo, path, text]) => {
    const chip = slot('hv-chip', [...label.children]);
    chip.setAttribute('role', 'radio');
    picks.append(chip);
    const s = {
      chip, repo: txt(repo), path: txt(path), text: text.querySelector('pre').textContent,
    };
    data.append(...repo.children, ...path.children, ...text.children);
    return s;
  });
  body.append(slot('hv-live', [slot('hv-label', pickLabel ? [...pickLabel.children] : []), picks]));

  const src = document.createElement('p');
  src.className = 'hv-src';
  body.append(slot('hv-from', [slot('hv-label', srcLabel ? [...srcLabel.children] : []), src]));
  const result = document.createElement('p');
  result.className = 'hv-dest';
  result.setAttribute('aria-live', 'polite');
  body.append(slot('hv-to', [slot('hv-label', destLabel ? [...destLabel.children] : []), result]));
  const why = document.createElement('ul');
  why.className = 'hv-why';
  const front = document.createElement('pre');
  front.className = 'hv-front';
  body.append(why, front);
  if (parts.staticRow) body.append(slot('hv-static', [...parts.staticRow.children]));
  if (parts.settings) data.append(...parts.settings.children);
  frame.append(data);
  if (parts.caption) frame.append(slot('x-caption hv-caption', [...parts.caption.children]));
  block.replaceChildren(frame);
  if (!samples.length) return;

  const DATE = (/date:\s*(\d{4}-\d{2}-\d{2})/i.exec(data.textContent) || [])[1] || '2026-04-12';
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const li = (...nodes) => {
    const item = document.createElement('li');
    item.append(...nodes);
    return item;
  };
  const code = (t) => el('code', '', t);

  function render(sample) {
    const { repo, path, text } = sample;
    samples.forEach((x) => {
      x.chip.setAttribute('aria-checked', String(x === sample));
      x.chip.tabIndex = x === sample ? 0 : -1;
    });
    src.replaceChildren(el('span', 'hv-seg', repo), ' ', el('span', 'hv-sl', ':'), ` ${path}`);
    const ex = exclusion(path);
    if (ex) {
      result.replaceChildren(el('span', 'hv-skip', 'Not harvested. It stays only in the source repo.'));
      why.replaceChildren(li(`Skipped: ${ex}.`));
      front.textContent = '';
      return;
    }
    const [sub, subWhy] = subProject(repo, path);
    const [type, typeWhy] = classifyFile(path, text);
    const file = path.split('/').pop();
    const dup = /^(CLAUDE|AGENTS)\.md$/.test(file);
    const dest = `ai-knowledge/projects/${repo}/${sub}/${type}s/${DATE}-01-${slugify(file)}.md`;
    const segs = dest.split('/');
    result.replaceChildren(...segs.flatMap((p, i) => {
      const seg = el('span', i === segs.length - 1 ? 'hv-seg hv-seg-file' : 'hv-seg', p);
      return i ? [el('span', 'hv-sl', '/'), seg] : [seg];
    }));
    why.replaceChildren(
      li('Tier 1 is the GitHub repo name: ', code(repo), '.'),
      li('Tier 2 is ', code(sub), `: ${subWhy}.`),
      li('Type is ', code(type), `: ${typeWhy}.`),
      li('The name is the date, a sequence number and a slug, so the folder sorts in time order.'),
      li(dup ? 'It is copied as a duplicate. Claude Code reads it at session start, so the original never moves.' : 'It is a copy. The source file stays where it is.'),
    );
    const h1 = (text.match(/^# (.+)$/m) || [])[1];
    const title = (h1 || file.replace(/\.md$/, '')).replace(/"/g, "'");
    front.textContent = ['---', `title: "${title}"`, `project: ${repo}`, `sub_project: ${sub}`, `type: ${type}`, `date: ${DATE}`, 'tags: []',
      'why_private: "one phrase, written by the model"', 'status: stable', `source_repo: https://github.com/jackzhaojin/${repo}`, 'source_tool: claude-code',
      dup ? 'duplicate: true' : null, '---'].filter(Boolean).join('\n');
  }

  samples.forEach((s, i) => {
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
      const next = samples[(i + d + samples.length) % samples.length];
      render(next);
      next.chip.focus();
    });
  });
  block.classList.add('is-live');
  render(samples[0]);
}
