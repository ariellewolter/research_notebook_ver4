#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

console.log('🧪 Interactive Full Flow Test for Research Notebook...\n');

// Configuration
const APP_NAME = 'Research Notebook';
const TEST_PDF_PATH = path.join(__dirname, 'test-document.pdf');

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

// Create readline interface for user interaction
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Utility functions
function logTest(name, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${name} - PASS`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name} - FAIL`);
    }
    if (details) {
        console.log(`   ${details}`);
    }
    console.log('');
}

function createTestPDF() {
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    try {
        fs.writeFileSync(TEST_PDF_PATH, pdfContent);
        return true;
    } catch (error) {
        console.error('Failed to create test PDF:', error);
        return false;
    }
}

function cleanupTestFiles() {
    try {
        if (fs.existsSync(TEST_PDF_PATH)) {
            fs.unlinkSync(TEST_PDF_PATH);
        }
    } catch (error) {
        console.warn('Failed to cleanup test files:', error);
    }
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer.toLowerCase());
        });
    });
}

// Test 1: Start the application
async function testAppStartup() {
    console.log('📋 Test 1: Application Startup...');
    
    const platform = process.platform;
    let appProcess = null;
    
    try {
        if (platform === 'darwin') {
            appProcess = spawn('open', ['-a', APP_NAME]);
        } else if (platform === 'win32') {
            appProcess = spawn('start', [APP_NAME], { shell: true });
        } else {
            appProcess = spawn('research-notebook');
        }
        
        // Wait a moment for the app to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const answer = await question('Did the Research Notebook application start successfully? (y/n): ');
        const started = answer === 'y' || answer === 'yes';
        
        logTest('Application Startup', started, 'User confirmed app started');
        
        return { started, process: appProcess };
    } catch (error) {
        logTest('Application Startup', false, `Error: ${error.message}`);
        return { started: false, process: null };
    }
}

// Test 2: Test multi-window opening
async function testMultiWindowOpening() {
    console.log('📋 Test 2: Multi-Window Opening...');
    
    console.log('\n🔗 Testing Deep Link Window Opening...');
    console.log('The following deep links should open new windows:');
    
    const testDeepLinks = [
        'researchnotebook://note/123?mode=edit',
        'researchnotebook://project/456?view=overview',
        'researchnotebook://search?q=test',
        'researchnotebook://dashboard?view=projects'
    ];
    
    const platform = process.platform;
    
    for (let i = 0; i < testDeepLinks.length; i++) {
        const deepLink = testDeepLinks[i];
        console.log(`\nOpening: ${deepLink}`);
        
        try {
            if (platform === 'darwin') {
                exec(`open "${deepLink}"`);
            } else if (platform === 'win32') {
                exec(`start "" "${deepLink}"`);
            } else {
                exec(`xdg-open "${deepLink}"`);
            }
            
            // Wait for window to open
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const answer = await question(`Did a new window open for: ${deepLink}? (y/n): `);
            const windowOpened = answer === 'y' || answer === 'yes';
            
            logTest(`Deep Link Window ${i + 1}`, windowOpened, `Deep link: ${deepLink}`);
            
        } catch (error) {
            logTest(`Deep Link Window ${i + 1}`, false, `Error: ${error.message}`);
        }
    }
}

// Test 3: Test PDF file opening
async function testPDFFileOpening() {
    console.log('📋 Test 3: PDF File Opening...');
    
    if (!createTestPDF()) {
        logTest('PDF File Creation', false, 'Failed to create test PDF');
        return false;
    }
    
    console.log(`\n📄 Created test PDF at: ${TEST_PDF_PATH}`);
    console.log('Double-click the PDF file or use the command line to open it.');
    
    const platform = process.platform;
    
    try {
        if (platform === 'darwin') {
            exec(`open "${TEST_PDF_PATH}"`);
        } else if (platform === 'win32') {
            exec(`start "" "${TEST_PDF_PATH}"`);
        } else {
            exec(`xdg-open "${TEST_PDF_PATH}"`);
        }
        
        // Wait for PDF to open
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const answer = await question('Did the PDF file open in Research Notebook? (y/n): ');
        const pdfOpened = answer === 'y' || answer === 'yes';
        
        logTest('PDF File Opening', pdfOpened, 'PDF opened in Research Notebook');
        
        return pdfOpened;
    } catch (error) {
        logTest('PDF File Opening', false, `Error: ${error.message}`);
        return false;
    }
}

// Test 4: Test popout windows
async function testPopoutWindows() {
    console.log('📋 Test 4: Popout Windows...');
    
    console.log('\n🪟 Testing popout window functionality...');
    console.log('This test requires manual interaction with the app.');
    
    const answer = await question('Can you open popout windows from within the Research Notebook app? (y/n): ');
    const popoutsWorking = answer === 'y' || answer === 'yes';
    
    logTest('Popout Windows', popoutsWorking, 'User confirmed popout functionality');
    
    return popoutsWorking;
}

// Test 5: Test state consistency
async function testStateConsistency() {
    console.log('📋 Test 5: State Consistency Across Windows...');
    
    console.log('\n🔄 Testing state consistency...');
    console.log('Please perform the following actions:');
    console.log('1. Open multiple windows');
    console.log('2. Make changes in one window');
    console.log('3. Check if changes are reflected in other windows');
    
    const answer = await question('Is the state consistent across all windows? (y/n): ');
    const stateConsistent = answer === 'y' || answer === 'yes';
    
    logTest('State Consistency', stateConsistent, 'User confirmed state consistency');
    
    return stateConsistent;
}

