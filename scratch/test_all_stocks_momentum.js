const {
  computeAiMomentumAnalysis,
  computeIntradayAiMomentum,
  computeLongTermAiMomentum,
  computeBrokerMarketDepth,
  computeBrokerDerivatives
} = require('../market-service');

async function testAll() {
  const resp = await fetch('http://localhost:3000/api/stocks');
  const data = await resp.json();
  const stocks = data.stocks;
  console.log(`Testing all 5 momentum & depth functions for ${stocks.length} stocks...`);

  let errorCount = 0;
  for (const stock of stocks) {
    try {
      computeAiMomentumAnalysis(stock);
    } catch (e) {
      console.error(`[computeAiMomentumAnalysis ERROR] ${stock.symbol}:`, e.message);
      errorCount++;
    }

    try {
      computeIntradayAiMomentum(stock);
    } catch (e) {
      console.error(`[computeIntradayAiMomentum ERROR] ${stock.symbol}:`, e.message);
      errorCount++;
    }

    try {
      computeLongTermAiMomentum(stock);
    } catch (e) {
      console.error(`[computeLongTermAiMomentum ERROR] ${stock.symbol}:`, e.message);
      errorCount++;
    }

    try {
      computeBrokerMarketDepth(stock);
    } catch (e) {
      console.error(`[computeBrokerMarketDepth ERROR] ${stock.symbol}:`, e.message);
      errorCount++;
    }

    try {
      computeBrokerDerivatives(stock);
    } catch (e) {
      console.error(`[computeBrokerDerivatives ERROR] ${stock.symbol}:`, e.message);
      errorCount++;
    }
  }

  console.log(`\nFinished testing. Total errors encountered: ${errorCount}`);
}

testAll();
