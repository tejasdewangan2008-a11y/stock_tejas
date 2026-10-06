const fs = require('fs');

const content = fs.readFileSync('public/js/app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('data-view') || l.includes('switchView') || l.includes('currentView') || l.includes('activeView')) {
    console.log(`${i + 1}: ${l}`);
  }
});
