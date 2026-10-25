/**
 * Explainer (skill-tracker): what MLflow sees against what the hook tags, for "Adobe's EDS
 * skills, hands-on". The parsing and tagging rules of skill_tracker.py (eds-skill-assess-2026-05
 * at a4bcb3c), ported line for line, run on the transcript lines the reader keeps.
 *
 * Rows, read by content:
 * - bar: the first row, one cell: the label paragraph, then the source link paragraph;
 * - lines: a cell with the lines label, then the list of transcript lines, each a bold title,
 *   then the line as inline code in the JSON shape the hook reads (entry.message.content);
 * - result: a cell with the spans label, the list of spans MLflow records, the tags label, the
 *   tags as a code block and the note: the result for all lines, as shown without JavaScript
 *   (the engine redraws them from the lines the reader keeps);
 * - built-in: a one-cell row with a list holding "built-in commands: a, b, ...", the commands
 *   the hook drops (BUILTIN_COMMANDS in skill_tracker.py);
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants skill-tracker
 * @ew-exempt the built-in commands - data, never displayed; the spans, tags and note - derived,
 *   redrawn from the kept lines (their authored text is the all-lines result)
 */

const txt = (el) => (el ? el.textContent.trim() : '');
const strip = (s) => s.replace(/^\s+|\s+$/g, '');
const lstripSlash = (s) => s.replace(/^\/+/, '');

// extract_invocations(), skill_tracker.py lines 63 to 105.
function extractInvocations(entries, builtin) {
  const out = [];
  entries.forEach((entry) => {
    const msg = entry && typeof entry === 'object' ? entry.message : null;
    const content = msg && typeof msg === 'object' ? msg.content : null;
    if (Array.isArray(content)) {
      content.forEach((part) => {
        if (part && typeof part === 'object' && part.type === 'tool_use' && part.name === 'Skill') {
          const { skill } = part.input || {};
          if (skill) out.push({ skill: strip(skill), source: 'model_tool_call' });
        }
      });
    }
    if (typeof content === 'string') {
      const re = /<command-name>([^<]+)<\/command-name>/g;
      let m = re.exec(content);
      while (m) {
        const name = strip(lstripSlash(strip(m[1])));
        if (name && !builtin.has(name)) out.push({ skill: name, source: 'slash_command' });
        m = re.exec(content);
      }
    }
  });
  return out;
}

// json.dumps() with Python's default separators.
const pyList = (arr) => `[${arr.map((s) => JSON.stringify(s)).join(', ')}]`;
const pyDict = (obj) => `{${Object.keys(obj).map((k) => `${JSON.stringify(k)}: ${obj[k]}`).join(', ')}}`;

// apply_tags(), lines 147 to 163: the tag values the hook writes.
function buildTags(invocations) {
  const skills = Array.from(new Set(invocations.map((i) => i.skill))).sort();
  const sources = Array.from(new Set(invocations.map((i) => i.source))).sort();
  const counts = {};
  invocations.forEach((i) => { counts[i.skill] = (counts[i.skill] || 0) + 1; });
  return {
    skills_used: pyList(skills),
    skills_used_count: String(invocations.length),
    skills_unique_count: String(skills.length),
    skill_invocation_sources: pyList(sources),
    skills_used_breakdown: pyDict(counts),
  };
}

// What MLflow's autolog shows for one entry, per the hook's docstring (lines 7 to 13).
function autologSpans(entry) {
  const c = entry.message.content;
  if (Array.isArray(c)) {
    return c.filter((p) => p.type === 'tool_use').map((p) => ({ span: `tool_${p.name}`, note: p.name === 'Skill' ? 'name only inside the input' : '' }));
  }
  const m = /<command-name>([^<]+)<\/command-name>/.exec(c);
  return m ? [{ span: 'no span', note: strip(m[1]), none: true }] : [];
}

