const fs = require('fs');

const files = [
  'public/js/app.js',
  'public/js/dashboard.js',
  'public/js/query-builder.js'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('/api/scans/run')) {
      console.log(`[CALL] ${file}:${idx + 1}`);
      console.log(lines.slice(Math.max(0, idx - 5), idx + 20).join('\n'));
    }
  });
}
