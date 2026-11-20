/* THE LONG ROWS, FOLDED (DESIGN-LAW 163, 2026-11-19).
   The owner, of the editor's option rows: "Maybe these could just show a few options and then show
   more so it's not all open by default." A row of more than FOLD_AT choices shows its first SHOW and
   the one chosen; a real button after it ("More typefaces (37)") opens the rest in place and closes
   them again (aria-expanded, aria-controls). Shorter rows (Outline, Effect) stay as they are.

   The rows are app.js's and full-ad-studio.js's; this only hides what they draw (.fold-hide) and
   follows the chosen one (.active) wherever it moves: a click, a key (T steps the typefaces), a new
   template, the full ad's form drawn again. The button sits after the row, and after the row's
   held-choice note when it has one (choiceHoldNote keeps that note right under the row; ezTagHost
   puts the headline's sub-panel after both). A row opened stays open for the visit. */
(function(){
  'use strict';
  var ROWS = { 'ez-voices': 'typefaces', 'ed-voices': 'typefaces', 'fa-voices': 'typefaces', 'ez-tag-looks': 'styles', 'ed-tagstyles': 'styles' };
  var SEL = Object.keys(ROWS).map(function(id){ return '#' + id; }).join(',');
  var SHOW = 8, FOLD_AT = 10, open = {};

  function choices(row){ return Array.prototype.filter.call(row.children, function(c){ return c.tagName === 'BUTTON'; }); }
  function place(row, btn){
    var a = row;
    while (a.nextElementSibling && a.nextElementSibling !== btn && a.nextElementSibling.classList.contains('ez-held-note')) a = a.nextElementSibling;
    if (a.nextElementSibling !== btn) a.after(btn);
  }
  function fold(id){
    var row = document.getElementById(id); if (!row) return;
    var all = choices(row), btn = document.getElementById(id + '-more');
    if (all.length <= FOLD_AT){
      all.forEach(function(b){ if (b.classList.contains('fold-hide')) b.classList.remove('fold-hide'); });
      if (btn && !btn.hidden) btn.hidden = true;
      return;
    }
    if (!btn){
      btn = document.createElement('button');
      btn.type = 'button'; btn.id = id + '-more'; btn.className = 'fold-more';
      btn.setAttribute('aria-controls', id);
      btn.addEventListener('click', function(){ open[id] = !open[id]; fold(id); });
    }
    place(row, btn);
    if (btn.hidden) btn.hidden = false;
    var isOpen = !!open[id], hidden = 0;
    all.forEach(function(b, i){
      var hide = !isOpen && i >= SHOW && !b.classList.contains('active');
      if (b.classList.contains('fold-hide') !== hide) b.classList.toggle('fold-hide', hide);
      if (hide) hidden++;
    });
    var expanded = isOpen ? 'true' : 'false';
    if (btn.getAttribute('aria-expanded') !== expanded) btn.setAttribute('aria-expanded', expanded);
    var label = isOpen ? 'Fewer ' + ROWS[id] : 'More ' + ROWS[id] + ' (' + hidden + ')';
    if (btn.textContent !== label) btn.textContent = label;
  }

  var queued = false;
  function foldAll(){ queued = false; Object.keys(ROWS).forEach(fold); }
  function soon(){ if (queued) return; queued = true; (window.queueMicrotask || setTimeout)(foldAll); }
  function touches(rec){
    var t = rec.target;
    if (t.nodeType !== 1) t = t.parentElement;
    if (!t) return false;
    if (t.closest(SEL)) return true;                                   // a choice built, chosen or held
    if (rec.type === 'childList') for (var i = 0; i < rec.addedNodes.length; i++){
      var n = rec.addedNodes[i];
      if (n.nodeType === 1 && (ROWS[n.id] || (n.querySelector && n.querySelector(SEL)))) return true;   // a row drawn again
    }
    return false;
  }
  var mo = new MutationObserver(function(recs){
    for (var i = 0; i < recs.length; i++) if (touches(recs[i])){ soon(); return; }
  });
  ['page-easy', 'page-editor'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  });
  foldAll();
})();
