import React, { useState } from 'react';

const PanelLayout = ({
    leftPanel,
    rightPanel,
    direction = 'horizontal', // 'horizontal' | 'vertical'
    leftSize = 'default', // 'sm' | 'default' | 'lg'
    rightSize = 'default',
    resizable = false,
    className = '',
    leftClassName = '',
    rightClassName = '',
    ...props
}) => {
    const [leftWidth, setLeftWidth] = useState(50); // For resizable panels

    // Size mappings for different panel sizes
    const horizontalSizes = {
        sm: 'w-1/4',
        default: 'w-1/2',
        lg: 'w-3/4'
    };

    const verticalSizes = {
        sm: 'h-1/4',
        default: 'h-1/2',
        lg: 'h-3/4'
    };

    const isHorizontal = direction === 'horizontal';
    const baseClasses = isHorizontal ? 'flex flex-row h-full' : 'flex flex-col w-full';
    const leftClasses = isHorizontal
        ? `${horizontalSizes[leftSize]} border-r border-gray-200`
        : `${verticalSizes[leftSize]} border-b border-gray-200`;
    const rightClasses = isHorizontal
        ? `${horizontalSizes[rightSize]}`
        : `${verticalSizes[rightSize]}`;

    if (resizable) {
        return (
            <div className={`${baseClasses} ${className}`} {...props}>
                <div
                    className={`${isHorizontal ? 'h-full' : 'w-full'} ${leftClassName}`}
                    style={isHorizontal ? { width: `${leftWidth}%` } : { height: `${leftWidth}%` }}
                >
                    {leftPanel}
                </div>

                {/* Resizer handle */}
                <div className={`${isHorizontal ? 'w-1 cursor-col-resize bg-gray-200 hover:bg-gray-300' : 'h-1 cursor-row-resize bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`} />

                <div
                    className={`${isHorizontal ? 'h-full flex-1' : 'w-full flex-1'} ${rightClassName}`}
                >
                    {rightPanel}
                </div>
            </div>
        );
    }

    return (
        <div className={`${baseClasses} ${className}`} {...props}>
            <div className={`${leftClasses} ${leftClassName}`}>
                {leftPanel}
            </div>
            <div className={`${rightClasses} ${rightClassName}`}>
                {rightPanel}
            </div>
        </div>
    );
};

// Sub-components for better composition
const Panel = ({
    children,
    className = '',
    padding = 'default',
    scrollable = false,
    ...props
}) => {
    const paddings = {
        none: '',
        sm: 'p-2',
        default: 'p-4',
        lg: 'p-6'
    };

    const scrollStyles = scrollable ? 'overflow-auto' : 'overflow-hidden';

    return (
        <div className={`h-full w-full ${paddings[padding]} ${scrollStyles} ${className}`} {...props}>
            {children}
        </div>
    );
};

const PanelHeader = ({
    children,
    className = '',
    ...props
}) => (
    <div className={`border-b border-gray-200 pb-3 mb-4 ${className}`} {...props}>
        {children}
    </div>
);

const PanelContent = ({
    children,
    className = '',
    scrollable = true,
    ...props
}) => {
    const scrollStyles = scrollable ? 'overflow-auto flex-1' : 'overflow-hidden flex-1';

    return (
        <div className={`${scrollStyles} ${className}`} {...props}>
            {children}
        </div>
    );
};

const PanelFooter = ({
    children,
    className = '',
    ...props
}) => (
    <div className={`border-t border-gray-200 pt-3 mt-4 ${className}`} {...props}>
        {children}
    </div>
);

PanelLayout.Panel = Panel;
PanelLayout.Header = PanelHeader;
PanelLayout.Content = PanelContent;
PanelLayout.Footer = PanelFooter;

export default PanelLayout;