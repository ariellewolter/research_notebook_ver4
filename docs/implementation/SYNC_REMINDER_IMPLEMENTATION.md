# Sync Reminder Implementation

## Overview

The Sync Reminder system provides automatic monitoring and notifications for sync status across different services (Cloud Storage, Zotero, etc.). It helps users stay informed about sync issues and provides one-click actions to resolve them.

## Features

### Core Functionality
- **Automatic Monitoring**: Continuously monitors sync status for configured services
- **Configurable Thresholds**: Customizable warning and critical time thresholds
- **Error Tracking**: Monitors consecutive sync errors and alerts users
- **One-Click Sync**: Direct sync actions from notifications
- **Real-time Status**: Live sync status updates

### Notification Types
- **Warning Reminders**: When sync is overdue but not critical
- **Critical Alerts**: When sync is significantly overdue (risk of data loss)
- **Error Notifications**: When consecutive sync errors occur

## Architecture

### Frontend Components

#### 1. SyncReminderService (`apps/frontend/src/services/syncReminderService.ts`)
- Core service that manages sync monitoring
- Handles configuration and threshold management
- Creates notifications for sync issues
- Provides sync triggering functionality

**Key Methods:**
- `startMonitoring()`: Begins periodic sync status checking
- `checkSyncStatuses()`: Evaluates sync status and creates reminders
- `triggerSync(service)`: Initiates sync for a specific service
- `updateConfig(config)`: Updates monitoring configuration

#### 2. useSyncReminders Hook (`apps/frontend/src/hooks/useSyncReminders.ts`)
- React hook for integrating sync reminders with components
- Provides sync status data and actions
- Manages monitoring lifecycle

**Key Features:**
- Real-time sync status updates
- Service-specific status queries
- Configuration management
- Error handling

#### 3. NotificationCenter Component (`apps/frontend/src/components/Notifications/NotificationCenter.tsx`)
- Enhanced to display sync reminder notifications
- Provides one-click sync buttons
- Shows sync status information

**Enhancements:**
- Sync-specific notification icons
- One-click "Sync Now" buttons
- Service status information display
- Loading states for sync operations

#### 4. SyncReminderSettings Component (`apps/frontend/src/components/Notifications/SyncReminderSettings.tsx`)
- Configuration interface for sync reminders
- Threshold customization
- Test sync functionality

**Features:**
- Enable/disable monitoring
- Adjust check intervals
- Set warning and critical thresholds
- Configure error thresholds
- Test sync functionality

#### 5. SyncStatusOverview Component (`apps/frontend/src/components/Notifications/SyncStatusOverview.tsx`)
- Dashboard component showing sync status
- Quick sync actions
- Service health indicators

**Features:**
- Service status cards
- Last sync time display
- Error indicators
- Quick sync buttons
- Monitoring status

### Backend Components

#### 1. SyncNotification Model (`apps/backend/prisma/schema.prisma`)
```prisma
model SyncNotification {
  id             String    @id @default(uuid())
  service        String    // 'cloud', 'zotero', etc.
  type           String    // 'warning', 'critical', 'error'
  message        String
  scheduledFor   DateTime
  sentAt         DateTime?
  isRead         Boolean   @default(false)
  deliveryMethod String    @default("in_app")
  priority       String    @default("normal")
  metadata       String?   // JSON string with additional data
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([service])
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
}
```

#### 2. Sync Notifications API (`apps/backend/src/routes/syncNotifications.ts`)
- RESTful API for sync notification management
- CRUD operations for sync notifications
- Statistics and reporting endpoints

**Endpoints:**
- `GET /api/sync-notifications` - List notifications
- `POST /api/sync-notifications` - Create notification
- `PUT /api/sync-notifications/:id/read` - Mark as read
- `POST /api/sync-notifications/create-reminders` - Create reminder
- `GET /api/sync-notifications/stats` - Get statistics

#### 3. API Client (`apps/frontend/src/services/api/syncNotificationsApi.ts`)
- TypeScript client for sync notification API
- Type-safe API calls
- Error handling

## Configuration

### Default Settings
```typescript
{
  enabled: true,
  checkInterval: 30,        // Check every 30 minutes
  warningThreshold: 24,     // Warn after 24 hours
  criticalThreshold: 72,    // Critical after 72 hours
  errorThreshold: 3         // Alert after 3 consecutive errors
}
```

### Customization Options
- **Check Interval**: How often to check sync status (5-120 minutes)
- **Warning Threshold**: Hours before warning notification (1-168 hours)
- **Critical Threshold**: Hours before critical alert (1-720 hours)
- **Error Threshold**: Consecutive errors before alert (1-10)

## Usage Examples

