/**
 * Showcase: a text column beside a media column (design-system/v3 showcase).
 *
 * feature (the home's "Selected work"): one row, the cell with the heading is the text, the
 * cell with the image is the media. The media becomes a v3 frame: the image paragraph and,
 * after it, the caption paragraph in a figcaption. An SVG image is a diagram and keeps a paper
 * ground in both themes. Text, classified by content: heading, then the first plain paragraph
 * is the lead, other plain paragraphs are body text, link paragraphs are the actions.
 *
 * story, flip, wide (the portfolio's project stories, source article.story): one row,
 * text | media. Text, classified by content: the paragraph before the heading is the mono
 * meta line (an italic run in it is the date), the heading, the first paragraph after the
 * heading is the pattern line, then body paragraphs and a blockquote (the pull quote). The
 * media cell holds a framed image (image paragraph, caption paragraph), a YouTube link
 * paragraph with a title paragraph (a click-to-load video), or nothing.
 * story puts the media left of the text; flip puts it right; wide stacks the centered text
 * over full-width media (a diagram frame), and with flip the media sits above the text; tall
 * caps a wide diagram at 680px.
 * Nested media: EDS blocks do not nest, so the blocks a story holds follow it in the section
 * and the showcase moves them in: panel (not edge), tabs, timeline (ladder),
 * frame (sub), stat-chips and proof-links. Without a media cell the first panel, tabs or
 * timeline is the media; the rest join the end of the text column (in a wide story with
 * media, they follow the media).
 * Optional config rows: `id | <anchor>` (the story's id) and `label | <text>` (the media
 * link's accessible name).
 *
 * @variants feature | story | flip | wide | tall (default feature)
 * @ew-exempt the id and label rows are config (an anchor and an aria-label), not displayed text
 */

const VARIANTS = ['feature', 'story', 'flip', 'wide', 'tall'];
const CONFIG = ['id', 'label'];
const MEDIA_BLOCKS = ['panel', 'tabs', 'timeline'];
const ADOPT = {
  panel: (b) => !b.classList.contains('edge'),
  tabs: () => true,
  timeline: (b) => b.classList.contains('ladder'),
  frame: (b) => b.classList.contains('sub'),
  'stat-chips': () => true,
  'proof-links': () => true,
};
const YOUTUBE = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/;

/** Config rows stay in the block, hidden through a wrapper, so they stay editable. */
function hiddenBox(className, nodes) {
  const box = document.createElement('div');
  box.className = className;
  box.hidden = true;
  box.append(...nodes);
  return box;
}

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function isLinkParagraph(el) {
  return el.tagName === 'P' && (el.classList.contains('button-wrapper') || el.classList.contains('text-link-wrapper'));
}

function decorateText(cell) {
  const text = document.createElement('div');
  text.className = 'showcase-text';
  let lead = false;
  [...cell.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) text.append(slot('showcase-title', [el]));
    else if (isLinkParagraph(el)) text.append(slot('showcase-actions cta-slot', [el]));
    else if (el.tagName === 'P' && !lead) {
      lead = true;
      text.append(slot('showcase-lead', [el]));
    } else text.append(slot('showcase-body', [el]));
  });
  return text;
}

function decorateMedia(cell, story) {
  const media = document.createElement('div');
  media.className = 'showcase-media';
  const figure = document.createElement('figure');
  figure.className = story ? 'frame portfolio-frame' : 'frame';
  const img = cell.querySelector('img');
  if (!story && img && /\.svg(\?|$)/i.test(img.getAttribute('src') || '')) figure.classList.add('diagram');
  let caption = null;
  [...cell.children].forEach((el) => {
    if (el.querySelector('picture, img') || el.matches('picture, img')) figure.append(slot('frame-media', [el]));
    else {
      if (!caption) {
        caption = document.createElement('figcaption');
        figure.append(caption);
      }
      caption.append(el);
    }
  });
  media.append(figure);
  return media;
}

/* ------------------------------------------------------------------ portfolio stories */

function decorateStoryText(cell, wide) {
  const text = document.createElement('div');
  text.className = `showcase-text${wide ? ' center' : ''}`;
  if (!cell) return text;
  // without a heading (a closing paragraph under a diagram) every paragraph is body text
  let heading = !cell.querySelector('h1, h2, h3, h4, h5, h6');
  let pattern = false;
  [...cell.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      heading = true;
      text.append(slot('showcase-title', [el]));
    } else if (el.tagName === 'BLOCKQUOTE') text.append(slot('showcase-quote', [el]));
    else if (!heading && el.tagName === 'P') text.append(slot('showcase-meta', [el]));
    else if (!pattern && el.tagName === 'P' && text.querySelector('.showcase-title')) {
      pattern = true;
      text.append(slot('showcase-pattern', [el]));
    } else text.append(slot('showcase-body', [el]));
  });
  return text;
}

