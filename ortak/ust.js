// Ortak üst başlık: DOST KATILIM - PİYASA VERİLERİ (ALCO)
// Kullanım: <div id="alcoTop"></div><script src="<kök>/ortak/ust.js" data-page="banka|katilim|tefas" data-root="<kök>/"></script>
// Tarih, PPK geri sayımı, koyu/açık tema ve veri güncelliği (durum.json) gösterir.
(function () {
  const me = document.currentScript, PAGE = me.dataset.page || "", ROOT = me.dataset.root || "./";
  const host = document.getElementById("alcoTop"); if (!host) return;
  const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const root = document.documentElement;
  const saved = get("alco-theme") || get("fd-theme") || get("bv.theme"); if (saved) root.dataset.theme = saved;
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;

  const css = `
.alco-top{--at-bg:#fff;--at-ink:#1c1416;--at-mut:#7a6a6c;--at-line:#eadfe0;--at-red:#c8102e;--at-dark:#8b0f1a;--at-wash:#fdecee;--at-ok:#1f8a4c;--at-warn:#c77700;
  background:var(--at-bg);border-bottom:1px solid var(--at-line);font-family:"DM Sans","Albert Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--at-ink);position:relative;z-index:20}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .alco-top{--at-bg:#171012;--at-ink:#f3e9ea;--at-mut:#b49ea1;--at-line:#3a2a2d;--at-red:#f0525f;--at-dark:#ff8a94;--at-wash:#3a171b;--at-ok:#4cc27a;--at-warn:#f0a84a}}
:root[data-theme="dark"] .alco-top{--at-bg:#171012;--at-ink:#f3e9ea;--at-mut:#b49ea1;--at-line:#3a2a2d;--at-red:#f0525f;--at-dark:#ff8a94;--at-wash:#3a171b;--at-ok:#4cc27a;--at-warn:#f0a84a}
.alco-top .at-in{max-width:1500px;margin:0 auto;padding:12px max(16px,env(safe-area-inset-left,0px)) 0 max(16px,env(safe-area-inset-left,0px))}
.alco-top .at-r1{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;padding-bottom:10px}
.alco-top .at-brand{margin-right:auto;min-width:0}
.alco-top .at-brand b{display:block;font-size:20px;font-weight:800;letter-spacing:.01em;line-height:1.2}
.alco-top .at-brand b span{color:var(--at-red)}
.alco-top .at-brand small{display:block;font-size:12.5px;color:var(--at-mut);margin-top:1px}
.alco-top .at-date{border:1px solid var(--at-line);background:var(--at-wash);border-radius:10px;padding:6px 14px;text-align:center;line-height:1.25}
.alco-top .at-date b{display:block;font-family:"JetBrains Mono","Spline Sans Mono",ui-monospace,monospace;font-size:15px;color:var(--at-red);font-weight:700}
.alco-top .at-date small{font-size:11.5px;color:var(--at-mut)} .alco-top .at-date small i{font-style:normal;color:var(--at-red);font-weight:600}
.alco-top button.at-btn{font:inherit;font-size:13px;font-weight:600;border:1px solid var(--at-line);background:var(--at-bg);color:var(--at-ink);border-radius:9px;padding:7px 12px;cursor:pointer}
.alco-top button.at-btn:hover{border-color:var(--at-red)}
.alco-top .at-fr{position:relative}
.alco-top .at-fr .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--at-ok);margin-right:6px;vertical-align:1px}
.alco-top .at-fr.warn .dot{background:var(--at-warn)}
.alco-top .at-fr b{color:var(--at-red)}
.alco-top .at-pop{position:absolute;right:0;top:calc(100% + 6px);background:var(--at-bg);border:1px solid var(--at-line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.15);padding:8px 10px;min-width:340px;z-index:30;font-size:12.5px}
.alco-top .at-pop div{display:grid;grid-template-columns:12px minmax(0,1fr) auto;gap:8px;padding:5px 2px;border-bottom:1px solid var(--at-line);align-items:center}
.alco-top .at-pop div:last-child{border-bottom:0}
.alco-top .at-pop i{width:8px;height:8px;border-radius:50%;background:var(--at-ok)} .alco-top .at-pop i.w{background:var(--at-warn)} .alco-top .at-pop i.n{background:var(--at-line)}
.alco-top .at-pop span:last-child{font-family:"JetBrains Mono",ui-monospace,monospace;color:var(--at-mut);font-size:11.5px}
.alco-top nav.at-tabs{display:flex;gap:4px;overflow-x:auto}
.alco-top nav.at-tabs a{display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:var(--at-mut);font-size:14px;font-weight:600;padding:10px 16px 11px;border-bottom:3px solid transparent;white-space:nowrap}
.alco-top nav.at-tabs a:hover{color:var(--at-ink)}
.alco-top nav.at-tabs a[aria-current="page"]{color:var(--at-red);border-bottom-color:var(--at-red)}
.alco-top nav.at-tabs a .b{font-size:10.5px;min-width:18px;height:18px;border-radius:9px;background:var(--at-ok);color:#fff;display:inline-flex;align-items:center;justify-content:center;padding:0 5px}
.alco-top nav.at-tabs a .b.w{background:var(--at-warn)}
@media (max-width:640px){.alco-top .at-brand b{font-size:16px}.alco-top .at-date{padding:4px 10px}}
${PAGE === "tefas" ? "#thm{display:none!important}" : ""}`;
  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: css }));

  const TABS = [["banka", "Bankacılık Verileri", "bankacilik/"], ["katilim", "Katılım Bülteni", "katilim/"], ["tefas", "TEFAS Verileri", ""]];
  const SRC = [ // anahtar, ad, sekme, kaç gün içinde "güncel"
    ["bddk_haftalik", "BDDK Haftalık Bülten", "banka", 14], ["bddk_aylik", "BDDK Aylık Bülten", "banka", 75],
    ["evds", "TCMB EVDS", "banka", 7], ["politika", "Para Politikası (TCMB)", "banka", 5],
    ["katilim", "Katılım Bülteni", "katilim", 10], ["tefas", "TEFAS", "tefas", 4]];
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fmt = d => `${d.getDate()} ${AY[d.getMonth()]} ${d.getFullYear()}`;
  const parse = s => { if (!s) return null; if (/^\d{4}-\d{2}$/.test(s)) { const [y, m] = s.split("-").map(Number); return new Date(y, m, 0); } const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };

  host.innerHTML = `<header class="alco-top"><div class="at-in"><div class="at-r1">
    <div class="at-brand"><b><span>DOST KATILIM</span> - PİYASA VERİLERİ (ALCO)</b><small>Veri Takip Dashboard</small></div>
    <div class="at-date"><b>${fmt(now)}</b><small id="atPpk">&nbsp;</small></div>
    <button type="button" class="at-btn" id="atTheme"></button>
    <div class="at-fr" id="atFr"><button type="button" class="at-btn" id="atFrBtn" aria-expanded="false"><span class="dot"></span>Veri durumu</button></div>
  </div><nav class="at-tabs" aria-label="Bölümler">${TABS.map(([k, n, p]) => `<a href="${ROOT}${p}" data-k="${k}"${k === PAGE ? ' aria-current="page"' : ""}>${n}<span class="b" hidden></span></a>`).join("")}</nav></div></header>`;

  const tb = document.getElementById("atTheme");
  const lab = () => { tb.textContent = isDark() ? "☀ Açık" : "☾ Koyu"; };
  lab();
  tb.onclick = () => {
    const thm = document.getElementById("thm"), before = isDark();
    if (PAGE === "tefas" && thm) thm.click();
    if (isDark() === before) root.dataset.theme = before ? "light" : "dark";
    const t = isDark() ? "dark" : "light"; root.dataset.theme = t;
    set("alco-theme", t); set("fd-theme", t); set("bv.theme", t); lab();
    window.dispatchEvent(new Event("resize"));
  };

  fetch(ROOT + "durum.json?t=" + Date.now(), { cache: "no-store" }).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(D => {
    D = D || {};
    if (D.ppk_sonraki) { const p = parse(D.ppk_sonraki), g = Math.round((p - today) / 864e5); if (g >= 0) document.getElementById("atPpk").innerHTML = `PPK: ${p.getDate()} ${AY[p.getMonth()]} · <i>${g === 0 ? "bugün" : g + "g"}</i>`; }
    const rows = SRC.map(([k, n, tab, lim]) => { const e = D[k], d = e && parse(e.son_veri), age = d ? Math.round((today - d) / 864e5) : null; return { k, n, tab, d, ok: d != null && age <= lim, has: !!d }; });
    const okN = rows.filter(r => r.ok).length, hasN = rows.filter(r => r.has).length;
    const fr = document.getElementById("atFr"), btn = document.getElementById("atFrBtn");
    if (!hasN) { btn.innerHTML = '<span class="dot"></span>Veri durumu'; }
    else { btn.innerHTML = `<span class="dot"></span><b>${okN}</b> güncel · ${rows.length} kaynak`; if (okN < rows.length) fr.classList.add("warn"); }
    btn.onclick = e => {
      e.stopPropagation(); const open = fr.querySelector(".at-pop"); if (open) { open.remove(); btn.setAttribute("aria-expanded", "false"); return; }
      const p = document.createElement("div"); p.className = "at-pop";
      p.innerHTML = rows.map(r => `<div><i class="${r.has ? (r.ok ? "" : "w") : "n"}"></i><span>${r.n}</span><span>${r.d ? "son veri " + fmt(r.d) : "bilgi yok"}</span></div>`).join("");
      fr.appendChild(p); btn.setAttribute("aria-expanded", "true");
    };
    document.addEventListener("click", () => { const o = fr.querySelector(".at-pop"); if (o) { o.remove(); btn.setAttribute("aria-expanded", "false"); } });
    for (const [k] of TABS) {
      const rs = rows.filter(r => r.tab === k && r.has); if (!rs.length) continue;
      const b = host.querySelector(`a[data-k="${k}"] .b`), n = rs.filter(r => r.ok).length;
      b.textContent = n < rs.length ? "!" : "✓"; b.title = `${n}/${rs.length} kaynak güncel`; if (n < rs.length) b.classList.add("w"); b.hidden = false;
    }
  });
})();
