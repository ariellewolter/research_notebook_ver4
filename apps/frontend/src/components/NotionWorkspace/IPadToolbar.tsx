import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Slide
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatStrikethrough as StrikethroughIcon,
  Code as CodeIcon,
  Link as LinkIcon,
  Highlight as HighlightIcon,
  FormatColorText as ColorIcon,
  FormatSize as SizeIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as NumberedListIcon,
  FormatQuote as QuoteIcon,
  TableChart as TableIcon,
  Image as ImageIcon,
  Functions as MathIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  TouchApp as TouchIcon,
  Keyboard as KeyboardIcon,
  Tablet as TabletIcon
} from '@mui/icons-material';
import RadialMenu, { formattingMenuItems, blockMenuItems, actionMenuItems } from './RadialMenu';
import PencilContextMenu, { pencilFormattingItems, pencilBlockItems, pencilActionItems } from './PencilContextMenu';
import TouchGestureHandler, { gestureConfigs } from './TouchGestureHandler';

interface IPadToolbarProps {
  onFormatAction?: (action: string) => void;
  onBlockAction?: (action: string) => void;
  onActionAction?: (action: string) => void;
  selectedText?: string;
  isVisible?: boolean;
  position?: 'top' | 'bottom' | 'floating';
  variant?: 'compact' | 'expanded';
  showGestures?: boolean;
}

