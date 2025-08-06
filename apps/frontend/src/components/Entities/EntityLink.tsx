import React, { useState, useEffect, useRef } from 'react';
import { EntityType, EntitySelection } from '../../types/entity.types';
import { entityApiService } from '../../services/api/entities';

interface EntityLinkProps {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  className?: string;
  showIcon?: boolean;
  onUsageLog?: (entityId: string, entityType: EntityType, quantity: number) => void;
}

interface EntityDetails {
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
  cost?: number;
  expiryDate?: string;
  tags?: string;
}

export const EntityLink: React.FC<EntityLinkProps> = ({
  entityId,
  entityType,
  entityName,
  className = '',
  showIcon = true,
  onUsageLog
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [entityDetails, setEntityDetails] = useState<EntityDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [usageQuantity, setUsageQuantity] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLSpanElement>(null);

  // Fetch entity details on hover
  const fetchEntityDetails = async () => {
    if (entityDetails) return; // Already loaded
    
    setLoading(true);
    try {
      const response = await entityApiService.getEntity(entityType, entityId);
      setEntityDetails(response.data);
    } catch (error) {
      console.error('Error fetching entity details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle hover events
  const handleMouseEnter = () => {
    setShowTooltip(true);
    fetchEntityDetails();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
        setShowUsageForm(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

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

  const getStockStatusText = (stockLevel: number) => {
    if (stockLevel === 0) return 'Out of Stock';
    if (stockLevel <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const handleUsageSubmit = () => {
    if (usageQuantity > 0 && onUsageLog) {
      onUsageLog(entityId, entityType, usageQuantity);
      setShowUsageForm(false);
      setUsageQuantity(0);
    }
  };

  const handleQuickUsage = (quantity: number) => {
    if (onUsageLog) {
      onUsageLog(entityId, entityType, quantity);
    }
  };

  return (
    <span className="relative inline-block">
      {/* Entity Link */}
      <span
        ref={linkRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 cursor-pointer underline ${className}`}
      >
        {showIcon && <span>{getEntityTypeIcon(entityType)}</span>}
        <span>{entityName}</span>
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-2"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            top: '100%'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : entityDetails ? (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getEntityTypeIcon(entityDetails.entityType)}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{entityDetails.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {entityDetails.entityType} • {entityDetails.type}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(entityDetails.stockLevel)}`}>
                  {getStockStatusText(entityDetails.stockLevel)}
                </span>
              </div>

              {/* Stock Information */}
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Stock</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {entityDetails.stockLevel} {entityDetails.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      entityDetails.stockLevel === 0
                        ? 'bg-red-500'
                        : entityDetails.stockLevel <= 5
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((entityDetails.stockLevel / Math.max(entityDetails.stockLevel, 10)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                {entityDetails.location && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    <span>{entityDetails.location}</span>
                  </div>
                )}
                
                {entityDetails.supplier && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">🏢</span>
                    <span>{entityDetails.supplier}</span>
                  </div>
                )}
                
                {entityDetails.catalogNumber && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">🏷️</span>
                    <span>{entityDetails.catalogNumber}</span>
                  </div>
                )}
                
                {entityDetails.cost && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">💰</span>
                    <span>${entityDetails.cost}</span>
                  </div>
                )}
                
                {entityDetails.expiryDate && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📅</span>
                    <span>Expires: {new Date(entityDetails.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {entityDetails.description && (
                <div>
                  <p className="text-sm text-gray-600">{entityDetails.description}</p>
                </div>
              )}

              {/* Tags */}
              {entityDetails.tags && (
                <div>
                  <div className="flex flex-wrap gap-1">
                    {entityDetails.tags.split(',').slice(0, 3).map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {onUsageLog && entityDetails.entityType !== 'equipment' && (
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Quick Usage</span>
                    <button
                      onClick={() => setShowUsageForm(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Custom
                    </button>
                  </div>
                  
                  {showUsageForm ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={entityDetails.stockLevel}
                          step="0.01"
                          value={usageQuantity}
                          onChange={(e) => setUsageQuantity(parseFloat(e.target.value) || 0)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder={`0 ${entityDetails.unit}`}
                        />
                        <button
                          onClick={handleUsageSubmit}
                          disabled={usageQuantity <= 0 || usageQuantity > entityDetails.stockLevel}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex space-x-1">
                      {[1, 5, 10].map((quantity) => (
                        <button
                          key={quantity}
                          onClick={() => handleQuickUsage(quantity)}
                          disabled={quantity > entityDetails.stockLevel}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {quantity} {entityDetails.unit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              Failed to load entity details
            </div>
          )}
        </div>
      )}
    </span>
  );
}; 