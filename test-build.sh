#!/bin/bash

echo "🧪 SmashBoard Build Test"
echo "======================="

# Test Next.js build
echo "📦 Testing Next.js build..."
if [ -f "out/index.html" ]; then
    echo "✅ Next.js static export found"
    echo "   Size: $(ls -lah out/index.html | awk '{print $5}')"
else
    echo "❌ Next.js static export missing"
    exit 1
fi

# Test Electron build
echo "⚡ Testing Electron build..."
if [ -f "dist/electron/main.js" ]; then
    echo "✅ Electron main.js found"
else
    echo "❌ Electron main.js missing"
    exit 1
fi

# Test macOS app bundle (if exists)
if [ -d "release/mac-arm64/SmashBoard.app" ]; then
    echo "🍎 Testing macOS app bundle..."
    
    # Check if index.html is in the bundle
    if [ -f "release/mac-arm64/SmashBoard.app/Contents/Resources/app/out/index.html" ]; then
        echo "✅ Next.js files included in app bundle"
    else
        echo "❌ Next.js files missing from app bundle"
        exit 1
    fi
    
    # Check if Electron main.js is in the bundle
    if [ -f "release/mac-arm64/SmashBoard.app/Contents/Resources/app/dist/electron/main.js" ]; then
        echo "✅ Electron files included in app bundle"
    else
        echo "❌ Electron files missing from app bundle"
        exit 1
    fi
    
    # Check if SQLite native module is included
    if [ -f "release/mac-arm64/SmashBoard.app/Contents/Resources/app/node_modules/better-sqlite3/build/Release/better_sqlite3.node" ]; then
        echo "✅ SQLite native module included"
    else
        echo "⚠️  SQLite native module may be missing"
    fi
else
    echo "⚠️  macOS app bundle not found (run npm run dist:mac first)"
fi

echo ""
echo "🎉 Build test complete!"
echo ""
echo "To test the app:"
echo "1. Install the DMG: release/SmashBoard-0.1.0-arm64.dmg"
echo "2. Launch SmashBoard from Applications"
echo "3. Check console logs if you encounter issues"