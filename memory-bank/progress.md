# Progress

## Güncel Durum (Faz 4B kod-tamam, manuel kabul bekliyor)

- **Durum: restorasyon sürüyor — ÜRETİME HAZIR DEĞİL.** Otomatik testler
  **162/162 geçiyor**; fiziksel telefon kabulü ve yayım henüz yapılmadı.
- Aşağıdaki `Current Status`, `What Works`, `Tested & Verified`,
  `Performance`, `Browser Support`, `Deployment` bölümleri tarihsel MVP
  notlarıdır; güncel kabul kanıtı değildir. Doğrulanmış durum bu dosyanın
  sonundaki Faz 1A/1B/2A/2B/3A/4A/4B bölümlerindedir.

## Current Status (tarihsel — güncel durumu anlatmaz)

🟢 **[TARİHSEL]** ~~PROTOTIP HAZIR - v1.0~~ - Tüm temel özellikler işlevsel, kullanıma hazır

## What Works ✅ (tarihsel liste — güncel kabul kanıtı değildir)

### Core Features

- ✅ 5-Box Leitner Spaced Repetition System (1-2-4-7-30 gün)
- ✅ Deck Management (Create, Read, Update, Delete)
- ✅ Card Management with Categories
- ✅ Leitner Box Progression Logic (Correct → +1 box, Wrong → -1 box)
- ✅ Automatic Schedule Calculation
- ✅ Shuffle Algorithm (Fisher-Yates)
- ✅ Study Session with Flip Animations

### UI/UX

- ✅ Dark Mode (default) + Light Mode (V3 fully working)
- ✅ Modal Panel Confirmations (no browser dialogs)
- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Flip Card Animations (CSS 3D transforms)
- ✅ Progress Bar Tracking
- ✅ Toast Notifications
- ✅ Header Navigation with Icons
- ✅ Turkish Language UI

### Data Management

- ✅ LocalStorage Persistence
- ✅ JSON Export (Full Backup)
- ✅ JSON Import (Data Restore)
- ✅ Reset All Data Option
- ✅ Auto-save on Every Action

### Pages

- ✅ index.html - Main page with deck listing
- ✅ deckpage.html - Deck management and card CRUD
- ✅ workpage.html - Study interface
- ✅ statistics.html - Analytics dashboard
- ✅ settings.html - Theme toggle, data management

### JavaScript Modules

- ✅ app.js - Main application logic
- ✅ deckpage.js - Deck page logic
- ✅ settings.js - Settings page with theme management
- ✅ statistics.js - Statistics calculations
- ✅ storage.js - LocalStorage CRUD operations
- ✅ utils.js - Helper functions
- ✅ test-data.js - Test data generator

## What's Left to Build 📋

### Phase 3: Optional Features (Future Enhancements)

- [ ] Search and Filtering
- [ ] Category-wise Filtering
- [ ] Bulk Card Operations
- [ ] Sound Effects
- [ ] Advanced Statistics (Time spent, streak counter)
- [ ] Cloud Sync (Backend required)
- [ ] Mobile App Version
- [ ] Weekly/Monthly Statistics
- [ ] Card Difficulty Rating
- [ ] Tags Support

## Known Issues Fixed

- ✅ New cards not appearing - FIXED (lastReviewDate === null check)
- ✅ Auto-redirect not working - FIXED (currentCardIndex >= length check)
- ✅ Reset data not functioning - FIXED (hardcoded localStorage keys)
- ✅ Light theme CSS issues - FIXED (!important flag + full element override)
- ✅ Activity chart errors - FIXED (feature removed for now)

## Tested & Verified (tarihsel — güncel kabul kanıtı değildir)

- ✅ Deck creation and deletion
- ✅ Card creation, editing, deletion
- ✅ Leitner progression logic
- ✅ Box regression on wrong answers
- ✅ JSON export/import functionality
- ✅ Flip card animation
- ✅ Responsive design on all screen sizes
- ✅ Theme persistence across reloads
- ✅ Dark and light modes fully functional
- ✅ Modal confirmations working
- ✅ Statistics calculations accurate
- ✅ Browser compatibility (Chrome, Firefox, Safari)

## Files Overview

**HTML Pages (5)**

- index.html - 252 lines
- deckpage.html - 177 lines
- workpage.html - 182 lines
- statistics.html - 187 lines
- settings.html - 223 lines

**JavaScript Modules (7)**

- app.js - 450 lines
- deckpage.js - 280 lines
- settings.js - 210 lines
- statistics.js - 146 lines
- storage.js - 267 lines
- utils.js - Helper functions
- test-data.js - Test data generator

**Memory Bank (6 docs)**

- projectbrief.md - Project goals
- productContext.md - User experience
- systemPatterns.md - Architecture
- techContext.md - Tech stack
- activeContext.md - Current state
- progress.md - This file

## Performance (tarihsel iddia — yeniden ölçülmedi)

