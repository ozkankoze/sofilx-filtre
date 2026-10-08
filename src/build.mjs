// Sofilx statik site üretici: node src/build.mjs  ->  dist/
// Diller: TR kökte, diğerleri /{dil}/ altında (İngilizce yol adlarıyla).
import fs from 'node:fs';
import path from 'node:path';
import { T as TT, CATS, SECTORS } from './i18n.mjs';
import { pages as LEGAL } from './legal.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://www.sofilx.com';
const WEB3FORMS_KEY = process.env.WEB3FORMS_KEY || '';
const GTM_ID = process.env.GTM_ID || 'GTM-56P6SPBF';
const PHONE_TR = '(0216) 606 32 06', PHONE_X = '+90 216 606 32 06', PHONE_INT = '+902166063206', MOBILE_TR = '(0552) 350 84 46', MOBILE_X = '+90 552 350 84 46', WA = '905523508446', EMAIL = 'info@sofilx.com';
const ADDRESS = 'Esatpaşa Mah. Bingöl Sok. No:1A, Ataşehir / İstanbul';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/extra.json'), 'utf8')); // banner + logo görselleri
const CUT = path.join(ROOT, 'data/cut');

// ---------- yardımcılar ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = s => String(s).replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g').replace(/[ıIİ]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[şŞ]/g, 's').replace(/[üÜ]/g, 'u').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const write = (rel, html) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
const plain = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => o[k] ?? m);

// ---------- diller ----------
// Kullanıcının istediği sırayla (dil menüsü bu sırayı izler)
const FLAG = { tr: 'tr', en: 'gb', fa: 'ir', he: 'il', ar: 'sa', fr: 'fr', de: 'de', es: 'es', ru: 'ru', it: 'it', nl: 'nl', ka: 'ge', mk: 'mk', az: 'az' };
const flagImg = (l, lazy) => `<img class="flag" src="/img/flags/${FLAG[l]}.svg" alt="" width="20" height="15"${lazy ? ' loading="lazy"' : ''}>`;
const LANG_META = [
  { L: 'tr', name: 'Türkçe', locale: 'tr_TR' }, { L: 'en', name: 'English', locale: 'en_GB' },
  { L: 'fa', name: 'فارسی', locale: 'fa_IR', rtl: 1 }, { L: 'he', name: 'עברית', locale: 'he_IL', rtl: 1 }, { L: 'ar', name: 'العربية', locale: 'ar_AR', rtl: 1 },
  { L: 'fr', name: 'Français', locale: 'fr_FR' }, { L: 'de', name: 'Deutsch', locale: 'de_DE' }, { L: 'es', name: 'Español', locale: 'es_ES' },
  { L: 'ru', name: 'Русский', locale: 'ru_RU' }, { L: 'it', name: 'Italiano', locale: 'it_IT' }, { L: 'nl', name: 'Nederlands', locale: 'nl_NL' },
  { L: 'ka', name: 'ქართული', locale: 'ka_GE' }, { L: 'mk', name: 'Македонски', locale: 'mk_MK' }, { L: 'az', name: 'Azərbaycanca', locale: 'az_AZ' },
];
// Yazı sistemine göre font: Barlow yalnızca Latin; diğer alfabeler için uygun Google Fonts
const FONT_BASE = 'family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Geist+Mono:wght@400;500';
const FONT_EXTRA = { ru: 'family=Fira+Sans:wght@400;500;600;700&family=Fira+Sans+Condensed:wght@500;600;700;800', mk: 'family=Fira+Sans:wght@400;500;600;700&family=Fira+Sans+Condensed:wght@500;600;700;800', ka: 'family=Noto+Sans+Georgian:wght@400;500;600;700;800', ar: 'family=Noto+Sans+Arabic:wght@400;500;600;700&family=Noto+Kufi+Arabic:wght@500;600;700;800', fa: 'family=Vazirmatn:wght@400;500;600;700;800', he: 'family=Heebo:wght@400;500;600;700;800' };

// ---------- veri ----------
const P = data.products.map(p => ({ ...p, bslug: slug(p.brand) }));
P.forEach(p => { if (!p.imgs.length) p.imgs = []; p.img = p.imgs[0] || null; });
const catById = Object.fromEntries(CATS.map(c => [c.id, c]));
const brands = [...new Set(P.map(p => p.brand))].filter(b => b !== 'Sofilx').sort((a, b) => a.localeCompare(b, 'tr'));
const brandSlug = b => slug(b);
const catCover = {};
for (const c of CATS) { const ps = P.filter(p => p.cat === c.id && p.img); catCover[c.id] = (ps.find(p => p.models.length) || ps[0] || {}).img; }
const sectorProducts = s => {
  const out = [];
  for (const c of s.cats) { const ps = P.filter(p => p.cat === c && p.img).sort((a, b) => (b.models.length > 0) - (a.models.length > 0)); out.push(...ps.slice(0, 4)); }
  return out.slice(0, 12);
};
const sectorsOfProduct = p => SECTORS.filter(s => s.cats.includes(p.cat));

// EN ürün adı (kural tabanlı)
const EN_WORDS = [[/Yüksek Performanslı/gi, 'High Performance'], [/Üstün Performanslı/gi, 'Superior Performance'], [/Tam Sentetik/gi, 'Fully Synthetic'], [/Suda Çözünebilen/gi, 'Water-Soluble'], [/Tahribatsız Çatlak Tespit Kimyasalları/gi, 'Non-Destructive Crack Detection Chemicals'], [/Emulgatörler/gi, 'Emulsifiers'], [/Cam Kalıp Yağları/gi, 'Glass Mould Oils'], [/Konveyör Yağları/gi, 'Conveyor Oils'], [/Yağ Katkıları/gi, 'Oil Additives'], [/Özel Amaçlı Yağlayıcılar/gi, 'Special Purpose Lubricants'], [/Kaplin Elemanı/gi, 'Coupling Element'], [/Kaplin Lastiği/gi, 'Coupling Rubber'], [/Basıc/g, 'Basic'], [/Dıffı Therm /g, ''], [/Kuru Film Yağlayıcılar/gi, 'Dry Film Lubricants'], [/Kalıp Ayırıcılar/gi, 'Release Agents'], [/Özel Amaçlı Ürünler/gi, 'Special Purpose Products'], [/Pas Sökücüler/gi, 'Rust Removers'], [/Montaj Pastaları/gi, 'Assembly Pastes'], [/Göbeği/gi, 'Hub'], [/Elementler/gi, 'Elements'], [/Eksoz Filtresi/gi, 'Exhaust Filter'], [/Eksoz/gi, 'Exhaust'], [/Vakum Palet Kömürü/gi, 'Vacuum Pump Carbon Vane'], [/Vakum Pompası/gi, 'Vacuum Pump'], [/Palet Seti/gi, 'Vane Set'], [/Palet/gi, 'Vane'], [/Yağ Filtreleri/gi, 'Oil Filters'], [/Yağ Filtresi/gi, 'Oil Filter'], [/Hava Filtreleri/gi, 'Air Filters'], [/Hava Filtresi/gi, 'Air Filter'], [/Egzoz Filtreleri/gi, 'Exhaust Filters'], [/Egzoz Filtresi/gi, 'Exhaust Filter'], [/Egzoz Filtre/gi, 'Exhaust Filter'], [/Seperatör Filtreleri/gi, 'Separator Filters'], [/Seperatör/gi, 'Separator'], [/Kompresör/gi, 'Compressor'], [/Filtreleri/gi, 'Filters'], [/Filtreler/gi, 'Filters'], [/Filtresi/gi, 'Filter'], [/Filtre/gi, 'Filter'], [/Kaplinleri/gi, 'Couplings'], [/Kaplin/gi, 'Coupling'], [/Elastik/gi, 'Flexible'], [/Yağları/gi, 'Oils'], [/Yağlar/gi, 'Oils'], [/Yağı/gi, 'Oil'], [/Gresler/gi, 'Greases'], [/Gres/gi, 'Grease'], [/Hidrolik/gi, 'Hydraulic'], [/Dişli/gi, 'Gear'], [/Rulman/gi, 'Bearing'], [/Zincir/gi, 'Chain'], [/Elektrik Kömürleri/gi, 'Carbon Brushes'], [/Mekanik Karbon/gi, 'Mechanical Carbon'], [/Karbon Burçlar/gi, 'Carbon Bushings'], [/Karbon Ringler/gi, 'Carbon Rings'], [/Torba/gi, 'Bag'], [/Kaset/gi, 'Panel'], [/Kartuş/gi, 'Cartridge'], [/Cam Elyaf/gi, 'Glass Fibre'], [/ ve /g, ' and '], [/Diğer Ürünler/gi, 'Other Products'], [/Çok Amaçlı Yağlayıcılar/gi, 'Multi-Purpose Lubricants'], [/Metal İşleme/gi, 'Metalworking'], [/Temizleyiciler/gi, 'Cleaners'], [/Korozyondan Koruyucu Ürünler/gi, 'Corrosion Protection'], [/Silikon/gi, 'Silicone'], [/Soğutma/gi, 'Cooling'], [/Ölçü/gi, 'Size'], [/Yağ(?![a-zığüşöç])/gi, 'Oil'], [/Hava(?![a-zığüşöç])/gi, 'Air']];
const enName = p => { let n = p.name; for (const [a, b] of EN_WORDS) n = n.replace(a, b); return n.replace(/\s{2,}/g, ' ').trim(); };
// Çeviri paketleri için İngilizce terim listesi (uzundan kısaya)
const PHRASES = [...new Set(EN_WORDS.map(w => w[1].trim()).filter(Boolean))].sort((a, b) => b.length - a.length);
const codeLine = p => [...p.codes].join(' | ');

