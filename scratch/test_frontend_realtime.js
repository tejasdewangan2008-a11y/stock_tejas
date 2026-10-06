const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function testFrontendRealTime() {
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  const dom = new JSDOM(indexHtml, {
    url: 'http://localhost:3000',
    runScripts: 'dangerously',
    resources: 'usable'
  });

  const { window } = dom;
  global.window = window;
  global.document = window.document;

  console.log('Testing App class and ticker tape rendering in DOM...');
  
  // Load app.js in context
  const appJs = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
  
  // Mock TechnicalChart
  window.TechnicalChart = class {
    constructor() {}
    render() {}
    setChartType() {}
    toggleIndicator() {}
  };

  // Mock WebSocket
  class MockWebSocket {
    constructor(url) {
      this.url = url;
      setTimeout(() => {
        if (this.onopen) this.onopen();
      }, 50);
    }
    send() {}
    close() {}
  }
  window.WebSocket = MockWebSocket;

  window.eval(appJs);
  console.log('app.js loaded. Instantiating App...');

  const app = new window.App();
  
  // Set sample cached data
  app.cachedAllStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 1182.00, changePct: -1.30 },
    { symbol: 'TCS', name: 'Tata Consultancy', ltp: 2032.40, changePct: -1.85 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 722.70, changePct: 0.51 }
  ];

  // Test renderMarketTickerTape
  app.renderMarketTickerTape();
  const tickerItems = window.document.querySelectorAll('#marketTickerItems .ticker-item');
  console.log(`Rendered ticker items: ${tickerItems.length}`);
  if (tickerItems.length === 0) {
    throw new Error('Ticker tape failed to render!');
  }

  // Test renderKiteTabStocks
  app.cachedWatchlists = {
    'BIG B': {
      stocks: [
        { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 1182.00, changePct: -1.30 },
        { symbol: 'TCS', name: 'Tata Consultancy', ltp: 2032.40, changePct: -1.85 }
      ]
    }
  };
  app.renderKiteTabStocks('BIG B');
  const renderedStocks = window.document.querySelectorAll('.kite-stock-item[data-symbol]');
  console.log(`Rendered Kite tab stocks with data-symbol: ${renderedStocks.length}`);
  if (renderedStocks.length === 0) {
    throw new Error('renderKiteTabStocks missing data-symbol!');
  }

  // Test applyLiveTicks
  const initialRelianceLtp = window.document.querySelector('[data-stock-ltp="RELIANCE"]')?.textContent;
  console.log(`Before tick, RELIANCE price in DOM: ${initialRelianceLtp}`);

  app.applyLiveTicks([
    {
      symbol: 'RELIANCE',
      ltp: 1189.50,
      change: 7.50,
      changePct: 0.63,
      direction: 'UP'
    }
  ]);

  const updatedRelianceLtp = window.document.querySelector('[data-stock-ltp="RELIANCE"]')?.textContent;
  const relianceElem = window.document.querySelector('[data-stock-ltp="RELIANCE"]');
  console.log(`After UP tick, RELIANCE price in DOM: ${updatedRelianceLtp}`);
  console.log(`Flash class applied: ${relianceElem.classList.contains('flash-green')}`);

  const tickerPrice = window.document.querySelector('[data-ticker-price="RELIANCE"]')?.textContent;
  console.log(`Ticker tape updated price: ${tickerPrice}`);

  if (updatedRelianceLtp !== '₹1,189.50') {
    throw new Error(`Expected ₹1,189.50 but got ${updatedRelianceLtp}`);
  }
  if (!relianceElem.classList.contains('flash-green')) {
    throw new Error('flash-green class was not added!');
  }

  console.log('✅ ALL FRONTEND REAL-TIME STREAMING TESTS PASSED!');
  process.exit(0);
}

testFrontendRealTime().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
