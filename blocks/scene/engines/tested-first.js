/**
 * Scene engine `tested-first`: the Sites and AI webinar deck, demo 2.3 (Claude Code with
 * everything wired in).
 *
 * What it shows: one session, a frame holding your site, your brain and your tools. A brief goes
 * in. AI (the accent disc) builds the page, then runs it through four checks (desktop and phone,
 * light and dark). One check fails (a cross), AI goes back to the page and fixes it, and the
 * check passes. Then the page goes to preview. You (the ink ring) wait below the frame the whole
 * time, faint, and only now look: a sight line up to preview, and the ring comes up to full ink.
 *
 * Story (played once from t = 0): the session 0.2 to 1.4 s, the build 1.5 to 3.6 s, the checks
 * 3.8 to 6.8 s (the failure at 4.9 s, the fix to 6 s), preview 7 s, your look 7.8 s. Then it
 * holds. Reduced motion shows that end state.
 *
 * Parts (rows): `site`, `brain` and `tools` on the frame's top row; `session` over the frame;
 * `preview` over the pill; `look` under the ring.
 */
import plate, { rect } from '../plate.js';

const FRAME = {
  x: 32, y: 92, w: 436, h: 238,
};
const Y = 232; // the work's row
const PAGE = {
  x: 142, y: 176, w: 82, h: 112,
};
const TILES = [[260, 188], [306, 188], [260, 234], [306, 234]];
const TILE = 40;
const PILL = {
  x: 382, y: Y - 15, w: 68, h: 30,
};

export default function engine(block, kit) {
  const p = plate(kit);
  p.label('session', FRAME.x, 74, 'left', 0.2);
  p.stroke('rect', rect(FRAME.x, FRAME.y, FRAME.w, FRAME.h, 12), 'plate-firm', 0.2, 0.9);
  ['site', 'brain', 'tools'].forEach((part, i) => {
    p.label(part, 90 + i * 160, 118, 'left', 0.6 + i * 0.2);
    p.square(74 + i * 160, 118, 0.6 + i * 0.2);
  });
  p.line(`M${FRAME.x} 142H${FRAME.x + FRAME.w}`, 'plate-c', 0.9);

  // the brief, then the page written from it
  p.paper(56, 196, 50, 72, 1.2);
  p.lines(66, 212, [30, 26, 30, 20], 12, 1.4, 0.08);
  p.line(`M106 ${Y}H${PAGE.x}`, 'plate-c', 1.6, 0.3);
  p.paper(PAGE.x, PAGE.y, PAGE.w, PAGE.h, 1.7);
  p.lines(PAGE.x + 10, PAGE.y + 18, [44], 0, 2, 0.15, 'plate-head');
  p.lines(PAGE.x + 10, PAGE.y + 36, [62, 54, 62, 48, 60, 40], 11, 2.2, 0.2);

  // the four checks; the third fails, then passes after the fix
  TILES.forEach(([x, y], i) => {
    p.stroke('rect', rect(x, y, TILE, TILE), 'plate-paper', 3.6 + i * 0.1, 0.3);
    if (i === 2) {
      p.hide(p.cross(x + TILE / 2, y + TILE / 2, 4.9), 5.9, 0.2);
      p.tick(x + TILE / 2, y + TILE / 2, 6.1);
    } else p.tick(x + TILE / 2, y + TILE / 2, 4.1 + i * 0.42 + (i === 3 ? 2.1 : 0));
  });
  p.line(`M352 ${Y}H${PILL.x}`, 'plate-c', 6.8, 0.2);
  p.stroke('rect', rect(PILL.x, PILL.y, PILL.w, PILL.h, 15), 'plate-paper', 6.9, 0.4);
  p.stroke('rect', rect(PILL.x, PILL.y, PILL.w, PILL.h, 15), 'plate-hot', 7.1, 0.5);
  p.label('preview', PILL.x + PILL.w / 2, Y, 'center', 7.1);

  const disc = p.disc(1.3);
  p.move(disc, 124, Y, [
    [2.2, 0.8, PAGE.x + 41, PAGE.y + PAGE.h + 16], [3.4, 0.5, 246, 208], [4.3, 0.4, 246, 254],
    [5, 0.5, PAGE.x + 41, PAGE.y + PAGE.h + 16], [5.6, 0.4, 246, 254], [6.3, 0.4, 366, Y + 40],
  ]);

  // you: outside the session, faint, until there's something worth looking at
  p.show('circle', { cx: 416, cy: 402, r: 9 }, 'plate-c', 0.5);
  p.show('path', { d: `M416 392V${PILL.y + PILL.h + 3}` }, 'plate-waiting', 7.7, 0.5);
  p.ring(8.1).setAttribute('transform', 'translate(416 402)');
  p.tick(444, 402, 8.5);
  p.label('look', 396, 402, 'right', 8.2);
  p.play(9.5);
}
