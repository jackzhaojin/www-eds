// Import engine: the beat simulator one-off (figure.fig.lab.bs[data-beatsim], in a div.wide
// with its p.lab-note caption) -> block `explainer (beat-sim)`. Row shape: see the JSDoc of
// blocks/explainer/engines/beat-sim.js. The table, controls, static example and caption come
// from the source HTML; the starting ledger and the reader-facing strings come from the
// source's explainer.js (writing/2026-08-15-anima-mesh-company-of-zero/explainer.js), carried
// verbatim, since that script is not loadable here.

// From explainer.js freshBeatState() and freshDemo().
const DATA = [
  ['start', '2026-07-27T12:00:00.000Z'],
  ['time zone', 'America/New_York'],
  ['ledger', '<ul><li>research-watch 2026-07-20T12:04:42.031Z</li><li>chief-of-staff 2026-07-21T12:05:18.007Z</li></ul>'],
  ['fails first', 'research-watch'],
];

// From explainer.js renderRows(), plain(), takeaway(), renderResult() and sync(), in that order.
// {placeholders} are filled in by the engine.
const STRINGS = [
  ['toggle', 'fails today'],
  ['not run', 'not run by the cloud beat'],
  ['reason due', '{cadence}: last ran {days} days ago, so it is due'],
  ['reason not due', '{cadence}: ran {days} days ago, not due yet'],
  ['reason laptop due', 'due, but it only runs on my laptop, so the brief reminds me to run it'],
  ['reason laptop', 'only runs on my laptop, and not due today'],
  ['reason commercial', 'commercial agent, stays off until its activation gates open'],
  ['reason never', 'never run yet, so it is due'],
  ['takeaway failed', '{failed} failed, and the beat kept going: {runs} agent{s} still ran, the brief went out, and a separate failure DM names {failed}. It never logged a finished run, so it is due again at the next beat.'],
  ['takeaway idle', 'Nobody was due, so nothing ran and nothing was sent.'],
  ['takeaway ok', 'Every due agent ran and the brief went out. No failure DM was sent, so silence means success.'],
  ['takeaway blocked', 'The brief also reminds me to run {names} on my laptop.'],
  ['hint', 'Tick or untick "fails today", then run the beat.'],
  ['due label', 'Due, in run order'],
  ['skipped label', 'Skipped'],
  ['nobody due', 'Nobody is due.'],
  ['failed', 'failed, the beat continues'],
  ['ran', 'report written'],
  ['hub note', 'its prompt includes a note to remind me about {names}'],
  ['term label', 'What the beat leaves behind'],
  ['term commit', 'commit'],
  ['term deliver', 'deliver'],
  ['term dm', 'failure DM'],
  ['term no dm', 'none, so silence means success'],
  ['when', '{date}, 08:00 New York'],
];

export function match($, el) {
  const $el = $(el);
  if ($el.is('[data-beatsim]')) return true;
  return $el.is('div.wide') && $el.children('[data-beatsim]').length > 0;
}

export function convert($, el, h) {
  const $el = $(el);
  const $f = $el.is('[data-beatsim]') ? $el : $el.children('[data-beatsim]');
  const bar = $f.find('.lab__bar');
  const link = bar.find('a').first();
  const rows = [[`<p>${h.inline(bar.find('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>`]];

  // The roster table: the header row, then one row per agent (name | rhythm | runs on).
  rows.push($f.find('.bs__table thead th').map((_, th) => `<p>${h.esc($(th).text().trim())}</p>`).get());
  $f.find('.bs__table tbody tr').each((_, tr) => {
    const $tr = $(tr);
    const name = $tr.find('th .mono').text().trim();
    const hub = $tr.find('th .bs__hub').text().trim();
    const cells = $tr.children('td');
    rows.push([
      `<p><code>${h.esc(name)}</code>${hub ? ` <em>${h.esc(hub)}</em>` : ''}</p>`,
      `<p>${h.esc(cells.eq(0).text().trim())}</p>`,
      `<p>${h.esc(cells.eq(1).text().trim())}</p>`,
    ]);
  });

  const controls = $f.find('.bs__controls button').map((_, b) => `<p>${h.inline(b)}</p>`).get().join('');
  rows.push(['<p>controls</p>', controls]);
  DATA.forEach(([k, v]) => rows.push([`<p>${k}</p>`, v.startsWith('<') ? v : `<p>${h.esc(v)}</p>`]));
  STRINGS.forEach(([k, v]) => rows.push([`<p>${k}</p>`, `<p>${h.esc(v)}</p>`]));

  // The static example the source shows without JavaScript.
  const out = $f.find('.bs__out');
  let example = '';
  out.children().each((_, c) => {
    const $c = $(c);
    if ($c.is('p')) example += `<p>${h.inline(c)}</p>`;
    else if ($c.is('ol, ul')) {
      const items = $c.children('li').map((__, li) => {
        const $li = $(li);
        const parts = [`<strong>${h.esc($li.children('b').text())}</strong> ${h.esc($li.children('.bs__why').text())}`];
        $li.children('.bs__res, .bs__sub').each((___, s) => parts.push(h.esc($(s).text())));
        return `<li>${parts.join('<br>')}</li>`;
      }).get().join('');
      example += `<${c.name}>${items}</${c.name}>`;
    } else if ($c.is('.bs__term')) {
      example += `<p>${$c.children('span').map((__, s) => {
        const label = $(s).children('i').text();
        const $copy = $(s).clone();
        $copy.children('i').remove();
        const rest = $copy.text().trim();
        return label ? `<em>${h.esc(label)}</em> ${h.esc(rest)}` : h.esc(rest);
      }).get().join('<br>')}</p>`;
    }
  });
  rows.push(['<p>example</p>', example]);

  const cap = $el.children('p.lab-note');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer beat-sim', rows);
}
