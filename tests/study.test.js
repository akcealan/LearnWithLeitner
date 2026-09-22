// Çalışma oturumu koruma testleri: çift yanıt kilidi, yazma hatasında
// ilerlememe, tek seferlik tamamlama, bayat zamanlayıcı, klavye, yetkilendirme.
// Sentetik veri + sahte DOM; gerçek tarayıcı gerekmez.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, loadStorage } = require('./helpers');
const { makeDocument, makeSessionStorage, makeElement, runPageScript, loadWorkApp } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);

function sessionCards() {
  return [
    { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: '', box: 1, createdAt: NOW - DAY, lastReviewDate: null },
    { id: 'c2', deckId: 'deck-1', question: 'S2?', answer: 'C2!', category: '', box: 2, createdAt: NOW - DAY, lastReviewDate: NOW - DAY },
  ];
}

function seedSessionStore() {
  const store = createStore();
  store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 2 }]));
  store.setItem('leitner_cards', JSON.stringify(sessionCards()));
  return store;
}

function storedCards(store) {
  return JSON.parse(store.getItem('leitner_cards'));
}

function dispatchKey(doc, event) {
  let prevented = false;
  doc._listeners.keydown[0]({ repeat: false, ...event, preventDefault() { prevented = true; } });
  return prevented;
}

describe('çift yanıt kilidi', () => {
  it('gecikme sırasında ikinci yanıt sonraki kartı erken işlemez', () => {
    const store = seedSessionStore();
    const { app, timers, doc } = loadWorkApp({ store, cards: sessionCards(), nowMs: NOW });

    app.handleCardResponse(true); // c1: kutu 1 -> 2
    app.handleCardResponse(true); // kilitli: yok sayılmalı
    app.handleCardResponse(false); // kilitli: yok sayılmalı

    const cards = storedCards(store);
    assert.equal(cards.find((c) => c.id === 'c1').box, 2);
    const c2 = cards.find((c) => c.id === 'c2');
    assert.equal(c2.box, 2);
    assert.equal(c2.lastReviewDate, NOW - DAY);
    assert.equal(timers.length, 1);
    assert.equal(doc.getElementById('correct-btn').disabled, true);
    assert.equal(doc.getElementById('wrong-btn').disabled, true);

    timers[0](); // sonraki kart çizilir, kilit açılır
    assert.equal(app.isResponding, false);
    assert.equal(doc.getElementById('correct-btn').disabled, false);

    app.handleCardResponse(false); // c2: kutu 2 -> 1, oturum biter
    assert.equal(storedCards(store).find((c) => c.id === 'c2').box, 1);
    assert.equal(app.studyComplete, true);
  });

  it('yazma hatası indeksi ilerletmez, yeniden denemeye izin verir', () => {
    let impl = () => null;
    const storageStub = {
      updateCardBox: (...args) => impl(...args),
      getDecks: () => [{ id: 'deck-1', name: 'Deste' }],
    };
    const { app, timers, toasts } = loadWorkApp({
      store: createStore(), cards: sessionCards(), storage: storageStub, nowMs: NOW,
    });

    app.handleCardResponse(true);
    assert.equal(app.currentCardIndex, 0);
    assert.equal(timers.length, 0);
    assert.equal(toasts[toasts.length - 1].type, 'error');

    impl = () => ({ id: 'c1' });
    app.handleCardResponse(true);
    assert.equal(app.currentCardIndex, 1);
    assert.equal(timers.length, 1);
  });
});

describe('tamamlama sınırları', () => {
  it('tamamlama ekranı en fazla bir kez gösterilir', () => {
    const store = seedSessionStore();
    const one = [sessionCards()[0]];
    store.setItem('leitner_cards', JSON.stringify(one));
    const { app, doc } = loadWorkApp({ store, cards: one, nowMs: NOW });
    const container = doc.getElementById('card-container');

    app.handleCardResponse(true);
    const writes = container.innerHTMLWrites();
    assert.equal(writes, 2); // ilk çizim + tamamlama
    assert.ok(container.innerHTML.includes('data-action="go-home"'));
    assert.ok(!container.innerHTML.includes('onclick'));

    app.showStudyComplete();
    app.showStudyComplete();
    app.handleCardResponse(true);
    assert.equal(container.innerHTMLWrites(), writes);
    assert.equal(app.studyComplete, true);
  });

  it('bayat zamanlayıcı biten oturumda kart çizmez', () => {
    const store = seedSessionStore();
    const { app, timers, doc } = loadWorkApp({ store, cards: sessionCards(), nowMs: NOW });
    const container = doc.getElementById('card-container');

    app.handleCardResponse(true); // zamanlayıcı yakalanır
    assert.equal(timers.length, 1);
    app.showStudyComplete(); // oturum biter
    const writes = container.innerHTMLWrites();

    timers[0](); // bayat çağrı: kart çizmemeli
    assert.equal(container.innerHTMLWrites(), writes);
    assert.equal(app.studyComplete, true);
  });
});