// ---------- dil paketleri ----------
const TYPES_EN = [...new Set(P.map(p => p.typeEn))];
const D = {
  tr: { meta: LANG_META[0], t: TT.tr, cats: Object.fromEntries(CATS.map(c => [c.id, { name: c.tr, short: c.short }])), sectors: Object.fromEntries(SECTORS.map(s => [s.id, { name: s.tr, line: s.line, parts: s.parts }])), types: null, phrases: null, legal: LEGAL.tr },
  en: { meta: LANG_META[1], t: TT.en, cats: Object.fromEntries(CATS.map(c => [c.id, { name: c.enName, short: c.shortEn }])), sectors: Object.fromEntries(SECTORS.map(s => [s.id, { name: s.enName, line: s.lineEn, parts: s.partsEn }])), types: Object.fromEntries(TYPES_EN.map(x => [x, x])), phrases: null, legal: LEGAL.en },
};
// Çevirmenler için kaynak dosya (i18n/en.json) — yapı diğer dillerle birebir aynı olmalı
fs.mkdirSync(path.join(ROOT, 'i18n'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'i18n/en.json'), JSON.stringify({ t: TT.en, cats: D.en.cats, sectors: D.en.sectors, types: D.en.types, phrases: Object.fromEntries(PHRASES.map(x => [x, x])), legal: LEGAL.en }, null, 1));
for (const m of LANG_META.slice(2)) {
  const f = path.join(ROOT, `i18n/${m.L}.json`);
  if (!fs.existsSync(f)) { console.warn('dil paketi yok, atlanıyor:', m.L); continue; }
  D[m.L] = { meta: m, ...JSON.parse(fs.readFileSync(f, 'utf8')) };
}
const LANGS = LANG_META.map(m => m.L).filter(L => D[L]);
const rtl = L => !!D[L].meta.rtl;

