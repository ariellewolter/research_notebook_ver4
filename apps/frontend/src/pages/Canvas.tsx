import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { CanvasView } from '../components/Canvas/CanvasView';

interface CanvasPageProps {
  noteId?: string;
}

export const Canvas: React.FC<CanvasPageProps> = ({ noteId }) => {
  const [canvasContent, setCanvasContent] = useState({
    elements: [],
    drawings: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Load canvas content when noteId changes
  useEffect(() => {
    if (noteId) {
      loadCanvasContent(noteId);
    }
  }, [noteId]);

  const loadCanvasContent = async (id: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to load canvas content
      // const response = await canvasApi.getCanvasContent(id);
      // setCanvasContent(response.data);
      
      // For now, use mock data
      setCanvasContent({
        elements: [
          {
            id: 'text-1',
            type: 'text',
            x: 100,
            y: 100,
            width: 300,
            height: 150,
            content: 'Welcome to your Canvas! Click to edit this text block.',
            zIndex: 0,
          },
          {
            id: 'table-1',
            type: 'table',
            x: 450,
            y: 100,
            width: 400,
            height: 200,
            content: { rows: 3, cols: 3 },
            zIndex: 1,
          },
        ],
        drawings: [],
      });
    } catch (error) {
      console.error('Failed to load canvas content:', error);
      setSaveStatus({
        open: true,
        message: 'Failed to load canvas content',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (content: any) => {
    try {
      // TODO: Implement API call to save canvas content
      // await canvasApi.saveCanvasContent(noteId, content);
      
      // For now, just update local state
      setCanvasContent(content);
      
      setSaveStatus({
        open: true,
        message: 'Canvas saved successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to save canvas:', error);
      setSaveStatus({
        open: true,
        message: 'Failed to save canvas',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSaveStatus(prev => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Loading canvas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Canvas Header */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: 1,
          borderColor: 'divider',
          p: 1,
        }}
      >
        <Typography variant="h6" color="text.primary">
          Canvas View {noteId && `- Note ${noteId}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drag content blocks freely and add handwriting annotations
        </Typography>
      </Box>

      {/* Canvas View */}
      <Box sx={{ width: '100%', height: '100vh', pt: 8 }}>
        <CanvasView
          noteId={noteId}
          initialContent={canvasContent}
          onSave={handleSave}
        />
      </Box>

      {/* Save Status Snackbar */}
      <Snackbar
        open={saveStatus.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={saveStatus.severity}
          sx={{ width: '100%' }}
        >
          {saveStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Canvas; 