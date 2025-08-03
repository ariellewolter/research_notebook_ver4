import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { KeyboardCommandKey } from '@mui/icons-material';

interface CommandButtonProps {
    onClick: () => void;
    variant?: 'floating' | 'toolbar' | 'minimal';
    size?: 'small' | 'medium' | 'large';
}

const CommandButton: React.FC<CommandButtonProps> = ({
    onClick,
    variant = 'floating',
    size = 'medium'
}) => {
    const buttonStyles = {
        floating: {
            position: 'fixed' as const,
            top: 24,
            left: 24,
            zIndex: 1300,
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: '0 12px 20px rgba(0,0,0,0.2)',
                transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
        },
        toolbar: {
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            '&:hover': {
                bgcolor: 'action.hover',
            }
        },
        minimal: {
            color: 'text.secondary',
            '&:hover': {
                color: 'primary.main',
                bgcolor: 'action.hover',
            }
        }
    };

    const iconSizes = {
        small: 18,
        medium: 24,
        large: 32
    };

    return (
        <Tooltip
            title="Open Command Palette (⌘K)"
            placement={variant === 'floating' ? 'right' : 'bottom'}
        >
            <IconButton
                onClick={onClick}
                size={size}
                sx={buttonStyles[variant]}
            >
                <KeyboardCommandKey sx={{ fontSize: iconSizes[size] }} />
            </IconButton>
        </Tooltip>
    );
};

export default CommandButton; 