import React from 'react';

export interface ButtonProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    [key: string]: any;
}

export interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'flat';
    padding?: 'none' | 'sm' | 'default' | 'lg' | 'xl';
    className?: string;
    hover?: boolean;
    [key: string]: any;
}

export interface InputProps {
    label?: string;
    error?: string;
    helperText?: string;
    variant?: 'default' | 'filled' | 'outlined';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    wrapperClassName?: string;
    [key: string]: any;
}

export interface PanelLayoutProps {
    leftPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    direction?: 'horizontal' | 'vertical';
    leftSize?: 'sm' | 'default' | 'lg';
    rightSize?: 'sm' | 'default' | 'lg';
    resizable?: boolean;
    className?: string;
    leftClassName?: string;
    rightClassName?: string;
    [key: string]: any;
}

export interface SidebarNavProps {
    children: React.ReactNode;
    collapsed?: boolean;
    onToggle?: () => void;
    className?: string;
    width?: 'sm' | 'default' | 'lg';
    [key: string]: any;
}

declare const Button: React.FC<ButtonProps>;
declare const Card: React.FC<CardProps> & {
    Header: React.FC<{ children: React.ReactNode; className?: string;[key: string]: any }>;
    Title: React.FC<{ children: React.ReactNode; className?: string;[key: string]: any }>;
    Content: React.FC<{ children: React.ReactNode; className?: string;[key: string]: any }>;
    Footer: React.FC<{ children: React.ReactNode; className?: string;[key: string]: any }>;
};
declare const Input: React.FC<InputProps> & {
    Textarea: React.FC<InputProps & { rows?: number }>;
};
declare const PanelLayout: React.FC<PanelLayoutProps> & {
    Panel: React.FC<{ children: React.ReactNode; className?: string; padding?: string; scrollable?: boolean;[key: string]: any }>;
    Header: React.FC<{ children: React.ReactNode; className?: string;[key: string]: any }>;
    Content: React.FC<{ children: React.ReactNode; className?: string; scrollable?: boolean;[key: string]: any }>;
    Footer: React.FC<{ children: React.ReactNode; className?: string;[key: string]: any }>;
};
declare const SidebarNav: React.FC<SidebarNavProps>;

export { Button, Card, Input, PanelLayout, SidebarNav }; 