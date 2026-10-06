# TejStockAI Scan Builder — Advanced Upgrade Plan

> **Goal**: Rebuild the Scan Builder to match Chartink's screener feature-for-feature, then add advanced features that go **beyond** Chartink.

---

## What Chartink Has (That We Need)

After analyzing https://chartink.com/screener, here are the key features:

| Feature | Chartink | TejStockAI (Current) | Status |
|---------|----------|---------------------|--------|
| Scan categories filter sidebar | ✅ 9 categories | ❌ None | **MISSING** |
| 27+ market segments/watchlists | ✅ Full NSE coverage | ⚠️ Only 6 segments | **PARTIAL** |
| Filter period offsets (e.g. "1 day ago") | ✅ | ❌ | **MISSING** |
| Auto-explain tooltip on fields | ✅ | ❌ | **MISSING** |
| Field comment annotations | ✅ | ❌ | **MISSING** |
| Chart sneak preview on hover | ✅ Mini chart popup | ❌ | **MISSING** |
| Scan likes/favorites system | ⚠️ Basic | ⚠️ Basic | **UPGRADE** |
| Duplicate/Copy scan | ✅ | ❌ | **MISSING** |
| Real-time auto-refresh results | ✅ Configurable interval | ❌ Manual only | **MISSING** |
| Result column color coding | ✅ Green/Red conditional | ⚠️ Basic | **UPGRADE** |
| Nested AND/OR condition groups | ❌ Flat only | ❌ Flat only | **NEW (Beyond)** |
| Drag-to-reorder filter rows | ❌ | ❌ | **NEW (Beyond)** |
| AI streaming filter generation | ❌ | ⚠️ Basic | **UPGRADE (Beyond)** |
| Indicator period customization | ✅ RSI(14) vs RSI(7) | ❌ Fixed periods | **MISSING** |

---

## Proposed Changes

### Component 1: HTML Structure Overhaul

#### [MODIFY] [index.html](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/public/index.html)

**Scan Dashboard Directory (Page 1) Enhancements:**
- Add **Scan Categories sidebar** with 9 Chartink categories: `Candlestick Patterns`, `Range Breakouts`, `Fundamental Scans`, `Bullish scan`, `Bearish scan`, `Intraday Bullish scan`, `Intraday Bearish scan`, `Crossover`, `Other Scans`
- Add **"Showing X of Y scans"** count badge
- Add **sort controls** on table headers (Name ↕, Created On ↕)
- Add **Duplicate** button in the ACTIONS column alongside Share/Edit/Delete
- Add **Likes counter** badge (`❤️ 12`) next to scan names
- Add **Chart Sneak preview container** (hidden popup that shows mini chart on row hover)

**Scanner Detail View (Page 2/3/4) Enhancements:**
- Expand **segment selector** from 6 to 27+ segments matching Chartink's full list: `all indices`, `Banknifty`, `broad indices`, `ETFs`, `futures`, `Gold ETFs`, `g-sec bonds`, `Midcap 50`, `nifty 100`, `nifty 200`, `nifty 50`, `nifty 500`, `nifty 500 multicap`, `nifty large midcap 250`, `nifty microcap 250`, `nifty midcap 100/150/50`, `nifty next 50`, `nifty smallcap 50/100/250`, `Silver ETFs`, `F&O`
- Add **period offset selector** in each filter row (e.g., `( 0 )` = today, `( 1 )` = 1 day ago)
- Add **indicator period customization** — e.g., `RSI( )` where user types 14, 7, 21
- Add **auto-explain icon** (💡) that shows tooltip describing what the indicator does
- Add **field comment icon** (💬) to annotate individual filter rows
- Add **drag handle** (⠿) on each filter row for drag-to-reorder
- Add **sub-condition group** button ("+ Add sub-group") for nested AND/OR logic
- Add **Auto-Refresh toggle** with interval selector (5s, 10s, 30s, 60s, Off)
- Add **"Duplicate Scan"** button in the action toolbar

---

### Component 2: JavaScript Logic Upgrade

#### [MODIFY] [query-builder.js](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/public/js/query-builder.js)

**Major additions:**

