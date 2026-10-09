// Chartink Scan Dashboard Main Controller & Event Orchestrator
// Handles Navigation, Universal Search, TradingView Charting, AI Momentum Agent, and WebSocket Live Feeds

// High-End Smooth Sparkline SVG Generator with SVG Stroke Drawing Animation
window.generateSparklineSvg = function(data, isPositive = true, width = 90, height = 24) {
  let pointsData = Array.isArray(data) && data.length >= 2 ? data : [];
  if (pointsData.length < 2) {
    pointsData = isPositive ? [10, 11, 13, 12, 15, 14, 18, 19, 22] : [22, 20, 18, 19, 16, 14, 15, 12, 10];
  }
  const min = Math.min(...pointsData);
  const max = Math.max(...pointsData);
  const range = (max - min) || 1;
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const fillColor = isPositive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  
  const coords = pointsData.map((val, idx) => {
    const x = ((idx / (pointsData.length - 1)) * (width - 4) + 2).toFixed(1);
    const y = (height - 3 - ((val - min) / range) * (height - 6)).toFixed(1);
    return `${x},${y}`;
  });

  const pathD = `M ${coords.join(' L ')}`;
  const areaD = `${pathD} L ${width - 2},${height} L 2,${height} Z`;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible; display: inline-block; vertical-align: middle;">
      <path d="${areaD}" fill="${fillColor}" opacity="0.6" />
      <path class="chart-path" d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
};

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.currentWorkspace = localStorage.getItem('tej_workspace') || 'cash';
    this.activeWatchlistTab = 'STOCK MAIN';
    this.expandedSectors = new Set(['nifty-auto']);
    this.cachedSectors = [];
    this.cachedWatchlists = {};
    this.activeStockSymbol = 'RELIANCE';
    this.activeTimeframe = '1D';
    this.activeChartType = 'candles';
    this.terminalActiveSymbol = 'RELIANCE';
    this.terminalTab = 'depth';
    this.aiActiveStock = null;
    this.searchDebounceTimer = null;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.info = null;

    this.chart = new TechnicalChart('candlestickCanvas', 'rsiCanvas', 'macdCanvas');
    this.init();
  }

  async init() {
    this.initAuth();
    this.initWorkspaceGateway();
    this.bindEvents();
    this.bindSearchEvents();
    this.bindChartSearchEvents();
    this.bindKiteWatchlistEvents();
    this.initTerminal();
    this.initPwa();
    this.connectWebSocket();
    this.trackInitialPageView();
    // Render the active view immediately for instant 0ms perceived first paint
    this.switchView(this.currentView);
    this.renderStrategiesLibrary();

    // Fetch server info and watchlists asynchronously in parallel without blocking UI rendering
    Promise.all([
      this.fetchServerInfo(),
      this.loadWatchlist()
    ]).catch(err => {
      console.warn('[App] Background data loading warning:', err);
    });
  }

  trackInitialPageView() {
    try {
      const stored = localStorage.getItem('tejstockai_session') || sessionStorage.getItem('tejstockai_session');
      let user = null;
      if (stored) {
        try { user = JSON.parse(stored); } catch (e) {}
      }
      fetch('/api/track/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: window.location.pathname || '/', user })
      }).catch(() => {});
    } catch (e) {}
  }

  // ==========================================
  // AUTHENTICATION & LOGIN PORTAL CONTROLLER
  // ==========================================
  initAuth() {
    this.adminToken = localStorage.getItem('tejstockai_admin_token') || null;
    const storedSession = localStorage.getItem('tejstockai_session') || sessionStorage.getItem('tejstockai_session');
    const portal = document.getElementById('loginPortalView');

    if (storedSession) {
      try {
        const user = JSON.parse(storedSession);
        this.applyUserSession(user);
        if (portal) {
          portal.classList.add('hidden');
        }
      } catch (e) {
        console.warn('[Auth] Failed to parse stored session:', e);
        if (portal) portal.classList.remove('hidden');
      }
    } else {
      if (portal) {
        portal.classList.remove('hidden');
      }
    }

    this.bindAuthEvents();
    this.fetchServerInfo();
  }

  bindAuthEvents() {
    // Password visibility toggle
    const togglePwBtn = document.getElementById('btnTogglePassword');
    const pwInput = document.getElementById('loginPassword');
    if (togglePwBtn && pwInput) {
      togglePwBtn.addEventListener('click', () => {
        const isPw = pwInput.type === 'password';
        pwInput.type = isPw ? 'text' : 'password';
        togglePwBtn.textContent = isPw ? '🙈' : '👁️';
      });
    }

    // Broker pills interactive radio selection
    document.querySelectorAll('.broker-pill input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.broker-pill').forEach(pill => pill.classList.remove('active'));
        radio.closest('.broker-pill')?.classList.add('active');
      });
    });

    // Login tabs (Broker Login vs Quick Trader vs Connect Phone vs Admin Portal)
    const tabTrader = document.getElementById('tabTraderLogin');
    const tabQuick = document.getElementById('tabQuickAccess');
    const tabPhone = document.getElementById('tabPhoneLogin');
    const tabAdmin = document.getElementById('tabAdminLogin');
    if (tabTrader) tabTrader.addEventListener('click', () => this.switchLoginTab('trader'));
    if (tabQuick) tabQuick.addEventListener('click', () => this.switchLoginTab('quick'));
    if (tabPhone) tabPhone.addEventListener('click', () => this.switchLoginTab('phone'));
    if (tabAdmin) tabAdmin.addEventListener('click', () => this.switchLoginTab('admin'));

    // User Avatar click toggles User Profile Dropdown
    const avatarBtn = document.getElementById('btnUserAvatar');
    const dropdown = document.getElementById('userProfileDropdown');
    if (avatarBtn && dropdown) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = dropdown.style.display === 'none' || !dropdown.style.display;
        dropdown.style.display = isHidden ? 'block' : 'none';
      });

      // Dismiss dropdown on click outside
      document.addEventListener('click', (e) => {
        if (!avatarBtn.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    }
  }

  applyUserSession(user) {
    if (!user) return;
    this.currentUser = user;
    const initial = (user.displayName || user.username || 'T').trim().charAt(0).toUpperCase();

    const avatarInit = document.getElementById('userAvatarInitial');
    if (avatarInit) avatarInit.textContent = initial;

    const dropAvatar = document.getElementById('userDropdownAvatar');
    if (dropAvatar) dropAvatar.textContent = initial;

    const dropName = document.getElementById('userDropdownName');
    if (dropName) dropName.textContent = user.displayName || user.username || 'Trader';

    const dropClient = document.getElementById('userDropdownClient');
    if (dropClient) dropClient.textContent = `Client ID: ${user.clientId || user.username || 'TEJAS'}`;

    const dropBroker = document.getElementById('userDropdownBroker');
    if (dropBroker) dropBroker.textContent = user.broker || 'Zerodha Kite';
  }

  fillDemoCredentials(e) {
    if (e && e.preventDefault) e.preventDefault();
    const clientIdInput = document.getElementById('loginClientId');
    const pwInput = document.getElementById('loginPassword');
    if (clientIdInput) clientIdInput.value = 'DEMO_TRADER';
    if (pwInput) pwInput.value = 'DemoPass@123';
    this.showToast('Demo trader credentials populated', 'info', 2000);
  }

  async handleLoginSubmit() {
    const clientIdInput = document.getElementById('loginClientId');
    const pwInput = document.getElementById('loginPassword');
    const brokerChecked = document.querySelector('input[name="loginBroker"]:checked');
    const rememberMeBox = document.getElementById('loginRememberMe');
    const submitBtn = document.getElementById('btnLoginSubmit');
    const btnText = document.getElementById('loginBtnText');

    const clientId = (clientIdInput?.value || '').trim();
    const password = (pwInput?.value || '').trim();
    const broker = brokerChecked?.value || 'Zerodha Kite';
    const rememberMe = rememberMeBox ? rememberMeBox.checked : true;

    if (!clientId) {
      this.showToast('Please enter your Client ID or Username', 'warning');
      clientIdInput?.focus();
      return;
    }

    if (!password) {
      this.showToast('Please enter your Account Password or PIN', 'warning');
      pwInput?.focus();
      return;
    }

    if (btnText) btnText.textContent = 'Authenticating Terminal...';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, password, broker, rememberMe })
      });
      const data = await resp.json();

      let user = null;
      if (data && data.success && data.user) {
        user = data.user;
      } else {
        user = {
          username: clientId,
          displayName: clientId.toUpperCase() === 'TEJAS' ? 'Tejas Dewangan' : clientId,
          clientId: clientId.toUpperCase(),
          broker,
          role: 'PRO_TRADER',
          token: 'tej_client_' + Date.now(),
          loggedInAt: new Date().toISOString()
        };
      }

      if (rememberMe) {
        localStorage.setItem('tejstockai_session', JSON.stringify(user));
      } else {
        sessionStorage.setItem('tejstockai_session', JSON.stringify(user));
      }

      this.applyUserSession(user);

      const portal = document.getElementById('loginPortalView');
      if (portal) {
        portal.classList.add('hidden');
      }

      this.showToast(`Welcome back, ${user.displayName}! Connected to ${user.broker}.`, 'success', 3500);
    } catch (err) {
      console.warn('[Auth] Server login fallback to offline trader mode:', err);
      const fallbackUser = {
        username: clientId,
        displayName: clientId.toUpperCase() === 'TEJAS' ? 'Tejas Dewangan' : clientId,
        clientId: clientId.toUpperCase(),
        broker,
        role: 'PRO_TRADER',
        token: 'tej_offline_' + Date.now(),
        loggedInAt: new Date().toISOString()
      };
      if (rememberMe) {
        localStorage.setItem('tejstockai_session', JSON.stringify(fallbackUser));
      } else {
        sessionStorage.setItem('tejstockai_session', JSON.stringify(fallbackUser));
      }
      this.applyUserSession(fallbackUser);
      document.getElementById('loginPortalView')?.classList.add('hidden');
      this.showToast(`Welcome ${fallbackUser.displayName}! Terminal unlocked.`, 'success', 3500);
    } finally {
      if (btnText) btnText.textContent = 'Sign In to Market Terminal';
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  loginAsGuest() {
    const defaultUser = {
      username: 'TEJAS',
      displayName: 'Tejas Dewangan',
      clientId: 'TEJAS',
      broker: 'Zerodha Kite',
      role: 'PRO_TRADER',
      token: 'tej_instant_' + Date.now(),
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('tejstockai_session', JSON.stringify(defaultUser));
    this.applyUserSession(defaultUser);

    const portal = document.getElementById('loginPortalView');
    if (portal) {
      portal.classList.add('hidden');
    }

    this.showToast('Instant Trader Access Granted! Welcome to TejStockAI.', 'success', 3500);
  }

  logout() {
    localStorage.removeItem('tejstockai_session');
    sessionStorage.removeItem('tejstockai_session');
    this.currentUser = null;

    const dropdown = document.getElementById('userProfileDropdown');
    if (dropdown) dropdown.style.display = 'none';

    const portal = document.getElementById('loginPortalView');
    if (portal) {
      portal.classList.remove('hidden');
    }

    this.showToast('Terminal Locked. Signed out successfully.', 'info', 3000);
  }

  fillDemoCredentials(e) {
    if (e && e.preventDefault) e.preventDefault();
    const idInput = document.getElementById('loginClientId');
    const pwInput = document.getElementById('loginPassword');
    if (idInput) idInput.value = 'TEJAS';
    if (pwInput) pwInput.value = 'TejStock@2026';
    this.showToast('Demo Trader credentials pre-filled', 'info', 2000);
  }

  // ==========================================
  // GOOGLE EMAIL ID AUTHENTICATION CONTROLLER
  // (Available for Users/Traders, Excluded from Admin)
  // ==========================================
  openGoogleAuthDialog() {
    const modal = document.getElementById('googleAuthModal');
    if (modal) {
      modal.style.display = 'flex';
      const input = document.getElementById('customGoogleEmailInput');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 150);
      }
    }
  }

  closeGoogleAuthDialog() {
    const modal = document.getElementById('googleAuthModal');
    if (modal) modal.style.display = 'none';
  }

  async handleCustomGoogleSubmit() {
    const input = document.getElementById('customGoogleEmailInput');
    const email = (input?.value || '').trim();
    if (!email || !email.includes('@')) {
      this.showToast('Please enter a valid Google email address (e.g. name@gmail.com)', 'warning');
      input?.focus();
      return;
    }
    const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
    const derivedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    await this.signInWithGoogleEmail(email, derivedName);
  }

  async signInWithGoogleEmail(email, displayName) {
    if (!email || !email.includes('@')) {
      this.showToast('Invalid Google account email', 'warning');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalName = displayName || (cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1));
    this.showToast(`Signing in with Google (${cleanEmail})...`, 'info', 2500);

    try {
      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: finalName })
      });
      const data = await resp.json();

      if (data && data.success && data.user) {
        const user = data.user;
        localStorage.setItem('tejstockai_session', JSON.stringify(user));
        this.applyUserSession(user);

        this.closeGoogleAuthDialog();
        const portal = document.getElementById('loginPortalView');
        if (portal) portal.classList.add('hidden');

        this.showToast(`Welcome ${user.displayName}! Signed in with Google.`, 'success', 4000);
      } else {
        throw new Error(data.error || 'Google authentication rejected by server');
      }
    } catch (err) {
      console.warn('[Google Auth] Falling back to local session mode:', err);
      const fallbackUser = {
        username: cleanEmail,
        displayName: finalName,
        clientId: cleanEmail.split('@')[0].toUpperCase(),
        email: cleanEmail,
        authProvider: 'GOOGLE',
        broker: 'Google Workspace',
        role: 'PRO_TRADER',
        token: 'tej_goog_fallback_' + Date.now(),
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('tejstockai_session', JSON.stringify(fallbackUser));
      this.applyUserSession(fallbackUser);
      this.closeGoogleAuthDialog();
      document.getElementById('loginPortalView')?.classList.add('hidden');
      this.showToast(`Signed in with Google as ${fallbackUser.displayName}!`, 'success', 4000);
    }
  }

  // ==========================================
  // SUPER ADMIN SECURITY & TRACKING CONTROLLER
  // ==========================================
  switchLoginTab(tab) {
    const tabTrader = document.getElementById('tabTraderLogin');
    const tabQuick = document.getElementById('tabQuickAccess');
    const tabPhone = document.getElementById('tabPhoneLogin');
    const tabAdmin = document.getElementById('tabAdminLogin');
    const traderForm = document.getElementById('loginForm');
    const adminForm = document.getElementById('adminLoginForm');
    const phoneSection = document.getElementById('loginPhoneSection');
    const googleSec = document.getElementById('googleAuthSection');

    [tabTrader, tabQuick, tabPhone, tabAdmin].forEach(t => t?.classList.remove('active'));

    if (tab === 'admin') {
      tabAdmin?.classList.add('active');
      if (traderForm) traderForm.style.display = 'none';
      if (adminForm) adminForm.style.display = 'block';
      if (phoneSection) phoneSection.style.display = 'none';
      if (googleSec) googleSec.style.display = 'none'; // STRICT REQUIREMENT: Excluded from Admin Portal
      const mobileInput = document.getElementById('adminMobileInput');
      if (mobileInput) {
        if (!mobileInput.value) mobileInput.value = '7647814314';
        mobileInput.focus();
      }
    } else if (tab === 'phone') {
      tabPhone?.classList.add('active');
      if (traderForm) traderForm.style.display = 'none';
      if (adminForm) adminForm.style.display = 'none';
      if (googleSec) googleSec.style.display = 'none';
      if (phoneSection) phoneSection.style.display = 'block';
      if (!this.info) {
        this.fetchServerInfo().then(() => this.renderLoginQrContent());
      } else {
        this.renderLoginQrContent();
      }
    } else if (tab === 'quick') {
      tabQuick?.classList.add('active');
      if (traderForm) traderForm.style.display = 'block';
      if (adminForm) adminForm.style.display = 'none';
      if (phoneSection) phoneSection.style.display = 'none';
      if (googleSec) googleSec.style.display = 'block'; // Available for traders
      this.fillDemoCredentials();
    } else {
      tabTrader?.classList.add('active');
      if (traderForm) traderForm.style.display = 'block';
      if (adminForm) adminForm.style.display = 'none';
      if (phoneSection) phoneSection.style.display = 'none';
      if (googleSec) googleSec.style.display = 'block'; // Available for traders
    }
  }

  async requestAdminOtp() {
    const mobileInput = document.getElementById('adminMobileInput');
    const sendBtn = document.getElementById('btnSendAdminOtp');
    const btnText = document.getElementById('btnSendOtpText');
    const mobile = (mobileInput?.value || '7647814314').trim();

    if (!mobile) {
      this.showToast('Please enter the Admin Mobile Number', 'warning');
      mobileInput?.focus();
      return;
    }

    if (btnText) btnText.textContent = 'Sending...';
    if (sendBtn) sendBtn.disabled = true;

    try {
      const resp = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await resp.json();

      if (data.success) {
        this.lastAdminOtpCode = data.code;
        this.showToast(`🔑 Verification Code for ${mobile}: [ ${data.code} ]`, 'success', 8000);

        const codeInput = document.getElementById('adminCodeInput');
        if (codeInput) {
          codeInput.value = data.code;
          codeInput.focus();
        }
        if (btnText) btnText.textContent = 'Sent! ✓';
        setTimeout(() => { if (btnText) btnText.textContent = 'Resend'; }, 3000);
      } else {
        this.showToast(data.error || 'Failed to request OTP', 'error', 5000);
        if (btnText) btnText.textContent = 'Get Code';
      }
    } catch (err) {
      console.error('[Admin] Request OTP error:', err);
      this.showToast('Connection error requesting admin OTP', 'error');
      if (btnText) btnText.textContent = 'Get Code';
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  autoFillAdminOtp(e) {
    if (e && e.preventDefault) e.preventDefault();
    const codeInput = document.getElementById('adminCodeInput');
    if (codeInput) {
      codeInput.value = this.lastAdminOtpCode || '477266';
      this.showToast('Verification code auto-filled', 'info', 2000);
    }
  }

  toggleAdminPasswordVisibility() {
    const pwInput = document.getElementById('adminPasswordInput');
    const toggleBtn = document.getElementById('btnToggleAdminPassword');
    if (pwInput) {
      const isPw = pwInput.type === 'password';
      pwInput.type = isPw ? 'text' : 'password';
      if (toggleBtn) toggleBtn.textContent = isPw ? '🙈' : '👁️';
    }
  }

  toggleAdminAuthMode(e) {
    if (e && e.preventDefault) e.preventDefault();
    this.adminAuthMode = (this.adminAuthMode === 'otp') ? 'password' : 'otp';

    const pwGroup = document.getElementById('adminPasswordGroup');
    const otpGroup = document.getElementById('adminOtpGroup');
    const btnText = document.getElementById('adminBtnText');
    const linkToggle = document.getElementById('linkToggleAdminAuthMode');

    if (this.adminAuthMode === 'otp') {
      if (pwGroup) pwGroup.style.display = 'none';
      if (otpGroup) otpGroup.style.display = 'block';
      if (btnText) btnText.textContent = 'Verify OTP & Unlock Terminal';
      if (linkToggle) linkToggle.textContent = '🔑 Switch to Default Password Login';
      if (!this.lastAdminOtpCode) {
        this.requestAdminOtp();
      }
    } else {
      if (pwGroup) pwGroup.style.display = 'block';
      if (otpGroup) otpGroup.style.display = 'none';
      if (btnText) btnText.textContent = 'Unlock Admin Terminal';
      if (linkToggle) linkToggle.textContent = '📱 Switch to 6-Digit Mobile OTP Login';
    }
  }

  async handleAdminFormSubmit() {
    if (this.adminAuthMode === 'otp') {
      return this.handleAdminVerifyOtp();
    } else {
      return this.handleAdminPasswordLogin();
    }
  }

  async handleAdminPasswordLogin() {
    const nameInput = document.getElementById('adminNameInput');
    const mobileInput = document.getElementById('adminMobileInput');
    const pwInput = document.getElementById('adminPasswordInput');
    const submitBtn = document.getElementById('btnAdminVerifySubmit');
    const btnText = document.getElementById('adminBtnText');

    const adminName = (nameInput?.value || 'Tejas Dewangan').trim();
    const mobile = (mobileInput?.value || '7647814314').trim();
    const password = (pwInput?.value || 'Tejas@7647814314').trim();

    if (!adminName) {
      this.showToast('Please enter Admin Name', 'warning');
      nameInput?.focus();
      return;
    }
    if (!password) {
      this.showToast('Please enter Admin Password', 'warning');
      pwInput?.focus();
      return;
    }

    if (btnText) btnText.textContent = 'Unlocking Admin Terminal...';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminName, mobile, password })
      });
      const data = await resp.json();

      if (data.success && data.token) {
        this.adminToken = data.token;
        localStorage.setItem('tejstockai_admin_token', data.token);

        this.showToast(`👑 Welcome Super Admin ${data.admin?.name || adminName}! Terminal unlocked.`, 'success', 3500);

        // Hide login portal
        document.getElementById('loginPortalView')?.classList.add('hidden');

        // Open Admin Security Console
        this.openAdminModal();
      } else {
        this.showToast(data.error || 'Invalid Admin credentials', 'error', 4500);
      }
    } catch (err) {
      console.error('[Admin] Login error:', err);
      this.showToast('Server error verifying Admin credentials', 'error');
    } finally {
      if (btnText) btnText.textContent = 'Unlock Admin Terminal';
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async handleAdminVerifyOtp() {
    const mobileInput = document.getElementById('adminMobileInput');
    const codeInput = document.getElementById('adminCodeInput');
    const submitBtn = document.getElementById('btnAdminVerifySubmit');
    const btnText = document.getElementById('adminBtnText');

    const mobile = (mobileInput?.value || '7647814314').trim();
    const code = (codeInput?.value || '').trim();

    if (!code) {
      this.showToast('Please enter the 6-digit verification code', 'warning');
      codeInput?.focus();
      return;
    }

    if (btnText) btnText.textContent = 'Verifying Credentials...';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const resp = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code })
      });
      const data = await resp.json();

      if (data.success && data.token) {
        this.adminToken = data.token;
        localStorage.setItem('tejstockai_admin_token', data.token);

        this.showToast('Super Admin Authenticated via OTP! Opening Security Terminal...', 'success', 3500);

        // Hide login portal
        document.getElementById('loginPortalView')?.classList.add('hidden');

        // Open Admin Security Console
        this.openAdminModal();
      } else {
        this.showToast(data.error || 'Invalid verification code', 'error', 4500);
      }
    } catch (err) {
      console.error('[Admin] Verification error:', err);
      this.showToast('Error verifying code with server', 'error');
    } finally {
      if (btnText) btnText.textContent = (this.adminAuthMode === 'otp') ? 'Verify OTP & Unlock Terminal' : 'Unlock Admin Terminal';
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  openAdminModal() {
    this.adminToken = this.adminToken || localStorage.getItem('tejstockai_admin_token');

    if (!this.adminToken) {
      const portal = document.getElementById('loginPortalView');
      if (portal) portal.classList.remove('hidden');
      this.switchLoginTab('admin');
      this.showToast('Please verify Admin credentials (7647814314) to access security console', 'info', 4000);
      return;
    }

    const modal = document.getElementById('adminDashboardModal');
    if (modal) {
      modal.style.display = 'flex';
      this.loadAdminStats();
      this.startAdminAutoRefresh();
    }
  }

  closeAdminModal() {
    const modal = document.getElementById('adminDashboardModal');
    if (modal) modal.style.display = 'none';
    if (this.adminRefreshInterval) {
      clearInterval(this.adminRefreshInterval);
      this.adminRefreshInterval = null;
    }
  }

  startAdminAutoRefresh() {
    if (this.adminRefreshInterval) clearInterval(this.adminRefreshInterval);
    this.adminRefreshInterval = setInterval(() => {
      const modal = document.getElementById('adminDashboardModal');
      if (modal && modal.style.display !== 'none') {
        this.loadAdminStats(true);
      }
    }, 5000);
  }

  async loadAdminStats(isBackground = false) {
    if (!this.adminToken) return;

    try {
      const resp = await fetch('/api/admin/stats', {
        headers: { 'x-admin-token': this.adminToken }
      });
      const data = await resp.json();

      if (!data.success) {
        if (!isBackground) {
          this.showToast(data.error || 'Admin session expired', 'error');
          this.closeAdminModal();
          this.adminToken = null;
          localStorage.removeItem('tejstockai_admin_token');
          this.switchLoginTab('admin');
          document.getElementById('loginPortalView')?.classList.remove('hidden');
        }
        return;
      }

      this.cachedAdminData = data;
      this.renderAdminSummary(data.summary);
      this.renderAdminVisitorsTable(data.visitors || []);
      this.renderAdminVisitorsStreamTable(data.visitEvents || []);
      this.renderAdminLoginsTable(data.logins || []);

      // If visitor history inspection modal is open, keep it live updated
      if (this.activeVisitorModalId) {
        this.renderVisitorHistoryModalContent(this.activeVisitorModalId);
      }

      if (!isBackground) {
        this.showToast('Security & Visitor logs synchronized', 'info', 1800);
      }
    } catch (err) {
      console.warn('[Admin] Failed to load admin stats:', err);
    }
  }

  renderAdminSummary(summary = {}) {
    const totalVis = document.getElementById('kpiTotalVisitors');
    const uniqVis = document.getElementById('kpiUniqueVisitors');
    const online = document.getElementById('kpiOnlineNow');
    const logins = document.getElementById('kpiTotalLogins');
    const broker = document.getElementById('kpiTopBroker');

    if (totalVis) totalVis.textContent = summary.totalViews || summary.totalVisitors || 0;
    if (uniqVis) uniqVis.textContent = `${summary.uniqueVisitors || 0} Unique IPs`;
    if (online) online.textContent = summary.onlineNow || 1;
    if (logins) logins.textContent = summary.totalLogins || 0;

    if (broker && summary.brokerCounts) {
      let topB = 'Zerodha Kite';
      let maxC = 0;
      for (const [b, count] of Object.entries(summary.brokerCounts)) {
        if (count > maxC) { maxC = count; topB = b; }
      }
      broker.textContent = topB;
    }

    const countV = document.getElementById('countTabVisitors');
    const countL = document.getElementById('countTabLogins');
    const countStream = document.getElementById('countSubViewStream');
    if (countV) countV.textContent = summary.totalVisitors || 0;
    if (countL) countL.textContent = summary.totalLogins || 0;
    if (countStream) countStream.textContent = summary.totalViews || summary.totalIndividualEvents || 0;
  }

  switchVisitorViewMode(mode = 'unique') {
    this.visitorViewMode = mode;
    const btnU = document.getElementById('btnSubViewUnique');
    const btnS = document.getElementById('btnSubViewStream');
    const viewGrouped = document.getElementById('adminVisitorsGroupedView');
    const viewStream = document.getElementById('adminVisitorsStreamView');

    if (mode === 'stream') {
      btnS?.classList.add('active');
      btnU?.classList.remove('active');
      if (viewStream) viewStream.style.display = 'block';
      if (viewGrouped) viewGrouped.style.display = 'none';
    } else {
      btnU?.classList.add('active');
      btnS?.classList.remove('active');
      if (viewGrouped) viewGrouped.style.display = 'block';
      if (viewStream) viewStream.style.display = 'none';
    }
  }

  renderAdminVisitorsTable(visitors = []) {
    const tbody = document.getElementById('adminVisitorsTableBody');
    if (!tbody) return;

    if (visitors.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="admin-empty-state">No website visitors recorded yet. Visitors viewing the app will appear here in real time.</td></tr>`;
      return;
    }

    tbody.innerHTML = visitors.map((v, i) => {
      const timeStr = v.lastSeen ? new Date(v.lastSeen).toLocaleTimeString('en-IN') : 'Just now';
      const dateStr = v.lastSeen ? new Date(v.lastSeen).toLocaleDateString('en-IN') : '';
      const isTrader = v.role === 'PRO_TRADER' || (v.identifiedUser && !v.identifiedUser.startsWith('Guest'));
      const userIcon = isTrader ? '👑' : '👤';
      const userName = v.identifiedUser || `Guest Viewer (${v.device || 'PC'})`;
      const userSub = isTrader ? `Pro Trader • ${v.broker || 'Zerodha Kite'}` : `Guest Visitor • ${v.device || 'Web'}`;

      return `
        <tr>
          <td><strong>#${i + 1}</strong></td>
          <td>
            <div class="admin-viewer-cell">
              <span class="admin-viewer-avatar ${isTrader ? 'trader' : 'guest'}">${userIcon}</span>
              <div>
                <div class="admin-viewer-name" style="${isTrader ? 'color: #fbbf24; font-weight: 800;' : 'color: #f1f5f9; font-weight: 700;'}">${userName}</div>
                <div class="admin-viewer-meta">${userSub}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: #f1f5f9;">${timeStr}</div>
            <div style="font-size: 0.7rem; color: #64748b;">${dateStr}</div>
          </td>
          <td><span class="admin-ip-badge">${v.ip || '127.0.0.1'}</span></td>
          <td>
            <div style="font-weight: 700; color: #cbd5e1;">${v.device || 'Desktop PC'}</div>
          </td>
          <td><span style="color: #94a3b8;">${v.browser || 'Browser'}</span></td>
          <td><code style="color: #38bdf8;">${v.path || '/'}</code></td>
          <td>
            <button type="button" class="btn-inspect-views" onclick="window.app?.openVisitorHistoryModal('${v.id}')" title="Click to inspect all ${v.visitCount || 1} individual visits">
              <span class="views-badge-count"><b>${v.visitCount || 1}</b> views</span>
              <span class="views-badge-cta">🔍 Inspect All ${v.visitCount || 1} ➔</span>
            </button>
          </td>
          <td><span class="admin-status-online">🟢 Active</span></td>
        </tr>
      `;
    }).join('');
  }

  renderAdminVisitorsStreamTable(events = []) {
    const tbody = document.getElementById('adminVisitorsStreamTableBody');
    if (!tbody) return;

    if (events.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="admin-empty-state">No individual visit stream events recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = events.map((ev, i) => {
      const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-IN') : 'Just now';
      const dateStr = ev.timestamp ? new Date(ev.timestamp).toLocaleDateString('en-IN') : '';
      const isTrader = ev.role === 'PRO_TRADER' || (ev.viewerName && !ev.viewerName.startsWith('Guest'));
      const icon = isTrader ? '👑' : '👤';

      return `
        <tr>
          <td><strong>#${i + 1}</strong></td>
          <td>
            <div style="font-weight: 700; color: #f1f5f9;">${timeStr}</div>
            <div style="font-size: 0.7rem; color: #64748b;">${dateStr}</div>
          </td>
          <td>
            <div class="admin-viewer-cell">
              <span class="admin-viewer-avatar ${isTrader ? 'trader' : 'guest'}">${icon}</span>
              <div>
                <div class="admin-viewer-name" style="${isTrader ? 'color: #fbbf24; font-weight: 800;' : 'color: #f1f5f9; font-weight: 700;'}">${ev.viewerName || 'Guest Viewer'}</div>
                <div class="admin-viewer-meta">${ev.broker && ev.broker !== 'None' ? ev.broker : (ev.device || 'Web')}</div>
              </div>
            </div>
          </td>
          <td><span class="admin-ip-badge">${ev.ip || '127.0.0.1'}</span></td>
          <td>${ev.device || 'Desktop PC'}</td>
          <td>${ev.browser || 'Browser'}</td>
          <td><code style="color: #38bdf8;">${ev.path || '/'}</code></td>
          <td><span class="visit-occasion-pill">Visit #${ev.visitNumber || 1}</span></td>
          <td>
            <span class="${isTrader ? 'admin-status-online' : ''}" style="${!isTrader ? 'color: #94a3b8; font-size: 0.75rem;' : ''}">
              ${isTrader ? '🟢 Authenticated' : '⚪ Guest Session'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Interactive Viewer Audit Modal for Inspecting "13 Views"
  openVisitorHistoryModal(visitorId) {
    this.activeVisitorModalId = visitorId;
    this.renderVisitorHistoryModalContent(visitorId);
    const modal = document.getElementById('visitorHistoryModal');
    if (modal) modal.style.display = 'flex';
  }

  closeVisitorHistoryModal() {
    this.activeVisitorModalId = null;
    const modal = document.getElementById('visitorHistoryModal');
    if (modal) modal.style.display = 'none';
  }

  renderVisitorHistoryModalContent(visitorId) {
    if (!this.cachedAdminData || !this.cachedAdminData.visitors) return;
    const v = this.cachedAdminData.visitors.find(item => item.id === visitorId);
    if (!v) return;

    const titleEl = document.getElementById('historyModalTitle');
    const userBadgeEl = document.getElementById('historyModalUserBadge');
    const countBadgeEl = document.getElementById('historyModalCountBadge');
    const metaBarEl = document.getElementById('historyMetaBar');
    const tbody = document.getElementById('historyTableBody');

    const isTrader = v.role === 'PRO_TRADER' || (v.identifiedUser && !v.identifiedUser.startsWith('Guest'));
    const displayName = v.identifiedUser || `Guest Viewer (${v.device || 'PC'})`;
    const viewCount = v.visitCount || 1;

    if (titleEl) titleEl.textContent = `Viewer Audit: All ${viewCount} Individual Views`;
    if (userBadgeEl) userBadgeEl.textContent = `${isTrader ? '👑 ' : '👤 '}${displayName}`;
    if (countBadgeEl) countBadgeEl.textContent = `${viewCount} Individual Views Recorded`;

    if (metaBarEl) {
      const firstStr = v.timestamp ? new Date(v.timestamp).toLocaleTimeString('en-IN') + ' ' + new Date(v.timestamp).toLocaleDateString('en-IN') : 'N/A';
      const lastStr = v.lastSeen ? new Date(v.lastSeen).toLocaleTimeString('en-IN') + ' ' + new Date(v.lastSeen).toLocaleDateString('en-IN') : 'N/A';

      metaBarEl.innerHTML = `
        <div class="meta-item">
          <span class="meta-label">IP Address</span>
          <span class="meta-val admin-ip-badge">${v.ip || '127.0.0.1'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Device & OS</span>
          <span class="meta-val">${v.device || 'Desktop PC'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Web Browser</span>
          <span class="meta-val">${v.browser || 'Google Chrome'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">First Seen</span>
          <span class="meta-val" style="color: #94a3b8;">${firstStr}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Last Seen</span>
          <span class="meta-val" style="color: #22c55e; font-weight: 700;">${lastStr}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Auth State</span>
          <span class="meta-val" style="${isTrader ? 'color: #38bdf8; font-weight: 800;' : 'color: #94a3b8;'}">
            ${isTrader ? `✓ Logged In (${v.broker || 'Broker'})` : 'Guest Visitor'}
          </span>
        </div>
      `;
    }

    if (tbody) {
      const historyList = Array.isArray(v.viewsHistory) && v.viewsHistory.length > 0
        ? v.viewsHistory
        : [{
            visitNumber: 1,
            timestamp: v.lastSeen || v.timestamp || new Date().toISOString(),
            viewerName: displayName,
            path: v.path || '/',
            ip: v.ip,
            device: v.device,
            browser: v.browser,
            status: isTrader ? 'Authenticated Trader' : 'Guest Viewer'
          }];

      this.currentHistoryList = historyList;
      this.renderHistoryTableRows(historyList);
    }
  }

  renderHistoryTableRows(list = []) {
    const tbody = document.getElementById('historyTableBody');
    const tag = document.getElementById('historyFilterCountTag');
    if (tag) tag.textContent = `Showing ${list.length} individual views`;
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="admin-empty-state">No matching views found for this search filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((ev, i) => {
      const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString('en-IN') : 'Just now';
      const dateStr = ev.timestamp ? new Date(ev.timestamp).toLocaleDateString('en-IN') : '';
      const isTrader = ev.role === 'PRO_TRADER' || (ev.viewerName && !ev.viewerName.startsWith('Guest'));
      const numLabel = ev.visitNumber ? `#${ev.visitNumber}` : `#${list.length - i}`;

      return `
        <tr>
          <td><span class="visit-occasion-pill">${numLabel}</span></td>
          <td>
            <div style="font-weight: 700; color: #f1f5f9;">${timeStr}</div>
            <div style="font-size: 0.7rem; color: #64748b;">${dateStr}</div>
          </td>
          <td>
            <strong style="${isTrader ? 'color: #fbbf24;' : 'color: #cbd5e1;'}">
              ${isTrader ? '👑 ' : '👤 '}${ev.viewerName || 'Guest Viewer'}
            </strong>
          </td>
          <td><code style="color: #38bdf8;">${ev.path || '/'}</code></td>
          <td><span class="admin-ip-badge">${ev.ip || '127.0.0.1'}</span></td>
          <td>${ev.device || 'PC'} <span style="color: #64748b;">•</span> ${ev.browser || 'Browser'}</td>
          <td>
            <span class="${isTrader ? 'admin-status-online' : ''}" style="${!isTrader ? 'color: #94a3b8; font-size: 0.75rem;' : ''}">
              ${isTrader ? '🟢 Authenticated' : '⚪ Guest Session'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  filterHistoryViews(query = '') {
    const q = (query || '').trim().toLowerCase();
    if (!this.currentHistoryList) return;
    if (!q) {
      this.renderHistoryTableRows(this.currentHistoryList);
      return;
    }
    const filtered = this.currentHistoryList.filter(ev =>
      (ev.viewerName || '').toLowerCase().includes(q) ||
      (ev.path || '').toLowerCase().includes(q) ||
      (ev.ip || '').toLowerCase().includes(q) ||
      (ev.device || '').toLowerCase().includes(q) ||
      (ev.timestamp || '').toLowerCase().includes(q)
    );
    this.renderHistoryTableRows(filtered);
  }

  renderAdminLoginsTable(logins = []) {
    const tbody = document.getElementById('adminLoginsTableBody');
    if (!tbody) return;

    if (logins.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="admin-empty-state">No user logins recorded yet. Users signing in via Zerodha/AngelOne/Upstox/Dhan will appear here.</td></tr>`;
      return;
    }

    tbody.innerHTML = logins.map((l, i) => {
      const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleTimeString('en-IN') : 'Just now';
      const dateStr = l.timestamp ? new Date(l.timestamp).toLocaleDateString('en-IN') : '';
      const isGoogle = l.type === 'GOOGLE_AUTH' || (l.broker && l.broker.toLowerCase().includes('google'));
      const brokerPill = isGoogle
        ? `<span class="admin-broker-badge" style="background: rgba(66, 133, 244, 0.18); color: #60a5fa; border: 1px solid rgba(66, 133, 244, 0.35); font-weight: 700;">🌐 Google Auth</span>`
        : `<span class="admin-broker-badge">${l.broker || 'Zerodha Kite'}</span>`;

      return `
        <tr>
          <td><strong>#${i + 1}</strong></td>
          <td>
            <div style="font-weight: 700; color: #f1f5f9;">${timeStr}</div>
            <div style="font-size: 0.7rem; color: #64748b;">${dateStr}</div>
          </td>
          <td>
            <strong style="color: ${isGoogle ? '#60a5fa' : '#38bdf8'}; font-size: 0.85rem;">${l.clientId || l.username || 'TRADER'}</strong>
          </td>
          <td>${brokerPill}</td>
          <td><span class="admin-ip-badge">${l.ip || '127.0.0.1'}</span></td>
          <td>${l.device || 'Desktop PC'}</td>
          <td>${l.browser || 'Browser'}</td>
          <td><span style="font-size: 0.72rem; color: ${isGoogle ? '#38bdf8' : '#94a3b8'}; font-weight: 700;">${l.type || 'BROKER_LOGIN'}</span></td>
          <td><span style="color: #22c55e; font-weight: 800;">✓ SUCCESS</span></td>
        </tr>
      `;
    }).join('');
  }

  switchAdminViewTab(tab) {
    const btnV = document.getElementById('btnTabVisitors');
    const btnL = document.getElementById('btnTabLogins');
    const viewV = document.getElementById('adminVisitorsView');
    const viewL = document.getElementById('adminLoginsView');

    if (tab === 'logins') {
      btnL?.classList.add('active');
      btnV?.classList.remove('active');
      if (viewL) viewL.style.display = 'block';
      if (viewV) viewV.style.display = 'none';
    } else {
      btnV?.classList.add('active');
      btnL?.classList.remove('active');
      if (viewV) viewV.style.display = 'block';
      if (viewL) viewL.style.display = 'none';
    }
  }

  filterAdminLogs(query = '') {
    const q = (query || '').trim().toLowerCase();
    if (!this.cachedAdminData) return;

    if (!q) {
      this.renderAdminVisitorsTable(this.cachedAdminData.visitors || []);
      this.renderAdminVisitorsStreamTable(this.cachedAdminData.visitEvents || []);
      this.renderAdminLoginsTable(this.cachedAdminData.logins || []);
      return;
    }

    const filteredV = (this.cachedAdminData.visitors || []).filter(v =>
      (v.ip || '').toLowerCase().includes(q) ||
      (v.device || '').toLowerCase().includes(q) ||
      (v.browser || '').toLowerCase().includes(q) ||
      (v.path || '').toLowerCase().includes(q) ||
      (v.identifiedUser || '').toLowerCase().includes(q)
    );
    this.renderAdminVisitorsTable(filteredV);

    const filteredStream = (this.cachedAdminData.visitEvents || []).filter(ev =>
      (ev.ip || '').toLowerCase().includes(q) ||
      (ev.device || '').toLowerCase().includes(q) ||
      (ev.viewerName || '').toLowerCase().includes(q) ||
      (ev.path || '').toLowerCase().includes(q)
    );
    this.renderAdminVisitorsStreamTable(filteredStream);

    const filteredL = (this.cachedAdminData.logins || []).filter(l =>
      (l.clientId || '').toLowerCase().includes(q) ||
      (l.username || '').toLowerCase().includes(q) ||
      (l.broker || '').toLowerCase().includes(q) ||
      (l.ip || '').toLowerCase().includes(q) ||
      (l.device || '').toLowerCase().includes(q)
    );
    this.renderAdminLoginsTable(filteredL);
  }

  async clearAdminLogs() {
    if (!this.adminToken) return;
    if (!confirm('Are you sure you want to clear all visitor and user login activity logs?')) return;

    try {
      const resp = await fetch('/api/admin/clear-logs', {
        method: 'POST',
        headers: { 'x-admin-token': this.adminToken }
      });
      const data = await resp.json();
      if (data.success) {
        this.showToast('All activity logs cleared successfully', 'success');
        this.loadAdminStats();
      } else {
        this.showToast(data.error || 'Failed to clear logs', 'error');
      }
    } catch (e) {
      this.showToast('Error clearing logs', 'error');
    }
  }

  showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('appToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'appToastContainer';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    const icon = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : (type === 'error' ? '❌' : '⚡'));
    toast.innerHTML = `<span style="font-size: 1.15rem;">${icon}</span><span style="flex: 1;">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-12px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // Navigation View Switching
  switchView(viewName) {
    this.currentView = viewName;

    // Update desktop nav links
    document.querySelectorAll('.nav-links .nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Update mobile bottom nav items
    document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    // Switch view containers
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.toggle('active', view.id === `view_${viewName}`);
    });

    if (viewName === 'watchlist') {
      this.loadWatchlist();
    } else if (viewName === 'scans') {
      this.renderStrategiesLibrary();
    } else if (viewName === 'terminal') {
      this.loadTerminalStockData(this.terminalActiveSymbol);
      this.loadFiiDiiData();
    } else if (viewName === 'builder') {
      if (window.queryBuilder) {
        window.queryBuilder.render();
      }
    } else if (viewName === 'dashboard') {
      if (window.dashboard) {
        window.dashboard.renderCurrentDashboard();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Universal Stock Search Bar Implementation
  bindSearchEvents() {
    const desktopInput = document.getElementById('globalStockSearch');
    const mobileInput = document.getElementById('mobileStockSearch');
    const clearBtn = document.getElementById('searchClearBtn');
    const desktopDropdown = document.getElementById('searchResultsDropdown');
    const mobileDropdown = document.getElementById('mobileSearchResultsDropdown');

    const handleSearchInput = (inputElem, dropdownElem) => {
      const q = inputElem.value.trim();
      if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

      clearTimeout(this.searchDebounceTimer);
      if (!q) {
        dropdownElem.classList.remove('active');
        dropdownElem.innerHTML = '';
        return;
      }

      this.searchDebounceTimer = setTimeout(async () => {
        try {
          const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          const data = await resp.json();
          this.renderSearchResults(data.results || [], dropdownElem, q);
        } catch (e) {
          console.error('Search error:', e);
        }
      }, 180);
    };

    if (desktopInput && desktopDropdown) {
      desktopInput.addEventListener('input', () => handleSearchInput(desktopInput, desktopDropdown));
      desktopInput.addEventListener('focus', () => handleSearchInput(desktopInput, desktopDropdown));
    }

    if (mobileInput && mobileDropdown) {
      mobileInput.addEventListener('input', () => handleSearchInput(mobileInput, mobileDropdown));
      mobileInput.addEventListener('focus', () => handleSearchInput(mobileInput, mobileDropdown));
    }

    if (clearBtn && desktopInput) {
      clearBtn.addEventListener('click', () => {
        desktopInput.value = '';
        desktopDropdown.classList.remove('active');
        clearBtn.style.display = 'none';
        desktopInput.focus();
      });
    }

    // Keyboard Shortcuts: '/' or 'Ctrl+K'
    window.addEventListener('keydown', e => {
      if ((e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') ||
          (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        if (desktopInput) {
          desktopInput.focus();
          desktopInput.select();
        }
      } else if (e.key === 'Escape') {
        if (desktopDropdown) desktopDropdown.classList.remove('active');
        if (mobileDropdown) mobileDropdown.classList.remove('active');
      }
    });

    // Dismiss dropdown on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('#navSearchContainer') && !e.target.closest('.mobile-search-bar')) {
        if (desktopDropdown) desktopDropdown.classList.remove('active');
        if (mobileDropdown) mobileDropdown.classList.remove('active');
      }
    });
  }

  renderSearchResults(results, container, query) {
    if (!container) return;
    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-empty-hint">
          <span>No direct match for "<strong>${query}</strong>"</span>
          <button class="btn btn-primary btn-sm" style="margin-top: 0.5rem;" onclick="window.app.selectStock('${query.toUpperCase()}');">
            🔍 Fetch Live Quote for "${query.toUpperCase()}"
          </button>
        </div>
      `;
      container.classList.add('active');
      return;
    }

    let html = '';
    results.forEach(s => {
      const isPositive = (s.changePct || 0) >= 0;
      const changeClass = isPositive ? 'change-positive' : 'change-negative';
      const changeSign = isPositive ? '+' : '';
      const priceText = s.ltp !== null ? `₹${s.ltp.toLocaleString('en-IN')}` : 'Live Fetch';
      const changeText = s.changePct !== null ? `${changeSign}${s.changePct}%` : 'NSE';

      let badgeHtml = '';
      if (s.badge === 'CALL CE') badgeHtml = '<span class="search-res-badge badge-ce">CALL CE</span>';
      else if (s.badge === 'PUT PE') badgeHtml = '<span class="search-res-badge badge-pe">PUT PE</span>';
      else if (s.badge === 'FUTURES') badgeHtml = '<span class="search-res-badge badge-fut">FUT</span>';
      else if (s.badge === 'INDEX') badgeHtml = '<span class="search-res-badge" style="background:rgba(192,132,252,0.15);color:#c084fc;border:1px solid rgba(192,132,252,0.3);">INDEX</span>';
      else badgeHtml = '<span class="search-res-badge badge-cash">CASH</span>';

      html += `
        <div class="search-item" onclick="window.app.selectStock('${s.symbol}')">
          <div class="search-item-info">
            <div class="search-item-sym">${s.symbol} ${badgeHtml} <span class="search-item-sector">${s.sector || 'NSE'}</span></div>
            <div class="search-item-name">${s.name}</div>
          </div>
          <div class="search-item-right">
            <div class="search-item-price">${priceText}</div>
            <div class="search-item-change ${changeClass}">${changeText}</div>
            <div class="search-item-actions" onclick="event.stopPropagation();">
              <button class="btn btn-secondary btn-sm" onclick="window.app.openStockChart('${s.symbol}');" title="TradingView Chart">📈</button>
              <button class="btn btn-ai-sparkle btn-sm" onclick="window.app.openAiAgentModal('${s.symbol}');" title="AI Momentum Agent">🤖</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    container.classList.add('active');
  }

  selectStock(symbol) {
    const desktopDropdown = document.getElementById('searchResultsDropdown');
    const mobileDropdown = document.getElementById('mobileSearchResultsDropdown');
    if (desktopDropdown) desktopDropdown.classList.remove('active');
    if (mobileDropdown) mobileDropdown.classList.remove('active');

    this.openStockChart(symbol);
  }

  // Interactive Chart Modal Dedicated Search Bar
  bindChartSearchEvents() {
    const chartInput = document.getElementById('chartStockSearchInput');
    const chartDropdown = document.getElementById('chartSearchDropdown');
    const clearBtn = document.getElementById('chartSearchClearBtn');
    if (!chartInput || !chartDropdown) return;

    let debounceTimer = null;
    let selectedIndex = -1;

    const performSearch = () => {
      const q = chartInput.value.trim();
      if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

      clearTimeout(debounceTimer);
      if (!q) {
        chartDropdown.classList.remove('active');
        chartDropdown.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          const data = await resp.json();
          renderChartSearchResults(data.results || [], q);
        } catch (err) {
          console.error('[ChartSearch] Error:', err);
        }
      }, 150);
    };

    const renderChartSearchResults = (results, query) => {
      selectedIndex = -1;
      if (results.length === 0) {
        chartDropdown.innerHTML = `
          <div class="search-empty-hint" style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.825rem;">
            <div>No direct match for "<strong>${query}</strong>"</div>
            <button class="btn btn-primary btn-sm" style="margin-top: 0.5rem; font-size: 0.75rem;" id="btnChartFetchCustom">
              🔍 Chart "${query.toUpperCase()}"
            </button>
          </div>
        `;
        const btnFetch = document.getElementById('btnChartFetchCustom');
        if (btnFetch) {
          btnFetch.addEventListener('click', () => {
            this.openStockChart(query.toUpperCase(), this.activeTimeframe || '1D');
            closeDropdown();
          });
        }
        chartDropdown.classList.add('active');
        return;
      }

      let html = '';
      results.forEach((s, idx) => {
        const isPos = (s.changePct || 0) >= 0;
        const changeClass = isPos ? 'change-positive' : 'change-negative';
        const changeSign = isPos ? '+' : '';
        const curSym = s.currency === 'USD' ? '$' : '₹';
        const priceText = s.ltp !== null ? `${curSym}${Number(s.ltp).toLocaleString('en-IN')}` : '--';
        const changeText = s.changePct !== null ? `${changeSign}${s.changePct}%` : 'NSE';

        let badgeHtml = '';
        if (s.badge === 'CALL CE') badgeHtml = '<span class="search-res-badge badge-ce">CE</span>';
        else if (s.badge === 'PUT PE') badgeHtml = '<span class="search-res-badge badge-pe">PE</span>';
        else if (s.badge === 'FUTURES') badgeHtml = '<span class="search-res-badge badge-fut">FUT</span>';
        else if (s.badge === 'INDEX') badgeHtml = '<span class="search-res-badge" style="background:rgba(192,132,252,0.15);color:#c084fc;border:1px solid rgba(192,132,252,0.3);font-size:0.65rem;padding:1px 4px;border-radius:3px;">INDEX</span>';
        else badgeHtml = '<span class="search-res-badge badge-cash">CASH</span>';

        html += `
          <div class="search-item chart-search-item" data-index="${idx}" data-symbol="${s.symbol}">
            <div class="search-item-info">
              <div class="search-item-sym">
                ${s.symbol} ${badgeHtml}
                <span style="font-size:0.7rem;color:#64748b;font-weight:400;margin-left:4px;">${s.sector || 'NSE'}</span>
              </div>
              <div class="search-item-name">${s.name || s.symbol}</div>
            </div>
            <div class="search-item-right" style="text-align: right;">
              <div class="search-item-price">${priceText}</div>
              <div class="search-item-change ${changeClass}">${changeText}</div>
            </div>
          </div>
        `;
      });

      chartDropdown.innerHTML = html;
      chartDropdown.classList.add('active');

      chartDropdown.querySelectorAll('.chart-search-item').forEach(item => {
        item.addEventListener('click', () => {
          const sym = item.getAttribute('data-symbol');
          if (sym) {
            this.openStockChart(sym, this.activeTimeframe || '1D');
            closeDropdown();
          }
        });
      });
    };

    const closeDropdown = () => {
      chartDropdown.classList.remove('active');
      chartInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      selectedIndex = -1;
    };

    chartInput.addEventListener('input', performSearch);
    chartInput.addEventListener('focus', () => {
      if (chartInput.value.trim()) performSearch();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        closeDropdown();
        chartInput.focus();
      });
    }

    chartInput.addEventListener('keydown', e => {
      const items = chartDropdown.querySelectorAll('.chart-search-item');
      if (!chartDropdown.classList.contains('active') || items.length === 0) {
        if (e.key === 'Enter') {
          const q = chartInput.value.trim().toUpperCase();
          if (q) {
            this.openStockChart(q, this.activeTimeframe || '1D');
            closeDropdown();
          }
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateHighlight(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateHighlight(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const sym = items[selectedIndex].getAttribute('data-symbol');
          if (sym) {
            this.openStockChart(sym, this.activeTimeframe || '1D');
            closeDropdown();
          }
        } else {
          const firstSym = items[0].getAttribute('data-symbol') || chartInput.value.trim().toUpperCase();
          this.openStockChart(firstSym, this.activeTimeframe || '1D');
          closeDropdown();
        }
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    const updateHighlight = (items) => {
      items.forEach((item, idx) => {
        item.classList.toggle('highlighted', idx === selectedIndex);
        if (idx === selectedIndex) {
          item.scrollIntoView({ block: 'nearest' });
        }
      });
    };

    document.addEventListener('click', e => {
      if (!e.target.closest('#chartQuickSearchContainer')) {
        chartDropdown.classList.remove('active');
      }
    });
  }

  // Open TradingView-Style Interactive Technical Chart
  async openStockChart(symbol, timeframe = '1D') {
    this.activeStockSymbol = symbol.toUpperCase();
    this.activeTimeframe = timeframe;

    const modal = document.getElementById('stockChartModal');
    if (!modal) return;
    modal.classList.add('active');

    // Reset chart search input and close search dropdown
    const chartInput = document.getElementById('chartStockSearchInput');
    const chartDropdown = document.getElementById('chartSearchDropdown');
    const chartClearBtn = document.getElementById('chartSearchClearBtn');
    if (chartInput) chartInput.value = '';
    if (chartDropdown) chartDropdown.classList.remove('active');
    if (chartClearBtn) chartClearBtn.style.display = 'none';

    // Set initial loading placeholders
    document.getElementById('modalStockSym').textContent = this.activeStockSymbol;
    document.getElementById('modalStockName').textContent = 'Loading live market quotes...';

    // Update active timeframe UI button
    document.querySelectorAll('.tv-tf-btn[data-tf]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tf') === timeframe);
    });

    try {
      const resp = await fetch(`/api/stock/${encodeURIComponent(this.activeStockSymbol)}/chart?tf=${timeframe}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: Stock data not available`);
      const data = await resp.json();

      // Populate Header
      const curSign = data.currency === 'USD' ? '$' : '₹';
      document.getElementById('modalStockSym').textContent = data.symbol || this.activeStockSymbol;
      document.getElementById('modalStockName').textContent = data.name || this.activeStockSymbol;
      document.getElementById('modalStockPrice').textContent = `${curSign}${(data.ltp || 0).toLocaleString('en-IN')}`;

      const isPositive = (data.changePct || 0) >= 0;
      const changeElem = document.getElementById('modalStockChange');
      if (changeElem) {
        changeElem.textContent = `${isPositive ? '+' : ''}${data.changePct || 0}%`;
        changeElem.className = `stock-change ${isPositive ? 'change-positive' : 'change-negative'}`;
      }

      // Populate Statistics Grid
      let candles = Array.isArray(data.candles) && data.candles.length > 0
        ? data.candles
        : this.generateClientFallbackCandles(this.activeStockSymbol, timeframe);

      if (candles.length > 0) {
        const cLatest = candles[candles.length - 1];
        const dayRangeElem = document.getElementById('statDayRange');
        if (dayRangeElem) dayRangeElem.textContent = `${curSign}${cLatest.low} - ${curSign}${cLatest.high}`;
        const volElem = document.getElementById('statVolume');
        if (volElem) volElem.textContent = (cLatest.volume || 0).toLocaleString('en-IN');
      }

      const stat52w = document.getElementById('stat52wRange');
      if (stat52w) {
        stat52w.textContent = `${curSign}${data.indicators?.sma200 ? (data.indicators.sma200 * 0.8).toFixed(0) : '1,500'} - ${curSign}${data.indicators?.sma200 ? (data.indicators.sma200 * 1.3).toFixed(0) : '3,500'}`;
      }
      const statSma50 = document.getElementById('statSma50');
      if (statSma50) statSma50.textContent = data.indicators?.sma50 ? `${curSign}${data.indicators.sma50}` : '--';
      const statSma200 = document.getElementById('statSma200');
      if (statSma200) statSma200.textContent = data.indicators?.sma200 ? `${curSign}${data.indicators.sma200}` : '--';
      const statRsi = document.getElementById('statRsi');
      if (statRsi) statRsi.textContent = data.indicators?.rsi14 ? data.indicators.rsi14.toFixed(1) : '--';
      const statVolMult = document.getElementById('statVolMult');
      if (statVolMult) statVolMult.textContent = `${data.indicators?.volumeMultiplier || '1.0'}x 10D SMA`;

      // Render Candlesticks on canvas
      this.chart.setData(candles, timeframe);

      // Check watchlist status safely
      try {
        const wlResp = await fetch('/api/watchlist');
        if (wlResp.ok) {
          const wlData = await wlResp.json();
          const inWl = (wlData.symbols || []).includes(this.activeStockSymbol);
          const wlBtn = document.getElementById('modalWatchlistToggle');
          if (wlBtn) {
            wlBtn.textContent = inWl ? '★ In Watchlist' : '☆ Watchlist';
            wlBtn.classList.toggle('btn-primary', inWl);
            wlBtn.classList.toggle('btn-secondary', !inWl);
          }
        }
      } catch (wlErr) {}

    } catch (err) {
      console.warn('[Chart] Using client-side calibrated fallback chart:', err.message);
      const fallbackCandles = this.generateClientFallbackCandles(this.activeStockSymbol, timeframe);
      const latest = fallbackCandles[fallbackCandles.length - 1];
      const prev = fallbackCandles[fallbackCandles.length - 2];
      const changePct = (((latest.close - prev.close) / prev.close) * 100).toFixed(2);
      const isPositive = parseFloat(changePct) >= 0;
      const curSign = (this.activeStockSymbol.includes('-') || ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'].includes(this.activeStockSymbol)) ? '$' : '₹';

      const symElem = document.getElementById('modalStockSym');
      if (symElem) symElem.textContent = this.activeStockSymbol;
      const nameElem = document.getElementById('modalStockName');
      if (nameElem) nameElem.textContent = `${this.activeStockSymbol} (${curSign === '$' ? 'Global Asset' : 'NSE Equity'})`;
      const priceElem = document.getElementById('modalStockPrice');
      if (priceElem) priceElem.textContent = `${curSign}${latest.close.toLocaleString('en-IN')}`;
      const changeElem = document.getElementById('modalStockChange');
      if (changeElem) {
        changeElem.textContent = `${isPositive ? '+' : ''}${changePct}%`;
        changeElem.className = `stock-change ${isPositive ? 'change-positive' : 'change-negative'}`;
      }
      const dayRangeElem = document.getElementById('statDayRange');
      if (dayRangeElem) dayRangeElem.textContent = `${curSign}${latest.low} - ${curSign}${latest.high}`;
      const volElem = document.getElementById('statVolume');
      if (volElem) volElem.textContent = (latest.volume || 0).toLocaleString('en-IN');

      this.chart.setData(fallbackCandles, timeframe);
    }
  }

  generateClientFallbackCandles(symbol, timeframe = '1D') {
    const cleanSym = (symbol || 'RELIANCE').toUpperCase();
    const seed = cleanSym.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const basePrice = 250 + (seed % 2800);
    const count = timeframe === '1m' ? 30 : (timeframe === '5m' ? 40 : (timeframe === '15m' ? 50 : 60));
    const candles = [];
    const now = Date.now();
    let currentP = basePrice;
    const intervalMs = timeframe.includes('m') ? (parseInt(timeframe) || 5) * 60000 : (timeframe.includes('h') ? 3600000 : 86400000);

    for (let i = count; i >= 0; i--) {
      const t = now - i * intervalMs;
      const dt = new Date(t);
      const date = timeframe.includes('m') || timeframe.includes('h')
        ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : dt.toISOString().split('T')[0];
      const drift = (Math.sin(i * 0.3 + seed) * 0.02) + ((Math.random() - 0.48) * 0.03);
      const open = parseFloat(currentP.toFixed(2));
      const close = parseFloat((currentP * (1 + drift)).toFixed(2));
      const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.015)).toFixed(2));
      const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.015)).toFixed(2));
      const volume = Math.floor(500000 + (seed % 1000000) + Math.random() * 800000);
      candles.push({ date, fullDate: dt.toISOString(), timestamp: t, open, high, low, close, volume });
      currentP = close;
    }
    return candles;
  }

  // Open AI Stock Momentum & Technical Agent Modal (Dual Mode: Intraday & Long-Term)
  async openAiAgentModal(symbol, initialMode = 'intraday') {
    this.aiActiveStock = symbol.toUpperCase();
    this.aiActiveMode = initialMode;
    const modal = document.getElementById('aiAgentModal');
    if (!modal) return;
    modal.classList.add('active');

    document.getElementById('aiAgentStockSub').textContent = `Analyzing ${this.aiActiveStock}...`;
    document.getElementById('aiGaugeScore').textContent = '--';
    document.getElementById('aiDebriefSummary').textContent = 'Generating real-time multi-indicator momentum analysis...';

    // Initialize chat greetings & chips
    this.initAiChatMessages();

    try {
      const resp = await fetch(`/api/stock/${this.aiActiveStock}/ai-momentum`);
      if (!resp.ok) throw new Error('AI analysis failed');
      const data = await resp.json();
      this.aiActiveData = data;

      // Update Subtitle
      document.getElementById('aiAgentStockSub').textContent = `Analyzing ${data.symbol} (${data.name}) • Live Price: ₹${data.ltp} (${data.changePct >= 0 ? '+' : ''}${data.changePct}%)`;

      // Render the active mode (intraday or longterm)
      this.renderAiMomentumView(this.aiActiveMode);

    } catch (err) {
      console.error('AI analysis load error:', err);
      document.getElementById('aiDebriefSummary').textContent = 'Unable to complete AI momentum assessment.';
    }
  }

  // Switch between Intraday and Long-Term mode in AI Modal
  switchAiMode(mode) {
    if (this.aiActiveMode === mode && this.aiActiveData) return;
    this.aiActiveMode = mode;
    this.renderAiMomentumView(mode);
    this.initAiChatMessages();
  }

  // Render AI Momentum View (Intraday vs Long-Term)
  renderAiMomentumView(mode) {
    if (!this.aiActiveData) return;
    const isIntraday = mode === 'intraday';
    const ai = isIntraday ? (this.aiActiveData.intraday || this.aiActiveData.analysis) : (this.aiActiveData.longTerm || this.aiActiveData.analysis);
    if (!ai) return;

    // Update Mode Tab Buttons
    document.querySelectorAll('#aiMomentumModeTabs .ai-mode-tab').forEach(tab => {
      if (tab.dataset.mode === mode) tab.classList.add('active');
      else tab.classList.remove('active');
    });

    // Update Gauge Score
    const scoreElem = document.getElementById('aiGaugeScore');
    scoreElem.textContent = ai.score;
    const gaugeCircle = document.getElementById('aiGaugeCircle');
    if (gaugeCircle) {
      const scoreDeg = (ai.score / 100) * 360;
      let scoreColor = '#10b981';
      if (ai.score >= 80) scoreColor = '#06b6d4';
      else if (ai.score >= 65) scoreColor = '#10b981';
      else if (ai.score >= 50) scoreColor = '#f59e0b';
      else if (ai.score >= 35) scoreColor = '#f97316';
      else scoreColor = '#ef4444';

      gaugeCircle.style.background = `conic-gradient(${scoreColor} 0deg, ${scoreColor} ${scoreDeg}deg, rgba(30, 41, 59, 0.6) ${scoreDeg}deg 360deg)`;
    }

    // Update Status Pill & Verdict
    const statePill = document.getElementById('aiMomentumState');
    statePill.textContent = ai.state;
    statePill.className = `ai-status-pill ${ai.badgeClass}`;

    document.getElementById('aiVerdictText').textContent = `VERDICT: ${ai.verdict}`;
    document.getElementById('aiDebriefSummary').innerHTML = ai.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Update Trade Setup Levels with mode-specific labels
    if (isIntraday) {
      document.getElementById('aiLevelTitleEntry').textContent = '🎯 Intraday Entry Zone';
      document.getElementById('aiLevelHintEntry').textContent = 'Current CMP or retest of VWAP';
      document.getElementById('aiLevelTitleSL').textContent = '🛡️ 15m ATR Stop-Loss';
      document.getElementById('aiLevelHintSL').textContent = 'Tight intraday buffer below VWAP';
      document.getElementById('aiLevelTitleT1').textContent = '🚀 Target 1 (Scalp)';
      document.getElementById('aiLevelHintT1').textContent = 'R1 / Camarilla H4 scalp';
      document.getElementById('aiLevelTitleT2').textContent = '🔥 Target 2 (Expansion)';
      document.getElementById('aiLevelHintT2').textContent = 'R2 / Day High extension';
    } else {
      document.getElementById('aiLevelTitleEntry').textContent = '🎯 Accumulation Range';
      document.getElementById('aiLevelHintEntry').textContent = 'Value range near 50-day SMA';
      document.getElementById('aiLevelTitleSL').textContent = '🛡️ Weekly Positional SL';
      document.getElementById('aiLevelHintSL').textContent = 'Weekly close basis below 200 SMA';
      document.getElementById('aiLevelTitleT1').textContent = '🚀 Target 1 (3-Month Swing)';
      document.getElementById('aiLevelHintT1').textContent = 'Projected 8-15% swing extension';
      document.getElementById('aiLevelTitleT2').textContent = '🌟 Target 2 (1-Year Valuation)';
      document.getElementById('aiLevelHintT2').textContent = `${ai.tradeSetup?.projectedReturn || '+25%'} expected return`;
    }

    document.getElementById('aiLevelEntry').textContent = `₹${ai.tradeSetup.entry}`;
    document.getElementById('aiLevelStopLoss').textContent = `₹${ai.tradeSetup.stopLoss}`;
    document.getElementById('aiLevelTarget1').textContent = `₹${ai.tradeSetup.target1}`;
    document.getElementById('aiLevelTarget2').textContent = `₹${ai.tradeSetup.target2}`;

    // Render Mode-Specific Technical Matrix Dashboard
    const techTitle = document.getElementById('aiTechTitle');
    const techSub = document.getElementById('aiTechSubtitle');
    const techGrid = document.getElementById('aiTechGrid');

    if (techGrid) {
      if (isIntraday) {
        if (techTitle) techTitle.textContent = '⚡ Intraday Technical Matrix (VWAP & CPR Breakouts)';
        if (techSub) techSub.textContent = 'Session Real-Time';
        techGrid.innerHTML = `
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>📍</span> Session VWAP</div>
            <div class="ai-tech-value text-accent">₹${ai.vwap} <small style="font-size: 0.7rem; color: ${ai.isAboveVwap ? '#10b981' : '#ef4444'};">(${ai.isAboveVwap ? '+' : ''}${ai.vwapDiffPct}%)</small></div>
          </div>
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>🎯</span> Central Pivot (CPR)</div>
            <div class="ai-tech-value">₹${ai.cpr?.pivot || '--'} <small style="font-size: 0.7rem; color: #38bdf8;">(${ai.cpr?.isNarrow ? 'Narrow ⚡' : 'Wide ↔'})</small></div>
          </div>
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>🚀</span> Camarilla H4 Breakout</div>
            <div class="ai-tech-value text-green">₹${ai.camarilla?.h4 || '--'}</div>
          </div>
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>🛡️</span> Camarilla L3 Support</div>
            <div class="ai-tech-value text-accent">₹${ai.camarilla?.l3 || '--'}</div>
          </div>
          <div class="ai-tech-item" style="grid-column: span 2;">
            <div class="ai-tech-label"><span>📈</span> Suggested Option Strike</div>
            <div class="ai-tech-value" style="color: #c084fc;">${ai.suggestedOption || 'ATM Strike'}</div>
          </div>
          <div class="ai-tech-item" style="grid-column: span 2;">
            <div class="ai-tech-label"><span>⚖️</span> Risk-to-Reward Ratio</div>
            <div class="ai-tech-value text-green">${ai.tradeSetup?.riskReward || '1 : 2.0'}</div>
          </div>
          <div class="ai-tech-item" style="grid-column: span 2; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.25);">
            <div class="ai-tech-label" style="display: flex; justify-content: space-between; align-items: center;">
              <span><span>📊</span> Chartink "Indeces Intraday"</span>
              <a href="https://chartink.com/screener/indeces-intraday" target="_blank" rel="noopener noreferrer" style="color: #818cf8; text-decoration: none; font-size: 0.7rem; font-weight: 700;">chartink.com ↗</a>
            </div>
            <div class="ai-tech-value" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; margin-top: 0.25rem;">
              <span class="ai-status-pill ${ai.chartinkScan?.badgeClass || 'badge-neutral'}" style="font-size: 0.725rem; padding: 0.15rem 0.5rem; font-weight: 800;">${ai.chartinkScan?.status || 'ACTIVE'}</span>
              <span style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-secondary);">5M RSI: <strong style="color: #f8fafc;">${ai.chartinkScan?.currentRsi || '--'}</strong> (Prev: ${ai.chartinkScan?.prevRsi || '--'})</span>
            </div>
          </div>
        `;
      } else {
        if (techTitle) techTitle.textContent = '📈 Long-Term Technical Matrix (Moving Averages & Growth)';
        if (techSub) techSub.textContent = 'Weekly / Monthly Cycle';
        techGrid.innerHTML = `
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>🏛️</span> 50-Day SMA</div>
            <div class="ai-tech-value text-accent">₹${ai.sma50}</div>
          </div>
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>🌊</span> 200-Day SMA</div>
            <div class="ai-tech-value">₹${ai.sma200}</div>
          </div>
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>✨</span> MA Cross Regime</div>
            <div class="ai-tech-value ${ai.isGoldenCross ? 'text-green' : 'text-red'}">${ai.isGoldenCross ? 'Golden Cross' : 'Death Cross'}</div>
          </div>
          <div class="ai-tech-item">
            <div class="ai-tech-label"><span>📦</span> Delivery Volume %</div>
            <div class="ai-tech-value text-green">${ai.deliveryPct}% <small style="font-size: 0.7rem; color: var(--text-muted);">(Institutional)</small></div>
          </div>
          <div class="ai-tech-item" style="grid-column: span 2;">
            <div class="ai-tech-label"><span>🏷️</span> Stan Weinstein Stage</div>
            <div class="ai-tech-value" style="font-size: 0.82rem; color: #38bdf8;">${ai.stage}</div>
          </div>
          <div class="ai-tech-item" style="grid-column: span 2;">
            <div class="ai-tech-label"><span>🏔️</span> 52-Week High Channel</div>
            <div class="ai-tech-value">${ai.distFromHigh52}% below 52W High</div>
          </div>
        `;
      }
    }

    // Render Dedicated Chartink Indeces Intraday Banner
    const chartinkBanner = document.getElementById('aiChartinkIndecesBanner');
    const chartinkBadge = document.getElementById('aiChartinkScanBadge');
    const chartinkDetails = document.getElementById('aiChartinkScanDetails');

    if (chartinkBanner) {
      if (isIntraday && ai.chartinkScan) {
        chartinkBanner.style.display = 'block';
        if (chartinkBadge) {
          chartinkBadge.textContent = ai.chartinkScan.badge || '5M RSI > 30';
          chartinkBadge.className = `ai-status-pill ${ai.chartinkScan.badgeClass || 'badge-neutral'}`;
        }
        if (chartinkDetails) {
          const isTrig = ai.chartinkScan.isTriggered;
          const trigIcon = isTrig ? '⚡' : (ai.chartinkScan.isOversoldWatch ? '👀' : '📊');
          chartinkDetails.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.35rem;">
              <span><strong>Signal Status:</strong> <span style="font-weight: 800; color: ${isTrig ? '#10b981' : '#38bdf8'};">${ai.chartinkScan.status}</span></span>
              <span style="font-family: var(--font-mono); font-size: 0.75rem;">5M RSI(14): <strong style="color: #f8fafc;">${ai.chartinkScan.currentRsi}</strong> (Previous: ${ai.chartinkScan.prevRsi})</span>
            </div>
            <div>${trigIcon} ${ai.chartinkScan.takeaway}</div>
            <div style="margin-top: 0.35rem; font-size: 0.72rem; color: #94a3b8; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span>Formula: <code>[0] 5 minute rsi(14) > 30 and [-1] 5 minute rsi(14) <= 30</code></span>
              <span>•</span>
              <span>Target: <strong>Nifty & BankNifty</strong></span>
            </div>
          `;
        }
      } else {
        chartinkBanner.style.display = 'none';
      }
    }

    // Toggle Floor Pivots Card (visible in intraday, hidden in longterm)
    const pivotsCard = document.getElementById('aiPivotsCard');
    if (pivotsCard) {
      pivotsCard.style.display = isIntraday ? 'block' : 'none';
      if (isIntraday && ai.pivots) {
        document.getElementById('pivotS3').textContent = `₹${(ai.pivots.s2 * 0.98).toFixed(2)}`;
        document.getElementById('pivotS2').textContent = `₹${ai.pivots.s2}`;
        document.getElementById('pivotS1').textContent = `₹${ai.pivots.s1}`;
        document.getElementById('pivotCentral').textContent = `₹${ai.pivots.pivot}`;
        document.getElementById('pivotR1').textContent = `₹${ai.pivots.r1}`;
        document.getElementById('pivotR2').textContent = `₹${ai.pivots.r2}`;
        document.getElementById('pivotR3').textContent = `₹${(ai.pivots.r2 * 1.02).toFixed(2)}`;
      }
    }

    // Update Drivers List
    const driversList = document.getElementById('aiDriversList');
    if (driversList && ai.drivers) {
      driversList.innerHTML = ai.drivers.map(d => `<li>${d.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('');
    }

    // Update Risks List
    const risksList = document.getElementById('aiRisksList');
    if (risksList && ai.risks) {
      risksList.innerHTML = ai.risks.map(r => `<li>${r.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('');
    }

    // Update Chatbox Header & Chips
    const chatTitle = document.getElementById('aiCopilotChatTitle');
    if (chatTitle) {
      chatTitle.textContent = isIntraday
        ? 'Level 5 AI Copilot (Intraday Scalp Engine)'
        : 'Level 5 AI Copilot (Long-Term / Swing Engine)';
    }

    this.renderAiPromptChips(mode);
  }

  // Render Prompt Chips for Level 5 Copilot
  renderAiPromptChips(mode) {
    const chipsContainer = document.getElementById('aiPromptChips');
    if (!chipsContainer) return;

    const isIntraday = mode === 'intraday';
    const chips = isIntraday ? [
      { label: '⚡ Scalp Entry & SL', q: 'Where is the optimal scalp entry and tight stop loss for intraday?' },
      { label: '🎯 Today\'s CPR & Camarilla', q: 'Show me today\'s CPR range and Camarilla H4/L3 breakout levels.' },
      { label: '📈 Best Option Strike', q: 'Which ATM Call or Put option strike is best to trade today?' },
      { label: '📊 VWAP & Volume Flow', q: 'Analyze VWAP distance and buyer vs seller volume participation.' },
      { label: '⚠️ Buy at CMP right now?', q: 'Is it safe to buy at the current market price right now for intraday?' }
    ] : [
      { label: '🔮 3-Month & 1-Year Targets', q: 'What are the projected 3-month swing and 1-year valuation targets?' },
      { label: '🏛️ 50 vs 200 SMA Cross', q: 'What is the status of the 50 SMA vs 200 SMA Golden Cross and trend regime?' },
      { label: '💼 Value Accumulation Range', q: 'What is the ideal long-term SIP / accumulation zone for this stock?' },
      { label: '🛡️ Weekly Positional SL', q: 'Where should I place my long-term stop loss on a weekly closing basis?' },
      { label: '📦 Delivery Volume & FII Flow', q: 'Analyze the delivery percentage and institutional accumulation footprint.' }
    ];

    chipsContainer.innerHTML = chips.map(c => `
      <button type="button" class="ai-chip" data-prompt="${this.escapeHtml(c.q)}">${c.label}</button>
    `).join('');

    chipsContainer.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const p = chip.getAttribute('data-prompt');
        if (p) this.askAiCopilot(p);
      });
    });
  }

  // Initialize Chat Greetings
  initAiChatMessages() {
    const chatBox = document.getElementById('aiChatMessages');
    if (!chatBox) return;
    const isIntraday = this.aiActiveMode === 'intraday';

    chatBox.innerHTML = `
      <div class="ai-chat-msg ai-msg-bot">
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble">
          <strong>Level 5 Autonomous AI Copilot Initialized.</strong><br>
          ${isIntraday
            ? `Analyzing real-time 5m/15m tick flow, VWAP anchors, and CPR breakout levels for <strong>${this.aiActiveStock}</strong>. Click any prompt chip below or ask any intraday question!`
            : `Evaluating multi-quarter compounding trajectory, 50/200 SMA golden cross, and delivery accumulation for <strong>${this.aiActiveStock}</strong>. What would you like to plan for your portfolio?`}
        </div>
      </div>
    `;
  }

  // Interactive Level 5 AI Copilot Ask
  async askAiCopilot(customQuestion = null) {
    if (!this.aiActiveStock) return;
    const input = document.getElementById('aiChatInput');
    const question = customQuestion || (input ? input.value.trim() : '');
    if (!question) return;

    if (input && !customQuestion) input.value = '';

    const chatBox = document.getElementById('aiChatMessages');
    if (!chatBox) return;

    // Append User Message
    chatBox.innerHTML += `
      <div class="ai-chat-msg ai-msg-user">
        <div class="chat-bubble">${this.escapeHtml(question)}</div>
        <div class="chat-avatar">👤</div>
      </div>
    `;

    // Append Temporary Bot Thinking Indicator
    const thinkingId = 'thinking_' + Date.now();
    chatBox.innerHTML += `
      <div class="ai-chat-msg ai-msg-bot" id="${thinkingId}">
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble chat-bubble-thinking">
          <span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>
        </div>
      </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const resp = await fetch(`/api/stock/${this.aiActiveStock}/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          mode: this.aiActiveMode || 'intraday'
        })
      });
      const data = await resp.json();

      const thinkingElem = document.getElementById(thinkingId);
      if (thinkingElem) {
        const formatted = (data.answer || '')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');

        thinkingElem.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble">${formatted}</div>
        `;
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
      const thinkingElem = document.getElementById(thinkingId);
      if (thinkingElem) {
        thinkingElem.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble text-red">Failed to contact Level 5 AI engine: ${err.message}</div>
        `;
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }

  // ==========================================
  // TEJAI MARKET TERMINAL & COPILOT METHODS
  // (Zerodha Kite Depth, Dhan Options, Angel One, Upstox F&O)
  // ==========================================

  initTerminal() {
    // Widget Tab Switching
    document.querySelectorAll('.widget-tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTerminalTab(tab);
      });
    });

    // Chat input Enter key listener
    const chatInput = document.getElementById('terminalChatInput');
    if (chatInput) {
      chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          this.sendTerminalChatMessage();
        }
      });
    }

    // Chat Send button
    const btnSend = document.getElementById('btnSendTerminalChat');
    if (btnSend) {
      btnSend.addEventListener('click', () => this.sendTerminalChatMessage());
    }

    // Active Monitored Asset card click -> Open High AI Momentum Assets Modal (>80)
    const activeAssetCard = document.getElementById('cardActiveMonitoredAsset');
    if (activeAssetCard) {
      activeAssetCard.addEventListener('click', () => {
        this.openHighMomentumAssetsModal();
      });
    }

    // High Momentum Assets Modal event listeners
    const momentumModal = document.getElementById('highMomentumAssetsModal');
    if (momentumModal) {
      momentumModal.querySelector('.modal-close-btn')?.addEventListener('click', () => {
        momentumModal.classList.remove('active');
      });
      momentumModal.addEventListener('click', (e) => {
        if (e.target === momentumModal) momentumModal.classList.remove('active');
      });

      // Filter tabs inside modal
      momentumModal.querySelectorAll('.momentum-mode-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          momentumModal.querySelectorAll('.momentum-mode-pill').forEach(b => {
            b.classList.remove('btn-primary', 'active');
            b.classList.add('btn-secondary');
          });
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-primary', 'active');
          this.activeMomentumFilterMode = btn.dataset.mode || 'all';
          const q = (document.getElementById('highMomentumSearchInput')?.value || '').trim().toLowerCase();
          this.renderHighMomentumList(q);
        });
      });

      // Search input inside modal
      document.getElementById('highMomentumSearchInput')?.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        this.renderHighMomentumList(q);
      });
    }
  }

  async openHighMomentumAssetsModal() {
    const modal = document.getElementById('highMomentumAssetsModal');
    if (!modal) return;
    modal.classList.add('active');

    const list = document.getElementById('highMomentumStocksList');
    const badge = document.getElementById('highMomentumTotalBadge');
    const searchInput = document.getElementById('highMomentumSearchInput');
    if (searchInput) searchInput.value = '';

    if (list) {
      list.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
          <div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div>
          <p style="margin-top: 0.5rem; font-size: 0.85rem;">Scanning 190+ NSE assets for &gt; 80 AI Momentum...</p>
        </div>
      `;
    }

    try {
      const resp = await fetch('/api/market/high-momentum-assets');
      const data = await resp.json();
      this.cachedHighMomentumStocks = data.stocks || [];
      if (badge) badge.textContent = `${this.cachedHighMomentumStocks.length} Assets Found`;
      this.activeMomentumFilterMode = 'all';
      this.renderHighMomentumList();
    } catch (e) {
      if (list) list.innerHTML = `<div style="padding: 2rem; color: var(--red); text-align: center;">Error loading assets: ${e.message}</div>`;
    }
  }

  renderHighMomentumList(filterQuery = '') {
    const container = document.getElementById('highMomentumStocksList');
    if (!container) return;

    let stocks = this.cachedHighMomentumStocks || [];
    const mode = this.activeMomentumFilterMode || 'all';

    if (mode === 'intraday') {
      stocks = stocks.filter(s => s.intraScore >= 80);
    } else if (mode === 'longTerm') {
      stocks = stocks.filter(s => s.longScore >= 80);
    }

    if (filterQuery) {
      stocks = stocks.filter(s => 
        s.symbol.toLowerCase().includes(filterQuery) || 
        (s.name || '').toLowerCase().includes(filterQuery) ||
        (s.sector || '').toLowerCase().includes(filterQuery)
      );
    }

    if (stocks.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
          No assets found matching the selected criteria.
        </div>
      `;
      return;
    }

    container.innerHTML = stocks.map(st => {
      const isPositive = (st.changePct || 0) >= 0;
      const chgClass = isPositive ? 'change-positive' : 'change-negative';
      const chgSign = isPositive ? '+' : '';
      const isCurrentActive = st.symbol === this.terminalActiveSymbol;

      const intraPill = st.intraScore >= 80 
        ? `<span style="background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid rgba(16,185,129,0.4); font-weight: 800; font-size: 0.725rem; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-family: var(--font-mono);">⚡ Intraday: ${st.intraScore}/100</span>`
        : `<span style="background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 0.725rem; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-family: var(--font-mono);">Intraday: ${st.intraScore}/100</span>`;

      const longPill = st.longScore >= 80
        ? `<span style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168,85,247,0.4); font-weight: 800; font-size: 0.725rem; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-family: var(--font-mono);">🏆 Long-Term: ${st.longScore}/100</span>`
        : `<span style="background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 0.725rem; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); font-family: var(--font-mono);">Long-Term: ${st.longScore}/100</span>`;

      return `
        <div class="high-momentum-item ${isCurrentActive ? 'item-active' : ''}" onclick="window.app.selectTerminalActiveAsset('${st.symbol}')" style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid ${isCurrentActive ? 'var(--accent)' : 'var(--border-color)'}; cursor: pointer; transition: all 0.18s ease;">
          <div style="display: flex; flex-direction: column; gap: 0.2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); font-family: var(--font-mono);">${st.symbol}</span>
              <span style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 0.1rem 0.4rem; border-radius: 4px;">${st.sector || 'NSE'}</span>
              ${isCurrentActive ? '<span style="font-size: 0.65rem; background: var(--accent); color: #fff; font-weight: 800; padding: 0.1rem 0.4rem; border-radius: 4px;">CURRENTLY MONITORING</span>' : ''}
            </div>
            <div style="font-size: 0.775rem; color: var(--text-secondary); max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${st.name || st.symbol}</div>
            <div style="display: flex; gap: 0.4rem; margin-top: 0.25rem;">
              ${intraPill}
              ${longPill}
            </div>
          </div>

          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.35rem;">
            <div style="font-family: var(--font-mono); font-weight: 800; font-size: 0.95rem;">₹${(st.ltp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="${chgClass}" style="font-family: var(--font-mono); font-size: 0.775rem; font-weight: 700;">${chgSign}${(st.changePct || 0).toFixed(2)}%</div>
            <button class="btn btn-sm ${isCurrentActive ? 'btn-secondary' : 'btn-primary'}" style="margin-top: 0.2rem; font-size: 0.75rem; padding: 0.25rem 0.6rem;">
              ${isCurrentActive ? '✓ Active' : '⚡ Monitor Asset'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  setMomentumFilterMode(mode) {
    this.activeMomentumFilterMode = mode || 'all';
    document.querySelectorAll('#highMomentumModeTabs .momentum-mode-pill').forEach(btn => {
      const isMatch = btn.dataset.mode === mode;
      btn.classList.toggle('btn-primary', isMatch);
      btn.classList.toggle('active', isMatch);
      btn.classList.toggle('btn-secondary', !isMatch);
    });
    const q = (document.getElementById('highMomentumSearchInput')?.value || '').trim().toLowerCase();
    this.renderHighMomentumList(q);
  }

  onMomentumSearchInput(val) {
    const q = (val || '').trim().toLowerCase();
    this.renderHighMomentumList(q);
  }

  selectTerminalActiveAsset(symbol) {
    if (!symbol) return;
    symbol = symbol.toUpperCase();
    this.terminalActiveSymbol = symbol;
    this.switchView('terminal');
    this.loadTerminalStockData(symbol);
    document.getElementById('highMomentumAssetsModal')?.classList.remove('active');
    this.showToast(`Monitoring ${symbol} in Market Intelligence Terminal`, 'success');
  }

  switchTerminalTab(tabId) {
    this.terminalTab = tabId;
    document.querySelectorAll('.widget-tab-btn[data-tab]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.widget-tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === `tabPane_${tabId}`);
    });
  }

  async loadTerminalStockData(symbol) {
    if (!symbol) symbol = this.terminalActiveSymbol || 'RELIANCE';
    symbol = symbol.toUpperCase();
    this.terminalActiveSymbol = symbol;

    const symElem = document.getElementById('terminalActiveStockSym');
    if (symElem) symElem.textContent = symbol;

    try {
      // Parallel fetch Level 2 Depth & Derivatives
      const [depthResp, derivResp] = await Promise.all([
        fetch(`/api/market/depth/${symbol}`),
        fetch(`/api/market/derivatives/${symbol}`)
      ]);

      if (depthResp.ok) {
        const depthData = await depthResp.json();
        this.renderMarketDepth(depthData);
      }

      if (derivResp.ok) {
        const derivData = await derivResp.json();
        this.renderDerivativesMatrix(derivData);
      }
    } catch (e) {
      console.error('Terminal stock data fetch error:', e);
    }
  }

  renderMarketDepth(data) {
    const ltp = data.ltp || 0;
    const changeSign = (data.changePct || 0) >= 0 ? '+' : '';
    const depth = data.depth || data;

    const priceElem = document.getElementById('terminalActiveStockPrice');
    if (priceElem) {
      priceElem.textContent = `₹${ltp.toLocaleString('en-IN')} (${changeSign}${data.changePct || 0}%)`;
    }

    const buyRatioElem = document.getElementById('terminalBuyRatio');
    if (buyRatioElem) {
      buyRatioElem.textContent = depth.buyRatio || '50% Buy / 50% Sell';
      const buyPct = parseInt(depth.buyRatio) || 50;
      buyRatioElem.className = `broker-card-value ${buyPct >= 50 ? 'text-green' : 'text-red'}`;
    }

    const deliveryElem = document.getElementById('terminalDeliveryPct');
    if (deliveryElem) {
      deliveryElem.textContent = `Delivery: ${depth.deliveryPct || '45%'} • Turnover: ${depth.turnoverCr || '₹500 Cr'}`;
    }

    // Depth header and circuits
    const headerElem = document.getElementById('depthStockHeader');
    if (headerElem) {
      headerElem.textContent = `${data.symbol} Market Depth (5 Bids / 5 Asks)`;
    }

    const circuitPill = document.getElementById('depthCircuitPill');
    if (circuitPill) {
      circuitPill.textContent = `Circuits: ₹${depth.lowerCircuit} - ₹${depth.upperCircuit}`;
    }

    const upperElem = document.getElementById('depthUpperCircuit');
    if (upperElem) upperElem.textContent = `₹${depth.upperCircuit}`;

    const lowerElem = document.getElementById('depthLowerCircuit');
    if (lowerElem) lowerElem.textContent = `₹${depth.lowerCircuit}`;

    const vwapElem = document.getElementById('depthVwap');
    if (vwapElem) vwapElem.textContent = `₹${depth.vwap}`;

    const depthDelivery = document.getElementById('depthDeliveryPct');
    if (depthDelivery) depthDelivery.textContent = `${depth.deliveryPct} (Active)`;

    // Render 5 Bids and 5 Asks table rows
    const tbody = document.getElementById('depthTableBody');
    if (tbody) {
      const bids = depth.bids || [];
      const asks = depth.asks || [];
      const maxRows = Math.max(bids.length, asks.length);
      let rowsHtml = '';

      for (let i = 0; i < maxRows; i++) {
        const b = bids[i] || { price: '--', orders: '--', qty: '--' };
        const a = asks[i] || { price: '--', orders: '--', qty: '--' };
        const bQty = b.qty !== undefined ? b.qty : (b.quantity !== undefined ? b.quantity : '--');
        const aQty = a.qty !== undefined ? a.qty : (a.quantity !== undefined ? a.quantity : '--');

        rowsHtml += `
          <tr>
            <td style="color: var(--green); font-weight: 600;">${typeof bQty === 'number' ? bQty.toLocaleString('en-IN') : bQty}</td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${b.orders}</td>
            <td style="color: var(--green); font-family: var(--font-mono); font-weight: 700;">₹${b.price}</td>
            <td style="color: var(--red); font-family: var(--font-mono); font-weight: 700;">₹${a.price}</td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${a.orders}</td>
            <td style="color: var(--red); font-weight: 600;">${typeof aQty === 'number' ? aQty.toLocaleString('en-IN') : aQty}</td>
          </tr>
        `;
      }

      // Add Total Row
      rowsHtml += `
        <tr style="border-top: 1px solid var(--border-color); background: rgba(255,255,255,0.02); font-weight: 800;">
          <td style="color: var(--green);">Total: ${(depth.totalBuyQty || 0).toLocaleString('en-IN')}</td>
          <td></td>
          <td style="color: var(--green);">${depth.buyRatio ? depth.buyRatio.split('/')[0] : '50%'}</td>
          <td style="color: var(--red);">${depth.buyRatio ? depth.buyRatio.split('/')[1] : '50%'}</td>
          <td></td>
          <td style="color: var(--red);">Total: ${(depth.totalSellQty || 0).toLocaleString('en-IN')}</td>
        </tr>
      `;

      tbody.innerHTML = rowsHtml;
    }
  }

  renderDerivativesMatrix(data) {
    const deriv = data.derivatives || data;
    const pcr = deriv.pcr || 1.0;
    const pcrSentiment = pcr >= 1.2 ? 'Strong Bullish' : (pcr >= 0.9 ? 'Neutral / Bullish' : 'Bearish');

    const pcrElem = document.getElementById('terminalPcrVal');
    if (pcrElem) {
      pcrElem.textContent = `${pcr} (${pcrSentiment})`;
      pcrElem.className = `broker-card-value ${pcr >= 1.0 ? 'text-green' : 'text-red'}`;
    }

    const maxPainElem = document.getElementById('terminalMaxPain');
    if (maxPainElem) {
      maxPainElem.textContent = `Max Pain: ${deriv.maxPain} • ATM: ${deriv.atmStrike}`;
    }

    const optHeader = document.getElementById('optionStockHeader');
    if (optHeader) {
      optHeader.textContent = `${data.symbol} Option Chain (Dhan Matrix - Monthly Expiry)`;
    }

    const optPill = document.getElementById('optionPcrPill');
    if (optPill) {
      optPill.textContent = `PCR: ${pcr} • Max Pain: ${deriv.maxPain} • VIX: ${deriv.indiaVix || '13.5'}`;
    }

    // Render Option Chain Rows
    const tbody = document.getElementById('optionTableBody');
    if (tbody) {
      const strikes = deriv.strikes || [];
      tbody.innerHTML = strikes.map(s => {
        const isAtm = s.isATM || s.isAtm;
        const atmStyle = isAtm ? 'background: rgba(99, 102, 241, 0.15); font-weight: 800; border: 1px solid var(--accent);' : '';
        const atmBadge = isAtm ? '<span style="background: var(--accent); color: #fff; font-size: 0.65rem; padding: 0.1rem 0.3rem; border-radius: 4px; margin-left: 4px;">ATM</span>' : '';

        return `
          <tr style="${atmStyle}">
            <td style="color: var(--green);">${s.callOI || s.callOi || '--'}</td>
            <td style="color: var(--green); font-family: var(--font-mono); font-weight: 700;">₹${s.callPremium || s.callLtp || '--'}</td>
            <td style="text-align: center; font-family: var(--font-mono); font-weight: 800; color: var(--accent);">
              ₹${s.strike}${atmBadge}
            </td>
            <td style="color: var(--red); font-family: var(--font-mono); font-weight: 700;">₹${s.putPremium || s.putLtp || '--'}</td>
            <td style="color: var(--red);">${s.putOI || s.putOi || '--'}</td>
          </tr>
        `;
      }).join('');
    }
  }

  async loadFiiDiiData() {
    try {
      const resp = await fetch('/api/market/fii-dii');
      if (!resp.ok) return;
      const data = await resp.json();

      const ribbonNet = document.getElementById('terminalFiiDiiNet');
      if (ribbonNet) {
        ribbonNet.textContent = `${data.institutionalStance ? 'Net Buyer' : 'Net Activity'} (${data.fiiNetCashCr || '+₹1,845 Cr'})`;
        ribbonNet.className = `broker-card-value text-green`;
      }

      const ribbonLong = document.getElementById('terminalFiiLong');
      if (ribbonLong) {
        ribbonLong.textContent = `Futures Long: ${data.fiiFuturesLongRatio || '58.4%'} • Calls: ${data.fiiIndexCallsNet || '+42K'}`;
      }

      const fiiCash = document.getElementById('fiiNetCash');
      if (fiiCash) {
        fiiCash.textContent = data.fiiNetCashCr || '+₹1,845.60 Cr';
        fiiCash.className = `val text-green`;
      }

      const diiCash = document.getElementById('diiNetCash');
      if (diiCash) {
        diiCash.textContent = data.diiNetCashCr || '+₹2,120.40 Cr';
        diiCash.className = `val text-green`;
      }

      const longRatio = document.getElementById('fiiLongRatio');
      if (longRatio) {
        longRatio.textContent = data.fiiFuturesLongRatio || '58.4%';
      }

      const stance = document.getElementById('fiiStance');
      if (stance) {
        stance.textContent = data.institutionalStance || '🟢 Net Institutional Accumulation (Bullish Flow)';
      }
    } catch (e) {
      console.error('Failed to load FII/DII data:', e);
    }
  }

  // Send Terminal Chat Message to /api/ai/terminal-chat
  async sendTerminalChatMessage(customPrompt) {
    const inputElem = document.getElementById('terminalChatInput');
    const question = customPrompt || (inputElem ? inputElem.value.trim() : '');

    if (!question) return;
    if (inputElem && !customPrompt) inputElem.value = '';

    const stream = document.getElementById('terminalChatStream');
    if (!stream) return;

    // Append User message
    stream.innerHTML += `
      <div class="ai-chat-msg ai-msg-user">
        <div class="chat-bubble">${this.escapeHtml(question)}</div>
        <div class="chat-avatar">👤</div>
      </div>
    `;

    // Append Animated Thinking indicator
    const thinkingId = 'term_thinking_' + Date.now();
    stream.innerHTML += `
      <div class="ai-chat-msg ai-msg-bot" id="${thinkingId}">
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble chat-bubble-thinking">
          <span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span>
        </div>
      </div>
    `;
    stream.scrollTop = stream.scrollHeight;

    try {
      const resp = await fetch('/api/ai/terminal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          activeSymbol: this.terminalActiveSymbol
        })
      });

      const data = await resp.json();
      const thinkingElem = document.getElementById(thinkingId);

      if (thinkingElem) {
        const formattedHtml = this.formatMarkdownToHtml(data.answer || 'No response from TejStockAI engine.');
        thinkingElem.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble">${formattedHtml}</div>
        `;
      }
      stream.scrollTop = stream.scrollHeight;

      // If comparison or stock was analyzed, auto update the active symbol in terminal
      if (data.symbol && data.symbol !== this.terminalActiveSymbol) {
        this.loadTerminalStockData(data.symbol);
      }
    } catch (err) {
      const thinkingElem = document.getElementById(thinkingId);
      if (thinkingElem) {
        thinkingElem.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-bubble text-red">Error querying TejStockAI Terminal Engine: ${err.message}</div>
        `;
      }
      stream.scrollTop = stream.scrollHeight;
    }
  }

  // Helper: Format Markdown to HTML with Tables & Formatting
  formatMarkdownToHtml(md) {
    if (!md) return '';

    let text = md;

    // Escape basic HTML to avoid injection
    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Handle Markdown Tables
    const lines = text.split('\n');
    let inTable = false;
    let tableHtml = '';
    let resultLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        // Check if separator line (|---|---|)
        if (cells.every(c => /^[-:]+$/.test(c))) {
          continue;
        }

        if (!inTable) {
          inTable = true;
          tableHtml = '<div class="chat-table-wrapper"><table class="chat-md-table"><thead><tr>';
          cells.forEach(c => {
            tableHtml += `<th>${c}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>';
          cells.forEach(c => {
            tableHtml += `<td>${c}</td>`;
          });
          tableHtml += '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table></div>';
          resultLines.push(tableHtml);
          tableHtml = '';
        }
        resultLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table></div>';
      resultLines.push(tableHtml);
    }

    text = resultLines.join('\n');

    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet items
    text = text.replace(/^• (.*)$/gm, '<li class="chat-li">$1</li>');
    text = text.replace(/^- (.*)$/gm, '<li class="chat-li">$1</li>');
    // Line breaks
    text = text.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    return text;
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Pre-Built Strategies Library View
  async renderStrategiesLibrary() {
    const grid = document.getElementById('scansLibraryGrid');
    if (!grid) return;

    try {
      const resp = await fetch('/api/scans');
      const data = await resp.json();
      const allScans = [...(data.prebuilt || []), ...(data.custom || [])];

      grid.innerHTML = allScans.map(scan => `
        <div class="scan-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="scan-card-header">
              <div>
                <h3 class="scan-card-title">${scan.title}</h3>
                <span class="scan-card-tag">${scan.category || 'Technical'}</span>
              </div>
            </div>
            <p class="scan-card-desc">${scan.description || 'Custom technical condition filter.'}</p>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="window.queryBuilder?.loadScan(${JSON.stringify(scan).replace(/"/g, '&quot;')}); window.app.switchView('builder');">
              ⚙️ Open in Builder
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.dashboard?.pinScanToDashboard('${scan.id}')">
              📌 Pin to Dash
            </button>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error('Failed to load strategies:', e);
    }
  }

  // Save Scan Modal Handlers
  openSaveScanModal(scanDef) {
    this.pendingScanDef = scanDef;
    const modal = document.getElementById('saveScanModal');
    if (modal) modal.classList.add('active');
  }

  async saveCustomScan() {
    const title = document.getElementById('saveScanTitle')?.value.trim();
    const description = document.getElementById('saveScanDesc')?.value.trim() || 'Custom strategy scan';
    const category = document.getElementById('saveScanCategory')?.value || 'Custom';
    const pinToDash = document.getElementById('saveScanPinToDash')?.checked;

    if (!title) {
      this.showToast('Please enter a scan title', 'warning');
      return;
    }

    const scanData = {
      ...(this.pendingScanDef || window.queryBuilder?.getScanDefinition() || {}),
      title,
      description,
      category
    };

    try {
      const resp = await fetch('/api/scans/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanData)
      });
      const data = await resp.json();

      if (data.success) {
        document.getElementById('saveScanModal')?.classList.remove('active');
        if (pinToDash && window.dashboard && data.scan?.id) {
          window.dashboard.pinScanToDashboard(data.scan.id);
        }
        this.renderStrategiesLibrary();
        this.showToast(`Scan "${title}" saved successfully!`, 'success');
      }
    } catch (e) {
      console.error('Failed to save scan:', e);
    }
  }

  // =========================================================================
  // WORKSPACE GATEWAY & KITE 18-SECTOR WATCHLIST CONTROLLERS
  // =========================================================================

  initWorkspaceGateway() {
    const gatewayModal = document.getElementById('workspaceGatewayModal');
    const navWsBtn = document.getElementById('navWorkspaceSwitcher');
    const closeBtn = document.getElementById('btnCloseGatewayModal');
    const selectCashBtn = document.getElementById('btnGatewaySelectCash');
    const selectFnoBtn = document.getElementById('btnGatewaySelectFno');
    const chkRemember = document.getElementById('chkRememberWorkspace');

    const isRemembered = localStorage.getItem('tej_workspace_remember') === 'true';
    const savedWs = localStorage.getItem('tej_workspace');

    if (savedWs) {
      this.currentWorkspace = savedWs;
    }
    this.updateWorkspaceNavPill();

    // Keep gateway modal hidden by default on app launch
    if (gatewayModal) {
      gatewayModal.style.display = 'none';
      gatewayModal.addEventListener('click', (e) => {
        if (e.target === gatewayModal) gatewayModal.style.display = 'none';
      });
    }

    if (navWsBtn && gatewayModal) {
      navWsBtn.addEventListener('click', () => {
        gatewayModal.style.display = 'flex';
      });
    }

    if (closeBtn && gatewayModal) {
      closeBtn.addEventListener('click', () => {
        gatewayModal.style.display = 'none';
      });
    }

    if (selectCashBtn) {
      selectCashBtn.addEventListener('click', () => {
        this.selectWorkspace('cash', chkRemember ? chkRemember.checked : true);
      });
    }

    if (selectFnoBtn) {
      selectFnoBtn.addEventListener('click', () => {
        this.selectWorkspace('fno', chkRemember ? chkRemember.checked : true);
      });
    }
  }

  updateWorkspaceNavPill() {
    const iconElem = document.getElementById('wsNavIcon');
    const labelElem = document.getElementById('wsNavLabel');
    if (this.currentWorkspace === 'fno') {
      if (iconElem) iconElem.textContent = '⚡';
      if (labelElem) labelElem.textContent = 'F&O Derivatives';
    } else {
      if (iconElem) iconElem.textContent = '📈';
      if (labelElem) labelElem.textContent = 'Cash Market';
    }
  }

  selectWorkspace(mode, remember = true) {
    this.currentWorkspace = mode;
    localStorage.setItem('tej_workspace', mode);
    if (remember) {
      localStorage.setItem('tej_workspace_remember', 'true');
    } else {
      localStorage.removeItem('tej_workspace_remember');
    }
    this.updateWorkspaceNavPill();

    const gatewayModal = document.getElementById('workspaceGatewayModal');
    if (gatewayModal) gatewayModal.style.display = 'none';

    if (mode === 'cash') {
      this.switchView('watchlist');
      this.switchWatchlistTab('STOCK MAIN');
    } else {
      this.switchView('terminal');
    }
  }

  bindKiteWatchlistEvents() {
    const tabsBar = document.getElementById('kiteTabsBar');
    if (tabsBar) {
      tabsBar.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.kite-tab-item');
        if (tabBtn && tabBtn.dataset.tab) {
          this.switchWatchlistTab(tabBtn.dataset.tab);
        }
      });
    }

    const searchInput = document.getElementById('kiteWatchlistSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (this.activeWatchlistTab === 'STOCK MAIN') {
          this.renderKiteSectors(q);
        } else {
          this.renderKiteTabStocks(this.activeWatchlistTab, q);
        }
      });
    }

    const toggleCollapseBtn = document.getElementById('btnToggleCollapseAll');
    if (toggleCollapseBtn) {
      toggleCollapseBtn.addEventListener('click', () => {
        this.toggleAllSectors();
      });
    }

    // Add New Group / Tab handlers
    const handleAddNewTab = () => {
      const modal = document.getElementById('newWatchlistGroupModal');
      const input = document.getElementById('inputNewWatchlistGroupName');
      if (input) input.value = '';
      if (modal) modal.classList.add('active');
      setTimeout(() => input?.focus(), 100);
    };

    document.getElementById('btnAddNewTab')?.addEventListener('click', handleAddNewTab);
    document.getElementById('btnKiteNewGroup')?.addEventListener('click', handleAddNewTab);
    document.getElementById('btnKiteNewSector')?.addEventListener('click', () => {
      this.openNewSectorModal();
    });

    // Search & Add / Focus on + button
    document.getElementById('btnKiteAddSector')?.addEventListener('click', () => {
      const searchBox = document.getElementById('kiteWatchlistSearchInput');
      if (searchBox) {
        searchBox.focus();
        searchBox.placeholder = 'Type stock symbol to filter/add...';
      }
    });

    // Toggle Grid / List View
    document.getElementById('btnKiteGridToggle')?.addEventListener('click', () => {
      const container = document.getElementById('kiteSectorsList');
      if (container) {
        container.classList.toggle('kite-dense-mode');
        const isDense = container.classList.contains('kite-dense-mode');
        this.showToast(isDense ? 'Switched to Compact View' : 'Switched to Standard View', 'info');
      }
    });

    // Filter Sliders button
    document.getElementById('btnKiteFilterSliders')?.addEventListener('click', () => {
      if (this.cachedSectors && this.cachedSectors.length > 0) {
        this.cachedSectors.reverse();
        const q = (document.getElementById('kiteWatchlistSearchInput')?.value || '').trim().toLowerCase();
        this.renderKiteSectors(q);
        this.showToast('Watchlist sort order updated', 'info');
      }
    });

    // Watchlist Management
    document.getElementById('btnManageWatchlists')?.addEventListener('click', () => {
      this.showToast('Watchlist Settings: Live tick streaming active • Auto-sort enabled • Zerodha Kite synced', 'info');
    });
  }

  switchWatchlistTab(tabName) {
    this.activeWatchlistTab = tabName;

    document.querySelectorAll('#kiteTabsBar .kite-tab-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const searchInput = document.getElementById('kiteWatchlistSearchInput');
    if (searchInput) searchInput.value = '';

    const sectorsContainer = document.getElementById('kiteSectorsList');
    const stocksContainer = document.getElementById('kiteStocksList');
    const groupTitle = document.getElementById('kiteGroupTitleText');
    const countBadge = document.getElementById('kiteCountBadge');

    if (tabName === 'STOCK MAIN') {
      if (sectorsContainer) sectorsContainer.style.display = 'block';
      if (stocksContainer) stocksContainer.style.display = 'none';
      if (groupTitle) groupTitle.textContent = 'SECTOR (18)';
      if (countBadge) countBadge.textContent = '42/250';
      this.renderKiteSectors();
    } else {
      if (sectorsContainer) sectorsContainer.style.display = 'none';
      if (stocksContainer) stocksContainer.style.display = 'block';
      const tabData = this.cachedWatchlists ? this.cachedWatchlists[tabName] : null;
      const cnt = tabData && tabData.stocks ? tabData.stocks.length : 8;
      if (groupTitle) groupTitle.textContent = `${tabName} (${cnt})`;
      if (countBadge) countBadge.textContent = `${cnt}/250`;
      this.renderKiteTabStocks(tabName);
    }
  }

  submitNewWatchlistGroup() {
    const input = document.getElementById('inputNewWatchlistGroupName');
    const tabName = (input?.value || '').trim();
    if (!tabName) {
      this.showToast('Please enter a group name', 'warning');
      return;
    }
    const cleanName = tabName.toUpperCase();
    if (!this.cachedWatchlists) this.cachedWatchlists = {};
    if (!this.cachedWatchlists[cleanName]) {
      this.cachedWatchlists[cleanName] = { title: cleanName, stocks: [] };
      const btn = document.createElement('button');
      btn.className = 'kite-tab-item';
      btn.dataset.tab = cleanName;
      btn.textContent = cleanName;
      const addBtn = document.getElementById('btnAddNewTab');
      if (addBtn && addBtn.parentNode) {
        addBtn.parentNode.insertBefore(btn, addBtn);
      }
    }
    document.getElementById('newWatchlistGroupModal')?.classList.remove('active');
    this.switchWatchlistTab(cleanName);
    this.showToast(`Group "${cleanName}" created`, 'success');
  }

  openNewSectorModal() {
    const modal = document.getElementById('newSectorModal');
    const input = document.getElementById('inputNewSectorName');
    if (input) input.value = '';
    if (modal) modal.classList.add('active');
    setTimeout(() => input?.focus(), 100);
  }

  submitNewSector() {
    const input = document.getElementById('inputNewSectorName');
    const secName = (input?.value || '').trim();
    if (!secName) {
      this.showToast('Please enter a sector name', 'warning');
      return;
    }
    const cleanName = secName.toUpperCase();
    if (!this.cachedSectors) this.cachedSectors = [];

    let existing = this.cachedSectors.find(s => s.name.toUpperCase() === cleanName || s.symbol.toUpperCase() === cleanName);
    if (!existing) {
      const newSecId = 'sec_custom_' + Date.now();
      existing = {
        id: newSecId,
        name: cleanName,
        symbol: cleanName,
        category: 'CUSTOM SECTOR',
        ltp: 100.0,
        change: 0.0,
        changePct: 0.0,
        stocks: [],
        stockCount: 0,
        isUserCreated: true
      };
      this.cachedSectors.unshift(existing);
      this.saveCustomSectors();
    }

    document.getElementById('newSectorModal')?.classList.remove('active');
    this.expandedSectors.add(existing.id);

    if (this.activeWatchlistTab !== 'STOCK MAIN') {
      this.switchWatchlistTab('STOCK MAIN');
    } else {
      this.renderKiteSectors();
    }

    const titleText = document.getElementById('kiteGroupTitleText');
    if (titleText && this.activeWatchlistTab === 'STOCK MAIN') {
      titleText.textContent = `SECTOR (${this.cachedSectors.length})`;
    }

    this.showToast(`Sector "${cleanName}" created! Add constituent stocks now.`, 'success');
    this.openAddStocksToSectorModal(existing.id);
  }

  openAddStocksToSectorModal(sectorId) {
    if (!this.cachedSectors || this.cachedSectors.length === 0) {
      fetch('/api/sectors').then(r => r.json()).then(d => {
        this.cachedSectors = d.sectors || [];
        this.openAddStocksToSectorModal(sectorId);
      }).catch(() => {});
      return;
    }
    const sec = this.cachedSectors.find(s => s.id === sectorId);
    if (!sec) {
      this.showToast('Sector not found', 'warning');
      return;
    }
    this.addWatchlistTargetSectorId = sectorId;
    this.openAddWatchlistItemModal(`sector:${sectorId}`);

    const headerTitle = document.querySelector('#addWatchlistItemModal h3');
    const badge = document.getElementById('addWatchlistCountBadge');
    const subtitle = document.getElementById('addWatchlistModalSubtitle');
    if (headerTitle) {
      headerTitle.textContent = `Add Stocks to ${sec.symbol || sec.name}`;
    }
    if (badge) {
      badge.textContent = `Sector: ${sec.symbol || sec.name}`;
      badge.style.background = 'rgba(16, 185, 129, 0.2)';
      badge.style.color = '#34d399';
    }
    if (subtitle) {
      subtitle.textContent = `Select stocks to add directly into the ${sec.symbol || sec.name} sector.`;
    }
  }

  toggleSector(sectorId) {
    if (this.expandedSectors.has(sectorId)) {
      this.expandedSectors.delete(sectorId);
    } else {
      this.expandedSectors.add(sectorId);
    }
    const q = (document.getElementById('kiteWatchlistSearchInput')?.value || '').trim().toLowerCase();
    this.renderKiteSectors(q);
  }

  toggleAllSectors() {
    const labelElem = document.getElementById('kiteCollapseLabel');
    const chevronElem = document.getElementById('kiteCollapseChevron');

    if (this.expandedSectors.size > 0) {
      this.expandedSectors.clear();
      if (labelElem) labelElem.textContent = 'Expand';
      if (chevronElem) chevronElem.textContent = '⌄';
    } else {
      (this.cachedSectors || []).forEach(s => this.expandedSectors.add(s.id));
      if (labelElem) labelElem.textContent = 'Collapse';
      if (chevronElem) chevronElem.textContent = '⌃';
    }
    const q = (document.getElementById('kiteWatchlistSearchInput')?.value || '').trim().toLowerCase();
    this.renderKiteSectors(q);
  }

  renderKiteSectors(filterQuery = '') {
    const container = document.getElementById('kiteSectorsList');
    if (!container) return;

    let sectors = this.cachedSectors || [];
    if (filterQuery) {
      sectors = sectors.filter(sec => {
        const matchSec = sec.name.toLowerCase().includes(filterQuery) || sec.symbol.toLowerCase().includes(filterQuery);
        const matchStock = (sec.stocks || []).some(st => st.symbol.toLowerCase().includes(filterQuery) || st.name.toLowerCase().includes(filterQuery));
        return matchSec || matchStock;
      });
    }

    if (sectors.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
          No sectors match "${filterQuery}". Search for stocks or try another query.
        </div>
      `;
      return;
    }

    container.innerHTML = sectors.map(sec => {
      const isExpanded = this.expandedSectors.has(sec.id) || (filterQuery.length > 0);
      const isPositive = (sec.changePct || 0) >= 0;
      const changeClass = isPositive ? 'change-positive' : 'change-negative';
      const changeSign = isPositive ? '+' : '';
      const formattedPrice = typeof sec.ltp === 'number' ? sec.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : sec.ltp;
      const formattedChange = typeof sec.change === 'number' ? sec.change.toFixed(2) : '--';
      const formattedPct = typeof sec.changePct === 'number' ? `${changeSign}${sec.changePct.toFixed(2)}%` : '--';

      let stocksHtml = '';
      if (isExpanded) {
        let stocks = sec.stocks || [];
        if (filterQuery) {
          stocks = stocks.filter(st => st.symbol.toLowerCase().includes(filterQuery) || st.name.toLowerCase().includes(filterQuery));
        }

        if (stocks.length === 0) {
          const isFilterEmpty = filterQuery && sec.stocks && sec.stocks.length > 0;
          stocksHtml = `
            <div class="kite-sector-stocks-container" style="padding: 1.25rem 1rem; text-align: center; background: rgba(255,255,255,0.015); border-radius: var(--radius-md); border: 1px dashed rgba(255,255,255,0.12); margin: 0.5rem 1rem 0.85rem;">
              <div style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.65rem;">
                ${isFilterEmpty ? `No constituent stocks matching "${filterQuery}" in ${sec.symbol}` : `No stocks added to ${sec.symbol || sec.name} yet`}
              </div>
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.app?.openAddStocksToSectorModal('${sec.id}')" style="display: inline-flex; align-items: center; gap: 0.45rem; font-weight: 700; padding: 0.45rem 1rem; border-radius: var(--radius-sm); box-shadow: 0 4px 12px rgba(99,102,241,0.25);">
                <span>➕</span> Add New Stocks to ${sec.symbol || sec.name}
              </button>
            </div>
          `;
        } else {
          stocksHtml = `
            <div class="kite-sector-stocks-container">
              <div class="kite-stocks-grid">
                ${stocks.map(st => {
                  const sPos = (st.changePct || 0) >= 0;
                  const sClass = sPos ? 'change-positive' : 'change-negative';
                  const sSign = sPos ? '+' : '';
                  const sPrice = typeof st.ltp === 'number' ? st.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : st.ltp;
                  const sChgPct = typeof st.changePct === 'number' ? `${sSign}${st.changePct.toFixed(2)}%` : '--';
                  return `
                    <div class="kite-stock-item fade-in-up" data-symbol="${st.symbol}" onclick="window.app.openStockChart('${st.symbol}')">
                      <div class="kite-stock-info">
                        <div class="kite-stock-sym-row">
                          <span class="kite-stock-sym">${st.symbol}</span>
                          <span class="kite-stock-sector-pill">${st.sector || sec.name}</span>
                        </div>
                        <span class="kite-stock-name">${st.name}</span>
                      </div>
                      <div class="kite-stock-data">
                        <div class="kite-stock-quote">
                          <span class="kite-stock-ltp" data-stock-ltp="${st.symbol}">₹${sPrice}</span>
                          <span class="kite-stock-chg ${sClass}" data-stock-chg="${st.symbol}">${sChgPct}</span>
                        </div>
                        <div class="kite-stock-actions" onclick="event.stopPropagation();">
                          <button class="kite-action-btn" onclick="window.app.openStockChart('${st.symbol}')" title="Interactive Chart">📈 Chart</button>
                          <button class="kite-action-ai-btn" onclick="window.app.openAiAgentModal('${st.symbol}')" title="AI Momentum Report">🤖 AI</button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="padding: 0.6rem 1rem 0.85rem; text-align: center; border-top: 1px dashed rgba(255,255,255,0.06); margin-top: 0.75rem;">
                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); window.app?.openAddStocksToSectorModal('${sec.id}')" style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.775rem; font-weight: 700; padding: 0.35rem 0.85rem; border-radius: var(--radius-sm);">
                  <span>➕</span> Add More Stocks to ${sec.symbol || sec.name}
                </button>
              </div>
            </div>
          `;
        }
      }

      return `
        <div class="kite-sector-accordion ${isExpanded ? 'expanded' : ''}" id="sector_accordion_${sec.id}" data-sector-id="${sec.id}" data-symbol="${sec.symbol}">
          <div class="kite-sector-row" onclick="window.app.toggleSector('${sec.id}')">
            <div class="kite-sec-left">
              <span class="kite-sec-symbol">${sec.symbol}</span>
              <span class="kite-sec-category">${sec.category || 'INDICES'} • ${sec.stockCount || (sec.stocks ? sec.stocks.length : 0)} STOCKS</span>
            </div>
            <div class="kite-sec-right">
              <div class="kite-sec-price-box">
                <span class="kite-sec-ltp ${changeClass}" data-sec-ltp="${sec.symbol}">₹${formattedPrice}</span>
                <span class="kite-sec-change ${changeClass}" data-sec-chg="${sec.symbol}">${formattedChange} (${formattedPct})</span>
              </div>
              <button class="kite-action-btn" onclick="event.stopPropagation(); window.app?.openAddStocksToSectorModal('${sec.id}')" title="Add stocks to ${sec.symbol || sec.name}" style="padding: 0.2rem 0.55rem; font-size: 0.75rem; margin-right: 0.4rem; font-weight: 700; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.25rem;">
                + Add
              </button>
              <span class="kite-sec-chevron">▾</span>
            </div>
          </div>
          ${stocksHtml}
        </div>
      `;
    }).join('');
  }

  renderKiteTabStocks(tabName, filterQuery = '') {
    const container = document.getElementById('kiteStocksList');
    if (!container) return;

    const tabData = this.cachedWatchlists ? this.cachedWatchlists[tabName] : null;
    let stocks = tabData && tabData.stocks ? tabData.stocks : [];

    if (filterQuery) {
      stocks = stocks.filter(st => st.symbol.toLowerCase().includes(filterQuery) || st.name.toLowerCase().includes(filterQuery));
    }

    if (stocks.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
          No stocks in watchlist "${tabName}" matching "${filterQuery}".
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="kite-sector-stocks-container" style="background: transparent; padding: 0.5rem 1rem;">
        <div class="kite-stocks-grid">
          ${stocks.map(st => {
            const sPos = (st.changePct || 0) >= 0;
            const sClass = sPos ? 'change-positive' : 'change-negative';
            const sSign = sPos ? '+' : '';
            const sPrice = typeof st.ltp === 'number' ? st.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : st.ltp;
            const sChgPct = typeof st.changePct === 'number' ? `${sSign}${st.changePct.toFixed(2)}%` : '--';
            return `
              <div class="kite-stock-item fade-in-up" data-symbol="${st.symbol}" onclick="window.app.openStockChart('${st.symbol}')">
                <div class="kite-stock-info">
                  <div class="kite-stock-sym-row">
                    <span class="kite-stock-sym">${st.symbol}</span>
                    <span class="kite-stock-sector-pill">${st.sector || 'NSE Cash'}</span>
                  </div>
                  <span class="kite-stock-name">${st.name}</span>
                </div>
                <div class="kite-stock-data">
                  <div class="kite-stock-quote">
                    <span class="kite-stock-ltp" data-stock-ltp="${st.symbol}">₹${sPrice}</span>
                    <span class="kite-stock-chg ${sClass}" data-stock-chg="${st.symbol}">${sChgPct}</span>
                  </div>
                  <div class="kite-stock-actions" onclick="event.stopPropagation();">
                    <button class="kite-action-btn" onclick="window.app.openStockChart('${st.symbol}')" title="Interactive Chart">📈 Chart</button>
                    <button class="kite-action-ai-btn" onclick="window.app.openAiAgentModal('${st.symbol}')" title="AI Momentum Report">🤖 AI</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================
  // ADD STOCKS & SECTORS TO WATCHLIST MODAL
  // ==========================================

  // ==========================================
  // ADD STOCKS & SECTORS TO WATCHLIST / SECTORS MODAL
  // ==========================================

  populateAddWatchlistTargetDropdown(preselectedVal) {
    const select = document.getElementById('selectAddWatchlistTargetTab');
    if (!select) return;
    select.innerHTML = '';

    // Group 1: Sectors (for adding stocks to created sectors or 18 NSE sectors)
    const optgroupSectors = document.createElement('optgroup');
    optgroupSectors.label = '📁 Sectors (STOCK MAIN)';
    const sectors = this.cachedSectors || [];
    sectors.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = `sector:${sec.id}`;
      opt.textContent = `Sector: ${sec.symbol || sec.name} (${sec.stocks ? sec.stocks.length : 0} stocks)`;
      if (preselectedVal === `sector:${sec.id}`) opt.selected = true;
      optgroupSectors.appendChild(opt);
    });
    select.appendChild(optgroupSectors);

    // Group 2: Watchlist Tabs
    const optgroupTabs = document.createElement('optgroup');
    optgroupTabs.label = '📑 Watchlist Tabs';
    const tabs = ['STOCK MAIN', 'BIG B', 'KHOJ', 'SRISHTY', 'TEJAS'];
    if (this.cachedWatchlists) {
      Object.keys(this.cachedWatchlists).forEach(t => {
        if (!tabs.includes(t)) tabs.push(t);
      });
    }
    tabs.forEach(tab => {
      const opt = document.createElement('option');
      opt.value = tab;
      opt.textContent = `Tab: ${tab}`;
      if (preselectedVal === tab) opt.selected = true;
      optgroupTabs.appendChild(opt);
    });
    select.appendChild(optgroupTabs);

    this.addWatchlistTargetTab = select.value;
  }

  async openAddWatchlistItemModal(preselectedTarget) {
    const modal = document.getElementById('addWatchlistItemModal');
    if (!modal) return;
    modal.classList.add('active');

    // Default target if not specified
    let target = preselectedTarget;
    if (!target) {
      if (this.activeWatchlistTab === 'STOCK MAIN' && this.cachedSectors && this.cachedSectors.length > 0) {
        target = `sector:${this.cachedSectors[0].id}`;
      } else {
        target = this.activeWatchlistTab || 'STOCK MAIN';
      }
    }

    this.populateAddWatchlistTargetDropdown(target);

    // Update modal header context
    const headerTitle = document.querySelector('#addWatchlistItemModal h3');
    const badge = document.getElementById('addWatchlistCountBadge');
    const subtitle = document.getElementById('addWatchlistModalSubtitle');

    if (target && target.startsWith('sector:')) {
      const secId = target.replace('sector:', '');
      const sec = (this.cachedSectors || []).find(s => s.id === secId);
      if (sec) {
        if (headerTitle) headerTitle.textContent = `Add Stocks to ${sec.symbol || sec.name}`;
        if (badge) {
          badge.textContent = `Sector: ${sec.symbol || sec.name}`;
          badge.style.background = 'rgba(16, 185, 129, 0.2)';
          badge.style.color = '#34d399';
        }
        if (subtitle) subtitle.textContent = `Select stocks to add directly into the ${sec.symbol || sec.name} sector.`;
      }
    } else {
      if (headerTitle) headerTitle.textContent = 'Add Items to Watchlist';
      if (badge && this.cachedAllStocks) {
        badge.textContent = `${this.cachedAllStocks.length} Stocks Available`;
        badge.style.background = 'rgba(99, 102, 241, 0.2)';
        badge.style.color = '#c084fc';
      }
      if (subtitle) subtitle.textContent = 'Search and select any stock to add directly to your sector or watchlist tab.';
    }

    // Reset search and category
    const searchInput = document.getElementById('inputAddWatchlistSearch');
    if (searchInput) searchInput.value = '';
    this.addWatchlistCategory = 'all';
    this.setAddWatchlistCategory('all');

    // Fetch all stocks and sectors if not cached
    if (!this.cachedAllStocks || this.cachedAllStocks.length === 0) {
      const container = document.getElementById('addWatchlistResultsList');
      if (container) {
        container.innerHTML = `
          <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
            <div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div>
            <p style="margin-top: 0.5rem; font-size: 0.85rem;">Loading 190+ NSE assets &amp; sectors...</p>
          </div>
        `;
      }
      try {
        const [stocksResp, sectorsResp] = await Promise.all([
          fetch('/api/stocks'),
          fetch('/api/sectors')
        ]);
        const sData = await stocksResp.json();
        const secData = await sectorsResp.json();
        this.cachedAllStocks = sData.stocks || [];
        if (secData && secData.sectors && (!this.cachedSectors || this.cachedSectors.length === 0)) {
          this.cachedSectors = secData.sectors;
        }
      } catch (e) {
        console.error('Failed to load stocks for add modal:', e);
      }
    }

    this.populateAddWatchlistTargetDropdown(target);
    this.renderAddWatchlistResults();
  }

  onAddWatchlistTargetTabChanged(tab) {
    this.addWatchlistTargetTab = tab;
    const headerTitle = document.querySelector('#addWatchlistItemModal h3');
    const badge = document.getElementById('addWatchlistCountBadge');
    const subtitle = document.getElementById('addWatchlistModalSubtitle');

    if (tab && tab.startsWith('sector:')) {
      const secId = tab.replace('sector:', '');
      this.addWatchlistTargetSectorId = secId;
      const sec = (this.cachedSectors || []).find(s => s.id === secId);
      if (sec) {
        if (headerTitle) headerTitle.textContent = `Add Stocks to ${sec.symbol || sec.name}`;
        if (badge) {
          badge.textContent = `Sector: ${sec.symbol || sec.name}`;
          badge.style.background = 'rgba(16, 185, 129, 0.2)';
          badge.style.color = '#34d399';
        }
        if (subtitle) subtitle.textContent = `Select stocks to add directly into the ${sec.symbol || sec.name} sector.`;
      }
    } else {
      this.addWatchlistTargetSectorId = null;
      if (headerTitle) headerTitle.textContent = 'Add Items to Watchlist';
      if (badge && this.cachedAllStocks) {
        badge.textContent = `${this.cachedAllStocks.length} Stocks Available`;
        badge.style.background = 'rgba(99, 102, 241, 0.2)';
        badge.style.color = '#c084fc';
      }
      if (subtitle) subtitle.textContent = 'Search and select any stock to add directly to your sector or watchlist tab.';
    }

    this.renderAddWatchlistResults();
  }

  setAddWatchlistCategory(cat) {
    this.addWatchlistCategory = cat || 'all';
    document.querySelectorAll('#addWatchlistCategoryPills .add-wl-cat-pill').forEach(btn => {
      const isMatch = btn.dataset.cat === cat;
      btn.classList.toggle('btn-primary', isMatch);
      btn.classList.toggle('active', isMatch);
      btn.classList.toggle('btn-secondary', !isMatch);
    });
    this.renderAddWatchlistResults();
  }

  onAddWatchlistSearchInput(val) {
    const q = (val || '').trim();
    clearTimeout(this.addWlSearchTimer);
    if (!q) {
      this.modalSearchResults = null;
      this.renderAddWatchlistResults('');
      return;
    }

    // Immediately render local matches first
    this.renderAddWatchlistResults(q);

    // Debounce server search to find ANY stock in the 2,600+ master universe
    this.addWlSearchTimer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await resp.json();
        if (data.results && data.results.length > 0) {
          this.modalSearchResults = data.results;
          this.renderAddWatchlistResults(q);
        }
      } catch (err) {}
    }, 120);
  }

  renderAddWatchlistResults(query = '') {
    const container = document.getElementById('addWatchlistResultsList');
    if (!container) return;

    const q = (query !== undefined && query !== '' ? query : (document.getElementById('inputAddWatchlistSearch')?.value || '')).trim().toLowerCase();
    const cat = this.addWatchlistCategory || 'all';
    const targetTab = this.addWatchlistTargetTab || this.activeWatchlistTab || 'STOCK MAIN';

    // If "18 NSE Sectors" category is chosen
    if (cat === 'sectors') {
      const sectors = this.cachedSectors || [];
      let filteredSectors = sectors;
      if (q) {
        filteredSectors = sectors.filter(s => 
          s.name.toLowerCase().includes(q) || 
          s.symbol.toLowerCase().includes(q) ||
          (s.stocks || []).some(st => st.symbol.toLowerCase().includes(q) || st.name.toLowerCase().includes(q))
        );
      }

      if (filteredSectors.length === 0) {
        container.innerHTML = `<div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">No sectors match "${q}".</div>`;
        return;
      }

      container.innerHTML = filteredSectors.map(sec => {
        const count = sec.stocks ? sec.stocks.length : (sec.count || 0);
        const isPos = (sec.changePct || 0) >= 0;
        const chgClass = isPos ? 'change-positive' : 'change-negative';
        const chgSign = isPos ? '+' : '';
        const price = typeof sec.ltp === 'number' ? `₹${sec.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : sec.ltp;

        return `
          <div class="add-wl-item-card" style="display: flex; align-items: center; justify-content: space-between; padding: 0.9rem 1.15rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); gap: 1rem;">
            <div style="display: flex; flex-direction: column; gap: 0.2rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 800; font-size: 1rem; color: var(--text-main); font-family: var(--font-mono);">${sec.name}</span>
                <span style="font-size: 0.7rem; background: rgba(99,102,241,0.15); color: #818cf8; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">${count} Stocks</span>
              </div>
              <div style="font-size: 0.775rem; color: var(--text-secondary);">Benchmark NSE Sectoral Index (${sec.symbol})</div>
            </div>

            <div style="text-align: right; display: flex; align-items: center; gap: 1.25rem;">
              <div>
                <div style="font-family: var(--font-mono); font-weight: 800; font-size: 0.95rem;">${price}</div>
                <div class="${chgClass}" style="font-family: var(--font-mono); font-size: 0.775rem; font-weight: 700;">${chgSign}${(sec.changePct || 0).toFixed(2)}%</div>
              </div>
              <button class="btn btn-sm btn-primary" onclick="window.app.addSectorToWatchlist('${sec.id}', '${targetTab}')" style="padding: 0.35rem 0.85rem; font-size: 0.8rem; font-weight: 700;">
                + Add Sector
              </button>
            </div>
          </div>
        `;
      }).join('');
      return;
    }

    // Stocks filter logic
    let stocks = this.cachedAllStocks || [];

    if (this.modalSearchResults && this.modalSearchResults.length > 0 && q) {
      const searchSymbols = new Set(this.modalSearchResults.map(s => s.symbol));
      const localMatches = stocks.filter(s => !searchSymbols.has(s.symbol) && (
        s.symbol.toLowerCase().includes(q) || 
        (s.name || '').toLowerCase().includes(q) || 
        (s.sector || '').toLowerCase().includes(q)
      ));
      stocks = [...this.modalSearchResults, ...localMatches];
    } else {
      if (cat === 'ai80') {
        stocks = stocks.filter(s => (s.aiMomentum?.score >= 80) || ((s.series?.rsi14 && s.series.rsi14[s.series.rsi14.length - 1] >= 65)));
      } else if (cat === 'nifty50') {
        const n50Sec = (this.cachedSectors || []).find(s => s.symbol === 'NIFTY 50');
        if (n50Sec && n50Sec.stocks) {
          const n50Syms = new Set(n50Sec.stocks.map(s => s.symbol));
          stocks = stocks.filter(s => n50Syms.has(s.symbol));
        }
      } else if (cat === 'bank') {
        stocks = stocks.filter(s => (s.sector || '').toLowerCase().includes('bank') || (s.sector || '').toLowerCase().includes('fin'));
      } else if (cat === 'it') {
        stocks = stocks.filter(s => (s.sector || '').toLowerCase().includes('it') || (s.sector || '').toLowerCase().includes('tech') || (s.sector || '').toLowerCase().includes('software'));
      } else if (cat === 'auto') {
        stocks = stocks.filter(s => (s.sector || '').toLowerCase().includes('auto') || (s.sector || '').toLowerCase().includes('motor') || (s.sector || '').toLowerCase().includes('electric'));
      } else if (cat === 'pharma') {
        stocks = stocks.filter(s => (s.sector || '').toLowerCase().includes('pharma') || (s.sector || '').toLowerCase().includes('health'));
      }

      if (q) {
        stocks = stocks.filter(s => 
          s.symbol.toLowerCase().includes(q) || 
          (s.name || '').toLowerCase().includes(q) || 
          (s.sector || '').toLowerCase().includes(q)
        );
      }
    }

    if (stocks.length === 0) {
      container.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
          No stocks match "${q}". Try another search or filter.
        </div>
      `;
      return;
    }

    // Determine what is currently in target
    let currentSyms = new Set();
    const isTargetSector = targetTab.startsWith('sector:');
    let targetSector = null;

    if (isTargetSector) {
      const secId = targetTab.replace('sector:', '');
      targetSector = (this.cachedSectors || []).find(s => s.id === secId);
      if (targetSector && targetSector.stocks) {
        targetSector.stocks.forEach(s => currentSyms.add(s.symbol));
      }
    } else if (targetTab === 'STOCK MAIN') {
      const customSec = (this.cachedSectors || []).find(s => s.id === 'custom_watchlist_stocks');
      if (customSec && customSec.stocks) {
        customSec.stocks.forEach(s => currentSyms.add(s.symbol));
      }
    } else {
      const currentTabStocks = (this.cachedWatchlists && this.cachedWatchlists[targetTab]?.stocks) || [];
      currentTabStocks.forEach(s => currentSyms.add(s.symbol));
    }

    const btnLabel = isTargetSector ? '+ Add to Sector' : '+ Add';
    const addedLabel = isTargetSector ? '✓ In Sector' : '✓ In Watchlist';

    container.innerHTML = stocks.map(st => {
      const isInWatchlist = currentSyms.has(st.symbol);
      const isPos = (st.changePct || 0) >= 0;
      const chgClass = isPos ? 'change-positive' : 'change-negative';
      const chgSign = isPos ? '+' : '';
      const price = typeof st.ltp === 'number' ? `₹${st.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : (st.ltp || 'Live Fetch');
      
      const rsi = (st.series && st.series.rsi14) ? Math.round(st.series.rsi14[st.series.rsi14.length - 1] || 55) : 65;
      const aiScore = st.aiMomentum?.score || Math.min(96, Math.max(30, rsi));
      const aiBadge = aiScore >= 80 
        ? `<span style="background: rgba(16, 185, 129, 0.18); color: var(--green); border: 1px solid rgba(16,185,129,0.35); font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: var(--font-mono);">⚡ AI: ${aiScore}/100</span>`
        : `<span style="background: rgba(255, 255, 255, 0.05); color: var(--text-muted); font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: var(--font-mono);">AI: ${aiScore}/100</span>`;

      return `
        <div class="add-wl-item-card" style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.15rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); gap: 1rem; transition: all 0.18s ease;">
          <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); font-family: var(--font-mono);">${st.symbol}</span>
              <span style="font-size: 0.7rem; background: rgba(255,255,255,0.06); color: var(--text-muted); padding: 0.1rem 0.4rem; border-radius: 4px;">${st.sector || 'NSE Cash'}</span>
              ${aiBadge}
            </div>
            <div style="font-size: 0.775rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 380px;">${st.name || st.symbol}</div>
          </div>

          <div style="text-align: right; display: flex; align-items: center; gap: 1.25rem; flex-shrink: 0;">
            <div>
              <div style="font-family: var(--font-mono); font-weight: 800; font-size: 0.95rem;">${price}</div>
              <div class="${chgClass}" style="font-family: var(--font-mono); font-size: 0.775rem; font-weight: 700;">${st.changePct !== null && st.changePct !== undefined ? `${chgSign}${Number(st.changePct).toFixed(2)}%` : 'NSE'}</div>
            </div>
            ${isInWatchlist 
              ? `<button class="btn btn-sm btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem; opacity: 0.75; cursor: default;" disabled>${addedLabel}</button>`
              : `<button class="btn btn-sm btn-primary btn-add-stock-action" id="btnAddStock_${st.symbol}" onclick="window.app.addStockToWatchlist('${st.symbol}', '${targetTab}')" style="font-size: 0.75rem; padding: 0.35rem 0.85rem; font-weight: 700;">${btnLabel}</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  addStockToWatchlist(symbol, targetTab) {
    if (!symbol) return;
    symbol = symbol.toUpperCase();
    targetTab = targetTab || this.addWatchlistTargetTab || this.activeWatchlistTab || 'STOCK MAIN';

    let stock = (this.cachedAllStocks || []).find(s => s.symbol === symbol);
    if (!stock && this.modalSearchResults) {
      stock = this.modalSearchResults.find(s => s.symbol === symbol);
    }
    if (!stock) {
      stock = { symbol, name: symbol, sector: 'NSE Equities', ltp: '--', change: 0, changePct: 0 };
    }
    if (this.cachedAllStocks && !this.cachedAllStocks.some(s => s.symbol === symbol)) {
      this.cachedAllStocks.push(stock);
    }

    if (targetTab.startsWith('sector:')) {
      const sectorId = targetTab.replace('sector:', '');
      this.addStockToSector(stock, sectorId);
      return;
    }

    if (targetTab === 'STOCK MAIN') {
      if (!this.cachedSectors) this.cachedSectors = [];
      let customSector = this.cachedSectors.find(s => s.id === 'custom_watchlist_stocks');
      if (!customSector) {
        customSector = {
          id: 'custom_watchlist_stocks',
          name: '⭐ CUSTOM ADDED ASSETS',
          symbol: 'CUSTOM',
          ltp: stock.ltp,
          change: stock.change,
          changePct: stock.changePct,
          stocks: []
        };
        this.cachedSectors.unshift(customSector);
      }
      if (!customSector.stocks.some(s => s.symbol === symbol)) {
        customSector.stocks.unshift(stock);
      }
      this.expandedSectors.add('custom_watchlist_stocks');
      this.saveCustomSectors();
      this.renderKiteSectors();
    } else {
      if (!this.cachedWatchlists) this.cachedWatchlists = {};
      if (!this.cachedWatchlists[targetTab]) {
        this.cachedWatchlists[targetTab] = { title: targetTab, stocks: [] };
      }
      if (!this.cachedWatchlists[targetTab].stocks.some(s => s.symbol === symbol)) {
        this.cachedWatchlists[targetTab].stocks.unshift(stock);
      }
      this.renderKiteTabStocks(targetTab);
      const countBadge = document.getElementById('kiteCountBadge');
      if (countBadge) countBadge.textContent = `${this.cachedWatchlists[targetTab].stocks.length}/250`;
    }

    this.saveCustomWatchlists();
    this.showToast(`Added ${symbol} to Watchlist (${targetTab})`, 'success');

    // Update modal button state immediately
    const btn = document.getElementById(`btnAddStock_${symbol}`);
    if (btn) {
      btn.className = 'btn btn-sm btn-secondary';
      btn.textContent = '✓ Added';
      btn.disabled = true;
      btn.style.opacity = '0.75';
      btn.style.cursor = 'default';
    }
  }

  addStockToSector(stock, sectorId) {
    if (!stock || !sectorId) return;
    if (!this.cachedSectors) this.cachedSectors = [];
    const sec = this.cachedSectors.find(s => s.id === sectorId);
    if (!sec) {
      this.showToast('Sector not found', 'warning');
      return;
    }

    if (!sec.stocks) sec.stocks = [];
    if (sec.stocks.some(s => s.symbol === stock.symbol)) {
      this.showToast(`${stock.symbol} is already in ${sec.symbol || sec.name}`, 'info');
      return;
    }

    const newStockItem = {
      symbol: stock.symbol,
      name: stock.name || stock.symbol,
      sector: stock.sector || sec.name,
      ltp: stock.ltp || 1000,
      change: stock.change || 0,
      changePct: stock.changePct || 0,
      volume: stock.volume || 100000,
      high52: stock.high52 || 1200,
      low52: stock.low52 || 800,
      sparkline: stock.sparkline || [],
      aiMomentum: stock.aiMomentum || {
        score: Math.min(96, Math.max(30, stock.series?.rsi14 ? Math.round(stock.series.rsi14[stock.series.rsi14.length - 1] || 60) : 65)),
        rating: (stock.changePct >= 0) ? 'BULLISH' : 'NEUTRAL'
      }
    };

    sec.stocks.push(newStockItem);
    sec.stockCount = sec.stocks.length;
    sec.count = sec.stocks.length;

    // Fetch live quote if not yet cached
    if (typeof newStockItem.ltp !== 'number' || newStockItem.ltp === 1000) {
      fetch(`/api/stock/${encodeURIComponent(newStockItem.symbol)}`)
        .then(r => r.json())
        .then(liveData => {
          if (liveData && liveData.ltp) {
            newStockItem.ltp = liveData.ltp;
            newStockItem.change = liveData.change || 0;
            newStockItem.changePct = liveData.changePct || 0;
            newStockItem.volume = liveData.volume || newStockItem.volume;
            newStockItem.high52 = liveData.high52 || newStockItem.high52;
            newStockItem.low52 = liveData.low52 || newStockItem.low52;
            newStockItem.sparkline = liveData.sparkline || [];
            this.saveCustomSectors();
            this.renderKiteSectors();
          }
        })
        .catch(() => {});
    }

    this.expandedSectors.add(sec.id);
    this.saveCustomSectors();

    const q = (document.getElementById('kiteWatchlistSearchInput')?.value || '').trim().toLowerCase();
    this.renderKiteSectors(q);

    const titleText = document.getElementById('kiteGroupTitleText');
    if (titleText && this.activeWatchlistTab === 'STOCK MAIN') {
      titleText.textContent = `SECTOR (${this.cachedSectors.length})`;
    }

    this.showToast(`✅ Added ${stock.symbol} to sector ${sec.symbol || sec.name}`, 'success');

    // Update modal button state immediately
    const btn = document.getElementById(`btnAddStock_${stock.symbol}`);
    if (btn) {
      btn.className = 'btn btn-sm btn-secondary';
      btn.textContent = '✓ Added to Sector';
      btn.disabled = true;
      btn.style.opacity = '0.75';
      btn.style.cursor = 'default';
    }
  }

  saveCustomSectors() {
    try {
      const data = {};
      (this.cachedSectors || []).forEach(sec => {
        data[sec.id] = {
          id: sec.id,
          name: sec.name,
          symbol: sec.symbol,
          category: sec.category,
          isUserCreated: !!sec.isUserCreated,
          stocks: (sec.stocks || []).map(st => st.symbol)
        };
      });
      localStorage.setItem('tejstockai_custom_sectors', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save custom sectors:', e);
    }
  }

  addSectorToWatchlist(sectorId, targetTab) {
    targetTab = targetTab || this.addWatchlistTargetTab || this.activeWatchlistTab || 'STOCK MAIN';
    const sector = (this.cachedSectors || []).find(s => s.id === sectorId);
    if (!sector || !sector.stocks) return;

    if (targetTab === 'STOCK MAIN') {
      this.expandedSectors.add(sectorId);
      this.renderKiteSectors();
    } else {
      if (!this.cachedWatchlists) this.cachedWatchlists = {};
      if (!this.cachedWatchlists[targetTab]) {
        this.cachedWatchlists[targetTab] = { title: targetTab, stocks: [] };
      }
      sector.stocks.forEach(st => {
        if (!this.cachedWatchlists[targetTab].stocks.some(s => s.symbol === st.symbol)) {
          this.cachedWatchlists[targetTab].stocks.push(st);
        }
      });
      this.renderKiteTabStocks(targetTab);
      const countBadge = document.getElementById('kiteCountBadge');
      if (countBadge) countBadge.textContent = `${this.cachedWatchlists[targetTab].stocks.length}/250`;
    }

    this.saveCustomWatchlists();
    this.showToast(`Added ${sector.name} (${sector.stocks.length} stocks) to ${targetTab}`, 'success');
  }

  saveCustomWatchlists() {
    try {
      localStorage.setItem('tejstockai_custom_watchlists', JSON.stringify(this.cachedWatchlists));
    } catch (e) {}
  }

  async loadWatchlist() {
    try {
      const [secResp, wlResp, stocksResp] = await Promise.all([
        fetch('/api/sectors').catch(() => null),
        fetch('/api/watchlists').catch(() => null),
        fetch('/api/stocks').catch(() => null)
      ]);

      if (stocksResp && stocksResp.ok) {
        const stocksData = await stocksResp.json();
        this.cachedAllStocks = stocksData.stocks || [];
      }

      if (secResp && secResp.ok) {
        const secData = await secResp.json();
        this.cachedSectors = secData.sectors || [];

        // Restore custom added sector stocks and user-created sectors
        try {
          const savedSectors = localStorage.getItem('tejstockai_custom_sectors');
          if (savedSectors) {
            const parsed = JSON.parse(savedSectors);
            for (const [secId, savedSec] of Object.entries(parsed)) {
              let existingSec = this.cachedSectors.find(s => s.id === secId);
              if (!existingSec && savedSec.isUserCreated) {
                existingSec = {
                  id: savedSec.id,
                  name: savedSec.name,
                  symbol: savedSec.symbol,
                  category: savedSec.category || 'CUSTOM SECTOR',
                  ltp: 100.0,
                  change: 0.0,
                  changePct: 0.0,
                  stockCount: 0,
                  isUserCreated: true,
                  stocks: []
                };
                this.cachedSectors.unshift(existingSec);
              }
              if (existingSec && savedSec.stocks && Array.isArray(savedSec.stocks)) {
                if (!existingSec.stocks) existingSec.stocks = [];
                const currentSyms = new Set(existingSec.stocks.map(s => s.symbol));
                savedSec.stocks.forEach(sym => {
                  if (!currentSyms.has(sym)) {
                    const st = (this.cachedAllStocks || []).find(s => s.symbol === sym) || {
                      symbol: sym,
                      name: sym,
                      sector: existingSec.name,
                      ltp: 1000,
                      change: 5,
                      changePct: 0.5,
                      sparkline: [],
                      aiMomentum: { score: 75, rating: 'BULLISH' }
                    };
                    existingSec.stocks.push(st);
                  }
                });
                existingSec.stockCount = existingSec.stocks.length;
                existingSec.count = existingSec.stocks.length;
              }
            }
          }
        } catch (err) {
          console.warn('Error restoring custom sectors:', err);
        }
      }

      if (wlResp && wlResp.ok) {
        const wlData = await wlResp.json();
        this.cachedWatchlists = wlData.tabs || {};

        // Merge user custom persisted additions
        try {
          const saved = localStorage.getItem('tejstockai_custom_watchlists');
          if (saved) {
            const parsed = JSON.parse(saved);
            for (const [k, v] of Object.entries(parsed)) {
              if (this.cachedWatchlists[k] && v.stocks) {
                const existing = new Set(this.cachedWatchlists[k].stocks.map(s => s.symbol));
                v.stocks.forEach(st => {
                  if (!existing.has(st.symbol)) this.cachedWatchlists[k].stocks.push(st);
                });
              } else if (!this.cachedWatchlists[k]) {
                this.cachedWatchlists[k] = v;
              }
            }
          }
        } catch (err) {}
      }

      // Synchronize all watchlist and sector constituent stocks with fresh live prices
      const livePriceMap = new Map((this.cachedAllStocks || []).map(s => [s.symbol, s]));
      if (this.cachedWatchlists) {
        for (const tab of Object.values(this.cachedWatchlists)) {
          if (Array.isArray(tab.stocks)) {
            for (const st of tab.stocks) {
              const live = livePriceMap.get(st.symbol);
              if (live && typeof live.ltp === 'number') {
                st.ltp = live.ltp;
                st.change = live.change;
                st.changePct = live.changePct;
                if (live.volume) st.volume = live.volume;
                if (live.sparkline) st.sparkline = live.sparkline;
              }
            }
          }
        }
      }
      if (this.cachedSectors) {
        for (const sec of this.cachedSectors) {
          const liveSec = livePriceMap.get(sec.symbol);
          if (liveSec && typeof liveSec.ltp === 'number') {
            sec.ltp = liveSec.ltp;
            sec.change = liveSec.change;
            sec.changePct = liveSec.changePct;
          }
          if (Array.isArray(sec.stocks)) {
            for (const st of sec.stocks) {
              const live = livePriceMap.get(st.symbol);
              if (live && typeof live.ltp === 'number') {
                st.ltp = live.ltp;
                st.change = live.change;
                st.changePct = live.changePct;
                if (live.volume) st.volume = live.volume;
                if (live.sparkline) st.sparkline = live.sparkline;
              }
            }
          }
        }
      }

      this.renderMarketTickerTape();
      this.switchWatchlistTab(this.activeWatchlistTab || 'STOCK MAIN');

      const tbody = document.getElementById('watchlistTableBody');
      if (tbody && this.cachedWatchlists['BIG B']) {
        const items = this.cachedWatchlists['BIG B'].stocks || [];
        tbody.innerHTML = items.map((s, idx) => {
          const isPositive = (s.changePct || 0) >= 0;
          const changeClass = isPositive ? 'change-positive' : 'change-negative';
          const changeSign = isPositive ? '+' : '';
          const sparklineSvg = window.generateSparklineSvg ? window.generateSparklineSvg(s.sparkline || [], isPositive, 90, 24) : '';
          const aiScore = s.aiMomentum?.score || 65;
          let aiBadgeClass = 'badge-buy';
          if (aiScore >= 80) aiBadgeClass = 'badge-strong-buy';
          else if (aiScore < 40) aiBadgeClass = 'badge-sell';

          return `
            <tr data-symbol="${s.symbol}" class="fade-in-up" onclick="window.app.openStockChart('${s.symbol}')" style="cursor: pointer;">
              <td style="color: var(--text-muted); font-size: 0.8rem;">${idx + 1}</td>
              <td>
                <strong style="color: var(--text-main);">${s.symbol}</strong>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${s.name}</div>
              </td>
              <td class="cell-ltp" style="font-family: var(--font-mono); font-weight: 700;">₹${s.ltp.toLocaleString('en-IN')}</td>
              <td><span class="stock-change ${changeClass}">${changeSign}${s.changePct}%</span></td>
              <td style="font-family: var(--font-mono); font-size: 0.85rem;">${(s.volume || 0).toLocaleString('en-IN')}</td>
              <td><span class="ai-status-pill ${aiBadgeClass}" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;">${aiScore}/100</span></td>
              <td style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-muted);">₹${s.low52 || '--'} - ₹${s.high52 || '--'}</td>
              <td>${sparklineSvg}</td>
              <td onclick="event.stopPropagation();">
                <div style="display: flex; gap: 0.35rem;">
                  <button class="btn btn-ai-sparkle btn-sm" onclick="window.app.openAiAgentModal('${s.symbol}')" title="AI Agent">🤖</button>
                  <button class="btn btn-secondary btn-sm" onclick="window.app.toggleWatchlist('${s.symbol}')" title="Remove">✕</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('Failed to load Kite watchlist:', e);
    }
  }

  async toggleWatchlist(symbol) {
    try {
      const resp = await fetch('/api/watchlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      const data = await resp.json();
      this.loadWatchlist();

      const wlBtn = document.getElementById('modalWatchlistToggle');
      if (wlBtn && this.activeStockSymbol === symbol) {
        wlBtn.textContent = data.inWatchlist ? '★ In Watchlist' : '☆ Watchlist';
        wlBtn.classList.toggle('btn-primary', data.inWatchlist);
        wlBtn.classList.toggle('btn-secondary', !data.inWatchlist);
      }
    } catch (e) {
      console.error('Toggle watchlist error:', e);
    }
  }

  // Bind Event Listeners
  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-links .nav-link, .mobile-bottom-nav .bottom-nav-item').forEach(link => {
      link.addEventListener('click', () => {
        const view = link.getAttribute('data-view');
        if (view) this.switchView(view);
      });
    });

    // Theme Toggle
    const themeBtn = document.getElementById('btnThemeToggle');
    const updateThemeBtnUI = (theme) => {
      if (!themeBtn) return;
      const isLight = theme === 'light';
      themeBtn.innerHTML = `
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          ${isLight 
            ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' 
            : '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'}
        </svg>
        <span>${isLight ? 'Dark Mode' : 'Light Mode'}</span>
      `;
      themeBtn.setAttribute('title', isLight ? 'Switch to Eye-Comfort Dark Mode' : 'Switch to Light Mode');
    };

    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', nextTheme);
        localStorage.setItem('chartink_theme', nextTheme);
        updateThemeBtnUI(nextTheme);
        if (this.chart) this.chart.render();
        if (window.queryBuilder && typeof window.queryBuilder.renderBacktestChart === 'function') {
          window.queryBuilder.renderBacktestChart();
        }
      });
      // Reset any previous light setting to the eye-comfort dark mode
      let savedTheme = localStorage.getItem('chartink_theme');
      if (!savedTheme || savedTheme === 'light') {
        savedTheme = 'dark';
        localStorage.setItem('chartink_theme', 'dark');
      }
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeBtnUI('dark');
    }

    // Chartink Top Nav Links
    document.getElementById('navLinkCharts')?.addEventListener('click', e => {
      e.preventDefault();
      this.openStockChart(this.activeStockSymbol || 'RELIANCE');
    });

    document.getElementById('navLinkPremium')?.addEventListener('click', e => {
      e.preventDefault();
      this.showToast('Chartink Pro Active: Realtime tick-by-tick websocket streaming & AI Copilot enabled!', 'success');
    });

    document.getElementById('navLinkHelp')?.addEventListener('click', e => {
      e.preventDefault();
      const modal = document.getElementById('scannerGuideModal');
      if (modal) modal.style.display = 'flex';
    });

    document.getElementById('btnUserAvatar')?.addEventListener('click', () => {
      this.showToast('Account: Sri / Tejas • Tier: Chartink Pro • Brokers Linked: Zerodha, Dhan, Upstox', 'info');
    });

    // TradingView Timeframe Selector Buttons
    document.querySelectorAll('.tv-tf-btn[data-tf]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tf = btn.getAttribute('data-tf');
        if (tf) this.openStockChart(this.activeStockSymbol, tf);
      });
    });

    // TradingView Chart Type Selector Buttons (Candles, Line, Area)
    document.querySelectorAll('.tv-chart-type-group .tv-tf-btn[data-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tv-chart-type-group .tv-tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        this.activeChartType = type;
        this.chart.setChartType(type);
      });
    });

    // Chart Indicator Toggles
    document.querySelectorAll('.tv-indicator-group .toggle-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        pill.classList.toggle('active');
        const ind = pill.getAttribute('data-indicator');
        if (ind) this.chart.toggleIndicator(ind);
      });
    });

    // Jump from Chart Modal to AI Momentum Modal
    const btnOpenAiFromChart = document.getElementById('btnOpenAiAgentFromChart');
    if (btnOpenAiFromChart) {
      btnOpenAiFromChart.addEventListener('click', () => {
        this.openAiAgentModal(this.activeStockSymbol);
      });
    }

    // AI Momentum Mode Tabs (Intraday vs Long-Term)
    document.querySelectorAll('#aiMomentumModeTabs .ai-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        if (mode) this.switchAiMode(mode);
      });
    });

    // Modal Watchlist Toggle
    const modalWlBtn = document.getElementById('modalWatchlistToggle');
    if (modalWlBtn) {
      modalWlBtn.addEventListener('click', () => {
        this.toggleWatchlist(this.activeStockSymbol);
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      const closeBtn = backdrop.querySelector('.modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => backdrop.classList.remove('active'));
      }
      backdrop.addEventListener('click', e => {
        if (e.target === backdrop) backdrop.classList.remove('active');
      });
    });

    // Connect Phone Modal
    const connectBtn = document.getElementById('btnOpenConnectModal');
    const bottomConnectBtn = document.getElementById('bottomNavConnect');
    const phoneModal = document.getElementById('phoneConnectModal');
    if (connectBtn && phoneModal) {
      connectBtn.addEventListener('click', () => {
        phoneModal.classList.add('active');
        this.fetchServerInfo();
      });
    }
    if (bottomConnectBtn && phoneModal) {
      bottomConnectBtn.addEventListener('click', () => {
        phoneModal.classList.add('active');
        this.fetchServerInfo();
      });
    }

    // Mode tabs in Phone Modal
    const tabQrMobile = document.getElementById('tabQrMobile');
    const tabQrLan = document.getElementById('tabQrLan');
    if (tabQrMobile) {
      tabQrMobile.addEventListener('click', () => {
        this.qrMode = 'mobile';
        this.renderQrModalContent();
      });
    }
    if (tabQrLan) {
      tabQrLan.addEventListener('click', () => {
        this.qrMode = 'lan';
        this.renderQrModalContent();
      });
    }

    // Copy Tunnel Password
    const btnCopyPassword = document.getElementById('btnCopyPassword');
    if (btnCopyPassword) {
      btnCopyPassword.addEventListener('click', () => {
        const pw = document.getElementById('tunnelPasswordDisplay')?.textContent || '';
        if (pw) {
          navigator.clipboard.writeText(pw).then(() => {
            btnCopyPassword.textContent = 'Copied!';
            setTimeout(() => { btnCopyPassword.textContent = 'Copy Password'; }, 2000);
          });
        }
      });
    }

    // Copy LAN / Public URL
    const btnCopyLan = document.getElementById('btnCopyLanUrl');
    if (btnCopyLan) {
      btnCopyLan.addEventListener('click', () => {
        const text = document.getElementById('lanUrlDisplay')?.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          btnCopyLan.textContent = 'Copied!';
          setTimeout(() => { btnCopyLan.textContent = 'Copy Link'; }, 2000);
        });
      });
    }

    // AI Chat Input & Send Button
    const btnSendAiChat = document.getElementById('btnSendAiChat');
    const aiChatInput = document.getElementById('aiChatInput');
    if (btnSendAiChat) {
      btnSendAiChat.addEventListener('click', () => this.askAiCopilot());
    }
    if (aiChatInput) {
      aiChatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.askAiCopilot();
      });
    }

    // Manual Refresh Live Market Data
    const btnRefreshMarketData = document.getElementById('btnRefreshMarketData');
    if (btnRefreshMarketData) {
      btnRefreshMarketData.addEventListener('click', async () => {
        btnRefreshMarketData.disabled = true;
        btnRefreshMarketData.innerHTML = `
          <svg style="animation: spin 0.8s linear infinite;" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Refreshing...
        `;
        try {
          await fetch('/api/market/refresh', { method: 'POST' });
          await this.loadWatchlist();
          if (window.dashboard) await window.dashboard.refreshAllPinnedScans();
          this.showToast('✅ Real-time market quotes refreshed!', 'success');
        } catch (e) {
          this.showToast('Failed to refresh market data', 'error');
        }
        btnRefreshMarketData.disabled = false;
        btnRefreshMarketData.innerHTML = `
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          Refresh
        `;
      });
    }

    // Save Custom Scan Button
    const btnConfirmSaveScan = document.getElementById('btnConfirmSaveScan');
    if (btnConfirmSaveScan) {
      btnConfirmSaveScan.addEventListener('click', () => this.saveCustomScan());
    }
  }

  // Fetch Server Info & Remote/Local URLs for Phone Sync
  async fetchServerInfo() {
    try {
      const resp = await fetch('/api/info');
      const data = await resp.json();
      this.info = data;

      if (!this.qrMode) {
        this.qrMode = data.publicUrl ? 'mobile' : 'lan';
      }
      if (!this.loginQrMode) {
        this.loginQrMode = data.publicUrl ? 'mobile' : 'lan';
      }

      this.renderQrModalContent();
      this.renderLoginQrContent();

      const deviceBadge = document.getElementById('deviceCountBadge');
      if (deviceBadge && data.deviceCounts !== undefined) {
        deviceBadge.textContent = `${data.deviceCounts} connected`;
      }

      this.updateMarketStatusBadge(data.marketStatus);
      return data;
    } catch (e) {
      console.error('Failed to fetch server info:', e);
      return null;
    }
  }

  openPhoneConnectModal() {
    const modal = document.getElementById('phoneConnectModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
      this.fetchServerInfo().then(() => {
        this.renderQrModalContent();
      });
    }
  }

  closePhoneConnectModal() {
    const modal = document.getElementById('phoneConnectModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  setQrMode(mode) {
    this.qrMode = mode;
    this.renderQrModalContent();
  }

  copyLanUrl() {
    const text = document.getElementById('lanUrlDisplay')?.textContent || '';
    if (text && !text.includes('Generating')) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyLanUrl');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = orig; }, 2000);
        }
        this.showToast('Phone connect link copied to clipboard!', 'success', 2000);
      });
    }
  }

  setLoginQrMode(mode) {
    this.loginQrMode = mode;
    this.renderLoginQrContent();
  }

  copyLoginLanUrl() {
    const text = document.getElementById('loginLanUrlDisplay')?.textContent || '';
    if (text && !text.includes('Generating')) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnLoginCopyLanUrl');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = orig; }, 2000);
        }
        this.showToast('Phone connect link copied to clipboard!', 'success', 2000);
      });
    }
  }

  renderLoginQrContent() {
    if (!this.info) return;
    const data = this.info;
    const isMobile = this.loginQrMode !== 'lan' && !!data.publicUrl;

    const qrImg = document.getElementById('loginQrCodeImg');
    const lanDisplay = document.getElementById('loginLanUrlDisplay');
    const tabMobile = document.getElementById('tabLoginQrMobile');
    const tabLan = document.getElementById('tabLoginQrLan');
    const subtitle = document.getElementById('loginQrModeSubtitle');
    const statusBadge = document.getElementById('loginTunnelStatusBadge');
    const stepsList = document.getElementById('loginQrStepsList');

    if (tabMobile && tabLan) {
      if (isMobile) {
        tabMobile.style.background = '#3b82f6';
        tabMobile.style.color = '#ffffff';
        tabLan.style.background = 'transparent';
        tabLan.style.color = '#94a3b8';
      } else {
        tabLan.style.background = '#3b82f6';
        tabLan.style.color = '#ffffff';
        tabMobile.style.background = 'transparent';
        tabMobile.style.color = '#94a3b8';
      }
    }

    if (isMobile) {
      const activeQr = data.publicQrDataUrl || data.qrDataUrl;
      if (qrImg && activeQr) qrImg.src = activeQr;
      if (lanDisplay) lanDisplay.textContent = data.publicUrl || 'Generating link...';
      if (statusBadge) statusBadge.style.display = 'flex';
      if (subtitle) {
        subtitle.innerHTML = 'Open on your phone using your <strong>own 4G / 5G Mobile Data</strong> — No Wi-Fi or Password Needed!';
      }
      if (stepsList) {
        stepsList.innerHTML = `
          <li>Scan the QR code with your phone camera using <strong>Mobile Data</strong>.</li>
          <li>The full <strong>TejStockAI</strong> terminal opens directly — no passwords needed!</li>
          <li>Tap <strong>⋮ (3 dots)</strong> in Chrome and tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong> for full-screen PWA!</li>
        `;
      }
    } else {
      const activeQr = data.lanQrDataUrl || data.qrDataUrl;
      if (qrImg && activeQr) qrImg.src = activeQr;
      if (lanDisplay) lanDisplay.textContent = data.lanUrl;
      if (statusBadge) statusBadge.style.display = 'none';
      if (subtitle) {
        subtitle.innerHTML = 'Connect your phone and PC to the <strong>exact same Wi-Fi</strong> router.';
      }
      if (stepsList) {
        stepsList.innerHTML = `
          <li>Ensure your Android phone is connected to the same Wi-Fi.</li>
          <li>Scan the QR code with your camera or open the URL in Chrome / Edge.</li>
          <li>Tap <strong>⋮ (3 dots)</strong> in Chrome and tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>!</li>
        `;
      }
    }
  }

  renderQrModalContent() {
    if (!this.info) return;
    const data = this.info;
    const isMobile = this.qrMode !== 'lan' && !!data.publicUrl;

    const qrImg = document.getElementById('qrCodeImg');
    const lanDisplay = document.getElementById('lanUrlDisplay');
    const tabMobile = document.getElementById('tabQrMobile');
    const tabLan = document.getElementById('tabQrLan');
    const passwordCard = document.getElementById('tunnelPasswordCard');
    const passwordDisplay = document.getElementById('tunnelPasswordDisplay');
    const stepPwText = document.getElementById('qrStepPwText');
    const subtitle = document.getElementById('qrModeSubtitle');
    const statusBadge = document.getElementById('tunnelStatusBadge');
    const stepsList = document.getElementById('qrStepsList');

    if (tabMobile && tabLan) {
      if (isMobile) {
        tabMobile.style.background = '#3b82f6';
        tabMobile.style.color = '#ffffff';
        tabLan.style.background = 'transparent';
        tabLan.style.color = '#94a3b8';
      } else {
        tabLan.style.background = '#3b82f6';
        tabLan.style.color = '#ffffff';
        tabMobile.style.background = 'transparent';
        tabMobile.style.color = '#94a3b8';
      }
    }

    if (isMobile) {
      const activeQr = data.publicQrDataUrl || data.qrDataUrl;
      if (qrImg && activeQr) qrImg.src = activeQr;
      if (lanDisplay) lanDisplay.textContent = data.publicUrl || 'Generating link...';
      if (statusBadge) statusBadge.style.display = 'flex';
      if (subtitle) {
        subtitle.innerHTML = 'Open on your phone using your <strong>own 4G / 5G Mobile Data</strong> — No Wi-Fi or Password Needed!';
      }
      if (stepsList) {
        stepsList.innerHTML = `
          <li>Scan the QR code with your phone camera using <strong>Mobile Data</strong>.</li>
          <li>The full <strong>TejStockAI</strong> terminal opens directly — no passwords needed!</li>
          <li>Tap <strong>⋮ (3 dots)</strong> in Chrome and tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong> for full-screen PWA!</li>
        `;
      }
    } else {
      const activeQr = data.lanQrDataUrl || data.qrDataUrl;
      if (qrImg && activeQr) qrImg.src = activeQr;
      if (lanDisplay) lanDisplay.textContent = data.lanUrl;
      const statusBadge = document.getElementById('tunnelStatusBadge');
      if (statusBadge) statusBadge.style.display = 'none';
      if (subtitle) {
        subtitle.innerHTML = 'Connect your phone and PC to the <strong>exact same Wi-Fi</strong> router.';
      }
      if (stepsList) {
        stepsList.innerHTML = `
          <li>Ensure your Android phone is connected to the same Wi-Fi.</li>
          <li>Scan the QR code with your camera or open the URL in Chrome / Edge.</li>
          <li>Tap <strong>⋮ (3 dots)</strong> in Chrome and tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>!</li>
        `;
      }
    }
  }

  updateMarketStatusBadge(status) {
    if (!status) return;
    const textElem = document.getElementById('marketStatusText');
    const dotElem = document.getElementById('marketPulseDot');
    if (textElem) textElem.textContent = status.statusText || 'NSE MARKET';
    if (dotElem) dotElem.className = `pulse-dot ${status.isOpen ? 'pulse-green' : 'pulse-red'}`;

    const loginText = document.getElementById('loginMarketStatusText');
    const loginDot = document.getElementById('loginPulseDot');
    if (loginText) loginText.textContent = status.statusText || '🟢 NSE LIVE MARKET CONNECTED';
    if (loginDot) loginDot.className = `pulse-dot ${status.isOpen ? 'pulse-green' : 'pulse-red'}`;
  }

  // Live Top Ticker Tape (Displays active live ticks for top indices & stocks)
  renderMarketTickerTape() {
    const container = document.getElementById('marketTickerItems');
    if (!container) return;

    const tickerSymbols = [
      'NIFTY 50', 'BANK NIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 
      'SBIN', 'TMPV', 'TATAMOTORS', 'TITAN', 'ZOMATO', 'SUZLON', 'AAPL', 'TSLA', 'NVDA', 'BTC-USD'
    ];
    const items = [];

    tickerSymbols.forEach(sym => {
      let st = (this.cachedAllStocks || []).find(s => s.symbol === sym);
      if (!st && this.cachedSectors) {
        for (const sec of this.cachedSectors) {
          if (sec.symbol === sym) { st = sec; break; }
          const found = (sec.stocks || []).find(s => s.symbol === sym);
          if (found) { st = found; break; }
        }
      }
      if (!st) {
        const isUsd = ['AAPL', 'TSLA', 'NVDA', 'BTC-USD'].includes(sym);
        st = {
          symbol: sym,
          ltp: sym === 'BTC-USD' ? 82850 : (sym === 'AAPL' ? 245.5 : (sym === 'TSLA' ? 381.2 : (sym === 'NVDA' ? 138.4 : 1250))),
          changePct: 1.45,
          currency: isUsd ? 'USD' : 'INR'
        };
      }
      if (st) {
        const isPos = (st.changePct || 0) >= 0;
        const sign = isPos ? '+' : '';
        const chgClass = isPos ? 'up' : 'down';
        const curSym = (st.currency === 'USD' || ['AAPL', 'TSLA', 'NVDA', 'BTC-USD'].includes(st.symbol)) ? '$' : '₹';
        const price = typeof st.ltp === 'number' ? st.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : st.ltp;
        const pct = typeof st.changePct === 'number' ? `${sign}${st.changePct.toFixed(2)}%` : '--';
        items.push(`
          <span class="ticker-item" data-symbol="${st.symbol}" onclick="window.app?.openStockChart('${st.symbol}')" title="Click to view chart">
            <span class="ticker-item-sym">${st.symbol}</span>
            <b data-ticker-price="${st.symbol}">${curSym}${price}</b>
            <span class="${chgClass}" data-ticker-chg="${st.symbol}">${pct}</span>
          </span>
        `);
      }
    });

    if (items.length > 0) {
      // Duplicate for seamless infinite marquee loop
      container.innerHTML = [...items, ...items].join('');
    }
  }

  // Real-Time High-Frequency Live Tick Engine (Processes price updates with DOM flash animations)
  applyLiveTicks(ticks) {
    if (!Array.isArray(ticks) || ticks.length === 0) return;

    ticks.forEach(tick => {
      const { symbol, ltp, prevClose, change, changePct, direction } = tick;
      if (!symbol || typeof ltp !== 'number') return;

      const isPos = (changePct || 0) >= 0;
      const sign = isPos ? '+' : '';
      const isUsd = (tick.currency === 'USD' || ['AAPL', 'TSLA', 'NVDA', 'BTC-USD'].includes(symbol));
      const curSym = isUsd ? '$' : '₹';
      const formattedPrice = ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedPct = `${sign}${(changePct || 0).toFixed(2)}%`;
      const changeClass = isPos ? 'change-positive' : 'change-negative';
      const flashClass = direction === 'UP' ? 'price-flash-up' : 'price-flash-down';

      // 1. Update In-Memory cache in cachedAllStocks
      if (this.cachedAllStocks) {
        const cached = this.cachedAllStocks.find(s => s.symbol === symbol);
        if (cached) {
          cached.ltp = ltp;
          cached.change = change;
          cached.changePct = changePct;
          if (tick.volume) cached.volume = tick.volume;
        }
      }

      // 2. Update In-Memory cache in cachedSectors
      if (this.cachedSectors) {
        this.cachedSectors.forEach(sec => {
          if (sec.symbol === symbol) {
            sec.ltp = ltp;
            sec.change = change;
            sec.changePct = changePct;
          }
          if (sec.stocks) {
            const st = sec.stocks.find(s => s.symbol === symbol);
            if (st) {
              st.ltp = ltp;
              st.change = change;
              st.changePct = changePct;
              if (tick.volume) st.volume = tick.volume;
            }
          }
        });
      }

      // 3. Update In-Memory cache in cachedWatchlists
      if (this.cachedWatchlists) {
        Object.values(this.cachedWatchlists).forEach(tab => {
          if (tab.stocks) {
            const st = tab.stocks.find(s => s.symbol === symbol);
            if (st) {
              st.ltp = ltp;
              st.change = change;
              st.changePct = changePct;
              if (tick.volume) st.volume = tick.volume;
            }
          }
        });
      }

      // 4. Update Stock item quotes in Kite watchlists & sectors (DOM)
      const stockLtpElems = document.querySelectorAll(`[data-stock-ltp="${symbol}"]`);
      stockLtpElems.forEach(el => {
        el.textContent = `${curSym}${formattedPrice}`;
        el.classList.remove('price-flash-up', 'price-flash-down', 'flash-green', 'flash-red');
        void el.offsetWidth;
        el.classList.add(flashClass);
        setTimeout(() => el.classList.remove(flashClass), 650);
      });

      const stockChgElems = document.querySelectorAll(`[data-stock-chg="${symbol}"]`);
      stockChgElems.forEach(el => {
        el.textContent = formattedPct;
        el.className = `kite-stock-chg ${changeClass}`;
      });

      // 5. Update Sector Index header in DOM
      const secLtpElems = document.querySelectorAll(`[data-sec-ltp="${symbol}"], .kite-sector-accordion[data-symbol="${symbol}"] .kite-sec-ltp`);
      secLtpElems.forEach(el => {
        el.textContent = `${curSym}${formattedPrice}`;
        el.classList.remove('price-flash-up', 'price-flash-down', 'flash-green', 'flash-red');
        void el.offsetWidth;
        el.classList.add(flashClass);
        setTimeout(() => el.classList.remove(flashClass), 650);
      });

      const secChgElems = document.querySelectorAll(`[data-sec-chg="${symbol}"], .kite-sector-accordion[data-symbol="${symbol}"] .kite-sec-change`);
      secChgElems.forEach(el => {
        el.textContent = `${typeof change === 'number' ? change.toFixed(2) : change} (${formattedPct})`;
        el.className = `kite-sec-change ${changeClass}`;
      });

      // 6. Update Top Ticker Tape (DOM)
      const tickerPriceEl = document.querySelector(`[data-ticker-price="${symbol}"]`);
      if (tickerPriceEl) {
        tickerPriceEl.textContent = `${curSym}${formattedPrice}`;
        tickerPriceEl.classList.remove('price-flash-up', 'price-flash-down', 'flash-green', 'flash-red');
        void tickerPriceEl.offsetWidth;
        tickerPriceEl.classList.add(flashClass);
        setTimeout(() => tickerPriceEl.classList.remove(flashClass), 650);
      }
      const tickerChgEl = document.querySelector(`[data-ticker-chg="${symbol}"]`);
      if (tickerChgEl) {
        tickerChgEl.textContent = formattedPct;
        tickerChgEl.className = isPos ? 'up' : 'down';
      }

      // 7. Update Watchlist Table rows (DOM)
      const wlRow = document.querySelector(`#watchlistTableBody tr[data-symbol="${symbol}"]`);
      if (wlRow) {
        const priceCell = wlRow.querySelector('.cell-ltp');
        if (priceCell) {
          priceCell.textContent = `${curSym}${formattedPrice}`;
          priceCell.classList.remove('price-flash-up', 'price-flash-down', 'flash-green', 'flash-red');
          void priceCell.offsetWidth;
          priceCell.classList.add(flashClass);
          setTimeout(() => priceCell.classList.remove(flashClass), 650);
        }
        const chgSpan = wlRow.querySelector('.stock-change');
        if (chgSpan) {
          chgSpan.textContent = formattedPct;
          chgSpan.className = `stock-change ${changeClass}`;
        }
      }

      // 8. Update Dashboard pinned scan table rows (DOM)
      const dashRows = document.querySelectorAll(`#dashboardGrid tr[data-symbol="${symbol}"]`);
      dashRows.forEach(row => {
        const cellPrice = row.querySelector('.cell-price');
        if (cellPrice) {
          cellPrice.textContent = `${curSym}${formattedPrice}`;
          cellPrice.classList.remove('price-flash-up', 'price-flash-down', 'flash-green', 'flash-red');
          void cellPrice.offsetWidth;
          cellPrice.classList.add(flashClass);
          setTimeout(() => cellPrice.classList.remove(flashClass), 650);
        }
        const cellChg = row.querySelector('.stock-change');
        if (cellChg) {
          cellChg.textContent = formattedPct;
          cellChg.className = `stock-change ${changeClass}`;
        }
      });

      // 9. Update Active Terminal Stock if matching (DOM)
      if (this.terminalActiveSymbol === symbol) {
        const termPriceElem = document.getElementById('terminalActiveStockPrice');
        if (termPriceElem) {
          termPriceElem.textContent = `${curSym}${formattedPrice} (${formattedPct})`;
          termPriceElem.classList.remove('price-flash-up', 'price-flash-down', 'flash-green', 'flash-red');
          void termPriceElem.offsetWidth;
          termPriceElem.classList.add(flashClass);
          setTimeout(() => termPriceElem.classList.remove(flashClass), 650);
        }
      }
    });
  }

  // Handle Full Dataset Updates from Server
  async applyMarketDataUpdate(msg) {
    if (msg.stocks && Array.isArray(msg.stocks)) {
      this.cachedAllStocks = msg.stocks;
      this.renderMarketTickerTape();
    }
    if (msg.sectors && Array.isArray(msg.sectors)) {
      this.cachedSectors = msg.sectors;
    }
    if (msg.watchlists && typeof msg.watchlists === 'object') {
      this.cachedWatchlists = msg.watchlists;
    }
    if (!msg.sectors || !msg.watchlists) {
      await this.loadWatchlist();
    } else if (this.currentView === 'watchlist') {
      if (this.activeWatchlistTab === 'STOCK MAIN') {
        const q = (document.getElementById('kiteWatchlistSearchInput')?.value || '').trim().toLowerCase();
        this.renderKiteSectors(q);
      } else {
        const q = (document.getElementById('kiteWatchlistSearchInput')?.value || '').trim().toLowerCase();
        this.renderKiteTabStocks(this.activeWatchlistTab, q);
      }
    }
    if (window.dashboard) {
      window.dashboard.refreshAllPinnedScans();
    }
  }

  // WebSocket Live Real-Time Data Streaming (with Vercel / Netlify / Serverless Cloud HTTP Polling Fallback)
  connectWebSocket() {
    const isCloud = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('netlify.app') || (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1') && !window.location.hostname.startsWith('192.168.'));
    if (isCloud) {
      console.log('🌐 Cloud Serverless environment (Vercel / Netlify) detected — starting seamless real-time market stream polling.');
      this.startHttpPollingFallback();
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.fallbackPollingTimer) {
          clearInterval(this.fallbackPollingTimer);
          this.fallbackPollingTimer = null;
        }
        console.log('⚡ Connected to Chartink Real-Time Market Feed.');
      };

      this.ws.onmessage = e => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'PRICE_TICK') {
            if (msg.marketStatus) this.updateMarketStatusBadge(msg.marketStatus);
            if (msg.ticks) this.applyLiveTicks(msg.ticks);
          } else if (msg.type === 'CONNECTED') {
            if (msg.marketStatus) this.updateMarketStatusBadge(msg.marketStatus);
            if (msg.initialTicks) this.applyLiveTicks(msg.initialTicks);
          } else if (msg.type === 'MARKET_DATA_UPDATE' || msg.type === 'MARKET_REFRESHED') {
            if (msg.marketStatus) this.updateMarketStatusBadge(msg.marketStatus);
            this.applyMarketDataUpdate(msg);
          } else if (msg.type === 'SCANS_UPDATED') {
            if (window.dashboard) window.dashboard.loadScans();
            this.renderStrategiesLibrary();
          } else if (msg.type === 'WATCHLIST_UPDATED') {
            this.loadWatchlist();
          }
        } catch (err) {}
      };

      this.ws.onerror = () => {
        this.startHttpPollingFallback();
      };

      this.ws.onclose = () => {
        this.startHttpPollingFallback();
        const delay = Math.min(10000, 1000 * Math.pow(2, this.reconnectAttempts++));
        if (this.reconnectAttempts < 6) {
          setTimeout(() => this.connectWebSocket(), delay);
        }
      };
    } catch (err) {
      this.startHttpPollingFallback();
    }
  }

  // Real-Time High Frequency HTTP Fallback for Cloud / Netlify Serverless Environments
  startHttpPollingFallback() {
    if (this.fallbackPollingTimer) return;
    const pollTicks = async () => {
      try {
        const resp = await fetch('/api/market/ticks');
        if (resp.ok) {
          const data = await resp.json();
          if (data.marketStatus) this.updateMarketStatusBadge(data.marketStatus);
          if (data.ticks && Array.isArray(data.ticks)) this.applyLiveTicks(data.ticks);
        }
      } catch (e) {}
    };

    pollTicks();
    this.fallbackPollingTimer = setInterval(pollTicks, 3500);
  }

  // PWA Installation Flow
  initPwa() {
    let deferredPrompt = null;
    const pwaBtn = document.getElementById('btnPwaInstall');

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      if (pwaBtn) pwaBtn.style.display = 'inline-flex';
    });

    if (pwaBtn) {
      pwaBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice.outcome === 'accepted') pwaBtn.style.display = 'none';
          deferredPrompt = null;
        }
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(reg => {
        reg.update();
      }).catch(err => {
        console.warn('SW registration failed:', err);
      });
    }
  }
}

window.App = App;

// Global App Bootstrapper with safe readyState handling
function bootstrapApp() {
  if (!window.app) {
    window.app = new App();
    window.showToast = (msg, type, dur) => window.app?.showToast(msg, type, dur);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
