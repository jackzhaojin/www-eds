/**
 * Figure: one piece of media and its caption (the explainer family's figure). One row, one
 * cell: an image paragraph or a YouTube link paragraph, then caption paragraphs.
 *
 * A YouTube link plays in place: the link paragraph stays as the authored source (hidden),
 * the player frame shows the video, titled from the link text. A lone YouTube link in default
 * content becomes this block too (scripts.js), so authors never build an embed table.
 *
 * Screenshots and pages open full size on click (the delivered image, at its own width), as
 * on the source.
 *
 * @ew-exempt <p> video link - the embed's source link, never displayed
 * @variants board | shot | page | narrow | slim | native (default board)
 *   board - a diagram on a white ground with a hairline, as the source's boards
 *   shot - a product screenshot, the same frame, opens full size
 *   page - a photographed notebook page, at most 420px wide, opens full size
 *   narrow - with shot: a portrait screenshot kept at most 560px wide; with board: a photo and
 *   its caption kept at most 520px wide, centered
 *   slim - with shot: a portrait screenshot kept at most 460px wide (one article's narrower
 *   setting; register R8 proposes one width)
 *   native - the image at its own size, never upscaled, left-aligned
 */

const VARIANTS = ['board', 'shot', 'page'];

/** Links the picture to the delivered image at full size (derived, not authored). */
function openFull(media) {
  const img = media.querySelector('img');
  if (!img || img.closest('a')) return;
  const full = new URL(img.getAttribute('src'), window.location);
  full.searchParams.delete('width');
  const a = document.createElement('a');
  a.className = 'figure-open';
  a.href = full.href;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', `Open full size: ${img.alt}`);
  const picture = img.closest('picture') || img;
  picture.before(a);
  a.append(picture);
}
const YOUTUBE = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/;

function videoFrame(link) {
  const id = YOUTUBE.exec(link.href)[1];
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  const text = link.textContent.trim();
  frame.title = `${YOUTUBE.test(text) ? 'Video' : text} (YouTube video)`;
  frame.width = 1280;
  frame.height = 720;
  frame.loading = 'lazy';
  frame.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allowFullscreen = true;
  return frame;
}

export default function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];
  const figure = document.createElement('figure');
  figure.className = 'figure-frame';
  const media = document.createElement('div');
  media.className = 'figure-media';
  const caption = document.createElement('figcaption');
  let video = false;
  nodes.forEach((el) => {
    const link = el.matches('a') ? el : el.querySelector('a[href]');
    if (!media.children.length && link && YOUTUBE.test(link.href) && !el.querySelector('picture, img')) {
      video = true;
      const source = document.createElement('div');
      source.className = 'figure-source';
      source.append(el);
      media.append(source, videoFrame(link));
    } else if (!media.children.length && (el.matches('picture, img') || el.querySelector('picture, img'))) {
      media.append(el);
    } else caption.append(el);
  });
  figure.append(media);
  if (caption.children.length) figure.append(caption);
  if (video) block.classList.add('video');
  else if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('board');
  if (block.classList.contains('shot') || block.classList.contains('page')) openFull(media);
  block.replaceChildren(figure);
}
