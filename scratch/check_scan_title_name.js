const fs = require('fs');

const files = [
  'server.js',
  'scans.js',
  'public/js/app.js',
  'public/js/dashboard.js',
  'public/js/query-builder.js'
];

console.log('--- Checking scan.name vs scan.title ---');
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('.name') && (l.includes('scan') || l.includes('Scan'))) {
      console.log(`[NAME] ${file}:${idx + 1}: ${l.trim()}`);
    }
    if (l.includes('.title') && (l.includes('scan') || l.includes('Scan'))) {
      console.log(`[TITLE] ${file}:${idx + 1}: ${l.trim()}`);
    }
  });
}
