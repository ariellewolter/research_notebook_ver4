import React from 'react';

const Input = ({
    label,
    error,
    helperText,
    variant = 'default',
    size = 'md',
    className = '',
    wrapperClassName = '',
    ...props
}) => {
    const baseStyles = 'block w-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        default: 'border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500',
        filled: 'border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white',
        outlined: 'border-2 border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500'
    };

    const sizes = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base'
    };

    const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${errorStyles} ${className}`;

    return (
        <div className={`${wrapperClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                className={classes}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};

// Textarea variant
const Textarea = ({
    label,
    error,
    helperText,
    variant = 'default',
    size = 'md',
    className = '',
    wrapperClassName = '',
    rows = 4,
    ...props
}) => {
    const baseStyles = 'block w-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed resize-none';

    const variants = {
        default: 'border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500',
        filled: 'border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white',
        outlined: 'border-2 border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500'
    };

    const sizes = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base'
    };

    const errorStyles = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${errorStyles} ${className}`;

    return (
        <div className={`${wrapperClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <textarea
                className={classes}
                rows={rows}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};

Input.Textarea = Textarea;

export default Input;