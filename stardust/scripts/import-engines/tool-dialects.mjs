// Import engine for figure.dia (writing/2025-10-12-da-live-mcp-across-ai-platforms): the format
// switcher -> explainer (tool-dialects). Row shape: blocks/explainer/engines/tool-dialects.js.
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-dia], .dia');

export function convert($, el, h) {
  const $f = $(el);
  const bar = $f.find('.lab__bar').first();
  const link = bar.find('a').first();
  const name = $f.find('[role="tablist"]').attr('aria-label');
  const rows = [[`<p>${h.inline(bar.children('span').first())}</p><p><a href="${h.esc(h.absHref(link.attr('href')))}">${h.inline(link)}</a></p>${name ? `<p><em>${h.esc(name)}</em></p>` : ''}`]];
  $f.find('.dia__panel').each((_, panel) => {
    const $p = $(panel);
    const $h = $p.children('h3').first();
    const label = $h.contents().filter((__, n) => n.type === 'text').text().trim();
    const file = $h.children('span').text().trim();
    const notes = $p.children('.dia__note').map((__, n) => `<p>${h.inline(n)}</p>`).get().join('');
    const cells = [`<h3>${h.esc(label)} <em>${h.esc(file)}</em></h3>${notes}`];
    $p.find('.dia__block').each((__, b) => {
      const $b = $(b);
      const $head = $b.children('.dia__h');
      const [first, second] = $head.children().toArray();
      let head = h.inline(first);
      if (second && second.name === 'a') head += ` <a href="${h.esc(h.absHref($(second).attr('href')))}">${h.inline(second)}</a>`;
      else if (second) head += ` <em>${h.inline(second)}</em>`;
      const $pre = $b.find('pre').first();
      const marks = $pre.find('span.key, span.val, span.note').map((___, s) => `<li>${$(s).attr('class').split(' ')[0]}: ${h.esc($(s).text())}</li>`).get().join('');
      cells.push(`<p>${head}</p><pre><code>${h.esc($pre.text())}</code></pre>${marks ? `<ul>${marks}</ul>` : ''}`);
    });
    rows.push(cells);
  });
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer tool-dialects', rows);
}
