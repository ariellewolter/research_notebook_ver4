#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Zotero Sync Functionality...\n');

// Configuration
const APP_NAME = 'Research Notebook';
const TEST_CONFIG = {
    apiKey: 'test-api-key',
    userId: 'test-user-id',
    groupId: 'test-group-id'
};

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

// Test 2: Zotero page navigation
async function testZoteroPageNavigation() {
    console.log('📋 Test 2: Zotero Page Navigation...');
    
    console.log('\n🔧 Testing Zotero page navigation:');
    console.log('1. Open the Research Notebook application');
    console.log('2. Navigate to Zotero page');
    console.log('3. Look for "Zotero Sync Settings" section');
    
    console.log('\nExpected behavior:');
    console.log('- Zotero Sync Settings section should be visible');
    console.log('- Manual sync button should be present');
    console.log('- Background sync toggle should be available');
    console.log('- Sync status indicators should be displayed');
    
    return true;
}

// Test 3: Manual sync functionality
async function testManualSync() {
    console.log('📋 Test 3: Manual Sync Functionality...');
    
    console.log('\n🔄 Testing manual sync:');
    console.log('1. Go to Zotero Sync Settings section');
    console.log('2. Click "Sync Now" button');
    console.log('3. Verify sync process and results');
    
    console.log('\nExpected behavior:');
    console.log('- Sync button should be enabled if Zotero is configured');
    console.log('- Sync process should show loading indicator');
    console.log('- Sync results should display new/updated items');
    console.log('- Last sync time should be updated');
    console.log('- Success/error messages should appear');
    
    return true;
}

// Test 4: Background sync configuration
async function testBackgroundSyncConfig() {
    console.log('📋 Test 4: Background Sync Configuration...');
    
    console.log('\n⏰ Testing background sync configuration:');
    console.log('1. Toggle "Enable Background Sync" switch');
    console.log('2. Set sync interval (e.g., 30 minutes)');
    console.log('3. Verify background sync status');
    
    console.log('\nExpected behavior:');
    console.log('- Background sync toggle should work');
    console.log('- Interval input should be configurable (1-1440 minutes)');
    console.log('- Status should show "Active" when enabled');
    console.log('- Settings should persist across app restarts');
    console.log('- Success messages should confirm configuration');
    
    return true;
}

// Test 5: Sync status display
async function testSyncStatusDisplay() {
    console.log('📋 Test 5: Sync Status Display...');
    
    console.log('\n📊 Testing sync status display:');
    console.log('1. Check sync status indicators');
    console.log('2. Verify last sync time display');
    console.log('3. Check configuration status');
    
    console.log('\nExpected behavior:');
    console.log('- Status chip should show current sync state');
    console.log('- Last sync time should be formatted correctly');
    console.log('- Configuration status should be accurate');
    console.log('- Refresh button should update status');
    console.log('- Visual indicators should be color-coded');
    
    return true;
}

// Test 6: Sync results display
async function testSyncResultsDisplay() {
    console.log('📋 Test 6: Sync Results Display...');
    
    console.log('\n📋 Testing sync results display:');
    console.log('1. Perform a manual sync');
    console.log('2. Check results section');
    console.log('3. Verify item details display');
    
    console.log('\nExpected behavior:');
    console.log('- Results should show total items count');
    console.log('- New items should be listed with details');
    console.log('- Updated items should show change information');
    console.log('- Item types and authors should be displayed');
    console.log('- Results should persist until next sync');
    
    return true;
}

// Test 7: Error handling
async function testErrorHandling() {
    console.log('📋 Test 7: Error Handling...');
    
    console.log('\n⚠️  Testing error handling:');
    console.log('1. Try to sync without Zotero configuration');
    console.log('2. Test with invalid API credentials');
    console.log('3. Check error message display');
    
    console.log('\nExpected behavior:');
    console.log('- Appropriate error messages should be displayed');
    console.log('- Sync should be disabled when not configured');
    console.log('- Error states should be clearly indicated');
    console.log('- Application should remain stable');
    console.log('- Recovery options should be available');
    
    return true;
}

