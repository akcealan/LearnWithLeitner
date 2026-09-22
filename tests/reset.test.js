// clearAll kısmi silme koruması + sıfırlama bildirimleri testleri.
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, loadStorage } = require('./helpers');
const { makeDocument, makeSessionStorage, runPageScript } = require('./dombo');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 7, 22, 12, 0, 0);

function seedStore() {
  const store = createStore();
  store.setItem('leitner_decks', JSON.stringify([{ id: 'd1', name: 'Deste', createdAt: NOW - DAY, totalCards: 0 }]));
  store.setItem('leitner_cards', JSON.stringify([]));
  return store;
}

function quotaError() {
  const e = new Error('QuotaExceededError: kota doldu');
  e.name = 'QuotaExceededError';
  return e;
}

describe('clearAll', () => {
  it('başarıda iki anahtarı da siler', () => {
    const store = seedStore();
    const { Storage } = loadStorage({ store, nowMs: NOW });
    const result = Storage.clearAll();
    assert.deepEqual(Object.assign({}, result), { ok: true, code: 'ok' });
    assert.equal(store.getItem('leitner_decks'), null);
    assert.equal(store.getItem('leitner_cards'), null);
  });

  it('ikinci silme başarısız olursa ilki geri alınır, başarı bildirilmez', () => {
    const seed = seedStore().snapshot();
    const store = createStore(
      { leitner_decks: seed.decks, leitner_cards: seed.cards },
      { removeErrors: [null, quotaError()] } // deste sil ok, kart sil hata
    );
    const { Storage } = loadStorage({ store, nowMs: NOW });
    const result = Storage.clearAll();
    assert.equal(result.ok, false);
    assert.equal(result.code, 'storage-error');
    assert.deepEqual(store.snapshot(), seed);
  });

  it('ilk silme başarısız olursa veri aynen kalır', () => {
    const seed = seedStore().snapshot();
    const store = createStore(
      { leitner_decks: seed.decks, leitner_cards: seed.cards },
      { removeErrors: [quotaError()] }
    );
    const { Storage } = loadStorage({ store, nowMs: NOW });
    const result = Storage.clearAll();
    assert.equal(result.ok, false);
    assert.deepEqual(store.snapshot(), seed);
  });

  it('geri alma da başarısız olursa ayrıca raporlanır', () => {
    const seed = seedStore().snapshot();
    const store = createStore(
      { leitner_decks: seed.decks, leitner_cards: seed.cards },
      { removeErrors: [null, quotaError()], setErrors: [quotaError()] }
    );
    const { Storage } = loadStorage({ store, nowMs: NOW });
    const result = Storage.clearAll();
    assert.equal(result.ok, false);
    assert.equal(result.code, 'rollback-failed');
  });
});

describe('sıfırlama bildirimleri (settings)', () => {
  function loadSettings(clearAllImpl) {
    const toasts = [];
    const doc = makeDocument();
    const win = { location: { pathname: '/settings.html', search: '', href: '' } };
    const timers = [];
    const { page } = runPageScript('js/settings.js', {
      store: createStore(),
      doc,
      win,
      session: makeSessionStorage(),
      timers,
      toasts,
      storageStub: { clearAll: clearAllImpl },
      utilsStub: {
        showToast: (message, type = 'info') => toasts.push({ message, type }),
        downloadJSON: () => {},
        readJSONFile: () => Promise.reject(new Error('yok')),
      },
      nowMs: NOW,
      captureName: 'settingsPage',
    });
    return { page, toasts, timers };
  }

  it('başarıda başarı bildirimi gösterir', () => {
    const { page, toasts } = loadSettings(() => ({ ok: true, code: 'ok' }));
    page.resetAllData();
    assert.equal(toasts[toasts.length - 1].type, 'success');
  });

  it('sıradan silme hatasında başarı bildirmez, veri korundu der', () => {
    const { page, toasts } = loadSettings(() => ({ ok: false, code: 'storage-error' }));
    page.resetAllData();
    const last = toasts[toasts.length - 1];
    assert.equal(last.type, 'error');
    assert.ok(last.message.includes('korundu'));
  });

  it('geri alma hatasını ayrıca bildirir', () => {
    const { page, toasts } = loadSettings(() => ({ ok: false, code: 'rollback-failed' }));
    page.resetAllData();
    const last = toasts[toasts.length - 1];
    assert.equal(last.type, 'error');
    assert.ok(last.message.includes('geri yüklenemedi'));
  });
});
