import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAutoSync, useSaveEventEmitter, emitSaveEvent, EntityType } from '../../hooks/useAutoSync';

interface AutoSyncContextType {
  emitSaveEvent: (entityType: EntityType, entityId: string, entity: any) => void;
  status: any;
  syncResults: any[];
  error: string | null;
  setEnabled: (enabled: boolean) => void;
  clearResults: () => void;
  getRecentResults: (limit?: number) => any[];
  getFailedSyncs: () => any[];
  triggerManualSync: (entityType: EntityType, entityId: string, entity: any) => Promise<void>;
}

const AutoSyncContext = createContext<AutoSyncContextType | undefined>(undefined);

interface AutoSyncProviderProps {
  children: ReactNode;
  config?: {
    enabled?: boolean;
    throttleDelay?: number;
    maxRetries?: number;
    retryDelay?: number;
    services?: string[];
  };
}

export const AutoSyncProvider: React.FC<AutoSyncProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const autoSync = useAutoSync(config);
  
  // Set up global save event listener
  useSaveEventEmitter();

  // Log auto-sync status changes
  useEffect(() => {
    if (autoSync.status.isSyncing) {
      console.log('Auto-sync: Processing sync queue...');
    }
  }, [autoSync.status.isSyncing]);

  useEffect(() => {
    if (autoSync.error) {
      console.error('Auto-sync error:', autoSync.error);
    }
  }, [autoSync.error]);

  const contextValue: AutoSyncContextType = {
    emitSaveEvent,
    status: autoSync.status,
    syncResults: autoSync.syncResults,
    error: autoSync.error,
    setEnabled: autoSync.setEnabled,
    clearResults: autoSync.clearResults,
    getRecentResults: autoSync.getRecentResults,
    getFailedSyncs: autoSync.getFailedSyncs,
    triggerManualSync: autoSync.triggerManualSync,
  };

  return (
    <AutoSyncContext.Provider value={contextValue}>
      {children}
    </AutoSyncContext.Provider>
  );
};

export const useAutoSyncContext = () => {
  const context = useContext(AutoSyncContext);
  if (context === undefined) {
    throw new Error('useAutoSyncContext must be used within an AutoSyncProvider');
  }
  return context;
};

// Higher-order component to wrap components that need auto-sync
export const withAutoSync = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const autoSyncContext = useAutoSyncContext();
    
    return <Component {...props} autoSync={autoSyncContext} />;
  };
  
  return WrappedComponent;
}; 