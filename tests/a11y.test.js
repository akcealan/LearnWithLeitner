// Duyarlılık + erişilebilirlik regresyon testleri.
// 1) Statik HTML denetimleri (etiket, modal semantiği, yinelenen id, betik yolu).
// 2) Sahte DOM ile etkileşim: bildirim, modal odağı, ilerleme semantiği.
// Sentetik veri; gerçek tarayıcı gerekmez.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createStore } = require('./helpers');
const { makeDocument, makeSessionStorage, runPageScript, stubUtils, srcOf } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);
const PAGES = ['index.html', 'deckpage.html', 'workpage.html', 'statistics.html', 'settings.html'];
const MODAL_PAGES = ['index.html', 'deckpage.html', 'workpage.html', 'settings.html'];

function readPage(name) {
  return fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
}

function idsOf(html) {
  const ids = [];
  const re = /id="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.push(m[1]);
  return ids;
}

describe('statik HTML denetimleri', () => {
  for (const page of MODAL_PAGES) {
    it(`${page}: iletişim kutusu semantiği ve kaydırılabilir panel`, () => {
      const html = readPage(page);
      assert.ok(html.includes('role="dialog"'), 'role=dialog olmalı');
      assert.ok(html.includes('aria-modal="true"'), 'aria-modal olmalı');
      assert.ok(html.includes('aria-labelledby="modal-title"'), 'başlık ilişkisi olmalı');
      assert.ok(html.includes('aria-describedby="modal-message"'), 'açıklama ilişkisi olmalı');
      assert.ok(html.includes('max-h-[90vh]'), 'kısa ekranda taşmamalı');
      assert.ok(html.includes('overflow-y-auto'), 'uzun mesaj kaymalı');
    });
  }

  for (const page of PAGES) {
    it(`${page}: atlama bağlantısı, yinelenen id yok, satır içi olay yok`, () => {
      const html = readPage(page);
      assert.ok(html.includes('Ana içeriğe atla'), 'atlama bağlantısı olmalı');
      const skip = html.match(/href="#([^"]+)"[^>]*>Ana içeriğe atla/);
      assert.ok(skip, 'atlama hedefi okunmalı');
      assert.ok(html.includes(`id="${skip[1]}"`), 'atlama hedefi mevcut olmalı');
      const ids = idsOf(html);
      assert.equal(new Set(ids).size, ids.length, 'yinelenen id olmamalı');
      assert.ok(!html.includes('onclick'), 'satır içi olay olmamalı');
      assert.ok(html.includes(':focus-visible'), 'odak stili olmalı');
      assert.ok(html.includes('prefers-reduced-motion'), 'hareket tercihi olmalı');
    });

    it(`${page}: betik yolları mevcut dosyaları gösteriyor`, () => {
      const html = readPage(page);
      const re = /<script src="(js\/[^"]+)"><\/script>/g;
      let m;
      let count = 0;
      while ((m = re.exec(html)) !== null) {
        assert.ok(fs.existsSync(path.join(__dirname, '..', m[1])), `betik bulunmalı: ${m[1]}`);
        count += 1;
      }
      assert.ok(count > 0, 'en az bir betik olmalı');
    });
  }

  it('index: deste adı girdisinin programatik etiketi var', () => {
    const html = readPage('index.html');
    assert.ok(html.includes('for="deck-name-input"'), 'etiket girdiye bağlı olmalı');
    assert.ok(html.includes('aria-label="İstatistikler"'), 'istatistik bağlantı adı olmalı');
    assert.ok(html.includes('aria-label="Ayarlar"'), 'ayar bağlantı adı olmalı');
  });

  it('deckpage: kart girdilerinin programatik etiketi var', () => {
    const html = readPage('deckpage.html');
    for (const id of ['card-question-input', 'card-answer-input', 'card-category-input']) {
      assert.ok(html.includes(`for="${id}"`), `etiket bağlı olmalı: ${id}`);
    }
    assert.ok(html.includes('aria-label="Desteyi sil"'), 'deste silme adı olmalı');
    assert.ok(html.includes('aria-label="Geri dön"'), 'geri bağlantı adı olmalı');
  });

  it('workpage: kapatma düğmesi ve ilerleme semantiği var', () => {
    const html = readPage('workpage.html');
    assert.ok(html.includes('aria-label="Çalışmayı kapat"'), 'kapatma adı olmalı');
    assert.ok(html.includes('role="progressbar"'), 'ilerleme rolü olmalı');
    assert.ok(html.includes('aria-live="polite"'), 'ilerleme metni canlı olmalı');
  });

  it('settings: tema düğmelerinin erişilebilir adı var', () => {
    const html = readPage('settings.html');
    assert.ok(html.includes('aria-label="Açık tema"'), 'açık tema adı olmalı');
    assert.ok(html.includes('aria-label="Koyu tema"'), 'koyu tema adı olmalı');
    assert.ok(html.includes('aria-label="Tema seçimi"'), 'tema grubu adı olmalı');
  });
});

