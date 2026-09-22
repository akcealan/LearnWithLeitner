# System Patterns & Architecture

## Data Architecture

### LocalStorage Schema

```javascript
{
  "leitner_decks": [
    {
      id: "uuid-1",
      name: "Almanca",
      createdAt: timestamp,
      totalCards: 50
    }
  ],
  "leitner_cards": [
    {
      id: "uuid-2",
      deckId: "uuid-1",
      question: "Apple",
      answer: "Apfel",
      box: 1,
      category: "Meyveler",
      createdAt: timestamp,
      lastReviewDate: timestamp
    }
  ]
}
```

## Core Logic Patterns

### 1. Box Schedule (Tekrar Tarihi Hesaplama)

```
boxSchedule = {
  1: 1,    // 1 gün
  2: 2,    // 2 gün
  3: 4,    // 4 gün
  4: 7,    // 7 gün
  5: 30    // 30 gün
}

nextReviewDate = today + (boxSchedule[box] * 24 * 60 * 60 * 1000)
```

### 2. Box Progression Logic

```
if (userSaysRight) {
  if (box < 5) {
    card.box += 1
  }
} else {
  if (box > 1) {
    card.box -= 1
  } else {
    card.box = 1
  }
}
```

### 3. Card Filtering (Hangi Kartlar Gösterilecek)

- Kartın kutu numarasına bakılır
- `nextReviewDate <= now` olan kartlar gösterilir
- Gösterilen kartlar shuffle edilir (random order)

## Component Structure

### App.js

- LocalStorage'ı yönet
- Deck CRUD (Create, Read, Update, Delete)
- Card CRUD
- Box progression logic
- Veri import/export
- Modal panel management (showConfirmationModal, hideConfirmationModal)

### Confirmation Modal Pattern

Tüm sayfalar aynı modal pattern kullanır:

```html
<!-- Confirmation Modal -->
<div
  id="confirmation-modal"
  class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/50 backdrop-blur-sm"
>
  <div
    class="bg-card-dark rounded-xl border border-border-dark shadow-2xl shadow-black/50 w-96 max-w-[90%] p-6"
  >
    <h2 id="modal-title" class="text-xl font-bold text-slate-100 mb-2">
      Onay Gerekli
    </h2>
    <p id="modal-message" class="text-slate-400 text-sm mb-6"></p>
    <div class="flex gap-3">
      <button id="modal-cancel">İptal/Devam</button>
      <button id="modal-confirm">Sil/Çık</button>
    </div>
  </div>
</div>
```

Kullanım:

```javascript
this.showConfirmationModal(
  title, // Modal başlığı
  message, // Açıklama
  onConfirm // Callback function
);
```

Sayfalar:

- index.html: Desto silme
- deckpage.html: Kart silme, desto silme
- workpage.html: Çalışmadan çıkış

### index.html

- Deck listesi render
- Kutu özeti göster (her kutudaki kart sayısı)
- Yeni deste formu
- Çalışmaya başla linkler
- Modal panel (desto silme için)

### workpage.html

- Aktif kartı göster
- Flip animasyonu
- Response buttons (Bildim / Bilemedim)
- İlerleme bar
- Deste adı ve istatistik
- Modal panel (çalışmadan çıkış için)

### deckpage.html

- Deste kartlarını listele
- Yeni kart ekleme formu
- Kart silme butonu
- Deste silme butonu
- Modal panel (kart ve desto silme için)

### statistics.html

- Toplam kartlar
- Master seviyesi (Kutu 5)
- Başarı oranı (%)
- Bugün çalışılan kartlar
- Kutu dağılımı (visual display)
- Son 7 gün aktivitesi (bar chart - hover shows count)
- Deste bazlı istatistikler

### settings.html

- Tema seçimi (açık/koyu) - localStorage'a kaydedilir
- Veri yönetimi:
  - Verileri İndir (JSON export)
  - Verileri Yükle (JSON import)
  - Tüm Verileri Sil (with confirmation modal)
- Hakkında bölümü
- GitHub link

## State Management

- Tüm state LocalStorage'da tutulur
- App.js state'i manage eder ve HTML'e pass eder
- İndir/upload işlemleri JSON parser ile yapılır
- Tema tercihi `leitner_theme` key'inde saklanır (default: dark)

## Key Decisions

