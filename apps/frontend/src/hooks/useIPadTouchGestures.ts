import { useState, useCallback, useRef, useEffect } from 'react';
import { useIPadDetection } from './useIPadDetection';

interface TouchPoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
  pointerId: number;
  tiltX?: number;
  tiltY?: number;
}

interface GestureState {
  isActive: boolean;
  startPoint: TouchPoint | null;
  currentPoint: TouchPoint | null;
  points: TouchPoint[];
  duration: number;
  distance: number;
  velocity: number;
  pressure: number;
  isPencil: boolean;
}

interface GestureConfig {
  minSwipeDistance: number;
  maxSwipeTime: number;
  longPressDelay: number;
  pressureThreshold: number;
  velocityThreshold: number;
}

interface GestureCallbacks {
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', distance: number, velocity: number) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onRotate?: (angle: number, center: { x: number; y: number }) => void;
  onLongPress?: (point: TouchPoint) => void;
  onTap?: (point: TouchPoint) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onPencilHover?: (point: TouchPoint) => void;
  onPressureChange?: (pressure: number) => void;
}

export const useIPadTouchGestures = (
  callbacks: GestureCallbacks = {},
  config: Partial<GestureConfig> = {}
) => {
  const {
    isIPad,
    isApplePencil,
    hasPressureSupport,
    hasTiltSupport
  } = useIPadDetection();

  const defaultConfig: GestureConfig = {
    minSwipeDistance: isIPad ? 30 : 50,
    maxSwipeTime: 500,
    longPressDelay: isIPad ? 400 : 500,
    pressureThreshold: 0.1,
    velocityThreshold: 0.5
  };

  const gestureConfig = { ...defaultConfig, ...config };

  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    points: [],
    duration: 0,
    distance: 0,
    velocity: 0,
    pressure: 0,
    isPencil: false
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPointRef = useRef<TouchPoint | null>(null);

  // Convert pointer event to TouchPoint
  const createTouchPoint = useCallback((event: PointerEvent): TouchPoint => {
    return {
      x: event.clientX,
      y: event.clientY,
      pressure: event.pressure || 0,
      timestamp: Date.now(),
      pointerId: event.pointerId,
      tiltX: (event as any).tiltX,
      tiltY: (event as any).tiltY
    };
  }, []);

  // Calculate distance between two points
  const calculateDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate velocity
  const calculateVelocity = useCallback((distance: number, duration: number): number => {
    return duration > 0 ? distance / duration : 0;
  }, []);

  // Determine swipe direction
  const getSwipeDirection = useCallback((start: TouchPoint, end: TouchPoint): 'left' | 'right' | 'up' | 'down' => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }, []);

  // Handle pointer down
  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (event.button !== 0) return; // Only handle primary button

    const point = createTouchPoint(event);
    const isPencil = event.pointerType === 'pen' || isApplePencil;

    setGestureState(prev => ({
      ...prev,
      isActive: true,
      startPoint: point,
      currentPoint: point,
      points: [point],
      duration: 0,
      distance: 0,
      velocity: 0,
      pressure: point.pressure,
      isPencil
    }));

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      callbacks.onLongPress?.(point);
    }, gestureConfig.longPressDelay);

    // Handle pencil hover
    if (isPencil && hasTiltSupport) {
      callbacks.onPencilHover?.(point);
    }
  }, [createTouchPoint, isApplePencil, hasTiltSupport, callbacks, gestureConfig.longPressDelay]);

  // Handle pointer move
  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!gestureState.isActive) return;

    const point = createTouchPoint(event);
    const startPoint = gestureState.startPoint;

    if (!startPoint) return;

    const distance = calculateDistance(startPoint, point);
    const duration = point.timestamp - startPoint.timestamp;
    const velocity = calculateVelocity(distance, duration);

    setGestureState(prev => ({
      ...prev,
      currentPoint: point,
      points: [...prev.points, point],
      distance,
      duration,
      velocity,
      pressure: point.pressure
    }));

    // Cancel long press if moved too much
    if (distance > gestureConfig.minSwipeDistance && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Handle pressure changes
    if (hasPressureSupport && Math.abs(point.pressure - gestureState.pressure) > gestureConfig.pressureThreshold) {
      callbacks.onPressureChange?.(point.pressure);
    }

    // Handle pencil hover
    if (gestureState.isPencil && hasTiltSupport) {
      callbacks.onPencilHover?.(point);
    }
  }, [gestureState, createTouchPoint, calculateDistance, calculateVelocity, hasPressureSupport, hasTiltSupport, callbacks, gestureConfig]);

  // Handle pointer up
  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!gestureState.isActive) return;

    const point = createTouchPoint(event);
    const startPoint = gestureState.startPoint;

    if (!startPoint) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const distance = calculateDistance(startPoint, point);
    const duration = point.timestamp - startPoint.timestamp;
    const velocity = calculateVelocity(distance, duration);

    // Determine gesture type
    if (distance > gestureConfig.minSwipeDistance && duration < gestureConfig.maxSwipeTime) {
      // Swipe gesture
      const direction = getSwipeDirection(startPoint, point);
      callbacks.onSwipe?.(direction, distance, velocity);
    } else if (distance < gestureConfig.minSwipeDistance && duration < gestureConfig.longPressDelay) {
      // Tap gesture
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;
      const lastTapPoint = lastTapPointRef.current;

      if (lastTapPoint && timeSinceLastTap < 300) {
        const tapDistance = calculateDistance(lastTapPoint, point);
        if (tapDistance < 50) {
          // Double tap
          callbacks.onDoubleTap?.(point);
          lastTapTimeRef.current = 0;
          lastTapPointRef.current = null;
        } else {
          // Single tap
          callbacks.onTap?.(point);
          lastTapTimeRef.current = now;
          lastTapPointRef.current = point;
        }
      } else {
        // Single tap
        callbacks.onTap?.(point);
        lastTapTimeRef.current = now;
        lastTapPointRef.current = point;
      }
    }

    // Reset gesture state
    setGestureState(prev => ({
      ...prev,
      isActive: false,
      startPoint: null,
      currentPoint: null,
      points: [],
      duration: 0,
      distance: 0,
      velocity: 0,
      pressure: 0,
      isPencil: false
    }));
  }, [gestureState, createTouchPoint, calculateDistance, calculateVelocity, getSwipeDirection, callbacks, gestureConfig]);

  // Handle pointer cancel
  const handlePointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    setGestureState(prev => ({
      ...prev,
      isActive: false,
      startPoint: null,
      currentPoint: null,
      points: [],
      duration: 0,
      distance: 0,
      velocity: 0,
      pressure: 0,
      isPencil: false
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    const element = document;

    element.addEventListener('pointerdown', handlePointerDown, { passive: false });
    element.addEventListener('pointermove', handlePointerMove, { passive: false });
    element.addEventListener('pointerup', handlePointerUp, { passive: false });
    element.addEventListener('pointercancel', handlePointerCancel, { passive: false });

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerCancel);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel]);

  return {
    gestureState,
    isIPad,
    isApplePencil,
    hasPressureSupport,
    hasTiltSupport
  };
}; 