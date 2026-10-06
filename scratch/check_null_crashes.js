const fs = require('fs');

const jsFiles = ['public/js/app.js', 'public/js/dashboard.js', 'public/js/charts.js', 'public/js/query-builder.js'];
const html = fs.readFileSync('public/index.html', 'utf8');
const htmlIds = new Set();
let m;
const idRegex = /\bid=["']([^"']+)["']/g;
while ((m = idRegex.exec(html)) !== null) htmlIds.add(m[1]);

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/document\.getElementById\(\s*['"]([^'"]+)['"]\s*\)(\.|\s*\.|\s*\[)/);
    if (match) {
      const id = match[1];
      if (!htmlIds.has(id)) {
        // check if optional chaining was used
        if (!line.includes(`getElementById('${id}')?.`) && !line.includes(`getElementById("${id}")?.`)) {
          console.log(`POTENTIAL RUNTIME ERROR: ${file}:${idx + 1}`);
          console.log(`  ${line.trim()}`);
        }
      }
    }
  });
}
