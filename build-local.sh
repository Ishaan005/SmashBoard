#!/bin/bash

# Local build script for testing
echo "🚀 Building SmashBoard for distribution..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf release/
rm -rf dist/
rm -rf out/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Rebuild native dependencies
echo "🔨 Rebuilding native dependencies..."
npm run rebuild

# Run tests
echo "🧪 Running tests..."
npm test || echo "⚠️  Tests failed, continuing build..."

# Build Next.js
echo "⚛️  Building Next.js app..."
npm run build:next

# Build Electron backend
echo "⚡ Building Electron backend..."
npm run build:electron

# Build for current platform
echo "🏗️  Building Electron app for current platform..."
npm run dist

echo "✅ Build complete! Check the release/ directory for output files."
echo "📁 Build artifacts:"
ls -la release/ 2>/dev/null || echo "No release directory found"