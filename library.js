const g=document.getElementById('g'), items=[...g.children], q=document.getElementById('q');
let fk='all', fc=null;
function apply(){
  const t=q.value.trim().toLowerCase();
  items.forEach(el=>{
    const okK = fk==='all' || el.dataset.k===fk;
    const okC = !fc || el.dataset.c===fc;
    const okT = !t || el.dataset.s.includes(t) || el.dataset.c.includes(t);
    el.style.display = (okK&&okC&&okT) ? '' : 'none';
  });
}
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('[data-f]').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); fk=b.dataset.f; fc=null;
  document.querySelectorAll('[data-c]').forEach(x=>x.classList.remove('on')); apply();
});
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
  const was=b.classList.contains('on');
  document.querySelectorAll('[data-c]').forEach(x=>x.classList.remove('on'));
  if(!was){b.classList.add('on'); fc=b.dataset.c;} else fc=null;
  apply();
});
q.oninput=apply;
