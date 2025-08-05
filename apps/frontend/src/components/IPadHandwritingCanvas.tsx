import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Button,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Chip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Slider,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Clear as ClearIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  TextFields as TextIcon,
  TouchApp as TouchIcon,
  Keyboard as KeyboardIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Brush as BrushIcon,
  Palette as PaletteIcon,
  Opacity as OpacityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useHandwritingRecognition } from '../hooks/useHandwritingRecognition';
import { useIPadDetection } from '../hooks/useIPadDetection';
import { useIPadTouchGestures } from '../hooks/useIPadTouchGestures';

interface IPadHandwritingCanvasProps {
  value: string;
  onChange: (text: string) => void;
  onSave?: (text: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
  tiltX?: number;
  tiltY?: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  brushType: 'pen' | 'pencil' | 'marker';
}

const IPadHandwritingCanvas: React.FC<IPadHandwritingCanvasProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "Write here with your Apple Pencil or finger...",
  multiline = true,
  rows = 5,
  className = "",
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  const [showTextMode, setShowTextMode] = useState(false);
  const [textInput, setTextInput] = useState(value);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [recognitionMenuAnchor, setRecognitionMenuAnchor] = useState<null | HTMLElement>(null);
  const [recognitionResults, setRecognitionResults] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<string>('');

  // iPad and Pencil detection
  const {
    isIPad,
    isApplePencil,
    hasPressureSupport,
    hasTiltSupport
  } = useIPadDetection();

  // Drawing settings
  const [brushSettings, setBrushSettings] = useState({
    color: '#000000',
    width: 2,
    opacity: 1,
    brushType: 'pen' as const
  });

  // Use handwriting recognition hook
  const {
    isSupported: hasRecognitionSupport,
    isRecognizing,
    error: recognitionError,
    recognize,
    cancel,
    reset
  } = useHandwritingRecognition({
    language: 'en-US',
    maxAlternatives: 5,
    continuous: false,
    interimResults: false
  });

  // Initialize canvas size with high DPI support
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = Math.max(300, rows * 50); // Larger minimum height for iPad

        setCanvasSize({ width, height });
        
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;
        
