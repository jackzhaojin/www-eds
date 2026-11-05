/**
 * Scene engine `block-map`: the Sites and AI webinar deck, demo 2.2 (AI that knows my block
 * library).
 *
 * What it shows: your library on the left, six blocks drawn as small shapes (a hero, cards, a
 * table, a rail, a callout, a figure). AI (the accent disc) reads it once, top to bottom. Then
 * each part of a plan on the right gets a wire from the block that fits, in the plan's own order,
 * and takes that block's shape. One part has no block: its wire goes out dashed and stops, and
 * the part stays dashed with a question mark, named as a gap.
 *
 * Story (played once from t = 0): the library 0.3 to 1.2 s, the reading 1.3 to 3 s, the plan's
 * waiting parts 3 s, the wires 3.5 to 7 s, the gap at 6 s. Then it holds. Reduced motion shows
 * that end state.
 *
 * Parts (rows): `library` and `plan` over their columns; `gap` under the plan.
 */
import plate, { rect } from '../plate.js';

const LIB = { x: 48, y: 122, w: 124 };
const PLAN = { x: 328, y: 122, w: 124 };
const ROW = 46;
const SHAPE = { w: 92, h: 32 };
const rowY = (i) => LIB.y + 28 + i * ROW;
const ORDER = [0, 3, 1, 2, null, 4]; // the block each plan part takes; null is the gap

/** A block's shape at (x, y), its top left, in a group. */
function shape(p, kind, x, y, parent) {
  const r = (a, b, w, h) => p.svg('rect', { ...rect(x + a, y + b, w, h, 2), class: 'plate-fill' }, parent);
  const l = (d) => p.svg('path', { d: `M${x} ${y}${d}`, class: 'plate-line' }, parent);
  if (kind === 0) { r(0, 0, 92, 32); l('m10 12h44m-44 9h28'); } // a hero
  if (kind === 1) { r(0, 0, 28, 32); r(32, 0, 28, 32); r(64, 0, 28, 32); } // cards
  if (kind === 2) { r(0, 0, 92, 32); l('m0 11h92m-92 10h92m-61 -21v32m31 -32v32'); } // a table
  if (kind === 3) { l('m6 16h80m-80 -6v12m27 -12v12m27 -12v12m26 -12v12'); } // a rail
  if (kind === 4) { r(0, 0, 92, 32); p.svg('path', { d: `M${x + 5} ${y + 5}v22`, class: 'plate-head' }, parent); l('m14 12h60m-60 9h42'); } // a callout
  if (kind === 5) { r(0, 0, 44, 32); l('m4 28l14 -13l9 8l7 -5l8 9m12 -20h36m-36 9h28'); } // a figure
}

export default function engine(block, kit) {
  const p = plate(kit);
  p.label('library', LIB.x, 104, 'left', 0.3);
  p.label('plan', PLAN.x, 104, 'left', 3);
  p.paper(LIB.x, LIB.y, LIB.w, 6 * ROW + 12, 0.1);
  p.paper(PLAN.x, PLAN.y, PLAN.w, 6 * ROW + 12, 3);

  [0, 1, 2, 3, 4, 5].forEach((k) => {
    const g = p.show('g', {}, null, 0.3 + k * 0.12);
    shape(p, k, LIB.x + 16, rowY(k) - SHAPE.h / 2, g);
  });

  ORDER.forEach((k, i) => {
    const x = PLAN.x + 16;
    const y = rowY(i);
    const t0 = 3.6 + i * 0.6;
    const wait = p.show('rect', rect(x, y - SHAPE.h / 2, SHAPE.w, SHAPE.h, 2), 'plate-waiting', 3 + i * 0.08);
    if (k == null) {
      p.show('path', { d: `M${LIB.x + LIB.w} ${rowY(5)}C220 ${rowY(5)} 240 ${y} 262 ${y}` }, 'plate-hot-dashed', t0, 0.5);
      p.show('circle', { cx: 268, cy: y, r: 3 }, 'plate-dot', t0 + 0.5, 0.2);
      p.show('rect', rect(x, y - SHAPE.h / 2, SHAPE.w, SHAPE.h, 2), 'plate-hot-dashed', t0 + 0.6, 0.3);
      p.line(`M${x + 40} ${y - 5}a6 6 0 1 1 8 6c-2 1 -2 2 -2 4`, 'plate-hot-head', t0 + 0.8, 0.3);
      p.line(`M${x + 46} ${y + 10}h0.1`, 'plate-hot-head', t0 + 1, 0.1);
      return;
    }
    const y0 = rowY(k);
    const d = `M${LIB.x + LIB.w} ${y0}C250 ${y0} 250 ${y} ${PLAN.x} ${y}`;
    p.hide(p.line(d, 'plate-hot-head', t0, 0.45), t0 + 0.5, 0.5);
    p.line(d, 'plate-leader', t0 + 0.3, 0.3);
    p.hide(wait, t0 + 0.45, 0.2);
    shape(p, k, x, y - SHAPE.h / 2, p.show('g', {}, null, t0 + 0.45, 0.3));
  });

  const disc = p.disc(1.1);
  const reading = LIB.x + LIB.w + 18;
  p.move(disc, reading, rowY(0), [[1.3, 1.7, reading, rowY(5)], [3.1, 0.5, 250, 410]]);
  p.label('gap', PLAN.x + PLAN.w, 428, 'right', 6.4);
  p.leader(`M${PLAN.x + 62} 414V${PLAN.y + 6 * ROW + 13}`, 6.4);
  p.play(8.5);
}
