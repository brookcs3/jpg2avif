#!/bin/bash

# This script prepares JPGFlip for manual upload to Cloudflare Pages
# It builds the app and creates a zip file ready for upload

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Preparing JPGFlip for Cloudflare Pages manual upload...${NC}"

# Save current directory
CURRENT_DIR=$(pwd)

# Change to the jpgflip directory
cd "$CURRENT_DIR/jpgflip-full" || { echo -e "${RED}Failed to enter jpgflip-full directory${NC}"; exit 1; }

# Build the application
echo -e "${BLUE}Building JPGFlip...${NC}"
npm run build || { echo -e "${RED}Build failed${NC}"; exit 1; }

# Create a zip file of the dist/public directory
echo -e "${BLUE}Creating zip file for upload...${NC}"
cd dist || { echo -e "${RED}Failed to enter dist directory${NC}"; exit 1; }
zip -r "$CURRENT_DIR/jpgflip-cloudflare-deploy.zip" public || { echo -e "${RED}Failed to create zip file${NC}"; exit 1; }

# Return to the original directory
cd "$CURRENT_DIR"

echo -e "${GREEN}JPGFlip preparation complete!${NC}"
echo -e "${GREEN}Upload the file 'jpgflip-cloudflare-deploy.zip' to Cloudflare Pages manually.${NC}"
echo -e "${BLUE}Instructions:${NC}"
echo -e "1. Go to Cloudflare Pages dashboard"
echo -e "2. Select your JPGFlip project"
echo -e "3. Click 'Create new deployment'"
echo -e "4. Upload the 'jpgflip-cloudflare-deploy.zip' file"
echo -e "5. IMPORTANT: Check 'Deploy to production' option to deploy to your main domain"
echo -e "   Otherwise, it will be deployed as a preview on a temporary URL"
echo -e "6. Wait for deployment to complete"