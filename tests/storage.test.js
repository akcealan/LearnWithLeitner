// Çekirdek depolama + Leitner davranış testleri (Node yerleşik test koşucusu).
// Deterministik: sabit saat, sentetik veri; gerçek kullanıcı verisi kullanılmaz.
'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, loadStorage } = require('./helpers');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0); // 2026-08-22 12:00 UTC (sabit saat)

let store;
let Storage;
let BOX_SCHEDULE;

beforeEach(() => {
  store = createStore();
  ({ Storage, BOX_SCHEDULE } = loadStorage({ store, nowMs: NOW }));
});

describe('deste ve kart CRUD', () => {
  it('deste oluşturur (id, ad, zaman damgası, sayaç)', () => {
    const deck = Storage.createDeck('  Almanca  ');
    assert.equal(deck.name, 'Almanca');
    assert.match(deck.id, /^[A-Za-z0-9_-]{1,128}$/);
    assert.equal(deck.createdAt, NOW);
    assert.equal(deck.totalCards, 0);
    assert.equal(Storage.getDecks().length, 1);
  });

  it('kart oluşturur ve siler (kutu 1, lastReviewDate null, sayaç güncel)', () => {
    const deck = Storage.createDeck('Tarih');
    const card = Storage.createCard(deck.id, 'Soru?', 'Cevap!', 'Genel');
    assert.equal(card.box, 1);
    assert.equal(card.lastReviewDate, null);
    assert.equal(card.category, 'Genel');
    assert.equal(Storage.getDecks()[0].totalCards, 1);

    Storage.deleteCard(card.id);
    assert.equal(Storage.getCards().length, 0);
    assert.equal(Storage.getDecks()[0].totalCards, 0);
  });

  it('deste silme yalnızca o destenin kartlarını siler', () => {
    const a = Storage.createDeck('A-Destesi');
    const b = Storage.createDeck('B-Destesi');
    Storage.createCard(a.id, 'S1?', 'C1!');
    Storage.createCard(a.id, 'S2?', 'C2!');
    Storage.createCard(b.id, 'S3?', 'C3!');

    Storage.deleteDeck(a.id);
    assert.equal(Storage.getDecks().length, 1);
    assert.equal(Storage.getDecks()[0].id, b.id);
    const remaining = Storage.getCards();
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].deckId, b.id);
  });
});

describe('Leitner kutu davranışı', () => {
  it('doğru cevap kutuyu bir ilerletir', () => {
    const deck = Storage.createDeck('D');
    const card = Storage.createCard(deck.id, 'S?', 'C!');
    const updated = Storage.updateCardBox(card.id, true);
    assert.equal(updated.box, 2);
    assert.equal(updated.lastReviewDate, NOW);
  });

  it('yanlış cevap kutuyu bir geriletir (tek kutu regresyon)', () => {
    const deck = Storage.createDeck('D');
    const card = Storage.createCard(deck.id, 'S?', 'C!');
    Storage.updateCardBox(card.id, true);
    Storage.updateCardBox(card.id, true); // kutu 3
    assert.equal(Storage.getCards()[0].box, 3);
    const updated = Storage.updateCardBox(card.id, false);
    assert.equal(updated.box, 2);
  });

  it('sınırlar: kutu 5 doğru cevapta kalır, kutu 1 yanlış cevapta kalır', () => {
    const deck = Storage.createDeck('D');
    const card = Storage.createCard(deck.id, 'S?', 'C!');
    for (let i = 0; i < 10; i++) Storage.updateCardBox(card.id, true);
    assert.equal(Storage.getCards()[0].box, 5);
    Storage.updateCardBox(card.id, true);
    assert.equal(Storage.getCards()[0].box, 5);

    const card2 = Storage.createCard(deck.id, 'S2?', 'C2!');
    Storage.updateCardBox(card2.id, false);
    assert.equal(Storage.getCards().find((c) => c.id === card2.id).box, 1);
  });

  it('yeni kartlar (lastReviewDate null) hemen çalışmaya hazırdır', () => {
    const deck = Storage.createDeck('D');
    Storage.createCard(deck.id, 'S?', 'C!');
    const due = Storage.getCardsDueForReview(deck.id);
    assert.equal(due.length, 1);
  });
});

