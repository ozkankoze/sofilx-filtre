#!/bin/sh
# Filtre Pazarlama kataloğunu yeniden çeker ve data/fp/ altını günceller.
# Kullanım: sh tools/fp-fetch.sh   (yaklaşık 15-25 dk sürer)
set -e
W=${TMPDIR:-/tmp}/fp-fetch; mkdir -p $W/api; cd $W
API=https://www.filtrepazarlama.com/wp-json/wc/store/v1
TOTAL=$(curl -sI "$API/products?per_page=100&_fields=id" | awk 'tolower($1)=="x-wp-totalpages:"{print $2}' | tr -d '\r')
echo "sayfa: $TOTAL"
seq 1 $TOTAL | xargs -P 4 -I{} sh -c "[ -s api/p{}.json ] || curl -sS --retry 4 --max-time 90 -o api/p{}.json '$API/products?per_page=100&page={}&orderby=id&order=asc&_fields=id,name,sku,permalink,categories,images,description,short_description'"
for pg in 1 2 3; do curl -sS -o cats$pg.json "$API/products/categories?per_page=100&page=$pg"; done
python3 - <<PY
import json,glob,html
P=[]
for f in glob.glob('$W/api/p*.json'): P+=json.load(open(f))
P=sorted({p['id']:p for p in P}.values(),key=lambda p:p['id'])
json.dump(P,open('$W/fp_all.json','w'),ensure_ascii=False)
C=[]
for pg in (1,2,3): C+=json.load(open('$W/cats%d.json'%pg))
json.dump([{'id':c['id'],'parent':c['parent'],'slug':c['slug'],'name':html.unescape(c['name']),'count':c['count'],'img':(c.get('image') or {}).get('src')} for c in C],open('$W/cats_all.json','w'),ensure_ascii=False)
print('ürün',len(P),'kategori',len(C))
PY
cd - >/dev/null
python3 tools/fp-normalize.py $W/fp_all.json
echo "Yeni ürün tipi veya kategori çıktıysa i18n/fp/*.json çevirilerine eklenmeli (node tools/check-fp-i18n.mjs ile kontrol edin)."
