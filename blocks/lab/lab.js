/**
 * Lab: an interactive explainer panel (the explainer kit's lab): a bar, then two columns.
 * The variant names the engine that drives it.
 *
 * Rows: the bar (a label paragraph, a source link paragraph), then one row with the left and
 * right columns. Token engine, by content in each column:
 * - left: a list (one item per scenario, in the engine's order: valid, edited, own key,
 *   algorithm none, other site, expired), a label paragraph, the token paragraph, a label
 *   paragraph, the decoded JSON code block;
 * - right: the keys label, the keys row (inline code: kid, the key id, the modulus), the keys
 *   note, an ordered list of the four checks (bold title, then the note), the verdict
 *   paragraph shown without JavaScript.
 *
 * @variants token (default token)
 *   token - signs real RS256 tokens in the browser (Web Crypto) and runs the four checks of
 *   src/lib/google-token.js on each, same order, same messages
 * @ew-exempt <p> token, <pre> decoded JSON, the modulus code - derived, rewritten by the engine
 */

const VARIANTS = ['token'];

function slot(name, nodes) {
  const div = document.createElement('div');
  div.className = name;
  div.append(...nodes);
  return div;
}

const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });

function onceVisible(el, fn) {
  if (!('IntersectionObserver' in window)) {
    fn();
    return;
  }
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) {
      io.disconnect();
      fn();
    }
  }, { threshold: 0.45 });
  io.observe(el);
}

function splitToken(p) {
  const text = p.textContent;
  const parts = text.split('.');
  if (parts.length !== 3) return null;
  const segs = {};
  const kinds = ['h', 'p', 's'];
  const nodes = [];
  parts.forEach((part, i) => {
    const span = document.createElement('span');
    span.className = `seg seg-${kinds[i]}`;
    span.textContent = part;
    segs[kinds[i]] = span;
    nodes.push(span);
    if (i < 2) nodes.push('.');
  });
  p.replaceChildren(...nodes);
  return segs;
}

function legend() {
  const div = document.createElement('div');
  div.className = 'lab-legend';
  [['h', 'header'], ['p', 'payload'], ['s', 'signature']].forEach(([k, label]) => {
    const span = document.createElement('span');
    span.className = `key key-${k}`;
    span.textContent = label;
    div.append(span);
  });
  return div;
}

