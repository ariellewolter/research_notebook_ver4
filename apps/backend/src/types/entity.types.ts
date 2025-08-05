export type EntityType = 'chemical' | 'gene' | 'reagent' | 'equipment';

// Base entity interface
export interface BaseEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  stockLevel: number;
  unit: string;
  location?: string;
  vendorInfo?: string;
  tags?: string;
  metadata?: string;
  cost?: number;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chemical specific interface
export interface Chemical extends BaseEntity {
  catalogNumber?: string;
  molecularWeight?: number;
  purity?: string;
  concentration?: string;
  storage?: string;
  expiryDate?: Date;
  minStockLevel?: number;
}

// Gene specific interface
export interface Gene extends BaseEntity {
  sequence?: string;
  organism?: string;
  accessionNumber?: string;
  vector?: string;
  resistance?: string;
  promoter?: string;
  terminator?: string;
  insertSize?: number;
  concentration?: string;
  storage?: string;
  expiryDate?: Date;
  minStockLevel?: number;
}

// Reagent specific interface
export interface Reagent extends BaseEntity {
  catalogNumber?: string;
  lotNumber?: string;
  concentration?: string;
  specificity?: string;
  hostSpecies?: string;
  isotype?: string;
  conjugate?: string;
  storage?: string;
  expiryDate?: Date;
  minStockLevel?: number;
}

// Equipment specific interface
export interface Equipment extends BaseEntity {
  modelNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  maintenanceDate?: Date;
  status: string;
  specifications?: string;
  calibrationDate?: Date;
  nextCalibration?: Date;
}

// Usage log interface
export interface UsageLog {
  id: string;
  entityType: EntityType;
  entityId: string;
  quantity: number;
  unit: string;
  date: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

// Input types for API operations
export type EntityCreateInput = Omit<BaseEntity, 'id' | 'createdAt' | 'updatedAt'> & {
  // Chemical specific fields
  catalogNumber?: string;
  molecularWeight?: number;
  purity?: string;
  concentration?: string;
  storage?: string;
  expiryDate?: Date;
  minStockLevel?: number;
  
  // Gene specific fields
  sequence?: string;
  organism?: string;
  accessionNumber?: string;
  vector?: string;
  resistance?: string;
  promoter?: string;
  terminator?: string;
  insertSize?: number;
  
  // Reagent specific fields
  lotNumber?: string;
  specificity?: string;
  hostSpecies?: string;
  isotype?: string;
  conjugate?: string;
  
  // Equipment specific fields
  modelNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  maintenanceDate?: Date;
  status?: string;
  specifications?: string;
  calibrationDate?: Date;
  nextCalibration?: Date;
};

export type EntityUpdateInput = Partial<EntityCreateInput>;

export interface UsageLogInput {
  entityType: EntityType;
  entityId: string;
  quantity: number;
  unit: string;
  date?: Date;
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
}

// Filter types for entity listing
export interface EntityFilters {
  name?: string;
  type?: string;
  location?: string;
  tags?: string;
  lowStock?: boolean;
  expiring?: boolean;
  status?: string;
}

// Response types
export interface EntityListResponse {
  entities: (Chemical | Gene | Reagent | Equipment)[];
  total: number;
  page: number;
  limit: number;
}

export interface UsageHistoryResponse {
  usageLogs: UsageLog[];
  total: number;
  page: number;
  limit: number;
}

export interface StockAlertResponse {
  lowStock: (Chemical | Gene | Reagent)[];
  expiring: (Chemical | Gene | Reagent | Equipment)[];
  maintenance: Equipment[];
}

// Task/Protocol entity usage types
export interface EntityUsage {
  entityType: EntityType;
  entityId: string;
  quantity: number;
  unit: string;
  notes?: string;
  purpose?: string;
}

export interface TaskEntityUsage {
  taskId: string;
  entities: EntityUsage[];
}

export interface ProtocolEntityUsage {
  protocolId: string;
  entities: EntityUsage[];
} 