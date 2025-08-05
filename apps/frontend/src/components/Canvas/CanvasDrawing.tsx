import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useTouchMode } from '../../contexts/TouchModeContext';

interface DrawingStroke {
  id: string;
  points: Array<{ x: number; y: number; pressure?: number }>;
  color: string;
  width: number;
  opacity: number;
}

interface CanvasDrawingProps {
  isDrawing: boolean;
  drawings: DrawingStroke[];
  zoom: number;
  pan: { x: number; y: number };
  onDrawingComplete: (stroke: DrawingStroke) => void;
  readOnly?: boolean;
}

export const CanvasDrawing: React.FC<CanvasDrawingProps> = ({
  isDrawing,
  drawings,
  zoom,
  pan,
  onDrawingComplete,
  readOnly = false,
}) => {
  const { isTouchMode, longPressDelay } = useTouchMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawingStroke, setIsDrawingStroke] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [brushSettings, setBrushSettings] = useState({
    color: '#000000',
    width: 2,
    opacity: 1,
  });

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Configure context for smooth drawing
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    contextRef.current = context;
  }, []);

  // Redraw all strokes when drawings change
  useEffect(() => {
    const context = contextRef.current;
    const canvas = canvasRef.current;
    if (!context || !canvas) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    drawings.forEach(stroke => {
      drawStroke(context, stroke, zoom, pan);
    });
  }, [drawings, zoom, pan]);

  const drawStroke = useCallback((
    context: CanvasRenderingContext2D,
    stroke: DrawingStroke,
    zoom: number,
    pan: { x: number; y: number }
  ) => {
    if (stroke.points.length < 2) return;

    context.save();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width * zoom;
    context.globalAlpha = stroke.opacity;

    // Apply zoom and pan transformation
    context.setTransform(1, 0, 0, 1, pan.x, pan.y);
    context.scale(zoom, zoom);

    // Draw the stroke with smoothing
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      const prevPoint = stroke.points[i - 1];

      // Apply pressure-based width variation
      const pressure = point.pressure || 1;
      const width = stroke.width * pressure;
      context.lineWidth = width * zoom;

      // Smooth curve interpolation
      if (i < stroke.points.length - 1) {
        const nextPoint = stroke.points[i + 1];
        const cp1x = prevPoint.x + (point.x - prevPoint.x) * 0.5;
        const cp1y = prevPoint.y + (point.y - prevPoint.y) * 0.5;
        const cp2x = point.x + (nextPoint.x - point.x) * 0.5;
        const cp2y = point.y + (nextPoint.y - point.y) * 0.5;
        
        context.quadraticCurveTo(cp1x, cp1y, point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    }

    context.stroke();
    context.restore();
  }, []);

  const getCanvasCoordinates = useCallback((event: MouseEvent | TouchEvent): { x: number; y: number; pressure?: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number, pressure: number = 1;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      pressure = touch.force || 1;
    }

    // Convert to canvas coordinates
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    return { x, y, pressure };
  }, [zoom, pan]);

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing || readOnly) return;

    event.preventDefault();
    setIsDrawingStroke(true);

    const coords = getCanvasCoordinates(event);
    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      points: [coords],
      color: brushSettings.color,
      width: brushSettings.width,
      opacity: brushSettings.opacity,
    };

    setCurrentStroke(newStroke);
  }, [isDrawing, readOnly, getCanvasCoordinates, brushSettings]);

  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawingStroke || !currentStroke || !contextRef.current) return;

    event.preventDefault();
    const coords = getCanvasCoordinates(event);
    
    setCurrentStroke(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, coords],
      };
    });

    // Draw the current stroke in real-time
    const context = contextRef.current;
    if (context && currentStroke.points.length > 0) {
      const updatedStroke = {
        ...currentStroke,
        points: [...currentStroke.points, coords],
      };
      drawStroke(context, updatedStroke, zoom, pan);
    }
  }, [isDrawingStroke, currentStroke, getCanvasCoordinates, drawStroke, zoom, pan]);

  const stopDrawing = useCallback(() => {
    if (!isDrawingStroke || !currentStroke) return;

    setIsDrawingStroke(false);
    
    // Complete the stroke
    if (currentStroke.points.length > 1) {
      onDrawingComplete(currentStroke);
    }
    
    setCurrentStroke(null);
  }, [isDrawingStroke, currentStroke, onDrawingComplete]);

  // Mouse event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleMouseLeave = () => stopDrawing();

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Touch event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isTouchMode) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      startDrawing(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      draw(e);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchMode, startDrawing, draw, stopDrawing]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: isDrawing ? 'auto' : 'none',
          cursor: isDrawing ? 'crosshair' : 'default',
          touchAction: 'none', // Prevent scrolling while drawing
        }}
      />
      
      {/* Drawing indicator */}
      {isDrawing && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          Drawing Mode
        </Box>
      )}
    </Box>
  );
}; 