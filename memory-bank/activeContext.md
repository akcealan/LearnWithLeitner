# Active Context

## Güncel Durum (Yerel kapanış — yayım sahibi yapacak)

- **Durum: Faz 4A ve 4B sahip tarafından manuel kabul edildi (masaüstü + fiziksel telefon) — ÜRETİME HAZıR DEĞİL.**
- Serbest Çalışma eklendi: destedeki tüm kartlarla ek alıştırma; kalıcı Leitner durumu değişmez.
- Otomatik testler: **164/164 geçti** (162 korundu).
- Normal Çalışma davranışı aynen korunur. Bildirim altyapısı eklenmedi.
- Sonraki planlanan özellik: Faz 4B ana sayfa tekrar takvimi uygulandı (aşağıda).
- Ayrıntılar: bu dosyanın sonundaki Faz 4A/4B bölümleri ve `progress.md`.
- Doğrulama notu: Faz 4A bölümündeki iddialar kod denetimiyle çelişiyordu (uygulama yoktu); bu oturumda gerçekten uygulandı ve ölçüldü (**139/139**, **17/17**). Manuel kabul (sahip) ve fiziksel telefon bekliyor.
- Tarihsel MVP notları (`Current Focus`, `Project Status`, `Completed Features`,
  `Known Working Features`, `Browser Support`, `Performance`) olduğu gibi
  korunur; güncel durumu anlatmaz.

## Current Focus (tarihsel MVP notu — güncel durumu anlatmaz)

- ✅ **PROTOTIP HAZIR** - Learn with Leitner v1.0 tamamen işlevsel
- ✅ MVP Tamamlandı - Temel Leitner sistemi çalışıyor
- ✅ Phase 2: İstatistik ve Ayarlar sayfaları eklendi
- ✅ Tüm bug'lar çözüldü - Açık tema CSS V3 final

## Project Status (tarihsel — güncel durumu anlatmaz)

🟢 **[TARİHSEL İDDİA, YENİDEN DOĞRULANMADI]** ~~READY FOR PRODUCTION~~ - Prototip tamamen işlevsel, kullanıma hazır

## Completed Features (tarihsel MVP listesi — güncel kabul kanıtı değildir)

- ✅ 5-Box Leitner Spaced Repetition System
- ✅ Dark & Light Theme (V3 - fully working)
- ✅ Deck Management (CRUD operations)
- ✅ Card Management with Categories
- ✅ Study Interface with Flip Animations
- ✅ Statistics Dashboard
- ✅ Settings Page (Theme toggle, Export/Import, Reset)
- ✅ Modal Panel Confirmations
- ✅ LocalStorage Persistence
- ✅ JSON Export/Import Backup
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Turkish UI

## Technical Stack

- **Frontend**: HTML5, CSS3 (Tailwind CDN), Vanilla JavaScript ES6
- **Storage**: Browser LocalStorage with JSON serialization
- **UI Framework**: Tailwind CSS with custom dark mode
- **Icons**: Material Symbols Outlined

## Core Implementation Details

### Leitner System

- 5 boxes with schedule [1, 2, 4, 7, 30] days
- Automatic box progression on correct answer
- Box regression on wrong answer (min: box 1)
- New cards marked with `lastReviewDate === null`
- Automatic schedule calculation based on review dates

### Theme System

- Dark mode by default (html class="dark")
- Light mode toggle via settings page
- Saved in localStorage as `leitner_theme`
- CSS: `html:not(.dark)` selector with `!important` for full override
- All 5 pages support both themes

### Data Structure

- **Decks**: {id, name, createdAt, totalCards}
- **Cards**: {id, deckId, question, answer, box, category, createdAt, lastReviewDate}
- **LocalStorage Keys**: `leitner_decks`, `leitner_cards`, `leitner_theme`

### UI Patterns

- Modal confirmations for destructive operations
- Flip card animations using CSS 3D transforms
- Progress bar with percentage tracking
- Responsive grid layouts
- Toast notifications for feedback

## Known Working Features (tarihsel — güncel kabul kanıtı değildir)

- All CRUD operations (Decks & Cards)
- Leitner box progression/regression
- Study session with shuffle
- Auto-redirect to congratulations screen
- Theme persistence across page reloads
- Modal confirmations (no browser confirm dialogs)
- JSON backup and restore
- Statistics calculations
- Responsive layout on all screen sizes
- Dark and light themes fully functional

