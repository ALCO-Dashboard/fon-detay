// ALCO – Bankacılık Verileri (BDDK / TCMB) — şifreli yayın.
//
// bankacilik/kaynak.html sayfasına site menüsünü ekler, Fon Detay ile aynı yöntemle
// şifreler (site/bankacilik/sayfa.enc) ve şifre soran açılış sayfasını yazar.
// Şifre SITE_PASSWORD ortam değişkeninden okunur.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";

const KOK = path.dirname(new URL(import.meta.url).pathname);
const CIKTI = path.join(process.argv[2] || "site", "bankacilik");
const sifre = process.env.SITE_PASSWORD || "";
if (sifre.length < 6) { console.error("HATA: SITE_PASSWORD tanımlı değil ya da 6 karakterden kısa."); process.exit(2); }

const MENU = `<nav aria-label="Site" style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;background:#1a1d26;padding:6px max(16px,env(safe-area-inset-left,0px));font:600 13px 'DM Sans',system-ui,sans-serif">`
  + `<span style="color:#fff;opacity:.85;font-weight:700;letter-spacing:.08em;font-size:12px;margin-right:12px">ALCO</span>`
  + `<a href="../" style="color:#fff;opacity:.75;text-decoration:none;padding:5px 10px;border-radius:6px">Fon Detay</a>`
  + `<a href="../katilim/" style="color:#fff;opacity:.75;text-decoration:none;padding:5px 10px;border-radius:6px">Katılım Bülteni</a>`
  + `<a href="./" aria-current="page" style="color:#fff;text-decoration:none;padding:5px 10px;border-radius:6px;background:rgba(255,255,255,.18)">Bankacılık Verileri</a></nav>`;

let html = fs.readFileSync(path.join(KOK, "kaynak.html"), "utf8");
html = html.includes("<body>") ? html.replace("<body>", "<body>" + MENU) : MENU + html;

const ham = zlib.gzipSync(Buffer.from(html, "utf8"), { level: 9 });
const tuz = crypto.randomBytes(16), nonce = crypto.randomBytes(12);
const c = crypto.createCipheriv("aes-256-gcm", crypto.pbkdf2Sync(sifre, tuz, 200000, 32, "sha256"), nonce);
const sifreli = Buffer.concat([c.update(ham), c.final(), c.getAuthTag()]);
fs.mkdirSync(CIKTI, { recursive: true });
fs.writeFileSync(path.join(CIKTI, "sayfa.enc"), Buffer.concat([Buffer.from("FD1"), tuz, nonce, sifreli]));
fs.writeFileSync(path.join(CIKTI, "index.html"), fs.readFileSync(path.join(KOK, "ac.html")));
console.log(`TAMAM — Bankacılık Verileri ${(html.length / 1e6).toFixed(1)} MB → ${(ham.length / 1e6).toFixed(1)} MB şifreli`);
