/**
 * Explainer engine "parser-lab": runs a model reply through a response processor and shows the
 * path it took (the STAR story generator article). parseAIResponse, parseAIResponseText,
 * validateStories and normalizeText are ported line for line from src/services/
 * responseProcessor.js in jackzhaojin/azure-star-generator at da712d5; the wrapping error text
 * comes from storyService.js and storyController.js at the same commit.
 *
 * Rows:
 * 1. the bar: a label paragraph | the source link paragraph;
 * 2. left | right, by content:
 *    left, in order: the replies label paragraph, the reply box label paragraph, the reply box's
 *    name for assistive tech, the note paragraph;
 *    right, in order: the steps label paragraph, the steps list (in the processor's order: cut to
 *    the brackets, JSON.parse, text fallback, validate), the takeaway shown after a reader's own
 *    edit;
 * 3. one row per example reply, three cells: its chip label | the reply as a code block | the
 *    takeaway. The reply whose label is bold is the one the lab opens on (else the first);
 * 4. three-cell rows without a code block: the table shown without JavaScript (the first row is
 *    its header);
 * 5. a last single-cell row is the caption.
 *
 * Behaviour: a chip loads its reply into an editable box; every change re-runs the processor.
 * The step states and messages, the HTTP status line and the parsed stories are derived.
 *
 * @variants parser-lab
 * @ew-exempt the replies' code blocks and takeaways, the reply box name - read by the engine into
 *   the reply box and the takeaway line
 */

// ---- ported from responseProcessor.js (da712d5) ----
function normalizeText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

function parseAIResponseText(responseText) {
  const stories = [];
  const chunks = responseText.split(/\n\s*\n/);
  for (let c = 0; c < chunks.length; c += 1) {
    const chunk = chunks[c];
    const situationMatch = chunk.match(/situation:?\s*(.*?)\s*(?=task:|$)/is);
    const taskMatch = chunk.match(/task:?\s*(.*?)\s*(?=action:|$)/is);
    const actionMatch = chunk.match(/action:?\s*(.*?)\s*(?=result:|$)/is);
    const resultMatch = chunk.match(/result:?\s*(.*)\s*$/is);
    if (situationMatch && taskMatch && actionMatch && resultMatch) {
      const actionText = actionMatch[1].trim();
      let actionItems = [];
      // eslint-disable-next-line no-useless-escape
      const bulletMatches = actionText.match(/(?:^|\n)[\s]*[•\-\*\d+\.\)]\s*(.*?)(?=(?:^|\n)[\s]*[•\-\*\d+\.\)]|$)/gs);
      if (bulletMatches && bulletMatches.length > 0) {
        // eslint-disable-next-line no-useless-escape
        actionItems = bulletMatches.map((bullet) => bullet.replace(/^[\s]*[•\-\*\d+\.\)]\s*/, '').trim());
      } else {
        // eslint-disable-next-line no-useless-escape
        actionItems = actionText.split(/[\.;]\s+/).filter((item) => item.trim().length > 0);
      }
      if (actionItems.length === 0) actionItems = [actionText];
      stories.push({
        situation: situationMatch[1].trim(),
        task: taskMatch[1].trim(),
        action: actionItems,
        result: resultMatch[1].trim(),
      });
    }
  }
  return stories;
}

function parseAIResponse(responseText, trace) {
  try {
    let jsonText = responseText;
    const jsonStartIndex = responseText.indexOf('[');
    const jsonEndIndex = responseText.lastIndexOf(']');
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      jsonText = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
      trace.extract = {
        start: jsonStartIndex,
        end: jsonEndIndex,
        trimmed: jsonStartIndex > 0 || jsonEndIndex < responseText.length - 1,
      };
    } else {
      trace.extract = null;
    }
    const stories = JSON.parse(jsonText);
    if (!Array.isArray(stories)) throw new Error('Response is not a valid array');
    trace.path = 'json';
    return stories;
  } catch (error) {
    trace.jsonError = error.message;
    trace.path = 'text';
    return parseAIResponseText(responseText);
  }
}

