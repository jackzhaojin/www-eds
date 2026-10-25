/**
 * Explainer (freezeframe): the held-frames lab of "Playwright Stakeholder Demos". It runs the
 * rule of calculateFreezes() in demo/pipeline/merge-highlights-v2.mjs: walk the captions in
 * order, start each voice clip a little before its caption, keep a minimum gap between clips,
 * and hold the video on one frame whenever a clip would start too early. A slider models a
 * faster or slower voice as proportionally shorter or longer clips.
 *
 * Rows, read by content:
 * - bar: one cell, the label paragraph, then the source link paragraph (the first row);
 * - controls: two cells, the slider label (bold) | the reset control's label;
 * - tracks: two cells, each a list: the lane names (video, voice) | the legend (recorded
 *   video, held frame, voice clip);
 * - result: one cell, the summary paragraph and the ordered list of holds shown without
 *   JavaScript (with it, the engine draws both from the data in boxes of its own);
 * - settings: one cell, a list of "name: number" items: recorded (seconds of video), gap
 *   (minimum silence between clips), shift (seconds the voice starts before its caption);
 * - captions: one row per caption, three cells: caption time (s) | clip length (s) | text;
 * - caption: the last one-cell row, the figure caption.
 *
 * @variants freezeframe
 * @ew-exempt <ul> settings and the caption rows - data, never displayed; the result cell - the
 *   no-JavaScript fallback, hidden once the engine draws the live summary and holds
 */

const NUM = /^-?\d+(\.\d+)?$/;
const txt = (el) => (el ? el.textContent.trim() : '');

function classify(rows) {
  const parts = { captions: [] };
  rows.forEach((cells, i) => {
    const [a, b, c] = cells;
    if (cells.length === 3 && NUM.test(txt(a)) && NUM.test(txt(b))) {
      parts.captions.push({
        row: cells, start: +txt(a), clip: +txt(b), text: txt(c),
      });
    } else if (cells.length === 2 && a.querySelector('ul, ol') && b.querySelector('ul, ol')) {
      parts.tracks = cells;
    } else if (cells.length === 2) {
      parts.controls = cells;
    } else if (a && a.querySelector('ol')) {
      parts.result = a;
    } else if (a && a.querySelector('ul') && [...a.querySelectorAll('li')].every((li) => /:\s*-?\d/.test(li.textContent))) {
      parts.settings = a;
    } else if (a && i === 0 && a.querySelector('a')) {
      parts.bar = a;
    } else if (a) {
      parts.caption = a;
    }
  });
  return parts;
}

function settingsOf(cell) {
  const out = {};
  cell?.querySelectorAll('li').forEach((li) => {
    const m = /^\s*([\w -]+?)\s*:\s*(-?\d+(\.\d+)?)/.exec(li.textContent);
    if (m) out[m[1].toLowerCase()] = +m[2];
  });
  return out;
}

