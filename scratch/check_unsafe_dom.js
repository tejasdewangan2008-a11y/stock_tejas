const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const idRegex = /id=["']([^"']+)["']/g;
const htmlIds = new Set();
let match;
while ((match = idRegex.exec(html)) !== null) {
  htmlIds.add(match[1]);
}

const jsFiles = [
  'public/js/charts.js',
  'public/js/query-builder.js',
  'public/js/dashboard.js',
  'public/js/app.js'
];

console.log('--- Checking for Unchecked getElementById / querySelector calls ---');

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check pattern: document.getElementById('xyz').something (without ?. or if check)
    // Matches: document.getElementById('xyz').addEventListener
    // Matches: document.getElementById('xyz').value
    // Matches: document.getElementById('xyz').innerHTML
    const directRegex = /document\.getElementById\(['"]([a-zA-Z0-9_-]+)['"]\)\s*\.([a-zA-Z0-9_$]+)/g;
    let m;
    while ((m = directRegex.exec(line)) !== null) {
      const id = m[1];
      const prop = m[2];
      // If id is not in htmlIds, check if it exists in html
      if (!htmlIds.has(id)) {
        console.log(`[POTENTIAL CRASH] ${file}:${idx + 1} - document.getElementById('${id}').${prop} - #${id} NOT in index.html!`);
      }
    }

    const qsDirectRegex = /document\.querySelector\(['"]#([a-zA-Z0-9_-]+)['"]\)\s*\.([a-zA-Z0-9_$]+)/g;
    while ((m = qsDirectRegex.exec(line)) !== null) {
      const id = m[1];
      const prop = m[2];
      if (!htmlIds.has(id)) {
        console.log(`[POTENTIAL CRASH] ${file}:${idx + 1} - document.querySelector('#${id}').${prop} - #${id} NOT in index.html!`);
      }
    }
  });
}
