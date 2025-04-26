#!/bin/bash

# This script will push the current codebase to GitHub with force option
# Only run this if you're sure you want to overwrite the remote repository

echo "Pushing optimized code to GitHub repository..."
git push -f origin main

echo "Push completed! Check your GitHub repository to confirm the changes."