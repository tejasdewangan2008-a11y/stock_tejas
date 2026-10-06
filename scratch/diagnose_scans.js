const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('--- 2. Testing Dashboard & Scans Engine ---');
  const dash = await get('/api/dashboards');
  console.log('Dashboards Loaded:', dash.status === 200, 'Count:', dash.body.dashboards?.length);

  const scans = await get('/api/scans');
  console.log('Prebuilt Scans:', scans.status === 200, 'Total:', scans.body.prebuilt?.length);

  let successCount = 0;
  for (const scan of scans.body.prebuilt) {
    const res = await post('/api/scans/run', { scanId: scan.id });
    if (res.status === 200 && Array.isArray(res.body.results)) {
      successCount++;
      console.log(`  ✓ Scan [${scan.id}] "${scan.title}": ${res.body.results.length} matches`);
    } else {
      console.error('FAIL running scan:', scan.id, res.body);
    }
  }
  console.log(`Executed ${successCount}/${scans.body.prebuilt.length} Prebuilt Scans Successfully!`);

  // Test custom scan creation
  const customScan = {
    title: 'Test Momentum Scan',
    segment: 'Cash',
    passType: 'all',
    filters: [{ left: 'changePct', op: 'gt', rightType: 'number', right: 0 }]
  };
  const saveRes = await post('/api/scans/save', customScan);
  console.log('Save Custom Scan:', saveRes.status === 200 && saveRes.body.success ? 'PASS' : 'FAIL', 'ID:', saveRes.body.scan?.id);

  if (saveRes.body.scan?.id) {
    const runCust = await post('/api/scans/run', { scanId: saveRes.body.scan.id });
    console.log('Run Custom Scan:', runCust.status === 200 ? 'PASS' : 'FAIL', 'Matches:', runCust.body.results?.length);
  }
})();
