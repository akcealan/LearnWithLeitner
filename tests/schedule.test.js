// Faz 4B: ana sayfa tekrar takvimi, kimlik ve çıkış metni testleri.
// Gerçek depolama mantığı + sabit saat; sentetik veri, gerçek tarayıcı gerekmez.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createStore, loadStorage } = require('./helpers');
const { makeDocument, makeSessionStorage, runPageScript, loadWorkApp, srcOf } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0); // sabit saat
const PAGES = ['index.html', 'deckpage.html', 'workpage.html', 'statistics.html', 'settings.html'];

function seedStore() {
  const store = createStore();
  store.setItem('leitner_decks', JSON.stringify([
    { id: 'deck-1', name: 'Almanca', createdAt: NOW - 30 * DAY, totalCards: 4 },
    { id: 'deck-2', name: 'Tarih', createdAt: NOW - 20 * DAY, totalCards: 2 },
  ]));
  store.setItem('leitner_cards', JSON.stringify([
    // deck-1: yeni + vadesi gelen + vadesi gelmeyen + geciken
    { id: 'c1', deckId: 'deck-1', question: 'S1?', answer: 'C1!', category: '', box: 1, createdAt: NOW - 10 * DAY, lastReviewDate: null },
    { id: 'c2', deckId: 'deck-1', question: 'S2?', answer: 'C2!', category: '', box: 2, createdAt: NOW - 9 * DAY, lastReviewDate: NOW - 3 * DAY },
    { id: 'c3', deckId: 'deck-1', question: 'S3?', answer: 'C3!', category: '', box: 2, createdAt: NOW - 8 * DAY, lastReviewDate: NOW - DAY },
    { id: 'c4', deckId: 'deck-1', question: 'S4?', answer: 'C4!', category: '', box: 5, createdAt: NOW - 40 * DAY, lastReviewDate: NOW - 40 * DAY },
    // deck-2: yalnızca yaklaşan
    { id: 'c5', deckId: 'deck-2', question: 'S5?', answer: 'C5!', category: '', box: 3, createdAt: NOW - 5 * DAY, lastReviewDate: NOW - DAY },
    { id: 'c6', deckId: 'deck-2', question: 'S6?', answer: 'C6!', category: '', box: 3, createdAt: NOW - 5 * DAY, lastReviewDate: NOW - DAY + 3600000 },
  ]));
  return store;
}

function loadSchedule(nowMs = NOW) {
  const { Storage } = loadStorage({ store: createStore(), nowMs });
  void Storage;
  return loadStorage({ store: createStore(), nowMs });
}

function loadIndex(store) {
  const doc = makeDocument();
  const win = { location: { pathname: '/index.html', search: '', href: '' } };
  const toasts = [];
  const { page } = runPageScript('js/app.js', {
    store, doc, win, session: makeSessionStorage(), timers: [], toasts,
    nowMs: NOW, captureName: 'app',
  });
  return { app: page, doc, win, toasts };
}

function loadUtils() {
  const sandbox = { document: makeDocument(), console, Math, JSON, setTimeout: () => 0, clearTimeout: () => {} };
  vm.createContext(sandbox);
  return vm.runInContext(`${srcOf('js/utils.js')}\n;Utils;`, sandbox, { filename: 'utils.js' });
}