export default async function engine(block, { slot, rows, plainLinks }) {
  const parts = classify(rows(block));
  const frame = slot('lab ff');

  if (parts.bar) {
    const bar = slot('lab__bar', [...parts.bar.children]);
    plainLinks(bar);
    frame.append(bar);
  }

  const body = slot('ff-body');
  const data = slot('ff-data');
  frame.append(body);

  // controls: the slider and the reset control
  let speedIn = null;
  let speedOut = null;
  let reset = null;
  if (parts.controls) {
    const [labelCell, resetCell] = parts.controls;
    speedOut = document.createElement('output');
    speedOut.className = 'ff-out';
    const head = slot('ff-ctl-head', [...labelCell.children]);
    head.append(' ', speedOut);
    speedIn = document.createElement('input');
    speedIn.type = 'range';
    speedIn.min = '0.8';
    speedIn.max = '1.4';
    speedIn.step = '0.05';
    speedIn.value = '1';
    speedIn.setAttribute('aria-label', txt(labelCell) || 'Voice speed');
    reset = slot('ctl ff-reset', [...resetCell.children]);
    reset.setAttribute('role', 'button');
    reset.tabIndex = 0;
    body.append(slot('ff-controls', [slot('ff-ctl', [head, speedIn]), reset]));
  }

  // tracks: lane names beside the two tracks
  let videoTrack = null;
  let voiceTrack = null;
  if (parts.tracks) {
    const [names, legend] = parts.tracks;
    videoTrack = slot('ff-track');
    voiceTrack = slot('ff-track');
    const tracks = slot('ff-tracks', [slot('ff-names', [...names.children]), slot('ff-lanes', [videoTrack, voiceTrack])]);
    body.append(slot('ff-scroll', [tracks]), slot('ff-legend', [...legend.children]));
  }

  // result: the authored summary and holds list stay as the no-JavaScript fallback; the live
  // summary and list are drawn from the data into their own boxes.
  const summary = document.createElement('p');
  const list = document.createElement('ol');
  const live = [slot('ff-summary', [summary]), slot('ff-list', [list])];
  live[0].setAttribute('aria-live', 'polite');
  if (parts.result) body.append(slot('ff-static', [...parts.result.children]));

  if (parts.settings) data.append(...parts.settings.children);
  parts.captions.forEach((c) => data.append(...c.row.flatMap((cell) => [...cell.children])));
  frame.append(data);
  if (parts.caption) frame.append(slot('x-caption ff-caption', [...parts.caption.children]));
  block.replaceChildren(frame);

  const set = settingsOf(data);
  const RECORDED = set.recorded ?? 84;
  const MIN_GAP = set.gap ?? 0.3;
  const SHIFT = set.shift ?? -0.5;
  const CAPTIONS = parts.captions;
  if (!speedIn || !CAPTIONS.length || !videoTrack) return;
  const anchor = body.querySelector('.ff-static');
  if (anchor) anchor.before(...live);
  else body.append(...live);

  // Same walk as calculateFreezes(): videoShift grows with every freeze inserted.
  function calculateFreezes(speed) {
    let videoShift = 0;
    let prevEnd = -Infinity;
    const freezes = [];
    const clips = [];
    CAPTIONS.forEach(({ start: startSec, clip }, i) => {
      const dur = clip / speed;
      const visualNew = startSec + videoShift;
      let idealStart = visualNew + SHIFT;
      const earliest = prevEnd + MIN_GAP;
      if (idealStart < earliest) {
        const freezeDur = Math.ceil((earliest - idealStart) * 10) / 10; // round up to 0.1 s
        freezes.push({
          id: i + 1, originalTime: startSec, newTime: visualNew, duration: freezeDur,
        });
        videoShift += freezeDur;
        idealStart = earliest;
      }
      const start = Math.max(idealStart, 0);
      clips.push({ id: i + 1, start, dur });
      prevEnd = start + dur;
    });
    return {
      freezes, clips, total: Math.max(RECORDED + videoShift, prevEnd), held: videoShift,
    };
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  const seg = (cls, left, width, title) => {
    const span = document.createElement('span');
    span.className = cls;
    span.style.left = left;
    span.style.width = width;
    if (title) span.title = title;
    return span;
  };

  function render() {
    const speed = +speedIn.value;
    speedOut.textContent = speed === 1 ? '1.00x, the clips as recorded' : `${speed.toFixed(2)}x, clips ${speed > 1 ? 'shorter' : 'longer'}`;
    const {
      freezes, clips, total, held,
    } = calculateFreezes(speed);
    const pct = (t) => `${(t / total) * 100}%`;

    // Video track: normal segments between freezes, a held block at each freeze.
    const segs = [];
    let cursorNew = 0;
    let cursorOld = 0;
    freezes.forEach((f) => {
      const len = f.originalTime - cursorOld;
      segs.push(seg('ff-seg', pct(cursorNew), pct(len)));
      cursorNew += len;
      segs.push(seg('ff-seg ff-seg-hold', pct(cursorNew), pct(f.duration), `Held ${f.duration.toFixed(1)} s for caption ${f.id}`));
      cursorNew += f.duration;
      cursorOld = f.originalTime;
    });
    segs.push(seg('ff-seg', pct(cursorNew), pct(RECORDED - cursorOld)));
    videoTrack.replaceChildren(...segs);
    voiceTrack.replaceChildren(...clips.map((c) => {
      const span = seg('ff-clip', pct(c.start), pct(c.dur), `Clip ${c.id}: ${CAPTIONS[c.id - 1].text}`);
      span.textContent = String(c.id);
      return span;
    }));

    const lead = speed === 1 ? 'With the clips as recorded' : `At ${speed.toFixed(2)}x`;
    if (summary) {
      summary.textContent = freezes.length
        ? `${lead}, the merge holds the video ${freezes.length} ${freezes.length === 1 ? 'time' : 'times'}, ${held.toFixed(1)} s in total, so no clip talks over the next caption. The finished video runs about ${Math.round(total)} s, from about ${RECORDED} s recorded.`
        : `${lead}, every clip ends before the next caption, so the video never has to hold. It stays about ${RECORDED} s.`;
    }
    if (list) {
      list.replaceChildren(...freezes.map((f) => {
        const li = document.createElement('li');
        const t = document.createElement('span');
        t.className = 'ff-t';
        t.textContent = `${f.duration.toFixed(1)} s`;
        li.append(t, ` before caption ${f.id}, "${CAPTIONS[f.id - 1].text}", at ${fmt(f.originalTime)} in the recording`);
        return li;
      }));
    }
  }

  const doReset = () => {
    speedIn.value = '1';
    render();
  };
  speedIn.addEventListener('input', render);
  reset.addEventListener('click', doReset);
  reset.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    doReset();
  });
  block.classList.add('is-live');
  render();
}
