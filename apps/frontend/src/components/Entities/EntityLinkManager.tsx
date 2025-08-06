import React, { useState, useCallback } from 'react';
import { EntitySelector } from './EntitySelector';
import { EntityLink } from './EntityLink';
import { EntityType, EntitySelection } from '../../types/entity.types';
import { useBulkUsage } from '../../hooks/useEntities';

interface EntityLinkManagerProps {
  content: string;
  onContentChange: (content: string) => void;
  entityTypes?: EntityType[];
  experimentId?: string;
  taskId?: string;
  protocolId?: string;
  className?: string;
}

interface EntityLinkData {
  id: string;
  entityType: EntityType;
  entityName: string;
  startIndex: number;
  endIndex: number;
}

export const EntityLinkManager: React.FC<EntityLinkManagerProps> = ({
  content,
  onContentChange,
  entityTypes = ['chemical', 'gene', 'reagent', 'equipment'],
  experimentId,
  taskId,
  protocolId,
  className = ''
}) => {
  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [entityLinks, setEntityLinks] = useState<EntityLinkData[]>([]);
  const { logTaskEntityUsage, logProtocolEntityUsage } = useBulkUsage();

  // Parse entity links from content
  const parseEntityLinks = useCallback((text: string): EntityLinkData[] => {
    const links: EntityLinkData[] = [];
    const entityLinkRegex = /\[\[([^:]+):([^\]]+)\]\]/g;
    let match;

    while ((match = entityLinkRegex.exec(text)) !== null) {
      const [fullMatch, entityType, entityName] = match;
      links.push({
        id: `${entityType}-${entityName}`,
        entityType: entityType as EntityType,
        entityName,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length
      });
    }

    return links;
  }, []);

  // Update entity links when content changes
  React.useEffect(() => {
    setEntityLinks(parseEntityLinks(content));
  }, [content, parseEntityLinks]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();
      
      // Find the position in the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null
      );

      let currentPos = 0;
      let startPos = -1;
      let endPos = -1;

      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const nodeText = node.textContent || '';
        
        if (startPos === -1) {
          const index = nodeText.indexOf(text);
          if (index !== -1) {
            startPos = currentPos + index;
            endPos = startPos + text.length;
            break;
          }
        }
        
        currentPos += nodeText.length;
      }

      if (startPos !== -1) {
        setSelectedText(text);
        setSelectionStart(startPos);
        setSelectionEnd(endPos);
        setShowEntitySelector(true);
      }
    }
  }, [content]);

  // Handle entity selection
  const handleEntitySelect = useCallback((entitySelection: EntitySelection) => {
    const entityLink = `[[${entitySelection.entityType}:${entitySelection.entityName}]]`;
    
    // Replace selected text with entity link
    const newContent = 
      content.substring(0, selectionStart) + 
      entityLink + 
      content.substring(selectionEnd);
    
    onContentChange(newContent);
    setShowEntitySelector(false);
    setSelectedText('');
  }, [content, selectionStart, selectionEnd, onContentChange]);

  // Handle usage logging
  const handleUsageLog = useCallback(async (entityId: string, entityType: EntityType, quantity: number) => {
    try {
      const usageData = {
        entityType,
        entityId,
        quantity,
        unit: 'units', // This should be fetched from the entity
        purpose: `Used in ${experimentId ? 'experiment' : taskId ? 'task' : protocolId ? 'protocol' : 'content'}`,
        experimentId,
        taskId,
        protocolId
      };

      if (taskId) {
        await logTaskEntityUsage(taskId, [usageData]);
      } else if (protocolId) {
        await logProtocolEntityUsage(protocolId, [usageData]);
      } else {
        // Log individual usage
        // This would call the individual usage logging API
        console.log('Logging usage:', usageData);
      }
    } catch (error) {
      console.error('Error logging usage:', error);
    }
  }, [experimentId, taskId, protocolId, logTaskEntityUsage, logProtocolEntityUsage]);

  // Render content with entity links
  const renderContentWithLinks = useCallback(() => {
    if (entityLinks.length === 0) {
      return content;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    entityLinks.forEach((link, index) => {
      // Add text before the link
      if (link.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {content.substring(lastIndex, link.startIndex)}
          </span>
        );
      }

      // Add the entity link
      parts.push(
        <EntityLink
          key={`link-${index}`}
          entityId={link.id}
          entityType={link.entityType}
          entityName={link.entityName}
          onUsageLog={handleUsageLog}
        />
      );

      lastIndex = link.endIndex;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  }, [content, entityLinks, handleUsageLog]);

  return (
    <div className={`relative ${className}`}>
      {/* Content Display */}
      <div
        className="min-h-[200px] p-4 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onContentChange(e.currentTarget.textContent || '')}
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Entity Selector */}
      {showEntitySelector && (
        <div className="absolute z-50 mt-2 p-4 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">
              Link entity to: <span className="font-medium">"{selectedText}"</span>
            </p>
            <EntitySelector
              onEntitySelect={handleEntitySelect}
              entityTypes={entityTypes}
              placeholder="Search for entity to link..."
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowEntitySelector(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entity Links Summary */}
      {entityLinks.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Linked Entities ({entityLinks.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {entityLinks.map((link, index) => (
              <div
                key={index}
                className="inline-flex items-center space-x-1 bg-white px-2 py-1 rounded border text-sm"
              >
                <span>{link.entityType === 'chemical' ? '🧪' : 
                       link.entityType === 'gene' ? '🧬' : 
                       link.entityType === 'reagent' ? '🔬' : '⚙️'}</span>
                <span className="text-blue-600">{link.entityName}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500 capitalize">{link.entityType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Insert Button */}
      <div className="mt-2 flex justify-between items-center">
        <button
          onClick={() => setShowEntitySelector(true)}
          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
        >
          <span>🔗</span>
          <span>Insert Entity Link</span>
        </button>
        
        <div className="text-xs text-gray-500">
          Select text and press Ctrl+L to quickly insert entity links
        </div>
      </div>
    </div>
  );
}; 