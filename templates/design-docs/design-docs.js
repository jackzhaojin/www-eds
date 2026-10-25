/*
 * Design docs template (metadata "template: design-docs"): the design system v3 docs page,
 * built from the real blocks, so each story is a live block instance and the docs cannot
 * drift from the code.
 *
 * Content shape, all authored in Experience Workspace (section metadata):
 * - style outline: the "On this page" outline, the left rail from 1024px (a label paragraph,
 *   then a nested list of #links);
 * - id <x>, style docs: a docs section starts (Overview, Color ...). The first one opens with
 *   the page head: the h1, the byline paragraph, the summary paragraph;
 * - id <c-x>, style component: a component starts. Its h3 followed by a paragraph that reads
 *   stable, beta or deprecated is the component head with its status chip;
 * - style story (and row, for a wrapping row of items): a story frame; the first paragraph is
 *   the story label, the rest is the live block or default content it shows. Section
 *   metadata theme (dark or light) forces the frame's theme: v3's [data-theme] token
 *   selectors re-theme the subtree, so nothing else is needed;
 * - style <band words>, in-story: a section band shown inside the story frame before it (the
 *   bands keep the site's own band styles, so the story is the real band);
 * - demo <word>: a docs-only demo drawn from the authored text (swatches, specimens, space,
 *   radius, shadow, motion, icons, grid-2, grid-3, grid-4, grid-auto, skip-link, chips, proof,
 *   embed, theme-control);
 * - check contrast: the contrast table, re-verified in this browser against the live tokens;
 * - items <look, look ...>: one docs-only look per paragraph of the section, in order: kicker,
 *   kicker-accent, kicker-rule, note, mono, mono-lg, button, chip-plain, page-title,
 *   page-title-display, byline, summary, positioning, period, lead, row-label, chip, pressed
 *   (the v3 kicker, page head, icon samples, filter bar); the list has no empty entries;
 * - labels <tag: label | tag: label>: the source's aria-labels, each on a wrapper of that tag
 *   (section, nav, div, dl, or a role word: separator, group) around the story's content;
 * - band words on a section: a topic or project accent (aem-ai, aem, agents, work, cyan, amber,
 *   leaf, bronze, mint, rose), dots, milestone, flagship, feature (the inverse panel), and
 *   cols-2 on a story (its blocks side by side);
 * - any other section continues the docs section or component before it.
 *
 * Content rules: a "Do" paragraph and a "Don't" paragraph, each followed by its text, are the
 * do and don't pair; a paragraph right before a data table is its caption.
 *
 * Sections stay direct children of main (the band styles key off main > .section): main is a
 * grid, the outline spans every row, and each story frame is a decorative grid item behind the
 * rows of its sections. Every authored element is moved, never rebuilt; wrappers carry the
 * layout classes.
 */

const STATUS = /^(stable|beta|deprecated|flagship|upcoming|delivered)$/i;
const TOPICS = {
  'AEM + AI': 'aem-ai', AEM: 'aem', 'Adobe AEM and EDS': 'aem', 'AI Agents': 'agents', 'Working with AI': 'work',
};
const FORMATS = ['video', 'article', 'post'];

function wrap(el, className, tag = 'div') {
  const box = document.createElement(tag);
  box.className = className;
  el.before(box);
  box.append(el);
  return box;
}

const text = (el) => (el ? el.textContent.trim() : '');
const words = (section) => section.className.split(/\s+/);

/** The outline: the label paragraph and the list move into a labelled navigation landmark. */
function decorateOutline(section) {
  const wrapper = section.querySelector('.default-content-wrapper');
  if (!wrapper) return;
  const nav = document.createElement('nav');
  nav.className = 'ds-outline';
  nav.setAttribute('aria-label', text(wrapper.querySelector('p')) || 'On this page');
  wrapper.before(nav);
  nav.append(wrapper);
  const label = wrapper.querySelector(':scope > p');
  if (label) wrap(label, 'ds-kicker');
  // A nested list renders loose (li > p); its links are outline links, not text links.
  wrapper.querySelectorAll('li .cta-slot').forEach((slot) => {
    slot.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper'));
    slot.querySelectorAll('a').forEach((a) => a.classList.remove('text-link'));
    slot.replaceWith(...slot.children);
  });
}

