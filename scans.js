// Pre-built Chartink Scans & Evaluation Engine

const PREBUILT_SCANS = [
  {
    id: 'indeces-intraday',
    title: 'Indeces Intraday (5M RSI Cross > 30)',
    description: 'Chartink Official Screener (indeces-intraday): 5-minute RSI(14) crossed above 30 from oversold on Nifty and BankNifty indices & constituents',
    category: 'Intraday Momentum',
    segment: 'nifty and banknifty',
    chartinkUrl: 'https://chartink.com/screener/indeces-intraday',
    passType: 'all',
    filters: [
      { left: 'rsi14', op: 'gt', rightType: 'number', right: 30 },
      { left: 'rsi14Prev', op: 'lte', rightType: 'number', right: 30 }
    ]
  },
  {
    id: 'bullish-breakout',
    title: 'Bullish Breakout (Price & Volume)',
    description: 'Stocks breaking out above 20-day averages with high volume confirmation',
    category: 'Breakout',
    segment: 'Cash',
    passType: 'all', // all or any
    filters: [
      { left: 'close', op: 'gt', rightType: 'indicator', right: 'sma20' },
      { left: 'changePct', op: 'gt', rightType: 'number', right: 1.5 },
      { left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.3 }
    ]
  },
  {
    id: 'rsi-oversold-bounce',
    title: 'RSI Oversold Reversal',
    description: 'Oversold stocks bouncing back (RSI between 25 and 45 turning positive)',
    category: 'Momentum',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'rsi14', op: 'lt', rightType: 'number', right: 45 },
      { left: 'changePct', op: 'gt', rightType: 'number', right: 0.5 }
    ]
  },
  {
    id: 'golden-cross',
    title: 'Golden Cross (50 EMA > 200 EMA)',
    description: 'Strong medium-term trend: 50-day EMA trading above 200-day EMA with price above 50 EMA',
    category: 'Moving Average',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'ema50', op: 'gt', rightType: 'indicator', right: 'ema200' },
      { left: 'close', op: 'gt', rightType: 'indicator', right: 'ema50' }
    ]
  },
  {
    id: 'volume-shockers',
    title: 'Volume Shockers (Surge > 2x)',
    description: 'Stocks witnessing high buying interest with today\'s volume exceeding 2x 10-day average',
    category: 'Volume',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 2.0 },
      { left: 'changePct', op: 'gt', rightType: 'number', right: 1.0 }
    ]
  },
  {
    id: 'macd-bullish-cross',
    title: 'MACD Bullish Crossover',
    description: 'MACD Line crosses above MACD Signal Line with expanding positive histogram',
    category: 'Momentum',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'macdLine', op: 'gt', rightType: 'indicator', right: 'macdSignal' },
      { left: 'macdHist', op: 'gt', rightType: 'number', right: 0 }
    ]
  },
  {
    id: 'bollinger-breakout',
    title: 'Bollinger Band Blast',
    description: 'Stocks piercing the Upper Bollinger Band indicating explosive upside momentum',
    category: 'Volatility',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'close', op: 'gt', rightType: 'indicator', right: 'bbUpper' },
      { left: 'changePct', op: 'gt', rightType: 'number', right: 1.0 }
    ]
  },
  {
    id: 'supertrend-buy',
    title: 'SuperTrend Buy Signals',
    description: 'Stocks in confirmed SuperTrend BUY mode with price trading above the indicator line',
    category: 'Trend Following',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'supertrendDir', op: 'eq', rightType: 'string', right: 'BUY' },
      { left: 'close', op: 'gt', rightType: 'indicator', right: 'supertrend' }
    ]
  },
  {
    id: 'candlestick-reversal',
    title: 'Bullish Candlestick Patterns',
    description: 'Stocks forming key reversal patterns: Bullish Engulfing, Hammer, or Morning Star',
    category: 'Price Action',
    segment: 'Cash',
    passType: 'any',
    filters: [
      { left: 'patterns', op: 'contains', rightType: 'string', right: 'Bullish Engulfing' },
      { left: 'patterns', op: 'contains', rightType: 'string', right: 'Hammer' },
      { left: 'patterns', op: 'contains', rightType: 'string', right: 'Morning Star' }
    ]
  },
  {
    id: 'top-gainers-momentum',
    title: 'Top Gainers Momentum (> 2.5%)',
    description: 'High-performing stocks today with strong percentage gain and bullish RSI > 55',
    category: 'Intraday',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'changePct', op: 'gt', rightType: 'number', right: 2.5 },
      { left: 'rsi14', op: 'gt', rightType: 'number', right: 55 }
    ]
  },
  {
    id: 'bearish-breakdown',
    title: 'Bearish Breakdown (Short Watch)',
    description: 'Stocks trading below 50 SMA with negative day change and weak RSI < 45',
    category: 'Short Selling',
    segment: 'Cash',
    passType: 'all',
    filters: [
      { left: 'close', op: 'lt', rightType: 'indicator', right: 'sma50' },
      { left: 'changePct', op: 'lt', rightType: 'number', right: -0.5 },
      { left: 'rsi14', op: 'lt', rightType: 'number', right: 45 }
    ]
  }
];

