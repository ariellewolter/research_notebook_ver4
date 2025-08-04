import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NoteRepository {
    async findMany(filters: {
        type?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        experimentId?: string;
        skip?: number;
        take?: number;
    }) {
        const where: any = {};
        
        if (filters.type) {
            where.type = filters.type;
        }
        
        if (filters.experimentId) {
            where.experimentId = filters.experimentId;
        }
        
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search } },
                { content: { contains: filters.search } },
            ];
        }
        
        if (filters.dateFrom || filters.dateTo) {
            where.date = {};
            if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
        }

        return prisma.note.findMany({
            where,
            include: {
                experiment: {
                    select: { id: true, name: true, description: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: filters.skip,
            take: filters.take,
        });
    }

    async findById(id: string) {
        return prisma.note.findFirst({
            where: { id },
            include: {
                experiment: {
                    select: { id: true, name: true, description: true },
                },
            },
        });
    }

    async create(data: any) {
        return prisma.note.create({ data });
    }

    async update(id: string, data: any) {
        return prisma.note.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.note.delete({
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
                { title: { contains: filters.search } },
                { content: { contains: filters.search } },
            ];
        }

        return prisma.note.count({ where });
    }

    async getStats() {
        const total = await prisma.note.count();

        const byType = await prisma.note.groupBy({
            by: ['type'],
            _count: {
                type: true,
            },
        });

        const stats = {
            total,
            byType: {} as Record<string, number>,
            recent: await prisma.note.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
            }),
        };

        byType.forEach((item) => {
            if (item._count && item.type) {
                stats.byType[item.type] = item._count.type || 0;
            }
        });

        return stats;
    }

    async search(query: string, limit: number = 10) {
        return prisma.note.findMany({
            where: {
                OR: [
                    { title: { contains: query } },
                    { content: { contains: query } },
                ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    async getByDate(date: string) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

        return prisma.note.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
} 