/** The page head: the h1, then the byline and summary paragraphs. */
function decorateHead(section) {
  const h1 = section.querySelector('h1');
  if (!h1) return;
  const byline = h1.nextElementSibling;
  if (byline && byline.tagName === 'P') {
    const summary = byline.nextElementSibling;
    wrap(byline, 'ds-byline');
    if (summary && summary.tagName === 'P') wrap(summary, 'ds-summary');
  }
}

/** A component's h3 and its status paragraph become the component head. */
function decorateComponentHead(section) {
  const h3 = section.querySelector('.default-content-wrapper > h3');
  if (!h3) return;
  const status = h3.nextElementSibling;
  const head = wrap(h3, 'ds-component-head');
  if (status && status.tagName === 'P' && STATUS.test(text(status))) {
    const chip = wrap(status, 'ds-status');
    chip.dataset.status = text(status).toLowerCase();
    head.append(chip);
  }
}

/** "Do" + text, "Don't" + text: the do and don't pair. */
function decorateDoDont(wrapper) {
  [...wrapper.querySelectorAll(':scope > p')].forEach((p) => {
    if (text(p) !== 'Do' || !p.isConnected) return;
    const doText = p.nextElementSibling;
    const dont = doText && doText.nextElementSibling;
    const dontText = dont && dont.nextElementSibling;
    if (!doText || text(dont) !== 'Don\'t' || !dontText) return;
    const pair = document.createElement('div');
    pair.className = 'ds-dodont';
    p.before(pair);
    [[p, doText, 'do'], [dont, dontText, 'dont']].forEach(([lab, body, kind]) => {
      const item = document.createElement('div');
      item.className = `ds-dodont-item ds-${kind}`;
      pair.append(item);
      item.append(lab, body);
      wrap(lab, 'ds-kicker');
    });
  });
}

/** A paragraph that ends a default-content wrapper right before a data table: its caption. */
function decorateCaptions(section) {
  section.querySelectorAll('.data-table-wrapper').forEach((tableWrapper) => {
    const prev = tableWrapper.previousElementSibling;
    if (!prev || !prev.classList.contains('default-content-wrapper')) return;
    const last = prev.lastElementChild;
    if (last && last.tagName === 'P' && !last.querySelector('a, strong')) wrap(last, 'ds-caption');
  });
}

/** A story's first paragraph is its label. */
function decorateStoryLabel(section) {
  const first = section.querySelector('.default-content-wrapper > p');
  const wrapper = first && first.parentElement;
  if (!first || wrapper.parentElement.firstElementChild !== wrapper) return;
  if (wrapper.firstElementChild !== first) return;
  wrap(first, 'ds-story-label');
}

// ------------------------------------------------------------------ demos
const SPLIT = (li) => {
  const br = li.querySelector('br');
  if (!br) return;
  const name = document.createElement('span');
  name.className = 'ds-swatch-name';
  const value = document.createElement('span');
  value.className = 'ds-swatch-value';
  while (li.firstChild && li.firstChild !== br) name.append(li.firstChild);
  while (br.nextSibling) value.append(br.nextSibling);
  li.prepend(name);
  li.append(value);
};

/**
 * A docs table cell that holds only a status word (stable, beta) shows it as the v3 status
 * chip, once the table block has built its cells.
 */
function decorateStatusCells(section) {
  const tables = [...section.querySelectorAll('.data-table')];
  if (!tables.length) return;
  const run = (table) => table.querySelectorAll('td > p').forEach((p) => {
    const word = text(p);
    if (!STATUS.test(word) || p.parentElement.classList.contains('ds-status')) return;
    const chip = wrap(p, 'ds-status');
    chip.dataset.status = word.toLowerCase();
  });
  tables.forEach((table) => {
    if (table.dataset.blockStatus === 'loaded') {
      run(table);
      return;
    }
    const watch = new MutationObserver(() => {
      if (table.dataset.blockStatus !== 'loaded') return;
      watch.disconnect();
      run(table);
    });
    watch.observe(table, { attributes: true, attributeFilter: ['data-block-status'] });
  });
}

