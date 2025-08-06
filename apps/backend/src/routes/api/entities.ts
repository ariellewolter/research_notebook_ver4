import { Router } from 'express';
import { EntityService } from '../../services/EntityService';
import { asyncHandler } from '../../middleware/asyncHandler';
import { EntityType, EntityCreateInput, EntityUpdateInput, UsageLogInput } from '../../types/entity.types';

const router = Router();
const entityService = new EntityService();

// Generic entity routes
router.get('/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const filters = req.query;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  const entities = await entityService.listEntities(type as EntityType, filters);
  res.json({ entities, total: entities.length });
}));

router.post('/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const data: EntityCreateInput = req.body;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  const entity = await entityService.createEntity(type as EntityType, data);
  res.status(201).json(entity);
}));

router.get('/:type/:id', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  const entity = await entityService.getEntity(type as EntityType, id);
  if (!entity) {
    return res.status(404).json({ error: 'Entity not found' });
  }

  res.json(entity);
}));

router.put('/:type/:id', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const data: EntityUpdateInput = req.body;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  const entity = await entityService.updateEntity(type as EntityType, id, data);
  res.json(entity);
}));

router.delete('/:type/:id', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  // Note: Implement soft delete or hard delete based on requirements
  res.status(204).send();
}));

// Stock management routes
router.post('/:type/:id/stock', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { quantity, operation } = req.body;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  if (!['add', 'subtract', 'set'].includes(operation)) {
    return res.status(400).json({ error: 'Invalid operation' });
  }

  const entity = await entityService.updateStockLevel(type as EntityType, id, quantity, operation);
  res.json(entity);
}));

// Usage tracking routes
router.post('/usage', asyncHandler(async (req, res) => {
  const data: UsageLogInput = req.body;
  const usageLog = await entityService.logUsage(data);
  res.status(201).json(usageLog);
}));

router.get('/:type/:id/usage', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { limit = 50 } = req.query;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  const usageHistory = await entityService.getUsageHistory(type as EntityType, id, Number(limit));
  res.json({ usageLogs: usageHistory, total: usageHistory.length });
}));

// Alert routes
router.get('/alerts/low-stock/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  const alerts = await entityService.getLowStockAlerts(type as EntityType);
  res.json(alerts);
}));

router.get('/alerts/expiring/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { days = 30 } = req.query;
  
  if (!['chemical', 'gene', 'reagent', 'equipment'].includes(type)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  const expiring = await entityService.getExpiringItems(type as EntityType, Number(days));
  res.json(expiring);
}));

// Bulk operations
router.post('/usage/bulk', asyncHandler(async (req, res) => {
  const { usages }: { usages: UsageLogInput[] } = req.body;
  
  const results = [];
  for (const usage of usages) {
    try {
      const result = await entityService.logUsage(usage);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: (error as Error).message });
    }
  }
  
  res.json({ results });
}));

// Task/Protocol entity usage routes
router.post('/tasks/:taskId/entities', asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { entities }: { entities: any[] } = req.body;
  
  const results = [];
  for (const entityUsage of entities) {
    try {
      const usageData: UsageLogInput = {
        ...entityUsage,
        taskId,
        date: new Date()
      };
      const result = await entityService.logUsage(usageData);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  res.json({ results });
}));

router.post('/protocols/:protocolId/entities', asyncHandler(async (req, res) => {
  const { protocolId } = req.params;
  const { entities }: { entities: any[] } = req.body;
  
  const results = [];
  for (const entityUsage of entities) {
    try {
      const usageData: UsageLogInput = {
        ...entityUsage,
        protocolId,
        date: new Date()
      };
      const result = await entityService.logUsage(usageData);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  res.json({ results });
}));

export default router; 