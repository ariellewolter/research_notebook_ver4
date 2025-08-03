import React, { useState } from 'react';

const SidebarNav = ({
    children,
    collapsed = false,
    onToggle,
    className = '',
    width = 'default', // 'sm' | 'default' | 'lg'
    ...props
}) => {
    const widths = {
        sm: 'w-48',
        default: 'w-64',
        lg: 'w-80'
    };

    const collapsedWidth = 'w-16';
    const currentWidth = collapsed ? collapsedWidth : widths[width];

    return (
        <nav
            className={`h-full bg-white border-r border-gray-200 transition-all duration-200 ease-in-out ${currentWidth} ${className}`}
            {...props}
        >
            {children}
        </nav>
    );
};

// Navigation List Component
const NavList = ({
    children,
    className = '',
    ...props
}) => (
    <ul className={`space-y-1 p-2 ${className}`} {...props}>
        {children}
    </ul>
);

// Navigation Item Component
const NavItem = ({
    children,
    active = false,
    disabled = false,
    onClick,
    className = '',
    ...props
}) => {
    const baseStyles = 'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out';
    const activeStyles = active
        ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';
    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    const classes = `${baseStyles} ${activeStyles} ${disabledStyles} ${className}`;

    return (
        <li>
            <div
                className={classes}
                onClick={disabled ? undefined : onClick}
                {...props}
            >
                {children}
            </div>
        </li>
    );
};

// Navigation Icon Component
const NavIcon = ({
    icon: Icon,
    className = '',
    ...props
}) => (
    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${className}`} {...props} />
);

// Navigation Text Component
const NavText = ({
    children,
    collapsed = false,
    className = '',
    ...props
}) => (
    <span
        className={`${collapsed ? 'hidden' : 'block'} transition-all duration-200 ${className}`}
        {...props}
    >
        {children}
    </span>
);

// Navigation Badge Component
const NavBadge = ({
    children,
    variant = 'default',
    className = '',
    ...props
}) => {
    const variants = {
        default: 'bg-gray-100 text-gray-800',
        primary: 'bg-blue-100 text-blue-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        danger: 'bg-red-100 text-red-800'
    };

    const classes = `ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`;

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
};

// Navigation Section Component (for grouping items)
const NavSection = ({
    title,
    children,
    collapsed = false,
    className = '',
    ...props
}) => (
    <div className={`py-2 ${className}`} {...props}>
        {title && !collapsed && (
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {title}
            </h3>
        )}
        <NavList>
            {children}
        </NavList>
    </div>
);

// Navigation Divider Component
const NavDivider = ({ className = '', ...props }) => (
    <div className={`border-t border-gray-200 my-2 ${className}`} {...props} />
);

// Navigation Header Component
const NavHeader = ({
    children,
    collapsed = false,
    className = '',
    ...props
}) => (
    <div className={`p-4 border-b border-gray-200 ${className}`} {...props}>
        {children}
    </div>
);

// Navigation Footer Component
const NavFooter = ({
    children,
    className = '',
    ...props
}) => (
    <div className={`mt-auto p-4 border-t border-gray-200 ${className}`} {...props}>
        {children}
    </div>
);

// Attach sub-components
SidebarNav.List = NavList;
SidebarNav.Item = NavItem;
SidebarNav.Icon = NavIcon;
SidebarNav.Text = NavText;
SidebarNav.Badge = NavBadge;
SidebarNav.Section = NavSection;
SidebarNav.Divider = NavDivider;
SidebarNav.Header = NavHeader;
SidebarNav.Footer = NavFooter;

export default SidebarNav;