# TabVault Electron Desktop App Setup

This guide explains how to build and run TabVault as a standalone desktop application.

## Prerequisites

1. Node.js 18+ installed
2. Desktop icons (PNG/ICO files) in the `public/` directory:
   - `logo.png` (512x512) - Main app icon
   - `icon.png` (256x256) - Tray icon
   - `logo.ico` (256x256) - Windows installer icon
   - `logo.icns` (512x512) - macOS app icon

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Create and seed the database:
   ```bash
   npm run db:seed
   ```

## Development

Run the app in development mode with hot reload:

```bash
npm run dev:electron
```

This command:
- Starts Next.js dev server on `http://localhost:3000`
- Launches Electron window pointing to the dev server
- Opens DevTools automatically for debugging

## Building Executables

### Windows

Build Windows installer and portable EXE:
```bash
npm run build:electron:win
```

Output will be in `dist/`:
- `TabVault-x.x.x.exe` - NSIS Installer
- `TabVault-x.x.x-portable.exe` - Portable executable

### macOS

Build macOS DMG and ZIP:
```bash
npm run build:electron:mac
```

### Linux

Build AppImage and DEB:
```bash
npm run build:electron:linux
```

### All Platforms

Build for all platforms:
```bash
npm run build:electron
```

## Features Included

✅ **System Tray Integration** - Minimize to tray, notification center  
✅ **Auto-Updates** - Electron-updater configured (requires GitHub releases)  
✅ **Native OS Integration** - File explorer, notifications, context menus  
✅ **Multi-Window Support** - Preferences and settings in separate windows  
✅ **Database Management** - SQLite database persists in AppData  

## Database Location

The SQLite database is stored in:
- **Windows**: `C:\Users\{username}\AppData\Roaming\TabVault\`
- **macOS**: `~/Library/Application Support/TabVault/`
- **Linux**: `~/.config/TabVault/`

## Configuration

Key files:
- `electron/main.ts` - Main Electron process
- `electron/preload.ts` - IPC bridge for secure communication
- `electron-builder.yml` - Build configuration
- `next.config.js` - Next.js config (output: standalone)

## Debugging

### View Logs
```bash
# Check Electron main process logs
npm run dev:electron

# View app data folder
npm run open-devtools
```

### Troubleshooting

**Port 3000 already in use:**
```bash
npx kill-port 3000
npm run dev:electron
```

**Database not found:**
```bash
npm run db:reset
npm run db:seed
```

**Build fails on Windows:**
- Ensure you have Visual Studio Build Tools installed
- Run `npm install --global windows-build-tools`

## Icon Requirements

Create icons using tools like:
- [IconConverter](https://icoconvert.com/)
- [ImageMagick](https://imagemagick.org/)
- [GIMP](https://www.gimp.org/)

From a 512x512 PNG:

**PNG**:
```bash
# Already have PNG, just rename
cp logo.png public/logo.png
```

**ICO** (Windows):
```bash
# Using ImageMagick
convert logo.png -define icon:auto-resize=256,128,96,64,48,32,16 public/logo.ico
```

**ICNS** (macOS):
```bash
# Using ImageMagick
convert logo.png -define icon:auto-resize=1024,512,256,128,64,32,16 public/logo.icns
```

## Distribution

### Windows Installer

The NSIS installer includes:
- Auto-install to Program Files
- Start menu shortcuts
- Desktop shortcut
- Add/Remove Programs entry
- Auto-update checking

### Auto-Updates

To enable auto-updates:

1. Push app releases to GitHub: `owner/tabvault`
2. Update `electron-builder.yml` with your GitHub username
3. Create GitHub releases with the built artifacts
4. Each new release is automatically detected and installed

## Support

For issues:
1. Check `electron-builder.yml` configuration
2. Review Electron security best practices
3. Check [Electron documentation](https://www.electronjs.org/docs)
4. Review [electron-builder guide](https://www.electron.build/)
