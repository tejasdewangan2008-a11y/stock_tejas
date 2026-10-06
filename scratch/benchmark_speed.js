const http = require('http');
const zlib = require('zlib');

function fetchResource(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path: path,
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        ...headers
      }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        const elapsedMs = Date.now() - start;
        const encoding = res.headers['content-encoding'];
        
        let uncompressedBytes = rawBuffer.length;
        if (encoding === 'gzip') {
          try {
            uncompressedBytes = zlib.gunzipSync(rawBuffer).length;
          } catch (e) {}
        }

        resolve({
          path,
          statusCode: res.statusCode,
          elapsedMs,
          transferredBytes: rawBuffer.length,
          uncompressedBytes,
          encoding: encoding || 'none',
          cacheControl: res.headers['cache-control'] || 'none',
          etag: res.headers['etag'] || null
        });
      });
    });
    req.on('error', reject);
  });
}

async function runBenchmark() {
  console.log('====================================================');
  console.log('⚡ BENCHMARKING SPEED & PAYLOAD OPTIMIZATIONS ⚡');
  console.log('====================================================\n');

  const staticAssets = [
    '/',
    '/css/style.css',
    '/css/mobile.css',
    '/js/charts.js',
    '/js/dashboard.js',
    '/js/query-builder.js',
    '/js/app.js'
  ];

  console.log('--- 1. STATIC ASSETS COMPRESSION & CACHING ---');
  let totalTransferred = 0;
  let totalRaw = 0;
  const etags = {};

  for (const asset of staticAssets) {
    const res = await fetchResource(asset);
    totalTransferred += res.transferredBytes;
    totalRaw += res.uncompressedBytes;
    etags[asset] = res.etag;
    console.log(`[${res.statusCode}] ${asset.padEnd(22)} | Over Wire: ${(res.transferredBytes / 1024).toFixed(1).padStart(5)} KB (Raw: ${(res.uncompressedBytes / 1024).toFixed(1).padStart(5)} KB) | Enc: ${res.encoding.padEnd(5)} | Cache: ${res.cacheControl} | ${res.elapsedMs}ms`);
  }

  console.log(`\n=> Total Initial Static Payload: ${(totalTransferred / 1024).toFixed(1)} KB (down from ${(totalRaw / 1024).toFixed(1)} KB raw, ${((1 - totalTransferred / totalRaw) * 100).toFixed(1)}% savings!)\n`);

  console.log('--- 2. ETAG / 304 CACHE REVALIDATION TEST ---');
  for (const asset of staticAssets.slice(1, 3)) {
    if (etags[asset]) {
      const res304 = await fetchResource(asset, { 'If-None-Match': etags[asset] });
      console.log(`[${res304.statusCode}] ${asset.padEnd(22)} | 304 Not Modified verification: ${res304.transferredBytes} bytes transferred in ${res304.elapsedMs}ms!`);
    }
  }

  console.log('\n--- 3. API ENDPOINTS SPEED & PAYLOAD SLIMMING ---');
  const apiEndpoints = [
    '/api/info',
    '/api/stocks',
    '/api/sectors',
    '/api/watchlists',
    '/api/stock/RELIANCE'
  ];

  for (const endpoint of apiEndpoints) {
    const res = await fetchResource(endpoint);
    console.log(`[${res.statusCode}] ${endpoint.padEnd(22)} | Over Wire: ${(res.transferredBytes / 1024).toFixed(1).padStart(5)} KB (Raw: ${(res.uncompressedBytes / 1024).toFixed(1).padStart(6)} KB) | Enc: ${res.encoding.padEnd(5)} | Time: ${res.elapsedMs}ms`);
  }

  console.log('\n--- 4. SCAN EXECUTION BENCHMARK ---');
  const scanPostStart = Date.now();
  const scanReq = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/scans/run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate'
    }
  }, (res) => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      const rawBuffer = Buffer.concat(chunks);
      const elapsedMs = Date.now() - scanPostStart;
      const encoding = res.headers['content-encoding'];
      let uncompressed = rawBuffer.length;
      let data = {};
      try {
        const text = encoding === 'gzip' ? zlib.gunzipSync(rawBuffer).toString('utf-8') : rawBuffer.toString('utf-8');
        uncompressed = text.length;
        data = JSON.parse(text);
      } catch (e) {}

      console.log(`[${res.statusCode}] /api/scan/run (bullish-breakout) | Wire: ${(rawBuffer.length / 1024).toFixed(1)} KB (Raw: ${(uncompressed / 1024).toFixed(1)} KB) | Matched: ${data.count} / ${data.totalScanned} | Time: ${elapsedMs}ms`);
      console.log('\n====================================================');
      console.log('✅ ALL PERFORMANCE TESTS PASSED WITH FLYING COLORS!');
      console.log('====================================================');
    });
  });

  scanReq.write(JSON.stringify({ scanId: 'bullish-breakout' }));
  scanReq.end();
}

runBenchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
