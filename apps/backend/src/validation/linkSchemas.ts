import { z } from 'zod';

export const createLinkSchema = z.object({
    sourceType: z.enum(['note', 'highlight', 'databaseEntry', 'protocol', 'protocolExecution', 'recipeExecution', 'table']),
    sourceId: z.string().uuid('Invalid source ID'),
    targetType: z.enum(['note', 'highlight', 'databaseEntry', 'protocol', 'protocolExecution', 'recipeExecution', 'table']),
    targetId: z.string().uuid('Invalid target ID'),
});

export const linkQuerySchema = z.object({
    sourceType: z.enum(['note', 'highlight', 'databaseEntry', 'protocol', 'protocolExecution', 'recipeExecution', 'table']).optional(),
    sourceId: z.string().uuid().optional(),
    targetType: z.enum(['note', 'highlight', 'databaseEntry', 'protocol', 'protocolExecution', 'recipeExecution', 'table']).optional(),
    targetId: z.string().uuid().optional(),
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
}); 