import React, { useState } from 'react';
import { EntityAutoSuggest } from './EntityAutoSuggest';
import { EntityContentEditor } from './EntityContentEditor';
import { EntityType, EntitySelection } from '../../types/entity.types';

interface EntityAutoSuggestDemoProps {
  type: 'note' | 'protocol' | 'task';
}

export const EntityAutoSuggestDemo: React.FC<EntityAutoSuggestDemoProps> = ({
  type
}) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<EntitySelection[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'input'>('editor');
  const [triggerCharacters, setTriggerCharacters] = useState<string[]>(['@', '#', '[[', '{{']);

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
  };

  const handleRemoveEntity = (index: number) => {
    setSelectedEntities(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    console.log('Saving content:', {
      type,
      title,
      content,
      linkedEntities: selectedEntities
    });
  };

  const exampleContent = `This is an example ${type.toLowerCase()} with entity mentions.

For chemicals, try typing: @sodium or @chloride
For genes, try typing: @gene or @dna
For reagents, try typing: @antibody or @enzyme
For equipment, try typing: @microscope or @centrifuge

You can also use different trigger characters:
#chemical for chemicals
[[reagent]] for reagents
{{equipment}} for equipment

The system will automatically suggest relevant entities based on your input.`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getTypeIcon()}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getTypeLabel()} Editor with Auto-Suggestions
          </h1>
          <p className="text-gray-500">
            Experience intelligent entity linking with fuzzy search and real-time suggestions
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📝 Content Editor
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'input'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔍 Auto-Suggest Input
          </button>
        </nav>
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

      {/* Content Editor Tab */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content with Auto-Suggestions
            </label>
            <EntityContentEditor
              content={content}
              onContentChange={setContent}
              placeholder="Start typing... Use @ to mention entities"
              className="w-full"
            />
          </div>

          {/* Example Content */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              💡 Try these examples:
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Type "@sodium" to find sodium chloride</p>
              <p>• Type "@microscope" to find lab equipment</p>
              <p>• Type "@antibody" to find reagents</p>
              <p>• Type "@gene" to find genetic materials</p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Suggest Input Tab */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Trigger Characters Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Trigger Characters Configuration
            </h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['@', '#', '[[', '{{', '$$', '%%'].map(char => (
                  <button
                    key={char}
                    onClick={() => {
                      if (triggerCharacters.includes(char)) {
                        setTriggerCharacters(prev => prev.filter(c => c !== char));
                      } else {
                        setTriggerCharacters(prev => [...prev, char]);
                      }
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      triggerCharacters.includes(char)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>
              <p className="text-sm text-blue-700">
                Selected triggers: {triggerCharacters.join(', ')}
              </p>
            </div>
          </div>

          {/* Auto-Suggest Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Auto-Suggest Input
            </label>
            <EntityAutoSuggest
              onEntitySelect={handleEntitySelect}
              triggerCharacters={triggerCharacters}
              placeholder={`Type ${triggerCharacters.join(', ')} to search entities...`}
              className="w-full"
            />
          </div>

          {/* Selected Entities */}
          {selectedEntities.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Selected Entities ({selectedEntities.length})
              </h3>
              <div className="space-y-2">
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
                    <button
                      onClick={() => handleRemoveEntity(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Features Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fuzzy Search */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🔍</span>
            <h3 className="font-medium text-gray-900">Fuzzy Search</h3>
          </div>
          <p className="text-sm text-gray-600">
            Intelligent search that matches partial terms, typos, and synonyms across entity names, descriptions, and tags.
          </p>
        </div>

        {/* Keyword Highlighting */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">✨</span>
            <h3 className="font-medium text-gray-900">Keyword Highlighting</h3>
          </div>
          <p className="text-sm text-gray-600">
            Matched terms are highlighted in yellow to show exactly what matched your search query.
          </p>
        </div>

        {/* Real-time Suggestions */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">⚡</span>
            <h3 className="font-medium text-gray-900">Real-time Suggestions</h3>
          </div>
          <p className="text-sm text-gray-600">
            Suggestions appear instantly as you type, with debounced API calls for optimal performance.
          </p>
        </div>

        {/* Stock Information */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">📊</span>
            <h3 className="font-medium text-gray-900">Stock Information</h3>
          </div>
          <p className="text-sm text-gray-600">
            See current stock levels with color-coded indicators (green/yellow/red) for quick inventory status.
          </p>
        </div>

        {/* Multiple Triggers */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">🎯</span>
            <h3 className="font-medium text-gray-900">Multiple Triggers</h3>
          </div>
          <p className="text-sm text-gray-600">
            Configure custom trigger characters like @, #, [[, {{ to suit your workflow preferences.
          </p>
        </div>

        {/* Keyboard Navigation */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">⌨️</span>
            <h3 className="font-medium text-gray-900">Keyboard Navigation</h3>
          </div>
          <p className="text-sm text-gray-600">
            Use arrow keys to navigate suggestions, Enter to select, and Escape to cancel.
          </p>
        </div>
      </div>

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
          Clear All
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
          How to Use Auto-Suggestions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Content Editor Mode:</h4>
            <ul className="space-y-1">
              <li>• Type @ followed by entity name</li>
              <li>• Use arrow keys to navigate suggestions</li>
              <li>• Press Enter to insert entity link</li>
              <li>• Hover over links for entity details</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Auto-Suggest Input Mode:</h4>
            <ul className="space-y-1">
              <li>• Configure custom trigger characters</li>
              <li>• Search across all entity types</li>
              <li>• See relevance scores and stock levels</li>
              <li>• Build entity lists for bulk operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 