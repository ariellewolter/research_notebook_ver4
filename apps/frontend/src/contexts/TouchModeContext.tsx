import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TouchModeContextType {
  isTouchMode: boolean;
  isAutoDetected: boolean;
  enableTouchMode: () => void;
  disableTouchMode: () => void;
  setAutoDetected: (detected: boolean) => void;
  touchHitboxSize: number;
  touchPadding: number;
  swipeThreshold: number;
  longPressDelay: number;
}

const TouchModeContext = createContext<TouchModeContextType | undefined>(undefined);

interface TouchModeProviderProps {
  children: ReactNode;
}

export const TouchModeProvider: React.FC<TouchModeProviderProps> = ({ children }) => {
  const [isTouchMode, setIsTouchMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('touch_mode_enabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);
  
  // Touch mode configuration
  const touchHitboxSize = isTouchMode ? 48 : 24; // Minimum touch target size
  const touchPadding = isTouchMode ? 16 : 8; // Padding for touch elements
  const swipeThreshold = isTouchMode ? 50 : 30; // Minimum swipe distance
  const longPressDelay = isTouchMode ? 500 : 300; // Long press delay in ms

  // Auto-detect touch devices
  useEffect(() => {
    const detectTouchDevice = () => {
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const isTouchDevice = hasTouchScreen || hasCoarsePointer || isMobile;
      
      if (isTouchDevice && !localStorage.getItem('touch_mode_override')) {
        setIsAutoDetected(true);
        setIsTouchMode(true);
        localStorage.setItem('touch_mode_enabled', 'true');
      }
    };

    detectTouchDevice();
    
    // Listen for changes in pointer capabilities
    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const handlePointerChange = (e: MediaQueryListEvent) => {
      if (e.matches && !localStorage.getItem('touch_mode_override')) {
        setIsAutoDetected(true);
        setIsTouchMode(true);
        localStorage.setItem('touch_mode_enabled', 'true');
      }
    };
    
    mediaQuery.addEventListener('change', handlePointerChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handlePointerChange);
    };
  }, []);

  // Save touch mode state to localStorage
  useEffect(() => {
    localStorage.setItem('touch_mode_enabled', JSON.stringify(isTouchMode));
    
    // Apply touch mode CSS class to body
    if (isTouchMode) {
      document.body.classList.add('touch-mode-enabled');
    } else {
      document.body.classList.remove('touch-mode-enabled');
    }
  }, [isTouchMode]);

  const enableTouchMode = () => {
    setIsTouchMode(true);
    localStorage.setItem('touch_mode_override', 'true');
  };

  const disableTouchMode = () => {
    setIsTouchMode(false);
    localStorage.setItem('touch_mode_override', 'true');
  };

  const setAutoDetected = (detected: boolean) => {
    setIsAutoDetected(detected);
  };

  const value: TouchModeContextType = {
    isTouchMode,
    isAutoDetected,
    enableTouchMode,
    disableTouchMode,
    setAutoDetected,
    touchHitboxSize,
    touchPadding,
    swipeThreshold,
    longPressDelay,
  };

  return (
    <TouchModeContext.Provider value={value}>
      {children}
    </TouchModeContext.Provider>
  );
};

export const useTouchMode = (): TouchModeContextType => {
  const context = useContext(TouchModeContext);
  if (context === undefined) {
    throw new Error('useTouchMode must be used within a TouchModeProvider');
  }
  return context;
}; 