(() => {
  const bar = document.createElement('div'); bar.className = 'lab-suite';
  bar.innerHTML = '<b>reselling.us</b><div class="ls-apps">' +
    '<a class="ls-app"><i></i>CRM</a><a class="ls-app resale"><i></i>resale. deal desk</a><a class="ls-app"><i></i>SCANS.AD</a><a class="ls-app on"><i></i>Graphics Studio</a></div>' +
    '<span class="ls-right">The apps resellers run on</span>';
  document.body.prepend(bar);
  const ctas = document.querySelector('.hero-ctas'), note = document.querySelector('.hero-note');
  if (ctas) {
    const num = document.createElement('div'); num.className = 'lab-num';
    num.innerHTML = '<label for="lab-n">Your number goes on every design</label><div class="ln-row"><input id="lab-n" value="(562) 999-4994" aria-label="Your phone number"><button type="button">Make my ad</button></div>';
    ctas.replaceWith(num);
    if (note) note.textContent = 'No account needed to design. Or browse the library, or make a video ad.';
  }
  const copy = document.querySelector('.hero-copy');
  if (copy) {
    const w = document.createElement('div'); w.className = 'lab-works';
    w.innerHTML = '<span class="lw-k">Works with</span><span class="lw">SCANS.AD<small>print, post, track every scan</small></span><span class="lw soon">reselling.us CRM</span><span class="lw soon">resale. deal desk</span>';
    copy.appendChild(w);
  }
})();
