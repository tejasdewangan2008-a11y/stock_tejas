const { RealMarketService, computeIntradayAiMomentum, computeLongTermAiMomentum } = require('../market-service');

async function test() {
  const ms = new RealMarketService();
  await ms.refreshAllStocks();
  console.log('Stock count in stocksMap:', ms.stocksMap.size);

  const allStocks = ms.getAllStocks();
  for (const stock of allStocks) {
    try {
      computeIntradayAiMomentum(stock);
    } catch (err) {
      console.error(`Error in computeIntradayAiMomentum for ${stock?.symbol}:`, err.message);
      console.error(err.stack);
      return;
    }
    try {
      computeLongTermAiMomentum(stock);
    } catch (err) {
      console.error(`Error in computeLongTermAiMomentum for ${stock?.symbol}:`, err.message);
      console.error(err.stack);
      return;
    }
  }
  console.log('All stocks passed momentum calculation successfully!');
}

test();
