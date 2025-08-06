import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Divider,
  Chip,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress
} from '@mui/material';
import { useDrawingSync } from '../../hooks/useDrawingSync';
import DrawingSaveIndicator from './DrawingSaveIndicator';
import {
  Edit as EditIcon,
  Clear as ClearIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Palette as PaletteIcon,
  Brush as BrushIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  TextFields as TextFieldsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  opacity: number;
}

export interface DrawingAnnotation {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding: number;
  borderRadius: number;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingData {
  strokes: DrawingStroke[];
  annotations: DrawingAnnotation[];
  svgPath: string;
  pngThumbnail: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

export interface FreeformDrawingBlockProps {
  blockId: string;
  entityId: string;
  entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
  onSave: (data: DrawingData) => void;
  initialData?: DrawingData;
  readOnly?: boolean;
  className?: string;
  width?: number;
  height?: number;
  autoSaveDelay?: number;
  enableCloudSync?: boolean;
  showSaveIndicator?: boolean;
  saveIndicatorPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const FreeformDrawingBlock: React.FC<FreeformDrawingBlockProps> = ({
  blockId,
  entityId,
  entityType,
  onSave,
  initialData,
  readOnly = false,
  className = '',
  width = 600,
  height = 400,
  autoSaveDelay = 2000,
  enableCloudSync = true,
  showSaveIndicator = true,
  saveIndicatorPosition = 'top-right'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<DrawingStroke[]>(initialData?.strokes || []);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [undoStack, setUndoStack] = useState<DrawingStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingStroke[][]>([]);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [brushSettings, setBrushSettings] = useState({
    color: '#000000',
    width: 2,
    opacity: 1
  });
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null);
  const [brushMenuAnchor, setBrushMenuAnchor] = useState<null | HTMLElement>(null);
  const [annotationMenuAnchor, setAnnotationMenuAnchor] = useState<null | HTMLElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Annotation state
  const [annotations, setAnnotations] = useState<DrawingAnnotation[]>(initialData?.annotations || []);
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [draggedAnnotation, setDraggedAnnotation] = useState<string | null>(null);
  const [annotationSettings, setAnnotationSettings] = useState({
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#ffffff',
    borderColor: '#cccccc',
    borderWidth: 1,
    padding: 4,
    borderRadius: 4
  });

  // Initialize sync hook
  const [syncState, syncActions] = useDrawingSync({
    blockId,
    entityId,
    entityType,
    autoSaveDelay,
    enableCloudSync,
    onSaveSuccess: (result) => {
      console.log('Drawing saved successfully:', result);
    },
    onSaveError: (error) => {
      console.error('Drawing save failed:', error);
    },
    onSyncStatusChange: (status) => {
      console.log('Sync status changed:', status);
    }
  });

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  const brushSizes = [1, 2, 3, 5, 8, 12];

  // Initialize canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const actualWidth = Math.min(width, rect.width);
        const actualHeight = Math.min(height, rect.height);

        setCanvasSize({ width: actualWidth, height: actualHeight });
        
        const canvas = canvasRef.current;
        canvas.width = actualWidth * window.devicePixelRatio;
        canvas.height = actualHeight * window.devicePixelRatio;
        canvas.style.width = `${actualWidth}px`;
        canvas.style.height = `${actualHeight}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [width, height]);

  // Redraw canvas when strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    [...strokes, currentStroke].filter(Boolean).forEach(stroke => {
      if (stroke && stroke.points.length > 1) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.globalAlpha = stroke.opacity;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        
        ctx.stroke();
      }
    });
  }, [strokes, currentStroke]);

  const getPointFromEvent = (event: React.MouseEvent | React.TouchEvent): DrawingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, timestamp: Date.now() };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number, pressure: number = 1;

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      pressure = (touch as any).force || 1;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      pressure,
      timestamp: Date.now()
    };
  };

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    
    event.preventDefault();
    setIsDrawing(true);
    
    const point = getPointFromEvent(event);
    const newStroke: DrawingStroke = {
      id: `${Date.now()}-${Math.random()}`,
      points: [point],
      color: brushSettings.color,
      width: brushSettings.width * (point.pressure || 1),
      opacity: brushSettings.opacity
    };
    
    setCurrentStroke(newStroke);
  }, [readOnly, brushSettings]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke || readOnly) return;
    
    event.preventDefault();
    
    const point = getPointFromEvent(event);
    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, point],
      width: brushSettings.width * (point.pressure || 1)
    } : null);
  }, [isDrawing, currentStroke, readOnly, brushSettings]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || readOnly) return;
    
    setIsDrawing(false);
    
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => {
        const newStrokes = [...prev, currentStroke];
        setUndoStack(prevStack => [...prevStack, prev]);
        setRedoStack([]); // Clear redo stack when new stroke is added
        setHasUnsavedChanges(true);
        return newStrokes;
      });
    }
    
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, readOnly]);

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setUndoStack([]);
    setRedoStack([]);
    setHasUnsavedChanges(true);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousStrokes = undoStack[undoStack.length - 1];
      const currentStrokes = strokes;
      
      setStrokes(previousStrokes);
      setUndoStack(undoStack.slice(0, -1));
      setRedoStack([...redoStack, currentStrokes]);
      setHasUnsavedChanges(true);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextStrokes = redoStack[redoStack.length - 1];
      const currentStrokes = strokes;
      
      setStrokes(nextStrokes);
      setRedoStack(redoStack.slice(0, -1));
      setUndoStack([...undoStack, currentStrokes]);
      setHasUnsavedChanges(true);
    }
  };

  const generateSVGPath = useCallback((strokes: DrawingStroke[]): string => {
    if (strokes.length === 0) return '';

    const svgPaths = strokes.map(stroke => {
      if (stroke.points.length < 2) return '';
      
      const pathData = stroke.points.map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        return `L ${point.x} ${point.y}`;
      }).join(' ');
      
      return `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.width}" opacity="${stroke.opacity}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).filter(Boolean);

    return `<svg width="${canvasSize.width}" height="${canvasSize.height}" xmlns="http://www.w3.org/2000/svg">${svgPaths.join('')}</svg>`;
  }, [canvasSize]);

  const generatePNGThumbnail = useCallback(async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    // Create a thumbnail by scaling down the canvas
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d');
    if (!thumbnailCtx) return '';

    const thumbnailSize = 200;
    const scale = Math.min(thumbnailSize / canvasSize.width, thumbnailSize / canvasSize.height);
    const scaledWidth = canvasSize.width * scale;
    const scaledHeight = canvasSize.height * scale;

    thumbnailCanvas.width = scaledWidth;
    thumbnailCanvas.height = scaledHeight;

    // Draw the original canvas scaled down
    thumbnailCtx.drawImage(canvas, 0, 0, canvasSize.width, canvasSize.height, 0, 0, scaledWidth, scaledHeight);

    return thumbnailCanvas.toDataURL('image/png');
  }, [canvasSize]);

  const handleSave = async () => {
    if (readOnly) return;

    try {
      const svgPath = generateSVGPath(strokes);
      const pngThumbnail = await generatePNGThumbnail();
      
      const drawingData: DrawingData = {
        strokes,
        annotations: initialData?.annotations || [],
        svgPath,
        pngThumbnail,
        width: canvasSize.width,
        height: canvasSize.height,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Use sync service for saving
      const result = await syncActions.saveDrawing(drawingData);
      
      if (result.success) {
        // Call the original onSave callback
        await onSave(drawingData);
        setHasUnsavedChanges(false);
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (error) {
      console.error('Failed to save drawing:', error);
      throw error;
    }
  };

  // Auto-save when strokes or annotations change
  useEffect(() => {
    if ((strokes.length > 0 || annotations.length > 0) && !readOnly) {
      const autoSave = async () => {
        try {
          const svgPath = generateSVGPath(strokes);
          const pngThumbnail = await generatePNGThumbnail();
          
          const drawingData: DrawingData = {
            strokes,
            annotations,
            svgPath,
            pngThumbnail,
            width: canvasSize.width,
            height: canvasSize.height,
            createdAt: initialData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await syncActions.saveDrawing(drawingData);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      };

      autoSave();
    }
  }, [strokes, annotations, canvasSize, readOnly, initialData?.createdAt]);

  const downloadSVG = () => {
    const svgPath = generateSVGPath(strokes);
    if (!svgPath) return;

    const blob = new Blob([svgPath], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-${blockId}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawing-${blockId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Annotation management functions
  const addAnnotation = (text: string, x: number, y: number) => {
    const newAnnotation: DrawingAnnotation = {
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      x,
      y,
      fontSize: annotationSettings.fontSize,
      color: annotationSettings.color,
      backgroundColor: annotationSettings.backgroundColor,
      borderColor: annotationSettings.borderColor,
      borderWidth: annotationSettings.borderWidth,
      padding: annotationSettings.padding,
      borderRadius: annotationSettings.borderRadius,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setSelectedAnnotation(newAnnotation.id);
  };

  const updateAnnotation = (id: string, updates: Partial<DrawingAnnotation>) => {
    setAnnotations(prev => prev.map(annotation => 
      annotation.id === id 
        ? { ...annotation, ...updates, updatedAt: new Date().toISOString() }
        : annotation
    ));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(annotation => annotation.id !== id));
    setSelectedAnnotation(null);
  };

  const handleAnnotationDragStart = (e: React.DragEvent, annotationId: string) => {
    setDraggedAnnotation(annotationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAnnotationDragEnd = () => {
    setDraggedAnnotation(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedAnnotation) {
      // Move existing annotation
      updateAnnotation(draggedAnnotation, { x, y });
    } else {
      // Add new annotation from external drop
      const text = e.dataTransfer.getData('text/plain') || 'New Annotation';
      addAnnotation(text, x, y);
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleAnnotationClick = (annotationId: string) => {
    if (isAnnotationMode) {
      setSelectedAnnotation(annotationId);
    }
  };

  const handleAnnotationDoubleClick = (annotationId: string) => {
    const annotation = annotations.find(a => a.id === annotationId);
    if (annotation) {
      const newText = prompt('Edit annotation text:', annotation.text);
      if (newText !== null && newText !== annotation.text) {
        updateAnnotation(annotationId, { text: newText });
      }
    }
  };

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent) => {
    if (isAnnotationMode) {
      // Create annotation on click in annotation mode
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const text = prompt('Enter annotation text:') || 'New Annotation';
        if (text.trim()) {
          addAnnotation(text, x, y);
        }
      }
    } else {
      startDrawing(event);
    }
  };
  const handleMouseMove = (event: React.MouseEvent) => draw(event);
  const handleMouseUp = () => stopDrawing();
  const handleMouseLeave = () => stopDrawing();

  // Touch event handlers
  const handleTouchStart = (event: React.TouchEvent) => startDrawing(event);
  const handleTouchMove = (event: React.TouchEvent) => draw(event);
  const handleTouchEnd = () => stopDrawing();

  return (
    <Box className={className}>
      <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="primary">
              Drawing Block
            </Typography>
            <Chip 
              label={entityType} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
            {syncState.hasUnsavedChanges && (
              <Chip 
                label="Unsaved" 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            )}
            {syncState.syncStatus === 'synced' && syncState.cloudSynced && (
              <Chip 
                label="Cloud Synced" 
                size="small" 
                color="success" 
                variant="outlined"
              />
            )}
            {syncState.syncStatus === 'offline' && (
              <Chip 
                label="Offline" 
                size="small" 
                color="default" 
                variant="outlined"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Undo">
              <IconButton 
                size="small" 
                onClick={undo}
                disabled={undoStack.length === 0 || readOnly}
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton 
                size="small" 
                onClick={redo}
                disabled={redoStack.length === 0 || readOnly}
              >
                <RedoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear">
              <IconButton 
                size="small" 
                onClick={clearCanvas}
                disabled={readOnly}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            
            {/* Annotation Mode Toggle */}
            <Tooltip title={isAnnotationMode ? "Exit Annotation Mode" : "Enter Annotation Mode"}>
              <IconButton 
                size="small" 
                onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                disabled={readOnly}
                color={isAnnotationMode ? "primary" : "default"}
              >
                <TextFieldsIcon />
              </IconButton>
            </Tooltip>
            
            {/* Color Picker */}
            <Tooltip title="Color">
              <IconButton 
                size="small" 
                onClick={(e) => setColorMenuAnchor(e.currentTarget)}
                disabled={readOnly}
              >
                <PaletteIcon sx={{ color: brushSettings.color }} />
              </IconButton>
            </Tooltip>
            
            {/* Brush Size */}
            <Tooltip title="Brush Size">
              <IconButton 
                size="small" 
                onClick={(e) => setBrushMenuAnchor(e.currentTarget)}
                disabled={readOnly}
              >
                <BrushIcon />
              </IconButton>
            </Tooltip>
            
            {/* Annotation Settings */}
            <Tooltip title="Annotation Settings">
              <IconButton 
                size="small" 
                onClick={(e) => setAnnotationMenuAnchor(e.currentTarget)}
                disabled={readOnly}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem />
            
            {/* Save Button */}
            <Tooltip title="Save">
              <IconButton 
                size="small" 
                color="primary" 
                onClick={handleSave}
                disabled={readOnly || syncState.isSaving}
              >
                {syncState.isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
              </IconButton>
            </Tooltip>
            
            {/* Download Menu */}
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                onClick={(e) => setBrushMenuAnchor(e.currentTarget)}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Canvas Container */}
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden',
            touchAction: 'none', // Prevent scrolling on touch devices
            cursor: readOnly ? 'default' : 'crosshair',
            bgcolor: '#fff'
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            style={{
              display: 'block',
              backgroundColor: '#fff',
              touchAction: 'none'
            }}
          />
          
          {/* Placeholder */}
          {strokes.length === 0 && !isDrawing && !readOnly && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#999',
                pointerEvents: 'none',
                textAlign: 'center'
              }}
            >
              <EditIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2">
                Draw here with your mouse or touch
              </Typography>
            </Box>
          )}
          
          {/* Read-only indicator */}
          {readOnly && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '12px'
              }}
            >
              Read Only
            </Box>
          )}

          {/* Save Indicator */}
          {showSaveIndicator && !readOnly && (
            <DrawingSaveIndicator
              state={syncState}
              onRetry={() => syncActions.forceSync()}
              onDismissError={() => syncActions.clearError()}
              position={saveIndicatorPosition}
              size="small"
            />
          )}

          {/* Annotations Overlay */}
          {annotations.map((annotation) => (
            <Box
              key={annotation.id}
              draggable={!readOnly}
              onDragStart={(e) => handleAnnotationDragStart(e, annotation.id)}
              onDragEnd={handleAnnotationDragEnd}
              onClick={() => handleAnnotationClick(annotation.id)}
              onDoubleClick={() => handleAnnotationDoubleClick(annotation.id)}
              sx={{
                position: 'absolute',
                left: annotation.x,
                top: annotation.y,
                transform: 'translate(-50%, -50%)',
                cursor: isAnnotationMode ? 'pointer' : 'default',
                zIndex: selectedAnnotation === annotation.id ? 10 : 5,
                '&:hover': {
                  zIndex: 15
                }
              }}
            >
              <Box
                sx={{
                  fontSize: annotation.fontSize,
                  color: annotation.color,
                  backgroundColor: annotation.backgroundColor,
                  border: `${annotation.borderWidth}px solid ${annotation.borderColor}`,
                  borderRadius: `${annotation.borderRadius}px`,
                  padding: `${annotation.padding}px`,
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  boxShadow: selectedAnnotation === annotation.id ? '0 0 0 2px #1976d2' : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  opacity: draggedAnnotation === annotation.id ? 0.5 : 1,
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    transform: 'translate(-50%, -50%) scale(1.05)'
                  }
                }}
              >
                {annotation.text}
              </Box>
              
              {/* Delete button for selected annotation */}
              {selectedAnnotation === annotation.id && isAnnotationMode && !readOnly && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#f44336',
                    color: 'white',
                    width: 20,
                    height: 20,
                    '&:hover': {
                      backgroundColor: '#d32f2f'
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 12 }} />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>

        {/* Color Menu */}
        <Menu
          anchorEl={colorMenuAnchor}
          open={Boolean(colorMenuAnchor)}
          onClose={() => setColorMenuAnchor(null)}
          PaperProps={{
            sx: { minWidth: 200 }
          }}
        >
          {colors.map((color) => (
            <MenuItem
              key={color}
              onClick={() => {
                setBrushSettings(prev => ({ ...prev, color }));
                setColorMenuAnchor(null);
              }}
              selected={color === brushSettings.color}
            >
              <ListItemIcon>
                {color === brushSettings.color && <CheckIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={color}
                secondary={`Brush color: ${color}`}
              />
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  bgcolor: color,
                  border: '1px solid #ddd',
                  borderRadius: '50%'
                }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Brush Size Menu */}
        <Menu
          anchorEl={brushMenuAnchor}
          open={Boolean(brushMenuAnchor)}
          onClose={() => setBrushMenuAnchor(null)}
          PaperProps={{
            sx: { minWidth: 150 }
          }}
        >
          {brushSizes.map((size) => (
            <MenuItem
              key={size}
              onClick={() => {
                setBrushSettings(prev => ({ ...prev, width: size }));
                setBrushMenuAnchor(null);
              }}
              selected={size === brushSettings.width}
            >
              <ListItemIcon>
                {size === brushSettings.width && <CheckIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={`${size}px`}
                secondary={`Brush width: ${size}px`}
              />
              <Box
                sx={{
                  width: size * 2,
                  height: size * 2,
                  bgcolor: brushSettings.color,
                  borderRadius: '50%'
                }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Annotation Settings Menu */}
        <Menu
          anchorEl={annotationMenuAnchor}
          open={Boolean(annotationMenuAnchor)}
          onClose={() => setAnnotationMenuAnchor(null)}
          PaperProps={{
            sx: { minWidth: 200 }
          }}
        >
          <MenuItem onClick={() => {
            const newFontSize = prompt('Enter new font size:', annotationSettings.fontSize.toString());
            if (newFontSize !== null) {
              const size = parseInt(newFontSize, 10);
              if (!isNaN(size) && size > 0) {
                setAnnotationSettings(prev => ({ ...prev, fontSize: size }));
              }
            }
            setAnnotationMenuAnchor(null);
          }}>
            <ListItemIcon>
              <TextFieldsIcon />
            </ListItemIcon>
            <ListItemText primary="Font Size" secondary={`${annotationSettings.fontSize}px`} />
          </MenuItem>
          <MenuItem onClick={() => {
            const newColor = prompt('Enter new color (e.g., #000000):', annotationSettings.color);
            if (newColor !== null) {
              const color = newColor.startsWith('#') ? newColor : `#${newColor}`;
              if (color.length === 7) { // #RRGGBB
                setAnnotationSettings(prev => ({ ...prev, color }));
              }
            }
            setAnnotationMenuAnchor(null);
          }}>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText primary="Color" secondary={annotationSettings.color} />
          </MenuItem>
          <MenuItem onClick={() => {
            const newBackgroundColor = prompt('Enter new background color (e.g., #ffffff):', annotationSettings.backgroundColor);
            if (newBackgroundColor !== null) {
              const color = newBackgroundColor.startsWith('#') ? newBackgroundColor : `#${newBackgroundColor}`;
              if (color.length === 7) { // #RRGGBB
                setAnnotationSettings(prev => ({ ...prev, backgroundColor: color }));
              }
            }
            setAnnotationMenuAnchor(null);
          }}>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText primary="Background Color" secondary={annotationSettings.backgroundColor} />
          </MenuItem>
          <MenuItem onClick={() => {
            const newBorderColor = prompt('Enter new border color (e.g., #cccccc):', annotationSettings.borderColor);
            if (newBorderColor !== null) {
              const color = newBorderColor.startsWith('#') ? newBorderColor : `#${newBorderColor}`;
              if (color.length === 7) { // #RRGGBB
                setAnnotationSettings(prev => ({ ...prev, borderColor: color }));
              }
            }
            setAnnotationMenuAnchor(null);
          }}>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText primary="Border Color" secondary={annotationSettings.borderColor} />
          </MenuItem>
          <MenuItem onClick={() => {
            const newBorderWidth = prompt('Enter new border width (e.g., 1):', annotationSettings.borderWidth.toString());
            if (newBorderWidth !== null) {
              const width = parseInt(newBorderWidth, 10);
              if (!isNaN(width) && width >= 0) {
                setAnnotationSettings(prev => ({ ...prev, borderWidth: width }));
              }
            }
            setAnnotationMenuAnchor(null);
          }}>
            <ListItemIcon>
              <TextFieldsIcon />
            </ListItemIcon>
            <ListItemText primary="Border Width" secondary={`${annotationSettings.borderWidth}px`} />
          </MenuItem>
          <MenuItem onClick={() => {
            const newPadding = prompt('Enter new padding (e.g., 4):', annotationSettings.padding.toString());
            if (newPadding !== null) {
              const padding = parseInt(newPadding, 10);
              if (!isNaN(padding) && padding >= 0) {
                setAnnotationSettings(prev => ({ ...prev, padding: padding }));
              }
            }
            setAnnotationMenuAnchor(null);
          }}>
            <ListItemIcon>
              <TextFieldsIcon />
            </ListItemIcon>
            <ListItemText primary="Padding" secondary={`${annotationSettings.padding}px`} />
          </MenuItem>
          <MenuItem onClick={() => {
            const newBorderRadius = prompt('Enter new border radius (e.g., 4):', annotationSettings.borderRadius.toString());
            if (newBorderRadius !== null) {
              const radius = parseInt(newBorderRadius, 10);
              if (!isNaN(radius) && radius >= 0) {
                setAnnotationSettings(prev => ({ ...prev, borderRadius: radius }));
              }
            }
            setAnnotationMenuAnchor(null);
          }}>
            <ListItemIcon>
              <TextFieldsIcon />
            </ListItemIcon>
            <ListItemText primary="Border Radius" secondary={`${annotationSettings.borderRadius}px`} />
          </MenuItem>
        </Menu>

        {/* Download Menu */}
        <Menu
          anchorEl={brushMenuAnchor}
          open={Boolean(brushMenuAnchor)}
          onClose={() => setBrushMenuAnchor(null)}
          PaperProps={{
            sx: { minWidth: 150 }
          }}
        >
          <MenuItem onClick={() => {
            downloadSVG();
            setBrushMenuAnchor(null);
          }}>
            <ListItemIcon>
              <CodeIcon />
            </ListItemIcon>
            <ListItemText primary="Download SVG" />
          </MenuItem>
          <MenuItem onClick={() => {
            downloadPNG();
            setBrushMenuAnchor(null);
          }}>
            <ListItemIcon>
              <ImageIcon />
            </ListItemIcon>
            <ListItemText primary="Download PNG" />
          </MenuItem>
        </Menu>

        {/* Instructions */}
        {!readOnly && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              💡 Tip: Use your mouse or touch to draw. Changes are automatically saved when you click the save button.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default FreeformDrawingBlock; 