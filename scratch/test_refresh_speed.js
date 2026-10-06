const { RealMarketService } = require('../market-service');

async function test() {
  console.log('Testing RealMarketService initialization and refresh...');
  const start = Date.now();
  const ms = new RealMarketService();
  console.log('RealMarketService constructed. Directory size:', ms.directory.length);
  try {
    const count = await ms.refreshAllStocks();
    console.log(`refreshAllStocks took ${((Date.now() - start)/1000).toFixed(1)}s, symbols count:`, count);
  } catch (e) {
    console.error('Error during refreshAllStocks:', e);
  }
}

test();
