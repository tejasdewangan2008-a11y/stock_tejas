const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

const views = ['dashboard', 'builder', 'scans', 'watchlist', 'terminal'];

views.forEach(v => {
  const id = `view_${v}`;
  const exists = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  console.log(`View container #${id} exists?`, exists);
});
