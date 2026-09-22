# Tech Context

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Tailwind CSS (CDN)
- **Icons**: Material Symbols (Google Fonts)
- **Font**: Inter (Google Fonts)
- **Storage**: Browser LocalStorage
- **Data Format**: JSON

## Development Setup

- Dosya yapısı:
  ```
  /
  ├── index.html (Ana sayfa)
  ├── workpage.html (Çalışma sayfası)
  ├── js/
  │   ├── app.js (Ana logic)
  │   ├── utils.js (Helper functions)
  │   └── storage.js (LocalStorage management)
  ├── css/
  │   └── style.css (Custom styles)
  └── memory-bank/ (Dokumentasyon)
  ```

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- LocalStorage desteği gerekli
- CSS Grid/Flexbox desteği gerekli

## Tailwind Configuration

```javascript
{
  darkMode: "class",
  colors: {
    primary: "#38bdf8" (Sky Blue)
    background-dark: "#111827"
    card-dark: "#1f2937"
    border-dark: "#374151"
  }
}
```

## JavaScript Requirements

- UUID generation (simple implementation veya library)
- Date manipulation (native Date object)
- Array operations (filter, map, sort)
- LocalStorage API
- JSON stringify/parse

## Animation Requirements

- Flip card animation (CSS transform + JavaScript)
- Smooth transitions
- Mobile-friendly (tap support)

## Performance Considerations

- LocalStorage yazma/okuma optimize edilmeli
- Kartlar lazy-load edilebilir (ilerde)
- Shuffle algorithm efficient olmalı

## Deployment

- Static hosting (GitHub Pages, Vercel, Netlify vb.)
- HTTPS gerekli (LocalStorage güvenliği için)
- No backend required

## Faz 1A — Test Altyapısı (2026-09-22, doğrulandı)

- Paket yöneticisi ve üretim bağımlılığı yok. Testler Node.js yerleşik
  `node:test` + `node:assert/strict` ile yazıldı (`tests/helpers.js`,
  `tests/storage.test.js`, `tests/import.test.js`).
- `storage.js` tarayıcı globalsız test edilir: `node:vm` içinde sahte
  `localStorage` ve sabit saat (`Date`) ile yüklenir; veri sentetiktir.
- Çalıştırma: `node --test tests/*.test.js`; sözdizimi: `node --check <dosya>`.
- Bu ortamda Node kurulu değildi; taşınabilir Node (v24.21.0) yalnızca test
  çalıştırmak için sistem Temp dizinine indirildi, repoya eklenmedi.
- Tarayıcı otomasyonu bu ortamda yok (Chrome/Edge/Firefox bulunamadı);
  tarayıcı kabulü manuel listeyle sahip onayına bırakıldı.

## Faz 1B — Test Altyapısı Eki (2026-09-22, doğrulandı)

- Yeni: `tests/dombo.js` (en küçük sahte DOM: öğe, belge, sessionStorage,
  betik çalıştırıcı), `tests/study.test.js` (oturum kilidi, klavye,
  yetkilendirme), `tests/reset.test.js` (`clearAll` + sıfırlama bildirimleri),
  `tests/errorstate.test.js` (hata paneli + sayfa girişleri).
- `tests/helpers.js`: `removeItem` hata enjeksiyonu (`removeErrors`) eklendi.
- Toplam **79 test, 79 geçti** (53 korundu). Komutlar değişmedi.

## Faz 2A — Test Eki (2026-09-22, doğrulandı)

- Yeni: `tests/a11y.test.js` (statik HTML denetimleri, dinamik çıktı adları,
  bildirim, modal odağı, ilerleme semantiği).
- `tests/dombo.js`: `activeElement`, odak işareti, `cloneNode`/`replaceWith`
  taklidi eklendi (yalnızca testler açılan modalları çalıştırır).
- Toplam **103 test, 103 geçti** (79 korundu). Gerçek tarayıcı kabulü bekliyor.

## Faz 2B — Test Eki (2026-09-22, doğrulandı)

- Yeni: `tests/home.test.js` (yapı, ilk-çalıştırma, özet sayaçları, CTA odağı,
  bozuk-depo sessizliği).
- Toplam **110 test, 110 geçti** (103 korundu). Gerçek tarayıcı kabulü bekliyor.

## Faz 2B Revision — Test Eki (2026-09-22, doğrulandı)

- `tests/home.test.js` güncellendi (yeni kahraman/eğitim yapısı; 2 beklenti
  yeni tasarımla çeliştiği için yenilendi, işlev/güvenlik testleri korunuyor).
- Yeni: `tests/redesign.test.js` (tamamlama, kutu bağlamı, alt başlık,
  çubuklar, paylaşılan stil).
- Toplam **117 test, 117 geçti** (110 korundu). Gerçek tarayıcı kabulü bekliyor.

## Yayım Hazırlığı — Test Kaydı (2026-09-24, doğrulandı)

- Davranış değişikliği yok; `tests/home.test.js` yokluk denetimi eklendi.
- Toplam **117 test, 117 geçti**; sözdizimi 17→**16/16 geçti** (dosya silindi).

## Faz 3A — Denetim Kaydı (2026-09-23, doğrulandı)

- Davranış değişikliği yok; yeni test eklenmedi (ölü kod kaldırmayı mevcut
  suite doğruluyor: **117/117**, sözdizimi **17/17**).
- Sonraki adım: fiziksel telefon kabulü ve sahip yayım kararı.

## Faz 4A — Test Eki (2026-09-23, doğrulandı)

- Yeni: `tests/freestudy.test.js` (22 test: seçim, tam-kayıt koruması, normal regresyon, oturum/gezinme).
- `tests/dombo.js`: `loadWorkApp` `workMode` tohumu + `runPageScript` `sandboxExtra` desteği (yalnızca test).
- Toplam **139 test, 139 geçti** (117 korundu). Gerçek tarayıcı kabulü bekliyor.

## Faz 4B — Test Eki (2026-09-23, doğrulandı)

- Yeni: `tests/schedule.test.js` (23 test: hesap, biçim, çizim, kip etkileşimi, kimlik/çıkış).
- Toplam **162 test, 162 geçti** (139 korundu). Gerçek tarayıcı kabulü bekliyor.

## Kapanış kaydı: ek test yok dışında 2 yeni sayaç tazeliği testi (`home`, `redesign`); toplam **164/164**, sözdizim **18/18**.
