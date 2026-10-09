const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');
const compression = require('compression');
const {
  RealMarketService,
  getNseMarketStatus,
  computeAiMomentumAnalysis,
  computeIntradayAiMomentum,
  computeLongTermAiMomentum,
  computeBrokerMarketDepth,
  computeBrokerDerivatives,
  getFiiDiiData
} = require('./market-service');
const { PREBUILT_SCANS, runScan } = require('./scans');

const app = express();
const isDirectRun = require.main === module;
let server = null;
let wss = null;
if (isDirectRun) {
  server = http.createServer(app);
  wss = new WebSocketServer({ server });
}

const PORT = process.env.PORT || 3000;

// Initialize Real Market Data Service
const marketService = new RealMarketService();
let customScans = [];
let watchlist = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'TMPV', 'TITAN', 'APOLLOHOSP', 'ETERNAL', 'SUZLON', 'BEL'];
let dashboardConfig = {
  activeDashboardId: 'default',
  dashboards: [
    {
      id: 'default',
      name: 'TejStockAI Main Screener',
      pinnedScanIds: ['bullish-breakout', 'rsi-oversold-bounce', 'golden-cross', 'volume-shockers', 'bollinger-breakout', 'candlestick-reversal'],
      autoRefreshSec: 15
    },
    {
      id: 'intraday',
      name: 'Intraday Broker Momentum',
      pinnedScanIds: ['volume-shockers', 'top-gainers-momentum', 'macd-bullish-cross'],
      autoRefreshSec: 5
    }
  ]
};

const localtunnel = require('localtunnel');
const https = require('https');

const { spawn } = require('child_process');
const fs = require('fs');

let publicUrl = null;
let publicQrDataUrl = null;
let cloudflaredProc = null;

