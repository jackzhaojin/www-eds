import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/*
 * The theme contract (since v1.4.0): blocks read only semantic tokens, and every brand maps each
 * semantic token for every appearance. Then any page can take any brand, in light, dark or System.
 */
const ROOT = new URL('..', import.meta.url).pathname;
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const styles = read('styles/styles.css');
const adobe = read('styles/themes/adobe.css');

/** The custom properties a rule declares, by its exact selector text. */
function declared(css, selector) {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at >= 0, `no rule ${selector}`);
  const body = css.slice(at + selector.length + 2, css.indexOf('}', at));
  return new Set([...body.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
}

const jack = {
  light: declared(styles, ':root, [data-theme="light"]'),
  dark: declared(styles, '[data-theme="dark"]'),
  system: declared(styles, '  :root:not([data-theme="light"]):not([data-theme="dark"])'),
};

// tokens a brand may leave to v3: status tones, the categorical topic and project colors, the
// band tint strengths
const INHERITED = /^--(color-(topic-(aem|agents|work)|project-[\w-]+|danger|success|warning)|band-tint-[\w-]+)$/;
const required = [...jack.light].filter((t) => !INHERITED.test(t));

test('Jack\'s appearances declare the same tokens', () => {
  assert.deepEqual([...jack.dark].sort(), [...jack.light].sort());
  assert.deepEqual([...jack.system].sort(), [...jack.dark].sort());
});

test('the adobe brand maps every semantic token in every appearance', () => {
  const brand = {
    light: declared(adobe, ':root[data-brand="adobe"],\n[data-brand="adobe"] [data-theme="light"]'),
    dark: declared(adobe, ':root[data-brand="adobe"][data-theme="dark"],\n[data-brand="adobe"] [data-theme="dark"]'),
    system: declared(adobe, '  :root[data-brand="adobe"]:not([data-theme="light"]):not([data-theme="dark"])'),
  };
  Object.entries(brand).forEach(([appearance, tokens]) => {
    const missing = required.filter((t) => !tokens.has(t));
    assert.deepEqual(missing, [], `adobe ${appearance} is missing ${missing.join(', ')}`);
  });
  assert.deepEqual([...brand.system].sort(), [...brand.dark].sort(), 'System dark and Dark must match');
});

test('no block, template or shared style reads a primitive', () => {
  const walk = (dir) => readdirSync(join(ROOT, dir)).flatMap((f) => {
    const path = join(dir, f);
    return statSync(join(ROOT, path)).isDirectory() ? walk(path) : [path];
  });
  const files = ['blocks', 'templates', 'styles'].flatMap(walk).filter((f) => f.endsWith('.css'));
  const leaks = files.flatMap((file) => {
    let css = read(file);
    // the token layer itself: styles.css up to the end of its tokens, and each brand's file
    if (file === 'styles/styles.css') css = css.slice(css.indexOf('/* stylelint-enable */'));
    if (file.startsWith('styles/themes/') || file === 'styles/fonts.css') return [];
    return [...css.matchAll(/var\(--palette-[\w-]+/g)].map((m) => `${file}: ${m[0]})`);
  });
  assert.deepEqual(leaks, []);
});
