// Atlas Multi-Scan Dashboard Grid & Live Auto-Refresh Manager
// Controls Multi-Scan Execution, Real-time DOM Refresh, and Table Actions

class DashboardManager {
  constructor() {
    this.gridContainer = document.getElementById('dashboardGrid');
    this.dashboardSelect = document.getElementById('dashboardSelect');
    this.refreshIntervalSelect = document.getElementById('refreshIntervalSelect');
    this.countdownSpan = document.getElementById('refreshCountdown');
    
    this.activeDashboardId = 'default';
    this.dashboards = [];
    this.scansMap = new Map();
    this.scanResultsMap = new Map();
    
    this.autoRefreshSec = 15;
    this.countdown = 15;
    this.timerInterval = null;
    this.currentSegment = 'Cash';

    this.init();
  }

  async init() {
    this.bindGlobalEvents();
    this.bindGridDelegation();
    await this.loadDashboards();
    await this.loadScans();
    this.startAutoRefresh();
  }

  bindGlobalEvents() {
    this.dashboardSelect?.addEventListener('change', e => {
      this.activeDashboardId = e.target.value;
      this.renderCurrentDashboard();
    });

    this.refreshIntervalSelect?.addEventListener('change', e => {
      this.autoRefreshSec = parseInt(e.target.value, 10);
      this.countdown = this.autoRefreshSec;
      this.startAutoRefresh();
    });

    const btnManualRefresh = document.getElementById('btnManualRefresh');
    if (btnManualRefresh) {
      btnManualRefresh.addEventListener('click', async () => {
        btnManualRefresh.classList.add('animate-spin');
        try {
          await fetch('/api/market/refresh', { method: 'POST' });
        } catch (e) {}
        await this.refreshAllPinnedScans();
        if (window.app) await window.app.loadWatchlist();
        setTimeout(() => btnManualRefresh.classList.remove('animate-spin'), 600);
      });
    }

    // Segment pills
    document.querySelectorAll('.segment-pills .pill-item').forEach(pill => {
      pill.addEventListener('click', e => {
        document.querySelectorAll('.segment-pills .pill-item').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentSegment = e.currentTarget.dataset.segment || 'Cash';
        
        // Show loading state across all pinned cards
        const dash = this.getCurrentDashboard();
        const pinnedIds = dash?.pinnedScanIds || [];
        pinnedIds.forEach(id => {
          const res = document.getElementById(`results_${id}`);
          if (res) {
            res.innerHTML = `
              <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
                <div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div>
                <p style="margin-top: 0.5rem; font-size: 0.8rem;">Loading ${this.currentSegment} segment...</p>
              </div>
            `;
          }
          const meta = document.getElementById(`footer_meta_${id}`);
          if (meta) meta.textContent = `Segment: ${this.currentSegment}`;
        });

        this.refreshAllPinnedScans();
      });
    });

    document.getElementById('btnAddScanToDash')?.addEventListener('click', () => {
      this.openAddScanToDashModal();
    });

    // Close modal handlers for addScanToDashModal
    const addModal = document.getElementById('addScanToDashModal');
    if (addModal) {
      addModal.querySelector('.modal-close-btn')?.addEventListener('click', () => {
        addModal.classList.remove('active');
      });
      addModal.addEventListener('click', e => {
        if (e.target === addModal) addModal.classList.remove('active');
      });
    }
  }

