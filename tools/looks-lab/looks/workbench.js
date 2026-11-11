(() => {
  // mark the artboard nearest the middle of the wall as the selected one
  const wall = document.querySelector('#hero-wall'); if (!wall) return;
  document.querySelectorAll('.wall-col').forEach(c => { c.style.animationPlayState = 'paused'; });
  const r = wall.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .56;
  let best = null, bd = 1e9;
  wall.querySelectorAll('.wall-card').forEach(c => { const b = c.getBoundingClientRect(); const d = Math.hypot(b.left + b.width / 2 - cx, b.top + b.height / 2 - cy); if (d < bd) { bd = d; best = c; } });
  if (best) best.classList.add('lab-sel');
})();
