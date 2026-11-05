/**
 * Scene engine `file-brain`: the Sites and AI webinar deck, demo 1.3 (a second brain that knows
 * me).
 *
 * What it shows: plain files. Three shelves of small documents (your talks, your voice, your
 * research) sit ready. Before you author anything, AI (the accent disc) reads a thread from each
 * shelf into a waiting page, and the page writes in the accent, then you (the ink ring) tick it.
 * Last, a dashed frame draws round the shelves: for a company, that's the brand.
 *
 * Story (played once from t = 0): the shelves 0.4 to 2.4 s, the threads 2.6 to 3.6 s, the page
 * 3.8 to 5.2 s, your tick 5.6 s, the frame 6.4 s. Then it holds. Reduced motion shows that end
 * state.
 *
 * Parts (rows): `talks`, `voice` and `research` at the left of their shelves; `page` over the
 * page; `brand` under the frame.
 */
import plate from '../plate.js';

const ROWS = [150, 244, 338];
const DOCS = [122, 160, 198, 236];
const DOC = { w: 30, h: 40 };
const PAGE = {
  x: 352, y: 140, w: 104, h: 208,
};
const HUB = { x: 310, y: 244 };

/** A small document with a folded corner, its middle at y. */
function doc(p, x, y, t0) {
  const g = p.show('g', {}, null, t0, 0.3);
  const top = y - DOC.h / 2;
  p.svg('path', {
    d: `M${x} ${top}h${DOC.w - 9}l9 9v${DOC.h - 9}h-${DOC.w}z`, class: 'plate-paper',
  }, g);
  p.svg('path', { d: `M${x + DOC.w - 9} ${top}v9h9`, class: 'plate-c' }, g);
  [16, 23, 30].forEach((dy, i) => p.svg('path', { d: `M${x + 6} ${top + dy}h${[16, 18, 12][i]}`, class: 'plate-line' }, g));
}

export default function engine(block, kit) {
  const p = plate(kit);
  ['talks', 'voice', 'research'].forEach((part, i) => p.label(part, 44, ROWS[i], 'left', 0.4 + i * 0.5));
  p.label('page', PAGE.x + PAGE.w / 2, 116, 'center', 3.6);

  ROWS.forEach((y, i) => {
    DOCS.forEach((x, k) => doc(p, x, y, 0.5 + i * 0.5 + k * 0.1));
    const t0 = 2.7 + i * 0.3;
    p.hide(p.line(`M${DOCS[3] + DOC.w} ${y}C282 ${y} 292 ${HUB.y} ${HUB.x} ${HUB.y}`, 'plate-hot-head', t0, 0.6), 4.6, 0.8);
    p.line(`M${DOCS[3] + DOC.w} ${y}C282 ${y} 292 ${HUB.y} ${HUB.x} ${HUB.y}`, 'plate-leader', t0 + 0.4, 0.4);
  });

  // the page waits, dashed, until the files reach it
  p.hide(p.show('rect', {
    x: PAGE.x, y: PAGE.y, width: PAGE.w, height: PAGE.h, rx: 4,
  }, 'plate-waiting', 2.2), 3.8, 0.4);
  p.paper(PAGE.x, PAGE.y, PAGE.w, PAGE.h, 3.8);
  p.lines(PAGE.x + 14, PAGE.y + 24, [56], 0, 4, 0.2, 'plate-head');
  const body = p.lines(PAGE.x + 14, PAGE.y + 50, [76, 68, 76, 60, 76, 70, 48, 72, 64, 44], 14, 4.1, 0.09, 'plate-hot');
  body.forEach((el) => p.hide(el, 5.2, 0.5));
  p.lines(PAGE.x + 14, PAGE.y + 50, [76, 68, 76, 60, 76, 70, 48, 72, 64, 44], 14, 5, 0.05);

  const disc = p.disc(2.5);
  const under = PAGE.y + PAGE.h + 22;
  p.move(disc, HUB.x, HUB.y, [[3.7, 0.5, PAGE.x + PAGE.w / 2, under], [5.1, 0.3, 330, under]]);
  const ring = p.ring(5.3);
  p.move(ring, PAGE.x + PAGE.w + 2, under, [[5.3, 0.4, PAGE.x + PAGE.w - 16, under]]);
  p.tick(PAGE.x + PAGE.w / 2, under, 5.8);

  // for a company, the same files are the brand
  p.stroke('rect', {
    x: 32, y: 112, width: 248, height: 268, rx: 10,
  }, 'plate-hot', 6.4, 1);
  p.label('brand', 32, 400, 'left', 6.9);
  p.play(8.5);
}