  // Event Delegation for All Scan Cards in Grid
  bindGridDelegation() {
    if (!this.gridContainer) return;

    this.gridContainer.addEventListener('click', (e) => {
      const target = e.target;

      // 1. Refresh Single Scan Card Button
      const btnRefresh = target.closest('.btn-refresh-card');
      if (btnRefresh) {
        e.preventDefault();
        e.stopPropagation();
        const scanId = btnRefresh.dataset.id;
        if (scanId) {
          btnRefresh.classList.add('animate-spin');
          this.refreshSingleScan(scanId).finally(() => {
            setTimeout(() => btnRefresh.classList.remove('animate-spin'), 600);
          });
        }
        return;
      }

      // 2. Edit Scan in Builder
      const btnEdit = target.closest('.btn-edit-card');
      if (btnEdit) {
        e.preventDefault();
        e.stopPropagation();
        const scanId = btnEdit.dataset.id;
        const scan = this.scansMap.get(scanId);
        if (scan) {
          if (window.queryBuilder) {
            window.queryBuilder.loadScan(scan);
          }
          if (window.app) {
            window.app.switchView('builder');
          }
        }
        return;
      }

      // 3. Unpin Scan from Dashboard
      const btnUnpin = target.closest('.btn-unpin-card');
      if (btnUnpin) {
        e.preventDefault();
        e.stopPropagation();
        const scanId = btnUnpin.dataset.id;
        if (scanId) this.unpinScan(scanId);
        return;
      }

      // 4. Copy Symbols Button
      const btnCopy = target.closest('.copy-sym-btn');
      if (btnCopy) {
        e.preventDefault();
        e.stopPropagation();
        const scanId = btnCopy.dataset.id;
        const results = this.scanResultsMap.get(scanId) || [];
        const syms = results.map(s => s.symbol).join(', ');
        this.copyTextToClipboard(syms, `Copied ${results.length} symbols to clipboard!`);
        return;
      }

      // 5. Export CSV Button
      const btnCsv = target.closest('.export-csv-btn');
      if (btnCsv) {
        e.preventDefault();
        e.stopPropagation();
        const scanId = btnCsv.dataset.id;
        const results = this.scanResultsMap.get(scanId) || [];
        this.exportToCsv(results, `${scanId}-${Date.now()}.csv`);
        return;
      }

      // 6. Action Button: Open Chart
      const btnChart = target.closest('.btn-chart-action');
      if (btnChart) {
        e.preventDefault();
        e.stopPropagation();
        const sym = btnChart.dataset.symbol;
        if (sym && window.app) window.app.openStockChart(sym);
        return;
      }

      // 7. Action Button: Open AI Modal
      const btnAi = target.closest('.btn-ai-action');
      if (btnAi) {
        e.preventDefault();
        e.stopPropagation();
        const sym = btnAi.dataset.symbol;
        if (sym && window.app) window.app.openAiAgentModal(sym);
        return;
      }

      // 8. Row Click: Open Chart
      const stockRow = target.closest('tr[data-symbol]');
      if (stockRow) {
        const sym = stockRow.dataset.symbol;
        if (sym && window.app) window.app.openStockChart(sym);
        return;
      }
    });
  }

  async loadDashboards() {
    try {
      const resp = await fetch('/api/dashboards');
      const data = await resp.json();
      this.dashboards = data.dashboards || [];
      this.activeDashboardId = data.activeDashboardId || 'default';
      
      if (this.dashboardSelect) {
        this.dashboardSelect.innerHTML = this.dashboards.map(d => `
          <option value="${d.id}" ${d.id === this.activeDashboardId ? 'selected' : ''}>${d.name}</option>
        `).join('');
      }
    } catch (e) {
      console.error('Error loading dashboards:', e);
    }
  }

  async loadScans() {
    try {
      const resp = await fetch('/api/scans');
      const data = await resp.json();
      const all = [...(data.prebuilt || []), ...(data.custom || [])];
      this.scansMap.clear();
      all.forEach(s => this.scansMap.set(s.id, s));
      await this.renderCurrentDashboard();
    } catch (e) {
      console.error('Error loading scans:', e);
    }
  }

  getCurrentDashboard() {
    return this.dashboards.find(d => d.id === this.activeDashboardId) || this.dashboards[0];
  }

