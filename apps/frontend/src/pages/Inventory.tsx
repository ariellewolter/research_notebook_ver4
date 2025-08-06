import React, { useState, useEffect } from 'react';
import { useStockAlerts } from '../hooks/useEntities';
import { EntityType } from '../types/entity.types';
import { EntityList } from '../components/Entities/EntityList';

interface InventoryProps {}

export const Inventory: React.FC<InventoryProps> = () => {
  const [activeTab, setActiveTab] = useState<EntityType>('chemical');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'stockLevel' | 'location' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [showEntityDetails, setShowEntityDetails] = useState(false);

  const { lowStockAlerts, expiringAlerts, fetchLowStockAlerts, fetchExpiringAlerts } = useStockAlerts();

  // Fetch alerts for all entity types
  useEffect(() => {
    fetchLowStockAlerts();
    fetchExpiringAlerts();
  }, [fetchLowStockAlerts, fetchExpiringAlerts]);

  const entityTypes: EntityType[] = ['chemical', 'gene', 'reagent', 'equipment'];

  const getEntityTypeLabel = (type: EntityType) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
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

  const getLowStockCount = (type: EntityType) => {
    return lowStockAlerts.filter(alert => alert.entityType === type).length;
  };

  const getExpiringCount = (type: EntityType) => {
    return expiringAlerts.filter(alert => alert.entityType === type).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage chemicals, genes, reagents, and equipment
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Global Alerts Summary */}
                <div className="flex items-center space-x-2">
                  {lowStockAlerts.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                      <span className="text-yellow-800 text-sm font-medium">
                        {lowStockAlerts.length} Low Stock
                      </span>
                    </div>
                  )}
                  {expiringAlerts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-full px-3 py-1">
                      <span className="text-red-800 text-sm font-medium">
                        {expiringAlerts.length} Expiring
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {entityTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{getEntityTypeIcon(type)}</span>
                <span>{getEntityTypeLabel(type)}</span>
                {(getLowStockCount(type) > 0 || getExpiringCount(type) > 0) && (
                  <div className="flex items-center space-x-1">
                    {getLowStockCount(type) > 0 && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                        {getLowStockCount(type)}
                      </span>
                    )}
                    {getExpiringCount(type) > 0 && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                        {getExpiringCount(type)}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder={`Search ${getEntityTypeLabel(activeTab)}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="stockLevel">Stock Level</option>
                <option value="location">Location</option>
                <option value="createdAt">Date Added</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            {/* Low Stock Filter */}
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Show Low Stock Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Entity List Component */}
        <EntityList
          entityType={activeTab}
          searchTerm={searchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          showLowStockOnly={showLowStockOnly}
          onEntitySelect={setSelectedEntity}
        />

        {/* Entity Details Modal */}
        {showEntityDetails && selectedEntity && (
          <EntityDetailsModal
            entity={selectedEntity}
            onClose={() => {
              setShowEntityDetails(false);
              setSelectedEntity(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Entity Details Modal Component
interface EntityDetailsModalProps {
  entity: any;
  onClose: () => void;
}

const EntityDetailsModal: React.FC<EntityDetailsModalProps> = ({ entity, onClose }) => {
  const [activeSection, setActiveSection] = useState<'details' | 'usage' | 'links'>('details');

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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getEntityTypeIcon(entity.type)}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{entity.name}</h2>
              <p className="text-sm text-gray-500">{entity.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['details', 'usage', 'links'].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeSection === section
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {section}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeSection === 'details' && (
            <EntityDetailsSection entity={entity} />
          )}
          
          {activeSection === 'usage' && (
            <EntityUsageSection entity={entity} />
          )}
          
          {activeSection === 'links' && (
            <EntityLinksSection entity={entity} />
          )}
        </div>
      </div>
    </div>
  );
};

// Entity Details Section
const EntityDetailsSection: React.FC<{ entity: any }> = ({ entity }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="text-sm text-gray-900">{entity.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <p className="text-sm text-gray-900">{entity.type}</p>
          </div>
          
          {entity.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="text-sm text-gray-900">{entity.description}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <p className="text-sm text-gray-900">{entity.location || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Stock Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Stock Information</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Stock</label>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-semibold text-gray-900">
                {entity.stockLevel} {entity.unit}
              </p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(entity.stockLevel, entity.minStockLevel)}`}>
                {getStockStatusText(entity.stockLevel, entity.minStockLevel)}
              </span>
            </div>
          </div>
          
          {entity.minStockLevel && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Stock Level</label>
              <p className="text-sm text-gray-900">{entity.minStockLevel} {entity.unit}</p>
            </div>
          )}
          
          {entity.cost && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost</label>
              <p className="text-sm text-gray-900">${entity.cost}</p>
            </div>
          )}
          
          {entity.supplier && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier</label>
              <p className="text-sm text-gray-900">{entity.supplier}</p>
            </div>
          )}
        </div>
      </div>

      {/* Entity-specific fields */}
      {entity.catalogNumber && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Catalog Number</label>
          <p className="text-sm text-gray-900">{entity.catalogNumber}</p>
        </div>
      )}
      
      {entity.expiryDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
          <p className="text-sm text-gray-900">
            {new Date(entity.expiryDate).toLocaleDateString()}
          </p>
        </div>
      )}
      
      {entity.tags && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {entity.tags.split(',').map((tag: string, index: number) => (
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
    </div>
  );
};

// Entity Usage Section
const EntityUsageSection: React.FC<{ entity: any }> = ({ entity }) => {
  // This would be populated with actual usage data from the API
  const mockUsageData = [
    {
      id: '1',
      date: '2024-01-15',
      quantity: 5,
      unit: 'mL',
      purpose: 'PCR reaction',
      notes: 'Used in experiment EXP-001'
    },
    {
      id: '2',
      date: '2024-01-10',
      quantity: 2,
      unit: 'mL',
      purpose: 'Sample preparation',
      notes: 'Used in task TASK-002'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Usage History</h3>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-4">
          Total usage: {mockUsageData.reduce((sum, usage) => sum + usage.quantity, 0)} {entity.unit}
        </div>
        
        <div className="space-y-3">
          {mockUsageData.map((usage) => (
            <div key={usage.id} className="bg-white rounded-md p-3 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">{usage.purpose}</p>
                  <p className="text-xs text-gray-500">{usage.notes}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {usage.quantity} {usage.unit}
                  </p>
                  <p className="text-xs text-gray-500">{usage.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Entity Links Section
const EntityLinksSection: React.FC<{ entity: any }> = ({ entity }) => {
  // This would be populated with actual linked data from the API
  const mockLinks = {
    notes: [
      { id: '1', title: 'PCR Protocol Notes', type: 'protocol' },
      { id: '2', title: 'Sample Preparation', type: 'experiment' }
    ],
    tasks: [
      { id: '1', title: 'Prepare PCR Master Mix', status: 'completed' },
      { id: '2', title: 'Run PCR Reaction', status: 'in_progress' }
    ],
    protocols: [
      { id: '1', name: 'Standard PCR Protocol', version: '1.0' },
      { id: '2', name: 'qPCR Protocol', version: '2.1' }
    ]
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Linked Items</h3>
      
      {/* Notes */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Notes ({mockLinks.notes.length})</h4>
        <div className="space-y-2">
          {mockLinks.notes.map((note) => (
            <div key={note.id} className="bg-gray-50 rounded-md p-3">
              <p className="text-sm font-medium text-gray-900">{note.title}</p>
              <p className="text-xs text-gray-500">{note.type}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tasks */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Tasks ({mockLinks.tasks.length})</h4>
        <div className="space-y-2">
          {mockLinks.tasks.map((task) => (
            <div key={task.id} className="bg-gray-50 rounded-md p-3">
              <p className="text-sm font-medium text-gray-900">{task.title}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Protocols */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Protocols ({mockLinks.protocols.length})</h4>
        <div className="space-y-2">
          {mockLinks.protocols.map((protocol) => (
            <div key={protocol.id} className="bg-gray-50 rounded-md p-3">
              <p className="text-sm font-medium text-gray-900">{protocol.name}</p>
              <p className="text-xs text-gray-500">Version {protocol.version}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Inventory; 