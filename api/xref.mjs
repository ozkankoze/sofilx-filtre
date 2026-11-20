// Kod arama (çapraz referans) sayfaları: istek anında üretilir, CDN'de önbelleğe alınır.
// Veri: data/xref/xref.json.gz (tools/xref-build.py), iskelet ve metinler: data/xref/shell, data/xref/ui.json (npm run build)
// Görünümler: list (arama + gruplar), type (ürün grubu), item (ürün sayfası), sj (arama JSON), sitemap
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SITE = 'https://www.sofilx.com';
const DIR = path.join(process.cwd(), 'data/xref');
const PER = 48, SM = 40000;

let UI, D, TYPES, P, BYSLUG, BYTYPE, EXACT, CODES, BRANDS;
const SHELL = {};
function load() {
  if (UI) return;
  UI = JSON.parse(fs.readFileSync(path.join(DIR, 'ui.json'), 'utf8'));
  D = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(DIR, 'xref.json.gz'))).toString());
  TYPES = D.types; P = D.p;
  BYSLUG = new Map(); BYTYPE = new Map(); EXACT = new Map(); CODES = []; BRANDS = new Map();
  const addCode = (code, i) => { const k = tight(code); if (!k) return; if (!EXACT.has(k)) EXACT.set(k, []); const a = EXACT.get(k); if (!a.includes(i)) { a.push(i); CODES.push([k, i]); } };
  P.forEach((r, i) => {
    BYSLUG.set(slugOf(r[0]), i);
    const t = TYPES[r[1]]; if (!BYTYPE.has(t)) BYTYPE.set(t, []); BYTYPE.get(t).push(i);
    addCode(r[0], i); for (const [b, c] of r[2]) { addCode(c, i); const k = tight(b); if (!BRANDS.has(k)) BRANDS.set(k, new Set()); BRANDS.get(k).add(i); }
  });
}
const shell = L => SHELL[L] || (SHELL[L] = fs.readFileSync(path.join(DIR, 'shell', `${L}.html`), 'utf8'));

