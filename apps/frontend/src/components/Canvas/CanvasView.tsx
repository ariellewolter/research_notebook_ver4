import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Paper, IconButton, Tooltip, Button, Menu, MenuItem } from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  PanTool as PanToolIcon,
  Create as CreateIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
} from '@mui/icons-material';
import { useTouchMode } from '../../contexts/TouchModeContext';
import { CanvasBlock } from './CanvasBlock';
import { CanvasDrawing } from './CanvasDrawing';
import { CanvasGrid } from './CanvasGrid';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasContextMenu } from './CanvasContextMenu';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'table' | 'block';
  x: number;
  y: number;
  width: number;
  height: number;
  content: any;
  zIndex: number;
}

interface DrawingStroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  opacity: number;
}

interface CanvasViewProps {
  noteId?: string;
  initialContent?: {
    elements: CanvasElement[];
    drawings: DrawingStroke[];
  };
  onSave?: (content: { elements: CanvasElement[]; drawings: DrawingStroke[] }) => void;
  readOnly?: boolean;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  noteId,
  initialContent = { elements: [], drawings: [] },
  onSave,
  readOnly = false,
}) => {
  const { isTouchMode } = useTouchMode();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>(initialContent.elements);
  const [drawings, setDrawings] = useState<DrawingStroke[]>(initialContent.drawings);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elementId?: string;
  } | null>(null);

  // Auto-expand canvas based on content
  useEffect(() => {
    const maxX = Math.max(...elements.map(el => el.x + el.width), 0);
    const maxY = Math.max(...elements.map(el => el.y + el.height), 0);
    const maxDrawingX = Math.max(...drawings.flatMap(stroke => stroke.points.map(p => p.x)), 0);
    const maxDrawingY = Math.max(...drawings.flatMap(stroke => stroke.points.map(p => p.y)), 0);
    
    const newWidth = Math.max(maxX, maxDrawingX) + 500;
    const newHeight = Math.max(maxY, maxDrawingY) + 500;
    
    setCanvasSize(prev => ({
      width: Math.max(prev.width, newWidth),
      height: Math.max(prev.height, newHeight),
    }));
  }, [elements, drawings]);

  const handleAddElement = useCallback((type: CanvasElement['type']) => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      x: 100 + pan.x,
      y: 100 + pan.y,
      width: type === 'text' ? 300 : type === 'table' ? 400 : 200,
      height: type === 'text' ? 150 : type === 'table' ? 200 : 150,
      content: type === 'text' ? 'New text block' : type === 'table' ? { rows: 3, cols: 3 } : null,
      zIndex: elements.length,
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [elements, pan]);

  const handleElementMove = useCallback((elementId: string, x: number, y: number) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, x, y } : el
    ));
  }, []);

  const handleElementResize = useCallback((elementId: string, width: number, height: number) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, width, height } : el
    ));
  }, []);

  const handleElementUpdate = useCallback((elementId: string, content: any) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, content } : el
    ));
  }, []);

  const handleElementDelete = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
  }, []);

  const handleDrawingComplete = useCallback((stroke: DrawingStroke) => {
    setDrawings(prev => [...prev, stroke]);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
    }
  }, []);

  const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleSave = useCallback(() => {
    onSave?.({ elements, drawings });
  }, [elements, drawings, onSave]);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  }, []);

  const handlePan = useCallback((deltaX: number, deltaY: number) => {
    setPan(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = rect.width / canvasSize.width;
      const scaleY = rect.height / canvasSize.height;
      const newZoom = Math.min(scaleX, scaleY, 1);
      setZoom(newZoom);
      setPan({ x: 0, y: 0 });
    }
  }, [canvasSize]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Canvas Toolbar */}
      <CanvasToolbar
        isDrawing={isDrawing}
        isPanning={isPanning}
        onToggleDrawing={() => setIsDrawing(!isDrawing)}
        onTogglePanning={() => setIsPanning(!isPanning)}
        onAddElement={handleAddElement}
        onSave={handleSave}
        onZoomIn={() => handleZoom(0.1)}
        onZoomOut={() => handleZoom(-0.1)}
        onFitToScreen={handleFitToScreen}
        zoom={zoom}
        readOnly={readOnly}
      />

      {/* Canvas Area */}
      <Box
        ref={canvasRef}
        sx={{
          width: '100%',
          height: 'calc(100% - 60px)',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#fafafa',
          cursor: isPanning ? 'grab' : isDrawing ? 'crosshair' : 'default',
          '&:active': {
            cursor: isPanning ? 'grabbing' : 'crosshair',
          },
        }}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasContextMenu}
      >
        {/* Canvas Grid */}
        <CanvasGrid
          width={canvasSize.width}
          height={canvasSize.height}
          zoom={zoom}
          pan={pan}
          isVisible={!isDrawing}
        />

        {/* Canvas Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: canvasSize.width,
            height: canvasSize.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {elements.map((element) => (
            <CanvasBlock
              key={element.id}
              element={element}
              isSelected={selectedElement === element.id}
              onSelect={() => setSelectedElement(element.id)}
              onMove={handleElementMove}
              onResize={handleElementResize}
              onUpdate={handleElementUpdate}
              onDelete={handleElementDelete}
              readOnly={readOnly}
            />
          ))}
        </Box>

        {/* Drawing Layer */}
        <CanvasDrawing
          isDrawing={isDrawing}
          drawings={drawings}
          zoom={zoom}
          pan={pan}
          onDrawingComplete={handleDrawingComplete}
          readOnly={readOnly}
        />
      </Box>

      {/* Context Menu */}
      <CanvasContextMenu
        open={!!contextMenu}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        onAddElement={handleAddElement}
        readOnly={readOnly}
      />
    </Box>
  );
}; 