// Helper to resolve an indicator or field on a stock object with optional bar offset (e.g. 0, -1, -2, -5)
function resolveField(stock, fieldName, offset = 0) {
  if (!stock || !fieldName) return null;
  const numOffset = parseInt(offset, 10) || 0;

  // If offset is requested, prioritize historical series array
  if (numOffset !== 0 && stock.series && fieldName in stock.series) {
    const series = stock.series[fieldName];
    if (Array.isArray(series) && series.length > 0) {
      const idx = series.length - 1 + numOffset;
      if (idx >= 0 && idx < series.length) {
        return series[idx];
      }
    }
  }

  // Also check dailyCandles for price fields with offset
  if (numOffset !== 0 && Array.isArray(stock.dailyCandles) && stock.dailyCandles.length > 0) {
    const idx = stock.dailyCandles.length - 1 + numOffset;
    if (idx >= 0 && idx < stock.dailyCandles.length) {
      const candle = stock.dailyCandles[idx];
      if (fieldName in candle) return candle[fieldName];
    }
  }

  // Offset 0 or fallback: current indicators and direct properties
  if (fieldName in stock) return stock[fieldName];
  if (stock.indicators && fieldName in stock.indicators) return stock.indicators[fieldName];
  if (stock.series && fieldName in stock.series) {
    const arr = stock.series[fieldName];
    if (Array.isArray(arr) && arr.length > 0) return arr[arr.length - 1];
  }
  return null;
}

