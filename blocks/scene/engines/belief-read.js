/**
 * Scene engine `belief-read`: the Sites and AI webinar deck, demo 1.1 (the research assistant).
 *
 * What it shows: three stages, left to right. You (the ink ring) write three beliefs on three
 * cards. AI (the accent disc) goes down a stack of source pages and sends a verdict for each
 * belief to the right: two push back (an accent wave), one holds (a tick). You read those
 * verdicts yourself, a dotted sight line to each, and the two that pushed back add a line to
 * their cards. The beliefs you end with are sharper than the ones you started with.
 *
 * Story (played once from t = 0): the beliefs 0.5 to 2.4 s, the sources 2.5 s, the research 3 to
 * 5.5 s, your read 5.8 to 8 s, the sharper cards 8 to 9 s. Then it holds. Reduced motion shows
 * that end state.
 *
 * Parts (rows): `beliefs`, `research` and `read` over the three columns; `sharper` under the
 * beliefs, when they change.
 */
import plate from '../plate.js';

const ROWS = [172, 252, 332];
const CARD = { x: 44, w: 132, h: 60 };
const VX = 372; // the verdicts
const STACK = 262;

export default function engine(block, kit) {
  const p = plate(kit);
  p.label('beliefs', CARD.x, 104, 'left', 0.3);
  p.label('research', STACK, 104, 'center', 2.5);
  p.label('read', 456, 104, 'right', 5.8);

  // the threads sit under everything: belief to stack, stack to verdict
  ROWS.forEach((y, i) => {
    p.line(`M${CARD.x + CARD.w} ${y}H${STACK}`, 'plate-c', 3 + i * 0.7);
    p.line(`M${STACK} ${y}H${VX - 14}`, 'plate-hot', 3.3 + i * 0.7);
  });

  // the sources: a loose stack of small pages
  [[230, 128, -5], [266, 136, 4], [236, 196, 3], [270, 214, -4], [232, 274, -3], [264, 292, 5]]
    .forEach(([x, y, r], i) => {
      const g = p.show('g', { transform: `rotate(${r} ${x + 24} ${y + 32})` }, null, 2.5 + i * 0.07);
      p.svg('rect', {
        x, y, width: 48, height: 64, rx: 3, class: 'plate-paper',
      }, g);
      [14, 24, 34, 44].forEach((dy, k) => p.svg('path', { d: `M${x + 8} ${y + dy}h${k % 2 ? 22 : 32}`, class: 'plate-line' }, g));
    });

  // the beliefs: a card each, two written lines, room for one more
  ROWS.forEach((y, i) => {
    p.paper(CARD.x, y - CARD.h / 2, CARD.w, CARD.h, 0.5 + i * 0.5);
    p.lines(CARD.x + 12, y - 14, [100, 74], 12, 0.7 + i * 0.5, 0.18);
  });
  // the sharper cards: the two that pushed back gain a line, in the accent
  [0, 1].forEach((i) => {
    p.line(`M${CARD.x + 12} ${ROWS[i] + 14}h${[88, 64][i]}`, 'plate-hot-head', 8 + i * 0.3, 0.45);
    p.stroke('rect', {
      x: CARD.x, y: ROWS[i] - CARD.h / 2, width: CARD.w, height: CARD.h, rx: 4,
    }, 'plate-firm', 8 + i * 0.3, 0.6);
  });

  // the verdicts: two waves, one tick
  ROWS.forEach((y, i) => {
    p.stroke('circle', { cx: VX, cy: y, r: 14 }, 'plate-paper', 3.5 + i * 0.7, 0.3);
    if (i < 2) p.line(`M${VX - 7} ${y + 1}q3.5 -6 7 0t7 0`, 'plate-hot-head', 3.7 + i * 0.7, 0.3);
    else p.tick(VX, y, 3.7 + i * 0.7);
    p.show('path', { d: `M${VX + 18} ${y}H432` }, 'plate-waiting', 6 + i * 0.6, 0.2);
  });

  // AI goes down the stack, then steps aside; you read, then go back to your beliefs
  const disc = p.disc(2.9);
  p.move(disc, STACK, 150, [
    [3, 0.5, STACK, ROWS[0]], [3.7, 0.5, STACK, ROWS[1]], [4.4, 0.5, STACK, ROWS[2]],
    [5.1, 0.5, STACK, 392],
  ]);
  const ring = p.ring(0.4);
  p.move(ring, 30, 140, [
    [0.6, 0.3, 30, ROWS[0]], [1.1, 0.3, 30, ROWS[1]], [1.6, 0.3, 30, ROWS[2]],
    [5.4, 0.5, 440, ROWS[0]], [6.5, 0.4, 440, ROWS[1]], [7.1, 0.4, 440, ROWS[2]],
    [7.8, 0.6, 30, ROWS[0] + 14], [8.4, 0.4, 30, ROWS[1] + 14],
  ]);

  p.label('sharper', CARD.x, 396, 'left', 8.7);
  p.play(10);
}
