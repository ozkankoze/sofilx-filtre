# Filtre Pazarlama ham ürün dökümünü (Woo Store API) sitenin kullandığı sıkıştırılmış veriye çevirir.
# Kullanım: python3 tools/fp-normalize.py <fp_all.json>
# Çıktı: data/fp/idx.json.gz (liste/arama), data/fp/d/NN.json.gz (ürün detayları, 128 parça), data/fp/cats.json
import json, re, html, gzip, sys, os, collections
SRC = sys.argv[1]; OUT = 'data/fp'
P = json.load(open(SRC))
tr = json.load(open('i18n/fp/tr.json'))
PH = list(tr['phrases'].keys()); PHI = {p: i for i, p in enumerate(PH)}
VOCAB = set(w for p in PH for w in p.split())
cats_raw = json.load(open(os.path.join(os.path.dirname(SRC), 'cats_all.json')))
CAT = {c['id']: c for c in cats_raw}
UP = 'https://www.filtrepazarlama.com/wp-content/uploads/'
def rel(u): return u.split('/wp-content/uploads/')[-1] if u and '/wp-content/uploads/' in u else ''
def txt(h): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()
def split_name(n):
    t = n.split(); i = len(t)
    while i > 0 and t[i - 1] in VOCAB: i -= 1
    phr = ' '.join(t[i:])
    while phr and phr not in PHI and i < len(t): i += 1; phr = ' '.join(t[i:])  # en uzun bilinen ifade
    return ' '.join(t[:i]), (PHI[phr] if phr in PHI else -1)
def strip_vocab(s):
    t = s.split(); i = len(t)
    while i > 0 and t[i - 1] in VOCAB: i -= 1
    return ' '.join(t[:i]) or s
def compat(desc, name):
    if '<h4' in desc:
        g = re.findall(r'<h4[^>]*>(.*?)</h4>\s*<div[^>]*>(.*?)</div>', desc, re.S)
        g = [[txt(a), txt(b)] for a, b in g if txt(a)]
        if g: return {'g': g}
    if '<li' in desc:
        it = [txt(x) for x in re.findall(r'<li[^>]*>(.*?)</li>', desc, re.S)]
        it = [strip_vocab(x) for x in it if x and x != name]
        it = list(dict.fromkeys(x for x in it if x and x.upper() != name.upper()))
        if it: return {'l': it}
    lines = [txt(x) for x in re.findall(r'<p[^>]*>(.*?)</p>', desc, re.S)]
    lines = [x for x in lines if x and x != name and name not in x]
    if lines: return {'p': lines}
    return None
def fnv(s):
    h = 2166136261
    for ch in s.encode('utf-8'): h = ((h ^ ch) * 16777619) & 0xffffffff
    return h
NSH = 128
idx = []; shards = collections.defaultdict(dict); catcount = collections.Counter(); nophr = 0
for p in P:
    slug = p['permalink'].rstrip('/').split('/')[-1]
    name = html.unescape(p['name']).strip()
    pre, ph = split_name(name)
    if ph < 0: nophr += 1; pre = name
    cs = [CAT[c['id']]['slug'] for c in p['categories'] if c['id'] in CAT] or ['hidrolik-filtre']
    for c in cs: catcount[c] += 1
    imgs = [rel(i['src']) for i in p['images'] if rel(i['src'])]
    th = rel(p['images'][0].get('thumbnail', '')) if p['images'] else ''
    idx.append([slug, pre, ph, cs[0], th or (imgs[0] if imgs else '')])
    d = {'i': imgs}
    cp = compat(p['description'] or '', name)
    if cp: d['c'] = cp
    if len(cs) > 1: d['k'] = cs
    shards[fnv(slug) % NSH][slug] = d
os.makedirs(OUT + '/d', exist_ok=True)
with gzip.open(OUT + '/idx.json.gz', 'wt', encoding='utf-8') as f: json.dump(idx, f, ensure_ascii=False, separators=(',', ':'))
for k, v in shards.items():
    with gzip.open(f'{OUT}/d/{k:03d}.json.gz', 'wt', encoding='utf-8') as f: json.dump(v, f, ensure_ascii=False, separators=(',', ':'))
cats = [{'s': c['slug'], 'n': catcount[c['slug']], 'img': rel(c['img'] or '')} for c in sorted(cats_raw, key=lambda c: -catcount[c['slug']]) if catcount[c['slug']]]
json.dump(cats, open(OUT + '/cats.json', 'w'), ensure_ascii=False)
print('products', len(idx), 'no phrase', nophr, 'cats', len(cats), 'shards', len(shards))
