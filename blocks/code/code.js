/**
 * Code: a code excerpt on the night ground, with a bar naming the file and linking to the
 * source (the explainer kit's static code). Rows: the bar (a label paragraph, then a link
 * paragraph), then the code (an authored code block).
 *
 * Lines are numbered from the bar label's "line N" or "lines N to M" (else from 1), and
 * colored the way the kit colors them. Both are a presentation refinement of the authored
 * code block: its text, newlines included, is unchanged.
 *
 * @variants wrap | prose | plain | stack
 *   wrap - the bar's label wraps and the source link stays on one line (the source's later
 *   "quality pass" on five articles)
 *   prose - lines that wrap under their text, with a hanging indent, instead of scrolling (a
 *   prompt log, the source's code--wrap)
 *   plain - no syntax colors: a prompt in a source file, which the highlighter would color
 *   wrong (the source's code--prose)
 *   stack - on phones the bar stacks the label over the link (the 2025 articles' phone pass)
 */

const KEYWORDS = /\b(const|let|if|return|await|async|new|try|catch|export|function|null)\b/g;

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

/** The kit's highlighter (js/explainers.js): comments, strings, numbers, keywords. */
function highlight(line) {
  const out = [];
  const re = /(\/\/.*$)|('[^']*'|`[^`]*`|"[^"]*")|(\b\d+\b)/g;
  let last = 0;
  let m = re.exec(line);
  while (m) {
    out.push(esc(line.slice(last, m.index)).replace(KEYWORDS, '<span class="tk-k">$1</span>'));
    let cls = 'tk-n';
    if (m[1]) cls = 'tk-c';
    else if (m[2]) cls = 'tk-s';
    out.push(`<span class="${cls}">${esc(m[0])}</span>`);
    last = re.lastIndex;
    m = re.exec(line);
  }
  out.push(esc(line.slice(last)).replace(KEYWORDS, '<span class="tk-k">$1</span>'));
  return out.join('');
}

function numberLines(pre, start, color) {
  const host = pre.querySelector('code') || pre;
  const lines = host.textContent.replace(/\n$/, '').split('\n');
  host.innerHTML = lines.map((line, i) => {
    const nl = i < lines.length - 1 ? '\n' : '';
    return `<span class="ln" data-n="${start + i}">${color ? highlight(line) : esc(line)}${nl}</span>`;
  }).join('');
}

export default function decorate(block) {
  const nodes = [...block.querySelectorAll(':scope > div > div > *')];
  const pre = nodes.find((el) => el.matches('pre'));
  const frame = document.createElement('figure');
  frame.className = 'code-frame';
  const bar = document.createElement('div');
  bar.className = 'code-bar';
  nodes.filter((el) => el !== pre).forEach((el) => {
    el.classList.remove('text-link-wrapper');
    el.querySelector('a')?.classList.remove('text-link');
    bar.append(el);
  });
  if (bar.children.length) frame.append(bar);
  if (pre) {
    const label = bar.textContent;
    const from = /\blines? (\d+)/i.exec(label);
    numberLines(pre, from ? Number(from[1]) : 1, !block.classList.contains('plain'));
    frame.append(pre);
  }
  block.replaceChildren(frame);
}