/** Link paragraphs leave their .cta-slot wrapper (a demo lays them out itself). */
function unslot(wrapper) {
  wrapper.querySelectorAll('.cta-slot').forEach((slot) => slot.replaceWith(...slot.children));
}

/** The paragraphs a story shows, after its label (link paragraphs included). */
function storyParagraphs(section) {
  return [...section.querySelectorAll('.default-content-wrapper p')]
    .filter((p) => !p.closest('.ds-story-label, .ds-caption'));
}

const DEMOS = {
  swatches(section) {
    section.querySelectorAll('li').forEach((li) => {
      SPLIT(li);
      const name = text(li.querySelector('.ds-swatch-name'));
      const chip = document.createElement('span');
      chip.className = 'ds-swatch-chip';
      chip.setAttribute('aria-hidden', 'true');
      if (/^--[a-z0-9-]+$/.test(name)) {
        chip.style.background = /night|tint-dark/.test(name)
          ? `linear-gradient(var(${name}), var(${name})), var(--palette-night-700)`
          : `var(${name})`;
      }
      li.prepend(chip);
    });
  },
  specimens(section) {
    const wrapper = section.querySelector('.default-content-wrapper');
    if (!wrapper) return;
    [...wrapper.querySelectorAll(':scope > p')].forEach((meta) => {
      if (!meta.firstElementChild || meta.firstElementChild.tagName !== 'STRONG') return;
      const sample = meta.nextElementSibling;
      if (!sample || sample.tagName !== 'P') return;
      const row = document.createElement('div');
      row.className = 'ds-specimen';
      meta.before(row);
      row.append(meta, sample);
      wrap(meta, 'ds-specimen-meta');
      const box = wrap(sample, 'ds-specimen-sample');
      const spec = text(meta);
      const token = (spec.match(/--text-[a-z0-9-]+/) || [])[0];
      if (token) box.style.setProperty('--ds-size', `var(${token})`);
      const lh = spec.match(/\/\s*([\d.]+)/);
      if (lh) box.style.setProperty('--ds-leading', lh[1]);
      const weight = spec.match(/(Playfair Display|Inter|JetBrains Mono) (\d{3})/);
      if (weight) box.style.setProperty('--ds-weight', weight[2]);
      if (/Playfair/.test(spec)) box.classList.add('display');
      if (/JetBrains/.test(spec)) box.classList.add(/uppercase/.test(spec) ? 'label' : 'mono');
      if (/--text-(body|small)/.test(spec) && !/body-lg/.test(spec)) box.classList.add('muted');
    });
  },
  space(section) {
    section.querySelectorAll('li').forEach((li) => {
      const token = (text(li).match(/--space-\d+/) || [])[0];
      const label = document.createElement('span');
      label.className = 'ds-space-label';
      label.append(...li.childNodes);
      li.append(label);
      const bar = document.createElement('i');
      bar.setAttribute('aria-hidden', 'true');
      if (token) bar.style.width = `calc(var(${token}) * 3)`;
      li.append(bar);
    });
  },
  radius(section) {
    section.querySelectorAll('li').forEach((li) => {
      const token = (text(li).match(/--radius-[a-z]+/) || [])[0];
      if (token) li.style.borderRadius = `var(${token})`;
    });
  },
  shadow(section) {
    section.querySelectorAll('li').forEach((li) => {
      const token = (text(li).match(/--shadow-\d/) || [])[0];
      li.style.boxShadow = token ? `var(${token})` : 'none';
    });
  },
  motion(section) {
    const p = section.querySelector('.default-content-wrapper > p');
    if (!p) return;
    const box = wrap(p, 'ds-motion');
    const mark = document.createElement('i');
    mark.setAttribute('aria-hidden', 'true');
    box.append(mark);
  },
  /* The global .skip-link look, shown in place: the link leaves the text-link slot. */
  'skip-link': (section) => {
    section.querySelectorAll('.cta-slot').forEach((slot) => {
      slot.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper'));
      slot.querySelectorAll('a').forEach((a) => {
        a.classList.remove('text-link');
        a.classList.add('skip-link');
      });
      slot.replaceWith(...slot.children);
    });
  },
  /* Chips: each paragraph is one chip; its kind comes from the site's words (the topics,
     formats and statuses), and a bold chip is the pressed one. */
  chips(section) {
    // link chips leave the text-link slot: a chip is its own look
    section.querySelectorAll('.default-content-wrapper .cta-slot').forEach((slot) => {
      slot.querySelectorAll('p').forEach((p) => p.classList.remove('text-link-wrapper'));
      slot.querySelectorAll('a').forEach((a) => a.classList.remove('text-link'));
      slot.replaceWith(...slot.children);
    });
    storyParagraphs(section).forEach((p) => {
      const item = p.closest('.ds-item');
      if (item && !item.matches('.ds-item-chip, .ds-item-pressed')) return;
      const chip = wrap(p, 'ds-chip');
      if (item && item.classList.contains('ds-item-pressed')) chip.dataset.pressed = 'true';
      const word = text(p);
      const kind = TOPICS[word] ? 'topic' : (FORMATS.includes(word.toLowerCase()) && 'format')
        || (STATUS.test(word) && 'status') || (word === 'All' ? 'default' : 'plain');
      chip.dataset.kind = kind;
      if (kind === 'topic') chip.dataset.topic = TOPICS[word];
      if (kind === 'format') chip.dataset.format = word.toLowerCase();
      if (kind === 'status') chip.dataset.status = word.toLowerCase();
      if (p.querySelector('strong')) chip.dataset.pressed = 'true';
    });
    // with row labels the chips are v3's filter bar: one bordered panel of rows
    const wrapper = section.querySelector('.default-content-wrapper');
    if (wrapper && wrapper.querySelector('.ds-item-row-label')) {
      const items = [...wrapper.children].filter((el) => !el.classList.contains('ds-story-label'));
      const bar = document.createElement('div');
      bar.className = 'ds-filter-bar';
      items[0].before(bar);
      let row = null;
      items.forEach((el) => {
        if (el.classList.contains('ds-row-break')) {
          el.remove();
          return;
        }
        if (!row || el.classList.contains('ds-item-row-label')) {
          row = document.createElement('div');
          row.className = 'ds-filter-row';
          bar.append(row);
        }
        row.append(el);
      });
      // the bar's All chips are plain (v3 chip--plain), without the dot
      bar.querySelectorAll('.ds-chip[data-kind="default"]').forEach((c) => { c.dataset.kind = 'plain'; });
    }
  },
  /* Proof list: per item, the bold label, the value (a link or text), a line break, the note. */
  proof(section) {
    section.querySelectorAll('li').forEach((li) => {
      const label = li.querySelector('strong');
      const br = li.querySelector('br');
      if (!label || !br) return;
      const value = document.createElement('span');
      value.className = 'ds-proof-value';
      const note = document.createElement('span');
      note.className = 'ds-proof-note';
      let node = label.nextSibling;
      while (node && node !== br) {
        const next = node.nextSibling;
        value.append(node);
        node = next;
      }
      while (br.nextSibling) note.append(br.nextSibling);
      const dd = document.createElement('span');
      dd.className = 'ds-proof-dd';
      dd.append(value, br, note);
      li.append(dd);
      wrap(label, 'ds-proof-label', 'span');
    });
  },
  /* Embed placeholder: the frame text in a 16:9 frame with the play mark, then the caption. */
  embed(section) {
    const [frameText, caption] = storyParagraphs(section);
    if (!frameText) return;
    const figure = document.createElement('div');
    figure.className = 'ds-embed';
    frameText.before(figure);
    const frame = document.createElement('div');
    frame.className = 'ds-embed-frame';
    const play = document.createElement('span');
    play.className = 'ds-embed-play';
    play.setAttribute('aria-hidden', 'true');
    frame.append(play, frameText);
    figure.append(frame);
    if (caption) figure.append(wrap(caption, 'ds-embed-caption'));
  },
  /* v3's example header: wordmark, Menu toggle, nav (links, then the tools: Book a talk and
     the theme control's labels). The story's labels name the nav and the control group. */
  'site-header': (section) => {
    const wrapper = section.querySelector('.default-content-wrapper');
    if (!wrapper) return;
    unslot(wrapper);
    const [wordmark, toggle, ...rest] = [...wrapper.children].filter((el) => !el.classList.contains('ds-story-label'));
    const list = rest.find((el) => el.tagName === 'UL');
    const after = rest.filter((el) => el !== list);
    const [cta, ...theme] = after;
    const labels = (section.dataset.labels || '').split(' | ').map((e) => e.slice(e.indexOf(':') + 1).trim().replace(/,(?=\S)/g, ', '));
    delete section.dataset.labels;
    const header = document.createElement('div');
    header.className = 'ds-site-header';
    const inner = document.createElement('div');
    inner.className = 'ds-site-header-inner';
    header.append(inner);
    wrapper.append(header);
    if (wordmark) {
      wordmark.classList.remove('text-link-wrapper');
      wordmark.querySelectorAll('a').forEach((a) => a.classList.remove('text-link'));
      inner.append(wrap(wordmark, 'ds-wordmark'));
    }
    if (toggle) {
      // the toggle's two words show one at a time (Menu, Close): each gets its own span
      const runs = [...toggle.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      runs.forEach((n) => {
        const frag = document.createDocumentFragment();
        n.textContent.trim().split(/\s+/).forEach((w, i) => {
          const span = document.createElement('span');
          span.className = i === 0 ? 'ds-toggle-open' : 'ds-toggle-close';
          span.textContent = w;
          frag.append(span, ' ');
        });
        n.replaceWith(frag);
      });
      inner.append(wrap(toggle, 'ds-nav-toggle'));
    }
    const nav = document.createElement('nav');
    nav.className = 'ds-site-nav';
    if (labels[0]) nav.setAttribute('aria-label', labels[0]);
    inner.append(nav);
    if (list) {
      list.querySelectorAll('strong a').forEach((a) => a.setAttribute('aria-current', 'page'));
      nav.append(wrap(list, 'ds-nav-links'));
    }
    const tools = document.createElement('div');
    tools.className = 'ds-nav-tools';
    nav.append(tools);
    if (cta) tools.append(wrap(cta, 'ds-nav-cta'));
    if (theme.length) {
      const group = document.createElement('div');
      group.className = 'ds-theme-labels';
      group.setAttribute('role', 'group');
      if (labels[1]) group.setAttribute('aria-label', labels[1]);
      theme.forEach((p) => group.append(p));
      tools.append(group);
    }
  },
  /* v3's full footer: heading and list per column, then the meta line. */
  'site-footer': (section) => {
    const wrapper = section.querySelector('.default-content-wrapper');
    if (!wrapper) return;
    const items = [...wrapper.children].filter((el) => !el.classList.contains('ds-story-label'));
    const footer = document.createElement('div');
    footer.className = 'ds-site-footer';
    const grid = document.createElement('div');
    grid.className = 'ds-footer-grid';
    const meta = document.createElement('div');
    meta.className = 'ds-footer-meta';
    footer.append(grid, meta);
    wrapper.append(footer);
    let col = null;
    items.forEach((el) => {
      if (/^H[2-4]$/.test(el.tagName)) {
        col = document.createElement('div');
        col.className = 'ds-footer-col';
        grid.append(col);
        col.append(el);
      } else if (el.tagName === 'UL' && col) col.append(el);
      else meta.append(el);
    });
  },
  /* v3's post, hub and project cards: section metadata kinds (one per card, in order) and
     cols. A card starts at its heading (a project card at the period line before it). */
  cards(section) {
    const wrapper = section.querySelector('.default-content-wrapper');
    if (!wrapper) return;
    unslot(wrapper);
    const kinds = (section.dataset.kinds || '').split(',').map((k) => k.trim());
    const els = [...wrapper.children].filter((el) => !el.classList.contains('ds-story-label'));
    const heads = els.map((el, i) => (/^H[2-4]$/.test(el.tagName) ? i : -1)).filter((i) => i >= 0);
    const grid = document.createElement('div');
    grid.className = 'ds-cards';
    grid.dataset.cols = section.dataset.cols || '2';
    wrapper.append(grid);
    heads.forEach((h, k) => {
      const [kind, topic, flag] = (kinds[k] || 'post').split(':');
      const start = kind === 'project' && h > 0 && !heads.includes(h - 1) ? h - 1 : h;
      const nextHead = heads[k + 1];
      const end = nextHead === undefined ? els.length
        : nextHead - ((kinds[k + 1] || '').startsWith('project') ? 1 : 0);
      const card = document.createElement('div');
      card.className = `ds-card ${kind}`;
      if (topic && topic !== 'flagship') card.dataset.topic = topic;
      if (flag === 'flagship' || topic === 'flagship') card.dataset.flagship = 'true';
      grid.append(card);
      const roles = {
        post: ['title', 'meta', 'excerpt', 'footer'],
        hub: ['title', 'label', 'counts'],
        project: ['period', 'title', 'excerpt', 'facts', 'link'],
      }[kind] || [];
      els.slice(start, end).forEach((el, i) => card.append(wrap(el, `ds-card-${roles[i] || 'body'}`)));
      card.querySelectorAll('strong').forEach((s) => {
        const word = text(s);
        if (TOPICS[word]) s.dataset.topic = TOPICS[word];
        else if (FORMATS.includes(word.toLowerCase())) s.dataset.format = word.toLowerCase();
        else if (STATUS.test(word)) s.dataset.status = word.toLowerCase();
      });
    });
  },
  /* The live theme control (scripts/theme-control.js): it changes the whole page. */
  'theme-control': (section) => {
    const wrapper = section.querySelector('.default-content-wrapper');
    if (!wrapper) return;
    const host = document.createElement('div');
    host.className = 'ds-theme-control';
    wrapper.append(host);
    import(`${window.hlx.codeBasePath}/scripts/theme-control.js`)
      .then(({ default: buildThemeControl }) => host.append(buildThemeControl()))
      .catch(() => host.remove());
  },
};

/** Section metadata "items": one look per paragraph, in order (a docs-only presentation). */
function decorateItems(section) {
  const looks = section.dataset.items.split(',').map((w) => w.trim().toLowerCase());
  storyParagraphs(section).forEach((p, i) => {
    const look = looks[i];
    if (!look || !/^[a-z][a-z0-9-]*$/.test(look)) return;
    const slot = p.closest('.cta-slot');
    if (slot) {
      p.classList.remove('text-link-wrapper');
      p.querySelectorAll('a').forEach((a) => a.classList.remove('text-link'));
    }
    const item = wrap(p, `ds-item ds-item-${look}`);
    // a topic chip after buttons joins their row (v3's p.cluster holds both)
    if (/^chip-(aem-ai|aem|agents|work)$/.test(look) && item.previousElementSibling?.classList.contains('cta-slot')) {
      item.previousElementSibling.append(item);
    }
    // a disabled v3 button is a link with no destination: an anchor without href hosts it
    if (/^btn-(primary|secondary|ghost)(-sm)?-disabled$/.test(look)) {
      const host = document.createElement('a');
      host.className = 'ds-disabled-link';
      host.setAttribute('aria-disabled', 'true');
      item.append(host);
      host.append(p);
    }
    // a row label after the first starts a new line of the row (the v3 filter bar's rows)
    if (look === 'row-label' && i > 0) {
      const br = document.createElement('div');
      br.className = 'ds-row-break';
      br.setAttribute('aria-hidden', 'true');
      item.before(br);
    }
  });
}

const LABEL_ROLES = { separator: 'div', group: 'div' };

/**
 * Section metadata "labels" (`tag: label | tag: label`): the source's aria-labels on the
 * story's own elements. Each becomes a wrapper of that tag (a role word is a div with that
 * role) around the story's content, which is moved in, never rebuilt: one per block when
 * the counts match, else nested around all of it. A band section labels its own content.
 */
function decorateLabels(section) {
  const entries = section.dataset.labels.split(' | ').map((e) => {
    const at = e.indexOf(':');
    // the pipeline writes comma lists without the space after the comma; labels keep theirs
    const label = e.slice(at + 1).trim().replace(/,(?=\S)/g, ', ');
    return { tag: e.slice(0, at).trim().toLowerCase(), label };
  }).filter(({ tag, label }) => label && /^(section|nav|div|dl|separator|group)$/.test(tag));
  if (!entries.length) return;
  const make = ({ tag, label }) => {
    const el = document.createElement(LABEL_ROLES[tag] || tag);
    if (LABEL_ROLES[tag]) el.setAttribute('role', tag);
    el.setAttribute('aria-label', label);
    el.className = 'ds-labelled';
    return el;
  };
  let targets;
  if (section.classList.contains('ds-story-part')) {
    // a band labels its own content once its blocks have run (a showcase moves the blocks
    // that follow it into itself first)
    const label = () => {
      const inner = section.querySelector(':scope > div');
      const nodes = inner ? [...inner.childNodes] : [];
      if (!nodes.length) return;
      const el = make(entries[0]);
      inner.append(el);
      el.append(...nodes);
    };
    if (section.dataset.sectionStatus === 'loaded') label();
    else {
      const watch = new MutationObserver(() => {
        if (section.dataset.sectionStatus !== 'loaded') return;
        watch.disconnect();
        label();
      });
      watch.observe(section, { attributes: true, attributeFilter: ['data-section-status'] });
    }
    return;
  }
  const wrappers = [...section.querySelectorAll(':scope > div:not(.default-content-wrapper)')];
  if (wrappers.length) targets = wrappers;
  else {
    const content = section.querySelector(':scope > .default-content-wrapper');
    targets = content ? [...content.children].filter((c) => !c.classList.contains('ds-story-label')) : [];
  }
  if (!targets.length) return;
  if (entries.length === targets.length) {
    targets.forEach((t, i) => {
      const el = make(entries[i]);
      t.before(el);
      el.append(t);
    });
    return;
  }
  let outer = null;
  let host = null;
  entries.forEach((entry) => {
    const el = make(entry);
    if (host) host.append(el);
    else outer = el;
    host = el;
  });
  targets[0].before(outer);
  host.append(...targets);
}

/** Icons (icons/<name>.svg) paint in the text color: the image becomes the icon's mask. */
function decorateIconMasks(main) {
  main.querySelectorAll('span.icon').forEach((span) => {
    const img = span.querySelector('img');
    if (img && img.getAttribute('src')) span.style.setProperty('--ds-icon', `url("${img.getAttribute('src')}")`);
  });
}

// ------------------------------------------------------------------ contrast check
function channels(color) {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { rgb: parts.slice(0, 3), a: parts.length > 3 ? parts[3] : 1 };
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const mixed = fg.rgb.map((c, i) => Math.round(fg.a * c + (1 - fg.a) * bg.rgb[i]));
  const [hi, lo] = [luminance(mixed), luminance(bg.rgb)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/** Re-checks the printed ratios against the live tokens, in a light and a dark probe. */
function checkContrast(section) {
  const table = section.querySelector('.data-table');
  const note = [...section.querySelectorAll('.default-content-wrapper > p')].pop();
  if (!table || !note) return;
  const run = () => {
    const rows = [...table.querySelectorAll('tbody tr')];
    if (!rows.length) return;
    // the result words read in the v3 .pass / .fail look (mono, uppercase, colored)
    table.querySelectorAll('td p').forEach((p) => {
      const word = text(p).toLowerCase();
      if (word === 'pass' || word === 'fail') wrap(p, `ds-result ${word}`);
    });
    const probe = (theme) => {
      const el = document.createElement('div');
      el.dataset.theme = theme;
      el.hidden = true;
      document.body.append(el);
      return el;
    };
    const frames = { light: probe('light'), dark: probe('dark') };
    const resolve = (frame, name) => {
      frame.style.color = `var(--color-${name})`;
      return channels(getComputedStyle(frame).color);
    };
    let ok = 0;
    let total = 0;
    rows.forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      const pair = text(cells[0]).match(/^(.+) on (.+)$/);
      if (!pair) return;
      [['light', cells[2]], ['dark', cells[4]]].forEach(([theme, cell]) => {
        if (!cell) return;
        const fg = resolve(frames[theme], pair[1]);
        const bg = resolve(frames[theme], pair[2]);
        if (!fg || !bg) return;
        total += 1;
        if (Math.abs(ratio(fg, bg) - parseFloat(text(cell))) < 0.02) ok += 1;
      });
    });
    Object.values(frames).forEach((el) => el.remove());
    if (!total) return;
    const result = document.createElement('span');
    result.className = 'ds-contrast-result';
    result.textContent = ` Re-verified in this browser: ${ok} of ${total} ratios match the printed values.`;
    note.append(result);
  };
  if (table.dataset.blockStatus === 'loaded') run();
  else {
    const watch = new MutationObserver(() => {
      if (table.dataset.blockStatus !== 'loaded') return;
      watch.disconnect();
      run();
    });
    watch.observe(table, { attributes: true, attributeFilter: ['data-block-status'] });
  }
}

// ------------------------------------------------------------------ layout
export default function decorate(main) {
  main.classList.add('ds-layout');
  const sections = [...main.querySelectorAll(':scope > .section')];
  let inComponent = false;
  let group = null;
  const groups = [];
  let row = 1;

  sections.forEach((section) => {
    const kind = words(section);
    if (kind.includes('outline')) {
      decorateOutline(section);
      section.classList.add('ds-outline-section');
      return;
    }
    row += 1;
    section.style.gridRow = String(row);
    // The section is the anchor; a heading id derived from the same text would repeat it.
    if (section.id) {
      section.querySelectorAll(`[id="${section.id}"]`).forEach((el) => el.removeAttribute('id'));
    }
    if (kind.includes('docs')) {
      inComponent = false;
      if (!main.querySelector('.ds-docs')) decorateHead(section);
    }
    if (kind.includes('docs')) section.classList.add('ds-docs');
    if (kind.includes('component')) {
      inComponent = true;
      section.classList.add('ds-component');
      decorateComponentHead(section);
    }
    if (inComponent) section.classList.add('ds-in-component');

    if (kind.includes('story')) {
      group = { sections: [section], row };
      groups.push(group);
      section.classList.add('ds-story');
      decorateStoryLabel(section);
    } else if (kind.includes('in-story') && group) {
      group.sections.push(section);
      section.classList.add('ds-story-part');
      if (!section.dataset.theme && group.sections[0].dataset.theme) {
        section.dataset.theme = group.sections[0].dataset.theme;
      }
    } else {
      group = null;
      section.classList.add('ds-flow');
    }

    section.querySelectorAll('.default-content-wrapper').forEach(decorateDoDont);
    decorateCaptions(section);
    if (section.dataset.items) decorateItems(section);
    const demo = section.dataset.demo && DEMOS[section.dataset.demo];
    if (demo) demo(section);
    if (section.dataset.check === 'contrast') checkContrast(section);
    decorateStatusCells(section);
    if (section.dataset.labels) decorateLabels(section);
  });

  main.style.setProperty('--ds-rows', String(row));
  decorateIconMasks(main);

  groups.forEach((g) => {
    const first = g.sections[0];
    const last = g.sections[g.sections.length - 1];
    const frame = document.createElement('div');
    frame.className = 'ds-frame';
    frame.setAttribute('aria-hidden', 'true');
    if (first.dataset.theme) frame.dataset.theme = first.dataset.theme;
    frame.style.gridRow = `${g.row} / ${g.row + g.sections.length}`;
    first.before(frame);
    first.classList.add('ds-story-first');
    last.classList.add('ds-story-last');
  });
}
