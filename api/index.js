const { app } = require('../server');

module.exports = (req, res) => {
  // Normalize req.url to ensure it begins with /api for Express routing
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/css') && !req.url.startsWith('/js')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
