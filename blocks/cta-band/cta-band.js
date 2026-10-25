/**
 * CTA band: a panel with a factual heading, one sentence, the buttons and an optional
 * contact line (design-system/v3 CTA band). One cell, classified by content, in order:
 * - the heading is the title (without a heading, a first paragraph that is all bold is);
 * - plain paragraphs are the text;
 * - link paragraphs are the actions (bold link = primary button, italic = secondary, plain =
 *   text link); a short plain paragraph between two of them stays in their row;
 * - a paragraph that opens in bold (not a link) is the contact line;
 * - a paragraph of two or more plain links after it is the profile links.
 *
 * Every authored element is moved into a role wrapper; link paragraphs go into a .cta-slot,
 * so the button and text-link looks hold in quick edit. Inside an inverse section the panel
 * drops its own ground, as on the source.
 *
 * @variants (none)
 */
function isLinkParagraph(el) {
  if (el.tagName !== 'P') return false;
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
}

function isProfiles(el) {
  if (el.tagName !== 'P') return false;
  const links = [...el.querySelectorAll('a[href]')];
  if (links.length < 2 || el.querySelector('strong, em')) return false;
  const linkText = links.map((a) => a.textContent.trim()).join('');
  return el.textContent.replace(/\s+/g, '') === linkText.replace(/\s+/g, '');
}

function isAllBold(el) {
  if (el.tagName !== 'P' || el.querySelector('a')) return false;
  const bold = el.querySelector('strong, b');
  return !!bold && bold.textContent.trim() === el.textContent.trim();
}

function opensBold(el) {
  if (el.tagName !== 'P' || isAllBold(el)) return false;
  const first = el.firstElementChild;
  return !!first && /^(STRONG|B)$/.test(first.tagName) && !first.querySelector('a')
    && el.textContent.trim().startsWith(first.textContent.trim());
}

function roleOf(el, i, items, hasHeading) {
  if (/^H[1-6]$/.test(el.tagName)) return 'title';
  if (!hasHeading && i === 0 && isAllBold(el)) return 'title';
  if (isLinkParagraph(el)) return 'actions';
  if (opensBold(el)) return 'contact';
  if (isProfiles(el)) return 'profiles';
  const prev = items[i - 1];
  const next = items[i + 1];
  if (prev && next && isLinkParagraph(prev) && isLinkParagraph(next)
    && el.tagName === 'P' && el.textContent.trim().split(/\s+/).length <= 4) return 'actions';
  return 'text';
}

export default function decorate(block) {
  const items = [...block.querySelectorAll(':scope > div > div > *')];
  const hasHeading = items.some((el) => /^H[1-6]$/.test(el.tagName));
  const parts = [];
  let current = null;
  items.forEach((el, i) => {
    const role = roleOf(el, i, items, hasHeading);
    if (!current || current.role !== role || role === 'title') {
      const box = document.createElement('div');
      box.className = role === 'actions' ? 'cta-band-actions cta-slot' : `cta-band-${role}`;
      current = { role, box };
      parts.push(box);
    }
    current.box.append(el);
  });
  block.replaceChildren(...parts);
  block.querySelectorAll('.cta-band-profiles a, .cta-band-contact a').forEach((a) => a.classList.remove('text-link'));
}
