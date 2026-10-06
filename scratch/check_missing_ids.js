const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const idRegex = /\bid=["']([^"']+)["']/g;
const htmlIds = new Set();
let m;
while ((m = idRegex.exec(html)) !== null) {
  htmlIds.add(m[1]);
}
console.log(`Found ${htmlIds.size} unique IDs in index.html`);

const jsFiles = ['public/js/app.js', 'public/js/dashboard.js', 'public/js/charts.js', 'public/js/query-builder.js'];
const missingIds = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const getElemRegex = /document\.getElementById\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = getElemRegex.exec(content)) !== null) {
    const id = m[1];
    if (!htmlIds.has(id)) {
      missingIds.push({ file, id });
    }
  }
}

console.log(`\nFound ${missingIds.length} missing getElementById calls:`);
const uniqueMissing = {};
missingIds.forEach(({ file, id }) => {
  if (!uniqueMissing[id]) uniqueMissing[id] = [];
  uniqueMissing[id].push(file);
});

for (const [id, files] of Object.entries(uniqueMissing)) {
  console.log(`  ❌ ID "${id}" missing from index.html (referenced in: ${[...new Set(files)].join(', ')})`);
}
