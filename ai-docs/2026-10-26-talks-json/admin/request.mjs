// Executes one recorded Admin API request. Authentication is never recorded.
/* eslint-env node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [requestFile, responseFile] = process.argv.slice(2);
if (!requestFile || !responseFile) throw new Error('Expected request and response file paths');
const request = JSON.parse(fs.readFileSync(requestFile, 'utf8'));
const url = new URL(request.url);
if (!['admin.hlx.page', 'admin.da.live'].includes(url.hostname)) throw new Error('Unexpected Admin host');
const cached = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.aem/da-token.json'), 'utf8'));
if (!(cached.expires_at > Date.now() + 60000)) throw new Error('DA token expired; Jack must sign in');
const headers = { Authorization: `Bearer ${cached.access_token}` };
let body;
if (request.bodyFile) {
  const bytes = fs.readFileSync(request.bodyFile);
  if (request.multipart) {
    body = new FormData();
    body.append('data', new Blob([bytes], { type: request.contentType }), path.basename(request.bodyFile));
  } else {
    body = bytes;
    headers['Content-Type'] = request.contentType;
  }
}
const response = await fetch(url, {
  method: request.method, headers, body, redirect: 'error',
});
fs.mkdirSync(path.dirname(responseFile), { recursive: true });
fs.writeFileSync(responseFile, await response.text());
fs.writeFileSync(`${responseFile}.status.json`, `${JSON.stringify({
  method: request.method,
  url: url.href,
  status: response.status,
  checkedAt: new Date().toISOString(),
}, null, 2)}\n`);
// eslint-disable-next-line no-console
console.log(`${request.method} ${url.pathname}: HTTP ${response.status}`);
if (!response.ok) process.exitCode = 1;
