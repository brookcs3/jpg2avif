#!/bin/bash

# This script deploys the current codebase to aviflip.com via GitHub Pages

echo "Starting deployment of AVIFlip to aviflip.com..."

# Create a temporary directory for aviflip
mkdir -p /tmp/aviflip-pages

# Remove existing directory to avoid conflicts
rm -rf /tmp/aviflip-pages/*

# Build the project for production
echo "Building project for production..."
NODE_ENV=production npm run build

# Copy the build output to the temporary directory
echo "Copying build files..."
cp -r dist/* /tmp/aviflip-pages/

# Ensure CNAME file exists in the root
echo "Setting up CNAME for aviflip.com..."
echo "aviflip.com" > /tmp/aviflip-pages/CNAME

# Get current directory
CURRENT_DIR=$(pwd)

# Initialize git repository
cd /tmp/aviflip-pages
echo "Initializing Git repository for GitHub Pages..."
git init --initial-branch=main
git add .
git config --local user.email "brooksc3@oregonstate.edu"
git config --local user.name "brookcs3"
git commit -m "Deploy AVIFlip - optimized AVIF to JPG converter"

# Make sure there's no existing origin
git remote remove origin 2>/dev/null || true

# Add the correct remote and push
echo "Pushing to GitHub Pages repository..."
git remote add origin https://x-access-token:${GITHUB_TOKEN}@github.com/brookcs3/aviflip.com.git
git push -u origin main --force

# Go back to original directory
cd $CURRENT_DIR

echo "Successfully deployed AVIFlip to aviflip.com!"
echo "Note: It may take a few minutes for GitHub Pages to update."