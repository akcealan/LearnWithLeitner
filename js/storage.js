// ==========================================
// STORAGE.JS - LocalStorage Management
// ==========================================
//
// Faz 1A: içe aktarma doğrulaması ve yazma hatası koruması eklendi.
// Leitner davranışları (kutu aralıkları, ilerleme/gerileme) değiştirilmedi.

const STORAGE_KEYS = {
  DECKS: 'leitner_decks',
  CARDS: 'leitner_cards'
};

const BOX_SCHEDULE = {
  1: 1,   // 1 gün
  2: 2,   // 2 gün
  3: 4,   // 4 gün
  4: 7,   // 7 gün
  5: 30   // 30 gün
};

// Yedek doğrulama kuralları. ID kalıbı bilinçli olarak tutucudur: mevcut
// uygulamanın ürettiği ID'lerle (Date.now + base36) ve test verilerindeki
// ID'lerle uyumludur. Dinamik deste/kart düğmeleri Faz 1B'den beri satır içi
// onclick yerine data-action yetkilendirmesi kullanır; kalıp ek savunma sağlar.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];
const MAX_DECKS = 20000;
const MAX_CARDS = 100000;
const MAX_NAME_LENGTH = 200;
const MAX_TEXT_LENGTH = 5000;
const MAX_CATEGORY_LENGTH = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

