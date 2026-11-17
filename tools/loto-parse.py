import re, json, html, sys, os, glob, collections
D = sys.argv[1]
LANGS = ['en','de','es','fr','it','nl','ru','az']
def lang_of(f):
    n = os.path.basename(f)[:-5]
    p = n.split('__')
    return (p[0], '__'.join(p[1:])) if p[0] in LANGS else ('tr', n)
prods = collections.defaultdict(dict); cats = collections.defaultdict(dict)
for f in glob.glob(D + '/raw/*.html'):
    L, key = lang_of(f)
    s = open(f, encoding='utf-8').read()
    lds = [json.loads(x) for x in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)]
    pr = next((x for x in lds if x.get('@type') == 'Product'), None)
    if not pr:
        # kategori sayfası mı?
        if 'class="grid"' in s and re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S):
            h1 = html.unescape(re.sub(r'<[^>]+>', '', re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S).group(1))).strip()
            desc = re.search(r'<meta name="description" content="([^"]*)"', s)
            n = len(re.findall(r'<article class="pc"', s))
            cats[key][L] = {'name': h1, 'desc': html.unescape(desc.group(1)) if desc else '', 'n': n}
        continue
    m = s[s.find('<main'):s.find('</main>')]
    det = re.search(r'<div class="detail">\s*<h2>.*?</h2>(.*?)</div>\s*</div>\s*</div>\s*</div></section>', m, re.S)
    det = det.group(1).strip() if det else ''
    det = re.sub(r'<svg.*?</svg>', '', det, flags=re.S)
    catm = re.search(r'<p class="pcat">.*?<a href="([^"]+)"[^>]*>(.*?)</a>', m, re.S)
    catslug = catm.group(1).rstrip('/').split('/')[-1] if catm else ''
    imgs = re.findall(r'data-full="(/assets/urunler/[^"]+)"', m) or re.findall(r'<div class="main"><img src="([^"]+)"', m)
    h1 = html.unescape(re.sub(r'<[^>]+>', '', re.search(r'<h1[^>]*>(.*?)</h1>', m, re.S).group(1))).strip()
    prods[key][L] = {'code': pr.get('sku', ''), 'name': h1, 'cat': catslug, 'catName': html.unescape(catm.group(2)).strip() if catm else '',
                     'desc': pr.get('description', ''), 'detail': det, 'imgs': imgs}
out = {'prods': prods, 'cats': cats}
json.dump(out, open(D + '/loto.json', 'w'), ensure_ascii=False)
print('products', len(prods), 'langs per product', collections.Counter(len(v) for v in prods.values()))
print('cats', len(cats), {k: (v.get('tr') or {}).get('n') for k, v in cats.items()})
print('empty detail', sum(1 for v in prods.values() for x in v.values() if not x['detail']), 'no imgs', sum(1 for v in prods.values() if not v.get('tr', {}).get('imgs')))
