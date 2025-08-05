import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
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
  MoreVert as MoreIcon
} from '@mui/icons-material';

interface RadialMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
  color?: string;
  disabled?: boolean;
}

interface RadialMenuProps {
  open: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  items: RadialMenuItem[];
  size?: 'small' | 'medium' | 'large';
  variant?: 'formatting' | 'actions' | 'blocks';
}

const RadialMenu: React.FC<RadialMenuProps> = ({
  open,
  onClose,
  position,
  items,
  size = 'medium',
  variant = 'formatting'
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Size configurations
  const sizeConfig = {
    small: { radius: 80, itemSize: 32, iconSize: 16 },
    medium: { radius: 120, itemSize: 40, iconSize: 20 },
    large: { radius: 160, itemSize: 48, iconSize: 24 }
  };

  const config = sizeConfig[size];

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

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open, onClose]);

  const handleItemClick = (item: RadialMenuItem, index: number) => {
    if (!item.disabled) {
      item.action();
      onClose();
    }
  };

  const handleItemHover = (index: number) => {
    setSelectedIndex(index);
  };

  const calculateItemPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const x = Math.cos(angle) * config.radius;
    const y = Math.sin(angle) * config.radius;
    return { x, y };
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
          pointerEvents: 'none'
        }}
      >
        <Fade in={open} timeout={200}>
          <Paper
            elevation={8}
            sx={{
              borderRadius: '50%',
              width: config.radius * 2,
              height: config.radius * 2,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {/* Center button */}
            <Box
              sx={{
                position: 'absolute',
                width: config.itemSize,
                height: config.itemSize,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'scale(1.1)'
                }
              }}
              onClick={onClose}
            >
              <MoreIcon sx={{ fontSize: config.iconSize }} />
            </Box>

            {/* Menu items */}
            {items.map((item, index) => {
              const pos = calculateItemPosition(index, items.length);
              const isSelected = selectedIndex === index;

              return (
                <Zoom
                  key={item.id}
                  in={open}
                  timeout={200 + index * 50}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`
                  }}
                >
                  <Tooltip
                    title={item.label}
                    placement="top"
                    arrow
                    open={isSelected}
                  >
                    <IconButton
                      sx={{
                        width: config.itemSize,
                        height: config.itemSize,
                        backgroundColor: isSelected 
                          ? 'primary.light' 
                          : item.disabled 
                            ? 'grey.200' 
                            : 'white',
                        color: item.disabled 
                          ? 'grey.400' 
                          : item.color || 'text.primary',
                        border: '2px solid',
                        borderColor: isSelected 
                          ? 'primary.main' 
                          : 'grey.300',
                        boxShadow: isSelected 
                          ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s ease',
                        pointerEvents: 'auto',
                        '&:hover': {
                          backgroundColor: item.disabled 
                            ? 'grey.200' 
                            : 'primary.light',
                          transform: 'scale(1.1)',
                          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        }
                      }}
                      onClick={() => handleItemClick(item, index)}
                      onMouseEnter={() => handleItemHover(index)}
                      onMouseLeave={() => setSelectedIndex(null)}
                      disabled={item.disabled}
                    >
                      {React.cloneElement(item.icon as React.ReactElement, {
                        sx: { fontSize: config.iconSize }
                      })}
                    </IconButton>
                  </Tooltip>
                </Zoom>
              );
            })}
          </Paper>
        </Fade>
      </Box>
    </>
  );
};

// Predefined menu configurations
export const formattingMenuItems: RadialMenuItem[] = [
  {
    id: 'bold',
    icon: <BoldIcon />,
    label: 'Bold',
    action: () => console.log('Bold'),
    color: '#000'
  },
  {
    id: 'italic',
    icon: <ItalicIcon />,
    label: 'Italic',
    action: () => console.log('Italic'),
    color: '#666'
  },
  {
    id: 'underline',
    icon: <UnderlineIcon />,
    label: 'Underline',
    action: () => console.log('Underline'),
    color: '#666'
  },
  {
    id: 'strikethrough',
    icon: <StrikethroughIcon />,
    label: 'Strikethrough',
    action: () => console.log('Strikethrough'),
    color: '#666'
  },
  {
    id: 'highlight',
    icon: <HighlightIcon />,
    label: 'Highlight',
    action: () => console.log('Highlight'),
    color: '#ffeb3b'
  },
  {
    id: 'code',
    icon: <CodeIcon />,
    label: 'Code',
    action: () => console.log('Code'),
    color: '#666'
  },
  {
    id: 'link',
    icon: <LinkIcon />,
    label: 'Link',
    action: () => console.log('Link'),
    color: '#1976d2'
  },
  {
    id: 'color',
    icon: <ColorIcon />,
    label: 'Text Color',
    action: () => console.log('Text Color'),
    color: '#666'
  }
];

export const blockMenuItems: RadialMenuItem[] = [
  {
    id: 'text',
    icon: <AddIcon />,
    label: 'Text Block',
    action: () => console.log('Add Text Block')
  },
  {
    id: 'heading',
    icon: <SizeIcon />,
    label: 'Heading',
    action: () => console.log('Add Heading')
  },
  {
    id: 'bullet-list',
    icon: <BulletListIcon />,
    label: 'Bullet List',
    action: () => console.log('Add Bullet List')
  },
  {
    id: 'numbered-list',
    icon: <NumberedListIcon />,
    label: 'Numbered List',
    action: () => console.log('Add Numbered List')
  },
  {
    id: 'quote',
    icon: <QuoteIcon />,
    label: 'Quote',
    action: () => console.log('Add Quote')
  },
  {
    id: 'table',
    icon: <TableIcon />,
    label: 'Table',
    action: () => console.log('Add Table')
  },
  {
    id: 'image',
    icon: <ImageIcon />,
    label: 'Image',
    action: () => console.log('Add Image')
  },
  {
    id: 'math',
    icon: <MathIcon />,
    label: 'Math',
    action: () => console.log('Add Math')
  }
];

export const actionMenuItems: RadialMenuItem[] = [
  {
    id: 'copy',
    icon: <CopyIcon />,
    label: 'Copy',
    action: () => console.log('Copy')
  },
  {
    id: 'delete',
    icon: <DeleteIcon />,
    label: 'Delete',
    action: () => console.log('Delete'),
    color: '#f44336'
  },
  {
    id: 'duplicate',
    icon: <CopyIcon />,
    label: 'Duplicate',
    action: () => console.log('Duplicate')
  }
];

export default RadialMenu; 