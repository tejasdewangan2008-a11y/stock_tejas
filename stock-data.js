// Stock Universe and Technical Simulation Engine for Chartink Screener
// Covers major NSE/BSE segments (Nifty 50, Nifty Bank, Nifty IT, Nifty Auto, F&O, Midcap)

const STOCKS_METADATA = [
  // Nifty 50 & Heavyweights
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy & Petrochem', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 2985.50 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Information Tech', segment: ['Cash', 'Nifty 50', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 4210.20 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking & Finance', segment: ['Cash', 'Nifty 50', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 1675.00 },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty 50', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 1890.75 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking & Finance', segment: ['Cash', 'Nifty 50', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 1245.30 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 1560.80 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking & Finance', segment: ['Cash', 'Nifty 50', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 812.40 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', segment: ['Cash', 'Nifty 50', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 978.60 },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 498.20 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Capital Goods', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 3620.00 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', sector: 'Banking & Finance', segment: ['Cash', 'Nifty 50', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 1825.10 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking & Finance', segment: ['Cash', 'Nifty 50', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 1195.40 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 2740.50 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India', sector: 'Automobile', segment: ['Cash', 'Nifty 50', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 12480.00 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind', sector: 'Pharma & Healthcare', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 1795.00 },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Durables', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 3510.00 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Financial Services', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 7280.00 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Metals & Mining', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 2980.00 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', sector: 'Infrastructure', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 1420.50 },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power & Utilities', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 395.20 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India', sector: 'Power & Utilities', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 328.60 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Energy & Oil', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 295.40 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', segment: ['Cash', 'Nifty 50', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 2840.00 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 154.20 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 945.80 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 485.10 },
  { symbol: 'WIPRO', name: 'Wipro Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty 50', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 535.40 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty 50', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 1720.00 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty 50', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 1540.30 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Financial Services', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 1845.00 },

  // Nifty Bank & Financial Focus
  { symbol: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking & Finance', segment: ['Cash', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 254.80 },
  { symbol: 'PNB', name: 'Punjab National Bank', sector: 'Banking & Finance', segment: ['Cash', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 112.50 },
  { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking & Finance', segment: ['Cash', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 1460.00 },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking & Finance', segment: ['Cash', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 188.75 },
  { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', sector: 'Banking & Finance', segment: ['Cash', 'Nifty Bank', 'F&O', 'Nifty 500'], basePrice: 74.20 },

  // Nifty Auto & Mobility
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Automobile', segment: ['Cash', 'Nifty 50', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 5460.00 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobile', segment: ['Cash', 'Nifty 50', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 11800.00 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Automobile', segment: ['Cash', 'Nifty 50', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 4890.00 },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company', sector: 'Automobile', segment: ['Cash', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 2680.00 },
  { symbol: 'BHARATFORG', name: 'Bharat Forge Ltd', sector: 'Auto Ancillaries', segment: ['Cash', 'Nifty Auto', 'F&O', 'Nifty 500'], basePrice: 1480.00 },

  // Pharma & Healthcare
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma & Healthcare', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 1540.00 },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma & Healthcare', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 6650.00 },
  { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Ltd', sector: 'Pharma & Healthcare', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 5240.00 },
  { symbol: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharma & Healthcare', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 2180.00 },
  { symbol: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd', sector: 'Pharma & Healthcare', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 1450.00 },

  // High Growth & Momentum Midcaps / Breakout candidates
  { symbol: 'ZOMATO', name: 'Zomato Ltd', sector: 'Consumer Services', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 275.40 },
  { symbol: 'JIOFIN', name: 'Jio Financial Services', sector: 'Financial Services', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 348.50 },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Defence & Aerospace', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 4720.00 },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Defence & Aerospace', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 302.50 },
  { symbol: 'TRENT', name: 'Trent Ltd', sector: 'Retail', segment: ['Cash', 'Nifty 50', 'F&O', 'Nifty 500'], basePrice: 7350.00 },
  { symbol: 'DIXON', name: 'Dixon Technologies Ltd', sector: 'Electronics & Tech', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 13900.00 },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd', sector: 'Electricals', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 6850.00 },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', sector: 'Renewable Energy', segment: ['Cash', 'Nifty 500'], basePrice: 84.50 },
  { symbol: 'IREDA', name: 'Indian Renewable Energy Dev', sector: 'Financial Services', segment: ['Cash', 'Nifty 500'], basePrice: 228.00 },
  { symbol: 'BSE', name: 'BSE Limited', sector: 'Financial Capital Markets', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 3950.00 },
  { symbol: 'MCX', name: 'Multi Commodity Exchange', sector: 'Financial Capital Markets', segment: ['Cash', 'F&O', 'Nifty 500'], basePrice: 5890.00 },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 5320.00 },
  { symbol: 'COFORGE', name: 'Coforge Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 7180.00 },
  { symbol: 'TATAELXSI', name: 'Tata Elxsi Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty IT', 'F&O', 'Nifty 500'], basePrice: 7650.00 },
  { symbol: 'KPITTECH', name: 'KPIT Technologies Ltd', sector: 'Information Tech', segment: ['Cash', 'Nifty IT', 'Nifty 500'], basePrice: 1720.00 }
];

// Helper to generate realistic historical OHLCV data
function generateHistoricalCandles(basePrice, days = 100, trendSeed = 0) {
  const candles = [];
  let currentPrice = basePrice * (0.85 + Math.random() * 0.3); // randomized start 100 days ago
  const now = new Date();
  
  // Choose an archetype pattern for variety (breakout, oversold, golden cross, consolidation)
  const patternType = trendSeed % 6; // 0=bullish breakout, 1=oversold bounce, 2=golden cross rally, 3=consolidation, 4=volume surge, 5=steady bull

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    let dailyReturn = (Math.random() - 0.49) * 0.035; // base random fluctuation

    // Apply specific behavior towards the latest 10-15 days to trigger authentic scanner criteria
    if (i <= 5) {
      if (patternType === 0) dailyReturn = 0.015 + Math.random() * 0.03; // breakout
      else if (patternType === 1) dailyReturn = (i === 1 || i === 0) ? (0.02 + Math.random() * 0.02) : -0.025; // oversold bounce
      else if (patternType === 2) dailyReturn = 0.01 + Math.random() * 0.02; // golden cross rally
      else if (patternType === 4) dailyReturn = 0.025 + Math.random() * 0.035; // high volume surge
    }

    const open = currentPrice;
    currentPrice = Math.max(1, currentPrice * (1 + dailyReturn));
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.015);
    
    // Base volume with spikes on recent candles
    let baseVol = Math.floor(500000 + Math.random() * 2500000);
    if (i <= 3 && (patternType === 0 || patternType === 4)) {
      baseVol = Math.floor(baseVol * (2.2 + Math.random() * 2)); // volume shocker
    }

    candles.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: baseVol
    });
  }

  return candles;
}

// Generate intraday 15m candles for today/yesterday
function generateIntradayCandles(dailyCandles) {
  const latestDaily = dailyCandles[dailyCandles.length - 1];
  const prevDaily = dailyCandles[dailyCandles.length - 2] || latestDaily;
  const intraday = [];

  const timeSlots = [
    '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00',
    '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00',
    '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15'
  ];

  let p = latestDaily.open;
  const targetClose = latestDaily.close;
  const stepDrift = (targetClose - p) / timeSlots.length;

  timeSlots.forEach((slot, idx) => {
    const o = p;
    const rand = (Math.random() - 0.48) * (latestDaily.close * 0.005);
    p = Math.max(1, p + stepDrift + rand);
    if (idx === timeSlots.length - 1) p = targetClose;
    const c = p;
    const h = Math.max(o, c) + Math.random() * (latestDaily.close * 0.002);
    const l = Math.min(o, c) - Math.random() * (latestDaily.close * 0.002);
    const v = Math.floor(latestDaily.volume / timeSlots.length * (0.6 + Math.random() * 0.8));

    intraday.push({
      time: slot,
      open: parseFloat(o.toFixed(2)),
      high: parseFloat(h.toFixed(2)),
      low: parseFloat(l.toFixed(2)),
      close: parseFloat(c.toFixed(2)),
      volume: v
    });
  });

  return intraday;
}

// Technical Indicator Calculations
function calculateSMA(candles, period) {
  const result = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    result.push(parseFloat((sum / period).toFixed(2)));
  }
  return result;
}

function calculateEMA(candles, period) {
  const result = [];
  const k = 2 / (period + 1);
  let ema = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (ema === null) {
      // Initialize with SMA
      let sum = 0;
      for (let j = 0; j < period; j++) sum += candles[i - j].close;
      ema = sum / period;
    } else {
      ema = candles[i].close * k + ema * (1 - k);
    }
    result.push(parseFloat(ema.toFixed(2)));
  }
  return result;
}

