const fs = require('fs');

const code = fs.readFileSync('market-service.js', 'utf8');
const lines = code.split('\n');

const toFixedCalls = [];
lines.forEach((l, idx) => {
  const match = /([a-zA-Z0-9_$.()\[\]+\-*/\s]+)\.toFixed\((\d+)\)/g;
  let m;
  while ((m = match.exec(l)) !== null) {
    toFixedCalls.push({ line: idx + 1, expr: m[1].trim(), digits: m[2], full: l.trim() });
  }
});

console.log(`Found ${toFixedCalls.length} .toFixed calls in market-service.js:`);
toFixedCalls.forEach(c => {
  console.log(`L${c.line}: (${c.expr}).toFixed(${c.digits})`);
});