const catName = (id, L) => D[L].cats[id].name;
const catShort = (id, L) => D[L].cats[id].short;
const secName = (s, L) => D[L].sectors[s.id].name;
const secLine = (s, L) => D[L].sectors[s.id].line;
const secParts = (s, L) => D[L].sectors[s.id].parts;
const typeName = (p, L) => L === 'tr' ? p.type : (D[L].types[p.typeEn] || p.typeEn);
const phraseCache = {};
function trPhrases(s, L) {
  const map = D[L].phrases; if (!map) return s;
  const re = phraseCache[L] || (phraseCache[L] = new RegExp('(?<![A-Za-z])(' + PHRASES.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![A-Za-z])', 'g'));
  return s.replace(re, m => map[m] || m);
}
const nameCache = new Map();
const nm = (p, L) => { if (L === 'tr') return p.name; const k = L + p.id; if (!nameCache.has(k)) nameCache.set(k, L === 'en' ? enName(p) : trPhrases(enName(p), L)); return nameCache.get(k); };
const phone = L => L === 'tr' ? PHONE_TR : PHONE_X;
const mobile = L => L === 'tr' ? MOBILE_TR : MOBILE_X;
const coll = L => L === 'tr' ? 'tr' : L;

// ---------- URL'ler ----------
const base = L => L === 'tr' ? '' : '/' + L;
const U = {
  home: L => L === 'tr' ? '/' : '/' + L,
  products: L => L === 'tr' ? '/urunler' : `${base(L)}/products`,
  cat: (c, L) => L === 'tr' ? `/urunler/${c}` : `${base(L)}/products/${catById[c].en}`,
  catBrand: (c, b, L) => `${U.cat(c, L)}/${brandSlug(b)}`,
  product: (p, L) => L === 'tr' ? `/urun/${p.id}` : `${base(L)}/product/${p.id}`,
  sectors: L => L === 'tr' ? '/sektorler' : `${base(L)}/industries`,
  sector: (s, L) => L === 'tr' ? `/sektorler/${s.id}` : `${base(L)}/industries/${s.en}`,
  brands: L => L === 'tr' ? '/markalar' : `${base(L)}/brands`,
  brand: (b, L) => `${U.brands(L)}/${brandSlug(b)}`,
  custom: L => L === 'tr' ? '/ozel-uretim' : `${base(L)}/custom-manufacturing`,
  about: L => L === 'tr' ? '/kurumsal' : `${base(L)}/about`,
  refs: L => L === 'tr' ? '/referanslar' : `${base(L)}/references`,
  contact: L => L === 'tr' ? '/iletisim' : `${base(L)}/contact`,
  quote: L => L === 'tr' ? '/teklif' : `${base(L)}/quote`,
  kvkk: L => L === 'tr' ? '/kvkk' : `${base(L)}/privacy`,
  cookies: L => L === 'tr' ? '/cerez-politikasi' : `${base(L)}/cookies`,
};
const fileFor = u => u === '/' ? 'index.html' : u.replace(/^\//, '') + '.html';
const abs = u => SITE + (u === '/' ? '/' : u);
const sitemap = [];

// ---------- görseller ----------
const imgUrl = (h, thumb) => h ? `/img/p/${h}${thumb ? '_t' : ''}.webp` : '/img/placeholder.svg';
function copyImages() {
  fs.mkdirSync(path.join(DIST, 'img/p'), { recursive: true });
  const used = new Set(P.flatMap(p => p.imgs));
  for (const h of used) for (const suf of ['', '_t']) {
    const src = path.join(CUT, `${h}${suf}.webp`), raw = path.join(ROOT, 'data/raw', `${h}.webp`);
    const dst = path.join(DIST, 'img/p', `${h}${suf}.webp`);
    if (fs.existsSync(src)) fs.copyFileSync(src, dst); else if (fs.existsSync(raw)) fs.copyFileSync(raw, dst);
  }
  for (const [k, v] of Object.entries(extra)) { const b = Buffer.from(v.split(',')[1], 'base64'); const ext = v.startsWith('data:image/png') ? 'png' : 'webp'; fs.writeFileSync(path.join(DIST, 'img', `${k}.${ext}`), b); }
  fs.copyFileSync(path.join(ROOT, 'assets/logo.png'), path.join(DIST, 'img/logo.png'));
  fs.mkdirSync(path.join(DIST, 'img/flags'), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/flags'))) if (f.endsWith('.svg')) fs.copyFileSync(path.join(ROOT, 'assets/flags', f), path.join(DIST, 'img/flags', f));
  fs.writeFileSync(path.join(DIST, 'img/placeholder.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f4f4f9"/><path d="M70 60h60v80H70z" fill="none" stroke="#c7c6d8" stroke-width="4"/><path d="M70 80h60M70 100h60M70 120h60" stroke="#c7c6d8" stroke-width="3"/></svg>`);
}
const extraUrl = k => { const v = extra[k]; if (!v) return ''; return `/img/${k}.${v.startsWith('data:image/png') ? 'png' : 'webp'}`; };

// ---------- ikonlar ----------
const I = {
  arrow: '<svg class="i-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.2 1.2z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
};

// ---------- sayfa iskeleti ----------
// route: dil -> bu sayfanın o dildeki adresi (hreflang ve dil menüsü için)
function layout({ L, path: url, route, title, desc, body, jsonld = [], noindex = false, ogImg }) {
  const t = D[L].t, x = t.x;
  const fullTitle = title ? `${title} | Sofilx` : x.siteTitle;
  const canon = abs(url);
  if (!noindex) sitemap.push({ url, route, L });
  const langHref = l => route ? route(l) : U.home(l);
  const hreflang = route ? LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${abs(route(l))}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${abs(route('tr'))}">` : '';
  const langLinks = LANGS.map(l => `<a href="${langHref(l)}" hreflang="${l}" lang="${l}" role="menuitem"${l === L ? ' aria-current="true"' : ''}>${flagImg(l, 1)}<b>${l.toUpperCase()}</b><i>${esc(D[l].meta.name)}</i></a>`).join('');
  const navItem = (k, href) => `<a href="${href}" data-nav="${k}">${t.nav[k]}</a>`;
  const mega = CATS.map(c => `<a href="${U.cat(c.id, L)}"><span class="th"><img src="${imgUrl(catCover[c.id], 1)}" alt="" loading="lazy" width="52" height="52"></span><span><b>${esc(catName(c.id, L))}</b><small>${P.filter(p => p.cat === c.id).length} ${t.items}</small></span></a>`).join('');
  const fonts = FONT_BASE + (FONT_EXTRA[L] ? '&' + FONT_EXTRA[L] : '');
  return `<!doctype html>
<html lang="${L}" dir="${rtl(L) ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${canon}">
${hreflang}
<meta property="og:type" content="website"><meta property="og:site_name" content="Sofilx"><meta property="og:locale" content="${D[L].meta.locale}">
<meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}">
<meta property="og:image" content="${SITE}${ogImg || extraUrl('hero')}">
<meta name="theme-color" content="#27235d">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${BUILD}">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
<script>window.SFX=${JSON.stringify({ L, w3f: WEB3FORMS_KEY, gtm: GTM_ID, wa: WA, quote: U.quote(L), products: U.products(L), t: { added: t.added, seeList: t.seeList, inList: t.inList, addToList: t.addToList, addMore: t.addMore, drawerEmpty: t.drawerEmpty, lines: t.lines, pcs: t.pcs, requestQuote: t.requestQuote, backToProducts: t.backToProducts, copied: t.copied, failMsg: t.failMsg, sending: t.form.sending, submit: t.form.submit, notePer: t.form.notePer, items: t.items, noResult: t.noResult, viewAll: t.viewAll, waList: x.waList } })}</script>
</head>
<body>
<a class="skip" href="#main">${x.skip}</a>
<div class="topbar"><div class="wrap"><a href="tel:${PHONE_INT}" dir="ltr">${I.phone}${phone(L)}</a><a href="https://wa.me/${WA}" target="_blank" rel="noopener" dir="ltr">${I.wa}${mobile(L)}</a><a class="tb-mail" href="mailto:${EMAIL}">${I.mail}${EMAIL}</a><span class="tb-r">${t.topRight}</span>
<div class="langsw"><button type="button" class="langbtn" id="lang-btn" aria-haspopup="true" aria-expanded="false" aria-controls="lang-menu" aria-label="${esc(x.language)}: ${esc(D[L].meta.name)}">${flagImg(L)}<b>${L.toUpperCase()}</b>${I.chev}</button><div class="langmenu" id="lang-menu" role="menu" hidden>${langLinks}</div></div></div></div>
<header class="site">
  <div class="wrap">
    <a class="logo" href="${U.home(L)}" aria-label="Sofilx"><img src="/img/logo.png" alt="Sofilx" width="383" height="90"></a>
    <nav class="main" aria-label="${esc(x.mainMenu)}">
      <div class="mega-wrap"><a href="${U.products(L)}" class="mega-btn" data-nav="products">${t.nav.products} ${I.chev}</a><div class="mega">${mega}</div></div>
      ${navItem('sectors', U.sectors(L))}${navItem('brands', U.brands(L))}${navItem('custom', U.custom(L))}${navItem('about', U.about(L))}${navItem('refs', U.refs(L))}${navItem('contact', U.contact(L))}
    </nav>
    <div class="hicons">
      <button class="ibtn" type="button" id="search-btn" aria-label="${t.searchBtn}" aria-expanded="false">${I.search}</button>
      <button class="ibtn cartbtn" type="button" id="open-cart" aria-label="${t.list}">${I.bag}<span class="count" id="badge">0</span></button>
      <button class="ibtn menu-btn" type="button" id="menu-btn" aria-label="Menu">${I.menu}</button>
    </div>
  </div>
  <div class="searchpanel" id="searchpanel" hidden><div class="wrap"><div class="hsearch">${I.search}<input id="q-top" type="search" autocomplete="off" placeholder="${t.searchPh}" aria-label="${t.searchBtn}"><div class="results" id="res-top" hidden></div></div></div></div>
  <div class="mnav" id="mnav"><a href="${U.products(L)}">${t.nav.products}</a><a href="${U.sectors(L)}">${t.nav.sectors}</a><a href="${U.brands(L)}">${t.nav.brands}</a><a href="${U.custom(L)}">${t.nav.custom}</a><a href="${U.about(L)}">${t.nav.about}</a><a href="${U.refs(L)}">${t.nav.refs}</a><a href="${U.contact(L)}">${t.nav.contact}</a><div class="mlang"><p>${I.globe}${esc(x.language)}</p><div>${langLinks}</div></div></div>
</header>
<main id="main">
${body}
</main>
<footer class="site">
  <div class="wrap">
    <div><a class="logo" href="${U.home(L)}"><img src="/img/logo.png" alt="Sofilx" width="383" height="90" loading="lazy"></a><p>${t.footP}</p></div>
    <div><h4>${t.products}</h4>${CATS.map(c => `<a href="${U.cat(c.id, L)}">${esc(catName(c.id, L))}</a>`).join('')}</div>
    <div><h4>Sofilx</h4><a href="${U.about(L)}">${t.nav.about}</a><a href="${U.sectors(L)}">${t.nav.sectors}</a><a href="${U.brands(L)}">${t.nav.brands}</a><a href="${U.refs(L)}">${t.nav.refs}</a><a href="${U.custom(L)}">${t.nav.custom}</a><a href="${U.quote(L)}">${t.list}</a><a href="${U.contact(L)}">${t.customerCenter}</a></div>
    <div><h4>${t.nav.contact}</h4><p>${ADDRESS}</p><p><a href="tel:${PHONE_INT}" dir="ltr">${phone(L)}</a><a href="https://wa.me/${WA}" target="_blank" rel="noopener"><span dir="ltr">${mobile(L)}</span> · WhatsApp</a></p><p><a href="mailto:${EMAIL}">${EMAIL}</a></p></div>
  </div>
  <div class="legal"><div class="wrap"><span>© <span id="yr">${new Date().getFullYear()}</span> Sofilx. ${t.rights}</span><span class="legal-links"><a href="${U.kvkk(L)}">${t.kvkkL}</a><a href="${U.cookies(L)}">${t.cookieL}</a><button type="button" class="linkbtn" id="cookie-open">${x.cookieSettings}</button></span></div><div class="wrap note">${t.footLegal}</div></div>
</footer>
<a class="wa-float" href="https://wa.me/${WA}?text=${encodeURIComponent(x.waHello)}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}<span>${x.waFloat}</span></a>
<div class="mbar"><a class="btn btn-line" href="${U.products(L)}">${t.nav.products}</a><a class="btn btn-dark" href="${U.quote(L)}">${t.list} · <span id="mcount">0</span></a></div>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" aria-label="${t.list}" aria-hidden="true"><header><h2>${t.list}</h2><button class="x" type="button" id="close-cart" aria-label="Close">${I.close}</button></header><div class="list" id="drawer-list"></div><footer id="drawer-foot"></footer></aside>
<div class="toast" id="toast" role="status"><span id="toast-t"></span><button type="button" id="toast-b">${t.seeList}</button></div>
<div class="cookiebar" id="cookiebar" hidden><p>${t.cookie.text} <a href="${U.cookies(L)}">${t.cookie.more}</a></p><div><button class="btn btn-line btn-sm" type="button" id="ck-reject">${t.cookie.reject}</button><button class="btn btn-dark btn-sm" type="button" id="ck-accept">${t.cookie.accept}</button></div></div>
<script src="/assets/site.js?v=${BUILD}" defer></script>
</body>
</html>`;
}
const BUILD = Date.now().toString(36);

// ---------- bileşenler ----------
const kindOf = p => p.brand === 'Sofilx' ? 'Sofilx' : (p.cat === 'endustriyel-yaglar' || p.cat === 'kompresor-kaplinleri') ? 'Orijinal' : 'Muadil';
const kindLabel = (p, L) => { const k = kindOf(p), t = D[L].t; return k === 'Muadil' ? t.muadil : k === 'Orijinal' ? t.original : t.sofilxMade; };
function card(p, L) {
  const t = D[L].t, n = nm(p, L);
  return `<article class="card" data-id="${p.id}" data-name="${esc(n)}" data-code="${esc(codeLine(p))}" data-img="${imgUrl(p.img, 1)}" data-url="${U.product(p, L)}" data-brand="${esc(p.brand)}" data-type="${esc(typeName(p, L))}" data-cat="${p.cat}">
  <div class="phw"><a class="ph" href="${U.product(p, L)}"><img src="${imgUrl(p.img, 1)}" alt="${esc(n)}" loading="lazy" width="440" height="440"><span class="tag">${kindLabel(p, L)}</span></a>
  <button class="quick" type="button" data-add="${p.id}" aria-label="${t.addToList}" title="${t.addToList}">${I.plus}</button></div>
  <div class="info"><span class="brandname">${esc(p.brand)}</span><h3><a href="${U.product(p, L)}">${esc(n)}</a></h3>${p.codes.length ? `<span class="code" dir="ltr">${esc(codeLine(p))}</span>` : ''}</div></article>`;
}
const crumbs = (items) => `<nav class="crumbs" aria-label="breadcrumb">${items.map((x, i) => i < items.length - 1 ? `<a href="${x[1]}">${esc(x[0])}</a><span>/</span>` : `<span aria-current="page">${esc(x[0])}</span>`).join('')}</nav>`;
const crumbLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: abs(x[1]) })) });
function helpCenter(L) {
  const t = D[L].t, h = t.help;
  const links = [U.quote(L), `https://wa.me/${WA}`, U.products(L), `tel:${PHONE_INT}`, U.custom(L)];
  return `<div class="help"><div><h2>${t.helpH}</h2><p class="lead">${t.helpP}</p><p class="hours">${t.helpHours}</p></div><div class="help-list">${h.map((x, i) => `<a href="${links[i]}"${i === 1 ? ' target="_blank" rel="noopener"' : ''}><span><b>${x[0]}</b><small>${x[1]}</small></span><span class="go">${x[2]}</span></a>`).join('')}</div></div>`;
}
function sectorTile(s, L) {
  const ps = sectorProducts(s).slice(0, 3);
  return `<a class="sector" href="${U.sector(s, L)}"><div><h3>${esc(secName(s, L))}</h3><p>${esc(secLine(s, L))}</p></div><div class="thumbs">${ps.map(p => `<span><img src="${imgUrl(p.img, 1)}" alt="" loading="lazy" width="52" height="52"></span>`).join('')}<span class="arrow">${I.arrow}</span></div></a>`;
}
const orgLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Sofilx', url: SITE, logo: SITE + '/img/logo.png', email: EMAIL, telephone: '+90 216 606 32 06', address: { '@type': 'PostalAddress', streetAddress: 'Esatpaşa Mah. Bingöl Sok. No:1A', addressLocality: 'Ataşehir', addressRegion: 'İstanbul', addressCountry: 'TR' }, contactPoint: [{ '@type': 'ContactPoint', telephone: '+90 216 606 32 06', contactType: 'sales', availableLanguage: ['Turkish', 'English'] }] };

