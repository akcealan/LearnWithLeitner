// Bozuk depo arayüzü testleri: Utils paneli + sayfa giriş noktaları.
// Veri sentetiktir; panel sabit metindir, ham içerik yansıtmaz.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createStore } = require('./helpers');
const { makeDocument, makeSessionStorage, makeElement, runPageScript, srcOf } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);

function loadUtils(doc) {
  const sandbox = { document: doc, console, Math, JSON };
  vm.createContext(sandbox);
  return vm.runInContext(`${srcOf('js/utils.js')}\n;Utils;`, sandbox, { filename: 'utils.js' });
}

describe('Utils.showStorageError', () => {
  it('Türkçe açıklama + kurtarma yolu gösterir, veri yansıtmaz', () => {
    const Utils = loadUtils(makeDocument());
    const el = makeElement();
    assert.equal(Utils.showStorageError(el), true);
    assert.ok(el.innerHTML.includes('Veriler okunamadı'));
    assert.ok(el.innerHTML.includes('silinmedi'));
    assert.ok(el.innerHTML.includes('settings.html'));
    assert.ok(el.innerHTML.includes("Ayarlar'a Git"));
    assert.ok(!el.innerHTML.includes('onclick'));
  });

  it('kapsayıcı yoksa false döner', () => {
    const Utils = loadUtils(makeDocument());
    assert.equal(Utils.showStorageError(null), false);
    assert.equal(Utils.showStorageError(undefined), false);
  });
});

describe('sayfa giriş noktaları (bozuk depo)', () => {
  function corruptStore() {
    const store = createStore();
    store.setItem('leitner_decks', '{bozuk-json');
    store.setItem('leitner_cards', JSON.stringify([]));
    return store;
  }

  it('deckpage: panel gösterir, başlığı düşürür, veri korunur', () => {
    const store = corruptStore();
    const doc = makeDocument();
    const win = { location: { pathname: '/deckpage.html', search: '?id=d1', href: '' } };
    runPageScript('js/deckpage.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'deckPage',
    });
    const html = doc.getElementById('cards-container').innerHTML;
    assert.ok(html.includes('Veriler okunamadı'));
    assert.equal(doc.getElementById('deck-title').textContent, 'Veri okunamadı');
    assert.equal(store.getItem('leitner_decks'), '{bozuk-json');
  });

  it('workpage: panel gösterir, yanıt düğmelerini kilitler', () => {
    const store = corruptStore();
    const doc = makeDocument();
    const win = { location: { pathname: '/workpage.html', search: '', href: '' } };
    const session = makeSessionStorage({
      workCards: JSON.stringify([{ id: 'c1', deckId: 'd1', question: 'S?', answer: 'C!', box: 1 }]),
      workDeckId: 'd1',
    });
    runPageScript('js/app.js', {
      store, doc, win, session, timers: [], toasts: [], nowMs: NOW, captureName: 'app',
    });
    const html = doc.getElementById('card-container').innerHTML;
    assert.ok(html.includes('Veriler okunamadı'));
    assert.equal(doc.getElementById('correct-btn').disabled, true);
    assert.equal(doc.getElementById('wrong-btn').disabled, true);
  });

  it('workpage: deste geçerli, kart JSON bozuksa panel hemen gösterilir', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'd1', name: 'Deste', createdAt: NOW - DAY, totalCards: 1 }]));
    store.setItem('leitner_cards', '{bozuk-json');
    const doc = makeDocument();
    const win = { location: { pathname: '/workpage.html', search: '', href: '' } };
    const session = makeSessionStorage({
      workCards: JSON.stringify([{ id: 'c1', deckId: 'd1', question: 'S?', answer: 'C!', box: 1 }]),
      workDeckId: 'd1',
    });
    const { page: app } = runPageScript('js/app.js', {
      store, doc, win, session, timers: [], toasts: [], nowMs: NOW, captureName: 'app',
    });
    const html = doc.getElementById('card-container').innerHTML;
    assert.ok(html.includes('Veriler okunamadı'));
    assert.ok(!html.includes('flip-card')); // normal oturum kartı çizilmedi
    assert.equal(doc.getElementById('correct-btn').disabled, true);
    assert.equal(doc.getElementById('wrong-btn').disabled, true);
    assert.equal(app.currentCardIndex, 0); // ilerleme değişmedi
    assert.equal(store.getItem('leitner_cards'), '{bozuk-json'); // ham veri korunur
  });

  it('statistics: sayfa üstünde panel gösterir, veri korunur', () => {
    const store = corruptStore();
    const doc = makeDocument();
    const win = { location: { pathname: '/statistics.html', search: '', href: '' } };
    runPageScript('js/statistics.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'statsPage',
    });
    const main = doc._selectors.get('main .max-w-6xl');
    assert.ok(main && main.children.length === 1);
    assert.ok(main.children[0].innerHTML.includes('Veriler okunamadı'));
    assert.equal(store.getItem('leitner_decks'), '{bozuk-json');
  });
});
