import { useState, useEffect, useCallback } from 'react';
import { linksApi } from '../services/api';
import { 
  EntityType, 
  BaseEntity, 
  LinkingConfig, 
  LinkingState, 
  LinkingActions 
} from '../types/linking';

export const useLinking = <T extends BaseEntity>(
  sourceType: EntityType,
  sourceId: string,
  config: LinkingConfig<T>
): LinkingState<T> & LinkingActions<T> => {
  const [linked, setLinked] = useState<T[]>([]);
  const [all, setAll] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all entities and existing links
  const loadData = useCallback(async () => {
    if (!sourceId) return;

    setLoading(true);
    setError(null);

    try {
      // Load all entities of the target type
      const allResponse = await config.apiModule.getAll();
      const allEntities = Array.isArray(allResponse.data) ? allResponse.data : [];
      setAll(allEntities);

      // Load existing links
      const linksResponse = await linksApi.getOutgoing(sourceType, sourceId);
      const links = Array.isArray(linksResponse.data) ? linksResponse.data : [];
      
      // Filter links for this entity type and get the actual entities
      const linkedEntities = links
        .filter((link: any) => link.targetType === config.entityType)
        .map((link: any) => {
          // The entity data is nested in the link response
          const entityKey = config.entityType;
          return link[entityKey];
        })
        .filter(Boolean);

      setLinked(linkedEntities);
    } catch (err: any) {
      console.error(`Error loading ${config.displayName} data:`, err);
      setError(err.message || `Failed to load ${config.displayName} data`);
      setAll([]);
      setLinked([]);
    } finally {
      setLoading(false);
    }
  }, [sourceId, sourceType, config]);

  // Link an entity
  const link = useCallback(async (entityId: string) => {
    if (!sourceId) return;

    try {
      await linksApi.create({
        sourceType,
        sourceId,
        targetType: config.entityType,
        targetId: entityId
      });

      // Find the entity in the all list and add it to linked
      const entity = all.find(e => e.id === entityId);
      if (entity) {
        setLinked(prev => [...prev, entity]);
      }
    } catch (err: any) {
      console.error(`Error linking ${config.displayName}:`, err);
      setError(err.message || `Failed to link ${config.displayName}`);
    }
  }, [sourceId, sourceType, config, all]);

  // Unlink an entity
  const unlink = useCallback(async (entityId: string) => {
    if (!sourceId) return;

    try {
      // Find the link to delete
      const linksResponse = await linksApi.getOutgoing(sourceType, sourceId);
      const links = Array.isArray(linksResponse.data) ? linksResponse.data : [];
      const link = links.find((l: any) => 
        l.targetType === config.entityType && l.targetId === entityId
      );

      if (link) {
        await linksApi.delete(link.id);
        setLinked(prev => prev.filter(e => e.id !== entityId));
      }
    } catch (err: any) {
      console.error(`Error unlinking ${config.displayName}:`, err);
      setError(err.message || `Failed to unlink ${config.displayName}`);
    }
  }, [sourceId, sourceType, config]);

  // Create a new entity and link it
  const create = useCallback(async (data: Partial<T>) => {
    if (!sourceId) return;

    setCreating(true);
    setError(null);

    try {
      // Create the entity
      const createData = {
        ...config.defaultCreateData,
        ...data
      };
      
      const response = await config.apiModule.create(createData);
      const newEntity = response.data;

      // Add to all entities list
      setAll(prev => [...prev, newEntity]);

      // Link it automatically
      await link(newEntity.id);
    } catch (err: any) {
      console.error(`Error creating ${config.displayName}:`, err);
      setError(err.message || `Failed to create ${config.displayName}`);
    } finally {
      setCreating(false);
    }
  }, [sourceId, config, link]);

  // Refresh data
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    linked,
    all,
    loading,
    creating,
    error,
    
    // Actions
    link,
    unlink,
    create,
    refresh
  };
}; 