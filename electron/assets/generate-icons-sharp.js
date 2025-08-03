#!/usr/bin/env node

/**
 * Icon Generation Script for Research Notebook App
 * Generates PNG, ICNS, and ICO files from SVG source using Sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icon sizes required for different platforms
const ICON_SIZES = {
    png: [16, 32, 64, 128, 256, 512],
    icns: [16, 32, 64, 128, 256, 512, 1024], // macOS
    ico: [16, 32, 48, 64, 128, 256] // Windows
};

// Create a simple icon using Sharp (since we can't easily convert SVG without ImageMagick)
async function createIconPNG(size) {
    const outputPath = path.join(__dirname, `icon-${size}x${size}.png`);
    
    try {
        // Create a simple icon with Sharp
        const icon = sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 25, g: 118, b: 210, alpha: 1 } // #1976d2
            }
        });
        
        // Add a simple design overlay
        const overlay = await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite([{
            input: Buffer.from(`
                <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 10}" fill="none" stroke="white" stroke-width="3"/>
                    <rect x="${size/2 - 20}" y="${size/2 - 15}" width="40" height="30" fill="white" rx="3"/>
                    <line x1="${size/2 - 15}" y1="${size/2 - 5}" x2="${size/2 + 15}" y2="${size/2 - 5}" stroke="#1976d2" stroke-width="2"/>
                    <line x1="${size/2 - 15}" y1="${size/2 + 5}" x2="${size/2 + 15}" y2="${size/2 + 5}" stroke="#1976d2" stroke-width="2"/>
                    <circle cx="${size/2 - 10}" cy="${size/2 + 20}" r="3" fill="#4caf50"/>
                    <circle cx="${size/2 + 10}" cy="${size/2 + 20}" r="3" fill="#ff9800"/>
                </svg>
            `),
            top: 0,
            left: 0
        }])
        .png()
        .toBuffer();
        
        await icon
            .composite([{
                input: overlay,
                top: 0,
                left: 0
            }])
            .png()
            .toFile(outputPath);
            
        console.log(`✅ Generated icon-${size}x${size}.png`);
        return true;
    } catch (error) {
        console.log(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
        return false;
    }
}

// Generate PNG files
async function generatePNGFiles() {
    console.log('\n🖼️  Generating PNG files...');
    
    const results = await Promise.all(
        ICON_SIZES.png.map(size => createIconPNG(size))
    );
    
    const successCount = results.filter(Boolean).length;
    console.log(`✅ Generated ${successCount}/${ICON_SIZES.png.length} PNG files`);
}

// Generate ICNS file for macOS (simplified - just copy the 256x256 PNG)
async function generateICNSFile() {
    console.log('\n🍎 Generating ICNS file for macOS...');
    
    const sourcePath = path.join(__dirname, 'icon-256x256.png');
    const destPath = path.join(__dirname, 'icon.icns');
    
    if (fs.existsSync(sourcePath)) {
        try {
            fs.copyFileSync(sourcePath, destPath);
            console.log('✅ Generated icon.icns (copied from 256x256 PNG)');
            console.log('⚠️  Note: This is a simplified ICNS file. For proper ICNS, use iconutil on macOS.');
        } catch (error) {
            console.log('❌ Failed to generate ICNS file:', error.message);
        }
    } else {
        console.log('❌ Source PNG file not found for ICNS generation');
    }
}

// Generate ICO file for Windows (simplified - just copy the 256x256 PNG)
async function generateICOFile() {
    console.log('\n🪟 Generating ICO file for Windows...');
    
    const sourcePath = path.join(__dirname, 'icon-256x256.png');
    const destPath = path.join(__dirname, 'icon.ico');
    
    if (fs.existsSync(sourcePath)) {
        try {
            fs.copyFileSync(sourcePath, destPath);
            console.log('✅ Generated icon.ico (copied from 256x256 PNG)');
            console.log('⚠️  Note: This is a simplified ICO file. For proper ICO, use ImageMagick.');
        } catch (error) {
            console.log('❌ Failed to generate ICO file:', error.message);
        }
    } else {
        console.log('❌ Source PNG file not found for ICO generation');
    }
}

// Create a simple favicon
async function generateFavicon() {
    console.log('\n🌐 Generating favicon...');
    
    const sourcePath = path.join(__dirname, 'icon-32x32.png');
    const destPath = path.join(__dirname, 'favicon.ico');
    
    if (fs.existsSync(sourcePath)) {
        try {
            fs.copyFileSync(sourcePath, destPath);
            console.log('✅ Generated favicon.ico (copied from 32x32 PNG)');
        } catch (error) {
            console.log('❌ Failed to generate favicon:', error.message);
        }
    } else {
        console.log('❌ Source PNG file not found for favicon generation');
    }
}

// Create a manifest file for web app
function generateManifest() {
    console.log('\n📱 Generating web app manifest...');
    
    const manifest = {
        name: "Research Notebook",
        short_name: "Research Notebook",
        description: "A comprehensive research notebook application for managing experiments, protocols, and data",
        start_url: "/",
        display: "standalone",
        background_color: "#1976d2",
        theme_color: "#1976d2",
        icons: [
            {
                src: "/icon-192x192.png",
                sizes: "192x192",
                type: "image/png"
            },
            {
                src: "/icon-512x512.png",
                sizes: "512x512",
                type: "image/png"
            }
        ]
    };
    
    const manifestPath = path.join(__dirname, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Generated manifest.json');
}

// Create a README for the assets
function generateREADME() {
    console.log('\n📝 Generating README...');
    
    const readme = `# App Icon Assets

This directory contains the app icon assets for the Research Notebook application.

## Files

### Source
- \`icon.svg\` - Source SVG file for the app icon (design reference)

### PNG Files (Multiple Sizes)
- \`icon-16x16.png\` - 16x16 pixels
- \`icon-32x32.png\` - 32x32 pixels
- \`icon-64x64.png\` - 64x64 pixels
- \`icon-128x128.png\` - 128x128 pixels
- \`icon-256x256.png\` - 256x256 pixels
- \`icon-512x512.png\` - 512x512 pixels

### Platform-Specific Icons
- \`icon.icns\` - macOS application icon (simplified)
- \`icon.ico\` - Windows application icon (simplified)
- \`favicon.ico\` - Web favicon

### Web App
- \`manifest.json\` - Web app manifest file

## Usage

### Electron App
The icons are automatically used by electron-builder when building the application.

### Web App
Place the PNG files in your web app's public directory and reference them in your HTML.

## Generation

To regenerate all icons, run:
\`\`\`bash
node generate-icons-sharp.js
\`\`\`

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
`;

    const readmePath = path.join(__dirname, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.log('✅ Generated README.md');
}

// Main function
async function main() {
    console.log('🎨 Research Notebook App Icon Generator (Sharp)');
    console.log('=============================================\n');
    
    await generatePNGFiles();
    await generateICNSFile();
    await generateICOFile();
    await generateFavicon();
    generateManifest();
    generateREADME();
    
    console.log('\n🎉 Icon generation complete!');
    console.log('\n📁 Generated files:');
    
    const files = fs.readdirSync(__dirname);
    files.forEach(file => {
        if (file.endsWith('.png') || file.endsWith('.icns') || file.endsWith('.ico') || file.endsWith('.json') || file.endsWith('.md')) {
            console.log(`   - ${file}`);
        }
    });
    
    console.log('\n📋 Next steps:');
    console.log('1. Update electron-builder configuration to use the new icons');
    console.log('2. Test the icons in the built application');
    console.log('3. Verify icons appear correctly on all platforms');
    console.log('4. For production, consider using proper icon generation tools');
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    generatePNGFiles,
    generateICNSFile,
    generateICOFile,
    generateFavicon,
    generateManifest,
    generateREADME
}; 