// Parça kataloğu (Filtre Pazarlama ürünleri): sayfalar istek anında üretilir, CDN'de önbelleğe alınır.
// Görünümler: home (katalog + arama), cat (grup listesi), part (ürün), sj (arama JSON), sitemap
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SITE = 'https://www.sofilx.com';
const DIR = path.join(process.cwd(), 'data/fp');
const WA = '905523508446';
const PER = 48, SM = 40000, NSH = 128;

let UI, IDX, CATS, CATIDX, BYSLUG, BYCAT, OWN, KEYS;
const SHELL = {}, SHARD = {};
const gz = f => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(DIR, f))).toString());
function load() {
  if (UI) return;
  UI = JSON.parse(fs.readFileSync(path.join(DIR, 'ui.json'), 'utf8'));
  IDX = gz('idx.json.gz');
  CATS = JSON.parse(fs.readFileSync(path.join(DIR, 'cats.json'), 'utf8'));
  CATIDX = Object.fromEntries(CATS.map((c, i) => [c.s, i]));
  BYSLUG = new Map(); BYCAT = new Map();
  IDX.forEach((r, i) => { BYSLUG.set(r[0], i); if (!BYCAT.has(r[3])) BYCAT.set(r[3], []); BYCAT.get(r[3]).push(i); });
  for (const [, arr] of BYCAT) arr.sort((a, b) => (!!IDX[b][4] - !!IDX[a][4]) || a - b); // görselliler önce
  KEYS = IDX.map(r => [tight(r[1]), norm(r[1])]);
}
const shell = L => SHELL[L] || (SHELL[L] = fs.readFileSync(path.join(DIR, 'shell', `${L}.html`), 'utf8'));
const own = L => { if (!OWN) OWN = gz('own.json.gz'); return OWN[L] || []; };
function fnv(s) { let h = 2166136261; for (const b of Buffer.from(s, 'utf8')) h = Math.imul(h ^ b, 16777619) >>> 0; return h; }
function detail(slug) {
  const k = String(fnv(slug) % NSH).padStart(3, '0');
  if (!SHARD[k]) SHARD[k] = gz(`d/${k}.json.gz`);
  return SHARD[k][slug] || {};
}

// ---------- yardımcılar ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => o[k] ?? m);
function norm(s) { return String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/î/g, 'i'); }
function tight(s) { return norm(s).replace(/[\s\-.\/|+*_,()]/g, ''); }
const img = rel => rel ? `/pimg/${rel}` : '/img/placeholder.svg';
const num = (n, L) => Number(n).toLocaleString(L === 'tr' ? 'tr-TR' : L === 'en' ? 'en-GB' : L);
const u = L => UI[L];
const partUrl = (s, L) => u(L).base.part.replace('__S__', s);
const catUrl = (c, L) => u(L).base.partCat.replace('__C__', c);
const catName = (c, L) => u(L).cats[c] || u('tr').cats[c] || c;
const phrase = (r, L) => r[2] >= 0 ? (u(L).ph[r[2]] || u('tr').ph[r[2]]) : '';
const pname = (r, L) => [r[1], phrase(r, L)].filter(Boolean).join(' ');
const ptype = (r, L) => phrase(r, L) || catName(r[3], L);
const I = {
  arrow: '<svg class="i-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.2 1.2z"/></svg>',
};

function page(L, { path: p, route, title, desc, body, jsonld = [], ogImg, noindex }) {
  let h = shell(L);
  for (const l of UI.langs) h = h.split(`/__R_${l}__`).join(route ? route(l) : (l === 'tr' ? '/' : '/' + l));
  const head = (noindex ? '<meta name="robots" content="noindex,follow">' : '') + jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('');
  return h.split('/__PATH__').join(p).split('__TITLE__').join(esc(title)).split('__DESC__').join(esc(desc))
    .split('__OGIMG__').join(ogImg || '/img/hero.webp').split('__HEAD__').join(head).replace('__BODY__', () => body);
}
const crumbs = items => `<nav class="crumbs" aria-label="breadcrumb">${items.map((x, i) => i < items.length - 1 ? `<a href="${x[1]}">${esc(x[0])}</a><span>/</span>` : `<span aria-current="page">${esc(x[0])}</span>`).join('')}</nav>`;
const crumbLd = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: SITE + x[1] })) });

