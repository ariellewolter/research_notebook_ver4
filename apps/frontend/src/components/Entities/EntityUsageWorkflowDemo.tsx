import React, { useState } from 'react';
import { EntityUsageTracker } from './EntityUsageTracker';
import { EntityUsageHistory } from './EntityUsageHistory';
import { EntitySelector } from './EntitySelector';
import { EntityType, EntitySelection, UsageLogInput } from '../../types/entity.types';

interface EntityUsageWorkflowDemoProps {
  type: 'protocol' | 'task' | 'experiment';
}

export const EntityUsageWorkflowDemo: React.FC<EntityUsageWorkflowDemoProps> = ({
  type
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'history' | 'demo'>('demo');
  const [selectedEntity, setSelectedEntity] = useState<EntitySelection | null>(null);
  const [demoEntity, setDemoEntity] = useState({
    id: 'demo-123',
    name: 'Demo Protocol',
    type: type
  });
  const [usageLogs, setUsageLogs] = useState<UsageLogInput[]>([]);
  const [stockUpdates, setStockUpdates] = useState<Array<{ entityId: string; newStock: number }>>([]);

  const getTypeLabel = () => {
    switch (type) {
      case 'protocol':
        return 'Protocol';
      case 'task':
        return 'Task';
      case 'experiment':
        return 'Experiment';
      default:
        return 'Entity';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'protocol':
        return '📋';
      case 'task':
        return '✅';
      case 'experiment':
        return '🧪';
      default:
        return '📄';
    }
  };

  const handleUsageLogged = (usageData: UsageLogInput) => {
    setUsageLogs(prev => [...prev, usageData]);
  };

  const handleStockUpdated = (entityId: string, newStockLevel: number) => {
    setStockUpdates(prev => [...prev, { entityId, newStock: newStockLevel }]);
  };

  const handleEntitySelect = (entity: EntitySelection) => {
    setSelectedEntity(entity);
  };

  const clearDemo = () => {
    setUsageLogs([]);
    setStockUpdates([]);
    setSelectedEntity(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getTypeIcon()}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getTypeLabel()} Usage Tracking Workflow
          </h1>
          <p className="text-gray-500">
            Complete workflow for tracking entity usage and automatic stock deduction
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
            🎯 Workflow Demo
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tracker'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Usage Tracker
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📈 Usage History
          </button>
        </nav>
      </div>

      {/* Workflow Demo Tab */}
      {activeTab === 'demo' && (
        <div className="space-y-6">
          {/* Workflow Overview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              Usage Tracking Workflow Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Link Entities</h4>
                <p className="text-sm text-blue-700">
                  Link chemicals, genes, reagents, or equipment to your {type.toLowerCase()}
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Specify Usage</h4>
                <p className="text-sm text-blue-700">
                  Enter quantities used and optional notes for each entity
                </p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Auto-Deduct Stock</h4>
                <p className="text-sm text-blue-700">
                  Stock levels are automatically updated and usage is logged
                </p>
              </div>
            </div>
          </div>

          {/* Entity Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Step 1: Select Entity to Track
            </h3>
            <EntitySelector
              onEntitySelect={handleEntitySelect}
              placeholder="Search for an entity to demonstrate usage tracking..."
            />
            {selectedEntity && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {selectedEntity.entityType === 'chemical' ? '🧪' : 
                     selectedEntity.entityType === 'gene' ? '🧬' : 
                     selectedEntity.entityType === 'reagent' ? '🔬' : '⚙️'}
                  </span>
                  <div>
                    <p className="font-medium text-green-900">{selectedEntity.entityName}</p>
                    <p className="text-sm text-green-700">
                      Current stock: {selectedEntity.currentStock} {selectedEntity.unit}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Usage Tracker Demo */}
          {selectedEntity && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Step 2: Usage Tracker for {selectedEntity.entityName}
              </h3>
              <EntityUsageTracker
                entityType={type}
                entityId={demoEntity.id}
                entityName={demoEntity.name}
                onUsageLogged={handleUsageLogged}
                onStockUpdated={handleStockUpdated}
              />
            </div>
          )}

          {/* Usage History Demo */}
          {selectedEntity && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Step 3: Usage History for {selectedEntity.entityName}
              </h3>
              <EntityUsageHistory
                entityType={selectedEntity.entityType}
                entityId={selectedEntity.entityId}
                entityName={selectedEntity.entityName}
              />
            </div>
          )}

          {/* Demo Results */}
          {(usageLogs.length > 0 || stockUpdates.length > 0) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Demo Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Usage Logs */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Usage Logs Created</h4>
                  <div className="space-y-2">
                    {usageLogs.map((log, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{log.quantity} {log.unit}</span>
                          <span className="text-green-600">${log.cost?.toFixed(2) || '0.00'}</span>
                        </div>
                        {log.notes && (
                          <p className="text-gray-600 mt-1">Notes: {log.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Updates */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Stock Level Updates</h4>
                  <div className="space-y-2">
                    {stockUpdates.map((update, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="flex justify-between">
                          <span>Entity ID: {update.entityId}</span>
                          <span className="font-medium">New Stock: {update.newStock}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={clearDemo}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Clear Demo
            </button>
          </div>
        </div>
      )}

      {/* Usage Tracker Tab */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Entity Usage Tracker
            </h3>
            <EntityUsageTracker
              entityType={type}
              entityId={demoEntity.id}
              entityName={demoEntity.name}
              onUsageLogged={handleUsageLogged}
              onStockUpdated={handleStockUpdated}
            />
          </div>
        </div>
      )}

      {/* Usage History Tab */}
      {activeTab === 'history' && selectedEntity && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Entity Usage History
            </h3>
            <EntityUsageHistory
              entityType={selectedEntity.entityType}
              entityId={selectedEntity.entityId}
              entityName={selectedEntity.entityName}
            />
          </div>
        </div>
      )}

      {/* Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Automatic Stock Deduction */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">📉</span>
            <h3 className="font-medium text-gray-900">Automatic Stock Deduction</h3>
          </div>
          <p className="text-sm text-gray-600">
            When usage is logged, stock levels are automatically deducted and updated in real-time.
          </p>
        </div>

        {/* Usage Validation */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">✅</span>
            <h3 className="font-medium text-gray-900">Usage Validation</h3>
          </div>
          <p className="text-sm text-gray-600">
            Prevents logging usage that exceeds available stock levels with clear warnings.
          </p>
        </div>

        {/* Context-Aware Logging */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🎯</span>
            <h3 className="font-medium text-gray-900">Context-Aware Logging</h3>
          </div>
          <p className="text-sm text-gray-600">
            Usage logs are automatically linked to experiments, tasks, or protocols for traceability.
          </p>
        </div>

        {/* Rich Usage Data */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">📊</span>
            <h3 className="font-medium text-gray-900">Rich Usage Data</h3>
          </div>
          <p className="text-sm text-gray-600">
            Track quantities, costs, batch numbers, lot numbers, and waste generation.
          </p>
        </div>

        {/* Usage History */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">📈</span>
            <h3 className="font-medium text-gray-900">Usage History</h3>
          </div>
          <p className="text-sm text-gray-600">
            Comprehensive history with filtering, sorting, and statistical analysis.
          </p>
        </div>

        {/* Real-time Updates */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">⚡</span>
            <h3 className="font-medium text-gray-900">Real-time Updates</h3>
          </div>
          <p className="text-sm text-gray-600">
            Stock levels and usage data are updated immediately across the application.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          How to Use the Usage Tracking Workflow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">For Protocols:</h4>
            <ul className="space-y-1">
              <li>• Link required entities to protocol steps</li>
              <li>• Specify quantities when protocol is executed</li>
              <li>• Usage is logged when protocol execution is completed</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">For Tasks:</h4>
            <ul className="space-y-1">
              <li>• Link entities needed for task completion</li>
              <li>• Log usage when task is marked as completed</li>
              <li>• Track actual vs. planned usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 