import React from 'react';
import { Box } from '@mui/material';

interface CanvasGridProps {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  isVisible: boolean;
  gridSize?: number;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  width,
  height,
  zoom,
  pan,
  isVisible,
  gridSize = 20,
}) => {
  if (!isVisible) return null;

  // Calculate grid spacing based on zoom level
  const adjustedGridSize = gridSize * zoom;
  const gridOpacity = Math.max(0.1, Math.min(0.3, 0.3 / zoom));

  // Create grid pattern
  const gridPattern = `
    <svg width="${adjustedGridSize}" height="${adjustedGridSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="${adjustedGridSize}" height="${adjustedGridSize}" patternUnits="userSpaceOnUse">
          <path d="M ${adjustedGridSize} 0 L 0 0 0 ${adjustedGridSize}" fill="none" stroke="#e0e0e0" stroke-width="1" opacity="${gridOpacity}"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  `;

  const gridDataUrl = `data:image/svg+xml;base64,${btoa(gridPattern)}`;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: width,
        height: height,
        backgroundImage: `url("${gridDataUrl}")`,
        backgroundSize: `${adjustedGridSize}px ${adjustedGridSize}px`,
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
}; 