/*
 * Portfolio template (metadata "template: portfolio"): portfolio/index.html, styles.css and
 * script.js of the source, on EDS sections.
 *
 * Content shape, all authored in Experience Workspace:
 * - the first section (style "intro") is the page head: the h1, the kicker paragraph, the deck
 *   paragraph, the actions (a bold link is the primary button, a plain link the text link) and
 *   one paragraph of featured links;
 * - one section per project chapter, section metadata "id" (ch-*) and style "chapter" plus the
 *   project accent word (anima, bruce, factory, kit, conv, cea, ciam, postal, shadow, star) and
 *   "flagship" or "lofi";
 * - a section with metadata "label" is a labelled region (aria-label), as the source's
 *   <section aria-label> elements.
 *
 * Pure UI the template adds: the head's signal field and glow (decoration, no text), the
 * entrance rise of the head copy, the scroll progress line under the header, and the image
 * viewer that diagrams and photos in frames, deck panes and carousel slides open in.
 * Every authored element is moved, never rebuilt; wrappers carry the layout classes.
 */

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function wrap(el, className) {
  const box = document.createElement('div');
  box.className = className;
  el.before(box);
  box.append(el);
  return box;
}

/* ------------------------------------------------------------------ head */

/** The head's ambient threads in the chapter accents (source script.js, signal field). */
function signalField(section, copy) {
  const canvas = document.createElement('canvas');
  canvas.className = 'signal-field';
  canvas.setAttribute('aria-hidden', 'true');
  const glow = document.createElement('div');
  glow.className = 'intro-glow';
  glow.setAttribute('aria-hidden', 'true');
  section.prepend(canvas, glow);
  if (reduceMotion()) return;

  const ctx = canvas.getContext('2d');
  const TOKENS = ['--color-accent', '--color-project-cyan', '--color-project-amber', '--color-project-mint'];
  let colors = [];
  let alpha = { line: 0.16, node: 0.72 };
  const toRGB = (value) => {
    const hex = value.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
      let h = hex[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    }
    const rgb = value.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : [128, 128, 128];
  };
  const readTheme = () => {
    const cs = getComputedStyle(document.documentElement);
    colors = TOKENS.map((t) => toRGB(cs.getPropertyValue(t).trim()));
    const dark = document.documentElement.getAttribute('data-theme-effective') === 'dark';
    alpha = dark ? { line: 0.16, node: 0.44 } : { line: 0.13, node: 0.38 };
  };
  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-theme-effective'] });

  let cw = 0;
  let ch = 0;
  let raf = 0;
  let visible = true;
  let boxes = [];
  const PAD_X = 12;
  const PAD_Y = 8;
  const measureCopy = () => {
    const rect = canvas.getBoundingClientRect();
    boxes = [];
    copy.querySelectorAll('h1, p, .intro-actions').forEach((el) => {
      if (el.closest('.intro-actions') && el.tagName === 'P') return;
      const b = el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0) {
        boxes.push({
          x: b.left - rect.left - PAD_X,
          y: b.top - rect.top - PAD_Y,
          w: b.width + PAD_X * 2,
          h: b.height + PAD_Y * 2,
        });
      }
    });
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = rect.width;
    ch = rect.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    measureCopy();
  };
  const clearBehindCopy = () => {
    if (!boxes.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.filter = 'blur(16px)';
    boxes.forEach((b) => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.filter = 'none';
    boxes.forEach((b) => ctx.fillRect(b.x + PAD_X, b.y + PAD_Y, b.w - PAD_X * 2, b.h - PAD_Y * 2));
    ctx.restore();
  };
  const yAt = (x, base, amp, phase) => base
    + Math.sin((x / cw) * Math.PI * 2.2 + phase) * amp
    + Math.sin((x / cw) * Math.PI * 5.2 - phase * 0.7) * amp * 0.24;
  const drawThread = (index, time) => {
    const color = colors[index].join(',');
    const base = ch * (0.24 + index * 0.155);
    const amp = Math.min(60, ch * 0.07);
    const phase = time * (0.00008 + index * 0.000012) + index * 1.5;
    ctx.beginPath();
    for (let x = -40; x <= cw + 40; x += 10) {
      if (x === -40) ctx.moveTo(x, yAt(x, base, amp, phase));
      else ctx.lineTo(x, yAt(x, base, amp, phase));
    }
    ctx.strokeStyle = `rgba(${color}, ${alpha.line})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let node = 0; node < 6; node += 1) {
      const nx = ((node + 0.45 + index * 0.18) / 6) * cw;
      const pulse = 2.2 + Math.sin(time * 0.0012 + node + index) * 0.8;
      ctx.beginPath();
      ctx.arc(nx, yAt(nx, base, amp, phase), pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${alpha.node})`;
      ctx.fill();
    }
  };
  const draw = (time) => {
    if (!visible) return;
    ctx.clearRect(0, 0, cw, ch);
    for (let i = 0; i < 4; i += 1) drawThread(i, time);
    clearBehindCopy();
    raf = window.requestAnimationFrame(draw);
  };
  requestAnimationFrame(() => {
    resize();
    window.setTimeout(measureCopy, 1400);
    window.addEventListener('resize', resize, { passive: true });
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = window.requestAnimationFrame(draw);
      if (!visible && raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    }).observe(canvas);
    raf = window.requestAnimationFrame(draw);
  });
}

