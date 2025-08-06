# Inventory Management System - Quick Reference

## 🚀 Quick Start

### Adding a New Entity
1. Navigate to **Inventory Dashboard**
2. Click **"Add Entity"** button
3. Select entity type: Chemical, Gene, Reagent, or Equipment
4. Fill in required fields (Name, Stock Level, Unit)
5. Configure optional settings (Location, Vendor, Reorder Threshold)
6. Save entity

### Setting Up Alerts
1. Open entity details
2. Go to **"Reorder Management"** section
3. Set **Reorder Threshold** (e.g., 5 units)
4. Configure **Preferred Vendor** and **Reorder Quantity**
5. Enable **Auto-reorder** if desired
6. Save settings

### Tracking Usage
1. In experiment/task interface, use **Entity Usage Tracker**
2. Select entities to use
3. Enter quantity for each entity
4. Add notes and purpose
5. Click **"Log Usage"** - stock automatically deducts

### Exporting Data
1. Open **Export Manager**
2. Select format: CSV, JSON, or Excel
3. Choose data types to include
4. Set date range and filters
5. Click **"Export Data"**

## 📋 Component Reference

### Core Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `EntityList` | Display entities | Grid layout, filtering, sorting |
| `EntityDetailsModal` | Entity details | Stock adjustment, usage history |
| `EntityForm` | Create/edit entities | Validation, vendor/location selection |

### Alert & Reorder Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `EntityReorderManager` | Reorder management | Thresholds, reorder lists, vendor info |
| `InventoryAlertSystem` | Alert management | Priority levels, settings, notifications |

### Location & Vendor Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `EntityLocationManager` | Location management | Hierarchical locations, storage types |
| `EntityVendorManager` | Vendor management | Contact info, catalog numbers, history |

### Usage Tracking Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `EntityUsageTracker` | Usage tracking | Quantity input, automatic deduction |
| `EntityUsageHistory` | Usage history | Filtering, statistics, analytics |

### Export & Sync Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `InventoryExportManager` | Export management | Multi-format, job tracking |
| `EnhancedInventoryDashboard` | Main dashboard | Overview, alerts, quick actions |

## 🔧 API Endpoints

### Entity Management
```bash
GET    /api/entities/:type              # List entities
GET    /api/entities/:type/:id          # Get entity
POST   /api/entities/:type              # Create entity
PUT    /api/entities/:type/:id          # Update entity
DELETE /api/entities/:type/:id          # Delete entity
```

### Stock Management
```bash
POST   /api/entities/:type/:id/stock    # Adjust stock
GET    /api/entities/:type/:id/stock    # Stock history
```

### Usage Tracking
```bash
POST   /api/usage/log                   # Log usage
GET    /api/usage/:entityType/:entityId # Usage history
POST   /api/usage/bulk                  # Bulk log usage
```

### Alert Management
```bash
GET    /api/alerts                      # Get alerts
POST   /api/alerts/:id/read             # Mark as read
POST   /api/alerts/:id/dismiss          # Dismiss alert
PUT    /api/alerts/settings             # Update settings
```

### Reorder Management
```bash
GET    /api/reorder/list                # Get reorder list
POST   /api/reorder/add                 # Add to list
DELETE /api/reorder/:id                 # Remove from list
PUT    /api/reorder/settings            # Update settings
```

### Export & Sync
```bash
POST   /api/export/inventory            # Export data
GET    /api/export/jobs                 # Export jobs
DELETE /api/export/jobs/:id             # Delete job
POST   /api/sync/cloud                  # Cloud sync
GET    /api/sync/status                 # Sync status
```

## 📊 Data Models

### Entity Types
```typescript
type EntityType = 'chemical' | 'gene' | 'reagent' | 'equipment';
```

### Entity Structure
```typescript
interface Entity {
  id: string;
  name: string;
  type: EntityType;
  stockLevel: number;
  unit: string;
  location?: string;
  supplier?: string;
  catalogNumber?: string;
  cost?: number;
  expiryDate?: string;
  tags?: string;
  description?: string;
  reorderThreshold?: number;
  reorderQuantity?: number;
  vendorInfo?: VendorInfo;
  metadata?: Record<string, any>;
}
```

