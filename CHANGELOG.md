# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Initial setup for automated releases.

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