  async renderCurrentDashboard() {
    const dash = this.getCurrentDashboard();
    if (!dash || !this.gridContainer) return;

    const pinnedIds = dash.pinnedScanIds || [];
    if (pinnedIds.length === 0) {
      this.gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3.5rem 1rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 0.5rem;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin: 0.5rem 0 0.25rem; color: var(--text-main);">No Scans Pinned to This Dashboard</h3>
          <p style="font-size: 0.85rem; margin-bottom: 1.25rem;">Pin pre-built scans from the library or create a custom strategy in Scan Builder.</p>
          <button class="btn btn-primary" onclick="window.dashboard?.openAddScanToDashModal()">+ Pin Scan to Dashboard</button>
        </div>
      `;
      return;
    }

    // Render cards placeholder
    this.gridContainer.innerHTML = pinnedIds.map(id => {
      const scan = this.scansMap.get(id);
      if (!scan) return '';
      return this.renderScanCardSkeleton(scan);
    }).join('');

    // Fetch and populate results for each pinned scan
    await this.refreshAllPinnedScans();
  }

  renderScanCardSkeleton(scan) {
    return `
      <div class="scan-card" id="card_${scan.id}">
        <div class="scan-card-header">
          <div class="scan-card-title-group">
            <h3 class="scan-card-title">${this.escapeHtml(scan.title)}</h3>
            <span class="scan-count-badge" id="badge_${scan.id}">Scanning...</span>
          </div>
          <div class="scan-card-actions">
            <button class="scan-action-btn btn-refresh-card" data-id="${scan.id}" title="Refresh Scan">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            </button>
            <button class="scan-action-btn btn-edit-card" data-id="${scan.id}" title="Edit in Builder">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="scan-action-btn btn-unpin-card" data-id="${scan.id}" title="Remove from Dashboard">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        <div class="scan-card-description">
          <span>${this.escapeHtml(scan.description || 'Custom technical scan')}</span>
          <span style="font-weight: 600; color: var(--accent);">${this.escapeHtml(scan.category || 'Technical')}</span>
        </div>
        <div class="scan-table-wrapper" id="results_${scan.id}">
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            <div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div>
            <p style="margin-top: 0.5rem; font-size: 0.8rem;">Evaluating real market conditions...</p>
          </div>
        </div>
        <div class="scan-card-footer" id="footer_${scan.id}">
          <span id="footer_meta_${scan.id}">Segment: ${this.currentSegment}</span>
          <div class="footer-actions">
            <span class="footer-action-link copy-sym-btn" data-id="${scan.id}" style="cursor: pointer;">Copy Symbols</span>
            <span class="footer-action-link export-csv-btn" data-id="${scan.id}" style="cursor: pointer;">CSV</span>
          </div>
        </div>
      </div>
    `;
  }

  async refreshAllPinnedScans() {
    const dash = this.getCurrentDashboard();
    if (!dash) return;
    const pinnedIds = dash.pinnedScanIds || [];
    await Promise.all(pinnedIds.map(id => this.refreshSingleScan(id)));
  }

  async refreshSingleScan(scanId) {
    const scan = this.scansMap.get(scanId);
    if (!scan) return;

    const resultsContainer = document.getElementById(`results_${scanId}`);
    const badge = document.getElementById(`badge_${scanId}`);
    if (!resultsContainer) return;

    const scanPayload = {
      ...scan,
      segment: this.currentSegment !== 'Cash' ? this.currentSegment : scan.segment
    };

    try {
      const resp = await fetch('/api/scans/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanPayload)
      });
      const data = await resp.json();
      const results = data.results || [];
      this.scanResultsMap.set(scanId, results);

      if (badge) badge.innerText = `${results.length} Stocks`;

      if (results.length === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-scan-state" style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom: 0.25rem;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
            <p style="font-size: 0.85rem; font-weight: 600;">No matching stocks in ${this.currentSegment}</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <table class="stock-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>LTP (₹)</th>
              <th>Change %</th>
              <th>Volume</th>
              <th>Trend (15D)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(s => {
              const ltp = typeof s.ltp === 'number' ? s.ltp : 0;
              const chg = typeof s.changePct === 'number' ? s.changePct : 0;
              const isPositive = chg >= 0;
              const vol = typeof s.volume === 'number' ? s.volume : 0;
              const sparklineSvg = window.generateSparklineSvg ? window.generateSparklineSvg(s.sparkline || [], isPositive, 75, 20) : '';
              return `
                <tr data-symbol="${s.symbol}" style="cursor: pointer;">
                  <td>
                    <div class="stock-symbol-cell">
                      <span class="stock-symbol">${s.symbol}</span>
                      <span class="stock-name">${this.escapeHtml(s.name)}</span>
                    </div>
                  </td>
                  <td class="stock-price cell-price" style="font-family: var(--font-mono); font-weight: 700;">₹${ltp.toFixed(2)}</td>
                  <td>
                    <span class="stock-change ${isPositive ? 'change-positive' : 'change-negative'}">
                      ${isPositive ? '+' : ''}${chg.toFixed(2)}%
                    </span>
                  </td>
                  <td style="font-family: var(--font-mono); font-size: 0.775rem;">${vol.toLocaleString('en-IN')}</td>
                  <td>
                    ${sparklineSvg}
                  </td>
                  <td onclick="event.stopPropagation();">
                    <div style="display: flex; gap: 0.35rem;">
                      <button class="btn btn-secondary btn-sm btn-chart-action" data-symbol="${s.symbol}" title="TradingView Chart">📈</button>
                      <button class="btn btn-ai-sparkle btn-sm btn-ai-action" data-symbol="${s.symbol}" title="AI Momentum Agent">🤖</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      console.error('Failed to run scan:', e);
      resultsContainer.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--red);">
          Failed to fetch results: ${e.message}
        </div>
      `;
    }
  }

  async unpinScan(scanId) {
    const dash = this.getCurrentDashboard();
    if (!dash) return;
    dash.pinnedScanIds = dash.pinnedScanIds.filter(id => id !== scanId);

    try {
      await fetch('/api/dashboards/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboards: this.dashboards, activeDashboardId: this.activeDashboardId })
      });
    } catch (e) {}
    this.renderCurrentDashboard();
  }

  async pinScanToDashboard(scanId) {
    const dash = this.getCurrentDashboard();
    if (!dash) return;
    if (!dash.pinnedScanIds.includes(scanId)) {
      dash.pinnedScanIds.push(scanId);
      try {
        await fetch('/api/dashboards/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboards: this.dashboards, activeDashboardId: this.activeDashboardId })
        });
      } catch (e) {}
      
      // Close the modal
      document.getElementById('addScanToDashModal')?.classList.remove('active');
      this.renderCurrentDashboard();
      if (window.app) window.app.switchView('dashboard');
    }
  }

  openAddScanToDashModal() {
    const modal = document.getElementById('addScanToDashModal');
    const list = document.getElementById('addScanList');
    if (!modal || !list) return;

    const dash = this.getCurrentDashboard();
    const pinned = dash?.pinnedScanIds || [];

    list.innerHTML = Array.from(this.scansMap.values()).map(scan => {
      const isPinned = pinned.includes(scan.id);
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <div>
            <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-main);">${this.escapeHtml(scan.title)}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.escapeHtml(scan.description || '')}</div>
          </div>
          <button class="btn btn-sm ${isPinned ? 'btn-secondary' : 'btn-primary'}" ${isPinned ? 'disabled' : ''} onclick="window.dashboard?.pinScanToDashboard('${scan.id}')">
            ${isPinned ? '✓ Pinned' : '+ Pin'}
          </button>
        </div>
      `;
    }).join('');

    modal.classList.add('active');
  }

  copyTextToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.showToast) window.showToast(successMsg, 'success');
      }).catch(() => {
        this.fallbackCopyText(text, successMsg);
      });
    } else {
      this.fallbackCopyText(text, successMsg);
    }
  }

  fallbackCopyText(text, successMsg) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (window.showToast) window.showToast(successMsg, 'success');
    } catch (e) {
      if (window.showToast) window.showToast('Symbols copied to clipboard', 'info');
    }
    document.body.removeChild(textArea);
  }

  exportToCsv(rows, filename) {
    if (!rows || rows.length === 0) {
      if (window.showToast) window.showToast('No stocks available to export.', 'warning');
      return;
    }
    const headers = ['Symbol', 'Name', 'LTP', 'Change %', 'Volume', 'Sector'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.symbol}"`,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.ltp,
        r.changePct,
        r.volume,
        `"${r.sector || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  startAutoRefresh() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.autoRefreshSec === 0) {
      if (this.countdownSpan) this.countdownSpan.innerText = 'Paused';
      return;
    }

    this.countdown = this.autoRefreshSec;
    if (this.countdownSpan) this.countdownSpan.innerText = `${this.countdown}s`;

    this.timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdownSpan) this.countdownSpan.innerText = `${this.countdown}s`;

      if (this.countdown <= 0) {
        this.countdown = this.autoRefreshSec;
        this.refreshAllPinnedScans();
      }
    }, 1000);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// Auto-instantiate
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardManager();
  });
} else {
  window.dashboard = new DashboardManager();
}
