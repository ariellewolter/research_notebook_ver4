import { z } from 'zod';

export const createNoteSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required'),
    type: z.enum(['experiment', 'protocol', 'observation', 'literature', 'general']).default('general'),
    date: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
    experimentId: z.string().uuid().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const noteQuerySchema = z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    type: z.enum(['experiment', 'protocol', 'observation', 'literature', 'general']).optional(),
    search: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    experimentId: z.string().uuid().optional(),
}); 