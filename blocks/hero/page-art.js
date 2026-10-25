/* eslint-disable */
/* Continuous, theme-aware geometric fields. No dependencies or content rendering.
   Ported from js/page-art.js on the source site: the hero section is passed in instead of
   looked up, and the canvas carries the hero-art class. Decorative only (aria-hidden), started
   by hero.js after load, and it paints nothing under reduced motion. */
export default function paintArt(hero, kind) {
  'use strict';
  if (!hero || hero.querySelector(':scope > .hero-art')) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'hero-art';
  canvas.setAttribute('aria-hidden', 'true');
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  hero.prepend(canvas);

  var copyMask = document.createElement('canvas');
  var mask = copyMask.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var visible = true, raf = 0, previous = 0, elapsed = 0;
  var width = 0, height = 0, cx = 0, cy = 0, radius = 0, boxes = [], colors = [];

  function readColors() {
    var styles = getComputedStyle(hero);
    colors = ['--color-accent', '--color-project-cyan', '--color-project-amber'].map(function (token) {
      return styles.getPropertyValue(token).trim();
    });
    paint(elapsed);
  }
  function line(points, color, alpha, close, fill) {
    ctx.beginPath();
    points.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    if (close) ctx.closePath();
    ctx.strokeStyle = colors[color % colors.length];
    ctx.lineWidth = 1;
    if (fill) {
      ctx.fillStyle = ctx.strokeStyle;
      ctx.globalAlpha = fill;
      ctx.fill();
    }
    ctx.globalAlpha = alpha;
    ctx.stroke();
  }
  function project(x, y, z, ax, ay, scale) {
    var yy = y * Math.cos(ax) - z * Math.sin(ax);
    var zz = y * Math.sin(ax) + z * Math.cos(ax);
    var xx = x * Math.cos(ay) + zz * Math.sin(ay);
    var depth = -x * Math.sin(ay) + zz * Math.cos(ay);
    return [cx + xx * scale, cy + yy * scale, depth];
  }
  // A toroidal weave: the surface turns slowly, while the threads stay continuous.
  function orbit(t) {
    for (var j = 0; j < 22; j++) {
      var phi = j / 22 * Math.PI * 2 + t * .075;
      var points = [];
      for (var i = 0; i <= 120; i++) {
        var a = i / 120 * Math.PI * 2;
        var r = .72 + .24 * Math.cos(phi);
        points.push(project(r * Math.cos(a), r * Math.sin(a), .24 * Math.sin(phi), .92 + Math.sin(t * .07) * .2, -.4 + t * .025, radius));
      }
      line(points, j < 14 ? 0 : 1, .13 + .09 * (1 + Math.sin(phi)) / 2, true);
    }
  }
  // Three open ink gestures: broad, independent curves with a travelling glint.
  // Their spacing and opacity follow the portfolio's quiet signal field.
  function ink(t) {
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.6);
    glow.addColorStop(0, colors[0]);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.globalAlpha = .065;
    ctx.fillRect(0, 0, width, height);
    for (var j = 0; j < 3; j++) {
      var phase = t * .12 + j * 1.8;
      var spread = (j - 1) * radius * .35;
      var points = [];
      for (var i = 0; i <= 160; i++) {
        var u = i / 160, v = 1 - u;
        var x = v * v * v * -40
          + 3 * v * v * u * (cx - radius * .55)
          + 3 * v * u * u * (cx - radius * .55)
          + u * u * u * (width + 40);
        var y = v * v * v * (cy + radius * .8 + spread)
          + 3 * v * v * u * (cy + radius * .85 + spread)
          + 3 * v * u * u * (cy - radius * .85 + spread)
          + u * u * u * (cy - radius * .75 + spread);
        y += Math.sin(u * Math.PI) * Math.sin(phase + u * 3) * radius * .12;
        points.push([x, y]);
      }
      line(points, j, .17, false);
      // A short stroke of light follows each curve; it fades before wrapping.
      var travel = (t * .018 + j * .31) % 1;
      var index = Math.floor(travel * 152);
      line(points.slice(index, index + 9), j, Math.sin(travel * Math.PI) * .32, false);
    }
  }
  // Elliptical wavefronts continuously arrive and dissolve, without a hard restart.
  function waves(t) {
    for (var j = 0; j < 11; j++) {
      var phase = (j / 11 + t * .024) % 1;
      var r = radius * (.1 + phase * 1.65);
      var points = [];
      for (var i = 0; i <= 140; i++) {
        var a = i / 140 * Math.PI * 2;
        var x = Math.cos(a) * r, y = Math.sin(a) * r * .72;
        points.push([cx + x * .94 + y * .34, cy - x * .34 + y * .94]);
      }
      line(points, j % 3, Math.pow(Math.sin(phase * Math.PI), 2) * .28, true);
    }
  }
  var golden = (1 + Math.sqrt(5)) / 2;
  var vertices = [];
  [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) {
    vertices.push([0, a, b * golden], [a, b * golden, 0], [b * golden, 0, a]);
  }); });
  var edges = [], faces = [];
  function adjacent(a, b) { return Math.abs(vertices[a].reduce(function (sum, v, k) { return sum + Math.pow(v - vertices[b][k], 2); }, 0) - 4) < .001; }
  vertices.forEach(function (_, a) { for (var b = a + 1; b < vertices.length; b++) {
    if (!adjacent(a, b)) continue;
    edges.push([a, b]);
    for (var c = b + 1; c < vertices.length; c++) if (adjacent(a, c) && adjacent(b, c)) faces.push([a, b, c]);
  } });
  function crystal(t) {
    var points = vertices.map(function (p) { return project(p[0], p[1], p[2], .35 + t * .047, .3 + t * .085, radius * .49); });
    faces.map(function (face) { return { p: face.map(function (i) { return points[i]; }), z: face.reduce(function (sum, i) { return sum + points[i][2]; }, 0) }; })
      .sort(function (a, b) { return a.z - b.z; }).forEach(function (face, i) {
        line(face.p, i < 10 ? 1 : 0, 0, true, face.z > 0 ? .025 : .008);
      });
    edges.forEach(function (edge, i) {
      var a = points[edge[0]], b = points[edge[1]];
      line([a, b], i % 7 === 0 ? 2 : 0, .12 + (a[2] + b[2] + 4) / 8 * .22);
    });
    // A larger, very quiet construction shell lends depth to the turning facets.
    edges.forEach(function (edge) {
      line(edge.map(function (i) { return [cx + (points[i][0] - cx) * 1.19, cy + (points[i][1] - cy) * 1.19]; }), 1, .055);
    });
  }
  function protectCopy() {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(copyMask, 0, 0, width, height);
    ctx.restore();
  }
  function paint(t) {
    if (!width || !colors.length) return;
    ctx.clearRect(0, 0, width, height);
    if (reduced.matches) return;
    ({ home: orbit, writing: ink, talks: waves, certifications: crystal })[kind](t);
    protectCopy();
  }
  function resize() {
    var rect = hero.getBoundingClientRect();
    var space = hero.querySelector('.hero-art-space').getBoundingClientRect();
    width = rect.width; height = rect.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = space.left - rect.left + space.width * .52;
    cy = space.top - rect.top + space.height * .5;
    radius = kind === 'home' ? Math.min(330, width * .3) : Math.min(310, width * .28);
    if (width <= 760) radius = kind === 'home' ? 125 : 180;
    boxes = [];
    function addBox(b) { boxes.push({ x: b.left - rect.left, y: b.top - rect.top, w: b.width, h: b.height }); }
    hero.querySelectorAll('h1, p, .breadcrumb').forEach(function (el) {
      if (el.closest('.hero-note')) return;
      // Range rectangles follow actual text lines, not the full block width.
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue;
        var range = document.createRange();
        range.selectNodeContents(node);
        Array.from(range.getClientRects()).forEach(addBox);
      }
    });
    var note = hero.querySelector('.hero-note');
    if (note) addBox(note.getBoundingClientRect());
    // Cache the soft exclusion mask; animation frames never measure layout or blur.
    copyMask.width = canvas.width; copyMask.height = canvas.height;
    mask.setTransform(dpr, 0, 0, dpr, 0, 0);
    mask.fillStyle = '#000';
    mask.filter = 'blur(14px)';
    boxes.forEach(function (b) { mask.fillRect(b.x - 12, b.y - 10, b.w + 24, b.h + 20); });
    mask.filter = 'none';
    boxes.forEach(function (b) { mask.fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6); });
    paint(elapsed);
  }
  function frame(now) {
    raf = 0;
    if (previous && now - previous < 32) { raf = requestAnimationFrame(frame); return; }
    if (previous) elapsed += Math.min(now - previous, 80) / 1000;
    previous = now;
    paint(elapsed);
    raf = requestAnimationFrame(frame);
  }
  function syncMotion() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0; previous = 0;
    if (!reduced.matches && visible && !document.hidden) raf = requestAnimationFrame(frame);
    else paint(elapsed);
  }
  reduced.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; syncMotion(); }).observe(hero);
  new ResizeObserver(resize).observe(hero);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-theme-effective'] });
  if (document.fonts) document.fonts.ready.then(resize);
  readColors(); resize(); syncMotion();
}
