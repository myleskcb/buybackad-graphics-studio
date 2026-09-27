const KEY='gfx-picks-v1';
const tiles=[...document.querySelectorAll('.t')];
let st=JSON.parse(localStorage.getItem(KEY)||'{}');
function paint(){
  let g=0,b=0;
  tiles.forEach(t=>{
    const i=t.dataset.i, s=st[i];
    t.classList.toggle('good',s==='good');
    t.classList.toggle('bad',s==='bad');
    if(s==='good')g++; else if(s==='bad')b++;
  });
  document.getElementById('ng').textContent=g;
  document.getElementById('nb').textContent=b;
  document.getElementById('nu').textContent=tiles.length-g-b;
  localStorage.setItem(KEY,JSON.stringify(st));
}
tiles.forEach(t=>t.onclick=()=>{
  const i=t.dataset.i, s=st[i];
  st[i] = s==='good' ? 'bad' : s==='bad' ? undefined : 'good';
  if(st[i]===undefined) delete st[i];
  paint();
});
document.getElementById('clear').onclick=()=>{st={};paint();};
document.getElementById('allgood').onclick=()=>{tiles.forEach(t=>{if(!st[t.dataset.i])st[t.dataset.i]='good';});paint();};
document.getElementById('allbad').onclick=()=>{tiles.forEach(t=>{if(!st[t.dataset.i])st[t.dataset.i]='bad';});paint();};
document.getElementById('copy').onclick=()=>{
  const good=tiles.filter(t=>st[t.dataset.i]==='good');
  const bad=tiles.filter(t=>st[t.dataset.i]==='bad');
  const fmt=a=>a.map(t=>t.dataset.i).join(' ');
  const txt='GOOD ('+good.length+'): '+fmt(good)+'\n\nBAD ('+bad.length+'): '+fmt(bad)
           +'\n\nGOOD PATHS:\n'+good.map(t=>t.dataset.p).join('\n');
  const o=document.getElementById('out'); o.value=txt; o.select();
  try{navigator.clipboard.writeText(txt);}catch(e){}
};
paint();