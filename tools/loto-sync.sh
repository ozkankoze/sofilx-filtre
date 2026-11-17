#!/bin/bash
# sofilxloto.com ürünlerini yeniden çeker: sh tools/loto-sync.sh  (sonra npm run build)
set -e; W=$(mktemp -d); cd "$W"
curl -s https://www.sofilxloto.com/sitemap.xml | grep -o '<loc>[^<]*' | sed 's/<loc>//' > urls.txt
mkdir raw img; sed 's#https://www.sofilxloto.com##' urls.txt | while read p; do f=$(echo "$p" | sed 's#^/##; s#/#__#g'); [ -z "$f" ] && f=index; echo "url = \"https://www.sofilxloto.com$p\""; echo "output = \"raw/$f.html\""; done > c.cfg
curl -s --parallel --parallel-max 16 -K c.cfg
cd - >/dev/null; python3 tools/loto-parse.py "$W"
python3 -c "
import json;d=json.load(open('$W/loto.json'));s=set()
for v in d['prods'].values():
  for i in v['tr']['imgs']: s|={i,i.replace('.webp','-k.webp')}
open('$W/i.cfg','w').write(''.join(f'url = \"https://www.sofilxloto.com{i}\"\noutput = \"$W/img/{i.split(\"/\")[-1]}\"\n' for i in s))"
curl -s --parallel --parallel-max 16 -K "$W/i.cfg"
python3 tools/loto-prep.py "$W" .
