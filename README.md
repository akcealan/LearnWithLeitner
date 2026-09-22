# LearnWithLeitner

Türkçe arayüzlü, tarayıcıda çalışan bir Leitner bilgi kartı uygulaması. Kendi destelerini oluştur, soru-cevap kartları ekle ve tekrar zamanı gelen kartları çalış.

## Özellikler

- **Beş kutulu tekrar:** Kutuların aralıkları sırasıyla **1, 2, 4, 7 ve 30 gün**. Bir kartı bildiğinde sonraki kutuya, bilemediğinde önceki kutuya geçer; ilk ve son kutu sınırları korunur.
- **Deste ve kart yönetimi:** Deste oluşturma ve silme; soru, cevap ve isteğe bağlı kategori ekleme.
- **Çalışma ekranı:** Kartı çevirme, *Bildim* / *Bilemedim* yanıtları, oturum ilerlemesi ve tamamlanma ekranı. Klavye kısayolları: **Space** kartı çevirir; **1 / Sol ok** bilemedim, **2 / Sağ ok** bildim.
- **Serbest Çalışma:** Vadesi gelmemiş kartlar dahil destedeki tüm kartlarla ek alıştırma; tekrar takvimini ve istatistikleri değiştirmez.
- **Tekrar Takvimi:** Ana sayfada deste ve kutu bazında yaklaşan/bekleyen tekrarlar; yerel tarih ve saatle, salt görüntüleme.
- **İstatistikler ve ayarlar:** Kutu dağılımı, tekrar bekleyen kartlar, açık/koyu tema, JSON yedeği içe/dışa aktarma ve onaylı veri sıfırlama.
- **Mobil kullanım:** Telefon ve masaüstü ekranlarına uyumlu arayüz.

### Tekrar zamanlaması ve bildirimler

Yeni eklenen kartlar hemen çalışılabilir. Daha önce çalışılan bir kart, **son çalışıldığı andan itibaren** bulunduğu kutunun aralığı dolduğunda tekrar listesine girer. Örneğin 2. kutudaki bir kart, son yanıtından **48 saat sonra** tekrar çalışılabilir duruma gelir; aralık henüz dolmadıysa normal **Çalış** oturumuna alınmaz. Süresi geçmiş kartlar tekrar listesinde kalır.

Uygulama **telefon, tarayıcı veya e-posta bildirimi göndermez**. Tekrar bekleyen kart sayısını görmek için uygulamayı açman veya sayfayı yenilemen gerekir.

### Çalışma kipleri

**Normal Çalışma:** Yalnızca tekrar zamanı gelen kartlar seçilir. *Bildim* yanıtı kartı bir üst kutuya, *Bilemedim* bir alt kutuya alır (1–5 sınırları korunur); son çalışma zamanı güncellenir ve sonraki tekrar buna göre planlanır.

**Serbest Çalışma:** Destedeki tüm kartlar (vadesi gelen/gelmeyen, tüm kutular, yeni kartlar) istenildiği zaman çalışılabilir. Doğru/yanlış yanıtlar kutuları değiştirmez; son çalışma zamanını, sonraki tekrar tarihlerini, sayaçları ve istatistikleri değiştirmez. Normal tekrar zamanlaması aynen korunur; vadesi gelen kartlar normal **Çalış** ile ayrıca çalışılmalıdır.

### Tekrar Takvimi

Ana sayfadaki **Tekrar Takvimi** bölümü, kartlarının deste ve kutu bazında ne zaman çalışılabileceğini gösterir: vadesi gelenler, gecikenler ve yaklaşan tekrarlar yerel tarih ve saatle listelenir; aynı kutudaki farklı zamanlar ayrı ayrı görünür. Bölüm yalnızca görüntüler, kutuları ve tarihleri değiştirmez.

## Çalıştırma

Projeyi indirip `index.html` dosyasını tarayıcıda açabilir veya klasörü VS Code Live Server gibi bir yerel statik HTTP sunucusuyla çalıştırabilirsin. Derleme, paket yöneticisi, hesap ve uygulama sunucusu gerekmez.

Veriler yalnızca **kullandığın tarayıcının `localStorage` alanında**, açtığın adres için saklanır. Farklı cihaz ve adresler arasında otomatik eşitlenmez. Tarayıcı verilerini temizlemek kayıtları silebilir; önemli destelerini Ayarlar'dan **JSON yedeği** olarak dışa aktar. İçe aktarmada ve tüm verileri sıfırlamada mevcut onay/koruma adımları kullanılır.

Arayüz için Tailwind Play CDN; yazı tipi ve simgeler için Google Fonts kullanılır. Bu nedenle **ilk açılışta internet gerekir**; tam çevrimdışı/PWA desteği ve çevrimdışı bildirimler sunulmaz.

## Proje yapısı

- `index.html`: Ana ekran, desteler ve tekrar özeti.
- `deckpage.html`: Kart yönetimi.
- `workpage.html`: Çalışma oturumu.
- `statistics.html`: İstatistikler.
- `settings.html`: Tema ve veri yönetimi.
- `js/`: Sayfa davranışları, depolama ve yardımcı işlevler.
- `css/app.css`: Ortak arayüz stilleri.
- `tests/`: Otomatik testler.
- `memory-bank/`: Geliştirme bağlamı ve kararlar.

**Teknolojiler:** HTML, CSS, vanilla JavaScript, Tailwind Play CDN ve Web Storage (`localStorage`, `sessionStorage`). Harici arayüz kaynakları: [Tailwind CSS](https://tailwindcss.com/) (MIT), [Inter](https://fonts.google.com/specimen/Inter) (SIL Open Font License) ve [Material Symbols](https://fonts.google.com/icons) (Apache License 2.0). Bu kaynakların lisansları proje lisansından ayrı olarak geçerlidir.

## Testler

Node.js bulunan bir ortamda proje kökünde:

```bash
node --test tests/*.test.js
```

JavaScript dosyalarının sözdizimini `node --check js/app.js` gibi kontrol edebilirsin. Otomatik testler, gerçek cihaz ve tarayıcıların görsel davranışlarının tamamını kapsamaz.

## Lisans

MIT — ayrıntılar için [LICENSE](LICENSE). Geliştiren: [akcealan](https://github.com/akcealan).
