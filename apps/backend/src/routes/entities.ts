import { Router } from 'express';
import { EntityService } from '../services/EntityService';
import { asyncHandler } from '../middleware/asyncHandler';
import { EntityType, EntityCreateInput, EntityUpdateInput, UsageLogInput } from '../types/entity.types';

const router = Router();
const entityService = new EntityService();

// Validation middleware for entity types
const validateEntityType = (req: any, res: any, next: any) => {
  const { type } = req.params;
  const validTypes = ['chemical', 'gene', 'reagent', 'equipment'];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid entity type', 
      validTypes,
      received: type 
    });
  }
  
  req.entityType = type as EntityType;
  next();
};

// Validation middleware for entity data
const validateEntityData = (req: any, res: any, next: any) => {
  const { name, type, stockLevel, unit } = req.body;
  
  if (!name || !type || stockLevel === undefined || !unit) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['name', 'type', 'stockLevel', 'unit'],
      received: { name, type, stockLevel, unit }
    });
  }
  
  if (stockLevel < 0) {
    return res.status(400).json({ 
      error: 'Stock level cannot be negative',
      received: stockLevel 
    });
  }
  
  next();
};

// Validation middleware for usage data
const validateUsageData = (req: any, res: any, next: any) => {
  const { quantity, unit } = req.body;
  
  if (quantity === undefined || !unit) {
    return res.status(400).json({ 
      error: 'Missing required usage fields',
      required: ['quantity', 'unit'],
      received: { quantity, unit }
    });
  }
  
  if (quantity <= 0) {
    return res.status(400).json({ 
      error: 'Usage quantity must be positive',
      received: quantity 
    });
  }
  
  next();
};

// GET /entities/:type - List entities by type with filtering
router.get('/:type', validateEntityType, asyncHandler(async (req, res) => {
  const { type } = req.params;
  const filters = req.query;
  
  const entities = await entityService.listEntities(type as EntityType, filters);
  
  res.json({
    success: true,
    data: {
      entities,
      total: entities.length,
      type,
      filters
    }
  });
}));

// GET /entities/:type/:id - Get specific entity details
router.get('/:type/:id', validateEntityType, asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  
  const entity = await entityService.getEntity(type as EntityType, id);
  
  if (!entity) {
    return res.status(404).json({ 
      error: 'Entity not found',
      type,
      id 
    });
  }
  
  res.json({
    success: true,
    data: entity
  });
}));

// POST /entities/:type - Create entity
router.post('/:type', validateEntityType, validateEntityData, asyncHandler(async (req, res) => {
  const { type } = req.params;
  const data: EntityCreateInput = req.body;
  
  const entity = await entityService.createEntity(type as EntityType, data);
  
  res.status(201).json({
    success: true,
    data: entity,
    message: `${type} created successfully`
  });
}));

// PUT /entities/:type/:id - Update entity
router.put('/:type/:id', validateEntityType, asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const data: EntityUpdateInput = req.body;
  
  // Check if entity exists
  const existingEntity = await entityService.getEntity(type as EntityType, id);
  if (!existingEntity) {
    return res.status(404).json({ 
      error: 'Entity not found',
      type,
      id 
    });
  }
  
  const entity = await entityService.updateEntity(type as EntityType, id, data);
  
  res.json({
    success: true,
    data: entity,
    message: `${type} updated successfully`
  });
}));

// DELETE /entities/:type/:id - Delete entity
router.delete('/:type/:id', validateEntityType, asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  
  // Check if entity exists
  const existingEntity = await entityService.getEntity(type as EntityType, id);
  if (!existingEntity) {
    return res.status(404).json({ 
      error: 'Entity not found',
      type,
      id 
    });
  }
  
  // For now, implement soft delete by setting a deleted flag
  // You can modify this based on your requirements
  await entityService.updateEntity(type as EntityType, id, { 
    metadata: JSON.stringify({ 
      ...JSON.parse(existingEntity.metadata || '{}'),
      deleted: true,
      deletedAt: new Date().toISOString()
    })
  });
  
  res.json({
    success: true,
    message: `${type} deleted successfully`
  });
}));

