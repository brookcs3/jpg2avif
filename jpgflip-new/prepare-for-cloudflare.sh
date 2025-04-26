#!/bin/bash

# This script prepares files for manual upload to Cloudflare Pages dashboard

echo "Preparing files for manual Cloudflare Pages upload..."

# Make sure the project is built
if [ ! -d "dist/public" ]; then
    echo "Building project..."
    npm run build
fi

# Create a clean directory for Cloudflare upload
rm -rf cloudflare-upload/*
mkdir -p cloudflare-upload

# Copy all built files to the upload directory
echo "Copying files to cloudflare-upload directory..."
cp -r dist/public/* cloudflare-upload/

# Add CNAME for custom domain
echo "aviflip.com" > cloudflare-upload/CNAME

echo "Files ready for upload!"
echo ""
echo "To manually deploy to Cloudflare Pages:"
echo "1. Go to Cloudflare Dashboard → Workers & Pages"
echo "2. Choose your AVIFlip project"
echo "3. Click 'Create new deployment' or similar"
echo "4. Upload the contents of the 'cloudflare-upload' directory"
echo "5. IMPORTANT: Be sure to check 'Deploy to production' option to deploy to your main domain"
echo "   Otherwise, it will be deployed as a preview on a temporary URL"
echo ""
echo "The cloudflare-upload directory contains all necessary files for deployment."