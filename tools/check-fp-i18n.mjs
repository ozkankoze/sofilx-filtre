// i18n/fp/{dil}.json kontrolü (kaynak: i18n/fp/tr.json): node tools/check-fp-i18n.mjs en de ...
import fs from 'fs';
const src = JSON.parse(fs.readFileSync('i18n/fp/tr.json', 'utf8'));
for (const L of process.argv.slice(2)) {
  let bad = 0; let d;
  try { d = JSON.parse(fs.readFileSync(`i18n/fp/${L}.json`, 'utf8')); } catch (e) { console.log(L, 'PARSE/READ ERROR', e.message); continue; }
  for (const sec of ['ui', 'cats', 'phrases']) for (const k of Object.keys(src[sec])) {
    const v = d[sec]?.[k];
    if (typeof v !== 'string' || !v.trim()) { bad++; if (bad < 15) console.log(L, 'MISSING', sec, k); continue; }
    const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join();
    if (ph(v) !== ph(src[sec][k])) { bad++; console.log(L, 'PLACEHOLDER', sec, k); }
  }
  console.log(L, bad ? bad + ' problems' : 'OK');
}
