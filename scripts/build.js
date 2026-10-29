const fs = require('fs');
const path = require('path');

try {
  if (fs.existsSync('public/index.html')) {
    fs.copyFileSync('public/index.html', 'index.html');
  }
  if (fs.existsSync('public/manifest.json')) {
    fs.copyFileSync('public/manifest.json', 'manifest.json');
  }
  if (fs.existsSync('public/sw.js')) {
    fs.copyFileSync('public/sw.js', 'sw.js');
  }
  if (fs.existsSync('public/icons/icon-192.png')) {
    fs.copyFileSync('public/icons/icon-192.png', 'favicon.ico');
    fs.copyFileSync('public/icons/icon-192.png', 'public/favicon.ico');
  }
  console.log('[Build] Assets synchronized for Vercel CDN deployment');
} catch (e) {
  console.warn('[Build Warning]:', e.message);
}
