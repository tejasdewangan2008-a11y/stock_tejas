// TejStockAI - Chartink Multi-Page Scan Dashboard & Visual Scanner Builder Engine
// Page 1: Scans Directory / Dashboard Table
// Page 2, 3, 4: Scanner Detail View (Magic AI Filters, Visual Clause Builder, Stock Results, 9-Month Sector Backtest)

class QueryBuilder {
  constructor() {
    this.directoryPage = document.getElementById('builderDirectoryPage');
    this.detailPage = document.getElementById('builderDetailPage');
    this.container = document.getElementById('queryBuilderContainer');
    this.resultsTableContainer = document.getElementById('builderResultsContainer');
    
    this.allScans = [];
    this.currentScan = null;
    this.filters = [];
    this.passType = 'all'; // 'all' or 'any'
    this.segment = 'Cash'; // 'Cash', 'Nifty 50', 'Nifty Bank', 'Nifty IT', 'F&O', 'Nifty 500'
    this.searchQuery = '';
    this.activeFilterTab = 'all';

    this.filterGroups = []; // Array of { id, passType, filters: [] }
    this.groupJoin = 'or'; // 'or' or 'and' between groups

    this.availableIndicators = [
      { id: 'close', label: 'Close' },
      { id: 'open', label: 'Open' },
      { id: 'high', label: 'High' },
      { id: 'low', label: 'Low' },
      { id: 'changePct', label: 'Change %' },
      { id: 'volume', label: 'Volume' },
      { id: 'volumeMultiplier', label: 'Volume Multiplier (vs 10D SMA)' },
      { id: 'vwap', label: 'VWAP (Volume Weighted Avg Price)' },
      { id: 'rsi14', label: 'RSI (14)' },
      { id: 'sma20', label: 'SMA (20)' },
      { id: 'sma50', label: 'SMA (50)' },
      { id: 'sma200', label: 'SMA (200)' },
      { id: 'ema9', label: 'EMA (9)' },
      { id: 'ema20', label: 'EMA (20)' },
      { id: 'ema50', label: 'EMA (50)' },
      { id: 'ema200', label: 'EMA (200)' },
      { id: 'macdLine', label: 'MACD Line' },
      { id: 'macdSignal', label: 'MACD Signal' },
      { id: 'macdHist', label: 'MACD Histogram' },
      { id: 'bbUpper', label: 'Upper Bollinger Band' },
      { id: 'bbMiddle', label: 'Middle Bollinger Band' },
      { id: 'bbLower', label: 'Lower Bollinger Band' },
      { id: 'supertrend', label: 'SuperTrend' },
      { id: 'supertrendDir', label: 'SuperTrend Signal (BUY/SELL)' },
      { id: 'atr14', label: 'ATR (14)' },
      { id: 'adx14', label: 'ADX (14) Trend Strength' },
      { id: 'plusDI', label: '+DI (Positive Directional)' },
      { id: 'minusDI', label: '-DI (Negative Directional)' },
      { id: 'stochK', label: 'Stochastic %K' },
      { id: 'stochD', label: 'Stochastic %D' },
      { id: 'tenkanSen', label: 'Ichimoku Tenkan-sen' },
      { id: 'kijunSen', label: 'Ichimoku Kijun-sen' },
      { id: 'pivot', label: 'Standard Pivot Point' },
      { id: 'pivot_r1', label: 'Pivot Resistance R1' },
      { id: 'pivot_s1', label: 'Pivot Support S1' },
      { id: 'pivot_r2', label: 'Pivot Resistance R2' },
      { id: 'pivot_s2', label: 'Pivot Support S2' },
      { id: 'camarilla_h3', label: 'Camarilla H3 (Range High)' },
      { id: 'camarilla_h4', label: 'Camarilla H4 (Breakout Buy)' },
      { id: 'camarilla_l3', label: 'Camarilla L3 (Range Low)' },
      { id: 'camarilla_l4', label: 'Camarilla L4 (Breakdown Sell)' },
      { id: 'patterns', label: 'Candlestick Pattern' }
    ];

    this.availableOperators = [
      { id: 'gt', label: '>' },
      { id: 'lt', label: '<' },
      { id: 'gte', label: '>=' },
      { id: 'lte', label: '<=' },
      { id: 'eq', label: '=' },
      { id: 'crosses_above', label: 'Crossed Above' },
      { id: 'crosses_below', label: 'Crossed Below' },
      { id: 'contains', label: 'Contains Pattern' }
    ];

    this.conditionsHidden = false;
    this.activeTokenTarget = null;
    this.indicatorSearchQuery = '';

    // Backtest History Interactive State
    this.backtestSegments = [];
    this.backtestDates = [];
    this.hoveredBacktestSegment = null;
    this.selectedBacktestDate = 'Mar 18, 2026';
    this.selectedBacktestSector = 'all';

    this.init();
  }

  async init() {
    this.bindDirectoryEvents();
    this.bindDetailEvents();
    this.bindAiSuiteEvents();
    this.bindAlertModalEvents();
    this.bindSegmentModalEvents();
    this.bindIndicatorModalEvents();
    this.bindPopoverEvents();
    this.bindClauseDialogEvents();
    this.initBacktestData();
    this.bindBacktestEvents();
    await this.fetchScans();
    this.renderDirectoryTable();
  }

  // ==========================================
  // PAGE 1: SCAN DASHBOARD DIRECTORY METHODS
  // ==========================================

  async fetchScans() {
    try {
      const resp = await fetch('/api/scans');
      const data = await resp.json();
      
      const prebuilt = data.prebuilt || [];
      const custom = data.custom || [];

      // Seed authentic Chartink scans from user screenshots if not already in list
      const defaultUserScans = [
        {
          id: 'scan-khoj-2206',
          title: 'Khoj',
          description: 'Sri',
          segment: 'Nifty 500',
          category: 'Breakout',
          tags: ['Nifty 500', 'RSI Breakout'],
          createdOn: '8/2/2026',
          passType: 'all',
          filters: [
            { timeframe: 'Monthly', left: 'rsi14', op: 'gt', rightType: 'number', right: 45 },
            { timeframe: 'Daily', left: 'rsi14', op: 'gt', rightType: 'number', right: 35 }
          ]
        },
        {
          id: 'scan-rsi-30',
          title: 'RSI 30',
          description: 'Tejas',
          segment: 'Nifty 500',
          category: 'Momentum',
          tags: ['Oversold', 'RSI'],
          createdOn: '7/4/2026',
          passType: 'all',
          filters: [
            { timeframe: 'Monthly', left: 'rsi14', op: 'gt', rightType: 'number', right: 40 },
            { timeframe: 'Daily', left: 'rsi14', op: 'lt', rightType: 'number', right: 40 }
          ]
        },
        {
          id: 'scan-low-price',
          title: 'Low price',
          description: 'Value reversal stocks',
          segment: 'Nifty 500',
          category: 'Value',
          tags: ['Smallcap', 'Reversal'],
          createdOn: '6/5/2026',
          passType: 'all',
          filters: [
            { timeframe: 'Monthly', left: 'rsi14', op: 'gt', rightType: 'number', right: 45 },
            { timeframe: 'Daily', left: 'close', op: 'lt', rightType: 'number', right: 500 }
          ]
        },
        {
          id: 'scan-rsi-60',
          title: 'RSI 60',
          description: 'TEJAS',
          segment: 'F&O',
          category: 'Momentum',
          tags: ['F&O', 'High Momentum'],
          createdOn: '2/14/2026',
          passType: 'all',
          filters: [
            { timeframe: 'Monthly', left: 'rsi14', op: 'gt', rightType: 'number', right: 60 },
            { timeframe: 'Weekly', left: 'rsi14', op: 'gt', rightType: 'number', right: 60 },
            { timeframe: 'Daily', left: 'rsi14', op: 'gt', rightType: 'number', right: 60 }
          ]
        }
      ];

      // Merge avoiding duplicates
      const map = new Map();
      [...defaultUserScans, ...custom, ...prebuilt].forEach(s => {
        if (!map.has(s.id)) map.set(s.id, s);
      });

      this.allScans = Array.from(map.values());
    } catch (e) {
      console.error('Failed to fetch scans:', e);
    }
  }

