#!/bin/bash

echo "🚀 Starting deployment process..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy frontend to Netlify
echo "🌐 Deploying frontend to Netlify..."
cd frontend
netlify deploy --prod --dir=dist
cd ..

# Backend deployment (git-based to Render)
echo "🔧 Preparing backend for Render deployment..."
git add .
git commit -m "Deploy: $(date)"
git push origin main

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set environment variables in Render dashboard"
echo "   2. Update VITE_API_URL in frontend if backend URL changed"
echo "   3. Run database migrations on Render"
