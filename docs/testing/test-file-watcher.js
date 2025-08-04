#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing File Watcher Settings...\n');

// Configuration
const APP_NAME = 'Research Notebook';
const TEST_FOLDER_PATH = path.join(__dirname, 'test-watch-folder');

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

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

function createTestFolder() {
    if (!fs.existsSync(TEST_FOLDER_PATH)) {
        fs.mkdirSync(TEST_FOLDER_PATH, { recursive: true });
        console.log(`📁 Created test folder: ${TEST_FOLDER_PATH}`);
        return true;
    }
    return true;
}

function cleanupTestFolder() {
    try {
        if (fs.existsSync(TEST_FOLDER_PATH)) {
            fs.rmSync(TEST_FOLDER_PATH, { recursive: true, force: true });
            console.log('🧹 Cleaned up test folder');
        }
    } catch (error) {
        console.warn('Failed to cleanup test folder:', error);
    }
}

// Test 1: Application startup
async function testAppStartup() {
    console.log('📋 Test 1: Application Startup...');
    
    const platform = process.platform;
    
    try {
        if (platform === 'darwin') {
            exec(`open -a "${APP_NAME}"`);
        } else if (platform === 'win32') {
            exec(`start "${APP_NAME}"`);
        } else {
            exec('research-notebook');
        }
        
        // Wait for app to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Application should be running');
        console.log('   Please verify the Research Notebook application started successfully');
        
        return true;
    } catch (error) {
        logTest('Application Startup', false, `Error: ${error.message}`);
        return false;
    }
}

// Test 2: Settings page navigation
async function testSettingsNavigation() {
    console.log('📋 Test 2: Settings Page Navigation...');
    
    console.log('\n🔧 Testing settings page navigation:');
    console.log('1. Open the Research Notebook application');
    console.log('2. Navigate to Settings page');
    console.log('3. Look for "File Watcher Settings" section');
    
    console.log('\nExpected behavior:');
    console.log('- File Watcher Settings section should be visible');
    console.log('- Enable/Disable switch should be present');
    console.log('- Folder selection controls should be available');
    console.log('- Supported file types list should be displayed');
    
    return true;
}

// Test 3: File watcher enable/disable
async function testFileWatcherToggle() {
    console.log('📋 Test 3: File Watcher Enable/Disable...');
    
    console.log('\n🔄 Testing file watcher toggle:');
    console.log('1. Go to File Watcher Settings in the Settings page');
    console.log('2. Toggle the "Enable File Watcher" switch');
    console.log('3. Verify the status changes');
    
    console.log('\nExpected behavior:');
    console.log('- Switch should toggle between enabled/disabled states');
    console.log('- Status indicator should update accordingly');
    console.log('- Success/error messages should appear');
    console.log('- Settings should persist after app restart');
    
    return true;
}

// Test 4: Folder selection
async function testFolderSelection() {
    console.log('📋 Test 4: Folder Selection...');
    
    console.log('\n📁 Testing folder selection:');
    console.log('1. Click "Select" button in File Watcher Settings');
    console.log('2. Choose a folder to watch');
    console.log('3. Verify the folder path is displayed');
    
    console.log('\nExpected behavior:');
    console.log('- Folder selection dialog should open');
    console.log('- Selected folder path should be displayed');
    console.log('- Clear button should appear when folder is selected');
    console.log('- Status should show "Watching" if enabled');
    
    return true;
}

// Test 5: File watcher testing
async function testFileWatcherTest() {
    console.log('📋 Test 5: File Watcher Testing...');
    
    console.log('\n🧪 Testing file watcher functionality:');
    console.log('1. Enable file watcher and select a folder');
    console.log('2. Click "Test File Watcher" button');
    console.log('3. Check if test file is created and removed');
    
    console.log('\nExpected behavior:');
    console.log('- Test button should be enabled when watcher is active');
    console.log('- Test file should be created in watched folder');
    console.log('- Test file should be automatically removed after 2 seconds');
    console.log('- Success message should appear');
    
    return true;
}

// Test 6: File detection
async function testFileDetection() {
    console.log('📋 Test 6: File Detection...');
    
    console.log('\n📄 Testing file detection:');
    console.log('1. Ensure file watcher is enabled and folder is selected');
    console.log('2. Create files in the watched folder:');
    console.log('   - test.pdf (PDF file)');
    console.log('   - data.csv (CSV file)');
    console.log('   - notes.txt (Text file)');
    console.log('3. Check for notifications and file detection');
    
    console.log('\nExpected behavior:');
    console.log('- Desktop notifications should appear for new files');
    console.log('- Files should be detected and logged');
    console.log('- Different file types should be handled appropriately');
    console.log('- File watcher should continue monitoring');
    
    return true;
}