describe('takvim hesapları', () => {
  it('yeni kart zaman damgasız vadelidir', () => {
    const { Storage } = loadStorage({ store: seedStore(), nowMs: NOW });
    const deck = Storage.getReviewSchedule(NOW).find((d) => d.deckId === 'deck-1');
    const box1 = deck.boxes.find((b) => b.box === 1);
    assert.equal(box1.total, 1);
    assert.equal(box1.due, 1);
    assert.equal(box1.nextDueAt, null);
    assert.equal(box1.upcoming.length, 0);
  });

  it('beş kutunun aralıkları doğru uygulanır', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'd', name: 'D', createdAt: NOW - DAY, totalCards: 5 }]));
    // Her kutuda vadesine 1 saat kalmış bir kart.
    const intervals = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 30 };
    store.setItem('leitner_cards', JSON.stringify(Object.entries(intervals).map(([box, days], i) => ({
      id: `c${i}`, deckId: 'd', question: 'S?', answer: 'C!', category: '',
      box: Number(box), createdAt: NOW - 40 * DAY, lastReviewDate: NOW - days * DAY + 3600000,
    }))));
    const { Storage } = loadStorage({ store, nowMs: NOW });
    const [deck] = Storage.getReviewSchedule(NOW);
    assert.equal(deck.dueCount, 0);
    for (const entry of deck.boxes) {
      assert.equal(entry.upcoming.length, 1);
      assert.equal(entry.nextDueAt, NOW + 3600000);
    }
  });

  it('yaklaşan kart vadeliden sayılmaz', () => {
    const { Storage } = loadStorage({ store: seedStore(), nowMs: NOW });
    const deck = Storage.getReviewSchedule(NOW).find((d) => d.deckId === 'deck-2');
    assert.equal(deck.dueCount, 0);
    assert.equal(deck.boxes[0].upcoming.length, 2);
  });

  it('kart tam vade sınırında vadelidir', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'd', name: 'D', createdAt: NOW - DAY, totalCards: 1 }]));
    store.setItem('leitner_cards', JSON.stringify([
      { id: 'c', deckId: 'd', question: 'S?', answer: 'C!', category: '', box: 2, createdAt: NOW - 10 * DAY, lastReviewDate: NOW - 2 * DAY },
    ]));
    const { Storage } = loadStorage({ store, nowMs: NOW });
    const [deck] = Storage.getReviewSchedule(NOW);
    assert.equal(deck.dueCount, 1);
    assert.equal(deck.boxes[0].upcoming.length, 0);
  });

  it('geciken tekrar görünür kalır', () => {
    const { Storage } = loadStorage({ store: seedStore(), nowMs: NOW });
    const deck = Storage.getReviewSchedule(NOW).find((d) => d.deckId === 'deck-1');
    // c2 (kutu 2, 3 gün önce) ve c4 (kutu 5, 40 gün önce) dünden eski vadelere sahip.
    assert.ok(deck.overdueCount >= 2);
    const box2 = deck.boxes.find((b) => b.box === 2);
    assert.equal(box2.overdue, 1);
  });

  it('aynı kutudaki farklı zamanlar tekleştirilmez', () => {
    const { Storage } = loadStorage({ store: seedStore(), nowMs: NOW });
    const deck = Storage.getReviewSchedule(NOW).find((d) => d.deckId === 'deck-2');
    const box3 = deck.boxes.find((b) => b.box === 3);
    // c5 ve c6 aynı kutuda, 1 saat farklı vadelere sahip.
    assert.equal(box3.upcoming.length, 2);
    assert.equal(box3.nextDueAt, NOW - DAY + 4 * DAY);
    assert.ok(box3.upcoming[0].at < box3.upcoming[1].at);
  });

  it('deste ve kutu kimlikleri doğrudur', () => {
    const { Storage } = loadStorage({ store: seedStore(), nowMs: NOW });
    const schedule = Storage.getReviewSchedule(NOW);
    assert.deepEqual(schedule.map((d) => d.deckId), ['deck-1', 'deck-2']);
    const deck1 = schedule[0];
    assert.equal(deck1.deckName, 'Almanca');
    assert.deepEqual([...deck1.boxes.map((b) => b.box)], [1, 2, 5]);
    assert.equal(deck1.totalCards, 4);
  });

  it('aynı zaman damgası gruplanır', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'd', name: 'D', createdAt: NOW - DAY, totalCards: 2 }]));
    const card = (id) => ({
      id, deckId: 'd', question: 'S?', answer: 'C!', category: '',
      box: 1, createdAt: NOW - 10 * DAY, lastReviewDate: NOW - 12 * 3600000,
    });
    store.setItem('leitner_cards', JSON.stringify([card('a'), card('b')]));
    const { Storage } = loadStorage({ store, nowMs: NOW });
    const [deck] = Storage.getReviewSchedule(NOW);
    assert.equal(deck.boxes[0].upcoming.length, 1);
    assert.equal(deck.boxes[0].upcoming[0].count, 2);
  });
});

