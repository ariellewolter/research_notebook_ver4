import { useState, useCallback, ChangeEvent } from 'react';

interface UseFormOptions<T> {
    initialValues: T;
    onSubmit: (values: T) => Promise<void> | void;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormReturn<T> {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    loading: boolean;
    handleChange: (field: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    setValue: (field: keyof T, value: any) => void;
    setValues: (values: Partial<T>) => void;
    reset: () => void;
    clearErrors: () => void;
}

export function useForm<T extends Record<string, any>>({
    initialValues,
    onSubmit,
    validate,
}: UseFormOptions<T>): UseFormReturn<T> {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [loading, setLoading] = useState(false);

    const handleChange = useCallback((field: keyof T) => {
        return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            setValues(prev => ({ ...prev, [field]: value }));
            
            // Clear error for this field when user starts typing
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: undefined }));
            }
        };
    }, [errors]);

    const setValue = useCallback((field: keyof T, value: any) => {
        setValues(prev => ({ ...prev, [field]: value }));
    }, []);

    const setValuesPartial = useCallback((newValues: Partial<T>) => {
        setValues(prev => ({ ...prev, ...newValues }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate form
        if (validate) {
            const validationErrors = validate(values);
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }
        }

        try {
            setLoading(true);
            setErrors({});
            await onSubmit(values);
        } catch (error: any) {
            // Handle submission errors
            if (error.message) {
                setErrors({ submit: error.message } as any);
            }
        } finally {
            setLoading(false);
        }
    }, [values, validate, onSubmit]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
    }, [initialValues]);

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    return {
        values,
        errors,
        loading,
        handleChange,
        handleSubmit,
        setValue,
        setValues: setValuesPartial,
        reset,
        clearErrors,
    };
} 