const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');
let ticksReceived = 0;

ws.on('open', () => {
  console.log('Connected to WebSocket!');
});

ws.on('message', data => {
  try {
    const msg = JSON.parse(data);
    console.log('Received message type:', msg.type);
    if (msg.type === 'CONNECTED') {
      console.log('Connected info:', {
        marketStatus: msg.marketStatus?.statusText,
        initialTicksCount: msg.initialTicks?.length
      });
      if (msg.initialTicks && msg.initialTicks.length > 0) {
        console.log('Initial tick sample:', msg.initialTicks[0]);
      }
    } else if (msg.type === 'PRICE_TICK') {
      ticksReceived++;
      console.log(`Tick #${ticksReceived}: Received ${msg.ticks.length} ticks:`);
      msg.ticks.slice(0, 3).forEach(t => {
        console.log(`  -> ${t.symbol}: ₹${t.ltp} (${t.direction}) [${t.changePct}%] Vol: ${t.volume}`);
      });
      if (ticksReceived >= 2) {
        console.log('SUCCESS: Live streaming ticks verified!');
        ws.close();
        process.exit(0);
      }
    }
  } catch (err) {
    console.error('Error parsing:', err);
  }
});

ws.on('error', err => {
  console.error('WS Error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout waiting for ticks');
  ws.close();
  process.exit(1);
}, 12000);
