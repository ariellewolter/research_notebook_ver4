import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  TextFields as TextIcon,
  Image as ImageIcon,
  TableChart as TableIcon,
  ViewModule as BlockIcon,
} from '@mui/icons-material';

interface CanvasContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onAddElement: (type: 'text' | 'image' | 'table' | 'block') => void;
  readOnly?: boolean;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  open,
  x,
  y,
  onClose,
  onAddElement,
  readOnly = false,
}) => {
  const handleAddElement = (type: 'text' | 'image' | 'table' | 'block') => {
    onAddElement(type);
    onClose();
  };

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{
        top: y,
        left: x,
      }}
      disableScrollLock
    >
      <MenuItem 
        onClick={() => handleAddElement('text')}
        disabled={readOnly}
      >
        <ListItemIcon>
          <TextIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Add Text Block</ListItemText>
      </MenuItem>
      
      <MenuItem 
        onClick={() => handleAddElement('image')}
        disabled={readOnly}
      >
        <ListItemIcon>
          <ImageIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Add Image</ListItemText>
      </MenuItem>
      
      <MenuItem 
        onClick={() => handleAddElement('table')}
        disabled={readOnly}
      >
        <ListItemIcon>
          <TableIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Add Table</ListItemText>
      </MenuItem>
      
      <Divider />
      
      <MenuItem 
        onClick={() => handleAddElement('block')}
        disabled={readOnly}
      >
        <ListItemIcon>
          <BlockIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Add Content Block</ListItemText>
      </MenuItem>
    </Menu>
  );
}; 