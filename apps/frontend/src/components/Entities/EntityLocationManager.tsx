import React, { useState, useEffect, useCallback } from 'react';
import { EntityType } from '../../types/entity.types';

interface EntityLocationManagerProps {
  entityId: string;
  entityType: EntityType;
  entityName: string;
  currentLocation?: string;
  onLocationUpdate?: (location: string) => void;
  className?: string;
}

interface Location {
  id: string;
  name: string;
  type: 'room' | 'freezer' | 'shelf' | 'cabinet' | 'drawer' | 'rack' | 'other';
  description?: string;
  parentLocation?: string;
  temperature?: string;
  capacity?: string;
  isActive: boolean;
}

interface LocationHierarchy {
  room: Location[];
  freezer: Location[];
  shelf: Location[];
  cabinet: Location[];
  drawer: Location[];
  rack: Location[];
  other: Location[];
}

export const EntityLocationManager: React.FC<EntityLocationManagerProps> = ({
  entityId,
  entityType,
  entityName,
  currentLocation,
  onLocationUpdate,
  className = ''
}) => {
  const [locations, setLocations] = useState<LocationHierarchy>({
    room: [],
    freezer: [],
    shelf: [],
    cabinet: [],
    drawer: [],
    rack: [],
    other: []
  });
  const [selectedLocation, setSelectedLocation] = useState<string>(currentLocation || '');
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'shelf' as Location['type'],
    description: '',
    parentLocation: '',
    temperature: '',
    capacity: ''
  });
  const [loading, setLoading] = useState(false);

  // Load available locations
  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      // This would typically come from an API
      // For now, using mock data
      const mockLocations: LocationHierarchy = {
        room: [
          { id: 'room-1', name: 'Lab Room 101', type: 'room', description: 'Main laboratory', isActive: true },
          { id: 'room-2', name: 'Lab Room 102', type: 'room', description: 'Secondary laboratory', isActive: true },
          { id: 'room-3', name: 'Storage Room', type: 'room', description: 'General storage area', isActive: true }
        ],
        freezer: [
          { id: 'freezer-1', name: 'Freezer A', type: 'freezer', description: '-20°C Freezer', temperature: '-20°C', isActive: true },
          { id: 'freezer-2', name: 'Freezer B', type: 'freezer', description: '-80°C Freezer', temperature: '-80°C', isActive: true },
          { id: 'freezer-3', name: 'Refrigerator', type: 'freezer', description: '4°C Refrigerator', temperature: '4°C', isActive: true }
        ],
        shelf: [
          { id: 'shelf-1', name: 'Shelf A1', type: 'shelf', description: 'Top shelf', parentLocation: 'Lab Room 101', isActive: true },
          { id: 'shelf-2', name: 'Shelf A2', type: 'shelf', description: 'Middle shelf', parentLocation: 'Lab Room 101', isActive: true },
          { id: 'shelf-3', name: 'Shelf B1', type: 'shelf', description: 'Storage shelf', parentLocation: 'Storage Room', isActive: true }
        ],
        cabinet: [
          { id: 'cabinet-1', name: 'Chemical Cabinet', type: 'cabinet', description: 'Chemical storage', parentLocation: 'Lab Room 101', isActive: true },
          { id: 'cabinet-2', name: 'Equipment Cabinet', type: 'cabinet', description: 'Equipment storage', parentLocation: 'Lab Room 102', isActive: true }
        ],
        drawer: [
          { id: 'drawer-1', name: 'Drawer 1', type: 'drawer', description: 'Small parts', parentLocation: 'Chemical Cabinet', isActive: true },
          { id: 'drawer-2', name: 'Drawer 2', type: 'drawer', description: 'Tools', parentLocation: 'Equipment Cabinet', isActive: true }
        ],
        rack: [
          { id: 'rack-1', name: 'Test Tube Rack', type: 'rack', description: 'Test tube storage', parentLocation: 'Shelf A1', isActive: true },
          { id: 'rack-2', name: 'Microplate Rack', type: 'rack', description: 'Microplate storage', parentLocation: 'Shelf A2', isActive: true }
        ],
        other: [
          { id: 'other-1', name: 'Bench Top', type: 'other', description: 'Workbench surface', parentLocation: 'Lab Room 101', isActive: true },
          { id: 'other-2', name: 'Fume Hood', type: 'other', description: 'Fume hood storage', parentLocation: 'Lab Room 101', isActive: true }
        ]
      };

      setLocations(mockLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new location
  const handleAddLocation = useCallback(async () => {
    if (!newLocation.name.trim()) return;

    try {
      const location: Location = {
        id: `new-${Date.now()}`,
        name: newLocation.name,
        type: newLocation.type,
        description: newLocation.description,
        parentLocation: newLocation.parentLocation,
        temperature: newLocation.temperature,
        capacity: newLocation.capacity,
        isActive: true
      };

      setLocations(prev => ({
        ...prev,
        [newLocation.type]: [...prev[newLocation.type], location]
      }));

      // Reset form
      setNewLocation({
        name: '',
        type: 'shelf',
        description: '',
        parentLocation: '',
        temperature: '',
        capacity: ''
      });
      setShowAddLocation(false);
    } catch (error) {
      console.error('Error adding location:', error);
    }
  }, [newLocation]);

  // Update entity location
  const handleLocationUpdate = useCallback(async (locationName: string) => {
    try {
      setSelectedLocation(locationName);
      onLocationUpdate?.(locationName);
      setShowLocationSelector(false);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [onLocationUpdate]);

  // Load locations on mount
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const getLocationIcon = (type: Location['type']) => {
    switch (type) {
      case 'room':
        return '🏠';
      case 'freezer':
        return '❄️';
      case 'shelf':
        return '📚';
      case 'cabinet':
        return '🗄️';
      case 'drawer':
        return '📁';
      case 'rack':
        return '🧪';
      case 'other':
        return '📍';
      default:
        return '📍';
    }
  };

  const getLocationTypeLabel = (type: Location['type']) => {
    switch (type) {
      case 'room':
        return 'Room';
      case 'freezer':
        return 'Freezer/Refrigerator';
      case 'shelf':
        return 'Shelf';
      case 'cabinet':
        return 'Cabinet';
      case 'drawer':
        return 'Drawer';
      case 'rack':
        return 'Rack';
      case 'other':
        return 'Other';
      default:
        return 'Location';
    }
  };

  const getAllLocations = () => {
    return Object.values(locations).flat();
  };

  const getParentLocationOptions = () => {
    return getAllLocations().filter(loc => loc.isActive);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Location Display */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Storage Location
          </h3>
          <p className="text-sm text-gray-500">
            Manage storage location for {entityName}
          </p>
        </div>
        <button
          onClick={() => setShowLocationSelector(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Change Location
        </button>
      </div>

      {/* Current Location */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <span className="text-lg">📍</span>
            <div>
              <p className="font-medium text-green-900">{selectedLocation}</p>
              <p className="text-sm text-green-700">Current storage location</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Storage Location
            </h3>

            {/* Location Categories */}
            <div className="space-y-4">
              {Object.entries(locations).map(([type, typeLocations]) => (
                <div key={type}>
                  <h4 className="font-medium text-gray-700 mb-2">
                    {getLocationIcon(type as Location['type'])} {getLocationTypeLabel(type as Location['type'])}
                  </h4>
                  <div className="space-y-2">
                    {typeLocations.filter(loc => loc.isActive).map(location => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationUpdate(location.name)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedLocation === location.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{location.name}</p>
                            {location.description && (
                              <p className="text-sm text-gray-500">{location.description}</p>
                            )}
                            {location.parentLocation && (
                              <p className="text-xs text-gray-400">in {location.parentLocation}</p>
                            )}
                          </div>
                          {location.temperature && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {location.temperature}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Location */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddLocation(true)}
                className="w-full text-center py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700"
              >
                + Add New Location
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowLocationSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Location
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Shelf A3, Freezer C"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Type
                </label>
                <select
                  value={newLocation.type}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, type: e.target.value as Location['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="room">Room</option>
                  <option value="freezer">Freezer/Refrigerator</option>
                  <option value="shelf">Shelf</option>
                  <option value="cabinet">Cabinet</option>
                  <option value="drawer">Drawer</option>
                  <option value="rack">Rack</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newLocation.description}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Location
                </label>
                <select
                  value={newLocation.parentLocation}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, parentLocation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No parent location</option>
                  {getParentLocationOptions().map(location => (
                    <option key={location.id} value={location.name}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature
                  </label>
                  <input
                    type="text"
                    value={newLocation.temperature}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="e.g., -20°C"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="text"
                    value={newLocation.capacity}
                    onChange={(e) => setNewLocation(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="e.g., 100 items"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddLocation(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLocation}
                disabled={!newLocation.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 