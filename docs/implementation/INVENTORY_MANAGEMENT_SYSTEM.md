# Inventory Management System

## Overview

The Inventory Management System is a comprehensive solution for managing laboratory inventory including chemicals, genes, reagents, and equipment. It provides real-time stock tracking, automated alerts, reorder management, and seamless export/sync capabilities.

## Features

### 🧪 Entity Management
- **Chemical Management**: Track chemical compounds with detailed specifications
- **Gene Management**: Manage genetic materials and sequences
- **Reagent Management**: Monitor laboratory reagents and kits
- **Equipment Management**: Track laboratory equipment and consumables

### 📊 Stock Tracking
- **Real-time Stock Levels**: Current inventory quantities with units
- **Stock History**: Track changes over time with usage logs
- **Stock Deduction**: Automatic stock reduction when entities are used in experiments
- **Stock Validation**: Prevent over-consumption with validation checks

### 🚨 Alert System
- **Low Stock Alerts**: Automatic notifications when stock falls below thresholds
- **Out of Stock Alerts**: Immediate alerts for critical items
- **Expiry Alerts**: Notifications for items approaching expiration
- **Priority Levels**: Urgent, High, Medium, and Low priority classifications
- **Customizable Thresholds**: Per-entity reorder thresholds

### 📋 Reorder Management
- **Reorder Lists**: Centralized management of items needing reorder
- **Priority-based Sorting**: Automatic priority assignment based on stock levels
- **Vendor Management**: Preferred vendor tracking and contact information
- **Auto-reorder**: Optional automatic addition to reorder lists
- **Reorder History**: Track past orders and delivery status

### 📍 Location & Vendor Management
- **Hierarchical Locations**: Room → Freezer → Shelf organization
- **Location Types**: Different storage types (room, freezer, cabinet, etc.)
- **Vendor Information**: Complete supplier details and contact info
- **Catalog Numbers**: Track vendor catalog numbers and lot numbers
- **Purchase History**: Maintain purchase records and warranty information

### 📤 Export & Sync
- **Multi-format Export**: CSV, JSON, and Excel formats
- **Cloud Sync**: Integration with cloud storage services
- **LIMS Integration**: Data prepared for laboratory information management systems
- **Export Jobs**: Track and manage export processes
- **Data Filtering**: Export specific data types and date ranges

## Architecture

### Database Schema

The inventory system uses the following Prisma models:

```prisma
model Chemical {
  id              String   @id @default(cuid())
  name            String
  description     String?
  stockLevel      Float
  unit            String
  location        String?
  supplier        String?
  catalogNumber   String?
  cost            Float?
  expiryDate      DateTime?
  tags            String?
  reorderThreshold Float?
  reorderQuantity Float?
  vendorInfo      String?  // JSON field
  metadata        String?  // JSON field
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  usageLogs       UsageLog[]
}

model Gene {
  id              String   @id @default(cuid())
  name            String
  description     String?
  stockLevel      Float
  unit            String
  location        String?
  supplier        String?
  catalogNumber   String?
  cost            Float?
  expiryDate      DateTime?
  tags            String?
  reorderThreshold Float?
  reorderQuantity Float?
  vendorInfo      String?  // JSON field
  metadata        String?  // JSON field
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  usageLogs       UsageLog[]
}

model Reagent {
  id              String   @id @default(cuid())
  name            String
  description     String?
  stockLevel      Float
  unit            String
  location        String?
  supplier        String?
  catalogNumber   String?
  cost            Float?
  expiryDate      DateTime?
  tags            String?
  reorderThreshold Float?
  reorderQuantity Float?
  vendorInfo      String?  // JSON field
  metadata        String?  // JSON field
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  usageLogs       UsageLog[]
}

model Equipment {
  id              String   @id @default(cuid())
  name            String
  description     String?
  stockLevel      Float
  unit            String
  location        String?
  supplier        String?
  catalogNumber   String?
  cost            Float?
  expiryDate      DateTime?
  tags            String?
  reorderThreshold Float?
  reorderQuantity Float?
  vendorInfo      String?  // JSON field
  metadata        String?  // JSON field
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  usageLogs       UsageLog[]
}

model UsageLog {
  id              String   @id @default(cuid())
  entityType      String   // 'chemical', 'gene', 'reagent', 'equipment'
  entityId        String
  entityName      String
  quantity        Float
  unit            String
  date            DateTime @default(now())
  experimentId    String?
  taskId          String?
  protocolId      String?
  notes           String?
  purpose         String?
  userId          String?
  userName        String?
  createdAt       DateTime @default(now())
  
  experiment      Experiment? @relation(fields: [experimentId], references: [id])
  task            Task? @relation(fields: [taskId], references: [id])
  protocol        Protocol? @relation(fields: [protocolId], references: [id])
}
```

### Frontend Components

#### Core Components

