import { z } from 'zod';

export const createLinkSchema = z.object({
    sourceType: z.enum(['note', 'highlight', 'databaseEntry', 'project', 'experiment']),
    sourceId: z.string().uuid('Invalid source ID'),
    targetType: z.enum(['note', 'highlight', 'databaseEntry', 'project', 'experiment']),
    targetId: z.string().uuid('Invalid target ID'),
    metadata: z.string().optional(),
});

export const linkQuerySchema = z.object({
    sourceType: z.enum(['note', 'highlight', 'databaseEntry', 'project', 'experiment']).optional(),
    sourceId: z.string().uuid().optional(),
    targetType: z.enum(['note', 'highlight', 'databaseEntry', 'project', 'experiment']).optional(),
    targetId: z.string().uuid().optional(),
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
}); 