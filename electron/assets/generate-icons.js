#!/usr/bin/env node

/**
 * Icon Generation Script for Research Notebook App
 * Generates PNG, ICNS, and ICO files from SVG source
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon sizes required for different platforms
const ICON_SIZES = {
    png: [16, 32, 64, 128, 256, 512],
    icns: [16, 32, 64, 128, 256, 512, 1024], // macOS
    ico: [16, 32, 48, 64, 128, 256] // Windows
};

// Check if required tools are available
function checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    try {
        // Check if ImageMagick is available
        execSync('convert --version', { stdio: 'ignore' });
        console.log('✅ ImageMagick found');
    } catch (error) {
        console.log('❌ ImageMagick not found. Please install ImageMagick:');
        console.log('   macOS: brew install imagemagick');
        console.log('   Ubuntu: sudo apt-get install imagemagick');
        console.log('   Windows: Download from https://imagemagick.org/');
        process.exit(1);
    }
    
    try {
        // Check if iconutil is available (macOS)
        execSync('iconutil --help', { stdio: 'ignore' });
        console.log('✅ iconutil found (macOS)');
    } catch (error) {
        console.log('⚠️  iconutil not found (not on macOS or not available)');
    }
}

// Generate PNG files
function generatePNGFiles() {
    console.log('\n🖼️  Generating PNG files...');
    
    const svgPath = path.join(__dirname, 'icon.svg');
    
    ICON_SIZES.png.forEach(size => {
        const outputPath = path.join(__dirname, `icon-${size}x${size}.png`);
        
        try {
            execSync(`convert -background transparent -size ${size}x${size} ${svgPath} ${outputPath}`, {
                stdio: 'ignore'
            });
            console.log(`✅ Generated icon-${size}x${size}.png`);
        } catch (error) {
            console.log(`❌ Failed to generate icon-${size}x${size}.png`);
        }
    });
}

// Generate ICNS file for macOS
function generateICNSFile() {
    console.log('\n🍎 Generating ICNS file for macOS...');
    
    const iconsetDir = path.join(__dirname, 'icon.iconset');
    
    // Create iconset directory
    if (!fs.existsSync(iconsetDir)) {
        fs.mkdirSync(iconsetDir);
    }
    
    // Copy PNG files to iconset with correct naming
    const iconNames = [
        { size: 16, name: 'icon_16x16.png' },
        { size: 32, name: 'icon_16x16@2x.png' },
        { size: 32, name: 'icon_32x32.png' },
        { size: 64, name: 'icon_32x32@2x.png' },
        { size: 128, name: 'icon_128x128.png' },
        { size: 256, name: 'icon_128x128@2x.png' },
        { size: 256, name: 'icon_256x256.png' },
        { size: 512, name: 'icon_256x256@2x.png' },
        { size: 512, name: 'icon_512x512.png' },
        { size: 1024, name: 'icon_512x512@2x.png' }
    ];
    
    iconNames.forEach(({ size, name }) => {
        const sourcePath = path.join(__dirname, `icon-${size}x${size}.png`);
        const destPath = path.join(iconsetDir, name);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`✅ Copied ${name}`);
        } else {
            console.log(`⚠️  Source file not found: icon-${size}x${size}.png`);
        }
    });
    
    // Generate ICNS file
    try {
        execSync(`iconutil -c icns ${iconsetDir}`, {
            cwd: __dirname,
            stdio: 'ignore'
        });
        console.log('✅ Generated icon.icns');
        
        // Clean up iconset directory
        fs.rmSync(iconsetDir, { recursive: true, force: true });
        console.log('✅ Cleaned up iconset directory');
    } catch (error) {
        console.log('❌ Failed to generate ICNS file');
        console.log('   This might be because iconutil is not available');
        console.log('   ICNS generation skipped');
    }
}

// Generate ICO file for Windows
function generateICOFile() {
    console.log('\n🪟 Generating ICO file for Windows...');
    
    const pngFiles = ICON_SIZES.ico.map(size => 
        path.join(__dirname, `icon-${size}x${size}.png`)
    ).filter(file => fs.existsSync(file));
    
    if (pngFiles.length === 0) {
        console.log('❌ No PNG files found for ICO generation');
        return;
    }
    
    try {
        const outputPath = path.join(__dirname, 'icon.ico');
        const inputFiles = pngFiles.join(' ');
        
        execSync(`convert ${inputFiles} ${outputPath}`, {
            stdio: 'ignore'
        });
        console.log('✅ Generated icon.ico');
    } catch (error) {
        console.log('❌ Failed to generate ICO file');
    }
}

// Create a simple favicon
function generateFavicon() {
    console.log('\n🌐 Generating favicon...');
    
    const svgPath = path.join(__dirname, 'icon.svg');
    const faviconPath = path.join(__dirname, 'favicon.ico');
    
    try {
        execSync(`convert -background transparent -size 32x32 ${svgPath} ${faviconPath}`, {
            stdio: 'ignore'
        });
        console.log('✅ Generated favicon.ico');
    } catch (error) {
        console.log('❌ Failed to generate favicon');
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
- \`icon.svg\` - Source SVG file for the app icon

### PNG Files (Multiple Sizes)
- \`icon-16x16.png\` - 16x16 pixels
- \`icon-32x32.png\` - 32x32 pixels
- \`icon-64x64.png\` - 64x64 pixels
- \`icon-128x128.png\` - 128x128 pixels
- \`icon-256x256.png\` - 256x256 pixels
- \`icon-512x512.png\` - 512x512 pixels

### Platform-Specific Icons
- \`icon.icns\` - macOS application icon
- \`icon.ico\` - Windows application icon
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
node generate-icons.js
\`\`\`

## Requirements

- ImageMagick (for PNG generation)
- iconutil (macOS, for ICNS generation)

## Icon Design

The icon features:
- A research notebook with lined paper
- Scientific symbols (microscope, test tube)
- Data visualization elements
- Professional blue gradient background
- Clean, modern design suitable for research applications
`;

    const readmePath = path.join(__dirname, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.log('✅ Generated README.md');
}

// Main function
function main() {
    console.log('🎨 Research Notebook App Icon Generator');
    console.log('=====================================\n');
    
    checkDependencies();
    generatePNGFiles();
    generateICNSFile();
    generateICOFile();
    generateFavicon();
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
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generatePNGFiles,
    generateICNSFile,
    generateICOFile,
    generateFavicon,
    generateManifest,
    generateREADME
}; 