## Files Structure

```
├── index.html           (Main page - deck listing)
├── deckpage.html        (Deck management - card CRUD)
├── workpage.html        (Study interface)
├── statistics.html      (Analytics dashboard)
├── settings.html        (Settings & theme toggle)
├── js/
│   ├── app.js           (Main app logic)
│   ├── deckpage.js      (Deck page logic)
│   ├── settings.js      (Settings page logic)
│   ├── statistics.js    (Statistics page logic)
│   ├── storage.js       (LocalStorage management)
│   ├── utils.js         (Helper functions)
│   └── test-data.js     (Test data generator)
└── memory-bank/         (Documentation)
    ├── projectbrief.md
    ├── productContext.md
    ├── systemPatterns.md
    ├── techContext.md
    ├── activeContext.md
    └── progress.md
```

## Performance (tarihsel iddia — yeniden ölçülmedi)

- No external backend required
- LocalStorage operations < 1ms
- Instant page transitions
- Smooth animations (CSS transforms)
- No network latency

## Browser Support (tarihsel iddia — yeniden doğrulanmadı)

- Chrome/Edge (Chromium-based) ❓ (yeniden doğrulanmadı)
- Firefox ❓ (yeniden doğrulanmadı)
- Safari ❓ (yeniden doğrulanmadı)
- Mobile browsers ❓ (yeniden doğrulanmadı)

## Future Enhancements (Phase 3)

- Search and filtering
- Category-wise filtering
- Bulk card operations
- Sound effects
- Advanced statistics
- Cloud sync
- Mobile app version
- Light mode CSS tüm sayfalar için eklendi ✅

## Important Patterns

- **LocalStorage Key Pattern**: `leitner_decks`, `leitner_cards`, `leitner_theme`
- **Card Box Range**: 1-5
- **Schedule Days**: [1, 2, 4, 7, 30]
- **Box Progression**: Right → +1, Wrong → -1 (min: box=1)
- **Shuffle**: Fisher-Yates algorithm
- **Modal Pattern**: Fixed overlay with backdrop-blur, centered panel
- **Theme Pattern**: Dark by default, light mode toggleable, saved to localStorage

## Recent Decisions

- 5 kutu sistemi onaylandı ✅
- JSON export/import ayarlar sayfasına taşındı ✅
- Tema toggle eklenmelk (dark/light) ✅
- Tüm veri silme özelliği eklenmelk ✅
- İstatistik sayfa oluşturuldu ✅

## Known Constraints

- LocalStorage limit (~5-10 MB)
- No backend = no cloud sync
- Tema değişimi sayfa yenilemesi gerektirebilir

- Ready for Firefox, Safari (CSS compatibility)

## Performance Notes

- Shuffle (Fisher-Yates) ~O(n)
- LocalStorage getItem/setItem minimal overhead
- No lazy-loading needed (MVP)
- Flip animation smooth (CSS transform)

## 2026-09-22 — Restoration Phase 1A (tamamlandı, tarayıcı kabulü bekliyor)

Odak: test tabanı + içe aktarma/depolama sertleştirme. Kimlik, sayfa yapısı,
Leitner davranışı (1-2-4-7-30 gün; doğru +1, yanlış -1, sınır 1/5) değişmedi.

- Yukarıdaki "READY FOR PRODUCTION / tüm tarayıcılarda doğrulandı" iddiaları
  güncel kabul kanıtı değildir; tarayıcı kabulü henüz yapılmadı (bkz. progress.md).
- Doğrulama sözleşmesi ve geri alma davranışı systemPatterns.md'dedir.
- Testler: `tests/` (53 test, Node yerleşik koşucu). Sonuç: 53/53 geçti.
  Orijinal koda karşı taban sonuç: 13 geçti / 40 kaldı (doğrulama yokluğu kanıtı).
- Bilinen sınırlamalar: ID kalıbı tutucudur (`^[A-Za-z0-9_-]{1,128}$`);
  satır içi onclick nitelikleri duruyor (olay yetkilendirme Faz 1B);
  bozuk depo durumunda sayfa düzeyinde genel hata bandı yok (Faz 1B);
  ayrı localStorage yazımları gerçek atomiklik sağlamaz (en iyi çaba geri alma).

## 2026-09-22 — Restoration Phase 1B (uygulandı; tarayıcı kabulü bekliyor)

