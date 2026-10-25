/**
 * Figure: one piece of media and its caption (the explainer family's figure). One row, one
 * cell: an image paragraph or a YouTube link paragraph, then caption paragraphs.
 *
 * A YouTube link plays in place: the link paragraph stays as the authored source (hidden),
 * the player frame shows the video, titled from the link text. A lone YouTube link in default
 * content becomes this block too (scripts.js), so authors never build an embed table.
 *
 * @variants board (default board)
 *   board - a diagram or screenshot on a white ground with a hairline, as the source's boards
 */

const VARIANTS = ['board'];
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
      el.hidden = true;
      media.append(el, videoFrame(link));
    } else if (!media.children.length && (el.matches('picture, img') || el.querySelector('picture, img'))) {
      media.append(el);
    } else caption.append(el);
  });
  figure.append(media);
  if (caption.children.length) figure.append(caption);
  if (video) block.classList.add('video');
  else if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('board');
  block.replaceChildren(figure);
}
