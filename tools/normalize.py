import json,re,base64,hashlib,html,sys,unicodedata
SRC='/mnt/user-data/uploads/Projects/sofilx-yeni/veri/sofilx-katalog.json'
d=json.load(open(SRC));P=d['pages'];IMG=d['images']
ROOT={ 'kompresor-filtreler-kategori':'kompresor-filtreleri','vakum-pompasi-filtreler-kategori':'vakum-pompasi-filtreleri','vp-paletler-kategori':'karbon-paletler','fiber-paletler-kategori':'fiber-paletler','endustriyel-yaglar-kategori':'endustriyel-yaglar','endustriyel-filtreler-kategori':'endustriyel-filtreler','ozel-uretim-filtreler-kategori':'ozel-uretim-filtreler','elektrik-komurleri-karbon-burc-kategori':'karbon-burc-ve-komurler','kompresor-kaplinleri-kategori':'kompresor-kaplinleri'}
TRL=str.maketrans('çğıöşüÇĞİÖŞÜâÂ','cgiosuCGIOSUaA')
def slug(s):
  s=s.translate(TRL).lower();s=re.sub(r'[^a-z0-9]+','-',s).strip('-');return s
LOWER=str.maketrans('İIÇĞÖŞÜ','iıçğöşü')
KEEPUP={'HEPA','VTR','KTR','DTR','SFL','OKS','GEV','G.E.V','P.V.R.','PVR','EVA','ISO','DKW','CNC','XAS','ZW','ABAC','MARK','DVP','ZF','JAC','TB','RD','R&D','SV','SD','WN','NBR','UNF','FG','IR','PH','1A','DX','VX','DT','VT','GT','U'}
BRAND_FIX={'BUSCH':'Busch','BECKER':'Becker','ELMO RIETSCHLE':'Elmo Rietschle','LEYBOLD':'Leybold','ORION':'Orion',"MIL'S":"Mil's",'G.E.V':'G.E.V','GEV':'G.E.V','P.V.R.':'P.V.R.','DALGAKIRAN':'Dalgakıran','MANN FILTER':'Mann Filter','KAESER':'Kaeser','EKOMAK':'Ekomak','ABAC':'Abac','INGERSOLL RAND':'Ingersoll Rand','MİKROPOR':'Mikropor','ALMIG':'Almig','ALUP':'Alup','NOITECH':'Noitech','BOGE':'Boge','MARK':'Mark','SULLAIR':'Sullair','TEXOL CHEMICAL':'Texol Chemical','ANDEROL':'Anderol','AVIA':'Avia','BIRKOSIT':'Birkosit','DIFFU THERM':'Diffu Therm','FILLING':'Filling','GLASSLINE':'Glassline','MOLY':'Moly','OKS':'OKS','Reic Kupplungen':'Reich Kupplungen'}
def tcase(s):
  out=[]
  for w in s.split(' '):
    if not w: continue
    if any(ch.isdigit() for ch in w) or w in KEEPUP or (w.isupper() and len(w)<=2 and w.isalpha() and w not in ('VE','İÇ')): out.append(w);continue
    if w.isupper() or w[1:].isupper():
      lw=w.translate(LOWER).lower();out.append(lw[:1].upper().replace('i','İ') if lw[:1]=='i' else lw[:1].upper()+lw[1:]) if False else out.append((lw[0].upper() if lw[0]!='i' else 'İ')+lw[1:] if lw[0].isalpha() else lw)
    else: out.append(w)
  r=' '.join(out)
  r=re.sub(r'\bVe\b','ve',r)
  FIX={}
  for v in list(BRAND_FIX.values())+['Air','Filter','Oil','Kit','Silicone','Coolsyn','Synthetic','Plus','Spray','Lubricant','Scoop','Safe','Giubo','Centaflex','Zapex','Hilux','Eupex','Rupex','Bipex','Arpex','Flex','Disc','Pin','Rubber','Tyre','Element','Separator','Vacuum','Pump','Service','Fine','Line']:
    for w in v.split(): FIX[w.lower().replace('ı','i')]=w
  def fx(m):
    w=m.group(0);k=w.lower().replace('ı','i')
    return FIX.get(k,w)
  r=re.sub(r"[A-Za-zÇĞİÖŞÜçğıöşü']+",fx,r)
  return r
def brand_of(p):
  x=p;chain=[]
  while x and x.get('parent'):
    par=P.get(x['parent']);
    if not par: break
    chain.append(par);x=par
  for c in chain:
    if c.get('depth')==1: 
      h=c.get('heading') or '';h=h.strip()
      return BRAND_FIX.get(h,BRAND_FIX.get(h.upper(),tcase(h))) , c['u'].split('/')[-1].split('?')[0]
  return None,None
