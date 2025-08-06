# 🔒 Electron Security & Compatibility Guide

## Overview

This document outlines the security vulnerabilities and compatibility issues identified in the Research Notebook Electron application, along with their fixes and best practices for maintaining a secure desktop application.

## 🚨 **Critical Security Issues Found**

### **Issue 1: Development Web Security Disabled**

**Severity**: 🔴 **CRITICAL**

**Location**: `electron/main.js:339`

**Problem**:
```javascript
// ❌ VULNERABLE CODE
additionalArguments: [
    `--disable-web-security=${isDev}`,  // Security bypass in development
    '--disable-features=VizDisplayCompositor'
]
```

**Risk**: 
- Allows cross-origin requests in development
- Bypasses important security restrictions
- Could lead to malicious code execution
- Creates false sense of security

**Fix**:
```javascript
// ✅ SECURE CODE
additionalArguments: [
    '--disable-features=VizDisplayCompositor'  // Only necessary flags
]
```

**Implementation**:
1. Remove the web security disable flag entirely
2. Use proper CORS configuration for development
3. Implement proper error handling for cross-origin issues

---

### **Issue 2: Excessive Process Object Exposure**

**Severity**: 🟡 **MEDIUM**

**Location**: `electron/preload.js:240-248`

**Problem**:
```javascript
// ❌ VULNERABLE CODE
contextBridge.exposeInMainWorld('process', {
    env: {
        NODE_ENV: process.env.NODE_ENV,
        ELECTRON_START_URL: process.env.ELECTRON_START_URL
    },
    platform: process.platform,
    versions: {
        electron: process.versions.electron,
        node: process.versions.node,        // Sensitive info
        chrome: process.versions.chrome     // Sensitive info
    }
});
```

**Risk**:
- Information disclosure of Node.js and Chrome versions
- Could aid attackers in identifying vulnerable versions
- Unnecessary exposure of internal system information

**Fix**:
```javascript
// ✅ SECURE CODE
contextBridge.exposeInMainWorld('process', {
    env: { 
        NODE_ENV: process.env.NODE_ENV 
    },
    platform: process.platform,
    versions: {
        electron: process.versions.electron  // Only necessary version
    }
});
```

**Implementation**:
1. Only expose necessary environment variables
2. Limit version information to Electron version only
3. Remove sensitive internal version details

---

### **Issue 3: Unvalidated External Links**

**Severity**: 🟡 **MEDIUM**

**Location**: `electron/main.js:278`

**Problem**:
```javascript
// ❌ VULNERABLE CODE
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);  // No validation
    return { action: 'deny' };
});
```

**Risk**:
- Could open malicious URLs
- No protocol validation
- Potential for phishing attacks
- Unintended external link opening

**Fix**:
```javascript
// ✅ SECURE CODE
const { URL } = require('url');

mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
        const parsedUrl = new URL(url);
        
        // Only allow http/https protocols
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            // Additional validation: check for allowed domains
            const allowedDomains = ['trusted-domain.com', 'api.example.com'];
            const isAllowedDomain = allowedDomains.some(domain => 
                parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
            );
            
            if (isAllowedDomain) {
                require('electron').shell.openExternal(url);
            } else {
                console.warn('Blocked external link to unauthorized domain:', url);
            }
        } else {
            console.warn('Blocked external link with invalid protocol:', url);
        }
        
        return { action: 'deny' };
    } catch (error) {
        console.error('Invalid URL format:', url, error);
        return { action: 'deny' };
    }
});
```

**Implementation**:
1. Add URL parsing and validation
2. Implement protocol whitelist (http/https only)
3. Add domain validation if needed
4. Proper error handling for invalid URLs

---

### **Issue 4: File Path Injection Vulnerability**

**Severity**: 🔴 **HIGH**

**Location**: `electron/main.js:706-753` (openPDFFile function)

**Problem**:
```javascript
// ❌ VULNERABLE CODE
function openPDFFile(filePath) {
    if (!filePath || !filePath.toLowerCase().endsWith('.pdf')) {
        console.warn('Invalid file path or not a PDF file:', filePath);
        return;
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath);
        return;
    }
    
    // No path validation or sanitization
    // Could allow path traversal attacks
}
```

**Risk**:
- Path traversal attacks (../../../etc/passwd)
- Access to files outside intended directories
- Potential for sensitive file access
- System compromise through file access

**Fix**:
```javascript
// ✅ SECURE CODE
const path = require('path');

function openPDFFile(filePath) {
    try {
        // Normalize and resolve the file path
        const normalizedPath = path.normalize(filePath);
        const resolvedPath = path.resolve(normalizedPath);
        
        // Validate file extension
        if (!resolvedPath.toLowerCase().endsWith('.pdf')) {
            console.warn('Invalid file type:', resolvedPath);
            return;
        }
        
        // Define allowed directories
        const allowedDirs = [
            app.getPath('userData'),
            app.getPath('documents'),
            app.getPath('downloads'),
            path.join(app.getPath('home'), 'Documents')
        ];
        
        // Check if path is within allowed directories
        const isAllowed = allowedDirs.some(dir => {
            const normalizedDir = path.normalize(dir);
            return resolvedPath.startsWith(normalizedDir);
        });
        
        if (!isAllowed) {
            console.error('Access denied to path:', resolvedPath);
            return;
        }
        
        // Additional security: check file exists and is readable
        if (!fs.existsSync(resolvedPath)) {
            console.error('File does not exist:', resolvedPath);
            return;
        }
        
        // Check file permissions
        try {
            fs.accessSync(resolvedPath, fs.constants.R_OK);
        } catch (error) {
            console.error('File not readable:', resolvedPath);
            return;
        }
        
        // Continue with safe file operations...
        console.log('Opening PDF file:', resolvedPath);
        
    } catch (error) {
        console.error('Error processing file path:', filePath, error);
    }
}
```

