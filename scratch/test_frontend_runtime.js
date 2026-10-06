const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');

// Parse element IDs and basic structure from index.html
const idRegex = /id=["']([^"']+)["']/g;
const htmlIds = new Set();
let m;
while ((m = idRegex.exec(html)) !== null) htmlIds.add(m[1]);

class MockElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.classList = {
      classes: new Set(),
      add: (...c) => c.forEach(x => this.classList.classes.add(x)),
      remove: (...c) => c.forEach(x => this.classList.classes.delete(x)),
      toggle: (x, force) => {
        if (force === undefined) {
          if (this.classList.classes.has(x)) this.classList.classes.delete(x);
          else this.classList.classes.add(x);
        } else if (force) {
          this.classList.classes.add(x);
        } else {
          this.classList.classes.delete(x);
        }
      },
      contains: x => this.classList.classes.has(x)
    };
    this.style = {};
    this.children = [];
    this._innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.listeners = {};
    this.dataset = {};
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = val;
    // extract IDs from innerHTML
    const r = /id=["']([^"']+)["']/g;
    let match;
    while ((match = r.exec(val)) !== null) {
      domRegistry.set(match[1], new MockElement(match[1]));
    }
  }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event, fn) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(f => f !== fn);
  }

  dispatchEvent(event) {
    const list = this.listeners[event.type || event] || [];
    list.forEach(fn => fn(event));
  }

  querySelector(sel) {
    if (sel.startsWith('#')) return domRegistry.get(sel.slice(1)) || null;
    return new MockElement('', sel);
  }

  querySelectorAll(sel) {
    if (sel.startsWith('#')) {
      const el = domRegistry.get(sel.slice(1));
      return el ? [el] : [];
    }
    return [new MockElement('', sel)];
  }

  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k] || null; }
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); }
  remove() {}
  focus() {}
  blur() {}
  scrollIntoView() {}
}

const domRegistry = new Map();
htmlIds.forEach(id => domRegistry.set(id, new MockElement(id)));

const mockDocument = {
  getElementById: id => domRegistry.get(id) || null,
  querySelector: sel => {
    if (sel.startsWith('#')) return domRegistry.get(sel.slice(1)) || null;
    return new MockElement('', sel);
  },
  querySelectorAll: sel => {
    if (sel.startsWith('#')) {
      const el = domRegistry.get(sel.slice(1));
      return el ? [el] : [];
    }
    if (sel === '.app-view') {
      return ['view_dashboard', 'view_builder', 'view_scans', 'view_watchlist', 'view_terminal'].map(id => domRegistry.get(id));
    }
    return [new MockElement('', sel)];
  },
  createElement: tag => new MockElement('', tag),
  body: new MockElement('body', 'body'),
  addEventListener: () => {},
  removeEventListener: () => {}
};

const mockWindow = {
  document: mockDocument,
  navigator: { clipboard: { writeText: async () => {} }, userAgent: 'Node' },
  localStorage: {
    _data: {},
    getItem: k => mockWindow.localStorage._data[k] || null,
    setItem: (k, v) => mockWindow.localStorage._data[k] = String(v),
    removeItem: k => delete mockWindow.localStorage._data[k],
    clear: () => mockWindow.localStorage._data = {}
  },
  scrollTo: () => {},
  addEventListener: (event, fn) => {
    if (event === 'DOMContentLoaded') setTimeout(fn, 10);
  },
  location: { reload: () => {}, href: 'http://localhost:3000' },
  fetch: async (url, opts) => {
    const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
    const r = await fetch(fullUrl, opts);
    return r;
  },
  WebSocket: class {
    constructor() { this.readyState = 1; }
    send() {}
    close() {}
    addEventListener() {}
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  Math: Math,
  JSON: JSON,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Set: Set,
  Map: Map,
  RegExp: RegExp,
  Error: Error,
  encodeURIComponent: encodeURIComponent,
  decodeURIComponent: decodeURIComponent
};

mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

const context = vm.createContext(mockWindow);

console.log('Testing frontend JS execution in simulated browser environment...');

const scripts = [
  'public/js/charts.js',
  'public/js/query-builder.js',
  'public/js/dashboard.js',
  'public/js/app.js'
];

for (const s of scripts) {
  try {
    const code = fs.readFileSync(s, 'utf8');
    vm.runInContext(code, context, { filename: s });
    console.log(`✓ Loaded and executed ${s}`);
  } catch (err) {
    console.error(`✗ CRASH in ${s}:`, err.message);
    console.error(err.stack);
  }
}
