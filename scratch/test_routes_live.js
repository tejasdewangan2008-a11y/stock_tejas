const http = require('http');

function checkRoute(route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${route}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ route, status: res.statusCode, length: data.length, sample: data.slice(0, 150) });
      });
    }).on('error', (err) => {
      resolve({ route, error: err.message });
    });
  });
}

async function run() {
  const routes = [
    '/',
    '/api/stocks',
    '/api/sectors',
    '/api/scans',
    '/api/market/status',
    '/api/stock/RELIANCE',
    '/api/search?q=KEC'
  ];
  for (const r of routes) {
    const res = await checkRoute(r);
    console.log(res);
  }
}

run();