class Storage {
  /**
   * LocalStorage'dan tüm desteleri al.
   * Anahtar yoksa [] döner; bozuk veride boş depo gibi davranmak yerine hata fırlatır.
   */
  static getDecks() {
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (raw === null) return [];
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      void error;
      throw new Error('Kayıtlı desteler okunamadı: veri bozuk görünüyor.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Kayıtlı desteler okunamadı: veri bozuk görünüyor.');
    }
    return parsed;
  }

  /**
   * LocalStorage'a desteleri kaydet. Başarıda true, hatada fırlatır.
   */
  static setDecks(decks) {
    if (!Array.isArray(decks)) {
      throw new Error('Kaydedilecek desteler dizi olmalı.');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
    } catch (error) {
      void error;
      throw new Error('Desteler kaydedilemedi: depolama yazma hatası.');
    }
    return true;
  }

  /**
   * LocalStorage'dan tüm kartları al.
   * Anahtar yoksa [] döner; bozuk veride boş depo gibi davranmak yerine hata fırlatır.
   */
  static getCards() {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (raw === null) return [];
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      void error;
      throw new Error('Kayıtlı kartlar okunamadı: veri bozuk görünüyor.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('Kayıtlı kartlar okunamadı: veri bozuk görünüyor.');
    }
    return parsed;
  }

  /**
   * LocalStorage'a kartları kaydet. Başarıda true, hatada fırlatır.
   */
  static setCards(cards) {
    if (!Array.isArray(cards)) {
      throw new Error('Kaydedilecek kartlar dizi olmalı.');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    } catch (error) {
      void error;
      throw new Error('Kartlar kaydedilemedi: depolama yazma hatası.');
    }
    return true;
  }

  /**
   * Birden çok anahtarı tek işlemde yazar; yazma yarıda kesilirse önceki
   * ham değerleri geri yüklemeyi dener. `undefined` verilen anahtara dokunulmaz.
   * Ayrı localStorage yazımları gerçek atomiklik sağlamaz; yalnızca en iyi
   * çaba geri alma sunar. Hiçbir zaman kısmi başarıyı başarı gibi raporlamaz.
   */
  static _writeAll(nextDecks, nextCards) {
    let prevDecks = null;
    let prevCards = null;
    try {
      if (nextDecks !== undefined) prevDecks = localStorage.getItem(STORAGE_KEYS.DECKS);
      if (nextCards !== undefined) prevCards = localStorage.getItem(STORAGE_KEYS.CARDS);
    } catch (error) {
      void error;
      return { ok: false, code: 'storage-error' };
    }
    try {
      if (nextDecks !== undefined) this.setDecks(nextDecks);
      if (nextCards !== undefined) this.setCards(nextCards);
      return { ok: true, code: 'ok' };
    } catch (error) {
      void error;
    }
    try {
      this._restoreRaw(STORAGE_KEYS.DECKS, nextDecks !== undefined ? prevDecks : undefined);
      this._restoreRaw(STORAGE_KEYS.CARDS, nextCards !== undefined ? prevCards : undefined);
      return { ok: false, code: 'storage-error' };
    } catch (error) {
      void error;
      return { ok: false, code: 'rollback-failed' };
    }
  }

  static _restoreRaw(key, prevRaw) {
    if (prevRaw === undefined) return;
    if (prevRaw === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, prevRaw);
    }
  }

  /**
   * Belirli bir deste için kartları al
   */
  static getCardsByDeck(deckId) {
    const cards = this.getCards();
    return cards.filter(card => card.deckId === deckId);
  }

  /**
   * Tekrar edilmesi gereken kartları al (günü geçmiş veya bugün)
   * Yeni kartlar (lastReviewDate = null) HEMEN gösterilir
   */
  static getCardsDueForReview(deckId) {
    const cards = this.getCardsByDeck(deckId);
    const now = new Date().getTime();

    return cards.filter(card => {
      // Yeni kart (hiç çalışılmamış) = HEMEN göster
      if (card.lastReviewDate === null) {
        return true;
      }

      // Çalışılan kart = tekrar tarihine bakılır
      const nextReviewTime = card.lastReviewDate + (BOX_SCHEDULE[card.box] * 24 * 60 * 60 * 1000);
      return nextReviewTime <= now;
    });
  }

  /**
   * Tekrar takvimi: deste + kutu bazında vade durumu (salt okunur).
   * Her kart için vade, mevcut vade kuralıyla hesaplanır
   * (lastReviewDate + kutu aralığı; yeni kart zaman damgasız vadelidir).
   * nowMs enjekte edilebilir; tek anlık görüntüyle tutarlı hesap yapılır.
   */
  static getReviewSchedule(nowMs = Date.now()) {
    const decks = this.getDecks();
    const cards = this.getCards();
    const dayStart = new Date(nowMs);
    dayStart.setHours(0, 0, 0, 0);
    const todayStart = dayStart.getTime();

    return decks.map(deck => {
      const deckCards = cards.filter(c => c.deckId === deck.id);
      const boxes = [];
      for (let box = 1; box <= 5; box++) {
        const boxCards = deckCards.filter(c => c.box === box);
        if (boxCards.length === 0) continue;
        let due = 0;
        let overdue = 0;
        const upcomingCounts = new Map();
        for (const card of boxCards) {
          if (card.lastReviewDate === null) {
            due += 1;
            continue;
          }
          const interval = BOX_SCHEDULE[card.box];
          if (interval === undefined) continue;
          const next = card.lastReviewDate + interval * DAY_MS;
          if (next <= nowMs) {
            due += 1;
            if (next < todayStart) overdue += 1;
          } else {
            upcomingCounts.set(next, (upcomingCounts.get(next) || 0) + 1);
          }
        }
        const upcoming = [...upcomingCounts.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([at, count]) => ({ at, count }));
        boxes.push({
          box,
          total: boxCards.length,
          due,
          overdue,
          nextDueAt: upcoming.length > 0 ? upcoming[0].at : null,
          upcoming,
        });
      }
      return {
        deckId: deck.id,
        deckName: deck.name,
        totalCards: deckCards.length,
        dueCount: boxes.reduce((sum, b) => sum + b.due, 0),
        overdueCount: boxes.reduce((sum, b) => sum + b.overdue, 0),
        boxes,
      };
    });
  }

  /**
   * Deste oluştur. Yazma başarısız olursa null döner (başarı raporlanmaz).
   */
  static createDeck(name) {
    let decks;
    try {
      decks = this.getDecks();
    } catch (error) {
      void error;
      return null;
    }
    const newDeck = {
      id: this.generateId(),
      name: name.trim(),
      createdAt: new Date().getTime(),
      totalCards: 0
    };

    decks.push(newDeck);
    const result = this._writeAll(decks, undefined);
    return result.ok ? newDeck : null;
  }

  /**
   * Deste sil. Başarıda true, hatada false döner.
   */
  static deleteDeck(deckId) {
    let decks;
    let cards;
    try {
      decks = this.getDecks();
      cards = this.getCards();
    } catch (error) {
      void error;
      return false;
    }

    const filteredDecks = decks.filter(d => d.id !== deckId);
    const filteredCards = cards.filter(c => c.deckId !== deckId);
    return this._writeAll(filteredDecks, filteredCards).ok;
  }

  /**
   * Kart oluştur. Yazma başarısız olursa null döner (başarı raporlanmaz).
   */
  static createCard(deckId, question, answer, category = '') {
    let cards;
    let decks;
    try {
      cards = this.getCards();
      decks = this.getDecks();
    } catch (error) {
      void error;
      return null;
    }

    const newCard = {
      id: this.generateId(),
      deckId: deckId,
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      box: 1,
      createdAt: new Date().getTime(),
      lastReviewDate: null
    };

    cards.push(newCard);

    // Deste kart sayısını güncelle
    const deck = decks.find(d => d.id === deckId);
    let nextDecks;
    if (deck) {
      deck.totalCards = cards.filter(c => c.deckId === deckId).length;
      nextDecks = decks;
    } else {
      nextDecks = undefined;
    }

    const result = this._writeAll(nextDecks, cards);
    return result.ok ? newCard : null;
  }

  /**
   * Kart sil. Başarıda true, hatada false döner.
   */
  static deleteCard(cardId) {
    let cards;
    let decks;
    try {
      cards = this.getCards();
      decks = this.getDecks();
    } catch (error) {
      void error;
      return false;
    }

    const card = cards.find(c => c.id === cardId);
    const filteredCards = cards.filter(c => c.id !== cardId);

    // Deste kart sayısını güncelle
    let nextDecks;
    if (card) {
      const deck = decks.find(d => d.id === card.deckId);
      if (deck) {
        deck.totalCards = filteredCards.filter(c => c.deckId === card.deckId).length;
        nextDecks = decks;
      } else {
        nextDecks = undefined;
      }
    } else {
      nextDecks = undefined;
    }

    return this._writeAll(nextDecks, filteredCards).ok;
  }

  /**
   * Kart kutusunu güncelle (progression logic).
   * Kart yoksa veya yazma başarısız olursa null döner.
   */
  static updateCardBox(cardId, isCorrect) {
    let cards;
    try {
      cards = this.getCards();
    } catch (error) {
      void error;
      return null;
    }
    const card = cards.find(c => c.id === cardId);

    if (!card) return null;

    if (isCorrect) {
      // Bunu Bildim - sonraki kutuya geç
      if (card.box < 5) {
        card.box += 1;
      }
    } else {
      // Bilemedim - önceki kutuya geri git (kutu 1'de kalma)
      if (card.box > 1) {
        card.box -= 1;
      } else {
        card.box = 1;
      }
    }

    card.lastReviewDate = new Date().getTime();
    const result = this._writeAll(undefined, cards);
    return result.ok ? card : null;
  }

  /**
   * Deste istatistiklerini al
   */
  static getDeckStats(deckId) {
    const cards = this.getCardsByDeck(deckId);
    const stats = {
      total: cards.length,
      box1: 0,
      box2: 0,
      box3: 0,
      box4: 0,
      box5: 0,
      dueForReview: 0
    };

    cards.forEach(card => {
      stats[`box${card.box}`] += 1;
    });

    stats.dueForReview = this.getCardsDueForReview(deckId).length;
    return stats;
  }

  /**
   * Unique ID oluştur (simple UUID-like)
   */
  static generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Veri dışa aktar (JSON)
   */
  static exportData() {
    const data = {
      decks: this.getDecks(),
      cards: this.getCards(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static _isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  static _hasForbiddenKey(obj) {
    return FORBIDDEN_KEYS.some(key => Object.prototype.hasOwnProperty.call(obj, key));
  }

  static _isValidId(value) {
    return typeof value === 'string' && ID_PATTERN.test(value);
  }

  static _isValidTimestamp(value) {
    return typeof value === 'number'
      && Number.isFinite(value)
      && Number.isInteger(value)
      && value >= 0
      && value <= Date.now() + DAY_MS;
  }

  static _invalid(message) {
    return { ok: false, code: 'invalid-backup', error: message };
  }

  /**
   * Yedek nesnesini kalıcı yazma yapmadan doğrular.
   * Bilinen alanları denetler; zararsız ek alanlara izin verir ve korur.
   * Hata mesajları yedek içeriğini yansıtmaz (gizlilik).
   */
  static validateBackup(data) {
    if (!this._isPlainObject(data)) {
      return this._invalid('Yedek dosyasının biçimi geçersiz.');
    }
    if (!Array.isArray(data.decks)) {
      return this._invalid('Yedekte deste listesi (decks) bulunamadı.');
    }
    if (!Array.isArray(data.cards)) {
      return this._invalid('Yedekte kart listesi (cards) bulunamadı.');
    }
    if (data.decks.length > MAX_DECKS || data.cards.length > MAX_CARDS) {
      return this._invalid('Yedek, desteklenen boyut sınırını aşıyor.');
    }
    if (data.exportedAt !== undefined && typeof data.exportedAt !== 'string') {
      return this._invalid('Yedek dışa aktarma tarihi geçersiz.');
    }

    const deckIds = new Set();
    for (let i = 0; i < data.decks.length; i++) {
      const deck = data.decks[i];
      if (!this._isPlainObject(deck) || this._hasForbiddenKey(deck)) {
        return this._invalid(`Deste [${i}] geçersiz yapıda.`);
      }
      if (!this._isValidId(deck.id)) {
        return this._invalid(`Deste [${i}] kimliği geçersiz.`);
      }
      if (deckIds.has(deck.id)) {
        return this._invalid(`Deste [${i}] kimliği yineleniyor.`);
      }
      deckIds.add(deck.id);
      if (typeof deck.name !== 'string'
        || deck.name.trim().length < 1
        || deck.name.trim().length > MAX_NAME_LENGTH) {
        return this._invalid(`Deste [${i}] adı geçersiz.`);
      }
      if (!this._isValidTimestamp(deck.createdAt)) {
        return this._invalid(`Deste [${i}] oluşturma tarihi geçersiz.`);
      }
      if (deck.totalCards !== undefined
        && (!Number.isInteger(deck.totalCards) || deck.totalCards < 0)) {
        return this._invalid(`Deste [${i}] kart sayısı geçersiz.`);
      }
    }

    const cardIds = new Set();
    for (let i = 0; i < data.cards.length; i++) {
      const card = data.cards[i];
      if (!this._isPlainObject(card) || this._hasForbiddenKey(card)) {
        return this._invalid(`Kart [${i}] geçersiz yapıda.`);
      }
      if (!this._isValidId(card.id)) {
        return this._invalid(`Kart [${i}] kimliği geçersiz.`);
      }
      if (cardIds.has(card.id)) {
        return this._invalid(`Kart [${i}] kimliği yineleniyor.`);
      }
      cardIds.add(card.id);
      if (typeof card.deckId !== 'string' || !deckIds.has(card.deckId)) {
        return this._invalid(`Kart [${i}] kayıtlı bir desteye bağlı değil.`);
      }
      if (typeof card.question !== 'string'
        || card.question.trim().length < 1
        || card.question.trim().length > MAX_TEXT_LENGTH) {
        return this._invalid(`Kart [${i}] sorusu geçersiz.`);
      }
      if (typeof card.answer !== 'string'
        || card.answer.trim().length < 1
        || card.answer.trim().length > MAX_TEXT_LENGTH) {
        return this._invalid(`Kart [${i}] cevabı geçersiz.`);
      }
      if (!Number.isInteger(card.box) || card.box < 1 || card.box > 5) {
        return this._invalid(`Kart [${i}] kutu değeri 1-5 arası olmalı.`);
      }
      if (card.category !== undefined
        && (typeof card.category !== 'string' || card.category.length > MAX_CATEGORY_LENGTH)) {
        return this._invalid(`Kart [${i}] kategorisi geçersiz.`);
      }
      if (!this._isValidTimestamp(card.createdAt)) {
        return this._invalid(`Kart [${i}] oluşturma tarihi geçersiz.`);
      }
      if (card.lastReviewDate !== null && !this._isValidTimestamp(card.lastReviewDate)) {
        return this._invalid(`Kart [${i}] son tekrar tarihi geçersiz.`);
      }
    }

    return { ok: true, code: 'ok', decks: data.decks, cards: data.cards };
  }

  /**
   * Veri içe aktar (JSON).
   * Önce tamamen doğrular, sonra yazar; yazma yarıda kesilirse önceki
   * veriyi geri yüklemeyi dener. Sonuç nesnesi döndürür; kısmi başarı
   * hiçbir zaman başarılı raporlanmaz. Yedek içeriği günlüğe yazılmaz.
   */
  static importData(jsonString) {
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (error) {
      void error;
      return { ok: false, code: 'invalid-json', error: 'Dosya geçerli bir JSON içermiyor.' };
    }

    const check = this.validateBackup(data);
    if (!check.ok) {
      return check;
    }

    const write = this._writeAll(check.decks, check.cards);
    if (write.ok) {
      return {
        ok: true,
        code: 'ok',
        imported: { decks: check.decks.length, cards: check.cards.length }
      };
    }
    if (write.code === 'rollback-failed') {
      console.error('İçe aktarma geri alınamadı.');
      return {
        ok: false,
        code: 'rollback-failed',
        error: 'Yazma başarısız oldu ve önceki veri geri yüklenemedi.'
      };
    }
    console.error('İçe aktarma yazma hatası.');
    return {
      ok: false,
      code: 'storage-error',
      error: 'Depolamaya yazılamadı; mevcut veriler korundu.'
    };
  }

  /**
   * Tüm veriyi sil. Ayrı silme işlemleri gerçek atomiklik sağlamaz; yarıda
   * kesilirse önceki ham değerler geri yüklenmeye çalışılır.
   * Sonuç nesnesi döndürür; kısmi silme hiçbir zaman başarılı raporlanmaz.
   */
  static clearAll() {
    let prevDecks = null;
    let prevCards = null;
    try {
      prevDecks = localStorage.getItem(STORAGE_KEYS.DECKS);
      prevCards = localStorage.getItem(STORAGE_KEYS.CARDS);
    } catch (error) {
      void error;
      return { ok: false, code: 'storage-error' };
    }
    try {
      localStorage.removeItem(STORAGE_KEYS.DECKS);
      localStorage.removeItem(STORAGE_KEYS.CARDS);
      return { ok: true, code: 'ok' };
    } catch (error) {
      void error;
    }
    try {
      this._restoreRaw(STORAGE_KEYS.DECKS, prevDecks);
      this._restoreRaw(STORAGE_KEYS.CARDS, prevCards);
      return { ok: false, code: 'storage-error' };
    } catch (error) {
      void error;
      return { ok: false, code: 'rollback-failed' };
    }
  }
}
