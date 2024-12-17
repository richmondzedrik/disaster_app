import express from 'express';
import serverless from 'serverless-http';
import app from '../../backend/app';

// Initialize express app
const api = express();

// Mount your existing Express app
api.use('/', app);

// Export the serverless handler
export const handler = serverless(api);