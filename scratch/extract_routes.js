const fs = require('fs');
const http = require('http');

const content = fs.readFileSync('server.js', 'utf8');
const regex = /app\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]/g;
const routes = [];
let match;
while ((match = regex.exec(content)) !== null) {
  routes.push({ method: match[1].toUpperCase(), path: match[2] });
}

console.log(`Found ${routes.length} routes:`);
routes.forEach(r => console.log(`${r.method.padEnd(6)} ${r.path}`));
