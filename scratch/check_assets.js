const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
let m;
while ((m = scriptRegex.exec(html)) !== null) {
  const cleanPath = m[1].split('?')[0];
  if (!cleanPath.startsWith('http')) {
    const exists = fs.existsSync('public/' + cleanPath);
    console.log('Script:', m[1], '-> Exists?', exists);
  } else {
    console.log('External script:', m[1]);
  }
}

const cssRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
while ((m = cssRegex.exec(html)) !== null) {
  const cleanPath = m[1].split('?')[0];
  if (!cleanPath.startsWith('http') && cleanPath.endsWith('.css')) {
    const exists = fs.existsSync('public/' + cleanPath);
    console.log('CSS:', m[1], '-> Exists?', exists);
  }
}