- Çalışma oturumu: `isResponding` kilidi + `_renderToken` jetonu. Görünür kart
  başına en fazla bir başarılı yanıt; 300 ms gecikme korunur, gecikme sırasında
  tıklama/klavye sonraki kartı işlemez. Yazma hatası indeksi ilerletmez,
  düğmeler yeniden etkinleşir (yeniden deneme). Tamamlama ekranı tek seferlik;
  bayat zamanlayıcılar biten oturumda kart çizmez.
- Klavye: `keypress` yerine `keydown`. Space kartı çevirir (odaklı düğmeyi
  tetiklemez, sayfayı kaydırmaz); 1/Sol yanlış, 2/Sağ doğru; `repeat`
  yoksayılır; modal açıkken ve metin alanındayken kısayollar susar.
  Flip kartı `role="button"`, `tabindex="0"`, `:focus-visible` çerçevelidir.
- Olay bağlama: dinamik `onclick` nitelikleri kaldırıldı (index: sil/çalış/kartlar;
  deckpage: kart sil; tamamlama: ana sayfa). Tek yetkilendirilmiş dinleyici +
  `data-action`/`data-id`; kimlikler `escapeAttr` ile yerleştirilir, URL
  `encodeURIComponent` ile kurulur. Yedek doğrulama kuralları aynen durur.
- Bozuk depo: index/deckpage/workpage/statistics girişlerinde Türkçe panel
  (`Utils.showStorageError`): veri silinmez, üzerine yazılmaz, yıkıcı akışa
  yönlendirilmez; kurtarma yolu Ayarlar'dan yedek geri yüklemedir.
  Tema okuma hatalarında varsayılan koyu tema kullanılır.
- `clearAll` artık `{ok, code}` döndürür (`ok`/`storage-error`/`rollback-failed`);
  kısmi silme başarılı bildirilmez, geri alma hatası ayrıca raporlanır.
  Ayarlar sıfırlama akışı (onay modalı korunur) bu sonucu bildirir.
- Testler: `tests/` 79 test (53 korundu + 26 yeni: `study`/`reset`/`errorstate`
  + eski-yedek uyumluluğu + kart-bozukluğu regresyonu). Sonuç: **79/79 geçti**.
  Sözdizimi 14/14 geçti.
  Tarayıcı otomasyonu yok; manuel kabul listesi `progress.md` sonundadır.
- Kalan sınırlamalar: ayrı işlemler gerçek atomik değildir; bozuk-depo paneli
  yalnızca giriş çizimlerini kapsar; Space her zaman çevirir (odaklı yanıt
  düğmesinde bile); `totalCards` sayacı ikinci yazımda takılabilir (görünüm
  canlı istatistik kullanır).

## 2026-09-22 — Restoration Phase 2A (uygulandı; tarayıcı kabulü bekliyor)

- Düzen: başlıklar daralmaz (`truncate`, `min-w-0`, `px-4`), deste oluşturma
  mobilde dikey dizilir, form girdileri 16px, kart/izgara içerikleri
  `break-words` ile taşmaz, istatistik ızgaraları mobilde 2 sütuna iner,
  çalışma kartı ve düğmeler dar ekranda yığılır (`min-[380px]` eşiği).
- Erişilebilirlik: atlama bağlantıları, programatik form etiketleri, simge
  düğme adları (`aria-label`), süs simgelerde `aria-hidden`, genel
  `:focus-visible` çerçevesi, `prefers-reduced-motion` koruması, ilerleme
  çubuğu semantiği (`role="progressbar"` + `aria-live`), bildirimde
  `role="status"`, hata panelinde `role="alert"`.
- İletişim kutuları: `role="dialog"` + `aria-modal` + başlık/açıklama ilişkisi,
  kaydırılabilir panel (`max-h-[90vh]`), 44px düğmeler; odak iptale girer,
  Escape iptal eder (yıkıcı işlem asla sessiz onaylanmaz), Tab diyalogda döner,
  odak açana geri döner. Zaman uyumsuz onay davranışı değişmedi.
- Değişen dosyalar: 5 HTML + `app.js`, `deckpage.js`, `statistics.js`,
  `settings.js`, `utils.js`; testler: `tests/a11y.test.js` (yeni),
  `tests/dombo.js` (`activeElement`, odak/kopya taklidi).
- Sonuç: **103/103 geçti** (79 korundu), sözdizimi **15/15 geçti**.
  Gerçek tarayıcı doğrulaması yapılmadı; liste `progress.md` sonundadır.
