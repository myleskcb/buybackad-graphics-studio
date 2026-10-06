/* BUYBACK.AD library picker, for iPhones LA's listing page.

   A panel beside the title and description: the library's ads (the finished
   ads approved into the BUYBACK.AD library, the shop's number on them), a
   search, a category, an order (the library's own, newest upload first,
   oldest first), a grid, More. Each tile says when the ad was uploaded.
   Picking one hands the page the full-size ad as a JPEG File (1080x1080), as
   if it had been uploaded, so the page's own photo list takes it without
   knowing where it came from. The File is named for the ad and its upload
   day (bubblePop-nn05-30_2026-10-04.jpg) and dated with its upload
   (lastModified), and the JPEG's own EXIF carries the same dates, so the
   picture identifies itself wherever it goes.

   It talks only to iPhones LA's own server (the routes below), never to
   BUYBACK.AD: the key stays on the server.

     <div id="bbl"></div>
     <script src="/static/library-picker.js"></script>
     <script>
       BuybackadPicker.mount(document.getElementById('bbl'), {
         endpoint: '/api/buybackad-library',
         onPick: ({ ad, file }) => addListingPhoto(file),   // the page's own upload path
       });
     </script>

   The routes it calls (README.md, "The iPhones LA routes"):
     GET {endpoint}/categories
     GET {endpoint}/ads?category=&q=&since=&sort=&limit=&offset=
     GET {endpoint}/jpeg/{ad id}          the ad as a listing JPEG

   Also fires `buybackad:pick` on the element, detail { ad, file }.
   Every string from the library is set as text, never as markup. */
