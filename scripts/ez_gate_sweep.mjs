#!/usr/bin/env node
/* EASY MODE THROUGH THE GATE: every template the studio offers, drawn the
   way a visitor sees it (renderEzCanvas, the number typed in) and measured by
   pgCheck, the one measure (rule 87).

   The classics gate (verify_showcase --classics) prepares a template the
   gallery's way; Easy Mode also grows the number to fill its band
   (numberFill), and on 2026-09-29 that ran it off the guides on 7 of 20
   street cards and the offer cards, which the classics gate never saw
   (DESIGN-LAW 74, OPEN-ITEMS §S 10). --nofill measures without the number
   fill, to tell its failures from the card's own.

   usage:  python3 -m http.server 8899   then
           CHROME=... [FABRIC_JS=...] node scripts/ez_gate_sweep.mjs [out.json] [--nofill] [--ids=a,b]
   Prints the failures by template prefix and gate code; exits 1 if any
   number leaves its guides. */
import { openStudio } from './_showcase_harness.mjs';
import { writeFileSync } from 'node:fs';
const OUT = process.argv.find(a => a.endsWith('.json')) || '.render/ez-gate.json', NOFILL = process.argv.includes('--nofill'), ONLY = (process.argv.find(a => a.startsWith('--ids=')) || '').slice(6);
let { browser, page, errors } = await openStudio();
await new Promise(r => setTimeout(r, 4000));
const ids = ONLY ? ONLY.split(',') : await page.evaluate(() => TEMPLATES.filter(t => !t.showcase && !(typeof tplHeld === 'function' && tplHeld(t))).map(t => t.id));
const res = {};
for (let i = 0; i < ids.length; i += 20){
  if (i && i % 100 === 0){ await browser.close(); ({ browser, page, errors } = await openStudio()); await new Promise(r => setTimeout(r, 4000)); }
  Object.assign(res, await page.evaluate(async (batch, nofill) => {
    account = { email: 'audit@local', role: 'admin', plan: 'pro' }; loadAccount = async () => account;
    window.__noNumberFill = !!nofill;
    const out = {};
    for (const id of batch){
      try {
        showEasy(id); if (ez.tpl !== id){ out[id] = { skip: 'opened ' + ez.tpl }; continue; }
        await ensureTplAssets(ezTpl()); await document.fonts.ready;
        $('ez-phone').value = '(562) 999-4994';
        const sc = renderEzCanvas(1080, 'png', undefined, undefined, 'square', true);
        const r = pgCheck(sc), ph = sc.getObjects().find(o => o.pgRole === 'phone');
        out[id] = { ok: r.ok, fails: r.fails.map(f => f.code + ':' + f.line), num: ph ? Math.round((ph.fontSize || 0) * (ph.scaleY || 1)) : null };
        sc.dispose();
      } catch (e){ out[id] = { err: String(e).slice(0, 120) }; }
    }
    return out;
  }, ids.slice(i, i + 20), NOFILL));
  process.stdout.write('…' + Math.min(ids.length, i + 20) + '/' + ids.length + '\n');
}
writeFileSync(OUT, JSON.stringify(res, null, 1));
const rows = Object.entries(res), fail = rows.filter(([, r]) => r.ok === false), margin = fail.filter(([, r]) => r.fails.some(f => /^margin:Phone/.test(f)));
console.log('templates', rows.length, 'gate fails', fail.length, 'phone margin', margin.length, 'skipped', rows.filter(([, r]) => r.skip || r.err).length);
const fam = {}; fail.forEach(([id]) => { const k = id.split('_')[0]; fam[k] = (fam[k] || 0) + 1; }); console.log('fails by prefix', JSON.stringify(fam));
const codes = {}; fail.forEach(([, r]) => r.fails.forEach(f => { const c = f.split(':')[0]; codes[c] = (codes[c] || 0) + 1; })); console.log('codes', JSON.stringify(codes));
await browser.close();
process.exit(margin.length ? 1 : 0);
