# 🧪 Electron OS-Level Features Test Guide

## 🚀 **Test Flow for OS-Level Features in Electron Dev Mode**

This guide provides step-by-step instructions to test all implemented OS-level features in Electron development mode.

---

## 📋 **Prerequisites**

✅ **Development Environment Running:**
- Frontend (Vite) server: `http://localhost:5173`
- Backend (Express) server: `http://localhost:3000`
- Electron app: Running in development mode

✅ **Test Component Available:**
- Navigate to: `http://localhost:5173/electron-test` in the Electron app
- Or use the test component directly in the application

---

## 🎯 **Test 1: Notification System**

### **Objective:** Verify native system notifications work in Electron mode

### **Steps:**
1. **Open Test Component:**
   - Navigate to `/electron-test` in the Electron app
   - Or use the notification test buttons

2. **Test Basic Notification:**
   ```typescript
   // Should trigger native system notification
   await notify('Test Notification', 'This is a test notification from Electron!');
   ```
   - **Expected Result:** Native macOS notification appears
   - **Fallback:** Browser notification if Electron not available

3. **Test Success Notification:**
   ```typescript
   await notifySuccess('Success Test', 'This is a success notification!');
   ```
   - **Expected Result:** Success-style notification with green styling

4. **Test Error Notification:**
   ```typescript
   await notifyError('Error Test', 'This is an error notification!');
   ```
   - **Expected Result:** Error-style notification with red styling

5. **Test Info Notification:**
   ```typescript
   await notifyInfo('Info Test', 'This is an info notification!');
   ```
   - **Expected Result:** Info-style notification with blue styling

### **Verification:**
- ✅ Native system notifications appear (Electron mode)
- ✅ Browser notifications appear (fallback mode)
- ✅ Different notification types have appropriate styling
- ✅ Notifications are clickable and dismissible

---

## 💾 **Test 2: File Save Dialog**

### **Objective:** Verify native file save dialogs work in Electron mode

### **Steps:**
1. **Test File Save:**
   ```typescript
   const testContent = `Test content for Electron file save dialog.
   Created at: ${new Date().toISOString()}`;
   
   const result = await saveFileDialog(testContent, 'electron-test-file.txt');
   ```

2. **Expected Behavior:**
   - **Electron Mode:** Native macOS file save dialog opens
   - **User can:** Choose save location, modify filename, cancel operation
   - **Browser Mode:** Browser download dialog triggers

3. **Test Different File Types:**
   ```typescript
   // Test JSON file
   await saveFileDialog(JSON.stringify({test: 'data'}, null, 2), 'test-data.json');
   
   // Test CSV file
   await saveFileDialog('name,value\ntest,123', 'test-data.csv');
   
   // Test HTML file
   await saveFileDialog('<html><body>Test</body></html>', 'test-page.html');
   ```

### **Verification:**
- ✅ Native file dialog opens (Electron mode)
- ✅ User can choose save location
- ✅ User can modify filename
- ✅ File content is saved correctly
- ✅ Cancel operation works
- ✅ Browser fallback works (web mode)

---

## ⚙️ **Test 3: Settings Persistence**

### **Objective:** Verify settings persist across app reloads

### **Steps:**
1. **Update Settings:**
   ```typescript
   // Change theme
   updateSetting('theme', 'dark');
   
   // Change font size
   updateNestedSetting('editor', 'fontSize', 16);
   
   // Change notification preferences
   updateNestedSetting('notifications', 'enabled', false);
   ```

2. **Wait for Auto-Save:**
   - Settings auto-save after 1 second (debounced)
   - Check "Last Saved" timestamp updates

3. **Force Save:**
   ```typescript
   const saveResult = await saveSettings(settings);
   ```

4. **Reload Application:**
   - Close and reopen Electron app
   - Or refresh the page (Ctrl+R / Cmd+R)

5. **Verify Persistence:**
   - Settings should be restored
   - Theme should remain 'dark'
   - Font size should remain 16px
   - Notification preferences should remain disabled

### **Verification:**
- ✅ Settings update immediately in UI
- ✅ Auto-save triggers after 1 second
- ✅ Manual save works
- ✅ Settings persist across app reloads
- ✅ Settings file created in userData directory

---

## 📂 **Test 4: Settings Loading**

### **Objective:** Verify settings load correctly on app start

### **Steps:**
1. **Check Initial Load:**
   ```typescript
   const loadResult = await loadSettings();
   ```

2. **Verify Default Settings:**
   - Theme should default to 'system'
   - Font size should default to 14px
   - Notifications should default to enabled

3. **Test Loading with Existing Settings:**
   - Create settings file manually
   - Restart app
   - Verify custom settings load

