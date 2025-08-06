import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EntityType, EntitySelection } from '../../types/entity.types';
import { entityApiService } from '../../services/api/entities';
import { EntityLink } from './EntityLink';

interface EntityContentEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  entityTypes?: EntityType[];
  experimentId?: string;
  taskId?: string;
  protocolId?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface EntitySuggestion {
  id: string;
  name: string;
  type: string;
  entityType: EntityType;
  stockLevel: number;
  unit: string;
  location?: string;
  description?: string;
  tags?: string;
  catalogNumber?: string;
  supplier?: string;
  relevanceScore: number;
  matchedTerms: string[];
}

interface SuggestionPosition {
  start: number;
  end: number;
  searchTerm: string;
}

export const EntityContentEditor: React.FC<EntityContentEditorProps> = ({
  content,
  onContentChange,
  entityTypes = ['chemical', 'gene', 'reagent', 'equipment'],
  experimentId,
  taskId,
  protocolId,
  placeholder = 'Start typing... Use @ to mention entities',
  className = '',
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState<SuggestionPosition | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fuzzy search function
  const fuzzySearch = useCallback((query: string, text: string): { score: number; matchedTerms: string[] } => {
    if (!query || !text) return { score: 0, matchedTerms: [] };

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    const textWords = textLower.split(/\s+/).filter(word => word.length > 0);

    let totalScore = 0;
    const matchedTerms: string[] = [];

    // Check for exact matches first
    if (textLower.includes(queryLower)) {
      totalScore += 100;
      matchedTerms.push(query);
    }

    // Check for word matches
    queryWords.forEach(queryWord => {
      textWords.forEach(textWord => {
        if (textWord.includes(queryWord)) {
          totalScore += 50;
          matchedTerms.push(queryWord);
        } else if (queryWord.includes(textWord)) {
          totalScore += 30;
          matchedTerms.push(textWord);
        }
      });
    });

    // Check for partial matches
    queryWords.forEach(queryWord => {
      if (textLower.includes(queryWord)) {
        totalScore += 20;
        if (!matchedTerms.includes(queryWord)) {
          matchedTerms.push(queryWord);
        }
      }
    });

    // Bonus for starting with query
    if (textLower.startsWith(queryLower)) {
      totalScore += 25;
    }

    return { score: totalScore, matchedTerms: [...new Set(matchedTerms)] };
  }, []);

  // Search entities with fuzzy matching
  const searchEntities = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const allSuggestions: EntitySuggestion[] = [];
      
      // Search each entity type
      for (const entityType of entityTypes) {
        try {
          const response = await entityApiService.listEntities(entityType, { name: query });
          const entities = response.entities || [];
          
          entities.forEach((entity: any) => {
            // Fuzzy search on name, description, and tags
            const nameMatch = fuzzySearch(query, entity.name);
            const descMatch = fuzzySearch(query, entity.description || '');
            const tagsMatch = fuzzySearch(query, entity.tags || '');
            
            const totalScore = nameMatch.score + descMatch.score * 0.5 + tagsMatch.score * 0.3;
            const allMatchedTerms = [
              ...nameMatch.matchedTerms,
              ...descMatch.matchedTerms,
              ...tagsMatch.matchedTerms
            ];

            if (totalScore > 0) {
              allSuggestions.push({
                id: entity.id,
                name: entity.name,
                type: entity.type,
                entityType,
                stockLevel: entity.stockLevel,
                unit: entity.unit,
                location: entity.location,
                description: entity.description,
                tags: entity.tags,
                catalogNumber: entity.catalogNumber,
                supplier: entity.supplier,
                relevanceScore: totalScore,
                matchedTerms: [...new Set(allMatchedTerms)]
              });
            }
          });
        } catch (error) {
          console.error(`Error searching ${entityType}:`, error);
        }
      }
      
      // Sort by relevance score and limit results
      const sortedSuggestions = allSuggestions
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 6);
      
      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Error searching entities:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [entityTypes, fuzzySearch]);

  // Get cursor position and check for @ mentions
  const checkForMentions = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;
    
    // Get text before cursor
    const textBeforeCursor = getTextBeforeCursor(range);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const searchTerm = mentionMatch[1];
      const startPos = textBeforeCursor.lastIndexOf('@');
      
      setSuggestionPosition({
        start: startPos,
        end: startPos + mentionMatch[0].length,
        searchTerm
      });
      
      searchEntities(searchTerm);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setShowSuggestions(false);
      setSuggestionPosition(null);
    }
  }, [searchEntities]);

  // Get text before cursor
  const getTextBeforeCursor = useCallback((range: Range): string => {
    const container = range.startContainer;
    const offset = range.startOffset;
    
    if (container.nodeType === Node.TEXT_NODE) {
      return container.textContent?.substring(0, offset) || '';
    }
    
    // For element nodes, get all text before the cursor
    const walker = document.createTreeWalker(
      container.parentNode || container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let text = '';
    let node: Node | null;
    
    while ((node = walker.nextNode())) {
      if (node === container) {
        text += node.textContent?.substring(0, offset) || '';
        break;
      }
      text += node.textContent || '';
    }
    
    return text;
  }, []);

  // Handle editor input
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    onContentChange(newContent);
    
    // Check for mentions after a short delay
    setTimeout(checkForMentions, 10);
  }, [onContentChange, checkForMentions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestionPosition(null);
        break;
      case 'Tab':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: EntitySuggestion) => {
    if (!editorRef.current || !suggestionPosition) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // Create entity link
    const entityLink = document.createElement('span');
    entityLink.className = 'entity-link inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 cursor-pointer underline';
    entityLink.setAttribute('data-entity-id', suggestion.id);
    entityLink.setAttribute('data-entity-type', suggestion.entityType);
    entityLink.setAttribute('data-entity-name', suggestion.name);
    
    const icon = document.createElement('span');
    icon.textContent = getEntityTypeIcon(suggestion.entityType);
    
    const name = document.createElement('span');
    name.textContent = suggestion.name;
    
    entityLink.appendChild(icon);
    entityLink.appendChild(name);
    
    // Replace the @mention with the entity link
    const textNode = range.startContainer;
    const offset = range.startOffset;
    
    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || '';
      const beforeMention = text.substring(0, offset - suggestionPosition.searchTerm.length - 1);
      const afterMention = text.substring(offset);
      
      // Update text node
      textNode.textContent = beforeMention;
      
      // Insert entity link
      range.setStartAfter(textNode);
      range.insertNode(entityLink);
      
      // Insert remaining text
      if (afterMention) {
        const afterNode = document.createTextNode(afterMention);
        range.setStartAfter(entityLink);
        range.insertNode(afterNode);
      }
    }
    
    // Update content
    const newContent = editorRef.current?.innerHTML || '';
    onContentChange(newContent);
    
    // Clear suggestions
    setShowSuggestions(false);
    setSuggestionPosition(null);
    setSelectedIndex(-1);
    setSuggestions([]);
    
    // Focus back to editor
    editorRef.current?.focus();
  }, [suggestionPosition, onContentChange]);

  // Highlight matching terms in text
  const highlightText = useCallback((text: string, matchedTerms: string[]) => {
    if (!matchedTerms.length) return text;

    let highlightedText = text;
    matchedTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 font-medium">$1</mark>');
    });

    return highlightedText;
  }, []);

  // Get entity type icon
  const getEntityTypeIcon = useCallback((type: EntityType) => {
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
  }, []);

  // Get stock status color
  const getStockStatusColor = useCallback((stockLevel: number) => {
    if (stockLevel === 0) return 'text-red-600';
    if (stockLevel <= 5) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  // Handle usage logging
  const handleUsageLog = useCallback(async (entityId: string, entityType: EntityType, quantity: number) => {
    try {
      const usageData = {
        entityType,
        entityId,
        quantity,
        unit: 'units',
        purpose: `Used in ${experimentId ? 'experiment' : taskId ? 'task' : protocolId ? 'protocol' : 'content'}`,
        experimentId,
        taskId,
        protocolId
      };

      // Log usage based on context
      if (taskId) {
        await entityApiService.logTaskEntityUsage(taskId, [usageData]);
      } else if (protocolId) {
        await entityApiService.logProtocolEntityUsage(protocolId, [usageData]);
      } else {
        await entityApiService.logUsage(usageData);
      }
    } catch (error) {
      console.error('Error logging usage:', error);
    }
  }, [experimentId, taskId, protocolId]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestionPosition(null);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  return (
    <div className={`relative ${className}`}>
      {/* Content Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={checkForMentions}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="min-h-[200px] p-4 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-80 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: '100%',
            left: '0',
            marginTop: '4px'
          }}
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.entityType}-${suggestion.id}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`px-3 py-3 cursor-pointer hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg mt-0.5">{getEntityTypeIcon(suggestion.entityType)}</span>
                    <div className="flex-1 min-w-0">
                      {/* Name with highlighting */}
                      <div className="flex items-center justify-between mb-1">
                        <h4 
                          className="text-sm font-medium text-gray-900 truncate"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightText(suggestion.name, suggestion.matchedTerms) 
                          }}
                        />
                        <span className={`text-xs font-medium ${getStockStatusColor(suggestion.stockLevel)}`}>
                          {suggestion.stockLevel} {suggestion.unit}
                        </span>
                      </div>
                      
                      {/* Type and location */}
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500 capitalize">
                          {suggestion.entityType} • {suggestion.type}
                        </p>
                        {suggestion.location && (
                          <p className="text-xs text-gray-500 truncate">
                            📍 {suggestion.location}
                          </p>
                        )}
                      </div>

                      {/* Description with highlighting */}
                      {suggestion.description && (
                        <p 
                          className="text-xs text-gray-600 mb-1 line-clamp-2"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightText(suggestion.description, suggestion.matchedTerms) 
                          }}
                        />
                      )}

                      {/* Tags with highlighting */}
                      {suggestion.tags && (
                        <div className="flex flex-wrap gap-1">
                          {suggestion.tags.split(',').slice(0, 2).map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded"
                              dangerouslySetInnerHTML={{ 
                                __html: highlightText(tag.trim(), suggestion.matchedTerms) 
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : suggestionPosition?.searchTerm ? (
            <div className="p-4 text-center text-gray-500">
              No entities found for "@{suggestionPosition.searchTerm}"
            </div>
          ) : null}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500">
        Type @ to mention entities • Use arrow keys to navigate • Enter to select • Escape to cancel
      </div>
    </div>
  );
}; 