1. **Vanilla JS**: Framework dependency yok, basit ve hızlı
2. **Tailwind**: Styling hızlı ve consistent
3. **LocalStorage**: Basit ama yeterli MVP için
4. **UUID**: Card/Deck uniqueness için
5. **Separate pages**: Statistics ve Settings ayrı sayfalar (index.html'i temiz tutar)
6. **Tema toggle**: Dark by default, localStorage'a kaydedilir

## Faz 1A — Veri Doğrulama Sözleşmesi (2026-09-22, doğrulandı)

`Storage.validateBackup(data)` kalıcı yazma yapmaz; `Storage.importData(json)`
önce tamamen doğrular, sonra `_writeAll` ile yazar.

- Kök düz nesne olmalı; `decks` ve `cards` dizi olmalı (sınır: 20000 deste, 100000 kart).
- `exportedAt` varsa metin olmalı; bilinmeyen ek alanlara izin verilir ve aynen korunur.
- Deste: düz nesne; `id` `/^[A-Za-z0-9_-]{1,128}$/`; `name` 1-200 karakter (kırpılmış);
  `createdAt` geçerli zaman damgası; `totalCards` varsa >= 0 tamsayı; ID benzersizliği.
- Kart: `id` aynı kalıp + benzersiz; `deckId` kayıtlı destelerden biri olmalı
  (öksüz kart tüm yedeği reddeder, sessiz eleme yok); `question`/`answer`
  1-5000 karakter; `box` 1-5 tamsayı; `category` varsa metin (<= 200);
  `createdAt` geçerli; `lastReviewDate` yalnızca `null` veya geçerli zaman damgası.
- Zaman damgası: sonlu tamsayı, >= 0, şimdi + 1 gün toleransını aşmamalı.
- `__proto__` / `constructor` / `prototype` öz anahtarları reddedilir.
- Hata mesajları yedek içeriğini yansıtmaz; reddedilen yedek mevcut veriyi değiştirmez.

## Faz 1A — Kalıcılık ve Geri Alma (2026-09-22, doğrulandı)

- `getDecks`/`getCards`: anahtar yoksa `[]`; bozuk JSON/dizi-dışı değerde hata
  fırlatır (boş depo gibi davranıp üzerine yazmaz).
- `setDecks`/`setCards`: başarıda `true`, hatada fırlatır.
- `createDeck`/`createCard`: başarıda nesne, hatada `null`;
  `deleteDeck`/`deleteCard`: `true`/`false`; `updateCardBox`: kart veya `null`;
  `clearAll`: Faz 1B'den beri `{ok, code}` sonuç nesnesi
  (`ok`/`storage-error`/`rollback-failed`). Başarısız işlem başarı bildirilmez.
- `_writeAll`: yazmadan önce ham değerleri saklar; yazma yarıda kesilirse geri
  yüklemeyi dener (`storage-error`), geri alma da başarısız olursa
  `rollback-failed` raporlar. Ayrı localStorage yazımları gerçek atomiklik sağlamaz.
- İçe aktarma akışı (settings.js): dosya seçimi -> doğrulama -> mevcut uygulama
  içi onay modalı (deste/kart sayısını gösterir, "İçe Aktar" düğmesi) -> uygulama.
  İptal/geçersiz/hatalı durumda veri değişmez; dosya girdisi sıfırlanır
  (aynı dosya tekrar seçilebilir). Türkçe bildirimler: başarı, geçersiz yedek,
  depolama hatası, iptal.

## Faz 1B — Oturum, Olay Bağlama ve Hata UX (2026-09-22, doğrulandı)

- Çalışma oturumu (`app.js`): `isResponding` kilidi kart başına tek yanıtı
  zorlar; 300 ms gecikme korunur; `_renderToken` bayat zamanlayıcıları ezer;
  yazma hatası indeksi ilerletmez ve kilidi açar (yeniden deneme);
  `showStudyComplete` tek seferliktir; yanıt düğmeleri kilitte `disabled` +
  soluk görünür.
- Klavye (`keydown`): Space çevirir (odaklı düğme tetiklenmez), 1/Sol yanlış,
  2/Sağ doğru; `repeat`, açık modal ve düzenlenebilir odak kısayolları susturur.
  Flip kartı `role="button"` + `tabindex="0"` + Enter + `:focus-visible`.
- Olay bağlama: dinamik satır içi `onclick` yok. `decks-container` /
  `cards-container` üzerinde tek yetkilendirilmiş dinleyici, `data-action` +
  `data-id`, `escapeAttr` ile nitelik kaçışı, `encodeURIComponent` ile URL.
  Tamamlama düğmesi doğrudan bağlanır. Yedek doğrulama kuralları değişmedi.
- Bozuk depo UX (`Utils.showStorageError`, sabit metin): index/deckpage/
  workpage/statistics girişlerinde panel; silme yok, üzerine yazma yok,
  yıkıcı akışa yönlendirme yok; kurtarma Ayarlar'dan yedek yüklemedir.
  Çalışma sayfası çizimden önce deste ve kart okunabilirliğini ayrı ayrı
  doğrular (kart-bozukluğu regresyon düzeltmesi).
- Sıfırlama: `clearAll` geri-almalı sonuç nesnesi; ayarlar akışı onayı korur,
  kısmi silmeyi başarılı bildirmez, geri-alma hatasını ayrı raporlar.

## Faz 2A — Duyarlı Düzen ve Erişilebilirlik (2026-09-22, kısmen doğrulandı)

- Düzen: `truncate` + `min-w-0` başlıklar, `px-4` mobil dolgular, dikey formlar,
  16px girdiler, `break-words` kullanıcı metinleri, 2 sütunlu istatistik
  ızgaraları, `min-[380px]` yanıt düğmesi eşiği, duyarlı kart boyutları.
- Odak/hareket: genel `:focus-visible`, `prefers-reduced-motion`, atlama
  bağlantıları, programatik etiketler, `aria-label`/`aria-hidden`,
  `role="progressbar"` + `aria-live`, `role="status"`, `role="alert"`.
- İletişim kutuları: `role="dialog"` + `aria-modal` + ilişkiler,
  `max-h-[90vh]` kayan panel, 44px düğmeler; odak iptale girer, Escape iptal
  eder, Tab içeride döner, odak açana döner. Zaman uyumsuz davranış aynı.
- Testler: `tests/a11y.test.js`. Otomatik sonuç **103/103**.

## Faz 2B — Ana Sayfa ve Eğitim Sunumu (2026-09-22, kısmen doğrulandı)

- Kahraman: üst bilgi + alt metin + "Hemen başla" (odak kaydırma) +
  "Nasıl çalışır?" çapası + canlı özet (`renderHeroStats`, sessiz geri dönüş).
- İlk-çalıştırma: 3 adımlı kart (`renderDecks` boş dalı), eylemsiz, `onclick` yok.
- Eğitim: masaüstü `aside` aynen; mobil `xl:hidden` bölüm + `<details>`
  akordiyon (sıfır JS, klavye/ekran okuyucu uyumlu).
- Hareket: `riseIn` + kademeli kutu animasyonu; `prefers-reduced-motion`
  korur; intro bayrağı/izleme yok. Renkler mevcut tema jetonlarıyla sınırlı.

## Faz 2B Revision — Bütünsel Yeniden Tasarım (2026-09-22, kısmen doğrulandı)

- Önceki "yan paneli koru / diğer sayfaları değiştirme" kararları yürürlükten
  kalktı; bu bölüm geçerlidir.
- Paylaşılan dil: `css/app.css` (giriş, kaldırma, kutu/bildirim animasyonları;
  renksiz). Bileşenler mevcut Tailwind + tema jetonlarıyla yazılır.
- Ana sayfa: panele gömülü tek form, "Destelerim", vade rozeti + oranlı kutu
  şeridi, 3 adımlı ilk-çalıştırma; yan panel yok; tek eğitim bölümü
  (5 adım + ilerleme/gerileme + `<details>`, aralıklar 1/2/4/7/30).
- Diğer sayfalar: sayaçlı alt başlıklar, sakin kart, özetli tamamlama,
  oranlı çubuklar, bölmeli tema, çerçeveli sıfırlama. Davranış aynı.

## Faz 3A — Teknik Denetim + Odaklı Temizlik (2026-09-23, doğrulandı)

- Kaldırılan ölü kod: `formatDateTime`, `calculateProgress`, `daysDifference`,
  `getCardsByBox`, `.reveal-2` (çağrı noktası yok, suite yeşil).
- README: çalışma kısayolları, sıfırlama güvencesi, test komutları, üçüncü
  taraf (Tailwind/Inter/Material Symbols) satırları eklendi; iddia yok.
- Mimari, sözleşmeler, korumalar, tasarım değişmedi.

## Yayım Hazırlığı — Geliştirme Yardımcısı Kaldırma (2026-09-24, doğrulandı)

- `index.html` yalnızca `storage.js` + `utils.js` + `app.js` yükler;
  `js/test-data.js` bağımlılık bulunamadığı için silindi.
- `tests/home.test.js` yokluğu korur. Davranış ve tasarım değişmedi.

## Faz 4A — Serbest Çalışma Mimari Sınırı (2026-09-23, doğrulandı)

- Kip bayrağı: `app.studyMode` (`'normal'` varsayılan; `sessionStorage.workMode === 'free'` ise serbest).
- Seçim: normal `Storage.getCardsDueForReview`, serbest `Storage.getCardsByDeck` (tümü) + karıştırma.
- Değişiklik noktası: `handleCardResponse` içinde yalnızca normal kip `Storage.updateCardBox` çağırır; serbest kip depoya yazmaz, bellek-içi kartı değiştirmez.
- Oturum-içi (kart listesi, indeks, kilit, jeton) geçici; kalıcı (`box`, `lastReviewDate`, `totalCards`) yalnızca normal kip yazar.
- Arayüz: başlıkta kip rozeti, serbest açıklama satırı, serbest tamamlama (`go-deck`/`go-home`); klavye/kilit/panel aynen.

## Faz 4B — Tekrar Takvimi + Kimlik (2026-09-23, kısmen doğrulandı)

- Hesap: `getReviewSchedule(nowMs)` (ham kart + `BOX_SCHEDULE`, tek anlık görüntü); `formatReviewTime` yerelleştirir; kalıcı tarih dizesi saklanmaz.
- Çızim: `renderSchedule`/`renderScheduleDeck`/`renderScheduleBox` (kaçışlı metin); `refreshSchedule` yazmaz, hatada panel gösterir; `setupScheduleRefresh` tek bağ (görünürlük/odak/60sn).
- Kimlik: `assets/favicon.svg` + `data-app-mark` satır-içi `img` (boş `alt`); çıkış kip dallı (normal metin aynen).

## Kapanış notu: sayaç güncelleme (`renderHeroStats`, `renderDeckSubtitle`) yalnızca okuma görünümlerini tazeler; sözleşme ve korumalar aynen.
