const serverless = require('serverless-http');
const { app } = require('../../server');

// Wrap Express app with serverless-http for Netlify Functions (AWS Lambda)
const serverlessHandler = serverless(app);

exports.handler = async (event, context) => {
  // Prevent Lambda from freezing or waiting for lingering event loop tasks
  context.callbackWaitsForEmptyEventLoop = false;
  return await serverlessHandler(event, context);
};
