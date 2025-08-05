import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  TextFields as TextIcon,
} from '@mui/icons-material';
import { useTouchMode } from '../../contexts/TouchModeContext';
import { TouchDraggableBlock } from '../UI/TouchDraggableBlock';

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

interface CanvasBlockProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (elementId: string, x: number, y: number) => void;
  onResize: (elementId: string, width: number, height: number) => void;
  onUpdate: (elementId: string, content: any) => void;
  onDelete: (elementId: string) => void;
  readOnly?: boolean;
}

export const CanvasBlock: React.FC<CanvasBlockProps> = ({
  element,
  isSelected,
  onSelect,
  onMove,
  onResize,
  onUpdate,
  onDelete,
  readOnly = false,
}) => {
  const { isTouchMode, touchHitboxSize } = useTouchMode();
  const [isEditing, setIsEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    onSelect();
  }, [readOnly, onSelect]);

  const handleDragStart = useCallback(() => {
    if (readOnly) return;
    setIsDragging(true);
  }, [readOnly]);

  const handleDragMove = useCallback((deltaX: number, deltaY: number) => {
    if (readOnly) return;
    onMove(element.id, element.x + deltaX, element.y + deltaY);
  }, [readOnly, element.id, element.x, element.y, onMove]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResizeStart = useCallback((handle: string) => {
    if (readOnly) return;
    setIsResizing(true);
    setResizeHandle(handle);
  }, [readOnly]);

  const handleResizeMove = useCallback((deltaX: number, deltaY: number) => {
    if (readOnly || !isResizing) return;
    
    let newWidth = element.width;
    let newHeight = element.height;
    let newX = element.x;
    let newY = element.y;

    switch (resizeHandle) {
      case 'se':
        newWidth = Math.max(100, element.width + deltaX);
        newHeight = Math.max(100, element.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(100, element.width - deltaX);
        newHeight = Math.max(100, element.height + deltaY);
        newX = element.x + deltaX;
        break;
      case 'ne':
        newWidth = Math.max(100, element.width + deltaX);
        newHeight = Math.max(100, element.height - deltaY);
        newY = element.y + deltaY;
        break;
      case 'nw':
        newWidth = Math.max(100, element.width - deltaX);
        newHeight = Math.max(100, element.height - deltaY);
        newX = element.x + deltaX;
        newY = element.y + deltaY;
        break;
    }

    onResize(element.id, newWidth, newHeight);
    if (newX !== element.x || newY !== element.y) {
      onMove(element.id, newX, newY);
    }
  }, [readOnly, isResizing, resizeHandle, element, onResize, onMove]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleDelete = useCallback(() => {
    onDelete(element.id);
    handleMenuClose();
  }, [element.id, onDelete, handleMenuClose]);

  const handleContentChange = useCallback((newContent: any) => {
    onUpdate(element.id, newContent);
  }, [element.id, onUpdate]);

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return isEditing ? (
          <TextField
            multiline
            fullWidth
            value={element.content}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            autoFocus
            variant="outlined"
            size="small"
            sx={{ minHeight: 100 }}
          />
        ) : (
          <Typography
            variant="body1"
            sx={{ 
              whiteSpace: 'pre-wrap',
              cursor: 'pointer',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
            }}
            onClick={handleEdit}
          >
            {element.content}
          </Typography>
        );

      case 'table':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Array.from({ length: element.content.cols }, (_, i) => (
                    <TableCell key={i}>Header {i + 1}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: element.content.rows }, (_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Array.from({ length: element.content.cols }, (_, colIndex) => (
                      <TableCell key={colIndex}>
                        Cell {rowIndex + 1}-{colIndex + 1}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'image':
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              border: '2px dashed #ccc',
              borderRadius: 1,
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: '#ccc' }} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Image Placeholder
            </Typography>
          </Box>
        );

      default:
        return (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Content Block
            </Typography>
          </Box>
        );
    }
  };

  const resizeHandleSize = isTouchMode ? 20 : 8;

  return (
    <TouchDraggableBlock
      ref={blockRef}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      sx={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex + (isSelected ? 1000 : 0),
        cursor: isDragging ? 'grabbing' : 'grab',
        '&:hover': {
          boxShadow: isSelected ? '0 0 0 2px #1976d2' : '0 2px 8px rgba(0,0,0,0.1)',
        },
      }}
      onClick={handleMouseDown}
    >
      <Paper
        elevation={isSelected ? 8 : 2}
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 0.5,
            backgroundColor: isSelected ? 'primary.main' : 'grey.100',
            color: isSelected ? 'primary.contrastText' : 'text.secondary',
            minHeight: isTouchMode ? `${touchHitboxSize}px` : '32px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {element.type === 'text' && <TextIcon fontSize="small" />}
            {element.type === 'table' && <TableIcon fontSize="small" />}
            {element.type === 'image' && <ImageIcon fontSize="small" />}
            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
              {element.type}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ 
                minWidth: isTouchMode ? `${touchHitboxSize}px` : '24px',
                minHeight: isTouchMode ? `${touchHitboxSize}px` : '24px',
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, p: 1, overflow: 'auto' }}>
          {renderContent()}
        </Box>

        {/* Resize Handles */}
        {isSelected && !readOnly && (
          <>
            <Box
              sx={{
                position: 'absolute',
                bottom: -resizeHandleSize / 2,
                right: -resizeHandleSize / 2,
                width: resizeHandleSize,
                height: resizeHandleSize,
                backgroundColor: '#1976d2',
                borderRadius: '50%',
                cursor: 'se-resize',
                zIndex: 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart('se');
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -resizeHandleSize / 2,
                left: -resizeHandleSize / 2,
                width: resizeHandleSize,
                height: resizeHandleSize,
                backgroundColor: '#1976d2',
                borderRadius: '50%',
                cursor: 'sw-resize',
                zIndex: 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart('sw');
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: -resizeHandleSize / 2,
                right: -resizeHandleSize / 2,
                width: resizeHandleSize,
                height: resizeHandleSize,
                backgroundColor: '#1976d2',
                borderRadius: '50%',
                cursor: 'ne-resize',
                zIndex: 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart('ne');
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: -resizeHandleSize / 2,
                left: -resizeHandleSize / 2,
                width: resizeHandleSize,
                height: resizeHandleSize,
                backgroundColor: '#1976d2',
                borderRadius: '50%',
                cursor: 'nw-resize',
                zIndex: 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleResizeStart('nw');
              }}
            />
          </>
        )}
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </TouchDraggableBlock>
  );
}; 