describe('tarih biçimi', () => {
  function startOfToday() {
    const d = new Date(NOW);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  function expectedTime(ts) {
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  }

  it('bugün ve yarın etiketleri yereldir', () => {
    const Utils = loadUtils();
    const today = startOfToday() + 15 * 3600000 + 30 * 60000;
    assert.equal(Utils.formatReviewTime(today, NOW), `Bugün, ${expectedTime(today)}`);
    const tomorrow = startOfToday() + DAY + 9 * 3600000;
    assert.equal(Utils.formatReviewTime(tomorrow, NOW), `Yarın, ${expectedTime(tomorrow)}`);
  });

  it('uzak tarih ay adıyla, yıl gerekiyorsa yılla gösterilir', () => {
    const Utils = loadUtils();
    const far = startOfToday() + 5 * DAY + 2 * 3600000;
    const expectedDate = new Date(far).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    assert.equal(Utils.formatReviewTime(far, NOW), `${expectedDate}, ${expectedTime(far)}`);
    const nextYear = Date.UTC(2027, 0, 5, 10, 30);
    const nextYearDate = new Date(nextYear).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    assert.equal(Utils.formatReviewTime(nextYear, NOW), `${nextYearDate} 2027, ${expectedTime(nextYear)}`);
  });
});

describe('takvim çizimi', () => {
  it('vade, gecikme ve yaklaşan durumlar ayırt edilir', () => {
    const { doc } = loadIndex(seedStore());
    const html = doc.getElementById('schedule-container').innerHTML;
    assert.ok(html.includes('Almanca'));
    assert.ok(html.includes('Tarih'));
    assert.ok(html.includes('bekliyor'));
    assert.ok(html.includes('gecikti'));
    assert.ok(html.includes('En erken:'));
    assert.ok(html.includes('Tüm zamanlar (2)'));
    assert.ok(!html.includes('onclick'));
  });

  it('uzun deste adları güvenli çizilir', () => {
    const store = seedStore();
    const evil = '<img src=x onerror=alert(1)>';
    const decks = JSON.parse(store.getItem('leitner_decks'));
    decks[0].name = evil;
    store.setItem('leitner_decks', JSON.stringify(decks));
    const { doc } = loadIndex(store);
    const html = doc.getElementById('schedule-container').innerHTML;
    assert.ok(!html.includes('<img src=x'));
    assert.ok(html.includes('&lt;img'));
  });

  it('çizim kalıcı veriyi değiştirmez', () => {
    const store = seedStore();
    const beforeDecks = store.getItem('leitner_decks');
    const beforeCards = store.getItem('leitner_cards');
    const { app, doc } = loadIndex(store);
    app.refreshSchedule();
    app.refreshSchedule();
    assert.equal(store.getItem('leitner_decks'), beforeDecks);
    assert.equal(store.getItem('leitner_cards'), beforeCards);
    assert.equal(doc.getElementById('schedule-container').innerHTMLWrites(), 3);
  });

  it('boş depoda bölüm gizlenir', () => {
    const { doc } = loadIndex(createStore());
    assert.ok(doc.getElementById('tekrar-takvimi').classList.contains('hidden'));
    assert.equal(doc.getElementById('schedule-container').innerHTML, '');
  });

  it('kartsız deste açıkça belirtilir', () => {
    const store = createStore();
    store.setItem('leitner_decks', JSON.stringify([{ id: 'd', name: 'Boş', createdAt: NOW - DAY, totalCards: 0 }]));
    store.setItem('leitner_cards', JSON.stringify([]));
    const { doc } = loadIndex(store);
    assert.ok(doc.getElementById('schedule-container').innerHTML.includes('Henüz kart yok.'));
  });

  it('bozuk depo boş takvim gibi gösterilmez', () => {
    const store = createStore();
    store.setItem('leitner_decks', '{bozuk-json');
    const { doc } = loadIndex(store);
    const html = doc.getElementById('schedule-container').innerHTML;
    assert.ok(html.includes('Veriler okunamadı'));
    assert.ok(!doc.getElementById('tekrar-takvimi').classList.contains('hidden'));
    assert.equal(store.getItem('leitner_decks'), '{bozuk-json');
  });

  it('tazeleme tek sefer bağlanır, içerik çoğalmaz', () => {
    const { app, doc } = loadIndex(seedStore());
    app.setupScheduleRefresh();
    const keydownCount = (doc._listeners.visibilitychange || []).length;
    assert.equal(keydownCount, 1);
  });
});

describe('takvim ve çalışma kipleri', () => {
  function scheduleOf(store) {
    const { Storage } = loadStorage({ store, nowMs: NOW });
    return JSON.parse(JSON.stringify(Storage.getReviewSchedule(NOW)));
  }

  it('serbest çalışma takvimi değiştirmez', () => {
    const store = seedStore();
    const before = scheduleOf(store);
    const cards = JSON.parse(store.getItem('leitner_cards')).filter((c) => c.deckId === 'deck-1');
    const t = loadWorkApp({ store, cards, nowMs: NOW, workMode: 'free' });
    for (let i = 0; i < cards.length; i++) {
      t.app.handleCardResponse(i % 2 === 0);
      if (t.timers.length > 0) t.timers[t.timers.length - 1]();
    }
    assert.deepEqual(scheduleOf(store), before);
  });

  it('normal çalışma takvimi mevcut mekanizmayla günceller', () => {
    const store = seedStore();
    const before = scheduleOf(store).find((d) => d.deckId === 'deck-1').dueCount;
    const cards = JSON.parse(store.getItem('leitner_cards')).filter((c) => c.deckId === 'deck-1');
    const t = loadWorkApp({ store, cards, nowMs: NOW });
    t.app.handleCardResponse(true); // c1: kutu 1 -> 2, vadesi yarına kayar
    const after = scheduleOf(store).find((d) => d.deckId === 'deck-1').dueCount;
    assert.ok(after < before);
  });
});

describe('kimlik ve çıkış metni', () => {
  it('favicon dosyası mevcut ve beş sayfa bağlıyor', () => {
    const svg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'favicon.svg'), 'utf8');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('viewBox'));
    for (const page of PAGES) {
      const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
      assert.ok(html.includes('href="assets/favicon.svg"'), `${page} favicon bağlamalı`);
      assert.ok(html.includes('data-app-mark="leitner"'), `${page} kimlik işareti taşımalı`);
      assert.ok(html.includes('alt=""'), 'süs işareti gizlenmeli');
    }
  });

  it('başlık erişilebilir adlandırması korunur', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.ok(html.includes('Learn with Leitner'));
  });

  it('serbest çıkışta doğru uyarı gösterilir', () => {
    const store = seedStore();
    const cards = JSON.parse(store.getItem('leitner_cards')).filter((c) => c.deckId === 'deck-1');
    const t = loadWorkApp({ store, cards, nowMs: NOW, workMode: 'free' });
    t.doc.getElementById('modal-cancel').cloneNode = function () { return this; };
    t.doc.getElementById('modal-confirm').cloneNode = function () { return this; };
    t.doc.getElementById('close-btn').click();
    const message = t.doc.getElementById('modal-message').textContent;
    assert.ok(message.includes('kaydedilmeyecek'));
    assert.ok(message.includes('değişmeyecek'));
  });

  it('normal çıkış metni değişmedi', () => {
    const store = seedStore();
    const cards = JSON.parse(store.getItem('leitner_cards')).filter((c) => c.deckId === 'deck-1');
    const t = loadWorkApp({ store, cards, nowMs: NOW });
    t.doc.getElementById('modal-cancel').cloneNode = function () { return this; };
    t.doc.getElementById('modal-confirm').cloneNode = function () { return this; };
    t.doc.getElementById('close-btn').click();
    const title = t.doc.getElementById('modal-title').textContent;
    const message = t.doc.getElementById('modal-message').textContent;
    assert.equal(title, 'Çalışmayı Sonlandır');
    assert.ok(message.includes('kaydedilmiştir'));
  });
});
