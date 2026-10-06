const http = require('http');

function req(method, path, body = null) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: buf });
        }
      });
    });
    r.on('error', err => resolve({ status: 0, error: err.message }));
    if (data) r.write(data);
    r.end();
  });
}

async function testAll() {
  console.log('Testing Alert endpoints...');
  let res = await req('POST', '/api/alerts/config', { telegramBotToken: '123', telegramChatId: '456', webhookUrl: 'https://example.com' });
  console.log('POST /api/alerts/config:', res.status, res.data || res.raw);

  res = await req('POST', '/api/alerts/test-telegram', { botToken: '', chatId: '' });
  console.log('POST /api/alerts/test-telegram (empty):', res.status, res.data || res.raw);

  res = await req('POST', '/api/alerts/test-webhook', { webhookUrl: '' });
  console.log('POST /api/alerts/test-webhook (empty):', res.status, res.data || res.raw);

  res = await req('POST', '/api/alerts/dispatch', { scanName: 'Test', count: 5, stocks: ['RELIANCE', 'TCS'] });
  console.log('POST /api/alerts/dispatch:', res.status, res.data || res.raw);

  console.log('\nTesting Custom Scan CRUD...');
  res = await req('POST', '/api/scans/save', {
    name: 'My Custom Breakout',
    description: 'Custom test scan',
    segment: 'cash',
    rules: [
      { field: 'close', op: '>', value: '200' },
      { field: 'rsi14', op: '<', value: '40' }
    ]
  });
  console.log('POST /api/scans/save:', res.status, res.data || res.raw);
  const scanId = res.data?.scan?.id;

  if (scanId) {
    res = await req('POST', '/api/scans/run', { scanId });
    console.log(`POST /api/scans/run (${scanId}):`, res.status, 'Total matching:', res.data?.total);

    res = await req('DELETE', `/api/scans/${scanId}`);
    console.log(`DELETE /api/scans/${scanId}:`, res.status, res.data || res.raw);
  }

  console.log('\nTesting Dashboard Save...');
  res = await req('POST', '/api/dashboards/save', {
    activeDashboardId: 'default',
    dashboards: [
      { id: 'default', name: 'Main', pinnedScanIds: ['bullish-breakout'], autoRefreshSec: 10 }
    ]
  });
  console.log('POST /api/dashboards/save:', res.status, res.data || res.raw);

  console.log('\nTesting Charts for multiple symbols & timeframes...');
  for (const tf of ['1m', '5m', '15m', '1h', '1d', '1wk', '1mo']) {
    res = await req('GET', `/api/stock/INFY/chart?timeframe=${tf}`);
    console.log(`GET /api/stock/INFY/chart?timeframe=${tf}:`, res.status, 'Candles count:', res.data?.candles?.length);
  }
}

testAll();
