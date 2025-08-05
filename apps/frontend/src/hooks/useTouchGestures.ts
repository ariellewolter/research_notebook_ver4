import { useCallback, useRef, useEffect } from 'react';
import { useTouchMode } from '../contexts/TouchModeContext';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  preventDefault?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const { isTouchMode, swipeThreshold, longPressDelay } = useTouchMode();
  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);

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
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    // Start long press timer
    if (options.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        options.onLongPress?.();
      }, longPressDelay);
    }
  }, [isTouchMode, options, longPressDelay]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isTouchMode) return;
    
    // Clear long press timer if user moves finger
    clearLongPressTimer();
  }, [isTouchMode, clearLongPressTimer]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isTouchMode) return;
    
    clearLongPressTimer();

    const touch = event.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    if (touchStartRef.current && touchEndRef.current) {
      const start = touchStartRef.current;
      const end = touchEndRef.current;
      
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const deltaTime = end.timestamp - start.timestamp;

      // Check if it's a tap (minimal movement)
      const isTap = Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300;

      if (isTap) {
        const now = Date.now();
        if (now - lastTapTimeRef.current < 300) {
          // Double tap
          tapCountRef.current = 0;
          lastTapTimeRef.current = 0;
          options.onDoubleTap?.();
        } else {
          // Single tap
          tapCountRef.current = 1;
          lastTapTimeRef.current = now;
          setTimeout(() => {
            if (tapCountRef.current === 1) {
              options.onTap?.();
            }
          }, 300);
        }
      } else {
        // Check for swipe gestures
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
        
        if (isHorizontalSwipe && Math.abs(deltaX) > swipeThreshold) {
          if (deltaX > 0) {
            options.onSwipeRight?.();
          } else {
            options.onSwipeLeft?.();
          }
        } else if (isVerticalSwipe && Math.abs(deltaY) > swipeThreshold) {
          if (deltaY > 0) {
            options.onSwipeDown?.();
          } else {
            options.onSwipeUp?.();
          }
        }
      }
    }

    // Reset touch points
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [isTouchMode, options, swipeThreshold, clearLongPressTimer]);

  const handleTouchCancel = useCallback(() => {
    if (!isTouchMode) return;
    
    clearLongPressTimer();
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [isTouchMode, clearLongPressTimer]);

  useEffect(() => {
    if (!isTouchMode) return;

    const element = document.body; // Apply to body for global gestures

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
  }, [isTouchMode, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, options.preventDefault, clearLongPressTimer]);

  return {
    isTouchMode,
  };
}; 