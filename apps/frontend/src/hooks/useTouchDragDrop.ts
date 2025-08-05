import { useCallback, useRef, useState, useEffect } from 'react';
import { useTouchMode } from '../contexts/TouchModeContext';

interface TouchDragDropOptions {
  onDragStart?: (event: TouchEvent) => void;
  onDragMove?: (event: TouchEvent, deltaX: number, deltaY: number) => void;
  onDragEnd?: (event: TouchEvent) => void;
  onDrop?: (event: TouchEvent, targetElement: Element) => void;
  dragThreshold?: number;
  preventDefault?: boolean;
}

interface TouchDragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
}

export const useTouchDragDrop = (options: TouchDragDropOptions = {}) => {
  const { isTouchMode, longPressDelay } = useTouchMode();
  const [dragState, setDragState] = useState<TouchDragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
  });
  
  const elementRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragThreshold = options.dragThreshold || 10;

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isTouchMode) return;
    
    if (options.preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    setDragState(prev => ({
      ...prev,
      startX: touch.clientX - rect.left,
      startY: touch.clientY - rect.top,
      currentX: touch.clientX - rect.left,
      currentY: touch.clientY - rect.top,
      deltaX: 0,
      deltaY: 0,
    }));

    // Start long press timer for drag initiation
    longPressTimerRef.current = setTimeout(() => {
      setDragState(prev => ({ ...prev, isDragging: true }));
      options.onDragStart?.(event);
    }, longPressDelay);
  }, [isTouchMode, options, longPressDelay]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isTouchMode || !dragState.isDragging) return;
    
    const touch = event.touches[0];
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    const deltaX = currentX - dragState.startX;
    const deltaY = currentY - dragState.startY;

    // Check if movement exceeds threshold
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > dragThreshold) {
      clearLongPressTimer();
      
      setDragState(prev => ({
        ...prev,
        currentX,
        currentY,
        deltaX,
        deltaY,
      }));

      options.onDragMove?.(event, deltaX, deltaY);
    }
  }, [isTouchMode, dragState, options, dragThreshold, clearLongPressTimer]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isTouchMode) return;
    
    clearLongPressTimer();

    if (dragState.isDragging) {
      // Find drop target
      const touch = event.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (elementBelow) {
        options.onDrop?.(event, elementBelow);
      }
      
      options.onDragEnd?.(event);
      
      setDragState(prev => ({ ...prev, isDragging: false }));
    }
  }, [isTouchMode, dragState, options, clearLongPressTimer]);

  const handleTouchCancel = useCallback(() => {
    if (!isTouchMode) return;
    
    clearLongPressTimer();
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, [isTouchMode, clearLongPressTimer]);

  const attachTouchListeners = useCallback((element: HTMLElement) => {
    elementRef.current = element;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: !options.preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      clearLongPressTimer();
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, options.preventDefault, clearLongPressTimer]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return {
    dragState,
    attachTouchListeners,
    isTouchMode,
  };
}; 