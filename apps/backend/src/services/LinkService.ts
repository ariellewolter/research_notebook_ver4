import { LinkRepository } from '../repositories/LinkRepository';
import { CreateLinkData, LinkWithEntities, EntityType } from '../types/link.types';

export class LinkService {
    constructor(
        private linkRepository: LinkRepository = new LinkRepository()
    ) {}

    async getAllLinks(filters?: {
        sourceType?: EntityType;
        sourceId?: string;
        targetType?: EntityType;
        targetId?: string;
        page?: number;
        limit?: number;
    }): Promise<{ links: LinkWithEntities[]; total: number; pagination: any }> {
        const { page = 1, limit = 10, ...filterParams } = filters || {};
        const skip = (page - 1) * limit;

        const links = await this.linkRepository.findMany({
            ...filterParams,
            skip,
            take: limit,
        });

        // For simplicity, we'll estimate total based on current results
        // In a real application, you might want to add a count method
        const total = links.length === limit ? page * limit + 1 : page * limit;

        return {
            links,
            total,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: links.length === limit,
                hasPrev: page > 1,
            },
        };
    }

    async getLinkById(id: string): Promise<LinkWithEntities | null> {
        return this.linkRepository.findById(id);
    }

    async createLink(data: CreateLinkData): Promise<LinkWithEntities> {
        // Validate that the entities exist (you might want to add this validation)
        return this.linkRepository.create(data);
    }

    async deleteLink(id: string): Promise<void> {
        const existingLink = await this.linkRepository.findById(id);
        if (!existingLink) {
            throw new Error('Link not found');
        }

        await this.linkRepository.delete(id);
    }

    async getBacklinks(entityType: EntityType, entityId: string): Promise<LinkWithEntities[]> {
        return this.linkRepository.getBacklinks(entityType, entityId);
    }

    async getOutgoingLinks(entityType: EntityType, entityId: string): Promise<LinkWithEntities[]> {
        return this.linkRepository.getOutgoing(entityType, entityId);
    }

    async searchLinks(query: string, limit: number = 10): Promise<LinkWithEntities[]> {
        return this.linkRepository.search(query, limit);
    }

    async getLinkGraph(params?: { entityType?: EntityType; maxDepth?: number }) {
        return this.linkRepository.getGraph(params);
    }

    async createBidirectionalLink(data: CreateLinkData): Promise<{ forward: LinkWithEntities; reverse: LinkWithEntities }> {
        // Create forward link
        const forwardLink = await this.linkRepository.create(data);
        
        // Create reverse link
        const reverseData = {
            sourceType: data.targetType,
            sourceId: data.targetId,
            targetType: data.sourceType,
            targetId: data.sourceId,
            metadata: data.metadata,
        };
        
        const reverseLink = await this.linkRepository.create(reverseData);
        
        return {
            forward: forwardLink,
            reverse: reverseLink,
        };
    }

    async getEntityConnections(entityType: EntityType, entityId: string) {
        const [backlinks, outgoing] = await Promise.all([
            this.linkRepository.getBacklinks(entityType, entityId),
            this.linkRepository.getOutgoing(entityType, entityId),
        ]);

        return {
            backlinks,
            outgoing,
            total: backlinks.length + outgoing.length,
        };
    }
} 