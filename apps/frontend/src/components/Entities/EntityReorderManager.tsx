import React, { useState, useEffect, useCallback } from 'react';
import { EntityType } from '../../types/entity.types';

interface EntityReorderManagerProps {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  currentStock: number;
  unit: string;
  currentThreshold?: number;
  currentReorderQuantity?: number;
  onReorderSettingsUpdate?: (settings: ReorderSettings) => void;
  onAddToReorderList?: (item: ReorderItem) => void;
  className?: string;
}

interface ReorderSettings {
  threshold: number;
  reorderQuantity: number;
  autoReorder: boolean;
  preferredVendor?: string;
  notes?: string;
}

interface ReorderItem {
  id: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  currentStock: number;
  unit: string;
  reorderQuantity: number;
  threshold: number;
  preferredVendor?: string;
  notes?: string;
  addedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface ReorderList {
  items: ReorderItem[];
  totalItems: number;
  totalEstimatedCost: number;
  priorityBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const EntityReorderManager: React.FC<EntityReorderManagerProps> = ({
  entityId,
  entityType,
  entityName,
  currentStock,
  unit,
  currentThreshold = 5,
  currentReorderQuantity = 10,
  onReorderSettingsUpdate,
  onAddToReorderList,
  className = ''
}) => {
  const [reorderSettings, setReorderSettings] = useState<ReorderSettings>({
    threshold: currentThreshold,
    reorderQuantity: currentReorderQuantity,
    autoReorder: false,
    preferredVendor: '',
    notes: ''
  });
  const [showReorderSettings, setShowReorderSettings] = useState(false);
  const [showReorderList, setShowReorderList] = useState(false);
  const [reorderList, setReorderList] = useState<ReorderList>({
    items: [],
    totalItems: 0,
    totalEstimatedCost: 0,
    priorityBreakdown: { urgent: 0, high: 0, medium: 0, low: 0 }
  });
  const [loading, setLoading] = useState(false);

  // Load reorder list
  const loadReorderList = useCallback(async () => {
    setLoading(true);
    try {
      // This would typically come from an API
      // For now, using mock data
      const mockReorderList: ReorderList = {
        items: [
          {
            id: 'reorder-1',
            entityId: 'chemical-1',
            entityName: 'Sodium Chloride',
            entityType: 'chemical',
            currentStock: 2,
            unit: 'g',
            reorderQuantity: 50,
            threshold: 5,
            preferredVendor: 'Sigma-Aldrich',
            notes: 'Running low, need for upcoming experiments',
            addedAt: new Date().toISOString(),
            priority: 'high'
          },
          {
            id: 'reorder-2',
            entityId: 'reagent-1',
            entityName: 'Taq Polymerase',
            entityType: 'reagent',
            currentStock: 0,
            unit: 'units',
            reorderQuantity: 100,
            threshold: 10,
            preferredVendor: 'New England Biolabs',
            notes: 'Out of stock, critical for PCR experiments',
            addedAt: new Date().toISOString(),
            priority: 'urgent'
          }
        ],
        totalItems: 2,
        totalEstimatedCost: 245.99,
        priorityBreakdown: { urgent: 1, high: 1, medium: 0, low: 0 }
      };

      setReorderList(mockReorderList);
    } catch (error) {
      console.error('Error loading reorder list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update reorder settings
  const handleReorderSettingsUpdate = useCallback(async () => {
    try {
      onReorderSettingsUpdate?.(reorderSettings);
      setShowReorderSettings(false);
    } catch (error) {
      console.error('Error updating reorder settings:', error);
    }
  }, [reorderSettings, onReorderSettingsUpdate]);

  // Add to reorder list
  const handleAddToReorderList = useCallback(async () => {
    try {
      const reorderItem: ReorderItem = {
        id: `reorder-${Date.now()}`,
        entityId,
        entityName,
        entityType,
        currentStock,
        unit,
        reorderQuantity: reorderSettings.reorderQuantity,
        threshold: reorderSettings.threshold,
        preferredVendor: reorderSettings.preferredVendor,
        notes: reorderSettings.notes,
        addedAt: new Date().toISOString(),
        priority: getPriorityLevel(currentStock, reorderSettings.threshold)
      };

      onAddToReorderList?.(reorderItem);
      
      // Update local reorder list
      setReorderList(prev => ({
        ...prev,
        items: [...prev.items, reorderItem],
        totalItems: prev.totalItems + 1,
        priorityBreakdown: {
          ...prev.priorityBreakdown,
          [reorderItem.priority]: prev.priorityBreakdown[reorderItem.priority] + 1
        }
      }));
    } catch (error) {
      console.error('Error adding to reorder list:', error);
    }
  }, [entityId, entityName, entityType, currentStock, unit, reorderSettings, onAddToReorderList]);

  // Remove from reorder list
  const handleRemoveFromReorderList = useCallback((itemId: string) => {
    setReorderList(prev => {
      const item = prev.items.find(i => i.id === itemId);
      if (!item) return prev;

      return {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
        totalItems: prev.totalItems - 1,
        priorityBreakdown: {
          ...prev.priorityBreakdown,
          [item.priority]: prev.priorityBreakdown[item.priority] - 1
        }
      };
    });
  }, []);

  // Get priority level based on stock and threshold
  const getPriorityLevel = (stock: number, threshold: number): ReorderItem['priority'] => {
    if (stock === 0) return 'urgent';
    if (stock <= threshold * 0.2) return 'high';
    if (stock <= threshold * 0.5) return 'medium';
    return 'low';
  };

  // Get priority color
  const getPriorityColor = (priority: ReorderItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority: ReorderItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📊';
      case 'low':
        return '📋';
      default:
        return '📝';
    }
  };

  // Check if stock is low
  const isLowStock = currentStock <= reorderSettings.threshold;
  const isOutOfStock = currentStock === 0;

  // Load reorder list on mount
  useEffect(() => {
    loadReorderList();
  }, [loadReorderList]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Reorder Management
          </h3>
          <p className="text-sm text-gray-500">
            Manage reorder thresholds and inventory alerts for {entityName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowReorderList(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
          >
            View Reorder List ({reorderList.totalItems})
          </button>
          <button
            onClick={() => setShowReorderSettings(true)}
            className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Current Stock Status */}
      <div className={`p-4 rounded-lg border ${
        isOutOfStock 
          ? 'bg-red-50 border-red-200' 
          : isLowStock 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-lg">
              {isOutOfStock ? '🚨' : isLowStock ? '⚠️' : '✅'}
            </span>
            <div>
              <p className={`font-medium ${
                isOutOfStock ? 'text-red-900' : isLowStock ? 'text-yellow-900' : 'text-green-900'
              }`}>
                Current Stock: {currentStock} {unit}
              </p>
              <p className={`text-sm ${
                isOutOfStock ? 'text-red-700' : isLowStock ? 'text-yellow-700' : 'text-green-700'
              }`}>
                {isOutOfStock 
                  ? 'Out of stock - Immediate reorder needed' 
                  : isLowStock 
                    ? `Low stock - Below threshold of ${reorderSettings.threshold} ${unit}` 
                    : 'Stock level is adequate'
                }
              </p>
            </div>
          </div>
          {(isLowStock || isOutOfStock) && (
            <button
              onClick={handleAddToReorderList}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Add to Reorder List
            </button>
          )}
        </div>
      </div>

      {/* Reorder Settings */}
      {showReorderSettings && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Reorder Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Threshold ({unit})
              </label>
              <input
                type="number"
                min="0"
                value={reorderSettings.threshold}
                onChange={(e) => setReorderSettings(prev => ({ 
                  ...prev, 
                  threshold: parseInt(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Alert when stock falls below this level
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Quantity ({unit})
              </label>
              <input
                type="number"
                min="1"
                value={reorderSettings.reorderQuantity}
                onChange={(e) => setReorderSettings(prev => ({ 
                  ...prev, 
                  reorderQuantity: parseInt(e.target.value) || 1 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default quantity to reorder
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Vendor
              </label>
              <input
                type="text"
                value={reorderSettings.preferredVendor}
                onChange={(e) => setReorderSettings(prev => ({ 
                  ...prev, 
                  preferredVendor: e.target.value 
                }))}
                placeholder="e.g., Sigma-Aldrich"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoReorder"
                checked={reorderSettings.autoReorder}
                onChange={(e) => setReorderSettings(prev => ({ 
                  ...prev, 
                  autoReorder: e.target.checked 
                }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoReorder" className="ml-2 text-sm text-gray-700">
                Auto-add to reorder list when stock is low
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={reorderSettings.notes}
              onChange={(e) => setReorderSettings(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              placeholder="Additional notes for reordering..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setShowReorderSettings(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleReorderSettingsUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Reorder List Modal */}
      {showReorderList && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4xl max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Reorder List
              </h3>
              <button
                onClick={() => setShowReorderList(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600">Total Items</div>
                <div className="text-lg font-semibold text-blue-900">{reorderList.totalItems}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600">Estimated Cost</div>
                <div className="text-lg font-semibold text-green-900">${reorderList.totalEstimatedCost.toFixed(2)}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-sm text-red-600">Urgent</div>
                <div className="text-lg font-semibold text-red-900">{reorderList.priorityBreakdown.urgent}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-sm text-orange-600">High Priority</div>
                <div className="text-lg font-semibold text-orange-900">{reorderList.priorityBreakdown.high}</div>
              </div>
            </div>

            {/* Reorder Items */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading reorder list...</p>
              </div>
            ) : reorderList.items.length > 0 ? (
              <div className="space-y-3">
                {reorderList.items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="text-lg mt-0.5">
                          {item.entityType === 'chemical' ? '🧪' : 
                           item.entityType === 'gene' ? '🧬' : 
                           item.entityType === 'reagent' ? '🔬' : '⚙️'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{item.entityName}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                              {getPriorityIcon(item.priority)} {item.priority.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Current Stock:</span> {item.currentStock} {item.unit}
                            </div>
                            <div>
                              <span className="font-medium">Reorder Quantity:</span> {item.reorderQuantity} {item.unit}
                            </div>
                            <div>
                              <span className="font-medium">Threshold:</span> {item.threshold} {item.unit}
                            </div>
                            <div>
                              <span className="font-medium">Added:</span> {new Date(item.addedAt).toLocaleDateString()}
                            </div>
                          </div>

                          {item.preferredVendor && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Preferred Vendor:</span> {item.preferredVendor}
                            </p>
                          )}

                          {item.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Notes:</span> {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveFromReorderList(item.id)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No items in reorder list.</p>
                <p className="text-sm">Items will be added here when stock levels are low.</p>
              </div>
            )}

            {/* Actions */}
            {reorderList.items.length > 0 && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setReorderList({ items: [], totalItems: 0, totalEstimatedCost: 0, priorityBreakdown: { urgent: 0, high: 0, medium: 0, low: 0 } })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
                <button
                  onClick={() => console.log('Export reorder list')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Export List
                </button>
                <button
                  onClick={() => console.log('Place order')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 