function validateStories(stories, trace) {
  trace.dropped = [];
  trace.converted = [];
  return stories.filter((story, i) => {
    const hasAllFields = story
      && typeof story === 'object'
      && typeof story.situation === 'string' && story.situation.trim() !== ''
      && typeof story.task === 'string' && story.task.trim() !== ''
      && story.result && typeof story.result === 'string' && story.result.trim() !== '';
    let validAction = false;
    if (Array.isArray(story.action)) {
      validAction = story.action.length > 0
        && story.action.every((item) => typeof item === 'string' && item.trim() !== '');
    } else if (typeof story.action === 'string' && story.action.trim() !== '') {
      story.action = [story.action];
      validAction = true;
      trace.converted.push(i + 1);
    }
    const keep = !!(hasAllFields && validAction);
    if (!keep) trace.dropped.push(i + 1);
    return keep;
  }).map((story) => ({
    situation: normalizeText(story.situation),
    task: normalizeText(story.task),
    action: Array.isArray(story.action) ? story.action.map(normalizeText) : [normalizeText(story.action)],
    result: normalizeText(story.result),
  }));
}

function processResponse(responseText, trace) {
  try {
    const stories = parseAIResponse(responseText, trace);
    if (!stories || stories.length === 0) throw new Error('No valid stories were parsed from the response');
    return validateStories(stories, trace);
  } catch (error) {
    throw new Error(`Failed to process AI response: ${error.message}`);
  }
}
// ---- end of port ----

