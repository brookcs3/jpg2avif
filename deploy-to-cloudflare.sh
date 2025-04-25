#!/bin/bash

# This script helps with manual deployment to Cloudflare Pages

echo "Starting Cloudflare Pages deployment for AVIFlip..."

# Make sure we have the Cloudflare Pages CLI
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler CLI for Cloudflare deployment..."
    npm install -g wrangler
fi

# Build the project if not already built
if [ ! -d "dist/public" ]; then
    echo "Building project..."
    npm run build
fi

# Add CNAME for custom domain
echo "aviflip.com" > dist/public/CNAME

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
cd dist/public
wrangler pages publish . --project-name=aviflip --production

echo "Deployment complete! Check the Cloudflare dashboard for details."