describe('klavye kısayolları', () => {
  it('1 yanlış, 2/Sağ Ok doğru yanıtı işler', () => {
    const store = seedSessionStore();
    const t = loadWorkApp({ store, cards: sessionCards(), nowMs: NOW });
    dispatchKey(t.doc, { key: '1', target: t.doc.body });
    assert.equal(storedCards(store).find((c) => c.id === 'c1').lastReviewDate, NOW);
    assert.equal(t.app.currentCardIndex, 1);

    t.timers[0]();
    dispatchKey(t.doc, { key: 'ArrowRight', target: t.doc.body });
    assert.equal(storedCards(store).find((c) => c.id === 'c2').box, 3);
    assert.equal(t.app.studyComplete, true);
  });

  it('basılı tutulan tuş (repeat) kart işlemez', () => {
    const store = seedSessionStore();
    const t = loadWorkApp({ store, cards: sessionCards(), nowMs: NOW });
    dispatchKey(t.doc, { key: '2', target: t.doc.body, repeat: true });
    assert.equal(t.app.currentCardIndex, 0);
    assert.equal(t.timers.length, 0);
    assert.equal(storedCards(store).find((c) => c.id === 'c1').lastReviewDate, null);
  });

  it('onay diyaloğu açıkken kısayollar işletilmez', () => {
    const store = seedSessionStore();
    const t = loadWorkApp({ store, cards: sessionCards(), nowMs: NOW });
    t.doc.getElementById('confirmation-modal').classList.remove('hidden');
    dispatchKey(t.doc, { key: '1', target: t.doc.body });
    dispatchKey(t.doc, { key: ' ', target: t.doc.body });
    assert.equal(t.app.currentCardIndex, 0);
    assert.equal(t.timers.length, 0);
  });

  it('odak metin alanında iken kısayollar işletilmez', () => {
    const store = seedSessionStore();
    const t = loadWorkApp({ store, cards: sessionCards(), nowMs: NOW });
    const input = makeElement('input');
    dispatchKey(t.doc, { key: '1', target: input });
    dispatchKey(t.doc, { key: ' ', target: input });
    assert.equal(t.app.currentCardIndex, 0);
    assert.equal(t.timers.length, 0);
  });

  it('Space kartı çevirir, odaklı düğmeyi tetiklemez', () => {
    const store = seedSessionStore();
    const t = loadWorkApp({ store, cards: sessionCards(), nowMs: NOW });
    const flip = t.doc.getElementById('flip-card');
    const prevented = dispatchKey(t.doc, { key: ' ', target: t.doc.getElementById('correct-btn') });
    assert.equal(prevented, true);
    assert.ok(flip.classList.contains('flipped'));
    assert.equal(t.app.currentCardIndex, 0); // yanıt işlenmedi
  });
});

describe('olay yetkilendirme (index)', () => {
  function loadIndex() {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 1 }]));
    store.setItem('leitner_cards', JSON.stringify([sessionCards()[0]]));
    const doc = makeDocument();
    const win = { location: { pathname: '/index.html', search: '', href: '' } };
    const timers = [];
    const toasts = [];
    const { page } = runPageScript('js/app.js', {
      store, doc, win, session: makeSessionStorage(), timers, toasts, nowMs: NOW, captureName: 'app',
    });
    return { app: page, doc, store };
  }

  it('dinamik düğmelerde satır içi onclick yok, data-action var', () => {
    const { doc } = loadIndex();
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(!html.includes('onclick'));
    assert.ok(html.includes('data-action="delete-deck"'));
    assert.ok(html.includes('data-action="start-study"'));
    assert.ok(html.includes('data-action="open-deck"'));
    assert.ok(html.includes('data-id="deck-1"'));
  });

  it('her eylem tek dinleyiciyle bir kez çalışır', () => {
    const { app, doc } = loadIndex();
    const container = doc.getElementById('decks-container');
    assert.equal(container._listeners.click.length, 1);

    const calls = [];
    app.deleteDeck = (id) => calls.push(['delete', id]);
    app.startStudy = (id) => calls.push(['study', id]);
    app.openDeckCards = (id) => calls.push(['open', id]);

    const fire = (action, id) => {
      const btn = { _host: container, getAttribute: (n) => (n === 'data-action' ? action : id) };
      container._listeners.click[0]({ target: { closest: () => btn } });
    };
    fire('delete-deck', 'deck-1');
    fire('start-study', 'deck-1');
    fire('open-deck', 'deck-1');
    fire('bilinmeyen', 'deck-1');
    fire('delete-deck', null);
    assert.deepEqual(calls, [['delete', 'deck-1'], ['study', 'deck-1'], ['open', 'deck-1']]);
  });

  it('bozuk depoda yıkıcı işlem yerine açıklama paneli gösterilir', () => {
    const store = createStore();
    store.setItem('leitner_decks', '{bozuk-json');
    const doc = makeDocument();
    const win = { location: { pathname: '/index.html', search: '', href: '' } };
    runPageScript('js/app.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'app',
    });
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(html.includes('Veriler okunamadı'));
    assert.ok(html.includes('settings.html'));
    assert.equal(store.getItem('leitner_decks'), '{bozuk-json'); // üzerine yazılmadı
  });
});
