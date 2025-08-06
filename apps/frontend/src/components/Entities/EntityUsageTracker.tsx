import React, { useState, useEffect, useCallback } from 'react';
import { EntityType, EntitySelection, UsageLogInput } from '../../types/entity.types';
import { entityApiService } from '../../services/api/entities';
import { EntitySelector } from './EntitySelector';

interface EntityUsageTrackerProps {
  entityType: 'protocol' | 'task' | 'experiment';
  entityId: string;
  entityName: string;
  onUsageLogged?: (usageData: UsageLogInput) => void;
  onStockUpdated?: (entityId: string, newStockLevel: number) => void;
  className?: string;
}

interface EntityUsage {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  quantity: number;
  unit: string;
  currentStock: number;
  notes?: string;
  purpose?: string;
  isOverride?: boolean;
}

interface UsageSummary {
  totalEntities: number;
  totalQuantity: number;
  lowStockEntities: string[];
  outOfStockEntities: string[];
}

export const EntityUsageTracker: React.FC<EntityUsageTrackerProps> = ({
  entityType,
  entityId,
  entityName,
  onUsageLogged,
  onStockUpdated,
  className = ''
}) => {
  const [linkedEntities, setLinkedEntities] = useState<EntityUsage[]>([]);
  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usageSummary, setUsageSummary] = useState<UsageSummary>({
    totalEntities: 0,
    totalQuantity: 0,
    lowStockEntities: [],
    outOfStockEntities: []
  });

  // Load linked entities based on entity type
  const loadLinkedEntities = useCallback(async () => {
    setLoading(true);
    try {
      let entities: any[] = [];
      
      switch (entityType) {
        case 'protocol':
          // Load entities linked to protocol
          const protocolResponse = await entityApiService.getEntity('protocol', entityId);
          entities = [
            ...(protocolResponse.data.chemicals || []),
            ...(protocolResponse.data.genes || []),
            ...(protocolResponse.data.reagents || []),
            ...(protocolResponse.data.equipment || [])
          ];
          break;
        case 'task':
          // Load entities linked to task
          const taskResponse = await entityApiService.getEntity('task', entityId);
          entities = [
            ...(taskResponse.data.chemicals || []),
            ...(taskResponse.data.genes || []),
            ...(taskResponse.data.reagents || []),
            ...(taskResponse.data.equipment || [])
          ];
          break;
        case 'experiment':
          // Load entities linked to experiment
          const experimentResponse = await entityApiService.getEntity('experiment', entityId);
          entities = [
            ...(experimentResponse.data.chemicals || []),
            ...(experimentResponse.data.genes || []),
            ...(experimentResponse.data.reagents || []),
            ...(experimentResponse.data.equipment || [])
          ];
          break;
      }

      const usageEntities: EntityUsage[] = entities.map(entity => ({
        entityId: entity.id,
        entityType: entity.entityType || 'chemical',
        entityName: entity.name,
        quantity: 0,
        unit: entity.unit || 'units',
        currentStock: entity.stockLevel || 0,
        notes: '',
        purpose: `Used in ${entityType}: ${entityName}`,
        isOverride: false
      }));

      setLinkedEntities(usageEntities);
      updateUsageSummary(usageEntities);
    } catch (error) {
      console.error('Error loading linked entities:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, entityName]);

  // Update usage summary
  const updateUsageSummary = useCallback((entities: EntityUsage[]) => {
    const totalEntities = entities.length;
    const totalQuantity = entities.reduce((sum, entity) => sum + entity.quantity, 0);
    const lowStockEntities = entities
      .filter(entity => entity.currentStock <= 5 && entity.currentStock > 0)
      .map(entity => entity.entityName);
    const outOfStockEntities = entities
      .filter(entity => entity.currentStock === 0)
      .map(entity => entity.entityName);

    setUsageSummary({
      totalEntities,
      totalQuantity,
      lowStockEntities,
      outOfStockEntities
    });
  }, []);

  // Handle entity selection
  const handleEntitySelect = useCallback((entitySelection: EntitySelection) => {
    const existingIndex = linkedEntities.findIndex(e => e.entityId === entitySelection.entityId);
    
    if (existingIndex >= 0) {
      // Update existing entity
      const updatedEntities = [...linkedEntities];
      updatedEntities[existingIndex] = {
        ...updatedEntities[existingIndex],
        quantity: entitySelection.quantity || 0,
        notes: entitySelection.notes || '',
        purpose: entitySelection.purpose || `Used in ${entityType}: ${entityName}`
      };
      setLinkedEntities(updatedEntities);
      updateUsageSummary(updatedEntities);
    } else {
      // Add new entity
      const newEntity: EntityUsage = {
        entityId: entitySelection.entityId,
        entityType: entitySelection.entityType,
        entityName: entitySelection.entityName,
        quantity: entitySelection.quantity || 0,
        unit: entitySelection.unit,
        currentStock: entitySelection.currentStock,
        notes: entitySelection.notes || '',
        purpose: entitySelection.purpose || `Used in ${entityType}: ${entityName}`,
        isOverride: false
      };
      
      const updatedEntities = [...linkedEntities, newEntity];
      setLinkedEntities(updatedEntities);
      updateUsageSummary(updatedEntities);
    }
    
    setShowEntitySelector(false);
  }, [linkedEntities, entityType, entityName, updateUsageSummary]);

  // Update entity quantity
  const updateEntityQuantity = useCallback((index: number, quantity: number) => {
    const updatedEntities = [...linkedEntities];
    updatedEntities[index].quantity = quantity;
    setLinkedEntities(updatedEntities);
    updateUsageSummary(updatedEntities);
  }, [linkedEntities, updateUsageSummary]);

  // Update entity notes
  const updateEntityNotes = useCallback((index: number, notes: string) => {
    const updatedEntities = [...linkedEntities];
    updatedEntities[index].notes = notes;
    setLinkedEntities(updatedEntities);
  }, [linkedEntities]);

  // Remove entity
  const removeEntity = useCallback((index: number) => {
    const updatedEntities = linkedEntities.filter((_, i) => i !== index);
    setLinkedEntities(updatedEntities);
    updateUsageSummary(updatedEntities);
  }, [linkedEntities, updateUsageSummary]);

  // Log usage for all entities
  const logUsage = useCallback(async () => {
    if (linkedEntities.length === 0) return;

    setLoading(true);
    try {
      const usageData: UsageLogInput[] = linkedEntities
        .filter(entity => entity.quantity > 0)
        .map(entity => ({
          entityType: entity.entityType,
          entityId: entity.entityId,
          quantity: entity.quantity,
          unit: entity.unit,
          notes: entity.notes,
          purpose: entity.purpose,
          experimentId: entityType === 'experiment' ? entityId : undefined,
          taskId: entityType === 'task' ? entityId : undefined,
          protocolId: entityType === 'protocol' ? entityId : undefined
        }));

      if (usageData.length === 0) {
        console.log('No usage to log');
        return;
      }

      // Log usage based on entity type
      let response;
      switch (entityType) {
        case 'task':
          response = await entityApiService.logTaskEntityUsage(entityId, usageData);
          break;
        case 'protocol':
          response = await entityApiService.logProtocolEntityUsage(entityId, usageData);
          break;
        case 'experiment':
          response = await entityApiService.bulkLogUsage(usageData);
          break;
      }

      // Update stock levels and notify parent
      if (response?.data?.results) {
        response.data.results.forEach((result: any, index: number) => {
          if (result.success && result.data) {
            const entity = linkedEntities[index];
            onStockUpdated?.(entity.entityId, result.data.stockLevel);
            onUsageLogged?.(usageData[index]);
          }
        });
      }

      // Clear quantities after successful logging
      const clearedEntities = linkedEntities.map(entity => ({
        ...entity,
        quantity: 0,
        notes: ''
      }));
      setLinkedEntities(clearedEntities);
      updateUsageSummary(clearedEntities);

    } catch (error) {
      console.error('Error logging usage:', error);
    } finally {
      setLoading(false);
    }
  }, [linkedEntities, entityType, entityId, onUsageLogged, onStockUpdated, updateUsageSummary]);

  // Load entities on mount
  useEffect(() => {
    loadLinkedEntities();
  }, [loadLinkedEntities]);

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Entity Usage Tracker
          </h3>
          <p className="text-sm text-gray-500">
            Track usage for {entityType}: {entityName}
          </p>
        </div>
        <button
          onClick={() => setShowEntitySelector(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Entity
        </button>
      </div>

      {/* Usage Summary */}
      {usageSummary.totalEntities > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Usage Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Entities:</span>
              <span className="ml-2 font-medium">{usageSummary.totalEntities}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Quantity:</span>
              <span className="ml-2 font-medium">{usageSummary.totalQuantity}</span>
            </div>
            {usageSummary.lowStockEntities.length > 0 && (
              <div className="text-yellow-600">
                <span>Low Stock:</span>
                <span className="ml-2 font-medium">{usageSummary.lowStockEntities.length}</span>
              </div>
            )}
            {usageSummary.outOfStockEntities.length > 0 && (
              <div className="text-red-600">
                <span>Out of Stock:</span>
                <span className="ml-2 font-medium">{usageSummary.outOfStockEntities.length}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entity List */}
      {linkedEntities.length > 0 ? (
        <div className="space-y-3">
          {linkedEntities.map((entity, index) => (
            <div
              key={entity.entityId}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-lg">{getEntityTypeIcon(entity.entityType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{entity.entityName}</h4>
                      <span className={`text-sm font-medium ${getStockStatusColor(entity.currentStock)}`}>
                        {getStockStatusText(entity.currentStock)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span className="capitalize">{entity.entityType}</span>
                      <span>Stock: {entity.currentStock} {entity.unit}</span>
                    </div>
                    
                    {/* Quantity Input */}
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="text-sm text-gray-600">Quantity:</label>
                      <input
                        type="number"
                        min="0"
                        max={entity.currentStock}
                        step="0.01"
                        value={entity.quantity}
                        onChange={(e) => updateEntityQuantity(index, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">{entity.unit}</span>
                      {entity.quantity > entity.currentStock && (
                        <span className="text-red-600 text-xs">Exceeds stock!</span>
                      )}
                    </div>

                    {/* Notes Input */}
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Notes:</label>
                      <input
                        type="text"
                        value={entity.notes}
                        onChange={(e) => updateEntityNotes(index, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Optional usage notes..."
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => removeEntity(index)}
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
          <p>No entities linked to this {entityType}.</p>
          <p className="text-sm">Click "Add Entity" to link entities and track usage.</p>
        </div>
      )}

      {/* Log Usage Button */}
      {linkedEntities.some(entity => entity.quantity > 0) && (
        <div className="flex justify-end">
          <button
            onClick={logUsage}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging...' : 'Log Usage & Update Stock'}
          </button>
        </div>
      )}

      {/* Entity Selector Modal */}
      {showEntitySelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Entity for Usage Tracking
            </h3>
            <EntitySelector
              onEntitySelect={handleEntitySelect}
              placeholder="Search for entity to track usage..."
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowEntitySelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 