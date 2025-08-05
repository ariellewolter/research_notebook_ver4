import { apiClient } from './apiClient';
import { EntityType, EntityCreateInput, EntityUpdateInput, UsageLogInput, EntityFilters } from '../../types/entity.types';

export interface EntityApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface EntityListResponse {
  entities: any[];
  total: number;
  type: string;
  filters: any;
}

export interface UsageHistoryResponse {
  usageLogs: any[];
  total: number;
  entity: {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
  };
}

export interface StockAlertResponse {
  alerts: any[];
  total: number;
  type: string;
}

export interface ExpiringItemsResponse {
  expiring: any[];
  total: number;
  days: number;
  type: string;
}

export interface BulkUsageResponse {
  results: Array<{
    success: boolean;
    data?: any;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export class EntityApiService {
  // Generic entity CRUD operations
  async listEntities(type: EntityType, filters?: EntityFilters): Promise<EntityListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await apiClient.get(`/api/entities/${type}?${params.toString()}`);
    return response.data;
  }

  async getEntity(type: EntityType, id: string): Promise<any> {
    const response = await apiClient.get(`/api/entities/${type}/${id}`);
    return response.data;
  }

  async createEntity(type: EntityType, data: EntityCreateInput): Promise<any> {
    const response = await apiClient.post(`/api/entities/${type}`, data);
    return response.data;
  }

  async updateEntity(type: EntityType, id: string, data: EntityUpdateInput): Promise<any> {
    const response = await apiClient.put(`/api/entities/${type}/${id}`, data);
    return response.data;
  }

  async deleteEntity(type: EntityType, id: string): Promise<void> {
    await apiClient.delete(`/api/entities/${type}/${id}`);
  }

  // Stock management
  async updateStockLevel(type: EntityType, id: string, quantity: number, operation: 'add' | 'subtract' | 'set', notes?: string): Promise<any> {
    const response = await apiClient.post(`/api/entities/${type}/${id}/stock`, {
      quantity,
      operation,
      notes
    });
    return response.data;
  }

  // Usage tracking
  async logUsage(data: UsageLogInput): Promise<any> {
    const response = await apiClient.post('/api/entities/usage', data);
    return response.data;
  }

  async logEntityUsage(type: EntityType, id: string, data: Omit<UsageLogInput, 'entityType' | 'entityId'>): Promise<any> {
    const response = await apiClient.post(`/api/entities/${type}/${id}/usage`, data);
    return response.data;
  }

  async getUsageHistory(type: EntityType, id: string, limit?: number): Promise<UsageHistoryResponse> {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', String(limit));
    }
    
    const response = await apiClient.get(`/api/entities/${type}/${id}/usage?${params.toString()}`);
    return response.data;
  }

  // Bulk operations
  async bulkLogUsage(usages: UsageLogInput[]): Promise<BulkUsageResponse> {
    const response = await apiClient.post('/api/entities/usage/bulk', { usages });
    return response.data;
  }

  // Alerts
  async getLowStockAlerts(type?: EntityType): Promise<StockAlertResponse> {
    const params = new URLSearchParams();
    if (type) {
      params.append('type', type);
    }
    
    const response = await apiClient.get(`/api/entities/alerts/low-stock?${params.toString()}`);
    return response.data;
  }

  async getExpiringItems(type?: EntityType, days?: number): Promise<ExpiringItemsResponse> {
    const params = new URLSearchParams();
    if (type) {
      params.append('type', type);
    }
    if (days) {
      params.append('days', String(days));
    }
    
    const response = await apiClient.get(`/api/entities/alerts/expiring?${params.toString()}`);
    return response.data;
  }

  // Task/Protocol entity usage
  async logTaskEntityUsage(taskId: string, entities: any[]): Promise<BulkUsageResponse> {
    const response = await apiClient.post(`/api/entities/tasks/${taskId}/entities`, { entities });
    return response.data;
  }

  async logProtocolEntityUsage(protocolId: string, entities: any[]): Promise<BulkUsageResponse> {
    const response = await apiClient.post(`/api/entities/protocols/${protocolId}/entities`, { entities });
    return response.data;
  }

  // Helper methods for specific entity types
  async listChemicals(filters?: EntityFilters): Promise<EntityListResponse> {
    return this.listEntities('chemical', filters);
  }

  async listGenes(filters?: EntityFilters): Promise<EntityListResponse> {
    return this.listEntities('gene', filters);
  }

  async listReagents(filters?: EntityFilters): Promise<EntityListResponse> {
    return this.listEntities('reagent', filters);
  }

  async listEquipment(filters?: EntityFilters): Promise<EntityListResponse> {
    return this.listEntities('equipment', filters);
  }

  async getChemical(id: string): Promise<any> {
    return this.getEntity('chemical', id);
  }

  async getGene(id: string): Promise<any> {
    return this.getEntity('gene', id);
  }

  async getReagent(id: string): Promise<any> {
    return this.getEntity('reagent', id);
  }

  async getEquipment(id: string): Promise<any> {
    return this.getEntity('equipment', id);
  }

  async createChemical(data: EntityCreateInput): Promise<any> {
    return this.createEntity('chemical', data);
  }

  async createGene(data: EntityCreateInput): Promise<any> {
    return this.createEntity('gene', data);
  }

  async createReagent(data: EntityCreateInput): Promise<any> {
    return this.createEntity('reagent', data);
  }

  async createEquipment(data: EntityCreateInput): Promise<any> {
    return this.createEntity('equipment', data);
  }

  async updateChemical(id: string, data: EntityUpdateInput): Promise<any> {
    return this.updateEntity('chemical', id, data);
  }

  async updateGene(id: string, data: EntityUpdateInput): Promise<any> {
    return this.updateEntity('gene', id, data);
  }

  async updateReagent(id: string, data: EntityUpdateInput): Promise<any> {
    return this.updateEntity('reagent', id, data);
  }

  async updateEquipment(id: string, data: EntityUpdateInput): Promise<any> {
    return this.updateEntity('equipment', id, data);
  }

  async deleteChemical(id: string): Promise<void> {
    return this.deleteEntity('chemical', id);
  }

  async deleteGene(id: string): Promise<void> {
    return this.deleteEntity('gene', id);
  }

  async deleteReagent(id: string): Promise<void> {
    return this.deleteEntity('reagent', id);
  }

  async deleteEquipment(id: string): Promise<void> {
    return this.deleteEntity('equipment', id);
  }
}

export const entityApiService = new EntityApiService(); 