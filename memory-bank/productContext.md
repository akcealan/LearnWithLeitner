# Product Context

## Neden Bu Proje Var?

Etkili öğrenme için sadece tekrar etmek yetmiyor - doğru zamanda tekrar etmek önemliydi. Leitner sistemi bu problemi çözer: Zor kartlar daha sık, kolay kartlar daha nadir tekrar edilir.

## Nasıl Çalışacak?

### Deste Yapısı

- Kullanıcı "Almanca", "İngilizce Kelimeler", "Tarih" gibi desteler oluşturur
- Her destenin içinde çok sayıda kart vardır

### Kart Yapısı

> Faz 1A notu (2026-09-22): Aşağıdaki tarihsel şemada `deck` alanı yazar;
> gerçek uygulamada alan adı `deckId`'dir (destenin `id`'sine referans).
> Doğrulanmış güncel şema systemPatterns.md'dedir.

```
{
  id: unique-id,
  deck: "Almanca",
  question: "Apple",
  answer: "Apfel",
  box: 1-5,
  category: "Meyveler",
  createdAt: timestamp,
  lastReviewDate: timestamp
}
```

### Leitner 5-Box Sistemi

- **Kutu 1**: İlk kez eklenen kartlar → 1 gün sonra tekrar et
- **Kutu 2**: Bilineni bildim → 2 gün sonra tekrar et
- **Kutu 3**: İlerleme → 4 gün sonra tekrar et
- **Kutu 4**: Daha ileri → 7 gün sonra tekrar et
- **Kutu 5**: Master seviye → 30 gün sonra tekrar et

### Kart Hareketi

1. Kartın "Bildim" butonu tıklandığında: **İleri Kutuya**
2. Kartın "Bilemedim" butonu tıklandığında: **Bir Kutu Geriye** (Kutu 1'de kalır)
3. Kutuya göre tekrar tarihi otomatik hesaplanır

### Veri Yönetimi

- LocalStorage'a JSON formatında kaydedilir
- Kullanıcı herhangi bir zamanda JSON export edebilir
- JSON import ile veri geri yüklenebilir

## Kullanıcı Flow

1. **Ana Sayfa (index.html)**

   - Mevcut desteler listesi
   - 5 kutu ve kutu başına kart sayısı
   - Yeni deste oluşturma
   - Desteden çalışma seçme
   - Tekrar Takvimi (deste/kutu bazında vade görünümü)

2. **Çalışma Sayfası (workpage.html)**
   - Seçilen desteden kartı göster
   - Kart flip (tıkla/hover ile cevabı gör)
   - "Bildim" / "Bilemedim" butonları
   - İlerleme göstergesi (örn: 15/50)
   - Klavye (Faz 1B): Space çevirir, 1/Sol yanlış, 2/Sağ doğru;
     basılı tutma, açık onay diyaloğu ve metin alanları kısayolları susturur.

### Çalışma Kipleri (Faz 4A)

- **Normal Çalışma:** yalnızca vadesi gelen kartlar; yanıtlar kutu ve takvimi günceller.
- **Serbest Çalışma:** destedeki tüm kartlarla ek alıştırma; yanıtlar kalıcı durumu değiştirmez.

## Başarı Ölçüleri

- Kullanıcı kartları başarılı ekleyebilir
- Leitner sistem mütteakiyle uygulamaya göre kart ilerlemesi
- Flip animasyonu sorunsuz çalışması
- JSON export/import başarılı olması
