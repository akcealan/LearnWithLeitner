// JSON içe aktarma doğrulama + kısmi yazma geri alma testleri.
// Hedef API: Storage.validateBackup(obj) ve sonuç nesnesi döndüren Storage.importData().
// Orijinal davranışa karşı çalıştırıldığında doğrulama testleri BAŞARISIZ olur (temel sonuç).
'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, loadStorage } = require('./helpers');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);

let store;
let Storage;

function seedExisting() {
  const decks = [{ id: 'deck-mevcut', name: 'Mevcut Deste', createdAt: NOW - 5 * DAY, totalCards: 1 }];
  const cards = [{
    id: 'card-mevcut', deckId: 'deck-mevcut', question: 'Mevcut soru',
    answer: 'Mevcut cevap', category: '', box: 2,
    createdAt: NOW - 5 * DAY, lastReviewDate: NOW - DAY,
  }];
  store.setItem('leitner_decks', JSON.stringify(decks));
  store.setItem('leitner_cards', JSON.stringify(cards));
  return store.snapshot();
}

/** Uygulamanın ürettiği biçime uygun sentetik eski yedek (gerçek kullanıcı verisi değil). */
function legacyBackup() {
  return {
    decks: [
      { id: 'deck-almanca-1', name: 'Almanca Temel', createdAt: NOW - 30 * DAY, totalCards: 2 },
      { id: 'deck-ingilizce-1', name: 'Ingilizce', createdAt: NOW - 20 * DAY, totalCards: 1 },
    ],
    cards: [
      { id: 'card-1', deckId: 'deck-almanca-1', question: 'Apple', answer: 'Apfel',
        category: 'Meyveler', box: 1, createdAt: NOW - 10 * DAY, lastReviewDate: null },
      { id: 'card-2', deckId: 'deck-almanca-1', question: 'Water', answer: 'Wasser',
        category: '', box: 2, createdAt: NOW - 15 * DAY, lastReviewDate: NOW - DAY },
      { id: 'card-3', deckId: 'deck-ingilizce-1', question: 'House', answer: 'Ev',
        category: 'Ev', box: 5, createdAt: NOW - 25 * DAY, lastReviewDate: NOW - 30 * DAY },
    ],
    exportedAt: '2026-01-10T10:00:00.000Z',
  };
}

beforeEach(() => {
  store = createStore();
  ({ Storage } = loadStorage({ store, nowMs: NOW }));
});

describe('geçerli yedekler', () => {
  it('geçerli eski yedeği içe aktarır', () => {
    const data = legacyBackup();
    const check = Storage.validateBackup(data);
    assert.equal(check.ok, true);
    const result = Storage.importData(JSON.stringify(data));
    assert.equal(result.ok, true);
    assert.deepEqual(JSON.parse(store.getItem('leitner_decks')), data.decks);
    assert.deepEqual(JSON.parse(store.getItem('leitner_cards')), data.cards);
  });

  it('zararsız ek alanlar içeren yedeği kabul eder ve aynen korur', () => {
    const data = legacyBackup();
    data.appVersion = '1.0.0';
    data.decks[0].note = 'ek açıklama';
    data.cards[0].tags = ['sık'];
    data.cards[0].reviewCount = 3;
    const result = Storage.importData(JSON.stringify(data));
    assert.equal(result.ok, true);
    assert.equal(JSON.parse(store.getItem('leitner_decks'))[0].note, 'ek açıklama');
    assert.deepEqual(JSON.parse(store.getItem('leitner_cards'))[0].tags, ['sık']);
  });

  it('boş ama biçimce geçerli yedeği kabul eder', () => {
    const result = Storage.importData(JSON.stringify({ decks: [], cards: [] }));
    assert.equal(result.ok, true);
    assert.deepEqual(Storage.getDecks(), []);
    assert.deepEqual(Storage.getCards(), []);
  });
});

