const fs = require('fs');

const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const lines = appJs.split('\n');

console.log('--- Broker references in app.js ---');
lines.forEach((l, idx) => {
  if (l.toLowerCase().includes('zerodha') || l.toLowerCase().includes('kite') || l.toLowerCase().includes('angel') || l.toLowerCase().includes('upstox') || l.toLowerCase().includes('dhan')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
