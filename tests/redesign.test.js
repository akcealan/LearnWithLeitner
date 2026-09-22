// Faz 2B revizyonu görsel testleri: tamamlama ekranı, kutu bağlamı,
// deste alt başlığı, istatistik çubukları, paylaşılan stil dosyası.
// Sentetik veri; gerçek tarayıcı gerekmez.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./helpers');
const { makeDocument, makeSessionStorage, runPageScript, loadWorkApp } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);
const PAGES = ['index.html', 'deckpage.html', 'workpage.html', 'statistics.html', 'settings.html'];

function sessionCards() {
  return [
    { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: 'Sıfat', box: 3, createdAt: NOW - DAY, lastReviewDate: NOW - 4 * DAY },
  ];
}

function seedWorkStore() {
  const store = createStore();
  store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 1 }]));
  store.setItem('leitner_cards', JSON.stringify(sessionCards()));
  return store;
}

function loadWork(store, cards) {
  return loadWorkApp({ store, cards, nowMs: NOW });
}

describe('çalışma sunumu', () => {
  it('kart kutu bağlamını gösterir', () => {
    const { doc } = loadWork(seedWorkStore(), sessionCards());
    const html = doc.getElementById('card-container').innerHTML;
    assert.ok(html.includes('Kutu 3 • 4 günde bir tekrar'));
    assert.ok(!html.includes('onclick'));
  });

  it('tamamlama ekranı özet ve dönüş içerir', () => {
    const { app, doc } = loadWork(seedWorkStore(), sessionCards());
    app.handleCardResponse(true);
    const html = doc.getElementById('card-container').innerHTML;
    assert.ok(html.includes('Tebrikler!'));
    assert.ok(html.includes('1 kartı bitirdin.'));
    assert.ok(html.includes('data-action="go-home"'));
    assert.ok(!html.includes('onclick'));
  });
});

describe('deste sayfası başlığı', () => {
  it('alt başlık ve kart sayacı çizilir', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 2 }]));
    store.setItem('leitner_cards', JSON.stringify([
      { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: '', box: 1, createdAt: NOW - DAY, lastReviewDate: null },
      { id: 'c2', deckId: 'deck-1', question: 'S2?', answer: 'C2!', category: '', box: 2, createdAt: NOW - DAY, lastReviewDate: NOW - DAY },
    ]));
    const doc = makeDocument();
    const win = { location: { pathname: '/deckpage.html', search: '?id=deck-1', href: '' } };
    const { page } = runPageScript('js/deckpage.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'deckPage',
    });
    assert.equal(doc.getElementById('deck-subtitle').textContent, '2 kart • 1 tekrar bekliyor');
    assert.equal(doc.getElementById('cards-title').textContent, 'Kartlar (2)');
  });

  it('kart ekleme sayaçları tazeler', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 1 }]));
    store.setItem('leitner_cards', JSON.stringify([
      { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: '', box: 2, createdAt: NOW - DAY, lastReviewDate: NOW - DAY },
    ]));
    const doc = makeDocument();
    const win = { location: { pathname: '/deckpage.html', search: '?id=deck-1', href: '' } };
    const { page } = runPageScript('js/deckpage.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'deckPage',
    });
    doc.getElementById('card-question-input').value = 'Yeni soru?';
    doc.getElementById('card-answer-input').value = 'Yeni cevap!';
    doc.getElementById('card-category-input').value = '';
    page.addNewCard();
    assert.equal(doc.getElementById('deck-subtitle').textContent, '2 kart • 1 tekrar bekliyor');
    assert.equal(doc.getElementById('cards-title').textContent, 'Kartlar (2)');
  });
});

describe('istatistik görselleştirme', () => {
  function loadStats(decks, cards) {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify(decks));
    store.setItem('leitner_cards', JSON.stringify(cards));
    const doc = makeDocument();
    const win = { location: { pathname: '/statistics.html', search: '', href: '' } };
    runPageScript('js/statistics.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'statsPage',
    });
    return doc;
  }

  it('kutu çubukları gerçek oranları gösterir', () => {
    const doc = loadStats(
      [{ id: 'd1', name: 'D', createdAt: NOW - DAY, totalCards: 4 }],
      [1, 1, 2, 5].map((box, i) => ({
        id: `c${i}`, deckId: 'd1', question: 'S?', answer: 'C!', category: '',
        box, createdAt: NOW - DAY, lastReviewDate: null,
      }))
    );
    assert.equal(doc.getElementById('total-cards').textContent, '4');
    assert.equal(doc.getElementById('box-1-bar').style.width, '50%');
    assert.equal(doc.getElementById('box-2-bar').style.width, '25%');
    assert.equal(doc.getElementById('box-5-bar').style.width, '25%');
  });

  it('boş durumda yönlendirici metin gösterilir', () => {
    const doc = loadStats([], []);
    assert.ok(doc.getElementById('deck-stats').innerHTML.includes('ana sayfadan'));
  });
});

describe('paylaşılan stil dosyası', () => {
  it('beş sayfa da ortak stile bağlanır', () => {
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
      assert.ok(html.includes('href="css/app.css"'), `${page} ortak stili kullanmalı`);
    }
    const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'app.css'), 'utf8');
    assert.ok(css.includes('.lp-enter'), 'giriş sınıfı olmalı');
    assert.ok(css.includes('.lp-lift'), 'kaldırma sınıfı olmalı');
    assert.ok(css.includes('@keyframes modalPop'), 'iletişim girişi olmalı');
    assert.ok(css.includes('@keyframes slideIn'), 'bildirim girişi olmalı');
  });
});
