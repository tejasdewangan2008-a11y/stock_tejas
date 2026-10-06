# TejStockAI - Real-Time Stock Screener, TradingView Charts & Broker AI Copilot

A next-generation financial intelligence platform, multi-stage Chartink-style screener, TradingView-grade charting engine, and full Broker AI Copilot combining market depth, options matrix, and technical indicators found across **Zerodha Kite, Angel One, Upstox, and Dhan**, designed for **Windows** and **Android** simultaneously.

---

## 🚀 Key Features Overview

### 1. 🤖 TejStockAI Market Terminal & All-Broker AI Copilot
- **Zerodha Kite Level 2 Market Depth**: 5-level Bid/Ask real-time order book, buy/sell ratio bar, upper/lower circuit limits (10%/20%), VWAP, and delivery volume percentage.
- **Dhan Option Chain Matrix**: Full strike matrix, Call/Put Open Interest (OI), Put-Call Ratio (PCR), Max Pain calculation, and ATM strike detection.
- **Angel One & Upstox Analytics**: SmartScore technical health rating, volume multipliers, and F&O OI buildup analysis (Long Buildup, Short Covering, etc.).
- **FII / DII Institutional Flows**: Daily net cash buy/sell figures, index futures long-short ratio, and market sentiment bias.
- **Interactive Multi-Turn AI Chatbox**: Ask complex queries like `"Compare RELIANCE vs TCS"`, `"Show option chain PCR and Max pain"`, or `"Intraday stop loss for HDFCBANK"`.

### 2. 🔍 Universal NSE Stock Search Engine
- Search across any NSE stock, index (`NIFTY 50`, `BANK NIFTY`, `FINNIFTY`, `SENSEX`), equity or ticker with instant fuzzy matching (e.g. `APOLO` -> `APOLLO`, `TITAN`, `SUZLON`, `TATA`).
- Press **`/`** or **`Ctrl + K`** to jump straight to the search bar from anywhere.
- **Dynamic On-The-Fly Ingestion**: Automatically fetches real-time market data and historical candles for any symbol.

### 3. 📈 TradingView-Style Multi-Timeframe Interactive Charting
- **Timeframes**: `1m`, `5m`, `15m`, `30m`, `1h`, `1D`, `1W`, `1M`, `1Y`.
- **Chart Styles**: 🕯️ Candlesticks, 📈 Line Chart, ⛰️ Mountain / Area Chart.
- **Technical Overlays & Subcharts**:
  * Moving Averages (SMA 20, SMA 50, SMA 200, EMA 9, EMA 20, EMA 50, EMA 200)
  * Bollinger Bands (20, 2)
  * VWAP (Volume Weighted Average Price)
  * RSI (14) with 30-70 dynamic ribbon
  * MACD (12, 26, 9) with positive/negative color-coded Histogram
  * Volume Subchart with institutional 10D SMA multiplier
- **Interactive Crosshair**: Live OHLC floating box and date/time tracking with touch support on Android.

### 4. 🛠️ Advanced 4-Stage Scan Builder (Chartink Parity & Beyond)
- **Page 1: Scan Dashboard Directory**:
  - Browse pre-built classic scans (`Khoj`, `RSI 30`, `Low price`, `RSI 60`, `Bullish Breakout`, `Golden Cross`).
  - Search scans, filter by favorites or tags, toggle live chart previews.
