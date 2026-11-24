#!/usr/bin/env node
/* GIVE A STEPS FLOW CARD A STEP STYLE — writes the record; see _step_styles.mjs
 * for the styles and the owner's words behind them.
 *
 *   node scripts/step_styles.mjs <cardId> <style> [--room] [--dry]
 *   node scripts/step_styles.mjs --list
 *
 *   --room   also give the number clear band above it (roomForNumber): for a
 *            card whose number sits on the top edge of a footer band
 *
 * It starts from the record as it was BEFORE it was first styled: the record
 * is stamped with that revision (tpl.__stepStyle.from), and a later run reads
 * the record back from there, so a card can change style without the styles
 * piling up. An unstyled card starts from git HEAD; STYLE_FROM= names another
 * revision. Then, as for every showcase change:
 *   echo '["<cardId>"]' > /tmp/ids.json
 *   ONLY=/tmp/ids.json node scripts/rethumb_showcase.mjs      (needs :8899; CHROME=, FABRIC_JS=)
 *   node scripts/audit_card.mjs <cardId>                      (compare with the same audit before)
 *   bump ASSET_REV in app.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { applyStepStyle, roomForNumber, STEP_STYLES } from './_step_styles.mjs';
const ROOT = new URL('../', import.meta.url).pathname, DIR = ROOT + 'assets/showcase/';
const args = process.argv.slice(2), DRY = args.includes('--dry'), ROOM = args.includes('--room');
if (args.includes('--list')){ console.log(STEP_STYLES.join('\n')); process.exit(0); }
const [id, style] = args.filter(a => !a.startsWith('--'));
if (!id || !style){ console.error('usage: node scripts/step_styles.mjs <cardId> <style> [--dry]   styles: ' + STEP_STYLES.join(', ')); process.exit(2); }
const rel = 'assets/showcase/tpl/' + id + '.json';
const git = (...a) => execFileSync('git', a, { cwd: ROOT, maxBuffer: 1 << 26 }).toString();
let FROM = process.env.STYLE_FROM || null;
if (!FROM){
  let stamp = null; try { stamp = (JSON.parse(readFileSync(DIR + 'tpl/' + id + '.json', 'utf8')).tpl || {}).__stepStyle; } catch (e){}
  FROM = (stamp && stamp.from) || 'HEAD';
}
let raw, sha;
try { sha = git('rev-parse', '--short', FROM).trim(); raw = git('show', sha + ':' + rel); }
catch (e){ console.error(id + ': no record at ' + FROM + ' (' + rel + ')'); process.exit(1); }
const rec = JSON.parse(raw);
if ((rec.tpl || {}).__stepStyle){ console.error(id + ': the record at ' + sha + ' is already styled; name the revision before that with STYLE_FROM='); process.exit(1); }
const card = JSON.parse(readFileSync(DIR + 'index.json', 'utf8')).find(c => c.id === id);
if (!card){ console.error(id + ': not in the index'); process.exit(1); }
let note;
let room = null;
try { note = applyStepStyle(rec, card, style); if (ROOM) room = roomForNumber(rec); } catch (e){ console.error(id + ': ' + e.message + '; nothing written'); process.exit(1); }
rec.tpl.__stepStyle = { style, from: sha };
console.log(id, JSON.stringify(note), room ? 'room ' + JSON.stringify(room) : '');
if (DRY) console.log('dry run: nothing written');
else { writeFileSync(DIR + 'tpl/' + id + '.json', JSON.stringify(rec)); console.log('written', rel, '(from ' + sha + ')'); }
