import React, { useState, useEffect, useCallback } from 'react';
import { EntityType } from '../../types/entity.types';

interface InventoryAlertSystemProps {
  className?: string;
}

interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'reorder_needed' | 'threshold_breach';
  entityId: string;
  entityName: string;
  entityType: EntityType;
  currentStock: number;
  unit: string;
  threshold: number;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  isRead: boolean;
  isDismissed: boolean;
  actionTaken?: string;
  actionTakenAt?: string;
}

interface AlertSettings {
  enableLowStockAlerts: boolean;
  enableOutOfStockAlerts: boolean;
  enableExpiryAlerts: boolean;
  enableReorderAlerts: boolean;
  lowStockThreshold: number;
  expiryWarningDays: number;
  notificationEmail: boolean;
  notificationInApp: boolean;
  autoAddToReorderList: boolean;
}

interface AlertSummary {
  totalAlerts: number;
  unreadAlerts: number;
  urgentAlerts: number;
  highPriorityAlerts: number;
  mediumPriorityAlerts: number;
  lowPriorityAlerts: number;
  alertsByType: {
    low_stock: number;
    out_of_stock: number;
    expiring_soon: number;
    reorder_needed: number;
    threshold_breach: number;
  };
}

export const InventoryAlertSystem: React.FC<InventoryAlertSystemProps> = ({
  className = ''
}) => {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enableLowStockAlerts: true,
    enableOutOfStockAlerts: true,
    enableExpiryAlerts: true,
    enableReorderAlerts: true,
    lowStockThreshold: 5,
    expiryWarningDays: 30,
    notificationEmail: true,
    notificationInApp: true,
    autoAddToReorderList: false
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'urgent' | 'high'>('all');
  const [loading, setLoading] = useState(false);

  // Load alerts
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // This would typically come from an API
      // For now, using mock data
      const mockAlerts: InventoryAlert[] = [
        {
          id: 'alert-1',
          type: 'out_of_stock',
          entityId: 'chemical-1',
          entityName: 'Taq Polymerase',
          entityType: 'reagent',
          currentStock: 0,
          unit: 'units',
          threshold: 10,
          message: 'Taq Polymerase is out of stock. Immediate reorder needed for PCR experiments.',
          priority: 'urgent',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          isRead: false,
          isDismissed: false
        },
        {
          id: 'alert-2',
          type: 'low_stock',
          entityId: 'chemical-2',
          entityName: 'Sodium Chloride',
          entityType: 'chemical',
          currentStock: 3,
          unit: 'g',
          threshold: 5,
          message: 'Sodium Chloride stock is low (3g remaining). Consider reordering soon.',
          priority: 'high',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          isRead: true,
          isDismissed: false
        },
        {
          id: 'alert-3',
          type: 'expiring_soon',
          entityId: 'reagent-1',
          entityName: 'Restriction Enzyme Mix',
          entityType: 'reagent',
          currentStock: 15,
          unit: 'units',
          threshold: 5,
          message: 'Restriction Enzyme Mix expires in 15 days. Use soon or consider disposal.',
          priority: 'medium',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          isRead: false,
          isDismissed: false
        },
        {
          id: 'alert-4',
          type: 'reorder_needed',
          entityId: 'equipment-1',
          entityName: 'Pipette Tips',
          entityType: 'equipment',
          currentStock: 50,
          unit: 'boxes',
          threshold: 100,
          message: 'Pipette Tips stock is below reorder threshold. Add to reorder list.',
          priority: 'low',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isRead: true,
          isDismissed: true,
          actionTaken: 'Added to reorder list',
          actionTakenAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark alert as read
  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isDismissed: true } : alert
    ));
  }, []);

  // Take action on alert
  const takeActionOnAlert = useCallback((alertId: string, action: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { 
        ...alert, 
        actionTaken: action, 
        actionTakenAt: new Date().toISOString(),
        isDismissed: true 
      } : alert
    ));
  }, []);

  // Update alert settings
  const updateAlertSettings = useCallback(async () => {
    try {
      // This would typically save to an API
      console.log('Alert settings updated:', alertSettings);
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating alert settings:', error);
    }
  }, [alertSettings]);

  // Calculate alert summary
  const calculateAlertSummary = useCallback((): AlertSummary => {
    const totalAlerts = alerts.length;
    const unreadAlerts = alerts.filter(alert => !alert.isRead).length;
    const urgentAlerts = alerts.filter(alert => alert.priority === 'urgent' && !alert.isDismissed).length;
    const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high' && !alert.isDismissed).length;
    const mediumPriorityAlerts = alerts.filter(alert => alert.priority === 'medium' && !alert.isDismissed).length;
    const lowPriorityAlerts = alerts.filter(alert => alert.priority === 'low' && !alert.isDismissed).length;

    const alertsByType = {
      low_stock: alerts.filter(alert => alert.type === 'low_stock').length,
      out_of_stock: alerts.filter(alert => alert.type === 'out_of_stock').length,
      expiring_soon: alerts.filter(alert => alert.type === 'expiring_soon').length,
      reorder_needed: alerts.filter(alert => alert.type === 'reorder_needed').length,
      threshold_breach: alerts.filter(alert => alert.type === 'threshold_breach').length
    };

    return {
      totalAlerts,
      unreadAlerts,
      urgentAlerts,
      highPriorityAlerts,
      mediumPriorityAlerts,
      lowPriorityAlerts,
      alertsByType
    };
  }, [alerts]);

  // Filter alerts
  const filteredAlerts = useCallback(() => {
    let filtered = alerts.filter(alert => !alert.isDismissed);

    switch (filterType) {
      case 'unread':
        filtered = filtered.filter(alert => !alert.isRead);
        break;
      case 'urgent':
        filtered = filtered.filter(alert => alert.priority === 'urgent');
        break;
      case 'high':
        filtered = filtered.filter(alert => alert.priority === 'high' || alert.priority === 'urgent');
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [alerts, filterType]);

  // Get alert type icon
  const getAlertTypeIcon = (type: InventoryAlert['type']) => {
    switch (type) {
      case 'low_stock':
        return '⚠️';
      case 'out_of_stock':
        return '🚨';
      case 'expiring_soon':
        return '⏰';
      case 'reorder_needed':
        return '📋';
      case 'threshold_breach':
        return '📊';
      default:
        return '📢';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: InventoryAlert['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Get entity type icon
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

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const summary = calculateAlertSummary();
  const filtered = filteredAlerts();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Inventory Alerts
          </h3>
          <p className="text-sm text-gray-500">
            Monitor and manage inventory alerts and notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAllAlerts(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
          >
            View All Alerts ({summary.totalAlerts})
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Urgent</p>
              <p className="text-lg font-semibold text-red-900">{summary.urgentAlerts}</p>
            </div>
            <span className="text-lg">🚨</span>
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600">High Priority</p>
              <p className="text-lg font-semibold text-orange-900">{summary.highPriorityAlerts}</p>
            </div>
            <span className="text-lg">⚠️</span>
          </div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Medium Priority</p>
              <p className="text-lg font-semibold text-yellow-900">{summary.mediumPriorityAlerts}</p>
            </div>
            <span className="text-lg">📊</span>
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Unread</p>
              <p className="text-lg font-semibold text-blue-900">{summary.unreadAlerts}</p>
            </div>
            <span className="text-lg">📢</span>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Recent Alerts</h4>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading alerts...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-lg mt-0.5">{getAlertTypeIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getEntityTypeIcon(alert.entityType)}</span>
                          <h5 className="font-medium text-gray-900">{alert.entityName}</h5>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(alert.priority)}`}>
                          {alert.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Stock: {alert.currentStock} {alert.unit} (Threshold: {alert.threshold})</span>
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    {!alert.isRead && (
                      <button
                        onClick={() => markAlertAsRead(alert.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No active alerts.</p>
            <p className="text-sm">All inventory levels are within normal ranges.</p>
          </div>
        )}
      </div>

      {/* Alert Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Alert Settings
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Alert Types</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableLowStockAlerts}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        enableLowStockAlerts: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Low Stock Alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableOutOfStockAlerts}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        enableOutOfStockAlerts: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Out of Stock Alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableExpiryAlerts}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        enableExpiryAlerts: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Expiry Alerts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableReorderAlerts}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        enableReorderAlerts: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Reorder Alerts</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Thresholds</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Low Stock Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={alertSettings.lowStockThreshold}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        lowStockThreshold: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Expiry Warning (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={alertSettings.expiryWarningDays}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        expiryWarningDays: parseInt(e.target.value) || 30 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">Notifications</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.notificationEmail}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        notificationEmail: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.notificationInApp}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        notificationInApp: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">In-App Notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.autoAddToReorderList}
                      onChange={(e) => setAlertSettings(prev => ({ 
                        ...prev, 
                        autoAddToReorderList: e.target.checked 
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-add to Reorder List</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={updateAlertSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Alerts Modal */}
      {showAllAlerts && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4xl max-w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                All Inventory Alerts
              </h3>
              <div className="flex items-center space-x-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Alerts</option>
                  <option value="unread">Unread Only</option>
                  <option value="urgent">Urgent Only</option>
                  <option value="high">High Priority+</option>
                </select>
                <button
                  onClick={() => setShowAllAlerts(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="text-lg mt-0.5">{getAlertTypeIcon(alert.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{getEntityTypeIcon(alert.entityType)}</span>
                              <h5 className="font-medium text-gray-900">{alert.entityName}</h5>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(alert.priority)}`}>
                              {alert.priority.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                            <span>Stock: {alert.currentStock} {alert.unit}</span>
                            <span>Threshold: {alert.threshold} {alert.unit}</span>
                            <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                            <span>Status: {alert.isRead ? 'Read' : 'Unread'}</span>
                          </div>

                          {alert.actionTaken && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                              <span className="font-medium">Action Taken:</span> {alert.actionTaken}
                              {alert.actionTakenAt && (
                                <span className="ml-2">({new Date(alert.actionTakenAt).toLocaleDateString()})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!alert.isRead && (
                          <button
                            onClick={() => markAlertAsRead(alert.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => takeActionOnAlert(alert.id, 'Added to reorder list')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Add to Reorder
                        </button>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No alerts match the current filter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 