function card(i, L) {
  const r = IDX[i], n = pname(r, L), url = partUrl(r[0], L), id = 'p:' + r[0];
  return `<article class="card" data-id="${esc(id)}" data-name="${esc(n)}" data-code="${esc(r[1])}" data-img="${img(r[4])}" data-url="${url}" data-type="${esc(ptype(r, L))}" data-cat="${esc(r[3])}">
<div class="phw"><a class="ph" href="${url}"><img src="${img(r[4])}" alt="${esc(n)}" loading="lazy" width="300" height="300"></a><button class="quick" type="button" data-add="${esc(id)}" aria-label="${esc(u(L).t.addToList)}" title="${esc(u(L).t.addToList)}">${I.plus}</button></div>
<div class="info"><span class="brandname">${esc(catName(r[3], L))}</span><h3><a href="${url}">${esc(n)}</a></h3><span class="code" dir="ltr">${esc(r[1])}</span></div></article>`;
}
function ownCard(o) {
  return `<article class="card" data-id="${esc(o[7])}" data-name="${esc(o[0])}" data-code="${esc(o[1].split(' | ')[0] || '')}" data-img="${o[5]}" data-url="${o[6]}">
<div class="phw"><a class="ph" href="${o[6]}"><img src="${o[5]}" alt="${esc(o[0])}" loading="lazy" width="440" height="440"></a><button class="quick" type="button" data-add="${esc(o[7])}">${I.plus}</button></div>
<div class="info"><span class="brandname">${esc(o[3])}</span><h3><a href="${o[6]}">${esc(o[0])}</a></h3>${o[1] ? `<span class="code" dir="ltr">${esc(o[1].split(' | ').slice(0, 2).join(' | '))}</span>` : ''}</div></article>`;
}
function pager(L, base, cur, total, q) {
  const n = Math.ceil(total / PER); if (n <= 1) return '';
  const href = k => `${base}?${new URLSearchParams({ ...(q ? { q } : {}), ...(k > 1 ? { p: k } : {}) })}`.replace(/\?$/, '');
  const f = u(L).fp;
  return `<nav class="pager" aria-label="pagination">${cur > 1 ? `<a class="btn btn-line btn-sm" rel="prev" href="${href(cur - 1)}">${esc(f.prev)}</a>` : '<span></span>'}<span>${esc(fill(f.page, { p: cur, n }))}</span>${cur < n ? `<a class="btn btn-line btn-sm" rel="next" href="${href(cur + 1)}">${esc(f.next)}</a>` : '<span></span>'}</nav>`;
}
const searchForm = (L, action, q) => `<form class="catsearch" action="${action}" role="search">${I.search}<input type="search" name="q" value="${esc(q || '')}" placeholder="${esc(u(L).fp.searchPh)}" aria-label="${esc(u(L).t.searchBtn)}"><button class="btn btn-dark" type="submit">${esc(u(L).t.searchBtn)}</button></form>`;

