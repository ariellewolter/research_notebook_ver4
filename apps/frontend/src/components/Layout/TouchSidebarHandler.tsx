import React, { useEffect } from 'react';
import { useTouchGestures } from '../../hooks/useTouchGestures';

interface TouchSidebarHandlerProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const TouchSidebarHandler: React.FC<TouchSidebarHandlerProps> = ({
  onToggleSidebar,
  sidebarOpen,
}) => {
  const { isTouchMode } = useTouchGestures({
    onSwipeRight: () => {
      if (!sidebarOpen) {
        onToggleSidebar();
      }
    },
    onSwipeLeft: () => {
      if (sidebarOpen) {
        onToggleSidebar();
      }
    },
  });

  // Add touch-specific styles to body when in touch mode
  useEffect(() => {
    if (isTouchMode) {
      document.body.style.touchAction = 'pan-x pan-y';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.touchAction = '';
        document.body.style.overflow = '';
      };
    }
  }, [isTouchMode]);

  return null; // This component doesn't render anything visible
}; 