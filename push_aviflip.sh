#!/bin/bash

# This script deploys the current codebase to aviflip.com via GitHub Pages

echo "Starting deployment of AVIFlip to aviflip.com..."

# Remove gh-pages branch if it exists
git branch -D gh-pages 2>/dev/null || true

# Create a new gh-pages branch without history
git checkout --orphan gh-pages

# Build the project for production
echo "Building project for production..."
NODE_ENV=production npm run build

# Copy the build files to the root for GitHub Pages
echo "Setting up files for GitHub Pages..."
cp -r dist/public/* .

# Create a CNAME file for aviflip.com
echo "Creating CNAME file for aviflip.com..."
echo "aviflip.com" > CNAME

# Clean up unnecessary files from gh-pages branch
find . -maxdepth 1 ! -name 'assets' ! -name 'index.html' ! -name 'CNAME' ! -name '.git' -exec rm -rf {} \; 2>/dev/null || true

# Add all files to git
echo "Committing changes to gh-pages branch..."
git add .
git commit -m "Deploy AVIFlip - optimized AVIF to JPG converter"

# Push to GitHub
echo "Pushing to GitHub Pages..."
git push origin gh-pages --force

# Back to main branch
git checkout main

echo "Successfully deployed AVIFlip to aviflip.com!"
echo "Note: It may take a few minutes for GitHub Pages to update."
echo "Make sure to enable GitHub Pages in your repository settings, using the gh-pages branch as source."