// The full run, wrapped the way storyService.js and storyController.js wrap errors.
function run(text) {
  const trace = {};
  try {
    const stories = processResponse(text, trace);
    return {
      ok: true, status: 200, stories, trace,
    };
  } catch (e) {
    return {
      ok: false, status: 500, error: `Failed to generate stories: Story generation failed: ${e.message}`, trace,
    };
  }
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

export default async function engine(block, { slot, rows, plainLinks }) {
  const all = rows(block);
  const [barRow, bodyRow] = all;
  if (!barRow || !bodyRow || bodyRow.length < 2) return;
  plainLinks(block);
  const rest = all.slice(2);
  const replyRows = rest.filter((r) => r.length >= 3 && r[1].querySelector('pre'));
  const tableRows = rest.filter((r) => r.length > 1 && !replyRows.includes(r));
  const captionRow = rest.find((r) => r.length === 1);

  const fig = document.createElement('figure');
  fig.className = 'pl';
  const bar = slot('pl__bar', barRow.flatMap((c) => [...c.children]));

  // replies: label, text, takeaway (read before the authored elements move)
  const replies = replyRows.map((cells) => ({
    host: cells[0],
    text: cells[1].querySelector('pre').textContent.replace(/^\n/, ''),
    takeaway: cells[2] ? cells[2].textContent.trim() : '',
    opening: !!cells[0].querySelector('strong, b'),
  }));

  // left
  const [pickP, boxP, nameP, noteP] = [...bodyRow[0].children].filter((n) => n.tagName === 'P');
  const left = document.createElement('div');
  if (pickP) left.append(slot('pl__label', [pickP]));
  const chips = slot('chips');
  chips.setAttribute('role', 'radiogroup');
  if (pickP) chips.setAttribute('aria-label', pickP.textContent.trim());
  const hosts = replies.map((r, i) => {
    const host = slot('pl__chip', [...r.host.children]);
    host.setAttribute('role', 'radio');
    host.setAttribute('aria-checked', 'false');
    host.dataset.pick = String(i);
    return host;
  });
  chips.append(...hosts);
  left.append(chips);
  if (boxP) left.append(slot('pl__label', [boxP]));
  const input = document.createElement('textarea');
  input.spellcheck = false;
  if (nameP) input.setAttribute('aria-label', nameP.textContent.trim());
  left.append(input);
  if (noteP) left.append(slot('pl__note', [noteP]));

  // right
  const rightNodes = [...bodyRow[1].children];
  const rightParas = rightNodes.filter((n) => n.tagName === 'P');
  const stepsList = rightNodes.find((n) => n.matches('ul, ol'));
  const [stepsLabel, editP] = rightParas;
  const editTakeaway = editP ? editP.textContent.trim() : '';
  const right = document.createElement('div');
  if (stepsLabel) right.append(slot('pl__label', [stepsLabel]));
  const steps = {};
  if (stepsList) {
    stepsList.setAttribute('aria-live', 'polite');
    ['extract', 'json', 'text', 'validate'].forEach((k, i) => {
      const li = stepsList.children[i];
      if (!li) return;
      li.dataset.step = k;
      li.dataset.state = 'off';
      const state = el('span', 'ps__state');
      const msg = el('span', 'ps__msg');
      li.append(state, msg);
      steps[k] = { li, msg };
    });
    right.append(slot('psteps', [stepsList]));
  }
  const status = el('p', 'pl__status');
  status.setAttribute('aria-live', 'polite');
  const takeawayEl = el('p', 'pl__takeaway');
  const out = el('div', 'pl__out');
  right.append(status, takeawayEl, out);

  // the no-JavaScript table
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  tableRows.forEach((cells, r) => {
    const tr = document.createElement('tr');
    cells.forEach((c) => {
      const cell = document.createElement(r ? 'td' : 'th');
      cell.append(...c.childNodes);
      tr.append(cell);
    });
    (r ? tbody : thead).append(tr);
  });
  table.append(thead, tbody);

  fig.append(bar, slot('pl__grid', [left, right]), slot('pl__static', [table]));
  if (captionRow) {
    const cap = document.createElement('figcaption');
    cap.append(...captionRow[0].children);
    fig.append(cap);
  }
  const sources = [nameP, editP, ...replyRows.flatMap((cells) => cells.slice(1).flatMap((c) => [...c.children]))].filter(Boolean);
  fig.append(slot('pl__source', sources));
  block.replaceChildren(fig);

  const setStep = (k, state, msg) => {
    if (!steps[k]) return;
    steps[k].li.dataset.state = state;
    steps[k].msg.textContent = msg;
  };

  function render() {
    const r = run(input.value);
    const t = r.trace;
    if (t.extract) {
      setStep('extract', t.extract.trimmed ? 'pass' : 'skip', t.extract.trimmed
        ? `Cut characters ${t.extract.start} to ${t.extract.end}, from the first [ to the last ].`
        : 'The reply already starts with [ and ends with ].');
    } else {
      setStep('extract', 'skip', 'No [ ... ] pair found, so the whole reply goes to JSON.parse.');
    }
    if (t.path === 'json') {
      setStep('json', 'pass', `Parsed an array of ${r.ok ? t.dropped.length + r.stories.length : 0} item(s).`);
      setStep('text', 'off', 'Not needed.');
    } else {
      setStep('json', 'fail', t.jsonError);
      const found = r.ok ? r.stories.length + t.dropped.length : 0;
      setStep('text', found ? 'pass' : 'fail', found
        ? `Found ${found} block(s) with Situation, Task, Action and Result.`
        : 'No block had all four labels.');
    }
    if (r.ok) {
      let m = `Kept ${r.stories.length}.`;
      if (t.dropped.length) m += ` Dropped story ${t.dropped.join(', ')}: a field is missing or empty.`;
      if (t.converted.length) m += ` Story ${t.converted.join(', ')} had a string action, wrapped into a one-item list.`;
      setStep('validate', t.dropped.length ? 'warn' : 'pass', m);
    } else if (t.path) {
      setStep('validate', 'fail', 'Nothing to validate.');
    }
    status.textContent = r.ok
      ? `HTTP 200 · success: true · ${r.stories.length} stor${r.stories.length === 1 ? 'y' : 'ies'}`
      : 'HTTP 500 · success: false';
    status.dataset.ok = r.ok ? 'yes' : 'no';
    if (r.ok) {
      out.replaceChildren(...r.stories.map((s, i) => {
        const story = el('div', 'pl__story');
        const line = (label, value) => {
          const p = el('p');
          p.append(el('b', '', label), ` ${value}`);
          return p;
        };
        const ul = el('ul');
        s.action.forEach((a) => ul.append(el('li', '', a)));
        const action = el('p');
        action.append(el('b', '', 'Action'));
        story.append(el('p', 'pl__n', `Story ${i + 1}`), line('Situation', s.situation), line('Task', s.task), action, ul, line('Result', s.result));
        return story;
      }));
    } else {
      out.replaceChildren(el('p', 'pl__err', r.error));
    }
  }

  function pick(i) {
    hosts.forEach((h, j) => {
      h.setAttribute('aria-checked', String(i === j));
      h.tabIndex = i === j ? 0 : -1;
    });
    input.value = replies[i].text;
    render();
    takeawayEl.textContent = replies[i].takeaway;
  }

  hosts.forEach((h, i) => {
    h.addEventListener('click', () => pick(i));
    h.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = (i + (e.key === 'ArrowRight' ? 1 : hosts.length - 1)) % hosts.length;
        pick(n);
        hosts[n].focus();
        e.preventDefault();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick(i);
      }
    });
  });
  let pending = 0;
  input.addEventListener('input', () => {
    hosts.forEach((h) => h.setAttribute('aria-checked', 'false'));
    takeawayEl.textContent = editTakeaway;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(render);
  });
  fig.classList.add('is-live');
  if (replies.length) pick(Math.max(0, replies.findIndex((r) => r.opening)));
}
