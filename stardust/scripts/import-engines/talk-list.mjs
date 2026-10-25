// Importer engine for the talk-by-talk recap (writing/2026-10-10-adaptto-2026-25-talks): each run
// of h3.talk__h + p.talk__meta + div.talk__body triples becomes one talk-list block, one row per
// talk: anchor | head (h3, meta) | slide | notes. The block's JSDoc (blocks/talk-list) has the
// row shape. The first talk of a run converts the whole run; the rest of its elements return ''.

const TALK = 'h3.talk__h, p.talk__meta, div.talk__body';

export function match($, el) {
  return $(el).is(TALK);
}

// Inline HTML of one node (the node itself, not only its contents).
const outer = ($, node, h) => {
  if (node.type === 'text') return h.esc(node.data);
  const tmp = $('<div></div>');
  tmp.append($(node).clone());
  return h.inline(tmp[0]);
};

// A dd: text runs become paragraphs, a list stays a list, the context line is a paragraph all
// in italics.
function dd($, el, h) {
  const out = [];
  let run = '';
  const flush = () => {
    const html = run.trim();
    if (html) out.push(`<p>${html}</p>`);
    run = '';
  };
  $(el).contents().each((_, c) => {
    const $c = $(c);
    if (c.type === 'tag' && (c.name === 'ul' || c.name === 'ol')) {
      flush();
      out.push(`<${c.name}>${$c.children('li').map((__, li) => `<li>${h.inline(li)}</li>`).get().join('')}</${c.name}>`);
    } else if (c.type === 'tag' && $c.hasClass('talk__ctx')) {
      flush();
      out.push(`<p><em>${h.inline(c).trim()}</em></p>`);
    } else run += outer($, c, h);
  });
  flush();
  return out.join('');
}

function talk($, head, h) {
  const $h = $(head);
  const meta = $h.next('p.talk__meta');
  const body = (meta.length ? meta : $h).next('div.talk__body');
  // The number and the video moment are inline code, so they keep their mono look in the editor.
  $h.find('.talk__n').each((_, s) => { $(s).replaceWith(`<code>${h.esc($(s).text())}</code>`); });
  meta.find('.talk__t').each((_, s) => { $(s).replaceWith(`<code>${h.esc($(s).text())}</code>`); });
  const headHtml = `<h3>${h.inline(head)}</h3>${meta.length ? `<p>${h.inline(meta[0]).trim()}</p>` : ''}`;
  const fig = body.find('figure').first();
  const image = fig.find('img').first();
  let slide = '';
  if (image.length) {
    const tag = h.img(image[0]);
    const zoom = image.parent('a');
    const media = zoom.length ? `<a href="${/src="([^"]+)"/.exec(tag)[1]}">${tag}</a>` : tag;
    const cap = fig.find('figcaption');
    slide = `<p>${media}</p>${cap.length ? `<p>${h.inline(cap[0])}</p>` : ''}`;
  }
  let notes = '';
  body.find('dl.talk__parts').children().each((_, c) => {
    if (c.name === 'dt') notes += `<p><strong>${h.inline(c)}</strong></p>`;
    else if (c.name === 'dd') notes += dd($, c, h);
  });
  const cells = [`<p>${h.esc($h.attr('id') || '')}</p>`, headHtml];
  if (slide) cells.push(slide);
  if (notes) cells.push(notes);
  return { cells, end: body.length ? body : meta };
}

export function convert($, el, h) {
  const $el = $(el);
  if (!$el.is('h3.talk__h')) return '';
  // Only the first talk of a run builds the block.
  if ($el.prev().is('div.talk__body, p.talk__meta')) return '';
  const rows = [];
  let cur = $el;
  while (cur.length && cur.is('h3.talk__h')) {
    const { cells, end } = talk($, cur[0], h);
    rows.push(cells);
    cur = end.next();
  }
  return h.block('talk-list', rows);
}
