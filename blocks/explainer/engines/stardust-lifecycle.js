/**
 * Explainer engine `stardust-lifecycle`: the page lifecycle lab of "Adobe Stardust explained".
 * The page states and rules of Stardust's reference/state-machine.md, seeded with pages of a
 * real stardust/state.json. Pick a page, press the steps in order: each step moves the page one
 * state forward or is refused, and the page's state.json entry follows.
 *
 * Rows, classified by content:
 * - the bar: a label paragraph, then the source link paragraph;
 * - left | right:
 *   left = the pick label, an ordered list of the pages (label, then the status in italics, in
 *   the seed's order), the note on the pages left out;
 *   right = the states list's name (a paragraph, read by assistive tech), an ordered list of the
 *   states in order (bold state, then who sets it; the fourth is the human gate), the steps
 *   label, a list of the six controls in this order: direct, prototype, approve, migrate, the
 *   hands-off switch, reset; the verdict shown before any step; the selected page's state.json
 *   entry as a code block (its slug picks the page selected first);
 * - the seed: a code block, the pages' state.json entries as a JSON array, in the pages' order;
 * - the messages: an ordered list, in this order (a bold lead is colored as a refusal or a
 *   success; {status} and {path} are the selected page's): 1 direct refused, 2 directed,
 *   3 prototype needs a direction, 4 prototype past approval, 5 prototype waiting, 6 prototyped
 *   and approved by the agent, 7 prototyped, 8 nothing to approve, 9 already {status},
 *   10 approved, 11 migrate refused, 12 migrated, 13 selected, 14 added for a page a person
 *   approved, 15 hands-off on, 16 hands-off off, 17 reset, 18 the line the state.json view
 *   starts with in hands-off mode.
 *
 * Steps taken here are dated today; a prototype is written to
 * stardust/prototypes/<slug>-proposed.html and a migrated page to stardust/migrated/<slug>.html.
 *
 * @ew-exempt the state.json code block and the page statuses - derived, rewritten by the engine
 * @ew-exempt the seed and the messages - data behind the verdict and the state.json view
 */

const NO = [0, 2, 3, 7, 10];
const OK = [1, 5, 6, 9, 11];