1. **EntityList** (`EntityList.tsx`)
   - Displays entities in a grid layout
   - Filtering and sorting capabilities
   - Quick actions for each entity

2. **EntityDetailsModal** (`EntityDetailsModal.tsx`)
   - Detailed view of entity information
   - Stock adjustment interface
   - Usage history display

3. **EntityForm** (`EntityForm.tsx`)
   - Create and edit entity forms
   - Validation and error handling
   - Vendor and location selection

#### Alert & Reorder Components

4. **EntityReorderManager** (`EntityReorderManager.tsx`)
   - Manage reorder thresholds and settings
   - Add items to reorder lists
   - Track reorder history and status

5. **InventoryAlertSystem** (`InventoryAlertSystem.tsx`)
   - Display and manage inventory alerts
   - Alert settings configuration
   - Priority-based alert filtering

#### Location & Vendor Components

6. **EntityLocationManager** (`EntityLocationManager.tsx`)
   - Hierarchical location management
   - Location type configuration
   - Storage capacity tracking

7. **EntityVendorManager** (`EntityVendorManager.tsx`)
   - Vendor information management
   - Contact details and catalog numbers
   - Purchase history tracking

#### Usage Tracking Components

8. **EntityUsageTracker** (`EntityUsageTracker.tsx`)
   - Track entity usage in experiments/tasks
   - Quantity input and validation
   - Automatic stock deduction

9. **EntityUsageHistory** (`EntityUsageHistory.tsx`)
   - Display usage history for entities
   - Filtering and sorting options
   - Usage statistics and analytics

#### Export & Sync Components

10. **InventoryExportManager** (`InventoryExportManager.tsx`)
    - Multi-format export interface
    - Export job management
    - Cloud sync integration

11. **EnhancedInventoryDashboard** (`EnhancedInventoryDashboard.tsx`)
    - Comprehensive inventory overview
    - Alert integration and quick actions
    - Advanced filtering and sorting

### Services

#### inventorySyncService.ts
- Export data in multiple formats (CSV, JSON, Excel)
- Cloud sync integration
- LIMS data preparation
- Export job management

#### entityApiService.ts
- CRUD operations for entities
- Usage logging and stock management
- Alert management
- Reorder list operations

## Usage Workflows

### Adding New Entities

1. Navigate to the Inventory Dashboard
2. Click "Add Entity" button
3. Select entity type (Chemical, Gene, Reagent, Equipment)
4. Fill in required information:
   - Name and description
   - Initial stock level and unit
   - Location and supplier information
   - Reorder threshold and quantity
5. Save the entity

### Managing Stock Levels

1. View entity in the inventory list
2. Click on entity to open details modal
3. Use stock adjustment interface to:
   - Add stock (receiving new items)
   - Remove stock (manual adjustment)
   - Set stock level (correction)
4. Add notes for the adjustment
5. Save changes

### Setting Up Alerts

1. Open entity details
2. Navigate to "Reorder Management" section
3. Configure reorder threshold
4. Set preferred vendor and reorder quantity
5. Enable auto-reorder if desired
6. Save settings

### Tracking Usage

1. When using entities in experiments/tasks:
   - Select entities from the usage tracker
   - Enter quantity used
   - Add notes and purpose
   - Log usage
2. System automatically:
   - Deducts stock levels
   - Creates usage logs
   - Triggers alerts if stock is low

### Exporting Data

1. Open Export Manager
2. Select export format (CSV, JSON, Excel)
3. Choose data to include:
   - Stock levels
   - Usage logs
   - Reorder settings
   - Vendor information
4. Set date range and filters
5. Generate export
6. Download or sync to cloud

## Configuration

### Alert Settings

```typescript
interface AlertSettings {
  enableLowStockAlerts: boolean;
  enableOutOfStockAlerts: boolean;
  enableExpiryAlerts: boolean;
  enableReorderAlerts: boolean;
  lowStockThreshold: number;
  expiryWarningDays: number;
  notificationEmail: boolean;
  notificationInApp: boolean;
  autoAddToReorderList: boolean;
}
```

### Export Options

```typescript
interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  includeStockLevels: boolean;
  includeUsageLogs: boolean;
  includeReorderSettings: boolean;
  includeVendorInfo: boolean;
  includeLocationInfo: boolean;
  includeMetadata: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  entityTypes: EntityType[];
  filters: {
    stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
    location?: string;
    vendor?: string;
  };
}
```

## API Endpoints

### Entity Management

```
GET    /api/entities/:type              # List entities by type
GET    /api/entities/:type/:id          # Get specific entity
POST   /api/entities/:type              # Create new entity
PUT    /api/entities/:type/:id          # Update entity
DELETE /api/entities/:type/:id          # Delete entity
```

### Stock Management

```
POST   /api/entities/:type/:id/stock    # Adjust stock level
GET    /api/entities/:type/:id/stock    # Get stock history
```

### Usage Tracking

