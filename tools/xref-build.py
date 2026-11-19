# Kod kataloğu PDF'inden (çapraz referans + uygulama listesi) data/xref/xref.json.gz üretir.
# Kullanım: python3 tools/xref-build.py KATALOG.pdf   (pdftotext gerekir)
import re, sys, subprocess, json, gzip, collections, os
F = sys.argv[1]
def page(p): return subprocess.run(['pdftotext', '-f', str(p), '-l', str(p), '-layout', F, '-'], capture_output=True, text=True).stdout
n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', F], capture_output=True, text=True).stdout).group(1))
REF = r'N[A-Z] [A-Z0-9]{6}'
TYPES = ['separator', 'air', 'oil', 'inline', 'ows', 'hyd', 'vane', 'housing', 'panel', 'silencer', 'gasket', 'kit', 'fuel', 'part']
def tkey(s):
    s = s.lower()
    if 'oil-water' in s: return 'ows'
    if 'housing' in s: return 'housing'
    if 'kit' in s and 'gasket' not in s: return 'kit'
    if 'separator' in s: return 'separator'
    if 'in-line' in s or s.startswith('element') or 'itf' in s: return 'inline'
    if 'panel' in s: return 'panel'
    if 'air filter' in s: return 'air'
    if 'oil filter' in s or s.startswith('filter oil') or 'filter,oil' in s: return 'oil'
    if 'hydraulic' in s: return 'hyd'
    if 'vane' in s: return 'vane'
    if 'silencer' in s: return 'silencer'
    if 'gasket' in s or 'o-ring' in s or 'seal' in s: return 'gasket'
    if 'fuel filter' in s: return 'fuel'
    return 'part'
xr, app = [], []
sec = None; brand = model = ''
for p in range(1, n + 1):
    t = page(p)
    if 'CROSS REFERENCE' in t or 'ROSS REFERENCE' in t: sec = 'x'
    elif 'APPLICATION LIST' in t: sec = 'a'
    else: continue
    for ln in t.splitlines():
        if not ln.strip() or 'MASTER CATALOGUE' in ln or 'NOITECH REF' in ln: continue
        if sec == 'x':
            s = ln.strip()
            if not re.match(REF, s): continue
            parts = re.split(r'\s{2,}', s)
            if len(parts) == 4: xr.append(parts)
            elif len(parts) == 3: xr.append(parts[:2] + ['', parts[2]] if not re.search(r'\d', parts[2]) else parts + [''])
            continue
        m = re.search(r'(' + REF + r')(?:\s*\(x(\d+)\))?', ln)
        if not m: continue
        left = ln[:m.start()].strip(); rest = re.split(r'\s{2,}', ln[m.end():].strip())
        if left:
            lp = re.split(r'\s{2,}', left)
            if len(lp) >= 2: brand, model = lp[0], ' '.join(lp[1:])
            else: model = lp[0]
        app.append([m.group(1), brand.title() if brand.isupper() else brand, model, int(m.group(2) or 1), rest[0] if len(rest) > 1 else '', rest[-1] if rest else ''])
P = collections.OrderedDict()
def get(ref): return P.setdefault(ref, {'t': collections.Counter(), 'o': [], 'a': []})
for ref, oem, code, typ in xr:
    d = get(ref)
    if typ: d['t'][tkey(typ)] += 1
    if code and [oem, code] not in d['o']: d['o'].append([oem, code])
for ref, b, mdl, q, code, typ in app:
    d = get(ref)
    if typ: d['t'][tkey(typ)] += 0.5
    if code and not any(x[1] == code for x in d['o']): d['o'].append([b, code])
    row = [b, mdl, q]
    if row not in d['a']: d['a'].append(row)
out = []
for ref in sorted(P):
    d = P[ref]; t = d['t'].most_common(1)[0][0] if d['t'] else 'part'
    out.append([ref, TYPES.index(t), sorted(d['o'], key=lambda x: (x[0].lower(), x[1])), d['a']])
os.makedirs('data/xref', exist_ok=True)
with gzip.open('data/xref/xref.json.gz', 'wt', encoding='utf-8') as f: json.dump({'types': TYPES, 'p': out}, f, ensure_ascii=False, separators=(',', ':'))
print('products', len(out), 'oem codes', sum(len(x[2]) for x in out), 'app rows', sum(len(x[3]) for x in out))
print(collections.Counter(TYPES[x[1]] for x in out))
