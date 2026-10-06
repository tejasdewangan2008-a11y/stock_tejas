const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(b) });
        } catch (e) {
          resolve({ status: res.statusCode, body: b });
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('--- 3. Testing TradingView Charts & Timeframes ---');
  const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'SUZLON', 'NIFTY 50'];
  const timeframes = ['1m', '5m', '15m', '1h', '1D', '1W', '1M'];

  for (const sym of symbols) {
    const res = await get(`/api/stock/${encodeURIComponent(sym)}/chart?tf=1D`);
    if (res.status === 200 && res.body.candles && res.body.candles.length > 0) {
      console.log(`  ✓ Chart [${sym}] 1D: ${res.body.candles.length} candles, LTP: ₹${res.body.ltp}`);
    } else {
      console.error(`  ✗ Chart [${sym}] failed: status=${res.status}`);
    }
  }

  // Test multiple timeframes for RELIANCE
  console.log('Testing all timeframes for RELIANCE:');
  for (const tf of timeframes) {
    const res = await get(`/api/stock/RELIANCE/chart?tf=${tf}`);
    const candleCount = res.body?.candles?.length || 0;
    const hasIndicators = !!res.body?.indicators;
    console.log(`  ✓ Timeframe ${tf}: ${candleCount} candles, Indicators: ${hasIndicators ? 'OK' : 'MISSING'}`);
  }
})();
