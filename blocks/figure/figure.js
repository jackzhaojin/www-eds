/**
 * Figure: one piece of media and its caption (the explainer family's figure). One row, one
 * cell: an image paragraph or a YouTube link paragraph, then caption paragraphs.
 *
 * A YouTube link plays in place: the link paragraph stays as the authored source (hidden),
 * the player frame shows the video, titled from the link text. A lone YouTube link in default
 * content becomes this block too (scripts.js), so authors never build an embed table.
 * The player (about 1 MB) never loads with the page: a poster (the video's thumbnail and a play
 * button) holds its place, and the player replaces it on a click, or by itself in the page's
 * delayed phase once the figure is near the screen. Search engines should not need a click to
 * see the video (Google: "Don't rely on user actions ... to load the video").
 *
 * Screenshots, pages and boards marked open show full size on click (the delivered image, at its
 * own width), as on the source. An authored link around the image keeps its title; its href
 * becomes the delivered image, since the authored media URL is not public.
 *
 * @ew-exempt <p> video link - the embed's source link, never displayed
 * @variants board | shot | page | narrow | slim | compact | tall | native | open (default board)
 *   board - a diagram on a white ground with a hairline, as the source's boards
 *   shot - a product screenshot, the same frame, opens full size
 *   page - a photographed notebook page, at most 420px wide, opens full size
 *   narrow - with shot: a portrait screenshot kept at most 560px wide; with board: a photo and
 *   its caption kept at most 520px wide, centered
 *   slim - with shot: a portrait screenshot kept at most 460px wide (one article's narrower
 *   setting; register R8 proposes one width)
 *   tall - with board: a tall image at its own size, at most 560px wide (one article)
 *   compact - with board: the whole figure kept at most 560px wide, left-aligned (one
 *   article's board--narrow)
 *   native - the image at its own size, never upscaled, left-aligned
 *   open - with board: the diagram opens full size on click
 * Page theme board-mat (metadata theme): in the dark theme boards sit on a framed dark mat.
 */

const VARIANTS = ['board', 'shot', 'page'];

/** Links the picture to the delivered image at full size (the href is derived, not authored). */
function openFull(media) {
  const img = media.querySelector('img');
  if (!img) return;
  const full = new URL(img.getAttribute('src'), window.location);
  full.searchParams.delete('width');
  const authored = img.closest('a');
  const a = authored || document.createElement('a');
  a.classList.add('figure-open');
  a.href = full.href;
  a.target = '_blank';
  a.rel = 'noopener';
  if (!authored) {
    const picture = img.closest('picture') || img;
    picture.before(a);
    a.append(picture);
  }
}

const YOUTUBE = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/;

function videoFrame(id, name, autoplay) {
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0${autoplay ? '&autoplay=1' : ''}`;
  frame.title = `${name} (YouTube video)`;
  frame.width = 1280;
  frame.height = 720;
  frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allowFullscreen = true;
  return frame;
}

/** Resolves in the page's delayed phase, 3 seconds after load (scripts.js loadDelayed): the
 * load event alone comes before the blocks and the template have finished. */
const pageSettled = new Promise((resolve) => {
  const later = () => setTimeout(resolve, 3000);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
});

/** The poster that holds the player's place: the thumbnail and a play button. */
function videoPoster(link) {
  const id = YOUTUBE.exec(link.href)[1];
  const text = link.textContent.trim();
  const name = YOUTUBE.test(text) ? 'Video' : text;
  const poster = document.createElement('div');
  poster.className = 'figure-poster';
  poster.setAttribute('role', 'button');
  poster.tabIndex = 0;
  poster.setAttribute('aria-label', `Play video: ${name}`);
  const thumb = document.createElement('img');
  thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  thumb.alt = '';
  thumb.width = 480;
  thumb.height = 360;
  thumb.decoding = 'async';
  const play = document.createElement('span');
  play.className = 'figure-play';
  play.setAttribute('aria-hidden', 'true');
  poster.append(thumb, play);

  const start = (autoplay) => {
    if (!poster.isConnected) return;
    const frame = videoFrame(id, name, autoplay);
    poster.replaceWith(frame);
    if (autoplay) frame.focus();
  };
  poster.addEventListener('click', () => start(true));
  poster.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      start(true);
    }
  });
  const near = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    near.disconnect();
    pageSettled.then(() => start(false));
  }, { rootMargin: '400px 0px' });
  near.observe(poster);
  return poster;
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
      media.append(source, videoPoster(link));
    } else if (!video && !caption.children.length && (el.matches('picture, img') || el.querySelector('picture, img'))) {
      // Image paragraphs before the caption are the media: a board split in two has two.
      media.append(el);
    } else caption.append(el);
  });
  figure.append(media);
  if (caption.children.length) figure.append(caption);
  if (video) block.classList.add('video');
  else if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('board');
  if (['shot', 'page', 'open'].some((v) => block.classList.contains(v))) openFull(media);
  // A native or tall image keeps its own width before it loads, so the figure never collapses.
  const nativeImg = ['native', 'tall'].some((v) => block.classList.contains(v)) && media.querySelector('img[width]');
  if (nativeImg) nativeImg.style.width = `${nativeImg.getAttribute('width')}px`;
  block.replaceChildren(figure);
}
