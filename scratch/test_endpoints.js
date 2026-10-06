const http = require('http');
const { WebSocket } = require('ws');

const BASE_URL = 'http://localhost:3000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout on ${method} ${path}`));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  const results = [];
  function assert(name, condition, details = '') {
    if (condition) {
      results.push({ name, pass: true });
      console.log(`  ✓ ${name}`);
    } else {
      results.push({ name, pass: false, details });
      console.error(`  ✗ FAIL: ${name} - ${details}`);
    }
  }

  console.log('--- Testing API Endpoints ---');

  // 1. GET /api/info
  try {
    const res = await request('GET', '/api/info');
    assert('GET /api/info returns 200', res.status === 200, `status=${res.status}`);
    assert('/api/info has appName', res.data.appName === 'TejStockAI', JSON.stringify(res.data));
  } catch (e) {
    assert('GET /api/info', false, e.message);
  }

  // 2. GET /api/market-status
  try {
    const res = await request('GET', '/api/market-status');
    assert('GET /api/market-status returns 200', res.status === 200, `status=${res.status}`);
    assert('/api/market-status has statusText', !!res.data.statusText, JSON.stringify(res.data));
  } catch (e) {
    assert('GET /api/market-status', false, e.message);
  }

  // 3. GET /api/stocks
  try {
    const res = await request('GET', '/api/stocks');
    assert('GET /api/stocks returns 200', res.status === 200, `status=${res.status}`);
    assert('/api/stocks has stocks array', Array.isArray(res.data.stocks), `type=${typeof res.data}`);
    assert('/api/stocks has items', res.data.stocks.length > 0, `length=${res.data.stocks?.length}`);
  } catch (e) {
    assert('GET /api/stocks', false, e.message);
  }

  // 4. GET /api/stock/RELIANCE
  try {
    const res = await request('GET', '/api/stock/RELIANCE');
    assert('GET /api/stock/RELIANCE returns 200', res.status === 200, `status=${res.status}`);
    assert('Stock symbol is RELIANCE', res.data?.symbol === 'RELIANCE', JSON.stringify(res.data));
  } catch (e) {
    assert('GET /api/stock/RELIANCE', false, e.message);
  }

  // 5. GET /api/stock/RELIANCE/chart
  try {
    const res = await request('GET', '/api/stock/RELIANCE/chart?tf=1D');
    assert('GET /api/stock/RELIANCE/chart returns 200', res.status === 200, `status=${res.status}`);
    assert('Chart data has candles', Array.isArray(res.data?.candles) && res.data.candles.length > 0, JSON.stringify(Object.keys(res.data || {})));
  } catch (e) {
    assert('GET /api/stock/RELIANCE/chart', false, e.message);
  }

  // 6. GET /api/search?q=KEC
  try {
    const res = await request('GET', '/api/search?q=KEC');
    assert('GET /api/search?q=KEC returns 200', res.status === 200, `status=${res.status}`);
    assert('Search returns results array', Array.isArray(res.data?.results), `type=${typeof res.data}`);
    const firstSym = res.data?.results?.[0]?.symbol;
    assert('Search top result for KEC is KEC', firstSym === 'KEC', `first=${firstSym}`);
  } catch (e) {
    assert('GET /api/search?q=KEC', false, e.message);
  }

  // 7. GET /api/search?q= (empty)
  try {
    const res = await request('GET', '/api/search?q=');
    assert('GET /api/search?q= returns 200 and empty results', res.status === 200 && Array.isArray(res.data?.results) && res.data.results.length === 0, `status=${res.status}`);
  } catch (e) {
    assert('GET /api/search?q=', false, e.message);
  }

  // 8. GET /api/sectors
  try {
    const res = await request('GET', '/api/sectors');
    assert('GET /api/sectors returns 200', res.status === 200, `status=${res.status}`);
    assert('/api/sectors has sectors array', Array.isArray(res.data?.sectors) && res.data.sectors.length > 0, `count=${res.data?.sectors?.length}`);
  } catch (e) {
    assert('GET /api/sectors', false, e.message);
  }

  // 9. GET /api/watchlists
  try {
    const res = await request('GET', '/api/watchlists');
    assert('GET /api/watchlists returns 200', res.status === 200, `status=${res.status}`);
    assert('/api/watchlists has tabs', Array.isArray(res.data?.tabs), `tabs=${typeof res.data?.tabs}`);
  } catch (e) {
    assert('GET /api/watchlists', false, e.message);
  }

  // 10. GET /api/watchlist and POST /api/watchlist/toggle
  try {
    const res1 = await request('GET', '/api/watchlist');
    assert('GET /api/watchlist returns 200', res1.status === 200, `status=${res1.status}`);
    
    const res2 = await request('POST', '/api/watchlist/toggle', { symbol: 'INFY' });
    assert('POST /api/watchlist/toggle returns 200', res2.status === 200, `status=${res2.status}`);
  } catch (e) {
    assert('Watchlist API', false, e.message);
  }

  // 11. Depth & Derivatives
  try {
    const resDepth = await request('GET', '/api/market/depth/RELIANCE');
    assert('GET /api/market/depth/RELIANCE returns 200', resDepth.status === 200, `status=${resDepth.status}`);
    assert('Depth has bids/asks', !!(resDepth.data?.depth?.bids || resDepth.data?.depth?.buyOrders || resDepth.data?.bids), JSON.stringify(Object.keys(resDepth.data || {})));

    const resDeriv = await request('GET', '/api/market/derivatives/RELIANCE');
    assert('GET /api/market/derivatives/RELIANCE returns 200', resDeriv.status === 200, `status=${resDeriv.status}`);
    assert('Derivatives has strikes', Array.isArray(resDeriv.data?.derivatives?.strikes), JSON.stringify(resDeriv.data));
  } catch (e) {
    assert('Depth/Derivatives API', false, e.message);
  }

  // 12. FII/DII Data
  try {
    const resFii = await request('GET', '/api/market/fii-dii');
    assert('GET /api/market/fii-dii returns 200', resFii.status === 200, `status=${resFii.status}`);
    assert('FII/DII has fiiNetCashCr', !!resFii.data?.fiiNetCashCr, JSON.stringify(resFii.data));
  } catch (e) {
    assert('FII/DII API', false, e.message);
  }

  // 13. High Momentum Assets (Fixed!)
  try {
    const resMom = await request('GET', '/api/market/high-momentum-assets');
    assert('GET /api/market/high-momentum-assets returns 200', resMom.status === 200, `status=${resMom.status}`);
    assert('High Momentum Assets returns stocks array', Array.isArray(resMom.data?.stocks), `count=${resMom.data?.total}`);
  } catch (e) {
    assert('High Momentum Assets API', false, e.message);
  }

  // 14. AI Momentum & AI Chat (Both Intraday and Long-Term modes)
  try {
    const resAiMom = await request('GET', '/api/stock/RELIANCE/ai-momentum');
    assert('GET /api/stock/RELIANCE/ai-momentum returns 200', resAiMom.status === 200, `status=${resAiMom.status}`);
    assert('AI Momentum has intraday and longTerm', !!resAiMom.data?.intraday && !!resAiMom.data?.longTerm, JSON.stringify(Object.keys(resAiMom.data || {})));

    // Test AI Momentum on FINNIFTY (previously crashed)
    const resFinMom = await request('GET', '/api/stock/FINNIFTY/ai-momentum');
    assert('GET /api/stock/FINNIFTY/ai-momentum returns 200 (Sectoral index)', resFinMom.status === 200, `status=${resFinMom.status}`);

    const resAiChat = await request('POST', '/api/stock/RELIANCE/ai-chat', { message: 'What is the outlook for RELIANCE?' });
    assert('POST /api/stock/RELIANCE/ai-chat returns 200', resAiChat.status === 200, `status=${resAiChat.status}`);
    assert('AI Chat response has answer', !!resAiChat.data?.answer, JSON.stringify(resAiChat.data));

    const resTermChat = await request('POST', '/api/ai/terminal-chat', { message: 'Give me top breakout stocks' });
    assert('POST /api/ai/terminal-chat returns 200', resTermChat.status === 200, `status=${resTermChat.status}`);
  } catch (e) {
    assert('AI Momentum/Chat API', false, e.message);
  }

  // 15. Scans API & Segments
  try {
    const resScans = await request('GET', '/api/scans');
    assert('GET /api/scans returns 200', resScans.status === 200, `status=${resScans.status}`);

    const resSegments = await request('GET', '/api/scans/segments');
    assert('GET /api/scans/segments returns 200', resSegments.status === 200, `status=${resSegments.status}`);
  } catch (e) {
    assert('Scans API', false, e.message);
  }

  // 16. Run Scans (Test prebuilt scans by scanId lookup!)
  try {
    const resScans = await request('GET', '/api/scans');
    const allScans = [...(resScans.data?.prebuilt || []), ...(resScans.data?.custom || [])];
    
    for (const scan of allScans.slice(0, 5)) {
      const runRes = await request('POST', '/api/scans/run', { scanId: scan.id });
      assert(`Run scan "${scan.title}" (${scan.id}) via scanId lookup`, runRes.status === 200 && Array.isArray(runRes.data?.results), `status=${runRes.status}`);
    }
  } catch (e) {
    assert('Run Scans', false, e.message);
  }

  // 17. Save and Delete custom scan
  try {
    const saveRes = await request('POST', '/api/scans/save', {
      name: 'Test Custom Scan',
      category: 'Custom',
      segment: 'Cash',
      filters: [{ left: 'close', op: 'gt', rightType: 'number', right: 100 }]
    });
    assert('POST /api/scans/save with name works', saveRes.status === 200 && saveRes.data?.success, JSON.stringify(saveRes.data));
    const savedId = saveRes.data?.scan?.id;

    if (savedId) {
      const delRes = await request('DELETE', `/api/scans/${savedId}`);
      assert('DELETE /api/scans/:id works', delRes.status === 200 && delRes.data?.success, JSON.stringify(delRes.data));
    }
  } catch (e) {
    assert('Save/Delete Scan', false, e.message);
  }

  // 18. Dashboards API
  try {
    const resDash = await request('GET', '/api/dashboards');
    assert('GET /api/dashboards returns 200', resDash.status === 200, `status=${resDash.status}`);

    const saveRes = await request('POST', '/api/dashboards/save', resDash.data);
    assert('POST /api/dashboards/save returns 200', saveRes.status === 200, `status=${saveRes.status}`);
  } catch (e) {
    assert('Dashboards API', false, e.message);
  }

  // 19. Alerts API
  try {
    const resAlerts = await request('GET', '/api/alerts/config');
    assert('GET /api/alerts/config returns 200', resAlerts.status === 200, `status=${resAlerts.status}`);

    const postAlerts = await request('POST', '/api/alerts/config', { telegramEnabled: false, webhookEnabled: false });
    assert('POST /api/alerts/config returns 200', postAlerts.status === 200, `status=${postAlerts.status}`);

    const testTg = await request('POST', '/api/alerts/test-telegram', { botToken: '', chatId: '' });
    assert('POST /api/alerts/test-telegram handles missing credentials safely', testTg.status !== 500, `status=${testTg.status}`);

    const testWh = await request('POST', '/api/alerts/test-webhook', { webhookUrl: '' });
    assert('POST /api/alerts/test-webhook handles missing credentials safely', testWh.status !== 500, `status=${testWh.status}`);

    const dispatch = await request('POST', '/api/alerts/dispatch', { scanTitle: 'Test', count: 0, matchedStocks: [] });
    assert('POST /api/alerts/dispatch returns 200', dispatch.status === 200, `status=${dispatch.status}`);
  } catch (e) {
    assert('Alerts API', false, e.message);
  }

  // 20. WebSocket Connection
  try {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let gotMsg = false;
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'PING' }));
      });
      ws.on('message', data => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'CONNECTED' || msg.type === 'PONG') {
          gotMsg = true;
          ws.close();
          resolve();
        }
      });
      ws.on('error', err => reject(err));
      setTimeout(() => {
        if (!gotMsg) {
          ws.close();
          reject(new Error('WebSocket timeout waiting for message'));
        }
      }, 5000);
    });
    assert('WebSocket connection and PING/PONG', true);
  } catch (e) {
    assert('WebSocket connection and PING/PONG', false, e.message);
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} PASSED, ${failed} FAILED out of ${results.length}`);
  console.log(`========================================`);
  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.pass).forEach(f => console.log(`  - ${f.name}: ${f.details}`));
  }
}

runTests();