**Implementation**:
1. Path normalization and resolution
2. Directory whitelist validation
3. File existence and permission checks
4. Comprehensive error handling
5. Logging for security monitoring

---

### **Issue 5: Missing Content Security Policy**

**Severity**: 🟡 **MEDIUM**

**Location**: `electron/main.js:330-340`

**Problem**:
```javascript
// ❌ VULNERABLE CODE
webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,
    // No CSP defined - vulnerable to XSS attacks
}
```

**Risk**:
- Cross-site scripting (XSS) attacks
- Script injection vulnerabilities
- Missing protection against code injection
- Potential for malicious script execution

**Fix**:
```javascript
// ✅ SECURE CODE
// Add CSP headers in the main process
app.on('web-contents-created', (event, contents) => {
    contents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline'; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data: https:; " +
                    "connect-src 'self' http://localhost:* https://api.example.com; " +
                    "frame-src 'none'; " +
                    "object-src 'none'; " +
                    "base-uri 'self'; " +
                    "form-action 'self'; " +
                    "upgrade-insecure-requests"
                ]
            }
        });
    });
});

// Additional security headers
app.on('web-contents-created', (event, contents) => {
    contents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'X-Content-Type-Options': ['nosniff'],
                'X-Frame-Options': ['DENY'],
                'X-XSS-Protection': ['1; mode=block'],
                'Referrer-Policy': ['strict-origin-when-cross-origin']
            }
        });
    });
});
```

**Implementation**:
1. Comprehensive CSP policy
2. Additional security headers
3. Strict content type enforcement
4. XSS protection headers
5. Referrer policy configuration

---

## 🔧 **Security Best Practices Implementation**

### **1. Context Isolation**
```javascript
// ✅ Always enabled
webPreferences: {
    contextIsolation: true,  // Prevents direct Node.js access
    nodeIntegration: false,  // Disabled for security
    preload: path.join(__dirname, 'preload.js')  // Controlled API exposure
}
```

### **2. Safe IPC Communication**
```javascript
// ✅ Validate all IPC parameters
ipcMain.handle('open-file', async (event, filePath) => {
    // Validate filePath parameter
    if (typeof filePath !== 'string' || filePath.length === 0) {
        throw new Error('Invalid file path');
    }
    
    // Sanitize and validate path
    const sanitizedPath = sanitizeFilePath(filePath);
    if (!sanitizedPath) {
        throw new Error('Path validation failed');
    }
    
    // Process the file
    return await processFile(sanitizedPath);
});
```

### **3. Input Validation**
```javascript
// ✅ Validate all user inputs
function validateUserInput(input) {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string');
    }
    
    // Remove potentially dangerous characters
    const sanitized = input.replace(/[<>\"'&]/g, '');
    
    // Check length limits
    if (sanitized.length > 1000) {
        throw new Error('Input too long');
    }
    
    return sanitized;
}
```

### **4. Error Handling**
```javascript
// ✅ Secure error handling
try {
    // Sensitive operation
    const result = await sensitiveOperation();
    return result;
} catch (error) {
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
        console.error('Operation failed:', error);
    }
    
    // Return generic error to user
    throw new Error('Operation failed. Please try again.');
}
```

---

## 📋 **Security Checklist**

### **Development Environment**
- [ ] Web security enabled in all modes
- [ ] Context isolation enforced
- [ ] Preload script validates all inputs
- [ ] IPC handlers validate parameters
- [ ] File paths sanitized and validated
- [ ] External links validated
- [ ] CSP headers configured
- [ ] Error handling without information disclosure

### **Production Environment**
- [ ] Code signing implemented
- [ ] Auto-update with integrity checks
- [ ] Secure storage for sensitive data
- [ ] Logging and monitoring configured
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

### **Ongoing Security**
- [ ] Regular dependency updates
- [ ] Security audit of third-party packages
- [ ] Penetration testing
- [ ] Security monitoring and alerting
- [ ] Incident response plan
- [ ] Security training for developers

---

## 🚀 **Implementation Timeline**

### **Phase 1: Critical Fixes (Immediate)**
1. Remove web security disable flag
2. Implement file path validation
3. Add URL validation for external links

### **Phase 2: Security Hardening (1-2 weeks)**
1. Implement Content Security Policy
2. Limit process object exposure
3. Add comprehensive input validation

### **Phase 3: Monitoring & Maintenance (Ongoing)**
1. Set up security monitoring
2. Implement automated vulnerability scanning
3. Regular security reviews

---

## 📚 **Additional Resources**

- [Electron Security Documentation](https://www.electronjs.org/docs/latest/tutorial/security)
- [OWASP Electron Security Guidelines](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/migrated_content)
- [Electron Security Checklist](https://github.com/doyensec/electronegativity)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## 🔍 **Security Monitoring**

### **Logging Configuration**
```javascript
// Security event logging
function logSecurityEvent(event, details) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event: event,
        details: details,
        userAgent: navigator.userAgent,
        platform: process.platform
    };
    
    console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
        // Send to security monitoring
    }
}
```

### **Security Metrics**
- Failed authentication attempts
- Invalid file access attempts
- Blocked external links
- CSP violations
- IPC communication errors

---

This security guide should be reviewed and updated regularly as new threats emerge and security best practices evolve. 