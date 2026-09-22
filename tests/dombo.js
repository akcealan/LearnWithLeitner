// En küçük DOM taklidi: sayfa sınıflarını (app/deckpage/statistics/settings)
// vm içinde tarayıcısız çalıştırmak için. Yalnızca Node yerleşik modülleri.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { fixedDate } = require('./helpers');

function makeClassList() {  const set = new Set();
  return {
    add(...c) { c.forEach((x) => set.add(x)); },
    remove(...c) { c.forEach((x) => set.delete(x)); },
    toggle(c, force) {
      if (force === undefined) {
        if (set.has(c)) set.delete(c);
        else set.add(c);
      } else if (force) set.add(c);
      else set.delete(c);
      return set.has(c);
    },
    contains(c) { return set.has(c); },
  };
}

function makeElement(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    value: '',
    disabled: false,
    dataset: {},
    style: {},
    isContentEditable: false,
    classList: makeClassList(),
    _listeners: {},
    _attrs: {},
    _host: null,
    children: [],
    get firstChild() { return this.children.length > 0 ? this.children[0] : null; },
    addEventListener(t, fn) {
      (this._listeners[t] = this._listeners[t] || []).push(fn);
    },
    removeEventListener() {},
    click() { (this._listeners.click || []).forEach((fn) => fn.call(this)); },
    focus() { this._focused = true; },
    cloneNode() { return makeElement(this.tagName); },
    replaceWith() {},
    setAttribute(n, v) { this._attrs[n] = String(v); },
    getAttribute(n) {
      return Object.prototype.hasOwnProperty.call(this._attrs, n) ? this._attrs[n] : null;
    },
    closest() { return null; },
    contains(other) { return other === this || (!!other && other._host === this); },
    querySelector() { return null; },
    appendChild(c) { this.children.push(c); c.parent = this; return c; },
    insertBefore(c) { this.children.unshift(c); c.parent = this; return c; },
    remove() {},
  };
  let html = '';
  let text = '';
  let writes = 0;
  Object.defineProperty(el, 'innerHTML', {
    get() { return html; },
    set(v) { writes += 1; html = String(v); },
    configurable: true,
  });
  // Gerçek div gibi: textContent yazımı, innerHTML okumasına kaçışlı yansır.
  Object.defineProperty(el, 'textContent', {
    get() { return text; },
    set(v) { text = String(v); html = escapeText(text); },
    configurable: true,
  });
  el.innerHTMLWrites = () => writes;
  return el;
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function makeDocument() {
  const byId = new Map();
  const bySelector = new Map();
  const doc = {
    _listeners: {},
    title: '',
    activeElement: null,
    body: makeElement('body'),
    documentElement: makeElement('html'),
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, makeElement());
      return byId.get(id);
    },
    createElement(tag) { return makeElement(tag); },
    querySelector(sel) {
      if (!bySelector.has(sel)) bySelector.set(sel, makeElement());
      return bySelector.get(sel);
    },
    addEventListener(t, fn) {
      (this._listeners[t] = this._listeners[t] || []).push(fn);
    },
    _ids: byId,
    _selectors: bySelector,
  };
  return doc;
}

function makeSessionStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    _map: m,
  };
}

function srcOf(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

/**
 * Bir sayfa betiğini paylaşılan sahte ortamda çalıştırır.
 * Gerçek Storage/Utils kaynakları yüklenir; storageStub/utilsStub ile ezilebilir.
 * Betiğin sonundaki örnek (app, deckPage, ...) globalThis.__page olarak alınır.
 */
function runPageScript(relPath, {
  store,
  doc,
  win,
  session,
  timers,
  toasts,
  storageStub = null,
  utilsStub = null,
  nowMs,
  captureName,
  sandboxExtra = null,
} = {}) {
  const timerList = timers || [];
  const sandbox = {
    localStorage: store,
    sessionStorage: session || makeSessionStorage(),
    document: doc || makeDocument(),
    window: win || { location: { pathname: '/index.html', search: '', href: '' } },
    console,
    Math,
    JSON,
    URLSearchParams,
    setTimeout: (fn) => { timerList.push(fn); return timerList.length; },
    clearTimeout: () => {},
  };
  if (sandboxExtra) Object.assign(sandbox, sandboxExtra);
  if (nowMs !== undefined) sandbox.Date = fixedDate(nowMs);
  vm.createContext(sandbox);
  if (storageStub) {
    sandbox.Storage = storageStub;
  } else {
    vm.runInContext(srcOf('js/storage.js'), sandbox, { filename: 'storage.js' });
  }
  if (utilsStub) {
    sandbox.Utils = utilsStub;
  } else {
    vm.runInContext(srcOf('js/utils.js'), sandbox, { filename: 'utils.js' });
  }
  vm.runInContext(`${srcOf(relPath)}\n;globalThis.__page = ${captureName};`, sandbox, { filename: relPath });
  return { sandbox, page: sandbox.__page, toasts, timers: timerList };
}

/** toast yakalayan Utils taklidi (deterministik karıştırma ile). */
function stubUtils(toasts) {
  return {
    showToast: (message, type = 'info') => toasts.push({ message, type }),
    shuffleArray: (a) => [...a],
    validateInput: (v) => v,
    formatDate: () => '',
    showStorageError: (container) => {
      const el = typeof container === 'string' ? null : container;
      if (!el) return false;
      el.innerHTML = 'Veriler okunamadı (taklit)';
      return true;
    },
  };
}

/**
 * app.js'i çalışma sayfası kipinde yükler. Varsayılan: gerçek Storage + Utils.
 * workMode verilirse oturuma yazılır; verilmezse kip anahtarı yazılmaz
 * (eski oturumlarla aynı: uygulama normal kip sayar).
 */
function loadWorkApp({ store, cards, deckId = 'deck-1', storage = null, nowMs, workMode, sandboxExtra = null } = {}) {
  const sessionSeed = {
    workCards: JSON.stringify(cards),
    workDeckId: deckId,
  };
  if (workMode !== undefined) sessionSeed.workMode = workMode;
  const session = makeSessionStorage(sessionSeed);
  const doc = makeDocument();
  const win = { location: { pathname: '/workpage.html', search: '', href: '' } };
  const timers = [];
  const toasts = [];
  const utils = stubUtils(toasts);
  const { page } = runPageScript('js/app.js', {
    store, doc, win, session, timers, toasts,
    storageStub: storage, utilsStub: utils, nowMs, captureName: 'app',
    sandboxExtra,
  });
  doc.getElementById('confirmation-modal').classList.add('hidden');
  return { app: page, doc, win, session, timers, toasts, utils };
}

module.exports = {
  makeElement, makeDocument, makeSessionStorage,
  runPageScript, stubUtils, loadWorkApp, srcOf,
};
