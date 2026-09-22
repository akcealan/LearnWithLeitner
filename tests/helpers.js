// Test yardımcısı: storage.js'i tarayıcı dışı ortamda (vm + sahte localStorage) yükler.
// Üretim koduna bağımlılık eklemez; yalnızca Node yerleşik modüllerini kullanır.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const STORAGE_PATH = path.join(__dirname, '..', 'js', 'storage.js');

/** Bellek-içi localStorage taklidi. faults ile yazma/okuma hataları enjekte edilebilir. */
function createStore(seed = {}, faults = {}) {
  const data = new Map();
  for (const [k, v] of Object.entries(seed)) data.set(k, String(v));
  return {
    _data: data,
    getItem(k) {
      if (faults.getError) throw faults.getError;
      return data.has(k) ? data.get(k) : null;
    },
    setItem(k, v) {
      if (faults.setErrors && faults.setErrors.length > 0) {
        const err = faults.setErrors.shift();
        if (err) throw err;
      }
      data.set(k, String(v));
    },
    removeItem(k) {
      if (faults.removeErrors && faults.removeErrors.length > 0) {
        const err = faults.removeErrors.shift();
        if (err) throw err;
      }
      data.delete(k);
    },
    clear() {
      data.clear();
    },
    snapshot() {
      return { decks: data.has('leitner_decks') ? data.get('leitner_decks') : null,
               cards: data.has('leitner_cards') ? data.get('leitner_cards') : null };
    }
  };
}

/** Sabit saatli Date: new Date() ve Date.now() her zaman nowMs döndürür. */
function fixedDate(nowMs) {
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(nowMs);
      else super(...args);
    }
    static now() { return nowMs; }
  }
  return FakeDate;
}

/**
 * storage.js kaynağını verilen sahte ortamda çalıştırıp
 * { Storage, STORAGE_KEYS, BOX_SCHEDULE } döndürür.
 */
function loadStorage({ store, nowMs, sourcePath = STORAGE_PATH } = {}) {
  const src = fs.readFileSync(sourcePath, 'utf8');
  const sandbox = {
    localStorage: store,
    Date: nowMs === undefined ? Date : fixedDate(nowMs),
    console,
    Math,
    JSON,
  };
  vm.createContext(sandbox);
  const factory = vm.runInContext(
    `${src}\n;({ Storage, STORAGE_KEYS, BOX_SCHEDULE });`,
    sandbox,
    { filename: 'storage.js' }
  );
  return factory;
}

module.exports = { createStore, fixedDate, loadStorage, STORAGE_PATH };
