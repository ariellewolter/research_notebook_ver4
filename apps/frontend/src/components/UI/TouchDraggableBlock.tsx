import React, { useRef, useEffect, useState } from 'react';
import { Box, BoxProps } from '@mui/material';
import { useTouchDragDrop } from '../../hooks/useTouchDragDrop';
import { useTouchMode } from '../../contexts/TouchModeContext';
import { TouchOptimizedWrapper } from './TouchOptimizedWrapper';

interface TouchDraggableBlockProps extends Omit<BoxProps, 'component'> {
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragMove?: (deltaX: number, deltaY: number) => void;
  onDragEnd?: () => void;
  onDrop?: (targetElement: Element) => void;
  dragData?: any;
  className?: string;
  sx?: any;
}

export const TouchDraggableBlock: React.FC<TouchDraggableBlockProps> = ({
  children,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDrop,
  dragData,
  className,
  sx,
  ...props
}) => {
  const { isTouchMode } = useTouchMode();
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { dragState, attachTouchListeners } = useTouchDragDrop({
    onDragStart: () => {
      setIsDragging(true);
      onDragStart?.();
    },
    onDragMove: (event, deltaX, deltaY) => {
      setDragOffset({ x: deltaX, y: deltaY });
      onDragMove?.(deltaX, deltaY);
    },
    onDragEnd: () => {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      onDragEnd?.();
    },
    onDrop: (event, targetElement) => {
      onDrop?.(targetElement);
    },
    dragThreshold: 15,
  });

  useEffect(() => {
    if (elementRef.current && isTouchMode) {
      return attachTouchListeners(elementRef.current);
    }
  }, [attachTouchListeners, isTouchMode]);

  const getDragStyles = () => {
    if (!isDragging) return {};

    return {
      position: 'fixed' as const,
      zIndex: 1000,
      pointerEvents: 'none',
      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
      opacity: 0.8,
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
      borderRadius: '8px',
      backgroundColor: 'white',
      border: '2px solid #1976d2',
    };
  };

  return (
    <>
      <TouchOptimizedWrapper
        ref={elementRef}
        touchDrag
        touchTarget
        className={className}
        sx={{
          cursor: isTouchMode ? 'grab' : 'pointer',
          '&:active': {
            cursor: isTouchMode ? 'grabbing' : 'pointer',
          },
          transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          },
          ...sx,
        }}
        {...props}
      >
        {children}
      </TouchOptimizedWrapper>
      
      {/* Drag preview */}
      {isDragging && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            pointerEvents: 'none',
            ...getDragStyles(),
          }}
        >
          {children}
        </Box>
      )}
    </>
  );
};

// Specialized draggable components
export const TouchDraggableCard: React.FC<TouchDraggableBlockProps> = (props) => (
  <TouchDraggableBlock
    sx={{
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      padding: '16px',
      margin: '8px 0',
      ...props.sx,
    }}
    {...props}
  />
);

export const TouchDraggableItem: React.FC<TouchDraggableBlockProps> = (props) => (
  <TouchDraggableBlock
    sx={{
      borderRadius: '4px',
      border: '1px solid #e0e0e0',
      backgroundColor: '#fafafa',
      padding: '12px',
      margin: '4px 0',
      ...props.sx,
    }}
    {...props}
  />
); 