// POST /entities/:type/:id/usage - Log usage for stock deduction
router.post('/:type/:id/usage', validateEntityType, validateUsageData, asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { quantity, unit, notes, purpose, experimentId, taskId, protocolId } = req.body;
  
  // Check if entity exists
  const existingEntity = await entityService.getEntity(type as EntityType, id);
  if (!existingEntity) {
    return res.status(404).json({ 
      error: 'Entity not found',
      type,
      id 
    });
  }
  
  // Check if there's enough stock (except for equipment)
  if (type !== 'equipment' && existingEntity.stockLevel < quantity) {
    return res.status(400).json({ 
      error: 'Insufficient stock',
      available: existingEntity.stockLevel,
      requested: quantity,
      unit: existingEntity.unit
    });
  }
  
  const usageData: UsageLogInput = {
    entityType: type as EntityType,
    entityId: id,
    quantity,
    unit,
    notes,
    purpose,
    experimentId,
    taskId,
    protocolId,
    date: new Date()
  };
  
  const usageLog = await entityService.logUsage(usageData);
  
  res.status(201).json({
    success: true,
    data: usageLog,
    message: 'Usage logged successfully'
  });
}));

// GET /entities/:type/:id/usage - Get usage history
router.get('/:type/:id/usage', validateEntityType, asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { limit = 50, page = 1 } = req.query;
  
  // Check if entity exists
  const existingEntity = await entityService.getEntity(type as EntityType, id);
  if (!existingEntity) {
    return res.status(404).json({ 
      error: 'Entity not found',
      type,
      id 
    });
  }
  
  const usageHistory = await entityService.getUsageHistory(type as EntityType, id, Number(limit));
  
  res.json({
    success: true,
    data: {
      usageLogs: usageHistory,
      total: usageHistory.length,
      entity: {
        id: existingEntity.id,
        name: existingEntity.name,
        currentStock: existingEntity.stockLevel,
        unit: existingEntity.unit
      }
    }
  });
}));

// POST /entities/:type/:id/stock - Update stock level
router.post('/:type/:id/stock', validateEntityType, asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { quantity, operation, notes } = req.body;
  
  if (!['add', 'subtract', 'set'].includes(operation)) {
    return res.status(400).json({ 
      error: 'Invalid operation',
      validOperations: ['add', 'subtract', 'set'],
      received: operation 
    });
  }
  
  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({ 
      error: 'Quantity must be a positive number',
      received: quantity 
    });
  }
  
  // Check if entity exists
  const existingEntity = await entityService.getEntity(type as EntityType, id);
  if (!existingEntity) {
    return res.status(404).json({ 
      error: 'Entity not found',
      type,
      id 
    });
  }
  
  const entity = await entityService.updateStockLevel(type as EntityType, id, quantity, operation);
  
  // Log the stock adjustment as usage if notes are provided
  if (notes) {
    const usageData: UsageLogInput = {
      entityType: type as EntityType,
      entityId: id,
      quantity: operation === 'subtract' ? quantity : 0,
      unit: entity.unit,
      notes: `Stock adjustment: ${operation} ${quantity} ${entity.unit}. ${notes}`,
      purpose: 'stock_adjustment',
      date: new Date()
    };
    
    await entityService.logUsage(usageData);
  }
  
  res.json({
    success: true,
    data: entity,
    message: `Stock ${operation}ed successfully`
  });
}));