// Test 6: Test resource management
async function testResourceManagement() {
    console.log('📋 Test 6: Resource Management...');
    
    console.log('\n💾 Testing resource management...');
    console.log('Please perform the following actions:');
    console.log('1. Open several windows');
    console.log('2. Close some windows');
    console.log('3. Check if resources are properly freed');
    
    const answer = await question('Are resources properly managed when windows are closed? (y/n): ');
    const resourcesManaged = answer === 'y' || answer === 'yes';
    
    logTest('Resource Management', resourcesManaged, 'User confirmed resource management');
    
    return resourcesManaged;
}

// Test 7: Test window cleanup
async function testWindowCleanup() {
    console.log('📋 Test 7: Window Cleanup...');
    
    console.log('\n🧹 Testing window cleanup...');
    console.log('Please close all Research Notebook windows and check:');
    console.log('1. No orphaned processes remain');
    console.log('2. Memory is properly freed');
    console.log('3. File handles are closed');
    
    const answer = await question('Is cleanup working properly when all windows are closed? (y/n): ');
    const cleanupWorking = answer === 'y' || answer === 'yes';
    
    logTest('Window Cleanup', cleanupWorking, 'User confirmed cleanup functionality');
    
    return cleanupWorking;
}

// Test 8: Test deep linking from browser
async function testDeepLinkingFromBrowser() {
    console.log('📋 Test 8: Deep Linking from Browser...');
    
    console.log('\n🌐 Testing deep linking from browser...');
    console.log('Please perform the following actions:');
    console.log('1. Open a web browser');
    console.log('2. Navigate to: researchenotebook://note/123?mode=edit');
    console.log('3. Check if Research Notebook opens with the correct note');
    
    const answer = await question('Did the deep link work from the browser? (y/n): ');
    const browserDeepLinkWorking = answer === 'y' || answer === 'yes';
    
    logTest('Browser Deep Linking', browserDeepLinkWorking, 'User confirmed browser deep linking');
    
    return browserDeepLinkWorking;
}

// Test 9: Test command line deep linking
async function testCommandLineDeepLinking() {
    console.log('📋 Test 9: Command Line Deep Linking...');
    
    console.log('\n💻 Testing command line deep linking...');
    
    const testDeepLinks = [
        'researchnotebook://project/456?view=overview',
        'researchnotebook://search?q=command+line+test',
        'researchnotebook://dashboard?view=recent'
    ];
    
    const platform = process.platform;
    
    for (let i = 0; i < testDeepLinks.length; i++) {
        const deepLink = testDeepLinks[i];
        console.log(`\nTesting: ${deepLink}`);
        
        try {
            if (platform === 'darwin') {
                exec(`open "${deepLink}"`);
            } else if (platform === 'win32') {
                exec(`start "" "${deepLink}"`);
            } else {
                exec(`xdg-open "${deepLink}"`);
            }
            
            // Wait for deep link to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const answer = await question(`Did the command line deep link work: ${deepLink}? (y/n): `);
            const deepLinkWorking = answer === 'y' || answer === 'yes';
            
            logTest(`Command Line Deep Link ${i + 1}`, deepLinkWorking, `Deep link: ${deepLink}`);
            
        } catch (error) {
            logTest(`Command Line Deep Link ${i + 1}`, false, `Error: ${error.message}`);
        }
    }
}

// Test 10: Test second instance handling
async function testSecondInstanceHandling() {
    console.log('📋 Test 10: Second Instance Handling...');
    
    console.log('\n🔄 Testing second instance handling...');
    console.log('Please perform the following actions:');
    console.log('1. Ensure Research Notebook is already running');
    console.log('2. Try to open another instance (double-click app icon)');
    console.log('3. Check if it focuses the existing instance instead');
    
    const answer = await question('Does second instance handling work correctly? (y/n): ');
    const secondInstanceWorking = answer === 'y' || answer === 'yes';
    
    logTest('Second Instance Handling', secondInstanceWorking, 'User confirmed second instance handling');
    
    return secondInstanceWorking;
}

// Main test execution
async function runInteractiveTests() {
    console.log('🚀 Starting Interactive Full Flow Tests...\n');
    console.log('This test suite requires manual interaction and verification.\n');
    
    try {
        // Test 1: App startup
        const { started } = await testAppStartup();
        if (!started) {
            console.log('❌ Application failed to start. Please ensure it is installed correctly.');
            return;
        }
        
        // Test 2: Multi-window opening
        await testMultiWindowOpening();
        
        // Test 3: PDF file opening
        await testPDFFileOpening();
        
        // Test 4: Popout windows
        await testPopoutWindows();
        
        // Test 5: State consistency
        await testStateConsistency();
        
        // Test 6: Resource management
        await testResourceManagement();
        
        // Test 7: Window cleanup
        await testWindowCleanup();
        
        // Test 8: Browser deep linking
        await testDeepLinkingFromBrowser();
        
        // Test 9: Command line deep linking
        await testCommandLineDeepLinking();
        
        // Test 10: Second instance handling
        await testSecondInstanceHandling();
        
        // Cleanup
        cleanupTestFiles();
        
        // Print summary
        console.log('\n📊 Test Summary:');
        console.log(`Total Tests: ${testResults.total}`);
        console.log(`Passed: ${testResults.passed}`);
        console.log(`Failed: ${testResults.failed}`);
        console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
        
        if (testResults.failed === 0) {
            console.log('\n🎉 All tests passed! The full flow is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the implementation.');
        }
        
    } catch (error) {
        console.error('Test execution failed:', error);
    } finally {
        rl.close();
    }
}

// Run tests
runInteractiveTests().catch(console.error); 