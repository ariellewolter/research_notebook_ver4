import React, { useState, useEffect } from 'react';
import { useEntities, useEntity, useUsageHistory, useStockAlerts } from '../../hooks/useEntities';
import { EntityType, EntityFormData, UsageFormData, StockAdjustmentFormData } from '../../types/entity.types';

interface EntityManagementProps {
  entityType: EntityType;
  entityId?: string;
}

export const EntityManagement: React.FC<EntityManagementProps> = ({ entityType, entityId }) => {
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [filters, setFilters] = useState<any>({});

  const { entities, loading, error, total, createEntity, updateEntity, deleteEntity } = useEntities(entityType, filters);
  const { entity, updateStockLevel } = useEntity(entityType, entityId || '');
  const { usageLogs, logUsage } = useUsageHistory(entityType, entityId || '');
  const { lowStockAlerts, expiringAlerts, fetchLowStockAlerts, fetchExpiringAlerts } = useStockAlerts();

  useEffect(() => {
    if (entityId) {
      setSelectedEntity(entity);
    }
  }, [entityId, entity]);

  useEffect(() => {
    fetchLowStockAlerts(entityType);
    fetchExpiringAlerts(entityType);
  }, [entityType, fetchLowStockAlerts, fetchExpiringAlerts]);

  const handleCreateEntity = async (formData: EntityFormData) => {
    try {
      await createEntity(formData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create entity:', error);
    }
  };

  const handleUpdateEntity = async (formData: EntityFormData) => {
    if (!entityId) return;
    
    try {
      await updateEntity(formData);
    } catch (error) {
      console.error('Failed to update entity:', error);
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entity?')) {
      try {
        await deleteEntity(id);
      } catch (error) {
        console.error('Failed to delete entity:', error);
      }
    }
  };

  const handleLogUsage = async (formData: UsageFormData) => {
    if (!entityId) return;
    
    try {
      await logUsage(formData);
      setShowUsageForm(false);
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
  };

  const handleStockAdjustment = async (formData: StockAdjustmentFormData) => {
    if (!entityId) return;
    
    try {
      await updateStockLevel(formData.quantity, formData.operation, formData.notes);
      setShowStockForm(false);
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  const getEntityTypeLabel = (type: EntityType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStockStatusColor = (stockLevel: number, minStockLevel?: number) => {
    if (stockLevel === 0) return 'text-red-600';
    if (minStockLevel && stockLevel <= minStockLevel) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStockStatusText = (stockLevel: number, minStockLevel?: number) => {
    if (stockLevel === 0) return 'Out of Stock';
    if (minStockLevel && stockLevel <= minStockLevel) return 'Low Stock';
    return 'In Stock';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {getEntityTypeLabel(entityType)} Management
        </h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add {getEntityTypeLabel(entityType)}
        </button>
      </div>

      {/* Alerts */}
      {(lowStockAlerts.length > 0 || expiringAlerts.length > 0) && (
        <div className="space-y-4">
          {lowStockAlerts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-yellow-800 font-medium">Low Stock Alerts ({lowStockAlerts.length})</h3>
              <div className="mt-2 space-y-1">
                {lowStockAlerts.slice(0, 3).map((alert: any) => (
                  <div key={alert.id} className="text-yellow-700 text-sm">
                    {alert.name} - {alert.stockLevel} {alert.unit} remaining
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {expiringAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-red-800 font-medium">Expiring Soon ({expiringAlerts.length})</h3>
              <div className="mt-2 space-y-1">
                {expiringAlerts.slice(0, 3).map((alert: any) => (
                  <div key={alert.id} className="text-red-700 text-sm">
                    {alert.name} - expires {new Date(alert.expiryDate).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            className="border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Location..."
            className="border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) => setFilters(prev => ({ ...prev, lowStock: e.target.value === 'true' }))}
          >
            <option value="">All Stock Levels</option>
            <option value="true">Low Stock Only</option>
          </select>
        </div>
      </div>

      {/* Entity List */}
      <div className="bg-white border border-gray-200 rounded-md">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {getEntityTypeLabel(entityType)} List ({total})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entities.map((entity: any) => (
                <tr key={entity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                    {entity.description && (
                      <div className="text-sm text-gray-500">{entity.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entity.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {entity.stockLevel} {entity.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entity.location || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getStockStatusColor(entity.stockLevel, entity.minStockLevel)}`}>
                      {getStockStatusText(entity.stockLevel, entity.minStockLevel)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setSelectedEntity(entity)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteEntity(entity.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entity Details Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedEntity.name} Details
              </h3>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Level</label>
                  <div className="text-lg font-semibold">
                    {selectedEntity.stockLevel} {selectedEntity.unit}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className={`text-lg font-semibold ${getStockStatusColor(selectedEntity.stockLevel, selectedEntity.minStockLevel)}`}>
                    {getStockStatusText(selectedEntity.stockLevel, selectedEntity.minStockLevel)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowUsageForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Log Usage
                </button>
                <button
                  onClick={() => setShowStockForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Form Modal */}
      {showUsageForm && selectedEntity && (
        <UsageForm
          entity={selectedEntity}
          onSubmit={handleLogUsage}
          onCancel={() => setShowUsageForm(false)}
        />
      )}

      {/* Stock Adjustment Form Modal */}
      {showStockForm && selectedEntity && (
        <StockAdjustmentForm
          entity={selectedEntity}
          onSubmit={handleStockAdjustment}
          onCancel={() => setShowStockForm(false)}
        />
      )}

      {/* Create Entity Form Modal */}
      {showCreateForm && (
        <EntityForm
          entityType={entityType}
          onSubmit={handleCreateEntity}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

// Usage Form Component
interface UsageFormProps {
  entity: any;
  onSubmit: (data: UsageFormData) => void;
  onCancel: () => void;
}

const UsageForm: React.FC<UsageFormProps> = ({ entity, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<UsageFormData>({
    quantity: 0,
    unit: entity.unit,
    notes: '',
    purpose: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Log Usage</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={entity.stockLevel}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Available: {entity.stockLevel} {entity.unit}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Purpose</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Log Usage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Adjustment Form Component
interface StockAdjustmentFormProps {
  entity: any;
  onSubmit: (data: StockAdjustmentFormData) => void;
  onCancel: () => void;
}

const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({ entity, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<StockAdjustmentFormData>({
    quantity: 0,
    operation: 'add',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Adjust Stock</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Operation</label>
            <select
              value={formData.operation}
              onChange={(e) => setFormData(prev => ({ ...prev, operation: e.target.value as 'add' | 'subtract' | 'set' }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="add">Add Stock</option>
              <option value="subtract">Subtract Stock</option>
              <option value="set">Set Stock Level</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Current: {entity.stockLevel} {entity.unit}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Adjust Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Entity Form Component
interface EntityFormProps {
  entityType: EntityType;
  onSubmit: (data: EntityFormData) => void;
  onCancel: () => void;
}

const EntityForm: React.FC<EntityFormProps> = ({ entityType, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<EntityFormData>({
    name: '',
    type: '',
    description: '',
    stockLevel: 0,
    unit: '',
    location: '',
    cost: 0,
    supplier: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create {entityType}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock Level</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.stockLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, stockLevel: parseFloat(e.target.value) || 0 }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 