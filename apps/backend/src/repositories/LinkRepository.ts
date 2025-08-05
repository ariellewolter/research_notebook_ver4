import { PrismaClient } from '@prisma/client';
import { EntityType } from '../types/link.types';

const prisma = new PrismaClient();

export class LinkRepository {
    async findMany(filters: {
        sourceType?: EntityType;
        sourceId?: string;
        targetType?: EntityType;
        targetId?: string;
        skip?: number;
        take?: number;
    }) {
        const where: any = {};
        
        if (filters.sourceType) {
            where.sourceType = filters.sourceType;
        }
        
        if (filters.sourceId) {
            where.sourceId = filters.sourceId;
        }
        
        if (filters.targetType) {
            where.targetType = filters.targetType;
        }
        
        if (filters.targetId) {
            where.targetId = filters.targetId;
        }

        return prisma.link.findMany({
            where,
            select: {
                id: true,
                sourceType: true,
                sourceId: true,
                targetType: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                updatedAt: true,
                note: {
                    select: { id: true, title: true, type: true },
                },
                highlight: {
                    select: { 
                        id: true, 
                        text: true, 
                        page: true,
                        pdf: {
                            select: { id: true, title: true }
                        }
                    },
                },
                databaseEntry: {
                    select: { id: true, name: true, type: true },
                },
                project: {
                    select: { id: true, title: true, status: true },
                },
                experiment: {
                    select: { id: true, title: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: filters.skip,
            take: filters.take,
        });
    }

    async findById(id: string) {
        return prisma.link.findFirst({
            where: { id },
            select: {
                id: true,
                sourceType: true,
                sourceId: true,
                targetType: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                updatedAt: true,
                note: {
                    select: { id: true, title: true, type: true },
                },
                highlight: {
                    select: { 
                        id: true, 
                        text: true, 
                        page: true,
                        pdf: {
                            select: { id: true, title: true }
                        }
                    },
                },
                databaseEntry: {
                    select: { id: true, name: true, type: true },
                },
                project: {
                    select: { id: true, title: true, status: true },
                },
                experiment: {
                    select: { id: true, title: true, status: true },
                },
            },
        });
    }

    async create(data: any) {
        return prisma.link.create({ data });
    }

    async delete(id: string) {
        return prisma.link.delete({
            where: { id },
        });
    }

    async getBacklinks(entityType: EntityType, entityId: string) {
        return prisma.link.findMany({
            where: {
                targetType: entityType,
                targetId: entityId,
            },
            select: {
                id: true,
                sourceType: true,
                sourceId: true,
                targetType: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                updatedAt: true,
                note: {
                    select: { id: true, title: true, type: true },
                },
                highlight: {
                    select: { 
                        id: true, 
                        text: true, 
                        page: true,
                        pdf: {
                            select: { id: true, title: true }
                        }
                    },
                },
                databaseEntry: {
                    select: { id: true, name: true, type: true },
                },
                project: {
                    select: { id: true, title: true, status: true },
                },
                experiment: {
                    select: { id: true, title: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getOutgoing(entityType: EntityType, entityId: string) {
        return prisma.link.findMany({
            where: {
                sourceType: entityType,
                sourceId: entityId,
            },
            select: {
                id: true,
                sourceType: true,
                sourceId: true,
                targetType: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                updatedAt: true,
                note: {
                    select: { id: true, title: true, type: true },
                },
                highlight: {
                    select: { 
                        id: true, 
                        text: true, 
                        page: true,
                        pdf: {
                            select: { id: true, title: true }
                        }
                    },
                },
                databaseEntry: {
                    select: { id: true, name: true, type: true },
                },
                project: {
                    select: { id: true, title: true, status: true },
                },
                experiment: {
                    select: { id: true, title: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async search(query: string, limit: number = 10) {
        return prisma.link.findMany({
            where: {
                OR: [
                    { metadata: { contains: query } },
                ],
            },
            select: {
                id: true,
                sourceType: true,
                sourceId: true,
                targetType: true,
                targetId: true,
                metadata: true,
                createdAt: true,
                updatedAt: true,
                note: {
                    select: { id: true, title: true, type: true },
                },
                highlight: {
                    select: { 
                        id: true, 
                        text: true, 
                        page: true,
                        pdf: {
                            select: { id: true, title: true }
                        }
                    },
                },
                databaseEntry: {
                    select: { id: true, name: true, type: true },
                },
                project: {
                    select: { id: true, title: true, status: true },
                },
                experiment: {
                    select: { id: true, title: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getGraph(params?: { entityType?: EntityType; maxDepth?: number }) {
        // This is a simplified graph implementation
        // In a real application, you might want to use a graph database or implement more complex traversal logic
        const links = await prisma.link.findMany({
            where: params?.entityType ? {
                OR: [
                    { sourceType: params.entityType },
                    { targetType: params.entityType },
                ],
            } : {},
            include: {
                note: {
                    select: { id: true, title: true, type: true },
                },
                highlight: {
                    select: { 
                        id: true, 
                        text: true, 
                        page: true,
                        pdf: {
                            select: { id: true, title: true }
                        }
                    },
                },
                databaseEntry: {
                    select: { id: true, name: true, type: true },
                },
                project: {
                    select: { id: true, title: true, status: true },
                },
                experiment: {
                    select: { id: true, title: true, status: true },
                },
            },
            take: params?.maxDepth ? params.maxDepth * 10 : 100, // Limit results based on depth
        });

        return {
            nodes: this.extractNodes(links),
            edges: this.extractEdges(links),
        };
    }

    private extractNodes(links: any[]) {
        const nodes = new Map();
        
        links.forEach(link => {
            // Add source node
            const sourceKey = `${link.sourceType}:${link.sourceId}`;
            if (!nodes.has(sourceKey)) {
                nodes.set(sourceKey, {
                    id: sourceKey,
                    type: link.sourceType,
                    entityId: link.sourceId,
                    ...this.getEntityData(link, 'source'),
                });
            }
            
            // Add target node
            const targetKey = `${link.targetType}:${link.targetId}`;
            if (!nodes.has(targetKey)) {
                nodes.set(targetKey, {
                    id: targetKey,
                    type: link.targetType,
                    entityId: link.targetId,
                    ...this.getEntityData(link, 'target'),
                });
            }
        });
        
        return Array.from(nodes.values());
    }

    private extractEdges(links: any[]) {
        return links.map(link => ({
            id: link.id,
            source: `${link.sourceType}:${link.sourceId}`,
            target: `${link.targetType}:${link.targetId}`,
            metadata: link.metadata,
        }));
    }

    private getEntityData(link: any, type: 'source' | 'target') {
        const entityType = type === 'source' ? link.sourceType : link.targetType;
        
        switch (entityType) {
            case 'note':
                return {
                    title: link.note?.title,
                    label: link.note?.title,
                };
            case 'highlight':
                return {
                    title: link.highlight?.text?.substring(0, 50) + '...',
                    label: `Highlight (p.${link.highlight?.page})`,
                };
            case 'databaseEntry':
                return {
                    title: link.databaseEntry?.name,
                    label: link.databaseEntry?.name,
                };
            case 'project':
                return {
                    title: link.project?.title,
                    label: link.project?.title,
                };
            case 'experiment':
                return {
                    title: link.experiment?.title,
                    label: link.experiment?.title,
                };
            default:
                return {
                    title: `${entityType} ${type === 'source' ? link.sourceId : link.targetId}`,
                    label: `${entityType} ${type === 'source' ? link.sourceId : link.targetId}`,
                };
        }
    }
} 