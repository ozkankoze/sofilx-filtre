// Dil paketinin yapısını i18n/en.json ile karşılaştırır: node tools/check-i18n.mjs fr de ...
import fs from 'fs';
const en = JSON.parse(fs.readFileSync('i18n/en.json', 'utf8'));
let bad = 0;
function cmp(a, b, p) {
  if (Array.isArray(a)) { if (!Array.isArray(b) || a.length !== b.length) { console.log('ARRAY LEN', p); bad++; return; } a.forEach((v, i) => cmp(v, b[i], p + '[' + i + ']')); return; }
  if (a && typeof a === 'object') { if (!b || typeof b !== 'object') { console.log('MISSING OBJ', p); bad++; return; } for (const k of Object.keys(a)) { if (!(k in b)) { console.log('MISSING', p + '.' + k); bad++; } else cmp(a[k], b[k], p + '.' + k); } return; }
  if (typeof b !== 'string' || !b.trim()) { console.log('EMPTY', p); bad++; return; }
  const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join();
  if (ph(a) !== ph(b)) { console.log('PLACEHOLDER', p, ph(a), '!=', ph(b)); bad++; }
  const tags = s => (String(s).match(/<\/?[a-z]+/g) || []).sort().join();
  if (tags(a) !== tags(b)) { console.log('HTML TAGS', p); bad++; }
}
for (const L of process.argv.slice(2)) {
  bad = 0;
  try { const d = JSON.parse(fs.readFileSync(`i18n/${L}.json`, 'utf8')); cmp(en, d, L); const s = JSON.stringify(d); if (/href="\/en\//.test(s)) { console.log('LINK /en/ left in', L); bad++; } }
  catch (e) { console.log(L, 'PARSE ERROR', e.message); bad++; }
  console.log(L, bad ? `${bad} problems` : 'OK');
}