describe('geçersiz yedekler reddedilir, mevcut veri korunur', () => {
  const cases = {
    'JSON değil': () => '{bu-json-degil',
    'kök null': () => 'null',
    'kök dizi': () => '[]',
    'decks eksik': () => JSON.stringify({ cards: [] }),
    'cards eksik': () => JSON.stringify({ decks: [] }),
    'decks dizi değil': () => JSON.stringify({ decks: {}, cards: [] }),
    'cards dizi değil': () => JSON.stringify({ decks: [], cards: {} }),
    'deste kimliği eksik': () => withDeck({ name: 'X', createdAt: NOW }),
    'deste kimliği sayı': () => withDeck({ id: 7, name: 'X', createdAt: NOW }),
    'deste adı boş': () => withDeck({ id: 'd1', name: '   ', createdAt: NOW }),
    'deste adı çok uzun': () => withDeck({ id: 'd1', name: 'a'.repeat(201), createdAt: NOW }),
    'deste createdAt negatif': () => withDeck({ id: 'd1', name: 'X', createdAt: -5 }),
    'yinelenen deste kimliği': () => withDecks(
      { id: 'd1', name: 'A', createdAt: NOW },
      { id: 'd1', name: 'B', createdAt: NOW }),
    'deste girdisi null': () => JSON.stringify({ decks: [null], cards: [] }),
    'yasak anahtar (__proto__)': () => `{"decks":[{"id":"d1","name":"X","createdAt":${NOW},"__proto__":{"x":1}}],"cards":[]}`,
    'öksüz kart (olmayan deste)': () => withCard({
      id: 'c1', deckId: 'yok', question: 'S?', answer: 'C!', box: 1,
      createdAt: NOW, lastReviewDate: null,
    }),
    'kart sorusu eksik': () => withCard({
      id: 'c1', deckId: 'd1', answer: 'C!', box: 1, createdAt: NOW, lastReviewDate: null,
    }),
    'kart cevabı boş': () => withCard({
      id: 'c1', deckId: 'd1', question: 'S?', answer: '  ', box: 1,
      createdAt: NOW, lastReviewDate: null,
    }),
    'kutu 0': () => withCard(boxCard(0)),
    'kutu 6': () => withCard(boxCard(6)),
    'kutu ondalık': () => withCard(boxCard(2.5)),
    'kutu metin': () => withCard(boxCard('2')),
    'yinelenen kart kimliği': () => withCards(boxCard(1, 'c1'), boxCard(2, 'c1')),
    'kart kimliğinde enjeksiyon': () => withCard(boxCard(1, `x' onclick='alert(1)`)),
    'kart kimliğinde boşluk': () => withCard(boxCard(1, 'kart 1')),
    'lastReviewDate metin': () => withCard(boxCard(1, 'c1', 'dün')),
    'lastReviewDate negatif': () => withCard(boxCard(1, 'c1', -9)),
    'kategori sayı': () => withCard({ ...boxCard(1, 'c1'), category: 5 }),
  };

  function baseDeck() {
    return { id: 'd1', name: 'Deste', createdAt: NOW, totalCards: 0 };
  }
  function withDeck(deck) {
    return JSON.stringify({ decks: [deck], cards: [] });
  }
  function withDecks(...decks) {
    return JSON.stringify({ decks, cards: [] });
  }
  function boxCard(box, id = 'c1', lastReviewDate = null) {
    return {
      id, deckId: 'd1', question: 'S?', answer: 'C!', category: '',
      box, createdAt: NOW, lastReviewDate,
    };
  }
  function withCard(card) {
    return JSON.stringify({ decks: [baseDeck()], cards: [card] });
  }
  function withCards(...cards) {
    return JSON.stringify({ decks: [baseDeck()], cards });
  }

  for (const [name, makeInput] of Object.entries(cases)) {
    it(`${name}`, () => {
      const before = seedExisting();
      const result = Storage.importData(makeInput());
      assert.equal(result.ok, false, 'geçersiz yedek kabul edilmemeli');
      assert.equal(typeof result.error, 'string');
      assert.deepEqual(store.snapshot(), before, 'mevcut veri değişmemeli');
    });
  }

  it('hata mesajları yedek içeriğini sızdırmaz', () => {
    seedExisting();
    const payload = JSON.stringify({
      decks: [baseDeckForLeak()],
      cards: [{
        id: `x' onclick='alert(1)`, deckId: 'd1', question: 'GizliSoru123',
        answer: 'GizliCevap456', category: '', box: 9,
        createdAt: NOW, lastReviewDate: null,
      }],
    });
    function baseDeckForLeak() {
      return { id: 'd1', name: 'Deste', createdAt: NOW, totalCards: 0 };
    }
    const result = Storage.importData(payload);
    assert.equal(result.ok, false);
    for (const secret of ['GizliSoru123', 'GizliCevap456', 'alert(1)']) {
      assert.ok(!result.error.includes(secret), `hata mesajı içerik sızdırmamalı: ${secret}`);
    }
  });
});

