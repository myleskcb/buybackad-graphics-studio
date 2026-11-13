#!/usr/bin/env node
/* THE APPROVAL PAGE'S SERVER COPY, CHECKED (approve.html, /api/admin/approvals).
   The real function with a stand-in @netlify/blobs: nobody but an operator
   reads or writes the marks; a write keeps only lists of card ids; what was
   written is what is read back. usage: node scripts/approve_check.mjs */
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const ROOT = new URL('../', import.meta.url).pathname;
let bad = 0;
const ok = (t, what) => { if (!t){ bad++; console.log('FAIL  ' + what); } else console.log('ok    ' + what); };

const T = join(tmpdir(), 'approve-api-' + process.pid);
rmSync(T, { recursive: true, force: true });
mkdirSync(join(T, 'node_modules/@netlify/blobs'), { recursive: true });
cpSync(join(ROOT, 'netlify'), join(T, 'netlify'), { recursive: true });
writeFileSync(join(T, 'node_modules/@netlify/blobs/package.json'), JSON.stringify({ name: '@netlify/blobs', type: 'module', main: 'index.js' }));
writeFileSync(join(T, 'node_modules/@netlify/blobs/index.js'), [
  'const all = new Map();',
  'export const getStore = (o) => { const n = typeof o === "string" ? o : o.name; if (!all.has(n)) all.set(n, new Map()); const m = all.get(n);',
  '  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, delete: async (k) => { m.delete(k); }, list: async () => ({ blobs: [] }) }; };',
].join('\n'));
process.env.JWT_SECRET = 'approve-check-' + 'x'.repeat(32);
process.env.ADMIN_EMAILS = 'boss@studio.example';
const api = (await import(pathToFileURL(join(T, 'netlify/functions/api.mjs')).href)).default;
const hit = async (method, path, body, token) => {
  const res = await api(new Request('https://studio.example/api' + path, {
    method, headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
    body: body ? JSON.stringify(body) : undefined,
  }), {});
  return { status: res.status, j: await res.json().catch(() => ({})) };
};
const boss = (await hit('POST', '/auth/signup', { email: 'boss@studio.example', password: 'correct-horse-9' })).j.token;
const guest = (await hit('POST', '/auth/signup', { email: 'guest@studio.example', password: 'correct-horse-9' })).j.token;
ok(boss && guest, 'two accounts, one an operator');
ok((await hit('GET', '/admin/approvals')).status === 403, 'signed out: 403');
ok((await hit('GET', '/admin/approvals', null, guest)).status === 403, 'not an operator: 403 to read');
ok((await hit('PUT', '/admin/approvals', { commercial: [], hero: [], denied: [] }, guest)).status === 403, 'not an operator: 403 to write');
const empty = await hit('GET', '/admin/approvals', null, boss);
ok(empty.status === 200 && empty.j.approvals.ts === 0 && empty.j.approvals.hero.length === 0, 'nothing saved yet: empty lists, ts 0');
ok((await hit('PUT', '/admin/approvals', { commercial: 'x' }, boss)).status === 400, 'a body that is not three lists: 400');
const put = await hit('PUT', '/admin/approvals', { commercial: ['stepsFlow-nn01-20', 'stepsFlow-nn01-20', '<script>', 7], hero: ['voltStack-io06-35', 'stepsFlow-nn01-20'], denied: ['checklistHero-jw05-30'], by: 'someone-else' }, boss);
ok(put.status === 200 && put.j.ts > 0, 'an operator saves');
const got = (await hit('GET', '/admin/approvals', null, boss)).j.approvals;
ok(JSON.stringify(got.commercial) === '["stepsFlow-nn01-20"]', 'only card ids are kept, once each');
ok(JSON.stringify(got.hero) === '["voltStack-io06-35","stepsFlow-nn01-20"]', 'the hero order is kept');
ok(got.denied[0] === 'checklistHero-jw05-30' && got.by === 'boss@studio.example' && got.ts === put.j.ts, 'read back as written, signed by the operator');

/* the page's files, and the wall's list still in the shape the wall reads */
for (const f of ['approve.html', 'approve.js', 'approve.css', 'assets/commercial-picks.json']) ok(readFileSync(ROOT + f, 'utf8').length > 0, f + ' is there');
ok(!/<script(?![^>]*\bsrc=)/.test(readFileSync(ROOT + 'approve.html', 'utf8')), 'approve.html has no inline script (CSP)');
for (const f of ['assets/hero-picks.json', 'assets/commercial-picks.json']) ok(Array.isArray(JSON.parse(readFileSync(ROOT + f, 'utf8')).picks), f + ' has a picks list');
for (const f of ['netlify.toml', '_headers', 'robots.txt']) ok(readFileSync(ROOT + f, 'utf8').includes('/approve.html'), f + ' keeps the page out of search');

rmSync(T, { recursive: true, force: true });
console.log(bad ? '\n' + bad + ' FAILED' : '\nall passed');
process.exit(bad ? 1 : 0);
