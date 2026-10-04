/* BUYBACK.AD library picker, for iPhones LA's listing page.

   A panel beside the title and description: search, the kinds (Products,
   Scenes, Backgrounds, Ad designs), a category, a grid, More. Picking a
   picture hands the page a ready JPEG File, as if it had been uploaded, so
   the page's own photo list takes it without knowing where it came from.

   It talks only to iPhones LA's own server (the proxy routes, below), never
   to BUYBACK.AD: the key stays on the server.

     <div id="bbl"></div>
     <script src="/static/library-picker.js"></script>
     <script>
       BuybackadPicker.mount(document.getElementById('bbl'), {
         endpoint: '/api/buybackad-library',          // the proxy routes
         onPick: ({ item, file }) => addListingPhoto(file),   // the page's own upload path
       });
     </script>

   The proxy routes it calls (README.md, "The iPhones LA routes"):
     GET {endpoint}/categories
     GET {endpoint}/assets?kind=&category=&q=&limit=&offset=
     GET {endpoint}/ads?category=&q=&limit=&offset=
     GET {endpoint}/jpeg/{asset id}          the picture as a listing JPEG

   Also fires `buybackad:pick` on the element, detail { item, file }.
   Every string from the library is set as text, never as markup. */
(function(){
  'use strict';
  const KINDS = [
    { id: 'cutout', label: 'Products' },
    { id: 'scene', label: 'Scenes' },
    { id: 'background', label: 'Backgrounds' },
    { id: 'ads', label: 'Ad designs' },
  ];
  const CSS = `
.bbl{--bbl-ink:#16151a;--bbl-mut:#6b6875;--bbl-line:#dcd9e3;--bbl-bg:#fff;--bbl-acc:#2b59ff;font:14px/1.4 system-ui,-apple-system,sans-serif;color:var(--bbl-ink);background:var(--bbl-bg);border:1px solid var(--bbl-line);border-radius:14px;padding:12px}
@media (prefers-color-scheme:dark){.bbl{--bbl-ink:#f1eff8;--bbl-mut:#a19cb3;--bbl-line:#34303f;--bbl-bg:#17151f;--bbl-acc:#8aa4ff}}
.bbl h3{margin:0 0 8px;font-size:15px}
.bbl-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.bbl-bar input,.bbl-bar select{flex:1 1 140px;min-width:0;border:1px solid var(--bbl-line);border-radius:8px;padding:7px 9px;font:inherit;background:transparent;color:inherit}
.bbl-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.bbl button{font:inherit;cursor:pointer;border:1px solid var(--bbl-line);background:transparent;color:inherit;border-radius:999px;padding:6px 11px}
.bbl button[aria-pressed="true"]{background:var(--bbl-acc);border-color:var(--bbl-acc);color:#fff}
.bbl button:focus-visible{outline:3px solid var(--bbl-acc);outline-offset:2px}
.bbl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.bbl .bbl-tile{display:flex;flex-direction:column;gap:4px;border:1px solid var(--bbl-line);border-radius:10px;padding:6px;background:transparent;text-align:left}
.bbl-tile img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:6px;background:repeating-conic-gradient(rgba(127,127,127,.18) 0 25%,transparent 0 50%) 0 0/14px 14px}
.bbl-tile span{font-size:11.5px;color:var(--bbl-mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbl-tile[aria-busy="true"]{opacity:.5}
.bbl-status{color:var(--bbl-mut);font-size:13px;margin:8px 0 0;min-height:1.4em}
.bbl-more{margin-top:8px;width:100%}`;
  let styled = false;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const https = u => { try { const x = new URL(u, location.href); return x.protocol === 'https:' || x.hostname === 'localhost' || x.hostname === '127.0.0.1'; } catch (e){ return false; } };

  function mount(root, opts){
    opts = opts || {};
    const endpoint = String(opts.endpoint || '/api/buybackad-library').replace(/\/$/, '');
    const pageSize = Math.max(6, Math.min(60, opts.pageSize || 24));
    if (!styled){ const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); styled = true; }
    root.classList.add('bbl'); root.textContent = '';
    root.appendChild(el('h3', null, opts.title || 'BUYBACK.AD library'));
    const tabs = el('div', 'bbl-tabs'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Kind of picture');
    const bar = el('div', 'bbl-bar');
    const q = el('input'); q.type = 'search'; q.placeholder = 'Search: iphone 15, macbook, cash…'; q.setAttribute('aria-label', 'Search the library');
    const cat = el('select'); cat.setAttribute('aria-label', 'Category');
    bar.append(q, cat);
    const grid = el('div', 'bbl-grid');
    const status = el('p', 'bbl-status'); status.setAttribute('aria-live', 'polite');
    const more = el('button', 'bbl-more', 'More'); more.type = 'button'; more.hidden = true;
    root.append(tabs, bar, grid, status, more);

    let kind = opts.kind || 'cutout', offset = 0, gen = 0, cats = null;
    const get = async path => {
      const r = await fetch(endpoint + path, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || ('library ' + r.status));
      return r.json();
    };
    const fillCats = () => {
      const keep = cat.value;
      cat.textContent = '';
      const counts = !cats ? {} : kind === 'ads' ? cats.ads : (cats.assets[kind] || {});
      const all = el('option', null, 'All categories'); all.value = ''; cat.appendChild(all);
      Object.keys(counts).sort().forEach(c => { const o = el('option', null, c + ' (' + counts[c] + ')'); o.value = c; cat.appendChild(o); });
      if (keep && counts[keep]) cat.value = keep;              // the categories can land after a choice was made
    };
    KINDS.forEach(k => {
      const b = el('button', null, k.label); b.type = 'button'; b.setAttribute('aria-pressed', String(k.id === kind));
      b.addEventListener('click', () => { kind = k.id; tabs.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); fillCats(); load(true); });
      tabs.appendChild(b);
    });

    async function pick(item, tile){
      if (kind === 'ads'){
        // a design is finished in the studio (the number goes on it); its download comes back through the iPhones LA link
        if (https(item.studio_url)) window.open(item.studio_url, '_blank', 'noopener');
        return;
      }
      tile.setAttribute('aria-busy', 'true'); status.textContent = 'Getting ' + item.id + '…';
      try {
        const r = await fetch(endpoint + '/jpeg/' + encodeURIComponent(item.id), { credentials: 'same-origin' });
        if (!r.ok) throw new Error('picture ' + r.status);
        const blob = await r.blob();
        const file = new File([blob], item.id + '.jpg', { type: 'image/jpeg' });
        status.textContent = 'Added ' + item.id + '.';
        if (typeof opts.onPick === 'function') opts.onPick({ item, file });
        root.dispatchEvent(new CustomEvent('buybackad:pick', { detail: { item, file }, bubbles: true }));
      } catch (e){ status.textContent = 'That picture could not be added (' + e.message + ').'; }
      finally { tile.removeAttribute('aria-busy'); }
    }

    function tile(item){
      const b = el('button', 'bbl-tile'); b.type = 'button';
      const src = kind === 'ads' ? item.thumb && item.thumb.url : item.url;
      const img = el('img'); img.loading = 'lazy'; img.decoding = 'async'; img.alt = item.alt || item.title || item.id;
      if (https(src)) img.src = src;
      const label = kind === 'ads' ? (item.title || item.id) : item.id;
      b.title = kind === 'ads' ? 'Open "' + label + '" in the BUYBACK.AD studio to put your number on it' : (item.alt || item.id) + (item.width ? ' · ' + item.width + '×' + item.height : '');
      b.append(img, el('span', null, label));
      b.addEventListener('click', () => pick(item, b));
      return b;
    }

    async function load(fresh){
      const my = ++gen;
      if (fresh){ offset = 0; grid.textContent = ''; }
      status.textContent = 'Loading…'; more.hidden = true;
      const p = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
      if (q.value.trim()) p.set('q', q.value.trim());
      if (cat.value) p.set('category', cat.value);
      if (kind !== 'ads') p.set('kind', kind);
      try {
        const page = await get((kind === 'ads' ? '/ads?' : '/assets?') + p);
        if (my !== gen) return;
        page.items.forEach(it => grid.appendChild(tile(it)));
        offset = page.next_offset == null ? offset : page.next_offset;
        more.hidden = page.next_offset == null;
        status.textContent = page.total ? page.total + ' found' + (kind === 'ads' ? ': pick one to finish it in the studio' : ': pick one to add it to the listing') : 'Nothing found.';
      } catch (e){ if (my === gen) status.textContent = 'The library did not answer (' + e.message + ').'; }
    }

    let t = 0;
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => load(true), 300); });
    cat.addEventListener('change', () => load(true));
    more.addEventListener('click', () => load(false));
    get('/categories').then(c => { cats = c; fillCats(); }).catch(() => fillCats());
    fillCats(); load(true);
    return { reload: () => load(true) };
  }

  window.BuybackadPicker = { mount };
})();
