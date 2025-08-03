# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2025-08-03
### Fixed
- **PDF Download Feature**: Implemented missing PDF download functionality in Zotero integration
- **Debug Logging Cleanup**: Removed excessive debug logging from production code
- **API Response Handling**: Improved inconsistent API response structure handling
- **Navigation Error Handling**: Enhanced entity navigation error handling with route validation
- **Type Safety Issues**: Replaced 'any' types with proper TypeScript interfaces

### Added
- PDF download functionality with proper error handling and file validation
- Comprehensive TypeScript interfaces for all API entities
- Route validation before navigation attempts
- Development-only debug logging to prevent production performance issues

### Improved
- Type safety across the entire application with proper interfaces
- API response handling consistency across different endpoints
- Error handling and user feedback for navigation failures
- Code maintainability and reduced runtime errors

## [1.0.1] - 2025-08-03
### Fixed
- **Workspace New Note Functionality**: Implemented missing new note creation feature with dialog and tab integration
- **ResearchDashboard Data Structure Handling**: Fixed inconsistent API response handling with helper functions for safe data extraction
- **LiteratureNotes Entity Navigation**: Enhanced error handling and user feedback for entity navigation with proper validation

### Added
- Dialog-based new note creation in workspace with title and content fields
- Robust API response handling with helper functions to prevent runtime errors
- Comprehensive error handling and user feedback for entity navigation
- Input validation for entity properties with clear error messages

### Improved
- User experience with loading states and automatic tab opening for new notes
- Error prevention for different API response structures
- Navigation error handling with try-catch blocks and snackbar notifications

## [1.0.0] - 2025-08-03
- Initial public release with all core features implemented 