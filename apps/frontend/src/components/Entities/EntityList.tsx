import React, { useState, useEffect, useMemo } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { EntityType, EntityFilters } from '../../types/entity.types';

interface EntityListProps {
  entityType: EntityType;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  showLowStockOnly?: boolean;
  onEntitySelect?: (entity: any) => void;
}

export const EntityList: React.FC<EntityListProps> = ({
  entityType,
  searchTerm = '',
  sortBy = 'name',
  sortOrder = 'asc',
  showLowStockOnly = false,
  onEntitySelect
}) => {
  const [filters, setFilters] = useState<EntityFilters>({});
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const { entities, loading, error, total, createEntity, updateEntity, deleteEntity } = useEntities(entityType, filters);

  // Apply filters based on props
  useEffect(() => {
    const newFilters: EntityFilters = {};
    
    if (searchTerm) {
      newFilters.name = searchTerm;
    }
    
    if (showLowStockOnly) {
      newFilters.lowStock = true;
    }
    
    setFilters(newFilters);
  }, [searchTerm, showLowStockOnly]);

  // Sort entities
  const sortedEntities = useMemo(() => {
    if (!entities) return [];
    
    return [...entities].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Handle date comparison
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [entities, sortBy, sortOrder]);

  const getEntityTypeIcon = (type: string) => {
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

  const getStockStatusColor = (stockLevel: number, minStockLevel?: number) => {
    if (stockLevel === 0) return 'bg-red-100 text-red-800';
    if (minStockLevel && stockLevel <= minStockLevel) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusText = (stockLevel: number, minStockLevel?: number) => {
    if (stockLevel === 0) return 'Out of Stock';
    if (minStockLevel && stockLevel <= minStockLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getStockProgressPercentage = (stockLevel: number, minStockLevel?: number) => {
    if (!minStockLevel) return 100;
    return Math.min((stockLevel / minStockLevel) * 100, 100);
  };

  const handleEntityClick = (entity: any) => {
    setSelectedEntity(entity);
    onEntitySelect?.(entity);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {entities.length} {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s
          </h3>
          {total !== entities.length && (
            <p className="text-sm text-gray-500">
              Showing {entities.length} of {total} results
            </p>
          )}
        </div>
      </div>

      {/* Entity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedEntities.map((entity) => (
          <div
            key={entity.id}
            onClick={() => handleEntityClick(entity)}
            className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${
              selectedEntity?.id === entity.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getEntityTypeIcon(entity.type)}</span>
                <div>
                  <h4 className="font-medium text-gray-900 truncate">{entity.name}</h4>
                  <p className="text-sm text-gray-500">{entity.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(entity.stockLevel, entity.minStockLevel)}`}>
                {getStockStatusText(entity.stockLevel, entity.minStockLevel)}
              </span>
            </div>

            {/* Stock Level */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">Stock Level</span>
                <span className="text-sm text-gray-900">
                  {entity.stockLevel} {entity.unit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    entity.stockLevel === 0
                      ? 'bg-red-500'
                      : entity.minStockLevel && entity.stockLevel <= entity.minStockLevel
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${getStockProgressPercentage(entity.stockLevel, entity.minStockLevel)}%` }}
                ></div>
              </div>
              {entity.minStockLevel && (
                <p className="text-xs text-gray-500 mt-1">
                  Min: {entity.minStockLevel} {entity.unit}
                </p>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2">
              {entity.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <span className="truncate">{entity.location}</span>
                </div>
              )}
              
              {entity.supplier && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🏢</span>
                  <span className="truncate">{entity.supplier}</span>
                </div>
              )}
              
              {entity.catalogNumber && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🏷️</span>
                  <span className="truncate">{entity.catalogNumber}</span>
                </div>
              )}
              
              {entity.expiryDate && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📅</span>
                  <span>Expires: {new Date(entity.expiryDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {entity.tags && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {entity.tags.split(',').slice(0, 3).map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                  {entity.tags.split(',').length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{entity.tags.split(',').length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle edit
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle usage
                }}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Log Usage
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedEntities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No {entityType}s found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || showLowStockOnly 
              ? 'Try adjusting your search or filters'
              : `Get started by adding your first ${entityType}`
            }
          </p>
          {!searchTerm && !showLowStockOnly && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Add {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}; 