def text_lines(h):
  t=re.sub(r'<\s*br\s*/?>','\n',h,flags=re.I);t=re.sub(r'</(p|div|tr|li|h\d)>','\n',t,flags=re.I);t=re.sub(r'</t[dh]>',' \t ',t,flags=re.I)
  t=re.sub(r'<[^>]+>','',t);t=html.unescape(t)
  return [re.sub(r'\s+',' ',l).strip() for l in t.split('\n') if l.strip()]
LABEL=re.compile(r'(pompa model|pompaları için|pompası model|pompa modelleri|için:|modelleri:|modeli:)',re.I)
def parse(p,codes=()):
  lines=text_lines(p['descHtml'])
  models=[];xref=[];sof=None;dims=None;setn=None;cur=False;xmode=False
  tc=[re.sub(r'\D','',c) for c in codes if c]
  for i,l in enumerate(lines):
    if re.match(r'SOF[İI]LX (NO|KODU)',l,re.I):
      cur=False
      m=re.search(r'(SF[L]?\s?[A-Z0-9\-]+)',l.split(':',1)[-1] if ':' in l else '')
      if not m and i+1<len(lines): m=re.search(r'(SF[L]?\s?[A-Z0-9\-]+)',lines[i+1])
      if m: sof=m.group(1).replace(' ','')
      continue
    if LABEL.search(l) and l.rstrip().endswith(':'):
      cur=True;continue
    if cur:
      parts=[x.strip(' -') for x in re.split(r'\s*[|,;]\s*',l)]
      if l.endswith(':') or '\t' in l or re.search(r'BECKER POMPA|POMPA MODEL|PARÇA NO|VAKUM POMPA|SOF[İI]LX',l,re.I) or any(len(x)>34 for x in parts): cur=False;continue
      for part in parts:
        if not (1<len(part)<34): continue
        dg=re.sub(r'\D','',part)
        if xmode or re.search(r'filt|yağ|oil',part,re.I) or (dg and any(c and (c in dg or dg in c) and len(dg)>=4 for c in tc)):
          xmode=True
          if part not in xref and not re.search(r'filt|yağ|oil',part,re.I): xref.append(part)
          continue
        if re.search(r'\d',part) and part not in models: models.append(part)
    m=re.search(r'(?:Boyutlar?|Ölçü)\s*:?\s*(\d+(?:[.,]\d+)?)\s*[-*xX×]\s*(\d+(?:[.,]\d+)?)\s*[-*xX×]\s*(\d+(?:[.,]\d+)?)\s*mm',l,re.I)
    if m and not dims: dims={'type':'plate','l':float(m.group(1).replace(',','.')),'w':float(m.group(2).replace(',','.')),'t':float(m.group(3).replace(',','.'))}
    m=re.search(r'(\d+)\s*(?:Karbon\s*)?Palet\s*Seti',l,re.I)
    if m and not setn: setn=int(m.group(1))
  if not dims:
    m=re.search(r'Ölçü\s*(\d+)\*(\d+)\*(\d+)',p['title'])
    if m: dims={'type':'plate','l':float(m.group(1)),'w':float(m.group(2)),'t':float(m.group(3))}
  return models[:80],sof,dims,setn,xref[:12]
TYPES=[('EGZOZ','Egzoz filtresi','Exhaust filter'),('SEPERAT','Seperatör filtresi','Separator filter'),('SEPARAT','Seperatör filtresi','Separator filter'),('HAVA F','Hava filtresi','Air filter'),('YAĞ F','Yağ filtresi','Oil filter'),('YAG F','Yağ filtresi','Oil filter'),('FİBER','Fiber palet','Fibre vane'),('PALET','Karbon palet','Carbon vane'),('KAPLİN','Kaplin','Coupling'),('KAPLIN','Kaplin','Coupling'),('HEPA','HEPA filtre','HEPA filter'),('KASET','Kaset filtre','Panel filter'),('TORBA','Torba filtre','Bag filter'),('KARTUŞ','Kartuş filtre','Cartridge filter'),('CAM ELYAF','Cam elyaf filtre','Glass fibre filter'),('HİDROLİK F','Hidrolik filtre','Hydraulic filter'),('KÖMÜR','Elektrik kömürü','Carbon brush'),('KARBON','Karbon ürün','Carbon product'),('YAĞ','Endüstriyel yağ','Industrial lubricant'),('GRES','Gres yağı','Grease')]
CATDEF={'kompresor-filtreleri':('Filtre','Filter'),'vakum-pompasi-filtreleri':('Filtre','Filter'),'karbon-paletler':('Karbon palet','Carbon vane'),'fiber-paletler':('Fiber palet','Fibre vane'),'endustriyel-yaglar':('Endüstriyel yağ','Industrial lubricant'),'endustriyel-filtreler':('Endüstriyel filtre','Industrial filter'),'ozel-uretim-filtreler':('Özel üretim filtre','Custom filter'),'karbon-burc-ve-komurler':('Karbon ürün','Carbon product'),'kompresor-kaplinleri':('Kaplin','Coupling')}
def ptype(title,cat):
  T=title.upper()
  if cat=='fiber-paletler': return ('Fiber palet','Fibre vane')
  if cat=='karbon-paletler': return ('Karbon palet','Carbon vane')
  if cat=='kompresor-kaplinleri': return ('Kaplin','Coupling')
  for k,tr,en in TYPES:
    if k in T: return (tr,en)
  return CATDEF[cat]
