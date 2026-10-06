const fs = require('fs');

const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const lines = appJs.split('\n');

console.log('--- Checking WebSocket and price updates in app.js ---');
lines.forEach((l, idx) => {
  if (l.includes('MARKET_DATA_UPDATE') || l.includes('MARKET_REFRESHED') || l.includes('onmessage') || l.includes('WebSocket')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