function calculateRSI(candles, period = 14) {
  const result = [];
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) result.push(null);

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(parseFloat((100 - (100 / (1 + rs))).toFixed(2)));

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(parseFloat((100 - (100 / (1 + rs))).toFixed(2)));
  }

  return result;
}

function calculateMACD(candles, fast = 12, slow = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(candles, fast);
  const slowEMA = calculateEMA(candles, slow);
  const macdLine = [];

  for (let i = 0; i < candles.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push(parseFloat((fastEMA[i] - slowEMA[i]).toFixed(2)));
    } else {
      macdLine.push(null);
    }
  }

  // Signal line is EMA of macdLine
  const validMacdStart = macdLine.findIndex(v => v !== null);
  const signalLine = new Array(candles.length).fill(null);
  const histogram = new Array(candles.length).fill(null);

  if (validMacdStart !== -1 && candles.length - validMacdStart >= signalPeriod) {
    const k = 2 / (signalPeriod + 1);
    let ema = 0;
    const start = validMacdStart + signalPeriod - 1;
    let sum = 0;
    for (let j = 0; j < signalPeriod; j++) sum += macdLine[validMacdStart + j];
    ema = sum / signalPeriod;
    signalLine[start] = parseFloat(ema.toFixed(2));
    histogram[start] = parseFloat((macdLine[start] - signalLine[start]).toFixed(2));

    for (let i = start + 1; i < candles.length; i++) {
      ema = macdLine[i] * k + ema * (1 - k);
      signalLine[i] = parseFloat(ema.toFixed(2));
      histogram[i] = parseFloat((macdLine[i] - signalLine[i]).toFixed(2));
    }
  }

  return { macdLine, signalLine, histogram };
}