// GET /entities/alerts/low-stock - Get low stock alerts
router.get('/alerts/low-stock', asyncHandler(async (req, res) => {
  const { type } = req.query;
  
  if (type && !['chemical', 'gene', 'reagent', 'equipment'].includes(type as string)) {
    return res.status(400).json({ 
      error: 'Invalid entity type',
      validTypes: ['chemical', 'gene', 'reagent', 'equipment'],
      received: type 
    });
  }
  
  const alerts = [];
  
  if (!type || type === 'chemical') {
    const chemicalAlerts = await entityService.getLowStockAlerts('chemical');
    alerts.push(...chemicalAlerts.map(item => ({ ...item, entityType: 'chemical' })));
  }
  
  if (!type || type === 'gene') {
    const geneAlerts = await entityService.getLowStockAlerts('gene');
    alerts.push(...geneAlerts.map(item => ({ ...item, entityType: 'gene' })));
  }
  
  if (!type || type === 'reagent') {
    const reagentAlerts = await entityService.getLowStockAlerts('reagent');
    alerts.push(...reagentAlerts.map(item => ({ ...item, entityType: 'reagent' })));
  }
  
  if (!type || type === 'equipment') {
    const equipmentAlerts = await entityService.getLowStockAlerts('equipment');
    alerts.push(...equipmentAlerts.map(item => ({ ...item, entityType: 'equipment' })));
  }
  
  res.json({
    success: true,
    data: {
      alerts,
      total: alerts.length,
      type: type || 'all'
    }
  });
}));

// GET /entities/alerts/expiring - Get expiring items
router.get('/alerts/expiring', asyncHandler(async (req, res) => {
  const { type, days = 30 } = req.query;
  
  if (type && !['chemical', 'gene', 'reagent', 'equipment'].includes(type as string)) {
    return res.status(400).json({ 
      error: 'Invalid entity type',
      validTypes: ['chemical', 'gene', 'reagent', 'equipment'],
      received: type 
    });
  }
  
  const expiring = [];
  
  if (!type || type === 'chemical') {
    const chemicalExpiring = await entityService.getExpiringItems('chemical', Number(days));
    expiring.push(...chemicalExpiring.map(item => ({ ...item, entityType: 'chemical' })));
  }
  
  if (!type || type === 'gene') {
    const geneExpiring = await entityService.getExpiringItems('gene', Number(days));
    expiring.push(...geneExpiring.map(item => ({ ...item, entityType: 'gene' })));
  }
  
  if (!type || type === 'reagent') {
    const reagentExpiring = await entityService.getExpiringItems('reagent', Number(days));
    expiring.push(...reagentExpiring.map(item => ({ ...item, entityType: 'reagent' })));
  }
  
  if (!type || type === 'equipment') {
    const equipmentExpiring = await entityService.getExpiringItems('equipment', Number(days));
    expiring.push(...equipmentExpiring.map(item => ({ ...item, entityType: 'equipment' })));
  }
  
  res.json({
    success: true,
    data: {
      expiring,
      total: expiring.length,
      days: Number(days),
      type: type || 'all'
    }
  });
}));

// POST /entities/usage/bulk - Bulk usage logging
router.post('/usage/bulk', asyncHandler(async (req, res) => {
  const { usages }: { usages: UsageLogInput[] } = req.body;
  
  if (!Array.isArray(usages) || usages.length === 0) {
    return res.status(400).json({ 
      error: 'Usages must be a non-empty array',
      received: usages 
    });
  }
  
  const results = [];
  
  for (const usage of usages) {
    try {
      // Validate usage data
      if (!usage.entityType || !usage.entityId || usage.quantity === undefined || !usage.unit) {
        results.push({ 
          success: false, 
          error: 'Missing required fields',
          usage 
        });
        continue;
      }
      
      // Check if entity exists
      const existingEntity = await entityService.getEntity(usage.entityType, usage.entityId);
      if (!existingEntity) {
        results.push({ 
          success: false, 
          error: 'Entity not found',
          usage 
        });
        continue;
      }
      
      // Check stock availability
      if (usage.entityType !== 'equipment' && existingEntity.stockLevel < usage.quantity) {
        results.push({ 
          success: false, 
          error: 'Insufficient stock',
          usage,
          available: existingEntity.stockLevel 
        });
        continue;
      }
      
      const result = await entityService.logUsage(usage);
      results.push({ success: true, data: result });
      
    } catch (error) {
      results.push({ 
        success: false, 
        error: error.message,
        usage 
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  res.json({
    success: true,
    data: {
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    }
  });
}));

export default router; 