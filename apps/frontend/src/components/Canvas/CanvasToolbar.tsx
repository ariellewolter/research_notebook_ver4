import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Slider,
} from '@mui/material';
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
  TextFields as TextIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  ViewModule as BlockIcon,
  Palette as PaletteIcon,
  Brush as BrushIcon,
} from '@mui/icons-material';
import { useTouchMode } from '../../contexts/TouchModeContext';

interface CanvasToolbarProps {
  isDrawing: boolean;
  isPanning: boolean;
  onToggleDrawing: () => void;
  onTogglePanning: () => void;
  onAddElement: (type: 'text' | 'image' | 'table' | 'block') => void;
  onSave: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  zoom: number;
  readOnly?: boolean;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  isDrawing,
  isPanning,
  onToggleDrawing,
  onTogglePanning,
  onAddElement,
  onSave,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  zoom,
  readOnly = false,
}) => {
  const { isTouchMode, touchHitboxSize } = useTouchMode();
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [drawingMenuAnchor, setDrawingMenuAnchor] = useState<null | HTMLElement>(null);
  const [brushSize, setBrushSize] = useState(2);
  const [brushColor, setBrushColor] = useState('#000000');

  const handleAddClick = (event: React.MouseEvent<HTMLElement>) => {
    setAddMenuAnchor(event.currentTarget);
  };

  const handleAddClose = () => {
    setAddMenuAnchor(null);
  };

  const handleDrawingClick = (event: React.MouseEvent<HTMLElement>) => {
    setDrawingMenuAnchor(event.currentTarget);
  };

  const handleDrawingClose = () => {
    setDrawingMenuAnchor(null);
  };

  const handleAddElement = (type: 'text' | 'image' | 'table' | 'block') => {
    onAddElement(type);
    handleAddClose();
  };

  const toolbarButtonStyle = {
    minWidth: isTouchMode ? `${touchHitboxSize}px` : '40px',
    minHeight: isTouchMode ? `${touchHitboxSize}px` : '40px',
    padding: isTouchMode ? '12px' : '8px',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        backgroundColor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        minHeight: 60,
        flexWrap: 'wrap',
      }}
    >
      {/* Add Element Button */}
      <Tooltip title="Add Element">
        <IconButton
          onClick={handleAddClick}
          disabled={readOnly}
          sx={toolbarButtonStyle}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={handleAddClose}
      >
        <MenuItem onClick={() => handleAddElement('text')}>
          <TextIcon sx={{ mr: 1 }} />
          Text Block
        </MenuItem>
        <MenuItem onClick={() => handleAddElement('image')}>
          <ImageIcon sx={{ mr: 1 }} />
          Image
        </MenuItem>
        <MenuItem onClick={() => handleAddElement('table')}>
          <TableIcon sx={{ mr: 1 }} />
          Table
        </MenuItem>
        <MenuItem onClick={() => handleAddElement('block')}>
          <BlockIcon sx={{ mr: 1 }} />
          Content Block
        </MenuItem>
      </Menu>

      <Divider orientation="vertical" flexItem />

      {/* Drawing Tools */}
      <Tooltip title="Drawing Tools">
        <IconButton
          onClick={handleDrawingClick}
          disabled={readOnly}
          sx={{
            ...toolbarButtonStyle,
            backgroundColor: isDrawing ? 'primary.main' : 'transparent',
            color: isDrawing ? 'primary.contrastText' : 'inherit',
          }}
        >
          <CreateIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={drawingMenuAnchor}
        open={Boolean(drawingMenuAnchor)}
        onClose={handleDrawingClose}
      >
        <MenuItem onClick={() => { onToggleDrawing(); handleDrawingClose(); }}>
          <BrushIcon sx={{ mr: 1 }} />
          {isDrawing ? 'Stop Drawing' : 'Start Drawing'}
        </MenuItem>
        <Divider />
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="body2" gutterBottom>
            Brush Size
          </Typography>
          <Slider
            value={brushSize}
            onChange={(_, value) => setBrushSize(value as number)}
            min={1}
            max={10}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
            Brush Color
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
              <Box
                key={color}
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  border: brushColor === color ? '2px solid #1976d2' : '1px solid #ccc',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
                onClick={() => setBrushColor(color)}
              />
            ))}
          </Box>
        </Box>
      </Menu>

      {/* Pan Tool */}
      <Tooltip title="Pan Tool">
        <IconButton
          onClick={onTogglePanning}
          sx={{
            ...toolbarButtonStyle,
            backgroundColor: isPanning ? 'primary.main' : 'transparent',
            color: isPanning ? 'primary.contrastText' : 'inherit',
          }}
        >
          <PanToolIcon />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      {/* Zoom Controls */}
      <Tooltip title="Zoom Out">
        <IconButton onClick={onZoomOut} sx={toolbarButtonStyle}>
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>

      <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'center' }}>
        {Math.round(zoom * 100)}%
      </Typography>

      <Tooltip title="Zoom In">
        <IconButton onClick={onZoomIn} sx={toolbarButtonStyle}>
          <ZoomInIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Fit to Screen">
        <IconButton onClick={onFitToScreen} sx={toolbarButtonStyle}>
          <FitScreenIcon />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      {/* Save Button */}
      <Tooltip title="Save Canvas">
        <IconButton onClick={onSave} sx={toolbarButtonStyle}>
          <SaveIcon />
        </IconButton>
      </Tooltip>

      {/* Status Indicators */}
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
        {isDrawing && (
          <Typography variant="caption" color="primary">
            Drawing Mode
          </Typography>
        )}
        {isPanning && (
          <Typography variant="caption" color="primary">
            Pan Mode
          </Typography>
        )}
        {readOnly && (
          <Typography variant="caption" color="text.secondary">
            Read Only
          </Typography>
        )}
      </Box>
    </Box>
  );
}; 