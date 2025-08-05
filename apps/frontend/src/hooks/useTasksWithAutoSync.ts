import { useCallback } from 'react';
import { useTasks } from './useTasks';
import { emitSaveEvent } from './useAutoSync';

export function useTasksWithAutoSync() {
  const tasksHook = useTasks();

  // Enhanced createTask with auto-sync
  const createTask = useCallback(async (taskData: any): Promise<any> => {
    const newTask = await tasksHook.createTask(taskData);
    
    // Emit save event for auto-sync if task is cloud-synced
    if (newTask?.cloudSynced) {
      emitSaveEvent('task', newTask.id, newTask);
    }
    
    return newTask;
  }, [tasksHook.createTask]);

  // Enhanced updateTask with auto-sync
  const updateTask = useCallback(async (taskId: string, updates: any): Promise<any> => {
    const updatedTask = await tasksHook.updateTask(taskId, updates);
    
    // Emit save event for auto-sync if task is cloud-synced
    if (updatedTask?.cloudSynced) {
      emitSaveEvent('task', updatedTask.id, updatedTask);
    }
    
    return updatedTask;
  }, [tasksHook.updateTask]);

  return {
    ...tasksHook,
    createTask,
    updateTask,
  };
} 