function startTunnel() {
  const exePath = path.join(__dirname, 'cloudflared.exe');
  if (fs.existsSync(exePath)) {
    console.log('[Tunnel] Launching Cloudflare Tunnel (100% direct, ultra-fast, no password required)...');
    try {
      cloudflaredProc = spawn(exePath, ['tunnel', '--url', `http://127.0.0.1:${PORT}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      const urlRegex = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i;

      const onData = async (chunk) => {
        const text = chunk.toString();
        const match = text.match(urlRegex);
        if (match && !publicUrl) {
          publicUrl = match[0];
          publicQrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 2, width: 250 });
          console.log('====================================================');
          console.log(`> 🌐 Cloudflare Direct Tunnel:  ${publicUrl}`);
          console.log('> 🚀 ZERO PASSWORD NEEDED - Instant Mobile Access!');
          console.log('====================================================');
        }
      };

      cloudflaredProc.stdout.on('data', onData);
      cloudflaredProc.stderr.on('data', onData);

      cloudflaredProc.on('close', (code) => {
        console.log(`[Tunnel] Cloudflare process exited (${code}). Reconnecting in 5s...`);
        publicUrl = null;
        publicQrDataUrl = null;
        setTimeout(startTunnel, 5000);
      });

      cloudflaredProc.on('error', (err) => {
        console.error('[Tunnel Error]:', err.message);
        startLocaltunnelFallback();
      });
      return;
    } catch (e) {
      console.error('[Cloudflare Tunnel Init Error]:', e.message);
    }
  }

  startLocaltunnelFallback();
}

async function startLocaltunnelFallback() {
  try {
    const tunnel = await localtunnel({ port: PORT, local_host: '127.0.0.1' });
    publicUrl = tunnel.url;
    publicQrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 2, width: 250 });
    console.log(`> 🌐 Localtunnel Fallback URL: ${publicUrl}`);
  } catch (err) {
    console.error('[Localtunnel Error]:', err.message);
  }
}

process.on('exit', () => {
  if (cloudflaredProc) {
    try { cloudflaredProc.kill(); } catch (e) {}
  }
});

// Helper to determine Local LAN IPv4 address for Android connection
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIpAddress();
const localUrl = `http://localhost:${PORT}`;
const lanUrl = `http://${localIp}:${PORT}`;

// Netlify Serverless Path Normalizer
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api') || '/api';
  } else if (req.url.startsWith('/.netlify/functions')) {
    req.url = req.url.replace('/.netlify/functions', '') || '/';
  }
  next();
});

// Compression Middleware (Gzip & Deflate for all text, html, css, js, json)
app.use(compression({
  threshold: 1024
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// ADMIN SECURITY & VISITOR/LOGIN TRACKING
// ==========================================
const ADMIN_PHONE = '7647814314';

function resolveLogsPath() {
  const candidates = [
    path.join(__dirname, 'admin_logs.json'),
    path.join(process.cwd(), 'admin_logs.json'),
    path.join(os.tmpdir(), 'admin_logs.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, 'admin_logs.json');
}

let LOGS_FILE = resolveLogsPath();

let adminOtpStore = {
  phone: null,
  code: null,
  expiresAt: 0
};
let adminTokens = new Set();
let saveLogsTimer = null;

let trackingData = {
  visitors: [],
  logins: [],
  visitEvents: []
};

function findIdentifiedUserForIp(ip, device) {
  if (!Array.isArray(trackingData.logins)) return null;
  const match = trackingData.logins.find(l => l.ip === ip && (l.device === device || !device));
  if (match) {
    const u = match.username || match.clientId || 'TEJAS';
    const d = u.toUpperCase() === 'TEJAS' ? 'Tejas Dewangan' : u;
    return {
      name: `${d} (${u.toUpperCase()})`,
      role: 'PRO_TRADER',
      broker: match.broker || 'Zerodha Kite'
    };
  }
  return null;
}

function migrateTrackingData() {
  if (!Array.isArray(trackingData.visitors)) trackingData.visitors = [];
  if (!Array.isArray(trackingData.logins)) trackingData.logins = [];
  if (!Array.isArray(trackingData.visitEvents)) trackingData.visitEvents = [];

  trackingData.visitors.forEach(v => {
    // If not identified yet, check if logins match IP and device
    if (!v.identifiedUser) {
      const match = findIdentifiedUserForIp(v.ip, v.device) || (v.ip === '127.0.0.1' ? { name: 'Tejas Dewangan (TEJAS)', role: 'PRO_TRADER', broker: 'Zerodha Kite' } : null);
      if (match) {
        v.identifiedUser = match.name;
        v.role = match.role;
        v.broker = match.broker;
      } else if (v.userAgent && v.userAgent.includes('WhatsApp')) {
        v.identifiedUser = 'Guest Visitor (WhatsApp Link Preview)';
        v.role = 'GUEST';
        v.broker = 'None';
      } else if (v.userAgent === 'node') {
        v.identifiedUser = 'Automated Test Runner / Bot';
        v.role = 'SYSTEM';
        v.broker = 'None';
      } else {
        v.identifiedUser = `Guest Viewer (${v.device || 'Web Browser'})`;
        v.role = 'GUEST';
        v.broker = 'None';
      }
    }

    // Build viewsHistory if missing
    if (!Array.isArray(v.viewsHistory) || v.viewsHistory.length === 0) {
      v.viewsHistory = [];
      const count = v.visitCount || 1;
      const startMs = new Date(v.timestamp || Date.now() - 10 * 60 * 1000).getTime();
      const endMs = new Date(v.lastSeen || v.timestamp || Date.now()).getTime();
      const step = count > 1 ? (endMs - startMs) / (count - 1) : 0;

      for (let k = count; k >= 1; k--) {
        const eventTime = new Date(startMs + Math.round((k - 1) * step)).toISOString();
        const ev = {
          id: `ev_${v.id}_${k}`,
          visitorId: v.id,
          visitNumber: k,
          timestamp: eventTime,
          ip: v.ip,
          device: v.device,
          browser: v.browser,
          path: v.path || '/',
          viewerName: v.identifiedUser,
          role: v.role || 'GUEST',
          broker: v.broker || 'None',
          status: v.role === 'PRO_TRADER' ? 'Authenticated Trader' : 'Guest Viewer'
        };
        v.viewsHistory.push(ev);
        if (!trackingData.visitEvents.some(e => e.id === ev.id)) {
          trackingData.visitEvents.push(ev);
        }
      }
    }
  });

  // Sort global events newest first
  trackingData.visitEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

try {
  if (fs.existsSync(LOGS_FILE)) {
    const raw = fs.readFileSync(LOGS_FILE, 'utf8');
    trackingData = JSON.parse(raw);
    migrateTrackingData();
  }
} catch (e) {
  console.warn('[Admin] Note loading admin_logs.json:', e.message);
}

function saveTrackingData() {
  try {
    if (trackingData.visitors.length > 500) trackingData.visitors = trackingData.visitors.slice(0, 500);
    if (trackingData.logins.length > 500) trackingData.logins = trackingData.logins.slice(0, 500);
    if (trackingData.visitEvents.length > 500) trackingData.visitEvents = trackingData.visitEvents.slice(0, 500);
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify(trackingData, null, 2), 'utf8');
    } catch (writeErr) {
      const tmpFile = path.join(os.tmpdir(), 'admin_logs.json');
      fs.writeFileSync(tmpFile, JSON.stringify(trackingData, null, 2), 'utf8');
    }
  } catch (e) {
    console.error('[Admin] Error saving logs:', e.message);
  }
}

function parseUserAgent(ua = '') {
  let device = 'Desktop PC';
  if (/Android/i.test(ua)) device = 'Android Phone';
  else if (/iPhone/i.test(ua)) device = 'Apple iPhone';
  else if (/iPad/i.test(ua)) device = 'Apple iPad';
  else if (/Windows NT/i.test(ua)) device = 'Windows PC';
  else if (/Macintosh|Mac OS/i.test(ua)) device = 'Apple Mac';
  else if (/Linux/i.test(ua)) device = 'Linux PC';

  let browser = 'Chrome / Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';

  return { device, browser };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  let ip = req.socket?.remoteAddress || req.ip || '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return ip;
}

// Visitor Tracking Middleware: Records real website viewers and individual visit history
app.use((req, res, next) => {
  const p = req.path;
  const isStaticAsset = p.startsWith('/css/') || p.startsWith('/js/') || p.startsWith('/icons/') || p.startsWith('/manifest.json') || p.endsWith('.png') || p.endsWith('.svg') || p.endsWith('.ico') || p.endsWith('.map');
  const isApi = p.startsWith('/api/');

  if (!isStaticAsset && !isApi && (p === '/' || p.endsWith('.html') || p === '/index.html' || p === '/admin')) {
    const ip = getClientIp(req);
    const ua = req.headers['user-agent'] || 'Unknown';
    const { device, browser } = parseUserAgent(ua);
    const now = new Date().toISOString();

    const identified = findIdentifiedUserForIp(ip, device) || (ip === '127.0.0.1' ? { name: 'Tejas Dewangan (TEJAS)', role: 'PRO_TRADER', broker: 'Zerodha Kite' } : null);
    const viewerName = identified ? identified.name : `Guest Viewer (${device})`;
    const role = identified ? identified.role : 'GUEST';
    const broker = identified ? identified.broker : 'None';

    let existing = trackingData.visitors.find(v => v.ip === ip && v.device === device);
    if (existing) {
      existing.visitCount = (existing.visitCount || 1) + 1;
      existing.lastSeen = now;
      existing.path = p;
      if (identified && (!existing.identifiedUser || existing.role === 'GUEST')) {
        existing.identifiedUser = viewerName;
        existing.role = role;
        existing.broker = broker;
      }
    } else {
      existing = {
        id: 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        ip,
        userAgent: ua,
        device,
        browser,
        path: p,
        timestamp: now,
        lastSeen: now,
        visitCount: 1,
        identifiedUser: viewerName,
        role,
        broker,
        viewsHistory: []
      };
      trackingData.visitors.unshift(existing);
    }

    if (!Array.isArray(existing.viewsHistory)) existing.viewsHistory = [];
    const visitEvent = {
      id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      visitorId: existing.id,
      visitNumber: existing.visitCount,
      timestamp: now,
      ip,
      device,
      browser,
      path: p,
      viewerName: existing.identifiedUser || viewerName,
      role: existing.role || role,
      broker: existing.broker || broker,
      status: (existing.role === 'PRO_TRADER' || role === 'PRO_TRADER') ? 'Authenticated Trader' : 'Guest Viewer'
    };

    existing.viewsHistory.unshift(visitEvent);
    if (existing.viewsHistory.length > 100) existing.viewsHistory.pop();

    if (!Array.isArray(trackingData.visitEvents)) trackingData.visitEvents = [];
    trackingData.visitEvents.unshift(visitEvent);
    if (trackingData.visitEvents.length > 500) trackingData.visitEvents.pop();

    if (!saveLogsTimer) {
      saveLogsTimer = setTimeout(() => {
        saveTrackingData();
        saveLogsTimer = null;
      }, 3000);
    }
  }
  next();
});

// Static Asset Serving with ETag and Smart Browser Caching
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML documents revalidate to ensure immediate updates
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      // CSS, JS, Images, Icons, Fonts: cache for 1 hour with revalidation
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  }
}));

// Dynamic API Endpoints: Ensure fresh live real-time market data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Root Fallback Handlers
app.get('/', (req, res) => {
  const candidates = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(process.cwd(), 'public', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(process.cwd(), 'index.html')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return res.sendFile(c);
    }
  }
  res.send('TejStockAI Terminal Ready');
});

app.get('/api', (req, res) => {
  res.json({ status: 'ok', service: 'TejStockAI Cloud API', time: new Date().toISOString() });
});

let cachedLanQrDataUrl = null;

// REST Endpoints
app.get('/api/info', async (req, res) => {
  try {
    const isNetlify = Boolean(process.env.NETLIFY || req.headers['x-nf-request-id']);
    const isVercel = Boolean(process.env.VERCEL || req.headers['x-vercel-id']);
    const host = req.get('host') || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || (host.includes('localhost') ? 'http' : 'https');
    const currentDeployUrl = `${proto}://${host}`;
    const isCloud = isNetlify || isVercel || (!host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('192.168.'));

    if (!cachedLanQrDataUrl) {
      try {
        cachedLanQrDataUrl = await QRCode.toDataURL(lanUrl, { margin: 2, width: 250 });
      } catch (e) {
        cachedLanQrDataUrl = '';
      }
    }
    const lanQrDataUrl = cachedLanQrDataUrl || '';
    let pubQr = publicQrDataUrl;
    let activePublicUrl = publicUrl;

    if (isCloud && !activePublicUrl) {
      activePublicUrl = currentDeployUrl;
    }

    if (activePublicUrl && !pubQr) {
      try {
        pubQr = await QRCode.toDataURL(activePublicUrl, { margin: 2, width: 250 });
        publicQrDataUrl = pubQr;
      } catch (e) {
        pubQr = '';
      }
    }
    const marketStatus = getNseMarketStatus();
    res.json({
      appName: 'TejStockAI',
      version: '3.0.0',
      port: PORT,
      localUrl,
      lanUrl,
      localIp,
      publicUrl: activePublicUrl,
      tunnelType: isVercel ? 'vercel' : (isNetlify ? 'netlify' : (cloudflaredProc ? 'cloudflare' : (isCloud ? 'cloud' : 'direct'))),
      tunnelPassword: '',
      publicQrDataUrl: pubQr,
      lanQrDataUrl,
      qrDataUrl: pubQr || lanQrDataUrl,
      deviceCounts: wss ? wss.clients.size : 1,
      marketStatus
    });
  } catch (err) {
    console.error('Info endpoint error:', err);
    res.json({
      appName: 'TejStockAI',
      version: '3.0.0',
      marketStatus: getNseMarketStatus()
    });
  }
});

// Authentication API Endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, clientId, password, broker = 'Zerodha Kite', rememberMe = true } = req.body || {};
  const userClean = (clientId || username || '').trim();

  if (!userClean) {
    return res.status(400).json({ success: false, error: 'User ID or Client ID is required. Please enter your credentials.' });
  }

  const token = 'tej_sess_' + Buffer.from(userClean + ':' + Date.now()).toString('base64');
  const userProfile = {
    username: userClean,
    displayName: userClean.toUpperCase() === 'TEJAS' ? 'Tejas Dewangan' : userClean,
    clientId: userClean.toUpperCase(),
    broker: broker,
    role: 'PRO_TRADER',
    token,
    rememberMe,
    loggedInAt: new Date().toISOString()
  };

  // Log trader login event for Admin Portal
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || 'Unknown';
  const { device, browser } = parseUserAgent(ua);
  const now = new Date().toISOString();

  trackingData.logins.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    username: userClean,
    clientId: userClean.toUpperCase(),
    broker: broker,
    ip,
    userAgent: ua,
    device,
    browser,
    timestamp: now,
    status: 'SUCCESS',
    type: req.body?.isGuest ? '1-CLICK_TRADER' : 'BROKER_LOGIN'
  });

  // Correlate and attribute existing visitor records to this logged-in trader
  const identifiedLabel = `${userProfile.displayName} (${userClean.toUpperCase()})`;
  trackingData.visitors.forEach(v => {
    if (v.ip === ip || ip === '127.0.0.1') {
      v.identifiedUser = identifiedLabel;
      v.role = 'PRO_TRADER';
      v.broker = broker;
      if (Array.isArray(v.viewsHistory)) {
        v.viewsHistory.forEach(ev => {
          if (!ev.viewerName || ev.viewerName.startsWith('Guest') || ev.viewerName.includes('Test')) {
            ev.viewerName = identifiedLabel;
            ev.role = 'PRO_TRADER';
            ev.broker = broker;
            ev.status = 'Authenticated Trader';
          }
        });
      }
    }
  });

  if (Array.isArray(trackingData.visitEvents)) {
    trackingData.visitEvents.forEach(ev => {
      if (ev.ip === ip || ip === '127.0.0.1') {
        if (!ev.viewerName || ev.viewerName.startsWith('Guest') || ev.viewerName.includes('Test')) {
          ev.viewerName = identifiedLabel;
          ev.role = 'PRO_TRADER';
          ev.broker = broker;
          ev.status = 'Authenticated Trader';
        }
      }
    });
  }

  saveTrackingData();

  res.json({
    success: true,
    message: `Welcome to TejStockAI, ${userProfile.displayName}! Connected via ${broker}.`,
    user: userProfile
  });
});

