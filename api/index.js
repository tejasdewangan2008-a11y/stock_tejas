let app;

try {
  const server = require('../server');
  app = server.app;
} catch (err) {
  console.error('[Vercel Serverless Init Error]:', err);
}

module.exports = (req, res) => {
  try {
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