(function(){
  'use strict';
  const CSS = `
.bbl{--bbl-ink:#16151a;--bbl-mut:#6b6875;--bbl-line:#dcd9e3;--bbl-bg:#fff;--bbl-acc:#2b59ff;font:14px/1.4 system-ui,-apple-system,sans-serif;color:var(--bbl-ink);background:var(--bbl-bg);border:1px solid var(--bbl-line);border-radius:14px;padding:12px}
@media (prefers-color-scheme:dark){.bbl{--bbl-ink:#f1eff8;--bbl-mut:#a19cb3;--bbl-line:#34303f;--bbl-bg:#17151f;--bbl-acc:#8aa4ff}}
.bbl h3{margin:0 0 8px;font-size:15px}
.bbl-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.bbl-bar input,.bbl-bar select{flex:1 1 140px;min-width:0;border:1px solid var(--bbl-line);border-radius:8px;padding:7px 9px;font:inherit;background:transparent;color:inherit}
.bbl button{font:inherit;cursor:pointer;border:1px solid var(--bbl-line);background:transparent;color:inherit;border-radius:999px;padding:6px 11px}
.bbl button:focus-visible{outline:3px solid var(--bbl-acc);outline-offset:2px}
.bbl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.bbl .bbl-tile{display:flex;flex-direction:column;gap:4px;border:1px solid var(--bbl-line);border-radius:10px;padding:5px;background:transparent;text-align:left}
.bbl-tile img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;background:rgba(127,127,127,.12)}
.bbl-tile span{font-size:11.5px;color:var(--bbl-mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbl-tile time{font-size:11px;color:var(--bbl-mut)}
.bbl-tile[aria-busy="true"]{opacity:.5}
.bbl-status{color:var(--bbl-mut);font-size:13px;margin:8px 0 0;min-height:1.4em}
.bbl-more{margin-top:8px;width:100%}`;
  let styled = false;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const safe = u => { try { const x = new URL(u, location.href); return x.protocol === 'https:' || x.hostname === 'localhost' || x.hostname === '127.0.0.1'; } catch (e){ return false; } };

  function mount(root, opts){
    opts = opts || {};
    const endpoint = String(opts.endpoint || '/api/buybackad-library').replace(/\/$/, '');
    const pageSize = Math.max(6, Math.min(60, opts.pageSize || 24));
    if (!styled){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
    root.classList.add('bbl'); root.textContent = '';
    root.appendChild(el('h3', null, opts.title || 'BUYBACK.AD library'));
    const bar = el('div', 'bbl-bar');
    const q = el('input'); q.type = 'search'; q.placeholder = 'Search: iphone, gold, pokemon…'; q.setAttribute('aria-label', 'Search the library');
    const cat = el('select'); cat.setAttribute('aria-label', 'Category');
    const order = el('select'); order.setAttribute('aria-label', 'Order');
    [['', 'Library order'], ['newest', 'Newest upload first'], ['oldest', 'Oldest first']].forEach(([v, t]) => { const o = el('option', null, t); o.value = v; order.appendChild(o); });
    bar.append(q, cat, order);
    const grid = el('div', 'bbl-grid');
    const status = el('p', 'bbl-status'); status.setAttribute('aria-live', 'polite');
    const more = el('button', 'bbl-more', 'More'); more.type = 'button'; more.hidden = true;
    root.append(bar, grid, status, more);

    let offset = 0, gen = 0, cats = {};
    const get = async path => {
      const r = await fetch(endpoint + path, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || ('library ' + r.status));
      return r.json();
    };
    const fillCats = () => {
      const keep = cat.value;
      cat.textContent = '';
      const all = el('option', null, 'All categories'); all.value = ''; cat.appendChild(all);
      Object.keys(cats).sort().forEach(c => { const o = el('option', null, c + ' (' + cats[c] + ')'); o.value = c; cat.appendChild(o); });
      if (keep && cats[keep]) cat.value = keep;              // the categories can land after a choice was made
    };

    /* the upload day, for the tile and the file name; a date the library did not give stays blank */
    const day = ad => /^\d{4}-\d{2}-\d{2}/.test(ad.uploaded || '') ? ad.uploaded.slice(0, 10) : '';
    const when = ad => { const d = day(ad); if (!d) return ''; try { return new Date(ad.uploaded).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e){ return d; } };
    const fileName = ad => ad.id + (day(ad) ? '_' + day(ad) : '') + '.jpg';
    async function pick(ad, tile){
      tile.setAttribute('aria-busy', 'true'); status.textContent = 'Getting ' + ad.title + '…';
      try {
        const r = await fetch(endpoint + '/jpeg/' + encodeURIComponent(ad.id), { credentials: 'same-origin' });
        if (!r.ok) throw new Error('picture ' + r.status);
        const stamp = Date.parse(ad.uploaded || '');
        const file = new File([await r.blob()], fileName(ad), Object.assign({ type: 'image/jpeg' }, isNaN(stamp) ? {} : { lastModified: stamp }));
        status.textContent = 'Added ' + ad.title + '.';
        if (typeof opts.onPick === 'function') opts.onPick({ ad, file });
        root.dispatchEvent(new CustomEvent('buybackad:pick', { detail: { ad, file }, bubbles: true }));
      } catch (e){ status.textContent = 'That ad could not be added (' + e.message + ').'; }
      finally { tile.removeAttribute('aria-busy'); }
    }

    function tile(ad){
      const b = el('button', 'bbl-tile'); b.type = 'button'; b.title = ad.title + ': add it to the listing';
      const img = el('img'); img.loading = 'lazy'; img.decoding = 'async'; img.alt = ad.title;
      if (ad.thumb && safe(ad.thumb.url)) img.src = ad.thumb.url;
      b.append(img, el('span', null, ad.title));
      if (day(ad)){ const t = el('time', null, 'Uploaded ' + when(ad)); t.dateTime = ad.uploaded; b.appendChild(t); }
      b.addEventListener('click', () => pick(ad, b));
      return b;
    }

    async function load(fresh){
      const my = ++gen;
      if (fresh){ offset = 0; grid.textContent = ''; }
      status.textContent = 'Loading…'; more.hidden = true;
      const p = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
      if (q.value.trim()) p.set('q', q.value.trim());
      if (cat.value) p.set('category', cat.value);
      if (order.value) p.set('sort', order.value);
      try {
        const page = await get('/ads?' + p);
        if (my !== gen) return;
        page.items.forEach(ad => grid.appendChild(tile(ad)));
        offset = page.next_offset == null ? offset : page.next_offset;
        more.hidden = page.next_offset == null;
        status.textContent = page.total ? page.total + ' ads: pick one to add it to the listing' : 'No ad matches.';
      } catch (e){ if (my === gen) status.textContent = 'The library did not answer (' + e.message + ').'; }
    }

    let t = 0;
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => load(true), 300); });
    cat.addEventListener('change', () => load(true));
    order.addEventListener('change', () => load(true));
    more.addEventListener('click', () => load(false));
    get('/categories').then(c => { cats = c.categories || {}; fillCats(); }).catch(() => fillCats());
    fillCats(); load(true);
    return { reload: () => load(true) };
  }

  window.BuybackadPicker = { mount };
})();
