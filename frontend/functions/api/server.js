const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const app = require('../../../backend/app');

// Configure CORS for serverless function
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Remove static file serving
const staticFileMiddlewareIndex = app._router.stack.findIndex(layer => 
  layer.name === 'serveStatic'
);
if (staticFileMiddlewareIndex !== -1) {
  app._router.stack.splice(staticFileMiddlewareIndex, 1);
}

// Export the handler
module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
  basePath: '/.netlify/functions/api'
});