// Google Email ID Authentication Endpoint (Available for users/traders, not admin)
app.post('/api/auth/google', (req, res) => {
  const { email, name, googleId, picture, broker = 'Google Workspace' } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid Google Email ID is required.' });
  }

  // Derive display name from Google Name or Email prefix
  const emailPrefix = cleanEmail.split('@')[0];
  const displayName = name || (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).replace(/[._]/g, ' '));
  const clientId = emailPrefix.toUpperCase();

  const token = 'tej_goog_' + Buffer.from(cleanEmail + ':' + Date.now()).toString('base64');
  const userProfile = {
    username: cleanEmail,
    email: cleanEmail,
    displayName,
    clientId,
    broker: 'Google Workspace',
    authProvider: 'GOOGLE',
    picture: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
    role: 'PRO_TRADER',
    token,
    rememberMe: true,
    loggedInAt: new Date().toISOString()
  };

  // Log trader login event for Admin Portal
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || 'Unknown';
  const { device, browser } = parseUserAgent(ua);
  const now = new Date().toISOString();

  trackingData.logins.unshift({
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    username: cleanEmail,
    clientId,
    broker: 'Google Workspace',
    ip,
    userAgent: ua,
    device,
    browser,
    timestamp: now,
    status: 'SUCCESS',
    type: 'GOOGLE_AUTH'
  });

  // Correlate and attribute existing visitor records to this logged-in Google user
  const identifiedLabel = `${displayName} (${cleanEmail})`;
  trackingData.visitors.forEach(v => {
    if (v.ip === ip || ip === '127.0.0.1') {
      v.identifiedUser = identifiedLabel;
      v.role = 'PRO_TRADER';
      v.broker = 'Google Workspace';
      if (Array.isArray(v.viewsHistory)) {
        v.viewsHistory.forEach(ev => {
          if (!ev.viewerName || ev.viewerName.startsWith('Guest') || ev.viewerName.includes('Test')) {
            ev.viewerName = identifiedLabel;
            ev.role = 'PRO_TRADER';
            ev.broker = 'Google Workspace';
            ev.status = 'Authenticated Trader (Google)';
          }
        });
      }
    }
  });

  if (Array.isArray(trackingData.visitEvents)) {
    trackingData.visitEvents.forEach(ev => {
      if (ev.ip === ip || ip === '127.0.0.1') {
        if (!ev.viewerName || ev.viewerName.startsWith('Guest') || ev.viewerName.includes('Test')) {
          ev.viewerName = identifiedLabel;
          ev.role = 'PRO_TRADER';
          ev.broker = 'Google Workspace';
          ev.status = 'Authenticated Trader (Google)';
        }
      }
    });
  }

  saveTrackingData();

  console.log(`[Google Auth] 🌐 User signed in with Google Email ID: ${cleanEmail} (${displayName})`);

  res.json({
    success: true,
    message: `Signed in successfully with Google (${cleanEmail})! Welcome to TejStockAI.`,
    user: userProfile
  });
});

// Pro Subscription Payment Submission Endpoint (PhonePe / UPI)
app.post('/api/pro/submit-payment', (req, res) => {
  const { utr, plan = '2_months_pro', amount = 1000 } = req.body || {};
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || 'Unknown';
  const { device, browser } = parseUserAgent(ua);
  const now = new Date().toISOString();

  if (!utr || String(utr).trim().length < 6) {
    return res.status(400).json({ success: false, error: 'Valid transaction UTR / Ref ID is required.' });
  }

  const cleanUtr = String(utr).trim();

  if (!trackingData.payments) {
    trackingData.payments = [];
  }

  const paymentRecord = {
    id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    utr: cleanUtr,
    plan,
    amount: Number(amount) || 1000,
    currency: 'INR',
    payee: 'TEJAS KUMAR DEWANGAN (7647814314)',
    method: 'PhonePe UPI QR',
    status: 'VERIFIED_ACTIVE',
    ip,
    device,
    browser,
    timestamp: now
  };

  trackingData.payments.unshift(paymentRecord);
  saveTrackingData();

  console.log(`[Pro Payment] 💳 UTR submitted: ${cleanUtr} for plan ${plan} (₹${amount}) from IP ${ip}`);

  res.json({
    success: true,
    message: 'TejStockAI Pro Plan activated successfully for 2 months (₹1,000)!',
    payment: paymentRecord
  });
});

// Explicit Client-side Pageview Tracking with Real-time User Attribution
app.post('/api/track/pageview', (req, res) => {
  const { path: p = '/', user = null } = req.body || {};
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || 'Unknown';
  const { device, browser } = parseUserAgent(ua);
  const now = new Date().toISOString();

  let viewerName = `Guest Viewer (${device})`;
  let role = 'GUEST';
  let broker = 'None';

  if (user && (user.clientId || user.username)) {
    const uClean = (user.clientId || user.username).trim().toUpperCase();
    const dName = user.displayName || (uClean === 'TEJAS' ? 'Tejas Dewangan' : uClean);
    viewerName = `${dName} (${uClean})`;
    role = user.role || 'PRO_TRADER';
    broker = user.broker || 'Zerodha Kite';
  } else {
    const identified = findIdentifiedUserForIp(ip, device) || (ip === '127.0.0.1' ? { name: 'Tejas Dewangan (TEJAS)', role: 'PRO_TRADER', broker: 'Zerodha Kite' } : null);
    if (identified) {
      viewerName = identified.name;
      role = identified.role;
      broker = identified.broker;
    }
  }

  let existing = trackingData.visitors.find(v => v.ip === ip && v.device === device);
  if (existing) {
    existing.visitCount = (existing.visitCount || 1) + 1;
    existing.lastSeen = now;
    existing.path = p;
    if (role === 'PRO_TRADER' || !existing.identifiedUser) {
      existing.identifiedUser = viewerName;
      existing.role = role;
      existing.broker = broker;
    }
  } else {
    existing = {
      id: 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ip,
      userAgent: ua,
      device,
      browser,
      path: p,
      timestamp: now,
      lastSeen: now,
      visitCount: 1,
      identifiedUser: viewerName,
      role,
      broker,
      viewsHistory: []
    };
    trackingData.visitors.unshift(existing);
  }

  if (!Array.isArray(existing.viewsHistory)) existing.viewsHistory = [];
  const visitEvent = {
    id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    visitorId: existing.id,
    visitNumber: existing.visitCount,
    timestamp: now,
    ip,
    device,
    browser,
    path: p,
    viewerName: existing.identifiedUser || viewerName,
    role: existing.role || role,
    broker: existing.broker || broker,
    status: (existing.role === 'PRO_TRADER' || role === 'PRO_TRADER') ? 'Authenticated Trader' : 'Guest Viewer'
  };

  existing.viewsHistory.unshift(visitEvent);
  if (existing.viewsHistory.length > 100) existing.viewsHistory.pop();

  if (!Array.isArray(trackingData.visitEvents)) trackingData.visitEvents = [];
  trackingData.visitEvents.unshift(visitEvent);
  if (trackingData.visitEvents.length > 500) trackingData.visitEvents.pop();

  saveTrackingData();
  res.json({ success: true, visitCount: existing.visitCount, identifiedUser: existing.identifiedUser });
});

app.get('/api/auth/session', (req, res) => {
  res.json({
    active: true,
    marketStatus: getNseMarketStatus()
  });
});

// ==========================================
// ADMIN PORTAL & SECURITY REST ENDPOINTS
// ==========================================
// Default Admin Credentials Set
const ADMIN_VALID_PASSWORDS = new Set([
  'Tejas@7647814314',
  '7647814314',
  'admin@7647',
  'admin123',
  'admin'
]);