- Kalan: gerçek cihaz/tarayıcı kabulü, çevrimdışı/CDN denetimi (son denetime
  bırakıldı), görsel cilalama (Faz 2B).

## 2026-09-22 — Faz 1B hedefli düzeltme (kart-bozukluğu regresyonu)

- `initWorkPage` artık oturum kartını çizmeden önce `Storage.getCards()` ile
  kalıcı kart verisinin okunabilirliğini doğrular. Deste geçerli, kart JSON'u
  bozuksa: mevcut panel gösterilir, düğmeler kilitlenir, kart çizilmez,
  indeks ilerlemez, ham veri korunur. Leitner/yedekleme/depolama mimarisi değişmedi.
- Regresyon testi (`tests/errorstate.test.js`): geçerli deste + bozuk kart JSON'u
  + geçerli oturum; panel, kilit, ham-değer koruma doğrulanır. Mevcut deste-
  bozukluğu testi korundu. Sonuç: **79/79 geçti**, sözdizimi 14/14.

## 2026-09-22 — Restoration Phase 2B (uygulandı; tarayıcı kabulü bekliyor)

- Ana sayfa: karşılama kahramanı (üst bilgi, alt metin, "Hemen başla" odağı,
  canlı "X deste • Y kart • Z tekrar bekliyor" özeti), birincil oluşturma
  paneli, "Destelerim" başlığı, 3 adımlı ilk-çalıştırma kartı.
- Eğitim içeriği: masaüstü yan paneli aynen durur; mobilde `xl:hidden`
  "Nasıl çalışır?" bölümü + yerel `<details>` akordiyonu (sıfır JS).
- Hareket: `riseIn` giriş animasyonları (kahraman, panel, kutu kademesi);
  `prefers-reduced-motion` korur, engelleyen intro/flag/izleme yok.
- Değişen dosyalar: `index.html`, `js/app.js` (`renderHeroStats`, CTA odağı,
  ilk-çalıştırma şablonu); testler: `tests/home.test.js` (7 yeni).
- Sonuç: **110/110 geçti** (103 korundu), sözdizimi **16/16 geçti**.
  Gerçek tarayıcı doğrulaması yapılmadı; liste `progress.md` sonundadır.
- Kalan: gerçek cihaz/tarayıcı kabulü, çevrimdışı/CDN denetimi, yayım (sonraki faz).

## 2026-09-22 — Phase 2B Revision: bütünsel yeniden tasarım (tarayıcı kabulü bekliyor)

- Önceki 2B kararları (yan paneli koruma, diğer sayfaları değiştirmeme) sahip
  geri bildirimiyle yürürlükten kalktı; aşağıdaki yeni tasarım geçerlidir.
- Paylaşılan dil: `css/app.css` (sayfa girişi, kaldırma, kutu girişi, bildirim
  animasyonları; renksiz, temadan bağımsız) + mevcut Tailwind mimarisi.
  Açık tema bilinçli eşlikçilerle korunur; yeni yüzeyler mevcut jetonlardadır.
- Ana sayfa: panele gömülü tek oluşturma formu (yedek düğme yok), "Destelerim",
  vade rozetli + kutu şeritli kutular, ilk-çalıştırmada 3 adım, dönen kullanıcıda
  aynı kompakt kahraman; yan panel SİLİNDİ, tek "Nasıl çalışır?" bölümü
  (5 adım + doğru ilerleme/gerileme + `<details>`).
- Diğer sayfalar: deste alt başlığı + sayaçlı liste + boş durum; sakin çalışma
  kartı (yanıt rozeti, kutu bağlamı) + yeni tamamlama (gerçek kart sayılı özet); çubuklu istatistikler + boş yönlendirme; bölmeli tema
  + çerçeveli sıfırlama. İş mantığı ve korumalar değişmedi.
- Sonuç: **117/117 geçti** (110 korundu), sözdizimi **17/17 geçti**.
  Gerçek tarayıcı doğrulaması yapılmadı; liste `progress.md` sonundadır.
- Kalan: gerçek cihaz/tarayıcı kabulü, çevrimdışı/CDN denetimi, yayım.

## 2026-09-23 — Restoration Phase 3A: teknik denetim + odaklı temizlik

