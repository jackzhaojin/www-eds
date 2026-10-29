/**
 * Scene engine: pin-tumbler (CIAM Demo, /portfolio/ciam-demo/).
 *
 * The mechanism, not the boxes: two tenants' locks inside the Spring Boot API (a dash-dot
 * boundary), drawn as pin tumbler cutaways (hatched housing, plug, four pin stacks on springs, a
 * bolt in its strike). The key is the token: its bitting is its organization-scoped claims, cut
 * by Keycloak, and it crosses into the API's boundary. Each 9.5 s loop: the key slides into its
 * own tenant's lock, the pins ride the bitting up and every gap lands on the shear line, which
 * lights in the accent; the bolt snaps back and the plug turns. It withdraws and tries another
 * tenant's lock, where the same cuts leave three pins across the shear line (accent ticks), the
 * key jiggles twice and the bolt only jolts. The API names the tenant on each request; only a
 * key cut for that tenant opens it. Reduced motion shows its own tenant's lock turned open.
 *
 * Parts (authored rows, placed by the engine):
 * - `claims`: left, above the key; its leader drops to the key's bow while the key is up
 * - `api`: top right, at the boundary's corner
 * - `own`: under the first lock (the one the key opens)
 * - `other`: under the second lock (the one it can't)
 */

const W = 500;
const CYCLE = 9.5;
const ARRIVE = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)); // cubic-bezier(0.16, 1, 0.3, 1)
const TRAVEL = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (2 - 2 * x) ** 3 / 2); // (0.65, 0, 0.35, 1)
const SNAP = (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2; // (0.34, 1.56, 0.64, 1)
const LEAVE = (x) => x ** 3; // (0.32, 0, 0.67, 0)
const clamp = (v) => Math.min(1, Math.max(0, v));
const span = (t, t0, len) => clamp((t - t0) / len);
const smooth = (v) => v * v * (3 - 2 * v);
const f2 = (v) => v.toFixed(2);

// ---------- the cutaway (500 units square) ----------
const FX = 226; // the locks' face
const HW = 170; // a lock's housing width
const PL = 148; // its plug length
const BL = 144; // the key's blade length
const OY = [104, 290]; // each lock's top: its own tenant's, another tenant's
const SHEAR = 46; // the shear line, from a lock's top
const BLADE = 92; // the key's lower edge in the keyway
const REST = 84; // where a key pin drops to with no key under it
const DRIVER = 18;
const U = [30, 60, 90, 120]; // the pins, from the key's shoulder
const CUTS = [20, 8, 24, 12]; // the bitting: the key's height under each pin
const PINS = [CUTS.map((c) => BLADE - SHEAR - c), [26, 26, 34, 22]]; // key pin lengths per lock
const PARK = FX - BL - 18; // the key's shoulder when it is out of the locks
const API = [FX - 12, 94, 426, 460]; // the boundary: left, top, right, bottom
const TURN = -6; // degrees the plug turns once every pin clears the shear line
const PIVOT = [FX + PL / 2, OY[0] + 73];
const STILL = 2.3; // reduced motion: its own tenant's lock turned open

/** The key's height above its lower edge at u along the blade (the cuts are V-shaped). */
const bitting = (u) => Math.min(36, (BL - u) * 1.4 + 6, ...CUTS.map((c, i) => (
  c + Math.max(0, Math.abs(u - U[i]) - 3) * 0.8)));

/** A point turned by deg about the first lock's pivot. */
const turned = (x, y, deg) => {
  const a = (deg * Math.PI) / 180;
  const [dx, dy] = [x - PIVOT[0], y - PIVOT[1]];
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return [PIVOT[0] + dx * c - dy * s, PIVOT[1] + dx * s + dy * c];
};

// the key's moves: [start, length, axis, from, to] in story seconds
const MOVES = [
  [0.2, 1.2, 'x', PARK, FX],
  [2.9, 1, 'x', FX, PARK],
  [3.95, 0.9, 'y', 0, 1],
  [4.9, 1.2, 'x', PARK, FX],
  [7, 1, 'x', FX, PARK],
  [8.05, 0.9, 'y', 1, 0],
];
const TRIES = [6.2, 6.45]; // the key jiggles in the other tenant's lock
const LEADS = {
  claims: { x: FX - 24, top: 96, align: 'right' },
  api: {
    dot: [API[2], API[1]], x: API[2], top: 30, align: 'right',
  },
  own: { dot: [FX + 10, OY[0] + 108], x: FX + 26, top: OY[0] + 120 },
  other: { dot: [FX + 10, OY[1] + 108], x: FX + 26, top: OY[1] + 120 },
};

/** The plate's static drawing; data-k names what the frame moves. */
function drawing(id) {
  // a stroke's width (as --w, scaled to the stage in CSS) and opacity; a class can recolor it
  const ink = (w, o, cls = '') => `style="--w: ${w}" stroke-opacity="${o}"${cls ? ` class="pin-tumbler-${cls}"` : ''}`;
  const spring = `M0 0${[1, 2, 3, 4].map((i) => `L${i % 2 ? 4.5 : -4.5} ${f2((i - 0.5) / 4)}`).join('')}L0 1`;
  const lock = (oy, j) => {
    const walls = U.map((u) => `M${FX + u - 6.5} ${oy + 4}V${oy + 54}H${FX + u + 6.5}V${oy + 4}Z`).join('');
    const pins = U.map((u, i) => `<g data-k="stack">
<path data-k="spring" d="${spring}" ${ink(0.75, 0.55, 'spring')}/>
<rect data-k="driver" x="-5.5" y="0" width="11" height="${DRIVER}" rx="1.5" ${ink(1.25, 0.75, 'paper')}/>
<path data-k="keypin" d="M-5.5 0H5.5V${PINS[j][i] - 4}L0 ${PINS[j][i]}L-5.5 ${PINS[j][i] - 4}Z" ${ink(1.25, 0.8, 'pin')}/></g>`).join('');
    const blocked = U.filter((u, i) => j && PINS[j][i] !== PINS[0][i]).map((u) => `M${FX + u - 12} ${oy + SHEAR}h24`).join('');
    return [`<g data-k="lock">
<rect x="${FX}" y="${oy}" width="${HW}" height="108" rx="6" class="pin-tumbler-fill" style="fill: url(#${id}-h)"/>
<rect x="${FX + PL}" y="${oy + 60}" width="${HW - PL}" height="14" class="pin-tumbler-hole"/>
<rect data-k="bolt" x="${FX + PL + 2}" y="${oy + 61}" width="34" height="12" rx="1.5" ${ink(1.25, 0.75, 'paper')}/>
<g data-k="plug"><rect x="${FX}" y="${oy + SHEAR}" width="${PL}" height="54" rx="2" ${ink(1.25, 0.7, 'paper')}/>
<rect x="${FX - 1}" y="${oy + 54}" width="${PL - 3}" height="40" ${ink(0.75, 0.35, 'paper')}/></g>
<path d="${walls}" class="pin-tumbler-hole"/><path d="${walls}" ${ink(0.75, 0.4)}/>
<rect data-k="outline" x="${FX}" y="${oy}" width="${HW}" height="108" rx="6" ${ink(1.25, 0.72)}/>
<path d="M${FX + HW + 6} ${oy + 57}H${FX + HW + 18}V${oy + 77}H${FX + HW + 6}" ${ink(1, 0.5)}/>
${j ? `<path data-k="blocked" d="${blocked}" ${ink(2.5, 1, 'accent')} opacity="0"/>` : `<path data-k="shear" d="M${FX} ${oy + SHEAR}H${FX + PL}" ${ink(2.5, 1, 'accent')} opacity="0"/>`}</g>`, pins];
  };
  const locks = OY.map(lock);
  let edge = '';
  for (let u = 0; u <= BL; u += 2) edge += `L${u} ${f2(-bitting(u))}`;
  const [l, t, r, b] = API;
  return `<svg class="pin-tumbler-art" viewBox="0 0 ${W} ${W}" aria-hidden="true" focusable="false">
<defs><radialGradient id="${id}-w"><stop offset="0" class="pin-tumbler-stop"/><stop offset="1" class="pin-tumbler-stop" stop-opacity="0"/></radialGradient>
<pattern id="${id}-h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V7" ${ink(0.75, 0.18)}/></pattern></defs>
<circle data-k="wash" cx="${FX + HW / 2}" cy="${OY[0] + 54}" r="112" class="pin-tumbler-wash" style="fill: url(#${id}-w)" opacity="0"/>
<g data-k="plane"><rect data-k="api" x="${l}" y="${t}" width="${r - l}" height="${b - t}" rx="10" ${ink(1, 0.5, 'boundary')} opacity="0"/>
${locks.map((lk) => lk[0]).join('')}
<g data-k="key"><circle cx="-26" cy="-19" r="16" ${ink(1.75, 1, 'tint')}/><circle cx="-31" cy="-19" r="4.5" ${ink(1.25, 1, 'accent pin-tumbler-paper')}/>
<path d="M-12 -40H0V-36${edge}L${BL - 3} 0H0V2H-12Z" ${ink(1.5, 1, 'tint')}/><path d="M0 -36${edge}" ${ink(2, 1, 'accent')}/></g>
${locks.map((lk) => lk[1]).join('')}
<g data-k="leaders" opacity="0">${Object.keys(LEADS).map((key) => `<g data-k="lead-${key}"><path ${ink(0.75, 0.45)}/><circle r="2" class="pin-tumbler-dot"/></g>`).join('')}</g></g></svg>`;
}

export default function engine(block, kit) {
  const {
    stage, place, parts, loop, pointer, reduceMotion,
  } = kit;
  stage.insertAdjacentHTML('beforeend', drawing(`pin-tumbler-${Math.random().toString(36).slice(2, 7)}`));
  const art = stage.lastElementChild;
  const all = (key) => [...art.querySelectorAll(`[data-k="${key}"]`)];
  const one = (key) => art.querySelector(`[data-k="${key}"]`);
  const [locks, outlines, bolts, stacks, springs, drivers, keypins] = ['lock', 'outline', 'bolt', 'stack',
    'spring', 'driver', 'keypin'].map(all);
  const [plane, key, plug, shear, blocked, wash, leaders, api] = ['plane', 'key', 'plug', 'shear', 'blocked',
    'wash', 'leaders', 'api'].map(one);

  const cache = new WeakMap();
  const set = (el, name, value) => {
    const c = cache.get(el) || {};
    const v = typeof value === 'number' ? value.toFixed(3) : value;
    if (c[name] !== v) {
      c[name] = v;
      cache.set(el, c);
      el.setAttribute(name, v);
    }
  };

  // the labels and their leaders; placed even before the stage has a size, since the kit moves
  // unplaced labels to the caption. A leader turns into a left label's first line; it rises to a
  // right label's foot, and runs along it if it starts short of the label. Strokes keep their
  // pixel weight at every size through --pin-tumbler-u (units per pixel).
  let k = 1;
  const ends = {};
  const layout = () => {
    const size = stage.clientWidth;
    if (size) k = size / W;
    art.style.setProperty('--pin-tumbler-u', f2(1 / k));
    const unit = size ? W / size : 0;
    Object.entries(LEADS).forEach(([name, { x, top, align = 'left' }]) => {
      const label = parts.get(name);
      if (!label) {
        one(`lead-${name}`)?.remove();
        return;
      }
      const h = (unit && label.offsetHeight * unit) || 44;
      const first = (unit && (label.firstElementChild?.offsetHeight || 0) * unit) || 22;
      ends[name] = align === 'left'
        ? { y: top + first / 2, x: x - 6 }
        : { y: top + h + 4, from: x - ((unit && label.offsetWidth * unit) || 160) + 4 };
      place(name, x, top + h / 2, W, align);
    });
  };
  const leader = (name, [fx, fy]) => {
    const g = one(`lead-${name}`);
    const end = ends[name];
    if (!g || !end) return;
    const run = end.x ?? (fx < end.from ? end.from : null);
    const d = `M${f2(fx)} ${f2(fy + (end.y > fy ? 5 : -5))}V${f2(end.y)}${run == null ? '' : `H${f2(run)}`}`;
    set(g.firstElementChild, 'd', d);
    set(g.lastElementChild, 'cx', f2(fx));
    set(g.lastElementChild, 'cy', f2(fy));
  };
  const leadAll = () => Object.entries(LEADS).forEach(([name, l]) => l.dot && leader(name, l.dot));

  const story = (tau) => {
    // the key: where its moves have taken it, and its two jiggles in the other tenant's lock
    let x = PARK;
    let level = 0;
    MOVES.forEach(([t0, len, axis, from, to]) => {
      if (tau < t0) return;
      const v = from + (to - from) * TRAVEL(span(tau, t0, len));
      if (axis === 'x') x = v;
      else level = v;
    });
    const y = OY[0] + BLADE + (OY[1] - OY[0]) * level;
    const wave = (t0) => Math.sin(2 * Math.PI * span(tau, t0, 0.2));
    const jig = TRIES.reduce((sum, t0) => sum + wave(t0), 0) * (-2 / k);
    // its own tenant's lock turns once every gap meets the shear line
    const back = tau >= 2.55;
    const turn = TURN * (back ? 1 - TRAVEL(span(tau, 2.55, 0.3)) : SNAP(span(tau, 1.75, 0.3)));
    const spin = `rotate(${f2(turn)} ${PIVOT[0]} ${PIVOT[1]}) `;
    set(key, 'transform', `${level ? '' : spin}translate(${f2(x)} ${f2(y + jig)})`);
    set(plug, 'transform', spin);
    set(shear, 'transform', spin);

    // each pin rides the key's bitting when the key is under it, else drops to rest
    OY.forEach((oy, j) => {
      const inThis = Math.abs(y - (oy + BLADE)) < 0.5;
      U.forEach((u, i) => {
        const n = j * U.length + i;
        const along = FX + u - x;
        const under = inThis && along >= 0 && along <= BL;
        const lift = under ? oy + BLADE + jig - bitting(along) : Infinity;
        const top = Math.min(oy + REST, lift) - PINS[j][i];
        // in the turning plug a key pin turns with it, and its driver rides the pin's top
        const [px, py] = j ? [FX + u, top] : turned(FX + u, top, turn);
        const coil = Math.max(1, py - DRIVER - oy - 4);
        set(keypins[n], 'transform', `${j ? '' : spin}translate(${FX + u} ${f2(top)})`);
        set(drivers[n], 'transform', `translate(${f2(px)} ${f2(py - DRIVER)})`);
        set(springs[n], 'transform', `translate(${f2(px)} ${oy + 4}) scale(1 ${f2(coil)})`);
        set(springs[n], 'opacity', 0.45 + 0.55 * clamp((coil - 4) / 16)); // a tight coil goes faint
      });
    });

    // the open lock: the shear line in the accent, the bolt snapped back, a breathing wash
    set(shear, 'opacity', ARRIVE(span(tau, 1.42, 0.7)) * (1 - LEAVE(span(tau, 2.6, 0.35))));
    const breath = 0.98 + 0.02 * Math.sin((2 * Math.PI * tau) / 1.7);
    set(wash, 'opacity', smooth(span(tau, 1.45, 0.6) * (1 - span(tau, 2.55, 0.5))) * breath);
    const open = tau < 2.55 ? SNAP(span(tau, 1.7, 0.26)) : 1 - TRAVEL(span(tau, 2.55, 0.3));
    set(bolts[0], 'transform', `translate(${f2(-24 * open)} 0)`);
    // the other: the blocking pins ticked in the accent, the bolt only jolts as the key jiggles
    const jolt = TRIES.reduce((sum, t0) => sum + Math.sin(Math.PI * span(tau, t0, 0.2)), 0);
    set(bolts[1], 'transform', `translate(${f2(-6 * jolt)} 0)`);
    set(blocked, 'opacity', clamp(SNAP(span(tau, 6.2, 0.22))) * (1 - span(tau, 6.75, 0.3)));

    // the claims leader drops to the key's bow while the key is up
    leader('claims', level ? [x - 26, y - 35] : turned(x - 26, y - 35, turn));
    const lead = one('lead-claims');
    if (lead) set(lead, 'opacity', 1 - clamp(level * 8));
  };

  // the intro: the housings draw on, the rest arrives, the key's moves spin up
  let introDone = false;
  const intro = (t) => {
    if (introDone) return;
    outlines.forEach((el, i) => {
      const len = 2 * (HW + 108) - 10;
      set(el, 'stroke-dasharray', `${len} ${len + 4}`);
      set(el, 'stroke-dashoffset', f2((1 - ARRIVE(span(t, i * 0.12, 0.8))) * len));
    });
    locks.forEach((g, i) => set(g, 'opacity', ARRIVE(span(t, 0.1 + i * 0.12, 0.8))));
    stacks.forEach((g, i) => set(g, 'opacity', ARRIVE(span(t, 0.3 + (i % 4) * 0.06, 0.8))));
    [[api, 0.36], [leaders, 0.7]].forEach(([el, at]) => set(el, 'opacity', ARRIVE(span(t, at, 0.8))));
    if (t < 1.2) set(key, 'opacity', ARRIVE(span(t, 0.4, 0.8)));
    if (t >= 2) {
      introDone = true;
      outlines.forEach((el) => ['stroke-dasharray', 'stroke-dashoffset'].forEach((a) => el.removeAttribute(a)));
    }
  };

  const ptr = pointer(stage);
  let tau = 0;
  let speed = 1;
  const draw = (t, dt) => {
    const still = reduceMotion();
    if (still) tau = STILL;
    else {
      ptr.update(dt);
      speed += ((ptr.over ? 1.4 : 1) - speed) * (1 - Math.exp(-dt * 3));
      tau = (tau + dt * smooth(clamp(t / 1.2)) * speed) % CYCLE;
    }
    story(tau);
    intro(still ? 99 : t);
    const m = still ? 0 : 3 / k; // a 3px parallax of the drawing (the labels hold still)
    set(plane, 'transform', `translate(${f2(ptr.x * m)} ${f2(ptr.y * m)})`);
  };

  layout();
  leadAll();
  const redraw = loop(stage, draw, { still: STILL });
  const ro = new ResizeObserver(() => {
    layout();
    leadAll();
    redraw();
  });
  ro.observe(stage);
  parts.forEach((label) => ro.observe(label));
}
