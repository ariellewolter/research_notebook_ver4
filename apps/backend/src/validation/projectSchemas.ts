import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
    description: z.string().optional(),
    status: z.string().default('active'),
    startDate: z.string().datetime().optional(),
    lastActivity: z.string().datetime().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectQuerySchema = z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'createdAt', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
}); 