// Serbest Çalışma (Faz 4A) testleri: tüm kartların seçimi, kalıcı Leitner
// durumunun korunması, normal kip regresyonu, oturum/gezinme güvenliği.
// Sentetik veri + sabit saat; gerçek tarayıcı gerekmez.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('./helpers');
const { makeDocument, makeSessionStorage, runPageScript, stubUtils, loadWorkApp } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);

function seedStore() {
  const store = createStore();
  store.setItem('leitner_decks', JSON.stringify([
    { id: 'deck-1', name: 'Almanca', createdAt: NOW - 30 * DAY, totalCards: 4 },
    { id: 'deck-2', name: 'Tarih', createdAt: NOW - 20 * DAY, totalCards: 2 },
    { id: 'deck-3', name: 'Boş Deste', createdAt: NOW - 5 * DAY, totalCards: 0 },
  ]));
  store.setItem('leitner_cards', JSON.stringify([
    // deck-1: vadesi gelen + gelmeyen karışık, kutular 1/2/3/5
    { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: '', box: 1, createdAt: NOW - 10 * DAY, lastReviewDate: null },
    { id: 'c2', deckId: 'deck-1', question: 'S2?', answer: 'C2!', category: '', box: 2, createdAt: NOW - 9 * DAY, lastReviewDate: NOW - DAY },
    { id: 'c3', deckId: 'deck-1', question: 'S3?', answer: 'C3!', category: '', box: 3, createdAt: NOW - 8 * DAY, lastReviewDate: NOW - DAY },
    { id: 'c4', deckId: 'deck-1', question: 'S4?', answer: 'C4!', category: '', box: 5, createdAt: NOW - 40 * DAY, lastReviewDate: NOW - 40 * DAY },
    // deck-2: vadesi gelen kart yok
    { id: 'c5', deckId: 'deck-2', question: 'S5?', answer: 'C5!', category: '', box: 2, createdAt: NOW - 5 * DAY, lastReviewDate: NOW - DAY },
    { id: 'c6', deckId: 'deck-2', question: 'S6?', answer: 'C6!', category: '', box: 4, createdAt: NOW - 5 * DAY, lastReviewDate: NOW - DAY },
  ]));
  return store;
}

function deckCards() {
  return JSON.parse(seedStore().getItem('leitner_cards')).filter((c) => c.deckId === 'deck-1');
}

function loadIndex(store) {
  const doc = makeDocument();
  const win = { location: { pathname: '/index.html', search: '', href: '' } };
  const session = makeSessionStorage();
  const toasts = [];
  const { page } = runPageScript('js/app.js', {
    store, doc, win, session, timers: [], toasts,
    utilsStub: stubUtils(toasts), nowMs: NOW, captureName: 'app',
  });
  return { app: page, doc, win, session, toasts };
}

function persistSnapshot(store) {
  return {
    decks: store.getItem('leitner_decks'),
    cards: store.getItem('leitner_cards'),
  };
}

describe('serbest seçim', () => {
  it('normal kip yalnızca vadesi gelenleri seçer', () => {
    const { app, session, win } = loadIndex(seedStore());
    app.startStudy('deck-1');
    const ids = JSON.parse(session._map.get('workCards')).map((c) => c.id).sort();
    assert.deepEqual(ids, ['c1', 'c4']);
    assert.equal(session._map.get('workMode'), 'normal');
    assert.equal(win.location.href, 'workpage.html');
  });

  it('serbest kip destedeki tüm kartları seçer', () => {
    const { app, session, win } = loadIndex(seedStore());
    app.startFreeStudy('deck-1');
    const ids = JSON.parse(session._map.get('workCards')).map((c) => c.id).sort();
    assert.deepEqual(ids, ['c1', 'c2', 'c3', 'c4']);
    assert.equal(session._map.get('workMode'), 'free');
    assert.equal(win.location.href, 'workpage.html');
  });

  it('serbest kip vadesi gelmemiş kartları içerir', () => {
    const { app, session } = loadIndex(seedStore());
    app.startFreeStudy('deck-1');
    const ids = JSON.parse(session._map.get('workCards')).map((c) => c.id);
    assert.ok(ids.includes('c3'), 'vadesi gelmemiş kart oturumda olmalı');
  });

  it('serbest kip vadesi gelen kartı olmayan destede çalışır', () => {
    const { app, session, win } = loadIndex(seedStore());
    app.startFreeStudy('deck-2');
    const ids = JSON.parse(session._map.get('workCards')).map((c) => c.id).sort();
    assert.deepEqual(ids, ['c5', 'c6']);
    assert.equal(win.location.href, 'workpage.html');
  });

  it('serbest kip birden çok kutudaki kartları içerir', () => {
    const { app, session } = loadIndex(seedStore());
    app.startFreeStudy('deck-1');
    const boxes = JSON.parse(session._map.get('workCards')).map((c) => c.box).sort();
    assert.deepEqual(boxes, [1, 2, 3, 5]);
  });

  it('boş deste bozuk oturum başlatmaz', () => {
    const { app, session, win, toasts } = loadIndex(seedStore());
    app.startFreeStudy('deck-3');
    assert.equal(win.location.href, '');
    assert.equal(session._map.has('workCards'), false);
    assert.equal(toasts[toasts.length - 1].type, 'info');
  });

  it('bilinmeyen deste kimliği güvenle reddedilir', () => {
    const { app, session, win } = loadIndex(seedStore());
    app.startFreeStudy('yok');
    assert.equal(win.location.href, '');
    assert.equal(session._map.has('workCards'), false);
  });
});

