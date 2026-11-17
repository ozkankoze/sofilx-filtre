# sofilxloto.com dökümünü sofilx-site/data/loto/ ve static/img/loto/ altına taşır
import json, sys, os, shutil
SRC, REPO = sys.argv[1], sys.argv[2]
d = json.load(open(SRC + '/loto.json'))
order = [l.strip().replace('https://www.sofilxloto.com/', '') for l in open(SRC + '/urls.txt')]
CAT_ORDER = ['emniyet-asma-kilitler', 'salter-kilitleme-ekipmanlari', 'vana-kilitleme-ekipmanlari', 'kablo-kilitleme-ekipmanlari', 'kilit-coklandiricilar', 'elektrik-pnomatik-kilitleme-ekipmanlari', 'lockout-istasyon-canta', 'grup-kilit-kutusu', 'set-urunler', 'tehlike-etiketleri', 'ag-og-elektrik-guvenlik-ekipmanlari', 'yag-ve-kimyasal-emici-kitler']
LANGS = ['tr', 'en', 'de', 'es', 'fr', 'it', 'nl', 'ru', 'az']
P = d['prods']
keys = sorted(P, key=lambda k: order.index(k) if k in order else 9999)
prods = []
for k in keys:
    v = P[k]; tr = v['tr']
    prods.append({'s': k, 'code': tr['code'], 'cat': tr['cat'], 'imgs': [i.split('/')[-1] for i in tr['imgs']],
                  't': {L: {'name': v[L]['name'], 'desc': v[L]['desc'], 'detail': v[L]['detail']} for L in LANGS}})
cats = []
for c in CAT_ORDER:
    v = d['cats'][c]; first = next(p for p in prods if p['cat'] == c)
    cats.append({'s': c, 'img': first['imgs'][0], 't': {L: {'name': v[L]['name'], 'desc': v[L]['desc']} for L in LANGS}})
os.makedirs(REPO + '/data/loto', exist_ok=True)
json.dump({'cats': cats, 'products': prods}, open(REPO + '/data/loto/loto.json', 'w'), ensure_ascii=False, separators=(',', ':'))
dst = REPO + '/static/img/loto'; os.makedirs(dst, exist_ok=True)
n = 0
for p in prods:
    for i in p['imgs']:
        for f in (i, i.replace('.webp', '-k.webp')):
            shutil.copy(SRC + '/img/' + f, dst + '/' + f); n += 1
print('products', len(prods), 'cats', len(cats), 'images', n, {c['s']: sum(p['cat'] == c['s'] for p in prods) for c in cats})