### **Verification:**
- ✅ Settings load on app start
- ✅ Default settings applied if no saved settings
- ✅ Custom settings override defaults
- ✅ Error handling for corrupted settings files

---

## 🔍 **Test 5: IPC Communication Logging**

### **Objective:** Verify IPC communication is logged for debugging

### **Steps:**
1. **Open Browser Console:**
   - In Electron: View → Toggle Developer Tools
   - Or press F12 / Cmd+Option+I

2. **Trigger IPC Operations:**
   ```typescript
   // These should log IPC communication
   console.log('[IPC] Testing notification IPC...');
   await notify('IPC Test', 'Testing IPC communication');
   
   console.log('[IPC] Testing file save IPC...');
   await saveFileDialog('IPC test content', 'ipc-test.txt');
   
   console.log('[IPC] Testing settings IPC...');
   await saveSettings(settings);
   ```

3. **Check Console Logs:**
   - Look for `[IPC]` prefixed messages
   - Look for `[TEST]` prefixed messages
   - Look for any error messages

### **Verification:**
- ✅ IPC communication is logged
- ✅ Test results are logged
- ✅ Error messages are logged
- ✅ Console output is clear and informative

---

## 🧪 **Comprehensive Test Suite**

### **Run All Tests:**
1. **Navigate to Test Component:**
   - Go to `/electron-test` in the Electron app

2. **Click "Run All Tests":**
   - This will execute all tests sequentially
   - Results will be displayed in the UI
   - Console logs will show detailed information

3. **Review Results:**
   - Check test status (success/error/pending)
   - Review detailed messages
   - Check console for additional logs

### **Individual Test Buttons:**
- **Test Notifications:** Test notification system only
- **Test File Save:** Test file save dialog only
- **Test Settings:** Test settings persistence only

---

## 🔧 **Environment Detection**

### **Check Environment:**
The test component automatically detects the environment:

- **Electron Mode:** Shows "Electron" chip with green color
- **Browser Mode:** Shows "Browser" chip with yellow color

### **Expected Behavior:**
- **Electron Mode:** Native OS features available
- **Browser Mode:** Fallback features used

---

## 📊 **Test Results Interpretation**

### **Success Indicators:**
- ✅ **Green Status:** Test passed successfully
- ✅ **Native Features:** OS-level features working
- ✅ **Persistent Data:** Settings saved and loaded correctly
- ✅ **Error Handling:** Graceful fallbacks working

### **Error Indicators:**
- ❌ **Red Status:** Test failed
- ❌ **Console Errors:** Check browser console for details
- ❌ **Missing Features:** Native features not available

### **Common Issues:**
- **Notifications not working:** Check system notification permissions
- **File save not working:** Check file system permissions
- **Settings not persisting:** Check userData directory permissions

---

## 🐛 **Debugging Tips**

### **Console Logging:**
```typescript
// Add to any test for debugging
console.log('[DEBUG] Current environment:', isElectron() ? 'Electron' : 'Browser');
console.log('[DEBUG] Settings state:', settings);
console.log('[DEBUG] IPC result:', result);
```

### **Error Handling:**
```typescript
try {
    const result = await saveFileDialog(content, filename);
    console.log('[SUCCESS] File saved:', result);
} catch (error) {
    console.error('[ERROR] File save failed:', error);
}
```

### **Environment Checks:**
```typescript
if (isElectron()) {
    console.log('[INFO] Running in Electron mode');
} else {
    console.log('[INFO] Running in browser mode');
}
```

---

## 📝 **Test Checklist**

### **Before Testing:**
- [ ] Development servers running
- [ ] Electron app launched
- [ ] Browser console open
- [ ] Test component accessible

### **During Testing:**
- [ ] Notifications appear (native/browser)
- [ ] File dialogs open (native/browser)
- [ ] Settings update and persist
- [ ] Console logs show IPC communication
- [ ] Error handling works gracefully

### **After Testing:**
- [ ] All tests pass
- [ ] Settings persist across reloads
- [ ] No console errors
- [ ] Native features working in Electron mode
- [ ] Fallbacks working in browser mode

---

## 🎉 **Success Criteria**

### **Electron Mode:**
- ✅ Native system notifications
- ✅ Native file save dialogs
- ✅ Settings persist in userData directory
- ✅ IPC communication logged
- ✅ Professional desktop app experience

### **Browser Mode:**
- ✅ Browser notifications (with permission)
- ✅ Browser download dialogs
- ✅ Settings persist in localStorage
- ✅ Graceful fallbacks
- ✅ Web app experience maintained

**All OS-level features should work seamlessly in both Electron and browser environments!** 🚀 