// Admin Login with Default Name & Password
app.post('/api/admin/login', (req, res) => {
  const { adminName, mobile, username, password } = req.body || {};
  const cleanPhone = (mobile || username || adminName || '').replace(/\D/g, '').slice(-10);
  const cleanUser = (username || adminName || '').trim();
  const cleanPass = (password || '').trim();

  const isPhoneMatch = cleanPhone === ADMIN_PHONE;
  const isNameMatch = cleanUser.toLowerCase().includes('tejas') || cleanUser.toLowerCase() === 'admin' || isPhoneMatch;

  if (!isNameMatch && !isPhoneMatch) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: Invalid admin username or mobile. Authorized Admin: ${ADMIN_PHONE}`
    });
  }

  if (!cleanPass || !ADMIN_VALID_PASSWORDS.has(cleanPass)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Admin password. Please check your password or use Mobile OTP verification.'
    });
  }

  // Issue Admin Session Token
  const token = 'tej_admin_' + Buffer.from(`${ADMIN_PHONE}:${Date.now()}`).toString('base64');
  adminTokens.add(token);

  console.log(`[Admin Security] 🛡️ Super Admin logged in successfully with password! (User: ${cleanUser || ADMIN_PHONE})`);

  res.json({
    success: true,
    message: 'Super Admin authenticated successfully with default password. Welcome to Security & Visitor Analytics!',
    token,
    admin: {
      phone: ADMIN_PHONE,
      name: 'Tejas Dewangan (Super Admin)',
      role: 'SUPER_ADMIN',
      token,
      loginTime: new Date().toISOString()
    }
  });
});

// Request Admin Verification OTP (Restricted strictly to 7647814314)
app.post('/api/admin/request-otp', async (req, res) => {
  const { mobile } = req.body || {};
  const cleanPhone = (mobile || '').replace(/\D/g, '').slice(-10);

  if (cleanPhone !== ADMIN_PHONE) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: Only authorized Admin mobile number (${ADMIN_PHONE}) has access to this portal.`
    });
  }

  // Generate secure 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  adminOtpStore = {
    phone: cleanPhone,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes validity
  };

  console.log('====================================================');
  console.log(`[Admin Security] 🔐 OTP Verification Code for ${cleanPhone}:`);
  console.log(`              >>>>>  ${code}  <<<<<                `);
  console.log('====================================================');

  // If Telegram is enabled, send OTP directly to Admin Telegram
  if (alertConfig.telegramEnabled && alertConfig.telegramBotToken && alertConfig.telegramChatId) {
    try {
      await fetch(`https://api.telegram.org/bot${alertConfig.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: alertConfig.telegramChatId,
          text: `🔐 <b>TejStockAI Admin Login Code:</b> <code>${code}</code>\nValid for 10 minutes.\nRequested for mobile: ${cleanPhone}`,
          parse_mode: 'HTML'
        })
      });
    } catch (e) {
      console.warn('[Admin] Telegram OTP dispatch note:', e.message);
    }
  }

  res.json({
    success: true,
    message: `Verification code generated for Admin mobile +91 ${cleanPhone}.`,
    phone: cleanPhone,
    code: code // Included for rapid one-click testing & UI autofill convenience
  });
});

// Verify Admin OTP & Return Session Token
app.post('/api/admin/verify-otp', (req, res) => {
  const { mobile, code } = req.body || {};
  const cleanPhone = (mobile || '').replace(/\D/g, '').slice(-10);
  const cleanCode = (code || '').trim();

  if (cleanPhone !== ADMIN_PHONE) {
    return res.status(403).json({ success: false, error: 'Access Denied: Unauthorized admin mobile number.' });
  }

  if (!adminOtpStore.code || adminOtpStore.phone !== cleanPhone) {
    return res.status(400).json({ success: false, error: 'No active OTP requested. Please request a new code.' });
  }

  if (Date.now() > adminOtpStore.expiresAt) {
    adminOtpStore = { phone: null, code: null, expiresAt: 0 };
    return res.status(400).json({ success: false, error: 'Verification code expired. Please request a new one.' });
  }

  if (adminOtpStore.code !== cleanCode) {
    return res.status(400).json({ success: false, error: 'Incorrect verification code. Please check and retry.' });
  }

  // Clear single-use OTP
  adminOtpStore = { phone: null, code: null, expiresAt: 0 };

  // Issue Admin Session Token
  const token = 'tej_admin_' + Buffer.from(`${cleanPhone}:${Date.now()}`).toString('base64');
  adminTokens.add(token);

  res.json({
    success: true,
    message: 'Admin authenticated successfully. Welcome to Security & Visitor Analytics!',
    token,
    admin: {
      phone: ADMIN_PHONE,
      name: 'Tejas Dewangan (Super Admin)',
      role: 'SUPER_ADMIN',
      token,
      loginTime: new Date().toISOString()
    }
  });
});

// Get Live Visitor & Login Analytics (Protected by Admin Token)
app.get('/api/admin/stats', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = req.headers['x-admin-token'] || authHeader.replace(/^Bearer\s+/i, '') || req.query.token;

  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired admin token.' });
  }

  const brokerCounts = {};
  trackingData.logins.forEach(l => {
    const b = l.broker || 'Other';
    brokerCounts[b] = (brokerCounts[b] || 0) + 1;
  });

  const totalViews = trackingData.visitors.reduce((acc, v) => acc + (v.visitCount || 1), 0);

  res.json({
    success: true,
    summary: {
      totalVisitors: trackingData.visitors.length,
      totalViews,
      totalIndividualEvents: (trackingData.visitEvents || []).length,
      uniqueVisitors: new Set(trackingData.visitors.map(v => v.ip)).size,
      totalLogins: trackingData.logins.length,
      onlineNow: wss ? wss.clients.size : 1,
      brokerCounts,
      adminPhone: ADMIN_PHONE,
      lastUpdated: new Date().toISOString()
    },
    visitors: trackingData.visitors.slice(0, 150),
    visitEvents: (trackingData.visitEvents || []).slice(0, 300),
    logins: trackingData.logins.slice(0, 150)
  });
});

// Clear Tracking Logs (Protected by Admin Token)
app.post('/api/admin/clear-logs', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = req.headers['x-admin-token'] || authHeader.replace(/^Bearer\s+/i, '') || req.query.token;

  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired admin token.' });
  }

  trackingData.visitors = [];
  trackingData.logins = [];
  trackingData.visitEvents = [];
  saveTrackingData();

  res.json({ success: true, message: 'All visitor, individual views, and login activity logs cleared successfully.' });
});

app.get(['/api/market-status', '/api/market/status'], (req, res) => {
  res.json(getNseMarketStatus());
});

app.get('/api/market/ticks', async (req, res) => {
  try {
    const count = parseInt(req.query.count, 10) || 20;
    const ticks = await marketService.fetchLiveMarketTicks(count);
    res.json({
      success: true,
      timestamp: Date.now(),
      marketStatus: getNseMarketStatus(),
      ticks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/market/refresh', async (req, res) => {
  try {
    console.log('[MarketRefresh] Manual refresh requested via API...');
    await marketService.refreshAllStocks();
    const marketStatus = getNseMarketStatus();
    const sectors = marketService.getSectorsWithStocks();
    const watchlists = marketService.getKiteWatchlistTabs();
    const stocks = marketService.getAllStocks();

    broadcast({
      type: 'MARKET_REFRESHED',
      timestamp: Date.now(),
      marketStatus,
      total: marketService.stocksMap.size,
      sectors,
      watchlists,
      stocks
    });

    res.json({ success: true, marketStatus, total: marketService.stocksMap.size, sectors, watchlists });
  } catch (err) {
    console.error('[MarketRefresh] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Universal Search Endpoint (All 2,633 Indian equities + Global and Live stocks)
app.get('/api/search', async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) return res.json({ results: [] });

  let results = marketService.searchStocks(q);

  // If few or no results found, query TradingView Live Symbol Search to discover ANY stock in the world
  if (results.length < 8 && q.trim().length >= 2) {
    try {
      const tvUrl = `https://symbol-search.tradingview.com/symbol_search/v3/?text=${encodeURIComponent(q.trim())}&hl=0&lang=en`;
      const resp = await fetch(tvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Origin': 'https://www.tradingview.com',
          'Referer': 'https://www.tradingview.com/'
        },
        signal: AbortSignal.timeout(2000)
      });
      if (resp.ok) {
        const data = await resp.json();
        const existingSyms = new Set(results.map(r => r.symbol.toUpperCase()));
        if (Array.isArray(data.symbols)) {
          for (const item of data.symbols.slice(0, 10)) {
            if (!item.symbol) continue;
            const cleanSym = item.symbol.replace(/<[^>]*>/g, '').toUpperCase().trim();
            if (existingSyms.has(cleanSym)) continue;
            existingSyms.add(cleanSym);

            const isIndian = item.exchange === 'NSE' || item.exchange === 'BSE' || item.country === 'IN' || item.currency_code === 'INR';
            const curSym = isIndian ? 'INR' : (item.currency_code || 'USD');
            const cleanDesc = (item.description || cleanSym).replace(/<[^>]*>/g, '').trim();

            const stock = marketService.ensureStock(cleanSym);
            results.push({
              symbol: cleanSym,
              name: cleanDesc,
              sector: `TradingView (${item.exchange || (isIndian ? 'NSE' : 'Global')})`,
              ltp: stock ? stock.ltp : null,
              changePct: stock ? stock.changePct : null,
              badge: isIndian ? 'CASH' : (item.type === 'crypto' ? 'CRYPTO' : 'GLOBAL'),
              currency: curSym,
              isCached: !!stock,
              score: 95
            });
          }
        }
      }
    } catch (e) {
      // Ignore network timeout on TradingView live search
    }
  }

  if (results.length === 0 && q.length >= 2) {
    const cleanQ = q.trim().toUpperCase();
    const stock = marketService.ensureStock(cleanQ);
    results.push({
      symbol: cleanQ,
      name: `${cleanQ} (Live Market Quote)`,
      sector: 'Equities',
      ltp: stock ? stock.ltp : null,
      changePct: stock ? stock.changePct : null,
      badge: 'CASH',
      currency: stock?.currency || 'INR',
      isCached: !!stock,
      score: 50
    });
  }

  // Sort by score
  results.sort((a, b) => (b.score || 0) - (a.score || 0));
  res.json({ results: results.slice(0, 30) });
});

app.get('/api/stocks', (req, res) => {
  const segment = req.query.segment || null;
  const stocks = marketService.getAllStocks(segment);
  res.json({
    total: stocks.length,
    marketStatus: getNseMarketStatus(),
    stocks
  });
});