- Denetim: gizli bilgi/kimlik yok, satır içi olay yok, güvensiz ağ çağrısı yok,
  tüm `innerHTML` noktaları kaçışlı/sabit, yönlendirmeler sabit sayfa adları.
  Dış kaynaklar canlı (Tailwind CDN, Inter + Material Symbols, akcealan
  bağlantıları HTTP 200); soğuk çevrimdışı yükleme desteklenmez (belgelendi).
- Temizlik: çağrılmayan `formatDateTime`, `calculateProgress`,
  `daysDifference`, `getCardsByBox` ve ölü `.reveal-2` kuralı kaldırıldı.
  README'ye çalışma-kısayolları, sıfırlama, test ve üçüncü-taraf satırları eklendi.
- Lisans: MIT/akcealan aynen; üçüncü taraf (Tailwind MIT, Inter OFL,
  Material Symbols Apache-2.0) CDN ile bağlı, yeniden dağıtım yok.
- Sonuç: **117/117 geçti**, sözdizimi **17/17 geçti**. Davranış değişmedi.
- Kalan: fiziksel telefon kabulü, lisans nihai onayı, yayım kararı (sahip).

## 2026-09-24 — Yayım hazırlığı: kullanılmayan geliştirme yardımcısı kaldırıldı

- `index.html` normal açılışta `js/test-data.js` yüklüyordu; dosya konsoldan
  çağrılan `loadTestData`/`clearAllData` işlevleri sunar (üzerine yazma/silme).
- Doğrulama: uygulama kodu ve testler bu dosyaya hiç başvurmaz (tek kullanan
  satır `index.html` içindeki ekleme etiketiydi); testler kendi sentetik
  verisini kullanır. Gerçek bağımlılık bulunamadı.
- Değişiklik: ekleme etiketi silindi, `js/test-data.js` dosyası silindi,
  yerine başka yardımcı konmadı. `tests/home.test.js` yokluğu korur.
- Tarihsel dosya listelerindeki `test-data.js` satırları eski anlık görüntüdür.
- Sonuç: **117/117 geçti**, sözdizimi **16/16 geçti** (dosya sayısı azaldı).
- Kalan: fiziksel telefon kabulü, yayım kararı (sahip). Git yok, yayım yok.

## Etiket değişikliği: "Bunu Bildim" → "Bildim" (yalnızca görünen metin)

- `workpage.html` doğru-cevap düğmesi metni kısaltıldı; `(2)` kısayol ipucu,
  "Bilemedim" düğmesi, davranış, kısayollar, algoritma ve tasarım aynı.
- Sonuç: **117/117 geçti**, sözdizimi **16/16 geçti**.

## 2026-09-23 — Phase 4A: Serbest Çalışma (kod-tamam, manuel kabul bekliyor)

- Ürün: destedeki TÜM kartlarla (vade/kutu/yeni fark etmez) ek alıştırma.
  Doğru/yanlış yanıtlar kutu, `lastReviewDate`, sayaç ve istatistikleri
  değiştirmez; normal tekrar takvimi aynen korunur.
- Seçim: ana sayfa kutusunda ikincil "Serbest Çalış" eylemi
  (`data-action="start-free-study"`); birincil "Çalış" aynen durur.
  Boş destede bilgi bildirimi, gezinme yok; deste yok/bozuk durumda güvenli akış.
- Kip aktarımı: `sessionStorage.workMode` (`'free'` tam eşleşirse serbest,
  yoksa/geçersizse normal). URL sözleşmesi değişmedi; eski bağlantılar normal açılır.
- Sınır: `handleCardResponse` içinde yalnızca normal kip `Storage.updateCardBox`
  yoluna girer; serbest kip depoya hiç yazmaz (bellek-içi kart nesnesi de
  değişmez). Kilit, 300 ms jetonlu geçiş, tek seferlik tamamlama, klavye,
  bozuk-depo paneli iki kipte de aynen çalışır.
- Arayüz: çalışma başlığında kip rozeti + serbest açıklama satırı; serbest
  tamamlama ekranı (takvim-değişmedi açıklaması, "Desteye Dön" dönüşü).
  Bildirim/Web Push altyapısı eklenmedi (sahip kararı).
- Durum ayrımı: oturum-içi (`currentCards`, indeks, kilit, jeton) geçici;
  kalıcı (`box`, `lastReviewDate`, `totalCards`) yalnızca normal kip yazar.
