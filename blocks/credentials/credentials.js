/**
 * Credentials: a two-column list of certifications (css/site.css .credential-list and
 * .credential-row). One row per credential, two cells:
 * - mark: the issuer paragraph (shown until the badge loads), then the badge image paragraph;
 * - body: the heading with the credential link, the detail paragraphs (issuer or level,
 *   Earned, Renewed, Expires), then the verification link paragraph.
 * The row's id comes from the heading (claude-certified-architect-professional), the link
 * target the home and other pages use. The verification link is named for assistive tech
 * with the credential (Verify credential: <name>) through a derived suffix beside it.
 *
 * @variants (none)
 */

import { toClassName } from '../../scripts/aem.js';

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

function isLinkParagraph(el) {
  const a = el.tagName === 'P' && el.querySelector('a');
  return !!a && el.textContent.trim() === a.textContent.trim();
}

function decorateMark(cell) {
  const mark = slot('credentials-mark', []);
  mark.setAttribute('aria-hidden', 'true');
  [...cell.children].forEach((el) => {
    if (el.querySelector('picture, img')) {
      const image = slot('credentials-image', [el]);
      const img = el.querySelector('img');
      const loaded = () => { image.dataset.loaded = ''; };
      if (img.complete && img.naturalWidth) loaded();
      else img.addEventListener('load', loaded, { once: true });
      mark.append(image);
    } else mark.append(slot('credentials-issuer', [el]));
  });
  return mark;
}

function decorateBody(cell, li) {
  const nodes = [...cell.children];
  const heading = nodes.find((el) => /^H[1-6]$/.test(el.tagName));
  const links = nodes.filter(isLinkParagraph);
  const details = nodes.filter((el) => el.tagName === 'P' && !links.includes(el));
  const body = slot('credentials-body', []);
  if (heading) {
    li.id = toClassName(heading.textContent);
    body.append(slot('credentials-title', [heading]));
  }
  if (details.length) body.append(slot('credentials-details', details));
  if (links.length) {
    const name = heading ? heading.textContent.trim() : '';
    const verify = slot('credentials-verify cta-slot', []);
    links.forEach((p, i) => {
      verify.append(p);
      if (!name || !li.id) return;
      // The link is named "Verify credential: <name>" (the source's sr-only suffix). The suffix
      // sits beside the authored paragraph, never inside it, so the authored text stays as is.
      const a = p.querySelector('a');
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.id = `${li.id}-verify-${i}`;
      sr.setAttribute('aria-hidden', 'true');
      sr.textContent = `: ${name}`;
      a.id = `${li.id}-verify-link-${i}`;
      a.setAttribute('aria-labelledby', `${a.id} ${sr.id}`);
      verify.append(sr);
    });
    body.append(verify);
  }
  const used = new Set([heading, ...links, ...details]);
  nodes.filter((el) => !used.has(el)).forEach((el) => body.append(el));
  return body;
}

export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'credentials-items';
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const li = document.createElement('li');
    const cells = [...row.children].filter((c) => c.children.length);
    const bodyCell = cells.find((c) => c.querySelector('h1, h2, h3, h4, h5, h6'));
    cells.filter((c) => c !== bodyCell).forEach((c) => li.append(decorateMark(c)));
    if (bodyCell) li.append(decorateBody(bodyCell, li));
    list.append(li);
  });
  block.replaceChildren(list);
}