// ---------- yardımcılar ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => o[k] ?? m);
function norm(s) { return String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/î/g, 'i'); }
function tight(s) { return norm(s).replace(/[\s\-.\/|+*_,()#:]/g, ''); }
const slugOf = ref => ref.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = (n, L) => Number(n).toLocaleString(L === 'tr' ? 'tr-TR' : L === 'en' ? 'en-GB' : L);
const u = L => UI[L];
const x = L => UI[L].x;
const itemUrl = (r, L) => u(L).base.item.replace('__S__', slugOf(r[0]));
const typeUrl = (t, L) => catUrl(t, L);
const listUrl = L => u(L).base.list;
const typeName = (t, L) => x(L).types[t] || x('en').types[t] || t;
const imgOf = t => UI.img[t] || UI.img.part;
const pname = (r, L) => `${r[0]} ${typeName(TYPES[r[1]], L)}`;
const I = {
  arrow: '<svg class="i-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.3.3c-.1.1-.3.3-.1.6.1.2.6 1.1 1.4 1.8 1 .9 1.8 1.1 2.1 1.3.2.1.4.1.5-.1l.7-.9c.2-.2.3-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
};

function page(L, { path: p, route, title, desc, body, jsonld = [], ogImg, noindex }) {
  let h = shell(L);
  for (const l of UI.langs) h = h.split(`/__R_${l}__`).join(route ? route(l) : (l === 'tr' ? '/' : '/' + l));
  const head = (noindex ? '<meta name="robots" content="noindex,follow">' : '') + jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('');
  return h.split('/__PATH__').join(p).split('__TITLE__').join(esc(title)).split('__DESC__').join(esc(desc))
    .split('__OGIMG__').join(ogImg || '/img/hero.webp').split('__HEAD__').join(head).replace('__BODY__', () => body);
}
const crumbs = items => `<nav class="crumbs" aria-label="breadcrumb">${items.map((z, i) => i < items.length - 1 ? `<a href="${z[1]}">${esc(z[0])}</a><span>/</span>` : `<span aria-current="page">${esc(z[0])}</span>`).join('')}</nav>`;
const crumbLd = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((z, i) => ({ '@type': 'ListItem', position: i + 1, name: z[0], item: SITE + z[1] })) });

function card(i, L, hit) {
  const r = P[i], t = TYPES[r[1]], n = pname(r, L), url = itemUrl(r, L), id = 'x:' + slugOf(r[0]), im = imgOf(t);
  const codes = hit ? [hit, ...r[2].map(o => o[1]).filter(c => c !== hit)] : r[2].map(o => o[1]);
  return `<article class="card" data-id="${esc(id)}" data-name="${esc(n)}" data-code="${esc(r[0])}" data-img="${im}" data-url="${url}" data-type="${esc(typeName(t, L))}" data-cat="${t}">
<div class="phw"><a class="ph" href="${url}"><img src="${im}" alt="${esc(n)}" loading="lazy" width="440" height="440"></a><button class="quick" type="button" data-add="${esc(id)}" aria-label="${esc(u(L).t.addToList)}" title="${esc(u(L).t.addToList)}">${I.plus}</button></div>
<div class="info"><span class="brandname">${esc(typeName(t, L))}</span><h3><a href="${url}">${esc(n)}</a></h3>${codes.length ? `<span class="code" dir="ltr">${esc(codes.slice(0, 3).join(' · '))}</span>` : ''}</div></article>`;
}
function pager(L, base, cur, total, q) {
  const n = Math.ceil(total / PER); if (n <= 1) return '';
  const href = k => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), ...(k > 1 ? { p: k } : {}) })}`.replace(/\?$/, '');
  const f = x(L);
  return `<nav class="pager" aria-label="pagination">${cur > 1 ? `<a class="btn btn-line btn-sm" rel="prev" href="${href(cur - 1)}">${esc(f.prev)}</a>` : '<span></span>'}<span>${esc(fill(f.page, { p: cur, n }))}</span>${cur < n ? `<a class="btn btn-line btn-sm" rel="next" href="${href(cur + 1)}">${esc(f.next)}</a>` : '<span></span>'}</nav>`;
}
const searchForm = (L, action, q) => `<form class="catsearch" action="${action}" role="search">${I.search}<input type="search" name="q" value="${esc(q || '')}" placeholder="${esc(x(L).searchPh)}" aria-label="${esc(u(L).t.searchBtn)}" autocomplete="off"><button class="btn btn-dark" type="submit">${esc(u(L).t.searchBtn)}</button></form>`;

// ---------- arama ----------
// [ürün sırası, puan, eşleşen kod]
function search(q, onlyType) {
  const tq = tight(q); if (!tq) return [];
  const best = new Map();
  const put = (i, s, c) => { if (onlyType && TYPES[P[i][1]] !== onlyType) return; const b = best.get(i); if (!b || b[0] < s) best.set(i, [s, c]); };
  for (const i of EXACT.get(tq) || []) put(i, 100, null);
  if (tq.length >= 3) for (const [k, i] of CODES) { if (k !== tq && k.includes(tq)) put(i, k.startsWith(tq) ? 70 : 50, k); }
  // "busch 530a60114" gibi marka + kod aramaları: son kelimeyi kod olarak dene
  const words = norm(q).trim().split(/\s+/);
  // marka adı: o markanın tüm karşılıkları
  if (!best.size && BRANDS.has(tq)) for (const i of BRANDS.get(tq)) put(i, 30, null);
  if (!best.size && words.length > 1) { const last = tight(words[words.length - 1]); for (const i of EXACT.get(last) || []) put(i, 90, null); }
  const codeOf = (i, k) => { if (!k) return null; const r = P[i]; if (tight(r[0]) === k) return null; const o = r[2].find(z => tight(z[1]) === k); return o ? o[1] : null; };
  return [...best.entries()].sort((a, b) => b[1][0] - a[1][0] || a[0] - b[0]).map(([i, [s, k]]) => [i, s, codeOf(i, k || tq)]);
}

// ---------- tüm ürünler (kendi ürünlerimiz + kod kataloğu) ----------
// Kategori anahtarları: kendi grupları (ör. kompresor-filtreleri) ve kod kataloğu tipleri (ör. air)
let OWN = {}, ALL;
const own = L => OWN[L] || (OWN[L] = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(DIR, 'own.json.gz'))).toString())[L]);
function all() {
  if (ALL) return ALL;
  const o = own('tr');
  ALL = [...o.map((r, i) => ({ o: i, c: r[5], b: [r[4]] })), ...P.map((r, i) => ({ x: i, c: TYPES[r[1]], b: [...new Set(r[2].map(z => z[0]))] }))];
  BNAME = new Map(); for (const it of ALL) for (const bn of it.b) { const k = bkey(bn); if (k && !BNAME.has(k)) BNAME.set(k, bn); }
  for (const it of ALL) it.bk = it.b.map(bkey);
  return ALL;
}
let BNAME;
const bkey = b => norm(b).replace(/[^a-z0-9]/g, '');
const catOf = k => UI.cats.find(c => c.k === k);
const catSlug = (k, L) => { const c = catOf(k); return c.slug[L] || c.slug.en || c.slug.tr; };
const catName = (k, L) => { const c = catOf(k); return c.name[L] || c.name.en; };
const catByPath = (s, L) => UI.cats.find(c => c.slug[L] === s || c.slug.tr === s || c.slug.en === s);
const brandSlugOf = b => norm(b).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const catUrl = (k, L) => `${listUrl(L)}/${catSlug(k, L)}`;

function ownScore(r, tq, words) {
  let s = 0; const codes = r[2] ? r[2].split(' | ') : [];
  if (codes.some(c => tight(c) === tq)) s += 100; else if (tq.length > 2 && codes.some(c => tight(c).includes(tq))) s += 60;
  if (tq.length > 2 && r[3] && r[3].split(' | ').some(m => tight(m).includes(tq))) s += 40;
  const hay = norm([r[1], r[4], r[8]].join(' ')); if (words.length && words.every(w => hay.includes(w))) s += 30;
  return s;
}
function matchAll(q, L) {
  const items = all(); if (!q) return items.map(it => [it, 0, null]);
  const tq = tight(q), words = norm(q).trim().split(/\s+/).filter(Boolean), o = own(L), out = [];
  for (const it of items) if (it.o !== undefined) { const sc = ownScore(o[it.o], tq, words); if (sc) out.push([it, sc + 1, null]); }
  const xi = new Map(items.filter(it => it.x !== undefined).map(it => [it.x, it]));
  for (const [i, sc, c] of search(q)) out.push([xi.get(i), sc, c]);
  return out.sort((a, b) => b[1] - a[1]);
}
function ownCard(r, L) {
  return `<article class="card" data-id="${esc(r[0])}" data-name="${esc(r[1])}" data-code="${esc((r[2] || '').split(' | ')[0])}" data-img="${r[6]}" data-url="${r[7]}">
