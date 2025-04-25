#!/bin/bash

# This script pushes the optimized AVIFlip codebase to GitHub
# which is then automatically deployed by Cloudflare Pages

echo "Pushing optimized AVIFlip code to GitHub repository..."

# Make sure all changes are committed
git add .
git commit -m "Update AVIFlip - optimized performance and UI" || true

# Push to GitHub main branch
echo "Pushing to GitHub main branch..."
git push origin main

echo "Successfully pushed AVIFlip code to GitHub!"
echo "Cloudflare Pages will automatically deploy the changes to aviflip.com"
echo "Note: It may take a few minutes for the deployment to complete."