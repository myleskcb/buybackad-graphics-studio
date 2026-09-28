/* Design console. Talks to flags.js for the switches and to the studio iframe
   (same origin) for what actually ran. No framework, no build step, no inline
   script, so it lives happily under the site's CSP. */
(function () {
  'use strict';
  var F = window.PGFX_FLAGS;
  var $ = function (id) { return document.getElementById(id); };

  if (!F) {
    document.body.innerHTML = '<p style="padding:24px">flags.js did not load; the console has nothing to edit.</p>';
    return;
  }

  /* ── theme, same key the studio uses so the two agree ─────────────── */
  var root = document.documentElement;
  try { root.setAttribute('data-theme', localStorage.getItem('pgfx_theme') === 'light' ? 'light' : 'dark'); } catch (e) {}
  $('theme').onclick = function () {
    var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('pgfx_theme', t); } catch (e) {}
  };

  /* ── tabs ─────────────────────────────────────────────────────────── */
  var tabs = document.querySelectorAll('.tabs button');
  tabs.forEach(function (b) {
    b.onclick = function () {
      tabs.forEach(function (x) { x.classList.toggle('active', x === b); });
      document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane-' + b.dataset.tab); });
      try { localStorage.setItem('pgfx_console_tab', b.dataset.tab); } catch (e) {}
    };
  });
  try {
    var savedTab = localStorage.getItem('pgfx_console_tab');
    tabs.forEach(function (b) { if (b.dataset.tab === savedTab) b.click(); });
  } catch (e) {}

  /* ── switches ─────────────────────────────────────────────────────── */
  var GROUPS = [
    ['build', 'Built into the library', 'Run once while the 243 templates are constructed.'],
    ['chain', 'Template pass chain', 'Run in this order over every template after the library is built.'],
    ['ui', 'Studio UI', 'Not design passes; product surfaces with a design opinion in them.'],
  ];

  function renderFlags() {
    var host = $('flag-groups');
    host.innerHTML = '';
    GROUPS.forEach(function (g) {
      var items = F.registry.filter(function (f) { return f.group === g[0]; });
      if (!items.length) return;
      var wrap = document.createElement('div');
      wrap.className = 'group';
      var h = document.createElement('h2');
      h.innerHTML = g[1] + ' <span class="n">' + items.length + '</span>';
      h.title = g[2];
      wrap.appendChild(h);
      items.forEach(function (f) { wrap.appendChild(renderFlag(f)); });
      host.appendChild(wrap);
    });
    renderDiff();
  }

  function renderFlag(f) {
    var v = F.get(f.id);
    var row = document.createElement('div');
    row.className = 'flag' + (v !== f.def ? ' changed' : '');
    row.dataset.id = f.id;
    var name = document.createElement('div');
    name.className = 'name';
    name.textContent = f.label;
    if (f.rule && f.rule !== '—') {
      var r = document.createElement('span');
      r.className = 'rule'; r.textContent = 'rule ' + f.rule; r.title = 'DESIGN-LAW.md rule ' + f.rule;
      name.appendChild(r);
    }
    var desc = document.createElement('div');
    desc.className = 'desc'; desc.textContent = f.desc;
    var ctl = document.createElement('div');
    ctl.className = 'ctl';
    if (f.type === 'choice') {
      var sel = document.createElement('select');
      sel.className = 'choice';
      f.options.forEach(function (o) {
        var op = document.createElement('option');
        op.value = o[0]; op.textContent = o[1]; op.selected = o[0] === v;
        sel.appendChild(op);
      });
      sel.onchange = function () { setFlag(f, sel.value); };
      ctl.appendChild(sel);
    } else {
      var sw = document.createElement('button');
      sw.className = 'sw'; sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', String(!!v));
      sw.setAttribute('aria-label', f.label);
      sw.onclick = function () { setFlag(f, sw.getAttribute('aria-checked') !== 'true'); };
      ctl.appendChild(sw);
    }
    row.appendChild(name); row.appendChild(ctl); row.appendChild(desc);
    return row;
  }

  function setFlag(f, v) {
    F.set(f.id, v);
    var row = document.querySelector('.flag[data-id="' + f.id + '"]');
    if (row) {
      var nv = F.get(f.id);
      row.classList.toggle('changed', nv !== f.def);
      var sw = row.querySelector('.sw'); if (sw) sw.setAttribute('aria-checked', String(!!nv));
      var sel = row.querySelector('select'); if (sel) sel.value = nv;
    }
    renderDiff();
    scheduleReload();
  }

  function renderDiff() {
    var o = F.overrides(), n = Object.keys(o).length;
    var el = $('diff');
    el.textContent = n ? n + ' switch' + (n === 1 ? '' : 'es') + ' off shipped' : 'shipped configuration';
    el.className = 'pill' + (n ? ' warn' : ' good');
  }

  /* ── presets ──────────────────────────────────────────────────────── */
  var CHAIN = F.registry.filter(function (f) { return f.group === 'chain' && f.type !== 'choice'; }).map(function (f) { return f.id; });
  var COLOUR = ['tameAccents', 'applyColourFix', 'colourTheory', 'enrichFills', 'inkVsWash', 'highlightBudget', 'warmTheWhites', 'enforceInkOnPlate'];
  var PRESETS = [
    ['Shipped', function () { F.reset(); }],
    ['Authored only', function () {
      F.reset(); CHAIN.forEach(function (id) { if (id !== 'completeTemplate') F.set(id, false); });
      F.set('houseType', false); F.set('tameAccents', false); F.set('applyColourFix', false);
    }, 'Just the layouts as written plus their photograph. Everything procedural off.'],
    ['No colour work', function () { F.reset(); COLOUR.forEach(function (id) { F.set(id, false); }); },
      'Layout and type passes on, every pass that decides a colour off.'],
    ['All photo', function () { F.reset(); F.set('styleForce', 'photo'); }],
    ['All duotone', function () { F.reset(); F.set('styleForce', 'duotone'); }],
    ['All wash', function () { F.reset(); F.set('styleForce', 'wash'); }],
    ['No cutouts / icons', function () { F.reset(); F.set('addProductCutout', false); F.set('applyCategoryMarks', false); }],
  ];
  PRESETS.forEach(function (p) {
    var b = document.createElement('button');
    b.className = 'btn'; b.textContent = p[0]; if (p[2]) b.title = p[2];
    b.onclick = function () { p[1](); renderFlags(); scheduleReload(); };
    $('presets').appendChild(b);
  });

  /* ── header actions ───────────────────────────────────────────────── */
  $('reset').onclick = function () { F.reset(); renderFlags(); scheduleReload(); };
  function studioUrl() {
    var q = F.toQuery();
    return 'index.html' + (q ? '?flags=' + encodeURIComponent(q) : '');
  }
  $('open-studio').onclick = function () { window.open(studioUrl(), '_blank', 'noopener'); };
  $('copy-link').onclick = function () {
    var q = F.toQuery();
    var url = location.origin + location.pathname.replace(/console\.html$/, 'index.html') + (q ? '?flags=' + encodeURIComponent(q) : '');
    var done = function (ok) {
      var b = $('copy-link'), t = b.textContent;
      b.textContent = ok ? 'Copied' : url;
      setTimeout(function () { b.textContent = t; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
    else done(false);
  };

  /* ── preview ──────────────────────────────────────────────────────── */
  var frame = $('frame'), preview = $('preview'), state = $('preview-state');
  var reloadTimer = null, bootPoll = null;
  function scheduleReload() {
    clearTimeout(reloadTimer);
    preview.classList.add('busy');
    state.textContent = 'rebuilding…';
    reloadTimer = setTimeout(reload, 350);
  }
  function reload() {
    clearInterval(bootPoll);
    preview.classList.add('busy');
    state.textContent = 'rebuilding…';
    // cache-bust the document only; app.js and the art stay cached
    frame.src = $('scope').value.replace('#', '?c=' + Date.now() + '#').replace(/^index\.html$/, 'index.html?c=' + Date.now());
  }
  $('scope').onchange = reload;
  $('reload').onclick = reload;
  frame.addEventListener('load', function () {
    var tries = 0;
    clearInterval(bootPoll);
    bootPoll = setInterval(function () {
      var w = frame.contentWindow, c = null;
      try { c = w && w.PGFX_CONSOLE; } catch (e) {}
      tries++;
      if (c || tries > 60) {
        clearInterval(bootPoll);
        preview.classList.remove('busy');
        if (c) { renderRun(c); state.textContent = c.templates + ' templates · ' + c.passes.filter(function (p) { return p.ran; }).length + '/' + c.passes.length + ' passes ran'; }
        else state.textContent = 'preview booted but exposed no summary (old app.js cached?)';
      }
    }, 100);
  });

  function renderRun(c) {
    $('build').textContent = 'build ' + c.build;
    var st = $('stats'); st.innerHTML = '';
    var stat = function (b, s) { var d = document.createElement('div'); d.className = 'stat'; d.innerHTML = '<b>' + b + '</b><span>' + s + '</span>'; st.appendChild(d); };
    stat(c.templates, 'templates');
    Object.keys(c.styles || {}).sort().forEach(function (k) { stat(c.styles[k], k); });
    stat(c.cutouts, 'with a cutout');
    var total = c.passes.reduce(function (a, p) { return a + p.ms; }, 0);
    stat(Math.round(total), 'ms in passes');
    var tb = $('run-rows'); tb.innerHTML = '';
    c.passes.forEach(function (p) {
      var tr = document.createElement('tr');
      tr.className = p.ran ? '' : 'off';
      tr.innerHTML = '<td>' + p.id + '</td><td class="num">' + (p.ran ? (p.touched || '·') : '—') + '</td><td class="num">' + (p.ran ? p.ms : '—') + '</td>';
      tb.appendChild(tr);
    });
  }

  /* ── markdown panes ───────────────────────────────────────────────── */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, function (_, c) { return '<code>' + c + '</code>'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\b(OPEN|DECIDED|PROPOSED|DONE|BLOCKED)\b(?=\s*[—:-])/g, '<span class="status">$1</span>');
    return s;
  }
  /* Enough Markdown for the two logs: headings, lists, tables, code fences,
     quotes, rules, paragraphs. Not a general renderer and does not try to be. */
  function md(src) {
    var lines = src.replace(/\r/g, '').split('\n'), out = [], i = 0, para = [];
    var flush = function () { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
    while (i < lines.length) {
      var L = lines[i];
      if (/^```/.test(L)) { flush(); var code = []; i++; while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]); i++; out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); continue; }
      var h = /^(#{1,6})\s+(.*)$/.exec(L);
      if (h) { flush(); out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); i++; continue; }
      if (/^\s*---+\s*$/.test(L)) { flush(); out.push('<hr>'); i++; continue; }
      if (/^>/.test(L)) { flush(); var q = []; while (i < lines.length && /^>/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, '')); out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>'); continue; }
      if (/^\|/.test(L)) {
        flush(); var rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        var cells = function (r) { return r.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); };
        var html = '<table><thead><tr>' + cells(rows[0]).map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        rows.slice(2).forEach(function (r) { html += '<tr>' + cells(r).map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; });
        out.push(html + '</tbody></table>'); continue;
      }
      var li = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(L);
      if (li) {
        flush(); var ordered = /\d/.test(li[2]); var items = [];
        while (i < lines.length) {
          var m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
          if (m) { items.push(m[3]); i++; }
          else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i++; }
          else break;
        }
        out.push('<' + (ordered ? 'ol' : 'ul') + '>' + items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</' + (ordered ? 'ol' : 'ul') + '>');
        continue;
      }
      if (!L.trim()) { flush(); i++; continue; }
      para.push(L.trim()); i++;
    }
    flush();
    return out.join('\n');
  }
  function loadDoc(file, paneId, after) {
    fetch(file + '?c=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (txt) {
      $(paneId).innerHTML = md(txt);
      if (after) after(txt);
    }).catch(function (e) {
      $(paneId).innerHTML = '<p class="hint">Could not load <code>' + file + '</code> (' + esc(String(e.message || e)) + '). It is in the repo root; if this is the deployed site, the file may be blocked by a redirect in netlify.toml.</p>';
    });
  }
  loadDoc('CHANGELOG.md', 'pane-changelog');
  loadDoc('OPEN-QUESTIONS.md', 'pane-questions', function (txt) {
    var open = (txt.match(/^\*\*Status:\*\*\s*OPEN/gm) || []).length;
    $('q-count').textContent = open ? String(open) : '';
  });

  /* ── go ───────────────────────────────────────────────────────────── */
  renderFlags();
  reload();
})();