<div class="phw"><a class="ph" href="${r[7]}"><img src="${r[6]}" alt="${esc(r[1])}" loading="lazy" width="440" height="440"></a><button class="quick" type="button" data-add="${esc(r[0])}" aria-label="${esc(u(L).t.addToList)}" title="${esc(u(L).t.addToList)}">${I.plus}</button></div>
<div class="info"><span class="brandname">${esc(r[4])}</span><h3><a href="${r[7]}">${esc(r[1])}</a></h3>${r[2] ? `<span class="code" dir="ltr">${esc(r[2].split(' | ').slice(0, 2).join(' | '))}</span>` : ''}</div></article>`;
}
function viewAll(L, { q, pg, ks, bs, sort, pathCat, pathBrand }) {
  const f = x(L), st = u(L).t, base = listUrl(L);
  const hits = matchAll(q, L);
  const kset = new Set(ks), bset = new Set(bs.map(bkey).filter(Boolean));
  const okC = it => !kset.size || kset.has(it.c), okB = it => !bset.size || it.bk.some(k => bset.has(k));
  const list = hits.filter(([it]) => okC(it) && okB(it));
  if (sort === 'az') { const o = own(L); list.sort((a, b) => (a[0].o !== undefined ? o[a[0].o][1] : pname(P[a[0].x], L)).localeCompare(b[0].o !== undefined ? o[b[0].o][1] : pname(P[b[0].x], L), L, { numeric: true })); }
  const cc = new Map(), bc = new Map();
  for (const [it] of hits) { if (okB(it)) cc.set(it.c, (cc.get(it.c) || 0) + 1); if (okC(it)) for (const k of new Set(it.bk)) bc.set(k, (bc.get(k) || 0) + 1); }
  const nPg = Math.max(1, Math.ceil(list.length / PER)); pg = Math.min(pg, nPg);
  const slice = list.slice((pg - 1) * PER, pg * PER), o = own(L);
  const cats = UI.cats.filter(c => cc.get(c.k) || kset.has(c.k));
  const brands = [...bc.entries()].sort((a, b) => b[1] - a[1] || BNAME.get(a[0]).localeCompare(BNAME.get(b[0]))).map(([k, n]) => [k, n]);
  const selB = brands.filter(([k]) => bset.has(k)), restB = brands.filter(([k]) => !bset.has(k));
  const opt = (g, v, label, n, on) => `<label class="opt"><input type="checkbox" name="${g}" value="${esc(v)}"${on ? ' checked' : ''}><span>${esc(label)}</span><span class="c">${num(n, L)}</span></label>`;
  const bOpt = ([k, n]) => opt('b', brandSlugOf(BNAME.get(k)), BNAME.get(k), n, bset.has(k));
  const title = pathCat ? catName(pathCat, L) + (pathBrand ? ' – ' + BNAME.get(bkey(pathBrand)) : '') : f.title;
  const items = [[st.home, u(L).base.home], [f.title, base], ...(pathCat ? [[catName(pathCat, L), catUrl(pathCat, L)]] : []), ...(pathBrand ? [[BNAME.get(bkey(pathBrand)) || pathBrand, `${catUrl(pathCat, L)}/${brandSlugOf(pathBrand)}`]] : [])];
  const keep = new URLSearchParams(); if (q) keep.set('q', q); ks.forEach(k => keep.append('k', k)); bs.forEach(b => keep.append('b', brandSlugOf(b))); if (sort && sort !== 'rel') keep.set('s', sort);
  const pagerHtml = nPg > 1 ? `<nav class="pager" aria-label="pagination">${pg > 1 ? `<a class="btn btn-line btn-sm" rel="prev" href="${base}?${new URLSearchParams([...keep, ...(pg > 2 ? [['p', pg - 1]] : [])])}">${esc(f.prev)}</a>` : '<span></span>'}<span>${esc(fill(f.page, { p: pg, n: nPg }))}</span>${pg < nPg ? `<a class="btn btn-line btn-sm" rel="next" href="${base}?${new URLSearchParams([...keep, ['p', pg + 1]])}">${esc(f.next)}</a>` : '<span></span>'}</nav>` : '';
  const cards = slice.map(([it, , c]) => it.o !== undefined ? ownCard(o[it.o], L) : card(it.x, L, c)).join('');
  const body = `<div class="wrap">${crumbs(items)}
 <div class="cat-head"><div><h1>${esc(title)}</h1><p>${q ? esc(fill(f.searchTitle, { q })) + ' · ' : ''}${num(list.length, L)} ${esc(f.items)}</p></div></div>
 <form class="xform" action="${base}" method="get"><div class="cat-layout"><aside class="filters" id="xfilters">
  <div class="inlinesearch">${I.search}<input name="q" type="search" value="${esc(q)}" placeholder="${esc(f.searchPh)}" aria-label="${esc(st.searchBtn)}" autocomplete="off"></div>
  <div><h4>${esc(st.productGroup)}</h4>${cats.map(c => opt('k', c.k, catName(c.k, L), cc.get(c.k) || 0, kset.has(c.k))).join('')}</div>
  ${brands.length ? `<div><h4>${esc(st.brand)}</h4>${[...selB, ...restB.slice(0, Math.max(0, 15 - selB.length))].map(bOpt).join('')}${restB.length > 15 - selB.length ? `<details class="more-b"><summary>${esc(fill(f.allBrands, { n: brands.length }))}</summary>${restB.slice(Math.max(0, 15 - selB.length)).map(bOpt).join('')}</details>` : ''}</div>` : ''}
  <button class="btn btn-dark btn-sm xapply" type="submit">${esc(st.searchBtn)}</button>
  ${q || ks.length || bs.length ? `<a class="btn btn-line btn-sm" href="${base}">${esc(st.clear)}</a>` : ''}</aside>
 <div style="min-width:0"><div class="toolbar"><span>${num(list.length, L)} ${esc(f.items)}</span><div style="display:flex;gap:8px"><button class="btn btn-line btn-sm filter-toggle" type="button" id="xf-toggle">${esc(st.filters)}</button><select name="s" aria-label="Sort"><option value="rel">${esc(st.sort[0])}</option><option value="az"${sort === 'az' ? ' selected' : ''}>${esc(st.sort[1])}</option></select></div></div>
 ${slice.length ? `<div class="cards grid-auto">${cards}</div>${pagerHtml}` : `<div class="empty">${esc(f.searchNone)}</div>`}</div></div></form></div>`;
  const filtered = !!(q || bs.length || (ks.length && !pathCat) || ks.length > 1 || sort === 'az');
  const pth = pathCat ? `${catUrl(pathCat, L)}${pathBrand ? '/' + brandSlugOf(pathBrand) : ''}` : base;
  return page(L, { path: pth + (pg > 1 && !filtered ? `?p=${pg}` : ''), route: l => pathCat ? `${catUrl(pathCat, l)}${pathBrand ? '/' + brandSlugOf(pathBrand) : ''}` : listUrl(l), title: pg > 1 ? `${title} – ${fill(f.page, { p: pg, n: nPg })}` : title, desc: fill(f.desc, { n: num(list.length, L), c: num(UI.nOem, L) }), body, jsonld: [crumbLd(items)], noindex: filtered });
}
function viewItem(L, slug, q) {
  const i = BYSLUG.get(slug); if (i === undefined) return null;
  const r = P[i], t = TYPES[r[1]], f = x(L), st = u(L).t, tn = typeName(t, L), n = pname(r, L), url = itemUrl(r, L), im = imgOf(t);
  const waTxt = encodeURIComponent(st.waProduct + `${n} – ${SITE}${url}`);
  const byBrand = new Map(); for (const [b, c] of r[2]) { if (!byBrand.has(b)) byBrand.set(b, []); byBrand.get(b).push(c); }
  const tq = q ? tight(q) : '';
  const oem = r[2].length ? `<section class="xr-sec"><h2>${esc(f.oemTitle)}</h2><p class="xr-lead">${esc(f.oemLead)}</p>