describe('kalıcı durum koruması', () => {
  function freeSession(answerPattern) {
    const store = seedStore();
    const before = persistSnapshot(store);
    const cards = deckCards();
    const t = loadWorkApp({ store, cards, nowMs: NOW, workMode: 'free' });
    for (let i = 0; i < cards.length; i++) {
      t.app.handleCardResponse(answerPattern[i % answerPattern.length]);
      if (t.timers.length > 0) t.timers[t.timers.length - 1]();
    }
    return { store, before, app: t.app };
  }

  it('doğru serbest yanıtlar kutu ve zaman damgasını değiştirmez', () => {
    const { store, before, app } = freeSession([true]);
    assert.equal(app.studyComplete, true);
    assert.deepEqual(persistSnapshot(store), before);
  });

  it('yanlış serbest yanıtlar kutu ve zaman damgasını değiştirmez', () => {
    const { store, before, app } = freeSession([false]);
    assert.equal(app.studyComplete, true);
    assert.deepEqual(persistSnapshot(store), before);
  });

  it('karışık serbest yanıtlar sayaç ve istatistik girdilerini değiştirmez', () => {
    const { store, before } = freeSession([true, false]);
    const after = persistSnapshot(store);
    assert.deepEqual(after, before);
    assert.deepEqual(JSON.parse(after.decks), JSON.parse(before.decks));
  });

  it('vadesi gelen ve gelmeyen kartlar özgün zamanlamasını korur', () => {
    const { store, before } = freeSession([true, false]);
    const cards = JSON.parse(store.getItem('leitner_cards'));
    const expected = {
      c1: { box: 1, lastReviewDate: null },
      c2: { box: 2, lastReviewDate: NOW - DAY },
      c3: { box: 3, lastReviewDate: NOW - DAY },
      c4: { box: 5, lastReviewDate: NOW - 40 * DAY },
    };
    for (const [id, want] of Object.entries(expected)) {
      const card = cards.find((c) => c.id === id);
      assert.equal(card.box, want.box, `${id} kutusu korunmalı`);
      assert.equal(card.lastReviewDate, want.lastReviewDate, `${id} zamanı korunmalı`);
    }
    void before;
  });

  it('serbest kip kalıcılık yoluna hiç girmez', () => {
    const decks = [{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 1 }];
    const cards = [{ id: 'c1', deckId: 'deck-1', question: 'S?', answer: 'C!', category: '', box: 2, createdAt: NOW - DAY, lastReviewDate: NOW - 3 * DAY }];
    const storageStub = {
      getDecks: () => JSON.parse(JSON.stringify(decks)),
      getCards: () => JSON.parse(JSON.stringify(cards)),
      updateCardBox: () => { throw new Error('Serbest Çalışma depoya yazmamalı'); },
    };
    const t = loadWorkApp({ store: createStore(), cards, storage: storageStub, nowMs: NOW, workMode: 'free', sandboxExtra: { BOX_SCHEDULE: { 1: 1, 2: 2, 3: 4, 4: 7, 5: 30 } } });
    t.app.handleCardResponse(true); // fırlatırsa kip kirlenmiştir
    assert.equal(t.app.currentCardIndex, 1);
  });

  it('serbest kipte klavye yanıtı da yazma yapmaz', () => {
    const store = seedStore();
    const before = persistSnapshot(store);
    const t = loadWorkApp({ store, cards: deckCards(), nowMs: NOW, workMode: 'free' });
    let prevented = false;
    t.doc._listeners.keydown[0]({ key: '2', target: t.doc.body, repeat: false, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(t.app.currentCardIndex, 1);
    assert.deepEqual(persistSnapshot(store), before);
  });
});

describe('normal kip regresyonu', () => {
  it('kip anahtarı yoksa normal kip ve kalıcı yol kullanılır', () => {
    const store = seedStore();
    const t = loadWorkApp({ store, cards: deckCards(), nowMs: NOW });
    assert.equal(t.app.studyMode, 'normal');
    t.app.handleCardResponse(true);
    assert.equal(JSON.parse(store.getItem('leitner_cards')).find((c) => c.id === 'c1').box, 2);
  });

  it('mevcut normal bağlantı normal kip başlatır', () => {
    const store = seedStore();
    const doc = makeDocument();
    const win = { location: { pathname: '/index.html', search: '', href: '' } };
    const session = makeSessionStorage();
    const toasts = [];
    const { page } = runPageScript('js/app.js', {
      store, doc, win, session, timers: [], toasts,
      utilsStub: stubUtils(toasts), nowMs: NOW, captureName: 'app',
    });
    const container = doc.getElementById('decks-container');
    const btn = { _host: container, getAttribute: (n) => (n === 'data-action' ? 'start-study' : 'deck-1') };
    container._listeners.click[0]({ target: { closest: () => btn } });
    assert.equal(session._map.get('workMode'), 'normal');
    assert.equal(win.location.href, 'workpage.html');
  });
});

describe('oturum ve gezinme güvenliği', () => {
  it('serbest kipte çift girdi tek ilerler', () => {
    const t = loadWorkApp({ store: seedStore(), cards: deckCards(), nowMs: NOW, workMode: 'free' });
    t.app.handleCardResponse(true);
    t.app.handleCardResponse(true);
    assert.equal(t.app.currentCardIndex, 1);
    assert.equal(t.timers.length, 1);
  });

  it('serbest kipte bayat zamanlayıcı çizim yapmaz', () => {
    const t = loadWorkApp({ store: seedStore(), cards: deckCards(), nowMs: NOW, workMode: 'free' });
    const container = t.doc.getElementById('card-container');
    t.app.handleCardResponse(true);
    t.app.showStudyComplete();
    const writes = container.innerHTMLWrites();
    t.timers[0]();
    assert.equal(container.innerHTMLWrites(), writes);
  });

  it('geçersiz kip değeri güvenle normale düşer', () => {
    const store = seedStore();
    const t = loadWorkApp({ store, cards: deckCards(), nowMs: NOW, workMode: 'xyz' });
    assert.equal(t.app.studyMode, 'normal');
    t.app.handleCardResponse(true);
    assert.equal(JSON.parse(store.getItem('leitner_cards')).find((c) => c.id === 'c1').box, 2);
  });

  it('bozuk depoda serbest oturum panel gösterir', () => {
    const store = createStore();
    store.setItem('leitner_decks', '{bozuk-json');
    const doc = makeDocument();
    const win = { location: { pathname: '/workpage.html', search: '', href: '' } };
    const session = makeSessionStorage({
      workCards: JSON.stringify(deckCards().slice(0, 1)),
      workDeckId: 'deck-1',
      workMode: 'free',
    });
    runPageScript('js/app.js', {
      store, doc, win, session, timers: [], toasts: [], nowMs: NOW, captureName: 'app',
    });
    assert.ok(doc.getElementById('card-container').innerHTML.includes('Veriler okunamadı'));
    assert.equal(doc.getElementById('correct-btn').disabled, true);
  });

  it('serbest giriş noktası keşfedilebilir', () => {
    const { doc } = loadIndex(seedStore());
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(html.includes('data-action="start-free-study"'));
    assert.ok(html.includes('Serbest Çalış'));
    assert.ok(!html.includes('onclick'));
  });

  it('kip rozeti ve tamamlama metni kipi açıklar', () => {
    const free = loadWorkApp({ store: seedStore(), cards: deckCards().slice(0, 1), nowMs: NOW, workMode: 'free' });
    assert.equal(free.doc.getElementById('study-mode-badge').textContent, 'Serbest Çalışma');
    assert.ok(free.doc.getElementById('study-mode-note').textContent.includes('tekrar takvimini değiştirmez'));
    free.app.handleCardResponse(false);
    const freeHtml = free.doc.getElementById('card-container').innerHTML;
    assert.ok(freeHtml.includes('Serbest Çalışma Tamamlandı'));
    assert.ok(freeHtml.includes('Tekrar takvimin değişmedi.'));
    assert.ok(freeHtml.includes('data-action="go-deck"'));

    const normal = loadWorkApp({ store: seedStore(), cards: deckCards().slice(0, 1), nowMs: NOW });
    assert.equal(normal.doc.getElementById('study-mode-badge').textContent, 'Normal Çalışma');
    assert.equal(normal.doc.getElementById('study-mode-note').textContent, '');
  });

  it('tamamlama düğmeleri doğru hedeflere gider', () => {
    const t = loadWorkApp({ store: seedStore(), cards: deckCards().slice(0, 1), nowMs: NOW, workMode: 'free' });
    const container = t.doc.getElementById('card-container');
    const bound = {};
    container.querySelector = (sel) => ({
      addEventListener: (type, fn) => { bound[sel] = fn; },
    });
    t.app.handleCardResponse(true);
    assert.ok(bound['[data-action="go-deck"]'], 'deste dönüşü bağlanmalı');
    assert.ok(bound['[data-action="go-home"]'], 'ana sayfa dönüşü bağlanmalı');
    bound['[data-action="go-deck"]']();
    assert.equal(t.win.location.href, 'deckpage.html?id=deck-1');
  });
});