// ---------- arama ----------
function scoreKey(i, tq, words, L) {
  const [tk, nk] = KEYS[i]; let s = 0;
  if (tk === tq) s += 100; else if (tq.length > 2 && tk.includes(tq)) s += 60;
  if (words.length) { const hay = nk + ' ' + norm(phrase(IDX[i], L)) + ' ' + norm(phrase(IDX[i], 'tr')); if (words.every(w => hay.includes(w))) s += 30; }
  return s;
}
function searchParts(q, L, onlyCat) {
  const tq = tight(q), words = norm(q).trim().split(/\s+/).filter(Boolean); if (!tq) return [];
  const pool = onlyCat ? (BYCAT.get(onlyCat) || []) : null, out = [];
  const N = pool ? pool.length : IDX.length;
  for (let k = 0; k < N; k++) { const i = pool ? pool[k] : k; const s = scoreKey(i, tq, words, L); if (s) out.push([i, s]); }
  return out.sort((a, b) => b[1] - a[1] || (!!IDX[b[0]][4] - !!IDX[a[0]][4])).map(x => x[0]);
}
function searchOwn(q, L) {
  const tq = tight(q), words = norm(q).trim().split(/\s+/).filter(Boolean); if (!tq) return [];
  return own(L).map(o => {
    let s = 0; const codes = o[1].split(' | ');
    if (codes.some(c => tight(c) === tq)) s += 100; else if (tq.length > 2 && codes.some(c => tight(c).includes(tq))) s += 60;
    if (tq.length > 2 && o[2].split(' | ').some(m => tight(m).includes(tq))) s += 40;
    const hay = norm([o[0], o[3], o[4]].join(' ')); if (words.length && words.every(w => hay.includes(w))) s += 30;
    return [o, s];
  }).filter(x => x[1]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
}

// ---------- görünümler ----------
function viewHome(L, q, pg) {
  const f = u(L).fp, base = u(L).base.parts, total = IDX.length;
  let inner = searchForm(L, base, q);
  if (q) {
    const ownHits = searchOwn(q, L), hits = searchParts(q, L), cnt = hits.length + ownHits.length;
    const slice = hits.slice((pg - 1) * PER, pg * PER);
    inner += `<div class="cat-head"><div><h2 style="font-size:28px">${esc(fill(f.searchTitle, { q }))}</h2><p>${num(cnt, L)} ${esc(u(L).t.items)}</p></div></div>`
      + (cnt ? `<div class="cards grid-auto">${pg === 1 ? ownHits.slice(0, 24).map(ownCard).join('') : ''}${slice.map(i => card(i, L)).join('')}</div>${pager(L, base, pg, hits.length, q)}` : `<div class="empty">${esc(f.searchNone)}</div>`);
  }
  inner += `<section class="block" style="padding-top:${q ? 56 : 24}px"><div class="sec-head"><div><h2 style="font-size:32px">${esc(f.groups)}</h2></div></div><div class="pcats">${CATS.map(c => `<a class="pcat" href="${catUrl(c.s, L)}"><span class="ph">${c.img ? `<img src="${img(c.img)}" alt="" loading="lazy">` : ''}</span><span class="nm"><b>${esc(catName(c.s, L))}</b><small>${num(c.n, L)} ${esc(f.parts)}</small></span></a>`).join('')}</div></section>`;
  const items = [[u(L).t.home, u(L).base.home], [f.catalog, base]];
  const body = `<div class="wrap">${crumbs(items)}<div class="page-head"><h1>${esc(f.catalog)}</h1><p>${esc(fill(f.catalogLead, { n: num(total, L) }))}</p></div>${inner}</div>`;
  return page(L, { path: base, route: l => u(l).base.parts, title: q ? fill(f.searchTitle, { q }) : f.catalog, desc: fill(f.catalogDesc, { n: num(total, L) }), body, jsonld: [crumbLd(items)], noindex: !!q });
}
function viewCat(L, cat, q, pg) {
  if (!(cat in CATIDX)) return null;
  const f = u(L).fp, cn = catName(cat, L), base = catUrl(cat, L);
  const list = q ? searchParts(q, L, cat) : BYCAT.get(cat) || [];
  const slice = list.slice((pg - 1) * PER, pg * PER);
  const items = [[u(L).t.home, u(L).base.home], [f.catalog, u(L).base.parts], [cn, base]];
  const body = `<div class="wrap">${crumbs(items)}<div class="cat-head"><div><h1>${esc(cn)}</h1><p>${num(list.length, L)} ${esc(f.parts)}</p></div></div>${searchForm(L, base, q)}
${slice.length ? `<div class="cards grid-auto">${slice.map(i => card(i, L)).join('')}</div>${pager(L, base, pg, list.length, q)}` : `<div class="empty">${esc(f.searchNone)}</div>`}</div>`;
  return page(L, { path: base + (pg > 1 ? `?p=${pg}` : ''), route: l => catUrl(cat, l), title: pg > 1 ? `${cn} – ${fill(f.page, { p: pg, n: Math.ceil(list.length / PER) })}` : cn, desc: `${cn}: ${fill(f.catalogDesc, { n: num(list.length, L) })}`, body, jsonld: [crumbLd(items)], noindex: !!q, ogImg: CATS[CATIDX[cat]].img ? img(CATS[CATIDX[cat]].img) : '' });
}
function compatHtml(c, L) {
  if (!c) return '';
  if (c.g) return `<div class="cgroups" dir="ltr">${c.g.map(([b, m]) => `<div><h4>${esc(b)}</h4>${m ? `<p>${esc(m)}</p>` : ''}</div>`).join('')}</div>`;
  if (c.l) return `<div class="mgrid" dir="ltr">${c.l.map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
  if (c.p) return `<div class="mgrid" dir="ltr">${c.p.map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
  return '';
}
function viewPart(L, slug) {
  const i = BYSLUG.get(slug); if (i === undefined) return null;
  const r = IDX[i], d = detail(slug), t = u(L).t, f = u(L).fp;
  const n = pname(r, L), ty = ptype(r, L), cn = catName(r[3], L), url = partUrl(slug, L);
  const imgs = (d.i && d.i.length ? d.i : [r[4]]).filter(Boolean);
  const waTxt = encodeURIComponent(t.waProduct + `${n} – ${SITE}${url}`);
  const cmp = compatHtml(d.c, L);
  const specs = [[f.partCode, `<span class="mono" dir="ltr">${esc(r[1])}</span>`], [t.ptype, esc(ty)], [t.group, `<a href="${catUrl(r[3], L)}">${esc(cn)}</a>`]];
  if (d.k && d.k.length > 1) specs.push([f.groups, d.k.map(c => `<a href="${catUrl(c, L)}">${esc(catName(c, L))}</a>`).join(', ')]);
  const tabs = [
    ['uyum', t.tabs.uyum, cmp ? `<h3>${esc(f.compatEquip)}</h3>${cmp}` : `<div class="tabnote"><b>${esc(t.noModels[0])}</b><p>${esc(f.compatNone)}</p><a class="btn btn-line btn-sm" href="https://wa.me/${WA}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${esc(t.noModels[2])}</a></div>`],
    ['teknik', t.tabs.teknik, `<dl class="sp">${specs.map(s => `<dt>${esc(s[0])}</dt><dd>${s[1]}</dd>`).join('')}</dl>`],
    ['genel', t.tabs.genel, `<div class="prose">${t.genel}</div>`],
    ['teslimat', t.tabs.teslimat, `<div class="facts3">${t.teslimat.map(z => `<div><b>${esc(z[0])}</b><p>${esc(z[1])}</p></div>`).join('')}</div>`],
    ['iade', t.tabs.iade, `<div class="prose">${t.iade}</div>`],
    ['sss', t.tabs.sss, `<div class="faq">${t.faq.map((q, k) => `<details${k === 0 ? ' open' : ''}><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join('')}</div>`],
  ];
  const pool = BYCAT.get(r[3]) || []; const at = pool.indexOf(i);
  const rel = [...pool.slice(Math.max(0, at - 2), at), ...pool.slice(at + 1, at + 3)].filter(k => IDX[k][4]).slice(0, 4);
  const items = [[t.home, u(L).base.home], [f.catalog, u(L).base.parts], [cn, catUrl(r[3], L)], [n, url]];
  const body = `<div class="wrap">${crumbs(items)}
<div class="pd" data-id="p:${esc(slug)}" data-name="${esc(n)}" data-code="${esc(r[1])}" data-img="${img(r[4])}" data-url="${url}">
 <div class="gal"><div class="gallery" id="gal-main"><img src="${img(imgs[0])}" alt="${esc(n)}" width="700" height="700" fetchpriority="high"></div>${imgs.length > 1 ? `<div class="thumbs">${imgs.map((h, k) => `<button class="thumb${k === 0 ? ' on' : ''}" type="button" data-src="${img(h)}" aria-label="${esc(t.photo)} ${k + 1}"><img src="${img(h)}" alt="" width="84" height="84" loading="lazy"></button>`).join('')}</div>` : ''}</div>
 <div><div class="kicker"><span class="pill">${esc(f.inCatalog)}</span><span class="stock">${esc(cn)}</span></div>
 <h1>${esc(n)}</h1>
 <dl class="quick-sp"><dt>${esc(f.partCode)}</dt><dd class="mono" dir="ltr">${esc(r[1])}</dd><dt>${esc(t.ptype)}</dt><dd>${esc(ty)}</dd><dt>${esc(t.group)}</dt><dd><a href="${catUrl(r[3], L)}">${esc(cn)}</a></dd></dl>
 <div class="buy"><div class="buyrow"><div class="qty"><button type="button" data-step="-1" aria-label="-">−</button><input id="pd-qty" type="number" min="1" value="1" aria-label="${esc(t.qty)}"><button type="button" data-step="1" aria-label="+">+</button></div><button class="btn btn-dark" type="button" id="pd-add">${esc(t.addToList)}</button></div>
  <a class="btn btn-line wa" href="https://wa.me/${WA}?text=${waTxt}" target="_blank" rel="noopener">${I.wa} ${esc(t.waAsk)}</a>
  <div class="notes">${t.notes.map(z => `<div><b>${esc(z[0])}</b>${esc(z[1])}</div>`).join('')}</div>
  <div class="share"><span>${esc(t.share)}</span><a href="https://wa.me/?text=${encodeURIComponent(n + ' – ' + SITE + url)}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.wa}</a><button type="button" data-copy="${esc(r[1])}">${esc(t.copyCode)}</button></div></div>
 </div></div>
<div class="ptabs" role="tablist">${tabs.map((z, k) => `<button type="button" role="tab" class="${k === 0 ? 'on' : ''}" data-tab="${z[0]}" aria-selected="${k === 0}">${esc(z[1])}</button>`).join('')}</div>
${tabs.map((z, k) => `<section class="tabpane" id="tab-${z[0]}" role="tabpanel" ${k === 0 ? '' : 'hidden'}><h2 class="sr-only">${esc(z[1])}</h2>${z[2]}</section>`).join('')}
${rel.length ? `<section class="block" style="padding-top:56px"><div class="sec-head"><h2 style="font-size:32px">${esc(f.alsoSee)}</h2><a class="link" href="${catUrl(r[3], L)}">${esc(cn)} ${I.arrow}</a></div><div class="cards">${rel.map(k => card(k, L)).join('')}</div></section>` : ''}</div>`;
  const desc = fill(f.partDesc, { name: n, type: ty });
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: n, image: imgs.map(h => SITE + img(h)), description: desc, mpn: r[1].split(' ').filter(w => /\d/.test(w)).join(' ') || r[1], category: cn };
  return page(L, { path: url, route: l => partUrl(slug, l), title: n, desc, body, jsonld: [ld, crumbLd(items)], ogImg: img(imgs[0]) });
}
function viewSj(L, q) {
  const o = searchOwn(q, L).slice(0, 3), h = searchParts(q, L);
  return { total: h.length + searchOwn(q, L).length, more: `${u(L).base.parts}?q=${encodeURIComponent(q)}`,
    items: [...o.map(x => ({ n: x[0], u: x[6], im: x[5], c: x[1].split(' | ')[0] || '', t: x[4] })), ...h.slice(0, 8 - o.length).map(i => ({ n: pname(IDX[i], L), u: partUrl(IDX[i][0], L), im: img(IDX[i][4]), c: IDX[i][1], t: catName(IDX[i][3], L) }))] };
}
function viewSitemap(L, n) {
  const urls = [u(L).base.parts, ...CATS.map(c => catUrl(c.s, L)), ...IDX.map(r => partUrl(r[0], L))].slice((n - 1) * SM, n * SM);
  if (!urls.length) return null;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(x => `<url><loc>${SITE}${esc(x)}</loc></url>`).join('\n')}\n</urlset>`;
}

export default function handler(req, res) {
  try {
    load();
    const q0 = req.query || Object.fromEntries(new URL(req.url, 'http://x').searchParams);
    const L = UI[q0.L] && q0.L !== 'langs' ? q0.L : 'tr';
    const view = q0.view || 'home', q = String(q0.q || '').trim().slice(0, 80), pg = Math.max(1, Math.min(5000, parseInt(q0.p, 10) || 1));
    const cache = 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
    if (view === 'sj') { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', cache); return res.end(JSON.stringify(q ? viewSj(L, q) : { total: 0, items: [] })); }
    if (view === 'sitemap') { const x = viewSitemap(L, parseInt(q0.n, 10) || 1); if (!x) { res.statusCode = 404; return res.end('not found'); } res.setHeader('Content-Type', 'application/xml; charset=utf-8'); res.setHeader('Cache-Control', cache); return res.end(x); }
    let html = view === 'part' ? viewPart(L, String(q0.slug || '')) : view === 'cat' ? viewCat(L, String(q0.cat || ''), q, pg) : viewHome(L, q, pg);
    if (!html) { res.statusCode = 404; html = viewHome(L, String(q0.slug || q0.cat || '').replace(/-/g, ' '), 1); res.setHeader('Cache-Control', 'public, s-maxage=300'); }
    else res.setHeader('Cache-Control', cache);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (e) {
    console.error(e); res.statusCode = 500; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); res.end('Sunucu hatası');
  }
}
