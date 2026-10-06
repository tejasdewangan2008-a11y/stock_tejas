// TradingView-Style Interactive Technical Charting Engine
// Supports Candlestick, Line & Area Charts, Multi-Timeframes (1m to 1Y), Moving Averages, Bollinger Bands, Supertrend, RSI & MACD

class TechnicalChart {
  constructor(canvasId, rsiCanvasId, macdCanvasId) {
    this.canvas = document.getElementById(canvasId);
    this.rsiCanvas = document.getElementById(rsiCanvasId);
    this.macdCanvas = document.getElementById(macdCanvasId);

    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.rsiCtx = this.rsiCanvas ? this.rsiCanvas.getContext('2d') : null;
    this.macdCtx = this.macdCanvas ? this.macdCanvas.getContext('2d') : null;
    
    this.candles = [];
    this.activeTimeframe = '1D';
    this.chartType = 'candles'; // 'candles', 'line', 'area'

    // Indicators Visibility
    this.showSma20 = true;
    this.showSma50 = true;
    this.showEma200 = true;
    this.showBollinger = true;
    this.showSupertrend = false;
    this.showRsi = true;
    this.showMacd = true;

    this.mouseX = -1;
    this.mouseY = -1;
    this.hoverIndex = -1;

    this.initEvents();
  }

  initEvents() {
    if (!this.canvas) return;

    const handlePointer = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = clientX - rect.left;
      this.mouseY = clientY - rect.top;
      this.render();
    };

    const clearPointer = () => {
      this.mouseX = -1;
      this.mouseY = -1;
      this.hoverIndex = -1;
      this.render();
    };

    this.canvas.addEventListener('mousemove', e => handlePointer(e.clientX, e.clientY));
    this.canvas.addEventListener('mouseleave', clearPointer);

    // Mobile touch events
    this.canvas.addEventListener('touchmove', e => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', clearPointer);

    window.addEventListener('resize', () => {
      if (this.candles.length > 0) this.render();
    });
  }

  setData(candles, timeframe = '1D') {
    this.candles = candles || [];
    this.activeTimeframe = timeframe;
    this.render();
    // Re-render after modal animation completes
    requestAnimationFrame(() => this.render());
    setTimeout(() => this.render(), 60);
    setTimeout(() => this.render(), 200);
  }

  setChartType(type) {
    this.chartType = type || 'candles';
    this.render();
  }

  toggleIndicator(name) {
    if (name === 'sma20') this.showSma20 = !this.showSma20;
    if (name === 'sma50') this.showSma50 = !this.showSma50;
    if (name === 'ema200') this.showEma200 = !this.showEma200;
    if (name === 'bollinger') this.showBollinger = !this.showBollinger;
    if (name === 'supertrend') this.showSupertrend = !this.showSupertrend;
    if (name === 'rsi') {
      this.showRsi = !this.showRsi;
      if (this.rsiCanvas) this.rsiCanvas.style.display = this.showRsi ? 'block' : 'none';
    }
    if (name === 'macd') {
      this.showMacd = !this.showMacd;
      if (this.macdCanvas) this.macdCanvas.style.display = this.showMacd ? 'block' : 'none';
    }
    this.render();
  }

  scaleCanvas(canvas, ctx) {
    if (!canvas || !ctx) return { width: 0, height: 0 };
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : (canvas.parentElement?.clientWidth || 850);
    const h = rect.height > 0 ? rect.height : (canvas.getAttribute('data-height') ? parseInt(canvas.getAttribute('data-height')) : (canvas.id === 'candlestickCanvas' ? 380 : 90));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    return { width: w, height: h };
  }

  render() {
    if (!this.canvas || !this.ctx || this.candles.length === 0) return;

    const { width, height } = this.scaleCanvas(this.canvas, this.ctx);
    const ctx = this.ctx;

    // Canvas Background
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const bgColor = isDark ? '#0d131f' : '#ffffff';
    const gridColor = isDark ? '#1a2436' : '#e2e8f0';
    const textColor = isDark ? '#64748b' : '#94a3b8';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padTop = 35;
    const padBottom = 40;
    const padLeft = 10;
    const padRight = 65; // Price Y-Axis width
    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    // Range Calculation
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    this.candles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    const priceMargin = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= priceMargin;
    maxPrice += priceMargin;
    const priceRange = maxPrice - minPrice;

    const getY = price => padTop + (1 - (price - minPrice) / priceRange) * chartHeight;
    const getX = index => padLeft + (index + 0.5) * (chartWidth / this.candles.length);
    const candleWidth = Math.max(2, (chartWidth / this.candles.length) * 0.75);

    // Grid lines & Price Axis
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.fillStyle = textColor;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (priceRange * i) / gridSteps;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.fillText('₹' + p.toFixed(2), width - padRight + 6, y + 3);
    }

