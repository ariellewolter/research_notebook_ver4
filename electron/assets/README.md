# App Icon Assets

This directory contains the app icon assets for the Research Notebook application.

## Files

### Source
- `icon.svg` - Source SVG file for the app icon (design reference)

### PNG Files (Multiple Sizes)
- `icon-16x16.png` - 16x16 pixels
- `icon-32x32.png` - 32x32 pixels
- `icon-64x64.png` - 64x64 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-256x256.png` - 256x256 pixels
- `icon-512x512.png` - 512x512 pixels

### Platform-Specific Icons
- `icon.icns` - macOS application icon (simplified)
- `icon.ico` - Windows application icon (simplified)
- `favicon.ico` - Web favicon

### Web App
- `manifest.json` - Web app manifest file

## Usage

### Electron App
The icons are automatically used by electron-builder when building the application.

### Web App
Place the PNG files in your web app's public directory and reference them in your HTML.

## Generation

To regenerate all icons, run:
```bash
node generate-icons-sharp.js
```

## Requirements

- Node.js with Sharp library
- For proper ICNS generation: macOS with iconutil
- For proper ICO generation: ImageMagick

## Icon Design

The icon features:
- Professional blue background (#1976d2)
- Clean, modern design
- Research notebook representation
- Scientific symbols
- Suitable for research applications

## Notes

- PNG files are generated using Sharp library
- ICNS and ICO files are simplified copies of PNG files
- For production use, consider using proper icon generation tools:
  - macOS: iconutil for ICNS
  - Windows: ImageMagick for ICO