function hostKeys(el, fn) {
  el.tabIndex = 0;
  el.addEventListener('click', fn);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  });
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const frame = document.createElement('figure');
  frame.className = 'lab sdl';
  const data = slot('sdl__data');
  const parts = {};

  all.forEach((cells) => {
    if (cells.length > 1) {
      const [l, r] = cells;
      const left = slot('lab__left');
      [...l.children].forEach((el) => {
        if (el.matches('ol, ul')) {
          parts.pages = el;
          left.append(slot('sdl__pages', [el]));
        } else if (!parts.pages) left.append(slot('lab__label', [el]));
        else left.append(slot('sdl__more', [el]));
      });
      const right = slot('lab__right');
      const actions = slot('sdl__actions');
      const verdict = slot('verdict sdl__msg');
      verdict.setAttribute('aria-live', 'polite');
      [...r.children].forEach((el) => {
        if (el.matches('pre')) {
          parts.json = el.querySelector('code') || el;
          right.append(slot('json sdl__json', [el]));
        } else if (el.matches('ol, ul') && !parts.flow) {
          parts.flow = el;
          right.append(slot('sdl__flow', [el]));
        } else if (el.matches('ol, ul')) {
          parts.acts = el;
          actions.append(slot('sdl__ctls', [el]));
        } else if (!parts.flow) {
          parts.name = el;
          right.append(slot('sdl__name', [el]));
        } else if (!parts.acts) {
          actions.append(slot('lab__label sdl__steplabel', [el]));
          right.append(actions);
        } else {
          parts.static = slot('sdl__static', [el]);
          verdict.append(parts.static);
        }
      });
      if (!actions.parentElement) right.append(actions);
      parts.say = slot('sdl__say');
      verdict.append(parts.say);
      right.insertBefore(verdict, right.querySelector('.sdl__json'));
      frame.append(slot('lab__grid', [left, right]));
    } else {
      const cell = cells[0];
      if (!cell) return;
      const kids = [...cell.children];
      if (kids.length && kids.every((el) => el.matches('pre'))) {
        [parts.seed] = kids;
        data.append(...kids);
      } else if (kids.length && kids.every((el) => el.matches('ol, ul'))) {
        [parts.msgs] = kids;
        data.append(...kids);
      } else {
        const bar = slot('lab__bar', kids);
        plainLinks(bar);
        frame.prepend(bar);
      }
    }
  });
  frame.append(data);
  block.replaceChildren(frame);

  let seed;
  try {
    seed = JSON.parse(parts.seed.textContent);
  } catch (e) {
    return;
  }
  if (!parts.pages || !parts.flow || !parts.acts || !parts.json || !Array.isArray(seed)) return;

  const msgs = parts.msgs ? [...parts.msgs.children] : [];
  const flow = [...parts.flow.children];
  const order = flow.map((li) => (li.querySelector('strong, b') || li).textContent.trim());
  const [EXTRACTED, DIRECTED, PROTOTYPED, APPROVED, MIGRATED] = order;
  if (flow[3]) flow[3].classList.add('is-gate');
  if (parts.name) parts.flow.setAttribute('aria-label', parts.name.textContent.trim());

  const pageEls = [...parts.pages.children];
  parts.pages.setAttribute('role', 'none');
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const seedPages = () => seed.map(clone);
  let pages = seedPages();
  let first;
  try {
    first = JSON.parse(parts.json.textContent).slug;
  } catch (e) {
    first = null;
  }
  const firstIndex = () => Math.max(0, pages.findIndex((p) => p.slug === first));
  let current = firstIndex();
  let handsOff = false;
  const today = () => new Date().toISOString().slice(0, 10);

  // A message: the authored item's content, copied, with the page's values filled in.
  const message = (i, vals = {}) => {
    const src = msgs[i];
    if (!src) return [];
    const nodes = [...src.childNodes].map((n) => n.cloneNode(true));
    const fill = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/\{(status|path)\}/g, (m, k) => (vals[k] ?? m));
      } else node.childNodes.forEach(fill);
    };
    nodes.forEach(fill);
    const lead = nodes.find((n) => n.nodeType === Node.ELEMENT_NODE && n.matches('strong, b'));
    if (lead && NO.includes(i)) lead.classList.add('no');
    if (lead && OK.includes(i)) lead.classList.add('ok');
    return nodes;
  };
  const say = (...groups) => {
    const p = document.createElement('p');
    groups.forEach((g, i) => {
      if (i) p.append(' ');
      p.append(...g);
    });
    parts.say.replaceChildren(p);
    if (parts.static) parts.static.hidden = true;
  };

  const render = () => {
    pageEls.forEach((li, i) => {
      const pg = pages[i];
      if (!pg) return;
      li.setAttribute('aria-pressed', String(i === current));
      const st = li.querySelector('em, i');
      if (st) {
        st.textContent = pg.status;
        st.dataset.st = pg.status;
      }
    });
    const p = pages[current];
    const at = order.indexOf(p.status);
    flow.forEach((li, i) => {
      li.classList.toggle('is-done', i < at);
      li.classList.toggle('is-now', i === at);
    });
    const view = {
      slug: p.slug, path: p.path, status: p.status, prototypePath: p.prototypePath, migratedPath: p.migratedPath,
    };
    if (p.history) view.history = p.history;
    let out = JSON.stringify(view, null, 2);
    if (handsOff && msgs[17]) out = `${msgs[17].textContent.trim()}\n${out}`;
    parts.json.textContent = out;
    if (parts.hands) parts.hands.setAttribute('aria-checked', String(handsOff));
  };

  const push = (p, entry) => { p.history = (p.history || []).concat([entry]); };

  const act = (name) => {
    const p = pages[current];
    const s = p.status;
    const i = order.indexOf(s);
    const vals = { status: s, path: p.path };
    if (name === 'direct') {
      if (s !== EXTRACTED) return say(message(0, vals));
      p.status = DIRECTED;
      push(p, { status: DIRECTED, at: today() });
      return say(message(1, vals));
    }
    if (name === 'prototype') {
      if (s === EXTRACTED) return say(message(2, vals));
      if (i > order.indexOf(PROTOTYPED)) return say(message(3, vals));
      if (s === PROTOTYPED) return say(message(4, vals));
      p.status = PROTOTYPED;
      p.prototypePath = `stardust/prototypes/${p.slug}-proposed.html`;
      push(p, { status: PROTOTYPED, at: today() });
      if (handsOff) {
        p.status = APPROVED;
        push(p, { status: APPROVED, at: today(), approvedBy: 'hands-off' });
        return say(message(5, vals));
      }
      return say(message(6, vals));
    }
    if (name === 'approve') {
      if (s === EXTRACTED || s === DIRECTED) return say(message(7, vals));
      if (s !== PROTOTYPED) return say(message(8, vals));
      p.status = APPROVED;
      push(p, { status: APPROVED, at: today() });
      return say(message(9, vals));
    }
    if (name === 'migrate') {
      if (s === MIGRATED) return say(message(8, vals));
      if (s !== APPROVED) return say(message(10, vals));
      p.status = MIGRATED;
      p.migratedPath = `stardust/migrated/${p.slug}.html`;
      push(p, { status: MIGRATED, at: today() });
      return say(message(11, vals));
    }
    return null;
  };

  pageEls.forEach((li, i) => {
    li.setAttribute('role', 'button');
    hostKeys(li, () => {
      current = i;
      render();
      const p = pages[current];
      const groups = [message(12, { status: p.status, path: p.path })];
      if (p.history && p.history[0] && p.history[0].by) groups.push(message(13));
      say(...groups);
    });
  });

  const names = ['direct', 'prototype', 'approve', 'migrate', 'hands', 'reset'];
  parts.acts.setAttribute('role', 'none');
  [...parts.acts.children].forEach((li, i) => {
    const name = names[i];
    li.dataset.act = name || '';
    if (name === 'hands') {
      li.setAttribute('role', 'switch');
      parts.hands = li;
      hostKeys(li, () => {
        handsOff = !handsOff;
        render();
        say(message(handsOff ? 14 : 15));
      });
    } else if (name === 'reset') {
      li.setAttribute('role', 'button');
      hostKeys(li, () => {
        pages = seedPages();
        handsOff = false;
        current = firstIndex();
        render();
        say(message(16));
      });
    } else if (name) {
      li.setAttribute('role', 'button');
      hostKeys(li, () => {
        act(name);
        render();
      });
    }
  });

  frame.classList.add('is-live');
  render();
}
