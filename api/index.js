let app;

try {
  const server = require('../server');
  app = server.app;
} catch (err) {
  console.error('[Vercel Serverless Init Error]:', err);
}

module.exports = (req, res) => {
  try {
    // Provide safe socket / connection fallbacks for serverless environments
    if (!req.socket) {
      req.socket = {
        remoteAddress: (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']))?.split(',')[0]?.trim() || '127.0.0.1',
        encrypted: true
      };
    }
    if (!req.connection) {
      req.connection = req.socket;
    }

    if (!app) {
      const server = require('../server');
      app = server.app;
    }

    if (!app) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Express app initialization failed' }));
    }

    // Normalize req.url to ensure it begins with /api for Express routing when rewritten by Vercel
    if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/css') && !req.url.startsWith('/js') && !req.url.startsWith('/icons') && !req.url.startsWith('/public')) {
      if (req.url === '/' || req.url === '') {
        // Leave root as /
      } else {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
      }
    }

    return app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Invocation Error]:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Serverless invocation error', message: err.message }));
    }
  }
};
