const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, body: b }); }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('--- 5. Testing Kite Watchlists & 18 Sectors Matrix ---');
  
  // 1. Sectors
  const secRes = await get('/api/sectors');
  console.log('Kite 18 Sectors Loaded:', secRes.status === 200, 'Total Sectors:', secRes.body.sectors?.length);
  if (secRes.body.sectors && secRes.body.sectors.length > 0) {
    const s0 = secRes.body.sectors[0];
    console.log(`  Sample Sector: "${s0.name}" (${s0.symbol}) - ${s0.stocks?.length} constituent stocks`);
  }

  // 2. Watchlists Tabs
  const wlRes = await get('/api/watchlists');
  console.log('Watchlists Tabs Loaded:', wlRes.status === 200);
  const tabNames = Object.keys(wlRes.body.tabs || {});
  console.log('  Watchlist Tabs:', tabNames.join(', '));
  for (const t of tabNames) {
    const tabObj = wlRes.body.tabs[t];
    console.log(`    Tab [${t}]: ${tabObj.stocks?.length || 0} stocks`);
  }

  console.log('\n--- 6. Testing Universal Search Engine ---');
  const testQueries = ['RELIANCE', 'TCS', 'HDFC', 'TATA', 'NIFTY', 'SUZ', 'KEC', 'xyz123nonexistent'];
  for (const q of testQueries) {
    const searchRes = await get(`/api/search?q=${encodeURIComponent(q)}`);
    console.log(`  Query "${q}": ${searchRes.body.results?.length} results, Top: ${searchRes.body.results?.[0]?.symbol || 'None'}`);
  }
})();