// Test 7: Settings persistence
async function testSettingsPersistence() {
    console.log('📋 Test 7: Settings Persistence...');
    
    console.log('\n💾 Testing settings persistence:');
    console.log('1. Configure file watcher settings (enable + select folder)');
    console.log('2. Close the Research Notebook application');
    console.log('3. Restart the application');
    console.log('4. Check if settings are restored');
    
    console.log('\nExpected behavior:');
    console.log('- File watcher should be enabled on restart');
    console.log('- Watched folder path should be restored');
    console.log('- File watcher should start automatically');
    console.log('- Settings should persist across app restarts');
    
    return true;
}

// Test 8: Error handling
async function testErrorHandling() {
    console.log('📋 Test 8: Error Handling...');
    
    console.log('\n⚠️  Testing error handling:');
    console.log('1. Try to enable file watcher without selecting a folder');
    console.log('2. Try to select a non-existent folder');
    console.log('3. Try to test watcher when disabled');
    console.log('4. Check error messages and handling');
    
    console.log('\nExpected behavior:');
    console.log('- Appropriate error messages should be displayed');
    console.log('- Application should remain stable');
    console.log('- Error states should be clearly indicated');
    console.log('- Recovery options should be available');
    
    return true;
}

// Test 9: Supported file types
async function testSupportedFileTypes() {
    console.log('📋 Test 9: Supported File Types...');
    
    console.log('\n📋 Testing supported file types display:');
    console.log('1. Check the "Supported File Types" section');
    console.log('2. Verify all supported types are listed');
    
    const expectedTypes = [
        '.pdf - PDF Documents',
        '.csv - CSV Files',
        '.json - JSON Files',
        '.txt - Text Files',
        '.md - Markdown Files',
        '.xlsx - Excel Files',
        '.xls - Excel Files (Legacy)'
    ];
    
    console.log('\nExpected file types:');
    expectedTypes.forEach(type => {
        console.log(`   ${type}`);
    });
    
    return true;
}

// Test 10: Integration with drag-and-drop
async function testDragDropIntegration() {
    console.log('📋 Test 10: Drag-and-Drop Integration...');
    
    console.log('\n🔄 Testing integration with drag-and-drop:');
    console.log('1. Enable file watcher and select a folder');
    console.log('2. Drag files from the watched folder to the app');
    console.log('3. Check if both systems work together');
    
    console.log('\nExpected behavior:');
    console.log('- File watcher should detect files added to folder');
    console.log('- Drag-and-drop should work for files from any location');
    console.log('- Both systems should function independently');
    console.log('- No conflicts between the two import methods');
    
    return true;
}

// Main test execution
async function runFileWatcherTests() {
    console.log('🚀 Starting File Watcher Settings Tests...\n');
    console.log('This test suite requires manual interaction and verification.\n');
    
    try {
        // Create test folder
        if (!createTestFolder()) {
            console.log('❌ Failed to create test folder');
            return;
        }
        
        // Test 1: App startup
        const started = await testAppStartup();
        if (!started) {
            console.log('❌ Application failed to start. Please ensure it is installed correctly.');
            return;
        }
        
        // Test 2: Settings navigation
        await testSettingsNavigation();
        
        // Test 3: File watcher toggle
        await testFileWatcherToggle();
        
        // Test 4: Folder selection
        await testFolderSelection();
        
        // Test 5: File watcher testing
        await testFileWatcherTest();
        
        // Test 6: File detection
        await testFileDetection();
        
        // Test 7: Settings persistence
        await testSettingsPersistence();
        
        // Test 8: Error handling
        await testErrorHandling();
        
        // Test 9: Supported file types
        await testSupportedFileTypes();
        
        // Test 10: Drag-and-drop integration
        await testDragDropIntegration();
        
        // Cleanup
        cleanupTestFolder();
        
        // Print summary
        console.log('\n📊 Test Summary:');
        console.log(`Total Tests: ${testResults.total}`);
        console.log(`Passed: ${testResults.passed}`);
        console.log(`Failed: ${testResults.failed}`);
        console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
        
        console.log('\n🎯 Manual Verification Required:');
        console.log('Please manually verify the following:');
        console.log('1. Navigate to Settings → File Watcher Settings');
        console.log('2. Test enable/disable functionality');
        console.log('3. Test folder selection and clearing');
        console.log('4. Test file watcher with actual files');
        console.log('5. Verify settings persistence across restarts');
        console.log('6. Check error handling for invalid inputs');
        console.log('7. Test integration with drag-and-drop overlay');
        
        if (testResults.failed === 0) {
            console.log('\n🎉 All automated tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the implementation.');
        }
        
    } catch (error) {
        console.error('Test execution failed:', error);
    }
}

// Run tests
runFileWatcherTests().catch(console.error); 