<table class="xr-tbl"><thead><tr><th>${esc(f.brand)}</th><th>${esc(f.oemCode)}</th></tr></thead><tbody>${[...byBrand].map(([b, cs]) => `<tr><th>${esc(b)}</th><td dir="ltr"><div class="xr-codes">${cs.map(c => `<span class="mono${tq && tight(c) === tq ? ' hit' : ''}">${esc(c)}</span>`).join('')}</div></td></tr>`).join('')}</tbody></table></section>` : '';
  const apps = `<section class="xr-sec"><h2>${esc(f.appsTitle)}</h2>${r[3].length ? `<table class="xr-tbl"><thead><tr><th>${esc(f.brand)}</th><th>${esc(f.model)}</th><th class="q">${esc(f.qty)}</th></tr></thead><tbody>${r[3].map(([b, m, k]) => `<tr><th>${esc(b)}</th><td dir="ltr">${esc(m)}</td><td class="q">${k}</td></tr>`).join('')}</tbody></table>` : `<div class="tabnote"><p>${esc(f.noApps)}</p><a class="btn btn-line btn-sm" href="https://wa.me/${UI.wa}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${esc(st.waAsk)}</a></div>`}</section>`;
  const pool = BYTYPE.get(t), at = pool.indexOf(i), rel = [...pool.slice(Math.max(0, at - 2), at), ...pool.slice(at + 1, at + 3)].slice(0, 4);
  const items = [[st.home, u(L).base.home], [f.title, listUrl(L)], [tn, typeUrl(t, L)], [r[0], url]];
  const firstCodes = r[2].slice(0, 4).map(o => `${o[0]} ${o[1]}`);
  const desc = fill(f.pdesc, { code: r[0], type: tn, list: firstCodes.join(', ') || '-' }).slice(0, 300);
  const body = `<div class="wrap">${crumbs(items)}
