/**
 * Talk template (metadata "template: talk"): a talk page, /talks/<id>/, in the language of the
 * portfolio's project pages.
 *
 * Content shape (content/README.md, "Talks"): a hero (page) head (breadcrumb, the h1 title, the
 * event line), then one section: the date and kind line, the description, the recording (a lone
 * YouTube link paragraph, which becomes a video figure), any further prose and figures, the
 * status line, a proof-links block and the way back to /talks/. A Related section may follow.
 *
 * Authored elements are moved into role wrappers, never rebuilt:
 * - talk-intro: the date and kind line (the mono meta line) and the description (the lead),
 *   right under the head;
 * - talk-story: everything between the intro and the way back, in one bordered story box;
 * - talk-footer: inside the story, the status line (its text is the talk-status metadata) as a
 *   chip, then the proof links;
 * - a paragraph that is only bold text (What it is, My take) is a talk-label.
 * Pure decoration it adds: the talk's year, outlined, beside the head.
 *
 * @ew-exempt the year is derived from the talk-date metadata, not authored text
 */
import { getMetadata } from '../../scripts/aem.js';

function wrapper(className, nodes) {
  const div = document.createElement('div');
  div.className = className;
  div.append(...nodes);
  return div;
}

const isBack = (el) => el.classList.contains('default-content-wrapper')
  && el.querySelector('a[href$="/talks/"]')
  && el.textContent.trim() === el.querySelector('a').textContent.trim();

const onlyBold = (p) => p.children.length === 1 && p.firstElementChild.tagName === 'STRONG'
  && p.textContent.trim() === p.firstElementChild.textContent.trim();

function decorateHead(section) {
  const year = getMetadata('talk-date').match(/\b(?:19|20)\d{2}\b/);
  if (!section || !year) return;
  const mark = document.createElement('span');
  mark.className = 'talk-year';
  mark.setAttribute('aria-hidden', 'true');
  [mark.textContent] = year;
  section.append(mark);
}

function decorateBody(section) {
  const first = section.querySelector(':scope > .default-content-wrapper');
  const lead = first ? [...first.children].filter((el) => el.tagName === 'P').slice(0, 2) : [];
  if (lead.length) {
    lead[0].classList.add('talk-meta');
    lead[1]?.classList.add('talk-lead');
    section.prepend(wrapper('talk-intro', lead));
    if (!first.children.length) first.remove();
  }

  const back = [...section.children].reverse().find(isBack);
  const story = [...section.children]
    .filter((el) => !el.classList.contains('talk-intro') && el !== back && el.children.length);
  if (!story.length) return;
  const box = wrapper('talk-story', story);
  if (back) back.before(box);
  else section.append(box);

  box.querySelectorAll('.default-content-wrapper > p').forEach((p) => {
    if (onlyBold(p)) p.classList.add('talk-label');
  });

  // an image figure (a slide, a diagram) right before prose sits beside it on wide screens
  const media = [...box.children].find((el) => el.classList.contains('figure-wrapper')
    && el.querySelector('img') && !el.querySelector('a[href*="youtu"]'));
  const text = media?.nextElementSibling;
  if (text?.classList.contains('default-content-wrapper')) {
    box.classList.add('talk-story-split');
    media.classList.add('talk-media');
    text.classList.add('talk-text');
  }

  const statusText = getMetadata('talk-status');
  const status = statusText && [...box.querySelectorAll('.default-content-wrapper > p')]
    .find((p) => p.textContent.trim() === statusText);
  const links = box.querySelector(':scope > .proof-links-wrapper');
  if (status) status.classList.add('talk-status');
  const footer = [status, links].filter(Boolean);
  if (footer.length) box.append(wrapper('talk-footer', footer));
  box.querySelectorAll(':scope > .default-content-wrapper').forEach((el) => {
    if (!el.children.length) el.remove();
  });
  // a talk with nothing but its status and links needs no box around them
  if (box.children.length === 1 && box.firstElementChild.classList.contains('talk-footer')) {
    box.classList.add('talk-story-plain');
  }
}

export default function decorate(main) {
  const sections = [...main.querySelectorAll(':scope > .section')];
  const head = sections.find((s) => s.querySelector('.hero'));
  decorateHead(head);
  const body = sections[sections.indexOf(head) + 1];
  if (body && !body.querySelector('.row-list')) decorateBody(body);
}
