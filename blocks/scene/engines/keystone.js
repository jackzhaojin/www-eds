/**
 * Scene engine `keystone`: the Sites and AI webinar deck's title slide (since v1.7.5).
 *
 * What it shows: an arch on two piers. AI (the accent disc) sets six of its seven stones, fast,
 * one after another: research on the left, authoring on the right, evaluation over the
 * shoulders. The arch doesn't hold yet. You (the ink ring) lower the keystone, the arch closes
 * and takes the accent, and only then a page passes under it from the brief to live.
 *
 * Story (played once from t = 0): the ground and piers 0.2 to 1.2 s, the six stones 1.6 to
 * 5.6 s, the keystone 6.5 to 7.9 s, the arch holding 8 s, the page through 9.4 to 11.6 s. Then
 * it holds. Reduced motion shows that end state.
 *
 * Parts (rows): `ai` by the disc's place; `research`, `authoring` and `evaluation` beside
 * their stones; `keystone` over the arch; `brief` and `live` under the two ends of the ground.
 */
import plate, { rect } from '../plate.js';

const C = [250, 300];
const RI = 104;
const RO = 150;
const GROUND = 420;
const STEP = 180 / 7;
const xy = (r, deg) => [
  C[0] + r * Math.cos((deg * Math.PI) / 180), C[1] - r * Math.sin((deg * Math.PI) / 180),
];
const pt = (r, deg) => xy(r, deg).map((v) => v.toFixed(2)).join(' ');
/** Stone i of seven, counted from the left pier over the top to the right one. */
const wedge = (i) => {
  const a0 = 180 - i * STEP;
  const a1 = a0 - STEP;
  return `M${pt(RI, a0)}L${pt(RO, a0)}A${RO} ${RO} 0 0 1 ${pt(RO, a1)}L${pt(RI, a1)}A${RI} ${RI} 0 0 0 ${pt(RI, a0)}Z`;
};
const ORDER = [0, 6, 1, 5, 2, 4];
const HOME = [58, 386];
const T = 6.5; // the keystone

export default function engine(block, kit) {
  const p = plate(kit);
  p.line(`M30 ${GROUND}H470`, 'plate-line', 0.2, 0.7);
  p.stroke('rect', rect(C[0] - RO, C[1], RO - RI, GROUND - C[1], 0), 'plate-paper', 0.5);
  p.stroke('rect', rect(C[0] + RI, C[1], RO - RI, GROUND - C[1], 0), 'plate-paper', 0.7);
  // where the arch will stand
  p.line(`M${pt(RI, 180)}A${RI} ${RI} 0 0 1 ${pt(RI, 0)}`, 'plate-waiting', 0.9, 0.6);
  p.line(`M${pt(RO, 180)}A${RO} ${RO} 0 0 1 ${pt(RO, 0)}`, 'plate-waiting', 0.9, 0.6);
  p.label('brief', 60, 446, 'center', 0.6);
  p.label('ai', 58, 354, 'center', 1.0);

  // AI sets six stones: each takes the accent as it lands, then settles into the arch
  const at = (k) => 1.6 + k * 0.7;
  const hops = ORDER.map((i, k) => {
    p.show('path', { d: wedge(i) }, 'plate-fill', at(k), 0.4);
    p.hide(p.line(wedge(i), 'plate-hot', at(k), 0.35), at(k) + 0.9, 0.6);
    return [at(k) - 0.5, 0.5, ...xy((RI + RO) / 2, 180 - (i + 0.5) * STEP)];
  });
  p.label('research', 106, 222, 'right', at(0));
  p.label('authoring', 394, 222, 'left', at(1));
  p.label('evaluation', 176, 150, 'right', at(4));

  // you lower the keystone
  const [kx, ky] = xy(RO + 26, 90);
  const stone = p.svg('g', {}, p.root);
  p.show('path', { d: wedge(3) }, 'plate-paper plate-firm', T, 0.4, stone);
  p.move(stone, 0, -84, [[T + 0.2, 1.2, 0, 0]]);
  p.label('keystone', kx, ky - 30, 'center', T + 1.4);
  // the arch holds
  p.line(`M${pt(RO, 180)}A${RO} ${RO} 0 0 1 ${pt(RO, 0)}`, 'plate-hot', T + 1.5, 0.9);

  // and the page goes through
  const page = p.svg('g', {}, p.root);
  p.stroke('rect', rect(-11, -30, 22, 30, 2), 'plate-paper', T + 2.3, 0.4, page);
  p.lines(-6, -21, [12, 9], 7, T + 2.5, 0.15, 'plate-line', page);
  p.move(page, 60, GROUND, [[T + 2.9, 2.2, 440, GROUND]]);
  p.tick(440, GROUND - 46, T + 5.2, 'plate-hot');
  p.label('live', 440, 446, 'center', T + 5.1);

  const disc = p.disc(0.9);
  p.move(disc, HOME[0], HOME[1], [...hops, [at(5) + 0.5, 0.7, HOME[0], HOME[1]]]);
  const ring = p.ring(T);
  p.move(ring, kx, ky - 84, [[T + 0.2, 1.2, kx, ky]]);
  p.play(13);
}