### Basic Integration
```typescript
import { useSyncReminders } from '../hooks/useSyncReminders';

const MyComponent = () => {
  const {
    syncStatuses,
    config,
    triggerSync,
    getServicesNeedingSync
  } = useSyncReminders();

  const servicesNeedingSync = getServicesNeedingSync();
  
  return (
    <div>
      {servicesNeedingSync.map(service => (
        <button onClick={() => triggerSync(service.service)}>
          Sync {service.service}
        </button>
      ))}
    </div>
  );
};
```

### Configuration Management
```typescript
const { updateConfig } = useSyncReminders();

// Update warning threshold
updateConfig({
  warningThreshold: 12 // Warn after 12 hours
});

// Disable monitoring
updateConfig({
  enabled: false
});
```

### Manual Sync Triggering
```typescript
const { triggerSync } = useSyncReminders();

const handleSync = async () => {
  try {
    const success = await triggerSync('cloud');
    if (success) {
      console.log('Sync completed successfully');
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

## Notification Flow

### 1. Status Monitoring
- Service checks sync status every configured interval
- Compares last sync time against thresholds
- Tracks consecutive error counts

### 2. Notification Creation
- Creates backend notification record
- Logs to frontend notification service
- Includes metadata for retry actions

### 3. User Interaction
- User sees notification in NotificationCenter
- Can click "Sync Now" button
- Notification marked as read after successful sync

### 4. Error Handling
- Failed syncs increment error count
- Error notifications created after threshold
- Automatic retry functionality available

## Database Schema

### Migration
```sql
-- Migration: 20250805035929_add_sync_notifications
CREATE TABLE "SyncNotification" (
  "id" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "scheduledFor" DATETIME NOT NULL,
  "sentAt" DATETIME,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "deliveryMethod" TEXT NOT NULL DEFAULT 'in_app',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  PRIMARY KEY ("id")
);

CREATE INDEX "SyncNotification_service_idx" ON "SyncNotification"("service");
CREATE INDEX "SyncNotification_type_idx" ON "SyncNotification"("type");
CREATE INDEX "SyncNotification_isRead_idx" ON "SyncNotification"("isRead");
CREATE INDEX "SyncNotification_createdAt_idx" ON "SyncNotification"("createdAt");
```

## API Endpoints

### Sync Notifications
- `GET /api/sync-notifications` - List notifications with pagination
- `GET /api/sync-notifications/service/:service` - Get notifications for specific service
- `POST /api/sync-notifications` - Create new notification
- `PUT /api/sync-notifications/:id` - Update notification
- `PUT /api/sync-notifications/:id/read` - Mark as read
- `PUT /api/sync-notifications/read-all` - Mark all as read
- `DELETE /api/sync-notifications/:id` - Delete notification
- `GET /api/sync-notifications/stats` - Get notification statistics
- `POST /api/sync-notifications/create-reminders` - Create reminder notification

## Error Handling

### Frontend Errors
- Network failures during sync operations
- Invalid configuration values
- Service unavailability

### Backend Errors
- Database connection issues
- Invalid notification data
- Service integration failures

### Recovery Strategies
- Automatic retry with exponential backoff
- Fallback to local notification storage
- User notification of sync failures
- Manual sync option always available

## Performance Considerations

### Monitoring Efficiency
- Configurable check intervals to balance responsiveness and performance
- Efficient status caching to reduce API calls
- Background monitoring that doesn't block UI

### Database Optimization
- Indexed queries for fast notification retrieval
- Pagination for large notification lists
- Automatic cleanup of old notifications

### Memory Management
- Limited notification history in frontend
- Efficient state management with React hooks
- Proper cleanup of intervals and listeners

## Security Considerations

### Data Protection
- Sync credentials not stored in notifications
- Metadata sanitization before storage
- Secure API endpoints with proper validation

### Access Control
- User-specific notification isolation
- Service-specific permission checks
- Audit trail for sync operations

## Future Enhancements

### Planned Features
- Email notifications for critical alerts
- Push notifications for mobile devices
- Advanced sync scheduling
- Sync conflict resolution
- Multi-service sync coordination

### Integration Opportunities
- Calendar integration for sync scheduling
- Slack/Teams notifications
- Advanced analytics and reporting
- Machine learning for optimal sync timing

## Testing

### Unit Tests
- Service logic testing
- Configuration validation
- Error handling scenarios

### Integration Tests
- API endpoint testing
- Database operations
- Frontend-backend communication

### End-to-End Tests
- Complete notification flow
- User interaction scenarios
- Error recovery testing

## Deployment

### Prerequisites
- Database migration for SyncNotification table
- Backend API deployment
- Frontend component integration

### Configuration
- Environment variables for thresholds
- Service-specific configuration
- Monitoring enable/disable flags

### Monitoring
- Sync success/failure metrics
- Notification delivery tracking
- Performance monitoring
- Error rate tracking 