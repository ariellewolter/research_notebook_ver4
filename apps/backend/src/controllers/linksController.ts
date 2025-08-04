import { Request, Response } from 'express';
import { LinkService } from '../services/LinkService';
import { createLinkSchema } from '../validation/linkSchemas';
import { asyncHandler } from '../middleware/asyncHandler';

const linkService = new LinkService();

export const linksController = {
    getAllLinks: asyncHandler(async (req: any, res: Response) => {
        const { page, limit, sourceType, sourceId, targetType, targetId } = req.query;
        
        const result = await linkService.getAllLinks({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            sourceType,
            sourceId,
            targetType,
            targetId,
        });

        res.json(result);
    }),

    getLinkById: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        
        const link = await linkService.getLinkById(id);
        
        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        res.json(link);
    }),

    createLink: asyncHandler(async (req: any, res: Response) => {
        const validatedData = createLinkSchema.parse(req.body);
        
        const link = await linkService.createLink(validatedData);
        
        res.status(201).json(link);
    }),

    deleteLink: asyncHandler(async (req: any, res: Response) => {
        const { id } = req.params;
        
        await linkService.deleteLink(id);
        
        res.status(204).send();
    }),

    getBacklinks: asyncHandler(async (req: any, res: Response) => {
        const { entityType, entityId } = req.params;
        
        const links = await linkService.getBacklinks(entityType as any, entityId);
        res.json(links);
    }),

    getOutgoingLinks: asyncHandler(async (req: any, res: Response) => {
        const { entityType, entityId } = req.params;
        
        const links = await linkService.getOutgoingLinks(entityType as any, entityId);
        res.json(links);
    }),

    searchLinks: asyncHandler(async (req: any, res: Response) => {
        const { query } = req.params;
        const { limit } = req.query;
        
        const links = await linkService.searchLinks(query, limit ? parseInt(limit) : 10);
        res.json(links);
    }),

    getLinkGraph: asyncHandler(async (req: any, res: Response) => {
        const { entityType, maxDepth } = req.query;
        
        const graph = await linkService.getLinkGraph({
            entityType: entityType as any,
            maxDepth: maxDepth ? parseInt(maxDepth) : undefined,
        });
        res.json(graph);
    }),

    getEntityConnections: asyncHandler(async (req: any, res: Response) => {
        const { entityType, entityId } = req.params;
        
        const connections = await linkService.getEntityConnections(entityType as any, entityId);
        res.json(connections);
    }),
}; 