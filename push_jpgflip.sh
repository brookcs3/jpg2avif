#!/bin/bash

# This script prepares and pushes JPGFlip to GitHub
# It builds the app with the JPGFlip configuration and pushes to the jpgflip repository

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting JPGFlip deployment process...${NC}"

# Check if GitHub token exists
if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${RED}Error: GITHUB_TOKEN is not set. Please set it first.${NC}"
  exit 1
fi

# Save current directory
CURRENT_DIR=$(pwd)

# Change to the jpgflip directory
cd "$CURRENT_DIR/jpgflip-full" || { echo -e "${RED}Failed to enter jpgflip-full directory${NC}"; exit 1; }

# Build the application
echo -e "${BLUE}Building JPGFlip...${NC}"
npm run build || { echo -e "${RED}Build failed${NC}"; exit 1; }

# Initialize git repository if it doesn't exist
if [ ! -d .git ]; then
  echo -e "${BLUE}Initializing git repository...${NC}"
  git init
  git config user.name "JPGFlip Deployment"
  git config user.email "deploy@jpgflip.com"
fi

# Add all files
echo -e "${BLUE}Adding files to git...${NC}"
git add .

# Commit changes
echo -e "${BLUE}Committing changes...${NC}"
git commit -m "JPGFlip deployment $(date +%Y-%m-%d_%H-%M-%S)"

# Check if remote exists, if not add it
if ! git remote | grep -q origin; then
  echo -e "${BLUE}Adding remote repository...${NC}"
  git remote add origin https://github.com/brookcs3/jpgflip.git
fi

# Push to GitHub using token authentication
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push -f "https://x-access-token:$GITHUB_TOKEN@github.com/brookcs3/jpgflip.git" main

# Return to the original directory
cd "$CURRENT_DIR"

echo -e "${GREEN}JPGFlip deployment complete!${NC}"