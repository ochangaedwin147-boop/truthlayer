#!/bin/bash

# TruthLayer - GitHub Upload Script
# Run these commands in your terminal to upload to GitHub

echo "🚀 Uploading TruthLayer to GitHub..."

# Navigate to project directory (if needed)
# cd /home/z/my-project

# Add GitHub remote
git remote add origin https://github.com/ochangaedwin147-boop/truthlayer.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main

echo "✅ Done! Check your repository at:"
echo "https://github.com/ochangaedwin147-boop/truthlayer"