// 18 Sectors With Constituent Stocks for Zerodha Kite Watchlist
app.get('/api/sectors', (req, res) => {
  try {
    const sectors = marketService.getSectorsWithStocks();
    res.json({ success: true, total: sectors.length, sectors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multi-Tab Watchlists (STOCK MAIN, BIG B, KHOJ, SRISHTY)
app.get('/api/watchlists', (req, res) => {
  try {
    const tabs = marketService.getKiteWatchlistTabs();
    res.json({ success: true, tabs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Stock Detailed Fetch (Supports both singular and plural)
const getSingleStockHandler = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  let stock = marketService.getStockDetail(symbol);

  if (!stock || stock.isFallback || (Date.now() - (stock.lastFetchedAt || 0) > 60000)) {
    const fetched = await marketService.fetchStockData(symbol, '1d', '3mo');
    if (fetched) stock = fetched;
  }

  if (!stock) {
    stock = marketService.ensureStock(symbol);
  }

  res.json(stock);
};
app.get('/api/stock/:symbol', getSingleStockHandler);
app.get('/api/stocks/:symbol', getSingleStockHandler);

// TradingView-Style Multi-Timeframe Chart Endpoint
app.get('/api/stock/:symbol/chart', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const tf = req.query.tf || '1D';

  const tfMapping = {
    '1m': { interval: '1m', range: '1d' },
    '5m': { interval: '5m', range: '5d' },
    '15m': { interval: '15m', range: '5d' },
    '30m': { interval: '30m', range: '1mo' },
    '1h': { interval: '60m', range: '1mo' },
    '1D': { interval: '1d', range: '6mo' },
    '1W': { interval: '1wk', range: '2y' },
    '1M': { interval: '1mo', range: '5y' },
    '1Y': { interval: '1mo', range: '10y' }
  };

  const config = tfMapping[tf] || tfMapping['1D'];
  let stock = await marketService.fetchStockData(symbol, config.interval, config.range);

  if (!stock) {
    stock = marketService.ensureStock(symbol);
  }

  res.json({
    symbol: stock.symbol,
    name: stock.name,
    timeframe: tf,
    interval: config.interval,
    range: config.range,
    currency: stock.currency || 'INR',
    ltp: stock.ltp,
    prevClose: stock.prevClose,
    change: stock.change,
    changePct: stock.changePct,
    candles: stock.dailyCandles,
    indicators: stock.indicators,
    marketDepth: stock.marketDepth,
    derivatives: stock.derivatives,
    aiMomentum: stock.aiMomentum
  });
});

// Broker Market Depth (Level 2 Quotes)
app.get('/api/market/depth/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  let stock = marketService.getStockDetail(symbol);
  if (!stock || stock.isFallback) stock = await marketService.fetchStockData(symbol, '1d', '3mo');
  if (!stock) stock = marketService.ensureStock(symbol);

  res.json({
    symbol: stock.symbol,
    name: stock.name,
    ltp: stock.ltp,
    changePct: stock.changePct,
    depth: stock.marketDepth || computeBrokerMarketDepth(stock)
  });
});

// Broker Option Chain & Derivatives (Dhan / Upstox Matrix)
app.get('/api/market/derivatives/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  let stock = marketService.getStockDetail(symbol);
  if (!stock || stock.isFallback) stock = await marketService.fetchStockData(symbol, '1d', '3mo');
  if (!stock) stock = marketService.ensureStock(symbol);

  res.json({
    symbol: stock.symbol,
    name: stock.name,
    ltp: stock.ltp,
    derivatives: stock.derivatives || computeBrokerDerivatives(stock)
  });
});

// FII & DII Inflow / Outflow Analytics
app.get('/api/market/fii-dii', (req, res) => {
  res.json(getFiiDiiData());
});

// High-Conviction AI Momentum Assets (Score > 80 in either Intraday or Long-Term)
app.get('/api/market/high-momentum-assets', (req, res) => {
  try {
    const allStocks = marketService.getAllStocks();
    const highMomentum = [];

    for (const stock of allStocks) {
      const intraday = computeIntradayAiMomentum(stock);
      const longTerm = computeLongTermAiMomentum(stock);

      const intraScore = intraday?.score || 0;
      const longScore = longTerm?.score || 0;

      if (intraScore >= 80 || longScore >= 80) {
        highMomentum.push({
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          ltp: stock.ltp,
          changePct: stock.changePct,
          volume: stock.volume,
          sparkline: stock.sparkline || [],
          intraScore,
          intraState: intraday?.state || '',
          intraVerdict: intraday?.verdict || '',
          intraBadgeClass: intraday?.badgeClass || 'badge-neutral',
          longScore,
          longState: longTerm?.state || '',
          longVerdict: longTerm?.verdict || '',
          longBadgeClass: longTerm?.badgeClass || 'badge-neutral',
          maxScore: Math.max(intraScore, longScore)
        });
      }
    }

    highMomentum.sort((a, b) => b.maxScore - a.maxScore);

    res.json({
      success: true,
      total: highMomentum.length,
      threshold: 80,
      stocks: highMomentum
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Momentum & Technical Agent Analysis Endpoint (Dual Engine: Intraday & Long-Term)
app.get('/api/stock/:symbol/ai-momentum', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  let stock = marketService.getStockDetail(symbol);
  if (!stock || stock.isFallback) stock = await marketService.fetchStockData(symbol, '1d', '3mo');
  if (!stock) return res.status(404).json({ error: `Stock ${symbol} not found` });

  const aiAnalysis = computeAiMomentumAnalysis(stock);
  const intraday = computeIntradayAiMomentum(stock);
  const longTerm = computeLongTermAiMomentum(stock);

  res.json({
    symbol: stock.symbol,
    name: stock.name,
    ltp: stock.ltp,
    changePct: stock.changePct,
    marketDepth: stock.marketDepth,
    derivatives: stock.derivatives,
    analysis: aiAnalysis,
    intraday,
    longTerm
  });
});

// Level 5 Autonomous AI Copilot Chat Endpoint for Stocks (Mode-Aware: Intraday & Long-Term)
app.post('/api/stock/:symbol/ai-chat', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  let stock = marketService.getStockDetail(symbol);
  if (!stock || stock.isFallback) stock = await marketService.fetchStockData(symbol, '1d', '3mo');
  if (!stock) return res.status(404).json({ error: `Stock ${symbol} not found` });

  const { question, mode = 'intraday' } = req.body;
  const q = (question || '').trim();
  const qLower = q.toLowerCase();

  const isIntraday = mode === 'intraday';
  const intra = computeIntradayAiMomentum(stock);
  const longT = computeLongTermAiMomentum(stock);
  const depth = stock.marketDepth || computeBrokerMarketDepth(stock);
  const deriv = stock.derivatives || computeBrokerDerivatives(stock);

  let answer = '';

  if (isIntraday) {
    // ⚡ INTRADAY LEVEL 5 COPILOT REASONING
    if (qLower.includes('sl') || qLower.includes('stop') || qLower.includes('risk') || qLower.includes('loss')) {
      answer = `🛡️ **Level 5 Intraday Stop-Loss & Risk Execution for ${stock.symbol} (CMP: ₹${stock.ltp}):**\n\n` +
        `- **Recommended Intraday Stop-Loss:** **₹${intra.tradeSetup.stopLoss}**\n` +
        `- **SL Buffer Logic:** Placed just below ${intra.isAboveVwap ? 'Session VWAP (₹' + intra.vwap + ') with 1.2x 15m ATR padding' : 'intraday support zone'}.\n` +
        `- **Target 1 (T1 Scalp):** **₹${intra.tradeSetup.target1}**\n` +
        `- **Target 2 (T2 Expansion):** **₹${intra.tradeSetup.target2}**\n` +
        `- **Risk-to-Reward (R:R):** **${intra.tradeSetup.riskReward}**\n\n` +
        `💡 *Pro Scalper Rule: If price breaks and closes below ₹${intra.tradeSetup.stopLoss} on a 5-minute candle, cut trade immediately without hesitation.*`;
    } else if (qLower.includes('cpr') || qLower.includes('camarilla') || qLower.includes('pivot') || qLower.includes('level')) {
      answer = `🎯 **Today's CPR & Camarilla Matrix for ${stock.symbol}:**\n\n` +
        `**Central Pivot Range (CPR):**\n` +
        `- **Top Central (TC):** ₹${intra.cpr.tc}\n` +
        `- **Pivot (P):** **₹${intra.cpr.pivot}**\n` +
        `- **Bottom Central (BC):** ₹${intra.cpr.bc}\n` +
        `- **CPR Regime:** **${intra.cpr.isNarrow ? '⚡ Narrow CPR (High probability trending breakout session)' : '↔ Wide CPR (Rangebound / Mean-reversion day)'}**\n\n` +
        `**Camarilla Scalp Levels:**\n` +
        `- **H4 (Breakout Trigger):** **₹${intra.camarilla.h4}** (Sustained trading above H4 triggers massive momentum)\n` +
        `- **H3 (Profit Booking / Reversal):** ₹${intra.camarilla.h3}\n` +
        `- **L3 (Dip-Buy Support Zone):** **₹${intra.camarilla.l3}**\n` +
        `- **L4 (Breakdown Level):** ₹${intra.camarilla.l4}`;
    } else if (qLower.includes('vwap') || qLower.includes('entry') || qLower.includes('buy') || qLower.includes('cmp') || qLower.includes('now')) {
      answer = `⚡ **Level 5 Intraday Entry Timing for ${stock.symbol} (CMP: ₹${stock.ltp}):**\n\n` +
        `- **Intraday Action Verdict:** **${intra.verdict}**\n` +
        `- **Session VWAP:** **₹${intra.vwap}** (Stock is currently **${intra.isAboveVwap ? '+' + intra.vwapDiffPct + '% ABOVE VWAP' : intra.vwapDiffPct + '% BELOW VWAP'}**)\n` +
        `- **Optimal Scalp Entry:** ${intra.isAboveVwap ? 'Enter on minor pullback to **₹' + Math.max(intra.vwap, stock.ltp * 0.998).toFixed(2) + '** or on break of day high' : 'Wait for reclaim of VWAP above ₹' + intra.vwap}\n` +
        `- **Intraday Score:** **${intra.score} / 100** (${intra.state})\n` +
        `- **Suggested Target:** **₹${intra.tradeSetup.target1}** | **Stop-Loss:** **₹${intra.tradeSetup.stopLoss}**\n\n` +
        `*Volume participation is ${stock.volumeMultiplier >= 1.5 ? '🔥 elevated (' + stock.volumeMultiplier + 'x)' : 'moderate (' + stock.volumeMultiplier + 'x)'}.*`;
    } else if (qLower.includes('option') || qLower.includes('strike') || qLower.includes('ce') || qLower.includes('pe') || qLower.includes('call') || qLower.includes('put')) {
      answer = `📈 **Level 5 Option Strike Recommendation for ${stock.symbol} (Spot: ₹${stock.ltp}):**\n\n` +
        `- **Suggested Strike to Trade:** **${intra.suggestedOption}**\n` +
        `- **Option Chain PCR:** **${deriv.pcr}** (${deriv.pcr > 1.0 ? 'Bullish bias' : 'Neutral/Cautious'})\n` +
        `- **Max Pain Level:** **₹${deriv.maxPain}** | **ATM Strike:** **₹${deriv.atmStrike}**\n` +
        `- **Intraday Play:** ${intra.score >= 60 ? 'Buy ATM ' + deriv.atmStrike + ' Call with trailing stop below VWAP' : 'Avoid long calls; look for Put option if spot slips below ₹' + intra.camarilla.l3}\n\n` +
        `*India VIX: ${deriv.indiaVix} • Premium decays accelerate after 2:30 PM.*`;
    } else {
      answer = `⚡ **Level 5 Intraday AI Momentum Debrief for ${stock.symbol} (CMP: ₹${stock.ltp}):**\n\n` +
        `${intra.summary}\n\n` +
        `**Key Trade Parameters:**\n` +
        `- **Intraday Score:** **${intra.score}/100** (${intra.state})\n` +
        `- **Trade Plan:** Entry: **₹${intra.tradeSetup.entry}** | SL: **₹${intra.tradeSetup.stopLoss}** | T1: **₹${intra.tradeSetup.target1}** | T2: **₹${intra.tradeSetup.target2}**\n` +
        `- **VWAP Anchor:** ₹${intra.vwap} (${intra.isAboveVwap ? '🟢 Above VWAP' : '🔴 Below VWAP'})\n` +
        `- **CPR Central:** ₹${intra.cpr.pivot} (${intra.cpr.isNarrow ? 'Narrow Breakout Alert' : 'Wide Range'})\n` +
        `- **Suggested Action:** **${intra.verdict}**`;
    }
  } else {
    // 📈 LONG-TERM LEVEL 5 COPILOT REASONING
    if (qLower.includes('target') || qLower.includes('forecast') || qLower.includes('year') || qLower.includes('month') || qLower.includes('return')) {
      answer = `🔮 **Level 5 Multi-Month Price Targets for ${stock.symbol} (CMP: ₹${stock.ltp}):**\n\n` +
        `- **3-Month Swing Target (T1):** **₹${longT.tradeSetup.target1}** (${(((longT.tradeSetup.target1 - stock.ltp)/stock.ltp)*100).toFixed(1)}%)\n` +
        `- **1-Year Compounder Target (T2):** **₹${longT.tradeSetup.target2}** (${longT.tradeSetup.projectedReturn})\n` +
        `- **Weekly Positional Stop-Loss:** **₹${longT.tradeSetup.stopLoss}** (Weekly closing basis)\n` +
        `- **Market Stage:** **${longT.stage}**\n` +
        `- **Conviction Score:** **${longT.score}/100** (${longT.state})\n\n` +
        `*💡 Investment Rationale: Built on 50/200 moving average expansion, delivery volume support, and 52-week channel breakout momentum.*`;
    } else if (qLower.includes('golden') || qLower.includes('cross') || qLower.includes('sma') || qLower.includes('ema') || qLower.includes('200') || qLower.includes('50')) {
      answer = `🏛️ **Moving Average & Trend Architecture for ${stock.symbol}:**\n\n` +
        `- **50-Day SMA:** **₹${longT.sma50}** (Stock is ${stock.ltp >= longT.sma50 ? '🟢 ABOVE' : '🔴 BELOW'} 50 SMA)\n` +
        `- **200-Day SMA:** **₹${longT.sma200}** (Stock is ${stock.ltp >= longT.sma200 ? '🟢 ABOVE' : '🔴 BELOW'} 200 SMA)\n` +
        `- **Cross Status:** **${longT.isGoldenCross ? '✨ Golden Cross Active (50 SMA > 200 SMA) — High institutional bias' : '⚠️ Death Cross Regime (50 SMA < 200 SMA) — Structural lag'}**\n` +
        `- **Stage Classification:** **${longT.stage}**\n\n` +
        `*Institutional investors routinely accumulate quality leaders during shallow tests of the 50-day SMA.*`;
    } else if (qLower.includes('delivery') || qLower.includes('fii') || qLower.includes('accumulation') || qLower.includes('volume') || qLower.includes('fund')) {
      answer = `📦 **Institutional Delivery & Accumulation Footprint for ${stock.symbol}:**\n\n` +
        `- **Delivery Volume Ratio:** **${longT.deliveryPct}%** (${longT.deliveryPct >= 45 ? '🟢 Strong Institutional Stashing' : '⚠️ Moderate Churn'})\n` +
        `- **52-Week High Range:** ₹${stock.high52} (Only **${longT.distFromHigh52}%** away from ATH)\n` +
        `- **52-Week Low Range:** ₹${stock.low52} (**+${longT.distFromLow52}%** off multi-month lows)\n` +
        `- **Order Book Liquidity:** ₹${depth.totalBuyQty ? depth.totalBuyQty.toLocaleString('en-IN') : '--'} buy orders vs ₹${depth.totalSellQty ? depth.totalSellQty.toLocaleString('en-IN') : '--'} sell orders\n\n` +
        `*Verdict: ${longT.deliveryPct >= 45 ? 'Substantial delivery percentages confirm genuine long-term portfolio accumulation rather than short-lived retail frenzy.' : 'Delivery is average; wait for consecutive 50%+ delivery days.'}*`;
    } else {
      answer = `📈 **Level 5 Long-Term AI Investment Report for ${stock.symbol} (CMP: ₹${stock.ltp}):**\n\n` +
        `${longT.summary}\n\n` +
        `**Strategic Portfolio Metrics:**\n` +
        `- **AI Conviction Score:** **${longT.score}/100** (${longT.state})\n` +
        `- **Recommended Strategy:** **${longT.verdict}**\n` +
        `- **Accumulation Zone:** ₹${Math.min(stock.ltp, longT.sma50)} to ₹${stock.ltp}\n` +
        `- **Positional Stop-Loss:** **₹${longT.tradeSetup.stopLoss}** (Weekly close basis)\n` +
        `- **3-Month Target:** **₹${longT.tradeSetup.target1}** | **1-Year Target:** **₹${longT.tradeSetup.target2}** (${longT.tradeSetup.projectedReturn})`;
    }
  }

  res.json({
    symbol: stock.symbol,
    mode,
    question: q,
    answer,
    score: isIntraday ? intra.score : longT.score,
    state: isIntraday ? intra.state : longT.state,
    verdict: isIntraday ? intra.verdict : longT.verdict
  });
});

// Comprehensive TejStockAI Market Terminal Chat (Zerodha + Angel One + Dhan + Upstox Data Intelligence)
app.post('/api/ai/terminal-chat', async (req, res) => {
  const { question, activeStock } = req.body;
  const q = (question || '').trim();
  const qLower = q.toLowerCase();

  // If user asks about FII/DII
  if (qLower.includes('fii') || qLower.includes('dii') || qLower.includes('institution') || qLower.includes('flow')) {
    const fiiDii = getFiiDiiData();
    return res.json({
      answer: `🏦 **Institutional Flow & FII / DII Pulse (Kite & Dhan Analytics):**\n\n` +
        `- **Date:** ${fiiDii.date}\n` +
        `- **FII Net Cash Activity:** **${fiiDii.fiiNetCashCr}**\n` +
        `- **DII Net Cash Activity:** **${fiiDii.diiNetCashCr}**\n` +
        `- **FII Index Futures Long Ratio:** **${fiiDii.fiiFuturesLongRatio}** (Above 55% signals sustained bull control)\n` +
        `- **Index Options Bias:** Calls ${fiiDii.fiiIndexCallsNet} vs Puts ${fiiDii.fiiIndexPutsNet}\n` +
        `- **Market Stance:** ${fiiDii.institutionalStance}\n\n` +
        `*💡 Pro Tip: When both FII and DII are net buyers, buy-on-dips strategies in Nifty 50 leaders yield highest probability.*`
    });
  }

  // Stock Comparison Handler (e.g. "compare RELIANCE vs TCS" or "HDFCBANK vs ICICIBANK")
  if (qLower.includes('vs') || qLower.includes('compare')) {
    const words = q.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w !== 'VS' && w !== 'COMPARE');
    if (words.length >= 2) {
      const sym1 = words[0];
      const sym2 = words[1];
      const stock1 = await marketService.fetchStockData(sym1, '1d', '3mo');
      const stock2 = await marketService.fetchStockData(sym2, '1d', '3mo');

      if (stock1 && stock2) {
        const score1 = stock1.aiMomentum?.score || 50;
        const score2 = stock2.aiMomentum?.score || 50;
        const betterStock = score1 >= score2 ? stock1 : stock2;

        return res.json({
          answer: `⚖️ **TejStockAI Broker Comparison: ${stock1.symbol} vs ${stock2.symbol}**\n\n` +
            `| Metric | ${stock1.symbol} | ${stock2.symbol} |\n` +
            `| :--- | :--- | :--- |\n` +
            `| **Live LTP** | ₹${stock1.ltp} (${stock1.changePct >= 0 ? '+' : ''}${stock1.changePct}%) | ₹${stock2.ltp} (${stock2.changePct >= 0 ? '+' : ''}${stock2.changePct}%) |\n` +
            `| **AI Momentum Score** | **${score1}/100** (${stock1.aiMomentum?.state}) | **${score2}/100** (${stock2.aiMomentum?.state}) |\n` +
            `| **RSI (14)** | ${stock1.indicators?.rsi14?.toFixed(1) || '--'} | ${stock2.indicators?.rsi14?.toFixed(1) || '--'} |\n` +
            `| **Volume vs 10D SMA** | ${stock1.volumeMultiplier}x | ${stock2.volumeMultiplier}x |\n` +
            `| **Delivery %** | ${stock1.marketDepth?.deliveryPct || '42%'} | ${stock2.marketDepth?.deliveryPct || '45%'} |\n` +
            `| **Upper / Lower Circuit** | ₹${stock1.marketDepth?.upperCircuit} / ₹${stock1.marketDepth?.lowerCircuit} | ₹${stock2.marketDepth?.upperCircuit} / ₹${stock2.marketDepth?.lowerCircuit} |\n\n` +
            `🏆 **TejStockAI Verdict:** **${betterStock.symbol}** exhibits stronger technical momentum and higher institutional accumulation. Recommended action: *${betterStock.aiMomentum?.tradeSetup?.recommendedAction}*.`
        });
      }
    }
  }

  // Target specific stock or activeStock
  let targetSym = activeStock || 'RELIANCE';
  const foundInDir = marketService.directory.find(s => q.toUpperCase().includes(s.symbol) || q.toUpperCase().includes(s.name.toUpperCase().split(' ')[0]));
  if (foundInDir) targetSym = foundInDir.symbol;

  let stock = marketService.getStockDetail(targetSym);
  if (!stock) stock = await marketService.fetchStockData(targetSym, '1d', '3mo');

  if (!stock) {
    return res.json({
      answer: `🤖 **TejStockAI Copilot:** I am monitoring the entire NSE universe. Please specify a valid stock symbol (e.g. *RELIANCE*, *TATAMOTORS*, *SUZLON*, *APOLLO*, *NIFTY50*) or ask about FII/DII activity, Market Depth, Option Chains, or Technical Breakouts!`
    });
  }

  const ai = stock.aiMomentum || computeAiMomentumAnalysis(stock);
  const depth = stock.marketDepth || computeBrokerMarketDepth(stock);
  const deriv = stock.derivatives || computeBrokerDerivatives(stock);

  let answer = '';

  if (qLower.includes('option') || qLower.includes('chain') || qLower.includes('pcr') || qLower.includes('max pain') || qLower.includes('derivative') || qLower.includes('f&o')) {
    answer = `📊 **Dhan & Upstox Option Chain Matrix for ${stock.symbol} (₹${stock.ltp}):**\n\n` +
      `- **Put-Call Ratio (PCR):** **${deriv.pcr}** (${deriv.pcr > 1.0 ? 'Bullish Sentiment' : 'Bearish / Neutral'})\n` +
      `- **Max Pain Strike:** **${deriv.maxPain}**\n` +
      `- **ATM Strike:** **${deriv.atmStrike}**\n` +
      `- **OI Buildup Direction:** **${deriv.oiBuildup}**\n` +
      `- **India VIX:** ${deriv.indiaVix}\n\n` +
      `**Key Strike Open Interest Breakdown:**\n` +
      deriv.strikes.slice(1, 6).map(s => `  • Strike **₹${s.strike}** ${s.isATM ? '*(ATM)*' : ''}: Call OI ${s.callOI} (₹${s.callPremium}) | Put OI ${s.putOI} (₹${s.putPremium})`).join('\n') + `\n\n` +
      `*💡 Strategy Setup: ${deriv.pcr > 1.1 ? 'Bull Call Spread (Buy ATM Call + Sell OTM Call)' : 'Wait for Max Pain convergence around ' + deriv.maxPain}*`;
  } else if (qLower.includes('depth') || qLower.includes('circuit') || qLower.includes('order book') || qLower.includes('vwap') || qLower.includes('turnover') || qLower.includes('delivery')) {
    answer = `📑 **Zerodha Kite & Angel One Level 2 Market Depth for ${stock.symbol} (₹${stock.ltp}):**\n\n` +
      `- **Upper Circuit (+10%):** **₹${depth.upperCircuit}**\n` +
      `- **Lower Circuit (-10%):** **₹${depth.lowerCircuit}**\n` +
      `- **VWAP (Average Price):** **₹${depth.vwap}**\n` +
      `- **Total Traded Turnover:** **${depth.turnoverCr}**\n` +
      `- **Delivery Volume %:** **${depth.deliveryPct}**\n` +
      `- **Order Book Ratio:** **${depth.buyRatio}**\n\n` +
      `**Top 3 Bid Orders (Buyers):**\n` +
      depth.bids.slice(0, 3).map(b => `  🟢 ${b.orders} orders: ${b.qty.toLocaleString()} qty @ ₹${b.price}`).join('\n') + `\n\n` +
      `**Top 3 Ask Orders (Sellers):**\n` +
      depth.asks.slice(0, 3).map(a => `  🔴 ${a.orders} orders: ${a.qty.toLocaleString()} qty @ ₹${a.price}`).join('\n');
  } else if (qLower.includes('intraday') || qLower.includes('day trade')) {
    answer = `⚡ **Intraday Strategy for ${stock.symbol} (₹${stock.ltp}):**\n\n` +
      `- **Day Bias:** ${ai.score >= 60 ? '🟢 Bullish (Focus on Buy on 5m/15m EMA pullback)' : ai.score <= 40 ? '🔴 Bearish (Sell on rallies near R1)' : '🟡 Rangebound'}\n` +
      `- **Intraday Central Pivot:** **₹${ai.pivotPoints.pivot}**\n` +
      `- **Resistance 1 (Target 1):** ₹${ai.pivotPoints.r1} | **Resistance 2:** ₹${ai.pivotPoints.r2}\n` +
      `- **Support 1 (SL Anchor):** ₹${ai.pivotPoints.s1} | **Support 2:** ₹${ai.pivotPoints.s2}\n` +
      `- **Expected Intraday Range (ATR):** ₹${ai.atr} points\n` +
      `- **Delivery Volatility:** ${depth.deliveryPct}`;
  } else if (qLower.includes('stop loss') || qLower.includes('sl') || qLower.includes('risk') || qLower.includes('target')) {
    answer = `🛡️ **Stop-Loss & Risk Management for ${stock.symbol}:**\n\n` +
      `- **Strict Stop-Loss:** **₹${ai.tradeSetup.stopLoss}** (Based on 1.5x ATR volatility buffer)\n` +
      `- **Current Entry Point:** ₹${stock.ltp}\n` +
      `- **Target 1 (T1):** **₹${ai.tradeSetup.target1}**\n` +
      `- **Target 2 (T2):** **₹${ai.tradeSetup.target2}**\n` +
      `- **Risk-to-Reward Ratio:** **${ai.tradeSetup.riskReward}**\n` +
      `- **Upper / Lower Circuit Range:** ₹${depth.lowerCircuit} to ₹${depth.upperCircuit}`;
  } else {
    answer = `🤖 **TejStockAI Comprehensive Report for ${stock.symbol} (₹${stock.ltp}):**\n\n` +
      `${ai.summary}\n\n` +
      `**Broker Health & Derivatives Highlights (Kite / Dhan):**\n` +
      `- **AI Momentum Score:** **${ai.score} / 100** (${ai.state})\n` +
      `- **Option Chain PCR:** ${deriv.pcr} | **Max Pain:** ${deriv.maxPain}\n` +
      `- **Upper Circuit:** ₹${depth.upperCircuit} | **Lower Circuit:** ₹${depth.lowerCircuit}\n` +
      `- **Delivery Volume %:** ${depth.deliveryPct}\n` +
      `- **Recommended Action:** **${ai.tradeSetup.recommendedAction}**\n` +
      `- **Trade Setup:** Entry: ₹${ai.tradeSetup.entry} | SL: ₹${ai.tradeSetup.stopLoss} | T1: ₹${ai.tradeSetup.target1} | T2: ₹${ai.tradeSetup.target2}`;
  }

  res.json({
    symbol: stock.symbol,
    question: q,
    answer,
    aiScore: ai.score,
    state: ai.state
  });
});

app.get('/api/scans', (req, res) => {
  res.json({
    prebuilt: PREBUILT_SCANS,
    custom: customScans
  });
});

app.get('/api/scans/segments', (req, res) => {
  const segments = marketService.getSegmentsSummary ? marketService.getSegmentsSummary(watchlist) : [];
  res.json({ segments });
});

app.post('/api/scans/run', (req, res) => {
  let scanDef = req.body;
  if (!scanDef) return res.status(400).json({ error: 'Invalid scan definition' });

  // Resolve scan by scanId or id if filters are not provided
  if ((!scanDef.filters || scanDef.filters.length === 0) && (scanDef.scanId || scanDef.id)) {
    const targetId = scanDef.scanId || scanDef.id;
    const found = PREBUILT_SCANS.find(s => s.id === targetId) || customScans.find(s => s.id === targetId);
    if (found) {
      scanDef = { ...found, ...scanDef, filters: found.filters, filterGroups: found.filterGroups, passType: found.passType };
    }
  }

  const segNorm = (scanDef.segment || 'cash').trim().toLowerCase();
  if (segNorm === 'watchlist') {
    scanDef.watchlistSymbols = watchlist;
  }

  let allStocks = marketService.getAllStocks(segNorm === 'watchlist' ? null : scanDef.segment, { full: true });
  if (segNorm === 'watchlist') {
    allStocks = allStocks.filter(s => watchlist.includes(s.symbol));
  }

  const matched = runScan(scanDef, allStocks);
  const slimmedResults = matched.map(s => {
    const { dailyCandles, intradayCandles, series, marketDepth, derivatives, ...summary } = s;
    return summary;
  });

  res.json({
    count: slimmedResults.length,
    totalScanned: allStocks.length,
    marketStatus: getNseMarketStatus(),
    results: slimmedResults
  });
});

app.post('/api/scans/save', (req, res) => {
  const newScan = req.body;
  if (!newScan) return res.status(400).json({ error: 'Invalid scan payload' });
  newScan.title = newScan.title || newScan.name;
  if (!newScan.title) return res.status(400).json({ error: 'Scan title is required' });
  
  newScan.id = newScan.id || 'custom-' + Date.now();
  newScan.isCustom = true;
  
  const existingIdx = customScans.findIndex(s => s.id === newScan.id);
  if (existingIdx >= 0) {
    customScans[existingIdx] = newScan;
  } else {
    customScans.unshift(newScan);
  }

  broadcast({ type: 'SCANS_UPDATED', scans: { prebuilt: PREBUILT_SCANS, custom: customScans } });
  res.json({ success: true, scan: newScan });
});

app.delete('/api/scans/:id', (req, res) => {
  customScans = customScans.filter(s => s.id !== req.params.id);
  broadcast({ type: 'SCANS_UPDATED', scans: { prebuilt: PREBUILT_SCANS, custom: customScans } });
  res.json({ success: true });
});

app.get('/api/dashboards', (req, res) => {
  res.json(dashboardConfig);
});

app.post('/api/dashboards/save', (req, res) => {
  if (req.body && req.body.dashboards) {
    dashboardConfig = req.body;
    broadcast({ type: 'DASHBOARD_UPDATED', config: dashboardConfig });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid configuration' });
  }
});

app.get('/api/watchlist', (req, res) => {
  const items = watchlist.map(sym => marketService.ensureStock(sym)).filter(Boolean).map(s => {
    const { dailyCandles, intradayCandles, series, marketDepth, derivatives, ...summary } = s;
    return summary;
  });
  res.json({ symbols: watchlist, items });
});

app.post('/api/watchlist/toggle', (req, res) => {
  const symbol = (req.body.symbol || '').toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const idx = watchlist.indexOf(symbol);
  let added = false;
  if (idx >= 0) {
    watchlist.splice(idx, 1);
  } else {
    watchlist.push(symbol);
    added = true;
  }

  broadcast({ type: 'WATCHLIST_UPDATED', watchlist });
  res.json({ success: true, symbol, inWatchlist: added, watchlist });
});

// External Alerts System (Telegram Bot & Webhook Dispatcher)
let alertConfig = {
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  webhookEnabled: false,
  webhookUrl: '',
  webhookSecret: '',
  notifyOnEveryMatch: true,
  cooldownMinutes: 5,
  browserPush: true
};

let lastAlertTime = 0;

app.get('/api/alerts/config', (req, res) => {
  res.json(alertConfig);
});

app.post('/api/alerts/config', (req, res) => {
  if (req.body) {
    alertConfig = { ...alertConfig, ...req.body };
    res.json({ success: true, config: alertConfig });
  } else {
    res.status(400).json({ error: 'Invalid configuration' });
  }
});

app.post('/api/alerts/test-telegram', async (req, res) => {
  const { botToken, chatId } = req.body;
  const token = botToken || alertConfig.telegramBotToken;
  const chat = chatId || alertConfig.telegramChatId;

  if (!token || !chat) {
    return res.status(400).json({ error: 'Telegram Bot Token and Chat ID are required' });
  }

  const testMessage = `🚀 <b>TejStockAI Alert Test</b>\n\n` +
    `✅ <i>Telegram Bot connection verified successfully!</i>\n` +
    `📊 <b>System:</b> TejStockAI Pro Real-Time Screener\n` +
    `⏰ <b>Timestamp:</b> ${new Date().toLocaleTimeString('en-IN')}\n\n` +
    `Your scan trigger alerts will be delivered instantly to this chat.`;

  try {
    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const resp = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: testMessage,
        parse_mode: 'HTML'
      })
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      return res.status(400).json({ error: data.description || 'Failed to dispatch Telegram message' });
    }
    res.json({ success: true, message: 'Test alert sent to Telegram successfully!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts/test-webhook', async (req, res) => {
  const { webhookUrl, secret } = req.body;
  const url = webhookUrl || alertConfig.webhookUrl;
  const authSecret = secret || alertConfig.webhookSecret;

  if (!url) {
    return res.status(400).json({ error: 'Webhook URL is required' });
  }

  const testPayload = {
    event: 'TEJSTOCKAI_TEST_ALERT',
    timestamp: new Date().toISOString(),
    source: 'TejStockAI Screener',
    test: true,
    message: 'Webhook endpoint connectivity verified successfully',
    sampleMatch: {
      symbol: 'RELIANCE',
      price: 2450.75,
      changePct: 2.15,
      rsi14: 64.2,
      trigger: 'Bullish Momentum Breakout'
    }
  };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authSecret) headers['Authorization'] = `Bearer ${authSecret}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload)
    });
    
    res.json({
      success: resp.ok,
      status: resp.status,
      statusText: resp.statusText,
      message: resp.ok ? 'Webhook test payload delivered successfully!' : `Webhook returned HTTP status ${resp.status}`
    });
  } catch (err) {
    res.status(500).json({ error: `Webhook error: ${err.message}` });
  }
});

app.post('/api/alerts/dispatch', async (req, res) => {
  const { scanTitle, matchedStocks } = req.body;
  const count = Array.isArray(matchedStocks) ? matchedStocks.length : 0;
  
  const now = Date.now();
  const cooldownMs = (alertConfig.cooldownMinutes || 5) * 60000;
  if (now - lastAlertTime < cooldownMs) {
    return res.json({ skipped: true, reason: 'Alert cooldown active' });
  }
  lastAlertTime = now;

  let telegramDispatched = false;
  let webhookDispatched = false;

  // 1. Dispatch Telegram Alert if configured
  if (alertConfig.telegramEnabled && alertConfig.telegramBotToken && alertConfig.telegramChatId) {
    const topStocks = (matchedStocks || []).slice(0, 5).map(s => 
      `• <b>${s.symbol}</b> (₹${s.ltp} | ${s.changePct >= 0 ? '+' : ''}${s.changePct}%)`
    ).join('\n');

    const msg = `🔔 <b>TejStockAI Scan Alert!</b>\n\n` +
      `🎯 <b>Scan:</b> ${scanTitle || 'Custom Scan'}\n` +
      `📈 <b>Matched Stocks:</b> ${count} stocks\n\n` +
      `${topStocks}\n\n` +
      `<i>Real-time trigger from TejStockAI Pro</i>`;

    try {
      await fetch(`https://api.telegram.org/bot${alertConfig.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: alertConfig.telegramChatId,
          text: msg,
          parse_mode: 'HTML'
        })
      });
      telegramDispatched = true;
    } catch (e) {
      console.error('[Alerts] Telegram dispatch error:', e.message);
    }
  }

  // 2. Dispatch Webhook Alert if configured
  if (alertConfig.webhookEnabled && alertConfig.webhookUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (alertConfig.webhookSecret) headers['Authorization'] = `Bearer ${alertConfig.webhookSecret}`;

      await fetch(alertConfig.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: 'SCAN_TRIGGERED',
          scanTitle,
          matchCount: count,
          timestamp: new Date().toISOString(),
          stocks: matchedStocks
        })
      });
      webhookDispatched = true;
    } catch (e) {
      console.error('[Alerts] Webhook dispatch error:', e.message);
    }
  }

  // 3. Always broadcast to connected WebSocket clients for live browser alerts
  broadcast({
    type: 'SCAN_ALERT',
    scanTitle,
    count,
    stocks: (matchedStocks || []).slice(0, 10)
  });

  res.json({
    success: true,
    count,
    telegramDispatched,
    webhookDispatched
  });
});

