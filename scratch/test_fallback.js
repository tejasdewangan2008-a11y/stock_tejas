const {
  generateCalibratedStockFallback,
  computeAiMomentumAnalysis,
  computeIntradayAiMomentum,
  computeLongTermAiMomentum,
  computeBrokerMarketDepth,
  computeBrokerDerivatives
} = require('../market-service');

function testFallback() {
  console.log('Testing fallback stock generation...');
  const fallback = generateCalibratedStockFallback('TESTSYM', 'Test Company Ltd');
  console.log('Fallback symbol:', fallback.symbol, 'ltp:', fallback.ltp);

  try {
    computeAiMomentumAnalysis(fallback);
    console.log('✓ computeAiMomentumAnalysis passed');
  } catch (e) {
    console.error('✗ computeAiMomentumAnalysis failed:', e.message);
  }

  try {
    computeIntradayAiMomentum(fallback);
    console.log('✓ computeIntradayAiMomentum passed');
  } catch (e) {
    console.error('✗ computeIntradayAiMomentum failed:', e.message);
  }

  try {
    computeLongTermAiMomentum(fallback);
    console.log('✓ computeLongTermAiMomentum passed');
  } catch (e) {
    console.error('✗ computeLongTermAiMomentum failed:', e.message);
  }

  try {
    computeBrokerMarketDepth(fallback);
    console.log('✓ computeBrokerMarketDepth passed');
  } catch (e) {
    console.error('✗ computeBrokerMarketDepth failed:', e.message);
  }

  try {
    computeBrokerDerivatives(fallback);
    console.log('✓ computeBrokerDerivatives passed');
  } catch (e) {
    console.error('✗ computeBrokerDerivatives failed:', e.message);
  }
}

testFallback();
