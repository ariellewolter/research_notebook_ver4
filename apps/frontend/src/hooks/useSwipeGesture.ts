import { useState, useCallback } from 'react';

interface SwipeGestureOptions {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    minSwipeDistance?: number;
    preventDefault?: boolean;
}

interface SwipeState {
    startX: number | null;
    startY: number | null;
    endX: number | null;
    endY: number | null;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}) => {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        minSwipeDistance = 50,
        preventDefault = true
    } = options;

    const [swipeState, setSwipeState] = useState<SwipeState>({
        startX: null,
        startY: null,
        endX: null,
        endY: null
    });

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (preventDefault) {
            e.preventDefault();
        }
        
        setSwipeState({
            startX: e.targetTouches[0].clientX,
            startY: e.targetTouches[0].clientY,
            endX: null,
            endY: null
        });
    }, [preventDefault]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (preventDefault) {
            e.preventDefault();
        }
        
        setSwipeState(prev => ({
            ...prev,
            endX: e.targetTouches[0].clientX,
            endY: e.targetTouches[0].clientY
        }));
    }, [preventDefault]);

    const handleTouchEnd = useCallback(() => {
        const { startX, startY, endX, endY } = swipeState;
        
        if (!startX || !startY || !endX || !endY) {
            setSwipeState({ startX: null, startY: null, endX: null, endY: null });
            return;
        }

        const deltaX = startX - endX;
        const deltaY = startY - endY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < minSwipeDistance) {
            setSwipeState({ startX: null, startY: null, endX: null, endY: null });
            return;
        }

        // Determine swipe direction
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
        
        if (isHorizontal) {
            if (deltaX > 0 && onSwipeLeft) {
                onSwipeLeft();
            } else if (deltaX < 0 && onSwipeRight) {
                onSwipeRight();
            }
        } else {
            if (deltaY > 0 && onSwipeUp) {
                onSwipeUp();
            } else if (deltaY < 0 && onSwipeDown) {
                onSwipeDown();
            }
        }

        setSwipeState({ startX: null, startY: null, endX: null, endY: null });
    }, [swipeState, minSwipeDistance, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        isSwiping: swipeState.startX !== null && swipeState.endX !== null
    };
}; 