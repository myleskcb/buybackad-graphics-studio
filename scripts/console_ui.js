/* smoke test */
const out=[];
for(const [k,name] of ARCHS){
  const r=render(k,4242,'phones','45',{...DEFAULT_CFG(),embedFonts:false});
  out.push(`<figure><div>${r.svg}</div><figcaption>${name} · ${r.audit.pass}/${r.audit.total} · ${(r.audit.coverage*100)|0}%</figcaption></figure>`);
}
document.getElementById('app').innerHTML=
  `<style>${fontCSS()}</style><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${out.join('')}</div>`;
