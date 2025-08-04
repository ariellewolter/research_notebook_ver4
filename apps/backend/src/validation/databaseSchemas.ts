import { z } from 'zod';

export const createDatabaseEntrySchema = z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
    description: z.string().optional(),
    type: z.string().min(1, 'Type is required'),
    properties: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export const updateDatabaseEntrySchema = createDatabaseEntrySchema.partial();

export const databaseQuerySchema = z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    type: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'type', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
}); 