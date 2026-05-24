const serverless = require('serverless-http');
const app = require('../../src/server/app');
module.exports.handler = serverless(app);
