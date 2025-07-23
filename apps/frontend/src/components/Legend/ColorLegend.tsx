import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useThemePalette } from '../../services/ThemePaletteContext';
import { NOTE_TYPE_TO_PALETTE_ROLE, PaletteRole } from '../../services/colorPalettes';

interface ColorLegendProps {
    types: string[];
    labelMap?: Record<string, string>; // Optional: pretty labels
}

const ColorLegend: React.FC<ColorLegendProps> = ({ types, labelMap }) => {
    const { palette } = useThemePalette();

    return (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            {types.map(type => {
                const role = NOTE_TYPE_TO_PALETTE_ROLE[type] as PaletteRole;
                const color = palette[role] || palette.primary;
                return (
                    <Box key={type} display="flex" alignItems="center">
                        <Box
                            sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: color,
                                border: '1px solid #ccc',
                                mr: 1,
                            }}
                        />
                        <Typography variant="body2">
                            {labelMap?.[type] || type.charAt(0).toUpperCase() + type.slice(1)}
                        </Typography>
                    </Box>
                );
            })}
        </Stack>
    );
};

export default ColorLegend; 