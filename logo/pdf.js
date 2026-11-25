/* The business card's print PDF (DESIGN-LAW 167, 180): one page a side, each the card on its 1/8 in bleed
   with an 18 pt slug for the crop marks; TrimBox the card, BleedBox the bleed. The JPEGs go in as they are
   (DCTDecode), at whatever resolution they were drawn. The card maker's own writer (cards/cards.js pdfOf),
   apart from its page so the kit can use it. */
const TRIM_IN = { w: 3.5, h: 2 }, BLEED_IN = 1 / 8;
export function cardPdf(jpegs) {
  const pt = 72, slug = 18, bw = (TRIM_IN.w + 2 * BLEED_IN) * pt, bh = (TRIM_IN.h + 2 * BLEED_IN) * pt, mw = bw + 2 * slug, mh = bh + 2 * slug, b = BLEED_IN * pt;
  const enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const put = x => { const u = typeof x === "string" ? enc.encode(x) : x; parts.push(u); len += u.length; };
  const f2 = v => (Math.round(v * 100) / 100).toString();
  put("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
  const n = jpegs.length, pageIds = jpegs.map((_, i) => 3 + i * 3);
  const obj = (id, body) => { offs[id] = len; put(id + " 0 obj\n"); body(); put("\nendobj\n"); };
  obj(1, () => put("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => put("<< /Type /Pages /Kids [" + pageIds.map(i => i + " 0 R").join(" ") + "] /Count " + n + " >>"));
  jpegs.forEach((j, i) => {
    const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2;
    const tx0 = slug + b, ty0 = slug + b, tx1 = slug + bw - b, ty1 = slug + bh - b, gap = 2;
    const marks = [
      [tx0, 0, tx0, slug - gap], [tx1, 0, tx1, slug - gap], [tx0, mh - slug + gap, tx0, mh], [tx1, mh - slug + gap, tx1, mh],
      [0, ty0, slug - gap, ty0], [0, ty1, slug - gap, ty1], [mw - slug + gap, ty0, mw, ty0], [mw - slug + gap, ty1, mw, ty1],
    ].map(([x1, y1, x2, y2]) => f2(x1) + " " + f2(y1) + " m " + f2(x2) + " " + f2(y2) + " l S").join("\n");
    const content = "q " + f2(bw) + " 0 0 " + f2(bh) + " " + slug + " " + slug + " cm /Im0 Do Q\n0 0 0 1 K 0.25 w\n" + marks + "\n";
    obj(pid, () => put("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + f2(mw) + " " + f2(mh) + "] /BleedBox [" + slug + " " + slug + " " + f2(slug + bw) + " " + f2(slug + bh) + "] /TrimBox ["
      + f2(tx0) + " " + f2(ty0) + " " + f2(tx1) + " " + f2(ty1) + "] /Resources << /XObject << /Im0 " + iid + " 0 R >> >> /Contents " + cid + " 0 R >>"));
    obj(cid, () => { put("<< /Length " + enc.encode(content).length + " >>\nstream\n"); put(content); put("\nendstream"); });
    obj(iid, () => { put("<< /Type /XObject /Subtype /Image /Width " + j.w + " /Height " + j.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + j.bytes.length + " >>\nstream\n"); put(j.bytes); put("\nendstream"); });
  });
  const total = 3 + n * 3, xref = len;
  put("xref\n0 " + total + "\n0000000000 65535 f \n");
  for (let i = 1; i < total; i++) put(String(offs[i]).padStart(10, "0") + " 00000 n \n");
  put("trailer\n<< /Size " + total + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  const out = new Uint8Array(len); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; });
  return out;
}

/** one JPEG on a page of w × h points (72 a inch): any kit file as a PDF */
export function imagePdf(j, wPt, hPt) {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const put = x => { const u = typeof x === "string" ? enc.encode(x) : x; parts.push(u); len += u.length; };
  const f2 = v => (Math.round(v * 100) / 100).toString(), obj = (id, body) => { offs[id] = len; put(id + " 0 obj\n"); body(); put("\nendobj\n"); };
  put("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
  obj(1, () => put("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => put("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"));
  const content = "q " + f2(wPt) + " 0 0 " + f2(hPt) + " 0 0 cm /Im0 Do Q\n";
  obj(3, () => put("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + f2(wPt) + " " + f2(hPt) + "] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>"));
  obj(4, () => { put("<< /Length " + enc.encode(content).length + " >>\nstream\n"); put(content); put("\nendstream"); });
  obj(5, () => { put("<< /Type /XObject /Subtype /Image /Width " + j.w + " /Height " + j.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + j.bytes.length + " >>\nstream\n"); put(j.bytes); put("\nendstream"); });
  const xref = len; put("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i < 6; i++) put(String(offs[i]).padStart(10, "0") + " 00000 n \n");
  put("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
  const out = new Uint8Array(len); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; });
  return out;
}

/* print it today (the card maker's printLinks): Google Maps searches the customer opens themselves */
const CHAINS = ["FedEx Office", "Staples", "Office Depot OfficeMax", "The UPS Store"];
export function printLinks(q) {
  const where = String(q || "").trim(), near = where ? " near " + where : " near me";
  const url = s => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s);
  return [{ name: "Same-day business card printing" + (where ? " near " + where : ""), url: url("same day business card printing" + near), main: true }]
    .concat(CHAINS.map(c => ({ name: c, url: url(c + near) })));
}
