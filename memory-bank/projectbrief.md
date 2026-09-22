# Learn with Leitner - Project Brief

## Proje Adı

Learn with Leitner - Leitner Sistemi Tabanlı Öğrenme Uygulaması

## Genel Amaç

Kullanıcıların Leitner sistemini kullanarak etkili bir şekilde öğrenmelerini sağlamak. Sistem 5 kutuluk yapı kullanarak spaced repetition ile bilginin uzun süreli tutulmasını hedefler.

## Hedef Kullanıcılar

- Dil öğrenenler
- Sınava hazırlaşanlar
- Toplu bilgi öğrenmeye ihtiyaç duyanlar

## Core Features

1. **Deste Yönetimi**: Başlıklandırılmış kartlar (Almanca, Tarih, vb.)
2. **Kart Yönetimi**: Soru-Cevap formatında kartlar oluşturma
3. **Leitner 5-Box Sistemi**: Spaced repetition schedule
4. **İlerleme Takibi**: Kartın hangi kutuya ait olduğu
5. **JSON Export/Import**: Veri yedekleme ve transferi

## Teknik Stack

- HTML5
- CSS (Tailwind + Custom)
- JavaScript (Vanilla)
- LocalStorage (Veri depolama)

## Key Constraints

- Bulut sync yok (LocalStorage only)
- İstatistik MVP'de dahil değil (sonra eklenebilir)
- Responsive design gereklidir

## Success Criteria

- Kartlar başarılı şekilde oluşturma/silme
- Leitner mütteakileri doğru çalışması
- Flip animasyonu akıcı olması
- LocalStorage'a veri kaydedilmesi
