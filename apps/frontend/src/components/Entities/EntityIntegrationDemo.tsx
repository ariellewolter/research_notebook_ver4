import React, { useState } from 'react';
import { EntityLinkManager } from './EntityLinkManager';
import { EntitySelector } from './EntitySelector';
import { EntityType, EntitySelection } from '../../types/entity.types';

interface EntityIntegrationDemoProps {
  type: 'note' | 'protocol' | 'task';
  id?: string;
}

export const EntityIntegrationDemo: React.FC<EntityIntegrationDemoProps> = ({
  type,
  id
}) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<EntitySelection[]>([]);
  const [showEntitySelector, setShowEntitySelector] = useState(false);

  const getTypeLabel = () => {
    switch (type) {
      case 'note':
        return 'Note';
      case 'protocol':
        return 'Protocol';
      case 'task':
        return 'Task';
      default:
        return 'Content';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'note':
        return '📝';
      case 'protocol':
        return '📋';
      case 'task':
        return '✅';
      default:
        return '📄';
    }
  };

  const handleEntitySelect = (entity: EntitySelection) => {
    setSelectedEntities(prev => [...prev, entity]);
    setShowEntitySelector(false);
  };

  const handleRemoveEntity = (index: number) => {
    setSelectedEntities(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // This would save the content and create usage logs for linked entities
    console.log('Saving content:', {
      type,
      id,
      title,
      content,
      linkedEntities: selectedEntities
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getTypeIcon()}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getTypeLabel()} Editor
          </h1>
          <p className="text-gray-500">
            Create a {type.toLowerCase()} with entity linking and usage tracking
          </p>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getTypeLabel()} Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Enter ${type.toLowerCase()} title...`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Content Editor with Entity Linking */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <EntityLinkManager
          content={content}
          onContentChange={setContent}
          experimentId={type === 'note' ? id : undefined}
          taskId={type === 'task' ? id : undefined}
          protocolId={type === 'protocol' ? id : undefined}
          className="w-full"
        />
      </div>

      {/* Direct Entity Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Direct Entity Selection
          </h3>
          <button
            onClick={() => setShowEntitySelector(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Entity
          </button>
        </div>

        {/* Entity Selector Modal */}
        {showEntitySelector && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select Entity
              </h3>
              <EntitySelector
                onEntitySelect={handleEntitySelect}
                placeholder="Search for entity..."
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

        {/* Selected Entities */}
        {selectedEntities.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Entities ({selectedEntities.length})
            </h4>
            {selectedEntities.map((entity, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-3 rounded-md border"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {entity.entityType === 'chemical' ? '🧪' : 
                     entity.entityType === 'gene' ? '🧬' : 
                     entity.entityType === 'reagent' ? '🔬' : '⚙️'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{entity.entityName}</p>
                    <p className="text-sm text-gray-500 capitalize">
                      {entity.entityType} • {entity.currentStock} {entity.unit} available
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={entity.currentStock}
                    step="0.01"
                    value={entity.quantity}
                    onChange={(e) => {
                      const newEntities = [...selectedEntities];
                      newEntities[index].quantity = parseFloat(e.target.value) || 0;
                      setSelectedEntities(newEntities);
                    }}
                    placeholder="Qty"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-sm text-gray-500">{entity.unit}</span>
                  <button
                    onClick={() => handleRemoveEntity(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Summary */}
      {(content.includes('[[') || selectedEntities.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            Usage Summary
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-blue-800">
              When you save this {type.toLowerCase()}, the following usage will be logged:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              {content.match(/\[\[([^:]+):([^\]]+)\]\]/g)?.map((link, index) => (
                <li key={index}>
                  Entity link: <code className="bg-blue-100 px-1 rounded">{link}</code>
                </li>
              ))}
              {selectedEntities.map((entity, index) => (
                <li key={index}>
                  {entity.entityName}: {entity.quantity} {entity.unit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => {
            setContent('');
            setTitle('');
            setSelectedEntities([]);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Save {getTypeLabel()}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          How to Use Entity Linking
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>In-content linking:</strong> Select text in the editor and use the entity selector to create smart links</p>
          <p>• <strong>Direct selection:</strong> Use the "Add Entity" button to directly link entities with usage tracking</p>
          <p>• <strong>Hover for details:</strong> Hover over entity links to see stock levels and quick usage options</p>
          <p>• <strong>Automatic logging:</strong> Usage is automatically logged when entities are linked to experiments, tasks, or protocols</p>
        </div>
      </div>
    </div>
  );
}; 