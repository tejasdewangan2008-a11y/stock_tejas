const http = require('http');
const { computeIntradayAiMomentum, computeLongTermAiMomentum } = require('../market-service');

http.get('http://127.0.0.1:3000/api/stocks', (res) => {
  let buf = '';
  res.on('data', d => buf += d);
  res.on('end', () => {
    const data = JSON.parse(buf);
    console.log('Received stocks from live server:', data.stocks.length);
    for (const stock of data.stocks) {
      try {
        computeIntradayAiMomentum(stock);
      } catch (e) {
        console.error(`FAILED computeIntradayAiMomentum for ${stock.symbol}:`, e.message, e.stack);
        return;
      }
      try {
        computeLongTermAiMomentum(stock);
      } catch (e) {
        console.error(`FAILED computeLongTermAiMomentum for ${stock.symbol}:`, e.message, e.stack);
        return;
      }
    }
    console.log('Finished testing all live stocks.');
  });
});
