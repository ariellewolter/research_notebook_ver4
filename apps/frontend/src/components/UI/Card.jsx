import React from 'react';

const Card = ({
    children,
    variant = 'default',
    padding = 'default',
    className = '',
    hover = false,
    ...props
}) => {
    const baseStyles = 'card bg-white rounded-lg shadow transition-all duration-200 ease-in-out';

    const variants = {
        default: 'border border-gray-200',
        elevated: 'shadow-lg border-0',
        outlined: 'border-2 border-gray-300 shadow-none',
        flat: 'shadow-none border border-gray-100'
    };

    const paddings = {
        none: '',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
    };

    const hoverStyles = hover ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '';

    const classes = `${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`;

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};

// Card sub-components for better structure
const CardHeader = ({ children, className = '', ...props }) => (
    <div className={`border-b border-gray-200 pb-3 mb-4 ${className}`} {...props}>
        {children}
    </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
        {children}
    </h3>
);

const CardContent = ({ children, className = '', ...props }) => (
    <div className={`${className}`} {...props}>
        {children}
    </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
    <div className={`border-t border-gray-200 pt-3 mt-4 ${className}`} {...props}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;