// ---------- sayfalar ----------
function pageHome(L) {
  const t = D[L].t, x = t.x, url = U.home(L);
  const popular = ['vakum-pompasi-filtreleri', 'karbon-paletler', 'fiber-paletler', 'kompresor-filtreleri'].flatMap(c => P.filter(p => p.cat === c && p.img && p.models.length).slice(0, 2));
  const body = `<section class="hero2"><div class="hero2-top"><div class="hero2-bg"></div><div class="wrap hero2-in">
  <div class="h2copy"><span class="kick">${t.heroKick}</span><h1>${t.heroH1a}<br><span class="hl">${t.heroH1b}</span></h1><p>${t.heroP}</p>
   <div class="h2btns"><a class="btn btn-white" href="${U.products(L)}">${t.heroBtn} ${I.arrow}</a><a class="btn btn-ghostw" href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa} ${t.waQuote}</a></div></div>
  <div class="h2art"><div class="ring"></div>
   <a class="speccard" href="${U.products(L)}"><div class="sc-photo"><img src="${extraUrl('herocard')}" alt="" width="250" height="250"></div>
    <div class="sc-band"><div><small>${t.cardKick}</small><b>${CATS.length} ${t.cardGroups}</b></div><span class="sc-stock">${t.stockIn}</span></div>
    <ol class="sc-list">${CATS.slice(0, 5).map(c => `<li>${esc(catName(c.id, L))}</li>`).join('')}</ol>
    <div class="sc-foot"><span>${t.cardFoot}</span><span class="sc-plus">${I.arrow}</span></div></a>
   <div class="chip2 c1"><span class="ci">${I.check}</span><div><b>${t.chipBrand[0]}</b><small>${t.chipBrand[1]}</small></div></div>
   <div class="chip2 c2"><span class="ci">${I.search}</span><div><b>${t.chipRef[0]}</b><small>${t.chipRef[1]}</small></div></div>
  </div></div></div>
  <div class="wrap"><div class="searchcard"><form id="hero-form" role="search">${I.search.replace('<svg', '<svg class="sicon"')}<input id="q-hero" type="search" autocomplete="off" placeholder="${t.searchHeroPh}" aria-label="${t.searchBtn}"><button class="btn btn-dark" type="submit">${t.searchBtn}</button></form>
   <div class="tries">${t.example}: ${x.examples.map(e => `<button class="chip" type="button" data-try="${esc(e)}">${esc(e)}</button>`).join('')}</div><div class="results" id="res-hero" hidden></div></div>
   <div class="facts">${t.facts.map(f => `<div><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.groupsH}</h2><p>${t.groupsP}</p></div><a class="link" href="${U.products(L)}">${t.allProducts} ${I.arrow}</a></div>
  <div class="cats">${CATS.map(c => `<a class="cat" href="${U.cat(c.id, L)}"><div class="ph"><img src="${imgUrl(catCover[c.id])}" alt="${esc(catName(c.id, L))}" loading="lazy" width="900" height="900"></div><div class="meta"><div><h3>${esc(catName(c.id, L))}</h3><small>${esc(catShort(c.id, L))} · ${P.filter(p => p.cat === c.id).length} ${t.items}</small></div><span class="arrow">${I.arrow}</span></div></a>`).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.sectorsH}</h2><p>${t.sectorsP}</p></div><a class="link" href="${U.sectors(L)}">${t.viewAll} ${I.arrow}</a></div><div class="sectors">${SECTORS.map(s => sectorTile(s, L)).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.howH}</h2><p>${t.howP}</p></div></div><div class="how">${t.how.map((h, i) => `<div><span class="n">0${i + 1}</span><h3>${h[0]}</h3><p>${h[1]}</p></div>`).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.popularH}</h2></div><a class="link" href="${U.products(L)}">${t.allProducts} ${I.arrow}</a></div><div class="cards">${popular.map(p => card(p, L)).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="duo">
  <a class="banner" href="${U.cat('endustriyel-yaglar', L)}"><img src="${extraUrl('banner_oils')}" alt="" loading="lazy"><div><h3>${t.oilsH}</h3><p>${t.oilsP}</p><span class="btn btn-sm">${t.oilsBtn}</span></div></a>
  <a class="banner" href="${U.custom(L)}"><img src="${extraUrl('banner_custom')}" alt="" loading="lazy"><div><h3>${t.customH}</h3><p>${t.customP}</p><span class="btn btn-sm">${t.customBtn}</span></div></a></div></div></section>
 <section class="block"><div class="wrap">${helpCenter(L)}</div></section>`;
  write(fileFor(url), layout({ L, path: url, route: U.home, title: '', desc: x.homeDesc, body, jsonld: [orgLd, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Sofilx', url: abs(url), inLanguage: L, potentialAction: { '@type': 'SearchAction', target: `${SITE}${U.products(L)}?q={q}`, 'query-input': 'required name=q' } }] }));
}

function listingPage({ L, url, route, title, h1, sub, items, crumbItems, desc, intro }) {
  const t = D[L].t;
  items = [...items].sort((a, b) => (!!b.img - !!a.img) || ((b.models.length > 0) - (a.models.length > 0)) || ((b.codes.length > 0) - (a.codes.length > 0)) || nm(a, L).localeCompare(nm(b, L), coll(L), { numeric: true }));
  const brandsIn = [...new Set(items.map(p => p.brand))].sort((a, b) => a.localeCompare(b, 'tr'));
  const typesIn = [...new Set(items.map(p => typeName(p, L)))].sort((a, b) => a.localeCompare(b, coll(L)));
  const catsIn = [...new Set(items.map(p => p.cat))];
  const opt = (g, v, label, n) => `<label class="opt"><input type="checkbox" data-g="${g}" value="${esc(v)}"><span>${esc(label)}</span><span class="c">${n}</span></label>`;
  const body = `<div class="wrap">${crumbs(crumbItems)}
 <div class="cat-head"><div><h1>${esc(h1)}</h1><p>${esc(sub)}</p></div></div>${intro ? `<div class="cat-intro">${intro}</div>` : ''}
 <div class="cat-layout"><aside class="filters" id="filters">
  <div class="inlinesearch">${I.search}<input id="f-q" type="search" placeholder="${t.searchInList}" aria-label="${t.searchInList}"></div>
  ${catsIn.length > 1 ? `<div><h4>${t.productGroup}</h4>${catsIn.map(c => opt('cat', c, catName(c, L), items.filter(p => p.cat === c).length)).join('')}</div>` : ''}
  ${brandsIn.length > 1 ? `<div><h4>${t.brand}</h4>${brandsIn.map(b => opt('brand', b, b, items.filter(p => p.brand === b).length)).join('')}</div>` : ''}
  ${typesIn.length > 1 ? `<div><h4>${t.type}</h4>${typesIn.map(v => opt('type', v, v, items.filter(p => typeName(p, L) === v).length)).join('')}</div>` : ''}
  <button class="btn btn-line btn-sm" type="button" id="f-clear">${t.clear}</button></aside>
 <div style="min-width:0"><div class="toolbar"><span id="f-count">${items.length} ${t.items}</span><div style="display:flex;gap:8px"><button class="btn btn-line btn-sm filter-toggle" type="button" id="f-toggle">${t.filters}</button><select id="f-sort" aria-label="Sort"><option value="rel">${t.sort[0]}</option><option value="az">${t.sort[1]}</option></select></div></div>
 <div class="cards grid-auto" id="grid">${items.map(p => card(p, L)).join('')}</div><div class="empty" id="grid-empty" hidden>${t.noResult}</div></div></div></div>`;
  write(fileFor(url), layout({ L, path: url, route, title, desc, body, jsonld: [crumbLd(crumbItems.map((c, i) => i === crumbItems.length - 1 ? [c[0], url] : c))] }));
}

function pageProducts(L) {
  const t = D[L].t, x = t.x;
  listingPage({ L, url: U.products(L), route: U.products, title: t.allProducts, h1: t.allProducts, sub: `${P.length} ${t.items}`, items: P, crumbItems: [[t.home, U.home(L)], [t.products, U.products(L)]], desc: x.productsDesc });
  for (const c of CATS) {
    const items = P.filter(p => p.cat === c.id), cn = catName(c.id, L);
    const intro = (data.cats.find(z => z.cat === c.id) || {}).intro || [];
    listingPage({ L, url: U.cat(c.id, L), route: l => U.cat(c.id, l), title: cn, h1: cn, sub: `${catShort(c.id, L)} · ${items.length} ${t.items}`, items, crumbItems: [[t.home, U.home(L)], [t.products, U.products(L)], [cn, U.cat(c.id, L)]], desc: fill(x.catDesc, { cat: cn }), intro: L === 'tr' && intro.length ? `<p>${esc(intro.join(' '))}</p>` : '' });
    for (const b of [...new Set(items.map(p => p.brand))]) {
      if (b === 'Sofilx') continue;
      const bi = items.filter(p => p.brand === b);
      const lst = data.lists.find(z => z.cat === c.id && z.brand === b);
      const cnl = L === 'tr' ? cn.toLocaleLowerCase('tr') : L === 'en' ? cn.toLowerCase() : cn;
      const ttl = fill(x.catBrandTitle, { brand: b, cat: cn });
      listingPage({ L, url: U.catBrand(c.id, b, L), route: l => U.catBrand(c.id, b, l), title: ttl, h1: ttl, sub: `${bi.length} ${t.items}`, items: bi, crumbItems: [[t.home, U.home(L)], [t.products, U.products(L)], [cn, U.cat(c.id, L)], [b, U.catBrand(c.id, b, L)]], desc: fill(x.catBrandDesc, { brand: b, cat: cnl }), intro: L === 'tr' && lst && lst.intro && lst.intro.length ? `<p>${esc(lst.intro.join(' '))}</p>` : '' });
    }
  }
}

function dimSvg(p, L) {
  const d = p.dims; if (!d) return ''; const t = D[L].t;
  const fmt = v => String(v).replace('.', t.x.dec).replace(/[,.]0$/, '');
  const sx = 440 / d.l, w = d.l * sx, h = Math.max(d.w * sx, 36), x0 = 70, y0 = 60, ty = y0 + h + 70, th = Math.max(d.t * sx * 2, 8);
  return `<svg class="dim" viewBox="0 0 600 ${Math.round(ty + th + 70)}" role="img" aria-label="${t.drawThumb}: ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.t)} mm" direction="ltr"><defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 9 5 0 9z" fill="#27235d"/></marker></defs>
<text x="${x0}" y="28" class="dl">${t.drawTop}</text><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="2" class="part"/>
<line x1="${x0}" y1="${y0 + h + 12}" x2="${x0}" y2="${y0 + h + 34}" class="ext"/><line x1="${x0 + w}" y1="${y0 + h + 12}" x2="${x0 + w}" y2="${y0 + h + 34}" class="ext"/>
<line x1="${x0 + 4}" y1="${y0 + h + 26}" x2="${x0 + w - 4}" y2="${y0 + h + 26}" class="dimln" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="${x0 + w / 2}" y="${y0 + h + 20}" class="dv">${fmt(d.l)} mm</text>
<line x1="${x0 + w + 12}" y1="${y0}" x2="${x0 + w + 34}" y2="${y0}" class="ext"/><line x1="${x0 + w + 12}" y1="${y0 + h}" x2="${x0 + w + 34}" y2="${y0 + h}" class="ext"/>
<line x1="${x0 + w + 26}" y1="${y0 + 4}" x2="${x0 + w + 26}" y2="${y0 + h - 4}" class="dimln" marker-start="url(#ar)" marker-end="url(#ar)"/><text x="${x0 + w + 36}" y="${y0 + h / 2 + 5}" class="dv" text-anchor="start">${fmt(d.w)} mm</text>
<text x="${x0}" y="${ty - 14}" class="dl">${t.drawSide}</text><rect x="${x0}" y="${ty}" width="${w}" height="${th}" class="part"/>
<line x1="${x0 + w + 12}" y1="${ty}" x2="${x0 + w + 34}" y2="${ty}" class="ext"/><line x1="${x0 + w + 12}" y1="${ty + th}" x2="${x0 + w + 34}" y2="${ty + th}" class="ext"/>
<text x="${x0 + w + 36}" y="${ty + th / 2 + 5}" class="dv" text-anchor="start">${fmt(d.t)} mm</text><text x="${x0}" y="${ty + th + 46}" class="dn">${t.drawNote}</text></svg>`;
}

function pageProduct(p, L) {
  const t = D[L].t, x = t.x, n = nm(p, L), url = U.product(p, L), route = l => U.product(p, l);
  const cn = catName(p.cat, L);
  const ty = typeName(p, L);
  const sec = sectorsOfProduct(p);
  const fmtD = d => `${String(d.l).replace(/\.0$/, '').replace('.', x.dec)} × ${String(d.w).replace(/\.0$/, '').replace('.', x.dec)} × ${String(d.t).replace(/\.0$/, '').replace('.', x.dec)} mm`;
  const tyl = L === 'tr' ? ty.toLocaleLowerCase('tr') : ty;
  const genericDesc = `${n}. ${p.brand !== 'Sofilx' ? fill(x.descCompat, { type: tyl, brand: p.brand }) : fill(x.descSofilx, { type: ty })}${p.models.length ? ' ' + fill(x.descFits, { n: p.models.length, list: p.models.slice(0, 3).join(', ') }) : ''}${p.dims ? ' ' + fill(x.descDims, { d: fmtD(p.dims) }) : ''}`;
  const descPlain = clip(plain(p.descHtml), 400);
  const metaDesc = clip(L === 'tr' ? (descPlain || genericDesc) + ' ' + x.reqQuote : genericDesc + ' ' + x.reqQuote, 158);
  const specs = [[t.partNo, p.codes.length ? `<span class="mono" dir="ltr">${esc(codeLine(p))}</span>` : esc(n)]];
  const sof = p.equiv.filter(e => /^SF/i.test(e)), xr = p.equiv.filter(e => !/^SF/i.test(e));
  if (xr.length) specs.push([t.crossRef, `<div class="models" dir="ltr">${xr.map(e => `<span>${esc(e)}</span>`).join('')}</div>`]);
  if (sof.length) specs.push([t.sofilxNo, `<span class="mono" dir="ltr">${esc(sof.join(' · '))}</span>`]);
  if (p.dims) specs.push([t.size, `<span dir="ltr">${fmtD(p.dims)}</span>`]);
  if (p.set) specs.push([t.setSize, `${p.set}${t.setUnit}`]);
  specs.push([t.ptype, esc(ty)], [t.brand, `<a href="${U.brand(p.brand, L)}">${esc(p.brand)}</a>`], [t.group, `<a href="${U.cat(p.cat, L)}">${esc(cn)}</a>`]);
  if (sec.length) specs.push([t.usedIn, `<div class="models">${sec.map(s => `<a class="stag" href="${U.sector(s, L)}">${esc(secName(s, L))}</a>`).join('')}</div>`]);
  const waTxt = encodeURIComponent(x.waProduct + `${n}${p.codes.length ? ' (' + codeLine(p) + ')' : ''} – ${SITE}${url}`);
  const tabs = [
    ['uyum', t.tabs.uyum, `<div class="compat"><div><h3>${t.compatBrands}</h3><ul class="blist"><li>${esc(p.brand)}</li></ul></div>${p.models.length ? `<div><h3>${t.compatModels} <span class="cnt">${p.models.length}</span></h3><div class="mgrid" dir="ltr">${p.models.map(m => `<span>${esc(m)}</span>`).join('')}</div></div>` : `<div class="tabnote"><b>${t.noModels[0]}</b><p>${t.noModels[1]}</p><a class="btn btn-line btn-sm" href="https://wa.me/${WA}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${t.noModels[2]}</a></div>`}</div>`],
    ['teknik', t.tabs.teknik, `<div class="techgrid"><dl class="sp">${specs.map(s => `<dt>${s[0]}</dt><dd>${s[1]}</dd>`).join('')}</dl>${p.dims ? `<figure class="dimbox">${dimSvg(p, L)}</figure>` : ''}</div>`],
    ['aciklama', t.tabs.aciklama, `<div class="prose rich">${L === 'tr' ? (p.descHtml || `<p>${esc(genericDesc)}</p>`) : `<p>${esc(genericDesc)}</p>${p.descHtml ? `<details class="srcdoc"><summary>${x.origDetails}</summary><div lang="tr" dir="ltr">${p.descHtml}</div></details>` : ''}`}</div>`],
    ['genel', t.tabs.genel, `<div class="prose">${t.genel}</div>`],
    ['teslimat', t.tabs.teslimat, `<div class="facts3">${t.teslimat.map(z => `<div><b>${z[0]}</b><p>${z[1]}</p></div>`).join('')}</div>`],
    ['iade', t.tabs.iade, `<div class="prose">${t.iade}</div>`],
    ['sss', t.tabs.sss, `<div class="faq">${t.faq.map((q, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}</div>`],
  ];
  const gallery = p.imgs.length ? p.imgs : [null];
  const thumbs = gallery.map((h, i) => `<button class="thumb${i === 0 ? ' on' : ''}" type="button" data-src="${imgUrl(h)}" aria-label="${t.photo} ${i + 1}"><img src="${imgUrl(h, 1)}" alt="" width="84" height="84" loading="lazy"></button>`).concat(p.dims ? [`<button class="thumb" type="button" data-view="dim" aria-label="${t.drawThumb}">${dimSvg(p, L)}</button>`] : []);
  const rel = P.filter(z => z.id !== p.id && z.cat === p.cat && z.img).sort((a, b) => (b.brand === p.brand) - (a.brand === p.brand)).slice(0, 4);
  const crumbItems = [[t.home, U.home(L)], [cn, U.cat(p.cat, L)], ...(p.brand !== 'Sofilx' ? [[p.brand, U.catBrand(p.cat, p.brand, L)]] : []), [n, url]];
  const body = `<div class="wrap">${crumbs(crumbItems)}
 <div class="pd" data-id="${p.id}" data-name="${esc(n)}" data-code="${esc(codeLine(p))}" data-img="${imgUrl(p.img, 1)}" data-url="${url}">
  <div class="gal"><div class="gallery" id="gal-main"><img src="${imgUrl(p.img)}" alt="${esc(n)}" width="900" height="900" fetchpriority="high"></div>${thumbs.length > 1 ? `<div class="thumbs">${thumbs.join('')}</div>` : ''}<template id="dimtpl">${dimSvg(p, L)}</template></div>
  <div><div class="kicker"><span class="pill">${kindLabel(p, L)}</span><span class="stock">${esc(p.brand)}</span></div>
  <h1>${esc(n)}</h1>${p.codes.length && !p.codes.every(c => n.includes(c)) ? `<div class="codeline" dir="ltr">${esc(codeLine(p))}</div>` : ''}
  <dl class="quick-sp">${p.models.length ? `<dt>${t.compatible}</dt><dd><span dir="ltr">${esc(p.models.slice(0, 3).join(', '))}</span>${p.models.length > 3 ? ` <a href="#tab-uyum" data-goto="uyum">+${p.models.length - 3}</a>` : ''}</dd>` : ''}${xr.length ? `<dt>${x.crossShort}</dt><dd class="mono" dir="ltr">${esc(xr.slice(0, 3).join(' · '))}</dd>` : ''}${sof.length ? `<dt>${t.sofilxNo}</dt><dd class="mono" dir="ltr">${esc(sof.join(' · '))}</dd>` : ''}${p.dims ? `<dt>${t.size}</dt><dd dir="ltr">${fmtD(p.dims)}</dd>` : ''}<dt>${t.type2}</dt><dd>${esc(ty)}</dd></dl>
  <div class="buy"><div class="buyrow"><div class="qty"><button type="button" data-step="-1" aria-label="-">−</button><input id="pd-qty" type="number" min="1" value="1" aria-label="${x.qty}"><button type="button" data-step="1" aria-label="+">+</button></div><button class="btn btn-dark" type="button" id="pd-add">${t.addToList}</button></div>
   <a class="btn btn-line wa" href="https://wa.me/${WA}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${t.waAsk}</a>
   <div class="notes">${t.notes.map(z => `<div><b>${z[0]}</b>${z[1]}</div>`).join('')}</div>
   <div class="share"><span>${t.share}</span><a href="https://wa.me/?text=${encodeURIComponent(n + ' – ' + SITE + url)}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}</a><button type="button" data-copy="${esc(codeLine(p) || n)}">${t.copyCode}</button></div></div>
 </div></div>
 <div class="ptabs" role="tablist">${tabs.map((z, i) => `<button type="button" role="tab" class="${i === 0 ? 'on' : ''}" data-tab="${z[0]}" aria-selected="${i === 0}">${z[1]}</button>`).join('')}</div>
 ${tabs.map((z, i) => `<section class="tabpane" id="tab-${z[0]}" role="tabpanel" ${i === 0 ? '' : 'hidden'}><h2 class="sr-only">${z[1]}</h2>${z[2]}</section>`).join('')}
 ${rel.length ? `<section class="block" style="padding-top:56px"><div class="sec-head"><h2 style="font-size:32px">${t.related}</h2></div><div class="cards">${rel.map(r => card(r, L)).join('')}</div></section>` : ''}</div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: n, image: p.imgs.map(h => SITE + imgUrl(h)), description: L === 'tr' ? (descPlain || genericDesc) : genericDesc, brand: { '@type': 'Brand', name: p.brand }, category: cn, ...(p.codes[0] ? { mpn: p.codes[0] } : {}), ...(p.equiv[0] ? { sku: p.equiv[0] } : {}) };
  write(fileFor(url), layout({ L, path: url, route, title: n, desc: metaDesc, body, jsonld: [ld, crumbLd(crumbItems)], ogImg: imgUrl(p.img) }));
}

function simplePage({ L, url, route, title, h1, lead, inner, desc, crumbName, noindex }) {
  const t = D[L].t;
  const body = `<div class="wrap">${crumbs([[t.home, U.home(L)], [crumbName || h1, url]])}<div class="page-head"><h1>${h1}</h1>${lead ? `<p>${lead}</p>` : ''}</div>${inner}</div>`;
  write(fileFor(url), layout({ L, path: url, route, title, desc, body, noindex }));
}

function pageSectors(L) {
  const t = D[L].t, x = t.x;
  simplePage({ L, url: U.sectors(L), route: U.sectors, title: t.nav.sectors, h1: t.nav.sectors, lead: t.sectorsP, inner: `<div class="sectors" style="padding-bottom:20px">${SECTORS.map(s => sectorTile(s, L)).join('')}</div>`, desc: t.sectorsP });
  for (const s of SECTORS) {
    const ps = sectorProducts(s), sn = secName(s, L);
    const inner = `<div class="sec-intro"><div><p style="margin:0;color:var(--muted);font-size:17px;max-width:58ch">${x.sectorIntro}</p><div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap"><button class="btn btn-dark" type="button" id="add-all" data-ids="${ps.map(p => p.id).join(',')}">${x.addAll}</button><a class="btn btn-line" href="${U.quote(L)}">${t.list}</a></div></div>
 <div><p style="margin:0 0 10px;font-size:14px;font-weight:600">${x.mostReplaced}</p><ul>${secParts(s, L).map(z => `<li>${esc(z)}</li>`).join('')}</ul></div></div>
 <div class="cards">${ps.map(p => card(p, L)).join('')}</div>
 <section class="block" style="padding-top:56px"><div class="sec-head"><h2 style="font-size:32px">${x.otherSectors}</h2></div><div class="sectors">${SECTORS.filter(z => z.id !== s.id).slice(0, 4).map(z => sectorTile(z, L)).join('')}</div></section>`;
    simplePage({ L, url: U.sector(s, L), route: l => U.sector(s, l), title: sn, h1: sn, lead: secLine(s, L), inner, desc: `${sn}: ${secParts(s, L).join(', ')}.`, crumbName: sn });
  }
}

function pageBrands(L) {
  const t = D[L].t, x = t.x;
  const logo = b => ({ 'Kaeser': 'logo_kaeser', 'Elmo Rietschle': 'logo_rietschle', 'Leybold': 'logo_leybold', 'Ekomak': 'logo_ekomak', 'Abac': 'logo_abac', 'Orion': 'logo_orion', 'Almig': 'logo_almig', 'Alup': 'logo_alup', 'Boge': 'logo_boge' })[b];
  const inner = `<div class="brandgrid">${brands.map(b => { const n = P.filter(p => p.brand === b).length, l = logo(b); return `<a href="${U.brand(b, L)}">${l && extra[l] ? `<img src="${extraUrl(l)}" alt="${esc(b)}" loading="lazy">` : `<b>${esc(b)}</b>`}<small>${n} ${t.items}</small></a>`; }).join('')}</div>`;
  simplePage({ L, url: U.brands(L), route: U.brands, title: t.nav.brands, h1: t.nav.brands, lead: x.brandsLead, inner, desc: x.brandsDesc });
  for (const b of brands) {
    const items = P.filter(p => p.brand === b);
    listingPage({ L, url: U.brand(b, L), route: l => U.brand(b, l), title: b, h1: b, sub: `${items.length} ${t.items}`, items, crumbItems: [[t.home, U.home(L)], [t.nav.brands, U.brands(L)], [b, U.brand(b, L)]], desc: fill(x.brandDesc, { brand: b }) });
  }
}

function pageCustom(L) {
  const t = D[L].t, x = t.x;
  const items = P.filter(p => p.cat === 'ozel-uretim-filtreler' || p.cat === 'endustriyel-filtreler');
  const inner = `<div class="cards" style="padding-bottom:20px">${items.map(p => card(p, L)).join('')}</div><section class="block" style="padding-top:48px"><div class="sec-head"><div><h2 style="font-size:32px">${x.customNeed}</h2></div></div><dl class="sp" style="max-width:760px">${x.customRows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl><div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap"><a class="btn btn-dark" href="${U.quote(L)}">${t.requestQuote}</a><a class="btn btn-line" href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa} ${t.waAsk}</a></div></section>`;
  simplePage({ L, url: U.custom(L), route: U.custom, title: t.nav.custom, h1: x.customH1, lead: x.customLead, inner, desc: x.customDesc });
}

function pageAbout(L) {
  const t = D[L].t, x = t.x, st = x.aboutStats;
  const stats = [[`${P.length}+`, st[0]], [`${brands.length}+`, st[1]], [`${CATS.length}`, st[2]], [st[3], st[4]]];
  const inner = `<div class="statband">${stats.map(s => `<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div><div class="two">${x.aboutBlocks.map(b => `<div class="box"><h2>${b[0]}</h2><p>${b[1]}</p></div>`).join('')}<div class="box"><h2>${x.visit}</h2><p>${ADDRESS}</p><a class="btn btn-dark btn-sm" href="${U.contact(L)}">${t.nav.contact}</a></div></div>`;
  simplePage({ L, url: U.about(L), route: U.about, title: t.nav.about, h1: x.aboutH1, lead: x.aboutLead, inner, desc: x.aboutLead, crumbName: t.nav.about });
}

function pageRefs(L) {
  const t = D[L].t, x = t.x;
  const inner = `<div class="statband">${SECTORS.slice(0, 4).map(s => `<div><b>${esc(secName(s, L))}</b><span>${esc(secLine(s, L))}</span></div>`).join('')}</div>
  <section class="block" style="padding-top:24px"><div class="sec-head"><div><h2 style="font-size:32px">${x.served}</h2><p>${x.servedP}</p></div></div><div class="sectors">${SECTORS.map(s => sectorTile(s, L)).join('')}</div></section>
  <section class="block"><div class="custom-cta"><div><h2>${x.work}</h2><p>${x.workP}</p></div><a class="btn btn-white" href="${U.quote(L)}">${t.requestQuote}</a></div></section>`;
  simplePage({ L, url: U.refs(L), route: U.refs, title: t.nav.refs, h1: t.nav.refs, lead: x.refsLead, inner, desc: x.refsDesc });
}

function pageContact(L) {
  const t = D[L].t, x = t.x;
  const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Sofilx Esatpaşa Bingöl Sok. No:1A Ataşehir İstanbul');
  const inner = `<div class="two"><div class="box"><dl class="kv"><dt>${x.address}</dt><dd>${ADDRESS}</dd><dt>${x.phone}</dt><dd><a href="tel:${PHONE_INT}" dir="ltr">${phone(L)}</a></dd><dt>WhatsApp</dt><dd><a href="https://wa.me/${WA}" target="_blank" rel="noopener" dir="ltr">${mobile(L)}</a></dd><dt>${x.email}</dt><dd><a href="mailto:${EMAIL}">${EMAIL}</a></dd></dl>
  <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap"><a class="btn btn-dark" href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa} WhatsApp</a><a class="btn btn-line" href="${map}" target="_blank" rel="noopener">${x.directions}</a></div></div>
  <a class="banner" href="${map}" target="_blank" rel="noopener" style="min-height:320px"><img src="${extraUrl('hero')}" alt="" loading="lazy"><div><h3>${x.cityName}</h3><p>${ADDRESS}</p><span class="btn btn-sm">${x.openMaps}</span></div></a></div>${helpCenter(L)}`;
  const ld = { ...orgLd, '@type': 'LocalBusiness', image: SITE + '/img/logo.png' };
  const body = `<div class="wrap">${crumbs([[t.home, U.home(L)], [t.nav.contact, U.contact(L)]])}<div class="page-head"><h1>${t.nav.contact}</h1><p>${x.contactLead}</p></div>${inner}</div>`;
  write(fileFor(U.contact(L)), layout({ L, path: U.contact(L), route: U.contact, title: t.nav.contact, desc: fill(x.contactDesc, { addr: ADDRESS, phone: phone(L), email: EMAIL }), body, jsonld: [ld] }));
}

function pageQuote(L) {
  const t = D[L].t, f = t.form;
  const inner = `<div class="quote" id="quote-root"><div style="min-width:0"><div id="q-lines"></div><p class="photo-tip">${I.wa} <a href="https://wa.me/${WA}" target="_blank" rel="noopener">${f.photoTip}</a></p><a class="link" href="${U.products(L)}" style="margin-top:18px">${I.plus.replace('<svg', '<svg width="16" height="16"')} ${t.backToProducts}</a></div>
 <form class="formcard" id="qform" novalidate><h2>${f.h}</h2><span style="font-size:13px;color:var(--muted)">${f.sub}</span>
  <div class="form">
   <div class="field full"><label for="f-firma">${f.company} *</label><input id="f-firma" name="company" autocomplete="organization"><div class="msg">${f.errCompany}</div></div>
   <div class="field"><label for="f-ad">${f.name} *</label><input id="f-ad" name="name" autocomplete="name"><div class="msg">${f.errName}</div></div>
   <div class="field"><label for="f-tel">${f.phone} *</label><input id="f-tel" name="phone" type="tel" autocomplete="tel" dir="ltr"><div class="msg">${f.errPhone}</div></div>
   <div class="field full"><label for="f-mail">${f.email} *</label><input id="f-mail" name="email" type="email" autocomplete="email" dir="ltr"><div class="msg">${f.errEmail}</div></div>
   <div class="field"><label for="f-sehir">${f.city}</label><select id="f-sehir" name="city">${f.cities.map(c => `<option>${c}</option>`).join('')}</select></div>
   <div class="field"><label for="f-teslim">${f.delivery}</label><select id="f-teslim" name="delivery">${f.deliveries.map(c => `<option>${c}</option>`).join('')}</select></div>
   <div class="field full"><label for="f-not">${f.note}</label><textarea id="f-not" name="note" placeholder="${f.notePh}"></textarea></div>
   <input type="checkbox" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
   <label class="check full"><input id="f-kvkk" type="checkbox"><span>${f.kvkk}</span></label>
   <div class="field full" id="kvkk-err" style="margin-top:-8px"><div class="msg">${f.errKvkk}</div></div>
   <div class="form-msg full" id="form-msg" hidden></div>
   <button class="btn btn-dark full" type="submit" id="q-submit" style="height:54px;font-size:16px">${f.submit}</button>
   <a class="btn btn-line full" id="wa-cart" href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa} ${f.wa}</a>
  </div></form></div>
 <div class="success" id="q-ok" hidden><div class="ok">${I.check}</div><h2>${t.okH}</h2><p>${t.okP}</p><div class="trk" id="q-trk"></div><p style="font-size:14px">${t.okTrk}</p><div style="display:flex;gap:10px;justify-content:center;margin-top:24px;flex-wrap:wrap"><a class="btn btn-dark" href="${U.products(L)}">${t.newList}</a><a class="btn btn-line" href="${U.home(L)}">${t.home}</a></div></div>`;
  simplePage({ L, url: U.quote(L), route: U.quote, title: t.quoteH, h1: t.quoteH, lead: `<span id="q-lead" data-empty="${esc(t.quoteEmpty)}" data-full="${esc(t.quoteP)}">${t.quoteP}</span>`, inner, desc: t.quoteP, noindex: true });
}

function pageLegal(L) {
  for (const k of ['kvkk', 'cookies']) {
    const pg = D[L].legal[k];
    simplePage({ L, url: U[k](L), route: U[k], title: pg.title, h1: pg.title, lead: pg.lead, inner: `<div class="legaltext prose">${pg.html}</div>`, desc: pg.lead });
  }
}

function page404() {
  const L = 'tr', t = D.tr.t;
  const others = LANGS.filter(l => l !== 'tr').map(l => `<a href="${U.home(l)}" lang="${l}" hreflang="${l}">${esc(D[l].meta.name)}</a>`).join('');
  const body = `<div class="wrap nf"><div class="nf-code">404</div><h1>${t.nf[0]}</h1><p>${t.nf[1]}</p><div class="searchcard nf-search"><form id="hero-form" role="search">${I.search.replace('<svg', '<svg class="sicon"')}<input id="q-hero" type="search" autocomplete="off" placeholder="${t.searchHeroPh}" aria-label="${t.searchBtn}"><button class="btn btn-dark" type="submit">${t.searchBtn}</button></form><div class="results" id="res-hero" hidden></div></div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:28px"><a class="btn btn-dark" href="/">${t.nf[2]}</a><a class="btn btn-line" href="/urunler">${t.allProducts}</a></div>
  <div class="nf-langs">${others}</div>
  <div class="cats" style="margin-top:56px;text-align:start">${CATS.slice(0, 6).map(c => `<a class="cat" href="${U.cat(c.id, L)}"><div class="ph"><img src="${imgUrl(catCover[c.id], 1)}" alt="" loading="lazy"></div><div class="meta"><div><h3>${c.tr}</h3><small>${c.short}</small></div><span class="arrow">${I.arrow}</span></div></a>`).join('')}</div></div>`;
  write('404.html', layout({ L, path: '/404', title: t.nf[0], desc: t.nf[1], body, noindex: true }));
}

// ---------- arama indeksi, sitemap, robots, yönlendirmeler ----------
function searchIndex() {
  for (const L of LANGS) {
    const idx = P.map(p => ({ i: p.id, n: nm(p, L), c: [...p.codes, ...p.equiv].join(' | '), m: p.models.join(' | '), b: p.brand, t: typeName(p, L), ...(L === 'tr' || L === 'en' ? {} : { k: p.typeEn + ' ' + enName(p) }), g: catName(p.cat, L), im: imgUrl(p.img, 1), u: U.product(p, L) }));
    write(`assets/search-${L}.json`, JSON.stringify(idx));
  }
}
function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const files = [];
  for (const L of LANGS) {
    const urls = sitemap.filter(s => s.L === L).map(s => `<url><loc>${abs(s.url)}</loc><lastmod>${today}</lastmod>${s.route ? LANGS.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${abs(s.route(l))}"/>`).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${abs(s.route('tr'))}"/>` : ''}</url>`).join('\n');
    if (!urls) continue;
    write(`sitemap-${L}.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`);
    files.push(`sitemap-${L}.xml`);
  }
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map(f => `<sitemap><loc>${SITE}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>`);
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /teklif\n${LANGS.filter(l => l !== 'tr').map(l => `Disallow: /${l}/quote`).join('\n')}\n\nSitemap: ${SITE}/sitemap.xml\n`);
}
function writeVercel() {
  const red = [];
  const add = (from, to) => { if (from && to && from !== to && !red.find(r => r.source === from)) red.push({ source: from, destination: to, permanent: true }); };
  for (const p of P) add(p.old, U.product(p, 'tr'));
  for (const l of data.lists) { const b = P.find(p => p.cat === l.cat && p.brand === l.brand); add(l.old, b ? (l.brand === 'Sofilx' ? U.cat(l.cat, 'tr') : U.catBrand(l.cat, l.brand, 'tr')) : U.cat(l.cat, 'tr')); }
  for (const c of data.cats) add(c.old, U.cat(c.cat, 'tr'));
  [['/tr', '/'], ['/tr/hakkimizda', '/kurumsal'], ['/tr/misyonumuz', '/kurumsal'], ['/tr/vizyonumuz', '/kurumsal'], ['/tr/iletisim', '/iletisim'], ['/tr/markalar', '/markalar'], ['/tr/teklif-al', '/teklif'], ['/en/:path*', '/en'], ['/tr/:path*', '/urunler']].forEach(([a, b]) => add(a, b));
  const wild = red.filter(r => r.source.includes(':path*')); const rest = red.filter(r => !r.source.includes(':path*'));
  const cfg = { $schema: 'https://openapi.vercel.sh/vercel.json', buildCommand: 'npm run build', outputDirectory: 'dist', framework: null, cleanUrls: true, trailingSlash: false, redirects: [...rest, ...wild.filter(w => w.source !== '/en/:path*')], headers: [{ source: '/img/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }, { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }, { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }] };
  cfg.redirects.push({ source: '/en/:old(.*-kategori)', destination: '/en/products', permanent: true });
  fs.writeFileSync(path.join(ROOT, 'vercel.json'), JSON.stringify(cfg, null, 1));
  console.log('redirects', cfg.redirects.length);
}

// ---------- çalıştır ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
copyImages();
fs.copyFileSync(path.join(ROOT, 'assets/site.css'), path.join(DIST, 'assets/site.css'));
fs.copyFileSync(path.join(ROOT, 'assets/site.js'), path.join(DIST, 'assets/site.js'));
fs.copyFileSync(path.join(ROOT, 'assets/favicon.png'), path.join(DIST, 'favicon.png'));
const ONLY = process.env.LANGS ? process.env.LANGS.split(',') : null; // hızlı test: LANGS=tr,ar
for (const L of LANGS) {
  if (ONLY && !ONLY.includes(L)) continue;
  pageHome(L); pageProducts(L); P.forEach(p => pageProduct(p, L)); pageSectors(L); pageBrands(L); pageCustom(L); pageAbout(L); pageRefs(L); pageContact(L); pageQuote(L); pageLegal(L);
}
page404(); searchIndex(); writeSitemap(); writeVercel();
console.log('langs', LANGS.join(','), 'pages', sitemap.length, 'products', P.length, 'web3forms', WEB3FORMS_KEY ? 'set' : 'MISSING');
