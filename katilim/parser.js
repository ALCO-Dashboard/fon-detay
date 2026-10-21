/* ---- KB bülten ayrıştırıcı: satır dizisi (aoa) -> {reportDate, cols, catalog, values} ---- */
(function (root) {
  const TR = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'i̇': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function slug(s) {
    return clean(s).toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]|i̇/g, c => TR[c] || c)
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'x';
  }
  function up(s) { return clean(s).toLocaleUpperCase('tr-TR'); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function toISO(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number' && isFinite(v)) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v + 1e-6) * 86400000);
      return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
    }
    if (v instanceof Date && !isNaN(v)) return v.getFullYear() + '-' + pad(v.getMonth() + 1) + '-' + pad(v.getDate());
    const m = String(v).match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (m) return m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
    const m2 = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m2) return m2[0];
    return null;
  }
  function num(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return isFinite(v) ? v : null;
    const s = String(v).replace(/\s/g, '');
    if (!s || /[a-zA-Z]/.test(s)) return null;
    const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
    return isFinite(n) ? n : null;
  }
  const COUNT_RX = /(ŞUBE|PERSONEL|ATM|POS|ÜYE İŞYERİ)/;
  function unitOf(label, mainLabel) {
    const L = up(label), M = up(mainLabel);
    if (/EURO BAKİYE/.test(L)) return 'eur';
    if (/DOLAR BAKİYE|USD KAR/.test(L)) return 'usd';
    if (/\/\s*KULLANDIRILAN/.test(M) && L === M) return 'ratio';
    if (COUNT_RX.test(M)) return 'count';
    return 'tl';
  }

  function parse(aoa, fileName, rowOffset) {
    rowOffset = rowOffset || 0;
    let h = -1;
    for (let i = 0; i < Math.min(aoa.length, 30); i++) {
      const r = aoa[i] || [];
      if (r.some(c => up(c) === 'BU HAFTA') && r.some(c => up(c) === 'YIL SONU')) { h = i; break; }
    }
    if (h < 0) throw new Error('Başlık satırı bulunamadı: dosyada "YIL SONU" ve "BU HAFTA" sütunları olmalı.');
    const hdr = aoa[h].map(up);
    const idx = { yearEnd: hdr.indexOf('YIL SONU'), lastMonth: hdr.indexOf('SON AY'), lastWeek: hdr.indexOf('GEÇEN HAFTA'), thisWeek: hdr.indexOf('BU HAFTA') };
    let labelCol = hdr.findIndex(c => c.includes('FİNANSAL BAŞLIK'));
    if (labelCol < 0) labelCol = 1;
    const dateRow = aoa[h + 1] || [];
    const cols = {};
    for (const k in idx) cols[k] = idx[k] >= 0 ? toISO(dateRow[idx[k]]) : null;
    if (!cols.thisWeek) {
      const fd = toISO(fileName || '');
      if (fd) cols.thisWeek = fd; else throw new Error('"BU HAFTA" sütununun tarihi okunamadı.');
    }
    const reportDate = cols.thisWeek;
    const catalog = [], values = {};
    const used = new Set();
    let main = null, group = null, order = 0;
    for (let i = h + 2; i < aoa.length; i++) {
      const r = aoa[i] || [];
      const a = clean(r[labelCol - 1]), b = clean(r[labelCol]), c = clean(r[labelCol + 1]);
      if (/^DİPNOT/i.test(up(a)) || /^DİPNOT/.test(up(b))) break;
      let label, parent, depth;
      if (b) {
        label = b; parent = null; depth = 0;
      } else if (c && main) {
        label = c;
        const isGroup = /HESAPLAR/.test(up(c)) || up(c) === 'BRÜT' || up(c) === 'ÖZEL KARŞILIKLAR';
        if (isGroup) { parent = main.k; depth = 1; }
        else { parent = group && /HESAPLAR/.test(up(group.label)) ? group.k : main.k; depth = parent === main.k ? 1 : 2; }
      } else continue;
      let k = parent ? parent + '__' + slug(label) : slug(label);
      while (used.has(k)) k += '_';
      used.add(k);
      const item = { k, label, parent, depth, row: i + 1 + rowOffset, order: order++, code: depth === 0 ? a.replace(/-$/, '') : '', unit: unitOf(label, depth === 0 ? label : main.label) };
      if (depth === 0) { main = item; group = null; }
      else if (/HESAPLAR/.test(up(label))) group = item;
      catalog.push(item);
      for (const ck in idx) {
        const d = cols[ck]; if (!d || idx[ck] < 0) continue;
        const v = num(r[idx[ck]]);
        if (v == null) continue;
        (values[d] = values[d] || {})[k] = v;
      }
    }
    if (!catalog.length) throw new Error('Dosyada kalem satırı bulunamadı.');
    return { reportDate, cols, catalog, values };
  }
  root.KBParser = { parse, slug, toISO };
})(typeof window !== 'undefined' ? window : globalThis);
