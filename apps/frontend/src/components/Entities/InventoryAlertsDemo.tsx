import React, { useState } from 'react';
import { EntityReorderManager } from './EntityReorderManager';
import { InventoryAlertSystem } from './InventoryAlertSystem';
import { EnhancedInventoryDashboard } from './EnhancedInventoryDashboard';
import { EntityType } from '../../types/entity.types';

interface InventoryAlertsDemoProps {
  className?: string;
}

export const InventoryAlertsDemo: React.FC<InventoryAlertsDemoProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'dashboard' | 'reorder' | 'alerts'>('demo');
  const [selectedEntity, setSelectedEntity] = useState({
    id: 'demo-entity-123',
    name: 'Sodium Chloride',
    type: 'chemical' as EntityType,
    currentStock: 3,
    unit: 'g',
    reorderThreshold: 5,
    reorderQuantity: 50
  });

  const handleReorderSettingsUpdate = (settings: any) => {
    console.log('Reorder settings updated:', settings);
  };

  const handleAddToReorderList = (item: any) => {
    console.log('Added to reorder list:', item);
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">🚨</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Alerts & Reorder Notifications System
          </h1>
          <p className="text-gray-500">
            Comprehensive inventory management with automated alerts and reorder notifications
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
            🎯 System Overview
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Enhanced Dashboard
          </button>
          <button
            onClick={() => setActiveTab('reorder')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reorder'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Reorder Management
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🚨 Alert System
          </button>
        </nav>
      </div>

      {/* System Overview Tab */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          {/* Feature Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Inventory Alerts & Reorder System Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">🚨</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Automated Alerts</h4>
                <p className="text-sm text-blue-700">
                  Trigger alerts when stock levels fall below customizable thresholds
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">📋</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Reorder Management</h4>
                <p className="text-sm text-blue-700">
                  Set per-entity reorder thresholds and manage reorder lists
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 text-lg">⚡</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Quick Actions</h4>
                <p className="text-sm text-blue-700">
                  One-click "Add to Reorder List" actions in the inventory dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Alert Types */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Alert Types & Priority Levels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🚨</span>
                  <h4 className="font-medium text-red-900">Urgent</h4>
                </div>
                <p className="text-sm text-red-700">
                  Out of stock - Immediate action required
                </p>
              </div>
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">⚠️</span>
                  <h4 className="font-medium text-orange-900">High Priority</h4>
                </div>
                <p className="text-sm text-orange-700">
                  Stock below 20% of threshold - Reorder soon
                </p>
              </div>
              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📊</span>
                  <h4 className="font-medium text-yellow-900">Medium Priority</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Stock below 50% of threshold - Monitor closely
                </p>
              </div>
              <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">📋</span>
                  <h4 className="font-medium text-green-900">Low Priority</h4>
                </div>
                <p className="text-sm text-green-700">
                  Below reorder threshold - Consider reordering
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Process */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Alert & Reorder Workflow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Monitor Stock</h4>
                <p className="text-sm text-gray-600">
                  System continuously monitors stock levels against thresholds
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Trigger Alerts</h4>
                <p className="text-sm text-gray-600">
                  Alerts are triggered when stock falls below reorder thresholds
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                <p className="text-sm text-gray-600">
                  One-click actions to add items to reorder list
                </p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-600 font-bold">4</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Reorder Management</h4>
                <p className="text-sm text-gray-600">
                  Manage reorder lists, set quantities, and place orders
                </p>
              </div>
            </div>
          </div>

          {/* Demo Entity */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Demo Entity: {selectedEntity.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Status */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">⚠️</span>
                  <h4 className="font-medium text-yellow-900">Current Status</h4>
                </div>
                <div className="space-y-2 text-sm text-yellow-700">
                  <p><span className="font-medium">Stock Level:</span> {selectedEntity.currentStock} {selectedEntity.unit}</p>
                  <p><span className="font-medium">Reorder Threshold:</span> {selectedEntity.reorderThreshold} {selectedEntity.unit}</p>
                  <p><span className="font-medium">Status:</span> Low Stock (Below Threshold)</p>
                  <p><span className="font-medium">Priority:</span> High Priority</p>
                </div>
              </div>

              {/* Alert Information */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🚨</span>
                  <h4 className="font-medium text-red-900">Alert Information</h4>
                </div>
                <div className="space-y-2 text-sm text-red-700">
                  <p><span className="font-medium">Alert Type:</span> Low Stock Alert</p>
                  <p><span className="font-medium">Triggered:</span> When stock ≤ {selectedEntity.reorderThreshold} {selectedEntity.unit}</p>
                  <p><span className="font-medium">Action Required:</span> Add to reorder list</p>
                  <p><span className="font-medium">Suggested Quantity:</span> {selectedEntity.reorderQuantity} {selectedEntity.unit}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Per-Entity Thresholds */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">⚙️</span>
                <h3 className="font-medium text-gray-900">Per-Entity Thresholds</h3>
              </div>
              <p className="text-sm text-gray-600">
                Set custom reorder thresholds for each entity based on usage patterns and criticality.
              </p>
            </div>

            {/* Automated Alerts */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">🤖</span>
                <h3 className="font-medium text-gray-900">Automated Alerts</h3>
              </div>
              <p className="text-sm text-gray-600">
                System automatically triggers alerts when stock levels fall below configured thresholds.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">⚡</span>
                <h3 className="font-medium text-gray-900">Quick Actions</h3>
              </div>
              <p className="text-sm text-gray-600">
                One-click "Add to Reorder List" buttons directly in the inventory dashboard.
              </p>
            </div>

            {/* Priority Management */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">📊</span>
                <h3 className="font-medium text-gray-900">Priority Management</h3>
              </div>
              <p className="text-sm text-gray-600">
                Automatic priority assignment based on stock levels and entity criticality.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <EnhancedInventoryDashboard />
        </div>
      )}

      {/* Reorder Management Tab */}
      {activeTab === 'reorder' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reorder Management for {selectedEntity.name}
            </h3>
            <EntityReorderManager
              entityId={selectedEntity.id}
              entityType={selectedEntity.type}
              entityName={selectedEntity.name}
              currentStock={selectedEntity.currentStock}
              unit={selectedEntity.unit}
              currentThreshold={selectedEntity.reorderThreshold}
              currentReorderQuantity={selectedEntity.reorderQuantity}
              onReorderSettingsUpdate={handleReorderSettingsUpdate}
              onAddToReorderList={handleAddToReorderList}
            />
          </div>
        </div>
      )}

      {/* Alert System Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Inventory Alert System
            </h3>
            <InventoryAlertSystem />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          How to Use the Inventory Alerts & Reorder System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Setting Up Alerts:</h4>
            <ul className="space-y-1">
              <li>• Configure reorder thresholds for each entity</li>
              <li>• Set up alert preferences (email, in-app, auto-reorder)</li>
              <li>• Define priority levels and notification rules</li>
              <li>• Customize alert messages and actions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Managing Reorders:</h4>
            <ul className="space-y-1">
              <li>• Use quick reorder buttons in the dashboard</li>
              <li>• Review and manage the reorder list</li>
              <li>• Set preferred vendors and quantities</li>
              <li>• Track order status and delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 