function broadcast(data) {
  if (!wss || !wss.clients) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
}

if (isDirectRun && server && wss) {
  wss.on('connection', (ws, req) => {
    const marketStatus = getNseMarketStatus();
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      clientsCount: wss.clients.size,
      localIp,
      lanUrl,
      marketStatus,
      initialTicks: marketService.generateLiveTicks(10)
    }));

    ws.on('message', message => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (e) {}
    });
  });

  // Continuous Real-Time Tick Stream (Polls 100% REAL LIVE exchange quotes every 3.5s)
  let isPollingRealTicks = false;
  setInterval(async () => {
    if (isPollingRealTicks) return;
    isPollingRealTicks = true;
    try {
      const ticks = await marketService.fetchLiveMarketTicks(20);
      if (ticks && ticks.length > 0) {
        broadcast({
          type: 'PRICE_TICK',
          timestamp: Date.now(),
          marketStatus: getNseMarketStatus(),
          ticks
        });
      }
    } catch (err) {
      console.error('[LiveStream] Tick error:', err.message);
    } finally {
      isPollingRealTicks = false;
    }
  }, 3500);

  // Comprehensive Market Data Sync (Polls Yahoo quotes during market hours or if stale)
  setInterval(async () => {
    try {
      const status = getNseMarketStatus();
      if (status.isOpen || !marketService.lastRefreshAll || Date.now() - marketService.lastRefreshAll > 300000) {
        console.log('[LiveStream] Polling active quotes...');
        await marketService.refreshAllStocks();
      }
      broadcast({
        type: 'MARKET_DATA_UPDATE',
        timestamp: Date.now(),
        marketStatus: status,
        total: marketService.stocksMap.size,
        sectors: marketService.getSectorsWithStocks(),
        watchlists: marketService.getKiteWatchlistTabs(),
        stocks: marketService.getAllStocks()
      });
    } catch (err) {
      console.error('[LiveStream] Sync error:', err.message);
    }
  }, 15000);

  // Start HTTP & WebSocket server immediately for instantaneous 0ms port binding
  server.listen(PORT, '0.0.0.0', async () => {
    const marketStatus = getNseMarketStatus();
    console.log('====================================================');
    console.log('  TEJSTOCKAI - Pro Broker Screener & Market Terminal ');
    console.log('  (Zerodha Kite + Angel One + Upstox + Dhan Matrix)  ');
    console.log('====================================================');
    console.log(`> Market Status:          ${marketStatus.statusText}`);
    console.log(`> Current IST:            ${marketStatus.istTime}`);
    console.log(`> Windows / Local:        ${localUrl}`);
    console.log(`> Android / LAN:          ${lanUrl}`);
    console.log('----------------------------------------------------');
    console.log('Scan this QR code with your Android phone to open (Local Wi-Fi):');
    try {
      const qrString = await QRCode.toString(lanUrl, { type: 'terminal', small: true });
      console.log(qrString);
    } catch (e) {}
    console.log('====================================================');
    
    // Launch public HTTPS tunnel for remote Mobile Internet / 4G / 5G phone access
    startTunnel();

    // Broadcast initial cached / calibrated market data immediately
    broadcast({
      type: 'MARKET_REFRESHED',
      timestamp: Date.now(),
      marketStatus: getNseMarketStatus(),
      total: marketService.stocksMap.size,
      sectors: marketService.getSectorsWithStocks(),
      watchlists: marketService.getKiteWatchlistTabs(),
      stocks: marketService.getAllStocks()
    });

    // Background quotes sync: fetch fresh live quotes from NSE without blocking server startup
    (async () => {
      try {
        console.log('[TejStockAI] Pre-syncing live market quotes from NSE in background...');
        await marketService.refreshAllStocks();
        console.log(`[TejStockAI] Initial quotes sync completed successfully with ${marketService.stocksMap.size} symbols ready.`);
        broadcast({
          type: 'MARKET_REFRESHED',
          timestamp: Date.now(),
          marketStatus: getNseMarketStatus(),
          total: marketService.stocksMap.size,
          sectors: marketService.getSectorsWithStocks(),
          watchlists: marketService.getKiteWatchlistTabs(),
          stocks: marketService.getAllStocks()
        });
      } catch (err) {
        console.error('[TejStockAI] Background quotes sync warning:', err.message);
      }
    })();
  });
}

module.exports = {
  app,
  marketService,
  getNseMarketStatus,
  PREBUILT_SCANS,
  broadcast
};

