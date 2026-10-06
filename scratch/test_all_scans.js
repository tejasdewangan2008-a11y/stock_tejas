const { PREBUILT_SCANS, runScan } = require('../scans');
const { RealMarketService } = require('../market-service');

async function testAllScans() {
  const resp = await fetch('http://localhost:3000/api/stocks');
  const sData = await resp.json();
  const allStocks = sData.stocks;
  console.log(`Loaded ${allStocks.length} stocks. Testing all ${PREBUILT_SCANS.length} prebuilt scans...`);

  let failures = [];
  for (const scan of PREBUILT_SCANS) {
    try {
      const results = runScan(scan, allStocks);
      console.log(`✓ Scan "${scan.name}" (${scan.id}): ${results.length} matches`);
    } catch (e) {
      console.error(`✗ FAIL in scan "${scan.name}" (${scan.id}):`, e.message);
      failures.push({ id: scan.id, name: scan.name, error: e.message });
    }
  }

  if (failures.length === 0) {
    console.log('All scans executed with 0 errors!');
  } else {
    console.log(`${failures.length} scans FAILED:`, failures);
  }
}

testAllScans();
