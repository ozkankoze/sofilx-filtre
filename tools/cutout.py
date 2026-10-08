import glob,os,sys
from rembg import remove,new_session
from PIL import Image,ImageDraw,ImageFilter
A=new_session('isnet-general-use');B=None
S=900
def compose(o):
  bb=o.split()[3].point(lambda v:255 if v>20 else 0).getbbox()
  if not bb: return None
  o=o.crop(bb);box=S*0.76;sc=min(box/o.width,box/o.height);o=o.resize((max(1,round(o.width*sc)),max(1,round(o.height*sc))),Image.LANCZOS)
  can=Image.new('RGBA',(S,S),(0,0,0,0));base=round(S*0.87)
  sh=Image.new('RGBA',(S,S),(0,0,0,0));d=ImageDraw.Draw(sh);w=o.width*0.86
  d.ellipse((S/2-w/2,base-14,S/2+w/2,base+14),fill=(20,18,50,64));sh=sh.filter(ImageFilter.GaussianBlur(16));can.alpha_composite(sh)
  can.alpha_composite(o,(round((S-o.width)/2),base-o.height));return can
def cov(o):
  a=o.split()[3];h=a.histogram();return sum(h[30:])/max(1,sum(h))
for f in sorted(glob.glob('data/raw/*.webp')):
  h=os.path.basename(f)[:-5];dst=f'data/cut/{h}.webp'
  if os.path.exists(dst): continue
  try:
    im=Image.open(f).convert('RGB')
    if max(im.size)<500:
      sc=640/max(im.size);im=im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,60,2))
    o=remove(im,session=A);c=cov(o)
    if c<0.06 or c>0.97:
      if B is None: B=new_session('u2net')
      o2=remove(im,session=B);c2=cov(o2)
      if 0.06<=c2<=0.97: o=o2;c=c2
    can=compose(o) if 0.04<=c<=0.97 else None
    if can is None:
      can=Image.new('RGBA',(S,S),(255,255,255,255));im.thumbnail((int(S*.86),int(S*.86)));can.paste(im,((S-im.width)//2,(S-im.height)//2));tag='orig'
    else: tag='cut'
    can.save(dst,'WEBP',quality=82,method=4)
    t=can.copy();t.thumbnail((440,440),Image.LANCZOS);t.save(f'data/cut/{h}_t.webp','WEBP',quality=80,method=4)
    print(h,tag,round(c,2),flush=True)
  except Exception as e: print(h,'ERR',e,flush=True)
print('ALLDONE',flush=True)
