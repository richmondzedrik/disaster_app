const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const app = require('../../../backend/app');

// Configure CORS for serverless function
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Remove static file serving
const staticFileMiddlewareIndex = app._router.stack.findIndex(layer => 
  layer.name === 'serveStatic'
);
if (staticFileMiddlewareIndex !== -1) {
  app._router.stack.splice(staticFileMiddlewareIndex, 1);
}

module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
  basePath: '/.netlify/functions/api'
});