<div class="pd" data-id="x:${esc(slug)}" data-name="${esc(n)}" data-code="${esc(r[0])}" data-img="${im}" data-url="${url}">
 <div class="gal"><div class="gallery" id="gal-main"><img src="${im}" alt="${esc(n)}" width="900" height="900" fetchpriority="high"></div></div>
 <div><div class="kicker"><span class="pill">Sofilx</span><span class="stock"><a href="${typeUrl(t, L)}">${esc(tn)}</a></span></div>
 <h1>${esc(n)}</h1>${q ? `<p class="xr-matched">${esc(fill(f.matched, { q }))}</p>` : ''}
 <dl class="quick-sp"><dt>${esc(f.code)}</dt><dd class="mono" dir="ltr">${esc(r[0])}</dd><dt>${esc(f.type)}</dt><dd>${esc(tn)}</dd>${firstCodes.length ? `<dt>${esc(f.oemCode)}</dt><dd dir="ltr">${esc(firstCodes.slice(0, 3).join(' · '))}${r[2].length > 3 ? ` <a href="#xr-oem">${esc(fill(f.more, { n: r[2].length - 3 }))}</a>` : ''}</dd>` : ''}</dl>
 <div class="buy"><div class="buyrow"><div class="qty"><button type="button" data-step="-1" aria-label="-">−</button><input id="pd-qty" type="number" min="1" value="1" aria-label="${esc(f.qty)}"><button type="button" data-step="1" aria-label="+">+</button></div><button class="btn btn-dark" type="button" id="pd-add">${esc(st.addToList)}</button></div>
  <a class="btn btn-line wa" href="https://wa.me/${UI.wa}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${esc(st.waAsk)}</a>
  <div class="notes">${st.notes.map(z => `<div><b>${esc(z[0])}</b>${esc(z[1])}</div>`).join('')}</div>
  <div class="share"><span>${esc(st.share)}</span><a href="https://wa.me/?text=${encodeURIComponent(n + ' – ' + SITE + url)}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}</a><button type="button" data-copy="${esc(r[0])}">${esc(st.copyCode)}</button></div></div>
 </div></div>
