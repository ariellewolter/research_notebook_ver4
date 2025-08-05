import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAutoExport, useProjectStatusEmitter, AutoExportConfig } from '../../hooks/useAutoExport';

interface AutoExportContextType {
  status: any;
  exportResults: any[];
  error: string | null;
  setEnabled: (enabled: boolean) => void;
  clearResults: () => void;
  getRecentResults: (limit?: number) => any[];
  getFailedExports: () => any[];
  triggerManualExport: (project: any) => Promise<void>;
  config: AutoExportConfig;
}

const AutoExportContext = createContext<AutoExportContextType | undefined>(undefined);

interface AutoExportProviderProps {
  children: ReactNode;
  config?: Partial<AutoExportConfig>;
}

export const AutoExportProvider: React.FC<AutoExportProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const autoExport = useAutoExport(config);
  
  // Set up global project status change listener
  useProjectStatusEmitter();

  // Log auto-export status changes
  useEffect(() => {
    if (autoExport.status.isExporting) {
      console.log('Auto-export: Processing export queue...');
    }
  }, [autoExport.status.isExporting]);

  useEffect(() => {
    if (autoExport.error) {
      console.error('Auto-export error:', autoExport.error);
    }
  }, [autoExport.error]);

  const contextValue: AutoExportContextType = {
    status: autoExport.status,
    exportResults: autoExport.exportResults,
    error: autoExport.error,
    setEnabled: autoExport.setEnabled,
    clearResults: autoExport.clearResults,
    getRecentResults: autoExport.getRecentResults,
    getFailedExports: autoExport.getFailedExports,
    triggerManualExport: autoExport.triggerManualExport,
    config: autoExport.config,
  };

  return (
    <AutoExportContext.Provider value={contextValue}>
      {children}
    </AutoExportContext.Provider>
  );
};

export const useAutoExportContext = () => {
  const context = useContext(AutoExportContext);
  if (context === undefined) {
    throw new Error('useAutoExportContext must be used within an AutoExportProvider');
  }
  return context;
}; 