/** A transcript line as authored ({"content": ...} or a tool_use part) to a transcript entry. */
function entryOf(code) {
  try {
    const obj = JSON.parse(code);
    if (typeof obj.content === 'string') return { message: { content: obj.content } };
    if (obj.type) return { message: { content: [obj] } };
  } catch { /* not JSON */ }
  return null;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const frame = slot('lab skl');
  const left = slot('lab__left');
  const right = slot('lab__right');
  const data = slot('skl-data');
  let caption = null;
  let lineList = null;
  let spansEl = null;
  let tagsEl = null;
  let noteEl = null;
  all.forEach((cells, i) => {
    const [a] = cells;
    if (i === 0) {
      const bar = slot('lab__bar', [...a.children]);
      plainLinks(bar);
      frame.append(bar);
    } else if (a.querySelector('ul li code') && !lineList && a.querySelector('ul li strong')) {
      [...a.children].forEach((el) => {
        if (el.matches('ul')) {
          lineList = el;
          left.append(slot('skl-lines', [el]));
        } else left.append(slot('lab__label', [el]));
      });
    } else if (a.querySelector('pre')) {
      [...a.children].forEach((el) => {
        if (el.matches('ul')) {
          spansEl = el;
          right.append(slot('skl-spans', [el]));
        } else if (el.matches('pre')) {
          tagsEl = el.querySelector('code') || el;
          right.append(slot('skl-tags', [el]));
        } else if (el.matches('p') && spansEl && tagsEl) {
          noteEl = el;
          const note = slot('skl-note', [el]);
          note.setAttribute('aria-live', 'polite');
          right.append(note);
        } else right.append(slot('lab__label', [el]));
      });
    } else if (/^built-in/i.test(txt(a))) data.append(...a.children);
    else caption = a;
  });
  frame.append(slot('lab__grid', [left, right]), data);
  if (caption) frame.append(slot('x-caption skl-caption', [...caption.children]));
  block.replaceChildren(frame);
  if (!lineList || !spansEl || !tagsEl || !noteEl) return;

  const builtinText = (/built-in[^:]*:\s*(.+)$/i.exec(txt(data)) || [])[1] || '';
  const BUILTIN = new Set(builtinText.split(/[\s,]+/).filter(Boolean));
  const lines = [...lineList.children].map((li) => {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = true;
    box.setAttribute('aria-label', txt(li.querySelector('strong')) || txt(li));
    li.prepend(box);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      box.checked = !box.checked;
      box.dispatchEvent(new Event('change'));
    });
    return { li, box, entry: entryOf(txt(li.querySelector('code'))) };
  });
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function render(initial) {
    lines.forEach((l) => l.li.toggleAttribute('data-off', !l.box.checked));
    const picked = lines.filter((l) => l.box.checked && l.entry).map((l) => l.entry);
    const spans = picked.flatMap(autologSpans);
    if (initial && spansEl.children.length === spans.length) {
      // the authored list is the all-lines result: keep it, mark the lines with no span
      [...spansEl.children].forEach((li, i) => li.classList.toggle('is-none', !!spans[i].none));
    } else {
      spansEl.replaceChildren(...(spans.length ? spans : [{ span: 'no spans', none: true }]).map((s) => {
        const li = el('li', s.none ? 'is-none' : '');
        li.append(el('code', '', s.span));
        if (s.note) li.append(` ${s.note}`);
        return li;
      }));
    }

    const inv = extractInvocations(picked, BUILTIN);
    if (!inv.length) {
      // main(), lines 189 to 192: nothing found, so no tags are written.
      tagsEl.textContent = 'no tags written\n(session has no skill invocations)';
    } else {
      const tags = buildTags(inv);
      tagsEl.replaceChildren(...Object.keys(tags).flatMap((k, i) => [i ? '\n' : '', el('span', 'k', k), `\n  ${tags[k]}`]));
    }
    const dropped = picked.filter((e) => typeof e.message.content === 'string' && /<command-name>\/?(compact)<\/command-name>/.test(e.message.content)).length;
    const bash = picked.some((e) => Array.isArray(e.message.content) && e.message.content[0].name === 'Bash');
    const notes = [];
    if (dropped) notes.push(['Built-in commands like ', el('code', '', '/compact'), ' are dropped.']);
    if (bash) notes.push(['The Bash call is a tool, not a skill.']);
    if (!notes.length) notes.push(['Every picked line is a skill call.']);
    const named = new Set(inv.map((i) => i.skill)).size;
    const lead = named
      ? `MLflow alone names none of the ${named}${named === 1 ? ' skill' : ' skills'}. The hook tags ${named === 1 ? 'it' : named === 2 ? 'both' : `all ${named}`} on the trace.`
      : 'No skill calls in this session, so the hook writes no tags.';
    noteEl.replaceChildren(el('strong', '', lead), ...notes.flatMap((n) => [' ', ...n]));
  }
  lines.forEach((l) => l.box.addEventListener('change', () => render(false)));
  block.classList.add('is-live');
  render(true);
}
