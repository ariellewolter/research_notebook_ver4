import { PrismaClient } from '@prisma/client';
import { 
    FreeformDrawingBlock, 
    CreateFreeformDrawingBlockRequest, 
    UpdateFreeformDrawingBlockRequest,
    DrawingData 
} from '../types/blocks';

const prisma = new PrismaClient();

export class BlocksService {
    /**
     * Get all freeform drawing blocks for a specific entity
     */
    static async getBlocksByEntity(
        entityType: string, 
        entityId: string, 
        page: number = 1, 
        limit: number = 20
    ) {
        const skip = (page - 1) * limit;

        const [blocks, total] = await Promise.all([
            prisma.freeformDrawingBlock.findMany({
                where: { entityId, entityType },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.freeformDrawingBlock.count({
                where: { entityId, entityType }
            })
        ]);

        return {
            blocks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get a specific freeform drawing block by blockId
     */
    static async getBlockByBlockId(blockId: string): Promise<FreeformDrawingBlock | null> {
        return await prisma.freeformDrawingBlock.findUnique({
            where: { blockId }
        });
    }

    /**
     * Create a new freeform drawing block
     */
    static async createBlock(data: CreateFreeformDrawingBlockRequest): Promise<FreeformDrawingBlock> {
        // Check if block already exists
        const existingBlock = await prisma.freeformDrawingBlock.findUnique({
            where: { blockId: data.blockId }
        });

        if (existingBlock) {
            throw new Error('Block with this ID already exists');
        }

        // Verify entity exists
        await this.verifyEntityExists(data.entityType, data.entityId);

        return await prisma.freeformDrawingBlock.create({
            data: {
                blockId: data.blockId,
                entityId: data.entityId,
                entityType: data.entityType,
                strokes: data.strokes || '[]',
                svgPath: data.svgPath || '',
                pngThumbnail: data.pngThumbnail || '',
                width: data.width || 600,
                height: data.height || 400
            }
        });
    }

    /**
     * Update an existing freeform drawing block
     */
    static async updateBlock(
        blockId: string, 
        data: UpdateFreeformDrawingBlockRequest
    ): Promise<FreeformDrawingBlock> {
        const existingBlock = await prisma.freeformDrawingBlock.findUnique({
            where: { blockId }
        });

        if (!existingBlock) {
            throw new Error('Freeform drawing block not found');
        }

        return await prisma.freeformDrawingBlock.update({
            where: { blockId },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });
    }

    /**
     * Delete a freeform drawing block
     */
    static async deleteBlock(blockId: string): Promise<void> {
        const existingBlock = await prisma.freeformDrawingBlock.findUnique({
            where: { blockId }
        });

        if (!existingBlock) {
            throw new Error('Freeform drawing block not found');
        }

        await prisma.freeformDrawingBlock.delete({
            where: { blockId }
        });
    }

    /**
     * Get statistics for freeform drawing blocks
     */
    static async getStats() {
        const [totalBlocks, blocksByEntityType, recentBlocks] = await Promise.all([
            prisma.freeformDrawingBlock.count(),
            prisma.freeformDrawingBlock.groupBy({
                by: ['entityType'],
                _count: {
                    entityType: true
                }
            }),
            prisma.freeformDrawingBlock.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    blockId: true,
                    entityType: true,
                    entityId: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
        ]);

        const statsByType = blocksByEntityType.reduce((acc, item) => {
            acc[item.entityType] = item._count.entityType;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: totalBlocks,
            byEntityType: statsByType,
            recent: recentBlocks
        };
    }

    /**
     * Bulk create freeform drawing blocks
     */
    static async bulkCreateBlocks(blocks: CreateFreeformDrawingBlockRequest[]) {
        // Verify all entities exist
        for (const block of blocks) {
            await this.verifyEntityExists(block.entityType, block.entityId);
        }

        const result = await prisma.freeformDrawingBlock.createMany({
            data: blocks.map(block => ({
                blockId: block.blockId,
                entityId: block.entityId,
                entityType: block.entityType,
                strokes: block.strokes || '[]',
                svgPath: block.svgPath || '',
                pngThumbnail: block.pngThumbnail || '',
                width: block.width || 600,
                height: block.height || 400
            })),
            skipDuplicates: true
        });

        return {
            message: `Created ${result.count} freeform drawing blocks`,
            count: result.count
        };
    }

    /**
     * Search freeform drawing blocks
     */
    static async searchBlocks(
        query?: string, 
        entityType?: string, 
        page: number = 1, 
        limit: number = 20
    ) {
        const skip = (page - 1) * limit;

        const where: any = {};
        
        if (entityType) {
            where.entityType = entityType;
        }

        if (query) {
            where.OR = [
                { blockId: { contains: query, mode: 'insensitive' } },
                { entityId: { contains: query, mode: 'insensitive' } }
            ];
        }

        const [blocks, total] = await Promise.all([
            prisma.freeformDrawingBlock.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.freeformDrawingBlock.count({ where })
        ]);

        return {
            blocks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Convert DrawingData to database format
     */
    static convertDrawingDataToDatabase(drawingData: DrawingData) {
        return {
            strokes: JSON.stringify(drawingData.strokes),
            svgPath: drawingData.svgPath,
            pngThumbnail: drawingData.pngThumbnail,
            width: drawingData.width,
            height: drawingData.height
        };
    }

    /**
     * Convert database format to DrawingData
     */
    static convertDatabaseToDrawingData(block: FreeformDrawingBlock): DrawingData {
        return {
            strokes: JSON.parse(block.strokes),
            svgPath: block.svgPath,
            pngThumbnail: block.pngThumbnail,
            width: block.width,
            height: block.height,
            createdAt: block.createdAt.toISOString(),
            updatedAt: block.updatedAt.toISOString()
        };
    }

    /**
     * Verify that the referenced entity exists
     */
    private static async verifyEntityExists(entityType: string, entityId: string): Promise<void> {
        let entityExists = false;

        switch (entityType) {
            case 'note':
                entityExists = await prisma.note.findUnique({ where: { id: entityId } }) !== null;
                break;
            case 'project':
                entityExists = await prisma.project.findUnique({ where: { id: entityId } }) !== null;
                break;
            case 'protocol':
                entityExists = await prisma.protocol.findUnique({ where: { id: entityId } }) !== null;
                break;
            case 'task':
                entityExists = await prisma.task.findUnique({ where: { id: entityId } }) !== null;
                break;
            case 'database':
                entityExists = await prisma.databaseEntry.findUnique({ where: { id: entityId } }) !== null;
                break;
            default:
                throw new Error(`Invalid entity type: ${entityType}`);
        }

        if (!entityExists) {
            throw new Error(`${entityType} with ID ${entityId} not found`);
        }
    }
} 