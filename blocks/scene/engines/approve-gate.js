/**
 * Scene engine `approve-gate`: the Sites and AI webinar deck, demo 2.1 (the assistant in
 * Experience Workspace).
 *
 * What it shows: an editor drawn in lines, no product UI: the assistant's panel beside the page.
 * You (the ink ring) type one small ask. AI (the accent disc) writes a suggestion, and it stops
 * at a gate between the panel and the page: the page hasn't changed. You approve, the gate opens,
 * the long title gives way to a shorter one, and nothing else on the page moves. Then the preview
 * pill lights.
 *
 * Story (played once from t = 0): the window 0 to 0.8 s, the ask 1 to 2 s, the suggestion 2.2 to
 * 3.6 s, the hold at the gate to 4.8 s, your approval 4.8 to 5.4 s, the title 5.4 to 6.4 s, the
 * preview 6.8 s. Then it holds. Reduced motion shows that end state.
 *
 * Parts (rows): `ask` over the panel; `preview` over the pill; `gate` under the window.
 */
import plate, { rect } from '../plate.js';

const WIN = {
  x: 40, y: 104, w: 420, h: 304,
};
const GX = 192; // the gate
const PX = 214; // the page's text
const TITLE = [168, 186, 204];

export default function engine(block, kit) {
  const p = plate(kit);
  p.paper(WIN.x, WIN.y, WIN.w, WIN.h, 0);
  p.line(`M${WIN.x} 130H${WIN.x + WIN.w}`, 'plate-c', 0.3);
  p.line(`M${GX} 130V${WIN.y + WIN.h}`, 'plate-c', 0.4);
  p.label('ask', 56, 84, 'left', 0.9);
  p.label('preview', 444, 84, 'right', 6.8);

  // the page: a long title, then a rest that never moves
  const old = p.lines(PX, TITLE[0], [220, 226, 150], 18, 0.5, 0.15, 'plate-head');
  old.forEach((el, i) => p.hide(el, 5.4 + i * 0.1, 0.3));
  p.lines(PX, 246, [226, 218, 226, 204, 224, 170], 16, 0.8, 0.07);
  p.show('rect', rect(PX, 350, 104, 40, 3), 'plate-fill', 1.1);
  p.show('rect', rect(PX + 118, 350, 104, 40, 3), 'plate-fill', 1.2);

  // the new title, shorter, in the accent; the wash of a change stays with it
  p.lines(PX, TITLE[0], [176, 118], 18, 5.7, 0.28, 'plate-hot-head');

  // the ask
  p.stroke('rect', rect(56, 146, 120, 42), 'plate-paper', 0.8);
  p.lines(68, 160, [96, 72], 13, 1.1, 0.35);

  // the suggestion: dashed, because nothing has happened yet
  p.show('rect', rect(56, 214, 120, 72), 'plate-hot-dashed', 2.4);
  p.lines(68, 234, [90, 66], 14, 2.7, 0.3, 'plate-hot-head');

  // the gate: closed beside the title until you approve
  const held = p.line(`M176 250C184 250 180 186 ${GX - 3} 186`, 'plate-hot', 3.4, 0.5);
  p.hide(held, 6.2, 0.5);
  const bar = p.line(`M${GX} 152V222`, 'plate-head', 0.9, 0.3);
  p.hide(bar, 5.1, 0.25);
  const through = p.line(`M${GX - 3} 186H${PX - 4}`, 'plate-hot', 5.2, 0.25);
  p.hide(through, 6.2, 0.5);

  // approve: a button, your press, a tick
  p.stroke('rect', rect(56, 306, 120, 30, 6), 'plate-paper', 3.8);
  p.tick(116, 321, 4.95);

  const disc = p.disc(2.1);
  p.move(disc, 70, 202, [[2.3, 1.1, 160, 202]]);
  const ring = p.ring(0.6);
  p.move(ring, 44, 167, [[0.8, 0.4, 44, 167], [4.3, 0.5, 44, 321]]);

  // the preview pill, top right
  p.stroke('rect', rect(392, 110, 56, 14, 7), 'plate-c', 0.5);
  p.stroke('rect', rect(392, 110, 56, 14, 7), 'plate-hot', 6.8, 0.6);

  p.label('gate', GX, 432, 'center', 3.6);
  p.leader(`M${GX} 418V${WIN.y + WIN.h - 1}`, 3.6);
  p.play(8);
}
