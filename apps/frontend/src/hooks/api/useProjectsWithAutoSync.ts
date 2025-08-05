import { useCallback } from 'react';
import { useProjects, UseProjectsOptions, UseProjectsReturn } from './useProjects';
import { emitSaveEvent } from '../useAutoSync';

export function useProjectsWithAutoSync(options: UseProjectsOptions = {}): UseProjectsReturn {
  const projectsHook = useProjects(options);

  // Enhanced createProject with auto-sync
  const createProject = useCallback(async (data: any): Promise<any> => {
    const newProject = await projectsHook.createProject(data);
    
    // Emit save event for auto-sync if project is cloud-synced
    if (newProject?.cloudSynced) {
      emitSaveEvent('project', newProject.id, newProject);
    }
    
    return newProject;
  }, [projectsHook.createProject]);

  // Enhanced updateProject with auto-sync
  const updateProject = useCallback(async (id: string, data: any): Promise<any> => {
    const updatedProject = await projectsHook.updateProject(id, data);
    
    // Emit save event for auto-sync if project is cloud-synced
    if (updatedProject?.cloudSynced) {
      emitSaveEvent('project', updatedProject.id, updatedProject);
    }
    
    return updatedProject;
  }, [projectsHook.updateProject]);

  return {
    ...projectsHook,
    createProject,
    updateProject,
  };
} 