function calculateBollingerBands(candles, period = 20, multiplier = 2) {
  const sma = calculateSMA(candles, period);
  const upper = [];
  const lower = [];

  for (let i = 0; i < candles.length; i++) {
    if (sma[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(candles[i - j].close - sma[i], 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);
    upper.push(parseFloat((sma[i] + multiplier * stdDev).toFixed(2)));
    lower.push(parseFloat((sma[i] - multiplier * stdDev).toFixed(2)));
  }

  return { middle: sma, upper, lower };
}

function calculateSuperTrend(candles, period = 10, multiplier = 3) {
  // Simplified SuperTrend calculation
  const atr = [];
  const supertrend = [];
  const direction = []; // 1 for bull, -1 for bear

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      atr.push(candles[0].high - candles[0].low);
      supertrend.push(candles[0].close);
      direction.push(1);
      continue;
    }
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    const curAtr = (atr[i - 1] * (period - 1) + tr) / period;
    atr.push(curAtr);

    const hl2 = (candles[i].high + candles[i].low) / 2;
    const basicUpper = hl2 + multiplier * curAtr;
    const basicLower = hl2 - multiplier * curAtr;

    let dir = direction[i - 1];
    let st = supertrend[i - 1];

    if (candles[i].close > st) dir = 1;
    else if (candles[i].close < st) dir = -1;

    st = dir === 1 ? basicLower : basicUpper;
    supertrend.push(parseFloat(st.toFixed(2)));
    direction.push(dir);
  }

  return { supertrend, direction };
}

