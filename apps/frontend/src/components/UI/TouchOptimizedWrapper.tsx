import React, { ReactNode } from 'react';
import { Box, BoxProps } from '@mui/material';
import { useTouchMode } from '../../contexts/TouchModeContext';

interface TouchOptimizedWrapperProps extends Omit<BoxProps, 'component'> {
  children: ReactNode;
  touchTarget?: boolean;
  touchPadding?: boolean;
  touchScroll?: boolean;
  touchDrag?: boolean;
  className?: string;
}

export const TouchOptimizedWrapper: React.FC<TouchOptimizedWrapperProps> = ({
  children,
  touchTarget = false,
  touchPadding = false,
  touchScroll = false,
  touchDrag = false,
  className,
  sx,
  ...props
}) => {
  const { isTouchMode, touchHitboxSize, touchPadding: defaultTouchPadding } = useTouchMode();

  const getTouchStyles = () => {
    if (!isTouchMode) return {};

    const styles: any = {};

    if (touchTarget) {
      styles.minHeight = `${touchHitboxSize}px`;
      styles.minWidth = `${touchHitboxSize}px`;
      styles.display = 'flex';
      styles.alignItems = 'center';
      styles.justifyContent = 'center';
    }

    if (touchPadding) {
      styles.padding = `${defaultTouchPadding}px`;
    }

    if (touchScroll) {
      styles.overflowX = 'auto';
      styles.overflowY = 'auto';
      styles.WebkitOverflowScrolling = 'touch';
      styles.msOverflowStyle = 'none';
      styles.scrollbarWidth = 'none';
      styles['&::-webkit-scrollbar'] = {
        display: 'none',
      };
    }

    if (touchDrag) {
      styles.touchAction = 'pan-x pan-y';
      styles.userSelect = 'none';
      styles.WebkitUserSelect = 'none';
      styles.MozUserSelect = 'none';
      styles.msUserSelect = 'none';
    }

    return styles;
  };

  return (
    <Box
      className={className}
      sx={{
        ...getTouchStyles(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

// Specialized touch-optimized components
export const TouchButton: React.FC<TouchOptimizedWrapperProps> = (props) => (
  <TouchOptimizedWrapper
    touchTarget
    touchPadding
    component="button"
    sx={{
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      outline: 'none',
      '&:focus': {
        outline: '2px solid #1976d2',
        outlineOffset: '2px',
      },
      ...props.sx,
    }}
    {...props}
  />
);

export const TouchCard: React.FC<TouchOptimizedWrapperProps> = (props) => (
  <TouchOptimizedWrapper
    touchTarget
    touchPadding
    component="div"
    sx={{
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.2s ease-in-out',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      },
      ...props.sx,
    }}
    {...props}
  />
);

export const TouchScrollArea: React.FC<TouchOptimizedWrapperProps> = (props) => (
  <TouchOptimizedWrapper
    touchScroll
    component="div"
    sx={{
      width: '100%',
      height: '100%',
      ...props.sx,
    }}
    {...props}
  />
);

export const TouchDraggable: React.FC<TouchOptimizedWrapperProps> = (props) => (
  <TouchOptimizedWrapper
    touchDrag
    touchTarget
    component="div"
    sx={{
      cursor: 'grab',
      '&:active': {
        cursor: 'grabbing',
      },
      ...props.sx,
    }}
    {...props}
  />
); 