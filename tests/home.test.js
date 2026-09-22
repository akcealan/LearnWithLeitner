// Ana sayfa (Faz 2B revizyonu) testleri: bütünleşik karşılama, ilk çalıştırma,
// eğitim içeriği, canlı özet sayaçları. Sentetik veri; gerçek tarayıcı gerekmez.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('./helpers');
const { makeDocument, makeSessionStorage, runPageScript } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);

function readIndex() {
  return fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
}

function loadIndex(store) {
  const doc = makeDocument();
  const win = { location: { pathname: '/index.html', search: '', href: '' } };
  const { page } = runPageScript('js/app.js', {
    store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'app',
  });
  return { app: page, doc };
}

function seedStore() {
  const store = createStore();
  store.setItem('leitner_decks', JSON.stringify([
    { id: 'deck-1', name: 'Almanca', createdAt: NOW - 30 * DAY, totalCards: 1 },
    { id: 'deck-2', name: 'Tarih', createdAt: NOW - 20 * DAY, totalCards: 2 },
  ]));
  store.setItem('leitner_cards', JSON.stringify([
    { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: '', box: 1, createdAt: NOW - 10 * DAY, lastReviewDate: null },
    { id: 'c2', deckId: 'deck-2', question: 'S2?', answer: 'C2!', category: '', box: 2, createdAt: NOW - 9 * DAY, lastReviewDate: NOW - DAY },
    { id: 'c3', deckId: 'deck-2', question: 'S3?', answer: 'C3!', category: '', box: 1, createdAt: NOW - 8 * DAY, lastReviewDate: NOW - 2 * DAY },
  ]));
  return store;
}

describe('ana sayfa yapısı', () => {
  it('bütünleşik karşılama, oluşturma formu ve tek eğitim bölümü mevcut', () => {
    const html = readIndex();
    assert.ok(html.includes('id="hero-title"'), 'karşılama başlığı olmalı');
    assert.ok(html.includes('id="deck-name-input"'), 'oluşturma girdisi kahramanda olmalı');
    assert.ok(html.includes('id="create-deck-btn"'), 'oluşturma düğmesi olmalı');
    assert.ok(html.includes('id="hero-stats"'), 'özet sayacı olmalı');
    assert.ok(!html.includes('id="hero-start-btn"'), 'yedek eylem düğmesi olmamalı');
    assert.ok(!html.includes('<aside'), 'eski yan panel kaldırılmış olmalı');
    assert.ok(html.includes('id="nasil-calisir"'), 'birleşik eğitim bölümü olmalı');
    assert.ok(html.includes('<details'), 'eğitim akordiyonu yerel öğe olmalı');
    assert.ok(html.includes('@keyframes riseIn'), 'giriş animasyonu tanımlı olmalı');
    assert.ok(!html.includes('onclick'), 'satır içi olay olmamalı');
    assert.ok(!html.includes('test-data'), 'geliştirici yardımcısı yüklenmemeli');
  });
});

describe('ilk çalıştırma deneyimi', () => {
  it('deste yokken yol gösterici kart çizilir', () => {
    const { doc } = loadIndex(createStore());
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(html.includes('İlk destenle başla'));
    assert.ok(html.includes('Deste oluştur'));
    assert.ok(html.includes('Kart ekle'));
    assert.ok(html.includes('Tekrar et'));
    assert.ok(!html.includes('onclick'));
  });

  it('desteler varken kutular listelenir', () => {
    const { doc } = loadIndex(seedStore());
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(html.includes('data-action="start-study"'));
    assert.ok(!html.includes('İlk destenle başla'));
  });
});

describe('deste kutusu hiyerarşisi', () => {
  it('vade rozeti, kutu şeridi ve eylemler çizilir', () => {
    const { doc } = loadIndex(seedStore());
    const html = doc.getElementById('decks-container').innerHTML;
    // deck-1: 1 kart, kutu 1, vadesi gelmiş.
    assert.ok(html.includes('kart tekrar bekliyor'), 'vade rozeti olmalı');
    assert.ok(html.includes('K1') && html.includes('K5'), 'kutu şeridi olmalı');
    assert.ok(html.includes('data-action="delete-deck"'));
    assert.ok(html.includes('data-action="open-deck"'));
    assert.ok(html.includes('aria-label="Desteyi sil"'));
    assert.ok(!html.includes('onclick'));
  });

  it('bekleyen yokken sakin durum gösterilir', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-9', name: 'Boş', createdAt: NOW - DAY, totalCards: 0 }]));
    store.setItem('leitner_cards', JSON.stringify([]));
    const { doc } = loadIndex(store);
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(html.includes('Bekleyen kart yok'));
    assert.ok(!html.includes('kart tekrar bekliyor'));
  });
});

describe('karşılama özeti', () => {
  it('özet gerçek sayıları gösterir (uydurma yok)', () => {
    const { doc } = loadIndex(seedStore());
    // c1 (yeni) + c3 (vadesi dolmuş) bekliyor; c2 (kutu 2, 1 gün önce) beklemiyor.
    assert.equal(doc.getElementById('hero-stats').textContent, '2 deste • 3 kart • 2 tekrar bekliyor');
  });

  it('boş depoda özet sıfırları gösterir', () => {
    const { doc } = loadIndex(createStore());
    assert.equal(doc.getElementById('hero-stats').textContent, '0 deste • 0 kart • 0 tekrar bekliyor');
  });

  it('deste oluşturma özeti ve takvimi tazeler', () => {
    const store = createStore();
    const { app, doc } = loadIndex(store);
    doc.getElementById('deck-name-input').value = 'Almanca Deneme';
    app.createNewDeck();
    assert.equal(doc.getElementById('hero-stats').textContent, '1 deste • 0 kart • 0 tekrar bekliyor');
    assert.ok(doc.getElementById('schedule-container').innerHTML.includes('Almanca Deneme'));
    assert.equal(JSON.parse(store.getItem('leitner_decks')).length, 1);
  });

  it('bozuk depoda panel gösterilir, sayaç sessizce atlanır', () => {
    const store = createStore();
    store.setItem('leitner_decks', '{bozuk-json');
    const { doc } = loadIndex(store);
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(html.includes('Veriler okunamadı'));
    assert.equal(store.getItem('leitner_decks'), '{bozuk-json');
  });
});
