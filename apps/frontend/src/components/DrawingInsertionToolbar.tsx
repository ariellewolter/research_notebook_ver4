import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Typography
} from '@mui/material';
import {
  Brush as BrushIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import FreeformDrawingBlock from './blocks/FreeformDrawingBlock';
import { DrawingData } from './blocks/FreeformDrawingBlock';

interface DrawingInsertionToolbarProps {
  entityId: string;
  entityType: 'note' | 'project' | 'protocol' | 'task' | 'database';
  onInsertDrawing: (drawingData: DrawingData, blockId: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'toolbar' | 'menu' | 'button';
}

const DrawingInsertionToolbar: React.FC<DrawingInsertionToolbarProps> = ({
  entityId,
  entityType,
  onInsertDrawing,
  disabled = false,
  size = 'medium',
  variant = 'toolbar'
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDrawingDialog, setShowDrawingDialog] = useState(false);
  const [drawingBlockId, setDrawingBlockId] = useState('');
  const [drawingWidth, setDrawingWidth] = useState(600);
  const [drawingHeight, setDrawingHeight] = useState(400);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleInsertDrawing = () => {
    const blockId = `drawing-${entityType}-${entityId}-${Date.now()}`;
    setDrawingBlockId(blockId);
    setShowDrawingDialog(true);
    handleCloseMenu();
  };

  const handleDrawingSave = async (drawingData: DrawingData) => {
    try {
      await onInsertDrawing(drawingData, drawingBlockId);
      setShowDrawingDialog(false);
      setDrawingBlockId('');
    } catch (error) {
      console.error('Failed to insert drawing:', error);
    }
  };

  const handleCloseDrawingDialog = () => {
    setShowDrawingDialog(false);
    setDrawingBlockId('');
  };

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'note': return 'Note';
      case 'project': return 'Project';
      case 'protocol': return 'Protocol';
      case 'task': return 'Task';
      case 'database': return 'Database Entry';
      default: return 'Entity';
    }
  };

  const getEntityTypeColor = () => {
    switch (entityType) {
      case 'note': return '#4CAF50';
      case 'project': return '#2196F3';
      case 'protocol': return '#FF9800';
      case 'task': return '#9C27B0';
      case 'database': return '#607D8B';
      default: return '#666';
    }
  };

  const renderToolbarButton = () => (
    <Tooltip title={`Insert Drawing into ${getEntityTypeLabel()}`}>
      <IconButton
        onClick={handleOpenMenu}
        disabled={disabled}
        size={size}
        sx={{
          color: getEntityTypeColor(),
          '&:hover': {
            backgroundColor: `${getEntityTypeColor()}15`
          }
        }}
      >
        <BrushIcon />
      </IconButton>
    </Tooltip>
  );

  const renderMenuButton = () => (
    <Button
      onClick={handleOpenMenu}
      disabled={disabled}
      size={size}
      startIcon={<BrushIcon />}
      variant="outlined"
      sx={{
        color: getEntityTypeColor(),
        borderColor: getEntityTypeColor(),
        '&:hover': {
          backgroundColor: `${getEntityTypeColor()}15`,
          borderColor: getEntityTypeColor()
        }
      }}
    >
      Insert Drawing
    </Button>
  );

  const renderSimpleButton = () => (
    <Button
      onClick={handleInsertDrawing}
      disabled={disabled}
      size={size}
      startIcon={<BrushIcon />}
      variant="outlined"
      sx={{
        color: getEntityTypeColor(),
        borderColor: getEntityTypeColor(),
        '&:hover': {
          backgroundColor: `${getEntityTypeColor()}15`,
          borderColor: getEntityTypeColor()
        }
      }}
    >
      Add Drawing
    </Button>
  );

  const renderButton = () => {
    switch (variant) {
      case 'menu':
        return renderMenuButton();
      case 'button':
        return renderSimpleButton();
      default:
        return renderToolbarButton();
    }
  };

  return (
    <>
      {renderButton()}

      {/* Menu for toolbar variant */}
      {variant === 'toolbar' && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <MenuItem onClick={handleInsertDrawing}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Create New Drawing"
              secondary="Start with a blank canvas"
            />
          </MenuItem>
          <MenuItem onClick={handleCloseMenu} disabled>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Insert Existing Drawing"
              secondary="Coming soon"
            />
          </MenuItem>
        </Menu>
      )}

      {/* Drawing Creation Dialog */}
      <Dialog
        open={showDrawingDialog}
        onClose={handleCloseDrawingDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Create Drawing for {getEntityTypeLabel()}
            </Typography>
            <IconButton onClick={handleCloseDrawingDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Width</InputLabel>
                <Select
                  value={drawingWidth}
                  onChange={(e) => setDrawingWidth(e.target.value as number)}
                  label="Width"
                >
                  <MenuItem value={400}>400px</MenuItem>
                  <MenuItem value={600}>600px</MenuItem>
                  <MenuItem value={800}>800px</MenuItem>
                  <MenuItem value={1000}>1000px</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Height</InputLabel>
                <Select
                  value={drawingHeight}
                  onChange={(e) => setDrawingHeight(e.target.value as number)}
                  label="Height"
                >
                  <MenuItem value={300}>300px</MenuItem>
                  <MenuItem value={400}>400px</MenuItem>
                  <MenuItem value={500}>500px</MenuItem>
                  <MenuItem value={600}>600px</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="body2" color="text.secondary">
                Block ID: {drawingBlockId}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <FreeformDrawingBlock
              blockId={drawingBlockId}
              entityId={entityId}
              entityType={entityType}
              onSave={handleDrawingSave}
              width={drawingWidth}
              height={drawingHeight}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseDrawingDialog}>
            Cancel
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Click the Save button in the drawing toolbar to insert this drawing
          </Typography>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DrawingInsertionToolbar; 