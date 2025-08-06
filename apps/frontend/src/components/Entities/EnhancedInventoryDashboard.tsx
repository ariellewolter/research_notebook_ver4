import React, { useState, useEffect, useCallback } from 'react';
import { EntityType } from '../../types/entity.types';
import { EntityReorderManager } from './EntityReorderManager';
import { InventoryAlertSystem } from './InventoryAlertSystem';

interface EnhancedInventoryDashboardProps {
  className?: string;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  entityType: EntityType;
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
  minStockLevel?: number;
}

interface DashboardFilters {
  entityType: EntityType;
  searchTerm: string;
  locationFilter: string;
  vendorFilter: string;
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  alertFilter: 'all' | 'urgent' | 'high' | 'medium';
  sortBy: 'name' | 'stockLevel' | 'location' | 'supplier' | 'cost' | 'expiryDate';
  sortOrder: 'asc' | 'desc';
}

export const EnhancedInventoryDashboard: React.FC<EnhancedInventoryDashboardProps> = ({
  className = ''
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    entityType: 'chemical',
    searchTerm: '',
    locationFilter: '',
    vendorFilter: '',
    stockFilter: 'all',
    alertFilter: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showReorderManager, setShowReorderManager] = useState(false);
  const [showAlertSystem, setShowAlertSystem] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableVendors, setAvailableVendors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load entities
  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      // This would typically come from an API
      // For now, using mock data
      const mockEntities: Entity[] = [
        {
          id: 'chemical-1',
          name: 'Sodium Chloride',
          type: 'chemical',
          entityType: 'chemical',
          stockLevel: 3,
          unit: 'g',
          location: 'Shelf A1',
          supplier: 'Sigma-Aldrich',
          catalogNumber: 'S9888',
          cost: 45.99,
          tags: 'buffer, salt, essential',
          reorderThreshold: 5,
          reorderQuantity: 50,
          minStockLevel: 5
        },
        {
          id: 'reagent-1',
          name: 'Taq Polymerase',
          type: 'reagent',
          entityType: 'reagent',
          stockLevel: 0,
          unit: 'units',
          location: 'Freezer A',
          supplier: 'New England Biolabs',
          catalogNumber: 'M0273S',
          cost: 199.99,
          tags: 'PCR, enzyme, critical',
          reorderThreshold: 10,
          reorderQuantity: 100,
          minStockLevel: 10
        },
        {
          id: 'reagent-2',
          name: 'Restriction Enzyme Mix',
          type: 'reagent',
          entityType: 'reagent',
          stockLevel: 15,
          unit: 'units',
          location: 'Freezer B',
          supplier: 'Thermo Fisher',
          catalogNumber: 'FD1234',
          cost: 89.99,
          tags: 'cloning, enzyme',
          reorderThreshold: 5,
          reorderQuantity: 50,
          minStockLevel: 5
        },
        {
          id: 'equipment-1',
          name: 'Pipette Tips',
          type: 'equipment',
          entityType: 'equipment',
          stockLevel: 50,
          unit: 'boxes',
          location: 'Cabinet 1',
          supplier: 'VWR',
          catalogNumber: 'VT123',
          cost: 25.99,
          tags: 'consumable, essential',
          reorderThreshold: 100,
          reorderQuantity: 200,
          minStockLevel: 100
        }
      ];

      // Extract unique locations and vendors
      const locations = [...new Set(mockEntities.map(e => e.location).filter(Boolean))];
      const vendors = [...new Set(mockEntities.map(e => e.supplier).filter(Boolean))];
      
      setAvailableLocations(locations);
      setAvailableVendors(vendors);
      setEntities(mockEntities);
    } catch (error) {
      console.error('Error loading entities:', error);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters and sorting
  const filteredAndSortedEntities = useCallback(() => {
    let filtered = entities.filter(entity => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          entity.name.toLowerCase().includes(searchLower) ||
          entity.description?.toLowerCase().includes(searchLower) ||
          entity.tags?.toLowerCase().includes(searchLower) ||
          entity.catalogNumber?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Location filter
      if (filters.locationFilter && entity.location !== filters.locationFilter) {
        return false;
      }

      // Vendor filter
      if (filters.vendorFilter && entity.supplier !== filters.vendorFilter) {
        return false;
      }

      // Stock filter
      switch (filters.stockFilter) {
        case 'in-stock':
          return entity.stockLevel > (entity.reorderThreshold || 5);
        case 'low-stock':
          return entity.stockLevel > 0 && entity.stockLevel <= (entity.reorderThreshold || 5);
        case 'out-of-stock':
          return entity.stockLevel === 0;
        default:
          return true;
      }

      // Alert filter
      switch (filters.alertFilter) {
        case 'urgent':
          return entity.stockLevel === 0;
        case 'high':
          return entity.stockLevel === 0 || entity.stockLevel <= (entity.reorderThreshold || 5) * 0.2;
        case 'medium':
          return entity.stockLevel <= (entity.reorderThreshold || 5) * 0.5;
        default:
          return true;
      }
    });

    // Sort entities
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stockLevel':
          aValue = a.stockLevel;
          bValue = b.stockLevel;
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
          break;
        case 'supplier':
          aValue = a.supplier || '';
          bValue = b.supplier || '';
          break;
        case 'cost':
          aValue = a.cost || 0;
          bValue = b.cost || 0;
          break;
        case 'expiryDate':
          aValue = a.expiryDate ? new Date(a.expiryDate) : new Date(0);
          bValue = b.expiryDate ? new Date(b.expiryDate) : new Date(0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [entities, filters]);

  // Calculate dashboard statistics
  const calculateStats = useCallback(() => {
    const filtered = filteredAndSortedEntities();
    const totalEntities = filtered.length;
    const totalValue = filtered.reduce((sum, entity) => sum + (entity.cost || 0) * entity.stockLevel, 0);
    const lowStockCount = filtered.filter(e => e.stockLevel > 0 && e.stockLevel <= (e.reorderThreshold || 5)).length;
    const outOfStockCount = filtered.filter(e => e.stockLevel === 0).length;
    const urgentAlerts = filtered.filter(e => e.stockLevel === 0).length;
    const highPriorityAlerts = filtered.filter(e => e.stockLevel > 0 && e.stockLevel <= (e.reorderThreshold || 5) * 0.2).length;

    return {
      totalEntities,
      totalValue,
      lowStockCount,
      outOfStockCount,
      urgentAlerts,
      highPriorityAlerts
    };
  }, [filteredAndSortedEntities]);

  // Handle quick reorder action
  const handleQuickReorder = useCallback((entity: Entity) => {
    setSelectedEntity(entity);
    setShowReorderManager(true);
  }, []);

  // Handle reorder settings update
  const handleReorderSettingsUpdate = useCallback((settings: any) => {
    console.log('Reorder settings updated:', settings);
    setShowReorderManager(false);
  }, []);

  // Handle add to reorder list
  const handleAddToReorderList = useCallback((item: any) => {
    console.log('Added to reorder list:', item);
  }, []);

  // Load entities on mount
  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const stats = calculateStats();
  const filteredEntities = filteredAndSortedEntities();

  const getEntityTypeIcon = (type: EntityType) => {
    switch (type) {
      case 'chemical':
        return '🧪';
      case 'gene':
        return '🧬';
      case 'reagent':
        return '🔬';
      case 'equipment':
        return '⚙️';
      default:
        return '📦';
    }
  };

  const getStockStatusColor = (stockLevel: number, threshold: number) => {
    if (stockLevel === 0) return 'text-red-600';
    if (stockLevel <= threshold) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusText = (stockLevel: number, threshold: number) => {
    if (stockLevel === 0) return 'Out of Stock';
    if (stockLevel <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getAlertPriority = (entity: Entity) => {
    if (entity.stockLevel === 0) return 'urgent';
    if (entity.stockLevel <= (entity.reorderThreshold || 5) * 0.2) return 'high';
    if (entity.stockLevel <= (entity.reorderThreshold || 5) * 0.5) return 'medium';
    return 'low';
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300';
      case 'high':
        return 'bg-orange-100 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-green-100 border-green-300';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Enhanced Inventory Dashboard
          </h1>
          <p className="text-gray-500">
            Manage inventory with alerts, reorder management, and quick actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAlertSystem(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            View Alerts
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-lg">📦</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalEntities}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">💰</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-gray-900">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-lg font-semibold text-gray-900">{stats.lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-lg">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-lg font-semibold text-gray-900">{stats.outOfStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-lg">🚨</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Urgent Alerts</p>
              <p className="text-lg font-semibold text-gray-900">{stats.urgentAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-lg font-semibold text-gray-900">{stats.highPriorityAlerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value as EntityType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="chemical">Chemicals</option>
                <option value="gene">Genes</option>
                <option value="reagent">Reagents</option>
                <option value="equipment">Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status
              </label>
              <select
                value={filters.stockFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, stockFilter: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Priority
              </label>
              <select
                value={filters.alertFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, alertFilter: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Alerts</option>
                <option value="urgent">Urgent Only</option>
                <option value="high">High Priority+</option>
                <option value="medium">Medium Priority+</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="stockLevel">Stock Level</option>
                <option value="location">Location</option>
                <option value="supplier">Vendor</option>
                <option value="cost">Cost</option>
                <option value="expiryDate">Expiry Date</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Search by name, description, tags, catalog number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Entity List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      ) : filteredEntities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => {
            const alertPriority = getAlertPriority(entity);
            const threshold = entity.reorderThreshold || 5;
            
            return (
              <div
                key={entity.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${getAlertColor(alertPriority)}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getEntityTypeIcon(entity.entityType)}</span>
                    <h3 className="font-medium text-gray-900 truncate">{entity.name}</h3>
                  </div>
                  <span className={`text-sm font-medium ${getStockStatusColor(entity.stockLevel, threshold)}`}>
                    {entity.stockLevel} {entity.unit}
                  </span>
                </div>

                {/* Alert Badge */}
                {alertPriority !== 'low' && (
                  <div className="mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alertPriority === 'urgent' ? 'bg-red-100 text-red-800' :
                      alertPriority === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alertPriority === 'urgent' ? '🚨 URGENT' :
                       alertPriority === 'high' ? '⚠️ HIGH PRIORITY' :
                       '📊 MEDIUM PRIORITY'}
                    </span>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  {entity.location && (
                    <div className="flex items-center space-x-1">
                      <span>📍</span>
                      <span className="truncate">{entity.location}</span>
                    </div>
                  )}
                  
                  {entity.supplier && (
                    <div className="flex items-center space-x-1">
                      <span>🏢</span>
                      <span className="truncate">{entity.supplier}</span>
                    </div>
                  )}
                  
                  {entity.catalogNumber && (
                    <div className="flex items-center space-x-1">
                      <span>🏷️</span>
                      <span>{entity.catalogNumber}</span>
                    </div>
                  )}
                  
                  {entity.cost && (
                    <div className="flex items-center space-x-1">
                      <span>💰</span>
                      <span>${entity.cost.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <span>📊</span>
                    <span>Threshold: {threshold} {entity.unit}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {getStockStatusText(entity.stockLevel, threshold)}
                  </div>
                  
                  {(entity.stockLevel <= threshold || entity.stockLevel === 0) && (
                    <button
                      onClick={() => handleQuickReorder(entity)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                    >
                      Quick Reorder
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No entities found matching the current filters.</p>
          <p className="text-sm">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Reorder Manager Modal */}
      {showReorderManager && selectedEntity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4xl max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Reorder Management - {selectedEntity.name}
              </h3>
              <button
                onClick={() => setShowReorderManager(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <EntityReorderManager
              entityId={selectedEntity.id}
              entityType={selectedEntity.entityType}
              entityName={selectedEntity.name}
              currentStock={selectedEntity.stockLevel}
              unit={selectedEntity.unit}
              currentThreshold={selectedEntity.reorderThreshold}
              currentReorderQuantity={selectedEntity.reorderQuantity}
              onReorderSettingsUpdate={handleReorderSettingsUpdate}
              onAddToReorderList={handleAddToReorderList}
            />
          </div>
        </div>
      )}

      {/* Alert System Modal */}
      {showAlertSystem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4xl max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Inventory Alert System
              </h3>
              <button
                onClick={() => setShowAlertSystem(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <InventoryAlertSystem />
          </div>
        </div>
      )}
    </div>
  );
}; 