        // Set canvas size accounting for device pixel ratio
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
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
  }, [rows]);

  // Enhanced drawing with pressure and tilt support
  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.save();
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Apply brush type effects
    if (stroke.brushType === 'pencil') {
      ctx.globalCompositeOperation = 'multiply';
    } else if (stroke.brushType === 'marker') {
      ctx.globalCompositeOperation = 'overlay';
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    // Draw with pressure and tilt variations
    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i];
      const prevPoint = stroke.points[i - 1];
      
      // Apply pressure-based width variation
      const pressureWidth = stroke.width * (point.pressure || 1);
      ctx.lineWidth = pressureWidth;

      // Apply tilt effects if available
      if (point.tiltX !== undefined && point.tiltY !== undefined) {
        const tiltAngle = Math.atan2(point.tiltY, point.tiltX);
        ctx.lineCap = 'butt';
        ctx.lineWidth = pressureWidth * Math.abs(Math.cos(tiltAngle));
      }

      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
    ctx.restore();
  }, []);

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
        drawStroke(ctx, stroke);
      }
    });
  }, [strokes, currentStroke, drawStroke]);

  // Enhanced touch gesture handling
  const { gestureState } = useIPadTouchGestures({
    onTap: (point) => {
      // Handle tap gestures
      console.log('Tap detected at:', point);
    },
    onLongPress: (point) => {
      // Handle long press for context menu
      console.log('Long press detected at:', point);
    },
    onPressureChange: (pressure) => {
      // Update brush width based on pressure
      if (hasPressureSupport) {
        setBrushSettings(prev => ({
          ...prev,
          width: Math.max(1, pressure * 8)
        }));
      }
    }
  });

  const getPointFromEvent = (event: React.MouseEvent | React.TouchEvent | PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 1, timestamp: Date.now() };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number, pressure: number = 1, tiltX: number | undefined, tiltY: number | undefined;

    if ('touches' in event) {
      // Touch event
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      pressure = (touch as any).force || 1;
    } else if ('pressure' in event) {
      // Pointer event (includes Pencil)
      clientX = event.clientX;
      clientY = event.clientY;
      pressure = event.pressure || 1;
      tiltX = (event as any).tiltX;
      tiltY = (event as any).tiltY;
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      pressure,
      timestamp: Date.now(),
      tiltX,
      tiltY
    };
  };

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent | PointerEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDrawing(true);
    
    const point = getPointFromEvent(event);
    const newStroke: Stroke = {
      points: [point],
      color: brushSettings.color,
      width: brushSettings.width * (point.pressure || 1),
      opacity: brushSettings.opacity,
      brushType: brushSettings.brushType
    };
    
    setCurrentStroke(newStroke);
  }, [disabled, brushSettings]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent | PointerEvent) => {
    if (!isDrawing || !currentStroke || disabled) return;
    
    event.preventDefault();
    
    const point = getPointFromEvent(event);
    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, point],
      width: brushSettings.width * (point.pressure || 1)
    } : null);
  }, [isDrawing, currentStroke, disabled, brushSettings]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || disabled) return;
    
    setIsDrawing(false);
    
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => {
        const newStrokes = [...prev, currentStroke];
        setUndoStack(prevStack => [...prevStack, prev]);
        setRedoStack([]); // Clear redo stack when new stroke is added
        return newStrokes;
      });
    }
    
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, disabled]);

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setUndoStack([]);
    setRedoStack([]);
    reset();
    setRecognitionResults([]);
    setSelectedResult('');
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousStrokes = undoStack[undoStack.length - 1];
      const currentStrokes = strokes;
      
      setStrokes(previousStrokes);
      setUndoStack(undoStack.slice(0, -1));
      setRedoStack([...redoStack, currentStrokes]);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextStrokes = redoStack[redoStack.length - 1];
      const currentStrokes = strokes;
      
      setStrokes(nextStrokes);
      setRedoStack(redoStack.slice(0, -1));
      setUndoStack([...undoStack, currentStrokes]);
    }
  };

  const recognizeHandwriting = async () => {
    if (!hasRecognitionSupport || strokes.length === 0) return;

    try {
      const result = await recognize(strokes);
      if (result) {
        const alternatives = [result.transcript, ...(result.alternatives || [])];
        setRecognitionResults(alternatives);
        setSelectedResult(result.transcript);
        setRecognitionMenuAnchor(document.activeElement as HTMLElement);
      }
    } catch (error) {
      console.error('Recognition failed:', error);
    }
  };

  const handleRecognitionResultSelect = (result: string) => {
    setSelectedResult(result);
    onChange(result);
    setTextInput(result);
    setShowTextMode(true);
    setRecognitionMenuAnchor(null);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(textInput);
    } else {
      onChange(textInput);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const switchToTextMode = () => {
    setShowTextMode(true);
    setTextInput(value);
  };

  const switchToHandwritingMode = () => {
    setShowTextMode(false);
  };

  // Event handlers
  const handleMouseDown = (event: React.MouseEvent) => startDrawing(event);
  const handleMouseMove = (event: React.MouseEvent) => draw(event);
  const handleMouseUp = () => stopDrawing();
  const handleMouseLeave = () => stopDrawing();

  const handleTouchStart = (event: React.TouchEvent) => startDrawing(event);
  const handleTouchMove = (event: React.TouchEvent) => draw(event);
  const handleTouchEnd = () => stopDrawing();

  const handlePointerDown = (event: React.PointerEvent) => startDrawing(event);
  const handlePointerMove = (event: React.PointerEvent) => draw(event);
  const handlePointerUp = () => stopDrawing();

  if (showTextMode) {
    return (
      <Box className={className}>
        <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" color="primary">
              Text Mode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Switch to handwriting">
                <IconButton size="small" onClick={switchToHandwritingMode}>
                  <TouchIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Save">
                <IconButton size="small" color="primary" onClick={handleSave}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={handleCancel}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              minHeight: `${rows * 24}px`,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '14px',
              lineHeight: '1.5',
              resize: 'vertical'
            }}
            disabled={disabled}
          />
        </Paper>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" color="primary">
              iPad Handwriting
            </Typography>
            {isIPad && (
              <Chip 
                label="iPad Optimized" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            )}
            {isApplePencil && (
              <Chip 
                label="Apple Pencil" 
                size="small" 
                color="secondary" 
                variant="outlined"
              />
            )}
            {!hasRecognitionSupport && (
              <Chip 
                label="No Recognition" 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Undo">
              <IconButton 
                size="small" 
                onClick={undo}
                disabled={undoStack.length === 0}
              >
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton 
                size="small" 
                onClick={redo}
                disabled={redoStack.length === 0}
              >
                <RedoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear">
              <IconButton size="small" onClick={clearCanvas}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Switch to text input">
              <IconButton size="small" onClick={switchToTextMode}>
                <KeyboardIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Brush Settings */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Brush</InputLabel>
            <Select
              value={brushSettings.brushType}
              onChange={(e) => setBrushSettings(prev => ({ ...prev, brushType: e.target.value as any }))}
              label="Brush"
            >
              <MenuItem value="pen">Pen</MenuItem>
              <MenuItem value="pencil">Pencil</MenuItem>
              <MenuItem value="marker">Marker</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteIcon fontSize="small" />
            <input
              type="color"
              value={brushSettings.color}
              onChange={(e) => setBrushSettings(prev => ({ ...prev, color: e.target.value }))}
              style={{ width: 40, height: 32, border: 'none', borderRadius: 4 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <BrushIcon fontSize="small" />
            <Slider
              value={brushSettings.width}
              onChange={(_, value) => setBrushSettings(prev => ({ ...prev, width: value as number }))}
              min={1}
              max={10}
              step={0.5}
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <OpacityIcon fontSize="small" />
            <Slider
              value={brushSettings.opacity}
              onChange={(_, value) => setBrushSettings(prev => ({ ...prev, opacity: value as number }))}
              min={0.1}
              max={1}
              step={0.1}
              size="small"
            />
          </Box>
        </Box>

        {/* Recognition Status */}
        {recognitionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {recognitionError}
          </Alert>
        )}

        {/* Canvas Container */}
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden',
            touchAction: 'none', // Prevent scrolling on touch devices
            cursor: 'crosshair',
            backgroundColor: '#fff'
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              display: 'block',
              backgroundColor: '#fff',
              touchAction: 'none'
            }}
          />
          
          {/* Placeholder */}
          {strokes.length === 0 && !isDrawing && (
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
              <TouchIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2">
                {placeholder}
              </Typography>
              {isIPad && (
                <Typography variant="caption" color="text.secondary">
                  Use Apple Pencil for best experience
                </Typography>
              )}
            </Box>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            onClick={recognizeHandwriting}
            disabled={!hasRecognitionSupport || strokes.length === 0 || isRecognizing}
            startIcon={isRecognizing ? <CircularProgress size={16} /> : <TextIcon />}
            fullWidth
          >
            {isRecognizing ? 'Recognizing...' : 'Convert to Text'}
          </Button>
        </Box>

        {/* Recognition Results Menu */}
        <Menu
          anchorEl={recognitionMenuAnchor}
          open={Boolean(recognitionMenuAnchor)}
          onClose={() => setRecognitionMenuAnchor(null)}
          PaperProps={{
            sx: { minWidth: 200 }
          }}
        >
          {recognitionResults.map((result, index) => (
            <MenuItem
              key={index}
              onClick={() => handleRecognitionResultSelect(result)}
              selected={result === selectedResult}
            >
              <ListItemIcon>
                {result === selectedResult && <CheckIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={result}
                secondary={index === 0 ? 'Best match' : `Alternative ${index}`}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Instructions */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            💡 Tip: {isIPad ? 'Use Apple Pencil for pressure sensitivity and tilt effects. ' : ''}
            The handwriting recognition works best with clear, connected letters.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default IPadHandwritingCanvas; 