- All operations instant (LocalStorage)
- No network latency
- Smooth animations (60fps)
- < 1MB total application size
- Supports unlimited decks/cards (browser storage limit ~5-10MB)

## Browser Support (tarihsel iddia — yeniden doğrulanmadı)

- ❓ Chrome/Chromium (yeniden doğrulanmadı)
- ❓ Firefox (yeniden doğrulanmadı)
- ❓ Safari (yeniden doğrulanmadı)
- ❓ Mobile browsers (iOS Safari, Chrome Mobile) (yeniden doğrulanmadı)

## Deployment (tarihsel not — yayım bu fazın dışında)

The application is ready for deployment (tarihsel not — yayım bu fazın dışında):

1. Copy all files to a web server
2. Open index.html in browser
3. No backend or build process required
4. Works offline (data stored in LocalStorage)

## Next Steps

1. User testing and feedback collection
2. Bug reports and edge case handling
3. Phase 3 feature implementation
4. Optional: Backend integration for cloud sync
5. Optional: Mobile app version using same codebase

## What Works in Detail

✅ **Ana Sayfa (index.html)**

- Deste listesi render edilir
- Her deste için kutu özeti gösterilir
- "Çalış" butonu ile çalışma başlatılır
- "Kartlar" butonu ile deckpage.html'ye gidilir
- Yeni deste oluşturma formu
- ✨ **Modal panel onay sistemi**: Desto silme işlemi browser confirm() yerine styled modal panel kullanıyor
- ✨ **Header butonları**: İstatistikler (bar_chart) ve Ayarlar (settings) butonları

✅ **İstatistikler Sayfası (statistics.html)**

- Toplam kartlar
- Master seviyesi (Kutu 5)
- Başarı oranı (%)
- Bugün çalışılan kartlar
- Kutu dağılımı (visual cards)
- Son 7 gün aktivitesi (bar chart)
- Deste istatistikleri (kutu bazlı)
- navigation: back to index

✅ **Ayarlar Sayfası (settings.html)**

- Tema seçimi (açık/koyu)
- Verileri İndir (JSON export)
- Verileri Yükle (JSON import)
- Tüm Verileri Sil (with confirmation modal)
- Hakkında bölümü
- GitHub link
- navigation: back to index

✅ **Deste Yönetimi (deckpage.html)**

- Deste kartlarını göster
- Yeni kart ekle (soru, cevap, kategori)
- Kartı sil
- Destoyu sil (tüm kartlarla)
- Kategori desteği
- ✨ **Modal panel onay sistemi**: Kart ve desto silme işlemleri browser confirm() yerine styled modal panel kullanıyor

✅ **Çalışma Sayfası (workpage.html)**