describe('kısmi yazma koruması', () => {
  function quotaError() {
    const e = new Error('QuotaExceededError: kota doldu');
    e.name = 'QuotaExceededError';
    return e;
  }

  it('kart yazımı başarısız olursa deste yazımı geri alınır, başarı raporlanmaz', () => {
    const before = seedExisting();
    const failing = createStore(
      { leitner_decks: store.getItem('leitner_decks'), leitner_cards: store.getItem('leitner_cards') },
      { setErrors: [null, quotaError()] } // deste yaz ok, kart yaz hata
    );
    const S = loadStorage({ store: failing, nowMs: NOW }).Storage;
    const result = S.importData(JSON.stringify(legacyBackup()));
    assert.equal(result.ok, false);
    assert.deepEqual(failing.snapshot(), before);
  });

  it('ilk yazım başarısız olursa mevcut veri aynen kalır', () => {
    const before = seedExisting();
    const failing = createStore(
      { leitner_decks: store.getItem('leitner_decks'), leitner_cards: store.getItem('leitner_cards') },
      { setErrors: [quotaError()] }
    );
    const S = loadStorage({ store: failing, nowMs: NOW }).Storage;
    const result = S.importData(JSON.stringify(legacyBackup()));
    assert.equal(result.ok, false);
    assert.deepEqual(failing.snapshot(), before);
  });

  it('geri alma da başarısız olursa bu açıkça raporlanır', () => {
    seedExisting();
    const failing = createStore(
      { leitner_decks: store.getItem('leitner_decks'), leitner_cards: store.getItem('leitner_cards') },
      { setErrors: [null, quotaError(), quotaError()] } // yaz ok, yaz hata, geri alma hata
    );
    const S = loadStorage({ store: failing, nowMs: NOW }).Storage;
    const result = S.importData(JSON.stringify(legacyBackup()));
    assert.equal(result.ok, false);
    assert.equal(result.code, 'rollback-failed');
  });
});

describe('eski yedek uyumluluğu', () => {
  it('isteğe bağlı alanları eksik eski yedek kabul edilir', () => {
    // category / totalCards / exportedAt içermeyen en sade tarihsel biçim.
    const minimal = {
      decks: [{ id: 'deck-eski', name: 'Eski Deste', createdAt: NOW - 30 * DAY }],
      cards: [{
        id: 'card-eski', deckId: 'deck-eski', question: 'Soru', answer: 'Cevap',
        box: 1, createdAt: NOW - 10 * DAY, lastReviewDate: null,
      }],
    };
    assert.equal(Storage.validateBackup(minimal).ok, true);
    const result = Storage.importData(JSON.stringify(minimal));
    assert.equal(result.ok, true);
    assert.equal(Storage.getCards()[0].question, 'Soru');
  });
});
