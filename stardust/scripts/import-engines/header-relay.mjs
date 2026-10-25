// Import engine for figure.relay (writing/2025-09-01-aem-caching-production-architectures): the header
// relay -> explainer (header-relay). Row shape: blocks/explainer/engines/header-relay.js.
// The does/returns lines and the verdicts are the source explainer.js's compute() and render()
// strings, written as the engine's templates ({cc}, {ttl}, {src}, {by}, {changed}, {count}).
export const match = ($, el) => el.name === 'figure' && $(el).is('[data-relay], .relay');

// explainer.js label: the layer's name inside a sentence
const SHORT = {
  publish: 'publish layer', dispatcher: 'dispatcher', adobe: "Adobe's CDN", client: 'client CDN', browser: 'browser',
};
// explainer.js compute(): per layer, per switch value: [does, returns]
const TEMPLATES = {
  browser: { only: ['Caches the page for {cc} seconds, from <code>Cache-Control</code>.', null] },
  client: {
    pass: ['Caches for {cc} seconds, from <code>Cache-Control</code>.', '<code>Cache-Control: max-age={cc}</code>'],
    override: ['Overrides: caches for 120 seconds by its own rule and returns that.', '<code>Cache-Control: max-age=120</code>'],
  },
  adobe: {
    pass: ['Caches for {ttl} seconds, from <code>{src}</code>.', '<code>Cache-Control: max-age={cc}</code>'],
    override: ['Caches for {ttl} seconds, from <code>{src}</code>. Replaces <code>Cache-Control</code> for the layer above.', '<code>Cache-Control: max-age=60</code>'],
  },
  dispatcher: {
    pass: ['Caches the page and its headers by its <code>.any</code> rules, and passes the headers on untouched.', '<code>Cache-Control: max-age={cc}</code>'],
    set: ['Caches the page and its headers by its <code>.any</code> rules, then sets its own headers.', '<code>Cache-Control: max-age=200</code> <code>Surrogate-Control: max-age=3600</code>'],
  },
  publish: { only: ['Renders the page. Caches nothing.', '<code>Cache-Control: max-age=300</code>'] },
};
const SIMPLE = "Simple: the publish layer's header goes straight through. The browser keeps the page for <strong>{cc} seconds</strong>, and Adobe's CDN for {ttl} seconds.";
const CHANGED = "The browser keeps the page for <strong>{cc} seconds</strong>, a value set by the {by}. Adobe's CDN keeps it for {ttl} seconds. {count} changed the headers on the way up ({changed}). Each one is another block to document and a layer to test on its own.";

export function convert($, el, h) {
  const $f = $(el);
  const rows = [[$f.find('.relay__bar span').map((_, s) => `<p>${h.inline(s)}</p>`).get().join('')]];
  const keys = $f.find('.relay__layer').first().find('.relay__k');
  rows.push([`<p>${h.inline(keys.eq(0))}</p>`, `<p>${h.inline(keys.eq(1))}</p>`]);
  $f.find('.relay__layer').each((_, li) => {
    const $li = $(li);
    const layer = $li.attr('data-layer');
    const name = `<p><strong>${h.inline($li.find('.relay__name b'))}</strong></p><p>${h.inline($li.find('.relay__name span').first())}</p><p><em>${h.esc(SHORT[layer] || layer)}</em></p>`;
    const t = TEMPLATES[layer];
    const buttons = $li.find('.relay__ctl [data-set]');
    let cells;
    if (buttons.length) {
      cells = buttons.map((__, b) => {
        const set = $(b).attr('data-set');
        const label = h.inline(b);
        const [does, ret] = t[set];
        return `<p>${$(b).attr('aria-checked') === 'true' ? `<strong>${label}</strong>` : label}</p><p>${does}</p><p>${ret}</p>`;
      }).get();
    } else {
      const [does, ret] = t.only;
      cells = [`<p>${does}</p><p>${ret || h.inline($li.find('[data-returns]'))}</p>`];
    }
    rows.push([name, ...cells]);
  });
  rows.push([`<p>${h.inline($f.find('[data-relay-out] p'))}</p>`, `<p>${SIMPLE}</p>`, `<p>${CHANGED}</p>`]);
  const cap = $f.children('figcaption');
  if (cap.length) rows.push([`<p>${h.inline(cap)}</p>`]);
  return h.block('explainer header-relay', rows);
}