/** The head copy rises in once on load, staggered, as the source hero does. */
function rise(items) {
  if (reduceMotion()) return;
  items.forEach(([el, delay]) => {
    if (!el) return;
    const anim = el.animate(
      [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }],
      {
        duration: 900, delay, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both',
      },
    );
    anim.finished.then(() => anim.cancel()).catch(() => {});
  });
}

function decorateIntro(section) {
  const content = section?.querySelector('.default-content-wrapper');
  if (!content) return;
  const copy = document.createElement('div');
  copy.className = 'intro-copy';
  content.prepend(copy);
  let kicker = null;
  let deck = null;
  [...content.children].forEach((el) => {
    if (el === copy) return;
    if (el.tagName === 'H1') copy.append(wrap(el, 'intro-title'));
    else if (el.classList.contains('cta-slot')) {
      el.classList.add('intro-actions');
      copy.append(el);
    } else if (el.tagName === 'P' && el.querySelectorAll('a').length > 1) copy.append(wrap(el, 'intro-links'));
    else if (el.tagName === 'P' && !kicker) {
      kicker = wrap(el, 'intro-kicker');
      copy.append(kicker);
    } else if (el.tagName === 'P' && !deck) {
      deck = wrap(el, 'intro-deck');
      copy.append(deck);
    } else copy.append(el);
  });
  rise([
    [copy.querySelector('.intro-kicker'), 0],
    [copy.querySelector('.intro-title'), 80],
    [copy.querySelector('.intro-deck'), 160],
    [copy.querySelector('.intro-actions'), 240],
    [copy.querySelector('.intro-links'), 320],
  ]);
  signalField(section, copy);
}

/* ------------------------------------------------------------------ scroll progress */

