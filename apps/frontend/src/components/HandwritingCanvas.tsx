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
  ListItemIcon
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
  Check as CheckIcon
} from '@mui/icons-material';
import { useHandwritingRecognition } from '../hooks/useHandwritingRecognition';

interface HandwritingCanvasProps {
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
  pressure?: number;
  timestamp: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder = "Write here with your finger or stylus...",
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

  // Initialize canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current && canvasRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = Math.max(200, rows * 40); // Minimum height based on rows

        setCanvasSize({ width, height });
        
        const canvas = canvasRef.current;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [rows]);

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
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        
        ctx.stroke();
      }
    });
  }, [strokes, currentStroke]);

  const getPointFromEvent = (event: React.MouseEvent | React.TouchEvent): Point => {
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
    if (disabled) return;
    
    event.preventDefault();
    setIsDrawing(true);
    
    const point = getPointFromEvent(event);
    const newStroke: Stroke = {
      points: [point],
      color: '#000000',
      width: Math.max(1, point.pressure || 1) * 3
    };
    
    setCurrentStroke(newStroke);
  }, [disabled]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke || disabled) return;
    
    event.preventDefault();
    
    const point = getPointFromEvent(event);
    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, point],
      width: Math.max(1, point.pressure || 1) * 3
    } : null);
  }, [isDrawing, currentStroke, disabled]);

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
    if (!hasRecognitionSupport) {
      return;
    }

    if (strokes.length === 0) {
      return;
    }

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

  // Mouse event handlers
  const handleMouseDown = (event: React.MouseEvent) => startDrawing(event);
  const handleMouseMove = (event: React.MouseEvent) => draw(event);
  const handleMouseUp = () => stopDrawing();
  const handleMouseLeave = () => stopDrawing();

  // Touch event handlers
  const handleTouchStart = (event: React.TouchEvent) => startDrawing(event);
  const handleTouchMove = (event: React.TouchEvent) => draw(event);
  const handleTouchEnd = () => stopDrawing();

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
              Handwriting Mode
            </Typography>
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
            cursor: 'crosshair'
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
            💡 Tip: Use your finger or stylus to write. The handwriting recognition works best with clear, connected letters.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default HandwritingCanvas; 