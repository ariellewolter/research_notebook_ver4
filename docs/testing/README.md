# Testing Documentation

This directory contains test files and testing documentation for the Research Notebook application.

## Test Files

### Feature Tests
- **test-deep-linking.js** - Deep linking functionality tests
- **test-drag-drop-overlay.js** - Drag and drop overlay tests
- **test-electron-features.js** - Electron feature tests
- **test-export-functionality.js** - Export functionality tests
- **test-file-associations.js** - File association tests
- **test-file-watcher.js** - File watcher tests
- **test-frontend-deep-linking.js** - Frontend deep linking tests
- **test-full-flow.js** - Full application flow tests
- **test-full-flow-interactive.js** - Interactive full flow tests
- **test-zotero-sync.js** - Zotero synchronization tests

## Test Categories

### Core Functionality
- Deep linking and navigation
- File operations and associations
- Export and import features

### Electron Features
- Window management
- System tray integration
- File watching

### External Integrations
- Zotero synchronization
- File system operations

## Running Tests

```bash
# Run all tests
node test-full-flow.js

# Run specific feature tests
node test-deep-linking.js
node test-zotero-sync.js
```

## Test Structure

Each test file follows a consistent pattern:
1. Feature setup
2. Test execution
3. Result validation
4. Cleanup

## Related Documentation

- Implementation guides: `../implementation/`
- Electron documentation: `../electron/`

---

*Last updated: August 4, 2025* 