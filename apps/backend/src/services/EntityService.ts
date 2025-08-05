import { PrismaClient } from '@prisma/client';
import { EntityType, EntityCreateInput, EntityUpdateInput, UsageLogInput } from '../types/entity.types';

const prisma = new PrismaClient();

export class EntityService {
  // Generic entity creation
  async createEntity(type: EntityType, data: EntityCreateInput) {
    switch (type) {
      case 'chemical':
        return await prisma.chemical.create({ data });
      case 'gene':
        return await prisma.gene.create({ data });
      case 'reagent':
        return await prisma.reagent.create({ data });
      case 'equipment':
        return await prisma.equipment.create({ data });
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  // Generic entity update
  async updateEntity(type: EntityType, id: string, data: EntityUpdateInput) {
    switch (type) {
      case 'chemical':
        return await prisma.chemical.update({ where: { id }, data });
      case 'gene':
        return await prisma.gene.update({ where: { id }, data });
      case 'reagent':
        return await prisma.reagent.update({ where: { id }, data });
      case 'equipment':
        return await prisma.equipment.update({ where: { id }, data });
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  // Generic entity retrieval
  async getEntity(type: EntityType, id: string) {
    switch (type) {
      case 'chemical':
        return await prisma.chemical.findUnique({
          where: { id },
          include: {
            usageLogs: {
              orderBy: { date: 'desc' },
              take: 10
            },
            notes: true,
            protocols: true,
            tasks: true
          }
        });
      case 'gene':
        return await prisma.gene.findUnique({
          where: { id },
          include: {
            usageLogs: {
              orderBy: { date: 'desc' },
              take: 10
            },
            notes: true,
            protocols: true,
            tasks: true
          }
        });
      case 'reagent':
        return await prisma.reagent.findUnique({
          where: { id },
          include: {
            usageLogs: {
              orderBy: { date: 'desc' },
              take: 10
            },
            notes: true,
            protocols: true,
            tasks: true
          }
        });
      case 'equipment':
        return await prisma.equipment.findUnique({
          where: { id },
          include: {
            usageLogs: {
              orderBy: { date: 'desc' },
              take: 10
            },
            notes: true,
            protocols: true,
            tasks: true
          }
        });
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  // Generic entity listing with filters
  async listEntities(type: EntityType, filters?: any) {
    const where = this.buildWhereClause(filters);
    
    switch (type) {
      case 'chemical':
        return await prisma.chemical.findMany({
          where,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { usageLogs: true }
            }
          }
        });
      case 'gene':
        return await prisma.gene.findMany({
          where,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { usageLogs: true }
            }
          }
        });
      case 'reagent':
        return await prisma.reagent.findMany({
          where,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { usageLogs: true }
            }
          }
        });
      case 'equipment':
        return await prisma.equipment.findMany({
          where,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { usageLogs: true }
            }
          }
        });
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  // Stock level management
  async updateStockLevel(type: EntityType, id: string, quantity: number, operation: 'add' | 'subtract' | 'set') {
    const entity = await this.getEntity(type, id);
    if (!entity) {
      throw new Error(`Entity not found: ${id}`);
    }

    let newStockLevel: number;
    const currentStock = entity.stockLevel;

    switch (operation) {
      case 'add':
        newStockLevel = currentStock + quantity;
        break;
      case 'subtract':
        newStockLevel = Math.max(0, currentStock - quantity);
        break;
      case 'set':
        newStockLevel = Math.max(0, quantity);
        break;
      default:
        throw new Error(`Invalid operation: ${operation}`);
    }

    return await this.updateEntity(type, id, { stockLevel: newStockLevel });
  }

  // Usage logging with automatic stock deduction
  async logUsage(data: UsageLogInput) {
    const { entityType, entityId, quantity, ...usageData } = data;

    // Create usage log
    const usageLog = await prisma.usageLog.create({
      data: {
        entityType,
        entityId,
        quantity,
        ...usageData
      }
    });

    // Deduct stock level (except for equipment which doesn't consume stock)
    if (entityType !== 'equipment') {
      await this.updateStockLevel(entityType, entityId, quantity, 'subtract');
    }

    return usageLog;
  }

  // Get usage history for an entity
  async getUsageHistory(type: EntityType, id: string, limit = 50) {
    return await prisma.usageLog.findMany({
      where: {
        entityType: type,
        entityId: id
      },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        experiment: true,
        task: true,
        protocol: true
      }
    });
  }

  // Get low stock alerts
  async getLowStockAlerts(type: EntityType) {
    const where = {
      AND: [
        { minStockLevel: { not: null } },
        {
          OR: [
            { stockLevel: { lte: { minStockLevel: true } } },
            { stockLevel: 0 }
          ]
        }
      ]
    };

    switch (type) {
      case 'chemical':
        return await prisma.chemical.findMany({ where });
      case 'gene':
        return await prisma.gene.findMany({ where });
      case 'reagent':
        return await prisma.reagent.findMany({ where });
      case 'equipment':
        return await prisma.equipment.findMany({
          where: { status: 'maintenance' }
        });
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  // Get expiring items
  async getExpiringItems(type: EntityType, daysThreshold = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const where = {
      expiryDate: {
        not: null,
        lte: thresholdDate,
        gte: new Date()
      }
    };

    switch (type) {
      case 'chemical':
        return await prisma.chemical.findMany({ where });
      case 'gene':
        return await prisma.gene.findMany({ where });
      case 'reagent':
        return await prisma.reagent.findMany({ where });
      case 'equipment':
        return await prisma.equipment.findMany({
          where: {
            warrantyExpiry: {
              not: null,
              lte: thresholdDate,
              gte: new Date()
            }
          }
        });
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  private buildWhereClause(filters?: any) {
    if (!filters) return {};

    const where: any = {};

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.tags) {
      where.tags = { contains: filters.tags, mode: 'insensitive' };
    }

    if (filters.lowStock) {
      where.stockLevel = { lte: 0 };
    }

    if (filters.expiring) {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + 30);
      where.expiryDate = {
        not: null,
        lte: thresholdDate,
        gte: new Date()
      };
    }

    return where;
  }
} 