// Katılım Bankaları Bülteni — veri derleme.
//
// 1) katilim/onceki.json (claude.ai'deki panodan taşınan bültenler) ile başlar
// 2) katilim/excel/ altındaki tüm bülten Excel'lerini tarih sırasıyla üzerine işler
//    (aynı tarih iki dosyada varsa daha yeni bültenin değeri geçerli olur)
// 3) Kuru olmayan tarihler için TCMB gösterge döviz alış kurunu çeker
// 4) Veriyi Fon Detay ile aynı yöntemle şifreler: site/katilim/data.enc + index.html
//
// Şifre SITE_PASSWORD ortam değişkeninden okunur.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const KOK = path.dirname(new URL(import.meta.url).pathname);
await import(path.join(KOK, "parser.js"));
const { parse } = globalThis.KBParser;
const CIKTI = path.join(process.argv[2] || "site", "katilim");

const sifre = process.env.SITE_PASSWORD || "";
if (sifre.length < 6) { console.error("HATA: SITE_PASSWORD tanımlı değil ya da 6 karakterden kısa."); process.exit(2); }

const S = JSON.parse(fs.readFileSync(path.join(KOK, "onceki.json"), "utf8"));
S.snaps ||= {}; S.reports ||= {}; S.catalog ||= []; S.fx ||= {};

// ---- Excel'leri işle
const dosyalar = fs.existsSync(path.join(KOK, "excel"))
  ? fs.readdirSync(path.join(KOK, "excel")).filter(f => /\.(xlsx|xlsm|xls)$/i.test(f) && !f.startsWith("~$"))
  : [];
const okunan = [];
for (const ad of dosyalar) {
  const wb = XLSX.read(fs.readFileSync(path.join(KOK, "excel", ad)), { type: "buffer" });
  let p = null, son = null;
  for (const n of wb.SheetNames) {
    const ws = wb.Sheets[n]; if (!ws["!ref"]) continue;
    const off = XLSX.utils.decode_range(ws["!ref"]).s.r;
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true });
    try { p = parse(aoa, ad, off); break; } catch (e) { son = e; }
  }
  if (!p) { console.error(`UYARI: ${ad} okunamadı: ${son && son.message}`); continue; }
  okunan.push([p, ad]);
}
okunan.sort((a, b) => a[0].reportDate.localeCompare(b[0].reportDate));
for (const [p, ad] of okunan) {
  for (const d of Object.keys(p.values)) {
    const ex = S.snaps[d], inc = p.values[d];
    if (!ex) S.snaps[d] = { src: p.reportDate, v: inc };
    else if (p.reportDate >= (ex.src || "")) S.snaps[d] = { src: p.reportDate, v: { ...ex.v, ...inc } };
    else S.snaps[d] = { src: ex.src, v: { ...inc, ...ex.v } };
  }
  S.reports[p.reportDate] = { reportDate: p.reportDate, cols: p.cols, fileName: ad, items: p.catalog.length,
    uploadedAt: (S.reports[p.reportDate] && S.reports[p.reportDate].uploadedAt) || new Date().toISOString() };
  const enSon = Object.keys(S.reports).sort().pop();
  if (!S.catalog.length || p.reportDate >= enSon) {
    const ks = new Set(p.catalog.map(c => c.k));
    S.catalog = p.catalog.concat(S.catalog.filter(c => !ks.has(c.k)).map((c, i) => ({ ...c, order: p.catalog.length + i })));
  } else {
    const h = new Set(S.catalog.map(c => c.k));
    S.catalog = S.catalog.concat(p.catalog.filter(c => !h.has(c.k)));
  }
  console.log(`Bülten: ${ad} → ${p.reportDate} (${Object.keys(p.values).length} tarih)`);
}

// ---- TCMB kurları (bülten tarihinde; tatilse önceki iş günü)
async function tcmb(d) {
  let t = new Date(d + "T00:00:00Z");
  for (let i = 0; i < 6; i++, t = new Date(t.getTime() - 864e5)) {
    if (t.getUTCDay() === 0 || t.getUTCDay() === 6) continue;
    const y = t.getUTCFullYear(), m = String(t.getUTCMonth() + 1).padStart(2, "0"), g = String(t.getUTCDate()).padStart(2, "0");
    try {
      const r = await fetch(`https://www.tcmb.gov.tr/kurlar/${y}${m}/${g}${m}${y}.xml`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) continue;
      const x = await r.text();
      const k = c => { const mm = x.match(new RegExp(`CurrencyCode="${c}"[\\s\\S]*?<ForexBuying>([0-9.]+)<`)); return mm ? Number(mm[1]) : null; };
      const usd = k("USD"), eur = k("EUR");
      if (usd && eur) return { usd, eur, src: "TCMB" + (i ? ` (${g}.${m}.${y})` : "") };
    } catch (e) { console.error(`TCMB ${d}: ${e.message}`); }
  }
  return null;
}
for (const d of Object.keys(S.snaps).sort()) {
  if (S.fx[d] && S.fx[d].usd) continue;
  const f = await tcmb(d);
  if (f) { S.fx[d] = f; console.log(`Kur: ${d} USD ${f.usd} EUR ${f.eur}`); }
  else console.log(`Kur: ${d} bulunamadı, bültenden türetilecek`);
}

// ---- şifrele ve yaz (Fon Detay ile aynı biçim: "FD1" + tuz16 + nonce12 + gzip(JSON) şifreli + etiket)
const veri = { ...S, updated: new Date().toISOString() };
const ham = zlib.gzipSync(Buffer.from(JSON.stringify(veri), "utf8"), { level: 6 });
const tuz = crypto.randomBytes(16), nonce = crypto.randomBytes(12);
const anahtar = crypto.pbkdf2Sync(sifre, tuz, 200000, 32, "sha256");
const c = crypto.createCipheriv("aes-256-gcm", anahtar, nonce);
const sifreli = Buffer.concat([c.update(ham), c.final(), c.getAuthTag()]);
fs.mkdirSync(CIKTI, { recursive: true });
fs.writeFileSync(path.join(CIKTI, "data.enc"), Buffer.concat([Buffer.from("FD1"), tuz, nonce, sifreli]));
fs.writeFileSync(path.join(CIKTI, "index.html"), fs.readFileSync(path.join(KOK, "sayfa.html")));
// üst başlıktaki "güncel" göstergesi için son bülten tarihi
try {
  const dy = path.join(path.dirname(CIKTI), "durum.json");
  let d = {}; try { d = JSON.parse(fs.readFileSync(dy, "utf8")); } catch (e) {}
  const son = Object.keys(S.reports).sort().pop();
  if (son) d.katilim = { son_veri: son, guncelleme: new Date().toISOString() };
  fs.writeFileSync(dy, JSON.stringify(d, null, 1));
} catch (e) { console.error("durum.json yazılamadı: " + e.message); }
console.log(`TAMAM — ${Object.keys(S.reports).length} bülten, ${Object.keys(S.snaps).length} tarih → ${CIKTI}`);
