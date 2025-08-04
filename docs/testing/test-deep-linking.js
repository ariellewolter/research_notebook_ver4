#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🔗 Testing Deep Linking for Research Notebook...\n');

// Test deep links
const testDeepLinks = [
    'researchnotebook://note/123',
    'researchnotebook://project/456?view=overview&tab=details',
    'researchnotebook://pdf/document.pdf?page=5&zoom=1.5',
    'researchnotebook://protocol/789?step=3&mode=edit',
    'researchnotebook://recipe/101?step=1&mode=view',
    'researchnotebook://task/202?mode=edit',
    'researchnotebook://search?q=research&type=notes',
    'researchnotebook://dashboard?view=projects&filters=active'
];

console.log('📋 Test Deep Links:');
testDeepLinks.forEach((link, index) => {
    console.log(`${index + 1}. ${link}`);
});

console.log('\n🧪 Testing Deep Link Parsing...\n');

// Test URL parsing
function testUrlParsing(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        const entityType = pathParts[0];
        const entityId = pathParts[1];
        const queryParams = Object.fromEntries(urlObj.searchParams.entries());
        
        console.log(`✅ Parsed: ${url}`);
        console.log(`   Entity Type: ${entityType}`);
        console.log(`   Entity ID: ${entityId}`);
        console.log(`   Query Params:`, queryParams);
        console.log('');
        
        return true;
    } catch (error) {
        console.log(`❌ Failed to parse: ${url}`);
        console.log(`   Error: ${error.message}`);
        console.log('');
        return false;
    }
}

// Test all deep links
testDeepLinks.forEach(testUrlParsing);

console.log('🔧 Testing Platform-Specific Deep Link Registration...\n');

const platform = process.platform;

if (platform === 'win32') {
    console.log('📋 Testing Windows Deep Link Registration...');
    
    // Check if protocol is registered
    exec('reg query "HKEY_CLASSES_ROOT\\researchnotebook"', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ Research Notebook protocol not found in registry');
        } else {
            console.log('✅ Research Notebook protocol found in registry');
            console.log(stdout);
        }
    });
    
} else if (platform === 'darwin') {
    console.log('🍎 Testing macOS Deep Link Registration...');
    
    // Check if URL scheme is registered in app bundle
    exec('defaults read com.researchnotebook.app CFBundleURLTypes', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ URL types not registered in app bundle');
        } else {
            console.log('✅ URL types registered in app bundle');
            console.log(stdout);
        }
    });
    
    // Test opening a deep link
    console.log('\n🧪 Testing Deep Link Opening (macOS)...');
    exec('open "researchnotebook://note/123"', (error, stdout, stderr) => {
        if (error) {
            console.log('❌ Failed to open deep link:', error.message);
        } else {
            console.log('✅ Deep link opened successfully');
        }
    });
    
} else if (platform === 'linux') {
    console.log('🐧 Testing Linux Deep Link Registration...');
    
    // Check if .desktop file has URL scheme support
    const desktopFile = path.join(process.env.HOME, '.local/share/applications/research-notebook.desktop');
    const fs = require('fs');
    
    if (fs.existsSync(desktopFile)) {
        const content = fs.readFileSync(desktopFile, 'utf8');
        if (content.includes('researchnotebook://')) {
            console.log('✅ Desktop file includes URL scheme support');
        } else {
            console.log('❌ Desktop file missing URL scheme support');
        }
    } else {
        console.log('❌ Desktop file not found');
    }
}

console.log('\n📝 Deep Link Test Complete!');
console.log('💡 To test manually:');
console.log('   - Open a browser and navigate to: researchenotebook://note/123');
console.log('   - Use command line: open "researchnotebook://project/456"');
console.log('   - Create links in documents: <a href="researchnotebook://search?q=research">Search</a>');
console.log('   - Test from other applications that support URL schemes');

console.log('\n🔗 Example Deep Links for Testing:');
console.log('   Note: researchenotebook://note/123?mode=edit&section=content');
console.log('   Project: researchenotebook://project/456?view=overview&tab=tasks');
console.log('   PDF: researchenotebook://pdf/document.pdf?page=10&zoom=1.2');
console.log('   Search: researchenotebook://search?q=protocol&type=all');
console.log('   Dashboard: researchenotebook://dashboard?view=recent&filters=active'); 