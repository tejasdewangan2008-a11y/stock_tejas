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

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch (e) { resolve({ status: res.statusCode, body: b }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('--- 4. Testing Broker AI Copilot & Market Depth ---');
  
  // 1. High Momentum Assets
  const highM = await get('/api/market/high-momentum-assets');
  console.log('High-Momentum Assets (>80 Score):', highM.status === 200, 'Count:', highM.body.total);
  if (highM.body.stocks && highM.body.stocks.length > 0) {
    console.log(`  Top High-Momentum Stock: ${highM.body.stocks[0].symbol} (Max Score: ${highM.body.stocks[0].maxScore}/100)`);
  }

  // 2. Dual-Engine AI Momentum Analysis
  const aiStock = await get('/api/stock/RELIANCE/ai-momentum');
  console.log('RELIANCE AI Momentum:', aiStock.status === 200);
  console.log(`  Intraday Engine: Score=${aiStock.body.intraday?.score}, Verdict="${aiStock.body.intraday?.verdict}"`);
  console.log(`  Long-Term Engine: Score=${aiStock.body.longTerm?.score}, Verdict="${aiStock.body.longTerm?.verdict}"`);

  // 3. Broker Level 2 Depth
  const depth = await get('/api/market/depth/RELIANCE');
  console.log('RELIANCE Broker Level 2 Depth:', depth.status === 200);
  console.log(`  Bids Count: ${depth.body.depth?.bids?.length}, Asks Count: ${depth.body.depth?.asks?.length}, Total Buy Qty: ${depth.body.depth?.totalBuyQty}`);

  // 4. Broker Option Chain & Derivatives Matrix
  const deriv = await get('/api/market/derivatives/RELIANCE');
  console.log('RELIANCE Derivatives Matrix:', deriv.status === 200);
  console.log(`  PCR: ${deriv.body.derivatives?.pcr}, Max Pain: ₹${deriv.body.derivatives?.maxPain}, Sentiment: ${deriv.body.derivatives?.sentiment}`);

  // 5. FII & DII Inflow/Outflow Analytics
  const fiiDii = await get('/api/market/fii-dii');
  console.log('FII & DII Inflow Data:', fiiDii.status === 200, `FII Net: ₹${fiiDii.body.fiiNetCashCr} Cr, DII Net: ₹${fiiDii.body.diiNetCashCr} Cr`);

  // 6. Stock AI Copilot Chat
  const chatRes = await post('/api/stock/RELIANCE/ai-chat', { message: 'What is the trade recommendation and key levels for today?' });
  console.log('Stock AI Copilot Chat:', chatRes.status === 200 && !!chatRes.body.reply ? 'PASS' : 'FAIL');
  console.log(`  AI Snippet: "${chatRes.body.reply?.substring(0, 100)}..."`);

  // 7. Universal Terminal Copilot Chat
  const termChat = await post('/api/ai/terminal-chat', { message: 'Give me top momentum breakout stocks' });
  console.log('Universal Terminal AI Chat:', termChat.status === 200 && !!termChat.body.reply ? 'PASS' : 'FAIL');
  console.log(`  Terminal AI Snippet: "${termChat.body.reply?.substring(0, 100)}..."`);
})();