<div class="xr-body" id="xr-oem">${oem}${apps}</div>
${rel.length ? `<section class="block" style="padding-top:56px"><div class="sec-head"><h2 style="font-size:32px">${esc(f.alsoSee)}</h2><a class="link" href="${typeUrl(t, L)}">${esc(tn)} ${I.arrow}</a></div><div class="cards">${rel.map(k => card(k, L)).join('')}</div></section>` : ''}</div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: n, sku: r[0], mpn: r[0], image: [SITE + im], description: desc, brand: { '@type': 'Brand', name: 'Sofilx' }, category: tn };
  return page(L, { path: url, route: l => itemUrl(r, l), title: `${n}${firstCodes[0] ? ' – ' + firstCodes[0] : ''}`, desc, body, jsonld: [ld, crumbLd(items)], ogImg: im });
}
function viewSj(L, q) {
  const h = search(q);
  return { total: h.length, more: `${listUrl(L)}?q=${encodeURIComponent(q)}`,
    items: h.slice(0, 8).map(([i, , c]) => { const r = P[i], t = TYPES[r[1]]; return { n: pname(r, L), u: itemUrl(r, L) + (c ? `?q=${encodeURIComponent(c)}` : ''), im: imgOf(t), c: c || r[0], t: typeName(t, L) }; }) };
}
function viewSitemap(L, n) {
  const urls = [listUrl(L), ...UI.cats.map(c => catUrl(c.k, L)), ...P.map(r => itemUrl(r, L))].slice((n - 1) * SM, n * SM);
  if (!urls.length) return null;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(z => `<url><loc>${SITE}${esc(z)}</loc></url>`).join('\n')}\n</urlset>`;
}

export default function handler(req, res) {
  try {
    load();
    const q0 = req.query || Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    const L = UI.langs.includes(q0.L) ? q0.L : 'tr';
    const view = q0.view || 'list', q = String(q0.q || '').trim().slice(0, 80), pg = Math.max(1, Math.min(500, parseInt(q0.p, 10) || 1));
    const cache = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
    if (view === 'sj') { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', cache); return res.end(JSON.stringify(q ? viewSj(L, q) : { total: 0, items: [] })); }
    if (view === 'sitemap') { const s = viewSitemap(L, parseInt(q0.n, 10) || 1); if (!s) { res.statusCode = 404; return res.end('not found'); } res.setHeader('Content-Type', 'application/xml; charset=utf-8'); res.setHeader('Cache-Control', cache); return res.end(s); }
    // tam kod eşleşmesi tek ürüne çıkıyorsa doğrudan ürün sayfasına git
    if (view === 'list' && q && pg === 1 && !q0.k && !q0.b) {
      const ex = [...new Set(EXACT.get(tight(q)) || [])];
      if (ex.length === 1) { res.statusCode = 302; res.setHeader('Location', itemUrl(P[ex[0]], L) + (tight(P[ex[0]][0]) === tight(q) ? '' : `?q=${encodeURIComponent(q)}`)); res.setHeader('Cache-Control', cache); return res.end(); }
    }
    const arr = v => v === undefined ? [] : Array.isArray(v) ? v : [v];
    const sp = new URL(req.url, 'http://x').searchParams;
    const ks = [...new Set([...arr(q0.k), ...sp.getAll('k')].map(String))].filter(k => catOf(k));
    const bs = [...new Set([...arr(q0.b), ...sp.getAll('b')].map(String))].filter(Boolean).slice(0, 20);
    let html;
    if (view === 'item') html = viewItem(L, String(q0.slug || ''), q);
    else if (view === 'type') {
      all(); const c = catByPath(String(q0.t || ''), L);
      const pb = q0.pb ? String(q0.pb) : '';
      const pbName = pb ? [...BNAME.values()].find(n => brandSlugOf(n) === pb) : '';
      html = c && (!pb || pbName) ? viewAll(L, { q, pg, ks: [...new Set([c.k, ...ks])], bs: pbName ? [pbName, ...bs] : bs, sort: q0.s, pathCat: c.k, pathBrand: pbName }) : null;
    } else { all(); html = viewAll(L, { q, pg, ks, bs, sort: q0.s }); }
    if (!html) { res.statusCode = 404; all(); html = viewAll(L, { q: String(q0.slug || q0.t || '').replace(/-/g, ' '), pg: 1, ks: [], bs: [] }); res.setHeader('Cache-Control', 'public, s-maxage=300'); }
    else res.setHeader('Cache-Control', view === 'item' && q ? 'public, max-age=300, s-maxage=3600' : cache);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (e) {
    console.error(e); res.statusCode = 500; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end('Sunucu hatası');
  }
}