- Testler: `tests/freestudy.test.js` (22 yeni: seçim, tam-kayıt karşılaştırmalı
  koruma, normal regresyon, oturum/gezinme güvenliği); `tests/dombo.js`
  `workMode`/`sandboxExtra` desteği. Sonuç: **139/139 geçti** (117 korundu),
  sözdizimi **17/17 geçti** (`freestudy.test.js` eklendi).
- Kalan: sahip manuel kabulü (10 maddelik liste raporda); fiziksel telefon;
  yayım kararı. Git yok, yayım yok, 4B uygulanmadı.
- Kabul durumu: yalnızca otomatik doğrulama yapıldı; sahip manuel kabulü (10 madde) ve fiziksel telefon bekliyor.

## Faz 4B kararı (sahip, uygulanmadı)

- Telefon/bilgisayar bildirimi, Web Push ve arka plan bildirimi YOK.
- Faz 4B: ana sayfada uygulama-içi tekrar takvimi (deste + kutu bazında
  yaklaşan/geciken tekrarlar, doğru yerel tarih/saat). Aynı kutudaki kartların
  vade zamanları farklı olabilir; kutu-düzeyi tek tarih varsayılmayacak.
- Serbest Çalışma, 4B'nin göstereceği takvimi değiştirmez.

## 2026-09-23 — Phase 4B: Tekrar Takvimi + kimlik + çıkış metni (kod-tamam, manuel kabul bekliyor)

- Takvim: `Storage.getReviewSchedule` (deste+kutu, vade/gecikme/yaklaşan, tek anlık görüntü); `Utils.formatReviewTime` (yerel Bugün/Yarın/tarih+yıl); ana sayfada salt okunur bölüm, görünürlük tazeleme (görünürlük/odak/60sn, tek bağ).
- Kimlik: `assets/favicon.svg` (özgün SVG) + 5 sayfada bağlantı + satır-içi içi işaret (`data-app-mark`, gizli).
- Çıkış: serbest kipte doğru uyarı (kaydedilmeyecek); normal metin aynen.
- Sonuç: **162/162 geçti** (139 korundu), sözdizimi **18/18 geçti**. Bildirim ve 4B-ötesi iş yok.
- Kalan: sahip manuel kabulü (aşağıdaki liste), fiziksel telefon, yayım kararı. Git yok, yayım yok.

## Kapanış (sahip manuel kabulü sonrası)

- Sayaç tazeliği: deste/kart ekleme-silme sonrası kahraman sayaçları ve deste alt başlığı güncellendi (`renderHeroStats`/`renderDeckSubtitle`, korumalı, 2 yeni test).
- Sonuç: **164/164 geçti**, sözdizimi **18/18 geçti**. Davranış ve tasarım değişmedi.
- Tek ZIP proje dışında; Git/yayım yapılmadı.

## 2026-09-22 — Restoration preparation (ChatGPT, tarihsel)

- The existing application source and behavior have **not** been refactored; this preparation changes public attribution links, copyright holder display, repository hygiene and README only.
- Working copy supplied for the next phase intentionally excludes the prior `.git` directory. Do not infer that a new Git repository, publication, build or browser acceptance has already happened. Keep the original clone as a backup until the final publication stage.
- Historical claims above about production readiness, browser compatibility and performance are **not revalidated** and must not be treated as current acceptance evidence.
- The existing MIT license text is retained provisionally; reconfirm license/third-party asset eligibility before publication.
- Source audit targets: reconcile wrong-answer behavior with product intent (current `Storage.updateCardBox` moves back one box), validate imported JSON shape and card relationships before mutating persistent data, check storage corruption/quota, verify responsive/keyboard flow and CDN-dependent offline claims.
- Next step: full read of `AGENTS.md` and all six Memory Bank files, detailed repository audit and Keep / Improve / Remove, then phased fixes, proportionate tests, real browser/manual acceptance and publication gate.

## Kapanış denetimi (sahip manuel kabulü sonrası)

- Sayaç tazeliği kusuru: deste/kart ekleme-silme sonrası kahraman sayaçları ve deste alt başlığı eski değeri gösteriyordu; `renderHeroStats`/`renderDeckSubtitle` artık korunmalı çağırılıyor (2 yeni test).
- Sonuç: **164/164 geçti**, sözdizimi **18/18 geçti**. Davranış ve tasarım değişmedi.
- Tek ZIP: proje dışında oluşturuldu, bütünlük denetlendi. Git/yayım yapılmadı.