    // Volume Bars (bottom 22% of chart)
    const volMaxHeight = chartHeight * 0.22;
    this.candles.forEach((c, idx) => {
      const x = getX(idx);
      const isGreen = c.close >= c.open;
      const vH = maxVolume > 0 ? (c.volume / maxVolume) * volMaxHeight : 0;
      const vY = padTop + chartHeight - vH;

      ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(x - candleWidth / 2, vY, candleWidth, vH);
    });

    // Bollinger Bands
    if (this.showBollinger && this.candles.length >= 20) {
      const closes = this.candles.map(c => c.close);
      const bb = this.calcBB(closes, 20, 2);

      // Upper band
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      let started = false;
      for (let i = 0; i < bb.upper.length; i++) {
        if (bb.upper[i] !== null) {
          const x = getX(i);
          const y = getY(bb.upper[i]);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Lower band
      ctx.beginPath();
      started = false;
      for (let i = 0; i < bb.lower.length; i++) {
        if (bb.lower[i] !== null) {
          const x = getX(i);
          const y = getY(bb.lower[i]);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Moving Averages
    const closes = this.candles.map(c => c.close);

    // SMA 20 (Amber)
    if (this.showSma20 && this.candles.length >= 20) {
      this.drawLineSeries(ctx, this.calcSMA(closes, 20), getX, getY, '#f59e0b', 1.5);
    }

    // SMA 50 (Blue)
    if (this.showSma50 && this.candles.length >= 50) {
      this.drawLineSeries(ctx, this.calcSMA(closes, 50), getX, getY, '#3b82f6', 1.5);
    }

    // EMA 200 (Purple)
    if (this.showEma200 && this.candles.length >= 100) {
      this.drawLineSeries(ctx, this.calcEMA(closes, 200), getX, getY, '#a855f7', 1.8);
    }

    // Main Chart Rendering: Candles, Line, or Area
    if (this.chartType === 'area') {
      // Mountain Area Chart
      ctx.beginPath();
      const firstX = getX(0);
      ctx.moveTo(firstX, padTop + chartHeight);
      this.candles.forEach((c, idx) => {
        ctx.lineTo(getX(idx), getY(c.close));
      });
      ctx.lineTo(getX(this.candles.length - 1), padTop + chartHeight);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartHeight);
      grad.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Line border
      ctx.beginPath();
      this.candles.forEach((c, idx) => {
        const x = getX(idx);
        const y = getY(c.close);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.chartType === 'line') {
      // Clean Line Chart
      ctx.beginPath();
      this.candles.forEach((c, idx) => {
        const x = getX(idx);
        const y = getY(c.close);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    } else {
      // Japanese Candlesticks
      this.candles.forEach((c, idx) => {
        const x = getX(idx);
        const isGreen = c.close >= c.open;
        const color = isGreen ? '#10b981' : '#ef4444';

        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Real Body
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      });
    }

    // Time Axis (X-Axis Labels)
    ctx.fillStyle = textColor;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    const labelInterval = Math.max(1, Math.floor(this.candles.length / 6));
    for (let i = 0; i < this.candles.length; i += labelInterval) {
      const c = this.candles[i];
      const x = getX(i);
      ctx.fillText(c.date || '', x, height - 12);
    }

    // Crosshair & Hover Tooltip
    if (this.mouseX >= padLeft && this.mouseX <= width - padRight) {
      const index = Math.min(
        this.candles.length - 1,
        Math.max(0, Math.floor(((this.mouseX - padLeft) / chartWidth) * this.candles.length))
      );
      this.hoverIndex = index;
      const hovered = this.candles[index];
      const x = getX(index);
      const y = getY(hovered.close);

      // Crosshair lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top floating OHLC legend
      const isGreen = hovered.close >= hovered.open;
      const changePct = (((hovered.close - hovered.open) / (hovered.open || 1)) * 100).toFixed(2);

      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(padLeft + 6, padTop - 25, 340, 20);
      ctx.strokeStyle = gridColor;
      ctx.strokeRect(padLeft + 6, padTop - 25, 340, 20);

      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${hovered.date}  O:${hovered.open} H:${hovered.high} L:${hovered.low} C:${hovered.close} (${changePct}%)`,
        padLeft + 12,
        padTop - 11
      );
    }

    // Render Subcharts
    if (this.showRsi) this.renderRSI();
    if (this.showMacd) this.renderMACD();
  }

  // RSI Oscillator Subchart Canvas
  renderRSI() {
    if (!this.rsiCanvas || !this.rsiCtx || this.candles.length === 0) return;
    const { width, height } = this.scaleCanvas(this.rsiCanvas, this.rsiCtx);
    const ctx = this.rsiCtx;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.fillStyle = isDark ? '#0d131f' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 10;
    const padRight = 65;
    const padTop = 10;
    const padBottom = 10;
    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    const closes = this.candles.map(c => c.close);
    const rsi = this.calcRSI(closes, 14);

    const getX = index => padLeft + (index + 0.5) * (chartWidth / this.candles.length);
    const getY = val => padTop + (1 - val / 100) * chartHeight;

    // Overbought (70) and Oversold (30) levels
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 1;

    // 70 level
    ctx.beginPath();
    ctx.moveTo(padLeft, getY(70));
    ctx.lineTo(width - padRight, getY(70));
    ctx.stroke();

    // 30 level
    ctx.beginPath();
    ctx.moveTo(padLeft, getY(30));
    ctx.lineTo(width - padRight, getY(30));
    ctx.stroke();

    // RSI shaded ribbon (30-70)
    ctx.fillStyle = isDark ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.05)';
    ctx.fillRect(padLeft, getY(70), chartWidth, getY(30) - getY(70));

    // Axis values
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RSI 70', width - padRight + 6, getY(70) + 3);
    ctx.fillText('RSI 30', width - padRight + 6, getY(30) + 3);

    // RSI Curve
    ctx.beginPath();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.8;
    let started = false;
    for (let i = 0; i < rsi.length; i++) {
      if (rsi[i] !== null) {
        const x = getX(i);
        const y = getY(rsi[i]);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Latest RSI reading badge
    const latestRSI = rsi[rsi.length - 1];
    if (latestRSI !== null && latestRSI !== undefined) {
      ctx.fillStyle = '#8b5cf6';
      ctx.fillText(`RSI(14): ${latestRSI.toFixed(1)}`, padLeft + 6, 16);
    }
  }

  // MACD Oscillator Subchart Canvas
  renderMACD() {
    if (!this.macdCanvas || !this.macdCtx || this.candles.length === 0) return;
    const { width, height } = this.scaleCanvas(this.macdCanvas, this.macdCtx);
    const ctx = this.macdCtx;

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.fillStyle = isDark ? '#0d131f' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 10;
    const padRight = 65;
    const padTop = 10;
    const padBottom = 10;
    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    const closes = this.candles.map(c => c.close);
    const macd = this.calcMACD(closes);

    // Find min & max across macdLine, signalLine, histogram
    let maxVal = -Infinity;
    let minVal = Infinity;
    for (let i = 0; i < closes.length; i++) {
      const h = macd.histogram[i];
      const m = macd.macdLine[i];
      const s = macd.signalLine[i];
      if (h !== null) { maxVal = Math.max(maxVal, h); minVal = Math.min(minVal, h); }
      if (m !== null) { maxVal = Math.max(maxVal, m); minVal = Math.min(minVal, m); }
      if (s !== null) { maxVal = Math.max(maxVal, s); minVal = Math.min(minVal, s); }
    }

    const margin = Math.max(Math.abs(maxVal), Math.abs(minVal)) * 1.2 || 1;
    const range = margin * 2;
    const getX = index => padLeft + (index + 0.5) * (chartWidth / this.candles.length);
    const getY = val => padTop + (1 - (val + margin) / range) * chartHeight;
    const candleWidth = Math.max(2, (chartWidth / this.candles.length) * 0.7);

    // Zero Line
    const zeroY = getY(0);
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();

    // Histogram Bars
    for (let i = 0; i < macd.histogram.length; i++) {
      const h = macd.histogram[i];
      if (h !== null) {
        const x = getX(i);
        const y = getY(h);
        const barH = Math.abs(y - zeroY);
        const topY = h >= 0 ? y : zeroY;
        ctx.fillStyle = h >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        ctx.fillRect(x - candleWidth / 2, topY, candleWidth, Math.max(1, barH));
      }
    }

    // MACD Fast Line (Blue)
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.6;
    let started = false;
    for (let i = 0; i < macd.macdLine.length; i++) {
      if (macd.macdLine[i] !== null) {
        const x = getX(i);
        const y = getY(macd.macdLine[i]);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Signal Line (Orange)
    ctx.beginPath();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.4;
    started = false;
    for (let i = 0; i < macd.signalLine.length; i++) {
      if (macd.signalLine[i] !== null) {
        const x = getX(i);
        const y = getY(macd.signalLine[i]);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#3b82f6';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MACD (12,26,9)', padLeft + 6, 16);
  }

  drawLineSeries(ctx, series, getX, getY, color, lineWidth = 1.5) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    let started = false;
    for (let i = 0; i < series.length; i++) {
      if (series[i] !== null) {
        const x = getX(i);
        const y = getY(series[i]);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  calcSMA(series, period) {
    const res = [];
    for (let i = 0; i < series.length; i++) {
      if (i < period - 1) { res.push(null); continue; }
      let sum = 0;
      for (let j = 0; j < period; j++) sum += series[i - j];
      res.push(sum / period);
    }
    return res;
  }

  calcEMA(series, period) {
    const res = [];
    const k = 2 / (period + 1);
    let ema = null;
    for (let i = 0; i < series.length; i++) {
      if (i < period - 1) { res.push(null); continue; }
      if (ema === null) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += series[i - j];
        ema = sum / period;
      } else {
        ema = series[i] * k + ema * (1 - k);
      }
      res.push(ema);
    }
    return res;
  }

  calcBB(closes, period = 20, mult = 2) {
    const sma = this.calcSMA(closes, period);
    const upper = [];
    const lower = [];
    for (let i = 0; i < closes.length; i++) {
      if (sma[i] === null) { upper.push(null); lower.push(null); continue; }
      let v = 0;
      for (let j = 0; j < period; j++) v += Math.pow(closes[i - j] - sma[i], 2);
      const dev = Math.sqrt(v / period);
      upper.push(sma[i] + mult * dev);
      lower.push(sma[i] - mult * dev);
    }
    return { upper, lower };
  }

  calcRSI(closes, period = 14) {
    const res = [];
    if (closes.length <= period) return new Array(closes.length).fill(null);
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    let avgG = gains / period, avgL = losses / period;
    for (let i = 0; i < period; i++) res.push(null);
    let rs = avgL === 0 ? 100 : avgG / avgL;
    res.push(100 - (100 / (1 + rs)));

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const g = diff > 0 ? diff : 0;
      const l = diff < 0 ? -diff : 0;
      avgG = (avgG * (period - 1) + g) / period;
      avgL = (avgL * (period - 1) + l) / period;
      rs = avgL === 0 ? 100 : avgG / avgL;
      res.push(100 - (100 / (1 + rs)));
    }
    return res;
  }

  calcMACD(closes) {
    const fastEMA = this.calcEMA(closes, 12);
    const slowEMA = this.calcEMA(closes, 26);
    const macdLine = [];
    for (let i = 0; i < closes.length; i++) {
      if (fastEMA[i] !== null && slowEMA[i] !== null) {
        macdLine.push(fastEMA[i] - slowEMA[i]);
      } else {
        macdLine.push(null);
      }
    }

    const signalLine = new Array(closes.length).fill(null);
    const histogram = new Array(closes.length).fill(null);
    const startIdx = macdLine.findIndex(v => v !== null);

    if (startIdx !== -1 && closes.length - startIdx >= 9) {
      const k = 2 / (9 + 1);
      let ema = 0;
      const s = startIdx + 8;
      let sum = 0;
      for (let j = 0; j < 9; j++) sum += macdLine[startIdx + j];
      ema = sum / 9;
      signalLine[s] = ema;
      histogram[s] = macdLine[s] - signalLine[s];

      for (let i = s + 1; i < closes.length; i++) {
        ema = macdLine[i] * k + ema * (1 - k);
        signalLine[i] = ema;
        histogram[i] = macdLine[i] - signalLine[i];
      }
    }
    return { macdLine, signalLine, histogram };
  }
}

// Sparkline SVG helper
function generateSparklineSvg(series, isPositive, width = 90, height = 24) {
  if (!series || series.length < 2) return '';
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  const points = series.map((val, idx) => {
    const x = ((idx / (series.length - 1)) * (width - 6) + 3).toFixed(1);
    const y = ((1 - (val - min) / range) * (height - 6) + 3).toFixed(1);
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  const firstX = 3;
  const lastX = width - 3;
  const bottomY = height - 1;
  const polyPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="sparkline-svg">
      <polygon points="${polyPoints}" fill="${fillColor}" />
      <polyline points="${points}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

window.TechnicalChart = TechnicalChart;
window.generateSparklineSvg = generateSparklineSvg;
