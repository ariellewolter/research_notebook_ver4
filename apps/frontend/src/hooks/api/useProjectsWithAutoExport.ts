import { useCallback } from 'react';
import { useProjects, UseProjectsOptions, UseProjectsReturn } from './useProjects';
import { emitProjectStatusChange } from '../useAutoExport';

export function useProjectsWithAutoExport(options: UseProjectsOptions = {}): UseProjectsReturn {
  const projectsHook = useProjects(options);

  // Enhanced updateProject with auto-export
  const updateProject = useCallback(async (id: string, data: any): Promise<any> => {
    const updatedProject = await projectsHook.updateProject(id, data);
    
    // Emit project status change event for auto-export
    emitProjectStatusChange(updatedProject);
    
    return updatedProject;
  }, [projectsHook.updateProject]);

  return {
    ...projectsHook,
    updateProject,
  };
} 