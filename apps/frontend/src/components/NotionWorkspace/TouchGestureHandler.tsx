import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface GestureConfig {
  minSwipeDistance: number;
  maxSwipeTime: number;
  longPressDelay: number;
  doubleTapDelay: number;
}

interface TouchGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onTap?: () => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
  onPinchChange?: (scale: number) => void;
  config?: Partial<GestureConfig>;
  disabled?: boolean;
  className?: string;
}

const TouchGestureHandler: React.FC<TouchGestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onDoubleTap,
  onTap,
  onPinchStart,
  onPinchEnd,
  onPinchChange,
  config = {},
  disabled = false,
  className = ''
}) => {
  const [touchPoints, setTouchPoints] = useState<TouchPoint[]>([]);
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);

  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const defaultConfig: GestureConfig = {
    minSwipeDistance: 50,
    maxSwipeTime: 300,
    longPressDelay: 500,
    doubleTapDelay: 300
  };

  const gestureConfig = { ...defaultConfig, ...config };

  const getDistance = (point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const detectSwipe = useCallback((startPoint: TouchPoint, endPoint: TouchPoint) => {
    const distance = getDistance(startPoint, endPoint);
    const time = endPoint.timestamp - startPoint.timestamp;
    const angle = getAngle(startPoint, endPoint);

    if (distance >= gestureConfig.minSwipeDistance && time <= gestureConfig.maxSwipeTime) {
      // Determine swipe direction based on angle
      if (angle >= -45 && angle <= 45) {
        onSwipeRight?.();
      } else if (angle >= 135 || angle <= -135) {
        onSwipeLeft?.();
      } else if (angle >= 45 && angle <= 135) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }
  }, [gestureConfig, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    event.preventDefault();
    const touches = Array.from(event.touches);
    const points: TouchPoint[] = touches.map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    setTouchPoints(points);

    // Start long press timer for single touch
    if (points.length === 1) {
      longPressTimeoutRef.current = setTimeout(() => {
        setIsLongPressActive(true);
        onLongPress?.();
      }, gestureConfig.longPressDelay);
    }

    // Handle pinch start
    if (points.length === 2) {
      const distance = getDistance(points[0], points[1]);
      setInitialPinchDistance(distance);
      setPinchDistance(distance);
      onPinchStart?.();
    }
  }, [disabled, gestureConfig.longPressDelay, onLongPress, onPinchStart]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    event.preventDefault();
    const touches = Array.from(event.touches);
    const points: TouchPoint[] = touches.map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));

    setTouchPoints(points);

    // Handle pinch gesture
    if (points.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getDistance(points[0], points[1]);
      const scale = currentDistance / initialPinchDistance;
      setPinchDistance(currentDistance);
      onPinchChange?.(scale);
    }
  }, [disabled, initialPinchDistance, onPinchChange]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled) return;

    event.preventDefault();

    // Clear long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    // Handle swipe detection
    if (touchPoints.length === 1) {
      const endPoint: TouchPoint = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
        timestamp: Date.now()
      };

      detectSwipe(touchPoints[0], endPoint);

      // Handle tap and double tap
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - lastTapTime;

      if (timeSinceLastTap < gestureConfig.doubleTapDelay) {
        onDoubleTap?.();
        setLastTapTime(0);
      } else {
        setLastTapTime(currentTime);
        if (!isLongPressActive) {
          onTap?.();
        }
      }
    }

    // Handle pinch end
    if (touchPoints.length === 2) {
      onPinchEnd?.();
      setInitialPinchDistance(null);
      setPinchDistance(null);
    }

    // Reset states
    setTouchPoints([]);
    setIsLongPressActive(false);
  }, [
    disabled,
    touchPoints,
    detectSwipe,
    lastTapTime,
    gestureConfig.doubleTapDelay,
    onDoubleTap,
    onTap,
    isLongPressActive,
    onPinchEnd
  ]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    setTouchPoints([]);
    setIsLongPressActive(false);
    setInitialPinchDistance(null);
    setPinchDistance(null);
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        touchAction: 'none', // Prevent default touch behaviors
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {children}
    </div>
  );
};

// Gesture detection utilities
export const detectGesture = (points: TouchPoint[], config: GestureConfig) => {
  if (points.length < 2) return null;

  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const distance = Math.sqrt(
    Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
  );
  const time = endPoint.timestamp - startPoint.timestamp;

  if (distance >= config.minSwipeDistance && time <= config.maxSwipeTime) {
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180 / Math.PI;
    
    if (angle >= -45 && angle <= 45) return 'swipe-right';
    if (angle >= 135 || angle <= -135) return 'swipe-left';
    if (angle >= 45 && angle <= 135) return 'swipe-down';
    return 'swipe-up';
  }

  return null;
};

// Predefined gesture configurations
export const gestureConfigs = {
  sensitive: {
    minSwipeDistance: 30,
    maxSwipeTime: 200,
    longPressDelay: 300,
    doubleTapDelay: 200
  },
  normal: {
    minSwipeDistance: 50,
    maxSwipeTime: 300,
    longPressDelay: 500,
    doubleTapDelay: 300
  },
  relaxed: {
    minSwipeDistance: 80,
    maxSwipeTime: 500,
    longPressDelay: 800,
    doubleTapDelay: 400
  }
};

export default TouchGestureHandler; 