describe('tekrar zamanlaması (1, 2, 4, 7, 30 gün)', () => {
  it('BOX_SCHEDULE aralıkları korunur', () => {
    assert.deepEqual(Object.assign({}, BOX_SCHEDULE), { 1: 1, 2: 2, 3: 4, 4: 7, 5: 30 });
  });

  for (const [box, days] of [[1, 1], [2, 2], [3, 4], [4, 7], [5, 30]]) {
    it(`kutu ${box}: ${days} gün dolunca vade gelir, dolmadan gelmez`, () => {
      const deck = Storage.createDeck('D');
      const interval = days * DAY;
      const seed = (lastReviewDate, b) => ({
        id: `c-${b}-${lastReviewDate}`,
        deckId: deck.id,
        question: 'S?',
        answer: 'C!',
        category: '',
        box: b,
        createdAt: NOW - 40 * DAY,
        lastReviewDate,
      });
      store.setItem('leitner_cards', JSON.stringify([
        seed(NOW - interval + 60 * 1000, box), // vade 60 sn sonra
        seed(NOW - interval, box),             // tam vadede
        seed(NOW - interval - 60 * 1000, box), // 60 sn gecikmiş
      ]));
      const due = Storage.getCardsDueForReview(deck.id);
      assert.equal(due.length, 2);
    });
  }
});

describe('dışa aktarma', () => {
  it('mevcut veriyi {decks, cards, exportedAt} olarak dışa aktarır', () => {
    const deck = Storage.createDeck('D');
    Storage.createCard(deck.id, 'S?', 'C!');
    const parsed = JSON.parse(Storage.exportData());
    assert.ok(Array.isArray(parsed.decks));
    assert.ok(Array.isArray(parsed.cards));
    assert.equal(parsed.decks.length, 1);
    assert.equal(parsed.cards.length, 1);
    assert.equal(typeof parsed.exportedAt, 'string');
  });
});

describe('bozuk depo ve yazma hataları', () => {
  it('bozuk JSON okumada boş depo gibi davranılmaz (hata fırlatılır)', () => {
    store.setItem('leitner_decks', '{bozuk-json');
    assert.throws(() => Storage.getDecks(), /bozuk|corrupt|geçersiz/i);
  });

  it('bozuk depo üzerine yazılmaz: createDeck başarısız olur, ham veri korunur', () => {
    store.setItem('leitner_decks', '{bozuk-json');
    const result = Storage.createDeck('Yeni');
    assert.equal(result, null);
    assert.equal(store.getItem('leitner_decks'), '{bozuk-json');
  });

  it('yazma hatası (kota) başarı gibi raporlanmaz', () => {
    const quota = new Error('QuotaExceededError: depolama kotası doldu');
    quota.name = 'QuotaExceededError';
    const failing = createStore({}, { setErrors: [quota] });
    const S = loadStorage({ store: failing, nowMs: NOW }).Storage;
    assert.equal(S.createDeck('D'), null);
    assert.equal(failing.getItem('leitner_decks'), null);
  });

  it('kart yazma hatasında null döner, başarı raporlanmaz', () => {
    const deck = Storage.createDeck('D');
    const quota = new Error('QuotaExceededError');
    quota.name = 'QuotaExceededError';
    failingSetCardsOnly(quota);
    function failingSetCardsOnly(err) {
      const origGet = store.getItem.bind(store);
      void origGet;
      // yalnızca CARDS yazımını bozan sarmalayıcı
      const realSet = store.setItem.bind(store);
      store.setItem = (k, v) => {
        if (k === 'leitner_cards') throw err;
        realSet(k, v);
      };
    }
    void deck;
    const deckId = Storage.getDecks()[0].id;
    assert.equal(Storage.createCard(deckId, 'S?', 'C!'), null);
  });
});
