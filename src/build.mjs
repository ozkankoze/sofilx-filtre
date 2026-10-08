// Sofilx statik site üretici: node src/build.mjs  ->  dist/
import fs from 'node:fs';
import path from 'node:path';
import { T, CATS, SECTORS } from './i18n.mjs';
import { pages as LEGAL } from './legal.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const SITE = 'https://www.sofilx.com';
const WEB3FORMS_KEY = process.env.WEB3FORMS_KEY || '';
const GTM_ID = process.env.GTM_ID || 'GTM-56P6SPBF';
const PHONE = '(0216) 606 32 06', PHONE_INT = '+902166063206', MOBILE = '(0552) 350 84 46', WA = '905523508446', EMAIL = 'info@sofilx.com';
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

// ---------- veri ----------
const P = data.products.map(p => ({ ...p, bslug: slug(p.brand) }));
P.forEach(p => { if (!p.imgs.length) p.imgs = []; p.img = p.imgs[0] || null; });
const byId = Object.fromEntries(P.map(p => [p.id, p]));
const catById = Object.fromEntries(CATS.map(c => [c.id, c]));
const brands = [...new Set(P.map(p => p.brand))].filter(b => b !== 'Sofilx').sort((a, b) => a.localeCompare(b, 'tr'));
const brandSlug = b => slug(b);
// kategori kapağı: modeli olan, görseli olan ilk ürün
const catCover = {};
for (const c of CATS) { const ps = P.filter(p => p.cat === c.id && p.img); catCover[c.id] = (ps.find(p => p.models.length) || ps[0] || {}).img; }
// sektör ürünleri
const sectorProducts = s => {
  const out = [];
  for (const c of s.cats) { const ps = P.filter(p => p.cat === c && p.img).sort((a, b) => (b.models.length > 0) - (a.models.length > 0)); out.push(...ps.slice(0, 4)); }
  return out.slice(0, 12);
};
const sectorsOfProduct = p => SECTORS.filter(s => s.cats.includes(p.cat));

// EN ürün adı (kural tabanlı)
const EN_WORDS = [[/Vakum Palet Kömürü/gi, 'Vacuum Pump Carbon Vane'], [/Vakum Pompası/gi, 'Vacuum Pump'], [/Palet Seti/gi, 'Vane Set'], [/Palet/gi, 'Vane'], [/Yağ Filtreleri/gi, 'Oil Filters'], [/Yağ Filtresi/gi, 'Oil Filter'], [/Hava Filtreleri/gi, 'Air Filters'], [/Hava Filtresi/gi, 'Air Filter'], [/Egzoz Filtreleri/gi, 'Exhaust Filters'], [/Egzoz Filtresi/gi, 'Exhaust Filter'], [/Egzoz Filtre/gi, 'Exhaust Filter'], [/Seperatör Filtreleri/gi, 'Separator Filters'], [/Seperatör/gi, 'Separator'], [/Kompresör/gi, 'Compressor'], [/Filtreleri/gi, 'Filters'], [/Filtreler/gi, 'Filters'], [/Filtresi/gi, 'Filter'], [/Filtre/gi, 'Filter'], [/Kaplinleri/gi, 'Couplings'], [/Kaplin/gi, 'Coupling'], [/Elastik/gi, 'Flexible'], [/Yağları/gi, 'Oils'], [/Yağlar/gi, 'Oils'], [/Yağı/gi, 'Oil'], [/Gresler/gi, 'Greases'], [/Gres/gi, 'Grease'], [/Hidrolik/gi, 'Hydraulic'], [/Dişli/gi, 'Gear'], [/Rulman/gi, 'Bearing'], [/Zincir/gi, 'Chain'], [/Elektrik Kömürleri/gi, 'Carbon Brushes'], [/Mekanik Karbon/gi, 'Mechanical Carbon'], [/Karbon Burçlar/gi, 'Carbon Bushings'], [/Karbon Ringler/gi, 'Carbon Rings'], [/Torba/gi, 'Bag'], [/Kaset/gi, 'Panel'], [/Kartuş/gi, 'Cartridge'], [/Cam Elyaf/gi, 'Glass Fibre'], [/ ve /g, ' and '], [/Diğer Ürünler/gi, 'Other Products'], [/Çok Amaçlı Yağlayıcılar/gi, 'Multi-Purpose Lubricants'], [/Metal İşleme/gi, 'Metalworking'], [/Temizleyiciler/gi, 'Cleaners'], [/Korozyondan Koruyucu Ürünler/gi, 'Corrosion Protection'], [/Silikon/gi, 'Silicone'], [/Soğutma/gi, 'Cooling'], [/Ölçü/gi, 'Size']];
const enName = p => { let n = p.name; for (const [a, b] of EN_WORDS) n = n.replace(a, b); return n; };
const nm = (p, L) => L === 'en' ? enName(p) : p.name;
const codeLine = p => [...p.codes].join(' | ');

