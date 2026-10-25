// Import engine for figure.day (writing/2026-10-25-eds-migration-two-goal-prompts): the day in
// commits -> explainer (commit-day). Row shape: blocks/explainer/engines/commit-day.js. The
// commit log comes from the page's script#day-data; the axis and the two prompt bands are the
// constants of the source's inline script.
export const match = ($, el) => el.name === 'figure' && $(el).hasClass('day');

const hhmmss = (m) => {
  const s = Math.round(m * 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
};
const hhmm = (m) => hhmmss(m).slice(0, 5);

export function convert($, el, h) {
  const $f = $(el);
  const p = (html) => `<p>${html}</p>`;
  const row = (key, ...cells) => [p(key), ...cells.map(p)];
  const data = JSON.parse($('#day-data').text());
  const $bar = $f.find('.day__bar');
  const $live = $f.find('.day__live');
  const $svg = $live.find('svg');
  const rows = [
    row('bar', h.inline($bar.children('span').first()), h.inline($('<p></p>').append($bar.children('a').first().clone()))),
    row('image', h.img($f.find('img.day__static'))),
    row('chart', h.esc($svg.attr('aria-label')), h.esc($svg.find('title').text())),
    row('controls', h.esc($live.find('.day__controls').attr('aria-label')), h.inline($live.find('[data-play]'))),
    ...$live.find('[data-at]').map((_, b) => {
      const $b = $(b).clone();
      const t = $b.find('.day__t').remove().text();
      return [row('jump', h.esc(t), h.inline($b).trim(), hhmm(Number($(b).attr('data-at'))))];
    }).get(),
    row('axis', '09:00', '16:30', '135'),
    row('band', 'PROMPT 1', '09:34', '11:20'),
    row('band', 'PROMPT 2', '12:32', '16:06'),
    row('slider', h.esc($live.find('.day__range').attr('aria-label')), hhmm(Number($live.find('.day__range').attr('value')))),
    ...data.lanes.map(([key, label]) => row('lane', h.esc(key), h.esc(label))),
    ...data.commits.map(([m, sha, msg, lane]) => row('commit', hhmmss(m), h.esc(sha), h.esc(msg), h.esc(lane))),
    row('caption', h.inline($f.children('figcaption'))),
  ];
  return h.block('explainer commit-day', rows);
}
