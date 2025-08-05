# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Cloud Sync Issues**: Resolved multiple cloud sync functionality problems
  - Added missing cloud sync fields to Project and PDF database models
  - Fixed backend route conflicts in entity cloud sync endpoints
  - Resolved API response structure mismatches causing frontend errors
  - Fixed TypeScript compilation errors related to cloud sync types
  - Enabled entity cloud sync routes that were previously commented out
  - Added Zotero routes to API routes configuration
  - Updated cloud sync status API to return expected structure
  - Fixed routing conflict between `/stats/overview` and `/:entityType` routes

### Added
- **Cloud Sync Documentation**: Comprehensive documentation for cloud sync implementation
  - Detailed API endpoint documentation
  - Troubleshooting guide for common cloud sync issues
  - Implementation details for all supported cloud services
  - Security considerations and best practices

### Technical
- **Database Schema**: Added cloud sync fields to Project and PDF models
  - `cloudSynced`: Boolean field indicating sync status
  - `cloudPath`: String field for cloud storage path
  - `cloudService`: String field for cloud service type
  - `lastSynced`: DateTime field for last sync timestamp
  - `syncStatus`: String field for detailed sync status

- **API Endpoints**: Fixed and enabled cloud sync endpoints
  - `GET /api/cloud-sync/status` - Cloud sync status for all services
  - `GET /api/entity-cloud-sync/stats/overview` - Entity sync statistics
  - `GET/PUT/DELETE /api/entity-cloud-sync/:entityType/:id` - Entity sync operations
  - `GET /api/zotero/sync/status` - Zotero sync status

## [Previous Versions]

### [0.1.0] - 2024-01-XX
- Initial release
- Basic note management functionality
- Project organization features
- Database integration
- Export capabilities 