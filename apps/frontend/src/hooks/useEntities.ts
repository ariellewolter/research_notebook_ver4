import { useState, useCallback, useEffect } from 'react';
import { entityApiService } from '../services/api/entities';
import { 
  EntityType, 
  EntityCreateInput, 
  EntityUpdateInput, 
  UsageLogInput, 
  EntityFilters,
  EntityListResponse,
  UsageHistoryResponse,
  StockAlertResponse,
  ExpiringItemsResponse,
  BulkUsageResponse
} from '../types/entity.types';

interface UseEntitiesState {
  entities: any[];
  loading: boolean;
  error: string | null;
  total: number;
}

interface UseEntityState {
  entity: any | null;
  loading: boolean;
  error: string | null;
}

interface UseUsageHistoryState {
  usageLogs: any[];
  loading: boolean;
  error: string | null;
  total: number;
}

export const useEntities = (type: EntityType, filters?: EntityFilters) => {
  const [state, setState] = useState<UseEntitiesState>({
    entities: [],
    loading: false,
    error: null,
    total: 0
  });

  const fetchEntities = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.listEntities(type, filters);
      setState({
        entities: response.data.entities,
        loading: false,
        error: null,
        total: response.data.total
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch entities'
      }));
    }
  }, [type, filters]);

  const createEntity = useCallback(async (data: EntityCreateInput) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.createEntity(type, data);
      await fetchEntities(); // Refresh the list
      return response.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create entity'
      }));
      throw error;
    }
  }, [type, fetchEntities]);

  const updateEntity = useCallback(async (id: string, data: EntityUpdateInput) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.updateEntity(type, id, data);
      await fetchEntities(); // Refresh the list
      return response.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update entity'
      }));
      throw error;
    }
  }, [type, fetchEntities]);

  const deleteEntity = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await entityApiService.deleteEntity(type, id);
      await fetchEntities(); // Refresh the list
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete entity'
      }));
      throw error;
    }
  }, [type, fetchEntities]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  return {
    ...state,
    fetchEntities,
    createEntity,
    updateEntity,
    deleteEntity
  };
};

export const useEntity = (type: EntityType, id: string) => {
  const [state, setState] = useState<UseEntityState>({
    entity: null,
    loading: false,
    error: null
  });

  const fetchEntity = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.getEntity(type, id);
      setState({
        entity: response.data,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch entity'
      }));
    }
  }, [type, id]);

  const updateEntity = useCallback(async (data: EntityUpdateInput) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.updateEntity(type, id, data);
      setState(prev => ({
        ...prev,
        entity: response.data,
        loading: false
      }));
      return response.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update entity'
      }));
      throw error;
    }
  }, [type, id]);

  const updateStockLevel = useCallback(async (quantity: number, operation: 'add' | 'subtract' | 'set', notes?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.updateStockLevel(type, id, quantity, operation, notes);
      setState(prev => ({
        ...prev,
        entity: response.data,
        loading: false
      }));
      return response.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to update stock level'
      }));
      throw error;
    }
  }, [type, id]);

  useEffect(() => {
    fetchEntity();
  }, [fetchEntity]);

  return {
    ...state,
    fetchEntity,
    updateEntity,
    updateStockLevel
  };
};

export const useUsageHistory = (type: EntityType, id: string, limit?: number) => {
  const [state, setState] = useState<UseUsageHistoryState>({
    usageLogs: [],
    loading: false,
    error: null,
    total: 0
  });

  const fetchUsageHistory = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.getUsageHistory(type, id, limit);
      setState({
        usageLogs: response.data.usageLogs,
        loading: false,
        error: null,
        total: response.data.total
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch usage history'
      }));
    }
  }, [type, id, limit]);

  const logUsage = useCallback(async (data: Omit<UsageLogInput, 'entityType' | 'entityId'>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await entityApiService.logEntityUsage(type, id, data);
      await fetchUsageHistory(); // Refresh the usage history
      return response.data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to log usage'
      }));
      throw error;
    }
  }, [type, id, fetchUsageHistory]);

  useEffect(() => {
    fetchUsageHistory();
  }, [fetchUsageHistory]);

  return {
    ...state,
    fetchUsageHistory,
    logUsage
  };
};

export const useStockAlerts = () => {
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [expiringAlerts, setExpiringAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStockAlerts = useCallback(async (type?: EntityType) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await entityApiService.getLowStockAlerts(type);
      setLowStockAlerts(response.data.alerts);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch low stock alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExpiringAlerts = useCallback(async (type?: EntityType, days?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await entityApiService.getExpiringItems(type, days);
      setExpiringAlerts(response.data.expiring);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch expiring alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    lowStockAlerts,
    expiringAlerts,
    loading,
    error,
    fetchLowStockAlerts,
    fetchExpiringAlerts
  };
};

export const useBulkUsage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkLogUsage = useCallback(async (usages: UsageLogInput[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await entityApiService.bulkLogUsage(usages);
      return response.data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to log bulk usage');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logTaskEntityUsage = useCallback(async (taskId: string, entities: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await entityApiService.logTaskEntityUsage(taskId, entities);
      return response.data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to log task entity usage');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logProtocolEntityUsage = useCallback(async (protocolId: string, entities: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await entityApiService.logProtocolEntityUsage(protocolId, entities);
      return response.data;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to log protocol entity usage');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    bulkLogUsage,
    logTaskEntityUsage,
    logProtocolEntityUsage
  };
}; 