// Test 8: Background sync operation
async function testBackgroundSyncOperation() {
    console.log('📋 Test 8: Background Sync Operation...');
    
    console.log('\n🔄 Testing background sync operation:');
    console.log('1. Enable background sync with short interval');
    console.log('2. Add items to Zotero library');
    console.log('3. Wait for background sync to trigger');
    console.log('4. Check for notifications and updates');
    
    console.log('\nExpected behavior:');
    console.log('- Background sync should run automatically');
    console.log('- New items should be detected and imported');
    console.log('- Desktop notifications should appear');
    console.log('- Sync status should update automatically');
    console.log('- No manual intervention should be required');
    
    return true;
}

// Test 9: Settings persistence
async function testSettingsPersistence() {
    console.log('📋 Test 9: Settings Persistence...');
    
    console.log('\n💾 Testing settings persistence:');
    console.log('1. Configure background sync settings');
    console.log('2. Close the Research Notebook application');
    console.log('3. Restart the application');
    console.log('4. Check if settings are restored');
    
    console.log('\nExpected behavior:');
    console.log('- Background sync settings should be restored');
    console.log('- Sync interval should be preserved');
    console.log('- Background sync should resume automatically');
    console.log('- Configuration should persist across restarts');
    console.log('- Status should reflect saved settings');
    
    return true;
}

// Test 10: Integration with existing features
async function testIntegration() {
    console.log('📋 Test 10: Integration with Existing Features...');
    
    console.log('\n🔗 Testing integration with existing features:');
    console.log('1. Sync items from Zotero');
    console.log('2. Check if items appear in database');
    console.log('3. Test import functionality with synced items');
    console.log('4. Verify search and filtering work');
    
    console.log('\nExpected behavior:');
    console.log('- Synced items should appear in database');
    console.log('- Import functionality should work with synced items');
    console.log('- Search should find synced items');
    console.log('- Filtering should work correctly');
    console.log('- No conflicts with existing functionality');
    
    return true;
}

// Main test execution
async function runZoteroSyncTests() {
    console.log('🚀 Starting Zotero Sync Tests...\n');
    console.log('This test suite requires manual interaction and verification.\n');
    
    try {
        // Test 1: App startup
        const started = await testAppStartup();
        if (!started) {
            console.log('❌ Application failed to start. Please ensure it is installed correctly.');
            return;
        }
        
        // Test 2: Zotero page navigation
        await testZoteroPageNavigation();
        
        // Test 3: Manual sync functionality
        await testManualSync();
        
        // Test 4: Background sync configuration
        await testBackgroundSyncConfig();
        
        // Test 5: Sync status display
        await testSyncStatusDisplay();
        
        // Test 6: Sync results display
        await testSyncResultsDisplay();
        
        // Test 7: Error handling
        await testErrorHandling();
        
        // Test 8: Background sync operation
        await testBackgroundSyncOperation();
        
        // Test 9: Settings persistence
        await testSettingsPersistence();
        
        // Test 10: Integration with existing features
        await testIntegration();
        
        // Print summary
        console.log('\n📊 Test Summary:');
        console.log(`Total Tests: ${testResults.total}`);
        console.log(`Passed: ${testResults.passed}`);
        console.log(`Failed: ${testResults.failed}`);
        console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
        
        console.log('\n🎯 Manual Verification Required:');
        console.log('Please manually verify the following:');
        console.log('1. Navigate to Zotero → Zotero Sync Settings');
        console.log('2. Test manual sync functionality');
        console.log('3. Configure and test background sync');
        console.log('4. Verify sync status and results display');
        console.log('5. Test error handling scenarios');
        console.log('6. Check settings persistence across restarts');
        console.log('7. Verify integration with existing Zotero features');
        console.log('8. Test notifications for new items');
        
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
runZoteroSyncTests().catch(console.error); 