function scrollProgress() {
  const header = document.querySelector('body > header');
  if (!header || header.querySelector('.scroll-progress')) return;
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  header.append(bar);
  const update = () => {
    const page = document.documentElement;
    const total = page.scrollHeight - page.clientHeight;
    bar.style.width = `${total > 0 ? (page.scrollTop / total) * 100 : 0}%`;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ------------------------------------------------------------------ image viewer */

const IMG_HREF = /\.(svg|png|jpe?g|webp|gif)(\?.*)?$/i;
const ZOOMABLE = '.portfolio-frame img, .tabs-pane img, .carousel-slide img';

/** The largest rendition the page's picture offers (the full-size file on this site). */
function fullSize(img) {
  const source = img.closest('picture')?.querySelector('source[media]');
  const src = source ? source.getAttribute('srcset').split(/\s/)[0] : (img.currentSrc || img.src);
  return new URL(src, window.location.href).href;
}

function imageViewer() {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.hidden = true;
  box.innerHTML = '<div class="lightbox-top"><a class="lightbox-file" target="_blank" rel="noopener">open file &nearr;</a>'
    + '<button class="lightbox-zoom" type="button" aria-pressed="false">zoom 1:1</button>'
    + '<button class="lightbox-close" type="button" aria-label="Close image viewer">&times;</button></div>'
    + '<div class="lightbox-body"><img alt=""></div><p class="lightbox-caption"></p>';
  document.body.append(box);
  const body = box.querySelector('.lightbox-body');
  const view = body.querySelector('img');
  const caption = box.querySelector('.lightbox-caption');
  const file = box.querySelector('.lightbox-file');
  const zoom = box.querySelector('.lightbox-zoom');
  const close = box.querySelector('.lightbox-close');
  let opener = null;

  const setZoom = (on) => {
    box.classList.toggle('zoomed', on);
    zoom.setAttribute('aria-pressed', String(on));
    zoom.textContent = on ? 'fit screen' : 'zoom 1:1';
    view.style.width = on ? `${Math.max(view.naturalWidth || 0, 1200)}px` : '';
  };
  const captionFor = (el) => el.closest('figure')?.querySelector('figcaption')?.innerText.trim() || '';
  const open = (img, from) => {
    const src = fullSize(img);
    view.src = src;
    view.alt = img.alt || '';
    view.classList.toggle('light-plate', Boolean(img.closest('.portfolio-frame.diagram, .tabs-pane')));
    caption.textContent = captionFor(img);
    file.href = src;
    opener = from;
    setZoom(false);
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('open'));
    document.documentElement.classList.add('lightbox-open');
    close.focus();
  };
  const shut = () => {
    box.classList.remove('open');
    document.documentElement.classList.remove('lightbox-open');
    window.setTimeout(() => {
      box.hidden = true;
      view.removeAttribute('src');
    }, reduceMotion() ? 0 : 250);
    opener?.focus?.();
    opener = null;
  };
  close.addEventListener('click', shut);
  zoom.addEventListener('click', () => setZoom(!box.classList.contains('zoomed')));
  view.addEventListener('click', () => setZoom(!box.classList.contains('zoomed')));
  body.addEventListener('click', (e) => { if (e.target === body) shut(); });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) {
      const img = e.target.matches?.(ZOOMABLE) ? e.target : null;
      if (img && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open(img, img);
      }
      return;
    }
    if (e.key === 'Escape') shut();
    else if (e.key === 'Tab') {
      const stops = [file, zoom, close];
      const i = stops.indexOf(document.activeElement);
      e.preventDefault();
      const back = i <= 0 ? stops.length - 1 : i - 1;
      const next = e.shiftKey ? back : (i + 1) % stops.length;
      stops[next].focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!box.hidden) return;
    const img = e.target.closest?.(ZOOMABLE) ? e.target.closest('img') || e.target : null;
    const link = e.target.closest?.('a');
    if (link && IMG_HREF.test(link.getAttribute('href') || '')) {
      const linked = link.querySelector('img');
      if (!linked || !linked.matches(ZOOMABLE)) return;
      e.preventDefault();
      open(linked, link);
    } else if (img && img.tagName === 'IMG' && !link) open(img, img);
  });
  // plain images (no link) are buttons for the viewer once their block has decorated
  const mark = (root) => root.querySelectorAll?.(ZOOMABLE).forEach((img) => {
    if (img.closest('a') || img.hasAttribute('tabindex')) return;
    img.classList.add('lb-zoomable');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
  });
  new MutationObserver((records) => records.forEach((r) => {
    if (r.target.dataset?.blockStatus === 'loaded') mark(r.target);
  })).observe(document.querySelector('main'), { subtree: true, attributes: true, attributeFilter: ['data-block-status'] });
}

/**
 * A band's opening default content (timeline, career notes, smaller repos): the heading, the
 * mono meta line right after it, then hint paragraphs.
 */
function decorateBandHead(section) {
  const content = section.querySelector('.default-content-wrapper');
  if (!content) return;
  let meta = false;
  [...content.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) wrap(el, 'band-title');
    else if (el.tagName === 'P' && !meta) {
      meta = true;
      wrap(el, 'band-meta');
    } else if (el.tagName === 'P') wrap(el, 'band-hint');
  });
}

export default async function decorate(main) {
  main.querySelectorAll(':scope > .section[data-label]').forEach((section) => {
    section.setAttribute('role', 'region');
    section.setAttribute('aria-label', section.dataset.label);
  });
  main.querySelectorAll(':scope > .section:is(.timeline, .career, .workbench)').forEach(decorateBandHead);
  decorateIntro(main.querySelector(':scope > .section.intro'));
  scrollProgress();
  imageViewer();
}
