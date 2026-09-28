#!/usr/bin/env node
/* Does every design decision in app.js go through the console?

   Three checks, all static, no browser:
     1. every `pgfxFlag('x')` / `runPass('x', …)` id in app.js is registered
        in flags.js, and every registered id is consulted by app.js;
     2. every pass invoked in the TEMPLATE PASSES block at the end of app.js
        goes through runPass() (a bare `TEMPLATES.forEach(t => pass(t))` there
        is invisible to the console and to the run log: DESIGN-LAW rule 42);
     3. every hash of a template id takes the salt (`pgfxHashId`), so the
        "Reshuffle" switch really moves every hashed choice.

   usage: node scripts/flag_audit.mjs     exits non-zero on any finding. */
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const app = readFileSync(root + 'app.js', 'utf8');
const flags = readFileSync(root + 'flags.js', 'utf8');

const registered = new Set([...flags.matchAll(/\{\s*id:'([A-Za-z]+)'/g)].map(m => m[1]));
const consulted = new Set([...app.matchAll(/(?:pgfxFlag|runPass)\('([A-Za-z]+)'/g)].map(m => m[1]));
// build-phase entries are pushed to the log by id list, and count as consulted
[...app.matchAll(/\['tameAccents'[^\]]*\]/g)].forEach(m => m[0].match(/'([A-Za-z]+)'/g).forEach(q => consulted.add(q.replace(/'/g, ''))));

const findings = [];
for (const id of consulted) if (!registered.has(id)) findings.push(`app.js consults '${id}' but flags.js does not register it`);
for (const id of registered) if (!consulted.has(id)) findings.push(`flags.js registers '${id}' but nothing in app.js consults it`);

// 2. the chain block
const start = app.indexOf('TEMPLATE PASSES');
const chain = start < 0 ? '' : app.slice(start);
if (!chain) findings.push('could not find the TEMPLATE PASSES block');
for (const m of chain.matchAll(/^TEMPLATES\.forEach\(t => ([A-Za-z]+)\(/gm)) findings.push(`chain pass '${m[1]}' bypasses runPass()`);
const chainPasses = [...chain.matchAll(/^runPass\('([A-Za-z]+)'/gm)].map(m => m[1]);
// every function the chain calls must also exist (the rule-42 failure mode)
for (const m of chain.matchAll(/^runPass\('[A-Za-z]+',\s*t => ([A-Za-z]+)\(/gm)) {
  if (!new RegExp(`^function ${m[1]}\\(`, 'm').test(app)) findings.push(`chain calls ${m[1]}() which has no definition`);
}

// 3. hashes take the salt
for (const m of app.matchAll(/t\.id\.charCodeAt/g)) findings.push('a template-id hash bypasses pgfxHashId: ' + app.slice(m.index - 60, m.index + 20).replace(/\s+/g, ' '));

const chainRegistered = [...flags.matchAll(/\{\s*id:'([A-Za-z]+)',\s*group:'chain'/g)].map(m => m[1]).filter(id => !/styleForce|traitsAfterChain/.test(id));
const inOrder = JSON.stringify(chainRegistered) === JSON.stringify(chainPasses);
if (!inOrder) findings.push(`flags.js chain order differs from app.js run order:\n   flags: ${chainRegistered.join(' ')}\n   app:   ${chainPasses.join(' ')}`);

console.log(`registered ${registered.size} switches · consulted ${consulted.size} · chain passes ${chainPasses.length} (${inOrder ? 'in registry order' : 'ORDER MISMATCH'})`);
if (findings.length) { console.error('\n' + findings.map(f => ' ✗ ' + f).join('\n')); process.exit(1); }
console.log(' ✓ every switch is consulted, every pass is registered, every hash is salted');