/** A click-to-load YouTube player; the title paragraph rides on the poster (.video-embed). */
function decorateVideo(cell, link, id) {
  const media = document.createElement('div');
  media.className = 'showcase-media';
  const embed = document.createElement('div');
  embed.className = 'showcase-video';
  const facade = document.createElement('div');
  facade.className = 'showcase-facade';
  facade.setAttribute('role', 'button');
  facade.tabIndex = 0;
  const poster = document.createElement('img');
  poster.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  poster.loading = 'lazy';
  poster.alt = '';
  const play = document.createElement('span');
  play.className = 'showcase-play';
  play.setAttribute('aria-hidden', 'true');
  facade.append(poster, play);
  const linkPara = link.closest('p');
  const titleParas = [...cell.children].filter((el) => el !== linkPara && el.textContent.trim());
  const title = titleParas.map((el) => el.textContent.trim()).join(' ') || 'Play video';
  if (titleParas.length) facade.append(slot('showcase-video-title', titleParas));
  facade.setAttribute('aria-label', `Play video: ${title}`);
  const start = () => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    facade.replaceWith(iframe);
  };
  facade.addEventListener('click', start);
  facade.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      start();
    }
  });
  embed.append(facade);
  media.append(embed);
  if (linkPara) {
    linkPara.classList.remove('text-link-wrapper');
    link.classList.remove('text-link');
    media.append(slot('showcase-watch', [linkPara]));
  }
  return media;
}

function decorateStoryMedia(cell, wide, tall) {
  if (!cell || (!cell.textContent.trim() && !cell.querySelector('img'))) return null;
  const link = [...cell.querySelectorAll('a[href]')].find((a) => YOUTUBE.test(a.href) && !a.querySelector('img'));
  if (link && !cell.querySelector('img')) return decorateVideo(cell, link, YOUTUBE.exec(link.href)[1]);
  const media = decorateMedia(cell, true);
  const figure = media.querySelector('figure');
  if (wide) figure.classList.add('diagram');
  if (tall) figure.classList.add('tall');
  return media;
}

/** The wrappers of the blocks this story holds: the run of nestable blocks right after it. */
function nestedWrappers(block) {
  const list = [];
  let next = block.parentElement?.nextElementSibling;
  while (next) {
    const inner = next.firstElementChild;
    const name = inner?.classList.contains('block') ? inner.dataset.blockName : '';
    if (!name || !ADOPT[name] || !ADOPT[name](inner)) break;
    list.push(next);
    next = next.nextElementSibling;
  }
  return list;
}

function decorateStory(block, rows) {
  const wide = block.classList.contains('wide');
  const flip = block.classList.contains('flip');
  const tall = block.classList.contains('tall');
  if (!block.classList.contains('story')) block.classList.add('story');
  let textCell = null;
  let mediaCell = null;
  const meta = [];
  rows.forEach((row) => {
    const cells = [...row.children];
    const key = cells.length === 2 ? cells[0].textContent.trim().toLowerCase() : '';
    if (CONFIG.includes(key)) {
      const value = cells[1].textContent.trim();
      if (key === 'id' && value) block.id = value;
      if (key === 'label' && value) block.dataset.mediaLabel = value;
      cells.forEach((c) => meta.push(...c.children));
      return;
    }
    cells.forEach((cell) => {
      if (!textCell && cell.querySelector('h1, h2, h3, h4, h5, h6')) textCell = cell;
      else if (!mediaCell) mediaCell = cell;
    });
  });
  if (mediaCell && !textCell && !mediaCell.querySelector('img, a') && mediaCell.textContent.trim()) {
    textCell = mediaCell;
    mediaCell = null;
  }
  const text = decorateStoryText(textCell, wide);
  let media = decorateStoryMedia(mediaCell, wide, tall);
  if (media && block.dataset.mediaLabel) media.querySelector('.frame-media a')?.setAttribute('aria-label', block.dataset.mediaLabel);
  delete block.dataset.mediaLabel;
  const after = document.createElement('div');
  after.className = 'showcase-after';
  nestedWrappers(block).forEach((wrapper) => {
    const name = wrapper.firstElementChild.dataset.blockName;
    if (!media && MEDIA_BLOCKS.includes(name)) media = slot('showcase-media', [wrapper]);
    else if (wide && media && !flip) after.append(wrapper);
    else text.append(wrapper);
  });
  let parts = [media, text];
  if (wide) parts = flip ? [media, text] : [text, media, after];
  if (meta.length) parts.push(hiddenBox('showcase-meta-rows', meta));
  block.replaceChildren(...parts.filter((p) => p && (p !== after || after.children.length)));
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('feature');
  if (!block.classList.contains('feature')) {
    decorateStory(block, [...block.querySelectorAll(':scope > div')]);
    return;
  }
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const mediaCell = cells.find((c) => c.querySelector('picture, img'));
  const parts = [];
  cells.forEach((cell) => {
    if (cell === mediaCell) parts.push(decorateMedia(cell));
    else if (cell.children.length) parts.push(decorateText(cell));
  });
  block.replaceChildren(...parts);
}
