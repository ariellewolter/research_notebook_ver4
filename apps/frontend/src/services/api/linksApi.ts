import { apiClient } from './apiClient';
import { Link, CreateLinkData, LinkWithEntities } from '../../types/link.types';

export const linksApi = {
    getAll: (params?: {
        sourceType?: string;
        sourceId?: string;
        targetType?: string;
        targetId?: string;
    }) => apiClient.get<LinkWithEntities[]>('/links', params),

    getBacklinks: (entityType: string, entityId: string) =>
        apiClient.get<LinkWithEntities[]>(`/links/backlinks/${entityType}/${entityId}`),

    getOutgoing: (entityType: string, entityId: string) =>
        apiClient.get<LinkWithEntities[]>(`/links/outgoing/${entityType}/${entityId}`),

    create: (data: CreateLinkData) =>
        apiClient.post<Link>('/links', data),

    delete: (id: string) =>
        apiClient.delete(`/links/${id}`),

    getGraph: (params?: { entityType?: string; maxDepth?: number }) =>
        apiClient.get('/links/graph', params),

    search: (query: string, params?: { limit?: number }) =>
        apiClient.get(`/links/search/${query}`, params),
}; 