### Usage Log Structure
```typescript
interface UsageLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  quantity: number;
  unit: string;
  date: string;
  experimentId?: string;
  taskId?: string;
  protocolId?: string;
  notes?: string;
  purpose?: string;
  userId?: string;
  userName?: string;
}
```

## 🚨 Alert Priority Levels

| Priority | Description | Stock Level | Icon |
|----------|-------------|-------------|------|
| **Urgent** | Out of stock | 0 | 🚨 |
| **High** | Critical low | ≤ 20% of threshold | ⚠️ |
| **Medium** | Low stock | ≤ 50% of threshold | 📊 |
| **Low** | Below threshold | ≤ threshold | 📋 |

## 📤 Export Formats

### CSV Format
- **Use Case**: Spreadsheet applications, data analysis
- **Features**: Human-readable, Excel compatible
- **Sections**: Entities, Usage Logs, Reorder Settings, Metadata

### JSON Format
- **Use Case**: API integration, programmatic access
- **Features**: Structured data, preserves relationships
- **Structure**: Complete data with metadata

### Excel Format
- **Use Case**: Professional reports, presentations
- **Features**: Multiple sheets, formatting
- **Sheets**: Entities, Usage, Settings, Summary

## 🔗 Integration Points

### Cloud Sync Integration
```typescript
// Integrate with existing cloud sync
await inventorySyncService.integrateWithCloudSync();

// Prepare data for sync
const inventoryData = await inventorySyncService.prepareInventoryData();
```

### LIMS Integration
```typescript
// Prepare LIMS-compatible data
const limsData = await inventorySyncService.prepareForLIMSIntegration();

// Structure includes:
{
  inventory: { chemicals, reagents, equipment, genes },
  usage: UsageLog[],
  settings: ReorderSettings[],
  metadata: { limsCompatible: true }
}
```

### App Export Integration
```typescript
// Include in app-wide exports
const appExportData = {
  // ... other app data
  inventory: await inventorySyncService.prepareInventoryData(),
  // ... other app data
};
```

## ⚡ Quick Actions

### Stock Adjustment
```typescript
// Add stock
await entityApiService.adjustStock(entityId, 'add', quantity, notes);

// Remove stock
await entityApiService.adjustStock(entityId, 'remove', quantity, notes);

// Set stock level
await entityApiService.adjustStock(entityId, 'set', newLevel, notes);
```

### Usage Logging
```typescript
// Log single usage
await entityApiService.logUsage({
  entityType: 'chemical',
  entityId: 'chem-123',
  quantity: 5,
  unit: 'g',
  experimentId: 'exp-456',
  notes: 'PCR reaction'
});

// Bulk log usage
await entityApiService.bulkLogUsage(usageData);
```

### Alert Management
```typescript
// Get active alerts
const alerts = await entityApiService.getAlerts();

// Mark alert as read
await entityApiService.markAlertAsRead(alertId);

// Dismiss alert
await entityApiService.dismissAlert(alertId);
```

## 🛠️ Configuration

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
  dateRange: { start: string; end: string };
  entityTypes: EntityType[];
  filters: {
    stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
    location?: string;
    vendor?: string;
  };
}
```

## 🔍 Troubleshooting

### Common Issues

**Stock Discrepancies**
- Check usage logs for missing entries
- Verify manual adjustments were recorded
- Review recent experiments and tasks

**Alert Notifications**
- Verify alert settings are configured
- Check notification preferences
- Review threshold values

**Export Failures**
- Check file permissions
- Verify data format compatibility
- Review export options

**Sync Issues**
- Check network connectivity
- Verify cloud service credentials
- Review sync status and error logs

### Debug Commands
```bash
# Check inventory API status
curl -X GET http://localhost:3001/api/entities/chemical

# Check sync status
curl -X GET http://localhost:3001/api/sync/status

# Test export endpoint
curl -X POST http://localhost:3001/api/export/inventory
```

## 📚 Related Documentation

- [Full Inventory Management System Documentation](./INVENTORY_MANAGEMENT_SYSTEM.md)
- [API Documentation](./api/README.md)
- [Database Schema](./database/README.md)
- [Cloud Sync Implementation](./CLOUD_SYNC_IMPLEMENTATION.md) 