// Detect Candlestick Patterns on latest candle
function detectCandlestickPatterns(candles) {
  if (candles.length < 3) return [];
  const patterns = [];
  const c0 = candles[candles.length - 1]; // latest
  const c1 = candles[candles.length - 2]; // previous
  const c2 = candles[candles.length - 3]; // 2 days ago

  const c0Body = Math.abs(c0.close - c0.open);
  const c0Range = c0.high - c0.low || 1;
  const c1Body = Math.abs(c1.close - c1.open);
  const isC0Green = c0.close > c0.open;
  const isC1Green = c1.close > c1.open;

  // Bullish Engulfing
  if (!isC1Green && isC0Green && c0.close >= c1.open && c0.open <= c1.close && c0Body > c1Body) {
    patterns.push('Bullish Engulfing');
  }

  // Bearish Engulfing
  if (isC1Green && !isC0Green && c0.open >= c1.close && c0.close <= c1.open && c0Body > c1Body) {
    patterns.push('Bearish Engulfing');
  }

  // Hammer (Lower shadow >= 2x body, tiny upper shadow)
  const c0LowerShadow = isC0Green ? (c0.open - c0.low) : (c0.close - c0.low);
  const c0UpperShadow = isC0Green ? (c0.high - c0.close) : (c0.high - c0.open);
  if (c0LowerShadow >= 2 * c0Body && c0UpperShadow <= 0.3 * c0Body && c0Range > 0) {
    patterns.push('Hammer');
  }

  // Shooting Star / Inverted Hammer
  if (c0UpperShadow >= 2 * c0Body && c0LowerShadow <= 0.3 * c0Body && c0Range > 0) {
    patterns.push('Shooting Star');
  }

  // Doji
  if (c0Body <= 0.1 * c0Range) {
    patterns.push('Doji');
  }

  // Morning Star
  if (!isC1Green && c1Body < c0Body * 0.4 && isC0Green && c0.close > (c2.open + c2.close) / 2) {
    patterns.push('Morning Star');
  }

  return patterns;
}

// Global Stock Database instance
class StockDatabase {
  constructor() {
    this.stocks = new Map();
    this.initDatabase();
  }

