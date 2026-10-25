// Import engine for figure.loopx (writing/2025-10-05-mcp-server-for-eds-da-live): the decision lab ->
// explainer (tool-loop). Row shape: blocks/explainer/engines/tool-loop.js.
// The runs are the source explainer.js's simulation (SCENARIOS, move(), finish(), playScripted()),
// played here once per run so each run's log lines, counts and verdict become the block's rows.
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-loopx], .loopx');

const SCENARIOS = { order: ['get', 'save', 'final'], twice: ['get', 'get', 'save', 'final'], blind: ['save', 'final'] };
const times = (n) => `${n}${n === 1 ? ' time' : ' times'}`;
const b = (html) => html.replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>');

function playTools(preset) {
  const s = {
    calls: 0, tools: 0, resend: 0, got: false, saved: false, blind: false,
  };
  const lines = [];
  const line = (who, text) => lines.push([who, text]);
  SCENARIOS[preset].forEach((kind) => {
    s.calls += 1;
    const withPage = s.got ? ', page HTML included' : '';
    if (s.got) s.resend += 1;
    const sent = s.calls === 1 ? 'Sends the prompt' : `Sends the whole conversation so far${withPage}`;
    if (kind === 'final') {
      line(`call ${s.calls}`, `${sent}. The model answers with text, so the loop ends.`);
      return;
    }
    const tool = kind === 'get' ? 'get_dalive_content' : 'save_dalive_content';
    line(`call ${s.calls}`, `${sent}. The model asks for <b>${tool}</b>.`);
    s.tools += 1;
    if (kind === 'get') {
      s.got = true;
      line('tool', 'Fetches the page HTML from admin.da.live and adds it to the conversation.');
    } else {
      if (!s.got) s.blind = true;
      s.saved = true;
      line('tool', 'Saves the HTML the model wrote to admin.da.live.');
    }
  });
  let verdict;
  let tone = 'ok';
  if (preset === 'blind') {
    verdict = 'Saved, but the model never read the page, so it wrote HTML blind. The prompt says to get the page first. Nothing in the code enforces it. The scripted flow cannot do this.';
    tone = 'warn';
  } else if (preset === 'twice') {
    verdict = 'Still the right result, with one more model call and one more copy of the page in every call after it. Every time I ran it, it did different things.';
  } else {
    verdict = `${s.calls} model calls where the scripted flow makes one, and the page goes to the model ${times(s.resend)} instead of once. That is where the extra time and tokens come from.`;
  }
  return {
    lines, verdict, tone, stats: [s.calls, times(s.resend), s.tools, s.saved ? (s.blind ? 'yes, unread' : 'yes') : 'no'],
  };
}

const SCRIPTED = {
  lines: [
    ['step 1', 'Code fetches the page HTML from admin.da.live.'],
    ['step 2', 'Code builds the prompt with the HTML inside it.'],
    ['call 1', 'Code calls the model <b>once</b>, page HTML included. It returns the edited HTML. No tools are offered.'],
    ['step 3', 'Code saves the edited HTML to admin.da.live.'],
  ],
  verdict: 'Same order every time: get, one model call, save. The code decides, so the order can’t go wrong. In my test this took about 15 seconds end to end.',
  tone: 'ok',
  stats: [1, times(1), 0, 'yes'],
};
const SAY = { tools: 'The model picks every step. Pick what it does:', scripted: 'Nothing to pick. The code runs the same four steps every time.' };
const RUNNING = { tools: 'Running the loop.', scripted: 'Running the four steps in order.' };

export function convert($, el, h) {
  const $f = $(el);
  const bar = $f.find('.lab__bar').first();
  const link = bar.find('a').first();
  const rows = [[`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]];

  const names = [$f.find('.loopx__modes').attr('aria-label'), $f.find('.loopx__scen').attr('aria-label')].filter(Boolean);
  const left = `<p>${h.inline($f.find('[data-say]'))}</p>${names.map((n) => `<p><em>${h.esc(n)}</em></p>`).join('')}`;
  const staticLog = $f.find('.loopx__log li').map((_, li) => {
    const $li = $(li);
    const head = $li.find('.static-h');
    if (head.length) return `<li>${h.inline(head)}</li>`;
    const [who, text] = $li.children('span').toArray();
    return `<li><strong>${h.inline(who)}</strong> ${h.inline(text)}</li>`;
  }).get().join('');
  rows.push([left, `<ol>${staticLog}</ol><p>${h.inline($f.find('.loopx__verdict'))}</p>`]);

  const labels = $f.find('.loopx__stats dt').map((_, dt) => $(dt).text().trim()).get();
  const runRow = (choice, run) => [
    choice,
    `<ol>${run.lines.map(([who, text]) => `<li><strong>${who}</strong> ${b(text)}</li>`).join('')}</ol>`,
    `<ul>${run.stats.map((v, i) => `<li>${h.esc(labels[i])}<br><strong>${v}</strong></li>`).join('')}</ul>`,
    `<p>${h.esc(run.verdict)}</p><p><code>${run.tone}</code></p>`,
  ];
  $f.find('.loopx__modes [data-mode]').each((_, btn) => {
    const mode = $(btn).attr('data-mode');
    const label = h.inline(btn);
    const def = mode === 'tools'; // explainer.js: setMode('tools')
    rows.push([`<p>${def ? `<strong>${label}</strong>` : label}</p>`, `<p>${h.esc(SAY[mode])}</p>`, `<p>${h.esc(RUNNING[mode])}</p>`]);
    if (mode === 'scripted') rows.push(runRow('', SCRIPTED));
    else {
      $f.find('.loopx__scen [data-preset]').each((__, sb) => {
        const $sb = $(sb);
        rows.push(runRow(`<p><strong>${h.inline($sb.find('b'))}</strong> ${h.inline($sb.find('small'))}</p>`, playTools($sb.attr('data-preset'))));
      });
    }
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer tool-loop', rows);
}
