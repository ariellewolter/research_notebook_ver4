#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing File Associations for Research Notebook...\n');

// Test file associations based on platform
const platform = process.platform;

if (platform === 'win32') {
    console.log('📋 Testing Windows File Associations...');
    
    // Check if .pdf extension is registered
    exec('reg query "HKEY_CLASSES_ROOT\\.pdf"', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ .pdf extension not found in registry');
        } else {
            console.log('✅ .pdf extension found in registry');
            console.log(stdout);
        }
    });
    
    // Check if our app is registered as PDF handler
    exec('reg query "HKEY_CLASSES_ROOT\\ResearchNotebook.PDF"', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ ResearchNotebook.PDF handler not found in registry');
        } else {
            console.log('✅ ResearchNotebook.PDF handler found in registry');
            console.log(stdout);
        }
    });
    
} else if (platform === 'darwin') {
    console.log('🍎 Testing macOS File Associations...');
    
    // Check if app is registered for PDF files
    exec('defaults read com.researchnotebook.app CFBundleDocumentTypes', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ App not registered for document types');
        } else {
            console.log('✅ App registered for document types');
            console.log(stdout);
        }
    });
    
    // Check if app can handle PDF files
    exec('lsregister -dump | grep -A 5 -B 5 "com.researchnotebook"', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ App not found in Launch Services database');
        } else {
            console.log('✅ App found in Launch Services database');
            console.log(stdout);
        }
    });
    
} else if (platform === 'linux') {
    console.log('🐧 Testing Linux File Associations...');
    
    // Check if .desktop file exists
    const desktopFile = path.join(process.env.HOME, '.local/share/applications/research-notebook.desktop');
    if (fs.existsSync(desktopFile)) {
        console.log('✅ Desktop file found');
        console.log(fs.readFileSync(desktopFile, 'utf8'));
    } else {
        console.log('❌ Desktop file not found');
    }
    
    // Check MIME associations
    exec('xdg-mime query default application/pdf', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ No default PDF handler set');
        } else {
            console.log('✅ Default PDF handler:', stdout.trim());
        }
    });
}

console.log('\n📝 File Association Test Complete!');
console.log('💡 To test manually:');
console.log('   - Double-click a PDF file');
console.log('   - Right-click a PDF and select "Open with Research Notebook"');
console.log('   - Drag and drop a PDF onto the app icon'); 