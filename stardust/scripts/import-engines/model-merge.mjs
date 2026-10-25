// Importer engine for the merge explainer (figure[data-merge], Four Frontier Models)
// -> explainer (model-merge). What was kept from each model and the sentence comparing it with
// the line counts live in the source's explainer.js; they are carried here verbatim. The line
// counts come from the figure's static table.
const KEPT = {
  claude: ['The foundation the others were grafted onto', 'The navigation and the navigable timeline', 'The carousel view and the slider', 'The numbers that count up, shared with Kimi'],
  kimi: ['The scrolling and the animation', 'The numbers that count up as you scroll', 'Its HTML, which I felt followed the Stitch design more faithfully', 'The pastel palette, shared with Claude'],
  gpt: ['The home screen: its layout, look and feel', 'Paired with Kimi\'s words. My answer to the merge question was "GPT layout, Kimi voice"'],
  gemini: ['Nothing. Asked whether anything was worth saving, I said no.'],
};
const SAYS = {
  claude: 'They agree. Claude was the base, and 1,121 of the 1,714 lines (65%) appear only in its build.',
  kimi: 'They don\'t agree. Only 14 lines (under 1%) appear only in Kimi\'s build. What I kept from Kimi was a look and a behavior, and it mostly came in as new code.',
  gpt: 'They don\'t agree. Only 25 lines (1.5%) appear only in GPT\'s build. The home screen I kept mostly came in as new code on Claude\'s skeleton.',
  gemini: 'They agree. I kept nothing, and only 4 lines appear only in Gemini\'s build.',
};

export function match($, el) {
  const $el = $(el);
  return $el.is('figure[data-merge]') || ($el.is('div.wide') && $el.children('figure[data-merge]').length === 1);
}

export function convert($, el, h) {
  const $f = $(el).is('figure') ? $(el) : $(el).children('figure[data-merge]');
  const p = (html) => `<p>${html}</p>`;
  const rows = [[p(h.inline($f.find('.lab__bar span').first()))]];
  const keptHead = $f.find('.mg__views .mg__h').first().clone();
  keptHead.find('[data-kept-name]').remove();
  rows.push([
    p(h.inline($f.find('.mg__label').first())),
    p(h.esc(keptHead.text().trim())),
    p(h.inline($f.find('.mg__views .mg__h').eq(1))),
  ]);
  $f.find('[data-model]').each((_, b) => {
    const key = $(b).attr('data-model');
    rows.push([
      p(h.inline(b)),
      `<ul>${(KEPT[key] || []).map((k) => `<li>${h.esc(k)}</li>`).join('')}</ul>`,
      p(h.esc(SAYS[key] || '')),
    ]);
  });
  $f.find('.mg__table tr').each((_, tr) => {
    rows.push($(tr).children('th, td').map((__, c) => p(h.inline(c))).get());
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([p(h.inline(cap))]);
  return h.block('explainer model-merge', rows);
}
