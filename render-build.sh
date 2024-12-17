#!/bin/bash
# Install dependencies in the frontend directory
cd frontend
npm install
# Install vite globally
npm install -g vite
# Run the build
npm run build