CODE=re.compile(r'(?<![A-Za-zğüşıöçĞÜŞİÖÇ])([A-Z]{0,4}[\- ]?\d[\d.\- ]{3,}\d)(?![A-Za-z])')
seen_img={};out=[];imgfiles={}
def save_img(u):
  if u in imgfiles: return imgfiles[u]
  data=IMG.get(u)
  if not data or 'yok.png' in u: return None
  b=base64.b64decode(data.split(',',1)[1]);h=hashlib.md5(b).hexdigest()[:12]
  open(f'data/raw/{h}.webp','wb').write(b);imgfiles[u]=h;return h
slugs=set()
for p in P.values():
  if not p.get('isProduct'): continue
  cat=ROOT[p['root']];brand,bslug=brand_of(p)
  if cat in ('ozel-uretim-filtreler','endustriyel-filtreler','karbon-burc-ve-komurler'): brand,bslug='Sofilx','sofilx'
  title=re.sub(r'\s+',' ',p['title']).strip()
  codes=[c.strip(' -.') for c in re.findall(r'\b(\d{5,}(?:[ .]\d{2,})?)\b',title)]
  name=tcase(title)
  if brand and brand!='Sofilx' and brand.split()[0].lower() not in name.lower() and cat=='endustriyel-yaglar': name=brand+' '+name
  sl=p['u'].rstrip('/').split('/')[-1]
  base=sl;i=2
  while sl in slugs: sl=f'{base}-{i}';i+=1
  slugs.add(sl)
  models,sof,dims,setn,xref=parse(p,codes)
  equiv=[]
  if sof: equiv.append(sof)
  equiv+= [x for x in xref if x not in equiv]
  ty=ptype(title,cat)
  imgs=[h for h in (save_img(u) for u in p['imgs']) if h]
  imgs=list(dict.fromkeys(imgs))
  desc=p['descHtml']
  desc=re.sub(r'<(script|style)[^>]*>.*?</\1>','',desc,flags=re.S|re.I)
  desc=re.sub(r'\s(style|class|width|height|border|cellpadding|cellspacing|align|valign)="[^"]*"','',desc,flags=re.I)
  desc=re.sub(r'<(?!/?(p|strong|b|br|table|tbody|thead|tr|td|th|ul|ol|li|em|h3|h4)\b)[^>]+>','',desc,flags=re.I)
  desc=re.sub(r'(<p>\s*(&nbsp;)?\s*</p>)+','',desc)
  out.append({'id':sl,'old':p['u'],'cat':cat,'brand':brand or 'Sofilx','bslug':bslug or 'sofilx','title':title,'name':name,'codes':codes[:4],'equiv':equiv,'models':models,'dims':dims,'set':setn,'type':ty[0],'typeEn':ty[1],'imgs':imgs,'descHtml':desc.strip(),'meta':p.get('metaD','')})
# lists (brand pages) for redirects + intros
lists=[]
for p in P.values():
  if p.get('isProduct') or p.get('depth')!=1: continue
  b=p.get('heading','').strip();lists.append({'old':p['u'],'cat':ROOT[p['root']],'brand':BRAND_FIX.get(b,tcase(b)),'bslug':p['u'].split('/')[-1],'intro':p.get('intro',[]),'img':save_img(p['children'][0]['img']) if p.get('children') and p['children'][0].get('img') else None})
cats=[]
for p in P.values():
  if p.get('depth')==0: cats.append({'old':p['u'],'cat':ROOT[p['root']],'heading':p.get('heading'),'intro':p.get('intro',[])})
json.dump({'products':out,'lists':lists,'cats':cats,'corp':d['corp']},open('data/catalog.json','w'),ensure_ascii=False,indent=0)
print(len(out),'products',len(imgfiles),'images',len(lists),'brand lists')
import collections;print(collections.Counter(o['brand'] for o in out).most_common(40))
print(sum(1 for o in out if o['models']),'with models',sum(1 for o in out if o['dims']),'with dims',sum(1 for o in out if o['equiv']),'with sofilx code',sum(1 for o in out if not o['imgs']),'no img')
