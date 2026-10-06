const { computeIntradayAiMomentum, computeLongTermAiMomentum } = require('../market-service');

async function check() {
  const res = await fetch('http://localhost:3000/api/stocks');
  const data = await res.json();
  const stocks = data.stocks;
  console.log(`Checking ${stocks.length} stocks from live server...`);

  for (const stock of stocks) {
    try {
      computeIntradayAiMomentum(stock);
    } catch (e) {
      console.error(`FAILED computeIntradayAiMomentum for ${stock.symbol}:`, e.message, '\n', e.stack);
      console.error('Stock object:', JSON.stringify(stock, null, 2));
      return;
    }
    try {
      computeLongTermAiMomentum(stock);
    } catch (e) {
      console.error(`FAILED computeLongTermAiMomentum for ${stock.symbol}:`, e.message, '\n', e.stack);
      console.error('Stock object:', JSON.stringify(stock, null, 2));
      return;
    }
  }
  console.log('All stocks passed!');
}

check();
