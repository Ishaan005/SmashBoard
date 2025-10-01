# SmashBoard Installation Guide

## Download the Right Version

### Windows
- **SmashBoard Setup 0.1.0.exe** - Works on all Windows machines (both 32-bit and 64-bit)

### macOS
- **SmashBoard-0.1.0.dmg** - For Intel-based Macs (older MacBooks from 2020 and earlier)
- **SmashBoard-0.1.0-arm64.dmg** - For Apple Silicon Macs (M1, M2, M3 chips - 2020 and newer)

Not sure which Mac you have? Go to Apple Menu > About This Mac:
- If you see "Intel" in the processor name → use SmashBoard-0.1.0.dmg
- If you see "Apple M1", "Apple M2", or "Apple M3" → use SmashBoard-0.1.0-arm64.dmg

## Windows Security Warning

When running on Windows, you may encounter a Windows Defender SmartScreen warning saying "Windows protected your PC". This is normal for unsigned applications. To run the app:

1. Click "More info" on the warning dialog
2. Click "Run anyway"

This happens because the app isn't digitally signed with a paid code signing certificate. The app is safe to run.

## macOS Security Warning

On macOS, you might see a warning that the app "cannot be opened because the developer cannot be verified". To run the app:

1. Right-click (or Control+click) on the SmashBoard app
2. Select "Open" from the context menu
3. Click "Open" in the dialog that appears

Alternatively, you can go to System Preferences > Security & Privacy > General, and click "Open Anyway" if you see a message about SmashBoard being blocked.

## Troubleshooting

### Windows: "Unable to find smashboard.exe"
This error typically occurs when:
- You're trying to run an ARM64 build on an x64 machine
- The download was corrupted

**Solution**: Re-download the latest SmashBoard Setup 0.1.0.exe from the releases page.

### macOS: "App is not compatible with this Mac"
This error occurs when:
- You downloaded the ARM64 version but have an Intel Mac (or vice versa)

**Solution**: Download the correct version for your Mac architecture (see guide above).

### Database Issues
If you encounter database-related errors:
1. Quit the application completely
2. Delete the SmashBoard data folder:
   - **Windows**: `%APPDATA%/SmashBoard`
   - **macOS**: `~/Library/Application Support/SmashBoard`
3. Restart the application (it will recreate the database)

## Features
- Player management with ELO ratings
- Singles and doubles match tracking
- Court allocation and management
- Leaderboards and statistics
- Automatic ELO calculation
- Match history and analytics

## Support
If you encounter any issues, please check the troubleshooting section above or create an issue on the GitHub repository.