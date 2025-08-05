import { useCallback } from 'react';
import { useNotes, UseNotesOptions, UseNotesReturn } from './useNotes';
import { emitSaveEvent } from '../useAutoSync';

export function useNotesWithAutoSync(options: UseNotesOptions = {}): UseNotesReturn {
  const notesHook = useNotes(options);

  // Enhanced createNote with auto-sync
  const createNote = useCallback(async (data: any): Promise<any> => {
    const newNote = await notesHook.createNote(data);
    
    // Emit save event for auto-sync if note is cloud-synced
    if (newNote?.cloudSynced) {
      emitSaveEvent('note', newNote.id, newNote);
    }
    
    return newNote;
  }, [notesHook.createNote]);

  // Enhanced updateNote with auto-sync
  const updateNote = useCallback(async (id: string, data: any): Promise<any> => {
    const updatedNote = await notesHook.updateNote(id, data);
    
    // Emit save event for auto-sync if note is cloud-synced
    if (updatedNote?.cloudSynced) {
      emitSaveEvent('note', updatedNote.id, updatedNote);
    }
    
    return updatedNote;
  }, [notesHook.updateNote]);

  return {
    ...notesHook,
    createNote,
    updateNote,
  };
} 