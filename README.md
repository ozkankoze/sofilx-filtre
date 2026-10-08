# Sofilx web sitesi

Statik site: `node src/build.mjs` komutu `dist/` klasörüne tüm sayfaları (TR + EN), arama indeksini, sitemap ve robots dosyalarını üretir. Vercel bu komutu her yayında kendisi çalıştırır.

## Klasörler
- `data/catalog.json` – sofilx.com'dan çekilen 559 ürün (ad, kod, çapraz referans, uyumlu modeller, ölçüler, açıklama)
- `data/cut/` – arka planı temizlenmiş ürün fotoğrafları · `data/raw/` – orijinal fotoğraflar
- `data/extra.json` – anasayfa görselleri ve marka logoları
- `src/i18n.mjs` – tüm arayüz metinleri (TR/EN), kategori ve sektör tanımları
- `src/legal.mjs` – KVKK aydınlatma metni ve çerez politikası
- `src/build.mjs` – sayfa şablonları, SEO, sitemap, eski URL yönlendirmeleri (`vercel.json` buradan üretilir)
- `assets/site.css`, `assets/site.js` – tasarım ve istemci kodu (teklif listesi, arama, filtreler, form, çerez onayı)

## Ortam değişkenleri (Vercel → Settings → Environment Variables)
- `WEB3FORMS_KEY` – teklif formunun info@sofilx.com'a gitmesi için (web3forms.com'dan ücretsiz alınır)
- `GTM_ID` – isteğe bağlı, varsayılan GTM-56P6SPBF (eski sitedeki etiket)

## Yerelde deneme
```
node src/build.mjs && node tools/serve.mjs   # http://localhost:4321
```

## Ürün ekleme / güncelleme
`data/catalog.json` içindeki ürünleri düzenleyin ya da `tools/normalize.py` ile yeniden üretin, sonra build alın. `vercel.json` yönlendirmeleri değiştiyse yerelde `node src/build.mjs` çalıştırıp `vercel.json` dosyasını da commit edin.
