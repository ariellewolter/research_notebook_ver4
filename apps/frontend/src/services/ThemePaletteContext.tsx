import React, { createContext, useContext, useState, useEffect } from 'react';
import { colorPalettes, Palette, PaletteRole } from './colorPalettes';

interface ThemePaletteContextType {
    paletteName: string;
    palette: Palette;
    setPaletteName: (name: string) => void;
    setCustomPalette?: (palette: Palette) => void;
}

const ThemePaletteContext = createContext<ThemePaletteContextType | undefined>(undefined);

const CUSTOM_PALETTE_KEY = 'Custom';

const getInitialPaletteName = (): string => {
    const saved = localStorage.getItem('calendarPalette');
    if (saved && (saved === CUSTOM_PALETTE_KEY || colorPalettes[saved])) return saved;
    return Object.keys(colorPalettes)[0];
};

const getInitialCustomPalette = (): Palette => {
    const saved = localStorage.getItem('customPalette');
    if (saved) return JSON.parse(saved);
    // Default custom palette
    return {
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#fafafa',
        paper: '#ffffff',
        text: '#22223B',
        error: '#FF6F61',
        success: '#06D6A0',
        warning: '#FFD166',
        info: '#118AB2',
        divider: '#E0E0E0',
    };
};

export const ThemePaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [paletteName, setPaletteNameState] = useState<string>(getInitialPaletteName());
    const [customPalette, setCustomPaletteState] = useState<Palette>(getInitialCustomPalette());

    useEffect(() => {
        localStorage.setItem('calendarPalette', paletteName);
    }, [paletteName]);

    useEffect(() => {
        localStorage.setItem('customPalette', JSON.stringify(customPalette));
    }, [customPalette]);

    const setPaletteName = (name: string) => {
        setPaletteNameState(name);
    };

    const setCustomPalette = (palette: Palette) => {
        setCustomPaletteState(palette);
        setPaletteNameState(CUSTOM_PALETTE_KEY);
    };

    const palette = paletteName === CUSTOM_PALETTE_KEY ? customPalette : colorPalettes[paletteName] || getInitialCustomPalette();

    return (
        <ThemePaletteContext.Provider value={{ paletteName, palette, setPaletteName, setCustomPalette }}>
            {children}
        </ThemePaletteContext.Provider>
    );
};

export const useThemePalette = () => {
    const ctx = useContext(ThemePaletteContext);
    if (!ctx) throw new Error('useThemePalette must be used within ThemePaletteProvider');
    return ctx;
}; 