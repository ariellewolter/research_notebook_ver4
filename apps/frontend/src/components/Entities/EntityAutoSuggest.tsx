import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EntityType, EntitySelection } from '../../types/entity.types';
import { entityApiService } from '../../services/api/entities';

interface EntityAutoSuggestProps {
  onEntitySelect: (entity: EntitySelection) => void;
  entityTypes?: EntityType[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  triggerCharacters?: string[];
  minSearchLength?: number;
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

export const EntityAutoSuggest: React.FC<EntityAutoSuggestProps> = ({
  onEntitySelect,
  entityTypes = ['chemical', 'gene', 'reagent', 'equipment'],
  placeholder = 'Type to search entities...',
  className = '',
  disabled = false,
  triggerCharacters = ['@', '#', '[[', '{{'],
  minSearchLength = 2
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (!query.trim() || query.length < minSearchLength) {
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
        .slice(0, 8);
      
      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Error searching entities:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [entityTypes, fuzzySearch, minSearchLength]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchEntities(searchTerm);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchEntities]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setInputValue(value);
    setCursorPosition(cursorPos);

    // Check for trigger characters
    const beforeCursor = value.substring(0, cursorPos);
    const triggerFound = triggerCharacters.some(trigger => 
      beforeCursor.includes(trigger)
    );

    if (triggerFound) {
      // Extract search term after trigger
      let searchTerm = '';
      for (const trigger of triggerCharacters) {
        const triggerIndex = beforeCursor.lastIndexOf(trigger);
        if (triggerIndex !== -1) {
          searchTerm = beforeCursor.substring(triggerIndex + trigger.length).trim();
          break;
        }
      }

      if (searchTerm.length >= minSearchLength) {
        setSearchTerm(searchTerm);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [triggerCharacters, minSearchLength]);

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
        setSelectedIndex(-1);
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
    const entitySelection: EntitySelection = {
      entityType: suggestion.entityType,
      entityId: suggestion.id,
      entityName: suggestion.name,
      currentStock: suggestion.stockLevel,
      unit: suggestion.unit,
      quantity: 0,
      notes: '',
      purpose: ''
    };

    onEntitySelect(entitySelection);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    setSearchTerm('');
  }, [onEntitySelect]);

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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
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
                          {suggestion.tags.split(',').slice(0, 3).map((tag: string, tagIndex: number) => (
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

                      {/* Additional details */}
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                        {suggestion.catalogNumber && (
                          <span>🏷️ {suggestion.catalogNumber}</span>
                        )}
                        {suggestion.supplier && (
                          <span>🏢 {suggestion.supplier}</span>
                        )}
                        <span className="text-green-600">
                          Score: {suggestion.relevanceScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="p-4 text-center text-gray-500">
              No entities found for "{searchTerm}"
            </div>
          ) : null}
        </div>
      )}

      {/* Trigger Characters Help */}
      <div className="mt-2 text-xs text-gray-500">
        Use trigger characters to search: {triggerCharacters.join(', ')}
      </div>
    </div>
  );
}; 