```
POST   /api/usage/log                   # Log entity usage
GET    /api/usage/:entityType/:entityId # Get usage history
POST   /api/usage/bulk                  # Bulk log usage
```

### Alert Management

```
GET    /api/alerts                      # Get active alerts
POST   /api/alerts/:id/read             # Mark alert as read
POST   /api/alerts/:id/dismiss          # Dismiss alert
PUT    /api/alerts/settings             # Update alert settings
```

### Reorder Management

```
GET    /api/reorder/list                # Get reorder list
POST   /api/reorder/add                 # Add to reorder list
DELETE /api/reorder/:id                 # Remove from reorder list
PUT    /api/reorder/settings            # Update reorder settings
```

### Export & Sync

```
POST   /api/export/inventory            # Export inventory data
GET    /api/export/jobs                 # Get export jobs
DELETE /api/export/jobs/:id             # Delete export job
POST   /api/sync/cloud                  # Sync with cloud
GET    /api/sync/status                 # Get sync status
```

## Integration Points

### Cloud Sync Integration

The inventory system integrates with the existing cloud sync infrastructure:

```typescript
// Integrate with existing cloud sync
await inventorySyncService.integrateWithCloudSync();

// Prepare data for cloud sync
const inventoryData = await inventorySyncService.prepareInventoryData();
```

### LIMS Integration

Data is prepared in LIMS-compatible formats:

```typescript
// Prepare data for LIMS
const limsData = await inventorySyncService.prepareForLIMSIntegration();

// LIMS data structure
{
  inventory: {
    chemicals: Chemical[],
    reagents: Reagent[],
    equipment: Equipment[],
    genes: Gene[]
  },
  usage: UsageLog[],
  settings: ReorderSettings[],
  metadata: {
    limsCompatible: true,
    exportFormat: 'lims-standard'
  }
}
```

### App Export Integration

Inventory data is included in app-wide exports:

```typescript
// Include inventory in app exports
const appExportData = {
  // ... other app data
  inventory: await inventorySyncService.prepareInventoryData(),
  // ... other app data
};
```

## Best Practices

### Stock Management

1. **Regular Audits**: Conduct regular physical inventory counts
2. **Consistent Units**: Use standardized units across all entities
3. **Batch Tracking**: Track lot numbers and expiration dates
4. **Location Organization**: Maintain clear location hierarchy

### Alert Configuration

1. **Realistic Thresholds**: Set thresholds based on actual usage patterns
2. **Lead Time Consideration**: Account for supplier lead times
3. **Critical Items**: Set lower thresholds for critical reagents
4. **Regular Review**: Periodically review and adjust thresholds

### Data Export

1. **Regular Backups**: Export data regularly for backup purposes
2. **Format Selection**: Choose appropriate format for intended use
3. **Data Filtering**: Use filters to export relevant data only
4. **Metadata Tracking**: Include export metadata for traceability

### Usage Tracking

1. **Immediate Logging**: Log usage immediately after experiments
2. **Accurate Quantities**: Record precise quantities used
3. **Purpose Documentation**: Document the purpose of usage
4. **Batch Correlation**: Link usage to specific batches/lots

## Troubleshooting

### Common Issues

1. **Stock Discrepancies**
   - Check usage logs for missing entries
   - Verify manual adjustments were recorded
   - Review recent experiments and tasks

2. **Alert Notifications**
   - Verify alert settings are configured
   - Check notification preferences
   - Review threshold values

3. **Export Failures**
   - Check file permissions
   - Verify data format compatibility
   - Review export options

4. **Sync Issues**
   - Check network connectivity
   - Verify cloud service credentials
   - Review sync status and error logs

### Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried fields
2. **Pagination**: Use pagination for large entity lists
3. **Caching**: Cache frequently accessed data
4. **Background Processing**: Use background jobs for exports and syncs

## Future Enhancements

### Planned Features

1. **Barcode Integration**: QR code/barcode scanning for quick stock updates
2. **Supplier Integration**: Direct integration with supplier APIs
3. **Advanced Analytics**: Usage pattern analysis and forecasting
4. **Mobile App**: Mobile interface for inventory management
5. **Multi-location Support**: Support for multiple laboratory locations
6. **Advanced Reporting**: Custom report generation and scheduling

### API Extensions

1. **Webhook Support**: Real-time notifications for stock changes
2. **Bulk Operations**: Efficient bulk import/export operations
3. **Advanced Filtering**: Complex query support for data retrieval
4. **Audit Trail**: Comprehensive audit logging for compliance

## Contributing

When contributing to the inventory management system:

1. **Follow TypeScript conventions**: Use strict typing and interfaces
2. **Component Structure**: Follow established component patterns
3. **Error Handling**: Implement proper error handling and user feedback
4. **Testing**: Write tests for new features and modifications
5. **Documentation**: Update documentation for any changes

## License

This inventory management system is part of the Research Notebook application and is licensed under the MIT License. 