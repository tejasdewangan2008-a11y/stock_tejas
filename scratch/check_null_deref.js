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

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check const/let/var varName = document.getElementById('id');
    const declMatch = /(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*document\.getElementById\(['"]([a-zA-Z0-9_-]+)['"]\)/.exec(line);
    if (declMatch) {
      const varName = declMatch[1];
      const id = declMatch[2];
      if (!htmlIds.has(id)) {
        // Look ahead 10 lines to see if it's checked with if (varName) or accessed directly
        let checked = false;
        let accessedUnchecked = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 15); j++) {
          const nextLine = lines[j];
          if (new RegExp(`if\\s*\\(\\s*${varName}\\b`).test(nextLine)) {
            checked = true;
            break;
          }
          if (new RegExp(`if\\s*\\(\\s*!${varName}\\b`).test(nextLine)) {
            checked = true;
            break;
          }
          if (new RegExp(`\\b${varName}\\s*\\.[a-zA-Z0-9_$]+`).test(nextLine) && !new RegExp(`\\b${varName}\\?\\.`).test(nextLine)) {
            accessedUnchecked = true;
            console.log(`[NULL DEREF BUG] ${file}:${j + 1} - '${varName}' (from #${id}) accessed without null check! Line: ${nextLine.trim()}`);
            break;
          }
        }
      }
    }
  }
}
