/* EXIF dates in a JPEG, written and read back (DESIGN-LAW rule 111, continued).

   The library's renders are drawn by a browser canvas, which writes no EXIF,
   so a partner uploading one had a picture with no date in it. This puts an
   APP1 Exif segment into a JPEG with the dates the library knows (IFD0:
   ImageDescription, Software, DateTime = last changed; Exif IFD:
   DateTimeOriginal = created, DateTimeDigitized = uploaded, each with its
   OffsetTime "+00:00"), and reads them back so a check can prove they are
   there. Little-endian TIFF, two IFDs, nothing else: no thumbnail, no
   maker notes. An Exif segment already in the file (one we wrote earlier)
   is replaced; any other APP segment is left where it is.

   exifStamp(buf, { title, software, created, updated, uploaded }) → Buffer
   exifRead(buf) → { title, software, updated, created, uploaded } | null
   Dates in and out are ISO 8601 UTC strings. */

const TAGS = { description: 0x010e, software: 0x0131, datetime: 0x0132, exifPtr: 0x8769, original: 0x9003, digitized: 0x9004, offTime: 0x9010, offOriginal: 0x9011, offDigitized: 0x9012 };
const ASCII = 2, LONG = 4;
/* EXIF ASCII is ASCII: the library's middle dot (Black & Gold · Arc Crown) becomes a hyphen, anything else outside ASCII a space */
const ascii = (v) => String(v).replace(/\s[\u00b7\u2022\u2013\u2014]\s/g, ' - ').replace(/[^\x20-\x7e]/g, ' ').replace(/\s+/g, ' ').trim();

export const exifDate = (iso) => { const d = new Date(iso); if (isNaN(d)) throw new Error('not a date: ' + iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}:${p(d.getUTCMonth() + 1)}:${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`; };
export const isoFromExif = (s) => { const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(s || '').trim()); return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null; };

/* one IFD: entries [tag, type, value(Buffer for ASCII / number for LONG)], laid out at `base` (offset from the TIFF header) */
function ifd(entries, base, next) {
  const head = 2 + entries.length * 12 + 4;
  const blobs = [];
  let tail = base + head;
  const dir = Buffer.alloc(head);
  dir.writeUInt16LE(entries.length, 0);
  entries.forEach(([tag, type, value], i) => {
    const at = 2 + i * 12;
    dir.writeUInt16LE(tag, at); dir.writeUInt16LE(type, at + 2);
    if (type === LONG) { dir.writeUInt32LE(1, at + 4); dir.writeUInt32LE(value, at + 8); return; }
    const v = Buffer.concat([Buffer.from(ascii(value), 'latin1'), Buffer.from([0])]);
    dir.writeUInt32LE(v.length, at + 4);
    if (v.length <= 4) v.copy(dir, at + 8);
    else { dir.writeUInt32LE(tail, at + 8); blobs.push(v); tail += v.length + (v.length % 2); if (v.length % 2) blobs.push(Buffer.from([0])); }
  });
  dir.writeUInt32LE(next, head - 4);
  return { buf: Buffer.concat([dir, ...blobs]), end: tail };
}
function tiff({ title, software, created, updated, uploaded }) {
  const header = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0, 0, 0]);   // "II", 42, IFD0 at 8
  /* IFD0 is laid out first; the Exif IFD follows it, so IFD0's pointer is known once IFD0's size is */
  const ifd0Entries = (ptr) => [[TAGS.description, ASCII, title], [TAGS.software, ASCII, software], [TAGS.datetime, ASCII, exifDate(updated)], [TAGS.exifPtr, LONG, ptr]].sort((a, b) => a[0] - b[0]);
  const probe = ifd(ifd0Entries(0), 8, 0);
  const ifd0 = ifd(ifd0Entries(probe.end), 8, 0);
  const exif = ifd([[TAGS.original, ASCII, exifDate(created)], [TAGS.digitized, ASCII, exifDate(uploaded)], [TAGS.offTime, ASCII, '+00:00'], [TAGS.offOriginal, ASCII, '+00:00'], [TAGS.offDigitized, ASCII, '+00:00']].sort((a, b) => a[0] - b[0]), ifd0.end, 0);
  return Buffer.concat([header, ifd0.buf, exif.buf]);
}
/* the segments of a JPEG up to the scan: [{ marker, start, len }] */
function segments(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG');
  const out = [];
  for (let i = 2; i < buf.length - 4 && buf[i] === 0xff;) {
    const m = buf[i + 1];
    if (m === 0xda) break;                                    // start of scan
    const len = buf.readUInt16BE(i + 2);
    out.push({ marker: m, start: i, len: 2 + len });
    i += 2 + len;
  }
  return out;
}
const isExif = (buf, s) => s.marker === 0xe1 && buf.slice(s.start + 4, s.start + 10).toString('latin1') === 'Exif\0\0';

export function exifStamp(buf, fields) {
  const t = tiff(fields);
  const seg = Buffer.concat([Buffer.from([0xff, 0xe1, 0, 0]), Buffer.from('Exif\0\0', 'latin1'), t]);
  seg.writeUInt16BE(seg.length - 2, 2);
  const segs = segments(buf);
  /* drop an Exif segment we wrote before; put ours after the JFIF APP0 when
     there is one (JFIF wants to be first), else right after SOI */
  const keep = segs.filter((s) => !isExif(buf, s));
  const app0 = keep.find((s) => s.marker === 0xe0);
  const at = app0 ? app0.start + app0.len : 2;
  const parts = [buf.slice(0, 2)];
  let pos = 2;
  for (const s of segs) {
    if (s.start === at) parts.push(seg);
    if (isExif(buf, s)) { pos = s.start + s.len; continue; }
    parts.push(buf.slice(s.start, s.start + s.len)); pos = s.start + s.len;
    if (s.start + s.len === at && !segs.some((x) => x.start === at)) parts.push(seg);
  }
  if (at === 2 && !segs.length) parts.push(seg);
  parts.push(buf.slice(pos));
  return Buffer.concat(parts);
}

export function exifRead(buf) {
  const s = segments(buf).find((x) => isExif(buf, x));
  if (!s) return null;
  const t = buf.slice(s.start + 10, s.start + s.len);
  const le = t.slice(0, 2).toString('latin1') === 'II';
  const u16 = (o) => le ? t.readUInt16LE(o) : t.readUInt16BE(o), u32 = (o) => le ? t.readUInt32LE(o) : t.readUInt32BE(o);
  const read = (off, into) => {
    const n = u16(off);
    for (let i = 0; i < n; i++) {
      const at = off + 2 + i * 12, tag = u16(at), type = u16(at + 2), count = u32(at + 4);
      if (type === LONG) { into[tag] = u32(at + 8); continue; }
      if (type !== ASCII) continue;
      const vo = count <= 4 ? at + 8 : u32(at + 8);
      into[tag] = t.slice(vo, vo + count).toString('latin1').replace(/\0+$/, '');
    }
  };
  const tags = {};
  read(u32(4), tags);
  if (tags[TAGS.exifPtr]) read(tags[TAGS.exifPtr], tags);
  return { title: tags[TAGS.description] || null, software: tags[TAGS.software] || null,
    updated: isoFromExif(tags[TAGS.datetime]), created: isoFromExif(tags[TAGS.original]), uploaded: isoFromExif(tags[TAGS.digitized]) };
}
