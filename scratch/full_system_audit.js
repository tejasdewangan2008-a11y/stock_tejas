const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('=== STEP 1: Testing Unit Modules & Data Loading ===');

// 1. Check segments.js
try {
  const segments = require('../segments');
  console.log('  [PASS] segments.js loaded');
  console.log(`         Master directory size: ${segments.masterStockDirectory ? segments.masterStockDirectory.size : 0} items`);
  console.log(`         Sectors count: ${segments.SECTOR_MAP ? Object.keys(segments.SECTOR_MAP).length : 0}`);
  
  if (!segments.masterStockDirectory || segments.masterStockDirectory.size < 100) {
    console.error('  [FAIL] masterStockDirectory has fewer than 100 stocks!');
  }
  
  // Test search
  const kecResults = segments.searchStocks('KEC');
  console.log(`         Search 'KEC' count: ${kecResults.length}, Top result: ${kecResults[0]?.symbol}`);
  if (!kecResults || kecResults[0]?.symbol !== 'KEC') {
    console.error('  [WARN] Expected top result for KEC to be KEC, got:', kecResults[0]?.symbol);
  }
} catch (e) {
  console.error('  [FAIL] segments.js error:', e);
}

// 2. Check stock-data.js
let sampleStock = null;
try {
  const stockData = require('../stock-data');
  console.log('  [PASS] stock-data.js loaded');
  console.log(`         Default stocks count: ${stockData.DEFAULT_STOCKS ? stockData.DEFAULT_STOCKS.length : 0}`);
  sampleStock = stockData.DEFAULT_STOCKS && stockData.DEFAULT_STOCKS[0];
} catch (e) {
  console.error('  [FAIL] stock-data.js error:', e);
}

// 3. Check scans.js
try {
  const { PREBUILT_SCANS, runScan } = require('../scans');
  console.log(`  [PASS] scans.js loaded, ${PREBUILT_SCANS.length} prebuilt scans`);
  
  // Run every prebuilt scan against a mock/default stocks list
  const stockData = require('../stock-data');
  const stocks = stockData.DEFAULT_STOCKS || [];
  
  let scanFails = 0;
  PREBUILT_SCANS.forEach(scan => {
    try {
      const results = runScan(scan, stocks);
      if (!Array.isArray(results)) {
        console.error(`  [FAIL] Scan ${scan.id} did not return an array`);
        scanFails++;
      }
    } catch (err) {
      console.error(`  [FAIL] Scan ${scan.id} threw error:`, err.message);
      scanFails++;
    }
  });
  if (scanFails === 0) {
    console.log(`  [PASS] All ${PREBUILT_SCANS.length} prebuilt scans executed without errors`);
  }
} catch (e) {
  console.error('  [FAIL] scans.js error:', e);
}

// 4. Check market-service.js functions
try {
  const marketService = require('../market-service');
  console.log('  [PASS] market-service.js loaded');

  if (sampleStock) {
    const ai1 = marketService.computeAiMomentumAnalysis(sampleStock);
    console.log(`         computeAiMomentumAnalysis output keys: ${Object.keys(ai1).join(', ')}`);
    
    const ai2 = marketService.computeIntradayAiMomentum(sampleStock);
    console.log(`         computeIntradayAiMomentum score: ${ai2.momentumScore}`);

    const ai3 = marketService.computeLongTermAiMomentum(sampleStock);
    console.log(`         computeLongTermAiMomentum score: ${ai3.momentumScore}`);

    const depth = marketService.computeBrokerMarketDepth(sampleStock);
    console.log(`         computeBrokerMarketDepth buyTotal: ${depth.totalBuyQty}, sellTotal: ${depth.totalSellQty}`);

    const deriv = marketService.computeBrokerDerivatives(sampleStock);
    console.log(`         computeBrokerDerivatives sentiment: ${deriv.sentiment}`);
  }
  
  const fiiDii = marketService.getFiiDiiData();
  console.log(`         getFiiDiiData: fiiNet=${fiiDii.fiiNet}, diiNet=${fiiDii.diiNet}`);
  
  const mktStatus = marketService.getNseMarketStatus();
  console.log(`         getNseMarketStatus: status=${mktStatus.status}, isOpen=${mktStatus.isOpen}`);
} catch (e) {
  console.error('  [FAIL] market-service.js functions error:', e);
}

console.log('\n=== STEP 1 COMPLETE ===\n');
