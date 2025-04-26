#!/bin/bash

# This script runs the JPGFlip version for testing
echo "Starting JPGFlip server..."
cd jpgflip-full
NODE_ENV=development tsx server/index.ts

# Note: Access the site with ?site=jpgflip in the URL to force JPGFlip mode