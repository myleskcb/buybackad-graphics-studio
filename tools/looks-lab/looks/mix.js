(() => {
  const l = document.createElement('link'); l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Darker+Grotesque:wght@700;800;900&display=swap'; document.head.appendChild(l);
  const bar = document.createElement('div'); bar.className = 'lab-suite';
  bar.innerHTML = '<span class="ls-word">resale<i></i></span><div class="ls-apps">' +
    '<span class="ls-app">Sweep</span><span class="ls-app">Pricing</span><span class="ls-app">CRM</span><span class="ls-app on">Buying ads</span><span class="ls-app">Bulk buying</span></div>' +
    '<span class="ls-right">One workspace for buying and reselling devices</span>';
  document.body.prepend(bar);
  const copy = document.querySelector('.hero-copy');
  if (copy) {
    const w = document.createElement('div'); w.className = 'lab-works';
    w.innerHTML = '<span class="lw-k">Works with</span><span class="lw">SCANS.AD<small>print, post, track every scan</small></span><span class="lw soon">resale. CRM</span>';
    copy.appendChild(w);
  }
})();