/** The token engine: js/explainers.js [data-lab], on the authored lab. */
function tokenEngine(lab, parts) {
  if (!window.crypto || !crypto.subtle) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CLIENT = 'demo-client.apps.googleusercontent.com';
  const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
  const enc = new TextEncoder();
  const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64uJson = (o) => b64u(enc.encode(JSON.stringify(o)));
  const fromB64u = (str) => {
    if (!/^[A-Za-z0-9_-]+$/.test(str)) throw new Error('invalid base64url input');
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  };
  const ALG = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
  const NAMES = ['valid', 'edited', 'own-key', 'alg-none', 'other-site', 'old'];
  const {
    chips, tokenEl, segs, decodedEl, verdict, verdictStatic, gates, modulus,
  } = parts;
  const buttons = [...chips.children];
  buttons.forEach((b, i) => { b.dataset.scenario = NAMES[i]; });
  let keys = null;
  let ready = null;
  let run = 0;

  const setup = async () => {
    const gen = () => crypto.subtle.generateKey({ ...ALG, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) }, true, ['sign', 'verify']);
    const [good, evil] = await Promise.all([gen(), gen()]);
    const jwk = await crypto.subtle.exportKey('jwk', good.publicKey);
    keys = {
      good,
      evil,
      jwks: {
        keys: [{
          kty: jwk.kty, n: jwk.n, e: jwk.e, kid: 'demo-key-1', alg: 'RS256', use: 'sig',
        }],
      },
    };
    if (modulus) modulus.textContent = `n: ${jwk.n.slice(0, 18)}…`;
  };

  const sign = async (header, payload, privateKey) => {
    const input = `${b64uJson(header)}.${b64uJson(payload)}`;
    const sig = await crypto.subtle.sign(ALG, privateKey, enc.encode(input));
    return `${input}.${b64u(sig)}`;
  };

  const scenario = async (name) => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', kid: 'demo-key-1', typ: 'JWT' };
    const payload = {
      iss: 'https://accounts.google.com', aud: CLIENT, sub: '110248495921238986420', email: 'trail.reader@example.com', name: 'Trail Reader', given_name: 'Trail', iat: now, exp: now + 3600,
    };
    const valid = await sign(header, payload, keys.good.privateKey);
    if (name === 'edited') {
      const [h, , s] = valid.split('.');
      return { token: `${h}.${b64uJson({ ...payload, name: 'Someone Else', given_name: 'Someone' })}.${s}`, changed: ['p'], hot: ['name'] };
    }
    if (name === 'own-key') return { token: await sign({ ...header, kid: 'attacker-key' }, payload, keys.evil.privateKey), changed: ['h', 's'], hot: ['kid'] };
    if (name === 'alg-none') {
      const [, p, s] = (await sign(header, payload, keys.evil.privateKey)).split('.');
      return { token: `${b64uJson({ ...header, alg: 'none' })}.${p}.${s}`, changed: ['h'], hot: ['alg'] };
    }
    if (name === 'other-site') return { token: await sign(header, { ...payload, aud: 'another-site.apps.googleusercontent.com' }, keys.good.privateKey), changed: [], hot: ['aud'] };
    if (name === 'old') return { token: await sign(header, { ...payload, iat: now - 7200, exp: now - 3600 }, keys.good.privateKey), changed: [], hot: ['exp'] };
    return { token: valid, changed: [], hot: [] };
  };

  // Mirrors verifyIdToken() and checkClaims(): same order, same messages.
  const verify = async (token, jwks) => {
    const steps = [];
    const [eh, ep, es] = token.split('.');
    const dec = new TextDecoder();
    const header = JSON.parse(dec.decode(fromB64u(eh)));
    const payload = JSON.parse(dec.decode(fromB64u(ep)));
    steps.push(['alg', 'h', header.alg !== 'RS256' ? `unsupported algorithm "${header.alg}"` : null]);
    if (steps[0][2]) return steps;
    const jwk = (jwks.keys || []).find((k) => k.kid === header.kid);
    steps.push(['kid', 'h', jwk ? null : `no published key matches kid "${header.kid}"`]);
    if (!jwk) return steps;
    const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e }, ALG, false, ['verify']);
    const ok = await crypto.subtle.verify(ALG, key, fromB64u(es), enc.encode(`${eh}.${ep}`));
    steps.push(['sig', 'hps', ok ? null : 'signature is invalid']);
    if (!ok) return steps;
    const now = Math.floor(Date.now() / 1000);
    const problems = [];
    if (!ISSUERS.includes(payload.iss)) problems.push(`issuer "${payload.iss}" is not trusted`);
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(CLIENT)) problems.push('audience does not match this client');
    if (typeof payload.exp !== 'number' || payload.exp + 60 < now) problems.push('token has expired');
    if (typeof payload.iat === 'number' && payload.iat - 60 > now) problems.push('token issued in the future');
    steps.push(['claims', 'p', problems.length ? problems.join('; ') : null, payload]);
    return steps;
  };

  const showDecoded = (token, hot, failedKey) => {
    const [eh, ep] = token.split('.');
    const dec = new TextDecoder();
    const header = JSON.parse(dec.decode(fromB64u(eh)));
    const p = JSON.parse(dec.decode(fromB64u(ep)));
    const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const field = (k, v) => {
      const val = typeof v === 'number' ? v : `"${esc(v)}"`;
      let cls = '';
      if (hot.includes(k)) cls = failedKey ? 'bad' : 'hot';
      return cls ? `<span class="${cls}">"${k}": ${val}</span>` : `"${k}": ${val}`;
    };
    const host = decodedEl.querySelector('code') || decodedEl;
    host.innerHTML = `{\n  "header": {\n    ${field('alg', header.alg)}, ${field('kid', header.kid)}\n  },\n  "payload": {\n    ${['iss', 'aud', 'email', 'name', 'exp'].map((k) => field(k, p[k])).join(',\n    ')}\n  }\n}`;
  };

  const play = async (name) => {
    run += 1;
    const id = run;
    buttons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.scenario === name)));
    Object.values(gates).forEach((g) => {
      g.dataset.state = '';
      g.querySelector('.lab-gate-msg')?.remove();
    });
    if (verdictStatic) verdictStatic.hidden = true;
    verdict.querySelectorAll('.lab-result').forEach((el) => el.remove());
    const checking = document.createElement('p');
    checking.className = 'lab-result';
    checking.textContent = 'Checking…';
    verdict.append(checking);
    ready = ready || setup();
    await ready;
    const { token, changed, hot } = await scenario(name);
    if (id !== run) return;
    const [h, p, s] = token.split('.');
    segs.h.textContent = h;
    segs.p.textContent = p;
    segs.s.textContent = s;
    Object.entries(segs).forEach(([k, el]) => el.classList.toggle('changed', changed.includes(k)));
    showDecoded(token, hot, false);
    let failed = null;
    let claims = null;
    const steps = await verify(token, keys.jwks);
    for (let i = 0; i < steps.length; i += 1) {
      const [gate, focus, error, payload] = steps[i];
      if (id !== run) return;
      const el = gates[gate];
      tokenEl.dataset.focus = focus;
      el.dataset.state = 'checking';
      // eslint-disable-next-line no-await-in-loop
      await wait(reduce ? 0 : 480);
      if (id !== run) return;
      el.dataset.state = error ? 'fail' : 'pass';
      if (error) {
        const msg = document.createElement('span');
        msg.className = 'lab-gate-msg';
        msg.textContent = error;
        el.append(msg);
        failed = error;
        break;
      }
      claims = payload;
    }
    if (id !== run) return;
    delete tokenEl.dataset.focus;
    Object.values(gates).forEach((g) => { if (!g.dataset.state) g.dataset.state = 'skip'; });
    if (failed) showDecoded(token, hot, true);
    checking.remove();
    const line = document.createElement('p');
    line.className = 'lab-result';
    const lead = document.createElement('span');
    const log = document.createElement('span');
    log.className = 'lab-result log';
    if (failed) {
      lead.className = 'no';
      lead.textContent = 'Anonymous visitor.';
      line.append(lead, ' The page renders the sign-in button.');
      log.textContent = `session cookie rejected: ${failed}`;
    } else {
      lead.className = 'ok';
      lead.textContent = `Signed in as ${claims.name}.`;
      line.append(lead, ' The greeting bar says hello, and the page is marked private.');
      log.textContent = 'verified by adapt-edge-function';
    }
    verdict.append(line, log);
  };

  parts.chipRow.setAttribute('aria-label', 'Pick a token');
  parts.chipRow.hidden = false;
  buttons.forEach((b) => {
    b.addEventListener('click', () => play(b.dataset.scenario));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        play(b.dataset.scenario);
      }
    });
  });
  // The verdict box keeps the height of the first check's result from the start, so the page
  // never shifts while the check runs (the source grows it, a layout shift).
  const reserve = () => {
    const probe = document.createElement('p');
    probe.className = 'lab-result lab-probe';
    const lead = document.createElement('span');
    lead.className = 'ok';
    lead.textContent = 'Signed in as Trail Reader.';
    probe.append(lead, ' The greeting bar says hello, and the page is marked private.');
    const log = document.createElement('span');
    log.className = 'lab-result log lab-probe';
    log.textContent = 'verified by adapt-edge-function';
    verdict.style.minHeight = '';
    const shown = [...verdict.children].filter((el) => !el.hidden);
    shown.forEach((el) => { el.hidden = true; });
    verdict.append(probe, log);
    const h = verdict.getBoundingClientRect().height;
    probe.remove();
    log.remove();
    shown.forEach((el) => { el.hidden = false; });
    if (h) verdict.style.minHeight = `${h}px`;
  };
  if ('ResizeObserver' in window) {
    let width = 0;
    new ResizeObserver(([e]) => {
      if (Math.round(e.contentRect.width) === width) return;
      width = Math.round(e.contentRect.width);
      reserve();
    }).observe(verdict);
  } else reserve();

  // The demo keys are made as soon as the lab is decorated, so the first check starts the
  // moment the lab is in view.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
  idle(() => { ready = ready || setup(); });
  onceVisible(lab, () => play('valid'));
}

