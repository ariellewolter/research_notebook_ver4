import React, { useState } from 'react';
import { EntityLocationManager } from './EntityLocationManager';
import { EntityVendorManager } from './EntityVendorManager';
import { InventoryDashboard } from './InventoryDashboard';
import { EntityType } from '../../types/entity.types';

interface LocationVendorDemoProps {
  className?: string;
}

export const LocationVendorDemo: React.FC<LocationVendorDemoProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'location' | 'vendor' | 'demo'>('demo');
  const [selectedEntity, setSelectedEntity] = useState({
    id: 'demo-entity-123',
    name: 'Sodium Chloride',
    type: 'chemical' as EntityType,
    currentLocation: 'Shelf A1',
    currentVendorInfo: {
      name: 'Sigma-Aldrich',
      catalogNumber: 'S9888',
      purchaseDate: '2024-01-15',
      cost: 45.99,
      lotNumber: 'BCBW1234',
      supplierContact: 'John Smith',
      supplierEmail: 'orders@sigmaaldrich.com',
      supplierPhone: '+1-800-325-3010',
      supplierWebsite: 'https://www.sigmaaldrich.com'
    }
  });

  const handleLocationUpdate = (location: string) => {
    setSelectedEntity(prev => ({
      ...prev,
      currentLocation: location
    }));
  };

  const handleVendorUpdate = (vendorInfo: any) => {
    setSelectedEntity(prev => ({
      ...prev,
      currentVendorInfo: vendorInfo
    }));
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">🏢</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Location & Vendor Management System
          </h1>
          <p className="text-gray-500">
            Comprehensive inventory management with location tracking and vendor information
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('demo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'demo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Demo Overview
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Inventory Dashboard
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'location'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📍 Location Management
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vendor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏢 Vendor Management
          </button>
        </nav>
      </div>

      {/* Demo Overview Tab */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          {/* Feature Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Location & Vendor Management Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">📍</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Storage Location Tracking</h4>
                <p className="text-sm text-blue-700">
                  Assign and track entities across rooms, freezers, shelves, cabinets, and more
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">🏢</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Vendor Information Management</h4>
                <p className="text-sm text-blue-700">
                  Track vendor details, catalog numbers, purchase dates, and costs
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">🔍</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Advanced Filtering</h4>
                <p className="text-sm text-blue-700">
                  Filter inventory by location, vendor, stock level, and more
                </p>
              </div>
            </div>
          </div>

          {/* Current Entity Demo */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Demo Entity: {selectedEntity.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location Information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">📍</span>
                  <h4 className="font-medium text-green-900">Current Location</h4>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <p><span className="font-medium">Location:</span> {selectedEntity.currentLocation}</p>
                  <p><span className="font-medium">Type:</span> {selectedEntity.currentLocation.includes('Shelf') ? 'Shelf' : 'Other'}</p>
                  <p><span className="font-medium">Parent:</span> Lab Room 101</p>
                </div>
              </div>

              {/* Vendor Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🏢</span>
                  <h4 className="font-medium text-blue-900">Vendor Information</h4>
                </div>
                <div className="space-y-2 text-sm text-blue-700">
                  <p><span className="font-medium">Vendor:</span> {selectedEntity.currentVendorInfo.name}</p>
                  <p><span className="font-medium">Catalog #:</span> {selectedEntity.currentVendorInfo.catalogNumber}</p>
                  <p><span className="font-medium">Cost:</span> ${selectedEntity.currentVendorInfo.cost}</p>
                  <p><span className="font-medium">Purchase Date:</span> {new Date(selectedEntity.currentVendorInfo.purchaseDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Hierarchy */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Location Hierarchy System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl mb-2 block">🏠</span>
                <h4 className="font-medium text-gray-900">Rooms</h4>
                <p className="text-sm text-gray-500">Lab Room 101, 102, Storage Room</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl mb-2 block">❄️</span>
                <h4 className="font-medium text-gray-900">Freezers</h4>
                <p className="text-sm text-gray-500">-20°C, -80°C, 4°C Refrigerator</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl mb-2 block">📚</span>
                <h4 className="font-medium text-gray-900">Shelves</h4>
                <p className="text-sm text-gray-500">Shelf A1, A2, B1, B2</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl mb-2 block">🗄️</span>
                <h4 className="font-medium text-gray-900">Cabinets</h4>
                <p className="text-sm text-gray-500">Chemical Cabinet, Equipment Cabinet</p>
              </div>
            </div>
          </div>

          {/* Vendor Examples */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Vendor Management Examples
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <h4 className="font-medium text-gray-900">Sigma-Aldrich</h4>
                </div>
                <p className="text-sm text-gray-600">Chemical supplier</p>
                <p className="text-xs text-gray-500">orders@sigmaaldrich.com</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <h4 className="font-medium text-gray-900">Thermo Fisher</h4>
                </div>
                <p className="text-sm text-gray-600">Equipment supplier</p>
                <p className="text-xs text-gray-500">orders@thermofisher.com</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <h4 className="font-medium text-gray-900">New England Biolabs</h4>
                </div>
                <p className="text-sm text-gray-600">Reagent supplier</p>
                <p className="text-xs text-gray-500">orders@neb.com</p>
              </div>
            </div>
          </div>

          {/* Visual Indicators */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Visual Indicators & Filtering
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Location Icons</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🏠</span>
                    <span className="text-sm text-gray-600">Rooms</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">❄️</span>
                    <span className="text-sm text-gray-600">Freezers/Refrigerators</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📚</span>
                    <span className="text-sm text-gray-600">Shelves</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🗄️</span>
                    <span className="text-sm text-gray-600">Cabinets</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📁</span>
                    <span className="text-sm text-gray-600">Drawers</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🧪</span>
                    <span className="text-sm text-gray-600">Racks</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Stock Status Colors</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">In Stock (>5 units)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm text-gray-600">Low Stock (1-5 units)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-600">Out of Stock (0 units)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <InventoryDashboard />
        </div>
      )}

      {/* Location Management Tab */}
      {activeTab === 'location' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Location Management for {selectedEntity.name}
            </h3>
            <EntityLocationManager
              entityId={selectedEntity.id}
              entityType={selectedEntity.type}
              entityName={selectedEntity.name}
              currentLocation={selectedEntity.currentLocation}
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </div>
      )}

      {/* Vendor Management Tab */}
      {activeTab === 'vendor' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Vendor Management for {selectedEntity.name}
            </h3>
            <EntityVendorManager
              entityId={selectedEntity.id}
              entityType={selectedEntity.type}
              entityName={selectedEntity.name}
              currentVendorInfo={selectedEntity.currentVendorInfo}
              onVendorUpdate={handleVendorUpdate}
            />
          </div>
        </div>
      )}

      {/* Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Location Tracking */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">📍</span>
            <h3 className="font-medium text-gray-900">Location Tracking</h3>
          </div>
          <p className="text-sm text-gray-600">
            Hierarchical location system with visual indicators for easy identification and filtering.
          </p>
        </div>

        {/* Vendor Management */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🏢</span>
            <h3 className="font-medium text-gray-900">Vendor Management</h3>
          </div>
          <p className="text-sm text-gray-600">
            Comprehensive vendor information including contact details, catalog numbers, and purchase history.
          </p>
        </div>

        {/* Advanced Filtering */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🔍</span>
            <h3 className="font-medium text-gray-900">Advanced Filtering</h3>
          </div>
          <p className="text-sm text-gray-600">
            Filter inventory by location type, vendor, stock level, and other criteria for efficient management.
          </p>
        </div>

        {/* Visual Indicators */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🎨</span>
            <h3 className="font-medium text-gray-900">Visual Indicators</h3>
          </div>
          <p className="text-sm text-gray-600">
            Color-coded stock levels and location icons for quick visual identification and status assessment.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          How to Use Location & Vendor Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Location Management:</h4>
            <ul className="space-y-1">
              <li>• Assign storage locations to entities</li>
              <li>• Use hierarchical location system</li>
              <li>• Filter inventory by location type</li>
              <li>• Add new locations as needed</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Vendor Management:</h4>
            <ul className="space-y-1">
              <li>• Track vendor information and contacts</li>
              <li>• Record catalog numbers and costs</li>
              <li>• Monitor purchase dates and lot numbers</li>
              <li>• Filter by vendor for procurement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 