import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  Fade,
  Zoom,
  Backdrop
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
  Palette as PaletteIcon,
  TextFields as TextIcon
} from '@mui/icons-material';

interface PencilMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
  color?: string;
  disabled?: boolean;
  category?: 'formatting' | 'blocks' | 'actions';
}

interface PencilContextMenuProps {
  open: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  items: PencilMenuItem[];
  variant?: 'compact' | 'expanded';
}

const PencilContextMenu: React.FC<PencilContextMenuProps> = ({
  open,
  onClose,
  position,
  items,
  variant = 'compact'
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('formatting');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setSelectedIndex(null);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const handleItemClick = (item: PencilMenuItem, index: number) => {
    if (!item.disabled) {
      item.action();
      onClose();
    }
  };

  const handleItemHover = (index: number) => {
    setSelectedIndex(index);
  };

  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'formatting';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, PencilMenuItem[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'formatting':
        return <TextIcon />;
      case 'blocks':
        return <AddIcon />;
      case 'actions':
        return <EditIcon />;
      default:
        return <MoreIcon />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'formatting':
        return 'Formatting';
      case 'blocks':
        return 'Blocks';
      case 'actions':
        return 'Actions';
      default:
        return 'More';
    }
  };

  if (!open) return null;

  return (
    <>
      <Backdrop
        open={open}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          zIndex: 1300
        }}
        onClick={onClose}
      />
      
      <Box
        ref={menuRef}
        sx={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 1400,
          pointerEvents: 'auto'
        }}
      >
        <Fade in={open} timeout={200}>
          <Paper
            elevation={12}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: variant === 'compact' ? '12px' : '16px',
              overflow: 'hidden',
              minWidth: variant === 'compact' ? 200 : 280,
              maxWidth: variant === 'compact' ? 250 : 350
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 1.5,
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <EditIcon sx={{ fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
            </Box>

            {/* Category Tabs */}
            {variant === 'expanded' && Object.keys(groupedItems).length > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: 'grey.50'
                }}
              >
                {Object.keys(groupedItems).map((category) => (
                  <Box
                    key={category}
                    sx={{
                      flex: 1,
                      p: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: activeCategory === category ? 'white' : 'transparent',
                      borderBottom: activeCategory === category ? '2px solid' : 'none',
                      borderColor: 'primary.main',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: activeCategory === category ? 'white' : 'rgba(0, 0, 0, 0.05)'
                      }
                    }}
                    onClick={() => setActiveCategory(category)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      {getCategoryIcon(category)}
                      <Typography variant="caption" sx={{ fontWeight: activeCategory === category ? 600 : 400 }}>
                        {getCategoryLabel(category)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Menu Items */}
            <Box sx={{ p: 1 }}>
              {(variant === 'expanded' ? groupedItems[activeCategory] || [] : items).map((item, index) => {
                const isSelected = selectedIndex === index;

                return (
                  <Zoom
                    key={item.id}
                    in={open}
                    timeout={100 + index * 50}
                  >
                    <Tooltip
                      title={item.label}
                      placement="right"
                      arrow
                      open={isSelected}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          borderRadius: '8px',
                          cursor: item.disabled ? 'not-allowed' : 'pointer',
                          backgroundColor: isSelected ? 'primary.light' : 'transparent',
                          color: item.disabled ? 'grey.400' : item.color || 'text.primary',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: item.disabled ? 'transparent' : 'primary.light',
                            transform: 'translateX(4px)'
                          },
                          '&:active': {
                            transform: 'scale(0.98)'
                          }
                        }}
                        onClick={() => handleItemClick(item, index)}
                        onMouseEnter={() => handleItemHover(index)}
                        onMouseLeave={() => setSelectedIndex(null)}
                      >
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '6px',
                            backgroundColor: item.disabled ? 'grey.200' : 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: item.disabled ? 0.5 : 1
                          }}
                        >
                          {React.cloneElement(item.icon as React.ReactElement, {
                            sx: { fontSize: 16 }
                          })}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 600 : 400,
                            flex: 1
                          }}
                        >
                          {item.label}
                        </Typography>
                        {isSelected && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: 'primary.main'
                            }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  </Zoom>
                );
              })}
            </Box>

            {/* Footer */}
            <Box
              sx={{
                p: 1,
                backgroundColor: 'grey.50',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Press and hold with Apple Pencil for more options
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Box>
    </>
  );
};

// Predefined menu configurations
export const pencilFormattingItems: PencilMenuItem[] = [
  {
    id: 'bold',
    icon: <BoldIcon />,
    label: 'Bold',
    action: () => console.log('Bold'),
    category: 'formatting'
  },
  {
    id: 'italic',
    icon: <ItalicIcon />,
    label: 'Italic',
    action: () => console.log('Italic'),
    category: 'formatting'
  },
  {
    id: 'underline',
    icon: <UnderlineIcon />,
    label: 'Underline',
    action: () => console.log('Underline'),
    category: 'formatting'
  },
  {
    id: 'highlight',
    icon: <HighlightIcon />,
    label: 'Highlight',
    action: () => console.log('Highlight'),
    category: 'formatting'
  },
  {
    id: 'color',
    icon: <ColorIcon />,
    label: 'Text Color',
    action: () => console.log('Text Color'),
    category: 'formatting'
  }
];

export const pencilBlockItems: PencilMenuItem[] = [
  {
    id: 'text',
    icon: <TextIcon />,
    label: 'Text Block',
    action: () => console.log('Add Text Block'),
    category: 'blocks'
  },
  {
    id: 'heading',
    icon: <SizeIcon />,
    label: 'Heading',
    action: () => console.log('Add Heading'),
    category: 'blocks'
  },
  {
    id: 'bullet-list',
    icon: <BulletListIcon />,
    label: 'Bullet List',
    action: () => console.log('Add Bullet List'),
    category: 'blocks'
  },
  {
    id: 'quote',
    icon: <QuoteIcon />,
    label: 'Quote',
    action: () => console.log('Add Quote'),
    category: 'blocks'
  },
  {
    id: 'image',
    icon: <ImageIcon />,
    label: 'Image',
    action: () => console.log('Add Image'),
    category: 'blocks'
  }
];

export const pencilActionItems: PencilMenuItem[] = [
  {
    id: 'copy',
    icon: <CopyIcon />,
    label: 'Copy',
    action: () => console.log('Copy'),
    category: 'actions'
  },
  {
    id: 'delete',
    icon: <DeleteIcon />,
    label: 'Delete',
    action: () => console.log('Delete'),
    category: 'actions'
  },
  {
    id: 'duplicate',
    icon: <CopyIcon />,
    label: 'Duplicate',
    action: () => console.log('Duplicate'),
    category: 'actions'
  }
];

export default PencilContextMenu; 