// Evaluate a single condition against a stock with multi-bar offset support
function evaluateCondition(stock, condition) {
  const leftOffset = parseInt(condition.leftOffset || 0, 10);
  const leftVal = resolveField(stock, condition.left, leftOffset);
  if (leftVal === null || leftVal === undefined) return false;

  let rightVal;
  if (condition.rightType === 'indicator') {
    const rightOffset = parseInt(condition.rightOffset || 0, 10);
    rightVal = resolveField(stock, condition.right, rightOffset);
  } else if (condition.rightType === 'number') {
    rightVal = parseFloat(condition.right);
  } else {
    rightVal = condition.right;
  }

  if (rightVal === null || rightVal === undefined) return false;

  // Apply optional arithmetic math modifier (e.g. * 1.5, + 5)
  if (condition.mathOp && condition.mathFactor !== undefined && !isNaN(condition.mathFactor)) {
    const factor = parseFloat(condition.mathFactor);
    switch (condition.mathOp) {
      case '*':
        rightVal = Number(rightVal) * factor;
        break;
      case '/':
        if (factor !== 0) rightVal = Number(rightVal) / factor;
        break;
      case '+':
        rightVal = Number(rightVal) + factor;
        break;
      case '-':
        rightVal = Number(rightVal) - factor;
        break;
    }
  }

  switch (condition.op) {
    case 'gt':
      return Number(leftVal) > Number(rightVal);
    case 'lt':
      return Number(leftVal) < Number(rightVal);
    case 'gte':
      return Number(leftVal) >= Number(rightVal);
    case 'lte':
      return Number(leftVal) <= Number(rightVal);
    case 'eq':
      return String(leftVal).toLowerCase() === String(rightVal).toLowerCase();
    case 'neq':
      return String(leftVal).toLowerCase() !== String(rightVal).toLowerCase();
    case 'crosses_above':
      // left[0] > right[0] AND left[-1] <= right[-1]
      const prevLeft = resolveField(stock, condition.left, leftOffset - 1);
      const prevRight = condition.rightType === 'indicator' 
        ? resolveField(stock, condition.right, (parseInt(condition.rightOffset || 0, 10)) - 1)
        : rightVal;
      if (prevLeft !== null && prevRight !== null) {
        return Number(leftVal) > Number(rightVal) && Number(prevLeft) <= Number(prevRight);
      }
      return Number(leftVal) > Number(rightVal);
    case 'crosses_below':
      const pLeft = resolveField(stock, condition.left, leftOffset - 1);
      const pRight = condition.rightType === 'indicator'
        ? resolveField(stock, condition.right, (parseInt(condition.rightOffset || 0, 10)) - 1)
        : rightVal;
      if (pLeft !== null && pRight !== null) {
        return Number(leftVal) < Number(rightVal) && Number(pLeft) >= Number(pRight);
      }
      return Number(leftVal) < Number(rightVal);
    case 'contains':
      if (Array.isArray(leftVal)) {
        return leftVal.some(item => String(item).toLowerCase() === String(rightVal).toLowerCase());
      }
      return String(leftVal).toLowerCase().includes(String(rightVal).toLowerCase());
    default:
      return false;
  }
}

// Run a scan definition against stock universe (supporting nested groups and flat filters)
function runScan(scanDef, stockList) {
  // 1. Filter by segment if specified
  let candidates = stockList;
  if (scanDef.segment) {
    const segNorm = scanDef.segment.trim().toLowerCase();
    if (segNorm !== 'all' && segNorm !== 'cash') {
      if (segNorm === 'watchlist' && Array.isArray(scanDef.watchlistSymbols)) {
        candidates = candidates.filter(s => scanDef.watchlistSymbols.includes(s.symbol));
      } else if (segNorm !== 'watchlist') {
        candidates = candidates.filter(s => {
          if (!Array.isArray(s.segment)) return false;
          return s.segment.some(seg => seg.trim().toLowerCase() === segNorm);
        });
      }
    }
  }

  // 2. Check for Nested Filter Groups (Group 1 [AND/OR] Group 2)
  if (Array.isArray(scanDef.filterGroups) && scanDef.filterGroups.length > 0) {
    const groupJoin = scanDef.groupJoin === 'and' ? 'and' : 'or'; // default group connector is OR in Chartink
    return candidates.filter(stock => {
      const groupResults = scanDef.filterGroups.map(group => {
        if (!group.filters || group.filters.length === 0) return true;
        if (group.passType === 'any') {
          return group.filters.some(c => evaluateCondition(stock, c));
        } else {
          return group.filters.every(c => evaluateCondition(stock, c));
        }
      });

      return groupJoin === 'or' 
        ? groupResults.some(Boolean)
        : groupResults.every(Boolean);
    });
  }

  // 3. Fallback: Flat Filters
  if (!scanDef.filters || scanDef.filters.length === 0) {
    return candidates;
  }

  return candidates.filter(stock => {
    if (scanDef.passType === 'any') {
      return scanDef.filters.some(c => evaluateCondition(stock, c));
    } else {
      // passType === 'all' (default Chartink behavior)
      return scanDef.filters.every(c => evaluateCondition(stock, c));
    }
  });
}

module.exports = {
  PREBUILT_SCANS,
  runScan,
  evaluateCondition,
  resolveField
};
