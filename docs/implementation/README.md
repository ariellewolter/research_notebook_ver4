# Research Notebook Implementation Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Frontend Implementation](#frontend-implementation)
4. [Backend Implementation](#backend-implementation)
5. [Database Design](#database-design)
6. [API Documentation](#api-documentation)
7. [Electron Integration](#electron-integration)
8. [Security & Compatibility](#security--compatibility)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

## Overview

The Research Notebook is a comprehensive research management application built with modern web technologies and packaged as a desktop application using Electron. It provides tools for managing research projects, protocols, data, and collaboration.

## Architecture

The application follows a modern full-stack architecture:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Prisma ORM
- **Desktop**: Electron wrapper
- **Package Manager**: pnpm with workspaces

## Frontend Implementation

### Core Technologies
- React 18 with hooks
- TypeScript for type safety
- Vite for fast development and building
- Tailwind CSS for styling
- React Router for navigation

### Key Components
- **Dashboard**: Main overview and navigation
- **Notes**: Rich text editor with markdown support
- **Projects**: Project management interface
- **Protocols**: Step-by-step protocol management
- **Database**: Data management and visualization
- **Settings**: Application configuration

### State Management
- React Context for global state
- Custom hooks for business logic
- Local storage for persistence
- Real-time updates via WebSocket

## Backend Implementation

### Core Technologies
- Node.js with Express
- TypeScript for type safety
- Prisma ORM for database operations
- JWT for authentication
- Multer for file uploads

### API Structure
- RESTful API design
- GraphQL support for complex queries
- WebSocket for real-time features
- File upload handling
- Authentication middleware

### Database Integration
- Prisma migrations for schema management
- Connection pooling
- Transaction support
- Data validation

## Database Design

### Core Entities
- **Users**: User accounts and profiles
- **Projects**: Research projects
- **Notes**: Research notes and documents
- **Protocols**: Experimental protocols
- **Data**: Research data and results
- **Collaborations**: Team collaboration features

### Relationships
- Many-to-many relationships between entities
- Hierarchical project structure
- Version control for documents
- Audit trails for changes

## API Documentation

### Authentication
```typescript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET /api/auth/profile
```

### Projects
```typescript
GET /api/projects
POST /api/projects
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
```

### Notes
```typescript
GET /api/notes
POST /api/notes
GET /api/notes/:id
PUT /api/notes/:id
DELETE /api/notes/:id
```

### Protocols
```typescript
GET /api/protocols
POST /api/protocols
GET /api/protocols/:id
PUT /api/protocols/:id
DELETE /api/protocols/:id
```

## Electron Integration

### Desktop Application Features
- Native file system access
- System tray integration
- Auto-start capabilities
- File association handling
- Multi-window support
- Native notifications

### Security Implementation
- Context isolation enabled
- Preload script for safe API exposure
- IPC communication for main-renderer process
- File system access through controlled APIs

### Build Configuration
- Cross-platform packaging (Windows, macOS, Linux)
- Code signing support
- Auto-update capabilities
- Resource bundling

## Security & Compatibility

### 🔒 **Electron Security Best Practices**

The application follows Electron security best practices to ensure a secure desktop experience:

#### **Security Features Implemented**
- ✅ **Context Isolation**: Prevents direct Node.js access from renderer
- ✅ **Preload Script**: Controlled API exposure via contextBridge
- ✅ **Web Security**: Enabled for secure content loading
- ✅ **Sandboxing**: Backend runs in separate process
- ✅ **Safe IPC**: File system access through controlled APIs

#### **Security Configuration**
```javascript
webPreferences: {
    nodeIntegration: false,        // ✅ Disabled for security
    contextIsolation: true,        // ✅ Enabled for isolation
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,             // ✅ Enabled for web security
}
```

### 🐛 **Electron Compatibility Issues & Fixes**

#### **Issue 1: Development Web Security Disabled**
**Problem**: Web security completely disabled in development mode
```javascript
// ❌ VULNERABLE CODE
additionalArguments: [
    `--disable-web-security=${isDev}`,  // Security bypass in dev
]
```

**Fix**: Remove web security disable flag
```javascript
// ✅ SECURE CODE
additionalArguments: [
    '--disable-features=VizDisplayCompositor'  // Only necessary flags
]
```

#### **Issue 2: Excessive Process Object Exposure**
**Problem**: Exposing sensitive version information
```javascript
// ❌ VULNERABLE CODE
contextBridge.exposeInMainWorld('process', {
    versions: {
        electron: process.versions.electron,
        node: process.versions.node,        // Sensitive info
        chrome: process.versions.chrome     // Sensitive info
    }
});
```

**Fix**: Limit exposed information
```javascript
// ✅ SECURE CODE
contextBridge.exposeInMainWorld('process', {
    env: { NODE_ENV: process.env.NODE_ENV },
    platform: process.platform,
    versions: {
        electron: process.versions.electron  // Only necessary version
    }
});
```

#### **Issue 3: Unvalidated External Links**
**Problem**: No URL validation before opening external links
```javascript
// ❌ VULNERABLE CODE
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);  // No validation
    return { action: 'deny' };
});
```

**Fix**: Add URL validation
```javascript
// ✅ SECURE CODE
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
            require('electron').shell.openExternal(url);
        }
        return { action: 'deny' };
    } catch (error) {
        console.error('Invalid URL:', url);
        return { action: 'deny' };
    }
});
```

#### **Issue 4: File Path Injection Vulnerability**
**Problem**: Insufficient file path validation
```javascript
// ❌ VULNERABLE CODE
function openPDFFile(filePath) {
    if (!filePath || !filePath.toLowerCase().endsWith('.pdf')) {
        return;
    }
    // No path validation or sanitization
}
```

**Fix**: Add comprehensive path validation
```javascript
// ✅ SECURE CODE
function openPDFFile(filePath) {
    try {
        const normalizedPath = path.normalize(filePath);
        const resolvedPath = path.resolve(normalizedPath);
        
        // Check if path is within allowed directories
        const allowedDirs = [app.getPath('userData'), app.getPath('documents')];
        const isAllowed = allowedDirs.some(dir => resolvedPath.startsWith(dir));
        
        if (!isAllowed) {
            console.error('Access denied to path:', resolvedPath);
            return;
        }
        
        // Continue with safe file operations...
    } catch (error) {
        console.error('Invalid file path:', filePath);
    }
}
```

#### **Issue 5: Missing Content Security Policy**
**Problem**: No CSP protection against XSS attacks
```javascript
// ❌ VULNERABLE CODE
webPreferences: {
    webSecurity: true,
    // No CSP defined
}
```

**Fix**: Implement Content Security Policy
```javascript
// ✅ SECURE CODE
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

### 🔧 **Security Checklist**

#### **Development Environment**
- [ ] Web security enabled in all modes
- [ ] Context isolation enforced
- [ ] Preload script validates all inputs
- [ ] IPC handlers validate parameters
- [ ] File paths sanitized and validated

#### **Production Environment**
- [ ] Code signing implemented
- [ ] Auto-update with integrity checks
- [ ] CSP headers configured
- [ ] Error handling without information disclosure
- [ ] Secure storage for sensitive data

#### **Ongoing Security**
- [ ] Regular dependency updates
- [ ] Security audit of third-party packages
- [ ] Penetration testing
- [ ] Security monitoring and logging
- [ ] Incident response plan

### 📋 **Compatibility Matrix**

| Feature | Windows | macOS | Linux | Notes |
|---------|---------|-------|-------|-------|
| File Associations | ✅ | ✅ | ✅ | PDF files |
| System Tray | ✅ | ✅ | ✅ | Native integration |
| Auto-start | ✅ | ✅ | ✅ | Login items |
| Notifications | ✅ | ✅ | ✅ | OS notifications |
| Multi-window | ✅ | ✅ | ✅ | Full support |
| File Watcher | ✅ | ✅ | ✅ | Cross-platform |

## Deployment

### Development Setup
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm start

# Build for production
pnpm build

# Package Electron app
pnpm electron:package
```

### Production Deployment
1. Build frontend assets
2. Package with Electron
3. Code sign application
4. Create installers
5. Distribute through secure channels

### Environment Configuration
- Development: Local SQLite database
- Production: Configured database connection
- Electron: Embedded database with user data directory

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Write comprehensive tests
3. Document new features
4. Follow security guidelines
5. Update compatibility matrix

### Security Contributions
1. Report security issues privately
2. Follow responsible disclosure
3. Provide detailed reproduction steps
4. Suggest mitigation strategies

### Code Review Process
1. Security review for all changes
2. Compatibility testing across platforms
3. Performance impact assessment
4. Documentation updates

---

This project is licensed under the MIT License - see the LICENSE file for details. 