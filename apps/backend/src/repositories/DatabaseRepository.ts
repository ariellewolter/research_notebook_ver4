import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseRepository {
    async findMany(filters: {
        type?: string;
        search?: string;
        skip?: number;
        take?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const where: any = {};
        
        if (filters.type) {
            where.type = filters.type;
        }
        
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }

        const orderBy: any = {};
        if (filters.sortBy) {
            orderBy[filters.sortBy] = filters.sortOrder || 'desc';
        } else {
            orderBy.createdAt = 'desc';
        }

        return prisma.databaseEntry.findMany({
            where,
            include: {
                links: {
                    select: {
                        id: true,
                        sourceType: true,
                        sourceId: true,
                        targetType: true,
                        targetId: true,
                    },
                },
            },
            orderBy,
            skip: filters.skip,
            take: filters.take,
        });
    }

    async findById(id: string) {
        return prisma.databaseEntry.findFirst({
            where: { id },
            include: {
                links: {
                    select: {
                        id: true,
                        sourceType: true,
                        sourceId: true,
                        targetType: true,
                        targetId: true,
                    },
                },
            },
        });
    }

    async findByType(type: string, filters?: { skip?: number; take?: number }) {
        return prisma.databaseEntry.findMany({
            where: { type },
            include: {
                links: {
                    select: {
                        id: true,
                        sourceType: true,
                        sourceId: true,
                        targetType: true,
                        targetId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: filters?.skip,
            take: filters?.take,
        });
    }

    async create(data: any) {
        return prisma.databaseEntry.create({ data });
    }

    async update(id: string, data: any) {
        return prisma.databaseEntry.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.databaseEntry.delete({
            where: { id },
        });
    }

    async count(filters: { type?: string; search?: string }) {
        const where: any = {};
        
        if (filters.type) {
            where.type = filters.type;
        }
        
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }

        return prisma.databaseEntry.count({ where });
    }

    async getStats() {
        const total = await prisma.databaseEntry.count();

        const byType = await prisma.databaseEntry.groupBy({
            by: ['type'],
            _count: {
                type: true,
            },
        });

        const recent = await prisma.databaseEntry.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
            },
        });

        return {
            total,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count.type;
                return acc;
            }, {} as Record<string, number>),
            recent,
        };
    }

    async search(query: string, filters?: { type?: string; limit?: number }) {
        const where: any = {
            OR: [
                { name: { contains: query } },
                { description: { contains: query } },
            ],
        };

        if (filters?.type) {
            where.type = filters.type;
        }

        return prisma.databaseEntry.findMany({
            where,
            include: {
                links: {
                    select: {
                        id: true,
                        sourceType: true,
                        sourceId: true,
                        targetType: true,
                        targetId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 10,
        });
    }

    async getTypes() {
        const types = await prisma.databaseEntry.groupBy({
            by: ['type'],
            _count: {
                type: true,
            },
        });

        return types.map(item => ({
            type: item.type,
            count: item._count.type,
        }));
    }
} 