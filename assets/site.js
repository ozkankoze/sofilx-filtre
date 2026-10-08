/* Sofilx site istemci kodu */
(function () {
  'use strict';
  var S = window.SFX || { L: 'tr', t: {} }, t = S.t, L = S.L;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  var ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m5 12 5 5 9-10"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* ---------- teklif listesi ---------- */
  var KEY = 'sofilx-list';
  var cart = store.get(KEY, []);
  function save() { store.set(KEY, cart); badge(); }
  function inCart(id) { return cart.some(function (l) { return l.id === id; }); }
  function badge() {
    var n = cart.length;
    $$('#badge,#mcount').forEach(function (b) { b.textContent = n; });
    $$('.quick[data-add]').forEach(function (b) { var c = inCart(b.dataset.add); b.classList.toggle('in', c); b.innerHTML = c ? ICON.check : ICON.plus; });
    var pa = $('#pd-add'); if (pa) { var pd = pa.closest('.pd') || $('.pd'); if (pd && inCart(pd.dataset.id)) pa.textContent = t.addMore; }
  }
  function infoFrom(el) { var d = el.dataset; return { id: d.id, name: d.name, code: d.code, img: d.img, url: d.url }; }
  function add(info, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    var l = cart.filter(function (x) { return x.id === info.id; })[0];
    if (l) l.qty += qty; else cart.push({ id: info.id, name: info.name, code: info.code, img: info.img, url: info.url, qty: qty, note: '' });
    save(); var b = $('#badge'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    toast(info.name + ' ' + t.added);
    if (window.dataLayer) window.dataLayer.push({ event: 'add_to_quote', item_id: info.id });
  }
  function fly(from) {
    try {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var host = from.closest('.card,.pd'); var src = host && host.querySelector('.ph img,.gallery img'); var to = $('#badge');
      if (!src || !to) return; var a = src.getBoundingClientRect(), b = to.getBoundingClientRect(); if (!a.width) return;
      var c = src.cloneNode(); c.removeAttribute('loading');
      Object.assign(c.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', objectFit: 'contain', zIndex: 90, pointerEvents: 'none' });
      document.body.appendChild(c);
      var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      var an = c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx * .55 + 'px,' + (dy * .35 - 60) + 'px) scale(.45)', opacity: .9, offset: .55 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: .2 }], { duration: 620, easing: 'cubic-bezier(.5,0,.3,1)' });
      an.onfinish = function () { c.remove(); };
    } catch (e) { }
  }
  var tt;
  function toast(msg, noBtn) { var el = $('#toast'); if (!el) return; $('#toast-t').textContent = msg; $('#toast-b').hidden = !!noBtn; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('on'); }, 3000); }

  function drawDrawer() {
    var list = $('#drawer-list'), foot = $('#drawer-foot'); if (!list) return;
    list.innerHTML = cart.length ? cart.map(function (l) {
      return '<div class="line"><a class="th" href="' + esc(l.url) + '"><img src="' + esc(l.img) + '" alt=""></a><div style="min-width:0"><b>' + esc(l.name) + '</b><small>' + esc(l.code) + '</small><div style="margin-top:8px"><div class="qty small"><button type="button" data-q="' + esc(l.id) + '" data-d="-1" aria-label="-">−</button><input type="number" min="1" value="' + l.qty + '" data-qi="' + esc(l.id) + '" aria-label="qty"><button type="button" data-q="' + esc(l.id) + '" data-d="1" aria-label="+">+</button></div></div></div><button class="x" type="button" data-rm="' + esc(l.id) + '" aria-label="remove">' + ICON.trash + '</button></div>';
    }).join('') : '<div class="empty" style="margin-top:18px">' + esc(t.drawerEmpty) + '</div>';
    var total = cart.reduce(function (a, l) { return a + l.qty; }, 0);
    foot.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:14px;color:var(--muted)"><span>' + cart.length + ' ' + t.lines + '</span><span>' + total + ' ' + t.pcs + '</span></div><a class="btn btn-dark" style="height:50px' + (cart.length ? '' : ';opacity:.4;pointer-events:none') + '" href="' + S.quote + '">' + esc(t.requestQuote) + '</a><button class="btn btn-line" type="button" id="keep">' + esc(t.backToProducts) + '</button>';
  }
  function openCart() { drawDrawer(); $('#drawer').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('on'); }
  function closeCart() { $('#drawer').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('on'); }

  /* ---------- arama ---------- */
  var IDX = null, idxP = null;
  function loadIdx() { if (IDX) return Promise.resolve(IDX); if (!idxP) idxP = fetch('/assets/search-' + L + '.json').then(function (r) { return r.json(); }).then(function (j) { IDX = j; return j; }); return idxP; }
  function norm(s) { return String(s).toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/î/g, 'i'); }
  function tight(s) { return norm(s).replace(/[\s\-.\/|+*]/g, ''); }
  function score(p, q) {
    var tq = tight(q), nq = norm(q).trim(); if (!tq) return 0; var s = 0;
    var codes = (p.c || '').split(' | ').concat(p.n.match(/\d[\d\s.\-]{3,}\d/g) || []);
    if (codes.some(function (c) { return tight(c) === tq; })) s += 100; else if (tq.length > 2 && codes.some(function (c) { return tight(c).indexOf(tq) > -1; })) s += 60;
    if (tq.length > 2 && (p.m || '').split(' | ').some(function (m) { return tight(m).indexOf(tq) > -1; })) s += 40;
    var words = nq.split(/\s+/).filter(Boolean), hay = norm([p.n, p.b, p.t, p.g, p.k || ''].join(' '));
    if (words.length && words.every(function (w) { return hay.indexOf(w) > -1; })) s += 30;
    return s;
  }
  function search(q) { return (IDX || []).map(function (p) { return [p, score(p, q)]; }).filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; }).map(function (x) { return x[0]; }); }
  function hl(text, q) { var raw = String(text), k = norm(q).trim(), i = norm(raw).indexOf(k); if (!k || i < 0) return esc(raw); return esc(raw.slice(0, i)) + '<mark>' + esc(raw.slice(i, i + k.length)) + '</mark>' + esc(raw.slice(i + k.length)); }
  function goList(q) { location.href = S.products + '?q=' + encodeURIComponent(q); }
  function bindSearch(input, box) {
    if (!input || !box) return; var act = -1, list = [];
    function draw() {
      var q = input.value; if (!q.trim()) { box.hidden = true; return; }
      loadIdx().then(function () {
        var all = search(q); list = all.slice(0, 7);
        if (!list.length) { box.innerHTML = '<div class="foot" style="border:0">' + esc(t.noResult) + '</div>'; box.hidden = false; return; }
        box.innerHTML = list.map(function (p, i) {
          var tq = tight(q), cm = (p.c || '').split(' | ').filter(function (c) { return tq.length > 2 && tight(c).indexOf(tq) > -1; })[0], mm = (p.m || '').split(' | ').filter(function (m) { return tq.length > 2 && tight(m).indexOf(tq) > -1; })[0];
          return '<a class="r' + (i === act ? ' act' : '') + '" href="' + p.u + '"><span class="th"><img src="' + p.im + '" alt=""></span><div><b>' + hl(p.n, q) + '</b><small>' + esc(p.b) + ' · ' + esc(p.t) + (cm ? ' · <span class="mono">' + hl(cm, q) + '</span>' : '') + (mm ? ' · ' + hl(mm, q) : '') + '</small></div><span class="go-i">' + ICON.arrow + '</span></a>';
        }).join('') + '<div class="foot"><a class="link" href="' + S.products + '?q=' + encodeURIComponent(q) + '">' + all.length + ' · ' + esc(t.viewAll) + ' ' + ICON.arrow + '</a></div>';
        box.hidden = false;
      });
    }
    input.addEventListener('input', function () { act = -1; draw(); });
    input.addEventListener('focus', function () { loadIdx(); draw(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { act = Math.min(act + 1, list.length - 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { act = Math.max(act - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (act >= 0 && list[act]) location.href = list[act].u; else if (input.value.trim()) goList(input.value.trim()); }
      else if (e.key === 'Escape') box.hidden = true;
    });
    box.addEventListener('mousedown', function (e) { e.preventDefault(); });
    input.addEventListener('blur', function () { setTimeout(function () { box.hidden = true; }, 150); });
  }

  /* ---------- liste sayfası filtreleri ---------- */
  function bindListing() {
    var grid = $('#grid'); if (!grid) return;
    var cards = $$('.card', grid), f = { cat: [], brand: [], type: [] }, q = '';
    var params = new URLSearchParams(location.search); var pq = params.get('q');
    var fq = $('#f-q'); if (pq && fq) { fq.value = pq; q = pq; }
    function apply() {
      var needIdx = q.trim() && !IDX;
      if (needIdx) { loadIdx().then(apply); return; }
      var hits = q.trim() ? search(q) : null, rank = {};
      if (hits) hits.forEach(function (h, i) { rank[h.i] = i + 1; });
      var shown = 0;
      cards.forEach(function (c) {
        var d = c.dataset, ok = (!f.cat.length || f.cat.indexOf(d.cat) > -1) && (!f.brand.length || f.brand.indexOf(d.brand) > -1) && (!f.type.length || f.type.indexOf(d.type) > -1) && (!hits || rank[d.id]);
        c.hidden = !ok; if (ok) shown++;
      });
      var sort = $('#f-sort') ? $('#f-sort').value : 'rel';
      var ordered = cards.slice();
      if (sort === 'az') ordered.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name, L); });
      else if (hits) ordered.sort(function (a, b) { return (rank[a.dataset.id] || 9999) - (rank[b.dataset.id] || 9999); });
      ordered.forEach(function (c) { grid.appendChild(c); });
      $('#f-count').textContent = shown + ' ' + t.items; $('#grid-empty').hidden = shown > 0;
    }
    $('#filters').addEventListener('change', function (e) { var c = e.target; if (c.dataset && c.dataset.g) { var a = f[c.dataset.g]; if (c.checked) a.push(c.value); else a.splice(a.indexOf(c.value), 1); apply(); } });
    if (fq) fq.addEventListener('input', function () { q = fq.value; apply(); });
    var so = $('#f-sort'); if (so) so.addEventListener('change', apply);
    $('#f-clear').addEventListener('click', function () { f = { cat: [], brand: [], type: [] }; q = ''; if (fq) fq.value = ''; $$('#filters input[type=checkbox]').forEach(function (c) { c.checked = false; }); apply(); });
    $('#f-toggle').addEventListener('click', function () { $('#filters').classList.toggle('open'); });
    if (q) apply();
  }

  /* ---------- ürün sayfası ---------- */
  function bindProduct() {
    var pd = $('.pd'); if (!pd) return; var qi = $('#pd-qty');
    $$('[data-step]').forEach(function (b) { b.addEventListener('click', function () { qi.value = Math.max(1, (parseInt(qi.value, 10) || 1) + parseInt(b.dataset.step, 10)); }); });
    $('#pd-add').addEventListener('click', function (e) { fly(e.currentTarget); add(infoFrom(pd), qi.value); setTimeout(openCart, 450); });
    function show(id) { $$('.ptabs [data-tab]').forEach(function (b) { var on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); $$('.tabpane').forEach(function (s) { s.hidden = s.id !== 'tab-' + id; }); }
    $$('.ptabs [data-tab]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.tab); }); });
    $$('[data-goto]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); show(a.dataset.goto); $('.ptabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
    var main = $('#gal-main'), tpl = $('#dimtpl');
    $$('.thumb').forEach(function (th) {
      th.addEventListener('click', function () {
        $$('.thumb').forEach(function (x) { x.classList.toggle('on', x === th); });
        if (th.dataset.view === 'dim') { main.classList.add('dimview'); main.innerHTML = tpl ? tpl.innerHTML : ''; }
        else { main.classList.remove('dimview'); main.innerHTML = '<img src="' + th.dataset.src + '" alt="">'; }
      });
    });
  }

  /* ---------- teklif sayfası ---------- */
  function bindQuote() {
    var root = $('#quote-root'); if (!root) return;
    var box = $('#q-lines'), lead = $('#q-lead');
    function waText() { return (t.waList || 'Merhaba, aşağıdaki ürünler için teklif rica ediyorum:') + '\n' + cart.map(function (l) { return '- ' + l.name + (l.code ? ' (' + l.code + ')' : '') + ' × ' + l.qty + (l.note ? ' – ' + l.note : ''); }).join('\n'); }
    function render() {
      box.innerHTML = cart.length ? cart.map(function (l) {
        return '<div class="qline"><a class="th" href="' + esc(l.url) + '"><img src="' + esc(l.img) + '" alt=""></a><div style="min-width:0"><b>' + esc(l.name) + '</b><span class="mono">' + esc(l.code) + '</span><input class="note" data-note="' + esc(l.id) + '" value="' + esc(l.note) + '" placeholder="' + esc(t.notePer) + '"></div><div class="ctl"><div class="qty small"><button type="button" data-q="' + esc(l.id) + '" data-d="-1">−</button><input type="number" min="1" value="' + l.qty + '" data-qi="' + esc(l.id) + '"><button type="button" data-q="' + esc(l.id) + '" data-d="1">+</button></div><button class="x" type="button" data-rm="' + esc(l.id) + '">' + ICON.trash + '</button></div></div>';
      }).join('') : '<div class="empty">' + esc(lead.dataset.empty) + '</div>';
      lead.textContent = lead.dataset.full;
      $('#wa-cart').href = 'https://wa.me/' + S.wa + '?text=' + encodeURIComponent(waText());
      $$('[data-note]', box).forEach(function (i) { i.addEventListener('input', function () { var l = cart.filter(function (x) { return x.id === i.dataset.note; })[0]; if (l) { l.note = i.value; save(); $('#wa-cart').href = 'https://wa.me/' + S.wa + '?text=' + encodeURIComponent(waText()); } }); });
    }
    render(); window.__rq = render;
    var form = $('#qform');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var ok = true, first = null;
      function chk(id, test) { var el = $('#' + id), fld = el.closest('.field'), g = test(el.value.trim()); fld.classList.toggle('err', !g); if (!g && !first) first = el; ok = ok && g; }
      chk('f-firma', function (v) { return v.length > 1; }); chk('f-ad', function (v) { return v.length > 2; }); chk('f-tel', function (v) { return v.replace(/\D/g, '').length >= 10; }); chk('f-mail', function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); });
      var kv = $('#f-kvkk').checked; $('#kvkk-err').classList.toggle('err', !kv); ok = ok && kv;
      if (first) first.focus();
      if (ok && !cart.length && !$('#f-not').value.trim()) { toast(lead.dataset.empty, true); ok = false; }
      if (!ok) return;
      var d = new Date(), no = 'SFX-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.floor(1000 + Math.random() * 9000);
      var lines = cart.map(function (l, i) { return (i + 1) + ') ' + l.name + (l.code ? ' [' + l.code + ']' : '') + ' × ' + l.qty + (l.note ? ' — Not: ' + l.note : '') + '\n   ' + location.origin + '/urun/' + l.id; }).join('\n');
      var payload = { access_key: S.w3f, subject: 'Teklif talebi ' + no + ' — ' + $('#f-firma').value.trim() + ' (' + cart.length + ' kalem)', from_name: 'Sofilx web sitesi', replyto: $('#f-mail').value.trim(), 'Takip no': no, 'Firma': $('#f-firma').value.trim(), 'Ad soyad': $('#f-ad').value.trim(), 'Telefon': $('#f-tel').value.trim(), 'E-posta': $('#f-mail').value.trim(), 'Şehir': $('#f-sehir').value, 'Teslimat': $('#f-teslim').value, 'Dil': L.toUpperCase(), 'Ürünler': lines || '-', 'Not': $('#f-not').value.trim() || '-', botcheck: form.botcheck.checked };
      var btn = $('#q-submit'), msg = $('#form-msg'); btn.disabled = true; btn.textContent = t.sending; msg.hidden = true;
      if (!S.w3f) { btn.disabled = false; btn.textContent = t.submit; msg.textContent = t.failMsg; msg.hidden = false; return; }
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); }).then(function (j) {
          if (!j.success) throw new Error(j.message || 'fail');
          if (window.dataLayer) window.dataLayer.push({ event: 'quote_submit', lines: cart.length });
          cart = []; save(); root.hidden = true; $('#q-trk').textContent = no; $('#q-ok').hidden = false; lead.textContent = ''; window.scrollTo(0, 0);
        }).catch(function () { btn.disabled = false; btn.textContent = t.submit; msg.textContent = t.failMsg; msg.hidden = false; });
    });
  }

  /* ---------- çerez onayı ---------- */
  var CK = 'sofilx-consent';
  function loadGTM() {
    if (!S.gtm || window.__gtm) return; window.__gtm = 1; window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + S.gtm; document.head.appendChild(s);
  }
  function cookies() {
    var bar = $('#cookiebar'), c = store.get(CK, null);
    if (c === 'all') loadGTM(); else if (!c) bar.hidden = false;
    $('#ck-accept').addEventListener('click', function () { store.set(CK, 'all'); bar.hidden = true; loadGTM(); });
    $('#ck-reject').addEventListener('click', function () { store.set(CK, 'necessary'); bar.hidden = true; });
    var op = $('#cookie-open'); if (op) op.addEventListener('click', function () { bar.hidden = false; });
  }

  /* ---------- genel ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]');
    if (a) { e.preventDefault(); var card = a.closest('.card'); if (card) { if (!inCart(card.dataset.id)) fly(a); add(infoFrom(card), 1); } return; }
    var q = e.target.closest('[data-q]');
    if (q) { var l = cart.filter(function (x) { return x.id === q.dataset.q; })[0]; if (l) { l.qty = Math.max(1, l.qty + parseInt(q.dataset.d, 10)); save(); $$('[data-qi="' + l.id + '"]').forEach(function (i) { i.value = l.qty; }); } return; }
    var r = e.target.closest('[data-rm]');
    if (r) { cart = cart.filter(function (x) { return x.id !== r.dataset.rm; }); save(); if ($('#drawer').classList.contains('on')) drawDrawer(); if (window.__rq) window.__rq(); return; }
    if (e.target.closest('#keep')) { closeCart(); return; }
    var c = e.target.closest('[data-copy]');
    if (c) { var v = c.dataset.copy; try { navigator.clipboard.writeText(v).then(function () { toast(t.copied + ': ' + v, true); }, function () { toast(v, true); }); } catch (er) { toast(v, true); } return; }
    var aa = e.target.closest('#add-all');
    if (aa) { var n = 0; $$('.card').forEach(function (cd) { if (aa.dataset.ids.split(',').indexOf(cd.dataset.id) > -1 && !inCart(cd.dataset.id)) { cart.push({ id: cd.dataset.id, name: cd.dataset.name, code: cd.dataset.code, img: cd.dataset.img, url: cd.dataset.url, qty: 1, note: '' }); n++; } }); save(); toast(n + ' · ' + t.added); if (n) openCart(); }
  });
  document.addEventListener('change', function (e) { var i = e.target.closest && e.target.closest('[data-qi]'); if (i) { var l = cart.filter(function (x) { return x.id === i.dataset.qi; })[0]; if (l) { l.qty = Math.max(1, parseInt(i.value, 10) || 1); i.value = l.qty; save(); } } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCart(); var sp = $('#searchpanel'); if (sp) sp.hidden = true; } });
  window.addEventListener('storage', function (e) { if (e.key === KEY) { cart = store.get(KEY, []); badge(); if (window.__rq) window.__rq(); } });

  $('#open-cart').addEventListener('click', openCart);
  $('#close-cart').addEventListener('click', closeCart);
  $('#scrim').addEventListener('click', closeCart);
  $('#toast-b').addEventListener('click', function () { $('#toast').classList.remove('on'); openCart(); });
  $('#menu-btn').addEventListener('click', function () { $('#mnav').classList.toggle('open'); });
  $('#search-btn').addEventListener('click', function () { var sp = $('#searchpanel'), b = $('#search-btn'); sp.hidden = !sp.hidden; b.setAttribute('aria-expanded', String(!sp.hidden)); if (!sp.hidden) $('#q-top').focus(); });
  var p = location.pathname;
  $$('nav.main [data-nav]').forEach(function (a) { var h = a.getAttribute('href'); if (h !== '/' && h !== '/en' && p.indexOf(h) === 0) a.classList.add('on'); });
  if (/^\/(en\/)?(urun|product)/.test(p)) { var mb = $('.mega-btn'); if (mb) mb.classList.add('on'); }
  bindSearch($('#q-top'), $('#res-top'));
  bindSearch($('#q-hero'), $('#res-hero'));
  var hf = $('#hero-form'); if (hf) hf.addEventListener('submit', function (e) { e.preventDefault(); var v = $('#q-hero').value.trim(); if (v) goList(v); });
  $$('[data-try]').forEach(function (b) { b.addEventListener('click', function () { var i = $('#q-hero'); i.value = b.dataset.try; i.focus(); i.dispatchEvent(new Event('input')); }); });
  bindListing(); bindProduct(); bindQuote(); cookies(); badge();
})();
/* dil menüsü */
(function () {
  var b = document.getElementById('lang-btn'), m = document.getElementById('lang-menu'); if (!b || !m) return;
  function set(o) { m.hidden = !o; b.setAttribute('aria-expanded', String(o)); }
  b.addEventListener('click', function (e) { e.stopPropagation(); set(m.hidden); });
  document.addEventListener('click', function (e) { if (!m.hidden && !m.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) { set(false); b.focus(); } });
})();
