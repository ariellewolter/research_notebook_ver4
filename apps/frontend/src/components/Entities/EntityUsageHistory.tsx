import React, { useState, useEffect, useCallback } from 'react';
import { EntityType, UsageLogInput } from '../../types/entity.types';
import { entityApiService } from '../../services/api/entities';

interface EntityUsageHistoryProps {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  className?: string;
}

interface UsageLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  quantity: number;
  unit: string;
  date: string;
  experimentId?: string;
  taskId?: string;
  protocolId?: string;
  notes?: string;
  usedBy?: string;
  purpose?: string;
  batchNumber?: string;
  lotNumber?: string;
  cost?: number;
  wasteGenerated?: number;
  wasteUnit?: string;
  createdAt: string;
  updatedAt: string;
  // Related entity info
  experimentName?: string;
  taskName?: string;
  protocolName?: string;
}

interface UsageHistoryFilters {
  dateFrom?: string;
  dateTo?: string;
  experimentId?: string;
  taskId?: string;
  protocolId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  usedBy?: string;
}

export const EntityUsageHistory: React.FC<EntityUsageHistoryProps> = ({
  entityType,
  entityId,
  entityName,
  className = ''
}) => {
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<UsageHistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'quantity' | 'cost'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load usage history
  const loadUsageHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await entityApiService.getUsageHistory(entityType, entityId, 100);
      const logs = response.usageLogs || [];
      
      // Enrich logs with related entity names
      const enrichedLogs = await Promise.all(
        logs.map(async (log: any) => {
          const enrichedLog: UsageLog = {
            ...log,
            experimentName: undefined,
            taskName: undefined,
            protocolName: undefined
          };

          // Fetch related entity names
          if (log.experimentId) {
            try {
              const expResponse = await entityApiService.getEntity('experiment', log.experimentId);
              enrichedLog.experimentName = expResponse.data.name;
            } catch (error) {
              console.error('Error fetching experiment name:', error);
            }
          }

          if (log.taskId) {
            try {
              const taskResponse = await entityApiService.getEntity('task', log.taskId);
              enrichedLog.taskName = taskResponse.data.title;
            } catch (error) {
              console.error('Error fetching task name:', error);
            }
          }

          if (log.protocolId) {
            try {
              const protocolResponse = await entityApiService.getEntity('protocol', log.protocolId);
              enrichedLog.protocolName = protocolResponse.data.name;
            } catch (error) {
              console.error('Error fetching protocol name:', error);
            }
          }

          return enrichedLog;
        })
      );

      setUsageLogs(enrichedLogs);
    } catch (error) {
      console.error('Error loading usage history:', error);
      setUsageLogs([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  // Apply filters and sorting
  const filteredAndSortedLogs = useCallback(() => {
    let filtered = usageLogs.filter(log => {
      // Date filters
      if (filters.dateFrom && new Date(log.date) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(log.date) > new Date(filters.dateTo)) {
        return false;
      }

      // Entity filters
      if (filters.experimentId && log.experimentId !== filters.experimentId) {
        return false;
      }
      if (filters.taskId && log.taskId !== filters.taskId) {
        return false;
      }
      if (filters.protocolId && log.protocolId !== filters.protocolId) {
        return false;
      }

      // Quantity filters
      if (filters.minQuantity && log.quantity < filters.minQuantity) {
        return false;
      }
      if (filters.maxQuantity && log.quantity > filters.maxQuantity) {
        return false;
      }

      // User filter
      if (filters.usedBy && log.usedBy && !log.usedBy.toLowerCase().includes(filters.usedBy.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Sort logs
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'cost':
          aValue = a.cost || 0;
          bValue = b.cost || 0;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [usageLogs, filters, sortBy, sortOrder]);

  // Calculate usage statistics
  const calculateStats = useCallback(() => {
    const logs = filteredAndSortedLogs();
    const totalUsage = logs.reduce((sum, log) => sum + log.quantity, 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
    const averageUsage = logs.length > 0 ? totalUsage / logs.length : 0;
    const uniqueExperiments = new Set(logs.filter(log => log.experimentId).map(log => log.experimentId)).size;
    const uniqueTasks = new Set(logs.filter(log => log.taskId).map(log => log.taskId)).size;
    const uniqueProtocols = new Set(logs.filter(log => log.protocolId).map(log => log.protocolId)).size;

    return {
      totalUsage,
      totalCost,
      averageUsage,
      totalLogs: logs.length,
      uniqueExperiments,
      uniqueTasks,
      uniqueProtocols
    };
  }, [filteredAndSortedLogs]);

  // Load history on mount
  useEffect(() => {
    loadUsageHistory();
  }, [loadUsageHistory]);

  const stats = calculateStats();
  const filteredLogs = filteredAndSortedLogs();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getContextIcon = (log: UsageLog) => {
    if (log.experimentId) return '🧪';
    if (log.taskId) return '✅';
    if (log.protocolId) return '📋';
    return '📝';
  };

  const getContextName = (log: UsageLog) => {
    if (log.experimentId && log.experimentName) return log.experimentName;
    if (log.taskId && log.taskName) return log.taskName;
    if (log.protocolId && log.protocolName) return log.protocolName;
    return 'General Usage';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Usage History
          </h3>
          <p className="text-sm text-gray-500">
            {entityName} ({entityType})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            onClick={loadUsageHistory}
            disabled={loading}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-600">Total Usage</div>
          <div className="text-lg font-semibold text-blue-900">
            {stats.totalUsage.toFixed(2)}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-600">Total Cost</div>
          <div className="text-lg font-semibold text-green-900">
            ${stats.totalCost.toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-sm text-purple-600">Avg Usage</div>
          <div className="text-lg font-semibold text-purple-900">
            {stats.averageUsage.toFixed(2)}
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-sm text-orange-600">Total Logs</div>
          <div className="text-lg font-semibold text-orange-900">
            {stats.totalLogs}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Used By</label>
              <input
                type="text"
                value={filters.usedBy || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, usedBy: e.target.value }))}
                placeholder="Filter by user..."
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setFilters({})}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-sm text-gray-600 mr-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'quantity' | 'cost')}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="date">Date</option>
              <option value="quantity">Quantity</option>
              <option value="cost">Cost</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mr-2">Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredLogs.length} of {usageLogs.length} logs
        </div>
      </div>

      {/* Usage Logs */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading usage history...</p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-lg mt-0.5">{getContextIcon(log)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">
                        {getContextName(log)}
                      </h4>
                      <span className="text-sm font-medium text-blue-600">
                        {log.quantity} {log.unit}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <span>{formatDate(log.date)}</span>
                      {log.cost && (
                        <span className="text-green-600">${log.cost.toFixed(2)}</span>
                      )}
                    </div>

                    {log.purpose && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Purpose:</span> {log.purpose}
                      </p>
                    )}

                    {log.notes && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Notes:</span> {log.notes}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {log.usedBy && (
                        <span>👤 {log.usedBy}</span>
                      )}
                      {log.batchNumber && (
                        <span>🏷️ Batch: {log.batchNumber}</span>
                      )}
                      {log.lotNumber && (
                        <span>📦 Lot: {log.lotNumber}</span>
                      )}
                      {log.wasteGenerated && (
                        <span>♻️ Waste: {log.wasteGenerated} {log.wasteUnit}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No usage history found for this entity.</p>
          <p className="text-sm">Usage logs will appear here when entities are used in experiments, tasks, or protocols.</p>
        </div>
      )}
    </div>
  );
}; 