/**
 * Scene engine `three-outcomes`: the Sites and AI webinar deck, demo 3.2 (agentic).
 *
 * What it shows: a reviewer with three ways out. A draft sits on the left. Your voice rules drop
 * into AI (the accent disc), which then reads the draft. Each finding leaves as a dot and takes
 * one of three paths: pass (a tick), auto-revise (a line on the draft swaps for a new one), or,
 * for anything that changes the meaning, down to you (the ink ring), where the path stays lit.
 *
 * Story (played once from t = 0): the draft and the fork 0 to 1 s, the rules 1 to 2.2 s, the first
 * finding 2.6 s (pass), the second 4 s (auto-revise), the third 5.6 s (to you). Then it holds.
 * Reduced motion shows that end state.
 *
 * Parts (rows): `rules` over the rules card; `draft` over the draft; `pass`, `revise` and `ask`
 * over their outcomes.
 */
import plate, { rect } from '../plate.js';

const HUB = { x: 228, y: 256 };
const OUT = [[400, 134], [400, 256], [400, 378]];

const pathTo = ([x, y]) => `M${HUB.x} ${HUB.y}C300 ${HUB.y} 300 ${y} ${x - 20} ${y}`;

export default function engine(block, kit) {
  const p = plate(kit);
  p.label('draft', 44, 138, 'left', 0.2);
  p.label('rules', HUB.x, 70, 'center', 1);
  p.label('pass', OUT[0][0], OUT[0][1] - 34, 'center', 0.8);
  p.label('revise', OUT[1][0], OUT[1][1] - 34, 'center', 0.9);
  p.label('ask', OUT[2][0], OUT[2][1] - 34, 'center', 1);

  OUT.forEach((o) => p.line(pathTo(o), 'plate-c', 0.6, 0.5));
  p.line(`M144 ${HUB.y}H${HUB.x}`, 'plate-c', 0.5, 0.3);
  p.line(`M${HUB.x} 128V${HUB.y}`, 'plate-c', 1.3, 0.4);

  // the draft
  p.paper(44, 156, 100, 200, 0.1);
  p.lines(58, 178, [52], 0, 0.3, 0.2, 'plate-head');
  const swapped = p.lines(58, 204, [72, 64, 72], 22, 0.4, 0.1);
  p.lines(58, 270, [70, 58, 72, 44], 18, 0.6, 0.1);
  p.line('M58 226h72', 'plate-hot-head', 4.9, 0.3);
  p.hide(swapped[1], 4.8, 0.2);

  // your voice rules: a card that drops into the disc
  const rules = p.show('g', {}, null, 1);
  p.svg('rect', { ...rect(HUB.x - 44, 84, 88, 44), class: 'plate-paper' }, rules);
  [98, 108, 118].forEach((y, i) => p.svg('path', { d: `M${HUB.x - 32} ${y}h${[64, 52, 58][i]}`, class: 'plate-line' }, rules));
  const thread = p.line(`M${HUB.x} 128V${HUB.y - 14}`, 'plate-hot', 1.5, 0.5);
  p.hide(thread, 2.4, 0.4);

  // the outcomes
  p.stroke('circle', { cx: OUT[0][0], cy: OUT[0][1], r: 18 }, 'plate-paper', 0.8, 0.4);
  p.tick(OUT[0][0], OUT[0][1], 3.3);
  p.stroke('rect', rect(OUT[1][0] - 18, OUT[1][1] - 18, 36, 36), 'plate-paper', 0.9, 0.4);
  p.lines(OUT[1][0] - 9, OUT[1][1] - 5, [18], 0, 0.9, 0.2);
  p.line(`M${OUT[1][0] - 9} ${OUT[1][1] + 5}h18`, 'plate-hot-head', 4.7, 0.25);
  p.line(pathTo(OUT[2]), 'plate-hot', 5.7, 0.7);
  const ring = p.ring(1);
  ring.setAttribute('transform', `translate(${OUT[2][0]} ${OUT[2][1]})`);
  p.show('circle', { cx: OUT[2][0], cy: OUT[2][1], r: 18 }, 'plate-firm', 6.4, 0.4);

  // three findings, one path each: a dot leaves the disc, along its path, and lands
  [[2.6, OUT[0]], [4, OUT[1]], [5.7, OUT[2]]].forEach(([t0, [x, y]]) => {
    const dot = p.show('circle', { r: 4 }, 'plate-dot', t0, 0.1);
    p.hide(dot, t0 + 0.7, 0.15);
    const bend = HUB.y + (y - HUB.y) * 0.6;
    p.move(dot, HUB.x, HUB.y, [[t0, 0.35, 310, bend], [t0 + 0.35, 0.35, x - 16, y]]);
  });

  const disc = p.disc(0.9);
  p.move(disc, HUB.x, HUB.y);
  p.play(8);
}
