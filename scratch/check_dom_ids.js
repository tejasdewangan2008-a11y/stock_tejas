const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('public/index.html', 'utf8');

// Extract all id="..." from index.html
const idRegex = /id=["']([^"']+)["']/g;
const htmlIds = new Set();
let match;
while ((match = idRegex.exec(html)) !== null) {
  htmlIds.add(match[1]);
}

console.log(`Found ${htmlIds.size} unique IDs in index.html`);

// Now check JS files for getElementById and querySelector('#...')
const jsFiles = [
  'public/js/app.js',
  'public/js/charts.js',
  'public/js/dashboard.js',
  'public/js/query-builder.js'
];

const missingIds = [];
const idLookups = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  
  // getElementById('...') or ("...")
  const gebiRegex = /getElementById\(['"`]([^'"`]+)['"`]\)/g;
  while ((match = gebiRegex.exec(content)) !== null) {
    idLookups.push({ file, id: match[1], type: 'getElementById' });
  }

  // querySelector('#...')
  const qsRegex = /querySelector\(['"`]#([a-zA-Z0-9_-]+)['"`]\)/g;
  while ((match = qsRegex.exec(content)) !== null) {
    idLookups.push({ file, id: match[1], type: 'querySelector' });
  }
}

for (const item of idLookups) {
  if (!htmlIds.has(item.id)) {
    // Check if dynamically created or truly missing
    missingIds.push(item);
  }
}

// Deduplicate missingIds by file + id
const uniqueMissing = [];
const seen = new Set();
for (const m of missingIds) {
  const key = `${m.file}::${m.id}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueMissing.push(m);
  }
}

console.log(`Found ${uniqueMissing.length} referenced IDs missing from index.html:`);
uniqueMissing.forEach(m => console.log(`  - [${m.file}] #${m.id} (${m.type})`));
