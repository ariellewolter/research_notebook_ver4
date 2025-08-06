# 🔒 Electron Security Quick Reference

## 🚨 **Critical Issues to Fix Immediately**

### **1. Remove Web Security Disable Flag**
**File**: `electron/main.js:339`
```javascript
// ❌ REMOVE THIS LINE
`--disable-web-security=${isDev}`,

// ✅ KEEP ONLY NECESSARY FLAGS
'--disable-features=VizDisplayCompositor'
```

### **2. Fix File Path Validation**
**File**: `electron/main.js:706-753`
```javascript
// ✅ ADD THIS VALIDATION FUNCTION
function validateFilePath(filePath) {
    const normalizedPath = path.normalize(filePath);
    const resolvedPath = path.resolve(normalizedPath);
    
    const allowedDirs = [
        app.getPath('userData'),
        app.getPath('documents'),
        app.getPath('downloads')
    ];
    
    return allowedDirs.some(dir => resolvedPath.startsWith(dir));
}

// ✅ USE IN openPDFFile FUNCTION
if (!validateFilePath(filePath)) {
    console.error('Access denied to path:', filePath);
    return;
}
```

### **3. Add URL Validation**
**File**: `electron/main.js:278`
```javascript
// ✅ REPLACE EXISTING HANDLER
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            require('electron').shell.openExternal(url);
        }
        return { action: 'deny' };
    } catch (error) {
        return { action: 'deny' };
    }
});
```

### **4. Limit Process Object Exposure**
**File**: `electron/preload.js:240-248`
```javascript
// ✅ REPLACE WITH LIMITED EXPOSURE
contextBridge.exposeInMainWorld('process', {
    env: { NODE_ENV: process.env.NODE_ENV },
    platform: process.platform,
    versions: { electron: process.versions.electron }
});
```

### **5. Add Content Security Policy**
**File**: `electron/main.js` (add after app initialization)
```javascript
// ✅ ADD CSP HEADERS
app.on('web-contents-created', (event, contents) => {
    contents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
                ]
            }
        });
    });
});
```

## 🔧 **Security Best Practices**

### **Always Validate IPC Parameters**
```javascript
ipcMain.handle('api-call', async (event, data) => {
    // ✅ VALIDATE INPUT
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid input');
    }
    
    // Process validated data
    return await processData(data);
});
```

### **Use Safe File Operations**
```javascript
// ✅ SAFE FILE READING
function safeReadFile(filePath) {
    const normalizedPath = path.normalize(filePath);
    const resolvedPath = path.resolve(normalizedPath);
    
    // Check if path is safe
    if (!isPathSafe(resolvedPath)) {
        throw new Error('Access denied');
    }
    
    return fs.readFileSync(resolvedPath, 'utf8');
}
```

### **Implement Secure Error Handling**
```javascript
// ✅ SECURE ERROR HANDLING
try {
    const result = await sensitiveOperation();
    return result;
} catch (error) {
    // Log for debugging in development only
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error);
    }
    
    // Return generic error to user
    throw new Error('Operation failed');
}
```

## 📋 **Security Checklist**

### **Before Each Release**
- [ ] Web security enabled in all modes
- [ ] All file paths validated
- [ ] External URLs validated
- [ ] IPC parameters validated
- [ ] CSP headers configured
- [ ] Error handling secure
- [ ] Dependencies updated
- [ ] Security audit completed

### **Development Guidelines**
- [ ] Never disable web security
- [ ] Always validate user inputs
- [ ] Use context isolation
- [ ] Implement proper error handling
- [ ] Log security events
- [ ] Test security measures

## 🚀 **Quick Fix Commands**

### **Update Dependencies**
```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Fix vulnerabilities
pnpm audit --fix
```

### **Security Testing**
```bash
# Run security tests
npm run test:security

# Check Electron security
npx electronegativity

# Audit dependencies
pnpm audit
```

## 📞 **Emergency Contacts**

- **Security Issues**: Report immediately to security team
- **Critical Bugs**: Create high-priority issue
- **Dependencies**: Check for known vulnerabilities
- **Updates**: Monitor Electron security advisories

---

**Remember**: Security is everyone's responsibility. When in doubt, err on the side of caution. 