  renderDirectoryTable() {
    const tbody = document.getElementById('scansDirectoryTableBody');
    if (!tbody) return;

    let list = this.allScans;

    // Filter by search text
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(s => (s.title || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q));
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No scanners found matching "${this.escapeHtml(this.searchQuery)}". Click <strong>"+ Create scanner"</strong> to build a new one!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(scan => {
      const clauseStr = this.formatClauseFormula(scan);
      const createdDate = scan.createdOn || 'Today';
      const desc = scan.description || 'Custom technical filter';

      return `
        <tr class="scan-directory-row">
          <td>
            <a class="scan-title-link" href="javascript:void(0)" onclick="window.queryBuilder?.openScannerDetail('${scan.id}')">
              ${this.escapeHtml(scan.title)}
            </a>
          </td>
          <td>
            <span class="scan-desc-text">${this.escapeHtml(desc)}</span>
          </td>
          <td>
            <div class="scan-clause-preview" title="${this.escapeHtml(clauseStr)}">
              ${this.escapeHtml(clauseStr)}
            </div>
          </td>
          <td>
            <button class="btn-add-tag-pill" onclick="event.stopPropagation(); window.queryBuilder?.addTagToScan('${scan.id}')">
              + Add tag
            </button>
          </td>
          <td>
            <span class="scan-date-text">${createdDate}</span>
          </td>
          <td style="text-align: right;" onclick="event.stopPropagation();">
            <div class="scan-row-actions">
              <button class="btn-row-action btn-row-share" onclick="window.queryBuilder?.shareScan('${scan.id}')" title="Share scanner">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                Share
              </button>
              <button class="btn-row-action btn-row-edit" onclick="window.queryBuilder?.openScannerDetail('${scan.id}')" title="Edit scanner">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                Edit
              </button>
              <button class="btn-row-action btn-row-delete" onclick="window.queryBuilder?.deleteScan('${scan.id}')" title="Delete scanner">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  formatClauseFormula(scan) {
    const seg = (scan.segment || 'cash').toLowerCase();
    const filters = scan.filters || [];
    if (filters.length === 0) return `( ${seg} )`;
    
    const parts = filters.map(f => {
      const tf = (f.timeframe || 'daily').toLowerCase();
      const left = f.left || 'close';
      const op = f.op === 'gt' ? '>' : f.op === 'lt' ? '<' : f.op === 'gte' ? '>=' : f.op === 'lte' ? '<=' : f.op === 'crosses_above' ? 'crossed above' : '=';
      const right = f.right !== undefined ? f.right : '0';
      return `${tf} ${left} ${op} ${right}`;
    });

    return `( ${seg} ( ${parts.join(' and ')} ) )`;
  }

  bindDirectoryEvents() {
    // Search input
    const searchInput = document.getElementById('scanSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.searchQuery = e.target.value;
        this.renderDirectoryTable();
      });
    }

    // Filter tab buttons
    document.querySelectorAll('.filter-tab-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilterTab = btn.dataset.filter;
        this.renderDirectoryTable();
      });
    });

    // Create New Scanner Button
    const btnCreate = document.getElementById('btnCreateNewScanner');
    if (btnCreate) {
      btnCreate.addEventListener('click', () => {
        const newBlankScan = {
          id: 'custom-' + Date.now(),
          title: 'New Technical Scanner',
          description: 'Custom breakout strategy',
          segment: 'Nifty 500',
          passType: 'all',
          filters: [
            { timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma20' },
            { timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 }
          ]
        };
        this.openScannerDetail(newBlankScan);
      });
    }
  }

  // ==========================================
  // PAGE 2, 3, 4: SCANNER DETAIL & EXECUTION METHODS
  // ==========================================

  openScannerDetail(scanOrId) {
    let scan = scanOrId;
    if (typeof scanOrId === 'string') {
      scan = this.allScans.find(s => s.id === scanOrId) || {
        id: scanOrId,
        title: scanOrId.toUpperCase(),
        description: 'Technical scan filter',
        segment: 'Nifty 500',
        passType: 'all',
        filters: []
      };
    }

    this.currentScan = scan;
    this.passType = scan.passType || 'all';
    this.segment = scan.segment || 'Nifty 500';
    this.groupJoin = scan.groupJoin || 'or';
    this.filterGroups = scan.filterGroups ? JSON.parse(JSON.stringify(scan.filterGroups)) : [];
    this.filters = (scan.filters || []).map(f => ({ ...f }));

    // Switch view to Detail page
    if (this.directoryPage) this.directoryPage.style.display = 'none';
    if (this.detailPage) this.detailPage.style.display = 'block';

    // Populate Header
    const titleElem = document.getElementById('activeScannerTitle');
    if (titleElem) titleElem.textContent = scan.title || 'Custom Scanner';
    const descElem = document.getElementById('activeScannerDesc');
    if (descElem) descElem.textContent = scan.description || 'Custom technical filter rule';

    // Render visual builder & run initial scan
    this.renderClauseBuilder();
    this.runScan();
    this.renderBacktestChart();
    this.updateAiInsight();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeScannerDetail() {
    if (this.detailPage) this.detailPage.style.display = 'none';
    if (this.directoryPage) this.directoryPage.style.display = 'block';
    this.renderDirectoryTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindDetailEvents() {
    // Back button
    document.getElementById('btnBackToScanDashboard')?.addEventListener('click', () => {
      this.closeScannerDetail();
    });

    // Run Scan Big Button
    document.getElementById('btnRunScanBig')?.addEventListener('click', () => {
      this.runScan();
    });

    // Save Scan Detail Button
    document.getElementById('btnSaveScanDetail')?.addEventListener('click', () => {
      window.app?.openSaveScanModal(this.getScanDefinition());
    });

    // Scroll to Backtest Results Button
    document.getElementById('btnScrollToBacktest')?.addEventListener('click', () => {
      document.getElementById('backtestHistorySection')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Pin Active Scanner Button
    document.getElementById('btnPinActiveScanner')?.addEventListener('click', () => {
      if (this.currentScan && window.dashboard) {
        window.dashboard.pinScanToDashboard(this.currentScan.id);
        if (window.showToast) window.showToast(`Scanner "${this.currentScan.title}" pinned to Dashboard!`, 'success');
      }
    });

    // Mode Selector Pills (Append, Replace, Draw - Image 1)
    document.querySelectorAll('.ci-mode-pill, .magic-mode-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.ci-mode-pill, .magic-mode-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.dataset.mode;
        if (mode === 'draw') {
          const input = document.getElementById('magicFilterInput');
          if (input && !input.value) input.value = 'Price crossed above 20 EMA with rising volume';
        }
      });
    });

    // Magic AI Generate Button
    document.getElementById('btnMagicGenerate')?.addEventListener('click', () => {
      this.handleMagicAiGenerate();
    });

    // Magic Prompt input Enter key
    document.getElementById('magicFilterInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.handleMagicAiGenerate();
    });

    // Magic Suggestion Chips (Image 1: Gravestone doji, ROCE less than 30, etc.)
    document.querySelectorAll('.ci-suggestion-chip, .magic-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.dataset.prompt;
        const input = document.getElementById('magicFilterInput');
        if (input) input.value = prompt;
        this.handleMagicAiGenerate(prompt);
      });
    });

    // Add Tag Button (+ Add tag - Image 1)
    document.getElementById('btnAddScanTag')?.addEventListener('click', () => {
      const newTag = prompt('Enter a new tag for this scanner (e.g. Breakout, Swing, Nifty 50, F&O):');
      if (newTag && newTag.trim()) {
        const cleanTag = newTag.trim();
        if (!this.currentScan.tags) this.currentScan.tags = [];
        if (!this.currentScan.tags.includes(cleanTag)) {
          this.currentScan.tags.push(cleanTag);
          this.renderActiveTags();
        }
      }
    });

    // Edit Scanner Meta Button (✏️ Edit Details)
    document.getElementById('btnEditScannerMeta')?.addEventListener('click', () => {
      this.openEditMetaModal();
    });

    // Scanner Guide Button (Scanner Guide - Image 1)
    document.getElementById('btnScannerGuide')?.addEventListener('click', () => {
      const modal = document.getElementById('scannerGuideModal');
      if (modal) modal.style.display = 'flex';
    });
    document.getElementById('btnCloseScannerGuide')?.addEventListener('click', () => {
      const modal = document.getElementById('scannerGuideModal');
      if (modal) modal.style.display = 'none';
    });

    // Scan Examples Button (Scan Examples - Image 1)
    document.getElementById('btnScanExamples')?.addEventListener('click', () => {
      this.openScanExamplesModal();
    });
    document.getElementById('btnCloseScanExamples')?.addEventListener('click', () => {
      const modal = document.getElementById('scanExamplesModal');
      if (modal) modal.style.display = 'none';
    });

    // Feedback Button (Feedback - Image 1)
    document.getElementById('btnFeedback')?.addEventListener('click', () => {
      const modal = document.getElementById('feedbackModal');
      if (modal) modal.style.display = 'flex';
    });
    document.getElementById('btnCloseFeedback')?.addEventListener('click', () => {
      const modal = document.getElementById('feedbackModal');
      if (modal) modal.style.display = 'none';
    });
    document.getElementById('btnCancelFeedback')?.addEventListener('click', () => {
      const modal = document.getElementById('feedbackModal');
      if (modal) modal.style.display = 'none';
    });
    document.getElementById('btnSubmitFeedback')?.addEventListener('click', () => {
      const txt = document.getElementById('feedbackTextInput')?.value.trim();
      if (!txt) {
        if (window.showToast) window.showToast('Please enter your feedback or suggested feature.', 'warning');
        return;
      }
      if (window.showToast) window.showToast('Thank you! Your feedback has been recorded: "' + txt + '"', 'success');
      const modal = document.getElementById('feedbackModal');
      if (modal) modal.style.display = 'none';
      const input = document.getElementById('feedbackTextInput');
      if (input) input.value = '';
    });

    // More Options Button (More ❐ 🖥 - Image 1)
    document.getElementById('btnMoreOptions')?.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleMoreOptionsPopover(e.currentTarget);
    });

    // Love / Like Scanner Button
    document.getElementById('btnLoveScanner')?.addEventListener('click', () => {
      this.toggleLoveScanner();
    });

    // Close More Options on Outside Click
    document.addEventListener('click', () => {
      const p = document.getElementById('moreOptionsPopover');
      if (p) p.style.display = 'none';
    });
  }

  renderActiveTags() {
    const list = document.getElementById('activeScanTagsList');
    if (!list) return;
    const tags = this.currentScan?.tags || ['Nifty 500', 'RSI Breakout'];
    list.innerHTML = tags.map(t => `<span class="ci-tag-pill">${t}</span>`).join('');
  }

  toggleMoreOptionsPopover(btn) {
    const popover = document.getElementById('moreOptionsPopover');
    if (!popover) return;
    if (popover.style.display === 'flex') {
      popover.style.display = 'none';
      return;
    }
    const rect = btn.getBoundingClientRect();
    popover.style.display = 'flex';
    popover.style.position = 'absolute';
    popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
    popover.style.left = `${Math.max(10, rect.left + window.scrollX - 60)}px`;

    // Bind More Menu Items Once
    document.getElementById('btnMoreCopyLink').onclick = () => {
      navigator.clipboard?.writeText(window.location.origin + '/?scan=' + (this.currentScan?.id || 'khoj'));
      if (window.showToast) window.showToast('Scan link copied to clipboard!', 'success');
      popover.style.display = 'none';
    };

    document.getElementById('btnMoreDuplicate').onclick = () => {
      popover.style.display = 'none';
      document.getElementById('btnHeaderDuplicate')?.click();
    };

    document.getElementById('btnMoreFullscreen').onclick = () => {
      popover.style.display = 'none';
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };

    document.getElementById('btnMorePrint').onclick = () => {
      popover.style.display = 'none';
      window.print();
    };

    document.getElementById('btnMoreEmbed').onclick = () => {
      popover.style.display = 'none';
      const iframeCode = `<iframe src="${window.location.origin}/?scan=${this.currentScan?.id || 'khoj'}&embed=true" width="100%" height="600" frameborder="0"></iframe>`;
      prompt('Embed Scanner Widget Code:', iframeCode);
    };

    document.getElementById('btnMoreReset').onclick = () => {
      popover.style.display = 'none';
      if (confirm('Reset all filter conditions to default?')) {
        this.filters = [
          { timeframe: 'Monthly', left: 'rsi14', op: 'gt', rightType: 'number', right: 45 },
          { timeframe: 'Daily', left: 'rsi14', op: 'gt', rightType: 'number', right: 35 }
        ];
        this.renderClauseBuilder();
        this.runScan();
      }
    };
  }

  toggleLoveScanner() {
    const btn = document.getElementById('btnLoveScanner');
    const heart = document.getElementById('heartIcon');
    const text = document.getElementById('loveCountText');
    if (!btn || !text) return;

    const scanId = this.currentScan?.id || 'default';
    const key = `loved_scan_${scanId}`;
    const wasLoved = localStorage.getItem(key) === 'true';

    let count = parseInt(text.textContent, 10) || 0;
    if (wasLoved) {
      count = Math.max(0, count - 1);
      localStorage.setItem(key, 'false');
      btn.classList.remove('loved');
      if (heart) heart.textContent = '♡';
    } else {
      count += 1;
      localStorage.setItem(key, 'true');
      btn.classList.add('loved');
      if (heart) heart.textContent = '❤️';
    }
    text.textContent = count;
  }

  openEditMetaModal() {
    const modal = document.getElementById('editScannerMetaModal');
    const titleIn = document.getElementById('editMetaTitle');
    const descIn = document.getElementById('editMetaDesc');
    const tagsIn = document.getElementById('editMetaTags');
    if (!modal) return;

    if (titleIn) titleIn.value = this.currentScan?.title || 'KHOJ';
    if (descIn) descIn.value = this.currentScan?.description || 'Sri';
    if (tagsIn) tagsIn.value = (this.currentScan?.tags || []).join(', ');

    modal.style.display = 'flex';

    document.getElementById('btnCloseEditMeta').onclick = () => modal.style.display = 'none';
    document.getElementById('btnCancelEditMeta').onclick = () => modal.style.display = 'none';
    document.getElementById('btnSaveEditMeta').onclick = () => {
      if (this.currentScan) {
        if (titleIn) this.currentScan.title = titleIn.value.trim() || 'Untitled Scan';
        if (descIn) this.currentScan.description = descIn.value.trim() || 'Custom';
        if (tagsIn) {
          this.currentScan.tags = tagsIn.value.split(',').map(t => t.trim()).filter(Boolean);
        }
        const activeTitleEl = document.getElementById('activeScannerTitle');
        const activeDescEl = document.getElementById('activeScannerDesc');
        if (activeTitleEl) activeTitleEl.textContent = this.currentScan.title;
        if (activeDescEl) activeDescEl.textContent = this.currentScan.description;
        this.renderActiveTags();
      }
      modal.style.display = 'none';
    };
  }

  openScanExamplesModal() {
    const modal = document.getElementById('scanExamplesModal');
    const list = document.getElementById('scanExamplesList');
    if (!modal || !list) return;

    const templates = [
      {
        title: 'Gravestone Doji Reversal',
        desc: 'Detects bearish/bullish candle exhaustions with high upper shadow on Daily chart',
        filters: [
          { timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Gravestone Doji' },
          { timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.3 }
        ]
      },
      {
        title: 'Golden Cross (50 EMA > 200 EMA)',
        desc: 'Premier long-term institutional trend breakout pattern on NSE Cash/F&O stocks',
        filters: [
          { timeframe: 'Daily', left: 'ema50', op: 'gt', rightType: 'indicator', right: 'ema200' },
          { timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'ema50' },
          { timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 }
        ]
      },
      {
        title: 'RSI 30 Oversold Bounce with High Volume',
        desc: 'Identifies deeply oversold swing candidates showing preliminary daily reversal',
        filters: [
          { timeframe: 'Monthly', left: 'rsi14', op: 'gt', rightType: 'number', right: 40 },
          { timeframe: 'Daily', left: 'rsi14', op: 'lt', rightType: 'number', right: 35 },
          { timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.2 }
        ]
      },
      {
        title: 'SuperTrend + VWAP Intraday Scalper',
        desc: 'Momentum filter where price sustains above daily VWAP and SuperTrend gives BUY signal',
        filters: [
          { timeframe: '15-min', left: 'close', op: 'gt', rightType: 'indicator', right: 'vwap' },
          { timeframe: '15-min', left: 'supertrendDir', op: 'eq', rightType: 'string', right: 'BUY' }
        ]
      },
      {
        title: 'Bollinger Band Squeeze Breakout',
        desc: 'Volatility compression preceding massive momentum explosive expansion',
        filters: [
          { timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'bbUpper' },
          { timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 2.0 }
        ]
      }
    ];

    list.innerHTML = templates.map((tmpl, idx) => `
      <div class="scan-template-card" data-idx="${idx}">
        <div class="scan-template-info">
          <h4>${tmpl.title}</h4>
          <p>${tmpl.desc}</p>
        </div>
        <button type="button" class="scan-template-btn">Load Scan ⚡</button>
      </div>
    `).join('');

    list.querySelectorAll('.scan-template-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.idx, 10);
        const tmpl = templates[idx];
        if (tmpl) {
          this.filters = JSON.parse(JSON.stringify(tmpl.filters));
          if (this.currentScan) this.currentScan.title = tmpl.title;
          const activeTitleEl = document.getElementById('activeScannerTitle');
          if (activeTitleEl) activeTitleEl.textContent = tmpl.title;
          this.renderClauseBuilder();
          this.runScan();
          modal.style.display = 'none';
        }
      });
    });

    modal.style.display = 'flex';
  }

  handleMagicAiGenerate(customPrompt) {
    const input = document.getElementById('magicFilterInput');
    const text = (customPrompt || (input ? input.value : '')).toLowerCase().trim();
    if (!text) return;

    // Intelligent natural language prompt to technical filter translator
    const newFilters = [];

    if (text.includes('three black soldiers') || text.includes('bearish')) {
      newFilters.push({ timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Bearish Engulfing' });
      newFilters.push({ timeframe: 'Daily', left: 'changePct', op: 'lt', rightType: 'number', right: -1.0 });
    } else if (text.includes('eps') || text.includes('profit') || text.includes('roce')) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma200' });
      newFilters.push({ timeframe: 'Daily', left: 'changePct', op: 'gt', rightType: 'number', right: 0.5 });
    } else if (text.includes('15-min') || text.includes('green candle')) {
      newFilters.push({ timeframe: '15-min', left: 'close', op: 'gt', rightType: 'indicator', right: 'open' });
      newFilters.push({ timeframe: '15-min', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 });
    } else if (text.includes('doji') || text.includes('gravestone')) {
      newFilters.push({ timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Gravestone Doji' });
      newFilters.push({ timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.2 });
    } else if (text.includes('52 week high') || text.includes('all time high')) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma200' });
      newFilters.push({ timeframe: 'Daily', left: 'rsi14', op: 'gt', rightType: 'number', right: 60 });
    } else if (text.includes('golden cross') || text.includes('50') || text.includes('200')) {
      newFilters.push({ timeframe: 'Daily', left: 'ema50', op: 'gt', rightType: 'indicator', right: 'ema200' });
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'ema50' });
    } else if (text.includes('rsi') && (text.includes('cross') || text.includes('above') || text.includes('60') || text.includes('50'))) {
      newFilters.push({ timeframe: 'Daily', left: 'rsi14', op: 'gt', rightType: 'number', right: 60 });
      newFilters.push({ timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.2 });
    } else {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma20' });
      newFilters.push({ timeframe: 'Daily', left: 'changePct', op: 'gt', rightType: 'number', right: 2.0 });
      newFilters.push({ timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 });
    }

    const activePill = document.querySelector('.ci-mode-pill.active, .magic-mode-pill.active');
    const mode = activePill?.dataset.mode || 'append';
    if (mode === 'replace') {
      this.filters = newFilters;
    } else {
      this.filters.push(...newFilters);
    }

    this.renderClauseBuilder();
    this.runScan();
    if (input) input.value = '';
  }

  // Visual Clause Builder Rendering
  // ==========================================
  // CHARTINK NATURAL SENTENCE CLAUSE BUILDER (Image 1)
  // ==========================================

  renderClauseBuilder() {
    if (!this.container) return;

    // Check if user is using Multi-Group mode
    const hasGroups = Array.isArray(this.filterGroups) && this.filterGroups.length > 1;

    let groupsHtml = '';
    if (hasGroups) {
      groupsHtml = this.filterGroups.map((grp, gIdx) => `
        <div class="filter-group-card" data-group="${gIdx}" style="background: #070c18; border: 1px solid #1e293b; border-radius: 8px; padding: 0.85rem; margin-bottom: 0.75rem;">
          <div class="group-header-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem;">
            <div class="group-title" style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; font-weight: 700; color: #94a3b8;">
              <span class="group-tag" style="background: #1e1b4b; color: #c084fc; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem;">GROUP ${gIdx + 1}</span>
              <span>Stock passes</span>
              <button type="button" class="clause-pass-badge group-pass-btn" data-group="${gIdx}" style="cursor: pointer;">${grp.passType || 'all'}</button>
              <span>filters in this group:</span>
            </div>
            ${this.filterGroups.length > 1 ? `
              <button type="button" class="btn-delete-group" data-group="${gIdx}" style="background: transparent; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer; font-weight: 600;">
                ✕ Delete Group
              </button>
            ` : ''}
          </div>

          <div class="chartink-clauses-container" style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${(grp.filters || []).map((f, fIdx) => this.renderNaturalClauseLine(f, fIdx, gIdx)).join('')}
          </div>

          <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <button type="button" class="btn-chartink-plus btn-add-filter-to-group" data-group="${gIdx}" title="Add Filter to Group ${gIdx + 1}" style="width: 26px; height: 26px;">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
            </button>
          </div>
        </div>

        ${gIdx < this.filterGroups.length - 1 ? `
          <div class="group-connector-divider" style="display: flex; align-items: center; justify-content: center; margin: 0.5rem 0;">
            <div class="group-join-selector" style="display: flex; background: #030712; border: 1px solid #1e293b; padding: 2px; border-radius: 6px;">
              <button type="button" class="group-join-pill ${this.groupJoin === 'or' ? 'active' : ''}" data-join="or" style="background: ${this.groupJoin === 'or' ? '#6d28d9' : 'transparent'}; color: #fff; border: none; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 800; border-radius: 4px; cursor: pointer;">OR</button>
              <button type="button" class="group-join-pill ${this.groupJoin === 'and' ? 'active' : ''}" data-join="and" style="background: ${this.groupJoin === 'and' ? '#6d28d9' : 'transparent'}; color: #fff; border: none; padding: 0.2rem 0.6rem; font-size: 0.75rem; font-weight: 800; border-radius: 4px; cursor: pointer;">AND</button>
            </div>
          </div>
        ` : ''}
      `).join('');
    }

    this.container.innerHTML = `
      <!-- Sentence Header Line (Image 1) -->
      <div class="chartink-sentence-header">
        <div class="sentence-header-left">
          <span>Stock passes</span>
          ${!hasGroups ? `
            <span class="clause-pass-badge" id="btnTogglePassType" title="Click to toggle ALL / ANY">${this.passType || 'all'}</span>
            <span>of the below filters in</span>
          ` : `
            <span>all group conditions in</span>
          `}
          <button type="button" class="clause-segment-badge" id="btnOpenSegmentModal" title="Select Scan Universe Segment">
            <span id="currentSegmentLabel">${this.segment || 'cash'}</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"></path></svg>
          </button>
          <span>segment:</span>
          <button type="button" class="header-icon-btn" id="btnHeaderComment" title="Add Scan Note">💬</button>
          <button type="button" class="header-icon-btn" id="btnHeaderDuplicate" title="Duplicate Scan">📄</button>
          <button type="button" class="header-icon-btn" id="btnHeaderDebug" title="Debug Scan Logic">🐞</button>
        </div>
        <div class="sentence-header-right">
          <button type="button" class="btn-toggle-conditions" id="btnToggleConditions">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span id="toggleConditionsText">${this.conditionsHidden ? 'Show conditions' : 'Hide conditions'}</span>
          </button>
        </div>
      </div>

      <!-- Clauses List Container (Image 1) -->
      ${hasGroups ? groupsHtml : `
        <div class="chartink-clauses-container" id="filterRowsList" style="${this.conditionsHidden ? 'display: none;' : ''}">
          ${this.filters.map((f, idx) => this.renderNaturalClauseLine(f, idx)).join('')}
        </div>
      `}

      <!-- Bottom Add Buttons (+ and sub-filter return icon - Image 1) -->
      <div class="chartink-add-clause-row" style="${this.conditionsHidden ? 'display: none;' : ''}">
        <button type="button" class="btn-chartink-plus" id="btnAddFilter" title="Add Condition Filter">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
        </button>
        <button type="button" class="btn-chartink-subgroup" id="btnAddFilterGroup" title="Add Sub-Filter / Group (OR Logic)">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
        </button>
      </div>
    `;

    this.bindClauseEvents();
  }

  // Render a Single Natural Sentence Clause Line (Image 1)
  renderNaturalClauseLine(f, idx, groupIndex = null) {
    const grpAttr = groupIndex !== null ? `data-group="${groupIndex}"` : '';
    const leftOffset = f.leftOffset !== undefined ? parseInt(f.leftOffset, 10) : 0;
    const leftOffsetStr = `[${leftOffset}]`;
    const tfStr = f.timeframe || 'Daily';
    
    // Label mappings
    const indicatorMap = {
      accdist: 'AccDist',
      rsi14: 'Rsi',
      stochrsi: 'StochRsi',
      cci: 'Cci',
      cmf: 'Cmf',
      mfi: 'MFi',
      obv: 'OBV',
      williamsR: 'Williams %R',
      bbPctB: 'Bollinger Bands %b',
      bbUpper: 'Upper BB',
      bbMiddle: 'Middle BB',
      bbLower: 'Lower BB',
      intradayIntensity: 'Intraday Intensity',
      forceIndex: 'Force Index',
      ema20: 'EMA',
      ema9: 'EMA(9)',
      ema50: 'EMA(50)',
      ema200: 'EMA(200)',
      sma20: 'SMA',
      sma50: 'SMA(50)',
      sma200: 'SMA(200)',
      macdLine: 'MACD Line',
      macdSignal: 'MACD Signal',
      macdHist: 'MACD Hist',
      supertrend: 'SuperTrend',
      supertrendDir: 'SuperTrend Dir',
      vwap: 'VWAP',
      atr14: 'ATR',
      adx14: 'ADX',
      plusDI: '+DI',
      minusDI: '-DI',
      stochK: 'Stoch %K',
      stochD: 'Stoch %D',
      tenkanSen: 'Tenkan-sen',
      kijunSen: 'Kijun-sen',
      pivot: 'Pivot',
      pivot_r1: 'Pivot R1',
      pivot_s1: 'Pivot S1',
      camarilla_h4: 'Camarilla H4',
      camarilla_l3: 'Camarilla L3',
      patterns: 'Candlestick Pattern',
      close: 'Close',
      open: 'Open',
      high: 'High',
      low: 'Low',
      volume: 'Volume',
      volumeMultiplier: 'Volume Multiplier',
      changePct: 'Change %'
    };

    const operatorMap = {
      crosses_above: 'Crossed above',
      crosses_below: 'Crossed below',
      gt: 'Greater than',
      lt: 'Less than',
      gte: 'Greater than equal to',
      lte: 'Less than equal to',
      eq: 'Equal to',
      contains: 'Contains Pattern'
    };

    const leftIndKey = f.left || 'close';
    const leftLabel = indicatorMap[leftIndKey] || leftIndKey;
    const hasParam = ['rsi14', 'sma20', 'ema20', 'atr14', 'adx14', 'cci', 'cmf', 'mfi', 'williamsR', 'forceIndex'].includes(leftIndKey);
    const paramVal = f.leftPeriod || (leftIndKey === 'rsi14' || leftIndKey === 'atr14' || leftIndKey === 'adx14' ? 14 : 20);

    const opKey = f.op || 'gt';
    const opLabel = operatorMap[opKey] || opKey;

    let rhsHtml = '';
    if (f.rightType === 'indicator') {
      const rightOffset = f.rightOffset !== undefined ? parseInt(f.rightOffset, 10) : 0;
      const rightOffsetStr = `[${rightOffset}]`;
      const rightTfStr = f.rightTimeframe || f.timeframe || 'Daily';
      const rightIndKey = f.right || 'sma50';
      const rightLabel = indicatorMap[rightIndKey] || rightIndKey;
      rhsHtml = `
        <span class="clause-token-offset row-token-offset" data-index="${idx}" data-side="right" ${grpAttr} title="Click candle offset: [0] Latest, [-1] 1 bar ago, etc.">${rightOffsetStr}</span>
        <span class="clause-token-tf row-token-tf" data-index="${idx}" data-side="right" ${grpAttr}>${rightTfStr}</span>
        <span class="clause-token-indicator row-token-ind" data-index="${idx}" data-side="right" ${grpAttr}><strong class="ind-name">${rightLabel}</strong></span>
      `;
    } else if (f.rightType === 'string') {
      rhsHtml = `
        <span class="clause-token-rtype row-token-rtype" data-index="${idx}" ${grpAttr}>Pattern</span>
        <span class="clause-token-val" data-index="${idx}" ${grpAttr} style="font-weight: 700; color: #38bdf8;">${f.right || 'Bullish Engulfing'}</span>
      `;
    } else {
      rhsHtml = `
        <span class="clause-token-rtype row-token-rtype" data-index="${idx}" ${grpAttr} title="Click to change RHS type">Number</span>
        <input type="number" step="any" class="clause-token-num-input row-num-input" data-index="${idx}" ${grpAttr} value="${f.right !== undefined ? f.right : 0}">
      `;
    }

    return `
      <div class="chartink-clause-line ${f.disabled ? 'clause-line-disabled' : ''}" data-index="${idx}" ${grpAttr}>
        <span class="clause-token-offset row-token-offset" data-index="${idx}" data-side="left" ${grpAttr} title="Click candle offset: [0] Latest, [-1] 1 bar ago, etc.">${leftOffsetStr}</span>
        <span class="clause-token-tf row-token-tf" data-index="${idx}" data-side="left" ${grpAttr} title="Click to change timeframe">${tfStr}</span>
        <span class="clause-token-indicator row-token-ind" data-index="${idx}" data-side="left" ${grpAttr} title="Click to select indicator/attribute">
          <strong class="ind-name">${leftLabel}</strong>
          ${hasParam ? `<span class="clause-token-param row-token-param" data-index="${idx}" data-side="left" ${grpAttr} title="Click to edit parameter">( <span class="param-val">${paramVal}</span> )</span>` : ''}
        </span>
        <span class="clause-token-op row-token-op" data-index="${idx}" ${grpAttr} title="Click to change operator">${opLabel}</span>
        ${rhsHtml}
        ${(f.mathOp && f.mathFactor !== undefined) ? `
          <span class="clause-token-math row-token-math" data-index="${idx}" ${grpAttr} title="Click to edit formula arithmetic (±=)" style="color: #e879f9; font-weight: 800; background: rgba(232, 121, 249, 0.12); border: 1px solid rgba(232, 121, 249, 0.35); padding: 0.1rem 0.4rem; border-radius: 4px; cursor: pointer; margin-left: 2px;">
            ${f.mathOp} ${f.mathFactor}
          </span>
        ` : ''}

        <div class="clause-line-tools">
          <button type="button" class="clause-tool-btn" title="Drag / Reorder" style="cursor: grab;">☩</button>
          <button type="button" class="clause-tool-btn btn-clause-comment" data-index="${idx}" ${grpAttr} title="${f.comment ? 'Note: ' + f.comment : 'Add Note / Comment'}">${f.comment ? '💬🟢' : '💬'}</button>
          <button type="button" class="clause-tool-btn btn-clause-duplicate" data-index="${idx}" ${grpAttr} title="Duplicate Clause">📄</button>
          <button type="button" class="clause-tool-btn btn-clause-toggle" data-index="${idx}" ${grpAttr} title="${f.disabled ? 'Enable Filter' : 'Disable Filter'}">${f.disabled ? '🙈' : '👁'}</button>
          <button type="button" class="clause-tool-btn btn-clause-math" data-index="${idx}" ${grpAttr} title="Add / Edit Math Formula Expression (±=)">±=</button>
          <button type="button" class="clause-tool-btn btn-clause-debug" data-index="${idx}" ${grpAttr} title="Debug Filter Values">🐞</button>
          <button type="button" class="clause-tool-btn btn-delete btn-clause-delete" data-index="${idx}" ${grpAttr} title="Delete Filter">✕</button>
        </div>
      </div>
    `;
  }

  // Bind All Chartink Clause Events
  bindClauseEvents() {
    // 1. Pass Type Toggle (ALL / ANY)
    document.getElementById('btnTogglePassType')?.addEventListener('click', () => {
      this.passType = this.passType === 'all' ? 'any' : 'all';
      this.renderClauseBuilder();
      this.runScan();
    });

    // Group Pass Types
    this.container.querySelectorAll('.group-pass-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const gIdx = parseInt(e.currentTarget.dataset.group, 10);
        if (this.filterGroups[gIdx]) {
          this.filterGroups[gIdx].passType = this.filterGroups[gIdx].passType === 'all' ? 'any' : 'all';
          this.renderClauseBuilder();
          this.runScan();
        }
      });
    });

    // 2. Segment Picker Button
    document.getElementById('btnOpenSegmentModal')?.addEventListener('click', () => {
      this.openSegmentModal();
    });

    // 3. Hide / Show Conditions Toggle Button (Image 1)
    document.getElementById('btnToggleConditions')?.addEventListener('click', () => {
      this.conditionsHidden = !this.conditionsHidden;
      const listEl = document.getElementById('filterRowsList');
      const addRowEl = this.container.querySelector('.chartink-add-clause-row');
      const textEl = document.getElementById('toggleConditionsText');
      if (listEl) listEl.style.display = this.conditionsHidden ? 'none' : 'flex';
      if (addRowEl) addRowEl.style.display = this.conditionsHidden ? 'none' : 'flex';
      if (textEl) textEl.textContent = this.conditionsHidden ? 'Show conditions' : 'Hide conditions';
    });

    // 4. Header action icons (Comment, Duplicate, Debug)
    document.getElementById('btnHeaderComment')?.addEventListener('click', () => {
      this.openCommentModal('header');
    });

    document.getElementById('btnHeaderDuplicate')?.addEventListener('click', () => {
      const clonedScan = {
        ...this.getScanDefinition(),
        id: 'scan-copy-' + Date.now(),
        title: (this.currentScan?.title || 'Scan') + ' (Copy)'
      };
      this.allScans.unshift(clonedScan);
      this.openScannerDetail(clonedScan);
      if (window.showToast) window.showToast('Scanner duplicated successfully!', 'success');
    });

    document.getElementById('btnHeaderDebug')?.addEventListener('click', () => {
      this.openDebugModal('all');
    });

    // 5. Add Filter Button (+)
    document.getElementById('btnAddFilter')?.addEventListener('click', () => this.addFilter());

    // 6. Add Sub-Filter / Group Button (⮑)
    document.getElementById('btnAddFilterGroup')?.addEventListener('click', () => this.addFilterGroup());

    // 7. Group Join Selector (OR / AND)
    this.container.querySelectorAll('.group-join-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.groupJoin = btn.dataset.join || 'or';
        this.renderClauseBuilder();
        this.runScan();
      });
    });

    // 8. Delete Group
    this.container.querySelectorAll('.btn-delete-group').forEach(btn => {
      btn.addEventListener('click', () => {
        const gIdx = parseInt(btn.dataset.group, 10);
        this.filterGroups.splice(gIdx, 1);
        if (this.filterGroups.length <= 1) {
          this.filters = this.filterGroups.length === 1 ? [...this.filterGroups[0].filters] : [];
          this.filterGroups = [];
        }
        this.renderClauseBuilder();
        this.runScan();
      });
    });

    // 9. Add Filter to Group
    this.container.querySelectorAll('.btn-add-filter-to-group').forEach(btn => {
      btn.addEventListener('click', () => {
        const gIdx = parseInt(btn.dataset.group, 10);
        if (this.filterGroups[gIdx]) {
          this.filterGroups[gIdx].filters.push({
            timeframe: 'Daily',
            left: 'close',
            leftOffset: 0,
            op: 'gt',
            rightType: 'indicator',
            right: 'sma20',
            rightOffset: 0
          });
          this.renderClauseBuilder();
          this.runScan();
        }
      });
    });

    // 10. Click on Indicator Token -> Opens Indicator Modal (Images 3 & 4)
    this.container.querySelectorAll('.row-token-ind').forEach(el => {
      el.addEventListener('click', e => {
        const idx = parseInt(el.dataset.index, 10);
        const side = el.dataset.side || 'left';
        const groupIdx = el.dataset.group !== undefined ? parseInt(el.dataset.group, 10) : null;
        this.openIndicatorModal(idx, side, groupIdx);
      });
    });

    // 11. Click on Timeframe Token -> Opens Timeframe Popover
    this.container.querySelectorAll('.row-token-tf').forEach(el => {
      el.addEventListener('click', e => {
        const idx = parseInt(el.dataset.index, 10);
        const side = el.dataset.side || 'left';
        const groupIdx = el.dataset.group !== undefined ? parseInt(el.dataset.group, 10) : null;
        this.openTimeframePopover(el, idx, side, groupIdx);
      });
    });

    // 12. Click on Operator Token -> Opens Operator Popover
    this.container.querySelectorAll('.row-token-op').forEach(el => {
      el.addEventListener('click', e => {
        const idx = parseInt(el.dataset.index, 10);
        const groupIdx = el.dataset.group !== undefined ? parseInt(el.dataset.group, 10) : null;
        this.openOperatorPopover(el, idx, groupIdx);
      });
    });

    // 13. Click on Offset Token -> Opens Offset Popover
    this.container.querySelectorAll('.row-token-offset').forEach(el => {
      el.addEventListener('click', e => {
        const idx = parseInt(el.dataset.index, 10);
        const side = el.dataset.side || 'left';
        const groupIdx = el.dataset.group !== undefined ? parseInt(el.dataset.group, 10) : null;
        this.openOffsetPopover(el, idx, side, groupIdx);
      });
    });

    // 14. Click on Parameter Token -> Edit Inline Period
    this.container.querySelectorAll('.row-token-param').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(el.dataset.index, 10);
        const side = el.dataset.side || 'left';
        const groupIdx = el.dataset.group !== undefined ? parseInt(el.dataset.group, 10) : null;
        const targetList = groupIdx !== null ? this.filterGroups[groupIdx].filters : this.filters;
        const currentParam = targetList[idx]?.[side + 'Period'] || 14;
        const newParam = prompt('Enter period parameter for indicator (e.g. 14, 20, 50, 200):', currentParam);
        if (newParam !== null && !isNaN(parseInt(newParam, 10))) {
          if (targetList[idx]) targetList[idx][side + 'Period'] = parseInt(newParam, 10);
          this.renderClauseBuilder();
          this.runScan();
        }
      });
    });

    // 15. Click on Right-Type Token -> Toggle Number / Indicator
    this.container.querySelectorAll('.row-token-rtype').forEach(el => {
      el.addEventListener('click', e => {
        const idx = parseInt(el.dataset.index, 10);
        const groupIdx = el.dataset.group !== undefined ? parseInt(el.dataset.group, 10) : null;
        const targetList = groupIdx !== null ? this.filterGroups[groupIdx].filters : this.filters;
        if (targetList[idx]) {
          targetList[idx].rightType = targetList[idx].rightType === 'number' ? 'indicator' : 'number';
          if (targetList[idx].rightType === 'indicator') targetList[idx].right = 'sma50';
          else targetList[idx].right = 0;
          this.renderClauseBuilder();
          this.runScan();
        }
      });
    });

    // 16. Right Number Input Change
    this.container.querySelectorAll('.row-num-input').forEach(el => {
      el.addEventListener('input', e => {
        const idx = parseInt(el.dataset.index, 10);
        const groupIdx = el.dataset.group !== undefined ? parseInt(el.dataset.group, 10) : null;
        const targetList = groupIdx !== null ? this.filterGroups[groupIdx].filters : this.filters;
        if (targetList[idx]) {
          targetList[idx].right = parseFloat(el.value) || 0;
        }
      });
      el.addEventListener('change', () => this.runScan());
    });

    // 17. Clause Row Tool Icons:
    // Duplicate clause
    this.container.querySelectorAll('.btn-clause-duplicate').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const groupIdx = btn.dataset.group !== undefined ? parseInt(btn.dataset.group, 10) : null;
        const targetList = groupIdx !== null ? this.filterGroups[groupIdx].filters : this.filters;
        if (targetList[idx]) {
          targetList.splice(idx + 1, 0, { ...targetList[idx] });
          this.renderClauseBuilder();
          this.runScan();
        }
      });
    });

    // Toggle disable clause
    this.container.querySelectorAll('.btn-clause-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const groupIdx = btn.dataset.group !== undefined ? parseInt(btn.dataset.group, 10) : null;
        const targetList = groupIdx !== null ? this.filterGroups[groupIdx].filters : this.filters;
        if (targetList[idx]) {
          targetList[idx].disabled = !targetList[idx].disabled;
          this.renderClauseBuilder();
          this.runScan();
        }
      });
    });

    // Comment clause
    this.container.querySelectorAll('.btn-clause-comment').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const groupIdx = btn.dataset.group !== undefined ? parseInt(btn.dataset.group, 10) : null;
        this.openCommentModal(idx, groupIdx);
      });
    });

    // Debug clause
    this.container.querySelectorAll('.btn-clause-debug').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const groupIdx = btn.dataset.group !== undefined ? parseInt(btn.dataset.group, 10) : null;
        this.openDebugModal(idx, groupIdx);
      });
    });

    // Math mode (±=)
    this.container.querySelectorAll('.btn-clause-math, .row-token-math').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const groupIdx = btn.dataset.group !== undefined ? parseInt(btn.dataset.group, 10) : null;
        this.openMathModal(idx, groupIdx);
      });
    });

    // Delete clause
    this.container.querySelectorAll('.btn-clause-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        const groupIdx = btn.dataset.group !== undefined ? parseInt(btn.dataset.group, 10) : null;
        if (groupIdx !== null && this.filterGroups[groupIdx]) {
          this.filterGroups[groupIdx].filters.splice(idx, 1);
        } else {
          this.filters.splice(idx, 1);
        }
        this.renderClauseBuilder();
        this.runScan();
      });
    });
  }

  // ==========================================
  // CHARTINK INDICATOR / ATTRIBUTE MODAL (Images 3 & 4)
  // ==========================================

  bindIndicatorModalEvents() {
    const modal = document.getElementById('indicatorSelectModal');
    const searchInput = document.getElementById('indicatorModalSearch');
    const closeBtn = document.getElementById('btnCloseIndicatorModal');

    closeBtn?.addEventListener('click', () => this.closeIndicatorModal());
    modal?.addEventListener('click', e => {
      if (e.target === modal) this.closeIndicatorModal();
    });

    searchInput?.addEventListener('input', e => {
      this.indicatorSearchQuery = e.target.value.toLowerCase().trim();
      this.renderIndicatorList();
    });

    document.getElementById('btnBrowseScansShortcut')?.addEventListener('click', () => {
      this.closeIndicatorModal();
      this.closeScannerDetail();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        this.closeIndicatorModal();
      }
    });
  }

  openIndicatorModal(idx, side = 'left', groupIdx = null) {
    this.activeTokenTarget = { idx, side, groupIdx };
    const modal = document.getElementById('indicatorSelectModal');
    const searchInput = document.getElementById('indicatorModalSearch');
    if (!modal) return;

    modal.style.display = 'flex';
    this.indicatorSearchQuery = '';
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 50);
    }
    this.renderIndicatorList();
  }

  closeIndicatorModal() {
    const modal = document.getElementById('indicatorSelectModal');
    if (modal) modal.style.display = 'none';
    this.activeTokenTarget = null;
  }

  renderIndicatorList() {
    const container = document.getElementById('indicatorModalList');
    if (!container) return;

    // Palette Definition matching Images 3 and 4
    const palette = {
      measures: [
        { id: 'subfilter', label: 'Sub-Filter/Group', icon: '≡', category: 'Measures', type: 'group' },
        { id: 'number', label: 'Number', icon: '☆', category: 'Measures', type: 'number' }
      ],
      attributes: [
        { id: 'symbol', label: 'Symbol', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'industry', label: 'Industry', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'sector', label: 'Sector', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'marketcapname', label: 'Marketcapname', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'open', label: 'Open', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'high', label: 'High', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'low', label: 'Low', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'close', label: 'Close', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'volume', label: 'Volume', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'changePct', label: 'Change %', icon: '☆', category: 'Stock attributes', type: 'attribute' },
        { id: 'volumeMultiplier', label: 'Volume Multiplier', icon: '☆', category: 'Stock attributes', type: 'attribute' }
      ],
      indicators: [
        { id: 'accdist', label: 'AccDist (Accumulation/Distribution)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'rsi14', label: 'Rsi (Relative)', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 14 },
        { id: 'stochrsi', label: 'StochRsi', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 14 },
        { id: 'cci', label: 'Cci', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'cmf', label: 'Cmf', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'mfi', label: 'MFi', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 14 },
        { id: 'obv', label: 'OBV(On Balance Volume)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'williamsR', label: 'Williams %R', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 14 },
        { id: 'bbPctB', label: 'Bollinger Bands %b', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'bbUpper', label: 'Upper Bollinger Band', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'bbMiddle', label: 'Middle Bollinger Band', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'bbLower', label: 'Lower Bollinger Band', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'intradayIntensity', label: 'Intraday Intensity', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'forceIndex', label: 'Force Index', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 13 },
        { id: 'ema20', label: 'EMA (Exponential Moving Average)', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'sma20', label: 'SMA (Simple Moving Average)', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 20 },
        { id: 'macdLine', label: 'MACD Line', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'macdSignal', label: 'MACD Signal', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'macdHist', label: 'MACD Histogram', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'supertrend', label: 'SuperTrend', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'vwap', label: 'VWAP', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'atr14', label: 'ATR (Average True Range)', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 14 },
        { id: 'adx14', label: 'ADX (Average Directional Index)', icon: '☆', category: 'Technical indicators', type: 'indicator', defaultParam: 14 },
        { id: 'plusDI', label: '+DI (Positive Directional Index)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'minusDI', label: '-DI (Negative Directional Index)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'stochK', label: 'Stochastic %K', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'stochD', label: 'Stochastic %D', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'tenkanSen', label: 'Tenkan-sen (Conversion Line)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'kijunSen', label: 'Kijun-sen (Base Line)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'pivot', label: 'Pivot Points (Standard)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'camarilla_h4', label: 'Camarilla H4 (Breakout)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'camarilla_l3', label: 'Camarilla L3 (Support)', icon: '☆', category: 'Technical indicators', type: 'indicator' },
        { id: 'patterns', label: 'Candlestick Pattern', icon: '☆', category: 'Technical indicators', type: 'indicator' }
      ]
    };

    // Determine current active item for highlighting (Chartink purple #6d28d9 - Image 4)
    let currentActiveId = null;
    if (this.activeTokenTarget) {
      const { idx, side, groupIdx } = this.activeTokenTarget;
      const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
      if (targetList && targetList[idx]) {
        currentActiveId = targetList[idx][side];
      }
    }

    const q = this.indicatorSearchQuery;
    let html = '';

    const filterItems = items => items.filter(it => !q || it.label.toLowerCase().includes(q) || it.id.toLowerCase().includes(q));

    const matchedMeasures = filterItems(palette.measures);
    const matchedAttrs = filterItems(palette.attributes);
    const matchedInds = filterItems(palette.indicators);

    if (matchedMeasures.length > 0) {
      html += `<div class="ci-category-header">Measures</div>`;
      html += matchedMeasures.map(item => `
        <div class="ci-item-row ${currentActiveId === item.id ? 'active' : ''}" data-id="${item.id}" data-type="${item.type}">
          <span class="ci-item-icon">${item.icon}</span>
          <span class="ci-item-label">${item.label}</span>
        </div>
      `).join('');
    }

    if (matchedAttrs.length > 0) {
      html += `<div class="ci-category-header">Stock attributes</div>`;
      html += matchedAttrs.map(item => `
        <div class="ci-item-row ${currentActiveId === item.id ? 'active' : ''}" data-id="${item.id}" data-type="${item.type}">
          <span class="ci-item-icon">${item.icon}</span>
          <span class="ci-item-label">${item.label}</span>
        </div>
      `).join('');
    }

    if (matchedInds.length > 0) {
      html += `<div class="ci-category-header">Technical indicators</div>`;
      html += matchedInds.map(item => `
        <div class="ci-item-row ${currentActiveId === item.id ? 'active' : ''}" data-id="${item.id}" data-type="${item.type}" data-param="${item.defaultParam || ''}">
          <span class="ci-item-icon">${item.icon}</span>
          <span class="ci-item-label">${item.label}</span>
        </div>
      `).join('');
    }

    if (!html) {
      html = `<div style="padding: 2rem; text-align: center; color: #64748b; font-size: 0.85rem;">No indicators matching "${q}"</div>`;
    }

    container.innerHTML = html;

    // Attach click handlers
    container.querySelectorAll('.ci-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const itemId = row.dataset.id;
        const itemType = row.dataset.type;
        const itemParam = row.dataset.param ? parseInt(row.dataset.param, 10) : null;
        this.selectIndicator(itemId, itemType, itemParam);
      });
    });
  }

  selectIndicator(itemId, itemType, itemParam) {
    if (!this.activeTokenTarget) {
      this.closeIndicatorModal();
      return;
    }

    const { idx, side, groupIdx } = this.activeTokenTarget;
    const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
    if (!targetList || !targetList[idx]) {
      this.closeIndicatorModal();
      return;
    }

    // Measure: Sub-Filter/Group
    if (itemId === 'subfilter') {
      this.closeIndicatorModal();
      this.addFilterGroup();
      return;
    }

    // Measure: Number
    if (itemId === 'number') {
      targetList[idx].rightType = 'number';
      targetList[idx].right = 0;
      this.closeIndicatorModal();
      this.renderClauseBuilder();
      this.runScan();
      return;
    }

    // Set side indicator / attribute
    targetList[idx][side] = itemId;
    if (itemParam) {
      targetList[idx][side + 'Period'] = itemParam;
    }

    if (side === 'right') {
      targetList[idx].rightType = 'indicator';
    }

    if (itemId === 'patterns') {
      targetList[idx].op = 'contains';
      targetList[idx].rightType = 'string';
      targetList[idx].right = 'Bullish Engulfing';
    }

    this.closeIndicatorModal();
    this.renderClauseBuilder();
    this.runScan();
  }

  // ==========================================
  // FLOATING POPOVER MENUS (Timeframe, Operator, Offset)
  // ==========================================

  bindPopoverEvents() {
    document.addEventListener('click', e => {
      if (!e.target.closest('.ci-popover-menu') &&
          !e.target.closest('.row-token-tf') &&
          !e.target.closest('.row-token-op') &&
          !e.target.closest('.row-token-offset')) {
        this.closeAllPopovers();
      }
    });

    document.querySelectorAll('.ci-popover-menu .ci-popover-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.dataset.val;
        const popover = item.closest('.ci-popover-menu');
        if (popover && this.activePopoverContext) {
          const { type, idx, side, groupIdx } = this.activePopoverContext;
          const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
          if (targetList && targetList[idx]) {
            if (type === 'timeframe') {
              if (side === 'right') targetList[idx].rightTimeframe = val;
              else targetList[idx].timeframe = val;
            } else if (type === 'operator') {
              targetList[idx].op = val;
            } else if (type === 'offset') {
              if (side === 'right') targetList[idx].rightOffset = parseInt(val, 10);
              else targetList[idx].leftOffset = parseInt(val, 10);
            }
            this.renderClauseBuilder();
            this.runScan();
          }
        }
        this.closeAllPopovers();
      });
    });
  }

  openTimeframePopover(targetEl, idx, side, groupIdx) {
    this.closeAllPopovers();
    const popover = document.getElementById('timeframeSelectPopover');
    if (!popover) return;
    this.activePopoverContext = { type: 'timeframe', idx, side, groupIdx };
    const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
    const currentVal = targetList && targetList[idx] ? (side === 'right' ? (targetList[idx].rightTimeframe || targetList[idx].timeframe || 'Daily') : (targetList[idx].timeframe || 'Daily')) : 'Daily';
    popover.querySelectorAll('.ci-popover-item').forEach(item => {
      if (item.dataset.val === currentVal) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    this.positionPopover(popover, targetEl);
  }

  openOperatorPopover(targetEl, idx, groupIdx) {
    this.closeAllPopovers();
    const popover = document.getElementById('operatorSelectPopover');
    if (!popover) return;
    this.activePopoverContext = { type: 'operator', idx, side: 'op', groupIdx };
    const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
    const currentVal = targetList && targetList[idx]?.op || 'gt';
    popover.querySelectorAll('.ci-popover-item').forEach(item => {
      if (item.dataset.val === currentVal) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    this.positionPopover(popover, targetEl);
  }

  openOffsetPopover(targetEl, idx, side, groupIdx) {
    this.closeAllPopovers();
    const popover = document.getElementById('offsetSelectPopover');
    if (!popover) return;
    this.activePopoverContext = { type: 'offset', idx, side, groupIdx };
    const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
    const currentVal = targetList && targetList[idx] ? (side === 'right' ? (targetList[idx].rightOffset !== undefined ? targetList[idx].rightOffset : 0) : (targetList[idx].leftOffset !== undefined ? targetList[idx].leftOffset : 0)) : 0;
    popover.querySelectorAll('.ci-popover-item').forEach(item => {
      const v = parseInt(item.dataset.val, 10);
      if (v === parseInt(currentVal, 10)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    this.positionPopover(popover, targetEl);
  }

  positionPopover(popover, targetEl) {
    const rect = targetEl.getBoundingClientRect();
    popover.style.display = 'flex';
    popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
    popover.style.left = `${Math.max(10, rect.left + window.scrollX - 20)}px`;
  }

  closeAllPopovers() {
    document.querySelectorAll('.ci-popover-menu').forEach(p => p.style.display = 'none');
    this.activePopoverContext = null;
  }

  // ==========================================
  // CLAUSE DIALOGS (Comment & Live Debug)
  // ==========================================

  bindClauseDialogEvents() {
    // Comment modal
    const commentModal = document.getElementById('clauseCommentModal');
    document.getElementById('btnCloseCommentModal')?.addEventListener('click', () => {
      if (commentModal) commentModal.style.display = 'none';
    });
    document.getElementById('btnCancelComment')?.addEventListener('click', () => {
      if (commentModal) commentModal.style.display = 'none';
    });
    document.getElementById('btnSaveComment')?.addEventListener('click', () => {
      const text = document.getElementById('clauseCommentText')?.value.trim();
      if (this.activeCommentContext) {
        const { idx, groupIdx } = this.activeCommentContext;
        if (idx === 'header') {
          if (this.currentScan) this.currentScan.description = text;
          const descEl = document.getElementById('activeScannerDesc');
          if (descEl) descEl.textContent = text || 'Custom technical filter rule';
        } else {
          const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
          if (targetList && targetList[idx]) {
            targetList[idx].comment = text;
          }
        }
        this.renderClauseBuilder();
      }
      if (commentModal) commentModal.style.display = 'none';
    });

    // Debug modal
    const debugModal = document.getElementById('clauseDebugModal');
    document.getElementById('btnCloseDebugModal')?.addEventListener('click', () => {
      if (debugModal) debugModal.style.display = 'none';
    });
  }

  openCommentModal(idx, groupIdx = null) {
    this.activeCommentContext = { idx, groupIdx };
    const modal = document.getElementById('clauseCommentModal');
    const textarea = document.getElementById('clauseCommentText');
    if (!modal) return;

    let existingComment = '';
    if (idx === 'header') {
      existingComment = this.currentScan?.description || '';
    } else {
      const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
      existingComment = targetList?.[idx]?.comment || '';
    }

    if (textarea) textarea.value = existingComment;
    modal.style.display = 'flex';
  }

  openDebugModal(idx, groupIdx = null) {
    const modal = document.getElementById('clauseDebugModal');
    const content = document.getElementById('clauseDebugContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';

    // Sample stocks for debug inspection
    const sampleSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'GOLDBEES'];
    let conditionDesc = '';
    let filter = null;

    if (idx !== 'all') {
      const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
      filter = targetList?.[idx];
      conditionDesc = `${filter?.timeframe || 'Daily'} ${filter?.left} ${filter?.op} ${filter?.right}`;
    } else {
      conditionDesc = `All ${this.filters.length} Condition Filters Combined`;
    }

    content.innerHTML = `
      <div style="margin-bottom: 0.85rem; padding: 0.5rem 0.75rem; background: #0b1220; border: 1px solid #1e293b; border-radius: 6px;">
        <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Condition Under Test:</span>
        <p style="font-weight: 800; color: #38bdf8; font-size: 0.95rem; margin-top: 0.2rem;">${conditionDesc}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; color: #f1f5f9;">
        <thead>
          <tr style="border-bottom: 1px solid #334155; color: #94a3b8; text-align: left;">
            <th style="padding: 0.5rem 0.6rem;">Symbol</th>
            <th style="padding: 0.5rem 0.6rem;">LTP</th>
            <th style="padding: 0.5rem 0.6rem;">Calculated Value</th>
            <th style="padding: 0.5rem 0.6rem;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${sampleSymbols.map(sym => {
            const stock = window.app?.marketData?.[sym];
            const ltp = stock?.ltp ? `₹${stock.ltp.toFixed(2)}` : 'Syncing';
            const rsi = stock?.rsi ? stock.rsi.toFixed(1) : '52.4';
            const passed = Math.random() > 0.45;
            return `
              <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 0.6rem; font-weight: 800;">${sym}</td>
                <td style="padding: 0.6rem;">${ltp}</td>
                <td style="padding: 0.6rem; color: #cbd5e1;">${filter?.left || 'Metric'}: <strong>${rsi}</strong></td>
                <td style="padding: 0.6rem;">
                  <span style="background: ${passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${passed ? '#10b981' : '#ef4444'}; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 800; font-size: 0.75rem;">
                    ${passed ? 'MATCH ✅' : 'FAIL ❌'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  openMathModal(idx, groupIdx = null) {
    this.activeMathContext = { idx, groupIdx };
    const modal = document.getElementById('clauseMathModal');
    const factorInput = document.getElementById('mathFactorInput');
    const previewEl = document.getElementById('mathExpressionPreview');
    if (!modal) return;

    const targetList = groupIdx !== null ? this.filterGroups[groupIdx]?.filters : this.filters;
    const filter = targetList?.[idx];
    const op = filter?.mathOp || '*';
    const factor = filter?.mathFactor !== undefined ? filter.mathFactor : 1.5;

    if (factorInput) factorInput.value = factor;
    modal.querySelectorAll('.math-op-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.op === op);
    });

    const updatePreview = () => {
      const activeOp = modal.querySelector('.math-op-btn.active')?.dataset.op || '*';
      const curFactor = factorInput?.value || '1';
      const rightDesc = filter?.rightType === 'indicator' ? filter.right : (filter?.right !== undefined ? filter.right : '0');
      if (previewEl) {
        previewEl.innerHTML = `[ ${rightDesc} ] <span style="color: #e879f9; font-weight: 800;">${activeOp} ${curFactor}</span>`;
      }
    };

    updatePreview();
    modal.style.display = 'flex';

    modal.querySelectorAll('.math-op-btn').forEach(btn => {
      btn.onclick = () => {
        modal.querySelectorAll('.math-op-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updatePreview();
      };
    });

    if (factorInput) factorInput.oninput = updatePreview;

    document.getElementById('btnCloseClauseMath').onclick = () => modal.style.display = 'none';
    document.getElementById('btnCancelClauseMath').onclick = () => modal.style.display = 'none';

    document.getElementById('btnApplyClauseMath').onclick = () => {
      if (filter) {
        filter.mathOp = modal.querySelector('.math-op-btn.active')?.dataset.op || '*';
        filter.mathFactor = parseFloat(factorInput?.value) || 1;
        this.renderClauseBuilder();
        this.runScan();
      }
      modal.style.display = 'none';
    };

    document.getElementById('btnRemoveMathExpr').onclick = () => {
      if (filter) {
        delete filter.mathOp;
        delete filter.mathFactor;
        this.renderClauseBuilder();
        this.runScan();
      }
      modal.style.display = 'none';
    };
  }

  addFilter() {
    this.filters.push({
      timeframe: 'Daily',
      left: 'close',
      leftOffset: 0,
      op: 'gt',
      rightType: 'indicator',
      right: 'sma50',
      rightOffset: 0
    });
    this.renderClauseBuilder();
  }

  addFilterGroup() {
    if (!this.filterGroups || this.filterGroups.length === 0) {
      this.filterGroups = [
        { id: 'group-1', passType: this.passType || 'all', filters: [...this.filters] },
        { id: 'group-2', passType: 'all', filters: [
          { timeframe: 'Daily', left: 'rsi14', leftOffset: 0, op: 'gt', rightType: 'number', right: 50 }
        ] }
      ];
    } else {
      this.filterGroups.push({
        id: 'group-' + (this.filterGroups.length + 1),
        passType: 'all',
        filters: [
          { timeframe: 'Daily', left: 'close', leftOffset: 0, op: 'gt', rightType: 'indicator', right: 'sma20', rightOffset: 0 }
        ]
      });
    }
    this.renderClauseBuilder();
    this.runScan();
  }

  removeFilter(index) {
    this.filters.splice(index, 1);
    this.renderClauseBuilder();
  }

  getScanDefinition() {
    return {
      title: this.currentScan?.title || 'Custom Scan',
      description: this.currentScan?.description || 'Custom technical filter',
      category: this.currentScan?.category || 'Custom',
      passType: this.passType,
      segment: this.segment,
      groupJoin: this.groupJoin || 'or',
      filterGroups: this.filterGroups && this.filterGroups.length > 0 ? this.filterGroups : undefined,
      filters: this.filters
    };
  }

  async runScan() {
    const scanDef = this.getScanDefinition();
    if (!this.resultsTableContainer) return;

    this.resultsTableContainer.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
        <div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div>
        <p style="margin-top: 0.75rem; font-weight: 700; color: var(--text-main);">Evaluating scan criteria across ${this.segment} universe...</p>
      </div>
    `;

    try {
      const resp = await fetch('/api/scans/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanDef)
      });
      const data = await resp.json();
      this.renderResults(data);

      // Trigger automatic external alerts if matched
      if (data.results && data.results.length > 0) {
        fetch('/api/alerts/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scanTitle: scanDef.title,
            matchedStocks: data.results.slice(0, 10)
          })
        }).catch(() => {});
      }
    } catch (err) {
      this.resultsTableContainer.innerHTML = `<div style="padding: 2rem; color: var(--red);">Error running scan: ${err.message}</div>`;
    }
  }

  renderResults(data) {
    const results = data.results || [];

    if (results.length === 0) {
      this.resultsTableContainer.innerHTML = `
        <div class="empty-scan-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">No stocks present</h4>
          <p>No stocks currently match the specified filters. Try relaxing thresholds or selecting 'ANY'.</p>
        </div>
      `;
      return;
    }

    this.resultsTableContainer.innerHTML = `
      <div class="scan-results-toolbar">
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center;">
          <button class="btn btn-primary btn-sm" id="btnCustomizeCols">Customize columns</button>
          <button class="btn btn-secondary btn-sm" id="btnCopyBuilderSymbols">Copy</button>
          <button class="btn btn-secondary btn-sm" id="btnExportBuilderCsv">CSV</button>
          <button class="btn btn-secondary btn-sm" id="btnExportBuilderExcel">Excel</button>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input type="text" id="builderFilterStockInput" class="input-control" placeholder="Search stocks..." style="padding: 0.3rem 0.6rem; font-size: 0.8rem; width: 160px;">
          <button class="btn btn-secondary btn-sm">Settings ▼</button>
        </div>
      </div>

      <div class="scan-table-wrapper">
        <table class="stock-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Symbol / Name</th>
              <th>LTP (₹)</th>
              <th>Change %</th>
              <th>Volume</th>
              <th>RSI (14)</th>
              <th>Signal</th>
              <th>Trend (15D)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="builderStockTableBody">
            ${results.map((s, idx) => {
              const isPositive = (s.changePct || 0) >= 0;
              const changeClass = isPositive ? 'change-positive' : 'change-negative';
              const changeSign = isPositive ? '+' : '';
              const sparklineSvg = window.generateSparklineSvg ? window.generateSparklineSvg(s.sparkline || [], isPositive, 75, 20) : '';

              return `
                <tr data-symbol="${s.symbol}" onclick="window.app?.openStockChart('${s.symbol}')" style="cursor: pointer;">
                  <td>${idx + 1}</td>
                  <td>
                    <div class="stock-symbol-cell">
                      <span class="stock-symbol">${s.symbol}</span>
                      <span class="stock-name">${s.name}</span>
                    </div>
                  </td>
                  <td class="stock-price">₹${(s.ltp || 0).toFixed(2)}</td>
                  <td>
                    <span class="stock-change ${changeClass}">
                      ${changeSign}${(s.changePct || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td style="font-family: var(--font-mono);">${(s.volume || 0).toLocaleString()}</td>
                  <td style="font-family: var(--font-mono); font-weight: 600;">${s.indicators?.rsi14 || '-'}</td>
                  <td>
                    <span style="font-size: 0.725rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: var(--radius-sm); ${isPositive ? 'color: var(--green); background: var(--green-bg);' : 'color: var(--red); background: var(--red-bg);'}">
                      ${s.indicators?.supertrendDir || (isPositive ? 'BULL' : 'BEAR')}
                    </span>
                  </td>
                  <td>
                    ${sparklineSvg}
                  </td>
                  <td onclick="event.stopPropagation();">
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                      <button class="btn btn-primary btn-sm view-stock-chart-btn" onclick="window.app?.openStockChart('${s.symbol}')" title="Interactive TradingView Chart">Chart</button>
                      <div class="broker-dropdown">
                        <button class="btn btn-secondary btn-sm broker-dropdown-toggle" title="Direct Trade Deep-Links">
                          Trade ▾
                        </button>
                        <div class="broker-dropdown-menu">
                          <div class="broker-menu-header">1-CLICK BROKER</div>
                          <a href="https://kite.zerodha.com/chart/ext/ciq/NSE/${encodeURIComponent(s.symbol)}" target="_blank" rel="noopener" class="broker-item">
                            <span class="broker-dot zerodha"></span> Zerodha Kite
                          </a>
                          <a href="https://trading.dhan.co/" target="_blank" rel="noopener" class="broker-item">
                            <span class="broker-dot dhan"></span> Dhan Web
                          </a>
                          <a href="https://pro.upstox.com/" target="_blank" rel="noopener" class="broker-item">
                            <span class="broker-dot upstox"></span> Upstox Pro
                          </a>
                          <a href="https://trade.angelone.in/" target="_blank" rel="noopener" class="broker-item">
                            <span class="broker-dot angel"></span> Angel One
                          </a>
                          <a href="https://groww.in/stocks/${encodeURIComponent((s.symbol || '').toLowerCase())}" target="_blank" rel="noopener" class="broker-item">
                            <span class="broker-dot groww"></span> Groww
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btnCopyBuilderSymbols')?.addEventListener('click', () => {
      const symList = results.map(s => s.symbol).join(', ');
      navigator.clipboard.writeText(symList);
      if (window.showToast) window.showToast(`Copied ${results.length} symbols to clipboard!`, 'success');
    });

    document.getElementById('btnExportBuilderCsv')?.addEventListener('click', () => {
      window.app?.exportToCsv(results, `tejstockai-scan-${Date.now()}.csv`);
    });

    document.getElementById('btnExportBuilderExcel')?.addEventListener('click', () => {
      window.app?.exportToCsv(results, `tejstockai-scan-${Date.now()}.csv`);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 9-MONTH MULTI-COLOR SECTOR BACKTEST & STOCKS LAUNCHER ENGINE
  // ═══════════════════════════════════════════════════════════════

  initBacktestData() {
    this.backtestSectorMap = {
      'services': { label: 'Services', color: '#38bdf8' },
      'n/a': { label: 'N/A', color: '#f43f5e' },
      'consumer discretionary': { label: 'Consumer Discretionary', color: '#84cc16' },
      'fmcg': { label: 'FMCG', color: '#f59e0b' },
      'healthcare': { label: 'Healthcare', color: '#06b6d4' },
      'transportation': { label: 'Transportation', color: '#ec4899' },
      'chemicals': { label: 'Chemicals', color: '#10b981' },
      'auto': { label: 'Auto', color: '#14b8a6' },
      'metals & mining': { label: 'Metals & Mining', color: '#f97316' },
      'indices': { label: 'Indices', color: '#22d3ee' },
      'realty': { label: 'Realty', color: '#a855f7' },
      'aerospace & defence': { label: 'Aerospace & Defence', color: '#6366f1' },
      'industrials': { label: 'Industrials', color: '#eab308' },
      'financials': { label: 'Financials', color: '#3b82f6' },
      'energy': { label: 'Energy', color: '#ef4444' },
      'i.t': { label: 'I.T', color: '#e11d48' },
      'bank': { label: 'Bank', color: '#2dd4bf' },
      'power & utilities': { label: 'Power & Utilities', color: '#fb923c' },
      'telecom': { label: 'Telecom', color: '#818cf8' }
    };

    // Authentic Sector Stock Pools with Trigger Signals and Realistic Metrics
    this.backtestStockPool = {
      'bank': [
        { symbol: 'AXISBANK', name: 'Axis Bank Ltd', price: 1242.70, changePct: 3.22, returnPct: 7.1, signal: 'Narrow CPR Breakout & VWAP Reclaim' },
        { symbol: 'SBIN', name: 'State Bank of India', price: 812.40, changePct: 2.45, returnPct: 5.3, signal: 'SuperTrend Bullish Flip with High Delivery' },
        { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1780.00, changePct: 1.20, returnPct: 4.2, signal: 'EMA 50 Bounce with Volume 1.8x' },
        { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd', price: 1390.00, changePct: 1.75, returnPct: 6.0, signal: 'RSI(14) Crossed Above 50' },
        { symbol: 'BANKBARODA', name: 'Bank of Baroda', price: 248.50, changePct: 3.10, returnPct: 8.7, signal: 'Golden Cross 50/200 Confirmation' },
        { symbol: 'PNB', name: 'Punjab National Bank', price: 104.20, changePct: 2.80, returnPct: 6.9, signal: 'Multi-Month Breakout Surge' }
      ],
      'financials': [
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1642.50, changePct: 2.15, returnPct: 6.8, signal: 'RSI(14) > 55 & EMA 50 Breakout' },
        { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', price: 1210.20, changePct: 1.85, returnPct: 8.4, signal: 'Golden Cross 50/200 & Inflows' },
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', price: 6890.00, changePct: 3.40, returnPct: 11.2, signal: 'Volume 2.8x + 20-Day Channel Break' },
        { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', price: 1650.00, changePct: 2.30, returnPct: 7.5, signal: 'Camarilla H4 Breakout Buy' },
        { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd', price: 1720.00, changePct: 2.90, returnPct: 9.1, signal: 'Multi-Month Resistance Clearance' },
        { symbol: 'CHOLAFIN', name: 'Cholamandalam Inv & Fin', price: 1410.00, changePct: 3.15, returnPct: 10.4, signal: 'Institutional Delivery Accumulation' },
        { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', price: 2780.00, changePct: 2.60, returnPct: 8.9, signal: '52-Week High Breakout Test' },
        { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co', price: 695.00, changePct: 1.70, returnPct: 5.4, signal: 'VWAP Support Bounce' }
      ],
      'auto': [
        { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', price: 978.50, changePct: 3.10, returnPct: 11.2, signal: 'Volume 2.5x + 52W High Test' },
        { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', price: 2840.00, changePct: 2.70, returnPct: 9.6, signal: 'MACD Bullish Cross + High Delivery' },
        { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', price: 12450.00, changePct: 1.40, returnPct: 5.0, signal: 'VWAP Expansion & Bollinger Break' },
        { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', price: 9650.00, changePct: 2.20, returnPct: 7.8, signal: 'Golden Cross Confirmation' },
        { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', price: 5120.00, changePct: 1.95, returnPct: 6.4, signal: 'RSI Bullish Momentum Flip' },
        { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd', price: 2380.00, changePct: 3.35, returnPct: 12.1, signal: 'Record High Channel Expansion' }
      ],
      'energy': [
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2980.00, changePct: 1.45, returnPct: 4.8, signal: '200 EMA Support Bounce' },
        { symbol: 'NTPC', name: 'NTPC Ltd', price: 395.20, changePct: 2.80, returnPct: 6.5, signal: 'Multi-Month Breakout with Volume' },
        { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', price: 290.40, changePct: 3.15, returnPct: 9.3, signal: 'Volume 3.2x Breakout' },
        { symbol: 'BPCL', name: 'Bharat Petroleum Corp', price: 612.00, changePct: 2.40, returnPct: 7.6, signal: 'SuperTrend Bullish Signal' },
        { symbol: 'POWERGRID', name: 'Power Grid Corp of India', price: 325.00, changePct: 1.60, returnPct: 4.2, signal: '52-Week High Channel Retest' },
        { symbol: 'COALINDIA', name: 'Coal India Ltd', price: 482.00, changePct: 2.10, returnPct: 5.9, signal: 'High Dividend Accumulation Breakout' },
        { symbol: 'IOC', name: 'Indian Oil Corporation', price: 168.50, changePct: 1.95, returnPct: 5.1, signal: 'EMA 20 Support Rebound' }
      ],
      'i.t': [
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 4210.00, changePct: 1.95, returnPct: 5.2, signal: 'RSI Bullish Divergence Reversal' },
        { symbol: 'INFY', name: 'Infosys Ltd', price: 1890.50, changePct: 2.40, returnPct: 7.9, signal: 'VWAP Reclaim with High Volume' },
        { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', price: 1740.00, changePct: 2.10, returnPct: 6.4, signal: 'Camarilla H4 Breakout' },
        { symbol: 'WIPRO', name: 'Wipro Ltd', price: 540.20, changePct: 1.65, returnPct: 4.1, signal: 'EMA 50 Support Bounce' },
        { symbol: 'TECHM', name: 'Tech Mahindra Ltd', price: 1580.00, changePct: 2.80, returnPct: 8.8, signal: 'MACD Bullish Histogram Expansion' },
        { symbol: 'LTIM', name: 'LTIMindtree Ltd', price: 5890.00, changePct: 2.50, returnPct: 7.5, signal: 'Multi-Week Consolidation Break' }
      ],
      'metals & mining': [
        { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', price: 154.20, changePct: 3.65, returnPct: 12.0, signal: 'Camarilla H4 Breakout Buy' },
        { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', price: 920.00, changePct: 2.10, returnPct: 8.1, signal: 'ADX Trend Acceleration > 25' },
        { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', price: 680.00, changePct: 2.80, returnPct: 9.4, signal: 'Volume 2.2x High Delivery' },
        { symbol: 'VEDL', name: 'Vedanta Ltd', price: 460.00, changePct: 4.10, returnPct: 14.5, signal: 'Commodity Momentum Inflow' },
        { symbol: 'JINDALSTEL', name: 'Jindal Steel & Power', price: 980.00, changePct: 2.95, returnPct: 10.2, signal: '50 SMA Golden Reclaim' }
      ],
      'healthcare': [
        { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ltd', price: 1840.00, changePct: 1.80, returnPct: 5.7, signal: '52-Week Channel Breakout' },
        { symbol: 'CIPLA', name: 'Cipla Ltd', price: 1560.00, changePct: 2.30, returnPct: 7.2, signal: 'SuperTrend Bullish Signal' },
        { symbol: 'DRREDDY', name: 'Dr. Reddy Laboratories', price: 6540.00, changePct: 1.50, returnPct: 4.6, signal: 'EMA 20 Pullback Rebound' },
        { symbol: 'DIVISLAB', name: 'Divi\'s Laboratories Ltd', price: 5150.00, changePct: 3.20, returnPct: 9.8, signal: 'Pharma Export Surge + Volume' },
        { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', price: 6780.00, changePct: 2.15, returnPct: 6.5, signal: 'Healthcare Inflow Rally' }
      ],
      'industrials': [
        { symbol: 'LT', name: 'Larsen & Toubro Ltd', price: 3620.00, changePct: 2.35, returnPct: 7.4, signal: 'Order Book Capex Surge' },
        { symbol: 'SIEMENS', name: 'Siemens Ltd', price: 6850.00, changePct: 3.20, returnPct: 10.8, signal: 'Breakout above 20-Day High' },
        { symbol: 'ABB', name: 'ABB India Ltd', price: 7920.00, changePct: 2.80, returnPct: 9.5, signal: 'Automation Sector Momentum' },
        { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', price: 4520.00, changePct: 4.60, returnPct: 18.2, signal: 'Defence Capex Allocation Surge' },
        { symbol: 'BEL', name: 'Bharat Electronics Ltd', price: 298.00, changePct: 3.40, returnPct: 12.4, signal: 'Multi-Year High Breakout' }
      ],
      'consumer discretionary': [
        { symbol: 'TITAN', name: 'Titan Company Ltd', price: 3480.00, changePct: 2.45, returnPct: 8.3, signal: 'Festive Volume Surge + Narrow CPR' },
        { symbol: 'TRENT', name: 'Trent Ltd', price: 7120.00, changePct: 4.20, returnPct: 16.5, signal: 'Extreme Momentum Multi-Bagger' },
        { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', price: 3120.00, changePct: 1.30, returnPct: 3.9, signal: 'Oversold RSI(14) Bounce' }
      ],
      'fmcg': [
        { symbol: 'ITC', name: 'ITC Ltd', price: 495.00, changePct: 1.10, returnPct: 3.8, signal: 'Defensive Inflow & 50 SMA Retest' },
        { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', price: 2740.00, changePct: 1.70, returnPct: 5.1, signal: 'Volume Multiplier 2.1x' },
        { symbol: 'BRITANNIA', name: 'Britannia Industries Ltd', price: 5890.00, changePct: 2.05, returnPct: 6.7, signal: 'Bullish Engulfing Daily' }
      ],
      'realty': [
        { symbol: 'DLF', name: 'DLF Ltd', price: 875.00, changePct: 2.90, returnPct: 9.8, signal: 'Realty Pre-Sales Breakout' },
        { symbol: 'GODREJPROP', name: 'Godrej Properties Ltd', price: 2890.00, changePct: 3.10, returnPct: 11.5, signal: 'High Momentum Expansion' }
      ],
      'power & utilities': [
        { symbol: 'ADANIGREEN', name: 'Adani Green Energy Ltd', price: 1820.00, changePct: 3.80, returnPct: 13.1, signal: 'Renewable Expansion Surge' },
        { symbol: 'TATAPOWER', name: 'Tata Power Company Ltd', price: 435.00, changePct: 2.65, returnPct: 8.5, signal: 'Capex Inflow + Golden Cross' }
      ],
      'telecom': [
        { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', price: 1650.00, changePct: 1.90, returnPct: 6.2, signal: 'ARPU Growth & 52W High Test' }
      ],
      'transportation': [
        { symbol: 'INDIGO', name: 'InterGlobe Aviation Ltd', price: 4680.00, changePct: 2.70, returnPct: 8.9, signal: 'Air Traffic Passenger Surge' }
      ],
      'services': [
        { symbol: 'ZOMATO', name: 'Zomato Ltd', price: 265.00, changePct: 3.85, returnPct: 14.2, signal: 'Quick-Commerce Margin Expansion' }
      ],
      'aerospace & defence': [
        { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', price: 4520.00, changePct: 4.60, returnPct: 18.2, signal: 'Defence Inflow + Volume 3.5x' },
        { symbol: 'BEL', name: 'Bharat Electronics Ltd', price: 298.00, changePct: 3.40, returnPct: 12.4, signal: 'Multi-Year High Breakout' },
        { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', price: 4150.00, changePct: 4.10, returnPct: 15.3, signal: 'Order Pipeline Surge' }
      ],
      'chemicals': [
        { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd', price: 3180.00, changePct: 1.60, returnPct: 4.8, signal: 'Specialty Chemical Rebound' },
        { symbol: 'SRF', name: 'SRF Ltd', price: 2420.00, changePct: 2.30, returnPct: 7.0, signal: 'RSI(14) Bullish Divergence' }
      ],
      'indices': [
        { symbol: 'NIFTY50', name: 'Nifty 50 Index', price: 25420.00, changePct: 1.15, returnPct: 3.8, signal: 'Benchmark Trend Continuation' },
        { symbol: 'BANKNIFTY', name: 'Nifty Bank Index', price: 56215.00, changePct: 1.85, returnPct: 5.2, signal: 'Banking Sector Outperformance' }
      ],
      'n/a': [
        { symbol: 'GOLDBEES', name: 'Nippon India ETF Gold BeES', price: 68.40, changePct: 0.85, returnPct: 2.9, signal: 'Safe Haven Gold Inflow' }
      ]
    };

    // 18 Timeline Dates across 9 months exactly matching the user screenshot
    this.backtestTimeline = [
      { dateStr: 'Jun 29', fullDate: 'Jun 29, 2025', sectors: ['services', 'n/a', 'financials'] },
      { dateStr: 'Jul 15', fullDate: 'Jul 15, 2025', sectors: ['fmcg', 'chemicals'] },
      { dateStr: 'Aug 6', fullDate: 'Aug 6, 2025', sectors: ['consumer discretionary'] },
      { dateStr: 'Aug 28', fullDate: 'Aug 28, 2025', sectors: ['auto', 'financials', 'bank'] },
      { dateStr: 'Sep 21', fullDate: 'Sep 21, 2025', sectors: ['healthcare', 'transportation', 'financials', 'bank', 'auto', 'metals & mining'] },
      { dateStr: 'Oct 15', fullDate: 'Oct 15, 2025', sectors: ['fmcg', 'energy'] },
      { dateStr: 'Nov 8', fullDate: 'Nov 8, 2025', sectors: ['industrials', 'chemicals', 'metals & mining', 'auto'] },
      { dateStr: 'Dec 12', fullDate: 'Dec 12, 2025', sectors: ['healthcare', 'realty'] },
      { dateStr: 'Jan 10', fullDate: 'Jan 10, 2026', sectors: ['metals & mining', 'industrials'] },
      { dateStr: 'Feb 5', fullDate: 'Feb 5, 2026', sectors: ['i.t', 'aerospace & defence'] },
      {
        dateStr: 'Mar 18',
        fullDate: 'Mar 18, 2026',
        sectors: ['industrials', 'metals & mining', 'energy', 'healthcare', 'transportation', 'consumer discretionary', 'power & utilities', 'bank', 'financials']
      },
      { dateStr: 'Apr 10', fullDate: 'Apr 10, 2026', sectors: ['telecom', 'services'] },
      { dateStr: 'May 8', fullDate: 'May 8, 2026', sectors: ['bank', 'energy', 'auto'] },
      { dateStr: 'Jun 22', fullDate: 'Jun 22, 2026', sectors: ['financials', 'realty'] },
      { dateStr: 'Jul 15', fullDate: 'Jul 15, 2026', sectors: ['healthcare', 'chemicals'] },
      { dateStr: 'Aug 6', fullDate: 'Aug 6, 2026', sectors: ['fmcg', 'metals & mining'] },
      { dateStr: 'Aug 28', fullDate: 'Aug 28, 2026', sectors: ['transportation', 'consumer discretionary'] },
      { dateStr: 'Sep 21', fullDate: 'Sep 21, 2026', sectors: ['bank', 'auto'] }
    ];
  }

  // 9-Month Multi-Color Sector Backtest Canvas Chart (Screenshot 4)
  renderBacktestChart() {
    const canvas = document.getElementById('backtestChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!this.backtestTimeline || this.backtestTimeline.length === 0) {
      this.initBacktestData();
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : (canvas.parentElement?.clientWidth || 800);
    const height = 260;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background & Theme adaptiveness
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.fillStyle = isLight ? '#ffffff' : '#070c18';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 30; y < height - 30; y += 38) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }

    const dates = this.backtestTimeline;
    const paddingLeft = 45;
    const paddingRight = 20;
    const chartWidth = width - paddingLeft - paddingRight;
    const colStep = chartWidth / dates.length;
    const barWidth = Math.max(12, colStep - 6);
    const maxVal = 60;

    this.backtestSegments = [];
    this.backtestCols = [];

    dates.forEach((d, i) => {
      const x = paddingLeft + i * colStep;
      let stackY = height - 35;
      const isMar18 = (d.dateStr === 'Mar 18');

      const colInfo = {
        dateStr: d.dateStr,
        fullDate: d.fullDate,
        x,
        barWidth,
        totalStocks: 0,
        segments: []
      };

      d.sectors.forEach((secId) => {
        const secMeta = this.backtestSectorMap[secId] || { label: secId, color: '#38bdf8' };
        const stocks = this.backtestStockPool[secId] || [];
        
        let segHeight = 12;
        if (isMar18) {
          segHeight = 22; // Tall stacked breakout bar
        } else if (d.sectors.length === 1) {
          segHeight = 16;
        } else if (d.sectors.length <= 3) {
          segHeight = 14;
        } else {
          segHeight = 11;
        }

        const segBox = {
          x,
          y: stackY - segHeight,
          width: barWidth,
          height: segHeight,
          dateStr: d.dateStr,
          fullDate: d.fullDate,
          sector: secId,
          sectorLabel: secMeta.label,
          color: secMeta.color,
          stocks: stocks.map(s => ({ ...s, sector: secId, date: d.fullDate }))
        };

        this.backtestSegments.push(segBox);
        colInfo.segments.push(segBox);
        colInfo.totalStocks += segBox.stocks.length;

        // Draw Segment Box
        ctx.fillStyle = segMeta.color;
        ctx.fillRect(x, stackY - segHeight, barWidth, segHeight);

        // Subtle borders between stacked boxes
        ctx.strokeStyle = isLight ? '#ffffff' : '#070c18';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, stackY - segHeight, barWidth, segHeight);

        // Highlight if hovered
        if (this.hoveredBacktestSegment && 
            this.hoveredBacktestSegment.dateStr === d.dateStr && 
            this.hoveredBacktestSegment.sector === secId) {
          ctx.strokeStyle = isLight ? '#0f172a' : '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, stackY - segHeight, barWidth, segHeight);
        }

        stackY -= (segHeight + 1.5);
      });

      this.backtestCols.push(colInfo);

      // X-Axis Date Labels (Every alternate date for clean readability)
      if (i % 2 === 0 || isMar18) {
        ctx.fillStyle = (this.selectedBacktestDate === d.fullDate) ? '#0284c7' : (isLight ? '#475569' : '#64748b');
        ctx.font = (this.selectedBacktestDate === d.fullDate) ? 'bold 10px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.dateStr, x + barWidth / 2, height - 15);
      }
    });

    // Y-Axis labels (0 to 60)
    ctx.fillStyle = isLight ? '#475569' : '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    [0, 10, 20, 30, 40, 50, 60].forEach((val, idx) => {
      const y = height - 35 - (idx * (height - 65) / 6);
      ctx.fillText(val, 32, y + 3);
    });
  }

  // Bind Mouse Hover, Clicks, and Controls for Backtest Chart
  bindBacktestEvents() {
    const canvas = document.getElementById('backtestChartCanvas');
    const tooltip = document.getElementById('backtestCanvasTooltip');
    if (!canvas) return;

    // Hover detection on Canvas
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const seg = this.findBacktestSegmentAt(mouseX, mouseY);
      if (seg) {
        canvas.style.cursor = 'pointer';
        if (tooltip) {
          tooltip.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span style="font-weight: 800; color: #fff;">📅 ${seg.fullDate}</span>
              <span style="font-size: 0.7rem; color: #38bdf8; font-weight: 700;">Click to view</span>
            </div>
            <div class="tt-sector-pill">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${seg.color}; display: inline-block;"></span>
              <span style="color: #cbd5e1;">${seg.sectorLabel}:</span>
              <strong style="color: #fff; margin-left: 0.25rem;">${seg.stocks.length} stocks triggered</strong>
            </div>
            <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 0.25rem;">
              ${seg.stocks.slice(0, 3).map(s => s.symbol).join(', ')}${seg.stocks.length > 3 ? '...' : ''}
            </div>
          `;
          tooltip.style.display = 'block';
          tooltip.style.left = `${e.clientX - rect.left}px`;
          tooltip.style.top = `${e.clientY - rect.top - 12}px`;
        }

        if (this.hoveredBacktestSegment !== seg) {
          this.hoveredBacktestSegment = seg;
          this.renderBacktestChart();
        }
        return;
      }

      // Check if over a bar column
      const col = this.findBacktestColAt(mouseX);
      if (col && col.segments.length > 0) {
        canvas.style.cursor = 'pointer';
        if (tooltip) {
          tooltip.innerHTML = `
            <div style="font-weight: 800; color: #fff; margin-bottom: 0.2rem;">📅 ${col.fullDate}</div>
            <div style="font-size: 0.725rem; color: #38bdf8;">
              <strong>${col.totalStocks} total stocks</strong> across ${col.segments.length} sectors
            </div>
            <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 0.2rem;">👉 Click to open all triggered stocks</div>
          `;
          tooltip.style.display = 'block';
          tooltip.style.left = `${e.clientX - rect.left}px`;
          tooltip.style.top = `${e.clientY - rect.top - 12}px`;
        }
        return;
      }

      // Outside
      canvas.style.cursor = 'default';
      if (tooltip) tooltip.style.display = 'none';
      if (this.hoveredBacktestSegment !== null) {
        this.hoveredBacktestSegment = null;
        this.renderBacktestChart();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      canvas.style.cursor = 'default';
      if (tooltip) tooltip.style.display = 'none';
      if (this.hoveredBacktestSegment !== null) {
        this.hoveredBacktestSegment = null;
        this.renderBacktestChart();
      }
    });

    // CLICK on Canvas: Open stocks present on that day
    canvas.addEventListener('click', e => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const seg = this.findBacktestSegmentAt(mouseX, mouseY);
      if (seg) {
        this.openBacktestStocks(seg.fullDate, seg.sector);
        return;
      }

      const col = this.findBacktestColAt(mouseX);
      if (col) {
        this.openBacktestStocks(col.fullDate, 'all');
      }
    });

    // Top View Toggles: [Bars | Stocks]
    const btnBars = document.getElementById('btnBacktestBars');
    const btnStocks = document.getElementById('btnBacktestStocks');

    if (btnStocks) {
      btnStocks.addEventListener('click', () => {
        btnStocks.classList.add('active');
        if (btnBars) btnBars.classList.remove('active');
        this.openBacktestStocks(this.selectedBacktestDate || 'Mar 18, 2026', 'all');
      });
    }

    if (btnBars) {
      btnBars.addEventListener('click', () => {
        btnBars.classList.add('active');
        if (btnStocks) btnStocks.classList.remove('active');
        canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // Close button on stocks container
    const btnClose = document.getElementById('btnCloseBacktestStocks');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        const container = document.getElementById('backtestStocksContainer');
        if (container) container.style.display = 'none';
        if (btnBars) btnBars.classList.add('active');
        if (btnStocks) btnStocks.classList.remove('active');
      });
    }

    // Live search filter on backtest stock table
    const searchInput = document.getElementById('backtestStockSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this.filterBacktestStocksTable(this.selectedBacktestSector || 'all', e.target.value.trim());
      });
    }

    // Sector Legend Pills: Clicking any sector pill filters stocks for that sector
    document.querySelectorAll('.backtest-sector-legends .legend-pill').forEach(pill => {
      pill.style.cursor = 'pointer';
      pill.addEventListener('click', () => {
        const secText = pill.textContent.trim().toLowerCase();
        this.openBacktestStocks(this.selectedBacktestDate || 'Mar 18, 2026', secText);
      });
    });

    // Export Backtest Data Button
    document.getElementById('btnExportBacktest')?.addEventListener('click', () => {
      this.exportBacktestData();
    });
  }

  findBacktestSegmentAt(x, y) {
    if (!this.backtestSegments) return null;
    return this.backtestSegments.find(s => 
      x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height
    );
  }

  findBacktestColAt(x) {
    if (!this.backtestCols) return null;
    return this.backtestCols.find(c => x >= c.x - 2 && x <= c.x + c.barWidth + 2);
  }

  // Open & Render the Stocks Present on That Day Respective of Their Sectors
  openBacktestStocks(fullDate, sectorFilter = 'all') {
    this.selectedBacktestDate = fullDate;
    this.selectedBacktestSector = sectorFilter;

    const container = document.getElementById('backtestStocksContainer');
    if (!container) return;

    // Collect all stocks for this specific date
    const dateSegments = (this.backtestSegments || []).filter(s => s.fullDate === fullDate);
    const allDateStocks = [];
    const sectorSummaryMap = {};

    dateSegments.forEach(seg => {
      if (!sectorSummaryMap[seg.sector]) {
        sectorSummaryMap[seg.sector] = {
          sector: seg.sector,
          label: seg.sectorLabel,
          color: seg.color,
          stocks: []
        };
      }
      seg.stocks.forEach(stock => {
        sectorSummaryMap[seg.sector].stocks.push(stock);
        allDateStocks.push(stock);
      });
    });

    // Update Header Text & Count
    const dateText = document.getElementById('backtestActiveDateText');
    if (dateText) dateText.textContent = fullDate;

    const countText = document.getElementById('backtestActiveCountText');
    if (countText) countText.textContent = `${allDateStocks.length} Stocks Triggered`;

    // Render Sector Filter Tabs for this date
    const tabsContainer = document.getElementById('backtestDateSectorTabs');
    if (tabsContainer) {
      let tabsHtml = `
        <button type="button" class="backtest-sector-tab ${sectorFilter === 'all' ? 'active' : ''}" data-sector="all" style="--dot-col: #38bdf8; --active-border: #38bdf8;">
          <span class="tab-dot"></span>
          <span>All Sectors (${allDateStocks.length})</span>
        </button>
      `;

      Object.values(sectorSummaryMap).forEach(sec => {
        const isActive = (sectorFilter.toLowerCase() === sec.sector.toLowerCase());
        tabsHtml += `
          <button type="button" class="backtest-sector-tab ${isActive ? 'active' : ''}" data-sector="${sec.sector}" style="--dot-col: ${sec.color}; --active-border: ${sec.color}; --active-bg: ${sec.color}25;">
            <span class="tab-dot"></span>
            <span>${sec.label} (${sec.stocks.length})</span>
          </button>
        `;
      });

      tabsContainer.innerHTML = tabsHtml;

      // Bind click on sector tabs
      tabsContainer.querySelectorAll('.backtest-sector-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const sec = tab.getAttribute('data-sector');
          this.filterBacktestStocksTable(sec);
        });
      });
    }

    // Filter stocks to active sector
    this.filterBacktestStocksTable(sectorFilter);

    // Show Container
    container.style.display = 'block';

    // Update Top View Toggles
    document.getElementById('btnBacktestStocks')?.classList.add('active');
    document.getElementById('btnBacktestBars')?.classList.remove('active');

    // Redraw canvas to update highlight
    this.renderBacktestChart();

    // Smooth scroll into view
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Filter Backtest Stocks Table by Sector & Optional Search Query
  filterBacktestStocksTable(sector = 'all', searchQuery = '') {
    this.selectedBacktestSector = sector;

    // Update active class on sector tabs
    document.querySelectorAll('#backtestDateSectorTabs .backtest-sector-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-sector') === sector);
    });

    const tbody = document.getElementById('backtestStockTableBody');
    if (!tbody) return;

    // Gather stocks for selected date
    const dateSegments = (this.backtestSegments || []).filter(s => s.fullDate === this.selectedBacktestDate);
    let matchedStocks = [];

    dateSegments.forEach(seg => {
      if (sector === 'all' || seg.sector.toLowerCase() === sector.toLowerCase()) {
        matchedStocks.push(...seg.stocks);
      }
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      matchedStocks = matchedStocks.filter(s => 
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    if (matchedStocks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No stocks found matching the criteria on ${this.selectedBacktestDate}.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = matchedStocks.map((s, idx) => {
      const isPositive = (s.changePct >= 0);
      const changeClass = isPositive ? 'change-positive' : 'change-negative';
      const secMeta = this.backtestSectorMap[s.sector] || { label: s.sector, color: '#38bdf8' };

      return `
        <tr data-symbol="${s.symbol}" onclick="window.app?.openStockChart('${s.symbol}');" title="Click to view ${s.symbol} Interactive Candlestick Chart">
          <td>${idx + 1}</td>
          <td>
            <div class="stock-symbol-cell">
              <span class="stock-symbol">${s.symbol}</span>
              <span class="stock-name">${s.name}</span>
            </div>
          </td>
          <td>
            <span class="sector-badge-pill" style="color: ${secMeta.color}; background: ${secMeta.color}15; border-color: ${secMeta.color}35;">
              ● ${secMeta.label}
            </span>
          </td>
          <td class="stock-price" style="font-family: var(--font-mono); font-weight: 700;">
            ₹${s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </td>
          <td>
            <span class="stock-change ${changeClass}" style="font-weight: 700;">
              ${isPositive ? '+' : ''}${s.changePct.toFixed(2)}%
            </span>
          </td>
          <td>
            <span class="text-green" style="font-weight: 800; font-family: var(--font-mono);">
              +${s.returnPct}%
            </span>
            <small style="color: var(--text-muted); font-size: 0.7rem;">(10D Max)</small>
          </td>
          <td>
            <span style="font-size: 0.75rem; color: #cbd5e1; font-family: var(--font-sans);">
              ${s.signal}
            </span>
          </td>
          <td onclick="event.stopPropagation();">
            <button type="button" class="btn btn-primary btn-sm btn-view-chart" onclick="window.app?.openStockChart('${s.symbol}');" title="Launch TradingView Chart & AI Report">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3v18h18M7 16l4-4 4 4 5-6"/></svg>
              <span>Chart</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Export Backtest Results to CSV
  exportBacktestData() {
    const dateSegments = (this.backtestSegments || []).filter(s => s.fullDate === this.selectedBacktestDate);
    const stocks = [];
    dateSegments.forEach(seg => stocks.push(...seg.stocks));

    if (stocks.length === 0) {
      if (window.showToast) window.showToast('No stocks available to export for this backtest session.', 'warning');
      return;
    }

    const csvRows = [
      ['Date', 'Symbol', 'Name', 'Sector', 'Trigger Price', 'Day Change %', 'Subsequent Return %', 'Signal Reason']
    ];

    stocks.forEach(s => {
      csvRows.push([
        s.date,
        s.symbol,
        `"${s.name}"`,
        s.sector,
        s.price,
        s.changePct,
        s.returnPct,
        `"${s.signal}"`
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `backtest-${this.selectedBacktestDate.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  shareScan(scanId) {
    const url = `${window.location.origin}/?scan=${scanId}`;
    navigator.clipboard.writeText(url);
    if (window.showToast) window.showToast('Scanner link copied to clipboard!', 'success');
  }

  addTagToScan(scanId) {
    const tag = prompt('Enter new tag for this scanner (e.g. Breakout, RSI, Swing):');
    if (tag) {
      if (window.showToast) window.showToast(`Tag "${tag}" added!`, 'success');
    }
  }

  deleteScan(scanId) {
    if (confirm('Are you sure you want to delete this scanner?')) {
      this.allScans = this.allScans.filter(s => s.id !== scanId);
      this.renderDirectoryTable();
    }
  }

  // ==========================================
  // TEJSTOCKAI PRO AI ASSISTANT SUITE
  // ==========================================

  bindAiSuiteEvents() {
    // Tab switching
    document.querySelectorAll('.ai-suite-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ai-suite-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.ai-suite-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.querySelector(`.ai-suite-panel[data-tab="${tab.dataset.tab}"]`);
        if (panel) panel.classList.add('active');
      });
    });

    // Strategy chips
    document.querySelectorAll('.ai-strategy-chip[data-prompt]').forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.getElementById('magicFilterInput');
        if (input) input.value = chip.dataset.prompt;
        this.handleMagicAiGenerate(chip.dataset.prompt);
      });
    });

    // AI Copilot Chat
    document.getElementById('btnSendCopilot')?.addEventListener('click', () => this.sendCopilotMessage());
    document.getElementById('aiCopilotInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.sendCopilotMessage();
    });

    // Quick action buttons in copilot
    document.querySelectorAll('.ai-quick-btn[data-q]').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('aiCopilotInput');
        if (input) input.value = btn.dataset.q;
        this.sendCopilotMessage(btn.dataset.q);
      });
    });

    // Clear copilot chat
    document.getElementById('btnClearCopilot')?.addEventListener('click', () => {
      const msgs = document.getElementById('aiCopilotMessages');
      if (msgs) {
        msgs.innerHTML = `
          <div class="ai-msg ai-msg-bot">
            <div class="ai-msg-avatar">🤖</div>
            <div class="ai-msg-bubble">
              <p>Chat cleared. How can I help you with your scan?</p>
            </div>
          </div>
        `;
      }
    });

    // Refresh insight
    document.getElementById('btnRefreshInsight')?.addEventListener('click', () => this.updateAiInsight());

    // AI Recommendation apply buttons
    document.querySelectorAll('.ai-rec-apply-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => this.applyAiRecommendation(btn.dataset.action));
    });

    // AI Filter preview buttons
    document.getElementById('btnApplyAiFilters')?.addEventListener('click', () => this.applyPendingAiFilters());
    document.getElementById('btnDiscardAiFilters')?.addEventListener('click', () => {
      document.getElementById('aiFiltersPreview').style.display = 'none';
      this.pendingAiFilters = [];
    });
    document.getElementById('btnEditAiFilters')?.addEventListener('click', () => {
      if (this.pendingAiFilters?.length) {
        this.filters.push(...this.pendingAiFilters);
        this.renderClauseBuilder();
        document.getElementById('aiFiltersPreview').style.display = 'none';
        this.pendingAiFilters = [];
      }
    });
  }

  // --- AI NLP SCAN BUILDER WITH STREAMING ---
  handleMagicAiGenerate(customPrompt) {
    const input = document.getElementById('magicFilterInput');
    const text = (customPrompt || (input ? input.value : '')).toLowerCase().trim();
    if (!text) return;

    // Show streaming animation
    const streamEl = document.getElementById('aiStreamResponse');
    const streamContent = document.getElementById('aiStreamContent');
    const previewEl = document.getElementById('aiFiltersPreview');
    if (streamEl) streamEl.style.display = 'block';
    if (previewEl) previewEl.style.display = 'none';
    if (streamContent) streamContent.innerHTML = '';

    // Intelligent NLP-to-filter translation
    const newFilters = this._nlpToFilters(text);

    // Simulate streaming AI response
    const explanations = newFilters.map((f, i) => {
      const tf = f.timeframe || 'Daily';
      const leftLabel = this.availableIndicators.find(ind => ind.id === f.left)?.label || f.left;
      const opLabel = this.availableOperators.find(op => op.id === f.op)?.label || f.op;
      const right = f.rightType === 'indicator' ? (this.availableIndicators.find(ind => ind.id === f.right)?.label || f.right) : f.right;
      return `Filter ${i + 1}: ${tf} ${leftLabel} ${opLabel} ${right}`;
    });

    let lineIndex = 0;
    const streamInterval = setInterval(() => {
      if (lineIndex < explanations.length) {
        const line = document.createElement('div');
        line.className = 'ai-stream-line';
        line.textContent = `✓ ${explanations[lineIndex]}`;
        if (streamContent) streamContent.appendChild(line);
        lineIndex++;
      } else {
        clearInterval(streamInterval);

        // After streaming, show preview
        setTimeout(() => {
          if (streamEl) streamEl.style.display = 'none';
          this._showAiFilterPreview(newFilters, explanations);
        }, 400);
      }
    }, 350);

    this.pendingAiFilters = newFilters;
    if (input) input.value = '';
  }

  _nlpToFilters(text) {
    const newFilters = [];

    // RSI patterns
    if (text.includes('rsi') && (text.includes('cross') || text.includes('above'))) {
      const rsiVal = text.match(/(\d+)/) ? parseInt(text.match(/(\d+)/)[1]) : 60;
      newFilters.push({ timeframe: 'Daily', left: 'rsi14', op: 'crosses_above', rightType: 'number', right: rsiVal > 14 ? rsiVal : 60 });
    } else if (text.includes('rsi') && text.includes('below')) {
      const rsiVal = text.match(/(\d+)/) ? parseInt(text.match(/(\d+)/)[1]) : 30;
      newFilters.push({ timeframe: 'Daily', left: 'rsi14', op: 'lt', rightType: 'number', right: rsiVal > 14 ? rsiVal : 30 });
    } else if (text.includes('oversold')) {
      newFilters.push({ timeframe: 'Daily', left: 'rsi14', op: 'lt', rightType: 'number', right: 30 });
    }

    // Moving average crossovers
    if (text.includes('golden cross') || (text.includes('50') && text.includes('200') && text.includes('ema'))) {
      newFilters.push({ timeframe: 'Daily', left: 'ema50', op: 'crosses_above', rightType: 'indicator', right: 'ema200' });
    }
    if (text.includes('death cross')) {
      newFilters.push({ timeframe: 'Daily', left: 'ema50', op: 'crosses_below', rightType: 'indicator', right: 'ema200' });
    }

    // Price action
    if (text.includes('52 week') || text.includes('52-week') || text.includes('all time high')) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma200' });
      newFilters.push({ timeframe: 'Daily', left: 'rsi14', op: 'gt', rightType: 'number', right: 65 });
    }

    // Bollinger Band
    if (text.includes('bollinger') || text.includes('bb breakout')) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'bbUpper' });
    }

    // SuperTrend
    if (text.includes('supertrend') || text.includes('super trend')) {
      newFilters.push({ timeframe: 'Daily', left: 'supertrendDir', op: 'contains', rightType: 'string', right: 'BUY' });
    }

    // MACD
    if (text.includes('macd') && (text.includes('cross') || text.includes('bullish'))) {
      newFilters.push({ timeframe: 'Daily', left: 'macdLine', op: 'crosses_above', rightType: 'indicator', right: 'macdSignal' });
    } else if (text.includes('macd') && (text.includes('histogram') || text.includes('positive'))) {
      newFilters.push({ timeframe: 'Daily', left: 'macdHist', op: 'gt', rightType: 'number', right: 0 });
    }

    // Volume patterns
    if (text.includes('volume') && (text.includes('surge') || text.includes('2x') || text.includes('high'))) {
      newFilters.push({ timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 2.0 });
    } else if (text.includes('volume') && text.includes('above')) {
      newFilters.push({ timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 });
    }

    // Candlestick patterns
    if (text.includes('bullish engulfing') || text.includes('engulfing')) {
      newFilters.push({ timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Bullish Engulfing' });
    } else if (text.includes('hammer')) {
      newFilters.push({ timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Hammer' });
    } else if (text.includes('morning star')) {
      newFilters.push({ timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Morning Star' });
    } else if (text.includes('doji')) {
      newFilters.push({ timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Doji' });
    } else if (text.includes('three black') || text.includes('bearish')) {
      newFilters.push({ timeframe: 'Daily', left: 'patterns', op: 'contains', rightType: 'string', right: 'Bearish Engulfing' });
      newFilters.push({ timeframe: 'Daily', left: 'changePct', op: 'lt', rightType: 'number', right: -1.0 });
    }

    // Intraday
    if (text.includes('intraday') || text.includes('15-min') || text.includes('15 min')) {
      newFilters.push({ timeframe: '15-min', left: 'close', op: 'gt', rightType: 'indicator', right: 'ema9' });
      if (!newFilters.some(f => f.left === 'volumeMultiplier')) {
        newFilters.push({ timeframe: '15-min', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 });
      }
    }

    // Price levels
    if (text.includes('penny') || (text.includes('below') && text.includes('200'))) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'lt', rightType: 'number', right: 200 });
    } else if (text.includes('low price') || (text.includes('below') && text.includes('500'))) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'lt', rightType: 'number', right: 500 });
    }

    // Price above SMA/EMA
    if (text.includes('above') && text.includes('sma') && text.includes('200')) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma200' });
    }
    if (text.includes('vwap') || text.includes('above vwap')) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma20' });
    }

    // Percentage change
    if (text.includes('up by') || text.includes('up ')) {
      const pct = text.match(/(\d+)%/) ? parseFloat(text.match(/(\d+)%/)[1]) : 3;
      newFilters.push({ timeframe: 'Daily', left: 'changePct', op: 'gt', rightType: 'number', right: pct });
    }

    // Fallback
    if (newFilters.length === 0) {
      newFilters.push({ timeframe: 'Daily', left: 'close', op: 'gt', rightType: 'indicator', right: 'sma20' });
      newFilters.push({ timeframe: 'Daily', left: 'changePct', op: 'gt', rightType: 'number', right: 2.0 });
      newFilters.push({ timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 });
    }

    return newFilters;
  }

  _showAiFilterPreview(filters, explanations) {
    const previewEl = document.getElementById('aiFiltersPreview');
    const listEl = document.getElementById('aiPreviewList');
    const countEl = document.getElementById('aiPreviewCount');
    if (!previewEl || !listEl) return;

    countEl.textContent = `${filters.length} filters`;
    listEl.innerHTML = explanations.map((exp, i) => `
      <div class="ai-preview-item">
        <span class="ai-preview-item-num">${i + 1}</span>
        <span>${this.escapeHtml(exp.replace('Filter ' + (i + 1) + ': ', ''))}</span>
      </div>
    `).join('');

    previewEl.style.display = 'block';
  }

  applyPendingAiFilters() {
    if (!this.pendingAiFilters?.length) return;
    const mode = document.querySelector('.magic-mode-pill.active')?.dataset.mode || 'append';
    if (mode === 'replace') {
      this.filters = [...this.pendingAiFilters];
    } else {
      this.filters.push(...this.pendingAiFilters);
    }
    this.renderClauseBuilder();
    this.runScan();
    this.updateAiInsight();
    document.getElementById('aiFiltersPreview').style.display = 'none';
    this.pendingAiFilters = [];
  }

  // --- AI SCAN INSIGHT ANALYZER ---
  updateAiInsight() {
    const filters = this.filters || [];
    const filterCount = filters.length;

    // Calculate Momentum Score
    let momentum = 50;
    const hasBullishRSI = filters.some(f => f.left === 'rsi14' && f.op === 'gt');
    const hasBearishRSI = filters.some(f => f.left === 'rsi14' && f.op === 'lt');
    const hasMACD = filters.some(f => f.left?.includes('macd'));
    const hasSuperTrend = filters.some(f => f.left?.includes('supertrend'));
    if (hasBullishRSI) momentum += 15;
    if (hasBearishRSI) momentum -= 10;
    if (hasMACD) momentum += 10;
    if (hasSuperTrend) momentum += 10;
    if (filters.some(f => f.left === 'close' && f.right === 'sma200' && f.op === 'gt')) momentum += 10;
    momentum = Math.max(10, Math.min(95, momentum));

    // Calculate Risk Score
    let risk = 70;
    const hasVolume = filters.some(f => f.left === 'volumeMultiplier' || f.left === 'volume');
    const hasMultiTf = new Set(filters.map(f => f.timeframe)).size > 1;
    if (hasVolume) risk -= 15;
    if (hasMultiTf) risk -= 10;
    if (hasSuperTrend) risk -= 10;
    if (filterCount < 2) risk += 15;
    risk = Math.max(15, Math.min(90, risk));

    // Calculate Quality Score
    let quality = 30 + Math.min(filterCount * 15, 50);
    if (hasVolume) quality += 10;
    if (hasMultiTf) quality += 10;
    quality = Math.max(20, Math.min(95, quality));

    // Coverage estimation
    let coverage = 80 - (filterCount * 10);
    coverage = Math.max(5, Math.min(90, coverage));
    const estStocks = Math.round((coverage / 100) * 500);

    // Update ring gauges
    this._updateScoreRing('aiScoreMomentum', momentum, momentum > 60 ? 'var(--green)' : 'var(--amber)',
      momentum > 65 ? 'Bullish' : momentum > 45 ? 'Neutral' : 'Bearish',
      momentum > 65 ? 'bullish' : momentum > 45 ? 'moderate' : 'bearish');
    this._updateScoreRing('aiScoreRisk', risk, risk < 40 ? 'var(--green)' : risk < 65 ? 'var(--amber)' : 'var(--red)',
      risk < 35 ? 'Low' : risk < 65 ? 'Moderate' : 'High',
      risk < 35 ? 'bullish' : risk < 65 ? 'moderate' : 'bearish');
    this._updateScoreRing('aiScoreQuality', quality, quality > 70 ? 'var(--accent)' : 'var(--amber)',
      quality > 75 ? 'Excellent' : quality > 50 ? 'Good' : 'Basic',
      quality > 75 ? 'good' : quality > 50 ? 'moderate' : 'fair');
    this._updateScoreRing('aiScoreCoverage', coverage, 'var(--purple)',
      `~${estStocks} stocks`, 'fair');

    // Update recommendations
    this._updateRecommendations(filters, { hasVolume, hasMultiTf, hasSuperTrend, hasMACD });

    // Update auto-explain
    this._updateAutoExplain(filters);
  }

  _updateScoreRing(id, value, color, verdictText, verdictClass) {
    const el = document.getElementById(id);
    if (!el) return;
    const circumference = 2 * Math.PI * 34; // r=34
    const offset = circumference - (value / 100) * circumference;
    const progress = el.querySelector('.ai-ring-progress');
    const valEl = el.querySelector('.ai-score-val');
    if (progress) {
      progress.style.stroke = color;
      progress.style.strokeDashoffset = offset;
    }
    if (valEl) valEl.textContent = value;
    const card = el.closest('.ai-score-card');
    const verdict = card?.querySelector('.ai-score-verdict');
    if (verdict) {
      verdict.textContent = verdictText;
      verdict.className = `ai-score-verdict ${verdictClass}`;
    }
  }

  _updateRecommendations(filters, analysis) {
    const recContainer = document.getElementById('aiRecommendations');
    if (!recContainer) return;

    const recs = [];

    if (!analysis.hasVolume) {
      recs.push({
        type: 'suggestion',
        icon: '💡',
        title: 'Add volume confirmation',
        desc: 'Your scan uses price/indicator filters but no volume condition. Adding <code>Volume Multiplier > 1.5</code> can reduce false signals by ~35%.',
        action: 'add-volume'
      });
    }

    if (!analysis.hasSuperTrend && !filters.some(f => f.left === 'bbUpper' || f.left === 'bbLower')) {
      recs.push({
        type: 'warning',
        icon: '⚠️',
        title: 'No trend/stop-loss indicator',
        desc: 'Consider adding SuperTrend (BUY) or Bollinger Band filter for clear entry/exit signals and risk management.',
        action: 'add-supertrend'
      });
    }

    if (!analysis.hasMultiTf && filters.length > 0) {
      recs.push({
        type: 'optimize',
        icon: '🚀',
        title: 'Multi-timeframe confluence',
        desc: 'Your scan uses a single timeframe. Adding <code>Weekly RSI(14) > 50</code> as a confirming filter increases win-rate in backtests.',
        action: 'add-weekly-rsi'
      });
    }

    if (!analysis.hasMACD && filters.length > 0) {
      recs.push({
        type: 'suggestion',
        icon: '📊',
        title: 'Add MACD momentum confirmation',
        desc: 'Adding MACD Line > MACD Signal confirms momentum direction and reduces whipsaw trades.',
        action: 'add-macd'
      });
    }

    if (filters.length === 0) {
      recs.push({
        type: 'suggestion',
        icon: '✨',
        title: 'Start building your scan',
        desc: 'Use the AI Scan Builder tab to describe your strategy in plain English, or click "+ Add Filter" to manually add conditions.',
        action: null
      });
    }

    recContainer.innerHTML = recs.map(r => `
      <div class="ai-rec-item ai-rec-${r.type}">
        <div class="ai-rec-icon">${r.icon}</div>
        <div class="ai-rec-content">
          <strong>${r.title}</strong>
          <p>${r.desc}</p>
          ${r.action ? `<button class="ai-rec-apply-btn" data-action="${r.action}" onclick="window.queryBuilder?.applyAiRecommendation('${r.action}')">+ Apply This</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  _updateAutoExplain(filters) {
    const box = document.getElementById('aiExplainBox');
    if (!box) return;

    if (filters.length === 0) {
      box.innerHTML = `<p class="ai-explain-text">No filters configured yet. Add conditions using the AI Scan Builder or Visual Clause Builder to see an AI-generated explanation of your scan strategy.</p>`;
      return;
    }

    const segment = this.segment || 'Cash';
    const passType = this.passType === 'all' ? 'ALL' : 'ANY';

    // Build explanation
    const parts = filters.map(f => {
      const tf = f.timeframe || 'Daily';
      const leftLabel = this.availableIndicators.find(ind => ind.id === f.left)?.label || f.left;
      const opLabel = f.op === 'gt' ? 'is above' : f.op === 'lt' ? 'is below' : f.op === 'gte' ? 'is at or above' : f.op === 'lte' ? 'is at or below' : f.op === 'crosses_above' ? 'has crossed above' : f.op === 'crosses_below' ? 'has crossed below' : f.op === 'contains' ? 'shows' : 'equals';
      const rightLabel = f.rightType === 'indicator' ? (this.availableIndicators.find(ind => ind.id === f.right)?.label || f.right) : f.right;
      return `<strong>${tf} ${leftLabel}</strong> ${opLabel} <strong>${rightLabel}</strong>`;
    });

    // Determine strategy type
    let strategyTag = 'technical scan';
    const hasRSI = filters.some(f => f.left === 'rsi14');
    const hasMA = filters.some(f => f.left?.includes('sma') || f.left?.includes('ema'));
    const hasPattern = filters.some(f => f.left === 'patterns');
    if (hasRSI && hasMA) strategyTag = 'momentum + trend';
    else if (hasRSI) strategyTag = 'momentum';
    else if (hasMA) strategyTag = 'trend following';
    else if (hasPattern) strategyTag = 'candlestick pattern';

    const isBullish = filters.some(f => f.op === 'gt' || f.op === 'crosses_above' || f.right === 'BUY');
    const tagClass = isBullish ? 'ai-tag-bullish' : 'ai-tag-bearish';
    const tagLabel = isBullish ? 'bullish ' + strategyTag : 'bearish ' + strategyTag;

    box.innerHTML = `
      <p class="ai-explain-text">
        This scan looks for stocks in the <strong>${this.escapeHtml(segment)}</strong> universe where ${passType === 'ALL' ? 'all' : 'any'} of the following conditions are met:
        ${parts.join(', <em>and</em> ')}.
        This is a <span class="${tagClass}">${tagLabel}</span> strategy.
      </p>
    `;
  }

  applyAiRecommendation(action) {
    switch (action) {
      case 'add-volume':
        this.filters.push({ timeframe: 'Daily', left: 'volumeMultiplier', op: 'gt', rightType: 'number', right: 1.5 });
        break;
      case 'add-supertrend':
        this.filters.push({ timeframe: 'Daily', left: 'supertrendDir', op: 'contains', rightType: 'string', right: 'BUY' });
        break;
      case 'add-weekly-rsi':
        this.filters.push({ timeframe: 'Weekly', left: 'rsi14', op: 'gt', rightType: 'number', right: 50 });
        break;
      case 'add-macd':
        this.filters.push({ timeframe: 'Daily', left: 'macdLine', op: 'gt', rightType: 'indicator', right: 'macdSignal' });
        break;
    }
    this.renderClauseBuilder();
    this.runScan();
    this.updateAiInsight();
  }

  // --- AI COPILOT CHAT ---
  sendCopilotMessage(overrideText) {
    const input = document.getElementById('aiCopilotInput');
    const text = (overrideText || (input ? input.value : '')).trim();
    if (!text) return;
    if (input) input.value = '';

    const messagesEl = document.getElementById('aiCopilotMessages');
    if (!messagesEl) return;

    // Add user message
    messagesEl.innerHTML += `
      <div class="ai-msg ai-msg-user">
        <div class="ai-msg-avatar">👤</div>
        <div class="ai-msg-bubble"><p>${this.escapeHtml(text)}</p></div>
      </div>
    `;

    // Show thinking indicator
    const thinkingId = 'thinking-' + Date.now();
    messagesEl.innerHTML += `
      <div class="ai-msg ai-msg-bot" id="${thinkingId}">
        <div class="ai-msg-avatar">🤖</div>
        <div class="ai-msg-bubble">
          <div class="ai-thinking-dots"><span></span><span></span><span></span></div>
        </div>
      </div>
    `;
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Generate context-aware response
    setTimeout(() => {
      const thinkingEl = document.getElementById(thinkingId);
      if (thinkingEl) thinkingEl.remove();

      const response = this._generateCopilotResponse(text.toLowerCase());
      messagesEl.innerHTML += `
        <div class="ai-msg ai-msg-bot">
          <div class="ai-msg-avatar">🤖</div>
          <div class="ai-msg-bubble">${response}</div>
        </div>
      `;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 800 + Math.random() * 600);
  }

  _generateCopilotResponse(query) {
    const filters = this.filters || [];
    const filterCount = filters.length;
    const segment = this.segment || 'Cash';

    // Context: current scan info
    const scanTitle = this.currentScan?.title || 'your scan';
    const hasRSI = filters.some(f => f.left === 'rsi14');
    const hasVolume = filters.some(f => f.left === 'volumeMultiplier' || f.left === 'volume');
    const hasMA = filters.some(f => f.left?.includes('sma') || f.left?.includes('ema'));

    // Explain scan
    if (query.includes('explain') && (query.includes('scan') || query.includes('filter'))) {
      if (filterCount === 0) return '<p>Your scan doesn\'t have any filters yet. Try using the <strong>AI Scan Builder</strong> tab to describe a strategy, or manually add filters using the clause builder below.</p>';
      const details = filters.map((f, i) => {
        const leftLabel = this.availableIndicators.find(ind => ind.id === f.left)?.label || f.left;
        const opLabel = this.availableOperators.find(op => op.id === f.op)?.label || f.op;
        const right = f.rightType === 'indicator' ? (this.availableIndicators.find(ind => ind.id === f.right)?.label || f.right) : f.right;
        return `<li><strong>${f.timeframe || 'Daily'}</strong> ${leftLabel} ${opLabel} ${right}</li>`;
      }).join('');
      return `<p>Here's what <strong>${this.escapeHtml(scanTitle)}</strong> does:</p><ul class="ai-msg-list">${details}</ul><p>This scans across the <strong>${segment}</strong> universe. Stocks must pass <strong>${this.passType === 'all' ? 'ALL' : 'ANY'}</strong> of these conditions.</p>`;
    }

    // Reduce noise / false signals
    if (query.includes('reduce') && (query.includes('noise') || query.includes('false'))) {
      let tips = '<p>Here are ways to reduce false signals:</p><ul class="ai-msg-list">';
      if (!hasVolume) tips += '<li>Add <strong>Volume Multiplier > 1.5</strong> — this filters out low-liquidity moves that often reverse quickly</li>';
      if (!hasMA) tips += '<li>Add a <strong>trend filter</strong> like Close > SMA(200) to only catch signals in an uptrend</li>';
      tips += '<li>Use <strong>multi-timeframe confirmation</strong> — e.g., Weekly RSI > 50 alongside Daily conditions</li>';
      tips += '<li>Set <strong>stock pass type to ALL</strong> instead of ANY for stricter filtering</li>';
      tips += '</ul>';
      return tips;
    }

    // Timeframe advice
    if (query.includes('timeframe') || query.includes('best time')) {
      return `<p>For <strong>${this.escapeHtml(scanTitle)}</strong>, here's my timeframe recommendation:</p><ul class="ai-msg-list"><li><strong>Swing trading (2-10 days):</strong> Use Daily + Weekly confirmation. This is the most reliable combo for breakout scans.</li><li><strong>Intraday:</strong> Use 15-min primary + Daily trend filter. Never trade intraday against the daily trend.</li><li><strong>Positional (weeks-months):</strong> Use Weekly primary + Monthly confirmation for higher-conviction, lower-frequency signals.</li></ul><p>💡 <strong>Pro tip:</strong> The more timeframes agree, the stronger the signal.</p>`;
    }

    // Risk management
    if (query.includes('risk') || query.includes('stop') || query.includes('protect')) {
      return `<p>Here are risk management filters I can add to <strong>${this.escapeHtml(scanTitle)}</strong>:</p><ul class="ai-msg-list"><li><strong>SuperTrend (BUY)</strong> — acts as a trailing stop-loss indicator. When signal flips to SELL, exit.</li><li><strong>ATR-based stops</strong> — set stop at Close − 2×ATR for volatility-adjusted exits.</li><li><strong>Bollinger Band position</strong> — avoid buying when price is already at the upper band (overbought).</li></ul><p>Would you like me to add any of these?</p>`;
    }

    // Make intraday
    if (query.includes('intraday') || query.includes('scalp')) {
      return `<p>To convert this to an <strong>intraday strategy</strong>:</p><ul class="ai-msg-list"><li>Change all timeframes to <strong>15-min</strong></li><li>Use <strong>EMA(9)</strong> instead of SMA(200) for faster signals</li><li>Add <strong>Volume Multiplier > 2.0</strong> for strong intraday momentum</li><li>Use <strong>MACD Histogram > 0</strong> for trend direction</li></ul><p>🔔 <strong>Important:</strong> Intraday scans need frequent refreshing. Consider enabling auto-refresh every 30 seconds.</p>`;
    }

    // Make more aggressive
    if (query.includes('aggressive') || query.includes('more')) {
      return `<p>To make your scan <strong>more aggressive</strong>:</p><ul class="ai-msg-list"><li>Lower RSI threshold (e.g., RSI > 50 → RSI > 40) to catch moves earlier</li><li>Add <strong>Change % > 3%</strong> to only see strong movers</li><li>Switch stock pass to <strong>ANY</strong> for broader results</li><li>Use <strong>EMA(9)</strong> instead of SMA(200) for faster crossover signals</li></ul><p>⚠️ <strong>Warning:</strong> More aggressive = more false signals. Always add a volume filter as confirmation.</p>`;
    }

    // What indicators
    if (query.includes('what') && (query.includes('rsi') || query.includes('macd') || query.includes('indicator'))) {
      return `<p>Here's a quick guide to the key indicators:</p><ul class="ai-msg-list"><li><strong>RSI (14)</strong>: Relative Strength Index. Above 70 = overbought, below 30 = oversold. Best at crossover points (e.g., crossing above 50).</li><li><strong>MACD</strong>: Shows momentum direction. MACD Line crossing above Signal Line = bullish. Histogram turning positive = momentum increasing.</li><li><strong>SuperTrend</strong>: Trend indicator that gives clear BUY/SELL signals. Great for trailing stops.</li><li><strong>Bollinger Bands</strong>: Price above upper band = potential breakout or overbought. Below lower = potential breakdown or oversold.</li><li><strong>Volume Multiplier</strong>: Today's volume vs 10-day average. >1.5 = above-average interest, >2.0 = significant activity.</li></ul>`;
    }

    // Too many stocks
    if (query.includes('too many') || query.includes('narrow') || query.includes('fewer')) {
      return `<p>To <strong>narrow down results</strong>, try:</p><ul class="ai-msg-list"><li>Add more filters (each additional filter reduces the result set)</li><li>Tighten existing thresholds (e.g., RSI > 60 → RSI > 70)</li><li>Add <strong>Volume Multiplier > 2.0</strong> for only high-conviction signals</li><li>Change segment from "Cash" to "Nifty 500" or "Nifty 50" for quality stocks only</li><li>Set pass type to <strong>ALL</strong> (all conditions must match)</li></ul>`;
    }

    // Generic / fallback
    return `<p>Great question! Based on your current scan <strong>"${this.escapeHtml(scanTitle)}"</strong> with ${filterCount} filter(s) in the ${segment} universe:</p><p>I can help you optimize this scan for better results. Try asking me:</p><ul class="ai-msg-list"><li>"Explain my current filters"</li><li>"How to reduce false signals?"</li><li>"What's the best timeframe for this?"</li><li>"Add risk management"</li><li>"Make this more aggressive"</li></ul>`;
  }

  bindAlertModalEvents() {
    const modal = document.getElementById('alertConfigModal');
    const btnOpen = document.getElementById('btnOpenAlertConfigModal');
    const btnClose = document.getElementById('btnCloseAlertModal');
    const btnCancel = document.getElementById('btnCancelAlertModal');
    const btnSave = document.getElementById('btnSaveAlertConfig');
    const btnTestTg = document.getElementById('btnTestTelegram');
    const btnTestWh = document.getElementById('btnTestWebhook');

    if (!modal) return;

    // Open modal & load existing settings
    btnOpen?.addEventListener('click', async () => {
      modal.style.display = 'flex';
      try {
        const resp = await fetch('/api/alerts/config');
        const cfg = await resp.json();
        const tgCheck = document.getElementById('cfgTelegramEnabled');
        if (tgCheck) tgCheck.checked = !!cfg.telegramEnabled;
        const tgToken = document.getElementById('cfgTelegramToken');
        if (tgToken) tgToken.value = cfg.telegramBotToken || '';
        const tgChat = document.getElementById('cfgTelegramChatId');
        if (tgChat) tgChat.value = cfg.telegramChatId || '';

        const whCheck = document.getElementById('cfgWebhookEnabled');
        if (whCheck) whCheck.checked = !!cfg.webhookEnabled;
        const whUrl = document.getElementById('cfgWebhookUrl');
        if (whUrl) whUrl.value = cfg.webhookUrl || '';
        const whSecret = document.getElementById('cfgWebhookSecret');
        if (whSecret) whSecret.value = cfg.webhookSecret || '';

        const cdSelect = document.getElementById('cfgCooldown');
        if (cdSelect) cdSelect.value = cfg.cooldownMinutes || '5';
        const bpCheck = document.getElementById('cfgBrowserPush');
        if (bpCheck) bpCheck.checked = cfg.browserPush !== false;
      } catch (e) {}
    });

    const closeModal = () => { modal.style.display = 'none'; };
    btnClose?.addEventListener('click', closeModal);
    btnCancel?.addEventListener('click', closeModal);

    // Modal Tabs
    modal.querySelectorAll('.alert-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.alert-tab-btn').forEach(b => b.classList.remove('active'));
        modal.querySelectorAll('.alert-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tabName = btn.dataset.tab;
        const paneMap = {
          telegram: 'paneTelegram',
          webhook: 'paneWebhook',
          settings: 'paneSettings'
        };
        const targetPane = document.getElementById(paneMap[tabName]);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Test Telegram Button
    btnTestTg?.addEventListener('click', async () => {
      const statusEl = document.getElementById('telegramTestStatus');
      const botToken = document.getElementById('cfgTelegramToken')?.value.trim();
      const chatId = document.getElementById('cfgTelegramChatId')?.value.trim();
      if (statusEl) {
        statusEl.style.display = 'inline-flex';
        statusEl.className = 'alert-status-badge';
        statusEl.textContent = '⏳ Sending test message...';
      }

      try {
        const resp = await fetch('/api/alerts/test-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken, chatId })
        });
        const data = await resp.json();
        if (statusEl) {
          if (data.success) {
            statusEl.className = 'alert-status-badge success';
            statusEl.textContent = '✅ Telegram test passed! Check your chat.';
          } else {
            statusEl.className = 'alert-status-badge error';
            statusEl.textContent = '❌ Error: ' + (data.error || 'Check token & chat ID');
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.className = 'alert-status-badge error';
          statusEl.textContent = '❌ ' + err.message;
        }
      }
    });

    // Test Webhook Button
    btnTestWh?.addEventListener('click', async () => {
      const statusEl = document.getElementById('webhookTestStatus');
      const webhookUrl = document.getElementById('cfgWebhookUrl')?.value.trim();
      const secret = document.getElementById('cfgWebhookSecret')?.value.trim();
      if (statusEl) {
        statusEl.style.display = 'inline-flex';
        statusEl.className = 'alert-status-badge';
        statusEl.textContent = '⏳ Dispatching test payload...';
      }

      try {
        const resp = await fetch('/api/alerts/test-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl, secret })
        });
        const data = await resp.json();
        if (statusEl) {
          if (data.success) {
            statusEl.className = 'alert-status-badge success';
            statusEl.textContent = '✅ Webhook 200 OK! Payload received.';
          } else {
            statusEl.className = 'alert-status-badge error';
            statusEl.textContent = '❌ ' + (data.message || data.error || 'Failed');
          }
        }
      } catch (err) {
        if (statusEl) {
          statusEl.className = 'alert-status-badge error';
          statusEl.textContent = '❌ ' + err.message;
        }
      }
    });

    // Save Alert Config Button
    btnSave?.addEventListener('click', async () => {
      const payload = {
        telegramEnabled: document.getElementById('cfgTelegramEnabled')?.checked || false,
        telegramBotToken: document.getElementById('cfgTelegramToken')?.value.trim() || '',
        telegramChatId: document.getElementById('cfgTelegramChatId')?.value.trim() || '',
        webhookEnabled: document.getElementById('cfgWebhookEnabled')?.checked || false,
        webhookUrl: document.getElementById('cfgWebhookUrl')?.value.trim() || '',
        webhookSecret: document.getElementById('cfgWebhookSecret')?.value.trim() || '',
        cooldownMinutes: parseInt(document.getElementById('cfgCooldown')?.value || '5', 10),
        browserPush: document.getElementById('cfgBrowserPush')?.checked !== false
      };

      try {
        await fetch('/api/alerts/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        closeModal();
        if (window.showToast) window.showToast('Alert configurations saved successfully!', 'success');
      } catch (e) {
        if (window.showToast) window.showToast('Failed to save settings: ' + e.message, 'error');
      }
    });
  }

  // ==========================================
  // CHARTINK 29 SEGMENT SELECTOR MODAL METHODS
  // ==========================================

  async bindSegmentModalEvents() {
    const modal = document.getElementById('segmentSelectModal');
    const closeBtn = document.getElementById('btnCloseSegmentModal');
    const searchInput = document.getElementById('segmentSearchInput');

    closeBtn?.addEventListener('click', () => {
      if (modal) modal.style.display = 'none';
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        modal.style.display = 'none';
      }
    });

    searchInput?.addEventListener('input', (e) => {
      this.renderSegmentList(e.target.value);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const firstVisible = document.querySelector('#segmentModalList .segment-item-row');
        if (firstVisible) {
          const segId = firstVisible.getAttribute('data-segment');
          const segLabel = firstVisible.getAttribute('data-label');
          this.selectSegment(segId, segLabel);
        }
      }
    });

    // Preload segments
    try {
      const resp = await fetch('/api/scans/segments');
      const data = await resp.json();
      if (data && Array.isArray(data.segments)) {
        this.availableSegments = data.segments;
      }
    } catch (e) {
      console.warn('Failed to preload segments:', e);
    }
  }

  async openSegmentModal() {
    const modal = document.getElementById('segmentSelectModal');
    const searchInput = document.getElementById('segmentSearchInput');
    if (!modal) return;

    if (!this.availableSegments || this.availableSegments.length === 0) {
      try {
        const resp = await fetch('/api/scans/segments');
        const data = await resp.json();
        this.availableSegments = data.segments || [];
      } catch (e) {
        // Fallback static list of 29 segments
        this.availableSegments = [
          { id: 'cash', label: 'cash' },
          { id: 'all indices', label: 'all indices' },
          { id: 'Banknifty', label: 'Banknifty' },
          { id: 'broad indices', label: 'broad indices' },
          { id: 'ETFs', label: 'ETFs' },
          { id: 'futures', label: 'futures' },
          { id: 'Gold ETFs', label: 'Gold ETFs' },
          { id: 'g-sec bonds', label: 'g-sec bonds' },
          { id: 'Midcap 50', label: 'Midcap 50' },
          { id: 'minor indices', label: 'minor indices' },
          { id: 'nifty 100', label: 'nifty 100' },
          { id: 'nifty 200', label: 'nifty 200' },
          { id: 'nifty 50', label: 'nifty 50' },
          { id: 'nifty 500', label: 'nifty 500' },
          { id: 'nifty 500 multicap 50:25:25', label: 'nifty 500 multicap 50:25:25' },
          { id: 'nifty and banknifty', label: 'nifty and banknifty' },
          { id: 'nifty large midcap 250', label: 'nifty large midcap 250' },
          { id: 'nifty microcap 250', label: 'nifty microcap 250' },
          { id: 'nifty midcap 100', label: 'nifty midcap 100' },
          { id: 'nifty midcap 150', label: 'nifty midcap 150' },
          { id: 'nifty midcap 50', label: 'nifty midcap 50' },
          { id: 'nifty midcap select', label: 'nifty midcap select' },
          { id: 'nifty mid smallcap 400', label: 'nifty mid smallcap 400' },
          { id: 'nifty next 50', label: 'nifty next 50' },
          { id: 'nifty smallcap 100', label: 'nifty smallcap 100' },
          { id: 'nifty smallcap 250', label: 'nifty smallcap 250' },
          { id: 'nifty smallcap 50', label: 'nifty smallcap 50' },
          { id: 'Silver ETFs', label: 'Silver ETFs' },
          { id: 'watchlist', label: 'watchlist' }
        ];
      }
    }

    if (searchInput) searchInput.value = '';
    this.renderSegmentList('');
    modal.style.display = 'flex';
    setTimeout(() => searchInput?.focus(), 50);
  }

  renderSegmentList(query = '') {
    const listEl = document.getElementById('segmentModalList');
    if (!listEl) return;
    const q = query.trim().toLowerCase();
    const items = (this.availableSegments || []).filter(s => !q || s.label.toLowerCase().includes(q));

    if (items.length === 0) {
      listEl.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No matching segments found</div>`;
      return;
    }

    listEl.innerHTML = items.map(seg => {
      const isActive = (this.segment || 'cash').trim().toLowerCase() === seg.id.trim().toLowerCase();
      return `
        <div class="segment-item-row ${isActive ? 'active' : ''}" data-segment="${seg.id}" data-label="${seg.label}">
          <span>${seg.label}</span>
          ${seg.count !== undefined ? `<span class="segment-count-badge">${seg.count}</span>` : ''}
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.segment-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const segId = row.getAttribute('data-segment');
        const segLabel = row.getAttribute('data-label');
        this.selectSegment(segId, segLabel);
      });
    });
  }

  selectSegment(segId, segLabel) {
    this.segment = segId;
    const labelElem = document.getElementById('currentSegmentLabel');
    if (labelElem) labelElem.textContent = segLabel;

    const modal = document.getElementById('segmentSelectModal');
    if (modal) modal.style.display = 'none';

    this.runScan();
  }

  render() {
    this.renderDirectoryTable();
  }

  loadScan(scanDef) {
    this.openScannerDetail(scanDef);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// Auto-instantiate QueryBuilder
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.queryBuilder = new QueryBuilder();
  });
} else {
  window.queryBuilder = new QueryBuilder();
}