describe('dinamik çıktı erişilebilirliği', () => {
  function loadIndex() {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 1 }]));
    store.setItem('leitner_cards', JSON.stringify([
      { id: 'c1', deckId: 'deck-1', question: 'S?', answer: 'C!', category: '', box: 1, createdAt: NOW - DAY, lastReviewDate: null },
    ]));
    const doc = makeDocument();
    const win = { location: { pathname: '/index.html', search: '', href: '' } };
    const { page } = runPageScript('js/app.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'app',
    });
    return { app: page, doc };
  }

  it('deste kutusu: silme adı + taşmayan metin, satır içi olay yok', () => {
    const { doc } = loadIndex();
    const html = doc.getElementById('decks-container').innerHTML;
    assert.ok(html.includes('aria-label="Desteyi sil"'));
    assert.ok(html.includes('break-words'));
    assert.ok(!html.includes('onclick'));
  });

  it('kart kutusu: silme adı var', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 1 }]));
    store.setItem('leitner_cards', JSON.stringify([
      { id: 'c1', deckId: 'deck-1', question: 'S?', answer: 'C!', category: '', box: 1, createdAt: NOW - DAY, lastReviewDate: null },
    ]));
    const doc = makeDocument();
    const win = { location: { pathname: '/deckpage.html', search: '?id=deck-1', href: '' } };
    runPageScript('js/deckpage.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts: [], nowMs: NOW, captureName: 'deckPage',
    });
    const html = doc.getElementById('cards-container').innerHTML;
    assert.ok(html.includes('aria-label="Kartı sil"'));
    assert.ok(!html.includes('onclick'));
  });
});

describe('bildirim geri bildirimi', () => {
  function loadUtilsSandbox(doc) {
    const sandbox = {
      document: doc, console, Math, JSON,
      setTimeout: () => 0,
      clearTimeout: () => {},
    };
    vm.createContext(sandbox);
    return vm.runInContext(`${srcOf('js/utils.js')}\n;Utils;`, sandbox, { filename: 'utils.js' });
  }

  it('toast dar ekrana sığar ve durum olarak duyurulur', () => {
    const doc = makeDocument();
    const Utils = loadUtilsSandbox(doc);
    Utils.showToast('Deneme bildirimi', 'success');
    assert.equal(doc.body.children.length, 1);
    const toast = doc.body.children[0];
    assert.equal(toast.textContent, 'Deneme bildirimi');
    assert.equal(toast.getAttribute('role'), 'status');
    assert.ok(toast.style.cssText.includes('max-width'));
  });
});

describe('iletişim kutusu odağı', () => {
  function openModal() {
    const store = createStore();
    const doc = makeDocument();
    const win = { location: { pathname: '/index.html', search: '', href: '' } };
    const toasts = [];
    const { page } = runPageScript('js/app.js', {
      store, doc, win, session: makeSessionStorage(), timers: [], toasts,
      utilsStub: stubUtils(toasts), nowMs: NOW, captureName: 'app',
    });
    // Klon yerine kendisi dönsün ki dinleyiciler gözlenebilsin.
    doc.getElementById('modal-cancel').cloneNode = function () { return this; };
    doc.getElementById('modal-confirm').cloneNode = function () { return this; };
    return { app: page, doc };
  }

  it('açılışta odak iptalde, onay bir kez çalışır, odak geri döner', () => {
    const { app, doc } = openModal();
    const opener = doc.getElementById('create-deck-btn');
    doc.activeElement = opener;
    const confirmed = [];
    app.showConfirmationModal('Başlık', 'Mesaj', () => confirmed.push(1));

    const modal = doc.getElementById('confirmation-modal');
    const cancel = doc.getElementById('modal-cancel');
    assert.ok(!modal.classList.contains('hidden'));
    assert.equal(cancel._focused, true);

    doc.getElementById('modal-confirm').click();
    assert.deepEqual(confirmed, [1]);
    assert.ok(modal.classList.contains('hidden'));
    assert.equal(opener._focused, true);
  });

  it('Escape onaylamadan kapatır, Tab diyalogda döner', () => {
    const { app, doc } = openModal();
    doc.activeElement = null;
    const confirmed = [];
    app.showConfirmationModal('Başlık', 'Mesaj', () => confirmed.push(1));

    const modal = doc.getElementById('confirmation-modal');
    const cancel = doc.getElementById('modal-cancel');
    const confirm = doc.getElementById('modal-confirm');
    modal.querySelector = (sel) => (sel === '#modal-cancel' ? cancel : null);
    modal.querySelectorAll = () => [cancel, confirm];

    const fireKey = (e) => modal._listeners.keydown[0]({
      shiftKey: false, ...e, preventDefault() {},
    });
    fireKey({ key: 'Escape' });
    assert.deepEqual(confirmed, []);
    assert.ok(modal.classList.contains('hidden'));

    app.showConfirmationModal('Başlık', 'Mesaj', () => confirmed.push(1));
    doc.activeElement = confirm; // sondan Tab: başa sarar
    let prevented = false;
    modal._listeners.keydown[0]({ key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(cancel._focused, true);
  });
});

describe('çalışma ilerleme semantiği', () => {
  it('ilerleme çubuğu değerleri güncellenir', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'deck-1', name: 'Deste', createdAt: NOW - DAY, totalCards: 2 }]));
    const cards = [
      { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: '', box: 1, createdAt: NOW - DAY, lastReviewDate: null },
      { id: 'c2', deckId: 'deck-1', question: 'S2?', answer: 'C2!', category: '', box: 1, createdAt: NOW - DAY, lastReviewDate: null },
    ];
    store.setItem('leitner_cards', JSON.stringify(cards));
    const doc = makeDocument();
    const win = { location: { pathname: '/workpage.html', search: '', href: '' } };
    const session = makeSessionStorage({ workCards: JSON.stringify(cards), workDeckId: 'deck-1' });
    const toasts = [];
    const { page } = runPageScript('js/app.js', {
      store, doc, win, session, timers: [], toasts,
      utilsStub: stubUtils(toasts), nowMs: NOW, captureName: 'app',
    });
    void page;
    const track = doc.getElementById('progress-track');
    assert.equal(track.getAttribute('aria-valuemax'), '2');
    assert.equal(track.getAttribute('aria-valuenow'), '1');
    assert.ok(doc.getElementById('card-container').innerHTML.includes('break-words'));
  });
});
