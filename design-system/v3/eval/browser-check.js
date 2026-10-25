// Browser quality gates from SPEC.md section 10. Run with:
//   playwright-cli -s=eval --raw run-code --filename=eval/browser-check.js > eval/results-browser.json   (from design-systems/v3/)
// Expects the repo root served at http://127.0.0.1:8790 (python3 -m http.server 8790 --directory <repo root>).
async (page) => {
  const BASE = 'http://127.0.0.1:8790/design-systems/';
  const SLUGS = ['v3'];
  const PAGES = ['index.html', 'templates/home.html', 'templates/post.html', 'templates/blog.html'];
  const WIDTHS = [390, 768, 1024, 1440, 1920, 2560];
  const PAIRS = [['--color-text', '--color-bg', 4.5], ['--color-text', '--color-surface', 4.5], ['--color-text-muted', '--color-bg', 4.5],
    ['--color-text-muted', '--color-surface', 4.5], ['--color-text-faint', '--color-bg', 4.5], ['--color-accent', '--color-bg', 4.5],
    ['--color-on-accent', '--color-accent', 4.5], ['--color-inverse-text', '--color-inverse-bg', 4.5], ['--color-line-strong', '--color-bg', 3]];
  const out = [];
  const contrastFn = `(() => {
    function parse(c){ c=c.trim(); const m=c.match(/^#([0-9a-f]{3,8})$/i); if(m){ let h=m[1]; if(h.length===3||h.length===4) h=h.split('').map(x=>x+x).join(''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16), h.length===8?parseInt(h.slice(6,8),16)/255:1]; }
      const k=c.match(/color\\(srgb\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)(?:\\s*\\/\\s*([\\d.]+))?\\)/); if(k) return [parseFloat(k[1])*255, parseFloat(k[2])*255, parseFloat(k[3])*255, k[4]!==undefined?parseFloat(k[4]):1]; const r=c.match(/rgba?\\(([^)]+)\\)/); if(r){ const p=r[1].split(',').map(s=>parseFloat(s)); return [p[0],p[1],p[2], p.length>3?p[3]:1]; } return null; }
    function blend(fg,bg){ const a=fg[3]; return [fg[0]*a+bg[0]*(1-a), fg[1]*a+bg[1]*(1-a), fg[2]*a+bg[2]*(1-a),1]; }
    function lum(c){ const f=v=>{v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]); }
    return (fgVar,bgVar) => { const cs=getComputedStyle(document.documentElement); const el=document.createElement('div'); document.body.appendChild(el);
      el.style.color='var('+fgVar+')'; el.style.backgroundColor='var('+bgVar+')'; const st=getComputedStyle(el); let fg=parse(st.color), bg=parse(st.backgroundColor); el.remove();
      if(!fg||!bg) return null; const pageBg=parse(getComputedStyle(document.body).backgroundColor)||[255,255,255,1]; if(bg[3]<1) bg=blend(bg,pageBg); if(fg[3]<1) fg=blend(fg,bg);
      const l1=lum(fg), l2=lum(bg); return Math.round(((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05))*100)/100; };
  })()`;
  for (const slug of SLUGS) {
    const r = {
      slug, pages: {}, theme: {}, contrast: {}, nojs: {}, darkStory: {}, bands: {},
    };
    for (const p of PAGES) {
      const pr = {};
      for (const w of WIDTHS) {
        await page.setViewportSize({ width: w, height: 900 });
        try {
          await page.goto(`${BASE + slug}/${p}`, { waitUntil: 'load', timeout: 20000 });
          await page.waitForTimeout(300);
          pr[w] = await page.evaluate((w) => {
            const c = document.querySelector('.site-header .container') || document.querySelector('main .container') || document.querySelector('.container');
            const rect = c ? c.getBoundingClientRect() : null;
            const left = rect ? rect.left : null; const
              right = rect ? window.innerWidth - rect.right : null;
            return {
              overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
              h1: document.querySelectorAll('h1').length,
              centered: rect ? Math.abs(left - right) <= 2 : null,
              left,
              right,
              containerWidth: rect ? Math.round(rect.width) : null,
            };
          }, w);
        } catch (e) { pr[w] = { error: e.message.slice(0, 80) }; }
      }
      r.pages[p] = pr;
    }
    // theme behaviour on home template
    await page.setViewportSize({ width: 1440, height: 900 });
    const home = `${BASE + slug}/templates/home.html`;
    try {
      await page.goto(home); await page.evaluate(() => localStorage.removeItem('jj-theme')); await page.reload();
      const t = {};
      t.defaultLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'light');
      await page.click('[data-set-theme="dark"]'); t.clickDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
      await page.reload(); t.persists = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark' && localStorage.getItem('jj-theme') === 'dark');
      await page.click('[data-set-theme="system"]'); t.systemRemovesAttr = await page.evaluate(() => !document.documentElement.hasAttribute('data-theme'));
      await page.emulateMedia({ colorScheme: 'dark' }); await page.reload(); await page.waitForTimeout(200);
      t.systemFollowsDark = await page.evaluate(() => { const bg = getComputedStyle(document.body).backgroundColor; const m = bg.match(/\d+/g); return m ? (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3 < 100 : null; });
      await page.emulateMedia({ colorScheme: 'light' });
      // contrast in both themes
      for (const theme of ['light', 'dark']) {
        await page.evaluate((th) => document.documentElement.setAttribute('data-theme', th), theme);
        await page.waitForTimeout(50);
        r.contrast[theme] = await page.evaluate(([fn, pairs]) => {
          const c = eval(fn); return pairs.map(([fg, bg, min]) => {
            const v = c(fg, bg); return {
              pair: `${fg} on ${bg}`, ratio: v, min, pass: v !== null && v >= min,
            };
          });
        }, [contrastFn, PAIRS]);
      }
      await page.evaluate(() => localStorage.removeItem('jj-theme'));
      r.theme = t;
    } catch (e) { r.theme = { error: e.message.slice(0, 120) }; }
    // no-JS check on post template
    try {
      const ctx = await page.context().browser().newContext({ javaScriptEnabled: false, viewport: { width: 1024, height: 900 } });
      const p2 = await ctx.newPage(); await p2.goto(`${BASE + slug}/templates/post.html`, { waitUntil: 'load' });
      r.nojs = await p2.evaluate(() => {
        const vis = (sel) => { const el = document.querySelector(sel); if (!el) return false; const st = getComputedStyle(el); return st.display !== 'none' && st.visibility !== 'hidden' && parseFloat(st.opacity) > 0.9 && el.getBoundingClientRect().height > 0; };
        return {
          summary: vis('.summary'), facts: vis('.facts'), firstSection: vis('main h2'), nav: vis('.site-nav'), transcriptInDom: !!document.querySelector('.transcript'),
        };
      });
      await ctx.close();
    } catch (e) { r.nojs = { error: e.message.slice(0, 120) }; }
    // Bands: full bleed at three widths, distinct grounds per theme, text contrast on tint and inverse bands
    try {
      const bandProbe = () => {
        function parse(c) { const k = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/); if (k) return [parseFloat(k[1]) * 255, parseFloat(k[2]) * 255, parseFloat(k[3]) * 255, k[4] !== undefined ? parseFloat(k[4]) : 1]; const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
        function lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
        function blend(fg, bg) { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; }
        function ratio(fg, bg) {
          if (fg[3] < 1) fg = blend(fg, bg); const l1 = lum(fg); const
            l2 = lum(bg); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
        }
        const pageBg = parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1];
        const bands = [...document.querySelectorAll('.band')];
        const grounds = new Set(); const narrow = []; const contrast = [];
        bands.forEach((b, i) => {
          const rect = b.getBoundingClientRect(); if (Math.abs(rect.width - window.innerWidth) > 1) narrow.push({ i, width: Math.round(rect.width) });
          const cs = getComputedStyle(b); const before = getComputedStyle(b, '::before');
          grounds.add(`${cs.backgroundColor}|${before.backgroundImage !== 'none' ? before.backgroundImage.slice(0, 80) : ''}|${(b.className.match(/band--[a-z]+/g) || []).join(',')}`);
          const el = b.querySelector('h2, h3, p'); if (!el) return;
          const fg = parse(getComputedStyle(el).color); if (!fg) return;
          let bg = parse(cs.backgroundColor); if (!bg || bg[3] === 0) bg = pageBg; else if (bg[3] < 1) bg = blend(bg, pageBg);
          if (b.classList.contains('band--tint') || b.classList.contains('band--milestone')) {
            const probe = document.createElement('div'); probe.style.color = 'var(--band-accent, var(--color-accent))'; b.appendChild(probe);
            const acc = parse(getComputedStyle(probe).color); probe.remove();
            const pct = parseFloat(cs.getPropertyValue('--band-tint-strong')) || 7;
            if (acc) bg = blend([acc[0], acc[1], acc[2], pct / 100], bg);
          }
          const rr = ratio(fg, bg); contrast.push({
            i, variant: (b.className.match(/band--[a-z]+/g) || ['plain']).join(','), ratio: rr, pass: rr >= 4.5,
          });
          if (b.classList.contains('band--inverse')) {
            b.querySelectorAll('.btn--primary').forEach((btn) => {
              const bb = parse(getComputedStyle(btn).backgroundColor); const bandBg = parse(cs.backgroundColor) || pageBg; const visible = bb && bb[3] > 0 && ratio(bb, bandBg) >= 3; contrast.push({
                i, variant: 'inverse button', ratio: bb ? ratio(bb, bandBg) : 0, pass: !!visible,
              });
            });
          }
        });
        return {
          count: bands.length, distinct: grounds.size, narrow, contrast,
        };
      };
      const home = `${BASE + slug}/templates/home.html`;
      const bandsOut = { widths: {}, themes: {} };
      for (const w of [390, 1440, 2560]) { await page.setViewportSize({ width: w, height: 900 }); await page.goto(home, { waitUntil: 'load' }); await page.waitForTimeout(200); const v = await page.evaluate(bandProbe); bandsOut.widths[w] = { count: v.count, narrow: v.narrow }; }
      await page.setViewportSize({ width: 1440, height: 900 });
      for (const th of ['light', 'dark']) { await page.goto(home, { waitUntil: 'load' }); await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), th); await page.waitForTimeout(150); const v = await page.evaluate(bandProbe); bandsOut.themes[th] = { count: v.count, distinct: v.distinct, contrast: v.contrast }; }
      r.bands = bandsOut;
    } catch (e) { r.bands = { error: e.message.slice(0, 120) }; }
    // Dark story frames: every text node inside a .story[data-theme="dark"] on the docs page meets 4.5:1
    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE + slug}/index.html`, { waitUntil: 'load' });
      r.darkStory = await page.evaluate(() => {
        function parse(c) { const k = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/); if (k) return [parseFloat(k[1]) * 255, parseFloat(k[2]) * 255, parseFloat(k[3]) * 255, k[4] !== undefined ? parseFloat(k[4]) : 1]; const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
        function lum(c) { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }
        function blend(fg, bg) { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; }
        function effBg(el) {
          let e = el; const
            stack = []; while (e && e !== document.documentElement) { const b = parse(getComputedStyle(e).backgroundColor); if (b && b[3] > 0) { stack.push(b); if (b[3] >= 1) break; } e = e.parentElement; } if (!stack.length || stack[stack.length - 1][3] < 1) { stack.push(parse(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1]); } let bg = stack.pop(); while (stack.length) { bg = blend(stack.pop(), bg); } return bg;
        }
        function ratio(fg, bg) {
          if (fg[3] < 1) fg = blend(fg, bg); const l1 = lum(fg); const
            l2 = lum(bg); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
        }
        const frames = [...document.querySelectorAll('.story[data-theme="dark"]')]; const fails = []; let checked = 0;
        frames.forEach((fr) => {
          const sec = fr.closest('[id^="c-"], section'); const sid = sec ? sec.id : '?';
          const els = [...fr.querySelectorAll('*')].filter((e) => !e.closest('[aria-hidden="true"]') && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1));
          els.forEach((e) => {
            const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return; const fg = parse(cs.color); if (!fg) return; const rr = ratio(fg, effBg(e)); checked++;
            if (rr < 4.5) {
              fails.push({
                section: sid, el: e.tagName.toLowerCase() + (e.className ? `.${String(e.className).split(' ')[0]}` : ''), text: e.textContent.trim().slice(0, 40), ratio: rr,
              });
            }
          });
        });
        return { frames: frames.length, checked, fails };
      });
    } catch (e) { r.darkStory = { error: e.message.slice(0, 120) }; }
    out.push(r);
  }
  return JSON.stringify(out);
};
