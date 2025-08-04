import { useState, useEffect, useCallback } from 'react';
import { linksApi } from '../../services/api';
import { Link, CreateLinkData, LinkWithEntities } from '../../types/link.types';

interface UseLinksOptions {
    sourceType?: string;
    sourceId?: string;
    targetType?: string;
    targetId?: string;
    autoFetch?: boolean;
}

interface UseLinksReturn {
    links: LinkWithEntities[];
    link: LinkWithEntities | null;
    loading: boolean;
    error: string | null;
    fetchLinks: (options?: UseLinksOptions) => Promise<void>;
    fetchLink: (id: string) => Promise<void>;
    createLink: (data: CreateLinkData) => Promise<Link>;
    deleteLink: (id: string) => Promise<void>;
    getBacklinks: (entityType: string, entityId: string) => Promise<LinkWithEntities[]>;
    getOutgoing: (entityType: string, entityId: string) => Promise<LinkWithEntities[]>;
    searchLinks: (query: string, limit?: number) => Promise<LinkWithEntities[]>;
    getGraph: (params?: { entityType?: string; maxDepth?: number }) => Promise<any>;
    clearError: () => void;
}

export function useLinks(options: UseLinksOptions = {}): UseLinksReturn {
    const [links, setLinks] = useState<LinkWithEntities[]>([]);
    const [link, setLink] = useState<LinkWithEntities | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const fetchLinks = useCallback(async (fetchOptions?: UseLinksOptions) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = { ...options, ...fetchOptions };
            const response = await linksApi.getAll(params);
            
            if (response.data) {
                setLinks(response.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch links');
        } finally {
            setLoading(false);
        }
    }, [options]);

    const fetchLink = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await linksApi.getById(id);
            setLink(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch link');
        } finally {
            setLoading(false);
        }
    }, []);

    const createLink = useCallback(async (data: CreateLinkData): Promise<Link> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await linksApi.create(data);
            const newLink = response.data;
            
            // Add to links list
            setLinks(prev => [newLink, ...prev]);
            
            return newLink;
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to create link';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteLink = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            
            await linksApi.delete(id);
            
            // Remove from links list
            setLinks(prev => prev.filter(l => l.id !== id));
            
            // Clear single link if it's the current one
            if (link?.id === id) {
                setLink(null);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to delete link');
        } finally {
            setLoading(false);
        }
    }, [link]);

    const getBacklinks = useCallback(async (entityType: string, entityId: string): Promise<LinkWithEntities[]> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await linksApi.getBacklinks(entityType, entityId);
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch backlinks');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getOutgoing = useCallback(async (entityType: string, entityId: string): Promise<LinkWithEntities[]> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await linksApi.getOutgoing(entityType, entityId);
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch outgoing links');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const searchLinks = useCallback(async (query: string, limit: number = 10): Promise<LinkWithEntities[]> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await linksApi.search(query, { limit });
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to search links');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getGraph = useCallback(async (params?: { entityType?: string; maxDepth?: number }): Promise<any> => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await linksApi.getGraph(params);
            return response.data;
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to fetch graph');
            return { nodes: [], edges: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-fetch on mount if enabled
    useEffect(() => {
        if (options.autoFetch !== false) {
            fetchLinks();
        }
    }, [fetchLinks, options.autoFetch]);

    return {
        links,
        link,
        loading,
        error,
        fetchLinks,
        fetchLink,
        createLink,
        deleteLink,
        getBacklinks,
        getOutgoing,
        searchLinks,
        getGraph,
        clearError,
    };
} 