// ---------- URL'ler ----------
const U = {
  home: L => L === 'en' ? '/en' : '/',
  products: L => L === 'en' ? '/en/products' : '/urunler',
  cat: (c, L) => L === 'en' ? `/en/products/${catById[c].en}` : `/urunler/${c}`,
  catBrand: (c, b, L) => `${U.cat(c, L)}/${brandSlug(b)}`,
  product: (p, L) => L === 'en' ? `/en/product/${p.id}` : `/urun/${p.id}`,
  sectors: L => L === 'en' ? '/en/industries' : '/sektorler',
  sector: (s, L) => L === 'en' ? `/en/industries/${s.en}` : `/sektorler/${s.id}`,
  brands: L => L === 'en' ? '/en/brands' : '/markalar',
  brand: (b, L) => `${U.brands(L)}/${brandSlug(b)}`,
  custom: L => L === 'en' ? '/en/custom-manufacturing' : '/ozel-uretim',
  about: L => L === 'en' ? '/en/about' : '/kurumsal',
  refs: L => L === 'en' ? '/en/references' : '/referanslar',
  contact: L => L === 'en' ? '/en/contact' : '/iletisim',
  quote: L => L === 'en' ? '/en/quote' : '/teklif',
  kvkk: L => L === 'en' ? '/en/privacy' : '/kvkk',
  cookies: L => L === 'en' ? '/en/cookies' : '/cerez-politikasi',
};
const fileFor = u => u === '/' ? 'index.html' : u.replace(/^\//, '') + '.html';
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
  fs.writeFileSync(path.join(DIST, 'img/placeholder.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f4f4f9"/><path d="M70 60h60v80H70z" fill="none" stroke="#c7c6d8" stroke-width="4"/><path d="M70 80h60M70 100h60M70 120h60" stroke="#c7c6d8" stroke-width="3"/></svg>`);
}
const extraUrl = k => { const v = extra[k]; if (!v) return ''; return `/img/${k}.${v.startsWith('data:image/png') ? 'png' : 'webp'}`; };

// ---------- ikonlar ----------
const I = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="9" width="16" height="12" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.2 1.2z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
};

// ---------- sayfa iskeleti ----------
function layout({ L, path: url, alt, title, desc, body, jsonld = [], noindex = false, ogImg }) {
  const t = T[L];
  const fullTitle = title ? `${title} | Sofilx` : (L === 'en' ? 'Sofilx | Compressor & Vacuum Pump Filters' : 'Sofilx | Kompresör ve Vakum Pompası Filtreleri');
  const altL = L === 'en' ? 'tr' : 'en';
  const canon = SITE + (url === '/' ? '/' : url);
  if (!noindex) sitemap.push({ url, alt, L });
  const navItem = (k, href) => `<a href="${href}" data-nav="${k}">${t.nav[k]}</a>`;
  const mega = CATS.map(c => `<a href="${U.cat(c.id, L)}"><span class="th"><img src="${imgUrl(catCover[c.id], 1)}" alt="" loading="lazy" width="52" height="52"></span><span><b>${L === 'en' ? c.enName : c.tr}</b><small>${P.filter(p => p.cat === c.id).length} ${t.items}</small></span></a>`).join('');
  return `<!doctype html>
<html lang="${L}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${canon}">
${alt ? `<link rel="alternate" hreflang="${L}" href="${canon}"><link rel="alternate" hreflang="${altL}" href="${SITE}${alt === '/' ? '/' : alt}"><link rel="alternate" hreflang="x-default" href="${SITE}${L === 'tr' ? (url === '/' ? '/' : url) : (alt === '/' ? '/' : alt)}">` : ''}
<meta property="og:type" content="website"><meta property="og:site_name" content="Sofilx"><meta property="og:locale" content="${t.locale}">
<meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}">
<meta property="og:image" content="${SITE}${ogImg || extraUrl('hero')}">
<meta name="theme-color" content="#27235d">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${BUILD}">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
<script>window.SFX=${JSON.stringify({ L, w3f: WEB3FORMS_KEY, gtm: GTM_ID, wa: WA, quote: U.quote(L), products: U.products(L), t: { added: t.added, seeList: t.seeList, inList: t.inList, addToList: t.addToList, addMore: t.addMore, drawerEmpty: t.drawerEmpty, lines: t.lines, pcs: t.pcs, requestQuote: t.requestQuote, backToProducts: t.backToProducts, copied: t.copied, failMsg: t.failMsg, sending: t.form.sending, submit: t.form.submit, notePer: t.form.notePer, items: t.items, noResult: t.noResult, viewAll: t.viewAll } })}</script>
</head>
<body>
<a class="skip" href="#main">${L === 'en' ? 'Skip to content' : 'İçeriğe geç'}</a>
<div class="topbar"><div class="wrap"><a href="tel:${PHONE_INT}">${I.phone}${PHONE}</a><a href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa}${MOBILE}</a><a class="tb-mail" href="mailto:${EMAIL}">${I.mail}${EMAIL}</a><span class="tb-r">${t.topRight}</span><a class="tb-lang" href="${alt || U.home(altL)}" hreflang="${altL}" lang="${altL}">${altL.toUpperCase()}</a></div></div>
<header class="site">
  <div class="wrap">
    <a class="logo" href="${U.home(L)}" aria-label="Sofilx"><img src="/img/logo.png" alt="Sofilx" width="383" height="90"></a>
    <nav class="main" aria-label="${L === 'en' ? 'Main menu' : 'Ana menü'}">
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
  <div class="mnav" id="mnav"><a href="${U.products(L)}">${t.nav.products}</a><a href="${U.sectors(L)}">${t.nav.sectors}</a><a href="${U.brands(L)}">${t.nav.brands}</a><a href="${U.custom(L)}">${t.nav.custom}</a><a href="${U.about(L)}">${t.nav.about}</a><a href="${U.refs(L)}">${t.nav.refs}</a><a href="${U.contact(L)}">${t.nav.contact}</a><a href="${alt || U.home(altL)}" lang="${altL}">${altL === 'en' ? 'English' : 'Türkçe'}</a></div>
</header>
<main id="main">
${body}
</main>
<footer class="site">
  <div class="wrap">
    <div><a class="logo" href="${U.home(L)}"><img src="/img/logo.png" alt="Sofilx" width="383" height="90" loading="lazy"></a><p>${t.footP}</p></div>
    <div><h4>${t.products}</h4>${CATS.map(c => `<a href="${U.cat(c.id, L)}">${L === 'en' ? c.enName : c.tr}</a>`).join('')}</div>
    <div><h4>Sofilx</h4><a href="${U.about(L)}">${t.nav.about}</a><a href="${U.sectors(L)}">${t.nav.sectors}</a><a href="${U.brands(L)}">${t.nav.brands}</a><a href="${U.refs(L)}">${t.nav.refs}</a><a href="${U.custom(L)}">${t.nav.custom}</a><a href="${U.quote(L)}">${t.list}</a><a href="${U.contact(L)}">${t.customerCenter}</a></div>
    <div><h4>${t.nav.contact}</h4><p>${ADDRESS}</p><p><a href="tel:${PHONE_INT}">${PHONE}</a><a href="https://wa.me/${WA}" target="_blank" rel="noopener">${MOBILE} · WhatsApp</a></p><p><a href="mailto:${EMAIL}">${EMAIL}</a></p></div>
  </div>
  <div class="legal"><div class="wrap"><span>© <span id="yr">${new Date().getFullYear()}</span> Sofilx. ${t.rights}</span><span class="legal-links"><a href="${U.kvkk(L)}">${t.kvkkL}</a><a href="${U.cookies(L)}">${t.cookieL}</a><button type="button" class="linkbtn" id="cookie-open">${L === 'en' ? 'Cookie settings' : 'Çerez ayarları'}</button></span></div><div class="wrap note">${t.footLegal}</div></div>
</footer>
<a class="wa-float" href="https://wa.me/${WA}?text=${encodeURIComponent(L === 'en' ? 'Hello, I would like a quote.' : 'Merhaba, teklif almak istiyorum.')}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}<span>${L === 'en' ? 'WhatsApp' : 'WhatsApp destek'}</span></a>
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
const kindLabel = (p, L) => { const k = kindOf(p), t = T[L]; return k === 'Muadil' ? t.muadil : k === 'Orijinal' ? t.original : t.sofilxMade; };
function card(p, L) {
  const t = T[L], n = nm(p, L);
  return `<article class="card" data-id="${p.id}" data-name="${esc(n)}" data-code="${esc(codeLine(p))}" data-img="${imgUrl(p.img, 1)}" data-url="${U.product(p, L)}" data-brand="${esc(p.brand)}" data-type="${esc(L === 'en' ? p.typeEn : p.type)}" data-cat="${p.cat}">
  <div class="phw"><a class="ph" href="${U.product(p, L)}"><img src="${imgUrl(p.img, 1)}" alt="${esc(n)}" loading="lazy" width="440" height="440"><span class="tag">${kindLabel(p, L)}</span></a>
  <button class="quick" type="button" data-add="${p.id}" aria-label="${t.addToList}" title="${t.addToList}">${I.plus}</button></div>
  <div class="info"><span class="brandname">${esc(p.brand)}</span><h3><a href="${U.product(p, L)}">${esc(n)}</a></h3>${p.codes.length ? `<span class="code">${esc(codeLine(p))}</span>` : ''}</div></article>`;
}
const crumbs = (items) => `<nav class="crumbs" aria-label="breadcrumb">${items.map((x, i) => i < items.length - 1 ? `<a href="${x[1]}">${esc(x[0])}</a><span>/</span>` : `<span aria-current="page">${esc(x[0])}</span>`).join('')}</nav>`;
const crumbLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: SITE + x[1] })) });
function helpCenter(L) {
  const t = T[L], h = t.help;
  const links = [U.quote(L), `https://wa.me/${WA}`, U.products(L), `tel:${PHONE_INT}`, U.custom(L)];
  return `<div class="help"><div><h2>${t.helpH}</h2><p class="lead">${t.helpP}</p><p class="hours">${t.helpHours}</p></div><div class="help-list">${h.map((x, i) => `<a href="${links[i]}"${i === 1 ? ' target="_blank" rel="noopener"' : ''}><span><b>${x[0]}</b><small>${x[1]}</small></span><span class="go">${x[2]}</span></a>`).join('')}</div></div>`;
}
function sectorTile(s, L) {
  const ps = sectorProducts(s).slice(0, 3);
  return `<a class="sector" href="${U.sector(s, L)}"><div><h3>${esc(L === 'en' ? s.enName : s.tr)}</h3><p>${esc(L === 'en' ? s.lineEn : s.line)}</p></div><div class="thumbs">${ps.map(p => `<span><img src="${imgUrl(p.img, 1)}" alt="" loading="lazy" width="52" height="52"></span>`).join('')}<span class="arrow">${I.arrow}</span></div></a>`;
}
const orgLd = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Sofilx', url: SITE, logo: SITE + '/img/logo.png', email: EMAIL, telephone: '+90 216 606 32 06', address: { '@type': 'PostalAddress', streetAddress: 'Esatpaşa Mah. Bingöl Sok. No:1A', addressLocality: 'Ataşehir', addressRegion: 'İstanbul', addressCountry: 'TR' }, contactPoint: [{ '@type': 'ContactPoint', telephone: '+90 216 606 32 06', contactType: 'sales', availableLanguage: ['Turkish', 'English'] }] };

// ---------- sayfalar ----------
function pageHome(L) {
  const t = T[L], url = U.home(L), alt = U.home(L === 'en' ? 'tr' : 'en');
  const popular = ['vakum-pompasi-filtreleri', 'karbon-paletler', 'fiber-paletler', 'kompresor-filtreleri'].flatMap(c => P.filter(p => p.cat === c && p.img && p.models.length).slice(0, 2));
  const examples = L === 'en' ? ['Oil filter', 'Carbon vane', 'Air filter', 'HEPA'] : ['Yağ filtresi', 'Karbon palet', 'Hava filtresi', 'HEPA'];
  const body = `<section class="hero2"><div class="hero2-top"><div class="hero2-bg"></div><div class="wrap hero2-in">
  <div class="h2copy"><span class="kick">${t.heroKick}</span><h1>${t.heroH1a}<br><span class="hl">${t.heroH1b}</span></h1><p>${t.heroP}</p>
   <div class="h2btns"><a class="btn btn-white" href="${U.products(L)}">${t.heroBtn} ${I.arrow}</a><a class="btn btn-ghostw" href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa} ${t.waQuote}</a></div></div>
  <div class="h2art"><div class="ring"></div>
   <a class="speccard" href="${U.products(L)}"><div class="sc-photo"><img src="${extraUrl('herocard')}" alt="" width="250" height="250"></div>
    <div class="sc-band"><div><small>${t.cardKick}</small><b>${CATS.length} ${t.cardGroups}</b></div><span class="sc-stock">${t.stockIn}</span></div>
    <ol class="sc-list">${CATS.slice(0, 5).map(c => `<li>${L === 'en' ? c.enName : c.tr}</li>`).join('')}</ol>
    <div class="sc-foot"><span>${t.cardFoot}</span><span class="sc-plus">${I.arrow}</span></div></a>
   <div class="chip2 c1"><span class="ci">${I.check}</span><div><b>${t.chipBrand[0]}</b><small>${t.chipBrand[1]}</small></div></div>
   <div class="chip2 c2"><span class="ci">${I.search}</span><div><b>${t.chipRef[0]}</b><small>${t.chipRef[1]}</small></div></div>
  </div></div></div>
  <div class="wrap"><div class="searchcard"><form id="hero-form" role="search">${I.search.replace('<svg', '<svg class="sicon"')}<input id="q-hero" type="search" autocomplete="off" placeholder="${t.searchHeroPh}" aria-label="${t.searchBtn}"><button class="btn btn-dark" type="submit">${t.searchBtn}</button></form>
   <div class="tries">${t.example}: ${examples.map(x => `<button class="chip" type="button" data-try="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="results" id="res-hero" hidden></div></div>
   <div class="facts">${t.facts.map(f => `<div><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.groupsH}</h2><p>${t.groupsP}</p></div><a class="link" href="${U.products(L)}">${t.allProducts} ${I.arrow}</a></div>
  <div class="cats">${CATS.map(c => `<a class="cat" href="${U.cat(c.id, L)}"><div class="ph"><img src="${imgUrl(catCover[c.id])}" alt="${esc(L === 'en' ? c.enName : c.tr)}" loading="lazy" width="900" height="900"></div><div class="meta"><div><h3>${L === 'en' ? c.enName : c.tr}</h3><small>${L === 'en' ? c.shortEn : c.short} · ${P.filter(p => p.cat === c.id).length} ${t.items}</small></div><span class="arrow">${I.arrow}</span></div></a>`).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.sectorsH}</h2><p>${t.sectorsP}</p></div><a class="link" href="${U.sectors(L)}">${t.viewAll} ${I.arrow}</a></div><div class="sectors">${SECTORS.map(s => sectorTile(s, L)).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.howH}</h2><p>${t.howP}</p></div></div><div class="how">${t.how.map((h, i) => `<div><span class="n">0${i + 1}</span><h3>${h[0]}</h3><p>${h[1]}</p></div>`).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="sec-head"><div><h2>${t.popularH}</h2></div><a class="link" href="${U.products(L)}">${t.allProducts} ${I.arrow}</a></div><div class="cards">${popular.map(p => card(p, L)).join('')}</div></div></section>
 <section class="block"><div class="wrap"><div class="duo">
  <a class="banner" href="${U.cat('endustriyel-yaglar', L)}"><img src="${extraUrl('banner_oils')}" alt="" loading="lazy"><div><h3>${t.oilsH}</h3><p>${t.oilsP}</p><span class="btn btn-sm">${t.oilsBtn}</span></div></a>
  <a class="banner" href="${U.custom(L)}"><img src="${extraUrl('banner_custom')}" alt="" loading="lazy"><div><h3>${t.customH}</h3><p>${t.customP}</p><span class="btn btn-sm">${t.customBtn}</span></div></a></div></div></section>
 <section class="block"><div class="wrap">${helpCenter(L)}</div></section>`;
  const desc = L === 'en' ? 'OEM and equivalent compressor and vacuum pump filters, carbon and fibre vanes, industrial lubricants and couplings. Search by part number and get one quote for your whole list.' : 'Kompresör ve vakum pompası filtreleri, karbon ve fiber paletler, endüstriyel yağlar ve kaplinler. Orijinal ve muadil parçalar; parça numarasıyla arayın, tek formla teklif alın.';
  write(fileFor(url), layout({ L, path: url, alt, title: '', desc, body, jsonld: [orgLd, { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Sofilx', url: SITE + url, potentialAction: { '@type': 'SearchAction', target: `${SITE}${U.products(L)}?q={q}`, 'query-input': 'required name=q' } }] }));
}

function listingPage({ L, url, alt, title, h1, sub, items, crumbItems, desc, facets = true, intro }) {
  const t = T[L];
  items = [...items].sort((a, b) => (!!b.img - !!a.img) || ((b.models.length > 0) - (a.models.length > 0)) || ((b.codes.length > 0) - (a.codes.length > 0)) || nm(a, L).localeCompare(nm(b, L), 'tr', { numeric: true }));
  const brandsIn = [...new Set(items.map(p => p.brand))].sort((a, b) => a.localeCompare(b, 'tr'));
  const typesIn = [...new Set(items.map(p => L === 'en' ? p.typeEn : p.type))].sort((a, b) => a.localeCompare(b, 'tr'));
  const catsIn = [...new Set(items.map(p => p.cat))];
  const opt = (g, v, label, n) => `<label class="opt"><input type="checkbox" data-g="${g}" value="${esc(v)}"><span>${esc(label)}</span><span class="c">${n}</span></label>`;
  const body = `<div class="wrap">${crumbs(crumbItems)}
 <div class="cat-head"><div><h1>${esc(h1)}</h1><p>${esc(sub)}</p></div></div>${intro ? `<div class="cat-intro">${intro}</div>` : ''}
 <div class="cat-layout"><aside class="filters" id="filters">
  <div class="inlinesearch">${I.search}<input id="f-q" type="search" placeholder="${t.searchInList}" aria-label="${t.searchInList}"></div>
  ${catsIn.length > 1 ? `<div><h4>${t.productGroup}</h4>${catsIn.map(c => opt('cat', c, L === 'en' ? catById[c].enName : catById[c].tr, items.filter(p => p.cat === c).length)).join('')}</div>` : ''}
  ${brandsIn.length > 1 ? `<div><h4>${t.brand}</h4>${brandsIn.map(b => opt('brand', b, b, items.filter(p => p.brand === b).length)).join('')}</div>` : ''}
  ${typesIn.length > 1 ? `<div><h4>${t.type}</h4>${typesIn.map(x => opt('type', x, x, items.filter(p => (L === 'en' ? p.typeEn : p.type) === x).length)).join('')}</div>` : ''}
  <button class="btn btn-line btn-sm" type="button" id="f-clear">${t.clear}</button></aside>
 <div style="min-width:0"><div class="toolbar"><span id="f-count">${items.length} ${t.items}</span><div style="display:flex;gap:8px"><button class="btn btn-line btn-sm filter-toggle" type="button" id="f-toggle">${t.filters}</button><select id="f-sort" aria-label="Sort"><option value="rel">${t.sort[0]}</option><option value="az">${t.sort[1]}</option></select></div></div>
 <div class="cards grid-auto" id="grid">${items.map(p => card(p, L)).join('')}</div><div class="empty" id="grid-empty" hidden>${t.noResult}</div></div></div></div>`;
  write(fileFor(url), layout({ L, path: url, alt, title, desc, body, jsonld: [crumbLd(crumbItems.map((c, i) => i === crumbItems.length - 1 ? [c[0], url] : c))] }));
}

function pageProducts(L) {
  const t = T[L];
  listingPage({ L, url: U.products(L), alt: U.products(L === 'en' ? 'tr' : 'en'), title: t.allProducts, h1: t.allProducts, sub: `${P.length} ${t.items}`, items: P, crumbItems: [[t.home, U.home(L)], [t.products, U.products(L)]], desc: L === 'en' ? 'All Sofilx products: compressor and vacuum pump filters, carbon and fibre vanes, lubricants, couplings.' : 'Tüm Sofilx ürünleri: kompresör ve vakum pompası filtreleri, karbon ve fiber paletler, yağlar, kaplinler.' });
  for (const c of CATS) {
    const items = P.filter(p => p.cat === c.id), cn = L === 'en' ? c.enName : c.tr;
    const intro = (data.cats.find(x => x.cat === c.id) || {}).intro || [];
    listingPage({ L, url: U.cat(c.id, L), alt: U.cat(c.id, L === 'en' ? 'tr' : 'en'), title: cn, h1: cn, sub: `${L === 'en' ? c.shortEn : c.short} · ${items.length} ${t.items}`, items, crumbItems: [[t.home, U.home(L)], [t.products, U.products(L)], [cn, U.cat(c.id, L)]], desc: L === 'en' ? `${cn}: OEM and equivalent parts with cross references. Same-day dispatch from stock, quote with one form.` : `${cn}: orijinal ve muadil parçalar, çapraz referanslar. Stoktan aynı gün kargo, tek formla teklif.`, intro: L === 'tr' && intro.length ? `<p>${esc(intro.join(' '))}</p>` : '' });
    for (const b of [...new Set(items.map(p => p.brand))]) {
      if (b === 'Sofilx') continue;
      const bi = items.filter(p => p.brand === b);
      const lst = data.lists.find(x => x.cat === c.id && x.brand === b);
      listingPage({ L, url: U.catBrand(c.id, b, L), alt: U.catBrand(c.id, b, L === 'en' ? 'tr' : 'en'), title: `${b} ${cn}`, h1: `${b} ${cn}`, sub: `${bi.length} ${t.items}`, items: bi, crumbItems: [[t.home, U.home(L)], [t.products, U.products(L)], [cn, U.cat(c.id, L)], [b, U.catBrand(c.id, b, L)]], desc: L === 'en' ? `${b} compatible ${cn.toLowerCase()} with part numbers and cross references. Request a quote from Sofilx.` : `${b} uyumlu ${cn.toLocaleLowerCase('tr')}: parça numaraları ve çapraz referanslar. Sofilx'ten teklif alın.`, intro: L === 'tr' && lst && lst.intro && lst.intro.length ? `<p>${esc(lst.intro.join(' '))}</p>` : '' });
    }
  }
}

function dimSvg(p, L) {
  const d = p.dims; if (!d) return ''; const t = T[L];
  const fmt = v => String(v).replace('.', L === 'en' ? '.' : ',').replace(/[,.]0$/, '');
  const sx = 440 / d.l, w = d.l * sx, h = Math.max(d.w * sx, 36), x0 = 70, y0 = 60, ty = y0 + h + 70, th = Math.max(d.t * sx * 2, 8);
  return `<svg class="dim" viewBox="0 0 600 ${Math.round(ty + th + 70)}" role="img" aria-label="${t.drawThumb}: ${fmt(d.l)} × ${fmt(d.w)} × ${fmt(d.t)} mm"><defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 9 5 0 9z" fill="#27235d"/></marker></defs>
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
  const t = T[L], n = nm(p, L), url = U.product(p, L), alt = U.product(p, L === 'en' ? 'tr' : 'en');
  const c = catById[p.cat], cn = L === 'en' ? c.enName : c.tr;
  const ty = L === 'en' ? p.typeEn : p.type;
  const sec = sectorsOfProduct(p);
  const fmtD = d => `${String(d.l).replace(/\.0$/, '')} × ${String(d.w).replace(/\.0$/, '')} × ${String(d.t).replace(/\.0$/, '')} mm`;
  const genericDesc = L === 'en'
    ? `${n}. ${ty} ${p.brand !== 'Sofilx' ? `compatible with ${p.brand} equipment` : 'supplied by Sofilx'}.${p.models.length ? ` Fits ${p.models.length} models including ${p.models.slice(0, 3).join(', ')}.` : ''}${p.dims ? ` Dimensions ${fmtD(p.dims)}.` : ''}`
    : `${n}. ${p.brand !== 'Sofilx' ? `${p.brand} ekipmanlarıyla uyumlu ` : ''}${ty.toLocaleLowerCase('tr')}.${p.models.length ? ` ${p.models.slice(0, 3).join(', ')} dahil ${p.models.length} modelle uyumludur.` : ''}${p.dims ? ` Ölçüler: ${fmtD(p.dims)}.` : ''}`;
  const descPlain = clip(plain(p.descHtml), 400);
  const metaDesc = clip(L === 'en' ? genericDesc + ' Request a quote from Sofilx.' : (descPlain || genericDesc) + ' Sofilx\'ten teklif alın.', 158);
  const specs = [[t.partNo, p.codes.length ? `<span class="mono">${esc(codeLine(p))}</span>` : esc(n)]];
  const sof = p.equiv.filter(e => /^SF/i.test(e)), xr = p.equiv.filter(e => !/^SF/i.test(e));
  if (xr.length) specs.push([t.crossRef, `<div class="models">${xr.map(e => `<span>${esc(e)}</span>`).join('')}</div>`]);
  if (sof.length) specs.push([t.sofilxNo, `<span class="mono">${esc(sof.join(' · '))}</span>`]);
  if (p.dims) specs.push([t.size, fmtD(p.dims)]);
  if (p.set) specs.push([t.setSize, L === 'en' ? `${p.set}${t.setUnit}` : `${p.set}${t.setUnit}`]);
  specs.push([t.ptype, esc(ty)], [t.brand, `<a href="${U.brand(p.brand, L)}">${esc(p.brand)}</a>`], [t.group, `<a href="${U.cat(p.cat, L)}">${esc(cn)}</a>`]);
  if (sec.length) specs.push([t.usedIn, `<div class="models">${sec.map(s => `<a class="stag" href="${U.sector(s, L)}">${esc(L === 'en' ? s.enName : s.tr)}</a>`).join('')}</div>`]);
  const waTxt = encodeURIComponent((L === 'en' ? 'Hello, could I get price and stock for ' : 'Merhaba, şu ürün için fiyat ve stok bilgisi alabilir miyim: ') + `${n}${p.codes.length ? ' (' + codeLine(p) + ')' : ''} – ${SITE}${url}`);
  const tabs = [
    ['uyum', t.tabs.uyum, `<div class="compat"><div><h3>${t.compatBrands}</h3><ul class="blist"><li>${esc(p.brand)}</li></ul></div>${p.models.length ? `<div><h3>${t.compatModels} <span class="cnt">${p.models.length}</span></h3><div class="mgrid">${p.models.map(m => `<span>${esc(m)}</span>`).join('')}</div></div>` : `<div class="tabnote"><b>${t.noModels[0]}</b><p>${t.noModels[1]}</p><a class="btn btn-line btn-sm" href="https://wa.me/${WA}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${t.noModels[2]}</a></div>`}</div>`],
    ['teknik', t.tabs.teknik, `<div class="techgrid"><dl class="sp">${specs.map(s => `<dt>${s[0]}</dt><dd>${s[1]}</dd>`).join('')}</dl>${p.dims ? `<figure class="dimbox">${dimSvg(p, L)}</figure>` : ''}</div>`],
    ['aciklama', t.tabs.aciklama, `<div class="prose rich">${L === 'tr' ? (p.descHtml || `<p>${esc(genericDesc)}</p>`) : `<p>${esc(genericDesc)}</p>${p.descHtml ? `<details class="srcdoc"><summary>Original technical details (Turkish)</summary>${p.descHtml}</details>` : ''}`}</div>`],
    ['genel', t.tabs.genel, `<div class="prose">${t.genel}</div>`],
    ['teslimat', t.tabs.teslimat, `<div class="facts3">${t.teslimat.map(x => `<div><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div>`],
    ['iade', t.tabs.iade, `<div class="prose">${t.iade}</div>`],
    ['sss', t.tabs.sss, `<div class="faq">${t.faq.map((q, i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}</div>`],
  ];
  const gallery = p.imgs.length ? p.imgs : [null];
  const thumbs = gallery.map((h, i) => `<button class="thumb${i === 0 ? ' on' : ''}" type="button" data-src="${imgUrl(h)}" aria-label="${t.photo} ${i + 1}"><img src="${imgUrl(h, 1)}" alt="" width="84" height="84" loading="lazy"></button>`).concat(p.dims ? [`<button class="thumb" type="button" data-view="dim" aria-label="${t.drawThumb}">${dimSvg(p, L)}</button>`] : []);
  const rel = P.filter(x => x.id !== p.id && x.cat === p.cat && x.img).sort((a, b) => (b.brand === p.brand) - (a.brand === p.brand)).slice(0, 4);
  const crumbItems = [[t.home, U.home(L)], [cn, U.cat(p.cat, L)], ...(p.brand !== 'Sofilx' ? [[p.brand, U.catBrand(p.cat, p.brand, L)]] : []), [n, url]];
  const body = `<div class="wrap">${crumbs(crumbItems)}
 <div class="pd" data-id="${p.id}" data-name="${esc(n)}" data-code="${esc(codeLine(p))}" data-img="${imgUrl(p.img, 1)}" data-url="${url}">
  <div class="gal"><div class="gallery" id="gal-main"><img src="${imgUrl(p.img)}" alt="${esc(n)}" width="900" height="900" fetchpriority="high"></div>${thumbs.length > 1 ? `<div class="thumbs">${thumbs.join('')}</div>` : ''}<template id="dimtpl">${dimSvg(p, L)}</template></div>
  <div><div class="kicker"><span class="pill">${kindLabel(p, L)}</span><span class="stock">${esc(p.brand)}</span></div>
  <h1>${esc(n)}</h1>${p.codes.length && !p.codes.every(c => n.includes(c)) ? `<div class="codeline">${esc(codeLine(p))}</div>` : ''}
  <dl class="quick-sp">${p.models.length ? `<dt>${t.compatible}</dt><dd>${esc(p.models.slice(0, 3).join(', '))}${p.models.length > 3 ? ` <a href="#tab-uyum" data-goto="uyum">+${p.models.length - 3}</a>` : ''}</dd>` : ''}${p.equiv.filter(e => !/^SF/i.test(e)).length ? `<dt>${L === 'en' ? 'Cross ref.' : 'Çapraz ref.'}</dt><dd class="mono">${esc(p.equiv.filter(e => !/^SF/i.test(e)).slice(0, 3).join(' · '))}</dd>` : ''}${p.equiv.filter(e => /^SF/i.test(e)).length ? `<dt>${t.sofilxNo}</dt><dd class="mono">${esc(p.equiv.filter(e => /^SF/i.test(e)).join(' · '))}</dd>` : ''}${p.dims ? `<dt>${t.size}</dt><dd>${fmtD(p.dims)}</dd>` : ''}<dt>${t.type2}</dt><dd>${esc(ty)}</dd></dl>
  <div class="buy"><div class="buyrow"><div class="qty"><button type="button" data-step="-1" aria-label="-">−</button><input id="pd-qty" type="number" min="1" value="1" aria-label="${L === 'en' ? 'Quantity' : 'Adet'}"><button type="button" data-step="1" aria-label="+">+</button></div><button class="btn btn-dark" type="button" id="pd-add">${t.addToList}</button></div>
   <a class="btn btn-line wa" href="https://wa.me/${WA}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${t.waAsk}</a>
   <div class="notes">${t.notes.map(x => `<div><b>${x[0]}</b>${x[1]}</div>`).join('')}</div>
   <div class="share"><span>${t.share}</span><a href="https://wa.me/?text=${encodeURIComponent(n + ' – ' + SITE + url)}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}</a><button type="button" data-copy="${esc(codeLine(p) || n)}">${t.copyCode}</button></div></div>
 </div></div>
 <div class="ptabs" role="tablist">${tabs.map((x, i) => `<button type="button" role="tab" class="${i === 0 ? 'on' : ''}" data-tab="${x[0]}" aria-selected="${i === 0}">${x[1]}</button>`).join('')}</div>
 ${tabs.map((x, i) => `<section class="tabpane" id="tab-${x[0]}" role="tabpanel" ${i === 0 ? '' : 'hidden'}><h2 class="sr-only">${x[1]}</h2>${x[2]}</section>`).join('')}
 ${rel.length ? `<section class="block" style="padding-top:56px"><div class="sec-head"><h2 style="font-size:32px">${t.related}</h2></div><div class="cards">${rel.map(r => card(r, L)).join('')}</div></section>` : ''}</div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: n, image: p.imgs.map(h => SITE + imgUrl(h)), description: L === 'en' ? genericDesc : (descPlain || genericDesc), brand: { '@type': 'Brand', name: p.brand }, category: cn, ...(p.codes[0] ? { mpn: p.codes[0] } : {}), ...(p.equiv[0] ? { sku: p.equiv[0] } : {}) };
  write(fileFor(url), layout({ L, path: url, alt, title: n + (L === 'en' ? '' : ''), desc: metaDesc, body, jsonld: [ld, crumbLd(crumbItems)], ogImg: imgUrl(p.img) }));
}

function simplePage({ L, url, alt, title, h1, lead, inner, desc, crumbName, noindex }) {
  const t = T[L];
  const body = `<div class="wrap">${crumbs([[t.home, U.home(L)], [crumbName || h1, url]])}<div class="page-head"><h1>${h1}</h1>${lead ? `<p>${lead}</p>` : ''}</div>${inner}</div>`;
  write(fileFor(url), layout({ L, path: url, alt, title, desc, body, noindex }));
}

function pageSectors(L) {
  const t = T[L], o = L === 'en' ? 'tr' : 'en';
  simplePage({ L, url: U.sectors(L), alt: U.sectors(o), title: t.nav.sectors, h1: t.nav.sectors, lead: t.sectorsP, inner: `<div class="sectors" style="padding-bottom:20px">${SECTORS.map(s => sectorTile(s, L)).join('')}</div>`, desc: t.sectorsP });
  for (const s of SECTORS) {
    const ps = sectorProducts(s), sn = L === 'en' ? s.enName : s.tr;
    const inner = `<div class="sec-intro"><div><p style="margin:0;color:var(--muted);font-size:17px;max-width:58ch">${L === 'en' ? 'These are the parts maintenance teams in this industry request most often. For anything not listed, add the part number or a label photo to your quote request.' : 'Bu sektördeki bakım ekiplerinin en sık istediği parçaları aşağıda topladık. Listede olmayan bir parça için kodunu ya da makine etiketini teklif talebinize eklemeniz yeterli.'}</p><div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap"><button class="btn btn-dark" type="button" id="add-all" data-ids="${ps.map(p => p.id).join(',')}">${L === 'en' ? 'Add all to quote list' : 'Hepsini teklif listesine ekle'}</button><a class="btn btn-line" href="${U.quote(L)}">${t.list}</a></div></div>
 <div><p style="margin:0 0 10px;font-size:14px;font-weight:600">${L === 'en' ? 'Most frequently replaced' : 'Bu sektörde en sık değişenler'}</p><ul>${(L === 'en' ? s.partsEn : s.parts).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
 <div class="cards">${ps.map(p => card(p, L)).join('')}</div>
 <section class="block" style="padding-top:56px"><div class="sec-head"><h2 style="font-size:32px">${L === 'en' ? 'Other industries' : 'Diğer sektörler'}</h2></div><div class="sectors">${SECTORS.filter(x => x.id !== s.id).slice(0, 4).map(x => sectorTile(x, L)).join('')}</div></section>`;
    simplePage({ L, url: U.sector(s, L), alt: U.sector(s, o), title: sn, h1: sn, lead: L === 'en' ? s.lineEn : s.line, inner, desc: `${sn}: ${(L === 'en' ? s.partsEn : s.parts).join(', ')}.`, crumbName: sn });
  }
}

function pageBrands(L) {
  const t = T[L], o = L === 'en' ? 'tr' : 'en';
  const logo = b => ({ 'Kaeser': 'logo_kaeser', 'Elmo Rietschle': 'logo_rietschle', 'Leybold': 'logo_leybold', 'Ekomak': 'logo_ekomak', 'Abac': 'logo_abac', 'Orion': 'logo_orion', 'Almig': 'logo_almig', 'Alup': 'logo_alup', 'Boge': 'logo_boge' })[b];
  const inner = `<div class="brandgrid">${brands.map(b => { const n = P.filter(p => p.brand === b).length, l = logo(b); return `<a href="${U.brand(b, L)}">${l && extra[l] ? `<img src="${extraUrl(l)}" alt="${esc(b)}" loading="lazy">` : `<b>${esc(b)}</b>`}<small>${n} ${t.items}</small></a>`; }).join('')}</div>`;
  simplePage({ L, url: U.brands(L), alt: U.brands(o), title: t.nav.brands, h1: t.nav.brands, lead: L === 'en' ? 'Choose your machine brand to see its filters, vanes, lubricants and couplings in one list.' : 'Makinenizin markasını seçin; o markaya ait filtre, palet, yağ ve kaplinleri tek listede görün.', inner, desc: L === 'en' ? 'Brands supplied by Sofilx: Busch, Becker, Elmo Rietschle, Leybold, Kaeser and more.' : 'Sofilx\'in tedarik ettiği markalar: Busch, Becker, Elmo Rietschle, Leybold, Kaeser ve diğerleri.' });
  for (const b of brands) {
    const items = P.filter(p => p.brand === b);
    listingPage({ L, url: U.brand(b, L), alt: U.brand(b, o), title: b, h1: b, sub: `${items.length} ${t.items}`, items, crumbItems: [[t.home, U.home(L)], [t.nav.brands, U.brands(L)], [b, U.brand(b, L)]], desc: L === 'en' ? `${b} compatible filters, vanes and spare parts with cross references. Request a quote from Sofilx.` : `${b} uyumlu filtre, palet ve yedek parçalar; çapraz referanslar. Sofilx'ten teklif alın.` });
  }
}

function pageCustom(L) {
  const t = T[L], o = L === 'en' ? 'tr' : 'en';
  const items = P.filter(p => p.cat === 'ozel-uretim-filtreler' || p.cat === 'endustriyel-filtreler');
  const rows = L === 'en' ? [['Dimensions', 'Outer diameter, inner diameter, length (mm)'], ['Filtration rating', 'µm or class (F9, H13 etc.)'], ['Media', 'Cellulose, polyester, glass fibre, stainless mesh'], ['End caps and seals', 'Material and connection type'], ['Quantity and lead time', 'First delivery and annual demand']] : [['Ölçüler', 'Dış çap, iç çap, boy (mm)'], ['Hassasiyet', 'µm değeri veya sınıf (F9, H13 vb.)'], ['Medya', 'Selüloz, polyester, cam elyaf, paslanmaz tel'], ['Kapak ve conta', 'Malzeme ve bağlantı tipi'], ['Adet ve termin', 'İlk sevkiyat ve yıllık ihtiyaç']];
  const inner = `<div class="cards" style="padding-bottom:20px">${items.map(p => card(p, L)).join('')}</div><section class="block" style="padding-top:48px"><div class="sec-head"><div><h2 style="font-size:32px">${L === 'en' ? 'What we need for a quote' : 'Teklif için gereken bilgiler'}</h2></div></div><dl class="sp" style="max-width:760px">${rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl><div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap"><a class="btn btn-dark" href="${U.quote(L)}">${t.requestQuote}</a><a class="btn btn-line" href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa} ${t.waAsk}</a></div></section>`;
  simplePage({ L, url: U.custom(L), alt: U.custom(o), title: t.nav.custom, h1: L === 'en' ? 'Custom filters' : 'Özel üretim filtreler', lead: L === 'en' ? 'We manufacture cartridge, bag, air, hydraulic and glass fibre filters from drawings, samples or label details. Add a product to your list and write the dimensions in the note.' : 'Kartuş, torba, hava, hidrolik ve cam elyaf filtrelerde çizim, numune ya da etiket bilgisinden üretim yapıyoruz. Ürünü listeye ekleyin, ölçüleri not alanına yazın.', inner, desc: L === 'en' ? 'Custom-made filters: cartridge, bag, air, hydraulic and glass fibre filters to your dimensions.' : 'Özel üretim filtreler: ölçünüze göre kartuş, torba, hava, hidrolik ve cam elyaf filtreler.' });
}

function pageAbout(L) {
  const t = T[L], o = L === 'en' ? 'tr' : 'en';
  const tr = { lead: 'Sofilx Filtre olarak hem kendi markamız olan ürünleri hem de sektördeki lider markaların ürünlerini tedarik ederek müşterilerimizin memnuniyetini artırmayı ve sürdürülebilir gelişmeye önem vererek sektörde kalıcı değerler yaratmayı hedefliyoruz.', blocks: [['Başarının bugünü: deneyim ve birikim', 'Tecrübemizin yanında stoklarımızda bulunan güvenilir markalardan temin ettiğimiz kaliteli ürünleri geniş dağıtım ağımızı kullanarak uygun fiyatlarla ve hızlıca müşterilerimize ulaştırıyoruz. Ürün yelpazesini geliştiren firmamız, yılların vermiş olduğu tecrübeyi güvenilir hizmet politikası ve müşteri memnuniyetiyle birleştiriyor.'], ['Misyonumuz', 'Kaliteli ve doğru ürünü, doğru zamanda müşterilerimize ulaştırmak; sürdürülebilir gelişmeyi önemseyerek sektörde kalıcı değer yaratmak.'], ['Vizyonumuz', 'Endüstriyel filtrasyon ve sarf malzemesinde, aranan parçanın ilk akla gelen tedarikçisi olmak.']] };
  const en = { lead: 'At Sofilx Filtre we supply both our own branded products and those of the leading brands in the industry, aiming to increase customer satisfaction and create lasting value through sustainable growth.', blocks: [['Experience and know-how', 'We deliver quality products from reliable brands held in our stock quickly and at competitive prices through our wide distribution network, combining years of experience with a reliable service policy and customer satisfaction.'], ['Our mission', 'To deliver the right, high-quality product to our customers at the right time, and to create lasting value in the industry through sustainable growth.'], ['Our vision', 'To be the first supplier that comes to mind for industrial filtration and consumable parts.']] };
  const x = L === 'en' ? en : tr;
  const stats = [[`${P.length}+`, L === 'en' ? 'products in catalogue' : 'katalogda ürün'], [`${brands.length}+`, L === 'en' ? 'brands' : 'marka'], [`${CATS.length}`, L === 'en' ? 'product groups' : 'ürün grubu'], [L === 'en' ? 'Same day' : 'Aynı gün', L === 'en' ? 'dispatch from stock' : 'stoktan kargo']];
  const inner = `<div class="statband">${stats.map(s => `<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div><div class="two">${x.blocks.map(b => `<div class="box"><h2>${b[0]}</h2><p>${b[1]}</p></div>`).join('')}<div class="box"><h2>${L === 'en' ? 'Visit us' : 'Bizi ziyaret edin'}</h2><p>${ADDRESS}</p><a class="btn btn-dark btn-sm" href="${U.contact(L)}">${t.nav.contact}</a></div></div>`;
  simplePage({ L, url: U.about(L), alt: U.about(o), title: t.nav.about, h1: L === 'en' ? 'The right part, at the right time' : 'Doğru parça, doğru zamanda', lead: x.lead, inner, desc: x.lead, crumbName: t.nav.about });
}

function pageRefs(L) {
  const t = T[L], o = L === 'en' ? 'tr' : 'en';
  const inner = `<div class="statband">${SECTORS.slice(0, 4).map(s => `<div><b>${L === 'en' ? s.enName : s.tr}</b><span>${L === 'en' ? s.lineEn : s.line}</span></div>`).join('')}</div>
  <section class="block" style="padding-top:24px"><div class="sec-head"><div><h2 style="font-size:32px">${L === 'en' ? 'Industries we serve' : 'Hizmet verdiğimiz sektörler'}</h2><p>${L === 'en' ? 'Maintenance teams in these industries rely on Sofilx for filters, vanes and lubricants.' : 'Bu sektörlerdeki bakım ekipleri filtre, palet ve yağ ihtiyaçları için Sofilx ile çalışıyor.'}</p></div></div><div class="sectors">${SECTORS.map(s => sectorTile(s, L)).join('')}</div></section>
  <section class="block"><div class="custom-cta"><div><h2>${L === 'en' ? 'Work with us' : 'Siz de çalışalım'}</h2><p>${L === 'en' ? 'Send your parts list; we reply with prices and lead times line by line.' : 'Parça listenizi gönderin; fiyat ve termini kalem kalem bildirelim.'}</p></div><a class="btn btn-white" href="${U.quote(L)}">${t.requestQuote}</a></div></section>`;
  simplePage({ L, url: U.refs(L), alt: U.refs(o), title: t.nav.refs, h1: t.nav.refs, lead: L === 'en' ? 'From packaging lines to CNC workshops, we supply maintenance parts to manufacturers across Turkey.' : 'Ambalaj hatlarından CNC atölyelerine, Türkiye genelinde üreticilere bakım parçası tedarik ediyoruz.', inner, desc: L === 'en' ? 'Sofilx references and industries served.' : 'Sofilx referansları ve hizmet verilen sektörler.' });
}

function pageContact(L) {
  const t = T[L], o = L === 'en' ? 'tr' : 'en';
  const map = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Sofilx Esatpaşa Bingöl Sok. No:1A Ataşehir İstanbul');
  const inner = `<div class="two"><div class="box"><dl class="kv"><dt>${L === 'en' ? 'Address' : 'Adres'}</dt><dd>${ADDRESS}</dd><dt>${L === 'en' ? 'Phone' : 'Telefon'}</dt><dd><a href="tel:${PHONE_INT}">${PHONE}</a></dd><dt>WhatsApp</dt><dd><a href="https://wa.me/${WA}" target="_blank" rel="noopener">${MOBILE}</a></dd><dt>${L === 'en' ? 'E-mail' : 'E-posta'}</dt><dd><a href="mailto:${EMAIL}">${EMAIL}</a></dd></dl>
  <div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap"><a class="btn btn-dark" href="https://wa.me/${WA}" target="_blank" rel="noopener">${I.wa} WhatsApp</a><a class="btn btn-line" href="${map}" target="_blank" rel="noopener">${L === 'en' ? 'Get directions' : 'Yol tarifi al'}</a></div></div>
  <a class="banner" href="${map}" target="_blank" rel="noopener" style="min-height:320px"><img src="${extraUrl('hero')}" alt="" loading="lazy"><div><h3>${L === 'en' ? 'Ataşehir, Istanbul' : 'Ataşehir / İstanbul'}</h3><p>${ADDRESS}</p><span class="btn btn-sm">${L === 'en' ? 'Open in Google Maps' : "Google Haritalar'da aç"}</span></div></a></div>${helpCenter(L)}`;
  const ld = { ...orgLd, '@type': 'LocalBusiness', image: SITE + '/img/logo.png' };
  const body = `<div class="wrap">${crumbs([[t.home, U.home(L)], [t.nav.contact, U.contact(L)]])}<div class="page-head"><h1>${t.nav.contact}</h1><p>${L === 'en' ? 'Reach us by phone, WhatsApp or e-mail; you can also send your quote list from here.' : 'Telefon, WhatsApp veya e-posta ile ulaşın; teklif listenizi de buradan iletebilirsiniz.'}</p></div>${inner}</div>`;
  write(fileFor(U.contact(L)), layout({ L, path: U.contact(L), alt: U.contact(o), title: t.nav.contact, desc: L === 'en' ? `Contact Sofilx: ${ADDRESS}. Phone ${PHONE}, ${EMAIL}.` : `Sofilx iletişim: ${ADDRESS}. Telefon ${PHONE}, ${EMAIL}.`, body, jsonld: [ld] }));
}

function pageQuote(L) {
  const t = T[L], f = t.form, o = L === 'en' ? 'tr' : 'en';
  const inner = `<div class="quote" id="quote-root"><div style="min-width:0"><div id="q-lines"></div><p class="photo-tip">${I.wa} <a href="https://wa.me/${WA}" target="_blank" rel="noopener">${f.photoTip}</a></p><a class="link" href="${U.products(L)}" style="margin-top:18px">${I.plus.replace('<svg', '<svg width="16" height="16"')} ${t.backToProducts}</a></div>
 <form class="formcard" id="qform" novalidate><h2>${f.h}</h2><span style="font-size:13px;color:var(--muted)">${f.sub}</span>
  <div class="form">
   <div class="field full"><label for="f-firma">${f.company} *</label><input id="f-firma" name="company" autocomplete="organization"><div class="msg">${f.errCompany}</div></div>
   <div class="field"><label for="f-ad">${f.name} *</label><input id="f-ad" name="name" autocomplete="name"><div class="msg">${f.errName}</div></div>
   <div class="field"><label for="f-tel">${f.phone} *</label><input id="f-tel" name="phone" type="tel" autocomplete="tel"><div class="msg">${f.errPhone}</div></div>
   <div class="field full"><label for="f-mail">${f.email} *</label><input id="f-mail" name="email" type="email" autocomplete="email"><div class="msg">${f.errEmail}</div></div>
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
  simplePage({ L, url: U.quote(L), alt: U.quote(o), title: t.quoteH, h1: t.quoteH, lead: `<span id="q-lead" data-empty="${esc(t.quoteEmpty)}" data-full="${esc(t.quoteP)}">${t.quoteP}</span>`, inner, desc: t.quoteP, noindex: true });
}

function pageLegal(L) {
  const o = L === 'en' ? 'tr' : 'en';
  for (const k of ['kvkk', 'cookies']) {
    const pg = LEGAL[L][k];
    simplePage({ L, url: U[k](L), alt: U[k](o), title: pg.title, h1: pg.title, lead: pg.lead, inner: `<div class="legaltext prose">${pg.html}</div>`, desc: pg.lead });
  }
}

function page404() {
  const L = 'tr', t = T.tr, te = T.en;
  const body = `<div class="wrap nf"><div class="nf-code">404</div><h1>${t.nf[0]}</h1><p>${t.nf[1]}</p><div class="searchcard nf-search"><form id="hero-form" role="search">${I.search.replace('<svg', '<svg class="sicon"')}<input id="q-hero" type="search" autocomplete="off" placeholder="${t.searchHeroPh}" aria-label="${t.searchBtn}"><button class="btn btn-dark" type="submit">${t.searchBtn}</button></form><div class="results" id="res-hero" hidden></div></div><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:28px"><a class="btn btn-dark" href="/">${t.nf[2]}</a><a class="btn btn-line" href="/urunler">${t.allProducts}</a><a class="btn btn-line" href="/en" lang="en">English</a></div>
  <div class="cats" style="margin-top:56px;text-align:left">${CATS.slice(0, 6).map(c => `<a class="cat" href="${U.cat(c.id, L)}"><div class="ph"><img src="${imgUrl(catCover[c.id], 1)}" alt="" loading="lazy"></div><div class="meta"><div><h3>${c.tr}</h3><small>${c.short}</small></div><span class="arrow">${I.arrow}</span></div></a>`).join('')}</div></div>`;
  write('404.html', layout({ L, path: '/404', title: t.nf[0], desc: t.nf[1], body, noindex: true }));
}

// ---------- arama indeksi, sitemap, robots, yönlendirmeler ----------
function searchIndex() {
  for (const L of ['tr', 'en']) {
    const idx = P.map(p => ({ i: p.id, n: nm(p, L), c: [...p.codes, ...p.equiv].join(' | '), m: p.models.join(' | '), b: p.brand, t: L === 'en' ? p.typeEn : p.type, g: L === 'en' ? catById[p.cat].enName : catById[p.cat].tr, im: imgUrl(p.img, 1), u: U.product(p, L) }));
    write(`assets/search-${L}.json`, JSON.stringify(idx));
  }
}
function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = sitemap.map(s => `<url><loc>${SITE}${s.url === '/' ? '/' : s.url}</loc><lastmod>${today}</lastmod>${s.alt ? `<xhtml:link rel="alternate" hreflang="${s.L}" href="${SITE}${s.url === '/' ? '/' : s.url}"/><xhtml:link rel="alternate" hreflang="${s.L === 'en' ? 'tr' : 'en'}" href="${SITE}${s.alt === '/' ? '/' : s.alt}"/>` : ''}</url>`).join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`);
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /teklif\nDisallow: /en/quote\n\nSitemap: ${SITE}/sitemap.xml\n`);
}
function writeVercel() {
  const red = [];
  const add = (from, to) => { if (from && to && from !== to && !red.find(r => r.source === from)) red.push({ source: from, destination: to, permanent: true }); };
  for (const p of P) add(p.old, U.product(p, 'tr'));
  for (const l of data.lists) { const b = P.find(p => p.cat === l.cat && p.brand === l.brand); add(l.old, b ? (l.brand === 'Sofilx' ? U.cat(l.cat, 'tr') : U.catBrand(l.cat, l.brand, 'tr')) : U.cat(l.cat, 'tr')); }
  for (const c of data.cats) add(c.old, U.cat(c.cat, 'tr'));
  [['/tr', '/'], ['/tr/hakkimizda', '/kurumsal'], ['/tr/misyonumuz', '/kurumsal'], ['/tr/vizyonumuz', '/kurumsal'], ['/tr/iletisim', '/iletisim'], ['/tr/markalar', '/markalar'], ['/tr/teklif-al', '/teklif'], ['/en/:path*', '/en'], ['/tr/:path*', '/urunler']].forEach(([a, b]) => add(a, b));
  // ana sayfa /en ve /tr wildcard en sona
  const wild = red.filter(r => r.source.includes(':path*')); const rest = red.filter(r => !r.source.includes(':path*'));
  const cfg = { $schema: 'https://openapi.vercel.sh/vercel.json', buildCommand: 'npm run build', outputDirectory: 'dist', framework: null, cleanUrls: true, trailingSlash: false, redirects: [...rest, ...wild.filter(w => w.source !== '/en/:path*')], headers: [{ source: '/img/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }, { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }, { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }] };
  // /en altındaki eski bozuk sayfalar: yeni /en sayfaları ile çakışmasın diye yalnızca eski kalıplar
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
for (const L of ['tr', 'en']) {
  pageHome(L); pageProducts(L); P.forEach(p => pageProduct(p, L)); pageSectors(L); pageBrands(L); pageCustom(L); pageAbout(L); pageRefs(L); pageContact(L); pageQuote(L); pageLegal(L);
}
page404(); searchIndex(); writeSitemap(); writeVercel();
console.log('pages', sitemap.length, 'products', P.length, 'web3forms', WEB3FORMS_KEY ? 'set' : 'MISSING');
