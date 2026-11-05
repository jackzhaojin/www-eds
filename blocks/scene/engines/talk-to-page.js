/**
 * Scene engine `talk-to-page`: the Sites and AI webinar deck, demo 1.2 (from my recording to
 * writing).
 *
 * What it shows: talking as input. You (the ink ring) talk, and a recording runs down the left as
 * a waveform. Automation (the faint square) turns it into a transcript, AI (the accent disc)
 * reads that into a brief with three lines in your own words (accent), and the brief becomes a
 * page. Then eight moments in the recording each run a wire to their place on the page, in the
 * order you said them.
 *
 * Story (played once from t = 0): the recording 0.4 to 2.4 s, the transcript 2.4 to 3.6 s, the
 * brief 3.6 to 5.2 s, the page 5.2 to 6.6 s, the wires 6.8 to 9 s. Then it holds. Reduced motion
 * shows that end state.
 *
 * Parts (rows): `recording`, `transcript`, `brief` and `page` over their columns; `mapped` under
 * the plate, when the wires are done.
 */
import plate, { rect } from '../plate.js';

const WAVE = { x: 66, top: 122, bottom: 406 };
const MID = { x: 196, w: 108 };
const PAGE = {
  x: 366, y: 122, w: 100, h: 284,
};
const BARS = 44;
const MOMENTS = [0, 1, 2, 3, 4, 5, 6, 7];
const momentY = (i) => WAVE.top + 18 + (i * (WAVE.bottom - WAVE.top - 36)) / 7;
const sectionY = (i) => PAGE.y + 22 + i * 34;

export default function engine(block, kit) {
  const p = plate(kit);
  p.label('recording', WAVE.x, 86, 'center', 0.3);
  p.label('transcript', MID.x + MID.w / 2, 110, 'center', 2.4);
  p.label('brief', MID.x + MID.w / 2, 420, 'center', 3.6);
  p.label('page', PAGE.x + PAGE.w / 2, 110, 'center', 5.2);

  // the wires sit under the cards, so they read as passing behind them
  MOMENTS.forEach((i) => {
    const [y0, y1] = [momentY(i), sectionY(i)];
    const d = `M${WAVE.x + 34} ${y0}C200 ${y0} 270 ${y1} ${PAGE.x} ${y1}`;
    const t0 = 6.8 + i * 0.28;
    p.hide(p.line(d, 'plate-hot-head', t0, 0.7), t0 + 0.8, 0.8);
    p.line(d, 'plate-leader', t0 + 0.5, 0.4);
  });

  // the recording: a waveform written down the strip as you talk, its moments as ticks
  for (let i = 0; i < BARS; i += 1) {
    const y = WAVE.top + (i * (WAVE.bottom - WAVE.top)) / (BARS - 1);
    const len = 8 + 16 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));
    p.line(`M${WAVE.x - len} ${y}H${WAVE.x + len}`, 'plate-line', 0.5 + (i / BARS) * 1.9, 0.12);
  }
  MOMENTS.forEach((i) => p.show('circle', { cx: WAVE.x + 34, cy: momentY(i), r: 2.6 }, 'plate-dot', 6.5 + i * 0.28, 0.2));
  const ring = p.ring(0.3);
  p.move(ring, WAVE.x, WAVE.top - 12, [[0.5, 1.9, WAVE.x, WAVE.bottom + 12]]);

  // the transcript: dense lines, from the square
  p.square(150, 180, 2.4);
  p.line(`M${WAVE.x + 26} 180H142`, 'plate-c', 2.3, 0.3);
  p.line(`M158 180H${MID.x}`, 'plate-c', 2.5, 0.2);
  p.paper(MID.x, 122, MID.w, 118, 2.5);
  p.lines(MID.x + 12, 138, [84, 76, 84, 70, 84, 62, 80, 74, 84], 11, 2.7, 0.08);

  // the brief: fewer lines, three in your own words
  p.paper(MID.x, 288, MID.w, 118, 3.6);
  p.lines(MID.x + 12, 306, [60, 84], 12, 4, 0.15, 'plate-line');
  p.lines(MID.x + 12, 342, [78, 66, 84], 14, 4.4, 0.2, 'plate-hot-head');
  const disc = p.disc(3.6);
  p.move(disc, MID.x + MID.w / 2, 240, [[3.7, 0.6, MID.x + MID.w / 2, 264], [5, 0.6, 334, 264]]);

  // the page: eight sections, filled from the brief
  p.line(`M${MID.x + MID.w} 346H330V264`, 'plate-c', 5.1, 0.3);
  p.paper(PAGE.x, PAGE.y, PAGE.w, PAGE.h, 5.2);
  MOMENTS.forEach((i) => {
    p.show('rect', rect(PAGE.x + 10, sectionY(i) - 11, 80, 22, 2), 'plate-fill', 5.4 + i * 0.13, 0.3);
    p.line(`M${PAGE.x + 16} ${sectionY(i)}h${[52, 62, 44, 58, 48, 64, 40, 54][i]}`, 'plate-line', 5.5 + i * 0.13, 0.15);
  });

  p.label('mapped', 250, 452, 'center', 9);
  p.play(10.5);
}
