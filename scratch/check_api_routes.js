const fs = require('fs');

const serverJs = fs.readFileSync('server.js', 'utf8');

// Extract routes from server.js: app.get('/api/...'), app.post('/api/...')
const routeRegex = /app\.(get|post|put|delete)\(['"`]([^'"`]+)['"`]/g;
const serverRoutes = [];
let match;
while ((match = routeRegex.exec(serverJs)) !== null) {
  serverRoutes.push({ method: match[1].toUpperCase(), route: match[2] });
}

console.log(`Server routes defined (${serverRoutes.length}):`);
serverRoutes.forEach(r => console.log(`  ${r.method} ${r.route}`));

// Extract fetch calls from frontend files
const jsFiles = [
  'public/js/app.js',
  'public/js/charts.js',
  'public/js/dashboard.js',
  'public/js/query-builder.js'
];

const clientCalls = [];
for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match fetch('/api/...
  const fetchRegex = /fetch\(['"`](\/api\/[^'"`?]+)(\?[^'"`]*)?['"`]/g;
  while ((match = fetchRegex.exec(content)) !== null) {
    clientCalls.push({ file, endpoint: match[1] });
  }
  // Match template string fetches: fetch(`/api/...`)
  const fetchTplRegex = /fetch\(`(\/api\/[^`?]+)(\?[^`]*)?`/g;
  while ((match = fetchTplRegex.exec(content)) !== null) {
    clientCalls.push({ file, endpoint: match[1] });
  }
}

console.log(`\nClient API fetches found: ${clientCalls.length}`);
const uniqueClientEndpoints = [...new Set(clientCalls.map(c => c.endpoint))];
console.log('Unique endpoints fetched by client:', uniqueClientEndpoints);

// Match client endpoints to server routes
console.log('\nChecking for unmatched client endpoints:');
for (const ep of uniqueClientEndpoints) {
  // convert express route params like :symbol, :id to regex
  const matched = serverRoutes.some(sr => {
    const pattern = '^' + sr.route.replace(/:[a-zA-Z0-9_]+/g, '[^/]+') + '$';
    // handle client endpoint with ${...} template params
    const epPattern = '^' + ep.replace(/\${[^}]+}/g, '[^/]+') + '$';
    return new RegExp(pattern).test(ep.replace(/\${[^}]+}/g, 'SAMPLE')) || new RegExp(epPattern).test(sr.route.replace(/:[a-zA-Z0-9_]+/g, 'SAMPLE'));
  });
  if (!matched) {
    console.log(`  [UNMATCHED CLIENT ENDPOINT] ${ep}`);
  } else {
    console.log(`  ✓ Matched: ${ep}`);
  }
}