  initDatabase() {
    STOCKS_METADATA.forEach((meta, idx) => {
      const dailyCandles = generateHistoricalCandles(meta.basePrice, 100, idx);
      const intradayCandles = generateIntradayCandles(dailyCandles);
      
      const sma20 = calculateSMA(dailyCandles, 20);
      const sma50 = calculateSMA(dailyCandles, 50);
      const sma200 = calculateSMA(dailyCandles, 200);
      const ema9 = calculateEMA(dailyCandles, 9);
      const ema20 = calculateEMA(dailyCandles, 20);
      const ema50 = calculateEMA(dailyCandles, 50);
      const ema200 = calculateEMA(dailyCandles, 200);
      const rsi14 = calculateRSI(dailyCandles, 14);
      const macd = calculateMACD(dailyCandles);
      const bb = calculateBollingerBands(dailyCandles, 20, 2);
      const st = calculateSuperTrend(dailyCandles, 10, 3);
      const patterns = detectCandlestickPatterns(dailyCandles);

      const latestCandle = dailyCandles[dailyCandles.length - 1];
      const prevCandle = dailyCandles[dailyCandles.length - 2] || latestCandle;
      const change = parseFloat((latestCandle.close - prevCandle.close).toFixed(2));
      const changePct = parseFloat(((change / prevCandle.close) * 100).toFixed(2));

      // Calculate 52-week High and Low
      let high52 = -Infinity;
      let low52 = Infinity;
      dailyCandles.forEach(c => {
        if (c.high > high52) high52 = c.high;
        if (c.low < low52) low52 = c.low;
      });

      // Volume SMA 10
      let vol10Sum = 0;
      for (let v = 0; v < 10; v++) {
        vol10Sum += dailyCandles[dailyCandles.length - 1 - v]?.volume || 0;
      }
      const volumeSMA10 = Math.round(vol10Sum / 10);
      const volumeMultiplier = parseFloat((latestCandle.volume / volumeSMA10).toFixed(2));

      // Sparkline (last 15 closes normalized)
      const sparkline = dailyCandles.slice(-15).map(c => c.close);

      this.stocks.set(meta.symbol, {
        symbol: meta.symbol,
        name: meta.name,
        sector: meta.sector,
        segment: meta.segment,
        ltp: latestCandle.close,
        open: latestCandle.open,
        high: latestCandle.high,
        low: latestCandle.low,
        close: latestCandle.close,
        prevClose: prevCandle.close,
        change,
        changePct,
        volume: latestCandle.volume,
        volumeSMA10,
        volumeMultiplier,
        high52,
        low52,
        sparkline,
        patterns,
        dailyCandles,
        intradayCandles,
        indicators: {
          sma20: sma20[sma20.length - 1],
          sma50: sma50[sma50.length - 1],
          sma200: sma200[sma200.length - 1],
          ema9: ema9[ema9.length - 1],
          ema20: ema20[ema20.length - 1],
          ema50: ema50[ema50.length - 1],
          ema200: ema200[ema200.length - 1],
          rsi14: rsi14[rsi14.length - 1],
          rsi14Prev: rsi14[rsi14.length - 2] || rsi14[rsi14.length - 1],
          macdLine: macd.macdLine[macd.macdLine.length - 1],
          macdSignal: macd.signalLine[macd.signalLine.length - 1],
          macdHist: macd.histogram[macd.histogram.length - 1],
          bbUpper: bb.upper[bb.upper.length - 1],
          bbMiddle: bb.middle[bb.middle.length - 1],
          bbLower: bb.lower[bb.lower.length - 1],
          supertrend: st.supertrend[st.supertrend.length - 1],
          supertrendDir: st.direction[st.direction.length - 1] === 1 ? 'BUY' : 'SELL'
        }
      });
    });
  }

  getAllStocks(segment = null) {
    const list = Array.from(this.stocks.values()).map(s => {
      // return summary without raw historical arrays to keep payloads fast
      const { dailyCandles, intradayCandles, ...summary } = s;
      return summary;
    });

    if (!segment || segment === 'All' || segment === 'Cash') return list;
    return list.filter(s => s.segment.includes(segment));
  }

  getStockDetail(symbol) {
    return this.stocks.get(symbol.toUpperCase()) || null;
  }

  // Live Micro-Tick Simulator
  simulateTick() {
    const symbols = Array.from(this.stocks.keys());
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const stock = this.stocks.get(randomSymbol);
    if (!stock) return null;

    // Small tick between -0.3% and +0.3%
    const tickPct = (Math.random() - 0.49) * 0.006;
    const oldPrice = stock.ltp;
    let newPrice = parseFloat((oldPrice * (1 + tickPct)).toFixed(2));
    if (newPrice <= 0) newPrice = oldPrice;

    stock.ltp = newPrice;
    stock.close = newPrice;
    if (newPrice > stock.high) stock.high = newPrice;
    if (newPrice < stock.low) stock.low = newPrice;
    stock.change = parseFloat((newPrice - stock.prevClose).toFixed(2));
    stock.changePct = parseFloat(((stock.change / stock.prevClose) * 100).toFixed(2));
    stock.volume += Math.floor(500 + Math.random() * 3000);

    // Update sparkline
    stock.sparkline[stock.sparkline.length - 1] = newPrice;

    // Recalculate quick indicators
    stock.indicators.sma20 = parseFloat((stock.indicators.sma20 * 0.98 + newPrice * 0.02).toFixed(2));
    stock.indicators.rsi14 = Math.min(99, Math.max(1, parseFloat((stock.indicators.rsi14 + (tickPct * 100)).toFixed(2))));

    return {
      symbol: stock.symbol,
      ltp: stock.ltp,
      change: stock.change,
      changePct: stock.changePct,
      volume: stock.volume,
      high: stock.high,
      low: stock.low
    };
  }
}

module.exports = {
  StockDatabase,
  STOCKS_METADATA
};
