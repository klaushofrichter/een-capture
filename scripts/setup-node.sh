#!/bin/bash

# setup-node.sh - Helper script to set up the correct Node.js version

echo "🔧 Setting up Node.js environment..."

# Check if nvm is available
if ! command -v nvm &> /dev/null; then
    # Try to source nvm from common locations
    if [ -f ~/.nvm/nvm.sh ]; then
        echo "📦 Loading nvm from ~/.nvm/nvm.sh"
        source ~/.nvm/nvm.sh
    elif [ -f ~/.bashrc ] && grep -q "nvm" ~/.bashrc; then
        echo "📦 Loading nvm from ~/.bashrc"
        source ~/.bashrc
    elif [ -f ~/.zshrc ] && grep -q "nvm" ~/.zshrc; then
        echo "📦 Loading nvm from ~/.zshrc"
        source ~/.zshrc
    else
        echo "❌ nvm not found. Please install nvm first:"
        echo "   https://github.com/nvm-sh/nvm#installing-and-updating"
        exit 1
    fi
fi

# Check if nvm is now available
if ! command -v nvm &> /dev/null; then
    echo "❌ nvm still not available after trying to source it"
    echo "   Please install nvm or manually install Node.js 20.19.0+"
    exit 1
fi

echo "✅ nvm is available"

# Check if .nvmrc exists
if [ ! -f .nvmrc ]; then
    echo "❌ .nvmrc file not found in current directory"
    echo "   Make sure you're in the project root directory"
    exit 1
fi

REQUIRED_VERSION=$(cat .nvmrc)
echo "📋 Required Node version: $REQUIRED_VERSION"

# Check if the required version is installed
if ! nvm list | grep -q "$REQUIRED_VERSION"; then
    echo "📥 Installing Node.js $REQUIRED_VERSION..."
    nvm install "$REQUIRED_VERSION"
fi

# Use the required version
echo "🔄 Switching to Node.js $REQUIRED_VERSION..."
nvm use

# Verify the version
CURRENT_VERSION=$(node --version)
echo "✅ Current Node version: $CURRENT_VERSION"

# Run the version check script to confirm everything is good
echo "🔍 Running version compatibility check..."
npm run check-node

echo ""
echo "🎉 Node.js environment setup complete!"
echo "💡 To use this version in new terminal sessions, run: nvm use" 