- **Page 2: Visual Clause Builder & AI Suite**:
  - Build multi-timeframe conditions with dropdowns and operators (`>`, `<`, `>=`, `<=`, `=`, `Crosses Above`, `Crosses Below`, `Contains`).
  - **Multi-Bar Offset Indexing**: Compare indicators across previous candles (`[0] Latest`, `[-1] 1 bar ago`, `[-2] 2 bars ago`, `[-3] 3 bars ago`, `[-5] 5 bars ago`, `[-10] 10 bars ago`).
  - **Complete 29 Chartink Segments & Searchable Modal**: Full universe selection matching Chartink (`cash`, `all indices`, `Banknifty`, `broad indices`, `ETFs`, `futures`, `Gold ETFs`, `Silver ETFs`, `g-sec bonds`, `Midcap 50`, `minor indices`, `nifty 100`, `nifty 200`, `nifty 50`, `nifty 500`, `nifty 500 multicap 50:25:25`, `nifty and banknifty`, `nifty large midcap 250`, `nifty microcap 250`, `nifty midcap 100`, `nifty midcap 150`, `nifty midcap 50`, `nifty midcap select`, `nifty mid smallcap 400`, `nifty next 50`, `nifty smallcap 100`, `nifty smallcap 250`, `nifty smallcap 50`, `watchlist`) with 183+ real NSE instruments, live stock counts, and instant search filtering.
  - **Nested Filter Groups**: Create parenthetical multi-group logic `(Group 1: ALL/ANY) OR (Group 2: ALL/ANY)` with connector pills.
  - **New Indicators Supported**: VWAP, ATR(14), ADX(14 with +DI/-DI), Standard Pivot Points (S1/S2/S3/R1/R2/R3), Camarilla Pivots (H3/H4/L3/L4), Stochastic Oscillator (%K/%D), Ichimoku Cloud (Tenkan/Kijun).
- **Page 3: Live STOCKS Results Grid**:
  - Live prices, % changes, volume shockers, technical tags, and sparkline trend charts.
  - Export to CSV, Excel, or Copy to clipboard.
  - One-Click Broker Quick-Trade links for **Zerodha Kite**, **Dhan**, **Upstox**, and **Angel One**.
- **Page 4: 9-Month Backtest History Canvas**:
  - Chronological frequency distribution across 9 months color-coded by industry sector.

### 5. 🔮 AI Assistant Suite
- **Tab 1: AI NLP Builder**: Type your strategy in plain English (*"Bullish engulfing with volume surge and RSI oversold bounce"*) and watch the streaming AI generate mathematical clauses.
- **Tab 2: AI Scan Insights**: 4 animated circular ring gauges (*Momentum Score*, *Trend Health*, *Risk Profile*, *Signal Quality*), actionable recommendations with 1-click **"⚡ Apply This"** buttons, and automatic plain-English strategy summaries.
- **Tab 3: AI Copilot Chat**: Scan-aware assistant that answers questions about timeframe suitability, risk management, and false signal reduction.

### 6. ⚡ Live Alert Dispatcher (Telegram & Webhook Engine)
- **Telegram Bot Integration**: Delivers instant stock match notifications directly to your private Telegram chat or channel.
- **Automated Webhooks**: Sends structured JSON payloads to Tradetron, Python algo bots, or broker APIs.
- **Test Sandbox**: Integrated live test buttons (`Send Test Message` & `Send Test Payload`) to verify API credentials and endpoints.

### 7. 📱 Simultaneous Windows & Phone Access (Mobile Data & Wi-Fi)
- Works seamlessly on Windows and any smartphone (Android / iOS) over **Mobile Data (4G/5G)** or local Wi-Fi.
- Click **"Phone / Connect"** in the top navigation bar to open the connection modal.
  - **🌐 Mobile Data (Any Network)**: Direct Cloudflare Tunnel (Global CDN) — **Zero passwords or login needed**. Simply scan the QR code with your phone camera on mobile data to open!
  - **📶 Same Wi-Fi (Local LAN)**: Connect when both PC and phone are on the same Wi-Fi router.

---

## ⚡ How to Run

1. Double-click **`start-screener.bat`** or run:
   ```bash
   node server.js
   ```
2. Open in your browser:
   - **Windows (Local)**: [http://localhost:3000](http://localhost:3000)
   - **Phone over Mobile Data**: Scan the **🌐 Mobile Data** QR code directly from your phone camera!
   - **Phone over Same Wi-Fi**: Scan the **📶 Same Wi-Fi** QR code or visit `http://<YOUR_LOCAL_IP>:3000`
## 🔄 Cache Refresh After Updates

When you deploy a new version of the app, the service worker caches old assets. To ensure you get the latest UI and scripts:

1. Open the app in Chrome (or your mobile browser).
2. Press **Ctrl + Shift + Delete** → Clear **Cached images and files**.
3. Reload the page (F5) or close and reopen the PWA.
4. Alternatively, run this script in the browser console:

```javascript
caches.keys().then(k=>Promise.all(k.map(c=>caches.delete(c)))).then(()=>location.reload(true));
```

After clearing the cache, all buttons (including the AI Momentum modal) will respond correctly.