- Tekrar edilmesi gereken kartlar shuffle'lanıyor
- Kart flip animasyonu (tıkla = döner)
- "Bildim" = sonraki kutuya
- "Bilemedim" = önceki kutuya (Kutu 1'de kalır)
- İlerleme göstergesi
- Çalışma tamamlandı mesajı (Tebrikler ekranı)
- ✨ **Modal panel onay sistemi**: Çalışmadan çıkış (close button) modal panel ile onay soruyor, browser confirm() kullanmıyor

✅ **JavaScript Modülleri**

- storage.js: LocalStorage management
- utils.js: Yardımcı fonksiyonlar
- app.js: Ana sayfa ve çalışma sayfası
- deckpage.js: Deste yönetimi

## Known Issues

- ✅ **FIXED**: Yeni eklenen kartlar çalışılmıyordu

  - Sebep: lastReviewDate = null kontrolü
  - Çözüm: Yeni kartlar HEMEN gösterilir

- ✅ **FIXED**: Çalışma tamamlandıktan sonra otomatik çıkmıyordu

  - V1 Hatası: renderCard() içinde `this.currentCards.length === 0` kontrolü asla true olamıyordu
  - Sebep: handleCardResponse() içinde currentCardIndex artırılıp hemen renderCard() çağrılıyor, ama currentCards array hiç boşalmıyor
  - V2 Çözümü: handleCardResponse() içinde `this.currentCardIndex >= this.currentCards.length` karşılaştırması yapılıyor
  - Sonuç: Son karttan sonra hemen showStudyComplete() çağrılıyor

- ✅ **FIXED**: Tüm verileri sil işlevi çalışmıyordu
  - Sebep: settings.js'de resetAllData() içinde Storage.STORAGE_KEYS.DECKS/CARDS kullanılıyordu ama bu static property olmadığı için undefined hata veriyordu
  - Çözüm: localStorage key'lerini doğrudan string olarak belirtildi ('leitner_decks', 'leitner_cards')

## Testing Done

- Deste oluşturma ve silme ✅
- Kart ekleme ve silme ✅
- Leitner progression logic ✅
- JSON export/import ✅
- Flip animasyonu ✅
- Responsive tasarım ✅
- İstatistik sayfası gösterim ✅
- Tema toggle ✅
- Tüm verileri sil ✅

## Next Steps (İsteğe Bağlı)

1. Kategori filtreleme
2. Bulk operations
3. Sync ve backup özellikleri
4. Mobile app versiyonu
5. Arama ve gelişmiş filtreleme

## 2026-09-22 — Restoration preparation (ChatGPT, tarihsel)

- The existing application source and behavior have **not** been refactored; this preparation changes public attribution links, copyright holder display, repository hygiene and README only.
- Working copy supplied for the next phase intentionally excludes the prior `.git` directory. Do not infer that a new Git repository, publication, build or browser acceptance has already happened. Keep the original clone as a backup until the final publication stage.
- Historical claims above about production readiness, browser compatibility and performance are **not revalidated** and must not be treated as current acceptance evidence.
- The existing MIT license text is retained provisionally; reconfirm license/third-party asset eligibility before publication.
- Source audit targets: reconcile wrong-answer behavior with product intent (current `Storage.updateCardBox` moves back one box), validate imported JSON shape and card relationships before mutating persistent data, check storage corruption/quota, verify responsive/keyboard flow and CDN-dependent offline claims.
- Next step: full read of `AGENTS.md` and all six Memory Bank files, detailed repository audit and Keep / Improve / Remove, then phased fixes, proportionate tests, real browser/manual acceptance and publication gate.

## 2026-09-22 — Restoration Phase 1A (uygulandı; tarayıcı kabulü bekliyor)

### Doğrulanan (testli)

- Deste/kart CRUD, deste silmede kartların kaskad silinmesi.
- Leitner: doğru +1 (en fazla 5), yanlış -1 (en az 1), yeni kart hemen vade,
  kutu aralıkları 1/2/4/7/30 gün ve vade sınır davranışı.
- Dışa aktarma biçimi `{decks, cards, exportedAt}`.
- Geçerli eski yedekler (ek zararsız alanlar dahil) içe aktarılır ve aynen korunur.
- 30 geçersiz yedek sınıfı reddedilir, mevcut veri değişmez; hata mesajları
  yedek içeriği sızdırmaz.
- Kısmi yazma: kart yazımı başarısız olursa deste yazımı geri alınır;
  geri alma başarısız olursa `rollback-failed` raporlanır.
- Bozuk depo boş depo gibi davranılmaz; yazma hataları başarı bildirilmez.
- İçe aktarma öncesi mevcut uygulama içi modal onay (iptal veriyi değiştirmez,
  aynı dosya tekrar seçilebilir); Türkçe başarı/hata/iptal bildirimleri.

### Test sonuçları

- `node --test tests/*.test.js`: **53/53 geçti** (8 grup).
- Orijinal koda karşı taban: 13 geçti / 40 kaldı (doğrulama ve koruma yokluğu).
- Sözdizimi: 7 uygulama + 3 test dosyası `node --check` ile geçti.
- Tarayıcı otomasyonu yapılamadı (ortamda tarayıcı yok); manuel kabul listesi
  final raporda ve aşağıda.

### Bilinen sınırlamalar / sonraki faza kalanlar

- ID kalıbı tutucudur (`^[A-Za-z0-9_-]{1,128}$`); satır içi `onclick`
  nitelikleri duruyor — olay yetkilendirme (event delegation) Faz 1B.
- Bozuk depoda sayfa düzeyinde genel hata bandı yok; okuma hataları çağrıldığı
  yerde fırlatır (üzerine yazmaz). Genel UI hata yönetimi Faz 1B.
- Ayrı localStorage yazımları gerçek atomiklik sağlamaz (en iyi çaba geri alma).
- Yukarıdaki tarihsel "üretime hazır / tüm tarayıcılarda doğrulandı" iddiaları
  güncel kabul kanıtı değildir.

### Manuel kabul listesi (sahip onayı bekliyor)

1. Deste + kart oluştur; sayfayı yenile, veriler duruyor.
2. Ayarlar'dan yedek indir; dosyayı metin olarak aç, `{decks, cards}` yapısını gör.
3. Geçerli yedeği yükle: onay modalı deste/kart sayısını gösteriyor mu?
   Onayla: veriler geldi + "Veriler başarıyla yüklendi!" bildirimi.
4. İptal: modalda İptal'e bas; mevcut veri değişmedi + "İçe aktarma iptal edildi".
5. Geçersiz yedek (örn. `{"decks":[],"cards":[{"id":"x"}]}`): "Geçersiz yedek" hatası,
   mevcut veri değişmedi; aynı dosya tekrar seçilebiliyor.
6. Açık/koyu tema ve istatistik sayfası önceki gibi çalışıyor.

## 2026-09-22 — Restoration Phase 1B (uygulandı; tarayıcı kabulü bekliyor)

### Değişiklikler

- `js/app.js`: oturum kilidi (`isResponding`), çizim jetonu (`_renderToken`),
  tek seferlik tamamlama; `keydown` kısayolları (modal/açık-alan/`repeat`
  korumalı); flip kartı `role="button"` + `tabindex="0"` + Enter;
  `data-action` yetkilendirme (sil/çalış/kartlar/ana-sayfa); `escapeAttr`;
  `encodeURIComponent` ile deste URL'si; bozuk-depo paneli + düğme kilidi;
  okuma korumaları (`deleteDeck`, `startStudy`); tema okuma koruması;
  `[Debug]` konsol satırı kaldırıldı.
- `js/deckpage.js`: `data-action` yetkilendirme (kart sil); `escapeAttr`;
  bozuk-depo paneli + başlık; okuma/yazma korumaları; tema okuma koruması.
- `js/statistics.js`: çizim hatasında sayfa-üstü panel; tema okuma koruması.
- `js/settings.js`: `resetAllData` sonuç-nesnesi bildirimi
  (başarı / korundu / geri-yüklenemedi); tema okuma koruması.
- `js/storage.js`: `clearAll` geri-almalı sonuç nesnesi; ID yorumu güncellendi.
- `js/utils.js`: `Utils.showStorageError` (sabit Türkçe panel).
- `workpage.html`: `#flip-card:focus-visible` çerçevesi.
- Doğrulama kuralları, Leitner davranışı, yedek biçimi değişmedi.

### Test sonuçları

- `node --test tests/*.test.js`: **79/79 geçti** (17 grup).
  53 Faz-1A testi korundu; 26 yeni test (`study.test.js`: 13, `reset.test.js`: 7,
  `errorstate.test.js`: 7, `import.test.js` uyumluluk: 1).
- `node --check`: 7 uygulama + 5 test/yardımcı dosyası, **14/14 geçti**.
- Tarayıcı otomasyonu yapılamadı (ortamda tarayıcı yok).

### Kalan sınırlamalar

- Ayrı LocalStorage işlemleri gerçek atomik değildir (en iyi çaba geri alma).
- Bozuk-depo paneli sayfa giriş çizimlerini kapsar; oturum-ortası bozulmalar
  işlem bazında hata bildirir.
- Space, odaklı yanıt düğmesinde bile kartı çevirir (kısayol tanımı gereği).
- `totalCards` sayacı ikinci yazım hatasında bayat kalabilir (görünüm canlı
  istatistik kullanır).

### Manuel kabul listesi (sahip onayı bekliyor)

1. Çalışma: karta yanıt ver, 300 ms içinde tekrar tıkla/bas — ikinci kart
   erken işlenmiyor; düğmeler kilitli görünüyor, sonra açılıyor.
2. Klavye: Space çevirir; 1/Sol yanlış, 2/Sağ doğru; basılı tutma tek kart
   işler; modal açıkken ve (varsa) metin alanındayken kısayol susar;
   Tab ile karta odaklanınca görünür çerçeve çıkar, Enter çevirir.
3. Deste/kart sil, çalış başlat, kartlar sayfasına git — hepsi eskisi gibi çalışır.
4. Bozuk depo: `leitner_decks` anahtarına geçersiz JSON yazıp sayfaları yenile —
   her sayfada Türkçe panel, veri silinmez, Ayarlar bağlantısı çalışır.
5. Sıfırlama: Ayarlar → Tüm Verileri Sil → onay → başarı bildirimi.
6. Eski yedek içe aktarma (Faz 1A listesi) hâlâ çalışıyor.
7. Bozuk kart regresyonu: `leitner_cards` anahtarına geçersiz JSON yazıp
   geçerli bir oturumla çalışma sayfasını aç — panel hemen görünür,
   düğmeler kilitli, ham değer korunur.

## 2026-09-22 — Faz 1B hedefli düzeltme (kart-bozukluğu regresyonu)

- Kök neden: `initWorkPage` yalnızca `getDecks()` okumasını deniyordu;
  kart JSON'u bozukken oturum kartı normal çiziliyordu.
- Düzeltme: çizimden önce `void Storage.getCards()` yoklaması; bozuksa mevcut
  panel + düğme kilidi, yazma/ilerleme yok. Değişen dosya: `js/app.js` (3 satır)
  ve `tests/errorstate.test.js` (1 regresyon testi). Sonuç: **79/79**, 14/14.
- Tarayıcı kabulü yapılmadı; gerçek-tarayıcı doğrulaması sahibe ait.

## 2026-09-22 — Restoration Phase 2A (uygulandı; tarayıcı kabulü bekliyor)

### Denetim (Keep / Improve / Remove)

- Keep: beş sayfa yapısı, Tailwind + sayfa-içi stil, veri sözleşmeleri, Leitner
  ve oturum korumaları, yetkilendirme deseni, modal/toast görsel dili, tema
  mimarisi, Türkçe arayüz, mevcut çöken ızgaralar ve `max-w-[90%]` paneli.
- Improve: dar başlıklar, üst üste binen satırlar, etiketsiz girdiler, küçük
  simge hedefleri, taşan uzun metinler, odak görünmezliği, hareketsiz
  animasyonlar, anlamsız iletişim kutuları, dar bildirimler (aşağıda).
- Remove: başlıktaki `whitespace-nowrap` (taşma nedeni); başka silme yok.
  Yeni çerçeve/bağımlılık/özellik eklenmedi.

### Değişiklikler

- `index.html`: atlama bağlantısı, daralan başlık, 44px simge adları, dikey
  deste formu + gizli etiket + 16px girdi, kayan modal semantiği, odak/hareket CSS'i.
- `deckpage.html`: atlama bağlantısı, başlık adları, `for` etiketleri + 16px
  girdiler, modal semantiği, odak/hareket CSS'i.
- `workpage.html`: atlama bağlantısı, kapatma adı, duyarlı kart
  (`min-h`, metin boyutu, `break-words`), 380px altı yığılan yanıt düğmeleri,
  `role="progressbar"` + `aria-live`, modal semantiği, odak/hareket CSS'i.
- `statistics.html`: atlama bağlantısı, başlık adları, 2 sütunlu kutu ızgarası,
  odak/hareket CSS'i.
- `settings.html`: atlama bağlantısı, başlık adları, yığılan tema satırı +
  adlı tema grubu, modal semantiği, odak/hareket CSS'i.
- `js/app.js`: modal odak/Escape/Tab/geri-dönüş; deste silme adı + hedef boyutu;
  kart metin `break-words` + duyarlı boyut; ilerleme aria değerleri.
- `js/deckpage.js`, `js/settings.js`: aynı modal odak davranışı.
- `js/statistics.js`: deste istatistik ızgarası `grid-cols-2 sm:grid-cols-5`.
- `js/utils.js`: bildirim `max-width` + `role="status"`; hata paneli `role="alert"`.
- İş mantığı, doğrulama, yedek biçimi, oturum korumaları değişmedi.

### Test sonuçları

- `node --test tests/*.test.js`: **103/103 geçti** (22 grup).
  79 test korundu; 24 yeni (`tests/a11y.test.js`: statik denetim + dinamik
  çıktı + bildirim + modal odağı + ilerleme).
- `node --check`: 7 uygulama + 8 test/yardımcı dosyası, **15/15 geçti**.
- Tarayıcı otomasyonu yapılamadı (ortamda tarayıcı yok); CSS/duyarlılık
  Node testleriyle kanıtlanmaz — manuel kabul şart.

### Manuel kabul listesi (sahip onayı bekliyor)

1. 320/375/390/430/768/1024/1440px genişliklerde beş sayfa: yatay kayma yok,
   başlık ve düğmeler taşmıyor, formlar rahat kullanılıyor (açık + koyu tema).
2. Uzun deste/kart adı ve kategoriler kutuları bozmuyor.
3. Çalışma: kart ve yanıt düğmeleri dar ekranda rahat; yatay modda sayfa
   kayarak kullanılabilir; animasyonlar `azaltılmış hareket`te duruyor.
4. Klavye: Tab sırası mantıklı, odak çerçevesi görünür, atlama bağlantısı
   çalışıyor; modal açılınca odak iptalde, Escape iptal ediyor, Tab dışarı
   kaçmıyor, kapanınca odak geri dönüyor.
5. Kısa mesajlı ve uzun mesajlı onaylar dar/kısa ekranda okunuyor.
6. Faz 1A/1B manuel listeleri hâlâ geçiyor.

### Kalan sınırlamalar

- Gerçek cihaz/tarayıcı kabulü yapılmadı; yalnızca statik + sahte-DOM testleri var.
- Renk/kontrast cilası Faz 2B'ye bırakıldı (mimari aynı).
- Çevrimdışı/CDN iddiaları son teknik denetime bırakıldı.

## 2026-09-22 — Restoration Phase 2B (uygulandı; tarayıcı kabulü bekliyor)

### Denetim (Keep / Improve / Remove)

- Keep: beş sayfa yapısı, JS'ye bağlı tüm kimlikler, yetkilendirme, modal/
  bildirim mantığı ve görsel dili, tema mimarisi, Türkçe ton, kutu içeriği
  modeli, masaüstü eğitim paneli (olduğu gibi), tüm korumalar.
- Improve: sade karşılama bloğu, çıplak boş-deste metni, mobilde gizlenen
  eğitim paneli, hareketsiz ilk yükleme (aşağıda).
- Remove: işlevsel silme yok; karşılama bloğu ve boş-deste metni yenilendi.

### Değişiklikler

- `index.html`: kahraman bölümü (üst bilgi, alt metin, "Hemen başla" +
  "Nasıl çalışır?" bağlantısı, canlı özet, süs gradyanları), birincil
  oluşturma paneli (başlık + vurgu çizgisi), "Destelerim" başlığı, mobil
  "Nasıl çalışır?" bölümü (yerel `<details>` akordiyonu), `riseIn` animasyonları.
- `js/app.js`: `renderHeroStats()` (gerçek sayılar, sessiz geri dönüş),
  kahraman CTA odak kaydırma (azaltılmış-hareket uyumlu), 3 adımlı
  ilk-çalıştırma şablonu. Kutu şablonu, oturum, klavye, modal değişmedi.
- Diğer 4 sayfa yapısal olarak değişmedi (paylaşılan dil yeterli görüldü).

### Test sonuçları

- `node --test tests/*.test.js`: **110/110 geçti** (25 grup).
  103 test korundu; 7 yeni (`tests/home.test.js`: yapı + ilk-çalıştırma +
  özet sayaçları + odak + bozuk-depo).
- `node --check`: 7 uygulama + 9 test/yardımcı dosyası, **16/16 geçti**.
- Tarayıcı otomasyonu yapılamadı; görsel sonuç Node testleriyle kanıtlanmaz.

### Manuel kabul listesi (YÜRÜRLÜKTEN KALKTI — güncel liste Phase 2B Revision bölümündedir)

1. İlk açılış: karşılama + oluşturma paneli davetkâr görünüyor; "Hemen başla"
   girdiye kaydırıp odaklıyor; animasyonlar kısa ve engellemiyor.
2. Deste yokken 3 adımlı kart yol gösteriyor; ilk deste + kart + çalışma akışı
   eskisi gibi çalışıyor.
3. Mobilde "Nasıl çalışır?" bölümü derli toplu görünüyor, akordiyon klavye +
   ekran okuyucuyla açılıyor; masaüstünde yan panel duruyor.
4. Açık + koyu temada kahraman/oluşturma/eğitim okunaklı; azaltılmış harekette
   giriş animasyonları duruyor.
5. Faz 1A/1B/2A manuel listeleri hâlâ geçiyor.

### Kalan sınırlamalar

- Gerçek tarayıcı/görsel kabul yapılmadı.
- Eğitim metni iki kaynakta yaşar (masaüstü panel + mobil özet); değişince
  ikisi güncellenmeli.
- Özet sayaçları yalnızca açılışta hesaplanır (canlı güncellenmez).
- Çevrimdışı/CDN denetimi ve yayım sonraki faza bırakıldı.

## 2026-09-22 — Phase 2B Revision: bütünsel yeniden tasarım (tarayıcı kabulü bekliyor)

### Sahip geri bildirimi ve kapsam değişikliği

- Önceki 2B kararları (yan paneli koruma, diğer sayfaları değiştirmeden
  bırakma) yürürlükten kalktı; bu bölümdeki yeni tasarım geçerlidir.
- Beş sayfanın tamamı aynı görsel dile getirildi; davranış ve korumalar aynı.

### Değişiklikler

- `css/app.css` (yeni, 5 sayfada bağlı): sayfa girişi, kart kaldırma, kutu
  girişi, bildirim animasyonları (4 sayfadaki eksik `slideIn`/`slideOut`
  bu sayede tamamlandı). Renk kuralı içermez.
- `index.html`: yan panel SİLİNDİ (`max-w-5xl`, esnek ana akış); kahramana
  gömülü tek oluşturma formu (yedek "Hemen başla" kaldırıldı); "Destelerim";
  tek "Nasıl çalışır?" bölümü (5 kutu adımı + doğru ilerleme/gerileme +
  `<details>` açıklaması, aralıklar 1/2/4/7/30).
- `js/app.js`: vade rozetli + kutu şeritli (gerçek oranlı çubuklar) kutular,
  birincil "Çalış" + sakin "Kartlar", yumuşak çalışma kartı (yanıt rozeti,
  kutu bağlamı satırı), özetli tamamlama ekranı. Oturum/klavye/ilerleme aynı.
- `deckpage.html` + `js/deckpage.js`: alt başlık sayaçları, sayaçlı liste
  başlığı, boş durum kartı, kaldırma efektli kutular.
- `workpage.html`: giriş animasyonu, basma geri bildirimli yanıt düğmeleri.
- `statistics.html` + `js/statistics.js`: başlık bloğu, kaldırmalı kartlar,
  gerçek oranlı kutu çubukları, boş yönlendirme.
- `settings.html`: bölmeli tema kontrolü, çerçeveli sıfırlama; JS değişmedi.

### Test sonuçları

- `node --test tests/*.test.js`: **117/117 geçti** (25→30 grup).
  110 test korundu (2'si yeni tasarımla çeliştiği için güncellendi:
  yedek düğme/panel beklentileri); 7 yeni (`tests/home.test.js` güncellendi,
  `tests/redesign.test.js` yeni: tamamlama, kutu bağlamı, alt başlık,
  çubuklar, paylaşılan stil).
- `node --check`: **17/17 geçti** (8 uygulama + 9 test/yardımcı JS dosyası;
  CSS dosyası gözle denetlendi).
- Tarayıcı otomasyonu yapılamadı; görsel sonuç Node testleriyle kanıtlanmaz.

### Manuel kabul listesi (sahip onayı bekliyor)

1. Ana sayfa ilk açılış: davetkâr kahraman, tek form, 3 adım; yan panel yok.
2. Deste kutuları: vade rozeti, kutu şeridi, birincil Çalış; uzun adlar taşmıyor.
3. Eğitim bölümü tüm boylarda tek ve tutarlı; akordiyon çalışıyor.
4. Deste/çalışma/istatistik/ayarlar sayfaları aynı dili konuşuyor; açık + koyu
   tema okunaklı; animasyonlar kısa, azaltılmış harekette duruyor.
5. Faz 1A/1B/2A işlev listeleri hâlâ geçiyor.

### Kalan sınırlamalar

- Gerçek tarayıcı/görsel kabul yapılmadı.
- Kahraman özeti ve sayaçlar açılışta hesaplanır.
- Çevrimdışı/CDN denetimi ve yayım sonraki faza bırakıldı.

## 2026-09-23 — Restoration Phase 3A: teknik denetim + odaklı temizlik

### Denetim özeti (Keep / Improve / Remove)

- Keep: beş sayfa mimarisi, vanilla JS + Tailwind + `css/app.css`, Leitner
  mantığı, doğrulama/geri alma/oturum/klavye/odak korumaları, yetkilendirme,
  modal/bildirim sistemleri, tema mimarisi, Türkçe arayüz, test altyapısı.
- Improve: ölü kod kaldırıldı, README doğruluğu artırıldı (aşağıda).
- Remove: çağrılmayan `formatDateTime`, `calculateProgress`, `daysDifference`,
  `getCardsByBox`, ölü `.reveal-2` kuralı. Başka silme yok.

### Güvenlik ve gizlilik

- Gizli bilgi, kimlik, e-posta, makine yolu, jeton/parola: YOK (taramayla doğrulandı).
- Satır içi olay: YOK (testlerle korunuyor). `eval`/`Function`/ağ çağrısı: YOK.
- Tüm `innerHTML` noktaları kaçışlı/sabit içerik; yönlendirmeler sabit sayfa
  adları (tek sorgu dizesi `encodeURIComponent` ile kurulur).
- Testlerdeki "Gizli*" dizeleri sentetik sızıntı-test verisidir.
- Kimlik: `akcealan` bağlantıları amaçlanan kimliktir; eski kimlik yok.
- Geçerlilik/geri alma/güvenli çizim korumaları aynen duruyor.

### Bağımlılık ve dış kaynaklar

- Gerekli: Tailwind Play CDN (tüm düzen), Inter + Material Symbols (tipografi,
  simgeler). Hepsi HTTP 200 ile canlı doğrulandı.
- Veri yereldir (LocalStorage) ama uygulama soğuk çevrimdışıda STİLSSİZ
  çalışmaz: Tailwind betiği her yüklemede ağ ister. README bu ayrımı doğru
  anlatır; service worker/paket yöneticisi eklenmedi.
- Üçüncü taraf: Tailwind (MIT), Inter (OFL), Material Symbols (Apache-2.0);
  tamamı CDN bağlantısı, yeniden dağıtım yok. Lisans (MIT/akcealan) aynen durur;
  nihai lisans onayı sahibin kararıdır.

### Depo hijyeni

- Gereksiz dosya/derleme çıktısı/geçici dosya: YOK. `.gitignore` yeterli.
- `test-data.js` geliştirici yardımcısı bu fazdan sonra kaldırıldı
  (aşağıdaki yayım-hazırlığı bölümüne bakın).

### Doğrulama

- `node --test tests/*.test.js`: **117/117 geçti** (30 grup).
- `node --check`: **16/16 geçti** (`test-data.js` silindiği için 17→16).
  Davranış değişikliği yok; tek satırlık yokluk denetimi dışında yeni test gerekmedi.
- Birincil akış (deste→kart→çalışma→istatistik→yedek→sıfırlama) statik olarak
  gözden geçirildi; kusur bulunamadı.
- Tarayıcı otomasyonu yok; fiziksel telefon (özellikle sanal klavye) bekliyor.

### Son manuel kabul listesi (sahip)

1. Fiziksel telefonda: form odaklama + sanal klavye, dokunma hedefleri,
   açık/koyu tema, tam çalışma akışı, yedek içe/dışa aktarma onayı, sıfırlama.
2. Dar ekran düzeni ve yatay mod; 2-3 masaüstü tarayıcıda duman testi.
3. Faz 1A/1B/2A/2B işlev listelerinde gerileme yok.

### Yayın engelleri ve sahip kararları

- Engel: fiziksel telefon kabulü tamamlanmadı.
- Engel: yayım hedefi ve GitHub deposu kararı sahibe ait (bağlantı hedefi
  mevcuttur; bu, yayım iddiası değildir).
- Karar: MIT lisans metninin yayım öncesi nihai onayı.
- Kod tarafında yayın engelleyici bulunamadı.

## 2026-09-24 — Yayım hazırlığı: kullanılmayan geliştirme yardımcısı kaldırıldı

- Doğrulama: `loadTestData`/`clearAllData` işlevlerine uygulama kodu ve
  testler hiç başvurmuyordu; dosyayı yükleyen tek satır `index.html`
  içindeki ekleme etiketiydi. Gerçek bağımlılık bulunamadı.
- Değişiklik: `index.html` ekleme etiketi silindi, `js/test-data.js` silindi,
  yerine başka yardımcı konmadı. Beş sayfa gerekli betikleri aynen yüklüyor.
- Koruma: `tests/home.test.js` ana sayfada `test-data` geçmemesini denetler.
- Sonuç: **117/117 geçti**, sözdizimi **16/16 geçti**. Davranış değişmedi.
- Kalan: fiziksel telefon kabulü, yayım kararı (sahip). Git yok, yayım yok.

## Etiket değişikliği: "Bunu Bildim" → "Bildim" (yalnızca görünen metin)

- `workpage.html` doğru-cevap düğmesi kısaltıldı; test beklentisi yoktu,
  davranış/kısayol/algoritma/tasarım aynı. Sonuç: **117/117**, **16/16**.

## 2026-09-23 — Phase 4A: Serbest Çalışma (kod-tamam, manuel kabul bekliyor)

- Ürün: destedeki TÜM kartlarla ek alıştırma; doğru/yanlış yanıtlar kutu, zaman damgası, sayaç ve istatistikleri değiştirmez.
- Giriş: deste kutusunda ikincil "Serbest Çalış" eylemi; boş destede bilgi bildirimi, gezinme yok.
- Kip: `sessionStorage.workMode` (`'free'` tam eşleşirse serbest, yoksa/geçersizse normal); URL sözleşmesi değişmedi.
- Sınır: yalnızca normal kip `Storage.updateCardBox` yoluna girer; testler tam-kayıt karşılaştırmayla korur.
- Sonuç: **139/139 geçti** (117 korundu), sözdizimi **17/17 geçti**. Bildirim ve 4B uygulanmadı.
- Kalan: sahip manuel kabulü (10 madde), fiziksel telefon, yayım kararı. Git yok, yayım yok.

## 2026-09-23 — Phase 4B: Tekrar Takvimi + kimlik + çıkış metni (kod-tamam, manuel kabul bekliyor)

- Takvim: deste+kutu gruplu, vade/gecikme/yaklaşan ayrımı, en erken zaman + açılabilir tüm liste; aynı kutudaki farklı zamanlar tekleştirilmez; yerel Bugün/Yarın/tarih+yıl; salt okunur, bozuk depoda hata satırı.
- Kimlik: `assets/favicon.svg` + 5 sayfada bağlantı ve başlık işareti; sekme görüntüsü tarayıcıda doğrulanmadı.
- Çıkış: serbestte doğru uyarı; normalde eski metin.
- Sonuç: **162/162 geçti** (139 korundu), sözdizimi **18/18 geçti**.
- Kalan: sahip manuel kabulü (aşağıdaki liste), fiziksel telefon, yayım kararı. Git yok, yayım yok.

### 4B manuel kabul listesi (sahip)

1. Vadesi gelen/geciken/yaklaşan kartları olan desteyle ana sayfayı aç: bölüm görünür, deste+kutu+sayı+yerel saat doğru.
2. Aynı kutuda farklı zamanlı kartlar: en erken zaman + "Tüm zamanlar" açılımı.
3. Serbest Çalışma sonrası takvim değişmedi; Normal Çalışma sonrası vade düştü.
4. Sekme simgesi görünüyor; 5 sayfada başlık işareti yerinde.
5. Mobil düzen, açık/koyu tema okunaklı.
6. Serbest çıkış uyarısı doğru; normal çıkış metni eski haliyle.
7. Bozuk depoda takvim hata satırı gösterir (kişisel veri yok).

### 4B bilinen sınırlamalar

- Sekme simgesi ve başlık işareti gerçek tarayıcıda görülmedi.
- Takvim açılışta + görünürlük/odak dönüşünde + 60 sn aralıkla tazelenir.
- Gece yarısı ve yaz/kış saati geçişleri mutlak milisaniye hesabıyla işler; etiketler yerel güne göre Bugün/Yarın ayrılır.
- Çok desteli görünümde bölüm uzayabilir (kaydırma gerekir).

### Yayım öncesi kalanlar

- Fiziksel telefon kabulü (4B dahil).
- Sekme simgesi gerçek sekmede görülmeli.
- Lisans nihai onayı (sahip).
- Git/yayım kararı (sahip).

## Kapanış (sahip manuel kabulü sonrası)

- Sayaç tazeliği kusuru ve düzeltmesi (yukarıdaki 4B bölümü); sonuç **164/164**, sözdizim **18/18**.
- Tek ZIP proje dışında; Git/yayım yapılmadı. Sonraki adım: sahip yayımı.
