"""TEFAS erişim testi.

GitHub Actions sunucusundan TEFAS'a ulaşılıp ulaşılamadığını iki yolla dener:
  1) Doğrudan istek (en basit yol)
  2) Gerçek bir tarayıcı (Chromium) açıp sayfanın içinden istek
Sonuçları ekrana yazar. Hiçbir veriyi kaydetmez.
"""
import json
import sys
from datetime import date, timedelta

import requests
from playwright.sync_api import sync_playwright

SAYFA = "https://www.tefas.gov.tr/tr/fon-verileri?fundType=BYF"
API = "https://www.tefas.gov.tr/api/funds/fonGnlBlgSiraliGetir"


def son_is_gunu() -> str:
    g = date.today() - timedelta(days=1)
    while g.weekday() >= 5:  # cumartesi, pazar
        g -= timedelta(days=1)
    return g.strftime("%Y%m%d")


def govde(tarih: str) -> dict:
    return {
        "fonTipi": "BYF", "fonKodu": None, "aramaMetni": None, "fonTurKod": None,
        "fonGrubu": None, "sfonTurKod": None, "basTarih": tarih, "bitTarih": tarih,
        "basSira": 1, "bitSira": 5000, "fonTurAciklama": None, "dil": "TR",
        "kurucuKod": None, "sira": None, "yon": None, "sFonTurKod": "",
        "fonKod": None, "fonGrup": "", "fonUnvanTip": "",
    }


def ozet(metin: str) -> str:
    try:
        j = json.loads(metin)
    except Exception:
        return f"JSON değil, ilk 200 karakter: {metin[:200]!r}"
    liste = j.get("resultList")
    if liste:
        ilk = liste[0]
        return f"BAŞARILI — {len(liste)} fon geldi. Örnek: {ilk.get('fonKodu')} {ilk.get('tarih')} fiyat={ilk.get('fiyat')}"
    return f"Veri yok. Yanıt: {metin[:300]}"


def main() -> int:
    tarih = son_is_gunu()
    print(f"Sorgulanan tarih: {tarih}\n")
    basarili = False

    print("1) Doğrudan istek")
    try:
        r = requests.post(API, json=govde(tarih), timeout=40, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
            "Origin": "https://www.tefas.gov.tr", "Referer": SAYFA,
        })
        sonuc = ozet(r.text)
        print(f"   HTTP {r.status_code} — {sonuc}")
        basarili |= sonuc.startswith("BAŞARILI")
    except Exception as e:
        print(f"   HATA: {type(e).__name__}: {e}")

    print("\n2) Tarayıcı üzerinden istek")
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            s = b.new_page(locale="tr-TR")
            yanit = s.goto(SAYFA, wait_until="domcontentloaded", timeout=90000)
            print(f"   Sayfa: HTTP {yanit.status if yanit else '?'} — başlık: {s.title()!r}")
            s.wait_for_timeout(8000)
            metin = s.evaluate(
                """async (g) => {
                    const r = await fetch('/api/funds/fonGnlBlgSiraliGetir', {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(g)});
                    return r.status + '|' + await r.text();
                }""",
                govde(tarih),
            )
            durum, _, icerik = metin.partition("|")
            sonuc = ozet(icerik)
            print(f"   HTTP {durum} — {sonuc}")
            basarili |= sonuc.startswith("BAŞARILI")
            b.close()
    except Exception as e:
        print(f"   HATA: {type(e).__name__}: {e}")

    print("\nSONUÇ:", "TEFAS'a bu sunucudan ERİŞİLEBİLİYOR." if basarili
          else "TEFAS'a bu sunucudan ERİŞİLEMİYOR.")
    return 0 if basarili else 1


if __name__ == "__main__":
    sys.exit(main())
