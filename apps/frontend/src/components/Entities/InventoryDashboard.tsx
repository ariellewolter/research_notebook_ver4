import React, { useState, useEffect, useCallback } from 'react';
import { EntityType } from '../../types/entity.types';
import { entityApiService } from '../../services/api/entities';
import { EntityList } from './EntityList';

interface InventoryDashboardProps {
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
}

interface LocationFilter {
  type: 'all' | 'room' | 'freezer' | 'shelf' | 'cabinet' | 'drawer' | 'rack' | 'other';
  name?: string;
}

interface VendorFilter {
  name?: string;
  catalogNumber?: string;
}

interface DashboardFilters {
  entityType: EntityType;
  searchTerm: string;
  locationFilter: LocationFilter;
  vendorFilter: VendorFilter;
  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  sortBy: 'name' | 'stockLevel' | 'location' | 'supplier' | 'cost' | 'expiryDate';
  sortOrder: 'asc' | 'desc';
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  className = ''
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    entityType: 'chemical',
    searchTerm: '',
    locationFilter: { type: 'all' },
    vendorFilter: {},
    stockFilter: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableVendors, setAvailableVendors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load entities
  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await entityApiService.listEntities(filters.entityType);
      const entitiesData = response.entities || [];
      
      // Extract unique locations and vendors
      const locations = [...new Set(entitiesData.map(e => e.location).filter(Boolean))];
      const vendors = [...new Set(entitiesData.map(e => e.supplier).filter(Boolean))];
      
      setAvailableLocations(locations);
      setAvailableVendors(vendors);
      setEntities(entitiesData);
    } catch (error) {
      console.error('Error loading entities:', error);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, [filters.entityType]);

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
      if (filters.locationFilter.type !== 'all') {
        const locationType = getLocationType(entity.location);
        if (locationType !== filters.locationFilter.type) return false;
      }
      
      if (filters.locationFilter.name && entity.location !== filters.locationFilter.name) {
        return false;
      }

      // Vendor filter
      if (filters.vendorFilter.name && entity.supplier !== filters.vendorFilter.name) {
        return false;
      }
      
      if (filters.vendorFilter.catalogNumber && entity.catalogNumber !== filters.vendorFilter.catalogNumber) {
        return false;
      }

      // Stock filter
      switch (filters.stockFilter) {
        case 'in-stock':
          return entity.stockLevel > 5;
        case 'low-stock':
          return entity.stockLevel > 0 && entity.stockLevel <= 5;
        case 'out-of-stock':
          return entity.stockLevel === 0;
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

  // Get location type from location name
  const getLocationType = (location?: string): LocationFilter['type'] => {
    if (!location) return 'other';
    
    const locationLower = location.toLowerCase();
    if (locationLower.includes('room')) return 'room';
    if (locationLower.includes('freezer') || locationLower.includes('fridge') || locationLower.includes('refrigerator')) return 'freezer';
    if (locationLower.includes('shelf')) return 'shelf';
    if (locationLower.includes('cabinet')) return 'cabinet';
    if (locationLower.includes('drawer')) return 'drawer';
    if (locationLower.includes('rack')) return 'rack';
    
    return 'other';
  };

  // Get location icon
  const getLocationIcon = (location?: string) => {
    const type = getLocationType(location);
    switch (type) {
      case 'room':
        return '🏠';
      case 'freezer':
        return '❄️';
      case 'shelf':
        return '📚';
      case 'cabinet':
        return '🗄️';
      case 'drawer':
        return '📁';
      case 'rack':
        return '🧪';
      default:
        return '📍';
    }
  };

  // Get stock status color
  const getStockStatusColor = (stockLevel: number) => {
    if (stockLevel === 0) return 'text-red-600';
    if (stockLevel <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Calculate dashboard statistics
  const calculateStats = useCallback(() => {
    const filtered = filteredAndSortedEntities();
    const totalEntities = filtered.length;
    const totalValue = filtered.reduce((sum, entity) => sum + (entity.cost || 0) * entity.stockLevel, 0);
    const lowStockCount = filtered.filter(e => e.stockLevel > 0 && e.stockLevel <= 5).length;
    const outOfStockCount = filtered.filter(e => e.stockLevel === 0).length;
    const expiringSoonCount = filtered.filter(e => {
      if (!e.expiryDate) return false;
      const expiryDate = new Date(e.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    }).length;

    return {
      totalEntities,
      totalValue,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount
    };
  }, [filteredAndSortedEntities]);

  // Load entities on mount and filter changes
  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const stats = calculateStats();
  const filteredEntities = filteredAndSortedEntities();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Dashboard
          </h1>
          <p className="text-gray-500">
            Manage and track all entities with location and vendor information
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-lg">⏰</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-lg font-semibold text-gray-900">{stats.expiringSoonCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Entity Type */}
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

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search by name, description, tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stock Filter */}
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

            {/* Location Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Type
              </label>
              <select
                value={filters.locationFilter.type}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  locationFilter: { ...prev.locationFilter, type: e.target.value as LocationFilter['type'] }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                <option value="room">Rooms</option>
                <option value="freezer">Freezers/Refrigerators</option>
                <option value="shelf">Shelves</option>
                <option value="cabinet">Cabinets</option>
                <option value="drawer">Drawers</option>
                <option value="rack">Racks</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Specific Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Location
              </label>
              <select
                value={filters.locationFilter.name || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  locationFilter: { ...prev.locationFilter, name: e.target.value || undefined }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Locations</option>
                {availableLocations.map(location => (
                  <option key={location} value={location}>
                    {getLocationIcon(location)} {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={filters.vendorFilter.name || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  vendorFilter: { ...prev.vendorFilter, name: e.target.value || undefined }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Vendors</option>
                {availableVendors.map(vendor => (
                  <option key={vendor} value={vendor}>
                    🏢 {vendor}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
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

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                entityType: 'chemical',
                searchTerm: '',
                locationFilter: { type: 'all' },
                vendorFilter: {},
                stockFilter: 'all',
                sortBy: 'name',
                sortOrder: 'asc'
              })}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {filteredEntities.length} of {entities.length} entities
        </div>
        <div className="text-sm text-gray-500">
          {filters.entityType.charAt(0).toUpperCase() + filters.entityType.slice(1)} • 
          {filters.locationFilter.type !== 'all' && ` ${filters.locationFilter.type} •`}
          {filters.stockFilter !== 'all' && ` ${filters.stockFilter.replace('-', ' ')}`}
        </div>
      </div>

      {/* Entity List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      ) : filteredEntities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => (
            <div
              key={entity.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {entity.entityType === 'chemical' ? '🧪' : 
                     entity.entityType === 'gene' ? '🧬' : 
                     entity.entityType === 'reagent' ? '🔬' : '⚙️'}
                  </span>
                  <h3 className="font-medium text-gray-900 truncate">{entity.name}</h3>
                </div>
                <span className={`text-sm font-medium ${getStockStatusColor(entity.stockLevel)}`}>
                  {entity.stockLevel} {entity.unit}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600">
                {entity.location && (
                  <div className="flex items-center space-x-1">
                    <span>{getLocationIcon(entity.location)}</span>
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
                
                {entity.expiryDate && (
                  <div className="flex items-center space-x-1">
                    <span>📅</span>
                    <span>{new Date(entity.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {entity.tags && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {entity.tags.split(',').slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No entities found matching the current filters.</p>
          <p className="text-sm">Try adjusting your search criteria or filters.</p>
        </div>
      )}
    </div>
  );
}; 