function decorateLeft(cell) {
  const left = document.createElement('div');
  left.className = 'lab-left';
  const parts = {};
  [...cell.children].forEach((el) => {
    if (el.matches('ul, ol') && !parts.chips) {
      el.classList.add('lab-chips');
      el.setAttribute('role', 'none');
      [...el.children].forEach((li) => {
        li.setAttribute('role', 'radio');
        li.setAttribute('aria-checked', 'false');
        li.tabIndex = 0;
      });
      parts.chips = el;
      const row = slot('lab-chip-row', [el]);
      row.setAttribute('role', 'radiogroup');
      row.hidden = true;
      parts.chipRow = row;
      left.append(row);
    } else if (el.matches('pre')) {
      parts.decodedEl = el;
      left.append(slot('lab-json', [el]));
    } else if (el.tagName === 'P' && !parts.tokenEl && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(el.textContent.trim())) {
      parts.tokenEl = el;
      parts.segs = splitToken(el);
      left.append(slot('lab-token', [el]), legend());
    } else if (el.tagName === 'P') left.append(slot('lab-label', [el]));
    else left.append(el);
  });
  return { left, parts };
}

function decorateRight(cell) {
  const right = document.createElement('div');
  right.className = 'lab-right';
  const parts = {};
  const keys = document.createElement('div');
  keys.className = 'lab-keys';
  const verdict = document.createElement('div');
  verdict.className = 'lab-verdict';
  verdict.setAttribute('aria-live', 'polite');
  [...cell.children].forEach((el) => {
    if (el.matches('ol, ul')) {
      el.classList.add('lab-gates');
      parts.gates = {};
      const names = ['alg', 'kid', 'sig', 'claims'];
      [...el.children].forEach((li, i) => {
        li.dataset.gate = names[i] || `gate-${i}`;
        parts.gates[li.dataset.gate] = li;
      });
      right.append(slot('lab-checks', [el]));
    } else if (parts.gates) {
      const fallback = slot('lab-static', [el]);
      parts.verdictStatic = fallback;
      verdict.append(fallback);
    } else {
      if (!keys.children.length) keys.append(slot('lab-label', [el]));
      else if (el.querySelector('code') && !parts.modulus) {
        const codes = el.querySelectorAll('code');
        parts.modulus = codes[codes.length - 1];
        keys.append(slot('lab-keys-row', [el]));
      } else keys.append(slot('lab-keys-note', [el]));
      if (!keys.parentElement) right.append(keys);
    }
  });
  right.append(verdict);
  parts.verdict = verdict;
  return { right, parts };
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('token');
  const rows = [...block.querySelectorAll(':scope > div')];
  const frame = document.createElement('figure');
  frame.className = 'lab-frame';
  const barRow = rows.find((r) => r.children.length === 1);
  if (barRow) {
    const bar = document.createElement('div');
    bar.className = 'lab-bar';
    [...barRow.firstElementChild.children].forEach((el) => {
      el.classList.remove('text-link-wrapper');
      el.querySelector('a')?.classList.remove('text-link');
      bar.append(el);
    });
    frame.append(bar);
  }
  const gridRow = rows.find((r) => r.children.length > 1);
  if (gridRow) {
    const [l, r] = gridRow.children;
    const { left, parts: lp } = decorateLeft(l);
    const { right, parts: rp } = decorateRight(r);
    const grid = document.createElement('div');
    grid.className = 'lab-grid';
    grid.append(left, right);
    frame.append(grid);
    block.replaceChildren(frame);
    const parts = { ...lp, ...rp };
    if (block.classList.contains('token') && parts.chips && parts.segs && parts.gates) tokenEngine(block, parts);
  } else block.replaceChildren(frame);
}
