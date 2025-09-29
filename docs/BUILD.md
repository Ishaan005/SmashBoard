# Building SmashBoard

## Prerequisites

- Node.js 20 or later
- Python 3.11+ (for native dependencies)
- Git

### Platform-specific requirements:

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

**Windows:**
- Visual Studio Build Tools or Visual Studio with C++ workload
- Windows SDK

## Development Build

```bash
# Clone the repository
git clone <repository-url>
cd smashboard

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Production Build

### Local Build (Current Platform)

```bash
# Build for current platform
./build-local.sh

# Or manually:
npm run build
npm run dist
```

### Cross-Platform Build

```bash
# Build for all platforms (requires appropriate OS)
npm run dist:all

# Build for specific platforms
npm run dist:mac    # macOS DMG and ZIP
npm run dist:win    # Windows NSIS installer and portable
npm run dist:linux  # Linux AppImage and DEB
```

## Build Outputs

### macOS
- `SmashBoard-{version}.dmg` - DMG installer
- `SmashBoard-{version}-mac.zip` - ZIP archive
- Supports both Intel (x64) and Apple Silicon (arm64)

### Windows  
- `SmashBoard Setup {version}.exe` - NSIS installer
- `SmashBoard {version}.exe` - Portable executable
- Supports both x64 and x86 architectures

### Linux
- `SmashBoard-{version}.AppImage` - AppImage
- `smashboard_{version}_amd64.deb` - Debian package

## GitHub Actions

The repository includes automated builds via GitHub Actions:

- **Trigger**: Push to `main` branch
- **Platforms**: macOS and Windows
- **Artifacts**: DMG, EXE installers, and ZIP archives
- **Releases**: Automatic GitHub releases with binaries

### SQLite Integration

The build process includes:
- Native SQLite binaries for each platform
- Automatic rebuilding of `better-sqlite3` for target platforms
- Database file handling across different OS environments

## Troubleshooting

### White Screen Issue
If the built app shows a white screen:
1. Check that Next.js static export is working: `ls -la out/index.html`
2. Ensure Electron is looking for the correct path in main.ts
3. Verify both `dist/` and `out/` directories are included in the build

### Native Dependencies
If builds fail due to native dependencies:
```bash
npm run rebuild
```

### Apple Silicon (ARM64) Issues
On Apple Silicon Macs, you may encounter Sharp architecture issues:
```bash
# The postinstall script handles this automatically
mkdir -p node_modules/@img/sharp-darwin-x64
```

### Clean Build
```bash
rm -rf node_modules release dist out
npm install
```

### Build Logs
Enable verbose logging:
```bash
DEBUG=electron-builder npm run dist
```