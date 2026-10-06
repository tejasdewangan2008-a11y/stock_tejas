# Master NSE Stock Catalog & Search Engine Fix Walkthrough

## What Was Resolved

### 1. Root Cause: Broken Master NSE Stock Catalog Loading
- **BOM Error in `nse-master.json`**: The file had a UTF-8 Byte Order Mark (`\uFEFF`) which caused `JSON.parse` in [segments.js](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/segments.js) to throw a silent `SyntaxError: Unexpected token '﻿'` during server startup.
- **Consequence**: The catalog remained stuck at only 189 stocks, missing over 2,400 NSE equities (including `KEC`, `KECL`, `RKEC`, etc.).
- **Fuzzy Match Fallback Bug**: When searching or resolving `KEC`, because `KEC` wasn't loaded in the directory, `isFuzzyMatch` permitted 2 edit distances on 3-letter strings (`KEC` vs `ITC` share 'C', which has distance 2). This falsely mapped `KEC` to `ITC`!

### 2. Complete 2,633 NSE Stocks Integration
- **Sanitized `nse-master.json`**: Stripped the BOM character from disk and added `.replace(/^\uFEFF/, '')` in [segments.js](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/segments.js).
- **Supplemented with `EQUITY_L.csv`**: Loaded all active NSE companies from [EQUITY_L.csv](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/EQUITY_L.csv) into the master directory.
- **Result**: The master directory now contains **2,633 total NSE equities and indices**.

### 3. Refined Symbol Resolution & Search Scoring
- **Fixed `isFuzzyMatch`**: Restricted fuzzy matching to symbols with length $\ge 4$ with a maximum edit distance of 1. Short tickers (3 letters or fewer) never trigger fuzzy matching.
- **Search Scoring**:
  - Exact match (`sym === q`): **Score 150** (Always top ranked).
  - Prefix match (`sym.startsWith(q)`): **Score 120**.
  - Substring match: **Score 85**.
  - Expanded search limit to 30 results.
- **Verified**: Searching `KEC` now yields:
  1. `KEC` — KEC International Limited (Score 150)
  2. `KECL` — Kirloskar Electric Company Limited (Score 120)
  3. `RKEC` — RKEC Projects Limited (Score 85)

### 4. Live Search in "Add Stocks to Sector / Watchlist" Modal
- Updated [public/js/app.js](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/public/js/app.js):
  - When typing in the Add Stocks search box (`inputAddWatchlistSearch`), it debounces a call to `/api/search?q=...` so **any of the 2,633 stocks** can be searched and found.
  - Clicking **`+ Add to Sector`** or **`+ Add`** adds the stock and initiates an on-demand quote fetch (`/api/stock/:symbol`) if it wasn't pre-cached.

### 5. Fast & Safe Server Background Sync
- Optimized `refreshAllStocks` in [market-service.js](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/market-service.js): Instead of attempting to query 2,600 stocks concurrently on Yahoo Finance (which leads to rate-limiting), the server syncs the active ~150 core sectors and indices, while all other stocks are fetched and cached **on-demand**.

### 6. Cache Purge & Version Bump
- Bumped Service Worker in [public/sw.js](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/public/sw.js) to `v22`.
- Bumped client script versions in [public/index.html](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/public/index.html) to `?v=4.8`.

---

## 7. Real Live Quotes & Recent Stock Prices Fix

### Root Causes of Stale / Incorrect Prices:
1. **Startup Race Condition & Sticky Fallbacks**: On startup, when client loaded `/api/sectors` and `/api/watchlists` before Yahoo finished polling, `generateCalibratedStockFallback()` created simulated quotes and stored them in `stocksMap`. Subsequent calls to `/api/stock/:symbol` saw the stock in `stocksMap` and returned the mock quote without fetching fresh data.
2. **Delisted & Renamed Tickers**:
   - `TATAMOTORS`: Delisted in late 2025 following corporate demerger; split into `TMPV.NS` (Tata Motors Passenger Vehicles) and `TMCV.NS`.
   - `ZOMATO`: Rebranded in 2025 to `ETERNAL.NS` (Eternal Ltd).
   - `CASTROL`: Needed NSE ticker `CASTROLIND.NS`.
   - `HAPPSSTMNDS`: Fixed typo to `HAPPSTMNDS.NS`.
   - `KARURVYSYA`: Was mispointing to Karnataka Bank (`KTKBANK.NS`); now correctly points to `KARURVYSYA.NS`.
   - Stale index tickers (`MIDCPNIFTY`, `NIFTYPSUBANK`, `NIFTYCPSE`, etc.) now map to active Yahoo symbols.
3. **US ADR USD Contamination**: Fallback candidates previously tested plain symbols without `.NS`, which caused stocks with American Depositary Receipts on the NYSE (such as `INFY` trading in USD at $10.64) to overwrite INR prices.
4. **WebSocket Sync Gap & Missing Refresh Route**:
   - Periodic quotes sync skipped when the market was closed, leaving after-hours and weekend users on stale data.
   - `MARKET_DATA_UPDATE` omitted `sectors` and `watchlists`, and client did not re-fetch.
   - `btnManualRefresh` on Dashboard did not fetch new market provider quotes.

### Changes Applied:
- **`segments.js`**: Updated all index and constituent stock tickers to current NSE Yahoo symbols.
- **`market-service.js`**:
  - Added priority aliasing for `TMPV.NS`, `ETERNAL.NS`, `CASTROLIND.NS`, `HAPPSTMNDS.NS`, `KARURVYSYA.NS`.
  - Added strict currency guard rejecting `USD` quotes for Indian NSE equities.
  - Set `isFallback: true` and `lastFetchedAt: 0` on fallbacks; enqueued background quote fetches whenever a fallback is encountered.
  - Added `ensureStock(symbol)` to guarantee valid quote retrieval.
  - Chunked `refreshAllStocks()` with `AbortSignal.timeout(6500)`.
- **`server.js`**:
  - Updated `/api/stock/:symbol`, depth, derivatives, and AI momentum endpoints to dynamically fetch if `!stock || stock.isFallback || Date.now() - stock.lastFetchedAt > 60000`.
  - Updated `/api/market/refresh` to poll quotes and broadcast `{ type: 'MARKET_REFRESHED', sectors, watchlists, stocks, marketStatus }`.
  - Ensured startup quote sync broadcasts to all connected clients upon completion.
  - Sync interval now runs when market is open or data is older than 5 minutes.
  - Updated default watchlist to active NSE tickers: `RELIANCE`, `TCS`, `HDFCBANK`, `INFY`, `ICICIBANK`, `SBIN`, `TMPV`, `TITAN`, `APOLLOHOSP`, `ETERNAL`, `SUZLON`, `BEL`.
- **`public/js/dashboard.js` & `public/js/app.js`**:
  - `btnManualRefresh` now triggers `POST /api/market/refresh` before re-running scans.
  - `applyMarketDataUpdate` reloads watchlist data if sectors/watchlists are not present in the payload.
  - Bumped asset cache versions.