1. **Scan Categories** — Add `scanCategories` array matching Chartink's 9 categories; filter directory table by category
2. **27+ Segments** — Full NSE segment list in `availableSegments` array
3. **Period Offset** — Each filter row gets a `periodOffset` field (0 = today, 1 = yesterday, etc.)
4. **Indicator Period Customization** — Indicators like RSI, SMA, EMA get configurable period fields (e.g., `rsi` with `period: 14`)
5. **Drag-to-Reorder** — HTML5 drag-and-drop on `.filter-row` elements
6. **Sub-Condition Groups** — Nested filter structure: `{ type: 'group', logic: 'AND'|'OR', children: [...filters] }`
7. **Chart Sneak Preview** — On row hover, fetch mini sparkline data and render tooltip popup
8. **Auto-Explain Tooltips** — `indicatorDescriptions` map providing human-readable explanations for each indicator
9. **Auto-Refresh** — `setInterval`-based scan re-execution with configurable frequency
10. **Duplicate Scan** — Deep-clone a scan definition and add to `allScans` with new ID
11. **Enhanced Magic AI** — Streaming animation effect during filter generation; more NLP patterns
12. **Scan Likes** — Toggle like/unlike with `likedByUser` state and `totalLikes` counter
13. **Sort Directory** — Sortable columns (Name A→Z, Created newest/oldest)

**Enhanced filter row structure:**
```javascript
{
  timeframe: 'Daily',
  left: 'rsi',
  leftPeriod: 14,        // NEW: configurable indicator period
  leftOffset: 0,         // NEW: period offset (0=today, 1=1 day ago)
  op: 'crosses_above',
  rightType: 'number',
  right: 60,
  rightPeriod: null,      // NEW: for indicator-vs-indicator comparison
  rightOffset: 0,         // NEW
  comment: '',            // NEW: field annotation
}
```

---

### Component 3: CSS Styling

#### [MODIFY] [style.css](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/public/css/style.css)

- Add `.scan-categories-sidebar` with purple-accented category pills
- Add `.chart-sneak-popup` absolutely positioned mini-chart container
- Add `.drag-handle` and `.filter-row.dragging` drag state styles
- Add `.sub-condition-group` nested box with indented border
- Add `.auto-explain-tooltip` floating tooltip bubble
- Add `.field-comment-bubble` annotation indicator
- Add `.auto-refresh-control` toggle with interval dropdown
- Add `.scan-count-badge` showing "Showing X of Y"
- Add `.sort-arrow` indicator on sortable table headers
- Add `.likes-badge` heart counter on scan rows

#### [MODIFY] [mobile.css](file:///c:/Users/TEJAS%20KUMAR%20DEWANGAN/OneDrive/Desktop/New%20folder/public/css/mobile.css)

- Make scan categories sidebar collapse into horizontal scrollable pills on mobile
- Ensure drag-to-reorder works with touch events
- Stack filter row controls vertically on small screens

---

## Features Beyond Chartink (Advanced)

These features don't exist in Chartink and make TejStockAI **superior**:

| Feature | Description |
|---------|-------------|
| 🧠 **Nested AND/OR Groups** | Chartink only supports flat "ALL/ANY" — we add sub-groups |
| 🔀 **Drag-to-Reorder Filters** | Chartink has no drag reordering |
| ✨ **AI Streaming Animation** | Magic AI shows a typewriter effect as filters are generated |
| 📊 **Chart Sneak on Hover** | Mini-chart preview appears when hovering scan table rows |
| ⏱️ **Auto-Refresh Results** | Results auto-refresh at configurable intervals |
| 📐 **Indicator Period Customization** | Change RSI from 14 to 7 or 21 directly in the filter row |
| 💬 **Field Comments** | Annotate individual filter rows with notes |

---

## Verification Plan

### Automated Tests
- `node server.js` — verify server starts without errors

### Manual Verification
1. Open `http://localhost:3000`, navigate to **Scan Builder**
2. Verify **Scan Categories** sidebar filters the directory table
3. Verify **27+ segments** appear in the segment dropdown
4. Click a scan name → verify detail view opens with enhanced filter rows
5. Test **drag-to-reorder** filter rows
6. Test **"+ Add sub-group"** for nested AND/OR conditions
7. Test **period offset** selector in filter rows
8. Test **indicator period** customization (change RSI 14 → 7)
9. Hover a directory row → verify **chart sneak preview** popup
10. Test **auto-refresh** toggle with interval
11. Test **Duplicate Scan** button
12. Test **Magic AI** with streaming animation
13. Test on mobile viewport for responsive layout
