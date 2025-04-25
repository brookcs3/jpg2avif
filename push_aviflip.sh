#!/bin/bash

# This script deploys the current codebase to aviflip.com via GitHub Pages

echo "Starting deployment of AVIFlip to aviflip.com..."

# Build the project for production
echo "Building project for production..."
NODE_ENV=production npm run build

# Create a CNAME file for aviflip.com
echo "Creating CNAME file for aviflip.com..."
echo "aviflip.com" > dist/public/CNAME

# Setup git worktree for gh-pages branch
echo "Setting up GitHub Pages deployment..."
git worktree add -f dist/public gh-pages 2>/dev/null || git branch gh-pages && git worktree add -f dist/public gh-pages

# Navigate to the build directory
cd dist/public

# Add all files to git
echo "Committing changes to gh-pages branch..."
git add --all
git commit -m "Deploy AVIFlip - optimized AVIF to JPG converter"

# Push to GitHub
echo "Pushing to GitHub Pages..."
git push origin gh-pages --force

# Back to original directory
cd ../..

# Clean up
git worktree remove dist/public

echo "Successfully deployed AVIFlip to aviflip.com!"
echo "Note: It may take a few minutes for GitHub Pages to update."
echo "Make sure to enable GitHub Pages in your repository settings, using the gh-pages branch as source."