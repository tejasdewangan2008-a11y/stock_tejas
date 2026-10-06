const fs = require('fs');

const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const lines = appJs.split('\n');

console.log('--- Checking AI Momentum Modal in app.js ---');
lines.forEach((l, idx) => {
  if (l.includes('aiAgentModal') || l.includes('ai-momentum') || l.includes('openAiModal') || l.includes('openAiMomentum')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