const IPadToolbar: React.FC<IPadToolbarProps> = ({
  onFormatAction,
  onBlockAction,
  onActionAction,
  selectedText,
  isVisible = true,
  position = 'bottom',
  variant = 'compact',
  showGestures = true
}) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [radialMenuOpen, setRadialMenuOpen] = useState(false);
  const [pencilMenuOpen, setPencilMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [activeMenu, setActiveMenu] = useState<'radial' | 'pencil' | null>(null);
  const [isPencilDetected, setIsPencilDetected] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  // Detect Apple Pencil
  useEffect(() => {
    const detectPencil = (event: PointerEvent) => {
      // Check for Apple Pencil pressure or tilt
      if (event.pressure > 0 && event.pressure < 1) {
        setIsPencilDetected(true);
      } else {
        setIsPencilDetected(false);
      }
    };

    document.addEventListener('pointerdown', detectPencil);
    document.addEventListener('pointermove', detectPencil);

    return () => {
      document.removeEventListener('pointerdown', detectPencil);
      document.removeEventListener('pointermove', detectPencil);
    };
  }, []);

  const handleFormatAction = useCallback((action: string) => {
    onFormatAction?.(action);
    console.log('Format action:', action);
  }, [onFormatAction]);

  const handleBlockAction = useCallback((action: string) => {
    onBlockAction?.(action);
    console.log('Block action:', action);
  }, [onBlockAction]);

  const handleActionAction = useCallback((action: string) => {
    onActionAction?.(action);
    console.log('Action action:', action);
  }, [onActionAction]);

  const openRadialMenu = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    setActiveMenu('radial');
    setRadialMenuOpen(true);
  }, []);

  const openPencilMenu = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 20
    });
    setActiveMenu('pencil');
    setPencilMenuOpen(true);
  }, []);

  const closeMenus = useCallback(() => {
    setRadialMenuOpen(false);
    setPencilMenuOpen(false);
    setActiveMenu(null);
  }, []);

  // Touch gesture handlers
  const handleSwipeLeft = useCallback(() => {
    if (selectedText) {
      handleFormatAction('bold');
    }
  }, [selectedText, handleFormatAction]);

  const handleSwipeRight = useCallback(() => {
    if (selectedText) {
      handleFormatAction('italic');
    }
  }, [selectedText, handleFormatAction]);

  const handleSwipeUp = useCallback(() => {
    if (selectedText) {
      handleFormatAction('underline');
    }
  }, [selectedText, handleFormatAction]);

  const handleSwipeDown = useCallback(() => {
    if (selectedText) {
      handleFormatAction('highlight');
    }
  }, [selectedText, handleFormatAction]);

  const handleLongPress = useCallback(() => {
    openPencilMenu({} as React.MouseEvent);
  }, [openPencilMenu]);

  const handleDoubleTap = useCallback(() => {
    openRadialMenu({} as React.MouseEvent);
  }, [openRadialMenu]);

  // Toolbar layout based on screen size
  const getToolbarLayout = () => {
    if (isSmallScreen) {
      return {
        direction: 'row' as const,
        spacing: 1,
        padding: 1,
        iconSize: 20
      };
    }
    
    if (isTablet) {
      return {
        direction: 'row' as const,
        spacing: 2,
        padding: 2,
        iconSize: 24
      };
    }

    return {
      direction: 'row' as const,
      spacing: 3,
      padding: 3,
      iconSize: 28
    };
  };

  const layout = getToolbarLayout();

  if (!isVisible) return null;

  return (
    <>
      <TouchGestureHandler
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
        onSwipeDown={handleSwipeDown}
        onLongPress={handleLongPress}
        onDoubleTap={handleDoubleTap}
        config={gestureConfigs.normal}
        disabled={!showGestures}
      >
        <Slide
          direction={position === 'top' ? 'down' : 'up'}
          in={isVisible}
          timeout={300}
        >
          <Paper
            ref={toolbarRef}
            elevation={8}
            sx={{
              position: position === 'floating' ? 'fixed' : 'sticky',
              [position === 'top' ? 'top' : 'bottom']: position === 'floating' ? 20 : 0,
              left: position === 'floating' ? '50%' : 0,
              transform: position === 'floating' ? 'translateX(-50%)' : 'none',
              zIndex: 1200,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: position === 'floating' ? '24px' : '0',
              mx: position === 'floating' ? 2 : 0,
              maxWidth: position === 'floating' ? 600 : '100%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: layout.direction,
                alignItems: 'center',
                justifyContent: 'space-between',
                p: layout.padding,
                gap: layout.spacing
              }}
            >
              {/* Left side - Formatting tools */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: layout.spacing
                }}
              >
                <Tooltip title="Bold (Swipe Left)">
                  <IconButton
                    size="small"
                    onClick={() => handleFormatAction('bold')}
                    sx={{ color: 'text.primary' }}
                  >
                    <BoldIcon sx={{ fontSize: layout.iconSize }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Italic (Swipe Right)">
                  <IconButton
                    size="small"
                    onClick={() => handleFormatAction('italic')}
                    sx={{ color: 'text.primary' }}
                  >
                    <ItalicIcon sx={{ fontSize: layout.iconSize }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Underline (Swipe Up)">
                  <IconButton
                    size="small"
                    onClick={() => handleFormatAction('underline')}
                    sx={{ color: 'text.primary' }}
                  >
                    <UnderlineIcon sx={{ fontSize: layout.iconSize }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Highlight (Swipe Down)">
                  <IconButton
                    size="small"
                    onClick={() => handleFormatAction('highlight')}
                    sx={{ color: 'text.primary' }}
                  >
                    <HighlightIcon sx={{ fontSize: layout.iconSize }} />
                  </IconButton>
                </Tooltip>

                {variant === 'expanded' && (
                  <>
                    <Tooltip title="Code">
                      <IconButton
                        size="small"
                        onClick={() => handleFormatAction('code')}
                        sx={{ color: 'text.primary' }}
                      >
                        <CodeIcon sx={{ fontSize: layout.iconSize }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Link">
                      <IconButton
                        size="small"
                        onClick={() => handleFormatAction('link')}
                        sx={{ color: 'text.primary' }}
                      >
                        <LinkIcon sx={{ fontSize: layout.iconSize }} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>

              {/* Center - Block tools */}
              {variant === 'expanded' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: layout.spacing
                  }}
                >
                  <Tooltip title="Bullet List">
                    <IconButton
                      size="small"
                      onClick={() => handleBlockAction('bullet-list')}
                      sx={{ color: 'text.primary' }}
                    >
                      <BulletListIcon sx={{ fontSize: layout.iconSize }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Numbered List">
                    <IconButton
                      size="small"
                      onClick={() => handleBlockAction('numbered-list')}
                      sx={{ color: 'text.primary' }}
                    >
                      <NumberedListIcon sx={{ fontSize: layout.iconSize }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Quote">
                    <IconButton
                      size="small"
                      onClick={() => handleBlockAction('quote')}
                      sx={{ color: 'text.primary' }}
                    >
                      <QuoteIcon sx={{ fontSize: layout.iconSize }} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Table">
                    <IconButton
                      size="small"
                      onClick={() => handleBlockAction('table')}
                      sx={{ color: 'text.primary' }}
                    >
                      <TableIcon sx={{ fontSize: layout.iconSize }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              {/* Right side - Actions and menus */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: layout.spacing
                }}
              >
                {isPencilDetected && (
                  <Chip
                    icon={<EditIcon />}
                    label="Pencil"
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}

                <Tooltip title="Radial Menu (Double Tap)">
                  <IconButton
                    size="small"
                    onClick={openRadialMenu}
                    sx={{ color: 'primary.main' }}
                  >
                    <TouchIcon sx={{ fontSize: layout.iconSize }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Pencil Menu (Long Press)">
                  <IconButton
                    size="small"
                    onClick={openPencilMenu}
                    sx={{ color: 'primary.main' }}
                  >
                    <TabletIcon sx={{ fontSize: layout.iconSize }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="More Options">
                  <IconButton
                    size="small"
                    onClick={() => setActiveMenu('pencil')}
                    sx={{ color: 'text.secondary' }}
                  >
                    <MoreIcon sx={{ fontSize: layout.iconSize }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Gesture hints */}
            {showGestures && selectedText && (
              <Box
                sx={{
                  p: 1,
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  textAlign: 'center',
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                <Typography variant="caption">
                  💡 Swipe gestures: Left=Bold, Right=Italic, Up=Underline, Down=Highlight
                </Typography>
              </Box>
            )}
          </Paper>
        </Slide>
      </TouchGestureHandler>

      {/* Radial Menu */}
      <RadialMenu
        open={radialMenuOpen && activeMenu === 'radial'}
        onClose={closeMenus}
        position={menuPosition}
        items={formattingMenuItems}
        size={isSmallScreen ? 'small' : 'medium'}
        variant="formatting"
      />

      {/* Pencil Context Menu */}
      <PencilContextMenu
        open={pencilMenuOpen && activeMenu === 'pencil'}
        onClose={closeMenus}
        position={menuPosition}
        items={[...pencilFormattingItems, ...pencilBlockItems, ...pencilActionItems]}
        variant={variant}
      />
    </>
  );
};

export default IPadToolbar; 