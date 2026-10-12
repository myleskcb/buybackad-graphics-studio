/* iPhones.LA Web Kit: the little behaviour the components need. One classic
   script, no dependencies. LAKit.mount(root) wires everything under root:
   [data-wk-single] groups of aria-pressed buttons (one at a time),
   role=radiogroup check lists, and rows with data-qty and a stepper.
   Each fires a bubbling "wk:change" event a page listens to for its totals.
   [data-wk-count="330"] counts an amount up from $0 when it comes into view;
   [data-wk-confetti] throws confetti once when it comes into view, and
   LAKit.confetti(el) throws it on demand. Both stay still under reduced motion. */
window.LAKit = (function () {
  function usd(n) { return '$' + Number(n).toLocaleString('en-US'); }
  function fire(el, detail) { el.dispatchEvent(new CustomEvent('wk:change', { bubbles: true, detail: detail || {} })); }
  function single(group) {
    group.addEventListener('click', function (e) {
      var b = e.target.closest('[aria-pressed]');
      if (!b || !group.contains(b)) return;
      group.querySelectorAll('[aria-pressed]').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      fire(group, { value: b.getAttribute('data-value') || b.textContent.trim() });
    });
  }
  function radios(group) {
    function pick(r) {
      group.querySelectorAll('[role="radio"]').forEach(function (o) { o.setAttribute('aria-checked', o === r ? 'true' : 'false'); o.tabIndex = o === r ? 0 : -1; });
      fire(group, { value: r.getAttribute('data-value') });
    }
    group.addEventListener('click', function (e) { var r = e.target.closest('[role="radio"]'); if (r) pick(r); });
    group.addEventListener('keydown', function (e) {
      var r = e.target.closest('[role="radio"]');
      if (r && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); pick(r); }
    });
  }
  function stepper(row) {
    var out = row.querySelector('[data-qty-out]');
    function set(q) { row.setAttribute('data-qty', String(Math.max(0, Math.min(999, q)))); if (out) out.textContent = row.getAttribute('data-qty'); fire(row); }
    var dec = row.querySelector('[data-step="-1"]'), inc = row.querySelector('[data-step="1"]');
    if (dec) dec.addEventListener('click', function () { set(+row.getAttribute('data-qty') - 1); });
    if (inc) inc.addEventListener('click', function () { set(+row.getAttribute('data-qty') + 1); });
  }
  function calm() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function whenSeen(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(el); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(el); } }); }, { threshold: 0.5 });
    io.observe(el);
  }
  function countUp(el) {
    var to = +el.getAttribute('data-wk-count'), pre = el.getAttribute('data-wk-prefix') || '';
    function show(v) { el.textContent = pre + usd(Math.round(v)); }
    if (calm()) { show(to); return; }
    el.classList.add('wk-count'); el.classList.remove('is-done'); show(0);
    var dur = Math.min(1600, 800 + to / 25), t0 = null;  /* $330 in about .8s, $10,200 in about 1.2s */
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      show(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step); else { el.classList.add('is-done'); fire(el, { value: to }); }
    }
    requestAnimationFrame(step);
  }
  function confetti(target) {
    if (calm()) return;
    var css = getComputedStyle(document.documentElement);
    var colors = ['--confetti-green', '--confetti-red', '--confetti-yellow', '--confetti-blue'].map(function (n) { return css.getPropertyValue(n).trim() || '#34c759'; });
    var c = document.createElement('canvas'); c.className = 'wk-confetti'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c);
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight, x = c.getContext('2d');
    c.width = W * dpr; c.height = H * dpr; x.scale(dpr, dpr);
    var r = (target || document.body).getBoundingClientRect(), ox = r.left + r.width / 2, oy = Math.min(H * 0.6, Math.max(24, r.top + 32));
    var bits = [];
    for (var i = 0; i < 140; i++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95, v = 6 + Math.random() * 9;
      bits.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: colors[i % 4], dot: Math.random() < 0.3 });
    }
    var t0 = performance.now();
    function frame(t) {
      var age = (t - t0) / 1000;
      x.clearRect(0, 0, W, H);
      x.globalAlpha = Math.max(0, 1 - Math.max(0, age - 1.6) / 0.8);
      bits.forEach(function (b) {
        b.vy += 0.32; b.vx *= 0.985; b.vy *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        x.save(); x.translate(b.x, b.y); x.rotate(b.r); x.fillStyle = b.c;
        if (b.dot) { x.beginPath(); x.arc(0, 0, b.h * 0.8, 0, 6.28); x.fill(); }
        else x.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * (0.4 + 0.6 * Math.abs(Math.cos(b.r * 2))));
        x.restore();
      });
      if (age < 2.4) requestAnimationFrame(frame); else c.remove();
    }
    requestAnimationFrame(frame);
  }
  function mount(root) {
    root = root || document;
    root.querySelectorAll('[data-wk-single]').forEach(single);
    root.querySelectorAll('[role="radiogroup"]').forEach(radios);
    root.querySelectorAll('.wk-row[data-qty]').forEach(stepper);
    root.querySelectorAll('[data-wk-count]').forEach(function (el) { whenSeen(el, countUp); });
    root.querySelectorAll('[data-wk-confetti]').forEach(function (el) { whenSeen(el, confetti); });
  }
  return { mount: mount, usd: usd, countUp: countUp, confetti: confetti };
})();
