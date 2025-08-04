import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectRepository {
    async findMany(filters: {
        userId: string;
        status?: string;
        search?: string;
        skip?: number;
        take?: number;
    }) {
        const where: any = { userId: filters.userId };
        
        if (filters.status) {
            where.status = filters.status;
        }
        
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }

        return prisma.project.findMany({
            where,
            include: {
                experiments: {
                    select: { id: true, name: true, description: true },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: { experiments: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: filters.skip,
            take: filters.take,
        });
    }

    async findById(id: string, userId: string) {
        return prisma.project.findFirst({
            where: { id, userId },
        });
    }

    async findByIdWithExperiments(id: string, userId: string) {
        return prisma.project.findFirst({
            where: { id, userId },
            include: {
                experiments: {
                    include: {
                        notes: {
                            select: { id: true, title: true, type: true, createdAt: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    async create(data: any) {
        return prisma.project.create({ data });
    }

    async update(id: string, data: any) {
        return prisma.project.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.project.delete({
            where: { id },
        });
    }

    async count(filters: { userId: string; status?: string; search?: string }) {
        const where: any = { userId: filters.userId };
        
        if (filters.status) {
            where.status = filters.status;
        }
        
        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }

        return prisma.project.count({ where });
    }

    async getStats(userId: string) {
        const total = await prisma.project.count({ where: { userId } });

        const byStatus = await prisma.project.groupBy({
            by: ['status'],
            where: { userId },
            _count: { status: true },
        });

        const stats = {
            total,
            byStatus: {} as Record<string, number>,
            recent: await prisma.project.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    status: true,
                    createdAt: true,
                },
            }),
        };

        byStatus.forEach((item) => {
            if (item._count && item.status) {
                stats.byStatus[item.status] = item._count.status || 0;
            }
        });

        return stats;
    }
} 