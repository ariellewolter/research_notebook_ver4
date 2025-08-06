import React, { useState, useEffect, useRef } from 'react';
import { useEntities } from '../../hooks/useEntities';
import { EntityType, EntitySelection } from '../../types/entity.types';
import { entityApiService } from '../../services/api/entities';

interface EntitySelectorProps {
  onEntitySelect: (entity: EntitySelection) => void;
  entityTypes?: EntityType[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface EntitySearchResult {
  id: string;
  name: string;
  type: string;
  entityType: EntityType;
  stockLevel: number;
  unit: string;
  location?: string;
  description?: string;
  catalogNumber?: string;
  supplier?: string;
}

export const EntitySelector: React.FC<EntitySelectorProps> = ({
  onEntitySelect,
  entityTypes = ['chemical', 'gene', 'reagent', 'equipment'],
  placeholder = 'Search entities...',
  className = '',
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<EntitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search entities across all types
  const searchEntities = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const allResults: EntitySearchResult[] = [];
      
      // Search each entity type
      for (const entityType of entityTypes) {
        try {
          const response = await entityApiService.listEntities(entityType, { name: query });
          const entities = response.data.entities || [];
          
          allResults.push(...entities.map((entity: any) => ({
            id: entity.id,
            name: entity.name,
            type: entity.type,
            entityType,
            stockLevel: entity.stockLevel,
            unit: entity.unit,
            location: entity.location,
            description: entity.description,
            catalogNumber: entity.catalogNumber,
            supplier: entity.supplier
          })));
        } catch (error) {
          console.error(`Error searching ${entityType}:`, error);
        }
      }
      
      // Sort results by relevance (exact matches first, then alphabetical)
      const sortedResults = allResults.sort((a, b) => {
        const aExact = a.name.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.name.toLowerCase().startsWith(query.toLowerCase());
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return a.name.localeCompare(b.name);
      });
      
      setSearchResults(sortedResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching entities:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchEntities(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, entityTypes]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && searchResults[selectedIndex]) {
          handleEntitySelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleEntitySelect = (entity: EntitySearchResult) => {
    const entitySelection: EntitySelection = {
      entityType: entity.entityType,
      entityId: entity.id,
      entityName: entity.name,
      currentStock: entity.stockLevel,
      unit: entity.unit,
      quantity: 0, // Will be set by the parent component
      notes: '',
      purpose: ''
    };

    onEntitySelect(entitySelection);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    setSearchResults([]);
  };

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

  const getStockStatusColor = (stockLevel: number) => {
    if (stockLevel === 0) return 'text-red-600';
    if (stockLevel <= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (searchTerm || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((entity, index) => (
                <div
                  key={`${entity.entityType}-${entity.id}`}
                  onClick={() => handleEntitySelect(entity)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getEntityTypeIcon(entity.entityType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {entity.name}
                        </p>
                        <span className={`text-xs font-medium ${getStockStatusColor(entity.stockLevel)}`}>
                          {entity.stockLevel} {entity.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 capitalize">
                          {entity.entityType} • {entity.type}
                        </p>
                        {entity.location && (
                          <p className="text-xs text-gray-500 truncate">
                            📍 {entity.location}
                          </p>
                        )}
                      </div>
                      {entity.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {entity.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="p-4 text-center text-gray-500">
              No entities found for "{searchTerm}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}; 