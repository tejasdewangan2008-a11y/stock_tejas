const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

// Parse all IDs from html
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
    this.checked = false;
    this.disabled = false;
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = val;
    const r = /id=["']([^"']+)["']/g;
    let match;
    while ((match = r.exec(val)) !== null) {
      if (!domRegistry.has(match[1])) {
        domRegistry.set(match[1], new MockElement(match[1]));
      }
    }
  }

  getContext() {
    return {
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      rect: () => {},
      fillText: () => {},
      measureText: () => ({ width: 10 }),
      save: () => {},
      restore: () => {},
      setLineDash: () => {},
      strokeRect: () => {},
      fillRect: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} })
    };
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
  closest() { return this; }
  contains() { return true; }
  remove() {}
  focus() {}
  blur() {}
  scrollIntoView() {}
}

const domRegistry = new Map();
htmlIds.forEach(id => domRegistry.set(id, new MockElement(id)));

const mockDocument = {
  readyState: 'complete',
  getElementById: id => {
    if (!domRegistry.has(id)) {
      domRegistry.set(id, new MockElement(id));
    }
    return domRegistry.get(id);
  },
  querySelector: sel => {
    if (sel.startsWith('#')) return mockDocument.getElementById(sel.slice(1));
    return new MockElement('', sel);
  },
  querySelectorAll: sel => {
    if (sel.startsWith('#')) {
      const el = mockDocument.getElementById(sel.slice(1));
      return el ? [el] : [];
    }
    return [new MockElement('', sel)];
  },
  createElement: tag => new MockElement('', tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: new MockElement('body', 'body')
};

const storageMap = new Map();
const mockStorage = {
  getItem: k => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: k => storageMap.delete(k),
  clear: () => storageMap.clear()
};

const context = {
  console: console,
  document: mockDocument,
  window: {},
  localStorage: mockStorage,
  sessionStorage: mockStorage,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  fetch: (url, opts) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, results: [], stocks: [], tabs: {} }),
      text: () => Promise.resolve('')
    });
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollTo: () => {},
  WebSocket: class {
    constructor() {}
    send() {}
    close() {}
  },
  navigator: {
    serviceWorker: {
      register: () => Promise.resolve({ update: () => {} })
    }
  },
  location: { pathname: '/' }
};
context.window = context;

vm.createContext(context);

console.log('--- Loading scripts into mock browser runtime ---');
try {
  const chartsCode = fs.readFileSync(path.join(__dirname, '../public/js/charts.js'), 'utf8');
  vm.runInContext(chartsCode, context);
  console.log('✓ charts.js loaded successfully');

  const qbCode = fs.readFileSync(path.join(__dirname, '../public/js/query-builder.js'), 'utf8');
  vm.runInContext(qbCode, context);
  console.log('✓ query-builder.js loaded successfully');

  const dashCode = fs.readFileSync(path.join(__dirname, '../public/js/dashboard.js'), 'utf8');
  vm.runInContext(dashCode, context);
  console.log('✓ dashboard.js loaded successfully');

  const appCode = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
  vm.runInContext(appCode, context);
  console.log('✓ app.js loaded successfully');

  console.log('--- Testing App instance and user actions ---');
  const app = context.window.app;
  if (!app) {
    throw new Error('window.app was not initialized!');
  }
  console.log('✓ window.app initialized successfully');

  // Test guest login
  console.log('Testing loginAsGuest...');
  app.loginAsGuest();
  console.log('✓ loginAsGuest successful');

  // Test view switching
  const views = ['dashboard', 'builder', 'scans', 'watchlist', 'terminal', 'sectors'];
  for (const v of views) {
    console.log(`Testing switchView('${v}')...`);
    app.switchView(v);
    console.log(`✓ switchView('${v}') successful`);
  }

  // Test search input event
  console.log('Testing search input event...');
  const searchInput = mockDocument.getElementById('globalStockSearch');
  searchInput.value = 'TCS';
  searchInput.dispatchEvent({ type: 'input' });
  console.log('✓ search input event dispatched');

  // Test quick demo credentials
  console.log('Testing fillDemoCredentials...');
  app.fillDemoCredentials();
  console.log('✓ fillDemoCredentials successful');

  // Test admin form switch
  console.log('Testing switchLoginTab admin...');
  app.switchLoginTab('admin');
  console.log('✓ switchLoginTab admin successful');

  console.log('\n========================================');
  console.log('ALL CLIENT-SIDE CODE EXECUTED WITH 0 ERRORS!');
  console.log('========================================');

} catch (err) {
  console.error('CRASH DETECTED:', err);
  process.exit(1);
}
