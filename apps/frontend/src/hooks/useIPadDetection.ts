import { useState, useEffect, useCallback } from 'react';

interface IPadDetectionState {
  isIPad: boolean;
  isApplePencil: boolean;
  isTouchDevice: boolean;
  hasPressureSupport: boolean;
  hasTiltSupport: boolean;
  devicePixelRatio: number;
  screenSize: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  touchCapabilities: {
    maxTouchPoints: number;
    hasCoarsePointer: boolean;
    hasFinePointer: boolean;
  };
}

interface UseIPadDetectionOptions {
  enablePencilDetection?: boolean;
  enablePressureDetection?: boolean;
  enableTiltDetection?: boolean;
  updateInterval?: number;
}

export const useIPadDetection = (options: UseIPadDetectionOptions = {}): IPadDetectionState => {
  const {
    enablePencilDetection = true,
    enablePressureDetection = true,
    enableTiltDetection = true,
    updateInterval = 1000
  } = options;

  const [state, setState] = useState<IPadDetectionState>({
    isIPad: false,
    isApplePencil: false,
    isTouchDevice: false,
    hasPressureSupport: false,
    hasTiltSupport: false,
    devicePixelRatio: 1,
    screenSize: {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    },
    touchCapabilities: {
      maxTouchPoints: navigator.maxTouchPoints || 0,
      hasCoarsePointer: window.matchMedia('(pointer: coarse)').matches,
      hasFinePointer: window.matchMedia('(pointer: fine)').matches
    }
  });

  // Detect iPad and device capabilities
  const detectDevice = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPad = /ipad/.test(userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    
    const screenSize = {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    };

    setState(prev => ({
      ...prev,
      isIPad,
      isTouchDevice,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenSize,
      touchCapabilities: {
        maxTouchPoints: navigator.maxTouchPoints || 0,
        hasCoarsePointer,
        hasFinePointer
      }
    }));
  }, []);

  // Detect Apple Pencil and pressure/tilt support
  const detectPencilCapabilities = useCallback(() => {
    if (!enablePencilDetection) return;

    let isApplePencil = false;
    let hasPressureSupport = false;
    let hasTiltSupport = false;

    // Test for pressure and tilt support
    const testPointerCapabilities = (event: PointerEvent) => {
      if (event.pressure !== undefined && event.pressure !== 0.5) {
        hasPressureSupport = true;
      }
      
      if ((event as any).tiltX !== undefined || (event as any).tiltY !== undefined) {
        hasTiltSupport = true;
      }

      // Apple Pencil detection based on pressure patterns and device
      if (state.isIPad && hasPressureSupport && event.pointerType === 'pen') {
        isApplePencil = true;
      }
    };

    // Create a test element to detect capabilities
    const testElement = document.createElement('div');
    testElement.style.position = 'absolute';
    testElement.style.top = '-100px';
    testElement.style.left = '-100px';
    testElement.style.width = '1px';
    testElement.style.height = '1px';
    testElement.style.pointerEvents = 'auto';
    document.body.appendChild(testElement);

    const handlePointerTest = (event: PointerEvent) => {
      testPointerCapabilities(event);
      testElement.removeEventListener('pointerdown', handlePointerTest);
      testElement.removeEventListener('pointermove', handlePointerTest);
      document.body.removeChild(testElement);
    };

    testElement.addEventListener('pointerdown', handlePointerTest);
    testElement.addEventListener('pointermove', handlePointerTest);

    // Update state with detected capabilities
    setState(prev => ({
      ...prev,
      isApplePencil,
      hasPressureSupport,
      hasTiltSupport
    }));
  }, [enablePencilDetection, state.isIPad]);

  // Initialize detection
  useEffect(() => {
    detectDevice();
    detectPencilCapabilities();

    // Set up event listeners for dynamic updates
    const handleResize = () => {
      detectDevice();
    };

    const handleOrientationChange = () => {
      setTimeout(detectDevice, 100); // Delay to ensure orientation change is complete
    };

    const handlePointerCapabilityChange = () => {
      detectPencilCapabilities();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    if (enablePencilDetection) {
      document.addEventListener('pointerdown', handlePointerCapabilityChange);
      document.addEventListener('pointermove', handlePointerCapabilityChange);
    }

    // Periodic detection updates
    const interval = setInterval(() => {
      detectDevice();
      if (enablePencilDetection) {
        detectPencilCapabilities();
      }
    }, updateInterval);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('pointerdown', handlePointerCapabilityChange);
      document.removeEventListener('pointermove', handlePointerCapabilityChange);
      clearInterval(interval);
    };
  }, [detectDevice, detectPencilCapabilities, enablePencilDetection, updateInterval]);

  return state;
}; 